// src/routes/ShopRoutes.jsx
import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import ShopDashboard from "../pages/shop/Dashboard";
import ThongTinCuaHang from "../pages/shop/ThongTinCuaHang";
import DanhMucSanPhamCRUD from "../pages/shop/DanhMucSanPhamCRUD";
import QuanLySanPham from "../pages/shop/QuanLySanPham";
import ChiTietSanPham from "../pages/shop/ChiTietSanPham";
import CapNhatChiTietSanPham from "../pages/shop/CapNhatChiTietSanPham";
import MaGiamGiaShopCRUD from "../pages/shop/MaGiamGiaShopCRUD";
import KienNghiShop from "../pages/shop/KienNghiShop";
import QuanLyVanChuyen from "../pages/shop/QuanLyVanChuyen";
import QuanLyDonHang from "../pages/shop/QuanLyDonHang";

// 🟢 Thêm import trang lịch sử dòng tiền của Shop
import LichSuDongTien from "../pages/shop/LichSuDongTien";

const ShopRoutes = () => {
  return (
    <Routes>
      <Route element={<ProtectedRoute allowedRoles={["shop"]} />}>
        <Route path="/" element={<ShopDashboard />}>
          <Route
            index
            element={
              <div className="p-8 text-center text-gray-500 bg-white rounded-xl shadow-sm border border-gray-100">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                  Chào mừng đến với Kênh Người Bán!
                </h2>
                <p>
                  Vui lòng chọn chức năng từ thanh menu bên trái để bắt đầu quản
                  lý gian hàng.
                </p>
              </div>
            }
          />

          <Route path="thong-tin-cua-hang" element={<ThongTinCuaHang />} />
          <Route path="danh-muc-san-pham" element={<DanhMucSanPhamCRUD />} />
          <Route path="ma-giam-gia-shop" element={<MaGiamGiaShopCRUD />} />
          <Route path="gui-kien-nghi" element={<KienNghiShop />} />
          <Route path="van-chuyen" element={<QuanLyVanChuyen />} />

          {/* Quản lý sản phẩm: danh sách → chi tiết → cập nhật phân loại */}
          <Route path="quan-ly-san-pham" element={<QuanLySanPham />} />
          <Route path="quan-ly-san-pham/:sp_ma" element={<ChiTietSanPham />} />
          <Route
            path="quan-ly-san-pham/:sp_ma/phan-loai/moi"
            element={<CapNhatChiTietSanPham />}
          />
          <Route path="quan-ly-don-hang" element={<QuanLyDonHang />} />
          <Route
            path="quan-ly-san-pham/:sp_ma/phan-loai/:ctsp_ma/sua"
            element={<CapNhatChiTietSanPham />}
          />

          {/* 🟢 Thêm Route cho trang Lịch sử nhận tiền */}
          <Route path="lich-su-dong-tien" element={<LichSuDongTien />} />
        </Route>
      </Route>
    </Routes>
  );
};

export default ShopRoutes;
