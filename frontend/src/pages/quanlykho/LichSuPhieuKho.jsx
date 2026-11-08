import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../contexts/AuthContext";
import phieuKhoService from "../../services/quanlykho/phieuKhoService";
import ToastNotification from "../../components/common/Crud/ToastNotification";

// Config hiển thị cho 4 lý do
const LY_DO_CONFIG = {
  TU_LSP01: {
    label: "Nhập từ LSP01",
    short: "N1",
    color: "bg-green-50 text-green-700 border-green-200",
    icon: "inventory_2",
    loai: "NHAP",
  },
  TRUNG_CHUYEN_DI: {
    label: "Xuất gửi TC",
    short: "X1",
    color: "bg-orange-50 text-orange-700 border-orange-200",
    icon: "send",
    loai: "XUAT",
  },
  TRUNG_CHUYEN_DEN: {
    label: "Nhập từ TC",
    short: "N2",
    color: "bg-blue-50 text-blue-700 border-blue-200",
    icon: "inventory_2",
    loai: "NHAP",
  },
  GIAO_LSP03: {
    label: "Xuất giao LSP03",
    short: "X2",
    color: "bg-purple-50 text-purple-700 border-purple-200",
    icon: "local_shipping",
    loai: "XUAT",
  },
};

const TRANG_THAI_CONFIG = {
  CHO_XAC_NHAN: {
    label: "Chờ xác nhận",
    color: "bg-yellow-50 text-yellow-700",
  },
  DA_XAC_NHAN: { label: "Đã xác nhận", color: "bg-green-50 text-green-700" },
  CO_VAN_DE: { label: "Có vấn đề", color: "bg-red-50 text-red-700" },
};

// Tab filter
const TABS = [
  { key: "ALL", label: "Tất cả" },
  { key: "NHAP", label: "Nhập kho" },
  { key: "XUAT", label: "Xuất kho" },
];

const LichSuPhieuKho = () => {
  const { user } = useContext(AuthContext);
  const kho_ma = user?.kho_ma;
  const navigate = useNavigate();

  const [phieus, setPhieus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("ALL");

  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });
  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast((p) => ({ ...p, show: false })), 3000);
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!kho_ma) return;
      setLoading(true);
      try {
        const params = activeTab === "ALL" ? {} : { loai: activeTab };
        const res = await phieuKhoService.getLichSu(kho_ma, params);
        setPhieus(res.data);
      } catch (err) {
        showToast("Lỗi tải lịch sử phiếu", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [kho_ma, activeTab]);

  const formatDate = (iso) => {
    if (!iso) return "—";
    const d = new Date(iso);
    return d.toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="p-6 bg-[#F8FAFC] min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#0F172A]">Lịch Sử Phiếu Kho</h1>
        <p className="text-sm text-[#64748B] mt-1">
          Toàn bộ phiếu nhập/xuất kho — click để xem chi tiết hoặc in
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6 bg-white rounded-xl shadow-sm overflow-hidden">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-3 text-center font-bold text-sm transition-colors ${
              activeTab === tab.key
                ? "bg-indigo-50 text-indigo-700 border-b-2 border-indigo-600"
                : "text-gray-500 hover:bg-gray-50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Nội dung */}
      {loading ? (
        <div className="p-10 text-center font-medium text-gray-500">
          Đang tải...
        </div>
      ) : phieus.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-[#E2E8F0]">
          <span className="material-symbols-outlined text-6xl text-gray-300 mb-4">
            receipt_long
          </span>
          <p className="text-lg font-bold text-gray-700">Chưa có phiếu nào.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-[#E2E8F0] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-[#F8FAFC] text-[#64748B] text-sm border-b border-[#E2E8F0]">
                  <th className="p-4 font-semibold w-32">Mã phiếu</th>
                  <th className="p-4 font-semibold w-32">Loại</th>
                  <th className="p-4 font-semibold">Đơn hàng</th>
                  <th className="p-4 font-semibold">Shipper</th>
                  <th className="p-4 font-semibold w-40">Thời gian</th>
                  <th className="p-4 font-semibold w-32 text-center">
                    Trạng thái
                  </th>
                  <th className="p-4 font-semibold w-24 text-right">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {phieus.map((p) => {
                  const lyDoCfg = LY_DO_CONFIG[p.LyDo] || {
                    label: p.LyDo,
                    color: "bg-gray-50 text-gray-700 border-gray-200",
                    icon: "receipt",
                  };
                  const ttCfg = TRANG_THAI_CONFIG[p.TrangThai] || {
                    label: p.TrangThai,
                    color: "bg-gray-50 text-gray-700",
                  };

                  return (
                    <tr
                      key={p.PK_Ma}
                      className="hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() =>
                        navigate(`/quan-ly-kho/phieu-kho/${p.PK_Ma}`)
                      }
                    >
                      <td className="p-4">
                        <span className="font-mono text-sm font-bold text-indigo-600">
                          {p.PK_Ma}
                        </span>
                      </td>
                      <td className="p-4">
                        <span
                          className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded border font-semibold ${lyDoCfg.color}`}
                        >
                          <span className="material-symbols-outlined text-[14px]">
                            {lyDoCfg.icon}
                          </span>
                          {lyDoCfg.label}
                        </span>
                      </td>
                      <td className="p-4">
                        <p className="font-bold text-[#0F172A] text-sm">
                          {p.DTS_Ma}
                        </p>
                        <p className="text-xs text-[#64748B] truncate max-w-[200px]">
                          Shop: {p.TenShop}
                        </p>
                      </td>
                      <td className="p-4">
                        {p.Shipper_Ten ? (
                          <>
                            <p className="font-medium text-sm text-[#0F172A]">
                              {p.Shipper_Ten}
                            </p>
                            <p className="text-xs text-[#64748B]">
                              {p.Shipper_SDT}
                            </p>
                          </>
                        ) : (
                          <span className="text-sm text-gray-400 italic">
                            —
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        <p className="text-xs text-[#64748B]">
                          Tạo: {formatDate(p.ThoiGianTao)}
                        </p>
                        {p.ThoiGianXacNhan && (
                          <p className="text-xs text-[#64748B]">
                            Xác nhận: {formatDate(p.ThoiGianXacNhan)}
                          </p>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        <span
                          className={`inline-block text-xs px-2 py-1 rounded font-bold ${ttCfg.color}`}
                        >
                          {ttCfg.label}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/quan-ly-kho/phieu-kho/${p.PK_Ma}`);
                          }}
                          className="w-8 h-8 inline-flex items-center justify-center bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100"
                          title="Xem chi tiết"
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            visibility
                          </span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ToastNotification toast={toast} />
    </div>
  );
};

export default LichSuPhieuKho;
