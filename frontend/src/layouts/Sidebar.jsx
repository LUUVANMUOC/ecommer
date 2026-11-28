import { useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronDown, Dot, LayoutDashboard } from "lucide-react";

// Một mục được coi là active khi đường dẫn hiện tại trùng khớp hoặc nằm trong mục đó
const isPathMatch = (pathname, path) =>
  Boolean(path) && (pathname === path || pathname.startsWith(`${path}/`));

const Sidebar = ({ title = "Dashboard", menuConfig = [] }) => {
  const location = useLocation();

  // Chỉ lưu các nhóm người dùng ĐÃ ĐÓNG. Mặc định mọi nhóm đều mở, nên không cần
  // đồng bộ state khi menu đổi (đổi role/đăng nhập lại).
  const [closedSubmenus, setClosedSubmenus] = useState([]);

  // Tất cả đường dẫn có trong menu (cả mục đơn và mục con)
  const allPaths = useMemo(() => {
    const paths = [];
    menuConfig.forEach((parent) => {
      if (parent.path) paths.push(parent.path);
      (parent.children || []).forEach((child) => {
        if (child.path) paths.push(child.path);
      });
    });
    return paths;
  }, [menuConfig]);

  // Chỉ đường dẫn khớp DÀI NHẤT mới được active (tránh 2 mục cùng sáng)
  const activePath = useMemo(() => {
    const matches = allPaths.filter((path) =>
      isPathMatch(location.pathname, path),
    );
    if (!matches.length) return null;
    return matches.reduce((best, path) =>
      path.length > best.length ? path : best,
    );
  }, [allPaths, location.pathname]);

  const toggleSubmenu = (id) => {
    setClosedSubmenus((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const itemBase =
    "relative flex items-start gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors";
  const itemActive = "bg-white/[0.08] text-white";
  const itemIdle = "text-[#A9B8B1] hover:bg-white/5 hover:text-white";

  const childBase =
    "flex items-start gap-2.5 rounded-md px-3 py-2 text-sm transition-colors";
  const childActive = "bg-[#F2A93B]/10 font-semibold text-[#F2A93B]";
  const childIdle = "text-[#A9B8B1] hover:bg-white/5 hover:text-white";

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
          const isChildActive = parent.children?.some(
            (child) => child.path === activePath,
          );
          // Nhóm đang chứa trang hiện tại luôn mở, kể cả khi người dùng đã đóng trước đó
          const isSubOpen = isChildActive || !closedSubmenus.includes(parentId);
          const ParentIcon = parent.icon ?? Dot;

          // 1. Menu Đơn (Không có menu con)
          if (!parent.children) {
            const isActive = parent.path === activePath;

            return (
              <Link
                key={parent.title}
                to={parent.path}
                title={parent.title}
                aria-current={isActive ? "page" : undefined}
                className={`${itemBase} ${isActive ? itemActive : itemIdle}`}
              >
                {isActive && (
                  <span className="absolute inset-y-2 left-0 w-1 rounded-r-full bg-[#F2A93B]" />
                )}
                <ParentIcon className="mt-0.5 h-[18px] w-[18px] shrink-0 opacity-80" />
                <span className="min-w-0 break-words leading-snug">
                  {parent.title}
                </span>
              </Link>
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
                    const isActive = child.path === activePath;

                    return (
                      <Link
                        key={child.title}
                        to={child.path}
                        title={child.title}
                        aria-current={isActive ? "page" : undefined}
                        className={`${childBase} ${
                          isActive ? childActive : childIdle
                        }`}
                      >
                        <ChildIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-70" />
                        <span className="min-w-0 break-words leading-snug">
                          {child.title}
                        </span>
                      </Link>
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
