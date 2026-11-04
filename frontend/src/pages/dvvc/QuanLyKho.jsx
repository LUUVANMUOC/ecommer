import { useState, useEffect, useContext, useCallback, useMemo } from "react";
import { AuthContext } from "../../contexts/AuthContext";
import axiosClient from "../../config/axiosClient";
import dvvcKhoService from "../../services/dvvc/dvvcKhoService";
import ToastNotification from "../../components/common/Crud/ToastNotification";
import { toAssetUrl } from "../../utils/accountUtils";

const EMPTY_FORM = {
  Kho_Ma: "",
  Kho_Ten: "",
  Kho_HinhAnh: "",
  DC_MoTa: "",
  DC_GPS: "",
  Tinh_Ma: "",
  Xa_Ma: "",
};

// ✅ Bảng màu đa dạng
const AVATAR_COLORS = [
  "#EF4444",
  "#F97316",
  "#F59E0B",
  "#10B981",
  "#06B6D4",
  "#3B82F6",
  "#6366F1",
  "#8B5CF6",
  "#D946EF",
  "#EC4899",
];

// Hàm tạo màu ngẫu nhiên nhưng cố định dựa trên chuỗi (Mã Kho)
const getRandomColor = (str) => {
  let hash = 0;
  const stringToHash = str || "KhoMacDinh";
  for (let i = 0; i < stringToHash.length; i++) {
    hash = stringToHash.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
};

const QuanLyKho = () => {
  const { user } = useContext(AuthContext);
  const DVVC_Ma = user?.DVVC_Ma || user?.dvvc_ma || user?.id;

  const [khoList, setKhoList] = useState([]);
  const [tinhs, setTinhs] = useState([]);
  const [xas, setXas] = useState([]);

  const [loadingTinhXa, setLoadingTinhXa] = useState(true);
  const [loadingKho, setLoadingKho] = useState(false);

  // State Bộ lọc
  const [filterTinh, setFilterTinh] = useState("");
  const [filterXa, setFilterXa] = useState("");

  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });
  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(
      () => setToast({ show: false, message: "", type: "success" }),
      3000,
    );
  };

  // State Form & Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [selectedFile, setSelectedFile] = useState(null);
  const [saving, setSaving] = useState(false);

  // ✅ State lưu thông tin tài khoản kho vừa tạo để hiện Modal
  const [newAccountInfo, setNewAccountInfo] = useState(null);

  // 1. Chỉ load Tỉnh/Xã khi mới vào trang
  useEffect(() => {
    const fetchTinhXa = async () => {
      try {
        const [resTinh, resXa] = await Promise.all([
          axiosClient.get("/tinh"),
          axiosClient.get("/xa"),
        ]);
        setTinhs(resTinh.data);
        setXas(resXa.data);
      } catch (err) {
        showToast("Lỗi tải dữ liệu Tỉnh/Xã", "error");
      } finally {
        setLoadingTinhXa(false);
      }
    };
    fetchTinhXa();
  }, []);

  // 2. Chỉ load danh sách Kho khi chọn Bộ lọc
  const fetchKhoData = useCallback(async () => {
    if (!filterTinh) {
      setKhoList([]);
      return;
    }
    setLoadingKho(true);
    try {
      const res = await dvvcKhoService.getAll(DVVC_Ma, filterTinh, filterXa);
      setKhoList(res.data);
    } catch (err) {
      showToast("Lỗi tải danh sách kho", "error");
    } finally {
      setLoadingKho(false);
    }
  }, [DVVC_Ma, filterTinh, filterXa]);

  useEffect(() => {
    fetchKhoData();
  }, [fetchKhoData]);

  // Lấy danh sách Xã cho bộ lọc
  const filterXas = useMemo(() => {
    return xas.filter((xa) => String(xa.tinh_ma) === String(filterTinh));
  }, [xas, filterTinh]);

  // Lấy danh sách Xã cho Form thêm/sửa kho
  const formXas = useMemo(() => {
    return xas.filter((xa) => String(xa.tinh_ma) === String(formData.Tinh_Ma));
  }, [xas, formData.Tinh_Ma]);

  const handleOpenModal = (kho = null) => {
    setSelectedFile(null);
    if (kho) {
      setIsEditing(true);
      setFormData({
        Kho_Ma: kho.Kho_Ma,
        Kho_Ten: kho.Kho_Ten,
        Kho_HinhAnh: kho.Kho_HinhAnh,
        DC_MoTa: kho.DC_MoTa,
        DC_GPS: kho.DC_GPS || "",
        Tinh_Ma: kho.Tinh_Ma,
        Xa_Ma: kho.Xa_Ma,
      });
    } else {
      setIsEditing(false);
      setFormData(EMPTY_FORM);
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.Tinh_Ma || !formData.Xa_Ma)
      return showToast("Vui lòng chọn đầy đủ Tỉnh/Xã!", "error");
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("DVVC_Ma", DVVC_Ma);
      fd.append("Kho_Ten", formData.Kho_Ten);
      fd.append("DC_MoTa", formData.DC_MoTa);
      fd.append("DC_GPS", formData.DC_GPS);
      fd.append("Xa_Ma", formData.Xa_Ma);
      if (selectedFile) fd.append("hinhanh", selectedFile);

      if (isEditing) {
        await dvvcKhoService.update(formData.Kho_Ma, fd);
        showToast("Cập nhật thành công!");
        setIsModalOpen(false);
        fetchKhoData();
      } else {
        const res = await dvvcKhoService.create(fd);

        // ✅ Xử lý lấy thông tin tài khoản trả về (Kho_Ma + PlainPassword)
        const resultData = res.data.data || res.data;
        if (resultData && resultData.PlainPassword) {
          setNewAccountInfo(resultData);
        } else {
          showToast(
            "Thêm kho thành công nhưng không lấy được mật khẩu!",
            "warning",
          );
        }

        setIsModalOpen(false);
        if (!filterTinh) {
          setFilterTinh(formData.Tinh_Ma);
        } else {
          fetchKhoData();
        }
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Lỗi lưu dữ liệu", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (kho_ma) => {
    if (!window.confirm("Bạn có chắc muốn xóa kho này?")) return;
    try {
      await dvvcKhoService.delete(kho_ma);
      showToast("Đã xóa kho!");
      fetchKhoData();
    } catch (err) {
      showToast("Lỗi khi xóa kho!", "error");
    }
  };

  // Hàm Copy
  const copyToClipboard = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    showToast("Đã copy!");
  };

  if (loadingTinhXa)
    return (
      <div className="p-10 text-center font-medium text-gray-500">
        Đang tải dữ liệu...
      </div>
    );

  return (
    <div className="p-6 bg-[#F8FAFC] min-h-screen flex flex-col h-screen">
      {/* HEADER & BỘ LỌC */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-[#0F172A]">
            Quản Lý Kho Hàng
          </h2>
          <p className="text-sm text-[#64748B] mt-1">
            Vui lòng chọn khu vực để xem danh sách kho
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Bộ lọc Tỉnh */}
          <select
            value={filterTinh}
            onChange={(e) => {
              setFilterTinh(e.target.value);
              setFilterXa("");
            }}
            className="px-4 py-2.5 rounded-xl border border-[#E2E8F0] outline-none text-sm bg-white min-w-[200px]"
          >
            <option value="">-- Chọn Tỉnh/Thành --</option>
            {tinhs.map((t) => (
              <option key={t.tinh_ma} value={t.tinh_ma}>
                {t.tinh_ten}
              </option>
            ))}
          </select>

          {/* Bộ lọc Xã */}
          <select
            value={filterXa}
            onChange={(e) => setFilterXa(e.target.value)}
            disabled={!filterTinh}
            className="px-4 py-2.5 rounded-xl border border-[#E2E8F0] outline-none text-sm bg-white disabled:bg-gray-100 min-w-[200px]"
          >
            <option value="">-- Tất cả Xã/Phường --</option>
            {filterXas.map((x) => (
              <option key={x.xa_ma} value={x.xa_ma}>
                {x.xa_ten}
              </option>
            ))}
          </select>

          <button
            onClick={() => handleOpenModal()}
            className="px-5 py-2.5 bg-[#2563EB] text-white rounded-xl text-sm font-bold shadow-sm hover:bg-[#1D4ED8] transition-colors whitespace-nowrap"
          >
            + Thêm Kho Mới
          </button>
        </div>
      </div>

      {/* DANH SÁCH KHO */}
      <div className="flex-1 bg-white rounded-3xl shadow-sm border border-[#E2E8F0] p-6 overflow-y-auto custom-scrollbar">
        {!filterTinh ? (
          <div className="h-full flex flex-col items-center justify-center text-[#64748B]">
            <span className="material-symbols-outlined text-6xl mb-4 text-[#CBD5E1]">
              location_on
            </span>
            <p className="text-lg font-medium text-[#0F172A]">
              Chưa chọn khu vực
            </p>
            <p className="text-sm mt-1">
              Vui lòng chọn Tỉnh/Thành phố ở góc trên để hiển thị danh sách kho.
            </p>
          </div>
        ) : loadingKho ? (
          <div className="h-full flex flex-col items-center justify-center text-[#64748B]">
            <span className="material-symbols-outlined text-4xl mb-2 animate-spin">
              progress_activity
            </span>
            <p>Đang tải danh sách kho...</p>
          </div>
        ) : khoList.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-[#64748B]">
            <span className="material-symbols-outlined text-6xl mb-4 text-[#CBD5E1]">
              inventory_2
            </span>
            <p className="text-lg font-medium text-[#0F172A]">
              Không tìm thấy kho nào
            </p>
            <p className="text-sm mt-1">
              Chưa có kho hàng nào trong khu vực này.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {khoList.map((kho) => {
              const bgColor = getRandomColor(kho.Kho_Ma);

              return (
                <div
                  key={kho.Kho_Ma}
                  className="bg-white rounded-2xl shadow-sm border border-[#E2E8F0] p-4 flex items-center justify-between hover:border-[#2563EB] transition-all"
                >
                  {/* BÊN TRÁI: ẢNH/AVATAR VÀ THÔNG TIN */}
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    {kho.Kho_HinhAnh && kho.Kho_HinhAnh.trim() !== "" ? (
                      <img
                        src={toAssetUrl(kho.Kho_HinhAnh)}
                        className="w-14 h-14 object-cover rounded-xl border border-[#F1F5F9] shrink-0"
                        alt={kho.Kho_Ten}
                        onError={(e) => {
                          e.target.style.display = "none";
                          e.target.nextSibling.style.display = "flex";
                        }}
                      />
                    ) : null}

                    <div
                      className={`w-14 h-14 rounded-xl flex items-center justify-center text-white font-bold text-[10px] text-center p-1 leading-tight break-words shrink-0 ${
                        kho.Kho_HinhAnh && kho.Kho_HinhAnh.trim() !== ""
                          ? "hidden"
                          : "flex"
                      }`}
                      style={{ backgroundColor: bgColor }}
                    >
                      {kho.Kho_Ten}
                    </div>

                    <div className="min-w-0 pr-4">
                      <h3 className="font-bold text-[#0F172A] text-base truncate">
                        {kho.Kho_Ten}
                      </h3>
                      <p className="text-sm text-[#64748B] truncate mt-0.5">
                        {kho.DC_MoTa}, {kho.Xa_Ten}, {kho.Tinh_Ten}
                      </p>
                    </div>
                  </div>

                  {/* BÊN PHẢI: CÁC NÚT THAO TÁC */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleOpenModal(kho)}
                      className="px-4 py-2 text-sm font-semibold text-[#2563EB] bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors"
                    >
                      Sửa
                    </button>
                    <button
                      onClick={() => handleDelete(kho.Kho_Ma)}
                      className="px-4 py-2 text-sm font-semibold text-[#DC2626] bg-red-50 rounded-xl hover:bg-red-100 transition-colors"
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL THÊM/SỬA */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="p-6 border-b border-[#E2E8F0] flex justify-between items-center sticky top-0 bg-white z-10">
              <h3 className="text-xl font-bold text-[#0F172A]">
                {isEditing ? "Cập Nhật Kho" : "Thêm Kho Mới"}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-red-500"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-[#334155] mb-1">
                    Tên Kho <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.Kho_Ten}
                    onChange={(e) =>
                      setFormData({ ...formData, Kho_Ten: e.target.value })
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-[#E2E8F0] outline-none focus:border-[#2563EB]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#334155] mb-1">
                    Ảnh Kho
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setSelectedFile(e.target.files[0])}
                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-[#2563EB] hover:file:bg-blue-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-[#334155] mb-1">
                    Tỉnh / Thành Phố <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.Tinh_Ma}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        Tinh_Ma: e.target.value,
                        Xa_Ma: "",
                      })
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-[#E2E8F0] outline-none focus:border-[#2563EB] bg-white"
                  >
                    <option value="">-- Chọn Tỉnh/Thành --</option>
                    {tinhs.map((t) => (
                      <option key={t.tinh_ma} value={t.tinh_ma}>
                        {t.tinh_ten}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#334155] mb-1">
                    Xã / Phường <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.Xa_Ma}
                    onChange={(e) =>
                      setFormData({ ...formData, Xa_Ma: e.target.value })
                    }
                    disabled={!formData.Tinh_Ma}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#E2E8F0] outline-none focus:border-[#2563EB] bg-white disabled:bg-gray-100"
                  >
                    <option value="">-- Chọn Xã/Phường --</option>
                    {formXas.map((x) => (
                      <option key={x.xa_ma} value={x.xa_ma}>
                        {x.xa_ten}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#334155] mb-1">
                  Địa chỉ chi tiết <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.DC_MoTa}
                  onChange={(e) =>
                    setFormData({ ...formData, DC_MoTa: e.target.value })
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E2E8F0] outline-none focus:border-[#2563EB]"
                  placeholder="VD: 123 Nguyễn Văn Cừ"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#334155] mb-1">
                  Link Google Maps
                </label>
                <input
                  type="url"
                  value={formData.DC_GPS}
                  onChange={(e) =>
                    setFormData({ ...formData, DC_GPS: e.target.value })
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E2E8F0] outline-none focus:border-[#2563EB]"
                  placeholder="https://www.google.com/maps/dir/?api=1&destination=..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2.5 rounded-xl font-semibold text-[#64748B] hover:bg-gray-100"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-8 py-2.5 bg-[#2563EB] text-white rounded-xl font-bold hover:bg-[#1D4ED8]"
                >
                  {saving ? "Đang lưu..." : "Lưu Thông Tin"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ✅ MODAL HIỂN THỊ TÀI KHOẢN KHO VỪA TẠO */}
      {newAccountInfo && (
        <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-xl text-center">
            <div className="p-6 border-b border-[#E2E8F0] bg-green-50">
              <span className="material-symbols-outlined text-5xl text-green-500 mb-2">
                check_circle
              </span>
              <h3 className="text-xl font-bold text-green-700">
                Tạo Kho Thành Công!
              </h3>
              <p className="text-sm text-green-600 mt-1">
                Vui lòng gửi thông tin này cho Quản lý kho để đăng nhập.
              </p>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <p className="text-sm text-gray-500 text-left mb-1">
                  Mã Kho (Tên đăng nhập)
                </p>
                <div className="flex gap-2">
                  <p className="flex-1 text-lg font-bold text-[#2563EB] text-left bg-blue-50 p-2 rounded">
                    {newAccountInfo.Kho_Ma}
                  </p>
                  <button
                    onClick={() => copyToClipboard(newAccountInfo.Kho_Ma)}
                    className="px-3 bg-gray-200 rounded hover:bg-gray-300 text-sm font-semibold"
                  >
                    Copy
                  </button>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-500 text-left mb-1">
                  Mật khẩu (Chỉ hiển thị 1 lần)
                </p>
                <div className="flex gap-2">
                  <p className="flex-1 text-lg font-bold text-red-600 tracking-widest text-left bg-red-50 p-2 rounded">
                    {newAccountInfo.PlainPassword}
                  </p>
                  <button
                    onClick={() =>
                      copyToClipboard(newAccountInfo.PlainPassword)
                    }
                    className="px-3 bg-gray-200 rounded hover:bg-gray-300 text-sm font-semibold"
                  >
                    Copy
                  </button>
                </div>
              </div>
            </div>

            <div className="p-4 bg-gray-50 border-t">
              <button
                onClick={() => setNewAccountInfo(null)}
                className="w-full py-2.5 bg-[#2563EB] text-white rounded-xl font-bold hover:bg-[#1D4ED8]"
              >
                Đã hiểu và Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      <ToastNotification toast={toast} />

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94A3B8; }
      `}</style>
    </div>
  );
};

export default QuanLyKho;
