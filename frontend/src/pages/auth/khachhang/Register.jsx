// src/pages/khachhang/Register.jsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import khachHangService from "../../../services/khachhang/authService";
import PasswordInput from "../../../components/common/PasswordInput";
import AuthShell, {
  AuthAlert,
  AuthField,
  AuthSection,
  AuthSubmit,
} from "../../../components/auth/AuthShell";
import {
  authInputClass,
  getAuthTone,
} from "../../../components/auth/authTheme";

const KhachHangRegister = () => {
  // Bỏ registerKhachHang từ context vì context đang dùng JSON, ta cần gửi FormData
  const navigate = useNavigate();
  const tone = getAuthTone("khachhang");

  const [formData, setFormData] = useState({
    ten: "",
    email: "",
    password: "",
    confirmPassword: "",
    sdt: "",
    ngaysinh: "",
    gioitinh: true,
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      return setError("Mật khẩu xác nhận không khớp!");
    }
    setError("");
    setLoading(true);
    try {
      // Đóng gói dữ liệu vào FormData để gửi file
      const dataToSend = new FormData();
      dataToSend.append("ten", formData.ten);
      dataToSend.append("email", formData.email);
      dataToSend.append("password", formData.password);
      dataToSend.append("sdt", formData.sdt);
      dataToSend.append("ngaysinh", formData.ngaysinh);
      dataToSend.append("gioitinh", formData.gioitinh);

      if (avatarFile) {
        dataToSend.append("avatar", avatarFile); // Key 'avatar' phải khớp với backend multer
      }

      await khachHangService.register(dataToSend);

      alert("Đăng ký thành công! Vui lòng đăng nhập.");
      navigate("/khach-hang/login");
    } catch (err) {
      setError(err.response?.data?.message || "Có lỗi xảy ra khi đăng ký.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      tone="khachhang"
      width="xl"
      icon="person_add"
      eyebrow="Khách hàng mới"
      title="Tạo tài khoản khách hàng"
      subtitle="Đăng ký để nhận ưu đãi dành riêng cho bạn"
      panelTitle="Thành viên mới, muôn vàn ưu đãi"
      panelDesc="Tạo tài khoản miễn phí để mua sắm nhanh hơn, lưu địa chỉ nhận hàng và không bỏ lỡ voucher giảm giá."
      panelPoints={[
        { icon: "bolt", text: "Thanh toán nhanh với thông tin đã lưu" },
        { icon: "redeem", text: "Ưu đãi và quà tặng cho thành viên" },
        { icon: "history", text: "Tra cứu lịch sử đơn hàng dễ dàng" },
      ]}
      footer={
        <>
          Đã có tài khoản?{" "}
          <Link
            to="/khach-hang/login"
            className={`font-semibold underline decoration-2 underline-offset-4 transition-colors ${tone.link}`}
          >
            Đăng nhập
          </Link>
        </>
      }
    >
      {error && <AuthAlert>{error}</AuthAlert>}

      <form onSubmit={handleSubmit} className="space-y-7">
        {/* Ảnh đại diện */}
        <div className="flex flex-col items-center gap-2">
          <div className="relative">
            <div className="h-24 w-24 overflow-hidden rounded-full bg-slate-100 ring-4 ring-[#FEF3C7] shadow-inner">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Avatar"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-slate-400">
                  <span className="material-symbols-outlined text-[32px]">
                    add_a_photo
                  </span>
                </div>
              )}
            </div>
            <label
              className="absolute -bottom-1 -right-1 grid h-9 w-9 cursor-pointer place-items-center rounded-full bg-gradient-to-br from-[#F59E0B] to-[#D97706] text-white shadow-lg ring-4 ring-white transition hover:brightness-110"
              title="Chọn ảnh đại diện"
            >
              <span className="material-symbols-outlined text-[18px]">
                edit
              </span>
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={handleImageChange}
              />
            </label>
          </div>
          <p className="text-xs text-slate-500">
            Ảnh đại diện (không bắt buộc)
          </p>
        </div>

        {/* 1. Thông tin cá nhân */}
        <section className="space-y-4">
          <AuthSection
            step="1"
            tone="khachhang"
            title="Thông tin cá nhân"
            description="Giúp đơn hàng được giao đến đúng người nhận."
          />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <AuthField label="Họ và tên" icon="person" required>
              <input
                type="text"
                required
                value={formData.ten}
                onChange={(e) =>
                  setFormData({ ...formData, ten: e.target.value })
                }
                placeholder="Nguyễn Văn A"
                autoComplete="name"
                className={authInputClass("khachhang")}
              />
            </AuthField>

            <AuthField label="Số điện thoại" icon="call" required>
              <input
                type="text"
                required
                value={formData.sdt}
                onChange={(e) =>
                  setFormData({ ...formData, sdt: e.target.value })
                }
                placeholder="0901234567"
                autoComplete="tel"
                className={authInputClass("khachhang")}
              />
            </AuthField>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <AuthField label="Ngày sinh" icon="cake">
              <input
                type="date"
                value={formData.ngaysinh}
                onChange={(e) =>
                  setFormData({ ...formData, ngaysinh: e.target.value })
                }
                className={authInputClass("khachhang")}
              />
            </AuthField>

            <AuthField label="Giới tính" icon="wc">
              <select
                value={formData.gioitinh}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    gioitinh: e.target.value === "true",
                  })
                }
                className={authInputClass("khachhang")}
              >
                <option value="true">Nam</option>
                <option value="false">Nữ</option>
              </select>
            </AuthField>
          </div>
        </section>

        {/* 2. Tài khoản */}
        <section className="space-y-4">
          <AuthSection
            step="2"
            tone="khachhang"
            title="Thông tin tài khoản"
            description="Email dùng để đăng nhập và nhận thông báo đơn hàng."
          />

          <AuthField label="Email" icon="mail" required>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              placeholder="email@example.com"
              autoComplete="email"
              className={authInputClass("khachhang")}
            />
          </AuthField>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <AuthField label="Mật khẩu" icon="lock" required>
              <PasswordInput
                required
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                placeholder="••••••••"
                autoComplete="new-password"
                className={authInputClass("khachhang")}
              />
            </AuthField>

            <AuthField label="Xác nhận mật khẩu" icon="lock_reset" required>
              <PasswordInput
                required
                value={formData.confirmPassword}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    confirmPassword: e.target.value,
                  })
                }
                placeholder="••••••••"
                autoComplete="new-password"
                className={authInputClass("khachhang")}
              />
            </AuthField>
          </div>
        </section>

        <div className="border-t border-slate-100 pt-5">
          <AuthSubmit loading={loading} tone="khachhang" icon="how_to_reg">
            Đăng ký tài khoản
          </AuthSubmit>
          <p className="mt-3 text-center text-xs leading-relaxed text-slate-500">
            Bằng việc đăng ký, bạn đồng ý với điều khoản sử dụng của CT255.
          </p>
        </div>
      </form>
    </AuthShell>
  );
};

export default KhachHangRegister;
