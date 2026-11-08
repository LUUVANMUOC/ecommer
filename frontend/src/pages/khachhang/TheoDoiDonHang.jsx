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

const TABS = [
  { id: "ALL", label: "Tất cả" },
  { id: "TTDH01", label: "Chờ xác nhận" },
  { id: "TTDH02", label: "Chờ lấy hàng" },
  { id: "TTDH03", label: "Đang vận chuyển" },
  { id: "TTDH04", label: "Đang giao" },
  { id: "TTDH05", label: "Đã hoàn thành" },
  { id: "TTDH06", label: "Đã hủy" },
];

const TheoDoiDonHang = () => {
  const { user } = useContext(AuthContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("ALL");

  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [selectedShopForReview, setSelectedShopForReview] = useState(null);
  const [reviewData, setReviewData] = useState({});

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast((p) => ({ ...p, show: false })), 3000);
  };

  const fetchOrders = async () => {
    if (!user?.kh_ma) return;
    setLoading(true);
    try {
      const res = await donHangService.getMyOrders(user.kh_ma);
      setOrders(res.data);
    } catch (err) {
      showToast("Lỗi tải danh sách đơn hàng", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [user]);

  const handleXacNhanNhanHang = async (dts_ma) => {
    if (!window.confirm("Bạn xác nhận đã nhận được hàng đầy đủ và nguyên vẹn?"))
      return;
    try {
      await donHangService.xacNhanDaNhanHang(dts_ma);
      showToast("Cảm ơn bạn đã xác nhận!");
      fetchOrders();
    } catch (error) {
      showToast(error.response?.data?.message || "Lỗi xác nhận", "error");
    }
  };

  const parseImages = (danhGia) => {
    if (!danhGia || !danhGia.dgsp_hinhanh) return [];
    try {
      const parsed = JSON.parse(danhGia.dgsp_hinhanh);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  };

  const openReviewModal = (shop) => {
    setSelectedShopForReview(shop);
    const initialData = {};
    shop.items.forEach((item) => {
      initialData[item.Ctsp_Ma] = {
        sao: item.DanhGia ? item.DanhGia.dgsp_sao : 5,
        mota: item.DanhGia ? item.DanhGia.dgsp_mota : "",
        files: [],
        existingImages: parseImages(item.DanhGia),
      };
    });
    setReviewData(initialData);
    setIsReviewModalOpen(true);
  };

  const handleReviewChange = (ctsp_ma, field, value) => {
    setReviewData((prev) => ({
      ...prev,
      [ctsp_ma]: { ...prev[ctsp_ma], [field]: value },
    }));
  };

  const submitReview = async () => {
    try {
      for (const item of selectedShopForReview.items) {
        const data = reviewData[item.Ctsp_Ma];
        const fd = new FormData();
        fd.append("dts_ma", selectedShopForReview.DTS_Ma);
        fd.append("kh_ma", user.kh_ma);
        fd.append("ctsp_ma", item.Ctsp_Ma);
        fd.append("sao", data.sao);
        fd.append("mota", data.mota);

        if (data.files && data.files.length > 0) {
          for (let i = 0; i < data.files.length; i++) {
            fd.append("hinhanh", data.files[i]);
          }
        }
        await donHangService.guiDanhGia(fd);
      }
      showToast("Gửi đánh giá thành công!");
      setIsReviewModalOpen(false);
      fetchOrders();
    } catch (error) {
      showToast("Lỗi gửi đánh giá", "error");
    }
  };

  const renderTimeline = (currentStatus) => {
    if (currentStatus === "TTDH06")
      return (
        <div className="flex items-center gap-2 text-red-600 font-bold bg-red-50 p-3 rounded-lg border border-red-200">
          <span className="material-symbols-outlined">cancel</span> Đơn hàng đã
          bị hủy
        </div>
      );

    const currentIndex = ORDER_STEPS.findIndex(
      (step) => step.id === currentStatus,
    );
    const activeIndex = currentIndex === -1 ? 0 : currentIndex;

    return (
      <div className="relative py-6 px-2 w-full">
        <div className="absolute top-[44px] left-[10%] right-[10%] h-[3px] bg-gray-200 z-0 rounded-full"></div>
        <div
          className="absolute top-[44px] left-[10%] h-[3px] bg-[#2563EB] z-0 transition-all duration-500 rounded-full"
          style={{ width: `${(activeIndex / (ORDER_STEPS.length - 1)) * 80}%` }}
        ></div>
        <div className="relative z-10 flex justify-between w-full">
          {ORDER_STEPS.map((step, index) => {
            const isCompleted = index <= activeIndex;
            const isCurrent = index === activeIndex;
            return (
              <div
                key={step.id}
                className="flex flex-col items-center w-16 sm:w-24"
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${isCompleted ? "!bg-[#2563EB] !border-[#2563EB]" : "!bg-white !border-gray-300"} ${isCurrent ? "ring-4 ring-blue-200 scale-110 shadow-lg" : ""}`}
                >
                  <span
                    className={`material-symbols-outlined text-[20px] ${isCompleted ? "!text-white" : "!text-gray-400"}`}
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    {step.icon}
                  </span>
                </div>
                <span
                  className={`text-[11px] sm:text-xs mt-3 text-center leading-tight ${isCompleted ? "text-[#2563EB] font-bold" : "text-gray-400 font-semibold"}`}
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

  const filteredOrders = orders
    .map((order) => {
      if (activeTab === "ALL") return order;
      const filteredShops = order.shops.filter(
        (shop) => shop.TrangThaiHienTai === activeTab,
      );
      if (filteredShops.length > 0) return { ...order, shops: filteredShops };
      return null;
    })
    .filter((order) => order !== null);

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
        <div className="flex overflow-x-auto whitespace-nowrap border-b border-gray-200 bg-white rounded-t-2xl shadow-sm px-4">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-4 text-sm font-bold border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-[#2563EB] text-[#2563EB]"
                  : "border-transparent text-gray-500 hover:text-[#2563EB]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {filteredOrders.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-b-3xl border border-t-0 border-[#E2E8F0] shadow-sm">
            <span className="material-symbols-outlined text-6xl text-gray-300 mb-4">
              receipt_long
            </span>
            <p className="text-lg font-bold text-gray-700">
              Không có đơn hàng nào ở trạng thái này.
            </p>
            <Link
              to="/"
              className="mt-4 inline-block px-6 py-2 bg-[#2563EB] text-white rounded-xl font-bold"
            >
              Tiếp tục mua sắm
            </Link>
          </div>
        ) : (
          filteredOrders.map((order) => (
            <div
              key={order.DM_Ma}
              className="bg-white rounded-2xl shadow-sm border border-[#E2E8F0] overflow-hidden"
            >
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

              <div className="px-6 py-3 bg-white border-b border-[#E2E8F0] text-sm text-[#64748B] flex items-start gap-2">
                <span className="material-symbols-outlined text-[#2563EB] text-[18px]">
                  location_on
                </span>
                <span>Giao đến: {order.DiaChiNhan}</span>
              </div>

              <div className="divide-y divide-[#E2E8F0]">
                {order.shops.map((shop) => (
                  <div key={shop.DTS_Ma} className="p-6">
                    {/* Header Shop + Nút Đánh giá */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[#2563EB]">
                          storefront
                        </span>
                        <span className="font-bold text-[#0F172A]">
                          {shop.TenShop}
                        </span>
                      </div>

                      {/* NÚT ĐÁNH GIÁ ĐƯỢC ĐƯA LÊN ĐÂY CHO NỔI BẬT */}
                      {shop.TrangThaiHienTai === "TTDH05" && (
                        <button
                          onClick={() => openReviewModal(shop)}
                          className="px-5 py-2 bg-orange-500 text-white font-bold text-sm rounded-lg shadow hover:bg-orange-600 transition-colors flex items-center gap-2"
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            star
                          </span>
                          Đánh giá ngay
                        </button>
                      )}
                    </div>

                    {/* Timeline */}
                    <div className="mb-6 bg-gray-50 p-4 rounded-xl border border-gray-100">
                      {renderTimeline(shop.TrangThaiHienTai)}

                      {/* NÚT XÁC NHẬN ĐÃ NHẬN HÀNG */}
                      {shop.TrangThaiHienTai === "TTDH04" && (
                        <div className="flex justify-center mt-4 pt-4 border-t border-gray-200">
                          <button
                            onClick={() => handleXacNhanNhanHang(shop.DTS_Ma)}
                            className="px-6 py-2.5 bg-[#2563EB] text-white font-bold rounded-xl shadow hover:bg-blue-700 transition-colors flex items-center gap-2"
                          >
                            <span className="material-symbols-outlined text-[20px]">
                              check_circle
                            </span>
                            Đã nhận được hàng
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Sản phẩm */}
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
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* MODAL ĐÁNH GIÁ */}
      {isReviewModalOpen && selectedShopForReview && (
        <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl my-8">
            <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white z-10 rounded-t-3xl">
              <h3 className="text-xl font-bold text-[#0F172A]">
                Đánh Giá Sản Phẩm
              </h3>
              <button
                onClick={() => setIsReviewModalOpen(false)}
                className="text-gray-500 hover:text-red-500"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {selectedShopForReview.items.map((item) => (
                <div
                  key={item.Ctsp_Ma}
                  className="border border-gray-200 rounded-xl p-4"
                >
                  <div className="flex gap-4 items-center mb-3">
                    <img
                      src={
                        item.Image
                          ? `${BACKEND_URL}${item.Image}`
                          : "https://placehold.co/100x100"
                      }
                      className="w-12 h-12 rounded object-cover border"
                      alt=""
                    />
                    <div>
                      <p className="font-semibold text-sm text-[#0F172A]">
                        {item.TenSanPham}
                      </p>
                      <p className="text-xs text-gray-500">
                        {item.TenPhanLoai}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-sm font-semibold">Chất lượng:</span>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span
                        key={star}
                        onClick={() =>
                          handleReviewChange(item.Ctsp_Ma, "sao", star)
                        }
                        className={`material-symbols-outlined cursor-pointer text-2xl ${
                          reviewData[item.Ctsp_Ma].sao >= star
                            ? "text-yellow-400"
                            : "text-gray-300"
                        }`}
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        star
                      </span>
                    ))}
                  </div>

                  <textarea
                    rows={2}
                    placeholder="Chia sẻ cảm nhận của bạn về sản phẩm..."
                    value={reviewData[item.Ctsp_Ma].mota}
                    onChange={(e) =>
                      handleReviewChange(item.Ctsp_Ma, "mota", e.target.value)
                    }
                    className="w-full border rounded-xl p-3 text-sm focus:border-[#2563EB] outline-none resize-none mb-3"
                  />

                  <div>
                    <label className="block text-sm font-semibold mb-1">
                      Thêm ảnh (tối đa 5 ảnh)
                    </label>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={(e) =>
                        handleReviewChange(
                          item.Ctsp_Ma,
                          "files",
                          e.target.files,
                        )
                      }
                      className="text-sm file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-gray-100 file:text-gray-600"
                    />
                    {reviewData[item.Ctsp_Ma].existingImages.length > 0 && (
                      <div className="flex gap-2 mt-2">
                        {reviewData[item.Ctsp_Ma].existingImages.map(
                          (img, idx) => (
                            <img
                              key={idx}
                              src={`${BACKEND_URL}${img}`}
                              className="w-12 h-12 object-cover rounded border"
                              alt=""
                            />
                          ),
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 border-t bg-gray-50 flex justify-end gap-3 rounded-b-3xl">
              <button
                onClick={() => setIsReviewModalOpen(false)}
                className="px-6 py-2.5 rounded-xl font-bold text-gray-600 hover:bg-gray-200"
              >
                Hủy
              </button>
              <button
                onClick={submitReview}
                className="px-6 py-2.5 bg-[#2563EB] text-white rounded-xl font-bold hover:bg-blue-700"
              >
                Gửi Đánh Giá
              </button>
            </div>
          </div>
        </div>
      )}

      <ToastNotification toast={toast} />
    </div>
  );
};

export default TheoDoiDonHang;
