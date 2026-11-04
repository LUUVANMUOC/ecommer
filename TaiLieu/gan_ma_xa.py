#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
gan_ma_xa.py - Gắn mã xã thật (xa_ma trong bảng xaphuong) vào từng dòng link trong CSV.

Ghép theo: tên tỉnh (bỏ "Thành phố/Tỉnh") + tên xã (bỏ "Xã/Phường/Đặc khu/Thị trấn").
Chuẩn hóa Unicode NFC trước khi so sánh để tránh lỗi dấu tiếng Việt.

Dùng:
  python gan_ma_xa.py --sql backup_2_bang.sql --csv link_xa_o_to.csv
  python gan_ma_xa.py --sql backup_2_bang.sql --csv link_xa_o_to.csv --out ket_qua.csv --sql-out capnhat.sql

Kết quả:
  - CSV mới có thêm cột đầu tiên "xa_ma" (mã thật từ DB) và tên tỉnh/xã theo DB.
  - Dòng không ghép được (hoặc trùng nhiều mã) được ghi vào file *_khong_khop.csv.
  - Tùy chọn --sql-out: sinh file UPDATE xaphuong.xa_gps (chỉ với các xã đã có link).
"""
import argparse
import csv
import re
import sys
import unicodedata
from collections import defaultdict
from pathlib import Path

PREFIXES_XA = ("xã ", "phường ", "đặc khu ", "thị trấn ")
PREFIXES_TINH = ("thành phố ", "tỉnh ", "tp. ", "tp ")


def nfc(s):
    return unicodedata.normalize("NFC", s) if isinstance(s, str) else s


def strip_prefix(s, prefixes):
    s = nfc(s or "").strip()
    low = s.lower()
    for p in prefixes:
        if low.startswith(p):
            return s[len(p):].strip()
    return s


def key_tinh(s):
    return strip_prefix(s, PREFIXES_TINH).lower()


def key_xa(s):
    return strip_prefix(s, PREFIXES_XA).lower()


def parse_copy(path, table):
    """Đọc khối `COPY public.<table> (...) FROM stdin;` trong file pg_dump -> list dict."""
    cols, rows, on = None, [], False
    with open(path, encoding="utf-8-sig") as f:
        for line in f:
            line = nfc(line.rstrip("\n"))
            if not on:
                m = re.match(r"COPY public\.%s \((.*?)\) FROM stdin;" % table, line)
                if m:
                    cols = [c.strip() for c in m.group(1).split(",")]
                    on = True
                continue
            if line == "\\.":
                break
            vals = [None if v == "\\N" else v for v in line.split("\t")]
            rows.append(dict(zip(cols, vals)))
    return rows


def build_index(sql_path):
    tinh = parse_copy(sql_path, "tinhtp")
    xa = parse_copy(sql_path, "xaphuong")
    if not xa or not tinh:
        sys.exit("Không đọc được bảng tinhtp / xaphuong trong file SQL.")
    ten_tinh = {t["tinh_ma"]: t["tinh_ten"] for t in tinh}
    index = defaultdict(list)
    for x in xa:
        k = (key_tinh(ten_tinh.get(x["tinh_ma"], "")), key_xa(x["xa_ten"]))
        index[k].append(x)
    return index, ten_tinh


def main():
    ap = argparse.ArgumentParser(description="Gắn xa_ma thật vào CSV link xã")
    ap.add_argument("--sql", required=True, help="File dump PostgreSQL có bảng tinhtp, xaphuong")
    ap.add_argument("--csv", required=True, help="CSV kết quả từ tao_link / lay_link_xa_o_to")
    ap.add_argument("--out", default="link_xa_co_ma.csv", help="CSV đầu ra (có cột xa_ma)")
    ap.add_argument("--sql-out", help="Tùy chọn: file UPDATE xaphuong.xa_gps")
    args = ap.parse_args()

    index, _ = build_index(args.sql)
    with open(args.csv, encoding="utf-8-sig", newline="") as f:
        reader = csv.DictReader(f)
        src_rows = [{k: nfc(v) for k, v in r.items()} for r in reader]

    out_rows, bad_rows = [], []
    used = defaultdict(int)
    for r in src_rows:
        cands = index.get((key_tinh(r.get("Tỉnh/Thành", "")), key_xa(r.get("Xã/Phường", ""))), [])
        if len(cands) == 1:
            x = cands[0]
            used[x["xa_ma"]] += 1
            out_rows.append((x["xa_ma"], r))
        else:
            ly_do = "không tìm thấy trong DB" if not cands else "trùng %d mã trong DB" % len(cands)
            bad_rows.append((ly_do, r))

    dup_ma = [m for m, c in used.items() if c > 1]
    if dup_ma:
        print("Cảnh báo: có %d mã xã bị gắn cho nhiều dòng CSV" % len(dup_ma))

    out_path = Path(args.out)
    headers = ["xa_ma"] + [h for h in src_rows[0].keys()] if src_rows else ["xa_ma"]
    with open(out_path, "w", encoding="utf-8-sig", newline="") as f:
        w = csv.writer(f)
        w.writerow(headers)
        for ma, r in out_rows:
            w.writerow([ma] + [r.get(h, "") for h in headers[1:]])
    print("Đã ghi %s: %d dòng có mã xã" % (out_path, len(out_rows)))

    if bad_rows:
        bad_path = out_path.with_name(out_path.stem + "_khong_khop.csv")
        with open(bad_path, "w", encoding="utf-8-sig", newline="") as f:
            w = csv.writer(f)
            w.writerow(["Lý do"] + list(src_rows[0].keys()))
            for ly_do, r in bad_rows:
                w.writerow([ly_do] + [r.get(h, "") for h in src_rows[0].keys()])
        print("Có %d dòng không ghép được, xem %s" % (len(bad_rows), bad_path))

    if args.sql_out:
        n = 0
        with open(args.sql_out, "w", encoding="utf-8") as f:
            f.write("BEGIN;\n")
            for ma, r in out_rows:
                link = (r.get("Link chỉ đường ô tô") or "").strip()
                if not link:
                    continue
                f.write("UPDATE public.xaphuong SET xa_gps = '%s' WHERE xa_ma = '%s';\n"
                        % (link.replace("'", "''"), ma.replace("'", "''")))
                n += 1
            f.write("COMMIT;\n")
        print("Đã ghi %s (%d câu UPDATE)" % (args.sql_out, n))


if __name__ == "__main__":
    main()