// src/pages/khachhang/DanhSachSanPham.jsx
import {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
  useContext,
  memo,
} from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import publicSanPhamService from "../../services/san/publicSanPhamService";
import thuongHieuService from "../../services/san/thuongHieuService";
import gioHangService from "../../services/khachhang/gioHangService";
import { AuthContext } from "../../contexts/AuthContext";
import { formatPriceRange } from "../../components/shop/SanPhamShared";
import ToastNotification from "../../components/common/Crud/ToastNotification";
import Avatar from "../../components/common/Avatar";
import SiteHeader from "../../components/layout/SiteHeader";
import SiteFooter from "../../components/layout/SiteFooter";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8080";
const ITEMS_PER_PAGE = 20;
const TOP_LIMIT = 10;
const SEARCH_DEBOUNCE = 350; // ms
const SORT_VALUES = ["newest", "popular", "price_asc", "price_desc"];

const imgUrl = (link) => (link ? `${BACKEND_URL}${link}` : "");

const money = (v) => {
  const n = Number(v);
  if (!Number.isFinite(n)) return "—";
  return `${n.toLocaleString("vi-VN")} đ`;
};

const fmtDate = (v) => {
  if (!v) return "Không giới hạn";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("vi-VN");
};

/* =====================================================================
 * CACHE CẤP MODULE
 * - listCache: cache từng trang sản phẩm (stale-while-revalidate)
 * - noiBatCache: 3 khối nổi bật chỉ tải 1 lần / phiên
 * ===================================================================== */
const listCache = new Map();
let noiBatCache = null;

const buildKey = (page, search, brand, sort) =>
  `${page}|${ITEMS_PER_PAGE}|${search}|${brand}|${sort}`;

const parseListResponse = (payload) => {
  const data = Array.isArray(payload?.data) ? payload.data : [];
  const total = Number(payload?.total ?? data.length);
  const totalPages = payload?.totalPages
    ? Number(payload.totalPages)
    : Math.max(1, Math.ceil(total / ITEMS_PER_PAGE));

  return { data, total, totalPages };
};

/* ---------- Khối cuộn ngang dùng chung ---------- */
const SectionRow = ({
  icon,
  title,
  subtitle,
  loading,
  empty,
  emptyText,
  children,
}) => (
  <section className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
    <div className="mb-4 flex items-start gap-3">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#EFF6FF] text-[#2563EB]">
        <span className="material-symbols-outlined text-[20px]">{icon}</span>
      </span>
      <div className="min-w-0">
        <h2 className="text-base font-bold text-[#0F172A]">{title}</h2>
        {subtitle && (
          <p className="mt-0.5 text-xs text-[#64748B]">{subtitle}</p>
        )}
      </div>
    </div>

    {loading ? (
      <div className="flex gap-3 overflow-hidden">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-[148px] w-[168px] shrink-0 animate-pulse rounded-xl bg-[#F1F5F9]"
          />
        ))}
      </div>
    ) : empty ? (
      <p className="py-8 text-center text-sm text-[#94A3B8]">{emptyText}</p>
    ) : (
      <div className="-mx-1 -mt-1.5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pt-1.5 pb-2">
        {children}
      </div>
    )}
  </section>
);

/* ---------- Thẻ thương hiệu (KHÔNG hiển thị doanh thu) ---------- */
const BrandCard = ({ brand, onPick }) => (
  <button
    type="button"
    onClick={() => onPick(brand.th_ma)}
    title={`Xem sản phẩm của ${brand.th_ten}`}
    className="group w-[168px] shrink-0 snap-start rounded-xl border border-[#E2E8F0] bg-white p-3 text-left transition-all hover:-translate-y-0.5 hover:border-[#2563EB] hover:shadow-md"
  >
    <div className="mb-2 flex h-16 items-center justify-center overflow-hidden rounded-lg bg-[#F8FAFC]">
      {brand.th_hinhanh ? (
        <img
          src={imgUrl(brand.th_hinhanh)}
          alt={brand.th_ten}
          loading="lazy"
          className="h-full w-full object-contain p-2 transition-transform duration-300 group-hover:scale-105"
        />
      ) : (
        <span className="material-symbols-outlined text-3xl text-gray-300">
          sell
        </span>
      )}
    </div>
    <p className="line-clamp-1 text-sm font-semibold text-[#0F172A] group-hover:text-[#2563EB]">
      {brand.th_ten}
    </p>
    <p className="mt-1 text-[11px] text-[#64748B]">
      {Number(brand.so_don || 0)} đơn · {Number(brand.so_san_pham || 0)} SP
    </p>
  </button>
);

/* ---------- Thẻ gian hàng ---------- */
const ShopCard = ({ shop }) => {
  const diem = Number(shop.gh_danhgia || 0);

  return (
    <Link
      to={`/shop/${shop.gh_ma}`}
      className="group flex w-[236px] shrink-0 snap-start gap-3 rounded-xl border border-[#E2E8F0] bg-white p-3 transition-all hover:-translate-y-0.5 hover:border-[#2563EB] hover:shadow-md"
    >
      <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-full border border-[#E2E8F0] bg-[#F8FAFC]">
        <Avatar
          src={shop.gh_hinhanh}
          role="shop"
          name={shop.gh_ten}
          className="h-full w-full object-cover"
        />
      </div>

      <div className="min-w-0">
        <p className="line-clamp-1 text-sm font-semibold text-[#0F172A] group-hover:text-[#2563EB]">
          {shop.gh_ten}
        </p>

        <div className="mt-1 flex items-center gap-1 text-xs">
          <span
            className="material-symbols-outlined text-[15px] text-[#F59E0B]"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            star
          </span>
          {diem > 0 ? (
            <span className="font-bold text-[#0F172A]">{diem.toFixed(1)}</span>
          ) : (
            <span className="text-[#94A3B8]">Chưa có đánh giá</span>
          )}
        </div>

        <p className="mt-1 text-[11px] text-[#64748B]">
          {Number(shop.so_san_pham || 0)} sản phẩm ·{" "}
          {Number(shop.gh_theodoi || 0)} theo dõi
        </p>
      </div>
    </Link>
  );
};

/* ---------- Thẻ voucher ---------- */
const VoucherCard = ({ voucher, onCopy }) => (
  <button
    type="button"
    onClick={() => onCopy(voucher.mgg_shop_ma)}
    title="Bấm để sao chép mã"
    className="group w-[268px] shrink-0 snap-start overflow-hidden rounded-xl border border-[#E2E8F0] bg-white text-left transition-all hover:-translate-y-0.5 hover:border-[#2563EB] hover:shadow-md"
  >
    <div className="flex items-stretch">
      <div className="flex w-[74px] shrink-0 flex-col items-center justify-center bg-gradient-to-br from-[#2563EB] to-[#1D4ED8] px-2 py-3 text-white">
        <span className="text-xl font-bold leading-none">
          {Number(voucher.mgg_shop_phantramgiam || 0)}%
        </span>
        <span className="mt-1 text-[10px] font-semibold uppercase tracking-wide">
          giảm
        </span>
      </div>

      <div className="min-w-0 flex-1 p-3">
        <p className="line-clamp-1 text-sm font-semibold text-[#0F172A] group-hover:text-[#2563EB]">
          {voucher.mgg_shop_ten || "Voucher shop"}
        </p>
        <p className="mt-0.5 text-xs text-[#64748B]">
          Giảm tối đa{" "}
          <strong className="text-[#DC2626]">
            {money(voucher.mgg_shop_sotiengiamtoidamoilan)}
          </strong>
        </p>
        <p className="text-xs text-[#64748B]">
          Đơn từ {money(voucher.mgg_shop_giatridontoithieu)}
        </p>

        <div className="mt-1.5 flex items-center justify-between gap-2">
          <span className="rounded-md bg-[#EFF6FF] px-2 py-0.5 font-mono text-[11px] font-bold text-[#2563EB]">
            {voucher.mgg_shop_ma}
          </span>
          <span className="text-[10px] text-[#94A3B8]">
            HSD {fmtDate(voucher.mgg_shop_thoidiemketthuc)}
          </span>
        </div>

        <p className="mt-1 line-clamp-1 text-[11px] text-[#64748B]">
          {voucher.gh_ten}
        </p>
      </div>
    </div>
  </button>
);

/* ---------- Thẻ sản phẩm (memo: không re-render khi state khác đổi) ---------- */
const ProductCard = memo(({ sp }) => (
  <Link
    to={`/san-pham/${sp.sp_ma}?ctsp_ma=${sp.first_variant_id}`}
    className="group flex flex-col overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
  >
    <div className="relative flex aspect-square items-center justify-center overflow-hidden bg-[#F8FAFC]">
      {sp.cover_image ? (
        <img
          src={imgUrl(sp.cover_image)}
          alt={sp.sp_ten}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-contain p-3 transition-transform duration-500 group-hover:scale-110"
        />
      ) : (
        <span className="material-symbols-outlined text-6xl text-gray-300">
          image
        </span>
      )}
    </div>
    <div className="flex flex-1 flex-col p-4">
      <h3 className="line-clamp-2 min-h-[40px] text-sm font-semibold leading-snug text-[#0F172A] group-hover:text-[#2563EB]">
        {sp.sp_ten}
      </h3>
      <div className="mt-auto pt-3">
        <p className="text-lg font-bold text-[#DC2626]">
          {formatPriceRange({
            minPrice: sp.min_price,
            maxPrice: sp.max_price,
          })}
        </p>
        <div className="mt-2 flex items-center justify-between text-xs font-medium text-[#64748B]">
          <span className="flex items-center gap-1">
            <span
              className="material-symbols-outlined text-[16px] text-[#F59E0B]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              star
            </span>
            {Number(sp.sp_diemdanhgiatrungbinh || 0).toFixed(1)}
          </span>
          <span>Đã bán {sp.sp_luotmua || 0}</span>
        </div>
      </div>
    </div>
  </Link>
));

/* ---------- Skeleton lưới sản phẩm ---------- */
const GridSkeleton = () => (
  <div className="grid grid-cols-2 gap-5 md:grid-cols-4 lg:grid-cols-5">
    {Array.from({ length: 10 }).map((_, i) => (
      <div
        key={i}
        className="overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white"
      >
        <div className="aspect-square animate-pulse bg-[#F1F5F9]" />
        <div className="space-y-2 p-4">
          <div className="h-3 w-full animate-pulse rounded bg-[#F1F5F9]" />
          <div className="h-3 w-2/3 animate-pulse rounded bg-[#F1F5F9]" />
          <div className="h-5 w-1/2 animate-pulse rounded bg-[#F1F5F9]" />
        </div>
      </div>
    ))}
  </div>
);

const DanhSachSanPham = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  /* ================= STATE ================= */
  /* Truy vấn: URL là nguồn sự thật.
   * page / search / brand / sort nằm trên query string để Back, Forward, F5
   * và chia sẻ link đều giữ đúng trạng thái danh sách.
   */
  const query = useMemo(() => {
    const page = Math.floor(Number(searchParams.get("page")));
    const sort = searchParams.get("sort");
    return {
      page: page > 0 ? page : 1,
      search: (searchParams.get("search") || "").trim(),
      brand: searchParams.get("brand") || "",
      sort: SORT_VALUES.includes(sort) ? sort : "newest",
    };
  }, [searchParams]);

  // Mọi thay đổi trong cùng trang danh sách đều dùng replace → history chỉ có
  // 1 entry /san-pham, nên Back sẽ thoát về trang trước thay vì lùi từng bộ lọc.
  const writeQuery = useCallback(
    (patch) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          const page = patch.page ?? (Number(prev.get("page")) || 1);
          const search = (patch.search ?? prev.get("search") ?? "").trim();
          const brand = patch.brand ?? prev.get("brand") ?? "";
          const sort = patch.sort ?? prev.get("sort") ?? "newest";

          if (page > 1) next.set("page", String(page));
          else next.delete("page");

          if (search) next.set("search", search);
          else next.delete("search");

          if (brand) next.set("brand", brand);
          else next.delete("brand");

          if (sort !== "newest" && SORT_VALUES.includes(sort)) {
            next.set("sort", sort);
          } else {
            next.delete("sort");
          }

          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  // Ô tìm kiếm: giữ bản nháp khi đang gõ, nhưng bỏ ngay khi URL đổi
  // (Back/Forward, đổi bộ lọc, chuyển trang). Không cần effect đồng bộ.
  const [searchDraft, setSearchDraft] = useState({
    key: location.key,
    value: query.search,
  });
  const searchInput =
    searchDraft.key === location.key ? searchDraft.value : query.search;
  const handleSearchInput = (value) =>
    setSearchDraft({ key: location.key, value });

  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // 3 khối nổi bật
  const [noiBat, setNoiBat] = useState({
    thuong_hieu: [],
    gian_hang: [],
    voucher: [],
  });
  const [noiBatLoading, setNoiBatLoading] = useState(!noiBatCache);

  // Thương hiệu cho dropdown (lazy-load lần đầu mở)
  const [brandList, setBrandList] = useState([]);
  const [brandLoading, setBrandLoading] = useState(false);
  const brandsRequested = useRef(false);

  const [cartCount, setCartCount] = useState(0);

  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });

  const toastTimer = useRef(null);
  const gridRef = useRef(null);

  const showToast = useCallback((message, type = "success") => {
    setToast({ show: true, message, type });
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(
      () => setToast((t) => ({ ...t, show: false })),
      2500,
    );
  }, []);

  /* ================= TẢI DANH SÁCH SẢN PHẨM ================= */
  const cacheKey = buildKey(query.page, query.search, query.brand, query.sort);

  useEffect(() => {
    let alive = true;
    const cached = listCache.get(cacheKey);

    if (cached) {
      // Stale-while-revalidate: hiện ngay dữ liệu cũ, cập nhật ngầm
      setProducts(cached.data);
      setTotal(cached.total);
      setTotalPages(cached.totalPages);
      setLoading(false);
      setRefreshing(true);
    } else {
      setLoading(true);
      setProducts([]);
    }

    publicSanPhamService
      .getAll({
        page: query.page,
        limit: ITEMS_PER_PAGE,
        search: query.search,
        brand: query.brand,
        sort: query.sort,
      })
      .then((res) => {
        if (!alive) return;
        const parsed = parseListResponse(res.data);
        listCache.set(cacheKey, parsed);
        setProducts(parsed.data);
        setTotal(parsed.total);
        setTotalPages(parsed.totalPages);
      })
      .catch((error) => {
        if (!alive) return;
        console.error("Lỗi tải dữ liệu sản phẩm:", error);
        if (!cached) {
          setProducts([]);
          setTotal(0);
          setTotalPages(1);
        }
      })
      .finally(() => {
        if (!alive) return;
        setLoading(false);
        setRefreshing(false);
      });

    return () => {
      alive = false;
    };
  }, [cacheKey, query.page, query.search, query.brand, query.sort]);

  // URL có ?page vượt quá tổng số trang → đưa về trang cuối.
  useEffect(() => {
    if (loading || totalPages < 1 || query.page <= totalPages) return;
    writeQuery({ page: totalPages });
  }, [loading, totalPages, query.page, writeQuery]);

  /* ================= PREFETCH TRANG KẾ ================= */
  useEffect(() => {
    if (query.page >= totalPages) return;

    const nextKey = buildKey(
      query.page + 1,
      query.search,
      query.brand,
      query.sort,
    );
    if (listCache.has(nextKey)) return;

    const timer = window.setTimeout(() => {
      publicSanPhamService
        .getAll({
          page: query.page + 1,
          limit: ITEMS_PER_PAGE,
          search: query.search,
          brand: query.brand,
          sort: query.sort,
        })
        .then((res) => {
          if (!listCache.has(nextKey)) {
            listCache.set(nextKey, parseListResponse(res.data));
          }
        })
        .catch(() => {});
    }, 900);

    return () => window.clearTimeout(timer);
  }, [query.page, query.search, query.brand, query.sort, totalPages]);

  /* ================= DEBOUNCE Ô TÌM KIẾM ================= */
  useEffect(() => {
    const term = searchInput.trim();
    if (term === query.search) return;

    const timer = window.setTimeout(() => {
      writeQuery({ search: term, page: 1 });
    }, SEARCH_DEBOUNCE);

    return () => window.clearTimeout(timer);
  }, [searchInput, query.search, writeQuery]);

  /* ================= 3 KHỐI NỔI BẬT ================= */
  useEffect(() => {
    let alive = true;

    if (noiBatCache) {
      setNoiBat(noiBatCache);
      setNoiBatLoading(false);
      return undefined;
    }

    setNoiBatLoading(true);

    publicSanPhamService
      .getNoiBat(TOP_LIMIT)
      .then((res) => {
        const data = {
          thuong_hieu: res.data?.thuong_hieu || [],
          gian_hang: res.data?.gian_hang || [],
          voucher: res.data?.voucher || [],
        };
        noiBatCache = data;
        if (alive) setNoiBat(data);
      })
      .catch((err) => {
        console.error("Lỗi tải khối nổi bật:", err);
      })
      .finally(() => {
        if (alive) setNoiBatLoading(false);
      });

    return () => {
      alive = false;
    };
  }, []);

  /* ================= THƯƠNG HIỆU (LAZY) ================= */
  const ensureBrands = useCallback(() => {
    if (brandsRequested.current) return;
    brandsRequested.current = true;
    setBrandLoading(true);

    thuongHieuService
      .getAll()
      .then((res) => {
        setBrandList(Array.isArray(res.data) ? res.data : []);
      })
      .catch(() => {
        brandsRequested.current = false; // cho phép thử lại
      })
      .finally(() => setBrandLoading(false));
  }, []);

  // Ưu tiên danh sách đầy đủ; nếu chưa tải thì suy ra từ sản phẩm đang có
  const brands = useMemo(() => {
    if (brandList.length > 0) {
      return brandList
        .filter((b) => b.th_ma && b.th_ten)
        .map((b) => ({ id: b.th_ma, name: b.th_ten }));
    }

    const bMap = new Map();
    products.forEach((p) => {
      if (p.th_ma && p.th_ten) bMap.set(p.th_ma, p.th_ten);
    });
    return Array.from(bMap, ([id, name]) => ({ id, name }));
  }, [brandList, products]);

  /* ================= GIỎ HÀNG ================= */
  useEffect(() => {
    if (user && user.kh_ma) {
      gioHangService
        .getCartCount(user.kh_ma)
        .then((res) => setCartCount(res.data.total))
        .catch(() => {});
    } else {
      setCartCount(0);
    }
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  /* ================= HANDLERS ================= */
  const handleSubmitSearch = useCallback(() => {
    writeQuery({ search: searchInput.trim(), page: 1 });
  }, [searchInput, writeQuery]);

  const handleClearSearch = useCallback(() => {
    setSearchDraft({ key: location.key, value: "" });
    writeQuery({ search: "", page: 1 });
  }, [location.key, writeQuery]);

  const handleClearFilters = () => {
    setSearchDraft({ key: location.key, value: "" });
    writeQuery({ search: "", brand: "", sort: "newest", page: 1 });
  };

  const handlePickBrand = (th_ma) => {
    writeQuery({ brand: th_ma, page: 1 });
    window.setTimeout(() => {
      gridRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 60);
  };

  const handleCopyCode = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
      showToast(`Đã sao chép mã [${code}]`);
    } catch {
      showToast(`Không sao chép được, mã của bạn là: ${code}`, "error");
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages || newPage === query.page) return;
    writeQuery({ page: newPage });
    // Chờ effect cuộn lên đầu của ScrollRestoration chạy xong rồi mới cuộn tới lưới.
    window.setTimeout(() => {
      gridRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 60);
  };

  /* ================= PHÂN TRANG ================= */
  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const items = [];
    for (let i = 1; i <= totalPages; i += 1) {
      const nearCurrent = i >= query.page - 1 && i <= query.page + 1;
      if (i === 1 || i === totalPages || nearCurrent) {
        items.push(i);
      } else if (i === query.page - 2 || i === query.page + 2) {
        items.push(`dots-${i}`);
      }
    }

    return (
      <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          onClick={() => handlePageChange(query.page - 1)}
          disabled={query.page === 1}
          className="rounded-xl border border-[#E2E8F0] bg-white px-4 py-2 text-sm font-semibold text-[#334155] hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Trước
        </button>

        {items.map((item) =>
          typeof item === "string" ? (
            <span key={item} className="px-1 text-gray-400">
              …
            </span>
          ) : (
            <button
              key={item}
              type="button"
              onClick={() => handlePageChange(item)}
              className={`flex h-10 w-10 items-center justify-center rounded-xl border text-sm font-semibold transition-colors ${
                query.page === item
                  ? "border-[#2563EB] bg-[#2563EB] text-white"
                  : "border-[#E2E8F0] bg-white text-[#334155] hover:bg-gray-50"
              }`}
            >
              {item}
            </button>
          ),
        )}

        <button
          type="button"
          onClick={() => handlePageChange(query.page + 1)}
          disabled={query.page === totalPages}
          className="rounded-xl border border-[#E2E8F0] bg-white px-4 py-2 text-sm font-semibold text-[#334155] hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Sau
        </button>
      </div>
    );
  };

  const hasFilter =
    Boolean(query.brand) || Boolean(query.search) || query.sort !== "newest";

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans">
      {/* ===== Header động (admin cấu hình) ===== */}
      <SiteHeader
        showUtilities
        cartCount={cartCount}
        user={user}
        onLogout={handleLogout}
        search={{
          value: searchInput,
          onChange: handleSearchInput,
          onSubmit: handleSubmitSearch,
          onClear: handleClearSearch,
          loading: loading && query.page === 1,
        }}
      />

      <main className="mx-auto max-w-7xl space-y-6 px-6 py-8">
        {/* ===== 3 KHỐI NỔI BẬT ===== */}
        <SectionRow
          icon="sell"
          title="Top 10 thương hiệu doanh thu cao nhất"
          subtitle="Xếp hạng theo doanh thu 90 ngày gần nhất, chỉ tính đơn đã hoàn thành"
          loading={noiBatLoading}
          empty={noiBat.thuong_hieu.length === 0}
          emptyText="Chưa có dữ liệu bán hàng trong 90 ngày gần nhất."
        >
          {noiBat.thuong_hieu.map((b) => (
            <BrandCard key={b.th_ma} brand={b} onPick={handlePickBrand} />
          ))}
        </SectionRow>

        <SectionRow
          icon="storefront"
          title="Top 10 gian hàng được đánh giá cao nhất"
          subtitle="Xếp theo điểm đánh giá của gian hàng"
          loading={noiBatLoading}
          empty={noiBat.gian_hang.length === 0}
          emptyText="Chưa có gian hàng nào."
        >
          {noiBat.gian_hang.map((s) => (
            <ShopCard key={s.gh_ma} shop={s} />
          ))}
        </SectionRow>

        <SectionRow
          icon="confirmation_number"
          title="Top 10 voucher giảm giá cao nhất"
          subtitle="Chỉ hiển thị voucher đang hiệu lực — bấm để sao chép mã"
          loading={noiBatLoading}
          empty={noiBat.voucher.length === 0}
          emptyText="Chưa có voucher nào đang hiệu lực."
        >
          {noiBat.voucher.map((v) => (
            <VoucherCard
              key={v.mgg_shop_ma}
              voucher={v}
              onCopy={handleCopyCode}
            />
          ))}
        </SectionRow>

        {/* ===== BỘ LỌC + LƯỚI SẢN PHẨM ===== */}
        <div ref={gridRef} className="scroll-mt-24">
          {/* Bộ lọc đặt sát lưới sản phẩm */}
          <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
            <div className="flex w-full flex-wrap items-center gap-3 md:w-auto">
              <span className="flex items-center gap-1 text-sm font-semibold text-[#64748B]">
                <span className="material-symbols-outlined text-[18px]">
                  filter_alt
                </span>
                Bộ lọc:
              </span>

              <select
                value={query.brand}
                onFocus={ensureBrands}
                onMouseDown={ensureBrands}
                onChange={(e) => writeQuery({ brand: e.target.value, page: 1 })}
                className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-2 text-sm text-[#0F172A] outline-none focus:border-[#2563EB] focus:bg-white"
              >
                <option value="">
                  {brandLoading ? "Đang tải thương hiệu..." : "Thương hiệu"}
                </option>
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>

              <select
                value={query.sort}
                onChange={(e) => writeQuery({ sort: e.target.value, page: 1 })}
                className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-2 text-sm text-[#0F172A] outline-none focus:border-[#2563EB] focus:bg-white"
              >
                <option value="newest">Mới nhất</option>
                <option value="popular">Bán chạy</option>
                <option value="price_asc">Giá tăng dần</option>
                <option value="price_desc">Giá giảm dần</option>
              </select>

              {hasFilter && (
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="flex items-center gap-1 text-sm font-semibold text-[#DC2626] hover:underline"
                >
                  <span className="material-symbols-outlined text-[16px]">
                    close
                  </span>
                  Xóa lọc
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 text-sm text-[#64748B]">
              {refreshing && (
                <span className="material-symbols-outlined animate-spin text-[18px] text-[#2563EB]">
                  progress_activity
                </span>
              )}
              <span>
                Tìm thấy{" "}
                <strong className="text-[#0F172A]">
                  {total.toLocaleString("vi-VN")}
                </strong>{" "}
                sản phẩm
              </span>
            </div>
          </div>

          {query.search && (
            <div className="mb-4 flex items-center gap-2 text-sm text-[#64748B]">
              <span className="material-symbols-outlined text-[18px]">
                search
              </span>
              Từ khóa:
              <span className="rounded-md bg-[#EFF6FF] px-2 py-0.5 font-semibold text-[#2563EB]">
                {query.search}
              </span>
              <button
                type="button"
                onClick={handleClearSearch}
                className="text-[#DC2626] hover:underline"
              >
                bỏ
              </button>
            </div>
          )}

          {loading ? (
            <GridSkeleton />
          ) : products.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#E2E8F0] bg-white py-20 text-center">
              <span className="material-symbols-outlined mb-4 text-6xl text-gray-300">
                search_off
              </span>
              <p className="text-lg font-bold text-gray-700">
                Không tìm thấy sản phẩm nào phù hợp.
              </p>
              {hasFilter && (
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="mt-4 rounded-xl bg-[#2563EB] px-5 py-2 text-sm font-semibold text-white hover:bg-[#1D4ED8]"
                >
                  Xóa bộ lọc
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-5 md:grid-cols-4 lg:grid-cols-5">
                {products.map((sp) => (
                  <ProductCard key={sp.sp_ma} sp={sp} />
                ))}
              </div>

              {renderPagination()}
            </>
          )}
        </div>
      </main>

      {/* ===== Footer động (admin cấu hình) ===== */}
      <SiteFooter />

      <ToastNotification toast={toast} />
    </div>
  );
};

export default DanhSachSanPham;
