import React, { useState, useEffect } from "react";
import axiosClient from "../../config/axiosClient";
import { formatVND } from "../../components/shop/SanPhamShared";
import { buildVietQrUrl } from "../../utils/accountUtils";

const ThanhToanVanChuyen = () => {
  const [danhSach, setDanhSach] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showQR, setShowQR] = useState(null);
  const [timeLeft, setTimeLeft] = useState(300);

  // State quản lý xem chi tiết
  const [expandedDvvc, setExpandedDvvc] = useState(null);
  const [chiTietNo, setChiTietNo] = useState({});
  const [loadingDetail, setLoadingDetail] = useState(false);

  const fetchData = async () => {
    try {
      const res = await axiosClient.get(
        "/admin/thanh-toan-van-chuyen/danh-sach-no",
      );
      setDanhSach(res.data);
    } catch (error) {
      console.error("Lỗi tải danh sách nợ:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 🟢 POLLING: Tự động kiểm tra trạng thái phiếu chi mỗi 3 giây
  useEffect(() => {
    if (!showQR) return;

    const interval = setInterval(async () => {
      try {
        const res = await axiosClient.get(
          `/admin/thanh-toan-van-chuyen/trang-thai/${showQR.pcd_ma}`,
        );
        if (res.data && res.data.pcd_trang_thai === "DA_THANH_TOAN") {
          clearInterval(interval);
          alert("Tuyệt vời! ĐVVC đã nhận được tiền thanh toán.");
          setShowQR(null);
          fetchData(); // Load lại danh sách (các đơn nợ sẽ biến mất)
        }
      } catch (error) {
        console.error("Lỗi kiểm tra trạng thái:", error);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [showQR]);

  // Đếm ngược thời gian
  useEffect(() => {
    if (!showQR) return;
    if (timeLeft <= 0) {
      handleAutoHuyPhieu(showQR.pcd_ma);
      return;
    }
    const timerId = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearInterval(timerId);
  }, [showQR, timeLeft]);

  const handleAutoHuyPhieu = async (pcd_ma) => {
    try {
      await axiosClient.delete(
        `/admin/thanh-toan-van-chuyen/huy-phieu/${pcd_ma}`,
      );
      alert("Mã QR đã hết hạn do quá 5 phút. Phiếu chi đã bị hủy.");
      setShowQR(null);
      fetchData();
    } catch (error) {
      setShowQR(null);
      fetchData();
    }
  };

  const handleToggleDetail = async (dvvc_ma) => {
    if (expandedDvvc === dvvc_ma) {
      setExpandedDvvc(null);
      return;
    }
    setExpandedDvvc(dvvc_ma);

    if (!chiTietNo[dvvc_ma]) {
      setLoadingDetail(true);
      try {
        const res = await axiosClient.get(
          `/admin/thanh-toan-van-chuyen/chi-tiet-no/${dvvc_ma}`,
        );
        setChiTietNo((prev) => ({ ...prev, [dvvc_ma]: res.data }));
      } catch (error) {
        console.error("Lỗi lấy chi tiết đơn", error);
      } finally {
        setLoadingDetail(false);
      }
    }
  };

  const handleTaoPhieuChi = async (dvvc_ma) => {
    if (
      !window.confirm("Tạo phiếu chi thanh toán toàn bộ đơn nợ cho ĐVVC này?")
    )
      return;
    try {
      const res = await axiosClient.post(
        `/admin/thanh-toan-van-chuyen/tao-phieu/${dvvc_ma}`,
      );
      setShowQR(res.data);
      setTimeLeft(300);
    } catch (error) {
      alert(error.response?.data?.message || "Lỗi tạo phiếu");
    }
  };

  const handleHuyPhieu = async (pcd_ma) => {
    if (!window.confirm("Bạn có chắc muốn đóng? Phiếu chi này sẽ bị hủy."))
      return;
    try {
      await axiosClient.delete(
        `/admin/thanh-toan-van-chuyen/huy-phieu/${pcd_ma}`,
      );
      setShowQR(null);
      fetchData();
    } catch (error) {
      alert("Lỗi khi hủy phiếu chi");
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  if (loading)
    return (
      <div className="p-10 text-center text-gray-500">Đang tải dữ liệu...</div>
    );

  return (
    <div className="p-6 bg-[#F8FAFC] min-h-screen">
      {/* HEADER */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#0F172A]">
          Thanh Toán Voucher Vận Chuyển
        </h1>
        <p className="text-sm text-[#64748B] mt-1">
          Chi trả các khoản phí ship do Sàn giảm giá cho ĐVVC.
        </p>
      </div>

      {/* BẢNG DANH SÁCH */}
      <div className="bg-white rounded-2xl shadow-sm border border-[#E2E8F0] p-6">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="p-4 font-semibold text-gray-600">ĐVVC</th>
              <th className="p-4 font-semibold text-gray-600 text-center">
                Số Đơn Nợ
              </th>
              <th className="p-4 font-semibold text-gray-600 text-right">
                Tổng Tiền Cần Trả
              </th>
              <th className="p-4 font-semibold text-gray-600 text-center">
                Hành Động
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {danhSach.length === 0 ? (
              <tr>
                <td colSpan="4" className="p-6 text-center text-gray-500">
                  Không có ĐVVC nào cần thanh toán.
                </td>
              </tr>
            ) : (
              danhSach.map((dvvc) => (
                <React.Fragment key={dvvc.dvvc_ma}>
                  <tr
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => handleToggleDetail(dvvc.dvvc_ma)}
                  >
                    <td className="p-4 font-bold flex items-center gap-2">
                      <span className="material-symbols-outlined text-gray-400 text-[18px]">
                        {expandedDvvc === dvvc.dvvc_ma
                          ? "expand_less"
                          : "expand_more"}
                      </span>
                      {dvvc.dvvc_ten}
                    </td>
                    <td className="p-4 text-center">{dvvc.so_don}</td>
                    <td className="p-4 text-right text-red-600 font-bold">
                      {formatVND(dvvc.tong_tien_no)}
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTaoPhieuChi(dvvc.dvvc_ma);
                        }}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-indigo-700 transition-colors"
                      >
                        Tạo QR Thanh Toán
                      </button>
                    </td>
                  </tr>

                  {expandedDvvc === dvvc.dvvc_ma && (
                    <tr>
                      <td colSpan="4" className="p-0 bg-gray-50 border-b">
                        <div className="p-4">
                          <h4 className="font-semibold text-gray-700 mb-2">
                            Chi tiết các đơn nợ:
                          </h4>
                          {loadingDetail ? (
                            <p className="text-sm text-gray-500 py-2">
                              Đang tải chi tiết...
                            </p>
                          ) : (
                            <table className="w-full text-xs bg-white border rounded-lg overflow-hidden">
                              <thead className="bg-gray-100 border-b">
                                <tr>
                                  <th className="p-2 text-left">Mã Đơn Hàng</th>
                                  <th className="p-2 text-right">
                                    Tiền Ship Cần Trả (Voucher)
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {chiTietNo[dvvc.dvvc_ma]?.map((don) => (
                                  <tr
                                    key={don.dts_ma}
                                    className="border-b last:border-0 hover:bg-gray-50"
                                  >
                                    <td className="p-2 font-medium text-indigo-600">
                                      {don.dts_ma}
                                    </td>
                                    <td className="p-2 text-right font-bold text-green-600">
                                      {formatVND(don.tien_ship)}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL HIỂN THỊ QR */}
      {showQR && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999] backdrop-blur-sm p-4">
          <div className="bg-white p-6 rounded-3xl w-full max-w-sm text-center shadow-2xl">
            <div className="flex justify-between items-center mb-4 border-b pb-3">
              <h3 className="text-xl font-bold text-[#0F172A]">
                Quét QR Thanh Toán
              </h3>

              <div className="flex items-center gap-3">
                <div
                  className={`px-3 py-1 rounded-lg font-bold text-sm flex items-center gap-1 ${timeLeft <= 60 ? "bg-red-100 text-red-600 animate-pulse" : "bg-orange-100 text-orange-600"}`}
                >
                  <span className="material-symbols-outlined text-[16px]">
                    timer
                  </span>
                  {formatTime(timeLeft)}
                </div>
                <button
                  onClick={() => handleHuyPhieu(showQR.pcd_ma)}
                  className="text-gray-400 hover:text-red-500"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
            </div>

            {showQR.thongTinNganHang && showQR.thongTinNganHang.so_tai_khoan ? (
              <img
                src={buildVietQrUrl(
                  showQR.thongTinNganHang,
                  showQR.tong_tien,
                  showQR.pcd_ma,
                )}
                alt="QR Thanh Toán"
                className="w-64 h-64 mx-auto mb-4 border rounded-xl object-contain bg-white"
              />
            ) : (
              <div className="w-64 h-64 mx-auto mb-4 flex flex-col items-center justify-center bg-red-50 rounded-xl text-red-500 text-sm text-center px-4 border border-red-200">
                <span className="material-symbols-outlined text-4xl mb-2">
                  warning
                </span>
                ĐVVC này chưa cấu hình Số tài khoản ngân hàng!
              </div>
            )}

            <p className="text-2xl text-red-600 font-bold mb-1">
              {formatVND(showQR.tong_tien)}
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Nội dung:{" "}
              <strong className="text-indigo-600 text-base">
                {showQR.pcd_ma}
              </strong>
            </p>

            {/* Trạng thái chờ thanh toán */}
            <div className="mb-4 flex items-center justify-center gap-2 text-blue-600 bg-blue-50 py-2 rounded-lg">
              <span className="animate-spin material-symbols-outlined text-[18px]">
                sync
              </span>
              <p className="text-sm font-medium">Đang chờ tiền về...</p>
            </div>

            <div className="flex gap-3 mt-4">
              <button
                onClick={() => handleHuyPhieu(showQR.pcd_ma)}
                className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 transition-colors"
              >
                Đóng & Hủy Phiếu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ThanhToanVanChuyen;
