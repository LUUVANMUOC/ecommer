import { useState, useEffect } from "react";
import kienNghiService from "../../services/san/kienNghiService";
import ToastNotification from "../../components/common/Crud/ToastNotification";

const KienNghiAdmin = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyModal, setReplyModal] = useState({
    isOpen: false,
    id: null,
    text: "",
  });
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
    try {
      const res = await kienNghiService.getAllForSan();
      setData(res.data);
    } catch (error) {
      showToast("Lỗi tải dữ liệu", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleReply = async () => {
    if (!replyModal.text.trim())
      return showToast("Vui lòng nhập phản hồi", "error");
    try {
      await kienNghiService.reply(replyModal.id, replyModal.text);
      showToast("Đã gửi phản hồi!");
      setReplyModal({ isOpen: false, id: null, text: "" });
      fetchData();
    } catch (error) {
      showToast("Lỗi khi gửi", "error");
    }
  };

  return (
    <div className="w-full space-y-6 p-6">
      <div className="bg-white p-6 rounded-2xl border border-[#E2DED3] shadow-sm">
        <h2 className="text-xl font-bold text-[#14201C] mb-4">
          Quản lý Kiến nghị Gian hàng
        </h2>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b-2 border-gray-200 text-gray-500 text-sm">
              <th className="py-3 px-2">Mã KN</th>
              <th className="py-3 px-2">Gian hàng</th>
              <th className="py-3 px-2">Nội dung</th>
              <th className="py-3 px-2">Ngày gửi</th>
              <th className="py-3 px-2">Trạng thái</th>
              <th className="py-3 px-2">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" className="text-center py-4">
                  Đang tải...
                </td>
              </tr>
            ) : (
              data.map((item) => (
                <tr
                  key={item.ghkn_ma}
                  className="border-b border-gray-100 hover:bg-gray-50"
                >
                  <td className="py-3 px-2 font-mono text-sm">
                    {item.ghkn_ma}
                  </td>
                  <td className="py-3 px-2 font-semibold text-blue-600">
                    {item.gh_ten}
                  </td>
                  <td className="py-3 px-2">{item.ghkn_noidungkiennghi}</td>
                  <td className="py-3 px-2 text-sm">
                    {new Date(item.ghkn_thoidiemtao).toLocaleString("vi-VN")}
                  </td>
                  <td className="py-3 px-2">
                    {item.ghkn_noidungphanhoi ? (
                      <span className="text-green-600 font-semibold text-xs">
                        Đã phản hồi
                      </span>
                    ) : (
                      <span className="text-orange-500 font-semibold text-xs">
                        Chờ xử lý
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-2">
                    <button
                      onClick={() =>
                        setReplyModal({
                          isOpen: true,
                          id: item.ghkn_ma,
                          text: item.ghkn_noidungphanhoi || "",
                        })
                      }
                      className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-sm"
                    >
                      {item.ghkn_noidungphanhoi ? "Xem/Sửa" : "Phản hồi"}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Phản hồi */}
      {replyModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white w-full max-w-md p-6 rounded-xl shadow-lg">
            <h3 className="font-bold text-lg mb-4 text-[#14201C]">
              Phản hồi kiến nghị {replyModal.id}
            </h3>
            <textarea
              rows="4"
              className="w-full border border-gray-300 rounded-lg p-3 mb-4 focus:ring-2 focus:ring-blue-500"
              value={replyModal.text}
              onChange={(e) =>
                setReplyModal({ ...replyModal, text: e.target.value })
              }
              placeholder="Nhập nội dung phản hồi..."
            ></textarea>
            <div className="flex justify-end gap-2">
              <button
                onClick={() =>
                  setReplyModal({ isOpen: false, id: null, text: "" })
                }
                className="px-4 py-2 bg-gray-200 rounded-lg"
              >
                Hủy
              </button>
              <button
                onClick={handleReply}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg"
              >
                Gửi phản hồi
              </button>
            </div>
          </div>
        </div>
      )}

      <ToastNotification toast={toast} />
    </div>
  );
};
export default KienNghiAdmin;
