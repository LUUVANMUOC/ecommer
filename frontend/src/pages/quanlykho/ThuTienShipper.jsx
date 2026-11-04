import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../../contexts/AuthContext";
import qlkTaiChinhService from "../../services/quanlykho/taiChinhService";
import { formatVND } from "../../components/shop/SanPhamShared";
import ToastNotification from "../../components/common/Crud/ToastNotification";

const ThuTienShipper = () => {
  const { user } = useContext(AuthContext);
  const kho_ma = user?.kho_ma;
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDTS, setSelectedDTS] = useState([]);

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
    try {
      const res = await qlkTaiChinhService.getDonChuaNop(kho_ma);
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

  const handleToggle = (dts_ma) => {
    setSelectedDTS((prev) =>
      prev.includes(dts_ma)
        ? prev.filter((id) => id !== dts_ma)
        : [...prev, dts_ma],
    );
  };

  const handleThuTien = async (shipper_ma) => {
    const ds_dts_ma = selectedDTS.filter((id) => {
      const od = orders.find((o) => o.DTS_Ma === id);
      return od && od.Shipper_Ma === shipper_ma;
    });
    if (ds_dts_ma.length === 0)
      return showToast("Vui lòng chọn đơn để thu tiền!", "error");

    if (
      !window.confirm(
        `Xác nhận đã thu đủ tiền mặt của ${ds_dts_ma.length} đơn hàng từ shipper?`,
      )
    )
      return;

    try {
      await qlkTaiChinhService.xacNhanThuTien(ds_dts_ma);
      showToast("Thu tiền thành công!");
      setSelectedDTS((prev) => prev.filter((id) => !ds_dts_ma.includes(id)));
      fetchData();
    } catch (err) {
      showToast("Lỗi thu tiền", "error");
    }
  };

  // Nhóm theo Shipper
  const groupedOrders = orders.reduce((acc, o) => {
    if (!acc[o.Shipper_Ma]) acc[o.Shipper_Ma] = { info: o, list: [] };
    acc[o.Shipper_Ma].list.push(o);
    return acc;
  }, {});

  if (loading) return <div className="p-10 text-center">Đang tải...</div>;

  return (
    <div className="p-6 bg-[#F8FAFC] min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#0F172A]">
          Thu Tiền Từ Shipper
        </h1>
        <p className="text-sm text-[#64748B] mt-1">
          Quản lý tiền mặt Shipper thu hộ khách hàng
        </p>
      </div>

      {Object.keys(groupedOrders).length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-[#E2E8F0]">
          <span className="material-symbols-outlined text-6xl text-gray-300 mb-4">
            payments
          </span>
          <p className="text-lg font-bold text-gray-700">
            Không có khoản tiền nào cần thu.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.values(groupedOrders).map((group) => {
            const shipper = group.info;
            const totalSelected = group.list
              .filter((o) => selectedDTS.includes(o.DTS_Ma))
              .reduce((sum, o) => sum + Number(o.TongTien), 0);

            return (
              <div
                key={shipper.Shipper_Ma}
                className="bg-white rounded-2xl shadow-sm border border-[#E2E8F0] p-5"
              >
                <div className="flex justify-between items-center mb-4 border-b pb-3">
                  <div>
                    <h3 className="font-bold text-lg text-indigo-600">
                      {shipper.Shipper_Ten} ({shipper.Shipper_SDT})
                    </h3>
                    <p className="text-sm text-gray-500">
                      Mã: {shipper.Shipper_Ma}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">
                      Đã chọn:{" "}
                      <span className="font-bold text-red-600">
                        {formatVND(totalSelected)}
                      </span>
                    </p>
                    <button
                      onClick={() => handleThuTien(shipper.Shipper_Ma)}
                      className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold text-sm hover:bg-indigo-700"
                    >
                      Xác nhận Thu tiền
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {group.list.map((o) => (
                    <label
                      key={o.DTS_Ma}
                      className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${selectedDTS.includes(o.DTS_Ma) ? "border-indigo-500 bg-indigo-50" : "border-gray-200 hover:bg-gray-50"}`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedDTS.includes(o.DTS_Ma)}
                        onChange={() => handleToggle(o.DTS_Ma)}
                        className="mt-1 w-4 h-4 text-indigo-600 rounded"
                      />
                      <div>
                        <p className="font-bold text-[#0F172A]">{o.DTS_Ma}</p>
                        <p className="text-xs text-gray-500">
                          Shop: {o.TenShop}
                        </p>
                        <p className="text-sm font-semibold text-red-600 mt-1">
                          {formatVND(o.TongTien)}
                        </p>
                      </div>
                    </label>
                  ))}
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

export default ThuTienShipper;
