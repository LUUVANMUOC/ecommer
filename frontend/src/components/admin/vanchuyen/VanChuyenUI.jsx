// frontend/src/components/admin/vanchuyen/VanChuyenUI.jsx
import { INPUT } from "../dongtien/DongTienUI";

export const FilterBarVC = ({
  danhMuc = {},
  filters,
  onChange,
  onReload,
  loading,
  onExport,
  showTrangThai = false,
  trangThaiOptions = [],
  extra = null,
  allowAllYears = false,
}) => {
  const set = (key, value) => onChange({ ...filters, [key]: value });

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-slate-500">
          Đơn vị vận chuyển
        </span>
        <select
          className={`${INPUT} min-w-[200px]`}
          value={filters.dvvc_ma || ""}
          onChange={(e) => set("dvvc_ma", e.target.value)}
        >
          <option value="">Tất cả ĐVVC</option>
          {(danhMuc.dvvc || []).map((d) => (
            <option key={d.dvvc_ma} value={d.dvvc_ma}>
              {d.dvvc_ten}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-slate-500">Năm</span>
        <select
          className={`${INPUT} ${allowAllYears ? "w-[160px]" : "w-[120px]"}`}
          value={filters.nam}
          onChange={(e) => set("nam", e.target.value)}
        >
          {allowAllYears && <option value="">Tất cả các năm</option>}
          {(danhMuc.nam || []).map((n) => (
            <option key={n} value={String(n)}>
              Năm {n}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-slate-500">Tháng</span>
        <select
          className={`${INPUT} w-[130px] disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400`}
          value={filters.thang || ""}
          disabled={!filters.nam}
          onChange={(e) => set("thang", e.target.value)}
        >
          <option value="">Cả năm</option>
          {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
            <option key={m} value={String(m)}>
              Tháng {m}
            </option>
          ))}
        </select>
      </label>

      {extra}

      {showTrangThai && (
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-slate-500">Trạng thái</span>
          <select
            className={`${INPUT} min-w-[160px]`}
            value={filters.trang_thai || ""}
            onChange={(e) => set("trang_thai", e.target.value)}
          >
            <option value="">Tất cả trạng thái</option>
            {trangThaiOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      )}

      <div className="ml-auto flex items-center gap-2">
        <button
          type="button"
          onClick={onExport}
          className="flex h-10 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          <span className="material-symbols-outlined text-[18px]">
            download
          </span>
          CSV
        </button>
        <button
          type="button"
          onClick={onReload}
          disabled={loading}
          className="flex h-10 items-center gap-1.5 rounded-lg bg-[#1e3a5f] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#2a4b73] disabled:opacity-60"
        >
          <span
            className={`material-symbols-outlined text-[18px] ${
              loading ? "animate-spin" : ""
            }`}
          >
            refresh
          </span>
          {loading ? "Đang tải" : "Làm mới"}
        </button>
      </div>
    </div>
  );
};

const BADGES = {
  DA_CHI: { label: "Đã chi", cls: "bg-emerald-100 text-emerald-700" },
  DA_THANH_TOAN: { label: "Đã chi", cls: "bg-emerald-100 text-emerald-700" },
  CHUA_CHI: { label: "Chờ chi", cls: "bg-amber-100 text-amber-700" },
  CHO_THANH_TOAN: { label: "Chờ QR", cls: "bg-sky-100 text-sky-700" },
  CHUA_THANH_TOAN: {
    label: "Chưa thanh toán",
    cls: "bg-amber-100 text-amber-700",
  },
  KHONG_GIAM_GIA: {
    label: "Không giảm giá",
    cls: "bg-slate-100 text-slate-600",
  },
};

export const ChiBadge = ({ status }) => {
  const b = BADGES[status] || {
    label: status || "—",
    cls: "bg-slate-100 text-slate-600",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${b.cls}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {b.label}
    </span>
  );
};

export const PagerVC = ({
  page = 1,
  totalPages = 1,
  total = 0,
  onChange,
  label = "dòng",
}) => (
  <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
    <p className="text-xs text-slate-500">
      Tổng <strong className="text-slate-700">{total ?? 0}</strong> {label}
    </p>
    <div className="flex items-center gap-1">
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40"
      >
        <span className="material-symbols-outlined text-[18px]">
          chevron_left
        </span>
      </button>
      <span className="px-3 text-sm text-slate-600">
        {page} / {totalPages}
      </span>
      <button
        type="button"
        disabled={page >= totalPages}
        onClick={() => onChange(page + 1)}
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40"
      >
        <span className="material-symbols-outlined text-[18px]">
          chevron_right
        </span>
      </button>
    </div>
  </div>
);
