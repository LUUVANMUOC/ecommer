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

const QuanLyKhoLogin = () => {
  const [kho_ma, setKhoMa] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { loginQuanLyKho } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await loginQuanLyKho(kho_ma, password);
      navigate("/quan-ly-kho");
    } catch (err) {
      setError(err.response?.data?.message || "Sai mã kho hoặc mật khẩu!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      tone="kho"
      icon="warehouse"
      eyebrow="Quản lý kho"
      title="Đăng nhập quản lý kho"
      subtitle="Hệ thống quản lý kho hàng & vận chuyển"
      panelTitle="Kiểm soát tồn kho, chủ động vận hành"
      panelDesc="Theo dõi nhập xuất, kiểm kê và điều phối hàng hóa tại kho với dữ liệu cập nhật liên tục."
      panelPoints={[
        { icon: "inventory", text: "Quản lý tồn kho theo từng sản phẩm" },
        { icon: "swap_vert", text: "Theo dõi phiếu nhập xuất chính xác" },
        { icon: "monitoring", text: "Báo cáo tồn kho trực quan, dễ kiểm soát" },
      ]}
      footer="Vui lòng liên hệ Đơn vị vận chuyển để được cấp tài khoản."
    >
      {error && <AuthAlert>{error}</AuthAlert>}

      <form onSubmit={handleSubmit} className="space-y-5">
        <AuthField
          label="Mã kho (tên đăng nhập)"
          icon="domain"
          required
          hint="Mã kho được cấp khi tạo tài khoản, ví dụ KH10000000."
        >
          <input
            type="text"
            value={kho_ma}
            onChange={(e) => setKhoMa(e.target.value.toUpperCase())}
            required
            placeholder="VD: KH10000000"
            autoComplete="username"
            className={`${authInputClass("kho")} uppercase`}
          />
        </AuthField>

        <AuthField label="Mật khẩu" icon="lock" required>
          <PasswordInput
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="••••••••"
            autoComplete="current-password"
            className={authInputClass("kho")}
          />
        </AuthField>

        <AuthSubmit loading={loading} tone="kho" icon="login">
          Đăng nhập
        </AuthSubmit>
      </form>
    </AuthShell>
  );
};

export default QuanLyKhoLogin;
