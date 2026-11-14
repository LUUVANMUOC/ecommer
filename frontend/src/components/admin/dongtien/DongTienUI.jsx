// frontend/src/components/admin/dongtien/DongTienUI.jsx
export const INPUT =
  "h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100";

export const money = (v) => {
  const n = Number(v);
  if (!Number.isFinite(n)) return "—";
  return `${n.toLocaleString("vi-VN")} đ`;
};

export const fmtDate = (v) => {
  if (!v) return "—";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("vi-VN", { hour12: false });
};

const TONES = {
  blue: {
    bg: "bg-sky-50",
    border: "border-sky-200",
    icon: "text-sky-600",
    value: "text-sky-900",
  },
  indigo: {
    bg: "bg-indigo-50",
    border: "border-indigo-200",
    icon: "text-indigo-600",
    value: "text-indigo-900",
  },
  amber: {
    bg: "bg-amber-50",
    border: "border-amber-200",
    icon: "text-amber-600",
    value: "text-amber-900",
  },
  emerald: {
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    icon: "text-emerald-600",
    value: "text-emerald-900",
  },
  red: {
    bg: "bg-rose-50",
    border: "border-rose-200",
    icon: "text-rose-600",
    value: "text-rose-900",
  },
  slate: {
    bg: "bg-slate-50",
    border: "border-slate-200",
    icon: "text-slate-500",
    value: "text-slate-800",
  },
};

export const KpiCard = ({ icon, label, value, hint, tone = "slate" }) => {
  const t = TONES[tone] || TONES.slate;
  return (
    <div className={`rounded-2xl border ${t.border} ${t.bg} p-4 shadow-sm`}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium leading-snug text-slate-500">
          {label}
        </p>
        <span className={`material-symbols-outlined text-[20px] ${t.icon}`}>
          {icon}
        </span>
      </div>
      <p className={`mt-2 text-xl font-bold tracking-tight ${t.value}`}>
        {value}
      </p>
      {hint && (
        <p className="mt-1 text-[11px] leading-snug text-slate-400">{hint}</p>
      )}
    </div>
  );
};

export const FilterBar = ({
  danhMuc = {},
  filters,
  onChange,
  onReload,
  loading,
  onExport,
  extra = null,
}) => {
  const set = (key, value) => onChange({ ...filters, [key]: value });

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-slate-500">Kho</span>
        <select
          className={`${INPUT} min-w-[180px]`}
          value={filters.kho_ma || ""}
          onChange={(e) => set("kho_ma", e.target.value)}
        >
          <option value="">Tất cả kho</option>
          {(danhMuc.kho || []).map((k) => (
            <option key={k.kho_ma} value={k.kho_ma}>
              {k.kho_ten}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-slate-500">Năm</span>
        <select
          className={`${INPUT} w-[120px]`}
          value={filters.nam}
          onChange={(e) => set("nam", e.target.value)}
        >
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
          className={`${INPUT} w-[130px]`}
          value={filters.thang || ""}
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

export const TabBar = ({ tabs, active, onChange }) => (
  <div className="flex flex-wrap gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
    {tabs.map((t) => (
      <button
        key={t.key}
        type="button"
        onClick={() => onChange(t.key)}
        className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
          active === t.key
            ? "bg-[#1e3a5f] text-white"
            : "text-slate-600 hover:bg-slate-100"
        }`}
      >
        {t.label}
      </button>
    ))}
  </div>
);

export const ViewToggle = ({ views = [], active, onChange }) => (
  <div className="flex shrink-0 flex-wrap rounded-xl border border-slate-200 bg-slate-50 p-1">
    {views.map((v) => (
      <button
        key={v.id}
        type="button"
        onClick={() => onChange(v.id)}
        className={`flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
          active === v.id
            ? "bg-[#1e3a5f] text-white shadow-sm"
            : "text-slate-600 hover:bg-white"
        }`}
      >
        <span className="material-symbols-outlined text-[16px]">{v.icon}</span>
        {v.label}
      </button>
    ))}
  </div>
);

export const SectionCard = ({
  title,
  subtitle,
  action,
  children,
  className = "",
}) => (
  <section
    className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}
  >
    {(title || action) && (
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          {title && (
            <h3 className="text-sm font-bold text-slate-800">{title}</h3>
          )}
          {subtitle && (
            <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>
          )}
        </div>
        {action}
      </div>
    )}
    {children}
  </section>
);

export const EmptyState = ({
  icon = "inbox",
  title = "Chưa có dữ liệu",
  hint,
}) => (
  <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
    <span className="material-symbols-outlined text-4xl text-slate-300">
      {icon}
    </span>
    <p className="text-sm font-semibold text-slate-600">{title}</p>
    {hint && <p className="max-w-sm text-xs text-slate-400">{hint}</p>}
  </div>
);

export const StatusBadge = ({ status }) => {
  const ok = status === "DA_THANH_TOAN";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
        ok ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
      }`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {ok ? "Đã thu đủ" : "Chờ thu"}
    </span>
  );
};

const NOTE_TONES = {
  amber: "border-amber-200 bg-amber-50 text-amber-800",
  sky: "border-sky-200 bg-sky-50 text-sky-800",
  slate: "border-slate-200 bg-slate-50 text-slate-600",
};

export const NoteBox = ({ tone = "amber", children }) => (
  <div
    className={`rounded-xl border px-4 py-3 text-[11px] leading-relaxed ${
      NOTE_TONES[tone] || NOTE_TONES.amber
    }`}
  >
    {children}
  </div>
);

export const Pager = ({
  page,
  totalPages,
  total,
  onChange,
  unit = "phiếu",
}) => (
  <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
    <p className="text-xs text-slate-500">
      Tổng <strong className="text-slate-700">{total ?? 0}</strong> {unit}
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
