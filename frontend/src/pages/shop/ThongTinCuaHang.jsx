// src/pages/shop/ThongTinCuaHang.jsx
import {
  useState,
  useEffect,
  useContext,
  useCallback,
  useRef,
  useMemo,
} from "react";
import { AuthContext } from "../../contexts/AuthContext";
import axiosClient from "../../config/axiosClient";
import addressService from "../../services/san/addressService";
import ToastNotification from "../../components/common/Crud/ToastNotification";
import {
  AccountHeader,
  AccountSection,
  AccountProfileCard,
  AccountLoading,
} from "../../components/account/AccountLayout";
import {
  ChangePasswordForm,
  ProfileInfoForm,
} from "../../components/account/AccountForms";
import {
  BankAccountSection,
  BankQRModal,
} from "../../components/account/BankAccount";
import { toAssetUrl, removeVietnameseTones } from "../../utils/accountUtils";

const INITIAL_PROFILE = {
  gh_ten: "",
  gh_email: "",
  gh_mota: "",
  gh_danhgia: 0,
  gh_theodoi: 0,
  dc_mota: "",
};

const EMPTY_BANK_FORM = {
  nh_ma: "",
  ttnt_gianhang_tentaikhoan: "",
  ttnt_gianhang_sotaikhoan: "",
  sepay_webhook_secret: "",
};

const useToast = (duration = 3000) => {
  const HIDDEN = { show: false, message: "", type: "success" };
  const [toast, setToast] = useState(HIDDEN);
  const timerRef = useRef(null);

  const showToast = useCallback(
    (message, type = "success") => {
      clearTimeout(timerRef.current);
      setToast({ show: true, message, type });
      timerRef.current = setTimeout(() => setToast(HIDDEN), duration);
    },
    [duration],
  );

  useEffect(() => () => clearTimeout(timerRef.current), []);

  return { toast, showToast };
};

const useBankAccount = (ownerId, notify) => {
  const [banks, setBanks] = useState([]);
  const [linkedBank, setLinkedBank] = useState(null);
  const [bankForm, setBankForm] = useState(EMPTY_BANK_FORM);
  const [savingBank, setSavingBank] = useState(false);

  const updateBankForm = useCallback(
    (patch) => setBankForm((prev) => ({ ...prev, ...patch })),
    [],
  );

  const loadBankAccount = useCallback(async () => {
    const [resBanks, resLinked] = await Promise.all([
      axiosClient.get("/ngan-hang"),
      axiosClient.get(`/thong-tin-nhan-tien/${ownerId}`),
    ]);

    setBanks(resBanks.data);

    if (resLinked.data) {
      setLinkedBank(resLinked.data);
      setBankForm({
        nh_ma: resLinked.data.nh_ma || resLinked.data.nganhang_ma,
        ttnt_gianhang_tentaikhoan:
          resLinked.data.ttnt_gianhang_tentaikhoan || "",
        ttnt_gianhang_sotaikhoan: resLinked.data.ttnt_gianhang_sotaikhoan,
        sepay_webhook_secret: resLinked.data.sepay_webhook_secret || "",
      });
    }
  }, [ownerId]);

  // 🟢 Sửa lại hàm saveBank để có thể gọi từ bất kỳ đâu (truyền e hoặc không)
  const saveBank = async (e) => {
    if (e && e.preventDefault) e.preventDefault();

    if (!bankForm.nh_ma) return notify("Vui lòng chọn ngân hàng", "error");
    if (!bankForm.ttnt_gianhang_tentaikhoan)
      return notify("Vui lòng nhập tên chủ tài khoản", "error");
    if (!bankForm.ttnt_gianhang_sotaikhoan)
      return notify("Vui lòng nhập số tài khoản", "error");

    setSavingBank(true);
    try {
      await axiosClient.post("/thong-tin-nhan-tien", {
        gh_ma: ownerId,
        nh_ma: bankForm.nh_ma,
        ttnt_gianhang_tentaikhoan: removeVietnameseTones(
          bankForm.ttnt_gianhang_tentaikhoan,
        ),
        ttnt_gianhang_sotaikhoan: bankForm.ttnt_gianhang_sotaikhoan,
        sepay_webhook_secret: bankForm.sepay_webhook_secret,
      });
      notify("Lưu cấu hình nhận tiền thành công!");

      const res = await axiosClient.get(`/thong-tin-nhan-tien/${ownerId}`);
      setLinkedBank(res.data);
    } catch (err) {
      notify(err.response?.data?.message || "Lỗi khi lưu tài khoản", "error");
    } finally {
      setSavingBank(false);
    }
  };

  const deleteBank = async () => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa tài khoản nhận tiền này?"))
      return;

    try {
      await axiosClient.delete(`/thong-tin-nhan-tien/${ownerId}`);
      notify("Đã xóa tài khoản nhận tiền");
      setLinkedBank(null);
      setBankForm({ ...EMPTY_BANK_FORM });
    } catch (err) {
      notify("Lỗi khi xóa tài khoản", "error");
    }
  };

  return {
    banks,
    linkedBank,
    bankForm,
    updateBankForm,
    savingBank,
    loadBankAccount,
    saveBank,
    deleteBank,
  };
};

const ThongTinCuaHang = () => {
  const { user } = useContext(AuthContext);
  const ownerId = user?.GH_Ma;

  const { toast, showToast } = useToast();
  const {
    banks,
    linkedBank,
    bankForm,
    updateBankForm,
    savingBank,
    loadBankAccount,
    saveBank,
    deleteBank,
  } = useBankAccount(ownerId, showToast);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState(INITIAL_PROFILE);

  const [tinhs, setTinhs] = useState([]);
  const [xas, setXas] = useState([]);
  const [selectedTinh, setSelectedTinh] = useState("");
  const [selectedXa, setSelectedXa] = useState("");

  const [currentImage, setCurrentImage] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [qrBank, setQrBank] = useState(null);

  const enrichedLinkedBank = useMemo(() => {
    if (!linkedBank) return null;
    const bankInfo = banks.find(
      (b) =>
        b.nhg_ma === (linkedBank.nh_ma || linkedBank.nganhang_ma) ||
        b.nhg_ma === linkedBank.nhg_ma,
    );
    return {
      ...linkedBank,
      nganhang_ma: linkedBank.nganhang_ma || bankInfo?.nhg_ma,
      nganhang_ten: linkedBank.nganhang_ten || bankInfo?.nhg_ten,
    };
  }, [linkedBank, banks]);

  const fetchAllData = useCallback(async () => {
    if (!ownerId) {
      setLoading(false);
      return;
    }

    try {
      const [resTinh, resXa, resProfile] = await Promise.all([
        addressService.getAllTinh(),
        addressService.getAllXa(),
        axiosClient.get(`/nguoi-ban/auth/profile/${ownerId}`),
        loadBankAccount(),
      ]);

      setTinhs(
        resTinh.data.map((t) => ({
          ma: t.tinh_ma || t.th_ma,
          ten: t.tinh_ten || t.th_ten,
        })),
      );
      setXas(
        resXa.data.map((x) => ({
          ma: x.xa_ma || x.XA_Ma,
          ten: x.xa_ten || x.XA_Ten,
          tinh_ma: x.tinh_ma || x.th_ma || x.Tinh_Ma,
        })),
      );

      const data = resProfile.data;
      setFormData({
        gh_ten: data.gh_ten || "",
        gh_email: data.gh_email || "",
        gh_mota: data.gh_mota || "",
        gh_danhgia: data.gh_danhgia || 0,
        gh_theodoi: data.gh_theodoi || 0,
        dc_mota: data.dc_mota || "",
      });
      setSelectedTinh(data.tinh_ma || data.th_ma || "");
      setSelectedXa(data.xa_ma || "");
      setCurrentImage(toAssetUrl(data.gh_hinhanh));
    } catch (err) {
      console.error(err);
      showToast("Không thể tải thông tin cửa hàng", "error");
    } finally {
      setLoading(false);
    }
  }, [ownerId, loadBankAccount, showToast]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleTinhChange = (maTinh) => {
    setSelectedTinh(maTinh);
    setSelectedXa("");
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTinh)
      return showToast("Vui lòng chọn Tỉnh/Thành phố", "error");
    if (!selectedXa) return showToast("Vui lòng chọn Phường/Xã", "error");

    setSaving(true);
    try {
      const dataToSend = new FormData();
      dataToSend.append("gh_ten", formData.gh_ten);
      dataToSend.append("gh_mota", formData.gh_mota);
      dataToSend.append("dc_mota", formData.dc_mota);
      dataToSend.append("xa_ma", selectedXa);
      if (selectedFile) dataToSend.append("hinhanh", selectedFile);

      await axiosClient.put(`/nguoi-ban/auth/profile/${ownerId}`, dataToSend, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      showToast("Cập nhật thông tin thành công!");
      if (selectedFile) {
        setCurrentImage(URL.createObjectURL(selectedFile));
        setSelectedFile(null);
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Lỗi khi cập nhật", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async ({ oldPassword, newPassword }) => {
    try {
      await axiosClient.put("/nguoi-ban/auth/change-password", {
        gh_ma: ownerId,
        oldPassword,
        newPassword,
      });
      showToast("Đổi mật khẩu thành công!");
      return true;
    } catch (err) {
      showToast(err.response?.data?.message || "Lỗi khi đổi mật khẩu", "error");
      return false;
    }
  };

  const handleCopyWebhook = () => {
    const webhookUrl = `${import.meta.env.VITE_BACKEND_URL || "http://localhost:8080"}/api/webhook/sepay/${ownerId}`;
    navigator.clipboard.writeText(webhookUrl);
    showToast("Đã copy Link Webhook!");
  };

  if (loading) return <AccountLoading />;

  return (
    <div className="space-y-8 pb-16">
      <AccountHeader
        title="Hồ sơ cửa hàng"
        subtitle="Quản lý thông tin công khai và tài khoản nhận tiền của bạn."
      />

      <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <AccountProfileCard
          avatarUrl={currentImage}
          name={formData.gh_ten}
          email={formData.gh_email}
          fallbackIcon="storefront"
          stats={[
            { value: formData.gh_danhgia, label: "Đánh giá", icon: "star" },
            { value: formData.gh_theodoi, label: "Theo dõi" },
          ]}
        >
          <ChangePasswordForm
            onSubmit={handleChangePassword}
            onNotify={showToast}
          />
        </AccountProfileCard>

        <AccountSection
          title="Thông tin cửa hàng"
          description="Thông tin hiển thị công khai với khách hàng."
          icon="storefront"
        >
          <ProfileInfoForm
            values={formData}
            onChange={handleProfileChange}
            addressProps={{
              tinhs,
              xas,
              selectedTinh,
              selectedXa,
              onTinhChange: handleTinhChange,
              onXaChange: setSelectedXa,
            }}
            logoUrl={currentImage}
            onLogoSelect={setSelectedFile}
            onSubmit={handleProfileSubmit}
            saving={saving}
          />
        </AccountSection>
      </div>

      <AccountSection
        title="Tài khoản nhận tiền"
        description="Tài khoản dùng để nhận thanh toán từ đơn hàng."
        icon="account_balance"
      >
        <BankAccountSection
          linkedBank={enrichedLinkedBank}
          banks={banks}
          bankForm={bankForm}
          onBankFormChange={updateBankForm}
          onSubmit={saveBank}
          onDelete={deleteBank}
          onShowQR={setQrBank}
          saving={savingBank}
        />

        {/* 🟢 KHU VỰC CẤU HÌNH SEPAY DÀNH CHO SHOP (GỘP CHUNG NÚT LƯU) */}
        <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-2xl">
          <h3 className="text-lg font-bold text-blue-900 mb-2 flex items-center gap-2">
            <span className="material-symbols-outlined">webhook</span>
            Cấu hình tự động nhận tiền (SePay)
          </h3>
          <p className="text-sm text-blue-700 mb-4">
            Để hệ thống tự động cập nhật khi Kho chuyển tiền, bạn cần cấu hình
            Webhook trên trang SePay của bạn.
          </p>

          <div className="flex flex-col md:flex-row items-center gap-3 mb-5">
            <div className="w-full">
              <label className="block text-sm font-semibold text-blue-900 mb-1">
                1. Đường link Webhook của bạn
              </label>
              <input
                type="text"
                readOnly
                value={`${import.meta.env.VITE_BACKEND_URL || "http://localhost:8080"}/api/webhook/sepay/${ownerId}`}
                className="w-full px-4 py-3 rounded-xl border border-blue-300 bg-white text-blue-800 font-mono text-sm outline-none"
              />
            </div>
            <button
              onClick={handleCopyWebhook}
              type="button"
              className="mt-6 md:mt-0 px-4 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 whitespace-nowrap"
            >
              Copy Link
            </button>
          </div>

          <div>
            <label className="block text-sm font-semibold text-blue-900 mb-1">
              2. Mã bảo mật (Webhook Secret)
            </label>
            <input
              type="text"
              value={bankForm.sepay_webhook_secret || ""}
              onChange={(e) =>
                updateBankForm({ sepay_webhook_secret: e.target.value })
              }
              placeholder="Dán mã Secret lấy từ SePay vào đây..."
              className="w-full px-4 py-3 rounded-xl border border-blue-300 outline-none focus:border-blue-500"
            />
            <p className="text-xs text-blue-600 mt-2">
              * Mã này giúp chống kẻ gian spam tín hiệu thanh toán ảo.
            </p>
          </div>

          {/* 🟢 THÊM NÚT LƯU TOÀN BỘ THÔNG TIN Ở ĐÂY */}
          <div className="mt-6 pt-4 border-t border-blue-200 flex justify-end">
            <button
              type="button"
              onClick={saveBank}
              disabled={savingBank}
              className="px-6 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 disabled:bg-gray-400 flex items-center gap-2 shadow-md transition-all"
            >
              <span className="material-symbols-outlined">save</span>
              {savingBank ? "Đang lưu..." : "Lưu toàn bộ thông tin"}
            </button>
          </div>
        </div>
      </AccountSection>

      {qrBank && (
        <BankQRModal
          bank={enrichedLinkedBank}
          onClose={() => setQrBank(null)}
        />
      )}

      <ToastNotification toast={toast} />
    </div>
  );
};

export default ThongTinCuaHang;
