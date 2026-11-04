import { useNavigate } from "react-router-dom";

const Home = () => {
  const navigate = useNavigate();

  // Danh sách các vai trò và đường dẫn tương ứng
  const roles = [
    {
      id: "admin",
      title: "Quản trị viên",
      subtitle: "Admin",
      description: "Quản lý toàn bộ hệ thống sàn thương mại điện tử",
      path: "/admin/login",
      icon: "admin_panel_settings",
      color: "text-primary",
      bgColor: "bg-primary/10",
      borderHover: "hover:border-primary/50",
      gradientHover: "group-hover:from-primary/5 group-hover:to-primary/10",
      labelColor: "group-hover:text-primary",
    },
    {
      id: "shop",
      title: "Gian hàng",
      subtitle: "Người bán",
      description: "Quản lý gian hàng, sản phẩm và đơn hàng của bạn",
      path: "/nguoi-ban/login",
      icon: "storefront",
      color: "text-secondary",
      bgColor: "bg-secondary/10",
      borderHover: "hover:border-secondary/50",
      gradientHover: "group-hover:from-secondary/5 group-hover:to-secondary/10",
      labelColor: "group-hover:text-secondary",
    },
    {
      id: "dvvc",
      title: "Đơn vị vận chuyển",
      subtitle: "Logistics",
      description: "Quản lý cước phí, giao nhận hàng hóa toàn quốc",
      path: "/dvvc/login",
      icon: "local_shipping",
      color: "text-tertiary",
      bgColor: "bg-tertiary/10",
      borderHover: "hover:border-tertiary/50",
      gradientHover: "group-hover:from-tertiary/5 group-hover:to-tertiary/10",
      labelColor: "group-hover:text-tertiary",
    },
    {
      id: "shipper", // ← THÊM
      title: "Shipper", // ← THÊM
      subtitle: "Giao hàng", // ← THÊM
      description: "Nhận đơn được phân công và giao hàng đến khách", // ← THÊM
      path: "/shipper/login", // ← THÊM
      icon: "two_wheeler", // ← THÊM
      color: "text-green-600", // ← THÊM
      bgColor: "bg-green-600/10", // ← THÊM
      borderHover: "hover:border-green-600/50", // ← THÊM
      gradientHover: "group-hover:from-green-600/5 group-hover:to-green-600/10", // ← THÊM
      labelColor: "group-hover:text-green-600", // ← THÊM
    },
    // ... (sau card shipper)
    {
      id: "quanlykho",
      title: "Quản lý kho",
      subtitle: "Kho hàng",
      description: "Quản lý hoạt động xuất nhập tồn tại kho được phân quyền",
      path: "/quan-ly-kho/login",
      icon: "warehouse",
      color: "text-indigo-600",
      bgColor: "bg-indigo-600/10",
      borderHover: "hover:border-indigo-600/50",
      gradientHover:
        "group-hover:from-indigo-600/5 group-hover:to-indigo-600/10",
      labelColor: "group-hover:text-indigo-600",
    },
    {
      id: "khachhang",
      title: "Khách hàng",
      subtitle: "Người mua",
      description: "Mua sắm trực tuyến, giao hàng tận nhà",
      path: "/khach-hang/login",
      icon: "shopping_bag",
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
      borderHover: "hover:border-orange-500/50",
      gradientHover:
        "group-hover:from-orange-500/5 group-hover:to-orange-500/10",
      labelColor: "group-hover:text-orange-500",
    },
  ];

  const stats = [
    { label: "Gian hàng", value: "10K+" },
    { label: "Khách hàng", value: "500K+" },
    { label: "Đơn hàng / ngày", value: "50K+" },
    { label: "Đối tác vận chuyển", value: "20+" },
  ];

  return (
    <div className="relative min-h-screen bg-background overflow-hidden">
      {/* Decorative gradient blobs */}
      <div className="absolute -top-32 -left-32 w-[500px] h-[500px] bg-primary/20 rounded-full blur-3xl opacity-60 pointer-events-none" />
      <div className="absolute -top-20 -right-32 w-[500px] h-[500px] bg-secondary/20 rounded-full blur-3xl opacity-50 pointer-events-none" />
      <div className="absolute -bottom-32 left-1/3 w-[500px] h-[500px] bg-tertiary/20 rounded-full blur-3xl opacity-50 pointer-events-none" />

      <div className="relative z-10 flex flex-col min-h-screen px-6">
        {/* ===== Header ===== */}
        <header className="flex items-center justify-between w-full max-w-7xl mx-auto py-6">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/30">
              <span className="material-symbols-outlined text-white text-[22px]">
                storefront
              </span>
            </div>
            <div className="leading-tight">
              <div className="text-headline-sm font-bold text-on-surface">
                CT255
              </div>
              <div className="text-body-sm text-on-surface-variant">
                E-Commerce Platform
              </div>
            </div>
          </div>

          <button
            type="button"
            className="hidden md:inline-flex items-center gap-2 px-4 py-2 rounded-full border border-outline-variant text-on-surface-variant text-body-sm hover:border-primary hover:text-primary transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">help</span>
            Trợ giúp
          </button>
        </header>

        {/* ===== Main ===== */}
        <main className="flex-1 flex flex-col items-center justify-center w-full max-w-7xl mx-auto py-10">
          {/* Hero */}
          <div className="text-center mb-14 flex flex-col items-center">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-body-sm font-medium mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
              </span>
              Nền tảng thương mại điện tử hiện đại
            </span>

            <h1 className="text-display-lg font-bold text-on-background tracking-tight mb-4">
              Sàn thương mại điện tử{" "}
              <span className="bg-gradient-to-r from-primary via-secondary to-tertiary bg-clip-text text-transparent">
                CT255
              </span>
            </h1>

            <p className="text-body-lg text-on-surface-variant max-w-2xl mx-auto mb-8">
              Chào mừng bạn đến với hệ thống quản lý. Vui lòng chọn vai trò của
              bạn để tiến hành đăng nhập vào bảng điều khiển.
            </p>

            <button
              onClick={() => navigate("/san-pham")}
              className="inline-flex items-center gap-2 px-8 py-3 bg-[#F2A93B] text-white font-bold rounded-full shadow-lg hover:bg-[#e09b32] transition-all hover:-translate-y-1"
            >
              <span className="material-symbols-outlined">shopping_cart</span>
              Mua sắm ngay (Không cần đăng nhập)
            </button>
          </div>

          {/* Role cards grid — đổi lg:grid-cols-4 → md:2 / lg:3 / xl:5 (đủ 5 card) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 w-full mt-8">
            {roles.map((role, index) => (
              <button
                key={role.id}
                type="button"
                onClick={() => navigate(role.path)}
                style={{ animationDelay: `${index * 80}ms` }}
                className={`group relative text-left cursor-pointer bg-surface-container-lowest/90 backdrop-blur-sm border border-outline-variant rounded-2xl p-6 shadow-sm hover:shadow-xl ${role.borderHover} transition-all duration-300 transform hover:-translate-y-2 animate-[fadeInUp_0.5s_ease-out_both] flex flex-col justify-between`}
              >
                {/* Hover gradient overlay */}
                <div
                  className={`absolute inset-0 rounded-2xl bg-gradient-to-br from-transparent to-transparent ${role.gradientHover} opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none`}
                />

                <div className="relative">
                  <div
                    className={`w-14 h-14 rounded-xl ${role.bgColor} ${role.color} flex items-center justify-center mb-5 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300`}
                  >
                    <span className="material-symbols-outlined text-3xl">
                      {role.icon}
                    </span>
                  </div>

                  <div className="flex items-baseline gap-2 mb-1 flex-wrap">
                    <h3
                      className={`text-headline-sm font-bold text-on-surface ${role.labelColor} transition-colors`}
                    >
                      {role.title}
                    </h3>
                    <span
                      className={`text-body-sm font-medium ${role.color} px-2 py-0.5 rounded-full ${role.bgColor}`}
                    >
                      {role.subtitle}
                    </span>
                  </div>

                  <p className="text-body-sm text-on-surface-variant mt-2 mb-6 line-clamp-2">
                    {role.description}
                  </p>
                </div>

                <div className="relative flex items-center justify-between mt-auto pt-4 border-t border-outline-variant/30">
                  <span
                    className={`inline-flex items-center ${role.color} font-semibold text-body-sm`}
                  >
                    Đăng nhập ngay
                    <span className="material-symbols-outlined text-lg ml-1 group-hover:translate-x-1 transition-transform">
                      arrow_forward
                    </span>
                  </span>
                  <span
                    className={`material-symbols-outlined ${role.color} opacity-30 group-hover:opacity-100 transition-opacity`}
                  >
                    chevron_right
                  </span>
                </div>
              </button>
            ))}
          </div>

          {/* Stats */}
          <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-10 w-full max-w-4xl">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-headline-lg font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  {stat.value}
                </div>
                <div className="text-body-sm text-on-surface-variant mt-1">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </main>

        {/* ===== Footer ===== */}
        <footer className="w-full max-w-7xl mx-auto py-6 mt-12 border-t border-outline-variant/40 flex flex-col md:flex-row items-center justify-between gap-3 text-body-sm text-on-surface-variant">
          <div>© 2025 CT255 E-Commerce Platform. Bảo lưu mọi quyền.</div>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-primary transition-colors">
              Điều khoản
            </a>
            <a href="#" className="hover:text-primary transition-colors">
              Bảo mật
            </a>
            <a href="#" className="hover:text-primary transition-colors">
              Liên hệ
            </a>
          </div>
        </footer>
      </div>

      {/* Keyframes */}
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default Home;
