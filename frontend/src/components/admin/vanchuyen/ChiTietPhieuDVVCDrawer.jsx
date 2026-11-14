// frontend/src/components/admin/vanchuyen/ChiTietPhieuDVVCDrawer.jsx
import { money, fmtDate, EmptyState } from "../dongtien/DongTienUI";
import { ChiBadge } from "./VanChuyenUI";

const ChiTietPhieuDVVCDrawer = ({ open, onClose, data, loading }) => {
  const phieu = data?.phieu;
  const donHang = data?.don_hang || [];
  const qr = data?.qr || [];
  const nganHang = data?.ngan_hang;

  const tongDon = donHang.reduce((s, d) => s + (Number(d.ccd_so_tien) || 0), 0);

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-[2px] transition-opacity duration-300 ${
          open
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
      />
      <aside
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-[560px] transform flex-col bg-white shadow-2xl transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-6 py-5">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Chi tiết phiếu chi ĐVVC
            </h2>
            <p className="mt-0.5 text-sm text-slate-500">
              {phieu ? `${phieu.pcd_ma} · ${phieu.dvvc_ten}` : "Đang tải..."}
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto p-6">
          {loading && (
            <p className="py-10 text-center text-sm text-slate-500">
              Đang tải chi tiết...
            </p>
          )}

          {!loading && !phieu && (
            <EmptyState
              icon="receipt_long"
              title="Không tải được phiếu chi"
              hint="Phiếu có thể đã bị hủy hoặc không tồn tại."
            />
          )}

          {!loading && phieu && (
            <>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <span className="font-mono text-sm font-semibold text-indigo-600">
                    {phieu.pcd_ma}
                  </span>
                  <ChiBadge status={phieu.pcd_trang_thai} />
                </div>
                <dl className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <dt className="text-xs text-slate-500">ĐVVC</dt>
                    <dd className="font-medium text-slate-800">
                      {phieu.dvvc_ten}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500">Số đơn</dt>
                    <dd className="font-medium text-slate-800">
                      {donHang.length}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500">Tổng tiền</dt>
                    <dd className="font-bold text-rose-600">
                      {money(phieu.pcd_tong_tien)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500">Ngày tạo</dt>
                    <dd className="text-slate-700">
                      {fmtDate(phieu.pcd_ngay_tao)}
                    </dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="text-xs text-slate-500">Ngày hoàn tất</dt>
                    <dd className="text-slate-700">
                      {fmtDate(phieu.pcd_ngay_hoan_tat)}
                    </dd>
                  </div>
                </dl>
              </div>

              <div>
                <h3 className="mb-2 text-sm font-bold text-slate-800">Mã QR</h3>
                {qr.length === 0 ? (
                  <p className="text-xs text-slate-500">Không có mã QR.</p>
                ) : (
                  <div className="space-y-2">
                    {qr.map((q) => (
                      <div
                        key={q.qr_ma}
                        className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-3 py-2"
                      >
                        <div>
                          <p className="font-mono text-xs font-semibold text-indigo-600">
                            {q.qr_ma}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            {fmtDate(q.qr_thoi_diem_tt)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-slate-700">
                            {money(q.qr_so_tien)}
                          </span>
                          <ChiBadge status={q.qr_trang_thai} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {nganHang && (
                <div className="rounded-xl border border-slate-200 p-3 text-xs text-slate-600">
                  <p className="mb-1 text-sm font-bold text-slate-800">
                    Thông tin nhận tiền
                  </p>
                  <p>
                    <span className="text-slate-400">Ngân hàng: </span>
                    {nganHang.ten_ngan_hang}
                  </p>
                  <p>
                    <span className="text-slate-400">Số TK: </span>
                    {nganHang.so_tai_khoan}
                  </p>
                  <p>
                    <span className="text-slate-400">Chủ TK: </span>
                    {nganHang.ten_tai_khoan || "—"}
                  </p>
                </div>
              )}

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-800">
                    Đơn hàng trong phiếu
                  </h3>
                  <span className="text-xs font-semibold text-slate-600">
                    {money(tongDon)}
                  </span>
                </div>
                {donHang.length === 0 ? (
                  <EmptyState
                    icon="inventory_2"
                    title="Phiếu chưa có đơn hàng"
                  />
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full min-w-[420px] border-collapse">
                      <thead className="border-b border-slate-200 bg-slate-50">
                        <tr>
                          <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                            Mã đơn
                          </th>
                          <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                            Ngày lập
                          </th>
                          <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                            Voucher ship
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {donHang.map((d) => (
                          <tr key={d.dts_ma}>
                            <td className="px-3 py-2 font-mono text-xs font-semibold text-indigo-600">
                              {d.dts_ma}
                            </td>
                            <td className="px-3 py-2 text-xs text-slate-500">
                              {fmtDate(d.dts_ngaylap)}
                            </td>
                            <td className="px-3 py-2 text-right text-sm font-semibold text-emerald-700">
                              {money(d.ccd_so_tien)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </aside>
    </>
  );
};

export default ChiTietPhieuDVVCDrawer;
