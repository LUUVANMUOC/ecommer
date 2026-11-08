import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import QuanLyKhoDashboard from "../pages/quanlykho/Dashboard";

import QuanLyShipper from "../pages/quanlykho/QuanLyShipper";
import PhanCongShipper from "../pages/quanlykho/PhanCongShipper";
import GuiTrungChuyen from "../pages/quanlykho/GuiTrungChuyen";
import NhanTrungChuyen from "../pages/quanlykho/NhanTrungChuyen";
import PhanCongGiaoHang from "../pages/quanlykho/PhanCongGiaoHang";
import LichSuKho from "../pages/quanlykho/LichSuKho";
import ThuTienShipper from "../pages/quanlykho/ThuTienShipper";
import TatToan from "../pages/quanlykho/TatToan";

// Import file mới thay thế NhapKhoChoXacNhan
import QuanLyPhieuKho from "../pages/quanlykho/QuanLyPhieuKho";
import LichSuPhieuKho from "../pages/quanlykho/LichSuPhieuKho";
import ChiTietPhieuKho from "../pages/quanlykho/ChiTietPhieuKho";

const QuanLyKhoRoutes = () => {
  return (
    <Routes>
      <Route element={<ProtectedRoute allowedRoles={["quanlykho"]} />}>
        <Route path="/" element={<QuanLyKhoDashboard />}>
          <Route
            index
            element={
              <div className="p-8 text-center bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-100 text-indigo-600 mb-4">
                  <span className="material-symbols-outlined text-4xl">
                    warehouse
                  </span>
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                  Chào mừng đến với Kênh Quản Lý Kho!
                </h2>
                <p className="text-gray-500">
                  Vui lòng chọn chức năng từ thanh menu bên trái để bắt đầu.
                </p>
              </div>
            }
          />
          <Route path="quan-ly-shipper" element={<QuanLyShipper />} />
          <Route path="phan-cong-shipper" element={<PhanCongShipper />} />
          <Route path="gui-trung-chuyen" element={<GuiTrungChuyen />} />
          <Route path="nhan-trung-chuyen" element={<NhanTrungChuyen />} />
          <Route path="phan-cong-giao-hang" element={<PhanCongGiaoHang />} />
          <Route path="lich-su" element={<LichSuKho />} />
          <Route path="thu-tien-shipper" element={<ThuTienShipper />} />
          <Route path="tat-toan" element={<TatToan />} />

          {/* Route Phiếu Kho mới */}
          <Route path="phieu-kho" element={<QuanLyPhieuKho />} />
          <Route path="phieu-kho/lich-su" element={<LichSuPhieuKho />} />
          <Route path="phieu-kho/:pk_ma" element={<ChiTietPhieuKho />} />
        </Route>
      </Route>
    </Routes>
  );
};

export default QuanLyKhoRoutes;
