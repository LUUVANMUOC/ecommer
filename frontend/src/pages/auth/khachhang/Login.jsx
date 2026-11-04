// src/pages/khachhang/Login.jsx
import { useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../../../contexts/AuthContext";

const KhachHangLogin = () => {
  const { loginKhachHang } = useContext(AuthContext);
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await loginKhachHang(email, password);
      navigate("/san-pham"); // Đăng nhập thành công về trang chủ
    } catch (err) {
      setError(err.response?.data?.message || "Sai email hoặc mật khẩu!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F7F5F0] px-4">
      {/* Nút Về Trang Chủ */}
      <Link
        to="/"
        className="absolute top-6 left-6 flex items-center gap-2 text-gray-600 hover:text-[#F2A93B]"
      >
        <span className="material-symbols-outlined">arrow_back</span> Về trang
        chủ
      </Link>

      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden border border-[#E2DED3]">
        <div className="bg-[#F2A93B] px-6 py-8 text-center">
          <span className="material-symbols-outlined text-5xl text-white mb-2">
            shopping_bag
          </span>
          <h2 className="text-2xl font-bold text-white">
            Đăng Nhập Khách Hàng
          </h2>
          <p className="text-orange-100 text-sm mt-1">Mua sắm ngàn deal hời</p>
        </div>

        <div className="p-8">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Email
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">
                  mail
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:border-[#F2A93B] focus:ring-1 focus:ring-[#F2A93B] outline-none"
                  placeholder="email@example.com"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Mật khẩu
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">
                  lock
                </span>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:border-[#F2A93B] focus:ring-1 focus:ring-[#F2A93B] outline-none"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#F2A93B] hover:bg-[#e09b32] text-white font-bold py-3 rounded-lg transition-colors mt-4 disabled:opacity-70"
            >
              {loading ? "Đang xử lý..." : "Đăng Nhập"}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600">
            Chưa có tài khoản?{" "}
            <Link
              to="/khach-hang/register"
              className="text-[#F2A93B] font-semibold hover:underline"
            >
              Đăng ký ngay
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KhachHangLogin;
