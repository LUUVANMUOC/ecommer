#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
lay_du_lieu_topzone.py - Lấy hàng loạt sản phẩm từ https://www.topzone.vn (iPhone, iPad, Mac, Watch, AirPods...)

Mỗi sản phẩm -> 1 thư mục: info.json + ảnh (01.jpg, 02.jpg, ...) (+ page.html nếu --save-html),
kèm bảng tóm tắt products_topzone.csv. Cùng cấu trúc đầu ra với lay_du_lieu_shopvnb.py.

Cài đặt:    pip install requests beautifulsoup4 lxml

BƯỚC 1 - KIỂM TRA (không tải ảnh, không tạo thư mục):
    python lay_du_lieu_topzone.py --show-robots
    python lay_du_lieu_topzone.py --probe
    python lay_du_lieu_topzone.py --url https://www.topzone.vn/iphone/iphone-16-pro-max

BƯỚC 2 - TẢI THẬT:
    python lay_du_lieu_topzone.py --url <url sản phẩm> --save
    python lay_du_lieu_topzone.py --category iphone --limit 5
    python lay_du_lieu_topzone.py                       (toàn bộ danh mục mặc định)

Tùy chọn:
    --category <slug> ...  danh mục cấp 1 (phần đầu đường dẫn: iphone, ipad, mac, apple-watch...)
    --url <url>            1 trang sản phẩm: mặc định chỉ in; thêm --save để tải về
    --save                 dùng cùng --url: lưu info.json + ảnh
    --limit N              chỉ lấy N sản phẩm MỚI
    --max-pages N          số trang tối đa khi quét danh mục bằng ?page=N (mặc định 30)
    --more-url TEMPLATE    URL "Xem thêm" (AJAX) copy từ DevTools -> Network, chỗ số trang thay bằng {page}
    --no-sitemap           không dùng sitemap.xml (mặc định có dùng)
    --no-related           không đi theo link sản phẩm liên quan
    --no-images            không tải ảnh
    --save-html            lưu thêm page.html (để debug)
    --force                tải lại cả sản phẩm đã có
    --dump <url>           lưu HTML của 1 trang vào debug_page.html (để chỉnh script)
    --out <thư mục>        mặc định ./products_topzone

Nếu bị chặn (HTTP 403): đặt biến môi trường TOPZONE_COOKIE = header Cookie copy từ Chrome.
Nếu trang chỉ có nội dung sau khi chạy JavaScript (--probe báo không đọc được tên/giá), cần Playwright.

Script kiểm tra robots.txt, nghỉ ngẫu nhiên giữa các lần tải, bỏ qua sản phẩm đã có, ghi CSV định kỳ
và khi bấm Ctrl+C (chạy lại sẽ tiếp tục). Ảnh/mô tả thuộc bản quyền Topzone: chỉ dùng học tập/thử nghiệm.
"""
import argparse
import csv
import json
import os
import random
import re
import sys
import time
from collections import deque
from urllib.parse import urljoin, urlparse
from urllib.robotparser import RobotFileParser

import requests
from bs4 import BeautifulSoup

sys.stdout.reconfigure(encoding="utf-8")

try:
    import lxml  # noqa: F401
    PARSER = "lxml"
except ImportError:
    PARSER = "html.parser"

BASE = "https://www.topzone.vn"
HOST = "topzone.vn"

# Danh mục cấp 1 (đoán theo menu; sai slug thì sửa bằng --category)
DEFAULT_CATEGORIES = ["iphone", "ipad", "mac", "apple-watch", "airpods", "phu-kien"]
PAGE_PATTERNS = ["?page={page}", "?p={page}", "?pageIndex={page}"]
MIN_LISTING_LINKS = 3
CSV_EVERY = 20

DELAY_RANGE = (2.0, 4.0)
IMG_DELAY_RANGE = (0.5, 1.0)
CRAWL_DELAY = (1.0, 2.0)
MAX_RETRIES = 3
TIMEOUT = 20
MAX_IMAGES = 15

HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; PriceResearchBot/1.0; contact: ban@email.com)",
    "Accept-Language": "vi-VN,vi;q=0.9",
}
if os.environ.get("TOPZONE_COOKIE"):
    HEADERS["Cookie"] = os.environ["TOPZONE_COOKIE"]

ROBOT_UA = "PriceResearchBot"

CSV_FIELDS = ["url", "sku", "name", "brand", "category", "price", "price_max", "original_price",
              "availability", "options", "image_count", "image_files", "description", "specs"]

IMAGE_EXT = (".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif")
PRICE_RE = re.compile(r"\d{1,3}(?:\.\d{3})+(?=\s*(?:₫|đ|VNĐ|VND))", re.I)
CAPACITY_RE = re.compile(r"^\s*\d+\s*(?:GB|TB)\b", re.I)
SPEC_LINE_RE = re.compile(r"^([^:：]{2,40})\s*[:：]\s*(.{1,200})$")

session = requests.Session()
session.headers.update(HEADERS)


# ----------------------------------------------------------------------------
# Mạng
# ----------------------------------------------------------------------------
def fetch(url, headers=None, quiet=False):
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            r = session.get(url, timeout=TIMEOUT, headers=headers)
            if r.status_code == 200:
                return r
            if r.status_code in (404, 410):
                return None
            if not quiet:
                extra = " (site có thể đang chặn bot; thử đặt TOPZONE_COOKIE)" if r.status_code in (403, 429, 503) else ""
                print(f"  HTTP {r.status_code} cho {url}{extra}, lần {attempt}")
        except requests.RequestException as e:
            if not quiet:
                print(f"  Lỗi mạng ({e}) cho {url}, lần {attempt}")
        time.sleep(5 * attempt)
    return None


def load_robots():
    """Đọc robots.txt bằng requests (không dùng RobotFileParser.read() vì urllib gửi User-Agent mặc định,
    site trả 403 sẽ bị hiểu nhầm thành 'cấm tất cả')."""
    url = f"{BASE}/robots.txt"
    try:
        r = session.get(url, timeout=TIMEOUT)
    except requests.RequestException as e:
        print(f"Cảnh báo: không đọc được robots.txt ({e}). Hãy tự kiểm tra {url} trong trình duyệt.")
        return None
    if r.status_code == 200:
        rp = RobotFileParser()
        rp.set_url(url)
        rp.parse(r.text.splitlines())
        return rp
    if r.status_code in (404, 410):
        return None
    print(f"Cảnh báo: robots.txt trả HTTP {r.status_code}; hãy tự kiểm tra {url} trong trình duyệt.")
    return None


def show_robots():
    url = f"{BASE}/robots.txt"
    try:
        r = session.get(url, timeout=TIMEOUT)
    except requests.RequestException as e:
        print(f"Lỗi mạng: {e}")
        return
    print(f"HTTP {r.status_code} - {url}")
    print(r.text[:6000])
    if r.status_code == 200:
        rp = RobotFileParser()
        rp.parse(r.text.splitlines())
        for path in ("/iphone", "/iphone/iphone-16-pro-max"):
            print(f"can_fetch({path}) = {rp.can_fetch(ROBOT_UA, BASE + path)}")


def allowed(rp, url):
    return True if rp is None else rp.can_fetch(ROBOT_UA, url)


# ----------------------------------------------------------------------------
# Tiện ích
# ----------------------------------------------------------------------------
def to_int(s):
    return int(re.sub(r"\D", "", str(s)))


def clean_text(s):
    lines = [re.sub(r"[ \t\xa0]+", " ", ln).strip() for ln in (s or "").split("\n")]
    return "\n".join(ln for ln in lines if ln)


def extract_links(text, categories):
    """Tìm link sản phẩm dạng /<danh-muc>/<slug> trong HTML hoặc JSON (regex nên chạy được cả khi
    link nằm trong <script>). Trả về danh sách URL đầy đủ, không trùng."""
    text = text.replace("\\/", "/")
    cats = "|".join(re.escape(c) for c in categories)
    pat = re.compile(
        r'''(?:https?://(?:www\.)?topzone\.vn)?(/(?:%s)/[a-z0-9][a-z0-9\-]*)(?=["'?#)\\\s<])''' % cats)
    out = [urljoin(BASE, m) for m in pat.findall(text)]
    return list(dict.fromkeys(out))


def product_folder(out_dir, url):
    slug = re.sub(r"[^\w-]", "_", urlparse(url).path.strip("/").replace("/", "__"))[:120]
    return os.path.join(out_dir, slug)


def same_url(a, b):
    return a.rstrip("/").split("?")[0] == b.rstrip("/").split("?")[0]


# ----------------------------------------------------------------------------
# Thu thập URL
# ----------------------------------------------------------------------------
def crawl_listing(url, max_pages, rp, state, categories, label="", first_html=None, more_url=""):
    label = label or urlparse(url).path.strip("/")
    if not allowed(rp, url):
        print(f"  robots.txt không cho phép {url}")
        return []
    if first_html is None:
        r = fetch(url)
        if r is None:
            print(f"  Không tải được {url}")
            return []
        first_html = r.text
    found = [u for u in extract_links(first_html, categories) if not same_url(u, url)]
    print(f"  {label} trang 1: {len(found)} link")
    for page in range(2, max_pages + 1):
        time.sleep(random.uniform(*CRAWL_DELAY))
        if more_url:
            candidates = [more_url.format(page=page)]
        else:
            pats = [state["pattern"]] if state.get("pattern") else PAGE_PATTERNS
            candidates = [url + p.format(page=page) for p in pats]
        got = []
        for cu in candidates:
            rr = fetch(cu, quiet=True)
            if rr is None:
                continue
            links = [u for u in extract_links(rr.text, categories) if not same_url(u, url)]
            got = [u for u in links if u not in found]
            if got:
                if not more_url:
                    state["pattern"] = cu[len(url):].replace(str(page), "{page}")
                break
        if not got:
            break
        found.extend(got)
        print(f"  {label} trang {page}: +{len(got)} link")
    return found


def sitemap_urls(rp, categories, limit_files=40):
    """Đọc sitemap (khai báo trong robots.txt hoặc /sitemap.xml), đi vào sitemap con, lọc URL đúng danh mục."""
    roots = []
    try:
        roots = list(rp.site_maps() or []) if rp is not None else []
    except AttributeError:
        pass
    roots = roots or [f"{BASE}/sitemap.xml"]
    cats = "|".join(re.escape(c) for c in categories)
    pat = re.compile(r"https?://(?:www\.)?topzone\.vn/(?:%s)/[a-z0-9][a-z0-9\-]*/?$" % cats)
    seen, out, todo = set(), [], deque(roots)
    while todo and len(seen) < limit_files:
        sm = todo.popleft()
        if sm in seen:
            continue
        seen.add(sm)
        r = fetch(sm, quiet=True)
        if r is None:
            continue
        for loc in re.findall(r"<loc>\s*([^<]+?)\s*</loc>", r.text):
            loc = loc.replace("&amp;", "&").split("?")[0]
            if loc.endswith(".xml") or ".xml" in loc.split("/")[-1]:
                todo.append(loc)
            elif pat.match(loc) and allowed(rp, loc):
                out.append(loc.rstrip("/"))
    if not out:
        print("  Không lấy được URL nào từ sitemap")
    return list(dict.fromkeys(out))


# ----------------------------------------------------------------------------
# Phân tích trang sản phẩm
# ----------------------------------------------------------------------------
def _ld_objects(soup):
    stack = []
    for s in soup.find_all("script", type="application/ld+json"):
        try:
            stack.append(json.loads(s.string or s.get_text() or ""))
        except (ValueError, TypeError):
            continue
    while stack:
        d = stack.pop()
        if isinstance(d, list):
            stack.extend(d)
        elif isinstance(d, dict):
            yield d
            if "@graph" in d:
                stack.append(d["@graph"])


def _has_type(d, name):
    t = d.get("@type")
    return name in (t if isinstance(t, list) else [t])


def _offers(ld):
    o = ld.get("offers") if ld else None
    if isinstance(o, dict):
        o = [o]
    return [x for x in (o or []) if isinstance(x, dict)]


def _num(v):
    try:
        return int(float(str(v).replace(",", "")))
    except ValueError:
        return ""


def parse_images(soup, ld):
    imgs = []
    if ld:
        im = ld.get("image")
        for x in (im if isinstance(im, list) else [im]):
            if isinstance(x, dict):
                x = x.get("url")
            if x:
                imgs.append(urljoin(BASE, x))
    for meta in soup.find_all("meta", property="og:image"):
        if meta.get("content"):
            imgs.append(urljoin(BASE, meta["content"]))
    for img in soup.find_all(["img", "source"]):
        for attr in ("data-src", "data-original", "src", "srcset", "data-srcset"):
            v = (img.get(attr) or "").split(" ")[0].split(",")[0]
            if v and "/Products/" in v:
                imgs.append(urljoin(BASE, v))
    imgs = [u for u in imgs if u.lower().split("?")[0].endswith(IMAGE_EXT)]
    # Chỉ giữ ảnh cùng mã sản phẩm với ảnh đầu tiên (tránh lẫn ảnh sản phẩm liên quan)
    if imgs:
        m = re.search(r"/Products/Images/\d+/(\d+)/", imgs[0])
        if m:
            imgs = [u for u in imgs if f"/{m.group(1)}/" in u]
    seen, out = set(), []
    for u in imgs:
        key = re.sub(r"-\d+x\d+(?=\.\w+$)", "", os.path.basename(urlparse(u).path))  # chỉ để khử trùng, không đổi URL
        if key not in seen:
            seen.add(key)
            out.append(u)
    return out[:MAX_IMAGES]


def parse_specs(soup):
    specs = {}
    for tr in soup.find_all("tr"):
        cells = tr.find_all(["td", "th"])
        if len(cells) == 2:
            k, v = cells[0].get_text(" ", strip=True).rstrip(":"), cells[1].get_text(" ", strip=True)
            if k and v and len(k) < 80:
                specs.setdefault(k, v)
    for dt in soup.find_all("dt"):
        dd = dt.find_next_sibling("dd")
        if dd:
            specs.setdefault(dt.get_text(" ", strip=True).rstrip(":"), dd.get_text(" ", strip=True))
    for li in soup.find_all("li"):
        txt = li.get_text(" ", strip=True)
        m = SPEC_LINE_RE.match(txt)
        if m and len(specs) < 80:
            specs.setdefault(m.group(1).strip(" -•"), m.group(2).strip())
    # Dạng 2 thẻ con liền nhau: <li><p>Màn hình</p><div>6.9 inch...</div></li>
    for li in soup.find_all("li"):
        kids = [c for c in li.find_all(recursive=False) if c.get_text(strip=True)]
        if len(kids) == 2:
            k, v = kids[0].get_text(" ", strip=True).rstrip(":"), kids[1].get_text(" ", strip=True)
            if 2 <= len(k) <= 40 and 1 <= len(v) <= 200 and k != v:
                specs.setdefault(k, v)
    return specs


def parse_options(soup, url, categories):
    """Dung lượng/phiên bản: các link cùng danh mục có chữ '128GB', '256GB', '1TB'... Mỗi lựa chọn thường là 1 URL."""
    values = []
    for a in soup.find_all("a", href=True):
        txt = a.get_text(" ", strip=True)
        if not CAPACITY_RE.match(txt):
            continue
        links = extract_links(a["href"], categories)
        v = {"name": txt, "url": links[0] if links else urljoin(url, a["href"]), "soldout": False}
        if v["name"] not in [x["name"] for x in values]:
            values.append(v)
    return [{"name": "Dung lượng", "values": values}] if values else []


def parse_product(html, url, categories=DEFAULT_CATEGORIES):
    """Trả về dict sản phẩm, hoặc None nếu không phải trang sản phẩm (vd trang danh sách)."""
    soup = BeautifulSoup(html, PARSER)
    text = soup.get_text(" ", strip=True)
    ld = next((d for d in _ld_objects(soup) if _has_type(d, "Product")), None)
    og_type = soup.find("meta", property="og:type")
    h1 = soup.find("h1")
    name = (ld or {}).get("name") or (h1.get_text(" ", strip=True) if h1 else "")
    og_product = bool(og_type and og_type.get("content") == "product")
    looks_product = bool(PRICE_RE.search(text)) and re.search(r"Mua ngay|Thêm vào giỏ|Đặt trước", text)
    if not name or not (ld or og_product or looks_product):
        return None

    brand = (ld or {}).get("brand")
    brand = brand.get("name", "") if isinstance(brand, dict) else (brand or "")
    sku = str((ld or {}).get("sku") or (ld or {}).get("mpn") or "")

    prices, availability = [], ""
    for o in _offers(ld):
        for k in ("price", "lowPrice", "highPrice"):
            if o.get(k) not in (None, ""):
                prices.append(_num(o[k]))
        availability = availability or str(o.get("availability", "")).rsplit("/", 1)[-1]
    prices = [p for p in prices if p]
    if not prices:  # dự phòng: giá đầu tiên trong trang
        m = PRICE_RE.search(text[text.find(name):] if name in text else text)
        if m:
            prices = [to_int(m.group(0))]
    price, price_max = (min(prices), max(prices)) if prices else ("", "")
    if not availability:
        m = re.search(r"(Còn hàng|Hết hàng|Ngừng kinh doanh|Đặt trước)", text)
        availability = m.group(1) if m else ""

    original = ""
    for tag in soup.find_all(["del", "s", "strike"]):
        m = PRICE_RE.search(tag.get_text(" ", strip=True))
        if m:
            original = to_int(m.group(0))
            break

    category = ""
    for d in _ld_objects(soup):
        if _has_type(d, "BreadcrumbList"):
            items = sorted(d.get("itemListElement", []), key=lambda x: x.get("position", 0))
            names = [str((i.get("item") or {}).get("name") if isinstance(i.get("item"), dict) else i.get("name", ""))
                     for i in items]
            category = " > ".join(n for n in names[1:] if n and n != "None")
            break
    if not category:
        parts = urlparse(url).path.strip("/").split("/")
        category = parts[0] if parts else ""

    description = (ld or {}).get("description") or ""
    if not description:
        md = soup.find("meta", attrs={"name": "description"}) or soup.find("meta", property="og:description")
        description = md.get("content", "") if md else ""

    specs = parse_specs(soup)
    options = parse_options(soup, url, categories)
    sizes = []  # Topzone không có size giày/áo; để trống cho cùng cấu trúc info.json
    related = [u for u in extract_links(html, categories) if not same_url(u, url)]

    return {
        "url": url, "sku": sku, "name": name, "brand": brand, "category": category,
        "price": price, "price_max": price_max, "original_price": original, "currency": "VND",
        "availability": availability, "options": options, "sizes": sizes,
        "specs": specs, "description": clean_text(description)[:6000],
        "image_urls": parse_images(soup, ld),
        "related_urls": related[:60],
    }


# ----------------------------------------------------------------------------
# Lưu
# ----------------------------------------------------------------------------
def image_variants(u):
    """URL gốc trước; nếu lỗi thì thử bỏ đoạn /sNN/ hoặc đuôi -650x650, và đổi cdn.topzone.vn <-> cdn.tgdd.vn."""
    cands = [u, re.sub(r"/s\d+(?:x\d+)?/", "/", u), re.sub(r"-\d+x\d+(?=\.\w+$)", "", u)]
    for c in list(cands):
        if "cdn.topzone.vn" in c:
            cands.append(c.replace("cdn.topzone.vn", "cdn.tgdd.vn"))
        elif "cdn.tgdd.vn" in c:
            cands.append(c.replace("cdn.tgdd.vn", "cdn.topzone.vn"))
    return list(dict.fromkeys(cands))


def get_image(url, referer):
    """Tải 1 ảnh, trả về (bytes, ghi_chú_lỗi). Không im lặng khi lỗi."""
    h = {"Referer": referer, "Accept": "image/avif,image/webp,image/apng,image/*,*/*;q=0.8"}
    try:
        r = session.get(url, timeout=TIMEOUT, headers=h)
    except requests.RequestException as e:
        return None, f"lỗi mạng: {e}"
    ctype = r.headers.get("Content-Type", "")
    if r.status_code != 200:
        return None, f"HTTP {r.status_code}"
    if not ctype.startswith("image") or not r.content:
        return None, f"không phải ảnh (Content-Type={ctype}, {len(r.content)} byte)"
    return r.content, ""


def download_image(image_url, product_url, folder, idx):
    ext = os.path.splitext(urlparse(image_url).path)[1].lower()
    if ext not in IMAGE_EXT:
        ext = ".jpg"
    path = os.path.join(folder, f"{idx:02d}{ext}")
    if os.path.exists(path):
        return path
    errs = []
    for cand in image_variants(image_url):
        data, err = get_image(cand, BASE + "/")
        if data:
            with open(path, "wb") as f:
                f.write(data)
            time.sleep(random.uniform(*IMG_DELAY_RANGE))
            return path
        errs.append(f"{err} <- {cand}")
        time.sleep(0.3)
    print("    lý do: " + " | ".join(errs[:2]))
    return ""


def test_image(url):
    for cand in image_variants(url):
        data, err = get_image(cand, BASE + "/")
        print(("OK  " if data else "LỖI ") + (f"{len(data)} byte" if data else err) + f"  {cand}")


def save_product(product, html, out_dir, save_html=False, no_images=False):
    url = product["url"]
    folder = product_folder(out_dir, url)
    os.makedirs(folder, exist_ok=True)
    if save_html:
        with open(os.path.join(folder, "page.html"), "w", encoding="utf-8") as pf:
            pf.write(html)
    files = []
    if not no_images:
        for idx, img in enumerate(product["image_urls"], 1):
            path = download_image(img, url, folder, idx)
            if path:
                files.append(path)
            else:
                print(f"  ! Không tải được ảnh: {img}")
        print(f"  Ảnh: {len(files)}/{len(product['image_urls'])} tải được")
    product["image_files"] = files
    with open(os.path.join(folder, "info.json"), "w", encoding="utf-8") as jf:
        json.dump(product, jf, ensure_ascii=False, indent=2)
    return folder


def write_summary_csv(path, records, work_dir):
    with open(path, "w", newline="", encoding="utf-8-sig") as f:
        w = csv.DictWriter(f, fieldnames=CSV_FIELDS)
        w.writeheader()
        for p in records:
            w.writerow({
                "url": p["url"], "sku": p.get("sku", ""), "name": p["name"], "brand": p.get("brand", ""),
                "category": p.get("category", ""), "price": p.get("price", ""),
                "price_max": p.get("price_max", ""), "original_price": p.get("original_price", ""),
                "availability": p.get("availability", ""),
                "options": json.dumps(p.get("options", []), ensure_ascii=False),
                "image_count": len(p.get("image_files", [])),
                "image_files": ";".join(os.path.relpath(x, work_dir) for x in p.get("image_files", [])),
                "description": p.get("description", ""),
                "specs": json.dumps(p.get("specs", {}), ensure_ascii=False),
            })


def load_existing(out_dir):
    records = {}
    if os.path.isdir(out_dir):
        for d in sorted(os.listdir(out_dir)):
            ip = os.path.join(out_dir, d, "info.json")
            if os.path.exists(ip):
                with open(ip, encoding="utf-8") as jf:
                    info = json.load(jf)
                records[info["url"]] = info
    return records


# ----------------------------------------------------------------------------
# Kiểm tra nhanh
# ----------------------------------------------------------------------------
def show_product(prod):
    show = {k: prod[k] for k in ("url", "name", "sku", "brand", "category", "price", "price_max",
                                 "original_price", "availability")}
    show["options"] = [(o["name"], [v["name"] for v in o["values"]]) for o in prod["options"]]
    show["specs_count"] = len(prod["specs"])
    show["specs_sample"] = list(prod["specs"].items())[:8]
    show["images"] = len(prod["image_urls"])
    show["image_urls"] = prod["image_urls"]
    show["related"] = len(prod["related_urls"])
    print(json.dumps(show, ensure_ascii=False, indent=2))
    print("\n(Chỉ là kiểm tra: chưa tải ảnh, chưa tạo thư mục. Thêm --save để tải về.)")


def single_url(url, args, out_dir, work_dir, csv_path, categories):
    r = fetch(url)
    if r is None:
        print("Không tải được trang (bị chặn? thử TOPZONE_COOKIE).")
        return
    prod = parse_product(r.text, url, categories)
    if prod is None:
        n = len(extract_links(r.text, categories))
        print(f"Không đọc được như trang sản phẩm ({n} link sản phẩm trong trang). "
              f"Chạy --dump {url} rồi xem debug_page.html.")
        return
    if not args.save:
        show_product(prod)
        return
    os.makedirs(out_dir, exist_ok=True)
    folder = save_product(prod, r.text, out_dir, save_html=args.save_html, no_images=args.no_images)
    records = load_existing(out_dir)
    records[url] = prod
    write_summary_csv(csv_path, list(records.values()), work_dir)
    print(f"Đã lưu: {folder}\nBảng tóm tắt: {csv_path}")


def dump(url):
    r = fetch(url)
    if r is None:
        print("Không tải được trang.")
        return
    with open("debug_page.html", "w", encoding="utf-8") as f:
        f.write(r.text)
    print(f"Đã lưu debug_page.html ({len(r.text)} ký tự, HTTP {r.status_code}).")


def probe(categories, rp, more_url):
    cat = categories[0]
    url = f"{BASE}/{cat}"
    print(f"== PROBE danh mục {cat} ==")
    r = fetch(url)
    if r is None:
        print("Không tải được trang danh mục (bị chặn? sai slug? thử TOPZONE_COOKIE).")
        return
    p1 = [u for u in extract_links(r.text, categories) if not same_url(u, url)]
    print(f"Trang 1: {len(p1)} link, ví dụ: {p1[:3]}")
    for pat in PAGE_PATTERNS:
        rr = fetch(url + pat.format(page=2), quiet=True)
        if rr is None:
            print(f"  {pat}: không tải được")
            continue
        new = [u for u in extract_links(rr.text, categories) if u not in p1 and not same_url(u, url)]
        print(f"  {pat}: {len(new)} link mới" + ("  <-- DÙNG ĐƯỢC" if new else ""))
        time.sleep(1)
    print("== PROBE sitemap ==")
    su = sitemap_urls(rp, categories)
    print(f"Sitemap: {len(su)} URL sản phẩm/danh mục, ví dụ: {su[:3]}")

    prod = None
    for link in (p1[:8] + su[:4]):
        rr = fetch(link)
        if rr is None:
            continue
        prod = parse_product(rr.text, link, categories)
        if prod is not None:
            print(f"== PROBE sản phẩm {link} ==")
            break
        print(f"  {link}: không phải trang sản phẩm")
        time.sleep(1)
    if prod is None:
        print("Không đọc được sản phẩm nào. Chạy: --dump <url sản phẩm> rồi gửi debug_page.html để chỉnh script.")
        return
    show_product(prod)


# ----------------------------------------------------------------------------
# Chương trình chính
# ----------------------------------------------------------------------------
def main():
    ap = argparse.ArgumentParser(description="Lấy hàng loạt sản phẩm từ topzone.vn")
    ap.add_argument("--category", nargs="+", help="slug danh mục, vd iphone ipad mac")
    ap.add_argument("--url", help="1 trang sản phẩm: in kết quả (thêm --save để tải về)")
    ap.add_argument("--save", action="store_true")
    ap.add_argument("--limit", type=int, default=0)
    ap.add_argument("--max-pages", type=int, default=30)
    ap.add_argument("--more-url", default="", help="URL 'Xem thêm' (AJAX), chỗ số trang là {page}")
    ap.add_argument("--no-sitemap", action="store_true")
    ap.add_argument("--no-related", action="store_true")
    ap.add_argument("--no-images", action="store_true")
    ap.add_argument("--save-html", action="store_true")
    ap.add_argument("--force", action="store_true")
    ap.add_argument("--probe", action="store_true")
    ap.add_argument("--dump", help="lưu HTML của 1 URL vào debug_page.html")
    ap.add_argument("--show-robots", action="store_true")
    ap.add_argument("--test-image", help="thử tải 1 URL ảnh và in mã lỗi")
    ap.add_argument("--out", default=os.path.join(os.getcwd(), "products_topzone"))
    args = ap.parse_args()

    out_dir = os.path.abspath(args.out)
    work_dir = os.path.dirname(out_dir)
    csv_path = os.path.join(work_dir, "products_topzone.csv")
    categories = args.category or DEFAULT_CATEGORIES

    if args.show_robots:
        show_robots()
        return
    if args.dump:
        dump(args.dump)
        return
    if args.test_image:
        test_image(args.test_image)
        return
    rp = load_robots()
    if args.url:
        single_url(args.url, args, out_dir, work_dir, csv_path, categories)
        return
    if args.probe:
        probe(categories, rp, args.more_url)
        return

    os.makedirs(out_dir, exist_ok=True)
    skip_file = os.path.join(out_dir, "_not_product.txt")
    not_product = set(open(skip_file, encoding="utf-8").read().split()) if os.path.exists(skip_file) else set()

    records = {} if args.force else load_existing(out_dir)
    queued, queue = set(records), deque()
    print(f"Đã có sẵn {len(records)} sản phẩm trong {out_dir}")

    def enqueue(urls):
        for u in urls:
            if u not in queued and u not in not_product:
                queued.add(u)
                queue.append(u)

    state = {"pattern": ""}
    listing_done = set()
    new_count, i = 0, 0
    try:
        print("Đang quét danh mục ...")
        for cat in categories:
            enqueue(crawl_listing(f"{BASE}/{cat}", args.max_pages, rp, state, categories,
                                  label=cat, more_url=args.more_url))
            time.sleep(random.uniform(*CRAWL_DELAY))
        if not args.no_sitemap:
            su = sitemap_urls(rp, categories)
            print(f"  sitemap: {len(su)} URL (trang không phải sản phẩm sẽ bị lọc khi tải)")
            enqueue(su)
        if not args.no_related:
            for info in list(records.values()):
                enqueue(info.get("related_urls", []))
        print(f"Hàng đợi: {len(queue)} URL cần tải")

        while queue:
            if args.limit and new_count >= args.limit:
                break
            url = queue.popleft()
            i += 1
            print(f"[{i} | mới {new_count} | còn {len(queue)}] {url}")
            if not allowed(rp, url):
                print("  Bỏ qua (robots.txt)")
                continue
            r = fetch(url)
            if r is None:
                print("  Bỏ qua (không tải được trang)")
                continue
            product = parse_product(r.text, url, categories)
            if product is None:
                sub = [u for u in extract_links(r.text, categories) if not same_url(u, url)]
                if len(sub) >= MIN_LISTING_LINKS:
                    if url not in listing_done:
                        listing_done.add(url)
                        print(f"  -> Trang danh sách ({len(sub)} link), quét thêm")
                        enqueue(crawl_listing(url, args.max_pages, rp, state, categories, first_html=r.text))
                else:
                    not_product.add(url)
                    with open(skip_file, "a", encoding="utf-8") as sf:
                        sf.write(url + "\n")
                    print("  Bỏ qua (không phải trang sản phẩm)")
                time.sleep(random.uniform(*CRAWL_DELAY))
                continue

            save_product(product, r.text, out_dir, save_html=args.save_html, no_images=args.no_images)
            records[url] = product
            new_count += 1
            print(f"  {product['name']} | giá={product['price']} | thông số={len(product['specs'])} | "
                  f"ảnh={len(product['image_urls'])}")
            if not args.no_related:
                enqueue(product["related_urls"])
            if new_count % CSV_EVERY == 0:
                write_summary_csv(csv_path, list(records.values()), work_dir)
            time.sleep(random.uniform(*DELAY_RANGE))
    except KeyboardInterrupt:
        print("\nĐã dừng (Ctrl+C). Dữ liệu đã tải được giữ nguyên, chạy lại để tiếp tục.")

    if records:
        write_summary_csv(csv_path, list(records.values()), work_dir)
    print(f"Hoàn thành: {new_count} sản phẩm mới, tổng {len(records)} sản phẩm.")
    print(f"Bảng tóm tắt: {csv_path}\nChi tiết từng sản phẩm: {out_dir}")


if __name__ == "__main__":
    main()