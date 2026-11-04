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
  if (name.includes("sacombank") || name.includes("stb")) return "970403";
  return "970436";
};

export const buildVietQrUrl = (bank, amount = 0, addInfo = "") => {
  // Nếu không truyền data thì trả về chuỗi rỗng
  if (!bank) return "";

  // ✅ Tự động nhận diện key của Sàn, Shop hoặc Khách hàng (cả viết hoa và viết thường)
  const accountNo = 
    bank.TTNT_STMDT_SoTaiKhoan || 
    bank.ttnt_stmdt_sotaikhoan || 
    bank.so_taikhoan || 
    bank.ttnt_gianhang_sotaikhoan || 
    bank.ttnt_kh_sotaikhoan || "";

  const accountName = 
    bank.TTNT_STMDT_TenTaiKhoan || 
    bank.ttnt_stmdt_tentaikhoan || 
    bank.ten_taikhoan || 
    bank.ttnt_gianhang_tentaikhoan || 
    bank.ttnt_kh_tennguoinhan || "";
  
  const bankName = 
    bank.NHG_Ten || 
    bank.nhg_ten || 
    bank.nganhang_ten || 
    bank.NganHang_Ma || 
    bank.nganhang_ma || "";

  // Nếu không có số tài khoản, trả về ảnh lỗi để dễ nhận biết thay vì chuỗi rỗng
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