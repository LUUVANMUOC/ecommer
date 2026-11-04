import { useState } from "react";

const DateGroupedList = ({ items, renderItem, dateField = "ThoiGian" }) => {
  // Nhóm dữ liệu theo ngày
  const grouped = items.reduce((acc, item) => {
    if (!item[dateField]) return acc;
    const dateStr = new Date(item[dateField]).toLocaleDateString("vi-VN");
    if (!acc[dateStr]) acc[dateStr] = [];
    acc[dateStr].push(item);
    return acc;
  }, {});

  const today = new Date().toLocaleDateString("vi-VN");
  const yesterday = new Date(Date.now() - 86400000).toLocaleDateString("vi-VN");

  return (
    <div className="space-y-4">
      {Object.entries(grouped).map(([date, list]) => {
        let label = date;
        if (date === today) label = "Hôm nay";
        else if (date === yesterday) label = "Hôm qua";

        return (
          <details
            key={date}
            className="group bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden"
            open
          >
            <summary className="p-4 cursor-pointer bg-[#F8FAFC] font-bold text-[#0F172A] flex items-center justify-between hover:bg-gray-100 transition-colors">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#2563EB]">
                  calendar_today
                </span>
                {label}{" "}
                <span className="text-sm font-normal text-gray-500">
                  ({list.length} đơn)
                </span>
              </div>
              <span className="material-symbols-outlined transform group-open:rotate-180 transition-transform">
                expand_more
              </span>
            </summary>
            <div className="p-4 flex flex-col gap-3">
              {list.map((item, idx) => renderItem(item, idx))}
            </div>
          </details>
        );
      })}
      {items.length === 0 && (
        <p className="text-center text-gray-500 py-10">Chưa có lịch sử.</p>
      )}
    </div>
  );
};
export default DateGroupedList;
