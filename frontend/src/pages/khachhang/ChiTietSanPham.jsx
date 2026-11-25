// src/pages/khachhang/ChiTietSanPham.jsx
import { useState, useEffect, useContext, useCallback, useRef } from "react";
import {
  useParams,
  Link,
  useSearchParams,
  useNavigate,
} from "react-router-dom";
import publicSanPhamService from "../../services/san/publicSanPhamService";
import theoDoiShopService from "../../services/khachhang/theoDoiShopService";
import gioHangService from "../../services/khachhang/gioHangService";
import { AuthContext } from "../../contexts/AuthContext";
import ToastNotification from "../../components/common/Crud/ToastNotification";
import {
  Gallery,
  AttributeChips,
  formatVND,
} from "../../components/shop/SanPhamShared";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8080";

/* --------------------------------------------------------------
   KHỐI ĐÁNH GIÁ SẢN PHẨM (public — khách vãng lai cũng xem được)
   - 5 đánh giá / trang, có chọn trang
   - Lọc theo phân loại + lọc theo số sao
   - Chỉ đọc: hiển thị phản hồi của shop nếu đã có
   -------------------------------------------------------------- */
const DG_LIMIT = 5;
const DG_STAR_LEVELS = [5, 4, 3, 2, 1];

const dgKeyOf = (r) => `${r.dts_ma}|${r.ctsp_ma}|${r.kh_ma}`;

// dgsp_hinhanh là chuỗi JSON các đường dẫn ảnh
const parseReviewImages = (raw) => {
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

const reviewImgUrl = (link) => {
  if (!link) return "";
  const s = String(link).trim();
  if (!s) return "";
  if (/^https?:\/\//i.test(s) || s.startsWith("data:")) return s;
  return `${BACKEND_URL}${s.startsWith("/") ? s : `/${s}`}`;
};

const formatReviewDate = (value) => {
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

const getInitials = (name) => {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

// Danh sách số trang có dấu "…" (dùng chuỗi "gap-x" làm key)
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

const StarRow = ({ value = 0, size = 16 }) => {
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

const DanhGiaSanPhamSection = ({ sp_ma, variants = [], shopName = "" }) => {
  const [page, setPage] = useState(1);
  const [sao, setSao] = useState("");
  const [ctspMa, setCtspMa] = useState("");
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const sectionRef = useRef(null);
  const reqRef = useRef(0);

  const load = useCallback(
    async (targetPage, targetSao, targetCtsp) => {
      const reqId = ++reqRef.current;
      setLoading(true);
      setError("");
      try {
        const res = await publicSanPhamService.getDanhGia(sp_ma, {
          page: targetPage,
          limit: DG_LIMIT,
          sao: targetSao,
          ctsp_ma: targetCtsp,
        });
        if (reqRef.current !== reqId) return;
        setState(res.data);
      } catch (err) {
        if (reqRef.current !== reqId) return;
        setError(
          err.response?.data?.message || "Không tải được đánh giá sản phẩm.",
        );
      } finally {
        if (reqRef.current === reqId) setLoading(false);
      }
    },
    [sp_ma],
  );

  useEffect(() => {
    setPage(1);
    setSao("");
    setCtspMa("");
    setState(null);
    load(1, "", "");
  }, [sp_ma, load]);

  const changeFilter = (next = {}) => {
    const nextSao = next.sao !== undefined ? next.sao : sao;
    const nextCtsp = next.ctsp_ma !== undefined ? next.ctsp_ma : ctspMa;
    setSao(nextSao);
    setCtspMa(nextCtsp);
    setPage(1);
    load(1, nextSao, nextCtsp);
  };

  const goPage = (nextPage) => {
    const totalPages = state?.total_pages || 0;
    if (nextPage < 1) return;
    if (totalPages && nextPage > totalPages) return;
    if (nextPage === page) return;

    setPage(nextPage);
    load(nextPage, sao, ctspMa);
    sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const thongKe = state?.thong_ke || { trung_binh: 0, tong: 0, phan_bo: {} };
  const phanBo = thongKe.phan_bo || {};
  const reviews = state?.data || [];
  const total = state?.total || 0;
  const totalPages = state?.total_pages || 0;
  const hasFilter = sao !== "" || ctspMa !== "";
  const avg = Number(thongKe.trung_binh) || 0;

  return (
    <section
      ref={sectionRef}
      id="danh-gia-san-pham"
      className="scroll-mt-24 bg-white rounded-3xl shadow-sm border border-[#E2E8F0] p-6 lg:p-8"
    >
      {/* Tiêu đề */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E2E8F0] pb-4">
        <div>
          <h2 className="text-lg font-bold text-[#0F172A]">
            Đánh giá sản phẩm
          </h2>
          <p className="text-xs font-medium text-[#64748B] mt-0.5">
            Dựa trên đánh giá của khách đã mua hàng
          </p>
        </div>
        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-[#2563EB]">
          {thongKe.tong} đánh giá
        </span>
      </div>

      {/* Tổng quan + bộ lọc */}
      <div className="grid grid-cols-1 gap-6 py-5 lg:grid-cols-[260px_minmax(0,1fr)]">
        <div className="flex flex-col items-start gap-2 rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50 to-white px-5 py-4">
          <p className="text-3xl font-extrabold tabular-nums text-[#0F172A]">
            {thongKe.tong > 0 ? avg.toFixed(1) : "—"}
            <span className="text-base font-medium text-[#64748B]">/5</span>
          </p>
          <StarRow value={avg} size={20} />
          <p className="text-xs font-medium text-[#64748B]">
            {thongKe.tong} đánh giá từ khách đã mua
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <label
              htmlFor="dg-ctsp"
              className="text-xs font-bold uppercase tracking-wide text-[#64748B]"
            >
              Phân loại
            </label>
            <select
              id="dg-ctsp"
              value={ctspMa}
              onChange={(e) => changeFilter({ ctsp_ma: e.target.value })}
              className="max-w-full rounded-xl border border-[#E2E8F0] bg-white px-3 py-1.5 text-sm font-medium text-[#334155] focus:border-[#2563EB] focus:outline-none"
            >
              <option value="">Tất cả phân loại</option>
              {variants.map((ct) => (
                <option key={ct.ctsp_ma} value={ct.ctsp_ma}>
                  {ct.ctsp_ten}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => changeFilter({ sao: "" })}
              className={`rounded-full border px-3 py-1 text-xs font-bold transition-colors ${
                sao === ""
                  ? "border-[#2563EB] bg-blue-50 text-[#2563EB]"
                  : "border-[#E2E8F0] bg-white text-[#64748B] hover:bg-[#F8FAFC]"
              }`}
            >
              Tất cả ({thongKe.tong})
            </button>

            {DG_STAR_LEVELS.map((n) => {
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
      </div>

      {/* Danh sách đánh giá */}
      <div>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-24 animate-pulse rounded-2xl bg-[#F1F5F9]"
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
              onClick={() => load(page, sao, ctspMa)}
              className="rounded-xl border border-[#E2E8F0] bg-white px-4 py-2 text-sm font-bold text-[#334155] hover:bg-[#F8FAFC]"
            >
              Thử lại
            </button>
          </div>
        ) : reviews.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-[#E2E8F0] py-10 text-center">
            <span className="material-symbols-outlined text-[36px] text-[#CBD5E1]">
              reviews
            </span>
            <p className="text-sm font-medium text-[#64748B]">
              {hasFilter
                ? "Không có đánh giá nào khớp bộ lọc."
                : "Sản phẩm chưa có đánh giá nào."}
            </p>
            {hasFilter && (
              <button
                type="button"
                onClick={() => changeFilter({ sao: "", ctsp_ma: "" })}
                className="rounded-xl bg-[#2563EB] px-4 py-2 text-sm font-bold text-white hover:bg-[#1D4ED8]"
              >
                Xóa bộ lọc
              </button>
            )}
          </div>
        ) : (
          <ul className="divide-y divide-[#E2E8F0]">
            {reviews.map((r) => {
              const images = parseReviewImages(r.dgsp_hinhanh);
              const key = dgKeyOf(r);

              return (
                <li key={key} className="py-5 first:pt-0 last:pb-0">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full border border-[#E2E8F0] bg-[#F8FAFC]">
                      {r.kh_avatar ? (
                        <img
                          src={reviewImgUrl(r.kh_avatar)}
                          alt={r.kh_ten || "Khách hàng"}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center text-sm font-bold text-[#2563EB]">
                          {getInitials(r.kh_ten)}
                        </span>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span className="text-sm font-bold text-[#0F172A]">
                          {r.kh_ten || "Khách hàng"}
                        </span>
                        <StarRow value={r.dgsp_sao} size={15} />
                        {r.ctsp_ten && (
                          <span className="rounded-md bg-[#F1F5F9] px-2 py-0.5 text-[11px] font-semibold text-[#334155]">
                            {r.ctsp_ten}
                          </span>
                        )}
                        <span className="text-xs font-medium text-[#94A3B8]">
                          {formatReviewDate(r.dgsp_thoidiem)}
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
                              src={reviewImgUrl(src)}
                              alt={`Ảnh đánh giá ${i + 1}`}
                              loading="lazy"
                              className="h-16 w-16 rounded-xl border border-[#E2E8F0] object-cover"
                            />
                          ))}
                        </div>
                      )}

                      {r.dgsp_phanhoi && (
                        <div className="mt-3 rounded-xl border border-[#BBF7D0] bg-[#F0FDF4] px-3 py-2">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-xs font-bold text-[#16A34A]">
                              Phản hồi từ {shopName || "shop"}
                            </p>
                            {r.dgsp_thoidiemphanhoi && (
                              <p className="text-[11px] font-medium text-[#94A3B8]">
                                {formatReviewDate(r.dgsp_thoidiemphanhoi)}
                              </p>
                            )}
                          </div>
                          <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-[#334155]">
                            {r.dgsp_phanhoi}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {/* Phân trang */}
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
                      className="px-1 text-xs text-[#94A3B8] select-none"
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
      </div>
    </section>
  );
};

const ChiTietSanPhamKhachHang = () => {
  const { sp_ma } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  // Phân loại đang chọn lấy thẳng từ URL → Back/Forward luôn cập nhật UI.
  const variantFromUrl = searchParams.get("ctsp_ma");

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);

  // 🟢 State số lượng
  const [quantity, setQuantity] = useState(1);

  // State cho Like
  const [isLiked, setIsLiked] = useState(false);
  const [liking, setLiking] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });
  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast((p) => ({ ...p, show: false })), 3000);
  };

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const res = await publicSanPhamService.getDetail(sp_ma);
        setProduct(res.data);
        // Đổi sản phẩm (kể cả bằng Back/Forward) thì quay về ảnh đầu tiên.
        setActiveImageIdx(0);
      } catch (error) {
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [sp_ma]);

  // URL thiếu hoặc sai ctsp_ma → thay thế entry hiện tại bằng phân loại đầu
  // tiên (replace → không sinh thêm history).
  useEffect(() => {
    if (!product?.variants?.length) return;
    const isValidVariant = product.variants.some(
      (v) => v.ctsp_ma === variantFromUrl,
    );
    if (!isValidVariant) {
      const firstVariantId = product.variants[0]?.ctsp_ma;
      if (!firstVariantId) return;
      setSearchParams({ ctsp_ma: firstVariantId }, { replace: true });
    }
  }, [product, variantFromUrl, setSearchParams]);

  useEffect(() => {
    if (user && user.kh_ma) {
      gioHangService
        .getCartCount(user.kh_ma)
        .then((res) => setCartCount(res.data.total))
        .catch(() => {});
      if (product?.gh_ma)
        theoDoiShopService
          .checkStatus(user.kh_ma, product.gh_ma)
          .then((res) => setIsFollowing(res.data.isFollowing))
          .catch(() => {});
    }
  }, [user, product]);

  const activeVariant =
    product?.variants.find((v) => v.ctsp_ma === variantFromUrl) ||
    product?.variants[0];

  // 🟢 Reset số lượng về 1 khi đổi phân loại
  useEffect(() => {
    setQuantity(1);
  }, [activeVariant?.ctsp_ma]);

  // 🟢 LOGIC ĐẾM 30 GIÂY ĐỂ TÍNH LƯỢT XEM
  useEffect(() => {
    if (!activeVariant?.ctsp_ma) return;

    const timer = setTimeout(() => {
      publicSanPhamService
        .recordView({
          ctsp_ma: activeVariant.ctsp_ma,
          kh_ma: user?.kh_ma || null,
        })
        .catch((err) => console.log("Lỗi lưu lượt xem:", err));
    }, 30000); // 30.000 ms = 30 giây

    return () => clearTimeout(timer);
  }, [activeVariant?.ctsp_ma, user?.kh_ma]);

  const handleSelectVariant = (variant) => {
    setActiveImageIdx(0);
    // replace: đổi phân loại không tạo history entry, để nút Back thoát khỏi
    // trang chi tiết thay vì "kẹt" lại ở đây.
    setSearchParams({ ctsp_ma: variant.ctsp_ma }, { replace: true });
  };

  // 🟢 Hàm xử lý tăng/giảm số lượng
  const handleQuantityChange = (val) => {
    const newQty = quantity + val;
    const maxStock = activeVariant?.ctsp_soluongton || 0;
    if (newQty >= 1 && newQty <= maxStock) {
      setQuantity(newQty);
    }
  };

  // Xử lý Thả tim
  const handleToggleLike = async () => {
    if (!user || user.role !== "khachhang") {
      showToast("Vui lòng đăng nhập để thích sản phẩm!", "error");
      return navigate("/khach-hang/login");
    }
    if (!activeVariant || liking) return;

    setLiking(true);
    const previousLikedState = isLiked;
    setIsLiked(!isLiked); // Optimistic UI

    try {
      await publicSanPhamService.toggleLike(activeVariant.ctsp_ma, !isLiked);
      showToast(
        !isLiked ? "Đã thêm vào danh sách yêu thích!" : "Đã bỏ yêu thích!",
        "success",
      );
    } catch (error) {
      setIsLiked(previousLikedState);
      showToast("Có lỗi xảy ra, vui lòng thử lại!", "error");
    } finally {
      setLiking(false);
    }
  };

  const handleAddToCart = async (isBuyNow = false) => {
    if (!user || user.role !== "khachhang")
      return navigate("/khach-hang/login");
    if (activeVariant?.ctsp_soluongton <= 0)
      return showToast("Hết hàng", "error");

    // 🟢 XỬ LÝ KHI BẤM NÚT "MUA NGAY"
    if (isBuyNow) {
      const buyNowItem = {
        gh_ma: product.gh_ma,
        gh_ten: product.gh_ten,
        sp_ma: product.sp_ma,
        sp_ten: product.sp_ten,
        ctsp_ma: activeVariant.ctsp_ma,
        ctsp_ten: activeVariant.ctsp_ten,
        image: activeVariant.images?.[0]?.hasp_link || "",
        ctsp_gianban: activeVariant.ctsp_gianban,
        ctgh_soluong: quantity,
        ctsp_soluongton: activeVariant.ctsp_soluongton,
      };

      const totalPrice = Number(activeVariant.ctsp_gianban) * quantity;

      navigate("/khach-hang/thanh-toan", {
        state: {
          checkoutItems: [buyNowItem],
          totalPrice: totalPrice,
        },
      });
      return;
    }

    // 🟢 XỬ LÝ KHI BẤM NÚT "THÊM VÀO GIỎ"
    try {
      await gioHangService.addToCart({
        kh_ma: user.kh_ma,
        ctsp_ma: activeVariant.ctsp_ma,
        soluong: quantity,
      });
      showToast("Đã thêm vào giỏ hàng!");
      gioHangService
        .getCartCount(user.kh_ma)
        .then((res) => setCartCount(res.data.total));
    } catch (error) {
      showToast(error.response?.data?.message || "Lỗi!", "error");
    }
  };

  if (loading)
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center text-[#64748B] font-medium">
        Đang tải...
      </div>
    );
  if (!product)
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center text-[#DC2626] font-bold">
        Sản phẩm không tồn tại!
      </div>
    );

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-16 font-sans">
      <header className="bg-white shadow-sm mb-6 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link
            to="/"
            className="text-2xl font-bold text-[#2563EB] flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-3xl">
              storefront
            </span>{" "}
            CT255 Shop
          </Link>
          <div className="flex items-center gap-5 text-sm font-semibold">
            <Link
              to="/khach-hang/gio-hang"
              className="relative text-[#334155] hover:text-[#2563EB] transition-colors"
            >
              <span className="material-symbols-outlined text-[24px]">
                shopping_cart
              </span>
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-[#DC2626] text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full border-2 border-white shadow-sm">
                  {cartCount}
                </span>
              )}
            </Link>
            <div className="w-px h-5 bg-[#E2E8F0]"></div>
            {user ? (
              <Link
                to="/khach-hang/thong-tin-ca-nhan"
                className="flex items-center gap-2 hover:text-[#2563EB] transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-[#2563EB] text-white flex items-center justify-center text-xs">
                  {user.kh_ten?.charAt(0).toUpperCase()}
                </div>
                {user.kh_ten}
              </Link>
            ) : (
              <Link to="/khach-hang/login">Đăng nhập</Link>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6">
        <div className="text-sm font-medium text-[#64748B] mb-6 flex gap-2 items-center">
          <Link to="/" className="hover:text-[#2563EB] transition-colors">
            Trang chủ
          </Link>{" "}
          <span className="text-[#CBD5E1]">/</span>
          <Link
            to="/san-pham"
            className="hover:text-[#2563EB] transition-colors"
          >
            Sản phẩm
          </Link>{" "}
          <span className="text-[#CBD5E1]">/</span>
          <span className="text-[#0F172A]">{product.sp_ten}</span>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-[#E2E8F0] p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-[450px_1fr] gap-10 mb-6">
          <div>
            <div className="aspect-square rounded-2xl overflow-hidden bg-[#F8FAFC] border border-[#E2E8F0] mb-4">
              <Gallery
                images={activeVariant?.images || []}
                index={activeImageIdx}
                onIndex={setActiveImageIdx}
              />
            </div>
          </div>

          <div className="flex flex-col">
            {/* TIÊU ĐỀ VÀ NÚT LIKE */}
            <div className="flex items-start gap-3 mb-3 justify-between">
              <div className="flex items-center gap-3">
                <span className="bg-[#2563EB] text-white text-xs px-2.5 py-1 rounded-md font-bold uppercase tracking-wider shadow-sm h-fit">
                  Chính hãng
                </span>
                <h1 className="text-2xl font-bold text-[#0F172A] leading-snug">
                  {product.sp_ten}
                </h1>
              </div>

              <button
                onClick={handleToggleLike}
                disabled={liking}
                className={`shrink-0 w-11 h-11 flex items-center justify-center rounded-full border transition-all duration-300 ${
                  isLiked
                    ? "bg-red-50 border-red-200 text-red-500 hover:bg-red-100"
                    : "bg-white border-[#E2E8F0] text-gray-400 hover:text-red-500 hover:border-red-200"
                } ${liking ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                title={isLiked ? "Bỏ yêu thích" : "Thêm vào yêu thích"}
              >
                <span
                  className={`material-symbols-outlined text-[24px] transition-transform duration-300 ${isLiked ? "scale-110 fill-current" : "scale-100"}`}
                  style={{
                    fontVariationSettings: isLiked ? "'FILL' 1" : "'FILL' 0",
                  }}
                >
                  favorite
                </span>
              </button>
            </div>

            <div className="flex items-center gap-6 text-sm font-medium text-[#64748B]">
              <span className="flex items-center gap-1 text-[#0F172A] bg-[#F1F5F9] px-2 py-0.5 rounded">
                <span className="material-symbols-outlined text-[16px] text-[#F59E0B]">
                  star
                </span>
                {product.sp_diemdanhgiatrungbinh || 0}
              </span>
              <div className="w-px h-4 bg-[#E2E8F0]"></div>
              <span>
                Đã bán {activeVariant?.ctsp_luotmua || product.sp_luotmua || 0}
              </span>
              <div className="w-px h-4 bg-[#E2E8F0]"></div>
              <span>Lượt xem {activeVariant?.ctsp_luotxem || 0}</span>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-white p-5 rounded-2xl mt-5 border border-blue-100 flex items-center">
              <span className="text-4xl font-extrabold text-[#DC2626]">
                {formatVND(activeVariant?.ctsp_gianban)}
              </span>
            </div>

            <div className="mt-8 space-y-5">
              <div className="flex items-start">
                <span className="w-24 text-sm font-semibold text-[#64748B] pt-2">
                  Phân loại:
                </span>
                <div className="flex flex-wrap gap-3">
                  {product.variants.map((v) => (
                    <button
                      key={v.ctsp_ma}
                      onClick={() => handleSelectVariant(v)}
                      className={`px-5 py-2.5 text-sm font-semibold rounded-xl border-2 transition-all ${activeVariant?.ctsp_ma === v.ctsp_ma ? "border-[#2563EB] bg-blue-50 text-[#2563EB] shadow-sm relative" : "border-[#E2E8F0] text-[#334155] hover:border-[#2563EB]/60 bg-white"}`}
                    >
                      {activeVariant?.ctsp_ma === v.ctsp_ma && (
                        <span className="absolute -top-1.5 -right-1.5 material-symbols-outlined text-[#2563EB] text-[16px] bg-white rounded-full">
                          check_circle
                        </span>
                      )}
                      {v.ctsp_ten}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center">
                <span className="w-24 text-sm font-semibold text-[#64748B]">
                  Số lượng:
                </span>
                <div className="flex items-center border border-[#E2E8F0] rounded-xl overflow-hidden bg-white">
                  <button
                    onClick={() => handleQuantityChange(-1)}
                    disabled={
                      quantity <= 1 || activeVariant?.ctsp_soluongton <= 0
                    }
                    className="px-4 py-2 hover:bg-[#F8FAFC] text-[#334155] transition-colors border-r border-[#E2E8F0] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    -
                  </button>
                  <input
                    type="text"
                    value={quantity}
                    className="w-14 text-center text-sm font-bold text-[#0F172A] outline-none"
                    readOnly
                  />
                  <button
                    onClick={() => handleQuantityChange(1)}
                    disabled={quantity >= (activeVariant?.ctsp_soluongton || 0)}
                    className="px-4 py-2 hover:bg-[#F8FAFC] text-[#334155] transition-colors border-l border-[#E2E8F0] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    +
                  </button>
                </div>
                <span className="ml-5 text-sm font-medium text-[#64748B]">
                  <b className="text-[#0F172A]">
                    {activeVariant?.ctsp_soluongton}
                  </b>{" "}
                  sản phẩm có sẵn
                </span>
              </div>
            </div>

            <div className="mt-10 flex gap-4">
              <button
                onClick={() => handleAddToCart(false)}
                className="flex items-center justify-center gap-2 px-8 py-3.5 border-2 border-[#2563EB] text-[#2563EB] bg-blue-50 hover:bg-blue-100 font-bold rounded-xl transition-colors flex-1"
              >
                <span className="material-symbols-outlined">
                  add_shopping_cart
                </span>{" "}
                Thêm Vào Giỏ
              </button>
              <button
                onClick={() => handleAddToCart(true)}
                className="px-12 py-3.5 bg-[#DC2626] text-white font-bold rounded-xl hover:bg-[#B91C1C] shadow-md transition-colors flex-1"
              >
                Mua Ngay
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-[#E2E8F0] p-5 flex items-center justify-between mb-6">
          <Link
            to={`/shop/${product.gh_ma}`}
            className="flex items-center gap-4 cursor-pointer group"
          >
            <div className="w-14 h-14 rounded-full border-2 border-blue-100 overflow-hidden bg-[#F8FAFC] p-1 group-hover:border-[#2563EB] transition-colors">
              <img
                src={
                  product.gh_hinhanh
                    ? `${BACKEND_URL}${product.gh_hinhanh}`
                    : "https://placehold.co/100x100"
                }
                className="w-full h-full object-cover rounded-full"
              />
            </div>
            <div>
              <h3 className="font-bold text-[#0F172A] text-lg flex items-center gap-1 group-hover:text-[#2563EB] transition-colors">
                {product.gh_ten}{" "}
                <span className="material-symbols-outlined text-[16px] text-[#2563EB]">
                  verified
                </span>
              </h3>
              <p className="text-xs font-medium text-[#64748B] flex items-center gap-1 mt-0.5 group-hover:text-[#2563EB] transition-colors">
                Xem Shop{" "}
                <span className="material-symbols-outlined text-[14px]">
                  arrow_forward_ios
                </span>
              </p>
            </div>
          </Link>

          <div className="flex gap-2">
            <button
              onClick={async () => {
                if (!user || user.role !== "khachhang") {
                  showToast(
                    "Vui lòng đăng nhập bằng tài khoản khách hàng để theo dõi Shop!",
                    "error",
                  );
                  return navigate("/khach-hang/login");
                }

                try {
                  const res = await theoDoiShopService.toggleFollow(
                    user.kh_ma,
                    product.gh_ma,
                  );
                  setIsFollowing(res.data.isFollowing);
                  showToast(
                    res.data.isFollowing
                      ? "Đã theo dõi Shop thành công!"
                      : "Đã bỏ theo dõi Shop!",
                    "success",
                  );
                } catch (error) {
                  showToast("Có lỗi xảy ra, vui lòng thử lại!", "error");
                }
              }}
              className={`px-5 py-2 text-sm font-bold rounded-xl flex items-center gap-1 border transition-colors ${isFollowing ? "bg-gray-100 border-[#E2E8F0] text-gray-600" : "border-[#2563EB] text-[#2563EB] bg-blue-50 hover:bg-blue-100"}`}
            >
              <span className="material-symbols-outlined text-[18px]">
                {isFollowing ? "check" : "add"}
              </span>{" "}
              {isFollowing ? "Đang Theo Dõi" : "Theo Dõi Shop"}
            </button>
          </div>
        </div>

        {/* 🟢 PHẦN CHI TIẾT SẢN PHẨM ĐÃ ĐƯỢC CẬP NHẬT THÊM THÔNG SỐ */}
        <div className="bg-white rounded-3xl shadow-sm border border-[#E2E8F0] p-6 lg:p-8">
          <h2 className="text-lg font-bold text-[#0F172A] bg-[#F8FAFC] p-3 rounded-xl mb-5 inline-block">
            Chi Tiết Sản Phẩm
          </h2>
          <p className="text-sm text-[#334155] whitespace-pre-line leading-relaxed">
            {product.sp_mota}
          </p>

          {/* 🟢 THÊM KHỐI THÔNG SỐ MẶC ĐỊNH CỦA PHÂN LOẠI */}
          <div className="mt-8 pt-6 border-t border-[#E2E8F0]">
            <h3 className="font-bold text-sm text-[#0F172A] mb-4">
              Thông số sản phẩm:
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-8 text-sm">
              <div className="flex">
                <span className="w-28 text-[#64748B]">Ngành hàng:</span>
                <span className="font-medium text-[#0F172A]">
                  {activeVariant?.nh_ten || "Chưa cập nhật"}
                </span>
              </div>
              <div className="flex">
                <span className="w-28 text-[#64748B]">Thương hiệu:</span>
                <span className="font-medium text-[#0F172A]">
                  {product.th_ten || "Chưa cập nhật"}
                </span>
              </div>
              <div className="flex">
                <span className="w-28 text-[#64748B]">Kích thước:</span>
                <span className="font-medium text-[#0F172A]">
                  {activeVariant?.ctsp_chieudai || 0} x{" "}
                  {activeVariant?.ctsp_chieurong || 0} x{" "}
                  {activeVariant?.ctsp_chieucao || 0} cm
                </span>
              </div>
              <div className="flex">
                <span className="w-28 text-[#64748B]">Khối lượng:</span>
                <span className="font-medium text-[#0F172A]">
                  {activeVariant?.ctsp_khoiluong || 0} kg
                </span>
              </div>
            </div>
          </div>

          {activeVariant?.thuoctinh?.length > 0 && (
            <div className="mt-8 pt-6 border-t border-[#E2E8F0]">
              <h3 className="font-bold text-sm text-[#0F172A] mb-3">
                Thuộc tính phân loại:
              </h3>
              <AttributeChips attributes={activeVariant.thuoctinh} />
            </div>
          )}
        </div>

        {/* 🟢 KHỐI ĐÁNH GIÁ — cuối trang, khách vãng lai vẫn xem được */}
        <div className="mt-6">
          <DanhGiaSanPhamSection
            sp_ma={sp_ma}
            variants={product.variants || []}
            shopName={product.gh_ten}
          />
        </div>
      </div>
      <ToastNotification toast={toast} />
    </div>
  );
};
export default ChiTietSanPhamKhachHang;
