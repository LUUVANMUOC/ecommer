// src/pages/shop/QuanLySanPham.jsx
import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import sanPhamService from "../../services/gianhang/sanPhamService";
import chiTietSanPhamService from "../../services/gianhang/chiTietSanPhamService"; // 🟢 Import thêm
import CrudToolbar from "../../components/common/Crud/CrudToolbar";
import ToastNotification from "../../components/common/Crud/ToastNotification";
import {
  FilterBar,
  StatCell,
  SanPhamFormDrawer,
  fetchCovers,
  formatPriceRange,
  getCurrentShopId,
  loadProductOptions,
} from "../../components/shop/SanPhamShared";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8080";
const imgUrl = (link) => (link ? `${BACKEND_URL}${link}` : "");

const STATUS_MAP = {
  TTCTSP0001: {
    label: "Chờ duyệt",
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
  },
  TTCTSP0002: {
    label: "Đang bán",
    color: "bg-green-100 text-green-800 border-green-200",
  },
  TTCTSP0003: {
    label: "Bị đình chỉ",
    color: "bg-red-100 text-red-800 border-red-200",
  },
  DEFAULT: {
    label: "Chưa gửi duyệt",
    color: "bg-gray-100 text-gray-800 border-gray-200",
  },
};

const QuanLySanPham = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const shopId = getCurrentShopId();

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [covers, setCovers] = useState({});
  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);

  // Bộ lọc
  const [filterBrand, setFilterBrand] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  // Drawer thêm/sửa sản phẩm
  const [drawer, setDrawer] = useState({
    isOpen: false,
    mode: "add",
    product: null,
  });

  // 🟢 State cho Modal Xem Phân Loại
  const [variantModal, setVariantModal] = useState({
    isOpen: false,
    product: null,
    variants: [],
    loading: false,
  });

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

  const fetchAll = async () => {
    if (!shopId) return;
    setLoading(true);
    try {
      const [resProducts, opts] = await Promise.all([
        sanPhamService.getByGianHang(shopId),
        loadProductOptions(shopId),
      ]);
      setData(resProducts.data);
      setBrands(opts.brands);
      setCategories(opts.categories);
      setCovers(await fetchCovers(resProducts.data));
    } catch (err) {
      console.error(err);
      showToast("Lỗi khi tải dữ liệu", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  useEffect(() => {
    if (location.state?.toast) {
      showToast(location.state.toast);
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.state]);

  const openAddDrawer = () =>
    setDrawer({ isOpen: true, mode: "add", product: null });
  const openEditDrawer = (e, sp) => {
    e.stopPropagation();
    setDrawer({ isOpen: true, mode: "edit", product: sp });
  };
  const closeDrawer = () => setDrawer((d) => ({ ...d, isOpen: false }));
  const handleSaved = (message) => {
    closeDrawer();
    showToast(message);
    fetchAll();
  };

  const handleDelete = async (e, sp) => {
    e.stopPropagation();
    if (!window.confirm(`Bạn có chắc chắn muốn xóa sản phẩm "${sp.sp_ten}"?`))
      return;
    try {
      await sanPhamService.delete(sp.sp_ma);
      showToast(`Đã xóa sản phẩm "${sp.sp_ten}"`);
      fetchAll();
    } catch (err) {
      alert(err.response?.data?.message || "Không thể xóa sản phẩm.");
    }
  };

  // 🟢 Hàm mở Modal Xem Phân Loại
  const handleOpenVariants = async (e, sp) => {
    e.stopPropagation();
    setVariantModal({ isOpen: true, product: sp, variants: [], loading: true });
    try {
      // Giả sử service của bạn có hàm getBySanPham để lấy danh sách phân loại
      // Nếu tên hàm khác, bạn hãy sửa lại cho đúng với service của bạn nhé
      const res = await chiTietSanPhamService.getBySanPham(sp.sp_ma);
      setVariantModal((prev) => ({
        ...prev,
        variants: res.data,
        loading: false,
      }));
    } catch (error) {
      showToast("Lỗi tải danh sách phân loại", "error");
      setVariantModal((prev) => ({ ...prev, loading: false }));
    }
  };

  const matchesFilter = (sp, brand, category, status) => {
    const spStatus = covers[sp.sp_ma]?.status || "draft";
    return (
      (brand ? sp.th_ma === brand : true) &&
      (category ? sp.dmsp_ma === category : true) &&
      (status ? spStatus === status : true)
    );
  };

  const filteredData = data.filter((sp) =>
    matchesFilter(sp, filterBrand, filterCategory, filterStatus),
  );

  const filterConfig = [
    {
      key: "status",
      label: "Trạng thái",
      options: [
        { value: "active", label: "Đang bán" },
        { value: "pending", label: "Chờ duyệt" },
        { value: "suspended", label: "Bị đình chỉ" },
        { value: "draft", label: "Chưa gửi duyệt" },
      ],
    },
    {
      key: "th_ma",
      label: "Thương hiệu",
      options: brands.map((b) => ({
        value: b.th_ma,
        label: b.th_ten,
        logo: b.th_hinhanh || b.th_logo,
      })),
    },
    {
      key: "dmsp_ma",
      label: "Danh mục",
      options: categories.map((c) => ({ value: c.dmsp_ma, label: c.dmsp_ten })),
    },
  ];

  const countResults = (draft) =>
    data.filter((sp) =>
      matchesFilter(
        sp,
        draft.th_ma || "",
        draft.dmsp_ma || "",
        draft.status || "",
      ),
    ).length;

  return (
    <div className="w-full space-y-6">
      <CrudToolbar
        title="Quản lý sản phẩm"
        subtitle="Bấm vào thẻ sản phẩm để xem chi tiết và quản lý phân loại."
        totalItems={data.length}
        onAdd={openAddDrawer}
        addButtonText="Thêm sản phẩm"
        searchPlaceholder="Tìm kiếm sản phẩm..."
      />

      <FilterBar
        filters={filterConfig}
        values={{
          th_ma: filterBrand,
          dmsp_ma: filterCategory,
          status: filterStatus,
        }}
        onApply={(vals) => {
          setFilterBrand(vals.th_ma || "");
          setFilterCategory(vals.dmsp_ma || "");
          setFilterStatus(vals.status || "");
        }}
        onClear={() => {
          setFilterBrand("");
          setFilterCategory("");
          setFilterStatus("");
        }}
        getResultCount={countResults}
        summary={`Hiển thị ${filteredData.length} / ${data.length} sản phẩm`}
      />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {loading ? (
          <div className="col-span-full py-10 text-center text-[#7A857F]">
            Đang tải...
          </div>
        ) : filteredData.length === 0 ? (
          <div className="col-span-full py-10 text-center text-[#7A857F]">
            Không có sản phẩm nào phù hợp với bộ lọc.
          </div>
        ) : (
          filteredData.map((sp) => (
            <article
              key={sp.sp_ma}
              onClick={() =>
                navigate(`/nguoi-ban/quan-ly-san-pham/${sp.sp_ma}`)
              }
              className="group flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-[#E2DED3] bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[#F2A93B] hover:shadow-lg"
            >
              <div className="relative flex h-40 items-center justify-center overflow-hidden bg-gradient-to-br from-[#F7F5F0] to-[#EFE9DC]">
                {covers[sp.sp_ma]?.url ? (
                  <img
                    src={covers[sp.sp_ma].url}
                    alt={sp.sp_ten}
                    className="h-full w-full object-contain p-4 transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <span className="material-symbols-outlined text-[44px] text-[#B8AE98]">
                    image
                  </span>
                )}
                <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-0.5 font-mono text-[11px] font-semibold text-[#3D4A44] shadow-sm">
                  {sp.sp_ma}
                </span>
                <div className="absolute right-3 top-3 flex gap-1.5 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100">
                  <button
                    onClick={(e) => openEditDrawer(e, sp)}
                    title="Sửa sản phẩm"
                    className="grid h-8 w-8 place-items-center rounded-full bg-white text-[#3D4A44] shadow-sm transition-colors hover:bg-[#14201C] hover:text-white"
                  >
                    <span className="material-symbols-outlined text-[17px]">
                      edit
                    </span>
                  </button>
                  <button
                    onClick={(e) => handleDelete(e, sp)}
                    title="Xóa sản phẩm"
                    className="grid h-8 w-8 place-items-center rounded-full bg-white text-[#B42318] shadow-sm transition-colors hover:bg-[#B42318] hover:text-white"
                  >
                    <span className="material-symbols-outlined text-[17px]">
                      delete
                    </span>
                  </button>
                </div>
              </div>

              <div className="flex flex-1 flex-col p-5">
                <h3 className="line-clamp-1 text-base font-bold text-[#14201C] transition-colors group-hover:text-[#F2A93B]">
                  {sp.sp_ten}
                </h3>
                <p className="mt-1 line-clamp-2 min-h-[2.5rem] text-sm text-[#5B6661]">
                  {sp.sp_mota || "Không có mô tả"}
                </p>

                <p className="mt-3 text-base font-bold tabular-nums text-[#B42318]">
                  {formatPriceRange(covers[sp.sp_ma])}
                </p>

                <div className="mt-2 flex flex-wrap gap-1.5">
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#FDF3E1] px-2.5 py-0.5 text-xs font-medium text-[#8A5A0B]">
                    <span className="material-symbols-outlined text-[13px]">
                      sell
                    </span>
                    {sp.th_ten || "Chưa có thương hiệu"}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#EEF3F1] px-2.5 py-0.5 text-xs font-medium text-[#2F5D50]">
                    <span className="material-symbols-outlined text-[13px]">
                      category
                    </span>
                    {sp.dmsp_ten || "Chưa có danh mục"}
                  </span>
                </div>

                {/* 🟢 NÚT XEM PHÂN LOẠI MỚI */}
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={(e) => handleOpenVariants(e, sp)}
                    className="flex-1 py-2 bg-[#F2A93B] text-white font-bold text-sm rounded-xl hover:bg-[#d9942e] transition-colors flex items-center justify-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      view_list
                    </span>
                    Xem Phân Loại
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/nguoi-ban/quan-ly-san-pham/${sp.sp_ma}`);
                    }}
                    className="px-3 py-2 bg-gray-100 text-gray-700 font-bold text-sm rounded-xl hover:bg-gray-200 transition-colors"
                    title="Quản lý chi tiết"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      settings
                    </span>
                  </button>
                </div>

                <div className="mt-auto grid grid-cols-4 divide-x divide-[#EFEBE2] overflow-hidden rounded-xl border border-[#EFEBE2] bg-[#FBFAF7] mt-4">
                  <StatCell
                    icon="visibility"
                    iconClass="text-[#5B6661]"
                    value={sp.sp_luotxem}
                    label="Lượt xem"
                  />
                  <StatCell
                    icon="favorite"
                    iconClass="text-[#C0446B]"
                    value={sp.sp_luotthich}
                    label="Yêu thích"
                  />
                  <StatCell
                    icon="shopping_bag"
                    iconClass="text-[#2F7A5F]"
                    value={sp.sp_luotmua}
                    label="Đã bán"
                  />
                  <StatCell
                    icon="star"
                    iconClass="text-[#F2A93B]"
                    value={sp.sp_diemdanhgiatrungbinh}
                    label="Đánh giá"
                  />
                </div>
              </div>
            </article>
          ))
        )}
      </div>

      <SanPhamFormDrawer
        isOpen={drawer.isOpen}
        onClose={closeDrawer}
        mode={drawer.mode}
        product={drawer.product}
        brands={brands}
        categories={categories}
        shopId={shopId}
        onSaved={handleSaved}
      />

      {/* 🟢 MODAL XEM PHÂN LOẠI */}
      {variantModal.isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-5xl bg-[#F8FAFC] rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            <div className="bg-white px-6 py-4 border-b border-[#E2DED3] flex items-center justify-between sticky top-0 z-10">
              <div>
                <h2 className="text-xl font-bold text-[#14201C]">
                  Danh sách Phân loại
                </h2>
                <p className="text-sm text-[#7A857F]">
                  Sản phẩm: {variantModal.product?.sp_ten}
                </p>
              </div>
              <button
                onClick={() => setVariantModal({ isOpen: false })}
                className="text-gray-400 hover:text-red-500 bg-gray-50 hover:bg-red-50 p-2 rounded-full transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar bg-gray-50 flex-1 space-y-4">
              {variantModal.loading ? (
                <div className="text-center py-10 text-gray-500 font-medium">
                  Đang tải phân loại...
                </div>
              ) : variantModal.variants.length === 0 ? (
                <div className="text-center py-10 text-gray-500 font-medium">
                  Sản phẩm chưa có phân loại nào.
                </div>
              ) : (
                variantModal.variants.map((item) => {
                  // Lấy trạng thái mới nhất từ mảng trangthai_lichsu do backend trả về
                  const latestStatus =
                    item.trangthai_lichsu?.[0]?.ttctsp_ma || "DEFAULT";
                  const statusCfg =
                    STATUS_MAP[latestStatus] || STATUS_MAP.DEFAULT;

                  // 🟢 Lấy ảnh chính từ mảng images (ảnh đầu tiên)
                  const mainImg =
                    item.images && item.images.length > 0
                      ? item.images[0].hasp_link
                      : null;

                  return (
                    <div
                      key={item.ctsp_ma}
                      className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex flex-col md:flex-row gap-6"
                    >
                      {/* CỘT 1: Ảnh & Thông tin cơ bản */}
                      <div className="flex gap-4 shrink-0 md:w-1/3">
                        <div className="w-20 h-20 rounded-lg border border-gray-200 overflow-hidden bg-gray-50 shrink-0">
                          {mainImg ? (
                            <img
                              src={imgUrl(mainImg)}
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
                            className={`inline-block rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider mb-2 ${statusCfg.color}`}
                          >
                            {statusCfg.label}
                          </span>
                          <p className="font-bold text-base text-[#14201C] leading-tight">
                            {item.ctsp_ten}
                          </p>
                          <p className="text-xs font-mono text-gray-500 mt-1">
                            Mã: {item.ctsp_ma}
                          </p>
                          <p className="text-lg font-bold text-red-600 mt-1">
                            {Number(item.ctsp_gianban || 0).toLocaleString(
                              "vi-VN",
                            )}{" "}
                            đ
                          </p>
                        </div>
                      </div>

                      {/* CỘT 2: Kích thước & Khối lượng & Tồn kho */}
                      <div className="flex-1 grid grid-cols-2 gap-4 text-sm bg-gray-50 p-3 rounded-lg border border-gray-100">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Tồn kho</p>
                          <p className="font-bold text-[#0F172A]">
                            {item.ctsp_soluongton}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">
                            Khối lượng
                          </p>
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
                          <p className="text-gray-700 line-clamp-2 italic text-xs">
                            "{item.ctsp_mota}"
                          </p>
                        </div>
                      </div>

                      {/* CỘT 3: Thống kê (Sử dụng đúng tên cột ctsp_...) */}
                      <div className="shrink-0 md:w-40 flex flex-col justify-center gap-2">
                        <div className="flex justify-between items-center bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100">
                          <span className="text-xs text-blue-600 font-semibold">
                            Lượt xem
                          </span>
                          <span className="font-bold text-blue-700">
                            {item.ctsp_luotxem}
                          </span>
                        </div>
                        <div className="flex justify-between items-center bg-pink-50 px-3 py-1.5 rounded-lg border border-pink-100">
                          <span className="text-xs text-pink-600 font-semibold">
                            Lượt thích
                          </span>
                          <span className="font-bold text-pink-700">
                            {item.ctsp_luotthich}
                          </span>
                        </div>
                        <div className="flex justify-between items-center bg-green-50 px-3 py-1.5 rounded-lg border border-green-100">
                          <span className="text-xs text-green-600 font-semibold">
                            Đã bán
                          </span>
                          <span className="font-bold text-green-700">
                            {item.ctsp_luotmua}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      <ToastNotification toast={toast} />
    </div>
  );
};

export default QuanLySanPham;
