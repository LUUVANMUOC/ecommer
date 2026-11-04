import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../../contexts/AuthContext";
import giaoHangService from "../../services/shipper/giaoHangService";
import ToastNotification from "../../components/common/Crud/ToastNotification";
import DateGroupedList from "../../components/common/DateGroupedList";
import { formatVND } from "../../components/shop/SanPhamShared";
import { toAssetUrl } from "../../utils/accountUtils";

const GiaoHang = () => {
  const { user } = useContext(AuthContext);
  const shipper_ma = user?.shipper_ma;

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
  const showToast = (m, t = "success") => {
    setToast({ show: true, message: m, type: t });
    setTimeout(() => setToast((p) => ({ ...p, show: false })), 3000);
  };

  const fetchData = async () => {
    if (!shipper_ma) return;
    setLoading(true);
    try {
      if (activeTab === "processing") {
        const res = await giaoHangService.getDonCanGiao(shipper_ma);
        setOrders(res.data);
      } else {
        const res = await giaoHangService.getLichSu(shipper_ma);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!modalPhoto) return showToast("Vui lòng chọn ảnh giao hàng!", "error");

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("hinhanh", modalPhoto);
      if (modalNote) fd.append("ghichu", modalNote);

      await giaoHangService.giaoHang(selectedOrder.DTS_Ma, shipper_ma, fd);
      showToast("Giao hàng thành công!");
      setSelectedOrder(null);
      setModalPhoto(null);
      setModalNote("");
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.message || "Lỗi giao hàng", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 bg-[#F8FAFC] min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#0F172A]">Quản Lý Giao Hàng</h1>
        <p className="text-sm text-[#64748B] mt-1">
          Đơn hàng giao đến tay khách hàng
        </p>
      </div>

      {/* TABS */}
      <div className="flex border-b border-gray-200 mb-6 bg-white rounded-xl shadow-sm overflow-hidden">
        <button
          onClick={() => setActiveTab("processing")}
          className={`flex-1 py-3 text-center font-bold text-sm transition-colors ${
            activeTab === "processing"
              ? "bg-blue-50 text-blue-700 border-b-2 border-[#2563eb]"
              : "text-gray-500 hover:bg-gray-50"
          }`}
        >
          Đơn cần giao
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`flex-1 py-3 text-center font-bold text-sm transition-colors ${
            activeTab === "history"
              ? "bg-blue-50 text-blue-700 border-b-2 border-[#2563eb]"
              : "text-gray-500 hover:bg-gray-50"
          }`}
        >
          Lịch sử đã giao
        </button>
      </div>

      {loading ? (
        <div className="p-10 text-center font-medium text-gray-500">
          Đang tải...
        </div>
      ) : activeTab === "processing" ? (
        /* --- TAB ĐƠN CẦN GIAO --- */
        orders.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-[#E2E8F0]">
            <span className="material-symbols-outlined text-6xl text-gray-300 mb-4">
              delivery_dining
            </span>
            <p className="text-lg font-bold text-gray-700">
              Không có đơn nào cần giao.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {orders.map((o) => (
              <div
                key={o.DTS_Ma}
                className="bg-white rounded-2xl shadow-sm border border-[#E2E8F0] p-5 flex flex-col"
              >
                <div className="flex justify-between items-center mb-3 border-b pb-2">
                  <span className="font-bold text-[#2563eb]">{o.DTS_Ma}</span>
                  <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded font-bold">
                    Chờ giao
                  </span>
                </div>
                <div className="space-y-2 text-sm flex-1">
                  <p>
                    <b className="text-[#334155]">Khách:</b> {o.TenKhach} -{" "}
                    {o.SdtKhach}
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
                  {o.GhiChuKhach && (
                    <p className="text-orange-500 italic text-xs">
                      Ghi chú: {o.GhiChuKhach}
                    </p>
                  )}
                </div>
                <div className="mt-4 pt-4 border-t border-[#F1F5F9]">
                  <button
                    onClick={() => setSelectedOrder(o)}
                    className="w-full py-2.5 bg-[#2563eb] text-white rounded-xl font-bold hover:bg-blue-700 flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      check_circle
                    </span>{" "}
                    Giao Thành Công
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
                  <div className="w-14 h-14 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                    <span className="material-symbols-outlined">image</span>
                  </div>
                )}
                <div>
                  <p className="font-bold text-[#0F172A]">Đơn: {item.DTS_Ma}</p>
                  <p className="text-sm text-gray-500">Khách: {item.TenShop}</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                  Đã giao
                </span>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(item.ThoiGian).toLocaleTimeString("vi-VN")}
                </p>
              </div>
            </div>
          )}
        />
      )}

      {/* MODAL XÁC NHẬN GIAO HÀNG (Giữ nguyên) */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-xl">
            <div className="p-6 border-b border-[#E2E8F0] flex justify-between items-center">
              <h3 className="text-xl font-bold text-[#0F172A]">
                Xác Nhận Giao Hàng
              </h3>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-gray-400 hover:text-red-500"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1">
                  Ảnh minh chứng <span className="text-red-500">*</span>
                </label>
                <input
                  type="file"
                  accept="image/*"
                  required
                  onChange={(e) => setModalPhoto(e.target.files[0])}
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-blue-50 file:text-[#2563eb] file:font-semibold"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">
                  Ghi chú
                </label>
                <textarea
                  rows={3}
                  value={modalNote}
                  onChange={(e) => setModalNote(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E2E8F0] outline-none focus:border-[#2563eb] resize-none"
                  placeholder="VD: Khách đã nhận hàng..."
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="px-6 py-2.5 rounded-xl font-semibold text-[#64748B] hover:bg-gray-100"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-8 py-2.5 bg-[#2563eb] text-white rounded-xl font-bold hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {submitting ? "Đang xử lý..." : "Xác Nhận"}
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

export default GiaoHang;
