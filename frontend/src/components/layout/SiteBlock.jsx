// src/components/layout/SiteBlock.jsx
import { Link } from "react-router-dom";

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

const isInternal = (url) => typeof url === "string" && url.startsWith("/");

// Link tới tệp (PDF, Word, Excel, ZIP...) hoặc file upload nội bộ
const isFileLink = (url) =>
  typeof url === "string" &&
  (/\.(pdf|docx?|xlsx?|pptx?|zip|rar)$/i.test(url) ||
    url.startsWith("/uploads/"));

const fileHref = (url) => {
  if (!url) return "";
  if (/^(https?:|data:|blob:)/.test(url)) return url;
  return `${BACKEND_URL}${url.startsWith("/") ? "" : "/"}${url}`;
};

const LinkWrap = ({
  href,
  newTab,
  className,
  title,
  editable = false,
  children,
}) => {
  if (editable || !href) {
    return (
      <span className={className} title={title}>
        {children}
      </span>
    );
  }

  // Tệp: luôn mở tab mới bằng thẻ <a> thật
  if (isFileLink(href)) {
    return (
      <a
        href={fileHref(href)}
        className={className}
        title={title}
        target="_blank"
        rel="noopener noreferrer"
      >
        {children}
      </a>
    );
  }

  if (isInternal(href)) {
    return (
      <Link to={href} className={className} title={title}>
        {children}
      </Link>
    );
  }

  return (
    <a
      href={href}
      className={className}
      title={title}
      target={newTab ? "_blank" : undefined}
      rel={newTab ? "noopener noreferrer" : undefined}
    >
      {children}
    </a>
  );
};

const ItemContent = ({ item, variant = "footer" }) => {
  if (item.tpg_loai === "image") {
    return item.tpg_hinhanh ? (
      <img
        src={imgUrl(item.tpg_hinhanh)}
        alt={item.tpg_tieude || "Ảnh"}
        loading="lazy"
        decoding="async"
        className="h-9 w-auto max-w-[120px] object-contain"
      />
    ) : (
      <span>{item.tpg_tieude}</span>
    );
  }

  if (item.tpg_loai === "icon") {
    return (
      <span className="inline-flex items-center gap-1.5">
        <span className="material-symbols-outlined text-[18px]">
          {item.tpg_bieutuong || "public"}
        </span>
        {variant === "footer" && item.tpg_tieude ? (
          <span className="text-xs font-medium">{item.tpg_tieude}</span>
        ) : null}
      </span>
    );
  }

  if (item.tpg_loai === "text") {
    return <span>{item.tpg_tieude || item.tpg_noidung}</span>;
  }

  return <span>{item.tpg_tieude}</span>;
};

const EditableBlock = ({ block, onEdit, children }) => {
  const hidden = block.kvg_hienthi === false;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onEdit?.(block);
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          event.stopPropagation();
          onEdit?.(block);
        }
      }}
      title="Bấm để chỉnh sửa cụm này"
      className={`group/blk relative cursor-pointer rounded-xl p-1 outline outline-1 outline-dashed outline-transparent transition hover:bg-[#EFF6FF]/50 hover:outline-[#2563EB] ${
        hidden ? "opacity-60" : ""
      }`}
    >
      {children}

      <span className="pointer-events-none absolute -top-2.5 right-0 z-20 hidden items-center gap-1 rounded-full bg-[#2563EB] px-2 py-0.5 text-[10px] font-bold text-white shadow group-hover/blk:flex">
        <span className="material-symbols-outlined text-[12px]">edit</span>
        Sửa
      </span>

      {hidden && (
        <span className="pointer-events-none absolute -top-2.5 left-0 z-20 rounded-full bg-[#64748B] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
          Đang ẩn
        </span>
      )}
    </div>
  );
};

const SiteBlock = ({
  block,
  caiDat = {},
  variant = "footer",
  editable = false,
  onEditBlock = null,
}) => {
  if (!block) return null;
  if (block.kvg_hienthi === false && !editable) return null;

  const allItems = block.thanh_phan || [];
  const items = editable
    ? allItems
    : allItems.filter((item) => item.tpg_hienthi !== false);

  const dim = (item) =>
    editable && item.tpg_hienthi === false ? " opacity-40" : "";

  const title = block.kvg_tieude ? (
    <h3 className="mb-3 text-sm font-bold text-[#0F172A]">
      {block.kvg_tieude}
    </h3>
  ) : null;

  let content = null;

  if (editable && items.length === 0) {
    content = (
      <div>
        {title}
        <p className="rounded-lg border border-dashed border-[#CBD5E1] bg-white px-3 py-2 text-xs text-[#94A3B8]">
          Cụm chưa có mục nào — bấm để thêm.
        </p>
      </div>
    );
  } else {
    switch (block.kvg_kieubocuc) {
      case "menu_ngang":
        content = (
          <nav className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm font-semibold text-[#334155]">
            {items.map((item) => (
              <LinkWrap
                key={item.tpg_ma}
                href={item.tpg_lienket}
                newTab={item.tpg_mo_tab_moi}
                title={item.tpg_tieude}
                editable={editable}
                className={`inline-flex items-center px-0.5 transition-colors hover:text-[#2563EB]${dim(item)}`}
              >
                <ItemContent item={item} variant={variant} />
              </LinkWrap>
            ))}
          </nav>
        );
        break;

      case "hang_icon":
        content = (
          <div>
            {title}
            <div className="flex flex-wrap items-center gap-2.5">
              {items.map((item) => (
                <LinkWrap
                  key={item.tpg_ma}
                  href={item.tpg_lienket}
                  newTab={item.tpg_mo_tab_moi}
                  title={item.tpg_tieude}
                  editable={editable}
                  className={`grid h-9 w-9 place-items-center rounded-full border border-[#E2E8F0] text-[#334155] transition-colors hover:border-[#2563EB] hover:text-[#2563EB]${dim(item)}`}
                >
                  {item.tpg_hinhanh ? (
                    <img
                      src={imgUrl(item.tpg_hinhanh)}
                      alt={item.tpg_tieude || ""}
                      loading="lazy"
                      className="h-5 w-5 object-contain"
                    />
                  ) : (
                    <span className="material-symbols-outlined text-[18px]">
                      {item.tpg_bieutuong || "public"}
                    </span>
                  )}
                </LinkWrap>
              ))}
            </div>
          </div>
        );
        break;

      case "luoi_anh":
        content = (
          <div>
            {title}
            <div className="grid grid-cols-2 gap-2.5">
              {items.map((item) => (
                <LinkWrap
                  key={item.tpg_ma}
                  href={item.tpg_lienket}
                  newTab={item.tpg_mo_tab_moi}
                  title={item.tpg_tieude}
                  editable={editable}
                  className={`flex h-12 w-full items-center justify-center rounded-lg border border-[#E2E8F0] bg-white p-1.5 transition-colors hover:border-[#2563EB]${dim(item)}`}
                >
                  <ItemContent item={item} variant={variant} />
                </LinkWrap>
              ))}
            </div>
          </div>
        );
        break;

      case "doan_text":
        content = (
          <div>
            {title}
            <div className="space-y-2 text-sm leading-relaxed text-[#64748B]">
              {items.map((item) =>
                item.tpg_loai === "text" ? (
                  <div key={item.tpg_ma} className={dim(item).trim()}>
                    {item.tpg_tieude && (
                      <p className="font-semibold text-[#0F172A]">
                        {item.tpg_tieude}
                      </p>
                    )}
                    {item.tpg_noidung && <p>{item.tpg_noidung}</p>}
                  </div>
                ) : (
                  <LinkWrap
                    key={item.tpg_ma}
                    href={item.tpg_lienket}
                    newTab={item.tpg_mo_tab_moi}
                    title={item.tpg_tieude}
                    editable={editable}
                    className={`block transition-colors hover:text-[#2563EB]${dim(item)}`}
                  >
                    <ItemContent item={item} variant={variant} />
                  </LinkWrap>
                ),
              )}

              {variant === "footer" && (
                <ul className="mt-3 space-y-1 text-xs text-[#64748B]">
                  {caiDat.cds_hotline && (
                    <li className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[15px]">
                        call
                      </span>
                      {editable ? (
                        <span>{caiDat.cds_hotline}</span>
                      ) : (
                        <a
                          href={`tel:${caiDat.cds_hotline}`}
                          className="hover:text-[#2563EB]"
                        >
                          {caiDat.cds_hotline}
                        </a>
                      )}
                    </li>
                  )}
                  {caiDat.cds_email && (
                    <li className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[15px]">
                        mail
                      </span>
                      {editable ? (
                        <span>{caiDat.cds_email}</span>
                      ) : (
                        <a
                          href={`mailto:${caiDat.cds_email}`}
                          className="hover:text-[#2563EB]"
                        >
                          {caiDat.cds_email}
                        </a>
                      )}
                    </li>
                  )}
                  {caiDat.cds_dia_chi && (
                    <li className="flex items-start gap-1.5">
                      <span className="material-symbols-outlined text-[15px]">
                        location_on
                      </span>
                      <span>{caiDat.cds_dia_chi}</span>
                    </li>
                  )}
                </ul>
              )}
            </div>
          </div>
        );
        break;

      case "danh_sach_doc":
      default:
        content = (
          <div>
            {title}
            <ul className="space-y-2 text-sm text-[#64748B]">
              {items.map((item) => (
                <li key={item.tpg_ma}>
                  <LinkWrap
                    href={item.tpg_lienket}
                    newTab={item.tpg_mo_tab_moi}
                    title={item.tpg_tieude}
                    editable={editable}
                    className={`inline-flex items-center gap-1.5 transition-colors hover:text-[#2563EB]${dim(item)}`}
                  >
                    <ItemContent item={item} variant={variant} />
                  </LinkWrap>
                </li>
              ))}
            </ul>
          </div>
        );
        break;
    }
  }

  if (!editable) return content;

  return (
    <EditableBlock block={block} onEdit={onEditBlock}>
      {content}
    </EditableBlock>
  );
};

export default SiteBlock;
