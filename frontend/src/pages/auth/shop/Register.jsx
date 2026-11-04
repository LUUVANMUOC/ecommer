// src/pages/auth/shop/Register.jsx
import { useState, useEffect, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../../../contexts/AuthContext";
import addressService from "../../../services/san/addressService";

const ShopRegister = () => {
  const { registerShop } = useContext(AuthContext);
  const navigate = useNavigate();

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
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4">
      <div className="w-full max-w-2xl bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-orange-500 px-6 py-8 text-center">
          <h2 className="text-headline-md font-headline-md font-bold text-white">
            Tạo Gian Hàng Mới
          </h2>
          <p className="text-body-sm text-orange-100 mt-1">
            Bắt đầu kinh doanh cùng CT255
          </p>
        </div>

        <div className="p-8">
          {error && (
            <div className="mb-6 p-3 bg-error-container text-on-error-container text-sm rounded-lg flex items-center gap-2 border border-error/20">
              <span className="material-symbols-outlined text-lg">error</span>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <h3 className="font-bold text-lg mb-4 text-on-surface border-b border-outline-variant pb-2">
                1. Thông tin Gian hàng
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-label-md font-label-md text-on-surface block mb-1.5">
                    Tên Gian Hàng <span className="text-error">*</span>
                  </label>
                  <input
                    type="text"
                    name="gh_ten"
                    required
                    onChange={handleChange}
                    placeholder="VD: Shop Thời Trang A"
                    className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-lg text-body-md focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                  />
                </div>
                <div>
                  <label className="text-label-md font-label-md text-on-surface block mb-1.5">
                    Email đăng nhập <span className="text-error">*</span>
                  </label>
                  <input
                    type="email"
                    name="gh_email"
                    required
                    onChange={handleChange}
                    placeholder="shop@domain.com"
                    className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-lg text-body-md focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                  />
                </div>
              </div>
              <div className="mt-4">
                <label className="text-label-md font-label-md text-on-surface block mb-1.5">
                  Mô tả gian hàng
                </label>
                <textarea
                  name="gh_mota"
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-lg text-body-md focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                  rows="2"
                ></textarea>
              </div>
              <div className="mt-4">
                <label className="text-label-md font-label-md text-on-surface block mb-1.5">
                  Ảnh đại diện (Logo)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setSelectedFile(e.target.files[0])}
                  className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-600 hover:file:bg-orange-100 transition-all"
                />
              </div>
            </div>

            <div>
              <h3 className="font-bold text-lg mb-4 text-on-surface border-b border-outline-variant pb-2 mt-6">
                2. Địa chỉ liên hệ
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-label-md font-label-md text-on-surface block mb-1.5">
                    Tỉnh / Thành phố <span className="text-error">*</span>
                  </label>
                  <select
                    value={selectedTinh}
                    onChange={(e) => {
                      setSelectedTinh(e.target.value);
                      setSelectedXa("");
                    }}
                    className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-lg text-body-md focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                    required
                  >
                    <option value="">-- Chọn Tỉnh/Thành phố --</option>
                    {tinhs.map((tinh, index) => (
                      <option key={tinh.ma || index} value={tinh.ma}>
                        {tinh.ten}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-label-md font-label-md text-on-surface block mb-1.5">
                    Phường / Xã <span className="text-error">*</span>
                  </label>
                  <select
                    value={selectedXa}
                    onChange={(e) => setSelectedXa(e.target.value)}
                    className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-lg text-body-md focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all disabled:opacity-50"
                    required
                    disabled={!selectedTinh}
                  >
                    <option value="">-- Chọn Phường/Xã --</option>
                    {filteredXas.map((xa, index) => (
                      <option key={xa.ma || index} value={xa.ma}>
                        {xa.ten}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="mt-4">
                <label className="text-label-md font-label-md text-on-surface block mb-1.5">
                  Số nhà, tên đường <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  name="dc_mota"
                  required
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-lg text-body-md focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                  placeholder="VD: 123 Nguyễn Văn Cừ"
                />
              </div>
            </div>

            <div>
              <h3 className="font-bold text-lg mb-4 text-on-surface border-b border-outline-variant pb-2 mt-6">
                3. Bảo mật
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-label-md font-label-md text-on-surface block mb-1.5">
                    Mật khẩu <span className="text-error">*</span>
                  </label>
                  <input
                    type="password"
                    name="password"
                    required
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-lg text-body-md focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                  />
                </div>
                <div>
                  <label className="text-label-md font-label-md text-on-surface block mb-1.5">
                    Xác nhận mật khẩu <span className="text-error">*</span>
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    required
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-lg text-body-md focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold py-3.5 rounded-lg transition-all shadow-sm disabled:opacity-50 mt-4"
            >
              {loading ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-lg">
                    progress_activity
                  </span>
                  Đang xử lý...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-lg">
                    how_to_reg
                  </span>
                  Đăng Ký Gian Hàng
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center text-body-sm text-on-surface-variant border-t border-outline-variant/50 pt-6">
            Đã có tài khoản?{" "}
            <Link
              to="/nguoi-ban/login"
              className="text-orange-500 font-semibold hover:text-orange-600 transition-colors underline decoration-orange-500/30 underline-offset-4"
            >
              Đăng nhập ngay
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShopRegister;
