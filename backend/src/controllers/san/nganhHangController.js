const NganhHangModel = require('../../models/san/nganhHangModel');

const NganhHangController = {
    getAll: async (req, res) => {
        try {
            const data = await NganhHangModel.getAll();
            res.status(200).json(data);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },
    create: async (req, res) => {
        try { 
            const result = await NganhHangModel.create(req.body);
            res.status(201).json(result); 
        } catch (error) { 
            res.status(500).json({ message: error.message }); 
        }
    },
    update: async (req, res) => {
        try { 
            const result = await NganhHangModel.update(req.params.id, req.body);
            res.status(200).json(result); 
        } catch (error) { 
            res.status(500).json({ message: error.message }); 
        }
    },
    delete: async (req, res) => {
        try { 
            await NganhHangModel.delete(req.params.id); 
            res.status(200).json({ message: "Đã xóa thành công" }); 
        } catch (error) { 
            res.status(500).json({ message: error.message }); 
        }
    }
};

module.exports = NganhHangController;