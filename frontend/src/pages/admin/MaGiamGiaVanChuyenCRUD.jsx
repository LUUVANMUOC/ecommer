// src/pages/admin/MaGiamGiaVanChuyenCRUD.jsx
import { useState, useEffect } from "react";
import maGiamGiaVanChuyenService from "../../services/san/maGiamGiaVanChuyenService";
import CrudDrawer from "../../components/common/Crud/CrudDrawer";
import CrudDataTable from "../../components/common/Crud/CrudDataTable";
import ToastNotification from "../../components/common/Crud/ToastNotification";
// Tái sử dụng UI
import VoucherCard from "../../components/common/Voucher/VoucherCard";
import VoucherDetailDrawer from "../../components/common/Voucher/VoucherDetailDrawer";
import VoucherToolbar from "../../components/common/Voucher/VoucherToolbar";
import VoucherForm from "../../components/common/Voucher/VoucherForm";

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

const MaGiamGiaVanChuyenCRUD = () => {
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
      console.error("Lỗi đọc thông tin user:", error);
    }
  }, []);

  // CHUYỂN TOÀN BỘ SANG TIỀN TỐ MGG_VC_
  const initialFormState = {
    MGG_VC_Ma: "",
    MGG_VC_Ten: "",
    MGG_VC_Mota: "",
    MGG_VC_HinhAnh: "",
    MGG_VC_TrangThai: true,
    MGG_VC_ThoiDiemBatDau: "",
    MGG_VC_ThoiDiemKetThuc: "",
    MGG_VC_GiaTriDonToiThieu: 0,
    MGG_VC_SoLuongConLai: 0,
    MGG_VC_PhanTramGiam: 0,
    MGG_VC_SoLuongBanDau: 100,
    MGG_VC_SoTienToiDaMoiLan: 0,
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
    if (document.activeElement instanceof HTMLElement)
      document.activeElement.blur();
    setIsDrawerOpen(false);
  };

  const handleCloseDetailDrawer = () => {
    if (document.activeElement instanceof HTMLElement)
      document.activeElement.blur();
    setIsDetailOpen(false);
  };

  const generateUniqueVoucherCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let isUnique = false;
    let newCode = "";
    while (!isUnique) {
      newCode = "VC"; // Đổi prefix thành VC cho vận chuyển
      for (let i = 0; i < 8; i++) {
        newCode += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      if (newCode.length > 10) newCode = newCode.substring(0, 10);
      const isExist = vouchers.some((v) => v.MGG_VC_Ma === newCode);
      if (!isExist) isUnique = true;
    }
    return newCode;
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await maGiamGiaVanChuyenService.getAll();
      const data = Array.isArray(res.data) ? res.data : res.data?.data || [];
      const cleanedData = data.map((v) => ({
        ...v,
        MGG_VC_HinhAnh: extractSingleImage(v.MGG_VC_HinhAnh),
      }));
      setVouchers(cleanedData);
    } catch (error) {
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
      MGG_VC_Ma: generateUniqueVoucherCode(),
      MGG_VC_SoLuongBanDau: 100,
      MGG_VC_SoLuongConLai: 100,
      MGG_VC_PhanTramGiam: 10,
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
      MGG_VC_HinhAnh: extractSingleImage(voucher.MGG_VC_HinhAnh),
      MGG_VC_ThoiDiemBatDau: formatDateForInput(voucher.MGG_VC_ThoiDiemBatDau),
      MGG_VC_ThoiDiemKetThuc: formatDateForInput(
        voucher.MGG_VC_ThoiDiemKetThuc,
      ),
    });
    setFormError("");
    setIsDrawerOpen(true);
  };

  const handleDelete = async (code, name) => {
    if (!code) return;
    if (window.confirm(`Bạn có chắc chắn muốn xóa mã "${name}" (${code})?`)) {
      try {
        await maGiamGiaVanChuyenService.delete(code);
        showToast(`Đã xóa mã ${code} thành công!`);
        fetchData();
      } catch (error) {
        showToast(error.response?.data?.message || "Lỗi khi xóa", "error");
      }
    }
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    if (!formData.MGG_VC_Ten)
      return setFormError("Vui lòng nhập Tên chương trình.");

    const phanTram = Number(formData.MGG_VC_PhanTramGiam);
    if (phanTram < 0 || phanTram > 100)
      return setFormError("Phần trăm giảm phải từ 0 đến 100.");

    if (
      Number(formData.MGG_VC_SoLuongConLai) >
      Number(formData.MGG_VC_SoLuongBanDau)
    ) {
      return setFormError(
        "Số lượng còn lại không được lớn hơn Tổng số lượng ban đầu.",
      );
    }

    // ✅ TỰ ĐỘNG BẬT LẠI TRẠNG THÁI NẾU THỎA MÃN
    const now = new Date();
    const start = formData.MGG_VC_ThoiDiemBatDau
      ? new Date(formData.MGG_VC_ThoiDiemBatDau)
      : null;
    const end = formData.MGG_VC_ThoiDiemKetThuc
      ? new Date(formData.MGG_VC_ThoiDiemKetThuc)
      : null;
    const qty = Number(formData.MGG_VC_SoLuongConLai);

    let calculatedStatus = formData.MGG_VC_TrangThai;
    if ((!start || now >= start) && (!end || now <= end) && qty > 0) {
      calculatedStatus = true;
    } else {
      calculatedStatus = false;
    }

    try {
      const dataToSend = new FormData();

      // Cập nhật lại biến tạm trước khi gửi
      const dataToSendObj = { ...formData, MGG_VC_TrangThai: calculatedStatus };

      Object.keys(dataToSendObj).forEach((key) => {
        if (
          key !== "MGG_VC_HinhAnh" &&
          dataToSendObj[key] !== null &&
          dataToSendObj[key] !== undefined
        ) {
          dataToSend.append(key, dataToSendObj[key]);
        }
      });

      if (imageFile) dataToSend.append("image", imageFile);

      if (editingVoucher) {
        await maGiamGiaVanChuyenService.update(
          editingVoucher.MGG_VC_Ma,
          dataToSend,
        );
        showToast(`Cập nhật mã ${formData.MGG_VC_Ma} thành công!`);
      } else {
        await maGiamGiaVanChuyenService.create(dataToSend);
        showToast(`Tạo mới mã ${formData.MGG_VC_Ma} thành công!`);
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

  const filteredVouchers = vouchers.filter((v) => {
    if (filterStatus === "valid") return v.MGG_VC_TrangThai === true;
    if (filterStatus === "invalid") return v.MGG_VC_TrangThai === false;
    return true;
  });

  const tableColumns = [
    {
      key: "MGG_VC_Ma",
      label: "Mã",
      render: (item) => (
        <span className="font-mono font-bold text-primary">
          {item.MGG_VC_Ma}
        </span>
      ),
    },
    {
      key: "MGG_VC_Ten",
      label: "Tên chương trình",
      render: (item) => (
        <span className="font-medium text-on-surface">{item.MGG_VC_Ten}</span>
      ),
    },
    {
      key: "MGG_VC_PhanTramGiam",
      label: "Giảm giá",
      render: (item) => (
        <span className="font-semibold text-primary">
          {item.MGG_VC_PhanTramGiam}%
        </span>
      ),
    },
    {
      key: "MGG_VC_SoLuongConLai",
      label: "SL Còn lại / Tổng",
      render: (item) => (
        <span>
          <strong className="text-primary">{item.MGG_VC_SoLuongConLai}</strong>{" "}
          / {item.MGG_VC_SoLuongBanDau}
        </span>
      ),
    },
    {
      key: "MGG_VC_TrangThai",
      label: "Trạng thái",
      render: (item) => (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${item.MGG_VC_TrangThai ? "text-tertiary-container bg-tertiary-fixed/60" : "text-error bg-error-container/60"}`}
        >
          {item.MGG_VC_TrangThai ? "Kích hoạt" : "Hết hiệu lực"}
        </span>
      ),
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
              Không có mã giảm giá vận chuyển nào.
            </div>
          ) : (
            filteredVouchers.map((voucher, index) => (
              <VoucherCard
                key={voucher.MGG_VC_Ma || `voucher-${index}`}
                voucher={{
                  MGG_San_Ma: voucher.MGG_VC_Ma,
                  MGG_San_Ten: voucher.MGG_VC_Ten,
                  MGG_San_HinhAnh: voucher.MGG_VC_HinhAnh,
                  MGG_San_PhanTramGiam: voucher.MGG_VC_PhanTramGiam,
                  MGG_San_SoLuongConLai: voucher.MGG_VC_SoLuongConLai,
                  MGG_San_SoLuongBanDau: voucher.MGG_VC_SoLuongBanDau,
                  MGG_San_GiaTriDonToiThieu: voucher.MGG_VC_GiaTriDonToiThieu,
                  MGG_San_TrangThai: voucher.MGG_VC_TrangThai,
                  MGG_San_ThoiDiemBatDau: voucher.MGG_VC_ThoiDiemBatDau,
                  MGG_San_ThoiDiemKetThuc: voucher.MGG_VC_ThoiDiemKetThuc,
                }}
                onEdit={() => handleOpenEdit(voucher)}
                onDelete={() =>
                  handleDelete(voucher.MGG_VC_Ma, voucher.MGG_VC_Ten)
                }
                onView={() => handleViewDetail(voucher)}
                onCopy={() => handleCopyCode(voucher.MGG_VC_Ma)}
              />
            ))
          )}
        </section>
      ) : (
        <CrudDataTable
          columns={tableColumns}
          data={filteredVouchers}
          loading={loading}
          keyField="MGG_VC_Ma"
          nameField="MGG_VC_Ten"
          onEdit={handleOpenEdit}
          onDelete={(item) => handleDelete(item.MGG_VC_Ma, item.MGG_VC_Ten)}
          onRowClick={handleViewDetail}
        />
      )}

      <CrudDrawer
        isOpen={isDrawerOpen}
        onClose={handleCloseDrawer}
        title={editingVoucher ? "Chỉnh Sửa Mã VC" : "Thêm Mã VC Mới"}
        description="Mã giảm giá vận chuyển"
        isEditing={!!editingVoucher}
        onSubmit={handleSave}
        error={formError}
      >
        <VoucherForm
          formData={{
            MGG_San_Ma: formData.MGG_VC_Ma,
            MGG_San_Ten: formData.MGG_VC_Ten,
            MGG_San_Mota: formData.MGG_VC_Mota,
            MGG_San_TrangThai: formData.MGG_VC_TrangThai,
            MGG_San_ThoiDiemBatDau: formData.MGG_VC_ThoiDiemBatDau,
            MGG_San_ThoiDiemKetThuc: formData.MGG_VC_ThoiDiemKetThuc,
            MGG_San_GiaTriDonToiThieu: formData.MGG_VC_GiaTriDonToiThieu,
            MGG_San_SoLuongConLai: formData.MGG_VC_SoLuongConLai,
            MGG_San_PhanTramGiam: formData.MGG_VC_PhanTramGiam,
            MGG_San_SoLuongBanDau: formData.MGG_VC_SoLuongBanDau,
            MGG_San_SoTienToiDaMoiLan: formData.MGG_VC_SoTienToiDaMoiLan,
          }}
          handleInputChange={(e) => {
            const { name, value, type, checked } = e.target;
            const vcName = name.replace("MGG_San_", "MGG_VC_");
            setFormData((prev) => ({
              ...prev,
              [vcName]: type === "checkbox" ? checked : value,
            }));
          }}
          imageFile={imageFile}
          setImageFile={setImageFile}
          setFormData={setFormData}
        />
      </CrudDrawer>

      <VoucherDetailDrawer
        isOpen={isDetailOpen}
        onClose={handleCloseDetailDrawer}
        voucher={
          selectedVoucher
            ? {
                MGG_San_Ma: selectedVoucher.MGG_VC_Ma,
                MGG_San_Ten: selectedVoucher.MGG_VC_Ten,
                MGG_San_Mota: selectedVoucher.MGG_VC_Mota,
                MGG_San_HinhAnh: selectedVoucher.MGG_VC_HinhAnh,
                MGG_San_TrangThai: selectedVoucher.MGG_VC_TrangThai,
                MGG_San_ThoiDiemBatDau: selectedVoucher.MGG_VC_ThoiDiemBatDau,
                MGG_San_ThoiDiemKetThuc: selectedVoucher.MGG_VC_ThoiDiemKetThuc,
                MGG_San_GiaTriDonToiThieu:
                  selectedVoucher.MGG_VC_GiaTriDonToiThieu,
                MGG_San_SoLuongConLai: selectedVoucher.MGG_VC_SoLuongConLai,
                MGG_San_PhanTramGiam: selectedVoucher.MGG_VC_PhanTramGiam,
                MGG_San_SoLuongBanDau: selectedVoucher.MGG_VC_SoLuongBanDau,
                MGG_San_SoTienToiDaMoiLan:
                  selectedVoucher.MGG_VC_SoTienToiDaMoiLan,
              }
            : null
        }
      />

      <ToastNotification toast={toast} />
    </div>
  );
};

export default MaGiamGiaVanChuyenCRUD;
