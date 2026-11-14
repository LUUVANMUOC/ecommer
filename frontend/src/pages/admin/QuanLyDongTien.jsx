// frontend/src/pages/admin/QuanLyDongTien.jsx
// Trang DOANH THU SÀN: chỉ thống kê phí sàn thu được + tiền đã chi cho ĐVVC.
// (Dòng tiền kho đã chuyển sang trang Vận chuyển & dòng tiền kho.)
import { useState, useEffect, useCallback, useMemo } from "react";
import dongTienService from "../../services/san/dongTienService";
import ToastNotification from "../../components/common/Crud/ToastNotification";
import {
  INPUT,
  money,
  fmtDate,
  KpiCard,
  FilterBar,
  SectionCard,
  EmptyState,
  StatusBadge,
  ViewToggle,
  NoteBox,
  Pager,
} from "../../components/admin/dongtien/DongTienUI";
import PhieuChiTietDrawer from "../../components/admin/dongtien/PhieuChiTietDrawer";

const NAM_HIEN_TAI = new Date().getFullYear();

const VIEWS = [
  { id: "theo-kho", label: "Theo kho", icon: "warehouse" },
  { id: "theo-thang", label: "Theo tháng", icon: "calendar_month" },
  { id: "theo-nam", label: "Theo năm", icon: "event_note" },
  { id: "giao-dich", label: "Giao dịch", icon: "receipt_long" },
];

const KHO_PAGE_SIZES = [10, 20, 50];

const TH =
  "whitespace-nowrap px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500";
const TD = "px-3 py-2.5 text-sm text-slate-700";

const ZERO_KHO = { so_phieu: 0, so_don: 0, doanh_thu_san: 0, tra_shop: 0 };

const congKho = (rows) =>
  rows.reduce(
    (a, k) => ({
      so_phieu: a.so_phieu + (Number(k.so_phieu) || 0),
      so_don: a.so_don + (Number(k.so_don) || 0),
      doanh_thu_san: a.doanh_thu_san + (Number(k.doanh_thu_san) || 0),
      tra_shop: a.tra_shop + (Number(k.tra_shop) || 0),
    }),
    { ...ZERO_KHO },
  );

const ZERO_KY = {
  so_phieu: 0,
  so_don: 0,
  doanh_thu_san: 0,
  tra_shop: 0,
  chi_dvvc: 0,
  lai_san: 0,
};

const congKy = (rows) =>
  rows.reduce(
    (a, t) => ({
      so_phieu: a.so_phieu + (Number(t.so_phieu) || 0),
      so_don: a.so_don + (Number(t.so_don) || 0),
      doanh_thu_san: a.doanh_thu_san + (Number(t.doanh_thu_san) || 0),
      tra_shop: a.tra_shop + (Number(t.tra_shop) || 0),
      chi_dvvc: a.chi_dvvc + (Number(t.chi_dvvc) || 0),
      lai_san: a.lai_san + (Number(t.lai_san) || 0),
    }),
    { ...ZERO_KY },
  );

const pct = (v, total) => {
  const t = Number(total) || 0;
  if (!t) return "0.0";
  return (((Number(v) || 0) / t) * 100).toFixed(1);
};

const downloadCsv = (name, headers, rows) => {
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
};

const QuanLyDongTien = () => {
  const [danhMuc, setDanhMuc] = useState({
    kho: [],
    nam: [NAM_HIEN_TAI],
    nam_hien_tai: NAM_HIEN_TAI,
  });
  const [filters, setFilters] = useState({
    kho_ma: "",
    nam: String(NAM_HIEN_TAI),
    thang: "",
  });

  const [viewMode, setViewMode] = useState("theo-kho");

  // Phân trang bảng "Theo kho"
  const [khoPage, setKhoPage] = useState(1);
  const [khoPageSize, setKhoPageSize] = useState(10);

  const [tongQuan, setTongQuan] = useState(null);
  const [loading, setLoading] = useState(true);

  // Giao dịch
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

  // Drawer chi tiết phiếu
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
      .getDanhMucDoanhThuSan()
      .then((r) => setDanhMuc(r.data))
      .catch(() => showToast("Không tải được danh mục kho/năm", "error"));
  }, [showToast]);

  // ---- Tổng quan: KPI + bảng theo kho/tháng/năm ----
  const loadTongQuan = useCallback(async () => {
    setLoading(true);
    try {
      const res = await dongTienService.getTongQuanDoanhThuSan({
        kho_ma: filters.kho_ma || undefined,
        nam: filters.nam,
        thang: filters.thang || undefined,
      });
      setTongQuan(res.data);
    } catch (e) {
      showToast(
        e.response?.data?.message || "Lỗi tải tổng quan doanh thu sàn",
        "error",
      );
    } finally {
      setLoading(false);
    }
  }, [filters.kho_ma, filters.nam, filters.thang, showToast]);

  useEffect(() => {
    loadTongQuan();
  }, [loadTongQuan]);

  // Đổi bộ lọc chung → về trang 1 của bảng giao dịch và bảng kho
  useEffect(() => {
    setTxFilter((p) => (p.page === 1 ? p : { ...p, page: 1 }));
    setKhoPage(1);
  }, [filters.kho_ma, filters.nam, filters.thang]);

  // ---- Danh sách phiếu tất toán (chỉ tải khi mở chế độ Giao dịch) ----
  const loadGiaoDich = useCallback(async () => {
    if (viewMode !== "giao-dich") return;
    setTxLoading(true);
    try {
      const res = await dongTienService.getGiaoDichDoanhThuSan({
        kho_ma: filters.kho_ma || undefined,
        nam: filters.nam,
        thang: filters.thang || undefined,
        trang_thai: txFilter.trang_thai || undefined,
        q: txFilter.q || undefined,
        page: txFilter.page,
        limit: txFilter.limit,
      });
      setGiaoDich(res.data);
    } catch (e) {
      showToast(
        e.response?.data?.message || "Lỗi tải danh sách giao dịch",
        "error",
      );
    } finally {
      setTxLoading(false);
    }
  }, [
    viewMode,
    filters.kho_ma,
    filters.nam,
    filters.thang,
    txFilter,
    showToast,
  ]);

  useEffect(() => {
    if (viewMode !== "giao-dich") return;
    loadGiaoDich();
  }, [viewMode, loadGiaoDich]);

  const openDetail = async (ptt_ma) => {
    setDetail({ open: true, loading: true, data: null });
    try {
      const res = await dongTienService.getPhieuChiTietDoanhThuSan(ptt_ma);
      setDetail({ open: true, loading: false, data: res.data });
    } catch {
      setDetail({ open: true, loading: false, data: null });
      showToast("Không tải được chi tiết phiếu", "error");
    }
  };

  const reloadAll = () => {
    loadTongQuan();
    if (viewMode === "giao-dich") loadGiaoDich();
  };

  // ---- Dữ liệu dẫn xuất ----
  const kpi = tongQuan?.kpi || {};
  const theoKho = tongQuan?.theo_kho || [];
  const theoThang = tongQuan?.theo_thang || [];
  const theoNam = tongQuan?.theo_nam || [];

  // Lãi chỉ đúng khi không lọc 1 kho (chi ĐVVC không gắn kho)
  const hienLai = !filters.kho_ma;

  // Tổng toàn bộ kho (dùng cho % và footer)
  const tongKhoAll = useMemo(() => congKho(theoKho), [theoKho]);

  // Phân trang kho
  const totalKhoPages = Math.max(1, Math.ceil(theoKho.length / khoPageSize));
  const khoPageSafe = Math.min(khoPage, totalKhoPages);
  const theoKhoTrang = useMemo(() => {
    const start = (khoPageSafe - 1) * khoPageSize;
    return theoKho.slice(start, start + khoPageSize);
  }, [theoKho, khoPageSafe, khoPageSize]);
  const tongKhoTrang = useMemo(() => congKho(theoKhoTrang), [theoKhoTrang]);

  const startIdx =
    theoKho.length === 0 ? 0 : (khoPageSafe - 1) * khoPageSize + 1;
  const endIdx = Math.min(khoPageSafe * khoPageSize, theoKho.length);

  const tongThang = useMemo(() => congKy(theoThang), [theoThang]);
  const tongNam = useMemo(() => congKy(theoNam), [theoNam]);

  const kpiCards = useMemo(() => {
    const cards = [
      {
        icon: "percent",
        label: "Doanh thu phí sàn",
        value: money(kpi.doanh_thu_san),
        tone: "emerald",
        hint: filters.kho_ma
          ? "Phí sàn của kho đang chọn · chỉ tính phiếu đã thu đủ"
          : "Tổng phí sàn thu từ các phiếu tất toán đã thu đủ",
      },
      {
        icon: "local_shipping",
        label: "Đã chi cho ĐVVC",
        value: money(kpi.chi_dvvc),
        tone: "red",
        hint: "Sàn bù voucher ship đã thanh toán · toàn hệ thống",
      },
    ];
    // Chi ĐVVC không gắn kho_ma nên không tính Lãi khi đang lọc 1 kho
    if (hienLai) {
      cards.push({
        icon: "trending_up",
        label: "Lãi",
        value: money(kpi.lai_san),
        tone: "indigo",
        hint: "Doanh thu phí sàn − tổng tiền đã chi cho ĐVVC",
      });
    }
    return cards;
  }, [hienLai, filters.kho_ma, kpi]);

  // ---- Xuất CSV theo đúng bảng đang xem ----
  const exportCsv = () => {
    const suffix = `${filters.nam}${filters.thang ? `-T${filters.thang}` : ""}`;

    if (viewMode === "theo-kho") {
      if (theoKho.length === 0)
        return showToast("Không có dữ liệu để xuất", "error");
      downloadCsv(
        `doanh-thu-san-theo-kho-${suffix}`,
        [
          "Mã kho",
          "Tên kho",
          "Số phiếu",
          "Số đơn",
          "Doanh thu phí sàn",
          "Tiền trả shop",
          "% doanh thu",
        ],
        theoKho.map((k) => [
          k.kho_ma,
          k.kho_ten,
          k.so_phieu,
          k.so_don,
          k.doanh_thu_san,
          k.tra_shop,
          pct(k.doanh_thu_san, tongKhoAll.doanh_thu_san),
        ]),
      );
    } else if (viewMode === "theo-thang" || viewMode === "theo-nam") {
      const laThang = viewMode === "theo-thang";
      const rowsData = laThang ? theoThang : theoNam;
      if (rowsData.length === 0)
        return showToast("Không có dữ liệu để xuất", "error");

      const headers = [
        laThang ? "Tháng" : "Năm",
        "Số phiếu",
        "Số đơn",
        "Doanh thu phí sàn",
        "Tiền trả shop",
        "Chi ĐVVC",
      ];
      if (hienLai) headers.push("Lãi");

      downloadCsv(
        laThang
          ? `doanh-thu-san-theo-thang-${filters.nam}`
          : "doanh-thu-san-theo-nam",
        headers,
        rowsData.map((t) => {
          const r = [
            laThang ? t.thang : t.nam,
            t.so_phieu,
            t.so_don,
            t.doanh_thu_san,
            t.tra_shop,
            t.chi_dvvc,
          ];
          if (hienLai) r.push(t.lai_san);
          return r;
        }),
      );
    } else {
      if (giaoDich.rows.length === 0)
        return showToast("Không có giao dịch để xuất", "error");
      downloadCsv(
        `doanh-thu-san-giao-dich-${suffix}`,
        [
          "Mã phiếu",
          "Kho",
          "Ngày tạo",
          "Hoàn tất",
          "Số đơn",
          "Phí sàn",
          "Tiền shop",
          "QR đã TT",
          "Tổng QR",
          "Trạng thái",
        ],
        giaoDich.rows.map((r) => [
          r.ptt_ma,
          r.kho_ten,
          fmtDate(r.ptt_ngay_tat_toan),
          fmtDate(r.ptt_thoi_diem_hoan_tat),
          r.so_don,
          r.ptt_tong_tien_san,
          r.ptt_tong_tien_shop,
          r.so_qr_da_tt,
          r.so_qr,
          r.ptt_trang_thai_thanh_toan,
        ]),
      );
    }

    showToast("Đã xuất file CSV");
  };

  const sectionTitle =
    viewMode === "theo-kho"
      ? "Doanh thu phí sàn theo kho"
      : viewMode === "theo-thang"
        ? `Doanh thu phí sàn 12 tháng năm ${filters.nam}`
        : viewMode === "theo-nam"
          ? "Doanh thu phí sàn theo năm"
          : "Danh sách phiếu tất toán";

  const sectionSubtitle =
    viewMode === "theo-kho"
      ? "Chỉ tính phiếu tất toán Đã thu đủ · mốc thời gian = ngày hoàn tất phiếu"
      : viewMode === "theo-thang"
        ? "Mốc thời gian = ngày hoàn tất phiếu · Chi ĐVVC là số toàn hệ thống"
        : viewMode === "theo-nam"
          ? "Toàn bộ các năm có phát sinh · Chi ĐVVC là số toàn hệ thống"
          : "Bấm vào dòng để xem chi tiết đơn hàng và mã QR";

  const busy = loading || (viewMode === "giao-dich" && txLoading);

  return (
    <div className="min-h-screen space-y-5 bg-[#F8FAFC] p-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0F172A]">Doanh thu sàn</h1>
      </div>

      <FilterBar
        danhMuc={danhMuc}
        filters={filters}
        onChange={setFilters}
        onReload={reloadAll}
        loading={busy}
        onExport={exportCsv}
      />

      <div
        className={`grid gap-3 sm:grid-cols-2 ${
          kpiCards.length >= 3 ? "xl:grid-cols-3" : ""
        }`}
      >
        {kpiCards.map((c) => (
          <KpiCard key={c.label} {...c} />
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs text-slate-500">
        <span>
          <strong className="text-slate-700">{kpi.so_phieu ?? 0}</strong> phiếu
          tất toán
        </span>
        <span>
          <strong className="text-slate-700">{kpi.so_don ?? 0}</strong> đơn
          trong phiếu
        </span>
        <span>
          Tiền trả shop:{" "}
          <strong className="text-slate-700">{money(kpi.tra_shop)}</strong>
        </span>
        {filters.kho_ma && (
          <span className="font-medium text-amber-600">
            Đang lọc 1 kho: "Đã chi cho ĐVVC" là số toàn hệ thống nên không tính
            Lãi.
          </span>
        )}
      </div>

      <SectionCard
        title={sectionTitle}
        subtitle={sectionSubtitle}
        action={
          <ViewToggle views={VIEWS} active={viewMode} onChange={setViewMode} />
        }
      >
        {viewMode === "theo-kho" && (
          <>
            {loading ? (
              <p className="py-10 text-center text-sm text-slate-500">
                Đang tải doanh thu theo kho...
              </p>
            ) : theoKho.length === 0 ? (
              <EmptyState />
            ) : (
              <>
                {/* Thanh chọn trang + số kho mỗi trang */}
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs text-slate-500">
                    Đang xem{" "}
                    <strong className="text-slate-700">
                      {startIdx}–{endIdx}
                    </strong>{" "}
                    /{" "}
                    <strong className="text-slate-700">{theoKho.length}</strong>{" "}
                    kho có phát sinh · sắp xếp theo doanh thu phí sàn giảm dần
                  </p>

                  <div className="flex flex-wrap items-center gap-3">
                    <label className="flex items-center gap-2">
                      <span className="text-xs font-medium text-slate-500">
                        Trang
                      </span>
                      <select
                        className={`${INPUT} w-[90px]`}
                        value={khoPageSafe}
                        onChange={(e) => setKhoPage(Number(e.target.value))}
                      >
                        {Array.from(
                          { length: totalKhoPages },
                          (_, i) => i + 1,
                        ).map((p) => (
                          <option key={p} value={p}>
                            {p}
                          </option>
                        ))}
                      </select>
                      <span className="text-xs text-slate-500">
                        / {totalKhoPages}
                      </span>
                    </label>

                    <label className="flex items-center gap-2">
                      <span className="text-xs font-medium text-slate-500">
                        Số kho/trang
                      </span>
                      <select
                        className={`${INPUT} w-[90px]`}
                        value={khoPageSize}
                        onChange={(e) => {
                          setKhoPageSize(Number(e.target.value));
                          setKhoPage(1);
                        }}
                      >
                        {KHO_PAGE_SIZES.map((n) => (
                          <option key={n} value={n}>
                            {n}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[860px] border-collapse">
                    <thead className="border-b border-slate-200 bg-slate-50">
                      <tr>
                        <th className={TH}>Kho</th>
                        <th className={`${TH} text-right`}>Số phiếu</th>
                        <th className={`${TH} text-right`}>Số đơn</th>
                        <th className={`${TH} text-right`}>
                          Doanh thu phí sàn
                        </th>
                        <th className={`${TH} text-right`}>Tiền trả shop</th>
                        <th className={`${TH} text-right`}>% doanh thu</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {theoKhoTrang.map((k) => (
                        <tr key={k.kho_ma} className="hover:bg-slate-50/70">
                          <td className={`${TD} font-medium`}>{k.kho_ten}</td>
                          <td className={`${TD} text-right`}>{k.so_phieu}</td>
                          <td className={`${TD} text-right`}>{k.so_don}</td>
                          <td
                            className={`${TD} text-right font-semibold ${
                              k.doanh_thu_san < 0
                                ? "text-rose-600"
                                : "text-emerald-700"
                            }`}
                          >
                            {money(k.doanh_thu_san)}
                          </td>
                          <td className={`${TD} text-right text-indigo-700`}>
                            {money(k.tra_shop)}
                          </td>
                          <td className={`${TD} text-right text-slate-500`}>
                            {pct(k.doanh_thu_san, tongKhoAll.doanh_thu_san)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="border-t-2 border-slate-200 bg-slate-50 font-semibold">
                      <tr className="border-b border-slate-200">
                        <td className={TD}>
                          Trang này ({theoKhoTrang.length} kho)
                        </td>
                        <td className={`${TD} text-right`}>
                          {tongKhoTrang.so_phieu}
                        </td>
                        <td className={`${TD} text-right`}>
                          {tongKhoTrang.so_don}
                        </td>
                        <td
                          className={`${TD} text-right ${
                            tongKhoTrang.doanh_thu_san < 0
                              ? "text-rose-600"
                              : "text-emerald-700"
                          }`}
                        >
                          {money(tongKhoTrang.doanh_thu_san)}
                        </td>
                        <td className={`${TD} text-right text-indigo-700`}>
                          {money(tongKhoTrang.tra_shop)}
                        </td>
                        <td className={`${TD} text-right text-slate-500`}>
                          {pct(
                            tongKhoTrang.doanh_thu_san,
                            tongKhoAll.doanh_thu_san,
                          )}
                          %
                        </td>
                      </tr>
                      <tr>
                        <td className={TD}>Tất cả ({theoKho.length} kho)</td>
                        <td className={`${TD} text-right`}>
                          {tongKhoAll.so_phieu}
                        </td>
                        <td className={`${TD} text-right`}>
                          {tongKhoAll.so_don}
                        </td>
                        <td
                          className={`${TD} text-right ${
                            tongKhoAll.doanh_thu_san < 0
                              ? "text-rose-600"
                              : "text-emerald-700"
                          }`}
                        >
                          {money(tongKhoAll.doanh_thu_san)}
                        </td>
                        <td className={`${TD} text-right text-indigo-700`}>
                          {money(tongKhoAll.tra_shop)}
                        </td>
                        <td className={`${TD} text-right text-slate-500`}>
                          100.0%
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                <Pager
                  page={khoPageSafe}
                  totalPages={totalKhoPages}
                  total={theoKho.length}
                  unit="kho"
                  onChange={setKhoPage}
                />
              </>
            )}
          </>
        )}

        {viewMode === "theo-thang" && (
          <>
            {loading ? (
              <p className="py-10 text-center text-sm text-slate-500">
                Đang tải doanh thu theo tháng...
              </p>
            ) : theoThang.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[920px] border-collapse">
                  <thead className="border-b border-slate-200 bg-slate-50">
                    <tr>
                      <th className={TH}>Tháng</th>
                      <th className={`${TH} text-right`}>Số phiếu</th>
                      <th className={`${TH} text-right`}>Số đơn</th>
                      <th className={`${TH} text-right`}>Doanh thu phí sàn</th>
                      <th className={`${TH} text-right`}>Tiền trả shop</th>
                      <th className={`${TH} text-right`}>Chi ĐVVC</th>
                      {hienLai && <th className={`${TH} text-right`}>Lãi</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {theoThang.map((t) => (
                      <tr key={t.thang} className="hover:bg-slate-50/70">
                        <td className={`${TD} font-medium`}>Tháng {t.thang}</td>
                        <td className={`${TD} text-right`}>{t.so_phieu}</td>
                        <td className={`${TD} text-right`}>{t.so_don}</td>
                        <td className={`${TD} text-right text-emerald-700`}>
                          {money(t.doanh_thu_san)}
                        </td>
                        <td className={`${TD} text-right text-indigo-700`}>
                          {money(t.tra_shop)}
                        </td>
                        <td className={`${TD} text-right text-rose-600`}>
                          {money(t.chi_dvvc)}
                        </td>
                        {hienLai && (
                          <td
                            className={`${TD} text-right font-semibold ${
                              t.lai_san < 0
                                ? "text-rose-600"
                                : "text-indigo-700"
                            }`}
                          >
                            {money(t.lai_san)}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="border-t-2 border-slate-200 bg-slate-50 font-semibold">
                    <tr>
                      <td className={TD}>Tổng</td>
                      <td className={`${TD} text-right`}>
                        {tongThang.so_phieu}
                      </td>
                      <td className={`${TD} text-right`}>{tongThang.so_don}</td>
                      <td className={`${TD} text-right text-emerald-700`}>
                        {money(tongThang.doanh_thu_san)}
                      </td>
                      <td className={`${TD} text-right text-indigo-700`}>
                        {money(tongThang.tra_shop)}
                      </td>
                      <td className={`${TD} text-right text-rose-600`}>
                        {money(tongThang.chi_dvvc)}
                      </td>
                      {hienLai && (
                        <td className={`${TD} text-right text-indigo-700`}>
                          {money(tongThang.lai_san)}
                        </td>
                      )}
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </>
        )}

        {viewMode === "theo-nam" && (
          <>
            {loading ? (
              <p className="py-10 text-center text-sm text-slate-500">
                Đang tải doanh thu theo năm...
              </p>
            ) : theoNam.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[920px] border-collapse">
                  <thead className="border-b border-slate-200 bg-slate-50">
                    <tr>
                      <th className={TH}>Năm</th>
                      <th className={`${TH} text-right`}>Số phiếu</th>
                      <th className={`${TH} text-right`}>Số đơn</th>
                      <th className={`${TH} text-right`}>Doanh thu phí sàn</th>
                      <th className={`${TH} text-right`}>Tiền trả shop</th>
                      <th className={`${TH} text-right`}>Chi ĐVVC</th>
                      {hienLai && <th className={`${TH} text-right`}>Lãi</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {theoNam.map((t) => (
                      <tr key={t.nam} className="hover:bg-slate-50/70">
                        <td className={`${TD} font-medium`}>Năm {t.nam}</td>
                        <td className={`${TD} text-right`}>{t.so_phieu}</td>
                        <td className={`${TD} text-right`}>{t.so_don}</td>
                        <td className={`${TD} text-right text-emerald-700`}>
                          {money(t.doanh_thu_san)}
                        </td>
                        <td className={`${TD} text-right text-indigo-700`}>
                          {money(t.tra_shop)}
                        </td>
                        <td className={`${TD} text-right text-rose-600`}>
                          {money(t.chi_dvvc)}
                        </td>
                        {hienLai && (
                          <td
                            className={`${TD} text-right font-semibold ${
                              t.lai_san < 0
                                ? "text-rose-600"
                                : "text-indigo-700"
                            }`}
                          >
                            {money(t.lai_san)}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="border-t-2 border-slate-200 bg-slate-50 font-semibold">
                    <tr>
                      <td className={TD}>Tổng các năm</td>
                      <td className={`${TD} text-right`}>{tongNam.so_phieu}</td>
                      <td className={`${TD} text-right`}>{tongNam.so_don}</td>
                      <td className={`${TD} text-right text-emerald-700`}>
                        {money(tongNam.doanh_thu_san)}
                      </td>
                      <td className={`${TD} text-right text-indigo-700`}>
                        {money(tongNam.tra_shop)}
                      </td>
                      <td className={`${TD} text-right text-rose-600`}>
                        {money(tongNam.chi_dvvc)}
                      </td>
                      {hienLai && (
                        <td className={`${TD} text-right text-indigo-700`}>
                          {money(tongNam.lai_san)}
                        </td>
                      )}
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </>
        )}

        {viewMode === "giao-dich" && (
          <>
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

              <label className="flex min-w-[260px] flex-col gap-1">
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
                      setTxFilter((p) => ({
                        ...p,
                        q: qInput.trim(),
                        page: 1,
                      }));
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
                </span>
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
                <table className="w-full min-w-[1000px] border-collapse">
                  <thead className="border-b border-slate-200 bg-slate-50">
                    <tr>
                      <th className={TH}>Mã phiếu</th>
                      <th className={TH}>Kho</th>
                      <th className={TH}>Ngày tạo</th>
                      <th className={TH}>Hoàn tất</th>
                      <th className={`${TH} text-right`}>Số đơn</th>
                      <th className={`${TH} text-right`}>Phí sàn</th>
                      <th className={`${TH} text-right`}>Tiền shop</th>
                      <th className={`${TH} text-right`}>QR đã TT</th>
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
                        <td className={`${TD} text-right text-slate-600`}>
                          {r.so_qr_da_tt}/{r.so_qr}
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
          </>
        )}
      </SectionCard>

      <PhieuChiTietDrawer
        variant="san"
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
