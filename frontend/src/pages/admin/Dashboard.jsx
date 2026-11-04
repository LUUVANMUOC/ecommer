// src/pages/admin/Dashboard.jsx
import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../contexts/AuthContext";
import DashboardLayout from "../../layouts/DashboardLayout";

const AdminDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  // 1. Cấu hình Menu (Lưu ý: Đổi 'id' thành 'path' để khớp với URL)
  const adminMenu = [
    {
      title: "Thông tin hệ thống",
      children: [
        {
          title: "Phí Chiếc Khấu",
          path: "/admin/phi-chiec-khau",
        },
        { title: "Thuộc tính sản phẩm", path: "/admin/thuoc-tinh-san-pham" },
        { title: "Thương hiệu", path: "/admin/thuong-hieu" },
        { title: "Mã giảm giá sàn", path: "/admin/ma-giam-gia-san" },
        {
          title: "Mã giảm giá vận chuyển",
          path: "/admin/ma-giam-gia-van-chuyen",
        },
        { title: "Duyệt sản phẩm", path: "/admin/duyet-san-pham" },
        { title: "Quản lý sản phẩm", path: "/admin/quan-ly-san-pham" },
      ],
    },
    {
      title: "Trả lời kiến nghị",
      path: "/admin/tra-loi-kien-nghi",
    },
    {
      title: "Thông tin sàn",
      path: "/admin/thong-tin-san",
    },
    // {
    //   title: "Quản lý người dùng",
    //   children: [],
    // },
    // {
    //   title: "Quản lý thông báo",
    //   children: [],
    // },
    // {
    //   title: "Quản lý kiến nghị",
    //   children: [],
    // },
  ];

  // 2. Cấu hình Màu sắc riêng cho Admin
  const adminTheme = {
    sidebarBg: "#2c3e50",
    sidebarText: "#ecf0f1",
    menuHoverBg: "#34495e",
    menuActiveBg: "#2980b9",
    menuActiveText: "#ffffff",
    borderColor: "#34495e",
    logoutBtnColor: "#e74c3c",
  };

  const handleLogout = () => {
    logout();
    navigate("/admin/login");
  };

  return (
    <DashboardLayout
      title="Sàn Thương Mại Điện Tử"
      menuConfig={adminMenu}
      userName={user?.STMDTL_Ten || "Quản trị viên"}
      onLogout={handleLogout}
      theme={adminTheme}
    >
      {/* Không cần truyền children (hàm renderContent) vào đây nữa */}
    </DashboardLayout>
  );
};

export default AdminDashboard;
