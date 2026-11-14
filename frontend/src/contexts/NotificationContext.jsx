// frontend/src/contexts/NotificationContext.jsx
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { AuthContext } from "./AuthContext";
import { SocketContext } from "./SocketContext";
import thongBaoService from "../services/thongbao/thongBaoService";

export const NotificationContext = createContext(null);

const HOP_THU_PATH = {
  SAN: "/admin/thong-bao",
  SHOP: "/nguoi-ban/thong-bao",
  KHACHHANG: "/khach-hang/thong-bao",
  DVVC: "/dvvc/thong-bao",
};

// Xác định người nhận thông báo dựa trên user đang đăng nhập
export const layNguoiNhan = (user) => {
  if (!user) return null;

  if (user.role === "admin") {
    const ma = user.STMDT_Ma || user.stmdt_ma;
    return ma ? { loai: "SAN", ma } : null;
  }

  if (user.role === "shop") {
    const ma = user.GH_Ma || user.gh_ma || user.id;
    return ma ? { loai: "SHOP", ma } : null;
  }

  if (user.role === "khachhang") {
    const ma = user.kh_ma || user.id;
    return ma ? { loai: "KHACHHANG", ma } : null;
  }

  if (user.role === "dvvc") {
    const ma = user.dvvc_ma || user.DVVC_Ma || user.id;
    return ma ? { loai: "DVVC", ma } : null;
  }

  // shipper / quanlykho: chưa dùng thông báo
  return null;
};

export const NotificationProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  const { socket, connected } = useContext(SocketContext);

  const [unreadCount, setUnreadCount] = useState(0);
  const [moiNhat, setMoiNhat] = useState([]);
  const [phienBan, setPhienBan] = useState(0);

  const nguoiNhan = useMemo(() => layNguoiNhan(user), [user]);

  const refreshUnread = useCallback(async () => {
    if (!nguoiNhan) {
      setUnreadCount(0);
      return;
    }
    try {
      const res = await thongBaoService.demChuaDoc(
        nguoiNhan.loai,
        nguoiNhan.ma,
      );
      setUnreadCount(Number(res.data?.so_luong) || 0);
    } catch (error) {
      // im lặng: không làm ồn UI khi mất mạng
    }
  }, [nguoiNhan]);

  const refreshMoiNhat = useCallback(async () => {
    if (!nguoiNhan) {
      setMoiNhat([]);
      return;
    }
    try {
      const res = await thongBaoService.getHopThu(
        nguoiNhan.loai,
        nguoiNhan.ma,
        { page: 1, limit: 5 },
      );
      setMoiNhat(res.data?.rows || []);
    } catch (error) {
      // im lặng
    }
  }, [nguoiNhan]);

  // Tải lần đầu / khi đổi tài khoản
  useEffect(() => {
    refreshUnread();
    refreshMoiNhat();
  }, [refreshUnread, refreshMoiNhat]);

  // Lắng nghe realtime
  useEffect(() => {
    if (!socket) return undefined;

    const onMoi = (thongBao) => {
      if (!thongBao) return;
      setMoiNhat((cu) => [thongBao, ...cu].slice(0, 5));
      setUnreadCount((cu) => cu + 1);
      setPhienBan((v) => v + 1);
    };

    const onDaDoc = (duLieu) => {
      if (typeof duLieu?.so_chua_doc === "number") {
        setUnreadCount(duLieu.so_chua_doc);
      } else {
        refreshUnread();
      }

      setMoiNhat((cu) =>
        cu.map((item) => {
          if (!duLieu?.tb_ma) return { ...item, nn_dadoc: true };
          return String(item.tb_ma) === String(duLieu.tb_ma)
            ? { ...item, nn_dadoc: true }
            : item;
        }),
      );
      setPhienBan((v) => v + 1);
    };

    socket.on("thongbao:moi", onMoi);
    socket.on("thongbao:dadoc", onDaDoc);

    return () => {
      socket.off("thongbao:moi", onMoi);
      socket.off("thongbao:dadoc", onDaDoc);
    };
  }, [socket, refreshUnread]);

  // Lưới an toàn: nếu socket mất kết nối thì polling 60 giây/lần
  useEffect(() => {
    if (!nguoiNhan || connected) return undefined;
    const id = setInterval(refreshUnread, 60000);
    return () => clearInterval(id);
  }, [nguoiNhan, connected, refreshUnread]);

  const danhDauDaDoc = useCallback(
    async (tb_ma) => {
      if (!nguoiNhan) return;
      const res = await thongBaoService.danhDauDaDoc(
        nguoiNhan.loai,
        nguoiNhan.ma,
        tb_ma,
      );

      if (typeof res.data?.so_chua_doc === "number") {
        setUnreadCount(res.data.so_chua_doc);
      }

      setMoiNhat((cu) =>
        cu.map((item) =>
          String(item.tb_ma) === String(tb_ma)
            ? { ...item, nn_dadoc: true }
            : item,
        ),
      );
      setPhienBan((v) => v + 1);
    },
    [nguoiNhan],
  );

  const danhDauTatCa = useCallback(async () => {
    if (!nguoiNhan) return;
    await thongBaoService.danhDauTatCa(nguoiNhan.loai, nguoiNhan.ma);
    setUnreadCount(0);
    setMoiNhat((cu) => cu.map((item) => ({ ...item, nn_dadoc: true })));
    setPhienBan((v) => v + 1);
  }, [nguoiNhan]);

  const hopThuPath = nguoiNhan ? HOP_THU_PATH[nguoiNhan.loai] : "/";

  const value = useMemo(
    () => ({
      nguoiNhan,
      hopThuPath,
      unreadCount,
      moiNhat,
      connected,
      phienBan,
      refreshUnread,
      refreshMoiNhat,
      danhDauDaDoc,
      danhDauTatCa,
    }),
    [
      nguoiNhan,
      hopThuPath,
      unreadCount,
      moiNhat,
      connected,
      phienBan,
      refreshUnread,
      refreshMoiNhat,
      danhDauDaDoc,
      danhDauTatCa,
    ],
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
