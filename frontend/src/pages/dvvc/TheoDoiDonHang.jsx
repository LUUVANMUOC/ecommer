import { useState, useEffect, useContext, useCallback, useMemo } from "react";
import { AuthContext } from "../../contexts/AuthContext";
import axiosClient from "../../config/axiosClient";
import theoDoiService from "../../services/dvvc/theoDoiService";
import { toAssetUrl } from "../../utils/accountUtils";
import { formatVND } from "../../components/shop/SanPhamShared";
import ToastNotification from "../../components/common/Crud/ToastNotification";

const STATUS_MAP = {
  TTDH01: { text: "Chờ xác nhận", color: "bg-gray-100 text-gray-700" },
  TTDH02: { text: "Chờ lấy hàng", color: "bg-yellow-100 text-yellow-700" },
  TTDH03: { text: "Đang vận chuyển", color: "bg-blue-100 text-blue-700" },
  TTDH04: { text: "Đang giao hàng", color: "bg-indigo-100 text-indigo-700" },
  TTDH05: { text: "Đã hoàn thành", color: "bg-green-100 text-green-700" },
  TTDH06: { text: "Đã hủy", color: "bg-red-100 text-red-700" },
};

const getTimelineIcon = (hanhDong) => {
  const text = hanhDong.toLowerCase();
  if (text.includes("phân công")) return "assignment_ind";
  if (text.includes("lấy hàng")) return "inventory";
  if (text.includes("trung chuyển") || text.includes("tới kho"))
    return "local_shipping";
  if (text.includes("giao hàng")) return "delivery_dining";
  if (text.includes("tiếp nhận")) return "warehouse";
  return "check_circle";
};

const TheoDoiDonHang = () => {
  const { user } = useContext(AuthContext);
  const dvvc_ma = user?.DVVC_Ma || user?.dvvc_ma || user?.id;

  const [orders, setOrders] = useState([]);
  const [khos, setKhos] = useState([]);
  const [tinhs, setTinhs] = useState([]);
  const [xas, setXas] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filterTinh, setFilterTinh] = useState("");
  const [filterXa, setFilterXa] = useState("");
  const [filters, setFilters] = useState({
    trangthai: "",
    kho_ma: "",
    search: "",
  });

  const [selectedDTS, setSelectedDTS] = useState(null);
  const [detail, setDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

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
    if (!dvvc_ma) return;
    const fetchInitialData = async () => {
      try {
        const [resKho, resTinh, resXa] = await Promise.all([
          axiosClient.get(`/dvvc/kho/${dvvc_ma}`),
          axiosClient.get("/tinh"),
          axiosClient.get("/xa"),
        ]);
        setKhos(resKho.data);
        setTinhs(resTinh.data);
        setXas(resXa.data);
      } catch (err) {
        console.error("Lỗi tải dữ liệu bộ lọc", err);
      }
    };
    fetchInitialData();
  }, [dvvc_ma]);

  const filteredXas = useMemo(
    () => xas.filter((xa) => String(xa.tinh_ma) === String(filterTinh)),
    [xas, filterTinh],
  );

  const filteredKhos = useMemo(() => {
    return khos.filter((kho) => {
      const matchTinh = filterTinh
        ? String(kho.Tinh_Ma) === String(filterTinh)
        : true;
      const matchXa = filterXa ? String(kho.Xa_Ma) === String(filterXa) : true;
      return matchTinh && matchXa;
    });
  }, [khos, filterTinh, filterXa]);

  const fetchOrders = useCallback(async () => {
    if (!dvvc_ma) return;
    setLoading(true);
    try {
      const res = await theoDoiService.getDanhSach(dvvc_ma, filters);
      setOrders(res.data);
    } catch (err) {
      showToast("Lỗi tải danh sách đơn", "error");
    } finally {
      setLoading(false);
    }
  }, [dvvc_ma, filters]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleViewDetail = async (dts_ma) => {
    setSelectedDTS(dts_ma);
    setLoadingDetail(true);
    try {
      const res = await theoDoiService.getChiTiet(dts_ma);
      setDetail(res.data);
    } catch (err) {
      showToast("Lỗi tải chi tiết đơn", "error");
      setSelectedDTS(null);
    } finally {
      setLoadingDetail(false);
    }
  };

  return (
    <div className="p-6 bg-[#F8FAFC] min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#0F172A]">Theo Dõi Đơn Hàng</h1>
        <p className="text-sm text-[#64748B] mt-1">
          Giám sát toàn bộ vòng đời đơn hàng từ lúc đặt đến khi giao xong
        </p>
      </div>

      {/* BỘ LỌC */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-[#E2E8F0] mb-6 flex flex-wrap gap-4 items-center">
        <input
          type="text"
          placeholder="Tìm Mã đơn, Tên Shop..."
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          className="px-4 py-2 rounded-xl border border-[#E2E8F0] outline-none text-sm min-w-[250px] focus:border-[#2563EB]"
        />
        <select
          value={filters.trangthai}
          onChange={(e) =>
            setFilters({ ...filters, trangthai: e.target.value })
          }
          className="px-4 py-2 rounded-xl border border-[#E2E8F0] outline-none text-sm bg-white min-w-[180px]"
        >
          <option value="">-- Tất cả trạng thái --</option>
          {Object.entries(STATUS_MAP).map(([key, val]) => (
            <option key={key} value={key}>
              {val.text}
            </option>
          ))}
        </select>
        <select
          value={filterTinh}
          onChange={(e) => {
            setFilterTinh(e.target.value);
            setFilterXa("");
            setFilters((prev) => ({ ...prev, kho_ma: "" }));
          }}
          className="px-4 py-2 rounded-xl border border-[#E2E8F0] outline-none text-sm bg-white min-w-[180px]"
        >
          <option value="">-- Tất cả Tỉnh/Thành --</option>
          {tinhs.map((t) => (
            <option key={t.tinh_ma} value={t.tinh_ma}>
              {t.tinh_ten}
            </option>
          ))}
        </select>
        <select
          value={filterXa}
          onChange={(e) => {
            setFilterXa(e.target.value);
            setFilters((prev) => ({ ...prev, kho_ma: "" }));
          }}
          disabled={!filterTinh}
          className="px-4 py-2 rounded-xl border border-[#E2E8F0] outline-none text-sm bg-white min-w-[180px] disabled:bg-gray-100"
        >
          <option value="">-- Tất cả Xã/Phường --</option>
          {filteredXas.map((x) => (
            <option key={x.xa_ma} value={x.xa_ma}>
              {x.xa_ten}
            </option>
          ))}
        </select>
        <select
          value={filters.kho_ma}
          onChange={(e) => setFilters({ ...filters, kho_ma: e.target.value })}
          className="px-4 py-2 rounded-xl border border-[#E2E8F0] outline-none text-sm bg-white min-w-[200px]"
        >
          <option value="">-- Tất cả Kho --</option>
          {filteredKhos.map((k) => (
            <option key={k.Kho_Ma} value={k.Kho_Ma}>
              {k.Kho_Ten}
            </option>
          ))}
        </select>
        {(filters.trangthai ||
          filters.kho_ma ||
          filters.search ||
          filterTinh ||
          filterXa) && (
          <button
            onClick={() => {
              setFilterTinh("");
              setFilterXa("");
              setFilters({ trangthai: "", kho_ma: "", search: "" });
            }}
            className="text-sm text-red-500 hover:underline font-medium ml-auto"
          >
            Xóa bộ lọc
          </button>
        )}
      </div>

      {/* BẢNG DANH SÁCH */}
      <div className="bg-white rounded-2xl shadow-sm border border-[#E2E8F0] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[900px]">
            <thead>
              <tr className="bg-[#F8FAFC] text-[#64748B] text-sm border-b border-[#E2E8F0]">
                <th className="p-4 font-semibold">Mã Đơn</th>
                <th className="p-4 font-semibold">Ngày Lập</th>
                <th className="p-4 font-semibold">Shop</th>
                <th className="p-4 font-semibold">Lộ trình (Kho)</th>
                <th className="p-4 font-semibold">Trạng Thái</th>
                <th className="p-4 font-semibold text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {orders.map((o) => (
                <tr
                  key={o.DTS_Ma}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="p-4">
                    <span className="font-bold text-[#2563EB] bg-blue-50 px-2 py-1 rounded">
                      {o.DTS_Ma}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-gray-600">
                    {new Date(o.NgayLap).toLocaleDateString("vi-VN")}
                  </td>
                  <td className="p-4 font-semibold text-[#0F172A]">
                    {o.TenShop}
                  </td>
                  <td className="p-4 text-sm text-gray-600">
                    <span className="material-symbols-outlined text-[14px] align-middle mr-1 text-indigo-500">
                      warehouse
                    </span>
                    {o.Kho_Lay_Hang || o.Kho_Di || "--"}
                    {o.Kho_Den && o.Kho_Den !== o.Kho_Di && ` ➔ ${o.Kho_Den}`}
                  </td>
                  <td className="p-4">
                    <span
                      className={`text-xs font-bold px-2 py-1 rounded ${STATUS_MAP[o.TrangThaiHienTai]?.color || "bg-gray-100"}`}
                    >
                      {STATUS_MAP[o.TrangThaiHienTai]?.text ||
                        o.TrangThaiHienTai}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => handleViewDetail(o.DTS_Ma)}
                      className="px-3 py-1.5 bg-indigo-50 text-indigo-600 font-semibold rounded-lg hover:bg-indigo-100 text-sm"
                    >
                      Xem chi tiết
                    </button>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan="6" className="p-10 text-center text-gray-500">
                    Không tìm thấy đơn hàng nào.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL CHI TIẾT TIMELINE */}
      {selectedDTS && (
        <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-[fadeIn_0.2s_ease-out]">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-[#F8FAFC]">
              <div>
                <h3 className="text-xl font-bold text-[#0F172A]">
                  Chi Tiết Đơn Hàng: {selectedDTS}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Xem toàn bộ lịch trình vận chuyển
                </p>
              </div>
              <button
                onClick={() => setSelectedDTS(null)}
                className="text-gray-400 hover:text-red-500 transition-colors"
              >
                <span className="material-symbols-outlined text-2xl">
                  close
                </span>
              </button>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-gray-50/50">
              {loadingDetail ? (
                <div className="text-center py-10 text-gray-500">
                  Đang tải chi tiết...
                </div>
              ) : detail ? (
                <>
                  <div className="bg-white rounded-2xl p-5 mb-8 border border-gray-100 shadow-sm grid grid-cols-2 gap-4 text-sm">
                    <p>
                      <b className="text-gray-600">Khách hàng:</b>{" "}
                      {detail.TenKhach} - {detail.SdtKhach}
                    </p>
                    <p>
                      <b className="text-gray-600">Shop:</b> {detail.TenShop}
                    </p>
                    <p className="col-span-2">
                      <b className="text-gray-600">Giao đến:</b>{" "}
                      {detail.DiaChiGiao}
                    </p>
                    <p>
                      <b className="text-gray-600">Tổng tiền:</b>{" "}
                      <span className="text-red-600 font-bold">
                        {formatVND(detail.TongTien)}
                      </span>
                    </p>
                    <p>
                      <b className="text-gray-600">Trạng thái:</b>{" "}
                      <span
                        className={`font-bold px-2 py-0.5 rounded ${STATUS_MAP[detail.TrangThaiHienTai]?.color}`}
                      >
                        {STATUS_MAP[detail.TrangThaiHienTai]?.text}
                      </span>
                    </p>
                  </div>

                  <div className="relative border-l-2 border-indigo-200 ml-4 space-y-8 pb-4">
                    {detail.timeline.map((item, index) => (
                      <div key={index} className="relative pl-8">
                        <div className="absolute -left-[17px] top-4 w-8 h-8 rounded-full bg-white border-2 border-indigo-500 flex items-center justify-center shadow-sm">
                          <span className="material-symbols-outlined text-[16px] text-indigo-600">
                            {getTimelineIcon(item.HanhDong)}
                          </span>
                        </div>

                        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow grid grid-cols-1 md:grid-cols-[1.5fr_2fr] gap-6">
                          {/* CỘT TRÁI */}
                          <div className="flex flex-col gap-2">
                            <h4 className="font-bold text-lg text-[#0F172A]">
                              {item.HanhDong}
                            </h4>
                            <span className="text-sm font-semibold text-gray-600 flex items-center gap-1 bg-gray-100 w-fit px-3 py-1 rounded-lg">
                              <span className="material-symbols-outlined text-[16px]">
                                schedule
                              </span>
                              {new Date(item.ThoiGian).toLocaleString("vi-VN")}
                            </span>
                            <p className="text-sm font-medium text-emerald-600 mt-1 flex items-center gap-1">
                              <span className="material-symbols-outlined text-[18px]">
                                verified_user
                              </span>
                              Người thực hiện: <b>{item.NguoiThucHien}</b>
                            </p>
                            {item.GhiChu && (
                              <p className="text-sm text-gray-600 italic mt-2 border-l-2 border-gray-300 pl-3">
                                {item.GhiChu}
                              </p>
                            )}
                          </div>

                          {/* CỘT PHẢI */}
                          <div className="flex flex-col gap-3 border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-6">
                            {/* Shipper Info */}
                            {item.Shipper_Ma && (
                              <div className="bg-blue-50 border border-blue-100 p-3 rounded-xl flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                                  {item.Shipper_Ten.charAt(0)}
                                </div>
                                <div>
                                  <p className="font-bold text-blue-800 text-sm">
                                    {item.Shipper_Ten}
                                  </p>
                                  <p className="text-xs text-blue-600">
                                    Mã: {item.Shipper_Ma} • SĐT:{" "}
                                    {item.Shipper_SDT}
                                  </p>
                                </div>
                              </div>
                            )}

                            {/* Kho Route */}
                            {item.Kho_Ma && (
                              <div className="bg-indigo-50/50 border border-indigo-100 p-3 rounded-xl text-sm">
                                {item.Kho_Den_Ma ? (
                                  <div className="flex items-center gap-2">
                                    <div>
                                      <p className="text-xs text-gray-500">
                                        Từ kho:
                                      </p>
                                      <p className="font-bold text-indigo-700">
                                        {item.Kho_Ten} ({item.Kho_Ma})
                                      </p>
                                    </div>
                                    <span className="material-symbols-outlined text-indigo-400">
                                      trending_flat
                                    </span>
                                    <div>
                                      <p className="text-xs text-gray-500">
                                        Đến kho:
                                      </p>
                                      <p className="font-bold text-indigo-700">
                                        {item.Kho_Den_Ten} ({item.Kho_Den_Ma})
                                      </p>
                                    </div>
                                  </div>
                                ) : (
                                  <div>
                                    <p className="text-xs text-gray-500">
                                      Kho thực hiện:
                                    </p>
                                    <p className="font-bold text-indigo-700">
                                      {item.Kho_Ten} ({item.Kho_Ma})
                                    </p>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Ảnh minh chứng */}
                            {item.HinhAnh && (
                              <div>
                                <p className="text-xs font-semibold text-gray-500 mb-2">
                                  Ảnh minh chứng:
                                </p>
                                {/* ✅ Dùng thẻ a thay vì window.open để tránh lỗi runtime extension */}
                                <a
                                  href={toAssetUrl(item.HinhAnh)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  title="Bấm để xem ảnh lớn"
                                >
                                  <img
                                    src={toAssetUrl(item.HinhAnh)}
                                    alt="Minh chứng"
                                    className="w-20 h-20 object-cover rounded-lg border border-gray-200 shadow-sm cursor-pointer hover:opacity-80 hover:scale-105 transition-all"
                                  />
                                </a>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : null}
            </div>
            <div className="p-4 border-t bg-gray-50 text-right">
              <button
                onClick={() => setSelectedDTS(null)}
                className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700"
              >
                Đóng
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
