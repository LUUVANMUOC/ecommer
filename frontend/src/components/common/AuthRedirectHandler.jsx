// src/components/common/AuthRedirectHandler.jsx
// Nhận sự kiện 401 từ axiosClient và điều hướng mềm về trang đăng nhập,
// giữ nguyên history của SPA thay vì reload cứng cả trang.
import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

const AuthRedirectHandler = () => {
  const navigate = useNavigate();
  const lastRedirect = useRef(0);

  useEffect(() => {
    const onUnauthorized = (event) => {
      const path = event.detail?.path;
      if (!path) return;

      // Báo cho axiosClient biết đã xử lý → không fallback reload cứng.
      event.preventDefault();

      // Nhiều request cùng 401 một lúc → chỉ điều hướng một lần.
      const now = Date.now();
      if (now - lastRedirect.current < 1000) return;
      lastRedirect.current = now;

      navigate(path, { replace: true });
    };

    window.addEventListener("auth:unauthorized", onUnauthorized);
    return () =>
      window.removeEventListener("auth:unauthorized", onUnauthorized);
  }, [navigate]);

  return null;
};

export default AuthRedirectHandler;
