// src/pages/shop/MaGiamGiaShopCRUD.jsx
import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../../contexts/AuthContext";
import maGiamGiaShopService from "../../services/gianhang/maGiamGiaShopService";
import CrudDrawer from "../../components/common/Crud/CrudDrawer";
import CrudDataTable from "../../components/common/Crud/CrudDataTable";
import ToastNotification from "../../components/common/Crud/ToastNotification";
// Tái sử dụng UI Voucher
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

const MaGiamGiaShopCRUD = () => {
  const { user } = useContext(AuthContext);
  const currentShopId = user?.GH_Ma || user?.gh_ma || "";

  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("grid");
  const [filterStatus, setFilterStatus] = useState("all");

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState(null);
  const [selectedVoucher, setSelectedVoucher] = useState(null);
  const [imageFile, setImageFile] = useState(null);

  const initialFormState = {
    MGG_Shop_Ma: "",
    MGG_Shop_Ten: "",
    MGG_Shop_Mota: "",
    MGG_Shop_HinhAnh: "",
    MGG_Shop_TrangThai: true,
    MGG_Shop_ThoiDiemBatDau: "",
    MGG_Shop_ThoiDiemKetThuc: "",
    MGG_Shop_GiaTriDonToiThieu: 0,
    MGG_Shop_SoLuongConLai: 0,
    MGG_Shop_PhanTramGiam: 0,
    MGG_Shop_SoLuongBanDau: 100,
    MGG_Shop_SoTienToiDaMoiLan: 0,
    GH_Ma: currentShopId,
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
      newCode = "SHOP";
      for (let i = 0; i < 6; i++) {
        newCode += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      const isExist = vouchers.some((v) => v.MGG_Shop_Ma === newCode);
      if (!isExist) isUnique = true;
    }
    return newCode;
  };

  const fetchData = async () => {
    if (!currentShopId) return;
    try {
      setLoading(true);
      const res = await maGiamGiaShopService.getAllByShop(currentShopId);
      const data = Array.isArray(res.data) ? res.data : [];
      const cleanedData = data.map((v) => ({
        ...v,
        MGG_Shop_HinhAnh: extractSingleImage(v.MGG_Shop_HinhAnh),
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
  }, [currentShopId]);

  const handleOpenAdd = () => {
    setEditingVoucher(null);
    setImageFile(null);
    setFormData({
      ...initialFormState,
      MGG_Shop_Ma: generateUniqueVoucherCode(),
      MGG_Shop_SoLuongBanDau: 100,
      MGG_Shop_SoLuongConLai: 100,
      MGG_Shop_PhanTramGiam: 10,
      GH_Ma: currentShopId,
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
      MGG_Shop_HinhAnh: extractSingleImage(voucher.MGG_Shop_HinhAnh),
      MGG_Shop_ThoiDiemBatDau: formatDateForInput(
        voucher.MGG_Shop_ThoiDiemBatDau,
      ),
      MGG_Shop_ThoiDiemKetThuc: formatDateForInput(
        voucher.MGG_Shop_ThoiDiemKetThuc,
      ),
    });
    setFormError("");
    setIsDrawerOpen(true);
  };

  const handleDelete = async (code, name) => {
    if (!code) return;
    if (window.confirm(`Bạn có chắc chắn muốn xóa mã "${name}" (${code})?`)) {
      try {
        await maGiamGiaShopService.delete(code);
        showToast(`Đã xóa mã ${code} thành công!`);
        fetchData();
      } catch (error) {
        showToast(error.response?.data?.message || "Lỗi khi xóa", "error");
      }
    }
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    if (!formData.MGG_Shop_Ten)
      return setFormError("Vui lòng nhập Tên chương trình.");

    const phanTram = Number(formData.MGG_Shop_PhanTramGiam);
    if (phanTram < 0 || phanTram > 100)
      return setFormError("Phần trăm giảm phải từ 0 đến 100.");

    if (
      Number(formData.MGG_Shop_SoLuongConLai) >
      Number(formData.MGG_Shop_SoLuongBanDau)
    ) {
      return setFormError(
        "Số lượng còn lại không được lớn hơn Tổng số lượng ban đầu.",
      );
    }

    // ✅ TỰ ĐỘNG TÍNH TOÁN LẠI TRẠNG THÁI TRƯỚC KHI GỬI LÊN
    const now = new Date();
    const start = formData.MGG_Shop_ThoiDiemBatDau
      ? new Date(formData.MGG_Shop_ThoiDiemBatDau)
      : null;
    const end = formData.MGG_Shop_ThoiDiemKetThuc
      ? new Date(formData.MGG_Shop_ThoiDiemKetThuc)
      : null;
    const qty = Number(formData.MGG_Shop_SoLuongConLai);

    let calculatedStatus = formData.MGG_Shop_TrangThai;
    if ((!start || now >= start) && (!end || now <= end) && qty > 0) {
      calculatedStatus = true;
    } else {
      calculatedStatus = false;
    }

    try {
      const dataToSend = new FormData();
      const dataToSendObj = {
        ...formData,
        MGG_Shop_TrangThai: calculatedStatus,
      };

      Object.keys(dataToSendObj).forEach((key) => {
        if (
          key !== "MGG_Shop_HinhAnh" &&
          dataToSendObj[key] !== null &&
          dataToSendObj[key] !== undefined
        ) {
          dataToSend.append(key, dataToSendObj[key]);
        }
      });

      if (imageFile) dataToSend.append("image", imageFile);

      if (editingVoucher) {
        await maGiamGiaShopService.update(
          editingVoucher.MGG_Shop_Ma,
          dataToSend,
        );
        showToast(`Cập nhật mã ${formData.MGG_Shop_Ma} thành công!`);
      } else {
        await maGiamGiaShopService.create(dataToSend);
        showToast(`Tạo mới mã ${formData.MGG_Shop_Ma} thành công!`);
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
    if (filterStatus === "valid") return v.MGG_Shop_TrangThai === true;
    if (filterStatus === "invalid") return v.MGG_Shop_TrangThai === false;
    return true;
  });

  const tableColumns = [
    {
      key: "MGG_Shop_Ma",
      label: "Mã",
      render: (item) => (
        <span className="font-mono font-bold text-primary">
          {item.MGG_Shop_Ma}
        </span>
      ),
    },
    {
      key: "MGG_Shop_Ten",
      label: "Tên chương trình",
      render: (item) => (
        <span className="font-medium text-on-surface">{item.MGG_Shop_Ten}</span>
      ),
    },
    {
      key: "MGG_Shop_PhanTramGiam",
      label: "Giảm giá",
      render: (item) => (
        <span className="font-semibold text-primary">
          {item.MGG_Shop_PhanTramGiam}%
        </span>
      ),
    },
    {
      key: "MGG_Shop_SoLuongConLai",
      label: "SL Còn lại / Tổng",
      render: (item) => (
        <span>
          <strong className="text-primary">
            {item.MGG_Shop_SoLuongConLai}
          </strong>{" "}
          / {item.MGG_Shop_SoLuongBanDau}
        </span>
      ),
    },
    {
      key: "MGG_Shop_TrangThai",
      label: "Trạng thái",
      render: (item) => (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${item.MGG_Shop_TrangThai ? "text-tertiary-container bg-tertiary-fixed/60" : "text-error bg-error-container/60"}`}
        >
          {item.MGG_Shop_TrangThai ? "Kích hoạt" : "Hết hiệu lực"}
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
              Chưa có mã giảm giá nào.
            </div>
          ) : (
            filteredVouchers.map((voucher, index) => (
              <VoucherCard
                key={voucher.MGG_Shop_Ma || `voucher-${index}`}
                voucher={{
                  MGG_San_Ma: voucher.MGG_Shop_Ma,
                  MGG_San_Ten: voucher.MGG_Shop_Ten,
                  MGG_San_HinhAnh: voucher.MGG_Shop_HinhAnh,
                  MGG_San_PhanTramGiam: voucher.MGG_Shop_PhanTramGiam,
                  MGG_San_SoLuongConLai: voucher.MGG_Shop_SoLuongConLai,
                  MGG_San_SoLuongBanDau: voucher.MGG_Shop_SoLuongBanDau,
                  MGG_San_GiaTriDonToiThieu: voucher.MGG_Shop_GiaTriDonToiThieu,
                  MGG_San_TrangThai: voucher.MGG_Shop_TrangThai,
                  MGG_San_ThoiDiemBatDau: voucher.MGG_Shop_ThoiDiemBatDau,
                  MGG_San_ThoiDiemKetThuc: voucher.MGG_Shop_ThoiDiemKetThuc,
                }}
                onEdit={() => handleOpenEdit(voucher)}
                onDelete={() =>
                  handleDelete(voucher.MGG_Shop_Ma, voucher.MGG_Shop_Ten)
                }
                onView={() => handleViewDetail(voucher)}
                onCopy={() => handleCopyCode(voucher.MGG_Shop_Ma)}
              />
            ))
          )}
        </section>
      ) : (
        <CrudDataTable
          columns={tableColumns}
          data={filteredVouchers}
          loading={loading}
          keyField="MGG_Shop_Ma"
          nameField="MGG_Shop_Ten"
          onEdit={handleOpenEdit}
          onDelete={(item) => handleDelete(item.MGG_Shop_Ma, item.MGG_Shop_Ten)}
          onRowClick={handleViewDetail}
        />
      )}

      <CrudDrawer
        isOpen={isDrawerOpen}
        onClose={handleCloseDrawer}
        title={
          editingVoucher ? "Chỉnh Sửa Mã Giảm Giá" : "Thêm Mã Giảm Giá Mới"
        }
        description="Mã giảm giá do Shop tự tạo"
        isEditing={!!editingVoucher}
        onSubmit={handleSave}
        error={formError}
      >
        <VoucherForm
          formData={{
            MGG_San_Ma: formData.MGG_Shop_Ma,
            MGG_San_Ten: formData.MGG_Shop_Ten,
            MGG_San_Mota: formData.MGG_Shop_Mota,
            MGG_San_TrangThai: formData.MGG_Shop_TrangThai,
            MGG_San_ThoiDiemBatDau: formData.MGG_Shop_ThoiDiemBatDau,
            MGG_San_ThoiDiemKetThuc: formData.MGG_Shop_ThoiDiemKetThuc,
            MGG_San_GiaTriDonToiThieu: formData.MGG_Shop_GiaTriDonToiThieu,
            MGG_San_SoLuongConLai: formData.MGG_Shop_SoLuongConLai,
            MGG_San_PhanTramGiam: formData.MGG_Shop_PhanTramGiam,
            MGG_San_SoLuongBanDau: formData.MGG_Shop_SoLuongBanDau,
            MGG_San_SoTienToiDaMoiLan: formData.MGG_Shop_SoTienToiDaMoiLan,
          }}
          handleInputChange={(e) => {
            const { name, value, type, checked } = e.target;
            const shopName = name.replace("MGG_San_", "MGG_Shop_");
            setFormData((prev) => ({
              ...prev,
              [shopName]: type === "checkbox" ? checked : value,
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
                MGG_San_Ma: selectedVoucher.MGG_Shop_Ma,
                MGG_San_Ten: selectedVoucher.MGG_Shop_Ten,
                MGG_San_Mota: selectedVoucher.MGG_Shop_Mota,
                MGG_San_HinhAnh: selectedVoucher.MGG_Shop_HinhAnh,
                MGG_San_TrangThai: selectedVoucher.MGG_Shop_TrangThai,
                MGG_San_ThoiDiemBatDau: selectedVoucher.MGG_Shop_ThoiDiemBatDau,
                MGG_San_ThoiDiemKetThuc:
                  selectedVoucher.MGG_Shop_ThoiDiemKetThuc,
                MGG_San_GiaTriDonToiThieu:
                  selectedVoucher.MGG_Shop_GiaTriDonToiThieu,
                MGG_San_SoLuongConLai: selectedVoucher.MGG_Shop_SoLuongConLai,
                MGG_San_PhanTramGiam: selectedVoucher.MGG_Shop_PhanTramGiam,
                MGG_San_SoLuongBanDau: selectedVoucher.MGG_Shop_SoLuongBanDau,
                MGG_San_SoTienToiDaMoiLan:
                  selectedVoucher.MGG_Shop_SoTienToiDaMoiLan,
              }
            : null
        }
      />

      <ToastNotification toast={toast} />
    </div>
  );
};

export default MaGiamGiaShopCRUD;
