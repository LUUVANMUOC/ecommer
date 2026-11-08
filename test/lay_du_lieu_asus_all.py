#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
lay_du_lieu_asus_all.py - Tải TOÀN BỘ sản phẩm từ https://vn.store.asus.com
Cách dùng:
    python lay_du_lieu_asus_all.py --probe
    python lay_du_lieu_asus_all.py --all --save
"""

import argparse
import json
import os
import random
import re
import sys
import time
from urllib.parse import urljoin, urlparse

import requests
from bs4 import BeautifulSoup

sys.stdout.reconfigure(encoding="utf-8")

try:
    import lxml
    PARSER = "lxml"
except ImportError:
    PARSER = "html.parser"

BASE = "https://vn.store.asus.com"
HOST = "vn.store.asus.com"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
    "Accept-Language": "vi-VN,vi;q=0.9,en;q=0.8",
}

session = requests.Session()
session.headers.update(HEADERS)

DELAY_RANGE = (1.5, 3.0)
IMG_DELAY_RANGE = (0.5, 1.0)
MAX_RETRIES = 3
TIMEOUT = 20
MAX_IMAGES = 15

# Regex
PRODUCT_LINK_RE = re.compile(r'''href=["'](https?://vn\.store\.asus\.com/[^"']*?\.html[^"']*)["']''', re.I)
PRICE_RE = re.compile(r"(\d{1,3}(?:\.\d{3})+)\s*₫", re.I)
SPEC_LINE_RE = re.compile(r"^([^:：]{2,40})\s*[:：]\s*(.{1,200})$")

# ----------------------------------------------------------------------------
# Mạng & Tiện ích
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
                print(f"  HTTP {r.status_code} cho {url}, lần {attempt}")
        except requests.RequestException as e:
            if not quiet:
                print(f"  Lỗi mạng ({e}) cho {url}, lần {attempt}")
        time.sleep(3 * attempt)
    return None

def to_int(s):
    return int(re.sub(r"\D", "", str(s)))

def clean_text(s):
    lines = [re.sub(r"[ \t\xa0]+", " ", ln).strip() for ln in (s or "").split("\n")]
    return "\n".join(ln for ln in lines if ln)

def extract_product_links(text):
    links = []
    for m in PRODUCT_LINK_RE.findall(text):
        clean_url = m.split("?")[0]
        links.append(clean_url)
    return list(dict.fromkeys(links))

# ----------------------------------------------------------------------------
# Lấy danh sách URL sản phẩm từ Sitemap (nếu có)
# ----------------------------------------------------------------------------
def get_urls_from_sitemap():
    sitemap_urls = [
        f"{BASE}/sitemap.xml",
        f"{BASE}/sitemap_index.xml",
        f"{BASE}/sitemap-products.xml",
    ]
    all_product_urls = set()
    
    for sm_url in sitemap_urls:
        print(f"  Thử tải sitemap: {sm_url}")
        r = fetch(sm_url, quiet=True)
        if r is None:
            continue
        
        # Tìm các thẻ <loc> chứa URL
        locs = re.findall(r"<loc>\s*([^<]+?)\s*</loc>", r.text)
        for loc in locs:
            loc = loc.replace("&amp;", "&").strip()
            if loc.endswith(".xml") or ".xml" in loc.split("/")[-1]:
                # Nếu là sitemap con, tải tiếp
                r_sub = fetch(loc, quiet=True)
                if r_sub:
                    sub_locs = re.findall(r"<loc>\s*([^<]+?)\s*</loc>", r_sub.text)
                    for sl in sub_locs:
                        sl = sl.replace("&amp;", "&").strip()
                        if sl.endswith(".html") and HOST in sl:
                            all_product_urls.add(sl.split("?")[0])
            elif loc.endswith(".html") and HOST in loc:
                all_product_urls.add(loc.split("?")[0])
                
        if all_product_urls:
            print(f"  -> Tìm thấy {len(all_product_urls)} URL sản phẩm từ sitemap.")
            break
            
    return list(all_product_urls)

# ----------------------------------------------------------------------------
# Tự động phát hiện các danh mục từ trang chủ
# ----------------------------------------------------------------------------
def get_categories_from_homepage():
    print("Đang quét trang chủ để tìm danh mục...")
    r = fetch(BASE)
    if r is None:
        print("Không tải được trang chủ.")
        return []
    
    soup = BeautifulSoup(r.text, PARSER)
    categories = set()
    
    # Tìm tất cả các thẻ <a> trong menu điều hướng (thường nằm trong <nav> hoặc <header>)
    for a in soup.find_all("a", href=True):
        href = a["href"]
        # Chỉ lấy các link nội bộ, không phải link sản phẩm (.html), không phải link tài khoản
        if href.startswith("/") and not href.endswith(".html") and not href.startswith("//"):
            clean_href = href.strip("/")
            if clean_href and "?" not in clean_href and "laptop" in clean_href.lower() or "man-hinh" in clean_href.lower() or "phu-kien" in clean_href.lower():
                categories.add(clean_href)
    
    # Nếu không tìm thấy động, thêm các danh mục phổ biến đã biết
    known_categories = [
        "asus-laptop-mong-nhe",
        "rog-laptop-gaming-mong-nhe",
        "laptop-gaming-ai",
        "man-hinh",
        "phu-kien",
        "tuf-gaming",
        "vivobook",
        "zenbook"
    ]
    for c in known_categories:
        categories.add(c)
        
    print(f"  -> Tìm thấy {len(categories)} danh mục tiềm năng.")
    return list(categories)

# ----------------------------------------------------------------------------
# Quét danh mục (hỗ trợ phân trang ?page=N)
# ----------------------------------------------------------------------------
def crawl_listing(base_url, max_pages=20):
    found = set()
    page = 1
    while page <= max_pages:
        page_url = f"{base_url}?page={page}" if page > 1 else base_url
        r = fetch(page_url, quiet=(page > 1))
        if r is None:
            break
        
        links = extract_product_links(r.text)
        new_links = [l for l in links if l not in found]
        
        if not new_links:
            if page > 1:
                print(f"    Trang {page}: Không có link mới. Dừng.")
            break
            
        print(f"    Trang {page}: +{len(new_links)} link")
        found.update(new_links)
        page += 1
        time.sleep(random.uniform(*DELAY_RANGE))
        
    return list(found)

# ----------------------------------------------------------------------------
# Phân tích trang sản phẩm (giữ nguyên từ bản trước)
# ----------------------------------------------------------------------------
def parse_product(html, url):
    soup = BeautifulSoup(html, PARSER)
    text = soup.get_text(" ", strip=True)
    
    h1 = soup.find("h1")
    name = h1.get_text(" ", strip=True) if h1 else ""
    if not name:
        return None

    sku = ""
    sku_match = re.search(r"(?:Part Number|SKU|Mã sản phẩm)[\s:：]+([A-Z0-9\-]+)", text, re.I)
    if sku_match:
        sku = sku_match.group(1)

    price = ""
    price_max = ""
    prices = [to_int(m) for m in PRICE_RE.findall(text)]
    if prices:
        price = min(prices)
        price_max = max(prices)

    availability = "InStock"
    if "Hết hàng" in text or "Tạm hết hàng" in text:
        availability = "OutOfStock"

    category = ""
    breadcrumb = soup.find("nav", class_=re.compile(r"breadcrumb", re.I))
    if breadcrumb:
        category = " > ".join([a.get_text(strip=True) for a in breadcrumb.find_all("a") if a.get_text(strip=True)])
    if not category:
        parts = urlparse(url).path.strip("/").split("/")
        category = parts[0] if parts else ""

    specs = {}
    for table in soup.find_all("table"):
        for tr in table.find_all("tr"):
            cells = tr.find_all(["td", "th"])
            if len(cells) == 2:
                k = cells[0].get_text(" ", strip=True).rstrip(":")
                v = cells[1].get_text(" ", strip=True)
                if k and v and len(k) < 80:
                    specs[k] = v
    if not specs:
        for li in soup.find_all("li"):
            txt = li.get_text(" ", strip=True)
            m = SPEC_LINE_RE.match(txt)
            if m:
                specs[m.group(1).strip()] = m.group(2).strip()

    description = ""
    meta_desc = soup.find("meta", attrs={"name": "description"}) or soup.find("meta", property="og:description")
    if meta_desc:
        description = meta_desc.get("content", "")

    images = []
    for meta in soup.find_all("meta", property="og:image"):
        if meta.get("content"):
            images.append(urljoin(BASE, meta["content"]))
    for img in soup.find_all("img"):
        src = img.get("src") or img.get("data-src")
        if src and ("/Products/" in src or "/media/" in src or "asus.com" in src):
            full_src = urljoin(BASE, src)
            if full_src not in images:
                images.append(full_src)
    seen = set()
    final_images = []
    for img_url in images:
        if img_url not in seen:
            seen.add(img_url)
            final_images.append(img_url)
    images = final_images[:MAX_IMAGES]

    return {
        "url": url,
        "sku": sku,
        "name": name,
        "brand": "ASUS",
        "category": category,
        "price": price,
        "price_max": price_max,
        "original_price": "",
        "currency": "VND",
        "availability": availability,
        "options": [],
        "specs": specs,
        "description": clean_text(description)[:6000],
        "image_urls": images,
    }

# ----------------------------------------------------------------------------
# Tải ảnh & Lưu
# ----------------------------------------------------------------------------
def get_image(url, referer):
    h = {"Referer": referer, "Accept": "image/avif,image/webp,image/apng,image/*,*/*;q=0.8"}
    try:
        r = session.get(url, timeout=TIMEOUT, headers=h)
        if r.status_code == 200 and r.headers.get("Content-Type", "").startswith("image"):
            return r.content
    except requests.RequestException:
        pass
    return None

def download_image(image_url, product_url, folder, idx):
    ext = os.path.splitext(urlparse(image_url).path)[1].lower()
    if ext not in (".jpg", ".jpeg", ".png", ".webp", ".gif"):
        ext = ".jpg"
    path = os.path.join(folder, f"{idx:02d}{ext}")
    if os.path.exists(path):
        return path
    
    data = get_image(image_url, BASE + "/")
    if data:
        with open(path, "wb") as f:
            f.write(data)
        time.sleep(random.uniform(*IMG_DELAY_RANGE))
        return path
    return ""

def product_folder(out_dir, url):
    slug = re.sub(r"[^\w-]", "_", urlparse(url).path.strip("/").replace("/", "__"))[:120]
    return os.path.join(out_dir, slug)

def save_product(product, html, out_dir, save_html=False):
    url = product["url"]
    folder = product_folder(out_dir, url)
    os.makedirs(folder, exist_ok=True)
    
    if save_html:
        with open(os.path.join(folder, "page.html"), "w", encoding="utf-8") as f:
            f.write(html)
            
    files = []
    for idx, img in enumerate(product["image_urls"], 1):
        path = download_image(img, url, folder, idx)
        if path:
            files.append(path)
    product["image_files"] = files
    
    with open(os.path.join(folder, "info.json"), "w", encoding="utf-8") as jf:
        json.dump(product, jf, ensure_ascii=False, indent=2)
    return folder

# ----------------------------------------------------------------------------
# Chương trình chính
# ----------------------------------------------------------------------------
def main():
    ap = argparse.ArgumentParser(description="Tải TOÀN BỘ sản phẩm từ ASUS Store VN")
    ap.add_argument("--probe", action="store_true", help="Kiểm tra nhanh 1 sản phẩm mẫu")
    ap.add_argument("--all", action="store_true", help="Tải tất cả sản phẩm (qua Sitemap + Danh mục)")
    ap.add_argument("--save", action="store_true", help="Lưu dữ liệu (mặc định chỉ in ra)")
    ap.add_argument("--limit", type=int, default=0, help="Giới hạn số sản phẩm (hữu ích khi test)")
    ap.add_argument("--out", default=os.path.join(os.getcwd(), "products_asus"), help="Thư mục lưu")
    args = ap.parse_args()

    out_dir = os.path.abspath(args.out)
    os.makedirs(out_dir, exist_ok=True)

    if args.probe:
        test_url = "https://vn.store.asus.com/laptop-gaming-ai-rog-zephyrus-g16-gu606ar-tb027w.html"
        print(f"== PROBE: {test_url} ==")
        r = fetch(test_url)
        if r:
            prod = parse_product(r.text, test_url)
            if prod:
                print(json.dumps({k: prod[k] for k in ("name", "price", "sku", "category", "specs", "image_urls")}, ensure_ascii=False, indent=2))
            else:
                print("Không parse được sản phẩm.")
        return

    if not args.all:
        print("Vui lòng dùng --all để tải toàn bộ, hoặc --probe để kiểm tra.")
        return

    all_urls = set()

    # 1. Thử lấy từ Sitemap
    print("=== BƯỚC 1: LẤY URL TỪ SITEMAP ===")
    sitemap_urls = get_urls_from_sitemap()
    if sitemap_urls:
        all_urls.update(sitemap_urls)

    # 2. Nếu Sitemap không có hoặc quá ít, quét qua các danh mục
    if len(all_urls) < 50: 
        print("\n=== BƯỚC 2: QUÉT QUA CÁC DANH MỤC ===")
        categories = get_categories_from_homepage()
        for cat in categories:
            cat_url = f"{BASE}/{cat}"
            print(f"  Đang quét danh mục: {cat_url}")
            urls = crawl_listing(cat_url)
            all_urls.update(urls)
            print(f"  -> Tổng cộng hiện tại: {len(all_urls)} URL.")

    if not all_urls:
        print("Không tìm thấy URL sản phẩm nào.")
        return

    product_urls = list(all_urls)
    if args.limit:
        product_urls = product_urls[:args.limit]

    print(f"\nTổng cộng: {len(product_urls)} sản phẩm cần tải.")
    
    for i, url in enumerate(product_urls, 1):
        print(f"[{i}/{len(product_urls)}] {url}")
        r = fetch(url)
        if r is None:
            continue
        prod = parse_product(r.text, url)
        if prod:
            if args.save:
                folder = save_product(prod, r.text, out_dir)
                print(f"  -> Đã lưu: {os.path.basename(folder)}")
            else:
                print(f"  -> {prod['name']} | Giá: {prod['price']}")
        time.sleep(random.uniform(*DELAY_RANGE))

if __name__ == "__main__":
    main()