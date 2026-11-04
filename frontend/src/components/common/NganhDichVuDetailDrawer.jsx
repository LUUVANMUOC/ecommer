import React from "react";

const NganhDichVuDetailDrawer = ({ isOpen, onClose, category }) => {
  if (!category) return null;

  // Format hiển thị phí
  const formatFee = (fee) => {
    if (fee === null || fee === undefined) return "Chưa thiết lập";
    return `${Number(fee).toFixed(2)}%`;
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-[#0F172A]/40 backdrop-blur-[2px] z-40 transition-opacity duration-300 ${
          isOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      ></div>

      {/* Panel */}
      <aside
        className={`fixed top-0 right-0 h-full w-full max-w-[400px] bg-surface-container-lowest border-l border-outline-variant shadow-2xl z-50 flex flex-col transition-transform duration-300 transform ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="p-6 border-b border-outline-variant/60 flex items-center justify-between bg-surface-container-low">
          <div>
            <h2 className="text-headline-md font-headline-md font-bold text-on-surface">
              Chi Tiết Ngành Hàng
            </h2>
            <p className="text-body-sm font-body-sm text-outline mt-0.5">
              Thông tin cấu hình danh mục dịch vụ
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-surface-container text-outline hover:text-on-surface flex items-center justify-center transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Box hiển thị Tên & Icon */}
          <div className="flex flex-col items-center justify-center p-6 bg-surface-container-low rounded-xl border border-outline-variant/50 text-center">
            <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-4">
              {/* Đã sửa NDV_Icon thành icon mặc định, vì bảng NganhHang không có cột icon */}
              <span className="material-symbols-outlined text-3xl">
                category
              </span>
            </div>
            {/* ĐÃ SỬA: NDV_Ten -> nh_ten */}
            <h3 className="text-headline-sm font-bold text-primary">
              {category.nh_ten}
            </h3>
            {/* ĐÃ SỬA: NDV_Ma -> nh_ma */}
            <span className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-surface-container-high text-on-surface-variant font-mono">
              {category.nh_ma}
            </span>
          </div>

          {/* Chi tiết thông tin */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-label-sm font-label-sm text-outline block mb-1">
                  Cấp độ hiện tại
                </label>
                <p className="text-body-md font-semibold text-on-surface">
                  Cấp {category.level}
                </p>
              </div>
              <div>
                <label className="text-label-sm font-label-sm text-outline block mb-1">
                  Thuộc ngành hàng cha
                </label>
                <p className="text-body-md font-mono text-on-surface">
                  {/* ĐÃ SỬA: NDV_Cha -> nh_cha */}
                  {category.nh_cha || "Không có (Cấp gốc)"}
                </p>
              </div>
            </div>

            <div className="pt-2">
              <label className="text-label-sm font-label-sm text-outline block mb-1">
                Mức phí chiết khấu hiện tại
              </label>
              <div className="p-3 bg-green-50/50 border border-green-200 rounded-lg text-green-700 font-bold text-lg">
                {/* Kiểm tra nếu là node lá (không có con) thì hiển thị phí */}
                {category.isLeaf !== false &&
                // ĐÃ SỬA: PCKS_PhanTram -> psck_phantram
                category.psck_phantram !== null &&
                category.psck_phantram !== undefined ? (
                  formatFee(category.psck_phantram)
                ) : (
                  <span className="text-outline text-sm font-normal italic">
                    Không áp dụng cho cấp cha
                  </span>
                )}
              </div>
            </div>
            <div className="pt-2">
              <label className="text-label-sm font-label-sm text-outline block mb-1">
                Mô tả chi tiết
              </label>
              <div className="p-3 bg-surface-container-lowest border border-outline-variant/50 rounded-lg text-body-sm text-on-surface-variant whitespace-pre-line min-h-[100px]">
                {/* ĐÃ SỬA: NDV_MoTa -> nh_mota */}
                {category.nh_mota || "Không có mô tả chi tiết."}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-outline-variant/60 bg-surface-container-lowest">
          <button
            onClick={onClose}
            className="w-full py-2 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-semibold transition-colors"
          >
            Đóng
          </button>
        </div>
      </aside>
    </>
  );
};

export default NganhDichVuDetailDrawer;
