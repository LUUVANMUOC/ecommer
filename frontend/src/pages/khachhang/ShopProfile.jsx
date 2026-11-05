// src/pages/khachhang/ShopProfile.jsx
import { useState, useEffect, useContext } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import publicSanPhamService from "../../services/san/publicSanPhamService";
import { AuthContext } from "../../contexts/AuthContext";
import { formatVND } from "../../components/shop/SanPhamShared";
import ToastNotification from "../../components/common/Crud/ToastNotification";
import { toAssetUrl } from "../../utils/accountUtils";
import CustomerVoucherCard from "../../components/common/Voucher/CustomerVoucherCard";
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8080";

const ShopProfile = () => {
  const { gh_ma } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [shopInfo, setShopInfo] = useState(null);
  const [categories, setCategories] = useState([]);
  const [vouchers, setVouchers] = useState([]); // 🟢 State lưu Voucher
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState("ALL"); // "ALL" hoặc dmsp_ma
  const [isFollowing, setIsFollowing] = useState(false); // Giả lập state theo dõi (nếu cần)
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });

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
          publicSanPhamService.getShopVouchers(gh_ma), // 🟢 Gọi API Public lấy voucher
        ]);
        setShopInfo(resShop.data.info);
        setCategories(resShop.data.categories || []);
        setVouchers(resVouchers.data || []); // 🟢 Lưu data voucher
      } catch (error) {
        showToast("Lỗi tải thông tin Shop", "error");
      }
    };
    fetchShopData();
  }, [gh_ma]);

  // Tải sản phẩm (Khi mới vào hoặc khi đổi Tab)
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const dmsp_ma = activeTab === "ALL" ? "" : activeTab;
        const res = await publicSanPhamService.getProductsByShop(
          gh_ma,
          dmsp_ma,
        );
        setProducts(res.data);
      } catch (error) {
        showToast("Lỗi tải danh sách sản phẩm", "error");
      } finally {
        setLoading(false);
      }
    };
    if (gh_ma) fetchProducts();
  }, [gh_ma, activeTab]);

  const handleFollow = () => {
    if (!user) return navigate("/khach-hang/login");
    // Gọi API toggle follow ở đây (nếu có). Hiện tại chỉ giả lập UI
    setIsFollowing(!isFollowing);
    showToast(
      isFollowing ? "Đã bỏ theo dõi Shop" : "Đã theo dõi Shop",
      "success",
    );
  };

  // 🟢 Hàm xử lý Copy mã Voucher
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
      {/* HEADER */}
      <header className="bg-white shadow-sm mb-6 sticky top-0 z-20">
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
          <div className="flex items-center gap-4">
            <Link
              to="/san-pham"
              className="text-sm font-semibold text-[#334155] hover:text-[#2563EB]"
            >
              Về trang sản phẩm
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6">
        {/* BANNER SHOP INFO */}
        <div className="bg-white rounded-3xl shadow-sm border border-[#E2E8F0] p-6 md:p-8 mb-6 relative overflow-hidden">
          {/* Hiệu ứng nền mờ (blob) tạo chiều sâu */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full blur-3xl opacity-60 -mr-16 -mt-16 pointer-events-none"></div>

          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Khối bên trái: Avatar + Info */}
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
                    <span className="material-symbols-outlined text-[#F59E0B]">
                      star
                    </span>
                    <span className="font-bold text-[#0F172A]">
                      {shopInfo?.gh_danhgia || 0}
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

            {/* Khối bên phải: Nút Theo dõi */}
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

        {/* 🟢 VỊ TRÍ 1A: KHỐI VOUCHER CỦA SHOP (Giao diện mới) */}
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
                  {/* 🟢 Dùng Component Mới với đầy đủ data */}
                  <CustomerVoucherCard
                    voucher={{
                      MGG_San_Ma: voucher.MGG_Shop_Ma,
                      MGG_San_PhanTramGiam: voucher.MGG_Shop_PhanTramGiam,
                      MGG_San_GiaTriDonToiThieu:
                        voucher.MGG_Shop_GiaTriDonToiThieu,
                      MGG_San_ThoiDiemKetThuc: voucher.MGG_Shop_ThoiDiemKetThuc,
                      MGG_San_SoLuongConLai: voucher.MGG_Shop_SoLuongConLai,
                      // 🟢 BẮT BUỘC THÊM 2 DÒNG NÀY ĐỂ TÍNH THANH TIẾN TRÌNH
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

        {/* THANH TABS DANH MỤC */}
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

        {/* LƯỚI SẢN PHẨM */}
        <div className="bg-white rounded-b-2xl shadow-sm border border-[#E2E8F0] p-6 min-h-[400px]">
          {loading ? (
            <div className="text-center py-20 text-[#64748B] font-medium">
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
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-5">
              {products.map((sp) => (
                <Link
                  to={`/san-pham/${sp.sp_ma}?ctsp_ma=${sp.first_variant_id}`}
                  key={sp.sp_ma}
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
      <ToastNotification toast={toast} />
    </div>
  );
};

export default ShopProfile;
