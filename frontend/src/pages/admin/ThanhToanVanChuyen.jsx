// frontend/src/pages/admin/ThanhToanVanChuyen.jsx
import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import thanhToanVanChuyenService from "../../services/san/thanhToanVanChuyenService";
import ToastNotification from "../../components/common/Crud/ToastNotification";
import { buildVietQrUrl } from "../../utils/accountUtils";
import {
  INPUT,
  money,
  fmtDate,
  KpiCard,
  TabBar,
  SectionCard,
  EmptyState,
  Pager,
} from "../../components/admin/dongtien/DongTienUI";
import {
  FilterBarVC,
  ChiBadge,
} from "../../components/admin/vanchuyen/VanChuyenUI";
import ChiTietPhieuDVVCDrawer from "../../components/admin/vanchuyen/ChiTietPhieuDVVCDrawer";

const NAM_HIEN_TAI = new Date().getFullYear();
const PAGE_SIZE = 10;

const TABS = [
  { key: "cong-no", label: "Công nợ ĐVVC" },
  { key: "lich-su", label: "Lịch sử chi trả" },
];

const TRANG_THAI_PHIEU = [
  { value: "DA_THANH_TOAN", label: "Đã chi" },
  { value: "CHO_THANH_TOAN", label: "Chờ QR" },
];

const TH =
  "whitespace-nowrap px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500";
const TD = "px-3 py-2.5 text-sm text-slate-700";
const BTN_PRIMARY =
  "inline-flex items-center gap-1.5 rounded-lg bg-[#1e3a5f] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#2a4b73] disabled:opacity-50 disabled:cursor-not-allowed";
const BTN_GHOST =
  "inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50";

const formatTime = (seconds) => {
  const m = Math.floor(Math.max(seconds, 0) / 60)
    .toString()
    .padStart(2, "0");
  const s = (Math.max(seconds, 0) % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
};

const ThanhToanVanChuyen = () => {
  const [danhMuc, setDanhMuc] = useState({ dvvc: [], nam: [NAM_HIEN_TAI] });
  const [filters, setFilters] = useState({
    dvvc_ma: "",
    nam: String(NAM_HIEN_TAI),
    thang: "",
    trang_thai: "",
    q: "",
  });
  const [qInput, setQInput] = useState("");
  const [tongQuan, setTongQuan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("cong-no");

  const [expandedDvvc, setExpandedDvvc] = useState(null);
  const [chiTietNo, setChiTietNo] = useState({});
  const [loadingDetail, setLoadingDetail] = useState(false);

  // 🟢 STATE MỚI: Lưu các đơn hàng được chọn thanh toán
  const [selectedOrders, setSelectedOrders] = useState({});

  const [phieu, setPhieu] = useState({
    rows: [],
    total: 0,
    page: 1,
    total_pages: 1,
  });
  const [phieuLoading, setPhieuLoading] = useState(false);
  const [page, setPage] = useState(1);

  const [detail, setDetail] = useState({
    open: false,
    loading: false,
    data: null,
  });
  const [showQR, setShowQR] = useState(null);
  const [timeLeft, setTimeLeft] = useState(300);
  const cancellingRef = useRef(false);

  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });
  const showToast = useCallback((message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast((p) => ({ ...p, show: false })), 3000);
  }, []);

  // ---- Danh mục ----
  useEffect(() => {
    thanhToanVanChuyenService
      .getDanhMuc()
      .then((r) => setDanhMuc(r.data))
      .catch(() => showToast("Không tải được danh mục ĐVVC/năm", "error"));
  }, [showToast]);

  // ---- Tổng quan ----
  const loadTongQuan = useCallback(async () => {
    setLoading(true);
    try {
      const res = await thanhToanVanChuyenService.getTongQuan({
        dvvc_ma: filters.dvvc_ma || undefined,
        nam: filters.nam,
        thang: filters.thang || undefined,
      });
      setTongQuan(res.data);
    } catch (e) {
      showToast(
        e.response?.data?.message || "Lỗi tải tổng quan thanh toán vận chuyển",
        "error",
      );
    } finally {
      setLoading(false);
    }
  }, [filters.dvvc_ma, filters.nam, filters.thang, showToast]);

  useEffect(() => {
    loadTongQuan();
  }, [loadTongQuan]);

  // ---- Lịch sử phiếu chi ----
  const loadPhieu = useCallback(async () => {
    setPhieuLoading(true);
    try {
      const res = await thanhToanVanChuyenService.getDanhSachPhieu({
        dvvc_ma: filters.dvvc_ma || undefined,
        nam: filters.nam,
        thang: filters.thang || undefined,
        trang_thai: filters.trang_thai || undefined,
        q: filters.q || undefined,
        page,
        limit: PAGE_SIZE,
      });
      setPhieu(res.data);
    } catch (e) {
      showToast(
        e.response?.data?.message || "Lỗi tải lịch sử chi trả",
        "error",
      );
    } finally {
      setPhieuLoading(false);
    }
  }, [
    filters.dvvc_ma,
    filters.nam,
    filters.thang,
    filters.trang_thai,
    filters.q,
    page,
    showToast,
  ]);

  useEffect(() => {
    if (tab !== "lich-su") return;
    loadPhieu();
  }, [tab, loadPhieu]);

  // ---- Bộ lọc dùng chung cho cả 2 chế độ xem ----
  const handleFilterChange = (next) => {
    const scopeChanged =
      next.dvvc_ma !== filters.dvvc_ma ||
      next.nam !== filters.nam ||
      next.thang !== filters.thang;

    const merged = { ...next };
    if (!merged.nam) merged.thang = "";
    if (scopeChanged) {
      merged.q = "";
      setQInput("");
    }

    setFilters(merged);
    setPage(1);
  };

  const applySearch = () => {
    setFilters((p) => ({ ...p, q: qInput.trim() }));
    setPage(1);
  };

  const reload = () => {
    loadTongQuan();
    if (tab === "lich-su") loadPhieu();
  };

  // ---- Chi tiết đơn nợ ----
  const handleToggleDetail = async (dvvc_ma) => {
    if (expandedDvvc === dvvc_ma) {
      setExpandedDvvc(null);
      return;
    }
    setExpandedDvvc(dvvc_ma);
    if (chiTietNo[dvvc_ma]) return;
    setLoadingDetail(true);
    try {
      const res = await thanhToanVanChuyenService.getChiTietNo(dvvc_ma);
      setChiTietNo((prev) => ({ ...prev, [dvvc_ma]: res.data }));
    } catch {
      showToast("Không tải được chi tiết đơn nợ", "error");
    } finally {
      setLoadingDetail(false);
    }
  };

  // 🟢 LOGIC CHỌN ĐƠN HÀNG
  const toggleOrder = (dvvc_ma, dts_ma) => {
    setSelectedOrders((prev) => {
      const current = prev[dvvc_ma] || [];
      const updated = current.includes(dts_ma)
        ? current.filter((id) => id !== dts_ma)
        : [...current, dts_ma];
      return { ...prev, [dvvc_ma]: updated };
    });
  };

  const toggleAllOrders = (dvvc_ma, orders) => {
    setSelectedOrders((prev) => {
      const current = prev[dvvc_ma] || [];
      const allSelected = current.length === orders.length && orders.length > 0;
      return {
        ...prev,
        [dvvc_ma]: allSelected ? [] : orders.map((o) => o.dts_ma),
      };
    });
  };

  // ---- Tạo QR ----
  const handleTaoPhieuChi = async (dvvc_ma) => {
    const selected = selectedOrders[dvvc_ma] || [];
    const isPartial = selected.length > 0;

    const confirmMsg = isPartial
      ? `Tạo phiếu chi cho ${selected.length} đơn hàng đã chọn của ĐVVC này?`
      : "Tạo phiếu chi thanh toán TOÀN BỘ đơn nợ cho ĐVVC này?";

    if (!window.confirm(confirmMsg)) return;

    try {
      // Truyền thêm mảng selected
      const res = await thanhToanVanChuyenService.taoPhieuChi(
        dvvc_ma,
        selected,
      );
      cancellingRef.current = false;
      setShowQR(res.data);
      setTimeLeft(300);

      // Reset dữ liệu chi tiết và selected của ĐVVC này
      setChiTietNo((p) => {
        const n = { ...p };
        delete n[dvvc_ma];
        return n;
      });
      setSelectedOrders((p) => ({ ...p, [dvvc_ma]: [] }));

      loadTongQuan();
      showToast("Đã tạo phiếu chi, quét QR để thanh toán");
    } catch (e) {
      showToast(e.response?.data?.message || "Lỗi tạo phiếu chi", "error");
    }
  };

  // ---- Xem lại QR đang chờ ----
  const handleXemQR = async (pcd_ma) => {
    try {
      const res = await thanhToanVanChuyenService.getPhieuChiTiet(pcd_ma);
      const d = res.data;
      if (!d?.phieu) throw new Error("not_found");
      cancellingRef.current = false;
      setShowQR({
        pcd_ma: d.phieu.pcd_ma,
        tong_tien: d.phieu.pcd_tong_tien,
        thongTinNganHang: d.ngan_hang,
      });
      const created = new Date(d.phieu.pcd_ngay_tao).getTime();
      const elapsed = Math.floor((Date.now() - created) / 1000);
      setTimeLeft(Math.max(0, 300 - elapsed));
    } catch {
      showToast("Không tải được thông tin QR", "error");
      loadTongQuan();
    }
  };

  // ---- Hủy phiếu ----
  const handleHuyPhieu = async (pcd_ma) => {
    if (!window.confirm("Bạn có chắc muốn đóng? Phiếu chi này sẽ bị hủy."))
      return;
    try {
      await thanhToanVanChuyenService.huyPhieuChi(pcd_ma);
      setShowQR(null);
      setTimeLeft(300);
      loadTongQuan();
      loadPhieu();
      showToast("Đã hủy phiếu chi");
    } catch {
      showToast("Lỗi khi hủy phiếu chi", "error");
    }
  };

  const handleAutoHuyPhieu = useCallback(
    async (pcd_ma) => {
      if (cancellingRef.current) return;
      cancellingRef.current = true;
      try {
        await thanhToanVanChuyenService.huyPhieuChi(pcd_ma);
        showToast("Mã QR hết hạn sau 5 phút, phiếu chi đã bị hủy", "error");
      } catch {
        showToast("Mã QR đã hết hạn", "error");
      } finally {
        cancellingRef.current = false;
        setShowQR(null);
        setTimeLeft(300);
        loadTongQuan();
        loadPhieu();
      }
    },
    [showToast, loadTongQuan, loadPhieu],
  );

  // ---- Đếm ngược ----
  useEffect(() => {
    if (!showQR) return;
    if (timeLeft <= 0) {
      handleAutoHuyPhieu(showQR.pcd_ma);
      return;
    }
    const t = setTimeout(() => setTimeLeft((p) => p - 1), 1000);
    return () => clearTimeout(t);
  }, [showQR, timeLeft, handleAutoHuyPhieu]);

  // ---- Polling trạng thái ----
  useEffect(() => {
    if (!showQR) return;
    const id = setInterval(async () => {
      try {
        const res = await thanhToanVanChuyenService.checkTrangThai(
          showQR.pcd_ma,
        );
        if (res.data?.pcd_trang_thai === "DA_THANH_TOAN") {
          clearInterval(id);
          setShowQR(null);
          setTimeLeft(300);
          showToast("ĐVVC đã nhận được tiền thanh toán");
          loadTongQuan();
          loadPhieu();
        }
      } catch {
        /* bỏ qua lỗi mạng tạm thời */
      }
    }, 3000);
    return () => clearInterval(id);
  }, [showQR, showToast, loadTongQuan, loadPhieu]);

  // ---- Drawer chi tiết phiếu ----
  const openDetail = async (pcd_ma) => {
    setDetail({ open: true, loading: true, data: null });
    try {
      const res = await thanhToanVanChuyenService.getPhieuChiTiet(pcd_ma);
      setDetail({ open: true, loading: false, data: res.data });
    } catch {
      setDetail({ open: true, loading: false, data: null });
      showToast("Không tải được chi tiết phiếu", "error");
    }
  };

  // ---- Dữ liệu dẫn xuất ----
  const kpi = tongQuan?.kpi || {};
  const theoDvvc = tongQuan?.theo_dvvc || [];
  const phieuCho = tongQuan?.phieu_cho || [];

  const kyLabel = !filters.nam
    ? "tất cả các năm"
    : filters.thang
      ? `tháng ${filters.thang}/${filters.nam}`
      : `năm ${filters.nam}`;

  const dsCongNo = useMemo(
    () => theoDvvc.filter((d) => Number(d.con_no) > 0 || Number(d.cho_qr) > 0),
    [theoDvvc],
  );

  const pendingByDvvc = useMemo(() => {
    const map = {};
    phieuCho.forEach((p) => {
      if (!map[p.dvvc_ma]) map[p.dvvc_ma] = p;
    });
    return map;
  }, [phieuCho]);

  const kpiCards = useMemo(
    () => [
      {
        icon: "account_balance_wallet",
        label: "Tổng công nợ hiện tại",
        value: money(kpi.tong_cong_no),
        tone: "red",
        hint: "Nợ chưa lập phiếu + phiếu chờ QR",
      },
      {
        icon: "local_shipping",
        label: "ĐVVC đang nợ",
        value: String(kpi.so_dvvc_cong_no ?? 0),
        tone: "amber",
        hint: "Bao gồm ĐVVC có phiếu chờ QR",
      },
      {
        icon: "receipt_long",
        label: "Số đơn chờ chi",
        value: String(kpi.so_don_no ?? 0),
        tone: "blue",
        hint: "Đơn chưa được đưa vào phiếu chi",
      },
      {
        icon: "payments",
        label: filters.nam ? "Đã chi trong kỳ" : "Tổng đã chi",
        value: money(kpi.da_chi),
        tone: "emerald",
        hint: `Theo ngày hoàn tất phiếu · ${kyLabel}`,
      },
      {
        icon: "description",
        label: "Số phiếu đã chi",
        value: String(kpi.so_phieu ?? 0),
        tone: "slate",
        hint: kyLabel,
      },
      {
        icon: "percent",
        label: filters.nam
          ? "Voucher phát sinh trong kỳ"
          : "Tổng voucher phát sinh",
        value: money(kpi.phat_sinh),
        tone: "indigo",
        hint: `Theo ngày lập đơn · ${kyLabel}`,
      },
    ],
    [kpi, filters.nam, kyLabel],
  );

  // ---- Xuất CSV ----
  const exportCsv = () => {
    let headers;
    let rows;
    let name;

    if (tab === "cong-no") {
      headers = ["Mã ĐVVC", "ĐVVC", "Số đơn nợ", "Còn nợ", "Đang chờ QR"];
      rows = dsCongNo.map((d) => [
        d.dvvc_ma,
        d.dvvc_ten,
        d.so_don_no,
        d.con_no,
        d.cho_qr,
      ]);
      name = "cong-no-dvvc";
    } else if (tab === "lich-su") {
      headers = [
        "Mã phiếu",
        "ĐVVC",
        "Ngày hoàn tất",
        "Số đơn",
        "Số tiền",
        "Trạng thái",
      ];
      rows = phieu.rows.map((p) => [
        p.pcd_ma,
        p.dvvc_ten,
        fmtDate(p.pcd_ngay_hoan_tat || p.pcd_ngay_tao),
        p.so_don,
        p.pcd_tong_tien,
        p.pcd_trang_thai,
      ]);
      name = "lich-su-chi-dvvc";
    } else {
      return showToast("Chọn chế độ xem có bảng dữ liệu để xuất CSV", "error");
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

  // Ô tìm kiếm nằm trong thanh lọc chung, chỉ hiện ở chế độ Lịch sử
  const searchBox =
    tab === "lich-su" ? (
      <label className="flex min-w-[240px] flex-col gap-1">
        <span className="text-xs font-medium text-slate-500">
          Tìm mã phiếu / tên ĐVVC
        </span>
        <div className="flex items-center gap-2">
          <input
            className={`${INPUT} flex-1`}
            value={qInput}
            placeholder="VD: PCD0000001"
            onChange={(e) => setQInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") applySearch();
            }}
          />
          <button
            type="button"
            onClick={applySearch}
            title="Tìm"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
          >
            <span className="material-symbols-outlined text-[18px]">
              search
            </span>
          </button>
        </div>
      </label>
    ) : null;

  return (
    <div className="min-h-screen space-y-5 bg-[#F8FAFC] p-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0F172A]">
          Thanh toán voucher vận chuyển
        </h1>
        <p className="mt-1 text-sm text-[#64748B]">
          Chi trả phần phí ship Sàn bù cho ĐVVC. Công nợ là số liệu hiện tại;
          "Phát sinh" tính theo ngày lập đơn, "Đã chi" tính theo ngày hoàn tất
          phiếu.
        </p>
      </div>

      <FilterBarVC
        danhMuc={danhMuc}
        filters={filters}
        onChange={handleFilterChange}
        onReload={reload}
        loading={loading}
        onExport={exportCsv}
        allowAllYears
        showTrangThai={tab === "lich-su"}
        trangThaiOptions={TRANG_THAI_PHIEU}
        extra={searchBox}
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {kpiCards.map((c) => (
          <KpiCard key={c.label} {...c} />
        ))}
      </div>

      <TabBar tabs={TABS} active={tab} onChange={setTab} />

      {tab === "cong-no" && (
        <SectionCard
          title="Công nợ theo ĐVVC"
          subtitle="Số liệu công nợ hiện tại, không phụ thuộc kỳ lọc · Bấm vào dòng để xem các đơn nợ"
        >
          {dsCongNo.length === 0 ? (
            <EmptyState
              icon="task_alt"
              title="Không có ĐVVC nào cần thanh toán"
              hint="Các đơn có voucher ship đã được đưa vào phiếu chi hoặc chưa phát sinh."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] border-collapse">
                <thead className="border-b border-slate-200 bg-slate-50">
                  <tr>
                    <th className={TH}>ĐVVC</th>
                    <th className={`${TH} text-right`}>Số đơn nợ</th>
                    <th className={`${TH} text-right`}>Cần trả</th>
                    <th className={`${TH} text-right`}>Chờ QR</th>
                    <th className={TH}>Trạng thái</th>
                    <th className={`${TH} text-center`}>Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {dsCongNo.map((d) => {
                    const pending = pendingByDvvc[d.dvvc_ma];
                    const open = expandedDvvc === d.dvvc_ma;
                    const selectedCount = (selectedOrders[d.dvvc_ma] || [])
                      .length;

                    return (
                      <Fragment key={d.dvvc_ma}>
                        <tr
                          className="cursor-pointer hover:bg-slate-50/70"
                          onClick={() => handleToggleDetail(d.dvvc_ma)}
                        >
                          <td className={`${TD} font-semibold`}>
                            <span className="inline-flex items-center gap-2">
                              <span className="material-symbols-outlined text-[18px] text-slate-400">
                                {open ? "expand_less" : "expand_more"}
                              </span>
                              {d.dvvc_ten}
                            </span>
                          </td>
                          <td className={`${TD} text-right`}>{d.so_don_no}</td>
                          <td
                            className={`${TD} text-right font-semibold text-rose-600`}
                          >
                            {money(d.con_no)}
                          </td>
                          <td className={`${TD} text-right text-sky-700`}>
                            {Number(d.cho_qr) > 0 ? money(d.cho_qr) : "—"}
                          </td>
                          <td className={TD}>
                            {pending ? (
                              <ChiBadge status="CHO_THANH_TOAN" />
                            ) : (
                              <ChiBadge status="CHUA_CHI" />
                            )}
                          </td>
                          <td className={`${TD} text-center`}>
                            {pending ? (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleXemQR(pending.pcd_ma);
                                }}
                                className={BTN_GHOST}
                              >
                                <span className="material-symbols-outlined text-[16px]">
                                  qr_code_2
                                </span>
                                Xem QR
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleTaoPhieuChi(d.dvvc_ma);
                                }}
                                className={BTN_PRIMARY}
                              >
                                <span className="material-symbols-outlined text-[16px]">
                                  qr_code_2
                                </span>
                                {/* 🟢 Cập nhật text nếu có chọn đơn */}
                                {selectedCount > 0
                                  ? `Thanh toán ${selectedCount} đơn`
                                  : "Tạo QR thanh toán"}
                              </button>
                            )}
                          </td>
                        </tr>

                        {open && (
                          <tr>
                            <td colSpan={6} className="bg-slate-50 px-4 py-3">
                              {loadingDetail ? (
                                <p className="py-3 text-center text-sm text-slate-500">
                                  Đang tải chi tiết...
                                </p>
                              ) : (chiTietNo[d.dvvc_ma] || []).length === 0 ? (
                                <p className="py-3 text-center text-sm text-slate-500">
                                  Không còn đơn nợ chưa lập phiếu.
                                </p>
                              ) : (
                                <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                                  <table className="w-full min-w-[520px] border-collapse">
                                    <thead className="border-b border-slate-200 bg-slate-50">
                                      <tr>
                                        {/* 🟢 Cột Checkbox chọn tất cả */}
                                        <th
                                          className={`${TH} w-10 text-center`}
                                        >
                                          <input
                                            type="checkbox"
                                            className="h-4 w-4 cursor-pointer accent-indigo-600"
                                            checked={
                                              (chiTietNo[d.dvvc_ma] || [])
                                                .length > 0 &&
                                              (selectedOrders[d.dvvc_ma] || [])
                                                .length ===
                                                (chiTietNo[d.dvvc_ma] || [])
                                                  .length
                                            }
                                            onChange={() =>
                                              toggleAllOrders(
                                                d.dvvc_ma,
                                                chiTietNo[d.dvvc_ma],
                                              )
                                            }
                                          />
                                        </th>
                                        <th className={TH}>Mã đơn</th>
                                        <th className={TH}>Ngày lập</th>
                                        <th className={`${TH} text-right`}>
                                          Voucher ship
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                      {(chiTietNo[d.dvvc_ma] || []).map(
                                        (don) => (
                                          <tr
                                            key={don.dts_ma}
                                            className="hover:bg-slate-50"
                                          >
                                            {/* 🟢 Checkbox từng đơn */}
                                            <td className={`${TD} text-center`}>
                                              <input
                                                type="checkbox"
                                                className="h-4 w-4 cursor-pointer accent-indigo-600"
                                                checked={(
                                                  selectedOrders[d.dvvc_ma] ||
                                                  []
                                                ).includes(don.dts_ma)}
                                                onChange={() =>
                                                  toggleOrder(
                                                    d.dvvc_ma,
                                                    don.dts_ma,
                                                  )
                                                }
                                              />
                                            </td>
                                            <td
                                              className={`${TD} font-mono font-semibold text-indigo-600`}
                                            >
                                              {don.dts_ma}
                                            </td>
                                            <td
                                              className={`${TD} text-slate-500`}
                                            >
                                              {fmtDate(don.dts_ngaylap)}
                                            </td>
                                            <td
                                              className={`${TD} text-right font-semibold text-emerald-700`}
                                            >
                                              {money(don.tien_ship)}
                                            </td>
                                          </tr>
                                        ),
                                      )}
                                    </tbody>
                                  </table>
                                </div>
                              )}
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
        </SectionCard>
      )}

      {tab === "lich-su" && (
        <SectionCard
          title="Lịch sử chi trả ĐVVC"
          subtitle={`Bấm vào dòng để xem chi tiết phiếu và mã QR · ${kyLabel}`}
        >
          {phieuLoading ? (
            <p className="py-10 text-center text-sm text-slate-500">
              Đang tải lịch sử...
            </p>
          ) : phieu.rows.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[880px] border-collapse">
                <thead className="border-b border-slate-200 bg-slate-50">
                  <tr>
                    <th className={TH}>Mã phiếu</th>
                    <th className={TH}>ĐVVC</th>
                    <th className={TH}>Ngày hoàn tất</th>
                    <th className={`${TH} text-right`}>Số đơn</th>
                    <th className={`${TH} text-right`}>Số tiền</th>
                    <th className={TH}>Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {phieu.rows.map((p) => (
                    <tr
                      key={p.pcd_ma}
                      onClick={() => openDetail(p.pcd_ma)}
                      className="cursor-pointer hover:bg-sky-50/60"
                    >
                      <td
                        className={`${TD} font-mono font-semibold text-indigo-600`}
                      >
                        {p.pcd_ma}
                      </td>
                      <td className={TD}>{p.dvvc_ten}</td>
                      <td className={`${TD} text-slate-500`}>
                        {fmtDate(p.pcd_ngay_hoan_tat || p.pcd_ngay_tao)}
                      </td>
                      <td className={`${TD} text-right`}>{p.so_don}</td>
                      <td
                        className={`${TD} text-right font-semibold text-rose-600`}
                      >
                        {money(p.pcd_tong_tien)}
                      </td>
                      <td className={TD}>
                        <ChiBadge status={p.pcd_trang_thai} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <Pager
            page={phieu.page}
            totalPages={phieu.total_pages}
            total={phieu.total}
            onChange={setPage}
          />
        </SectionCard>
      )}

      <ChiTietPhieuDVVCDrawer
        open={detail.open}
        loading={detail.loading}
        data={detail.data}
        onClose={() => setDetail({ open: false, loading: false, data: null })}
      />

      {showQR && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-2xl">
            <div className="mb-4 flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-lg font-bold text-slate-900">
                Quét QR thanh toán
              </h3>
              <div className="flex items-center gap-2">
                <div
                  className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-sm font-bold ${
                    timeLeft <= 60
                      ? "animate-pulse bg-rose-100 text-rose-600"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">
                    timer
                  </span>
                  {formatTime(timeLeft)}
                </div>
                <button
                  type="button"
                  onClick={() => handleHuyPhieu(showQR.pcd_ma)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-rose-600"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    close
                  </span>
                </button>
              </div>
            </div>

            {showQR.thongTinNganHang?.so_tai_khoan ? (
              <>
                <img
                  src={buildVietQrUrl(
                    showQR.thongTinNganHang,
                    showQR.tong_tien,
                    showQR.pcd_ma,
                  )}
                  alt="QR thanh toán"
                  className="mx-auto mb-3 h-64 w-64 rounded-xl border border-slate-200 bg-white object-contain"
                />
                <div className="mb-3 rounded-xl bg-slate-50 px-3 py-2 text-left text-xs text-slate-600">
                  <p>
                    <span className="text-slate-400">Ngân hàng: </span>
                    {showQR.thongTinNganHang.ten_ngan_hang}
                  </p>
                  <p>
                    <span className="text-slate-400">Số TK: </span>
                    {showQR.thongTinNganHang.so_tai_khoan}
                  </p>
                  <p>
                    <span className="text-slate-400">Chủ TK: </span>
                    {showQR.thongTinNganHang.ten_tai_khoan || "—"}
                  </p>
                </div>
              </>
            ) : (
              <div className="mx-auto mb-4 flex h-64 w-64 flex-col items-center justify-center rounded-xl border border-rose-200 bg-rose-50 px-4 text-center text-sm text-rose-600">
                <span className="material-symbols-outlined mb-2 text-4xl">
                  warning
                </span>
                ĐVVC này chưa cấu hình số tài khoản ngân hàng!
              </div>
            )}

            <p className="mb-1 text-2xl font-bold text-rose-600">
              {money(showQR.tong_tien)}
            </p>
            <p className="mb-5 text-sm text-slate-500">
              Nội dung:{" "}
              <strong className="font-mono text-base text-indigo-600">
                {showQR.pcd_ma}
              </strong>
            </p>

            <div className="mb-4 flex items-center justify-center gap-2 rounded-lg bg-sky-50 py-2 text-sky-700">
              <span className="material-symbols-outlined animate-spin text-[18px]">
                sync
              </span>
              <p className="text-sm font-medium">Đang chờ tiền về...</p>
            </div>

            <button
              type="button"
              onClick={() => handleHuyPhieu(showQR.pcd_ma)}
              className="w-full rounded-xl bg-slate-900 py-3 font-bold text-white transition-colors hover:bg-slate-800"
            >
              Đóng & hủy phiếu
            </button>
          </div>
        </div>
      )}

      <ToastNotification toast={toast} />
    </div>
  );
};

export default ThanhToanVanChuyen;
