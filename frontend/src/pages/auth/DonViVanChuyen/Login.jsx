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

const DVVCLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Lưu ý: Tên hàm loginDVVC được giữ nguyên theo code cũ của bạn.
  // Nếu bạn có tách riêng hàm loginDVVC trong AuthContext, hãy đổi lại cho đúng.
  const { loginDVVC } = useContext(AuthContext);
  const navigate = useNavigate();
  const tone = getAuthTone("dvvc");

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
    <AuthShell
      tone="dvvc"
      icon="local_shipping"
      eyebrow="Đơn vị vận chuyển"
      title="Đăng nhập đơn vị vận chuyển"
      subtitle="Quản lý cước phí và giao nhận hàng hóa"
      panelTitle="Kết nối vận chuyển, tối ưu mọi tuyến giao"
      panelDesc="Theo dõi đơn hàng, điều phối shipper và cập nhật trạng thái giao nhận theo thời gian thực trên toàn hệ thống."
      panelPoints={[
        { icon: "route", text: "Điều phối tuyến giao thông minh" },
        { icon: "payments", text: "Quản lý cước phí và đối soát minh bạch" },
        {
          icon: "location_on",
          text: "Cập nhật trạng thái đơn theo thời gian thực",
        },
      ]}
      footer={
        <>
          Chưa có đơn vị vận chuyển?{" "}
          <Link
            to="/dvvc/register"
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
            placeholder="dvvc@domain.com"
            autoComplete="username"
            className={authInputClass("dvvc")}
          />
        </AuthField>

        <AuthField label="Mật khẩu" icon="lock" required>
          <PasswordInput
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="••••••••"
            autoComplete="current-password"
            className={authInputClass("dvvc")}
          />
        </AuthField>

        <AuthSubmit loading={loading} tone="dvvc" icon="login">
          Đăng nhập
        </AuthSubmit>
      </form>
    </AuthShell>
  );
};

export default DVVCLogin;
