import { Link } from "react-router-dom";

const taoDuongDan = (spMa, ctspMa) => {
  if (!spMa) return null;
  const goc = `/san-pham/${encodeURIComponent(spMa)}`;
  return ctspMa ? `${goc}?ctsp_ma=${encodeURIComponent(ctspMa)}` : goc;
};

/**
 * Bọc một dòng / thẻ sản phẩm để bấm vào mở trang chi tiết sản phẩm.
 *
 * - `spMa` + `ctspMa`: tự tạo link /san-pham/:sp_ma?ctsp_ma=...
 * - `to`: dùng khi cần trỏ tới trang chi tiết khác (ví dụ khu vực shop).
 * - Thiếu mã sản phẩm: render thẻ div thường để không vỡ giao diện.
 */
const SanPhamLink = ({
  spMa,
  ctspMa,
  to,
  children,
  className = "",
  title = "Xem chi tiết sản phẩm",
}) => {
  const dich = to || taoDuongDan(spMa, ctspMa);

  if (!dich) {
    return <div className={className}>{children}</div>;
  }

  return (
    <Link to={dich} className={className} title={title}>
      {children}
    </Link>
  );
};

export default SanPhamLink;
