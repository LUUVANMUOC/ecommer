import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../contexts/AuthContext";
import DashboardLayout from "../../layouts/DashboardLayout";

const QuanLyKhoDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const menuConfig = [
    {
      title: "Quản lý kho",
      children: [
        { title: "Trang chủ", path: "/quan-ly-kho" },
        { title: "Quản lý shipper", path: "/quan-ly-kho/quan-ly-shipper" },
        {
          title: "Phân công shipper (Lấy hàng)",
          path: "/quan-ly-kho/phan-cong-shipper",
        },
        { title: "Gửi trung chuyển", path: "/quan-ly-kho/gui-trung-chuyen" },
        { title: "Nhận trung chuyển", path: "/quan-ly-kho/nhan-trung-chuyen" },
        {
          title: "Phân công giao hàng",
          path: "/quan-ly-kho/phan-cong-giao-hang",
        },
        { title: "Lịch sử kho", path: "/quan-ly-kho/lich-su" },
      ],
    },
    {
      title: "Nhập / Xuất kho",
      children: [
        // Đổi tên menu cho phù hợp
        { title: "Quản lý phiếu kho", path: "/quan-ly-kho/phieu-kho" },
        { title: "Lịch sử phiếu kho", path: "/quan-ly-kho/phieu-kho/lich-su" },
      ],
    },
    {
      title: "Tài chính",
      children: [
        { title: "Thu tiền Shipper", path: "/quan-ly-kho/thu-tien-shipper" },
        { title: "Tất toán dòng tiền", path: "/quan-ly-kho/tat-toan" },
      ],
    },
  ];

  const theme = {
    sidebarBg: "#1e293b",
    sidebarText: "#e2e8f0",
    menuHoverBg: "#334155",
    menuActiveBg: "#4f46e5",
    menuActiveText: "#ffffff",
    borderColor: "#334155",
    logoutBtnColor: "#ef4444",
  };

  const handleLogout = () => {
    logout();
    navigate("/quan-ly-kho/login");
  };

  return (
    <DashboardLayout
      title={`Quản Lý Kho: ${user?.kho_ten || "Kho"}`}
      menuConfig={menuConfig}
      userName={user?.kho_ten || "Quản lý kho"}
      onLogout={handleLogout}
      theme={theme}
    />
  );
};

export default QuanLyKhoDashboard;
