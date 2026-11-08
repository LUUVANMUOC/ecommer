import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "../../contexts/AuthContext";
import axiosClient from "../../config/axiosClient";
import { formatVND } from "../../components/shop/SanPhamShared";

const LichSuNhanTienShip = () => {
  const { user } = useContext(AuthContext);
  const dvvc_ma = user?.DVVC_Ma || user?.dvvc_ma || user?.id;

  const [danhSach, setDanhSach] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedPcd, setExpandedPcd] = useState(null);
  const [chiTiet, setChiTiet] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      if (!dvvc_ma) return;
      try {
        const res = await axiosClient.get(
          `/admin/thanh-toan-van-chuyen/lich-su/dvvc/${dvvc_ma}`,
        );
        setDanhSach(res.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [dvvc_ma]);

  const handleToggleDetail = async (pcd_ma) => {
    if (expandedPcd === pcd_ma) {
      setExpandedPcd(null);
      return;
    }
    setExpandedPcd(pcd_ma);

    if (!chiTiet[pcd_ma]) {
      try {
        const res = await axiosClient.get(
          `/admin/thanh-toan-van-chuyen/lich-su/chi-tiet/${pcd_ma}`,
        );
        setChiTiet((prev) => ({ ...prev, [pcd_ma]: res.data }));
      } catch (error) {
        console.error("Lỗi lấy chi tiết", error);
      }
    }
  };

  if (loading)
    return <div className="p-10 text-center">Đang tải dữ liệu...</div>;

  return (
    <div className="p-6 bg-[#F8FAFC] min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#0F172A]">
          Lịch Sử Nhận Tiền Vận Chuyển
        </h1>
        <p className="text-sm text-[#64748B] mt-1">
          Các khoản tiền Sàn đã thanh toán cho bạn.
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-[#E2E8F0] p-6">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="p-4 font-semibold text-gray-600">Mã Phiếu Chi</th>
              <th className="p-4 font-semibold text-gray-600">Ngày Nhận</th>
              <th className="p-4 font-semibold text-gray-600 text-right">
                Số Tiền Nhận
              </th>
              <th className="p-4 font-semibold text-gray-600 text-center">
                Trạng Thái
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {danhSach.length === 0 ? (
              <tr>
                <td colSpan="4" className="p-6 text-center text-gray-500">
                  Chưa có giao dịch nào.
                </td>
              </tr>
            ) : (
              danhSach.map((item) => (
                <React.Fragment key={item.pcd_ma}>
                  <tr
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleToggleDetail(item.pcd_ma)}
                  >
                    <td className="p-4 font-bold text-indigo-600 flex items-center gap-2">
                      <span className="material-symbols-outlined text-gray-400 text-[18px]">
                        {expandedPcd === item.pcd_ma
                          ? "expand_less"
                          : "expand_more"}
                      </span>
                      {item.pcd_ma}
                    </td>
                    <td className="p-4">
                      {new Date(item.pcd_ngay_hoan_tat).toLocaleString("vi-VN")}
                    </td>
                    <td className="p-4 text-right text-green-600 font-bold text-lg">
                      {formatVND(item.pcd_tong_tien)}
                    </td>
                    <td className="p-4 text-center">
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
                        Đã vào tài khoản
                      </span>
                    </td>
                  </tr>

                  {expandedPcd === item.pcd_ma && (
                    <tr>
                      <td colSpan="4" className="p-0 bg-gray-50 border-b">
                        <div className="p-4">
                          <h4 className="font-semibold text-gray-700 mb-2">
                            Chi tiết các đơn được trả phí:
                          </h4>
                          <table className="w-full text-xs bg-white border rounded-lg overflow-hidden">
                            <thead className="bg-gray-100 border-b">
                              <tr>
                                <th className="p-2 text-left">Mã Đơn Hàng</th>
                                <th className="p-2 text-right">Tiền Ship</th>
                              </tr>
                            </thead>
                            <tbody>
                              {chiTiet[item.pcd_ma]?.map((don) => (
                                <tr
                                  key={don.dts_ma}
                                  className="border-b last:border-0 hover:bg-gray-50"
                                >
                                  <td className="p-2 font-medium text-indigo-600">
                                    {don.dts_ma}
                                  </td>
                                  <td className="p-2 text-right font-bold text-gray-800">
                                    {formatVND(don.tien_ship)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
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
    </div>
  );
};

export default LichSuNhanTienShip;
