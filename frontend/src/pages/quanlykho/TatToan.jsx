import { useState, useEffect, useContext, useMemo, useRef } from "react";
import { AuthContext } from "../../contexts/AuthContext";
import qlkTaiChinhService from "../../services/quanlykho/taiChinhService";
import { formatVND } from "../../components/shop/SanPhamShared";
import ToastNotification from "../../components/common/Crud/ToastNotification";
import { buildVietQrUrl } from "../../utils/accountUtils";

const DU_LIEU_TAT_TOAN_RONG = {
  thongTinSan: null,
  thongTinDVVC: null,
  orders: [],
  phieuDangMo: [],
};

const QR_TIME_LIMIT = 120;

const MO_TA_LOAI = {
  DAY_DU: "Tất toán đơn hàng",
  CUOC_TON: "Tất toán cước tồn",
};

const TRANG_THAI_BADGE = {
  DA_THANH_TOAN: {
    label: "Hoàn tất",
    bg: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dot: "bg-emerald-500",
  },
  CHO_THANH_TOAN: {
    label: "Chờ thanh toán",
    bg: "bg-amber-50 text-amber-700 border-amber-200",
    dot: "bg-amber-500",
  },
  HUY: {
    label: "Đã huỷ",
    bg: "bg-rose-50 text-rose-700 border-rose-200",
    dot: "bg-rose-500",
  },
};

const TatToan = () => {
  const { user } = useContext(AuthContext);
  const kho_ma = user?.kho_ma;

  // Tab: 'QUYET_TOAN' | 'LICH_SU'
  const [activeTab, setActiveTab] = useState("QUYET_TOAN");

  // Dữ liệu tất toán mới
  const [data, setData] = useState(DU_LIEU_TAT_TOAN_RONG);
  const [loading, setLoading] = useState(true);

  // Modal QR đang mở
  const [showQR, setShowQR] = useState(false);
  const [activeDot, setActiveDot] = useState(null); // { ptt_ma, ptt_loai, ds_qr }
  const [qrStatuses, setQrStatuses] = useState({});
  const [timeLeft, setTimeLeft] = useState(QR_TIME_LIMIT);

  // Đơn hàng được tick chọn để tạo QR
  const [selectedDtsMa, setSelectedDtsMa] = useState([]);

  // Dữ liệu Lịch sử tất toán
  const [lichSuList, setLichSuList] = useState([]);
  const [lichSuLoading, setLichSuLoading] = useState(false);
  const [lichSuPagination, setLichSuPagination] = useState({
    total: 0,
    page: 1,
    limit: 15,
    totalPages: 1,
  });
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  // Modal chi tiết lịch sử
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedPhieuDetail, setSelectedPhieuDetail] = useState(null);

  const pollingRef = useRef(null);

  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast((p) => ({ ...p, show: false })), 3000);
  };

  const stopPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  };

  // Tải danh sách đơn cần tất toán và các đợt đang mở
  const fetchData = async () => {
    try {
      const res = await qlkTaiChinhService.getDuLieuTatToan(kho_ma);
      const tatToanData = res.data || DU_LIEU_TAT_TOAN_RONG;
      setData(tatToanData);
      setSelectedDtsMa((tatToanData.orders || []).map((o) => o.DTS_Ma));
    } catch (err) {
      showToast(
        err.response?.data?.message || "Lỗi tải danh sách tất toán",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  // Tải danh sách lịch sử tất toán
  const fetchLichSu = async (page = 1) => {
    if (!kho_ma) return;
    setLichSuLoading(true);
    try {
      const params = {
        page,
        limit: lichSuPagination.limit,
        tu_ngay: filterDateFrom || undefined,
        den_ngay: filterDateTo || undefined,
        trang_thai: filterStatus !== "ALL" ? filterStatus : undefined,
        search: searchTerm.trim() || undefined,
      };
      const res = await qlkTaiChinhService.getLichSuTatToan(kho_ma, params);
      setLichSuList(res.data?.data || []);
      setLichSuPagination(
        res.data?.pagination || {
          total: 0,
          page: 1,
          limit: 15,
          totalPages: 1,
        },
      );
    } catch (err) {
      showToast(
        err.response?.data?.message || "Lỗi tải lịch sử tất toán",
        "error",
      );
    } finally {
      setLichSuLoading(false);
    }
  };

  useEffect(() => {
    if (!kho_ma) return;
    fetchData();
  }, [kho_ma]);

  useEffect(() => {
    if (activeTab === "LICH_SU") {
      fetchLichSu(1);
    }
  }, [activeTab, filterStatus]);

  useEffect(() => () => stopPolling(), []);

  // Đếm ngược modal QR
  useEffect(() => {
    if (!showQR) return;
    if (timeLeft <= 0) {
      stopPolling();
      setShowQR(false);
      showToast(
        'Đã hết 2 phút hiển thị mã QR. Đợt tất toán vẫn được giữ — mở mục "Đợt tất toán đang mở" để quét tiếp.',
        "error",
      );
      fetchData();
      return;
    }
    const timerId = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearInterval(timerId);
  }, [showQR, timeLeft]);

  // Tính toán tiền còn phải thu của các đơn đang chọn (Shop + Sàn + ĐVVC)
  const { tongSanHienTai, tongShopHienTai, tongDVVCHienTai } = useMemo(() => {
    let san = 0;
    let shop = 0;
    let dvvc = 0;

    (data.orders || []).forEach((o) => {
      if (!selectedDtsMa.includes(o.DTS_Ma)) return;

      san += Number(o.PhiSan || 0);
      shop += Number(o.TienShop || 0);
      dvvc += Number(o.TienDVVC || 0);
    });

    return {
      tongSanHienTai: san,
      tongShopHienTai: shop,
      tongDVVCHienTai: dvvc,
    };
  }, [data, selectedDtsMa]);

  const handleSelectAll = (e) => {
    if (e.target.checked)
      setSelectedDtsMa((data.orders || []).map((o) => o.DTS_Ma));
    else setSelectedDtsMa([]);
  };

  const handleSelectOne = (dts_ma) => {
    setSelectedDtsMa((prev) =>
      prev.includes(dts_ma)
        ? prev.filter((id) => id !== dts_ma)
        : [...prev, dts_ma],
    );
  };

  const startPolling = (ma) => {
    stopPolling();
    pollingRef.current = setInterval(async () => {
      try {
        const res = await qlkTaiChinhService.getTrangThaiTatToan(ma);

        if (res.data.trang_thai === "KHONG_TIM_THAY") {
          stopPolling();
          setShowQR(false);
          showToast("Không tìm thấy đợt tất toán. Vui lòng tải lại trang.");
          fetchData();
          return;
        }

        const statuses = {};
        (res.data.ds_qr || []).forEach((qr) => {
          statuses[qr.qr_ma] = qr.qr_trang_thai;
        });
        setQrStatuses(statuses);

        if (res.data.trang_thai === "DA_THANH_TOAN") {
          stopPolling();
          showToast("Tất toán hoàn tất! Tất cả QR đã nhận đủ tiền.");
          setShowQR(false);
          fetchData();
          if (activeTab === "LICH_SU") fetchLichSu(lichSuPagination.page);
        }
      } catch (e) {
        console.error("Lỗi kiểm tra trạng thái:", e);
      }
    }, 3000);
  };

  // Mở bảng QR cho một đợt (vừa tạo hoặc đợt đang mở)
  const moDot = (dot) => {
    const dsQr = dot?.ds_qr || [];
    const statuses = {};
    dsQr.forEach((qr) => {
      statuses[qr.qr_ma] = qr.qr_trang_thai;
    });

    setActiveDot({
      ptt_ma: dot.ptt_ma,
      ptt_loai: dot.ptt_loai,
      ds_qr: dsQr,
    });
    setQrStatuses(statuses);
    setTimeLeft(QR_TIME_LIMIT);
    setShowQR(true);

    if (dot.ptt_ma) startPolling(dot.ptt_ma);
  };

  const handleTaoQr = async () => {
    if (selectedDtsMa.length === 0) {
      return showToast(
        "Vui lòng chọn ít nhất 1 đơn hàng để tất toán!",
        "error",
      );
    }
    if (tongDVVCHienTai > 0 && !data.thongTinDVVC) {
      return showToast(
        "ĐVVC chưa cấu hình tài khoản nhận tiền. Không thể tất toán cước vận chuyển.",
        "error",
      );
    }

    try {
      const selectedOrdersData = (data.orders || []).filter((o) =>
        selectedDtsMa.includes(o.DTS_Ma),
      );
      const res = await qlkTaiChinhService.taoPhieuVaQr({
        kho_ma,
        selectedOrders: selectedOrdersData,
      });

      moDot({
        ptt_ma: res.data.ptt_ma,
        ptt_loai: "DAY_DU",
        ds_qr: res.data.ds_qr || [],
      });
    } catch (err) {
      showToast(err.response?.data?.message || "Lỗi tạo mã QR", "error");
    }
  };

  const handleCloseQR = () => {
    stopPolling();
    setShowQR(false);
    setActiveDot(null);
    fetchData();
    if (activeTab === "LICH_SU") fetchLichSu(lichSuPagination.page);
  };

  const handleHuyDot = async (ma) => {
    const dongY = window.confirm(
      "Huỷ đợt tất toán này?\n\n- Các mã QR chưa quét sẽ bị huỷ.\n- Các khoản đã thu vẫn được giữ lại, không thể hoàn tác.\n- Phần chưa thu sẽ quay lại danh sách để tất toán sau.",
    );
    if (!dongY) return;

    try {
      await qlkTaiChinhService.huyPhieuTatToan(ma);
      stopPolling();
      setShowQR(false);
      setActiveDot(null);
      showToast("Đã huỷ đợt tất toán. Các khoản đã thu vẫn được giữ.");
      fetchData();
      if (activeTab === "LICH_SU") fetchLichSu(lichSuPagination.page);
    } catch (err) {
      showToast(err.response?.data?.message || "Lỗi huỷ đợt", "error");
    }
  };

  // Mở modal xem chi tiết 1 phiếu lịch sử
  const handleXemChiTiet = async (ptt_ma) => {
    setDetailLoading(true);
    setDetailModalOpen(true);
    try {
      const res = await qlkTaiChinhService.getChiTietPhieuTatToan(ptt_ma);
      setSelectedPhieuDetail(res.data);
    } catch (err) {
      showToast(
        err.response?.data?.message || "Lỗi tải chi tiết đợt tất toán",
        "error",
      );
      setDetailModalOpen(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const qrStatusOf = (qr) =>
    qrStatuses[qr.qr_ma] || qr.qr_trang_thai || "CHUA_THANH_TOAN";

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const formatDate = (value) =>
    value ? new Date(value).toLocaleString("vi-VN") : "—";

  if (loading)
    return (
      <div className="p-10 text-center font-medium text-gray-500">
        Đang tải dữ liệu tất toán...
      </div>
    );

  const coDuLieuTatToan = (data.orders || []).length > 0;
  const dsDotDangMo = data.phieuDangMo || [];

  // Thống kê của đợt đang mở trong modal quét QR
  const dsQrModal = activeDot?.ds_qr || [];
  const soQrModal = dsQrModal.filter((qr) => qrStatusOf(qr) !== "HUY").length;
  const soQrDaTraModal = dsQrModal.filter(
    (qr) => qrStatusOf(qr) === "DA_THANH_TOAN",
  ).length;
  const tongTienModal = dsQrModal
    .filter((qr) => qrStatusOf(qr) !== "HUY")
    .reduce((sum, qr) => sum + Number(qr.qr_so_tien || 0), 0);
  const daThuModal = dsQrModal
    .filter((qr) => qrStatusOf(qr) === "DA_THANH_TOAN")
    .reduce((sum, qr) => sum + Number(qr.qr_so_tien || 0), 0);

  return (
    <div className="p-6 bg-[#F8FAFC] min-h-screen">
      {/* Header & Tabs */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A]">
            Tất Toán Dòng Tiền Kho
          </h1>
          <p className="text-sm text-[#64748B] mt-1">
            Quyết toán tiền đơn hàng cho Sàn, Shop và cước vận chuyển cho ĐVVC.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="inline-flex rounded-xl bg-gray-200/70 p-1 self-start md:self-auto border border-gray-300/40">
          <button
            onClick={() => setActiveTab("QUYET_TOAN")}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
              activeTab === "QUYET_TOAN"
                ? "bg-white text-indigo-700 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <span className="material-symbols-outlined text-lg">
              payments
            </span>
            Tất toán đơn hàng
            {data.orders?.length > 0 && (
              <span className="ml-1 px-2 py-0.2 rounded-full text-xs bg-indigo-100 text-indigo-700 font-bold">
                {data.orders.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("LICH_SU")}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
              activeTab === "LICH_SU"
                ? "bg-white text-indigo-700 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <span className="material-symbols-outlined text-lg">
              history
            </span>
            Lịch sử tất toán
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: TẤT TOÁN ĐƠN HÀNG                                   */}
      {/* ========================================================= */}
      {activeTab === "QUYET_TOAN" && (
        <>
          {/* Card tính tổng tiền đang chọn */}
          <div className="bg-white rounded-2xl shadow-sm border border-[#E2E8F0] p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="bg-red-50 p-5 rounded-xl border border-red-100">
                <p className="text-sm font-semibold text-red-600 mb-1">
                  Tổng chuyển Sàn (Admin)
                </p>
                <p className="text-3xl font-bold text-red-700">
                  {formatVND(tongSanHienTai)}
                </p>
              </div>
              <div className="bg-green-50 p-5 rounded-xl border border-green-100">
                <p className="text-sm font-semibold text-green-600 mb-1">
                  Tổng chuyển các Shop
                </p>
                <p className="text-3xl font-bold text-green-700">
                  {formatVND(tongShopHienTai)}
                </p>
              </div>
              <div className="bg-blue-50 p-5 rounded-xl border border-blue-100">
                <p className="text-sm font-semibold text-blue-600 mb-1">
                  Tổng cước chuyển ĐVVC
                </p>
                <p className="text-3xl font-bold text-blue-700">
                  {formatVND(tongDVVCHienTai)}
                </p>
              </div>
            </div>

            {tongDVVCHienTai > 0 && !data.thongTinDVVC && (
              <div className="mb-6 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                <span className="material-symbols-outlined text-amber-600">
                  warning
                </span>
                <p>
                  ĐVVC chưa cấu hình tài khoản nhận tiền. Các đơn đang chọn có
                  cước vận chuyển nên không thể tạo phiếu tất toán cho tới khi
                  ĐVVC cập nhật thông tin nhận tiền.
                </p>
              </div>
            )}

            {/* Bảng đơn hàng cần tất toán */}
            <div className="overflow-x-auto border rounded-xl mb-6">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="p-3 w-12 text-center">
                      <input
                        type="checkbox"
                        checked={
                          coDuLieuTatToan &&
                          selectedDtsMa.length === data.orders.length
                        }
                        onChange={handleSelectAll}
                      />
                    </th>
                    <th className="p-3 font-semibold text-gray-600">Mã Đơn</th>
                    <th className="p-3 font-semibold text-gray-600">
                      Gian Hàng
                    </th>
                    <th className="p-3 font-semibold text-gray-600 text-right">
                      Phí Sàn
                    </th>
                    <th className="p-3 font-semibold text-gray-600 text-right">
                      Tiền Shop Nhận
                    </th>
                    <th className="p-3 font-semibold text-gray-600 text-right">
                      Cước ĐVVC
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {!coDuLieuTatToan && (
                    <tr>
                      <td
                        colSpan={6}
                        className="p-10 text-center text-gray-500"
                      >
                        Không có đơn hàng nào cần tất toán. Tất cả các đơn đã
                        được thanh toán đủ!
                      </td>
                    </tr>
                  )}
                  {(data.orders || []).map((o) => (
                    <tr
                      key={o.DTS_Ma}
                      className={
                        selectedDtsMa.includes(o.DTS_Ma)
                          ? "bg-indigo-50/30"
                          : ""
                      }
                    >
                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          checked={selectedDtsMa.includes(o.DTS_Ma)}
                          onChange={() => handleSelectOne(o.DTS_Ma)}
                        />
                      </td>
                      <td className="p-3 font-medium text-gray-800">
                        {o.DTS_Ma}
                      </td>
                      <td className="p-3 text-gray-600">{o.TenShop}</td>
                      <td className="p-3 text-right text-red-600">
                        <div>{formatVND(o.PhiSan)}</div>
                        {o.DaThuSan && (
                          <span className="text-[11px] font-semibold text-emerald-600">
                            đã thu
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-right font-bold text-green-600">
                        <div>{formatVND(o.TienShop)}</div>
                        {o.DaThuShop && (
                          <span className="text-[11px] font-semibold text-emerald-600">
                            đã thu
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-right font-bold text-blue-600">
                        <div>{formatVND(o.TienDVVC || 0)}</div>
                        {o.DaThuDVVC && (
                          <span className="text-[11px] font-semibold text-emerald-600">
                            đã thu
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="text-center">
              <button
                onClick={handleTaoQr}
                disabled={selectedDtsMa.length === 0}
                className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg text-lg flex items-center justify-center gap-2 mx-auto disabled:bg-gray-400 disabled:cursor-not-allowed transition-all"
              >
                <span className="material-symbols-outlined">
                  qr_code_scanner
                </span>
                Tạo Mã QR Cho Các Đơn Đã Chọn ({selectedDtsMa.length})
              </button>
            </div>
          </div>

          {/* Khối đợt tất toán đang mở */}
          {dsDotDangMo.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-amber-200 p-6 mb-6">
              <div className="flex items-start gap-2 mb-4">
                <span className="material-symbols-outlined text-amber-500">
                  pending_actions
                </span>
                <div>
                  <h2 className="text-lg font-bold text-[#0F172A]">
                    Đợt tất toán đang mở
                  </h2>
                  <p className="text-sm text-[#64748B] mt-1">
                    Các đợt này đã tạo mã QR nhưng chưa thu đủ. Bạn có thể mở lại
                    để quét tiếp các mã còn lại.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {dsDotDangMo.map((dot) => {
                  const soQr = Number(dot.so_qr || 0);
                  const soDaTra = Number(dot.so_qr_da_tra || 0);
                  const phanTram = soQr > 0 ? (soDaTra / soQr) * 100 : 0;

                  return (
                    <div
                      key={dot.ptt_ma}
                      className="border rounded-xl p-4 flex flex-col lg:flex-row lg:items-center gap-4 bg-amber-50/20"
                    >
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-bold text-gray-800">
                            {dot.ptt_ma}
                          </p>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                            {MO_TA_LOAI[dot.ptt_loai] || dot.ptt_loai}
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatDate(dot.ptt_ngay_tat_toan)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          Đã thu{" "}
                          <span className="font-semibold text-emerald-600">
                            {formatVND(dot.da_thu)}
                          </span>{" "}
                          / {formatVND(dot.tong_tien)} · {soDaTra}/{soQr} mã QR
                        </p>
                        <div className="mt-2 h-2 w-full max-w-sm bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 transition-all"
                            style={{ width: `${phanTram}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => moDot(dot)}
                          className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 flex items-center gap-1 shadow-sm"
                        >
                          <span className="material-symbols-outlined text-lg">
                            qr_code_scanner
                          </span>
                          Tiếp tục thanh toán
                        </button>
                        <button
                          onClick={() => handleHuyDot(dot.ptt_ma)}
                          className="px-4 py-2 bg-white border border-red-200 text-red-600 text-sm font-semibold rounded-lg hover:bg-red-50"
                        >
                          Huỷ đợt
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* ========================================================= */}
      {/* TAB 2: LỊCH SỬ TẤT TOÁN                                    */}
      {/* ========================================================= */}
      {activeTab === "LICH_SU" && (
        <div className="bg-white rounded-2xl shadow-sm border border-[#E2E8F0] p-6">
          {/* Bộ lọc lịch sử */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Từ ngày
              </label>
              <input
                type="date"
                value={filterDateFrom}
                onChange={(e) => setFilterDateFrom(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Đến ngày
              </label>
              <input
                type="date"
                value={filterDateTo}
                onChange={(e) => setFilterDateTo(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Trạng thái
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="DA_THANH_TOAN">Hoàn tất</option>
                <option value="CHO_THANH_TOAN">Chờ thanh toán</option>
                <option value="HUY">Đã huỷ</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Tìm kiếm mã phiếu / mã đơn
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && fetchLichSu(1)}
                placeholder="VD: PTT0000001 hoặc DTS..."
                className="w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="flex items-end gap-2">
              <button
                onClick={() => fetchLichSu(1)}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white font-semibold text-sm rounded-xl hover:bg-indigo-700 flex items-center justify-center gap-1 shadow-sm"
              >
                <span className="material-symbols-outlined text-base">
                  search
                </span>
                Tìm kiếm
              </button>
              <button
                onClick={() => {
                  setFilterDateFrom("");
                  setFilterDateTo("");
                  setFilterStatus("ALL");
                  setSearchTerm("");
                }}
                title="Đặt lại bộ lọc"
                className="px-3 py-2 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 text-sm"
              >
                <span className="material-symbols-outlined text-base">
                  restart_alt
                </span>
              </button>
            </div>
          </div>

          {/* Bảng danh sách lịch sử */}
          {lichSuLoading ? (
            <div className="py-12 text-center text-gray-500 font-medium">
              Đang tải lịch sử tất toán...
            </div>
          ) : (
            <>
              <div className="overflow-x-auto border rounded-xl mb-4">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="p-3 font-semibold text-gray-600">
                        Mã Phiếu
                      </th>
                      <th className="p-3 font-semibold text-gray-600">
                        Ngày Tạo
                      </th>
                      <th className="p-3 font-semibold text-gray-600 text-center">
                        Số Đơn
                      </th>
                      <th className="p-3 font-semibold text-gray-600 text-right">
                        Tổng Tiền
                      </th>
                      <th className="p-3 font-semibold text-gray-600 text-right">
                        Thực Thu
                      </th>
                      <th className="p-3 font-semibold text-gray-600 text-center">
                        Tiến Độ QR
                      </th>
                      <th className="p-3 font-semibold text-gray-600 text-center">
                        Trạng Thái
                      </th>
                      <th className="p-3 font-semibold text-gray-600 text-center">
                        Thao Tác
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {lichSuList.length === 0 ? (
                      <tr>
                        <td
                          colSpan={8}
                          className="p-10 text-center text-gray-500"
                        >
                          Không có dữ liệu tất toán nào phù hợp với bộ lọc.
                        </td>
                      </tr>
                    ) : (
                      lichSuList.map((item) => {
                        const badge =
                          TRANG_THAI_BADGE[item.ptt_trang_thai_thanh_toan] || {
                            label: item.ptt_trang_thai_thanh_toan,
                            bg: "bg-gray-100 text-gray-700 border-gray-200",
                            dot: "bg-gray-400",
                          };
                        const phanTram =
                          item.so_qr > 0
                            ? (item.so_qr_da_tra / item.so_qr) * 100
                            : 0;

                        return (
                          <tr
                            key={item.ptt_ma}
                            className="hover:bg-gray-50/70 transition-colors"
                          >
                            <td className="p-3 font-bold text-indigo-700">
                              {item.ptt_ma}
                              <div className="text-[11px] font-normal text-gray-500">
                                {MO_TA_LOAI[item.ptt_loai] || item.ptt_loai}
                              </div>
                            </td>
                            <td className="p-3 text-gray-600 text-xs">
                              <div>{formatDate(item.ptt_ngay_tat_toan)}</div>
                              {item.ptt_thoi_diem_hoan_tat && (
                                <div className="text-emerald-600 text-[11px]">
                                  Xong:{" "}
                                  {formatDate(item.ptt_thoi_diem_hoan_tat)}
                                </div>
                              )}
                            </td>
                            <td className="p-3 text-center font-semibold text-gray-700">
                              {item.so_don}
                            </td>
                            <td className="p-3 text-right font-medium text-gray-800">
                              {formatVND(item.tong_tien)}
                            </td>
                            <td className="p-3 text-right font-bold text-emerald-600">
                              {formatVND(item.da_thu)}
                            </td>
                            <td className="p-3 text-center">
                              <span className="text-xs font-semibold text-gray-700">
                                {item.so_qr_da_tra}/{item.so_qr} QR
                              </span>
                              <div className="mt-1 h-1.5 w-20 mx-auto bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-emerald-500"
                                  style={{ width: `${phanTram}%` }}
                                />
                              </div>
                            </td>
                            <td className="p-3 text-center">
                              <span
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${badge.bg}`}
                              >
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${badge.dot}`}
                                />
                                {badge.label}
                              </span>
                            </td>
                            <td className="p-3 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  onClick={() =>
                                    handleXemChiTiet(item.ptt_ma)
                                  }
                                  title="Xem chi tiết đợt tất toán"
                                  className="px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg text-xs font-semibold flex items-center gap-1"
                                >
                                  <span className="material-symbols-outlined text-base">
                                    visibility
                                  </span>
                                  Chi tiết
                                </button>
                                {item.ptt_trang_thai_thanh_toan ===
                                  "CHO_THANH_TOAN" && (
                                  <button
                                    onClick={() => moDot(item)}
                                    title="Tiếp tục quét QR"
                                    className="px-2 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-semibold flex items-center"
                                  >
                                    <span className="material-symbols-outlined text-base">
                                      qr_code_scanner
                                    </span>
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Phân trang */}
              {lichSuPagination.totalPages > 1 && (
                <div className="flex items-center justify-between text-sm text-gray-600 px-2">
                  <p>
                    Hiển thị trang{" "}
                    <span className="font-semibold text-gray-900">
                      {lichSuPagination.page}
                    </span>{" "}
                    / {lichSuPagination.totalPages} (Tổng{" "}
                    {lichSuPagination.total} đợt)
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        fetchLichSu(Math.max(1, lichSuPagination.page - 1))
                      }
                      disabled={lichSuPagination.page <= 1}
                      className="px-3 py-1.5 border rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Trang trước
                    </button>
                    <button
                      onClick={() =>
                        fetchLichSu(
                          Math.min(
                            lichSuPagination.totalPages,
                            lichSuPagination.page + 1,
                          ),
                        )
                      }
                      disabled={
                        lichSuPagination.page >= lichSuPagination.totalPages
                      }
                      className="px-3 py-1.5 border rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Trang sau
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL CHI TIẾT LỊCH SỬ                                     */}
      {/* ========================================================= */}
      {detailModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl p-6 my-8 max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center border-b pb-4 mb-4">
              <div>
                <h3 className="text-xl font-bold text-[#0F172A] flex items-center gap-2">
                  Chi Tiết Đợt Tất Toán
                  {selectedPhieuDetail?.phieu?.ptt_ma && (
                    <span className="text-indigo-600 font-mono text-base bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-200">
                      {selectedPhieuDetail.phieu.ptt_ma}
                    </span>
                  )}
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Thời gian tạo:{" "}
                  {formatDate(
                    selectedPhieuDetail?.phieu?.ptt_ngay_tat_toan,
                  )}
                  {selectedPhieuDetail?.phieu?.ptt_thoi_diem_hoan_tat && (
                    <>
                      {" "}
                      · Hoàn tất:{" "}
                      {formatDate(
                        selectedPhieuDetail.phieu.ptt_thoi_diem_hoan_tat,
                      )}
                    </>
                  )}
                </p>
              </div>
              <button
                onClick={() => setDetailModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <span className="material-symbols-outlined text-2xl">
                  close
                </span>
              </button>
            </div>

            {detailLoading || !selectedPhieuDetail ? (
              <div className="py-16 text-center text-gray-500 font-medium">
                Đang tải chi tiết phiếu...
              </div>
            ) : (
              <div className="overflow-y-auto space-y-6 pr-1">
                {/* Thống kê tài chính của đợt */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                    <p className="text-xs text-gray-500">Tổng tiền đợt</p>
                    <p className="text-base font-bold text-gray-900 mt-0.5">
                      {formatVND(selectedPhieuDetail.phieu.tong_tien)}
                    </p>
                  </div>
                  <div className="bg-red-50 p-3 rounded-xl border border-red-100">
                    <p className="text-xs text-red-600 font-semibold">
                      Phí Sàn
                    </p>
                    <p className="text-base font-bold text-red-700 mt-0.5">
                      {formatVND(
                        selectedPhieuDetail.phieu.ptt_tong_tien_san,
                      )}
                    </p>
                  </div>
                  <div className="bg-green-50 p-3 rounded-xl border border-green-100">
                    <p className="text-xs text-green-600 font-semibold">
                      Tiền các Shop
                    </p>
                    <p className="text-base font-bold text-green-700 mt-0.5">
                      {formatVND(
                        selectedPhieuDetail.phieu.ptt_tong_tien_shop,
                      )}
                    </p>
                  </div>
                  <div className="bg-blue-50 p-3 rounded-xl border border-blue-100">
                    <p className="text-xs text-blue-600 font-semibold">
                      Cước ĐVVC
                    </p>
                    <p className="text-base font-bold text-blue-700 mt-0.5">
                      {formatVND(
                        selectedPhieuDetail.phieu.ptt_tong_tien_dvvc,
                      )}
                    </p>
                  </div>
                </div>

                {/* Danh sách các mã QR */}
                <div>
                  <h4 className="text-sm font-bold text-gray-800 mb-2 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-indigo-600 text-lg">
                      qr_code
                    </span>
                    Danh Sách Khoản Thu / Mã QR (
                    {selectedPhieuDetail.ds_qr?.length || 0})
                  </h4>
                  <div className="space-y-2">
                    {(selectedPhieuDetail.ds_qr || []).map((qr) => {
                      const daThu = qr.qr_trang_thai === "DA_THANH_TOAN";
                      const daHuy = qr.qr_trang_thai === "HUY";

                      return (
                        <div
                          key={qr.qr_ma}
                          className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                            daThu
                              ? "bg-emerald-50/50 border-emerald-200"
                              : daHuy
                                ? "bg-gray-100 border-gray-200"
                                : "bg-amber-50/50 border-amber-200"
                          }`}
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-sm text-gray-900">
                                {qr.qr_ma}
                              </span>
                              <span
                                className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                                  qr.qr_loai === "SAN"
                                    ? "bg-red-100 text-red-700"
                                    : qr.qr_loai === "SHOP"
                                      ? "bg-green-100 text-green-700"
                                      : "bg-blue-100 text-blue-700"
                                }`}
                              >
                                {qr.qr_loai === "SAN"
                                  ? "Sàn (Admin)"
                                  : qr.qr_loai === "SHOP"
                                    ? qr.gh_ten || "Shop"
                                    : qr.dvvc_ten || "ĐVVC"}
                              </span>
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              Tài khoản nhận:{" "}
                              <span className="font-medium text-gray-700">
                                {qr.ngan_hang?.so_tai_khoan} -{" "}
                                {qr.ngan_hang?.nganhang_ten}
                              </span>{" "}
                              ({qr.ngan_hang?.ten_tai_khoan})
                            </div>
                            {qr.qr_ma_giao_dich && (
                              <div className="text-[11px] text-emerald-700 font-mono mt-0.5">
                                Mã GD Ngân hàng: {qr.qr_ma_giao_dich} · Lúc:{" "}
                                {formatDate(qr.qr_thoi_diem_tt)}
                              </div>
                            )}
                          </div>

                          <div className="text-right">
                            <p className="font-bold text-base text-gray-900">
                              {formatVND(qr.qr_so_tien)}
                            </p>
                            <span
                              className={`inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full mt-1 ${
                                daThu
                                  ? "bg-emerald-100 text-emerald-800"
                                  : daHuy
                                    ? "bg-gray-200 text-gray-700"
                                    : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              {daThu
                                ? "Đã nhận tiền"
                                : daHuy
                                  ? "Đã huỷ"
                                  : "Chưa thanh toán"}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Danh sách các đơn hàng */}
                <div>
                  <h4 className="text-sm font-bold text-gray-800 mb-2 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-indigo-600 text-lg">
                      local_shipping
                    </span>
                    Danh Sách Đơn Hàng Thuộc Đợt (
                    {selectedPhieuDetail.ds_don?.length || 0})
                  </h4>
                  <div className="overflow-x-auto border rounded-xl max-h-60">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-gray-50 border-b sticky top-0">
                        <tr>
                          <th className="p-2.5 font-semibold text-gray-600">
                            Mã Đơn
                          </th>
                          <th className="p-2.5 font-semibold text-gray-600">
                            Gian Hàng
                          </th>
                          <th className="p-2.5 font-semibold text-gray-600 text-right">
                            Phí Sàn
                          </th>
                          <th className="p-2.5 font-semibold text-gray-600 text-right">
                            Tiền Shop
                          </th>
                          <th className="p-2.5 font-semibold text-gray-600 text-right">
                            Cước ĐVVC
                          </th>
                          <th className="p-2.5 font-semibold text-gray-600 text-right">
                            Tổng Đơn
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {(selectedPhieuDetail.ds_don || []).map((don) => (
                          <tr key={don.dts_ma} className="hover:bg-gray-50">
                            <td className="p-2.5 font-medium text-gray-800">
                              {don.dts_ma}
                            </td>
                            <td className="p-2.5 text-gray-600">
                              {don.gh_ten}
                            </td>
                            <td className="p-2.5 text-right text-red-600">
                              {formatVND(don.ctt_tien_san)}
                            </td>
                            <td className="p-2.5 text-right text-green-600 font-medium">
                              {formatVND(don.ctt_tien_shop)}
                            </td>
                            <td className="p-2.5 text-right text-blue-600 font-medium">
                              {formatVND(don.ctt_tien_dvvc)}
                            </td>
                            <td className="p-2.5 text-right font-bold text-gray-900">
                              {formatVND(don.tong_tien_don)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-4 pt-3 border-t text-right">
              <button
                onClick={() => setDetailModalOpen(false)}
                className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl text-sm"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL QUÉT MÃ QR (ĐANG MỞ)                                 */}
      {/* ========================================================= */}
      {showQR && activeDot && (
        <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-5xl shadow-2xl p-6 my-8">
            <div className="flex justify-between items-center border-b pb-4 mb-6 gap-4">
              <div>
                <h3 className="text-2xl font-bold text-[#0F172A]">
                  Quét Mã Thanh Toán
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Mỗi mã QR là một khoản thu độc lập. Mã nào đã nhận tiền sẽ
                  được ghi nhận ngay, không cần chờ đủ cả đợt.
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div
                  className={`px-4 py-2 rounded-xl font-bold text-lg flex items-center gap-2 ${
                    timeLeft <= 30
                      ? "bg-red-100 text-red-600 animate-pulse"
                      : "bg-orange-100 text-orange-600"
                  }`}
                >
                  <span className="material-symbols-outlined">timer</span>
                  {formatTime(timeLeft)}
                </div>
                <button
                  onClick={handleCloseQR}
                  title="Đóng bảng (không huỷ đợt)"
                  className="text-gray-500 hover:text-red-500"
                >
                  <span className="material-symbols-outlined text-2xl">
                    close
                  </span>
                </button>
              </div>
            </div>

            <div className="mb-5 flex flex-wrap items-center gap-3 text-sm">
              <span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 font-semibold">
                {activeDot.ptt_ma}
              </span>
              <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-600 font-semibold">
                {MO_TA_LOAI[activeDot.ptt_loai] || activeDot.ptt_loai}
              </span>
              <span className="text-gray-600">
                Đã thu{" "}
                <span className="font-bold text-emerald-600">
                  {formatVND(daThuModal)}
                </span>{" "}
                / {formatVND(tongTienModal)} · {soQrDaTraModal}/{soQrModal} mã
                QR
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {dsQrModal.length === 0 && (
                <div className="col-span-full text-center text-gray-500 py-10">
                  Đợt này không có mã QR nào.
                </div>
              )}

              {dsQrModal.map((qr) => {
                const status = qrStatusOf(qr);
                const daTra = status === "DA_THANH_TOAN";
                const daHuy = status === "HUY";

                const mauTieuDe =
                  qr.qr_loai === "SAN"
                    ? "text-red-600"
                    : qr.qr_loai === "SHOP"
                      ? "text-green-600"
                      : "text-blue-600";

                return (
                  <div
                    key={qr.qr_ma}
                    className={`border rounded-2xl p-4 flex flex-col items-center text-center relative overflow-hidden transition-all ${
                      daTra
                        ? "bg-green-50 border-green-300"
                        : daHuy
                          ? "bg-gray-100 border-gray-300"
                          : "bg-gray-50"
                    }`}
                  >
                    {daTra && (
                      <div className="absolute inset-0 bg-white/80 flex flex-col items-center justify-center rounded-2xl z-10 backdrop-blur-sm">
                        <span className="material-symbols-outlined text-6xl text-green-500 mb-2">
                          check_circle
                        </span>
                        <p className="font-bold text-green-600">
                          Đã nhận tiền
                        </p>
                      </div>
                    )}

                    {daHuy && (
                      <div className="absolute inset-0 bg-white/70 flex flex-col items-center justify-center rounded-2xl z-10">
                        <span className="material-symbols-outlined text-6xl text-gray-400 mb-2">
                          cancel
                        </span>
                        <p className="font-bold text-gray-500">Đã huỷ</p>
                      </div>
                    )}

                    <h4
                      className={`font-bold text-lg mb-2 truncate w-full ${mauTieuDe}`}
                    >
                      {qr.qr_loai === "SAN"
                        ? "Chuyển cho Sàn"
                        : qr.qr_loai === "SHOP"
                          ? qr.ten
                          : "Chuyển cho ĐVVC"}
                    </h4>
                    <img
                      src={buildVietQrUrl(
                        qr.ngan_hang,
                        qr.qr_so_tien,
                        qr.qr_ma,
                      )}
                      alt={`QR ${qr.qr_ma}`}
                      className="w-48 h-48 border rounded-xl mb-2 object-contain bg-white"
                    />
                    <p className="font-bold text-gray-800">
                      {formatVND(qr.qr_so_tien)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Nội dung:{" "}
                      <span
                        className={`font-bold ${
                          qr.qr_loai === "SAN"
                            ? "text-red-600"
                            : qr.qr_loai === "SHOP"
                              ? "text-green-600"
                              : "text-blue-600"
                        }`}
                      >
                        {qr.qr_ma}
                      </span>
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="mt-8 pt-4 border-t flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg">
                <span className="animate-spin material-symbols-outlined">
                  sync
                </span>
                <p className="text-sm font-medium">
                  Hệ thống đang tự động kiểm tra tiền về...
                </p>
              </div>
              <button
                onClick={() => handleHuyDot(activeDot.ptt_ma)}
                className="px-4 py-2 bg-white border border-red-200 text-red-600 text-sm font-semibold rounded-lg hover:bg-red-50"
              >
                Huỷ đợt này
              </button>
            </div>
          </div>
        </div>
      )}

      <ToastNotification toast={toast} />
    </div>
  );
};

export default TatToan;
