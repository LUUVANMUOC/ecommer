const alignClass = (align) =>
  align === "center"
    ? "text-center"
    : align === "right"
      ? "text-right"
      : "text-left";

const CrudDataTable = ({
  columns,
  data,
  loading,
  emptyText = "Chưa có dữ liệu.",
  onEdit,
  onDelete,
  keyField = "id",
  nameField = "name", // Tên hiển thị khi xóa (VD: 'th_ten')
  onRowClick, // Hàm xử lý khi click vào dòng
  selectedRowId, // ID của dòng đang được chọn
}) => {
  const colSpan = columns.length + 1;

  return (
    <section className="overflow-hidden rounded-2xl border border-[#E2DED3] bg-white shadow-[0_1px_0_rgba(20,32,28,0.04)]">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-[#E2DED3] bg-[#F7F5F0]">
              {columns.map((col, index) => (
                <th
                  key={index}
                  scope="col"
                  className={`h-11 px-6 text-[13px] font-semibold text-[#5B6661] ${alignClass(col.align)} ${col.width || ""}`}
                >
                  {col.label}
                </th>
              ))}
              <th
                scope="col"
                className="h-11 w-36 px-6 text-center text-[13px] font-semibold text-[#5B6661]"
              >
                Thao tác
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-[#EFEBE2]">
            {loading ? (
              <tr>
                <td colSpan={colSpan} className="px-6 py-14 text-center">
                  <div className="inline-flex items-center gap-3 text-sm text-[#7A857F]">
                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-[#E2DED3] border-t-[#F2A93B]" />
                    Đang tải dữ liệu...
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={colSpan} className="px-6 py-14 text-center">
                  <div className="flex flex-col items-center gap-2 text-[#7A857F]">
                    <span className="material-symbols-outlined text-[36px] text-[#C9C3B5]">
                      inbox
                    </span>
                    <p className="text-sm">{emptyText}</p>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((item) => {
                const isSelected = selectedRowId === item[keyField];

                return (
                  <tr
                    key={item[keyField]}
                    onClick={() => onRowClick && onRowClick(item)}
                    className={`group transition-colors ${
                      onRowClick ? "cursor-pointer" : ""
                    } ${isSelected ? "bg-[#FDF3E1]" : "hover:bg-[#FAF8F3]"}`}
                  >
                    {columns.map((col, index) => (
                      <td
                        key={index}
                        className={`px-6 py-3.5 text-sm text-[#1B2421] ${alignClass(col.align)} ${
                          index === 0 && isSelected
                            ? "shadow-[inset_3px_0_0_0_#F2A93B]"
                            : ""
                        }`}
                      >
                        {col.render ? col.render(item) : item[col.key]}
                      </td>
                    ))}

                    <td className="px-6 py-3.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation(); // Không kích hoạt onRowClick
                            onEdit(item);
                          }}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-[#7A857F] transition-colors hover:bg-[#F1EEE6] hover:text-[#14201C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F2A93B]"
                          title="Chỉnh sửa"
                          aria-label="Chỉnh sửa"
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            edit
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            // Ưu tiên nameField, nếu không có thì lấy cột đầu tiên
                            const displayName =
                              item[nameField] || item[columns[0].key];
                            onDelete(item[keyField], displayName);
                          }}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-[#9A5B45] transition-colors hover:bg-[#FBEDE4] hover:text-[#B42318] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B42318]/40"
                          title="Xóa"
                          aria-label="Xóa"
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            delete
                          </span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default CrudDataTable;
