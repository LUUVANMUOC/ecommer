import { useState, useEffect, useContext, useMemo } from "react";
import { AuthContext } from "../../contexts/AuthContext";
import shipperTrungChuyenService from "../../services/shipper/trungChuyenService";
import ToastNotification from "../../components/common/Crud/ToastNotification";
import DateGroupedList from "../../components/common/DateGroupedList";
import { formatVND } from "../../components/shop/SanPhamShared";
import { toAssetUrl } from "../../utils/accountUtils";
import LoTrinhVanChuyen, {
  diemKhoTuDuLieu,
} from "../../components/common/LoTrinhVanChuyen";

const formatThoiGian = (value) => {
  if (!value) return "—";
  return new Date(value).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const TrungChuyen = () => {
  const { user } = useContext(AuthContext);
  const shipper_ma = user?.shipper_ma;

  const [activeTab, setActiveTab] = useState("processing");
  const [orders, setOrders] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Nhóm theo kho đích để giao nhanh cả lô
  const [khoDangChon, setKhoDangChon] = useState("");
  const [selected, setSelected] = useState([]);

  // Modal giao tới kho
  const [bulkOpen, setBulkOpen] = useState(false);
  const [modalPhoto, setModalPhoto] = useState(null);
  const [modalPreview, setModalPreview] = useState(null);
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
        const res =
          await shipperTrungChuyenService.getDonDangTrungChuyen(shipper_ma);
        setOrders(res.data);
        setSelected([]);
      } else {
        const res = await shipperTrungChuyenService.getLichSu(shipper_ma);
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

  // Gom đơn theo kho đích
  const nhomKho = useMemo(() => {
    const map = new Map();
    for (const o of orders) {
      const ma = o.Kho_Den_Ma || "KHONG_RO";
      if (!map.has(ma)) {
        map.set(ma, {
          ma,
          ten: o.Kho_Den_Ten || "Không rõ kho",
          orders: [],
        });
      }
      map.get(ma).orders.push(o);
    }
    return [...map.values()];
  }, [orders]);

  useEffect(() => {
    if (nhomKho.length === 0) {
      if (khoDangChon) setKhoDangChon("");
      return;
    }
    if (!nhomKho.some((g) => g.ma === khoDangChon)) {
      setKhoDangChon(nhomKho[0].ma);
      setSelected([]);
    }
  }, [nhomKho, khoDangChon]);

  const donDangHien =
    nhomKho.find((g) => g.ma === khoDangChon)?.orders || [];
  const tenKhoDangChon =
    nhomKho.find((g) => g.ma === khoDangChon)?.ten || "kho đích";

  const toggleOne = (dts_ma) => {
    setSelected((prev) =>
      prev.includes(dts_ma)
        ? prev.filter((ma) => ma !== dts_ma)
        : [...prev, dts_ma],
    );
  };

  const toggleAll = () => {
    const tatCa = donDangHien.map((o) => o.DTS_Ma);
    setSelected((prev) =>
      prev.length === tatCa.length && tatCa.every((ma) => prev.includes(ma))
        ? []
        : tatCa,
    );
  };

  const resetModal = () => {
    setBulkOpen(false);
    setModalPhoto(null);
    setModalPreview(null);
    setModalNote("");
  };

  const moModal = (ds) => {
    if (!Array.isArray(ds) || ds.length === 0) {
      showToast("Vui lòng chọn ít nhất 1 đơn hàng!", "error");
      return;
    }
    setSelected(ds);
    setModalPhoto(null);
    setModalPreview(null);
    setModalNote("");
    setBulkOpen(true);
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setModalPhoto(file);
    setModalPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!modalPhoto) return showToast("Vui lòng chọn ảnh minh chứng!", "error");
    if (selected.length === 0)
      return showToast("Vui lòng chọn ít nhất 1 đơn hàng!", "error");

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("hinhanh", modalPhoto);
      fd.append("danh_sach", JSON.stringify(selected));
      if (modalNote) fd.append("ghichu", modalNote);

      const res = await shipperTrungChuyenService.giaoHangToiKhoBatch(
        shipper_ma,
        fd,
      );
      const { tongSo, thanhCong, ketQua } = res.data || {};

      if (thanhCong === tongSo) {
        showToast(
          `Đã giao ${thanhCong}/${tongSo} đơn về kho ${tenKhoDangChon}!`,
        );
      } else {
        const loi = (ketQua || []).filter((r) => !r.ok);
        const chiTiet = loi
          .slice(0, 3)
          .map((r) => `${r.dts_ma} (${r.ly_do})`)
          .join(", ");
        showToast(
          `Đã giao ${thanhCong}/${tongSo} đơn. Bỏ qua: ${chiTiet}${loi.length > 3 ? "..." : ""}`,
          "error",
        );
      }

      resetModal();
      setSelected([]);
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
        <h1 className="text-2xl font-bold text-[#0F172A]">
          Quản Lý Trung Chuyển
        </h1>
        <p className="text-sm text-[#64748B] mt-1">
          Đơn hàng vận chuyển giữa các kho — gom theo kho đích để giao nhanh
        </p>
      </div>

      {/* TABS */}
      <div className="flex border-b border-gray-200 mb-6 bg-white rounded-xl shadow-sm overflow-hidden">
        <button
          onClick={() => setActiveTab("processing")}
          className={`flex-1 py-3 text-center font-bold text-sm transition-colors ${
            activeTab === "processing"
              ? "bg-orange-50 text-orange-700 border-b-2 border-orange-600"
              : "text-gray-500 hover:bg-gray-50"
          }`}
        >
          Đang vận chuyển
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`flex-1 py-3 text-center font-bold text-sm transition-colors ${
            activeTab === "history"
              ? "bg-orange-50 text-orange-700 border-b-2 border-orange-600"
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
        /* --- TAB ĐANG VẬN CHUYỂN --- */
        orders.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-[#E2E8F0]">
            <span className="material-symbols-outlined text-6xl text-gray-300 mb-4">
              local_shipping
            </span>
            <p className="text-lg font-bold text-gray-700">
              Không có đơn nào đang đi đường.
            </p>
          </div>
        ) : (
          <>
            {/* Chip chọn kho đích */}
            <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
              {nhomKho.map((g) => {
                const active = g.ma === khoDangChon;
                return (
                  <button
                    key={g.ma}
                    type="button"
                    onClick={() => {
                      setKhoDangChon(g.ma);
                      setSelected([]);
                    }}
                    className={`shrink-0 rounded-xl border px-4 py-2 text-sm font-bold transition-colors ${
                      active
                        ? "border-orange-600 bg-orange-600 text-white shadow-sm"
                        : "border-[#E2E8F0] bg-white text-[#334155] hover:border-orange-300"
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px] align-middle mr-1">
                      warehouse
                    </span>
                    {g.ten}
                    <span
                      className={`ml-2 rounded-full px-2 py-0.5 text-xs ${
                        active ? "bg-white/20" : "bg-orange-50 text-orange-700"
                      }`}
                    >
                      {g.orders.length}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Thanh công cụ giao nhanh */}
            <div className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl border border-[#E2E8F0] bg-white px-4 py-3 shadow-sm">
              <label className="flex items-center gap-2 text-sm font-semibold text-[#334155] cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="w-4 h-4 cursor-pointer"
                  checked={
                    donDangHien.length > 0 &&
                    selected.length === donDangHien.length
                  }
                  onChange={toggleAll}
                  disabled={submitting}
                />
                Chọn tất cả kho này ({donDangHien.length})
              </label>

              <span className="text-sm text-[#64748B]">
                Đã chọn: <b className="text-orange-600">{selected.length}</b>
              </span>

              <div className="ml-auto flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => moModal(selected)}
                  disabled={submitting || selected.length === 0}
                  className="px-4 py-2 bg-orange-600 text-white text-sm font-bold rounded-lg hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  <span className="material-symbols-outlined text-[18px] align-middle mr-1">
                    local_shipping
                  </span>
                  Giao {selected.length > 0 ? selected.length : ""} đơn về kho
                </button>

                {selected.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelected([])}
                    disabled={submitting}
                    className="px-3 py-2 text-sm font-semibold text-[#64748B] hover:text-[#0F172A]"
                  >
                    Bỏ chọn
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {donDangHien.map((o) => {
                const isChecked = selected.includes(o.DTS_Ma);
                return (
                  <div
                    key={o.DTS_Ma}
                    className={`bg-white rounded-2xl shadow-sm border p-5 flex flex-col ${
                      isChecked
                        ? "border-orange-300 ring-2 ring-orange-200"
                        : "border-[#E2E8F0]"
                    }`}
                  >
                    <div className="flex justify-between items-center mb-3 border-b pb-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleOne(o.DTS_Ma)}
                          disabled={submitting}
                          className="w-4 h-4 cursor-pointer"
                        />
                        <span className="font-bold text-orange-600">
                          {o.DTS_Ma}
                        </span>
                      </div>
                      <span className="text-xs bg-orange-50 text-orange-600 px-2 py-1 rounded font-bold">
                        Chờ giao kho
                      </span>
                    </div>

                    <div className="space-y-2 text-sm flex-1">
                      <LoTrinhVanChuyen
                        nhan="Chặng trung chuyển (LSP02)"
                        tu={diemKhoTuDuLieu(o, "Kho_Di_")}
                        den={diemKhoTuDuLieu(o, "Kho_Den_")}
                      />
                      <p className="text-xs text-orange-700">
                        Gửi lúc: {formatThoiGian(o.ThoiDiemGui)}
                      </p>

                      <p>
                        <b className="text-[#334155]">Shop:</b> {o.TenShop}
                      </p>
                      <p className="text-[#64748B]">
                        <b>Khách:</b> {o.TenKhach} - {o.SdtKhach}
                      </p>
                      <p className="text-[#64748B]">
                        <b>Địa chỉ giao cuối:</b> {o.DiaChiGiao}
                      </p>
                      <p className="text-[#64748B]">
                        <b>Tổng tiền:</b>{" "}
                        <span className="text-[#DC2626] font-bold">
                          {formatVND(o.TongTien)}
                        </span>
                      </p>
                    </div>

                    <div className="mt-4 pt-4 border-t border-[#F1F5F9]">
                      <button
                        onClick={() => moModal([o.DTS_Ma])}
                        disabled={submitting}
                        className="w-full py-2.5 bg-orange-600 text-white rounded-xl font-bold hover:bg-orange-700 disabled:bg-gray-400 flex items-center justify-center gap-2"
                      >
                        <span className="material-symbols-outlined text-[20px]">
                          check_circle
                        </span>
                        Giao Tới Kho
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )
      ) : (
        /* --- TAB LỊCH SỬ --- */
        <DateGroupedList
          items={history}
          dateField="ThoiGian"
          renderItem={(item) => (
            <div
              key={item.DTS_Ma}
              className="flex items-center justify-between gap-4 p-4 bg-white border border-gray-100 rounded-lg hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-4 min-w-0">
                {item.HinhAnh ? (
                  <img
                    src={toAssetUrl(item.HinhAnh)}
                    alt="Minh chứng"
                    className="w-14 h-14 rounded-lg object-cover border border-gray-200 shrink-0"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600 shrink-0">
                    <span className="material-symbols-outlined">image</span>
                  </div>
                )}
                <div className="min-w-0">
                  <p className="font-bold text-[#0F172A]">Đơn: {item.DTS_Ma}</p>
                  <p className="text-sm text-gray-500 truncate">
                    Shop: {item.TenShop}
                  </p>
                  <LoTrinhVanChuyen
                    className="mt-1.5 max-w-md"
                    compact
                    tu={diemKhoTuDuLieu(item, "Kho_Di_")}
                    den={diemKhoTuDuLieu(item, "Kho_Den_")}
                  />
                  {item.GhiChu && (
                    <p className="text-xs text-gray-400 italic truncate">
                      {item.GhiChu}
                    </p>
                  )}
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded">
                  Đã giao kho
                </span>
                <p className="text-xs text-gray-400 mt-1">
                  {formatThoiGian(item.ThoiGian)}
                </p>
              </div>
            </div>
          )}
        />
      )}

      {/* MODAL GIAO TỚI KHO (1 hoặc nhiều đơn cùng kho đích) */}
      {bulkOpen && (
        <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-[#E2E8F0] flex justify-between items-center sticky top-0 bg-white z-10">
              <div>
                <h3 className="text-xl font-bold text-[#0F172A]">
                  Giao Tới Kho {tenKhoDangChon}
                </h3>
                <p className="text-sm text-gray-500 mt-0.5">
                  Gồm <b className="text-orange-600">{selected.length}</b> đơn,
                  dùng chung 1 ảnh minh chứng
                </p>
              </div>
              <button
                onClick={resetModal}
                disabled={submitting}
                className="text-gray-400 hover:text-red-500 disabled:opacity-50"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 text-sm text-orange-800 flex gap-2">
                <span className="material-symbols-outlined text-[20px] shrink-0">
                  info
                </span>
                <p>
                  Xác nhận bạn đã giao{" "}
                  <b>tất cả {selected.length} đơn</b> cho kho{" "}
                  <b>{tenKhoDangChon}</b>. Thủ kho sẽ kiểm tra và xác nhận nhập
                  kho.
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">
                  Danh sách đơn ({selected.length})
                </label>
                <div className="max-h-36 overflow-y-auto rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-2 space-y-1">
                  {selected.map((dts_ma) => {
                    const don = orders.find((o) => o.DTS_Ma === dts_ma);
                    return (
                      <p
                        key={dts_ma}
                        className="text-xs text-[#334155] px-2 py-1 bg-white rounded border border-[#F1F5F9]"
                      >
                        <span className="font-mono font-bold">{dts_ma}</span>
                        {don && (
                          <span className="text-gray-500">
                            {" "}
                            — {don.Kho_Di_Ten || "?"} → {don.Kho_Den_Ten || "?"}
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
                  onChange={handlePhotoChange}
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-orange-50 file:text-orange-600 file:font-semibold"
                />
                {modalPreview && (
                  <img
                    src={modalPreview}
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
                  rows={2}
                  value={modalNote}
                  onChange={(e) => setModalNote(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E2E8F0] outline-none focus:border-orange-600 resize-none"
                  placeholder="VD: Đã giao đủ 3 kiện cho kho..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={resetModal}
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl font-semibold text-[#64748B] hover:bg-gray-100 disabled:opacity-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-8 py-2.5 bg-orange-600 text-white rounded-xl font-bold hover:bg-orange-700 disabled:bg-gray-400"
                >
                  {submitting
                    ? "Đang xử lý..."
                    : `Xác nhận giao ${selected.length} đơn`}
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

export default TrungChuyen;
