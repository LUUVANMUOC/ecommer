import { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { ChevronDown, Dot, LayoutDashboard, X } from "lucide-react";

const Sidebar = ({
  title = "Dashboard",
  menuConfig = [],
  isOpen = false,
  onClose,
}) => {
  const location = useLocation();
  const [openSubmenu, setOpenSubmenu] = useState(null);

  // Tự động mở submenu nếu URL khớp với menu con
  useEffect(() => {
    menuConfig.forEach((parent) => {
      if (parent.children) {
        const hasActiveChild = parent.children.some(
          (child) => location.pathname === child.path,
        );
        if (hasActiveChild) {
          setOpenSubmenu(parent.id || parent.title);
        }
      }
    });
  }, [location.pathname, menuConfig]);

  const handleParentClick = (parent) => {
    if (parent.children) {
      const id = parent.id || parent.title;
      setOpenSubmenu(openSubmenu === id ? null : id);
    }
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-xs md:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex h-screen w-72 shrink-0 select-none flex-col bg-[#14201C] text-[#A9B8B1] transition-transform duration-200 md:sticky md:top-0 md:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header Sidebar */}
        <div className="flex h-16 items-center justify-between gap-3 border-b border-white/5 px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#F2A93B] text-[#14201C]">
              <LayoutDashboard className="h-5 w-5" />
            </div>
            <h2 className="truncate text-[15px] font-semibold tracking-tight text-white">
              {title}
            </h2>
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Đóng menu"
              className="rounded-lg p-1.5 text-[#A9B8B1] hover:bg-white/10 hover:text-white md:hidden"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

      {/* Navigation Menu */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-5">
        {menuConfig.map((parent) => {
          const isSubOpen = openSubmenu === (parent.id || parent.title);
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
                onClick={onClose}
                className={({ isActive }) =>
                  `relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
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
                    <ParentIcon className="h-[18px] w-[18px] shrink-0 opacity-80" />
                    <span className="truncate">{parent.title}</span>
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
                onClick={() => handleParentClick(parent)}
                aria-expanded={isSubOpen}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F2A93B]/60 ${
                  isChildActive
                    ? "bg-white/[0.04] text-white"
                    : "text-[#A9B8B1] hover:bg-white/5 hover:text-white"
                }`}
              >
                <span className="flex min-w-0 items-center gap-3">
                  <ParentIcon className="h-[18px] w-[18px] shrink-0 opacity-80" />
                  <span className="truncate">{parent.title}</span>
                </span>
                <ChevronDown
                  className={`h-4 w-4 shrink-0 text-[#6E7D76] transition-transform duration-200 ${
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
                        onClick={onClose}
                        className={({ isActive }) =>
                          `flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors ${
                            isActive
                              ? "bg-[#F2A93B]/10 font-semibold text-[#F2A93B]"
                              : "text-[#A9B8B1] hover:bg-white/5 hover:text-white"
                          }`
                        }
                      >
                        <ChildIcon className="h-3.5 w-3.5 shrink-0 opacity-70" />
                        <span className="truncate">{child.title}</span>
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
    </>
  );
};

export default Sidebar;
