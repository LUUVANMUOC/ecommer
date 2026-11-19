const LOAI_DIEM = {
  shop: {
    nhan: "Shop",
    icon: "storefront",
    color: "text-amber-700 bg-amber-50 border-amber-200",
    badge: "bg-amber-100 text-amber-700",
  },
  kho: {
    nhan: "Kho",
    icon: "warehouse",
    color: "text-indigo-700 bg-indigo-50 border-indigo-200",
    badge: "bg-indigo-100 text-indigo-700",
  },
  khach: {
    nhan: "Khách",
    icon: "person_pin_circle",
    color: "text-emerald-700 bg-emerald-50 border-emerald-200",
    badge: "bg-emerald-100 text-emerald-700",
  },
};

export const diaChiDayDu = (diem) => {
  if (!diem) return "";
  return [diem.diaChi, diem.xa, diem.tinh].filter(Boolean).join(", ");
};

export const tenDiem = (diem) => {
  if (!diem) return "—";
  return diem.ten || diaChiDayDu(diem) || "—";
};

// Tạo điểm kho từ một object phẳng, ví dụ prefix "Kho_Di_" cho
// Kho_Di_Ma / Kho_Di_Ten / Kho_Di_DiaChi / Kho_Di_Xa / Kho_Di_Tinh.
export const diemKhoTuDuLieu = (o, prefix = "Kho_") =>
  o
    ? {
        loai: "kho",
        ma: o[`${prefix}Ma`] || null,
        ten: o[`${prefix}Ten`] || null,
        diaChi: o[`${prefix}DiaChi`] || null,
        xa: o[`${prefix}Xa`] || null,
        tinh: o[`${prefix}Tinh`] || null,
      }
    : null;

export const diemShopTuDuLieu = (o) =>
  o
    ? {
        loai: "shop",
        ma: o.GH_Ma || null,
        ten: o.TenShop || null,
        diaChi: o.DiaChiLayHang || null,
        xa: o.Xa_LayHang || o.XaLayHang || null,
        tinh: o.Tinh_LayHang || o.TinhLayHang || null,
      }
    : null;

export const diemKhachTuDuLieu = (o) =>
  o
    ? {
        loai: "khach",
        ma: null,
        ten: o.TenKhach || o.TenNguoiNhan || null,
        diaChi: o.DiaChiGiao || null,
        xa: null,
        tinh: null,
      }
    : null;

const Diem = ({ diem, compact }) => {
  if (!diem) {
    return (
      <div className="flex-1 min-w-0 rounded-xl border border-dashed border-[#E2E8F0] bg-white px-3 py-2">
        <p className="text-xs font-semibold text-gray-400">Chưa xác định</p>
      </div>
    );
  }

  const cfg = LOAI_DIEM[diem.loai] || LOAI_DIEM.kho;
  const ten = tenDiem(diem);
  const diaChi = diem.ten ? diaChiDayDu(diem) : "";
  const hienDiaChi = diaChi && diaChi !== ten;

  return (
    <div
      className={`flex-1 min-w-0 rounded-xl border px-3 ${
        compact ? "py-1.5" : "py-2"
      } ${cfg.color}`}
    >
      <p className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide opacity-80">
        <span className="material-symbols-outlined text-[14px]">
          {cfg.icon}
        </span>
        {cfg.nhan}
      </p>
      <p className="text-sm font-bold break-words">{ten}</p>
      {hienDiaChi && (
        <p className="text-xs opacity-80 break-words">{diaChi}</p>
      )}
    </div>
  );
};

const MuiTen = ({ doc = false }) => (
  <div className="flex items-center justify-center shrink-0 text-gray-400">
    <span className="material-symbols-outlined text-[20px]">
      {doc ? "south" : "arrow_forward"}
    </span>
  </div>
);

/**
 * Hiển thị một chặng vận chuyển "đi từ đâu → đến đâu".
 *
 * - `tu` / `den`: điểm đầu/cuối, dạng { loai, ten, diaChi, xa, tinh }.
 *   loai: "shop" | "kho" | "khach".
 * - `loTrinh`: mảng điểm để hiển thị cả chuỗi (Shop → Kho → Kho → Khách).
 * - `cungKho`: kho đi trùng kho đích.
 * - `nhan`: tiêu đề nhỏ phía trên, ví dụ "Chặng trung chuyển (LSP02)".
 */
const LoTrinhVanChuyen = ({
  tu,
  den,
  loTrinh,
  cungKho = false,
  nhan,
  compact = false,
  className = "",
}) => {
  const chuoi = Array.isArray(loTrinh) && loTrinh.length > 0 ? loTrinh : null;

  return (
    <div
      className={`rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-2.5 ${className}`}
    >
      {nhan && (
        <p className="mb-1.5 flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-[#64748B]">
          <span className="material-symbols-outlined text-[14px]">route</span>
          {nhan}
        </p>
      )}

      {chuoi ? (
        <div className="flex flex-wrap items-stretch gap-1.5">
          {chuoi.map((diem, idx) => (
            <div key={idx} className="flex flex-1 min-w-[130px] items-stretch gap-1.5">
              <Diem diem={diem} compact={compact} />
              {idx < chuoi.length - 1 && <MuiTen />}
            </div>
          ))}
        </div>
      ) : cungKho ? (
        <div className="flex items-start gap-1.5">
          <span className="material-symbols-outlined text-[18px] text-indigo-700">
            warehouse
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-indigo-700">
              Cùng kho: {tenDiem(tu)}
            </p>
            {tu?.ten && diaChiDayDu(tu) && (
              <p className="text-xs text-indigo-600/80 break-words">
                {diaChiDayDu(tu)}
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-1.5 sm:flex-row sm:items-stretch">
          <Diem diem={tu} compact={compact} />
          <MuiTen doc />
          <Diem diem={den} compact={compact} />
        </div>
      )}
    </div>
  );
};

export default LoTrinhVanChuyen;
