// src/hooks/useGiaoDien.js
// Tải cấu hình header/footer 1 lần cho cả ứng dụng.
// Có cache cấp module + fallback cứng để trang không bao giờ vỡ.
import { useEffect, useState } from "react";
import giaoDienService from "../services/san/giaoDienService";

const FALLBACK = {
  cai_dat: {
    cds_ten_hien_thi: "CT255 Shop",
    cds_khau_hieu: "Sàn thương mại điện tử hiện đại",
    cds_logo: "",
    cds_favicon: "",
    cds_hotline: "0798239093",
    cds_email: "muocb230376@student.ctu.edu.vn",
    cds_dia_chi: "Cần Thơ, Việt Nam",
    cds_ban_quyen: "© 2026 CT255. Bảo lưu mọi quyền.",
    cds_kieu_header: "logo_trai",
    cds_header_dinh: true,
    cds_hien_header: true,
    cds_hien_footer: true,
  },
  header: [
    {
      kvg_ma: "fallback-header",
      kvg_vitri: "header",
      kvg_ten: "Menu chính",
      kvg_tieude: null,
      kvg_kieubocuc: "menu_ngang",
      kvg_thutu: 1,
      kvg_hienthi: true,
      thanh_phan: [
        {
          tpg_ma: "fallback-h1",
          tpg_loai: "link",
          tpg_tieude: "Trang chủ",
          tpg_lienket: "/",
        },
        {
          tpg_ma: "fallback-h2",
          tpg_loai: "link",
          tpg_tieude: "Sản phẩm",
          tpg_lienket: "/san-pham",
        },
        {
          tpg_ma: "fallback-h3",
          tpg_loai: "link",
          tpg_tieude: "Đơn hàng",
          tpg_lienket: "/khach-hang/theo-doi-don-hang",
        },
      ],
    },
  ],
  footer: [
    {
      kvg_ma: "fallback-footer-1",
      kvg_vitri: "footer",
      kvg_ten: "Về CT255",
      kvg_tieude: "Về CT255",
      kvg_kieubocuc: "doan_text",
      kvg_thutu: 1,
      kvg_hienthi: true,
      thanh_phan: [
        {
          tpg_ma: "fallback-f1",
          tpg_loai: "text",
          tpg_tieude: "CT255 Shop",
          tpg_noidung: "Sàn TMĐT kết nối người mua và người bán.",
        },
      ],
    },
    {
      kvg_ma: "fallback-footer-2",
      kvg_vitri: "footer",
      kvg_ten: "Chính sách",
      kvg_tieude: "Chính sách",
      kvg_kieubocuc: "danh_sach_doc",
      kvg_thutu: 2,
      kvg_hienthi: true,
      thanh_phan: [
        {
          tpg_ma: "fallback-f2",
          tpg_loai: "link",
          tpg_tieude: "Điều khoản sử dụng",
          tpg_lienket: "#",
        },
        {
          tpg_ma: "fallback-f3",
          tpg_loai: "link",
          tpg_tieude: "Chính sách bảo mật",
          tpg_lienket: "#",
        },
      ],
    },
    {
      kvg_ma: "fallback-footer-3",
      kvg_vitri: "footer",
      kvg_ten: "Kết nối",
      kvg_tieude: "Kết nối",
      kvg_kieubocuc: "hang_icon",
      kvg_thutu: 3,
      kvg_hienthi: true,
      thanh_phan: [
        {
          tpg_ma: "fallback-f4",
          tpg_loai: "icon",
          tpg_tieude: "Facebook",
          tpg_lienket: "https://facebook.com",
          tpg_bieutuong: "public",
          tpg_mo_tab_moi: true,
        },
        {
          tpg_ma: "fallback-f5",
          tpg_loai: "icon",
          tpg_tieude: "Zalo",
          tpg_lienket: "https://zalo.me",
          tpg_bieutuong: "chat",
          tpg_mo_tab_moi: true,
        },
      ],
    },
  ],
};

let cache = null;
let pending = null;
const listeners = new Set();

const notify = (data) => {
  cache = data;
  listeners.forEach((fn) => fn(data));
};

const normalize = (payload) => {
  const hasData =
    payload?.cai_dat ||
    (Array.isArray(payload?.header) && payload.header.length > 0) ||
    (Array.isArray(payload?.footer) && payload.footer.length > 0);

  if (!hasData) return FALLBACK;

  return {
    cai_dat: { ...FALLBACK.cai_dat, ...(payload?.cai_dat || {}) },
    header: Array.isArray(payload?.header) ? payload.header : [],
    footer: Array.isArray(payload?.footer) ? payload.footer : [],
  };
};

const request = (bust = false) => {
  pending = giaoDienService
    .getPublic(bust)
    .then((res) => {
      const data = normalize(res.data);
      notify(data);
      return data;
    })
    .catch((error) => {
      console.error("Không tải được cấu hình giao diện:", error);
      notify(FALLBACK);
      return FALLBACK;
    })
    .finally(() => {
      pending = null;
    });

  return pending;
};

// Tải dữ liệu (dùng cache nếu đã có)
export const loadGiaoDien = () => {
  if (cache) return Promise.resolve(cache);
  if (pending) return pending;
  return request(false);
};

// Xóa cache, tải lại ngay (bỏ qua cache trình duyệt)
export const refreshGiaoDien = () => {
  cache = null;
  return request(true);
};

// Chỉ xóa cache, lần vào trang sau sẽ tự tải lại
export const invalidateGiaoDien = () => {
  cache = null;
};

export default function useGiaoDien() {
  const [data, setData] = useState(cache || FALLBACK);
  const [loading, setLoading] = useState(!cache);

  useEffect(() => {
    let alive = true;

    const listener = (next) => {
      if (!alive) return;
      setData(next);
      setLoading(false);
    };

    listeners.add(listener);

    loadGiaoDien().then((next) => {
      if (!alive) return;
      setData(next);
      setLoading(false);
    });

    return () => {
      alive = false;
      listeners.delete(listener);
    };
  }, []);

  return {
    cai_dat: data.cai_dat,
    header: data.header,
    footer: data.footer,
    loading,
  };
}