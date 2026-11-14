// src/components/layout/SiteHeader.jsx
import { Link } from "react-router-dom";
import useGiaoDien from "../../hooks/useGiaoDien";
import SiteBlock from "./SiteBlock";
import NotificationBell from "../../pages/common/NotificationBell"; // ✅ sửa: ../common → ../../pages/common

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8080";

const imgUrl = (link) => {
  if (!link) return "";
  if (
    link.startsWith("http") ||
    link.startsWith("data:") ||
    link.startsWith("blob:")
  ) {
    return link;
  }
  return `${BACKEND_URL}${link.startsWith("/") ? "" : "/"}${link}`;
};

const SafeLink = ({ to, editable, className, title, children }) => {
  if (editable) {
    return (
      <span className={className} title={title} aria-disabled="true">
        {children}
      </span>
    );
  }

  return (
    <Link to={to} className={className} title={title}>
      {children}
    </Link>
  );
};

const HeaderSearch = ({ search }) => (
  <div className="relative">
    <button
      type="button"
      onClick={search.onSubmit}
      aria-label="Tìm kiếm"
      className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#2563EB]"
    >
      <span
        className={`material-symbols-outlined ${
          search.loading ? "animate-spin" : ""
        }`}
      >
        {search.loading ? "progress_activity" : "search"}
      </span>
    </button>

    <input
      type="search"
      value={search.value}
      onChange={(e) => search.onChange(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          search.onSubmit();
        } else if (e.key === "Escape") {
          search.onClear();
        }
      }}
      placeholder="Tìm theo tên, mô tả, danh mục..."
      aria-label="Tìm kiếm sản phẩm"
      autoComplete="off"
      spellCheck={false}
      enterKeyHint="search"
      className="w-full rounded-full border border-[#E2E8F0] bg-[#F8FAFC] py-2.5 pl-11 pr-10 text-sm text-[#0F172A] shadow-sm outline-none transition-all focus:border-[#2563EB] focus:bg-white [&::-webkit-search-cancel-button]:hidden"
    />

    {search.value && (
      <button
        type="button"
        onClick={search.onClear}
        aria-label="Xoá từ khoá"
        className="absolute right-3 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-[#DC2626]"
      >
        <span className="material-symbols-outlined text-[18px]">close</span>
      </button>
    )}
  </div>
);

const SiteHeader = ({
  search = null,
  cartCount = 0,
  user = null,
  onLogout = null,
  showUtilities = false,
  data = null,
  disableSticky = false,
  editable = false,
  onEditSettings = null,
  onEditBlock = null,
}) => {
  const hookData = useGiaoDien();

  const caiDat = (data?.cai_dat ?? hookData.cai_dat) || {};
  const blocks = data ? data.header || [] : hookData.header || [];

  if (caiDat.cds_hien_header === false) return null;

  const sticky = !disableSticky && caiDat.cds_header_dinh !== false;
  const logoCentered = caiDat.cds_kieu_header === "logo_giua";
  const hotline = caiDat.cds_hotline;

  const logoInner = (
    <>
      {caiDat.cds_logo ? (
        <img
          src={imgUrl(caiDat.cds_logo)}
          alt={caiDat.cds_ten_hien_thi || "Logo"}
          className="h-11 w-11 rounded-xl object-contain"
        />
      ) : (
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-[#2563EB] to-[#1D4ED8] text-white shadow-sm">
          <span className="material-symbols-outlined text-[22px]">
            storefront
          </span>
        </span>
      )}
      <span className="leading-tight">
        <span className="block text-xl font-bold text-[#2563EB]">
          {caiDat.cds_ten_hien_thi || "CT255 Shop"}
        </span>
        {caiDat.cds_khau_hieu && (
          <span className="hidden text-[11px] font-medium text-[#64748B] sm:block">
            {caiDat.cds_khau_hieu}
          </span>
        )}
      </span>
    </>
  );

  const logoNode = editable ? (
    <button
      type="button"
      onClick={() => onEditSettings?.()}
      title="Bấm để sửa cài đặt chung (logo, tên, hotline...)"
      className="flex shrink-0 items-center gap-2.5 rounded-xl text-left outline outline-1 outline-dashed outline-transparent transition hover:outline-[#2563EB]"
    >
      {logoInner}
    </button>
  ) : (
    <Link to="/" className="flex shrink-0 items-center gap-2.5">
      {logoInner}
    </Link>
  );

  const hotlineNode = hotline ? (
    editable ? (
      <span
        title="Sửa hotline ở Cài đặt chung"
        className="hidden items-center gap-1.5 text-sm font-semibold text-[#334155] lg:flex"
      >
        <span className="material-symbols-outlined text-[20px]">call</span>
        <span className="whitespace-nowrap">{hotline}</span>
      </span>
    ) : (
      <a
        href={`tel:${hotline}`}
        className="hidden items-center gap-1.5 text-sm font-semibold text-[#334155] hover:text-[#2563EB] lg:flex"
      >
        <span className="material-symbols-outlined text-[20px]">call</span>
        <span className="whitespace-nowrap">{hotline}</span>
      </a>
    )
  ) : null;

  const hotlineSmall = hotline ? (
    editable ? (
      <span className="hidden items-center gap-1.5 text-xs font-semibold text-[#64748B] sm:flex">
        <span className="material-symbols-outlined text-[16px]">call</span>
        {hotline}
      </span>
    ) : (
      <a
        href={`tel:${hotline}`}
        className="hidden items-center gap-1.5 text-xs font-semibold text-[#64748B] hover:text-[#2563EB] sm:flex"
      >
        <span className="material-symbols-outlined text-[16px]">call</span>
        {hotline}
      </a>
    )
  ) : null;

  const utilitiesNode = showUtilities ? (
    <div className="flex items-center gap-4 text-sm font-semibold">
      {user && !editable && <NotificationBell />}
      <SafeLink
        to="/khach-hang/gio-hang"
        editable={editable}
        title={editable ? "Giỏ hàng (chỉ xem trước)" : "Giỏ hàng"}
        className="relative text-[#334155] hover:text-[#2563EB]"
      >
        <span className="material-symbols-outlined text-[24px]">
          shopping_cart
        </span>
        {cartCount > 0 && (
          <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-[#DC2626] text-[10px] text-white">
            {cartCount}
          </span>
        )}
      </SafeLink>

      {user ? (
        <div className="flex items-center gap-4">
          <SafeLink
            to="/khach-hang/thong-tin-ca-nhan"
            editable={editable}
            className="flex items-center gap-2 rounded-full px-3 py-1.5 hover:bg-[#F8FAFC]"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#2563EB] text-xs text-white">
              {user.kh_ten?.charAt(0).toUpperCase()}
            </div>
            <span className="hidden text-[#334155] sm:block">
              {user.kh_ten}
            </span>
          </SafeLink>
          {editable ? (
            <span className="text-[#DC2626]">Đăng xuất</span>
          ) : (
            <button
              onClick={onLogout}
              className="text-[#DC2626] hover:underline"
            >
              Đăng xuất
            </button>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <SafeLink
            to="/khach-hang/login"
            editable={editable}
            className="text-[#334155] hover:text-[#2563EB]"
          >
            Đăng nhập
          </SafeLink>
          <SafeLink
            to="/khach-hang/register"
            editable={editable}
            className="rounded-full bg-[#2563EB] px-5 py-2 text-white hover:bg-[#1D4ED8]"
          >
            Đăng ký
          </SafeLink>
        </div>
      )}
    </div>
  ) : null;

  return (
    <header
      className={`${
        sticky ? "sticky top-0" : ""
      } z-30 w-full border-b border-[#E2E8F0] bg-white/95 backdrop-blur`}
    >
      <div className="mx-auto max-w-7xl px-6">
        {logoCentered ? (
          <>
            <div className="grid grid-cols-3 items-center gap-3 py-3">
              <div className="justify-self-start">{hotlineSmall}</div>
              <div className="justify-self-center">{logoNode}</div>
              <div className="justify-self-end">{utilitiesNode}</div>
            </div>
            {search && (
              <div className="pb-3">
                <HeaderSearch search={search} />
              </div>
            )}
          </>
        ) : (
          <>
            <div className="flex items-center gap-4 py-3">
              {logoNode}

              {search && (
                <div className="hidden min-w-0 flex-1 md:block">
                  <HeaderSearch search={search} />
                </div>
              )}

              <div className="ml-auto flex items-center gap-4">
                {hotlineNode}
                {utilitiesNode}
              </div>
            </div>

            {search && (
              <div className="pb-3 md:hidden">
                <HeaderSearch search={search} />
              </div>
            )}
          </>
        )}

        {blocks.length > 0 && (
          <div className="border-t border-[#F1F5F9] py-2.5">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
              {blocks.map((block) => (
                <SiteBlock
                  key={block.kvg_ma}
                  block={block}
                  caiDat={caiDat}
                  variant="header"
                  editable={editable}
                  onEditBlock={onEditBlock}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default SiteHeader;
