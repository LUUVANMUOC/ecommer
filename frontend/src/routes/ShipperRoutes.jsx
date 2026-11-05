// src/routes/ShipperRoutes.jsx
import { Routes, Route, Link } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import ShipperDashboard from "../pages/shipper/Dashboard";
import ShipperHome from "../pages/shipper/dashboard/ShipperHome";
import DonChoLay from "../pages/shipper/DonChoLay";
import TrungChuyen from "../pages/shipper/TrungChuyen";
import GiaoHang from "../pages/shipper/GiaoHang";
import TaiKhoan from "../pages/shipper/TaiKhoan"; // 🟢 Import trang Tài Khoản mới

// Guard check quyền truy cập theo lsp_ma (business key — quy ước cố định)
const RoleGuard = ({ allowed, children }) => {
  let user = {};
  try {
    user = JSON.parse(localStorage.getItem("user") || "{}");
  } catch {
    user = {};
  }
  const lsp = user?.lsp_ma;

  if (!allowed.includes(lsp)) {
    return (
      <div className="p-10 flex flex-col items-center justify-center min-h-[60vh] text-center">
        <span className="material-symbols-outlined text-6xl text-red-300 mb-4">
          block
        </span>
        <h2 className="text-xl font-bold text-gray-800 mb-2">
          Không có quyền truy cập
        </h2>
        <p className="text-gray-500 mb-6">
          Chức năng này không dành cho loại shipper của bạn.
        </p>
        <Link
          to="/shipper"
          className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold"
        >
          Về trang chủ
        </Link>
      </div>
    );
  }
  return children;
};

const ShipperRoutes = () => {
  return (
    <Routes>
      <Route element={<ProtectedRoute allowedRoles={["shipper"]} />}>
        <Route path="/" element={<ShipperDashboard />}>
          {/* Trang chủ — component tự switch theo user.lsp_ma */}
          <Route index element={<ShipperHome />} />

          {/* LSP01 — Lấy hàng */}
          <Route
            path="don-cho-lay"
            element={
              <RoleGuard allowed={["LSP01"]}>
                <DonChoLay />
              </RoleGuard>
            }
          />

          {/* LSP02 — Vận chuyển */}
          <Route
            path="trung-chuyen"
            element={
              <RoleGuard allowed={["LSP02"]}>
                <TrungChuyen />
              </RoleGuard>
            }
          />

          {/* LSP03 — Giao hàng */}
          <Route
            path="giao-hang"
            element={
              <RoleGuard allowed={["LSP03"]}>
                <GiaoHang />
              </RoleGuard>
            }
          />

          {/* 🟢 Tài khoản — Tất cả các loại Shipper đều có quyền truy cập */}
          <Route path="tai-khoan" element={<TaiKhoan />} />
        </Route>
      </Route>
    </Routes>
  );
};

export default ShipperRoutes;
