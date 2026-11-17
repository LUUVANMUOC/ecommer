// frontend/src/pages/shop/LichSuDongTien.jsx
import {
  Fragment,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { AuthContext } from "../../contexts/AuthContext";
import axiosClient from "../../config/axiosClient";
import ToastNotification from "../../components/common/Crud/ToastNotification";

const vnd = (n) => `${Math.round(Number(n) || 0).toLocaleString("vi-VN")} đ`;
const so = (n) => Number(n || 0).toLocaleString("vi-VN");

const TH =
  "whitespace-nowrap px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500";
const TD = "px-4 py-3 text-sm text-gray-700";
const LABEL =
  "text-[11px] font-semibold uppercase tracking-wide text-slate-500";

const VIEWS = [
  { id: "thang", label: "Theo tháng", icon: "calendar_month" },
  { id: "nam", label: "Theo năm", icon: "event_note" },
];

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
const SO_NAM_GAN_NHAT = 10; // số năm hiển thị trong dropdown

const ZERO = {
  so_don: 0,
  tien_hang: 0,
  phi_san: 0,
  thuc_nhan: 0,
  da_nhan: 0,
  cho_chuyen: 0,
};

const cong = (rows = []) =>
  rows.reduce(
    (a, d) => ({
      so_don: a.so_don + 1,
      tien_hang: a.tien_hang + d.tien_hang,
      phi_san: a.phi_san + d.phi_san,
      thuc_nhan: a.thuc_nhan + d.thuc_nhan,
      da_nhan: a.da_nhan + (d.paid ? d.thuc_nhan : 0),
      cho_chuyen: a.cho_chuyen + (d.paid ? 0 : d.thuc_nhan),
    }),
    { ...ZERO },
  );

const parseDate = (v) => {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
};

const TONES = {
  emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
  blue: "border-blue-200 bg-blue-50 text-blue-700",
  amber: "border-amber-200 bg-amber-50 text-amber-700",
  red: "border-red-200 bg-red-50 text-red-600",
  slate: "border-slate-200 bg-slate-50 text-slate-700",
  indigo: "border-indigo-200 bg-indigo-50 text-indigo-700",
};

const Kpi = ({ icon, label, value, hint, tone = "slate" }) => (
  <div
    className={`rounded-2xl border p-4 shadow-sm ${TONES[tone] || TONES.slate}`}
  >
    <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide opacity-80">
      <span className="material-symbols-outlined text-[18px]">{icon}</span>
      {label}
    </div>
    <p className="mt-2 text-xl font-bold">{value}</p>
    {hint ? <p className="mt-1 text-[11px] opacity-70">{hint}</p> : null}
  </div>
);

const LichSuDongTien = () => {
  const { user } = useContext(AuthContext);
  const gh_ma = user?.gh_ma || user?.GH_Ma;

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [viewMode, setViewMode] = useState("thang");
  // "" = tự động lấy năm mới nhất có dữ liệu
  const [namChon, setNamChon] = useState("");
  const [thang, setThang] = useState(""); // "" = tất cả tháng
  const [expanded, setExpanded] = useState(new Set());
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });

  const showToast = useCallback((message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast((p) => ({ ...p, show: false })), 2500);
  }, []);

  // ---- Tải dữ liệu ----
  const fetchData = useCallback(async () => {
    if (!gh_ma) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await axiosClient.get(`/dong-tien/shop/${gh_ma}`);
      setData(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error("Lỗi tải dòng tiền shop:", e);
      setError(
        e.response?.data?.message || "Không tải được dữ liệu dòng tiền.",
      );
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [gh_ma]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ---- Chuẩn hóa: 1 dòng / đơn, ưu tiên dòng đã thanh toán ----
  const donList = useMemo(() => {
    const map = new Map();

    (data || []).forEach((r) => {
      const paid = r.trang_thai_qr === "DA_THANH_TOAN";
      const ngay = parseDate(r.ngay_tat_toan) || parseDate(r.dts_ngaylap);
      if (!ngay) return;

      const item = {
        dts_ma: r.dts_ma,
        ngay,
        tien_hang: Number(r.tien_hang_goc) || 0,
        phi_san: Number(r.phi_san) || 0,
        thuc_nhan: Number(r.tien_shop_nhan) || 0,
        paid,
        ptt_ma: r.ptt_ma,
      };

      const cur = map.get(r.dts_ma);
      if (!cur || (!cur.paid && paid)) map.set(r.dts_ma, item);
    });

    return [...map.values()].sort((a, b) => b.ngay - a.ngay);
  }, [data]);

  // ---- Năm mặc định: năm mới nhất có dữ liệu (không gán cứng) ----
  const namMacDinh = useMemo(() => {
    const ys = donList.map((d) => d.ngay.getFullYear());
    return ys.length ? Math.max(...ys) : new Date().getFullYear();
  }, [donList]);

  // Năm đang dùng: người dùng chọn, nếu chưa chọn thì tự động
  const nam = Number(namChon) || namMacDinh;

  // ---- Danh sách năm cho dropdown ----
  const dsNam = useMemo(() => {
    const now = new Date().getFullYear();
    const ys = donList.map((d) => d.ngay.getFullYear());
    const co = ys.length ? ys : [now];
    const minYear = Math.min(...co, now - (SO_NAM_GAN_NHAT - 1));
    const maxYear = Math.max(...co, now);
    const out = [];
    for (let y = maxYear; y >= minYear; y -= 1) out.push(y);
    return out;
  }, [donList]);

  // Đổi bộ lọc → đóng các dòng chi tiết
  useEffect(() => {
    setExpanded(new Set());
  }, [viewMode, nam, thang]);

  const thangSo = Number(thang) || null;

  // ---- KPI theo phạm vi đang xem ----
  const phamVi = useMemo(() => {
    if (viewMode === "nam") return donList;
    return donList.filter(
      (d) =>
        d.ngay.getFullYear() === nam &&
        (!thangSo || d.ngay.getMonth() + 1 === thangSo),
    );
  }, [viewMode, nam, thangSo, donList]);

  const kpi = useMemo(() => cong(phamVi), [phamVi]);

  // ---- Bảng: các kỳ thuộc phạm vi lọc ----
  const kyList = useMemo(() => {
    if (viewMode === "thang") {
      const months = thangSo ? [thangSo] : MONTHS;
      return months.map((m) => {
        const rows = donList.filter(
          (d) => d.ngay.getFullYear() === nam && d.ngay.getMonth() + 1 === m,
        );
        return {
          key: `${nam}-${String(m).padStart(2, "0")}`,
          label: `Tháng ${m}/${nam}`,
          ngan: `T${m}`,
          thang: m,
          namKy: nam,
          rows,
          ...cong(rows),
        };
      });
    }

    const namSet = [...new Set(donList.map((d) => d.ngay.getFullYear()))].sort(
      (a, b) => b - a,
    );

    return namSet.map((y) => {
      const rows = donList.filter((d) => d.ngay.getFullYear() === y);
      return {
        key: String(y),
        label: `Năm ${y}`,
        ngan: String(y),
        thang: null,
        namKy: y,
        rows,
        ...cong(rows),
      };
    });
  }, [viewMode, nam, thangSo, donList]);

  // ---- Biểu đồ: luôn đủ 12 tháng của năm đang chọn để so sánh ----
  const chartList = useMemo(() => {
    if (viewMode === "nam") return kyList;
    return MONTHS.map((m) => {
      const rows = donList.filter(
        (d) => d.ngay.getFullYear() === nam && d.ngay.getMonth() + 1 === m,
      );
      return {
        key: `${nam}-${String(m).padStart(2, "0")}`,
        label: `Tháng ${m}/${nam}`,
        ngan: `T${m}`,
        thang: m,
        rows,
        ...cong(rows),
      };
    });
  }, [viewMode, nam, donList, kyList]);

  const tongKy = useMemo(() => cong(kyList.flatMap((k) => k.rows)), [kyList]);
  const maxKy = useMemo(
    () => Math.max(...chartList.map((k) => k.thuc_nhan), 1),
    [chartList],
  );

  const phamViText =
    viewMode === "nam"
      ? "toàn bộ thời gian"
      : thangSo
        ? `tháng ${thangSo}/${nam}`
        : `năm ${nam}`;

  // ---- Mở / đóng chi tiết kỳ ----
  const toggleKy = (key) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  // ==================================================================
  // XUẤT EXCEL (định dạng báo cáo đầy đủ)
  // ==================================================================
  const exportExcel = async () => {
    if (!kyList.length) return showToast("Không có dữ liệu để xuất", "error");

    const ExcelJSMod = await import("exceljs");
    const ExcelJS = ExcelJSMod.default || ExcelJSMod;
    const fileSaverMod = await import("file-saver");
    const saveAs =
      fileSaverMod.saveAs ||
      fileSaverMod.default?.saveAs ||
      fileSaverMod.default;

    const wb = new ExcelJS.Workbook();
    wb.creator = "Shop Analytics";
    wb.created = new Date();

    const ws = wb.addWorksheet("DongTien", {
      views: [{ state: "frozen", ySplit: 1 }],
    });

    const shopLabel = user?.gh_ten ? `${user.gh_ten} (${gh_ma})` : gh_ma || "—";
    const cheDoLabel = viewMode === "thang" ? "Theo tháng" : "Theo năm";
    const periodLabel =
      viewMode === "nam"
        ? "Toàn bộ thời gian"
        : thangSo
          ? `Tháng ${thangSo}/${nam}`
          : `Năm ${nam}`;

    // Metadata cho từng dòng để style
    const rows = [];
    const meta = [];

    // ----- HEADER BLOCK -----
    rows.push(["BÁO CÁO THỐNG KÊ DÒNG TIỀN"]);
    meta.push({ type: "title" });

    rows.push(["Gian hàng", shopLabel]);
    meta.push({ type: "meta" });
    rows.push(["Chế độ xem", cheDoLabel]);
    meta.push({ type: "meta" });
    rows.push(["Phạm vi báo cáo", periodLabel]);
    meta.push({ type: "meta" });
    rows.push(["Ngày xuất", new Date().toLocaleString("vi-VN")]);
    meta.push({ type: "meta" });
    rows.push([]);
    meta.push({ type: "blank" });

    // ----- I. TỔNG QUAN -----
    rows.push(["I. TỔNG QUAN"]);
    meta.push({ type: "section" });
    rows.push(["Chỉ tiêu", "Giá trị"]);
    meta.push({ type: "header", moneyCols: [2] });

    const kpiLines = [
      ["Số đơn", kpi.so_don, false],
      ["Tiền khách trả", kpi.tien_hang, true],
      ["Phí sàn", kpi.phi_san, true],
      ["Thực nhận", kpi.thuc_nhan, true],
      ["Đã vào tài khoản", kpi.da_nhan, true],
      ["Chờ kho chuyển", kpi.cho_chuyen, true],
    ];
    kpiLines.forEach(([label, value, isMoney]) => {
      rows.push([label, value]);
      meta.push({ type: "kpi-row", moneyCols: isMoney ? [2] : null });
    });
    rows.push([]);
    meta.push({ type: "blank" });

    // ----- II. CHI TIẾT THEO KỲ -----
    rows.push([`II. CHI TIẾT THEO ${viewMode === "thang" ? "THÁNG" : "NĂM"}`]);
    meta.push({ type: "section" });

    const kyHeaders = [
      "Kỳ",
      "Số đơn",
      "Tiền khách trả",
      "Phí sàn",
      "Thực nhận",
      "Đã vào TK",
      "Chờ chuyển",
    ];
    rows.push(kyHeaders);
    meta.push({ type: "header", moneyCols: [3, 4, 5, 6, 7] });

    kyList.forEach((k) => {
      rows.push([
        k.label,
        k.so_don,
        k.tien_hang,
        k.phi_san,
        k.thuc_nhan,
        k.da_nhan,
        k.cho_chuyen,
      ]);
      meta.push({ type: "data-row", moneyCols: [3, 4, 5, 6, 7] });
    });
    rows.push([
      "TỔNG CỘNG",
      tongKy.so_don,
      tongKy.tien_hang,
      tongKy.phi_san,
      tongKy.thuc_nhan,
      tongKy.da_nhan,
      tongKy.cho_chuyen,
    ]);
    meta.push({ type: "total-row", moneyCols: [3, 4, 5, 6, 7] });
    rows.push([]);
    meta.push({ type: "blank" });

    // ----- III. CHI TIẾT ĐƠN HÀNG -----
    rows.push(["III. CHI TIẾT ĐƠN HÀNG"]);
    meta.push({ type: "section" });

    const ordHeaders = [
      "Kỳ",
      "Mã đơn",
      "Ngày tất toán",
      "Tiền khách trả",
      "Phí sàn",
      "Thực nhận",
      "Trạng thái",
    ];
    rows.push(ordHeaders);
    meta.push({ type: "header", moneyCols: [4, 5, 6] });

    let ordCount = 0;
    kyList.forEach((k) => {
      k.rows.forEach((d) => {
        rows.push([
          k.label,
          d.dts_ma,
          d.ngay.toLocaleDateString("vi-VN"),
          d.tien_hang,
          d.phi_san,
          d.thuc_nhan,
          d.paid ? "Đã vào tài khoản" : "Chờ Kho chuyển",
        ]);
        meta.push({ type: "data-row", moneyCols: [4, 5, 6] });
        ordCount += 1;
      });
    });

    if (ordCount === 0) {
      rows.push(["Không có đơn hàng trong phạm vi này."]);
      meta.push({ type: "empty-row" });
    }

    rows.push([]);
    meta.push({ type: "blank" });

    rows.push([
      "Ghi chú: mỗi đơn chỉ tính 1 lần (nếu đơn nằm trong nhiều phiếu tất toán thì lấy phiếu đã thanh toán).",
    ]);
    meta.push({ type: "footer" });
    rows.push([
      "Kỳ được xác định theo ngày tất toán của phiếu; nếu phiếu chưa có ngày tất toán thì dùng ngày đặt.",
    ]);
    meta.push({ type: "footer" });

    // ----- WRITE ROWS -----
    rows.forEach((r) => ws.addRow(Array.isArray(r) ? r : [r]));

    const maxCol = Math.max(
      ...rows.map((r) => (Array.isArray(r) ? r.length : 1)),
      2,
    );

    // ----- STYLE -----
    meta.forEach((m, i) => {
      const excelRow = ws.getRow(i + 1);

      if (m.type === "title") {
        excelRow.font = { bold: true, size: 14, color: { argb: "FF0F172A" } };
        excelRow.alignment = { vertical: "middle" };
        excelRow.height = 22;
        ws.mergeCells(i + 1, 1, i + 1, maxCol);
      } else if (m.type === "section") {
        excelRow.font = { bold: true, size: 12, color: { argb: "FF0F172A" } };
        excelRow.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFE2E8F0" },
        };
        excelRow.height = 20;
        ws.mergeCells(i + 1, 1, i + 1, maxCol);
      } else if (m.type === "header") {
        excelRow.font = { bold: true, color: { argb: "FF334155" } };
        excelRow.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFF1F5F9" },
        };
        excelRow.alignment = { vertical: "middle" };
        // border dưới
        excelRow.eachCell((cell) => {
          cell.border = {
            bottom: { style: "thin", color: { argb: "FFCBD5E1" } },
          };
        });
      } else if (m.type === "total-row") {
        excelRow.font = { bold: true, color: { argb: "FF0F172A" } };
        excelRow.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFF8FAFC" },
        };
        excelRow.eachCell((cell) => {
          cell.border = {
            top: { style: "medium", color: { argb: "FF94A3B8" } },
          };
        });
      } else if (m.type === "footer") {
        excelRow.font = {
          italic: true,
          size: 10,
          color: { argb: "FF64748B" },
        };
      } else if (m.type === "empty-row") {
        excelRow.font = {
          italic: true,
          color: { argb: "FF94A3B8" },
        };
      }

      if (m.moneyCols) {
        m.moneyCols.forEach((c) => {
          const cell = excelRow.getCell(c);
          cell.numFmt = "#,##0";
          cell.alignment = { ...cell.alignment, horizontal: "right" };
        });
      }
    });

    // Auto column widths
    for (let c = 1; c <= maxCol; c++) {
      let w = 10;
      rows.forEach((r) => {
        if (!Array.isArray(r)) return;
        const v = r[c - 1];
        const s = v == null ? "" : String(v);
        if (s.length > w) w = Math.min(s.length + 2, 40);
      });
      ws.getColumn(c).width = w;
    }

    const filename = `bao-cao-dong-tien-${viewMode}-${nam}${
      thangSo ? `-T${thangSo}` : ""
    }.xlsx`;

    try {
      const buf = await wb.xlsx.writeBuffer();
      saveAs(new Blob([buf], { type: "application/octet-stream" }), filename);
      showToast("Đã xuất báo cáo Excel");
    } catch (e) {
      showToast(e?.message || "Lỗi xuất báo cáo Excel", "error");
    }
  };

  if (loading)
    return (
      <div className="p-10 text-center font-medium text-gray-500">
        Đang tải dữ liệu...
      </div>
    );

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6">
      <div className="mx-auto max-w-6xl space-y-5">
        {/* ===== Header ===== */}
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A]">
            Thống kê dòng tiền
          </h1>
          <p className="mt-1 text-sm text-[#64748B]">
            Tiền được chuyển trực tiếp vào tài khoản ngân hàng của bạn. Chọn
            tháng, năm và chế độ xem để theo dõi dòng tiền.
          </p>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* ===== Bộ lọc ===== */}
        <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-sm">
          {/* Chế độ xem */}
          <div className="flex flex-col gap-1">
            <span className={LABEL}>Chế độ xem</span>
            <div className="flex rounded-xl border border-slate-200 bg-slate-50 p-1">
              {VIEWS.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setViewMode(v.id)}
                  className={`flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                    viewMode === v.id
                      ? "bg-[#1e3a5f] text-white shadow-sm"
                      : "text-slate-600 hover:bg-white"
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">
                    {v.icon}
                  </span>
                  {v.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tháng */}
          <label className="flex flex-col gap-1">
            <span className={LABEL}>Tháng</span>
            <select
              value={thang}
              disabled={viewMode === "nam"}
              onChange={(e) => setThang(e.target.value)}
              className={`h-10 min-w-[150px] rounded-lg border border-slate-200 px-3 text-sm font-medium outline-none focus:border-[#1e3a5f] ${
                viewMode === "nam"
                  ? "cursor-not-allowed bg-slate-100 text-slate-400"
                  : "bg-white text-slate-700"
              }`}
            >
              <option value="">Tất cả tháng</option>
              {MONTHS.map((m) => (
                <option key={m} value={m}>
                  Tháng {m}
                </option>
              ))}
            </select>
          </label>

          {/* Năm */}
          <label className="flex flex-col gap-1">
            <span className={LABEL}>Năm</span>
            <select
              value={nam}
              disabled={viewMode === "nam"}
              onChange={(e) => setNamChon(e.target.value)}
              className={`h-10 min-w-[130px] rounded-lg border border-slate-200 px-3 text-sm font-medium outline-none focus:border-[#1e3a5f] ${
                viewMode === "nam"
                  ? "cursor-not-allowed bg-slate-100 text-slate-400"
                  : "bg-white text-slate-700"
              }`}
            >
              {dsNam.map((y) => (
                <option key={y} value={y}>
                  Năm {y}
                </option>
              ))}
            </select>
          </label>

          {/* Hành động */}
          <div className="ml-auto flex items-center gap-2">
            <span className="mr-1 hidden text-xs text-slate-500 sm:inline">
              Đang xem: <strong className="text-slate-700">{phamViText}</strong>
            </span>
            <button
              type="button"
              onClick={fetchData}
              className="flex h-10 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              <span className="material-symbols-outlined text-[18px]">
                refresh
              </span>
              Tải lại
            </button>
            <button
              type="button"
              onClick={exportExcel}
              className="flex h-10 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              <span className="material-symbols-outlined text-[18px]">
                download
              </span>
              Excel
            </button>
          </div>
        </div>

        {viewMode === "nam" && (
          <p className="text-xs text-slate-500">
            Chế độ <strong>Theo năm</strong> thống kê toàn bộ thời gian nên bộ
            lọc tháng/năm được tạm khóa.
          </p>
        )}

        {/* ===== KPI ===== */}
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <Kpi
            icon="account_balance_wallet"
            label="Thực nhận"
            value={vnd(kpi.thuc_nhan)}
            tone="emerald"
            hint={`${so(kpi.so_don)} đơn · ${phamViText}`}
          />
          <Kpi
            icon="check_circle"
            label="Đã vào tài khoản"
            value={vnd(kpi.da_nhan)}
            tone="blue"
            hint="Đơn đã thanh toán qua QR"
          />
          <Kpi
            icon="schedule"
            label="Chờ kho chuyển"
            value={vnd(kpi.cho_chuyen)}
            tone="amber"
            hint="Đơn chưa vào tài khoản"
          />
          <Kpi
            icon="percent"
            label="Phí sàn"
            value={vnd(kpi.phi_san)}
            tone="red"
            hint="Tổng phí sàn của các đơn trong kỳ"
          />
          <Kpi
            icon="payments"
            label="Tiền khách trả"
            value={vnd(kpi.tien_hang)}
            tone="slate"
            hint="Tổng giá trị hàng của các đơn"
          />
          <Kpi
            icon="receipt_long"
            label="Số đơn"
            value={so(kpi.so_don)}
            tone="indigo"
            hint={
              viewMode === "thang" ? `Trong ${phamViText}` : "Toàn bộ thời gian"
            }
          />
        </div>

        {/* ===== Biểu đồ cột theo kỳ ===== */}
        <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-[#0F172A]">
              Thực nhận theo {viewMode === "thang" ? "tháng" : "năm"}
            </h2>
            <span className="text-xs text-slate-500">
              {viewMode === "thang" ? `Năm ${nam}` : "Tất cả các năm"}
            </span>
          </div>

          {chartList.every((k) => k.thuc_nhan === 0) ? (
            <p className="py-8 text-center text-sm text-gray-500">
              Chưa có dữ liệu trong phạm vi này.
            </p>
          ) : (
            <div className="flex items-end gap-2 overflow-x-auto pb-1">
              {chartList.map((k) => {
                const active = viewMode === "thang" && k.thang === thangSo;
                return (
                  <div
                    key={k.key}
                    className="flex min-w-[42px] flex-1 flex-col items-center gap-1"
                    title={`${k.label}: ${vnd(k.thuc_nhan)}`}
                  >
                    <span className="text-[10px] font-medium text-slate-500">
                      {k.thuc_nhan > 0
                        ? `${Math.round(k.thuc_nhan / 1000000)}tr`
                        : ""}
                    </span>
                    <div className="flex h-28 w-full items-end">
                      <div
                        className={`w-full rounded-t transition-all ${
                          active ? "bg-[#F2A93B]" : "bg-emerald-500/80"
                        }`}
                        style={{
                          height: `${Math.max(
                            (k.thuc_nhan / maxKy) * 100,
                            k.thuc_nhan > 0 ? 3 : 0,
                          )}%`,
                        }}
                      />
                    </div>
                    <span
                      className={`whitespace-nowrap text-[10px] ${
                        active ? "font-bold text-[#b47818]" : "text-slate-500"
                      }`}
                    >
                      {k.ngan}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ===== Bảng thống kê ===== */}
        <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-[#0F172A]">
              Bảng thống kê theo {viewMode === "thang" ? "tháng" : "năm"}
            </h2>
            <span className="text-xs text-slate-500">
              {kyList.length} kỳ · {phamViText}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse text-left text-sm">
              <thead className="border-b border-slate-200 bg-gray-50">
                <tr>
                  <th className={TH}>Kỳ</th>
                  <th className={`${TH} text-right`}>Số đơn</th>
                  <th className={`${TH} text-right`}>Tiền khách trả</th>
                  <th className={`${TH} text-right`}>Phí sàn</th>
                  <th className={`${TH} text-right`}>Thực nhận</th>
                  <th className={`${TH} text-right`}>Đã vào TK</th>
                  <th className={`${TH} text-right`}>Chờ chuyển</th>
                  <th className={`${TH} w-10`} />
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {kyList.map((k) => {
                  const open = expanded.has(k.key);
                  return (
                    <Fragment key={k.key}>
                      <tr
                        onClick={() => toggleKy(k.key)}
                        className={`cursor-pointer transition-colors ${
                          open ? "bg-slate-50" : "hover:bg-gray-50"
                        }`}
                      >
                        <td className={`${TD} font-semibold text-gray-800`}>
                          {k.label}
                        </td>
                        <td className={`${TD} text-right`}>{k.so_don}</td>
                        <td className={`${TD} text-right`}>
                          {vnd(k.tien_hang)}
                        </td>
                        <td className={`${TD} text-right text-red-500`}>
                          -{vnd(k.phi_san)}
                        </td>
                        <td
                          className={`${TD} text-right font-bold text-emerald-600`}
                        >
                          {vnd(k.thuc_nhan)}
                        </td>
                        <td className={`${TD} text-right text-blue-600`}>
                          {vnd(k.da_nhan)}
                        </td>
                        <td className={`${TD} text-right text-amber-600`}>
                          {vnd(k.cho_chuyen)}
                        </td>
                        <td className={`${TD} text-right`}>
                          <span className="material-symbols-outlined text-[18px] text-slate-400">
                            {open ? "expand_less" : "expand_more"}
                          </span>
                        </td>
                      </tr>

                      {open && (
                        <tr className="bg-slate-50/70">
                          <td colSpan={8} className="px-4 pb-4">
                            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                              <table className="w-full text-left text-sm">
                                <thead className="border-b border-slate-200 bg-slate-50">
                                  <tr>
                                    <th className={TH}>Mã đơn</th>
                                    <th className={TH}>Ngày</th>
                                    <th className={`${TH} text-right`}>
                                      Tiền khách trả
                                    </th>
                                    <th className={`${TH} text-right`}>
                                      Phí sàn
                                    </th>
                                    <th className={`${TH} text-right`}>
                                      Thực nhận
                                    </th>
                                    <th className={`${TH} text-center`}>
                                      Trạng thái
                                    </th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {k.rows.length === 0 && (
                                    <tr>
                                      <td
                                        colSpan={6}
                                        className="px-4 py-5 text-center text-xs text-gray-500"
                                      >
                                        Không có đơn trong kỳ này.
                                      </td>
                                    </tr>
                                  )}
                                  {k.rows.map((d) => (
                                    <tr key={d.dts_ma}>
                                      <td className={`${TD} font-semibold`}>
                                        {d.dts_ma}
                                      </td>
                                      <td className={TD}>
                                        {d.ngay.toLocaleDateString("vi-VN")}
                                      </td>
                                      <td className={`${TD} text-right`}>
                                        {vnd(d.tien_hang)}
                                      </td>
                                      <td
                                        className={`${TD} text-right text-red-500`}
                                      >
                                        -{vnd(d.phi_san)}
                                      </td>
                                      <td
                                        className={`${TD} text-right font-semibold text-emerald-600`}
                                      >
                                        {vnd(d.thuc_nhan)}
                                      </td>
                                      <td className={`${TD} text-center`}>
                                        <span
                                          className={`rounded-full px-3 py-1 text-[11px] font-bold ${
                                            d.paid
                                              ? "bg-green-100 text-green-700"
                                              : "bg-orange-100 text-orange-700"
                                          }`}
                                        >
                                          {d.paid
                                            ? "Đã vào tài khoản"
                                            : "Chờ Kho chuyển"}
                                        </span>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}

                {kyList.length === 0 && (
                  <tr>
                    <td colSpan={8} className="p-6 text-center text-gray-500">
                      Chưa có giao dịch nào.
                    </td>
                  </tr>
                )}
              </tbody>

              {kyList.length > 0 && (
                <tfoot className="border-t-2 border-slate-200 bg-gray-50 font-semibold">
                  <tr>
                    <td className={TD}>
                      {viewMode === "thang"
                        ? thangSo
                          ? `Tổng tháng ${thangSo}/${nam}`
                          : `Tổng năm ${nam}`
                        : "Tổng cộng"}
                    </td>
                    <td className={`${TD} text-right`}>{tongKy.so_don}</td>
                    <td className={`${TD} text-right`}>
                      {vnd(tongKy.tien_hang)}
                    </td>
                    <td className={`${TD} text-right text-red-500`}>
                      -{vnd(tongKy.phi_san)}
                    </td>
                    <td className={`${TD} text-right text-emerald-600`}>
                      {vnd(tongKy.thuc_nhan)}
                    </td>
                    <td className={`${TD} text-right text-blue-600`}>
                      {vnd(tongKy.da_nhan)}
                    </td>
                    <td className={`${TD} text-right text-amber-600`}>
                      {vnd(tongKy.cho_chuyen)}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>

        <p className="text-xs text-slate-500">
          Ghi chú: mỗi đơn chỉ tính 1 lần (nếu đơn nằm trong nhiều phiếu tất
          toán thì lấy phiếu đã thanh toán). Kỳ được xác định theo{" "}
          <strong>ngày tất toán</strong> của phiếu; nếu phiếu chưa có ngày tất
          toán thì dùng <strong>ngày đặt</strong>.
        </p>
      </div>

      <ToastNotification toast={toast} />
    </div>
  );
};

export default LichSuDongTien;
