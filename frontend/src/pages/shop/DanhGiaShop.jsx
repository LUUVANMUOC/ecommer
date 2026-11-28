import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { AuthContext } from "../../contexts/AuthContext";
import danhGiaShopService from "../../services/gianhang/danhGiaShopService";
import ToastNotification from "../../components/common/Crud/ToastNotification";
import Avatar from "../../components/common/Avatar";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8080";
const LIMIT = 10;
const MAX_REPLY = 1000;
const STAR_LEVELS = [5, 4, 3, 2, 1];

const keyOf = (r) => `${r.dts_ma}|${r.ctsp_ma}|${r.kh_ma}`;

const assetUrl = (path) => {
  if (!path) return "";
  const s = String(path).trim();
  if (!s) return "";
  if (/^https?:\/\//i.test(s) || s.startsWith("data:")) return s;
  return `${BACKEND_URL}${s.startsWith("/") ? s : `/${s}`}`;
};

// dgsp_hinhanh là chuỗi JSON các đường dẫn ảnh
const parseImages = (raw) => {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.filter(Boolean);
  if (typeof raw !== "string") return [];

  const value = raw.trim();
  if (!value) return [];

  if (value.startsWith("[") || value.startsWith('"')) {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed.filter(Boolean);
      if (typeof parsed === "string" && parsed.trim()) return [parsed.trim()];
    } catch {
      // dữ liệu cũ không phải JSON hợp lệ -> coi như 1 đường dẫn
    }
  }

  return [value];
};

const formatDateTime = (value) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const StarRow = ({ value = 0, size = 15 }) => {
  const filled = Math.round(Number(value) || 0);
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          className="material-symbols-outlined leading-none"
          style={{
            fontSize: `${size}px`,
            color: n <= filled ? "#F59E0B" : "#CBD5E1",
            fontVariationSettings: n <= filled ? "'FILL' 1" : "'FILL' 0",
          }}
        >
          star
        </span>
      ))}
    </span>
  );
};

const StatCard = ({ icon, label, value, accent = "text-[#0F172A]" }) => (
  <div className="rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-sm">
    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-[#94A3B8]">
      <span className="material-symbols-outlined text-[18px] text-[#2563EB]">
        {icon}
      </span>
      {label}
    </div>
    <p className={`mt-2 text-2xl font-extrabold tabular-nums ${accent}`}>
      {value}
    </p>
  </div>
);

const buildPageList = (current, total) => {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages = new Set([1, total, current, current - 1, current + 1]);
  if (current <= 4) [2, 3, 4, 5].forEach((p) => pages.add(p));
  if (current >= total - 3)
    [total - 4, total - 3, total - 2, total - 1].forEach((p) => pages.add(p));

  const sorted = [...pages]
    .filter((p) => p >= 1 && p <= total)
    .sort((a, b) => a - b);

  const out = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) out.push(`gap-${p}`);
    out.push(p);
  });
  return out;
};

const DanhGiaShop = () => {
  const { user } = useContext(AuthContext);
  const gh_ma = user?.GH_Ma;

  const [page, setPage] = useState(1);
  const [sao, setSao] = useState("");
  const [trangThai, setTrangThai] = useState("");
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [replyingKey, setReplyingKey] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [saving, setSaving] = useState(false);

  const topRef = useRef(null);
  const reqRef = useRef(0);

  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });
  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast((p) => ({ ...p, show: false })), 3000);
  };

  const load = useCallback(
    async (targetPage, targetSao, targetTrangThai) => {
      if (!gh_ma) return;
      const reqId = ++reqRef.current;
      setLoading(true);
      setError("");
      try {
        const res = await danhGiaShopService.getDanhSach(gh_ma, {
          page: targetPage,
          limit: LIMIT,
          sao: targetSao,
          phan_hoi: targetTrangThai,
        });
        if (reqRef.current !== reqId) return;
        setState(res.data);
      } catch (err) {
        if (reqRef.current !== reqId) return;
        setError(
          err.response?.data?.message || "Không tải được đánh giá của shop.",
        );
      } finally {
        if (reqRef.current === reqId) setLoading(false);
      }
    },
    [gh_ma],
  );

  useEffect(() => {
    setPage(1);
    setSao("");
    setTrangThai("");
    setState(null);
    load(1, "", "");
  }, [gh_ma, load]);

  const changeFilter = (next = {}) => {
    const nextSao = next.sao !== undefined ? next.sao : sao;
    const nextTrangThai =
      next.trang_thai !== undefined ? next.trang_thai : trangThai;
    setSao(nextSao);
    setTrangThai(nextTrangThai);
    setPage(1);
    setReplyingKey(null);
    setReplyText("");
    load(1, nextSao, nextTrangThai);
  };

  const goPage = (nextPage) => {
    const totalPages = state?.total_pages || 0;
    if (nextPage < 1) return;
    if (totalPages && nextPage > totalPages) return;
    if (nextPage === page) return;
    setPage(nextPage);
    setReplyingKey(null);
    setReplyText("");
    load(nextPage, sao, trangThai);
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const startReply = (review) => {
    setReplyingKey(keyOf(review));
    setReplyText(review.dgsp_phanhoi || "");
  };

  const cancelReply = () => {
    if (saving) return;
    setReplyingKey(null);
    setReplyText("");
  };

  const handleSave = async (review) => {
    const noiDung = replyText.trim();
    if (!noiDung) return showToast("Vui lòng nhập nội dung phản hồi.", "error");
    if (noiDung.length > MAX_REPLY)
      return showToast(`Phản hồi tối đa ${MAX_REPLY} ký tự.`, "error");

    setSaving(true);
    try {
      await danhGiaShopService.phanHoi({
        gh_ma,
        dts_ma: review.dts_ma,
        ctsp_ma: review.ctsp_ma,
        kh_ma: review.kh_ma,
        phanhoi: noiDung,
      });
      showToast("Đã gửi phản hồi!");
      setReplyingKey(null);
      setReplyText("");
      await load(page, sao, trangThai);
    } catch (err) {
      showToast(err.response?.data?.message || "Lỗi gửi phản hồi.", "error");
    } finally {
      setSaving(false);
    }
  };

  const tk = state?.thong_ke || {
    tong: 0,
    chua_phan_hoi: 0,
    trung_binh: 0,
    phan_bo: {},
  };
  const phanBo = tk.phan_bo || {};
  const reviews = state?.data || [];
  const total = state?.total || 0;
  const totalPages = state?.total_pages || 0;
  const daPhanHoi = Math.max(tk.tong - tk.chua_phan_hoi, 0);

  return (
    <div ref={topRef} className="min-h-screen scroll-mt-6 bg-[#F8FAFC] p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#0F172A]">
          Đánh Giá Của Khách
        </h1>
        <p className="mt-1 text-sm text-[#64748B]">
          Xem đánh giá khách để lại và phản hồi công khai trên trang sản phẩm.
        </p>
      </div>

      {/* THỐNG KÊ */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard icon="reviews" label="Tổng đánh giá" value={tk.tong} />
        <StatCard
          icon="star"
          label="Điểm trung bình"
          value={tk.tong > 0 ? Number(tk.trung_binh).toFixed(1) : "—"}
        />
        <StatCard
          icon="chat_bubble"
          label="Chưa phản hồi"
          value={tk.chua_phan_hoi}
          accent={tk.chua_phan_hoi > 0 ? "text-[#DC2626]" : "text-[#16A34A]"}
        />
      </div>

      {/* BỘ LỌC */}
      <div className="mb-6 space-y-3 rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 text-xs font-bold uppercase tracking-wide text-[#64748B]">
            Trạng thái
          </span>
          {[
            { key: "", label: `Tất cả (${tk.tong})` },
            { key: "chua", label: `Chưa phản hồi (${tk.chua_phan_hoi})` },
            { key: "da", label: `Đã phản hồi (${daPhanHoi})` },
          ].map((tab) => (
            <button
              key={tab.key || "all"}
              type="button"
              onClick={() => changeFilter({ trang_thai: tab.key })}
              className={`rounded-full border px-3 py-1 text-xs font-bold transition-colors ${
                trangThai === tab.key
                  ? "border-[#2563EB] bg-blue-50 text-[#2563EB]"
                  : "border-[#E2E8F0] bg-white text-[#64748B] hover:bg-[#F8FAFC]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 text-xs font-bold uppercase tracking-wide text-[#64748B]">
            Số sao
          </span>
          <button
            type="button"
            onClick={() => changeFilter({ sao: "" })}
            className={`rounded-full border px-3 py-1 text-xs font-bold transition-colors ${
              sao === ""
                ? "border-[#2563EB] bg-blue-50 text-[#2563EB]"
                : "border-[#E2E8F0] bg-white text-[#64748B] hover:bg-[#F8FAFC]"
            }`}
          >
            Tất cả
          </button>
          {STAR_LEVELS.map((n) => {
            const active = sao === String(n);
            return (
              <button
                key={n}
                type="button"
                onClick={() => changeFilter({ sao: String(n) })}
                className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-bold transition-colors ${
                  active
                    ? "border-[#2563EB] bg-blue-50 text-[#2563EB]"
                    : "border-[#E2E8F0] bg-white text-[#64748B] hover:bg-[#F8FAFC]"
                }`}
              >
                <span className="material-symbols-outlined text-[14px] text-[#F59E0B]">
                  star
                </span>
                {n} ({phanBo[n] ?? 0})
              </button>
            );
          })}
        </div>
      </div>

      {/* DANH SÁCH */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-32 animate-pulse rounded-2xl bg-[#F1F5F9]"
            />
          ))}
        </div>
      ) : error ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-red-200 py-10 text-center">
          <span className="material-symbols-outlined text-[32px] text-[#DC2626]">
            error
          </span>
          <p className="text-sm font-medium text-[#64748B]">{error}</p>
          <button
            type="button"
            onClick={() => load(page, sao, trangThai)}
            className="rounded-xl border border-[#E2E8F0] bg-white px-4 py-2 text-sm font-bold text-[#334155] hover:bg-[#F8FAFC]"
          >
            Thử lại
          </button>
        </div>
      ) : reviews.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-[#E2E8F0] py-16 text-center">
          <span className="material-symbols-outlined text-[40px] text-[#CBD5E1]">
            reviews
          </span>
          <p className="text-sm font-medium text-[#64748B]">
            {sao || trangThai
              ? "Không có đánh giá nào khớp bộ lọc."
              : "Shop chưa có đánh giá nào."}
          </p>
          {(sao || trangThai) && (
            <button
              type="button"
              onClick={() => changeFilter({ sao: "", trang_thai: "" })}
              className="rounded-xl bg-[#2563EB] px-4 py-2 text-sm font-bold text-white hover:bg-[#1D4ED8]"
            >
              Xóa bộ lọc
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((r) => {
            const images = parseImages(r.dgsp_hinhanh);
            const key = keyOf(r);
            const daCoPhanHoi = !!(r.dgsp_phanhoi && r.dgsp_phanhoi.trim());
            const dangSua = replyingKey === key;

            return (
              <div
                key={key}
                className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm"
              >
                {/* Khách + sao */}
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full border border-[#E2E8F0] bg-[#F8FAFC]">
                    <Avatar
                      src={r.kh_avatar}
                      role="khachhang"
                      name={r.kh_ten || "Khách hàng"}
                      className="h-full w-full object-cover"
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="text-sm font-bold text-[#0F172A]">
                        {r.kh_ten || "Khách hàng"}
                      </span>
                      <StarRow value={r.dgsp_sao} />
                      <span className="text-xs font-medium text-[#94A3B8]">
                        {formatDateTime(r.dgsp_thoidiem)}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                          daCoPhanHoi
                            ? "bg-green-50 text-[#16A34A]"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {daCoPhanHoi ? "Đã phản hồi" : "Chưa phản hồi"}
                      </span>
                    </div>

                    <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-[#334155]">
                      {r.dgsp_mota || (
                        <span className="italic text-[#94A3B8]">
                          Khách không để lại nội dung.
                        </span>
                      )}
                    </p>

                    {images.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {images.map((src, i) => (
                          <img
                            key={`${key}-img-${i}`}
                            src={assetUrl(src)}
                            alt={`Ảnh đánh giá ${i + 1}`}
                            loading="lazy"
                            className="h-16 w-16 rounded-xl border border-[#E2E8F0] object-cover"
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Sản phẩm */}
                <div className="mt-3 flex items-center gap-3 rounded-xl border border-[#F1F5F9] bg-[#F8FAFC] p-2.5">
                  {r.sp_hinhanh ? (
                    <img
                      src={assetUrl(r.sp_hinhanh)}
                      alt={r.sp_ten}
                      className="h-10 w-10 shrink-0 rounded-lg border border-[#E2E8F0] object-cover"
                    />
                  ) : (
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-[#94A3B8]">
                      <span className="material-symbols-outlined text-[18px]">
                        image
                      </span>
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-[#334155]">
                      {r.sp_ten}
                    </p>
                    <p className="truncate text-[11px] text-[#64748B]">
                      {r.ctsp_ten || "—"} • Đơn {r.dts_ma}
                    </p>
                  </div>
                </div>

                {/* Phản hồi */}
                {dangSua ? (
                  <div className="mt-3">
                    <textarea
                      autoFocus
                      rows={3}
                      maxLength={MAX_REPLY}
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Cảm ơn bạn đã đánh giá sản phẩm..."
                      className="w-full resize-y rounded-xl border border-[#E2E8F0] px-3 py-2 text-sm outline-none focus:border-[#2563EB]"
                    />
                    <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[11px] font-medium text-[#94A3B8]">
                        {replyText.length}/{MAX_REPLY} ký tự
                      </span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={cancelReply}
                          disabled={saving}
                          className="rounded-xl px-4 py-2 text-sm font-semibold text-[#64748B] hover:bg-gray-100 disabled:opacity-50"
                        >
                          Hủy
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSave(r)}
                          disabled={saving}
                          className="rounded-xl bg-[#2563EB] px-5 py-2 text-sm font-bold text-white hover:bg-[#1D4ED8] disabled:bg-gray-400"
                        >
                          {saving ? "Đang gửi..." : "Gửi phản hồi"}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : daCoPhanHoi ? (
                  <div className="mt-3 rounded-xl border border-[#BBF7D0] bg-[#F0FDF4] px-3 py-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs font-bold text-[#16A34A]">
                        Phản hồi của shop
                      </p>
                      <button
                        type="button"
                        onClick={() => startReply(r)}
                        className="text-xs font-bold text-[#2563EB] hover:underline"
                      >
                        Sửa
                      </button>
                    </div>
                    <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-[#334155]">
                      {r.dgsp_phanhoi}
                    </p>
                    {r.dgsp_thoidiemphanhoi && (
                      <p className="mt-1 text-[11px] font-medium text-[#94A3B8]">
                        {formatDateTime(r.dgsp_thoidiemphanhoi)}
                      </p>
                    )}
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => startReply(r)}
                    className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-[#2563EB] bg-blue-50 px-4 py-2 text-sm font-bold text-[#2563EB] hover:bg-blue-100"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      reply
                    </span>
                    Phản hồi
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* PHÂN TRANG */}
      {!loading && !error && total > 0 && (
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#E2E8F0] pt-4">
          <p className="text-xs font-medium text-[#64748B]">
            Trang {page}/{totalPages || 1} · {total} đánh giá
          </p>

          {totalPages > 1 && (
            <div className="flex flex-wrap items-center gap-1">
              <button
                type="button"
                onClick={() => goPage(page - 1)}
                disabled={page <= 1}
                className="rounded-xl border border-[#E2E8F0] bg-white px-3 py-1.5 text-xs font-bold text-[#334155] hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Trước
              </button>

              {buildPageList(page, totalPages).map((p) =>
                typeof p === "string" ? (
                  <span
                    key={p}
                    className="select-none px-1 text-xs text-[#94A3B8]"
                  >
                    …
                  </span>
                ) : (
                  <button
                    key={p}
                    type="button"
                    onClick={() => goPage(p)}
                    className={`min-w-[32px] rounded-xl border px-2.5 py-1.5 text-xs font-bold tabular-nums transition-colors ${
                      p === page
                        ? "border-[#2563EB] bg-blue-50 text-[#2563EB]"
                        : "border-[#E2E8F0] bg-white text-[#334155] hover:bg-[#F8FAFC]"
                    }`}
                  >
                    {p}
                  </button>
                ),
              )}

              <button
                type="button"
                onClick={() => goPage(page + 1)}
                disabled={page >= totalPages}
                className="rounded-xl border border-[#E2E8F0] bg-white px-3 py-1.5 text-xs font-bold text-[#334155] hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Sau
              </button>
            </div>
          )}
        </div>
      )}

      <ToastNotification toast={toast} />
    </div>
  );
};

export default DanhGiaShop;
