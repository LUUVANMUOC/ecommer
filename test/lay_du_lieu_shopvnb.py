#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
lay_du_lieu_shopvnb.py - Lấy hàng loạt sản phẩm từ https://shopvnb.com (cầu lông, pickleball, tennis...)

Mỗi sản phẩm -> 1 thư mục: info.json + ảnh (01.webp, 02.webp, ...) (+ page.html nếu dùng --save-html),
kèm bảng tóm tắt products_shopvnb.csv. info.json gồm:
  url, sku, name, brand, category, price, price_max, original_price, currency, availability,
  options (phiên bản/màu/size kèm trạng thái hết hàng), sizes, specs, description,
  image_urls, image_files, related_urls

Cài đặt:    pip install requests beautifulsoup4 lxml

KIỂM TRA (chỉ in ra màn hình, KHÔNG tải ảnh, KHÔNG tạo thư mục):
    python lay_du_lieu_shopvnb.py --probe
    python lay_du_lieu_shopvnb.py --url https://shopvnb.com/vot-cau-long-vnb-v88-xanh-chinh-hang.html

TẢI THẬT (tạo thư mục products_shopvnb, tải ảnh, ghi info.json + CSV):
    python lay_du_lieu_shopvnb.py --url https://shopvnb.com/vot-cau-long-vnb-v88-xanh-chinh-hang.html --save
    python lay_du_lieu_shopvnb.py --category vot-cau-long --limit 5
    python lay_du_lieu_shopvnb.py                      (toàn bộ danh mục mặc định)

Tùy chọn:   --category <slug> [<slug> ...]   danh mục (phần trước .html), vd vot-cau-long-yonex
            --url <url>        1 trang sản phẩm: mặc định chỉ in kết quả; thêm --save để tải về
            --save             dùng cùng --url: lưu info.json + ảnh vào thư mục --out
            --limit N          chỉ lấy N sản phẩm MỚI
            --max-pages N      số trang tối đa mỗi trang danh sách (mặc định 40)
            --no-related       không đi theo mục "Sản phẩm liên quan"
            --sitemap          thêm URL từ sitemap.xml (nếu site có)
            --no-images        KHÔNG tải ảnh
            --save-html        lưu thêm page.html của từng sản phẩm (để debug)
            --force            tải lại cả sản phẩm đã có
            --show-robots      in robots.txt của site đúng như script đọc được (để kiểm tra)
            --out <thư mục>    mặc định ./products_shopvnb
Nếu bị chặn (HTTP 403): đặt biến môi trường SHOPVNB_COOKIE = header Cookie copy từ Chrome (DevTools -> Network).

Cách tìm sản phẩm:
  1) Quét trang danh mục bằng phân trang ?page=N (mỗi trang ~20 sản phẩm).
  2) Trong danh mục có lẫn link TRANG THƯƠNG HIỆU / DANH MỤC CON (vd vot-cau-long-vs.html,
     vot-cau-long-taro.html). Khi gặp trang như vậy script coi nó là trang danh sách: quét phân trang
     của nó và đưa các sản phẩm tìm được vào hàng đợi.
  3) Đi theo "Sản phẩm liên quan / Có thể bạn sẽ thích" trong từng trang sản phẩm để bù phần còn thiếu.

Cách lấy ảnh: các link ảnh trong thư viện ảnh sản phẩm (title="Click để xem"), cộng thêm mọi ảnh khác
trong trang có cùng tên gốc (vd ...-v88-xanh-chinh-hang-1.webp, -2.webp, -3.webp) - ảnh của sản phẩm
liên quan có tên khác nên không bị lẫn vào.

Script kiểm tra robots.txt, nghỉ ngẫu nhiên giữa các lần tải, tự bỏ qua sản phẩm đã có,
ghi lại CSV định kỳ và khi bấm Ctrl+C (chạy lại sẽ tiếp tục từ chỗ dở).
Ảnh/mô tả thuộc bản quyền ShopVNB: chỉ dùng cho mục đích học tập/thử nghiệm.
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
from bs4 import BeautifulSoup, Comment, NavigableString

sys.stdout.reconfigure(encoding="utf-8")

try:
    import lxml  # noqa: F401
    PARSER = "lxml"
except ImportError:
    PARSER = "html.parser"

BASE = "https://shopvnb.com"
HOST = "shopvnb.com"
CDN = "https://cdn.shopvnb.com"

# Danh mục cấp 1 trên menu (có thể thêm ghe-massage, may-massage, may-chay-bo-xe-dap-tap bằng --category)
DEFAULT_CATEGORIES = [
    "vot-cau-long", "giay-cau-long", "ao-cau-long", "vay-cau-long", "quan-cau-long",
    "tui-vot-cau-long", "balo-cau-long", "phu-kien-cau-long",
    "vot-pickleball", "giay-pickleball", "tui-pickleball", "ao-pickleball", "quan-pickleball",
    "bong-pickleball", "vay-pickleball", "phu-kien-pickleball", "balo-pickleball",
    "vot-tennis", "giay-tennis", "balo-tennis", "tui-tennis", "chan-vay-tennis", "ao-tennis",
    "quan-tennis", "phu-kien-tennis", "may-dan-va-tham-cau-long", "giay-running", "mu",
    "phu-kien-suu-tam",
]
# Kết quả --probe: site dùng ?page=N. Hai kiểu còn lại chỉ là dự phòng nếu site đổi.
DEFAULT_PAGE_PATTERN = "?page={page}"
PAGE_PATTERNS = [DEFAULT_PAGE_PATTERN, "?p={page}", "?trang={page}"]
MIN_LISTING_LINKS = 3         # trang không phải sản phẩm mà có >= N link sản phẩm -> coi là trang danh sách
CSV_EVERY = 20                # ghi lại CSV sau mỗi N sản phẩm mới

DELAY_RANGE = (2.0, 4.0)      # giây, nghỉ giữa các trang sản phẩm
IMG_DELAY_RANGE = (0.5, 1.0)  # giây, nghỉ giữa các ảnh
CRAWL_DELAY = (1.0, 2.0)      # giây, nghỉ giữa các trang danh mục
MAX_RETRIES = 3
TIMEOUT = 20
MAX_IMAGES = 15

HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; PriceResearchBot/1.0; contact: ban@email.com)",
    "Accept-Language": "vi-VN,vi;q=0.9",
}
if os.environ.get("SHOPVNB_COOKIE"):
    HEADERS["Cookie"] = os.environ["SHOPVNB_COOKIE"]

ROBOT_UA = "PriceResearchBot"   # tên bot dùng để so khớp với robots.txt

CSV_FIELDS = ["url", "sku", "name", "brand", "category", "price", "price_max", "original_price",
              "availability", "options", "image_count", "image_files", "description", "specs"]

IMAGE_EXT = (".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif")
LABEL_RE = re.compile(r"Chọn\s*\[([^\]]+)\]")
PRICE_NUM = re.compile(r"\d{1,3}(?:\.\d{3})+")
SPEC_LINE_RE = re.compile(r"^([^:：]{2,40})\s*[:：]\s*(.{1,160})$")

session = requests.Session()
session.headers.update(HEADERS)


# ----------------------------------------------------------------------------
# Mạng
# ----------------------------------------------------------------------------
def fetch(url, headers=None, quiet=False):
    """Tải URL, thử lại nếu lỗi tạm thời. Trả về Response hoặc None."""
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            r = session.get(url, timeout=TIMEOUT, headers=headers)
            if r.status_code == 200:
                return r
            if r.status_code in (404, 410):
                return None
            if r.status_code in (403, 429, 503) and not quiet:
                print(f"  HTTP {r.status_code} cho {url} (site có thể đang chặn bot; thử đặt SHOPVNB_COOKIE), lần {attempt}")
            elif not quiet:
                print(f"  HTTP {r.status_code} cho {url}, lần {attempt}")
        except requests.RequestException as e:
            if not quiet:
                print(f"  Lỗi mạng ({e}) cho {url}, lần {attempt}")
        time.sleep(5 * attempt)
    return None


def load_robots():
    """Đọc robots.txt bằng requests (cùng User-Agent với các lần tải khác).
    Không dùng RobotFileParser.read() vì urllib gửi User-Agent mặc định của Python, site có thể trả 403,
    và thư viện sẽ hiểu nhầm 403 là 'cấm tất cả' dù robots.txt thật không cấm.
    - 200: áp dụng đúng các quy tắc trong robots.txt.
    - 404/410: site không có robots.txt -> không hạn chế.
    - Lỗi khác: in cảnh báo (nên tự mở robots.txt trong trình duyệt để kiểm tra) và tiếp tục."""
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
    print(f"Cảnh báo: robots.txt trả HTTP {r.status_code}, script không biết quy tắc của site. "
          f"Hãy tự kiểm tra {url} trong trình duyệt.")
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
        for path in ("/vot-cau-long.html", "/vot-cau-long-vnb-v88-xanh-chinh-hang.html"):
            print(f"can_fetch({path}) = {rp.can_fetch(ROBOT_UA, BASE + path)}")


def allowed(rp, url):
    return True if rp is None else rp.can_fetch(ROBOT_UA, url)


# ----------------------------------------------------------------------------
# Tiện ích
# ----------------------------------------------------------------------------
def fix_img(u):
    """Chuẩn hóa URL ảnh: bỏ '//' thừa, bỏ tiền tố resize /img/300x300/ để lấy ảnh gốc."""
    u = (u or "").strip()
    if not u:
        return ""
    u = urljoin(BASE + "/", u)
    u = re.sub(r"^https?://(?:www\.)?shopvnb\.com/+uploads/", CDN + "/uploads/", u)
    u = re.sub(r"/img/\d+x\d+/uploads/", "/uploads/", u)
    return u


def to_int(s):
    return int(re.sub(r"\D", "", s))


def clean_text(s):
    lines = [re.sub(r"[ \t\xa0]+", " ", ln).strip() for ln in (s or "").split("\n")]
    return "\n".join(ln for ln in lines if ln)


def product_links(soup, page_url):
    """Link dạng /<slug>.html có ảnh trong /uploads/. Lưu ý: gồm cả sản phẩm lẫn trang thương hiệu/
    danh mục con (vd vot-cau-long-vs.html); việc phân biệt được làm khi tải trang (parse_product)."""
    out = []
    for a in soup.find_all("a", href=True):
        link = urljoin(page_url, a["href"]).split("#")[0].split("?")[0]
        p = urlparse(link)
        if p.netloc.replace("www.", "") != HOST or not re.fullmatch(r"/[^/]+\.html", p.path):
            continue
        img = a.find("img")
        src = (img.get("data-src") or img.get("src") or "") if img else ""
        if "/uploads/" in src:
            out.append(link)
    return list(dict.fromkeys(out))


def product_folder(out_dir, url):
    slug = re.sub(r"[^\w-]", "_", urlparse(url).path.strip("/").replace(".html", ""))[:120]
    return os.path.join(out_dir, slug)


# ----------------------------------------------------------------------------
# Thu thập URL sản phẩm
# ----------------------------------------------------------------------------
def crawl_listing(url, max_pages, rp, state, label="", first_html=None):
    """Duyệt các trang của 1 trang danh sách (danh mục / thương hiệu / danh mục con).
    Trả về danh sách URL (sản phẩm, và có thể cả trang thương hiệu - sẽ được phân loại khi tải).
    state['pattern'] lưu kiểu phân trang đã xác định (mặc định ?page=N)."""
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
    found = product_links(BeautifulSoup(first_html, PARSER), url)
    print(f"  {label} trang 1: {len(found)} link")
    for page in range(2, max_pages + 1):
        time.sleep(random.uniform(*CRAWL_DELAY))
        patterns = [state["pattern"]] if state.get("pattern") else PAGE_PATTERNS
        got = []
        for pat in patterns:
            rr = fetch(url + pat.format(page=page), quiet=True)
            if rr is None:
                continue
            links = product_links(BeautifulSoup(rr.text, PARSER), url)
            got = [u for u in links if u not in found]
            if got:
                state["pattern"] = pat
                break
        if not got:
            break
        found.extend(got)
        print(f"  {label} trang {page}: +{len(got)} link")
    return found


def sitemap_urls(rp):
    r = fetch(f"{BASE}/sitemap.xml", quiet=True)
    if r is None:
        print("  Không có sitemap.xml")
        return []
    urls = re.findall(r"<loc>\s*([^<]+?)\s*</loc>", r.text)
    out = []
    for u in urls:
        u = u.replace("&amp;", "&").split("?")[0]
        if re.fullmatch(r"https?://(?:www\.)?shopvnb\.com/[^/]+\.html", u) and allowed(rp, u):
            out.append(u)
    return list(dict.fromkeys(out))


# ----------------------------------------------------------------------------
# Phân tích trang sản phẩm
# ----------------------------------------------------------------------------
def parse_options(soup):
    """Đọc các nhóm 'Chọn [Phiên bản] / [Màu sắc] / [Size]' theo thứ tự trong trang.
    Mỗi giá trị: {name, soldout, image, price_min, price_max}.
    Trả về [] nếu sản phẩm không có tùy chọn (vd vợt VNB V88)."""
    first = soup.find(string=LABEL_RE)
    if first is None:
        return []
    options = []

    def new_group(s):
        g = {"name": LABEL_RE.search(s).group(1).strip(), "values": []}
        options.append(g)
        return g

    cur = new_group(str(first))
    last, pending_img = None, ""
    for n, el in enumerate(first.next_elements):
        if n > 600:
            break
        if isinstance(el, Comment):
            continue
        if isinstance(el, NavigableString):
            if el.parent is not None and el.parent.name in ("script", "style", "noscript"):
                continue
            s = re.sub(r"\s+", " ", str(el)).strip()
            if not s:
                continue
            if LABEL_RE.search(s):
                cur, last, pending_img = new_group(s), None, ""
                continue
            if "ƯU ĐÃI" in s or "Mua ngay" in s or "Đang có hàng" in s:
                break
            if re.fullmatch(r"[\d\.\s\-–₫đ]+", s) and PRICE_NUM.search(s):
                nums = [to_int(x) for x in PRICE_NUM.findall(s)]
                if last is not None and nums:
                    last["price_min"], last["price_max"] = min(nums), max(nums)
                continue
            if len(s) > 80 or (len(s) < 2 and not s.isalnum()):
                continue
            same = next((v for v in cur["values"] if v["name"] == s), None)
            if same:
                last = same
                continue
            last = {"name": s, "soldout": False, "image": pending_img}
            pending_img = ""
            cur["values"].append(last)
        elif getattr(el, "name", None) == "img":
            src = el.get("src") or el.get("data-src") or ""
            if "soldout" in src:
                if last is not None:
                    last["soldout"] = True
            elif src:
                pending_img = fix_img(src)
    return [g for g in options if g["values"]]


def parse_options_fallback(soup):
    """Dự phòng: nếu trang không dùng dạng 'Chọn [..]' thì thử đọc <select> có tên liên quan size/màu/phiên bản."""
    options = []
    for sel in soup.find_all("select"):
        name = sel.get("name") or sel.get("id") or ""
        if not re.search(r"size|mau|color|phien|version|kich|co", name, re.I):
            continue
        values = []
        for op in sel.find_all("option"):
            txt = op.get_text(" ", strip=True)
            if not txt or not op.get("value") or re.match(r"(chọn|select)", txt, re.I):
                continue
            values.append({"name": txt, "soldout": op.has_attr("disabled"), "image": ""})
        if values:
            options.append({"name": name, "values": values})
    return options


def _img_stem(u):
    return os.path.splitext(os.path.basename(urlparse(u).path))[0]


def _img_base(u):
    """Tên gốc của ảnh, bỏ hậu tố số thứ tự: ...-hang-1 -> ...-hang ; ..._1791251544 -> ..."""
    return re.sub(r"(-\d+)?(_\d+)?$", "", _img_stem(u))


def parse_images(soup):
    """Ảnh sản phẩm: link thư viện (title="Click để xem") + ảnh khác cùng tên gốc; dự phòng og:image."""
    imgs = []
    for a in soup.find_all("a", href=True):
        if a.get("title") == "Click để xem" and "/uploads/" in a["href"]:
            imgs.append(fix_img(a["href"]))
    if not imgs:
        for meta in soup.find_all("meta", property="og:image"):
            if meta.get("content"):
                imgs.append(fix_img(meta["content"]))
    imgs = [u for u in imgs if u.lower().split("?")[0].endswith(IMAGE_EXT)]
    if imgs:
        # Thêm các ảnh cùng sản phẩm (cùng tên gốc + hậu tố số) nằm ở slider/thumbnail
        base = _img_base(imgs[0])
        pat = re.compile(re.escape(base) + r"(-\d+)?(_\d+)?")
        extra = []
        for tag in soup.find_all(["a", "img", "source"]):
            for attr in ("href", "src", "data-src", "data-original", "data-large", "data-zoom-image"):
                v = tag.get(attr)
                if not v or "/uploads/" not in v:
                    continue
                u = fix_img(v)
                if (u.lower().split("?")[0].endswith(IMAGE_EXT) and pat.fullmatch(_img_stem(u))
                        and ("/uploads/san_pham/" in u or "/uploads/gallery/" in u)):
                    extra.append(u)
        imgs += sorted(set(extra) - set(imgs), key=_img_stem)
    return list(dict.fromkeys(imgs))[:MAX_IMAGES]


def parse_product(html, url):
    """Trả về dict sản phẩm, hoặc None nếu trang không phải trang sản phẩm
    (vd trang thương hiệu / danh mục con)."""
    soup = BeautifulSoup(html, PARSER)
    text = soup.get_text(" ", strip=True)
    og_type = soup.find("meta", property="og:type")
    is_product = (og_type and og_type.get("content") == "product") or ("Mã:" in text and "Thương hiệu:" in text)
    h1 = soup.find("h1")
    name = h1.get_text(" ", strip=True) if h1 else ""
    if not is_product or not name:
        return None

    m = re.search(r"Mã:\s*([A-Za-z0-9._\-]+)", text)
    sku = m.group(1) if m else ""
    m = re.search(r"Thương hiệu:\s*(.+?)\s+(?:Mã:|\||Tình trạng)", text)
    brand = m.group(1).strip() if m else ""
    m = re.search(r"Tình trạng:\s*(Còn hàng|Hết hàng|Liên hệ|Ngừng kinh doanh)", text)
    availability = m.group(1) if m else ""

    # Giá: đoạn từ "Tình trạng" đến "Chọn [" ; "Giá niêm yết" là giá gốc, còn lại là khoảng giá bán
    price = price_max = original = ""
    i = text.find("Tình trạng:")
    if i != -1:
        j = text.find("Chọn [", i)
        seg = text[i:(j if j != -1 else i + 300)]
        m = re.search(r"Giá niêm yết:\s*(\d{1,3}(?:\.\d{3})+)", seg)
        if m:
            original = to_int(m.group(1))
        nums = [to_int(x) for x in PRICE_NUM.findall(re.sub(r"Giá niêm yết:.*", "", seg))]
        nums = [x for x in nums if x >= 1000]
        if nums:
            price, price_max = min(nums), max(nums)

    # Danh mục: breadcrumb (link có title="Trang chủ" là breadcrumb, menu dùng title khác)
    category = ""
    home = soup.find("a", title="Trang chủ")
    if home is not None:
        lst = home.find_parent(["ul", "ol"])
        if lst is not None:
            names = [a.get_text(" ", strip=True) for a in lst.find_all("a")]
            category = " > ".join(x for x in names[1:] if x)

    # Thông số: bảng 2 cột + các dòng "Độ cứng: Cứng" trong phần mô tả
    specs = {}
    for tr in soup.find_all("tr"):
        cells = tr.find_all(["td", "th"])
        if len(cells) == 2:
            k = cells[0].get_text(" ", strip=True).rstrip(":")
            v = cells[1].get_text(" ", strip=True)
            if k and v and len(k) < 80:
                specs.setdefault(k, v)
    h2 = soup.find(lambda t: t.name == "h2" and re.match(r"\s*1\s*[\.\)]", t.get_text(strip=True)))
    container = h2.parent if h2 is not None else soup
    for li in container.find_all("li"):
        m = SPEC_LINE_RE.match(li.get_text(" ", strip=True))
        if m:
            specs.setdefault(m.group(1).strip(" -•"), m.group(2).strip())

    # Mô tả
    description = ""
    if h2 is not None:
        description = clean_text(container.get_text("\n"))[:6000]
    if not description:
        md = soup.find("meta", attrs={"name": "description"}) or soup.find("meta", property="og:description")
        description = md.get("content", "") if md else ""

    imgs = parse_images(soup)
    options = parse_options(soup) or parse_options_fallback(soup)
    sizes = next(([{"name": v["name"], "soldout": v["soldout"]} for v in o["values"]]
                  for o in options if re.search(r"size|kích|cỡ", o["name"], re.I)), [])
    related = [u for u in product_links(soup, url) if u.rstrip("/") != url.rstrip("/")]

    return {
        "url": url, "sku": sku, "name": name, "brand": brand, "category": category,
        "price": price, "price_max": price_max, "original_price": original, "currency": "VND",
        "availability": availability, "options": options, "sizes": sizes,
        "specs": specs, "description": description, "image_urls": imgs,
        "related_urls": list(dict.fromkeys(related))[:60],
    }


# ----------------------------------------------------------------------------
# Lưu
# ----------------------------------------------------------------------------
def download_image(image_url, product_url, folder, idx):
    ext = os.path.splitext(urlparse(image_url).path)[1].lower()
    if ext not in IMAGE_EXT:
        ext = ".jpg"
    path = os.path.join(folder, f"{idx:02d}{ext}")
    if os.path.exists(path):
        return path
    r = fetch(image_url, headers={"Referer": product_url})
    if r is not None and r.content:
        with open(path, "wb") as f:
            f.write(r.content)
        time.sleep(random.uniform(*IMG_DELAY_RANGE))
        return path
    return ""


def save_product(product, html, out_dir, save_html=False, no_images=False):
    """Ghi info.json (+ page.html, + ảnh) của 1 sản phẩm vào thư mục riêng. Trả về đường dẫn thư mục."""
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


# ----------------------------------------------------------------------------
# Kiểm tra nhanh (không ghi file)
# ----------------------------------------------------------------------------
def show_product(prod):
    show = {k: prod[k] for k in ("url", "name", "sku", "brand", "category", "price", "price_max",
                                 "original_price", "availability")}
    show["options"] = [(o["name"], [v["name"] + (" (hết)" if v.get("soldout") else "") for v in o["values"]])
                       for o in prod["options"]]
    show["specs"] = list(prod["specs"].items())[:8]
    show["images"] = len(prod["image_urls"])
    show["image_urls"] = prod["image_urls"]
    show["related"] = len(prod["related_urls"])
    print(json.dumps(show, ensure_ascii=False, indent=2))
    print("\n(Đây chỉ là kiểm tra: chưa tải ảnh, chưa tạo thư mục. Thêm --save để tải về.)")


def single_url(url, args, out_dir, work_dir, csv_path):
    """--url: đọc 1 trang sản phẩm; có --save thì lưu info.json + ảnh + cập nhật CSV."""
    r = fetch(url)
    if r is None:
        print("Không tải được trang (bị chặn? thử SHOPVNB_COOKIE).")
        return
    prod = parse_product(r.text, url)
    if prod is None:
        n = len(product_links(BeautifulSoup(r.text, PARSER), url))
        print(f"Không phải trang sản phẩm ({n} link sản phẩm bên trong"
              f"{' -> có vẻ là trang thương hiệu/danh mục con' if n >= MIN_LISTING_LINKS else ''}).")
        return
    if not args.save:
        show_product(prod)
        return
    os.makedirs(out_dir, exist_ok=True)
    folder = save_product(prod, r.text, out_dir, save_html=args.save_html, no_images=args.no_images)
    records = {}
    for d in sorted(os.listdir(out_dir)):
        ip = os.path.join(out_dir, d, "info.json")
        if os.path.exists(ip):
            with open(ip, encoding="utf-8") as jf:
                info = json.load(jf)
            records[info["url"]] = info
    records[url] = prod
    write_summary_csv(csv_path, list(records.values()), work_dir)
    print(f"Đã lưu: {folder}")
    print(f"Bảng tóm tắt: {csv_path}")


def probe(categories, rp):
    cat = categories[0]
    print(f"== PROBE danh mục {cat} ==")
    url = f"{BASE}/{cat}.html"
    r = fetch(url)
    if r is None:
        print("Không tải được trang danh mục (bị chặn? thử SHOPVNB_COOKIE).")
        return
    p1 = product_links(BeautifulSoup(r.text, PARSER), url)
    print(f"Trang 1: {len(p1)} link, ví dụ: {p1[:2]}")
    for pat in PAGE_PATTERNS:
        rr = fetch(url + pat.format(page=2), quiet=True)
        if rr is None:
            print(f"  {pat}: không tải được")
            continue
        p2 = product_links(BeautifulSoup(rr.text, PARSER), url)
        new = [u for u in p2 if u not in p1]
        print(f"  {pat}: {len(p2)} link, {len(new)} link mới so với trang 1" + ("  <-- DÙNG ĐƯỢC" if new else ""))
        time.sleep(1)

    # Trong danh mục có lẫn trang thương hiệu (vot-cau-long-vs...), nên thử lần lượt tới khi gặp sản phẩm thật
    prod = None
    for link in p1[:10]:
        rr = fetch(link)
        if rr is None:
            continue
        prod = parse_product(rr.text, link)
        if prod is not None:
            print(f"== PROBE sản phẩm {link} ==")
            break
        n = len(product_links(BeautifulSoup(rr.text, PARSER), link))
        print(f"  {link}: không phải trang sản phẩm ({n} link bên trong -> "
              f"{'trang thương hiệu/danh mục con' if n >= MIN_LISTING_LINKS else 'không rõ'})")
        time.sleep(1)
    if prod is None:
        print("Không link nào đọc được như sản phẩm. Đã lưu trang đầu vào debug_probe.html để kiểm tra.")
        if p1:
            rr = fetch(p1[0])
            if rr is not None:
                with open("debug_probe.html", "w", encoding="utf-8") as f:
                    f.write(rr.text)
        return
    show_product(prod)


# ----------------------------------------------------------------------------
# Chương trình chính
# ----------------------------------------------------------------------------
def main():
    ap = argparse.ArgumentParser(description="Lấy hàng loạt sản phẩm từ shopvnb.com")
    ap.add_argument("--category", nargs="+", help="slug danh mục, vd giay-cau-long vot-cau-long-yonex")
    ap.add_argument("--url", help="1 trang sản phẩm: in kết quả (thêm --save để tải về)")
    ap.add_argument("--save", action="store_true", help="dùng cùng --url: lưu info.json + ảnh")
    ap.add_argument("--limit", type=int, default=0, help="chỉ lấy N sản phẩm mới")
    ap.add_argument("--max-pages", type=int, default=40)
    ap.add_argument("--no-related", action="store_true")
    ap.add_argument("--sitemap", action="store_true")
    ap.add_argument("--no-images", action="store_true", help="không tải ảnh")
    ap.add_argument("--save-html", action="store_true")
    ap.add_argument("--force", action="store_true")
    ap.add_argument("--probe", action="store_true", help="chỉ kiểm tra phân trang + đọc thử 1 sản phẩm")
    ap.add_argument("--show-robots", action="store_true", help="in robots.txt như script đọc được")
    ap.add_argument("--out", default=os.path.join(os.getcwd(), "products_shopvnb"))
    args = ap.parse_args()

    out_dir = os.path.abspath(args.out)
    work_dir = os.path.dirname(out_dir)
    csv_path = os.path.join(work_dir, "products_shopvnb.csv")
    categories = args.category or DEFAULT_CATEGORIES
    if args.show_robots:
        show_robots()
        return
    rp = load_robots()

    if args.url:
        single_url(args.url, args, out_dir, work_dir, csv_path)
        return
    if args.probe:
        probe(categories, rp)
        return

    os.makedirs(out_dir, exist_ok=True)
    skip_file = os.path.join(out_dir, "_not_product.txt")
    not_product = set(open(skip_file, encoding="utf-8").read().split()) if os.path.exists(skip_file) else set()

    # --- Dữ liệu đã có (tiếp tục từ chỗ dở) ---
    records, queued, queue = {}, set(), deque()
    for d in sorted(os.listdir(out_dir)):
        ip = os.path.join(out_dir, d, "info.json")
        if os.path.exists(ip) and not args.force:
            with open(ip, encoding="utf-8") as jf:
                info = json.load(jf)
            records[info["url"]] = info
            queued.add(info["url"])
    print(f"Đã có sẵn {len(records)} sản phẩm trong {out_dir}")

    def enqueue(urls):
        for u in urls:
            if u not in queued and u not in not_product:
                queued.add(u)
                queue.append(u)

    state = {"pattern": DEFAULT_PAGE_PATTERN}
    listing_done = set()   # các trang thương hiệu/danh mục con đã quét
    new_count, i = 0, 0
    try:
        # --- Thu thập URL từ danh mục ---
        print("Đang quét danh mục ...")
        for cat in categories:
            enqueue(crawl_listing(f"{BASE}/{cat}.html", args.max_pages, rp, state, label=cat))
            time.sleep(random.uniform(*CRAWL_DELAY))
        if args.sitemap:
            su = sitemap_urls(rp)
            print(f"  sitemap: {len(su)} URL (sẽ lọc bỏ trang không phải sản phẩm khi tải)")
            enqueue(su)
        if not args.no_related:
            for info in list(records.values()):
                enqueue(info.get("related_urls", []))
        print(f"Hàng đợi: {len(queue)} URL cần tải")

        # --- Tải từng sản phẩm ---
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
            product = parse_product(r.text, url)
            if product is None:
                sub = product_links(BeautifulSoup(r.text, PARSER), url)
                if len(sub) >= MIN_LISTING_LINKS:
                    # Trang thương hiệu / danh mục con: quét phân trang rồi đưa sản phẩm vào hàng đợi.
                    # Không ghi vào _not_product.txt để lần chạy sau vẫn quét lại được.
                    if url not in listing_done:
                        listing_done.add(url)
                        print(f"  -> Trang danh sách ({len(sub)} link), quét thêm")
                        enqueue(crawl_listing(url, args.max_pages, rp, state, first_html=r.text))
                        print(f"  Hàng đợi hiện có {len(queue)} URL")
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
            print(f"  {product['name']} | giá={product['price']}-{product['price_max']} | "
                  f"size={len(product['sizes'])} | thương hiệu={product['brand']}")
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
    print(f"Bảng tóm tắt: {csv_path}")
    print(f"Chi tiết từng sản phẩm (ảnh, info.json): {out_dir}")


if __name__ == "__main__":
    main()