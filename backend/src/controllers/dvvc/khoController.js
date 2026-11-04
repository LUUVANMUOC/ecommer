const KhoModel = require('../../models/dvvc/khoModel');

const KhoController = {
    getAll: async (req, res) => {
        try {
            const { tinh_ma, xa_ma } = req.query;
            const data = await KhoModel.getAllByDVVC(req.params.dvvc_ma, tinh_ma, xa_ma);
            res.json(data);
        } catch (error) { res.status(500).json({ message: error.message }); }
    },

    create: async (req, res) => {
        try {
            const dvvc_ma = req.body.DVVC_Ma;
            const data = {
                Kho_Ten: req.body.Kho_Ten,
                DC_MoTa: req.body.DC_MoTa,
                DC_GPS: req.body.DC_GPS,
                Xa_Ma: req.body.Xa_Ma,
                Kho_HinhAnh: req.file ? `/uploads/kho/${req.file.filename}` : ""
            };
            const result = await KhoModel.createKho(dvvc_ma, data);
            res.status(201).json(result);
        } catch (error) { res.status(400).json({ message: error.message }); }
    },

    update: async (req, res) => {
        try {
            const data = {
                Kho_Ten: req.body.Kho_Ten,
                DC_MoTa: req.body.DC_MoTa,
                DC_GPS: req.body.DC_GPS,
                Xa_Ma: req.body.Xa_Ma,
                Kho_HinhAnh: req.file ? `/uploads/kho/${req.file.filename}` : null
            };
            const result = await KhoModel.updateKho(req.params.kho_ma, data);
            res.json(result);
        } catch (error) { res.status(400).json({ message: error.message }); }
    },

    delete: async (req, res) => {
        try {
            const result = await KhoModel.deleteKho(req.params.kho_ma);
            res.json(result);
        } catch (error) { res.status(400).json({ message: error.message }); }
    }
};

module.exports = KhoController;