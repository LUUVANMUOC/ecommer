import React from "react";
import ImageUpload from "../ImageUpload";

const VoucherForm = ({
  formData,
  handleInputChange,
  imageFile,
  setImageFile,
  setFormData,
}) => {
  return (
    <div className="space-y-4">
      {/* Mã Voucher */}
      <div>
        <label className="text-label-md font-label-md text-on-surface block mb-1.5 flex justify-between">
          <span>Mã Voucher (Hệ thống tự sinh)</span>
          <span className="text-primary text-xs italic">Không thể sửa</span>
        </label>
        <input
          readOnly
          name="MGG_San_Ma"
          value={formData.MGG_San_Ma}
          className="w-full font-mono uppercase font-bold bg-surface-container-high border border-outline-variant rounded-lg px-3 py-2 text-on-surface cursor-not-allowed"
        />
      </div>

      {/* Tên chương trình */}
      <div>
        <label className="text-label-md font-label-md text-on-surface block mb-1.5">
          Tên Chương Trình <span className="text-error">*</span>
        </label>
        <input
          required
          name="MGG_San_Ten"
          value={formData.MGG_San_Ten}
          onChange={handleInputChange}
          maxLength={50}
          className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 text-on-surface focus:ring-2 focus:ring-primary"
          placeholder="VD: Siêu Sale Công Nghệ"
        />
      </div>

      {/* Các trường số - Hàng 1 */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="text-label-md font-label-md text-on-surface block mb-1.5">
            Giảm (%) <span className="text-error">*</span>
          </label>
          <input
            required
            type="number"
            min="0"
            max="100"
            step="0.01"
            name="MGG_San_PhanTramGiam"
            value={formData.MGG_San_PhanTramGiam}
            onChange={handleInputChange}
            className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 text-on-surface focus:ring-2 focus:ring-primary"
          />
        </div>
        <div>
          <label className="text-label-md font-label-md text-on-surface block mb-1.5">
            Giảm tối đa (VNĐ)
          </label>
          <input
            type="number"
            min="0"
            step="1000"
            name="MGG_San_SoTienToiDaMoiLan"
            value={formData.MGG_San_SoTienToiDaMoiLan}
            onChange={handleInputChange}
            className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 text-on-surface focus:ring-2 focus:ring-primary"
          />
        </div>
        <div>
          <label className="text-label-md font-label-md text-on-surface block mb-1.5">
            Đơn tối thiểu <span className="text-error">*</span>
          </label>
          <input
            required
            type="number"
            min="0"
            step="1000"
            name="MGG_San_GiaTriDonToiThieu"
            value={formData.MGG_San_GiaTriDonToiThieu}
            onChange={handleInputChange}
            className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 text-on-surface focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {/* Các trường số - Hàng 2 */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-label-md font-label-md text-on-surface block mb-1.5">
            Tổng SL ban đầu <span className="text-error">*</span>
          </label>
          <input
            required
            type="number"
            min="1"
            name="MGG_San_SoLuongBanDau"
            value={formData.MGG_San_SoLuongBanDau}
            onChange={handleInputChange}
            className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 text-on-surface focus:ring-2 focus:ring-primary"
          />
        </div>
        <div>
          <label className="text-label-md font-label-md text-on-surface block mb-1.5">
            SL còn lại <span className="text-error">*</span>
          </label>
          <input
            required
            type="number"
            min="0"
            name="MGG_San_SoLuongConLai"
            value={formData.MGG_San_SoLuongConLai}
            onChange={handleInputChange}
            className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 text-on-surface focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {/* Thời gian */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-label-md font-label-md text-on-surface block mb-1.5">
            Bắt đầu
          </label>
          <input
            type="datetime-local"
            name="MGG_San_ThoiDiemBatDau"
            value={formData.MGG_San_ThoiDiemBatDau}
            onChange={handleInputChange}
            className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 text-on-surface focus:ring-2 focus:ring-primary"
          />
        </div>
        <div>
          <label className="text-label-md font-label-md text-on-surface block mb-1.5">
            Kết thúc
          </label>
          <input
            type="datetime-local"
            name="MGG_San_ThoiDiemKetThuc"
            value={formData.MGG_San_ThoiDiemKetThuc}
            onChange={handleInputChange}
            className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 text-on-surface focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {/* Lưu ý */}
      <div className="bg-primary-fixed/30 border border-primary/20 rounded-lg p-3.5 flex gap-3 items-start">
        <span className="material-symbols-outlined text-primary text-xl">
          info
        </span>
        <div className="text-xs text-on-surface-variant leading-relaxed">
          <p className="font-semibold text-on-surface mb-1">
            Lưu ý khi nhập dữ liệu:
          </p>
          <ul className="list-disc pl-4 space-y-1">
            <li>
              <strong className="text-on-surface">Giảm (%):</strong> Chỉ nhập
              giá trị từ 0 đến 100.
            </li>
            <li>
              <strong className="text-on-surface">Giảm tối đa:</strong> Nhập{" "}
              <code className="bg-surface-container px-1 rounded">0</code> nếu
              muốn giảm không giới hạn số tiền.
            </li>
            <li>
              <strong className="text-on-surface">Đơn tối thiểu:</strong> Giá
              trị hóa đơn tối thiểu để khách được áp dụng mã.
            </li>
            <li>
              <strong className="text-on-surface">Số lượng:</strong>{" "}
              <em>Số lượng còn lại</em> không được phép lớn hơn{" "}
              <em>Tổng số lượng ban đầu</em>.
            </li>
          </ul>
        </div>
      </div>

      {/* Upload Ảnh */}
      <ImageUpload
        label="Ảnh Đại Diện Banner"
        currentImage={formData.MGG_San_HinhAnh}
        onFileSelect={(file) => {
          setImageFile(file);
          const objectUrl = URL.createObjectURL(file);
          setFormData((prev) => ({ ...prev, MGG_San_HinhAnh: objectUrl }));
        }}
      />

      {/* Mô tả */}
      <div>
        <label className="text-label-md font-label-md text-on-surface block mb-1.5">
          Mô Tả & Điều Kiện
        </label>
        <textarea
          name="MGG_San_Mota"
          value={formData.MGG_San_Mota || ""}
          onChange={handleInputChange}
          rows="3"
          className="w-full bg-surface-container-low border border-outline-variant rounded-lg p-3 text-on-surface focus:ring-2 focus:ring-primary"
          placeholder="Quy định sử dụng..."
        ></textarea>
      </div>
    </div>
  );
};

export default VoucherForm;
