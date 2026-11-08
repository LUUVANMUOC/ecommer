// src/pages/shop/ChiTietSanPham.jsx
import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import sanPhamService from "../../services/gianhang/sanPhamService";
import chiTietSanPhamService from "../../services/gianhang/chiTietSanPhamService";
import trangThaiChiTietSanPhamService from "../../services/gianhang/trangThaiChiTietSanPhamService";
import ToastNotification from "../../components/common/Crud/ToastNotification";
import {
  Card,
  SpecRow,
  Gallery,
  AllImagesGrid,
  AttributeChips,
  SanPhamFormDrawer,
  formatVND,
  getCurrentShopId,
  loadProductOptions,
} from "../../components/shop/SanPhamShared";

const LIST_PATH = "/nguoi-ban/quan-ly-san-pham";

/* --------------------------------------------------------------
   CẤU HÌNH HIỂN THỊ TRẠNG THÁI DUYỆT
   -------------------------------------------------------------- */
const STATUS_CONFIG = {
  TTCTSP0001: {
    label: "Chờ duyệt",
    icon: "schedule",
    badge: "border-yellow-300 bg-yellow-50 text-yellow-800",
    banner: "border-yellow-300 bg-yellow-50 text-yellow-900",
  },
  TTCTSP0002: {
    label: "Được phép bán",
    icon: "check_circle",
    badge: "border-green-300 bg-green-50 text-green-800",
    banner: "border-green-300 bg-green-50 text-green-900",
  },
  TTCTSP0003: {
    label: "Đình chỉ bán",
    icon: "block",
    badge: "border-red-300 bg-red-50 text-red-800",
    banner: "border-red-300 bg-red-50 text-red-900",
  },
};

const StatusBadge = ({ status }) => {
  if (!status) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-gray-300 bg-gray-50 px-2.5 py-0.5 text-xs font-semibold text-gray-600">
        <span className="material-symbols-outlined text-[14px]">help</span>
        Chưa gửi duyệt
      </span>
    );
  }
  const cfg = STATUS_CONFIG[status.ttctsp_ma] || {
    label: status.ttctsp_ten || status.ttctsp_ma,
    icon: "info",
    badge: "border-gray-300 bg-gray-50 text-gray-700",
    banner: "border-gray-300 bg-gray-50 text-gray-800",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${cfg.badge}`}
    >
      <span className="material-symbols-outlined text-[14px]">{cfg.icon}</span>
      {cfg.label}
    </span>
  );
};

/* --------------------------------------------------------------
   CỘT PHẢI: DANH SÁCH PHÂN LOẠI (có badge trạng thái + nút gửi duyệt)
   -------------------------------------------------------------- */
const VariantPanel = ({
  variants,
  activeVariant,
  onSelect,
  onAdd,
  onEdit,
  onDelete,
  onSubmitForApproval,
  submittingStatus,
}) => {
  const stock = Number(activeVariant?.ctsp_soluongton ?? 0);

  return (
    <Card className="flex flex-col p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-bold text-[#14201C]">
          Phân loại ({variants.length})
        </h2>
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-sm font-semibold text-[#8A5A0B] hover:bg-[#FDF3E1]"
        >
          <span className="material-symbols-outlined text-[16px]">add</span>
          Thêm phân loại
        </button>
      </div>

      {variants.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border-2 border-dashed border-[#E2DED3] py-8 text-center">
          <span className="material-symbols-outlined text-[36px] text-[#C9C3B5]">
            layers_clear
          </span>
          <p className="text-sm text-[#5B6661]">
            Sản phẩm chưa có phân loại. Hãy thêm ít nhất một phân loại.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {variants.map((ct) => {
            const on = activeVariant?.ctsp_ma === ct.ctsp_ma;
            const latestStatus = ct.trangthai_lichsu?.[0] || null;
            const canSubmit =
              !latestStatus || latestStatus.ttctsp_ma === "TTCTSP0003";
            return (
              <li key={ct.ctsp_ma}>
                <div
                  className={`rounded-xl border transition-colors ${
                    on
                      ? "border-[#F2A93B] bg-[#FDF3E1]"
                      : "border-[#E2DED3] bg-white"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => onSelect(ct.ctsp_ma)}
                    className="flex w-full items-start justify-between gap-3 px-4 py-3 text-left"
                  >
                    <span className="min-w-0 flex-1">
                      <span
                        className={`block truncate text-sm ${on ? "font-bold text-[#14201C]" : "font-semibold text-[#3D4A44]"}`}
                      >
                        {ct.ctsp_ten}
                      </span>
                      <div className="mt-1">
                        <StatusBadge status={latestStatus} />
                      </div>
                      <span className="mt-1 block truncate text-xs text-[#7A857F]">
                        {ct.nh_ten ? `${ct.nh_ten} · ` : ""}
                        Tồn {ct.ctsp_soluongton} · {ct.images?.length ?? 0} ảnh
                        {ct.thuoctinh?.length
                          ? ` · ${ct.thuoctinh.length} thuộc tính`
                          : ""}
                      </span>
                    </span>

                    <span className="shrink-0 text-right">
                      <span className="block text-[10px] font-medium uppercase tracking-wide text-[#7A857F]">
                        Khách trả
                      </span>
                      <span className="block text-sm font-bold tabular-nums text-[#B42318]">
                        {formatVND(ct.ctsp_gianban)}
                      </span>
                      <span className="mt-0.5 block text-[10px] text-[#7A857F]">
                        Shop nhận{" "}
                        <span className="font-semibold text-[#3D4A44]">
                          {formatVND(ct.gb_gia)}
                        </span>
                      </span>
                    </span>
                  </button>

                  {canSubmit && (
                    <div className="border-t border-[#EFEBE2] px-4 py-2">
                      <button
                        type="button"
                        disabled={submittingStatus === ct.ctsp_ma}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSubmitForApproval(ct);
                        }}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-[#8A5A0B] hover:underline disabled:opacity-50"
                      >
                        <span className="material-symbols-outlined text-[14px]">
                          send
                        </span>
                        {submittingStatus === ct.ctsp_ma
                          ? "Đang gửi..."
                          : latestStatus
                            ? "Gửi duyệt lại"
                            : "Gửi duyệt sản phẩm"}
                      </button>
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {activeVariant && (
        <div className="mt-5 space-y-3 border-t border-[#EFEBE2] pt-5">
          <p
            className={`inline-flex items-center gap-1 text-sm font-medium ${
              stock > 0 ? "text-[#2F7A5F]" : "text-[#B42318]"
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">
              {stock > 0 ? "inventory_2" : "remove_shopping_cart"}
            </span>
            {stock > 0 ? `Còn ${stock} sản phẩm` : "Đã hết hàng"}
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onEdit(activeVariant)}
              className="flex items-center justify-center gap-1.5 rounded-xl bg-[#14201C] py-2.5 text-sm font-semibold text-white hover:bg-[#1E3A34]"
            >
              <span className="material-symbols-outlined text-[18px]">
                edit
              </span>
              Sửa
            </button>
            <button
              type="button"
              onClick={() => onDelete(activeVariant.ctsp_ma)}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-[#F0C4AE] bg-white py-2.5 text-sm font-semibold text-[#B42318] hover:bg-[#FBEDE4]"
            >
              <span className="material-symbols-outlined text-[18px]">
                delete
              </span>
              Xóa
            </button>
          </div>
        </div>
      )}
    </Card>
  );
};

/* --------------------------------------------------------------
   TRANG CHÍNH
   -------------------------------------------------------------- */
const ChiTietSanPham = () => {
  const { sp_ma } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const shopId = getCurrentShopId();

  const [product, setProduct] = useState(null);
  const [variants, setVariants] = useState([]);
  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const [activeVariantId, setActiveVariantId] = useState(null);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [tab, setTab] = useState("desc");

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [submittingStatus, setSubmittingStatus] = useState(null); // ctsp_ma đang gửi
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(
      () => setToast({ show: false, message: "", type: "success" }),
      3000,
    );
  };

  const fetchProduct = async () => {
    const [resP, opts] = await Promise.all([
      sanPhamService.getByGianHang(shopId),
      loadProductOptions(shopId),
    ]);
    setProduct(resP.data.find((p) => p.sp_ma === sp_ma) ?? null);
    setBrands(opts.brands);
    setCategories(opts.categories);
  };

  const fetchVariants = async () => {
    try {
      const res = await chiTietSanPhamService.getBySanPham(sp_ma);
      setVariants(res.data);
    } catch (err) {
      showToast("Lỗi tải phân loại", "error");
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        await Promise.all([fetchProduct(), fetchVariants()]);
      } catch (err) {
        showToast("Lỗi khi tải dữ liệu", "error");
      } finally {
        setLoading(false);
      }
    };
    setActiveVariantId(null);
    setActiveImageIdx(0);
    init();
  }, [sp_ma]);

  useEffect(() => {
    if (location.state?.toast) {
      showToast(location.state.toast);
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.state]);

  const activeVariant =
    variants.find((ct) => ct.ctsp_ma === activeVariantId) ??
    variants[0] ??
    null;
  const images = activeVariant?.images ?? [];
  const idx = Math.min(activeImageIdx, Math.max(images.length - 1, 0));
  const attrs = activeVariant?.thuoctinh ?? [];
  const activeStatus = activeVariant?.trangthai_lichsu?.[0] || null;

  const selectVariant = (ctsp_ma) => {
    setActiveVariantId(ctsp_ma);
    setActiveImageIdx(0);
  };

  const goAddVariant = () =>
    navigate(`/nguoi-ban/quan-ly-san-pham/${sp_ma}/phan-loai/moi`);

  const goEditVariant = (ct) =>
    navigate(
      `/nguoi-ban/quan-ly-san-pham/${sp_ma}/phan-loai/${ct.ctsp_ma}/sua`,
    );

  const handleDeleteVariant = async (ctsp_ma) => {
    if (variants.length <= 1)
      return alert(
        "Sản phẩm phải có ít nhất 1 phân loại. Không thể xóa phân loại cuối cùng!",
      );
    if (!window.confirm("Bạn có chắc muốn xóa phân loại này?")) return;
    try {
      await chiTietSanPhamService.delete(ctsp_ma);
      setActiveVariantId(null);
      setActiveImageIdx(0);
      showToast("Đã xóa phân loại");
      fetchVariants();
    } catch (err) {
      alert("Lỗi khi xóa phân loại");
    }
  };

  const handleSubmitForApproval = async (ct) => {
    const note = window.prompt(
      `Ghi chú gửi duyệt cho "${ct.ctsp_ten}" (không bắt buộc):`,
      "Yêu cầu duyệt sản phẩm",
    );
    if (note === null) return; // user bấm Cancel

    setSubmittingStatus(ct.ctsp_ma);
    try {
      await trangThaiChiTietSanPhamService.submitForApproval(
        ct.ctsp_ma,
        note.trim(),
      );
      showToast("Đã gửi duyệt! Vui lòng chờ sàn phê duyệt.");
      fetchVariants();
    } catch (err) {
      alert(err.response?.data?.message || "Lỗi gửi duyệt");
    } finally {
      setSubmittingStatus(null);
    }
  };

  const handleSubmitAll = async () => {
    if (
      !window.confirm(
        "Bạn có chắc chắn muốn gửi duyệt TẤT CẢ các phân loại chưa được duyệt?",
      )
    )
      return;

    try {
      const res =
        await trangThaiChiTietSanPhamService.submitAllForApproval(sp_ma);
      showToast(res.data.message, res.data.count > 0 ? "success" : "info");
      fetchVariants(); // Load lại danh sách
    } catch (err) {
      alert(err.response?.data?.message || "Lỗi gửi duyệt hàng loạt");
    }
  };

  const handleDeleteProduct = async () => {
    if (!product) return;
    if (
      !window.confirm(`Bạn có chắc chắn muốn xóa sản phẩm "${product.sp_ten}"?`)
    )
      return;
    try {
      await sanPhamService.delete(product.sp_ma);
      navigate(LIST_PATH, {
        state: { toast: `Đã xóa sản phẩm "${product.sp_ten}"` },
      });
    } catch (err) {
      alert(err.response?.data?.message || "Không thể xóa sản phẩm.");
    }
  };

  const handleProductSaved = (message) => {
    setDrawerOpen(false);
    showToast(message);
    fetchProduct();
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-[#7A857F]">
        Đang tải...
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <p className="text-[#5B6661]">Không tìm thấy sản phẩm.</p>
        <Link
          to={LIST_PATH}
          className="font-semibold text-[#8A5A0B] hover:underline"
        >
          Quay lại danh sách sản phẩm
        </Link>
      </div>
    );
  }

  const tabs = [
    { key: "desc", label: "Mô tả & hình ảnh" },
    { key: "spec", label: "Thông số" },
  ];

  const canSubmitActive =
    !activeStatus || activeStatus.ttctsp_ma === "TTCTSP0003";

  return (
    <div className="w-full space-y-6">
      {/* Thanh điều hướng & thao tác với SẢN PHẨM */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <nav className="flex min-w-0 items-center gap-2 text-sm">
          <Link
            to={LIST_PATH}
            className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 font-medium text-[#3D4A44] hover:bg-[#F1EEE6]"
          >
            <span className="material-symbols-outlined text-[18px]">
              arrow_back
            </span>
            Danh sách sản phẩm
          </Link>
          <span className="text-[#C9C3B5]">/</span>
          <span className="truncate text-[#5B6661]">{product.sp_ten}</span>
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={handleSubmitAll}
            className="inline-flex items-center gap-1 rounded-lg bg-[#F2A93B] px-3.5 py-2 text-sm font-bold text-white hover:bg-[#e09b32]"
          >
            <span className="material-symbols-outlined text-[18px]">send</span>
            Gửi duyệt tất cả
          </button>
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="inline-flex items-center gap-1 rounded-lg border border-[#D9CFC2] bg-white px-3.5 py-2 text-sm font-medium text-[#3D4A44] hover:bg-[#F7F5F0]"
          >
            <span className="material-symbols-outlined text-[18px]">edit</span>
            Sửa sản phẩm
          </button>
          <button
            type="button"
            onClick={handleDeleteProduct}
            className="inline-flex items-center gap-1 rounded-lg border border-[#F0C4AE] bg-white px-3.5 py-2 text-sm font-semibold text-[#B42318] hover:bg-[#FBEDE4]"
          >
            <span className="material-symbols-outlined text-[18px]">
              delete
            </span>
            Xóa sản phẩm
          </button>
        </div>
      </div>

      {/* Tiêu đề & chỉ số */}
      <div>
        <h1 className="text-2xl font-bold text-[#14201C]">{product.sp_ten}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-[#5B6661]">
          <span className="inline-flex items-center gap-1 font-semibold text-[#8A5A0B]">
            <span className="material-symbols-outlined text-[18px] text-[#F2A93B]">
              star
            </span>
            {product.sp_diemdanhgiatrungbinh ?? 0}
          </span>
          <span>
            Đã bán {activeVariant?.ctsp_luotmua ?? product.sp_luotmua ?? 0}
          </span>
          <span>
            Lượt xem {activeVariant?.ctsp_luotxem ?? product.sp_luotxem ?? 0}
          </span>
          <span>
            Yêu thích{" "}
            {activeVariant?.ctsp_luotthich ?? product.sp_luotthich ?? 0}
          </span>
          <span className="font-mono text-xs text-[#7A857F]">
            Mã: {product.sp_ma}
          </span>
          <span className="rounded-full bg-[#FDF3E1] px-2.5 py-0.5 text-xs font-medium text-[#8A5A0B]">
            {product.th_ten || "Chưa có thương hiệu"}
          </span>
          <span className="rounded-full bg-[#EEF3F1] px-2.5 py-0.5 text-xs font-medium text-[#2F5D50]">
            {product.dmsp_ten || "Chưa có danh mục"}
          </span>
        </div>

        {/* BLOCK 2 GIÁ NỔI BẬT */}
        {activeVariant && (
          <div className="mt-4 flex flex-wrap items-center gap-x-8 gap-y-3 rounded-2xl border border-[#F2A93B]/40 bg-gradient-to-br from-[#FDF3E1] to-[#FBFAF7] px-5 py-4 shadow-sm">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#8A5A0B]">
                Giá khách trả
              </p>
              <p className="mt-0.5 text-2xl font-bold tabular-nums text-[#B42318]">
                {formatVND(activeVariant.ctsp_gianban)}
              </p>
            </div>
            <div className="hidden h-10 w-px bg-[#F2A93B]/40 sm:block" />
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#7A857F]">
                Giá bán gốc (shop nhận)
              </p>
              <p className="mt-0.5 text-lg font-bold tabular-nums text-[#14201C]">
                {formatVND(activeVariant.gb_gia)}
              </p>
            </div>
            <div className="hidden h-10 w-px bg-[#F2A93B]/40 sm:block" />
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#7A857F]">
                Phí sàn
              </p>
              <p className="mt-0.5 text-lg font-bold tabular-nums text-[#3D4A44]">
                {formatVND(
                  Number(activeVariant.ctsp_gianban || 0) -
                    Number(activeVariant.gb_gia || 0),
                )}
              </p>
            </div>
          </div>
        )}

        {/* BANNER TRẠNG THÁI DUYỆT */}
        {activeVariant && (
          <div
            className={`mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm ${
              activeStatus
                ? STATUS_CONFIG[activeStatus.ttctsp_ma]?.banner ||
                  "border-gray-300 bg-gray-50 text-gray-800"
                : "border-gray-300 bg-gray-50 text-gray-800"
            }`}
          >
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <StatusBadge status={activeStatus} />
              <span className="text-xs">
                {activeStatus?.ctttsp_phanhoi
                  ? `Phản hồi từ sàn: ${activeStatus.ctttsp_phanhoi}`
                  : !activeStatus
                    ? "Sản phẩm chưa gửi duyệt. Bấm gửi duyệt để sàn xét."
                    : activeStatus.ttctsp_ma === "TTCTSP0001"
                      ? "Đang chờ sàn phê duyệt. Sản phẩm chưa thể bán."
                      : activeStatus.ttctsp_ma === "TTCTSP0002"
                        ? "Sản phẩm đã được duyệt và có thể bán."
                        : "Sản phẩm bị đình chỉ. Vui lòng gửi duyệt lại."}
              </span>
            </div>
            {canSubmitActive && (
              <button
                type="button"
                disabled={submittingStatus === activeVariant.ctsp_ma}
                onClick={() => handleSubmitForApproval(activeVariant)}
                className="inline-flex items-center gap-1 rounded-lg bg-[#8A5A0B] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#6d470a] disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[16px]">
                  send
                </span>
                {submittingStatus === activeVariant.ctsp_ma
                  ? "Đang gửi..."
                  : activeStatus
                    ? "Gửi duyệt lại"
                    : "Gửi duyệt ngay"}
              </button>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <Card className="p-5">
            {activeVariant && (
              <p className="mb-3 text-xs font-medium text-[#7A857F]">
                Đang xem ảnh của phân loại{" "}
                <span className="font-bold text-[#14201C]">
                  {activeVariant.ctsp_ten}
                </span>
                {activeVariant.nh_ten && (
                  <>
                    {" "}
                    · Ngành hàng:{" "}
                    <span className="font-bold text-[#14201C]">
                      {activeVariant.nh_ten}
                    </span>
                  </>
                )}
              </p>
            )}
            <Gallery images={images} index={idx} onIndex={setActiveImageIdx} />
          </Card>

          <Card>
            <div className="flex gap-1 border-b border-[#EFEBE2] px-3 pt-3">
              {tabs.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setTab(t.key)}
                  className={`-mb-px border-b-2 px-4 pb-3 text-sm font-semibold transition-colors ${
                    tab === t.key
                      ? "border-[#F2A93B] text-[#14201C]"
                      : "border-transparent text-[#7A857F] hover:text-[#14201C]"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="p-5">
              {tab === "desc" && (
                <div className="space-y-6">
                  <div>
                    <h3 className="mb-2 text-sm font-bold text-[#14201C]">
                      Mô tả phân loại
                      {activeVariant ? ` “${activeVariant.ctsp_ten}”` : ""}
                    </h3>
                    <p className="whitespace-pre-line text-sm leading-relaxed text-[#3D4A44]">
                      {activeVariant?.ctsp_mota || (
                        <span className="italic text-[#9AA39E]">
                          Phân loại này chưa có mô tả.
                        </span>
                      )}
                    </p>
                  </div>

                  {attrs.length > 0 && (
                    <div>
                      <h3 className="mb-2 text-sm font-bold text-[#14201C]">
                        Thuộc tính phân loại ({attrs.length})
                      </h3>
                      <AttributeChips attributes={attrs} />
                    </div>
                  )}

                  <div>
                    <h3 className="mb-3 text-sm font-bold text-[#14201C]">
                      Hình ảnh ({images.length})
                    </h3>
                    {images.length === 0 ? (
                      <p className="rounded-xl border-2 border-dashed border-[#E2DED3] p-8 text-center text-sm text-[#7A857F]">
                        Phân loại này chưa có ảnh. Bấm “Sửa” để thêm ảnh.
                      </p>
                    ) : (
                      <AllImagesGrid
                        images={images}
                        onPick={(i) => {
                          setActiveImageIdx(i);
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                      />
                    )}
                  </div>

                  {/* LỊCH SỬ TRẠNG THÁI DUYỆT */}
                  {(activeVariant?.trangthai_lichsu?.length ?? 0) > 0 && (
                    <div className="border-t border-[#EFEBE2] pt-5">
                      <h3 className="mb-3 text-sm font-bold text-[#14201C]">
                        Lịch sử trạng thái duyệt (
                        {activeVariant.trangthai_lichsu.length})
                      </h3>
                      <ul className="space-y-2">
                        {activeVariant.trangthai_lichsu.map((st, i) => (
                          <li
                            key={`st-${st.ttctsp_ma}-${st.ctttsp_thoidiem}-${i}`}
                            className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-[#EFEBE2] bg-[#FBFAF7] px-3 py-2 text-sm"
                          >
                            <StatusBadge status={st} />
                            <span className="text-xs text-[#7A857F]">
                              {st.ctttsp_thoidiem
                                ? new Date(st.ctttsp_thoidiem).toLocaleString(
                                    "vi-VN",
                                  )
                                : ""}
                            </span>
                            {st.ctttsp_yeucau && (
                              <span className="text-xs text-[#5B6661]">
                                <b>Yêu cầu:</b> {st.ctttsp_yeucau}
                              </span>
                            )}
                            {st.ctttsp_phanhoi && (
                              <span className="text-xs text-[#5B6661]">
                                <b>Phản hồi:</b> {st.ctttsp_phanhoi}
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="border-t border-[#EFEBE2] pt-5">
                    <h3 className="mb-2 text-sm font-bold text-[#14201C]">
                      Mô tả sản phẩm
                    </h3>
                    <p className="whitespace-pre-line text-sm leading-relaxed text-[#3D4A44]">
                      {product.sp_mota || "Chưa có mô tả cho sản phẩm này."}
                    </p>
                  </div>
                </div>
              )}

              {tab === "spec" &&
                (activeVariant ? (
                  <div className="-mx-5 divide-y divide-[#EFEBE2]">
                    <SpecRow
                      label="Tên phân loại"
                      value={activeVariant.ctsp_ten}
                    />
                    <SpecRow
                      label="Ngành hàng"
                      value={
                        activeVariant.nh_ten ||
                        activeVariant.nh_ma ||
                        "Chưa chọn"
                      }
                    />
                    <SpecRow
                      label="Mã phân loại"
                      value={activeVariant.ctsp_ma}
                    />

                    {/* TRẠNG THÁI DUYỆT */}
                    <SpecRow
                      label="Trạng thái duyệt"
                      value={
                        <span className="inline-flex">
                          <StatusBadge status={activeStatus} />
                        </span>
                      }
                    />

                    <SpecRow
                      label="Giá bán gốc (shop nhận)"
                      value={formatVND(activeVariant.gb_gia)}
                    />
                    <SpecRow
                      label="Giá bán (khách trả)"
                      value={formatVND(activeVariant.ctsp_gianban)}
                    />
                    <SpecRow
                      label="Phí sàn"
                      value={formatVND(
                        Number(activeVariant.ctsp_gianban || 0) -
                          Number(activeVariant.gb_gia || 0),
                      )}
                    />

                    <SpecRow
                      label="Số lượng tồn"
                      value={activeVariant.ctsp_soluongton}
                    />
                    {/* 🟢 CẬP NHẬT: Hiển thị Kích thước 3 chiều */}
                    <SpecRow
                      label="Kích thước (D × R × C)"
                      value={`${activeVariant.ctsp_chieudai} × ${activeVariant.ctsp_chieurong} × ${activeVariant.ctsp_chieucao} cm`}
                    />
                    <SpecRow
                      label="Khối lượng"
                      value={`${activeVariant.ctsp_khoiluong} kg`}
                    />
                    <SpecRow label="Số lượng ảnh" value={images.length} />
                    {attrs.map((tt, i) => {
                      const val =
                        tt.gttt_giatridinhtinh ??
                        (tt.gttt_giatridinhluong != null
                          ? String(tt.gttt_giatridinhluong)
                          : "—");
                      return (
                        <SpecRow
                          key={`tt-${tt.ttsp_ma ?? i}`}
                          label={tt.ttsp_ten || tt.ttsp_ma}
                          value={val}
                        />
                      );
                    })}
                  </div>
                ) : (
                  <p className="py-10 text-center text-sm text-[#7A857F]">
                    Chưa có phân loại để hiển thị thông số.
                  </p>
                ))}
            </div>
          </Card>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <VariantPanel
            variants={variants}
            activeVariant={activeVariant}
            onSelect={selectVariant}
            onAdd={goAddVariant}
            onEdit={goEditVariant}
            onDelete={handleDeleteVariant}
            onSubmitForApproval={handleSubmitForApproval}
            submittingStatus={submittingStatus}
          />
        </aside>
      </div>

      <SanPhamFormDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        mode="edit"
        product={product}
        brands={brands}
        categories={categories}
        shopId={shopId}
        onSaved={handleProductSaved}
      />

      <ToastNotification toast={toast} />
    </div>
  );
};

export default ChiTietSanPham;
