// frontend/src/components/common/NotificationBell.jsx
import { useContext, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  CheckCheck,
  Megaphone,
  Percent,
  TicketPercent,
  Truck,
} from "lucide-react";
import { NotificationContext } from "../../contexts/NotificationContext";

const ICON_THEO_LOAI = {
  PHI_CHIET_KHAU: { Icon: Percent, mau: "text-amber-600", nen: "bg-amber-50" },
  CUOC_VAN_CHUYEN: { Icon: Truck, mau: "text-sky-600", nen: "bg-sky-50" },
  MA_GIAM_GIA: {
    Icon: TicketPercent,
    mau: "text-emerald-600",
    nen: "bg-emerald-50",
  },
  HE_THONG: { Icon: Megaphone, mau: "text-indigo-600", nen: "bg-indigo-50" },
};

const fmtThoiGian = (value) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";

  const giay = Math.floor((Date.now() - d.getTime()) / 1000);
  if (giay < 60) return "Vừa xong";
  if (giay < 3600) return `${Math.floor(giay / 60)} phút trước`;
  if (giay < 86400) return `${Math.floor(giay / 3600)} giờ trước`;
  if (giay < 604800) return `${Math.floor(giay / 86400)} ngày trước`;
  return d.toLocaleDateString("vi-VN");
};

const NotificationBell = () => {
  const navigate = useNavigate();
  const {
    nguoiNhan,
    hopThuPath,
    unreadCount,
    moiNhat,
    danhDauDaDoc,
    danhDauTatCa,
  } = useContext(NotificationContext);

  const [mo, setMo] = useState(false);
  const hopRef = useRef(null);

  // Đóng khi bấm ra ngoài
  useEffect(() => {
    if (!mo) return undefined;
    const xuLy = (event) => {
      if (hopRef.current && !hopRef.current.contains(event.target)) {
        setMo(false);
      }
    };
    document.addEventListener("mousedown", xuLy);
    return () => document.removeEventListener("mousedown", xuLy);
  }, [mo]);

  if (!nguoiNhan) return null;

  const moThongBao = async (thongBao) => {
    try {
      if (!thongBao.nn_dadoc) await danhDauDaDoc(thongBao.tb_ma);
    } catch (error) {
      // vẫn cho điều hướng dù đánh dấu lỗi
    }
    setMo(false);
    navigate(thongBao.tb_link || hopThuPath);
  };

  const docTatCa = async () => {
    try {
      await danhDauTatCa();
    } catch (error) {
      // im lặng
    }
  };

  return (
    <div className="relative" ref={hopRef}>
      <button
        type="button"
        onClick={() => setMo((v) => !v)}
        aria-label="Thông báo"
        className="relative grid h-10 w-10 place-items-center rounded-full border border-[#DDD9CE] bg-white text-[#5B6661] transition-colors hover:border-[#14201C]/25 hover:text-[#14201C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F2A93B]"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 grid min-w-[18px] place-items-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-[18px] text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {mo && (
        <div className="absolute right-0 z-50 mt-2 w-[22rem] overflow-hidden rounded-xl border border-[#E2DED3] bg-white shadow-xl sm:w-96">
          <div className="flex items-center justify-between border-b border-[#EFEBE2] px-4 py-3">
            <p className="text-sm font-semibold text-[#14201C]">Thông báo</p>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={docTatCa}
                className="inline-flex items-center gap-1 text-xs font-medium text-sky-600 hover:text-sky-700"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Đọc tất cả
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {moiNhat.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-slate-400">
                Chưa có thông báo nào.
              </p>
            ) : (
              moiNhat.map((thongBao) => {
                const kieu =
                  ICON_THEO_LOAI[thongBao.tb_loai] || ICON_THEO_LOAI.HE_THONG;
                const { Icon } = kieu;

                return (
                  <button
                    key={thongBao.tb_ma}
                    type="button"
                    onClick={() => moThongBao(thongBao)}
                    className={`flex w-full gap-3 border-b border-[#F4F1EA] px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-[#FAF8F3] ${
                      thongBao.nn_dadoc ? "" : "bg-sky-50/40"
                    }`}
                  >
                    <span
                      className={`mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full ${kieu.nen} ${kieu.mau}`}
                    >
                      <Icon className="h-4 w-4" />
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="flex items-start gap-2">
                        <span className="line-clamp-2 flex-1 text-sm font-medium text-[#14201C]">
                          {thongBao.tb_tieude}
                        </span>
                        {!thongBao.nn_dadoc && (
                          <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-sky-500" />
                        )}
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-[#7A857F]">
                        {thongBao.nguon_ten || "Hệ thống"}
                      </span>
                      <span className="mt-0.5 block text-[11px] text-[#9AA39E]">
                        {fmtThoiGian(thongBao.tb_thoidiemtao)}
                      </span>
                    </span>
                  </button>
                );
              })
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              setMo(false);
              navigate(hopThuPath);
            }}
            className="block w-full border-t border-[#EFEBE2] px-4 py-2.5 text-center text-sm font-medium text-sky-600 hover:bg-[#FAF8F3]"
          >
            Xem tất cả thông báo
          </button>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
