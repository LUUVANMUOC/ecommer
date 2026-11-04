import { useState, useEffect, useContext, useCallback } from "react";
import { AuthContext } from "../../contexts/AuthContext";
import vanChuyenShopService from "../../services/gianhang/vanChuyenShopService";
import ToastNotification from "../../components/common/Crud/ToastNotification";
import { toAssetUrl } from "../../utils/accountUtils";

const QuanLyVanChuyen = () => {
  const { user } = useContext(AuthContext);
  // Lấy mã gian hàng từ AuthContext (tùy thuộc vào key bạn lưu lúc login)
  const gh_ma = user?.gh_ma || user?.GH_Ma || user?.id;

  const [allDVVC, setAllDVVC] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });
  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(
      () => setToast({ show: false, message: "", type: "success" }),
      3000,
    );
  };

  const fetchSettings = useCallback(async () => {
    if (!gh_ma) {
      setLoading(false);
      return;
    }
    try {
      const res = await vanChuyenShopService.getSettings(gh_ma);
      setAllDVVC(res.data.allDVVC);
      setSelectedIds(res.data.selectedIds);
    } catch (err) {
      showToast("Lỗi tải cấu hình vận chuyển", "error");
    } finally {
      setLoading(false);
    }
  }, [gh_ma]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleToggleDVVC = (dvvc_ma) => {
    setSelectedIds(
      (prev) =>
        prev.includes(dvvc_ma)
          ? prev.filter((id) => id !== dvvc_ma) // Nếu đã chọn thì bỏ chọn
          : [...prev, dvvc_ma], // Nếu chưa chọn thì thêm vào
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await vanChuyenShopService.updateSettings(gh_ma, selectedIds);
      showToast("Lưu cấu hình thành công!");
    } catch (err) {
      showToast(err.response?.data?.message || "Lỗi khi lưu!", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div className="p-10 text-center font-medium text-gray-500">
        Đang tải...
      </div>
    );

  return (
    <div className="p-6 bg-[#F8FAFC] min-h-screen">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-[#0F172A]">
              Đơn Vị Vận Chuyển
            </h2>
            <p className="text-sm text-[#64748B] mt-1">
              Chọn các đối tác vận chuyển mà gian hàng của bạn muốn hợp tác.
            </p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2.5 bg-[#2563EB] text-white rounded-xl font-bold shadow-sm hover:bg-[#1D4ED8] transition-colors flex items-center gap-2"
          >
            {saving ? (
              <>
                <span className="material-symbols-outlined animate-spin text-[20px]">
                  progress_activity
                </span>{" "}
                Đang lưu...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[20px]">
                  save
                </span>{" "}
                Lưu Thay Đổi
              </>
            )}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {allDVVC.map((dvvc) => {
            const isSelected = selectedIds.includes(dvvc.DVVC_Ma);
            return (
              <div
                key={dvvc.DVVC_Ma}
                onClick={() => handleToggleDVVC(dvvc.DVVC_Ma)}
                className={`relative bg-white rounded-2xl p-5 border-2 cursor-pointer transition-all duration-200 flex flex-col items-center text-center ${
                  isSelected
                    ? "border-[#2563EB] shadow-md bg-blue-50/30"
                    : "border-[#E2E8F0] hover:border-[#2563EB]/50 shadow-sm"
                }`}
              >
                {/* Dấu check góc trên bên phải */}
                <div
                  className={`absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
                    isSelected
                      ? "bg-[#2563EB] text-white"
                      : "border-2 border-[#E2E8F0] text-transparent"
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">
                    check
                  </span>
                </div>

                {/* Logo ĐVVC */}
                <div className="w-20 h-20 rounded-full border border-[#E2E8F0] overflow-hidden bg-white mb-4 p-1">
                  <img
                    src={
                      dvvc.DVVC_HinhAnh
                        ? toAssetUrl(dvvc.DVVC_HinhAnh)
                        : `https://ui-avatars.com/api/?name=${encodeURIComponent(dvvc.DVVC_Ten)}&background=random&color=fff&size=150`
                    }
                    alt={dvvc.DVVC_Ten}
                    className="w-full h-full object-cover rounded-full"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(dvvc.DVVC_Ten)}&background=random&color=fff&size=150`;
                    }}
                  />
                </div>

                <h3 className="font-bold text-[#0F172A] text-lg mb-2">
                  {dvvc.DVVC_Ten}
                </h3>
                <p className="text-sm text-[#64748B] line-clamp-2">
                  {dvvc.DVVC_MoTa ||
                    "Đối tác vận chuyển uy tín, giao hàng nhanh chóng."}
                </p>
              </div>
            );
          })}
        </div>

        {allDVVC.length === 0 && (
          <div className="text-center py-10 text-[#64748B] bg-white rounded-2xl border border-dashed border-[#E2E8F0]">
            Hiện tại hệ thống chưa có Đơn vị vận chuyển nào.
          </div>
        )}
      </div>
      <ToastNotification toast={toast} />
    </div>
  );
};

export default QuanLyVanChuyen;
