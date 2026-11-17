// src/routes/KhachHangRoutes.jsx
import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import GioHang from "../pages/khachhang/GioHang";
import ThongTinCaNhan from "../pages/khachhang/ThongTinCaNhan"; // ✅ Thêm import này
import ThanhToan from "../pages/khachhang/ThanhToan";
import DanhGiaSanPham from "../pages/khachhang/DanhGiaSanPham";
import DatHangThanhCong from "../pages/khachhang/DatHangThanhCong"; // ✅ MỚI
import HopThuKhachHang from "../pages/khachhang/HopThuKhachHang";
import SuCoPage from "../pages/suco/SuCoPage";
import ChiTietSuCoPage from "../pages/suco/ChiTietSuCoPage";
const KhachHangRoutes = () => {
  return (
    <Routes>
      <Route element={<ProtectedRoute allowedRoles={["khachhang"]} />}>
        <Route path="gio-hang" element={<GioHang />} />

        {/* ✅ Thêm Route này */}
        <Route path="thong-tin-ca-nhan" element={<ThongTinCaNhan />} />
        <Route path="thanh-toan" element={<ThanhToan />} />
        <Route path="danh-gia/:dts_ma" element={<DanhGiaSanPham />} />
        {/* ✅ MỚI: trang xác nhận sau khi đặt hàng */}
        <Route path="dat-hang-thanh-cong" element={<DatHangThanhCong />} />
        <Route path="thong-bao" element={<HopThuKhachHang />} />
        <Route
          path="su-co"
          element={<SuCoPage vaiTro="khachhang" basePath="/khach-hang/su-co" />}
        />
        <Route
          path="su-co/:ycxlsc_ma"
          element={
            <ChiTietSuCoPage vaiTro="khachhang" basePath="/khach-hang/su-co" />
          }
        />
      </Route>
    </Routes>
  );
};

export default KhachHangRoutes;
