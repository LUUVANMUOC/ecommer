// src/pages/khachhang/GioHang.jsx
import { useState, useEffect, useContext, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../../contexts/AuthContext";
import gioHangService from "../../services/khachhang/gioHangService";
import { formatVND } from "../../components/shop/SanPhamShared";
import ToastNotification from "../../components/common/Crud/ToastNotification";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8080";

const GioHang = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState([]);
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast((p) => ({ ...p, show: false })), 3000);
  };

  const fetchCart = async () => {
    if (!user?.kh_ma) return;
    try {
      const res = await gioHangService.getCart(user.kh_ma);
      setCartItems(res.data);
      setSelectedItems(res.data.map((item) => item.ctsp_ma));
    } catch (error) {
      showToast("Lỗi tải giỏ hàng", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) navigate("/khach-hang/login");
    else fetchCart();
  }, [user]);

  const groupedCart = useMemo(() => {
    return cartItems.reduce((acc, item) => {
      if (!acc[item.gh_ma])
        acc[item.gh_ma] = { gh_ma: item.gh_ma, gh_ten: item.gh_ten, items: [] };
      acc[item.gh_ma].items.push(item);
      return acc;
    }, {});
  }, [cartItems]);

  const handleSelectItem = (id) =>
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

  const handleSelectShop = (shopItems) => {
    const ids = shopItems.map((i) => i.ctsp_ma);
    const isAll = ids.every((id) => selectedItems.includes(id));
    if (isAll)
      setSelectedItems((prev) => prev.filter((id) => !ids.includes(id)));
    else setSelectedItems((prev) => [...new Set([...prev, ...ids])]);
  };

  const handleSelectAll = (e) =>
    setSelectedItems(e.target.checked ? cartItems.map((i) => i.ctsp_ma) : []);

  const handleUpdateQty = async (id, newQty, max) => {
    if (newQty < 1 || newQty > max) return;
    await gioHangService.updateQuantity({
      kh_ma: user.kh_ma,
      ctsp_ma: id,
      soluong: newQty,
    });
    setCartItems((prev) =>
      prev.map((i) => (i.ctsp_ma === id ? { ...i, ctgh_soluong: newQty } : i)),
    );
  };

  const handleRemove = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa sản phẩm này khỏi giỏ hàng?"))
      return;
    await gioHangService.removeItem(user.kh_ma, id);
    setCartItems((prev) => prev.filter((i) => i.ctsp_ma !== id));
    setSelectedItems((prev) => prev.filter((x) => x !== id));
  };

  // ✅ Hàm xóa các mục đã chọn
  const handleRemoveSelected = async () => {
    if (selectedItems.length === 0)
      return showToast("Vui lòng chọn sản phẩm để xóa!", "error");
    if (
      !window.confirm(
        `Bạn có chắc muốn xóa ${selectedItems.length} sản phẩm đã chọn?`,
      )
    )
      return;

    try {
      // Dùng Promise.all để xóa các sản phẩm song song
      await Promise.all(
        selectedItems.map((id) => gioHangService.removeItem(user.kh_ma, id)),
      );
      setCartItems((prev) =>
        prev.filter((i) => !selectedItems.includes(i.ctsp_ma)),
      );
      setSelectedItems([]);
      showToast("Đã xóa các sản phẩm được chọn!");
    } catch (error) {
      showToast("Lỗi khi xóa sản phẩm!", "error");
    }
  };

  const totalPrice = cartItems.reduce(
    (sum, item) =>
      selectedItems.includes(item.ctsp_ma)
        ? sum + Number(item.ctsp_gianban) * item.ctgh_soluong
        : sum,
    0,
  );

  // ✅ Cập nhật hàm chuyển sang trang Thanh Toán
  const handleCheckout = () => {
    if (selectedItems.length === 0)
      return showToast("Vui lòng chọn sản phẩm!", "error");

    // Lấy các sản phẩm được chọn
    const itemsToCheckout = cartItems.filter((item) =>
      selectedItems.includes(item.ctsp_ma),
    );

    // Chuyển hướng và truyền dữ liệu qua state
    navigate("/khach-hang/thanh-toan", {
      state: {
        checkoutItems: itemsToCheckout,
        totalPrice: totalPrice,
      },
    });
  };

  if (loading)
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center text-[#64748B] font-medium">
        Đang tải...
      </div>
    );

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24 font-sans">
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
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#2563EB] text-white flex items-center justify-center text-xs font-bold">
              {user?.kh_ten?.charAt(0).toUpperCase()}
            </div>
            <span className="text-sm font-semibold text-[#0F172A]">
              {user?.kh_ten}
            </span>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6">
        <h1 className="text-2xl font-bold text-[#0F172A] mb-6 flex items-center gap-2">
          <span className="material-symbols-outlined text-[#2563EB]">
            shopping_bag
          </span>{" "}
          Giỏ Hàng Của Bạn
        </h1>

        <div className="bg-white rounded-2xl shadow-sm border border-[#E2E8F0] p-4 mb-4 hidden md:grid grid-cols-[auto_3fr_1.5fr_2fr_1.5fr_auto] gap-4 items-center text-sm font-semibold text-[#64748B]">
          <input
            type="checkbox"
            checked={
              cartItems.length > 0 && selectedItems.length === cartItems.length
            }
            onChange={handleSelectAll}
            className="w-5 h-5 accent-[#2563EB] rounded border-gray-300 cursor-pointer"
          />
          <span>Sản Phẩm</span>
          <span className="text-center">Đơn Giá</span>
          <span className="text-center">Số Lượng</span>
          <span className="text-center">Số Tiền</span>
          <span className="text-right">Thao Tác</span>
        </div>

        {Object.values(groupedCart).map((shop) => {
          const shopIds = shop.items.map((i) => i.ctsp_ma);
          const isShopAll = shopIds.every((id) => selectedItems.includes(id));

          return (
            <div
              key={shop.gh_ma}
              className="bg-white rounded-2xl shadow-sm border border-[#E2E8F0] mb-4 overflow-hidden"
            >
              <div className="p-4 border-b border-[#F1F5F9] bg-[#F8FAFC] flex items-center gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={isShopAll}
                  onChange={() => handleSelectShop(shop.items)}
                  className="w-5 h-5 accent-[#2563EB] rounded border-gray-300 cursor-pointer"
                />
                <span className="font-bold text-[#0F172A] flex items-center gap-1">
                  <span className="material-symbols-outlined text-[18px] text-[#2563EB]">
                    storefront
                  </span>{" "}
                  {/* 🟢 ĐÃ CẬP NHẬT: Bọc Link để chuyển sang trang Shop Profile */}
                  <Link
                    to={`/shop/${shop.gh_ma}`}
                    className="hover:text-[#2563EB] hover:underline transition-colors cursor-pointer"
                  >
                    {shop.gh_ten}
                  </Link>
                </span>
              </div>

              {shop.items.map((item) => (
                <div
                  key={item.ctsp_ma}
                  className="grid grid-cols-1 md:grid-cols-[auto_3fr_1.5fr_2fr_1.5fr_auto] gap-4 p-4 items-center border-b border-[#F1F5F9] last:border-0 hover:bg-[#F8FAFC] transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedItems.includes(item.ctsp_ma)}
                    onChange={() => handleSelectItem(item.ctsp_ma)}
                    className="w-5 h-5 accent-[#2563EB] rounded border-gray-300 cursor-pointer hidden md:block"
                  />

                  <div className="flex gap-4">
                    <div className="w-20 h-20 border border-[#E2E8F0] rounded-xl overflow-hidden shrink-0 bg-[#F8FAFC]">
                      <img
                        src={`${BACKEND_URL}${item.image}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <Link
                        to={`/san-pham/${item.sp_ma}?ctsp_ma=${item.ctsp_ma}`}
                        className="text-sm font-bold text-[#0F172A] line-clamp-2 hover:text-[#2563EB] transition-colors"
                      >
                        {item.sp_ten}
                      </Link>
                      <div className="text-xs font-medium text-[#64748B] mt-1.5 bg-[#F1F5F9] px-2 py-1 rounded-md inline-block">
                        Phân loại: {item.ctsp_ten}
                      </div>
                    </div>
                  </div>

                  <div className="text-center text-sm font-semibold text-[#334155]">
                    {formatVND(item.ctsp_gianban)}
                  </div>

                  <div className="flex justify-center">
                    <div className="flex border border-[#E2E8F0] rounded-lg overflow-hidden bg-white">
                      <button
                        onClick={() =>
                          handleUpdateQty(
                            item.ctsp_ma,
                            item.ctgh_soluong - 1,
                            item.ctsp_soluongton,
                          )
                        }
                        className="px-3 py-1.5 hover:bg-[#F8FAFC] text-[#334155] transition-colors border-r border-[#E2E8F0]"
                      >
                        -
                      </button>
                      <input
                        value={item.ctgh_soluong}
                        readOnly
                        className="w-10 text-center text-sm font-bold text-[#0F172A] outline-none"
                      />
                      <button
                        onClick={() =>
                          handleUpdateQty(
                            item.ctsp_ma,
                            item.ctgh_soluong + 1,
                            item.ctsp_soluongton,
                          )
                        }
                        className="px-3 py-1.5 hover:bg-[#F8FAFC] text-[#334155] transition-colors border-l border-[#E2E8F0]"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="text-center text-sm font-bold text-[#DC2626]">
                    {formatVND(item.ctsp_gianban * item.ctgh_soluong)}
                  </div>

                  <button
                    onClick={() => handleRemove(item.ctsp_ma)}
                    className="text-[#64748B] hover:text-[#DC2626] font-medium text-sm transition-colors flex justify-center"
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      delete
                    </span>
                  </button>
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {/* STICKY BOTTOM BAR */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md shadow-[0_-4px_20px_rgba(0,0,0,0.05)] border-t border-[#E2E8F0] z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6 text-sm font-medium">
            <label className="flex items-center gap-3 cursor-pointer text-[#334155]">
              <input
                type="checkbox"
                checked={
                  cartItems.length > 0 &&
                  selectedItems.length === cartItems.length
                }
                onChange={handleSelectAll}
                className="w-5 h-5 accent-[#2563EB] rounded"
              />
              Chọn Tất Cả ({cartItems.length})
            </label>
            {/* ✅ Gắn sự kiện onClick cho nút xóa */}
            <button
              onClick={handleRemoveSelected}
              className="hover:text-[#DC2626] transition-colors"
            >
              Xóa Mục Đã Chọn
            </button>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-sm text-right flex items-center gap-4">
              <span className="text-[#64748B] font-medium">
                Tổng thanh toán ({selectedItems.length} SP):
              </span>
              <span className="text-3xl font-extrabold text-[#DC2626]">
                {formatVND(totalPrice)}
              </span>
            </div>
            <button
              onClick={handleCheckout}
              className="bg-[#DC2626] text-white px-10 py-3 rounded-xl font-bold hover:bg-[#B91C1C] transition-colors shadow-md"
            >
              Mua Hàng
            </button>
          </div>
        </div>
      </div>

      <ToastNotification toast={toast} />
    </div>
  );
};
export default GioHang;
