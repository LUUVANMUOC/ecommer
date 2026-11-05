import { useState, useContext } from "react";
import { AuthContext } from "../../contexts/AuthContext";
import shipperAuthService from "../../services/shipper/authService";
import ToastNotification from "../../components/common/Crud/ToastNotification";
import { toAssetUrl } from "../../utils/accountUtils";

const TaiKhoan = () => {
  const { user } = useContext(AuthContext);

  // State form
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast((p) => ({ ...p, show: false })), 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate
    if (newPassword.length < 6) {
      return showToast("Mật khẩu mới phải có ít nhất 6 ký tự!", "error");
    }
    if (newPassword !== confirmPassword) {
      return showToast("Mật khẩu xác nhận không khớp!", "error");
    }
    if (oldPassword === newPassword) {
      return showToast("Mật khẩu mới không được trùng mật khẩu cũ!", "error");
    }

    setSubmitting(true);
    try {
      await shipperAuthService.changePassword({
        shipper_ma: user.shipper_ma,
        oldPassword,
        newPassword,
      });

      // Cách A: Thông báo thành công và xóa trắng form
      showToast("Đổi mật khẩu thành công!", "success");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      showToast(error.response?.data?.message || "Lỗi đổi mật khẩu", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 bg-[#F8FAFC] min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#0F172A]">Tài Khoản Của Tôi</h1>
        <p className="text-sm text-[#64748B] mt-1">
          Quản lý thông tin cá nhân và bảo mật tài khoản
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* CỘT TRÁI: THÔNG TIN CÁ NHÂN */}
        <div className="lg:col-span-1 bg-white rounded-2xl shadow-sm border border-[#E2E8F0] p-6 h-fit">
          <div className="flex flex-col items-center text-center">
            <div className="w-24 h-24 rounded-full border-4 border-white shadow-md overflow-hidden bg-gray-100 mb-4">
              {user?.shipper_hinhanh ? (
                <img
                  src={toAssetUrl(user.shipper_hinhanh)}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="material-symbols-outlined text-5xl text-gray-400 mt-5">
                  person
                </span>
              )}
            </div>
            <h2 className="text-xl font-bold text-[#0F172A]">
              {user?.shipper_ten}
            </h2>
            <span className="mt-1 px-3 py-1 bg-blue-50 text-blue-600 text-xs font-bold rounded-full">
              {user?.lshipper_ten || "Shipper"}
            </span>
          </div>

          <div className="mt-8 space-y-4">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                Số điện thoại
              </p>
              <p className="font-medium text-gray-800">{user?.shipper_sdt}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                Mã nhân viên
              </p>
              <p className="font-medium text-gray-800">{user?.shipper_ma}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                Kho trực thuộc
              </p>
              <p className="font-medium text-gray-800">{user?.kho_ten}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                Đơn vị vận chuyển
              </p>
              <p className="font-medium text-gray-800">{user?.dvvc_ten}</p>
            </div>
          </div>
        </div>

        {/* CỘT PHẢI: FORM ĐỔI MẬT KHẨU */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-[#E2E8F0] p-6">
          <h3 className="text-lg font-bold text-[#0F172A] border-b pb-4 mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-blue-600">
              lock
            </span>
            Đổi Mật Khẩu
          </h3>

          <form onSubmit={handleSubmit} className="max-w-md space-y-5">
            {/* Mật khẩu cũ */}
            <div>
              <label className="block text-sm font-semibold mb-1">
                Mật khẩu hiện tại <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showOld ? "text" : "password"}
                  required
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E2E8F0] outline-none focus:border-blue-600 pr-10"
                  placeholder="Nhập mật khẩu hiện tại"
                />
                <button
                  type="button"
                  onClick={() => setShowOld(!showOld)}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-blue-600"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {showOld ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
            </div>

            {/* Mật khẩu mới */}
            <div>
              <label className="block text-sm font-semibold mb-1">
                Mật khẩu mới <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showNew ? "text" : "password"}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E2E8F0] outline-none focus:border-blue-600 pr-10"
                  placeholder="Nhập mật khẩu mới (ít nhất 6 ký tự)"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-blue-600"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {showNew ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
            </div>

            {/* Xác nhận mật khẩu */}
            <div>
              <label className="block text-sm font-semibold mb-1">
                Xác nhận mật khẩu mới <span className="text-red-500">*</span>
              </label>
              <input
                type={showNew ? "text" : "password"}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-[#E2E8F0] outline-none focus:border-blue-600"
                placeholder="Nhập lại mật khẩu mới"
              />
            </div>

            <div className="pt-4 border-t">
              <button
                type="submit"
                disabled={submitting}
                className="px-8 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 disabled:bg-gray-400 transition-colors flex items-center gap-2"
              >
                {submitting ? "Đang xử lý..." : "Cập Nhật Mật Khẩu"}
              </button>
            </div>
          </form>
        </div>
      </div>

      <ToastNotification toast={toast} />
    </div>
  );
};

export default TaiKhoan;
