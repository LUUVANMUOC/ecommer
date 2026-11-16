// src/pages/shop/QuanLySanPham.jsx
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import sanPhamService from "../../services/gianhang/sanPhamService";
import chiTietSanPhamService from "../../services/gianhang/chiTietSanPhamService";
import CrudToolbar from "../../components/common/Crud/CrudToolbar";
import ToastNotification from "../../components/common/Crud/ToastNotification";
import {
  FilterBar,
  StatCell,
  SanPhamFormDrawer,
  formatPriceRange,
  getCurrentShopId,
  loadProductOptions,
} from "../../components/shop/SanPhamShared";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8080";
const imgUrl = (link) => (link ? `${BACKEND_URL}${link}` : "");

const PAGE_SIZES = [12, 24, 48, 96];
const SEARCH_DEBOUNCE = 350; // ms
const SLIDER_DEBOUNCE = 400; // ms — ngừng kéo mới gọi API

const STATUS_MAP = {
  active: {
    label: "Đang bán",
    color: "bg-green-100 text-green-800 border-green-200",
  },
  pending: {
    label: "Chờ duyệt",
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
  },
  suspended: {
    label: "Bị đình chỉ",
    color: "bg-red-100 text-red-800 border-red-200",
  },
  draft: {
    label: "Chưa gửi duyệt",
    color: "bg-gray-100 text-gray-800 border-gray-200",
  },
};

const STATUS_TTCTSP = {
  TTCTSP0001: { label: "Chờ duyệt", color: STATUS_MAP.pending.color },
  TTCTSP0002: { label: "Đang bán", color: STATUS_MAP.active.color },
  TTCTSP0003: { label: "Bị đình chỉ", color: STATUS_MAP.suspended.color },
  DEFAULT: { label: "Chưa gửi duyệt", color: STATUS_MAP.draft.color },
};

const fmtSo = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n.toLocaleString("vi-VN") : "0";
};

const fmtRating = (v) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n.toFixed(1) : "—";
};

const fmtDate = (v) => {
  if (!v) return "";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const fmtTien = (v) => `${fmtSo(v)} đ`;

/* Bước nhảy thanh trượt co giãn theo độ lớn dữ liệu */
const stepTheoMax = (max) => {
  if (max <= 20) return 1;
  if (max <= 200) return 5;
  if (max <= 2000) return 10;
  if (max <= 20000) return 100;
  if (max <= 200000) return 1000;
  return 10000;
};

const stepTheoGia = (max) => {
  if (max <= 1000000) return 10000;
  if (max <= 10000000) return 50000;
  if (max <= 50000000) return 100000;
  return 500000;
};

const SORT_OPTIONS = [
  { value: "moi", label: "Mới nhất" },
  { value: "mua", label: "Bán chạy nhất" },
  { value: "xem", label: "Xem nhiều nhất" },
  { value: "sao", label: "Đánh giá cao nhất" },
  { value: "gia_tang", label: "Giá thấp → cao" },
  { value: "gia_giam", label: "Giá cao → thấp" },
  { value: "duyet", label: "Duyệt mới nhất" },
  { value: "duyet_cu", label: "Duyệt muộn nhất" },
];

// null = không lọc (thanh trượt đang ở hết dải)
const EMPTY_APPLIED = { mua: null, xem: null, gia: null, sao: null };

/* Danh sách số trang có dấu "..." */
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

const CardSkeleton = () => (
  <div className="flex animate-pulse flex-col overflow-hidden rounded-2xl border border-[#E2DED3] bg-white shadow-sm">
    <div className="h-40 bg-[#F1EEE6]" />
    <div className="flex flex-1 flex-col gap-3 p-5">
      <div className="h-4 w-3/4 rounded bg-[#EFEBE2]" />
      <div className="h-3 w-full rounded bg-[#F4F1EA]" />
      <div className="h-3 w-2/3 rounded bg-[#F4F1EA]" />
      <div className="h-5 w-1/2 rounded bg-[#EFEBE2]" />
      <div className="mt-auto h-9 w-full rounded-xl bg-[#F4F1EA]" />
    </div>
  </div>
);

/* Thanh trượt 2 đầu (không cần thư viện ngoài) */
const RangeSlider = ({ min, max, step, value, onChange, format }) => {
  const [lo, hi] = value;
  const span = max - min;
  const disabled = !(span > 0);
  const safeMax = disabled ? min + 1 : max;
  const total = safeMax - min;

  const pct = (v) => Math.max(0, Math.min(100, ((v - min) / total) * 100));
  const leftPct = pct(lo);
  const rightPct = pct(hi);

  // Núm nào nằm nửa phải thì cho lên trên để luôn kéo được khi 2 núm trùng nhau
  const loOnTop = lo > (min + safeMax) / 2;

  const thumbClass =
    "pointer-events-none absolute inset-0 h-6 w-full appearance-none bg-transparent outline-none " +
    "[&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 " +
    "[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full " +
    "[&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[#14201C] " +
    "[&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-md " +
    "[&::-webkit-slider-thumb]:cursor-pointer " +
    "[&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 " +
    "[&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 " +
    "[&::-moz-range-thumb]:border-[#14201C] [&::-moz-range-thumb]:bg-white " +
    "[&::-moz-range-thumb]:cursor-pointer";

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-2 text-xs font-semibold text-[#3D4A44]">
        <span className="rounded-md border border-[#EFEBE2] bg-white px-2 py-0.5 tabular-nums">
          {format(lo)}
        </span>
        <span className="text-[#9AA39E]">→</span>
        <span className="rounded-md border border-[#EFEBE2] bg-white px-2 py-0.5 tabular-nums">
          {format(hi)}
        </span>
      </div>

      <div className="relative h-6">
        <div className="absolute top-1/2 h-1.5 w-full -translate-y-1/2 rounded-full bg-[#EFEBE2]" />
        <div
          className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-[#F2A93B]"
          style={{ left: `${leftPct}%`, right: `${100 - rightPct}%` }}
        />

        <input
          type="range"
          min={min}
          max={safeMax}
          step={step}
          value={Math.min(lo, safeMax)}
          disabled={disabled}
          aria-label="Giá trị nhỏ nhất"
          onChange={(e) => {
            const v = Number(e.target.value);
            onChange([Math.min(v, hi), hi]);
          }}
          className={`${thumbClass} ${loOnTop ? "z-30" : "z-10"}`}
        />
        <input
          type="range"
          min={min}
          max={safeMax}
          step={step}
          value={Math.min(hi, safeMax)}
          disabled={disabled}
          aria-label="Giá trị lớn nhất"
          onChange={(e) => {
            const v = Number(e.target.value);
            onChange([lo, Math.max(v, lo)]);
          }}
          className={`${thumbClass} ${loOnTop ? "z-10" : "z-30"}`}
        />
      </div>
    </div>
  );
};

/* Một thẻ lọc: tiêu đề + khoảng thật của shop + thanh trượt */
const RangeFilterCard = ({
  icon,
  label,
  hint,
  bounds,
  value,
  step,
  format,
  onChange,
}) => {
  const ready = Boolean(bounds && value && bounds.max > bounds.min);

  return (
    <div className="rounded-xl border border-[#F1EEE6] bg-[#FBFAF7] p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-[#7A857F]">
          <span className="material-symbols-outlined text-[15px]">{icon}</span>
          {label}
        </span>
        <span className="text-[11px] font-medium text-[#9AA39E]">{hint}</span>
      </div>

      {ready ? (
        <div className="mt-2">
          <RangeSlider
            min={bounds.min}
            max={bounds.max}
            step={step}
            value={value}
            onChange={onChange}
            format={format}
          />
        </div>
      ) : (
        <p className="mt-3 text-xs font-medium text-[#9AA39E]">
          {bounds
            ? "Shop chỉ có một mức — không cần lọc."
            : "Đang tải khoảng dữ liệu..."}
        </p>
      )}
    </div>
  );
};

const QuanLySanPham = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const shopId = getCurrentShopId();

  // ---- Dữ liệu trang hiện tại ----
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  // ---- Phân trang ----
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(12);

  // ---- Tìm kiếm (debounce) ----
  const [searchInput, setSearchInput] = useState("");
  const [q, setQ] = useState("");

  // ---- Bộ lọc cơ bản ----
  const [filters, setFilters] = useState({
    th_ma: "",
    dmsp_ma: "",
    status: "",
  });

  // ---- Bộ lọc nâng cao: khoảng thật của shop + vị trí 2 núm + giá trị đã áp dụng ----
  const [ranges, setRanges] = useState(null);
  const [slider, setSlider] = useState(null);
  const [applied, setApplied] = useState(EMPTY_APPLIED);
  const appliedRef = useRef(EMPTY_APPLIED);

  // ---- Sắp xếp ----
  const [sort, setSort] = useState("moi");

  // ---- Tuỳ chọn cho form / bộ lọc ----
  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);

  // ---- Drawer + modal ----
  const [drawer, setDrawer] = useState({
    isOpen: false,
    mode: "add",
    product: null,
  });
  const [variantModal, setVariantModal] = useState({
    isOpen: false,
    product: null,
    variants: [],
    loading: false,
  });

  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });

  const requestId = useRef(0);

  const showToast = useCallback((message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(
      () => setToast({ show: false, message: "", type: "success" }),
      3000,
    );
  }, []);

  /* =========================================================
     TẢI 1 TRANG SẢN PHẨM (server-side)
     ========================================================= */
  const fetchPage = useCallback(async () => {
    if (!shopId) return;
    const rid = ++requestId.current;
    setLoading(true);

    try {
      const res = await sanPhamService.getPhanTrang(shopId, {
        q: q || undefined,
        th_ma: filters.th_ma || undefined,
        dmsp_ma: filters.dmsp_ma || undefined,
        status: filters.status || undefined,
        mua_tu: applied.mua?.[0],
        mua_den: applied.mua?.[1],
        xem_tu: applied.xem?.[0],
        xem_den: applied.xem?.[1],
        gia_tu: applied.gia?.[0],
        gia_den: applied.gia?.[1],
        sao_tu: applied.sao?.[0],
        sao_den: applied.sao?.[1],
        sort: sort || undefined,
        page,
        limit,
      });
      if (rid !== requestId.current) return;

      const data = res.data || {};
      const nextTotal = Number(data.total) || 0;
      const nextPages = Number(data.total_pages) || 1;

      // Xoá hết bản ghi của trang cuối → tự lùi về trang hợp lệ
      if (nextTotal > 0 && page > nextPages) {
        setPage(nextPages);
        return;
      }

      setRows(data.rows || []);
      setTotal(nextTotal);
      setTotalPages(nextPages);
    } catch (err) {
      if (rid !== requestId.current) return;
      showToast(err.response?.data?.message || "Lỗi khi tải dữ liệu", "error");
    } finally {
      if (rid === requestId.current) setLoading(false);
    }
  }, [shopId, q, filters, applied, sort, page, limit, showToast]);

  useEffect(() => {
    fetchPage();
  }, [fetchPage]);

  /* =========================================================
     TÌM KIẾM: debounce 350ms, đổi từ khoá → về trang 1
     ========================================================= */
  useEffect(() => {
    const timer = setTimeout(() => {
      const next = searchInput.trim();
      setQ(next);
      setPage(1);
    }, SEARCH_DEBOUNCE);
    return () => clearTimeout(timer);
  }, [searchInput]);

  /* =========================================================
     KHOẢNG THỰC TẾ CỦA SHOP → mốc cho thanh trượt
     ========================================================= */
  useEffect(() => {
    if (!shopId) return;
    let alive = true;

    sanPhamService
      .getKhoangLoc(shopId)
      .then((res) => {
        if (!alive) return;
        const d = res.data || {};
        const b = {
          mua: {
            min: Number(d.mua?.min) || 0,
            max: Number(d.mua?.max) || 0,
          },
          xem: {
            min: Number(d.xem?.min) || 0,
            max: Number(d.xem?.max) || 0,
          },
          gia: {
            min: Number(d.gia?.min) || 0,
            max: Number(d.gia?.max) || 0,
          },
          sao: { min: 0, max: 5 },
        };
        setRanges(b);
        setSlider({
          mua: [b.mua.min, b.mua.max],
          xem: [b.xem.min, b.xem.max],
          gia: [b.gia.min, b.gia.max],
          sao: [0, 5],
        });
      })
      .catch(() => {
        if (!alive) return;
        showToast("Không tải được khoảng dữ liệu để lọc", "error");
      });

    return () => {
      alive = false;
    };
  }, [shopId, showToast]);

  /* =========================================================
     KÉO THANH TRƯỢT: ngừng kéo 400ms mới áp dụng
     ========================================================= */
  useEffect(() => {
    if (!ranges || !slider) return;

    const timer = setTimeout(() => {
      const next = {};
      ["mua", "xem", "gia", "sao"].forEach((key) => {
        const [lo, hi] = slider[key];
        const { min, max } = ranges[key];
        // Hết dải = không lọc; shop chỉ có 1 mức cũng = không lọc
        next[key] = max <= min || (lo <= min && hi >= max) ? null : [lo, hi];
      });

      if (JSON.stringify(next) !== JSON.stringify(appliedRef.current)) {
        appliedRef.current = next;
        setApplied(next);
        setPage(1);
      }
    }, SLIDER_DEBOUNCE);

    return () => clearTimeout(timer);
  }, [slider, ranges]);

  /* =========================================================
     THƯƠNG HIỆU / DANH MỤC cho bộ lọc + form
     ========================================================= */
  useEffect(() => {
    if (!shopId) return;
    let alive = true;

    loadProductOptions(shopId)
      .then((opts) => {
        if (!alive) return;
        setBrands(opts.brands || []);
        setCategories(opts.categories || []);
      })
      .catch(() => {
        if (!alive) return;
        showToast("Không tải được thương hiệu / danh mục", "error");
      });

    return () => {
      alive = false;
    };
  }, [shopId, showToast]);

  /* =========================================================
     TOAST chuyển trang
     ========================================================= */
  useEffect(() => {
    if (location.state?.toast) {
      showToast(location.state.toast);
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.state, location.pathname, navigate, showToast]);

  /* =========================================================
     ẢNH BÌA + KHOẢNG GIÁ + TRẠNG THÁI + NGÀY DUYỆT
     ========================================================= */
  const covers = useMemo(() => {
    const out = {};
    rows.forEach((sp) => {
      out[sp.sp_ma] = {
        url: imgUrl(sp.cover_url),
        minPrice: sp.min_price != null ? Number(sp.min_price) : null,
        maxPrice: sp.max_price != null ? Number(sp.max_price) : null,
        status: sp.status || "draft",
        soPhanLoai: Number(sp.so_phan_loai) || 0,
        duyetLuc: sp.duyet_luc || null,
      };
    });
    return out;
  }, [rows]);

  /* =========================================================
     HANDLERS
     ========================================================= */
  const openAddDrawer = () =>
    setDrawer({ isOpen: true, mode: "add", product: null });

  const openEditDrawer = (e, sp) => {
    e.stopPropagation();
    setDrawer({ isOpen: true, mode: "edit", product: sp });
  };

  const closeDrawer = () => setDrawer((d) => ({ ...d, isOpen: false }));

  const handleSaved = (message) => {
    const wasAdd = drawer.mode === "add";
    closeDrawer();
    showToast(message);

    if (wasAdd) {
      // Sản phẩm mới có sp_ma lớn nhất → nằm ở trang 1
      if (page === 1) fetchPage();
      else setPage(1);
    } else {
      fetchPage();
    }
  };

  const handleDelete = async (e, sp) => {
    e.stopPropagation();
    if (!window.confirm(`Bạn có chắc chắn muốn xóa sản phẩm "${sp.sp_ten}"?`))
      return;

    try {
      await sanPhamService.delete(sp.sp_ma);
      showToast(`Đã xóa sản phẩm "${sp.sp_ten}"`);

      if (rows.length === 1 && page > 1) setPage(page - 1);
      else fetchPage();
    } catch (err) {
      alert(err.response?.data?.message || "Không thể xóa sản phẩm.");
    }
  };

  const handleOpenVariants = async (e, sp) => {
    e.stopPropagation();
    setVariantModal({ isOpen: true, product: sp, variants: [], loading: true });

    try {
      const res = await chiTietSanPhamService.getBySanPham(sp.sp_ma);
      setVariantModal((prev) => ({
        ...prev,
        variants: res.data || [],
        loading: false,
      }));
    } catch (error) {
      showToast("Lỗi tải danh sách phân loại", "error");
      setVariantModal((prev) => ({ ...prev, loading: false }));
    }
  };

  const handleApplyFilter = (vals) => {
    setFilters({
      th_ma: vals.th_ma || "",
      dmsp_ma: vals.dmsp_ma || "",
      status: vals.status || "",
    });
    setPage(1);
  };

  const handleClearAdvanced = () => {
    if (ranges) {
      setSlider({
        mua: [ranges.mua.min, ranges.mua.max],
        xem: [ranges.xem.min, ranges.xem.max],
        gia: [ranges.gia.min, ranges.gia.max],
        sao: [0, 5],
      });
    }
    appliedRef.current = EMPTY_APPLIED;
    setApplied(EMPTY_APPLIED);
    setSort("moi");
    setPage(1);
  };

  const handleClearFilter = () => {
    setFilters({ th_ma: "", dmsp_ma: "", status: "" });
    handleClearAdvanced();
  };

  const handleSortChange = (e) => {
    setSort(e.target.value);
    setPage(1);
  };

  const handleLimitChange = (e) => {
    setLimit(Number(e.target.value));
    setPage(1);
  };

  const handleSliderChange = (key, value) => {
    setSlider((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  /* =========================================================
     CẤU HÌNH BỘ LỌC CƠ BẢN
     ========================================================= */
  const filterConfig = [
    {
      key: "status",
      label: "Trạng thái",
      options: [
        { value: "active", label: "Đang bán" },
        { value: "pending", label: "Chờ duyệt" },
        { value: "suspended", label: "Bị đình chỉ" },
        { value: "draft", label: "Chưa gửi duyệt" },
      ],
    },
    {
      key: "th_ma",
      label: "Thương hiệu",
      options: brands.map((b) => ({
        value: b.th_ma,
        label: b.th_ten,
        logo: b.th_hinhanh || b.th_logo,
      })),
    },
    {
      key: "dmsp_ma",
      label: "Danh mục",
      options: categories.map((c) => ({
        value: c.dmsp_ma,
        label: c.dmsp_ten,
      })),
    },
  ];

  const pageList = useMemo(
    () => buildPageList(page, totalPages),
    [page, totalPages],
  );
  const tuDong = total === 0 ? 0 : (page - 1) * limit + 1;
  const denDong = Math.min(page * limit, total);

  const advancedCount = Object.values(applied).filter(Boolean).length;
  const hasAnyFilter = Boolean(
    q ||
    filters.th_ma ||
    filters.dmsp_ma ||
    filters.status ||
    advancedCount > 0,
  );

  if (!shopId)
    return (
      <div className="p-10 text-center text-sm text-gray-500">
        Không xác định được gian hàng. Vui lòng đăng nhập lại.
      </div>
    );

  return (
    <div className="w-full space-y-6">
      <CrudToolbar
        title="Quản lý sản phẩm"
        subtitle="Bấm vào thẻ sản phẩm để xem chi tiết và quản lý phân loại."
        totalItems={total}
        onAdd={openAddDrawer}
        addButtonText="Thêm sản phẩm"
        searchPlaceholder="Tìm theo mã, tên sản phẩm hoặc tên phân loại..."
        searchValue={searchInput}
        onSearchChange={setSearchInput}
      />

      <FilterBar
        filters={filterConfig}
        values={{
          th_ma: filters.th_ma,
          dmsp_ma: filters.dmsp_ma,
          status: filters.status,
        }}
        onApply={handleApplyFilter}
        onClear={handleClearFilter}
        summary={`Hiển thị ${rows.length} / ${total} sản phẩm${
          q ? ` cho “${q}”` : ""
        }`}
      />

      {/* ===== BỘ LỌC NÂNG CAO (khoảng động) + SẮP XẾP ===== */}
      <div className="rounded-2xl border border-[#E2DED3] bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#14201C] px-3.5 py-2 text-sm font-semibold text-[#14201C]">
            <span className="material-symbols-outlined text-[18px]">tune</span>
            Lọc nâng cao
            {advancedCount > 0 && (
              <span className="grid h-5 min-w-[20px] place-items-center rounded-full bg-[#F2A93B] px-1.5 text-[11px] font-bold text-[#14201C]">
                {advancedCount}
              </span>
            )}
          </span>

          <label className="ml-auto flex items-center gap-2 text-sm text-[#5B6661]">
            <span className="material-symbols-outlined text-[18px]">sort</span>
            <span className="font-semibold text-[#3D4A44]">Sắp xếp</span>
            <select
              value={sort}
              onChange={handleSortChange}
              className="rounded-lg border border-[#D9D4C7] bg-[#FBFAF7] px-2 py-1.5 text-sm text-[#14201C] outline-none focus:border-[#F2A93B] focus:ring-2 focus:ring-[#F2A93B]/20"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>

          {advancedCount > 0 && (
            <button
              type="button"
              onClick={handleClearAdvanced}
              className="inline-flex items-center gap-1 text-sm font-semibold text-[#B42318] underline-offset-2 hover:underline"
            >
              <span className="material-symbols-outlined text-[16px]">
                close
              </span>
              Xóa lọc nâng cao
            </button>
          )}
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 border-t border-[#EFEBE2] pt-4 lg:grid-cols-2">
          <RangeFilterCard
            icon="star"
            label="Đánh giá"
            hint="Thang điểm 0 – 5"
            bounds={ranges?.sao}
            value={slider?.sao}
            step={0.5}
            format={(v) => `${Number(v).toFixed(1)} ★`}
            onChange={(v) => handleSliderChange("sao", v)}
          />

          <RangeFilterCard
            icon="shopping_bag"
            label="Lượt mua"
            hint={
              ranges
                ? `Shop: ${fmtSo(ranges.mua.min)} – ${fmtSo(ranges.mua.max)}`
                : "Đang tải..."
            }
            bounds={ranges?.mua}
            value={slider?.mua}
            step={stepTheoMax(ranges?.mua.max || 0)}
            format={fmtSo}
            onChange={(v) => handleSliderChange("mua", v)}
          />

          <RangeFilterCard
            icon="visibility"
            label="Lượt xem"
            hint={
              ranges
                ? `Shop: ${fmtSo(ranges.xem.min)} – ${fmtSo(ranges.xem.max)}`
                : "Đang tải..."
            }
            bounds={ranges?.xem}
            value={slider?.xem}
            step={stepTheoMax(ranges?.xem.max || 0)}
            format={fmtSo}
            onChange={(v) => handleSliderChange("xem", v)}
          />

          <RangeFilterCard
            icon="payments"
            label="Giá bán"
            hint={
              ranges
                ? `Shop: ${fmtTien(ranges.gia.min)} – ${fmtTien(
                    ranges.gia.max,
                  )}`
                : "Đang tải..."
            }
            bounds={ranges?.gia}
            value={slider?.gia}
            step={stepTheoGia(ranges?.gia.max || 0)}
            format={fmtTien}
            onChange={(v) => handleSliderChange("gia", v)}
          />
        </div>
      </div>

      {/* ===== Lưới sản phẩm ===== */}
      <div
        aria-busy={loading}
        className={`grid grid-cols-1 gap-6 transition-opacity duration-200 md:grid-cols-2 xl:grid-cols-3 ${
          loading && rows.length > 0 ? "opacity-60" : ""
        }`}
      >
        {loading && rows.length === 0 ? (
          Array.from({ length: Math.min(limit, 6) }, (_, i) => (
            <CardSkeleton key={`skeleton-${i}`} />
          ))
        ) : rows.length === 0 ? (
          <div className="col-span-full flex flex-col items-center gap-2 py-14 text-center">
            <span className="material-symbols-outlined text-[44px] text-[#C9C3B5]">
              inventory_2
            </span>
            <p className="text-sm font-semibold text-[#3D4A44]">
              {hasAnyFilter
                ? "Không có sản phẩm nào phù hợp với bộ lọc."
                : "Gian hàng chưa có sản phẩm nào."}
            </p>
            {hasAnyFilter && (
              <button
                type="button"
                onClick={() => {
                  setSearchInput("");
                  handleClearFilter();
                }}
                className="mt-1 text-sm font-semibold text-[#8A5A0B] underline-offset-2 hover:underline"
              >
                Xóa bộ lọc & từ khóa
              </button>
            )}
          </div>
        ) : (
          rows.map((sp) => {
            const cover = covers[sp.sp_ma] || {};
            const statusCfg = STATUS_MAP[cover.status] || STATUS_MAP.draft;

            return (
              <article
                key={sp.sp_ma}
                onClick={() =>
                  navigate(`/nguoi-ban/quan-ly-san-pham/${sp.sp_ma}`)
                }
                className="group flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-[#E2DED3] bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[#F2A93B] hover:shadow-lg"
              >
                <div className="relative flex h-40 items-center justify-center overflow-hidden bg-gradient-to-br from-[#F7F5F0] to-[#EFE9DC]">
                  {cover.url ? (
                    <img
                      src={cover.url}
                      alt={sp.sp_ten}
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-contain p-4 transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <span className="material-symbols-outlined text-[44px] text-[#B8AE98]">
                      image
                    </span>
                  )}

                  <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-0.5 font-mono text-[11px] font-semibold text-[#3D4A44] shadow-sm">
                    {sp.sp_ma}
                  </span>

                  <div className="absolute right-3 top-3 flex gap-1.5 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100">
                    <button
                      onClick={(e) => openEditDrawer(e, sp)}
                      title="Sửa sản phẩm"
                      className="grid h-8 w-8 place-items-center rounded-full bg-white text-[#3D4A44] shadow-sm transition-colors hover:bg-[#14201C] hover:text-white"
                    >
                      <span className="material-symbols-outlined text-[17px]">
                        edit
                      </span>
                    </button>
                    <button
                      onClick={(e) => handleDelete(e, sp)}
                      title="Xóa sản phẩm"
                      className="grid h-8 w-8 place-items-center rounded-full bg-white text-[#B42318] shadow-sm transition-colors hover:bg-[#B42318] hover:text-white"
                    >
                      <span className="material-symbols-outlined text-[17px]">
                        delete
                      </span>
                    </button>
                  </div>

                  <span
                    className={`absolute bottom-3 left-3 rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${statusCfg.color}`}
                  >
                    {statusCfg.label}
                  </span>
                </div>

                <div className="flex flex-1 flex-col p-5">
                  <h3 className="line-clamp-1 text-base font-bold text-[#14201C] transition-colors group-hover:text-[#F2A93B]">
                    {sp.sp_ten}
                  </h3>
                  <p className="mt-1 line-clamp-2 min-h-[2.5rem] text-sm text-[#5B6661]">
                    {sp.sp_mota || "Không có mô tả"}
                  </p>

                  <p className="mt-3 text-base font-bold tabular-nums text-[#B42318]">
                    {formatPriceRange(cover)}
                  </p>

                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#FDF3E1] px-2.5 py-0.5 text-xs font-medium text-[#8A5A0B]">
                      <span className="material-symbols-outlined text-[13px]">
                        sell
                      </span>
                      {sp.th_ten || "Chưa có thương hiệu"}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#EEF3F1] px-2.5 py-0.5 text-xs font-medium text-[#2F5D50]">
                      <span className="material-symbols-outlined text-[13px]">
                        category
                      </span>
                      {sp.dmsp_ten || "Chưa có danh mục"}
                    </span>
                    {cover.soPhanLoai > 0 && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#F1EEE6] px-2.5 py-0.5 text-xs font-medium text-[#5B6661]">
                        <span className="material-symbols-outlined text-[13px]">
                          layers
                        </span>
                        {cover.soPhanLoai} phân loại
                      </span>
                    )}
                  </div>

                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={(e) => handleOpenVariants(e, sp)}
                      className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-[#F2A93B] py-2 text-sm font-bold text-white transition-colors hover:bg-[#d9942e]"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        view_list
                      </span>
                      Xem Phân Loại
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/nguoi-ban/quan-ly-san-pham/${sp.sp_ma}`);
                      }}
                      className="rounded-xl bg-gray-100 px-3 py-2 text-sm font-bold text-gray-700 transition-colors hover:bg-gray-200"
                      title="Quản lý chi tiết"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        settings
                      </span>
                    </button>
                  </div>

                  <div className="mt-4 grid grid-cols-4 divide-x divide-[#EFEBE2] overflow-hidden rounded-xl border border-[#EFEBE2] bg-[#FBFAF7]">
                    <StatCell
                      icon="visibility"
                      iconClass="text-[#5B6661]"
                      value={fmtSo(sp.sp_luotxem)}
                      label="Lượt xem"
                    />
                    <StatCell
                      icon="favorite"
                      iconClass="text-[#C0446B]"
                      value={fmtSo(sp.sp_luotthich)}
                      label="Yêu thích"
                    />
                    <StatCell
                      icon="shopping_bag"
                      iconClass="text-[#2F7A5F]"
                      value={fmtSo(sp.sp_luotmua)}
                      label="Đã bán"
                    />
                    <StatCell
                      icon="star"
                      iconClass="text-[#F2A93B]"
                      value={fmtRating(sp.sp_diemdanhgiatrungbinh)}
                      label="Đánh giá"
                    />
                  </div>

                  {cover.duyetLuc && (
                    <p className="mt-3 flex items-center gap-1 text-[11px] font-medium text-[#7A857F]">
                      <span className="material-symbols-outlined text-[13px]">
                        verified
                      </span>
                      Duyệt: {fmtDate(cover.duyetLuc)}
                    </p>
                  )}
                </div>
              </article>
            );
          })
        )}
      </div>

      {/* ===== Phân trang ===== */}
      {total > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#E2DED3] bg-white px-4 py-3 shadow-sm">
          <div className="flex flex-wrap items-center gap-2 text-sm text-[#5B6661]">
            <span>Hiển thị</span>
            <strong className="tabular-nums text-[#14201C]">
              {tuDong}–{denDong}
            </strong>
            <span>trong</span>
            <strong className="tabular-nums text-[#14201C]">{total}</strong>
            <span>sản phẩm</span>

            <span className="mx-1 h-4 w-px bg-[#E2DED3]" />

            <label className="flex items-center gap-1.5">
              <span>Mỗi trang</span>
              <select
                value={limit}
                onChange={handleLimitChange}
                className="rounded-lg border border-[#D9D4C7] bg-[#FBFAF7] px-2 py-1.5 text-sm text-[#14201C] outline-none focus:border-[#F2A93B] focus:ring-2 focus:ring-[#F2A93B]/20"
              >
                {PAGE_SIZES.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="button"
              onClick={fetchPage}
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
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
              className="grid h-8 w-8 place-items-center rounded-lg border border-[#D9D4C7] text-[#3D4A44] transition-colors hover:bg-[#FBFAF7] disabled:cursor-not-allowed disabled:opacity-40"
              title="Trang trước"
            >
              <span className="material-symbols-outlined text-[18px]">
                chevron_left
              </span>
            </button>

            {pageList.map((p, i) =>
              p === "..." ? (
                <span key={`dots-${i}`} className="px-1 text-sm text-[#9AA39E]">
                  …
                </span>
              ) : (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPage(p)}
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
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
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
      )}

      <SanPhamFormDrawer
        isOpen={drawer.isOpen}
        onClose={closeDrawer}
        mode={drawer.mode}
        product={drawer.product}
        brands={brands}
        categories={categories}
        shopId={shopId}
        onSaved={handleSaved}
      />

      {/* ===== MODAL XEM PHÂN LOẠI ===== */}
      {variantModal.isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-[#F8FAFC] shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#E2DED3] bg-white px-6 py-4">
              <div>
                <h2 className="text-xl font-bold text-[#14201C]">
                  Danh sách Phân loại
                </h2>
                <p className="text-sm text-[#7A857F]">
                  Sản phẩm: {variantModal.product?.sp_ten}
                </p>
              </div>
              <button
                onClick={() => setVariantModal({ isOpen: false })}
                className="rounded-full bg-gray-50 p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="custom-scrollbar flex-1 space-y-4 overflow-y-auto bg-gray-50 p-6">
              {variantModal.loading ? (
                <div className="py-10 text-center font-medium text-gray-500">
                  Đang tải phân loại...
                </div>
              ) : variantModal.variants.length === 0 ? (
                <div className="py-10 text-center font-medium text-gray-500">
                  Sản phẩm chưa có phân loại nào.
                </div>
              ) : (
                variantModal.variants.map((item) => {
                  const latestStatus =
                    item.trangthai_lichsu?.[0]?.ttctsp_ma || "DEFAULT";
                  const statusCfg =
                    STATUS_TTCTSP[latestStatus] || STATUS_TTCTSP.DEFAULT;

                  const mainImg =
                    item.images && item.images.length > 0
                      ? item.images[0].hasp_link
                      : null;

                  return (
                    <div
                      key={item.ctsp_ma}
                      className="flex flex-col gap-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm md:flex-row"
                    >
                      <div className="flex shrink-0 gap-4 md:w-1/3">
                        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                          {mainImg ? (
                            <img
                              src={imgUrl(mainImg)}
                              loading="lazy"
                              decoding="async"
                              className="h-full w-full object-cover"
                              alt=""
                            />
                          ) : (
                            <span className="material-symbols-outlined flex h-full items-center justify-center text-gray-300">
                              image
                            </span>
                          )}
                        </div>
                        <div>
                          <span
                            className={`mb-2 inline-block rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${statusCfg.color}`}
                          >
                            {statusCfg.label}
                          </span>
                          <p className="text-base font-bold leading-tight text-[#14201C]">
                            {item.ctsp_ten}
                          </p>
                          <p className="mt-1 font-mono text-xs text-gray-500">
                            Mã: {item.ctsp_ma}
                          </p>
                          <p className="mt-1 text-lg font-bold text-red-600">
                            {Number(item.ctsp_gianban || 0).toLocaleString(
                              "vi-VN",
                            )}{" "}
                            đ
                          </p>
                        </div>
                      </div>

                      <div className="grid flex-1 grid-cols-2 gap-4 rounded-lg border border-gray-100 bg-gray-50 p-3 text-sm">
                        <div>
                          <p className="mb-1 text-xs text-gray-500">Tồn kho</p>
                          <p className="font-bold text-[#0F172A]">
                            {item.ctsp_soluongton}
                          </p>
                        </div>
                        <div>
                          <p className="mb-1 text-xs text-gray-500">
                            Khối lượng
                          </p>
                          <p className="font-bold text-[#0F172A]">
                            {item.ctsp_khoiluong} kg
                          </p>
                        </div>
                        <div className="col-span-2 mt-1 border-t border-gray-200 pt-2">
                          <p className="mb-1 text-xs text-gray-500">
                            Kích thước (D x R x C)
                          </p>
                          <p className="font-bold text-[#0F172A]">
                            {item.ctsp_chieudai} x {item.ctsp_chieurong} x{" "}
                            {item.ctsp_chieucao} cm
                          </p>
                        </div>
                        <div className="col-span-2 mt-1 border-t border-gray-200 pt-2">
                          <p className="mb-1 text-xs text-gray-500">
                            Mô tả phân loại
                          </p>
                          <p className="line-clamp-2 text-xs italic text-gray-700">
                            "{item.ctsp_mota}"
                          </p>
                        </div>
                      </div>

                      <div className="flex shrink-0 flex-col justify-center gap-2 md:w-40">
                        <div className="flex items-center justify-between rounded-lg border border-blue-100 bg-blue-50 px-3 py-1.5">
                          <span className="text-xs font-semibold text-blue-600">
                            Lượt xem
                          </span>
                          <span className="font-bold text-blue-700">
                            {item.ctsp_luotxem}
                          </span>
                        </div>
                        <div className="flex items-center justify-between rounded-lg border border-pink-100 bg-pink-50 px-3 py-1.5">
                          <span className="text-xs font-semibold text-pink-600">
                            Lượt thích
                          </span>
                          <span className="font-bold text-pink-700">
                            {item.ctsp_luotthich}
                          </span>
                        </div>
                        <div className="flex items-center justify-between rounded-lg border border-green-100 bg-green-50 px-3 py-1.5">
                          <span className="text-xs font-semibold text-green-600">
                            Đã bán
                          </span>
                          <span className="font-bold text-green-700">
                            {item.ctsp_luotmua}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      <ToastNotification toast={toast} />
    </div>
  );
};

export default QuanLySanPham;
