// src/pages/khachhang/TheoDoiDonHang.jsx
import { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../../contexts/AuthContext";
import donHangService from "../../services/khachhang/donHangService";
import { formatVND } from "../../components/shop/SanPhamShared";
import ToastNotification from "../../components/common/Crud/ToastNotification";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8080";

const ORDER_STEPS = [
  { id: "TTDH01", label: "Chờ Xác Nhận", icon: "pending_actions" },
  { id: "TTDH02", label: "Chờ Lấy Hàng", icon: "inventory_2" },
  { id: "TTDH03", label: "Đang Vận Chuyển", icon: "local_shipping" },
  { id: "TTDH04", label: "Đang Giao Hàng", icon: "delivery_dining" },
  { id: "TTDH05", label: "Đã Hoàn Thành", icon: "check_circle" },
];

const TheoDoiDonHang = () => {
  const { user } = useContext(AuthContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
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
    const fetchOrders = async () => {
      if (!user?.kh_ma) return;
      try {
        const res = await donHangService.getMyOrders(user.kh_ma);
        setOrders(res.data);
      } catch (err) {
        showToast("Lỗi tải danh sách đơn hàng", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [user]);

  const renderTimeline = (currentStatus) => {
    if (currentStatus === "TTDH06") {
      return (
        <div className="flex items-center gap-2 text-red-600 font-bold bg-red-50 p-3 rounded-lg border border-red-200">
          <span className="material-symbols-outlined">cancel</span>
          Đơn hàng đã bị hủy
        </div>
      );
    }

    const currentIndex = ORDER_STEPS.findIndex(
      (step) => step.id === currentStatus,
    );
    const activeIndex = currentIndex === -1 ? 0 : currentIndex;

    return (
      <div className="relative py-6 px-2 w-full">
        {/* Đường kẻ nền (Màu xám) - Căn giữa tâm vòng tròn (40px) */}
        <div className="absolute top-[44px] left-[10%] right-[10%] h-[3px] bg-gray-200 z-0 rounded-full"></div>

        {/* Đường kẻ tiến trình (Màu xanh) */}
        <div
          className="absolute top-[44px] left-[10%] h-[3px] bg-[#2563EB] z-0 transition-all duration-500 rounded-full"
          style={{
            width: `${(activeIndex / (ORDER_STEPS.length - 1)) * 80}%`,
          }}
        ></div>

        {/* Các nút tròn */}
        <div className="relative z-10 flex justify-between w-full">
          {ORDER_STEPS.map((step, index) => {
            const isCompleted = index <= activeIndex;
            const isCurrent = index === activeIndex;

            return (
              <div
                key={step.id}
                className="flex flex-col items-center w-16 sm:w-24"
              >
                {/* Vòng tròn Icon - Dùng !important (dấu !) để chống ghi đè CSS */}
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                    isCompleted
                      ? "!bg-[#2563EB] !border-[#2563EB]" // CỰC KỲ QUAN TRỌNG: Dấu ! ép buộc màu xanh
                      : "!bg-white !border-gray-300"
                  } ${
                    isCurrent ? "ring-4 ring-blue-200 scale-110 shadow-lg" : ""
                  }`}
                >
                  <span
                    className={`material-symbols-outlined text-[20px] ${
                      isCompleted ? "!text-white" : "!text-gray-400"
                    }`}
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    {step.icon}
                  </span>
                </div>

                {/* Text Label */}
                <span
                  className={`text-[11px] sm:text-xs mt-3 text-center leading-tight ${
                    isCompleted
                      ? "text-[#2563EB] font-bold"
                      : "text-gray-400 font-semibold"
                  }`}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center font-medium text-gray-500">
        Đang tải dữ liệu...
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
          <div className="text-sm font-semibold text-[#0F172A]">
            Theo Dõi Đơn Hàng
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 space-y-6">
        {orders.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-[#E2E8F0]">
            <span className="material-symbols-outlined text-6xl text-gray-300 mb-4">
              receipt_long
            </span>
            <p className="text-lg font-bold text-gray-700">
              Bạn chưa có đơn hàng nào.
            </p>
            <Link
              to="/"
              className="mt-4 inline-block px-6 py-2 bg-[#2563EB] text-white rounded-xl font-bold"
            >
              Tiếp tục mua sắm
            </Link>
          </div>
        ) : (
          orders.map((order) => (
            <div
              key={order.DM_Ma}
              className="bg-white rounded-2xl shadow-sm border border-[#E2E8F0] overflow-hidden"
            >
              {/* Header Đơn Tổng */}
              <div className="bg-[#F8FAFC] px-6 py-4 border-b border-[#E2E8F0] flex flex-wrap justify-between items-center gap-2">
                <div>
                  <p className="font-bold text-[#0F172A]">
                    Mã Đơn:{" "}
                    <span className="text-[#2563EB]">{order.DM_Ma}</span>
                  </p>
                  <p className="text-sm text-[#64748B]">
                    Ngày đặt:{" "}
                    {new Date(order.NgayLap).toLocaleDateString("vi-VN")}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-[#64748B]">Tổng thanh toán</p>
                  <p className="text-xl font-extrabold text-[#DC2626]">
                    {formatVND(order.TongTien)}
                  </p>
                </div>
              </div>

              {/* Chi tiết địa chỉ */}
              <div className="px-6 py-3 bg-white border-b border-[#E2E8F0] text-sm text-[#64748B] flex items-start gap-2">
                <span className="material-symbols-outlined text-[#2563EB] text-[18px]">
                  location_on
                </span>
                <span>Giao đến: {order.DiaChiNhan}</span>
              </div>

              {/* Danh sách Đơn Shop */}
              <div className="divide-y divide-[#E2E8F0]">
                {order.shops.map((shop) => (
                  <div key={shop.DTS_Ma} className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="material-symbols-outlined text-[#2563EB]">
                        storefront
                      </span>
                      <span className="font-bold text-[#0F172A]">
                        {shop.TenShop}
                      </span>
                    </div>

                    {/* Timeline Trạng Thái */}
                    <div className="mb-6 bg-gray-50 p-4 rounded-xl border border-gray-100">
                      {renderTimeline(shop.TrangThaiHienTai)}
                    </div>

                    {/* Danh sách sản phẩm của Shop */}
                    <div className="space-y-4 mb-4">
                      {shop.items.map((item) => (
                        <div
                          key={item.Ctsp_Ma}
                          className="flex gap-4 items-center text-sm"
                        >
                          <img
                            src={
                              item.Image
                                ? `${BACKEND_URL}${item.Image}`
                                : "https://placehold.co/100x100"
                            }
                            className="w-16 h-16 rounded-lg object-cover border border-[#E2E8F0]"
                            alt=""
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-[#0F172A] truncate">
                              {item.TenSanPham}
                            </p>
                            <p className="text-[#64748B] text-xs mt-0.5">
                              Phân loại: {item.TenPhanLoai}
                            </p>
                            <p className="text-[#64748B] text-xs">
                              Số lượng: {item.SoLuong}
                            </p>
                          </div>
                          <p className="font-bold text-[#DC2626]">
                            {formatVND(item.GiaBan * item.SoLuong)}
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* Tổng kết Shop */}
                    <div className="flex justify-end text-sm border-t border-[#E2E8F0] pt-3 gap-6">
                      <span className="text-[#64748B]">
                        Phí vận chuyển:{" "}
                        <strong className="text-[#0F172A]">
                          {formatVND(shop.TienVanChuyen)}
                        </strong>
                      </span>
                      <span className="text-[#64748B]">
                        Tổng Shop:{" "}
                        <strong className="text-[#DC2626] text-base">
                          {formatVND(shop.TongThanhToan)}
                        </strong>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
      <ToastNotification toast={toast} />
    </div>
  );
};

export default TheoDoiDonHang;
