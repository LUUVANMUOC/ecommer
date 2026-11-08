import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "../../contexts/AuthContext";
import phiVanChuyenService from "../../services/dvvc/phiVanChuyenService";
import { formatVND } from "../../components/shop/SanPhamShared";

const QuanLyPhiVanChuyen = () => {
  const { user } = useContext(AuthContext);
  const dvvc_ma = user?.DVVC_Ma || user?.dvvc_ma || user?.id;

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!dvvc_ma) {
        setLoading(false);
        return;
      }
      try {
        const res = await phiVanChuyenService.getDVVC(dvvc_ma);
        setData(res.data);
      } catch (error) {
        console.error("Lỗi tải danh sách phí vận chuyển:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [dvvc_ma]);

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
          Theo dõi phí ship và tình trạng thanh toán từ Sàn cho các đơn hàng của
          bạn.
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-[#E2E8F0] p-6">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="p-4 font-semibold text-gray-600">Mã Đơn</th>
              <th className="p-4 font-semibold text-gray-600">Ngày Đặt</th>
              <th className="p-4 font-semibold text-gray-600 text-right">
                Phí Ship Thu Khách
              </th>
              <th className="p-4 font-semibold text-gray-600 text-right">
                Sàn Bù (Voucher)
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
                <td className="p-4 text-right font-medium">
                  {formatVND(item.phi_ship_goc)}
                </td>
                <td className="p-4 text-right font-bold text-green-600">
                  {Number(item.voucher_ship) > 0
                    ? `+${formatVND(item.voucher_ship)}`
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
                      ? "Sàn Đã Trả"
                      : item.trang_thai === "CHUA_CHI"
                        ? "Chờ Sàn Trả"
                        : "Không Giảm Giá"}
                  </span>
                </td>
                <td className="p-4 text-gray-500 text-xs">{item.ghi_chu}</td>
              </tr>
            ))}
            {data.length === 0 && (
              <tr>
                <td colSpan="6" className="p-6 text-center text-gray-500">
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
