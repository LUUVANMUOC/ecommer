// frontend/src/components/common/Voucher/VoucherCard.jsx
import { useState, useEffect } from "react";

const VoucherCard = ({ voucher, onEdit, onDelete, onView, onCopy }) => {
  const {
    MGG_San_Ma = "N/A",
    MGG_San_Ten = "Chưa có tên",
    MGG_San_PhanTramGiam = 0,
    MGG_San_GiaTriDonToiThieu = 0,
    MGG_San_SoLuongConLai = 0,
    MGG_San_SoLuongBanDau = 1,
    MGG_San_SoTienToiDaMoiLan = 0,
    MGG_San_HinhAnh,
    MGG_San_ThoiDiemBatDau,
    MGG_San_ThoiDiemKetThuc,
    MGG_San_TrangThai = false,
  } = voucher;

  const [now, setNow] = useState(new Date().getTime());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date().getTime()), 1000);
    return () => clearInterval(timer);
  }, []);

  // ==========================================
  // TÍNH TOÁN TRẠNG THÁI THỰC TẾ
  // ==========================================
  const endDate = MGG_San_ThoiDiemKetThuc
    ? new Date(MGG_San_ThoiDiemKetThuc).getTime()
    : null;
  const isTimeExpired = endDate ? now > endDate : false;
  const isOutOfStock = Number(MGG_San_SoLuongConLai) <= 0;
  const isValid = !isTimeExpired && !isOutOfStock && MGG_San_TrangThai;

  let stampText = "";
  if (!isValid) {
    if (isTimeExpired) stampText = "Hết hạn";
    else if (isOutOfStock) stampText = "Hết lượt";
    else stampText = "Tạm dừng";
  }

  const getImageUrl = (url) => {
    if (!url) return null;
    if (
      url.startsWith("http") ||
      url.startsWith("data:image") ||
      url.startsWith("blob:")
    )
      return url;
    return `http://localhost:8080${url.startsWith("/") ? "" : "/"}${url}`;
  };

  const formatDateWithTime = (dateStr) => {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${hours}:${minutes} ${day}/${month}/${year}`;
  };

  // Logic thanh số lượng
  const totalQty = Number(MGG_San_SoLuongBanDau) || 1;
  const remainingQty = Number(MGG_San_SoLuongConLai) || 0;
  const usedQtyPercentage = Math.min(
    Math.max(((totalQty - remainingQty) / totalQty) * 100, 0),
    100,
  );
  const isLowStock = remainingQty <= totalQty * 0.1;

  // Logic thanh thời gian
  const startDate = MGG_San_ThoiDiemBatDau
    ? new Date(MGG_San_ThoiDiemBatDau).getTime()
    : null;
  let timePercentage = 0;
  let timeText = "Không xác định";

  if (startDate && endDate) {
    const totalTime = endDate - startDate;
    const passedTime = now - startDate;

    if (isTimeExpired) {
      timePercentage = 100;
      timeText = "Đã kết thúc";
    } else if (now < startDate) {
      timePercentage = 0;
      timeText = "Chưa bắt đầu";
    } else {
      timePercentage = Math.min(
        Math.max((passedTime / totalTime) * 100, 0),
        100,
      );
      const diff = endDate - now;
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
      );
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      timeText =
        days > 0
          ? `Còn ${days}n ${hours}h ${minutes}m ${seconds}s`
          : `Còn ${hours}h ${minutes}m ${seconds}s`;
    }
  }

  return (
    <article
      onClick={() => onView(voucher)}
      className={`relative bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm transition-all duration-200 group flex flex-col justify-between cursor-pointer
      ${!isValid ? "opacity-70 grayscale bg-surface-container-low/80" : "hover:shadow-md hover:border-primary/30"}`}
    >
      {/* HIỆU ỨNG MỘC ĐỎ (Đã bỏ backdrop-blur để tránh lỗi lag màn hình) */}
      {!isValid && (
        <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none overflow-hidden">
          <div className="border-4 border-red-600 text-red-600 text-2xl font-black px-6 py-2 uppercase tracking-widest rounded-lg transform -rotate-12 bg-white/80 shadow-xl">
            {stampText}
          </div>
        </div>
      )}

      <div className="absolute top-1/2 -translate-y-1/2 -left-[7px] w-3.5 h-3.5 bg-[#faf8ff] rounded-full shadow-[inset_-1px_0_0_0_#c7c4d8]"></div>
      <div className="absolute top-1/2 -translate-y-1/2 -right-[7px] w-3.5 h-3.5 bg-[#faf8ff] rounded-full shadow-[inset_1px_0_0_0_#c7c4d8]"></div>

      <div>
        <div className="p-5 pb-4 border-b border-dashed border-outline-variant flex items-start gap-4">
          <div className="w-16 h-16 rounded-lg bg-surface-container flex-shrink-0 overflow-hidden border border-outline-variant/60 flex items-center justify-center">
            {MGG_San_HinhAnh ? (
              <img
                className="w-full h-full object-cover"
                src={getImageUrl(MGG_San_HinhAnh)}
                alt={MGG_San_Ten}
              />
            ) : (
              <span className="material-symbols-outlined text-outline text-2xl">
                image
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-1">
              <span className="inline-flex items-center px-3 py-1 rounded-md text-sm font-extrabold bg-primary text-on-primary shadow-sm tracking-wide">
                -{MGG_San_PhanTramGiam}%
              </span>
              <span
                className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${isValid ? "text-tertiary-container bg-tertiary-fixed/50" : "text-error bg-error-container/60"}`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${isValid ? "bg-tertiary" : "bg-error"}`}
                ></span>
                {isValid ? "Đang chạy" : stampText}
              </span>
            </div>
            <h3
              className="text-headline-sm font-headline-sm text-on-surface font-bold truncate mt-1.5 group-hover:text-primary transition-colors"
              title={MGG_San_Ten}
            >
              {MGG_San_Ten}
            </h3>
            <p className="text-label-sm font-label-sm text-outline flex items-center gap-1 mt-0.5">
              <span className="material-symbols-outlined text-xs">savings</span>
              Giảm tối đa:{" "}
              <span className="font-semibold text-on-surface-variant">
                {Number(MGG_San_SoTienToiDaMoiLan) > 0
                  ? `${Number(MGG_San_SoTienToiDaMoiLan).toLocaleString("vi-VN")} ₫`
                  : "Không giới hạn"}
              </span>
            </p>
          </div>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between bg-surface-container-low px-3 py-2 rounded-lg border border-outline-variant/40">
            <div>
              <span className="text-[10px] uppercase font-bold text-outline block leading-none">
                MÃ VOUCHER
              </span>
              <span className="font-mono font-bold text-headline-sm text-primary tracking-wider">
                {MGG_San_Ma}
              </span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCopy(MGG_San_Ma);
              }}
              disabled={!isValid}
              className="flex items-center gap-1 text-label-sm font-label-sm font-semibold text-on-surface hover:text-primary bg-surface-container-lowest px-2 py-1 rounded border border-outline-variant shadow-sm transition-colors disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-sm">
                content_copy
              </span>
              <span>Copy</span>
            </button>
          </div>

          <div className="flex items-center justify-between text-body-sm font-body-sm text-on-surface-variant">
            <span className="text-outline">Đơn tối thiểu:</span>
            <span className="font-semibold text-on-surface">
              {Number(MGG_San_GiaTriDonToiThieu).toLocaleString("vi-VN")} ₫
            </span>
          </div>

          <div>
            <div className="flex items-center justify-between text-label-sm font-label-sm mb-1">
              <span className="text-outline">Số lượng đã dùng:</span>
              <span className="font-semibold text-on-surface">
                <strong className={isLowStock ? "text-error" : "text-primary"}>
                  {totalQty - remainingQty}
                </strong>
                <span className="text-outline text-xs font-normal">
                  {" "}
                  / {totalQty} (Còn {remainingQty})
                </span>
              </span>
            </div>
            <div className="w-full bg-surface-container-high rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-1.5 rounded-full transition-all duration-500 ${remainingQty === 0 ? "bg-error" : isLowStock ? "bg-amber-500" : "bg-primary-container"}`}
                style={{ width: `${usedQtyPercentage}%` }}
              ></div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between text-label-sm font-label-sm mb-1">
              <span className="text-outline">Thời gian:</span>
              <span
                className={`font-mono font-semibold ${isTimeExpired ? "text-error" : timePercentage > 90 ? "text-amber-600" : "text-tertiary-container"}`}
              >
                {timeText}
              </span>
            </div>
            <div className="w-full bg-surface-container-high rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-1.5 rounded-full transition-all duration-1000 ease-linear ${isTimeExpired ? "bg-error" : timePercentage > 90 ? "bg-amber-500" : "bg-tertiary"}`}
                style={{ width: `${timePercentage}%` }}
              ></div>
            </div>
            <div className="flex justify-between items-center text-xs text-outline mt-1.5 font-medium">
              <span>{formatDateWithTime(MGG_San_ThoiDiemBatDau)}</span>
              <span>{formatDateWithTime(MGG_San_ThoiDiemKetThuc)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="px-5 py-4 bg-surface-container-low/60 border-t border-outline-variant/60 flex items-center justify-center relative z-30">
        <div className="flex items-center gap-6">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onView(voucher);
            }}
            className="p-2 rounded-lg text-outline hover:text-primary hover:bg-surface-container transition-colors"
            title="Xem chi tiết"
          >
            <span className="material-symbols-outlined text-xl">
              visibility
            </span>
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(voucher);
            }}
            className="p-2 rounded-lg text-outline hover:text-on-surface hover:bg-surface-container transition-colors"
            title="Chỉnh sửa"
          >
            <span className="material-symbols-outlined text-xl">edit</span>
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(MGG_San_Ma, MGG_San_Ten);
            }}
            className="p-2 rounded-lg text-outline hover:text-error hover:bg-surface-container transition-colors"
            title="Xóa"
          >
            <span className="material-symbols-outlined text-xl">delete</span>
          </button>
        </div>
      </div>
    </article>
  );
};

export default VoucherCard;
