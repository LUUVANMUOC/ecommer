import { useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../../../contexts/AuthContext";

const DVVCLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Lưu ý: Tên hàm loginDVVC được giữ nguyên theo code cũ của bạn.
  // Nếu bạn có tách riêng hàm loginDVVC trong AuthContext, hãy đổi lại cho đúng.
  const { loginDVVC } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await loginDVVC(email, password);
      // Điều hướng về đúng đường dẫn gốc của Đơn vị vận chuyển
      navigate("/dvvc");
    } catch (err) {
      setError(err.response?.data?.message || "Sai email hoặc mật khẩu!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center bg-background px-4">
      {/* Nút Về Trang Chủ - Tone Xanh Lá */}
      <Link
        to="/"
        className="absolute top-6 left-6 flex items-center gap-3 group"
        title="Quay về trang chủ"
      >
        <div className="w-12 h-12 bg-emerald-600 text-white rounded-xl flex items-center justify-center shadow-md transition-transform duration-200 group-hover:scale-105">
          <span className="material-symbols-outlined text-2xl">
            travel_explore
          </span>
        </div>
        <div className="hidden sm:block">
          <p className="text-label-sm text-outline">Về Trang Chủ</p>
        </div>
      </Link>

      <div className="w-full max-w-md bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-xl overflow-hidden">
        {/* Header Box - Tone Xanh Lá */}
        <div className="bg-emerald-600 px-6 py-8 text-center">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
            <span className="material-symbols-outlined text-3xl text-white">
              local_shipping
            </span>
          </div>
          <h2 className="text-headline-md font-headline-md font-bold text-white">
            Đăng Nhập Đơn Vị Vận Chuyển
          </h2>
          <p className="text-body-sm text-emerald-100 mt-1">
            Quản lý cước phí và giao nhận hàng hóa
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
                  placeholder="dvvc@domain.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-lg text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition-all"
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
                  className="w-full pl-10 pr-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-lg text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-lg transition-all shadow-sm disabled:opacity-70 disabled:cursor-not-allowed mt-2"
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
            Chưa có đơn vị vận chuyển?{" "}
            <Link
              to="/dvvc/register"
              className="font-semibold text-emerald-600 hover:text-emerald-700 transition-colors underline decoration-emerald-600/30 underline-offset-4"
            >
              Đăng ký ngay
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DVVCLogin;
