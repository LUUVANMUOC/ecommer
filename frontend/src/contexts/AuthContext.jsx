import { createContext, useState, useEffect } from "react";
import { authService as sanAuthService } from "../services/san/authService";
import axiosClient from "../config/axiosClient";
import khachHangService from "../services/khachhang/authService";
import shipperAuthService from "../services/shipper/authService"; // ← THÊM
import quanLyKhoAuthService from "../services/quanlykho/authService";
export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Tự động khôi phục trạng thái đăng nhập khi F5
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser && storedUser !== "undefined") {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
      }
    }
    setLoading(false);
  }, []);

  // ==========================================
  // 1. ADMIN
  // ==========================================
  const loginAdmin = async (email, password) => {
    try {
      const response = await sanAuthService.loginAdmin({
        STMDT_Email: email,
        password: password,
      });

      const { token, user: userData } = response.data;
      const finalUser = { ...userData, role: "admin" };

      if (token) localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(finalUser));
      setUser(finalUser);

      return finalUser;
    } catch (error) {
      console.error("Lỗi đăng nhập Admin:", error);
      throw error;
    }
  };

  // ==========================================
  // 2. NGƯỜI BÁN (SHOP)
  // ==========================================
  const loginShop = async (email, password) => {
    try {
      const response = await axiosClient.post("/nguoi-ban/auth/login", {
        gh_email: email,
        password: password,
      });

      const { token, user: userData } = response.data;
      const finalUser = { ...userData, role: "shop" };

      if (token) localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(finalUser));
      setUser(finalUser);

      return finalUser;
    } catch (error) {
      console.error("Lỗi đăng nhập Shop:", error);
      throw error;
    }
  };

  const registerShop = async (formData) => {
    try {
      const response = await axiosClient.post(
        "/nguoi-ban/auth/register",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
      );
      return response.data;
    } catch (error) {
      console.error("Lỗi đăng ký Shop:", error);
      throw error;
    }
  };

  // ==========================================
  // 3. ĐƠN VỊ VẬN CHUYỂN (DVVC)
  // ==========================================
  const loginDVVC = async (email, password) => {
    try {
      const response = await axiosClient.post("/dvvc/auth/login", {
        email: email,
        password: password,
      });

      const { token, user: userData } = response.data;
      const finalUser = { ...userData, role: "dvvc" };

      if (token) localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(finalUser));
      setUser(finalUser);

      return finalUser;
    } catch (error) {
      console.error("Lỗi đăng nhập DVVC:", error);
      throw error;
    }
  };

  const registerDVVC = async (formData) => {
    try {
      const response = await axiosClient.post("/dvvc/auth/register", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data;
    } catch (error) {
      console.error("Lỗi đăng ký DVVC:", error);
      throw error;
    }
  };

  // ==========================================
  // 4. SHIPPER                                                       ← THÊM
  // ==========================================
  const loginShipper = async (sdt, password) => {
    // ← THÊM
    try {
      // ← THÊM
      const response = await shipperAuthService.login({ sdt, password });

      const { token, user: userData } = response.data;
      const finalUser = { ...userData, role: "shipper" };

      if (token) localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(finalUser));
      setUser(finalUser);

      return finalUser;
    } catch (error) {
      console.error("Lỗi đăng nhập Shipper:", error);
      throw error;
    }
  };
  // ==========================================
  // 5. QUẢN LÝ KHO
  // ==========================================
  const loginQuanLyKho = async (kho_ma, password) => {
    try {
      const response = await quanLyKhoAuthService.login({ kho_ma, password });
      const { token, user: userData } = response.data;
      const finalUser = { ...userData, role: "quanlykho" };

      if (token) localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(finalUser));
      setUser(finalUser);

      return finalUser;
    } catch (error) {
      console.error("Lỗi đăng nhập Quản lý kho:", error);
      throw error;
    }
  };

  // ==========================================
  // 5. KHÁCH HÀNG
  // ==========================================
  const loginKhachHang = async (email, password) => {
    try {
      const response = await khachHangService.login({ email, password });
      const { token, user: userData } = response.data;
      const finalUser = { ...userData, role: "khachhang" };

      if (token) localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(finalUser));
      setUser(finalUser);

      return finalUser;
    } catch (error) {
      console.error("Lỗi đăng nhập Khách hàng:", error);
      throw error;
    }
  };

  const registerKhachHang = async (data) => {
    try {
      const response = await khachHangService.register(data);
      return response.data;
    } catch (error) {
      console.error("Lỗi đăng ký Khách hàng:", error);
      throw error;
    }
  };

  // ==========================================
  // 6. ĐĂNG XUẤT
  // ==========================================
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loginAdmin,
        loginShop,
        registerShop,
        loginDVVC,
        registerDVVC,
        loginKhachHang,
        registerKhachHang,
        loginShipper, // ← THÊM
        loginQuanLyKho, // ← THÊM

        logout,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
