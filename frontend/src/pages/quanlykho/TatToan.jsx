import { useState, useEffect, useContext, useMemo } from "react";
import { AuthContext } from "../../contexts/AuthContext";
import qlkTaiChinhService from "../../services/quanlykho/taiChinhService";
import { formatVND } from "../../components/shop/SanPhamShared";
import ToastNotification from "../../components/common/Crud/ToastNotification";
import { buildVietQrUrl } from "../../utils/accountUtils";

const TatToan = () => {
  const { user } = useContext(AuthContext);
  const kho_ma = user?.kho_ma;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showQR, setShowQR] = useState(false);
  const [pttMa, setPttMa] = useState(null);
  const [qrStatuses, setQrStatuses] = useState({});
  const [selectedDtsMa, setSelectedDtsMa] = useState([]);
  const [timeLeft, setTimeLeft] = useState(120);

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
    try {
      const res = await qlkTaiChinhService.getDuLieuTatToan(kho_ma);
      setData(res.data);
      if (res.data.orders) {
        setSelectedDtsMa(res.data.orders.map((o) => o.DTS_Ma));
      }
    } catch (err) {
      showToast("Lỗi tải dữ liệu", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [kho_ma]);

  useEffect(() => {
    if (!showQR) return;
    if (timeLeft <= 0) {
      setShowQR(false);
      showToast("Mã QR đã hết hạn do quá 2 phút. Vui lòng tạo lại.", "error");
      fetchData();
      return;
    }
    const timerId = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearInterval(timerId);
  }, [showQR, timeLeft]);

  // Tính toán danh sách tiền của từng Shop
  const { tongSanHienTai, tongShopHienTai, danhSachShopQR } = useMemo(() => {
    if (!data || !data.orders)
      return { tongSanHienTai: 0, tongShopHienTai: 0, danhSachShopQR: {} };
    let san = 0;
    const shopMap = {};

    data.orders.forEach((o) => {
      if (selectedDtsMa.includes(o.DTS_Ma)) {
        san += Number(o.PhiSan);
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
      }
    });

    const shopTotal = Object.values(shopMap).reduce(
      (sum, s) => sum + s.tong_tien,
      0,
    );
    return {
      tongSanHienTai: san,
      tongShopHienTai: shopTotal,
      danhSachShopQR: shopMap,
    };
  }, [data, selectedDtsMa]);

  const handleSelectAll = (e) => {
    if (e.target.checked) setSelectedDtsMa(data.orders.map((o) => o.DTS_Ma));
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
    const interval = setInterval(async () => {
      try {
        const res = await qlkTaiChinhService.getTrangThaiTatToan(ma);

        // Cập nhật trạng thái cho từng mã QR
        const statuses = {};
        res.data.ds_qr.forEach((qr) => {
          statuses[qr.qr_ma] = qr.qr_trang_thai;
        });
        setQrStatuses(statuses);

        if (res.data.trang_thai === "DA_THANH_TOAN") {
          clearInterval(interval);
          showToast("Tất toán hoàn tất! Tất cả QR đã nhận đủ tiền.");
          setShowQR(false);
          fetchData();
        }
      } catch (e) {
        console.error("Lỗi kiểm tra trạng thái:", e);
      }
    }, 3000);
    return interval;
  };

  const handleTaoQr = async () => {
    if (selectedDtsMa.length === 0) {
      return showToast(
        "Vui lòng chọn ít nhất 1 đơn hàng để tất toán!",
        "error",
      );
    }
    try {
      const selectedOrdersData = data.orders.filter((o) =>
        selectedDtsMa.includes(o.DTS_Ma),
      );
      const res = await qlkTaiChinhService.taoPhieuVaQr({
        kho_ma,
        selectedOrders: selectedOrdersData,
      });

      setPttMa(res.data.ptt_ma);
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

  if (loading)
    return (
      <div className="p-10 text-center font-medium text-gray-500">
        Đang tải dữ liệu...
      </div>
    );

  if (!data || !data.orders || data.orders.length === 0) {
    return (
      <div className="p-6 bg-[#F8FAFC] min-h-screen">
        <h1 className="text-2xl font-bold text-[#0F172A] mb-6">
          Tất Toán Dòng Tiền
        </h1>
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-[#E2E8F0]">
          <span className="material-symbols-outlined text-6xl text-gray-300 mb-4">
            account_balance
          </span>
          <p className="text-lg font-bold text-gray-700">
            Không có đơn hàng nào cần tất toán.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-[#F8FAFC] min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#0F172A]">
          Tất Toán Dòng Tiền
        </h1>
        <p className="text-sm text-[#64748B] mt-1">
          Chọn các đơn hàng bên dưới để tính toán và tạo mã QR thanh toán.
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-[#E2E8F0] p-6 mb-6">
        <div className="grid grid-cols-2 gap-6 mb-6">
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
        </div>

        <div className="overflow-x-auto border rounded-xl mb-6">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="p-3 w-12 text-center">
                  <input
                    type="checkbox"
                    checked={selectedDtsMa.length === data.orders.length}
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
              </tr>
            </thead>
            <tbody className="divide-y">
              {data.orders.map((o) => (
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
              {/* Thẻ Sàn */}
              <div
                className={`border rounded-2xl p-4 flex flex-col items-center text-center relative overflow-hidden transition-all ${isQrPaid(`TT${pttMa}S`) ? "bg-green-50 border-green-300" : "bg-gray-50"}`}
              >
                {isQrPaid(`TT${pttMa}S`) && (
                  <div className="absolute inset-0 bg-white/80 flex flex-col items-center justify-center rounded-2xl z-10 backdrop-blur-sm">
                    <span className="material-symbols-outlined text-6xl text-green-500 mb-2">
                      check_circle
                    </span>
                    <p className="font-bold text-green-600">Sàn đã nhận tiền</p>
                  </div>
                )}
                <h4 className="font-bold text-lg text-red-600 mb-2">
                  Chuyển cho Sàn
                </h4>
                <img
                  src={buildVietQrUrl(
                    data.thongTinSan,
                    tongSanHienTai,
                    `TT${pttMa}S`,
                  )}
                  alt="QR San"
                  className="w-48 h-48 border rounded-xl mb-2 object-contain bg-white"
                />
                <p className="font-bold text-gray-800">
                  {formatVND(tongSanHienTai)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Nội dung:{" "}
                  <span className="font-bold text-red-600">TT{pttMa}S</span>
                </p>
              </div>

              {/* Thẻ các Shop */}
              {Object.entries(danhSachShopQR).map(([gh_ma, shopData]) => (
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
