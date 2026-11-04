const GianHangKienNghiModel = require('../../models/san/gianHangKienNghiModel');

const GianHangKienNghiService = {
  getByShop: async (gh_ma) => await GianHangKienNghiModel.getByShop(gh_ma),
  
  getAllForSan: async () => await GianHangKienNghiModel.getAllForSan(),

  create: async (data) => {
    let newMa = 'KN001';
    const latest = await GianHangKienNghiModel.getLatestMa();
    if (latest) {
      const num = parseInt(latest.substring(2), 10) + 1;
      newMa = 'KN' + num.toString().padStart(3, '0');
    }
    data.ghkn_ma = newMa;
    return await GianHangKienNghiModel.create(data);
  },

  reply: async (id, phanhoi) => {
    if (!phanhoi || phanhoi.trim() === '') throw new Error("Nội dung phản hồi không được để trống!");
    return await GianHangKienNghiModel.reply(id, phanhoi);
  }
};

module.exports = GianHangKienNghiService;