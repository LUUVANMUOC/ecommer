import json
import re
import requests
from bs4 import BeautifulSoup

URL = "https://laptopworld.vn/mainboard-darkflash-h510-v4m"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; PriceResearchBot/1.0; contact: ban@email.com)",
    "Accept-Language": "vi-VN,vi;q=0.9",
}

r = requests.get(URL, headers=HEADERS, timeout=20)
print("HTTP:", r.status_code, "| Kích thước:", len(r.text), "ký tự")

with open("debug_page.html", "w", encoding="utf-8") as f:
    f.write(r.text)

soup = BeautifulSoup(r.text, "lxml")

print("\n--- Tất cả thẻ script[type=ld+json] ---")
for i, tag in enumerate(soup.find_all("script", type="application/ld+json")):
    raw = tag.string or ""
    try:
        data = json.loads(raw)
        kind = data.get("@type") if isinstance(data, dict) else "list"
        print(f"[{i}] parse OK, @type = {kind}")
    except json.JSONDecodeError as e:
        print(f"[{i}] LỖI JSON: {e}")
        print("    Đoạn đầu:", raw[:200].replace("\n", " "))

print("\n--- Kiểm tra từ khóa trong HTML ---")
for kw in ['"price"', 'itemprop="price"', 'product-price', 'og:price', '"@type":"Product"', '"@type": "Product"']:
    print(f"{kw!r}: {'có' if kw in r.text else 'không'}")

print("\n--- Các đoạn có chữ 'đ' hoặc 'VNĐ' ---")
for m in re.finditer(r".{0,60}(₫|đ|VNĐ).{0,20}", soup.get_text(" ")):
    print("  ", m.group(0).strip())
    break