import React from "react";

const VoucherToolbar = ({
  filterStatus,
  setFilterStatus,
  viewMode,
  setViewMode,
  onAdd,
}) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-primary-fixed text-on-primary-fixed uppercase tracking-wider">
            Promotions Hub
          </span>
        </div>
        <h2 className="text-headline-lg font-headline-lg text-on-surface font-bold tracking-tight mt-1">
          Quản lý Mã Giảm Giá
        </h2>
        <p className="text-body-sm font-body-sm text-on-surface-variant">
          Quản lý voucher toàn sàn dựa trên cơ sở dữ liệu.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {/* Bộ lọc trạng thái */}
        <div className="flex items-center bg-surface-container-low p-1 rounded-lg border border-outline-variant/40">
          <button
            onClick={() => setFilterStatus("all")}
            className={`px-3 py-1.5 rounded-md text-label-sm font-semibold transition-colors ${
              filterStatus === "all"
                ? "bg-surface-container-lowest text-primary shadow-sm"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            Tất cả
          </button>
          <button
            onClick={() => setFilterStatus("valid")}
            className={`px-3 py-1.5 rounded-md text-label-sm font-semibold transition-colors ${
              filterStatus === "valid"
                ? "bg-surface-container-lowest text-tertiary-container shadow-sm"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            Còn sử dụng
          </button>
          <button
            onClick={() => setFilterStatus("invalid")}
            className={`px-3 py-1.5 rounded-md text-label-sm font-semibold transition-colors ${
              filterStatus === "invalid"
                ? "bg-surface-container-lowest text-error shadow-sm"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            Hết hiệu lực
          </button>
        </div>

        {/* Chuyển đổi chế độ xem */}
        <div className="inline-flex rounded-lg border border-outline-variant/60 p-0.5 bg-surface-container-low">
          <button
            onClick={() => setViewMode("grid")}
            className={`p-1.5 rounded-md ${
              viewMode === "grid"
                ? "bg-surface-container-lowest text-primary shadow-sm"
                : "text-outline hover:text-on-surface"
            }`}
          >
            <span className="material-symbols-outlined text-lg block">
              grid_view
            </span>
          </button>
          <button
            onClick={() => setViewMode("table")}
            className={`p-1.5 rounded-md ${
              viewMode === "table"
                ? "bg-surface-container-lowest text-primary shadow-sm"
                : "text-outline hover:text-on-surface"
            }`}
          >
            <span className="material-symbols-outlined text-lg block">
              table_rows
            </span>
          </button>
        </div>

        <button
          onClick={onAdd}
          className="flex items-center gap-2 bg-primary hover:bg-primary-container text-on-primary px-4 py-2 rounded-lg font-label-md text-label-md font-semibold shadow-sm transition-all duration-150"
        >
          <span className="material-symbols-outlined text-lg">add</span>
          <span>Tạo Mã Giảm Giá</span>
        </button>
      </div>
    </div>
  );
};

export default VoucherToolbar;
