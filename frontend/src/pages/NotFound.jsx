// src/pages/NotFound.jsx
import { Link } from "react-router-dom";

const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full text-center bg-surface-container-lowest border border-outline-variant rounded-2xl p-8 shadow-sm">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-error-container text-error mb-4">
          <span className="material-symbols-outlined text-4xl">error</span>
        </div>
        <h1 className="text-6xl font-extrabold text-error tracking-tight">404</h1>
        <h2 className="mt-3 text-xl font-bold text-on-surface">
          Trang không tồn tại!
        </h2>
        <p className="mt-2 text-sm text-on-surface-variant leading-relaxed">
          Đường dẫn bạn truy cập không hợp lệ hoặc đã bị gỡ bỏ.
        </p>
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-on-primary text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            <span className="material-symbols-outlined text-[18px]">home</span>
            Về trang chủ
          </Link>
          <Link
            to="/san-pham"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-outline-variant text-on-surface text-sm font-semibold hover:bg-surface-container-low transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">shopping_bag</span>
            Xem sản phẩm
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
