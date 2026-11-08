import { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AuthContext } from "../../contexts/AuthContext";
import donHangService from "../../services/khachhang/donHangService";
import ToastNotification from "../../components/common/Crud/ToastNotification";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8080";

const DanhGiaSanPham = () => {
  const { dts_ma } = useParams(); // Lấy mã đơn hàng từ URL
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [shopData, setShopData] = useState(null);
  const [reviewData, setReviewData] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });
  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast((p) => ({ ...p, show: false })), 3000);
  };

  // Hàm an toàn parse JSON mảng ảnh
  const parseImages = (danhGia) => {
    if (!danhGia || !danhGia.dgsp_hinhanh) return [];
    try {
      const parsed = JSON.parse(danhGia.dgsp_hinhanh);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  };

  // Lấy thông tin đơn hàng
  useEffect(() => {
    const fetchData = async () => {
      if (!user?.kh_ma) return;
      try {
        const res = await donHangService.getMyOrders(user.kh_ma);
        // Tìm đơn shop tương ứng với dts_ma
        let foundShop = null;
        for (const order of res.data) {
          const shop = order.shops.find((s) => s.DTS_Ma === dts_ma);
          if (shop) {
            foundShop = shop;
            break;
          }
        }

        if (foundShop) {
          setShopData(foundShop);
          // Khởi tạo state đánh giá cho từng sản phẩm
          const initialData = {};
          foundShop.items.forEach((item) => {
            initialData[item.Ctsp_Ma] = {
              sao: item.DanhGia ? item.DanhGia.dgsp_sao : 5,
              mota: item.DanhGia ? item.DanhGia.dgsp_mota : "",
              files: [],
              existingImages: parseImages(item.DanhGia),
            };
          });
          setReviewData(initialData);
        } else {
          showToast("Không tìm thấy đơn hàng hợp lệ!", "error");
          setTimeout(() => navigate("/khach-hang/thong-tin-ca-nhan"), 1500);
        }
      } catch (error) {
        showToast("Lỗi tải dữ liệu", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [dts_ma, user, navigate]);

  const handleReviewChange = (ctsp_ma, field, value) => {
    setReviewData((prev) => ({
      ...prev,
      [ctsp_ma]: { ...prev[ctsp_ma], [field]: value },
    }));
  };

  const submitReview = async () => {
    setSubmitting(true);
    try {
      for (const item of shopData.items) {
        const data = reviewData[item.Ctsp_Ma];
        const fd = new FormData();
        fd.append("dts_ma", shopData.DTS_Ma);
        fd.append("kh_ma", user.kh_ma);
        fd.append("ctsp_ma", item.Ctsp_Ma);
        fd.append("sao", data.sao);
        fd.append("mota", data.mota);

        // Nếu có chọn ảnh mới
        if (data.files && data.files.length > 0) {
          for (let i = 0; i < data.files.length; i++) {
            fd.append("hinhanh", data.files[i]);
          }
        }
        await donHangService.guiDanhGia(fd);
      }
      showToast("Gửi đánh giá thành công!");
      setTimeout(() => {
        navigate("/khach-hang/thong-tin-ca-nhan"); // Quay lại trang cá nhân
      }, 1500);
    } catch (error) {
      showToast("Lỗi gửi đánh giá", "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center font-medium">
        Đang tải...
      </div>
    );
  }

  if (!shopData) return null;

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-10 px-4">
      <div className="max-w-3xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-[#64748B] hover:text-[#2563EB] font-semibold mb-6 transition-colors"
        >
          <span className="material-symbols-outlined">arrow_back</span> Quay lại
        </button>

        <div className="bg-white rounded-3xl shadow-sm border border-[#E2E8F0] overflow-hidden">
          <div className="p-6 border-b border-[#F1F5F9] bg-[#2563EB] text-white">
            <h1 className="text-2xl font-bold">Đánh Giá Sản Phẩm</h1>
            <p className="text-blue-100 mt-1">
              Đơn hàng: {dts_ma} - Shop: {shopData.TenShop}
            </p>
          </div>

          <div className="p-6 space-y-8">
            {shopData.items.map((item) => (
              <div
                key={item.Ctsp_Ma}
                className="border border-[#E2E8F0] rounded-2xl p-5 shadow-sm"
              >
                <div className="flex gap-4 items-center mb-4 border-b border-[#F1F5F9] pb-4">
                  <img
                    src={
                      item.Image
                        ? `${BACKEND_URL}${item.Image}`
                        : "https://placehold.co/100x100"
                    }
                    className="w-16 h-16 rounded-xl object-cover border"
                    alt=""
                  />
                  <div>
                    <p className="font-bold text-[#0F172A]">
                      {item.TenSanPham}
                    </p>
                    <p className="text-sm text-gray-500">
                      Phân loại: {item.TenPhanLoai}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-4">
                  <span className="text-sm font-bold text-gray-700">
                    Chất lượng sản phẩm:
                  </span>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span
                      key={star}
                      onClick={() =>
                        handleReviewChange(item.Ctsp_Ma, "sao", star)
                      }
                      className={`material-symbols-outlined cursor-pointer text-3xl transition-colors ${
                        reviewData[item.Ctsp_Ma].sao >= star
                          ? "text-yellow-400"
                          : "text-gray-300"
                      }`}
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      star
                    </span>
                  ))}
                </div>

                <textarea
                  rows={3}
                  placeholder="Hãy chia sẻ cảm nhận của bạn về sản phẩm này..."
                  value={reviewData[item.Ctsp_Ma].mota}
                  onChange={(e) =>
                    handleReviewChange(item.Ctsp_Ma, "mota", e.target.value)
                  }
                  className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:border-[#2563EB] outline-none resize-none mb-4"
                />

                <div className="bg-[#F8FAFC] p-4 rounded-xl border border-gray-100">
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Thêm ảnh thực tế (Tối đa 5 ảnh)
                  </label>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) =>
                      handleReviewChange(item.Ctsp_Ma, "files", e.target.files)
                    }
                    className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-100 file:text-[#2563EB] file:font-semibold hover:file:bg-blue-200 cursor-pointer"
                  />

                  {/* Hiển thị ảnh cũ nếu đã đánh giá */}
                  {reviewData[item.Ctsp_Ma].existingImages.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs text-gray-500 mb-2">
                        Ảnh đã tải lên trước đó:
                      </p>
                      <div className="flex gap-2">
                        {reviewData[item.Ctsp_Ma].existingImages.map(
                          (img, idx) => (
                            <img
                              key={idx}
                              src={`${BACKEND_URL}${img}`}
                              className="w-16 h-16 object-cover rounded-lg border shadow-sm"
                              alt=""
                            />
                          ),
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="p-6 border-t bg-gray-50 flex justify-end">
            <button
              onClick={submitReview}
              disabled={submitting}
              className="px-8 py-3 bg-[#2563EB] text-white font-bold text-lg rounded-xl shadow-md hover:bg-blue-700 transition-colors disabled:bg-gray-400"
            >
              {submitting ? "Đang gửi..." : "Hoàn Tất Đánh Giá"}
            </button>
          </div>
        </div>
      </div>
      <ToastNotification toast={toast} />
    </div>
  );
};

export default DanhGiaSanPham;
