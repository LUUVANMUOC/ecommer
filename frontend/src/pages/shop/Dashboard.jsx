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
          path: "/nguoi-ban/danh-muc-san-pham", // Trỏ tới trang index
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
      ],
    },
    // {
    //   title: "Cấu hình hệ thống",
    //   children: [
    //     {
    //       title: "Cài đặt gian hàng",
    //       path: "/nguoi-ban/cai-dat",
    //     },
    //     {
    //       title: "Quản lý đánh giá",
    //       path: "/nguoi-ban/danh-gia",
    //     },
    //   ],
    // },
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
          title: "Hồ sơ cửa hàng", // Sửa lại tên cho chuyên nghiệp
          path: "/nguoi-ban/thong-tin-cua-hang", // Đã sửa: Thêm tiền tố /nguoi-ban/
        },
        {
          title: "Vận chuyển", // Sửa lại tên cho chuyên nghiệp
          path: "/nguoi-ban/van-chuyen", // Đã sửa: Thêm tiền tố /nguoi-ban/
        },
      ],
    },
  ];

  // 2. Cấu hình Màu sắc riêng cho Shop (Màu cam đất, tối giản)
  const shopTheme = {
    sidebarBg: "#1e293b", // Màu nền xám đậm
    sidebarText: "#e2e8f0", // Màu chữ sáng
    menuHoverBg: "#334155", // Màu khi di chuột
    menuActiveBg: "#ea580c", // Màu cam khi chọn (Orange-600)
    menuActiveText: "#ffffff", // Màu chữ khi chọn
    borderColor: "#334155", // Màu đường viền
    logoutBtnColor: "#ef4444", // Màu nút đăng xuất
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
