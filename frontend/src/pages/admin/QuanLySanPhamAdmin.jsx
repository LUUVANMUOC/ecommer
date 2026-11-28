// src/pages/admin/QuanLySanPhamAdmin.jsx
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import trangThaiChiTietSanPhamService from "../../services/gianhang/trangThaiChiTietSanPhamService";
import axiosClient from "../../config/axiosClient";
import ToastNotification from "../../components/common/Crud/ToastNotification";
import Avatar from "../../components/common/Avatar";
import {
  ProductToolbar,
  ProductGrid,
  ProductCard,
  ProductEmptyState,
  ProductRefreshButton,
  PaginationBar,
  productSelectClass,
} from "../../components/product/ProductUI";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8080";
const imgUrl = (link) => (link ? `${BACKEND_URL}${link}` : "");
const formatVND = (n) =>
  n || n === 0 ? `${Number(n).toLocaleString("vi-VN")} đ` : "—";
const toNumber = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);

const formatDate = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("vi-VN");
};

const formatDateTime = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const PAGE_SIZES = [12, 24, 48];

const STATUS_CONFIG = {
  TTCTSP0001: {
    label: "Chờ duyệt",
    badge: "bg-yellow-100 text-yellow-800 border-yellow-200",
    dot: "bg-yellow-500",
  },
  TTCTSP0002: {
    label: "Đang bán",
    badge: "bg-green-100 text-green-800 border-green-200",
    dot: "bg-green-500",
  },
  TTCTSP0003: {
    label: "Bị đình chỉ",
    badge: "bg-red-100 text-red-800 border-red-200",
    dot: "bg-red-500",
  },
  DEFAULT: {
    label: "Chưa gửi duyệt",
    badge: "bg-gray-100 text-gray-800 border-gray-200",
    dot: "bg-gray-400",
  },
};

const getStatus = (ma) => STATUS_CONFIG[ma] || STATUS_CONFIG.DEFAULT;

const TONE = {
  green: "border-green-200 bg-green-50 text-green-700",
  yellow: "border-yellow-200 bg-yellow-50 text-yellow-700",
  red: "border-red-200 bg-red-50 text-red-700",
  gray: "border-gray-200 bg-gray-50 text-gray-600",
  blue: "border-blue-200 bg-blue-50 text-blue-700",
};

// Chuyển danh sách ngành hàng phẳng -> mảng phẳng sắp theo cây (cha trước, con sau)
const buildCategoryOptions = (list) => {
  const byParent = new Map();
  list.forEach((c) => {
    const key = c.nh_cha || "";
    if (!byParent.has(key)) byParent.set(key, []);
    byParent.get(key).push(c);
  });
  byParent.forEach((arr) =>
    arr.sort((a, b) => String(a.nh_ten).localeCompare(String(b.nh_ten), "vi")),
  );

  const out = [];
  const seen = new Set();

  const walk = (parent, depth) => {
    (byParent.get(parent) || []).forEach((c) => {
      if (seen.has(c.nh_ma)) return;
      seen.add(c.nh_ma);
      out.push({ ...c, depth });
      walk(c.nh_ma, depth + 1);
    });
  };
  walk("", 0);

  // Dữ liệu mồ côi (nh_cha trỏ tới ngành không tồn tại) vẫn phải hiển thị
  list.forEach((c) => {
    if (!seen.has(c.nh_ma)) out.push({ ...c, depth: 0 });
  });

  return out;
};

// Chuẩn hoá 1 phân loại: luôn có images / thuoctinh / trangthai_lichsu là mảng
const normalizeVariant = (v) => {
  const images =
    Array.isArray(v.images) && v.images.length > 0
      ? v.images
      : v.main_image
        ? [
            {
              hasp_ma: `${v.ctsp_ma}-main`,
              hasp_link: v.main_image,
              hasp_mota: null,
              hasp_laanhchinh: true,
              hasp_thutu: 1,
            },
          ]
        : [];

  return {
    ...v,
    images,
    thuoctinh: Array.isArray(v.thuoctinh) ? v.thuoctinh : [],
    trangthai_lichsu: Array.isArray(v.trangthai_lichsu)
      ? v.trangthai_lichsu
      : [],
  };
};

/* ===================== COMPONENT CON ===================== */

const StatBox = ({ label, value, tone = "gray", icon }) => (
  <div className={`rounded-xl border p-3 ${TONE[tone] || TONE.gray}`}>
    <div className="flex items-center gap-1.5">
      <span className="material-symbols-outlined text-[16px]">{icon}</span>
      <p className="text-[11px] font-semibold uppercase tracking-wide">
        {label}
      </p>
    </div>
    <p className="mt-1 text-2xl font-bold">{value}</p>
  </div>
);

const InfoItem = ({ label, value }) => {
  const empty = value === null || value === undefined || value === "";
  return (
    <div>
      <dt className="text-xs text-[#7A857F]">{label}</dt>
      <dd className="mt-0.5 break-words text-sm font-semibold text-[#14201C]">
        {empty ? "—" : value}
      </dd>
    </div>
  );
};

const DetailSkeleton = () => (
  <div className="space-y-4">
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="h-20 animate-pulse rounded-xl bg-white" />
      ))}
    </div>
    <div className="h-28 animate-pulse rounded-2xl bg-white" />
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="h-64 animate-pulse rounded-2xl bg-white lg:col-span-2" />
      <div className="space-y-4">
        <div className="h-32 animate-pulse rounded-2xl bg-white" />
        <div className="h-28 animate-pulse rounded-2xl bg-white" />
      </div>
    </div>
  </div>
);

const ImageLightbox = ({ images, index, onClose, onPrev, onNext }) => {
  const img = images?.[index];
  if (!img) return null;
  const hasMany = images.length > 1;

  return (
    <div
      className="fixed inset-0 z-[70] flex flex-col items-center justify-center bg-black/85 p-4"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute right-5 top-5 grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
        title="Đóng (Esc)"
      >
        <span className="material-symbols-outlined">close</span>
      </button>

      {hasMany && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onPrev();
          }}
          className="absolute left-4 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
        >
          <span className="material-symbols-outlined">chevron_left</span>
        </button>
      )}

      <img
        src={imgUrl(img.hasp_link)}
        alt={img.hasp_mota || ""}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[80vh] max-w-full rounded-lg object-contain shadow-2xl"
      />

      {hasMany && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onNext();
          }}
          className="absolute right-4 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
        >
          <span className="material-symbols-outlined">chevron_right</span>
        </button>
      )}

      <div className="mt-4 max-w-2xl text-center text-white/90">
        <p className="text-sm">{img.hasp_mota || "Hình ảnh sản phẩm"}</p>
        {hasMany && (
          <p className="mt-1 text-xs text-white/60">
            {index + 1} / {images.length}
          </p>
        )}
      </div>
    </div>
  );
};

const VariantCard = ({
  variant,
  isOpen,
  onToggle,
  onApprove,
  onSuspend,
  onOpenImage,
  approving,
}) => {
  const status = getStatus(variant.ttctsp_ma);
  const isSuspended = variant.ttctsp_ma === "TTCTSP0003";
  const isPending = variant.ttctsp_ma === "TTCTSP0001";

  const mainImage =
    variant.images.find((img) => img.hasp_laanhchinh)?.hasp_link ||
    variant.images[0]?.hasp_link ||
    variant.main_image ||
    "";

  const giaGoc =
    variant.gb_gia === null || variant.gb_gia === undefined
      ? null
      : toNumber(variant.gb_gia);
  const giaBan = toNumber(variant.ctsp_gianban);
  const phanTram = toNumber(variant.psck_phantram);
  const chenhLech = giaGoc === null ? null : giaBan - giaGoc;

  return (
    <div
      className={`overflow-hidden rounded-xl border bg-white shadow-sm transition-colors ${
        isOpen ? "border-[#F2A93B]" : "border-[#E2DED3]"
      }`}
    >
      {/* Header accordion */}
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-4 p-3 text-left hover:bg-[#FBFAF7]"
      >
        <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-[#E2DED3] bg-[#FBFAF7]">
          {mainImage ? (
            <img
              src={imgUrl(mainImage)}
              alt=""
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="flex h-full items-center justify-center material-symbols-outlined text-[#C9C3B5]">
              image
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-block rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${status.badge}`}
            >
              {status.label}
            </span>
            <span className="truncate text-sm font-bold text-[#14201C]">
              {variant.ctsp_ten}
            </span>
          </div>
          <p className="mt-0.5 truncate text-xs text-[#7A857F]">
            Mã: <span className="font-mono">{variant.ctsp_ma}</span>
            {variant.nh_ten ? ` · ${variant.nh_ten}` : ""}
          </p>
        </div>

        <div className="hidden shrink-0 text-right sm:block">
          <p className="text-sm font-bold text-[#B42318]">
            {formatVND(variant.ctsp_gianban)}
          </p>
          <p className="text-xs text-[#7A857F]">
            Tồn: {toNumber(variant.ctsp_soluongton)}
          </p>
        </div>

        <span
          className={`material-symbols-outlined shrink-0 text-[#7A857F] transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        >
          expand_more
        </span>
      </button>

      {/* Body accordion */}
      {isOpen && (
        <div className="space-y-4 border-t border-[#EFEBE2] p-4">
          {/* Gallery */}
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[#7A857F]">
              Hình ảnh ({variant.images.length})
            </p>
            {variant.images.length === 0 ? (
              <p className="text-sm text-[#7A857F]">Chưa có hình ảnh.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {variant.images.map((img, idx) => (
                  <button
                    key={img.hasp_ma || `${variant.ctsp_ma}-${idx}`}
                    type="button"
                    onClick={() => onOpenImage(variant.images, idx)}
                    className="group relative h-20 w-20 overflow-hidden rounded-lg border border-[#E2DED3] bg-[#FBFAF7]"
                    title={img.hasp_mota || "Xem ảnh lớn"}
                  >
                    <img
                      src={imgUrl(img.hasp_link)}
                      alt={img.hasp_mota || ""}
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                    {img.hasp_laanhchinh && (
                      <span className="absolute left-1 top-1 rounded bg-[#F2A93B] px-1 py-0.5 text-[9px] font-bold text-white">
                        Ảnh chính
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Giá / vận chuyển / hiệu quả */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border border-[#EFEBE2] bg-[#FBFAF7] p-3">
              <p className="text-xs font-bold uppercase tracking-wide text-[#7A857F]">
                Giá &amp; chiết khấu
              </p>
              <dl className="mt-2 space-y-1.5 text-sm">
                <div className="flex justify-between gap-2">
                  <dt className="text-[#7A857F]">Giá gốc</dt>
                  <dd className="font-semibold text-[#14201C]">
                    {giaGoc === null ? "—" : formatVND(giaGoc)}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-[#7A857F]">Phí chiết khấu</dt>
                  <dd className="font-semibold text-[#14201C]">{phanTram}%</dd>
                </div>
                <div className="flex justify-between gap-2 border-t border-[#EFEBE2] pt-1.5">
                  <dt className="text-[#7A857F]">Giá bán</dt>
                  <dd className="font-bold text-[#B42318]">
                    {formatVND(giaBan)}
                  </dd>
                </div>
                {chenhLech !== null && (
                  <div className="flex justify-between gap-2">
                    <dt className="text-[#7A857F]">Chênh lệch</dt>
                    <dd
                      className={`font-semibold ${
                        chenhLech >= 0 ? "text-green-700" : "text-red-600"
                      }`}
                    >
                      {chenhLech > 0 ? "+" : ""}
                      {formatVND(chenhLech)}
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            <div className="rounded-lg border border-[#EFEBE2] bg-[#FBFAF7] p-3">
              <p className="text-xs font-bold uppercase tracking-wide text-[#7A857F]">
                Vận chuyển &amp; kho
              </p>
              <dl className="mt-2 space-y-1.5 text-sm">
                <div className="flex justify-between gap-2">
                  <dt className="text-[#7A857F]">Kích thước</dt>
                  <dd className="font-semibold text-[#14201C]">
                    {toNumber(variant.ctsp_chieudai)} ×{" "}
                    {toNumber(variant.ctsp_chieurong)} ×{" "}
                    {toNumber(variant.ctsp_chieucao)} cm
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-[#7A857F]">Khối lượng</dt>
                  <dd className="font-semibold text-[#14201C]">
                    {toNumber(variant.ctsp_khoiluong)} kg
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-[#7A857F]">Tồn kho</dt>
                  <dd className="font-bold text-[#14201C]">
                    {toNumber(variant.ctsp_soluongton)}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-[#7A857F]">Ngày tạo</dt>
                  <dd className="font-semibold text-[#14201C]">
                    {formatDate(variant.ctsp_ngaytao)}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="rounded-lg border border-[#EFEBE2] bg-[#FBFAF7] p-3">
              <p className="text-xs font-bold uppercase tracking-wide text-[#7A857F]">
                Hiệu quả bán hàng
              </p>
              <div className="mt-2 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg border border-blue-100 bg-blue-50 p-2">
                  <p className="text-[10px] font-semibold text-blue-600">
                    Lượt xem
                  </p>
                  <p className="font-bold text-blue-700">
                    {toNumber(variant.ctsp_luotxem)}
                  </p>
                </div>
                <div className="rounded-lg border border-pink-100 bg-pink-50 p-2">
                  <p className="text-[10px] font-semibold text-pink-600">
                    Lượt thích
                  </p>
                  <p className="font-bold text-pink-700">
                    {toNumber(variant.ctsp_luotthich)}
                  </p>
                </div>
                <div className="rounded-lg border border-green-100 bg-green-50 p-2">
                  <p className="text-[10px] font-semibold text-green-600">
                    Đã bán
                  </p>
                  <p className="font-bold text-green-700">
                    {toNumber(variant.ctsp_luotmua)}
                  </p>
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between rounded-lg border border-yellow-100 bg-yellow-50 px-3 py-2">
                <div>
                  <p className="text-[10px] font-semibold text-yellow-700">
                    Điểm đánh giá
                  </p>
                  <p className="text-xs text-yellow-700/80">
                    {toNumber(variant.so_danh_gia)} đánh giá
                  </p>
                </div>
                <p className="flex items-center gap-1 text-lg font-bold text-yellow-600">
                  {Number(variant.ctsp_diemdanhgiatrungbinh || 0).toFixed(1)}
                  <span
                    className="material-symbols-outlined text-[18px]"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    star
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Thuộc tính */}
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[#7A857F]">
              Thuộc tính ({variant.thuoctinh.length})
            </p>
            {variant.thuoctinh.length === 0 ? (
              <p className="text-sm text-[#7A857F]">
                Phân loại này chưa khai báo thuộc tính.
              </p>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {variant.thuoctinh.map((tt) => (
                  <div
                    key={tt.ttsp_ma}
                    className="flex items-start gap-2 rounded-lg border border-[#EFEBE2] bg-white px-3 py-2"
                  >
                    {tt.thsp_icon ? (
                      <img
                        src={imgUrl(tt.thsp_icon)}
                        alt=""
                        className="mt-0.5 h-5 w-5 shrink-0 object-contain"
                        loading="lazy"
                        decoding="async"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    ) : (
                      <span className="material-symbols-outlined mt-0.5 text-[16px] text-[#7A857F]">
                        sell
                      </span>
                    )}
                    <div className="min-w-0">
                      <p className="text-xs text-[#7A857F]">
                        {tt.ttsp_ten || tt.ttsp_ma}
                      </p>
                      <p className="break-words text-sm font-semibold text-[#14201C]">
                        {tt.gttt_giatridinhtinh ||
                          (tt.gttt_giatridinhluong !== null &&
                          tt.gttt_giatridinhluong !== undefined
                            ? Number(tt.gttt_giatridinhluong).toLocaleString(
                                "vi-VN",
                              )
                            : "—")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Mô tả phân loại */}
          <div>
            <p className="mb-1 text-xs font-bold uppercase tracking-wide text-[#7A857F]">
              Mô tả phân loại
            </p>
            <p className="whitespace-pre-line text-sm italic text-[#3D4A44]">
              {variant.ctsp_mota ? `"${variant.ctsp_mota}"` : "—"}
            </p>
          </div>

          {/* Timeline trạng thái */}
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[#7A857F]">
              Lịch sử trạng thái ({variant.trangthai_lichsu.length})
            </p>
            {variant.trangthai_lichsu.length === 0 ? (
              <p className="text-sm text-[#7A857F]">
                Phân loại này chưa có lịch sử trạng thái.
              </p>
            ) : (
              <ol className="relative space-y-3 border-l-2 border-[#EFEBE2] pl-4">
                {variant.trangthai_lichsu.map((item, idx) => {
                  const cfg = getStatus(item.ttctsp_ma);
                  return (
                    <li
                      key={`${item.ttctsp_ma}-${item.ctttsp_thoidiem}-${idx}`}
                      className="relative"
                    >
                      <span
                        className={`absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full ring-2 ring-white ${cfg.dot}`}
                      />
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${cfg.badge}`}
                        >
                          {item.ttctsp_ten || cfg.label}
                        </span>
                        <span className="text-xs text-[#7A857F]">
                          {formatDateTime(item.ctttsp_thoidiem)}
                        </span>
                      </div>
                      {item.ctttsp_yeucau && (
                        <p className="mt-1 text-xs text-[#3D4A44]">
                          <b>Yêu cầu:</b> {item.ctttsp_yeucau}
                        </p>
                      )}
                      {item.ctttsp_phanhoi && (
                        <p className="mt-0.5 text-xs text-[#3D4A44]">
                          <b>Phản hồi:</b> {item.ctttsp_phanhoi}
                        </p>
                      )}
                    </li>
                  );
                })}
              </ol>
            )}
          </div>

          {/* Hành động */}
          <div className="flex flex-wrap items-center gap-2 border-t border-[#EFEBE2] pt-3">
            {isPending && (
              <button
                type="button"
                onClick={() => onApprove(variant)}
                disabled={approving}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-2 text-sm font-bold text-green-700 shadow-sm transition-colors hover:bg-green-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[18px]">
                  check_circle
                </span>
                {approving ? "Đang duyệt..." : "Duyệt phân loại"}
              </button>
            )}

            <button
              type="button"
              onClick={() => onSuspend(variant)}
              disabled={isSuspended}
              className={`inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2 text-sm font-bold transition-colors ${
                isSuspended
                  ? "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400"
                  : "border-red-200 bg-red-50 text-red-600 shadow-sm hover:bg-red-100"
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">
                block
              </span>
              {isSuspended ? "Đã bị đình chỉ" : "Đình chỉ phân loại"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const ChiTietSanPhamModal = ({
  product,
  detail,
  loading,
  error,
  onClose,
  onApprove,
  onSuspend,
  onOpenImage,
  approvingCtsp,
}) => {
  const [activeTab, setActiveTab] = useState("tongquan");
  const [expanded, setExpanded] = useState(null);
  const [descExpanded, setDescExpanded] = useState(false);

  // Đổi sản phẩm -> reset tab + mô tả
  useEffect(() => {
    setActiveTab("tongquan");
    setDescExpanded(false);
    setExpanded(product?.variants?.[0]?.ctsp_ma || null);
  }, [product?.sp_ma]);

  // Khi API chi tiết về -> mở sẵn phân loại đầu tiên
  useEffect(() => {
    if (detail?.phan_loai?.length) {
      setExpanded((prev) => prev || detail.phan_loai[0].ctsp_ma);
    }
  }, [detail]);

  const sp = detail?.san_pham || null;

  const variants = useMemo(() => {
    const raw = detail ? detail.phan_loai || [] : product?.variants || [];
    return raw.map(normalizeVariant);
  }, [detail, product]);

  const stats = useMemo(() => {
    const count = { dangBan: 0, choDuyet: 0, dinhChi: 0, chuaGui: 0 };
    let tongTon = 0;
    let giaMin = null;
    let giaMax = null;
    let soDanhGia = 0;

    variants.forEach((v) => {
      if (v.ttctsp_ma === "TTCTSP0002") count.dangBan += 1;
      else if (v.ttctsp_ma === "TTCTSP0001") count.choDuyet += 1;
      else if (v.ttctsp_ma === "TTCTSP0003") count.dinhChi += 1;
      else count.chuaGui += 1;

      tongTon += toNumber(v.ctsp_soluongton);
      soDanhGia += toNumber(v.so_danh_gia);

      const gia = toNumber(v.ctsp_gianban);
      if (gia > 0) {
        giaMin = giaMin === null ? gia : Math.min(giaMin, gia);
        giaMax = giaMax === null ? gia : Math.max(giaMax, gia);
      }
    });

    const nganhHang = [
      ...new Set(variants.map((v) => v.nh_ten).filter(Boolean)),
    ];

    const cover =
      variants
        .map((v) => v.images.find((img) => img.hasp_laanhchinh)?.hasp_link)
        .find(Boolean) ||
      variants.map((v) => v.images[0]?.hasp_link).find(Boolean) ||
      product?.variants?.[0]?.main_image ||
      "";

    const ngayTaoSomNhat =
      sp?.ngay_tao_som_nhat ||
      variants
        .map((v) => v.ctsp_ngaytao)
        .filter(Boolean)
        .sort((a, b) => new Date(a) - new Date(b))[0] ||
      null;

    return {
      count,
      tongTon,
      giaMin,
      giaMax,
      soDanhGia,
      nganhHang,
      cover,
      ngayTaoSomNhat,
    };
  }, [variants, product, sp]);

  const luotXem = sp
    ? toNumber(sp.sp_luotxem)
    : variants.reduce((s, v) => s + toNumber(v.ctsp_luotxem), 0);
  const luotThich = sp
    ? toNumber(sp.sp_luotthich)
    : variants.reduce((s, v) => s + toNumber(v.ctsp_luotthich), 0);
  const luotMua = sp
    ? toNumber(sp.sp_luotmua)
    : variants.reduce((s, v) => s + toNumber(v.ctsp_luotmua), 0);
  const diemDanhGia = sp
    ? toNumber(sp.sp_diemdanhgiatrungbinh)
    : variants.length
      ? variants.reduce(
          (s, v) => s + toNumber(v.ctsp_diemdanhgiatrungbinh),
          0,
        ) / variants.length
      : 0;

  const giaRange =
    stats.giaMin === null
      ? "—"
      : stats.giaMin === stats.giaMax
        ? formatVND(stats.giaMin)
        : `${formatVND(stats.giaMin)} – ${formatVND(stats.giaMax)}`;

  const moTa = sp?.sp_mota || product?.sp_mota || "";
  const showDescToggle = moTa.length > 180;

  const tieuDe = sp?.sp_ten || product?.sp_ten || "Chi tiết sản phẩm";

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-3 backdrop-blur-sm">
      <div className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-[#F8FAFC] shadow-2xl">
        {/* Header */}
        <div className="flex shrink-0 items-start gap-4 border-b border-[#E2DED3] bg-white px-5 py-4">
          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-[#E2DED3] bg-white">
            {stats.cover ? (
              <img
                src={imgUrl(stats.cover)}
                alt=""
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="flex h-full items-center justify-center material-symbols-outlined text-[#C9C3B5]">
                image
              </span>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-bold text-[#14201C]">{tieuDe}</h2>
              {loading && (
                <span className="flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                  <span className="material-symbols-outlined animate-spin text-[13px]">
                    progress_activity
                  </span>
                  Đang tải chi tiết
                </span>
              )}
            </div>
            <p className="mt-0.5 text-sm text-[#7A857F]">
              Shop: {sp?.gh_ten || product?.gh_ten || "—"} (
              {sp?.gh_ma || product?.gh_ma || "—"}) · Mã SP:{" "}
              <span className="font-mono">{sp?.sp_ma || product?.sp_ma}</span>
            </p>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              <span className="rounded-full border border-green-200 bg-green-50 px-2 py-0.5 text-[10px] font-bold text-green-700">
                {stats.count.dangBan} đang bán
              </span>
              <span className="rounded-full border border-yellow-200 bg-yellow-50 px-2 py-0.5 text-[10px] font-bold text-yellow-700">
                {stats.count.choDuyet} chờ duyệt
              </span>
              <span className="rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-700">
                {stats.count.dinhChi} đình chỉ
              </span>
              <span className="rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-[10px] font-bold text-gray-600">
                {stats.count.chuaGui} chưa gửi duyệt
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-full p-1 text-gray-400 transition-colors hover:bg-white hover:text-red-500"
            title="Đóng (Esc)"
          >
            <span className="material-symbols-outlined text-[28px]">close</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex shrink-0 gap-1 border-b border-[#E2DED3] bg-white px-5">
          <button
            type="button"
            onClick={() => setActiveTab("tongquan")}
            className={`border-b-2 px-4 py-3 text-sm font-bold transition-colors ${
              activeTab === "tongquan"
                ? "border-[#F2A93B] text-[#8A5A0B]"
                : "border-transparent text-[#7A857F] hover:text-[#14201C]"
            }`}
          >
            Tổng quan sản phẩm
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("phanloai")}
            className={`border-b-2 px-4 py-3 text-sm font-bold transition-colors ${
              activeTab === "phanloai"
                ? "border-[#F2A93B] text-[#8A5A0B]"
                : "border-transparent text-[#7A857F] hover:text-[#14201C]"
            }`}
          >
            Phân loại ({variants.length})
          </button>
        </div>

        {/* Body */}
        <div className="custom-scrollbar flex-1 overflow-y-auto p-5">
          {loading && !detail ? (
            <DetailSkeleton />
          ) : (
            <>
              {error && !detail && (
                <div className="mb-4 flex items-start gap-2 rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
                  <span className="material-symbols-outlined text-[20px]">
                    warning
                  </span>
                  <p>
                    Không tải được dữ liệu chi tiết đầy đủ. Đang hiển thị thông
                    tin rút gọn từ danh sách — bạn hãy đóng và mở lại để thử
                    lại.
                  </p>
                </div>
              )}

              {activeTab === "tongquan" ? (
                <div className="space-y-4">
                  {/* Đếm trạng thái */}
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <StatBox
                      label="Đang bán"
                      value={stats.count.dangBan}
                      tone="green"
                      icon="check_circle"
                    />
                    <StatBox
                      label="Chờ duyệt"
                      value={stats.count.choDuyet}
                      tone="yellow"
                      icon="hourglass_top"
                    />
                    <StatBox
                      label="Bị đình chỉ"
                      value={stats.count.dinhChi}
                      tone="red"
                      icon="block"
                    />
                    <StatBox
                      label="Chưa gửi duyệt"
                      value={stats.count.chuaGui}
                      tone="gray"
                      icon="draft"
                    />
                  </div>

                  {/* Mô tả chung */}
                  <section className="rounded-2xl border border-[#E2DED3] bg-white p-5 shadow-sm">
                    <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-[#3D4A44]">
                      <span className="material-symbols-outlined text-[18px] text-[#F2A93B]">
                        description
                      </span>
                      Mô tả sản phẩm
                    </h3>
                    <p
                      className={`mt-2 whitespace-pre-line text-sm leading-relaxed text-[#3D4A44] ${
                        descExpanded ? "" : "line-clamp-3"
                      }`}
                    >
                      {moTa || "Chưa có mô tả."}
                    </p>
                    {showDescToggle && (
                      <button
                        type="button"
                        onClick={() => setDescExpanded((v) => !v)}
                        className="mt-2 text-xs font-bold text-[#8A5A0B] hover:underline"
                      >
                        {descExpanded ? "Thu gọn" : "Xem thêm"}
                      </button>
                    )}
                  </section>

                  <div className="grid gap-4 lg:grid-cols-3">
                    {/* Thông tin sản phẩm */}
                    <section className="rounded-2xl border border-[#E2DED3] bg-white p-5 shadow-sm lg:col-span-2">
                      <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-[#3D4A44]">
                        <span className="material-symbols-outlined text-[18px] text-[#F2A93B]">
                          inventory_2
                        </span>
                        Thông tin sản phẩm
                      </h3>
                      <dl className="mt-3 grid gap-x-6 gap-y-3 sm:grid-cols-2">
                        <InfoItem
                          label="Mã sản phẩm"
                          value={
                            <span className="font-mono">
                              {sp?.sp_ma || product?.sp_ma}
                            </span>
                          }
                        />
                        <InfoItem label="Thương hiệu" value={sp?.th_ten} />
                        <InfoItem
                          label="Danh mục của shop"
                          value={sp?.dmsp_ten}
                        />
                        <InfoItem
                          label="Ngành hàng"
                          value={
                            stats.nganhHang.length
                              ? stats.nganhHang.join(", ")
                              : null
                          }
                        />
                        <InfoItem
                          label="Ngày tạo sớm nhất"
                          value={formatDate(stats.ngayTaoSomNhat)}
                        />
                        <InfoItem
                          label="Tổng tồn kho"
                          value={stats.tongTon.toLocaleString("vi-VN")}
                        />
                        <InfoItem label="Khoảng giá" value={giaRange} />
                        <InfoItem
                          label="Số phân loại"
                          value={variants.length}
                        />
                      </dl>
                    </section>

                    <div className="space-y-4">
                      {/* Gian hàng */}
                      <section className="rounded-2xl border border-[#E2DED3] bg-white p-5 shadow-sm">
                        <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-[#3D4A44]">
                          <span className="material-symbols-outlined text-[18px] text-[#F2A93B]">
                            storefront
                          </span>
                          Gian hàng
                        </h3>
                        <div className="mt-3 flex items-center gap-3">
                          <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full border border-[#E2DED3] bg-white">
                            <Avatar
                              src={sp?.gh_hinhanh}
                              role="shop"
                              name={sp?.gh_ten}
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-bold text-[#14201C]">
                              {sp?.gh_ten || product?.gh_ten || "—"}
                            </p>
                            <p className="font-mono text-xs text-[#7A857F]">
                              {sp?.gh_ma || product?.gh_ma || "—"}
                            </p>
                          </div>
                        </div>

                        <div className="mt-3 flex gap-2">
                          <div className="flex-1 rounded-lg border border-[#F2A93B]/30 bg-[#FDF3E1] p-2 text-center">
                            <p className="text-[10px] font-semibold text-[#8A5A0B]">
                              Đánh giá shop
                            </p>
                            <p className="text-sm font-bold text-[#8A5A0B]">
                              {Number(sp?.gh_danhgia || 0).toFixed(1)} ★
                            </p>
                          </div>
                          <div className="flex-1 rounded-lg border border-blue-100 bg-blue-50 p-2 text-center">
                            <p className="text-[10px] font-semibold text-blue-700">
                              Người theo dõi
                            </p>
                            <p className="text-sm font-bold text-blue-700">
                              {toNumber(sp?.gh_theodoi).toLocaleString("vi-VN")}
                            </p>
                          </div>
                        </div>
                      </section>

                      {/* Thống kê */}
                      <section className="rounded-2xl border border-[#E2DED3] bg-white p-5 shadow-sm">
                        <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-[#3D4A44]">
                          <span className="material-symbols-outlined text-[18px] text-[#F2A93B]">
                            monitoring
                          </span>
                          Thống kê
                        </h3>
                        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                          <div className="rounded-lg border border-blue-100 bg-blue-50 p-2">
                            <p className="text-[10px] font-semibold text-blue-600">
                              Lượt xem
                            </p>
                            <p className="font-bold text-blue-700">
                              {luotXem.toLocaleString("vi-VN")}
                            </p>
                          </div>
                          <div className="rounded-lg border border-pink-100 bg-pink-50 p-2">
                            <p className="text-[10px] font-semibold text-pink-600">
                              Lượt thích
                            </p>
                            <p className="font-bold text-pink-700">
                              {luotThich.toLocaleString("vi-VN")}
                            </p>
                          </div>
                          <div className="rounded-lg border border-green-100 bg-green-50 p-2">
                            <p className="text-[10px] font-semibold text-green-600">
                              Đã bán
                            </p>
                            <p className="font-bold text-green-700">
                              {luotMua.toLocaleString("vi-VN")}
                            </p>
                          </div>
                        </div>
                        <div className="mt-2 flex items-center justify-between rounded-lg border border-yellow-100 bg-yellow-50 px-3 py-2">
                          <div>
                            <p className="text-[10px] font-semibold text-yellow-700">
                              Điểm đánh giá TB
                            </p>
                            <p className="text-xs text-yellow-700/80">
                              {stats.soDanhGia} đánh giá
                            </p>
                          </div>
                          <p className="flex items-center gap-1 text-lg font-bold text-yellow-600">
                            {diemDanhGia.toFixed(1)}
                            <span
                              className="material-symbols-outlined text-[18px]"
                              style={{ fontVariationSettings: "'FILL' 1" }}
                            >
                              star
                            </span>
                          </p>
                        </div>
                      </section>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {variants.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-[#E2DED3] bg-white py-16 text-center">
                      <span className="material-symbols-outlined text-[48px] text-[#C9C3B5]">
                        inventory_2
                      </span>
                      <p className="mt-2 text-[#5B6661]">
                        Sản phẩm này chưa có phân loại nào.
                      </p>
                    </div>
                  ) : (
                    variants.map((v) => (
                      <VariantCard
                        key={v.ctsp_ma}
                        variant={v}
                        isOpen={expanded === v.ctsp_ma}
                        onToggle={() =>
                          setExpanded((prev) =>
                            prev === v.ctsp_ma ? null : v.ctsp_ma,
                          )
                        }
                        onApprove={onApprove}
                        onSuspend={onSuspend}
                        onOpenImage={onOpenImage}
                        approving={approvingCtsp === v.ctsp_ma}
                      />
                    ))
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

/* ===================== TRANG CHÍNH ===================== */

const QuanLySanPhamAdmin = () => {
  // Dữ liệu phân trang
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(24);
  const [loading, setLoading] = useState(true);
  const listTopRef = useRef(null);

  // Bộ lọc
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [shops, setShops] = useState([]);
  const [filterShop, setFilterShop] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [categories, setCategories] = useState([]);
  const [filterCategory, setFilterCategory] = useState("");

  // Modal chi tiết
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState(false);
  const [approvingCtsp, setApprovingCtsp] = useState(null);
  const [lightbox, setLightbox] = useState(null);
  const detailReqRef = useRef(0);

  // Modal đình chỉ
  const [modalAction, setModalAction] = useState({
    isOpen: false,
    ctsp_ma: null,
    ctsp_ten: "",
    phanhoi: "",
  });

  const [processing, setProcessing] = useState(false);
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });

  const showToast = useCallback((message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(
      () => setToast({ show: false, message: "", type: "success" }),
      3000,
    );
  }, []);

  // ---- Danh sách shop: tải 1 lần ----
  const fetchShops = useCallback(async () => {
    try {
      const res = await axiosClient.get("/admin/gian-hang");
      setShops(res.data || []);
    } catch {
      /* giữ danh sách shop cũ nếu lỗi */
    }
  }, []);

  // ---- Danh sách ngành hàng: tải 1 lần ----
  const fetchCategories = useCallback(async () => {
    try {
      const res = await axiosClient.get("/nganh-hang");
      setCategories(res.data || []);
    } catch {
      /* giữ danh sách ngành hàng cũ nếu lỗi */
    }
  }, []);

  useEffect(() => {
    fetchShops();
    fetchCategories();
  }, [fetchShops, fetchCategories]);

  // ---- Danh sách sản phẩm theo trang + bộ lọc ----
  const fetchSanPham = useCallback(async () => {
    setLoading(true);
    try {
      const res = await trangThaiChiTietSanPhamService.getSanPhamPhanTrang({
        q: searchTerm || undefined,
        gh_ma: filterShop || undefined,
        trang_thai: filterStatus || undefined,
        nh_ma: filterCategory || undefined,
        page,
        limit,
      });

      const data = res.data || {};
      const pages = data.total_pages || 1;

      // Nếu trang hiện tại vượt quá tổng số trang (sau khi lọc/đình chỉ) thì lùi về trang cuối
      if (pages < page) {
        setPage(pages);
        return;
      }

      setProducts(data.rows || []);
      setTotal(data.total || 0);
      setTotalPages(pages);
    } catch (error) {
      showToast("Lỗi khi tải danh sách sản phẩm", "error");
    } finally {
      setLoading(false);
    }
  }, [
    searchTerm,
    filterShop,
    filterStatus,
    filterCategory,
    page,
    limit,
    showToast,
  ]);

  useEffect(() => {
    fetchSanPham();
  }, [fetchSanPham]);

  // ---- Debounce tìm kiếm 350ms ----
  useEffect(() => {
    const t = setTimeout(() => {
      setSearchTerm(searchInput.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const changeShop = (ma) => {
    setFilterShop(ma);
    setPage(1);
  };

  const changeStatus = (e) => {
    setFilterStatus(e.target.value);
    setPage(1);
  };

  const changeCategory = (e) => {
    setFilterCategory(e.target.value);
    setPage(1);
  };

  const changePage = (p) => {
    if (p === page) return;
    setPage(p);
    listTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // Danh sách option ngành hàng, sắp theo cây để thụt lề trong select
  const categoryOptions = useMemo(
    () => buildCategoryOptions(categories),
    [categories],
  );

  /* ================= MODAL CHI TIẾT ================= */

  const openDetail = useCallback(
    async (product) => {
      setSelectedProduct(product);
      setDetail(null);
      setDetailError(false);
      setDetailLoading(true);
      setLightbox(null);

      const reqId = detailReqRef.current + 1;
      detailReqRef.current = reqId;

      try {
        const res = await trangThaiChiTietSanPhamService.getChiTietSanPhamAdmin(
          product.sp_ma,
        );
        if (detailReqRef.current !== reqId) return;
        setDetail(res.data || null);
      } catch (error) {
        if (detailReqRef.current !== reqId) return;
        console.error("Lỗi tải chi tiết sản phẩm:", error);
        setDetailError(true);
        showToast(
          "Không tải được chi tiết sản phẩm, đang hiển thị dữ liệu rút gọn",
          "error",
        );
      } finally {
        if (detailReqRef.current === reqId) setDetailLoading(false);
      }
    },
    [showToast],
  );

  const closeDetail = useCallback(() => {
    detailReqRef.current += 1;
    setSelectedProduct(null);
    setDetail(null);
    setDetailLoading(false);
    setDetailError(false);
    setLightbox(null);
  }, []);

  // Esc để đóng lightbox -> modal đình chỉ -> modal chi tiết
  useEffect(() => {
    const isOpen = Boolean(selectedProduct) || modalAction.isOpen;
    if (!isOpen) return undefined;

    const onKeyDown = (e) => {
      if (e.key !== "Escape") return;
      if (lightbox) {
        setLightbox(null);
        return;
      }
      if (modalAction.isOpen) {
        setModalAction({ isOpen: false });
        return;
      }
      closeDetail();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedProduct, modalAction.isOpen, lightbox, closeDetail]);

  // Khoá cuộn body khi có modal
  useEffect(() => {
    if (!selectedProduct && !modalAction.isOpen) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [selectedProduct, modalAction.isOpen]);

  const openImage = useCallback((images, index) => {
    setLightbox({ images, index });
  }, []);

  /* ================= DUYỆT / ĐÌNH CHỈ ================= */

  const handleApprove = useCallback(
    async (variant) => {
      if (!variant?.ctsp_ma) return;
      const ok = window.confirm(`Duyệt phân loại "${variant.ctsp_ten}"?`);
      if (!ok) return;

      setApprovingCtsp(variant.ctsp_ma);
      try {
        await trangThaiChiTietSanPhamService.approve(
          variant.ctsp_ma,
          "Đã duyệt bởi quản trị viên",
        );
        showToast(`Đã duyệt phân loại "${variant.ctsp_ten}"`);

        const now = new Date().toISOString();

        setDetail((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            phan_loai: (prev.phan_loai || []).map((v) =>
              v.ctsp_ma === variant.ctsp_ma
                ? {
                    ...v,
                    ttctsp_ma: "TTCTSP0002",
                    ttctsp_ten: "Đang bán",
                    trangthai_lichsu: [
                      {
                        ttctsp_ma: "TTCTSP0002",
                        ttctsp_ten: "Đang bán",
                        ctttsp_thoidiem: now,
                        ctttsp_yeucau: null,
                        ctttsp_phanhoi: "Đã duyệt bởi quản trị viên",
                      },
                      ...(Array.isArray(v.trangthai_lichsu)
                        ? v.trangthai_lichsu
                        : []),
                    ],
                  }
                : v,
            ),
          };
        });

        setSelectedProduct((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            variants: (prev.variants || []).map((v) =>
              v.ctsp_ma === variant.ctsp_ma
                ? { ...v, ttctsp_ma: "TTCTSP0002" }
                : v,
            ),
          };
        });

        fetchSanPham();
      } catch (error) {
        alert(
          error.response?.data?.message || "Đã xảy ra lỗi khi duyệt phân loại",
        );
      } finally {
        setApprovingCtsp(null);
      }
    },
    [fetchSanPham, showToast],
  );

  const handleOpenSuspend = (variant) => {
    setModalAction({
      isOpen: true,
      ctsp_ma: variant.ctsp_ma,
      ctsp_ten: variant.ctsp_ten,
      phanhoi: "Sản phẩm vi phạm chính sách của sàn.",
    });
  };

  const handleConfirmSuspend = async () => {
    if (!modalAction.phanhoi.trim())
      return alert("Vui lòng nhập lý do đình chỉ!");

    const { ctsp_ma, ctsp_ten, phanhoi } = modalAction;
    setProcessing(true);
    try {
      await trangThaiChiTietSanPhamService.suspend(ctsp_ma, phanhoi);
      showToast(`Đã đình chỉ phân loại "${ctsp_ten}"`);
      setModalAction({ isOpen: false });

      const now = new Date().toISOString();

      // Cập nhật modal chi tiết đang mở
      setDetail((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          phan_loai: (prev.phan_loai || []).map((v) =>
            v.ctsp_ma === ctsp_ma
              ? {
                  ...v,
                  ttctsp_ma: "TTCTSP0003",
                  ttctsp_ten: "Bị đình chỉ",
                  trangthai_lichsu: [
                    {
                      ttctsp_ma: "TTCTSP0003",
                      ttctsp_ten: "Bị đình chỉ",
                      ctttsp_thoidiem: now,
                      ctttsp_yeucau: null,
                      ctttsp_phanhoi: phanhoi,
                    },
                    ...(Array.isArray(v.trangthai_lichsu)
                      ? v.trangthai_lichsu
                      : []),
                  ],
                }
              : v,
          ),
        };
      });

      // Cập nhật dữ liệu rút gọn (fallback)
      setSelectedProduct((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          variants: (prev.variants || []).map((v) =>
            v.ctsp_ma === ctsp_ma ? { ...v, ttctsp_ma: "TTCTSP0003" } : v,
          ),
        };
      });

      // Tải lại trang hiện tại để cập nhật số "bị đình chỉ" / bộ lọc trạng thái
      fetchSanPham();
    } catch (error) {
      alert(error.response?.data?.message || "Đã xảy ra lỗi");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* HEADER & BỘ LỌC CƠ BẢN */}
      <ProductToolbar
        title="Quản lý Sản phẩm Toàn sàn"
        subtitle="Giám sát, xem chi tiết và đình chỉ các sản phẩm vi phạm."
        total={total}
        totalLabel="sản phẩm"
        searchValue={searchInput}
        onSearchChange={setSearchInput}
        searchPlaceholder="Tìm tên SP / shop..."
        actions={
          <ProductRefreshButton
            onClick={() => {
              fetchSanPham();
              fetchShops();
              fetchCategories();
            }}
            loading={loading}
          />
        }
      >
        <select
          value={filterCategory}
          onChange={changeCategory}
          title="Lọc theo ngành hàng (bao gồm ngành hàng con)"
          className={`${productSelectClass} min-w-[180px] max-w-[240px]`}
        >
          <option value="">Tất cả ngành hàng</option>
          {categoryOptions.map((c) => (
            <option key={c.nh_ma} value={c.nh_ma}>
              {"— ".repeat(c.depth)}
              {c.nh_ten}
            </option>
          ))}
        </select>

        <select
          value={filterStatus}
          onChange={changeStatus}
          className={`${productSelectClass} min-w-[160px]`}
        >
          <option value="">Tất cả Trạng thái</option>
          <option value="TTCTSP0001">Chờ duyệt</option>
          <option value="TTCTSP0002">Đang bán</option>
          <option value="TTCTSP0003">Bị đình chỉ</option>
          <option value="DEFAULT">Chưa gửi duyệt</option>
        </select>
      </ProductToolbar>

      {/* THANH LỌC SHOP */}
      <div className="bg-white px-5 py-3 rounded-2xl shadow-sm border border-[#E2DED3] flex items-center gap-3 overflow-x-auto custom-scrollbar">
        <span className="text-sm font-semibold text-[#7A857F] whitespace-nowrap flex items-center gap-1 pr-2 border-r border-[#E2DED3]">
          <span className="material-symbols-outlined text-[18px]">
            filter_alt
          </span>{" "}
          Lọc Shop:
        </span>
        <button
          onClick={() => changeShop("")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-colors border-2 ${filterShop === "" ? "border-[#F2A93B] bg-[#FDF3E1] text-[#8A5A0B]" : "border-transparent bg-[#FBFAF7] text-[#5B6661] hover:border-[#E2DED3] hover:bg-[#F1EEE6]"}`}
        >
          <span className="material-symbols-outlined text-[18px]">
            storefront
          </span>{" "}
          Tất cả
        </button>
        {shops.map((shop) => {
          const isActive = filterShop === shop.gh_ma;
          return (
            <button
              key={shop.gh_ma}
              onClick={() => changeShop(shop.gh_ma)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-colors border-2 ${isActive ? "border-[#F2A93B] bg-[#FDF3E1] text-[#8A5A0B]" : "border-transparent bg-[#FBFAF7] text-[#3D4A44] hover:border-[#E2DED3] hover:bg-[#F1EEE6]"}`}
            >
              <div className="w-7 h-7 rounded-full border border-gray-200 overflow-hidden bg-white shrink-0">
                <Avatar
                  src={shop.gh_hinhanh}
                  role="shop"
                  name={shop.gh_ten}
                  className="w-full h-full object-cover"
                />
              </div>
              {shop.gh_ten}
            </button>
          );
        })}
      </div>

      {/* MỐC ĐẦU DANH SÁCH ĐỂ CUỘN VỀ KHI ĐỔI TRANG */}
      <div ref={listTopRef} />

      {/* DANH SÁCH THẺ SẢN PHẨM */}
      <ProductGrid
        loading={loading}
        isEmpty={products.length === 0}
        skeletonCount={8}
        empty={
          <ProductEmptyState
            icon="search_off"
            title="Không tìm thấy sản phẩm nào phù hợp."
            hint="Thử đổi từ khóa, shop, ngành hàng hoặc trạng thái."
          />
        }
      >
        {products.map((product) => {
          const variants = product.variants || [];
          const firstVariant = variants[0];
          const coverImg = firstVariant?.main_image;
          const countSuspended = variants.filter(
            (v) => v.ttctsp_ma === "TTCTSP0003",
          ).length;
          const danhMuc = [
            ...new Set(variants.map((v) => v.nh_ten).filter(Boolean)),
          ];

          return (
            <ProductCard
              key={product.sp_ma}
              image={coverImg ? imgUrl(coverImg) : ""}
              alt={product.sp_ten}
              code={product.sp_ma}
              badges={[
                { label: `${variants.length} phân loại`, tone: "gray" },
                ...(countSuspended > 0
                  ? [
                      {
                        label: `${countSuspended} bị đình chỉ`,
                        tone: "red",
                      },
                    ]
                  : []),
              ]}
              title={product.sp_ten}
              shop={product.gh_ten}
              chips={danhMuc.slice(0, 3).map((ten) => ({
                icon: "category",
                label: ten,
                tone: "green",
              }))}
              onClick={() => openDetail(product)}
              footer={
                <button
                  type="button"
                  onClick={() => openDetail(product)}
                  className="w-full rounded-xl border border-[#E2DED3] bg-[#FBFAF7] py-2 text-sm font-semibold text-[#14201C] transition-colors hover:bg-[#F1EEE6]"
                >
                  Xem chi tiết
                </button>
              }
            />
          );
        })}
      </ProductGrid>

      {/* PHÂN TRANG */}
      <PaginationBar
        page={page}
        totalPages={totalPages}
        total={total}
        limit={limit}
        pageSizes={PAGE_SIZES}
        onPageChange={changePage}
        onLimitChange={(n) => {
          setLimit(n);
          setPage(1);
        }}
        onRefresh={fetchSanPham}
        loading={loading}
      />

      {/* MODAL CHI TIẾT SẢN PHẨM */}
      {selectedProduct && (
        <ChiTietSanPhamModal
          product={selectedProduct}
          detail={detail}
          loading={detailLoading}
          error={detailError}
          onClose={closeDetail}
          onApprove={handleApprove}
          onSuspend={handleOpenSuspend}
          onOpenImage={openImage}
          approvingCtsp={approvingCtsp}
        />
      )}

      {/* LIGHTBOX ẢNH */}
      {lightbox && (
        <ImageLightbox
          images={lightbox.images}
          index={lightbox.index}
          onClose={() => setLightbox(null)}
          onPrev={() =>
            setLightbox((prev) =>
              prev
                ? {
                    ...prev,
                    index:
                      (prev.index - 1 + prev.images.length) %
                      prev.images.length,
                  }
                : prev,
            )
          }
          onNext={() =>
            setLightbox((prev) =>
              prev
                ? {
                    ...prev,
                    index: (prev.index + 1) % prev.images.length,
                  }
                : prev,
            )
          }
        />
      )}

      {/* MODAL ĐÌNH CHỈ */}
      {modalAction.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="bg-red-50 px-5 py-4 border-b border-red-100">
              <h3 className="text-lg font-bold text-red-800 flex items-center gap-2">
                <span className="material-symbols-outlined">warning</span> Đình
                chỉ Sản phẩm
              </h3>
            </div>
            <div className="p-5 space-y-3">
              <p className="text-sm text-[#5B6661]">
                Bạn đang thao tác đình chỉ phân loại:{" "}
                <b className="text-[#14201C]">{modalAction.ctsp_ten}</b>
              </p>
              <label className="block space-y-1">
                <span className="text-sm font-semibold text-[#3D4A44]">
                  Lý do đình chỉ (Sẽ gửi cho Shop){" "}
                  <span className="text-red-500">*</span>
                </span>
                <textarea
                  rows="3"
                  value={modalAction.phanhoi}
                  onChange={(e) =>
                    setModalAction({ ...modalAction, phanhoi: e.target.value })
                  }
                  className="w-full rounded-xl border border-[#D9D4C7] bg-[#FBFAF7] px-3 py-2 text-sm text-[#14201C] focus:border-[#F2A93B] focus:outline-none focus:ring-1 focus:ring-[#F2A93B]"
                  placeholder="Nhập lý do vi phạm..."
                />
              </label>
            </div>
            <div className="flex justify-end gap-3 border-t border-[#EFEBE2] bg-[#FBFAF7] p-4">
              <button
                onClick={() => setModalAction({ isOpen: false })}
                className="px-4 py-2 text-sm font-medium text-[#5B6661] hover:text-[#14201C]"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleConfirmSuspend}
                disabled={processing}
                className="rounded-lg bg-[#B42318] px-5 py-2 text-sm font-bold text-white shadow-sm hover:bg-[#901c13] disabled:opacity-50"
              >
                {processing ? "Đang xử lý..." : "Xác nhận Đình chỉ"}
              </button>
            </div>
          </div>
        </div>
      )}

      <ToastNotification toast={toast} />
    </div>
  );
};

export default QuanLySanPhamAdmin;
