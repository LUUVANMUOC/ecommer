// src/pages/khachhang/ShopProfile.jsx
import {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
  useContext,
  memo,
} from "react";
import {
  useParams,
  Link,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import publicSanPhamService from "../../services/san/publicSanPhamService";
import thuongHieuService from "../../services/san/thuongHieuService";
import theoDoiShopService from "../../services/khachhang/theoDoiShopService";
import gioHangService from "../../services/khachhang/gioHangService";
import { AuthContext } from "../../contexts/AuthContext";
import { formatPriceRange } from "../../components/shop/SanPhamShared";
import ToastNotification from "../../components/common/Crud/ToastNotification";
import SiteHeader from "../../components/layout/SiteHeader";
import SiteFooter from "../../components/layout/SiteFooter";
import CustomerVoucherCard from "../../components/common/Voucher/CustomerVoucherCard";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8080";
const ITEMS_PER_PAGE = 20;
const SEARCH_DEBOUNCE = 350; // ms
const SORT_VALUES = ["newest", "popular", "price_asc", "price_desc"];

const imgUrl = (link) => (link ? `${BACKEND_URL}${link}` : "");

/* =====================================================================
 * CACHE CẤP MODULE
 * Key gồm cả gh_ma để không lẫn dữ liệu giữa các shop.
 * ===================================================================== */
const listCache = new Map();

const buildKey = (gh_ma, dmsp_ma, page, search, brand, sort) =>
  `${gh_ma}|${dmsp_ma || "ALL"}|${page}|${ITEMS_PER_PAGE}|${search}|${brand}|${sort}`;

const parseListResponse = (payload) => {
  const data = Array.isArray(payload?.data) ? payload.data : [];
  const total = Number(payload?.total ?? data.length);
  const totalPages = Math.max(1, Math.ceil(total / ITEMS_PER_PAGE));

  return { data, total, totalPages };
};

/* ---------- Thẻ sản phẩm ---------- */
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

const ShopProfile = () => {
  const { gh_ma } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useContext(AuthContext);
  const [searchParams, setSearchParams] = useSearchParams();

  /* ================= STATE ================= */
  const [shopInfo, setShopInfo] = useState(null);
  const [shopLoading, setShopLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [vouchers, setVouchers] = useState([]);

  /* Truy vấn: URL là nguồn sự thật.
   * dmsp (danh mục) / page / search / brand / sort nằm trên query string để
   * Back, Forward, F5 và chia sẻ link đều giữ đúng trạng thái danh sách.
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

  const activeTab = searchParams.get("dmsp") || "ALL";

  // Mọi thay đổi trong cùng trang shop đều dùng replace → history chỉ có
  // 1 entry, nên Back sẽ thoát về trang trước thay vì lùi từng bộ lọc.
  const writeQuery = useCallback(
    (patch) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          const page = patch.page ?? (Number(prev.get("page")) || 1);
          const search = (patch.search ?? prev.get("search") ?? "").trim();
          const brand = patch.brand ?? prev.get("brand") ?? "";
          const sort = patch.sort ?? prev.get("sort") ?? "newest";
          const dmsp = patch.dmsp ?? prev.get("dmsp") ?? "ALL";

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

          if (dmsp && dmsp !== "ALL") next.set("dmsp", dmsp);
          else next.delete("dmsp");

          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  // Ô tìm kiếm: giữ bản nháp khi đang gõ, nhưng bỏ ngay khi URL đổi
  // (Back/Forward, đổi bộ lọc, chuyển shop). Không cần effect đồng bộ.
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

  // Thương hiệu của shop (lazy-load lần đầu mở dropdown)
  const [brandList, setBrandList] = useState([]);
  const [brandLoading, setBrandLoading] = useState(false);
  const brandsRequested = useRef(false);

  const [isFollowing, setIsFollowing] = useState(false);
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
      3000,
    );
  }, []);

  const scrollToGrid = useCallback(() => {
    window.setTimeout(() => {
      gridRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 60);
  }, []);

  /* ================= THÔNG TIN SHOP + VOUCHER ================= */
  useEffect(() => {
    if (!gh_ma) return undefined;

    let alive = true;
    setShopLoading(true);

    Promise.all([
      publicSanPhamService.getShopProfile(gh_ma),
      publicSanPhamService.getShopVouchers(gh_ma),
    ])
      .then(([resShop, resVouchers]) => {
        if (!alive) return;
        setShopInfo(resShop.data?.info || null);
        setCategories(resShop.data?.categories || []);
        setVouchers(resVouchers.data || []);
      })
      .catch(() => {
        if (!alive) return;
        showToast("Lỗi tải thông tin Shop", "error");
      })
      .finally(() => {
        if (alive) setShopLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [gh_ma, showToast]);

  /* ================= THEO DÕI SHOP ================= */
  useEffect(() => {
    if (!user || user.role !== "khachhang" || !gh_ma) {
      setIsFollowing(false);
      return undefined;
    }

    let alive = true;

    theoDoiShopService
      .checkStatus(user.kh_ma, gh_ma)
      .then((res) => {
        if (alive) setIsFollowing(Boolean(res.data?.isFollowing));
      })
      .catch(() => {});

    return () => {
      alive = false;
    };
  }, [user, gh_ma]);

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

  /* ================= RESET KHI ĐỔI SHOP ================= */
  useEffect(() => {
    setProducts([]);
    setTotal(0);
    setTotalPages(1);
    setBrandList([]);
    brandsRequested.current = false;
  }, [gh_ma]);

  /* ================= TẢI SẢN PHẨM ================= */
  const cacheKey = buildKey(
    gh_ma,
    activeTab,
    query.page,
    query.search,
    query.brand,
    query.sort,
  );

  useEffect(() => {
    if (!gh_ma) return undefined;

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
      .getProductsByShop(gh_ma, {
        dmsp_ma: activeTab === "ALL" ? "" : activeTab,
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
        console.error("Lỗi tải sản phẩm của shop:", error);
        if (!cached) {
          setProducts([]);
          setTotal(0);
          setTotalPages(1);
          showToast("Lỗi tải danh sách sản phẩm", "error");
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
  }, [
    cacheKey,
    gh_ma,
    activeTab,
    query.page,
    query.search,
    query.brand,
    query.sort,
    showToast,
  ]);

  // URL có ?page vượt quá tổng số trang → đưa về trang cuối.
  useEffect(() => {
    if (loading || totalPages < 1 || query.page <= totalPages) return;
    writeQuery({ page: totalPages });
  }, [loading, totalPages, query.page, writeQuery]);

  /* ================= PREFETCH TRANG KẾ ================= */
  useEffect(() => {
    if (!gh_ma || query.page >= totalPages) return undefined;

    const nextKey = buildKey(
      gh_ma,
      activeTab,
      query.page + 1,
      query.search,
      query.brand,
      query.sort,
    );
    if (listCache.has(nextKey)) return undefined;

    const timer = window.setTimeout(() => {
      publicSanPhamService
        .getProductsByShop(gh_ma, {
          dmsp_ma: activeTab === "ALL" ? "" : activeTab,
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
  }, [
    gh_ma,
    activeTab,
    query.page,
    query.search,
    query.brand,
    query.sort,
    totalPages,
  ]);

  /* ================= DEBOUNCE Ô TÌM KIẾM ================= */
  useEffect(() => {
    const term = searchInput.trim();
    if (term === query.search) return undefined;

    const timer = window.setTimeout(() => {
      writeQuery({ search: term, page: 1 });
    }, SEARCH_DEBOUNCE);

    return () => window.clearTimeout(timer);
  }, [searchInput, query.search, writeQuery]);

  /* ================= THƯƠNG HIỆU CỦA SHOP (LAZY) ================= */
  const ensureBrands = () => {
    if (!gh_ma || brandsRequested.current) return;
    brandsRequested.current = true;
    setBrandLoading(true);

    thuongHieuService
      .getByShop(gh_ma)
      .then((res) => {
        setBrandList(Array.isArray(res.data) ? res.data : []);
      })
      .catch(() => {
        brandsRequested.current = false; // cho phép thử lại
      })
      .finally(() => setBrandLoading(false));
  };

  // Ưu tiên danh sách đầy đủ; nếu chưa tải thì suy ra từ sản phẩm đang có
  const brands = useMemo(() => {
    if (brandList.length > 0) {
      return brandList
        .filter((b) => b.th_ma && b.th_ten)
        .map((b) => ({ id: b.th_ma, name: b.th_ten }));
    }

    const map = new Map();
    products.forEach((p) => {
      if (p.th_ma && p.th_ten) map.set(p.th_ma, p.th_ten);
    });

    return Array.from(map, ([id, name]) => ({ id, name }));
  }, [brandList, products]);

  /* ================= HANDLERS ================= */
  const handleSubmitSearch = useCallback(() => {
    writeQuery({ search: searchInput.trim(), page: 1 });
    scrollToGrid();
  }, [searchInput, writeQuery, scrollToGrid]);

  const handleClearSearch = () => {
    setSearchDraft({ key: location.key, value: "" });
    writeQuery({ search: "", page: 1 });
  };

  const handleClearFilters = () => {
    setSearchDraft({ key: location.key, value: "" });
    writeQuery({ search: "", brand: "", sort: "newest", dmsp: "ALL", page: 1 });
    scrollToGrid();
  };

  const handleTabChange = (key) => {
    if (key === activeTab) return;
    writeQuery({ dmsp: key, page: 1 });
    scrollToGrid();
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages || newPage === query.page) return;
    writeQuery({ page: newPage });
    scrollToGrid();
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleFollow = async () => {
    if (!user || user.role !== "khachhang") {
      showToast("Vui lòng đăng nhập để theo dõi Shop!", "error");
      return navigate("/khach-hang/login");
    }

    try {
      const res = await theoDoiShopService.toggleFollow(user.kh_ma, gh_ma);
      setIsFollowing(res.data.isFollowing);
      showToast(
        res.data.isFollowing
          ? "Đã theo dõi Shop thành công!"
          : "Đã bỏ theo dõi Shop!",
        "success",
      );
      setShopInfo((prev) => ({
        ...prev,
        gh_theodoi: res.data.isFollowing
          ? (prev.gh_theodoi || 0) + 1
          : Math.max(0, (prev.gh_theodoi || 0) - 1),
      }));
    } catch (error) {
      showToast("Lỗi khi thực hiện thao tác!", "error");
    }
  };

  const handleCopyCode = (code) => {
    if (!code) return;
    navigator.clipboard?.writeText(code);
    showToast(`Đã sao chép mã [${code}]`, "success");
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
    Boolean(query.brand) ||
    Boolean(query.search) ||
    query.sort !== "newest" ||
    activeTab !== "ALL";

  /* ================= RENDER ================= */
  if (shopLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC]">
        Đang tải...
      </div>
    );
  }

  if (!shopInfo) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] font-sans">
        <SiteHeader
          showUtilities
          cartCount={cartCount}
          user={user}
          onLogout={handleLogout}
        />
        <div className="mx-auto max-w-3xl px-6 py-24 text-center">
          <span className="material-symbols-outlined mb-4 text-6xl text-gray-300">
            storefront
          </span>
          <p className="text-lg font-bold text-gray-700">
            Không tìm thấy gian hàng này.
          </p>
          <Link
            to="/san-pham"
            className="mt-6 inline-block rounded-xl bg-[#2563EB] px-5 py-2 text-sm font-semibold text-white hover:bg-[#1D4ED8]"
          >
            Về trang sản phẩm
          </Link>
        </div>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-16 font-sans">
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
        {/* ===== THÔNG TIN SHOP ===== */}
        <div className="relative overflow-hidden rounded-3xl border border-[#E2E8F0] bg-white p-6 shadow-sm md:p-8">
          <div className="pointer-events-none absolute -mr-16 -mt-16 right-0 top-0 h-64 w-64 rounded-full bg-blue-50 opacity-60 blur-3xl"></div>

          <div className="relative z-10 flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex flex-col items-center gap-6 text-center md:flex-row md:text-left">
              <div className="h-24 w-24 shrink-0 overflow-hidden rounded-full border-[5px] border-blue-50 bg-white shadow-sm md:h-28 md:w-28">
                <img
                  src={
                    shopInfo.gh_hinhanh
                      ? imgUrl(shopInfo.gh_hinhanh)
                      : "https://placehold.co/150x150"
                  }
                  alt={shopInfo.gh_ten}
                  className="h-full w-full object-cover"
                />
              </div>

              <div>
                <h1 className="flex items-center justify-center gap-1.5 text-2xl font-bold text-[#0F172A] md:justify-start">
                  {shopInfo.gh_ten}
                  <span
                    className="material-symbols-outlined text-[20px] text-[#2563EB]"
                    title="Shop uy tín"
                  >
                    verified
                  </span>
                </h1>

                <p className="mt-1 line-clamp-1 max-w-lg text-sm text-[#64748B]">
                  {shopInfo.gh_mota || "Chưa có mô tả"}
                </p>

                <div className="mt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm font-medium text-[#334155] md:justify-start">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="material-symbols-outlined text-[#F59E0B]"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      star
                    </span>
                    <span className="font-bold text-[#0F172A]">
                      {Number(shopInfo.gh_danhgia || 0).toFixed(1)}
                    </span>{" "}
                    Đánh giá
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[#2563EB]">
                      group
                    </span>
                    <span className="font-bold text-[#0F172A]">
                      {shopInfo.gh_theodoi || 0}
                    </span>{" "}
                    Người theo dõi
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 shrink-0 md:mt-0">
              <button
                onClick={handleFollow}
                className={`flex items-center gap-2 rounded-xl border px-8 py-3 text-sm font-bold transition-all ${
                  isFollowing
                    ? "border-[#E2E8F0] bg-gray-50 text-gray-600"
                    : "border-[#2563EB] bg-[#2563EB] text-white shadow-md hover:-translate-y-0.5 hover:bg-[#1D4ED8] hover:shadow-lg"
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">
                  {isFollowing ? "check" : "add"}
                </span>
                {isFollowing ? "Đang Theo Dõi" : "Theo Dõi Shop"}
              </button>
            </div>
          </div>
        </div>

        {/* ===== VOUCHER ===== */}
        {vouchers.length > 0 && (
          <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-[#DC2626]">
                local_activity
              </span>
              <h2 className="text-lg font-bold text-[#0F172A]">
                Mã Giảm Giá Của Shop
              </h2>
            </div>

            <div className="custom-scrollbar flex snap-x gap-4 overflow-x-auto pb-2">
              {vouchers.map((voucher, index) => (
                <div key={voucher.MGG_Shop_Ma || index} className="snap-start">
                  <CustomerVoucherCard
                    voucher={{
                      MGG_San_Ma: voucher.MGG_Shop_Ma,
                      MGG_San_PhanTramGiam: voucher.MGG_Shop_PhanTramGiam,
                      MGG_San_GiaTriDonToiThieu:
                        voucher.MGG_Shop_GiaTriDonToiThieu,
                      MGG_San_ThoiDiemKetThuc: voucher.MGG_Shop_ThoiDiemKetThuc,
                      MGG_San_SoLuongConLai: voucher.MGG_Shop_SoLuongConLai,
                      MGG_San_SoLuongBanDau: voucher.MGG_Shop_SoLuongBanDau,
                      MGG_San_ThoiDiemBatDau: voucher.MGG_Shop_ThoiDiemBatDau,
                    }}
                    onClick={() => handleCopyCode(voucher.MGG_Shop_Ma)}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===== TABS DANH MỤC ===== */}
        <div ref={gridRef} className="scroll-mt-24">
          <div className="custom-scrollbar flex overflow-x-auto rounded-t-2xl border border-b-0 border-[#E2E8F0] bg-white shadow-sm md:sticky md:top-[68px] md:z-10">
            <button
              onClick={() => handleTabChange("ALL")}
              className={`whitespace-nowrap border-b-2 px-6 py-4 text-sm font-bold transition-colors ${
                activeTab === "ALL"
                  ? "border-[#2563EB] bg-blue-50/50 text-[#2563EB]"
                  : "border-transparent text-[#64748B] hover:text-[#0F172A]"
              }`}
            >
              Tất cả sản phẩm
            </button>

            {categories.map((cat) => (
              <button
                key={cat.dmsp_ma}
                onClick={() => handleTabChange(cat.dmsp_ma)}
                className={`whitespace-nowrap border-b-2 px-6 py-4 text-sm font-bold transition-colors ${
                  activeTab === cat.dmsp_ma
                    ? "border-[#2563EB] bg-blue-50/50 text-[#2563EB]"
                    : "border-transparent text-[#64748B] hover:text-[#0F172A]"
                }`}
              >
                {cat.dmsp_ten}
              </button>
            ))}
          </div>

          {/* ===== LƯỚI SẢN PHẨM ===== */}
          <div className="min-h-[400px] rounded-b-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
            {/* Hàng lọc */}
            <div className="mb-6 flex flex-col gap-3 border-b border-[#E2E8F0] pb-4 md:flex-row md:items-center md:justify-between">
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

              {refreshing && (
                <span className="material-symbols-outlined animate-spin text-[18px] text-[#2563EB]">
                  progress_activity
                </span>
              )}
            </div>

            {loading ? (
              <GridSkeleton />
            ) : products.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#E2E8F0] py-20 text-center">
                <span className="material-symbols-outlined mb-4 text-6xl text-gray-300">
                  {hasFilter ? "search_off" : "inventory_2"}
                </span>
                <p className="text-lg font-bold text-gray-700">
                  {hasFilter
                    ? "Không tìm thấy sản phẩm nào phù hợp."
                    : "Shop chưa có sản phẩm nào trong mục này."}
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
        </div>
      </main>

      <SiteFooter />

      <ToastNotification toast={toast} />
    </div>
  );
};

export default ShopProfile;
