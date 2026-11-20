// backend/src/services/suco/suCoSlaService.js
// Quét SLA: 24h admin kết luận.
const cron = require('node-cron');
const SuCoModel = require('../../models/suco/suCoModel');
const SuCoThongBao = require('./suCoThongBao');

const NHAC_TOI_DA = 3;
const CACH_NHAU_GIO = 12;

const nhacKetLuan = async () => {
  const ds = await SuCoModel.layPhieuQuaHanKetLuan(50);
  let dem = 0;

  for (const phieu of ds) {
    if (Number(phieu.ycxlsc_nhac_lan || 0) >= NHAC_TOI_DA) continue;

    await SuCoModel.danhDauNhacKetLuan(phieu.ycxlsc_ma);
    await SuCoThongBao.gui({
      kieu: 'NHAC_KET_LUAN',
      phieu: { ycxlsc_ma: phieu.ycxlsc_ma },
      chi_admin: true,
    });
    dem += 1;
  }

  return dem;
};

const chayTatCa = async () => {
  try {
    const soKetLuan = await nhacKetLuan();
    if (soKetLuan) {
      console.log(`⏰ [SLA SỰ CỐ] Nhắc kết luận: ${soKetLuan}`);
    }
  } catch (error) {
    console.error('❌ [SLA SỰ CỐ] Lỗi quét SLA:', error.message);
  }
};

const start = () => {
  cron.schedule('*/10 * * * *', chayTatCa);
  setTimeout(chayTatCa, 20000);
  console.log('⏱️  SLA xử lý sự cố đã bật (mỗi 10 phút).');
};

module.exports = { start, chayTatCa, nhacKetLuan, NHAC_TOI_DA, CACH_NHAU_GIO };
