// src/pages/khachhang/Register.jsx
import { useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../../../contexts/AuthContext";
import khachHangService from "../../../services/khachhang/authService";
const KhachHangRegister = () => {
  // Bỏ registerKhachHang từ context vì context đang dùng JSON, ta cần gửi FormData
  const navigate = useNavigate();

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
    <div className="min-h-screen flex items-center justify-center bg-[#F7F5F0] py-10 px-4">
      <Link
        to="/"
        className="absolute top-6 left-6 flex items-center gap-2 text-gray-600 hover:text-[#F2A93B]"
      >
        <span className="material-symbols-outlined">arrow_back</span> Về trang
        chủ
      </Link>

      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden border border-[#E2DED3]">
        <div className="bg-[#F2A93B] px-6 py-6 text-center">
          <h2 className="text-2xl font-bold text-white">
            Tạo Tài Khoản Khách Hàng
          </h2>
        </div>

        <div className="p-8">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* ✅ KHU VỰC CHỌN ẢNH AVATAR */}
            <div className="flex flex-col items-center justify-center mb-6">
              <div className="w-24 h-24 rounded-full border-4 border-gray-100 bg-gray-50 overflow-hidden relative group cursor-pointer shadow-sm">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                    <span className="material-symbols-outlined text-3xl">
                      add_a_photo
                    </span>
                  </div>
                )}
                <label className="absolute inset-0 bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  <span className="material-symbols-outlined">edit</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageChange}
                  />
                </label>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Nhấp để chọn ảnh đại diện (không bắt buộc)
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Họ và Tên <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.ten}
                  onChange={(e) =>
                    setFormData({ ...formData, ten: e.target.value })
                  }
                  className="w-full px-4 py-2 border rounded-lg focus:border-[#F2A93B] outline-none"
                  placeholder="Nguyễn Văn A"
                />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Số điện thoại <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.sdt}
                  onChange={(e) =>
                    setFormData({ ...formData, sdt: e.target.value })
                  }
                  className="w-full px-4 py-2 border rounded-lg focus:border-[#F2A93B] outline-none"
                  placeholder="0901234567"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Ngày sinh
                </label>
                <input
                  type="date"
                  value={formData.ngaysinh}
                  onChange={(e) =>
                    setFormData({ ...formData, ngaysinh: e.target.value })
                  }
                  className="w-full px-4 py-2 border rounded-lg focus:border-[#F2A93B] outline-none"
                />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Giới tính
                </label>
                <select
                  value={formData.gioitinh}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      gioitinh: e.target.value === "true",
                    })
                  }
                  className="w-full px-4 py-2 border rounded-lg focus:border-[#F2A93B] outline-none"
                >
                  <option value="true">Nam</option>
                  <option value="false">Nữ</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="w-full px-4 py-2 border rounded-lg focus:border-[#F2A93B] outline-none"
                placeholder="email@example.com"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Mật khẩu <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="w-full px-4 py-2 border rounded-lg focus:border-[#F2A93B] outline-none"
                  placeholder="••••••••"
                />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Xác nhận MK <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      confirmPassword: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border rounded-lg focus:border-[#F2A93B] outline-none"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#14201C] hover:bg-[#1E3A34] text-white font-bold py-3 rounded-lg transition-colors mt-4 disabled:opacity-70"
            >
              {loading ? "Đang xử lý..." : "Đăng Ký Tài Khoản"}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600">
            Đã có tài khoản?{" "}
            <Link
              to="/khach-hang/login"
              className="text-[#F2A93B] font-semibold hover:underline"
            >
              Đăng nhập
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KhachHangRegister;
