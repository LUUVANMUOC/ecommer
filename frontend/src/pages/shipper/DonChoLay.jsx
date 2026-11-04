import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../../contexts/AuthContext";
import shipperDonHangService from "../../services/shipper/donHangService";
import ToastNotification from "../../components/common/Crud/ToastNotification";
import DateGroupedList from "../../components/common/DateGroupedList";
import { formatVND } from "../../components/shop/SanPhamShared";
import { toAssetUrl } from "../../utils/accountUtils";

const DonChoLay = () => {
  const { user } = useContext(AuthContext);
  const shipper_ma = user?.shipper_ma;

  // State quản lý Tab
  const [activeTab, setActiveTab] = useState("processing");

  const [orders, setOrders] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [modalPhoto, setModalPhoto] = useState(null);
  const [modalNote, setModalNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });
  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast((p) => ({ ...p, show: false })), 3000);
  };

  const fetchData = async () => {
    if (!shipper_ma) return;
    setLoading(true);
    try {
      if (activeTab === "processing") {
        const res = await shipperDonHangService.getChoLay(shipper_ma);
        setOrders(res.data);
      } else {
        // Gọi API lấy lịch sử (Bạn cần đảm bảo service đã có hàm getLichSu)
        const res = await shipperDonHangService.getLichSu(shipper_ma);
        setHistory(res.data);
      }
    } catch (err) {
      showToast("Lỗi tải danh sách đơn", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [shipper_ma, activeTab]);

  const handleOpenModal = (order) => {
    setSelectedOrder(order);
    setModalPhoto(null);
    setModalNote("");
  };

  const handleCloseModal = () => {
    if (submitting) return;
    setSelectedOrder(null);
    setModalPhoto(null);
    setModalNote("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedOrder) return;
    if (!modalPhoto) {
      return showToast("Vui lòng chọn ảnh minh chứng!", "error");
    }

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("hinhanh", modalPhoto);
      if (modalNote) fd.append("ghichu", modalNote);

      await shipperDonHangService.layHang(selectedOrder.DTS_Ma, shipper_ma, fd);
      showToast("Lấy hàng thành công!");
      setSelectedOrder(null);
      setModalPhoto(null);
      setModalNote("");
      fetchData(); // Load lại danh sách
    } catch (err) {
      showToast(err.response?.data?.message || "Lỗi lấy hàng", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 bg-[#F8FAFC] min-h-screen">
      {/* HEADER */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#0F172A]">
          Quản Lý Đơn Lấy Hàng
        </h1>
        <p className="text-sm text-[#64748B] mt-1">
          Danh sách đơn bạn được phân công đến shop lấy hàng
        </p>
      </div>

      {/* TABS */}
      <div className="flex border-b border-gray-200 mb-6 bg-white rounded-xl shadow-sm overflow-hidden">
        <button
          onClick={() => setActiveTab("processing")}
          className={`flex-1 py-3 text-center font-bold text-sm transition-colors ${
            activeTab === "processing"
              ? "bg-green-50 text-green-700 border-b-2 border-green-600"
              : "text-gray-500 hover:bg-gray-50"
          }`}
        >
          Đang xử lý (Chờ lấy)
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`flex-1 py-3 text-center font-bold text-sm transition-colors ${
            activeTab === "history"
              ? "bg-green-50 text-green-700 border-b-2 border-green-600"
              : "text-gray-500 hover:bg-gray-50"
          }`}
        >
          Lịch sử đã lấy
        </button>
      </div>

      {/* NỘI DUNG THEO TAB */}
      {loading ? (
        <div className="p-10 text-center font-medium text-gray-500">
          Đang tải dữ liệu...
        </div>
      ) : activeTab === "processing" ? (
        /* --- TAB ĐANG XỬ LÝ --- */
        orders.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-[#E2E8F0]">
            <span className="material-symbols-outlined text-6xl text-gray-300 mb-4">
              inventory
            </span>
            <p className="text-lg font-bold text-gray-700">
              Không có đơn nào cần lấy.
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Vui lòng chờ ĐVVC phân công đơn mới.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {orders.map((o) => (
              <div
                key={o.DTS_Ma}
                className="bg-white rounded-2xl shadow-sm border border-[#E2E8F0] p-5 flex flex-col hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-center mb-3 border-b pb-2">
                  <span className="font-bold text-[#16a34a]">{o.DTS_Ma}</span>
                  <span className="text-xs bg-yellow-50 text-yellow-600 px-2 py-1 rounded font-bold">
                    Chờ lấy
                  </span>
                </div>

                <div className="space-y-2 text-sm flex-1">
                  <p>
                    <b className="text-[#334155]">Shop:</b> {o.TenShop}
                  </p>
                  <p className="text-[#64748B]">
                    <b>Lấy tại:</b> {o.DiaChiLayHang}
                  </p>
                  <p className="text-[#64748B]">
                    <b>Giao đến:</b> {o.DiaChiGiao}
                  </p>
                  <p className="text-[#64748B]">
                    <b>Tổng tiền:</b>{" "}
                    <span className="text-[#DC2626] font-bold">
                      {formatVND(o.TongTien)}
                    </span>
                  </p>

                  {o.items && o.items.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-[#F1F5F9]">
                      <p className="text-xs font-semibold text-gray-500 mb-1.5">
                        Sản phẩm ({o.items.length}):
                      </p>
                      {o.items.slice(0, 3).map((item) => (
                        <p
                          key={item.Ctsp_Ma}
                          className="text-xs text-gray-600 truncate leading-5"
                        >
                          • {item.TenSanPham}
                          {item.TenPhanLoai
                            ? ` (${item.TenPhanLoai})`
                            : ""} × {item.SoLuong}
                        </p>
                      ))}
                      {o.items.length > 3 && (
                        <p className="text-xs text-gray-400 italic mt-1">
                          ... và {o.items.length - 3} sản phẩm khác
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-[#F1F5F9]">
                  <button
                    onClick={() => handleOpenModal(o)}
                    className="w-full py-2.5 bg-[#16a34a] text-white rounded-xl font-bold hover:bg-[#15803d] transition-colors flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      check_circle
                    </span>
                    Đã lấy hàng
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        /* --- TAB LỊCH SỬ --- */
        <DateGroupedList
          items={history}
          dateField="ThoiGian"
          renderItem={(item) => (
            <div
              key={item.DTS_Ma}
              className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-lg hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-4">
                {item.HinhAnh ? (
                  <img
                    src={toAssetUrl(item.HinhAnh)}
                    alt="Minh chứng"
                    className="w-14 h-14 rounded-lg object-cover border border-gray-200"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-lg bg-green-50 flex items-center justify-center text-green-600">
                    <span className="material-symbols-outlined">image</span>
                  </div>
                )}
                <div>
                  <p className="font-bold text-[#0F172A]">Đơn: {item.DTS_Ma}</p>
                  <p className="text-sm text-gray-500">Shop: {item.TenShop}</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded">
                  Đã lấy
                </span>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(item.ThoiGian).toLocaleTimeString("vi-VN")}
                </p>
              </div>
            </div>
          )}
        />
      )}

      {/* MODAL XÁC NHẬN LẤY HÀNG (Giữ nguyên) */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-xl">
            <div className="p-6 border-b border-[#E2E8F0] flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-[#0F172A]">
                  Xác Nhận Lấy Hàng
                </h3>
                <p className="text-sm text-gray-500 mt-0.5">
                  Đơn: {selectedOrder.DTS_Ma}
                </p>
              </div>
              <button
                onClick={handleCloseModal}
                disabled={submitting}
                className="text-gray-400 hover:text-red-500 disabled:opacity-50"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-sm text-yellow-800 flex gap-2">
                <span className="material-symbols-outlined text-[20px] shrink-0">
                  warning
                </span>
                <div>
                  <p className="font-semibold mb-0.5">Lưu ý:</p>
                  <p>
                    Sau khi xác nhận, đơn sẽ chuyển sang trạng thái{" "}
                    <b>"Đang vận chuyển"</b> và <b>không thể hoàn tác</b>.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">
                  Ảnh minh chứng <span className="text-red-500">*</span>
                </label>
                <input
                  type="file"
                  accept="image/*"
                  required
                  onChange={(e) => setModalPhoto(e.target.files[0])}
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-green-50 file:text-[#16a34a] file:font-semibold"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Chụp ảnh kiện hàng tại shop để làm bằng chứng
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">
                  Ghi chú (không bắt buộc)
                </label>
                <textarea
                  rows={3}
                  value={modalNote}
                  onChange={(e) => setModalNote(e.target.value)}
                  placeholder="VD: Hàng đóng gói cẩn thận, 3 kiện..."
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E2E8F0] outline-none focus:border-[#16a34a] resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl font-semibold text-[#64748B] hover:bg-gray-100 disabled:opacity-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-8 py-2.5 bg-[#16a34a] text-white rounded-xl font-bold hover:bg-[#15803d] disabled:bg-gray-400"
                >
                  {submitting ? "Đang xử lý..." : "Xác Nhận Đã Lấy"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ToastNotification toast={toast} />
    </div>
  );
};

export default DonChoLay;
