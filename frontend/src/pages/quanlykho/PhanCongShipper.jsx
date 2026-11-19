import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../../contexts/AuthContext";
import qlkPhanCongService from "../../services/quanlykho/phanCongService";
import { formatVND } from "../../components/shop/SanPhamShared";
import ToastNotification from "../../components/common/Crud/ToastNotification";
import LoTrinhVanChuyen, {
  diemKhoTuDuLieu,
  diemShopTuDuLieu,
} from "../../components/common/LoTrinhVanChuyen";

const PhanCongShipper = () => {
  const { user } = useContext(AuthContext);
  const kho_ma = user?.kho_ma;

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [shippers, setShippers] = useState([]);
  const [selectedShippers, setSelectedShippers] = useState({});

  // Chọn nhiều để giao việc hàng loạt
  const [selected, setSelected] = useState([]);
  const [bulkShipper, setBulkShipper] = useState("");
  const [bulkLoading, setBulkLoading] = useState(false);

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

  // ── Chọn nhiều ────────────────────────────────────────────────
  const toggleOne = (dts_ma) => {
    setSelected((prev) =>
      prev.includes(dts_ma)
        ? prev.filter((ma) => ma !== dts_ma)
        : [...prev, dts_ma]
    );
  };

  const toggleAll = () => {
    setSelected((prev) =>
      prev.length === orders.length ? [] : orders.map((o) => o.DTS_Ma)
    );
  };

  const handleBulkAssign = async () => {
    if (selected.length === 0)
      return showToast("Vui lòng chọn ít nhất 1 đơn hàng!", "error");
    if (!bulkShipper)
      return showToast("Vui lòng chọn Shipper trước khi giao việc!", "error");

    const shipper = shippers.find((s) => s.Shipper_Ma === bulkShipper);
    if (
      !window.confirm(
        `Giao ${selected.length} đơn cho ${shipper ? shipper.Shipper_Ten : "shipper"}?`
      )
    )
      return;

    setBulkLoading(true);
    try {
      const res = await qlkPhanCongService.assignShipperBatch({
        shipper_ma: bulkShipper,
        danh_sach_dts: selected,
      });
      const { tongSo, thanhCong } = res.data;

      if (thanhCong === tongSo) {
        showToast(`Đã giao ${thanhCong}/${tongSo} đơn cho shipper!`);
      } else {
        const loi = (res.data.ketQua || []).filter((r) => !r.ok);
        const chiTiet = loi
          .slice(0, 3)
          .map((r) => `${r.dts_ma} (${r.ly_do})`)
          .join(", ");
        showToast(
          `Đã giao ${thanhCong}/${tongSo} đơn. Bỏ qua: ${chiTiet}${loi.length > 3 ? "..." : ""}`,
          "error"
        );
      }

      setSelected([]);
      setBulkShipper("");
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.message || "Lỗi phân công hàng loạt", "error");
    } finally {
      setBulkLoading(false);
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
        <>
          {/* Thanh công cụ giao việc hàng loạt */}
          <div className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl border border-[#E2E8F0] bg-white px-4 py-3 shadow-sm">
            <label className="flex items-center gap-2 text-sm font-semibold text-[#334155] cursor-pointer select-none">
              <input
                type="checkbox"
                className="w-4 h-4 cursor-pointer"
                checked={orders.length > 0 && selected.length === orders.length}
                onChange={toggleAll}
                disabled={bulkLoading}
              />
              Chọn tất cả ({orders.length})
            </label>

            <span className="text-sm text-[#64748B]">
              Đã chọn:{" "}
              <b className="text-indigo-600">{selected.length}</b>
            </span>

            <div className="ml-auto flex flex-wrap items-center gap-2">
              <select
                value={bulkShipper}
                onChange={(e) => setBulkShipper(e.target.value)}
                disabled={bulkLoading || shippers.length === 0}
                className="px-3 py-2 rounded-lg border border-[#E2E8F0] outline-none text-sm focus:border-indigo-600"
              >
                <option value="">-- Chọn Shipper --</option>
                {shippers.map((s) => (
                  <option key={s.Shipper_Ma} value={s.Shipper_Ma}>
                    {s.Shipper_Ten} ({s.Shipper_SDT})
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={handleBulkAssign}
                disabled={bulkLoading || selected.length === 0}
                className="px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {bulkLoading ? "Đang giao..." : `Giao ${selected.length} đơn`}
              </button>

              {selected.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelected([])}
                  disabled={bulkLoading}
                  className="px-3 py-2 text-sm font-semibold text-[#64748B] hover:text-[#0F172A]"
                >
                  Bỏ chọn
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {orders.map((order) => {
              const isChecked = selected.includes(order.DTS_Ma);
              return (
                <div
                  key={order.DTS_Ma}
                  className={`bg-white rounded-2xl shadow-sm border p-5 flex flex-col ${
                    isChecked
                      ? "border-indigo-300 bg-indigo-50/30"
                      : "border-[#E2E8F0]"
                  }`}
                >
                  <div className="flex justify-between items-center mb-3 border-b pb-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleOne(order.DTS_Ma)}
                        disabled={bulkLoading}
                        className="w-4 h-4 cursor-pointer"
                      />
                      <span className="font-bold text-indigo-600">
                        {order.DTS_Ma}
                      </span>
                    </div>
                    <span className="text-xs bg-yellow-50 text-yellow-600 px-2 py-1 rounded font-bold">
                      Chờ lấy hàng
                    </span>
                  </div>

                  <div className="space-y-2 text-sm flex-1">
                    <LoTrinhVanChuyen
                      nhan="Chặng lấy hàng (LSP01)"
                      tu={diemShopTuDuLieu(order)}
                      den={diemKhoTuDuLieu(order, "Kho_")}
                    />
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
                        disabled={bulkLoading}
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
                        disabled={bulkLoading}
                        className="px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-lg hover:bg-indigo-700 disabled:bg-gray-400"
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
        </>
      )}

      <ToastNotification toast={toast} />
    </div>
  );
};

export default PhanCongShipper;
