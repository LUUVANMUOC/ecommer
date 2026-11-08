import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../../contexts/AuthContext";
import phieuKhoService from "../../services/quanlykho/phieuKhoService";
import { formatVND } from "../../components/shop/SanPhamShared";
import { toAssetUrl } from "../../utils/accountUtils";
import ToastNotification from "../../components/common/Crud/ToastNotification";

const QuanLyPhieuKho = () => {
  const { user } = useContext(AuthContext);
  const kho_ma = user?.kho_ma;

  const [activeTab, setActiveTab] = useState("NHAP"); // 'NHAP' | 'XUAT'
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [ghichu, setGhichu] = useState("");
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
    if (!kho_ma) return;
    setLoading(true);
    try {
      const res = await phieuKhoService.getChoXacNhan(kho_ma, activeTab);
      setOrders(res.data);
    } catch (err) {
      showToast("Lỗi tải danh sách phiếu", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [kho_ma, activeTab]);

  const handleOpenModal = (order) => {
    setSelectedOrder(order);
    setPhoto(null);
    setPhotoPreview(null);
    setGhichu("");
  };

  const handleCloseModal = () => {
    if (submitting) return;
    setSelectedOrder(null);
    setPhoto(null);
    setPhotoPreview(null);
    setGhichu("");
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!photo) return showToast("Vui lòng chọn ảnh minh chứng!", "error");

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("hinhanh", photo);
      fd.append("kho_ma", kho_ma);
      if (ghichu) fd.append("ghichu", ghichu);

      if (activeTab === "NHAP") {
        await phieuKhoService.xacNhanNhap(selectedOrder.PK_Ma, fd);
      } else {
        await phieuKhoService.xacNhanXuat(selectedOrder.PK_Ma, fd);
      }

      showToast(`Đã xác nhận ${activeTab === "NHAP" ? "nhập" : "xuất"} kho!`);
      handleCloseModal();
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.message || "Lỗi xác nhận", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 bg-[#F8FAFC] min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#0F172A]">Quản Lý Phiếu Kho</h1>
        <p className="text-sm text-[#64748B] mt-1">
          Xác nhận hàng hóa vào/ra kho thực tế
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6 bg-white rounded-xl shadow-sm overflow-hidden w-full md:w-1/2">
        <button
          onClick={() => setActiveTab("NHAP")}
          className={`flex-1 py-3 text-center font-bold text-sm transition-colors ${
            activeTab === "NHAP"
              ? "bg-indigo-50 text-indigo-700 border-b-2 border-indigo-600"
              : "text-gray-500 hover:bg-gray-50"
          }`}
        >
          Nhập Kho
        </button>
        <button
          onClick={() => setActiveTab("XUAT")}
          className={`flex-1 py-3 text-center font-bold text-sm transition-colors ${
            activeTab === "XUAT"
              ? "bg-indigo-50 text-indigo-700 border-b-2 border-indigo-600"
              : "text-gray-500 hover:bg-gray-50"
          }`}
        >
          Xuất Kho
        </button>
      </div>

      {loading ? (
        <div className="p-10 text-center font-medium text-gray-500">
          Đang tải...
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-[#E2E8F0]">
          <span className="material-symbols-outlined text-6xl text-gray-300 mb-4">
            inventory_2
          </span>
          <p className="text-lg font-bold text-gray-700">
            Không có phiếu {activeTab === "NHAP" ? "nhập" : "xuất"} nào chờ xác
            nhận.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {orders.map((o) => (
            <div
              key={o.PK_Ma}
              className={`bg-white rounded-2xl shadow-sm border-t-4 p-5 flex flex-col ${
                activeTab === "NHAP"
                  ? "border-t-indigo-500"
                  : "border-t-orange-500"
              } border-l border-r border-b border-[#E2E8F0]`}
            >
              <div className="flex justify-between items-center mb-3 border-b pb-2">
                <div>
                  <span
                    className={`font-mono text-sm font-bold ${activeTab === "NHAP" ? "text-indigo-600" : "text-orange-600"}`}
                  >
                    {o.PK_Ma}
                  </span>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Đơn: <b className="text-gray-700">{o.DTS_Ma}</b>
                  </p>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded font-bold ${activeTab === "NHAP" ? "bg-indigo-50 text-indigo-600" : "bg-orange-50 text-orange-600"}`}
                >
                  Chờ {activeTab === "NHAP" ? "nhập" : "xuất"}
                </span>
              </div>

              <div className="flex items-center gap-3 mb-3 pb-3 border-b border-[#F1F5F9]">
                <img
                  src={toAssetUrl(o.Shipper_HinhAnh)}
                  alt=""
                  className="w-10 h-10 rounded-full object-cover border border-[#E2E8F0]"
                  onError={(e) => {
                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(o.Shipper_Ten || "S")}&background=random&color=fff`;
                  }}
                />
                <div className="min-w-0">
                  <p className="font-bold text-sm text-[#0F172A] truncate">
                    {o.Shipper_Ten}
                  </p>
                  <p className="text-xs text-[#64748B]">{o.Shipper_SDT}</p>
                </div>
              </div>

              <div className="space-y-1.5 text-sm flex-1">
                <p>
                  <b className="text-[#334155]">Shop:</b> {o.TenShop}
                </p>
                <p className="text-[#64748B] text-xs">
                  <b>Lấy tại:</b> {o.DiaChiLayHang}
                </p>
                <p className="text-[#64748B] text-xs">
                  <b>Giao đến:</b> {o.DiaChiGiao}
                </p>
                <p className="text-[#64748B]">
                  <b>Tổng tiền:</b>{" "}
                  <span className="text-[#DC2626] font-bold">
                    {formatVND(o.TongTien)}
                  </span>
                </p>

                {o.items?.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-[#F1F5F9]">
                    <p className="text-xs font-semibold text-gray-500 mb-1">
                      Sản phẩm ({o.items.length}):
                    </p>
                    {o.items.slice(0, 3).map((it, idx) => (
                      <p
                        key={idx}
                        className="text-xs text-gray-600 truncate leading-5"
                      >
                        • {it.TenSanPham}{" "}
                        {it.TenPhanLoai ? `(${it.TenPhanLoai})` : ""} ×{" "}
                        {it.SoLuong}
                      </p>
                    ))}
                    {o.items.length > 3 && (
                      <p className="text-xs text-gray-400 italic mt-0.5">
                        ... và {o.items.length - 3} sản phẩm khác
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-[#F1F5F9]">
                <button
                  onClick={() => handleOpenModal(o)}
                  className={`w-full py-2.5 text-white rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-1 ${
                    activeTab === "NHAP"
                      ? "bg-indigo-600 hover:bg-indigo-700"
                      : "bg-orange-600 hover:bg-orange-700"
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {activeTab === "NHAP" ? "move_to_inbox" : "outbox"}
                  </span>
                  Xác nhận {activeTab === "NHAP" ? "Nhập" : "Xuất"} kho
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-[#E2E8F0] flex justify-between items-center sticky top-0 bg-white z-10">
              <div>
                <h3 className="text-xl font-bold text-[#0F172A]">
                  Xác Nhận {activeTab === "NHAP" ? "Nhập" : "Xuất"} Kho
                </h3>
                <p className="text-sm text-gray-500 mt-0.5">
                  Phiếu:{" "}
                  <b
                    className={
                      activeTab === "NHAP"
                        ? "text-indigo-600"
                        : "text-orange-600"
                    }
                  >
                    {selectedOrder.PK_Ma}
                  </b>
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
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-800 flex gap-2">
                <span className="material-symbols-outlined text-[20px] shrink-0">
                  info
                </span>
                <p>
                  Hành động này xác nhận hàng hóa thực tế đã{" "}
                  {activeTab === "NHAP" ? "vào" : "ra"} khỏi kho. Vui lòng chụp
                  ảnh kiện hàng làm bằng chứng.
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">
                  Ảnh minh chứng <span className="text-red-500">*</span>
                </label>
                <input
                  type="file"
                  accept="image/*"
                  required
                  onChange={handlePhotoChange}
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-indigo-50 file:text-indigo-600 file:font-semibold"
                />
                {photoPreview && (
                  <img
                    src={photoPreview}
                    alt="Preview"
                    className="mt-3 w-full h-40 object-cover rounded-xl border border-[#E2E8F0]"
                  />
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">
                  Ghi chú (không bắt buộc)
                </label>
                <textarea
                  rows={3}
                  value={ghichu}
                  onChange={(e) => setGhichu(e.target.value)}
                  placeholder="VD: Đủ số kiện, hàng nguyên vẹn..."
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E2E8F0] outline-none focus:border-indigo-500 resize-none"
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
                  className={`px-8 py-2.5 text-white rounded-xl font-bold disabled:bg-gray-400 ${
                    activeTab === "NHAP"
                      ? "bg-indigo-600 hover:bg-indigo-700"
                      : "bg-orange-600 hover:bg-orange-700"
                  }`}
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

export default QuanLyPhieuKho;
