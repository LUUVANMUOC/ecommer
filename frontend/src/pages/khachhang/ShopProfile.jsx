// src/pages/khachhang/ShopProfile.jsx
import { useState, useEffect, useContext, useRef, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import publicSanPhamService from "../../services/san/publicSanPhamService";
import theoDoiShopService from "../../services/khachhang/theoDoiShopService";
import { AuthContext } from "../../contexts/AuthContext";
import {
  formatVND,
  formatPriceRange,
} from "../../components/shop/SanPhamShared";
import ToastNotification from "../../components/common/Crud/ToastNotification";
import { toAssetUrl } from "../../utils/accountUtils";
import CustomerVoucherCard from "../../components/common/Voucher/CustomerVoucherCard";
import CustomerHeader from "../../components/common/CustomerHeader";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8080";
const ITEMS_PER_PAGE = 20; // Số sản phẩm tải mỗi lần

const ShopProfile = () => {
  const { gh_ma } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [shopInfo, setShopInfo] = useState(null);
  const [categories, setCategories] = useState([]);
  const [vouchers, setVouchers] = useState([]);

  // 🟢 State cho Sản phẩm & Phân trang (Lazy Load)
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const [activeTab, setActiveTab] = useState("ALL");
  const [isFollowing, setIsFollowing] = useState(false);

  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });

  const observer = useRef(); // 🟢 Ref cho Lazy Load

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast((p) => ({ ...p, show: false })), 3000);
  };

  // Tải thông tin shop, danh mục & voucher ban đầu
  useEffect(() => {
    const fetchShopData = async () => {
      try {
        const [resShop, resVouchers] = await Promise.all([
          publicSanPhamService.getShopProfile(gh_ma),
          publicSanPhamService.getShopVouchers(gh_ma),
        ]);
        setShopInfo(resShop.data.info);
        setCategories(resShop.data.categories || []);
        setVouchers(resVouchers.data || []);
      } catch (error) {
        showToast("Lỗi tải thông tin Shop", "error");
      }
    };
    fetchShopData();
  }, [gh_ma]);

  // 🟢 Kiểm tra trạng thái theo dõi (nếu đã đăng nhập)
  useEffect(() => {
    if (user && user.role === "khachhang" && gh_ma) {
      theoDoiShopService
        .checkStatus(user.kh_ma, gh_ma)
        .then((res) => setIsFollowing(res.data.isFollowing))
        .catch(() => {});
    }
  }, [user, gh_ma]);

  // 🟢 Reset trang khi đổi Tab hoặc đổi Shop
  useEffect(() => {
    setPage(1);
    setProducts([]);
    setHasMore(true);
  }, [gh_ma, activeTab]);

  // 🟢 Tải sản phẩm (Khi mới vào, khi đổi Tab, hoặc khi page tăng do cuộn)
  useEffect(() => {
    const fetchProducts = async () => {
      if (page === 1) setLoading(true);
      else setLoadingMore(true);

      try {
        const dmsp_ma = activeTab === "ALL" ? "" : activeTab;
        // Cần truyền thêm page và ITEMS_PER_PAGE
        const res = await publicSanPhamService.getProductsByShop(
          gh_ma,
          dmsp_ma,
          page,
          ITEMS_PER_PAGE,
        );

        // Xử lý dữ liệu trả về (tùy thuộc Backend trả mảng hay object)
        const newProducts = res.data.data ? res.data.data : res.data;

        if (page === 1) setProducts(newProducts);
        else setProducts((prev) => [...prev, ...newProducts]);

        // Nếu số lượng trả về ít hơn ITEMS_PER_PAGE => Đã hết sản phẩm
        setHasMore(newProducts.length === ITEMS_PER_PAGE);
      } catch (error) {
        showToast("Lỗi tải danh sách sản phẩm", "error");
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    };
    if (gh_ma) fetchProducts();
  }, [gh_ma, activeTab, page]);

  // 🟢 Logic Lazy Load
  const lastProductRef = useCallback(
    (node) => {
      if (loading || loadingMore || !hasMore) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
          setPage((prevPage) => prevPage + 1);
        }
      });
      if (node) observer.current.observe(node);
    },
    [loading, loadingMore, hasMore],
  );

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

  if (!shopInfo && loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        Đang tải...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-16 font-sans">
      <CustomerHeader pageLabel={shopInfo?.gh_ten || "Hồ Sơ Cửa Hàng"} />

      <div className="max-w-7xl mx-auto px-6">
        {/* ... (Phần Header Shop Info & Voucher giữ nguyên) ... */}
        <div className="bg-white rounded-3xl shadow-sm border border-[#E2E8F0] p-6 md:p-8 mb-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full blur-3xl opacity-60 -mr-16 -mt-16 pointer-events-none"></div>
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
              <div className="w-24 h-24 md:w-28 md:h-28 rounded-full border-[5px] border-blue-50 shadow-sm overflow-hidden bg-white shrink-0">
                <img
                  src={
                    shopInfo?.gh_hinhanh
                      ? `${BACKEND_URL}${shopInfo.gh_hinhanh}`
                      : "https://placehold.co/150x150"
                  }
                  alt={shopInfo?.gh_ten}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[#0F172A] flex items-center justify-center md:justify-start gap-1.5">
                  {shopInfo?.gh_ten}
                  <span
                    className="material-symbols-outlined text-[20px] text-[#2563EB]"
                    title="Shop uy tín"
                  >
                    verified
                  </span>
                </h1>
                <p className="text-sm text-[#64748B] mt-1 line-clamp-1 max-w-lg">
                  {shopInfo?.gh_mota || "Chưa có mô tả"}
                </p>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-6 gap-y-2 mt-4 text-sm font-medium text-[#334155]">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="material-symbols-outlined text-[#F59E0B]"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      star
                    </span>
                    <span className="font-bold text-[#0F172A]">
                      {Number(shopInfo?.gh_danhgia || 0).toFixed(1)}
                    </span>{" "}
                    Đánh giá
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[#2563EB]">
                      group
                    </span>
                    <span className="font-bold text-[#0F172A]">
                      {shopInfo?.gh_theodoi || 0}
                    </span>{" "}
                    Người theo dõi
                  </div>
                </div>
              </div>
            </div>
            <div className="shrink-0 mt-4 md:mt-0">
              <button
                onClick={handleFollow}
                className={`px-8 py-3 rounded-xl font-bold text-sm flex items-center gap-2 border transition-all ${
                  isFollowing
                    ? "bg-gray-50 border-[#E2E8F0] text-gray-600"
                    : "bg-[#2563EB] border-[#2563EB] text-white hover:bg-[#1D4ED8] shadow-md hover:shadow-lg hover:-translate-y-0.5"
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

        {vouchers.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-[#E2E8F0] p-5 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-[#DC2626]">
                local_activity
              </span>
              <h2 className="text-lg font-bold text-[#0F172A]">
                Mã Giảm Giá Của Shop
              </h2>
            </div>
            <div className="flex overflow-x-auto gap-4 pb-2 custom-scrollbar snap-x">
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

        {/* TABS DANH MỤC */}
        <div className="bg-white rounded-t-2xl shadow-sm border border-[#E2E8F0] border-b-0 overflow-x-auto flex sticky top-[72px] z-10 custom-scrollbar">
          <button
            onClick={() => setActiveTab("ALL")}
            className={`px-6 py-4 text-sm font-bold whitespace-nowrap border-b-2 transition-colors ${activeTab === "ALL" ? "border-[#2563EB] text-[#2563EB] bg-blue-50/50" : "border-transparent text-[#64748B] hover:text-[#0F172A]"}`}
          >
            Tất cả sản phẩm
          </button>
          {categories.map((cat) => (
            <button
              key={cat.dmsp_ma}
              onClick={() => setActiveTab(cat.dmsp_ma)}
              className={`px-6 py-4 text-sm font-bold whitespace-nowrap border-b-2 transition-colors ${activeTab === cat.dmsp_ma ? "border-[#2563EB] text-[#2563EB] bg-blue-50/50" : "border-transparent text-[#64748B] hover:text-[#0F172A]"}`}
            >
              {cat.dmsp_ten}
            </button>
          ))}
        </div>

        {/* DANH SÁCH SẢN PHẨM (LAZY LOAD) */}
        <div className="bg-white rounded-b-2xl shadow-sm border border-[#E2E8F0] p-6 min-h-[400px]">
          {loading && page === 1 ? (
            <div className="text-center py-20 text-[#2563EB] font-medium flex flex-col items-center gap-3">
              <span className="animate-spin material-symbols-outlined text-4xl">
                sync
              </span>
              Đang tải sản phẩm...
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20">
              <span className="material-symbols-outlined text-6xl text-gray-300 mb-4">
                inventory_2
              </span>
              <p className="text-lg font-bold text-gray-700">
                Shop chưa có sản phẩm nào trong mục này.
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-5">
                {products.map((sp, index) => {
                  const isLast = index === products.length - 1;
                  return (
                    <Link
                      ref={isLast ? lastProductRef : null} // 🟢 Gắn ref cho phần tử cuối
                      to={`/san-pham/${sp.sp_ma}?ctsp_ma=${sp.first_variant_id}`}
                      key={`${sp.sp_ma}-${index}`}
                      className="group bg-white rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-[#E2E8F0] overflow-hidden flex flex-col"
                    >
                      <div className="aspect-square relative overflow-hidden bg-[#F8FAFC]">
                        <img
                          src={
                            sp.cover_image
                              ? `${BACKEND_URL}${sp.cover_image}`
                              : "https://placehold.co/300x300"
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
                              {Number(sp.sp_diemdanhgiatrungbinh || 0).toFixed(
                                1,
                              )}
                            </span>
                            <span>Đã bán {sp.sp_luotmua || 0}</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>

              {/* 🟢 Hiệu ứng Loading khi tải thêm */}
              {loadingMore && (
                <div className="text-center py-6 text-[#2563EB] font-medium flex items-center justify-center gap-2">
                  <span className="animate-spin material-symbols-outlined">
                    sync
                  </span>{" "}
                  Đang tải thêm...
                </div>
              )}

              {/* 🟢 Thông báo hết sản phẩm */}
              {!hasMore && products.length > 0 && (
                <div className="text-center py-6 text-gray-400 text-sm">
                  --- Đã hiển thị tất cả sản phẩm ---
                </div>
              )}
            </>
          )}
        </div>
      </div>
      <ToastNotification toast={toast} />
    </div>
  );
};

export default ShopProfile;
