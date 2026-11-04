import { useState, useEffect } from "react";
import { NganHangService } from "../../services/san/nganHangService";

import CrudToolbar from "../../components/common/Crud/CrudToolbar";
import CrudDataTable from "../../components/common/Crud/CrudDataTable";
import CrudDrawer from "../../components/common/Crud/CrudDrawer";
import ToastNotification from "../../components/common/Crud/ToastNotification";
import ImageUpload from "../../components/common/ImageUpload";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8080";

const NganHangCRUD = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // 1. SỬA STATE FORM: Bỏ NHG_Ma ra khỏi form nhập vì Backend tự sinh
  const [formData, setFormData] = useState({
    NHG_Ten: "",
  });
  const [editingId, setEditingId] = useState(""); // Lưu mã NHG khi đang sửa

  const [selectedFile, setSelectedFile] = useState(null);
  const [currentLogo, setCurrentLogo] = useState("");

  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });

  const columns = [
    {
      key: "nhg_ma",
      label: "Mã ngân hàng",
      width: "w-32",
      render: (item) => (
        <span className="font-mono font-semibold text-primary">
          {item.nhg_ma}
        </span>
      ),
    },
    {
      key: "nhg_logo",
      label: "Logo",
      width: "w-24",
      align: "center",
      render: (item) =>
        item.nhg_logo ? (
          <img
            src={`${BACKEND_URL}${item.nhg_logo}`}
            alt="logo"
            className="w-10 h-10 object-contain mx-auto bg-white rounded"
            onError={(e) => (e.target.style.display = "none")}
          />
        ) : (
          <span className="text-outline italic text-xs">Trống</span>
        ),
    },
    {
      key: "nhg_ten",
      label: "Tên ngân hàng",
      render: (item) => (
        <span className="font-semibold text-on-surface">{item.nhg_ten}</span>
      ),
    },
  ];

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await NganHangService.getAll();
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Lỗi khi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(
      () => setToast({ show: false, message: "", type: "success" }),
      3000,
    );
  };

  const openAddDrawer = () => {
    setFormData({ NHG_Ten: "" });
    setEditingId("");
    setSelectedFile(null);
    setCurrentLogo("");
    setIsEditing(false);
    setIsDrawerOpen(true);
  };

  const openEditDrawer = (item) => {
    setFormData({ NHG_Ten: item.nhg_ten });
    setEditingId(item.nhg_ma); // Lưu lại mã để gửi lên API update

    // Fix lỗi ảnh preview: Ghép thêm BACKEND_URL nếu có ảnh
    setCurrentLogo(item.nhg_logo ? `${BACKEND_URL}${item.nhg_logo}` : "");
    setSelectedFile(null);
    setIsEditing(true);
    setIsDrawerOpen(true);
  };

  const closeDrawer = () => setIsDrawerOpen(false);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setError("");

    try {
      const dataToSend = new FormData();
      dataToSend.append("NHG_Ten", formData.NHG_Ten);

      // BỎ DÒNG NÀY: Vì Backend tự sinh mã khi Thêm mới, và Cập nhật thì dùng ID trên URL
      // dataToSend.append("NHG_Ma", formData.NHG_Ma);

      if (selectedFile) {
        dataToSend.append("logo", selectedFile);
      }

      if (isEditing) {
        // editingId được lấy từ item.nhg_ma (VD: NHG01)
        await NganHangService.update(editingId, dataToSend);
        showToast("Đã cập nhật ngân hàng thành công!");
      } else {
        await NganHangService.create(dataToSend);
        showToast("Đã thêm ngân hàng mới thành công!");
      }
      closeDrawer();
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || "Lỗi khi lưu dữ liệu");
      showToast(err.response?.data?.message || "Có lỗi xảy ra", "error");
    }
  };

  const handleDelete = async (id, ten) => {
    const confirmed = window.confirm(
      `Bạn có chắc chắn muốn xóa ngân hàng "${ten}" không?`,
    );
    if (confirmed) {
      try {
        await NganHangService.delete(id);
        showToast(`Đã xóa thành công "${ten}"`);
        fetchData();
      } catch (err) {
        alert(
          err.response?.data?.message ||
            "Không thể xóa (có thể do ràng buộc khóa ngoại).",
        );
      }
    }
  };

  return (
    <div className="w-full">
      <CrudToolbar
        title="Quản lý Ngân Hàng"
        subtitle="Quản lý danh sách các ngân hàng hỗ trợ thanh toán trong hệ thống."
        totalItems={data.length}
        onAdd={openAddDrawer}
        addButtonText="+ Thêm Ngân hàng"
        searchPlaceholder="Tìm kiếm theo mã hoặc tên ngân hàng..."
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-outline text-label-md font-label-md mb-2">
            <span>Tổng số Ngân hàng</span>
          </div>
          <div className="text-data-metric font-data-metric text-on-surface">
            {data.length}
          </div>
        </div>
      </div>

      <CrudDataTable
        columns={columns}
        data={data}
        loading={loading}
        emptyText="Chưa có dữ liệu ngân hàng nào."
        onEdit={openEditDrawer}
        onDelete={handleDelete}
        keyField="nhg_ma"
        nameField="nhg_ten"
      />

      <CrudDrawer
        isOpen={isDrawerOpen}
        onClose={closeDrawer}
        title={isEditing ? "Chỉnh sửa Ngân hàng" : "Thêm Ngân hàng Mới"}
        description={
          isEditing
            ? `Đang chỉnh sửa mã: ${editingId}`
            : "Hệ thống sẽ tự động sinh mã ngân hàng."
        }
        onSubmit={handleSubmit}
        isEditing={isEditing}
        error={error}
      >
        {/* NẾU LÀ EDIT THÌ CHỈ HIỂN THỊ MÃ (READONLY), THÊM MỚI THÌ ẨN ĐI */}
        {isEditing && (
          <div className="space-y-1.5">
            <label className="block text-label-md font-label-md text-on-surface">
              Mã Ngân Hàng
            </label>
            <input
              className="w-full px-3.5 py-2 border border-outline-variant rounded-lg text-body-md font-mono bg-surface-container-low text-outline cursor-not-allowed"
              type="text"
              value={editingId}
              disabled
            />
          </div>
        )}

        <div className="space-y-1.5">
          <label className="block text-label-md font-label-md text-on-surface">
            Tên Ngân Hàng <span className="text-error">*</span>
          </label>
          <input
            className="w-full px-3.5 py-2 bg-surface-container-lowest border border-outline-variant rounded-lg text-body-md font-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-container transition-all"
            name="NHG_Ten"
            required
            type="text"
            value={formData.NHG_Ten}
            onChange={handleInputChange}
            placeholder="VD: Vietcombank, Techcombank..."
          />
        </div>

        <ImageUpload
          label="Logo Ngân Hàng (Ảnh)"
          hint="Hỗ trợ JPG, PNG, WEBP. Kích thước đề xuất: 128x128px."
          currentImage={currentLogo} // Đã fix truyền full đường dẫn
          onFileSelect={(file) => setSelectedFile(file)}
        />
      </CrudDrawer>

      <ToastNotification toast={toast} />
    </div>
  );
};

export default NganHangCRUD;
