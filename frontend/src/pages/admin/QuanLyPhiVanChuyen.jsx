// frontend/src/pages/admin/QuanLyPhiVanChuyen.jsx
// Trang VẬN CHUYỂN & DÒNG TIỀN KHO, gồm 2 tab lớn:
//  - Tab "Dòng tiền kho": doanh thu kho, tiền vào COD, trả shop/sàn, phiếu tất toán.
//  - Tab "Phí vận chuyển": phí ship trước voucher, sàn bù, đã chi / chờ chi ĐVVC.
import { useCallback, useEffect, useMemo, useState } from "react";
import dongTienService from "../../services/san/dongTienService";
import phiVanChuyenService from "../../services/san/phiVanChuyenService";
import ToastNotification from "../../components/common/Crud/ToastNotification";
import {
  INPUT,
  money,
  fmtDate,
  KpiCard,
  SectionCard,
  EmptyState,
  StatusBadge,
  TabBar,
  ViewToggle,
  NoteBox,
  Pager,
} from "../../components/admin/dongtien/DongTienUI";
import {
  FilterBarVC,
  ChiBadge,
  PagerVC,
} from "../../components/admin/vanchuyen/VanChuyenUI";
import PhieuChiTietDrawer from "../../components/admin/dongtien/PhieuChiTietDrawer";

const NAM_HIEN_TAI = new Date().getFullYear();

const TH =
  "whitespace-nowrap px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500";
const TD = "px-3 py-2.5 text-sm text-slate-700";

const TABS = [
  { key: "kho", label: "Dòng tiền kho" },
  { key: "phi", label: "Phí vận chuyển" },
];

const KHO_VIEWS = [
  { id: "theo-kho", label: "Theo kho", icon: "warehouse" },
  { id: "theo-thang", label: "Theo tháng", icon: "calendar_month" },
  { id: "theo-nam", label: "Theo năm", icon: "event_note" },
  { id: "giao-dich", label: "Giao dịch", icon: "receipt_long" },
];

const PHI_VIEWS = [
  { id: "dvvc", label: "Theo ĐVVC", icon: "local_shipping" },
  { id: "don-hang", label: "Theo đơn hàng", icon: "receipt_long" },
];

const KHO_PAGE_SIZES = [10, 20, 50];

const ZERO_KHO = {
  so_don_ship: 0,
  tien_vao: 0,
  tra_shop: 0,
  tra_san: 0,
  ship_khach_tra: 0,
  ship_san_bu: 0,
  doanh_thu_kho: 0,
};

const congKho = (rows) =>
  rows.reduce(
    (a, k) => ({
      so_don_ship: a.so_don_ship + (Number(k.so_don_ship) || 0),
      tien_vao: a.tien_vao + (Number(k.tien_vao) || 0),
      tra_shop: a.tra_shop + (Number(k.tra_shop) || 0),
      tra_san: a.tra_san + (Number(k.tra_san) || 0),
      ship_khach_tra: a.ship_khach_tra + (Number(k.ship_khach_tra) || 0),
      ship_san_bu: a.ship_san_bu + (Number(k.ship_san_bu) || 0),
      doanh_thu_kho: a.doanh_thu_kho + (Number(k.doanh_thu_kho) || 0),
    }),
    { ...ZERO_KHO },
  );

const ZERO_KY = {
  tien_vao: 0,
  tra_shop: 0,
  tra_san: 0,
  chi_dvvc: 0,
  ship_khach_tra: 0,
  ship_san_bu: 0,
  doanh_thu_kho: 0,
};

const congKy = (rows) =>
  rows.reduce(
    (a, t) => ({
      tien_vao: a.tien_vao + (Number(t.tien_vao) || 0),
      tra_shop: a.tra_shop + (Number(t.tra_shop) || 0),
      tra_san: a.tra_san + (Number(t.tra_san) || 0),
      chi_dvvc: a.chi_dvvc + (Number(t.chi_dvvc) || 0),
      ship_khach_tra: a.ship_khach_tra + (Number(t.ship_khach_tra) || 0),
      ship_san_bu: a.ship_san_bu + (Number(t.ship_san_bu) || 0),
      doanh_thu_kho: a.doanh_thu_kho + (Number(t.doanh_thu_kho) || 0),
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

const QuanLyPhiVanChuyen = () => {
  const [tab, setTab] = useState("kho");

  const [danhMuc, setDanhMuc] = useState({
    kho: [],
    dvvc: [],
    nam: [NAM_HIEN_TAI],
  });
  const [filters, setFilters] = useState({
    kho_ma: "",
    dvvc_ma: "",
    nam: String(NAM_HIEN_TAI),
    thang: "",
  });

  // ===== Tab Dòng tiền kho =====
  const [khoView, setKhoView] = useState("theo-kho");
  const [khoPage, setKhoPage] = useState(1);
  const [khoPageSize, setKhoPageSize] = useState(10);
  const [dongTien, setDongTien] = useState(null);
  const [dtLoading, setDtLoading] = useState(false);
  const [dtTx, setDtTx] = useState({
    trang_thai: "",
    q: "",
    page: 1,
    limit: 10,
  });
  const [dtQInput, setDtQInput] = useState("");
  const [dtGiaoDich, setDtGiaoDich] = useState({
    rows: [],
    total: 0,
    page: 1,
    total_pages: 1,
  });
  const [dtTxLoading, setDtTxLoading] = useState(false);
  const [dtDetail, setDtDetail] = useState({
    open: false,
    loading: false,
    data: null,
  });

  // ===== Tab Phí vận chuyển =====
  const [phiView, setPhiView] = useState("dvvc");
  const [tongQuan, setTongQuan] = useState(null);
  const [phiLoading, setPhiLoading] = useState(false);
  const [list, setList] = useState({
    rows: [],
    total: 0,
    page: 1,
    total_pages: 1,
  });
  const [listLoading, setListLoading] = useState(false);
  const [listFilter, setListFilter] = useState({ q: "", page: 1, limit: 10 });
  const [qInput, setQInput] = useState("");

  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });
  const showToast = useCallback((message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast((p) => ({ ...p, show: false })), 3000);
  }, []);

  // ---- Danh mục: gộp kho/năm của 2 nguồn + ĐVVC ----
  useEffect(() => {
    let alive = true;
    Promise.all([
      dongTienService.getDanhMuc(),
      phiVanChuyenService.getDanhMuc(),
    ])
      .then(([a, b]) => {
        if (!alive) return;
        const khoMap = new Map();
        [...(a.data.kho || []), ...(b.data.kho || [])].forEach((k) =>
          khoMap.set(k.kho_ma, k),
        );
        const nam = Array.from(
          new Set([...(a.data.nam || []), ...(b.data.nam || [])]),
        )
          .map(Number)
          .filter((n) => n > 0)
          .sort((x, y) => y - x);

        setDanhMuc({
          kho: Array.from(khoMap.values()).sort((x, y) =>
            String(x.kho_ten).localeCompare(String(y.kho_ten), "vi"),
          ),
          dvvc: b.data.dvvc || [],
          nam: nam.length ? nam : [NAM_HIEN_TAI],
        });
      })
      .catch(() => showToast("Không tải được danh mục kho/ĐVVC/năm", "error"));
    return () => {
      alive = false;
    };
  }, [showToast]);

  // ---- Dòng tiền kho: tổng quan ----
  const loadDongTien = useCallback(async () => {
    if (tab !== "kho") return;
    setDtLoading(true);
    try {
      const res = await dongTienService.getTongQuan({
        kho_ma: filters.kho_ma || undefined,
        nam: filters.nam,
        thang: filters.thang || undefined,
      });
      setDongTien(res.data);
    } catch (e) {
      showToast(e.response?.data?.message || "Lỗi tải dòng tiền kho", "error");
    } finally {
      setDtLoading(false);
    }
  }, [tab, filters.kho_ma, filters.nam, filters.thang, showToast]);

  // ---- Dòng tiền kho: danh sách phiếu tất toán ----
  const loadDtGiaoDich = useCallback(async () => {
    if (tab !== "kho" || khoView !== "giao-dich") return;
    setDtTxLoading(true);
    try {
      const res = await dongTienService.getGiaoDich({
        kho_ma: filters.kho_ma || undefined,
        nam: filters.nam,
        thang: filters.thang || undefined,
        trang_thai: dtTx.trang_thai || undefined,
        q: dtTx.q || undefined,
        page: dtTx.page,
        limit: dtTx.limit,
      });
      setDtGiaoDich(res.data);
    } catch (e) {
      showToast(
        e.response?.data?.message || "Lỗi tải danh sách phiếu tất toán",
        "error",
      );
    } finally {
      setDtTxLoading(false);
    }
  }, [
    tab,
    khoView,
    filters.kho_ma,
    filters.nam,
    filters.thang,
    dtTx,
    showToast,
  ]);

  // ---- Phí vận chuyển: tổng quan ----
  const loadPhiTongQuan = useCallback(async () => {
    if (tab !== "phi") return;
    setPhiLoading(true);
    try {
      const res = await phiVanChuyenService.getTongQuan({
        kho_ma: filters.kho_ma || undefined,
        dvvc_ma: filters.dvvc_ma || undefined,
        nam: filters.nam,
        thang: filters.thang || undefined,
      });
      setTongQuan(res.data);
    } catch (e) {
      showToast(
        e.response?.data?.message || "Lỗi tải tổng quan phí vận chuyển",
        "error",
      );
    } finally {
      setPhiLoading(false);
    }
  }, [
    tab,
    filters.kho_ma,
    filters.dvvc_ma,
    filters.nam,
    filters.thang,
    showToast,
  ]);

  // ---- Phí vận chuyển: danh sách đơn ----
  const loadPhiDanhSach = useCallback(async () => {
    if (tab !== "phi" || phiView !== "don-hang") return;
    setListLoading(true);
    try {
      const res = await phiVanChuyenService.getDanhSach({
        kho_ma: filters.kho_ma || undefined,
        dvvc_ma: filters.dvvc_ma || undefined,
        nam: filters.nam,
        thang: filters.thang || undefined,
        q: listFilter.q || undefined,
        page: listFilter.page,
        limit: listFilter.limit,
      });
      setList(res.data);
    } catch (e) {
      showToast(
        e.response?.data?.message || "Lỗi tải danh sách đơn hàng",
        "error",
      );
    } finally {
      setListLoading(false);
    }
  }, [
    tab,
    phiView,
    filters.kho_ma,
    filters.dvvc_ma,
    filters.nam,
    filters.thang,
    listFilter,
    showToast,
  ]);

  useEffect(() => {
    loadDongTien();
  }, [loadDongTien]);

  useEffect(() => {
    loadDtGiaoDich();
  }, [loadDtGiaoDich]);

  useEffect(() => {
    loadPhiTongQuan();
  }, [loadPhiTongQuan]);

  useEffect(() => {
    loadPhiDanhSach();
  }, [loadPhiDanhSach]);

  // ---- Đổi tab / đổi bộ lọc ----
  const changeTab = (next) => {
    if (next === tab) return;
    setTab(next);
    setKhoPage(1);
    setDtTx({ trang_thai: "", q: "", page: 1, limit: 10 });
    setDtQInput("");
    setListFilter({ q: "", page: 1, limit: 10 });
    setQInput("");
  };

  const handleFilterChange = (next) => {
    setFilters(next);
    setKhoPage(1);
    setDtTx((p) => ({ ...p, q: "", page: 1 }));
    setDtQInput("");
    setListFilter({ q: "", page: 1, limit: 10 });
    setQInput("");
  };

  const changeKhoView = (mode) => {
    if (mode === khoView) return;
    setKhoView(mode);
    setDtTx({ trang_thai: "", q: "", page: 1, limit: 10 });
    setDtQInput("");
  };

  const changePhiView = (mode) => {
    if (mode === phiView) return;
    setPhiView(mode);
    setListFilter({ q: "", page: 1, limit: 10 });
    setQInput("");
  };

  const applySearch = () => {
    setListFilter((p) => ({ ...p, q: qInput.trim(), page: 1 }));
  };

  const openDetail = async (ptt_ma) => {
    setDtDetail({ open: true, loading: true, data: null });
    try {
      const res = await dongTienService.getPhieuChiTiet(ptt_ma);
      setDtDetail({ open: true, loading: false, data: res.data });
    } catch {
      setDtDetail({ open: true, loading: false, data: null });
      showToast("Không tải được chi tiết phiếu", "error");
    }
  };

  const reloadKho = () => {
    loadDongTien();
    if (khoView === "giao-dich") loadDtGiaoDich();
  };

  const reloadPhi = () => {
    loadPhiTongQuan();
    if (phiView === "don-hang") loadPhiDanhSach();
  };

  // ---- Dữ liệu dẫn xuất: Dòng tiền kho ----
  const dtKpi = dongTien?.kpi || {};
  const dtTheoKho = dongTien?.theo_kho || [];
  const dtTheoThang = dongTien?.theo_thang || [];
  const dtTheoNam = dongTien?.theo_nam || [];

  const tongDtKhoAll = useMemo(() => congKho(dtTheoKho), [dtTheoKho]);
  const tongDtThang = useMemo(() => congKy(dtTheoThang), [dtTheoThang]);
  const tongDtNam = useMemo(() => congKy(dtTheoNam), [dtTheoNam]);

  const totalKhoPages = Math.max(1, Math.ceil(dtTheoKho.length / khoPageSize));
  const khoPageSafe = Math.min(khoPage, totalKhoPages);
  const dtTheoKhoTrang = useMemo(() => {
    const start = (khoPageSafe - 1) * khoPageSize;
    return dtTheoKho.slice(start, start + khoPageSize);
  }, [dtTheoKho, khoPageSafe, khoPageSize]);
  const tongDtKhoTrang = useMemo(
    () => congKho(dtTheoKhoTrang),
    [dtTheoKhoTrang],
  );

  const startIdx =
    dtTheoKho.length === 0 ? 0 : (khoPageSafe - 1) * khoPageSize + 1;
  const endIdx = Math.min(khoPageSafe * khoPageSize, dtTheoKho.length);

  const khoKpiCards = useMemo(
    () => [
      {
        icon: "savings",
        label: "Doanh thu kho",
        value: money(dtKpi.doanh_thu_kho),
        tone: "emerald",
        hint: `Ship khách trả ${money(dtKpi.ship_khach_tra)} · Ship sàn chi ${money(dtKpi.ship_san_bu)}`,
      },
      {
        icon: "account_balance_wallet",
        label: "Tiền vào kho (COD)",
        value: money(dtKpi.tien_vao),
        tone: "blue",
        hint: "Shipper đã nộp tiền",
      },
      {
        icon: "storefront",
        label: "Đã trả shop",
        value: money(dtKpi.tra_shop),
        tone: "indigo",
        hint: "Chỉ tính phiếu đã thu đủ",
      },
      {
        icon: "percent",
        label: "Đã trả phí sàn",
        value: money(dtKpi.tra_san),
        tone: "amber",
        hint: "Phí sàn kho đã nộp cho sàn",
      },
      {
        icon: "receipt_long",
        label: "Số phiếu tất toán",
        value: String(dtKpi.so_phieu ?? 0),
        tone: "slate",
      },
      {
        icon: "shopping_bag",
        label: "Số đơn trong phiếu",
        value: String(dtKpi.so_don_tt ?? 0),
        tone: "slate",
      },
    ],
    [dtKpi],
  );

  // ---- Dữ liệu dẫn xuất: Phí vận chuyển ----
  const phiKpi = tongQuan?.kpi || {};
  const theoDvvc = tongQuan?.theo_dvvc || [];
  const khoTenDangChon =
    (danhMuc.kho || []).find((k) => k.kho_ma === filters.kho_ma)?.kho_ten || "";
  const dvvcTenDangChon =
    (danhMuc.dvvc || []).find((d) => d.dvvc_ma === filters.dvvc_ma)?.dvvc_ten ||
    "";

  const phiKpiCards = useMemo(
    () => [
      {
        icon: "local_shipping",
        label: "Tổng phí ship trước voucher",
        value: money(phiKpi.phi_goc),
        tone: "blue",
        hint: `Theo ngày lập đơn · ${phiKpi.so_don ?? 0} đơn`,
      },
      {
        icon: "percent",
        label: "Sàn bù voucher ship",
        value: money(phiKpi.san_bu),
        tone: "amber",
        hint: `${phiKpi.so_don_san_bu ?? 0} đơn có sàn bù`,
      },
      {
        icon: "account_balance_wallet",
        label: "Khách trả phí ship (sau voucher)",
        value: money(phiKpi.khach_tra),
        tone: "indigo",
        hint: "Phí gốc − sàn bù",
      },
      {
        icon: "payments",
        label: "Đã chi cho ĐVVC",
        value: money(phiKpi.da_chi),
        tone: "emerald",
        hint: `${phiKpi.so_don_da_chi ?? 0} đơn đã chi`,
      },
      {
        icon: "pending_actions",
        label: "Chờ chi",
        value: money(phiKpi.cho_chi),
        tone: "red",
        hint: `${phiKpi.so_don_cho_chi ?? 0} đơn chờ chi`,
      },
      {
        icon: "inventory_2",
        label: "Số đơn trong kỳ",
        value: String(phiKpi.so_don ?? 0),
        tone: "slate",
        hint: `${phiKpi.so_don_khong_gg ?? 0} đơn không giảm giá`,
      },
    ],
    [phiKpi],
  );

  const tongPhi = useMemo(
    () =>
      theoDvvc.reduce(
        (acc, d) => ({
          so_don: acc.so_don + (Number(d.so_don) || 0),
          phi_goc: acc.phi_goc + (Number(d.phi_goc) || 0),
          san_bu: acc.san_bu + (Number(d.san_bu) || 0),
          khach_tra: acc.khach_tra + (Number(d.khach_tra) || 0),
          da_chi: acc.da_chi + (Number(d.da_chi) || 0),
          cho_chi: acc.cho_chi + (Number(d.cho_chi) || 0),
        }),
        {
          so_don: 0,
          phi_goc: 0,
          san_bu: 0,
          khach_tra: 0,
          da_chi: 0,
          cho_chi: 0,
        },
      ),
    [theoDvvc],
  );

  const phamViText = `${khoTenDangChon || "Tất cả kho"} · ${
    dvvcTenDangChon || "Tất cả ĐVVC"
  } · Năm ${filters.nam}${filters.thang ? ` · tháng ${filters.thang}` : ""}`;

  // ---- Xuất CSV theo đúng bảng đang xem ----
  const exportCsv = () => {
    const suffix = `${filters.nam}${filters.thang ? `-T${filters.thang}` : ""}`;

    if (tab === "kho") {
      if (khoView === "theo-kho") {
        if (dtTheoKho.length === 0)
          return showToast("Không có dữ liệu để xuất", "error");
        downloadCsv(
          `dong-tien-kho-${suffix}`,
          [
            "Mã kho",
            "Tên kho",
            "Số đơn",
            "Tiền vào (COD)",
            "Trả shop",
            "Trả sàn",
            "Ship khách trả",
            "Ship sàn chi",
            "Tổng tiền ship",
            "% doanh thu",
          ],
          dtTheoKho.map((k) => [
            k.kho_ma,
            k.kho_ten,
            k.so_don_ship,
            k.tien_vao,
            k.tra_shop,
            k.tra_san,
            k.ship_khach_tra,
            k.ship_san_bu,
            k.doanh_thu_kho,
            pct(k.doanh_thu_kho, tongDtKhoAll.doanh_thu_kho),
          ]),
        );
      } else if (khoView === "theo-thang" || khoView === "theo-nam") {
        const laThang = khoView === "theo-thang";
        const rowsData = laThang ? dtTheoThang : dtTheoNam;
        if (rowsData.length === 0)
          return showToast("Không có dữ liệu để xuất", "error");
        downloadCsv(
          laThang
            ? `dong-tien-theo-thang-${filters.nam}`
            : "dong-tien-theo-nam",
          [
            laThang ? "Tháng" : "Năm",
            "Tiền vào",
            "Trả shop",
            "Trả sàn",
            "Chi ĐVVC",
            "Ship khách trả",
            "Ship sàn chi",
            "Tổng tiền ship",
          ],
          rowsData.map((t) => [
            laThang ? t.thang : t.nam,
            t.tien_vao,
            t.tra_shop,
            t.tra_san,
            t.chi_dvvc,
            t.ship_khach_tra,
            t.ship_san_bu,
            t.doanh_thu_kho,
          ]),
        );
      } else {
        if (dtGiaoDich.rows.length === 0)
          return showToast("Không có giao dịch để xuất", "error");
        downloadCsv(
          `giao-dich-tat-toan-${suffix}`,
          [
            "Mã phiếu",
            "Kho",
            "Ngày tạo",
            "Hoàn tất",
            "Số đơn",
            "Phí sàn",
            "Tiền shop",
            "Ship khách trả",
            "Ship sàn chi",
            "Tổng tiền ship",
            "Trạng thái",
          ],
          dtGiaoDich.rows.map((r) => [
            r.ptt_ma,
            r.kho_ten,
            fmtDate(r.ptt_ngay_tat_toan),
            fmtDate(r.ptt_thoi_diem_hoan_tat),
            r.so_don,
            r.ptt_tong_tien_san,
            r.ptt_tong_tien_shop,
            r.ship_khach_tra,
            r.ship_san_bu,
            r.doanh_thu_kho,
            r.ptt_trang_thai_thanh_toan,
          ]),
        );
      }
    } else if (phiView === "don-hang") {
      if (list.rows.length === 0)
        return showToast("Không có đơn hàng để xuất", "error");
      downloadCsv(
        `phi-van-chuyen-don-hang-${suffix}`,
        [
          "Mã đơn",
          "Kho",
          "ĐVVC",
          "Ngày lập",
          "Phí trước voucher",
          "Sàn bù",
          "Khách trả",
          "Mã phiếu",
          "Trạng thái",
        ],
        list.rows.map((r) => [
          r.dts_ma,
          r.kho_ten || "",
          r.dvvc_ten,
          fmtDate(r.dts_ngaylap),
          r.phi_ship_goc,
          r.voucher_ship,
          r.khach_tra,
          r.pcd_ma || "",
          r.trang_thai,
        ]),
      );
    } else {
      if (theoDvvc.length === 0)
        return showToast("Không có dữ liệu để xuất", "error");
      downloadCsv(
        `phi-van-chuyen-theo-dvvc-${suffix}`,
        [
          "Mã ĐVVC",
          "ĐVVC",
          "Số đơn",
          "Phí trước voucher",
          "Sàn bù",
          "Khách trả",
          "Đã chi",
          "Chờ chi",
        ],
        theoDvvc.map((d) => [
          d.dvvc_ma,
          d.dvvc_ten,
          d.so_don,
          d.phi_goc,
          d.san_bu,
          d.khach_tra,
          d.da_chi,
          d.cho_chi,
        ]),
      );
    }

    showToast("Đã xuất file CSV");
  };

  // ---- Ô tìm kiếm gắn trong thanh lọc ----
  const dtSearchBox =
    tab === "kho" && khoView === "giao-dich" ? (
      <label className="flex min-w-[240px] flex-col gap-1">
        <span className="text-xs font-medium text-slate-500">Tìm kiếm</span>
        <div className="flex items-center gap-2">
          <input
            className={`${INPUT} flex-1`}
            value={dtQInput}
            placeholder="Mã phiếu hoặc tên kho"
            onChange={(e) => setDtQInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter")
                setDtTx((p) => ({ ...p, q: dtQInput.trim(), page: 1 }));
            }}
          />
          <button
            type="button"
            onClick={() =>
              setDtTx((p) => ({ ...p, q: dtQInput.trim(), page: 1 }))
            }
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

  const phiSearchBox =
    tab === "phi" && phiView === "don-hang" ? (
      <label className="flex min-w-[240px] flex-col gap-1">
        <span className="text-xs font-medium text-slate-500">Tìm kiếm</span>
        <div className="flex items-center gap-2">
          <input
            className={`${INPUT} flex-1`}
            value={qInput}
            placeholder="Mã đơn, ĐVVC hoặc kho"
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

  const busyKho = dtLoading || (khoView === "giao-dich" && dtTxLoading);
  const busyPhi = phiLoading || (phiView === "don-hang" && listLoading);

  return (
    <div className="min-h-screen space-y-5 bg-[#F8FAFC] p-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0F172A]">
          Vận chuyển &amp; dòng tiền kho
        </h1>
      </div>

      <TabBar tabs={TABS} active={tab} onChange={changeTab} />

      {tab === "kho" ? (
        <>
          <FilterBarVC
            danhMuc={danhMuc}
            filters={filters}
            onChange={handleFilterChange}
            onReload={reloadKho}
            loading={busyKho}
            onExport={exportCsv}
            showDvvc={false}
            extra={dtSearchBox}
          />

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {khoKpiCards.map((c) => (
              <KpiCard key={c.label} {...c} />
            ))}
          </div>

          <SectionCard
            title={
              khoView === "theo-kho"
                ? "Dòng tiền theo kho"
                : khoView === "theo-thang"
                  ? `Dòng tiền 12 tháng năm ${filters.nam}`
                  : khoView === "theo-nam"
                    ? "Dòng tiền theo năm"
                    : "Danh sách phiếu tất toán"
            }
            subtitle={
              khoView === "giao-dich"
                ? "Bấm vào dòng để xem chi tiết đơn hàng và mã QR"
                : "Doanh thu kho = ship khách trả + ship sàn chi · tính theo ngày lập đơn, bỏ đơn hủy"
            }
            action={
              <ViewToggle
                views={KHO_VIEWS}
                active={khoView}
                onChange={changeKhoView}
              />
            }
          >
            {khoView === "theo-kho" && (
              <>
                {dtLoading ? (
                  <p className="py-10 text-center text-sm text-slate-500">
                    Đang tải dòng tiền theo kho...
                  </p>
                ) : dtTheoKho.length === 0 ? (
                  <EmptyState />
                ) : (
                  <>
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                      <p className="text-xs text-slate-500">
                        Đang xem{" "}
                        <strong className="text-slate-700">
                          {startIdx}–{endIdx}
                        </strong>{" "}
                        /{" "}
                        <strong className="text-slate-700">
                          {dtTheoKho.length}
                        </strong>{" "}
                        kho có phát sinh · sắp xếp theo doanh thu kho giảm dần
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
                      <table className="w-full min-w-[1180px] border-collapse">
                        <thead className="border-b border-slate-200 bg-slate-50">
                          <tr>
                            <th className={TH}>Kho</th>
                            <th className={`${TH} text-right`}>Số đơn</th>
                            <th className={`${TH} text-right`}>
                              Tiền vào (COD)
                            </th>
                            <th className={`${TH} text-right`}>Trả shop</th>
                            <th className={`${TH} text-right`}>Trả sàn</th>
                            <th className={`${TH} text-right`}>
                              Ship khách trả
                            </th>
                            <th className={`${TH} text-right`}>Ship sàn chi</th>
                            <th className={`${TH} text-right`}>
                              Tổng tiền ship
                            </th>
                            <th className={`${TH} text-right`}>% doanh thu</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {dtTheoKhoTrang.map((k) => (
                            <tr key={k.kho_ma} className="hover:bg-slate-50/70">
                              <td
                                className={`${TD} font-medium ${
                                  k.kho_ma === "__KHONG_XAC_DINH__"
                                    ? "italic text-slate-500"
                                    : ""
                                }`}
                              >
                                {k.kho_ten}
                              </td>
                              <td className={`${TD} text-right`}>
                                {k.so_don_ship}
                              </td>
                              <td className={`${TD} text-right text-sky-700`}>
                                {money(k.tien_vao)}
                              </td>
                              <td
                                className={`${TD} text-right text-indigo-700`}
                              >
                                {money(k.tra_shop)}
                              </td>
                              <td className={`${TD} text-right text-amber-700`}>
                                {money(k.tra_san)}
                              </td>
                              <td className={`${TD} text-right text-sky-700`}>
                                {money(k.ship_khach_tra)}
                              </td>
                              <td className={`${TD} text-right text-amber-700`}>
                                {money(k.ship_san_bu)}
                              </td>
                              <td
                                className={`${TD} text-right font-semibold ${
                                  k.doanh_thu_kho < 0
                                    ? "text-rose-600"
                                    : "text-emerald-700"
                                }`}
                              >
                                {money(k.doanh_thu_kho)}
                              </td>
                              <td className={`${TD} text-right text-slate-500`}>
                                {pct(
                                  k.doanh_thu_kho,
                                  tongDtKhoAll.doanh_thu_kho,
                                )}
                                %
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="border-t-2 border-slate-200 bg-slate-50 font-semibold">
                          <tr className="border-b border-slate-200">
                            <td className={TD}>
                              Trang này ({dtTheoKhoTrang.length} kho)
                            </td>
                            <td className={`${TD} text-right`}>
                              {tongDtKhoTrang.so_don_ship}
                            </td>
                            <td className={`${TD} text-right text-sky-700`}>
                              {money(tongDtKhoTrang.tien_vao)}
                            </td>
                            <td className={`${TD} text-right text-indigo-700`}>
                              {money(tongDtKhoTrang.tra_shop)}
                            </td>
                            <td className={`${TD} text-right text-amber-700`}>
                              {money(tongDtKhoTrang.tra_san)}
                            </td>
                            <td className={`${TD} text-right text-sky-700`}>
                              {money(tongDtKhoTrang.ship_khach_tra)}
                            </td>
                            <td className={`${TD} text-right text-amber-700`}>
                              {money(tongDtKhoTrang.ship_san_bu)}
                            </td>
                            <td
                              className={`${TD} text-right ${
                                tongDtKhoTrang.doanh_thu_kho < 0
                                  ? "text-rose-600"
                                  : "text-emerald-700"
                              }`}
                            >
                              {money(tongDtKhoTrang.doanh_thu_kho)}
                            </td>
                            <td className={`${TD} text-right text-slate-500`}>
                              {pct(
                                tongDtKhoTrang.doanh_thu_kho,
                                tongDtKhoAll.doanh_thu_kho,
                              )}
                              %
                            </td>
                          </tr>
                          <tr>
                            <td className={TD}>
                              Tất cả ({dtTheoKho.length} kho)
                            </td>
                            <td className={`${TD} text-right`}>
                              {tongDtKhoAll.so_don_ship}
                            </td>
                            <td className={`${TD} text-right text-sky-700`}>
                              {money(tongDtKhoAll.tien_vao)}
                            </td>
                            <td className={`${TD} text-right text-indigo-700`}>
                              {money(tongDtKhoAll.tra_shop)}
                            </td>
                            <td className={`${TD} text-right text-amber-700`}>
                              {money(tongDtKhoAll.tra_san)}
                            </td>
                            <td className={`${TD} text-right text-sky-700`}>
                              {money(tongDtKhoAll.ship_khach_tra)}
                            </td>
                            <td className={`${TD} text-right text-amber-700`}>
                              {money(tongDtKhoAll.ship_san_bu)}
                            </td>
                            <td
                              className={`${TD} text-right ${
                                tongDtKhoAll.doanh_thu_kho < 0
                                  ? "text-rose-600"
                                  : "text-emerald-700"
                              }`}
                            >
                              {money(tongDtKhoAll.doanh_thu_kho)}
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
                      total={dtTheoKho.length}
                      unit="kho"
                      onChange={setKhoPage}
                    />
                  </>
                )}
              </>
            )}

            {(khoView === "theo-thang" || khoView === "theo-nam") && (
              <>
                {dtLoading ? (
                  <p className="py-10 text-center text-sm text-slate-500">
                    Đang tải dòng tiền...
                  </p>
                ) : (khoView === "theo-thang" ? dtTheoThang : dtTheoNam)
                    .length === 0 ? (
                  <EmptyState />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[1040px] border-collapse">
                      <thead className="border-b border-slate-200 bg-slate-50">
                        <tr>
                          <th className={TH}>
                            {khoView === "theo-thang" ? "Tháng" : "Năm"}
                          </th>
                          <th className={`${TH} text-right`}>Tiền vào</th>
                          <th className={`${TH} text-right`}>Trả shop</th>
                          <th className={`${TH} text-right`}>Trả sàn</th>
                          <th className={`${TH} text-right`}>Chi ĐVVC</th>
                          <th className={`${TH} text-right`}>Ship khách trả</th>
                          <th className={`${TH} text-right`}>Ship sàn chi</th>
                          <th className={`${TH} text-right`}>Tổng tiền ship</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {(khoView === "theo-thang"
                          ? dtTheoThang
                          : dtTheoNam
                        ).map((t) => (
                          <tr
                            key={khoView === "theo-thang" ? t.thang : t.nam}
                            className="hover:bg-slate-50/70"
                          >
                            <td className={`${TD} font-medium`}>
                              {khoView === "theo-thang"
                                ? `Tháng ${t.thang}`
                                : `Năm ${t.nam}`}
                            </td>
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
                            <td className={`${TD} text-right text-sky-700`}>
                              {money(t.ship_khach_tra)}
                            </td>
                            <td className={`${TD} text-right text-amber-700`}>
                              {money(t.ship_san_bu)}
                            </td>
                            <td
                              className={`${TD} text-right font-semibold ${
                                t.doanh_thu_kho < 0
                                  ? "text-rose-600"
                                  : "text-emerald-700"
                              }`}
                            >
                              {money(t.doanh_thu_kho)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="border-t-2 border-slate-200 bg-slate-50 font-semibold">
                        <tr>
                          <td className={TD}>
                            {khoView === "theo-thang" ? "Tổng" : "Tổng các năm"}
                          </td>
                          <td className={`${TD} text-right text-sky-700`}>
                            {money(
                              (khoView === "theo-thang"
                                ? tongDtThang
                                : tongDtNam
                              ).tien_vao,
                            )}
                          </td>
                          <td className={`${TD} text-right text-indigo-700`}>
                            {money(
                              (khoView === "theo-thang"
                                ? tongDtThang
                                : tongDtNam
                              ).tra_shop,
                            )}
                          </td>
                          <td className={`${TD} text-right text-amber-700`}>
                            {money(
                              (khoView === "theo-thang"
                                ? tongDtThang
                                : tongDtNam
                              ).tra_san,
                            )}
                          </td>
                          <td className={`${TD} text-right text-rose-600`}>
                            {money(
                              (khoView === "theo-thang"
                                ? tongDtThang
                                : tongDtNam
                              ).chi_dvvc,
                            )}
                          </td>
                          <td className={`${TD} text-right text-sky-700`}>
                            {money(
                              (khoView === "theo-thang"
                                ? tongDtThang
                                : tongDtNam
                              ).ship_khach_tra,
                            )}
                          </td>
                          <td className={`${TD} text-right text-amber-700`}>
                            {money(
                              (khoView === "theo-thang"
                                ? tongDtThang
                                : tongDtNam
                              ).ship_san_bu,
                            )}
                          </td>
                          <td className={`${TD} text-right text-emerald-700`}>
                            {money(
                              (khoView === "theo-thang"
                                ? tongDtThang
                                : tongDtNam
                              ).doanh_thu_kho,
                            )}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </>
            )}

            {khoView === "giao-dich" && (
              <>
                <div className="mb-4 flex flex-wrap items-end gap-3">
                  <label className="flex flex-col gap-1">
                    <span className="text-xs font-medium text-slate-500">
                      Trạng thái
                    </span>
                    <select
                      className={INPUT}
                      value={dtTx.trang_thai}
                      onChange={(e) =>
                        setDtTx((p) => ({
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
                </div>

                {dtTxLoading ? (
                  <p className="py-10 text-center text-sm text-slate-500">
                    Đang tải giao dịch...
                  </p>
                ) : dtGiaoDich.rows.length === 0 ? (
                  <EmptyState />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[1120px] border-collapse">
                      <thead className="border-b border-slate-200 bg-slate-50">
                        <tr>
                          <th className={TH}>Mã phiếu</th>
                          <th className={TH}>Kho</th>
                          <th className={TH}>Ngày tạo</th>
                          <th className={TH}>Hoàn tất</th>
                          <th className={`${TH} text-right`}>Số đơn</th>
                          <th className={`${TH} text-right`}>Phí sàn</th>
                          <th className={`${TH} text-right`}>Tiền shop</th>
                          <th className={`${TH} text-right`}>Ship khách trả</th>
                          <th className={`${TH} text-right`}>Ship sàn chi</th>
                          <th className={`${TH} text-right`}>Tổng tiền ship</th>
                          <th className={TH}>Trạng thái</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {dtGiaoDich.rows.map((r) => (
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
                            <td className={`${TD} text-right text-sky-700`}>
                              {money(r.ship_khach_tra)}
                            </td>
                            <td className={`${TD} text-right text-amber-700`}>
                              {money(r.ship_san_bu)}
                            </td>
                            <td
                              className={`${TD} text-right font-semibold text-emerald-700`}
                            >
                              {money(r.doanh_thu_kho)}
                            </td>
                            <td className={TD}>
                              <StatusBadge
                                status={r.ptt_trang_thai_thanh_toan}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <Pager
                  page={dtGiaoDich.page}
                  totalPages={dtGiaoDich.total_pages}
                  total={dtGiaoDich.total}
                  onChange={(p) => setDtTx((prev) => ({ ...prev, page: p }))}
                />
              </>
            )}
          </SectionCard>
        </>
      ) : (
        <>
          <FilterBarVC
            danhMuc={danhMuc}
            filters={filters}
            onChange={handleFilterChange}
            onReload={reloadPhi}
            loading={busyPhi}
            onExport={exportCsv}
            extra={phiSearchBox}
          />

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {phiKpiCards.map((c) => (
              <KpiCard key={c.label} {...c} />
            ))}
          </div>

          <SectionCard
            title={
              phiView === "dvvc"
                ? "Phí vận chuyển theo ĐVVC"
                : "Thông tin đơn hàng"
            }
            subtitle={`${phamViText} · Phí trước voucher = Khách trả + Sàn bù`}
            action={
              <ViewToggle
                views={PHI_VIEWS}
                active={phiView}
                onChange={changePhiView}
              />
            }
          >
            {phiView === "dvvc" ? (
              <>
                {phiLoading ? (
                  <p className="py-10 text-center text-sm text-slate-500">
                    Đang tải tổng hợp...
                  </p>
                ) : theoDvvc.length === 0 ? (
                  <EmptyState />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[900px] border-collapse">
                      <thead className="border-b border-slate-200 bg-slate-50">
                        <tr>
                          <th className={TH}>ĐVVC</th>
                          <th className={`${TH} text-right`}>Số đơn</th>
                          <th className={`${TH} text-right`}>
                            Phí trước voucher
                          </th>
                          <th className={`${TH} text-right`}>Sàn bù</th>
                          <th className={`${TH} text-right`}>Khách trả</th>
                          <th className={`${TH} text-right`}>Đã chi</th>
                          <th className={`${TH} text-right`}>Chờ chi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {theoDvvc.map((d) => (
                          <tr key={d.dvvc_ma} className="hover:bg-slate-50/70">
                            <td className={`${TD} font-medium`}>
                              {d.dvvc_ten}
                            </td>
                            <td className={`${TD} text-right`}>{d.so_don}</td>
                            <td className={`${TD} text-right text-sky-700`}>
                              {money(d.phi_goc)}
                            </td>
                            <td className={`${TD} text-right text-amber-700`}>
                              {money(d.san_bu)}
                            </td>
                            <td className={`${TD} text-right text-indigo-700`}>
                              {money(d.khach_tra)}
                            </td>
                            <td className={`${TD} text-right text-emerald-700`}>
                              {money(d.da_chi)}
                            </td>
                            <td className={`${TD} text-right text-rose-600`}>
                              {money(d.cho_chi)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="border-t-2 border-slate-200 bg-slate-50 font-semibold">
                        <tr>
                          <td className={TD}>Tổng</td>
                          <td className={`${TD} text-right`}>
                            {tongPhi.so_don}
                          </td>
                          <td className={`${TD} text-right text-sky-700`}>
                            {money(tongPhi.phi_goc)}
                          </td>
                          <td className={`${TD} text-right text-amber-700`}>
                            {money(tongPhi.san_bu)}
                          </td>
                          <td className={`${TD} text-right text-indigo-700`}>
                            {money(tongPhi.khach_tra)}
                          </td>
                          <td className={`${TD} text-right text-emerald-700`}>
                            {money(tongPhi.da_chi)}
                          </td>
                          <td className={`${TD} text-right text-rose-600`}>
                            {money(tongPhi.cho_chi)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </>
            ) : (
              <>
                {listLoading ? (
                  <p className="py-10 text-center text-sm text-slate-500">
                    Đang tải đơn hàng...
                  </p>
                ) : list.rows.length === 0 ? (
                  <EmptyState />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[1100px] border-collapse">
                      <thead className="border-b border-slate-200 bg-slate-50">
                        <tr>
                          <th className={TH}>Mã đơn</th>
                          <th className={TH}>Kho</th>
                          <th className={TH}>ĐVVC</th>
                          <th className={TH}>Ngày lập</th>
                          <th className={`${TH} text-right`}>
                            Phí trước voucher
                          </th>
                          <th className={`${TH} text-right`}>Sàn bù</th>
                          <th className={`${TH} text-right`}>Khách trả</th>
                          <th className={TH}>Mã phiếu</th>
                          <th className={TH}>Trạng thái</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {list.rows.map((r) => (
                          <tr key={r.dts_ma} className="hover:bg-slate-50/70">
                            <td
                              className={`${TD} font-mono font-semibold text-indigo-600`}
                            >
                              {r.dts_ma}
                            </td>
                            <td className={`${TD} text-slate-600`}>
                              {r.kho_ten || "—"}
                            </td>
                            <td className={`${TD} text-slate-600`}>
                              {r.dvvc_ten}
                            </td>
                            <td className={`${TD} text-slate-500`}>
                              {fmtDate(r.dts_ngaylap)}
                            </td>
                            <td className={`${TD} text-right text-sky-700`}>
                              {money(r.phi_ship_goc)}
                            </td>
                            <td className={`${TD} text-right text-amber-700`}>
                              {Number(r.voucher_ship) > 0
                                ? money(r.voucher_ship)
                                : "—"}
                            </td>
                            <td className={`${TD} text-right text-indigo-700`}>
                              {money(r.khach_tra)}
                            </td>
                            <td
                              className={`${TD} font-mono text-xs text-slate-500`}
                            >
                              {r.pcd_ma || "—"}
                            </td>
                            <td className={TD}>
                              <ChiBadge status={r.trang_thai} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <PagerVC
                  page={list.page}
                  totalPages={list.total_pages}
                  total={list.total}
                  label="đơn"
                  onChange={(p) =>
                    setListFilter((prev) => ({ ...prev, page: p }))
                  }
                />
              </>
            )}
          </SectionCard>

          <NoteBox tone="sky">
            Quy ước tab Phí vận chuyển: số liệu tính theo{" "}
            <strong>ngày lập đơn</strong>, bỏ đơn có trạng thái mới nhất TTDH06.{" "}
            <strong>Phí trước voucher</strong> = Khách trả + Sàn bù.{" "}
            <strong>Đã chi / Chờ chi</strong> phản ánh trạng thái hiện tại của
            phiếu chi ĐVVC cho các đơn phát sinh trong kỳ. Khi lọc 1 kho, mọi số
            liệu theo đơn đều lọc theo kho của shipper giao hàng; riêng{" "}
            <strong>phiếu chi ĐVVC không gắn kho</strong> nên KPI/cột Đã chi và
            Chờ chi vẫn là số toàn hệ thống.
          </NoteBox>
        </>
      )}

      <PhieuChiTietDrawer
        open={dtDetail.open}
        loading={dtDetail.loading}
        data={dtDetail.data}
        onClose={() => setDtDetail({ open: false, loading: false, data: null })}
      />
      <ToastNotification toast={toast} />
    </div>
  );
};

export default QuanLyPhiVanChuyen;
