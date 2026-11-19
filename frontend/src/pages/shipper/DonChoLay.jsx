import { useState, useEffect, useContext, useMemo } from "react";
import { AuthContext } from "../../contexts/AuthContext";
import shipperDonHangService from "../../services/shipper/donHangService";
import ToastNotification from "../../components/common/Crud/ToastNotification";
import DateGroupedList from "../../components/common/DateGroupedList";
import { formatVND } from "../../components/shop/SanPhamShared";
import { toAssetUrl } from "../../utils/accountUtils";

const formatDate = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("vi-VN");
};

const formatDateTime = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString("vi-VN");
};

const telHref = (sdt) => `tel:${String(sdt || "").replace(/\s+/g, "")}`;

const fullPickupAddress = (order) =>
  [order.DiaChiLayHang, order.XaLayHang, order.TinhLayHang]
    .filter(Boolean)
    .join(", ");

const InfoRow = ({ icon, label, children, strong = false }) => (
  <div className="flex items-start gap-2.5 py-1.5">
    <span className="material-symbols-outlined mt-0.5 text-[18px] text-[#94A3B8]">
      {icon}
    </span>
    <div className="min-w-0">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-[#94A3B8]">
        {label}
      </p>
      <div
        className={`break-words text-sm ${
          strong ? "font-bold text-[#0F172A]" : "text-[#334155]"
        }`}
      >
        {children || "—"}
      </div>
    </div>
  </div>
);

const Section = ({ icon, title, children }) => (
  <div className="rounded-2xl border border-[#E2E8F0] bg-white p-4">
    <h4 className="mb-2 flex items-center gap-2 text-sm font-bold text-[#0F172A]">
      <span className="material-symbols-outlined text-[18px] text-[#16a34a]">
        {icon}
      </span>
      {title}
    </h4>
    <div className="divide-y divide-[#F1F5F9]">{children}</div>
  </div>
);

const MoneyRow = ({ label, value, strong = false, highlight = false }) => (
  <div className="flex items-center justify-between gap-3 py-1.5">
    <span
      className={`text-sm ${
        strong ? "font-bold text-[#0F172A]" : "text-[#64748B]"
      }`}
    >
      {label}
    </span>
    <span
      className={`shrink-0 ${
        highlight
          ? "text-lg font-bold text-[#DC2626]"
          : strong
            ? "text-sm font-bold text-[#0F172A]"
            : "text-sm font-semibold text-[#334155]"
      }`}
    >
      {value}
    </span>
  </div>
);

const OrderDetailModal = ({
  order,
  isHistory,
  onClose,
  onSubmit,
  submitting,
  onPhotoChange,
  note,
  onNoteChange,
}) => {
  const items = order.items || [];
  const isPaid = !!order.TrangThaiThanhToan;

  return (
    <div className="fixed inset-0 z-[9999] flex items-end justify-center bg-black/50 sm:items-center sm:p-4">
      <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl bg-[#F8FAFC] shadow-xl sm:rounded-3xl">
        {/* HEADER */}
        <div className="flex items-start justify-between gap-3 border-b border-[#E2E8F0] bg-white px-5 py-4">
          <div className="min-w-0">
            <h3 className="text-lg font-bold text-[#0F172A]">
              Đơn {order.DTS_Ma}
            </h3>
            <p className="mt-0.5 text-xs text-[#64748B]">
              Lập ngày {formatDateTime(order.NgayLap)}
              {order.ThoiDiemPhanCong
                ? ` • Phân công ${formatDateTime(order.ThoiDiemPhanCong)}`
                : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="shrink-0 text-gray-400 hover:text-red-500 disabled:opacity-50"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* BODY */}
        <div className="flex-1 space-y-3 overflow-y-auto p-4 sm:p-5">
          <Section icon="storefront" title="Lấy hàng tại shop">
            <InfoRow icon="store" label="Cửa hàng" strong>
              {order.TenShop}
            </InfoRow>
            <InfoRow icon="call" label="Số điện thoại shop">
              {order.SdtShop ? (
                <a
                  href={telHref(order.SdtShop)}
                  className="font-semibold text-[#2563EB] hover:underline"
                >
                  {order.SdtShop}
                </a>
              ) : (
                <span className="italic text-[#94A3B8]">
                  Shop chưa cập nhật SĐT
                </span>
              )}
            </InfoRow>
            <InfoRow icon="mail" label="Email shop">
              {order.EmailShop}
            </InfoRow>
            <InfoRow icon="location_on" label="Địa chỉ lấy hàng" strong>
              {fullPickupAddress(order)}
            </InfoRow>
            {order.GpsLayHang && (
              <InfoRow icon="my_location" label="Vị trí GPS">
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    order.GpsLayHang,
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#2563EB] hover:underline"
                >
                  Xem trên bản đồ
                </a>
              </InfoRow>
            )}
          </Section>

          <Section icon="local_shipping" title="Giao cho khách">
            <InfoRow icon="person" label="Người nhận" strong>
              {order.TenNguoiNhan}
            </InfoRow>
            <InfoRow icon="call" label="Số điện thoại người nhận">
              {order.SdtNguoiNhan ? (
                <a
                  href={telHref(order.SdtNguoiNhan)}
                  className="font-semibold text-[#2563EB] hover:underline"
                >
                  {order.SdtNguoiNhan}
                </a>
              ) : (
                "—"
              )}
            </InfoRow>
            <InfoRow icon="home_pin" label="Địa chỉ giao" strong>
              {order.DiaChiGiao}
            </InfoRow>
            <InfoRow icon="sticky_note_2" label="Ghi chú của khách">
              {order.GhiChuKhach}
            </InfoRow>
          </Section>

          <Section icon="inventory_2" title={`Sản phẩm (${items.length})`}>
            {items.length === 0 ? (
              <p className="py-2 text-sm italic text-[#94A3B8]">
                Đơn không có sản phẩm.
              </p>
            ) : (
              items.map((item, idx) => (
                <div
                  key={`${item.Ctsp_Ma}-${idx}`}
                  className="flex gap-3 py-2.5"
                >
                  {item.Image ? (
                    <img
                      src={toAssetUrl(item.Image)}
                      alt={item.TenSanPham}
                      className="h-12 w-12 shrink-0 rounded-lg border border-[#E2E8F0] object-cover"
                    />
                  ) : (
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#F1F5F9] text-[#94A3B8]">
                      <span className="material-symbols-outlined text-[20px]">
                        image
                      </span>
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="break-words text-sm font-semibold text-[#0F172A]">
                      {item.TenSanPham}
                    </p>
                    {item.TenPhanLoai && (
                      <p className="text-xs text-[#64748B]">
                        Phân loại: {item.TenPhanLoai}
                      </p>
                    )}
                    <p className="text-xs text-[#64748B]">
                      {item.SoLuong} × {formatVND(item.DonGia)}
                    </p>
                  </div>
                  <p className="shrink-0 text-sm font-bold text-[#DC2626]">
                    {formatVND(item.ThanhTien)}
                  </p>
                </div>
              ))
            )}
          </Section>

          <Section icon="payments" title="Chi phí & thanh toán">
            <MoneyRow label="Tiền hàng" value={formatVND(order.TongTienHang)} />
            <MoneyRow
              label="Phí vận chuyển"
              value={formatVND(order.TienVanChuyen)}
            />
            {Number(order.GiamGiaShop) > 0 && (
              <MoneyRow
                label="Giảm giá shop"
                value={`- ${formatVND(order.GiamGiaShop)}`}
              />
            )}
            {Number(order.GiamGiaVanChuyen) > 0 && (
              <MoneyRow
                label="Giảm giá vận chuyển"
                value={`- ${formatVND(order.GiamGiaVanChuyen)}`}
              />
            )}
            {Number(order.TongTienGiamGia) > 0 && (
              <MoneyRow
                label="Tổng giảm giá"
                value={`- ${formatVND(order.TongTienGiamGia)}`}
              />
            )}
            <MoneyRow
              label={isPaid ? "Khách đã thanh toán" : "Thu hộ khi giao (COD)"}
              value={formatVND(order.TongTien)}
              strong
              highlight={!isPaid}
            />
            <div className="pt-2">
              <span
                className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold ${
                  isPaid
                    ? "bg-green-50 text-green-700"
                    : "bg-amber-50 text-amber-700"
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">
                  {isPaid ? "check_circle" : "payments"}
                </span>
                {isPaid
                  ? "Đã thanh toán – không thu tiền khi giao"
                  : "Chưa thanh toán – thu tiền khi giao"}
              </span>
            </div>
          </Section>

          <Section icon="route" title="Thông tin vận chuyển">
            <InfoRow icon="local_shipping" label="Đơn vị vận chuyển">
              {order.TenDVVC}
            </InfoRow>
            <InfoRow icon="scale" label="Mốc khối lượng">
              {order.TenMocKhoiLuong}
            </InfoRow>
            <InfoRow icon="event" label="Ngày giao dự kiến">
              {formatDate(order.NgayGiaoDuKien)}
            </InfoRow>
            <InfoRow icon="sticky_note_2" label="Ghi chú đơn hàng">
              {order.GhiChuDon}
            </InfoRow>
            {order.TenVoucherShop && (
              <InfoRow icon="sell" label="Voucher shop">
                {order.TenVoucherShop}
              </InfoRow>
            )}
            {order.TenVoucherVC && (
              <InfoRow icon="local_offer" label="Voucher vận chuyển">
                {order.TenVoucherVC}
              </InfoRow>
            )}
          </Section>

          {isHistory && (
            <Section icon="photo_camera" title="Minh chứng lấy hàng">
              <InfoRow icon="schedule" label="Thời điểm lấy hàng" strong>
                {formatDateTime(order.ThoiGian)}
              </InfoRow>
              <InfoRow icon="sticky_note_2" label="Ghi chú của shipper">
                {order.GhiChuLayHang}
              </InfoRow>
              {order.HinhAnh && (
                <div className="pt-2">
                  <img
                    src={toAssetUrl(order.HinhAnh)}
                    alt="Minh chứng lấy hàng"
                    className="max-h-72 w-full rounded-xl border border-[#E2E8F0] bg-white object-contain"
                  />
                </div>
              )}
            </Section>
          )}
        </div>

        {/* FOOTER */}
        {isHistory ? (
          <div className="border-t border-[#E2E8F0] bg-white px-5 py-4">
            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-xl bg-[#0F172A] py-2.5 font-bold text-white hover:bg-[#1E293B]"
            >
              Đóng
            </button>
          </div>
        ) : (
          <form
            onSubmit={onSubmit}
            className="space-y-3 border-t border-[#E2E8F0] bg-white px-4 py-4 sm:px-5"
          >
            <div className="flex gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
              <span className="material-symbols-outlined shrink-0 text-[18px]">
                warning
              </span>
              <p>
                Sau khi xác nhận, đơn chuyển sang <b>"Đang vận chuyển"</b> và{" "}
                <b>không thể hoàn tác</b>.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#334155]">
                  Ảnh minh chứng <span className="text-red-500">*</span>
                </label>
                <input
                  type="file"
                  accept="image/*"
                  required
                  onChange={(e) => onPhotoChange(e.target.files[0])}
                  className="w-full text-xs text-[#64748B] file:mr-3 file:rounded-lg file:border-0 file:bg-green-50 file:px-3 file:py-2 file:font-semibold file:text-[#16a34a]"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#334155]">
                  Ghi chú (không bắt buộc)
                </label>
                <textarea
                  rows={2}
                  value={note}
                  onChange={(e) => onNoteChange(e.target.value)}
                  placeholder="VD: Hàng đóng gói cẩn thận, 3 kiện..."
                  className="w-full resize-none rounded-xl border border-[#E2E8F0] px-3 py-2 text-sm outline-none focus:border-[#16a34a]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="rounded-xl px-5 py-2.5 font-semibold text-[#64748B] hover:bg-gray-100 disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="rounded-xl bg-[#16a34a] px-6 py-2.5 font-bold text-white hover:bg-[#15803d] disabled:bg-gray-400"
              >
                {submitting ? "Đang xử lý..." : "Xác nhận đã lấy"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

const DonChoLay = () => {
  const { user } = useContext(AuthContext);
  const shipper_ma = user?.shipper_ma;

  const [activeTab, setActiveTab] = useState("processing");

  const [orders, setOrders] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [modalPhoto, setModalPhoto] = useState(null);
  const [modalNote, setModalNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // ── Lấy hàng hàng loạt theo shop ─────────────────────────────
  const [selected, setSelected] = useState([]);
  const [bulkShop, setBulkShop] = useState(null); // nhóm shop đang mở modal
  const [bulkPhoto, setBulkPhoto] = useState(null);
  const [bulkPreview, setBulkPreview] = useState(null);
  const [bulkNote, setBulkNote] = useState("");
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

  // Gom đơn chờ lấy theo shop, giữ thứ tự đơn như API trả về
  const shopGroups = useMemo(() => {
    const map = new Map();
    orders.forEach((o) => {
      const key = o.GH_Ma || "__khac__";
      if (!map.has(key)) {
        map.set(key, {
          key,
          ten: o.TenShop || "Shop chưa xác định",
          sdt: o.SdtShop,
          diachi: o.GH_Ma ? fullPickupAddress(o) : null,
          orders: [],
        });
      }
      map.get(key).orders.push(o);
    });
    return Array.from(map.values());
  }, [orders]);

  const fetchData = async () => {
    if (!shipper_ma) return;
    setLoading(true);
    try {
      if (activeTab === "processing") {
        const res = await shipperDonHangService.getChoLay(shipper_ma);
        setOrders(res.data);
        // Mặc định tick hết, shipper tự bỏ tick đơn chưa đóng gói xong
        setSelected(res.data.map((o) => o.DTS_Ma));
      } else {
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

  const handleOpenDetail = (order) => {
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
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.message || "Lỗi lấy hàng", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Chọn đơn để lấy hàng loạt ────────────────────────────────
  const toggleOne = (dts_ma) => {
    setSelected((prev) =>
      prev.includes(dts_ma)
        ? prev.filter((ma) => ma !== dts_ma)
        : [...prev, dts_ma]
    );
  };

  const toggleShop = (group) => {
    const maShop = group.orders.map((o) => o.DTS_Ma);
    const daChonHet = maShop.every((ma) => selected.includes(ma));
    setSelected((prev) =>
      daChonHet
        ? prev.filter((ma) => !maShop.includes(ma))
        : Array.from(new Set([...prev, ...maShop]))
    );
  };

  const handleOpenBulk = (group) => {
    const ds = group.orders.filter((o) => selected.includes(o.DTS_Ma));
    if (ds.length === 0)
      return showToast("Vui lòng chọn ít nhất 1 đơn hàng!", "error");

    setBulkShop({ ...group, orders: ds });
    setBulkPhoto(null);
    setBulkPreview(null);
    setBulkNote("");
  };

  const handleCloseBulk = () => {
    if (bulkSubmitting) return;
    setBulkShop(null);
    setBulkPhoto(null);
    setBulkPreview(null);
    setBulkNote("");
  };

  const handleBulkPhoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBulkPhoto(file);
    setBulkPreview(URL.createObjectURL(file));
  };

  const handleBulkSubmit = async (e) => {
    e.preventDefault();
    if (!bulkShop) return;
    if (!bulkPhoto) return showToast("Vui lòng chọn ảnh minh chứng!", "error");

    setBulkSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("hinhanh", bulkPhoto);
      fd.append(
        "danh_sach",
        JSON.stringify(bulkShop.orders.map((o) => o.DTS_Ma))
      );
      if (bulkNote) fd.append("ghichu", bulkNote);

      await shipperDonHangService.layHangHangLoat(shipper_ma, fd);

      showToast(
        `Đã lấy hàng ${bulkShop.orders.length} đơn của ${bulkShop.ten}!`
      );
      setBulkShop(null);
      setBulkPhoto(null);
      setBulkPreview(null);
      setBulkNote("");
      fetchData();
    } catch (err) {
      showToast(
        err.response?.data?.message || "Lỗi lấy hàng hàng loạt",
        "error"
      );
    } finally {
      setBulkSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 sm:p-6">
      {/* HEADER */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#0F172A]">
          Quản Lý Đơn Lấy Hàng
        </h1>
        <p className="mt-1 text-sm text-[#64748B]">
          Bấm vào đơn để xem đầy đủ thông tin lấy hàng và thông tin giao hàng.
        </p>
      </div>

      {/* TABS */}
      <div className="mb-6 flex overflow-hidden rounded-xl border-b border-gray-200 bg-white shadow-sm">
        <button
          onClick={() => setActiveTab("processing")}
          className={`flex-1 py-3 text-center text-sm font-bold transition-colors ${
            activeTab === "processing"
              ? "border-b-2 border-green-600 bg-green-50 text-green-700"
              : "text-gray-500 hover:bg-gray-50"
          }`}
        >
          Đang xử lý (Chờ lấy)
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`flex-1 py-3 text-center text-sm font-bold transition-colors ${
            activeTab === "history"
              ? "border-b-2 border-green-600 bg-green-50 text-green-700"
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
        orders.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#E2E8F0] bg-white py-20 text-center">
            <span className="material-symbols-outlined mb-4 text-6xl text-gray-300">
              inventory
            </span>
            <p className="text-lg font-bold text-gray-700">
              Không có đơn nào cần lấy.
            </p>
            <p className="mt-1 text-sm text-gray-500">
              Vui lòng chờ ĐVVC phân công đơn mới.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {shopGroups.map((group) => {
              const maShop = group.orders.map((o) => o.DTS_Ma);
              const soChon = maShop.filter((ma) =>
                selected.includes(ma)
              ).length;
              const chonHet = soChon === maShop.length;
              const tongCOD = group.orders.reduce(
                (sum, o) => sum + Number(o.TongTien || 0),
                0
              );

              return (
                <section
                  key={group.key}
                  className="overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-sm"
                >
                  <details open className="group">
                    <summary className="cursor-pointer list-none border-b border-[#E2E8F0] bg-[#F8FAFC] p-4 [&::-webkit-details-marker]:hidden">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="flex items-center gap-2 font-bold text-[#0F172A]">
                            <span className="material-symbols-outlined text-[20px] text-[#16a34a]">
                              storefront
                            </span>
                            {group.ten}
                          </p>
                          <div className="mt-1 space-y-0.5 text-xs text-[#64748B]">
                            {group.sdt && (
                              <p className="flex items-center gap-1">
                                <span className="material-symbols-outlined text-[14px]">
                                  call
                                </span>
                                <a
                                  href={telHref(group.sdt)}
                                  onClick={(e) => e.stopPropagation()}
                                  className="font-semibold text-[#2563EB] hover:underline"
                                >
                                  {group.sdt}
                                </a>
                              </p>
                            )}
                            {group.diachi && (
                              <p className="flex items-start gap-1">
                                <span className="material-symbols-outlined text-[14px]">
                                  location_on
                                </span>
                                <span>{group.diachi}</span>
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="shrink-0 text-right">
                          <p className="text-xs font-bold text-[#334155]">
                            {group.orders.length} đơn
                          </p>
                          <p className="text-xs text-[#64748B]">
                            COD {formatVND(tongCOD)}
                          </p>
                        </div>
                      </div>
                    </summary>

                    {/* Thanh chọn + lấy hàng loạt của shop */}
                    <div className="flex flex-wrap items-center gap-3 border-b border-[#F1F5F9] px-4 py-3">
                      <label className="flex cursor-pointer select-none items-center gap-2 text-xs font-semibold text-[#334155]">
                        <input
                          type="checkbox"
                          className="h-4 w-4 cursor-pointer"
                          checked={chonHet}
                          onChange={() => toggleShop(group)}
                          disabled={bulkSubmitting}
                        />
                        Chọn cả shop
                      </label>

                      <span className="text-xs text-[#64748B]">
                        Đã chọn{" "}
                        <b className="text-[#16a34a]">{soChon}</b>/
                        {group.orders.length}
                      </span>

                      <button
                        type="button"
                        onClick={() => handleOpenBulk(group)}
                        disabled={bulkSubmitting || soChon === 0}
                        className="ml-auto flex items-center gap-1 rounded-xl bg-[#16a34a] px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-[#15803d] disabled:cursor-not-allowed disabled:bg-gray-400"
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          done_all
                        </span>
                        Lấy {soChon} đơn
                      </button>
                    </div>

                    <div className="grid grid-cols-1 gap-5 p-4 md:grid-cols-2 xl:grid-cols-3">
                      {group.orders.map((o) => {
                        const items = o.items || [];
                        const totalQty = items.reduce(
                          (sum, item) => sum + Number(item.SoLuong || 0),
                          0
                        );
                        const isChecked = selected.includes(o.DTS_Ma);

                        return (
                          <div
                            key={o.DTS_Ma}
                            className={`flex flex-col rounded-2xl border bg-white p-5 shadow-sm transition-shadow hover:shadow-md ${
                              isChecked
                                ? "border-[#BBF7D0] ring-1 ring-[#16a34a]/30"
                                : "border-[#E2E8F0]"
                            }`}
                          >
                            <div className="mb-3 flex items-center justify-between border-b pb-2">
                              <label className="flex cursor-pointer items-center gap-2">
                                <input
                                  type="checkbox"
                                  className="h-4 w-4 cursor-pointer"
                                  checked={isChecked}
                                  onChange={() => toggleOne(o.DTS_Ma)}
                                  disabled={bulkSubmitting}
                                />
                                <span className="font-bold text-[#16a34a]">
                                  {o.DTS_Ma}
                                </span>
                              </label>
                              <span className="rounded bg-yellow-50 px-2 py-1 text-xs font-bold text-yellow-600">
                                Chờ lấy
                              </span>
                            </div>

                            <div className="flex-1 space-y-2 text-sm">
                              <p>
                                <b className="text-[#334155]">Shop:</b>{" "}
                                {o.TenShop}
                              </p>
                              <p className="text-[#64748B]">
                                <b>SĐT shop:</b>{" "}
                                {o.SdtShop ? (
                                  <a
                                    href={telHref(o.SdtShop)}
                                    className="font-semibold text-[#2563EB] hover:underline"
                                  >
                                    {o.SdtShop}
                                  </a>
                                ) : (
                                  <span className="italic text-[#94A3B8]">
                                    Chưa cập nhật
                                  </span>
                                )}
                              </p>
                              <p className="text-[#64748B]">
                                <b>Lấy tại:</b> {fullPickupAddress(o)}
                              </p>
                              <p className="text-[#64748B]">
                                <b>Giao đến:</b> {o.DiaChiGiao}
                              </p>
                              <p className="text-[#64748B]">
                                <b>Người nhận:</b> {o.TenNguoiNhan}
                                {o.SdtNguoiNhan
                                  ? ` • ${o.SdtNguoiNhan}`
                                  : ""}
                              </p>
                              <p className="text-[#64748B]">
                                <b>Tổng tiền:</b>{" "}
                                <span className="font-bold text-[#DC2626]">
                                  {formatVND(o.TongTien)}
                                </span>
                              </p>

                              {items.length > 0 && (
                                <div className="mt-3 border-t border-[#F1F5F9] pt-3">
                                  <p className="mb-1.5 text-xs font-semibold text-gray-500">
                                    Sản phẩm ({items.length} loại •{" "}
                                    {totalQty} món):
                                  </p>
                                  {items.slice(0, 3).map((item, idx) => (
                                    <p
                                      key={`${item.Ctsp_Ma}-${idx}`}
                                      className="truncate text-xs leading-5 text-gray-600"
                                    >
                                      • {item.TenSanPham}
                                      {item.TenPhanLoai
                                        ? ` (${item.TenPhanLoai})`
                                        : ""}{" "}
                                      × {item.SoLuong}
                                    </p>
                                  ))}
                                  {items.length > 3 && (
                                    <p className="mt-1 text-xs italic text-gray-400">
                                      ... và {items.length - 3} sản phẩm khác
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>

                            <div className="mt-4 border-t border-[#F1F5F9] pt-4">
                              <button
                                onClick={() => handleOpenDetail(o)}
                                disabled={bulkSubmitting}
                                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#16a34a] py-2.5 font-bold text-white transition-colors hover:bg-[#15803d] disabled:cursor-not-allowed disabled:bg-gray-400"
                              >
                                <span className="material-symbols-outlined text-[20px]">
                                  visibility
                                </span>
                                Xem chi tiết & lấy hàng
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </details>
                </section>
              );
            })}
          </div>
        )
      ) : (
        <DateGroupedList
          items={history}
          dateField="ThoiGian"
          renderItem={(item) => (
            <button
              key={item.DTS_Ma}
              type="button"
              onClick={() => handleOpenDetail(item)}
              className="flex w-full items-center justify-between gap-3 rounded-lg border border-gray-100 bg-white p-4 text-left transition-shadow hover:shadow-md"
            >
              <div className="flex items-center gap-4">
                {item.HinhAnh ? (
                  <img
                    src={toAssetUrl(item.HinhAnh)}
                    alt="Minh chứng"
                    className="h-14 w-14 rounded-lg border border-gray-200 object-cover"
                  />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-green-50 text-green-600">
                    <span className="material-symbols-outlined">image</span>
                  </div>
                )}
                <div className="min-w-0">
                  <p className="font-bold text-[#0F172A]">Đơn: {item.DTS_Ma}</p>
                  <p className="text-sm text-gray-500">Shop: {item.TenShop}</p>
                  <p className="truncate text-xs text-gray-400">
                    Giao: {item.TenNguoiNhan} • {formatVND(item.TongTien)}
                  </p>
                </div>
              </div>
              <div className="shrink-0 text-right">
                <span className="rounded bg-green-50 px-2 py-1 text-xs font-bold text-green-600">
                  Đã lấy
                </span>
                <p className="mt-1 text-xs text-gray-400">
                  {new Date(item.ThoiGian).toLocaleTimeString("vi-VN")}
                </p>
              </div>
            </button>
          )}
        />
      )}

      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          isHistory={activeTab === "history"}
          onClose={handleCloseModal}
          onSubmit={handleSubmit}
          submitting={submitting}
          onPhotoChange={setModalPhoto}
          note={modalNote}
          onNoteChange={setModalNote}
        />
      )}

      {/* MODAL LẤY HÀNG HÀNG LOẠT */}
      {bulkShop && (
        <div className="fixed inset-0 z-[9999] flex items-end justify-center bg-black/50 sm:items-center sm:p-4">
          <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-xl sm:rounded-3xl">
            <div className="flex items-start justify-between gap-3 border-b border-[#E2E8F0] px-5 py-4">
              <div className="min-w-0">
                <h3 className="text-lg font-bold text-[#0F172A]">
                  Lấy Hàng Hàng Loạt
                </h3>
                <p className="mt-0.5 truncate text-xs text-[#64748B]">
                  {bulkShop.ten} • {bulkShop.orders.length} đơn
                </p>
              </div>
              <button
                type="button"
                onClick={handleCloseBulk}
                disabled={bulkSubmitting}
                className="shrink-0 text-gray-400 hover:text-red-500 disabled:opacity-50"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form
              onSubmit={handleBulkSubmit}
              className="flex flex-1 flex-col overflow-hidden"
            >
              <div className="flex-1 space-y-3 overflow-y-auto p-5">
                <div className="flex gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                  <span className="material-symbols-outlined shrink-0 text-[18px]">
                    warning
                  </span>
                  <p>
                    Lấy <b>{bulkShop.orders.length} đơn</b> trong một lần. Nếu
                    một đơn không lấy được thì <b>toàn bộ lô sẽ bị huỷ</b>,
                    không đơn nào được ghi nhận.
                  </p>
                </div>

                <div>
                  <p className="mb-1 text-xs font-semibold text-[#334155]">
                    Danh sách đơn ({bulkShop.orders.length})
                  </p>
                  <div className="max-h-44 space-y-1 overflow-y-auto rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-2">
                    {bulkShop.orders.map((o) => (
                      <div
                        key={o.DTS_Ma}
                        className="flex items-center gap-2 rounded-lg border border-[#F1F5F9] bg-white px-2 py-1.5"
                      >
                        <span className="shrink-0 font-mono text-xs font-bold text-[#334155]">
                          {o.DTS_Ma}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-xs text-[#64748B]">
                          {o.TenNguoiNhan}
                        </span>
                        <span className="shrink-0 text-xs font-bold text-[#DC2626]">
                          {formatVND(o.TongTien)}
                        </span>
                      </div>
                    ))}
                  </div>
                  <p className="mt-1 text-right text-xs text-[#64748B]">
                    Tổng COD:{" "}
                    <b className="text-[#DC2626]">
                      {formatVND(
                        bulkShop.orders.reduce(
                          (sum, o) => sum + Number(o.TongTien || 0),
                          0
                        )
                      )}
                    </b>
                  </p>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#334155]">
                    Ảnh minh chứng chung <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    required
                    onChange={handleBulkPhoto}
                    className="w-full text-xs text-[#64748B] file:mr-3 file:rounded-lg file:border-0 file:bg-green-50 file:px-3 file:py-2 file:font-semibold file:text-[#16a34a]"
                  />
                  {bulkPreview && (
                    <img
                      src={bulkPreview}
                      alt="Minh chứng"
                      className="mt-3 max-h-56 w-full rounded-xl border border-[#E2E8F0] object-contain"
                    />
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#334155]">
                    Ghi chú chung (không bắt buộc)
                  </label>
                  <textarea
                    rows={2}
                    value={bulkNote}
                    onChange={(e) => setBulkNote(e.target.value)}
                    placeholder="VD: Shop giao đủ kiện, hàng nguyên vẹn..."
                    className="w-full resize-none rounded-xl border border-[#E2E8F0] px-3 py-2 text-sm outline-none focus:border-[#16a34a]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-[#E2E8F0] bg-white px-5 py-4">
                <button
                  type="button"
                  onClick={handleCloseBulk}
                  disabled={bulkSubmitting}
                  className="rounded-xl px-5 py-2.5 font-semibold text-[#64748B] hover:bg-gray-100 disabled:opacity-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={bulkSubmitting}
                  className="rounded-xl bg-[#16a34a] px-6 py-2.5 font-bold text-white hover:bg-[#15803d] disabled:bg-gray-400"
                >
                  {bulkSubmitting
                    ? "Đang xử lý..."
                    : `Xác nhận lấy ${bulkShop.orders.length} đơn`}
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
