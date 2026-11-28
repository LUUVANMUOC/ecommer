// src/components/product/ProductUI.jsx
// Bộ giao diện dùng chung cho các trang danh sách sản phẩm trong dashboard:
// Shop quản lý sản phẩm, Admin quản lý sản phẩm, Admin duyệt sản phẩm.
import { useMemo } from "react";

const BADGE_TONES = {
  yellow: "border-yellow-200 bg-yellow-100 text-yellow-800",
  green: "border-green-200 bg-green-100 text-green-800",
  red: "border-red-200 bg-red-100 text-red-800",
  gray: "border-gray-200 bg-gray-100 text-gray-700",
  blue: "border-blue-200 bg-blue-100 text-blue-800",
  gold: "border-[#F2A93B]/40 bg-[#FDF3E1] text-[#8A5A0B]",
};

const CHIP_TONES = {
  gold: "bg-[#FDF3E1] text-[#8A5A0B]",
  green: "bg-[#EEF3F1] text-[#2F5D50]",
  gray: "bg-[#F1EEE6] text-[#5B6661]",
  red: "bg-red-50 text-red-700",
  blue: "bg-blue-50 text-blue-700",
};

const GRID_CLASS = "grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3";

export const productSelectClass =
  "rounded-xl border border-[#D9CFC2] bg-white px-3 py-2 text-sm font-medium text-[#3D4A44] outline-none transition-colors hover:border-[#F2A93B] focus:border-[#F2A93B] focus:ring-2 focus:ring-[#F2A93B]/20";

/* ===================== NÚT THANH CÔNG CỤ ===================== */

export const ProductAddButton = ({ onClick, label = "Thêm sản phẩm" }) => (
  <button
    type="button"
    onClick={onClick}
    className="inline-flex items-center gap-2 rounded-full bg-[#14201C] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#1E3A34] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F2A93B]"
  >
    <span className="material-symbols-outlined text-[18px] text-[#F2A93B]">
      add
    </span>
    <span>{label}</span>
  </button>
);

export const ProductRefreshButton = ({
  onClick,
  loading = false,
  title = "Làm mới",
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={loading}
    title={title}
    className="grid h-10 w-10 place-items-center rounded-xl border border-[#D9CFC2] bg-white text-[#3D4A44] transition-colors hover:bg-[#F7F5F0] disabled:cursor-not-allowed disabled:opacity-50"
  >
    <span
      className={`material-symbols-outlined text-[20px] ${
        loading ? "animate-spin" : ""
      }`}
    >
      refresh
    </span>
  </button>
);

/* ===================== THANH TIÊU ĐỀ + TÌM KIẾM + LỌC ===================== */

export const ProductToolbar = ({
  title,
  subtitle,
  total,
  totalLabel = "sản phẩm",
  searchValue = "",
  onSearchChange,
  searchPlaceholder = "Tìm kiếm...",
  actions,
  children,
}) => {
  const searchable = typeof onSearchChange === "function";

  return (
    <section className="rounded-2xl border border-[#E2DED3] bg-white p-5 shadow-[0_1px_0_rgba(20,32,28,0.04)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold leading-tight tracking-tight text-[#14201C]">
              {title}
            </h1>
            {typeof total === "number" && (
              <span className="rounded-full bg-[#FDF3E1] px-2.5 py-0.5 text-xs font-semibold tabular-nums text-[#8A5A0B]">
                {total.toLocaleString("vi-VN")} {totalLabel}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="mt-1.5 text-sm leading-relaxed text-[#5B6661]">
              {subtitle}
            </p>
          )}
        </div>

        {actions && (
          <div className="flex flex-wrap items-center gap-2">{actions}</div>
        )}
      </div>

      {(searchable || children) && (
        <div className="mt-4 flex flex-col gap-3 border-t border-[#EFEBE2] pt-4 lg:flex-row lg:items-center">
          {searchable && (
            <div className="relative w-full lg:max-w-md">
              <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-[#9AA39E]">
                search
              </span>
              <input
                type="text"
                value={searchValue}
                placeholder={searchPlaceholder}
                aria-label={searchPlaceholder}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full rounded-xl border border-[#D9D4C7] bg-[#FBFAF7] py-2.5 pl-10 pr-10 text-sm text-[#14201C] transition-all placeholder:text-[#9AA39E] focus:border-[#F2A93B] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#F2A93B]/20"
              />
              {searchValue ? (
                <button
                  type="button"
                  onClick={() => onSearchChange("")}
                  title="Xóa từ khóa"
                  className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full text-[#7A857F] transition-colors hover:bg-[#F1EEE6] hover:text-[#B42318]"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    close
                  </span>
                </button>
              ) : null}
            </div>
          )}

          {children && (
            <div className="flex flex-wrap items-center gap-2 lg:ml-auto">
              {children}
            </div>
          )}
        </div>
      )}
    </section>
  );
};

/* ===================== THẺ SẢN PHẨM ===================== */

export const ProductStatCell = ({
  icon,
  iconClass = "text-[#5B6661]",
  value,
  label,
}) => (
  <div className="flex flex-col items-center gap-0.5 px-1 py-2.5">
    <div className="flex items-center gap-1">
      <span className={`material-symbols-outlined text-[15px] ${iconClass}`}>
        {icon}
      </span>
      <span className="text-sm font-bold tabular-nums text-[#14201C]">
        {value}
      </span>
    </div>
    <span className="text-[11px] font-medium text-[#7A857F]">{label}</span>
  </div>
);

export const ProductCard = ({
  image,
  alt = "",
  code,
  badges = [],
  actions,
  title,
  description,
  shop,
  price,
  chips = [],
  stats = [],
  footerNote,
  footer,
  onClick,
}) => (
  <article
    onClick={onClick}
    className={`group flex flex-col overflow-hidden rounded-2xl border border-[#E2DED3] bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[#F2A93B] hover:shadow-lg ${
      onClick ? "cursor-pointer" : ""
    }`}
  >
    <div className="relative flex h-44 items-center justify-center overflow-hidden bg-gradient-to-br from-[#F7F5F0] to-[#EFE9DC]">
      {image ? (
        <img
          src={image}
          alt={alt}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-contain p-4 transition-transform duration-300 group-hover:scale-105"
        />
      ) : (
        <span className="material-symbols-outlined text-[44px] text-[#B8AE98]">
          image
        </span>
      )}

      {code && (
        <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-0.5 font-mono text-[11px] font-semibold text-[#3D4A44] shadow-sm">
          {code}
        </span>
      )}

      {badges.length > 0 && (
        <div className="absolute right-3 top-3 flex flex-col items-end gap-1.5">
          {badges.map((badge, idx) => (
            <span
              key={`${badge.label}-${idx}`}
              className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold shadow-sm ${
                BADGE_TONES[badge.tone] || BADGE_TONES.gray
              }`}
            >
              {badge.label}
            </span>
          ))}
        </div>
      )}

      {actions && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute bottom-3 right-3 flex gap-1.5 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100"
        >
          {actions}
        </div>
      )}
    </div>

    <div className="flex flex-1 flex-col p-5">
      <h3 className="line-clamp-1 text-base font-bold text-[#14201C] transition-colors group-hover:text-[#F2A93B]">
        {title}
      </h3>

      {description && (
        <p className="mt-1 line-clamp-2 min-h-[2.5rem] text-sm text-[#5B6661]">
          {description}
        </p>
      )}

      {shop && (
        <p className="mt-1.5 flex min-w-0 items-center gap-1.5 text-sm text-[#7A857F]">
          <span className="material-symbols-outlined text-[15px]">
            storefront
          </span>
          <span className="truncate">{shop}</span>
        </p>
      )}

      {price && (
        <p className="mt-3 text-base font-bold tabular-nums text-[#B42318]">
          {price}
        </p>
      )}

      {chips.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {chips.map((chip, idx) => (
            <span
              key={`${chip.label}-${idx}`}
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                CHIP_TONES[chip.tone] || CHIP_TONES.gray
              }`}
              title={chip.title || chip.label}
            >
              {chip.icon && (
                <span className="material-symbols-outlined text-[13px]">
                  {chip.icon}
                </span>
              )}
              <span className="max-w-[150px] truncate">{chip.label}</span>
            </span>
          ))}
        </div>
      )}

      {stats.length > 0 && (
        <div className="mt-4 grid grid-cols-4 divide-x divide-[#EFEBE2] overflow-hidden rounded-xl border border-[#EFEBE2] bg-[#FBFAF7]">
          {stats.map((stat, idx) => (
            <ProductStatCell key={`${stat.label}-${idx}`} {...stat} />
          ))}
        </div>
      )}

      {footerNote && (
        <p className="mt-3 flex items-center gap-1 text-[11px] font-medium text-[#7A857F]">
          {footerNote.icon && (
            <span className="material-symbols-outlined text-[13px]">
              {footerNote.icon}
            </span>
          )}
          {footerNote.label}
        </p>
      )}

      {footer && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="mt-4 flex gap-2"
        >
          {footer}
        </div>
      )}
    </div>
  </article>
);

/* ===================== LƯỚI + TRẠNG THÁI RỖNG ===================== */

export const ProductCardSkeleton = () => (
  <div className="flex animate-pulse flex-col overflow-hidden rounded-2xl border border-[#E2DED3] bg-white shadow-sm">
    <div className="h-44 bg-[#F1EEE6]" />
    <div className="flex flex-1 flex-col gap-3 p-5">
      <div className="h-4 w-3/4 rounded bg-[#EFEBE2]" />
      <div className="h-3 w-full rounded bg-[#F4F1EA]" />
      <div className="h-3 w-2/3 rounded bg-[#F4F1EA]" />
      <div className="h-5 w-1/2 rounded bg-[#EFEBE2]" />
      <div className="mt-auto h-9 w-full rounded-xl bg-[#F4F1EA]" />
    </div>
  </div>
);

export const ProductEmptyState = ({
  icon = "inventory_2",
  title,
  hint,
  action,
}) => (
  <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[#E2DED3] bg-[#FBFAF7] px-6 py-16 text-center">
    <span className="material-symbols-outlined text-[48px] text-[#C9C3B5]">
      {icon}
    </span>
    <p className="text-sm font-semibold text-[#3D4A44]">{title}</p>
    {hint && <p className="text-sm text-[#7A857F]">{hint}</p>}
    {action}
  </div>
);

export const ProductGrid = ({
  loading = false,
  isEmpty = false,
  skeletonCount = 6,
  empty,
  children,
}) => {
  if (loading && isEmpty) {
    return (
      <div className={GRID_CLASS}>
        {Array.from({ length: skeletonCount }, (_, idx) => (
          <ProductCardSkeleton key={`product-skeleton-${idx}`} />
        ))}
      </div>
    );
  }

  if (isEmpty) {
    return (
      empty ?? (
        <ProductEmptyState title="Không có sản phẩm nào phù hợp." />
      )
    );
  }

  return (
    <div
      aria-busy={loading}
      className={`${GRID_CLASS} transition-opacity duration-200 ${
        loading ? "opacity-60" : ""
      }`}
    >
      {children}
    </div>
  );
};

/* ===================== PHÂN TRANG ===================== */

const buildPageList = (page, totalPages) => {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  const list = [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(totalPages - 1, page + 1);
  if (start > 2) list.push("...");
  for (let p = start; p <= end; p += 1) list.push(p);
  if (end < totalPages - 1) list.push("...");
  list.push(totalPages);
  return list;
};

export const PaginationBar = ({
  page,
  totalPages,
  total,
  limit,
  pageSizes = [12, 24, 48, 96],
  onPageChange,
  onLimitChange,
  onRefresh,
  loading = false,
}) => {
  const pageList = useMemo(
    () => buildPageList(page, totalPages),
    [page, totalPages],
  );

  if (!total) return null;

  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#E2DED3] bg-white px-4 py-3 shadow-sm">
      <div className="flex flex-wrap items-center gap-2 text-sm text-[#5B6661]">
        <span>Hiển thị</span>
        <strong className="tabular-nums text-[#14201C]">
          {from}–{to}
        </strong>
        <span>trong</span>
        <strong className="tabular-nums text-[#14201C]">
          {total.toLocaleString("vi-VN")}
        </strong>
        <span>sản phẩm</span>

        <span className="mx-1 h-4 w-px bg-[#E2DED3]" />

        <label className="flex items-center gap-1.5">
          <span>Mỗi trang</span>
          <select
            value={limit}
            onChange={(e) => onLimitChange(Number(e.target.value))}
            className="rounded-lg border border-[#D9D4C7] bg-[#FBFAF7] px-2 py-1.5 text-sm text-[#14201C] outline-none focus:border-[#F2A93B] focus:ring-2 focus:ring-[#F2A93B]/20"
          >
            {pageSizes.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>

        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            title="Tải lại trang hiện tại"
            className="ml-1 grid h-8 w-8 place-items-center rounded-lg border border-[#D9D4C7] text-[#5B6661] transition-colors hover:bg-[#FBFAF7] disabled:opacity-50"
          >
            <span
              className={`material-symbols-outlined text-[18px] ${
                loading ? "animate-spin" : ""
              }`}
            >
              refresh
            </span>
          </button>
        )}
      </div>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page <= 1 || loading}
          className="grid h-8 w-8 place-items-center rounded-lg border border-[#D9D4C7] text-[#3D4A44] transition-colors hover:bg-[#FBFAF7] disabled:cursor-not-allowed disabled:opacity-40"
          title="Trang trước"
        >
          <span className="material-symbols-outlined text-[18px]">
            chevron_left
          </span>
        </button>

        {pageList.map((p, idx) =>
          p === "..." ? (
            <span
              key={`page-dots-${idx}`}
              className="px-1 text-sm text-[#9AA39E]"
            >
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange(p)}
              disabled={loading}
              className={`h-8 min-w-[32px] rounded-lg border px-2 text-sm font-semibold tabular-nums transition-colors disabled:opacity-60 ${
                p === page
                  ? "border-[#14201C] bg-[#14201C] text-white"
                  : "border-[#D9D4C7] bg-white text-[#3D4A44] hover:border-[#14201C]/40 hover:bg-[#FBFAF7]"
              }`}
            >
              {p}
            </button>
          ),
        )}

        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages || loading}
          className="grid h-8 w-8 place-items-center rounded-lg border border-[#D9D4C7] text-[#3D4A44] transition-colors hover:bg-[#FBFAF7] disabled:cursor-not-allowed disabled:opacity-40"
          title="Trang sau"
        >
          <span className="material-symbols-outlined text-[18px]">
            chevron_right
          </span>
        </button>
      </div>
    </div>
  );
};
