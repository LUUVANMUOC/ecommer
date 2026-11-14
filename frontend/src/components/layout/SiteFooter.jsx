// src/components/layout/SiteFooter.jsx
import { Link } from "react-router-dom";
import useGiaoDien from "../../hooks/useGiaoDien";
import SiteBlock from "./SiteBlock";

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

const SiteFooter = ({
  data = null,
  editable = false,
  onEditSettings = null,
  onEditBlock = null,
}) => {
  const hookData = useGiaoDien();

  const caiDat = (data?.cai_dat ?? hookData.cai_dat) || {};
  const blocks = data ? data.footer || [] : hookData.footer || [];

  if (caiDat.cds_hien_footer === false) return null;

  const logoInner = (
    <>
      {caiDat.cds_logo ? (
        <img
          src={imgUrl(caiDat.cds_logo)}
          alt={caiDat.cds_ten_hien_thi || "Logo"}
          className="h-10 w-10 rounded-xl object-contain"
        />
      ) : (
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-[#2563EB] to-[#1D4ED8] text-white">
          <span className="material-symbols-outlined text-[20px]">
            storefront
          </span>
        </span>
      )}
      <span className="leading-tight">
        <span className="block text-lg font-bold text-[#2563EB]">
          {caiDat.cds_ten_hien_thi || "CT255 Shop"}
        </span>
        {caiDat.cds_khau_hieu && (
          <span className="block text-[11px] text-[#64748B]">
            {caiDat.cds_khau_hieu}
          </span>
        )}
      </span>
    </>
  );

  return (
    <footer className="mt-12 border-t border-[#E2E8F0] bg-white">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-3">
            {editable ? (
              <button
                type="button"
                onClick={() => onEditSettings?.()}
                title="Bấm để sửa cài đặt chung (logo, tên, hotline...)"
                className="flex items-center gap-2.5 rounded-xl text-left outline outline-1 outline-dashed outline-transparent transition hover:outline-[#2563EB]"
              >
                {logoInner}
              </button>
            ) : (
              <Link to="/" className="flex items-center gap-2.5">
                {logoInner}
              </Link>
            )}

            {caiDat.cds_dia_chi && (
              <p className="flex items-start gap-1.5 text-xs leading-relaxed text-[#64748B]">
                <span className="material-symbols-outlined text-[15px]">
                  location_on
                </span>
                <span>{caiDat.cds_dia_chi}</span>
              </p>
            )}
            {caiDat.cds_hotline && (
              <p className="flex items-center gap-1.5 text-xs text-[#64748B]">
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
              </p>
            )}
            {caiDat.cds_email && (
              <p className="flex items-center gap-1.5 text-xs text-[#64748B]">
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
              </p>
            )}
          </div>

          {blocks.map((block) => (
            <SiteBlock
              key={block.kvg_ma}
              block={block}
              caiDat={caiDat}
              variant="footer"
              editable={editable}
              onEditBlock={onEditBlock}
            />
          ))}
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-2 border-t border-[#F1F5F9] pt-5 text-xs text-[#94A3B8] md:flex-row">
          <span>
            {caiDat.cds_ban_quyen ||
              `© ${new Date().getFullYear()} CT255. Bảo lưu mọi quyền.`}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[14px]">
              verified
            </span>
            Sàn thương mại điện tử CT255
          </span>
        </div>
      </div>
    </footer>
  );
};

export default SiteFooter;
