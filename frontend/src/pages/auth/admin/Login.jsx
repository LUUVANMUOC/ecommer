import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../../contexts/AuthContext";
import PasswordInput from "../../../components/common/PasswordInput";
import AuthShell, {
  AuthAlert,
  AuthField,
  AuthSubmit,
} from "../../../components/auth/AuthShell";
import { authInputClass } from "../../../components/auth/authTheme";

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { loginAdmin } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await loginAdmin(email, password);
      navigate("/admin");
    } catch (err) {
      setError(err.response?.data?.message || "Sai email hoặc mật khẩu!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      tone="admin"
      icon="admin_panel_settings"
      eyebrow="Khu vực quản trị"
      title="Đăng nhập quản trị"
      subtitle="Hệ thống quản lý Sàn Thương mại điện tử CT255"
      panelTitle="Trung tâm điều hành toàn sàn"
      panelDesc="Kiểm soát người dùng, gian hàng, đối tác vận chuyển và toàn bộ hoạt động kinh doanh trên sàn trong một màn hình duy nhất."
      panelPoints={[
        { icon: "shield_person", text: "Phân quyền chi tiết theo từng vai trò" },
        { icon: "insights", text: "Theo dõi doanh thu và tăng trưởng toàn sàn" },
        {
          icon: "verified_user",
          text: "Kiểm duyệt gian hàng và đối tác minh bạch",
        },
      ]}
      footer="Chỉ dành cho quản trị viên hệ thống."
    >
      {error && <AuthAlert>{error}</AuthAlert>}

      <form onSubmit={handleSubmit} className="space-y-5">
        <AuthField label="Email" icon="mail" required>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="admin@domain.com"
            autoComplete="username"
            className={authInputClass("admin")}
          />
        </AuthField>

        <AuthField label="Mật khẩu" icon="lock" required>
          <PasswordInput
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="••••••••"
            autoComplete="current-password"
            className={authInputClass("admin")}
          />
        </AuthField>

        <AuthSubmit loading={loading} tone="admin" icon="login">
          Đăng nhập
        </AuthSubmit>
      </form>
    </AuthShell>
  );
};

export default AdminLogin;
