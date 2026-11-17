// src/pages/khachhang/DatHangThanhCong.jsx
import { useLocation, useNavigate } from "react-router-dom";
import { formatVND } from "../../components/shop/SanPhamShared";

const DatHangThanhCong = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const state = location.state || {};
  const shops = Array.isArray(state.shops) ? state.shops : [];

  const dmMa = state.dm_ma;
  const finalTotal = Number(state.finalTotal || 0);
  const paymentMethod = state.paymentMethod || "COD";

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-10 px-4 font-sans">
      <div className="max-w-3xl mx-auto">
        {/* BANNER THÀNH CÔNG */}
        <div className="bg-white rounded-3xl shadow-sm border border-[#E2E8F0] p-8 text-center">
          <div className="w-20 h-20 mx-auto rounded-full bg-emerald-100 flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-5xl text-emerald-600">
              check_circle
            </span>
          </div>
          <h1 className="text-2xl font-bold text-[#0F172A]">
            Đặt hàng thành công!
          </h1>
          <p className="text-[#64748B] mt-2">
            Cảm ơn bạn đã mua hàng. Shop sẽ sớm xác nhận đơn của bạn.
          </p>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
            <div className="bg-[#F8FAFC] rounded-xl p-4 border border-[#E2E8F0]">
              <p className="text-xs font-semibold text-[#64748B] uppercase">
                Mã đơn hàng
              </p>
              <p className="font-mono font-bold text-[#2563EB] mt-1 break-all">
                {dmMa || "—"}
              </p>
            </div>
            <div className="bg-[#F8FAFC] rounded-xl p-4 border border-[#E2E8F0]">
              <p className="text-xs font-semibold text-[#64748B] uppercase">
                Tổng thanh toán
              </p>
              <p className="font-bold text-[#DC2626] mt-1">
                {formatVND(finalTotal)}
              </p>
            </div>
            <div className="bg-[#F8FAFC] rounded-xl p-4 border border-[#E2E8F0]">
              <p className="text-xs font-semibold text-[#64748B] uppercase">
                Thanh toán
              </p>
              <p className="font-bold text-[#0F172A] mt-1">
                {paymentMethod === "COD"
                  ? "Khi nhận hàng (COD)"
                  : paymentMethod}
              </p>
            </div>
          </div>
        </div>

        {/* THÔNG TIN ĐƠN THEO SHOP (chỉ để xem, không đánh giá) */}
        <div className="bg-white rounded-3xl shadow-sm border border-[#E2E8F0] mt-6 overflow-hidden">
          <div className="p-6 border-b border-[#F1F5F9]">
            <h2 className="text-lg font-bold text-[#0F172A]">
              Đơn hàng của bạn
            </h2>
            <p className="text-sm text-[#64748B] mt-1">
              Bạn có thể đánh giá sản phẩm sau khi đã nhận hàng, trong mục{" "}
              <span className="font-semibold text-[#2563EB]">
                Đơn hàng của tôi
              </span>
              .
            </p>
          </div>

          {shops.length === 0 ? (
            <div className="p-6 text-center text-[#64748B] text-sm">
              Không có thông tin đơn hàng.
            </div>
          ) : (
            <div className="divide-y divide-[#F1F5F9]">
              {shops.map((shop) => (
                <div key={shop.dts_ma} className="p-5 flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined">
                      storefront
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-[#0F172A] truncate">
                      {shop.gh_ten || shop.gh_ma}
                    </p>
                    <p className="text-xs text-[#64748B] mt-0.5">
                      Mã đơn: <span className="font-mono">{shop.dts_ma}</span>
                    </p>
                  </div>
                  {shop.tong_thanh_toan != null && (
                    <p className="font-bold text-[#DC2626] text-sm shrink-0">
                      {formatVND(Number(shop.tong_thanh_toan))}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* HÀNH ĐỘNG */}
        <div className="flex flex-col sm:flex-row gap-3 mt-6">
          <button
            onClick={() =>
              navigate("/khach-hang/thong-tin-ca-nhan?tab=don-hang")
            }
            className="flex-1 py-3.5 rounded-xl font-bold border-2 border-[#2563EB] text-[#2563EB] hover:bg-blue-50 transition-colors"
          >
            Xem đơn hàng của tôi
          </button>
          <button
            onClick={() => navigate("/")}
            className="flex-1 py-3.5 rounded-xl font-bold bg-[#DC2626] hover:bg-[#B91C1C] text-white transition-colors"
          >
            Về trang chủ
          </button>
        </div>
      </div>
    </div>
  );
};

export default DatHangThanhCong;
