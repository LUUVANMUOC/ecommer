import axiosClient from '../../config/axiosClient';

const theoDoiService = {
  getDanhSach: (dvvc_ma, params) => axiosClient.get(`/dvvc/theo-doi/${dvvc_ma}`, { params }),
  getChiTiet: (dts_ma) => axiosClient.get(`/dvvc/theo-doi/chi-tiet/${dts_ma}`),
};

export default theoDoiService;