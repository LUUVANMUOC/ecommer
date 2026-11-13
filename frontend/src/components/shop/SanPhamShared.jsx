// src/components/shop/SanPhamShared.jsx
// Phần dùng chung cho 3 trang: Quản lý sản phẩm, Chi tiết sản phẩm, Cập nhật phân loại
import { useState, useEffect, useRef } from "react";
import sanPhamService from "../../services/gianhang/sanPhamService";
import danhMucSanPhamService from "../../services/gianhang/danhMucSanPhamService";
import chiTietSanPhamService from "../../services/gianhang/chiTietSanPhamService";
import thuongHieuService from "../../services/san/thuongHieuService";
import CrudDrawer from "../common/Crud/CrudDrawer";

export const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL || "http://localhost:8080";
export const imgUrl = (link) => `${BACKEND_URL}${link}`;

export const formatVND = (n) =>
  n || n === 0 ? `${Number(n).toLocaleString("vi-VN")} đ` : "Chưa có giá";

export const formatPriceRange = (info) => {
  if (!info || info.minPrice == null) return "Chưa có giá";
  if (info.minPrice === info.maxPrice) return formatVND(info.minPrice);
  return `Giá từ ${formatVND(info.minPrice)} - ${formatVND(info.maxPrice)}`;
};

export const fieldClass =
  "w-full rounded-xl border border-[#D9D4C7] bg-[#FBFAF7] px-4 py-2.5 text-sm text-[#14201C] placeholder:text-[#9AA39E] transition-all focus:border-[#F2A93B] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#F2A93B]/20";
export const labelClass = "block text-sm font-semibold text-[#3D4A44]";

export const getCurrentShopId = () => {
  const userStr = localStorage.getItem("user");
  return userStr ? JSON.parse(userStr).GH_Ma || "GH01" : "";
};

/* ============================================================
   NGÀNH HÀNG — chuẩn hoá field name + dựng cây + lấy lá
   ============================================================ */
const LOG_NH = "[SanPhamShared::NganhHang]";

// 🟢 Chuẩn hoá item thô từ API: chấp nhận nhiều alias field name
//    (snake_case / PascalCase / camelCase / viết tắt)
const NH_MA_ALIASES = [
  "nh_ma",
  "nh_Ma",
  "NH_Ma",
  "NH_MA",
  "NganhHang_Ma",
  "nganhHangMa",
  "ma",
  "ma_nganh_hang",
  "maNganhHang",
  "id",
];
const NH_TEN_ALIASES = [
  "nh_ten",
  "nh_Ten",
  "NH_Ten",
  "NH_TEN",
  "NganhHang_Ten",
  "nganhHangTen",
  "ten",
  "ten_nganh_hang",
  "tenNganhHang",
  "name",
];
const NH_CHA_ALIASES = [
  "nh_cha",
  "nh_Cha",
  "NH_Cha",
  "NH_CHA",
  "NganhHang_Cha",
  "nganhHangCha",
  "cha",
  "ma_nganh_hang_cha",
  "maNganhHangCha",
  "parent_id",
  "parentId",
  "parent",
];

const pick = (obj, aliases) => {
  for (const key of aliases) {
    if (obj[key] !== undefined && obj[key] !== null && obj[key] !== "") {
      return obj[key];
    }
  }
  return undefined;
};

const normalizeNganhHang = (raw, idx) => {
  if (!raw || typeof raw !== "object") {
    console.warn(`${LOG_NH} normalize: item #${idx} không phải object`, raw);
    return null;
  }
  const nh_ma = pick(raw, NH_MA_ALIASES);
  const nh_ten = pick(raw, NH_TEN_ALIASES);
  const nh_chaRaw = pick(raw, NH_CHA_ALIASES);

  if (nh_ma === undefined || nh_ten === undefined) {
    console.warn(`${LOG_NH} ⚠ normalize: item #${idx} KHÔNG map được field.`, {
      keys: Object.keys(raw),
      raw,
    });
  }

  return {
    ...raw,
    nh_ma,
    nh_ten,
    nh_cha: nh_chaRaw || null,
  };
};

export const buildNganhHangTree = (items) => {
  console.log(`${LOG_NH} buildNganhHangTree CALLED`, {
    isArray: Array.isArray(items),
    count: items?.length ?? "n/a",
  });

  if (!Array.isArray(items) || items.length === 0) {
    console.log(`${LOG_NH} buildNganhHangTree EMPTY -> return []`);
    return [];
  }

  // Log key thực của item đầu để phát hiện schema thật của API
  console.log(
    `${LOG_NH} RAW sample keys =`,
    Object.keys(items[0] || {}),
    "| full sample =",
    items[0],
  );

  // 1) Normalize
  const normalized = items
    .map((it, i) => normalizeNganhHang(it, i))
    .filter(Boolean)
    .filter((it) => it.nh_ma !== undefined && it.nh_ma !== null);

  console.log(
    `${LOG_NH} after normalize: ${normalized.length}/${items.length} item có nh_ma`,
  );

  if (normalized.length === 0) {
    console.error(
      `${LOG_NH} ❌ Toàn bộ item đều thiếu nh_ma. Kiểm tra field name API /nganh-hang!`,
    );
    return [];
  }

  // 2) Dedupe theo nh_ma
  const deduped = Array.from(
    normalized
      .reduce((acc, it) => {
        if (!acc.has(it.nh_ma)) acc.set(it.nh_ma, it);
        return acc;
      }, new Map())
      .values(),
  );
  if (deduped.length !== normalized.length) {
    console.warn(
      `${LOG_NH} đã loại ${normalized.length - deduped.length} item trùng nh_ma`,
    );
  }

  // 3) Build map + nối cây
  const map = {};
  const roots = [];
  deduped.forEach((it) => {
    map[it.nh_ma] = { ...it, children: [] };
  });

  const missingParent = [];
  deduped.forEach((it) => {
    const node = map[it.nh_ma];
    if (it.nh_cha && map[it.nh_cha]) {
      map[it.nh_cha].children.push(node);
    } else {
      if (it.nh_cha && !map[it.nh_cha]) {
        missingParent.push({ nh_ma: it.nh_ma, nh_cha: it.nh_cha });
      }
      roots.push(node);
    }
  });
  if (missingParent.length) {
    console.warn(
      `${LOG_NH} ⚠ ${missingParent.length} node có nh_cha không tồn tại -> đẩy thành root:`,
      missingParent,
    );
  }

  console.log(`${LOG_NH} buildNganhHangTree OUTPUT`, {
    rootsCount: roots.length,
    roots: roots.map((r) => ({
      nh_ma: r.nh_ma,
      nh_ten: r.nh_ten,
      childrenCount: r.children.length,
      childIds: r.children.map((c) => c.nh_ma),
    })),
  });

  return roots;
};

export const getLeafNganhHangs = (nodes, path = []) => {
  const result = [];
  (nodes || []).forEach((node) => {
    // 🟢 fallback: nếu thiếu nh_ten thì dùng nh_ma, nếu vẫn thiếu dùng placeholder
    const ten = node.nh_ten || node.nh_ma || "(chưa đặt tên)";
    const currentPath = [...path, ten];

    if (!node.children || node.children.length === 0) {
      result.push({
        nh_ma: node.nh_ma,
        nh_ten: node.nh_ten || node.nh_ma,
        path: currentPath.join(" > "),
      });
    } else {
      result.push(...getLeafNganhHangs(node.children, currentPath));
    }
  });

  // 🟢 Dedupe lần cuối (cho chắc) + bỏ leaf không có nh_ma
  const seen = new Set();
  const unique = result.filter((l) => {
    if (l.nh_ma === undefined || l.nh_ma === null) return false;
    if (seen.has(l.nh_ma)) return false;
    seen.add(l.nh_ma);
    return true;
  });

  if (unique.length !== result.length) {
    console.warn(
      `${LOG_NH} getLeafNganhHangs: đã loại ${result.length - unique.length} leaf trùng / không có nh_ma`,
    );
  }

  // Log chi tiết kết quả cuối khi đây là lần gọi gốc
  if (path.length === 0) {
    console.log(`${LOG_NH} LEAVES FINAL`, {
      count: unique.length,
      items: unique.map((l) => ({
        nh_ma: l.nh_ma,
        nh_ten: l.nh_ten,
        path: l.path,
      })),
    });
  }

  return unique;
};

/* ---------- Ảnh bìa + khoảng giá cho danh sách ---------- */
export const fetchCovers = async (products) => {
  const results = await Promise.allSettled(
    products.map((p) => chiTietSanPhamService.getBySanPham(p.sp_ma)),
  );
  const next = {};
  results.forEach((r, i) => {
    if (r.status !== "fulfilled") return;
    const variants = r.value.data || [];
    const images = variants.flatMap((v) => v.images || []);
    const cover = images.find((im) => im.hasp_laanhchinh) ?? images[0];
    const prices = variants
      .map((v) => Number(v.gb_gia))
      .filter((p) => Number.isFinite(p) && p > 0);

    let status = "draft";
    const statuses = variants.map((v) => v.trangthai_lichsu?.[0]?.ttctsp_ma);
    if (statuses.includes("TTCTSP0002")) status = "active";
    else if (statuses.includes("TTCTSP0001")) status = "pending";
    else if (statuses.includes("TTCTSP0003")) status = "suspended";

    next[products[i].sp_ma] = {
      url: cover ? imgUrl(cover.hasp_link) : "",
      minPrice: prices.length ? Math.min(...prices) : null,
      maxPrice: prices.length ? Math.max(...prices) : null,
      status: status,
    };
  });
  return next;
};

/* ---------- Bộ lọc ---------- */
export const FilterBar = ({
  filters,
  values,
  onApply,
  onClear,
  getResultCount,
  summary,
}) => {
  const rootRef = useRef(null);
  const [openKey, setOpenKey] = useState(null);
  const [draft, setDraft] = useState({});

  const activeCount = filters.filter((f) => values[f.key]).length;

  useEffect(() => {
    const handleMouseDown = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target))
        setOpenKey(null);
    };
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setOpenKey(null);
    };
    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const toggleFilter = (key) => {
    if (openKey === key) return setOpenKey(null);
    setDraft({ ...values });
    setOpenKey(key);
  };

  const pickOption = (key, value) =>
    setDraft((prev) => ({ ...prev, [key]: value }));
  const clearDraft = (key) => setDraft((prev) => ({ ...prev, [key]: "" }));
  const applyDraft = () => {
    onApply(draft);
    setOpenKey(null);
  };
  const resultCount = getResultCount ? getResultCount(draft) : null;

  return (
    <div
      ref={rootRef}
      className="rounded-2xl border border-[#E2DED3] bg-white p-4 shadow-sm"
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#14201C] px-3.5 py-2 text-sm font-semibold text-[#14201C]">
          <span className="material-symbols-outlined text-[18px]">
            filter_alt
          </span>
          Bộ lọc
          {activeCount > 0 && (
            <span className="grid h-5 min-w-[20px] place-items-center rounded-full bg-[#F2A93B] px-1.5 text-[11px] font-bold text-[#14201C]">
              {activeCount}
            </span>
          )}
        </span>

        {filters.map((f) => {
          const selected = f.options.find((o) => o.value === values[f.key]);
          const isOpen = openKey === f.key;
          const isActive = Boolean(selected);

          return (
            <div key={f.key} className="relative">
              <button
                type="button"
                onClick={() => toggleFilter(f.key)}
                title={selected ? `${f.label}: ${selected.label}` : f.label}
                className={`inline-flex max-w-[240px] items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm transition-colors ${
                  isActive
                    ? "border-[#F2A93B] bg-[#FDF3E1] font-semibold text-[#8A5A0B]"
                    : isOpen
                      ? "border-[#14201C] text-[#14201C]"
                      : "border-[#D9CFC2] text-[#3D4A44] hover:border-[#14201C]/40"
                }`}
              >
                <span className="truncate">{f.label}</span>
                <span
                  className={`material-symbols-outlined text-[18px] transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                >
                  expand_more
                </span>
              </button>

              {isOpen && (
                <div className="absolute left-0 top-full z-30 mt-2 w-[min(440px,90vw)] overflow-hidden rounded-2xl border border-[#E2DED3] bg-white shadow-2xl">
                  <div className="p-4">
                    <p className="mb-3 text-sm font-semibold text-[#14201C]">
                      {f.label}
                    </p>
                    <div className="flex max-h-64 flex-wrap gap-2 overflow-y-auto pr-1">
                      {[{ value: "", label: "Tất cả" }, ...f.options].map(
                        (opt) => {
                          const on = (draft[f.key] || "") === opt.value;
                          return (
                            <button
                              key={opt.value || "__all__"}
                              type="button"
                              onClick={() => pickOption(f.key, opt.value)}
                              className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
                                on
                                  ? "border-[#F2A93B] bg-[#FDF3E1] font-semibold text-[#8A5A0B]"
                                  : "border-[#D9CFC2] text-[#3D4A44] hover:border-[#14201C]/40"
                              }`}
                            >
                              {opt.logo && (
                                <img
                                  src={imgUrl(opt.logo)}
                                  alt={opt.label}
                                  className="h-5 w-5 shrink-0 rounded-full border border-gray-200 object-cover"
                                />
                              )}
                              <span>{opt.label}</span>
                            </button>
                          );
                        },
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 border-t border-[#EFEBE2] bg-[#FBFAF7] p-4">
                    <button
                      type="button"
                      onClick={() => clearDraft(f.key)}
                      className="rounded-full border border-[#F0C4AE] bg-white py-2.5 text-sm font-semibold text-[#B42318] hover:bg-[#FBEDE4]"
                    >
                      Xóa lọc
                    </button>
                    <button
                      type="button"
                      onClick={applyDraft}
                      className="rounded-full bg-[#14201C] py-2.5 text-sm font-semibold text-white hover:bg-[#1E3A34]"
                    >
                      {resultCount !== null
                        ? `Xem ${resultCount} kết quả`
                        : "Áp dụng"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        <div className="ml-auto flex items-center gap-3">
          {summary && (
            <span className="whitespace-nowrap text-xs font-medium text-[#7A857F]">
              {summary}
            </span>
          )}
          {activeCount > 0 && (
            <button
              type="button"
              onClick={onClear}
              className="inline-flex items-center gap-1 text-sm font-semibold text-[#B42318] underline-offset-2 hover:underline"
            >
              <span className="material-symbols-outlined text-[16px]">
                close
              </span>
              Xóa tất cả
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

/* ---------- Thành phần giao diện ---------- */
export const StatCell = ({ icon, iconClass, value, label }) => (
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

export const Card = ({ className = "", children }) => (
  <section
    className={`rounded-2xl border border-[#E2DED3] bg-white shadow-[0_1px_0_rgba(20,32,28,0.04)] ${className}`}
  >
    {children}
  </section>
);

export const SpecRow = ({ label, value }) => (
  <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] gap-4 px-5 py-3 text-sm">
    <span className="text-[#5B6661]">{label}</span>
    <span className="break-words font-medium text-[#14201C]">{value}</span>
  </div>
);

export const Gallery = ({ images, index, onIndex }) => {
  const total = images.length;
  const activeThumbRef = useRef(null);
  const thumbContainerRef = useRef(null);

  useEffect(() => {
    if (activeThumbRef.current && thumbContainerRef.current) {
      const container = thumbContainerRef.current;
      const activeEl = activeThumbRef.current;
      const scrollLeft =
        activeEl.offsetLeft -
        container.offsetWidth / 2 +
        activeEl.offsetWidth / 2;
      container.scrollTo({ left: scrollLeft, behavior: "smooth" });
    }
  }, [index]);

  if (!total) {
    return (
      <div className="flex aspect-[4/3] flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#E2DED3] bg-[#FBFAF7] text-sm text-[#7A857F]">
        <span className="material-symbols-outlined text-[40px] text-[#C9C3B5]">
          add_photo_alternate
        </span>
        Phân loại này chưa có ảnh
      </div>
    );
  }

  const img = images[index];
  const prev = () => onIndex((index - 1 + total) % total);
  const next = () => onIndex((index + 1) % total);

  return (
    <div className="space-y-3">
      <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-[#F8F7F3]">
        <img
          src={imgUrl(img.hasp_link)}
          alt={img.hasp_mota || "Ảnh sản phẩm"}
          className="h-full w-full object-contain p-4"
        />
        {img.hasp_laanhchinh && (
          <span className="absolute left-3 top-3 rounded-md bg-[#F2A93B] px-2 py-0.5 text-[11px] font-bold text-[#14201C] shadow">
            ẢNH CHÍNH
          </span>
        )}
        <span className="absolute right-3 top-3 rounded-full bg-black/55 px-2.5 py-0.5 text-[11px] font-medium text-white">
          {index + 1} / {total}
        </span>
        {total > 1 && (
          <>
            <button
              type="button"
              onClick={prev}
              aria-label="Ảnh trước"
              className="absolute left-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white shadow ring-1 ring-black/5 transition hover:bg-[#14201C] hover:text-white"
            >
              <span className="material-symbols-outlined">chevron_left</span>
            </button>
            <button
              type="button"
              onClick={next}
              aria-label="Ảnh sau"
              className="absolute right-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white shadow ring-1 ring-black/5 transition hover:bg-[#14201C] hover:text-white"
            >
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
          </>
        )}
      </div>

      <p className="min-h-[1.5rem] px-1 text-sm text-[#14201C]">
        {img.hasp_mota || (
          <span className="italic text-[#9AA39E]">Ảnh chưa có mô tả</span>
        )}
      </p>

      {total > 1 && (
        <div className="relative group/thumb">
          <button
            onClick={() => {
              if (thumbContainerRef.current) {
                thumbContainerRef.current.scrollBy({
                  left: -200,
                  behavior: "smooth",
                });
              }
            }}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-7 h-7 bg-white shadow-md border border-gray-200 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-opacity opacity-0 group-hover/thumb:opacity-100"
          >
            <span className="material-symbols-outlined text-[16px]">
              chevron_left
            </span>
          </button>

          <div
            ref={thumbContainerRef}
            className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar"
          >
            {images.map((im, i) => (
              <button
                key={im.hasp_ma ?? i}
                ref={i === index ? activeThumbRef : null}
                type="button"
                onClick={() => onIndex(i)}
                title={im.hasp_mota || `Ảnh ${i + 1}`}
                className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
                  i === index
                    ? "border-[#F2A93B]"
                    : "border-transparent opacity-60 hover:opacity-100"
                }`}
              >
                <img
                  src={imgUrl(im.hasp_link)}
                  alt=""
                  className="h-full w-full object-cover"
                />
              </button>
            ))}
          </div>

          <button
            onClick={() => {
              if (thumbContainerRef.current) {
                thumbContainerRef.current.scrollBy({
                  left: 200,
                  behavior: "smooth",
                });
              }
            }}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-7 h-7 bg-white shadow-md border border-gray-200 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-opacity opacity-0 group-hover/thumb:opacity-100"
          >
            <span className="material-symbols-outlined text-[16px]">
              chevron_right
            </span>
          </button>
        </div>
      )}
    </div>
  );
};

export const AllImagesGrid = ({ images, onPick }) => (
  <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
    {images.map((img, i) => (
      <figure
        key={img.hasp_ma ?? i}
        className="overflow-hidden rounded-xl border border-[#E2DED3]"
      >
        <button
          type="button"
          onClick={() => onPick(i)}
          className="relative block aspect-square w-full overflow-hidden bg-[#F8F7F3]"
          title="Xem ảnh lớn"
        >
          <img
            src={imgUrl(img.hasp_link)}
            alt={img.hasp_mota || `Ảnh ${i + 1}`}
            className="h-full w-full object-contain p-2 transition-transform duration-300 hover:scale-105"
          />
          <span className="absolute left-2 top-2 grid h-6 min-w-[24px] place-items-center rounded-full bg-black/60 px-1.5 text-[11px] font-bold text-white">
            {i + 1}
          </span>
          {img.hasp_laanhchinh && (
            <span className="absolute right-2 top-2 rounded bg-[#F2A93B] px-1.5 py-0.5 text-[9px] font-bold text-[#14201C]">
              ẢNH CHÍNH
            </span>
          )}
        </button>
        <figcaption className="min-h-[2.75rem] border-t border-[#EFEBE2] px-3 py-2 text-xs leading-relaxed text-[#3D4A44]">
          {img.hasp_mota || (
            <span className="italic text-[#9AA39E]">Chưa có mô tả</span>
          )}
        </figcaption>
      </figure>
    ))}
  </div>
);

export const AttributeChips = ({ attributes }) => {
  if (!attributes || attributes.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {attributes.map((tt, i) => {
        const val =
          tt.gttt_giatridinhtinh ??
          (tt.gttt_giatridinhluong != null
            ? String(tt.gttt_giatridinhluong)
            : null);
        if (val === null || val === "") return null;
        return (
          <span
            key={tt.ttsp_ma ?? i}
            className="inline-flex items-center gap-1 rounded-full border border-[#E2DED3] bg-[#FBFAF7] px-3 py-1 text-sm"
          >
            <span className="font-medium text-[#5B6661]">
              {tt.ttsp_ten || tt.ttsp_ma}:
            </span>
            <span className="font-bold text-[#14201C]">{val}</span>
          </span>
        );
      })}
    </div>
  );
};

/* ---------- Drawer thêm/sửa SẢN PHẨM ---------- */
const EMPTY_SP = { sp_ten: "", sp_mota: "", th_ma: "", dmsp_ma: "" };

export const SanPhamFormDrawer = ({
  isOpen,
  onClose,
  mode = "add",
  product,
  brands,
  categories,
  shopId,
  onSaved,
}) => {
  const isEditing = mode === "edit";
  const [formData, setFormData] = useState(EMPTY_SP);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    setFormData({
      sp_ten: product?.sp_ten || "",
      sp_mota: product?.sp_mota || "",
      th_ma: product?.th_ma || "",
      dmsp_ma: product?.dmsp_ma || "",
    });
    setError("");
  }, [isOpen, product]);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!formData.sp_ten) return setError("Vui lòng nhập tên sản phẩm");

    try {
      const payload = {
        ...formData,
        gh_ma: shopId,
        th_ma: formData.th_ma || null,
        dmsp_ma: formData.dmsp_ma || null,
      };
      if (isEditing) {
        await sanPhamService.update(product.sp_ma, payload);
        onSaved("Cập nhật sản phẩm thành công!");
      } else {
        await sanPhamService.create(payload);
        onSaved("Thêm sản phẩm thành công! Vui lòng thêm phân loại.");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Lỗi khi lưu dữ liệu");
    }
  };

  return (
    <CrudDrawer
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? "Chỉnh sửa sản phẩm" : "Thêm sản phẩm mới"}
      description={
        isEditing
          ? `Đang chỉnh sửa mã: ${product?.sp_ma}`
          : "Hệ thống sẽ tự động sinh mã sản phẩm."
      }
      onSubmit={handleSubmit}
      isEditing={isEditing}
      error={error}
    >
      {isEditing && (
        <label className="block space-y-1.5">
          <span className={labelClass}>Mã sản phẩm</span>
          <input
            type="text"
            value={product?.sp_ma || ""}
            disabled
            className="w-full cursor-not-allowed rounded-xl border border-[#E2DED3] bg-[#F1EEE6] px-4 py-2.5 font-mono text-sm text-[#7A857F]"
          />
        </label>
      )}
      <label className="block space-y-1.5">
        <span className={labelClass}>
          Tên sản phẩm <span className="text-[#B42318]">*</span>
        </span>
        <input
          type="text"
          name="sp_ten"
          required
          value={formData.sp_ten}
          onChange={handleChange}
          className={fieldClass}
        />
      </label>
      <label className="block space-y-1.5">
        <span className={labelClass}>Mô tả</span>
        <textarea
          name="sp_mota"
          rows="4"
          value={formData.sp_mota}
          onChange={handleChange}
          className={`${fieldClass} resize-y`}
        />
      </label>
      <div className="grid grid-cols-2 gap-4">
        <label className="block space-y-1.5">
          <span className={labelClass}>Thương hiệu</span>
          <select
            name="th_ma"
            value={formData.th_ma}
            onChange={handleChange}
            className={fieldClass}
          >
            <option value="">-- Chọn --</option>
            {brands.map((b) => (
              <option key={b.th_ma} value={b.th_ma}>
                {b.th_ten}
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-1.5">
          <span className={labelClass}>Danh mục</span>
          <select
            name="dmsp_ma"
            value={formData.dmsp_ma}
            onChange={handleChange}
            className={fieldClass}
          >
            <option value="">-- Chọn --</option>
            {categories.map((c) => (
              <option key={c.dmsp_ma} value={c.dmsp_ma}>
                {c.dmsp_ten}
              </option>
            ))}
          </select>
        </label>
      </div>
    </CrudDrawer>
  );
};

export const loadProductOptions = async (shopId) => {
  const [resB, resC] = await Promise.all([
    thuongHieuService.getByShop(shopId),
    danhMucSanPhamService.getByGianHang(shopId),
  ]);
  return { brands: resB.data, categories: resC.data };
};
