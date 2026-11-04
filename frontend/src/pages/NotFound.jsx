// src/pages/NotFound.jsx
import { Link } from "react-router-dom";

const NotFound = () => {
  return (
    <div style={{ textAlign: "center", marginTop: "100px" }}>
      <h1 style={{ fontSize: "72px", margin: 0, color: "#d9534f" }}>404</h1>
      <h2>Trang không tồn tại!</h2>
      <p>Đường dẫn bạn truy cập không hợp lệ hoặc đã bị gỡ bỏ.</p>
      <Link
        to="/admin/login"
        style={{ color: "blue", textDecoration: "underline" }}
      >
        Quay lại trang Đăng nhập
      </Link>
    </div>
  );
};

// QUAN TRỌNG: Phải có dòng này
export default NotFound;
