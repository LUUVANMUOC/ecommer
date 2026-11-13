import { useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../../contexts/AuthContext";

/**
 * Shared Shopee-style header across all customer-facing pages.
 */
export default function CustomerHeader({
  showSearch = false,
  searchTerm = "",
  onSearchChange,
  onSearchKeyDown,
  onSearchClick,
  isSearching = false,
  cartCount = 0,
  showCart = true,
  pageLabel = "",
  className = "mb-6",
}) {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/san-pham");
  };

  const renderSearchInput = (inputClassName, btnClassName, iconClassName) => (
    <div className="flex items-center bg-white rounded-lg p-1 shadow-sm">
      <input
        type="text"
        placeholder={
          inputClassName.includes("px-3.5")
            ? "Tìm sản phẩm, sách truyện, mỹ phẩm, gia dụng..."
            : "Tìm kiếm sản phẩm..."
        }
        value={searchTerm}
        onChange={(e) => onSearchChange?.(e.target.value)}
        onKeyDown={onSearchKeyDown}
        className={`flex-1 ${inputClassName} text-sm text-[#0F172A] bg-transparent border-none outline-none focus:ring-0`}
      />
      <button
        type="button"
        onClick={onSearchClick}
        aria-label="Tìm kiếm"
        className={`${btnClassName} rounded-md bg-[#EE4D2D] hover:bg-[#d94224] text-white flex items-center justify-center transition-colors`}
      >
        <span className={`material-symbols-outlined ${iconClassName}`}>
          {isSearching ? "sync" : "search"}
        </span>
      </button>
    </div>
  );

  return (
    <header
      className={`bg-gradient-to-r from-[#EE4D2D] to-[#FF6533] text-white shadow-md sticky top-0 z-20 ${className}`.trim()}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 shrink-0 min-w-0">
          <Link
            to="/san-pham"
            className="text-xl sm:text-2xl font-extrabold tracking-tight flex items-center gap-2 shrink-0"
          >
            <span className="material-symbols-outlined text-3xl">
              shopping_bag
            </span>
            <span>CT255 Mall</span>
          </Link>
          {pageLabel && (
            <>
              <span className="h-5 w-px bg-white/40 hidden sm:inline-block" />
              <span className="text-sm sm:text-base font-semibold text-white/95 truncate hidden sm:inline-block">
                {pageLabel}
              </span>
            </>
          )}
        </div>

        {showSearch && (
          <div className="flex-1 max-w-2xl hidden md:block">
            {renderSearchInput("px-3.5 py-1.5", "px-5 py-1.5", "text-[20px]")}
          </div>
        )}

        <div className="flex items-center gap-4 text-sm font-medium shrink-0">
          {showCart && (
            <Link
              to="/khach-hang/gio-hang"
              className="relative p-1.5 hover:bg-white/10 rounded-full transition-colors"
              aria-label="Giỏ hàng"
            >
              <span className="material-symbols-outlined text-[26px]">
                shopping_cart
              </span>
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-white text-[#EE4D2D] font-bold text-[11px] min-w-[20px] h-5 px-1 flex items-center justify-center rounded-full shadow">
                  {cartCount}
                </span>
              )}
            </Link>
          )}

          {user ? (
            <div className="flex items-center gap-3">
              <Link
                to="/khach-hang/thong-tin-ca-nhan"
                className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/15 hover:bg-white/25 transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-white text-[#EE4D2D] font-bold flex items-center justify-center text-xs">
                  {user.kh_ten?.charAt(0).toUpperCase()}
                </div>
                <span className="hidden sm:inline max-w-[120px] truncate">
                  {user.kh_ten}
                </span>
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="text-xs sm:text-sm text-white/90 hover:text-white underline-offset-2 hover:underline"
              >
                Đăng xuất
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              <Link
                to="/khach-hang/login"
                className="px-3 py-1.5 rounded-lg hover:bg-white/15 transition-colors"
              >
                Đăng nhập
              </Link>
              <Link
                to="/khach-hang/register"
                className="bg-white text-[#EE4D2D] font-semibold px-4 py-1.5 rounded-lg hover:bg-orange-50 transition-colors shadow-sm"
              >
                Đăng ký
              </Link>
            </div>
          )}
        </div>
      </div>

      {showSearch && (
        <div className="px-4 pb-3 md:hidden">
          {renderSearchInput("px-3 py-1.5", "px-4 py-1.5", "text-[18px]")}
        </div>
      )}
    </header>
  );
}
