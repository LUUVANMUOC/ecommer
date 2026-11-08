// src/utils/accountUtils.js

export const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL || "http://localhost:8080";

export const toAssetUrl = (path) => (path ? `${BACKEND_URL}${path}` : "");

export const removeVietnameseTones = (str) => {
  if (!str) return "";
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .replace(/[^a-zA-Z0-9 ]/g, "")
    .toUpperCase()
    .trim();
};

export const getBankBin = (bankName) => {
  if (!bankName) return "970436"; // Mặc định VCB
  const name = bankName.toLowerCase().trim();
  
  if (name === "nh01" || name === "mb" || name.includes("military")) return "970422";
  if (name === "nh02" || name.includes("vietcombank") || name.includes("vcb")) return "970436";
  if (name === "nh03" || name.includes("bidv")) return "970418";
  if (name === "nh04" || name.includes("vpbank") || name.includes("vpb")) return "970432";
  if (name.includes("vietinbank") || name.includes("icb")) return "970415";
  if (name.includes("techcombank") || name.includes("tcb")) return "970407";
  if (name.includes("acb")) return "970416";
  if (name.includes("agribank") || name.includes("vba")) return "970405";
  if (name.includes("sacombank") || name.includes("stb")) return "970403";
  if (name.includes("tpbank") || name.includes("tpb")) return "970423";
  return "970436";
};

export const buildVietQrUrl = (bank, amount = 0, addInfo = "") => {
  if (!bank) return "";

  // ✅ Đã bổ sung các key viết thường có dấu gạch dưới (so_tai_khoan) do Backend trả về
  const accountNo = 
    bank.TTNT_STMDT_SoTaiKhoan || 
    bank.ttnt_stmdt_sotaikhoan || 
    bank.so_taikhoan || 
    bank.so_tai_khoan ||       // 🟢 Thêm key này cho ĐVVC
    bank.ttnt_gianhang_sotaikhoan || 
    bank.ttnt_kh_sotaikhoan || 
    bank.TTNT_DVVC_SoTaiKhoan ||   
    bank.ttnt_dvvc_sotaikhoan || "";

  const accountName = 
    bank.TTNT_STMDT_TenTaiKhoan || 
    bank.ttnt_stmdt_tentaikhoan || 
    bank.ten_taikhoan || 
    bank.ten_tai_khoan ||      // 🟢 Thêm key này cho ĐVVC
    bank.ttnt_gianhang_tentaikhoan || 
    bank.ttnt_kh_tennguoinhan || 
    bank.TTNT_DVVC_TenTaiKhoan ||  
    bank.ttnt_dvvc_tentaikhoan || "";
  
  const bankName = 
    bank.NHG_Ten || 
    bank.nhg_ten || 
    bank.nganhang_ten || 
    bank.ten_ngan_hang ||      // 🟢 Thêm key này cho ĐVVC
    bank.NganHang_Ma || 
    bank.nganhang_ma || 
    bank.ma_ngan_hang || "";   // 🟢 Thêm key này cho ĐVVC

  // Nếu không có số tài khoản, trả về ảnh lỗi để dễ nhận biết
  if (!accountNo) {
    return `https://placehold.co/400x400?text=Thieu+So+Tai+Khoan`;
  }

  const bin = getBankBin(bankName);
  const cleanName = encodeURIComponent(removeVietnameseTones(accountName));

  let url = `https://img.vietqr.io/image/${bin}-${accountNo}-compact2.png?accountName=${cleanName}`;
  
  if (amount > 0) {
    url += `&amount=${amount}`;
  }
  if (addInfo) {
    url += `&addInfo=${encodeURIComponent(addInfo)}`;
  }

  return url;
};