import { useState, useEffect, useContext, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AuthContext } from "../../contexts/AuthContext";
import axiosClient from "../../config/axiosClient";
import { formatVND } from "../../components/shop/SanPhamShared";
import { toAssetUrl } from "../../utils/accountUtils";

const TT_COLOR = {
  TTDH01: "bg-yellow-50 text-yellow-700 border-yellow-200",
  TTDH02: "bg-blue-50 text-blue-700 border-blue-200",
  TTDH03: "bg-indigo-50 text-indigo-700 border-indigo-200",
  TTDH04: "bg-purple-50 text-purple-700 border-purple-200",
  TTDH05: "bg-green-50 text-green-700 border-green-200",
  TTDH06: "bg-red-50 text-red-700 border-red-200",
};

const LOAI_SU_KIEN = {
  HE_THONG: { color: "bg-slate-500", icon: "history" },
  DIEU_PHOI: { color: "bg-indigo-500", icon: "assignment_ind" },
  SHIPPER: { color: "bg-orange-500", icon: "local_shipping" },
  THU_KHO: { color: "bg-blue-500", icon: "inventory" },
};

const LY_DO_LABEL = {
  TU_LSP01: "Nhập kho từ Shipper LSP01 (lấy hàng từ Shop)",
  TRUNG_CHUYEN_DI: "Xuất kho gửi trung chuyển (LSP02)",
  TRUNG_CHUYEN_DEN: "Nhập kho từ trung chuyển (LSP02)",
  GIAO_LSP03: "Xuất kho giao cho Shipper LSP03",
};

const TRANG_THAI_PHIEU = {
  CHO_XAC_NHAN: "Chờ xác nhận",
  DA_XAC_NHAN: "Đã xác nhận",
  CO_VAN_DE: "Có vấn đề",
};

const money = (v) =>
  v === null || v === undefined || v === "" ? "—" : formatVND(v);

const formatDateTime = (v) => {
  if (!v) return "—";
  return new Date(v).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatDate = (v) => {
  if (!v) return "—";
  return new Date(v).toLocaleDateString("vi-VN");
};

const Field = ({ label, value, className = "" }) => (
  <div className={className}>
    <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">
      {label}
    </p>
    <p className="font-medium text-[#0F172A] break-words">{value || "—"}</p>
  </div>
);

const Card = ({ icon, title, children, className = "" }) => (
  <div
    className={`bg-white rounded-2xl shadow-sm border border-[#E2E8F0] p-6 ${className}`}
  >
    <h3 className="text-base font-bold text-[#0F172A] mb-4 border-b pb-3 flex items-center gap-2">
      <span className="material-symbols-outlined text-indigo-600">{icon}</span>
      {title}
    </h3>
    {children}
  </div>
);

const ChiTietLichSu = () => {
  const { dts_ma } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const kho_ma = user?.kho_ma;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axiosClient.get(
          `/quan-ly-kho/lich-su/chi-tiet/${dts_ma}`,
          { params: { kho_ma } },
        );
        setData(res.data);
      } catch (err) {
        setError(
          err.response?.data?.message || "Không tải được chi tiết đơn hàng!",
        );
      } finally {
        setLoading(false);
      }
    };
    if (dts_ma && kho_ma) fetchData();
  }, [dts_ma, kho_ma]);

  // Danh sách shipper xuất hiện trong hành trình (mỗi người 1 lần)
  const shippers = useMemo(() => {
    const map = new Map();
    (data?.timeline || []).forEach((t) => {
      if (!t.Shipper_Ma) return;
      if (!map.has(t.Shipper_Ma)) map.set(t.Shipper_Ma, t);
    });
    return [...map.values()];
  }, [data]);

  const tongSoLuong = useMemo(
    () =>
      (data?.items || []).reduce((sum, it) => sum + Number(it.SoLuong || 0), 0),
    [data],
  );

  if (loading)
    return (
      <div className="p-10 text-center font-medium text-gray-500">
        Đang tải...
      </div>
    );

  if (error)
    return (
      <div className="p-10 text-center">
        <span className="material-symbols-outlined text-6xl text-red-300">
          error
        </span>
        <p className="mt-3 text-red-600 font-semibold">{error}</p>
        <button
          onClick={() => navigate("/quan-ly-kho/lich-su")}
          className="mt-4 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700"
        >
          Về lịch sử kho
        </button>
      </div>
    );

  if (!data) return null;
  const { info, items, timeline, phieuKho } = data;
  const ttColor =
    TT_COLOR[info.MaTrangThaiHienTai] ||
    "bg-gray-50 text-gray-700 border-gray-200";

  return (
    <div className="p-6 bg-[#F8FAFC] min-h-screen">
      {/* HEADER */}
      <div className="mb-6">
        <button
          onClick={() => navigate("/quan-ly-kho/lich-su")}
          className="text-sm text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-1 mb-2"
        >
          <span className="material-symbols-outlined text-[18px]">
            arrow_back
          </span>
          Về lịch sử kho
        </button>

        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold text-[#0F172A]">
            Chi Tiết Đơn Hàng
          </h1>
          <span className="font-mono font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg">
            {info.DTS_Ma}
          </span>
          <span
            className={`text-xs px-3 py-1.5 rounded-lg font-bold border ${ttColor}`}
          >
            {info.TrangThaiHienTai || "Chưa có trạng thái"}
          </span>
          <span
            className={`text-xs px-3 py-1.5 rounded-lg font-bold border ${
              info.TrangThaiThanhToan
                ? "bg-green-50 text-green-700 border-green-200"
                : "bg-yellow-50 text-yellow-700 border-yellow-200"
            }`}
          >
            {info.TrangThaiThanhToan ? "Đã thanh toán" : "Chưa thanh toán"}
          </span>
        </div>
      </div>

      {/* THỐNG KÊ NHANH */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          {
            label: "Tổng thanh toán",
            value: money(info.TongThanhToan),
            icon: "payments",
            color: "text-red-600",
          },
          {
            label: "Sản phẩm",
            value: `${items.length} loại / ${tongSoLuong} món`,
            icon: "inventory_2",
            color: "text-indigo-600",
          },
          {
            label: "Phiếu kho",
            value: `${phieuKho.length} phiếu`,
            icon: "receipt_long",
            color: "text-blue-600",
          },
          {
            label: "Mốc hành trình",
            value: `${timeline.length} mốc`,
            icon: "timeline",
            color: "text-emerald-600",
          },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-4"
          >
            <div className="flex items-center gap-2 text-gray-400 mb-1">
              <span className="material-symbols-outlined text-[18px]">
                {s.icon}
              </span>
              <span className="text-xs font-semibold uppercase tracking-wider">
                {s.label}
              </span>
            </div>
            <p className={`font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* CỘT TRÁI */}
        <div className="lg:col-span-2 space-y-6">
          {/* 1. THÔNG TIN ĐƠN */}
          <Card icon="receipt_long" title="Thông Tin Đơn Hàng">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <Field label="Gian hàng" value={info.TenShop} />
              <Field
                label="Ngày lập đơn"
                value={formatDateTime(info.NgayLap)}
              />
              <Field
                label="Giao dự kiến"
                value={formatDate(info.NgayGiaoDuKien)}
              />
              <Field label="Đơn vị vận chuyển" value={info.TenDVVC} />
              <Field label="Mốc khối lượng" value={info.TenMocKhoiLuong} />
              <Field label="Trạng thái" value={info.TrangThaiHienTai} />

              <Field label="Tiền hàng" value={money(info.TongTienHang)} />
              <Field label="Phí vận chuyển" value={money(info.TienVanChuyen)} />
              <Field label="Giảm giá shop" value={money(info.GiamGiaShop)} />
              <Field
                label="Giảm giá vận chuyển"
                value={money(info.GiamGiaVanChuyen)}
              />
              <Field
                label="Tổng giảm giá"
                value={money(info.TongTienGiamGia)}
              />
              <Field label="Phí sàn" value={money(info.TongTienPhiSan)} />

              <div className="col-span-2 md:col-span-3 bg-red-50 rounded-xl p-3 flex items-center justify-between">
                <span className="text-sm font-semibold text-red-700">
                  Tổng khách thanh toán
                </span>
                <span className="text-lg font-bold text-red-600">
                  {money(info.TongThanhToan)}
                </span>
              </div>

              {(info.TenVoucherShop || info.TenVoucherVC) && (
                <div className="col-span-2 md:col-span-3 grid grid-cols-2 gap-4">
                  {info.TenVoucherShop && (
                    <Field
                      label="Voucher shop"
                      value={`${info.TenVoucherShop} (${info.PhanTramGiamShop || 0}%)`}
                    />
                  )}
                  {info.TenVoucherVC && (
                    <Field
                      label="Voucher vận chuyển"
                      value={`${info.TenVoucherVC} (${info.PhanTramGiamVC || 0}%)`}
                    />
                  )}
                </div>
              )}

              {info.GhiChuShop && (
                <Field
                  label="Ghi chú của shop"
                  value={info.GhiChuShop}
                  className="col-span-2 md:col-span-3"
                />
              )}
            </div>
          </Card>

          {/* 2. KHÁCH NHẬN + ĐỊA CHỈ */}
          <Card icon="person_pin_circle" title="Khách Nhận & Địa Chỉ">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <Field label="Người nhận" value={info.TenNguoiNhan} />
              <Field label="SĐT người nhận" value={info.SdtNguoiNhan} />
              <Field label="Khách đặt hàng" value={info.TenKhachHang} />
              <Field label="SĐT khách" value={info.SdtKhachHang} />
              <Field
                label="Email khách"
                value={info.EmailKhachHang}
                className="col-span-2"
              />
              <Field
                label="Địa chỉ lấy hàng (Shop)"
                value={[info.DiaChiLayHang, info.Xa_LayHang, info.Tinh_LayHang]
                  .filter(Boolean)
                  .join(", ")}
                className="col-span-2"
              />
              <Field
                label="Địa chỉ giao hàng"
                value={info.DiaChiGiao}
                className="col-span-2"
              />
              {info.GhiChuKhach && (
                <Field
                  label="Ghi chú của khách"
                  value={info.GhiChuKhach}
                  className="col-span-2"
                />
              )}
            </div>
          </Card>

          {/* 3. SẢN PHẨM */}
          <Card icon="inventory_2" title={`Sản Phẩm (${items.length})`}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#F8FAFC] text-[#64748B] text-xs">
                    <th className="p-3 text-left font-semibold">Sản phẩm</th>
                    <th className="p-3 text-center font-semibold w-16">SL</th>
                    <th className="p-3 text-right font-semibold w-28">
                      Đơn giá
                    </th>
                    <th className="p-3 text-right font-semibold w-32">
                      Thành tiền
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9]">
                  {items.map((it, idx) => (
                    <tr key={idx}>
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                            {it.HinhAnh && (
                              <img
                                src={toAssetUrl(it.HinhAnh)}
                                alt={it.TenSanPham}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.style.display = "none";
                                }}
                              />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-[#0F172A]">
                              {it.TenSanPham}
                            </p>
                            {it.TenPhanLoai && (
                              <p className="text-xs text-[#64748B]">
                                {it.TenPhanLoai}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-3 text-center font-bold">
                        {it.SoLuong}
                      </td>
                      <td className="p-3 text-right text-[#64748B]">
                        {money(it.DonGia)}
                      </td>
                      <td className="p-3 text-right font-bold text-[#0F172A]">
                        {money(it.ThanhTien)}
                      </td>
                    </tr>
                  ))}
                  {items.length === 0 && (
                    <tr>
                      <td colSpan="4" className="p-6 text-center text-gray-500">
                        Đơn hàng chưa có sản phẩm.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          {/* 4. PHIẾU KHO LIÊN QUAN */}
          <Card
            icon="receipt"
            title={`Phiếu Kho Liên Quan (${phieuKho.length})`}
          >
            {phieuKho.length === 0 ? (
              <p className="text-sm text-gray-500">
                Đơn hàng chưa phát sinh phiếu kho.
              </p>
            ) : (
              <div className="space-y-3">
                {phieuKho.map((pk) => (
                  <div
                    key={pk.PK_Ma}
                    className="flex flex-wrap items-center justify-between gap-3 p-3 border border-[#E2E8F0] rounded-xl"
                  >
                    <div className="min-w-0">
                      <p className="font-mono font-bold text-indigo-600">
                        {pk.PK_Ma}
                        <span className="ml-2 text-xs font-sans font-semibold text-gray-500">
                          {pk.Loai === "NHAP" ? "Nhập kho" : "Xuất kho"}
                        </span>
                      </p>
                      <p className="text-sm text-[#0F172A]">
                        {LY_DO_LABEL[pk.LyDo] || pk.LyDo}
                      </p>
                      <p className="text-xs text-gray-500">
                        {pk.Kho_Ten || "—"}
                        {pk.Shipper_Ten ? ` • ${pk.Shipper_Ten}` : ""}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Tạo: {formatDateTime(pk.ThoiGianTao)}
                        {pk.ThoiGianXacNhan
                          ? ` • Xác nhận: ${formatDateTime(pk.ThoiGianXacNhan)}`
                          : ""}
                      </p>
                      {pk.GhiChu && (
                        <p className="text-xs italic text-gray-500 mt-1">
                          Ghi chú: {pk.GhiChu}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs px-2.5 py-1 rounded-lg font-bold ${
                          pk.TrangThai === "DA_XAC_NHAN"
                            ? "bg-green-50 text-green-700"
                            : pk.TrangThai === "CO_VAN_DE"
                              ? "bg-red-50 text-red-700"
                              : "bg-yellow-50 text-yellow-700"
                        }`}
                      >
                        {TRANG_THAI_PHIEU[pk.TrangThai] || pk.TrangThai}
                      </span>
                      {pk.HinhAnh && (
                        <img
                          src={toAssetUrl(pk.HinhAnh)}
                          alt="Minh chứng"
                          className="w-12 h-12 rounded-lg object-cover border border-[#E2E8F0] cursor-pointer"
                          onClick={() =>
                            window.open(toAssetUrl(pk.HinhAnh), "_blank")
                          }
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* CỘT PHẢI */}
        <div className="space-y-6">
          {/* 5. SHIPPER TỪNG CHẶNG */}
          <Card icon="badge" title="Shipper Từng Chặng">
            {shippers.length === 0 ? (
              <p className="text-sm text-gray-500">Chưa phân công shipper.</p>
            ) : (
              <div className="space-y-4">
                {shippers.map((s) => (
                  <div key={s.Shipper_Ma} className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gray-100 overflow-hidden shrink-0 border border-[#E2E8F0]">
                      {s.Shipper_HinhAnh ? (
                        <img
                          src={toAssetUrl(s.Shipper_HinhAnh)}
                          alt={s.Shipper_Ten}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <span className="material-symbols-outlined">
                            person
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-[#0F172A] truncate">
                        {s.Shipper_Ten}
                      </p>
                      <p className="text-xs text-gray-500">
                        {s.Shipper_SDT || "—"}
                      </p>
                      <p className="text-xs text-indigo-600 truncate">
                        {s.HanhDong}
                      </p>
                      <p className="text-[11px] text-gray-400">
                        {formatDateTime(s.ThoiGian)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* 6. TIMELINE */}
          <Card icon="timeline" title="Toàn Bộ Hành Trình">
            {timeline.length === 0 ? (
              <p className="text-sm text-gray-500">
                Chưa có dữ liệu hành trình.
              </p>
            ) : (
              <ol className="relative border-l-2 border-[#E2E8F0] ml-3 space-y-5">
                {timeline.map((t, idx) => {
                  const cfg = LOAI_SU_KIEN[t.LoaiSuKien] || {
                    color: "bg-slate-500",
                    icon: "history",
                  };
                  return (
                    <li key={idx} className="ml-6">
                      <span
                        className={`absolute -left-[17px] w-8 h-8 rounded-full flex items-center justify-center text-white ${cfg.color}`}
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          {cfg.icon}
                        </span>
                      </span>

                      <p className="font-bold text-sm text-[#0F172A]">
                        {t.HanhDong}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDateTime(t.ThoiGian)}
                        {t.NguoiThucHien ? ` • ${t.NguoiThucHien}` : ""}
                      </p>
                      {t.Kho_Ten && (
                        <p className="text-xs text-gray-500">
                          Kho: {t.Kho_Ten}
                          {t.Kho_Den_Ten ? ` → ${t.Kho_Den_Ten}` : ""}
                        </p>
                      )}
                      {t.GhiChu && (
                        <p className="text-xs italic text-gray-500 mt-1">
                          “{t.GhiChu}”
                        </p>
                      )}
                      {t.HinhAnh && (
                        <img
                          src={toAssetUrl(t.HinhAnh)}
                          alt="Minh chứng"
                          className="mt-2 w-20 h-20 rounded-lg object-cover border border-[#E2E8F0] cursor-pointer"
                          onClick={() =>
                            window.open(toAssetUrl(t.HinhAnh), "_blank")
                          }
                        />
                      )}
                    </li>
                  );
                })}
              </ol>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ChiTietLichSu;
