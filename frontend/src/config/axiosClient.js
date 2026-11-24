// src/config/axiosClient.js
import axios from 'axios';

const axiosClient = axios.create({
    // Đổi port hoặc URL theo backend của bạn
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api',
});

// Sự kiện để AuthRedirectHandler điều hướng mềm (không reload cả trang)
const AUTH_UNAUTHORIZED_EVENT = 'auth:unauthorized';

const redirectToLogin = (path) => {
    const event = new CustomEvent(AUTH_UNAUTHORIZED_EVENT, {
        detail: { path },
        cancelable: true,
    });
    window.dispatchEvent(event);

    // Fallback khi chưa có component nào lắng nghe (app chưa mount xong)
    if (!event.defaultPrevented) {
        window.location.replace(path);
    }
};

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
        // ✅ CHỈ đăng xuất khi request THỰC SỰ có gửi token.
        // Request công khai (không token) trả 401 không được phép xoá phiên đăng nhập.
        const hadAuth = Boolean(error.config?.headers?.Authorization);

        if (error.response && error.response.status === 401 && hadAuth) {
            const currentPath = window.location.pathname;
            
            // 1. Kiểm tra xem có đang ở trang đăng nhập/đăng ký không
            const isAuthPage = currentPath.includes('/login') || currentPath.includes('/register');

            // Nếu không phải trang login (tức là đang ở trang cần bảo vệ) thì mới xử lý đá văng
            if (!isAuthPage) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');

                // 2. Tự động nhận biết khu vực để điều hướng về đúng trang đăng nhập
                let loginPath = '/khach-hang/login';
                if (currentPath.includes('/nguoi-ban')) {
                    loginPath = '/nguoi-ban/login';
                } else if (currentPath.includes('/dvvc')) {
                    loginPath = '/dvvc/login';
                } else if (currentPath.includes('/shipper')) {
                    loginPath = '/shipper/login';
                } else if (currentPath.includes('/quan-ly-kho')) {
                    loginPath = '/quan-ly-kho/login';
                } else if (currentPath.includes('/admin')) {
                    loginPath = '/admin/login';
                }

                // Điều hướng mềm: giữ nguyên history của SPA thay vì reload cứng
                redirectToLogin(loginPath);
            }
            // Nếu đang ở trang login: Không làm gì cả, để trang Login tự hiển thị thông báo "Sai mật khẩu"
        }
        return Promise.reject(error);
    }
);

export default axiosClient;