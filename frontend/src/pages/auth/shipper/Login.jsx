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

const ShipperLogin = () => {
  const [sdt, setSdt] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { loginShipper } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await loginShipper(sdt, password);
      navigate("/shipper");
    } catch (err) {
      setError(
        err.response?.data?.message || "Sai số điện thoại hoặc mật khẩu!",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      tone="shipper"
      icon="delivery_dining"
      eyebrow="Khu vực shipper"
      title="Đăng nhập shipper"
      subtitle="Hệ thống quản lý đơn hàng và giao nhận"
      panelTitle="Nhận đơn nhanh, giao hàng đúng hẹn"
      panelDesc="Xem danh sách đơn được phân công, cập nhật trạng thái giao hàng và theo dõi thu nhập của bạn mọi lúc."
      panelPoints={[
        { icon: "assignment", text: "Danh sách đơn hàng được phân công rõ ràng" },
        {
          icon: "my_location",
          text: "Cập nhật trạng thái giao theo thời gian thực",
        },
        { icon: "savings", text: "Theo dõi thu nhập và lịch sử giao hàng" },
      ]}
      footer="Vui lòng liên hệ Kho hoặc ĐVVC để được cấp tài khoản."
    >
      {error && <AuthAlert>{error}</AuthAlert>}

      <form onSubmit={handleSubmit} className="space-y-5">
        <AuthField label="Số điện thoại" icon="call" required>
          <input
            type="tel"
            value={sdt}
            onChange={(e) => setSdt(e.target.value)}
            required
            placeholder="VD: 0901234567"
            autoComplete="tel"
            className={authInputClass("shipper")}
          />
        </AuthField>

        <AuthField label="Mật khẩu" icon="lock" required>
          <PasswordInput
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="••••••••"
            autoComplete="current-password"
            className={authInputClass("shipper")}
          />
        </AuthField>

        <AuthSubmit loading={loading} tone="shipper" icon="login">
          Đăng nhập
        </AuthSubmit>
      </form>
    </AuthShell>
  );
};

export default ShipperLogin;
