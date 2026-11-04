import { useState } from "react";
import ImageUpload from "../common/ImageUpload";
import { FormField, fieldBase, btnPrimary } from "./AccountLayout";

const EMPTY_PASSWORD = { oldPassword: "", newPassword: "", confirmPassword: "" };

const PASSWORD_FIELDS = [
  { name: "oldPassword", placeholder: "Mật khẩu hiện tại" },
  { name: "newPassword", placeholder: "Mật khẩu mới" },
  { name: "confirmPassword", placeholder: "Xác nhận mật khẩu mới" },
];

/**
 * @param {Function} onSubmit   async ({ oldPassword, newPassword }) => boolean (true = thành công)
 * @param {Function} onNotify   (message, type) hiển thị lỗi validate
 * @param {number}   minLength  Độ dài tối thiểu của mật khẩu mới
 */
export const ChangePasswordForm = ({ onSubmit, onNotify, minLength = 6 }) => {
  const [data, setData] = useState(EMPTY_PASSWORD);
  const [submitting, setSubmitting] = useState(false);

  const validate = () => {
    if (!data.oldPassword || !data.newPassword || !data.confirmPassword)
      return "Vui lòng nhập đầy đủ thông tin mật khẩu";
    if (data.newPassword !== data.confirmPassword)
      return "Mật khẩu xác nhận không khớp!";
    if (data.newPassword.length < minLength)
      return `Mật khẩu mới phải có ít nhất ${minLength} ký tự`;
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const error = validate();
    if (error) return onNotify?.(error, "error");

    setSubmitting(true);
    try {
      const ok = await onSubmit({
        oldPassword: data.oldPassword,
        newPassword: data.newPassword,
      });
      if (ok) setData(EMPTY_PASSWORD);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-[#14201C]">
        <span className="material-symbols-outlined text-[18px] text-[#7A857F]">lock_reset</span>
        Đổi mật khẩu
      </h3>
      <form onSubmit={handleSubmit} className="space-y-3">
        {PASSWORD_FIELDS.map((field) => (
          <input
            key={field.name}
            type="password"
            name={field.name}
            placeholder={field.placeholder}
            aria-label={field.placeholder}
            value={data[field.name]}
            onChange={(e) => setData({ ...data, [field.name]: e.target.value })}
            className={`${fieldBase} py-2 text-[13px]`}
            required
          />
        ))}
        <button type="submit" disabled={submitting} className={`${btnPrimary} w-full py-2 text-[13px]`}>
          {submitting ? "Đang xử lý..." : "Cập nhật mật khẩu"}
        </button>
      </form>
    </div>
  );
};

// Chọn tỉnh → xã. Danh sách xã được lọc theo tỉnh đang chọn.
export const AddressSelector = ({ tinhs, xas, selectedTinh, selectedXa, onTinhChange, onXaChange }) => {
  const filteredXas = xas.filter((xa) => String(xa.tinh_ma) === String(selectedTinh));

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <FormField label="Tỉnh / Thành phố" required>
        <select
          value={selectedTinh}
          onChange={(e) => onTinhChange(e.target.value)}
          className={fieldBase}
          required
        >
          <option value="">-- Chọn Tỉnh/Thành phố --</option>
          {tinhs.map((tinh, i) => (
            <option key={tinh.ma || `tinh-${i}`} value={tinh.ma}>
              {tinh.ten}
            </option>
          ))}
        </select>
      </FormField>

      <FormField label="Phường / Xã" required>
        <select
          value={selectedXa}
          onChange={(e) => onXaChange(e.target.value)}
          disabled={!selectedTinh}
          className={fieldBase}
          required
        >
          <option value="">-- Chọn Phường/Xã --</option>
          {filteredXas.map((xa, i) => (
            <option key={xa.ma || `xa-${i}`} value={xa.ma}>
              {xa.ten}
            </option>
          ))}
        </select>
      </FormField>
    </div>
  );
};

/**
 * @param {Object}   values       { gh_ten, gh_email, gh_mota, dc_mota }
 * @param {Function} onChange     Handler của input (dựa vào attribute name)
 * @param {Object}   addressProps Props truyền vào AddressSelector
 * @param {string}   logoUrl      Ảnh hiện tại
 * @param {Function} onLogoSelect (file) => void
 * @param {Function} onSubmit
 * @param {boolean}  saving
 */
export const ProfileInfoForm = ({
  values,
  onChange,
  addressProps,
  logoUrl,
  onLogoSelect,
  onSubmit,
  saving,
}) => (
  <form onSubmit={onSubmit} className="space-y-6">
    <div className="grid gap-6 md:grid-cols-2">
      <FormField label="Tên gian hàng" required>
        <input
          type="text"
          name="gh_ten"
          required
          value={values.gh_ten}
          onChange={onChange}
          className={fieldBase}
        />
      </FormField>

      <FormField label="Email đăng nhập" hint="Email đăng nhập không thể thay đổi.">
        <div className="relative">
          <input type="email" value={values.gh_email} disabled className={`${fieldBase} pr-10`} />
          <span className="material-symbols-outlined pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[18px] text-[#9AA39E]">
            lock
          </span>
        </div>
      </FormField>
    </div>

    <AddressSelector {...addressProps} />

    <FormField label="Số nhà, tên đường" required>
      <input
        type="text"
        name="dc_mota"
        required
        value={values.dc_mota}
        onChange={onChange}
        className={fieldBase}
        placeholder="VD: 123 Nguyễn Văn Cừ"
      />
    </FormField>

    <FormField label="Mô tả cửa hàng">
      <textarea
        name="gh_mota"
        rows={4}
        value={values.gh_mota}
        onChange={onChange}
        className={`${fieldBase} resize-y`}
        placeholder="Giới thiệu ngắn gọn về cửa hàng..."
      />
    </FormField>

    <div className="space-y-1.5">
      <span className="block text-sm font-semibold text-[#3D4A44]">Ảnh đại diện</span>
      <ImageUpload
        label="Logo cửa hàng"
        currentImage={logoUrl}
        hint="Hỗ trợ JPG, PNG, WEBP. Kích thước đề xuất: 512x512px."
        onFileSelect={onLogoSelect}
      />
    </div>

    <div className="flex justify-end border-t border-[#EFEBE2] pt-6">
      <button type="submit" disabled={saving} className={btnPrimary}>
        <span className={`material-symbols-outlined text-[18px] ${saving ? "animate-spin" : ""}`}>
          {saving ? "progress_activity" : "save"}
        </span>
        {saving ? "Đang lưu..." : "Lưu thay đổi"}
      </button>
    </div>
  </form>
);
