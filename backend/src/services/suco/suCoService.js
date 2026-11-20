// backend/src/services/suco/suCoService.js
const SuCoModel = require('../../models/suco/suCoModel');
const SuCoThanhToanModel = require('../../models/suco/suCoThanhToanModel');

const loi = (message, status = 400) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

const chuoi = (v) => (typeof v === 'string' ? v.trim() : '');
const so = (v, macDinh = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : macDinh;
};

const CT_HOP_LE = new Set(['CT02', 'CT03', 'CT04', 'CT05']);
const CHU_THE_HOP_LE = new Set(['CT01', 'CT02', 'CT03', 'CT04', 'CT05']);
const HUONG_XU_LY = new Set(['KHONG_DEN', 'HOAN_TIEN', 'BOI_THUONG', 'KHAC']);
const HUONG_CAN_CHI = new Set(['HOAN_TIEN', 'BOI_THUONG']);
const VAI_TRO = new Set(['CHIU_TRACH_NHIEM', 'BI_ANH_HUONG']);
const DANG_MO = new Set(['TTXLSC01', 'TTXLSC02', 'TTXLSC03']);
const DA_DONG = new Set(['TTXLSC05', 'TTXLSC06', 'TTXLSC07']);

const CHUYEN = {
  TTXLSC01: ['TTXLSC02', 'TTXLSC07'],
  TTXLSC02: ['TTXLSC03', 'TTXLSC04', 'TTXLSC06'],
  TTXLSC03: ['TTXLSC02', 'TTXLSC04', 'TTXLSC06'],
  TTXLSC04: ['TTXLSC05'],
};

const COT_LIEN_QUAN = {
  CT02: 'gh_ma',
  CT03: 'dvvc_ma',
  CT04: 'kh_ma',
  CT05: 'shipper_ma',
};

const laLienQuan = (don, ct_ma, ma) => {
  if (!don || !ma) return false;
  if (ct_ma === 'CT01') return true;
  const cot = COT_LIEN_QUAN[ct_ma];
  if (!cot) return false;
  return String(don[cot] || '') === String(ma);
};

const batBuocLienQuan = (don, ct_ma, ma) => {
  if (!laLienQuan(don, ct_ma, ma)) {
    throw loi('Bạn không có quyền với đơn hàng này.', 403);
  }
};

const kiemTraChuyen = (tu, den) => {
  if (tu === den) return;
  const ds = CHUYEN[tu] || [];
  if (!ds.includes(den)) {
    throw loi(`Không thể chuyển từ ${tu} sang ${den}.`);
  }
};

// Hook thông báo — lỗi không làm hỏng nghiệp vụ
const bao = (payload) => {
  Promise.resolve()
    .then(() => require('./suCoThongBao').gui(payload))
    .catch(() => {});
};

const chuanHoaTep = (dsTep = []) =>
  (Array.isArray(dsTep) ? dsTep : [])
    .map((t) => ({
      loai: ['IMAGE', 'VIDEO', 'PDF'].includes(t.loai) ? t.loai : 'IMAGE',
      ten: chuoi(t.ten) || 'Minh chứng',
      mota: chuoi(t.mota),
      duongdan: chuoi(t.duongdan),
      kichthuoc: so(t.kichthuoc),
    }))
    .filter((t) => t.duongdan);

// ---------- Danh mục ----------
const layLoaiSuCo = async (ct_ma) => {
  const ma = chuoi(ct_ma).toUpperCase();
  if (ma !== 'CT01' && !CT_HOP_LE.has(ma)) {
    throw loi('Loại chủ thể không hợp lệ.');
  }
  return SuCoModel.layLoaiSuCo(ma);
};

const layTrangThai = () => SuCoModel.layTrangThai();

// ---------- Đơn hàng ----------
const layDonHang = async (dts_ma, ct_ma, ma_nguoi_gui) => {
  const ma = chuoi(dts_ma);
  if (!ma) throw loi('Thiếu mã đơn hàng.');
  const don = await SuCoModel.layDonHang(ma);
  if (!don) throw loi('Không tìm thấy đơn hàng.', 404);
  batBuocLienQuan(don, ct_ma, ma_nguoi_gui);
  return don;
};

// ---------- Tạo phiếu ----------
const taoPhieu = async (duLieu = {}, dsTep = []) => {
  const dts_ma = chuoi(duLieu.dts_ma);
  const ct_ma = chuoi(duLieu.ct_ma_denghi).toUpperCase();
  const ma_nguoi_gui = chuoi(duLieu.ma_nguoi_gui);
  const lsc_ma = chuoi(duLieu.lsc_ma).toUpperCase();
  const ycxlsc_ten = chuoi(duLieu.ycxlsc_ten);
  const ycxlsc_denghi = chuoi(duLieu.ycxlsc_denghi);
  const ycxlsc_mota = chuoi(duLieu.ycxlsc_mota);

  if (!dts_ma) throw loi('Thiếu mã đơn hàng.');
  if (!CT_HOP_LE.has(ct_ma)) throw loi('Loại chủ thể không hợp lệ.');
  if (!ma_nguoi_gui) throw loi('Thiếu mã người gửi.');
  if (!lsc_ma) throw loi('Chưa chọn loại sự cố.');
  if (!ycxlsc_ten) throw loi('Thiếu tiêu đề sự cố.');
  if (ycxlsc_ten.length > 50) throw loi('Tiêu đề tối đa 50 ký tự.');
  if (!ycxlsc_denghi) throw loi('Thiếu đề nghị xử lý.');
  if (!ycxlsc_mota) throw loi('Thiếu mô tả sự cố.');

  const don = await SuCoModel.layDonHang(dts_ma);
  if (!don) throw loi('Không tìm thấy đơn hàng.', 404);
  batBuocLienQuan(don, ct_ma, ma_nguoi_gui);

  const dsLoai = await SuCoModel.layLoaiSuCo(ct_ma);
  if (!dsLoai.some((x) => x.lsc_ma === lsc_ma)) {
    throw loi('Loại sự cố không phù hợp với vai trò của bạn.');
  }

  // Cho phép báo sự cố ở mọi trạng thái đơn hàng (kể cả đơn đang xử lý,
  // đang giao trễ, đã hủy...). Chỉ chặn gửi trùng phiếu còn mở bên dưới.

  const trung = await SuCoModel.demPhieuDangMo(
    dts_ma,
    lsc_ma,
    ct_ma,
    ma_nguoi_gui
  );
  if (trung > 0) {
    throw loi('Bạn đã gửi phiếu tương tự cho đơn này.');
  }

  const tep = chuanHoaTep(dsTep).map((t) => ({
    ...t,
    ct_ma,
    ma_nguoi_gui,
  }));

  const ketQua = await SuCoModel.taoPhieu(
    {
      dts_ma,
      ct_ma_denghi: ct_ma,
      ma_nguoi_gui,
      lsc_ma,
      ycxlsc_ten,
      ycxlsc_denghi,
      ycxlsc_mota,
      so_tien_shop: so(don.so_tien_shop),
    },
    tep
  );

  bao({ kieu: 'TAO', phieu: ketQua, don, ct_ma, ma_nguoi_gui });

  return ketQua;
};

// ---------- Danh sách ----------
const layDanhSach = async (boLoc = {}, nguoiDung = {}) => {
  const ct_ma = chuoi(nguoiDung.ct_ma || boLoc.ct_ma).toUpperCase();
  const ma_nguoi_gui = chuoi(nguoiDung.ma || boLoc.ma_nguoi_gui);
  const admin = ct_ma === 'CT01';

  if (!admin && !CT_HOP_LE.has(ct_ma)) {
    throw loi('Loại chủ thể không hợp lệ.');
  }
  if (!admin && !ma_nguoi_gui) {
    throw loi('Thiếu mã người dùng.');
  }

  return SuCoModel.layDanhSach({
    ...boLoc,
    ct_ma,
    ma_nguoi_gui,
    admin,
  });
};

// ---------- Chi tiết ----------
const layChiTiet = async (ycxlsc_ma, nguoiDung = {}) => {
  const ma = chuoi(ycxlsc_ma);
  if (!ma) throw loi('Thiếu mã phiếu.');

  const chiTiet = await SuCoModel.layChiTiet(ma);
  if (!chiTiet) throw loi('Không tìm thấy phiếu sự cố.', 404);

  const ct_ma = chuoi(nguoiDung.ct_ma).toUpperCase();
  const ma_nguoi = chuoi(nguoiDung.ma);

  if (ct_ma && ct_ma !== 'CT01') {
    batBuocLienQuan(chiTiet.don, ct_ma, ma_nguoi);
  }

  return chiTiet;
};

// ---------- Bổ sung minh chứng ----------
const themMinhChung = async (ycxlsc_ma, dsTep = [], nguoiDung = {}) => {
  const phieu = await SuCoModel.layPhieuGon(chuoi(ycxlsc_ma));
  if (!phieu) throw loi('Không tìm thấy phiếu sự cố.', 404);

  if (DA_DONG.has(phieu.ycxlsc_trang_thai)) {
    throw loi('Phiếu đã đóng, không thể bổ sung minh chứng.');
  }

  const ct_ma = chuoi(nguoiDung.ct_ma).toUpperCase();
  const ma_nguoi = chuoi(nguoiDung.ma);

  if (ct_ma && ct_ma !== 'CT01') {
    const don = await SuCoModel.layDonHang(phieu.dts_ma);
    batBuocLienQuan(don, ct_ma, ma_nguoi);
  }

  const tep = chuanHoaTep(dsTep).map((t) => ({
    ...t,
    ct_ma,
    ma_nguoi_gui: ma_nguoi,
  }));

  if (!tep.length) throw loi('Chưa có tệp hợp lệ.');

  const dem = await SuCoModel.themMinhChung(phieu.ycxlsc_ma, tep);
  return { ycxlsc_ma: phieu.ycxlsc_ma, so_tep: dem };
};

// ---------- Hủy phiếu ----------
const huy = async (ycxlsc_ma, nguoiDung = {}, ly_do = '') => {
  const phieu = await SuCoModel.layPhieuGon(chuoi(ycxlsc_ma));
  if (!phieu) throw loi('Không tìm thấy phiếu sự cố.', 404);

  const ct_ma = chuoi(nguoiDung.ct_ma).toUpperCase();
  const ma_nguoi = chuoi(nguoiDung.ma);

  if (ct_ma !== 'CT01') {
    if (
      phieu.ct_ma_denghi !== ct_ma ||
      String(phieu.ycxlsc_ma_nguoi_gui) !== String(ma_nguoi)
    ) {
      throw loi('Chỉ người gửi mới được hủy phiếu.', 403);
    }
  }

  kiemTraChuyen(phieu.ycxlsc_trang_thai, 'TTXLSC07');

  const ketQua = await SuCoModel.chuyenTrangThai({
    ycxlsc_ma: phieu.ycxlsc_ma,
    trang_thai: 'TTXLSC07',
    ct_ma,
    nguoi: ma_nguoi,
    ghichu: chuoi(ly_do) || 'Người gửi hủy phiếu',
  });

  bao({ kieu: 'DOI_TRANG_THAI', phieu: ketQua, ct_ma, ma_nguoi_gui: ma_nguoi });
  return ketQua;
};

// ---------- Admin: tiếp nhận ----------
const tiepNhan = async (ycxlsc_ma, nguoiDuyet, ghichu = '') => {
  const phieu = await SuCoModel.layPhieuGon(chuoi(ycxlsc_ma));
  if (!phieu) throw loi('Không tìm thấy phiếu sự cố.', 404);

  kiemTraChuyen(phieu.ycxlsc_trang_thai, 'TTXLSC02');

  const ketQua = await SuCoModel.chuyenTrangThai({
    ycxlsc_ma: phieu.ycxlsc_ma,
    trang_thai: 'TTXLSC02',
    ct_ma: 'CT01',
    nguoi: nguoiDuyet,
    ghichu: chuoi(ghichu) || 'Admin tiếp nhận',
  });

  bao({ kieu: 'DOI_TRANG_THAI', phieu: ketQua });
  return ketQua;
};

// ---------- Admin: yêu cầu bổ sung ----------
const yeuCauBoSung = async (ycxlsc_ma, nguoiDuyet, ghichu = '') => {
  const phieu = await SuCoModel.layPhieuGon(chuoi(ycxlsc_ma));
  if (!phieu) throw loi('Không tìm thấy phiếu sự cố.', 404);

  kiemTraChuyen(phieu.ycxlsc_trang_thai, 'TTXLSC03');

  const ketQua = await SuCoModel.chuyenTrangThai({
    ycxlsc_ma: phieu.ycxlsc_ma,
    trang_thai: 'TTXLSC03',
    ct_ma: 'CT01',
    nguoi: nguoiDuyet,
    ghichu: chuoi(ghichu) || 'Yêu cầu bổ sung minh chứng',
  });

  bao({ kieu: 'DOI_TRANG_THAI', phieu: ketQua });
  return ketQua;
};

// ---------- Admin: kết luận ----------
const ketLuan = async (ycxlsc_ma, duLieu = {}, nguoiDuyet) => {
  const phieu = await SuCoModel.layPhieuGon(chuoi(ycxlsc_ma));
  if (!phieu) throw loi('Không tìm thấy phiếu sự cố.', 404);

  // Chỉ kết luận khi phiếu còn đang xử lý. Chặn bấm lặp / mở 2 tab
  // để không tạo trùng khoản chi và ghi đè trách nhiệm.
  if (!['TTXLSC02', 'TTXLSC03'].includes(phieu.ycxlsc_trang_thai)) {
    throw loi(
      'Chỉ có thể ghi kết luận khi phiếu đang xem xét hoặc đang chờ bổ sung.',
      409
    );
  }

  const ket_luan = chuoi(duLieu.ket_luan);
  const huong_xu_ly = chuoi(duLieu.huong_xu_ly).toUpperCase();

  if (!ket_luan) throw loi('Thiếu nội dung kết luận.');
  if (!HUONG_XU_LY.has(huong_xu_ly)) throw loi('Hướng xử lý không hợp lệ.');

  const dsTrachNhiem = (Array.isArray(duLieu.trach_nhiem)
    ? duLieu.trach_nhiem
    : []
  ).map((t) => {
    const vai_tro = chuoi(t.vai_tro).toUpperCase();
    const ct_ma = chuoi(t.ct_ma).toUpperCase();
    if (!VAI_TRO.has(vai_tro)) throw loi('Vai trò trách nhiệm không hợp lệ.');
    if (!CHU_THE_HOP_LE.has(ct_ma)) throw loi('Chủ thể trách nhiệm không hợp lệ.');

    const phan_tram = so(t.phan_tram);
    const so_tien = so(t.so_tien);

    if (phan_tram < 0 || phan_tram > 100) {
      throw loi('Tỷ lệ trách nhiệm phải trong khoảng 0 - 100%.');
    }
    if (so_tien < 0) throw loi('Số tiền trách nhiệm không hợp lệ.');

    return {
      ct_ma,
      vai_tro,
      phan_tram,
      so_tien,
    };
  });

  let dsHoanTien = (Array.isArray(duLieu.hoan_tien)
    ? duLieu.hoan_tien
    : []
  ).map((h) => {
    const ct_tratien = chuoi(h.ct_tratien).toUpperCase();
    const ct_nhantien = chuoi(h.ct_nhantien).toUpperCase();
    if (!CHU_THE_HOP_LE.has(ct_tratien) || !CHU_THE_HOP_LE.has(ct_nhantien)) {
      throw loi('Bên trả hoặc bên nhận tiền không hợp lệ.');
    }

    const so_tiengoc = so(h.so_tiengoc);
    const so_tienphatsinh = so(h.so_tienphatsinh);
    const tong_tienhoan = so(h.tong_tienhoan);

    if (so_tiengoc < 0 || so_tienphatsinh < 0 || tong_tienhoan < 0) {
      throw loi('Số tiền hoàn không hợp lệ.');
    }

    return {
      ct_tratien,
      ct_nhantien,
      so_tiengoc,
      so_tienphatsinh,
      tong_tienhoan,
      ly_do: chuoi(h.ly_do),
    };
  });

  // Tự tạo khoản chi khi có đúng 1 bên chịu trách nhiệm (có tiền)
  // và đúng 1 bên bị ảnh hưởng. Giúp API vẫn dùng được khi client
  // chỉ gửi trách nhiệm mà quên gửi khoản chi.
  if (!dsHoanTien.length && HUONG_CAN_CHI.has(huong_xu_ly)) {
    const benTra = dsTrachNhiem.filter(
      (x) => x.vai_tro === 'CHIU_TRACH_NHIEM' && x.so_tien > 0
    );
    const benNhan = dsTrachNhiem.filter(
      (x) => x.vai_tro === 'BI_ANH_HUONG'
    );

    if (benTra.length === 1 && benNhan.length === 1) {
      dsHoanTien = [
        {
          ct_tratien: benTra[0].ct_ma,
          ct_nhantien: benNhan[0].ct_ma,
          so_tiengoc: benTra[0].so_tien,
          so_tienphatsinh: 0,
          tong_tienhoan: benTra[0].so_tien,
          ly_do: ket_luan,
        },
      ];
    }
  }

  const canChi = dsHoanTien.length > 0;

  if (huong_xu_ly === 'KHONG_DEN' && canChi) {
    throw loi('Hướng "không đền" không được tạo khoản hoàn tiền.');
  }
  if (HUONG_CAN_CHI.has(huong_xu_ly) && !canChi) {
    throw loi('Hướng xử lý này bắt buộc phải có khoản hoàn tiền.');
  }

  const benTra = new Set(
    dsTrachNhiem
      .filter((x) => x.vai_tro === 'CHIU_TRACH_NHIEM')
      .map((x) => x.ct_ma)
  );
  const benNhan = new Set(
    dsTrachNhiem
      .filter((x) => x.vai_tro === 'BI_ANH_HUONG')
      .map((x) => x.ct_ma)
  );

  for (const ht of dsHoanTien) {
    if (!benTra.has(ht.ct_tratien)) {
      throw loi('Bên trả tiền chưa được gán trách nhiệm.');
    }
    if (!benNhan.has(ht.ct_nhantien)) {
      throw loi('Bên nhận tiền chưa được gán là bên bị ảnh hưởng.');
    }
    if (ht.ct_tratien === ht.ct_nhantien) {
      throw loi('Bên trả và bên nhận phải khác nhau.');
    }
    if (ht.tong_tienhoan < 0) throw loi('Số tiền hoàn không hợp lệ.');
    if (ht.tong_tienhoan > ht.so_tiengoc + ht.so_tienphatsinh) {
      throw loi('Số hoàn vượt quá gốc cộng phát sinh.');
    }
  }

  if (canChi) {
    if (benTra.size === 0) {
      throw loi('Phải gán ít nhất một bên chịu trách nhiệm.');
    }

    if (benTra.size > 1) {
      const tongPhanTram = dsTrachNhiem
        .filter((x) => x.vai_tro === 'CHIU_TRACH_NHIEM')
        .reduce((s, x) => s + x.phan_tram, 0);
      if (Math.round(tongPhanTram) !== 100) {
        throw loi('Tổng % trách nhiệm phải bằng 100.');
      }
    }

    const tongTrachNhiem = dsTrachNhiem
      .filter((x) => x.vai_tro === 'CHIU_TRACH_NHIEM')
      .reduce((s, x) => s + x.so_tien, 0);
    const tongHoan = dsHoanTien.reduce((s, x) => s + x.tong_tienhoan, 0);

    if (Math.abs(tongTrachNhiem - tongHoan) > 0.01) {
      throw loi('Tổng số tiền trách nhiệm phải bằng tổng tiền hoàn.');
    }

    // Không cho hoàn vượt giá trị đơn hàng.
    const don = await SuCoModel.layDonHang(phieu.dts_ma);
    const giaTriDon = so(don?.dts_tongtienkhachhangthanhtoan);
    if (giaTriDon > 0 && tongHoan > giaTriDon + 0.01) {
      throw loi('Tổng tiền hoàn không được vượt quá giá trị đơn hàng.');
    }
  }

  const ketQua = await SuCoModel.ketLuan({
    ycxlsc_ma: phieu.ycxlsc_ma,
    nguoi_duyet: nguoiDuyet,
    ket_luan,
    huong_xu_ly,
    trach_nhiem: dsTrachNhiem,
    hoan_tien: dsHoanTien,
  });

  bao({ kieu: 'KET_LUAN', phieu: ketQua, huong_xu_ly, ket_luan });
  return ketQua;
};

// ---------- Admin: từ chối ----------
const tuChoi = async (ycxlsc_ma, nguoiDuyet, ly_do = '') => {
  const phieu = await SuCoModel.layPhieuGon(chuoi(ycxlsc_ma));
  if (!phieu) throw loi('Không tìm thấy phiếu sự cố.', 404);

  kiemTraChuyen(phieu.ycxlsc_trang_thai, 'TTXLSC06');

  const ketQua = await SuCoModel.chuyenTrangThai({
    ycxlsc_ma: phieu.ycxlsc_ma,
    trang_thai: 'TTXLSC06',
    ct_ma: 'CT01',
    nguoi: nguoiDuyet,
    ghichu: chuoi(ly_do) || 'Từ chối xử lý',
  });

  bao({ kieu: 'DOI_TRANG_THAI', phieu: ketQua });
  return ketQua;
};

// ---------- Admin: hoàn tất ----------
const hoanTat = async (ycxlsc_ma, nguoiDuyet, ghichu = '') => {
  const phieu = await SuCoModel.layPhieuGon(chuoi(ycxlsc_ma));
  if (!phieu) throw loi('Không tìm thấy phiếu sự cố.', 404);

  kiemTraChuyen(phieu.ycxlsc_trang_thai, 'TTXLSC05');

  const chiTiet = await SuCoModel.layChiTiet(phieu.ycxlsc_ma);
  const conCho = (chiTiet.hoan_tien || []).filter((h) =>
    ['CHO_CHI', 'QUA_HAN'].includes(h.ht_trang_thai)
  );
  if (conCho.length > 0) {
    throw loi('Còn khoản hoàn tiền chưa xử lý, không thể hoàn tất.');
  }

  const ketQua = await SuCoModel.chuyenTrangThai({
    ycxlsc_ma: phieu.ycxlsc_ma,
    trang_thai: 'TTXLSC05',
    ct_ma: 'CT01',
    nguoi: nguoiDuyet,
    ghichu: chuoi(ghichu) || 'Hoàn tất xử lý sự cố',
  });

  bao({ kieu: 'DOI_TRANG_THAI', phieu: ketQua });
  return ketQua;
};

// ---------- Admin: xác nhận đã chi ----------
const xacNhanChi = async (ycxlsc_ma, ht_ma, nguoiDuyet, ma_giao_dich = '') => {
  const chiTiet = await SuCoModel.layChiTiet(chuoi(ycxlsc_ma));
  if (!chiTiet) throw loi('Không tìm thấy phiếu sự cố.', 404);

  const khoan = (chiTiet.hoan_tien || []).find(
    (h) => h.ht_ma === chuoi(ht_ma)
  );
  if (!khoan) throw loi('Khoản hoàn tiền không thuộc phiếu này.', 404);

  const ketQua = await SuCoModel.xacNhanChi({
    ht_ma: khoan.ht_ma,
    nguoi: nguoiDuyet,
    ma_giao_dich: chuoi(ma_giao_dich),
  });

  bao({ kieu: 'XAC_NHAN_CHI', phieu: ketQua, hoan_tien: khoan });
  return ketQua;
};

// ---------- Admin: huỷ khoản hoàn tiền ----------
const huyHoanTien = async (ycxlsc_ma, ht_ma, nguoiDuyet, ly_do = '') => {
  const chiTiet = await SuCoModel.layChiTiet(chuoi(ycxlsc_ma));
  if (!chiTiet) throw loi('Không tìm thấy phiếu sự cố.', 404);

  const khoan = (chiTiet.hoan_tien || []).find(
    (h) => h.ht_ma === chuoi(ht_ma)
  );
  if (!khoan) throw loi('Khoản hoàn tiền không thuộc phiếu này.', 404);

  const ketQua = await SuCoModel.huyHoanTien({
    ht_ma: khoan.ht_ma,
    nguoi: nguoiDuyet,
    ly_do: chuoi(ly_do),
  });

  bao({ kieu: 'HUY_HOAN_TIEN', phieu: ketQua, hoan_tien: khoan });
  return ketQua;
};

// ---------- Admin: QR nhận tiền cho khoản hoàn tiền ----------
const timKhoanTrongPhieu = async (ycxlsc_ma, ht_ma) => {
  const chiTiet = await SuCoModel.layChiTiet(chuoi(ycxlsc_ma));
  if (!chiTiet) throw loi('Không tìm thấy phiếu sự cố.', 404);

  const khoan = (chiTiet.hoan_tien || []).find(
    (h) => h.ht_ma === chuoi(ht_ma)
  );
  if (!khoan) throw loi('Khoản hoàn tiền không thuộc phiếu này.', 404);

  return { chiTiet, khoan };
};

const taoQrHoanTien = async (ycxlsc_ma, ht_ma) => {
  const { chiTiet, khoan } = await timKhoanTrongPhieu(ycxlsc_ma, ht_ma);

  if (chiTiet.phieu.ycxlsc_trang_thai !== 'TTXLSC04') {
    throw loi('Chỉ tạo QR nhận tiền khi phiếu đã kết luận.', 409);
  }

  return SuCoThanhToanModel.taoQr(khoan.ht_ma);
};

const layQrHoanTien = async (ycxlsc_ma, ht_ma) => {
  const { khoan } = await timKhoanTrongPhieu(ycxlsc_ma, ht_ma);
  return SuCoThanhToanModel.layTrangThai(khoan.ht_ma);
};

const huyQrHoanTien = async (ycxlsc_ma, ht_ma) => {
  const { chiTiet, khoan } = await timKhoanTrongPhieu(ycxlsc_ma, ht_ma);

  const ketQua = await SuCoThanhToanModel.huyQr(khoan.ht_ma);
  bao({
    kieu: 'HUY_QR',
    phieu: { ycxlsc_ma: chiTiet.phieu.ycxlsc_ma },
    hoan_tien: khoan,
  });
  return ketQua;
};

// ---------- KPI ----------
const getKpi = () => SuCoModel.getKpi();

module.exports = {
  layLoaiSuCo,
  layTrangThai,
  layDonHang,
  taoPhieu,
  layDanhSach,
  layChiTiet,
  themMinhChung,
  huy,
  tiepNhan,
  yeuCauBoSung,
  ketLuan,
  tuChoi,
  hoanTat,
  xacNhanChi,
  huyHoanTien,
  taoQrHoanTien,
  layQrHoanTien,
  huyQrHoanTien,
  getKpi,
};