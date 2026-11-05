// src/pages/khachhang/ThongTinCaNhan.jsx
import { useState, useEffect, useContext, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../../contexts/AuthContext";
import axiosClient from "../../config/axiosClient";
import khachHangProfileService from "../../services/khachhang/khachHangService";
import theoDoiShopService from "../../services/khachhang/theoDoiShopService";
import donHangService from "../../services/khachhang/donHangService";
import trangThaiDonHangService from "../../services/san/trangThaiDonHangService";
import publicSanPhamService from "../../services/san/publicSanPhamService";
import ToastNotification from "../../components/common/Crud/ToastNotification";
import { ChangePasswordForm } from "../../components/account/AccountForms";
import {
  BankAccountSection,
  BankQRModal,
} from "../../components/account/BankAccount";
import { DiaChiNhanHangSection } from "../../components/account/DiaChiNhanHangSection";
import { toAssetUrl } from "../../utils/accountUtils";
import { formatVND } from "../../components/shop/SanPhamShared";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8080";

const EMPTY_BANK_FORM = {
  nh_ma: "",
  nganhang_ma: "",
  ttnt_gianhang_sotaikhoan: "",
  ttnt_kh_sotaikhoan: "",
  ttnt_gianhang_tentaikhoan: "",
  ttnt_kh_tennguoinhan: "",
};

const STEP_ICONS = {
  TTDH01: "receipt_long",
  TTDH02: "inventory_2",
  TTDH03: "local_shipping",
  TTDH04: "two_wheeler",
  TTDH05: "verified",
  TTDH06: "cancel",
};

// 🟢 Danh sách các tab trạng thái
const ORDER_TABS = [
  { id: "ALL", label: "Tất cả" },
  { id: "TTDH01", label: "Chờ xác nhận" },
  { id: "TTDH02", label: "Chờ lấy hàng" },
  { id: "TTDH03", label: "Đang vận chuyển" },
  { id: "TTDH04", label: "Đang giao" },
  { id: "TTDH05", label: "Đã hoàn thành" },
  { id: "TTDH06", label: "Đã hủy" },
];

const ThongTinCaNhan = () => {
  const { user } = useContext(AuthContext);
  const kh_ma = user?.kh_ma;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });

  const [activeTab, setActiveTab] = useState("ho-so");

  const [profileData, setProfileData] = useState({
    kh_ten: "",
    kh_sdt: "",
    kh_ngaysinh: "",
    kh_gioitinh: true,
    kh_avatar: "",
  });
  const [selectedFile, setSelectedFile] = useState(null);

  const [banks, setBanks] = useState([]);
  const [linkedBank, setLinkedBank] = useState(null);
  const [bankForm, setBankForm] = useState(EMPTY_BANK_FORM);
  const [savingBank, setSavingBank] = useState(false);
  const [qrBank, setQrBank] = useState(null);

  const [followedShops, setFollowedShops] = useState([]);
  const [loadingShops, setLoadingShops] = useState(false);

  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [orderSteps, setOrderSteps] = useState([]);

  // 🟢 State cho tính năng lọc và thu gọn đơn hàng
  const [selectedOrderStatus, setSelectedOrderStatus] = useState("ALL");
  const [expandedOrders, setExpandedOrders] = useState({});

  // 🟢 State cho Lịch sử xem
  const [historyViews, setHistoryViews] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(
      () => setToast({ show: false, message: "", type: "success" }),
      3000,
    );
  };

  const fetchData = useCallback(async () => {
    if (!kh_ma) return;
    try {
      const [resBanks, resProfile] = await Promise.all([
        axiosClient.get("/ngan-hang"),
        khachHangProfileService.getProfile(kh_ma),
      ]);
      setBanks(resBanks.data);
      const data = resProfile.data;
      setProfileData({
        kh_ten: data.kh_ten || "",
        kh_sdt: data.kh_sdt || "",
        kh_ngaysinh: data.kh_ngaysinh ? data.kh_ngaysinh.split("T")[0] : "",
        kh_gioitinh: data.kh_gioitinh,
        kh_avatar: data.kh_avatar || "",
      });
      if (data.nganhang_ma) {
        setLinkedBank({
          nh_ma: data.nganhang_ma,
          nganhang_ma: data.nganhang_ma,
          nhg_ten: data.nhg_ten,
          nhg_logo: data.nhg_logo,
          ttnt_gianhang_sotaikhoan: data.ttnt_kh_sotaikhoan,
          ttnt_gianhang_tentaikhoan: data.ttnt_kh_tennguoinhan,
        });
        setBankForm({
          nh_ma: data.nganhang_ma,
          nganhang_ma: data.nganhang_ma,
          ttnt_gianhang_sotaikhoan: data.ttnt_kh_sotaikhoan,
          ttnt_gianhang_tentaikhoan: data.ttnt_kh_tennguoinhan || "",
        });
      }
    } catch (err) {
      showToast("Lỗi tải dữ liệu", "error");
    } finally {
      setLoading(false);
    }
  }, [kh_ma]);

  useEffect(() => {
    const fetchOrderSteps = async () => {
      try {
        const res = await trangThaiDonHangService.getAll();
        const steps = res.data.filter((step) => step.Ma !== "TTDH06");
        setOrderSteps(steps);
      } catch (err) {
        console.error("Lỗi lấy danh sách trạng thái", err);
      }
    };
    fetchOrderSteps();
    fetchData();
  }, [fetchData]);

  const fetchFollowedShops = useCallback(async () => {
    if (!kh_ma) return;
    setLoadingShops(true);
    try {
      const res = await theoDoiShopService.getFollowedShops(kh_ma);
      setFollowedShops(res.data);
    } catch (err) {
      showToast("Lỗi tải danh sách shop theo dõi", "error");
    } finally {
      setLoadingShops(false);
    }
  }, [kh_ma]);

  const fetchOrders = useCallback(async () => {
    if (!kh_ma) return;
    setLoadingOrders(true);
    try {
      const res = await donHangService.getMyOrders(kh_ma);
      setOrders(res.data);
    } catch (err) {
      showToast("Lỗi tải danh sách đơn hàng", "error");
    } finally {
      setLoadingOrders(false);
    }
  }, [kh_ma]);

  // 🟢 Hàm fetch Lịch sử xem
  const fetchHistory = useCallback(async () => {
    if (!kh_ma) return;
    setLoadingHistory(true);
    try {
      const res = await publicSanPhamService.getViewHistory(kh_ma);
      setHistoryViews(res.data);
    } catch (err) {
      showToast("Lỗi tải lịch sử xem hàng", "error");
    } finally {
      setLoadingHistory(false);
    }
  }, [kh_ma]);

  useEffect(() => {
    if (activeTab === "shop-theo-doi") fetchFollowedShops();
    if (activeTab === "don-hang") fetchOrders();
    if (activeTab === "lich-su-xem") fetchHistory();
  }, [activeTab, fetchFollowedShops, fetchOrders, fetchHistory]);

  // ✅ Hàm xử lý hủy đơn
  const handleCancelOrder = async (e, dts_ma) => {
    e.stopPropagation(); // Ngăn việc click vào nút Hủy lại kích hoạt mở/thu gọn đơn hàng
    if (
      !window.confirm(
        "Bạn có chắc chắn muốn hủy đơn hàng này? Hành động này không thể hoàn tác.",
      )
    )
      return;
    try {
      await donHangService.cancelOrder(dts_ma);
      showToast("Đã hủy đơn hàng thành công!", "success");
      fetchOrders(); // Load lại danh sách
    } catch (error) {
      showToast(
        error.response?.data?.message || "Lỗi khi hủy đơn hàng",
        "error",
      );
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("kh_ten", profileData.kh_ten);
      fd.append("kh_sdt", profileData.kh_sdt);
      fd.append("kh_ngaysinh", profileData.kh_ngaysinh);
      fd.append("kh_gioitinh", profileData.kh_gioitinh);
      if (selectedFile) fd.append("avatar", selectedFile);
      await khachHangProfileService.updateProfile(kh_ma, fd);
      showToast("Cập nhật thành công!");
      if (selectedFile) {
        setProfileData({
          ...profileData,
          kh_avatar: URL.createObjectURL(selectedFile),
        });
        setSelectedFile(null);
      }
    } catch (err) {
      showToast("Lỗi cập nhật", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async ({ oldPassword, newPassword }) => {
    try {
      await khachHangProfileService.changePassword({
        kh_ma,
        oldPassword,
        newPassword,
      });
      showToast("Đổi mật khẩu thành công!");
      return true;
    } catch (err) {
      showToast("Lỗi đổi mật khẩu", "error");
      return false;
    }
  };

  const handleSaveBank = async (e) => {
    e.preventDefault();
    const dataToSave = {
      nganhang_ma: bankForm.nh_ma || bankForm.nganhang_ma,
      ttnt_kh_sotaikhoan:
        bankForm.ttnt_gianhang_sotaikhoan || bankForm.ttnt_kh_sotaikhoan,
      ttnt_kh_tennguoinhan:
        bankForm.ttnt_gianhang_tentaikhoan || bankForm.ttnt_kh_tennguoinhan,
    };
    if (!dataToSave.nganhang_ma || !dataToSave.ttnt_kh_sotaikhoan)
      return showToast("Nhập đủ thông tin!", "error");
    setSavingBank(true);
    try {
      await khachHangProfileService.saveBank(kh_ma, dataToSave);
      showToast("Lưu thành công!");
      fetchData();
    } catch (err) {
      showToast("Lỗi!", "error");
    } finally {
      setSavingBank(false);
    }
  };

  const handleDeleteBank = async () => {
    if (!window.confirm("Xóa tài khoản?")) return;
    await khachHangProfileService.deleteBank(kh_ma);
    setLinkedBank(null);
    setBankForm(EMPTY_BANK_FORM);
    showToast("Đã xóa!");
  };

  const handleUnfollowShop = async (gh_ma) => {
    if (!window.confirm("Bạn có chắc muốn bỏ theo dõi shop này?")) return;
    try {
      await theoDoiShopService.toggleFollow(kh_ma, gh_ma);
      showToast("Đã bỏ theo dõi shop!");
      fetchFollowedShops();
    } catch (err) {
      showToast("Lỗi khi bỏ theo dõi!", "error");
    }
  };

  // 🟢 Hàm toggle mở/thu gọn đơn hàng
  const toggleOrder = (dm_ma) => {
    setExpandedOrders((prev) => ({
      ...prev,
      [dm_ma]: !prev[dm_ma],
    }));
  };

  // 🟢 Lọc đơn hàng theo trạng thái được chọn
  const filteredOrders = useMemo(() => {
    if (selectedOrderStatus === "ALL") return orders;
    return orders.filter((order) =>
      order.shops.some((shop) => shop.TrangThaiHienTai === selectedOrderStatus),
    );
  }, [orders, selectedOrderStatus]);

  const renderTimeline = (currentStatus) => {
    if (currentStatus === "TTDH06") {
      return (
        <div className="flex items-center justify-center gap-2 text-red-600 font-bold bg-red-50 p-3 rounded-xl border border-red-200">
          <span className="material-symbols-outlined text-2xl">cancel</span>
          <span className="text-base">Đơn hàng đã bị hủy</span>
        </div>
      );
    }
    if (orderSteps.length === 0)
      return (
        <div className="text-sm text-gray-500">Đang tải trạng thái...</div>
      );

    const currentIndex = orderSteps.findIndex(
      (step) => step.Ma === currentStatus,
    );
    const activeIndex = currentIndex === -1 ? 0 : currentIndex;

    return (
      <div className="py-4 px-2">
        <div className="relative flex items-start justify-between w-full">
          <div className="absolute left-[10%] right-[10%] top-[22px] h-[3px] bg-gray-200 rounded-full z-0"></div>
          <div
            className="absolute left-[10%] top-[22px] h-[3px] bg-[#2563EB] rounded-full z-0 transition-all duration-700 ease-in-out"
            style={{
              width: `calc(${(activeIndex / (orderSteps.length - 1)) * 80}%)`,
            }}
          ></div>

          {orderSteps.map((step, index) => {
            const isCompleted = index < activeIndex;
            const isCurrent = index === activeIndex;
            const iconName = STEP_ICONS[step.Ma] || "circle";

            return (
              <div
                key={step.Ma}
                className="flex flex-col items-center flex-1 z-10 relative"
              >
                <div
                  className={`relative flex items-center justify-center transition-all duration-300 bg-white
                    ${isCurrent ? "w-12 h-12 rounded-full border-[3px] border-[#2563EB] text-[#2563EB] shadow-[0_0_0_4px_rgba(37,99,235,0.15)] scale-110" : isCompleted ? "w-10 h-10 rounded-full bg-[#2563EB] border-2 border-[#2563EB] text-white shadow-sm mt-1" : "w-10 h-10 rounded-full border-2 border-gray-200 bg-gray-50 text-gray-400 mt-1"}`}
                >
                  <span
                    className={`material-symbols-outlined transition-transform duration-300 ${isCurrent ? "text-[24px]" : "text-[18px]"} ${isCurrent ? "animate-pulse" : ""}`}
                  >
                    {iconName}
                  </span>
                  {isCompleted && (
                    <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5">
                      <span className="material-symbols-outlined text-[14px] text-[#2563EB] fill-current">
                        check_circle
                      </span>
                    </div>
                  )}
                </div>
                <span
                  className={`text-[11px] sm:text-xs font-bold mt-2 text-center px-1 leading-tight w-full ${isCurrent ? "text-[#2563EB]" : isCompleted ? "text-[#0F172A]" : "text-gray-400"}`}
                >
                  {step.Ten}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (loading)
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center text-[#64748B] font-medium">
        Đang tải...
      </div>
    );

  const menuItems = [
    { id: "ho-so", icon: "person", label: "Hồ Sơ Của Tôi" },
    { id: "don-hang", icon: "receipt_long", label: "Đơn Hàng Của Tôi" },
    { id: "lich-su-xem", icon: "history", label: "Lịch Sử Xem Hàng" },
    { id: "dia-chi", icon: "location_on", label: "Sổ Địa Chỉ" },
    { id: "ngan-hang", icon: "account_balance", label: "Tài Khoản Ngân Hàng" },
    { id: "shop-theo-doi", icon: "storefront", label: "Shop Đã Theo Dõi" },
    { id: "doi-mat-khau", icon: "lock", label: "Đổi Mật Khẩu" },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-16 font-sans">
      <header className="bg-white shadow-sm mb-6 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <a
            href="/"
            className="text-2xl font-bold text-[#2563EB] flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-3xl">
              storefront
            </span>{" "}
            CT255 Shop
          </a>
          <div className="text-sm font-semibold text-[#0F172A]">
            {user?.kh_ten}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-[280px_1fr] gap-6">
        <div className="bg-white rounded-3xl shadow-sm border border-[#E2E8F0] flex flex-col overflow-hidden self-start">
          <div className="p-6 flex items-center gap-4 border-b border-[#F1F5F9] bg-[#F8FAFC]">
            <div className="w-14 h-14 rounded-full border-2 border-blue-200 overflow-hidden bg-white p-0.5">
              <img
                src={toAssetUrl(profileData.kh_avatar)}
                className="w-full h-full object-cover rounded-full"
              />
            </div>
            <div>
              <p className="font-bold text-[#0F172A] line-clamp-1">
                {profileData.kh_ten}
              </p>
              <p className="text-xs font-medium text-[#64748B] flex items-center gap-1 mt-1">
                <span className="material-symbols-outlined text-[14px]">
                  edit
                </span>{" "}
                Sửa Hồ Sơ
              </p>
            </div>
          </div>
          <div className="flex flex-col py-3 px-2">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-3 px-4 py-3.5 text-sm rounded-xl mx-1 my-0.5 text-left transition-all ${activeTab === item.id ? "text-[#2563EB] font-bold bg-blue-50" : "text-[#334155] font-medium hover:bg-[#F8FAFC]"}`}
              >
                <span
                  className={`material-symbols-outlined text-[20px] ${activeTab === item.id ? "text-[#2563EB]" : "text-[#64748B]"}`}
                >
                  {item.icon}
                </span>{" "}
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-[#E2E8F0] p-6 lg:p-8">
          {activeTab === "ho-so" && (
            <div>
              <h2 className="text-xl font-bold text-[#0F172A] mb-1">
                Hồ Sơ Của Tôi
              </h2>
              <p className="text-sm font-medium text-[#64748B] mb-8 border-b border-[#F1F5F9] pb-4">
                Quản lý thông tin hồ sơ để bảo mật tài khoản
              </p>

              <form
                onSubmit={handleProfileSubmit}
                className="flex flex-col md:flex-row gap-10"
              >
                <div className="flex-1 space-y-5 max-w-md">
                  <div className="flex items-center">
                    <label className="w-32 text-sm font-semibold text-[#64748B] text-right pr-6">
                      Tên đăng nhập
                    </label>
                    <span className="text-sm font-bold text-[#0F172A]">
                      {user?.kh_email}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <label className="w-32 text-sm font-semibold text-[#64748B] text-right pr-6">
                      Tên
                    </label>
                    <input
                      type="text"
                      value={profileData.kh_ten}
                      onChange={(e) =>
                        setProfileData({
                          ...profileData,
                          kh_ten: e.target.value,
                        })
                      }
                      className="flex-1 px-4 py-2.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] text-sm text-[#0F172A] outline-none focus:border-[#2563EB] focus:bg-white transition-all"
                    />
                  </div>
                  <div className="flex items-center">
                    <label className="w-32 text-sm font-semibold text-[#64748B] text-right pr-6">
                      Số điện thoại
                    </label>
                    <input
                      type="text"
                      value={profileData.kh_sdt}
                      onChange={(e) =>
                        setProfileData({
                          ...profileData,
                          kh_sdt: e.target.value,
                        })
                      }
                      className="flex-1 px-4 py-2.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] text-sm text-[#0F172A] outline-none focus:border-[#2563EB] focus:bg-white transition-all"
                    />
                  </div>
                  <div className="flex items-center">
                    <label className="w-32 text-sm font-semibold text-[#64748B] text-right pr-6">
                      Ngày sinh
                    </label>
                    <input
                      type="date"
                      value={profileData.kh_ngaysinh}
                      onChange={(e) =>
                        setProfileData({
                          ...profileData,
                          kh_ngaysinh: e.target.value,
                        })
                      }
                      className="flex-1 px-4 py-2.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] text-sm text-[#0F172A] outline-none focus:border-[#2563EB] focus:bg-white transition-all"
                    />
                  </div>
                  <div className="flex items-center">
                    <label className="w-32 text-sm font-semibold text-[#64748B] text-right pr-6">
                      Giới tính
                    </label>
                    <select
                      value={profileData.kh_gioitinh}
                      onChange={(e) =>
                        setProfileData({
                          ...profileData,
                          kh_gioitinh: e.target.value === "true",
                        })
                      }
                      className="flex-1 px-4 py-2.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] text-sm text-[#0F172A] outline-none focus:border-[#2563EB] focus:bg-white transition-all cursor-pointer"
                    >
                      <option value="true">Nam</option>
                      <option value="false">Nữ</option>
                    </select>
                  </div>
                  <div className="flex items-center pt-4">
                    <label className="w-32"></label>
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-8 py-2.5 bg-[#2563EB] text-white rounded-xl text-sm font-bold hover:bg-[#1D4ED8] shadow-sm transition-colors"
                    >
                      {saving ? "Đang lưu..." : "Lưu Thay Đổi"}
                    </button>
                  </div>
                </div>
                <div className="flex flex-col items-center border-l border-[#F1F5F9] pl-10 gap-4">
                  <img
                    src={toAssetUrl(profileData.kh_avatar)}
                    className="w-28 h-28 rounded-full border-4 border-[#F8FAFC] shadow-sm object-cover"
                  />
                  <label className="cursor-pointer border border-[#E2E8F0] px-5 py-2.5 text-sm font-semibold text-[#334155] bg-white hover:bg-[#F8FAFC] rounded-xl shadow-sm transition-colors">
                    Chọn Ảnh Mới
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => setSelectedFile(e.target.files[0])}
                    />
                  </label>
                  <p className="text-xs font-medium text-[#64748B] text-center max-w-[150px]">
                    Dụng lượng file tối đa 1 MB. Định dạng: .JPEG, .PNG
                  </p>
                </div>
              </form>
            </div>
          )}

          {activeTab === "don-hang" && (
            <div>
              <h2 className="text-xl font-bold text-[#0F172A] mb-1">
                Đơn Hàng Của Tôi
              </h2>
              <p className="text-sm font-medium text-[#64748B] mb-4">
                Theo dõi tiến trình và trạng thái các đơn hàng
              </p>

              {/* 🟢 THANH TAB TRẠNG THÁI */}
              <div className="flex overflow-x-auto border-b border-[#E2E8F0] mb-6 custom-scrollbar">
                {ORDER_TABS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setSelectedOrderStatus(tab.id)}
                    className={`px-6 py-3 font-semibold text-sm whitespace-nowrap transition-colors border-b-2 ${
                      selectedOrderStatus === tab.id
                        ? "text-[#2563EB] border-[#2563EB]"
                        : "text-[#64748B] border-transparent hover:text-[#0F172A]"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {loadingOrders ? (
                <div className="text-center py-10 text-[#64748B] font-medium">
                  Đang tải danh sách đơn hàng...
                </div>
              ) : filteredOrders.length === 0 ? (
                <div className="text-center py-20 border border-dashed border-[#E2E8F0] rounded-2xl">
                  <span className="material-symbols-outlined text-6xl text-gray-300 mb-4">
                    receipt_long
                  </span>
                  <p className="text-lg font-bold text-gray-700">
                    Không có đơn hàng nào ở trạng thái này.
                  </p>
                  <Link
                    to="/"
                    className="mt-4 inline-block px-6 py-2 bg-[#2563EB] text-white rounded-xl font-bold"
                  >
                    Tiếp tục mua sắm
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredOrders.map((order) => (
                    <div
                      key={order.DM_Ma}
                      className="bg-white rounded-2xl shadow-sm border border-[#E2E8F0] overflow-hidden"
                    >
                      {/* 🟢 HEADER ĐƠN HÀNG (BẤM ĐỂ MỞ RỘNG) */}
                      <div
                        onClick={() => toggleOrder(order.DM_Ma)}
                        className="bg-[#F8FAFC] px-6 py-4 flex flex-wrap justify-between items-center gap-2 cursor-pointer hover:bg-gray-100 transition-colors"
                      >
                        <div>
                          <p className="font-bold text-[#0F172A] flex items-center gap-2">
                            Mã Đơn:{" "}
                            <span className="text-[#2563EB]">
                              {order.DM_Ma}
                            </span>
                          </p>
                          <p className="text-sm text-[#64748B] mt-1">
                            Ngày đặt:{" "}
                            {new Date(order.NgayLap).toLocaleDateString(
                              "vi-VN",
                            )}
                          </p>
                        </div>

                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <p className="text-sm text-[#64748B]">
                              Tổng thanh toán
                            </p>
                            <p className="text-xl font-extrabold text-[#DC2626]">
                              {formatVND(order.TongTien)}
                            </p>
                          </div>
                          {/* Icon mũi tên chỉ hướng mở rộng */}
                          <span className="material-symbols-outlined text-[#2563EB] text-3xl bg-white rounded-full shadow-sm">
                            {expandedOrders[order.DM_Ma]
                              ? "expand_less"
                              : "expand_more"}
                          </span>
                        </div>
                      </div>

                      {/* 🟢 PHẦN CHI TIẾT (CHỈ HIỆN KHI MỞ RỘNG) */}
                      {expandedOrders[order.DM_Ma] && (
                        <>
                          <div className="px-6 py-3 bg-white border-b border-t border-[#E2E8F0] text-sm text-[#64748B] flex items-start gap-2">
                            <span className="material-symbols-outlined text-[#2563EB] text-[18px]">
                              location_on
                            </span>
                            <span>Giao đến: {order.DiaChiNhan}</span>
                          </div>

                          <div className="divide-y divide-[#E2E8F0]">
                            {order.shops.map((shop) => (
                              <div key={shop.DTS_Ma} className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                  <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[#2563EB]">
                                      storefront
                                    </span>
                                    <span className="font-bold text-[#0F172A]">
                                      {shop.TenShop}
                                    </span>
                                  </div>
                                  {shop.TrangThaiHienTai === "TTDH01" && (
                                    <button
                                      onClick={(e) =>
                                        handleCancelOrder(e, shop.DTS_Ma)
                                      }
                                      className="text-sm font-semibold text-[#DC2626] hover:underline bg-red-50 px-3 py-1.5 rounded-lg border border-red-100"
                                    >
                                      Hủy Đơn Hàng
                                    </button>
                                  )}
                                </div>

                                <div className="mb-6 bg-gray-50 p-4 rounded-xl border border-gray-100">
                                  {renderTimeline(shop.TrangThaiHienTai)}
                                </div>

                                <div className="space-y-4 mb-4">
                                  {shop.items.map((item) => (
                                    <div
                                      key={item.Ctsp_Ma}
                                      className="flex gap-4 items-center text-sm"
                                    >
                                      <img
                                        src={
                                          item.Image
                                            ? `${BACKEND_URL}${item.Image}`
                                            : "https://placehold.co/100x100"
                                        }
                                        className="w-16 h-16 rounded-lg object-cover border border-[#E2E8F0]"
                                        alt=""
                                      />
                                      <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-[#0F172A] truncate">
                                          {item.TenSanPham}
                                        </p>
                                        <p className="text-[#64748B] text-xs mt-0.5">
                                          Phân loại: {item.TenPhanLoai}
                                        </p>
                                        <p className="text-[#64748B] text-xs">
                                          Số lượng: {item.SoLuong}
                                        </p>
                                      </div>
                                      <p className="font-bold text-[#DC2626]">
                                        {formatVND(item.GiaBan * item.SoLuong)}
                                      </p>
                                    </div>
                                  ))}
                                </div>

                                <div className="flex justify-end text-sm border-t border-[#E2E8F0] pt-3 gap-6">
                                  <span className="text-[#64748B]">
                                    Phí vận chuyển:{" "}
                                    <strong className="text-[#0F172A]">
                                      {formatVND(shop.TienVanChuyen)}
                                    </strong>
                                  </span>
                                  <span className="text-[#64748B]">
                                    Tổng Shop:{" "}
                                    <strong className="text-[#DC2626] text-base">
                                      {formatVND(shop.TongThanhToan)}
                                    </strong>
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 🟢 TAB LỊCH SỬ XEM HÀNG */}
          {activeTab === "lich-su-xem" && (
            <div>
              <h2 className="text-xl font-bold text-[#0F172A] mb-1">
                Lịch Sử Xem Hàng
              </h2>
              <p className="text-sm font-medium text-[#64748B] mb-8 border-b border-[#F1F5F9] pb-4">
                Danh sách các sản phẩm bạn đã xem gần đây
              </p>

              {loadingHistory ? (
                <div className="text-center py-10 text-[#64748B] font-medium">
                  Đang tải lịch sử...
                </div>
              ) : historyViews.length === 0 ? (
                <div className="text-center py-20 border border-dashed border-[#E2E8F0] rounded-2xl">
                  <span className="material-symbols-outlined text-6xl text-gray-300 mb-4">
                    history
                  </span>
                  <p className="text-lg font-bold text-gray-700">
                    Bạn chưa xem sản phẩm nào.
                  </p>
                  <Link
                    to="/"
                    className="mt-4 inline-block px-6 py-2 bg-[#2563EB] text-white rounded-xl font-bold hover:bg-[#1D4ED8]"
                  >
                    Khám phá ngay
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {historyViews.map((item, index) => (
                    <div
                      key={`${item.Ctsp_Ma}-${index}`}
                      className="flex gap-4 items-center bg-white border border-[#E2E8F0] p-3 rounded-2xl hover:shadow-md transition-shadow"
                    >
                      <Link
                        to={`/san-pham/${item.Sp_Ma}?ctsp_ma=${item.Ctsp_Ma}`}
                        className="shrink-0"
                      >
                        <img
                          src={
                            item.Image
                              ? `${BACKEND_URL}${item.Image}`
                              : "https://placehold.co/100x100"
                          }
                          alt=""
                          className="w-20 h-20 rounded-xl object-cover border border-[#F1F5F9]"
                        />
                      </Link>
                      <div className="flex-1 min-w-0">
                        <Link
                          to={`/san-pham/${item.Sp_Ma}?ctsp_ma=${item.Ctsp_Ma}`}
                        >
                          <h3 className="font-bold text-[#0F172A] truncate hover:text-[#2563EB]">
                            {item.TenSanPham}
                          </h3>
                        </Link>
                        <p className="text-xs text-[#64748B] mt-1">
                          Phân loại: {item.TenPhanLoai}
                        </p>
                        <p className="text-sm font-bold text-[#DC2626] mt-2">
                          {formatVND(item.GiaBan)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "dia-chi" && (
            <div>
              <h2 className="text-xl font-bold text-[#0F172A] mb-1">
                Sổ Địa Chỉ
              </h2>
              <p className="text-sm font-medium text-[#64748B] mb-8 border-b border-[#F1F5F9] pb-4">
                Quản lý địa chỉ nhận hàng của bạn
              </p>
              <DiaChiNhanHangSection kh_ma={kh_ma} />
            </div>
          )}

          {activeTab === "ngan-hang" && (
            <div>
              <h2 className="text-xl font-bold text-[#0F172A] mb-1">
                Tài Khoản Ngân Hàng
              </h2>
              <p className="text-sm font-medium text-[#64748B] mb-8 border-b border-[#F1F5F9] pb-4">
                Dùng để nhận hoàn tiền hoặc thanh toán
              </p>
              <BankAccountSection
                linkedBank={linkedBank}
                banks={banks}
                bankForm={bankForm}
                onBankFormChange={(patch) =>
                  setBankForm((prev) => ({ ...prev, ...patch }))
                }
                onSubmit={handleSaveBank}
                onDelete={handleDeleteBank}
                onShowQR={setQrBank}
                saving={savingBank}
              />
            </div>
          )}

          {activeTab === "shop-theo-doi" && (
            <div>
              <h2 className="text-xl font-bold text-[#0F172A] mb-1">
                Shop Đã Theo Dõi
              </h2>
              <p className="text-sm font-medium text-[#64748B] mb-8 border-b border-[#F1F5F9] pb-4">
                Danh sách các gian hàng bạn đang quan tâm
              </p>

              {loadingShops ? (
                <div className="text-center py-10 text-[#64748B] font-medium">
                  Đang tải danh sách...
                </div>
              ) : followedShops.length === 0 ? (
                <div className="text-center py-10 text-[#64748B] font-medium border border-dashed border-[#E2E8F0] rounded-2xl">
                  Bạn chưa theo dõi shop nào.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {followedShops.map((shop) => (
                    <div
                      key={shop.gh_ma}
                      className="border border-[#E2E8F0] rounded-2xl p-4 flex gap-4 items-center hover:shadow-md transition-shadow bg-white"
                    >
                      <img
                        src={toAssetUrl(shop.gh_hinhanh)}
                        className="w-16 h-16 rounded-full object-cover border-2 border-[#F1F5F9]"
                        alt={shop.gh_ten}
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-[#0F172A] truncate">
                          {shop.gh_ten}
                        </h3>
                        <p className="text-xs text-[#64748B] mt-1 flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">
                            group
                          </span>{" "}
                          {shop.gh_theodoi} người theo dõi
                        </p>
                        <button
                          onClick={() => handleUnfollowShop(shop.gh_ma)}
                          className="text-xs text-[#DC2626] font-bold mt-2 hover:underline"
                        >
                          Bỏ theo dõi
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "doi-mat-khau" && (
            <div>
              <h2 className="text-xl font-bold text-[#0F172A] mb-1">
                Đổi Mật Khẩu
              </h2>
              <p className="text-sm font-medium text-[#64748B] mb-8 border-b border-[#F1F5F9] pb-4">
                Để bảo mật tài khoản, vui lòng không chia sẻ mật khẩu cho người
                khác
              </p>
              <div className="max-w-md bg-[#F8FAFC] p-6 rounded-2xl border border-[#E2E8F0]">
                <ChangePasswordForm
                  onSubmit={handleChangePassword}
                  onNotify={showToast}
                />
              </div>
            </div>
          )}
        </div>
      </div>
      {qrBank && <BankQRModal bank={qrBank} onClose={() => setQrBank(null)} />}
      <ToastNotification toast={toast} />
    </div>
  );
};

export default ThongTinCaNhan;
