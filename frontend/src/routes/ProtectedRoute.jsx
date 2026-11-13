import { Navigate, Outlet } from "react-router-dom";

const ProtectedRoute = ({ allowedRole, allowedRoles }) => {
  const userStr = localStorage.getItem("user");

  // Chuẩn hóa quyền được phép truy cập thành 1 mảng
  const roles = allowedRoles || (allowedRole ? [allowedRole] : []);

  let user = null;
  if (userStr && userStr !== "undefined") {
    try {
      user = JSON.parse(userStr);
    } catch (error) {
      console.error("Lỗi đọc dữ liệu User từ LocalStorage:", error);
    }
  }

  // --- BƯỚC 1: KIỂM TRA CHƯA ĐĂNG NHẬP ---
  if (!user) {
    // Tự động đá về trang login tương ứng với role
    // (mở rộng cho đa role — giữ nguyên admin/hotel như cũ)           ← SỬA
    let loginPath = "/admin/login";
    if (roles.includes("hotel")) loginPath = "/hotel/login";
    else if (roles.includes("shipper")) loginPath = "/shipper/login";
    else if (roles.includes("quanlykho")) loginPath = "/quan-ly-kho/login";
    else if (roles.includes("dvvc")) loginPath = "/dvvc/login";
    else if (roles.includes("nguoi-ban") || roles.includes("shop"))
      loginPath = "/nguoi-ban/login";
    else if (roles.includes("khachhang")) loginPath = "/khach-hang/login";

    return <Navigate to={loginPath} replace />;
  }

  // --- BƯỚC 2: KIỂM TRA PHÂN QUYỀN (Đã fix lỗi Hoa/Thường) ---
  // Chuyển tất cả về chữ thường để so sánh cho chắc chắn
  const userRole = user.role?.toLowerCase() || "";
  const normalizedRoles = roles.map((r) => r.toLowerCase());

  if (normalizedRoles.length > 0 && !normalizedRoles.includes(userRole)) {
    console.warn(
      `Chặn truy cập: User có role '${user.role}' nhưng yêu cầu '${roles.join(", ")}'`,
    );

    // ĐÁ VỀ TRANG CHỦ (Home) thay vì đá về /admin để tránh vòng lặp vô hạn
    return <Navigate to="/" replace />;
  }

  // --- BƯỚC 3: HỢP LỆ ---
  return <Outlet />;
};

export default ProtectedRoute;
