// src/routes/AppRoutes.jsx
import { Routes, Route } from "react-router-dom";
import Home from "../pages/Home";
import NotFound from "../pages/NotFound";
import QuanLyKhoLogin from "../pages/auth/quanlykho/Login";
import QuanLyKhoRoutes from "./QuanLyKhoRoutes";
// ================= AUTH ROUTES =================
// Admin
import AdminLogin from "../pages/auth/admin/Login";
import AdminRegister from "../pages/auth/admin/Register";
// Shop
import ShopLogin from "../pages/auth/shop/Login";
import ShopRegister from "../pages/auth/shop/Register";
// DVVC
import DVVCLogin from "../pages/auth/DonViVanChuyen/Login";
import DVVCRegister from "../pages/auth/DonViVanChuyen/Register";
// Khách hàng
import KhachHangLogin from "../pages/auth/khachhang/Login";
import KhachHangRegister from "../pages/auth/khachhang/Register";
// Shipper                                                          ← THÊM
import ShipperLogin from "../pages/auth/shipper/Login"; // ← THÊM
import ShopProfile from "../pages/khachhang/ShopProfile"; // 🟢 Import

// ================= MAIN LAYOUT ROUTES =================
import AdminRoutes from "./AdminRoutes";
import ShopRoutes from "./ShopRoutes";
import DVVCRoutes from "./DVVCRoute";
import KhachHangRoutes from "./KhachHangRoutes";
import ShipperRoutes from "./ShipperRoutes"; // ← THÊM

// ================= PUBLIC PRODUCT ROUTES =================
import DanhSachSanPham from "../pages/khachhang/DanhSachSanPham";
import ChiTietSanPhamKhachHang from "../pages/khachhang/ChiTietSanPham";

const AppRoutes = () => {
  return (
    <Routes>
      {/* 1. Trang chủ */}
      <Route path="/" element={<Home />} />
      <Route path="/home" element={<Home />} />
      {/* 2. Các trang Đăng nhập / Đăng ký (Public) */}
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin/register" element={<AdminRegister />} />
      <Route path="/nguoi-ban/login" element={<ShopLogin />} />
      <Route path="/nguoi-ban/register" element={<ShopRegister />} />
      <Route path="/dvvc/login" element={<DVVCLogin />} />
      <Route path="/dvvc/register" element={<DVVCRegister />} />
      {/* Shipper Đăng nhập */} {/* ← THÊM */}
      <Route path="/shipper/login" element={<ShipperLogin />} /> {/* ← THÊM */}
      <Route path="/quan-ly-kho/login" element={<QuanLyKhoLogin />} />{" "}
      {/* ← THÊM */}
      {/* Khách hàng Đăng nhập / Đăng ký */}
      <Route path="/khach-hang/login" element={<KhachHangLogin />} />
      <Route path="/khach-hang/register" element={<KhachHangRegister />} />
      {/* 3. Xem sản phẩm công khai (Ai cũng xem được) */}
      <Route path="/san-pham" element={<DanhSachSanPham />} />
      <Route path="/san-pham/:sp_ma" element={<ChiTietSanPhamKhachHang />} />
      {/* 4. Các Layout chính (Có phân quyền bảo vệ bên trong) */}
      <Route path="/admin/*" element={<AdminRoutes />} />
      <Route path="/nguoi-ban/*" element={<ShopRoutes />} />
      <Route path="/dvvc/*" element={<DVVCRoutes />} />
      <Route path="/shipper/*" element={<ShipperRoutes />} /> {/* ← THÊM */}
      <Route path="/quan-ly-kho/*" element={<QuanLyKhoRoutes />} />
      <Route path="/khach-hang/*" element={<KhachHangRoutes />} />
      <Route path="/shop/:gh_ma" element={<ShopProfile />} />
      {/* 5. Trang báo lỗi 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;
