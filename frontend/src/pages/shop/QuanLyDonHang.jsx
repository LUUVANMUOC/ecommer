// src/pages/shop/QuanLyDonHang.jsx
import { useState, useEffect, useContext, Fragment, useMemo } from "react";
import { AuthContext } from "../../contexts/AuthContext";
import donHangShopService from "../../services/gianhang/donHangShopService";
import { formatVND } from "../../components/shop/SanPhamShared";
import ToastNotification from "../../components/common/Crud/ToastNotification";
import LoTrinhVanChuyen from "../../components/common/LoTrinhVanChuyen";
import SanPhamLink from "../../components/common/SanPhamLink";
import Avatar from "../../components/common/Avatar";

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

// Cấu hình Icon/Màu cho Lịch sử vận chuyển
const EVENT_CONFIG = {
  HE_THONG: {
    icon: "receipt_long",
    color: "text-gray-700",
    bg: "bg-gray-50",
    border: "border-gray-200",
  },
  DIEU_PHOI: {
    icon: "assignment_ind",
    color: "text-teal-700",
    bg: "bg-teal-50",
    border: "border-teal-200",
  },
  THU_KHO: {
    icon: "warehouse",
    color: "text-purple-700",
    bg: "bg-purple-50",
    border: "border-purple-200",
  },
  SHIPPER: {
    icon: "local_shipping",
    color: "text-blue-700",
    bg: "bg-blue-50",
    border: "border-blue-200",
  },
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

  // Xác nhận hàng loạt
  const [selected, setSelected] = useState([]);
  const [batchOpen, setBatchOpen] = useState(false);
  const [submittingBatch, setSubmittingBatch] = useState(false);

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
      const data = res.data || [];
      setOrders(data);
      // Bỏ chọn các đơn không còn chờ xác nhận (đã đổi trạng thái ở nơi khác)
      setSelected((prev) =>
        prev.filter((ma) =>
          data.some((o) => o.DTS_Ma === ma && o.TrangThaiHienTai === "TTDH01"),
        ),
      );
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

  // ---- Xác nhận hàng loạt ----
  const donChoXacNhan = useMemo(
    () => orders.filter((o) => o.TrangThaiHienTai === "TTDH01"),
    [orders],
  );

  const daChonTatCa =
    donChoXacNhan.length > 0 && selected.length === donChoXacNhan.length;

  const tongTienDaChon = useMemo(
    () =>
      orders
        .filter((o) => selected.includes(o.DTS_Ma))
        .reduce((tong, o) => tong + Number(o.TongThanhToan || 0), 0),
    [orders, selected],
  );

  const toggleChonDon = (dts_ma) => {
    setSelected((prev) =>
      prev.includes(dts_ma)
        ? prev.filter((ma) => ma !== dts_ma)
        : [...prev, dts_ma],
    );
  };

  const toggleChonTatCa = () => {
    setSelected(daChonTatCa ? [] : donChoXacNhan.map((o) => o.DTS_Ma));
  };

  const handleConfirmBatch = async () => {
    if (selected.length === 0) return;
    setSubmittingBatch(true);
    try {
      const res = await donHangShopService.confirmOrdersBatch({
        gh_ma,
        danh_sach: selected,
      });
      showToast(
        res.data?.message || `Đã xác nhận ${selected.length} đơn hàng!`,
      );
      setBatchOpen(false);
      setSelected([]);
      await fetchOrders();
    } catch (error) {
      showToast(
        error.response?.data?.message || "Lỗi xác nhận đơn hàng!",
        "error",
      );
    } finally {
      setSubmittingBatch(false);
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
          {donChoXacNhan.length > 0 && (
            <div className="flex flex-wrap items-center gap-3 border-b border-[#E2E8F0] bg-blue-50/50 px-4 py-3">
              <label className="flex items-center gap-2 text-sm font-semibold text-[#334155] cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="w-4 h-4 cursor-pointer"
                  checked={daChonTatCa}
                  onChange={toggleChonTatCa}
                  disabled={submittingBatch}
                />
                Chọn tất cả đơn chờ xác nhận ({donChoXacNhan.length})
              </label>

              <span className="text-sm text-[#64748B]">
                Đã chọn:{" "}
                <b className="text-[#2563EB]">{selected.length}</b>
              </span>

              {selected.length > 0 && (
                <span className="text-sm text-[#64748B]">
                  Tổng:{" "}
                  <b className="text-[#DC2626]">
                    {formatVND(tongTienDaChon)}
                  </b>
                </span>
              )}

              <div className="ml-auto flex items-center gap-2">
                {selected.length > 0 && (
                  <button
                    onClick={() => setSelected([])}
                    disabled={submittingBatch}
                    className="px-3 py-2 text-sm font-semibold text-[#64748B] hover:text-[#0F172A] disabled:opacity-50"
                  >
                    Bỏ chọn
                  </button>
                )}
                <button
                  onClick={() => setBatchOpen(true)}
                  disabled={selected.length === 0 || submittingBatch}
                  className="px-4 py-2 bg-[#2563EB] text-white text-sm font-bold rounded-lg hover:bg-[#1D4ED8] transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Xác nhận {selected.length > 0 ? selected.length : ""} đơn
                </button>
              </div>
            </div>
          )}

          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-[#64748B] text-sm border-b border-[#E2E8F0]">
                <th className="p-4 w-12">
                  <input
                    type="checkbox"
                    className="w-4 h-4 cursor-pointer"
                    checked={daChonTatCa}
                    onChange={toggleChonTatCa}
                    disabled={submittingBatch || donChoXacNhan.length === 0}
                    title="Chọn tất cả đơn chờ xác nhận"
                  />
                </th>
                <th className="p-4 font-semibold">Mã Đơn</th>
                <th className="p-4 font-semibold">Khách Hàng</th>
                <th className="p-4 font-semibold">Ngày Đặt</th>
                <th className="p-4 font-semibold">Tổng Tiền</th>
                <th className="p-4 font-semibold">Trạng Thái</th>
                <th className="p-4 font-semibold text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                const statusConfig = STATUS_MAP[order.TrangThaiHienTai] || {
                  label: "Không xác định",
                  color: "text-gray-600 bg-gray-50",
                };
                const items = Array.isArray(order.items) ? order.items : [];
                return (
                  <Fragment key={order.DTS_Ma}>
                    <tr
                      className={`transition-colors ${
                        selected.includes(order.DTS_Ma)
                          ? "bg-blue-50/60"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      <td className="p-4 w-12">
                        {order.TrangThaiHienTai === "TTDH01" && (
                          <input
                            type="checkbox"
                            className="w-4 h-4 cursor-pointer"
                            checked={selected.includes(order.DTS_Ma)}
                            onChange={() => toggleChonDon(order.DTS_Ma)}
                            disabled={submittingBatch}
                          />
                        )}
                      </td>
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
                            disabled={
                              confirmingId === order.DTS_Ma || submittingBatch
                            }
                            className="px-3 py-1.5 bg-[#2563EB] text-white text-sm font-bold rounded-lg hover:bg-[#1D4ED8] transition-colors disabled:opacity-50"
                          >
                            {confirmingId === order.DTS_Ma
                              ? "Đang xử lý..."
                              : "Xác Nhận"}
                          </button>
                        )}
                      </td>
                    </tr>

                    {/* 🟢 SẢN PHẨM CỦA ĐƠN — LUÔN HIỂN THỊ, ĐỦ TẤT CẢ MÓN */}
                    <tr className="bg-white">
                      <td
                        colSpan={7}
                        className="px-4 pb-4 pt-0 border-b border-[#E2E8F0]"
                      >
                        <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3">
                          <div className="flex items-center gap-1.5 mb-2">
                            <span className="material-symbols-outlined text-[16px] text-[#2563EB]">
                              inventory_2
                            </span>
                            <span className="text-[11px] font-bold uppercase tracking-wide text-[#64748B]">
                              Sản phẩm ({items.length})
                            </span>
                          </div>

                          {items.length === 0 ? (
                            <p className="text-xs text-[#94A3B8] italic">
                              Không có sản phẩm.
                            </p>
                          ) : (
                            <div className="space-y-2">
                              {items.map((item) => (
                                <SanPhamLink
                                  key={item.Ctsp_Ma}
                                  to={
                                    item.Sp_Ma
                                      ? `/nguoi-ban/quan-ly-san-pham/${item.Sp_Ma}`
                                      : undefined
                                  }
                                  className="group -mx-2 flex items-center gap-3 rounded-xl px-2 py-1.5 transition-colors hover:bg-white"
                                >
                                  <img
                                    src={
                                      item.Image
                                        ? `${BACKEND_URL}${item.Image}`
                                        : "https://placehold.co/100x100"
                                    }
                                    alt=""
                                    className="w-11 h-11 rounded-lg object-cover border border-[#E2E8F0] bg-white shrink-0"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-[#0F172A] truncate group-hover:text-[#2563EB]">
                                      {item.TenSanPham}
                                    </p>
                                    <p className="text-xs text-[#64748B] truncate">
                                      Phân loại: {item.TenPhanLoai || "—"}
                                    </p>
                                  </div>
                                  <div className="text-right shrink-0">
                                    <p className="text-xs text-[#64748B]">
                                      SL: {item.SoLuong} ×{" "}
                                      {formatVND(item.DonGia)}
                                    </p>
                                    <p className="text-sm font-bold text-[#DC2626]">
                                      {formatVND(item.ThanhTien)}
                                    </p>
                                  </div>
                                </SanPhamLink>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ✅ MODAL CHI TIẾT ĐƠN HÀNG */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-6xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col custom-scrollbar">
            <div className="p-6 border-b border-[#E2E8F0] flex justify-between items-center sticky top-0 bg-white z-10 rounded-t-3xl">
              <h3 className="text-xl font-bold text-[#0F172A]">
                Chi Tiết Đơn Hàng {orderDetail?.DTS_Ma}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-red-500 bg-gray-50 hover:bg-red-50 p-2 rounded-full transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-6 bg-[#F8FAFC] flex-1">
              {loadingDetail ? (
                <div className="text-center py-10 text-[#2563EB] font-semibold animate-pulse">
                  Đang tải dữ liệu...
                </div>
              ) : orderDetail ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* CỘT TRÁI: THÔNG TIN CHUNG */}
                  <div className="space-y-6">
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

                    <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-sm">
                      <h4 className="font-bold text-[#0F172A] mb-3 flex items-center gap-2 border-b pb-2">
                        <span className="material-symbols-outlined text-[#2563EB]">
                          inventory_2
                        </span>{" "}
                        Sản Phẩm ({orderDetail.items?.length || 0})
                      </h4>
                      <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                        {orderDetail.items?.map((item) => (
                          <SanPhamLink
                            key={item.Ctsp_Ma}
                            to={
                              item.Sp_Ma
                                ? `/nguoi-ban/quan-ly-san-pham/${item.Sp_Ma}`
                                : undefined
                            }
                            className="group -mx-2 flex gap-3 rounded-xl border-b border-gray-100 px-2 py-1.5 text-sm transition-colors last:border-0 hover:bg-[#F8FAFC]"
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
                              <p className="font-semibold text-[#0F172A] truncate group-hover:text-[#2563EB]">
                                {item.TenSanPham}
                              </p>
                              <p className="text-xs text-gray-500">
                                PL: {item.TenPhanLoai} | SL: {item.SoLuong}
                              </p>
                            </div>
                            <p className="font-bold text-[#DC2626]">
                              {formatVND(item.ThanhTien)}
                            </p>
                          </SanPhamLink>
                        ))}
                      </div>
                    </div>

                    {/* 🟢 KHỐI THANH TOÁN CHI TIẾT */}
                    <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-sm">
                      <h4 className="font-bold text-[#0F172A] mb-3 flex items-center gap-2 border-b pb-2">
                        <span className="material-symbols-outlined text-[#2563EB]">
                          receipt
                        </span>{" "}
                        Thanh Toán
                      </h4>
                      <div className="text-sm space-y-2">
                        <div className="flex justify-between text-gray-600">
                          <span>Tiền hàng (Gốc):</span>
                          <span className="font-semibold text-gray-800">
                            {formatVND(orderDetail.TongTienHang)}
                          </span>
                        </div>

                        <div className="flex justify-between text-gray-600">
                          <span>Phí vận chuyển (Gốc):</span>
                          <span className="font-semibold text-gray-800">
                            {formatVND(orderDetail.TienVanChuyen)}
                          </span>
                        </div>

                        {/* Nếu có giảm giá Shop */}
                        {orderDetail.GiamGiaShop > 0 && (
                          <div className="flex justify-between text-emerald-600">
                            <span>Giảm giá từ Shop:</span>
                            <span className="font-semibold">
                              -{formatVND(Math.abs(orderDetail.GiamGiaShop))}
                            </span>
                          </div>
                        )}

                        {/* Nếu có giảm giá Vận chuyển */}
                        {orderDetail.GiamGiaVanChuyen > 0 && (
                          <div className="flex justify-between text-emerald-600">
                            <span>Giảm giá Vận chuyển:</span>
                            <span className="font-semibold">
                              -
                              {formatVND(
                                Math.abs(orderDetail.GiamGiaVanChuyen),
                              )}
                            </span>
                          </div>
                        )}

                        {/* Tổng giảm giá */}
                        <div className="flex justify-between text-emerald-600 border-t border-dashed pt-2">
                          <span>Tổng giảm giá:</span>
                          <span className="font-semibold">
                            -{formatVND(Math.abs(orderDetail.TongTienGiamGia))}
                          </span>
                        </div>

                        <div className="flex justify-between text-red-500 font-bold text-base border-t pt-2 mt-2">
                          <span>Khách thanh toán:</span>
                          <span>{formatVND(orderDetail.TongThanhToan)}</span>
                        </div>

                        <div className="flex justify-between text-gray-500 text-xs pt-2">
                          <span>Phí sàn (Hoa hồng):</span>
                          <span className="text-gray-700">
                            {formatVND(orderDetail.TongTienPhiSan)}
                          </span>
                        </div>

                        <div className="flex justify-between text-gray-500 text-xs border-t pt-2 mt-2">
                          <span>Trạng thái TT:</span>
                          <span
                            className={
                              orderDetail.TrangThaiThanhToan
                                ? "text-green-600 font-bold"
                                : "text-orange-500 font-bold"
                            }
                          >
                            {orderDetail.TrangThaiThanhToan
                              ? "Đã thanh toán"
                              : "Chưa thanh toán"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* CỘT PHẢI: LỊCH SỬ TRẠNG THÁI & LỊCH SỬ VẬN CHUYỂN */}
                  <div className="space-y-6">
                    {/* 1. LỊCH SỬ TRẠNG THÁI */}
                    <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-sm">
                      <h4 className="font-bold text-[#0F172A] mb-4 flex items-center gap-2 border-b pb-2">
                        <span className="material-symbols-outlined text-[#2563EB]">
                          history
                        </span>{" "}
                        Lịch Sử Trạng Thái
                      </h4>

                      {/* 🟢 FIX: Thêm pl-2 vào class của div cuộn này */}
                      <div className="space-y-3 max-h-60 overflow-y-auto pl-2 pr-2 custom-scrollbar">
                        {orderDetail.lich_su_trang_thai?.map((log, index) => (
                          <div
                            key={index}
                            className="flex gap-3 relative pb-3 border-l-2 border-gray-200 pl-4 last:pb-0 last:border-transparent"
                          >
                            {/* 🟢 FIX: Đổi -left-1.5 thành -left-[5px], thêm top-1.5, viền trắng và đổ bóng nhẹ */}
                            <div
                              className={`absolute -left-[5px] top-1.5 w-3 h-3 rounded-full border-2 border-white shadow-sm z-10 ${index === 0 ? "bg-[#2563EB]" : "bg-gray-300"}`}
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

                    {/* 2. LỊCH SỬ VẬN CHUYỂN */}
                    <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-sm">
                      <h4 className="font-bold text-[#0F172A] mb-4 flex items-center gap-2 border-b pb-2">
                        <span className="material-symbols-outlined text-[#2563EB]">
                          local_shipping
                        </span>{" "}
                        Lịch Sử Vận Chuyển Chi Tiết
                      </h4>

                      {orderDetail.loTrinh?.length > 1 && (
                        <div className="mb-4">
                          <LoTrinhVanChuyen
                            nhan="Toàn trình vận chuyển"
                            loTrinh={orderDetail.loTrinh}
                          />
                        </div>
                      )}

                      <div className="relative border-l-2 border-indigo-200 ml-4 space-y-6 pb-4">
                        {orderDetail.timeline?.map((item, index) => {
                          const config =
                            EVENT_CONFIG[item.LoaiSuKien] ||
                            EVENT_CONFIG.HE_THONG;
                          const isLatest =
                            index === orderDetail.timeline.length - 1;

                          return (
                            <div key={index} className="relative pl-6">
                              {/* Chấm tròn Timeline */}
                              <div
                                className={`absolute -left-[13px] top-1 w-6 h-6 rounded-full bg-white border-2 flex items-center justify-center shadow-sm z-10 ${isLatest ? "border-indigo-600 ring-4 ring-indigo-100" : "border-gray-300"}`}
                              >
                                <span
                                  className={`material-symbols-outlined text-[12px] ${isLatest ? "text-indigo-600" : "text-gray-400"}`}
                                >
                                  {config.icon}
                                </span>
                              </div>

                              {/* Nội dung */}
                              <div
                                className={`p-4 rounded-xl border ${isLatest ? "border-indigo-200 bg-indigo-50/30 shadow-md" : "border-gray-100 bg-white"}`}
                              >
                                <h5
                                  className={`font-bold text-sm ${isLatest ? "text-indigo-700" : "text-[#0F172A]"}`}
                                >
                                  {item.HanhDong}
                                </h5>
                                <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                  <span className="material-symbols-outlined text-[14px]">
                                    schedule
                                  </span>
                                  {new Date(item.ThoiGian).toLocaleString(
                                    "vi-VN",
                                  )}
                                </p>
                                <p className="text-xs text-gray-600 mt-1 flex items-center gap-1">
                                  <span className="material-symbols-outlined text-[14px]">
                                    person
                                  </span>
                                  Thực hiện:{" "}
                                  <b className={config.color}>
                                    {item.NguoiThucHien}
                                  </b>
                                </p>

                                {item.GhiChu && (
                                  <p className="text-xs text-gray-600 italic mt-2 border-l-2 border-gray-300 pl-2">
                                    "{item.GhiChu}"
                                  </p>
                                )}

                                {/* Thông tin Kho / Shipper / Ảnh */}
                                <div className="mt-3 flex flex-col gap-2">
                                  {item.Shipper_Ma && (
                                    <div
                                      className={`flex items-center gap-2 p-2 rounded-lg border ${config.bg} ${config.border}`}
                                    >
                                      <Avatar
                                        src={item.Shipper_HinhAnh}
                                        role="shipper"
                                        name={item.Shipper_Ten}
                                        className="w-8 h-8 rounded-full object-cover border border-white shadow-sm"
                                      />
                                      <div>
                                        <p
                                          className={`text-xs font-bold ${config.color}`}
                                        >
                                          {item.Shipper_Ten}
                                        </p>
                                        <p className="text-[10px] opacity-80">
                                          SĐT: {item.Shipper_SDT}
                                        </p>
                                      </div>
                                    </div>
                                  )}

                                  {(item.Diem_Di || item.Diem_Den) ? (
                                    <LoTrinhVanChuyen
                                      compact
                                      nhan={item.TenChang}
                                      tu={item.Diem_Di}
                                      den={item.Diem_Den}
                                      cungKho={item.CungKho}
                                    />
                                  ) : (
                                    item.Kho_Ma && (
                                      <p className="text-xs text-gray-500">
                                        Kho xử lý:{" "}
                                        <b className="text-indigo-700">
                                          {item.Kho_Ten}
                                        </b>
                                      </p>
                                    )
                                  )}

                                  {item.HinhAnh && (
                                    <div className="mt-1">
                                      <a
                                        href={`${BACKEND_URL}${item.HinhAnh}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                      >
                                        <img
                                          src={`${BACKEND_URL}${item.HinhAnh}`}
                                          alt="Minh chứng"
                                          className="w-16 h-16 object-cover rounded-lg border border-gray-200 hover:opacity-80"
                                        />
                                      </a>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
            <div className="p-4 border-t bg-gray-50 flex justify-end rounded-b-3xl">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-2 bg-gray-800 text-white font-bold rounded-xl hover:bg-gray-900"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ MODAL XÁC NHẬN HÀNG LOẠT */}
      {batchOpen && (
        <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-[#E2E8F0] flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-[#0F172A]">
                  Xác nhận {selected.length} đơn hàng
                </h3>
                <p className="text-sm text-[#64748B] mt-0.5">
                  Tổng giá trị:{" "}
                  <b className="text-[#DC2626]">
                    {formatVND(tongTienDaChon)}
                  </b>
                </p>
              </div>
              <button
                onClick={() => setBatchOpen(false)}
                disabled={submittingBatch}
                className="text-gray-400 hover:text-red-500 bg-gray-50 hover:bg-red-50 p-2 rounded-full transition-colors disabled:opacity-50"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-6 bg-[#F8FAFC] flex-1 overflow-y-auto">
              <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800 flex gap-2 mb-4">
                <span className="material-symbols-outlined text-[20px] shrink-0">
                  info
                </span>
                <p>
                  Sau khi xác nhận, <b>tất cả {selected.length} đơn</b> sẽ
                  chuyển sang <b>Chờ Lấy Hàng</b> và kho phụ trách sẽ được báo
                  đi lấy hàng. Nếu có đơn không hợp lệ, cả lô sẽ không được xác
                  nhận.
                </p>
              </div>

              <div className="bg-white rounded-xl border border-[#E2E8F0] divide-y divide-[#F1F5F9] max-h-64 overflow-y-auto">
                {orders
                  .filter((o) => selected.includes(o.DTS_Ma))
                  .map((o) => (
                    <div
                      key={o.DTS_Ma}
                      className="flex items-center justify-between gap-3 px-4 py-3"
                    >
                      <div className="min-w-0">
                        <p className="font-bold text-[#2563EB] text-sm">
                          {o.DTS_Ma}
                        </p>
                        <p className="text-xs text-[#64748B] truncate">
                          {o.TenKhachHang}
                        </p>
                      </div>
                      <span className="text-sm font-bold text-[#DC2626] shrink-0">
                        {formatVND(o.TongThanhToan)}
                      </span>
                    </div>
                  ))}
              </div>
            </div>

            <div className="p-4 border-t border-[#E2E8F0] bg-white flex justify-end gap-3">
              <button
                onClick={() => setBatchOpen(false)}
                disabled={submittingBatch}
                className="px-6 py-2.5 rounded-xl font-semibold text-[#64748B] hover:bg-gray-100 disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmBatch}
                disabled={submittingBatch || selected.length === 0}
                className="px-6 py-2.5 bg-[#2563EB] text-white rounded-xl font-bold hover:bg-[#1D4ED8] disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {submittingBatch
                  ? "Đang xử lý..."
                  : `Xác nhận ${selected.length} đơn`}
              </button>
            </div>
          </div>
        </div>
      )}

      <ToastNotification toast={toast} />
    </div>
  );
};

export default QuanLyDonHang;
