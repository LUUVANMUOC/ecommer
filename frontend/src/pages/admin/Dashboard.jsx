// src/pages/admin/Dashboard.jsx
import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import {
  Settings,
  Percent,
  SlidersHorizontal,
  Award,
  Ticket,
  Truck,
  CheckSquare,
  Package,
  ClipboardList,
  MessageSquareWarning,
  Store,
  Wallet,
  CreditCard,
  History,
  Receipt,
} from "lucide-react";
import { AuthContext } from "../../contexts/AuthContext";
import DashboardLayout from "../../layouts/DashboardLayout";

const AdminDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  // 1. Cấu hình Menu
  const adminMenu = [
    {
      title: "Thông tin hệ thống",
      icon: Settings,
      children: [
        { title: "Phí Chiết Khấu", path: "/admin/phi-chiec-khau", icon: Percent },
        { title: "Thuộc tính sản phẩm", path: "/admin/thuoc-tinh-san-pham", icon: SlidersHorizontal },
        { title: "Thương hiệu", path: "/admin/thuong-hieu", icon: Award },
        { title: "Mã giảm giá sàn", path: "/admin/ma-giam-gia-san", icon: Ticket },
        {
          title: "Mã giảm giá vận chuyển",
          path: "/admin/ma-giam-gia-van-chuyen",
          icon: Truck,
        },
        { title: "Duyệt sản phẩm", path: "/admin/duyet-san-pham", icon: CheckSquare },
        { title: "Quản lý sản phẩm", path: "/admin/quan-ly-san-pham", icon: Package },
        { title: "Quản lý Đơn hàng", path: "/admin/quan-ly-don-hang", icon: ClipboardList },
      ],
    },
    {
      title: "Trả lời kiến nghị",
      path: "/admin/tra-loi-kien-nghi",
      icon: MessageSquareWarning,
    },
    {
      title: "Thông tin sàn",
      path: "/admin/thong-tin-san",
      icon: Store,
    },
    {
      title: "Quản lý dòng tiền",
      path: "/admin/quan-ly-dong-tien",
      icon: Wallet,
    },
    {
      title: "Thanh toán Vận chuyển",
      path: "/admin/thanh-toan-van-chuyen",
      icon: CreditCard,
    },
    {
      title: "Lịch sử trả phí Ship",
      path: "/admin/lich-su-van-chuyen",
      icon: History,
    },
    {
      title: "Quản lý phí vận chuyển",
      path: "/admin/quan-ly-phi-van-chuyen",
      icon: Receipt,
    },
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
    ></DashboardLayout>
  );
};

export default AdminDashboard;
