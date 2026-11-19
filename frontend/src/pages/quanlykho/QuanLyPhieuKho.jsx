import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../../contexts/AuthContext";
import phieuKhoService from "../../services/quanlykho/phieuKhoService";
import { formatVND } from "../../components/shop/SanPhamShared";
import { toAssetUrl } from "../../utils/accountUtils";
import ToastNotification from "../../components/common/Crud/ToastNotification";

const moTaShipper = (ten, vaiTro) => {
  if (!ten) return "—";
  return vaiTro ? `${ten} (${vaiTro})` : ten;
};

// Khối mô tả nguồn → đích của phiếu nhập/xuất
const HuongDiBlock = ({ o }) => {
  const isNhap = o.Loai === "NHAP";
  return (
    <div className="mb-3 rounded-xl border border-indigo-100 bg-indigo-50/60 p-3 text-xs text-indigo-900">
      <p className="flex items-start gap-1.5">
        <span className="material-symbols-outlined text-[16px] shrink-0">
          {isNhap ? "move_to_inbox" : "outbox"}
        </span>
        <span className="min-w-0">
          {isNhap ? (
            <>
              <b>Nhập từ:</b> {moTaShipper(o.Nguon_Shipper, o.Shipper_VaiTro)}
              {o.Nguon_ViTri && (
                <span className="block text-indigo-700/80 truncate">
                  Vị trí: {o.Nguon_ViTri}
                </span>
              )}
              <span className="block mt-0.5">
                <b>Vào kho:</b> {o.Dich_ViTri || o.Kho_Ten || "—"}
              </span>
            </>
          ) : (
            <>
              <b>Xuất cho:</b> {moTaShipper(o.Dich_Shipper, o.Shipper_VaiTro)}
              {o.Dich_ViTri && (
                <span className="block text-indigo-700/80 truncate">
                  Đi tới: {o.Dich_ViTri}
                </span>
              )}
              <span className="block mt-0.5">
                <b>Từ kho:</b> {o.Nguon_ViTri || o.Kho_Ten || "—"}
              </span>
            </>
          )}
        </span>
      </p>
    </div>
  );
};

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

  // ── Xác nhận hàng loạt ────────────────────────────────────────
  const [selected, setSelected] = useState([]);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkPhoto, setBulkPhoto] = useState(null);
  const [bulkPhotoPreview, setBulkPhotoPreview] = useState(null);
  const [bulkGhichu, setBulkGhichu] = useState("");
  const [bulkSubmitting, setBulkSubmitting] = useState(false);

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

  // Đổi tab thì bỏ lựa chọn cũ (không trộn phiếu nhập và phiếu xuất)
  useEffect(() => {
    setSelected([]);
  }, [activeTab]);

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

  // ── Chọn nhiều phiếu ─────────────────────────────────────────
  const toggleOne = (pk_ma) => {
    setSelected((prev) =>
      prev.includes(pk_ma) ? prev.filter((ma) => ma !== pk_ma) : [...prev, pk_ma]
    );
  };

  const toggleAll = () => {
    setSelected((prev) =>
      prev.length === orders.length ? [] : orders.map((o) => o.PK_Ma)
    );
  };

  const handleOpenBulk = () => {
    if (selected.length === 0)
      return showToast("Vui lòng chọn ít nhất 1 phiếu!", "error");
    setBulkPhoto(null);
    setBulkPhotoPreview(null);
    setBulkGhichu("");
    setBulkOpen(true);
  };

  const handleCloseBulk = () => {
    if (bulkSubmitting) return;
    setBulkOpen(false);
    setBulkPhoto(null);
    setBulkPhotoPreview(null);
    setBulkGhichu("");
  };

  const handleBulkPhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBulkPhoto(file);
    setBulkPhotoPreview(URL.createObjectURL(file));
  };

  const handleBulkSubmit = async (e) => {
    e.preventDefault();
    if (!bulkPhoto) return showToast("Vui lòng chọn ảnh minh chứng!", "error");

    setBulkSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("hinhanh", bulkPhoto);
      fd.append("kho_ma", kho_ma);
      fd.append("danh_sach", JSON.stringify(selected));
      if (bulkGhichu) fd.append("ghichu", bulkGhichu);

      const res =
        activeTab === "NHAP"
          ? await phieuKhoService.xacNhanNhapBatch(fd)
          : await phieuKhoService.xacNhanXuatBatch(fd);

      const { tongSo, thanhCong } = res.data;
      const tenLoai = activeTab === "NHAP" ? "nhập" : "xuất";

      if (thanhCong === tongSo) {
        showToast(`Đã xác nhận ${thanhCong}/${tongSo} phiếu ${tenLoai} kho!`);
      } else {
        const loi = (res.data.ketQua || []).filter((r) => !r.ok);
        const chiTiet = loi
          .slice(0, 3)
          .map((r) => `${r.pk_ma} (${r.ly_do})`)
          .join(", ");
        showToast(
          `Đã xác nhận ${thanhCong}/${tongSo} phiếu. Bỏ qua: ${chiTiet}${loi.length > 3 ? "..." : ""}`,
          "error"
        );
      }

      setBulkOpen(false);
      setSelected([]);
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.message || "Lỗi xác nhận hàng loạt", "error");
    } finally {
      setBulkSubmitting(false);
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
        <>
          {/* Thanh công cụ xác nhận hàng loạt */}
          <div className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl border border-[#E2E8F0] bg-white px-4 py-3 shadow-sm">
            <label className="flex items-center gap-2 text-sm font-semibold text-[#334155] cursor-pointer select-none">
              <input
                type="checkbox"
                className="w-4 h-4 cursor-pointer"
                checked={orders.length > 0 && selected.length === orders.length}
                onChange={toggleAll}
                disabled={bulkSubmitting}
              />
              Chọn tất cả ({orders.length})
            </label>

            <span className="text-sm text-[#64748B]">
              Đã chọn: <b className="text-indigo-600">{selected.length}</b>
            </span>

            <div className="ml-auto flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleOpenBulk}
                disabled={bulkSubmitting || selected.length === 0}
                className={`px-4 py-2 text-white text-sm font-bold rounded-lg disabled:bg-gray-400 disabled:cursor-not-allowed whitespace-nowrap ${
                  activeTab === "NHAP"
                    ? "bg-indigo-600 hover:bg-indigo-700"
                    : "bg-orange-600 hover:bg-orange-700"
                }`}
              >
                <span className="material-symbols-outlined text-[18px] align-middle mr-1">
                  {activeTab === "NHAP" ? "move_to_inbox" : "outbox"}
                </span>
                Xác nhận {activeTab === "NHAP" ? "nhập" : "xuất"}{" "}
                {selected.length} phiếu
              </button>

              {selected.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelected([])}
                  disabled={bulkSubmitting}
                  className="px-3 py-2 text-sm font-semibold text-[#64748B] hover:text-[#0F172A]"
                >
                  Bỏ chọn
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {orders.map((o) => {
              const isChecked = selected.includes(o.PK_Ma);
              return (
                <div
                  key={o.PK_Ma}
                  className={`bg-white rounded-2xl shadow-sm border-t-4 p-5 flex flex-col ${
                    activeTab === "NHAP"
                      ? "border-t-indigo-500"
                      : "border-t-orange-500"
                  } border-l border-r border-b border-[#E2E8F0] ${
                    isChecked ? "ring-2 ring-indigo-300" : ""
                  }`}
                >
                  <div className="flex justify-between items-center mb-3 border-b pb-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleOne(o.PK_Ma)}
                        disabled={bulkSubmitting}
                        className="w-4 h-4 cursor-pointer"
                      />
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
                      {o.Shipper_VaiTro && (
                        <p className="text-xs text-indigo-600 font-semibold">
                          {o.Shipper_VaiTro}
                        </p>
                      )}
                    </div>
                  </div>

                  <HuongDiBlock o={o} />

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
                      disabled={bulkSubmitting}
                      className={`w-full py-2.5 text-white rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-1 disabled:bg-gray-400 ${
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
              );
            })}
          </div>
        </>
      )}

      {/* MODAL XÁC NHẬN TỪNG PHIẾU */}
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

      {/* MODAL XÁC NHẬN HÀNG LOẠT */}
      {bulkOpen && (
        <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-[#E2E8F0] flex justify-between items-center sticky top-0 bg-white z-10">
              <div>
                <h3 className="text-xl font-bold text-[#0F172A]">
                  Xác Nhận {activeTab === "NHAP" ? "Nhập" : "Xuất"} Kho Hàng Loạt
                </h3>
                <p className="text-sm text-gray-500 mt-0.5">
                  Gồm <b className="text-indigo-600">{selected.length}</b> phiếu
                </p>
              </div>
              <button
                onClick={handleCloseBulk}
                disabled={bulkSubmitting}
                className="text-gray-400 hover:text-red-500 disabled:opacity-50"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleBulkSubmit} className="p-6 space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-800 flex gap-2">
                <span className="material-symbols-outlined text-[20px] shrink-0">
                  info
                </span>
                <p>
                  Hành động này xác nhận hàng hóa thực tế đã{" "}
                  {activeTab === "NHAP" ? "vào" : "ra"} khỏi kho cho{" "}
                  <b>tất cả {selected.length} phiếu</b> bên dưới. Một ảnh minh
                  chứng sẽ được dùng chung cho cả lô.
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">
                  Danh sách phiếu ({selected.length})
                </label>
                <div className="max-h-32 overflow-y-auto rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-2 space-y-1">
                  {selected.map((pk) => {
                    const don = orders.find((o) => o.PK_Ma === pk);
                    return (
                      <p
                        key={pk}
                        className="text-xs text-[#334155] px-2 py-1 bg-white rounded border border-[#F1F5F9]"
                      >
                        <span className="font-mono font-bold">{pk}</span>
                        {don && (
                          <span className="text-gray-500">
                            {" "}
                            — {don.Loai === "NHAP" ? "Nhập từ" : "Xuất cho"}{" "}
                            {don.Loai === "NHAP"
                              ? don.Nguon_Shipper || "—"
                              : don.Dich_Shipper || "—"}
                            {don.Loai === "NHAP"
                              ? ` · ${don.Nguon_ViTri || "?"} → ${don.Dich_ViTri || don.Kho_Ten || "kho"}`
                              : ` · ${don.Nguon_ViTri || don.Kho_Ten || "kho"} → ${don.Dich_ViTri || "?"}`}
                          </span>
                        )}
                      </p>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">
                  Ảnh minh chứng chung <span className="text-red-500">*</span>
                </label>
                <input
                  type="file"
                  accept="image/*"
                  required
                  onChange={handleBulkPhotoChange}
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-indigo-50 file:text-indigo-600 file:font-semibold"
                />
                {bulkPhotoPreview && (
                  <img
                    src={bulkPhotoPreview}
                    alt="Preview"
                    className="mt-3 w-full h-40 object-cover rounded-xl border border-[#E2E8F0]"
                  />
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">
                  Ghi chú chung (không bắt buộc)
                </label>
                <textarea
                  rows={2}
                  value={bulkGhichu}
                  onChange={(e) => setBulkGhichu(e.target.value)}
                  placeholder="VD: Lô hàng đủ kiện, nguyên vẹn..."
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E2E8F0] outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={handleCloseBulk}
                  disabled={bulkSubmitting}
                  className="px-6 py-2.5 rounded-xl font-semibold text-[#64748B] hover:bg-gray-100 disabled:opacity-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={bulkSubmitting}
                  className={`px-8 py-2.5 text-white rounded-xl font-bold disabled:bg-gray-400 ${
                    activeTab === "NHAP"
                      ? "bg-indigo-600 hover:bg-indigo-700"
                      : "bg-orange-600 hover:bg-orange-700"
                  }`}
                >
                  {bulkSubmitting
                    ? "Đang xử lý..."
                    : `Xác nhận ${selected.length} phiếu`}
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
