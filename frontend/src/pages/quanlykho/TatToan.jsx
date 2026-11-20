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
const DU_LIEU_CUOC_TON_RONG = { thongTinDVVC: null, orders: [] };

const QR_TIME_LIMIT = 120;

const MO_TA_LOAI = {
  DAY_DU: "Tất toán đơn hàng",
  CUOC_TON: "Tất toán cước tồn",
};

const TatToan = () => {
  const { user } = useContext(AuthContext);
  const kho_ma = user?.kho_ma;

  const [data, setData] = useState(DU_LIEU_TAT_TOAN_RONG);
  const [cuocTon, setCuocTon] = useState(DU_LIEU_CUOC_TON_RONG);
  const [loading, setLoading] = useState(true);

  const [showQR, setShowQR] = useState(false);
  const [activeDot, setActiveDot] = useState(null); // { ptt_ma, ptt_loai, ds_qr }
  const [qrStatuses, setQrStatuses] = useState({});
  const [timeLeft, setTimeLeft] = useState(QR_TIME_LIMIT);

  const [selectedDtsMa, setSelectedDtsMa] = useState([]);
  const [selectedCuocTon, setSelectedCuocTon] = useState([]);
  const [cuocTonError, setCuocTonError] = useState(false);

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

  const fetchData = async () => {
    // Tách riêng 2 nguồn: cước tồn lỗi không được làm trắng cả trang tất toán chính
    const [tatToanRes, cuocTonRes] = await Promise.allSettled([
      qlkTaiChinhService.getDuLieuTatToan(kho_ma),
      qlkTaiChinhService.getCuocTon(kho_ma),
    ]);

    if (tatToanRes.status === "fulfilled") {
      const tatToanData = tatToanRes.value.data || DU_LIEU_TAT_TOAN_RONG;
      setData(tatToanData);
      setSelectedDtsMa((tatToanData.orders || []).map((o) => o.DTS_Ma));
    } else {
      showToast(
        tatToanRes.reason?.response?.data?.message ||
          "Lỗi tải danh sách tất toán",
        "error",
      );
    }

    if (cuocTonRes.status === "fulfilled") {
      setCuocTon(cuocTonRes.value.data || DU_LIEU_CUOC_TON_RONG);
      setCuocTonError(false);
    } else {
      setCuocTonError(true);
      console.error("Lỗi tải cước tồn:", cuocTonRes.reason);
    }

    setSelectedCuocTon([]);
    setLoading(false);
  };

  useEffect(() => {
    if (!kho_ma) return;
    fetchData();
  }, [kho_ma]);

  useEffect(() => () => stopPolling(), []);

  useEffect(() => {
    if (!showQR) return;
    if (timeLeft <= 0) {
      // Hết 2 phút chỉ đóng bảng QR. Đợt và các QR chưa quét vẫn còn hiệu lực.
      stopPolling();
      setShowQR(false);
      showToast(
        "Đã hết 2 phút hiển thị mã QR. Đợt tất toán vẫn được giữ — mở mục \"Đợt tất toán đang mở\" để quét tiếp.",
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

  // Tính toán tiền cước tồn đang chọn
  const tongCuocTonHienTai = useMemo(
    () =>
      (cuocTon.orders || [])
        .filter((o) => selectedCuocTon.includes(o.DTS_Ma))
        .reduce((sum, o) => sum + Number(o.TienDVVC || 0), 0),
    [cuocTon, selectedCuocTon],
  );

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

  const handleSelectAllCuocTon = (e) => {
    if (e.target.checked)
      setSelectedCuocTon((cuocTon.orders || []).map((o) => o.DTS_Ma));
    else setSelectedCuocTon([]);
  };

  const handleSelectCuocTon = (dts_ma) => {
    setSelectedCuocTon((prev) =>
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

  const handleTaoQrCuocTon = async () => {
    if (selectedCuocTon.length === 0) {
      return showToast("Vui lòng chọn ít nhất 1 đơn cước tồn!", "error");
    }
    if (!cuocTon.thongTinDVVC) {
      return showToast(
        "ĐVVC chưa cấu hình tài khoản nhận tiền. Không thể tất toán cước.",
        "error",
      );
    }

    try {
      const res = await qlkTaiChinhService.taoPhieuCuocTon({
        kho_ma,
        ds_dts_ma: selectedCuocTon,
      });

      moDot({
        ptt_ma: res.data.ptt_ma,
        ptt_loai: "CUOC_TON",
        ds_qr: res.data.ds_qr || [],
      });
    } catch (err) {
      showToast(err.response?.data?.message || "Lỗi tạo mã QR", "error");
    }
  };

  // Nút X: chỉ đóng bảng, KHÔNG huỷ đợt.
  const handleCloseQR = () => {
    stopPolling();
    setShowQR(false);
    setActiveDot(null);
    fetchData();
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
    } catch (err) {
      showToast(err.response?.data?.message || "Lỗi huỷ đợt", "error");
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
        Đang tải dữ liệu...
      </div>
    );

  const coDuLieuTatToan = (data.orders || []).length > 0;
  const coDuLieuCuocTon = (cuocTon.orders || []).length > 0;
  const dsDotDangMo = data.phieuDangMo || [];

  // Thống kê của đợt đang mở trong modal
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
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#0F172A]">
          Tất Toán Dòng Tiền
        </h1>
        <p className="text-sm text-[#64748B] mt-1">
          Chọn các đơn hàng bên dưới để tính toán và tạo mã QR thanh toán cho
          Sàn, Shop và ĐVVC.
        </p>
      </div>

      {/* ===== TẤT TOÁN MỚI ===== */}
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
              ĐVVC chưa cấu hình tài khoản nhận tiền. Các đơn đang chọn có cước
              vận chuyển nên không thể tạo phiếu tất toán cho tới khi ĐVVC cập
              nhật thông tin nhận tiền.
            </p>
          </div>
        )}

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
                <th className="p-3 font-semibold text-gray-600">Gian Hàng</th>
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
                  <td colSpan={6} className="p-10 text-center text-gray-500">
                    Không có đơn hàng nào cần tất toán.
                  </td>
                </tr>
              )}
              {(data.orders || []).map((o) => (
                <tr
                  key={o.DTS_Ma}
                  className={
                    selectedDtsMa.includes(o.DTS_Ma) ? "bg-indigo-50/30" : ""
                  }
                >
                  <td className="p-3 text-center">
                    <input
                      type="checkbox"
                      checked={selectedDtsMa.includes(o.DTS_Ma)}
                      onChange={() => handleSelectOne(o.DTS_Ma)}
                    />
                  </td>
                  <td className="p-3 font-medium text-gray-800">{o.DTS_Ma}</td>
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
            className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg text-lg flex items-center justify-center gap-2 mx-auto disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined">qr_code_scanner</span>
            Tạo Mã QR Cho Các Đơn Đã Chọn ({selectedDtsMa.length})
          </button>
        </div>
      </div>

      {/* ===== ĐỢT ĐANG MỞ ===== */}
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
                Các đợt này đã tạo mã QR nhưng chưa thu đủ. Bạn có thể mở lại để
                quét tiếp các mã còn lại.
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
                  className="border rounded-xl p-4 flex flex-col lg:flex-row lg:items-center gap-4"
                >
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-bold text-gray-800">{dot.ptt_ma}</p>
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
                    <div className="mt-2 h-2 w-full max-w-sm bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 transition-all"
                        style={{ width: `${phanTram}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => moDot(dot)}
                      className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 flex items-center gap-1"
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

      {/* ===== TẤT TOÁN CƯỚC TỒN ===== */}
      <div className="bg-white rounded-2xl shadow-sm border border-[#E2E8F0] p-6">
        <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
          <div>
            <h2 className="text-lg font-bold text-[#0F172A]">
              Tất toán cước tồn
            </h2>
            <p className="text-sm text-[#64748B] mt-1">
              Các đơn đã tất toán Shop/Sàn trước đây nhưng chưa được tất toán
              cước vận chuyển cho ĐVVC.
            </p>
          </div>
          <div className="rounded-xl bg-blue-50 border border-blue-100 px-4 py-2 text-right">
            <p className="text-xs font-semibold text-blue-600">
              Cước đang chọn
            </p>
            <p className="text-xl font-bold text-blue-700">
              {formatVND(tongCuocTonHienTai)}
            </p>
          </div>
        </div>

        {cuocTonError && (
          <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <span className="material-symbols-outlined text-red-500">
              error
            </span>
            <p>
              Không tải được dữ liệu cước tồn. Có thể database chưa chạy
              migration{" "}
              <span className="font-mono font-semibold">
                2026-11-19_them_tat_toan_dvvc.sql
              </span>
              .
            </p>
          </div>
        )}

        {!cuocTon.thongTinDVVC && coDuLieuCuocTon && (
          <div className="mb-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            <span className="material-symbols-outlined text-amber-600">
              warning
            </span>
            <p>
              ĐVVC chưa cấu hình tài khoản nhận tiền nên chưa thể tất toán cước
              tồn.
            </p>
          </div>
        )}

        <div className="overflow-x-auto border rounded-xl mb-4">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="p-3 w-12 text-center">
                  <input
                    type="checkbox"
                    checked={
                      coDuLieuCuocTon &&
                      selectedCuocTon.length === cuocTon.orders.length
                    }
                    onChange={handleSelectAllCuocTon}
                  />
                </th>
                <th className="p-3 font-semibold text-gray-600">Mã Đơn</th>
                <th className="p-3 font-semibold text-gray-600">Gian Hàng</th>
                <th className="p-3 font-semibold text-gray-600 text-right">
                  Cước ĐVVC
                </th>
                <th className="p-3 font-semibold text-gray-600">Phiếu gốc</th>
                <th className="p-3 font-semibold text-gray-600">
                  Ngày tất toán
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {!coDuLieuCuocTon && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">
                    Không có cước tồn cần tất toán.
                  </td>
                </tr>
              )}
              {(cuocTon.orders || []).map((o) => (
                <tr
                  key={o.DTS_Ma}
                  className={
                    selectedCuocTon.includes(o.DTS_Ma) ? "bg-blue-50/40" : ""
                  }
                >
                  <td className="p-3 text-center">
                    <input
                      type="checkbox"
                      checked={selectedCuocTon.includes(o.DTS_Ma)}
                      onChange={() => handleSelectCuocTon(o.DTS_Ma)}
                    />
                  </td>
                  <td className="p-3 font-medium text-gray-800">{o.DTS_Ma}</td>
                  <td className="p-3 text-gray-600">{o.TenShop}</td>
                  <td className="p-3 text-right font-bold text-blue-600">
                    {formatVND(o.TienDVVC)}
                  </td>
                  <td className="p-3 text-gray-600">{o.PTT_Goc || "—"}</td>
                  <td className="p-3 text-gray-500">
                    {formatDate(o.NgayTatToan)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="text-center">
          <button
            onClick={handleTaoQrCuocTon}
            disabled={selectedCuocTon.length === 0 || !cuocTon.thongTinDVVC}
            className="px-8 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg text-lg flex items-center justify-center gap-2 mx-auto disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined">qr_code_scanner</span>
            Tạo Mã QR Cước Tồn ({selectedCuocTon.length})
          </button>
        </div>
      </div>

      {/* ===== MODAL QR ===== */}
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
                  className={`px-4 py-2 rounded-xl font-bold text-lg flex items-center gap-2 ${timeLeft <= 30 ? "bg-red-100 text-red-600 animate-pulse" : "bg-orange-100 text-orange-600"}`}
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
                / {formatVND(tongTienModal)} · {soQrDaTraModal}/{soQrModal} mã QR
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
                        <p className="font-bold text-green-600">Đã nhận tiền</p>
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
                      src={buildVietQrUrl(qr.ngan_hang, qr.qr_so_tien, qr.qr_ma)}
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
