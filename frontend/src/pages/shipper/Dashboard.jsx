// src/pages/shipper/Dashboard.jsx
import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../contexts/AuthContext";
import DashboardLayout from "../../layouts/DashboardLayout";
import { getLSPUIConfig } from "./constants";

const ShipperDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  // UI config (icon, màu, menu) map theo lsp_ma
  const uiConfig = getLSPUIConfig(user?.lsp_ma);

  // Label lấy ĐỘNG từ BE (đã có trong user sau login) — KHÔNG hardcode
  const labelLoai = user?.lshipper_ten || "Shipper";

  const menuConfig = [
    {
      title: "Đơn hàng",
      children: uiConfig.menuItems,
    },
  ];

  const handleLogout = () => {
    logout();
    navigate("/shipper/login");
  };

  return (
    <DashboardLayout
      title={`Kênh ${labelLoai}`}
      menuConfig={menuConfig}
      userName={user?.shipper_ten || "Shipper"}
      onLogout={handleLogout}
      theme={uiConfig.theme}
    />
  );
};

export default ShipperDashboard;
