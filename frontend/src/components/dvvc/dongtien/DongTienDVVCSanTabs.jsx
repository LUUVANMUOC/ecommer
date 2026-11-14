// frontend/src/components/dvvc/dongtien/DongTienDVVCSanTabs.jsx
import { Fragment } from "react";
import {
  money,
  fmtDate,
  EmptyState,
  Pager,
  NoteBox,
} from "../../admin/dongtien/DongTienUI";
import {
  EMPTY,
  TH,
  TD,
  MiniMoney,
  PhieuStatusBadge,
  fmtDay,
} from "./DongTienDVVCUI";
import { PhieuDetail } from "./DongTienDVVCTables";

export const SanChuaChuyenTab = ({
  kpi = {},
  phieuCho = EMPTY,
  donChuaLap = { rows: EMPTY, total: 0, page: 1, total_pages: 1 },
  loading,
  onPage,
  expandedPcd,
  onTogglePhieu,
  phieuDetail = {},
}) => {
  const rows = donChuaLap?.rows || EMPTY;

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-3">
        <MiniMoney
          label="Chưa lập phiếu chi"
          value={kpi.san_chua_lap || 0}
          hint={`${kpi.san_chua_lap_don || 0} đơn`}
          tone="amber"
        />
        <MiniMoney
          label="Chờ QR"
          value={kpi.san_cho_qr || 0}
          hint={`${kpi.san_cho_qr_don || 0} đơn · ${
            kpi.san_cho_qr_phieu || 0
          } phiếu`}
          tone="sky"
        />
        <MiniMoney
          label="Tổng sàn chưa chuyển"
          value={kpi.san_chua_chuyen || 0}
          hint={`${kpi.san_chua_chuyen_don || 0} đơn`}
          tone="red"
        />
      </div>

      <NoteBox tone="amber">
        Chỉ tính đơn có <strong>voucher ship sàn bù &gt; 0</strong> và không bị
        hủy. Danh sách bên dưới là tồn hiện tại, không lọc theo tháng/năm và
        không áp dụng bộ lọc kho.
      </NoteBox>

      <div>
        <h3 className="mb-2 text-sm font-bold text-slate-800">
          Phiếu đang chờ QR
        </h3>

        {phieuCho.length === 0 ? (
          <EmptyState
            icon="qr_code"
            title="Không có phiếu chờ QR"
            hint="Các phiếu chờ thanh toán sẽ xuất hiện ở đây."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className={TH}>Mã phiếu</th>
                  <th className={TH}>Ngày tạo</th>
                  <th className={`${TH} text-right`}>Số đơn</th>
                  <th className={`${TH} text-right`}>Số tiền</th>
                  <th className={TH}>Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {phieuCho.map((p) => {
                  const open = expandedPcd === p.pcd_ma;

                  return (
                    <Fragment key={p.pcd_ma}>
                      <tr
                        className="cursor-pointer hover:bg-sky-50/60"
                        onClick={() => onTogglePhieu(p.pcd_ma)}
                      >
                        <td
                          className={`${TD} font-mono text-xs font-semibold text-indigo-600`}
                        >
                          <span className="mr-1.5 inline-flex align-middle text-slate-400">
                            <span className="material-symbols-outlined text-[18px]">
                              {open ? "expand_less" : "expand_more"}
                            </span>
                          </span>
                          {p.pcd_ma}
                        </td>
                        <td className={`${TD} text-slate-500`}>
                          {fmtDate(p.pcd_ngay_tao)}
                        </td>
                        <td className={`${TD} text-right`}>{p.so_don}</td>
                        <td className={`${TD} text-right font-semibold`}>
                          {money(p.pcd_tong_tien || 0)}
                        </td>
                        <td className={TD}>
                          <PhieuStatusBadge status="CHO_THANH_TOAN" />
                        </td>
                      </tr>

                      {open && (
                        <tr>
                          <td colSpan={5} className="bg-slate-50/60 px-3 py-3">
                            <PhieuDetail state={phieuDetail[p.pcd_ma]} />
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div>
        <h3 className="mb-2 text-sm font-bold text-slate-800">
          Đơn chưa lập phiếu chi
        </h3>

        {loading ? (
          <p className="py-8 text-center text-sm text-slate-500">
            Đang tải đơn chưa lập phiếu...
          </p>
        ) : rows.length === 0 ? (
          <EmptyState
            icon="receipt_long"
            title="Không có đơn chưa lập phiếu"
            hint="Tất cả đơn có voucher ship đã được đưa vào phiếu chi."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] border-collapse">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className={TH}>Mã đơn</th>
                  <th className={TH}>Ngày lập</th>
                  <th className={TH}>Shop</th>
                  <th className={TH}>Kho</th>
                  <th className={TH}>Shipper</th>
                  <th className={`${TH} text-right`}>Tiền sàn bù</th>
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
                    <td className={TD}>{r.gh_ten || "—"}</td>
                    <td className={TD}>{r.kho_ten || "—"}</td>
                    <td className={TD}>{r.shipper_ten || "—"}</td>
                    <td
                      className={`${TD} text-right font-semibold text-amber-700`}
                    >
                      {money(r.tien_san_bu || 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Pager
          page={donChuaLap?.page || 1}
          totalPages={donChuaLap?.total_pages || 1}
          total={donChuaLap?.total || 0}
          unit="đơn"
          onChange={onPage}
        />
      </div>
    </div>
  );
};

export const SanDaChuyenTab = ({
  data = { rows: EMPTY, total: 0, page: 1, total_pages: 1 },
  loading,
  onPage,
  expandedPcd,
  onTogglePhieu,
  phieuDetail = {},
}) => {
  const rows = data?.rows || EMPTY;

  return (
    <div className="space-y-4">
      <NoteBox tone="sky">
        Chỉ hiển thị phiếu đã thanh toán. Mốc thời gian là{" "}
        <strong>ngày hoàn tất phiếu</strong>. Bấm vào dòng để xem đơn hàng và mã
        QR của phiếu.
      </NoteBox>

      {loading ? (
        <p className="py-10 text-center text-sm text-slate-500">
          Đang tải phiếu sàn đã chuyển...
        </p>
      ) : rows.length === 0 ? (
        <EmptyState
          icon="payments"
          title="Chưa có phiếu sàn đã chuyển"
          hint="Thử đổi năm/tháng để xem kỳ khác."
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] border-collapse">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className={TH}>Mã phiếu</th>
                <th className={TH}>Hoàn tất</th>
                <th className={TH}>Ngày tạo</th>
                <th className={`${TH} text-right`}>Số đơn</th>
                <th className={`${TH} text-right`}>QR đã TT</th>
                <th className={`${TH} text-right`}>Số tiền</th>
                <th className={TH}>Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((r) => {
                const open = expandedPcd === r.pcd_ma;

                return (
                  <Fragment key={r.pcd_ma}>
                    <tr
                      className="cursor-pointer hover:bg-emerald-50/50"
                      onClick={() => onTogglePhieu(r.pcd_ma)}
                    >
                      <td
                        className={`${TD} font-mono text-xs font-semibold text-indigo-600`}
                      >
                        <span className="mr-1.5 inline-flex align-middle text-slate-400">
                          <span className="material-symbols-outlined text-[18px]">
                            {open ? "expand_less" : "expand_more"}
                          </span>
                        </span>
                        {r.pcd_ma}
                      </td>
                      <td className={`${TD} text-slate-600`}>
                        {fmtDate(r.pcd_ngay_hoan_tat)}
                      </td>
                      <td className={`${TD} text-slate-500`}>
                        {fmtDate(r.pcd_ngay_tao)}
                      </td>
                      <td className={`${TD} text-right`}>{r.so_don}</td>
                      <td className={`${TD} text-right text-slate-600`}>
                        {r.so_qr_da_tt}/{r.so_qr}
                      </td>
                      <td
                        className={`${TD} text-right font-semibold text-emerald-700`}
                      >
                        {money(r.pcd_tong_tien || 0)}
                      </td>
                      <td className={TD}>
                        <PhieuStatusBadge status={r.pcd_trang_thai} />
                      </td>
                    </tr>

                    {open && (
                      <tr>
                        <td colSpan={7} className="bg-slate-50/60 px-3 py-3">
                          <PhieuDetail state={phieuDetail[r.pcd_ma]} />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Pager
        page={data?.page || 1}
        totalPages={data?.total_pages || 1}
        total={data?.total || 0}
        unit="phiếu"
        onChange={onPage}
      />
    </div>
  );
};
