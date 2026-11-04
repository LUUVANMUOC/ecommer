// src/routes/DVVCRoutes.jsx (Lưu ý: Đổi tên file cho đúng với component)
import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import DVVCDashboard from "../pages/dvvc/Dashboard";
import BangGiaVanChuyen from "../pages/dvvc/BangGiaVanChuyen";
import ThongTinDVVC from "../pages/dvvc/ThongTinDVVC";
import QuanLyKho from "../pages/dvvc/QuanLyKho";
import QuanLyShipper from "../pages/dvvc/QuanLyShipper";
import PhanCongShipper from "../pages/dvvc/PhanCongShipper";
import TheoDoiDonHang from "../pages/dvvc/TheoDoiDonHang";

// Thêm vào <Routes>

const DVVCRoutes = () => {
  return (
    <Routes>
      <Route element={<ProtectedRoute allowedRoles={["dvvc"]} />}>
        {/* DashboardLayout sẽ render thanh menu bên trái và thẻ <Outlet /> ở bên phải */}
        <Route path="/" element={<DVVCDashboard />}>
          {/* Trang mặc định khi vào /dvvc */}
          <Route
            index
            element={
              <div className="p-8 text-center text-gray-500 bg-white rounded-xl shadow-sm border border-gray-100">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                  Chào mừng đến với Kênh Đơn Vị Vận Chuyển!
                </h2>
                <p>
                  Vui lòng chọn chức năng từ thanh menu bên trái để bắt đầu quản
                  lý đơn vị vận chuyển.
                </p>
              </div>
            }
          />

          {/* ✅ ĐÃ DI CHUYỂN VÀO TRONG NÀY ĐỂ CÓ SIDEBAR */}
          <Route path="bang-gia-van-chuyen" element={<BangGiaVanChuyen />} />
          <Route path="thong-tin" element={<ThongTinDVVC />} />
          <Route path="quan-ly-kho" element={<QuanLyKho />} />
          <Route path="quan-ly-shipper" element={<QuanLyShipper />} />
          <Route path="phan-cong-shipper" element={<PhanCongShipper />} />
          <Route path="theo-doi-don-hang" element={<TheoDoiDonHang />} />
        </Route>
      </Route>
    </Routes>
  );
};

export default DVVCRoutes;
