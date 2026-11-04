// src/pages/admin/ThongTinSan.jsx
import { useState, useEffect, useContext, useCallback } from "react";
import { AuthContext } from "../../contexts/AuthContext";
import axiosClient from "../../config/axiosClient";
import sanThuongMaiService from "../../services/san/sanThuongMaiService";
import ToastNotification from "../../components/common/Crud/ToastNotification";
import { ChangePasswordForm } from "../../components/account/AccountForms";
import {
  BankAccountSection,
  BankQRModal,
} from "../../components/account/BankAccount";

const EMPTY_BANK_FORM = {
  NganHang_Ma: "",
  TTNT_STMDT_SoTaiKhoan: "",
  TTNT_STMDT_TenTaiKhoan: "",
};

const ThongTinSan = () => {
  const { user } = useContext(AuthContext);

  // Lấy đúng key STMDT_Ma từ AuthContext (đã đồng bộ với Backend)
  const STMDT_Ma = user?.STMDT_Ma || user?.stmdt_ma || user?.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });
  const [activeTab, setActiveTab] = useState("ho-so");

  // State Profile (Dùng chữ viết hoa)
  const [profileData, setProfileData] = useState({
    STMDT_Ten: "",
    STMDT_Email: "",
    STMDT_SDT: "",
  });

  // State Ngân hàng (Dùng chữ viết hoa)
  const [banks, setBanks] = useState([]);
  const [linkedBank, setLinkedBank] = useState(null);
  const [bankForm, setBankForm] = useState(EMPTY_BANK_FORM);
  const [savingBank, setSavingBank] = useState(false);
  const [qrBank, setQrBank] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(
      () => setToast({ show: false, message: "", type: "success" }),
      3000,
    );
  };

  const fetchData = useCallback(async () => {
    // SỬA LỖI KẸT TRANG: Nếu không có mã sàn, tắt loading ngay
    if (!STMDT_Ma) {
      setLoading(false);
      console.error("LỖI: Không tìm thấy STMDT_Ma trong AuthContext!");
      return;
    }

    try {
      const [resBanks, resProfile] = await Promise.all([
        axiosClient.get("/ngan-hang"),
        sanThuongMaiService.getProfile(STMDT_Ma),
      ]);
      setBanks(resBanks.data);
      const data = resProfile.data;

      setProfileData({
        STMDT_Ten: data.STMDT_Ten || "",
        STMDT_Email: data.STMDT_Email || "",
        STMDT_SDT: data.STMDT_SDT || "",
      });

      if (data.NganHang_Ma) {
        setLinkedBank({
          NganHang_Ma: data.NganHang_Ma,
          NHG_Ten: data.NHG_Ten,
          NHG_Logo: data.NHG_Logo,
          TTNT_STMDT_SoTaiKhoan: data.TTNT_STMDT_SoTaiKhoan,
          TTNT_STMDT_TenTaiKhoan: data.TTNT_STMDT_TenTaiKhoan,
        });
        setBankForm({
          NganHang_Ma: data.NganHang_Ma,
          TTNT_STMDT_SoTaiKhoan: data.TTNT_STMDT_SoTaiKhoan,
          TTNT_STMDT_TenTaiKhoan: data.TTNT_STMDT_TenTaiKhoan || "",
        });
      }
    } catch (err) {
      showToast("Lỗi tải dữ liệu sàn", "error");
    } finally {
      setLoading(false);
    }
  }, [STMDT_Ma]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await sanThuongMaiService.updateProfile(STMDT_Ma, {
        STMDT_Ten: profileData.STMDT_Ten,
        STMDT_SDT: profileData.STMDT_SDT,
      });
      showToast("Cập nhật thông tin sàn thành công!");
    } catch (err) {
      showToast(err.response?.data?.message || "Lỗi cập nhật", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async ({ oldPassword, newPassword }) => {
    try {
      await sanThuongMaiService.changePassword({
        STMDT_Ma,
        oldPassword,
        newPassword,
      });
      showToast("Đổi mật khẩu thành công!");
      return true;
    } catch (err) {
      showToast(err.response?.data?.message || "Lỗi đổi mật khẩu", "error");
      return false;
    }
  };

  const handleSaveBank = async (e) => {
    e.preventDefault();
    if (
      !bankForm.NganHang_Ma ||
      !bankForm.TTNT_STMDT_SoTaiKhoan ||
      !bankForm.TTNT_STMDT_TenTaiKhoan
    )
      return showToast("Vui lòng nhập đủ thông tin!", "error");

    setSavingBank(true);
    try {
      await sanThuongMaiService.saveBank(STMDT_Ma, bankForm);
      showToast("Lưu thông tin nhận tiền thành công!");
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.message || "Lỗi!", "error");
    } finally {
      setSavingBank(false);
    }
  };

  const handleDeleteBank = async () => {
    if (!window.confirm("Bạn có chắc muốn xóa tài khoản nhận tiền này?"))
      return;
    try {
      await sanThuongMaiService.deleteBank(STMDT_Ma);
      setLinkedBank(null);
      setBankForm(EMPTY_BANK_FORM);
      showToast("Đã xóa tài khoản!");
    } catch (err) {
      showToast("Lỗi khi xóa!", "error");
    }
  };

  if (loading)
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center text-[#64748B] font-medium">
        Đang tải...
      </div>
    );

  const menuItems = [
    { id: "ho-so", icon: "storefront", label: "Hồ Sơ Sàn" },
    { id: "ngan-hang", icon: "account_balance", label: "Tài Khoản Nhận Tiền" },
    { id: "doi-mat-khau", icon: "lock", label: "Đổi Mật Khẩu" },
  ];

  const avatarLetter = profileData.STMDT_Ten?.charAt(0).toUpperCase() || "S";

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-16 font-sans">
      {/* ... (Phần Header giữ nguyên) ... */}
      <header className="bg-white shadow-sm mb-6 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <a
            href="/"
            className="text-2xl font-bold text-[#2563EB] flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-3xl">
              admin_panel_settings
            </span>
            Quản Trị Sàn
          </a>
          <div className="text-sm font-semibold text-[#0F172A]">
            {profileData.STMDT_Ten}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-[280px_1fr] gap-6">
        {/* SIDEBAR TRÁI */}
        <div className="bg-white rounded-3xl shadow-sm border border-[#E2E8F0] flex flex-col overflow-hidden self-start">
          <div className="p-6 flex items-center gap-4 border-b border-[#F1F5F9] bg-[#F8FAFC]">
            <div className="w-14 h-14 rounded-full bg-[#2563EB] text-white flex items-center justify-center text-xl font-bold shadow-sm">
              {avatarLetter}
            </div>
            <div>
              <p className="font-bold text-[#0F172A] line-clamp-1">
                {profileData.STMDT_Ten}
              </p>
              <p className="text-xs font-medium text-[#64748B] mt-1">
                Tài khoản Quản trị
              </p>
            </div>
          </div>
          <div className="flex flex-col py-3 px-2">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-3 px-4 py-3.5 text-sm rounded-xl mx-1 my-0.5 text-left transition-all ${
                  activeTab === item.id
                    ? "text-[#2563EB] font-bold bg-blue-50"
                    : "text-[#334155] font-medium hover:bg-[#F8FAFC]"
                }`}
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

        {/* NỘI DUNG PHẢI */}
        <div className="bg-white rounded-3xl shadow-sm border border-[#E2E8F0] p-6 lg:p-8">
          {activeTab === "ho-so" && (
            <div>
              <h2 className="text-xl font-bold text-[#0F172A] mb-1">
                Hồ Sơ Sàn Thương Mại Điện Tử
              </h2>
              <p className="text-sm font-medium text-[#64748B] mb-8 border-b border-[#F1F5F9] pb-4">
                Quản lý thông tin cơ bản của sàn
              </p>

              <form
                onSubmit={handleProfileSubmit}
                className="max-w-md space-y-5"
              >
                <div className="flex items-center">
                  <label className="w-32 text-sm font-semibold text-[#64748B] text-right pr-6">
                    Email đăng nhập
                  </label>
                  <span className="text-sm font-bold text-[#0F172A]">
                    {profileData.STMDT_Email}
                  </span>
                </div>
                <div className="flex items-center">
                  <label className="w-32 text-sm font-semibold text-[#64748B] text-right pr-6">
                    Tên Sàn
                  </label>
                  <input
                    type="text"
                    required
                    value={profileData.STMDT_Ten}
                    onChange={(e) =>
                      setProfileData({
                        ...profileData,
                        STMDT_Ten: e.target.value,
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
                    value={profileData.STMDT_SDT}
                    onChange={(e) =>
                      setProfileData({
                        ...profileData,
                        STMDT_SDT: e.target.value,
                      })
                    }
                    className="flex-1 px-4 py-2.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] text-sm text-[#0F172A] outline-none focus:border-[#2563EB] focus:bg-white transition-all"
                  />
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
              </form>
            </div>
          )}

          {activeTab === "ngan-hang" && (
            <div>
              <h2 className="text-xl font-bold text-[#0F172A] mb-1">
                Tài Khoản Nhận Tiền Của Sàn
              </h2>
              <p className="text-sm font-medium text-[#64748B] mb-8 border-b border-[#F1F5F9] pb-4">
                Cấu hình tài khoản ngân hàng để hệ thống đối soát doanh thu và
                thanh toán cho Người bán
              </p>
              <div className="max-w-4xl">
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

export default ThongTinSan;
