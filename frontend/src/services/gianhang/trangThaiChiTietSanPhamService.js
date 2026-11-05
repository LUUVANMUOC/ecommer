// src/services/gianhang/trangThaiChiTietSanPhamService.js
import axiosClient from "../../config/axiosClient";

const BASE = "/trang-thai-chi-tiet";

const trangThaiChiTietSanPhamService = {
    // Reference
    getAllTrangThai: () => axiosClient.get(BASE),

    // Seller
    submitForApproval: (ctsp_ma, yeucau) =>
        axiosClient.post(`${BASE}/gui-duyet`, { ctsp_ma, yeucau }),
    submitAllForApproval: (sp_ma) => 
        axiosClient.post(`${BASE}/gui-duyet-hang-loat`, { sp_ma }), 
    getByCtsp: (ctsp_ma) => axiosClient.get(`${BASE}/${ctsp_ma}/lichsu`),
    getLatestByCtsp: (ctsp_ma) => axiosClient.get(`${BASE}/${ctsp_ma}/latest`),

    // Admin
    getChoDuyet: () => axiosClient.get(`${BASE}/admin/cho-duyet`),
    getAllSanPham: () => axiosClient.get(`${BASE}/admin/tat-ca-san-pham`), // <-- MỚI
    approve: (ctsp_ma, phanhoi) =>
        axiosClient.post(`${BASE}/admin/${ctsp_ma}/duyet`, { phanhoi }),
    suspend: (ctsp_ma, phanhoi) =>
        axiosClient.post(`${BASE}/admin/${ctsp_ma}/dinh-chi`, { phanhoi }),
    
};

export default trangThaiChiTietSanPhamService;