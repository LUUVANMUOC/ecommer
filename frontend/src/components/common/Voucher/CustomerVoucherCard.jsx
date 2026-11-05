// src/components/common/Voucher/CustomerVoucherCard.jsx
import { useMemo } from "react";
import { formatVND } from "../../shop/SanPhamShared";

// 🎨 Bảng màu pastel
const COLOR_PALETTES = [
  {
    bg: "bg-blue-50",
    border: "border-blue-200",
    text: "text-blue-600",
    codeBg: "bg-blue-100",
  },
  {
    bg: "bg-green-50",
    border: "border-green-200",
    text: "text-green-600",
    codeBg: "bg-green-100",
  },
  {
    bg: "bg-orange-50",
    border: "border-orange-200",
    text: "text-orange-600",
    codeBg: "bg-orange-100",
  },
  {
    bg: "bg-purple-50",
    border: "border-purple-200",
    text: "text-purple-600",
    codeBg: "bg-purple-100",
  },
  {
    bg: "bg-pink-50",
    border: "border-pink-200",
    text: "text-pink-600",
    codeBg: "bg-pink-100",
  },
];

const CustomerVoucherCard = ({ voucher, onClick }) => {
  const colorTheme = useMemo(() => {
    if (!voucher?.MGG_San_Ma) return COLOR_PALETTES[0];
    const charCode = voucher.MGG_San_Ma.charCodeAt(
      voucher.MGG_San_Ma.length - 1,
    );
    return COLOR_PALETTES[charCode % COLOR_PALETTES.length];
  }, [voucher?.MGG_San_Ma]);

  // 🕒 Tính toán thời gian
  const getTimeData = () => {
    const now = new Date().getTime();
    const end = voucher?.MGG_San_ThoiDiemKetThuc
      ? new Date(voucher.MGG_San_ThoiDiemKetThuc).getTime()
      : now;

    // Nếu không có ngày bắt đầu, giả định thời hạn voucher là 30 ngày để vẽ thanh
    const start = voucher?.MGG_San_ThoiDiemBatDau
      ? new Date(voucher.MGG_San_ThoiDiemBatDau).getTime()
      : end - 30 * 24 * 60 * 60 * 1000;

    const timeLeft = end - now;
    const totalTime = end - start;
    const timePercent =
      totalTime > 0
        ? Math.min(100, Math.max(0, (timeLeft / totalTime) * 100))
        : 0;

    let timeString = "Không giới hạn";
    if (timeLeft <= 0) timeString = "Hết hạn";
    else {
      const d = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
      const h = Math.floor(
        (timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
      );
      const m = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
      if (d > 0) timeString = `Còn ${d} ngày ${h}h`;
      else if (h > 0) timeString = `Còn ${h}h ${m}m`;
      else timeString = `Còn ${m}m`;
    }
    return { timeString, timePercent };
  };

  // 📦 Tính toán số lượng
  const totalQty = voucher.MGG_San_SoLuongBanDau || 100;
  const remainQty = voucher.MGG_San_SoLuongConLai || 0;
  const usedQty = totalQty - remainQty;
  const qtyPercent = Math.min(100, Math.max(0, (usedQty / totalQty) * 100));

  const { timeString, timePercent } = getTimeData();

  // 🟢 Làm tròn phần trăm giảm giá (VD: 10.00 -> 10)
  const phanTramGiam = Math.round(Number(voucher.MGG_San_PhanTramGiam));

  return (
    <div
      onClick={onClick}
      className={`relative flex w-[320px] h-[165px] rounded-xl border ${colorTheme.border} ${colorTheme.bg} cursor-pointer overflow-hidden transition-all duration-300 hover:shadow-md hover:-translate-y-1 group`}
    >
      {/* CỘT TRÁI: Giảm giá */}
      <div
        className={`w-[85px] flex flex-col items-center justify-center border-r border-dashed ${colorTheme.border} p-2 relative shrink-0`}
      >
        <div
          className={`absolute -right-2.5 -top-2.5 w-5 h-5 bg-white rounded-full border-b border-l ${colorTheme.border}`}
        ></div>
        <div
          className={`absolute -right-2.5 -bottom-2.5 w-5 h-5 bg-white rounded-full border-t border-l ${colorTheme.border}`}
        ></div>

        {/* 🟢 Đã giảm size font và bỏ số thập phân để không bị tràn */}
        <span
          className={`text-[26px] font-black ${colorTheme.text} leading-none whitespace-nowrap`}
        >
          {phanTramGiam}%
        </span>
        <span className="text-[10px] font-bold text-gray-500 mt-1.5 uppercase text-center leading-tight">
          Giảm
          <br />
          Giá
        </span>
      </div>

      {/* CỘT PHẢI */}
      <div className="flex-1 p-3 flex flex-col justify-between">
        <div className="flex justify-between items-center text-[11px]">
          <span className="text-gray-500">Đơn tối thiểu:</span>
          <span className="font-bold text-gray-800">
            {formatVND(voucher.MGG_San_GiaTriDonToiThieu)}
          </span>
        </div>

        {/* Thanh 1: Số lượng */}
        <div>
          <div className="flex justify-between text-[10px] mb-1">
            <span className="text-gray-500">Số lượng đã dùng:</span>
            <span className="font-bold text-gray-700">
              {usedQty} / {totalQty}{" "}
              <span className="font-normal text-gray-500">
                (Còn {remainQty})
              </span>
            </span>
          </div>
          <div className="w-full bg-gray-200/80 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-[#2563EB] h-full rounded-full transition-all duration-500"
              style={{ width: `${qtyPercent}%` }}
            ></div>
          </div>
        </div>

        {/* Thanh 2: Thời gian */}
        <div>
          <div className="flex justify-between text-[10px] mb-1">
            <span className="text-gray-500">Thời gian:</span>
            <span className="font-bold text-orange-500">{timeString}</span>
          </div>
          <div className="w-full bg-gray-200/80 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-orange-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${timePercent}%` }}
            ></div>
          </div>
        </div>

        {/* Mã Voucher */}
        <div
          className={`${colorTheme.codeBg} rounded-md px-2 py-1 flex justify-between items-center mt-1`}
        >
          <span
            className={`font-mono font-bold text-xs tracking-wider ${colorTheme.text}`}
          >
            {voucher.MGG_San_Ma}
          </span>
          <span className="text-[10px] font-bold text-gray-500 bg-white px-1.5 py-0.5 rounded shadow-sm group-hover:text-[#2563EB]">
            Copy
          </span>
        </div>
      </div>
    </div>
  );
};

export default CustomerVoucherCard;
