import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import phieuKhoService from "../../services/quanlykho/phieuKhoService";
import { formatVND } from "../../components/shop/SanPhamShared";
import { toAssetUrl } from "../../utils/accountUtils";
import ToastNotification from "../../components/common/Crud/ToastNotification";

const LY_DO_LABEL = {
  TU_LSP01: "Nhập kho từ Shipper LSP01 (lấy hàng từ Shop)",
  TRUNG_CHUYEN_DI: "Xuất kho gửi trung chuyển (LSP02)",
  TRUNG_CHUYEN_DEN: "Nhập kho từ trung chuyển (LSP02)",
  GIAO_LSP03: "Xuất kho giao cho Shipper LSP03",
};

const TRANG_THAI_LABEL = {
  CHO_XAC_NHAN: {
    label: "Chờ xác nhận",
    color: "bg-yellow-50 text-yellow-700",
  },
  DA_XAC_NHAN: { label: "Đã xác nhận", color: "bg-green-50 text-green-700" },
  CO_VAN_DE: { label: "Có vấn đề", color: "bg-red-50 text-red-700" },
};

const ChiTietPhieuKho = () => {
  const { pk_ma } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });
  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast((p) => ({ ...p, show: false })), 3000);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await phieuKhoService.getChiTiet(pk_ma);
        setData(res.data);
      } catch (err) {
        showToast(
          err.response?.data?.message || "Không tìm thấy phiếu",
          "error",
        );
        setTimeout(() => navigate("/quan-ly-kho/phieu-kho/lich-su"), 1500);
      } finally {
        setLoading(false);
      }
    };
    if (pk_ma) fetchData();
  }, [pk_ma]);

  const formatDateTime = (iso) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // ================= PRINT =================
  const handlePrint = () => {
    if (!data) return;

    const isNhap = data.Loai === "NHAP";
    const title = isNhap ? "PHIẾU NHẬP KHO" : "PHIẾU XUẤT KHO";
    const ttLabel = TRANG_THAI_LABEL[data.TrangThai]?.label || data.TrangThai;

    const itemsRows = data.items
      .map(
        (it, idx) => `
      <tr>
        <td style="text-align:center;">${idx + 1}</td>
        <td>${it.TenSanPham}${it.TenPhanLoai ? ` <i>(${it.TenPhanLoai})</i>` : ""}</td>
        <td style="text-align:center;">${it.SoLuong}</td>
        <td style="text-align:right;">${Number(it.DonGia).toLocaleString("vi-VN")} đ</td>
        <td style="text-align:right;">${Number(it.ThanhTien).toLocaleString("vi-VN")} đ</td>
      </tr>
    `,
      )
      .join("");

    const tongTien = data.TongTien
      ? Number(data.TongTien).toLocaleString("vi-VN")
      : "0";

    const imgUrl = data.HinhAnh ? toAssetUrl(data.HinhAnh) : null;
    const imgHtml = imgUrl
      ? `<div style="margin-top:8px;"><b>Ảnh minh chứng:</b><br/><img src="${imgUrl}" style="max-width:120px;max-height:120px;border:1px solid #ccc;margin-top:4px;"/></div>`
      : "";

    const html = `
      <!DOCTYPE html>
      <html lang="vi">
      <head>
        <meta charset="UTF-8"/>
        <title>${title} - ${data.PK_Ma}</title>
        <style>
          @page { size: A5; margin: 8mm; }
          * { box-sizing: border-box; }
          body {
            font-family: 'Arial', sans-serif;
            font-size: 11px;
            color: #000;
            margin: 0;
            padding: 0;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2px solid #333;
            padding-bottom: 8px;
            margin-bottom: 10px;
          }
          .header-left { flex: 1; }
          .logo {
            width: 50px; height: 50px; object-fit: contain;
          }
          .company-name {
            font-size: 14px; font-weight: bold; margin-bottom: 2px;
          }
          .company-info { font-size: 10px; color: #555; line-height: 1.3; }
          .title {
            text-align: center; font-size: 16px; font-weight: bold;
            margin: 10px 0 4px 0; letter-spacing: 1px;
          }
          .subtitle { text-align: center; font-size: 11px; color: #555; margin-bottom: 12px; }
          .meta-table {
            width: 100%; margin-bottom: 10px; font-size: 11px;
          }
          .meta-table td { padding: 3px 4px; vertical-align: top; }
          .meta-table td:first-child { width: 100px; color: #555; }
          .info-box {
            border: 1px solid #ddd; border-radius: 4px;
            padding: 8px; margin-bottom: 10px; font-size: 11px;
          }
          .info-row { display: flex; margin-bottom: 4px; }
          .info-row .label { width: 100px; color: #555; }
          .info-row .value { flex: 1; font-weight: 600; }
          table.items {
            width: 100%; border-collapse: collapse;
            margin: 8px 0; font-size: 10px;
          }
          table.items th {
            background: #f0f0f0; border: 1px solid #999;
            padding: 5px 4px; text-align: center; font-weight: bold;
          }
          table.items td {
            border: 1px solid #999; padding: 4px 4px; vertical-align: top;
          }
          .signature {
            display: flex; justify-content: space-between;
            margin-top: 20px; padding-top: 10px; page-break-inside: avoid;
          }
          .sig-box { text-align: center; width: 45%; }
          .sig-title { font-weight: bold; margin-bottom: 50px; font-size: 11px; }
          .sig-line { border-top: 1px dashed #666; padding-top: 4px; font-size: 10px; color: #555; }
          .status-badge {
            display: inline-block; padding: 2px 8px; border-radius: 3px;
            font-size: 10px; font-weight: bold;
            ${data.TrangThai === "DA_XAC_NHAN" ? "background:#d4edda;color:#155724;" : ""}
            ${data.TrangThai === "CHO_XAC_NHAN" ? "background:#fff3cd;color:#856404;" : ""}
            ${data.TrangThai === "CO_VAN_DE" ? "background:#f8d7da;color:#721c24;" : ""}
          }
          .footer {
            text-align: center; font-size: 9px; color: #999;
            margin-top: 15px; border-top: 1px solid #ddd; padding-top: 6px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="header-left">
            ${data.Kho_HinhAnh ? `<img src="${toAssetUrl(data.Kho_HinhAnh)}" class="logo"/>` : ""}
            <div class="company-name">${data.Kho_Ten || "KHO"}</div>
            <div class="company-info">
              ${data.DVVC_Ten ? `Đơn vị vận chuyển: ${data.DVVC_Ten}<br/>` : ""}
              ${data.Kho_DiaChi || ""}${data.Kho_Xa ? `, ${data.Kho_Xa}` : ""}${data.Kho_Tinh ? `, ${data.Kho_Tinh}` : ""}
            </div>
          </div>
        </div>

        <div class="title">${title}</div>
        <div class="subtitle">Mã phiếu: <b>${data.PK_Ma}</b></div>

        <table class="meta-table">
          <tr>
            <td>Ngày tạo:</td>
            <td>${formatDateTime(data.ThoiGianTao)}</td>
            <td>Trạng thái:</td>
            <td><span class="status-badge">${ttLabel}</span></td>
          </tr>
          ${
            data.ThoiGianXacNhan
              ? `
          <tr>
            <td>Xác nhận lúc:</td>
            <td>${formatDateTime(data.ThoiGianXacNhan)}</td>
            <td></td><td></td>
          </tr>`
              : ""
          }
          <tr>
            <td>Lý do:</td>
            <td colspan="3"><b>${LY_DO_LABEL[data.LyDo] || data.LyDo}</b></td>
          </tr>
        </table>

        <div class="info-box">
          <div class="info-row">
            <span class="label">Mã đơn:</span>
            <span class="value">${data.DTS_Ma}</span>
          </div>
          <div class="info-row">
            <span class="label">Gian hàng:</span>
            <span class="value">${data.TenShop}</span>
          </div>
          <div class="info-row">
            <span class="label">Shipper:</span>
            <span class="value">${data.Shipper_Ten || "—"}${data.Shipper_SDT ? ` (${data.Shipper_SDT})` : ""}</span>
          </div>
          <div class="info-row">
            <span class="label">Khách nhận:</span>
            <span class="value">${data.TenKhach || "—"}${data.SdtKhach ? ` - ${data.SdtKhach}` : ""}</span>
          </div>
          <div class="info-row">
            <span class="label">Địa chỉ giao:</span>
            <span class="value">${data.DiaChiGiao || "—"}</span>
          </div>
        </div>

        <table class="items">
          <thead>
            <tr>
              <th style="width:30px;">STT</th>
              <th>Sản phẩm</th>
              <th style="width:40px;">SL</th>
              <th style="width:90px;">Đơn giá</th>
              <th style="width:100px;">Thành tiền</th>
            </tr>
          </thead>
          <tbody>
            ${itemsRows}
            <tr>
              <td colspan="4" style="text-align:right;font-weight:bold;">Tổng cộng:</td>
              <td style="text-align:right;font-weight:bold;color:#c00;">${tongTien} đ</td>
            </tr>
          </tbody>
        </table>

        ${data.GhiChu ? `<div style="margin-top:8px;"><b>Ghi chú:</b> ${data.GhiChu}</div>` : ""}
        ${imgHtml}

        <div class="signature">
          <div class="sig-box">
            <div class="sig-title">NGƯỜI GIAO</div>
            <div class="sig-line">(Ký, ghi rõ họ tên)</div>
          </div>
          <div class="sig-box">
            <div class="sig-title">NGƯỜI NHẬN</div>
            <div class="sig-line">(Ký, ghi rõ họ tên)</div>
          </div>
        </div>

        <div class="footer">
          Phiếu được tạo tự động bởi hệ thống • ${data.PK_Ma}
        </div>
      </body>
      </html>
    `;

    const win = window.open("", "_blank", "width=800,height=600");
    win.document.open();
    win.document.write(html);
    win.document.close();
    win.onload = () => {
      setTimeout(() => win.print(), 300);
    };
  };

  // ================= RENDER =================
  if (loading) {
    return (
      <div className="p-10 text-center font-medium text-gray-500">
        Đang tải...
      </div>
    );
  }

  if (!data) return null;

  const isNhap = data.Loai === "NHAP";
  const ttCfg = TRANG_THAI_LABEL[data.TrangThai] || {
    label: data.TrangThai,
    color: "bg-gray-50 text-gray-700",
  };

  return (
    <div className="p-6 bg-[#F8FAFC] min-h-screen">
      {/* Header actions */}
      <div className="mb-6 flex justify-between items-center flex-wrap gap-3">
        <div>
          <button
            onClick={() => navigate("/quan-ly-kho/phieu-kho/lich-su")}
            className="text-sm text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-1 mb-2"
          >
            <span className="material-symbols-outlined text-[18px]">
              arrow_back
            </span>
            Về lịch sử phiếu
          </button>
          <h1 className="text-2xl font-bold text-[#0F172A]">
            {isNhap ? "Phiếu Nhập Kho" : "Phiếu Xuất Kho"}
          </h1>
          <p className="text-sm text-[#64748B] mt-1">
            Mã phiếu: <b className="text-indigo-600 font-mono">{data.PK_Ma}</b>
          </p>
        </div>
        <button
          onClick={handlePrint}
          className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold shadow-sm hover:bg-indigo-700 transition-colors flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-[20px]">print</span>
          In phiếu
        </button>
      </div>

      {/* Card thông tin */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cột trái — thông tin chung */}
        <div className="lg:col-span-2 space-y-6">
          {/* Thông tin kho + trạng thái */}
          <div className="bg-white rounded-2xl shadow-sm border border-[#E2E8F0] p-6">
            <div className="flex justify-between items-start mb-4 border-b pb-4">
              <div className="flex items-center gap-3">
                <img
                  src={toAssetUrl(data.Kho_HinhAnh)}
                  alt=""
                  className="w-14 h-14 rounded-xl object-cover border border-[#E2E8F0]"
                  onError={(e) => {
                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      data.Kho_Ten || "K",
                    )}&background=4f46e5&color=fff`;
                  }}
                />
                <div>
                  <p className="font-bold text-[#0F172A]">{data.Kho_Ten}</p>
                  <p className="text-xs text-[#64748B]">{data.DVVC_Ten}</p>
                  <p className="text-xs text-[#64748B]">
                    {data.Kho_DiaChi}
                    {data.Kho_Xa && `, ${data.Kho_Xa}`}
                    {data.Kho_Tinh && `, ${data.Kho_Tinh}`}
                  </p>
                </div>
              </div>
              <span
                className={`text-xs px-3 py-1.5 rounded-lg font-bold ${ttCfg.color}`}
              >
                {ttCfg.label}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">
                  Loại nghiệp vụ
                </p>
                <p className="font-bold text-[#0F172A]">
                  {LY_DO_LABEL[data.LyDo] || data.LyDo}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">
                  Ngày tạo
                </p>
                <p className="font-medium text-[#0F172A]">
                  {formatDateTime(data.ThoiGianTao)}
                </p>
              </div>
              {data.ThoiGianXacNhan && (
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">
                    Xác nhận lúc
                  </p>
                  <p className="font-medium text-[#0F172A]">
                    {formatDateTime(data.ThoiGianXacNhan)}
                  </p>
                </div>
              )}
              {data.GhiChu && (
                <div className="col-span-2">
                  <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">
                    Ghi chú
                  </p>
                  <p className="text-[#0F172A] italic">{data.GhiChu}</p>
                </div>
              )}
            </div>
          </div>

          {/* Đơn hàng liên quan */}
          <div className="bg-white rounded-2xl shadow-sm border border-[#E2E8F0] p-6">
            <h3 className="text-lg font-bold text-[#0F172A] mb-4 border-b pb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-indigo-600">
                receipt_long
              </span>
              Đơn hàng liên quan
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">
                  Mã đơn
                </p>
                <p className="font-mono font-bold text-indigo-600">
                  {data.DTS_Ma}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">
                  Gian hàng
                </p>
                <p className="font-bold text-[#0F172A]">{data.TenShop}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">
                  Khách nhận
                </p>
                <p className="font-medium text-[#0F172A]">{data.TenKhach}</p>
                <p className="text-xs text-[#64748B]">{data.SdtKhach}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">
                  Tổng tiền đơn
                </p>
                <p className="font-bold text-red-600">
                  {formatVND(data.TongTien)}
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">
                  Địa chỉ giao
                </p>
                <p className="text-[#0F172A]">{data.DiaChiGiao}</p>
              </div>
            </div>
          </div>

          {/* Danh sách sản phẩm */}
          <div className="bg-white rounded-2xl shadow-sm border border-[#E2E8F0] p-6">
            <h3 className="text-lg font-bold text-[#0F172A] mb-4 border-b pb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-indigo-600">
                inventory_2
              </span>
              Sản phẩm ({data.items.length})
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#F8FAFC] text-[#64748B] text-xs">
                    <th className="p-3 text-left font-semibold">Sản phẩm</th>
                    <th className="p-3 text-center font-semibold w-20">SL</th>
                    <th className="p-3 text-right font-semibold w-32">
                      Đơn giá
                    </th>
                    <th className="p-3 text-right font-semibold w-32">
                      Thành tiền
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9]">
                  {data.items.map((it, idx) => (
                    <tr key={idx}>
                      <td className="p-3">
                        <p className="font-medium text-[#0F172A]">
                          {it.TenSanPham}
                        </p>
                        {it.TenPhanLoai && (
                          <p className="text-xs text-[#64748B]">
                            {it.TenPhanLoai}
                          </p>
                        )}
                      </td>
                      <td className="p-3 text-center font-bold">
                        {it.SoLuong}
                      </td>
                      <td className="p-3 text-right text-[#64748B]">
                        {formatVND(it.DonGia)}
                      </td>
                      <td className="p-3 text-right font-bold text-[#0F172A]">
                        {formatVND(it.ThanhTien)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Cột phải — shipper + ảnh */}
        <div className="space-y-6">
          {/* Shipper */}
          {data.Shipper_Ten && (
            <div className="bg-white rounded-2xl shadow-sm border border-[#E2E8F0] p-6">
              <h3 className="text-sm font-bold text-[#64748B] uppercase tracking-wider mb-3">
                Shipper
              </h3>
              <div className="flex items-center gap-3">
                <img
                  src={toAssetUrl(data.Shipper_HinhAnh)}
                  alt=""
                  className="w-14 h-14 rounded-full object-cover border border-[#E2E8F0]"
                  onError={(e) => {
                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      data.Shipper_Ten,
                    )}&background=random&color=fff`;
                  }}
                />
                <div>
                  <p className="font-bold text-[#0F172A]">{data.Shipper_Ten}</p>
                  <p className="text-xs text-[#64748B]">{data.Shipper_SDT}</p>
                  <p className="text-xs text-[#64748B] font-mono">
                    {data.Shipper_Ma}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Ảnh minh chứng */}
          {data.HinhAnh && (
            <div className="bg-white rounded-2xl shadow-sm border border-[#E2E8F0] p-6">
              <h3 className="text-sm font-bold text-[#64748B] uppercase tracking-wider mb-3">
                Ảnh minh chứng
              </h3>
              <img
                src={toAssetUrl(data.HinhAnh)}
                alt="Minh chứng"
                className="w-full rounded-xl border border-[#E2E8F0]"
              />
            </div>
          )}

          {/* Khối in */}
          <div className="bg-indigo-50 rounded-2xl border border-indigo-100 p-6">
            <p className="text-sm text-indigo-700 mb-3 flex items-start gap-2">
              <span className="material-symbols-outlined text-[20px]">
                info
              </span>
              In phiếu để lưu trữ hoặc gửi kèm hàng hóa. Phiếu in ở khổ A5.
            </p>
            <button
              onClick={handlePrint}
              className="w-full py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[20px]">
                print
              </span>
              In phiếu ngay
            </button>
          </div>
        </div>
      </div>

      <ToastNotification toast={toast} />
    </div>
  );
};

export default ChiTietPhieuKho;
