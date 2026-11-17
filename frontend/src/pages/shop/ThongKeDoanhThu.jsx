// frontend/src/pages/shop/ThongKeDoanhThu.jsx
import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { AuthContext } from "../../contexts/AuthContext";
import thongKeShopService from "../../services/gianhang/thongKeShopService";
import ToastNotification from "../../components/common/Crud/ToastNotification";
import {
  INPUT,
  money,
  KpiCard,
  SectionCard,
  EmptyState,
} from "../../components/admin/dongtien/DongTienUI";
import {
  PagerTK,
  buildCategoryTree,
  flattenCategoryTree,
} from "../../components/admin/thongke/ThongKeUI";

const SO_NAM_GAN_NHAT = 10;
const NAM_HIEN_TAI = new Date().getFullYear();

const VIEWS = [
  { id: "san-pham", label: "Theo sản phẩm", icon: "inventory_2" },
  { id: "danh-muc", label: "Theo danh mục", icon: "account_tree" },
  { id: "thuong-hieu", label: "Theo thương hiệu", icon: "sell" },
];

const SP_LIMITS = [
  { value: 10, label: "Top 10" },
  { value: 20, label: "Top 20" },
  { value: 50, label: "Top 50" },
  { value: 0, label: "Tất cả" },
];

const SORT_OPTIONS = [
  { value: "doanh_thu", label: "Doanh thu" },
  { value: "so_luong", label: "SL bán" },
];

const TH =
  "whitespace-nowrap px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500";
const TD = "px-3 py-2.5 text-sm text-slate-700";

// ---- CSV helpers ----
const downloadCsv = (name, content) => {
  const url = URL.createObjectURL(
    new Blob(["\uFEFF" + content], { type: "text/csv;charset=utf-8;" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = `${name}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

const buildReportCsv = ({
  title,
  shopLabel,
  periodLabel,
  filterLabel,
  kpi = {},
  detailTitle,
  headers,
  dataRows,
  totalsRow,
}) => {
  const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const L = (arr) => arr.map(esc).join(",");
  const out = [];

  // HEADER BLOCK
  out.push(L([title]));
  out.push(L(["Gian hàng", shopLabel]));
  out.push(L(["Kỳ báo cáo", periodLabel]));
  if (filterLabel) out.push(L(["Bộ lọc", filterLabel]));
  out.push(L(["Ngày xuất", new Date().toLocaleString("vi-VN")]));
  out.push("");

  // I. TỔNG QUAN
  out.push(L(["I. TỔNG QUAN"]));
  out.push(L(["Chỉ tiêu", "Giá trị"]));
  const num = (v) => Number(v || 0);
  [
    ["Doanh thu hàng hóa", num(kpi.doanh_thu)],
    ["Phí sàn", num(kpi.phi_san)],
    ["Giảm giá shop", num(kpi.giam_gia_shop)],
    ["Shop thực nhận", num(kpi.shop_nhan)],
    ["Đơn hoàn thành", num(kpi.so_don)],
    ["Số sản phẩm bán", num(kpi.so_sp)],
    ["Số lượng bán", num(kpi.so_luong)],
    ["Lượt xem", num(kpi.luot_xem)],
    ["Lượt thích", num(kpi.luot_thich)],
  ].forEach((r) => out.push(L(r)));
  out.push("");

  // II. CHI TIẾT
  out.push(L([`II. ${detailTitle}`]));
  out.push(L(headers));
  dataRows.forEach((r) => out.push(L(r)));
  if (totalsRow) out.push(L(totalsRow));
  out.push("");

  out.push(L(["— Hết báo cáo —"]));
  return out.join("\n");
};

const ThongKeDoanhThu = () => {
  const { user } = useContext(AuthContext);
  const gh_ma = user?.gh_ma || user?.GH_Ma;

  const [danhMuc, setDanhMuc] = useState({
    nganh_hang: [],
    thuong_hieu: [],
    nam: [],
    nam_mac_dinh: null,
  });
  const [filters, setFilters] = useState({
    nh_ma: "",
    th_ma: "",
    nam: "",
    thang: "",
  });
  const [ready, setReady] = useState(false);

  const [viewMode, setViewMode] = useState("san-pham");

  const [loading, setLoading] = useState(true);
  const [tongQuan, setTongQuan] = useState(null);

  // Danh mục
  const [nganh, setNganh] = useState([]);
  const [nganhLoading, setNganhLoading] = useState(false);
  const [expanded, setExpanded] = useState(new Set());

  // Thương hiệu
  const [thList, setThList] = useState({
    rows: [],
    total: 0,
    page: 1,
    total_pages: 1,
  });
  const [thLoading, setThLoading] = useState(false);
  const [thFilter, setThFilter] = useState({ q: "", page: 1, limit: 10 });
  const [thQInput, setThQInput] = useState("");

  // Sản phẩm
  const [spList, setSpList] = useState({
    rows: [],
    total: 0,
    page: 1,
    total_pages: 1,
    limit: 10,
  });
  const [spLoading, setSpLoading] = useState(false);
  const [spFilter, setSpFilter] = useState({
    q: "",
    page: 1,
    limit: 10,
    sort: "doanh_thu",
  });
  const [spQInput, setSpQInput] = useState("");

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
    let alive = true;
    if (!gh_ma) {
      setLoading(false);
      setReady(true);
      return;
    }

    thongKeShopService
      .getDanhMuc(gh_ma)
      .then((r) => {
        if (!alive) return;
        const data = r.data || {};
        setDanhMuc({
          nganh_hang: data.nganh_hang || [],
          thuong_hieu: data.thuong_hieu || [],
          nam: data.nam || [],
          nam_mac_dinh: data.nam_mac_dinh ?? null,
        });

        const namMacDinh = data.nam_mac_dinh ?? data.nam?.[0] ?? NAM_HIEN_TAI;

        setFilters((f) => ({ ...f, nam: f.nam || String(namMacDinh) }));
        setReady(true);
      })
      .catch(() => {
        if (!alive) return;
        showToast("Không tải được danh mục thống kê", "error");
        setReady(true);
      });

    return () => {
      alive = false;
    };
  }, [gh_ma, showToast]);

  // ---- 10 năm gần nhất + năm có dữ liệu ----
  const dsNam = useMemo(() => {
    const now = new Date().getFullYear();
    const ys = (danhMuc.nam || []).map(Number).filter((n) => n > 0);
    const co = ys.length ? ys : [now];
    const minYear = Math.min(...co, now - (SO_NAM_GAN_NHAT - 1));
    const maxYear = Math.max(...co, now);
    const out = [];
    for (let y = maxYear; y >= minYear; y -= 1) out.push(y);
    return out;
  }, [danhMuc.nam]);

  const params = useMemo(() => {
    if (!ready) return null;
    return {
      nh_ma: filters.nh_ma || undefined,
      th_ma: filters.th_ma || undefined,
      nam: filters.nam || undefined,
      thang: filters.thang || undefined,
    };
  }, [ready, filters]);

  // ---- 6 KPI ----
  const loadTongQuan = useCallback(async () => {
    if (!params || !gh_ma) return;
    setLoading(true);
    try {
      const res = await thongKeShopService.getTongQuan(gh_ma, params);
      setTongQuan(res.data);
    } catch (e) {
      showToast(e.response?.data?.message || "Lỗi tải tổng quan", "error");
    } finally {
      setLoading(false);
    }
  }, [params, gh_ma, showToast]);

  useEffect(() => {
    loadTongQuan();
  }, [loadTongQuan]);

  // ---- Theo danh mục ----
  const loadNganh = useCallback(async () => {
    if (!params || !gh_ma) return;
    setNganhLoading(true);
    try {
      const res = await thongKeShopService.getTheoDanhMuc(gh_ma, params);
      setNganh(res.data.rows || []);
    } catch (e) {
      showToast(e.response?.data?.message || "Lỗi tải danh mục", "error");
    } finally {
      setNganhLoading(false);
    }
  }, [params, gh_ma, showToast]);

  useEffect(() => {
    if (viewMode === "danh-muc") loadNganh();
  }, [viewMode, loadNganh]);

  // ---- Theo thương hiệu ----
  const loadThuongHieu = useCallback(async () => {
    if (!params || !gh_ma) return;
    setThLoading(true);
    try {
      const res = await thongKeShopService.getTheoThuongHieu(gh_ma, {
        ...params,
        q: thFilter.q || undefined,
        page: thFilter.page,
        limit: thFilter.limit,
      });
      setThList(res.data);
    } catch (e) {
      showToast(
        e.response?.data?.message || "Lỗi tải danh sách thương hiệu",
        "error",
      );
    } finally {
      setThLoading(false);
    }
  }, [params, gh_ma, thFilter, showToast]);

  useEffect(() => {
    if (viewMode === "thuong-hieu") loadThuongHieu();
  }, [viewMode, loadThuongHieu]);

  // ---- Theo sản phẩm ----
  const loadSanPham = useCallback(async () => {
    if (!params || !gh_ma) return;
    setSpLoading(true);
    try {
      const res = await thongKeShopService.getTheoSanPham(gh_ma, {
        ...params,
        q: spFilter.q || undefined,
        sort: spFilter.sort,
        page: spFilter.page,
        limit: spFilter.limit,
      });
      setSpList(res.data);
    } catch (e) {
      showToast(
        e.response?.data?.message || "Lỗi tải danh sách sản phẩm",
        "error",
      );
    } finally {
      setSpLoading(false);
    }
  }, [params, gh_ma, spFilter, showToast]);

  useEffect(() => {
    if (viewMode === "san-pham") loadSanPham();
  }, [viewMode, loadSanPham]);

  // Đổi bộ lọc → về trang 1
  useEffect(() => {
    setThFilter((p) => (p.page === 1 ? p : { ...p, page: 1 }));
    setSpFilter((p) => (p.page === 1 ? p : { ...p, page: 1 }));
  }, [filters]);

  const reloadAll = () => {
    if (!params) return;
    loadTongQuan();
    if (viewMode === "danh-muc") loadNganh();
    if (viewMode === "thuong-hieu") loadThuongHieu();
    if (viewMode === "san-pham") loadSanPham();
  };

  // ---- Dữ liệu dẫn xuất ----
  const kpi = tongQuan?.kpi || {};

  const kpiCards = useMemo(() => {
    const so = (v) => Number(v || 0).toLocaleString("vi-VN");
    return [
      {
        icon: "payments",
        label: "Doanh thu hàng hóa",
        value: money(kpi.doanh_thu),
        tone: "blue",
        hint: `${so(kpi.so_don)} đơn hoàn thành · ${so(kpi.so_luong)} sản phẩm`,
      },
      {
        icon: "account_balance",
        label: "Phí sàn",
        value: money(kpi.phi_san),
        tone: "amber",
        hint: "Phân bổ theo giá trị từng món",
      },
      {
        icon: "storefront",
        label: "Shop thực nhận",
        value: money(kpi.shop_nhan),
        tone: "emerald",
        hint:
          Number(kpi.giam_gia_shop) > 0
            ? `Doanh thu − phí sàn − ${money(kpi.giam_gia_shop)} giảm giá shop`
            : "Doanh thu − phí sàn",
      },
      {
        icon: "receipt_long",
        label: "Đơn hoàn thành",
        value: so(kpi.so_don),
        tone: "indigo",
        hint: `${so(kpi.so_sp)} sản phẩm có bán`,
      },
      {
        icon: "visibility",
        label: "Tổng lượt xem",
        value: so(kpi.luot_xem),
        tone: "slate",
        hint: "Lũy kế đến hiện tại",
      },
      {
        icon: "favorite",
        label: "Tổng lượt thích",
        value: so(kpi.luot_thich),
        tone: "red",
        hint: "Lũy kế đến hiện tại",
      },
    ];
  }, [kpi]);

  // Bù phần chênh lệch vào "Chưa phân loại" để tổng bảng khớp KPI
  const rowsWithOther = useMemo(() => {
    if (!tongQuan?.kpi) return nganh;
    const roots = nganh.filter((r) => !r.nh_cha);
    const s = roots.reduce(
      (a, r) => ({
        so_don: a.so_don + (r.so_don || 0),
        so_luong: a.so_luong + (r.so_luong || 0),
        doanh_thu: a.doanh_thu + (r.doanh_thu || 0),
        phi_san: a.phi_san + (r.phi_san || 0),
        giam_gia_shop: a.giam_gia_shop + (r.giam_gia_shop || 0),
        luot_xem: a.luot_xem + (r.luot_xem || 0),
        luot_thich: a.luot_thich + (r.luot_thich || 0),
      }),
      {
        so_don: 0,
        so_luong: 0,
        doanh_thu: 0,
        phi_san: 0,
        giam_gia_shop: 0,
        luot_xem: 0,
        luot_thich: 0,
      },
    );
    const d = {
      so_don: Math.max(0, (kpi.so_don || 0) - s.so_don),
      so_luong: Math.max(0, (kpi.so_luong || 0) - s.so_luong),
      doanh_thu: Math.max(0, (kpi.doanh_thu || 0) - s.doanh_thu),
      phi_san: Math.max(0, (kpi.phi_san || 0) - s.phi_san),
      giam_gia_shop: Math.max(0, (kpi.giam_gia_shop || 0) - s.giam_gia_shop),
      luot_xem: Math.max(0, (kpi.luot_xem || 0) - s.luot_xem),
      luot_thich: Math.max(0, (kpi.luot_thich || 0) - s.luot_thich),
    };
    if (!Object.values(d).some((v) => v > 0.5)) return nganh;
    return [
      ...nganh,
      {
        nh_ma: "__NONE__",
        nh_ten: "Chưa phân loại",
        nh_cha: null,
        so_sp: 0,
        ...d,
        shop_nhan: Math.max(d.doanh_thu - d.phi_san - d.giam_gia_shop, 0),
      },
    ];
  }, [nganh, tongQuan, kpi]);

  const tree = useMemo(() => buildCategoryTree(rowsWithOther), [rowsWithOther]);

  useEffect(() => {
    setExpanded(new Set(tree.map((n) => n.nh_ma)));
  }, [tree]);

  const visibleRows = useMemo(
    () => flattenCategoryTree(tree, expanded),
    [tree, expanded],
  );

  const toggle = (id) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  // ---- Tiêu đề ----
  const sortLabel =
    SORT_OPTIONS.find((s) => s.value === spFilter.sort)?.label || "Doanh thu";

  const sectionTitle =
    viewMode === "san-pham"
      ? "Doanh thu theo sản phẩm"
      : viewMode === "danh-muc"
        ? "Doanh thu theo danh mục"
        : "Doanh thu theo thương hiệu";

  const sectionSubtitle =
    viewMode === "san-pham"
      ? `Xếp theo ${sortLabel} · mỗi dòng là một phân loại sản phẩm`
      : viewMode === "danh-muc"
        ? "Danh mục cha đã cộng dồn toàn bộ danh mục con · lượt xem/thích tính trên toàn bộ sản phẩm của danh mục"
        : "Mỗi dòng là một thương hiệu · sản phẩm chưa gán thương hiệu gom vào dòng “Chưa xác định thương hiệu”";

  // ---- CSV ----
  const exportCsv = () => {
  const ExcelJS = (await import("exceljs")).default;
  const { saveAs } = await import("file-saver");

  const workbook = new ExcelJS.Workbook();
    // Kỳ + bộ lọc mô tả
    const periodLabel = `Năm ${filters.nam}${
      filters.thang ? ` - Tháng ${filters.thang}` : ""
    }`;
    const filterParts = [];
    if (filters.nh_ma) {
      const cat = catRows.find((c) => c.nh_ma === filters.nh_ma);
      filterParts.push(`Danh mục: ${cat?.nh_ten || filters.nh_ma}`);
    }
    if (filters.th_ma) {
      const th = (danhMuc.thuong_hieu || []).find(
        (t) => t.th_ma === filters.th_ma,
      );
      filterParts.push(`Thương hiệu: ${th?.th_ten || filters.th_ma}`);
    }
    const filterLabel = filterParts.length ? filterParts.join(" · ") : "Không";
    const shopLabel = user?.gh_ten ? `${user.gh_ten} (${gh_ma})` : gh_ma || "—";
    const suffix = `${filters.nam}${filters.thang ? `-T${filters.thang}` : ""}${
      filters.nh_ma ? `-${filters.nh_ma}` : ""
    }${filters.th_ma ? `-${filters.th_ma}` : ""}`;

    let filename;
    let detailTitle;
    let headers;
    let dataRows;
    let totalsRow;

    if (viewMode === "danh-muc") {
      if (visibleRows.length === 0)
        return showToast("Không có dữ liệu để xuất", "error");
      filename = `bao-cao-danh-muc-${suffix}`;
      detailTitle = "CHI TIẾT DOANH THU THEO DANH MỤC";
      headers = [
        "Danh mục",
        "SP bán",
        "SL bán",
        "Đơn",
        "Doanh thu",
        "Phí sàn",
        "Shop nhận",
        "Lượt xem",
        "Lượt thích",
      ];
      dataRows = visibleRows.map((r) => [
        `${"   ".repeat(r.level)}${r.nh_ten}`,
        r.so_sp,
        r.so_luong,
        r.so_don,
        r.doanh_thu,
        r.phi_san,
        r.shop_nhan,
        r.luot_xem,
        r.luot_thich,
      ]);
      totalsRow = [
        "TỔNG CỘNG",
        kpi.so_sp,
        kpi.so_luong,
        kpi.so_don,
        kpi.doanh_thu,
        kpi.phi_san,
        kpi.shop_nhan,
        kpi.luot_xem,
        kpi.luot_thich,
      ];
    } else if (viewMode === "thuong-hieu") {
      if (thList.rows.length === 0)
        return showToast("Không có dữ liệu để xuất", "error");
      filename = `bao-cao-thuong-hieu-${suffix}`;
      detailTitle = "CHI TIẾT DOANH THU THEO THƯƠNG HIỆU";
      headers = [
        "Mã thương hiệu",
        "Thương hiệu",
        "SP bán",
        "SL bán",
        "Đơn",
        "Doanh thu",
        "Phí sàn",
        "Shop nhận",
        "Lượt xem",
        "Lượt thích",
        "TB/đơn",
      ];
      dataRows = thList.rows.map((r) => [
        r.th_ma,
        r.th_ten,
        r.so_sp,
        r.so_luong,
        r.so_don,
        r.doanh_thu,
        r.phi_san,
        r.shop_nhan,
        r.luot_xem,
        r.luot_thich,
        r.so_don > 0 ? Math.round(r.doanh_thu / r.so_don) : "",
      ]);
      totalsRow = [
        "TỔNG CỘNG",
        "",
        kpi.so_sp,
        kpi.so_luong,
        kpi.so_don,
        kpi.doanh_thu,
        kpi.phi_san,
        kpi.shop_nhan,
        kpi.luot_xem,
        kpi.luot_thich,
        kpi.so_don > 0 ? Math.round(kpi.doanh_thu / kpi.so_don) : "",
      ];
    } else {
      if (spList.rows.length === 0)
        return showToast("Không có dữ liệu để xuất", "error");
      filename = `bao-cao-san-pham-${suffix}`;
      detailTitle = "CHI TIẾT DOANH THU THEO SẢN PHẨM";
      headers = [
        "Mã phân loại",
        "Tên sản phẩm",
        "Phân loại",
        "Danh mục",
        "SL bán",
        "Đơn",
        "Doanh thu",
        "Phí sàn",
        "Shop nhận",
        "Lượt xem",
        "Lượt thích",
      ];
      dataRows = spList.rows.map((r) => [
        r.ctsp_ma,
        r.sp_ten,
        r.ctsp_ten,
        r.nh_ten,
        r.so_luong,
        r.so_don,
        r.doanh_thu,
        r.phi_san,
        r.shop_nhan,
        r.luot_xem,
        r.luot_thich,
      ]);
      totalsRow = null; // dữ liệu phân trang, không cộng dồn
    }

    const content = buildReportCsv({
      title: "BÁO CÁO THỐNG KÊ DOANH THU",
      shopLabel,
      periodLabel,
      filterLabel,
      kpi,
      detailTitle,
      headers,
      dataRows,
      totalsRow,
    });

    downloadCsv(filename, content);
    showToast("Đã xuất báo cáo CSV");
  };

  const viewToggle = (
    <div className="flex shrink-0 flex-wrap rounded-xl border border-slate-200 bg-slate-50 p-1">
      {VIEWS.map((v) => (
        <button
          key={v.id}
          type="button"
          onClick={() => setViewMode(v.id)}
          className={`flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
            viewMode === v.id
              ? "bg-[#ea580c] text-white shadow-sm"
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
  );

  const currentLoading =
    viewMode === "danh-muc"
      ? nganhLoading
      : viewMode === "thuong-hieu"
        ? thLoading
        : spLoading;

  // ---- Danh mục cho bộ lọc (cây phẳng) ----
  const catRows = useMemo(() => {
    const list = danhMuc.nganh_hang || [];
    return flattenCategoryTree(
      buildCategoryTree(list),
      new Set(list.map((n) => n.nh_ma)),
    );
  }, [danhMuc.nganh_hang]);

  if (!gh_ma)
    return (
      <div className="p-10 text-center text-sm text-gray-500">
        Không xác định được gian hàng. Vui lòng đăng nhập lại.
      </div>
    );

  return (
    <div className="min-h-screen space-y-5 bg-[#F8FAFC] p-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0F172A]">
          Thống kê doanh thu
        </h1>
        {/* <p className="mt-1 text-sm text-[#64748B]">
          Doanh thu hàng hóa, phí sàn và tiền shop thực nhận. Chỉ tính đơn đã
          hoàn thành (TTDH05), ghi nhận theo ngày hoàn thành. Lọc theo danh mục,
          thương hiệu, tháng, năm rồi chuyển giữa 3 chế độ: theo sản phẩm, theo
          danh mục, theo thương hiệu.
        </p> */}
      </div>

      {/* ===== Bộ lọc ===== */}
      <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-slate-500">Danh mục</span>
          <select
            className={`${INPUT} min-w-[240px]`}
            value={filters.nh_ma}
            onChange={(e) =>
              setFilters((f) => ({ ...f, nh_ma: e.target.value }))
            }
          >
            <option value="">Tất cả danh mục</option>
            {catRows.map((n) => (
              <option key={n.nh_ma} value={n.nh_ma}>
                {`${"— ".repeat(n.level)}${n.nh_ten}`}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-slate-500">
            Thương hiệu
          </span>
          <select
            className={`${INPUT} min-w-[190px]`}
            value={filters.th_ma}
            onChange={(e) =>
              setFilters((f) => ({ ...f, th_ma: e.target.value }))
            }
          >
            <option value="">Tất cả thương hiệu</option>
            {(danhMuc.thuong_hieu || []).map((t) => (
              <option key={t.th_ma} value={t.th_ma}>
                {t.th_ten}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-slate-500">Năm</span>
          <select
            className={`${INPUT} w-[120px]`}
            value={filters.nam}
            onChange={(e) => setFilters((f) => ({ ...f, nam: e.target.value }))}
          >
            {dsNam.map((n) => (
              <option key={n} value={String(n)}>
                Năm {n}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-slate-500">Tháng</span>
          <select
            className={`${INPUT} w-[130px]`}
            value={filters.thang}
            onChange={(e) =>
              setFilters((f) => ({ ...f, thang: e.target.value }))
            }
          >
            <option value="">Cả năm</option>
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={String(m)}>
                Tháng {m}
              </option>
            ))}
          </select>
        </label>

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={exportCsv}
            className="flex h-10 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            <span className="material-symbols-outlined text-[18px]">
              download
            </span>
            CSV
          </button>
          <button
            type="button"
            onClick={reloadAll}
            disabled={loading || !ready || currentLoading}
            className="flex h-10 items-center gap-1.5 rounded-lg bg-[#ea580c] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#c2410c] disabled:opacity-60"
          >
            <span
              className={`material-symbols-outlined text-[18px] ${
                loading || currentLoading ? "animate-spin" : ""
              }`}
            >
              refresh
            </span>
            {loading || currentLoading ? "Đang tải" : "Làm mới"}
          </button>
        </div>
      </div>

      {/* ===== KPI ===== */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {kpiCards.map((c) => (
          <KpiCard key={c.label} {...c} />
        ))}
      </div>

      <SectionCard
        title={sectionTitle}
        subtitle={sectionSubtitle}
        action={viewToggle}
      >
        {/* ===== Theo danh mục ===== */}
        {viewMode === "danh-muc" && (
          <>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-slate-500">
                {visibleRows.length} dòng đang hiển thị
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setExpanded(new Set(rowsWithOther.map((r) => r.nh_ma)))
                  }
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                  Mở tất cả
                </button>
                <button
                  type="button"
                  onClick={() => setExpanded(new Set())}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                  Thu gọn
                </button>
              </div>
            </div>

            {nganhLoading ? (
              <p className="py-10 text-center text-sm text-slate-500">
                Đang tải danh mục...
              </p>
            ) : visibleRows.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1120px] border-collapse">
                  <thead className="border-b border-slate-200 bg-slate-50">
                    <tr>
                      <th className={TH}>Danh mục</th>
                      <th className={`${TH} text-right`}>SP bán</th>
                      <th className={`${TH} text-right`}>SL bán</th>
                      <th className={`${TH} text-right`}>Đơn</th>
                      <th className={`${TH} text-right`}>Doanh thu</th>
                      <th className={`${TH} text-right`}>Phí sàn</th>
                      <th className={`${TH} text-right`}>Shop nhận</th>
                      <th className={`${TH} text-right`}>Lượt xem</th>
                      <th className={`${TH} text-right`}>Lượt thích</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {visibleRows.map((r) => (
                      <tr key={r.nh_ma} className="hover:bg-slate-50/70">
                        <td className={TD}>
                          <div
                            className="flex items-center gap-1"
                            style={{ paddingLeft: `${r.level * 18}px` }}
                          >
                            {r.hasChildren ? (
                              <button
                                type="button"
                                onClick={() => toggle(r.nh_ma)}
                                className="grid h-5 w-5 place-items-center rounded text-slate-400 hover:bg-slate-100"
                              >
                                <span className="material-symbols-outlined text-[16px]">
                                  {expanded.has(r.nh_ma)
                                    ? "expand_more"
                                    : "chevron_right"}
                                </span>
                              </button>
                            ) : (
                              <span className="inline-block h-5 w-5" />
                            )}
                            <span
                              className={
                                r.level === 0
                                  ? "font-semibold text-slate-800"
                                  : ""
                              }
                            >
                              {r.nh_ten}
                            </span>
                          </div>
                        </td>
                        <td className={`${TD} text-right`}>{r.so_sp}</td>
                        <td className={`${TD} text-right`}>{r.so_luong}</td>
                        <td className={`${TD} text-right`}>{r.so_don}</td>
                        <td className={`${TD} text-right text-sky-700`}>
                          {money(r.doanh_thu)}
                        </td>
                        <td className={`${TD} text-right text-amber-700`}>
                          {money(r.phi_san)}
                        </td>
                        <td className={`${TD} text-right text-emerald-700`}>
                          {money(r.shop_nhan)}
                        </td>
                        <td className={`${TD} text-right text-slate-500`}>
                          {Number(r.luot_xem || 0).toLocaleString("vi-VN")}
                        </td>
                        <td className={`${TD} text-right text-rose-600`}>
                          {Number(r.luot_thich || 0).toLocaleString("vi-VN")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="border-t-2 border-slate-200 bg-slate-50 font-semibold">
                    <tr>
                      <td className={TD}>Tổng</td>
                      <td className={`${TD} text-right`}>{kpi.so_sp}</td>
                      <td className={`${TD} text-right`}>{kpi.so_luong}</td>
                      <td className={`${TD} text-right`}>{kpi.so_don}</td>
                      <td className={`${TD} text-right text-sky-700`}>
                        {money(kpi.doanh_thu)}
                      </td>
                      <td className={`${TD} text-right text-amber-700`}>
                        {money(kpi.phi_san)}
                      </td>
                      <td className={`${TD} text-right text-emerald-700`}>
                        {money(kpi.shop_nhan)}
                      </td>
                      <td className={`${TD} text-right text-slate-500`}>
                        {Number(kpi.luot_xem || 0).toLocaleString("vi-VN")}
                      </td>
                      <td className={`${TD} text-right text-rose-600`}>
                        {Number(kpi.luot_thich || 0).toLocaleString("vi-VN")}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </>
        )}

        {/* ===== Theo thương hiệu ===== */}
        {viewMode === "thuong-hieu" && (
          <>
            <div className="mb-4 flex flex-wrap items-end gap-3">
              <label className="flex min-w-[260px] flex-col gap-1">
                <span className="text-xs font-medium text-slate-500">
                  Tìm mã / tên thương hiệu
                </span>
                <input
                  className={INPUT}
                  value={thQInput}
                  placeholder="VD: TH001 hoặc Tên thương hiệu"
                  onChange={(e) => setThQInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter")
                      setThFilter((p) => ({
                        ...p,
                        q: thQInput.trim(),
                        page: 1,
                      }));
                  }}
                />
              </label>
              <button
                type="button"
                onClick={() =>
                  setThFilter((p) => ({ ...p, q: thQInput.trim(), page: 1 }))
                }
                className="flex h-10 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                <span className="material-symbols-outlined text-[18px]">
                  search
                </span>
                Tìm
              </button>
              <label className="ml-auto flex flex-col gap-1">
                <span className="text-xs font-medium text-slate-500">
                  Số dòng
                </span>
                <select
                  className={`${INPUT} w-[100px]`}
                  value={thFilter.limit}
                  onChange={(e) =>
                    setThFilter((p) => ({
                      ...p,
                      limit: Number(e.target.value),
                      page: 1,
                    }))
                  }
                >
                  {[10, 20, 50].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {thLoading ? (
              <p className="py-10 text-center text-sm text-slate-500">
                Đang tải thương hiệu...
              </p>
            ) : thList.rows.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1120px] border-collapse">
                  <thead className="border-b border-slate-200 bg-slate-50">
                    <tr>
                      <th className={TH}>Thương hiệu</th>
                      <th className={`${TH} text-right`}>SP bán</th>
                      <th className={`${TH} text-right`}>SL bán</th>
                      <th className={`${TH} text-right`}>Đơn</th>
                      <th className={`${TH} text-right`}>Doanh thu</th>
                      <th className={`${TH} text-right`}>Phí sàn</th>
                      <th className={`${TH} text-right`}>Shop nhận</th>
                      <th className={`${TH} text-right`}>Lượt xem</th>
                      <th className={`${TH} text-right`}>Lượt thích</th>
                      <th className={`${TH} text-right`}>TB / đơn</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {thList.rows.map((r) => (
                      <tr key={r.th_ma} className="hover:bg-slate-50/70">
                        <td className={TD}>
                          <div
                            className={`font-medium ${
                              r.th_ma === "__KHONG_XAC_DINH__"
                                ? "italic text-slate-500"
                                : "text-slate-800"
                            }`}
                          >
                            {r.th_ten}
                          </div>
                          {r.th_ma !== "__KHONG_XAC_DINH__" && (
                            <div className="font-mono text-[11px] text-slate-400">
                              {r.th_ma}
                            </div>
                          )}
                        </td>
                        <td className={`${TD} text-right`}>{r.so_sp}</td>
                        <td className={`${TD} text-right`}>{r.so_luong}</td>
                        <td className={`${TD} text-right`}>{r.so_don}</td>
                        <td className={`${TD} text-right text-sky-700`}>
                          {money(r.doanh_thu)}
                        </td>
                        <td className={`${TD} text-right text-amber-700`}>
                          {money(r.phi_san)}
                        </td>
                        <td className={`${TD} text-right text-emerald-700`}>
                          {money(r.shop_nhan)}
                        </td>
                        <td className={`${TD} text-right text-slate-500`}>
                          {Number(r.luot_xem || 0).toLocaleString("vi-VN")}
                        </td>
                        <td className={`${TD} text-right text-rose-600`}>
                          {Number(r.luot_thich || 0).toLocaleString("vi-VN")}
                        </td>
                        <td className={`${TD} text-right text-slate-500`}>
                          {r.so_don > 0 ? money(r.doanh_thu / r.so_don) : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="border-t-2 border-slate-200 bg-slate-50 font-semibold">
                    <tr>
                      <td className={TD}>Tổng</td>
                      <td className={`${TD} text-right`}>{kpi.so_sp}</td>
                      <td className={`${TD} text-right`}>{kpi.so_luong}</td>
                      <td className={`${TD} text-right`}>{kpi.so_don}</td>
                      <td className={`${TD} text-right text-sky-700`}>
                        {money(kpi.doanh_thu)}
                      </td>
                      <td className={`${TD} text-right text-amber-700`}>
                        {money(kpi.phi_san)}
                      </td>
                      <td className={`${TD} text-right text-emerald-700`}>
                        {money(kpi.shop_nhan)}
                      </td>
                      <td className={`${TD} text-right text-slate-500`}>
                        {Number(kpi.luot_xem || 0).toLocaleString("vi-VN")}
                      </td>
                      <td className={`${TD} text-right text-rose-600`}>
                        {Number(kpi.luot_thich || 0).toLocaleString("vi-VN")}
                      </td>
                      <td className={`${TD} text-right text-slate-500`}>
                        {kpi.so_don > 0
                          ? money(kpi.doanh_thu / kpi.so_don)
                          : "—"}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}

            <PagerTK
              page={thList.page}
              totalPages={thList.total_pages}
              total={thList.total}
              label="thương hiệu"
              onChange={(p) => setThFilter((prev) => ({ ...prev, page: p }))}
            />
          </>
        )}

        {/* ===== Theo sản phẩm ===== */}
        {viewMode === "san-pham" && (
          <>
            <div className="mb-4 flex flex-wrap items-end gap-3">
              <label className="flex min-w-[260px] flex-col gap-1">
                <span className="text-xs font-medium text-slate-500">
                  Tìm mã / tên sản phẩm
                </span>
                <input
                  className={INPUT}
                  value={spQInput}
                  placeholder="VD: SP001, tên sản phẩm"
                  onChange={(e) => setSpQInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter")
                      setSpFilter((p) => ({
                        ...p,
                        q: spQInput.trim(),
                        page: 1,
                      }));
                  }}
                />
              </label>
              <button
                type="button"
                onClick={() =>
                  setSpFilter((p) => ({
                    ...p,
                    q: spQInput.trim(),
                    page: 1,
                  }))
                }
                className="flex h-10 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                <span className="material-symbols-outlined text-[18px]">
                  search
                </span>
                Tìm
              </button>

              <label className="ml-auto flex flex-col gap-1">
                <span className="text-xs font-medium text-slate-500">
                  Sắp xếp
                </span>
                <select
                  className={`${INPUT} w-[130px]`}
                  value={spFilter.sort}
                  onChange={(e) =>
                    setSpFilter((p) => ({
                      ...p,
                      sort: e.target.value,
                      page: 1,
                    }))
                  }
                >
                  {SORT_OPTIONS.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-slate-500">
                  Số sản phẩm
                </span>
                <select
                  className={`${INPUT} w-[120px]`}
                  value={spFilter.limit}
                  onChange={(e) =>
                    setSpFilter((p) => ({
                      ...p,
                      limit: Number(e.target.value),
                      page: 1,
                    }))
                  }
                >
                  {SP_LIMITS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {spLoading ? (
              <p className="py-10 text-center text-sm text-slate-500">
                Đang tải sản phẩm...
              </p>
            ) : spList.rows.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1180px] border-collapse">
                  <thead className="border-b border-slate-200 bg-slate-50">
                    <tr>
                      <th className={TH}>Sản phẩm</th>
                      <th className={TH}>Danh mục</th>
                      <th className={`${TH} text-right`}>SL bán</th>
                      <th className={`${TH} text-right`}>Đơn</th>
                      <th className={`${TH} text-right`}>Doanh thu</th>
                      <th className={`${TH} text-right`}>Phí sàn</th>
                      <th className={`${TH} text-right`}>Shop nhận</th>
                      <th className={`${TH} text-right`}>Lượt xem</th>
                      <th className={`${TH} text-right`}>Lượt thích</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {spList.rows.map((r) => (
                      <tr key={r.ctsp_ma} className="hover:bg-slate-50/70">
                        <td className={TD}>
                          <div className="font-medium text-slate-800">
                            {r.sp_ten}
                          </div>
                          <div className="text-xs text-slate-500">
                            {r.ctsp_ten}
                          </div>
                          <div className="font-mono text-[11px] text-slate-400">
                            {r.ctsp_ma}
                          </div>
                        </td>
                        <td className={`${TD} text-slate-600`}>{r.nh_ten}</td>
                        <td className={`${TD} text-right`}>{r.so_luong}</td>
                        <td className={`${TD} text-right`}>{r.so_don}</td>
                        <td className={`${TD} text-right text-sky-700`}>
                          {money(r.doanh_thu)}
                        </td>
                        <td className={`${TD} text-right text-amber-700`}>
                          {money(r.phi_san)}
                        </td>
                        <td className={`${TD} text-right text-emerald-700`}>
                          {money(r.shop_nhan)}
                        </td>
                        <td className={`${TD} text-right text-slate-500`}>
                          {Number(r.luot_xem || 0).toLocaleString("vi-VN")}
                        </td>
                        <td className={`${TD} text-right text-rose-600`}>
                          {Number(r.luot_thich || 0).toLocaleString("vi-VN")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {spList.limit > 0 ? (
              <PagerTK
                page={spList.page}
                totalPages={spList.total_pages}
                total={spList.total}
                label="sản phẩm"
                onChange={(p) => setSpFilter((prev) => ({ ...prev, page: p }))}
              />
            ) : (
              <p className="mt-4 text-xs text-slate-500">
                Tổng <strong className="text-slate-700">{spList.total}</strong>{" "}
                sản phẩm
              </p>
            )}
          </>
        )}
      </SectionCard>

      <ToastNotification toast={toast} />
    </div>
  );
};

export default ThongKeDoanhThu;
