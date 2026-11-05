// src/pages/khachhang/ChiTietSanPham.jsx
import { useState, useEffect, useContext } from "react";
import {
  useParams,
  Link,
  useSearchParams,
  useNavigate,
} from "react-router-dom";
import publicSanPhamService from "../../services/san/publicSanPhamService";
import theoDoiShopService from "../../services/khachhang/theoDoiShopService";
import gioHangService from "../../services/khachhang/gioHangService";
import { AuthContext } from "../../contexts/AuthContext";
import ToastNotification from "../../components/common/Crud/ToastNotification";
import {
  Gallery,
  AttributeChips,
  formatVND,
} from "../../components/shop/SanPhamShared";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8080";

const ChiTietSanPhamKhachHang = () => {
  const { sp_ma } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeVariantId, setActiveVariantId] = useState(null);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);

  // 🟢 State số lượng
  const [quantity, setQuantity] = useState(1);

  // State cho Like
  const [isLiked, setIsLiked] = useState(false);
  const [liking, setLiking] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });
  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast((p) => ({ ...p, show: false })), 3000);
  };

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const res = await publicSanPhamService.getDetail(sp_ma);
        setProduct(res.data);
        const variantFromUrl = searchParams.get("ctsp_ma");
        if (res.data.variants.length > 0) {
          const isValid = res.data.variants.some(
            (v) => v.ctsp_ma === variantFromUrl,
          );
          if (variantFromUrl && isValid) setActiveVariantId(variantFromUrl);
          else {
            const firstVariantId = res.data.variants[0].ctsp_ma;
            setActiveVariantId(firstVariantId);
            setSearchParams({ ctsp_ma: firstVariantId }, { replace: true });
          }
        }
      } catch (error) {
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [sp_ma]);

  useEffect(() => {
    if (user && user.kh_ma) {
      gioHangService
        .getCartCount(user.kh_ma)
        .then((res) => setCartCount(res.data.total))
        .catch(() => {});
      if (product?.gh_ma)
        theoDoiShopService
          .checkStatus(user.kh_ma, product.gh_ma)
          .then((res) => setIsFollowing(res.data.isFollowing))
          .catch(() => {});
    }
  }, [user, product]);

  const activeVariant =
    product?.variants.find((v) => v.ctsp_ma === activeVariantId) ||
    product?.variants[0];

  // 🟢 Reset số lượng về 1 khi đổi phân loại
  useEffect(() => {
    setQuantity(1);
  }, [activeVariantId]);

  // 🟢 LOGIC ĐẾM 30 GIÂY ĐỂ TÍNH LƯỢT XEM
  useEffect(() => {
    if (!activeVariant?.ctsp_ma) return;

    const timer = setTimeout(() => {
      publicSanPhamService
        .recordView({
          ctsp_ma: activeVariant.ctsp_ma,
          kh_ma: user?.kh_ma || null,
        })
        .catch((err) => console.log("Lỗi lưu lượt xem:", err));
    }, 30000); // 30.000 ms = 30 giây

    return () => clearTimeout(timer);
  }, [activeVariant?.ctsp_ma, user?.kh_ma]);

  const handleSelectVariant = (variant) => {
    setActiveVariantId(variant.ctsp_ma);
    setActiveImageIdx(0);
    setSearchParams({ ctsp_ma: variant.ctsp_ma });
  };

  // 🟢 Hàm xử lý tăng/giảm số lượng
  const handleQuantityChange = (val) => {
    const newQty = quantity + val;
    const maxStock = activeVariant?.ctsp_soluongton || 0;
    if (newQty >= 1 && newQty <= maxStock) {
      setQuantity(newQty);
    }
  };

  // Xử lý Thả tim
  const handleToggleLike = async () => {
    if (!user || user.role !== "khachhang") {
      showToast("Vui lòng đăng nhập để thích sản phẩm!", "error");
      return navigate("/khach-hang/login");
    }
    if (!activeVariant || liking) return;

    setLiking(true);
    const previousLikedState = isLiked;
    setIsLiked(!isLiked); // Optimistic UI

    try {
      await publicSanPhamService.toggleLike(activeVariant.ctsp_ma, !isLiked);
      showToast(
        !isLiked ? "Đã thêm vào danh sách yêu thích!" : "Đã bỏ yêu thích!",
        "success",
      );
    } catch (error) {
      setIsLiked(previousLikedState);
      showToast("Có lỗi xảy ra, vui lòng thử lại!", "error");
    } finally {
      setLiking(false);
    }
  };

  const handleAddToCart = async (isBuyNow = false) => {
    if (!user || user.role !== "khachhang")
      return navigate("/khach-hang/login");
    if (activeVariant?.ctsp_soluongton <= 0)
      return showToast("Hết hàng", "error");

    // 🟢 XỬ LÝ KHI BẤM NÚT "MUA NGAY"
    if (isBuyNow) {
      // 1. Tạo object giả lập y hệt cấu trúc của một item trong Giỏ Hàng
      const buyNowItem = {
        gh_ma: product.gh_ma,
        gh_ten: product.gh_ten,
        sp_ma: product.sp_ma,
        sp_ten: product.sp_ten,
        ctsp_ma: activeVariant.ctsp_ma,
        ctsp_ten: activeVariant.ctsp_ten,
        image: activeVariant.images?.[0]?.hasp_link || "", // Lấy đường dẫn ảnh (không cần ghép Backend_URL)
        ctsp_gianban: activeVariant.ctsp_gianban,
        ctgh_soluong: quantity, // Số lượng bạn đã chọn bằng nút +/-
        ctsp_soluongton: activeVariant.ctsp_soluongton,
      };

      // 2. Tính tổng tiền (để đề phòng trang Thanh Toán có dùng)
      const totalPrice = Number(activeVariant.ctsp_gianban) * quantity;

      // 3. Chuyển thẳng sang trang Thanh Toán
      navigate("/khach-hang/thanh-toan", {
        state: {
          checkoutItems: [buyNowItem],
          totalPrice: totalPrice,
        },
      });
      return;
    }

    // 🟢 XỬ LÝ KHI BẤM NÚT "THÊM VÀO GIỎ"
    try {
      await gioHangService.addToCart({
        kh_ma: user.kh_ma,
        ctsp_ma: activeVariant.ctsp_ma,
        soluong: quantity,
      });
      showToast("Đã thêm vào giỏ hàng!");
      gioHangService
        .getCartCount(user.kh_ma)
        .then((res) => setCartCount(res.data.total));
    } catch (error) {
      showToast(error.response?.data?.message || "Lỗi!", "error");
    }
  };

  if (loading)
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center text-[#64748B] font-medium">
        Đang tải...
      </div>
    );
  if (!product)
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center text-[#DC2626] font-bold">
        Sản phẩm không tồn tại!
      </div>
    );

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-16 font-sans">
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
            <div className="w-px h-5 bg-[#E2E8F0]"></div>
            {user ? (
              <Link
                to="/khach-hang/thong-tin-ca-nhan"
                className="flex items-center gap-2 hover:text-[#2563EB] transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-[#2563EB] text-white flex items-center justify-center text-xs">
                  {user.kh_ten?.charAt(0).toUpperCase()}
                </div>
                {user.kh_ten}
              </Link>
            ) : (
              <Link to="/khach-hang/login">Đăng nhập</Link>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6">
        <div className="text-sm font-medium text-[#64748B] mb-6 flex gap-2 items-center">
          <Link to="/" className="hover:text-[#2563EB] transition-colors">
            Trang chủ
          </Link>{" "}
          <span className="text-[#CBD5E1]">/</span>
          <Link
            to="/san-pham"
            className="hover:text-[#2563EB] transition-colors"
          >
            Sản phẩm
          </Link>{" "}
          <span className="text-[#CBD5E1]">/</span>
          <span className="text-[#0F172A]">{product.sp_ten}</span>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-[#E2E8F0] p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-[450px_1fr] gap-10 mb-6">
          <div>
            <div className="aspect-square rounded-2xl overflow-hidden bg-[#F8FAFC] border border-[#E2E8F0] mb-4">
              <Gallery
                images={activeVariant?.images || []}
                index={activeImageIdx}
                onIndex={setActiveImageIdx}
              />
            </div>
          </div>

          <div className="flex flex-col">
            {/* TIÊU ĐỀ VÀ NÚT LIKE */}
            <div className="flex items-start gap-3 mb-3 justify-between">
              <div className="flex items-center gap-3">
                <span className="bg-[#2563EB] text-white text-xs px-2.5 py-1 rounded-md font-bold uppercase tracking-wider shadow-sm h-fit">
                  Chính hãng
                </span>
                <h1 className="text-2xl font-bold text-[#0F172A] leading-snug">
                  {product.sp_ten}
                </h1>
              </div>

              <button
                onClick={handleToggleLike}
                disabled={liking}
                className={`shrink-0 w-11 h-11 flex items-center justify-center rounded-full border transition-all duration-300 ${
                  isLiked
                    ? "bg-red-50 border-red-200 text-red-500 hover:bg-red-100"
                    : "bg-white border-[#E2E8F0] text-gray-400 hover:text-red-500 hover:border-red-200"
                } ${liking ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                title={isLiked ? "Bỏ yêu thích" : "Thêm vào yêu thích"}
              >
                <span
                  className={`material-symbols-outlined text-[24px] transition-transform duration-300 ${isLiked ? "scale-110 fill-current" : "scale-100"}`}
                  style={{
                    fontVariationSettings: isLiked ? "'FILL' 1" : "'FILL' 0",
                  }}
                >
                  favorite
                </span>
              </button>
            </div>

            <div className="flex items-center gap-6 text-sm font-medium text-[#64748B]">
              <span className="flex items-center gap-1 text-[#0F172A] bg-[#F1F5F9] px-2 py-0.5 rounded">
                <span className="material-symbols-outlined text-[16px] text-[#F59E0B]">
                  star
                </span>
                {product.sp_diemdanhgiatrungbinh || 0}
              </span>
              <div className="w-px h-4 bg-[#E2E8F0]"></div>
              <span>
                Đã bán {activeVariant?.ctsp_luotmua || product.sp_luotmua || 0}
              </span>
              <div className="w-px h-4 bg-[#E2E8F0]"></div>
              <span>Lượt xem {activeVariant?.ctsp_luotxem || 0}</span>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-white p-5 rounded-2xl mt-5 border border-blue-100 flex items-center">
              <span className="text-4xl font-extrabold text-[#DC2626]">
                {formatVND(activeVariant?.ctsp_gianban)}
              </span>
              <span className="ml-4 text-sm font-medium text-[#94A3B8] line-through">
                {(activeVariant?.ctsp_gianban * 1.2).toLocaleString("vi-VN")} đ
              </span>
            </div>

            <div className="mt-8 space-y-5">
              <div className="flex items-start">
                <span className="w-24 text-sm font-semibold text-[#64748B] pt-2">
                  Phân loại:
                </span>
                <div className="flex flex-wrap gap-3">
                  {product.variants.map((v) => (
                    <button
                      key={v.ctsp_ma}
                      onClick={() => handleSelectVariant(v)}
                      className={`px-5 py-2.5 text-sm font-semibold rounded-xl border-2 transition-all ${activeVariant?.ctsp_ma === v.ctsp_ma ? "border-[#2563EB] bg-blue-50 text-[#2563EB] shadow-sm relative" : "border-[#E2E8F0] text-[#334155] hover:border-[#2563EB]/60 bg-white"}`}
                    >
                      {activeVariant?.ctsp_ma === v.ctsp_ma && (
                        <span className="absolute -top-1.5 -right-1.5 material-symbols-outlined text-[#2563EB] text-[16px] bg-white rounded-full">
                          check_circle
                        </span>
                      )}
                      {v.ctsp_ten}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center">
                <span className="w-24 text-sm font-semibold text-[#64748B]">
                  Số lượng:
                </span>
                {/* 🟢 CẬP NHẬT NÚT TĂNG GIẢM */}
                <div className="flex items-center border border-[#E2E8F0] rounded-xl overflow-hidden bg-white">
                  <button
                    onClick={() => handleQuantityChange(-1)}
                    disabled={
                      quantity <= 1 || activeVariant?.ctsp_soluongton <= 0
                    }
                    className="px-4 py-2 hover:bg-[#F8FAFC] text-[#334155] transition-colors border-r border-[#E2E8F0] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    -
                  </button>
                  <input
                    type="text"
                    value={quantity}
                    className="w-14 text-center text-sm font-bold text-[#0F172A] outline-none"
                    readOnly
                  />
                  <button
                    onClick={() => handleQuantityChange(1)}
                    disabled={quantity >= (activeVariant?.ctsp_soluongton || 0)}
                    className="px-4 py-2 hover:bg-[#F8FAFC] text-[#334155] transition-colors border-l border-[#E2E8F0] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    +
                  </button>
                </div>
                <span className="ml-5 text-sm font-medium text-[#64748B]">
                  <b className="text-[#0F172A]">
                    {activeVariant?.ctsp_soluongton}
                  </b>{" "}
                  sản phẩm có sẵn
                </span>
              </div>
            </div>

            <div className="mt-10 flex gap-4">
              <button
                onClick={() => handleAddToCart(false)}
                className="flex items-center justify-center gap-2 px-8 py-3.5 border-2 border-[#2563EB] text-[#2563EB] bg-blue-50 hover:bg-blue-100 font-bold rounded-xl transition-colors flex-1"
              >
                <span className="material-symbols-outlined">
                  add_shopping_cart
                </span>{" "}
                Thêm Vào Giỏ
              </button>
              <button
                onClick={() => handleAddToCart(true)}
                className="px-12 py-3.5 bg-[#DC2626] text-white font-bold rounded-xl hover:bg-[#B91C1C] shadow-md transition-colors flex-1"
              >
                Mua Ngay
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-[#E2E8F0] p-5 flex items-center justify-between mb-6">
          {/* 🟢 ĐÃ BỌC LINK ĐỂ CHUYỂN SANG TRANG SHOP */}
          <Link
            to={`/shop/${product.gh_ma}`}
            className="flex items-center gap-4 cursor-pointer group"
          >
            <div className="w-14 h-14 rounded-full border-2 border-blue-100 overflow-hidden bg-[#F8FAFC] p-1 group-hover:border-[#2563EB] transition-colors">
              <img
                src={
                  product.gh_hinhanh
                    ? `${BACKEND_URL}${product.gh_hinhanh}`
                    : "https://placehold.co/100x100"
                }
                className="w-full h-full object-cover rounded-full"
              />
            </div>
            <div>
              <h3 className="font-bold text-[#0F172A] text-lg flex items-center gap-1 group-hover:text-[#2563EB] transition-colors">
                {product.gh_ten}{" "}
                <span className="material-symbols-outlined text-[16px] text-[#2563EB]">
                  verified
                </span>
              </h3>
              <p className="text-xs font-medium text-[#64748B] flex items-center gap-1 mt-0.5 group-hover:text-[#2563EB] transition-colors">
                Xem Shop{" "}
                <span className="material-symbols-outlined text-[14px]">
                  arrow_forward_ios
                </span>
              </p>
            </div>
          </Link>

          <div className="flex gap-2">
            <button
              onClick={async () => {
                if (!user) return navigate("/khach-hang/login");
                const res = await theoDoiShopService.toggleFollow(
                  user.kh_ma,
                  product.gh_ma,
                );
                setIsFollowing(res.data.isFollowing);
              }}
              className={`px-5 py-2 text-sm font-bold rounded-xl flex items-center gap-1 border transition-colors ${isFollowing ? "bg-gray-100 border-[#E2E8F0] text-gray-600" : "border-[#2563EB] text-[#2563EB] bg-blue-50 hover:bg-blue-100"}`}
            >
              <span className="material-symbols-outlined text-[18px]">
                {isFollowing ? "check" : "add"}
              </span>{" "}
              {isFollowing ? "Đang Theo Dõi" : "Theo Dõi Shop"}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-[#E2E8F0] p-6 lg:p-8">
          <h2 className="text-lg font-bold text-[#0F172A] bg-[#F8FAFC] p-3 rounded-xl mb-5 inline-block">
            Chi Tiết Sản Phẩm
          </h2>
          <p className="text-sm text-[#334155] whitespace-pre-line leading-relaxed">
            {product.sp_mota}
          </p>
          {activeVariant?.thuoctinh?.length > 0 && (
            <div className="mt-8 pt-6 border-t border-[#E2E8F0]">
              <h3 className="font-bold text-sm text-[#0F172A] mb-3">
                Thuộc tính phân loại:
              </h3>
              <AttributeChips attributes={activeVariant.thuoctinh} />
            </div>
          )}
        </div>
      </div>
      <ToastNotification toast={toast} />
    </div>
  );
};
export default ChiTietSanPhamKhachHang;
