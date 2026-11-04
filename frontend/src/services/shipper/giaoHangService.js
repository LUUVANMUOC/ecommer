import axiosClient from '../../config/axiosClient';

const giaoHangService = {
  getDonCanGiao: (shipper_ma) => axiosClient.get(`/dvvc/shipper/giao-hang/can-giao/${shipper_ma}`),
  giaoHang: (dts_ma, shipper_ma, formData) => 
    axiosClient.put(`/dvvc/shipper/giao-hang/${dts_ma}/giao-hang/${shipper_ma}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
      getLichSu: (shipper_ma) => axiosClient.get(`/dvvc/shipper/giao-hang/lich-su/${shipper_ma}`),
};

export default giaoHangService;