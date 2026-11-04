import { useState, useEffect } from "react";
import thuongHieuService from "../../services/san/thuongHieuService";
import CrudToolbar from "../../components/common/Crud/CrudToolbar";
import CrudDataTable from "../../components/common/Crud/CrudDataTable";
import CrudDrawer from "../../components/common/Crud/CrudDrawer";
import ToastNotification from "../../components/common/Crud/ToastNotification";
import ImageUpload from "../../components/common/ImageUpload";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8080";

const ThuongHieuCRUD = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // State Form
  const [formData, setFormData] = useState({ th_ten: "", th_mota: "" });
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
      key: "th_ma",
      label: "Mã Thương Hiệu",
      width: "w-32",
      render: (item) => (
        <span className="font-mono font-semibold text-primary">
          {item.th_ma}
        </span>
      ),
    },
    {
      key: "th_hinhanh",
      label: "Icon",
      width: "w-24",
      align: "center",
      render: (item) =>
        item.th_hinhanh ? (
          <img
            src={`${BACKEND_URL}${item.th_hinhanh}`}
            alt="icon"
            className="w-10 h-10 object-contain mx-auto bg-white rounded"
          />
        ) : (
          <span className="text-outline italic text-xs">Trống</span>
        ),
    },
    {
      key: "th_ten",
      label: "Tên Thương Hiệu",
      render: (item) => (
        <span className="font-semibold text-on-surface">{item.th_ten}</span>
      ),
    },
    {
      key: "th_mota",
      label: "Mô tả",
      render: (item) => (
        <span className="text-on-surface-variant line-clamp-2">
          {item.th_mota || "Không có"}
        </span>
      ),
    },
  ];

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await thuongHieuService.getAll();
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
    setFormData({ th_ten: "", th_mota: "" });
    setEditingId("");
    setSelectedFile(null);
    setCurrentIcon("");
    setIsEditing(false);
    setIsDrawerOpen(true);
  };

  const openEditDrawer = (item) => {
    setFormData({ th_ten: item.th_ten, th_mota: item.th_mota || "" });
    setEditingId(item.th_ma);
    setCurrentIcon(item.th_hinhanh ? `${BACKEND_URL}${item.th_hinhanh}` : "");
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
      dataToSend.append("th_ten", formData.th_ten);
      dataToSend.append("th_mota", formData.th_mota);

      // Key gửi file phải là 'icon' để khớp với upload.single('icon') bên Backend
      if (selectedFile) {
        dataToSend.append("icon", selectedFile);
      }

      if (isEditing) {
        await thuongHieuService.update(editingId, dataToSend);
        showToast("Đã cập nhật thương hiệu thành công!");
      } else {
        await thuongHieuService.create(dataToSend);
        showToast("Đã thêm thương hiệu mới thành công!");
      }
      setIsDrawerOpen(false);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || "Lỗi khi lưu dữ liệu");
      showToast(err.response?.data?.message || "Có lỗi xảy ra", "error");
    }
  };

  const handleDelete = async (id, ten) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa thương hiệu "${ten}"?`)) {
      try {
        await thuongHieuService.delete(id);
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
        title="Quản lý Thương Hiệu"
        subtitle="Quản lý danh sách thương hiệu sản phẩm."
        totalItems={data.length}
        onAdd={openAddDrawer}
        addButtonText="+ Thêm Thương hiệu"
        searchPlaceholder="Tìm kiếm theo mã hoặc tên..."
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-xl p-5 shadow-sm">
          <div className="text-outline text-label-md mb-2">
            Tổng số Thương hiệu
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
        emptyText="Chưa có thương hiệu nào."
        onEdit={openEditDrawer}
        onDelete={handleDelete}
        keyField="th_ma"
        nameField="th_ten"
      />

      <CrudDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title={isEditing ? "Chỉnh sửa Thương hiệu" : "Thêm Thương hiệu Mới"}
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
              Mã Thương Hiệu
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
            Tên Thương Hiệu <span className="text-error">*</span>
          </label>
          <input
            className="w-full px-3.5 py-2 border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary transition-all"
            name="th_ten"
            required
            value={formData.th_ten}
            onChange={handleInputChange}
            placeholder="VD: Apple, Samsung..."
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-label-md font-label-md text-on-surface">
            Mô tả
          </label>
          <textarea
            className="w-full px-3.5 py-2 border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary transition-all min-h-[100px]"
            name="th_mota"
            value={formData.th_mota}
            onChange={handleInputChange}
            placeholder="Mô tả chi tiết về thương hiệu..."
          />
        </div>

        <ImageUpload
          label="Icon Thương Hiệu (Ảnh)"
          hint="Hỗ trợ JPG, PNG, WEBP."
          currentImage={currentIcon}
          onFileSelect={(file) => setSelectedFile(file)}
        />
      </CrudDrawer>

      <ToastNotification toast={toast} />
    </div>
  );
};

export default ThuongHieuCRUD;
