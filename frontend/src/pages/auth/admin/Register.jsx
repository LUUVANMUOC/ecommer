import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
// Lưu ý: Đảm bảo đường dẫn import này đúng với cấu trúc thư mục của bạn
import { authService } from "../../../services/san/authService";
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
  const tone = getAuthTone("admin");

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
    <AuthShell
      tone="admin"
      width="xl"
      icon="storefront"
      eyebrow="Khởi tạo sàn"
      title="Đăng ký Sàn Thương mại Điện tử"
      subtitle="Tạo tài khoản quản trị đầu tiên cho sàn của bạn"
      panelTitle="Bắt đầu xây dựng sàn của riêng bạn"
      panelDesc="Một tài khoản quản trị duy nhất để vận hành toàn bộ nền tảng: quản lý người dùng, gian hàng, đối tác vận chuyển và báo cáo doanh thu."
      panelPoints={[
        { icon: "rocket_launch", text: "Khởi tạo nhanh, sẵn sàng vận hành" },
        { icon: "group", text: "Quản lý tập trung mọi vai trò trên sàn" },
        { icon: "lock", text: "Bảo mật tài khoản quản trị nhiều lớp" },
      ]}
      footer={
        <>
          Đã có tài khoản?{" "}
          <Link
            to="/admin/login"
            className={`font-semibold underline decoration-2 underline-offset-4 transition-colors ${tone.link}`}
          >
            Đăng nhập
          </Link>
        </>
      }
    >
      {error && <AuthAlert>{error}</AuthAlert>}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <AuthField label="Tên Sàn" icon="storefront" required>
            <input
              type="text"
              name="STMDT_Ten"
              value={formData.STMDT_Ten}
              onChange={handleChange}
              required
              placeholder="VD: Sàn sốp pi"
              className={authInputClass("admin")}
            />
          </AuthField>

          <AuthField label="Số điện thoại" icon="call">
            <input
              type="text"
              name="STMDT_SDT"
              value={formData.STMDT_SDT}
              onChange={handleChange}
              placeholder="VD: 0987654321"
              className={authInputClass("admin")}
            />
          </AuthField>
        </div>

        <AuthField label="Email đăng nhập" icon="mail" required>
          <input
            type="email"
            name="STMDT_Email"
            value={formData.STMDT_Email}
            onChange={handleChange}
            required
            placeholder="admin@domain.com"
            autoComplete="email"
            className={authInputClass("admin")}
          />
        </AuthField>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <AuthField label="Mật khẩu" icon="lock" required>
            <PasswordInput
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="••••••••"
              autoComplete="new-password"
              className={authInputClass("admin")}
            />
          </AuthField>

          <AuthField label="Xác nhận mật khẩu" icon="lock_reset" required>
            <PasswordInput
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              placeholder="••••••••"
              autoComplete="new-password"
              className={authInputClass("admin")}
            />
          </AuthField>
        </div>

        <div className="pt-1">
          <AuthSubmit loading={loading} tone="admin" icon="how_to_reg">
            Tạo tài khoản
          </AuthSubmit>
        </div>
      </form>
    </AuthShell>
  );
};

export default AdminRegister;
