import axiosClient from "../../config/axiosClient";

const phiVanChuyenService = {
  // Lấy danh sách phí vận chuyển cho một ĐVVC cụ thể
  getDVVC: (dvvc_ma) => axiosClient.get(`/phi-van-chuyen/dvvc/${dvvc_ma}`),
};

export default phiVanChuyenService;