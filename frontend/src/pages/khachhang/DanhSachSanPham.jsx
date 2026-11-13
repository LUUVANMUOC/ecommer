// src/pages/khachhang/DanhSachSanPham.jsx
import { useState, useEffect, useMemo, useContext } from "react";
import { Link } from "react-router-dom";
import publicSanPhamService from "../../services/san/publicSanPhamService";
import thuongHieuService from "../../services/san/thuongHieuService";
import axiosClient from "../../config/axiosClient";
import gioHangService from "../../services/khachhang/gioHangService";
import { AuthContext } from "../../contexts/AuthContext";
import { formatPriceRange } from "../../components/shop/SanPhamShared";
import CustomerHeader from "../../components/common/CustomerHeader";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8080";
const ITEMS_PER_PAGE = 20;

const CATEGORY_VISUALS = {
  NH_001: { icon: "devices", bg: "bg-blue-50", text: "text-blue-600" },
  NH_004: { icon: "checkroom", bg: "bg-purple-50", text: "text-purple-600" },
  NH_012: { icon: "sports_soccer", bg: "bg-cyan-50", text: "text-cyan-600" },
  NH_013: { icon: "skillet", bg: "bg-orange-50", text: "text-orange-600" },
  NH_014: { icon: "face_retouching_natural", bg: "bg-pink-50", text: "text-pink-600" },
  NH_015: { icon: "menu_book", bg: "bg-indigo-50", text: "text-indigo-600" },
  NH_016: { icon: "edit_note", bg: "bg-emerald-50", text: "text-emerald-600" },
  NH_017: { icon: "bakery_dining", bg: "bg-amber-50", text: "text-amber-600" },
  NH_018: { icon: "local_cafe", bg: "bg-yellow-50", text: "text-yellow-700" },
  NH_019: { icon: "toys", bg: "bg-rose-50", text: "text-rose-600" },
};

const SORT_TABS = [
  { id: "newest", label: "Mới nhất" },
  { id: "popular", label: "Bán chạy" },
  { id: "price_asc", label: "Giá thấp → cao" },
  { id: "price_desc", label: "Giá cao → thấp" },
];

const formatSold = (count) => {
  const num = Number(count || 0);
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1).replace(".0", "")}k`;
  }
  return num;
};

const DanhSachSanPham = () => {
  const { user } = useContext(AuthContext);

  const [products, setProducts] = useState([]);
  const [allBrands, setAllBrands] = useState([]);
  const [categories, setCategories] = useState([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [loading, setLoading] = useState(true);
  const [cartCount, setCartCount] = useState(0);

  const [searchTerm, setSearchTerm] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await publicSanPhamService.getAll({
          page,
          limit: ITEMS_PER_PAGE,
          search: searchKeyword,
          brand: selectedBrand,
          category: selectedCategory,
          sort: sortBy,
        });

        setProducts(res.data.data || []);
        setTotalProducts(res.data.total || 0);

        if (res.data.totalPages) {
          setTotalPages(res.data.totalPages);
        } else if (res.data.total) {
          setTotalPages(Math.ceil(res.data.total / ITEMS_PER_PAGE));
        } else {
          setTotalPages(
            (res.data.data || []).length === ITEMS_PER_PAGE ? page + 1 : page,
          );
        }
      } catch (error) {
        console.error("Lỗi tải dữ liệu:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [page, searchKeyword, selectedBrand, selectedCategory, sortBy]);

  useEffect(() => {
    if (user && user.kh_ma) {
      gioHangService
        .getCartCount(user.kh_ma)
        .then((res) => setCartCount(res.data.total))
        .catch(() => {});
    }
  }, [user]);
  const visibleCartCount = user && user.kh_ma ? cartCount : 0;

  useEffect(() => {
    thuongHieuService
      .getAll()
      .then((res) => setAllBrands(Array.isArray(res.data) ? res.data : []))
      .catch(() => {});
    axiosClient
      .get("/nganh-hang")
      .then((res) => {
        const list = Array.isArray(res.data) ? res.data : [];
        setCategories(list.filter((c) => !c.nh_cha));
      })
      .catch(() => {});
  }, []);

  const brands = useMemo(() => {
    if (allBrands.length > 0) {
      return allBrands.map((b) => ({
        id: b.th_ma,
        name: b.th_ten,
        logo: b.th_hinhanh,
      }));
    }
    const bMap = new Map();
    products.forEach((p) => {
      if (p.th_ma && p.th_ten) bMap.set(p.th_ma, p.th_ten);
    });
    return Array.from(bMap, ([id, name]) => ({ id, name }));
  }, [allBrands, products]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      setPage(1);
      setSearchKeyword(searchTerm);
    }
  };

  const handleSearchClick = () => {
    setPage(1);
    setSearchKeyword(searchTerm);
  };

  const handleResetFilters = () => {
    setPage(1);
    setSelectedCategory("");
    setSelectedBrand("");
    setSearchTerm("");
    setSearchKeyword("");
    setSortBy("newest");
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }

    return (
      <div className="flex items-center justify-center gap-1.5 mt-10">
        <button
          type="button"
          onClick={() => handlePageChange(page - 1)}
          disabled={page === 1}
          className="px-3.5 py-2 text-sm font-medium border border-[#E2E8F0] rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white bg-white/80 text-[#334155]"
        >
          Trước
        </button>

        {pages.map((p) => {
          if (p === 1 || p === totalPages || (p >= page - 1 && p <= page + 1)) {
            return (
              <button
                key={p}
                type="button"
                onClick={() => handlePageChange(p)}
                className={`w-9 h-9 rounded-lg text-sm font-semibold transition-colors ${
                  page === p
                    ? "bg-[#EE4D2D] text-white shadow-sm"
                    : "bg-white text-[#334155] border border-[#E2E8F0] hover:border-[#EE4D2D] hover:text-[#EE4D2D]"
                }`}
              >
                {p}
              </button>
            );
          } else if (p === page - 2 || p === page + 2) {
            return (
              <span key={p} className="px-1 text-gray-400">
                ...
              </span>
            );
          }
          return null;
        })}

        <button
          type="button"
          onClick={() => handlePageChange(page + 1)}
          disabled={page === totalPages}
          className="px-3.5 py-2 text-sm font-medium border border-[#E2E8F0] rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white bg-white/80 text-[#334155]"
        >
          Sau
        </button>
      </div>
    );
  };

  const hasActiveFilters = Boolean(
    selectedCategory || selectedBrand || searchKeyword,
  );

  return (
    <div className="min-h-screen bg-[#F5F5F5] pb-16 font-sans">
      <CustomerHeader
        showSearch
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onSearchKeyDown={handleKeyDown}
        onSearchClick={handleSearchClick}
        isSearching={loading && page === 1}
        cartCount={visibleCartCount}
        className=""
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 space-y-5">
        {/* BANNER KHUYẾN MÃI NHẸ */}
        <div className="rounded-xl bg-gradient-to-r from-[#FF5722] via-[#EE4D2D] to-[#FF8A65] text-white p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="inline-block px-2.5 py-0.5 rounded-full bg-white/20 text-[11px] font-bold uppercase tracking-wider mb-1.5">
              Siêu hội mua sắm CT255
            </span>
            <h1 className="text-lg sm:text-xl font-bold leading-snug">
              Khám phá hơn {totalProducts || 500}+ sản phẩm chính hãng
            </h1>
            <p className="text-xs sm:text-sm text-white/90 mt-0.5">
              Đủ ngành hàng từ Sách truyện, Văn phòng phẩm, Nguyên liệu bếp đến Công nghệ &amp; Làm đẹp
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold shrink-0">
            <span className="px-3 py-1.5 rounded-lg bg-white/15 backdrop-blur-xs">
              Freeship toàn sàn
            </span>
            <span className="px-3 py-1.5 rounded-lg bg-white text-[#EE4D2D]">
              Mall Chính Hãng
            </span>
          </div>
        </div>

        {/* DANH MỤC NGÀNH HÀNG (GRID ICON KIỂU SHOPEE) */}
        {categories.length > 0 && (
          <section className="bg-white rounded-xl shadow-sm border border-[#EBEBEB] p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wide text-[#555555]">
                Danh mục ngành hàng
              </h2>
              {selectedCategory && (
                <button
                  type="button"
                  onClick={() => {
                    setPage(1);
                    setSelectedCategory("");
                  }}
                  className="text-xs font-semibold text-[#EE4D2D] hover:underline"
                >
                  Xem tất cả ngành hàng
                </button>
              )}
            </div>

            <div className="grid grid-cols-5 sm:grid-cols-5 lg:grid-cols-10 gap-2">
              {categories.map((c) => {
                const visual = CATEGORY_VISUALS[c.nh_ma] || {
                  icon: "category",
                  bg: "bg-slate-50",
                  text: "text-slate-600",
                };
                const isActive = selectedCategory === c.nh_ma;

                return (
                  <button
                    key={c.nh_ma}
                    type="button"
                    onClick={() => {
                      setPage(1);
                      setSelectedCategory(isActive ? "" : c.nh_ma);
                    }}
                    className={`group flex flex-col items-center text-center p-2 rounded-xl border transition-all ${
                      isActive
                        ? "border-[#EE4D2D] bg-[#FFF5F2] shadow-xs"
                        : "border-transparent hover:border-[#F1F5F9] hover:bg-[#FAFAFA]"
                    }`}
                  >
                    <div
                      className={`w-11 h-11 rounded-2xl ${visual.bg} ${visual.text} flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform ${
                        isActive ? "ring-2 ring-[#EE4D2D]/30" : ""
                      }`}
                    >
                      <span className="material-symbols-outlined text-[24px]">
                        {visual.icon}
                      </span>
                    </div>
                    <span
                      className={`text-[11px] sm:text-xs font-medium leading-tight line-clamp-2 ${
                        isActive ? "text-[#EE4D2D] font-bold" : "text-[#334155]"
                      }`}
                    >
                      {c.nh_ten}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* THANH SẮP XẾP & LỌC THƯƠNG HIỆU KIỂU SHOPEE */}
        <section className="bg-[#EDEDED]/80 rounded-xl px-4 py-3 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs sm:text-sm text-[#555555] mr-1">
              Sắp xếp theo
            </span>
            {SORT_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setPage(1);
                  setSortBy(tab.id);
                }}
                className={`px-3.5 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                  sortBy === tab.id
                    ? "bg-[#EE4D2D] text-white shadow-xs"
                    : "bg-white text-[#333333] hover:bg-gray-50"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <select
              value={selectedBrand}
              onChange={(e) => {
                setPage(1);
                setSelectedBrand(e.target.value);
              }}
              className="px-3 py-1.5 text-xs sm:text-sm border border-[#E2E8F0] rounded-md bg-white text-[#333333] focus:border-[#EE4D2D] outline-none"
            >
              <option value="">Thương hiệu: Tất cả</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-3 py-1.5 rounded-md bg-white border border-red-200 text-xs font-semibold text-[#EE4D2D] hover:bg-red-50 transition-colors"
              >
                Xóa bộ lọc
              </button>
            )}

            <span className="text-xs text-[#64748B] ml-auto lg:ml-1">
              {totalProducts} sản phẩm
            </span>
          </div>
        </section>

        {/* LƯỚI SẢN PHẨM */}
        {loading ? (
          <div className="text-center py-20 text-[#EE4D2D] font-medium flex flex-col items-center gap-3">
            <span className="animate-spin material-symbols-outlined text-4xl">
              sync
            </span>
            Đang tải sản phẩm...
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl border border-dashed border-[#E2E8F0]">
            <span className="material-symbols-outlined text-6xl text-gray-300 mb-3">
              search_off
            </span>
            <p className="text-base font-bold text-gray-700">
              Không tìm thấy sản phẩm nào phù hợp.
            </p>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="mt-4 px-5 py-2 rounded-lg bg-[#EE4D2D] text-white text-sm font-semibold hover:bg-[#d94224]"
              >
                Xem lại tất cả sản phẩm
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
              {products.map((sp) => (
                <Link
                  to={`/san-pham/${sp.sp_ma}?ctsp_ma=${sp.first_variant_id}`}
                  key={sp.sp_ma}
                  className="group bg-white rounded-lg border border-transparent hover:border-[#EE4D2D] shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden flex flex-col"
                >
                  <div className="aspect-square relative overflow-hidden bg-[#FAFAFA] flex items-center justify-center">
                    {sp.cover_image ? (
                      <img
                        src={`${BACKEND_URL}${sp.cover_image}`}
                        alt={sp.sp_ten}
                        className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <span className="material-symbols-outlined text-5xl text-gray-300">
                        image
                      </span>
                    )}

                    {/* Badge Yêu thích */}
                    <span className="absolute top-2 left-0 bg-[#EE4D2D] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-r">
                      Yêu thích
                    </span>

                    {/* Badge Freeship */}
                    <span className="absolute bottom-2 left-2 bg-[#00BFA5] text-white text-[10px] font-semibold px-1.5 py-0.5 rounded">
                      Freeship
                    </span>
                  </div>

                  <div className="p-2.5 sm:p-3 flex-1 flex flex-col">
                    <h3 className="text-xs sm:text-[13px] font-medium text-[#222222] line-clamp-2 min-h-[34px] leading-snug group-hover:text-[#EE4D2D]">
                      {sp.sp_ten}
                    </h3>

                    {sp.th_ten && (
                      <span className="mt-1 inline-block w-fit text-[10px] text-[#64748B] bg-[#F1F5F9] px-1.5 py-0.5 rounded">
                        {sp.th_ten}
                      </span>
                    )}

                    <div className="mt-auto pt-2.5">
                      <p className="text-[#EE4D2D] font-bold text-sm sm:text-base truncate">
                        {formatPriceRange({
                          minPrice: sp.min_price,
                          maxPrice: sp.max_price,
                        })}
                      </p>
                      <div className="flex items-center justify-between mt-1.5 text-[11px] text-[#757575]">
                        <span className="flex items-center gap-0.5">
                          <span
                            className="material-symbols-outlined text-[13px] text-[#FFCE3D]"
                            style={{ fontVariationSettings: "'FILL' 1" }}
                          >
                            star
                          </span>
                          {Number(sp.sp_diemdanhgiatrungbinh || 5).toFixed(1)}
                        </span>
                        <span>Đã bán {formatSold(sp.sp_luotmua)}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {renderPagination()}
          </>
        )}
      </div>
    </div>
  );
};

export default DanhSachSanPham;
