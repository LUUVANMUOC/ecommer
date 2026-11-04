// frontend/src/components/common/Voucher/VoucherDetailDrawer.jsx
import React from "react";

const VoucherDetailDrawer = ({ isOpen, onClose, voucher }) => {
  if (!voucher) return null;

  const getImageUrl = (url) => {
    if (!url) return null;
    if (
      url.startsWith("http") ||
      url.startsWith("data:image") ||
      url.startsWith("blob:")
    ) {
      return url;
    }
    return `http://localhost:8080${url.startsWith("/") ? "" : "/"}${url}`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "N/A";
    return date.toLocaleString("vi-VN");
  };

  const formatCurrency = (value) => {
    return `${Number(value || 0).toLocaleString("vi-VN")} ₫`;
  };

  return (
    <>
      <div
        className={`fixed inset-0 bg-[#0F172A]/40 backdrop-blur-[2px] z-40 transition-opacity duration-300 ${
          isOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      ></div>

      <aside
        className={`fixed top-0 right-0 h-full w-full max-w-[450px] bg-surface-container-lowest border-l border-outline-variant shadow-2xl z-50 flex flex-col transition-transform duration-300 transform ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="p-6 border-b border-outline-variant/60 flex items-center justify-between bg-surface-container-low">
          <div>
            <h2 className="text-headline-md font-headline-md font-bold text-on-surface">
              Chi Tiết Mã Giảm Giá
            </h2>
            <p className="text-body-sm font-body-sm text-outline mt-0.5">
              Thông tin chi tiết về chương trình khuyến mãi
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-surface-container text-outline hover:text-on-surface flex items-center justify-center transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="flex flex-col items-center justify-center p-6 bg-surface-container-low rounded-xl border border-outline-variant/50">
            {voucher.MGG_San_HinhAnh ? (
              <img
                src={getImageUrl(voucher.MGG_San_HinhAnh)}
                alt="Banner Voucher"
                className="w-full h-32 object-cover rounded-lg mb-4 border border-outline-variant/30"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src =
                    "https://via.placeholder.com/400x150?text=Anh+Khong+Kha+Dung";
                }}
              />
            ) : (
              <div className="w-16 h-16 bg-surface-container text-primary rounded-lg flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-3xl">
                  confirmation_number
                </span>
              </div>
            )}
            <h3 className="font-mono font-bold text-2xl text-primary tracking-widest border-2 border-dashed border-primary/40 px-4 py-2 rounded-lg bg-surface-container-lowest">
              {voucher.MGG_San_Ma || "N/A"}
            </h3>
            <p className="text-label-sm text-outline mt-2 uppercase tracking-wide">
              Mã Giảm Giá
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-label-sm font-label-sm text-outline block mb-1">
                Tên chương trình
              </label>
              <p className="text-body-md font-semibold text-on-surface">
                {voucher.MGG_San_Ten || "Chưa cập nhật"}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-label-sm font-label-sm text-outline block mb-1">
                  Phần trăm giảm
                </label>
                <p className="text-body-md font-semibold text-primary">
                  {voucher.MGG_San_PhanTramGiam || 0}%
                </p>
              </div>
              <div>
                <label className="text-label-sm font-label-sm text-outline block mb-1">
                  Giảm tối đa/lượt
                </label>
                <p className="text-body-md font-semibold text-primary">
                  {Number(voucher.MGG_San_SoTienToiDaMoiLan) > 0
                    ? formatCurrency(voucher.MGG_San_SoTienToiDaMoiLan)
                    : "Không giới hạn"}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-label-sm font-label-sm text-outline block mb-1">
                  Đơn tối thiểu
                </label>
                <p className="text-body-md font-semibold text-on-surface">
                  {formatCurrency(voucher.MGG_San_GiaTriDonToiThieu)}
                </p>
              </div>
              <div>
                <label className="text-label-sm font-label-sm text-outline block mb-1">
                  Trạng thái
                </label>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-label-sm font-semibold ${voucher.MGG_San_TrangThai ? "bg-tertiary-fixed/50 text-tertiary-container" : "bg-error-container/60 text-error"}`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${voucher.MGG_San_TrangThai ? "bg-tertiary" : "bg-error"}`}
                  ></span>
                  {voucher.MGG_San_TrangThai ? "Đang hoạt động" : "Tạm dừng"}
                </span>
              </div>
            </div>

            {/* THÊM MỚI: Số lượng ban đầu */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-label-sm font-label-sm text-outline block mb-1">
                  Tổng phát hành
                </label>
                <p className="text-body-md font-semibold text-on-surface">
                  {voucher.MGG_San_SoLuongBanDau || 0}
                </p>
              </div>
              <div>
                <label className="text-label-sm font-label-sm text-outline block mb-1">
                  Số lượng còn lại
                </label>
                <p className="text-body-md font-semibold text-primary">
                  {voucher.MGG_San_SoLuongConLai || 0}
                </p>
              </div>
            </div>

            <div>
              <label className="text-label-sm font-label-sm text-outline block mb-1">
                Danh mục / Gian hàng (STMDTL_Ma)
              </label>
              <p className="text-body-md font-mono text-on-surface">
                {voucher.STMDTL_Ma || "N/A"}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-label-sm font-label-sm text-outline block mb-1">
                  Thời gian bắt đầu
                </label>
                <p className="text-body-md text-on-surface">
                  {formatDate(voucher.MGG_San_ThoiDiemBatDau)}
                </p>
              </div>
              <div>
                <label className="text-label-sm font-label-sm text-outline block mb-1">
                  Thời gian kết thúc
                </label>
                <p className="text-body-md text-on-surface">
                  {formatDate(voucher.MGG_San_ThoiDiemKetThuc)}
                </p>
              </div>
            </div>

            <div>
              <label className="text-label-sm font-label-sm text-outline block mb-1">
                Mô tả & Điều kiện
              </label>
              <div className="p-3 bg-surface-container-lowest border border-outline-variant/50 rounded-lg text-body-sm text-on-surface-variant whitespace-pre-line min-h-[80px]">
                {voucher.MGG_San_Mota || "Không có mô tả chi tiết."}
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default VoucherDetailDrawer;
