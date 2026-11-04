import { useState, useEffect } from "react";
import { tinhService } from "../../services/san/tinhService";
import { xaService } from "../../services/san/xaService";

// Dùng lại các component
import CrudToolbar from "../../components/common/Crud/CrudToolbar";
import CrudDataTable from "../../components/common/Crud/CrudDataTable";
import CrudDrawer from "../../components/common/Crud/CrudDrawer";
import ToastNotification from "../../components/common/Crud/ToastNotification";

const TinhXaCRUD = () => {
  // --- STATE DỮ LIỆU ---
  const [tinhList, setTinhList] = useState([]);
  const [xaList, setXaList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Tỉnh đang được click chọn
  const [selectedTinh, setSelectedTinh] = useState(null);

  // --- STATE DRAWER (Dùng chung cho cả Tỉnh và Xã) ---
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerType, setDrawerType] = useState("TINH"); // 'TINH' hoặc 'XA'
  const [isEditing, setIsEditing] = useState(false);

  // State Form cho cả 2
  const [formData, setFormData] = useState({});

  // --- STATE TOAST ---
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });

  // --- FETCH DATA ---
  const fetchData = async () => {
    setLoading(true);
    try {
      const [resTinh, resXa] = await Promise.all([
        tinhService.getAll(),
        xaService.getAll(),
      ]);
      setTinhList(resTinh.data);
      setXaList(resXa.data);
    } catch (err) {
      setError("Lỗi khi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type }), 3000);
  };

  // --- CẤU HÌNH CỘT BẢNG TỈNH ---
  const columnsTinh = [
    {
      key: "th_ma",
      label: "Mã Tỉnh",
      width: "w-28",
      render: (item) => (
        <span className="font-mono font-semibold text-primary">
          {item.th_ma}
        </span>
      ),
    },
    {
      key: "th_ten",
      label: "Tên Tỉnh",
      render: (item) => (
        <span className="font-bold text-[15px] text-on-surface">
          {item.th_ten}
        </span>
      ),
    },
    {
      key: "th_gps",
      label: "Tọa độ GPS",
      render: (item) =>
        item.th_gps || (
          <span className="italic text-outline text-sm">Trống</span>
        ),
    },
  ];

  // --- CẤU HÌNH CỘT BẢNG XÃ ---
  const columnsXa = [
    {
      key: "xa_ma",
      label: "Mã Xã",
      width: "w-28",
      render: (item) => (
        <span className="font-mono font-semibold text-primary">
          {item.xa_ma}
        </span>
      ),
    },
    {
      key: "xa_ten",
      label: "Tên Xã",
      render: (item) => (
        <span className="font-semibold text-on-surface">{item.xa_ten}</span>
      ),
    },
    {
      key: "xa_gps",
      label: "Tọa độ GPS",
      render: (item) =>
        item.xa_gps || (
          <span className="italic text-outline text-sm">Trống</span>
        ),
    },
  ];

  // Lọc danh sách xã theo tỉnh đang chọn
  const filteredXaList = selectedTinh
    ? xaList.filter((xa) => xa.th_ma === selectedTinh.th_ma)
    : [];

  // --- XỬ LÝ MỞ DRAWER THÊM/SỬA ---
  const openAddTinh = () => {
    setDrawerType("TINH");
    setFormData({ TH_Ma: "", TH_Ten: "", TH_GPS: "" });
    setIsEditing(false);
    setIsDrawerOpen(true);
  };

  const openEditTinh = (item) => {
    setDrawerType("TINH");
    setFormData({
      TH_Ma: item.th_ma,
      TH_Ten: item.th_ten,
      TH_GPS: item.th_gps || "",
    });
    setIsEditing(true);
    setIsDrawerOpen(true);
  };

  const openAddXa = () => {
    if (!selectedTinh)
      return alert("Vui lòng chọn một Tỉnh ở bảng bên trái trước khi thêm Xã!");
    setDrawerType("XA");
    setFormData({
      XA_Ma: "",
      XA_Ten: "",
      Xa_GPS: "",
      TH_Ma: selectedTinh.th_ma,
    });
    setIsEditing(false);
    setIsDrawerOpen(true);
  };

  const openEditXa = (item) => {
    setDrawerType("XA");
    setFormData({
      XA_Ma: item.xa_ma,
      XA_Ten: item.xa_ten,
      Xa_GPS: item.xa_gps || "",
      TH_Ma: item.th_ma,
    });
    setIsEditing(true);
    setIsDrawerOpen(true);
  };

  const handleInputChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  // --- SUBMIT FORM ---
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    try {
      if (drawerType === "TINH") {
        if (isEditing) await tinhService.update(formData.TH_Ma, formData);
        else await tinhService.create(formData);
        showToast(`Đã lưu Tỉnh thành công!`);
      } else {
        if (isEditing) await xaService.update(formData.XA_Ma, formData);
        else await xaService.create(formData);
        showToast(`Đã lưu Xã thành công!`);
      }
      setIsDrawerOpen(false);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || "Lỗi khi lưu dữ liệu");
    }
  };

  // --- XÓA DỮ LIỆU ---
  const handleDeleteTinh = async (id, ten) => {
    if (
      window.confirm(
        `Xóa Tỉnh "${ten}"? (Lưu ý: Không thể xóa nếu đang có Xã trực thuộc)`,
      )
    ) {
      try {
        await tinhService.delete(id);
        showToast("Xóa Tỉnh thành công!");
        if (selectedTinh?.th_ma === id) setSelectedTinh(null);
        fetchData();
      } catch (err) {
        alert(
          err.response?.data?.message ||
            "Không thể xóa vì đang có Xã trực thuộc!",
        );
      }
    }
  };

  const handleDeleteXa = async (id, ten) => {
    if (window.confirm(`Xóa Xã "${ten}"?`)) {
      try {
        await xaService.delete(id);
        showToast("Xóa Xã thành công!");
        fetchData();
      } catch (err) {
        alert("Lỗi khi xóa!");
      }
    }
  };

  return (
    <div className="w-full">
      {/* SỬ DỤNG FLEXBOX ĐỂ CHIA 2 CỘT */}
      <div className="flex flex-col lg:flex-row gap-8 w-full">
        {/* ================= CỘT TRÁI: QUẢN LÝ TỈNH ================= */}
        <div className="flex-1 w-full min-w-0">
          <CrudToolbar
            title="Quản lý Tỉnh / Thành phố"
            subtitle="Chọn một Tỉnh để xem danh sách Xã."
            totalItems={tinhList.length}
            onAdd={openAddTinh}
            addButtonText="+ Thêm Tỉnh mới"
            searchPlaceholder="Tìm kiếm Tỉnh..."
          />
          <CrudDataTable
            columns={columnsTinh}
            data={tinhList}
            loading={loading}
            emptyText="Chưa có dữ liệu Tỉnh."
            onEdit={openEditTinh}
            onDelete={handleDeleteTinh}
            keyField="th_ma"
            nameField="th_ten"
            selectedRowId={selectedTinh?.th_ma}
            onRowClick={(item) => setSelectedTinh(item)}
          />
        </div>

        {/* ================= CỘT PHẢI: QUẢN LÝ XÃ ================= */}
        <div className="flex-1 w-full min-w-0 lg:pl-8 lg:border-l-2 border-dashed border-outline-variant">
          {selectedTinh ? (
            /* NẾU ĐÃ CHỌN TỈNH -> HIỆN BẢNG XÃ */
            <div className="animate-fade-in-up">
              <div className="flex items-center justify-between mb-4 bg-primary-container/10 p-4 rounded-xl border border-primary-container/20">
                <h2 className="text-headline-md font-bold text-primary flex items-center gap-2">
                  <span className="material-symbols-outlined text-[24px]">
                    location_on
                  </span>
                  Xã thuộc: {selectedTinh.th_ten}
                </h2>
                <button
                  onClick={() => setSelectedTinh(null)}
                  className="flex items-center justify-center w-8 h-8 rounded-full bg-white hover:bg-gray-100 text-gray-500 shadow-sm transition-colors"
                  title="Đóng danh sách Xã"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    close
                  </span>
                </button>
              </div>

              <CrudToolbar
                title=""
                subtitle=""
                totalItems={filteredXaList.length}
                onAdd={openAddXa}
                addButtonText={`+ Thêm Xã vào ${selectedTinh.th_ten}`}
                searchPlaceholder="Tìm kiếm Xã..."
              />
              <CrudDataTable
                columns={columnsXa}
                data={filteredXaList}
                loading={loading}
                emptyText="Tỉnh này chưa có Xã nào."
                onEdit={openEditXa}
                onDelete={handleDeleteXa}
                keyField="xa_ma"
                nameField="xa_ten"
              />
            </div>
          ) : (
            /* NẾU CHƯA CHỌN TỈNH -> HIỆN MÀN HÌNH CHỜ */
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-outline bg-surface-container-lowest rounded-xl border border-dashed border-outline-variant p-8">
              <div className="w-20 h-20 bg-surface-container rounded-full flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-[40px] text-outline-variant">
                  map
                </span>
              </div>
              <h3 className="text-lg font-semibold text-on-surface mb-2">
                Chưa chọn Tỉnh / Thành phố
              </h3>
              <p className="text-center max-w-xs">
                Vui lòng click chọn một Tỉnh ở bảng bên trái để xem danh sách
                các Xã trực thuộc.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* DRAWER DÙNG CHUNG */}
      <CrudDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title={
          drawerType === "TINH"
            ? isEditing
              ? "Sửa Tỉnh"
              : "Thêm Tỉnh"
            : isEditing
              ? "Sửa Xã"
              : "Thêm Xã"
        }
        description={
          isEditing
            ? `Đang sửa mã: ${drawerType === "TINH" ? formData.TH_Ma : formData.XA_Ma}`
            : "Nhập thông tin bên dưới"
        }
        onSubmit={handleSubmit}
        isEditing={isEditing}
        error={error}
      >
        {/* FORM TỈNH */}
        {drawerType === "TINH" && (
          <>
            {isEditing && (
              <div className="space-y-1.5">
                <label className="block font-bold">Mã Tỉnh</label>
                <input
                  className="w-full px-3 py-2 border rounded-lg bg-gray-100"
                  value={formData.TH_Ma}
                  disabled
                />
              </div>
            )}
            <div className="space-y-1.5">
              <label className="block font-bold">Tên Tỉnh *</label>
              <input
                className="w-full px-3 py-2 border rounded-lg"
                name="TH_Ten"
                required
                value={formData.TH_Ten || ""}
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-1.5">
              <label className="block font-bold">GPS</label>
              <input
                className="w-full px-3 py-2 border rounded-lg"
                name="TH_GPS"
                value={formData.TH_GPS || ""}
                onChange={handleInputChange}
              />
            </div>
          </>
        )}

        {/* FORM XÃ */}
        {drawerType === "XA" && (
          <>
            {isEditing && (
              <div className="space-y-1.5">
                <label className="block font-bold">Mã Xã</label>
                <input
                  className="w-full px-3 py-2 border rounded-lg bg-gray-100"
                  value={formData.XA_Ma}
                  disabled
                />
              </div>
            )}
            <div className="space-y-1.5">
              <label className="block font-bold">Thuộc Tỉnh</label>
              <input
                className="w-full px-3 py-2 border rounded-lg bg-gray-100"
                value={selectedTinh?.th_ten || ""}
                disabled
              />
            </div>
            <div className="space-y-1.5">
              <label className="block font-bold">Tên Xã *</label>
              <input
                className="w-full px-3 py-2 border rounded-lg"
                name="XA_Ten"
                required
                value={formData.XA_Ten || ""}
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-1.5">
              <label className="block font-bold">GPS</label>
              <input
                className="w-full px-3 py-2 border rounded-lg"
                name="Xa_GPS"
                value={formData.Xa_GPS || ""}
                onChange={handleInputChange}
              />
            </div>
          </>
        )}
      </CrudDrawer>

      <ToastNotification toast={toast} />
    </div>
  );
};

export default TinhXaCRUD;
