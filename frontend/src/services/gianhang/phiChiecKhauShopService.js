import axiosClient from "../../config/axiosClient";

const phiChiecKhauShopService = {
  get: (gh_ma, stmdt_ma) =>
    axiosClient.get(`/nguoi-ban/phi-chiet-khau/${gh_ma}`, {
      params: stmdt_ma ? { stmdt_ma } : undefined,
    }),
};

export default phiChiecKhauShopService;
