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

const ShopLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { loginShop } = useContext(AuthContext);
  const navigate = useNavigate();
  const tone = getAuthTone("shop");

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
    <AuthShell
      tone="shop"
      icon="storefront"
      eyebrow="Kênh người bán"
      title="Đăng nhập người bán"
      subtitle="Quản lý gian hàng và đơn hàng của bạn"
      panelTitle="Đưa gian hàng của bạn đến hàng triệu khách hàng"
      panelDesc="Quản lý sản phẩm, tồn kho, voucher và đơn hàng trong một bảng điều khiển dành riêng cho người bán."
      panelPoints={[
        { icon: "inventory_2", text: "Đăng bán và quản lý sản phẩm dễ dàng" },
        { icon: "local_shipping", text: "Theo dõi đơn hàng theo thời gian thực" },
        { icon: "sell", text: "Tạo voucher và chương trình khuyến mãi" },
      ]}
      footer={
        <>
          Chưa có gian hàng?{" "}
          <Link
            to="/nguoi-ban/register"
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
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="nguoiban@domain.com"
            autoComplete="username"
            className={authInputClass("shop")}
          />
        </AuthField>

        <AuthField label="Mật khẩu" icon="lock" required>
          <PasswordInput
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="••••••••"
            autoComplete="current-password"
            className={authInputClass("shop")}
          />
        </AuthField>

        <AuthSubmit loading={loading} tone="shop" icon="login">
          Đăng nhập
        </AuthSubmit>
      </form>
    </AuthShell>
  );
};

export default ShopLogin;
