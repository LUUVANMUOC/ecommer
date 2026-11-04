// src/pages/shop/Dashboard.jsx
import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../contexts/AuthContext";
import DashboardLayout from "../../layouts/DashboardLayout";

const DVVCDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  // 1. Cấu hình Menu cho Người bán
  const DVVCMenu = [
    {
      title: "Quản lý dữ liệu",
      children: [
        {
          title: "Quản lý Kho",
          path: "/dvvc/quan-ly-kho",
        },
        {
          title: "Quản lý shiper",
          path: "/dvvc/quan-ly-shipper",
        },
        {
          title: "Quản lý cước phí",
          path: "/dvvc/bang-gia-van-chuyen",
        },
      ],
    },
    {
      title: "Quản lý giao hàng",
      children: [
        // {
        //   title: "Quản lý nhận hàng",
        //   path: "/dvvc/phan-cong-shipper",
        // },
        // {
        //   title: "Quản lý trung chuyển",
        //   path: "",
        // },
        // {
        //   title: "Quản lý giao hàng",
        //   path: "",
        // },
        { title: "Theo dõi đơn hàng", path: "/dvvc/theo-doi-don-hang" },
      ],
    },
    {
      title: "Thông tin Đơn vị vận chuyển",
      children: [
        {
          title: "Hồ sơ DVVC", // Sửa lại tên cho chuyên nghiệp
          path: "/dvvc/thong-tin", // Đã sửa: Thêm tiền tố /nguoi-ban/
        },
      ],
    },
  ];

  // 2. Cấu hình Màu sắc riêng cho Shop (Màu cam đất, tối giản)
  const DVVCTheme = {
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
    navigate("/dvvc/login");
  };

  return (
    <DashboardLayout
      title="Kênh Đơn Vị Vận Chuyển"
      menuConfig={DVVCMenu}
      userName={user?.dvvc_ten || "ĐVVC"}
      onLogout={handleLogout}
      theme={DVVCTheme}
    >
      {/* Nội dung các trang con sẽ được render tự động qua Outlet trong DashboardLayout */}
    </DashboardLayout>
  );
};

export default DVVCDashboard;
