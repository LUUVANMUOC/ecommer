// src/components/common/Avatar.jsx
// Ảnh đại diện dùng chung: hiển thị ảnh thật nếu có, nếu không (hoặc ảnh lỗi)
// sẽ dùng ảnh silhouette mặc định theo vai trò.
import { useState } from "react";
import customerAvatar from "../../assets/avatars/customer.svg";
import shipperAvatar from "../../assets/avatars/shipper.svg";
import shopAvatar from "../../assets/avatars/shop.svg";
import dvvcAvatar from "../../assets/avatars/dvvc.svg";

const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL || "http://localhost:8080";

/** Chuẩn hoá đường dẫn ảnh: giữ nguyên URL tuyệt đối/data/blob, còn lại ghép backend. */
const resolveAssetUrl = (path) => {
  if (!path) return "";
  if (/^(https?:|data:|blob:)/i.test(path)) return path;
  return `${BACKEND_URL}${path.startsWith("/") ? "" : "/"}${path}`;
};

const ROLE_AVATARS = {
  khachhang: customerAvatar,
  customer: customerAvatar,
  nguoimua: customerAvatar,
  shipper: shipperAvatar,
  shop: shopAvatar,
  gianhang: shopAvatar,
  nguoiban: shopAvatar,
  seller: shopAvatar,
  dvvc: dvvcAvatar,
  donvivanchuyen: dvvcAvatar,
  vanchuyen: dvvcAvatar,
  // Chưa có silhouette riêng cho admin/quản lý kho -> dùng mặc định khách hàng.
  admin: customerAvatar,
  quanlykho: customerAvatar,
};

const normalizeRole = (role) =>
  String(role || "")
    .toLowerCase()
    .replace(/[\s_-]/g, "");

/** Trả về ảnh silhouette mặc định theo vai trò. */
const getRoleAvatar = (role) =>
  ROLE_AVATARS[normalizeRole(role)] || customerAvatar;

const Avatar = ({
  src,
  role = "khachhang",
  name = "",
  alt,
  className = "h-full w-full object-cover",
  ...rest
}) => {
  // Ghi nhớ đúng src bị lỗi: khi src đổi thì tự động thử lại ảnh mới.
  const [failedSrc, setFailedSrc] = useState(null);
  const hasError = Boolean(src) && failedSrc === src;
  const finalSrc = src && !hasError ? resolveAssetUrl(src) : getRoleAvatar(role);

  return (
    <img
      src={finalSrc}
      alt={alt ?? name ?? ""}
      loading="lazy"
      decoding="async"
      draggable={false}
      onError={() => setFailedSrc(src)}
      className={className}
      {...rest}
    />
  );
};

export default Avatar;
