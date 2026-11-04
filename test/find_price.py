import re
from bs4 import BeautifulSoup

with open("debug_page.html", encoding="utf-8") as f:
    html = f.read()
soup = BeautifulSoup(html, "lxml")

print("=== 1. Thẻ h1 (tên sản phẩm có thể nằm ở đây) ===")
for h in soup.find_all("h1"):
    print(repr(h.get_text(strip=True)[:150]), "| class:", h.get("class"))

print("\n=== 2. Các thẻ có class chứa 'price' ===")
seen = set()
for tag in soup.find_all(class_=re.compile("price", re.I)):
    cls = " ".join(tag.get("class", []))
    text = tag.get_text(" ", strip=True)[:80]
    key = (tag.name, cls, text)
    if key not in seen and text:
        seen.add(key)
        print(f"<{tag.name} class='{cls}'> -> {text!r}")

print("\n=== 3. Các đoạn có chữ 'price' trong mã nguồn (JSON nhúng trong script?) ===")
for m in list(re.finditer(r'"price"', html))[:5]:
    s = max(0, m.start() - 80)
    print("...", html[s:m.end() + 80].replace("\n", " "), "...\n")

print("=== 4. Các số tiền dạng 12.990.000 ===")
for m in list(re.finditer(r"\d{1,3}(?:[.,]\d{3})+\s*(?:₫|đ|VNĐ)", html))[:5]:
    s = max(0, m.start() - 60)
    print("...", html[s:m.end() + 20].replace("\n", " "), "...\n")