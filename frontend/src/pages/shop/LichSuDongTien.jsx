import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../../contexts/AuthContext";
import axiosClient from "../../config/axiosClient";
import { formatVND } from "../../components/shop/SanPhamShared";

const LichSuDongTien = () => {
  const { user } = useContext(AuthContext);
  const gh_ma = user?.GH_Ma;
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axiosClient.get(`/dong-tien/shop/${gh_ma}`);
        setData(res.data);
      } catch (error) {
        console.error("Lỗi tải dòng tiền shop:", error);
      } finally {
        setLoading(false);
      }
    };
    if (gh_ma) fetchData();
  }, [gh_ma]);

  if (loading)
    return (
      <div className="p-10 text-center font-medium text-gray-500">
        Đang tải dữ liệu...
      </div>
    );

  // Tính tổng tiền đã nhận (những đơn đã thanh toán)
  const tongTienDaNhan = data
    .filter((item) => item.trang_thai_qr === "DA_THANH_TOAN")
    .reduce((sum, item) => sum + Number(item.tien_shop_nhan), 0);

  return (
    <div className="p-6 bg-[#F8FAFC] min-h-screen">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A]">
            Lịch Sử Nhận Tiền
          </h1>
          <p className="text-sm text-[#64748B] mt-1">
            Tiền được chuyển trực tiếp vào tài khoản ngân hàng của bạn.
          </p>
        </div>
        <div className="bg-green-50 px-6 py-3 rounded-xl border border-green-200 text-right shadow-sm">
          <p className="text-sm font-semibold text-green-700">
            Tổng tiền đã nhận
          </p>
          <p className="text-2xl font-bold text-green-600">
            {formatVND(tongTienDaNhan)}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-[#E2E8F0] p-6">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="p-4 font-semibold text-gray-600">Mã Đơn Hàng</th>
              <th className="p-4 font-semibold text-gray-600">Ngày Đặt</th>
              <th className="p-4 font-semibold text-gray-600 text-right">
                Tiền Khách Trả
              </th>
              <th className="p-4 font-semibold text-gray-600 text-right">
                Phí Sàn
              </th>
              <th className="p-4 font-semibold text-gray-600 text-right">
                Thực Nhận
              </th>
              <th className="p-4 font-semibold text-gray-600 text-center">
                Trạng Thái
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {data.map((item) => (
              <tr
                key={item.dts_ma}
                className="hover:bg-gray-50 transition-colors"
              >
                <td className="p-4 font-bold text-gray-800">{item.dts_ma}</td>
                <td className="p-4">
                  {new Date(item.dts_ngaylap).toLocaleDateString("vi-VN")}
                </td>
                <td className="p-4 text-right font-medium">
                  {formatVND(item.tien_hang_goc)}
                </td>
                <td className="p-4 text-right text-red-500">
                  -{formatVND(item.phi_san)}
                </td>
                <td className="p-4 text-right font-bold text-green-600">
                  {formatVND(item.tien_shop_nhan)}
                </td>
                <td className="p-4 text-center">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      item.trang_thai_qr === "DA_THANH_TOAN"
                        ? "bg-green-100 text-green-700"
                        : "bg-orange-100 text-orange-700"
                    }`}
                  >
                    {item.trang_thai_qr === "DA_THANH_TOAN"
                      ? "Đã vào tài khoản"
                      : "Chờ Kho chuyển"}
                  </span>
                </td>
              </tr>
            ))}
            {data.length === 0 && (
              <tr>
                <td colSpan="6" className="p-6 text-center text-gray-500">
                  Chưa có giao dịch nào.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LichSuDongTien;
