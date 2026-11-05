// src/pages/admin/DuyetSanPham.jsx
import { useState, useEffect, useMemo } from "react";
import trangThaiChiTietSanPhamService from "../../services/gianhang/trangThaiChiTietSanPhamService";
import axiosClient from "../../config/axiosClient";
import ToastNotification from "../../components/common/Crud/ToastNotification";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8080";

const formatVND = (n) =>
  n || n === 0 ? `${Number(n).toLocaleString("vi-VN")} đ` : "Chưa có giá";
const imgUrl = (link) => `${BACKEND_URL}${link}`;

const DuyetSanPham = () => {
  const [rawData, setRawData] = useState([]);
  const [loading, setLoading] = useState(true);

  // State cho bộ lọc
  const [shops, setShops] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filterShop, setFilterShop] = useState("");
  const [filterCategory, setFilterCategory] = useState("");

  // State cho Modal xem chi tiết sản phẩm
  const [selectedProduct, setSelectedProduct] = useState(null);

  // 🟢 State cho Lightbox (Phóng to ảnh)
  const [zoomImage, setZoomImage] = useState(null);

  // State cho Modal xử lý (Duyệt / Từ chối)
  const [modalAction, setModalAction] = useState({
    isOpen: false,
    type: "approve",
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

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(
      () => setToast({ show: false, message: "", type: "success" }),
      3000,
    );
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resChoDuyet, resShops, resCategories] = await Promise.all([
        trangThaiChiTietSanPhamService.getChoDuyet(),
        axiosClient.get("/admin/gian-hang").catch(() => ({ data: [] })),
        axiosClient.get("/nganh-hang").catch(() => ({ data: [] })),
      ]);

      setRawData(resChoDuyet.data || []);
      setShops(resShops.data || []);
      setCategories(resCategories.data || []);
    } catch (error) {
      showToast("Lỗi khi tải dữ liệu", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const groupedProducts = useMemo(() => {
    const grouped = rawData.reduce((acc, item) => {
      if (!acc[item.sp_ma]) {
        acc[item.sp_ma] = {
          sp_ma: item.sp_ma,
          sp_ten: item.sp_ten,
          gh_ma: item.gh_ma,
          gh_ten: item.gh_ten || item.gh_ma,
          variants: [],
        };
      }
      acc[item.sp_ma].variants.push(item);
      return acc;
    }, {});
    return Object.values(grouped);
  }, [rawData]);

  const filteredProducts = useMemo(() => {
    return groupedProducts.filter((product) => {
      const matchShop = !filterShop || product.gh_ma === filterShop;
      const matchCategory =
        !filterCategory ||
        product.variants.some((v) => v.nh_ma === filterCategory);
      return matchShop && matchCategory;
    });
  }, [groupedProducts, filterShop, filterCategory]);

  const handleOpenActionModal = (variant, type) => {
    setModalAction({
      isOpen: true,
      type,
      ctsp_ma: variant.ctsp_ma,
      ctsp_ten: variant.ctsp_ten,
      phanhoi:
        type === "approve"
          ? "Đã kiểm duyệt, sản phẩm đạt tiêu chuẩn và được phép bán."
          : "Thông tin sản phẩm chưa đầy đủ hoặc vi phạm chính sách sàn.",
    });
  };

  const handleConfirmAction = async () => {
    if (!modalAction.phanhoi.trim()) return alert("Vui lòng nhập phản hồi!");

    setProcessing(true);
    try {
      if (modalAction.type === "approve") {
        await trangThaiChiTietSanPhamService.approve(
          modalAction.ctsp_ma,
          modalAction.phanhoi,
        );
        showToast(`Đã duyệt phân loại "${modalAction.ctsp_ten}"`);
      } else {
        await trangThaiChiTietSanPhamService.suspend(
          modalAction.ctsp_ma,
          modalAction.phanhoi,
        );
        showToast(`Đã từ chối phân loại "${modalAction.ctsp_ten}"`);
      }

      setModalAction({ isOpen: false });
      fetchData();

      if (selectedProduct) {
        setSelectedProduct((prev) => {
          if (!prev) return null;
          const newVariants = prev.variants.filter(
            (v) => v.ctsp_ma !== modalAction.ctsp_ma,
          );
          if (newVariants.length === 0) return null;
          return { ...prev, variants: newVariants };
        });
      }
    } catch (error) {
      alert(error.response?.data?.message || "Đã xảy ra lỗi");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="w-full space-y-6 relative">
      {/* HEADER & BỘ LỌC */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-[#E2DED3] flex flex-wrap items-center justify-between gap-4 sticky top-0 z-10">
        <div>
          <h1 className="text-2xl font-bold text-[#14201C]">Duyệt Sản Phẩm</h1>
          <p className="text-sm text-[#7A857F]">
            Xem xét và phê duyệt các phân loại sản phẩm do người bán gửi lên.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={filterShop}
            onChange={(e) => setFilterShop(e.target.value)}
            className="px-4 py-2 border border-[#E2DED3] rounded-xl text-sm font-medium text-[#3D4A44] outline-none hover:border-[#F2A93B] bg-white min-w-[160px]"
          >
            <option value="">Tất cả Shop</option>
            {shops.map((shop) => (
              <option key={shop.gh_ma} value={shop.gh_ma}>
                {shop.gh_ten}
              </option>
            ))}
          </select>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-4 py-2 border border-[#E2DED3] rounded-xl text-sm font-medium text-[#3D4A44] outline-none hover:border-[#F2A93B] bg-white min-w-[160px]"
          >
            <option value="">Tất cả Ngành hàng</option>
            {categories.map((cat) => (
              <option key={cat.nh_ma} value={cat.nh_ma}>
                {cat.nh_ten}
              </option>
            ))}
          </select>

          <button
            onClick={fetchData}
            className="inline-flex items-center justify-center w-10 h-10 rounded-xl border border-[#D9CFC2] bg-white text-[#3D4A44] hover:bg-[#F7F5F0] transition-colors"
            title="Làm mới"
          >
            <span className="material-symbols-outlined text-[20px]">
              refresh
            </span>
          </button>
        </div>
      </div>

      {/* DANH SÁCH SẢN PHẨM */}
      {loading ? (
        <div className="py-20 text-center text-[#7A857F]">
          Đang tải dữ liệu...
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#E2DED3] bg-[#FBFAF7] py-16 text-center">
          <span className="material-symbols-outlined text-[48px] text-[#C9C3B5]">
            inbox
          </span>
          <p className="mt-2 text-[#5B6661]">
            Không có sản phẩm nào đang chờ duyệt phù hợp với bộ lọc.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredProducts.map((product) => {
            const firstVariant = product.variants[0];
            const coverImg = firstVariant?.images?.[0]?.hasp_link;

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
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <span className="material-symbols-outlined text-5xl text-[#C9C3B5]">
                      image
                    </span>
                  )}
                  <div className="absolute top-3 left-3 bg-yellow-100 text-yellow-800 text-[11px] font-bold px-2 py-1 rounded shadow-sm">
                    {product.variants.length} phân loại chờ
                  </div>
                </div>
                <div className="p-4 flex-1 flex flex-col">
                  <h3 className="font-bold text-[#14201C] line-clamp-2 leading-tight group-hover:text-[#F2A93B] transition-colors">
                    {product.sp_ten}
                  </h3>
                  <p className="text-sm text-[#7A857F] mt-1 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">
                      storefront
                    </span>
                    {product.gh_ten}
                  </p>
                  <button
                    onClick={() => setSelectedProduct(product)}
                    className="mt-4 w-full py-2 bg-[#14201C] text-white rounded-xl text-sm font-semibold hover:bg-[#1E3A34] transition-colors"
                  >
                    Xem chi tiết & Duyệt
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 🟢 MODAL CHI TIẾT SẢN PHẨM (Cột ảnh to hơn, click để phóng to) */}
      {selectedProduct && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-6xl bg-[#F8FAFC] rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            {/* Header Modal */}
            <div className="bg-white px-6 py-4 border-b border-[#E2DED3] flex items-center justify-between sticky top-0 z-10">
              <div>
                <h2 className="text-xl font-bold text-[#14201C]">
                  Chi tiết Sản phẩm: {selectedProduct.sp_ten}
                </h2>
                <p className="text-sm text-[#7A857F]">
                  Shop: {selectedProduct.gh_ten} ({selectedProduct.gh_ma})
                </p>
              </div>
              <button
                onClick={() => setSelectedProduct(null)}
                className="text-gray-400 hover:text-red-500 transition-colors"
              >
                <span className="material-symbols-outlined text-[28px]">
                  close
                </span>
              </button>
            </div>

            {/* Body Modal: Danh sách Phân loại */}
            <div className="p-6 overflow-y-auto space-y-6 custom-scrollbar">
              {selectedProduct.variants.map((item) => (
                <div
                  key={item.ctsp_ma}
                  className="flex flex-col lg:flex-row overflow-hidden rounded-2xl border border-[#E2DED3] bg-white shadow-sm"
                >
                  {/* 🟢 Cột Ảnh: Tăng kích thước lên 400px */}
                  <div className="w-full lg:w-[400px] shrink-0 bg-[#FBFAF7] p-4 flex flex-col border-b lg:border-b-0 lg:border-r border-[#EFEBE2]">
                    <div
                      className="relative aspect-square w-full rounded-xl overflow-hidden border border-[#E2DED3] bg-white cursor-zoom-in group"
                      onClick={() =>
                        item.images &&
                        item.images.length > 0 &&
                        setZoomImage(imgUrl(item.images[0].hasp_link))
                      }
                    >
                      {item.images && item.images.length > 0 ? (
                        <>
                          <img
                            src={imgUrl(item.images[0].hasp_link)}
                            alt={item.ctsp_ten}
                            className="h-full w-full object-contain p-2 transition-transform duration-500 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 flex items-center justify-center transition-colors">
                            <span className="material-symbols-outlined text-white opacity-0 group-hover:opacity-100 drop-shadow-lg text-4xl">
                              zoom_in
                            </span>
                          </div>
                        </>
                      ) : (
                        <div className="flex h-full flex-col items-center justify-center text-[#C9C3B5]">
                          <span className="material-symbols-outlined text-[40px]">
                            image
                          </span>
                          <span className="text-sm mt-1">Chưa có ảnh</span>
                        </div>
                      )}
                    </div>

                    {/* Thumbnails: Click để phóng to */}
                    {item.images && item.images.length > 1 && (
                      <div className="mt-3 flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
                        {item.images.slice(1).map((img, idx) => (
                          <img
                            key={idx}
                            src={imgUrl(img.hasp_link)}
                            className="h-16 w-16 shrink-0 rounded-md border object-cover cursor-pointer hover:border-[#F2A93B] transition-colors"
                            alt="thumb"
                            onClick={() => setZoomImage(imgUrl(img.hasp_link))}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Cột Thông tin */}
                  <div className="flex-1 flex flex-col p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <span className="inline-block rounded bg-yellow-100 px-2 py-0.5 text-[11px] font-bold text-yellow-800 uppercase tracking-wide mb-1">
                          Chờ duyệt
                        </span>
                        <h3 className="text-lg font-bold text-[#14201C]">
                          {item.ctsp_ten}
                        </h3>
                        <p className="text-sm font-medium text-[#7A857F] mt-0.5">
                          Sản phẩm:{" "}
                          <span className="text-[#14201C]">{item.sp_ten}</span>{" "}
                          ({item.sp_ma})
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[11px] font-semibold text-[#7A857F] uppercase">
                          Mã CTSP
                        </p>
                        <p className="font-mono text-sm font-bold text-[#14201C]">
                          {item.ctsp_ma}
                        </p>
                      </div>
                    </div>

                    {/* Block Giá */}
                    <div className="mt-4 flex flex-wrap items-center gap-6 rounded-xl border border-[#F2A93B]/30 bg-[#FDF3E1]/40 px-4 py-3">
                      <div>
                        <p className="text-[10px] font-semibold uppercase text-[#8A5A0B]">
                          Khách trả
                        </p>
                        <p className="text-lg font-bold text-[#B42318]">
                          {formatVND(item.ctsp_gianban)}
                        </p>
                      </div>
                      <div className="h-8 w-px bg-[#F2A93B]/30 hidden sm:block" />
                      <div>
                        <p className="text-[10px] font-semibold uppercase text-[#7A857F]">
                          Shop nhận
                        </p>
                        <p className="text-base font-bold text-[#14201C]">
                          {formatVND(item.gb_gia)}
                        </p>
                      </div>
                      <div className="h-8 w-px bg-[#F2A93B]/30 hidden sm:block" />
                      <div>
                        <p className="text-[10px] font-semibold uppercase text-[#7A857F]">
                          Phí sàn
                        </p>
                        <p className="text-base font-bold text-[#3D4A44]">
                          {formatVND(
                            Number(item.ctsp_gianban || 0) -
                              Number(item.gb_gia || 0),
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Thông số */}
                    <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm border-b border-[#EFEBE2] pb-4">
                      <div>
                        <span className="text-[#7A857F] block text-xs">
                          Tồn kho
                        </span>
                        <b className="text-[#14201C]">{item.ctsp_soluongton}</b>
                      </div>
                      <div>
                        <span className="text-[#7A857F] block text-xs">
                          Ngành hàng
                        </span>
                        <b
                          className="text-[#14201C] truncate"
                          title={item.nh_ten}
                        >
                          {item.nh_ten}
                        </b>
                      </div>
                      <div>
                        <span className="text-[#7A857F] block text-xs">
                          Kích thước
                        </span>
                        <b className="text-[#14201C]">
                          {item.ctsp_chieudai} x {item.ctsp_chieurong} cm
                        </b>
                      </div>
                      <div>
                        <span className="text-[#7A857F] block text-xs">
                          Khối lượng
                        </span>
                        <b className="text-[#14201C]">
                          {item.ctsp_khoiluong} kg
                        </b>
                      </div>
                    </div>

                    {/* Thuộc tính */}
                    {item.thuoctinh && item.thuoctinh.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {item.thuoctinh.map((tt, i) => (
                          <span
                            key={i}
                            className="rounded-md bg-[#F1EEE6] px-2 py-1 text-xs text-[#3D4A44]"
                          >
                            <span className="text-[#7A857F]">
                              {tt.ttsp_ten}:
                            </span>{" "}
                            <b>
                              {tt.gttt_giatridinhtinh ||
                                tt.gttt_giatridinhluong}
                            </b>
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Mô tả */}
                    <div className="mt-4 space-y-2 flex-1">
                      <div className="text-sm">
                        <span className="font-semibold text-[#14201C]">
                          Mô tả phân loại:
                        </span>{" "}
                        <span className="text-[#5B6661]">
                          {item.ctsp_mota || "Không có"}
                        </span>
                      </div>
                      <div className="text-sm">
                        <span className="font-semibold text-[#14201C]">
                          Mô tả chung:
                        </span>{" "}
                        <span className="text-[#5B6661] line-clamp-2">
                          {item.sp_mota_chung || "Không có"}
                        </span>
                      </div>
                    </div>

                    {/* Lời nhắn từ Shop */}
                    <div className="mt-4 rounded-lg border border-[#E2DED3] bg-[#FBFAF7] p-3 text-sm">
                      <p className="font-semibold text-[#8A5A0B] text-xs uppercase mb-1">
                        Lời nhắn từ Shop ({item.gh_ma})
                      </p>
                      <p className="text-[#3D4A44] italic">
                        "{item.ctttsp_yeucau || "Không có ghi chú"}"
                      </p>
                    </div>

                    {/* Nút Hành động */}
                    <div className="mt-5 flex justify-end gap-3 pt-4 border-t border-[#EFEBE2] mt-auto">
                      <button
                        onClick={() => handleOpenActionModal(item, "suspend")}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-[#F0C4AE] bg-white px-5 py-2.5 text-sm font-semibold text-[#B42318] hover:bg-[#FBEDE4] transition-colors"
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          block
                        </span>{" "}
                        Từ chối
                      </button>
                      <button
                        onClick={() => handleOpenActionModal(item, "approve")}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-[#2F7A5F] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#25624c] transition-colors shadow-sm"
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          check_circle
                        </span>{" "}
                        Phê duyệt
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 🟢 LIGHTBOX: PHÓNG TO ẢNH (Z-index cao nhất) */}
      {zoomImage && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 cursor-zoom-out backdrop-blur-sm"
          onClick={() => setZoomImage(null)}
        >
          <button
            onClick={() => setZoomImage(null)}
            className="absolute top-6 right-6 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors"
          >
            <span className="material-symbols-outlined text-3xl">close</span>
          </button>
          <img
            src={zoomImage}
            alt="Zoomed"
            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl animate-[zoomIn_0.2s_ease-out]"
            onClick={(e) => e.stopPropagation()} // Ngăn click vào ảnh bị đóng
          />
        </div>
      )}

      {/* MODAL NHỎ: XÁC NHẬN DUYỆT / TỪ CHỐI */}
      {modalAction.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div
              className={`px-5 py-4 border-b ${modalAction.type === "approve" ? "bg-green-50 border-green-100" : "bg-red-50 border-red-100"}`}
            >
              <h3
                className={`text-lg font-bold flex items-center gap-2 ${modalAction.type === "approve" ? "text-green-800" : "text-red-800"}`}
              >
                <span className="material-symbols-outlined">
                  {modalAction.type === "approve" ? "check_circle" : "warning"}
                </span>
                {modalAction.type === "approve"
                  ? "Phê duyệt sản phẩm"
                  : "Từ chối / Đình chỉ"}
              </h3>
            </div>
            <div className="p-5 space-y-3">
              <p className="text-sm text-[#5B6661]">
                Phân loại:{" "}
                <b className="text-[#14201C]">{modalAction.ctsp_ten}</b>
              </p>
              <label className="block space-y-1">
                <span className="text-sm font-semibold text-[#3D4A44]">
                  Phản hồi gửi cho Shop <span className="text-red-500">*</span>
                </span>
                <textarea
                  rows="3"
                  value={modalAction.phanhoi}
                  onChange={(e) =>
                    setModalAction({ ...modalAction, phanhoi: e.target.value })
                  }
                  className="w-full rounded-xl border border-[#D9D4C7] bg-[#FBFAF7] px-3 py-2 text-sm text-[#14201C] focus:border-[#F2A93B] focus:outline-none focus:ring-1 focus:ring-[#F2A93B]"
                  placeholder="Nhập lý do hoặc phản hồi..."
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
                onClick={handleConfirmAction}
                disabled={processing}
                className={`rounded-lg px-5 py-2 text-sm font-bold text-white shadow-sm disabled:opacity-50 ${modalAction.type === "approve" ? "bg-[#2F7A5F] hover:bg-[#25624c]" : "bg-[#B42318] hover:bg-[#901c13]"}`}
              >
                {processing ? "Đang xử lý..." : "Xác nhận"}
              </button>
            </div>
          </div>
        </div>
      )}

      <ToastNotification toast={toast} />

      {/* CSS cho animation phóng to ảnh */}
      <style>{`
        @keyframes zoomIn {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default DuyetSanPham;
