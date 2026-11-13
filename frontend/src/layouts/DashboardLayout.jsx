import { useState } from "react";
import { Link, useOutlet } from "react-router-dom";
import { LayoutDashboard } from "lucide-react";
import Sidebar from "./Sidebar";
import Header from "./Header";

const FONT_IMPORT =
  "@import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800&display=swap');";

const FONT_STACK = "'Be Vietnam Pro', ui-sans-serif, system-ui, sans-serif";

/* Trang chào mừng khi chưa chọn mục nào trong menu */
const Welcome = ({ menuConfig }) => (
  <section>
    <div className="mb-10">
      <h1 className="text-[32px] leading-tight font-bold tracking-tight text-[#14201C]">
        Bắt đầu từ đâu?
      </h1>
      <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-[#5B6661]">
        Chọn một khu vực bên dưới hoặc mở mục trong thanh bên để xử lý công
        việc.
      </p>
    </div>

    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {menuConfig.map((section) => {
        const children = section.children ?? [];
        const href = section.path ?? children[0]?.path;
        const Icon = section.icon ?? LayoutDashboard;

        const body = (
          <>
            <div className="flex items-center justify-between">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#14201C] text-[#F2A93B]">
                <Icon className="h-5 w-5" />
              </span>
              <span className="text-sm tabular-nums text-[#7A857F]">
                {children.length} mục
              </span>
            </div>
            <h3 className="mt-6 text-lg font-semibold text-[#14201C]">
              {section.title}
            </h3>
            <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-[#5B6661]">
              {children.length
                ? children.map((c) => c.title).join(", ")
                : "Chưa có nội dung"}
            </p>
          </>
        );

        const cardBase =
          "block rounded-2xl border border-[#E2DED3] bg-white p-6 shadow-[0_1px_0_rgba(20,32,28,0.04)]";

        return href ? (
          <Link
            key={section.title}
            to={href}
            className={`${cardBase} transition-colors hover:border-[#14201C]/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F2A93B]`}
          >
            {body}
          </Link>
        ) : (
          <div key={section.title} className={`${cardBase} opacity-60`}>
            {body}
          </div>
        );
      })}
    </div>
  </section>
);

const DashboardLayout = ({ title, menuConfig = [], userName, onLogout }) => {
  // Nếu không có route con đang hiển thị, dùng trang chào mừng
  const outlet = useOutlet();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div
      className="flex min-h-screen bg-[#F4F2EC] text-[#1B2421] antialiased"
      style={{ fontFamily: FONT_STACK }}
    >
      <style>{FONT_IMPORT}</style>

      {/* SIDEBAR */}
      <Sidebar
        title={title}
        menuConfig={menuConfig}
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />

      {/* KHU VỰC NỘI DUNG CHÍNH */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* HEADER */}
        <Header
          userName={userName}
          onLogout={onLogout}
          onMenuClick={() => setMobileMenuOpen(true)}
        />

        {/* BODY */}
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-6xl px-6 py-8 md:px-10 md:py-10">
            {outlet ?? <Welcome menuConfig={menuConfig} />}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
