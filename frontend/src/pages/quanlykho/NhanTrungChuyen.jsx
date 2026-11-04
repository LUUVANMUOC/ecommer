import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../../contexts/AuthContext";
import trungChuyenService from "../../services/quanlykho/trungChuyenService";
import { formatVND } from "../../components/shop/SanPhamShared";
import ToastNotification from "../../components/common/Crud/ToastNotification";

const NhanTrungChuyen = () => {
  const { user } = useContext(AuthContext);
  const kho_ma = user?.kho_ma;

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

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
      const res = await trungChuyenService.getDonChoNhan(kho_ma);
      setOrders(res.data);
    } catch (err) {
      showToast("Lỗi tải dữ liệu", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [kho_ma]);

  const handleNhan = async (dts_ma) => {
    if (!window.confirm("Xác nhận đã nhận được hàng từ shipper trung chuyển?"))
      return;
    setSubmitting(true);
    try {
      await trungChuyenService.nhanHang(dts_ma, kho_ma);
      showToast("Đã nhận hàng thành công!");
      fetchData(); // Load lại, đơn biến mất
    } catch (err) {
      showToast(err.response?.data?.message || "Lỗi nhận hàng", "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading)
    return (
      <div className="p-10 text-center font-medium text-gray-500">
        Đang tải...
      </div>
    );

  return (
    <div className="p-6 bg-[#F8FAFC] min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#0F172A]">
          Chờ Nhận Trung Chuyển
        </h1>
        <p className="text-sm text-[#64748B] mt-1">
          Các đơn hàng từ kho khác đang trên đường đến kho của bạn
        </p>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-[#E2E8F0]">
          <span className="material-symbols-outlined text-6xl text-gray-300 mb-4">
            inventory_2
          </span>
          <p className="text-lg font-bold text-gray-700">
            Không có đơn nào chờ nhận.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {orders.map((order) => (
            <div
              key={order.DTS_Ma}
              className="bg-white rounded-2xl shadow-sm border border-[#E2E8F0] p-5 flex flex-col"
            >
              <div className="flex justify-between items-center mb-3 border-b pb-2">
                <span className="font-bold text-green-600">{order.DTS_Ma}</span>
                <span className="text-xs bg-yellow-50 text-yellow-600 px-2 py-1 rounded font-bold">
                  Đang đến
                </span>
              </div>

              <div className="space-y-2 text-sm flex-1">
                <p>
                  <b className="text-[#334155]">Shop:</b> {order.TenShop}
                </p>
                <p className="text-[#64748B]">
                  <b>Giao đến:</b> {order.DiaChiGiao}
                </p>
                <p className="text-[#64748B]">
                  <b>Tổng tiền:</b>{" "}
                  <span className="text-[#DC2626] font-bold">
                    {formatVND(order.TongTien)}
                  </span>
                </p>

                <div className="bg-orange-50 text-orange-700 p-2 rounded mt-2 text-xs">
                  <p>
                    <b>Từ kho:</b> {order.Kho_Di_Ten}
                  </p>
                  <p>
                    <b>Shipper gửi:</b> {order.TenShipperGui} (
                    {order.SdtShipperGui})
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-[#F1F5F9]">
                <button
                  onClick={() => handleNhan(order.DTS_Ma)}
                  disabled={submitting}
                  className="w-full py-2.5 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-colors flex items-center justify-center gap-2 disabled:bg-gray-400"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    check_circle
                  </span>
                  Xác Nhận Đã Nhận Hàng
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      <ToastNotification toast={toast} />
    </div>
  );
};

export default NhanTrungChuyen;
