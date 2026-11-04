// src/pages/admin/MaGiamGiaSanCRUD.jsx
import { useState, useEffect } from "react";
import maGiamGiaSanService from "../../services/san/maGiamGiaSanService";
import CrudDrawer from "../../components/common/Crud/CrudDrawer";
import CrudDataTable from "../../components/common/Crud/CrudDataTable";
import ToastNotification from "../../components/common/Crud/ToastNotification";
import VoucherCard from "../../components/common/Voucher/VoucherCard";
import VoucherDetailDrawer from "../../components/common/Voucher/VoucherDetailDrawer";
import VoucherToolbar from "../../components/common/Voucher/VoucherToolbar";
import VoucherForm from "../../components/common/Voucher/VoucherForm";

// Hàm phụ trợ: Trích xuất 1 ảnh duy nhất (Phòng trường hợp API cũ trả về mảng JSON)
const extractSingleImage = (imgData) => {
  if (!imgData) return "";
  if (Array.isArray(imgData)) return imgData[0] || "";
  if (typeof imgData === "string" && imgData.startsWith("[")) {
    try {
      const parsed = JSON.parse(imgData);
      return Array.isArray(parsed) && parsed.length > 0 ? parsed[0] : "";
    } catch (e) {
      return imgData;
    }
  }
  return imgData;
};

const MaGiamGiaSanCRUD = () => {
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("grid");
  const [filterStatus, setFilterStatus] = useState("all");

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState(null);
  const [selectedVoucher, setSelectedVoucher] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [currentMerchantId, setCurrentMerchantId] = useState("");

  useEffect(() => {
    try {
      const userStr = localStorage.getItem("user");
      if (userStr) {
        const user = JSON.parse(userStr);
        setCurrentMerchantId(user.STMDT_Ma || user.maSan || "SAN_MAC_DINH");
      }
    } catch (error) {
      console.error("Lỗi đọc thông tin user từ localStorage:", error);
    }
  }, []);

  const initialFormState = {
    MGG_San_Ma: "",
    MGG_San_Ten: "",
    MGG_San_Mota: "",
    MGG_San_HinhAnh: "",
    MGG_San_TrangThai: true,
    MGG_San_ThoiDiemBatDau: "",
    MGG_San_ThoiDiemKetThuc: "",
    MGG_San_GiaTriDonToiThieu: 0,
    MGG_San_SoLuongConLai: 0,
    MGG_San_PhanTramGiam: 0,
    MGG_San_SoLuongBanDau: 100,
    MGG_San_SoTienToiDaMoiLan: 0,
    STMDT_Ma: "",
  };

  const [formData, setFormData] = useState(initialFormState);
  const [formError, setFormError] = useState("");
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 3000);
  };

  const handleCloseDrawer = () => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    setIsDrawerOpen(false);
  };

  const handleCloseDetailDrawer = () => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    setIsDetailOpen(false);
  };

  const generateUniqueVoucherCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let isUnique = false;
    let newCode = "";
    while (!isUnique) {
      newCode = "VCH";
      for (let i = 0; i < 7; i++) {
        newCode += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      const isExist = vouchers.some((v) => v.MGG_San_Ma === newCode);
      if (!isExist) isUnique = true;
    }
    return newCode;
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await maGiamGiaSanService.getAll();
      const data = Array.isArray(res.data) ? res.data : res.data?.data || [];

      const cleanedData = data.map((v) => ({
        ...v,
        MGG_San_HinhAnh: extractSingleImage(v.MGG_San_HinhAnh),
      }));

      setVouchers(cleanedData);
    } catch (error) {
      console.error("Lỗi tải dữ liệu:", error);
      showToast("Không thể tải dữ liệu từ máy chủ", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenAdd = () => {
    setEditingVoucher(null);
    setImageFile(null);
    setFormData({
      ...initialFormState,
      MGG_San_Ma: generateUniqueVoucherCode(),
      MGG_San_SoLuongBanDau: 100,
      MGG_San_SoLuongConLai: 100,
      MGG_San_PhanTramGiam: 10,
      STMDT_Ma: currentMerchantId,
    });
    setFormError("");
    setIsDrawerOpen(true);
  };

  const handleOpenEdit = (voucher) => {
    setEditingVoucher(voucher);
    setImageFile(null);
    const formatDateForInput = (dateStr) => {
      if (!dateStr) return "";
      const date = new Date(dateStr);
      const tzOffset = date.getTimezoneOffset() * 60000;
      return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
    };

    setFormData({
      ...voucher,
      MGG_San_HinhAnh: extractSingleImage(voucher.MGG_San_HinhAnh),
      MGG_San_ThoiDiemBatDau: formatDateForInput(
        voucher.MGG_San_ThoiDiemBatDau,
      ),
      MGG_San_ThoiDiemKetThuc: formatDateForInput(
        voucher.MGG_San_ThoiDiemKetThuc,
      ),
    });
    setFormError("");
    setIsDrawerOpen(true);
  };

  const handleDelete = async (code, name) => {
    if (!code) return;
    if (
      window.confirm(
        `Bạn có chắc chắn muốn xóa mã giảm giá "${name}" (${code})?`,
      )
    ) {
      try {
        await maGiamGiaSanService.delete(code);
        showToast(`Đã xóa mã ${code} thành công!`);
        fetchData();
      } catch (error) {
        showToast(error.response?.data?.message || "Lỗi khi xóa", "error");
      }
    }
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    if (!formData.MGG_San_Ten)
      return setFormError("Vui lòng nhập Tên chương trình.");

    const phanTram = Number(formData.MGG_San_PhanTramGiam);
    if (phanTram < 0 || phanTram > 100)
      return setFormError("Phần trăm giảm phải từ 0 đến 100.");

    if (
      Number(formData.MGG_San_SoLuongConLai) >
      Number(formData.MGG_San_SoLuongBanDau)
    ) {
      return setFormError(
        "Số lượng còn lại không được lớn hơn Tổng số lượng ban đầu.",
      );
    }

    // ✅ TỰ ĐỘNG BẬT LẠI TRẠNG THÁI NẾU THỎA MÃN
    const now = new Date();
    const start = formData.MGG_San_ThoiDiemBatDau
      ? new Date(formData.MGG_San_ThoiDiemBatDau)
      : null;
    const end = formData.MGG_San_ThoiDiemKetThuc
      ? new Date(formData.MGG_San_ThoiDiemKetThuc)
      : null;
    const qty = Number(formData.MGG_San_SoLuongConLai);

    let calculatedStatus = formData.MGG_San_TrangThai;
    if ((!start || now >= start) && (!end || now <= end) && qty > 0) {
      calculatedStatus = true;
    }

    try {
      const dataToSend = new FormData();

      // Cập nhật lại biến tạm trước khi gửi
      const dataToSendObj = {
        ...formData,
        MGG_San_TrangThai: calculatedStatus,
      };

      Object.keys(dataToSendObj).forEach((key) => {
        if (
          key !== "MGG_San_HinhAnh" &&
          dataToSendObj[key] !== null &&
          dataToSendObj[key] !== undefined
        ) {
          dataToSend.append(key, dataToSendObj[key]);
        }
      });

      if (imageFile) {
        dataToSend.append("image", imageFile);
      }

      if (editingVoucher) {
        await maGiamGiaSanService.update(editingVoucher.MGG_San_Ma, dataToSend);
        showToast(`Cập nhật mã ${formData.MGG_San_Ma} thành công!`);
      } else {
        await maGiamGiaSanService.create(dataToSend);
        showToast(`Tạo mới mã ${formData.MGG_San_Ma} thành công!`);
      }
      handleCloseDrawer();
      setImageFile(null);
      fetchData();
    } catch (error) {
      setFormError(
        error.response?.data?.message || "Có lỗi xảy ra khi lưu dữ liệu.",
      );
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleViewDetail = (voucher) => {
    setSelectedVoucher(voucher);
    setIsDetailOpen(true);
  };

  const handleCopyCode = (code) => {
    if (!code) return;
    navigator.clipboard?.writeText(code);
    showToast(`Đã sao chép mã [${code}]`);
  };

  // SỬ DỤNG TRỰC TIẾP TRẠNG THÁI TỪ BACKEND (Đã được tính toán chuẩn xác)
  const filteredVouchers = vouchers.filter((v) => {
    if (filterStatus === "valid") return v.MGG_San_TrangThai === true;
    if (filterStatus === "invalid") return v.MGG_San_TrangThai === false;
    return true;
  });

  const tableColumns = [
    {
      key: "MGG_San_Ma",
      label: "MGG_San_Ma",
      render: (item) => (
        <span className="font-mono font-bold text-primary">
          {item.MGG_San_Ma}
        </span>
      ),
    },
    {
      key: "MGG_San_Ten",
      label: "Tên chương trình",
      render: (item) => (
        <span className="font-medium text-on-surface">{item.MGG_San_Ten}</span>
      ),
    },
    {
      key: "MGG_San_PhanTramGiam",
      label: "Giảm giá",
      render: (item) => (
        <span className="font-semibold text-primary">
          {item.MGG_San_PhanTramGiam}%
        </span>
      ),
    },
    {
      key: "MGG_San_SoLuongConLai",
      label: "SL Còn lại / Tổng",
      render: (item) => (
        <span>
          <strong className="text-primary">{item.MGG_San_SoLuongConLai}</strong>{" "}
          / {item.MGG_San_SoLuongBanDau}
        </span>
      ),
    },
    {
      key: "MGG_San_TrangThai",
      label: "Trạng thái",
      render: (item) => {
        // Hiển thị dựa trên trạng thái đã được Backend tính toán
        return (
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${item.MGG_San_TrangThai ? "text-tertiary-container bg-tertiary-fixed/60" : "text-error bg-error-container/60"}`}
          >
            {item.MGG_San_TrangThai ? "Kích hoạt" : "Hết hiệu lực"}
          </span>
        );
      },
    },
  ];

  return (
    <div className="h-full flex flex-col p-6 space-y-6 overflow-y-auto bg-background">
      <VoucherToolbar
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        viewMode={viewMode}
        setViewMode={setViewMode}
        onAdd={handleOpenAdd}
      />

      {viewMode === "grid" ? (
        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {loading ? (
            <div className="col-span-full text-center py-10 text-outline">
              Đang tải dữ liệu...
            </div>
          ) : filteredVouchers.length === 0 ? (
            <div className="col-span-full text-center py-10 text-outline">
              Không có mã giảm giá nào phù hợp với bộ lọc.
            </div>
          ) : (
            filteredVouchers.map((voucher, index) => (
              <VoucherCard
                key={voucher.MGG_San_Ma || `voucher-${index}`}
                voucher={voucher}
                onEdit={handleOpenEdit}
                onDelete={handleDelete}
                onView={handleViewDetail}
                onCopy={handleCopyCode}
              />
            ))
          )}
        </section>
      ) : (
        <CrudDataTable
          columns={tableColumns}
          data={filteredVouchers}
          loading={loading}
          keyField="MGG_San_Ma"
          nameField="MGG_San_Ten"
          onEdit={handleOpenEdit}
          onDelete={handleDelete}
          onRowClick={handleViewDetail}
        />
      )}

      <CrudDrawer
        isOpen={isDrawerOpen}
        onClose={handleCloseDrawer}
        title={
          editingVoucher ? "Chỉnh Sửa Mã Giảm Giá" : "Thêm Mã Giảm Giá Mới"
        }
        description="Cơ sở dữ liệu: bảng MaGiamGiaSan"
        isEditing={!!editingVoucher}
        onSubmit={handleSave}
        error={formError}
      >
        <VoucherForm
          formData={formData}
          handleInputChange={handleInputChange}
          imageFile={imageFile}
          setImageFile={setImageFile}
          setFormData={setFormData}
        />
      </CrudDrawer>

      <VoucherDetailDrawer
        isOpen={isDetailOpen}
        onClose={handleCloseDetailDrawer}
        voucher={selectedVoucher}
      />

      <ToastNotification toast={toast} />
    </div>
  );
};

export default MaGiamGiaSanCRUD;
