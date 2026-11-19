const PhieuKhoModel = require('../../models/quanlykho/phieuKhoModel');

const MAX_BATCH = 100;

const normalizeDanhSach = (danh_sach) => {
  if (!Array.isArray(danh_sach)) return [];
  return [...new Set(danh_sach.map((ma) => String(ma || '').trim()).filter(Boolean))];
};

// Xác nhận nhiều phiếu với 1 ảnh minh chứng chung.
// Mỗi phiếu chạy trong transaction riêng của model cũ -> 1 phiếu lỗi không kéo đổ cả lô.
const xacNhanHangLoat = async (loai, kho_ma, danh_sach, hinhanh, ghichu) => {
  const tenLoai = loai === 'NHAP' ? 'nhập' : 'xuất';

  if (!kho_ma) throw new Error('Thiếu mã kho!');
  if (!hinhanh) throw new Error(`Bắt buộc phải có ảnh minh chứng ${tenLoai} kho!`);

  const ds = normalizeDanhSach(danh_sach);
  if (ds.length === 0) throw new Error('Vui lòng chọn ít nhất 1 phiếu!');
  if (ds.length > MAX_BATCH) throw new Error(`Chỉ xác nhận tối đa ${MAX_BATCH} phiếu mỗi lần!`);

  const ghiChuChung =
    (ghichu && String(ghichu).trim()) || `Xác nhận hàng loạt ${ds.length} phiếu`;

  const ketQua = [];
  for (const pk_ma of ds) {
    try {
      if (loai === 'NHAP') {
        await PhieuKhoModel.xacNhanNhap(pk_ma, kho_ma, hinhanh, ghiChuChung);
      } else {
        await PhieuKhoModel.xacNhanXuat(pk_ma, kho_ma, hinhanh, ghiChuChung);
      }
      ketQua.push({ pk_ma, ok: true });
    } catch (error) {
      ketQua.push({ pk_ma, ok: false, ly_do: error.message });
    }
  }

  const thanhCong = ketQua.filter((r) => r.ok).length;
  return { tongSo: ds.length, thanhCong, boQua: ds.length - thanhCong, ketQua };
};

const PhieuKhoService = {
  getChoXacNhan: async (kho_ma, loai) => {
    if (!kho_ma || !loai) throw new Error('Thiếu mã kho hoặc loại phiếu!');
    return await PhieuKhoModel.getChoXacNhan(kho_ma, loai);
  },
  xacNhanNhap: async (pk_ma, kho_ma, hinhanh, ghichu) => {
    if (!pk_ma || !kho_ma) throw new Error('Thiếu thông tin phiếu hoặc kho!');
    if (!hinhanh) throw new Error('Bắt buộc phải có ảnh minh chứng nhập kho!');
    return await PhieuKhoModel.xacNhanNhap(pk_ma, kho_ma, hinhanh, ghichu);
  },
  xacNhanXuat: async (pk_ma, kho_ma, hinhanh, ghichu) => {
    if (!pk_ma || !kho_ma) throw new Error('Thiếu thông tin phiếu hoặc kho!');
    if (!hinhanh) throw new Error('Bắt buộc phải có ảnh minh chứng xuất kho!');
    return await PhieuKhoModel.xacNhanXuat(pk_ma, kho_ma, hinhanh, ghichu);
  },
  xacNhanNhapBatch: async (kho_ma, danh_sach, hinhanh, ghichu) => {
    return await xacNhanHangLoat('NHAP', kho_ma, danh_sach, hinhanh, ghichu);
  },
  xacNhanXuatBatch: async (kho_ma, danh_sach, hinhanh, ghichu) => {
    return await xacNhanHangLoat('XUAT', kho_ma, danh_sach, hinhanh, ghichu);
  },
  getLichSu: async (kho_ma, loai, lyDo) => {
    if (!kho_ma) throw new Error('Thiếu mã kho!');
    return await PhieuKhoModel.getLichSu(kho_ma, loai, lyDo);
  },
  getChiTiet: async (pk_ma) => {
    const data = await PhieuKhoModel.getChiTiet(pk_ma);
    if (!data) throw new Error('Không tìm thấy phiếu!');
    return data;
  },
};
module.exports = PhieuKhoService;
