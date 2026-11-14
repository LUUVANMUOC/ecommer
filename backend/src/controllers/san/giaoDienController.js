// backend/src/controllers/san/giaoDienController.js
const CaidatSanModel = require('../../models/san/caidatSanModel');
const KhuvucGiaoDienModel = require('../../models/san/khuvucGiaoDienModel');
const ThanhPhanGiaoDienModel = require('../../models/san/thanhPhanGiaoDienModel');

// Sàn mặc định (có thể override bằng biến môi trường STMDT_MA)
const STMDT_MA = process.env.STMDT_MA || 'ST00000001';

const VITRI = ['header', 'footer'];

const groupByKhuVuc = (khuVuc, thanhPhan) =>
  khuVuc.map((kv) => ({
    ...kv,
    thanh_phan: thanhPhan.filter((tp) => tp.kvg_ma === kv.kvg_ma),
  }));

const GiaoDienController = {
  // =====================================================
  // PUBLIC: GET /api/giao-dien
  // =====================================================
  getPublic: async (req, res) => {
    try {
      const [caiDat, khuVuc, thanhPhan] = await Promise.all([
        CaidatSanModel.get(STMDT_MA),
        KhuvucGiaoDienModel.getAll(STMDT_MA, true),
        ThanhPhanGiaoDienModel.getBySan(STMDT_MA, true),
      ]);

      const grouped = groupByKhuVuc(khuVuc, thanhPhan);

      // Header/footer ít thay đổi: cho phép trình duyệt cache 30s
      res.set('Cache-Control', 'public, max-age=30');

      res.status(200).json({
        cai_dat: caiDat || null,
        header: grouped.filter((k) => k.kvg_vitri === 'header'),
        footer: grouped.filter((k) => k.kvg_vitri === 'footer'),
      });
    } catch (error) {
      console.error('Lỗi lấy giao diện public:', error);
      res.status(500).json({ message: error.message });
    }
  },

  // =====================================================
  // ADMIN: GET /api/admin/giao-dien
  // =====================================================
  getAdmin: async (req, res) => {
    try {
      const [caiDat, khuVuc, thanhPhan] = await Promise.all([
        CaidatSanModel.get(STMDT_MA),
        KhuvucGiaoDienModel.getAll(STMDT_MA, false),
        ThanhPhanGiaoDienModel.getBySan(STMDT_MA, false),
      ]);

      res.status(200).json({
        cai_dat: caiDat || null,
        khu_vuc: groupByKhuVuc(khuVuc, thanhPhan),
      });
    } catch (error) {
      console.error('Lỗi lấy giao diện admin:', error);
      res.status(500).json({ message: error.message });
    }
  },

  // =====================================================
  // ADMIN: PUT /api/admin/giao-dien
  // =====================================================
  updateCaiDat: async (req, res) => {
    try {
      const saved = await CaidatSanModel.upsert(STMDT_MA, req.body || {});
      res.status(200).json(saved);
    } catch (error) {
      console.error('Lỗi lưu cấu hình sàn:', error);
      res.status(500).json({ message: error.message });
    }
  },

  // =====================================================
  // ADMIN: KHU VỰC
  // =====================================================
  listKhuVuc: async (req, res) => {
    try {
      const data = await KhuvucGiaoDienModel.getAll(STMDT_MA, false);
      res.status(200).json(data);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  createKhuVuc: async (req, res) => {
    try {
      const { kvg_vitri, kvg_ten } = req.body || {};

      if (!VITRI.includes(kvg_vitri)) {
        return res
          .status(400)
          .json({ message: "Vị trí phải là 'header' hoặc 'footer'." });
      }
      if (!kvg_ten || !String(kvg_ten).trim()) {
        return res.status(400).json({ message: 'Tên khu vực không được trống.' });
      }

      const created = await KhuvucGiaoDienModel.create({
        ...req.body,
        stmdt_ma: STMDT_MA,
        kvg_ten: String(kvg_ten).trim(),
      });

      res.status(201).json(created);
    } catch (error) {
      console.error('Lỗi thêm khu vực:', error);
      res.status(500).json({ message: error.message });
    }
  },

  updateKhuVuc: async (req, res) => {
    try {
      if (req.body?.kvg_vitri && !VITRI.includes(req.body.kvg_vitri)) {
        return res.status(400).json({ message: 'Vị trí không hợp lệ.' });
      }

      const updated = await KhuvucGiaoDienModel.update(
        req.params.id,
        req.body || {},
      );
      if (!updated) {
        return res.status(404).json({ message: 'Không tìm thấy khu vực.' });
      }

      res.status(200).json(updated);
    } catch (error) {
      console.error('Lỗi cập nhật khu vực:', error);
      res.status(500).json({ message: error.message });
    }
  },

  deleteKhuVuc: async (req, res) => {
    try {
      const deleted = await KhuvucGiaoDienModel.remove(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: 'Không tìm thấy khu vực.' });
      }
      res.status(200).json({ message: 'Đã xóa khu vực.', data: deleted });
    } catch (error) {
      console.error('Lỗi xóa khu vực:', error);
      res.status(500).json({ message: error.message });
    }
  },

  // =====================================================
  // ADMIN: THÀNH PHẦN
  // =====================================================
  listThanhPhan: async (req, res) => {
    try {
      const data = req.query.kvg_ma
        ? await ThanhPhanGiaoDienModel.getByKhuVuc(req.query.kvg_ma, false)
        : await ThanhPhanGiaoDienModel.getBySan(STMDT_MA, false);

      res.status(200).json(data);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  createThanhPhan: async (req, res) => {
    try {
      const { kvg_ma } = req.body || {};

      if (!kvg_ma) {
        return res.status(400).json({ message: 'Thiếu khu vực (kvg_ma).' });
      }

      const khuVuc = await KhuvucGiaoDienModel.getById(kvg_ma);
      if (!khuVuc) {
        return res.status(404).json({ message: 'Khu vực không tồn tại.' });
      }

      const created = await ThanhPhanGiaoDienModel.create(req.body);
      res.status(201).json(created);
    } catch (error) {
      console.error('Lỗi thêm thành phần:', error);
      res.status(500).json({ message: error.message });
    }
  },

  updateThanhPhan: async (req, res) => {
    try {
      const updated = await ThanhPhanGiaoDienModel.update(
        req.params.id,
        req.body || {},
      );
      if (!updated) {
        return res.status(404).json({ message: 'Không tìm thấy thành phần.' });
      }
      res.status(200).json(updated);
    } catch (error) {
      console.error('Lỗi cập nhật thành phần:', error);
      res.status(500).json({ message: error.message });
    }
  },

  deleteThanhPhan: async (req, res) => {
    try {
      const deleted = await ThanhPhanGiaoDienModel.remove(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: 'Không tìm thấy thành phần.' });
      }
      res.status(200).json({ message: 'Đã xóa thành phần.', data: deleted });
    } catch (error) {
      console.error('Lỗi xóa thành phần:', error);
      res.status(500).json({ message: error.message });
    }
  },

  // =====================================================
  // ADMIN: SẮP XẾP SAU KÉO THẢ
  // body: { loai: 'khu-vuc' | 'thanh-phan', ids: [...] }
  // =====================================================
  reorder: async (req, res) => {
    try {
      const { loai, ids } = req.body || {};

      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ message: 'Danh sách id không hợp lệ.' });
      }

      if (loai === 'khu-vuc') {
        await KhuvucGiaoDienModel.reorder(ids);
      } else if (loai === 'thanh-phan') {
        await ThanhPhanGiaoDienModel.reorder(ids);
      } else {
        return res
          .status(400)
          .json({ message: "loai phải là 'khu-vuc' hoặc 'thanh-phan'." });
      }

      res.status(200).json({ message: 'Đã lưu thứ tự.' });
    } catch (error) {
      console.error('Lỗi sắp xếp:', error);
      res.status(500).json({ message: error.message });
    }
  },

  // =====================================================
  // ADMIN: UPLOAD ẢNH
  // =====================================================
  uploadImage: async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'Chưa chọn file ảnh.' });
      }

      res.status(201).json({
        url: `/uploads/giaodien/${req.file.filename}`,
        filename: req.file.filename,
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
};

module.exports = GiaoDienController;