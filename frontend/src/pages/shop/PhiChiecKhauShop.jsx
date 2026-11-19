import { useContext, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AuthContext } from "../../contexts/AuthContext";
import { NotificationContext } from "../../contexts/NotificationContext";
import phiChiecKhauShopService from "../../services/gianhang/phiChiecKhauShopService";
import thongBaoService from "../../services/thongbao/thongBaoService";
import ToastNotification from "../../components/common/Crud/ToastNotification";

const so = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isNaN(n) ? null : n;
};

const fmtPhanTram = (value) => {
  const n = so(value);
  if (n === null) return "—";
  return `${n.toLocaleString("vi-VN", { maximumFractionDigits: 2 })}%`;
};

const fmtThoiGian = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("vi-VN", { hour12: false });
};

const TABS = [
  { key: "current", label: "Bảng phí hiện tại", icon: "percent" },
  { key: "history", label: "Lịch sử thay đổi", icon: "history" },
  { key: "notifications", label: "Thông báo từ sàn", icon: "notifications" },
];

const PhiChiecKhauShop = () => {
  const { user } = useContext(AuthContext);
  const gh_ma = user?.gh_ma || user?.GH_Ma || user?.id;

  const { phienBan, danhDauDaDoc } = useContext(NotificationContext);
  const [searchParams, setSearchParams] = useSearchParams();
  const nganhParam = searchParams.get("nganh") || "";
  const tabParam = searchParams.get("tab");

  const [data, setData] = useState({ san: null, nganh_hang: [], lich_su: [] });
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(tabParam === "lich-su" ? "history" : "current");

  const [chiShop, setChiShop] = useState(!nganhParam);
  const [search, setSearch] = useState("");
  const [nganhFilter, setNganhFilter] = useState(nganhParam);

  const [thongBao, setThongBao] = useState([]);
  const [feeUnread, setFeeUnread] = useState(0);
  const [loadingThongBao, setLoadingThongBao] = useState(false);
  const [dangXem, setDangXem] = useState(null);

  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast((p) => ({ ...p, show: false })), 3000);
  };

  const fetchPhi = async () => {
    if (!gh_ma) {
      setLoading(false);
      return;
    }
    try {
      const res = await phiChiecKhauShopService.get(gh_ma);
      setData(res.data || { san: null, nganh_hang: [], lich_su: [] });
    } catch (error) {
      showToast(
        error.response?.data?.message || "Không tải được bảng phí chiết khấu.",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchThongBao = async () => {
    if (!gh_ma) return;
    setLoadingThongBao(true);
    try {
      const res = await thongBaoService.getHopThu("SHOP", gh_ma, {
        loai: "PHI_CHIET_KHAU",
        page: 1,
        limit: 20,
      });
      const rows = res.data?.rows || [];
      setThongBao(rows);
      setFeeUnread(
        Number(res.data?.chua_doc) ||
          rows.filter((item) => !item.nn_dadoc).length,
      );
    } catch (error) {
      // Không chặn trang phí nếu hộp thư lỗi
    } finally {
      setLoadingThongBao(false);
    }
  };

  // Tải lại khi đổi shop hoặc có thông báo realtime
  useEffect(() => {
    fetchPhi();
    fetchThongBao();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gh_ma, phienBan]);

  // Mở từ link thông báo: ?nganh=NH_003&tab=lich-su
  useEffect(() => {
    if (!nganhParam) return;
    setNganhFilter(nganhParam);
    setChiShop(false);
    if (tabParam === "lich-su") setTab("history");
  }, [nganhParam, tabParam]);

  const dsNganh = data.nganh_hang || [];
  const dsLichSu = data.lich_su || [];

  const soNganhShop = useMemo(
    () => dsNganh.filter((r) => Number(r.SoSanPham) > 0).length,
    [dsNganh],
  );
  const tongSanPham = useMemo(
    () => dsNganh.reduce((tong, r) => tong + Number(r.SoSanPham || 0), 0),
    [dsNganh],
  );

  const q = search.trim().toLowerCase();

  const locTheo = (r) => {
    if (chiShop && !(Number(r.SoSanPham) > 0)) return false;
    if (nganhFilter && r.Nh_Ma !== nganhFilter) return false;
    if (q) {
      const chuoi = `${r.Nh_Ten || ""} ${r.Duong_Dan || ""} ${r.Nh_Ma || ""}`;
      if (!chuoi.toLowerCase().includes(q)) return false;
    }
    return true;
  };

  const nganhHienThi = dsNganh.filter(locTheo);

  // Tab lịch sử hiển thị toàn bộ thay đổi phí trên sàn, không lọc theo
  // "ngành shop đang bán". Vẫn giữ lọc theo ngành hàng khi mở từ thông báo.
  const locLichSu = (r) => {
    if (nganhFilter && r.Nh_Ma !== nganhFilter) return false;
    if (q) {
      const chuoi = `${r.Nh_Ten || ""} ${r.Duong_Dan || ""} ${r.Nh_Ma || ""}`;
      if (!chuoi.toLowerCase().includes(q)) return false;
    }
    return true;
  };

  const lichSuHienThi = dsLichSu.filter(locLichSu);
  const nganhDangLoc = nganhFilter
    ? dsNganh.find((r) => r.Nh_Ma === nganhFilter)
    : null;

  const boLocNganh = () => {
    setNganhFilter("");
    setSearchParams({}, { replace: true });
  };

  const phiCuDangXem = so(dangXem?.tb_phi_cu);
  const phiMoiDangXem = so(dangXem?.tb_phi_moi);
  const chenhLechDangXem =
    phiCuDangXem === null || phiMoiDangXem === null
      ? null
      : phiMoiDangXem - phiCuDangXem;

  const moThongBao = async (item) => {
    setDangXem(item);
    if (item.nn_dadoc) return;
    try {
      await danhDauDaDoc(item.tb_ma);
      setThongBao((cu) =>
        cu.map((tb) =>
          String(tb.tb_ma) === String(item.tb_ma)
            ? { ...tb, nn_dadoc: true }
            : tb,
        ),
      );
      setDangXem((cu) => (cu ? { ...cu, nn_dadoc: true } : cu));
      setFeeUnread((cu) => Math.max(0, cu - 1));
    } catch (error) {
      // Vẫn cho xem nội dung
    }
  };

  const xemNganhTuThongBao = () => {
    const ma = dangXem?.tb_doituong_ma;
    if (!ma) return;
    setNganhFilter(ma);
    setChiShop(false);
    setTab("history");
    setDangXem(null);
    setSearchParams({ nganh: ma, tab: "lich-su" }, { replace: true });
  };

  if (!gh_ma) {
    return (
      <div className="p-10 text-center text-sm text-[#64748B]">
        Không xác định được gian hàng đang đăng nhập.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-10 text-center font-medium text-[#64748B]">
        Đang tải bảng phí chiết khấu...
      </div>
    );
  }

  return (
    <div className="p-6 bg-[#F8FAFC] min-h-screen">
      {/* Tiêu đề */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A]">
            Phí Chiết Khấu
          </h1>
          <p className="text-sm text-[#64748B] mt-1">
            Mức phí sàn áp dụng theo ngành hàng và lịch sử thay đổi
          </p>
        </div>
        {data.san && (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-200 bg-orange-50 px-3 py-1.5 text-xs font-bold text-orange-700">
            <span className="material-symbols-outlined text-[16px]">
              storefront
            </span>
            {data.san.stmdt_ten}
          </span>
        )}
      </div>

      {/* Thống kê nhanh */}
      <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#64748B]">
            Ngành shop đang bán
          </p>
          <p className="mt-1 text-2xl font-bold text-[#0F172A]">
            {soNganhShop}
          </p>
        </div>
        <div className="rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#64748B]">
            Tổng phân loại sản phẩm
          </p>
          <p className="mt-1 text-2xl font-bold text-[#0F172A]">
            {tongSanPham.toLocaleString("vi-VN")}
          </p>
        </div>
        <div className="rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#64748B]">
            Lần đổi phí gần nhất
          </p>
          <p className="mt-1 text-sm font-bold text-[#0F172A]">
            {fmtThoiGian(dsLichSu[0]?.ThoiDiem)}
          </p>
        </div>
      </div>

      {/* Banner thông báo phí chưa đọc */}
      {feeUnread > 0 && tab !== "notifications" && (
        <button
          type="button"
          onClick={() => setTab("notifications")}
          className="mb-5 flex w-full items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-left transition hover:border-amber-300 hover:bg-amber-100/70"
        >
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-amber-100 text-amber-700">
            <span className="material-symbols-outlined">notifications_active</span>
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-bold text-amber-900">
              Sàn vừa cập nhật phí chiết khấu
            </span>
            <span className="block text-xs text-amber-800">
              Bạn có {feeUnread} thông báo chưa đọc. Bấm để xem chi tiết.
            </span>
          </span>
          <span className="shrink-0 text-sm font-bold text-amber-700">
            Xem ngay
          </span>
        </button>
      )}

      {/* Tabs */}
      <div className="mb-5 flex overflow-hidden rounded-xl border border-[#E2E8F0] bg-white shadow-sm">
        {TABS.map((item) => {
          const active = tab === item.key;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => setTab(item.key)}
              className={`flex flex-1 items-center justify-center gap-2 py-3 text-sm font-bold transition-colors ${
                active
                  ? "border-b-2 border-orange-600 bg-orange-50 text-orange-700"
                  : "text-[#64748B] hover:bg-gray-50"
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">
                {item.icon}
              </span>
              {item.label}
              {item.key === "notifications" && feeUnread > 0 && (
                <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
                  {feeUnread > 99 ? "99+" : feeUnread}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Bộ lọc cho bảng phí / lịch sử */}
      {tab !== "notifications" && (
        <div className="mb-5 flex flex-wrap items-center gap-3 rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-sm">
          <div className="relative min-w-[220px] flex-1">
            <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-gray-400">
              search
            </span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo tên hoặc mã ngành hàng..."
              className="h-10 w-full rounded-xl border border-[#E2E8F0] bg-white pl-9 pr-3 text-sm text-[#0F172A] outline-none focus:border-orange-400"
            />
          </div>

          {tab === "current" && (
            <label className="flex cursor-pointer select-none items-center gap-2 text-sm font-semibold text-[#334155]">
              <input
                type="checkbox"
                className="h-4 w-4 cursor-pointer"
                checked={chiShop}
                onChange={(e) => setChiShop(e.target.checked)}
              />
              Chỉ ngành shop đang bán
            </label>
          )}

          {nganhDangLoc && (
            <span className="inline-flex items-center gap-1 rounded-full border border-orange-200 bg-orange-50 px-3 py-1.5 text-xs font-bold text-orange-700">
              {nganhDangLoc.Nh_Ten}
              <button
                type="button"
                onClick={boLocNganh}
                className="ml-0.5 text-orange-500 hover:text-orange-800"
                title="Bỏ lọc ngành hàng"
              >
                <span className="material-symbols-outlined text-[16px] align-middle">
                  close
                </span>
              </button>
            </span>
          )}

          <span className="ml-auto text-xs text-[#94A3B8]">
            {tab === "current"
              ? `${nganhHienThi.length}/${dsNganh.length} ngành hàng`
              : `${lichSuHienThi.length} lần thay đổi`}
          </span>
        </div>
      )}

      {/* TAB BẢNG PHÍ HIỆN TẠI */}
      {tab === "current" && (
        <div className="overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-sm">
          <div className="flex flex-wrap items-center gap-2 border-b border-[#E2E8F0] px-4 py-3">
            <span className="material-symbols-outlined text-[18px] text-orange-600">
              percent
            </span>
            <p className="text-sm font-bold text-[#0F172A]">
              Mức phí đang áp dụng
            </p>
            <span className="ml-auto text-xs text-[#64748B]">
              Chỉ ngành lá mới có phí chiết khấu
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-left">
              <thead>
                <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-sm text-[#64748B]">
                  <th className="p-4 font-semibold">Ngành hàng</th>
                  <th className="p-4 font-semibold">Phí hiện tại</th>
                  <th className="p-4 font-semibold">Cập nhật gần nhất</th>
                  <th className="p-4 font-semibold">Sản phẩm của shop</th>
                </tr>
              </thead>
              <tbody>
                {nganhHienThi.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="p-10 text-center text-sm text-[#94A3B8]"
                    >
                      Không có ngành hàng phù hợp.
                    </td>
                  </tr>
                ) : (
                  nganhHienThi.map((r) => (
                    <tr
                      key={r.Nh_Ma}
                      className="border-b border-[#F1F5F9] last:border-0 hover:bg-[#FAFBFC]"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-[#0F172A]">
                            {r.Nh_Ten}
                          </p>
                          {Number(r.SoSanPham) > 0 && (
                            <span className="rounded-full bg-orange-50 px-2 py-0.5 text-[10px] font-bold text-orange-700">
                              Shop
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 text-xs text-[#64748B]">
                          {r.Duong_Dan} · {r.Nh_Ma}
                        </p>
                      </td>
                      <td className="p-4">
                        {so(r.Phi_PhanTram) === null ? (
                          <span className="text-sm italic text-[#94A3B8]">
                            Chưa cấu hình
                          </span>
                        ) : (
                          <span className="text-base font-bold text-orange-600">
                            {fmtPhanTram(r.Phi_PhanTram)}
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-sm text-[#64748B]">
                        {fmtThoiGian(r.ThoiDiemCapNhat)}
                      </td>
                      <td className="p-4 text-sm">
                        {Number(r.SoSanPham) > 0 ? (
                          <span className="font-semibold text-[#0F172A]">
                            {Number(r.SoSanPham).toLocaleString("vi-VN")} phân
                            loại
                          </span>
                        ) : (
                          <span className="text-[#94A3B8]">—</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB LỊCH SỬ THAY ĐỔI */}
      {tab === "history" && (
        <div className="overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-sm">
          <div className="flex flex-wrap items-center gap-2 border-b border-[#E2E8F0] px-4 py-3">
            <span className="material-symbols-outlined text-[18px] text-orange-600">
              history
            </span>
            <p className="text-sm font-bold text-[#0F172A]">
              Các lần sàn thay đổi phí chiết khấu
            </p>
            <span className="ml-auto text-xs text-[#64748B]">
              Toàn bộ thay đổi phí trên sàn · 200 lần gần nhất
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] border-collapse text-left">
              <thead>
                <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-sm text-[#64748B]">
                  <th className="p-4 font-semibold">Thời gian</th>
                  <th className="p-4 font-semibold">Ngành hàng</th>
                  <th className="p-4 font-semibold">Phí cũ</th>
                  <th className="p-4 font-semibold">Phí mới</th>
                  <th className="p-4 font-semibold">Thay đổi</th>
                  <th className="p-4 font-semibold">Sản phẩm của shop</th>
                </tr>
              </thead>
              <tbody>
                {lichSuHienThi.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="p-10 text-center text-sm text-[#94A3B8]"
                    >
                      Chưa có lần thay đổi phí nào.
                    </td>
                  </tr>
                ) : (
                  lichSuHienThi.map((r, index) => {
                    const cu = so(r.Phi_Cu);
                    const moi = so(r.Phi_Moi);
                    const chenh = cu === null || moi === null ? null : moi - cu;

                    return (
                      <tr
                        key={`${r.Nh_Ma}-${r.ThoiDiem}-${index}`}
                        className="border-b border-[#F1F5F9] last:border-0 hover:bg-[#FAFBFC]"
                      >
                        <td className="p-4 text-sm text-[#64748B]">
                          {fmtThoiGian(r.ThoiDiem)}
                        </td>
                        <td className="p-4">
                          <p className="font-semibold text-[#0F172A]">
                            {r.Nh_Ten}
                          </p>
                          <p className="mt-0.5 text-xs text-[#64748B]">
                            {r.Duong_Dan}
                          </p>
                        </td>
                        <td className="p-4 text-sm font-semibold text-[#64748B]">
                          {cu === null ? (
                            <span className="italic text-[#94A3B8]">
                              Chưa có
                            </span>
                          ) : (
                            fmtPhanTram(cu)
                          )}
                        </td>
                        <td className="p-4 text-base font-bold text-orange-600">
                          {fmtPhanTram(moi)}
                        </td>
                        <td className="p-4">
                          {chenh === null ? (
                            <span className="text-xs italic text-[#94A3B8]">
                              Thiết lập ban đầu
                            </span>
                          ) : chenh === 0 ? (
                            <span className="text-xs text-[#94A3B8]">
                              Không đổi
                            </span>
                          ) : (
                            <span
                              className={`inline-flex items-center gap-0.5 rounded-full px-2 py-1 text-xs font-bold ${
                                chenh > 0
                                  ? "bg-red-50 text-red-600"
                                  : "bg-emerald-50 text-emerald-600"
                              }`}
                            >
                              <span className="material-symbols-outlined text-[14px]">
                                {chenh > 0 ? "arrow_upward" : "arrow_downward"}
                              </span>
                              {chenh > 0 ? "+" : ""}
                              {fmtPhanTram(chenh)}
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-sm">
                          {Number(r.SoSanPham) > 0 ? (
                            <span className="font-semibold text-[#0F172A]">
                              {Number(r.SoSanPham).toLocaleString("vi-VN")} phân
                              loại
                            </span>
                          ) : (
                            <span className="text-[#94A3B8]">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB THÔNG BÁO TỪ SÀN */}
      {tab === "notifications" && (
        <div className="overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-sm">
          <div className="flex flex-wrap items-center gap-2 border-b border-[#E2E8F0] px-4 py-3">
            <span className="material-symbols-outlined text-[18px] text-orange-600">
              notifications
            </span>
            <p className="text-sm font-bold text-[#0F172A]">
              Thông báo thay đổi phí từ sàn
            </p>
            {feeUnread > 0 && (
              <span className="rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white">
                {feeUnread} chưa đọc
              </span>
            )}
            <button
              type="button"
              onClick={fetchThongBao}
              disabled={loadingThongBao}
              className="ml-auto inline-flex items-center gap-1 rounded-lg border border-[#E2E8F0] px-3 py-1.5 text-xs font-semibold text-[#64748B] hover:border-orange-300 hover:text-orange-700 disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[16px]">
                refresh
              </span>
              Làm mới
            </button>
          </div>

          {loadingThongBao ? (
            <p className="p-10 text-center text-sm text-[#64748B]">
              Đang tải thông báo...
            </p>
          ) : thongBao.length === 0 ? (
            <div className="p-12 text-center">
              <span className="material-symbols-outlined text-5xl text-gray-300">
                notifications_off
              </span>
              <p className="mt-3 text-sm font-semibold text-[#64748B]">
                Chưa có thông báo thay đổi phí nào.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#F1F5F9]">
              {thongBao.map((item) => (
                <button
                  key={item.tb_ma}
                  type="button"
                  onClick={() => moThongBao(item)}
                  className={`flex w-full items-start gap-3 px-4 py-4 text-left transition hover:bg-[#FAFBFC] ${
                    item.nn_dadoc ? "" : "bg-amber-50/40"
                  }`}
                >
                  <span className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-full bg-amber-50 text-amber-600">
                    <span className="material-symbols-outlined">percent</span>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-start gap-2">
                      <span className="line-clamp-2 flex-1 text-sm font-bold text-[#0F172A]">
                        {item.tb_tieude}
                      </span>
                      {!item.nn_dadoc && (
                        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-red-500" />
                      )}
                    </span>
                    <span className="mt-1 line-clamp-2 block text-xs text-[#64748B]">
                      {item.tb_noidung}
                    </span>
                    {so(item.tb_phi_moi) !== null && (
                      <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-orange-50 px-2 py-0.5 text-[11px] font-bold text-orange-700">
                        {fmtPhanTram(item.tb_phi_cu)}
                        <span className="material-symbols-outlined text-[12px]">
                          arrow_forward
                        </span>
                        {fmtPhanTram(item.tb_phi_moi)}
                      </span>
                    )}
                    <span className="mt-1 block text-[11px] text-[#94A3B8]">
                      Từ {item.nguon_ten || "Sàn"} ·{" "}
                      {fmtThoiGian(item.tb_thoidiemtao)}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal chi tiết thông báo */}
      {dangXem && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={() => setDangXem(null)}
        >
          <div
            className="w-full max-w-xl overflow-hidden rounded-3xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3 border-b border-[#E2E8F0] p-5">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-amber-50 text-amber-600">
                <span className="material-symbols-outlined">percent</span>
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="text-base font-bold text-[#0F172A]">
                  {dangXem.tb_tieude}
                </h3>
                <p className="mt-0.5 text-xs text-[#64748B]">
                  Từ {dangXem.nguon_ten || "Sàn"} ·{" "}
                  {fmtThoiGian(dangXem.tb_thoidiemtao)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDangXem(null)}
                className="grid h-8 w-8 place-items-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-red-500"
              >
                <span className="material-symbols-outlined text-[20px]">
                  close
                </span>
              </button>
            </div>

            <div className="p-5">
              {phiMoiDangXem !== null && (
                <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
                  <div className="flex items-center justify-center gap-4">
                    <div className="text-center">
                      <p className="text-[11px] font-bold uppercase tracking-wide text-[#94A3B8]">
                        Phí cũ
                      </p>
                      <p className="mt-1 text-xl font-bold text-[#64748B]">
                        {fmtPhanTram(phiCuDangXem)}
                      </p>
                    </div>

                    <span className="material-symbols-outlined text-2xl text-amber-500">
                      arrow_forward
                    </span>

                    <div className="text-center">
                      <p className="text-[11px] font-bold uppercase tracking-wide text-[#94A3B8]">
                        Phí mới
                      </p>
                      <p className="mt-1 text-2xl font-bold text-orange-600">
                        {fmtPhanTram(phiMoiDangXem)}
                      </p>
                    </div>
                  </div>

                  {chenhLechDangXem !== null && chenhLechDangXem !== 0 && (
                    <p className="mt-2 text-center text-xs font-bold text-amber-700">
                      {chenhLechDangXem > 0 ? "Tăng" : "Giảm"}{" "}
                      {fmtPhanTram(Math.abs(chenhLechDangXem))}
                    </p>
                  )}
                </div>
              )}

              <p className="whitespace-pre-line text-sm leading-relaxed text-[#334155]">
                {dangXem.tb_noidung}
              </p>
            </div>

            <div className="flex flex-wrap justify-end gap-3 border-t border-[#E2E8F0] bg-[#F8FAFC] p-4">
              {dangXem.tb_doituong_ma && (
                <button
                  type="button"
                  onClick={xemNganhTuThongBao}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-orange-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-orange-700"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    history
                  </span>
                  Xem lịch sử ngành này
                </button>
              )}
              <button
                type="button"
                onClick={() => setDangXem(null)}
                className="rounded-xl border border-[#E2E8F0] bg-white px-4 py-2.5 text-sm font-semibold text-[#64748B] hover:bg-gray-50"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      <ToastNotification toast={toast} />
    </div>
  );
};

export default PhiChiecKhauShop;
