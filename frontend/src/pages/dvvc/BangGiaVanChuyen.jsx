// src/pages/dvvc/BangGiaVanChuyen.jsx
import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../../contexts/AuthContext";
import bangGiaVanChuyenService from "../../services/dvvc/bangGiaVanChuyenService";
import ToastNotification from "../../components/common/Crud/ToastNotification";
import CrudDrawer from "../../components/common/Crud/CrudDrawer";

// Component EditableCell riêng cho Giá tiền
const PriceCell = ({ value, onSave }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value);

  useEffect(() => {
    setTempValue(value);
  }, [value]);

  const handleSave = () => {
    setIsEditing(false);
    if (Number(tempValue) !== Number(value)) {
      onSave(tempValue);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSave();
    if (e.key === "Escape") {
      setTempValue(value);
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <input
        type="number"
        autoFocus
        className="w-full h-full p-2 text-center outline-none border-2 border-emerald-500 rounded bg-white text-gray-800 font-semibold"
        value={tempValue}
        onChange={(e) => setTempValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
      />
    );
  }

  return (
    <div
      onClick={() => setIsEditing(true)}
      className="w-full h-full p-2 cursor-pointer hover:bg-orange-100 transition-colors flex items-center justify-center font-semibold text-gray-700 min-h-[40px]"
      title="Click để sửa giá"
    >
      {Number(value) === 0
        ? "0 đ"
        : Number(value).toLocaleString("vi-VN") + " đ"}
    </div>
  );
};

const EMPTY_FORM_KL = {
  klkh_ten: "",
  klkh_mota: "",
  klkh_trongluongmin: 0,
  klkh_trongluongmax: "",
};

const BangGiaVanChuyen = () => {
  const { user } = useContext(AuthContext);
  const dvvc_ma = user?.dvvc_ma || user?.DVVC_Ma || "DVVC000001";

  const [loading, setLoading] = useState(true);
  const [khoiLuongList, setKhoiLuongList] = useState([]);
  const [khuVucList, setKhuVucList] = useState([]);
  const [tuyenList, setTuyenList] = useState([]);

  const [bangGia, setBangGia] = useState({});
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingKL, setEditingKL] = useState(null);
  const [formKL, setFormKL] = useState(EMPTY_FORM_KL);
  const [formError, setFormError] = useState("");

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast((p) => ({ ...p, show: false })), 3000);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resForm, resGia] = await Promise.all([
        bangGiaVanChuyenService.getFormData(),
        bangGiaVanChuyenService.getBangGia(dvvc_ma),
      ]);

      setKhoiLuongList(resForm.data.khoiLuong);
      setKhuVucList(resForm.data.khuVuc);
      setTuyenList(resForm.data.tuyen);

      const giaObj = {};
      resGia.data.forEach((item) => {
        giaObj[`${item.kvvc_ma}_${item.tvc_ma}_${item.klkh_ma}`] = Number(
          item.cpvc_gia,
        );
      });
      setBangGia(giaObj);
    } catch (error) {
      showToast("Lỗi tải dữ liệu bảng giá", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (dvvc_ma) fetchData();
  }, [dvvc_ma]);

  const handleUpdateGia = async (kvvc_ma, tvc_ma, klkh_ma, giaMoi) => {
    const soGia = giaMoi === "" ? 0 : parseFloat(giaMoi);
    if (isNaN(soGia) || soGia < 0)
      return showToast("Giá phải là số dương", "error");

    try {
      await bangGiaVanChuyenService.updateGia({
        kvvc_ma,
        tvc_ma,
        klkh_ma,
        dvvc_ma,
        cpvc_gia: soGia,
      });
      setBangGia((prev) => ({
        ...prev,
        [`${kvvc_ma}_${tvc_ma}_${klkh_ma}`]: soGia,
      }));
      showToast("Đã lưu giá mới!");
    } catch (error) {
      showToast("Lỗi khi lưu giá", "error");
    }
  };

  const handleOpenKL = (kl = null) => {
    if (kl) {
      setEditingKL(kl);
      setFormKL({
        klkh_ten: kl.klkh_ten || "",
        klkh_mota: kl.klkh_mota || "",
        klkh_trongluongmin: kl.klkh_trongluongmin ?? 0,
        // Nếu từ DB trả về null, gán thành chuỗi rỗng để hiển thị trên input
        klkh_trongluongmax: kl.klkh_trongluongmax ?? "",
      });
    } else {
      setEditingKL(null);
      setFormKL({ ...EMPTY_FORM_KL });
    }
    setFormError("");
    setIsDrawerOpen(true);
  };

  const handleSaveKL = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!formKL.klkh_ten.trim())
      return setFormError("Vui lòng nhập Tên hiển thị");
    if (!formKL.klkh_mota.trim())
      return setFormError("Vui lòng nhập Mô tả (VD: Từ 1kg đến 1.5kg)");

    const min = Number(formKL.klkh_trongluongmin);
    // Nếu chuỗi rỗng, gán max = null. Ngược lại thì ép kiểu số.
    const max =
      formKL.klkh_trongluongmax === ""
        ? null
        : Number(formKL.klkh_trongluongmax);

    if (isNaN(min) || min < 0)
      return setFormError("Trọng lượng Min không hợp lệ");
    if (max !== null && (isNaN(max) || max < min))
      return setFormError(
        "Trọng lượng Max phải lớn hơn hoặc bằng Min (hoặc bỏ trống)",
      );

    try {
      const payload = {
        ...formKL,
        klkh_trongluongmin: min,
        klkh_trongluongmax: max, // Gửi null xuống Backend
      };

      if (editingKL) {
        await bangGiaVanChuyenService.updateKhoiLuong(
          editingKL.klkh_ma,
          payload,
        );
        showToast("Cập nhật mốc khối lượng thành công!");
      } else {
        await bangGiaVanChuyenService.createKhoiLuong(payload);
        showToast("Thêm mốc khối lượng thành công!");
      }
      setIsDrawerOpen(false);
      fetchData();
    } catch (error) {
      setFormError(error.response?.data?.message || "Lỗi khi lưu khối lượng.");
    }
  };

  const handleDeleteKL = async (id) => {
    // ✅ Đã cập nhật thông báo cảnh báo xóa luôn cước phí
    if (
      !window.confirm(
        "Bạn có chắc muốn xóa mốc khối lượng này? TẤT CẢ cước phí vận chuyển liên quan đến mốc này cũng sẽ bị xóa vĩnh viễn!",
      )
    )
      return;
    try {
      await bangGiaVanChuyenService.deleteKhoiLuong(id);
      showToast("Đã xóa mốc khối lượng và các cước phí liên quan");
      fetchData();
    } catch (error) {
      showToast(
        error.response?.data?.message || "Lỗi khi xóa khối lượng.",
        "error",
      );
    }
  };

  return (
    <div className="w-full p-6 space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-[#E2DED3]">
        <div>
          <h1 className="text-2xl font-bold text-[#14201C]">
            Bảng Giá Vận Chuyển
          </h1>
          <p className="text-sm text-[#7A857F]">
            Cấu hình cước phí giao hàng theo Khu vực, Tuyến và Khối lượng.
          </p>
        </div>
        <button
          onClick={() => handleOpenKL()}
          className="px-4 py-2 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition shadow-sm"
        >
          + Thêm mốc Khối lượng
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-[#E2DED3] overflow-hidden shadow-sm overflow-x-auto">
        <table className="w-full text-center border-collapse min-w-[1000px]">
          <thead>
            <tr className="bg-[#ea580c] text-white">
              <th
                rowSpan="2"
                className="border border-[#c2410c] p-3 w-48 font-bold bg-[#c2410c]"
              >
                Khối lượng (kg)
              </th>
              {tuyenList.map((tvc) => (
                <th
                  key={tvc.tvc_ma}
                  colSpan={khuVucList.length}
                  className="border border-[#c2410c] p-2 font-bold"
                >
                  {tvc.tvc_ten}
                </th>
              ))}
              <th
                rowSpan="2"
                className="border border-[#c2410c] p-2 w-24 font-bold bg-gray-100 text-gray-700"
              >
                Thao tác
              </th>
            </tr>
            <tr className="bg-[#fcd34d] text-[#78350f]">
              {tuyenList.map((tvc) =>
                khuVucList.map((kv) => (
                  <th
                    key={`${tvc.tvc_ma}_${kv.kvvc_ma}`}
                    className="border border-[#c2410c] p-2 text-sm w-28"
                  >
                    {kv.kvvc_ten}
                  </th>
                )),
              )}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={10} className="p-8">
                  Đang tải dữ liệu...
                </td>
              </tr>
            ) : (
              khoiLuongList.map((kl) => {
                // ✅ KIỂM TRA NẾU KHÔNG CÓ MAX (NULL hoặc 0)
                const isNoMax =
                  !kl.klkh_trongluongmax || Number(kl.klkh_trongluongmax) === 0;

                const displayName = isNoMax
                  ? "Mỗi 0,5kg tiếp theo"
                  : kl.klkh_ten;
                const bgColor = isNoMax ? "bg-[#FDE8B9]" : "bg-orange-50";

                return (
                  <tr key={kl.klkh_ma} className="hover:bg-orange-50/30">
                    <td
                      className={`border border-[#E2DED3] p-3 font-bold text-[#ea580c] ${bgColor} text-left`}
                    >
                      {displayName}
                    </td>
                    {tuyenList.map((tvc) =>
                      khuVucList.map((kv) => {
                        const cellKey = `${kv.kvvc_ma}_${tvc.tvc_ma}_${kl.klkh_ma}`;
                        return (
                          <td
                            key={cellKey}
                            className="border border-[#E2DED3] p-0"
                          >
                            <PriceCell
                              value={bangGia[cellKey] || 0}
                              onSave={(val) =>
                                handleUpdateGia(
                                  kv.kvvc_ma,
                                  tvc.tvc_ma,
                                  kl.klkh_ma,
                                  val,
                                )
                              }
                            />
                          </td>
                        );
                      }),
                    )}
                    <td className="border border-[#E2DED3] p-2 bg-gray-50">
                      <div className="flex justify-center gap-1">
                        <button
                          onClick={() => handleOpenKL(kl)}
                          className="p-1 text-blue-500 hover:bg-blue-50 rounded"
                          title="Sửa"
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            edit
                          </span>
                        </button>
                        <button
                          onClick={() => handleDeleteKL(kl.klkh_ma)}
                          className="p-1 text-red-500 hover:bg-red-50 rounded"
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
              })
            )}
          </tbody>
        </table>
      </div>

      <CrudDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title={editingKL ? "Sửa Mốc Khối Lượng" : "Thêm Mốc Khối Lượng"}
        onSubmit={handleSaveKL}
        isEditing={!!editingKL}
        error={formError}
      >
        <div className="space-y-4">
          {!editingKL && (
            <div className="bg-blue-50 text-blue-700 p-3 rounded-lg text-sm border border-blue-200 flex items-start gap-2">
              <span className="material-symbols-outlined text-[18px]">
                info
              </span>
              <p>
                Hệ thống sẽ tự động sinh Mã khối lượng (VD: KL05, KL06...). Bạn
                không cần nhập mã.
              </p>
            </div>
          )}

          <label className="block">
            <span className="text-sm font-semibold text-gray-700">
              Tên hiển thị <span className="text-red-500">*</span>
            </span>
            <input
              type="text"
              value={formKL.klkh_ten}
              onChange={(e) =>
                setFormKL({ ...formKL, klkh_ten: e.target.value })
              }
              className="w-full mt-1 p-2 border rounded-lg focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
              placeholder="VD: Trên 2.5 - 3kg"
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-gray-700">
              Mô tả <span className="text-red-500">*</span>
            </span>
            <input
              type="text"
              value={formKL.klkh_mota}
              onChange={(e) =>
                setFormKL({ ...formKL, klkh_mota: e.target.value })
              }
              className="w-full mt-1 p-2 border rounded-lg focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
              placeholder="VD: Áp dụng cho gói hàng từ 2.5kg đến 3kg"
            />
          </label>

          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="text-sm font-semibold text-gray-700">
                Trọng lượng Min (kg) <span className="text-red-500">*</span>
              </span>
              <input
                type="number"
                step="0.1"
                min="0"
                value={formKL.klkh_trongluongmin}
                onChange={(e) =>
                  setFormKL({ ...formKL, klkh_trongluongmin: e.target.value })
                }
                className="w-full mt-1 p-2 border rounded-lg focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
              />
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-gray-700">
                Trọng lượng Max (kg)
              </span>
              <input
                type="number"
                step="0.1"
                min="0"
                value={formKL.klkh_trongluongmax}
                onChange={(e) =>
                  setFormKL({ ...formKL, klkh_trongluongmax: e.target.value })
                }
                className="w-full mt-1 p-2 border rounded-lg focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                placeholder="Để trống nếu là mốc 'tiếp theo'"
              />
            </label>
          </div>
          <p className="text-xs text-gray-500 italic mt-2">
            * Lưu ý: Nếu bạn để trống ô "Trọng lượng Max", hệ thống sẽ tự hiểu
            đây là dòng "Mỗi 0,5kg tiếp theo" và tô màu vàng tương ứng.
          </p>
        </div>
      </CrudDrawer>

      <ToastNotification toast={toast} />
    </div>
  );
};

export default BangGiaVanChuyen;
