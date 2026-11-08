// src/pages/shop/Dashboard.jsx
import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../contexts/AuthContext";
import DashboardLayout from "../../layouts/DashboardLayout";

const ShopDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  // 1. Cấu hình Menu cho Người bán
  const shopMenu = [
    {
      title: "Quản lý bán hàng",
      children: [
        {
          title: "Danh mục sản phẩm",
          path: "/nguoi-ban/danh-muc-san-pham",
        },
        {
          title: "Quản lý Sản phẩm",
          path: "/nguoi-ban/quan-ly-san-pham",
        },
        {
          title: "Quản lý Đơn hàng",
          path: "/nguoi-ban/quan-ly-don-hang",
        },
        {
          title: "Mã giảm giá của Shop",
          path: "/nguoi-ban/ma-giam-gia-shop",
        },
        // 🟢 Thêm mục Lịch sử nhận tiền vào đây
        {
          title: "Lịch sử nhận tiền",
          path: "/nguoi-ban/lich-su-dong-tien",
        },
      ],
    },
    {
      title: "Hỗ trợ",
      children: [
        {
          title: "Kiến nghị / Khiếu nại",
          path: "/nguoi-ban/gui-kien-nghi",
        },
      ],
    },
    {
      title: "Thông tin cửa hàng",
      children: [
        {
          title: "Hồ sơ cửa hàng",
          path: "/nguoi-ban/thong-tin-cua-hang",
        },
        {
          title: "Vận chuyển",
          path: "/nguoi-ban/van-chuyen",
        },
      ],
    },
  ];

  // 2. Cấu hình Màu sắc riêng cho Shop (Màu cam đất, tối giản)
  const shopTheme = {
    sidebarBg: "#1e293b",
    sidebarText: "#e2e8f0",
    menuHoverBg: "#334155",
    menuActiveBg: "#ea580c",
    menuActiveText: "#ffffff",
    borderColor: "#334155",
    logoutBtnColor: "#ef4444",
  };

  const handleLogout = () => {
    logout();
    navigate("/nguoi-ban/login");
  };

  return (
    <DashboardLayout
      title="Kênh Người Bán"
      menuConfig={shopMenu}
      userName={user?.GH_Ten || "Người bán"}
      onLogout={handleLogout}
      theme={shopTheme}
    >
      {/* Nội dung các trang con sẽ được render tự động qua Outlet trong DashboardLayout */}
    </DashboardLayout>
  );
};

export default ShopDashboard;
