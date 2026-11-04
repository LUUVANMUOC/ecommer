import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../../contexts/AuthContext";
import qlkPhanCongService from "../../services/quanlykho/phanCongService";
import { formatVND } from "../../components/shop/SanPhamShared";
import ToastNotification from "../../components/common/Crud/ToastNotification";

const PhanCongShipper = () => {
  const { user } = useContext(AuthContext);
  const kho_ma = user?.kho_ma;

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [shippers, setShippers] = useState([]);
  const [selectedShippers, setSelectedShippers] = useState({});

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
    if (!kho_ma) return;
    try {
      const [resOrders, resShippers] = await Promise.all([
        qlkPhanCongService.getPendingOrders(kho_ma),
        qlkPhanCongService.getShippersByKho(kho_ma),
      ]);
      setOrders(resOrders.data);
      setShippers(resShippers.data);
    } catch (err) {
      showToast("Lỗi tải dữ liệu phân công", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [kho_ma]);

  const handleAssign = async (dts_ma) => {
    const shipper_ma = selectedShippers[dts_ma];
    if (!shipper_ma)
      return showToast("Vui lòng chọn Shipper trước khi giao việc!", "error");

    try {
      await qlkPhanCongService.assignShipper({ dts_ma, shipper_ma });
      showToast("Đã phân công shipper lấy hàng!");
      fetchData(); // Load lại để đơn biến mất
    } catch (err) {
      showToast(err.response?.data?.message || "Lỗi phân công", "error");
    }
  };

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
          Phân Công Lấy Hàng
        </h1>
        <p className="text-sm text-[#64748B] mt-1">
          Danh sách các đơn hàng đang chờ shipper kho {user?.kho_ten} đến Shop
          lấy hàng
        </p>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-[#E2E8F0]">
          <span className="material-symbols-outlined text-6xl text-gray-300 mb-4">
            inventory
          </span>
          <p className="text-lg font-bold text-gray-700">
            Không có đơn hàng nào cần lấy.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {orders.map((order) => {
            return (
              <div
                key={order.DTS_Ma}
                className="bg-white rounded-2xl shadow-sm border border-[#E2E8F0] p-5 flex flex-col"
              >
                <div className="flex justify-between items-center mb-3 border-b pb-2">
                  <span className="font-bold text-indigo-600">
                    {order.DTS_Ma}
                  </span>
                  <span className="text-xs bg-yellow-50 text-yellow-600 px-2 py-1 rounded font-bold">
                    Chờ lấy hàng
                  </span>
                </div>

                <div className="space-y-2 text-sm flex-1">
                  <p>
                    <b className="text-[#334155]">Shop:</b> {order.TenShop}
                  </p>
                  <p className="text-[#64748B]">
                    <b>Lấy tại:</b> {order.DiaChiLayHang}
                  </p>
                  <p className="text-[#64748B]">
                    <b>Kho tiếp nhận:</b>{" "}
                    <span className="text-indigo-600 font-semibold">
                      {order.Kho_Ten}
                    </span>
                  </p>
                </div>

                <div className="mt-4 pt-4 border-t border-[#F1F5F9]">
                  <label className="block text-xs font-semibold text-gray-500 mb-1">
                    Giao việc cho Shipper:
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={selectedShippers[order.DTS_Ma] || ""}
                      onChange={(e) =>
                        setSelectedShippers({
                          ...selectedShippers,
                          [order.DTS_Ma]: e.target.value,
                        })
                      }
                      className="flex-1 px-3 py-2 rounded-lg border border-[#E2E8F0] outline-none text-sm focus:border-indigo-600"
                    >
                      <option value="">-- Chọn Shipper --</option>
                      {shippers.map((s) => (
                        <option key={s.Shipper_Ma} value={s.Shipper_Ma}>
                          {s.Shipper_Ten} ({s.Shipper_SDT})
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => handleAssign(order.DTS_Ma)}
                      className="px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-lg hover:bg-indigo-700"
                    >
                      Giao
                    </button>
                  </div>
                  {shippers.length === 0 && (
                    <p className="text-xs text-red-500 mt-1 italic">
                      Kho này chưa có shipper lấy hàng (LSP01)!
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ToastNotification toast={toast} />
    </div>
  );
};

export default PhanCongShipper;
