// frontend/src/pages/dvvc/LichSuNhanTienShip.jsx
import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { AuthContext } from "../../contexts/AuthContext";
import dongTienThongKeService from "../../services/dvvc/dongTienThongKeService";
import ToastNotification from "../../components/common/Crud/ToastNotification";
import {
  money,
  fmtDate,
  KpiCard,
  FilterBar,
  SectionCard,
  EmptyState,
  TabBar,
  ViewToggle,
  NoteBox,
} from "../../components/admin/dongtien/DongTienUI";
import {
  DonutChart,
  CHART_COLORS,
} from "../../components/admin/dongtien/Charts";
import {
  EMPTY,
  num,
  fmtDay,
  downloadCsv,
  BalanceChart,
  ReconRow,
} from "../../components/dvvc/dongtien/DongTienDVVCUI";
import {
  KhoTable,
  ShipperTable,
} from "../../components/dvvc/dongtien/DongTienDVVCTables";
import {
  SanChuaChuyenTab,
  SanDaChuyenTab,
} from "../../components/dvvc/dongtien/DongTienDVVCSanTabs";

const NAM_HIEN_TAI = new Date().getFullYear();
const PAGE_SIZE = 10;
const DETAIL_PAGE_SIZE = 5;

const TABS = [
  { key: "theo-kho", label: "Theo kho" },
  { key: "theo-shipper", label: "Theo shipper" },
  { key: "san-chua-chuyen", label: "Sàn chưa chuyển" },
  { key: "san-da-chuyen", label: "Sàn đã chuyển" },
];

const CHART_VIEWS = [
  { id: "thang", label: "Theo tháng", icon: "calendar_month" },
  { id: "nam", label: "Theo năm", icon: "event_note" },
];

const LichSuNhanTienShip = () => {
  const { user, loading: authLoading } = useContext(AuthContext);
  const dvvc_ma = user?.dvvc_ma || user?.DVVC_Ma || user?.id;

  const [danhMuc, setDanhMuc] = useState({
    kho: EMPTY,
    nam: [NAM_HIEN_TAI],
    nam_hien_tai: NAM_HIEN_TAI,
  });
  const [filters, setFilters] = useState({
    kho_ma: "",
    nam: String(NAM_HIEN_TAI),
    thang: "",
  });

  const [tongQuan, setTongQuan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const [activeTab, setActiveTab] = useState("theo-kho");
  const [chartMode, setChartMode] = useState("thang");

  const [khoPage, setKhoPage] = useState(1);
  const [shipperPage, setShipperPage] = useState(1);
  const [expanded, setExpanded] = useState(null);
  const [orderState, setOrderState] = useState({});

  const [donChuaLapPage, setDonChuaLapPage] = useState(1);
  const [donChuaLap, setDonChuaLap] = useState({
    rows: EMPTY,
    total: 0,
    page: 1,
    total_pages: 1,
  });
  const [donChuaLapLoading, setDonChuaLapLoading] = useState(false);

  const [phieuPage, setPhieuPage] = useState(1);
  const [phieuDaChuyen, setPhieuDaChuyen] = useState({
    rows: EMPTY,
    total: 0,
    page: 1,
    total_pages: 1,
  });
  const [phieuLoading, setPhieuLoading] = useState(false);

  const [expandedPcd, setExpandedPcd] = useState(null);
  const [phieuDetail, setPhieuDetail] = useState({});

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

  // ===== Danh mục kho/năm =====
  useEffect(() => {
    if (!dvvc_ma) return undefined;

    let ignore = false;

    dongTienThongKeService
      .getDanhMuc(dvvc_ma)
      .then((res) => {
        if (ignore) return;

        const data = res.data || {};
        const dsNam =
          Array.isArray(data.nam) && data.nam.length
            ? data.nam
            : [NAM_HIEN_TAI];

        setDanhMuc({
          kho: Array.isArray(data.kho) ? data.kho : EMPTY,
          nam: dsNam,
          nam_hien_tai: data.nam_hien_tai || NAM_HIEN_TAI,
        });

        setFilters((prev) => ({
          ...prev,
          nam: String(data.nam_hien_tai || prev.nam || NAM_HIEN_TAI),
        }));
      })
      .catch((error) => {
        if (!ignore) {
          showToast(
            error.response?.data?.message || "Không tải được danh mục kho/năm",
            "error",
          );
        }
      });

    return () => {
      ignore = true;
    };
  }, [dvvc_ma, showToast]);

  // ===== Tổng quan: KPI + biểu đồ + bảng kho/shipper =====
  useEffect(() => {
    if (!dvvc_ma) {
      setLoading(false);
      return undefined;
    }

    let ignore = false;
    setLoading(true);

    dongTienThongKeService
      .getTongQuan(dvvc_ma, {
        kho_ma: filters.kho_ma || undefined,
        nam: filters.nam,
        thang: filters.thang || undefined,
      })
      .then((res) => {
        if (!ignore) setTongQuan(res.data);
      })
      .catch((error) => {
        if (!ignore) {
          showToast(
            error.response?.data?.message || "Không tải được dữ liệu dòng tiền",
            "error",
          );
        }
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [
    dvvc_ma,
    filters.kho_ma,
    filters.nam,
    filters.thang,
    reloadKey,
    showToast,
  ]);

  // Đổi bộ lọc -> về trang 1, đóng các dòng đang mở
  useEffect(() => {
    setKhoPage(1);
    setShipperPage(1);
    setDonChuaLapPage(1);
    setPhieuPage(1);
    setExpanded(null);
    setExpandedPcd(null);
    setOrderState({});
    setPhieuDetail({});
  }, [filters.kho_ma, filters.nam, filters.thang]);

  // Đổi tab -> đóng dòng đang mở
  useEffect(() => {
    setExpanded(null);
    setExpandedPcd(null);
  }, [activeTab]);

  // ===== Tab Sàn chưa chuyển: đơn chưa lập phiếu =====
  useEffect(() => {
    if (!dvvc_ma || activeTab !== "san-chua-chuyen") return undefined;

    let ignore = false;
    setDonChuaLapLoading(true);

    dongTienThongKeService
      .getDonChuaLap(dvvc_ma, {
        page: donChuaLapPage,
        limit: PAGE_SIZE,
      })
      .then((res) => {
        if (!ignore) setDonChuaLap(res.data);
      })
      .catch((error) => {
        if (!ignore) {
          showToast(
            error.response?.data?.message ||
              "Không tải được đơn chưa lập phiếu",
            "error",
          );
        }
      })
      .finally(() => {
        if (!ignore) setDonChuaLapLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [dvvc_ma, activeTab, donChuaLapPage, reloadKey, showToast]);

  // ===== Tab Sàn đã chuyển: phiếu đã thanh toán =====
  useEffect(() => {
    if (!dvvc_ma || activeTab !== "san-da-chuyen") return undefined;

    let ignore = false;
    setPhieuLoading(true);

    dongTienThongKeService
      .getDanhSachPhieu(dvvc_ma, {
        nam: filters.nam,
        thang: filters.thang || undefined,
        page: phieuPage,
        limit: PAGE_SIZE,
      })
      .then((res) => {
        if (!ignore) setPhieuDaChuyen(res.data);
      })
      .catch((error) => {
        if (!ignore) {
          showToast(
            error.response?.data?.message ||
              "Không tải được danh sách phiếu sàn đã chuyển",
            "error",
          );
        }
      })
      .finally(() => {
        if (!ignore) setPhieuLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [
    dvvc_ma,
    activeTab,
    filters.nam,
    filters.thang,
    phieuPage,
    reloadKey,
    showToast,
  ]);

  // ===== Đơn đang giữ của 1 kho/shipper =====
  const loadOrders = useCallback(
    async (loai, ma, page = 1) => {
      if (!dvvc_ma) return;

      const key = `${loai}:${ma}`;

      setOrderState((prev) => ({
        ...prev,
        [key]: {
          ...(prev[key] || {
            rows: EMPTY,
            total: 0,
            total_pages: 1,
          }),
          page,
          loading: true,
        },
      }));

      try {
        const res = await dongTienThongKeService.getDonDangGiu(dvvc_ma, {
          loai,
          ma,
          page,
          limit: DETAIL_PAGE_SIZE,
        });

        setOrderState((prev) => ({
          ...prev,
          [key]: { ...res.data, loading: false },
        }));
      } catch (error) {
        setOrderState((prev) => ({
          ...prev,
          [key]: {
            ...(prev[key] || {}),
            loading: false,
          },
        }));

        showToast(
          error.response?.data?.message ||
            "Không tải được danh sách đơn đang giữ",
          "error",
        );
      }
    },
    [dvvc_ma, showToast],
  );

  const toggleOrders = (loai, ma) => {
    if (expanded?.loai === loai && expanded?.ma === ma) {
      setExpanded(null);
      return;
    }

    setExpanded({ loai, ma });
    loadOrders(loai, ma, 1);
  };

  const togglePhieu = async (pcd_ma) => {
    if (!dvvc_ma) return;

    if (expandedPcd === pcd_ma) {
      setExpandedPcd(null);
      return;
    }

    setExpandedPcd(pcd_ma);

    if (phieuDetail[pcd_ma]?.data) return;

    setPhieuDetail((prev) => ({
      ...prev,
      [pcd_ma]: { loading: true, data: null },
    }));

    try {
      const res = await dongTienThongKeService.getPhieuChiTiet(dvvc_ma, pcd_ma);

      setPhieuDetail((prev) => ({
        ...prev,
        [pcd_ma]: { loading: false, data: res.data },
      }));
    } catch (error) {
      setPhieuDetail((prev) => ({
        ...prev,
        [pcd_ma]: { loading: false, data: null },
      }));

      showToast(
        error.response?.data?.message || "Không tải được chi tiết phiếu",
        "error",
      );
    }
  };

  const reloadAll = () => {
    setReloadKey((key) => key + 1);
    setExpanded(null);
    setExpandedPcd(null);
    setOrderState({});
    setPhieuDetail({});
  };

  // ===== Dữ liệu dẫn xuất =====
  const kpi = tongQuan?.kpi || {};
  const theoKho = tongQuan?.theo_kho || EMPTY;
  const theoShipper = tongQuan?.theo_shipper || EMPTY;
  const phieuCho = tongQuan?.phieu_cho || EMPTY;
  const theoThang = tongQuan?.theo_thang || EMPTY;
  const theoNam = tongQuan?.theo_nam || EMPTY;

  const khoTotalPages = Math.max(1, Math.ceil(theoKho.length / PAGE_SIZE));
  const khoPageSafe = Math.min(khoPage, khoTotalPages);
  const khoRowsPage = useMemo(() => {
    const start = (khoPageSafe - 1) * PAGE_SIZE;
    return theoKho.slice(start, start + PAGE_SIZE);
  }, [theoKho, khoPageSafe]);

  const shipperTotalPages = Math.max(
    1,
    Math.ceil(theoShipper.length / PAGE_SIZE),
  );
  const shipperPageSafe = Math.min(shipperPage, shipperTotalPages);
  const shipperRowsPage = useMemo(() => {
    const start = (shipperPageSafe - 1) * PAGE_SIZE;
    return theoShipper.slice(start, start + PAGE_SIZE);
  }, [theoShipper, shipperPageSafe]);

  const kpiCards = useMemo(
    () => [
      {
        icon: "two_wheeler",
        label: "Shipper đang giữ",
        value: money(kpi.shipper_giu || 0),
        tone: "blue",
        hint: `${num(kpi.shipper_so_don)} đơn · ${num(
          kpi.shipper_so_shipper,
        )} shipper · lâu nhất ${num(kpi.shipper_lau_nhat_ngay)} ngày`,
      },
      {
        icon: "warehouse",
        label: "Kho đang giữ",
        value: money(kpi.kho_giu || 0),
        tone: "amber",
        hint: `${num(kpi.kho_so_don)} đơn · ${num(kpi.kho_so_kho)} kho`,
      },
      {
        icon: "account_balance",
        label: "Sàn chưa chuyển",
        value: money(kpi.san_chua_chuyen || 0),
        tone: "red",
        hint: `${num(kpi.san_chua_chuyen_don)} đơn · chưa lập ${money(
          kpi.san_chua_lap || 0,
        )} · chờ QR ${money(kpi.san_cho_qr || 0)}`,
      },
      {
        icon: "savings",
        label: "Tổng tiền đang giữ",
        value: money(kpi.tong_dang_giu || 0),
        tone: "emerald",
        hint: "Shipper + kho + sàn chưa chuyển",
      },
    ],
    [kpi],
  );

  const donutItems = useMemo(
    () => [
      {
        label: "Tiền hàng trả shop",
        value: num(kpi.tra_shop),
        color: CHART_COLORS.shop,
      },
      {
        label: "Phí sàn",
        value: num(kpi.tra_san),
        color: CHART_COLORS.san,
      },
      {
        label: "Cước ĐVVC",
        value: num(kpi.dvvc_giu),
        color: CHART_COLORS.dvvc,
      },
    ],
    [kpi],
  );

  const tongCod = useMemo(
    () => donutItems.reduce((sum, item) => sum + item.value, 0),
    [donutItems],
  );

  const khoDangChon = useMemo(
    () => (danhMuc.kho || EMPTY).find((kho) => kho.kho_ma === filters.kho_ma),
    [danhMuc.kho, filters.kho_ma],
  );

  const tabMeta = useMemo(
    () => ({
      "theo-kho": {
        title: "Tiền đang giữ theo kho",
        subtitle: `Bấm vào kho để xem danh sách đơn đang giữ. ${
          filters.kho_ma ? "Đang lọc 1 kho." : "Tất cả kho."
        }`,
      },
      "theo-shipper": {
        title: "Tiền đang giữ theo shipper",
        subtitle: `Bấm vào shipper để xem danh sách đơn đang giữ. ${
          filters.kho_ma ? "Đang lọc theo kho." : "Tất cả kho."
        }`,
      },
      "san-chua-chuyen": {
        title: "Sàn chưa chuyển tiền voucher ship",
        subtitle: "Toàn ĐVVC · tồn hiện tại · không áp dụng bộ lọc kho.",
      },
      "san-da-chuyen": {
        title: "Sàn đã chuyển tiền voucher ship",
        subtitle: `Mốc thời gian = ngày hoàn tất phiếu · ${
          filters.thang
            ? `tháng ${filters.thang}/${filters.nam}`
            : `năm ${filters.nam}`
        }.`,
      },
    }),
    [filters.kho_ma, filters.nam, filters.thang],
  );

  const activeMeta = tabMeta[activeTab] || tabMeta["theo-kho"];
  const chartRows = chartMode === "thang" ? theoThang : theoNam;

  const busy =
    loading ||
    (activeTab === "san-chua-chuyen" && donChuaLapLoading) ||
    (activeTab === "san-da-chuyen" && phieuLoading) ||
    Object.values(orderState).some((state) => state?.loading);

  // ===== CSV =====
  const exportCsv = () => {
    const suffix = `${filters.nam}${filters.thang ? `-T${filters.thang}` : ""}`;

    if (activeTab === "theo-kho") {
      if (theoKho.length === 0) {
        showToast("Không có dữ liệu để xuất", "error");
        return;
      }

      downloadCsv(
        `dong-tien-theo-kho-${suffix}`,
        [
          "Mã kho",
          "Tên kho",
          "Số shipper",
          "Đơn đang giữ",
          "Shipper giữ",
          "Kho giữ",
          "Tổng giữ",
          "Trả shop",
          "Phí sàn",
          "Cước ĐVVC",
          "Nhận trong kỳ",
          "Số đơn nhận",
          "Đã tất toán",
          "Số phiếu tất toán",
        ],
        theoKho.map((k) => [
          k.kho_ma,
          k.kho_ten,
          k.so_shipper,
          k.so_don_giu,
          k.shipper_giu,
          k.kho_giu,
          k.tong_giu,
          k.tra_shop,
          k.tra_san,
          k.dvvc_giu,
          k.tien_nhan,
          k.so_don_nhan,
          k.tien_tat_toan,
          k.so_phieu,
        ]),
      );
    } else if (activeTab === "theo-shipper") {
      if (theoShipper.length === 0) {
        showToast("Không có dữ liệu để xuất", "error");
        return;
      }

      downloadCsv(
        `dong-tien-theo-shipper-${suffix}`,
        [
          "Mã shipper",
          "Tên shipper",
          "SĐT",
          "Mã kho",
          "Tên kho",
          "Số đơn",
          "Tổng giữ",
          "Trả shop",
          "Phí sàn",
          "Cước ĐVVC",
          "Đơn cũ nhất",
          "Số ngày giữ",
        ],
        theoShipper.map((r) => [
          r.shipper_ma,
          r.shipper_ten,
          r.shipper_sdt,
          r.kho_ma,
          r.kho_ten,
          r.so_don,
          r.tong_giu,
          r.tra_shop,
          r.tra_san,
          r.dvvc_giu,
          fmtDay(r.don_cu_nhat),
          r.so_ngay_giu,
        ]),
      );
    } else if (activeTab === "san-chua-chuyen") {
      const rows = donChuaLap.rows || EMPTY;

      if (rows.length === 0) {
        showToast("Không có dữ liệu để xuất", "error");
        return;
      }

      downloadCsv(
        `san-chua-chuyen-${suffix}-trang-${donChuaLap.page || 1}`,
        ["Mã đơn", "Ngày lập", "Shop", "Kho", "Shipper", "Tiền sàn bù"],
        rows.map((r) => [
          r.dts_ma,
          fmtDay(r.dts_ngaylap),
          r.gh_ten,
          r.kho_ten,
          r.shipper_ten,
          r.tien_san_bu,
        ]),
      );
    } else {
      const rows = phieuDaChuyen.rows || EMPTY;

      if (rows.length === 0) {
        showToast("Không có dữ liệu để xuất", "error");
        return;
      }

      downloadCsv(
        `san-da-chuyen-${suffix}-trang-${phieuDaChuyen.page || 1}`,
        [
          "Mã phiếu",
          "Ngày tạo",
          "Ngày hoàn tất",
          "Số đơn",
          "QR đã TT",
          "Tổng QR",
          "Số tiền",
          "Trạng thái",
        ],
        rows.map((r) => [
          r.pcd_ma,
          fmtDate(r.pcd_ngay_tao),
          fmtDate(r.pcd_ngay_hoan_tat),
          r.so_don,
          r.so_qr_da_tt,
          r.so_qr,
          r.pcd_tong_tien,
          r.pcd_trang_thai,
        ]),
      );
    }

    showToast("Đã xuất file CSV");
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] p-10 text-center text-sm text-slate-500">
        Đang tải thông tin đăng nhập...
      </div>
    );
  }

  if (!dvvc_ma) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] p-10">
        <div className="mx-auto max-w-xl rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center">
          <p className="text-sm font-semibold text-rose-700">
            Không xác định được đơn vị vận chuyển.
          </p>
          <p className="mt-1 text-xs text-rose-500">
            Vui lòng đăng nhập lại bằng tài khoản ĐVVC.
          </p>
        </div>
      </div>
    );
  }

  if (loading && !tongQuan) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] p-10 text-center text-sm text-slate-500">
        Đang tải dữ liệu dòng tiền...
      </div>
    );
  }

  if (!tongQuan && !loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] p-10">
        <div className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
          <p className="text-sm font-semibold text-slate-700">
            Không tải được dữ liệu dòng tiền.
          </p>
          <button
            type="button"
            onClick={reloadAll}
            className="mt-4 rounded-lg bg-[#1e3a5f] px-4 py-2 text-sm font-semibold text-white hover:bg-[#2a4b73]"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen space-y-5 bg-[#F8FAFC] p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A]">
            Dòng tiền & tiền đang giữ
          </h1>
          <p className="mt-1 max-w-3xl text-sm text-slate-500">
            Theo dõi COD shipper/kho đang giữ và công nợ voucher ship sàn còn
            phải chuyển. Số liệu “đang giữ” là snapshot hiện tại; biểu đồ là số
            dư cuối kỳ.
          </p>
        </div>

        <div className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-600 shadow-sm">
          Kỳ xem:{" "}
          <strong className="text-slate-800">
            {filters.thang
              ? `Tháng ${filters.thang}/${filters.nam}`
              : `Năm ${filters.nam}`}
          </strong>
        </div>
      </div>

      <FilterBar
        danhMuc={danhMuc}
        filters={filters}
        onChange={setFilters}
        onReload={reloadAll}
        loading={busy}
        onExport={exportCsv}
      />

      {filters.kho_ma && (
        <NoteBox tone="amber">
          Đang lọc kho <strong>{khoDangChon?.kho_ten || filters.kho_ma}</strong>
          . Bộ lọc kho chỉ áp dụng cho tab <strong>Theo kho</strong> và{" "}
          <strong>Theo shipper</strong>. Số liệu sàn luôn tính toàn ĐVVC vì
          phiếu chi không gắn kho.
        </NoteBox>
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {kpiCards.map((card) => (
          <KpiCard key={card.label} {...card} />
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-500 shadow-sm">
        <span>
          Sàn đã chuyển trong kỳ:{" "}
          <strong className="text-emerald-700">
            {money(kpi.san_da_chuyen || 0)}
          </strong>{" "}
          · {num(kpi.san_da_chuyen_phieu)} phiếu
        </span>
        <span>
          COD đang giữ:{" "}
          <strong className="text-slate-700">
            {money(kpi.tong_cod_giu || 0)}
          </strong>
        </span>
        <span>
          Trả shop:{" "}
          <strong className="text-indigo-700">
            {money(kpi.tra_shop || 0)}
          </strong>
        </span>
        <span>
          Phí sàn:{" "}
          <strong className="text-amber-700">{money(kpi.tra_san || 0)}</strong>
        </span>
        <span>
          Cước ĐVVC:{" "}
          <strong className="text-rose-600">{money(kpi.dvvc_giu || 0)}</strong>
        </span>
        <span className="font-medium text-slate-400">
          Snapshot hiện tại, không phụ thuộc tháng/năm.
        </span>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <SectionCard
          title="Cơ cấu COD đang giữ"
          subtitle="Shipper + kho · snapshot hiện tại"
        >
          {tongCod > 0 ? (
            <DonutChart items={donutItems} />
          ) : (
            <EmptyState
              icon="pie_chart"
              title="Chưa có COD đang giữ"
              hint="Khi shipper/kho đã thu tiền nhưng chưa nộp, cơ cấu sẽ hiển thị tại đây."
            />
          )}

          <div className="mt-4">
            <NoteBox tone="slate">
              Tổng COD đang giữ = tiền hàng trả shop + phí sàn + cước ĐVVC ={" "}
              <strong>{money(tongCod)}</strong>.
            </NoteBox>
          </div>
        </SectionCard>

        <SectionCard
          title="Đối soát công nợ sàn"
          subtitle="Sàn bù voucher ship · toàn ĐVVC"
        >
          <div className="grid gap-2 sm:grid-cols-2">
            <ReconRow
              label="Chưa lập phiếu chi"
              value={kpi.san_chua_lap || 0}
              hint={`${num(kpi.san_chua_lap_don)} đơn`}
              tone="amber"
            />
            <ReconRow
              label="Chờ QR"
              value={kpi.san_cho_qr || 0}
              hint={`${num(kpi.san_cho_qr_don)} đơn · ${num(
                kpi.san_cho_qr_phieu,
              )} phiếu`}
              tone="sky"
            />
            <ReconRow
              label="Tổng sàn chưa chuyển"
              value={kpi.san_chua_chuyen || 0}
              hint={`${num(kpi.san_chua_chuyen_don)} đơn`}
              tone="red"
            />
            <ReconRow
              label="Sàn đã chuyển trong kỳ"
              value={kpi.san_da_chuyen || 0}
              hint={`${num(kpi.san_da_chuyen_phieu)} phiếu`}
              tone="emerald"
            />
          </div>

          <div className="mt-4">
            <NoteBox tone="sky">
              “Sàn chưa chuyển” gồm đơn chưa lập phiếu chi và phiếu đang chờ QR.
              Đơn hủy <strong>TTDH06</strong> không được tính.
            </NoteBox>
          </div>
        </SectionCard>
      </div>

      <SectionCard
        title="Số dư cuối kỳ & tiền sàn đã chuyển"
        subtitle="Ba đường là số dư cuối tháng/năm; cột là tiền sàn đã chuyển trong kỳ."
        action={
          <ViewToggle
            views={CHART_VIEWS}
            active={chartMode}
            onChange={setChartMode}
          />
        }
      >
        {loading ? (
          <p className="py-10 text-center text-sm text-slate-500">
            Đang tải biểu đồ...
          </p>
        ) : chartRows.length === 0 ? (
          <EmptyState
            icon="show_chart"
            title="Chưa có dữ liệu biểu đồ"
            hint="Thử đổi năm hoặc kiểm tra lại đơn hàng/phiếu chi."
          />
        ) : (
          <BalanceChart
            rows={chartRows}
            mode={chartMode}
            highlightThang={filters.thang ? Number(filters.thang) : null}
          />
        )}
      </SectionCard>

      <SectionCard title={activeMeta.title} subtitle={activeMeta.subtitle}>
        <div className="mb-4">
          <TabBar tabs={TABS} active={activeTab} onChange={setActiveTab} />
        </div>

        {activeTab === "theo-kho" && (
          <KhoTable
            rows={khoRowsPage}
            loading={loading}
            page={khoPageSafe}
            totalPages={khoTotalPages}
            totalRows={theoKho.length}
            onPage={setKhoPage}
            expanded={expanded}
            onToggle={toggleOrders}
            orderState={orderState}
            loadOrders={loadOrders}
          />
        )}

        {activeTab === "theo-shipper" && (
          <ShipperTable
            rows={shipperRowsPage}
            loading={loading}
            page={shipperPageSafe}
            totalPages={shipperTotalPages}
            totalRows={theoShipper.length}
            onPage={setShipperPage}
            expanded={expanded}
            onToggle={toggleOrders}
            orderState={orderState}
            loadOrders={loadOrders}
          />
        )}

        {activeTab === "san-chua-chuyen" && (
          <SanChuaChuyenTab
            kpi={kpi}
            phieuCho={phieuCho}
            donChuaLap={donChuaLap}
            loading={donChuaLapLoading}
            onPage={setDonChuaLapPage}
            expandedPcd={expandedPcd}
            onTogglePhieu={togglePhieu}
            phieuDetail={phieuDetail}
          />
        )}

        {activeTab === "san-da-chuyen" && (
          <SanDaChuyenTab
            data={phieuDaChuyen}
            loading={phieuLoading}
            onPage={setPhieuPage}
            expandedPcd={expandedPcd}
            onTogglePhieu={togglePhieu}
            phieuDetail={phieuDetail}
          />
        )}
      </SectionCard>

      <ToastNotification toast={toast} />
    </div>
  );
};

export default LichSuNhanTienShip;
