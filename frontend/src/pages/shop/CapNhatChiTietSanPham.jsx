// src/pages/shop/CapNhatChiTietSanPham.jsx
import { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import sanPhamService from "../../services/gianhang/sanPhamService";
import chiTietSanPhamService from "../../services/gianhang/chiTietSanPhamService";
import axiosClient from "../../config/axiosClient";
import {
  Card,
  fieldClass,
  labelClass,
  imgUrl,
  getCurrentShopId,
  buildNganhHangTree,
  getLeafNganhHangs,
} from "../../components/shop/SanPhamShared";

const LIST_PATH = "/shop/san-pham";

// 🟢 Thêm ctsp_chieucao vào EMPTY_FORM
const EMPTY_FORM = {
  ctsp_ten: "",
  ctsp_mota: "",
  nh_ma: "",
  ctsp_soluongton: 1,
  ctsp_chieudai: 10,
  ctsp_chieurong: 10,
  ctsp_chieucao: 10,
  ctsp_khoiluong: 1,
  gb_gia: 0,
  thuoctinh: [],
};

const CapNhatChiTietSanPham = () => {
  const { sp_ma, ctsp_ma } = useParams();
  const isEdit = Boolean(ctsp_ma);
  const navigate = useNavigate();
  const detailPath = `/nguoi-ban/quan-ly-san-pham/${sp_ma}`;
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [productName, setProductName] = useState("");
  const [allAttributes, setAllAttributes] = useState([]);
  const [nganhHangs, setNganhHangs] = useState([]);

  const [formData, setFormData] = useState(EMPTY_FORM);
  const [images, setImages] = useState([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const leafNganhHangs = getLeafNganhHangs(buildNganhHangTree(nganhHangs));
  const currentNganhHangIsInvalidLeaf =
    !!formData.nh_ma && !leafNganhHangs.some((l) => l.nh_ma === formData.nh_ma);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      setError("");
      try {
        const shopId = getCurrentShopId();
        const [resProducts, resVariants, resAttrs, resNh] = await Promise.all([
          sanPhamService.getByGianHang(shopId),
          chiTietSanPhamService.getBySanPham(sp_ma),
          axiosClient.get("/thuoc-tinh-san-pham"),
          axiosClient.get("/nganh-hang"),
        ]);

        const product = resProducts.data.find((p) => p.sp_ma === sp_ma);
        setProductName(product?.sp_ten || "");
        setAllAttributes(resAttrs.data || []);
        setNganhHangs(resNh.data || []);

        if (isEdit) {
          const ct = resVariants.data.find((v) => v.ctsp_ma === ctsp_ma);
          if (!ct) {
            setNotFound(true);
          } else {
            setFormData({
              ctsp_ten: ct.ctsp_ten,
              ctsp_mota: ct.ctsp_mota || "",
              nh_ma: ct.nh_ma || "",
              ctsp_soluongton: ct.ctsp_soluongton,
              ctsp_chieudai: ct.ctsp_chieudai,
              ctsp_chieurong: ct.ctsp_chieurong,
              ctsp_chieucao: ct.ctsp_chieucao || 10, // 🟢 Load chiều cao
              ctsp_khoiluong: ct.ctsp_khoiluong,
              gb_gia: ct.gb_gia || 0,
              thuoctinh: (ct.thuoctinh || []).map((tt) => ({
                ttsp_ma: tt.ttsp_ma,
                gttt_giatridinhtinh: tt.gttt_giatridinhtinh || "",
                gttt_giatridinhluong:
                  tt.gttt_giatridinhluong === null ||
                  tt.gttt_giatridinhluong === undefined
                    ? ""
                    : String(tt.gttt_giatridinhluong),
              })),
            });
            setImages(
              (ct.images || []).map((img) => ({
                hasp_ma: img.hasp_ma,
                hasp_link: img.hasp_link,
                preview: imgUrl(img.hasp_link),
                mota: img.hasp_mota || "",
                laanhchinh: img.hasp_laanhchinh,
              })),
            );
          }
        } else {
          setFormData(EMPTY_FORM);
          setImages([]);
        }
      } catch (err) {
        console.error(err);
        setError("Không tải được dữ liệu. Vui lòng thử lại.");
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [sp_ma, ctsp_ma]);

  const handleSelectImages = (e) => {
    const files = Array.from(e.target.files);
    const newImages = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      mota: "",
      laanhchinh: false,
      hasp_ma: null,
    }));
    setImages((prev) => [...prev, ...newImages]);
    e.target.value = "";
  };

  const handleRemoveImage = (index) => {
    setImages((prev) => {
      const target = prev[index];
      if (target?.preview?.startsWith("blob:"))
        URL.revokeObjectURL(target.preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleUpdateImageInfo = (index, field, value) => {
    setImages((prev) => {
      const next = prev.map((img) => ({ ...img }));
      if (field === "laanhchinh" && value === true) {
        next.forEach((img) => (img.laanhchinh = false));
      }
      next[index][field] = value;
      return next;
    });
  };

  const handleMoveImage = (index, direction) => {
    const target = index + direction;
    if (target < 0 || target >= images.length) return;
    const next = [...images];
    [next[index], next[target]] = [next[target], next[index]];
    setImages(next);
  };

  const handleAddAttrRow = () => {
    setFormData((prev) => ({
      ...prev,
      thuoctinh: [
        ...prev.thuoctinh,
        { ttsp_ma: "", gttt_giatridinhtinh: "", gttt_giatridinhluong: "" },
      ],
    }));
  };

  const handleUpdateAttrRow = (index, field, value) => {
    setFormData((prev) => {
      const next = prev.thuoctinh.map((r) => ({ ...r }));
      next[index][field] = value;
      return { ...prev, thuoctinh: next };
    });
  };

  const handleRemoveAttrRow = (index) => {
    setFormData((prev) => ({
      ...prev,
      thuoctinh: prev.thuoctinh.filter((_, i) => i !== index),
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.ctsp_ten) return setError("Vui lòng nhập tên phân loại.");
    if (!formData.nh_ma)
      return setError("Vui lòng chọn ngành hàng con cuối cùng cho phân loại.");
    if (currentNganhHangIsInvalidLeaf)
      return setError(
        "Ngành hàng hiện tại là ngành cha (có ngành con). Vui lòng chọn lại ngành hàng con cuối cùng.",
      );

    setSaving(true);
    setError("");
    try {
      const dataToSend = new FormData();
      dataToSend.append("sp_ma", sp_ma);
      dataToSend.append("ctsp_ten", formData.ctsp_ten);
      dataToSend.append("ctsp_mota", formData.ctsp_mota);
      dataToSend.append("nh_ma", formData.nh_ma);
      dataToSend.append("ctsp_soluongton", formData.ctsp_soluongton);
      dataToSend.append("ctsp_chieudai", formData.ctsp_chieudai);
      dataToSend.append("ctsp_chieurong", formData.ctsp_chieurong);
      dataToSend.append("ctsp_chieucao", formData.ctsp_chieucao); // 🟢 Gửi chiều cao
      dataToSend.append("ctsp_khoiluong", formData.ctsp_khoiluong);
      dataToSend.append("gb_gia", formData.gb_gia);

      const imageMetas = images.map((img, index) => ({
        hasp_ma: img.hasp_ma || null,
        hasp_link: img.hasp_link || null,
        mota: img.mota,
        laanhchinh: img.laanhchinh,
        thutu: index + 1,
      }));
      dataToSend.append("image_metas", JSON.stringify(imageMetas));

      images.forEach((img) => {
        if (img.file) dataToSend.append("hinhanh", img.file);
      });

      const cleanAttrs = formData.thuoctinh
        .filter((tt) => tt.ttsp_ma)
        .map((tt) => ({
          ttsp_ma: tt.ttsp_ma,
          gttt_giatridinhtinh: tt.gttt_giatridinhtinh || null,
          gttt_giatridinhluong:
            tt.gttt_giatridinhluong === "" ||
            tt.gttt_giatridinhluong === null ||
            tt.gttt_giatridinhluong === undefined
              ? null
              : Number(tt.gttt_giatridinhluong),
        }));
      dataToSend.append("thuoctinh", JSON.stringify(cleanAttrs));

      if (isEdit) {
        await chiTietSanPhamService.update(ctsp_ma, dataToSend);
      } else {
        await chiTietSanPhamService.create(dataToSend);
      }

      navigate(detailPath, {
        state: {
          toast: isEdit
            ? "Cập nhật phân loại thành công!"
            : "Thêm phân loại thành công!",
        },
      });
    } catch (err) {
      setError(err.response?.data?.message || "Lỗi khi lưu phân loại");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-[#7A857F]">
        Đang tải...
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <p className="text-[#5B6661]">Không tìm thấy phân loại này.</p>
        <Link
          to={detailPath}
          className="font-semibold text-[#8A5A0B] hover:underline"
        >
          Quay lại chi tiết sản phẩm
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <nav className="flex min-w-0 items-center gap-2 text-sm">
          <Link
            to={detailPath}
            className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 font-medium text-[#3D4A44] hover:bg-[#F1EEE6]"
          >
            <span className="material-symbols-outlined text-[18px]">
              arrow_back
            </span>
            Chi tiết sản phẩm
          </Link>
          <span className="text-[#C9C3B5]">/</span>
          <span className="truncate text-[#5B6661]">
            {productName || sp_ma}
          </span>
          <span className="text-[#C9C3B5]">/</span>
          <span className="font-semibold text-[#14201C]">
            {isEdit ? "Sửa phân loại" : "Thêm phân loại"}
          </span>
        </nav>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => navigate(detailPath)}
            className="rounded-lg border px-5 py-2.5 font-medium text-gray-600 transition-colors hover:bg-gray-50"
          >
            Hủy bỏ
          </button>
          <button
            type="submit"
            form="form-phan-loai"
            disabled={saving}
            className="rounded-lg bg-[#14201C] px-5 py-2.5 font-bold text-white transition-colors hover:bg-[#1E3A34] disabled:opacity-50"
          >
            {saving
              ? "Đang lưu..."
              : isEdit
                ? "Lưu thay đổi"
                : "Thêm phân loại"}
          </button>
        </div>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-[#14201C]">
          {isEdit ? "Sửa phân loại" : "Thêm phân loại mới"}
        </h1>
        <p className="mt-1 text-sm text-[#7A857F]">
          Mỗi phân loại có ngành hàng, giá, tồn kho, thuộc tính và bộ ảnh riêng.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <form
        id="form-phan-loai"
        onSubmit={handleSave}
        className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_400px]"
      >
        <Card className="space-y-7 p-6">
          <section className="space-y-4">
            <h2 className="text-sm font-bold text-[#14201C]">Thông tin</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="block space-y-1.5">
                <span className={labelClass}>
                  Tên phân loại <span className="text-[#B42318]">*</span>
                </span>
                <input
                  type="text"
                  required
                  value={formData.ctsp_ten}
                  onChange={(e) =>
                    setFormData({ ...formData, ctsp_ten: e.target.value })
                  }
                  className={fieldClass}
                  placeholder="VD: Màu đỏ, Size L..."
                />
              </label>
              <label className="block space-y-1.5">
                <span className={labelClass}>
                  Ngành hàng <span className="text-[#B42318]">*</span>
                </span>
                <select
                  required
                  value={formData.nh_ma}
                  onChange={(e) =>
                    setFormData({ ...formData, nh_ma: e.target.value })
                  }
                  className={fieldClass}
                >
                  <option value="">-- Chọn ngành hàng --</option>
                  {currentNganhHangIsInvalidLeaf && (
                    <option value={formData.nh_ma} disabled>
                      ⚠ Ngành hàng cũ không hợp lệ — vui lòng chọn lại
                    </option>
                  )}
                  {leafNganhHangs.map((nh) => (
                    <option key={nh.nh_ma} value={nh.nh_ma}>
                      {nh.path}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block space-y-1.5 md:col-span-2">
                <span className={labelClass}>Mô tả phân loại</span>
                <textarea
                  rows="3"
                  value={formData.ctsp_mota}
                  onChange={(e) =>
                    setFormData({ ...formData, ctsp_mota: e.target.value })
                  }
                  className={`${fieldClass} resize-y`}
                  placeholder="Mô tả ngắn cho phân loại này..."
                />
              </label>
            </div>
          </section>

          <section className="space-y-4 border-t border-[#EFEBE2] pt-6">
            <h2 className="text-sm font-bold text-[#14201C]">Giá & tồn kho</h2>

            <div className="rounded-xl border border-[#F2A93B]/40 bg-[#FDF3E1]/60 p-3 text-xs text-[#8A5A0B]">
              <p className="flex items-start gap-1.5">
                <span className="material-symbols-outlined text-[16px]">
                  info
                </span>
                <span>
                  <b>Giá bán gốc</b> là số tiền <b>shop bạn nhận được</b>.{" "}
                  <b>Giá khách trả</b> sẽ được <b>tự động tính</b> = giá gốc +
                  phí sàn của ngành hàng đã chọn.
                </span>
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <label className="block space-y-1.5">
                <span className={labelClass}>
                  Giá bán gốc (shop nhận){" "}
                  <span className="text-[#B42318]">*</span>
                </span>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={formData.gb_gia}
                  onChange={(e) =>
                    setFormData({ ...formData, gb_gia: e.target.value })
                  }
                  className={fieldClass}
                  placeholder="VD: 150000"
                />
                <span className="block text-xs text-[#7A857F]">
                  Nhập số tiền shop thực nhận sau khi trừ phí sàn.
                </span>
              </label>
              <label className="block space-y-1.5">
                <span className={labelClass}>Số lượng tồn</span>
                <input
                  type="number"
                  min="0"
                  value={formData.ctsp_soluongton}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      ctsp_soluongton: e.target.value,
                    })
                  }
                  className={fieldClass}
                />
              </label>
            </div>

            {isEdit && (
              <div className="rounded-lg bg-[#F8F9FA] p-3 text-xs text-[#5B6661]">
                <span className="material-symbols-outlined align-middle text-[14px] text-[#7A857F]">
                  receipt_long
                </span>{" "}
                Giá khách trả hiện tại được lưu trong hệ thống: xem ở{" "}
                <b>trang chi tiết sản phẩm</b> sau khi lưu.
              </div>
            )}
          </section>

          {/* 🟢 Cập nhật phần Kích thước & khối lượng (chia 4 cột) */}
          <section className="space-y-4 border-t border-[#EFEBE2] pt-6">
            <h2 className="text-sm font-bold text-[#14201C]">
              Kích thước & khối lượng
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <label className="block space-y-1.5">
                <span className={labelClass}>Dài (cm)</span>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={formData.ctsp_chieudai}
                  onChange={(e) =>
                    setFormData({ ...formData, ctsp_chieudai: e.target.value })
                  }
                  className={fieldClass}
                />
              </label>
              <label className="block space-y-1.5">
                <span className={labelClass}>Rộng (cm)</span>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={formData.ctsp_chieurong}
                  onChange={(e) =>
                    setFormData({ ...formData, ctsp_chieurong: e.target.value })
                  }
                  className={fieldClass}
                />
              </label>
              {/* 🟢 Ô nhập Chiều cao */}
              <label className="block space-y-1.5">
                <span className={labelClass}>Cao (cm)</span>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={formData.ctsp_chieucao}
                  onChange={(e) =>
                    setFormData({ ...formData, ctsp_chieucao: e.target.value })
                  }
                  className={fieldClass}
                />
              </label>
              <label className="block space-y-1.5">
                <span className={labelClass}>Nặng (kg)</span>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={formData.ctsp_khoiluong}
                  onChange={(e) =>
                    setFormData({ ...formData, ctsp_khoiluong: e.target.value })
                  }
                  className={fieldClass}
                />
              </label>
            </div>
          </section>

          <section className="space-y-3 border-t border-[#EFEBE2] pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-[#14201C]">
                  Thuộc tính ({formData.thuoctinh.length})
                </h2>
                <p className="text-xs text-[#7A857F]">
                  Chọn thuộc tính và nhập giá trị (chữ hoặc số).
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddAttrRow}
                className="flex items-center gap-1 rounded-lg bg-[#FDF3E1] px-3 py-1.5 text-sm font-semibold text-[#8A5A0B] hover:bg-[#FCE9C9]"
              >
                <span className="material-symbols-outlined text-[18px]">
                  add
                </span>
                Thêm thuộc tính
              </button>
            </div>

            {formData.thuoctinh.length === 0 ? (
              <div className="rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 p-6 text-center text-sm text-gray-400">
                Chưa có thuộc tính nào. Bấm "Thêm thuộc tính" để bắt đầu.
              </div>
            ) : (
              <div className="space-y-2">
                {formData.thuoctinh.map((row, idx) => {
                  const usedIds = formData.thuoctinh
                    .filter((_, i) => i !== idx)
                    .map((r) => r.ttsp_ma)
                    .filter(Boolean);

                  return (
                    <div
                      key={idx}
                      className="grid grid-cols-1 items-end gap-2 rounded-xl border border-gray-200 bg-white p-3 md:grid-cols-[1.4fr_1fr_1fr_auto]"
                    >
                      <label className="block">
                        <span className="text-xs font-medium text-[#7A857F]">
                          Thuộc tính
                        </span>
                        <select
                          value={row.ttsp_ma}
                          onChange={(e) =>
                            handleUpdateAttrRow(idx, "ttsp_ma", e.target.value)
                          }
                          className={fieldClass}
                        >
                          <option value="">-- Chọn --</option>
                          {allAttributes
                            .filter(
                              (a) =>
                                !usedIds.includes(a.thsp_ma) ||
                                a.thsp_ma === row.ttsp_ma,
                            )
                            .map((a) => (
                              <option key={a.thsp_ma} value={a.thsp_ma}>
                                {a.thsp_ten}
                              </option>
                            ))}
                        </select>
                      </label>
                      <label className="block">
                        <span className="text-xs font-medium text-[#7A857F]">
                          Giá trị (chữ)
                        </span>
                        <input
                          type="text"
                          value={row.gttt_giatridinhtinh}
                          onChange={(e) =>
                            handleUpdateAttrRow(
                              idx,
                              "gttt_giatridinhtinh",
                              e.target.value,
                            )
                          }
                          className={fieldClass}
                          placeholder="VD: Đỏ, Cotton..."
                        />
                      </label>
                      <label className="block">
                        <span className="text-xs font-medium text-[#7A857F]">
                          Giá trị (số)
                        </span>
                        <input
                          type="number"
                          value={row.gttt_giatridinhluong}
                          onChange={(e) =>
                            handleUpdateAttrRow(
                              idx,
                              "gttt_giatridinhluong",
                              e.target.value,
                            )
                          }
                          className={fieldClass}
                          placeholder="VD: 100"
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => handleRemoveAttrRow(idx)}
                        className="mb-1 rounded-lg p-2 text-red-500 hover:bg-red-50"
                        title="Xóa dòng"
                      >
                        <span className="material-symbols-outlined text-[20px]">
                          delete
                        </span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </Card>

        <Card className="space-y-4 p-6 lg:sticky lg:top-24">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-[#14201C]">
                Hình ảnh ({images.length})
              </h2>
              <p className="text-xs text-[#7A857F]">
                Đặt ảnh chính, sắp xếp thứ tự và thêm mô tả cho từng ảnh.
              </p>
            </div>
            <label className="flex cursor-pointer items-center gap-1 rounded-lg bg-blue-50 px-3 py-1.5 text-sm font-semibold text-blue-600 transition-colors hover:bg-blue-100">
              <span className="material-symbols-outlined text-[18px]">
                add_photo_alternate
              </span>
              Tải ảnh lên
              <input
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={handleSelectImages}
              />
            </label>
          </div>

          {images.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 p-6 text-center text-sm text-gray-400">
              Chưa có ảnh nào. Bấm “Tải ảnh lên” để thêm.
            </div>
          ) : (
            <div className="max-h-[70vh] space-y-3 overflow-y-auto pr-1">
              {images.map((img, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-3 shadow-sm"
                >
                  <div className="flex flex-col items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#14201C] text-xs font-bold text-white">
                      {idx + 1}
                    </span>
                    <img
                      src={img.preview}
                      alt="preview"
                      className="h-16 w-16 rounded-lg border object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <input
                      type="text"
                      placeholder="Mô tả cho ảnh này..."
                      value={img.mota}
                      onChange={(e) =>
                        handleUpdateImageInfo(idx, "mota", e.target.value)
                      }
                      className="w-full border-b border-gray-300 bg-transparent py-1 text-sm outline-none focus:border-[#F2A93B]"
                    />
                    <label className="mt-2 flex cursor-pointer items-center gap-1.5 text-sm text-gray-600">
                      <input
                        type="radio"
                        name="anhchinh"
                        checked={!!img.laanhchinh}
                        onChange={() =>
                          handleUpdateImageInfo(idx, "laanhchinh", true)
                        }
                        className="h-4 w-4 accent-[#F2A93B]"
                      />
                      Đặt làm ảnh chính
                    </label>
                  </div>
                  <div className="flex shrink-0 flex-col gap-1">
                    <button
                      type="button"
                      onClick={() => handleMoveImage(idx, -1)}
                      disabled={idx === 0}
                      className="rounded p-1 text-gray-500 transition-colors hover:bg-gray-100 hover:text-[#14201C] disabled:opacity-30 disabled:hover:bg-transparent"
                      title="Di chuyển lên"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        arrow_upward
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMoveImage(idx, 1)}
                      disabled={idx === images.length - 1}
                      className="rounded p-1 text-gray-500 transition-colors hover:bg-gray-100 hover:text-[#14201C] disabled:opacity-30 disabled:hover:bg-transparent"
                      title="Di chuyển xuống"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        arrow_downward
                      </span>
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(idx)}
                    className="shrink-0 rounded-lg p-2 text-red-500 transition-colors hover:bg-red-50"
                    title="Xóa ảnh"
                  >
                    <span className="material-symbols-outlined">delete</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </Card>
      </form>
    </div>
  );
};

export default CapNhatChiTietSanPham;
