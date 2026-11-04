const CrudDrawer = ({
  isOpen,
  onClose,
  title,
  description,
  onSubmit,
  isEditing,
  children,
  error,
}) => {
  return (
    <>
      {/* Lớp nền mờ */}
      <div
        className={`fixed inset-0 z-40 bg-[#14201C]/35 backdrop-blur-[2px] transition-opacity duration-300 ${
          isOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <aside
        aria-hidden={!isOpen}
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-[500px] transform flex-col bg-[#FBFAF7] shadow-2xl transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Tiêu đề */}
        <div className="flex items-start justify-between gap-4 border-b border-[#E2DED3] bg-white px-6 py-5">
          <div className="min-w-0">
            <h2 className="text-xl font-bold tracking-tight text-[#14201C]">
              {title}
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-[#5B6661]">
              {description}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#7A857F] transition-colors hover:bg-[#F1EEE6] hover:text-[#14201C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F2A93B]"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Form */}
        <form
          className="flex-1 space-y-5 overflow-y-auto p-6"
          onSubmit={onSubmit}
        >
          {error && (
            <div
              role="alert"
              className="flex items-start gap-2.5 rounded-xl border border-[#F0C4AE] bg-[#FBEDE4] p-3.5 text-sm text-[#8A3B12]"
            >
              <span className="material-symbols-outlined mt-px text-[18px] text-[#B42318]">
                error
              </span>
              <span className="leading-relaxed">{error}</span>
            </div>
          )}
          {children}
        </form>

        {/* Nút hành động */}
        <div className="flex items-center justify-end gap-3 border-t border-[#E2DED3] bg-white px-6 py-4">
          <button
            onClick={onClose}
            type="button"
            className="rounded-full border border-[#D9CFC2] bg-white px-5 py-2.5 text-sm font-medium text-[#3D4A44] transition-colors hover:bg-[#F7F5F0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F2A93B]"
          >
            Hủy bỏ
          </button>
          <button
            onClick={onSubmit}
            type="button"
            className="rounded-full bg-[#14201C] px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#1E3A34] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F2A93B]"
          >
            {isEditing ? "Lưu thay đổi" : "Thêm mới"}
          </button>
        </div>
      </aside>
    </>
  );
};

export default CrudDrawer;
