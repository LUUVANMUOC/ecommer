// src/routes/AdminRoutes.jsx
import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import AdminDashboard from "../pages/admin/Dashboard";
import QuanLyPhiVanChuyen from "../pages/admin/QuanLyPhiVanChuyen";
import ThongKeNganhHang from "../pages/admin/ThongKeNganhHang";
import HopThuThongBao from "../pages/common/HopThuThongBao";
import GuiThongBaoShop from "../pages/admin/GuiThongBaoShop";
import MaGiamGiaSanCRUD from "../pages/admin/MaGiamGiaSanCRUD";
import PhiChiecKhauCRUD from "../pages/admin/PhiChiecKhauCRUD";
import ThuongHieuCRUD from "../pages/admin/ThuongHieuCRUD";
import ThuocTinhSanPhamCRUD from "../pages/admin/ThuocTinhSanPhamCRUD";
import DuyetSanPham from "../pages/admin/DuyetSanPham";
import QuanLySanPhamAdmin from "../pages/admin/QuanLySanPhamAdmin";
import MaGiamGiaVanChuyenCRUD from "../pages/admin/MaGiamGiaVanChuyenCRUD";
import KienNghiAdmin from "../pages/admin/KienNghiAdmin";
import ThongTinSan from "../pages/admin/ThongTinSan";
import QuanLyDonHangAdmin from "../pages/admin/QuanLyDonHangAdmin";
import LichSuThanhToanVanChuyen from "../pages/admin/LichSuThanhToanVanChuyen";
import QuanLyDongTien from "../pages/admin/QuanLyDongTien";
import ThanhToanVanChuyen from "../pages/admin/ThanhToanVanChuyen";
import GiaoDienCRUD from "../pages/admin/GiaoDienCRUD";

const AdminRoutes = () => {
  return (
    <Routes>
      <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
        {/* Trang Giao diện: full màn hình, KHÔNG có sidebar/topbar Dashboard */}
        <Route path="giao-dien" element={<GiaoDienCRUD />} />

        <Route path="/" element={<AdminDashboard />}>
          <Route
            index
            element={
              <div className="p-8 text-xl text-gray-500 bg-white rounded-xl shadow-sm">
                Chào mừng đến với hệ thống quản trị. Vui lòng chọn menu.
              </div>
            }
          />
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
          <Route path="duyet-san-pham" element={<DuyetSanPham />} />
          <Route path="quan-ly-san-pham" element={<QuanLySanPhamAdmin />} />
          <Route path="thong-tin-san" element={<ThongTinSan />} />
          <Route path="quan-ly-don-hang" element={<QuanLyDonHangAdmin />} />

          <Route path="thong-ke-dong-tien" element={<QuanLyDongTien />} />
          <Route
            path="thanh-toan-van-chuyen"
            element={<ThanhToanVanChuyen />}
          />
          <Route
            path="lich-su-van-chuyen"
            element={<LichSuThanhToanVanChuyen />}
          />
          <Route path="thong-bao" element={<HopThuThongBao />} />
          <Route path="gui-thong-bao" element={<GuiThongBaoShop />} />
          {/* 2 route này phải nằm trong layout Dashboard để có sidebar */}
          <Route
            path="quan-ly-phi-van-chuyen"
            element={<QuanLyPhiVanChuyen />}
          />
          <Route path="thong-ke-nganh-hang" element={<ThongKeNganhHang />} />
        </Route>
      </Route>
    </Routes>
  );
};

export default AdminRoutes;
