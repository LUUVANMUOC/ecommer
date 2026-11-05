// src/pages/shipper/constants.js

export const LSP_UI_CONFIG = {
  LSP01: {
    icon: 'inventory_2',
    color: '#16a34a',
    theme: {
      sidebarBg: '#1e293b',
      sidebarText: '#e2e8f0',
      menuHoverBg: '#334155',
      menuActiveBg: '#16a34a',
      menuActiveText: '#ffffff',
      borderColor: '#334155',
      logoutBtnColor: '#ef4444',
    },
    menuItems: [
      { title: 'Trang chủ', path: '/shipper' },
      { title: 'Đơn chờ lấy', path: '/shipper/don-cho-lay' },
      { title: 'Tài khoản', path: '/shipper/tai-khoan' }, // 🟢 Thêm menu Tài khoản
    ],
  },
  LSP02: {
    icon: 'local_shipping',
    color: '#ea580c',
    theme: {
      sidebarBg: '#1e293b',
      sidebarText: '#e2e8f0',
      menuHoverBg: '#334155',
      menuActiveBg: '#ea580c',
      menuActiveText: '#ffffff',
      borderColor: '#334155',
      logoutBtnColor: '#ef4444',
    },
    menuItems: [
      { title: 'Trang chủ', path: '/shipper' },
      { title: 'Đơn trung chuyển', path: '/shipper/trung-chuyen' },
      { title: 'Tài khoản', path: '/shipper/tai-khoan' }, // 🟢 Thêm menu Tài khoản
    ],
  },
  LSP03: {
    icon: 'delivery_dining',
    color: '#2563eb',
    theme: {
      sidebarBg: '#1e293b',
      sidebarText: '#e2e8f0',
      menuHoverBg: '#334155',
      menuActiveBg: '#2563eb',
      menuActiveText: '#ffffff',
      borderColor: '#334155',
      logoutBtnColor: '#ef4444',
    },
    menuItems: [
      { title: 'Trang chủ', path: '/shipper' },
      { title: 'Đơn cần giao', path: '/shipper/giao-hang' },
      { title: 'Tài khoản', path: '/shipper/tai-khoan' }, // 🟢 Thêm menu Tài khoản
    ],
  },
};

// Fallback an toàn khi lsp_ma lạ (chưa cấu hình UI)
const FALLBACK_CONFIG = {
  icon: 'badge',
  color: '#6b7280',
  theme: {
    sidebarBg: '#1e293b',
    sidebarText: '#e2e8f0',
    menuHoverBg: '#334155',
    menuActiveBg: '#6b7280',
    menuActiveText: '#ffffff',
    borderColor: '#334155',
    logoutBtnColor: '#ef4444',
  },
  menuItems: [
    { title: 'Trang chủ', path: '/shipper' },
    { title: 'Tài khoản', path: '/shipper/tai-khoan' }, // Fallback cũng có Tài khoản
  ],
};

export const getLSPUIConfig = (lsp_ma) =>
  LSP_UI_CONFIG[lsp_ma] || FALLBACK_CONFIG;

// Mapping lsp_ma → route path (dùng cho ShipperRoutes guard nếu cần)
export const LSP_ROUTE_MAP = {
  LSP01: '/shipper/don-cho-lay',
  LSP02: '/shipper/trung-chuyen',
  LSP03: '/shipper/giao-hang',
};