// frontend/src/components/auth/authTheme.js
// Bảng màu và các lớp CSS dùng chung cho khối giao diện xác thực.
// Tách riêng khỏi component để không vi phạm quy tắc fast-refresh.

export const AUTH_TONES = {
  admin: {
    panel: "bg-gradient-to-br from-[#1E3A8A] via-[#1D4ED8] to-[#4338CA]",
    header: "bg-gradient-to-r from-[#1D4ED8] to-[#3730A3]",
    button:
      "bg-gradient-to-r from-[#1D4ED8] to-[#3730A3] shadow-lg shadow-[#2563EB]/25 hover:shadow-xl hover:shadow-[#2563EB]/35 hover:brightness-110 focus-visible:ring-[#2563EB]/35",
    input:
      "border-slate-200 bg-slate-50/80 text-slate-800 placeholder:text-slate-400 focus:border-[#2563EB] focus:bg-white focus:ring-[#2563EB]/10",
    link: "text-[#2563EB] hover:text-[#1D4ED8]",
    chip: "bg-[#EFF6FF] text-[#1D4ED8] ring-[#DBEAFE]",
    step: "bg-[#EFF6FF] text-[#1D4ED8]",
    iconSoft: "bg-[#EFF6FF] text-[#2563EB]",
    homeHover: "hover:text-[#2563EB]",
    fileHover: "hover:border-[#2563EB]/50 hover:bg-[#EFF6FF]/50",
  },
  shop: {
    panel: "bg-gradient-to-br from-[#7C2D12] via-[#EA580C] to-[#F97316]",
    header: "bg-gradient-to-r from-[#C2410C] to-[#9A3412]",
    button:
      "bg-gradient-to-r from-[#C2410C] to-[#9A3412] shadow-lg shadow-[#F97316]/25 hover:shadow-xl hover:shadow-[#F97316]/35 hover:brightness-110 focus-visible:ring-[#F97316]/35",
    input:
      "border-slate-200 bg-slate-50/80 text-slate-800 placeholder:text-slate-400 focus:border-[#F97316] focus:bg-white focus:ring-[#F97316]/10",
    link: "text-[#EA580C] hover:text-[#C2410C]",
    chip: "bg-[#FFF7ED] text-[#C2410C] ring-[#FFEDD5]",
    step: "bg-[#FFF7ED] text-[#C2410C]",
    iconSoft: "bg-[#FFF7ED] text-[#EA580C]",
    homeHover: "hover:text-[#EA580C]",
    fileHover: "hover:border-[#F97316]/50 hover:bg-[#FFF7ED]/60",
  },
  dvvc: {
    panel: "bg-gradient-to-br from-[#064E3B] via-[#047857] to-[#10B981]",
    header: "bg-gradient-to-r from-[#047857] to-[#065F46]",
    button:
      "bg-gradient-to-r from-[#047857] to-[#065F46] shadow-lg shadow-[#059669]/25 hover:shadow-xl hover:shadow-[#059669]/35 hover:brightness-110 focus-visible:ring-[#059669]/35",
    input:
      "border-slate-200 bg-slate-50/80 text-slate-800 placeholder:text-slate-400 focus:border-[#059669] focus:bg-white focus:ring-[#059669]/10",
    link: "text-[#047857] hover:text-[#065F46]",
    chip: "bg-[#ECFDF5] text-[#047857] ring-[#D1FAE5]",
    step: "bg-[#ECFDF5] text-[#047857]",
    iconSoft: "bg-[#ECFDF5] text-[#059669]",
    homeHover: "hover:text-[#059669]",
    fileHover: "hover:border-[#10B981]/50 hover:bg-[#ECFDF5]/60",
  },
  shipper: {
    panel: "bg-gradient-to-br from-[#14532D] via-[#15803D] to-[#22C55E]",
    header: "bg-gradient-to-r from-[#15803D] to-[#166534]",
    button:
      "bg-gradient-to-r from-[#15803D] to-[#166534] shadow-lg shadow-[#16A34A]/25 hover:shadow-xl hover:shadow-[#16A34A]/35 hover:brightness-110 focus-visible:ring-[#16A34A]/35",
    input:
      "border-slate-200 bg-slate-50/80 text-slate-800 placeholder:text-slate-400 focus:border-[#16A34A] focus:bg-white focus:ring-[#16A34A]/10",
    link: "text-[#15803D] hover:text-[#166534]",
    chip: "bg-[#F0FDF4] text-[#15803D] ring-[#DCFCE7]",
    step: "bg-[#F0FDF4] text-[#15803D]",
    iconSoft: "bg-[#F0FDF4] text-[#16A34A]",
    homeHover: "hover:text-[#16A34A]",
    fileHover: "hover:border-[#22C55E]/50 hover:bg-[#F0FDF4]/60",
  },
  kho: {
    panel: "bg-gradient-to-br from-[#312E81] via-[#4338CA] to-[#6366F1]",
    header: "bg-gradient-to-r from-[#4338CA] to-[#3730A3]",
    button:
      "bg-gradient-to-r from-[#4338CA] to-[#3730A3] shadow-lg shadow-[#4F46E5]/25 hover:shadow-xl hover:shadow-[#4F46E5]/35 hover:brightness-110 focus-visible:ring-[#4F46E5]/35",
    input:
      "border-slate-200 bg-slate-50/80 text-slate-800 placeholder:text-slate-400 focus:border-[#4F46E5] focus:bg-white focus:ring-[#4F46E5]/10",
    link: "text-[#4338CA] hover:text-[#3730A3]",
    chip: "bg-[#EEF2FF] text-[#4338CA] ring-[#E0E7FF]",
    step: "bg-[#EEF2FF] text-[#4338CA]",
    iconSoft: "bg-[#EEF2FF] text-[#4F46E5]",
    homeHover: "hover:text-[#4F46E5]",
    fileHover: "hover:border-[#6366F1]/50 hover:bg-[#EEF2FF]/60",
  },
  khachhang: {
    panel: "bg-gradient-to-br from-[#7C2D12] via-[#D97706] to-[#F59E0B]",
    header: "bg-gradient-to-r from-[#B45309] to-[#92400E]",
    button:
      "bg-gradient-to-r from-[#B45309] to-[#92400E] shadow-lg shadow-[#F59E0B]/25 hover:shadow-xl hover:shadow-[#F59E0B]/35 hover:brightness-110 focus-visible:ring-[#F59E0B]/35",
    input:
      "border-slate-200 bg-slate-50/80 text-slate-800 placeholder:text-slate-400 focus:border-[#F59E0B] focus:bg-white focus:ring-[#F59E0B]/10",
    link: "text-[#B45309] hover:text-[#92400E]",
    chip: "bg-[#FFFBEB] text-[#B45309] ring-[#FEF3C7]",
    step: "bg-[#FFFBEB] text-[#B45309]",
    iconSoft: "bg-[#FFFBEB] text-[#D97706]",
    homeHover: "hover:text-[#D97706]",
    fileHover: "hover:border-[#F59E0B]/50 hover:bg-[#FFFBEB]/60",
  },
};

export const getAuthTone = (tone) => AUTH_TONES[tone] || AUTH_TONES.admin;

/* ---------- Ô nhập liệu ---------- */
export const authInputClass = (tone) =>
  `w-full rounded-xl border py-3 pl-11 pr-4 text-[15px] font-medium outline-none transition-all duration-200 placeholder:font-normal focus:ring-4 ${getAuthTone(tone).input}`;

export const authInputNoIconClass = (tone) =>
  `w-full rounded-xl border px-4 py-3 text-[15px] font-medium outline-none transition-all duration-200 placeholder:font-normal focus:ring-4 ${getAuthTone(tone).input}`;
