import axiosClient from '../../config/axiosClient';

const shipperDonHangService = {
  // 1. Lấy danh sách đơn đang chờ lấy (Tab Đang xử lý)
  getChoLay: (shipper_ma) => axiosClient.get(`/dvvc/shipper/don-hang/cho-lay/${shipper_ma}`),

  // 2. Xác nhận lấy hàng (Upload ảnh + Ghi chú)
  layHang: (dts_ma, shipper_ma, formData) =>
    axiosClient.put(`/dvvc/shipper/don-hang/${dts_ma}/lay-hang/${shipper_ma}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  // 3. Lấy lịch sử các đơn đã lấy thành công (Tab Lịch sử)
  getLichSu: (shipper_ma) => axiosClient.get(`/dvvc/shipper/don-hang/lich-su/${shipper_ma}`),};

export default shipperDonHangService;