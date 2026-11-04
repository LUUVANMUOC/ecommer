import { useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../../../contexts/AuthContext";

const ShopLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { loginShop } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await loginShop(email, password);
      // ĐÃ SỬA: Điều hướng về đúng đường dẫn gốc của Người bán
      navigate("/nguoi-ban");
    } catch (err) {
      setError(err.response?.data?.message || "Sai email hoặc mật khẩu!");
    } finally {
      setLoading(false);
    }
  };

  return (
    // Thêm class 'relative' để nút Về Trang Chủ căn chuẩn theo góc màn hình
    <div className="min-h-screen relative flex items-center justify-center bg-background px-4">
      {/* Nút Về Trang Chủ (Giống Admin) */}
      <Link
        to="/"
        className="absolute top-6 left-6 flex items-center gap-3 group"
        title="Quay về trang chủ"
      >
        <div className="w-12 h-12 bg-orange-500 text-white rounded-xl flex items-center justify-center shadow-md transition-transform duration-200 group-hover:scale-105">
          <span className="material-symbols-outlined text-2xl">
            travel_explore
          </span>
        </div>
        <div className="hidden sm:block">
          <p className="text-label-sm text-outline">Về Trang Chủ</p>
        </div>
      </Link>

      <div className="w-full max-w-md bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-xl overflow-hidden">
        {/* Header Box */}
        <div className="bg-orange-500 px-6 py-8 text-center">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
            <span className="material-symbols-outlined text-3xl text-white">
              storefront
            </span>
          </div>
          <h2 className="text-headline-md font-headline-md font-bold text-white">
            Đăng Nhập Người Bán
          </h2>
          <p className="text-body-sm text-orange-100 mt-1">
            Quản lý gian hàng của bạn
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

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-label-md font-label-md text-on-surface block mb-1.5">
                Email
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg">
                  mail
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="nguoiban@domain.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-lg text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="text-label-md font-label-md text-on-surface block mb-1.5">
                Mật khẩu
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg">
                  lock
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-lg text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-lg transition-all shadow-sm disabled:opacity-70 disabled:cursor-not-allowed mt-2"
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
                    login
                  </span>
                  Đăng Nhập
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-body-sm text-on-surface-variant">
            Chưa có gian hàng?{" "}
            <Link
              to="/nguoi-ban/register"
              className="font-semibold text-orange-500 hover:text-orange-600 transition-colors underline decoration-orange-500/30 underline-offset-4"
            >
              Đăng ký ngay
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShopLogin;
