import { useState, useEffect } from "react";
import phiChiecKhauService from "../../services/san/phiChiecKhauService";
import ToastNotification from "../../components/common/Crud/ToastNotification";
import CrudDrawer from "../../components/common/Crud/CrudDrawer";
import EditableCell from "../../components/common/EditableCell";
import ImageUpload from "../../components/common/ImageUpload";
import NganhDichVuDetailDrawer from "../../components/common/NganhDichVuDetailDrawer";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8080";

// ==========================================
// HÀM DỰNG BẢNG (chuyển cây thành các hàng lá)
// ==========================================
const buildTableRows = (data) => {
  const n = data.length;

  const isLeaf = data.map(
    (row, i) => i === n - 1 || data[i + 1].level <= row.level,
  );

  const nextLeaf = new Array(n + 1).fill(-1);
  for (let i = n - 1; i >= 0; i--) {
    nextLeaf[i] = isLeaf[i] ? i : nextLeaf[i + 1];
  }

  const leafCount = new Array(n).fill(0);
  for (let i = 0; i < n; i++) {
    let count = 0;
    for (let j = i; j < n; j++) {
      if (j > i && data[j].level <= data[i].level) break;
      if (isLeaf[j]) count++;
    }
    leafCount[i] = count;
  }

  const rows = [];
  const ancestors = {};

  for (let i = 0; i < n; i++) {
    const row = data[i];
    ancestors[row.level] = i;

    if (!isLeaf[i]) continue;

    const cells = [];

    for (let L = 1; L < row.level; L++) {
      const a = ancestors[L];
      if (a !== undefined && nextLeaf[a] === i) {
        cells.push({
          index: a,
          rowSpan: leafCount[a],
          colSpan: 1,
        });
      }
    }

    cells.push({
      index: i,
      rowSpan: 1,
      colSpan: 5 - row.level,
    });

    rows.push({
      key: row.nh_ma,
      leafIndex: i,
      cells,
    });
  }

  return rows;
};

const PhiChiecKhauCRUD = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentMerchantId, setCurrentMerchantId] = useState("");
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    nh_ma: "",
    nh_ten: "",
    nh_mota: "",
    nh_cha: "",
  });
  const [formError, setFormError] = useState("");

  // State cho ảnh icon
  const [selectedFile, setSelectedFile] = useState(null);
  const [currentIcon, setCurrentIcon] = useState("");

  // State cho Drawer Xem Chi Tiết
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      const user = JSON.parse(userStr);
      setCurrentMerchantId(user.STMDT_Ma || user.maSan || "SAN_MAC_DINH");
    }
  }, []);

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 3000);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await phiChiecKhauService.getTableData(currentMerchantId);
      setData(res.data || []);
    } catch (error) {
      showToast("Không thể tải dữ liệu từ máy chủ", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentMerchantId) fetchData();
  }, [currentMerchantId]);

  // === CẬP NHẬT PHÍ ===
  const handleUpdateFee = async (rowId, phiMoi) => {
    const soPhi = phiMoi === "" || phiMoi === null ? 0 : parseFloat(phiMoi);

    if (isNaN(soPhi) || soPhi < 0 || soPhi > 100) {
      return showToast("Phí phải là số từ 0 đến 100", "error");
    }

    try {
      await phiChiecKhauService.updateFee({
        nh_ma: rowId,
        stmdt_ma: currentMerchantId,
        psck_phantram: soPhi,
      });

      setData((prev) =>
        prev.map((item) =>
          item.nh_ma === rowId ? { ...item, psck_phantram: soPhi } : item,
        ),
      );
      showToast("Cập nhật phí thành công!");
    } catch (error) {
      showToast(
        error.response?.data?.message || "Lỗi khi cập nhật phí",
        "error",
      );
      fetchData();
    }
  };

  // === CRUD DANH MỤC ===
  const handleOpenAdd = (parentId = null) => {
    setEditingCategory(null);
    setFormData({
      nh_ma: "",
      nh_ten: "",
      nh_mota: "",
      nh_cha: parentId || "",
    });
    setSelectedFile(null);
    setCurrentIcon("");
    setFormError("");
    setIsDrawerOpen(true);
  };

  const handleOpenEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      nh_ma: category.nh_ma,
      nh_ten: category.nh_ten,
      nh_mota: category.nh_mota || "",
      nh_cha: category.nh_cha || "",
    });
    setSelectedFile(null);
    setCurrentIcon(
      category.nh_hinhanh ? `${BACKEND_URL}${category.nh_hinhanh}` : "",
    );
    setFormError("");
    setIsDrawerOpen(true);
  };

  const handleOpenDetail = (category) => {
    setSelectedCategory(category);
    setIsDetailOpen(true);
  };

  const handleDeleteCategory = async (id, name) => {
    if (
      window.confirm(
        `Bạn có chắc chắn muốn xóa danh mục "${name}"?\n\nToàn bộ ngành hàng con và phí chiết khấu của chúng cũng sẽ bị xóa theo.`,
      )
    ) {
      try {
        const res = await phiChiecKhauService.deleteCategory(id);
        showToast(res.data?.message || "Xóa danh mục thành công!");
        fetchData();
      } catch (error) {
        showToast(
          error.response?.data?.message || "Lỗi khi xóa danh mục",
          "error",
        );
      }
    }
  };

  const handleSaveCategory = async (e) => {
    if (e) e.preventDefault();
    if (!formData.nh_ten) return setFormError("Vui lòng nhập tên danh mục.");

    try {
      const payload = new FormData();
      payload.append("nh_ten", formData.nh_ten);
      payload.append("nh_mota", formData.nh_mota || "");
      payload.append("nh_cha", formData.nh_cha || "");
      if (selectedFile) payload.append("icon", selectedFile);

      if (editingCategory) {
        await phiChiecKhauService.updateCategory(
          editingCategory.nh_ma,
          payload,
        );
        showToast("Cập nhật danh mục thành công!");
      } else {
        await phiChiecKhauService.createCategory(payload);
        showToast("Thêm danh mục thành công!");
      }
      setIsDrawerOpen(false);
      fetchData();
    } catch (error) {
      setFormError(error.response?.data?.message || "Có lỗi xảy ra.");
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // ==========================================
  // RENDER Ô TÊN NGÀNH HÀNG (dùng chung cho cha và lá)
  // ==========================================
  const renderNameCell = (item, { rowSpan, colSpan, key }) => {
    const canAddChild = item.level < 4;

    return (
      <td
        key={key}
        rowSpan={rowSpan}
        colSpan={colSpan}
        className="px-4 py-3 border border-outline-variant/60 align-top bg-surface-container-lowest group/cell"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {item.nh_hinhanh ? (
              <img
                src={`${BACKEND_URL}${item.nh_hinhanh}`}
                alt={item.nh_ten}
                className="w-6 h-6 object-contain rounded border border-outline-variant/40 bg-white shrink-0"
              />
            ) : (
              <span className="material-symbols-outlined text-[18px] text-outline shrink-0">
                category
              </span>
            )}
            <span
              className={
                item.level === 1
                  ? "font-semibold text-primary pt-1"
                  : "font-medium pt-1"
              }
            >
              {item.nh_ten}
            </span>
          </div>

          <div className="flex items-center gap-1 opacity-0 group-hover/cell:opacity-100 transition-opacity shrink-0">
            <button
              onClick={() => handleOpenDetail(item)}
              title="Xem chi tiết"
              className="p-1 text-outline hover:text-primary hover:bg-primary/10 rounded transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">
                visibility
              </span>
            </button>

            {canAddChild && (
              <button
                onClick={() => handleOpenAdd(item.nh_ma)}
                title="Thêm cấp con"
                className="p-1 text-primary hover:bg-primary/10 rounded"
              >
                <span className="material-symbols-outlined text-[16px]">
                  subdirectory_arrow_right
                </span>
              </button>
            )}

            <button
              onClick={() => handleOpenEdit(item)}
              title="Sửa tên"
              className="p-1 text-outline hover:text-tertiary-container rounded transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">
                edit
              </span>
            </button>

            <button
              onClick={() => handleDeleteCategory(item.nh_ma, item.nh_ten)}
              title="Xóa"
              className="p-1 text-outline hover:text-error rounded transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">
                delete
              </span>
            </button>
          </div>
        </div>
      </td>
    );
  };

  const tableRows = buildTableRows(data);

  return (
    <div className="h-full flex flex-col p-6 space-y-6 overflow-y-auto bg-background">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-headline-lg font-headline-lg font-bold text-on-surface">
            Cấu hình Phí Chiết Khấu
          </h2>
          <p className="text-body-sm text-on-surface-variant">
            Quản lý ngành hàng đa cấp.{" "}
            <strong>Rê chuột vào tên ngành hàng</strong> để xem các nút thao
            tác.
          </p>
        </div>
        <button
          onClick={() => handleOpenAdd(null)}
          className="flex items-center gap-2 bg-primary text-on-primary px-4 py-2 rounded-lg font-semibold shadow-sm hover:bg-primary-container transition-colors"
        >
          <span className="material-symbols-outlined">add</span> Thêm Ngành Hàng
          Gốc
        </button>
      </div>

      <section className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-[#1e3a5f] text-white">
                <th className="px-4 py-3 border border-[#2a4b73] font-semibold text-center w-[22%]">
                  Ngành hàng
                </th>
                <th className="px-4 py-3 border border-[#2a4b73] font-semibold text-center w-[22%]">
                  Ngành hàng cấp 1
                </th>
                <th className="px-4 py-3 border border-[#2a4b73] font-semibold text-center w-[22%]">
                  Ngành hàng cấp 2
                </th>
                <th className="px-4 py-3 border border-[#2a4b73] font-semibold text-center w-[22%]">
                  Ngành hàng cấp 3
                </th>
                <th className="px-4 py-3 border border-[#2a4b73] font-semibold text-center bg-[#e65c00] w-[12%]">
                  Phí Cố Định
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-8">
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-outline">
                    Chưa có dữ liệu.
                  </td>
                </tr>
              ) : (
                tableRows.map((tableRow) => {
                  const leaf = data[tableRow.leafIndex];

                  return (
                    <tr
                      key={tableRow.key}
                      className="hover:bg-surface-container-low/30 text-body-sm border-b border-outline-variant/60 transition-colors group"
                    >
                      {tableRow.cells.map((cell) =>
                        renderNameCell(data[cell.index], {
                          rowSpan: cell.rowSpan,
                          colSpan: cell.colSpan,
                          key: cell.index,
                        }),
                      )}

                      <td className="px-2 py-2 border border-outline-variant/60 align-top text-center bg-green-50/20">
                        <EditableCell
                          value={leaf.psck_phantram}
                          onSave={(val) => handleUpdateFee(leaf.nh_ma, val)}
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* FORM THÊM/SỬA */}
      <CrudDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title={
          editingCategory
            ? "Sửa Danh Mục"
            : formData.nh_cha
              ? "Thêm Ngành Hàng Cấp Con"
              : "Thêm Ngành Hàng Gốc/Cùng Cấp"
        }
        description={
          formData.nh_cha
            ? `Thêm cấp con cho mã: ${formData.nh_cha}`
            : "Tạo ngành hàng cấp cao nhất"
        }
        isEditing={!!editingCategory}
        onSubmit={handleSaveCategory}
        error={formError}
      >
        <div className="space-y-4">
          <div>
            <label className="text-label-md font-label-md block mb-1.5">
              Tên Danh Mục <span className="text-error">*</span>
            </label>
            <input
              required
              name="nh_ten"
              value={formData.nh_ten}
              onChange={handleInputChange}
              className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary"
              placeholder="Nhập tên ngành hàng..."
            />
          </div>

          <div>
            <label className="text-label-md font-label-md block mb-1.5">
              Thuộc Danh Mục Cha
            </label>
            <input
              readOnly
              value={formData.nh_cha || "Không có (Cấp gốc)"}
              className="w-full bg-surface-container-high border border-outline-variant rounded-lg px-3 py-2 cursor-not-allowed text-outline italic"
            />
          </div>

          <div>
            <label className="text-label-md font-label-md block mb-1.5">
              Mô tả
            </label>
            <textarea
              name="nh_mota"
              value={formData.nh_mota}
              onChange={handleInputChange}
              rows="3"
              className="w-full bg-surface-container-low border border-outline-variant rounded-lg p-3 focus:ring-2 focus:ring-primary"
              placeholder="Mô tả chi tiết..."
            ></textarea>
          </div>

          <ImageUpload
            label="Icon Ngành Hàng"
            hint="JPG, PNG hoặc WEBP (tối đa 2MB, tỷ lệ 1:1)"
            currentImage={currentIcon}
            onFileSelect={(file) => setSelectedFile(file)}
          />
        </div>
      </CrudDrawer>

      {/* DRAWER XEM CHI TIẾT */}
      <NganhDichVuDetailDrawer
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        category={selectedCategory}
      />

      <ToastNotification toast={toast} />
    </div>
  );
};

export default PhiChiecKhauCRUD;
