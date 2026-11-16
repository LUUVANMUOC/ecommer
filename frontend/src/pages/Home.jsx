import { useNavigate } from "react-router-dom";
import SiteHeader from "../components/layout/SiteHeader";
import SiteFooter from "../components/layout/SiteFooter";

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
      id: "shipper",
      title: "Shipper",
      subtitle: "Giao hàng",
      description: "Nhận đơn được phân công và giao hàng đến khách",
      path: "/shipper/login",
      icon: "two_wheeler",
      color: "text-green-600",
      bgColor: "bg-green-600/10",
      borderHover: "hover:border-green-600/50",
      gradientHover: "group-hover:from-green-600/5 group-hover:to-green-600/10",
      labelColor: "group-hover:text-green-600",
    },
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

  return (
    <div className="relative min-h-dvh bg-background overflow-x-hidden">
      {/* Decorative gradient blobs – kích thước co giãn theo viewport */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 w-[min(500px,70vw)] h-[min(500px,70vw)] bg-primary/20 rounded-full blur-3xl opacity-60" />
        <div className="absolute -top-20 -right-32 w-[min(500px,70vw)] h-[min(500px,70vw)] bg-secondary/20 rounded-full blur-3xl opacity-50" />
        <div className="absolute -bottom-32 left-1/3 w-[min(500px,70vw)] h-[min(500px,70vw)] bg-tertiary/20 rounded-full blur-3xl opacity-50" />
      </div>

      <div className="relative z-10 flex flex-col min-h-dvh">
        {/* ===== Header động (admin cấu hình) ===== */}
        <SiteHeader />

        {/* ===== Main: full chiều ngang, không giới hạn max-w ===== */}
        <main className="flex-1 flex flex-col items-center justify-center w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          {/* Hero – giới hạn chiều rộng chữ để dễ đọc */}
          <div className="text-center mb-10 sm:mb-12 flex flex-col items-center w-full max-w-3xl">
            <span className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-full bg-primary/10 text-primary text-body-sm font-medium mb-5 sm:mb-6 max-w-full">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
              </span>
              <span className="text-center">
                Nền tảng thương mại điện tử hiện đại
              </span>
            </span>

            <h1 className="text-[clamp(2rem,5vw,4.5rem)] leading-tight font-bold text-on-background tracking-tight mb-4 sm:mb-5 break-words max-w-full">
              Sàn thương mại điện tử{" "}
              <span className="bg-gradient-to-r from-primary via-secondary to-tertiary bg-clip-text text-transparent">
                CT255
              </span>
            </h1>

            <p className="text-base sm:text-lg text-on-surface-variant max-w-2xl mx-auto mb-7 sm:mb-9 px-2">
              Chào mừng bạn đến với hệ thống quản lý. Vui lòng chọn vai trò của
              bạn để tiến hành đăng nhập vào bảng điều khiển.
            </p>

            <button
              onClick={() => navigate("/san-pham")}
              className="inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3 bg-[#F2A93B] text-white font-bold rounded-full shadow-lg hover:bg-[#e09b32] transition-all hover:-translate-y-1 max-w-full text-center"
            >
              <span className="material-symbols-outlined shrink-0">
                shopping_cart
              </span>
              <span>Mua sắm ngay (Không cần đăng nhập)</span>
            </button>
          </div>

          {/* Role cards: full chiều ngang, 6 cột từ 1280px trở lên */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 sm:gap-5 xl:gap-4 2xl:gap-6 w-full">
            {roles.map((role, index) => (
              <button
                key={role.id}
                type="button"
                onClick={() => navigate(role.path)}
                style={{ animationDelay: `${index * 80}ms` }}
                className={`group relative text-left cursor-pointer w-full min-w-0 bg-surface-container-lowest/90 backdrop-blur-sm border border-outline-variant rounded-2xl p-5 xl:p-5 2xl:p-6 shadow-sm hover:shadow-xl ${role.borderHover} transition-all duration-300 transform hover:-translate-y-2 motion-safe:animate-[fadeInUp_0.5s_ease-out_both] flex flex-col`}
              >
                {/* Hover gradient overlay */}
                <div
                  className={`absolute inset-0 rounded-2xl bg-gradient-to-br from-transparent to-transparent ${role.gradientHover} opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none`}
                />

                <div className="relative flex flex-col flex-1">
                  <div
                    className={`w-12 h-12 xl:w-14 xl:h-14 rounded-xl ${role.bgColor} ${role.color} flex items-center justify-center mb-4 xl:mb-5 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300`}
                  >
                    <span className="material-symbols-outlined text-2xl xl:text-3xl">
                      {role.icon}
                    </span>
                  </div>

                  <div className="flex flex-col items-start gap-1.5 mb-2">
                    <h3
                      className={`text-lg xl:text-base 2xl:text-xl font-bold text-on-surface ${role.labelColor} transition-colors break-words min-w-0 leading-snug`}
                    >
                      {role.title}
                    </h3>
                    <span
                      className={`text-body-sm font-medium ${role.color} px-2 py-0.5 rounded-full ${role.bgColor} whitespace-nowrap`}
                    >
                      {role.subtitle}
                    </span>
                  </div>

                  <p className="text-body-sm xl:text-sm 2xl:text-base text-on-surface-variant mt-1 mb-5 sm:mb-6 flex-1">
                    {role.description}
                  </p>
                </div>

                <div className="relative flex items-center justify-between gap-2 mt-auto pt-4 border-t border-outline-variant/30">
                  <span
                    className={`inline-flex items-center whitespace-nowrap ${role.color} font-semibold text-body-sm xl:text-sm 2xl:text-base`}
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
        </main>

        {/* ===== Footer động (admin cấu hình) ===== */}
        <SiteFooter />
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
