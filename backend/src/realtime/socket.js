// backend/src/realtime/socket.js
// Socket.IO: xác thực JWT, mỗi người dùng vào 1 phòng riêng theo vai trò + mã
const jwt = require('jsonwebtoken');

let ioRef = null;

const LOAI_THEO_ROLE = {
  admin: 'SAN',
  shop: 'SHOP',
  khachhang: 'KHACHHANG',
  dvvc: 'DVVC',
  shipper: 'SHIPPER',
};

const tenPhong = (loai, ma) => `notify:${loai}:${ma}`;

const init = (io) => {
  ioRef = io;

  io.use((socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token || socket.handshake.query?.token;
      if (!token) return next(new Error('UNAUTHORIZED'));

      const duLieu = jwt.verify(token, process.env.JWT_SECRET);
      const loai = LOAI_THEO_ROLE[duLieu?.role];
      if (!loai || !duLieu?.id) return next(new Error('UNAUTHORIZED'));

      socket.data.nn_loai = loai;
      socket.data.nn_ma = String(duLieu.id);
      return next();
    } catch (error) {
      return next(new Error('UNAUTHORIZED'));
    }
  });

  io.on('connection', (socket) => {
    const { nn_loai, nn_ma } = socket.data;
    socket.join(tenPhong(nn_loai, nn_ma));
    socket.emit('thongbao:ketnoi', { nn_loai, nn_ma });
  });

  console.log('🔔 Socket.IO thông báo đã sẵn sàng.');
};

// Phát thông báo mới tới đúng phòng của từng người nhận
const emitMoi = (dsNguoiNhan, thongBao) => {
  if (!ioRef || !Array.isArray(dsNguoiNhan) || dsNguoiNhan.length === 0) return;
  for (const { loai, ma } of dsNguoiNhan) {
    ioRef.to(tenPhong(loai, ma)).emit('thongbao:moi', thongBao);
  }
};

// Đồng bộ trạng thái đã đọc giữa nhiều tab/thiết bị của cùng 1 người
const emitDaDoc = (nguoiNhan, duLieu) => {
  if (!ioRef || !nguoiNhan) return;
  ioRef
    .to(tenPhong(nguoiNhan.loai, nguoiNhan.ma))
    .emit('thongbao:dadoc', duLieu);
};

module.exports = { init, emitMoi, emitDaDoc, tenPhong, LOAI_THEO_ROLE };