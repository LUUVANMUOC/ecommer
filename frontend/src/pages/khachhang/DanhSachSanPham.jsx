// src/pages/khachhang/DanhSachSanPham.jsx
import { useState, useEffect, useMemo, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import publicSanPhamService from "../../services/san/publicSanPhamService";
import gioHangService from "../../services/khachhang/gioHangService";
import { AuthContext } from "../../contexts/AuthContext";
import { formatPriceRange } from "../../components/shop/SanPhamShared";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8080";
const ITEMS_PER_PAGE = 20; // Bạn có thể đổi thành 20, 30, 50 tùy thích

const DanhSachSanPham = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cartCount, setCartCount] = useState(0);

  // State cho tìm kiếm & phân trang
  const [searchTerm, setSearchTerm] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1); // 🟢 Thêm state tổng số trang

  // 1. Reset trang về 1 khi đổi từ khóa hoặc bộ lọc
  useEffect(() => {
    setPage(1);
  }, [searchKeyword, selectedBrand, sortBy]);

  // 2. Gọi API khi page hoặc bộ lọc thay đổi
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await publicSanPhamService.getAll({
          page: page,
          limit: ITEMS_PER_PAGE,
          search: searchKeyword,
          brand: selectedBrand,
          sort: sortBy,
        });

        setProducts(res.data.data);

        // 🟢 Lấy tổng số trang từ Backend (Cần Backend trả về trường totalPages hoặc total)
        if (res.data.totalPages) {
          setTotalPages(res.data.totalPages);
        } else if (res.data.total) {
          setTotalPages(Math.ceil(res.data.total / ITEMS_PER_PAGE));
        } else {
          // Fallback nếu Backend chưa cập nhật (Chỉ hiện nút Next/Prev)
          setTotalPages(
            res.data.data.length === ITEMS_PER_PAGE ? page + 1 : page,
          );
        }
      } catch (error) {
        console.error("Lỗi tải dữ liệu:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [page, searchKeyword, selectedBrand, sortBy]);

  // Giỏ hàng & Auth
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

  const brands = useMemo(() => {
    const bMap = new Map();
    products.forEach((p) => {
      if (p.th_ma && p.th_ten) bMap.set(p.th_ma, p.th_ten);
    });
    return Array.from(bMap, ([id, name]) => ({ id, name }));
  }, [products]);

  const topBrands = useMemo(() => {
    const countMap = {};
    products.forEach((p) => {
      if (p.th_ma && p.th_ten) {
        if (!countMap[p.th_ma])
          countMap[p.th_ma] = {
            id: p.th_ma,
            name: p.th_ten,
            logo: p.th_hinhanh,
            count: 0,
          };
        countMap[p.th_ma].count++;
      }
    });
    return Object.values(countMap)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [products]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      setSearchKeyword(searchTerm);
    }
  };

  const handleSearchClick = () => {
    setSearchKeyword(searchTerm);
  };

  // 🟢 Hàm chuyển trang
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
      window.scrollTo({ top: 0, behavior: "smooth" }); // Cuộn lên đầu trang
    }
  };

  // 🟢 Tạo mảng các số trang hiển thị (VD: 1 ... 3 4 5 ... 10)
  const renderPagination = () => {
    if (totalPages <= 1) return null;

    let pages = [];
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }

    return (
      <div className="flex items-center justify-center gap-2 mt-10">
        <button
          onClick={() => handlePageChange(page - 1)}
          disabled={page === 1}
          className="px-4 py-2 border rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 bg-white"
        >
          Trước
        </button>

        {pages.map((p) => {
          // Chỉ hiển thị trang đầu, trang cuối, trang hiện tại và +-1 trang xung quanh
          if (p === 1 || p === totalPages || (p >= page - 1 && p <= page + 1)) {
            return (
              <button
                key={p}
                onClick={() => handlePageChange(p)}
                className={`w-10 h-10 rounded-xl border flex items-center justify-center font-semibold transition-colors ${
                  page === p
                    ? "bg-[#2563EB] text-white border-[#2563EB]"
                    : "bg-white text-[#334155] border-[#E2E8F0] hover:bg-gray-50"
                }`}
              >
                {p}
              </button>
            );
          } else if (p === page - 2 || p === page + 2) {
            return (
              <span key={p} className="text-gray-400">
                ...
              </span>
            );
          }
          return null;
        })}

        <button
          onClick={() => handlePageChange(page + 1)}
          disabled={page === totalPages}
          className="px-4 py-2 border rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 bg-white"
        >
          Sau
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-16 font-sans">
      <header className="bg-white shadow-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link
            to="/"
            className="text-2xl font-bold text-[#2563EB] flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-3xl">
              storefront
            </span>{" "}
            CT255 Shop
          </Link>

          <div className="flex-1 max-w-2xl mx-8 hidden md:block">
            <div className="relative">
              <button
                onClick={handleSearchClick}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#2563EB]"
              >
                <span className="material-symbols-outlined">
                  {loading && page === 1 ? "sync" : "search"}
                </span>
              </button>
              <input
                type="text"
                placeholder="Nhập tên sản phẩm... (Bấm Enter để tìm)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full pl-11 pr-4 py-2.5 rounded-full border border-[#E2E8F0] bg-[#F8FAFC] text-sm text-[#0F172A] outline-none focus:border-[#2563EB] focus:bg-white transition-all shadow-sm"
              />
            </div>
          </div>

          <div className="flex items-center gap-5 text-sm font-semibold">
            <Link
              to="/khach-hang/gio-hang"
              className="relative text-[#334155] hover:text-[#2563EB]"
            >
              <span className="material-symbols-outlined text-[24px]">
                shopping_cart
              </span>
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-[#DC2626] text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full border-2 border-white">
                  {cartCount}
                </span>
              )}
            </Link>
            {user ? (
              <div className="flex items-center gap-4">
                <Link
                  to="/khach-hang/thong-tin-ca-nhan"
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-[#F8FAFC]"
                >
                  <div className="w-8 h-8 rounded-full bg-[#2563EB] text-white flex items-center justify-center text-xs">
                    {user.kh_ten?.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-[#334155]">{user.kh_ten}</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-[#DC2626] hover:underline"
                >
                  Đăng xuất
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <Link
                  to="/khach-hang/login"
                  className="text-[#334155] hover:text-[#2563EB]"
                >
                  Đăng nhập
                </Link>
                <Link
                  to="/khach-hang/register"
                  className="bg-[#2563EB] text-white px-5 py-2 rounded-full hover:bg-[#1D4ED8]"
                >
                  Đăng ký
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* BỘ LỌC */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-[#E2E8F0] flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <span className="text-sm font-semibold text-[#64748B] flex items-center gap-1">
              <span className="material-symbols-outlined text-[18px]">
                filter_alt
              </span>{" "}
              Bộ lọc:
            </span>
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="px-4 py-2 border rounded-xl bg-[#F8FAFC]"
            >
              <option value="">Thương hiệu</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border rounded-xl bg-[#F8FAFC]"
            >
              <option value="newest">Mới nhất</option>
              <option value="popular">Bán chạy</option>
              <option value="price_asc">Giá tăng dần</option>
              <option value="price_desc">Giá giảm dần</option>
            </select>
          </div>
        </div>

        {/* HIỂN THỊ THƯƠNG HIỆU NỔI BẬT */}
        {topBrands.length > 0 && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#E2E8F0]">
            {/* Giữ nguyên khối Thương hiệu của bạn */}
          </div>
        )}

        {/* LƯỚI SẢN PHẨM */}
        {loading ? (
          <div className="text-center py-20 text-[#2563EB] font-medium flex flex-col items-center gap-3">
            <span className="animate-spin material-symbols-outlined text-4xl">
              sync
            </span>
            Đang tải sản phẩm...
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-[#E2E8F0]">
            <span className="material-symbols-outlined text-6xl text-gray-300 mb-4">
              search_off
            </span>
            <p className="text-lg font-bold text-gray-700">
              Không tìm thấy sản phẩm nào phù hợp.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-5">
              {products.map((sp) => (
                <Link
                  to={`/san-pham/${sp.sp_ma}?ctsp_ma=${sp.first_variant_id}`}
                  key={sp.sp_ma}
                  className="group bg-white rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-[#E2E8F0] overflow-hidden flex flex-col"
                >
                  <div className="aspect-square relative overflow-hidden bg-[#F8FAFC] flex items-center justify-center">
                    {sp.cover_image ? (
                      <img
                        src={`${BACKEND_URL}${sp.cover_image}`}
                        alt={sp.sp_ten}
                        className="w-full h-full object-contain p-3 group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      <span className="material-symbols-outlined text-6xl text-gray-300">
                        image
                      </span>
                    )}
                  </div>
                  <div className="p-4 flex-1 flex flex-col">
                    <h3 className="text-sm font-semibold text-[#0F172A] line-clamp-2 min-h-[40px] group-hover:text-[#2563EB] leading-snug">
                      {sp.sp_ten}
                    </h3>
                    <div className="mt-auto pt-3">
                      <p className="text-[#DC2626] font-bold text-lg">
                        {formatPriceRange({
                          minPrice: sp.min_price,
                          maxPrice: sp.max_price,
                        })}
                      </p>
                      <div className="flex items-center justify-between mt-2 text-xs text-[#64748B] font-medium">
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
              ))}
            </div>

            {/* 🟢 THANH PHÂN TRANG */}
            {renderPagination()}
          </>
        )}
      </div>
    </div>
  );
};

export default DanhSachSanPham;
