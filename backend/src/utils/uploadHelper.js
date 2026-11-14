// backend/src/utils/uploadHelper.js
// Xóa file upload nội bộ khi admin thay/xóa ảnh, tránh rác trong /public/uploads
const fs = require('fs');
const path = require('path');

const deleteUploadedFile = (link, uploadDir) => {
  if (!link || typeof link !== 'string') return;

  // Chỉ xóa file do hệ thống lưu; bỏ qua URL ngoài (http...) và data/blob
  if (!link.startsWith('/uploads/')) return;

  const fileName = path.basename(link);
  const filePath = path.join(uploadDir, fileName);

  try {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch (error) {
    console.error('Không xóa được file cũ:', filePath, error.message);
  }
};

module.exports = { deleteUploadedFile };