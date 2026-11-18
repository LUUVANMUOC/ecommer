// frontend/src/pages/admin/ThongKeNganhHang.jsx
import { useCallback, useEffect, useMemo, useState } from "react";
import thongKeNganhHangService from "../../services/san/thongKeNganhHangService";
import ToastNotification from "../../components/common/Crud/ToastNotification";
import {
  INPUT,
  money,
  KpiCard,
  SectionCard,
  EmptyState,
} from "../../components/admin/dongtien/DongTienUI";
import {
  FilterBarTK,
  PagerTK,
  buildCategoryTree,
  flattenCategoryTree,
} from "../../components/admin/thongke/ThongKeUI";

const NAM_HIEN_TAI = new Date().getFullYear();

const VIEWS = [
  { id: "nganh-hang", label: "Theo ngành hàng", icon: "account_tree" },
  { id: "thuong-hieu", label: "Theo thương hiệu", icon: "sell" },
  { id: "shop", label: "Theo shop", icon: "storefront" },
  { id: "san-pham", label: "Theo sản phẩm", icon: "inventory_2" },
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

// ==================================================================
// EXCEL HELPERS
// ==================================================================
const exportExcelReport = async ({ filename, rows, sheetName = "BaoCao" }) => {
  const ExcelJSMod = await import("exceljs");
  const ExcelJS = ExcelJSMod.default || ExcelJSMod;
  const fileSaverMod = await import("file-saver");
  const saveAs =
    fileSaverMod.saveAs || fileSaverMod.default?.saveAs || fileSaverMod.default;

  const wb = new ExcelJS.Workbook();
  wb.creator = "Shop Analytics";
  wb.created = new Date();

  const ws = wb.addWorksheet(sheetName, {
    views: [{ state: "frozen", ySplit: 1 }],
  });

  rows.forEach((r) => ws.addRow(Array.isArray(r.cells) ? r.cells : [r.cells]));

  const maxCol = Math.max(
    ...rows.map((r) => (Array.isArray(r.cells) ? r.cells.length : 1)),
    2,
  );

  rows.forEach((r, i) => {
    const excelRow = ws.getRow(i + 1);

    if (r.type === "title") {
      excelRow.font = { bold: true, size: 14, color: { argb: "FF0F172A" } };
      excelRow.height = 22;
      ws.mergeCells(i + 1, 1, i + 1, maxCol);
    } else if (r.type === "section") {
      excelRow.font = { bold: true, size: 12, color: { argb: "FF0F172A" } };
      excelRow.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFE2E8F0" },
      };
      excelRow.height = 20;
      ws.mergeCells(i + 1, 1, i + 1, maxCol);
    } else if (r.type === "header") {
      excelRow.font = { bold: true, color: { argb: "FF334155" } };
      excelRow.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFF1F5F9" },
      };
      excelRow.eachCell((cell) => {
        cell.border = {
          bottom: { style: "thin", color: { argb: "FFCBD5E1" } },
        };
      });
    } else if (r.type === "total") {
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
    } else if (r.type === "note") {
      excelRow.font = {
        italic: true,
        size: 10,
        color: { argb: "FF64748B" },
      };
    }

    if (r.moneyCols) {
      r.moneyCols.forEach((c) => {
        const cell = excelRow.getCell(c);
        cell.numFmt = "#,##0";
        cell.alignment = { ...cell.alignment, horizontal: "right" };
      });
    }
  });

  for (let c = 1; c <= maxCol; c++) {
    let w = 10;
    rows.forEach((r) => {
      if (!Array.isArray(r.cells)) return;
      const v = r.cells[c - 1];
      const s = v == null ? "" : String(v);
      if (s.length > w) w = Math.min(s.length + 2, 40);
    });
    ws.getColumn(c).width = w;
  }

  const buf = await wb.xlsx.writeBuffer();
  saveAs(
    new Blob([buf], { type: "application/octet-stream" }),
    `${filename}.xlsx`,
  );
};

// ==================================================================
// COMPONENT
// ==================================================================
const ThongKeNganhHang = () => {
  const [danhMuc, setDanhMuc] = useState({
    nganh_hang: [],
    shop: [],
    thuong_hieu: [],
    nam: [],
  });
  const [filters, setFilters] = useState({
    nh_ma: "",
    th_ma: "",
    gh_ma: "",
    nam: "",
    thang: "",
  });
  const [ready, setReady] = useState(false);

  // 4 chế độ xem
  const [viewMode, setViewMode] = useState("nganh-hang");

  const [loading, setLoading] = useState(true);
  const [tongQuan, setTongQuan] = useState(null);

  // Ngành hàng
  const [nganh, setNganh] = useState([]);
  const [nganhLoading, setNganhLoading] = useState(false);
  const [expanded, setExpanded] = useState(new Set());

  // Shop
  const [shopList, setShopList] = useState({
    rows: [],
    total: 0,
    page: 1,
    total_pages: 1,
  });
  const [shopLoading, setShopLoading] = useState(false);
  const [shopFilter, setShopFilter] = useState({ q: "", page: 1, limit: 10 });
  const [shopQInput, setShopQInput] = useState("");

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

  // ---- Danh mục: load trước, sau đó mới set năm mặc định và tải dữ liệu ----
  useEffect(() => {
    let alive = true;

    thongKeNganhHangService
      .getDanhMuc()
      .then((r) => {
        if (!alive) return;
        const data = r.data || {};
        const dsNam = data.nam || [];

        setDanhMuc({
          nganh_hang: data.nganh_hang || [],
          shop: data.shop || [],
          thuong_hieu: data.thuong_hieu || [],
          nam: dsNam,
        });

        const namMacDinh = data.nam_mac_dinh ?? dsNam[0] ?? NAM_HIEN_TAI;

        setFilters((f) => ({
          ...f,
          nam: f.nam || String(namMacDinh),
        }));

        setReady(true);
      })
      .catch(() => {
        if (!alive) return;
        showToast("Không tải được danh mục", "error");
        setReady(true);
      });

    return () => {
      alive = false;
    };
  }, [showToast]);

  const params = useMemo(() => {
    if (!ready) return null;
    return {
      nh_ma: filters.nh_ma || undefined,
      th_ma: filters.th_ma || undefined,
      gh_ma: filters.gh_ma || undefined,
      nam: filters.nam || undefined,
      thang: filters.thang || undefined,
    };
  }, [ready, filters]);

  // ---- Cây danh mục phẳng (dùng cho lookup tên trong export) ----
  const catRows = useMemo(() => {
    const list = danhMuc.nganh_hang || [];
    return flattenCategoryTree(
      buildCategoryTree(list),
      new Set(list.map((n) => n.nh_ma)),
    );
  }, [danhMuc.nganh_hang]);

  // ---- 6 ô KPI (luôn chạy theo bộ lọc) ----
  const loadTongQuan = useCallback(async () => {
    if (!params) return;
    setLoading(true);
    try {
      const res = await thongKeNganhHangService.getTongQuan(params);
      setTongQuan(res.data);
    } catch (e) {
      showToast(e.response?.data?.message || "Lỗi tải tổng quan", "error");
    } finally {
      setLoading(false);
    }
  }, [params, showToast]);

  useEffect(() => {
    loadTongQuan();
  }, [loadTongQuan]);

  // ---- Theo ngành hàng ----
  const loadNganh = useCallback(async () => {
    if (!params) return;
    setNganhLoading(true);
    try {
      const res = await thongKeNganhHangService.getTheoNganh(params);
      setNganh(res.data.rows || []);
    } catch (e) {
      showToast(e.response?.data?.message || "Lỗi tải ngành hàng", "error");
    } finally {
      setNganhLoading(false);
    }
  }, [params, showToast]);

  useEffect(() => {
    if (viewMode === "nganh-hang") loadNganh();
  }, [viewMode, loadNganh]);

  // ---- Theo shop ----
  const loadShop = useCallback(async () => {
    if (!params) return;
    setShopLoading(true);
    try {
      const res = await thongKeNganhHangService.getTheoShop({
        ...params,
        q: shopFilter.q || undefined,
        page: shopFilter.page,
        limit: shopFilter.limit,
      });
      setShopList(res.data);
    } catch (e) {
      showToast(e.response?.data?.message || "Lỗi tải danh sách shop", "error");
    } finally {
      setShopLoading(false);
    }
  }, [params, shopFilter, showToast]);

  useEffect(() => {
    if (viewMode === "shop") loadShop();
  }, [viewMode, loadShop]);

  // ---- Theo thương hiệu ----
  const loadThuongHieu = useCallback(async () => {
    if (!params) return;
    setThLoading(true);
    try {
      const res = await thongKeNganhHangService.getTheoThuongHieu({
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
  }, [params, thFilter, showToast]);

  useEffect(() => {
    if (viewMode === "thuong-hieu") loadThuongHieu();
  }, [viewMode, loadThuongHieu]);

  // ---- Theo sản phẩm ----
  const loadSanPham = useCallback(async () => {
    if (!params) return;
    setSpLoading(true);
    try {
      const res = await thongKeNganhHangService.getTheoSanPham({
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
  }, [params, spFilter, showToast]);

  useEffect(() => {
    if (viewMode === "san-pham") loadSanPham();
  }, [viewMode, loadSanPham]);

  // Đổi bộ lọc → về trang 1 (không đổi từ khóa)
  useEffect(() => {
    setShopFilter((p) => (p.page === 1 ? p : { ...p, page: 1 }));
    setThFilter((p) => (p.page === 1 ? p : { ...p, page: 1 }));
    setSpFilter((p) => (p.page === 1 ? p : { ...p, page: 1 }));
  }, [filters]);

  const reloadAll = () => {
    if (!params) return;
    loadTongQuan();
    if (viewMode === "nganh-hang") loadNganh();
    if (viewMode === "thuong-hieu") loadThuongHieu();
    if (viewMode === "shop") loadShop();
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
        label: "Phí sàn nhận",
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

  // ---- Tiêu đề / phụ đề theo chế độ xem ----
  const sortLabel =
    SORT_OPTIONS.find((s) => s.value === spFilter.sort)?.label || "Doanh thu";

  const sectionTitle =
    viewMode === "nganh-hang"
      ? "Doanh thu theo ngành hàng"
      : viewMode === "thuong-hieu"
        ? "Doanh thu theo thương hiệu"
        : viewMode === "shop"
          ? "Doanh thu theo shop"
          : "Top sản phẩm";

  const sectionSubtitle =
    viewMode === "nganh-hang"
      ? "Ngành cha đã cộng dồn toàn bộ ngành con · lượt xem/thích tính trên toàn bộ sản phẩm của ngành"
      : viewMode === "thuong-hieu"
        ? "Mỗi dòng là một thương hiệu · sản phẩm chưa gán thương hiệu gom vào dòng “Chưa xác định thương hiệu” · lượt xem/thích là số lũy kế"
        : viewMode === "shop"
          ? "Lượt xem/thích là số lũy kế trên toàn bộ sản phẩm của shop"
          : `Xếp theo ${sortLabel} · mỗi dòng là một phân loại sản phẩm`;

  // ==================================================================
  // XUẤT EXCEL
  // ==================================================================
  const exportExcel = async () => {
    const suffix = `${filters.nam}${
      filters.thang ? `-T${filters.thang}` : ""
    }${filters.nh_ma ? `-${filters.nh_ma}` : ""}${
      filters.th_ma ? `-${filters.th_ma}` : ""
    }${filters.gh_ma ? `-${filters.gh_ma}` : ""}`;

    // Filter label
    const filterParts = [];
    if (filters.nh_ma) {
      const cat = catRows.find((c) => c.nh_ma === filters.nh_ma);
      filterParts.push(`Ngành hàng: ${cat?.nh_ten || filters.nh_ma}`);
    }
    if (filters.th_ma) {
      const th = (danhMuc.thuong_hieu || []).find(
        (t) => t.th_ma === filters.th_ma,
      );
      filterParts.push(`Thương hiệu: ${th?.th_ten || filters.th_ma}`);
    }
    if (filters.gh_ma) {
      const sh = (danhMuc.shop || []).find((s) => s.gh_ma === filters.gh_ma);
      filterParts.push(`Shop: ${sh?.gh_ten || filters.gh_ma}`);
    }
    const filterLabel = filterParts.length ? filterParts.join(" · ") : "Không";
    const periodLabel = `Năm ${filters.nam}${
      filters.thang ? ` - Tháng ${filters.thang}` : ""
    }`;

    let filename;
    let detailTitle;
    let headers;
    let dataRows;
    let totalsRow = null;
    let note;
    let moneyCols;

    if (viewMode === "nganh-hang") {
      if (visibleRows.length === 0)
        return showToast("Không có dữ liệu để xuất", "error");
      filename = `thong-ke-nganh-hang-${suffix}`;
      detailTitle = "CHI TIẾT DOANH THU THEO NGÀNH HÀNG";
      headers = [
        "Ngành hàng",
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
      moneyCols = [5, 6, 7];
    } else if (viewMode === "thuong-hieu") {
      if (thList.rows.length === 0)
        return showToast("Không có dữ liệu để xuất", "error");
      filename = `thong-ke-thuong-hieu-${suffix}`;
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
      moneyCols = [6, 7, 8, 11];
      if (thList.total_pages > 1) {
        note = `Dữ liệu trang ${thList.page}/${thList.total_pages} (${thList.rows.length}/${thList.total} thương hiệu) — tăng "Số dòng" để xuất đầy đủ hơn`;
      }
    } else if (viewMode === "shop") {
      if (shopList.rows.length === 0)
        return showToast("Không có dữ liệu để xuất", "error");
      filename = `thong-ke-shop-${suffix}`;
      detailTitle = "CHI TIẾT DOANH THU THEO SHOP";
      headers = [
        "Shop",
        "Đơn",
        "SL bán",
        "Doanh thu",
        "Phí sàn",
        "Shop nhận",
        "Lượt xem",
        "Lượt thích",
        "TB/đơn",
      ];
      dataRows = shopList.rows.map((r) => [
        r.gh_ten,
        r.so_don,
        r.so_luong,
        r.doanh_thu,
        r.phi_san,
        r.shop_nhan,
        r.luot_xem,
        r.luot_thich,
        r.so_don > 0 ? Math.round(r.doanh_thu / r.so_don) : "",
      ]);
      moneyCols = [4, 5, 6, 9];
      if (shopList.total_pages > 1) {
        note = `Dữ liệu trang ${shopList.page}/${shopList.total_pages} (${shopList.rows.length}/${shopList.total} shop) — tăng "Số dòng" để xuất đầy đủ hơn`;
      }
    } else {
      if (spList.rows.length === 0)
        return showToast("Không có dữ liệu để xuất", "error");
      filename = `thong-ke-san-pham-${suffix}`;
      detailTitle = "CHI TIẾT DOANH THU THEO SẢN PHẨM";
      headers = [
        "Mã phân loại",
        "Tên sản phẩm",
        "Phân loại",
        "Ngành hàng",
        "Shop",
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
        r.gh_ten,
        r.so_luong,
        r.so_don,
        r.doanh_thu,
        r.phi_san,
        r.shop_nhan,
        r.luot_xem,
        r.luot_thich,
      ]);
      moneyCols = [8, 9, 10];
      if (spList.limit > 0 && spList.total_pages > 1) {
        note = `Dữ liệu trang ${spList.page}/${spList.total_pages} (${spList.rows.length}/${spList.total} sản phẩm) — chọn "Tất cả" để xuất đầy đủ`;
      }
    }

    // ----- Build rows + meta -----
    const rows = [];
    const num = (v) => Number(v || 0);

    rows.push({ cells: ["BÁO CÁO THỐNG KÊ HÀNG"], type: "title" });
    rows.push({ cells: ["Đơn vị", "Toàn hệ thống"], type: "meta" });
    rows.push({ cells: ["Kỳ báo cáo", periodLabel], type: "meta" });
    rows.push({ cells: ["Bộ lọc", filterLabel], type: "meta" });
    if (note) rows.push({ cells: ["Ghi chú", note], type: "meta" });
    rows.push({
      cells: ["Ngày xuất", new Date().toLocaleString("vi-VN")],
      type: "meta",
    });
    rows.push({ cells: [], type: "blank" });

    // I. TỔNG QUAN
    rows.push({ cells: ["I. TỔNG QUAN"], type: "section" });
    rows.push({ cells: ["Chỉ tiêu", "Giá trị"], type: "header" });
    [
      ["Doanh thu hàng hóa", num(kpi.doanh_thu), true],
      ["Phí sàn", num(kpi.phi_san), true],
      ["Giảm giá shop", num(kpi.giam_gia_shop), true],
      ["Shop thực nhận", num(kpi.shop_nhan), true],
      ["Đơn hoàn thành", num(kpi.so_don), false],
      ["Số sản phẩm bán", num(kpi.so_sp), false],
      ["Số lượng bán", num(kpi.so_luong), false],
      ["Lượt xem", num(kpi.luot_xem), false],
      ["Lượt thích", num(kpi.luot_thich), false],
    ].forEach(([label, value, isMoney]) => {
      rows.push({
        cells: [label, value],
        type: "data",
        moneyCols: isMoney ? [2] : null,
      });
    });
    rows.push({ cells: [], type: "blank" });

    // II. CHI TIẾT
    rows.push({ cells: [`II. ${detailTitle}`], type: "section" });
    rows.push({ cells: headers, type: "header" });
    dataRows.forEach((r) => {
      rows.push({ cells: r, type: "data", moneyCols });
    });
    if (totalsRow) {
      rows.push({ cells: totalsRow, type: "total", moneyCols });
    }
    rows.push({ cells: [], type: "blank" });
    rows.push({ cells: ["— Hết báo cáo —"], type: "note" });

    try {
      await exportExcelReport({ filename, rows });
      showToast("Đã xuất báo cáo Excel");
    } catch (e) {
      showToast(e?.message || "Lỗi xuất báo cáo Excel", "error");
    }
  };

  // Nút chuyển 4 chế độ xem (không phải bộ lọc)
  const viewToggle = (
    <div className="flex shrink-0 flex-wrap rounded-xl border border-slate-200 bg-slate-50 p-1">
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
  );

  const currentLoading =
    viewMode === "nganh-hang"
      ? nganhLoading
      : viewMode === "thuong-hieu"
        ? thLoading
        : viewMode === "shop"
          ? shopLoading
          : spLoading;

  return (
    <div className="min-h-screen space-y-5 bg-[#F8FAFC] p-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0F172A]">Thống kê hàng</h1>
      </div>

      <FilterBarTK
        danhMuc={danhMuc}
        filters={filters}
        onChange={setFilters}
        onReload={reloadAll}
        loading={loading || !ready || currentLoading}
        onExport={exportExcel}
      />

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
        {viewMode === "nganh-hang" && (
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
                Đang tải ngành hàng...
              </p>
            ) : visibleRows.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1120px] border-collapse">
                  <thead className="border-b border-slate-200 bg-slate-50">
                    <tr>
                      <th className={TH}>Ngành hàng</th>
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

        {viewMode === "shop" && (
          <>
            <div className="mb-4 flex flex-wrap items-end gap-3">
              <label className="flex min-w-[260px] flex-col gap-1">
                <span className="text-xs font-medium text-slate-500">
                  Tìm mã / tên shop
                </span>
                <input
                  className={INPUT}
                  value={shopQInput}
                  placeholder="VD: GH001 hoặc Tên shop"
                  onChange={(e) => setShopQInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter")
                      setShopFilter((p) => ({
                        ...p,
                        q: shopQInput.trim(),
                        page: 1,
                      }));
                  }}
                />
              </label>
              <button
                type="button"
                onClick={() =>
                  setShopFilter((p) => ({
                    ...p,
                    q: shopQInput.trim(),
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
                  Số dòng
                </span>
                <select
                  className={`${INPUT} w-[100px]`}
                  value={shopFilter.limit}
                  onChange={(e) =>
                    setShopFilter((p) => ({
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

            {shopLoading ? (
              <p className="py-10 text-center text-sm text-slate-500">
                Đang tải shop...
              </p>
            ) : shopList.rows.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1080px] border-collapse">
                  <thead className="border-b border-slate-200 bg-slate-50">
                    <tr>
                      <th className={TH}>Shop</th>
                      <th className={`${TH} text-right`}>Đơn</th>
                      <th className={`${TH} text-right`}>SL bán</th>
                      <th className={`${TH} text-right`}>Doanh thu</th>
                      <th className={`${TH} text-right`}>Phí sàn</th>
                      <th className={`${TH} text-right`}>Shop nhận</th>
                      <th className={`${TH} text-right`}>Lượt xem</th>
                      <th className={`${TH} text-right`}>Lượt thích</th>
                      <th className={`${TH} text-right`}>TB / đơn</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {shopList.rows.map((r) => (
                      <tr key={r.gh_ma} className="hover:bg-slate-50/70">
                        <td className={`${TD} font-medium`}>{r.gh_ten}</td>
                        <td className={`${TD} text-right`}>{r.so_don}</td>
                        <td className={`${TD} text-right`}>{r.so_luong}</td>
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
                </table>
              </div>
            )}

            <PagerTK
              page={shopList.page}
              totalPages={shopList.total_pages}
              total={shopList.total}
              label="shop"
              onChange={(p) => setShopFilter((prev) => ({ ...prev, page: p }))}
            />
          </>
        )}

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
                  placeholder="VD: SP001, tên sản phẩm, tên shop"
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
                <table className="w-full min-w-[1300px] border-collapse">
                  <thead className="border-b border-slate-200 bg-slate-50">
                    <tr>
                      <th className={TH}>Sản phẩm</th>
                      <th className={TH}>Ngành hàng</th>
                      <th className={TH}>Shop</th>
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
                        <td className={`${TD} text-slate-600`}>{r.gh_ten}</td>
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

export default ThongKeNganhHang;
