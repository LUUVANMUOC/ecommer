import { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { ChevronDown, Dot, LayoutDashboard } from "lucide-react";

const Sidebar = ({ title = "Dashboard", menuConfig = [] }) => {
  const location = useLocation();

  // Mặc định MỞ TẤT CẢ các nhóm có menu con
  const [openSubmenus, setOpenSubmenus] = useState(() =>
    menuConfig
      .filter((parent) => parent.children)
      .map((parent) => parent.id || parent.title),
  );

  // Dấu vân tay của menu: chỉ đổi khi danh sách menu đổi (không đổi mỗi render)
  const menuKey = menuConfig
    .map((p) => `${p.id || p.title}:${p.children?.length ?? 0}`)
    .join("|");

  // Khi menu đổi (đổi role/đăng nhập lại) → mở thêm các nhóm mới, không đóng nhóm đang mở
  useEffect(() => {
    const ids = menuConfig
      .filter((parent) => parent.children)
      .map((parent) => parent.id || parent.title);

    setOpenSubmenus((prev) => {
      const missing = ids.filter((id) => !prev.includes(id));
      return missing.length ? [...prev, ...missing] : prev;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [menuKey]);

  // Tự động mở nhóm chứa trang đang xem
  useEffect(() => {
    const activeIds = menuConfig
      .filter((parent) =>
        parent.children?.some((child) => location.pathname === child.path),
      )
      .map((parent) => parent.id || parent.title);

    if (!activeIds.length) return;

    setOpenSubmenus((prev) => {
      const missing = activeIds.filter((id) => !prev.includes(id));
      return missing.length ? [...prev, ...missing] : prev;
    });
  }, [location.pathname, menuConfig]);

  const toggleSubmenu = (id) => {
    setOpenSubmenus((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  return (
    <aside className="sticky top-0 flex h-screen w-72 shrink-0 select-none flex-col bg-[#14201C] text-[#A9B8B1]">
      {/* Header Sidebar */}
      <div className="flex h-16 items-center gap-3 border-b border-white/5 px-6">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#F2A93B] text-[#14201C]">
          <LayoutDashboard className="h-5 w-5" />
        </div>
        <h2 className="break-words text-[15px] font-semibold leading-snug tracking-tight text-white">
          {title}
        </h2>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-5">
        {menuConfig.map((parent) => {
          const parentId = parent.id || parent.title;
          const isSubOpen = openSubmenus.includes(parentId);
          const isChildActive = parent.children?.some(
            (child) => location.pathname === child.path,
          );
          const ParentIcon = parent.icon ?? Dot;

          // 1. Menu Đơn (Không có menu con)
          if (!parent.children) {
            return (
              <NavLink
                key={parent.title}
                to={parent.path}
                title={parent.title}
                className={({ isActive }) =>
                  `relative flex items-start gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-white/[0.08] text-white"
                      : "text-[#A9B8B1] hover:bg-white/5 hover:text-white"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <span className="absolute inset-y-2 left-0 w-1 rounded-r-full bg-[#F2A93B]" />
                    )}
                    <ParentIcon className="mt-0.5 h-[18px] w-[18px] shrink-0 opacity-80" />
                    <span className="min-w-0 break-words leading-snug">
                      {parent.title}
                    </span>
                  </>
                )}
              </NavLink>
            );
          }

          // 2. Menu Cha (Có menu con)
          return (
            <div key={parent.title}>
              <button
                type="button"
                onClick={() => toggleSubmenu(parentId)}
                aria-expanded={isSubOpen}
                title={parent.title}
                className={`flex w-full items-start justify-between gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F2A93B]/60 ${
                  isChildActive
                    ? "bg-white/[0.04] text-white"
                    : "text-[#A9B8B1] hover:bg-white/5 hover:text-white"
                }`}
              >
                <span className="flex min-w-0 items-start gap-3">
                  <ParentIcon className="mt-0.5 h-[18px] w-[18px] shrink-0 opacity-80" />
                  <span className="min-w-0 break-words leading-snug">
                    {parent.title}
                  </span>
                </span>
                <ChevronDown
                  className={`mt-0.5 h-4 w-4 shrink-0 text-[#6E7D76] transition-transform duration-200 ${
                    isSubOpen ? "rotate-180 text-[#F2A93B]" : ""
                  }`}
                />
              </button>

              {/* Submenu */}
              {isSubOpen && (
                <div className="ml-[22px] mt-1 space-y-0.5 border-l border-white/10 py-1 pl-3">
                  {parent.children.length === 0 && (
                    <p className="px-3 py-2 text-xs text-white/30">
                      Chưa có mục con
                    </p>
                  )}
                  {parent.children.map((child) => {
                    const ChildIcon = child.icon ?? Dot;
                    return (
                      <NavLink
                        key={child.title}
                        to={child.path}
                        title={child.title}
                        className={({ isActive }) =>
                          `flex items-start gap-2.5 rounded-md px-3 py-2 text-sm transition-colors ${
                            isActive
                              ? "bg-[#F2A93B]/10 font-semibold text-[#F2A93B]"
                              : "text-[#A9B8B1] hover:bg-white/5 hover:text-white"
                          }`
                        }
                      >
                        <ChildIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-70" />
                        <span className="min-w-0 break-words leading-snug">
                          {child.title}
                        </span>
                      </NavLink>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;
