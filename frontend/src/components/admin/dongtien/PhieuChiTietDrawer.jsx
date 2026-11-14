// frontend/src/components/admin/dongtien/PhieuChiTietDrawer.jsx
import { money, fmtDate, StatusBadge, EmptyState } from "./DongTienUI";

const doanhThuDon = (d) =>
  (Number(d?.dts_tienvanchuyen) || 0) +
  (Number(d?.dts_tonggiamgiavanchuyen) || 0);

const PhieuChiTietDrawer = ({
  open,
  onClose,
  data,
  loading,
  variant = "kho",
}) => {
  const laKho = variant === "kho";
  const phieu = data?.phieu;
  const donHang = data?.don_hang || [];
  const qr = data?.qr || [];

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
              {laKho ? "Chi tiết phiếu tất toán" : "Chi tiết phiếu thu phí sàn"}
            </h2>
            <p className="mt-0.5 text-sm text-slate-500">
              {phieu ? `${phieu.ptt_ma} · ${phieu.kho_ten}` : "Đang tải..."}
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
              title="Không tải được phiếu"
              hint="Phiếu có thể đã bị hủy hoặc không tồn tại."
            />
          )}

          {!loading && phieu && (
            <>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <span className="font-mono text-sm font-semibold text-indigo-600">
                    {phieu.ptt_ma}
                  </span>
                  <StatusBadge status={phieu.ptt_trang_thai_thanh_toan} />
                </div>
                <dl className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <dt className="text-xs text-slate-500">Kho</dt>
                    <dd className="font-medium text-slate-800">
                      {phieu.kho_ten}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500">Số đơn</dt>
                    <dd className="font-medium text-slate-800">
                      {donHang.length}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500">Ngày tạo phiếu</dt>
                    <dd className="text-slate-700">
                      {fmtDate(phieu.ptt_ngay_tat_toan)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500">Hoàn tất</dt>
                    <dd className="text-slate-700">
                      {fmtDate(phieu.ptt_thoi_diem_hoan_tat)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500">Phí sàn</dt>
                    <dd className="font-semibold text-amber-600">
                      {money(phieu.ptt_tong_tien_san)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500">Tiền shop</dt>
                    <dd className="font-semibold text-indigo-600">
                      {money(phieu.ptt_tong_tien_shop)}
                    </dd>
                  </div>
                </dl>
              </div>

              <div>
                <h3 className="mb-2 text-sm font-bold text-slate-800">
                  Mã QR thanh toán
                </h3>
                <div className="space-y-2">
                  {qr.length === 0 && (
                    <p className="text-sm text-slate-400">
                      Không có mã QR (phiếu đã bị dọn).
                    </p>
                  )}
                  {qr.map((q) => (
                    <div
                      key={q.qr_ma}
                      className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-mono text-xs text-slate-700">
                          {q.qr_ma}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {q.qr_loai === "SAN"
                            ? "Phí sàn"
                            : `Shop ${q.gh_ma || ""}`}{" "}
                          · {fmtDate(q.qr_thoi_diem_tt)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-slate-800">
                          {money(q.qr_so_tien)}
                        </p>
                        <p
                          className={`text-[11px] font-medium ${
                            q.qr_trang_thai === "DA_THANH_TOAN"
                              ? "text-emerald-600"
                              : "text-amber-600"
                          }`}
                        >
                          {q.qr_trang_thai === "DA_THANH_TOAN"
                            ? "Đã thanh toán"
                            : "Chưa thanh toán"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="mb-2 text-sm font-bold text-slate-800">
                  Đơn hàng trong phiếu
                </h3>
                <div className="overflow-x-auto rounded-lg border border-slate-200">
                  <table className="w-full min-w-[560px] text-left text-sm">
                    <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                      <tr>
                        <th className="px-3 py-2">Đơn</th>
                        <th className="px-3 py-2">Shop</th>
                        <th className="px-3 py-2 text-right">Phí sàn</th>
                        <th className="px-3 py-2 text-right">Tiền shop</th>
                        {laKho && (
                          <th className="px-3 py-2 text-right">
                            Doanh thu kho
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {donHang.map((d) => (
                        <tr key={d.dts_ma}>
                          <td className="px-3 py-2 font-mono text-xs text-indigo-600">
                            {d.dts_ma}
                          </td>
                          <td className="max-w-[120px] truncate px-3 py-2 text-slate-700">
                            {d.gh_ten || "—"}
                          </td>
                          <td className="px-3 py-2 text-right text-slate-700">
                            {money(d.ctt_tien_san)}
                          </td>
                          <td className="px-3 py-2 text-right text-slate-700">
                            {money(d.ctt_tien_shop)}
                          </td>
                          {laKho && (
                            <td className="px-3 py-2 text-right font-semibold text-emerald-700">
                              {money(doanhThuDon(d))}
                            </td>
                          )}
                        </tr>
                      ))}
                      {donHang.length === 0 && (
                        <tr>
                          <td
                            colSpan={laKho ? 5 : 4}
                            className="px-3 py-6 text-center text-slate-400"
                          >
                            Không có đơn hàng.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <p className="mt-2 text-[11px] leading-relaxed text-slate-400">
                  {laKho ? (
                    <>
                      Doanh thu kho mỗi đơn = tiền ship khách trả (
                      <code>dts_tienvanchuyen</code>) + voucher ship sàn chuyển
                      cho kho (<code>dts_tonggiamgiavanchuyen</code>).
                    </>
                  ) : (
                    <>
                      Phí sàn mỗi đơn là phần sàn giữ lại trên đơn (
                      <code>ctt_tien_san</code>); tiền shop là phần kho trả lại
                      cho shop (<code>ctt_tien_shop</code>).
                    </>
                  )}
                </p>
              </div>
            </>
          )}
        </div>

        <div className="border-t border-slate-200 p-4">
          <button
            onClick={onClose}
            className="w-full rounded-lg bg-slate-100 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-200"
          >
            Đóng
          </button>
        </div>
      </aside>
    </>
  );
};

export default PhieuChiTietDrawer;
