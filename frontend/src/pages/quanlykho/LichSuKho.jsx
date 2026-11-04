import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../../contexts/AuthContext";
import axiosClient from "../../config/axiosClient";
import DateGroupedList from "../../components/common/DateGroupedList";

const LichSuKho = () => {
  const { user } = useContext(AuthContext);
  const kho_ma = user?.kho_ma;
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axiosClient.get(`/quan-ly-kho/lich-su/${kho_ma}`);
        setHistory(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (kho_ma) fetchData();
  }, [kho_ma]);

  if (loading) return <div className="p-10 text-center">Đang tải...</div>;

  return (
    <div className="p-6 bg-[#F8FAFC] min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#0F172A]">Lịch Sử Kho</h1>
        <p className="text-sm text-[#64748B] mt-1">
          Toàn bộ lịch sử hoạt động phân công và trung chuyển
        </p>
      </div>

      <DateGroupedList
        items={history}
        dateField="ThoiGian"
        renderItem={(item) => (
          <div
            key={item.DTS_Ma + item.HanhDong + item.ThoiGian}
            className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-lg"
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white
                ${
                  item.HanhDong.includes("Phân công")
                    ? "bg-indigo-500"
                    : item.HanhDong.includes("Gửi")
                      ? "bg-orange-500"
                      : "bg-blue-500"
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">
                  {item.HanhDong.includes("Phân công")
                    ? "assignment_ind"
                    : item.HanhDong.includes("Gửi")
                      ? "send"
                      : "inventory"}
                </span>
              </div>
              <div>
                <p className="font-bold text-[#0F172A]">{item.HanhDong}</p>
                <p className="text-sm text-gray-500">
                  Đơn:{" "}
                  <span className="font-semibold text-[#2563EB]">
                    {item.DTS_Ma}
                  </span>
                  {item.NguoiThucHien && ` • ${item.NguoiThucHien}`}
                </p>
              </div>
            </div>
            <p className="text-xs text-gray-400">
              {new Date(item.ThoiGian).toLocaleTimeString("vi-VN")}
            </p>
          </div>
        )}
      />
    </div>
  );
};
export default LichSuKho;
