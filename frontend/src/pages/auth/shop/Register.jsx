// src/pages/auth/shop/Register.jsx
import { useState, useEffect, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../../../contexts/AuthContext";
import addressService from "../../../services/san/addressService";
import PasswordInput from "../../../components/common/PasswordInput";
import AuthShell, {
  AuthAlert,
  AuthField,
  AuthFileField,
  AuthSection,
  AuthSubmit,
} from "../../../components/auth/AuthShell";
import {
  authInputClass,
  getAuthTone,
} from "../../../components/auth/authTheme";

const ShopRegister = () => {
  const { registerShop } = useContext(AuthContext);
  const navigate = useNavigate();
  const tone = getAuthTone("shop");

  const [formData, setFormData] = useState({
    gh_ten: "",
    gh_email: "",
    gh_mota: "",
    password: "",
    confirmPassword: "",
    dc_mota: "",
  });

  const [tinhs, setTinhs] = useState([]);
  const [xas, setXas] = useState([]);
  const [selectedTinh, setSelectedTinh] = useState("");
  const [selectedXa, setSelectedXa] = useState("");

  const [selectedFile, setSelectedFile] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resTinh, resXa] = await Promise.all([
          addressService.getAllTinh(),
          addressService.getAllXa(),
        ]);

        // SỬA LỖI TẠI ĐÂY: Map đúng tên cột API trả về (tinh_ma, tinh_ten)
        const normalizedTinhs = resTinh.data.map((t) => ({
          ma: t.tinh_ma || t.th_ma || t.TH_Ma,
          ten: t.tinh_ten || t.th_ten || t.TH_Ten,
        }));

        // Tương tự cho Xã (giả định xa_ma, xa_ten và khóa ngoại tinh_ma)
        const normalizedXas = resXa.data.map((x) => ({
          ma: x.xa_ma || x.XA_Ma,
          ten: x.xa_ten || x.XA_Ten,
          tinh_ma: x.tinh_ma || x.th_ma || x.TH_Ma,
        }));

        setTinhs(normalizedTinhs);
        setXas(normalizedXas);
      } catch (err) {
        console.error("Lỗi tải danh sách Tỉnh/Xã:", err);
      }
    };
    fetchData();
  }, []);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!selectedTinh) return setError("Vui lòng chọn Tỉnh/Thành phố.");
    if (!selectedXa) return setError("Vui lòng chọn Phường/Xã.");
    if (formData.password !== formData.confirmPassword)
      return setError("Mật khẩu xác nhận không khớp!");

    setLoading(true);
    try {
      const dataToSend = new FormData();
      dataToSend.append("gh_ten", formData.gh_ten);
      dataToSend.append("gh_email", formData.gh_email);
      dataToSend.append("gh_mota", formData.gh_mota);
      dataToSend.append("password", formData.password);
      dataToSend.append("xa_ma", selectedXa);
      dataToSend.append("dc_mota", formData.dc_mota);

      if (selectedFile) dataToSend.append("hinhanh", selectedFile);

      await registerShop(dataToSend);
      alert("Đăng ký thành công! Vui lòng đăng nhập.");
      navigate("/nguoi-ban/login");
    } catch (err) {
      setError(err.response?.data?.message || "Có lỗi xảy ra khi đăng ký.");
    } finally {
      setLoading(false);
    }
  };

  // SỬA LỖI LỌC: Đổi biến thành tinh_ma cho khớp với dữ liệu đã map ở trên
  const filteredXas = xas.filter(
    (xa) => String(xa.tinh_ma) === String(selectedTinh),
  );

  return (
    <AuthShell
      tone="shop"
      width="xl"
      icon="storefront"
      eyebrow="Kênh người bán"
      title="Tạo gian hàng mới"
      subtitle="Bắt đầu kinh doanh cùng CT255"
      panelTitle="Gian hàng của bạn, khách hàng của bạn"
      panelDesc="Chỉ mất vài phút để mở gian hàng. Sau khi đăng ký, bạn có thể đăng sản phẩm, thiết lập địa chỉ lấy hàng và bắt đầu bán ngay."
      panelPoints={[
        { icon: "timer", text: "Đăng ký nhanh, duyệt hồ sơ minh bạch" },
        { icon: "bar_chart", text: "Báo cáo doanh thu theo từng đơn hàng" },
        { icon: "support_agent", text: "Đội ngũ hỗ trợ người bán 24/7" },
      ]}
      footer={
        <>
          Đã có tài khoản?{" "}
          <Link
            to="/nguoi-ban/login"
            className={`font-semibold underline decoration-2 underline-offset-4 transition-colors ${tone.link}`}
          >
            Đăng nhập ngay
          </Link>
        </>
      }
    >
      {error && <AuthAlert>{error}</AuthAlert>}

      <form onSubmit={handleSubmit} className="space-y-7">
        {/* 1. Thông tin gian hàng */}
        <section className="space-y-4">
          <AuthSection
            step="1"
            tone="shop"
            title="Thông tin gian hàng"
            description="Tên và mô tả giúp khách hàng nhận diện gian hàng của bạn."
          />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <AuthField label="Tên gian hàng" icon="storefront" required>
              <input
                type="text"
                name="gh_ten"
                required
                onChange={handleChange}
                placeholder="VD: Shop Thời Trang A"
                className={authInputClass("shop")}
              />
            </AuthField>

            <AuthField label="Email đăng nhập" icon="mail" required>
              <input
                type="email"
                name="gh_email"
                required
                onChange={handleChange}
                placeholder="shop@domain.com"
                autoComplete="email"
                className={authInputClass("shop")}
              />
            </AuthField>
          </div>

          <AuthField label="Mô tả gian hàng" icon="notes">
            <textarea
              name="gh_mota"
              onChange={handleChange}
              rows="3"
              placeholder="Giới thiệu ngắn về sản phẩm và phong cách bán hàng của bạn..."
              className={`${authInputClass("shop")} resize-none`}
            ></textarea>
          </AuthField>

          <AuthFileField
            tone="shop"
            label="Ảnh đại diện (Logo)"
            hint="PNG, JPG · Nên dùng ảnh vuông, không bắt buộc"
            onChange={(e) => setSelectedFile(e.target.files[0])}
          />
        </section>

        {/* 2. Địa chỉ liên hệ */}
        <section className="space-y-4">
          <AuthSection
            step="2"
            tone="shop"
            title="Địa chỉ liên hệ"
            description="Địa chỉ lấy hàng dùng để tính phí và điều phối vận chuyển."
          />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <AuthField label="Tỉnh / Thành phố" icon="location_on" required>
              <select
                value={selectedTinh}
                onChange={(e) => {
                  setSelectedTinh(e.target.value);
                  setSelectedXa("");
                }}
                required
                className={authInputClass("shop")}
              >
                <option value="">-- Chọn Tỉnh/Thành phố --</option>
                {tinhs.map((tinh, index) => (
                  <option key={tinh.ma || index} value={tinh.ma}>
                    {tinh.ten}
                  </option>
                ))}
              </select>
            </AuthField>

            <AuthField label="Phường / Xã" icon="holiday_village" required>
              <select
                value={selectedXa}
                onChange={(e) => setSelectedXa(e.target.value)}
                required
                disabled={!selectedTinh}
                className={`${authInputClass("shop")} disabled:cursor-not-allowed disabled:opacity-50`}
              >
                <option value="">-- Chọn Phường/Xã --</option>
                {filteredXas.map((xa, index) => (
                  <option key={xa.ma || index} value={xa.ma}>
                    {xa.ten}
                  </option>
                ))}
              </select>
            </AuthField>
          </div>

          <AuthField label="Số nhà, tên đường" icon="signpost" required>
            <input
              type="text"
              name="dc_mota"
              required
              onChange={handleChange}
              placeholder="VD: 123 Nguyễn Văn Cừ"
              className={authInputClass("shop")}
            />
          </AuthField>
        </section>

        {/* 3. Bảo mật */}
        <section className="space-y-4">
          <AuthSection
            step="3"
            tone="shop"
            title="Bảo mật tài khoản"
            description="Mật khẩu dùng để đăng nhập vào kênh người bán."
          />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <AuthField label="Mật khẩu" icon="lock" required>
              <PasswordInput
                name="password"
                required
                onChange={handleChange}
                placeholder="••••••••"
                autoComplete="new-password"
                className={authInputClass("shop")}
              />
            </AuthField>

            <AuthField label="Xác nhận mật khẩu" icon="lock_reset" required>
              <PasswordInput
                name="confirmPassword"
                required
                onChange={handleChange}
                placeholder="••••••••"
                autoComplete="new-password"
                className={authInputClass("shop")}
              />
            </AuthField>
          </div>
        </section>

        <div className="border-t border-slate-100 pt-5">
          <AuthSubmit loading={loading} tone="shop" icon="storefront">
            Đăng ký gian hàng
          </AuthSubmit>
          <p className="mt-3 text-center text-xs leading-relaxed text-slate-500">
            Bằng việc đăng ký, bạn đồng ý tuân thủ chính sách bán hàng của
            CT255.
          </p>
        </div>
      </form>
    </AuthShell>
  );
};

export default ShopRegister;
