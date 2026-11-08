const DongTienModel = require('../../models/san/dongTienModel');

const DongTienService = {
  getDongTienAdmin: async () => {
    // Sau này có thể thêm logic tính tổng doanh thu ở đây
    return await DongTienModel.getDongTienAdmin();
  },

  getDongTienShop: async (gh_ma) => {
    // Sau này có thể thêm logic tính tổng tiền đã nhận của shop
    return await DongTienModel.getDongTienShop(gh_ma);
  }
};

module.exports = DongTienService;