// frontend/src/pages/admin/QuanLyPhiVanChuyen.jsx
import { useCallback, useEffect, useMemo, useState } from "react";
import phiVanChuyenService from "../../services/san/phiVanChuyenService";
import ToastNotification from "../../components/common/Crud/ToastNotification";
import {
  INPUT,
  money,
  fmtDate,
  KpiCard,
  SectionCard,
  EmptyState,
} from "../../components/admin/dongtien/DongTienUI";
import {
  FilterBarVC,
  ChiBadge,
  PagerVC,
} from "../../components/admin/vanchuyen/VanChuyenUI";

const NAM_HIEN_TAI = new Date().getFullYear();

const TH =
  "whitespace-nowrap px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500";
const TD = "px-3 py-2.5 text-sm text-slate-700";

const VIEWS = [
  { id: "dvvc", label: "Theo ĐVVC", icon: "local_shipping" },
  { id: "don-hang", label: "Theo đơn hàng", icon: "receipt_long" },
];

const QuanLyPhiVanChuyen = () => {
  const [danhMuc, setDanhMuc] = useState({ dvvc: [], nam: [NAM_HIEN_TAI] });
  const [filters, setFilters] = useState({
    dvvc_ma: "",
    nam: String(NAM_HIEN_TAI),
    thang: "",
  });

  // Chế độ xem: "dvvc" = tổng hợp theo ĐVVC, "don-hang" = danh sách đơn
  const [viewMode, setViewMode] = useState("dvvc");

  const [tongQuan, setTongQuan] = useState(null);
  const [loading, setLoading] = useState(false);

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

  const isOrderView = viewMode === "don-hang";

  // ---- Danh mục ĐVVC / năm ----
  useEffect(() => {
    phiVanChuyenService
      .getDanhMuc()
      .then((r) => setDanhMuc(r.data))
      .catch(() => showToast("Không tải được danh mục ĐVVC/năm", "error"));
  }, [showToast]);

  // ---- Tổng quan: 6 ô KPI + bảng theo ĐVVC (luôn theo bộ lọc) ----
  const loadTongQuan = useCallback(async () => {
    setLoading(true);
    try {
      const res = await phiVanChuyenService.getTongQuan({
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
      setLoading(false);
    }
  }, [filters.dvvc_ma, filters.nam, filters.thang, showToast]);

  // ---- Danh sách đơn (chạy cả khi chưa chọn ĐVVC) ----
  const loadDanhSach = useCallback(async () => {
    setListLoading(true);
    try {
      const res = await phiVanChuyenService.getDanhSach({
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
  }, [filters.dvvc_ma, filters.nam, filters.thang, listFilter, showToast]);

  useEffect(() => {
    loadTongQuan();
  }, [loadTongQuan]);

  useEffect(() => {
    if (!isOrderView) return;
    loadDanhSach();
  }, [isOrderView, loadDanhSach]);

  // Đổi bộ lọc → về trang 1 và xóa từ khóa
  const handleFilterChange = (next) => {
    setFilters(next);
    setListFilter({ q: "", page: 1, limit: 10 });
    setQInput("");
  };

  // Chuyển chế độ xem → reset tìm kiếm/phân trang
  const changeView = (mode) => {
    if (mode === viewMode) return;
    setViewMode(mode);
    setListFilter({ q: "", page: 1, limit: 10 });
    setQInput("");
  };

  const applySearch = () => {
    setListFilter((p) => ({ ...p, q: qInput.trim(), page: 1 }));
  };

  const reload = () => {
    loadTongQuan();
    if (isOrderView) loadDanhSach();
  };

  // ---- Dữ liệu dẫn xuất ----
  const kpi = tongQuan?.kpi || {};
  const theoDvvc = tongQuan?.theo_dvvc || [];
  const dvvcTenDangChon =
    danhMuc.dvvc.find((d) => d.dvvc_ma === filters.dvvc_ma)?.dvvc_ten || "";

  const kpiCards = useMemo(
    () => [
      {
        icon: "local_shipping",
        label: "Tổng phí ship trước voucher",
        value: money(kpi.phi_goc),
        tone: "blue",
        hint: `Theo ngày lập đơn · ${kpi.so_don ?? 0} đơn`,
      },
      {
        icon: "percent",
        label: "Sàn bù voucher ship",
        value: money(kpi.san_bu),
        tone: "amber",
        hint: `${kpi.so_don_san_bu ?? 0} đơn có sàn bù`,
      },
      {
        icon: "account_balance_wallet",
        label: "Khách trả phí ship (sau voucher)",
        value: money(kpi.khach_tra),
        tone: "indigo",
        hint: "Phí gốc − sàn bù",
      },
      {
        icon: "payments",
        label: "Đã chi cho ĐVVC",
        value: money(kpi.da_chi),
        tone: "emerald",
        hint: `${kpi.so_don_da_chi ?? 0} đơn đã chi`,
      },
      {
        icon: "pending_actions",
        label: "Chờ chi",
        value: money(kpi.cho_chi),
        tone: "red",
        hint: `${kpi.so_don_cho_chi ?? 0} đơn chờ chi`,
      },
      {
        icon: "inventory_2",
        label: "Số đơn trong kỳ",
        value: String(kpi.so_don ?? 0),
        tone: "slate",
        hint: `${kpi.so_don_khong_gg ?? 0} đơn không giảm giá`,
      },
    ],
    [kpi],
  );

  const tong = useMemo(
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

  // ---- Xuất CSV theo đúng bảng đang xem ----
  const exportCsv = () => {
    let headers;
    let rows;
    let name;

    if (isOrderView) {
      if (list.rows.length === 0)
        return showToast("Không có đơn hàng để xuất", "error");

      headers = [
        "Mã đơn",
        "ĐVVC",
        "Ngày lập",
        "Phí trước voucher",
        "Sàn bù",
        "Khách trả",
        "Mã phiếu",
        "Trạng thái",
      ];
      rows = list.rows.map((r) => [
        r.dts_ma,
        r.dvvc_ten,
        fmtDate(r.dts_ngaylap),
        r.phi_ship_goc,
        r.voucher_ship,
        r.khach_tra,
        r.pcd_ma || "",
        r.trang_thai,
      ]);
      name = filters.dvvc_ma
        ? `phí-vận-chuyển-${filters.dvvc_ma}`
        : "phí-vận-chuyển-đơn-hàng";
    } else {
      if (theoDvvc.length === 0)
        return showToast("Không có dữ liệu để xuất", "error");

      headers = [
        "Mã ĐVVC",
        "ĐVVC",
        "Số đơn",
        "Phí trước voucher",
        "Sàn bù",
        "Khách trả",
        "Đã chi",
        "Chờ chi",
      ];
      rows = theoDvvc.map((d) => [
        d.dvvc_ma,
        d.dvvc_ten,
        d.so_don,
        d.phi_goc,
        d.san_bu,
        d.khach_tra,
        d.da_chi,
        d.cho_chi,
      ]);
      name = "phí-vận-chuyển-theo-dvvc";
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

  // Ô tìm kiếm nằm trong cùng thanh lọc, chỉ hiện ở chế độ xem đơn hàng
  const searchBox = isOrderView ? (
    <label className="flex min-w-[240px] flex-col gap-1">
      <span className="text-xs font-medium text-slate-500">Tìm kiếm</span>
      <div className="flex items-center gap-2">
        <input
          className={`${INPUT} flex-1`}
          value={qInput}
          placeholder="Mã đơn hoặc tên ĐVVC"
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
          <span className="material-symbols-outlined text-[18px]">search</span>
        </button>
      </div>
    </label>
  ) : null;

  // Nút chuyển 2 chế độ xem (không phải bộ lọc)
  const viewToggle = (
    <div className="flex shrink-0 rounded-xl border border-slate-200 bg-slate-50 p-1">
      {VIEWS.map((v) => (
        <button
          key={v.id}
          type="button"
          onClick={() => changeView(v.id)}
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

  const busy = loading || (isOrderView && listLoading);

  return (
    <div className="min-h-screen space-y-5 bg-[#F8FAFC] p-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0F172A]">
          Quản lý phí vận chuyển
        </h1>
        <p className="mt-1 text-sm text-[#64748B]">
          Số liệu tính theo ngày lập đơn và không gồm đơn đã hủy. Dùng bộ lọc
          bên dưới, sau đó chuyển giữa 2 chế độ xem: theo ĐVVC hoặc theo đơn
          hàng.
        </p>
      </div>

      <FilterBarVC
        danhMuc={danhMuc}
        filters={filters}
        onChange={handleFilterChange}
        onReload={reload}
        loading={busy}
        onExport={exportCsv}
        extra={searchBox}
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {kpiCards.map((c) => (
          <KpiCard key={c.label} {...c} />
        ))}
      </div>

      {isOrderView ? (
        <SectionCard
          title="Thông tin đơn hàng"
          subtitle={`${dvvcTenDangChon || "Tất cả ĐVVC"} · Năm ${filters.nam}${
            filters.thang ? ` · tháng ${filters.thang}` : ""
          } · Phí trước voucher = Khách trả + Sàn bù`}
          action={viewToggle}
        >
          {listLoading ? (
            <p className="py-10 text-center text-sm text-slate-500">
              Đang tải đơn hàng...
            </p>
          ) : list.rows.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px] border-collapse">
                <thead className="border-b border-slate-200 bg-slate-50">
                  <tr>
                    <th className={TH}>Mã đơn</th>
                    <th className={TH}>ĐVVC</th>
                    <th className={TH}>Ngày lập</th>
                    <th className={`${TH} text-right`}>Phí trước voucher</th>
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
                      <td className={`${TD} text-slate-600`}>{r.dvvc_ten}</td>
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
                      <td className={`${TD} font-mono text-xs text-slate-500`}>
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
            onChange={(p) => setListFilter((prev) => ({ ...prev, page: p }))}
          />
        </SectionCard>
      ) : (
        <SectionCard
          title="Phí vận chuyển theo ĐVVC"
          subtitle={`${dvvcTenDangChon || "Tất cả ĐVVC"} · Năm ${filters.nam}${
            filters.thang ? ` · tháng ${filters.thang}` : ""
          } · Phí trước voucher = Khách trả + Sàn bù`}
          action={viewToggle}
        >
          {loading ? (
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
                    <th className={`${TH} text-right`}>Phí trước voucher</th>
                    <th className={`${TH} text-right`}>Sàn bù</th>
                    <th className={`${TH} text-right`}>Khách trả</th>
                    <th className={`${TH} text-right`}>Đã chi</th>
                    <th className={`${TH} text-right`}>Chờ chi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {theoDvvc.map((d) => (
                    <tr key={d.dvvc_ma} className="hover:bg-slate-50/70">
                      <td className={`${TD} font-medium`}>{d.dvvc_ten}</td>
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
                    <td className={`${TD} text-right`}>{tong.so_don}</td>
                    <td className={`${TD} text-right text-sky-700`}>
                      {money(tong.phi_goc)}
                    </td>
                    <td className={`${TD} text-right text-amber-700`}>
                      {money(tong.san_bu)}
                    </td>
                    <td className={`${TD} text-right text-indigo-700`}>
                      {money(tong.khach_tra)}
                    </td>
                    <td className={`${TD} text-right text-emerald-700`}>
                      {money(tong.da_chi)}
                    </td>
                    <td className={`${TD} text-right text-rose-600`}>
                      {money(tong.cho_chi)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </SectionCard>
      )}

      <ToastNotification toast={toast} />
    </div>
  );
};

export default QuanLyPhiVanChuyen;
