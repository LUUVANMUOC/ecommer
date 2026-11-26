// src/pages/khachhang/Login.jsx
import { useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../../../contexts/AuthContext";
import PasswordInput from "../../../components/common/PasswordInput";
import AuthShell, {
  AuthAlert,
  AuthField,
  AuthSubmit,
} from "../../../components/auth/AuthShell";
import {
  authInputClass,
  getAuthTone,
} from "../../../components/auth/authTheme";

const KhachHangLogin = () => {
  const { loginKhachHang } = useContext(AuthContext);
  const navigate = useNavigate();
  const tone = getAuthTone("khachhang");

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
    <AuthShell
      tone="khachhang"
      icon="shopping_bag"
      eyebrow="Khách hàng"
      title="Đăng nhập khách hàng"
      subtitle="Mua sắm ngàn deal hời mỗi ngày"
      panelTitle="Mua sắm thả ga, săn deal mỏi tay"
      panelDesc="Đăng nhập để lưu sản phẩm yêu thích, theo dõi đơn hàng và nhận những voucher giảm giá dành riêng cho bạn."
      panelPoints={[
        { icon: "local_offer", text: "Hàng ngàn voucher và ưu đãi mỗi ngày" },
        { icon: "favorite", text: "Lưu sản phẩm yêu thích để mua sau" },
        {
          icon: "local_shipping",
          text: "Theo dõi đơn hàng từ lúc đặt đến khi nhận",
        },
      ]}
      footer={
        <>
          Chưa có tài khoản?{" "}
          <Link
            to="/khach-hang/register"
            className={`font-semibold underline decoration-2 underline-offset-4 transition-colors ${tone.link}`}
          >
            Đăng ký ngay
          </Link>
        </>
      }
    >
      {error && <AuthAlert>{error}</AuthAlert>}

      <form onSubmit={handleSubmit} className="space-y-5">
        <AuthField label="Email" icon="mail" required>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@example.com"
            autoComplete="username"
            className={authInputClass("khachhang")}
          />
        </AuthField>

        <AuthField label="Mật khẩu" icon="lock" required>
          <PasswordInput
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
            className={authInputClass("khachhang")}
          />
        </AuthField>

        <AuthSubmit loading={loading} tone="khachhang" icon="login">
          Đăng nhập
        </AuthSubmit>
      </form>
    </AuthShell>
  );
};

export default KhachHangLogin;
