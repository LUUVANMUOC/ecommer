// src/routes/AuthRoutes.jsx
import { Route } from "react-router-dom";
import AdminLogin from "../pages/auth/admin/Login";
import AdminRegister from "../pages/auth/admin/Register";

// Nếu bạn có các trang login của Hotel, Restaurant, Tourist thì import vào đây:
// import HotelLogin from '../pages/auth/hotel/Login';
// ...

const AuthRoutes = () => {
  return (
    <>
      {/* --- ADMIN --- */}
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin/register" element={<AdminRegister />} />

      {/* --- NHÀ HÀNG --- */}
      {/* ... */}

      {/* --- KHU DU LỊCH --- */}
      {/* ... */}
    </>
  );
};

// DÒNG NÀY RẤT QUAN TRỌNG ĐỂ SỬA LỖI CỦA BẠN
export default AuthRoutes;
