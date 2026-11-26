// src/pages/auth/dvvc/Register.jsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authDVVCService } from "../../../services/dvvc/authService"; // <-- Gọi service riêng
import PasswordInput from "../../../components/common/PasswordInput";
import AuthShell, {
  AuthAlert,
  AuthField,
  AuthFileField,
  AuthSection,
  AuthSubmit,
} from "../../../components/auth/AuthShell";
import {
  authInputClass,
  getAuthTone,
} from "../../../components/auth/authTheme";

const DVVCRegister = () => {
  const navigate = useNavigate();
  const tone = getAuthTone("dvvc");

  const [formData, setFormData] = useState({
    dvvc_ten: "",
    dvvc_email: "",
    dvvc_mota: "",
    password: "",
    confirmPassword: "",
  });

  const [selectedFile, setSelectedFile] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (formData.password !== formData.confirmPassword)
      return setError("Mật khẩu xác nhận không khớp!");

    setLoading(true);
    try {
      const dataToSend = new FormData();
      dataToSend.append("dvvc_ten", formData.dvvc_ten);
      dataToSend.append("dvvc_email", formData.dvvc_email);
      dataToSend.append("dvvc_mota", formData.dvvc_mota);
      dataToSend.append("password", formData.password);

      if (selectedFile) dataToSend.append("hinhanh", selectedFile);

      // Gọi API thông qua Service
      await authDVVCService.register(dataToSend);

      alert("Đăng ký Đơn Vị Vận Chuyển thành công! Vui lòng đăng nhập.");
      // Sửa lỗi dư dấu cách ở đây
      navigate("/dvvc/login");
    } catch (err) {
      setError(err.response?.data?.message || "Có lỗi xảy ra khi đăng ký.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      tone="dvvc"
      width="xl"
      icon="local_shipping"
      eyebrow="Đơn vị vận chuyển"
      title="Tạo đơn vị vận chuyển mới"
      subtitle="Bắt đầu vận chuyển cùng CT255"
      panelTitle="Mở rộng mạng lưới giao nhận của bạn"
      panelDesc="Trở thành đối tác vận chuyển của CT255 để tiếp cận lượng đơn hàng lớn mỗi ngày và quản lý toàn bộ quy trình giao nhận tập trung."
      panelPoints={[
        { icon: "handshake", text: "Kết nối trực tiếp với gian hàng trên sàn" },
        { icon: "dashboard", text: "Bảng điều khiển vận đơn chuyên nghiệp" },
        { icon: "trending_up", text: "Tăng trưởng cùng nhu cầu của sàn" },
      ]}
      footer={
        <>
          Đã có tài khoản?{" "}
          <Link
            to="/dvvc/login"
            className={`font-semibold underline decoration-2 underline-offset-4 transition-colors ${tone.link}`}
          >
            Đăng nhập ngay
          </Link>
        </>
      }
    >
      {error && <AuthAlert>{error}</AuthAlert>}

      <form onSubmit={handleSubmit} className="space-y-7">
        {/* 1. Thông tin đơn vị vận chuyển */}
        <section className="space-y-4">
          <AuthSection
            step="1"
            tone="dvvc"
            title="Thông tin đơn vị vận chuyển"
            description="Thông tin hiển thị với gian hàng khi chọn đơn vị giao hàng."
          />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <AuthField
              label="Tên đơn vị vận chuyển"
              icon="local_shipping"
              required
            >
              <input
                type="text"
                name="dvvc_ten"
                required
                onChange={handleChange}
                placeholder="VD: Giao Hàng Nhanh"
                className={authInputClass("dvvc")}
              />
            </AuthField>

            <AuthField label="Email đăng nhập" icon="mail" required>
              <input
                type="email"
                name="dvvc_email"
                required
                onChange={handleChange}
                placeholder="dvvc@domain.com"
                autoComplete="email"
                className={authInputClass("dvvc")}
              />
            </AuthField>
          </div>

          <AuthField label="Mô tả đơn vị vận chuyển" icon="notes">
            <textarea
              name="dvvc_mota"
              onChange={handleChange}
              rows="3"
              placeholder="Chuyên giao hàng nhanh toàn quốc..."
              className={`${authInputClass("dvvc")} resize-none`}
            ></textarea>
          </AuthField>

          <AuthFileField
            tone="dvvc"
            label="Ảnh đại diện (Logo)"
            hint="PNG, JPG · Nên dùng ảnh vuông, không bắt buộc"
            onChange={(e) => setSelectedFile(e.target.files[0])}
          />
        </section>

        {/* 2. Bảo mật */}
        <section className="space-y-4">
          <AuthSection
            step="2"
            tone="dvvc"
            title="Bảo mật tài khoản"
            description="Dùng để đăng nhập vào hệ thống điều phối vận chuyển."
          />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <AuthField label="Mật khẩu" icon="lock" required>
              <PasswordInput
                name="password"
                required
                onChange={handleChange}
                placeholder="••••••••"
                autoComplete="new-password"
                className={authInputClass("dvvc")}
              />
            </AuthField>

            <AuthField label="Xác nhận mật khẩu" icon="lock_reset" required>
              <PasswordInput
                name="confirmPassword"
                required
                onChange={handleChange}
                placeholder="••••••••"
                autoComplete="new-password"
                className={authInputClass("dvvc")}
              />
            </AuthField>
          </div>
        </section>

        <div className="border-t border-slate-100 pt-5">
          <AuthSubmit loading={loading} tone="dvvc" icon="how_to_reg">
            Đăng ký đơn vị vận chuyển
          </AuthSubmit>
          <p className="mt-3 text-center text-xs leading-relaxed text-slate-500">
            Hồ sơ của bạn sẽ được xem xét trước khi kích hoạt tài khoản.
          </p>
        </div>
      </form>
    </AuthShell>
  );
};

export default DVVCRegister;
