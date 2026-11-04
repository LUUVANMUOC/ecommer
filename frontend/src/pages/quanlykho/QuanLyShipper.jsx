import { useState, useEffect, useContext, useCallback } from "react";
import { AuthContext } from "../../contexts/AuthContext";
import qlkShipperService from "../../services/quanlykho/shipperService";
import { toAssetUrl } from "../../utils/accountUtils";
import ToastNotification from "../../components/common/Crud/ToastNotification";
import useLoaiShipper from "../../hooks/useLoaiShipper";

const EMPTY_FORM = {
  Shipper_Ma: "",
  Shipper_Ten: "",
  Shipper_SDT: "",
  Shipper_GioiTinh: "true",
  Shipper_NgaySinh: "",
  Shipper_HinhAnh: "",
  Lsp_Ma: "",
};

const LSP_BADGE = {
  LSP01: {
    bg: "bg-yellow-50",
    text: "text-yellow-700",
    border: "border-yellow-200",
    icon: "inventory_2",
  },
  LSP02: {
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
    icon: "local_shipping",
  },
  LSP03: {
    bg: "bg-green-50",
    text: "text-green-700",
    border: "border-green-200",
    icon: "delivery_dining",
  },
};
const FALLBACK_BADGE = {
  bg: "bg-gray-50",
  text: "text-gray-700",
  border: "border-gray-200",
  icon: "badge",
};

const QuanLyShipper = () => {
  const { user } = useContext(AuthContext);
  const kho_ma = user?.kho_ma;
  const kho_ten = user?.kho_ten || "Kho";

  const [shippers, setShippers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Lấy loại shipper động từ BE
  const { data: loaiShipperList, loading: loadingLoai } = useLoaiShipper();

  // ================= STATE MODAL =================
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [selectedFile, setSelectedFile] = useState(null);
  const [saving, setSaving] = useState(false);

  const [newAccountInfo, setNewAccountInfo] = useState(null);
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast((p) => ({ ...p, show: false })), 3000);
  };

  const fetchData = useCallback(async () => {
    if (!kho_ma) return;
    try {
      const res = await qlkShipperService.getAll(kho_ma);
      setShippers(res.data);
    } catch (err) {
      showToast("Lỗi tải danh sách shipper", "error");
    } finally {
      setLoading(false);
    }
  }, [kho_ma]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getLoaiLabel = useCallback(
    (lsp_ma) => {
      if (!lsp_ma) return "Chưa phân loại";
      const found = loaiShipperList.find((o) => o.Lshipper_Ma === lsp_ma);
      return found?.Lshipper_Ten || lsp_ma;
    },
    [loaiShipperList],
  );

  const handleOpenModal = (shipper = null) => {
    setSelectedFile(null);
    if (shipper) {
      setIsEditing(true);
      setFormData({
        Shipper_Ma: shipper.Shipper_Ma,
        Shipper_Ten: shipper.Shipper_Ten,
        Shipper_SDT: shipper.Shipper_SDT,
        Shipper_GioiTinh: shipper.Shipper_GioiTinh ? "true" : "false",
        Shipper_NgaySinh: shipper.Shipper_NgaySinh
          ? shipper.Shipper_NgaySinh.split("T")[0]
          : "",
        Shipper_HinhAnh: shipper.Shipper_HinhAnh,
        Lsp_Ma: shipper.Lsp_Ma || "",
      });
    } else {
      setIsEditing(false);
      setFormData(EMPTY_FORM);
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isEditing && !formData.Lsp_Ma)
      return showToast("Vui lòng chọn Loại Shipper!", "error");

    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("Kho_Ma", kho_ma);
      fd.append("Shipper_Ten", formData.Shipper_Ten);
      fd.append("Shipper_SDT", formData.Shipper_SDT);
      fd.append("Shipper_GioiTinh", formData.Shipper_GioiTinh);
      fd.append("Shipper_NgaySinh", formData.Shipper_NgaySinh);
      if (selectedFile) fd.append("hinhanh", selectedFile);

      if (isEditing) {
        await qlkShipperService.update(formData.Shipper_Ma, fd);
        showToast("Cập nhật shipper thành công!");
        setIsModalOpen(false);
        fetchData();
      } else {
        fd.append("Lsp_Ma", formData.Lsp_Ma);
        const res = await qlkShipperService.create(fd);
        setNewAccountInfo(res.data.data);
        setIsModalOpen(false);
        fetchData();
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Lỗi lưu dữ liệu", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (shipper_ma) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa shipper này?")) return;
    try {
      await qlkShipperService.delete(shipper_ma, kho_ma);
      showToast("Đã xóa shipper!");
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.message || "Lỗi khi xóa!", "error");
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    showToast("Đã copy!");
  };

  if (loading)
    return (
      <div className="p-10 text-center font-medium text-gray-500">
        Đang tải...
      </div>
    );

  return (
    <div className="p-6 bg-[#F8FAFC] min-h-screen">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A]">
            Quản Lý Shipper — {kho_ten}
          </h1>
          <p className="text-sm text-[#64748B] mt-1">
            Tạo và quản lý shipper thuộc kho của bạn
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-sm hover:bg-indigo-700 transition-colors flex items-center gap-1"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>{" "}
          Thêm Shipper Mới
        </button>
      </div>

      {/* BẢNG DANH SÁCH */}
      <div className="bg-white rounded-2xl shadow-sm border border-[#E2E8F0] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-[#F8FAFC] text-[#64748B] text-sm border-b border-[#E2E8F0]">
                <th className="p-4 font-semibold w-28">Mã</th>
                <th className="p-4 font-semibold w-20 text-center">Ảnh</th>
                <th className="p-4 font-semibold">Họ Tên & SĐT</th>
                <th className="p-4 font-semibold">Loại Shipper</th>
                <th className="p-4 font-semibold text-center w-32">Đánh Giá</th>
                <th className="p-4 font-semibold text-right w-28">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {shippers.map((sp) => {
                const badge = LSP_BADGE[sp.Lsp_Ma] || FALLBACK_BADGE;
                return (
                  <tr
                    key={sp.Shipper_Ma}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="p-4">
                      <span className="font-mono text-sm text-indigo-600 font-bold bg-indigo-50 px-2 py-1 rounded-md">
                        {sp.Shipper_Ma}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <img
                        src={toAssetUrl(sp.Shipper_HinhAnh)}
                        className="w-11 h-11 rounded-full object-cover border-2 border-white shadow-sm ring-1 ring-[#E2E8F0] mx-auto"
                        onError={(e) =>
                          (e.target.src =
                            "https://ui-avatars.com/api/?name=" +
                            sp.Shipper_Ten +
                            "&background=random&color=fff")
                        }
                      />
                    </td>
                    <td className="p-4">
                      <p className="font-bold text-[#0F172A] text-base">
                        {sp.Shipper_Ten}
                      </p>
                      <p className="text-sm text-[#64748B] mt-0.5 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">
                          call
                        </span>{" "}
                        {sp.Shipper_SDT}
                      </p>
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded border ${badge.bg} ${badge.text} ${badge.border}`}
                      >
                        <span className="material-symbols-outlined text-[12px]">
                          {badge.icon}
                        </span>
                        {sp.Lshipper_Ten || getLoaiLabel(sp.Lsp_Ma)}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-1 text-sm font-bold text-[#0F172A]">
                        <span
                          className="material-symbols-outlined text-[18px] text-[#F59E0B]"
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          star
                        </span>
                        {Number(sp.Shipper_DiemDanhGia).toFixed(1)}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenModal(sp)}
                          className="w-8 h-8 flex items-center justify-center bg-blue-50 text-[#2563EB] rounded-lg hover:bg-blue-100 transition-colors"
                          title="Sửa"
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            edit
                          </span>
                        </button>
                        <button
                          onClick={() => handleDelete(sp.Shipper_Ma)}
                          className="w-8 h-8 flex items-center justify-center bg-red-50 text-[#DC2626] rounded-lg hover:bg-red-100 transition-colors"
                          title="Xóa"
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            delete
                          </span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {shippers.length === 0 && (
                <tr>
                  <td colSpan="6" className="p-10 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center">
                      <span className="material-symbols-outlined text-5xl text-gray-300 mb-2">
                        person_search
                      </span>
                      <p>
                        Kho chưa có shipper nào. Nhấn "Thêm Shipper Mới" để tạo.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL THÊM/SỬA SHIPPER */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-[#E2E8F0] flex justify-between items-center sticky top-0 bg-white z-10">
              <h3 className="text-xl font-bold text-[#0F172A]">
                {isEditing ? "Cập Nhật Shipper" : "Thêm Shipper Mới"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-red-500"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1">
                    Họ Tên *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.Shipper_Ten}
                    onChange={(e) =>
                      setFormData({ ...formData, Shipper_Ten: e.target.value })
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-[#E2E8F0] outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">
                    Số điện thoại *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.Shipper_SDT}
                    onChange={(e) =>
                      setFormData({ ...formData, Shipper_SDT: e.target.value })
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-[#E2E8F0] outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1">
                    Ngày sinh *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.Shipper_NgaySinh}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        Shipper_NgaySinh: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-[#E2E8F0] outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">
                    Giới tính
                  </label>
                  <select
                    value={formData.Shipper_GioiTinh}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        Shipper_GioiTinh: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-[#E2E8F0] outline-none bg-white"
                  >
                    <option value="true">Nam</option>
                    <option value="false">Nữ</option>
                  </select>
                </div>
              </div>

              {/* Loại Shipper — động từ BE */}
              <div>
                <label className="block text-sm font-semibold mb-1">
                  Loại Shipper *{" "}
                  {isEditing && (
                    <span className="text-xs text-gray-400 font-normal">
                      (Không thể đổi sau khi tạo)
                    </span>
                  )}
                </label>
                {isEditing ? (
                  <div className="w-full px-4 py-2.5 rounded-xl border border-[#E2E8F0] bg-gray-50 text-sm flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-gray-400">
                      lock
                    </span>
                    <span className="font-semibold text-[#0F172A]">
                      {getLoaiLabel(formData.Lsp_Ma)}
                    </span>
                    <span className="text-xs text-gray-500 ml-auto font-mono">
                      {formData.Lsp_Ma}
                    </span>
                  </div>
                ) : (
                  <select
                    required
                    value={formData.Lsp_Ma}
                    onChange={(e) =>
                      setFormData({ ...formData, Lsp_Ma: e.target.value })
                    }
                    disabled={loadingLoai}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#E2E8F0] outline-none focus:border-indigo-500 bg-white disabled:bg-gray-100"
                  >
                    <option value="">
                      {loadingLoai ? "Đang tải..." : "-- Chọn loại Shipper --"}
                    </option>
                    {loaiShipperList.map((o) => (
                      <option key={o.Lshipper_Ma} value={o.Lshipper_Ma}>
                        {o.Lshipper_Ten} ({o.Lshipper_Ma})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">
                  Ảnh chân dung
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setSelectedFile(e.target.files[0])}
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-indigo-50 file:text-indigo-600"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t mt-4">
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
                  className="px-8 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 disabled:bg-gray-400"
                >
                  {saving
                    ? "Đang lưu..."
                    : isEditing
                      ? "Lưu Thay Đổi"
                      : "Tạo Tài Khoản"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL TÀI KHOẢN VỪA TẠO */}
      {newAccountInfo && (
        <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-xl text-center">
            <div className="p-6 border-b border-[#E2E8F0] bg-green-50">
              <span className="material-symbols-outlined text-5xl text-green-500 mb-2">
                check_circle
              </span>
              <h3 className="text-xl font-bold text-green-700">
                Tạo Tài Khoản Thành Công!
              </h3>
              <p className="text-sm text-green-600 mt-1">
                Vui lòng gửi thông tin này cho Shipper để đăng nhập.
              </p>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <p className="text-sm text-gray-500 text-left mb-1">
                  Mã Shipper
                </p>
                <p className="text-lg font-bold text-indigo-600 text-left bg-indigo-50 p-2 rounded">
                  {newAccountInfo.Shipper_Ma}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 text-left mb-1">
                  Loại Shipper
                </p>
                <p className="text-lg font-bold text-[#0F172A] text-left bg-gray-50 p-2 rounded">
                  {getLoaiLabel(newAccountInfo.Lsp_Ma)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 text-left mb-1">
                  Tên đăng nhập (SĐT)
                </p>
                <div className="flex gap-2">
                  <p className="flex-1 text-lg font-bold text-[#0F172A] text-left bg-gray-50 p-2 rounded">
                    {newAccountInfo.Shipper_SDT}
                  </p>
                  <button
                    onClick={() => copyToClipboard(newAccountInfo.Shipper_SDT)}
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
                className="w-full py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700"
              >
                Đã hiểu và Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      <ToastNotification toast={toast} />
    </div>
  );
};

export default QuanLyShipper;
