// src/routes/KhachHangRoutes.jsx
import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import GioHang from "../pages/khachhang/GioHang";
import ThongTinCaNhan from "../pages/khachhang/ThongTinCaNhan"; // ✅ Thêm import này
import ThanhToan from "../pages/khachhang/ThanhToan";
import DanhGiaSanPham from "../pages/khachhang/DanhGiaSanPham";
import HopThuKhachHang from "../pages/khachhang/HopThuKhachHang";
const KhachHangRoutes = () => {
  return (
    <Routes>
      <Route element={<ProtectedRoute allowedRoles={["khachhang"]} />}>
        <Route path="gio-hang" element={<GioHang />} />

        {/* ✅ Thêm Route này */}
        <Route path="thong-tin-ca-nhan" element={<ThongTinCaNhan />} />
        <Route path="thanh-toan" element={<ThanhToan />} />
        <Route path="danh-gia/:dts_ma" element={<DanhGiaSanPham />} />
        <Route path="thong-bao" element={<HopThuKhachHang />} />
      </Route>
    </Routes>
  );
};

export default KhachHangRoutes;
