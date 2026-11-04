#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
lay_link_xa_o_to.py - MỖI MÃ XÃ 1 LINK GOOGLE MAPS tới vị trí ô tô đi tới được.
Không phân loại QL/ĐT/ĐH, chỉ cần điểm nằm trên đường ô tô đi được.

Nguồn dữ liệu giống tao_link_xa.py:
  --sql    file dump PostgreSQL có bảng tinhtp, xaphuong (khuyến nghị)
  --input  CSV có cột tinh,xa (và tùy chọn ma)
  (không truyền gì) tải từ provinces.open-api.vn

Cách làm:
  1. Lấy tọa độ tâm xã (Nominatim miễn phí, hoặc Google Geocoding nếu có key).
  2. OSRM /nearest profile "driving" đẩy điểm đó về đường ô tô gần nhất (1 request).
  3. In link ra console ngay, đồng thời ghi CSV. Dừng và chạy lại thì tự bỏ qua mã đã xong.

Cài đặt: pip install requests
Chạy thử: python lay_link_xa_o_to.py --sql sanTMDT.sql --tinh-ma 92 --limit 5
Chạy đủ:  python lay_link_xa_o_to.py --sql sanTMDT.sql
Có Google key (nhanh hơn nhiều): đặt biến môi trường GOOGLE_API_KEY rồi chạy như trên.

Nhớ sửa UA bên dưới thành email của bạn (Nominatim yêu cầu).
"""
import argparse
import csv
import math
import os
import re
import sys
import threading
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

import requests

UA = "xa-link-o-to/1.0 (thay bang email cua ban)"
NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
PROVINCES_API = "https://provinces.open-api.vn/api/v2/?depth=2"
OSRM_NEAREST = "https://router.project-osrm.org/nearest/v1/driving/{lon},{lat}"
GOOGLE_GEOCODE_URL = "https://maps.googleapis.com/maps/api/geocode/json"

MAX_KM_FROM_PROVINCE = 300   # tọa độ cách tâm tỉnh quá số km này thì bỏ (tránh trùng tên xã ở tỉnh khác)
HDR = ["Mã xã", "Tỉnh/Thành", "Xã/Phường", "Vĩ độ", "Kinh độ", "Cách tâm xã (m)", "Link chỉ đường ô tô", "Ghi chú"]


# ----------------------------------------------------------------------------
# Tiện ích
# ----------------------------------------------------------------------------
def haversine(lat1, lon1, lat2, lon2):
    r = 6371000.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dphi = p2 - p1
    dl = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * r * math.asin(math.sqrt(a))


class RateLimiter:
    """Đảm bảo các thread gọi cách nhau tối thiểu `interval` giây (dùng chung giữa các thread)."""

    def __init__(self, interval):
        self.interval = interval
        self.lock = threading.Lock()
        self.next_t = 0.0

    def wait(self):
        if self.interval <= 0:
            return
        with self.lock:
            now = time.monotonic()
            t = max(now, self.next_t)
            self.next_t = t + self.interval
        time.sleep(max(0, t - now))


def driving_link(lat, lon):
    return "https://www.google.com/maps/dir/?api=1&destination=%.6f,%.6f&travelmode=driving" % (lat, lon)


def is_island(xa):
    return xa.lower().startswith("đặc khu")


# ----------------------------------------------------------------------------
# Đọc danh sách xã (giống tao_link_xa.py)
# ----------------------------------------------------------------------------
def parse_copy_blocks(path):
    """Đọc các khối `COPY public.<bảng> (...) FROM stdin;` trong file pg_dump -> {bảng: [dict]}."""
    tables, cur, cols = {}, None, []
    with open(path, encoding="utf-8-sig") as f:
        for line in f:
            line = line.rstrip("\n")
            if cur is None:
                m = re.match(r"COPY (?:public\.)?(\w+) \((.*?)\) FROM stdin;", line)
                if m:
                    cur = m.group(1)
                    cols = [c.strip() for c in m.group(2).split(",")]
                    tables[cur] = []
                continue
            if line == "\\.":
                cur = None
                continue
            vals = [None if v == "\\N" else v for v in line.split("\t")]
            tables[cur].append(dict(zip(cols, vals)))
    return tables


def load_wards(args):
    """Trả về list dict: {ma, tinh_ma, tinh, xa}. `ma` là khóa duy nhất của xã."""
    rows = []
    if args.sql:
        tb = parse_copy_blocks(args.sql)
        if "xaphuong" not in tb or "tinhtp" not in tb:
            sys.exit("File SQL không có dữ liệu COPY của bảng tinhtp / xaphuong.")
        ten_tinh = {t["tinh_ma"]: t["tinh_ten"] for t in tb["tinhtp"]}
        for x in tb["xaphuong"]:
            rows.append({"ma": x["xa_ma"], "tinh_ma": x["tinh_ma"],
                         "tinh": ten_tinh.get(x["tinh_ma"], ""), "xa": x["xa_ten"]})
    elif args.input:
        with open(args.input, encoding="utf-8-sig", newline="") as f:
            for r in csv.DictReader(f):
                tinh = (r.get("tinh") or r.get("tỉnh") or r.get("province") or "").strip()
                xa = (r.get("xa") or r.get("xã") or r.get("ward") or "").strip()
                if tinh and xa:
                    rows.append({"ma": (r.get("ma") or tinh + "|" + xa).strip(),
                                 "tinh_ma": "", "tinh": tinh, "xa": xa})
    else:
        print("Đang tải danh sách xã từ provinces.open-api.vn ...")
        resp = requests.get(PROVINCES_API, headers={"User-Agent": UA}, timeout=60)
        resp.raise_for_status()
        for p in resp.json():
            for w in (p.get("wards") or p.get("communes") or []):
                rows.append({"ma": p["name"] + "|" + w["name"], "tinh_ma": "",
                             "tinh": p["name"], "xa": w["name"]})
    if not rows:
        sys.exit("Không lấy được danh sách xã. Dùng --sql file_dump.sql hoặc --input file.csv (cột tinh,xa).")
    if args.tinh_ma:
        rows = [r for r in rows if r["tinh_ma"] == args.tinh_ma]
    if args.tinh:
        key = args.tinh.lower()
        rows = [r for r in rows if key in r["tinh"].lower()]
    if args.chi_xa:
        rows = [r for r in rows if r["xa"].lower().startswith("xã")]
    if args.limit:
        rows = rows[: args.limit]
    return rows


# ----------------------------------------------------------------------------
# Tọa độ tâm xã
# ----------------------------------------------------------------------------
def short_name(xa):
    for prefix in ("Xã ", "Phường ", "Đặc khu ", "Thị trấn "):
        if xa.lower().startswith(prefix.lower()):
            return xa[len(prefix):].strip()
    return xa


def name_variants(xa):
    """Các cách viết tên để thử geocode (tên mới có thể kèm số, vd '2 Bảo Lộc')."""
    s = short_name(xa)
    t = re.sub(r"^\d+\s+|\s+\d+$", "", s)
    out = [xa, s, t]
    if " - " in t:
        out += [p.strip() for p in t.split(" - ")]
    seen, res = set(), []
    for v in out:
        if v and v not in seen:
            seen.add(v)
            res.append(v)
    return res[:4]


def geocode_google(session, key, text):
    try:
        r = session.get(GOOGLE_GEOCODE_URL, params={
            "address": text, "region": "vn", "language": "vi",
            "components": "country:VN", "key": key}, timeout=30)
        j = r.json()
        if j.get("status") == "OK":
            return [(x["geometry"]["location"]["lat"], x["geometry"]["location"]["lng"])
                    for x in j["results"][:3]]
    except Exception:  # noqa
        pass
    return []


def geocode_nominatim(session, text, lim, limit=5):
    lim.wait()  # Nominatim: tối đa 1 request/giây
    try:
        r = session.get(NOMINATIM_URL, params={
            "q": text, "format": "jsonv2", "limit": limit,
            "countrycodes": "vn", "accept-language": "vi"},
            headers={"User-Agent": UA}, timeout=30)
        return [(float(d["lat"]), float(d["lon"])) for d in r.json()]
    except Exception:  # noqa
        return []


def ward_center(session, w, pc, google_key, lim):
    """Trả về (lat, lon, nguồn) hoặc None. pc = tâm tỉnh (None với đặc khu đảo)."""
    def ok(pt):
        return pc is None or haversine(pc[0], pc[1], pt[0], pt[1]) <= MAX_KM_FROM_PROVINCE * 1000

    variants = name_variants(w["xa"])
    if google_key:
        for v in variants:
            for pt in geocode_google(session, google_key, "%s, %s, Việt Nam" % (v, w["tinh"])):
                if ok(pt):
                    return pt[0], pt[1], "Google"
    for v in variants:
        for pt in geocode_nominatim(session, "%s, %s, Việt Nam" % (v, w["tinh"]), lim):
            if ok(pt):
                return pt[0], pt[1], "Nominatim"
    return None


# ----------------------------------------------------------------------------
# Đẩy điểm về đường ô tô gần nhất
# ----------------------------------------------------------------------------
def snap_to_driving_road(session, lat, lon, lim):
    """Trả về (lat, lon, khoảng cách m) của điểm trên đường ô tô gần nhất, hoặc None."""
    lim.wait()
    try:
        j = session.get(OSRM_NEAREST.format(lat=lat, lon=lon),
                        headers={"User-Agent": UA}, timeout=30).json()
        if j.get("code") == "Ok":
            wp = j["waypoints"][0]
            lon2, lat2 = wp["location"]          # OSRM trả về [lon, lat]
            return lat2, lon2, round(wp["distance"])
    except Exception:  # noqa
        pass
    return None


# ----------------------------------------------------------------------------
# Xử lý 1 xã
# ----------------------------------------------------------------------------
def process_ward(session, w, prov_centers, google_key, lim_nom, lim_osrm):
    pc = None if is_island(w["xa"]) else prov_centers.get(w["tinh"])
    center = ward_center(session, w, pc, google_key, lim_nom)
    if not center:
        return {"ghi_chu": "Không tìm được tọa độ xã (thử sửa tên xã)"}

    snap = snap_to_driving_road(session, center[0], center[1], lim_osrm)
    if not snap:
        return {"ghi_chu": "Không tìm được đường ô tô gần tâm xã (lỗi OSRM)"}

    lat, lon, dist = snap
    note = "tâm xã lấy bằng %s" % center[2]
    if dist > 3000:
        note += "; đường ô tô gần nhất cách tâm xã %d m, nên kiểm tra lại" % dist
    return {"lat": lat, "lon": lon, "kc_m": dist, "ghi_chu": note}


# ----------------------------------------------------------------------------
# Ghi kết quả và tiếp tục từ chỗ dở
# ----------------------------------------------------------------------------
def load_done(path):
    done = set()
    if path.exists():
        with open(path, encoding="utf-8-sig", newline="") as f:
            for r in csv.DictReader(f):
                if r.get("Link chỉ đường ô tô"):
                    done.add(r["Mã xã"])
    return done


def csv_row(w, r):
    """Một dòng CSV từ thông tin xã và kết quả xử lý."""
    if "lat" in r:
        link = driving_link(r["lat"], r["lon"])
        lat_s, lon_s = "%.6f" % r["lat"], "%.6f" % r["lon"]
    else:
        link, lat_s, lon_s = "", "", ""
    return [w["ma"], w["tinh"], w["xa"], lat_s, lon_s, r.get("kc_m", ""), link, r.get("ghi_chu", "")]


def main():
    ap = argparse.ArgumentParser(description="Mỗi mã xã 1 link Google Maps ô tô tới được")
    ap.add_argument("--sql", help="File dump PostgreSQL có bảng tinhtp, xaphuong (khuyến nghị)")
    ap.add_argument("--input", help="CSV có cột: tinh,xa (tùy chọn thêm cột ma)")
    ap.add_argument("--tinh-ma", help="Chỉ chạy 1 tỉnh theo tinh_ma, vd 92")
    ap.add_argument("--tinh", help="Chỉ chạy các tỉnh có tên chứa chuỗi này")
    ap.add_argument("--chi-xa", action="store_true", help="Chỉ lấy đơn vị tên bắt đầu bằng 'Xã'")
    ap.add_argument("--limit", type=int, default=0, help="Chỉ chạy N xã đầu tiên (chạy thử)")
    ap.add_argument("--out", default="link_xa_o_to.csv", help="File CSV kết quả")
    ap.add_argument("--google-key", default=os.environ.get("GOOGLE_API_KEY"),
                    help="Google API key (không bắt buộc, có thì nhanh hơn nhiều)")
    ap.add_argument("--workers", type=int, default=0, help="Số luồng song song (0 = tự chọn)")
    args = ap.parse_args()

    rows = load_wards(args)
    out_path = Path(args.out)
    done = load_done(out_path)
    todo = [w for w in rows if w["ma"] not in done]
    print("Tổng số xã: %d | đã làm trước đó: %d | cần làm: %d" % (len(rows), len(done), len(todo)))
    if not todo:
        return

    session = requests.Session()
    workers = args.workers or (8 if args.google_key else 4)
    # Nominatim: 1 request/giây. OSRM demo: giới hạn nhẹ để không bị chặn.
    lim_nom = RateLimiter(0 if args.google_key else 1.1)
    lim_osrm = RateLimiter(0.1)

    # Tâm tỉnh, tính 1 lần cho mỗi tỉnh
    prov_centers = {}
    for tinh in sorted({w["tinh"] for w in todo}):
        pts = geocode_nominatim(session, "%s, Việt Nam" % tinh, lim_nom, limit=1)
        prov_centers[tinh] = pts[0] if pts else None

    new_file = not out_path.exists() or out_path.stat().st_size == 0
    f = open(out_path, "a", encoding="utf-8-sig", newline="")
    writer = csv.writer(f)
    if new_file:
        writer.writerow(HDR)
    write_lock = threading.Lock()

    def job(w):
        return w, process_ward(session, w, prov_centers, args.google_key, lim_nom, lim_osrm)

    try:
        with ThreadPoolExecutor(max_workers=workers) as ex:
            futures = [ex.submit(job, w) for w in todo]
            for i, fut in enumerate(as_completed(futures), 1):
                w, r = fut.result()
                row = csv_row(w, r)
                with write_lock:
                    writer.writerow(row)
                    f.flush()
                link = row[6]
                print("[%d/%d] %s | %s - %s\n    %s" % (
                    i, len(todo), w["ma"], w["tinh"], w["xa"],
                    link if link else "(không có link) " + r.get("ghi_chu", "")),
                    flush=True)
    except KeyboardInterrupt:
        print("\nĐã dừng. Chạy lại lệnh cũ để tiếp tục từ chỗ dở.")
    finally:
        f.close()
    print("Đã ghi kết quả vào", out_path)


if __name__ == "__main__":
    main()