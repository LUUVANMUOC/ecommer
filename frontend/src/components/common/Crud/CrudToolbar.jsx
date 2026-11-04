const CrudToolbar = ({
  title,
  subtitle,
  totalItems,
  onAdd,
  addButtonText = "Thêm mới",
  searchPlaceholder = "Tìm kiếm...",
}) => {
  return (
    <section className="mb-6 rounded-2xl border border-[#E2DED3] bg-white p-6 shadow-[0_1px_0_rgba(20,32,28,0.04)]">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-[28px] font-bold leading-tight tracking-tight text-[#14201C]">
              {title}
            </h1>
            <span className="rounded-full bg-[#FDF3E1] px-2.5 py-0.5 text-xs font-semibold tabular-nums text-[#8A5A0B]">
              {totalItems} mục
            </span>
          </div>
          <p className="mt-1.5 text-sm leading-relaxed text-[#5B6661]">
            {subtitle}
          </p>
        </div>

        <button
          type="button"
          onClick={onAdd}
          className="inline-flex items-center gap-2 rounded-full bg-[#14201C] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#1E3A34] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F2A93B]"
        >
          <span className="material-symbols-outlined text-[18px] text-[#F2A93B]">
            add
          </span>
          <span>{addButtonText}</span>
        </button>
      </div>

      <div className="border-t border-[#EFEBE2] pt-5">
        <div className="relative md:max-w-md">
          <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-[#9AA39E]">
            search
          </span>
          <input
            type="text"
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
            className="w-full rounded-xl border border-[#D9D4C7] bg-[#FBFAF7] py-2.5 pl-10 pr-4 text-sm text-[#14201C] transition-all placeholder:text-[#9AA39E] focus:border-[#F2A93B] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#F2A93B]/20"
          />
        </div>
      </div>
    </section>
  );
};

export default CrudToolbar;
