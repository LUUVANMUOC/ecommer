// src/components/account/DiaChiNhanHangSection.jsx
import { useState, useEffect } from "react";
import {
  FormField,
  fieldBase,
  btnPrimary,
  btnSecondary,
} from "./AccountLayout";
import thongTinNhanHangService from "../../services/khachhang/thongTinNhanHangService";
import addressService from "../../services/san/addressService";
import ToastNotification from "../common/Crud/ToastNotification";

export const DiaChiNhanHangSection = ({ kh_ma }) => {
  const [addresses, setAddresses] = useState([]);
  const [tinhs, setTinhs] = useState([]);
  const [xas, setXas] = useState([]);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    ttnh_ten: "",
    ttnh_sdt: "",
    tinh_ma: "",
    xa_ma: "",
    dc_mota: "",
    ttnh_ghichu: "",
    ttnh_lamacdinh: false,
  });
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

  useEffect(() => {
    addressService.getAllTinh().then((res) => setTinhs(res.data));
    addressService.getAllXa().then((res) => setXas(res.data));
    fetchAddresses();
  }, [kh_ma]);

  const fetchAddresses = () => {
    if (!kh_ma) return;
    thongTinNhanHangService.getAll(kh_ma).then((res) => setAddresses(res.data));
  };

  const handleOpenForm = (dc = null) => {
    if (dc) {
      setFormData({
        ttnh_ten: dc.ttnh_ten,
        ttnh_sdt: dc.ttnh_sdt,
        tinh_ma: dc.tinh_ma,
        xa_ma: dc.xa_ma,
        dc_mota: dc.dc_mota,
        ttnh_ghichu: dc.ttnh_ghichu || "",
        ttnh_lamacdinh: dc.ttnh_lamacdinh,
      });
      setEditingId(dc.ttnh_ma);
    } else {
      setFormData({
        ttnh_ten: "",
        ttnh_sdt: "",
        tinh_ma: "",
        xa_ma: "",
        dc_mota: "",
        ttnh_ghichu: "",
        ttnh_lamacdinh: false,
      });
      setEditingId(null);
    }
    setIsFormOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.tinh_ma || !formData.xa_ma)
      return showToast("Vui lòng chọn đủ Tỉnh/Xã", "error");

    try {
      // Lấy tên Tỉnh/Xã để tạo snapshot
      const tinh_ten = tinhs.find(
        (t) => t.tinh_ma === formData.tinh_ma,
      )?.tinh_ten;
      const xa_ten = xas.find((x) => x.xa_ma === formData.xa_ma)?.xa_ten;

      const payload = { ...formData, kh_ma, tinh_ten, xa_ten };

      if (editingId) {
        await thongTinNhanHangService.update(editingId, payload);
        showToast("Cập nhật thành công!");
      } else {
        await thongTinNhanHangService.create(payload);
        showToast("Thêm địa chỉ thành công!");
      }
      setIsFormOpen(false);
      fetchAddresses();
    } catch (err) {
      showToast(err.response?.data?.message || "Lỗi khi lưu địa chỉ", "error");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Xóa địa chỉ này?")) return;
    try {
      await thongTinNhanHangService.delete(id);
      showToast("Đã xóa");
      fetchAddresses();
    } catch (err) {
      showToast("Lỗi khi xóa", "error");
    }
  };

  const handleSetDefault = async (id) => {
    try {
      await thongTinNhanHangService.setDefault(kh_ma, id);
      showToast("Đã đặt làm mặc định");
      fetchAddresses();
    } catch (err) {
      showToast("Lỗi khi đặt mặc định", "error");
    }
  };

  const filteredXas = xas.filter((x) => x.tinh_ma === formData.tinh_ma);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-semibold text-[#14201C]">
          Danh sách địa chỉ nhận hàng
        </h3>
        {!isFormOpen && (
          <button
            onClick={() => handleOpenForm()}
            className={`${btnPrimary} px-4 py-2 text-sm`}
          >
            + Thêm địa chỉ mới
          </button>
        )}
      </div>

      {isFormOpen && (
        <div className="bg-[#FBF8F1] p-6 rounded-xl border border-[#F1E6CF] mb-6">
          <h4 className="font-semibold mb-4 text-[#14201C]">
            {editingId ? "Sửa địa chỉ" : "Thêm địa chỉ mới"}
          </h4>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Tên người nhận" required>
                <input
                  type="text"
                  value={formData.ttnh_ten}
                  onChange={(e) =>
                    setFormData({ ...formData, ttnh_ten: e.target.value })
                  }
                  className={fieldBase}
                  required
                />
              </FormField>
              <FormField label="Số điện thoại" required>
                <input
                  type="text"
                  value={formData.ttnh_sdt}
                  onChange={(e) =>
                    setFormData({ ...formData, ttnh_sdt: e.target.value })
                  }
                  className={fieldBase}
                  required
                />
              </FormField>
              <FormField label="Tỉnh/Thành phố" required>
                <select
                  value={formData.tinh_ma}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      tinh_ma: e.target.value,
                      xa_ma: "",
                    })
                  }
                  className={fieldBase}
                  required
                >
                  <option value="">-- Chọn Tỉnh/Thành --</option>
                  {tinhs.map((t) => (
                    <option key={t.tinh_ma} value={t.tinh_ma}>
                      {t.tinh_ten}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField label="Phường/Xã" required>
                <select
                  value={formData.xa_ma}
                  onChange={(e) =>
                    setFormData({ ...formData, xa_ma: e.target.value })
                  }
                  className={fieldBase}
                  required
                  disabled={!formData.tinh_ma}
                >
                  <option value="">-- Chọn Phường/Xã --</option>
                  {filteredXas.map((x) => (
                    <option key={x.xa_ma} value={x.xa_ma}>
                      {x.xa_ten}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField label="Địa chỉ cụ thể" required>
                <input
                  type="text"
                  value={formData.dc_mota}
                  onChange={(e) =>
                    setFormData({ ...formData, dc_mota: e.target.value })
                  }
                  className={fieldBase}
                  placeholder="Số nhà, tên đường..."
                  required
                />
              </FormField>
              <FormField label="Ghi chú">
                <input
                  type="text"
                  value={formData.ttnh_ghichu}
                  onChange={(e) =>
                    setFormData({ ...formData, ttnh_ghichu: e.target.value })
                  }
                  className={fieldBase}
                  placeholder="Ghi chú cho người giao hàng..."
                />
              </FormField>
              <div className="flex items-center gap-2 pt-6 md:col-span-2">
                <input
                  type="checkbox"
                  id="macdinh"
                  checked={formData.ttnh_lamacdinh}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      ttnh_lamacdinh: e.target.checked,
                    })
                  }
                  className="w-4 h-4 accent-[#F2A93B]"
                />
                <label htmlFor="macdinh" className="text-sm cursor-pointer">
                  Đặt làm địa chỉ mặc định
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className={btnSecondary}
              >
                Hủy
              </button>
              <button type="submit" className={btnPrimary}>
                Lưu địa chỉ
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {addresses.map((addr) => (
          <div
            key={addr.ttnh_ma}
            className="border border-[#E2DED3] rounded-xl p-4 bg-[#FBFAF7] relative"
          >
            {addr.ttnh_lamacdinh && (
              <span className="absolute top-3 right-3 text-[10px] font-bold text-[#B42318] border border-[#B42318] px-1.5 py-0.5 rounded">
                Mặc định
              </span>
            )}
            <p className="font-bold text-[#14201C]">
              {addr.ttnh_ten}{" "}
              <span className="text-gray-500 font-normal">
                | {addr.ttnh_sdt}
              </span>
            </p>
            <p className="text-sm text-gray-600 mt-1">
              {addr.ttnh_diachisnapshot}
            </p>
            {addr.ttnh_ghichu && (
              <p className="text-xs text-gray-500 italic mt-1">
                Ghi chú: {addr.ttnh_ghichu}
              </p>
            )}
            <div className="flex gap-3 mt-4 pt-3 border-t border-[#EFEBE2] text-sm">
              <button
                onClick={() => handleOpenForm(addr)}
                className="text-blue-500 hover:underline"
              >
                Sửa
              </button>
              {!addr.ttnh_lamacdinh && (
                <>
                  <button
                    onClick={() => handleSetDefault(addr.ttnh_ma)}
                    className="text-[#F2A93B] hover:underline"
                  >
                    Đặt mặc định
                  </button>
                  <button
                    onClick={() => handleDelete(addr.ttnh_ma)}
                    className="text-red-500 hover:underline"
                  >
                    Xóa
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
        {addresses.length === 0 && !isFormOpen && (
          <div className="col-span-full text-center py-6 text-gray-500 border border-dashed rounded-xl">
            Chưa có địa chỉ nhận hàng nào.
          </div>
        )}
      </div>
      <ToastNotification toast={toast} />
    </div>
  );
};
