import { useState, useEffect, useContext, useCallback } from "react";
import { AuthContext } from "../../contexts/AuthContext";
import axiosClient from "../../config/axiosClient";
import dvvcProfileService from "../../services/dvvc/dvvcProfileService";
import ToastNotification from "../../components/common/Crud/ToastNotification";
import { ChangePasswordForm } from "../../components/account/AccountForms";
import {
  BankAccountSection,
  BankQRModal,
} from "../../components/account/BankAccount";
import { toAssetUrl } from "../../utils/accountUtils";

const EMPTY_BANK_FORM = {
  NganHang_Ma: "",
  TTNT_DVVC_SoTaiKhoan: "",
  TTNT_DVVC_TenTaiKhoan: "",
};

const ThongTinDVVC = () => {
  const { user } = useContext(AuthContext);
  const DVVC_Ma = user?.DVVC_Ma || user?.dvvc_ma || user?.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });
  const [activeTab, setActiveTab] = useState("ho-so");

  // State Profile
  const [profileData, setProfileData] = useState({
    DVVC_Ten: "",
    DVVC_Email: "",
    DVVC_MoTa: "",
    DVVC_HinhAnh: "",
  });
  const [selectedFile, setSelectedFile] = useState(null);

  // State Ngân hàng
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
    if (!DVVC_Ma) {
      setLoading(false);
      console.error("LỖI: Không tìm thấy DVVC_Ma trong AuthContext!");
      return;
    }
    try {
      const [resBanks, resProfile] = await Promise.all([
        axiosClient.get("/ngan-hang"),
        dvvcProfileService.getProfile(DVVC_Ma),
      ]);
      setBanks(resBanks.data);
      const data = resProfile.data;

      setProfileData({
        DVVC_Ten: data.DVVC_Ten || "",
        DVVC_Email: data.DVVC_Email || "",
        DVVC_MoTa: data.DVVC_MoTa || "",
        DVVC_HinhAnh: data.DVVC_HinhAnh || "",
      });

      if (data.NganHang_Ma) {
        setLinkedBank({
          NganHang_Ma: data.NganHang_Ma,
          NHG_Ten: data.NHG_Ten,
          NHG_Logo: data.NHG_Logo,
          TTNT_DVVC_SoTaiKhoan: data.TTNT_DVVC_SoTaiKhoan,
          TTNT_DVVC_TenTaiKhoan: data.TTNT_DVVC_TenTaiKhoan,
        });
        setBankForm({
          NganHang_Ma: data.NganHang_Ma,
          TTNT_DVVC_SoTaiKhoan: data.TTNT_DVVC_SoTaiKhoan,
          TTNT_DVVC_TenTaiKhoan: data.TTNT_DVVC_TenTaiKhoan || "",
        });
      }
    } catch (err) {
      showToast("Lỗi tải dữ liệu ĐVVC", "error");
    } finally {
      setLoading(false);
    }
  }, [DVVC_Ma]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("DVVC_Ten", profileData.DVVC_Ten);
      fd.append("DVVC_MoTa", profileData.DVVC_MoTa);
      if (selectedFile) fd.append("hinhanh", selectedFile);

      await dvvcProfileService.updateProfile(DVVC_Ma, fd);
      showToast("Cập nhật thông tin thành công!");
      if (selectedFile) {
        setProfileData({
          ...profileData,
          DVVC_HinhAnh: URL.createObjectURL(selectedFile),
        });
        setSelectedFile(null);
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Lỗi cập nhật", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async ({ oldPassword, newPassword }) => {
    try {
      await dvvcProfileService.changePassword({
        DVVC_Ma,
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
      !bankForm.TTNT_DVVC_SoTaiKhoan ||
      !bankForm.TTNT_DVVC_TenTaiKhoan
    )
      return showToast("Vui lòng nhập đủ thông tin!", "error");

    setSavingBank(true);
    try {
      await dvvcProfileService.saveBank(DVVC_Ma, bankForm);
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
      await dvvcProfileService.deleteBank(DVVC_Ma);
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
    { id: "ho-so", icon: "local_shipping", label: "Hồ Sơ ĐVVC" },
    { id: "ngan-hang", icon: "account_balance", label: "Tài Khoản Nhận Tiền" },
    { id: "doi-mat-khau", icon: "lock", label: "Đổi Mật Khẩu" },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-16 font-sans">
      {/* ✅ ĐÃ SỬA: Bỏ sticky top-0 z-20, thay bằng relative để không bị đè bởi Header tổng */}
      <header className="bg-white shadow-sm mb-6 relative">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <a
            href="/"
            className="text-2xl font-bold text-[#2563EB] flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-3xl">
              local_shipping
            </span>
            Đối Tác Vận Chuyển
          </a>
          <div className="text-sm font-semibold text-[#0F172A]">
            {profileData.DVVC_Ten}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-[280px_1fr] gap-6">
        <div className="bg-white rounded-3xl shadow-sm border border-[#E2E8F0] flex flex-col overflow-hidden self-start">
          <div className="p-6 flex items-center gap-4 border-b border-[#F1F5F9] bg-[#F8FAFC]">
            <div className="w-14 h-14 rounded-full border-2 border-blue-200 overflow-hidden bg-white p-0.5">
              <img
                src={toAssetUrl(profileData.DVVC_HinhAnh)}
                className="w-full h-full object-cover rounded-full"
              />
            </div>
            <div>
              <p className="font-bold text-[#0F172A] line-clamp-1">
                {profileData.DVVC_Ten}
              </p>
              <p className="text-xs font-medium text-[#64748B] mt-1">
                Tài khoản ĐVVC
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
                Hồ Sơ Đơn Vị Vận Chuyển
              </h2>
              <p className="text-sm font-medium text-[#64748B] mb-8 border-b border-[#F1F5F9] pb-4">
                Quản lý thông tin cơ bản của ĐVVC
              </p>

              <form
                onSubmit={handleProfileSubmit}
                className="flex flex-col md:flex-row gap-10"
              >
                <div className="flex-1 space-y-5 max-w-md">
                  <div className="flex items-center">
                    <label className="w-32 text-sm font-semibold text-[#64748B] text-right pr-6">
                      Email đăng nhập
                    </label>
                    <span className="text-sm font-bold text-[#0F172A]">
                      {profileData.DVVC_Email}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <label className="w-32 text-sm font-semibold text-[#64748B] text-right pr-6">
                      Tên ĐVVC
                    </label>
                    <input
                      type="text"
                      required
                      value={profileData.DVVC_Ten}
                      onChange={(e) =>
                        setProfileData({
                          ...profileData,
                          DVVC_Ten: e.target.value,
                        })
                      }
                      className="flex-1 px-4 py-2.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] text-sm text-[#0F172A] outline-none focus:border-[#2563EB]"
                    />
                  </div>
                  <div className="flex items-start">
                    <label className="w-32 text-sm font-semibold text-[#64748B] text-right pr-6 pt-3">
                      Mô tả
                    </label>
                    <textarea
                      rows={4}
                      value={profileData.DVVC_MoTa}
                      onChange={(e) =>
                        setProfileData({
                          ...profileData,
                          DVVC_MoTa: e.target.value,
                        })
                      }
                      className="flex-1 px-4 py-2.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] text-sm text-[#0F172A] outline-none focus:border-[#2563EB] resize-y"
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
                </div>
                <div className="flex flex-col items-center border-l border-[#F1F5F9] pl-10 gap-4">
                  <img
                    src={toAssetUrl(profileData.DVVC_HinhAnh)}
                    className="w-28 h-28 rounded-full border-4 border-[#F8FAFC] shadow-sm object-cover"
                  />
                  <label className="cursor-pointer border border-[#E2E8F0] px-5 py-2.5 text-sm font-semibold text-[#334155] bg-white hover:bg-[#F8FAFC] rounded-xl shadow-sm transition-colors">
                    Chọn Logo Mới
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => setSelectedFile(e.target.files[0])}
                    />
                  </label>
                </div>
              </form>
            </div>
          )}

          {activeTab === "ngan-hang" && (
            <div>
              <h2 className="text-xl font-bold text-[#0F172A] mb-1">
                Tài Khoản Nhận Tiền
              </h2>
              <p className="text-sm font-medium text-[#64748B] mb-8 border-b border-[#F1F5F9] pb-4">
                Dùng để nhận thanh toán phí vận chuyển từ Sàn
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
                Để bảo mật tài khoản, vui lòng không chia sẻ mật khẩu
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

export default ThongTinDVVC;
