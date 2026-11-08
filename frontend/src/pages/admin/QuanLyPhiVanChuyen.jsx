import React, { useState, useEffect } from "react";
import phiVanChuyenService from "../../services/san/phiVanChuyenService";
import { formatVND } from "../../components/shop/SanPhamShared";

const QuanLyPhiVanChuyen = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await phiVanChuyenService.getAdmin();
        setData(res.data);
      } catch (error) {
        console.error("Lỗi tải danh sách phí vận chuyển:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading)
    return (
      <div className="p-10 text-center text-gray-500">Đang tải dữ liệu...</div>
    );

  return (
    <div className="p-6 bg-[#F8FAFC] min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#0F172A]">
          Quản Lý Phí Vận Chuyển
        </h1>
        <p className="text-sm text-[#64748B] mt-1">
          Theo dõi chi phí ship của tất cả đơn hàng và trạng thái chi trả.
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-[#E2E8F0] p-6">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="p-4 font-semibold text-gray-600">Mã Đơn</th>
              <th className="p-4 font-semibold text-gray-600">Ngày Đặt</th>
              <th className="p-4 font-semibold text-gray-600">ĐVVC</th>
              <th className="p-4 font-semibold text-gray-600 text-right">
                Phí Ship Gốc
              </th>
              <th className="p-4 font-semibold text-gray-600 text-right">
                Voucher Ship (Sàn Bù)
              </th>
              <th className="p-4 font-semibold text-gray-600 text-center">
                Trạng Thái
              </th>
              <th className="p-4 font-semibold text-gray-600">Ghi Chú</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {data.map((item) => (
              <tr key={item.dts_ma} className="hover:bg-gray-50">
                <td className="p-4 font-bold text-indigo-600">{item.dts_ma}</td>
                <td className="p-4">
                  {new Date(item.dts_ngaylap).toLocaleDateString("vi-VN")}
                </td>
                <td className="p-4">{item.dvvc_ten}</td>
                <td className="p-4 text-right font-medium">
                  {formatVND(item.phi_ship_goc)}
                </td>
                <td className="p-4 text-right font-bold text-red-600">
                  {Number(item.voucher_ship) > 0
                    ? `-${formatVND(item.voucher_ship)}`
                    : formatVND(0)}
                </td>
                <td className="p-4 text-center">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      item.trang_thai === "DA_CHI"
                        ? "bg-green-100 text-green-700"
                        : item.trang_thai === "CHUA_CHI"
                          ? "bg-orange-100 text-orange-700"
                          : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {item.trang_thai === "DA_CHI"
                      ? "Đã Chi"
                      : item.trang_thai === "CHUA_CHI"
                        ? "Chưa Chi"
                        : "Không Giảm Giá"}
                  </span>
                </td>
                <td className="p-4 text-gray-500 text-xs">{item.ghi_chu}</td>
              </tr>
            ))}
            {data.length === 0 && (
              <tr>
                <td colSpan="7" className="p-6 text-center text-gray-500">
                  Chưa có dữ liệu đơn hàng.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default QuanLyPhiVanChuyen;
