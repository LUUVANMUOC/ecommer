// src/layouts/Header.jsx
import { useContext } from "react";
import { LogOut } from "lucide-react";
import NotificationBell from "../pages/common/NotificationBell";
import Avatar from "../components/common/Avatar";
import { AuthContext } from "../contexts/AuthContext";

const pickAvatarSrc = (user) =>
  user?.gh_hinhanh ||
  user?.GH_hinhanh ||
  user?.dvvc_hinhanh ||
  user?.DVVC_HinhAnh ||
  user?.shipper_hinhanh ||
  user?.kho_hinhanh ||
  user?.STMDT_HinhAnh ||
  user?.kh_avatar ||
  "";

const Header = ({ userName = "", onLogout }) => {
  const { user } = useContext(AuthContext) || {};
  const displayName = userName || user?.kh_ten || user?.GH_Ten || "";

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
        <NotificationBell />

        <div className="flex items-center gap-3 rounded-full border border-[#DDD9CE] bg-white py-1.5 pl-1.5 pr-4">
          <span className="h-8 w-8 overflow-hidden rounded-full border border-[#E2DED3] bg-[#F1EEE6]">
            <Avatar
              src={pickAvatarSrc(user)}
              role={user?.role}
              name={displayName}
              className="h-full w-full object-cover"
            />
          </span>
          <span className="text-sm text-[#5B6661]">
            Xin chào,{" "}
            <strong className="font-semibold text-[#14201C]">
              {displayName}
            </strong>
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
