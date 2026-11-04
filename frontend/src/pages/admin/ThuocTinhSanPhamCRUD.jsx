// src/pages/admin/ThuocTinhSanPhamCRUD.jsx
import { useState, useEffect } from "react";
import thuocTinhSanPhamService from "../../services/san/thuocTinhSanPhamService";
import CrudToolbar from "../../components/common/Crud/CrudToolbar";
import CrudDataTable from "../../components/common/Crud/CrudDataTable";
import CrudDrawer from "../../components/common/Crud/CrudDrawer";
import ToastNotification from "../../components/common/Crud/ToastNotification";
import ImageUpload from "../../components/common/ImageUpload";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8080";

const ThuocTinhSanPhamCRUD = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // State Form
  const [formData, setFormData] = useState({ thsp_ten: "", thsp_mota: "" });
  const [editingId, setEditingId] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [currentIcon, setCurrentIcon] = useState("");

  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });

  // Cấu hình cột
  const columns = [
    {
      key: "thsp_ma",
      label: "Mã Thuộc Tính",
      width: "w-32",
      render: (item) => (
        <span className="font-mono font-semibold text-primary">
          {item.thsp_ma}
        </span>
      ),
    },
    {
      key: "thsp_icon",
      label: "Icon",
      width: "w-24",
      align: "center",
      render: (item) =>
        item.thsp_icon ? (
          <img
            src={`${BACKEND_URL}${item.thsp_icon}`}
            alt="icon"
            className="w-10 h-10 object-contain mx-auto bg-white rounded"
          />
        ) : (
          <span className="text-outline italic text-xs">Trống</span>
        ),
    },
    {
      key: "thsp_ten",
      label: "Tên Thuộc Tính",
      render: (item) => (
        <span className="font-semibold text-on-surface">{item.thsp_ten}</span>
      ),
    },
    {
      key: "thsp_mota",
      label: "Mô tả",
      render: (item) => (
        <span className="text-on-surface-variant line-clamp-2">
          {item.thsp_mota || "Không có"}
        </span>
      ),
    },
  ];

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await thuocTinhSanPhamService.getAll();
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

  // Hàm đóng Drawer an toàn (Sửa lỗi aria-hidden)
  const handleCloseDrawer = () => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur(); // Thu hồi focus trước khi ẩn Drawer
    }
    setIsDrawerOpen(false);
  };

  const openAddDrawer = () => {
    setFormData({ thsp_ten: "", thsp_mota: "" });
    setEditingId("");
    setSelectedFile(null);
    setCurrentIcon("");
    setIsEditing(false);
    setIsDrawerOpen(true);
  };

  const openEditDrawer = (item) => {
    setFormData({ thsp_ten: item.thsp_ten, thsp_mota: item.thsp_mota || "" });
    setEditingId(item.thsp_ma);
    setCurrentIcon(item.thsp_icon ? `${BACKEND_URL}${item.thsp_icon}` : "");
    setSelectedFile(null);
    setIsEditing(true);
    setIsDrawerOpen(true);
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setError("");

    try {
      const dataToSend = new FormData();
      dataToSend.append("thsp_ten", formData.thsp_ten);
      dataToSend.append("thsp_mota", formData.thsp_mota);

      if (selectedFile) {
        dataToSend.append("icon", selectedFile); // Key 'icon' khớp với Backend
      }

      if (isEditing) {
        await thuocTinhSanPhamService.update(editingId, dataToSend);
        showToast("Đã cập nhật thuộc tính thành công!");
      } else {
        await thuocTinhSanPhamService.create(dataToSend);
        showToast("Đã thêm thuộc tính mới thành công!");
      }
      handleCloseDrawer(); // Đóng Drawer an toàn
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || "Lỗi khi lưu dữ liệu");
      showToast(err.response?.data?.message || "Có lỗi xảy ra", "error");
    }
  };

  const handleDelete = async (id, ten) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa thuộc tính "${ten}"?`)) {
      try {
        await thuocTinhSanPhamService.delete(id);
        showToast(`Đã xóa thành công "${ten}"`);
        fetchData();
      } catch (err) {
        alert(err.response?.data?.message || "Không thể xóa.");
      }
    }
  };

  return (
    <div className="w-full">
      <CrudToolbar
        title="Quản lý Thuộc tính Sản phẩm"
        subtitle="Quản lý các thuộc tính như Màu sắc, Kích thước, Chất liệu..."
        totalItems={data.length}
        onAdd={openAddDrawer}
        addButtonText="+ Thêm Thuộc tính"
        searchPlaceholder="Tìm kiếm thuộc tính..."
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-xl p-5 shadow-sm">
          <div className="text-outline text-label-md mb-2">
            Tổng số Thuộc tính
          </div>
          <div className="text-data-metric font-bold text-on-surface">
            {data.length}
          </div>
        </div>
      </div>

      <CrudDataTable
        columns={columns}
        data={data}
        loading={loading}
        emptyText="Chưa có thuộc tính nào."
        onEdit={openEditDrawer}
        onDelete={handleDelete}
        keyField="thsp_ma"
        nameField="thsp_ten"
      />

      {/* SỬ DỤNG HÀM handleCloseDrawer THAY VÌ INLINE FUNCTION */}
      <CrudDrawer
        isOpen={isDrawerOpen}
        onClose={handleCloseDrawer}
        title={isEditing ? "Chỉnh sửa Thuộc tính" : "Thêm Thuộc tính Mới"}
        description={
          isEditing
            ? `Đang chỉnh sửa mã: ${editingId}`
            : "Hệ thống sẽ tự động sinh mã."
        }
        onSubmit={handleSubmit}
        isEditing={isEditing}
        error={error}
      >
        {isEditing && (
          <div className="space-y-1.5">
            <label className="block text-label-md font-label-md text-on-surface">
              Mã Thuộc Tính
            </label>
            <input
              className="w-full px-3.5 py-2 border border-outline-variant rounded-lg font-mono bg-surface-container-low text-outline cursor-not-allowed"
              type="text"
              value={editingId}
              disabled
            />
          </div>
        )}

        <div className="space-y-1.5">
          <label className="block text-label-md font-label-md text-on-surface">
            Tên Thuộc Tính <span className="text-error">*</span>
          </label>
          <input
            className="w-full px-3.5 py-2 border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary transition-all"
            name="thsp_ten"
            required
            value={formData.thsp_ten}
            onChange={handleInputChange}
            placeholder="VD: Màu sắc, Kích thước..."
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-label-md font-label-md text-on-surface">
            Mô tả
          </label>
          <textarea
            className="w-full px-3.5 py-2 border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary transition-all min-h-[100px]"
            name="thsp_mota"
            value={formData.thsp_mota}
            onChange={handleInputChange}
            placeholder="Mô tả chi tiết..."
          />
        </div>

        <ImageUpload
          label="Icon Thuộc Tính (Ảnh)"
          hint="Hỗ trợ JPG, PNG, WEBP."
          currentImage={currentIcon}
          onFileSelect={(file) => setSelectedFile(file)}
        />
      </CrudDrawer>

      <ToastNotification toast={toast} />
    </div>
  );
};

export default ThuocTinhSanPhamCRUD;
