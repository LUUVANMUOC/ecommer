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
};

// Thông báo tự tắt sau 3 giây, timer được dọn khi unmount
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

// Logic tài khoản nhận tiền của cửa hàng
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
      });
    }
  }, [ownerId]);

  const saveBank = async (e) => {
    e.preventDefault();
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
      });
      notify("Lưu tài khoản nhận tiền thành công!");

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

  // 🟢 BỔ SUNG: Hàm kết hợp thông tin để đảm bảo QR có đủ Tên Ngân Hàng
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

  // 1. Tải dữ liệu ban đầu
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

  // 2. Lưu thay đổi hồ sơ
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

  // 3. Đổi mật khẩu — trả về true nếu thành công để form tự reset
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
          linkedBank={enrichedLinkedBank} // 🟢 Truyền data đã làm giàu
          banks={banks}
          bankForm={bankForm}
          onBankFormChange={updateBankForm}
          onSubmit={saveBank}
          onDelete={deleteBank}
          onShowQR={setQrBank}
          saving={savingBank}
        />
      </AccountSection>

      {/* 🟢 Đảm bảo QR Modal nhận được bank đã làm giàu */}
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
