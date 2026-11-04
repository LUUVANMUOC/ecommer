// src/pages/shop/QuanLyDonHang.jsx
import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../../contexts/AuthContext";
import donHangShopService from "../../services/gianhang/donHangShopService";
import { formatVND } from "../../components/shop/SanPhamShared";
import ToastNotification from "../../components/common/Crud/ToastNotification";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8080";

const STATUS_MAP = {
  TTDH01: {
    label: "Chờ Xác Nhận",
    color: "text-yellow-600 bg-yellow-50 border-yellow-200",
  },
  TTDH02: {
    label: "Chờ Lấy Hàng",
    color: "text-blue-600 bg-blue-50 border-blue-200",
  },
  TTDH03: {
    label: "Đang Vận Chuyển",
    color: "text-purple-600 bg-purple-50 border-purple-200",
  },
  TTDH04: {
    label: "Đang Giao Hàng",
    color: "text-orange-600 bg-orange-50 border-orange-200",
  },
  TTDH05: {
    label: "Đã Hoàn Thành",
    color: "text-green-600 bg-green-50 border-green-200",
  },
  TTDH06: { label: "Đã Hủy", color: "text-red-600 bg-red-50 border-red-200" },
};

const QuanLyDonHang = () => {
  const { user } = useContext(AuthContext);
  const gh_ma = user?.gh_ma || user?.GH_Ma || user?.id;

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });
  const [confirmingId, setConfirmingId] = useState(null);

  // State cho Modal Chi tiết
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [orderDetail, setOrderDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast((p) => ({ ...p, show: false })), 3000);
  };

  const fetchOrders = async () => {
    if (!gh_ma) return;
    try {
      const res = await donHangShopService.getOrders(gh_ma);
      setOrders(res.data);
    } catch (err) {
      showToast("Lỗi tải danh sách đơn hàng", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [gh_ma]);

  const handleConfirmOrder = async (dts_ma) => {
    if (!window.confirm("Xác nhận đơn hàng này?")) return;
    setConfirmingId(dts_ma);
    try {
      await donHangShopService.confirmOrder(dts_ma);
      showToast("Đã xác nhận đơn hàng thành công!");
      fetchOrders();
    } catch (error) {
      showToast(error.response?.data?.message || "Lỗi!", "error");
    } finally {
      setConfirmingId(null);
    }
  };

  const handleViewDetail = async (dts_ma) => {
    setIsModalOpen(true);
    setLoadingDetail(true);
    try {
      const res = await donHangShopService.getOrderDetail(dts_ma);
      setOrderDetail(res.data);
    } catch (error) {
      showToast("Lỗi tải chi tiết đơn hàng", "error");
      setIsModalOpen(false);
    } finally {
      setLoadingDetail(false);
    }
  };

  if (loading)
    return (
      <div className="p-10 text-center font-medium text-gray-500">
        Đang tải dữ liệu...
      </div>
    );

  return (
    <div className="p-6 bg-[#F8FAFC] min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#0F172A]">Quản Lý Đơn Hàng</h1>
        <p className="text-sm text-[#64748B] mt-1">
          Xem và xử lý các đơn hàng khách đặt
        </p>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-[#E2E8F0]">
          <span className="material-symbols-outlined text-6xl text-gray-300 mb-4">
            receipt_long
          </span>
          <p className="text-lg font-bold text-gray-700">
            Chưa có đơn hàng nào.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-[#E2E8F0] overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-[#64748B] text-sm border-b border-[#E2E8F0]">
                <th className="p-4 font-semibold">Mã Đơn</th>
                <th className="p-4 font-semibold">Khách Hàng</th>
                <th className="p-4 font-semibold">Ngày Đặt</th>
                <th className="p-4 font-semibold">Tổng Tiền</th>
                <th className="p-4 font-semibold">Trạng Thái</th>
                <th className="p-4 font-semibold text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {orders.map((order) => {
                const statusConfig = STATUS_MAP[order.TrangThaiHienTai] || {
                  label: "Không xác định",
                  color: "text-gray-600 bg-gray-50",
                };
                return (
                  <tr
                    key={order.DTS_Ma}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="p-4 font-bold text-[#2563EB]">
                      {order.DTS_Ma}
                    </td>
                    <td className="p-4">
                      <p className="font-semibold text-[#0F172A]">
                        {order.TenKhachHang}
                      </p>
                      <p className="text-xs text-[#64748B] line-clamp-1 max-w-[200px]">
                        {order.DiaChiGiao}
                      </p>
                    </td>
                    <td className="p-4 text-sm text-[#64748B]">
                      {new Date(order.NgayLap).toLocaleDateString("vi-VN")}
                    </td>
                    <td className="p-4 font-bold text-[#DC2626]">
                      {formatVND(order.TongThanhToan)}
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold border ${statusConfig.color}`}
                      >
                        {statusConfig.label}
                      </span>
                    </td>
                    <td className="p-4 text-right flex justify-end gap-2">
                      <button
                        onClick={() => handleViewDetail(order.DTS_Ma)}
                        className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm font-bold rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        Xem chi tiết
                      </button>
                      {order.TrangThaiHienTai === "TTDH01" && (
                        <button
                          onClick={() => handleConfirmOrder(order.DTS_Ma)}
                          disabled={confirmingId === order.DTS_Ma}
                          className="px-3 py-1.5 bg-[#2563EB] text-white text-sm font-bold rounded-lg hover:bg-[#1D4ED8] transition-colors disabled:opacity-50"
                        >
                          {confirmingId === order.DTS_Ma
                            ? "Đang xử lý..."
                            : "Xác Nhận"}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ✅ MODAL CHI TIẾT ĐƠN HÀNG */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-xl flex flex-col">
            {/* Header Modal */}
            <div className="p-6 border-b border-[#E2E8F0] flex justify-between items-center sticky top-0 bg-white z-10">
              <h3 className="text-xl font-bold text-[#0F172A]">
                Chi Tiết Đơn Hàng {orderDetail?.DTS_Ma}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-red-500"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Body Modal */}
            <div className="p-6 bg-[#F8FAFC] flex-1">
              {loadingDetail ? (
                <div className="text-center py-10 text-[#2563EB] font-semibold animate-pulse">
                  Đang tải dữ liệu...
                </div>
              ) : orderDetail ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Cột 1: Thông tin người nhận & Vận chuyển */}
                  <div className="space-y-6">
                    {/* Box Người nhận */}
                    <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-sm">
                      <h4 className="font-bold text-[#0F172A] mb-3 flex items-center gap-2 border-b pb-2">
                        <span className="material-symbols-outlined text-[#2563EB]">
                          person
                        </span>{" "}
                        Thông Tin Người Nhận
                      </h4>
                      <div className="text-sm space-y-2">
                        <p>
                          <span className="text-gray-500">Họ tên:</span>{" "}
                          <strong className="text-[#0F172A]">
                            {orderDetail.TenNguoiNhan}
                          </strong>
                        </p>
                        <p>
                          <span className="text-gray-500">SĐT:</span>{" "}
                          <strong className="text-[#0F172A]">
                            {orderDetail.SdtNguoiNhan}
                          </strong>
                        </p>
                        <p>
                          <span className="text-gray-500">Địa chỉ:</span>{" "}
                          {orderDetail.DiaChiGiao}
                        </p>
                        {orderDetail.GhiChuKhach && (
                          <p className="text-xs text-red-500 italic mt-2">
                            Ghi chú khách: {orderDetail.GhiChuKhach}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Box Vận chuyển */}
                    <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-sm">
                      <h4 className="font-bold text-[#0F172A] mb-3 flex items-center gap-2 border-b pb-2">
                        <span className="material-symbols-outlined text-[#2563EB]">
                          local_shipping
                        </span>{" "}
                        Thông Tin Vận Chuyển
                      </h4>
                      <div className="text-sm space-y-2">
                        <p>
                          <span className="text-gray-500">Đơn vị VC:</span>{" "}
                          <strong className="text-[#0F172A]">
                            {orderDetail.TenDVVC}
                          </strong>
                        </p>
                        <p>
                          <span className="text-gray-500">Mốc khối lượng:</span>{" "}
                          {orderDetail.TenMocKhoiLuong}
                        </p>
                        <p>
                          <span className="text-gray-500">
                            Ngày giao dự kiến:
                          </span>{" "}
                          <strong className="text-blue-600">
                            {new Date(
                              orderDetail.NgayGiaoDuKien,
                            ).toLocaleDateString("vi-VN")}
                          </strong>
                        </p>
                      </div>
                    </div>

                    {/* Box Voucher */}
                    <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-sm">
                      <h4 className="font-bold text-[#0F172A] mb-3 flex items-center gap-2 border-b pb-2">
                        <span className="material-symbols-outlined text-[#2563EB]">
                          local_activity
                        </span>{" "}
                        Voucher Đã Áp Dụng
                      </h4>
                      <div className="text-sm space-y-3">
                        <div>
                          <p className="text-gray-500 mb-1">Voucher Shop:</p>
                          {orderDetail.TenVoucherShop ? (
                            <p className="font-semibold text-emerald-600 bg-emerald-50 p-2 rounded-lg">
                              {orderDetail.TenVoucherShop} (Giảm{" "}
                              {orderDetail.PhanTramGiamShop}%)
                            </p>
                          ) : (
                            <p className="text-gray-400 italic">
                              Không sử dụng
                            </p>
                          )}
                        </div>
                        <div>
                          <p className="text-gray-500 mb-1">
                            Voucher Vận Chuyển:
                          </p>
                          {orderDetail.TenVoucherVC ? (
                            <p className="font-semibold text-orange-600 bg-orange-50 p-2 rounded-lg">
                              {orderDetail.TenVoucherVC} (Giảm{" "}
                              {orderDetail.PhanTramGiamVC}%)
                            </p>
                          ) : (
                            <p className="text-gray-400 italic">
                              Không sử dụng
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Cột 2: Sản phẩm & Tài chính & Lịch sử */}
                  <div className="space-y-6">
                    {/* Box Sản phẩm */}
                    <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-sm">
                      <h4 className="font-bold text-[#0F172A] mb-3 flex items-center gap-2 border-b pb-2">
                        <span className="material-symbols-outlined text-[#2563EB]">
                          inventory_2
                        </span>{" "}
                        Sản Phẩm ({orderDetail.items?.length || 0})
                      </h4>
                      <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                        {orderDetail.items?.map((item) => (
                          <div
                            key={item.Ctsp_Ma}
                            className="flex gap-3 text-sm border-b border-gray-100 pb-2 last:border-0"
                          >
                            <img
                              src={
                                item.Image
                                  ? `${BACKEND_URL}${item.Image}`
                                  : "https://placehold.co/100x100"
                              }
                              className="w-12 h-12 rounded object-cover border"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-[#0F172A] truncate">
                                {item.TenSanPham}
                              </p>
                              <p className="text-xs text-gray-500">
                                PL: {item.TenPhanLoai} | SL: {item.SoLuong}
                              </p>
                            </div>
                            <p className="font-bold text-[#DC2626]">
                              {formatVND(item.ThanhTien)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Box Tài chính */}
                    <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-sm">
                      <h4 className="font-bold text-[#0F172A] mb-3 flex items-center gap-2 border-b pb-2">
                        <span className="material-symbols-outlined text-[#2563EB]">
                          receipt
                        </span>{" "}
                        Thanh Toán
                      </h4>
                      <div className="text-sm space-y-1.5">
                        <div className="flex justify-between text-gray-600">
                          <span>Tiền hàng:</span>{" "}
                          <span>{formatVND(orderDetail.TongTienHang)}</span>
                        </div>
                        <div className="flex justify-between text-gray-600">
                          <span>Phí vận chuyển:</span>{" "}
                          <span>{formatVND(orderDetail.TienVanChuyen)}</span>
                        </div>
                        <div className="flex justify-between text-emerald-600">
                          <span>Tổng giảm giá:</span>{" "}
                          <span>-{formatVND(orderDetail.TongTienGiamGia)}</span>
                        </div>
                        <div className="flex justify-between text-red-500 font-bold border-t pt-2 mt-2">
                          <span>Khách thanh toán:</span>{" "}
                          <span>{formatVND(orderDetail.TongThanhToan)}</span>
                        </div>
                        <div className="flex justify-between text-gray-500 text-xs pt-1">
                          <span>Phí sàn:</span>{" "}
                          <span>{formatVND(orderDetail.TongTienPhiSan)}</span>
                        </div>
                        <div className="flex justify-between text-gray-500 text-xs">
                          <span>Trạng thái TT:</span>{" "}
                          <span
                            className={
                              orderDetail.TrangThaiThanhToan
                                ? "text-green-600 font-bold"
                                : "text-orange-500"
                            }
                          >
                            {orderDetail.TrangThaiThanhToan
                              ? "Đã thanh toán"
                              : "Chưa thanh toán"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Box Lịch sử */}
                    <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-sm">
                      <h4 className="font-bold text-[#0F172A] mb-3 flex items-center gap-2 border-b pb-2">
                        <span className="material-symbols-outlined text-[#2563EB]">
                          history
                        </span>{" "}
                        Lịch Sử Trạng Thái
                      </h4>
                      <div className="space-y-3">
                        {orderDetail.lich_su_trang_thai?.map((log, index) => (
                          <div
                            key={index}
                            className="flex gap-3 relative pb-3 border-l-2 border-gray-200 pl-4 last:pb-0 last:border-transparent"
                          >
                            <div
                              className={`absolute -left-1.5 top-1 w-3 h-3 rounded-full ${index === 0 ? "bg-[#2563EB]" : "bg-gray-300"}`}
                            ></div>
                            <div>
                              <p
                                className={`text-sm font-bold ${index === 0 ? "text-[#2563EB]" : "text-gray-700"}`}
                              >
                                {log.ten_trang_thai}
                              </p>
                              <p className="text-xs text-gray-500">
                                {new Date(log.thoi_diem).toLocaleString(
                                  "vi-VN",
                                )}
                              </p>
                              {log.ghi_chu && (
                                <p className="text-xs text-gray-500 italic mt-1">
                                  "{log.ghi_chu}"
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}

      <ToastNotification toast={toast} />
    </div>
  );
};

export default QuanLyDonHang;
