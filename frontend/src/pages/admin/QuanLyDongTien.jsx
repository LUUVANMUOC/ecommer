import { useState, useEffect } from "react";
import axiosClient from "../../config/axiosClient";
import { formatVND } from "../../components/shop/SanPhamShared";

const QuanLyDongTien = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axiosClient.get("/dong-tien/admin");
        setData(res.data);
      } catch (error) {
        console.error("Lỗi tải dòng tiền admin:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading)
    return (
      <div className="p-10 text-center font-medium text-gray-500">
        Đang tải dữ liệu...
      </div>
    );

  return (
    <div className="p-6 bg-[#F8FAFC] min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#0F172A]">
          Tổng Quan Dòng Tiền Hệ Thống
        </h1>
        <p className="text-sm text-[#64748B] mt-1">
          Theo dõi tiền hàng và phí sàn thu được từ các Kho.
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-[#E2E8F0] p-6">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="p-4 font-semibold text-gray-600">Mã Phiếu</th>
              <th className="p-4 font-semibold text-gray-600">Ngày Tạo</th>
              <th className="p-4 font-semibold text-gray-600">Kho Thu Tiền</th>
              <th className="p-4 font-semibold text-gray-600 text-center">
                Số Đơn
              </th>
              <th className="p-4 font-semibold text-gray-600 text-right">
                Phí Sàn (Thu về)
              </th>
              <th className="p-4 font-semibold text-gray-600 text-right">
                Tiền Shop (Chuyển thẳng)
              </th>
              <th className="p-4 font-semibold text-gray-600 text-center">
                Trạng Thái
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {data.map((item) => (
              <tr
                key={item.ptt_ma}
                className="hover:bg-gray-50 transition-colors"
              >
                <td className="p-4 font-bold text-indigo-600">{item.ptt_ma}</td>
                <td className="p-4">
                  {new Date(item.ptt_ngay_tat_toan).toLocaleString("vi-VN")}
                </td>
                <td className="p-4">{item.ten_kho}</td>
                <td className="p-4 text-center font-medium">
                  {item.so_don_hang}
                </td>
                <td className="p-4 text-right font-bold text-green-600">
                  +{formatVND(item.tong_phi_san)}
                </td>
                <td className="p-4 text-right text-gray-700">
                  {formatVND(item.tong_tien_shop)}
                </td>
                <td className="p-4 text-center">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      item.ptt_trang_thai_thanh_toan === "DA_THANH_TOAN"
                        ? "bg-green-100 text-green-700"
                        : "bg-orange-100 text-orange-700"
                    }`}
                  >
                    {item.ptt_trang_thai_thanh_toan === "DA_THANH_TOAN"
                      ? "Đã Thu Đủ"
                      : "Chờ Thu"}
                  </span>
                </td>
              </tr>
            ))}
            {data.length === 0 && (
              <tr>
                <td colSpan="7" className="p-6 text-center text-gray-500">
                  Chưa có dữ liệu tất toán.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default QuanLyDongTien;
