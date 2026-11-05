// src/pages/khachhang/DanhSachSanPham.jsx
import { useState, useEffect, useMemo, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import publicSanPhamService from "../../services/san/publicSanPhamService";
import gioHangService from "../../services/khachhang/gioHangService";
import { AuthContext } from "../../contexts/AuthContext";
import { formatVND } from "../../components/shop/SanPhamShared";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8080";
const imgUrl = (link) => (link ? `${BACKEND_URL}${link}` : "");

const DanhSachSanPham = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const [cartCount, setCartCount] = useState(0);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await publicSanPhamService.getAll();
        setProducts(res.data);
      } catch (error) {
        console.error("Lỗi tải danh sách sản phẩm:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

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

  // Lấy danh sách Thương hiệu cho bộ lọc
  const brands = useMemo(() => {
    const bMap = new Map();
    products.forEach((p) => {
      if (p.th_ma && p.th_ten) bMap.set(p.th_ma, p.th_ten);
    });
    return Array.from(bMap, ([id, name]) => ({ id, name }));
  }, [products]);

  // Tính Top 10 Thương hiệu nổi bật (có nhiều sản phẩm nhất)
  const topBrands = useMemo(() => {
    const countMap = {};
    products.forEach((p) => {
      if (p.th_ma && p.th_ten) {
        if (!countMap[p.th_ma]) {
          countMap[p.th_ma] = {
            id: p.th_ma,
            name: p.th_ten,
            logo: p.th_hinhanh,
            count: 0,
          };
        }
        countMap[p.th_ma].count++;
      }
    });
    // Sắp xếp giảm dần theo số lượng sản phẩm và lấy Top 10
    return Object.values(countMap)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [products]);

  const filteredProducts = useMemo(() => {
    let result = [...products];
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter((p) => p.sp_ten.toLowerCase().includes(term));
    }
    // 🟢 Đã xóa bộ lọc Danh mục ở đây
    if (selectedBrand) result = result.filter((p) => p.th_ma === selectedBrand);

    switch (sortBy) {
      case "price_asc":
        result.sort((a, b) => a.min_price - b.min_price);
        break;
      case "price_desc":
        result.sort((a, b) => b.max_price - a.max_price);
        break;
      case "popular":
        result.sort((a, b) => b.sp_luotmua - a.sp_luotmua);
        break;
      default:
        break;
    }
    return result;
  }, [products, searchTerm, selectedBrand, sortBy]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-16 font-sans">
      {/* HEADER */}
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
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                search
              </span>
              <input
                type="text"
                placeholder="Tìm kiếm sản phẩm..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 rounded-full border border-[#E2E8F0] bg-[#F8FAFC] text-sm text-[#0F172A] outline-none focus:border-[#2563EB] focus:bg-white transition-all shadow-sm"
              />
            </div>
          </div>

          <div className="flex items-center gap-5 text-sm font-semibold">
            <Link
              to="/khach-hang/gio-hang"
              className="relative text-[#334155] hover:text-[#2563EB] transition-colors"
            >
              <span className="material-symbols-outlined text-[24px]">
                shopping_cart
              </span>
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-[#DC2626] text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full border-2 border-white shadow-sm">
                  {cartCount}
                </span>
              )}
            </Link>

            {user ? (
              <div className="flex items-center gap-4">
                <Link
                  to="/khach-hang/thong-tin-ca-nhan"
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-[#F8FAFC] transition-colors border border-transparent hover:border-[#E2E8F0]"
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
                  className="bg-[#2563EB] text-white px-5 py-2 rounded-full hover:bg-[#1D4ED8] shadow-sm transition-colors"
                >
                  Đăng ký
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* 🟢 KHỐI THƯƠNG HIỆU NỔI BẬT */}
        {topBrands.length > 0 && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#E2E8F0]">
            <div className="flex items-center justify-center mb-6">
              <h2 className="text-xl font-bold text-[#0F172A] flex items-center gap-2">
                <span className="material-symbols-outlined text-[#F59E0B] text-2xl">
                  local_fire_department
                </span>
                Thương hiệu nổi bật
              </h2>
            </div>

            {/* Thanh cuộn ngang (Ẩn thanh cuộn) - Canh giữa */}
            <div
              className="w-full overflow-x-auto pb-4 scrollbar-hide"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              <div className="flex gap-8 w-max mx-auto px-2">
                {topBrands.map((brand) => (
                  <div
                    key={brand.id}
                    onClick={() =>
                      setSelectedBrand(
                        brand.id === selectedBrand ? "" : brand.id,
                      )
                    }
                    className="flex flex-col items-center gap-3 cursor-pointer min-w-[100px] group"
                  >
                    {/* Lớp ngoài: Viền mỏng, không scale để tránh bị cắt */}
                    <div
                      className={`w-24 h-24 rounded-full border flex items-center justify-center bg-white transition-all duration-300 ${
                        selectedBrand === brand.id
                          ? "border-2 border-[#2563EB] shadow-md"
                          : "border-gray-200 shadow-sm group-hover:border-[#2563EB] group-hover:shadow-md group-hover:-translate-y-1"
                      }`}
                    >
                      {/* Lớp trong: Cắt ảnh cho tròn */}
                      <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center bg-white p-3">
                        {brand.logo ? (
                          <img
                            src={imgUrl(brand.logo)}
                            alt={brand.name}
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <span
                            className={`material-symbols-outlined text-4xl ${
                              selectedBrand === brand.id
                                ? "text-[#2563EB]"
                                : "text-gray-400"
                            }`}
                          >
                            storefront
                          </span>
                        )}
                      </div>
                    </div>
                    <span
                      className={`text-sm font-bold text-center line-clamp-1 w-full transition-colors ${
                        selectedBrand === brand.id
                          ? "text-[#2563EB]"
                          : "text-[#334155] group-hover:text-[#2563EB]"
                      }`}
                    >
                      {brand.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* BỘ LỌC */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-[#E2E8F0] flex flex-wrap gap-4 items-center justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-semibold text-[#64748B] flex items-center gap-1">
              <span className="material-symbols-outlined text-[18px]">
                filter_alt
              </span>{" "}
              Bộ lọc:
            </span>
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="px-4 py-2 border border-[#E2E8F0] rounded-xl text-sm font-medium text-[#334155] outline-none bg-[#F8FAFC] hover:border-[#2563EB] transition-colors cursor-pointer min-w-[150px]"
            >
              <option value="">Thương hiệu</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
            {/* 🟢 ĐÃ XÓA DROPDOWN DANH MỤC Ở ĐÂY */}
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="font-semibold text-[#64748B]">Sắp xếp:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border border-[#E2E8F0] rounded-xl text-sm font-medium text-[#334155] outline-none bg-[#F8FAFC] hover:border-[#2563EB] transition-colors cursor-pointer"
            >
              <option value="newest">Mới nhất</option>
              <option value="popular">Bán chạy</option>
              <option value="price_asc">Giá tăng dần</option>
              <option value="price_desc">Giá giảm dần</option>
            </select>
          </div>
        </div>

        {/* LƯỚI SẢN PHẨM */}
        {loading ? (
          <div className="text-center py-20 text-[#64748B] font-medium">
            Đang tải sản phẩm...
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-[#E2E8F0]">
            <span className="material-symbols-outlined text-6xl text-gray-300 mb-4">
              search_off
            </span>
            <p className="text-lg font-bold text-gray-700">
              Không tìm thấy sản phẩm nào phù hợp.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-5">
            {filteredProducts.map((sp) => (
              <Link
                to={`/san-pham/${sp.sp_ma}?ctsp_ma=${sp.first_variant_id}`}
                key={sp.sp_ma}
                className="group bg-white rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-[#E2E8F0] overflow-hidden flex flex-col"
              >
                <div className="aspect-square relative overflow-hidden bg-[#F8FAFC]">
                  <img
                    src={
                      sp.cover_image ? `${BACKEND_URL}${sp.cover_image}` : ""
                    }
                    alt={sp.sp_ten}
                    className="w-full h-full object-contain p-3 group-hover:scale-110 transition-transform duration-500"
                  />
                </div>
                <div className="p-4 flex-1 flex flex-col">
                  <h3 className="text-sm font-semibold text-[#0F172A] line-clamp-2 min-h-[40px] group-hover:text-[#2563EB] transition-colors leading-snug">
                    {sp.sp_ten}
                  </h3>
                  <div className="mt-auto pt-3">
                    <p className="text-[#DC2626] font-bold text-lg">
                      {sp.min_price === sp.max_price
                        ? formatVND(sp.min_price)
                        : `${formatVND(sp.min_price)}...`}
                    </p>
                    <div className="flex items-center justify-between mt-2 text-xs text-[#64748B] font-medium">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px] text-[#F59E0B]">
                          star
                        </span>
                        {sp.sp_diemdanhgiatrungbinh || 0}
                      </span>
                      <span>Đã bán {sp.sp_luotmua || 0}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DanhSachSanPham;
