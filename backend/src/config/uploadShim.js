// backend/src/config/uploadShim.js
// Bọc multer.diskStorage để MỌI route upload (27 file) tự động đẩy ảnh lên
// Supabase Storage mà không phải sửa route nào.
// PHẢI được require TRƯỚC các file routes trong server.js.
'use strict';

const fs = require('fs');
const path = require('path');
const multer = require('multer');
const storage = require('./supabaseStorage');

const THU_MUC_GOC = path.resolve(__dirname, '../../public/uploads');

// /abs/path/public/uploads/san_pham/a.jpg -> "san_pham/a.jpg"
const keyTuDuongDan = (duongDan) => {
  const tuyetDoi = path.resolve(String(duongDan || ''));
  const tuongDoi = path.relative(THU_MUC_GOC, tuyetDoi);

  if (!tuongDoi || tuongDoi.startsWith('..') || path.isAbsolute(tuongDoi)) {
    // Ngoài public/uploads: giữ tên thư mục cha để không đè nhau
    return `${path.basename(path.dirname(tuyetDoi))}/${path.basename(tuyetDoi)}`.replace(/\\/g, '/');
  }

  return tuongDoi.split(path.sep).join('/');
};

const dayLen = async (info, file) => {
  const c = storage.cauHinh();
  if (c.maxMb > 0 && info.size > c.maxMb * 1024 * 1024) {
    const loi = new Error(
      `Ảnh vượt quá ${c.maxMb}MB (${(info.size / 1048576).toFixed(2)}MB): ${info.filename}`
    );
    loi.code = 'FILE_TOO_LARGE';
    throw loi;
  }
  await storage.taiLen(info.path, keyTuDuongDan(info.path), file.mimetype);
};

const boc = () => {
  if (multer.__daBocSupabase) return;

  const gocDiskStorage = multer.diskStorage;
  if (typeof gocDiskStorage !== 'function') return;

  multer.diskStorage = function diskStorageCoSupabase(opts) {
    const goc = gocDiskStorage.call(multer, opts || {});

    return {
      ...goc,

      _handleFile(req, file, cb) {
        goc._handleFile(req, file, async (err, info) => {
          if (err) return cb(err);
          if (!info || !info.path) return cb(null, info);

          // Chế độ local: y hệt code cũ
          if (!storage.daBat()) return cb(null, info);

          try {
            await dayLen(info, file);
            return cb(null, info);
          } catch (loi) {
            console.error('❌ [UPLOAD] Không lưu được ảnh lên Supabase:', loi.message);
            try {
              fs.unlinkSync(info.path);
            } catch (_) {
              /* bỏ qua */
            }

            const c = storage.cauHinh();
            if (c.failFast) {
              // Báo lỗi thật để user thử lại, thay vì nhận ảnh rồi mất khi deploy
              return cb(loi);
            }
            return cb(null, info); // vẫn cho qua, chỉ nằm trên đĩa tạm
          }
        });
      },

      _removeFile(req, file, cb) {
        const key = file && file.path ? keyTuDuongDan(file.path) : null;

        if (typeof goc._removeFile !== 'function') return cb(null);

        return goc._removeFile(req, file, (err) => {
          if (key && storage.daBat()) {
            storage.xoa(key).catch(() => {});
          }
          return cb(err);
        });
      },
    };
  };

  Object.defineProperty(multer, '__daBocSupabase', { value: true, enumerable: false });
  console.log('🧩 [UPLOAD] Đã bọc multer.diskStorage -> tự đẩy ảnh lên Supabase Storage.');
};

boc();

module.exports = { keyTuDuongDan, THU_MUC_GOC };
