// frontend/src/components/admin/thongke/ThongKeUI.jsx
import { useMemo } from "react";
import { INPUT } from "../dongtien/DongTienUI";

export const buildCategoryTree = (rows = []) => {
  const byId = new Map();
  rows.forEach((r) => byId.set(r.nh_ma, { ...r, children: [] }));

  const roots = [];
  byId.forEach((node) => {
    const parent = node.nh_cha ? byId.get(node.nh_cha) : null;
    if (parent) parent.children.push(node);
    else roots.push(node);
  });

  const sortRec = (list) => {
    list.sort(
      (a, b) =>
        (Number(b.doanh_thu) || 0) - (Number(a.doanh_thu) || 0) ||
        String(a.nh_ten || "").localeCompare(String(b.nh_ten || ""), "vi"),
    );
    list.forEach((n) => sortRec(n.children));
  };
  sortRec(roots);

  return roots;
};

export const flattenCategoryTree = (roots = [], expanded = new Set()) => {
  const out = [];
  const walk = (nodes, level) => {
    nodes.forEach((n) => {
      const hasChildren = n.children.length > 0;
      out.push({ ...n, level, hasChildren });
      if (hasChildren && expanded.has(n.nh_ma)) walk(n.children, level + 1);
    });
  };
  walk(roots, 0);
  return out;
};

export const FilterBarTK = ({
  danhMuc,
  filters,
  onChange,
  onReload,
  loading,
  onExport,
}) => {
  const set = (key, value) => onChange({ ...filters, [key]: value });

  const catRows = useMemo(() => {
    const list = danhMuc.nganh_hang || [];
    return flattenCategoryTree(
      buildCategoryTree(list),
      new Set(list.map((n) => n.nh_ma)),
    );
  }, [danhMuc.nganh_hang]);

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-slate-500">Ngành hàng</span>
        <select
          className={`${INPUT} min-w-[240px]`}
          value={filters.nh_ma}
          onChange={(e) => set("nh_ma", e.target.value)}
        >
          <option value="">Tất cả ngành hàng</option>
          {catRows.map((n) => (
            <option key={n.nh_ma} value={n.nh_ma}>
              {`${"— ".repeat(n.level)}${n.nh_ten}`}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-slate-500">Shop</span>
        <select
          className={`${INPUT} min-w-[200px]`}
          value={filters.gh_ma}
          onChange={(e) => set("gh_ma", e.target.value)}
        >
          <option value="">Tất cả shop</option>
          {(danhMuc.shop || []).map((s) => (
            <option key={s.gh_ma} value={s.gh_ma}>
              {s.gh_ten}
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
          value={filters.thang}
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

export const PagerTK = ({
  page,
  totalPages,
  total,
  label = "dòng",
  onChange,
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
