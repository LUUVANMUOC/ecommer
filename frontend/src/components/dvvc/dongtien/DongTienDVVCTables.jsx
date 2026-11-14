// frontend/src/components/dvvc/dongtien/DongTienDVVCTables.jsx
import { Fragment, useMemo } from "react";
import {
  money,
  fmtDate,
  EmptyState,
  Pager,
} from "../../admin/dongtien/DongTienUI";
import {
  EMPTY,
  TH,
  TD,
  num,
  fmtDay,
  PhieuStatusBadge,
  GiuBadge,
} from "./DongTienDVVCUI";

export const OrderList = ({ state, title, onPage }) => {
  const rows = state?.rows || EMPTY;
  const loading = state?.loading;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold text-slate-700">{title}</p>
        <p className="text-[11px] text-slate-400">{state?.total ?? 0} đơn</p>
      </div>

      {loading ? (
        <p className="py-6 text-center text-xs text-slate-500">
          Đang tải đơn...
        </p>
      ) : rows.length === 0 ? (
        <p className="py-6 text-center text-xs text-slate-400">
          Không có đơn đang giữ.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] border-collapse text-left">
            <thead className="bg-slate-50 text-[11px] uppercase text-slate-500">
              <tr>
                <th className={TH}>Mã đơn</th>
                <th className={TH}>Ngày lập</th>
                <th className={TH}>Shipper</th>
                <th className={TH}>Kho</th>
                <th className={`${TH} text-right`}>COD</th>
                <th className={`${TH} text-right`}>Trả shop</th>
                <th className={`${TH} text-right`}>Phí sàn</th>
                <th className={`${TH} text-right`}>Cước ĐVVC</th>
                <th className={TH}>Đang giữ</th>
                <th className={`${TH} text-right`}>Số ngày</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((r) => (
                <tr key={r.dts_ma} className="hover:bg-slate-50/70">
                  <td
                    className={`${TD} font-mono text-xs font-semibold text-indigo-600`}
                  >
                    {r.dts_ma}
                  </td>
                  <td className={`${TD} text-slate-500`}>
                    {fmtDay(r.dts_ngaylap)}
                  </td>
                  <td className={TD}>{r.shipper_ten || "—"}</td>
                  <td className={TD}>{r.kho_ten || "—"}</td>
                  <td
                    className={`${TD} text-right font-semibold text-slate-800`}
                  >
                    {money(r.cod || 0)}
                  </td>
                  <td className={`${TD} text-right text-indigo-700`}>
                    {money(r.tra_shop || 0)}
                  </td>
                  <td className={`${TD} text-right text-amber-700`}>
                    {money(r.tra_san || 0)}
                  </td>
                  <td className={`${TD} text-right text-rose-600`}>
                    {money(r.dvvc_giu || 0)}
                  </td>
                  <td className={TD}>
                    <GiuBadge value={r.dang_giu} />
                  </td>
                  <td className={`${TD} text-right text-slate-500`}>
                    {num(r.so_ngay_giu)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && rows.length > 0 && (
        <Pager
          page={state?.page || 1}
          totalPages={state?.total_pages || 1}
          total={state?.total || 0}
          unit="đơn"
          onChange={onPage}
        />
      )}
    </div>
  );
};

export const PhieuDetail = ({ state }) => {
  if (state?.loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-4 text-center text-xs text-slate-500">
        Đang tải chi tiết phiếu...
      </div>
    );
  }

  const data = state?.data;
  if (!data?.phieu) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-4 text-center text-xs text-slate-400">
        Không tải được chi tiết phiếu.
      </div>
    );
  }

  const phieu = data.phieu;
  const donHang = data.don_hang || EMPTY;
  const qr = data.qr || EMPTY;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-mono text-xs font-semibold text-indigo-600">
            {phieu.pcd_ma}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-400">
            Tạo {fmtDate(phieu.pcd_ngay_tao)}
            {phieu.pcd_ngay_hoan_tat
              ? ` · Hoàn tất ${fmtDate(phieu.pcd_ngay_hoan_tat)}`
              : ""}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold text-slate-800">
            {money(phieu.pcd_tong_tien || 0)}
          </p>
          <PhieuStatusBadge status={phieu.pcd_trang_thai} />
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div>
          <h4 className="mb-2 text-xs font-bold text-slate-700">
            Đơn hàng trong phiếu
          </h4>

          {donHang.length === 0 ? (
            <p className="py-4 text-center text-xs text-slate-400">
              Không có đơn hàng.
            </p>
          ) : (
            <div className="max-h-[360px] overflow-auto rounded-lg border border-slate-200">
              <table className="w-full min-w-[620px] border-collapse text-left">
                <thead className="bg-slate-50 text-[11px] uppercase text-slate-500">
                  <tr>
                    <th className={TH}>Mã đơn</th>
                    <th className={TH}>Shop</th>
                    <th className={TH}>Ngày lập</th>
                    <th className={`${TH} text-right`}>Voucher ship</th>
                    <th className={`${TH} text-right`}>Cước ĐVVC</th>
                    <th className={`${TH} text-right`}>Số tiền chi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {donHang.map((d) => (
                    <tr key={d.dts_ma}>
                      <td
                        className={`${TD} font-mono text-xs font-semibold text-indigo-600`}
                      >
                        {d.dts_ma}
                      </td>
                      <td className={TD}>{d.gh_ten || "—"}</td>
                      <td className={`${TD} text-slate-500`}>
                        {fmtDay(d.dts_ngaylap)}
                      </td>
                      <td className={`${TD} text-right text-amber-700`}>
                        {money(d.dts_tonggiamgiavanchuyen || 0)}
                      </td>
                      <td className={`${TD} text-right text-slate-600`}>
                        {money(d.dts_tienvanchuyen || 0)}
                      </td>
                      <td className={`${TD} text-right font-semibold`}>
                        {money(d.ccd_so_tien || 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div>
          <h4 className="mb-2 text-xs font-bold text-slate-700">Mã QR</h4>

          {qr.length === 0 ? (
            <p className="py-4 text-center text-xs text-slate-400">
              Không có mã QR.
            </p>
          ) : (
            <div className="max-h-[320px] space-y-2 overflow-y-auto pr-1">
              {qr.map((q) => (
                <div
                  key={q.qr_ma}
                  className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate font-mono text-[11px] text-slate-700">
                      {q.qr_ma}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {fmtDate(q.qr_thoi_diem_tt)}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-xs font-semibold text-slate-800">
                      {money(q.qr_so_tien || 0)}
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
          )}
        </div>
      </div>
    </div>
  );
};

export const KhoTable = ({
  rows = EMPTY,
  loading,
  page,
  totalPages,
  totalRows,
  onPage,
  expanded,
  onToggle,
  orderState,
  loadOrders,
}) => {
  const totals = useMemo(
    () =>
      rows.reduce(
        (acc, row) => ({
          so_shipper: acc.so_shipper + num(row.so_shipper),
          so_don_giu: acc.so_don_giu + num(row.so_don_giu),
          shipper_giu: acc.shipper_giu + num(row.shipper_giu),
          kho_giu: acc.kho_giu + num(row.kho_giu),
          tong_giu: acc.tong_giu + num(row.tong_giu),
          tra_shop: acc.tra_shop + num(row.tra_shop),
          tra_san: acc.tra_san + num(row.tra_san),
          dvvc_giu: acc.dvvc_giu + num(row.dvvc_giu),
          tien_nhan: acc.tien_nhan + num(row.tien_nhan),
          tien_tat_toan: acc.tien_tat_toan + num(row.tien_tat_toan),
        }),
        {
          so_shipper: 0,
          so_don_giu: 0,
          shipper_giu: 0,
          kho_giu: 0,
          tong_giu: 0,
          tra_shop: 0,
          tra_san: 0,
          dvvc_giu: 0,
          tien_nhan: 0,
          tien_tat_toan: 0,
        },
      ),
    [rows],
  );

  if (loading) {
    return (
      <p className="py-10 text-center text-sm text-slate-500">
        Đang tải tiền đang giữ theo kho...
      </p>
    );
  }

  if (rows.length === 0) {
    return (
      <EmptyState
        icon="warehouse"
        title="Chưa có kho nào đang giữ tiền"
        hint="Thử đổi bộ lọc kho hoặc kiểm tra lại đơn đã thanh toán."
      />
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1320px] border-collapse">
          <thead className="border-b border-slate-200 bg-slate-50">
            <tr>
              <th className={TH}>Kho</th>
              <th className={`${TH} text-right`}>Shipper</th>
              <th className={`${TH} text-right`}>Đơn giữ</th>
              <th className={`${TH} text-right`}>Shipper giữ</th>
              <th className={`${TH} text-right`}>Kho giữ</th>
              <th className={`${TH} text-right`}>Tổng giữ</th>
              <th className={`${TH} text-right`}>Trả shop</th>
              <th className={`${TH} text-right`}>Phí sàn</th>
              <th className={`${TH} text-right`}>Cước ĐVVC</th>
              <th className={`${TH} text-right`}>Nhận trong kỳ</th>
              <th className={`${TH} text-right`}>Đã tất toán</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {rows.map((k) => {
              const open =
                expanded?.loai === "kho" && expanded?.ma === k.kho_ma;
              const key = `kho:${k.kho_ma}`;

              return (
                <Fragment key={k.kho_ma}>
                  <tr className="hover:bg-slate-50/70">
                    <td className={TD}>
                      <button
                        type="button"
                        onClick={() => onToggle("kho", k.kho_ma)}
                        className="flex items-center gap-1.5 font-medium text-slate-800 hover:text-indigo-600"
                      >
                        <span className="material-symbols-outlined text-[18px] text-slate-400">
                          {open ? "expand_less" : "expand_more"}
                        </span>
                        {k.kho_ten}
                      </button>
                    </td>
                    <td className={`${TD} text-right`}>{k.so_shipper}</td>
                    <td className={`${TD} text-right`}>{k.so_don_giu}</td>
                    <td className={`${TD} text-right text-sky-700`}>
                      {money(k.shipper_giu || 0)}
                    </td>
                    <td className={`${TD} text-right text-amber-700`}>
                      {money(k.kho_giu || 0)}
                    </td>
                    <td
                      className={`${TD} text-right font-semibold text-slate-800`}
                    >
                      {money(k.tong_giu || 0)}
                    </td>
                    <td className={`${TD} text-right text-indigo-700`}>
                      {money(k.tra_shop || 0)}
                    </td>
                    <td className={`${TD} text-right text-amber-700`}>
                      {money(k.tra_san || 0)}
                    </td>
                    <td className={`${TD} text-right text-rose-600`}>
                      {money(k.dvvc_giu || 0)}
                    </td>
                    <td className={`${TD} text-right text-slate-600`}>
                      {k.tien_nhan > 0 ? money(k.tien_nhan) : "—"}
                    </td>
                    <td className={`${TD} text-right text-slate-600`}>
                      {k.tien_tat_toan > 0 ? money(k.tien_tat_toan) : "—"}
                    </td>
                  </tr>

                  {open && (
                    <tr>
                      <td colSpan={11} className="bg-slate-50/60 px-3 py-3">
                        <OrderList
                          state={orderState[key]}
                          title={`Đơn đang giữ thuộc kho ${k.kho_ten} (gồm shipper và kho)`}
                          onPage={(p) => loadOrders("kho", k.kho_ma, p)}
                        />
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>

          <tfoot className="border-t-2 border-slate-200 bg-slate-50 font-semibold">
            <tr>
              <td className={TD}>Tổng trang này ({rows.length} kho)</td>
              <td className={`${TD} text-right`}>{totals.so_shipper}</td>
              <td className={`${TD} text-right`}>{totals.so_don_giu}</td>
              <td className={`${TD} text-right text-sky-700`}>
                {money(totals.shipper_giu)}
              </td>
              <td className={`${TD} text-right text-amber-700`}>
                {money(totals.kho_giu)}
              </td>
              <td className={`${TD} text-right text-slate-800`}>
                {money(totals.tong_giu)}
              </td>
              <td className={`${TD} text-right text-indigo-700`}>
                {money(totals.tra_shop)}
              </td>
              <td className={`${TD} text-right text-amber-700`}>
                {money(totals.tra_san)}
              </td>
              <td className={`${TD} text-right text-rose-600`}>
                {money(totals.dvvc_giu)}
              </td>
              <td className={`${TD} text-right text-slate-600`}>
                {money(totals.tien_nhan)}
              </td>
              <td className={`${TD} text-right text-slate-600`}>
                {money(totals.tien_tat_toan)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <Pager
        page={page}
        totalPages={totalPages}
        total={totalRows}
        unit="kho"
        onChange={onPage}
      />
    </>
  );
};

export const ShipperTable = ({
  rows = EMPTY,
  loading,
  page,
  totalPages,
  totalRows,
  onPage,
  expanded,
  onToggle,
  orderState,
  loadOrders,
}) => {
  const totals = useMemo(
    () =>
      rows.reduce(
        (acc, row) => ({
          so_don: acc.so_don + num(row.so_don),
          tong_giu: acc.tong_giu + num(row.tong_giu),
          tra_shop: acc.tra_shop + num(row.tra_shop),
          tra_san: acc.tra_san + num(row.tra_san),
          dvvc_giu: acc.dvvc_giu + num(row.dvvc_giu),
        }),
        {
          so_don: 0,
          tong_giu: 0,
          tra_shop: 0,
          tra_san: 0,
          dvvc_giu: 0,
        },
      ),
    [rows],
  );

  if (loading) {
    return (
      <p className="py-10 text-center text-sm text-slate-500">
        Đang tải tiền đang giữ theo shipper...
      </p>
    );
  }

  if (rows.length === 0) {
    return (
      <EmptyState
        icon="two_wheeler"
        title="Chưa có shipper nào đang giữ tiền"
        hint="Thử đổi bộ lọc kho hoặc kiểm tra lại đơn đã thanh toán."
      />
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1120px] border-collapse">
          <thead className="border-b border-slate-200 bg-slate-50">
            <tr>
              <th className={TH}>Shipper</th>
              <th className={TH}>Kho</th>
              <th className={`${TH} text-right`}>Số đơn</th>
              <th className={`${TH} text-right`}>Tổng giữ</th>
              <th className={`${TH} text-right`}>Trả shop</th>
              <th className={`${TH} text-right`}>Phí sàn</th>
              <th className={`${TH} text-right`}>Cước ĐVVC</th>
              <th className={TH}>Giữ lâu nhất</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {rows.map((r) => {
              const open =
                expanded?.loai === "shipper" && expanded?.ma === r.shipper_ma;
              const key = `shipper:${r.shipper_ma}`;

              return (
                <Fragment key={r.shipper_ma}>
                  <tr className="hover:bg-slate-50/70">
                    <td className={TD}>
                      <button
                        type="button"
                        onClick={() => onToggle("shipper", r.shipper_ma)}
                        className="flex items-center gap-1.5 font-medium text-slate-800 hover:text-indigo-600"
                      >
                        <span className="material-symbols-outlined text-[18px] text-slate-400">
                          {open ? "expand_less" : "expand_more"}
                        </span>
                        <span>
                          <span className="block">{r.shipper_ten}</span>
                          <span className="block text-[11px] font-normal text-slate-400">
                            {r.shipper_sdt || "—"}
                          </span>
                        </span>
                      </button>
                    </td>
                    <td className={TD}>{r.kho_ten || "—"}</td>
                    <td className={`${TD} text-right`}>{r.so_don}</td>
                    <td
                      className={`${TD} text-right font-semibold text-slate-800`}
                    >
                      {money(r.tong_giu || 0)}
                    </td>
                    <td className={`${TD} text-right text-indigo-700`}>
                      {money(r.tra_shop || 0)}
                    </td>
                    <td className={`${TD} text-right text-amber-700`}>
                      {money(r.tra_san || 0)}
                    </td>
                    <td className={`${TD} text-right text-rose-600`}>
                      {money(r.dvvc_giu || 0)}
                    </td>
                    <td className={`${TD} text-slate-500`}>
                      {r.don_cu_nhat
                        ? `${fmtDay(r.don_cu_nhat)} · ${num(
                            r.so_ngay_giu,
                          )} ngày`
                        : "—"}
                    </td>
                  </tr>

                  {open && (
                    <tr>
                      <td colSpan={8} className="bg-slate-50/60 px-3 py-3">
                        <OrderList
                          state={orderState[key]}
                          title={`Đơn shipper ${r.shipper_ten} đang giữ`}
                          onPage={(p) => loadOrders("shipper", r.shipper_ma, p)}
                        />
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>

          <tfoot className="border-t-2 border-slate-200 bg-slate-50 font-semibold">
            <tr>
              <td className={TD}>Tổng trang này ({rows.length} shipper)</td>
              <td className={TD} />
              <td className={`${TD} text-right`}>{totals.so_don}</td>
              <td className={`${TD} text-right text-slate-800`}>
                {money(totals.tong_giu)}
              </td>
              <td className={`${TD} text-right text-indigo-700`}>
                {money(totals.tra_shop)}
              </td>
              <td className={`${TD} text-right text-amber-700`}>
                {money(totals.tra_san)}
              </td>
              <td className={`${TD} text-right text-rose-600`}>
                {money(totals.dvvc_giu)}
              </td>
              <td className={TD} />
            </tr>
          </tfoot>
        </table>
      </div>

      <Pager
        page={page}
        totalPages={totalPages}
        total={totalRows}
        unit="shipper"
        onChange={onPage}
      />
    </>
  );
};
