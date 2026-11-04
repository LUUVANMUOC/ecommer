import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../../contexts/AuthContext";
import kienNghiService from "../../services/san/kienNghiService";
import ToastNotification from "../../components/common/Crud/ToastNotification";

const KienNghiShop = () => {
  const { user } = useContext(AuthContext);
  const gh_ma = user?.GH_Ma;
  const stmdt_ma = "ST00000001"; // Bạn có thể lấy từ context nếu có

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [noiDung, setNoiDung] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast((p) => ({ ...p, show: false })), 3000);
  };

  const fetchData = async () => {
    if (!gh_ma) return;
    try {
      const res = await kienNghiService.getByShop(gh_ma);
      setData(res.data);
    } catch (error) {
      showToast("Lỗi tải dữ liệu", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [gh_ma]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!noiDung.trim())
      return showToast("Vui lòng nhập nội dung kiến nghị", "error");
    setSubmitting(true);
    try {
      await kienNghiService.create({
        gh_ma,
        stmdt_ma,
        ghkn_noidungkiennghi: noiDung,
      });
      showToast("Gửi kiến nghị thành công!");
      setNoiDung("");
      fetchData();
    } catch (error) {
      showToast("Có lỗi xảy ra", "error");
    } finally {
      setLoading(false);
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full space-y-6 p-6">
      <div className="bg-white p-6 rounded-2xl border border-[#E2DED3] shadow-sm">
        <h2 className="text-xl font-bold text-[#14201C] mb-4">
          Gửi Kiến Nghị / Khiếu Nại
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <textarea
            rows="3"
            value={noiDung}
            onChange={(e) => setNoiDung(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-[#D9D4C7] focus:border-[#F2A93B] focus:outline-none"
            placeholder="Nhập nội dung bạn muốn phản hồi đến Sàn..."
          />
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 bg-[#F2A93B] text-white font-bold rounded-lg hover:bg-[#e09b32]"
          >
            {submitting ? "Đang gửi..." : "Gửi Kiến Nghị"}
          </button>
        </form>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-[#E2DED3] shadow-sm">
        <h2 className="text-xl font-bold text-[#14201C] mb-4">
          Lịch sử Kiến nghị
        </h2>
        <div className="space-y-4">
          {loading ? (
            <p>Đang tải...</p>
          ) : data.length === 0 ? (
            <p>Chưa có kiến nghị nào.</p>
          ) : (
            data.map((item) => (
              <div
                key={item.ghkn_ma}
                className="border border-[#EFEBE2] rounded-xl p-4 bg-[#FBFAF7]"
              >
                <div className="flex justify-between mb-2">
                  <span className="font-semibold text-[#8A5A0B]">
                    Mã: {item.ghkn_ma}
                  </span>
                  <span className="text-sm text-gray-500">
                    {new Date(item.ghkn_thoidiemtao).toLocaleString("vi-VN")}
                  </span>
                </div>
                <p className="text-[#3D4A44] mb-3">
                  {item.ghkn_noidungkiennghi}
                </p>

                {item.ghkn_noidungphanhoi ? (
                  <div className="ml-4 pl-4 border-l-2 border-[#F2A93B] bg-white p-3 rounded-r-lg">
                    <p className="text-sm font-semibold text-[#14201C] mb-1">
                      Phản hồi từ Sàn:
                    </p>
                    <p className="text-gray-700">{item.ghkn_noidungphanhoi}</p>
                  </div>
                ) : (
                  <span className="inline-block px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-bold rounded">
                    Chờ phản hồi
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      </div>
      <ToastNotification toast={toast} />
    </div>
  );
};
export default KienNghiShop;
