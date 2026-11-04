import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
// Lưu ý: Đảm bảo đường dẫn import này đúng với cấu trúc thư mục của bạn
import { authService } from "../../../services/san/authService";

const AdminRegister = () => {
  const [formData, setFormData] = useState({
    STMDT_Ma: "",
    STMDT_Ten: "",
    STMDT_Email: "",
    STMDT_SDT: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      return setError("Mật khẩu xác nhận không khớp!");
    }

    setLoading(true);
    try {
      await authService.registerAdmin({
        STMDT_Ten: formData.STMDT_Ten,
        STMDT_Email: formData.STMDT_Email,
        STMDT_SDT: formData.STMDT_SDT,
        password: formData.password,
      });

      alert("Đăng ký tài khoản Sàn thành công! Vui lòng đăng nhập.");
      navigate("/admin/login");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Có lỗi xảy ra khi đăng ký (Email/Mã có thể đã tồn tại).",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <Link
        to="/"
        className="absolute top-6 left-6 flex items-center gap-3 group"
        title="Quay về trang chủ"
      >
        <div className="w-12 h-12 bg-primary text-on-primary rounded-xl flex items-center justify-center shadow-md transition-transform duration-200 group-hover:scale-105">
          <span className="material-symbols-outlined text-2xl">
            travel_explore
          </span>
        </div>
        <div className="hidden sm:block">
          <p className="text-label-sm text-outline">Về Trang Chủ</p>
        </div>
      </Link>
      <div className="w-full max-w-xl bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-xl overflow-hidden">
        {/* Header Box */}
        <div className="bg-tertiary-container px-6 py-8 text-center">
          <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
            <span className="material-symbols-outlined text-3xl text-on-tertiary-container">
              storefront
            </span>
          </div>
          <h2 className="text-headline-md font-headline-md font-bold text-white">
            Đăng Ký Sàn Thương Mại Điện Tử
          </h2>
          <p className="text-body-sm text-tertiary-fixed/80 mt-1">
            Tạo tài khoản quản trị cho Sàn Thương Mại Điện Tử của bạn
          </p>
        </div>

        {/* Form Body */}
        <div className="p-8">
          {error && (
            <div className="mb-6 p-3 bg-error-container text-on-error-container text-sm rounded-lg flex items-center gap-2 border border-error/20">
              <span className="material-symbols-outlined text-lg">error</span>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-label-md font-label-md text-on-surface block mb-1.5">
                  Tên Sàn <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  name="STMDT_Ten"
                  value={formData.STMDT_Ten}
                  onChange={handleChange}
                  required
                  placeholder="VD: Sàn sốp pi"
                  className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-lg text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                />
              </div>
              <div>
                <label className="text-label-md font-label-md text-on-surface block mb-1.5">
                  Số điện thoại
                </label>
                <input
                  type="text"
                  name="STMDT_SDT"
                  value={formData.STMDT_SDT}
                  onChange={handleChange}
                  placeholder="VD: 0987654321"
                  className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-lg text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                />
              </div>
            </div>

            <div>
              <label className="text-label-md font-label-md text-on-surface block mb-1.5">
                Email đăng nhập <span className="text-error">*</span>
              </label>
              <input
                type="email"
                name="STMDT_Email"
                value={formData.STMDT_Email}
                onChange={handleChange}
                required
                placeholder="admin@domain.com"
                className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-lg text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-label-md font-label-md text-on-surface block mb-1.5">
                  Mật khẩu <span className="text-error">*</span>
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-lg text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                />
              </div>
              <div>
                <label className="text-label-md font-label-md text-on-surface block mb-1.5">
                  Xác nhận mật khẩu <span className="text-error">*</span>
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-lg text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-container text-on-primary font-semibold py-3 rounded-lg transition-all shadow-sm disabled:opacity-70 disabled:cursor-not-allowed mt-6"
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
                  Tạo Tài Khoản
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-body-sm text-on-surface-variant">
            Đã có tài khoản?{" "}
            <Link
              to="/admin/login"
              className="font-semibold text-primary hover:text-primary-container transition-colors underline decoration-primary/30 underline-offset-4"
            >
              Đăng nhập
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminRegister;
