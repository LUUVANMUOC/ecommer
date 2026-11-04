#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
gen_sql_diachi_kho.py - Sinh INSERT cho 2 bảng diachi và kho từ link_xa_co_ma.csv.

Mỗi dòng CSV tạo 1 địa chỉ (diachi) và 1 kho (kho) gắn với địa chỉ đó.
Thứ tự trong file: INSERT diachi trước, INSERT kho sau (vì kho có khóa ngoại tới diachi).

Ánh xạ:
  diachi.dc_ma    : "DC" + 8 chữ số, từ --dc-start
  diachi.dc_mota  : "<--mota-prefix> - Xã/Phường, Tỉnh/Thành"
  diachi.dc_gps   : link chỉ đường ô tô (NULL nếu chưa có)
  diachi.xa_ma    : cột xa_ma trong CSV

  kho.kho_ma      : "KH" + 8 chữ số, từ --kho-start
  kho.kho_ten     : "Kho <Xã/Phường>" (cắt còn tối đa 50 ký tự)
  kho.kho_hinhanh : --hinhanh (mặc định chuỗi rỗng, vì cột này NOT NULL)
  kho.dc_ma       : đúng dc_ma của dòng diachi tương ứng
  kho.dvvc_ma     : --dvvc-ma (mặc định DVVC01, phải có trong bảng donvivanchuyen)

Dùng:
  python gen_sql_diachi_kho.py
  python gen_sql_diachi_kho.py --dvvc-ma DVVC01 --out insert_diachi_kho.sql

Trước khi chạy, lấy mã cần thiết và mã lớn nhất hiện có:
  SELECT dvvc_ma FROM donvivanchuyen;
  SELECT max(dc_ma) FROM diachi;
  SELECT max(kho_ma) FROM kho;
"""
import argparse
import csv
import os
import sys


def sql_str(v):
    """Chuỗi SQL có escape dấu nháy đơn; chuỗi rỗng/None -> NULL."""
    if v is None or str(v).strip() == "":
        return "NULL"
    return "'" + str(v).replace("'", "''") + "'"


def sql_text(v):
    """Giống sql_str nhưng chuỗi rỗng vẫn là '' (dùng cho cột NOT NULL)."""
    if v is None:
        return "''"
    return "'" + str(v).replace("'", "''") + "'"


def main():
    ap = argparse.ArgumentParser(description="Sinh INSERT cho bảng diachi và kho từ CSV link xã")
    ap.add_argument("--csv", default="link_xa_co_ma.csv", help="CSV có cột xa_ma")
    ap.add_argument("--dvvc-ma", default="DVVC000001", help="Mã đơn vị vận chuyển (mặc định DVVC01)")
    ap.add_argument("--hinhanh", default="", help="Giá trị kho_hinhanh (mặc định rỗng)")
    ap.add_argument("--dc-start", type=int, default=10000000, help="Số bắt đầu cho dc_ma")
    ap.add_argument("--kho-start", type=int, default=10000000, help="Số bắt đầu cho kho_ma")
    ap.add_argument("--mota-prefix", default="Kho vận chuyển DVVC01",
                    help="Tiền tố của dc_mota")
    ap.add_argument("--out", default="insert_diachi_kho.sql", help="File SQL đầu ra")
    args = ap.parse_args()

    try:
        f_in = open(args.csv, encoding="utf-8-sig", newline="")
    except FileNotFoundError:
        sys.exit("Không tìm thấy file %s. Chạy trong thư mục chứa CSV hoặc dùng --csv đường dẫn đầy đủ."
                 % args.csv)
    with f_in as f:
        rows = list(csv.DictReader(f))
    if not rows:
        sys.exit("CSV rỗng.")
    if "xa_ma" not in rows[0]:
        sys.exit("CSV không có cột xa_ma. Chạy gan_ma_xa.py trước.")

    n_gps = 0
    with open(args.out, "w", encoding="utf-8") as f:
        f.write("BEGIN;\n\n-- diachi\n")
        for i, r in enumerate(rows):
            dc_ma = "DC%08d" % (args.dc_start + i)
            xa = (r.get("Xã/Phường") or "").strip()
            tinh = (r.get("Tỉnh/Thành") or "").strip()
            diachi = ", ".join(p for p in (xa, tinh) if p)
            mota = " - ".join(p for p in (args.mota_prefix.strip(), diachi) if p)
            link = (r.get("Link chỉ đường ô tô") or "").strip()
            if link:
                n_gps += 1
            f.write("INSERT INTO diachi (dc_ma, dc_mota, dc_gps, xa_ma) VALUES (%s, %s, %s, %s) "
                    "ON CONFLICT (dc_ma) DO NOTHING;\n"
                    % (sql_str(dc_ma), sql_str(mota), sql_str(link), sql_str(r["xa_ma"].strip())))

        f.write("\n-- kho\n")
        for i, r in enumerate(rows):
            dc_ma = "DC%08d" % (args.dc_start + i)
            kho_ma = "KH%08d" % (args.kho_start + i)
            xa = (r.get("Xã/Phường") or "").strip()
            kho_ten = ("Kho " + xa)[:50] if xa else "Kho %d" % (args.kho_start + i)
            f.write("INSERT INTO kho (kho_ma, kho_ten, kho_hinhanh, dc_ma, dvvc_ma) "
                    "VALUES (%s, %s, %s, %s, %s) ON CONFLICT (kho_ma) DO NOTHING;\n"
                    % (sql_str(kho_ma), sql_str(kho_ten), sql_text(args.hinhanh),
                       sql_str(dc_ma), sql_str(args.dvvc_ma)))
        f.write("\nCOMMIT;\n")

    print("Đã ghi %s" % os.path.abspath(args.out))
    print("  diachi: %d dòng (%d có dc_gps)" % (len(rows), n_gps))
    print("  kho   : %d dòng" % len(rows))
    print("  dc_ma DC%08d..DC%08d | kho_ma KH%08d..KH%08d" % (
        args.dc_start, args.dc_start + len(rows) - 1, args.kho_start, args.kho_start + len(rows) - 1))


if __name__ == "__main__":
    main()