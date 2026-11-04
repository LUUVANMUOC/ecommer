// frontend/src/components/common/ImageUpload.jsx
import { useState, useRef, useEffect } from "react";

const ImageUpload = ({
  onFileSelect,
  currentImage = null,
  label = "Hình ảnh",
  hint = "SVG, PNG hoặc WEBP (Tối đa 2MB, tỷ lệ 1:1)",
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [preview, setPreview] = useState(null);
  const inputRef = useRef(null);

  // Dùng ref để lưu trữ Blob URL hiện tại, giúp dọn dẹp bộ nhớ (revoke) dễ dàng
  const blobUrlRef = useRef(null);

  // Lắng nghe sự thay đổi của ảnh truyền từ bên ngoài vào (VD: Khi mở form Edit)
  useEffect(() => {
    if (currentImage) {
      if (
        currentImage.startsWith("http") ||
        currentImage.startsWith("blob:") ||
        currentImage.startsWith("data:image")
      ) {
        setPreview(currentImage);
      } else {
        // Nếu là đường dẫn nội bộ từ backend (VD: /uploads/shops/logo.jpg)
        setPreview(
          `http://localhost:8080${currentImage.startsWith("/") ? "" : "/"}${currentImage}`,
        );
      }
    } else {
      setPreview(null);
    }
  }, [currentImage]);

  // Dọn dẹp bộ nhớ (tránh rò rỉ memory) khi component unmount
  useEffect(() => {
    return () => {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
      }
    };
  }, []);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processFile = (file) => {
    if (file) {
      if (!file.type.startsWith("image/")) {
        alert("Vui lòng chọn file ảnh!");
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        alert("Kích thước ảnh quá lớn. Vui lòng chọn ảnh dưới 2MB!");
        return;
      }

      // 1. Dọn dẹp Blob URL cũ (nếu có)
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
      }

      // 2. Tạo Blob URL mới để xem trước
      const newBlobUrl = URL.createObjectURL(file);
      blobUrlRef.current = newBlobUrl;

      // 3. Cập nhật giao diện
      setPreview(newBlobUrl);

      // 4. Gửi file ra component cha
      onFileSelect(file);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const onButtonClick = (e) => {
    e.stopPropagation(); // Ngăn chặn sự kiện click lan ra ngoài
    inputRef.current.click();
  };

  return (
    <div className="space-y-1.5 w-full">
      <label className="block text-label-md font-label-md text-on-surface">
        {label}
      </label>

      <div
        className={`relative border-2 border-dashed rounded-xl p-4 flex items-center gap-5 transition-all cursor-pointer group ${
          dragActive
            ? "border-primary bg-primary/5 scale-[1.01]"
            : "border-outline-variant hover:border-primary hover:bg-primary/5"
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={onButtonClick}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleChange}
          className="hidden"
        />

        {/* Khung hiển thị ảnh xem trước */}
        <div className="relative w-20 h-20 rounded-xl bg-white border border-outline-variant p-1 shrink-0 flex items-center justify-center overflow-hidden shadow-sm">
          {preview ? (
            <img
              src={preview}
              alt="Preview"
              className="w-full h-full object-cover rounded-lg animate-[fadeIn_0.3s_ease-in-out]"
              onError={() => setPreview(null)} // Nếu ảnh lỗi thì xóa preview
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-outline group-hover:text-primary transition-colors">
              <span className="material-symbols-outlined text-3xl">
                add_photo_alternate
              </span>
            </div>
          )}
        </div>

        {/* Nội dung text */}
        <div className="flex-1">
          <p className="text-body-sm font-body-sm text-on-surface">
            {preview ? (
              <span className="text-green-600 font-semibold flex items-center gap-1">
                <span className="material-symbols-outlined text-[18px]">
                  check_circle
                </span>
                Đã chọn ảnh
              </span>
            ) : (
              <>
                Kéo thả {label.toLowerCase()} vào đây hoặc{" "}
                <span className="text-primary font-semibold underline hover:text-primary-container">
                  tải từ máy
                </span>
              </>
            )}
          </p>
          <p className="text-label-sm font-label-sm text-outline mt-1">
            {hint}
          </p>
        </div>
      </div>

      {/* CSS Animation */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
};

export default ImageUpload;
