import { useState, useEffect, useContext, useCallback, useMemo } from "react";
import { AuthContext } from "../../contexts/AuthContext";
import axiosClient from "../../config/axiosClient";
import shipperService from "../../services/dvvc/shipperService";
import khoService from "../../services/dvvc/dvvcKhoService";
import { toAssetUrl } from "../../utils/accountUtils";
import ToastNotification from "../../components/common/Crud/ToastNotification";
import useLoaiShipper from "../../hooks/useLoaiShipper";

const EMPTY_FORM = {
  Shipper_Ma: "",
  Shipper_Ten: "",
  Shipper_SDT: "",
  Shipper_GioiTinh: "true",
  Shipper_NgaySinh: "",
  Kho_Ma: "",
  Shipper_HinhAnh: "",
  Lsp_Ma: "",
};

// UI badge config theo lshipper_ma — chỉ màu + icon, KHÔNG chứa label
const LSP_BADGE = {
  LSP01: {
    bg: "bg-yellow-50",
    text: "text-yellow-700",
    border: "border-yellow-200",
    icon: "inventory_2",
  },
  LSP02: {
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
    icon: "local_shipping",
  },
  LSP03: {
    bg: "bg-green-50",
    text: "text-green-700",
    border: "border-green-200",
    icon: "delivery_dining",
  },
};
const FALLBACK_BADGE = {
  bg: "bg-gray-50",
  text: "text-gray-700",
  border: "border-gray-200",
  icon: "badge",
};

const QuanLyShipper = () => {
  const { user } = useContext(AuthContext);
  const dvvc_ma = user?.DVVC_Ma || user?.dvvc_ma || user?.id;

  const [shippers, setShippers] = useState([]);
  const [khoList, setKhoList] = useState([]);
  const [tinhs, setTinhs] = useState([]);
  const [xas, setXas] = useState([]);
  const [loading, setLoading] = useState(true);

  // ← Lấy loại shipper ĐỘNG từ BE
  const { data: loaiShipperList, loading: loadingLoai } = useLoaiShipper();

  // ================= STATE BỘ LỌC =================
  const [filterTinh, setFilterTinh] = useState("");
  const [filterXa, setFilterXa] = useState("");
  const [filterKho, setFilterKho] = useState("");

  // ================= STATE MODAL =================
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [selectedFile, setSelectedFile] = useState(null);
  const [saving, setSaving] = useState(false);

  const [formFilterTinh, setFormFilterTinh] = useState("");
  const [formFilterXa, setFormFilterXa] = useState("");

  const [newAccountInfo, setNewAccountInfo] = useState(null);
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast((p) => ({ ...p, show: false })), 3000);
  };

  const fetchData = useCallback(async () => {
    if (!dvvc_ma) return;
    try {
      const [resShippers, resKho, resTinh, resXa] = await Promise.all([
        shipperService.getAll(dvvc_ma),
        khoService.getAll(dvvc_ma),
        axiosClient.get("/tinh"),
        axiosClient.get("/xa"),
      ]);
      setShippers(resShippers.data);
      setKhoList(resKho.data);
      setTinhs(resTinh.data);
      setXas(resXa.data);
    } catch (err) {
      showToast("Lỗi tải dữ liệu", "error");
    } finally {
      setLoading(false);
    }
  }, [dvvc_ma]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filterXasOptions = useMemo(() => {
    return xas.filter((xa) => String(xa.tinh_ma) === String(filterTinh));
  }, [xas, filterTinh]);

  const filterKhoOptions = useMemo(() => {
    return khoList.filter((kho) => {
      const matchTinh = filterTinh
        ? String(kho.Tinh_Ma) === String(filterTinh)
        : true;
      const matchXa = filterXa ? String(kho.Xa_Ma) === String(filterXa) : true;
      return matchTinh && matchXa;
    });
  }, [khoList, filterTinh, filterXa]);

  const filteredShippers = useMemo(() => {
    return shippers.filter((sp) => {
      const matchTinh = filterTinh
        ? String(sp.Tinh_Ma) === String(filterTinh)
        : true;
      const matchXa = filterXa ? String(sp.Xa_Ma) === String(filterXa) : true;
      const matchKho = filterKho
        ? String(sp.Kho_Ma) === String(filterKho)
        : true;
      return matchTinh && matchXa && matchKho;
    });
  }, [shippers, filterTinh, filterXa, filterKho]);

  const formFilteredXas = useMemo(() => {
    return xas.filter((xa) => String(xa.tinh_ma) === String(formFilterTinh));
  }, [xas, formFilterTinh]);

  const formFilteredKhos = useMemo(() => {
    return khoList.filter((kho) => {
      const matchTinh = formFilterTinh
        ? String(kho.Tinh_Ma) === String(formFilterTinh)
        : true;
      const matchXa = formFilterXa
        ? String(kho.Xa_Ma) === String(formFilterXa)
        : true;
      return matchTinh && matchXa;
    });
  }, [khoList, formFilterTinh, formFilterXa]);

  // Helper: lấy label hiển thị từ loaiShipperList (nguồn BE)
  const getLoaiLabel = useCallback(
    (lsp_ma) => {
      if (!lsp_ma) return "Chưa phân loại";
      const found = loaiShipperList.find((o) => o.Lshipper_Ma === lsp_ma);
      return found?.Lshipper_Ten || lsp_ma;
    },
    [loaiShipperList],
  );

  const handleOpenModal = (shipper = null) => {
    setSelectedFile(null);
    setFormFilterTinh("");
    setFormFilterXa("");
    if (shipper) {
      setIsEditing(true);
      setFormData({
        Shipper_Ma: shipper.Shipper_Ma,
        Shipper_Ten: shipper.Shipper_Ten,
        Shipper_SDT: shipper.Shipper_SDT,
        Shipper_GioiTinh: shipper.Shipper_GioiTinh ? "true" : "false",
        Shipper_NgaySinh: shipper.Shipper_NgaySinh
          ? shipper.Shipper_NgaySinh.split("T")[0]
          : "",
        Kho_Ma: shipper.Kho_Ma,
        Shipper_HinhAnh: shipper.Shipper_HinhAnh,
        Lsp_Ma: shipper.Lsp_Ma || "",
      });
      setFormFilterTinh(shipper.Tinh_Ma);
      setFormFilterXa(shipper.Xa_Ma);
    } else {
      setIsEditing(false);
      setFormData(EMPTY_FORM);
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.Kho_Ma) return showToast("Vui lòng chọn Kho hàng!", "error");
    if (!isEditing && !formData.Lsp_Ma)
      return showToast("Vui lòng chọn Loại Shipper!", "error");

    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("Shipper_Ten", formData.Shipper_Ten);
      fd.append("Shipper_SDT", formData.Shipper_SDT);
      fd.append("Shipper_GioiTinh", formData.Shipper_GioiTinh);
      fd.append("Shipper_NgaySinh", formData.Shipper_NgaySinh);
      fd.append("Kho_Ma", formData.Kho_Ma);
      if (selectedFile) fd.append("hinhanh", selectedFile);

      if (isEditing) {
        await shipperService.update(formData.Shipper_Ma, fd);
        showToast("Cập nhật shipper thành công!");
        setIsModalOpen(false);
        fetchData();
      } else {
        fd.append("Lsp_Ma", formData.Lsp_Ma);
        const res = await shipperService.create(fd);
        setNewAccountInfo(res.data.data);
        setIsModalOpen(false);
        fetchData();
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Lỗi lưu dữ liệu", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (shipper_ma) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa shipper này?")) return;
    try {
      await shipperService.delete(shipper_ma);
      showToast("Đã xóa shipper!");
      fetchData();
    } catch (err) {
      showToast("Lỗi khi xóa!", "error");
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    showToast("Đã copy!");
  };

  if (loading)
    return (
      <div className="p-10 text-center font-medium text-gray-500">
        Đang tải...
      </div>
    );

  return (
    <div className="p-6 bg-[#F8FAFC] min-h-screen">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A]">Quản Lý Shipper</h1>
          <p className="text-sm text-[#64748B] mt-1">
            Quản lý nhân sự giao hàng cho các kho
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="px-5 py-2.5 bg-[#2563EB] text-white rounded-xl text-sm font-bold shadow-sm hover:bg-[#1D4ED8] transition-colors flex items-center gap-1"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>{" "}
          Thêm Shipper Mới
        </button>
      </div>

      {/* BỘ LỌC */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-[#E2E8F0] mb-6 flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2 text-[#2563EB] font-bold text-sm">
          <span className="material-symbols-outlined">filter_alt</span> Bộ Lọc:
        </div>

        <select
          value={filterTinh}
          onChange={(e) => {
            setFilterTinh(e.target.value);
            setFilterXa("");
            setFilterKho("");
          }}
          className="px-4 py-2 rounded-xl border border-[#E2E8F0] outline-none text-sm bg-[#F8FAFC] min-w-[180px] focus:border-[#2563EB] cursor-pointer"
        >
          <option value="">-- Tất cả Tỉnh/Thành --</option>
          {tinhs.map((t) => (
            <option key={t.tinh_ma} value={t.tinh_ma}>
              {t.tinh_ten}
            </option>
          ))}
        </select>

        <select
          value={filterXa}
          onChange={(e) => {
            setFilterXa(e.target.value);
            setFilterKho("");
          }}
          disabled={!filterTinh}
          className="px-4 py-2 rounded-xl border border-[#E2E8F0] outline-none text-sm bg-[#F8FAFC] min-w-[180px] focus:border-[#2563EB] disabled:bg-gray-100 cursor-pointer"
        >
          <option value="">-- Tất cả Xã/Phường --</option>
          {filterXasOptions.map((x) => (
            <option key={x.xa_ma} value={x.xa_ma}>
              {x.xa_ten}
            </option>
          ))}
        </select>

        <select
          value={filterKho}
          onChange={(e) => setFilterKho(e.target.value)}
          className="px-4 py-2 rounded-xl border border-[#E2E8F0] outline-none text-sm bg-[#F8FAFC] min-w-[200px] focus:border-[#2563EB] cursor-pointer"
        >
          <option value="">-- Tất cả Kho Hàng --</option>
          {filterKhoOptions.map((k) => (
            <option key={k.Kho_Ma} value={k.Kho_Ma}>
              {k.Kho_Ten}
            </option>
          ))}
        </select>

        {(filterTinh || filterXa || filterKho) && (
          <button
            onClick={() => {
              setFilterTinh("");
              setFilterXa("");
              setFilterKho("");
            }}
            className="text-sm text-red-500 hover:underline font-medium ml-auto"
          >
            Xóa bộ lọc
          </button>
        )}
      </div>

      {/* BẢNG DANH SÁCH */}
      <div className="bg-white rounded-2xl shadow-sm border border-[#E2E8F0] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-[#F8FAFC] text-[#64748B] text-sm border-b border-[#E2E8F0]">
                <th className="p-4 font-semibold w-28">Mã</th>
                <th className="p-4 font-semibold w-20 text-center">Ảnh</th>
                <th className="p-4 font-semibold">Họ Tên & SĐT</th>
                <th className="p-4 font-semibold">Kho Quản Lý (Khu Vực)</th>
                <th className="p-4 font-semibold text-center w-32">Đánh Giá</th>
                <th className="p-4 font-semibold text-right w-28">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {filteredShippers.map((sp) => {
                const badge = LSP_BADGE[sp.Lsp_Ma] || FALLBACK_BADGE;
                return (
                  <tr
                    key={sp.Shipper_Ma}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="p-4">
                      <span className="font-mono text-sm text-[#2563EB] font-bold bg-blue-50 px-2 py-1 rounded-md">
                        {sp.Shipper_Ma}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <img
                        src={toAssetUrl(sp.Shipper_HinhAnh)}
                        className="w-11 h-11 rounded-full object-cover border-2 border-white shadow-sm ring-1 ring-[#E2E8F0] mx-auto"
                        onError={(e) =>
                          (e.target.src =
                            "https://ui-avatars.com/api/?name=" +
                            sp.Shipper_Ten +
                            "&background=random&color=fff")
                        }
                      />
                    </td>
                    <td className="p-4">
                      <p className="font-bold text-[#0F172A] text-base">
                        {sp.Shipper_Ten}
                      </p>
                      <p className="text-sm text-[#64748B] mt-0.5 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">
                          call
                        </span>{" "}
                        {sp.Shipper_SDT}
                      </p>
                      {/* Label động — lấy từ BE (sp.Lshipper_Ten) */}
                      <span
                        className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded border mt-1.5 ${badge.bg} ${badge.text} ${badge.border}`}
                      >
                        <span className="material-symbols-outlined text-[12px]">
                          {badge.icon}
                        </span>
                        {sp.Lshipper_Ten || getLoaiLabel(sp.Lsp_Ma)}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="inline-flex flex-col gap-0.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-semibold border border-indigo-100">
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[16px]">
                            warehouse
                          </span>{" "}
                          {sp.Kho_Ten}
                        </span>
                        <span className="text-[11px] font-normal text-indigo-500 pl-5">
                          {sp.Xa_Ten}, {sp.Tinh_Ten}
                        </span>
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-1 text-sm font-bold text-[#0F172A]">
                        <span
                          className="material-symbols-outlined text-[18px] text-[#F59E0B]"
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          star
                        </span>
                        {Number(sp.Shipper_DiemDanhGia).toFixed(1)}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenModal(sp)}
                          className="w-8 h-8 flex items-center justify-center bg-blue-50 text-[#2563EB] rounded-lg hover:bg-blue-100 transition-colors"
                          title="Sửa"
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            edit
                          </span>
                        </button>
                        <button
                          onClick={() => handleDelete(sp.Shipper_Ma)}
                          className="w-8 h-8 flex items-center justify-center bg-red-50 text-[#DC2626] rounded-lg hover:bg-red-100 transition-colors"
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
              })}
              {filteredShippers.length === 0 && (
                <tr>
                  <td colSpan="6" className="p-10 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center">
                      <span className="material-symbols-outlined text-5xl text-gray-300 mb-2">
                        person_search
                      </span>
                      <p>Không tìm thấy shipper nào phù hợp với bộ lọc.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL THÊM/SỬA */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-[#E2E8F0] flex justify-between items-center sticky top-0 bg-white z-10">
              <h3 className="text-xl font-bold text-[#0F172A]">
                {isEditing ? "Cập Nhật Shipper" : "Thêm Shipper Mới"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-red-500"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1">
                    Họ Tên *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.Shipper_Ten}
                    onChange={(e) =>
                      setFormData({ ...formData, Shipper_Ten: e.target.value })
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-[#E2E8F0] outline-none focus:border-[#2563EB]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">
                    Số điện thoại *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.Shipper_SDT}
                    onChange={(e) =>
                      setFormData({ ...formData, Shipper_SDT: e.target.value })
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-[#E2E8F0] outline-none focus:border-[#2563EB]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1">
                    Ngày sinh *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.Shipper_NgaySinh}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        Shipper_NgaySinh: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-[#E2E8F0] outline-none focus:border-[#2563EB]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">
                    Giới tính
                  </label>
                  <select
                    value={formData.Shipper_GioiTinh}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        Shipper_GioiTinh: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-[#E2E8F0] outline-none bg-white"
                  >
                    <option value="true">Nam</option>
                    <option value="false">Nữ</option>
                  </select>
                </div>
              </div>

              {/* Loại Shipper — FETCH ĐỘNG từ BE */}
              <div>
                <label className="block text-sm font-semibold mb-1">
                  Loại Shipper *{" "}
                  {isEditing && (
                    <span className="text-xs text-gray-400 font-normal">
                      (Không thể đổi sau khi tạo)
                    </span>
                  )}
                </label>
                {isEditing ? (
                  <div className="w-full px-4 py-2.5 rounded-xl border border-[#E2E8F0] bg-gray-50 text-sm flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-gray-400">
                      lock
                    </span>
                    <span className="font-semibold text-[#0F172A]">
                      {getLoaiLabel(formData.Lsp_Ma)}
                    </span>
                    <span className="text-xs text-gray-500 ml-auto font-mono">
                      {formData.Lsp_Ma}
                    </span>
                  </div>
                ) : (
                  <select
                    required
                    value={formData.Lsp_Ma}
                    onChange={(e) =>
                      setFormData({ ...formData, Lsp_Ma: e.target.value })
                    }
                    disabled={loadingLoai}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#E2E8F0] outline-none focus:border-[#2563EB] bg-white disabled:bg-gray-100"
                  >
                    <option value="">
                      {loadingLoai ? "Đang tải..." : "-- Chọn loại Shipper --"}
                    </option>
                    {loaiShipperList.map((o) => (
                      <option key={o.Lshipper_Ma} value={o.Lshipper_Ma}>
                        {o.Lshipper_Ten} ({o.Lshipper_Ma})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">
                  Ảnh chân dung
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setSelectedFile(e.target.files[0])}
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-blue-50 file:text-[#2563EB]"
                />
              </div>

              <div className="bg-[#F8FAFC] p-4 rounded-xl border border-[#E2E8F0] space-y-3 mt-4">
                <p className="text-sm font-bold text-[#2563EB] flex items-center gap-1">
                  <span className="material-symbols-outlined text-[18px]">
                    filter_alt
                  </span>{" "}
                  Chọn Kho Quản Lý
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <select
                    value={formFilterTinh}
                    onChange={(e) => {
                      setFormFilterTinh(e.target.value);
                      setFormFilterXa("");
                      setFormData({ ...formData, Kho_Ma: "" });
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] outline-none text-sm bg-white"
                  >
                    <option value="">-- Lọc theo Tỉnh/Thành --</option>
                    {tinhs.map((t) => (
                      <option key={t.tinh_ma} value={t.tinh_ma}>
                        {t.tinh_ten}
                      </option>
                    ))}
                  </select>
                  <select
                    value={formFilterXa}
                    onChange={(e) => {
                      setFormFilterXa(e.target.value);
                      setFormData({ ...formData, Kho_Ma: "" });
                    }}
                    disabled={!formFilterTinh}
                    className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] outline-none text-sm bg-white disabled:bg-gray-100"
                  >
                    <option value="">-- Lọc theo Xã/Phường --</option>
                    {formFilteredXas.map((x) => (
                      <option key={x.xa_ma} value={x.xa_ma}>
                        {x.xa_ten}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <select
                    required
                    value={formData.Kho_Ma}
                    onChange={(e) =>
                      setFormData({ ...formData, Kho_Ma: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg border-2 border-[#2563EB] outline-none text-sm font-semibold bg-white"
                  >
                    <option value="">-- Chọn Kho Hàng --</option>
                    {formFilteredKhos.map((k) => (
                      <option key={k.Kho_Ma} value={k.Kho_Ma}>
                        {k.Kho_Ten}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t mt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2.5 rounded-xl font-semibold text-[#64748B] hover:bg-gray-100"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-8 py-2.5 bg-[#2563EB] text-white rounded-xl font-bold hover:bg-[#1D4ED8] disabled:bg-gray-400"
                >
                  {saving
                    ? "Đang lưu..."
                    : isEditing
                      ? "Lưu Thay Đổi"
                      : "Tạo Tài Khoản"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL TÀI KHOẢN VỪA TẠO */}
      {newAccountInfo && (
        <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-xl text-center">
            <div className="p-6 border-b border-[#E2E8F0] bg-green-50">
              <span className="material-symbols-outlined text-5xl text-green-500 mb-2">
                check_circle
              </span>
              <h3 className="text-xl font-bold text-green-700">
                Tạo Tài Khoản Thành Công!
              </h3>
              <p className="text-sm text-green-600 mt-1">
                Vui lòng gửi thông tin này cho Shipper để đăng nhập.
              </p>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <p className="text-sm text-gray-500 text-left mb-1">
                  Mã Shipper
                </p>
                <p className="text-lg font-bold text-[#2563EB] text-left bg-blue-50 p-2 rounded">
                  {newAccountInfo.Shipper_Ma}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 text-left mb-1">
                  Loại Shipper
                </p>
                <p className="text-lg font-bold text-[#0F172A] text-left bg-gray-50 p-2 rounded">
                  {getLoaiLabel(newAccountInfo.Lsp_Ma)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 text-left mb-1">
                  Tên đăng nhập (SĐT)
                </p>
                <div className="flex gap-2">
                  <p className="flex-1 text-lg font-bold text-[#0F172A] text-left bg-gray-50 p-2 rounded">
                    {newAccountInfo.Shipper_SDT}
                  </p>
                  <button
                    onClick={() => copyToClipboard(newAccountInfo.Shipper_SDT)}
                    className="px-3 bg-gray-200 rounded hover:bg-gray-300 text-sm font-semibold"
                  >
                    Copy
                  </button>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500 text-left mb-1">
                  Mật khẩu (Chỉ hiển thị 1 lần)
                </p>
                <div className="flex gap-2">
                  <p className="flex-1 text-lg font-bold text-red-600 tracking-widest text-left bg-red-50 p-2 rounded">
                    {newAccountInfo.PlainPassword}
                  </p>
                  <button
                    onClick={() =>
                      copyToClipboard(newAccountInfo.PlainPassword)
                    }
                    className="px-3 bg-gray-200 rounded hover:bg-gray-300 text-sm font-semibold"
                  >
                    Copy
                  </button>
                </div>
              </div>
            </div>

            <div className="p-4 bg-gray-50 border-t">
              <button
                onClick={() => setNewAccountInfo(null)}
                className="w-full py-2.5 bg-[#2563EB] text-white rounded-xl font-bold hover:bg-[#1D4ED8]"
              >
                Đã hiểu và Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      <ToastNotification toast={toast} />
    </div>
  );
};

export default QuanLyShipper;
