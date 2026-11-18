// frontend/src/components/common/PasswordInput.jsx
// Ô nhập mật khẩu dùng chung cho mọi actor (đăng nhập / đăng ký / đổi mật khẩu).
// - Mặc định ẩn như cũ (type="password")
// - Bấm con mắt để hiện, bấm lần nữa để ẩn
// - Tự ẩn lại khi form được submit (dù thành công hay lỗi)
import { useEffect, useRef, useState } from "react";

const PasswordInput = ({
  className = "",
  buttonClassName = "",
  value,
  defaultValue,
  onChange,
  disabled = false,
  ...rest
}) => {
  const [hien, setHien] = useState(false);
  const inputRef = useRef(null);

  // Tự ẩn lại khi submit form chứa ô này
  useEffect(() => {
    const form = inputRef.current ? inputRef.current.form : null;
    if (!form) return undefined;

    const anLai = () => setHien(false);
    form.addEventListener("submit", anLai);
    return () => form.removeEventListener("submit", anLai);
  }, []);

  const dangHien = hien && !disabled;

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type={dangHien ? "text" : "password"}
        className={`${className} pr-11`}
        onChange={onChange}
        disabled={disabled}
        {...(value !== undefined ? { value } : { defaultValue })}
        {...rest}
      />
      <button
        type="button"
        onClick={() => setHien((truoc) => !truoc)}
        // Giữ focus ở ô nhập để không mất vị trí con trỏ
        onMouseDown={(e) => e.preventDefault()}
        disabled={disabled}
        aria-label={dangHien ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
        aria-pressed={dangHien}
        title={dangHien ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
        className={`absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-black/5 hover:text-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 disabled:cursor-not-allowed disabled:opacity-40 ${buttonClassName}`}
      >
        <span
          className="material-symbols-outlined text-[20px] leading-none"
          aria-hidden="true"
        >
          {dangHien ? "visibility_off" : "visibility"}
        </span>
      </button>
    </div>
  );
};

export default PasswordInput;
