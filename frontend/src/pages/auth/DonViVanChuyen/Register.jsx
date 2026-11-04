// src/pages/auth/dvvc/Register.jsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authDVVCService } from "../../../services/dvvc/authService"; // <-- Gọi service riêng

const DVVCRegister = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    dvvc_ten: "",
    dvvc_email: "",
    dvvc_mota: "",
    password: "",
    confirmPassword: "",
  });

  const [selectedFile, setSelectedFile] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (formData.password !== formData.confirmPassword)
      return setError("Mật khẩu xác nhận không khớp!");

    setLoading(true);
    try {
      const dataToSend = new FormData();
      dataToSend.append("dvvc_ten", formData.dvvc_ten);
      dataToSend.append("dvvc_email", formData.dvvc_email);
      dataToSend.append("dvvc_mota", formData.dvvc_mota);
      dataToSend.append("password", formData.password);

      if (selectedFile) dataToSend.append("hinhanh", selectedFile);

      // Gọi API thông qua Service
      await authDVVCService.register(dataToSend);

      alert("Đăng ký Đơn Vị Vận Chuyển thành công! Vui lòng đăng nhập.");
      // Sửa lỗi dư dấu cách ở đây
      navigate("/dvvc/login");
    } catch (err) {
      setError(err.response?.data?.message || "Có lỗi xảy ra khi đăng ký.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4">
      <div className="w-full max-w-2xl bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-xl overflow-hidden">
        {/* Header Box - Xanh lá */}
        <div className="bg-emerald-600 px-6 py-8 text-center">
          <h2 className="text-headline-md font-headline-md font-bold text-white">
            Tạo Đơn Vị Vận Chuyển Mới
          </h2>
          <p className="text-body-sm text-emerald-100 mt-1">
            Bắt đầu vận chuyển cùng CT255
          </p>
        </div>

        <div className="p-8">
          {error && (
            <div className="mb-6 p-3 bg-error-container text-on-error-container text-sm rounded-lg flex items-center gap-2 border border-error/20">
              <span className="material-symbols-outlined text-lg">error</span>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <h3 className="font-bold text-lg mb-4 text-on-surface border-b border-outline-variant pb-2">
                1. Thông tin Đơn Vị Vận Chuyển
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-label-md font-label-md text-on-surface block mb-1.5">
                    Tên Đơn Vị Vận Chuyển <span className="text-error">*</span>
                  </label>
                  <input
                    type="text"
                    name="dvvc_ten"
                    required
                    onChange={handleChange}
                    placeholder="VD: Giao Hàng Nhanh"
                    className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-lg text-body-md focus:outline-none focus:ring-2 focus:ring-emerald-600 transition-all"
                  />
                </div>
                <div>
                  <label className="text-label-md font-label-md text-on-surface block mb-1.5">
                    Email đăng nhập <span className="text-error">*</span>
                  </label>
                  <input
                    type="email"
                    name="dvvc_email"
                    required
                    onChange={handleChange}
                    placeholder="dvvc@domain.com"
                    className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-lg text-body-md focus:outline-none focus:ring-2 focus:ring-emerald-600 transition-all"
                  />
                </div>
              </div>
              <div className="mt-4">
                <label className="text-label-md font-label-md text-on-surface block mb-1.5">
                  Mô tả Đơn Vị Vận Chuyển
                </label>
                <textarea
                  name="dvvc_mota"
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-lg text-body-md focus:outline-none focus:ring-2 focus:ring-emerald-600 transition-all"
                  rows="2"
                  placeholder="Chuyên giao hàng nhanh toàn quốc..."
                ></textarea>
              </div>
              <div className="mt-4">
                <label className="text-label-md font-label-md text-on-surface block mb-1.5">
                  Ảnh đại diện (Logo)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setSelectedFile(e.target.files[0])}
                  className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 transition-all"
                />
              </div>
            </div>

            <div>
              <h3 className="font-bold text-lg mb-4 text-on-surface border-b border-outline-variant pb-2 mt-6">
                2. Bảo mật
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-label-md font-label-md text-on-surface block mb-1.5">
                    Mật khẩu <span className="text-error">*</span>
                  </label>
                  <input
                    type="password"
                    name="password"
                    required
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-lg text-body-md focus:outline-none focus:ring-2 focus:ring-emerald-600 transition-all"
                  />
                </div>
                <div>
                  <label className="text-label-md font-label-md text-on-surface block mb-1.5">
                    Xác nhận mật khẩu <span className="text-error">*</span>
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    required
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-lg text-body-md focus:outline-none focus:ring-2 focus:ring-emerald-600 transition-all"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-lg transition-all shadow-sm disabled:opacity-50 mt-4"
            >
              {loading ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-lg">
                    progress_activity
                  </span>
                  Đang xử lý...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-lg">
                    how_to_reg
                  </span>
                  Đăng Ký Đơn Vị Vận Chuyển
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center text-body-sm text-on-surface-variant border-t border-outline-variant/50 pt-6">
            Đã có tài khoản?{" "}
            <Link
              to="/dvvc/login"
              className="text-emerald-600 font-semibold hover:text-emerald-700 transition-colors underline decoration-emerald-600/30 underline-offset-4"
            >
              Đăng nhập ngay
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DVVCRegister;
