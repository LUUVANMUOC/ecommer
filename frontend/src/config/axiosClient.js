// src/config/axiosClient.js
import axios from 'axios';

const axiosClient = axios.create({
    // Đổi port hoặc URL theo backend của bạn
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api',
});

// Tự động gắn Token vào header nếu có
axiosClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Xử lý lỗi 401 (Hết hạn token hoặc sai mật khẩu)
axiosClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            const currentPath = window.location.pathname;
            
            // 1. Kiểm tra xem có đang ở trang đăng nhập/đăng ký không
            const isAuthPage = currentPath.includes('/login') || currentPath.includes('/register');

            // Nếu không phải trang login (tức là đang ở trang cần bảo vệ) thì mới xử lý đá văng
            if (!isAuthPage) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');

                // 2. Tự động nhận biết khu vực để điều hướng về đúng trang đăng nhập
                if (currentPath.includes('/nguoi-ban')) {
                    window.location.href = '/nguoi-ban/login';
                } else if (currentPath.includes('/dvvc')) {
                    window.location.href = '/dvvc/login'; 
                } else if (currentPath.includes('/shipper')) {          // ← THÊM
                    window.location.href = '/shipper/login';            // ← THÊM
                }
                else if (currentPath.includes('/quan-ly-kho')) {     // ← THÊM
                    window.location.href = '/quan-ly-kho/login';       // ← THÊM
                } else if (currentPath.includes('/admin')) {
                    window.location.href = '/admin/login';
                } else {
                    // 3. Fallback: Dành cho Khách hàng hoặc các trang public (như /san-pham)
                    window.location.href = '/khach-hang/login';
                }
            }
            // Nếu đang ở trang login: Không làm gì cả, để trang Login tự hiển thị thông báo "Sai mật khẩu"
        }
        return Promise.reject(error);
    }
);

export default axiosClient;