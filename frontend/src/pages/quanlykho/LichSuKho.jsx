import { useState, useEffect, useContext, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../contexts/AuthContext";
import axiosClient from "../../config/axiosClient";
import DateGroupedList from "../../components/common/DateGroupedList";
import { formatVND } from "../../components/shop/SanPhamShared";
import { tenDiem } from "../../components/common/LoTrinhVanChuyen";

// Cấu hình icon/màu theo loại sự kiện
const LOAI_SU_KIEN = {
  DIEU_PHOI: {
    label: "Điều phối",
    color: "bg-indigo-500",
    icon: "assignment_ind",
  },
  SHIPPER: { label: "Shipper", color: "bg-orange-500", icon: "local_shipping" },
  THU_KHO: { label: "Thủ kho", color: "bg-blue-500", icon: "inventory" },
  HE_THONG: { label: "Hệ thống", color: "bg-slate-500", icon: "history" },
};

const getStyle = (item) => {
  if (LOAI_SU_KIEN[item.LoaiSuKien]) return LOAI_SU_KIEN[item.LoaiSuKien];
  // Fallback cho dữ liệu cũ chưa có LoaiSuKien
  if (item.HanhDong?.includes("Phân công"))
    return { color: "bg-indigo-500", icon: "assignment_ind" };
  if (item.HanhDong?.includes("Gửi"))
    return { color: "bg-orange-500", icon: "send" };
  return { color: "bg-blue-500", icon: "inventory" };
};

// Lấy ngày local dạng yyyy-mm-dd để so sánh với input type="date"
const toDayKey = (value) => {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

const LichSuKho = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const kho_ma = user?.kho_ma;

  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Bộ lọc phía client
  const [search, setSearch] = useState("");
  const [loaiSuKien, setLoaiSuKien] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axiosClient.get(`/quan-ly-kho/lich-su/${kho_ma}`);
        setHistory(res.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (kho_ma) fetchData();
  }, [kho_ma]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return history.filter((item) => {
      if (loaiSuKien && item.LoaiSuKien !== loaiSuKien) return false;

      if (fromDate || toDate) {
        const day = toDayKey(item.ThoiGian);
        if (fromDate && day < fromDate) return false;
        if (toDate && day > toDate) return false;
      }

      if (!q) return true;
      return [
        item.DTS_Ma,
        item.TenShop,
        item.TenKhach,
        item.NguoiThucHien,
        item.HanhDong,
      ]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));
    });
  }, [history, search, loaiSuKien, fromDate, toDate]);

  const resetFilter = () => {
    setSearch("");
    setLoaiSuKien("");
    setFromDate("");
    setToDate("");
  };

  const hasFilter = search || loaiSuKien || fromDate || toDate;

  if (loading) return <div className="p-10 text-center">Đang tải...</div>;

  return (
    <div className="p-6 bg-[#F8FAFC] min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#0F172A]">Lịch Sử Kho</h1>
        <p className="text-sm text-[#64748B] mt-1">
          Toàn bộ hoạt động phân công, lấy hàng, nhập/xuất kho, trung chuyển và
          giao hàng
        </p>
      </div>

      {/* BỘ LỌC */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-4 mb-5">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="lg:col-span-2">
            <label className="block text-xs font-semibold text-gray-500 mb-1">
              Tìm kiếm
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-2.5 text-gray-400 text-[20px]">
                search
              </span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Mã đơn, shop, khách, shipper..."
                className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-[#E2E8F0] outline-none focus:border-blue-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">
              Loại sự kiện
            </label>
            <select
              value={loaiSuKien}
              onChange={(e) => setLoaiSuKien(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-[#E2E8F0] outline-none focus:border-blue-600 bg-white"
            >
              <option value="">Tất cả</option>
              <option value="DIEU_PHOI">Điều phối</option>
              <option value="SHIPPER">Shipper</option>
              <option value="THU_KHO">Thủ kho</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">
              Từ ngày
            </label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-[#E2E8F0] outline-none focus:border-blue-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">
              Đến ngày
            </label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-[#E2E8F0] outline-none focus:border-blue-600"
            />
          </div>
        </div>

        <div className="flex items-center justify-between mt-3">
          <p className="text-sm text-[#64748B]">
            Hiển thị <b className="text-[#0F172A]">{filtered.length}</b> /{" "}
            {history.length} hoạt động
          </p>
          {hasFilter && (
            <button
              onClick={resetFilter}
              className="text-sm font-semibold text-red-500 hover:text-red-600 flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[18px]">
                close
              </span>
              Xóa bộ lọc
            </button>
          )}
        </div>
      </div>

      {/* DANH SÁCH */}
      <DateGroupedList
        items={filtered}
        dateField="ThoiGian"
        renderItem={(item) => {
          const style = getStyle(item);
          return (
            <button
              key={`${item.DTS_Ma}-${item.HanhDong}-${item.ThoiGian}`}
              type="button"
              onClick={() => navigate(`/quan-ly-kho/lich-su/${item.DTS_Ma}`)}
              className="w-full text-left flex items-center justify-between gap-3 p-3 bg-white border border-gray-100 rounded-lg hover:border-blue-300 hover:bg-blue-50/40 transition-colors group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center font-bold text-white ${style.color}`}
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {style.icon}
                  </span>
                </div>

                <div className="min-w-0">
                  <p className="font-bold text-[#0F172A] truncate">
                    {item.HanhDong}
                  </p>
                  <p className="text-sm text-gray-500 truncate">
                    Đơn:{" "}
                    <span className="font-semibold text-[#2563EB]">
                      {item.DTS_Ma}
                    </span>
                    {item.TenShop && ` • ${item.TenShop}`}
                    {item.TenKhach && ` • ${item.TenKhach}`}
                  </p>
                  <p className="text-xs text-gray-400 truncate">
                    {item.NguoiThucHien || "—"}
                    {item.TongTien !== null && item.TongTien !== undefined
                      ? ` • ${formatVND(item.TongTien)}`
                      : ""}
                  </p>
                  {(item.Diem_Di || item.Diem_Den) && (
                    <p className="text-xs font-semibold text-indigo-700 truncate">
                      {item.TenChang ? `${item.TenChang}: ` : ""}
                      {tenDiem(item.Diem_Di)} → {tenDiem(item.Diem_Den)}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <p className="text-xs text-gray-400 whitespace-nowrap">
                  {new Date(item.ThoiGian).toLocaleTimeString("vi-VN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
                <span className="material-symbols-outlined text-gray-300 group-hover:text-blue-500 text-[20px]">
                  chevron_right
                </span>
              </div>
            </button>
          );
        }}
      />

      {filtered.length === 0 && history.length > 0 && (
        <div className="mt-6 text-center text-gray-500">
          Không có hoạt động nào khớp bộ lọc.
        </div>
      )}
    </div>
  );
};

export default LichSuKho;
