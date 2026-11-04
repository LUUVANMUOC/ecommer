// backend/src/services/shipper/authService.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const ShipperAuthModel = require('../../models/shipper/authModel');
require('dotenv').config();

const ShipperAuthService = {
  loginShipper: async (sdt, password) => {
    console.log('--- BẮT ĐẦU ĐĂNG NHẬP SHIPPER ---');

    const shipper = await ShipperAuthModel.findBySdt(sdt);
    if (!shipper) {
      throw new Error('Số điện thoại hoặc mật khẩu không đúng!');
    }
    if (!shipper.shipper_hashpass) {
      throw new Error('Tài khoản chưa được thiết lập mật khẩu!');
    }

    const isMatch = await bcrypt.compare(password, shipper.shipper_hashpass);
    if (!isMatch) {
      throw new Error('Số điện thoại hoặc mật khẩu không đúng!');
    }

    const payload = {
      id: shipper.shipper_ma,
      role: 'shipper',
      kho_ma: shipper.kho_ma,
      dvvc_ma: shipper.dvvc_ma,
      shipper_ten: shipper.shipper_ten,
      lsp_ma: shipper.lsp_ma,
      lshipper_ten: shipper.lshipper_ten
    };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' });

    return {
      token: token,
      user: {
        shipper_ma: shipper.shipper_ma,
        shipper_ten: shipper.shipper_ten,
        shipper_sdt: shipper.shipper_sdt,
        shipper_hinhanh: shipper.shipper_hinhanh,
        kho_ma: shipper.kho_ma,
        kho_ten: shipper.kho_ten,
        dvvc_ma: shipper.dvvc_ma,
        dvvc_ten: shipper.dvvc_ten,
        lsp_ma: shipper.lsp_ma,
        lshipper_ten: shipper.lshipper_ten,
        role: 'shipper'
      }
    };
  }
};

module.exports = ShipperAuthService;