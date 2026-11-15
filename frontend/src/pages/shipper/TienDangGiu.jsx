// frontend/src/pages/shipper/TienDangGiu.jsx
import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { AuthContext } from "../../contexts/AuthContext";
import tienDangGiuService from "../../services/shipper/tienDangGiuService";
import ToastNotification from "../../components/common/Crud/ToastNotification";
import {
  INPUT,
  money,
  fmtDate,
  KpiCard,
  SectionCard,
  EmptyState,
  TabBar,
  ViewToggle,
  NoteBox,
} from "../../components/admin/dongtien/DongTienUI";
import { BarLineChart } from "../../components/admin/dongtien/Charts";
import {
  TH,
  TD,
  num,
  fmtDay,
  downloadCsv,
} from "../../components/dvvc/dongtien/DongTienDVVCUI";

const TABS = [
  { key: "dang-giu", label: "Đang giữ" },
  { key: "thong-ke", label: "Thống kê" },
  { key: "lich-su-nop", label: "Lịch sử nộp" },
];

const CHART_VIEWS = [
  { id: "ngay", label: "Theo ngày", icon: "calendar_view_day" },
  { id: "tuan", label: "Theo tuần", icon: "date_range" },
];

const EMPTY_TONG = {
  so_don: 0,
  tien: 0,
  cho_xac_nhan_don: 0,
  cho_xac_nhan_tien: 0,
};

const EMPTY_LS_TONG = { so_lan: 0, so_don: 0, tong_tien: 0 };

const isoLocal = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;

const macDinhN = (n) => {
  const den = new Date();
  const tu = new Date();
  tu.setDate(tu.getDate() - (n - 1));
  return { tu_ngay: isoLocal(tu), den_ngay: isoLocal(den) };
};

const macDinh30Ngay = () => macDinhN(30);

const nhanKhoang = (tu, den) => {
  if (!tu && !den) return "Tất cả thời gian";
  if (tu && den) return `${fmtDay(tu)} – ${fmtDay(den)}`;
  if (tu) return `Từ ${fmtDay(tu)}`;
  return `Đến ${fmtDay(den)}`;
};

const DonTable = ({ rows = [], emptyTitle, emptyHint }) => {
  if (rows.length === 0) {
    return <EmptyState icon="inbox" title={emptyTitle} hint={emptyHint} />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[840px] border-collapse">
        <thead className="bg-slate-50">
          <tr>
            <th className={TH}>Mã đơn</th>
            <th className={TH}>Ngày giao</th>
            <th className={TH}>Shop</th>
            <th className={`${TH} text-right`}>Khách trả</th>
            <th className={`${TH} text-right`}>Trả shop</th>
            <th className={`${TH} text-right`}>Phí sàn</th>
            <th className={`${TH} text-right`}>Cước ship</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((r) => (
            <tr key={r.dts_ma} className="hover:bg-slate-50/70">
              <td className={`${TD} font-semibold text-slate-800`}>
                {r.dts_ma}
              </td>
              <td className={TD}>{fmtDay(r.ngay_giao || r.thoi_diem_giao)}</td>
              <td className={TD}>{r.gh_ten || "—"}</td>
              <td className={`${TD} text-right font-semibold text-slate-900`}>
                {money(r.khach_tra)}
              </td>
              <td className={`${TD} text-right`}>{money(r.tra_shop)}</td>
              <td className={`${TD} text-right text-amber-700`}>
                {money(r.phi_san)}
              </td>
              <td className={`${TD} text-right`}>{money(r.cuoc_ship)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const BoLocNgay = ({
  filters,
  onChange,
  onAll,
  onQuick,
  onReload,
  loading,
  onExport,
}) => (
  <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
    <label className="flex flex-col gap-1">
      <span className="text-xs font-medium text-slate-500">Từ ngày</span>
      <input
        type="date"
        className={INPUT}
        value={filters.tu_ngay}
        onChange={(e) => onChange({ ...filters, tu_ngay: e.target.value })}
      />
    </label>

    <label className="flex flex-col gap-1">
      <span className="text-xs font-medium text-slate-500">Đến ngày</span>
      <input
        type="date"
        className={INPUT}
        value={filters.den_ngay}
        onChange={(e) => onChange({ ...filters, den_ngay: e.target.value })}
      />
    </label>

    {onQuick && (
      <div className="flex items-center gap-1">
        {[7, 30, 90].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onQuick(n)}
            className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-600 hover:bg-slate-50"
          >
            {n} ngày
          </button>
        ))}
      </div>
    )}

    {onAll && (
      <button
        type="button"
        onClick={onAll}
        className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 hover:bg-slate-50"
      >
        Tất cả
      </button>
    )}

    <div className="ml-auto flex items-center gap-2">
      <button
        type="button"
        onClick={onExport}
        className="flex h-10 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 hover:bg-slate-50"
      >
        <span className="material-symbols-outlined text-[18px]">download</span>
        CSV
      </button>
      <button
        type="button"
        onClick={onReload}
        disabled={loading}
        className="flex h-10 items-center gap-1.5 rounded-lg bg-[#1e3a5f] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#2a4b73] disabled:opacity-60"
      >
        <span
          className={`material-symbols-outlined text-[18px] ${
            loading ? "animate-spin" : ""
          }`}
        >
          refresh
        </span>
        {loading ? "Đang tải" : "Làm mới"}
      </button>
    </div>
  </div>
);

const TienDangGiu = () => {
  const { user } = useContext(AuthContext);
  const shipper_ma = user?.shipper_ma;

  const [activeTab, setActiveTab] = useState("dang-giu");
  const [shipper, setShipper] = useState(null);
  const [kpi, setKpi] = useState(null);
  const [lastUpdated, setLastUpdated] = useState("");

  const [giuFilters, setGiuFilters] = useState({ tu_ngay: "", den_ngay: "" });
  const [giuData, setGiuData] = useState({
    dang_giu: [],
    cho_xac_nhan: [],
    tong: EMPTY_TONG,
  });
  const [giuLoading, setGiuLoading] = useState(true);

  const [tkFilters, setTkFilters] = useState(macDinh30Ngay);
  const [tkView, setTkView] = useState("ngay");
  const [tkData, setTkData] = useState(null);
  const [tkLoading, setTkLoading] = useState(true);

  const [lsFilters, setLsFilters] = useState(macDinh30Ngay);
  const [lsData, setLsData] = useState({
    danh_sach: [],
    tong: EMPTY_LS_TONG,
  });
  const [lsLoading, setLsLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });

  const showToast = useCallback((message, type = "success") => {
    setToast({ show: true, message, type });
    window.setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 3000);
  }, []);

  const taiThongTin = useCallback(async () => {
    if (!shipper_ma) return;
    try {
      const res = await tienDangGiuService.getThongTin(shipper_ma);
      setShipper(res.data?.shipper || null);
      setKpi(res.data?.kpi || null);
      setLastUpdated(new Date().toLocaleTimeString("vi-VN", { hour12: false }));
    } catch (err) {
      showToast(
        err.response?.data?.message || "Không tải được thông tin tiền đang giữ",
        "error",
      );
    }
  }, [shipper_ma, showToast]);

  const taiDangGiu = useCallback(
    async (imLang = false) => {
      if (!shipper_ma) return;
      if (!imLang) setGiuLoading(true);
      try {
        const res = await tienDangGiuService.getDangGiu(shipper_ma, {
          tu_ngay: giuFilters.tu_ngay || undefined,
          den_ngay: giuFilters.den_ngay || undefined,
        });
        setGiuData({
          dang_giu: res.data?.dang_giu || [],
          cho_xac_nhan: res.data?.cho_xac_nhan || [],
          tong: res.data?.tong || EMPTY_TONG,
        });
      } catch (err) {
        if (!imLang) {
          showToast(
            err.response?.data?.message || "Không tải được danh sách đang giữ",
            "error",
          );
        }
      } finally {
        if (!imLang) setGiuLoading(false);
      }
    },
    [shipper_ma, giuFilters, showToast],
  );

  const taiThongKe = useCallback(
    async (imLang = false) => {
      if (!shipper_ma) return;
      if (!imLang) setTkLoading(true);
      try {
        const res = await tienDangGiuService.getThongKe(shipper_ma, tkFilters);
        setTkData(res.data || null);
      } catch (err) {
        if (!imLang) {
          showToast(
            err.response?.data?.message || "Không tải được thống kê",
            "error",
          );
        }
      } finally {
        if (!imLang) setTkLoading(false);
      }
    },
    [shipper_ma, tkFilters, showToast],
  );

  const taiLichSu = useCallback(
    async (imLang = false) => {
      if (!shipper_ma) return;
      if (!imLang) setLsLoading(true);
      try {
        const res = await tienDangGiuService.getLichSuNop(
          shipper_ma,
          lsFilters,
        );
        setLsData({
          danh_sach: res.data?.danh_sach || [],
          tong: res.data?.tong || EMPTY_LS_TONG,
        });
      } catch (err) {
        if (!imLang) {
          showToast(
            err.response?.data?.message || "Không tải được lịch sử nộp",
            "error",
          );
        }
      } finally {
        if (!imLang) setLsLoading(false);
      }
    },
    [shipper_ma, lsFilters, showToast],
  );

  useEffect(() => {
    taiThongTin();
  }, [taiThongTin]);

  useEffect(() => {
    if (activeTab === "dang-giu") taiDangGiu();
  }, [activeTab, taiDangGiu]);

  useEffect(() => {
    if (activeTab === "thong-ke") taiThongKe();
  }, [activeTab, taiThongKe]);

  useEffect(() => {
    if (activeTab === "lich-su-nop") taiLichSu();
  }, [activeTab, taiLichSu]);

  // Tự cập nhật 60s khi tab trình duyệt đang hiển thị
  useEffect(() => {
    const id = window.setInterval(() => {
      if (document.visibilityState !== "visible") return;
      taiThongTin();
      if (activeTab === "dang-giu") taiDangGiu(true);
      if (activeTab === "thong-ke") taiThongKe(true);
      if (activeTab === "lich-su-nop") taiLichSu(true);
    }, 60000);

    return () => window.clearInterval(id);
  }, [activeTab, taiThongTin, taiDangGiu, taiThongKe, taiLichSu]);

  const taiLaiTatCa = () => {
    taiThongTin();
    if (activeTab === "dang-giu") taiDangGiu();
    if (activeTab === "thong-ke") taiThongKe();
    if (activeTab === "lich-su-nop") taiLichSu();
  };

  const chartRows = useMemo(
    () =>
      tkView === "ngay" ? tkData?.theo_ngay || [] : tkData?.theo_tuan || [],
    [tkData, tkView],
  );

  const chartData = useMemo(() => {
    const nhanMoi = Math.max(1, Math.ceil(chartRows.length / 12));
    return chartRows.map((r, i) => ({
      label: i % nhanMoi === 0 || i === chartRows.length - 1 ? r.label : "",
      vao: num(r.tien_vao),
      ra: num(r.tien_ra),
      net: num(r.so_du_cuoi_ky),
    }));
  }, [chartRows]);

  const xuatDangGiu = () => {
    const rows = [
      ...giuData.dang_giu.map((r) => [
        "Đang giữ",
        r.dts_ma,
        r.ngay_giao || "",
        r.gh_ten,
        r.khach_tra,
        r.tra_shop,
        r.phi_san,
        r.cuoc_ship,
      ]),
      ...giuData.cho_xac_nhan.map((r) => [
        "Chờ khách xác nhận",
        r.dts_ma,
        r.ngay_giao || "",
        r.gh_ten,
        r.khach_tra,
        r.tra_shop,
        r.phi_san,
        r.cuoc_ship,
      ]),
    ];

    downloadCsv(
      `tien-dang-giu-${shipper_ma || "shipper"}`,
      [
        "Loại",
        "Mã đơn",
        "Ngày giao",
        "Shop",
        "Khách trả",
        "Trả shop",
        "Phí sàn",
        "Cước ship",
      ],
      rows,
    );
  };

  const xuatThongKe = () => {
    const rows = chartRows.map((r) => [
      tkView === "ngay" ? r.ngay : `Tuần ${r.tuan}/${r.nam}`,
      tkView === "ngay" ? r.ngay : r.tu_ngay,
      tkView === "ngay" ? r.ngay : r.den_ngay,
      r.so_don_vao,
      r.tien_vao,
      r.so_don_ra,
      r.tien_ra,
      r.so_du_cuoi_ky,
    ]);

    downloadCsv(
      `thong-ke-tien-dang-giu-${shipper_ma || "shipper"}`,
      [
        "Kỳ",
        "Từ ngày",
        "Đến ngày",
        "Số đơn giữ",
        "Tiền giữ",
        "Số đơn nộp",
        "Tiền nộp",
        "Số dư cuối kỳ",
      ],
      rows,
    );
  };

  const xuatLichSu = () => {
    const rows = [];

    for (const lan of lsData.danh_sach) {
      for (const don of lan.don) {
        rows.push([
          fmtDate(lan.thoi_diem_nop),
          don.dts_ma,
          don.ngay_giao || "",
          don.gh_ten,
          don.khach_tra,
          don.tra_shop,
          don.phi_san,
          don.cuoc_ship,
        ]);
      }
    }

    downloadCsv(
      `lich-su-nop-${shipper_ma || "shipper"}`,
      [
        "Thời điểm nộp",
        "Mã đơn",
        "Ngày giao",
        "Shop",
        "Khách trả",
        "Trả shop",
        "Phí sàn",
        "Cước ship",
      ],
      rows,
    );
  };

  if (!shipper_ma) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] p-6">
        <EmptyState
          icon="badge"
          title="Không xác định được shipper"
          hint="Vui lòng đăng nhập lại bằng tài khoản shipper."
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6">
      <ToastNotification toast={toast} />

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A]">Tiền đang giữ</h1>
          <p className="mt-1 text-sm text-[#64748B]">
            {shipper
              ? `${shipper.shipper_ten} • ${
                  shipper.kho_ten || "Chưa gán kho"
                } • ${shipper.lshipper_ten || shipper.lsp_ma || ""}`
              : "Tiền COD shipper đang giữ và lịch sử nộp cho kho"}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-xs text-slate-400">
              Cập nhật {lastUpdated}
            </span>
          )}
          <button
            type="button"
            onClick={taiLaiTatCa}
            className="flex h-10 items-center gap-1.5 rounded-lg bg-[#1e3a5f] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#2a4b73]"
          >
            <span className="material-symbols-outlined text-[18px]">
              refresh
            </span>
            Làm mới
          </button>
        </div>
      </div>

      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          tone="emerald"
          icon="account_balance_wallet"
          label="Đang giữ"
          value={money(kpi?.dang_giu?.tien || 0)}
          hint={`${num(kpi?.dang_giu?.so_don)} đơn khách đã xác nhận`}
        />
        <KpiCard
          tone="amber"
          icon="hourglass_top"
          label="Chờ khách xác nhận"
          value={money(kpi?.cho_xac_nhan?.tien || 0)}
          hint={`${num(
            kpi?.cho_xac_nhan?.so_don,
          )} đơn • không cộng vào đang giữ`}
        />
        <KpiCard
          tone="blue"
          icon="payments"
          label="Đã nộp kho"
          value={money(kpi?.da_nop?.tien || 0)}
          hint={`${num(kpi?.da_nop?.so_don)} đơn`}
        />
        <KpiCard
          tone="slate"
          icon="local_shipping"
          label="Giao 30 ngày"
          value={`${num(kpi?.giao_30?.so_don)} đơn`}
          hint={money(kpi?.giao_30?.tien || 0)}
        />
      </div>

      <div className="mb-4">
        <TabBar tabs={TABS} active={activeTab} onChange={setActiveTab} />
      </div>

      {activeTab === "dang-giu" && (
        <div className="space-y-4">
          <BoLocNgay
            filters={giuFilters}
            onChange={setGiuFilters}
            onAll={() => setGiuFilters({ tu_ngay: "", den_ngay: "" })}
            onReload={() => taiDangGiu()}
            loading={giuLoading}
            onExport={xuatDangGiu}
          />

          <SectionCard
            title={`Đang giữ (${num(giuData.tong.so_don)} đơn)`}
            subtitle="Khách đã xác nhận, shipper chưa nộp tiền cho kho"
            action={
              <span className="text-lg font-bold text-emerald-700">
                {money(giuData.tong.tien)}
              </span>
            }
          >
            {giuLoading ? (
              <p className="py-10 text-center text-sm text-slate-400">
                Đang tải…
              </p>
            ) : (
              <DonTable
                rows={giuData.dang_giu}
                emptyTitle="Không có đơn đang giữ"
                emptyHint="Mọi đơn đã giao đều đã nộp tiền cho kho."
              />
            )}
          </SectionCard>

          <SectionCard
            title={`Chờ khách xác nhận (${num(
              giuData.tong.cho_xac_nhan_don,
            )} đơn)`}
            subtitle="Hiển thị riêng, không cộng vào tiền đang giữ"
            action={
              <span className="text-lg font-bold text-amber-700">
                {money(giuData.tong.cho_xac_nhan_tien)}
              </span>
            }
          >
            <DonTable
              rows={giuData.cho_xac_nhan}
              emptyTitle="Không có đơn chờ xác nhận"
              emptyHint="Các đơn đã giao đều đã được khách xác nhận."
            />
          </SectionCard>

          <NoteBox tone="sky">
            “Đang giữ” = đơn đã giao + khách đã xác nhận + shipper chưa nộp tiền
            (khớp trang “Thu tiền từ shipper” của kho). Tiền đang giữ tính theo
            cột <strong>Khách trả</strong> (COD); các cột Trả shop / Phí sàn /
            Cước ship dùng để đối chiếu.
          </NoteBox>
        </div>
      )}

      {activeTab === "thong-ke" && (
        <div className="space-y-4">
          <BoLocNgay
            filters={tkFilters}
            onChange={setTkFilters}
            onQuick={(n) => setTkFilters(macDinhN(n))}
            onReload={() => taiThongKe()}
            loading={tkLoading}
            onExport={xuatThongKe}
          />

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              tone="blue"
              icon="south_west"
              label="Tiền giữ phát sinh"
              value={money(tkData?.tong?.tien_vao || 0)}
              hint={`${num(tkData?.tong?.so_don_vao)} đơn giao trong kỳ`}
            />
            <KpiCard
              tone="amber"
              icon="north_east"
              label="Đã nộp kho"
              value={money(tkData?.tong?.tien_ra || 0)}
              hint={`${num(tkData?.tong?.so_don_ra)} đơn`}
            />
            <KpiCard
              tone="slate"
              icon="savings"
              label="Số dư đầu kỳ"
              value={money(tkData?.so_du_dau_ky || 0)}
              hint={nhanKhoang(tkData?.tu_ngay, tkData?.den_ngay)}
            />
            <KpiCard
              tone="emerald"
              icon="account_balance_wallet"
              label="Số dư cuối kỳ"
              value={money(tkData?.tong?.so_du_cuoi_ky || 0)}
              hint="Khớp “Đang giữ” nếu kỳ kết thúc hôm nay"
            />
          </div>

          <SectionCard
            title="Biến động tiền đang giữ"
            subtitle="Cột: tiền giữ phát sinh / đã nộp. Đường: số dư cuối kỳ."
            action={
              <ViewToggle
                views={CHART_VIEWS}
                active={tkView}
                onChange={setTkView}
              />
            }
          >
            {tkLoading ? (
              <p className="py-10 text-center text-sm text-slate-400">
                Đang tải…
              </p>
            ) : chartData.length === 0 ? (
              <EmptyState
                icon="bar_chart"
                title="Chưa có dữ liệu trong kỳ"
                hint="Chọn khoảng ngày khác để xem biến động."
              />
            ) : (
              <BarLineChart
                data={chartData}
                labels={{
                  vao: "Tiền giữ phát sinh",
                  ra: "Đã nộp kho",
                  net: "Số dư cuối kỳ",
                }}
              />
            )}
          </SectionCard>

          <SectionCard
            title={
              tkView === "ngay" ? "Chi tiết theo ngày" : "Chi tiết theo tuần"
            }
            subtitle={nhanKhoang(tkData?.tu_ngay, tkData?.den_ngay)}
          >
            <div className="overflow-x-auto">
              <table className="w-full min-w-[780px] border-collapse">
                <thead className="bg-slate-50">
                  <tr>
                    <th className={TH}>Kỳ</th>
                    <th className={`${TH} text-right`}>Số đơn giữ</th>
                    <th className={`${TH} text-right`}>Tiền giữ</th>
                    <th className={`${TH} text-right`}>Số đơn nộp</th>
                    <th className={`${TH} text-right`}>Tiền nộp</th>
                    <th className={`${TH} text-right`}>Số dư cuối kỳ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {chartRows.map((r, i) => (
                    <tr
                      key={`${r.ngay || r.tu_ngay}-${i}`}
                      className="hover:bg-slate-50/70"
                    >
                      <td className={`${TD} font-medium text-slate-700`}>
                        {tkView === "ngay"
                          ? fmtDay(r.ngay)
                          : `${fmtDay(r.tu_ngay)} – ${fmtDay(r.den_ngay)}`}
                      </td>
                      <td className={`${TD} text-right`}>{r.so_don_vao}</td>
                      <td className={`${TD} text-right text-sky-700`}>
                        {money(r.tien_vao)}
                      </td>
                      <td className={`${TD} text-right`}>{r.so_don_ra}</td>
                      <td className={`${TD} text-right text-amber-700`}>
                        {money(r.tien_ra)}
                      </td>
                      <td
                        className={`${TD} text-right font-semibold text-emerald-700`}
                      >
                        {money(r.so_du_cuoi_ky)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {chartRows.length === 0 && (
                <EmptyState
                  icon="table_rows"
                  title="Chưa có dữ liệu"
                  hint="Không có đơn giao hoặc lần nộp nào trong kỳ."
                />
              )}
            </div>
          </SectionCard>
        </div>
      )}

      {activeTab === "lich-su-nop" && (
        <div className="space-y-4">
          <BoLocNgay
            filters={lsFilters}
            onChange={setLsFilters}
            onQuick={(n) => setLsFilters(macDinhN(n))}
            onReload={() => taiLichSu()}
            loading={lsLoading}
            onExport={xuatLichSu}
          />

          <SectionCard
            title={`Lịch sử nộp (${num(lsData.tong.so_lan)} lần)`}
            subtitle={`${num(lsData.tong.so_don)} đơn • ${nhanKhoang(
              lsFilters.tu_ngay,
              lsFilters.den_ngay,
            )}`}
            action={
              <span className="text-lg font-bold text-emerald-700">
                {money(lsData.tong.tong_tien)}
              </span>
            }
          >
            {lsLoading ? (
              <p className="py-10 text-center text-sm text-slate-400">
                Đang tải…
              </p>
            ) : lsData.danh_sach.length === 0 ? (
              <EmptyState
                icon="payments"
                title="Chưa có lần nộp nào"
                hint="Kho chưa xác nhận thu tiền trong khoảng thời gian này."
              />
            ) : (
              <div className="space-y-2">
                {lsData.danh_sach.map((lan) => {
                  const mo = expanded === lan.khoa;

                  return (
                    <div
                      key={lan.khoa}
                      className="overflow-hidden rounded-xl border border-slate-200"
                    >
                      <button
                        type="button"
                        onClick={() => setExpanded(mo ? null : lan.khoa)}
                        className="flex w-full flex-wrap items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <span className="material-symbols-outlined text-[20px] text-slate-400">
                            {mo ? "expand_less" : "expand_more"}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-800">
                              {fmtDate(lan.thoi_diem_nop)}
                            </p>
                            <p className="text-xs text-slate-500">
                              {lan.so_don} đơn •{" "}
                              {mo ? "Thu gọn" : "Bấm để xem đơn"}
                            </p>
                          </div>
                        </div>
                        <span className="text-sm font-bold text-emerald-700">
                          {money(lan.tong_tien)}
                        </span>
                      </button>

                      {mo && (
                        <div className="border-t border-slate-100 bg-slate-50/40 p-3">
                          <DonTable rows={lan.don} emptyTitle="Không có đơn" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </SectionCard>

          <NoteBox tone="slate">
            Mỗi lần kho bấm xác nhận thu tiền là một mốc “thời điểm nộp”; lịch
            sử được gom đúng theo từng mốc đó. Bấm vào một lần nộp để xem danh
            sách đơn.
          </NoteBox>
        </div>
      )}
    </div>
  );
};

export default TienDangGiu;
