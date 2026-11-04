// src/pages/shop/DanhMucSanPhamCRUD.jsx
import { useState, useEffect } from "react";
import danhMucSanPhamService from "../../services/gianhang/danhMucSanPhamService"; // <-- Sửa đường dẫn import
import CrudToolbar from "../../components/common/Crud/CrudToolbar";
import CrudDataTable from "../../components/common/Crud/CrudDataTable";
import CrudDrawer from "../../components/common/Crud/CrudDrawer";
import ToastNotification from "../../components/common/Crud/ToastNotification";
import ImageUpload from "../../components/common/ImageUpload";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8080";

const DanhMucSanPhamCRUD = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentShopId, setCurrentShopId] = useState("");

  // State Form
  const [formData, setFormData] = useState({ dmsp_ten: "", dmsp_mota: "" });
  const [editingId, setEditingId] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [currentImage, setCurrentImage] = useState("");

  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      const user = JSON.parse(userStr);
      setCurrentShopId(user.GH_Ma || user.gh_ma || "GH01");
    }
  }, []);

  const columns = [
    {
      key: "dmsp_ma",
      label: "Mã Danh Mục",
      width: "w-32",
      render: (item) => (
        <span className="font-mono font-semibold text-primary">
          {item.dmsp_ma}
        </span>
      ),
    },
    {
      key: "dmsp_hinhanh",
      label: "Hình ảnh",
      width: "w-24",
      align: "center",
      render: (item) =>
        item.dmsp_hinhanh ? (
          <img
            src={`${BACKEND_URL}${item.dmsp_hinhanh}`}
            alt="img"
            className="w-10 h-10 object-cover rounded-lg mx-auto bg-white border"
          />
        ) : (
          <span className="text-outline italic text-xs">Trống</span>
        ),
    },
    {
      key: "dmsp_ten",
      label: "Tên Danh Mục",
      render: (item) => (
        <span className="font-semibold text-on-surface">{item.dmsp_ten}</span>
      ),
    },
    {
      key: "dmsp_mota",
      label: "Mô tả",
      render: (item) => (
        <span className="text-on-surface-variant line-clamp-2">
          {item.dmsp_mota || "Không có"}
        </span>
      ),
    },
  ];

  const fetchData = async () => {
    if (!currentShopId) return;
    setLoading(true);
    try {
      const res = await danhMucSanPhamService.getByGianHang(currentShopId);
      setData(res.data);
    } catch (err) {
      setError("Lỗi khi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentShopId]);

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(
      () => setToast({ show: false, message: "", type: "success" }),
      3000,
    );
  };

  const openAddDrawer = () => {
    setFormData({ dmsp_ten: "", dmsp_mota: "" });
    setEditingId("");
    setSelectedFile(null);
    setCurrentImage("");
    setIsEditing(false);
    setIsDrawerOpen(true);
  };

  const openEditDrawer = (item) => {
    setFormData({ dmsp_ten: item.dmsp_ten, dmsp_mota: item.dmsp_mota || "" });
    setEditingId(item.dmsp_ma);
    setCurrentImage(
      item.dmsp_hinhanh ? `${BACKEND_URL}${item.dmsp_hinhanh}` : "",
    );
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
      dataToSend.append("dmsp_ten", formData.dmsp_ten);
      dataToSend.append("dmsp_mota", formData.dmsp_mota);
      dataToSend.append("gh_ma", currentShopId);

      if (selectedFile) {
        dataToSend.append("hinhanh", selectedFile);
      }

      if (isEditing) {
        await danhMucSanPhamService.update(editingId, dataToSend);
        showToast("Cập nhật danh mục thành công!");
      } else {
        await danhMucSanPhamService.create(dataToSend);
        showToast("Thêm danh mục thành công!");
      }
      setIsDrawerOpen(false);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || "Lỗi khi lưu dữ liệu");
      showToast("Có lỗi xảy ra", "error");
    }
  };

  const handleDelete = async (id, ten) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa danh mục "${ten}"?`)) {
      try {
        await danhMucSanPhamService.delete(id);
        showToast(`Đã xóa danh mục "${ten}"`);
        fetchData();
      } catch (err) {
        alert(err.response?.data?.message || "Không thể xóa danh mục này.");
      }
    }
  };

  return (
    <div className="w-full">
      <CrudToolbar
        title="Quản lý Danh mục Sản phẩm"
        subtitle="Tạo và quản lý các danh mục để phân loại sản phẩm của gian hàng."
        totalItems={data.length}
        onAdd={openAddDrawer}
        addButtonText="+ Thêm Danh mục"
        searchPlaceholder="Tìm kiếm danh mục..."
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-xl p-5 shadow-sm">
          <div className="text-outline text-label-md mb-2">
            Tổng số Danh mục
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
        emptyText="Chưa có danh mục nào."
        onEdit={openEditDrawer}
        onDelete={handleDelete}
        keyField="dmsp_ma"
        nameField="dmsp_ten"
      />

      <CrudDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title={isEditing ? "Chỉnh sửa Danh mục" : "Thêm Danh mục Mới"}
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
              Mã Danh Mục
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
            Tên Danh Mục <span className="text-error">*</span>
          </label>
          <input
            className="w-full px-3.5 py-2 border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary transition-all"
            name="dmsp_ten"
            required
            value={formData.dmsp_ten}
            onChange={handleInputChange}
            placeholder="VD: Áo thun, Quần jean..."
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-label-md font-label-md text-on-surface">
            Mô tả
          </label>
          <textarea
            className="w-full px-3.5 py-2 border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary transition-all min-h-[100px]"
            name="dmsp_mota"
            value={formData.dmsp_mota}
            onChange={handleInputChange}
            placeholder="Mô tả chi tiết danh mục..."
          />
        </div>

        <ImageUpload
          label="Hình ảnh Danh Mục"
          hint="Hỗ trợ JPG, PNG, WEBP."
          currentImage={currentImage}
          onFileSelect={(file) => setSelectedFile(file)}
        />
      </CrudDrawer>

      <ToastNotification toast={toast} />
    </div>
  );
};

export default DanhMucSanPhamCRUD;
