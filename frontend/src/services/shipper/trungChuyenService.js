import axiosClient from '../../config/axiosClient';

const shipperTrungChuyenService = {
  getDonDangTrungChuyen: (shipper_ma) => axiosClient.get(`/dvvc/shipper/trung-chuyen/dang-di-duong/${shipper_ma}`),
  giaoHangToiKho: (dts_ma, shipper_ma, formData) => 
    axiosClient.put(`/dvvc/shipper/trung-chuyen/${dts_ma}/giao-toi-kho/${shipper_ma}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
      getLichSu: (shipper_ma) => axiosClient.get(`/dvvc/shipper/trung-chuyen/lich-su/${shipper_ma}`),
};

export default shipperTrungChuyenService;