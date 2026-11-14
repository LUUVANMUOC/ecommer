// frontend/src/pages/khachhang/HopThuKhachHang.jsx
import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../contexts/AuthContext";
import SiteHeader from "../../components/layout/SiteHeader";
import HopThuThongBao from "../common/HopThuThongBao";

const HopThuKhachHang = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <SiteHeader
        user={user}
        showUtilities
        onLogout={() => {
          logout();
          navigate("/khach-hang/login");
        }}
      />

      <main className="mx-auto max-w-5xl px-4 py-8">
        <HopThuThongBao />
      </main>
    </div>
  );
};

export default HopThuKhachHang;
