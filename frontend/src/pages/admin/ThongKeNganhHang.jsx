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

const ThongKeNganhHang = () => {
  const [danhMuc, setDanhMuc] = useState({
    nganh_hang: [],
    shop: [],
    thuong_hieu: [],
    nam: [],
    nam_mac_dinh: null,
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
          nam_mac_dinh: data.nam_mac_dinh ?? null,
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

  // ---- Xuất CSV theo đúng bảng đang xem ----
  const exportCsv = () => {
    const suffix = `${filters.nam}${
      filters.thang ? `-T${filters.thang}` : ""
    }${filters.th_ma ? `-${filters.th_ma}` : ""}`;

    if (viewMode === "nganh-hang") {
      if (visibleRows.length === 0)
        return showToast("Không có dữ liệu để xuất", "error");
      downloadCsv(
        `thong-ke-nganh-hang-${suffix}`,
        [
          "Ngành hàng",
          "SP bán",
          "SL bán",
          "Đơn",
          "Doanh thu",
          "Phí sàn",
          "Shop nhận",
          "Lượt xem",
          "Lượt thích",
        ],
        visibleRows.map((r) => [
          `${"  ".repeat(r.level)}${r.nh_ten}`,
          r.so_sp,
          r.so_luong,
          r.so_don,
          r.doanh_thu,
          r.phi_san,
          r.shop_nhan,
          r.luot_xem,
          r.luot_thich,
        ]),
      );
    } else if (viewMode === "thuong-hieu") {
      if (thList.rows.length === 0)
        return showToast("Không có dữ liệu để xuất", "error");
      downloadCsv(
        `thong-ke-thuong-hieu-${suffix}`,
        [
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
        ],
        thList.rows.map((r) => [
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
        ]),
      );
    } else if (viewMode === "shop") {
      if (shopList.rows.length === 0)
        return showToast("Không có dữ liệu để xuất", "error");
      downloadCsv(
        `thong-ke-shop-${suffix}`,
        [
          "Shop",
          "Đơn",
          "SL bán",
          "Doanh thu",
          "Phí sàn",
          "Shop nhận",
          "Lượt xem",
          "Lượt thích",
        ],
        shopList.rows.map((r) => [
          r.gh_ten,
          r.so_don,
          r.so_luong,
          r.doanh_thu,
          r.phi_san,
          r.shop_nhan,
          r.luot_xem,
          r.luot_thich,
        ]),
      );
    } else {
      if (spList.rows.length === 0)
        return showToast("Không có dữ liệu để xuất", "error");
      downloadCsv(
        `thong-ke-san-pham-${suffix}`,
        [
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
        ],
        spList.rows.map((r) => [
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
        ]),
      );
    }

    showToast("Đã xuất file CSV");
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
        onExport={exportCsv}
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
