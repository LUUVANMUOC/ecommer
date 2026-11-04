import axiosClient from '../../config/axiosClient';

const qlkTaiChinhService = {
  getDonChuaNop: (kho_ma) => axiosClient.get(`/quan-ly-kho/thu-tien-shipper/${kho_ma}`),
  xacNhanThuTien: (ds_dts_ma) => axiosClient.post('/quan-ly-kho/thu-tien-shipper/xac-nhan', { ds_dts_ma }),
  
  getDuLieuTatToan: (kho_ma) => axiosClient.get(`/quan-ly-kho/tat-toan/${kho_ma}`),
  xacNhanTatToan: (data) => axiosClient.post('/quan-ly-kho/tat-toan', data),
  
  taoPhieuVaQr: (data) => axiosClient.post('/quan-ly-kho/tat-toan/tao-qr', data),
  getTrangThaiTatToan: (ptt_ma) => axiosClient.get(`/quan-ly-kho/tat-toan/trang-thai/${ptt_ma}`),
  huyPhieuTatToan: (ptt_ma) => axiosClient.delete(`/quan-ly-kho/tat-toan/huy/${ptt_ma}`), // 🟢 Đã thêm API Hủy
};

export default qlkTaiChinhService;