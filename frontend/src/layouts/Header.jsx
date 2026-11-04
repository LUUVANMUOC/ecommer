// src/layouts/Header.jsx
import { LogOut } from "lucide-react";

const Header = ({ userName = "", onLogout }) => {
  const initial = (userName || "?").trim().charAt(0).toUpperCase();

  const dateLabel = new Intl.DateTimeFormat("vi-VN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-[#DDD9CE] bg-[#F4F2EC]/90 px-6 backdrop-blur md:px-10">
      <p className="hidden text-sm capitalize text-[#5B6661] md:block">
        {dateLabel}
      </p>

      <div className="ml-auto flex items-center gap-3">
        <div className="flex items-center gap-3 rounded-full border border-[#DDD9CE] bg-white py-1.5 pl-1.5 pr-4">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-[#1E3A34] text-sm font-semibold text-[#F2A93B]">
            {initial}
          </span>
          <span className="text-sm text-[#5B6661]">
            Xin chào,{" "}
            <strong className="font-semibold text-[#14201C]">{userName}</strong>
          </span>
        </div>

        <button
          type="button"
          onClick={onLogout}
          className="inline-flex items-center gap-2 rounded-full border border-[#D9CFC2] bg-white px-4 py-2 text-sm font-medium text-[#8A3B12] transition-colors hover:border-[#E0A17F] hover:bg-[#FBEDE4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C2410C]/40"
        >
          <LogOut className="h-4 w-4" />
          Đăng xuất
        </button>
      </div>
    </header>
  );
};

export default Header;
