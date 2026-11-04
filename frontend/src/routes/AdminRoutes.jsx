// src/routes/AdminRoutes.jsx
import { Routes, Route } from "react-router-dom"; // BẮT BUỘC PHẢI IMPORT THÊM ROUTES
import ProtectedRoute from "./ProtectedRoute";
import AdminDashboard from "../pages/admin/Dashboard";

import MaGiamGiaSanCRUD from "../pages/admin/MaGiamGiaSanCRUD";
import PhiChiecKhauCRUD from "../pages/admin/PhiChiecKhauCRUD";
import ThuongHieuCRUD from "../pages/admin/ThuongHieuCRUD";
import ThuocTinhSanPhamCRUD from "../pages/admin/ThuocTinhSanPhamCRUD"; // Đã sửa lỗi gõ chữ
import DuyetSanPham from "../pages/admin/DuyetSanPham"; // Đã sửa lỗi gõ chữ
import QuanLySanPhamAdmin from "../pages/admin/QuanLySanPhamAdmin";
import MaGiamGiaVanChuyenCRUD from "../pages/admin/MaGiamGiaVanChuyenCRUD";
import KienNghiAdmin from "../pages/admin/KienNghiAdmin";
import ThongTinSan from "../pages/admin/ThongTinSan";

const AdminRoutes = () => {
  return (
    // 1. BỌC TOÀN BỘ BẰNG <Routes>
    <Routes>
      {/* 2. Route bảo vệ (Kiểm tra quyền) */}
      <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
        {/* 3. Layout cha (Đường dẫn gốc /admin/...) */}
        <Route path="/" element={<AdminDashboard />}>
          {/* Trang mặc định khi vào /admin */}
          <Route
            index
            element={
              <div className="p-8 text-xl text-gray-500 bg-white rounded-xl shadow-sm">
                Chào mừng đến với hệ thống quản trị. Vui lòng chọn menu.
              </div>
            }
          />
          {/* Các trang con (Đường dẫn sẽ được ghép với /admin/) */}
          <Route path="ma-giam-gia-san" element={<MaGiamGiaSanCRUD />} />
          <Route
            path="ma-giam-gia-van-chuyen"
            element={<MaGiamGiaVanChuyenCRUD />}
          />
          <Route path="tra-loi-kien-nghi" element={<KienNghiAdmin />} />
          <Route path="phi-chiec-khau" element={<PhiChiecKhauCRUD />} />
          <Route path="thuong-hieu" element={<ThuongHieuCRUD />} />
          <Route
            path="thuoc-tinh-san-pham"
            element={<ThuocTinhSanPhamCRUD />}
          />
          <Route path="duyet-san-pham" element={<DuyetSanPham />} />{" "}
          {/* <-- Thêm dòng này */}
          {/* THÊM 2 ROUTE NÀY */}
          <Route path="quan-ly-san-pham" element={<QuanLySanPhamAdmin />} />
          <Route path="thong-tin-san" element={<ThongTinSan />} />
        </Route>
      </Route>
    </Routes>
  );
};

export default AdminRoutes;
