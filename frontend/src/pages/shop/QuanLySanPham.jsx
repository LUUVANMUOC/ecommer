// src/pages/shop/QuanLySanPham.jsx
import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import sanPhamService from "../../services/gianhang/sanPhamService";
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

const QuanLySanPham = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const shopId = getCurrentShopId();

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [covers, setCovers] = useState({});
  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);

  const [filterBrand, setFilterBrand] = useState("");
  const [filterCategory, setFilterCategory] = useState("");

  // Drawer thêm/sửa sản phẩm
  const [drawer, setDrawer] = useState({
    isOpen: false,
    mode: "add",
    product: null,
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

  // Thông báo được truyền từ trang khác (ví dụ sau khi xóa sản phẩm)
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

  const matchesFilter = (sp, brand, category) =>
    (brand ? sp.th_ma === brand : true) &&
    (category ? sp.dmsp_ma === category : true);

  const filteredData = data.filter((sp) =>
    matchesFilter(sp, filterBrand, filterCategory),
  );

  const filterConfig = [
    {
      key: "th_ma",
      label: "Thương hiệu",
      options: brands.map((b) => ({ value: b.th_ma, label: b.th_ten })),
    },
    {
      key: "dmsp_ma",
      label: "Danh mục",
      options: categories.map((c) => ({ value: c.dmsp_ma, label: c.dmsp_ten })),
    },
  ];

  const countResults = (draft) =>
    data.filter((sp) =>
      matchesFilter(sp, draft.th_ma || "", draft.dmsp_ma || ""),
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
        values={{ th_ma: filterBrand, dmsp_ma: filterCategory }}
        onApply={(vals) => {
          setFilterBrand(vals.th_ma || "");
          setFilterCategory(vals.dmsp_ma || "");
        }}
        onClear={() => {
          setFilterBrand("");
          setFilterCategory("");
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
            Không có sản phẩm nào.
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

                <div className="mt-auto grid grid-cols-4 divide-x divide-[#EFEBE2] overflow-hidden rounded-xl border border-[#EFEBE2] bg-[#FBFAF7]">
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

      <ToastNotification toast={toast} />
    </div>
  );
};

export default QuanLySanPham;
