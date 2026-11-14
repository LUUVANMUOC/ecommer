// src/pages/admin/QuanLySanPhamAdmin.jsx
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import trangThaiChiTietSanPhamService from "../../services/gianhang/trangThaiChiTietSanPhamService";
import axiosClient from "../../config/axiosClient";
import ToastNotification from "../../components/common/Crud/ToastNotification";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8080";
const imgUrl = (link) => (link ? `${BACKEND_URL}${link}` : "");
const formatVND = (n) =>
  n || n === 0 ? `${Number(n).toLocaleString("vi-VN")} đ` : "—";

const PAGE_SIZES = [12, 24, 48];

const STATUS_CONFIG = {
  TTCTSP0001: {
    label: "Chờ duyệt",
    badge: "bg-yellow-100 text-yellow-800 border-yellow-200",
  },
  TTCTSP0002: {
    label: "Đang bán",
    badge: "bg-green-100 text-green-800 border-green-200",
  },
  TTCTSP0003: {
    label: "Bị đình chỉ",
    badge: "bg-red-100 text-red-800 border-red-200",
  },
  DEFAULT: {
    label: "Chưa gửi duyệt",
    badge: "bg-gray-100 text-gray-800 border-gray-200",
  },
};

const pageBtn = (active) =>
  `h-9 min-w-9 rounded-lg border px-2 text-sm font-bold transition-colors ${
    active
      ? "border-[#F2A93B] bg-[#FDF3E1] text-[#8A5A0B]"
      : "border-[#E2DED3] bg-white text-[#3D4A44] hover:bg-[#F7F5F0]"
  }`;

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

  // Modal xem chi tiết
  const [selectedProduct, setSelectedProduct] = useState(null);

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

  const changeLimit = (e) => {
    setLimit(Number(e.target.value));
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

  const pageNumbers = useMemo(() => {
    const totalP = Math.max(1, totalPages);
    const size = 5;
    let start = Math.max(1, page - Math.floor(size / 2));
    let end = Math.min(totalP, start + size - 1);
    start = Math.max(1, end - size + 1);

    const arr = [];
    for (let i = start; i <= end; i++) arr.push(i);
    return { arr, start, end, totalP };
  }, [page, totalPages]);

  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  // Ngành hàng của sản phẩm đang mở modal
  const selectedCategories = useMemo(() => {
    if (!selectedProduct) return [];
    return [
      ...new Set(selectedProduct.variants.map((v) => v.nh_ten).filter(Boolean)),
    ];
  }, [selectedProduct]);

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
    setProcessing(true);
    try {
      await trangThaiChiTietSanPhamService.suspend(
        modalAction.ctsp_ma,
        modalAction.phanhoi,
      );
      showToast(`Đã đình chỉ phân loại "${modalAction.ctsp_ten}"`);
      setModalAction({ isOpen: false });

      // Cập nhật ngay modal đang mở
      setSelectedProduct((prev) => {
        if (!prev) return null;
        const updatedVariants = prev.variants.map((v) =>
          v.ctsp_ma === modalAction.ctsp_ma
            ? { ...v, ttctsp_ma: "TTCTSP0003" }
            : v,
        );
        return { ...prev, variants: updatedVariants };
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
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-[#E2DED3] flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#14201C]">
            Quản lý Sản phẩm Toàn sàn
          </h1>
          <p className="text-sm text-[#7A857F]">
            Giám sát và đình chỉ các sản phẩm vi phạm.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-[#7A857F] text-[20px]">
              search
            </span>
            <input
              type="text"
              placeholder="Tìm tên SP / shop..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-56 rounded-xl border border-[#D9CFC2] bg-[#FBFAF7] py-2 pl-10 pr-3 text-sm focus:border-[#F2A93B] focus:outline-none"
            />
          </div>

          <select
            value={filterCategory}
            onChange={changeCategory}
            title="Lọc theo ngành hàng (bao gồm ngành hàng con)"
            className="px-4 py-2 border border-[#E2DED3] rounded-xl text-sm font-medium text-[#3D4A44] outline-none hover:border-[#F2A93B] bg-white min-w-[180px] max-w-[240px]"
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
            className="px-4 py-2 border border-[#E2DED3] rounded-xl text-sm font-medium text-[#3D4A44] outline-none hover:border-[#F2A93B] bg-white min-w-[160px]"
          >
            <option value="">Tất cả Trạng thái</option>
            <option value="TTCTSP0001">Chờ duyệt</option>
            <option value="TTCTSP0002">Đang bán</option>
            <option value="TTCTSP0003">Bị đình chỉ</option>
            <option value="DEFAULT">Chưa gửi duyệt</option>
          </select>

          <button
            onClick={() => {
              fetchSanPham();
              fetchShops();
              fetchCategories();
            }}
            className="inline-flex items-center justify-center w-10 h-10 rounded-xl border border-[#D9CFC2] bg-white text-[#3D4A44] hover:bg-[#F7F5F0] transition-colors"
            title="Làm mới"
          >
            <span className="material-symbols-outlined text-[20px]">
              refresh
            </span>
          </button>
        </div>
      </div>

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
                {shop.gh_hinhanh ? (
                  <img
                    src={imgUrl(shop.gh_hinhanh)}
                    alt={shop.gh_ten}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-gray-400 material-symbols-outlined text-[14px]">
                    store
                  </span>
                )}
              </div>
              {shop.gh_ten}
            </button>
          );
        })}
      </div>

      {/* MỐC ĐẦU DANH SÁCH ĐỂ CUỘN VỀ KHI ĐỔI TRANG */}
      <div ref={listTopRef} />

      {/* DANH SÁCH THẺ SẢN PHẨM */}
      {loading && products.length === 0 ? (
        <div className="py-20 text-center text-[#7A857F]">
          Đang tải dữ liệu...
        </div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#E2DED3] bg-[#FBFAF7] py-16 text-center">
          <span className="material-symbols-outlined text-[48px] text-[#C9C3B5]">
            search_off
          </span>
          <p className="mt-2 text-[#5B6661]">
            Không tìm thấy sản phẩm nào phù hợp.
          </p>
        </div>
      ) : (
        <div
          className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 transition-opacity ${
            loading ? "opacity-60 pointer-events-none" : ""
          }`}
        >
          {products.map((product) => {
            const firstVariant = product.variants[0];
            const coverImg = firstVariant?.main_image;
            const countSuspended = product.variants.filter(
              (v) => v.ttctsp_ma === "TTCTSP0003",
            ).length;
            const danhMuc = [
              ...new Set(product.variants.map((v) => v.nh_ten).filter(Boolean)),
            ];

            return (
              <div
                key={product.sp_ma}
                className="bg-white rounded-2xl border border-[#E2DED3] shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col group"
              >
                <div className="aspect-square bg-[#FBFAF7] relative overflow-hidden flex items-center justify-center p-4">
                  {coverImg ? (
                    <img
                      src={imgUrl(coverImg)}
                      alt={product.sp_ten}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <span className="material-symbols-outlined text-5xl text-[#C9C3B5]">
                      image
                    </span>
                  )}
                  <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm border border-[#E2DED3] text-[#3D4A44] text-[11px] font-bold px-2 py-1 rounded shadow-sm">
                    {product.variants.length} phân loại
                  </div>
                  {countSuspended > 0 && (
                    <div className="absolute top-3 right-3 bg-red-100 text-red-700 text-[11px] font-bold px-2 py-1 rounded shadow-sm border border-red-200">
                      {countSuspended} bị đình chỉ
                    </div>
                  )}
                </div>
                <div className="p-4 flex-1 flex flex-col">
                  <h3 className="font-bold text-[#14201C] line-clamp-2 leading-tight group-hover:text-[#F2A93B] transition-colors">
                    {product.sp_ten}
                  </h3>
                  <p className="text-sm text-[#7A857F] mt-1 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">
                      storefront
                    </span>
                    <span className="truncate">{product.gh_ten}</span>
                  </p>
                  {danhMuc.length > 0 && (
                    <p
                      className="text-xs text-[#7A857F] mt-1 flex items-center gap-1"
                      title={danhMuc.join(", ")}
                    >
                      <span className="material-symbols-outlined text-[14px]">
                        category
                      </span>
                      <span className="truncate">{danhMuc.join(", ")}</span>
                    </p>
                  )}
                  <button
                    onClick={() => setSelectedProduct(product)}
                    className="mt-4 w-full py-2 bg-[#FBFAF7] border border-[#E2DED3] text-[#14201C] rounded-xl text-sm font-semibold hover:bg-[#F1EEE6] transition-colors"
                  >
                    Quản lý phân loại
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* PHÂN TRANG */}
      {total > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#E2DED3] bg-white px-5 py-3 shadow-sm">
          <p className="text-sm text-[#7A857F]">
            Hiển thị{" "}
            <b className="text-[#14201C]">
              {from}–{to}
            </b>{" "}
            / <b className="text-[#14201C]">{total}</b> sản phẩm
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <select
              value={limit}
              onChange={changeLimit}
              className="rounded-xl border border-[#E2DED3] bg-white px-3 py-2 text-sm font-medium text-[#3D4A44] outline-none hover:border-[#F2A93B]"
            >
              {PAGE_SIZES.map((s) => (
                <option key={s} value={s}>
                  {s} / trang
                </option>
              ))}
            </select>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => changePage(page - 1)}
                disabled={page <= 1}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E2DED3] bg-white text-[#3D4A44] hover:bg-[#F7F5F0] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <span className="material-symbols-outlined text-[20px]">
                  chevron_left
                </span>
              </button>

              {pageNumbers.start > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => changePage(1)}
                    className={pageBtn(page === 1)}
                  >
                    1
                  </button>
                  {pageNumbers.start > 2 && (
                    <span className="px-1 text-[#7A857F]">…</span>
                  )}
                </>
              )}

              {pageNumbers.arr.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => changePage(p)}
                  className={pageBtn(page === p)}
                >
                  {p}
                </button>
              ))}

              {pageNumbers.end < pageNumbers.totalP && (
                <>
                  {pageNumbers.end < pageNumbers.totalP - 1 && (
                    <span className="px-1 text-[#7A857F]">…</span>
                  )}
                  <button
                    type="button"
                    onClick={() => changePage(pageNumbers.totalP)}
                    className={pageBtn(page === pageNumbers.totalP)}
                  >
                    {pageNumbers.totalP}
                  </button>
                </>
              )}

              <button
                type="button"
                onClick={() => changePage(page + 1)}
                disabled={page >= totalPages}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E2DED3] bg-white text-[#3D4A44] hover:bg-[#F7F5F0] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <span className="material-symbols-outlined text-[20px]">
                  chevron_right
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🟢 MODAL CHI TIẾT SẢN PHẨM */}
      {selectedProduct && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-6xl bg-[#F8FAFC] rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            {/* Header Modal */}
            <div className="bg-white px-6 py-4 border-b border-[#E2DED3] flex items-center justify-between sticky top-0 z-10">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl border border-[#E2DED3] bg-white overflow-hidden shrink-0">
                  {selectedProduct.variants[0]?.main_image ? (
                    <img
                      src={imgUrl(selectedProduct.variants[0].main_image)}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover"
                      alt=""
                    />
                  ) : (
                    <span className="flex h-full items-center justify-center material-symbols-outlined text-[#C9C3B5]">
                      image
                    </span>
                  )}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[#14201C]">
                    {selectedProduct.sp_ten}
                  </h2>
                  <p className="text-sm text-[#7A857F]">
                    Shop: {selectedProduct.gh_ten} ({selectedProduct.gh_ma})
                  </p>
                  {selectedCategories.length > 0 && (
                    <p className="text-xs text-[#7A857F] mt-0.5">
                      Ngành hàng:{" "}
                      <b className="text-[#3D4A44]">
                        {selectedCategories.join(", ")}
                      </b>
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={() => setSelectedProduct(null)}
                className="text-gray-400 hover:text-red-500 transition-colors bg-white/50 hover:bg-white rounded-full p-1"
              >
                <span className="material-symbols-outlined text-[28px]">
                  close
                </span>
              </button>
            </div>

            {/* Body Modal */}
            <div className="p-6 overflow-y-auto custom-scrollbar bg-gray-50 flex-1 space-y-4">
              {selectedProduct.variants.map((item) => {
                const statusCfg =
                  STATUS_CONFIG[item.ttctsp_ma] || STATUS_CONFIG.DEFAULT;
                const isSuspended = item.ttctsp_ma === "TTCTSP0003";

                return (
                  <div
                    key={item.ctsp_ma}
                    className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex flex-col md:flex-row gap-6"
                  >
                    {/* CỘT 1 */}
                    <div className="flex gap-4 shrink-0 md:w-1/3">
                      <div className="w-24 h-24 rounded-lg border border-gray-200 overflow-hidden bg-gray-50 shrink-0">
                        {item.main_image ? (
                          <img
                            src={imgUrl(item.main_image)}
                            loading="lazy"
                            decoding="async"
                            className="w-full h-full object-cover"
                            alt=""
                          />
                        ) : (
                          <span className="flex h-full items-center justify-center material-symbols-outlined text-gray-300">
                            image
                          </span>
                        )}
                      </div>
                      <div>
                        <span
                          className={`inline-block rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider mb-2 ${statusCfg.badge}`}
                        >
                          {statusCfg.label}
                        </span>
                        <p className="font-bold text-lg text-[#14201C] leading-tight">
                          {item.ctsp_ten}
                        </p>
                        <p className="text-xs font-mono text-gray-500 mt-1">
                          Mã: {item.ctsp_ma}
                        </p>
                        {item.nh_ten && (
                          <p className="text-xs text-gray-500 mt-1">
                            Ngành:{" "}
                            <b className="text-gray-700">{item.nh_ten}</b>
                          </p>
                        )}
                        <p className="text-xl font-bold text-red-600 mt-2">
                          {formatVND(item.ctsp_gianban)}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Ngày tạo:{" "}
                          {new Date(item.ctsp_ngaytao).toLocaleDateString(
                            "vi-VN",
                          )}
                        </p>
                      </div>
                    </div>

                    {/* CỘT 2 */}
                    <div className="flex-1 grid grid-cols-2 gap-4 text-sm bg-gray-50 p-3 rounded-lg border border-gray-100">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Tồn kho</p>
                        <p className="font-bold text-lg text-[#0F172A]">
                          {item.ctsp_soluongton}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Khối lượng</p>
                        <p className="font-bold text-[#0F172A]">
                          {item.ctsp_khoiluong} kg
                        </p>
                      </div>
                      <div className="col-span-2 border-t border-gray-200 pt-2 mt-1">
                        <p className="text-xs text-gray-500 mb-1">
                          Kích thước (D x R x C)
                        </p>
                        <p className="font-bold text-[#0F172A]">
                          {item.ctsp_chieudai} x {item.ctsp_chieurong} x{" "}
                          {item.ctsp_chieucao} cm
                        </p>
                      </div>
                      <div className="col-span-2 border-t border-gray-200 pt-2 mt-1">
                        <p className="text-xs text-gray-500 mb-1">
                          Mô tả phân loại
                        </p>
                        <p className="text-gray-700 line-clamp-2 italic">
                          "{item.ctsp_mota}"
                        </p>
                      </div>
                    </div>

                    {/* CỘT 3 */}
                    <div className="shrink-0 md:w-48 flex flex-col justify-between">
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="bg-blue-50 rounded-lg p-2 border border-blue-100">
                          <p className="text-[10px] text-blue-600 font-semibold mb-1">
                            Lượt xem
                          </p>
                          <p className="font-bold text-blue-700">
                            {item.ctsp_luotxem}
                          </p>
                        </div>
                        <div className="bg-pink-50 rounded-lg p-2 border border-pink-100">
                          <p className="text-[10px] text-pink-600 font-semibold mb-1">
                            Lượt thích
                          </p>
                          <p className="font-bold text-pink-700">
                            {item.ctsp_luotthich}
                          </p>
                        </div>
                        <div className="bg-green-50 rounded-lg p-2 border border-green-100">
                          <p className="text-[10px] text-green-600 font-semibold mb-1">
                            Đã bán
                          </p>
                          <p className="font-bold text-green-700">
                            {item.ctsp_luotmua}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center justify-center bg-yellow-50 rounded-lg p-2 border border-yellow-100 gap-2">
                        <span className="text-xs font-semibold text-yellow-700">
                          Đánh giá TB:
                        </span>
                        <div className="flex items-center gap-1 text-yellow-500 font-bold text-lg">
                          {Number(item.ctsp_diemdanhgiatrungbinh || 0).toFixed(
                            1,
                          )}
                          <span
                            className="material-symbols-outlined text-[18px]"
                            style={{ fontVariationSettings: "'FILL' 1" }}
                          >
                            star
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleOpenSuspend(item)}
                        disabled={isSuspended}
                        className={`mt-4 w-full inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-bold transition-colors ${
                          isSuspended
                            ? "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200"
                            : "bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 shadow-sm"
                        }`}
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          block
                        </span>
                        {isSuspended ? "Đã bị đình chỉ" : "Đình chỉ phân loại"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
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
