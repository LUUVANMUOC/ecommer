// src/services/khachhang/thanhToanService.js
import axiosClient from "../../config/axiosClient";

const thanhToanService = {
  calculateShippingForShops: async (checkoutItems, selectedAddress) => {
    if (!selectedAddress || checkoutItems.length === 0) return [];

    const itemsByShop = checkoutItems.reduce((acc, item) => {
      if (!acc[item.gh_ma]) acc[item.gh_ma] = [];
      acc[item.gh_ma].push(item);
      return acc;
    }, {});

    const ordersData = [];

    for (const gh_ma of Object.keys(itemsByShop)) {
      const shopItems = itemsByShop[gh_ma];

      const itemsPayload = shopItems.map((item) => ({
        ctsp_ma: item.ctsp_ma,
        soluong: item.ctgh_soluong,
      }));

      const subTotal = shopItems.reduce(
        (sum, item) => sum + Number(item.ctsp_gianban) * item.ctgh_soluong,
        0,
      );

      const res = await axiosClient.post("/khach-hang/tinh-phi-ship", {
        gh_ma: gh_ma,
        xa_ma_nhan: selectedAddress.xa_ma,
        items: itemsPayload,
      });

      ordersData.push({
        gh_ma,
        gh_ten: shopItems[0].gh_ten,
        items: shopItems,
        subTotal,
        ...res.data, // ✅ Lấy toàn bộ object (shippingFee, dvvc_ma, klkh_ma, dc_layhangma)
      });
    }

    return ordersData;
  },
};

export default thanhToanService;