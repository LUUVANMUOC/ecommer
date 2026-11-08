// src/pages/admin/QuanLySanPhamAdmin.jsx
import { useState, useEffect, useMemo } from "react";
import trangThaiChiTietSanPhamService from "../../services/gianhang/trangThaiChiTietSanPhamService";
import axiosClient from "../../config/axiosClient";
import ToastNotification from "../../components/common/Crud/ToastNotification";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8080";
const imgUrl = (link) => (link ? `${BACKEND_URL}${link}` : "");
const formatVND = (n) =>
  n || n === 0 ? `${Number(n).toLocaleString("vi-VN")} đ` : "—";

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

const QuanLySanPhamAdmin = () => {
  const [rawData, setRawData] = useState([]);
  const [loading, setLoading] = useState(true);

  // State bộ lọc
  const [searchTerm, setSearchTerm] = useState("");
  const [shops, setShops] = useState([]);
  const [filterShop, setFilterShop] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  // State Modal xem chi tiết
  const [selectedProduct, setSelectedProduct] = useState(null);

  // State Modal Đình chỉ
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
      const [resData, resShops] = await Promise.all([
        trangThaiChiTietSanPhamService.getAllSanPham(),
        axiosClient.get("/admin/gian-hang").catch(() => ({ data: [] })),
      ]);
      setRawData(resData.data || []);
      setShops(resShops.data || []);
    } catch (error) {
      showToast("Lỗi khi tải danh sách sản phẩm", "error");
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
          gh_ten: item.gh_ten,
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
      const matchSearch =
        product.sp_ten.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.gh_ten.toLowerCase().includes(searchTerm.toLowerCase());
      const matchShop = !filterShop || product.gh_ma === filterShop;
      const matchStatus =
        !filterStatus ||
        product.variants.some((v) =>
          filterStatus === "DEFAULT"
            ? !v.ttctsp_ma
            : v.ttctsp_ma === filterStatus,
        );
      return matchSearch && matchShop && matchStatus;
    });
  }, [groupedProducts, searchTerm, filterShop, filterStatus]);

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
      fetchData();
      if (selectedProduct) {
        setSelectedProduct((prev) => {
          if (!prev) return null;
          const updatedVariants = prev.variants.map((v) =>
            v.ctsp_ma === modalAction.ctsp_ma
              ? { ...v, ttctsp_ma: "TTCTSP0003" }
              : v,
          );
          return { ...prev, variants: updatedVariants };
        });
      }
    } catch (error) {
      alert(error.response?.data?.message || "Đã xảy ra lỗi");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* HEADER & BỘ LỌC CƠ BẢN */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-[#E2DED3] flex flex-col md:flex-row md:items-center justify-between gap-4">
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
              placeholder="Tìm tên SP..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-56 rounded-xl border border-[#D9CFC2] bg-[#FBFAF7] py-2 pl-10 pr-3 text-sm focus:border-[#F2A93B] focus:outline-none"
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-[#E2DED3] rounded-xl text-sm font-medium text-[#3D4A44] outline-none hover:border-[#F2A93B] bg-white min-w-[160px]"
          >
            <option value="">Tất cả Trạng thái</option>
            <option value="TTCTSP0001">Chờ duyệt</option>
            <option value="TTCTSP0002">Đang bán</option>
            <option value="TTCTSP0003">Bị đình chỉ</option>
            <option value="DEFAULT">Chưa gửi duyệt</option>
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

      {/* THANH LỌC SHOP */}
      <div className="bg-white px-5 py-3 rounded-2xl shadow-sm border border-[#E2DED3] flex items-center gap-3 overflow-x-auto custom-scrollbar">
        <span className="text-sm font-semibold text-[#7A857F] whitespace-nowrap flex items-center gap-1 pr-2 border-r border-[#E2DED3]">
          <span className="material-symbols-outlined text-[18px]">
            filter_alt
          </span>{" "}
          Lọc Shop:
        </span>
        <button
          onClick={() => setFilterShop("")}
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
              onClick={() => setFilterShop(shop.gh_ma)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-colors border-2 ${isActive ? "border-[#F2A93B] bg-[#FDF3E1] text-[#8A5A0B]" : "border-transparent bg-[#FBFAF7] text-[#3D4A44] hover:border-[#E2DED3] hover:bg-[#F1EEE6]"}`}
            >
              <div className="w-7 h-7 rounded-full border border-gray-200 overflow-hidden bg-white shrink-0">
                {shop.gh_hinhanh ? (
                  <img
                    src={imgUrl(shop.gh_hinhanh)}
                    alt={shop.gh_ten}
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

      {/* DANH SÁCH THẺ SẢN PHẨM */}
      {loading ? (
        <div className="py-20 text-center text-[#7A857F]">
          Đang tải dữ liệu...
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#E2DED3] bg-[#FBFAF7] py-16 text-center">
          <span className="material-symbols-outlined text-[48px] text-[#C9C3B5]">
            search_off
          </span>
          <p className="mt-2 text-[#5B6661]">
            Không tìm thấy sản phẩm nào phù hợp.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredProducts.map((product) => {
            const firstVariant = product.variants[0];
            const coverImg = firstVariant?.main_image;
            const countSuspended = product.variants.filter(
              (v) => v.ttctsp_ma === "TTCTSP0003",
            ).length;

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
                    {product.gh_ten}
                  </p>
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

            {/* Body Modal: Danh sách Phân loại dạng Thẻ (Card) chi tiết */}
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
                    {/* CỘT 1: Ảnh & Thông tin cơ bản */}
                    <div className="flex gap-4 shrink-0 md:w-1/3">
                      <div className="w-24 h-24 rounded-lg border border-gray-200 overflow-hidden bg-gray-50 shrink-0">
                        {item.main_image ? (
                          <img
                            src={imgUrl(item.main_image)}
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

                    {/* CỘT 2: Kích thước & Khối lượng & Tồn kho */}
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

                    {/* CỘT 3: Thống kê & Đánh giá & Nút thao tác */}
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
