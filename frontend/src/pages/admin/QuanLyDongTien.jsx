// frontend/src/pages/admin/QuanLyDongTien.jsx
import { useState, useEffect, useCallback, useMemo } from "react";
import dongTienService from "../../services/san/dongTienService";
import ToastNotification from "../../components/common/Crud/ToastNotification";
import {
  INPUT,
  money,
  fmtDate,
  KpiCard,
  FilterBar,
  TabBar,
  SectionCard,
  EmptyState,
  StatusBadge,
  Pager,
} from "../../components/admin/dongtien/DongTienUI";
import {
  BarLineChart,
  YearLineChart,
  DonutChart,
  StackedBarChart,
  CHART_COLORS,
} from "../../components/admin/dongtien/Charts";
import PhieuChiTietDrawer from "../../components/admin/dongtien/PhieuChiTietDrawer";

const NAM_HIEN_TAI = new Date().getFullYear();
const TABS = [
  { key: "tong-quan", label: "Tổng quan" },
  { key: "theo-kho", label: "Theo kho" },
  { key: "theo-thang", label: "Theo tháng" },
  { key: "theo-nam", label: "Theo năm" },
  { key: "giao-dich", label: "Giao dịch" },
];
const TH =
  "whitespace-nowrap px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500";
const TD = "px-3 py-2.5 text-sm text-slate-700";

const QuanLyDongTien = () => {
  const [danhMuc, setDanhMuc] = useState({ kho: [], nam: [NAM_HIEN_TAI] });
  const [filters, setFilters] = useState({
    kho_ma: "",
    nam: String(NAM_HIEN_TAI),
    thang: "",
    che_do: "kho",
  });
  const [tongQuan, setTongQuan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("tong-quan");

  const [txFilter, setTxFilter] = useState({
    trang_thai: "",
    q: "",
    page: 1,
    limit: 10,
  });
  const [qInput, setQInput] = useState("");
  const [giaoDich, setGiaoDich] = useState({
    rows: [],
    total: 0,
    page: 1,
    total_pages: 1,
  });
  const [txLoading, setTxLoading] = useState(false);

  const [detail, setDetail] = useState({
    open: false,
    loading: false,
    data: null,
  });
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });

  const showToast = useCallback((message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast((p) => ({ ...p, show: false })), 3000);
  }, []);

  // ---- Danh mục kho/năm ----
  useEffect(() => {
    dongTienService
      .getDanhMuc()
      .then((r) => setDanhMuc(r.data))
      .catch(() => showToast("Không tải được danh mục kho/năm", "error"));
  }, [showToast]);

  // ---- Tổng quan ----
  const loadTongQuan = useCallback(async () => {
    setLoading(true);
    try {
      const res = await dongTienService.getTongQuan({
        kho_ma: filters.kho_ma || undefined,
        nam: filters.nam,
        thang: filters.thang || undefined,
      });
      setTongQuan(res.data);
    } catch (e) {
      showToast(
        e.response?.data?.message || "Lỗi tải tổng quan dòng tiền",
        "error",
      );
    } finally {
      setLoading(false);
    }
  }, [filters.kho_ma, filters.nam, filters.thang, showToast]);

  useEffect(() => {
    loadTongQuan();
  }, [loadTongQuan]);

  // ---- Giao dịch ----
  useEffect(() => {
    setTxFilter((p) => (p.page === 1 ? p : { ...p, page: 1 }));
  }, [filters.kho_ma, filters.nam, filters.thang]);

  useEffect(() => {
    if (tab !== "giao-dich") return;
    let alive = true;
    (async () => {
      setTxLoading(true);
      try {
        const res = await dongTienService.getGiaoDich({
          kho_ma: filters.kho_ma || undefined,
          nam: filters.nam,
          thang: filters.thang || undefined,
          trang_thai: txFilter.trang_thai || undefined,
          q: txFilter.q || undefined,
          page: txFilter.page,
          limit: txFilter.limit,
        });
        if (alive) setGiaoDich(res.data);
      } catch (e) {
        if (alive)
          showToast(
            e.response?.data?.message || "Lỗi tải danh sách giao dịch",
            "error",
          );
      } finally {
        if (alive) setTxLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [tab, filters.kho_ma, filters.nam, filters.thang, txFilter, showToast]);

  const openDetail = async (ptt_ma) => {
    setDetail({ open: true, loading: true, data: null });
    try {
      const res = await dongTienService.getPhieuChiTiet(ptt_ma);
      setDetail({ open: true, loading: false, data: res.data });
    } catch {
      setDetail({ open: true, loading: false, data: null });
      showToast("Không tải được chi tiết phiếu", "error");
    }
  };

  // ---- Dữ liệu dẫn xuất ----
  const kpi = tongQuan?.kpi || {};
  const theoKho = tongQuan?.theo_kho || [];
  const theoThang = tongQuan?.theo_thang || [];
  const theoNam = tongQuan?.theo_nam || [];

  const kpiCards = useMemo(() => {
    if (filters.che_do === "san") {
      return [
        {
          icon: "savings",
          label: "Doanh thu phí sàn",
          value: money(kpi.tra_san),
          tone: "emerald",
          hint: "Phí sàn thu được từ các kho",
        },
        {
          icon: "local_shipping",
          label: "Chi trả ĐVVC",
          value: money(kpi.chi_dvvc),
          tone: "red",
          hint: "Toàn hệ thống, không phân bổ theo kho",
        },
        {
          icon: "trending_up",
          label: "Lãi sau chi ĐVVC",
          value: money(kpi.lai_san),
          tone: "indigo",
          hint: "Doanh thu sàn − chi ĐVVC",
        },
        {
          icon: "inventory_2",
          label: "COD phát sinh",
          value: money(kpi.tien_vao),
          tone: "blue",
          hint: "Tiền shipper đã nộp kho (tham khảo)",
        },
        {
          icon: "receipt_long",
          label: "Số phiếu tất toán",
          value: String(kpi.so_phieu ?? 0),
          tone: "slate",
        },
        {
          icon: "shopping_bag",
          label: "Số đơn trong phiếu",
          value: String(kpi.so_don_tt ?? 0),
          tone: "slate",
        },
      ];
    }
    return [
      {
        icon: "account_balance_wallet",
        label: "Tiền vào kho (COD)",
        value: money(kpi.tien_vao),
        tone: "blue",
        hint: "Shipper đã nộp tiền",
      },
      {
        icon: "storefront",
        label: "Đã trả shop",
        value: money(kpi.tra_shop),
        tone: "indigo",
        hint: "Chỉ tính phiếu đã thu đủ",
      },
      {
        icon: "percent",
        label: "Đã trả phí sàn",
        value: money(kpi.tra_san),
        tone: "amber",
      },
      {
        icon: "savings",
        label: "Còn giữ tại kho",
        value: money(kpi.con_giu),
        tone: kpi.con_giu < 0 ? "red" : "emerald",
        hint: "Tiền vào − trả shop − phí sàn",
      },
      {
        icon: "receipt_long",
        label: "Số phiếu tất toán",
        value: String(kpi.so_phieu ?? 0),
        tone: "slate",
      },
      {
        icon: "shopping_bag",
        label: "Số đơn trong phiếu",
        value: String(kpi.so_don_tt ?? 0),
        tone: "slate",
      },
    ];
  }, [filters.che_do, kpi]);

  const chartThang = useMemo(
    () =>
      theoThang.map((r) =>
        filters.che_do === "san"
          ? {
              label: `T${r.thang}`,
              vao: r.tra_san,
              ra: r.chi_dvvc,
              net: r.tra_san - r.chi_dvvc,
            }
          : {
              label: `T${r.thang}`,
              vao: r.tien_vao,
              ra: r.tra_shop + r.tra_san,
              net: r.tien_vao - r.tra_shop - r.tra_san,
            },
      ),
    [theoThang, filters.che_do],
  );

  const chartNam = useMemo(
    () =>
      theoNam.map((r) =>
        filters.che_do === "san"
          ? { label: `T${r.nam}`, a: r.tra_san, b: r.chi_dvvc }
          : { label: `T${r.nam}`, a: r.tien_vao, b: r.tra_san },
      ),
    [theoNam, filters.che_do],
  );

  const donutItems = useMemo(
    () => [
      { label: "Trả shop", value: kpi.tra_shop || 0, color: CHART_COLORS.shop },
      {
        label: "Trả phí sàn",
        value: kpi.tra_san || 0,
        color: CHART_COLORS.san,
      },
      { label: "Chi ĐVVC", value: kpi.chi_dvvc || 0, color: CHART_COLORS.dvvc },
    ],
    [kpi],
  );

  const stackedRows = useMemo(
    () =>
      theoKho.slice(0, 8).map((k) => ({
        label: k.kho_ten,
        parts: [
          { label: "Trả shop", value: k.tra_shop, color: CHART_COLORS.shop },
          { label: "Trả sàn", value: k.tra_san, color: CHART_COLORS.san },
          {
            label: "Còn giữ",
            value: Math.max(k.con_giu, 0),
            color: CHART_COLORS.giu,
          },
        ],
      })),
    [theoKho],
  );

  const tongTraSan = useMemo(
    () => theoKho.reduce((s, k) => s + k.tra_san, 0),
    [theoKho],
  );

  // ---- Xuất CSV ----
  const exportCsv = () => {
    let headers, rows, name;
    if (tab === "theo-kho") {
      headers = [
        "Mã kho",
        "Tên kho",
        "Số phiếu",
        "Số đơn",
        "Tiền vào",
        "Trả shop",
        "Trả sàn",
        "Còn giữ",
      ];
      rows = theoKho.map((k) => [
        k.kho_ma,
        k.kho_ten,
        k.so_phieu,
        k.so_don,
        k.tien_vao,
        k.tra_shop,
        k.tra_san,
        k.con_giu,
      ]);
      name = "dong-tien-theo-kho";
    } else if (tab === "theo-thang") {
      headers = [
        "Tháng",
        "Tiền vào",
        "Trả shop",
        "Trả sàn",
        "Chi ĐVVC",
        "Chênh lệch",
      ];
      rows = theoThang.map((t) => [
        t.thang,
        t.tien_vao,
        t.tra_shop,
        t.tra_san,
        t.chi_dvvc,
        t.tien_vao - t.tra_shop - t.tra_san,
      ]);
      name = `dong-tien-thang-${filters.nam}`;
    } else if (tab === "theo-nam") {
      headers = [
        "Năm",
        "Tiền vào",
        "Trả shop",
        "Trả sàn",
        "Chi ĐVVC",
        "Chênh lệch",
      ];
      rows = theoNam.map((t) => [
        t.nam,
        t.tien_vao,
        t.tra_shop,
        t.tra_san,
        t.chi_dvvc,
        t.tien_vao - t.tra_shop - t.tra_san,
      ]);
      name = "dong-tien-theo-nam";
    } else if (tab === "giao-dich") {
      headers = [
        "Mã phiếu",
        "Kho",
        "Ngày tạo",
        "Ngày hoàn tất",
        "Số đơn",
        "Phí sàn",
        "Tiền shop",
        "Trạng thái",
      ];
      rows = giaoDich.rows.map((r) => [
        r.ptt_ma,
        r.kho_ten,
        fmtDate(r.ptt_ngay_tat_toan),
        fmtDate(r.ptt_thoi_diem_hoan_tat),
        r.so_don,
        r.ptt_tong_tien_san,
        r.ptt_tong_tien_shop,
        r.ptt_trang_thai_thanh_toan,
      ]);
      name = "giao-dich-tat-toan";
    } else {
      return showToast("Chọn tab có bảng dữ liệu để xuất CSV", "error");
    }
    const csv = [headers, ...rows]
      .map((r) =>
        r.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(","),
      )
      .join("\n");
    const url = URL.createObjectURL(
      new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `${name}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast("Đã xuất file CSV");
  };

  const chartLabels =
    filters.che_do === "san"
      ? { vao: "Doanh thu phí sàn", ra: "Chi ĐVVC", net: "Lãi" }
      : { vao: "Tiền vào kho", ra: "Tiền ra", net: "Còn giữ" };

  return (
    <div className="min-h-screen space-y-5 bg-[#F8FAFC] p-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0F172A]">Quản lý dòng tiền</h1>
        <p className="mt-1 text-sm text-[#64748B]">
          Theo dõi tiền vào – tiền ra theo kho, tháng, năm. Số liệu chỉ tính
          phiếu đã thu đủ và các đơn shipper đã nộp tiền.
        </p>
      </div>

      <FilterBar
        danhMuc={danhMuc}
        filters={filters}
        onChange={setFilters}
        onReload={loadTongQuan}
        loading={loading}
        onExport={exportCsv}
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {kpiCards.map((c) => (
          <KpiCard key={c.label} {...c} />
        ))}
      </div>

      <TabBar tabs={TABS} active={tab} onChange={setTab} />

      {tab === "tong-quan" && (
        <div className="space-y-4">
          <SectionCard
            title="Thu – chi theo tháng"
            subtitle={`Năm ${filters.nam}${filters.thang ? ` · đang lọc tháng ${filters.thang}` : ""}`}
          >
            {chartThang.length ? (
              <BarLineChart data={chartThang} labels={chartLabels} />
            ) : (
              <EmptyState />
            )}
          </SectionCard>

          <div className="grid gap-4 xl:grid-cols-3">
            <SectionCard
              className="xl:col-span-2"
              title="Cơ cấu theo kho"
              subtitle="Top 8 kho theo tổng phát sinh"
            >
              {stackedRows.length ? (
                <StackedBarChart rows={stackedRows} />
              ) : (
                <EmptyState />
              )}
            </SectionCard>
            <SectionCard
              title="Cơ cấu chi ra"
              subtitle="Shop · Sàn · ĐVVC"
              className="self-start"
            >
              <DonutChart items={donutItems} />
            </SectionCard>
          </div>

          <SectionCard
            title="Xu hướng theo năm"
            subtitle="So sánh các năm có phát sinh"
          >
            {chartNam.length ? (
              <YearLineChart
                data={chartNam}
                labels={
                  filters.che_do === "san"
                    ? { a: "Doanh thu sàn", b: "Chi ĐVVC" }
                    : { a: "Tiền vào", b: "Phí sàn" }
                }
              />
            ) : (
              <EmptyState />
            )}
          </SectionCard>

          <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[11px] leading-relaxed text-amber-800">
            Lưu ý: phiếu chờ thu bị hệ thống tự dọn sau 2 phút nên không dùng
            làm số liệu lịch sử. Báo cáo chỉ tính phiếu
            <strong> Đã thu đủ</strong>; nếu một phiếu mới thu một phần QR rồi
            bị dọn, phần đó sẽ không xuất hiện.
          </p>
        </div>
      )}

      {tab === "theo-kho" && (
        <SectionCard
          title="Dòng tiền theo kho"
          subtitle="Tính theo khoảng thời gian đang lọc"
        >
          {theoKho.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] border-collapse">
                <thead className="border-b border-slate-200 bg-slate-50">
                  <tr>
                    <th className={TH}>Kho</th>
                    <th className={`${TH} text-right`}>Số phiếu</th>
                    <th className={`${TH} text-right`}>Số đơn</th>
                    <th className={`${TH} text-right`}>Tiền vào</th>
                    <th className={`${TH} text-right`}>Trả shop</th>
                    <th className={`${TH} text-right`}>Trả sàn</th>
                    <th className={`${TH} text-right`}>Còn giữ</th>
                    <th className={`${TH} text-right`}>% phí sàn</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {theoKho.map((k) => (
                    <tr key={k.kho_ma} className="hover:bg-slate-50/70">
                      <td className={`${TD} font-medium`}>{k.kho_ten}</td>
                      <td className={`${TD} text-right`}>{k.so_phieu}</td>
                      <td className={`${TD} text-right`}>{k.so_don}</td>
                      <td className={`${TD} text-right text-sky-700`}>
                        {money(k.tien_vao)}
                      </td>
                      <td className={`${TD} text-right text-indigo-700`}>
                        {money(k.tra_shop)}
                      </td>
                      <td className={`${TD} text-right text-amber-700`}>
                        {money(k.tra_san)}
                      </td>
                      <td
                        className={`${TD} text-right font-semibold ${k.con_giu < 0 ? "text-rose-600" : "text-emerald-700"}`}
                      >
                        {money(k.con_giu)}
                      </td>
                      <td className={`${TD} text-right text-slate-500`}>
                        {tongTraSan
                          ? ((k.tra_san / tongTraSan) * 100).toFixed(1)
                          : "0.0"}
                        %
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>
      )}

      {tab === "theo-thang" && (
        <SectionCard
          title={`Dòng tiền 12 tháng năm ${filters.nam}`}
          subtitle="Chi ĐVVC là số toàn hệ thống, không phân bổ theo kho"
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className={TH}>Tháng</th>
                  <th className={`${TH} text-right`}>Tiền vào</th>
                  <th className={`${TH} text-right`}>Trả shop</th>
                  <th className={`${TH} text-right`}>Trả sàn</th>
                  <th className={`${TH} text-right`}>Chi ĐVVC</th>
                  <th className={`${TH} text-right`}>Chênh lệch</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {theoThang.map((t) => {
                  const net = t.tien_vao - t.tra_shop - t.tra_san;
                  return (
                    <tr key={t.thang} className="hover:bg-slate-50/70">
                      <td className={`${TD} font-medium`}>Tháng {t.thang}</td>
                      <td className={`${TD} text-right text-sky-700`}>
                        {money(t.tien_vao)}
                      </td>
                      <td className={`${TD} text-right text-indigo-700`}>
                        {money(t.tra_shop)}
                      </td>
                      <td className={`${TD} text-right text-amber-700`}>
                        {money(t.tra_san)}
                      </td>
                      <td className={`${TD} text-right text-rose-600`}>
                        {money(t.chi_dvvc)}
                      </td>
                      <td
                        className={`${TD} text-right font-semibold ${net < 0 ? "text-rose-600" : "text-emerald-700"}`}
                      >
                        {money(net)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="border-t-2 border-slate-200 bg-slate-50 font-semibold">
                <tr>
                  <td className={TD}>Tổng</td>
                  <td className={`${TD} text-right text-sky-700`}>
                    {money(theoThang.reduce((s, t) => s + t.tien_vao, 0))}
                  </td>
                  <td className={`${TD} text-right text-indigo-700`}>
                    {money(theoThang.reduce((s, t) => s + t.tra_shop, 0))}
                  </td>
                  <td className={`${TD} text-right text-amber-700`}>
                    {money(theoThang.reduce((s, t) => s + t.tra_san, 0))}
                  </td>
                  <td className={`${TD} text-right text-rose-600`}>
                    {money(theoThang.reduce((s, t) => s + t.chi_dvvc, 0))}
                  </td>
                  <td className={`${TD} text-right text-emerald-700`}>
                    {money(
                      theoThang.reduce(
                        (s, t) => s + t.tien_vao - t.tra_shop - t.tra_san,
                        0,
                      ),
                    )}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </SectionCard>
      )}

      {tab === "theo-nam" && (
        <SectionCard
          title="Dòng tiền theo năm"
          subtitle="Toàn bộ các năm có phát sinh"
        >
          {theoNam.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] border-collapse">
                <thead className="border-b border-slate-200 bg-slate-50">
                  <tr>
                    <th className={TH}>Năm</th>
                    <th className={`${TH} text-right`}>Tiền vào</th>
                    <th className={`${TH} text-right`}>Trả shop</th>
                    <th className={`${TH} text-right`}>Trả sàn</th>
                    <th className={`${TH} text-right`}>Chi ĐVVC</th>
                    <th className={`${TH} text-right`}>Chênh lệch</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {theoNam.map((t) => {
                    const net = t.tien_vao - t.tra_shop - t.tra_san;
                    return (
                      <tr key={t.nam} className="hover:bg-slate-50/70">
                        <td className={`${TD} font-medium`}>Năm {t.nam}</td>
                        <td className={`${TD} text-right text-sky-700`}>
                          {money(t.tien_vao)}
                        </td>
                        <td className={`${TD} text-right text-indigo-700`}>
                          {money(t.tra_shop)}
                        </td>
                        <td className={`${TD} text-right text-amber-700`}>
                          {money(t.tra_san)}
                        </td>
                        <td className={`${TD} text-right text-rose-600`}>
                          {money(t.chi_dvvc)}
                        </td>
                        <td
                          className={`${TD} text-right font-semibold ${net < 0 ? "text-rose-600" : "text-emerald-700"}`}
                        >
                          {money(net)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>
      )}

      {tab === "giao-dich" && (
        <SectionCard
          title="Danh sách phiếu tất toán"
          subtitle="Bấm vào dòng để xem chi tiết đơn hàng và mã QR"
        >
          <div className="mb-4 flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-slate-500">
                Trạng thái
              </span>
              <select
                className={INPUT}
                value={txFilter.trang_thai}
                onChange={(e) =>
                  setTxFilter((p) => ({
                    ...p,
                    trang_thai: e.target.value,
                    page: 1,
                  }))
                }
              >
                <option value="">Tất cả</option>
                <option value="DA_THANH_TOAN">Đã thu đủ</option>
                <option value="CHO_THANH_TOAN">Chờ thu</option>
              </select>
            </label>
            <label className="flex min-w-[240px] flex-col gap-1">
              <span className="text-xs font-medium text-slate-500">
                Tìm mã phiếu / tên kho
              </span>
              <input
                className={INPUT}
                value={qInput}
                placeholder="VD: PTT0000001"
                onChange={(e) => setQInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter")
                    setTxFilter((p) => ({ ...p, q: qInput.trim(), page: 1 }));
                }}
              />
            </label>
            <button
              type="button"
              onClick={() =>
                setTxFilter((p) => ({ ...p, q: qInput.trim(), page: 1 }))
              }
              className="flex h-10 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              <span className="material-symbols-outlined text-[18px]">
                search
              </span>{" "}
              Tìm
            </button>
          </div>

          {txLoading ? (
            <p className="py-10 text-center text-sm text-slate-500">
              Đang tải giao dịch...
            </p>
          ) : giaoDich.rows.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] border-collapse">
                <thead className="border-b border-slate-200 bg-slate-50">
                  <tr>
                    <th className={TH}>Mã phiếu</th>
                    <th className={TH}>Kho</th>
                    <th className={TH}>Ngày tạo</th>
                    <th className={TH}>Hoàn tất</th>
                    <th className={`${TH} text-right`}>Số đơn</th>
                    <th className={`${TH} text-right`}>Phí sàn</th>
                    <th className={`${TH} text-right`}>Tiền shop</th>
                    <th className={TH}>Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {giaoDich.rows.map((r) => (
                    <tr
                      key={r.ptt_ma}
                      onClick={() => openDetail(r.ptt_ma)}
                      className="cursor-pointer hover:bg-sky-50/60"
                    >
                      <td
                        className={`${TD} font-mono font-semibold text-indigo-600`}
                      >
                        {r.ptt_ma}
                      </td>
                      <td className={TD}>{r.kho_ten}</td>
                      <td className={`${TD} text-slate-500`}>
                        {fmtDate(r.ptt_ngay_tat_toan)}
                      </td>
                      <td className={`${TD} text-slate-500`}>
                        {fmtDate(r.ptt_thoi_diem_hoan_tat)}
                      </td>
                      <td className={`${TD} text-right`}>{r.so_don}</td>
                      <td className={`${TD} text-right text-amber-700`}>
                        {money(r.ptt_tong_tien_san)}
                      </td>
                      <td className={`${TD} text-right text-indigo-700`}>
                        {money(r.ptt_tong_tien_shop)}
                      </td>
                      <td className={TD}>
                        <StatusBadge status={r.ptt_trang_thai_thanh_toan} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <Pager
            page={giaoDich.page}
            totalPages={giaoDich.total_pages}
            total={giaoDich.total}
            onChange={(p) => setTxFilter((prev) => ({ ...prev, page: p }))}
          />
        </SectionCard>
      )}

      <PhieuChiTietDrawer
        open={detail.open}
        loading={detail.loading}
        data={detail.data}
        onClose={() => setDetail({ open: false, loading: false, data: null })}
      />
      <ToastNotification toast={toast} />
    </div>
  );
};

export default QuanLyDongTien;
