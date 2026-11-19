import { useState, useEffect, useContext, useMemo, useRef } from "react";
import { AuthContext } from "../../contexts/AuthContext";
import qlkTaiChinhService from "../../services/quanlykho/taiChinhService";
import { formatVND } from "../../components/shop/SanPhamShared";
import ToastNotification from "../../components/common/Crud/ToastNotification";
import { buildVietQrUrl } from "../../utils/accountUtils";

const DU_LIEU_TAT_TOAN_RONG = { thongTinSan: null, thongTinDVVC: null, orders: [] };
const DU_LIEU_CUOC_TON_RONG = { thongTinDVVC: null, orders: [] };

const TatToan = () => {
  const { user } = useContext(AuthContext);
  const kho_ma = user?.kho_ma;

  const [data, setData] = useState(DU_LIEU_TAT_TOAN_RONG);
  const [cuocTon, setCuocTon] = useState(DU_LIEU_CUOC_TON_RONG);
  const [loading, setLoading] = useState(true);

  const [showQR, setShowQR] = useState(false);
  const [pttMa, setPttMa] = useState(null);
  const [qrMode, setQrMode] = useState("DAY_DU"); // DAY_DU | CUOC_TON
  const [qrAmounts, setQrAmounts] = useState({ san: 0, shops: {}, dvvc: 0 });
  const [qrStatuses, setQrStatuses] = useState({});
  const [timeLeft, setTimeLeft] = useState(120);

  const [selectedDtsMa, setSelectedDtsMa] = useState([]);
  const [selectedCuocTon, setSelectedCuocTon] = useState([]);

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
    try {
      const [tatToanRes, cuocTonRes] = await Promise.all([
        qlkTaiChinhService.getDuLieuTatToan(kho_ma),
        qlkTaiChinhService.getCuocTon(kho_ma),
      ]);

      const tatToanData = tatToanRes.data || DU_LIEU_TAT_TOAN_RONG;
      setData(tatToanData);
      setCuocTon(cuocTonRes.data || DU_LIEU_CUOC_TON_RONG);
      setSelectedDtsMa((tatToanData.orders || []).map((o) => o.DTS_Ma));
      setSelectedCuocTon([]);
    } catch (err) {
      showToast(err.response?.data?.message || "Lỗi tải dữ liệu", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!kho_ma) return;
    fetchData();
  }, [kho_ma]);

  useEffect(() => () => stopPolling(), []);

  useEffect(() => {
    if (!showQR) return;
    if (timeLeft <= 0) {
      stopPolling();
      setShowQR(false);
      showToast("Mã QR đã hết hạn do quá 2 phút. Vui lòng tạo lại.", "error");
      fetchData();
      return;
    }
    const timerId = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearInterval(timerId);
  }, [showQR, timeLeft]);

  // Tính toán tiền tất toán mới (Shop + Sàn + ĐVVC)
  const { tongSanHienTai, tongShopHienTai, tongDVVCHienTai, danhSachShopQR } =
    useMemo(() => {
      let san = 0;
      let dvvc = 0;
      const shopMap = {};

      (data.orders || []).forEach((o) => {
        if (!selectedDtsMa.includes(o.DTS_Ma)) return;

        san += Number(o.PhiSan);
        dvvc += Number(o.TienDVVC || 0);

        if (!shopMap[o.GH_Ma]) {
          shopMap[o.GH_Ma] = {
            tong_tien: 0,
            gh_ma: o.GH_Ma,
            ten_shop: o.TenShop,
            nganhang_ma: o.NganHang_Ma,
            nganhang_ten: o.NganHang_Ten,
            so_taikhoan: o.SoTaiKhoan,
            ten_taikhoan: o.TenTaiKhoan,
          };
        }
        shopMap[o.GH_Ma].tong_tien += Number(o.TienShop);
      });

      const shopTotal = Object.values(shopMap).reduce(
        (sum, s) => sum + s.tong_tien,
        0,
      );

      return {
        tongSanHienTai: san,
        tongShopHienTai: shopTotal,
        tongDVVCHienTai: dvvc,
        danhSachShopQR: shopMap,
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
    if (e.target.checked) setSelectedDtsMa((data.orders || []).map((o) => o.DTS_Ma));
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
          showToast("Phiếu tất toán đã hết hạn. Vui lòng tạo lại.", "error");
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

      setPttMa(res.data.ptt_ma);
      setQrMode("DAY_DU");
      setQrAmounts({
        san: tongSanHienTai,
        shops: danhSachShopQR,
        dvvc: Number(res.data.tong_dvvc ?? tongDVVCHienTai),
      });
      setQrStatuses({});
      setTimeLeft(120);
      setShowQR(true);
      startPolling(res.data.ptt_ma);
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

      setPttMa(res.data.ptt_ma);
      setQrMode("CUOC_TON");
      setQrAmounts({
        san: 0,
        shops: {},
        dvvc: Number(res.data.tong_dvvc ?? tongCuocTonHienTai),
      });
      setQrStatuses({});
      setTimeLeft(120);
      setShowQR(true);
      startPolling(res.data.ptt_ma);
    } catch (err) {
      showToast(err.response?.data?.message || "Lỗi tạo mã QR", "error");
    }
  };

  const handleCloseQR = async () => {
    if (
      window.confirm(
        "Bạn chưa thanh toán. Nếu đóng bảng này, phiếu tất toán sẽ bị hủy. Đồng ý?",
      )
    ) {
      try {
        await qlkTaiChinhService.huyPhieuTatToan(pttMa);
        stopPolling();
        setShowQR(false);
        setPttMa(null);
        fetchData();
      } catch (err) {
        showToast("Lỗi hủy phiếu", "error");
      }
    }
  };

  const isQrPaid = (qrCodeString) =>
    qrStatuses[qrCodeString] === "DA_THANH_TOAN";

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

  const thongTinDVVC =
    qrMode === "CUOC_TON" ? cuocTon.thongTinDVVC : data.thongTinDVVC;
  const coDuLieuTatToan = (data.orders || []).length > 0;
  const coDuLieuCuocTon = (cuocTon.orders || []).length > 0;

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
                    {formatVND(o.PhiSan)}
                  </td>
                  <td className="p-3 text-right font-bold text-green-600">
                    {formatVND(o.TienShop)}
                  </td>
                  <td className="p-3 text-right font-bold text-blue-600">
                    {formatVND(o.TienDVVC || 0)}
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
                  <td className="p-3 text-gray-600">{o.PTT_Goc}</td>
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
            disabled={
              selectedCuocTon.length === 0 || !cuocTon.thongTinDVVC
            }
            className="px-8 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg text-lg flex items-center justify-center gap-2 mx-auto disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined">qr_code_scanner</span>
            Tạo Mã QR Cước Tồn ({selectedCuocTon.length})
          </button>
        </div>
      </div>

      {/* ===== MODAL QR ===== */}
      {showQR && pttMa && (
        <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-5xl shadow-2xl p-6 my-8">
            <div className="flex justify-between items-center border-b pb-4 mb-6">
              <div>
                <h3 className="text-2xl font-bold text-[#0F172A]">
                  Quét Mã Thanh Toán
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Vui lòng thanh toán trước khi hết thời gian
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
                  className="text-gray-500 hover:text-red-500"
                >
                  <span className="material-symbols-outlined text-2xl">
                    close
                  </span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {qrMode === "DAY_DU" && (
                <>
                  {/* Thẻ Sàn */}
                  <div
                    className={`border rounded-2xl p-4 flex flex-col items-center text-center relative overflow-hidden transition-all ${isQrPaid(`TT${pttMa}S`) ? "bg-green-50 border-green-300" : "bg-gray-50"}`}
                  >
                    {isQrPaid(`TT${pttMa}S`) && (
                      <div className="absolute inset-0 bg-white/80 flex flex-col items-center justify-center rounded-2xl z-10 backdrop-blur-sm">
                        <span className="material-symbols-outlined text-6xl text-green-500 mb-2">
                          check_circle
                        </span>
                        <p className="font-bold text-green-600">
                          Sàn đã nhận tiền
                        </p>
                      </div>
                    )}
                    <h4 className="font-bold text-lg text-red-600 mb-2">
                      Chuyển cho Sàn
                    </h4>
                    <img
                      src={buildVietQrUrl(
                        data.thongTinSan,
                        qrAmounts.san,
                        `TT${pttMa}S`,
                      )}
                      alt="QR San"
                      className="w-48 h-48 border rounded-xl mb-2 object-contain bg-white"
                    />
                    <p className="font-bold text-gray-800">
                      {formatVND(qrAmounts.san)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Nội dung:{" "}
                      <span className="font-bold text-red-600">TT{pttMa}S</span>
                    </p>
                  </div>

                  {/* Thẻ các Shop */}
                  {Object.entries(qrAmounts.shops).map(([gh_ma, shopData]) => (
                    <div
                      key={gh_ma}
                      className={`border rounded-2xl p-4 flex flex-col items-center text-center relative overflow-hidden transition-all ${isQrPaid(`TT${pttMa}SH${gh_ma}`) ? "bg-green-50 border-green-300" : "bg-gray-50"}`}
                    >
                      {isQrPaid(`TT${pttMa}SH${gh_ma}`) && (
                        <div className="absolute inset-0 bg-white/80 flex flex-col items-center justify-center rounded-2xl z-10 backdrop-blur-sm">
                          <span className="material-symbols-outlined text-6xl text-green-500 mb-2">
                            check_circle
                          </span>
                          <p className="font-bold text-green-600">
                            Shop đã nhận tiền
                          </p>
                        </div>
                      )}
                      <h4 className="font-bold text-lg text-green-600 mb-2 truncate w-full">
                        {shopData.ten_shop}
                      </h4>
                      <img
                        src={buildVietQrUrl(
                          shopData,
                          shopData.tong_tien,
                          `TT${pttMa}SH${gh_ma}`,
                        )}
                        alt={`QR ${shopData.ten_shop}`}
                        className="w-48 h-48 border rounded-xl mb-2 object-contain bg-white"
                      />
                      <p className="font-bold text-gray-800">
                        {formatVND(shopData.tong_tien)}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Nội dung:{" "}
                        <span className="font-bold text-green-600">
                          TT{pttMa}SH{gh_ma}
                        </span>
                      </p>
                    </div>
                  ))}
                </>
              )}

              {/* Thẻ ĐVVC */}
              {qrAmounts.dvvc > 0 && thongTinDVVC && (
                <div
                  className={`border rounded-2xl p-4 flex flex-col items-center text-center relative overflow-hidden transition-all ${isQrPaid(`TT${pttMa}DV`) ? "bg-green-50 border-green-300" : "bg-blue-50/40 border-blue-100"}`}
                >
                  {isQrPaid(`TT${pttMa}DV`) && (
                    <div className="absolute inset-0 bg-white/80 flex flex-col items-center justify-center rounded-2xl z-10 backdrop-blur-sm">
                      <span className="material-symbols-outlined text-6xl text-green-500 mb-2">
                        check_circle
                      </span>
                      <p className="font-bold text-green-600">
                        ĐVVC đã nhận tiền
                      </p>
                    </div>
                  )}
                  <h4 className="font-bold text-lg text-blue-600 mb-2 truncate w-full">
                    Chuyển cho ĐVVC
                  </h4>
                  <img
                    src={buildVietQrUrl(
                      thongTinDVVC,
                      qrAmounts.dvvc,
                      `TT${pttMa}DV`,
                    )}
                    alt="QR ĐVVC"
                    className="w-48 h-48 border rounded-xl mb-2 object-contain bg-white"
                  />
                  <p className="font-bold text-gray-800">
                    {formatVND(qrAmounts.dvvc)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Nội dung:{" "}
                    <span className="font-bold text-blue-600">
                      TT{pttMa}DV
                    </span>
                  </p>
                </div>
              )}
            </div>

            <div className="mt-8 pt-4 border-t text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg">
                <span className="animate-spin material-symbols-outlined">
                  sync
                </span>
                <p className="text-sm font-medium">
                  Hệ thống đang tự động kiểm tra tiền về...
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <ToastNotification toast={toast} />
    </div>
  );
};

export default TatToan;
