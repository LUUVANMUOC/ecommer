// src/pages/admin/GiaoDienCRUD.jsx
import { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import giaoDienService from "../../services/san/giaoDienService";
import { refreshGiaoDien } from "../../hooks/useGiaoDien";
import ImageUpload from "../../components/common/ImageUpload";
import ToastNotification from "../../components/common/Crud/ToastNotification";
import CrudDrawer from "../../components/common/Crud/CrudDrawer";
import SiteHeader from "../../components/layout/SiteHeader";
import SiteFooter from "../../components/layout/SiteFooter";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8080";
const PDF_MAX_SIZE = 10 * 1024 * 1024; // 10MB

const imgUrl = (link) => {
  if (!link) return "";
  if (
    link.startsWith("http") ||
    link.startsWith("data:") ||
    link.startsWith("blob:")
  ) {
    return link;
  }
  return `${BACKEND_URL}${link.startsWith("/") ? "" : "/"}${link}`;
};

// Link tới tệp (PDF, Word, Excel, ZIP...) hoặc file upload nội bộ
const isFileLink = (url) =>
  typeof url === "string" &&
  (/\.(pdf|docx?|xlsx?|pptx?|zip|rar)$/i.test(url) ||
    url.startsWith("/uploads/"));

const isPdfLink = (url) =>
  typeof url === "string" && /\.pdf$/i.test(url.split("?")[0]);

const fileHref = (url) => {
  if (!url) return "";
  if (/^(https?:|data:|blob:)/.test(url)) return url;
  return `${BACKEND_URL}${url.startsWith("/") ? "" : "/"}${url}`;
};

const fileName = (url) => {
  if (!url) return "";
  const raw = url.split("?")[0].split("/").pop() || url;
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
};

const KIEU_OPTIONS = [
  { value: "menu_ngang", label: "Menu ngang" },
  { value: "danh_sach_doc", label: "Danh sách dọc" },
  { value: "luoi_anh", label: "Lưới ảnh" },
  { value: "hang_icon", label: "Hàng icon" },
  { value: "doan_text", label: "Đoạn text + liên hệ" },
];

const LOAI_OPTIONS = [
  { value: "link", label: "Liên kết (chữ)" },
  { value: "text", label: "Đoạn text" },
  { value: "icon", label: "Icon" },
  { value: "image", label: "Hình ảnh" },
];

const LOAI_LABEL = Object.fromEntries(
  LOAI_OPTIONS.map((item) => [item.value, item.label]),
);

const DEFAULT_CAI_DAT = {
  cds_ten_hien_thi: "CT255 Shop",
  cds_khau_hieu: "",
  cds_logo: "",
  cds_favicon: "",
  cds_hotline: "",
  cds_email: "",
  cds_dia_chi: "",
  cds_ban_quyen: "",
  cds_kieu_header: "logo_trai",
  cds_header_dinh: true,
  cds_hien_header: true,
  cds_hien_footer: true,
};

const EMPTY_BLOCK = {
  kvg_ten: "",
  kvg_tieude: "",
  kvg_kieubocuc: "danh_sach_doc",
  kvg_thutu: "",
  kvg_hienthi: true,
};

const EMPTY_ITEM = {
  tpg_loai: "link",
  tpg_tieude: "",
  tpg_noidung: "",
  tpg_lienket: "",
  tpg_hinhanh: "",
  tpg_bieutuong: "public",
  tpg_mo_tab_moi: false,
  tpg_thutu: "",
  tpg_hienthi: true,
};

const DEMO_SEARCH = {
  value: "",
  onChange: () => {},
  onSubmit: () => {},
  onClear: () => {},
  loading: false,
};

const iconForType = (loai) => {
  if (loai === "image") return "image";
  if (loai === "icon") return "emoji_symbols";
  if (loai === "text") return "notes";
  return "link";
};

const Field = ({ label, hint, children }) => (
  <div>
    <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#64748B]">
      {label}
    </span>
    {children}
    {hint && <span className="mt-1 block text-xs text-[#94A3B8]">{hint}</span>}
  </div>
);

const Toggle = ({ checked, onChange, label, description }) => (
  <div className="flex items-center justify-between gap-3 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3">
    <div className="min-w-0">
      <p className="text-sm font-medium text-[#334155]">{label}</p>
      {description && (
        <p className="mt-0.5 text-xs text-[#94A3B8]">{description}</p>
      )}
    </div>
    <button
      type="button"
      onClick={() => onChange(!checked)}
      aria-pressed={checked}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
        checked ? "bg-[#2563EB]" : "bg-[#CBD5E1]"
      }`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
          checked ? "left-[22px]" : "left-0.5"
        }`}
      />
    </button>
  </div>
);

const inputClass =
  "w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-2.5 text-sm text-[#0F172A] outline-none transition-all focus:border-[#2563EB] focus:bg-white";

const GiaoDienCRUD = () => {
  const [khuVuc, setKhuVuc] = useState([]);
  const [form, setForm] = useState(DEFAULT_CAI_DAT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [logoFile, setLogoFile] = useState(null);
  const [faviconFile, setFaviconFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState("");

  // Drawer cụm
  const [blockDrawer, setBlockDrawer] = useState({
    open: false,
    editingId: "",
    vitri: "header",
    form: EMPTY_BLOCK,
  });

  // Drawer mục (mở đè lên drawer cụm)
  const [itemDrawer, setItemDrawer] = useState({
    open: false,
    editing: null,
    kvg_ma: "",
    form: EMPTY_ITEM,
  });

  const [uploadingItem, setUploadingItem] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);

  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });

  const toastTimer = useRef(null);
  const logoPreviewRef = useRef("");
  const pdfInputRef = useRef(null);

  const showToast = useCallback((message, type = "success") => {
    setToast({ show: true, message, type });
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(
      () => setToast((t) => ({ ...t, show: false })),
      2800,
    );
  }, []);

  /* ================= TẢI DỮ LIỆU ================= */
  const fetchData = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      try {
        const res = await giaoDienService.getAdmin();
        const caiDat = { ...DEFAULT_CAI_DAT, ...(res.data?.cai_dat || {}) };

        Object.keys(DEFAULT_CAI_DAT).forEach((key) => {
          if (caiDat[key] === null || caiDat[key] === undefined) {
            caiDat[key] = DEFAULT_CAI_DAT[key];
          }
        });

        setForm(caiDat);
        setKhuVuc(res.data?.khu_vuc || []);
      } catch (error) {
        console.error("Lỗi tải giao diện:", error);
        showToast("Không tải được dữ liệu giao diện", "error");
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [showToast],
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(
    () => () => {
      if (logoPreviewRef.current) URL.revokeObjectURL(logoPreviewRef.current);
    },
    [],
  );

  const blocksOf = (vitri) =>
    khuVuc
      .filter((item) => item.kvg_vitri === vitri)
      .sort((a, b) => a.kvg_thutu - b.kvg_thutu);

  const setFormField = (key, value) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleLogoSelect = (file) => {
    if (logoPreviewRef.current) URL.revokeObjectURL(logoPreviewRef.current);
    const url = file ? URL.createObjectURL(file) : "";
    logoPreviewRef.current = url;
    setLogoPreview(url);
    setLogoFile(file || null);
  };

  /* ================= CÀI ĐẶT CHUNG ================= */
  const saveCaiDat = useCallback(async () => {
    setSaving(true);
    try {
      let logo = form.cds_logo;
      let favicon = form.cds_favicon;

      if (logoFile) {
        const res = await giaoDienService.uploadImage(logoFile);
        logo = res.data.url;
      }
      if (faviconFile) {
        const res = await giaoDienService.uploadImage(faviconFile);
        favicon = res.data.url;
      }

      const res = await giaoDienService.updateCaiDat({
        ...form,
        cds_logo: logo,
        cds_favicon: favicon,
      });

      const saved = { ...DEFAULT_CAI_DAT, ...(res.data || form) };
      Object.keys(DEFAULT_CAI_DAT).forEach((key) => {
        if (saved[key] === null || saved[key] === undefined) {
          saved[key] = DEFAULT_CAI_DAT[key];
        }
      });

      setForm(saved);
      setLogoFile(null);
      setFaviconFile(null);
      if (logoPreviewRef.current) {
        URL.revokeObjectURL(logoPreviewRef.current);
        logoPreviewRef.current = "";
      }
      setLogoPreview("");

      refreshGiaoDien().catch(() => {});
      showToast("Đã lưu cài đặt giao diện");
      return saved;
    } catch (error) {
      showToast(
        error.response?.data?.message || "Lỗi lưu cài đặt giao diện",
        "error",
      );
      return null;
    } finally {
      setSaving(false);
    }
  }, [form, logoFile, faviconFile, showToast]);

  const handleSaveSettings = async (event) => {
    event?.preventDefault?.();
    const saved = await saveCaiDat();
    if (saved) setSettingsOpen(false);
  };

  const toggleHien = (key, value) => {
    const next = { ...form, [key]: value };
    setForm(next);
    giaoDienService
      .updateCaiDat(next)
      .then(() => {
        refreshGiaoDien().catch(() => {});
        showToast("Đã cập nhật hiển thị");
      })
      .catch(() => showToast("Không cập nhật được", "error"));
  };

  /* ================= CỤM ================= */
  const openCreateBlock = (vitri) =>
    setBlockDrawer({
      open: true,
      editingId: "",
      vitri,
      form: { ...EMPTY_BLOCK },
    });

  const openEditBlock = (block) =>
    setBlockDrawer({
      open: true,
      editingId: block.kvg_ma,
      vitri: block.kvg_vitri,
      form: { ...EMPTY_BLOCK, ...block },
    });

  const closeBlockDrawer = () =>
    setBlockDrawer((prev) => ({ ...prev, open: false }));

  const setBlockField = (key, value) =>
    setBlockDrawer((prev) => ({
      ...prev,
      form: { ...prev.form, [key]: value },
    }));

  const submitBlock = async (event) => {
    event?.preventDefault?.();
    const { editingId, vitri, form: blockForm } = blockDrawer;

    if (!blockForm.kvg_ten?.trim()) {
      showToast("Nhập tên cụm", "error");
      return;
    }

    try {
      if (editingId) {
        await giaoDienService.updateKhuVuc(editingId, blockForm);
      } else {
        const payload = { ...blockForm, kvg_vitri: vitri };
        if (!payload.kvg_thutu) delete payload.kvg_thutu;
        await giaoDienService.createKhuVuc(payload);
      }

      setBlockDrawer((prev) => ({ ...prev, open: false }));
      await fetchData(true);
      refreshGiaoDien().catch(() => {});
      showToast(editingId ? "Đã cập nhật cụm" : "Đã thêm cụm");
    } catch (error) {
      showToast(error.response?.data?.message || "Lỗi lưu cụm", "error");
    }
  };

  const deleteBlock = async (block) => {
    if (!block) return;
    if (
      !window.confirm(`Xóa cụm "${block.kvg_ten}" và toàn bộ mục bên trong?`)
    ) {
      return;
    }

    try {
      await giaoDienService.deleteKhuVuc(block.kvg_ma);
      setBlockDrawer((prev) => ({ ...prev, open: false }));
      await fetchData(true);
      refreshGiaoDien().catch(() => {});
      showToast("Đã xóa cụm");
    } catch {
      showToast("Lỗi xóa cụm", "error");
    }
  };

  /* ================= MỤC ================= */
  const openCreateItem = (kvg_ma) =>
    setItemDrawer({
      open: true,
      editing: null,
      kvg_ma,
      form: { ...EMPTY_ITEM },
    });

  const openEditItem = (item) =>
    setItemDrawer({
      open: true,
      editing: item,
      kvg_ma: item.kvg_ma || blockDrawer.editingId,
      form: { ...EMPTY_ITEM, ...item },
    });

  const setItemField = (key, value) =>
    setItemDrawer((prev) => ({
      ...prev,
      form: { ...prev.form, [key]: value },
    }));

  const handleItemImage = async (file) => {
    setUploadingItem(true);
    try {
      const res = await giaoDienService.uploadImage(file);
      setItemField("tpg_hinhanh", res.data.url);
      showToast("Đã tải ảnh lên");
    } catch {
      showToast("Lỗi tải ảnh", "error");
    } finally {
      setUploadingItem(false);
    }
  };

  // Tải tệp PDF cho mục liên kết: điền link + bật mở tab mới + lấy tên file làm tiêu đề
  const handleItemFile = async (file) => {
    if (!file) return;

    if (!/\.pdf$/i.test(file.name)) {
      showToast("Chỉ hỗ trợ tệp PDF", "error");
      return;
    }
    if (file.size > PDF_MAX_SIZE) {
      showToast("Tệp vượt quá 10MB", "error");
      return;
    }

    setUploadingFile(true);
    try {
      const res = await giaoDienService.uploadFile(file);
      const url = res.data?.url;
      if (!url) throw new Error("Không nhận được đường dẫn tệp");

      setItemDrawer((prev) => {
        const nextForm = {
          ...prev.form,
          tpg_lienket: url,
          tpg_mo_tab_moi: true,
        };

        if (!prev.form.tpg_tieude?.trim()) {
          nextForm.tpg_tieude = file.name
            .replace(/\.pdf$/i, "")
            .replace(/[-_]+/g, " ")
            .replace(/\s+/g, " ")
            .trim();
        }

        return { ...prev, form: nextForm };
      });

      showToast("Đã tải tệp PDF lên");
    } catch (error) {
      showToast(error.response?.data?.message || "Lỗi tải tệp PDF", "error");
    } finally {
      setUploadingFile(false);
    }
  };

  const submitItem = async (event) => {
    event?.preventDefault?.();
    const { editing, kvg_ma, form: itemForm } = itemDrawer;

    if (itemForm.tpg_loai === "image" && !itemForm.tpg_hinhanh) {
      showToast("Chọn ảnh cho mục này", "error");
      return;
    }

    if (itemForm.tpg_loai !== "text" && !itemForm.tpg_tieude?.trim()) {
      showToast("Nhập chữ hiển thị", "error");
      return;
    }

    try {
      if (editing) {
        await giaoDienService.updateThanhPhan(editing.tpg_ma, itemForm);
      } else {
        const payload = { ...itemForm, kvg_ma };
        if (!payload.tpg_thutu) delete payload.tpg_thutu;
        await giaoDienService.createThanhPhan(payload);
      }

      setItemDrawer((prev) => ({ ...prev, open: false }));
      await fetchData(true);
      refreshGiaoDien().catch(() => {});
      showToast(editing ? "Đã cập nhật mục" : "Đã thêm mục");
    } catch (error) {
      showToast(error.response?.data?.message || "Lỗi lưu mục", "error");
    }
  };

  const toggleItem = async (item) => {
    try {
      await giaoDienService.updateThanhPhan(item.tpg_ma, {
        tpg_hienthi: !item.tpg_hienthi,
      });
      await fetchData(true);
      refreshGiaoDien().catch(() => {});
    } catch {
      showToast("Không cập nhật được trạng thái", "error");
    }
  };

  const deleteItem = async (item) => {
    if (!window.confirm(`Xóa mục "${item.tpg_tieude || item.tpg_ma}"?`)) {
      return;
    }

    try {
      await giaoDienService.deleteThanhPhan(item.tpg_ma);
      await fetchData(true);
      refreshGiaoDien().catch(() => {});
      showToast("Đã xóa mục");
    } catch {
      showToast("Lỗi xóa mục", "error");
    }
  };

  const moveItem = async (block, item, direction) => {
    if (!block) return;

    const list = [...(block.thanh_phan || [])].sort(
      (a, b) => a.tpg_thutu - b.tpg_thutu,
    );
    const index = list.findIndex((row) => row.tpg_ma === item.tpg_ma);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= list.length) return;

    const next = [...list];
    [next[index], next[target]] = [next[target], next[index]];
    const reordered = next.map((row, i) => ({ ...row, tpg_thutu: i + 1 }));

    setKhuVuc((prev) =>
      prev.map((row) =>
        row.kvg_ma === block.kvg_ma ? { ...row, thanh_phan: reordered } : row,
      ),
    );

    try {
      await giaoDienService.reorder(
        "thanh-phan",
        reordered.map((row) => row.tpg_ma),
      );
      refreshGiaoDien().catch(() => {});
    } catch {
      showToast("Không lưu được thứ tự", "error");
      fetchData(true);
    }
  };

  /* ================= DỮ LIỆU XEM TRƯỚC ================= */
  const previewData = {
    cai_dat: { ...form, cds_logo: logoPreview || form.cds_logo },
    header: blocksOf("header"),
    footer: blocksOf("footer"),
  };

  const currentBlock = blockDrawer.editingId
    ? khuVuc.find((row) => row.kvg_ma === blockDrawer.editingId) || null
    : null;

  const currentItems = currentBlock
    ? [...(currentBlock.thanh_phan || [])].sort(
        (a, b) => a.tpg_thutu - b.tpg_thutu,
      )
    : [];

  /* ================= RENDER ================= */
  const renderToolbar = () => (
    <div className="sticky top-0 z-40 border-b border-[#E2E8F0] bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-6">
        <Link
          to="/admin"
          className="flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-semibold text-[#334155] transition-colors hover:bg-[#F1F5F9] hover:text-[#2563EB]"
        >
          <span className="material-symbols-outlined text-[18px]">
            arrow_back
          </span>
          <span className="hidden sm:inline">Dashboard</span>
        </Link>

        <span className="hidden h-5 w-px bg-[#E2E8F0] sm:block" />

        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-[#0F172A]">
            Giao diện Header &amp; Footer
          </p>
          <p className="hidden truncate text-[11px] text-[#94A3B8] sm:block">
            Bấm vào cụm trên header/footer để chỉnh sửa
          </p>
        </div>

        <div className="ml-auto flex items-center gap-2">
          {saving && (
            <span className="material-symbols-outlined animate-spin text-[18px] text-[#2563EB]">
              progress_activity
            </span>
          )}

          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            className="flex items-center gap-1.5 rounded-xl border border-[#E2E8F0] px-3 py-1.5 text-xs font-semibold text-[#334155] transition-colors hover:border-[#2563EB] hover:text-[#2563EB]"
          >
            <span className="material-symbols-outlined text-[16px]">
              settings
            </span>
            <span className="hidden sm:inline">Cài đặt chung</span>
          </button>

          <a
            href="/san-pham"
            target="_blank"
            rel="noreferrer"
            className="hidden items-center gap-1.5 rounded-xl border border-[#E2E8F0] px-3 py-1.5 text-xs font-semibold text-[#334155] transition-colors hover:border-[#2563EB] hover:text-[#2563EB] sm:flex"
          >
            <span className="material-symbols-outlined text-[16px]">
              open_in_new
            </span>
            Xem trang khách
          </a>

          <button
            type="button"
            onClick={() => fetchData()}
            className="flex items-center gap-1.5 rounded-xl border border-[#E2E8F0] px-3 py-1.5 text-xs font-semibold text-[#334155] transition-colors hover:border-[#2563EB] hover:text-[#2563EB]"
          >
            <span className="material-symbols-outlined text-[16px]">
              refresh
            </span>
            Tải lại
          </button>
        </div>
      </div>
    </div>
  );

  const renderHiddenBanner = (label, key) => (
    <div className="border-y border-[#FDE68A] bg-[#FEF3C7]">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-6 py-3 text-sm text-[#92400E]">
        <span className="material-symbols-outlined text-[20px]">
          visibility_off
        </span>
        <span>
          <strong>{label} đang ẩn</strong> trên trang khách.
        </span>
        <button
          type="button"
          onClick={() => toggleHien(key, true)}
          className="rounded-full bg-[#92400E] px-3 py-1 text-xs font-bold text-white transition-colors hover:bg-[#78350F]"
        >
          Bật lại
        </button>
        <button
          type="button"
          onClick={() => setSettingsOpen(true)}
          className="text-xs font-semibold underline"
        >
          Sửa cài đặt
        </button>
      </div>
    </div>
  );

  const renderMiddle = () => (
    <main className="mx-auto max-w-7xl px-6 py-8">
      <div className="rounded-2xl border border-dashed border-[#CBD5E1] bg-white p-6">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#EFF6FF] text-[#2563EB]">
            <span className="material-symbols-outlined text-[22px]">
              ads_click
            </span>
          </span>
          <div className="min-w-0">
            <h1 className="text-lg font-bold text-[#0F172A]">
              Bấm vào một cụm trên header/footer để chỉnh sửa
            </h1>
            <p className="mt-1 text-sm leading-relaxed text-[#64748B]">
              Mỗi cụm là một nhóm nội dung: menu, danh sách, hàng icon, lưới ảnh
              hoặc đoạn text. Bấm vào logo để sửa cài đặt chung. Mục loại
              &quot;Liên kết&quot; có thể đính kèm tệp PDF.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          {["header", "footer"].map((vitri) => {
            const list = blocksOf(vitri);

            return (
              <div
                key={vitri}
                className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4"
              >
                <div className="mb-3 flex items-center justify-between gap-2">
                  <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-[#64748B]">
                    <span className="material-symbols-outlined text-[16px] text-[#2563EB]">
                      {vitri === "header" ? "web_asset" : "bottom_navigation"}
                    </span>
                    Cụm {vitri === "header" ? "Header" : "Footer"} (
                    {list.length})
                  </p>
                  <button
                    type="button"
                    onClick={() => openCreateBlock(vitri)}
                    className="flex items-center gap-1 rounded-lg bg-[#2563EB] px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-[#1D4ED8]"
                  >
                    <span className="material-symbols-outlined text-[14px]">
                      add
                    </span>
                    Thêm cụm
                  </button>
                </div>

                {list.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-[#CBD5E1] bg-white py-4 text-center text-xs text-[#94A3B8]">
                    Chưa có cụm nào.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {list.map((block) => (
                      <button
                        key={block.kvg_ma}
                        type="button"
                        onClick={() => openEditBlock(block)}
                        className="group flex items-center gap-1.5 rounded-full border border-[#E2E8F0] bg-white px-3 py-1.5 text-xs font-semibold text-[#334155] transition-colors hover:border-[#2563EB] hover:text-[#2563EB]"
                      >
                        <span className="material-symbols-outlined text-[14px] text-[#94A3B8] group-hover:text-[#2563EB]">
                          {block.kvg_kieubocuc === "menu_ngang"
                            ? "menu"
                            : block.kvg_kieubocuc === "luoi_anh"
                              ? "grid_view"
                              : block.kvg_kieubocuc === "hang_icon"
                                ? "apps"
                                : block.kvg_kieubocuc === "doan_text"
                                  ? "notes"
                                  : "list"}
                        </span>
                        {block.kvg_ten}
                        {block.kvg_hienthi === false && (
                          <span className="rounded bg-[#E2E8F0] px-1.5 py-0.5 text-[9px] font-bold text-[#64748B]">
                            ẨN
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans">
      {renderToolbar()}

      {loading ? (
        <div className="flex flex-col items-center gap-3 py-32 text-sm text-[#64748B]">
          <span className="material-symbols-outlined animate-spin text-3xl text-[#2563EB]">
            progress_activity
          </span>
          Đang tải cấu hình giao diện...
        </div>
      ) : (
        <>
          {/* HEADER THẬT */}
          {form.cds_hien_header === false ? (
            renderHiddenBanner("Header", "cds_hien_header")
          ) : (
            <SiteHeader
              data={previewData}
              disableSticky
              editable
              showUtilities
              cartCount={0}
              user={null}
              search={DEMO_SEARCH}
              onEditSettings={() => setSettingsOpen(true)}
              onEditBlock={openEditBlock}
            />
          )}

          {renderMiddle()}

          {/* FOOTER THẬT */}
          {form.cds_hien_footer === false ? (
            renderHiddenBanner("Footer", "cds_hien_footer")
          ) : (
            <SiteFooter
              data={previewData}
              editable
              onEditSettings={() => setSettingsOpen(true)}
              onEditBlock={openEditBlock}
            />
          )}
        </>
      )}

      {/* DRAWER CÀI ĐẶT CHUNG */}
      <CrudDrawer
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        title="Cài đặt chung"
        description="Tên sàn, logo, liên hệ và chế độ hiển thị header/footer."
        onSubmit={handleSaveSettings}
        isEditing
      >
        <Field label="Tên hiển thị">
          <input
            type="text"
            value={form.cds_ten_hien_thi}
            onChange={(e) => setFormField("cds_ten_hien_thi", e.target.value)}
            className={inputClass}
            placeholder="CT255 Shop"
          />
        </Field>

        <Field label="Khẩu hiệu / slogan">
          <input
            type="text"
            value={form.cds_khau_hieu}
            onChange={(e) => setFormField("cds_khau_hieu", e.target.value)}
            className={inputClass}
            placeholder="Sàn thương mại điện tử hiện đại"
          />
        </Field>

        <Field label="Hotline">
          <input
            type="text"
            value={form.cds_hotline}
            onChange={(e) => setFormField("cds_hotline", e.target.value)}
            className={inputClass}
            placeholder="0798239093"
          />
        </Field>

        <Field label="Email hỗ trợ">
          <input
            type="email"
            value={form.cds_email}
            onChange={(e) => setFormField("cds_email", e.target.value)}
            className={inputClass}
            placeholder="hotro@ct255.vn"
          />
        </Field>

        <Field label="Địa chỉ">
          <input
            type="text"
            value={form.cds_dia_chi}
            onChange={(e) => setFormField("cds_dia_chi", e.target.value)}
            className={inputClass}
            placeholder="Cần Thơ, Việt Nam"
          />
        </Field>

        <Field label="Dòng bản quyền">
          <input
            type="text"
            value={form.cds_ban_quyen}
            onChange={(e) => setFormField("cds_ban_quyen", e.target.value)}
            className={inputClass}
            placeholder="© 2026 CT255. Bảo lưu mọi quyền."
          />
        </Field>

        <Field label="Kiểu header">
          <select
            value={form.cds_kieu_header}
            onChange={(e) => setFormField("cds_kieu_header", e.target.value)}
            className={inputClass}
          >
            <option value="logo_trai">Logo bên trái</option>
            <option value="logo_giua">Logo ở giữa</option>
          </select>
        </Field>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#64748B]">
            Hiển thị
          </p>
          <div className="space-y-2">
            <Toggle
              checked={form.cds_header_dinh}
              onChange={(value) => setFormField("cds_header_dinh", value)}
              label="Header dính khi cuộn"
              description="Áp dụng trang khách; trang này luôn tắt."
            />
            <Toggle
              checked={form.cds_hien_header}
              onChange={(value) => setFormField("cds_hien_header", value)}
              label="Hiện header"
            />
            <Toggle
              checked={form.cds_hien_footer}
              onChange={(value) => setFormField("cds_hien_footer", value)}
              label="Hiện footer"
            />
          </div>
        </div>

        <ImageUpload
          label="Logo sàn"
          hint="PNG, JPG, WEBP, SVG (tối đa 2MB). Nên dùng ảnh nền trong suốt."
          currentImage={logoPreview || form.cds_logo || null}
          onFileSelect={handleLogoSelect}
        />

        <ImageUpload
          label="Favicon"
          hint="Ảnh vuông nhỏ hiển thị trên tab trình duyệt (tối đa 2MB)."
          currentImage={form.cds_favicon || null}
          onFileSelect={setFaviconFile}
        />

        {(logoFile || faviconFile) && (
          <p className="rounded-lg bg-[#EFF6FF] px-3 py-2 text-xs font-medium text-[#2563EB]">
            Ảnh mới sẽ được tải lên khi bấm "Lưu thay đổi".
          </p>
        )}
      </CrudDrawer>

      {/* DRAWER CỤM */}
      <CrudDrawer
        isOpen={blockDrawer.open}
        onClose={closeBlockDrawer}
        title={blockDrawer.editingId ? "Sửa cụm" : "Thêm cụm"}
        description={
          blockDrawer.vitri === "header"
            ? "Cụm hiển thị trên header"
            : "Cụm hiển thị trên footer"
        }
        onSubmit={submitBlock}
        isEditing={Boolean(blockDrawer.editingId)}
      >
        <Field label="Tên cụm (nội bộ)">
          <input
            type="text"
            value={blockDrawer.form.kvg_ten}
            onChange={(e) => setBlockField("kvg_ten", e.target.value)}
            className={inputClass}
            placeholder="VD: Menu chính, Cột liên hệ..."
          />
        </Field>

        <Field
          label="Tiêu đề hiển thị"
          hint="Để trống nếu không muốn hiện tiêu đề."
        >
          <input
            type="text"
            value={blockDrawer.form.kvg_tieude || ""}
            onChange={(e) => setBlockField("kvg_tieude", e.target.value)}
            className={inputClass}
            placeholder="VD: Chính sách"
          />
        </Field>

        <Field label="Kiểu bố cục">
          <select
            value={blockDrawer.form.kvg_kieubocuc}
            onChange={(e) => setBlockField("kvg_kieubocuc", e.target.value)}
            className={inputClass}
          >
            {KIEU_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Thứ tự" hint="Để trống để tự thêm vào cuối.">
          <input
            type="number"
            value={blockDrawer.form.kvg_thutu ?? ""}
            onChange={(e) => setBlockField("kvg_thutu", e.target.value)}
            className={inputClass}
            min="1"
          />
        </Field>

        <Toggle
          checked={Boolean(blockDrawer.form.kvg_hienthi)}
          onChange={(value) => setBlockField("kvg_hienthi", value)}
          label="Hiển thị cụm"
        />

        {currentBlock && (
          <div className="space-y-2 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-bold uppercase tracking-wide text-[#64748B]">
                Các mục ({currentItems.length})
              </p>
              <button
                type="button"
                onClick={() => openCreateItem(currentBlock.kvg_ma)}
                className="flex items-center gap-1 rounded-lg bg-[#2563EB] px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-[#1D4ED8]"
              >
                <span className="material-symbols-outlined text-[14px]">
                  add
                </span>
                Thêm mục
              </button>
            </div>

            {currentItems.length === 0 ? (
              <p className="rounded-lg border border-dashed border-[#CBD5E1] bg-white py-4 text-center text-xs text-[#94A3B8]">
                Chưa có mục nào.
              </p>
            ) : (
              <div className="space-y-1.5">
                {currentItems.map((item, index) => (
                  <div
                    key={item.tpg_ma}
                    className="flex items-center gap-1.5 rounded-lg border border-[#F1F5F9] bg-white px-2 py-1.5"
                  >
                    {item.tpg_hinhanh ? (
                      <img
                        src={imgUrl(item.tpg_hinhanh)}
                        alt=""
                        className="h-7 w-7 shrink-0 rounded object-cover"
                      />
                    ) : (
                      <span
                        className={`material-symbols-outlined shrink-0 text-[16px] ${
                          isFileLink(item.tpg_lienket)
                            ? "text-[#DC2626]"
                            : "text-[#2563EB]"
                        }`}
                      >
                        {isFileLink(item.tpg_lienket)
                          ? isPdfLink(item.tpg_lienket)
                            ? "picture_as_pdf"
                            : "description"
                          : iconForType(item.tpg_loai)}
                      </span>
                    )}

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium text-[#0F172A]">
                        {item.tpg_tieude || "(chưa có chữ)"}
                      </p>
                      <p className="truncate text-[10px] text-[#94A3B8]">
                        {isFileLink(item.tpg_lienket)
                          ? `Tệp: ${fileName(item.tpg_lienket)}`
                          : item.tpg_lienket ||
                            item.tpg_noidung ||
                            LOAI_LABEL[item.tpg_loai]}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => moveItem(currentBlock, item, -1)}
                      disabled={index === 0}
                      title="Lên"
                      className="grid h-6 w-6 place-items-center rounded text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#2563EB] disabled:opacity-30"
                    >
                      <span className="material-symbols-outlined text-[15px]">
                        arrow_upward
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => moveItem(currentBlock, item, 1)}
                      disabled={index === currentItems.length - 1}
                      title="Xuống"
                      className="grid h-6 w-6 place-items-center rounded text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#2563EB] disabled:opacity-30"
                    >
                      <span className="material-symbols-outlined text-[15px]">
                        arrow_downward
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleItem(item)}
                      title={item.tpg_hienthi ? "Đang hiện" : "Đang ẩn"}
                      className="grid h-6 w-6 place-items-center rounded text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#2563EB]"
                    >
                      <span className="material-symbols-outlined text-[15px]">
                        {item.tpg_hienthi ? "visibility" : "visibility_off"}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => openEditItem(item)}
                      title="Sửa mục"
                      className="grid h-6 w-6 place-items-center rounded text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#2563EB]"
                    >
                      <span className="material-symbols-outlined text-[15px]">
                        edit
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteItem(item)}
                      title="Xóa mục"
                      className="grid h-6 w-6 place-items-center rounded text-[#64748B] hover:bg-[#FEF2F2] hover:text-[#DC2626]"
                    >
                      <span className="material-symbols-outlined text-[15px]">
                        delete
                      </span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {blockDrawer.editingId && (
          <button
            type="button"
            onClick={() => deleteBlock(currentBlock)}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-[#FECACA] bg-[#FEF2F2] py-2.5 text-sm font-semibold text-[#DC2626] hover:bg-[#FEE2E2]"
          >
            <span className="material-symbols-outlined text-[18px]">
              delete
            </span>
            Xóa cụm này
          </button>
        )}
      </CrudDrawer>

      {/* DRAWER MỤC */}
      <CrudDrawer
        isOpen={itemDrawer.open}
        onClose={() => setItemDrawer((prev) => ({ ...prev, open: false }))}
        title={itemDrawer.editing ? "Sửa mục" : "Thêm mục"}
        description="Một mục có thể là chữ, liên kết, icon hoặc hình ảnh."
        onSubmit={submitItem}
        isEditing={Boolean(itemDrawer.editing)}
      >
        <Field label="Loại mục">
          <select
            value={itemDrawer.form.tpg_loai}
            onChange={(e) => setItemField("tpg_loai", e.target.value)}
            className={inputClass}
          >
            {LOAI_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>

        <Field
          label={
            itemDrawer.form.tpg_loai === "image"
              ? "Mô tả ảnh (alt)"
              : "Chữ hiển thị"
          }
        >
          <input
            type="text"
            value={itemDrawer.form.tpg_tieude || ""}
            onChange={(e) => setItemField("tpg_tieude", e.target.value)}
            className={inputClass}
            placeholder="VD: Chính sách bảo mật"
          />
        </Field>

        {itemDrawer.form.tpg_loai === "text" && (
          <Field label="Nội dung">
            <textarea
              rows={4}
              value={itemDrawer.form.tpg_noidung || ""}
              onChange={(e) => setItemField("tpg_noidung", e.target.value)}
              className={inputClass}
              placeholder="Đoạn mô tả hiển thị..."
            />
          </Field>
        )}

        {itemDrawer.form.tpg_loai !== "text" && (
          <Field
            label="Liên kết"
            hint="Dùng /duong-dan cho trang nội bộ, hoặc https://... cho trang ngoài."
          >
            <input
              type="text"
              value={itemDrawer.form.tpg_lienket || ""}
              onChange={(e) => setItemField("tpg_lienket", e.target.value)}
              className={inputClass}
              placeholder="/san-pham hoặc https://facebook.com/..."
            />
          </Field>
        )}

        {/* Tệp PDF đính kèm (chỉ loại Liên kết) */}
        {itemDrawer.form.tpg_loai === "link" && (
          <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#64748B]">
              Tệp PDF đính kèm
            </p>
            <p className="mt-1 text-xs text-[#94A3B8]">
              Tải PDF lên để khách bấm vào mục này mở tệp ở tab mới. Tối đa
              10MB.
            </p>

            {isFileLink(itemDrawer.form.tpg_lienket) && (
              <div className="mt-2 flex items-center gap-2 rounded-lg border border-[#E2E8F0] bg-white px-2.5 py-2">
                <span className="material-symbols-outlined text-[18px] text-[#DC2626]">
                  {isPdfLink(itemDrawer.form.tpg_lienket)
                    ? "picture_as_pdf"
                    : "description"}
                </span>
                <a
                  href={fileHref(itemDrawer.form.tpg_lienket)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-w-0 flex-1 truncate text-xs font-medium text-[#2563EB] hover:underline"
                  title="Mở tệp trong tab mới"
                >
                  {fileName(itemDrawer.form.tpg_lienket)}
                </a>
                <button
                  type="button"
                  onClick={() => setItemField("tpg_lienket", "")}
                  title="Bỏ tệp đính kèm"
                  className="grid h-6 w-6 shrink-0 place-items-center rounded text-[#64748B] hover:bg-[#FEF2F2] hover:text-[#DC2626]"
                >
                  <span className="material-symbols-outlined text-[15px]">
                    close
                  </span>
                </button>
              </div>
            )}

            <input
              ref={pdfInputRef}
              type="file"
              accept="application/pdf,.pdf"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                handleItemFile(file);
              }}
            />

            <button
              type="button"
              onClick={() => pdfInputRef.current?.click()}
              disabled={uploadingFile}
              className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border border-[#2563EB] bg-white py-2 text-xs font-semibold text-[#2563EB] transition-colors hover:bg-[#EFF6FF] disabled:opacity-60"
            >
              <span
                className={`material-symbols-outlined text-[16px] ${
                  uploadingFile ? "animate-spin" : ""
                }`}
              >
                {uploadingFile ? "progress_activity" : "upload_file"}
              </span>
              {uploadingFile
                ? "Đang tải tệp lên..."
                : itemDrawer.form.tpg_lienket
                  ? "Thay tệp PDF khác"
                  : "Chọn tệp PDF"}
            </button>

            <p className="mt-1.5 text-[11px] text-[#94A3B8]">
              Sau khi tải lên, ô &quot;Liên kết&quot; được điền tự động và
              &quot;Mở tab mới&quot; được bật.
            </p>
          </div>
        )}

        {itemDrawer.form.tpg_loai === "icon" && (
          <Field
            label="Tên icon Material Symbols"
            hint="Ví dụ: public, chat, call, mail, location_on, verified"
          >
            <input
              type="text"
              value={itemDrawer.form.tpg_bieutuong || ""}
              onChange={(e) => setItemField("tpg_bieutuong", e.target.value)}
              className={inputClass}
              placeholder="public"
            />
          </Field>
        )}

        {itemDrawer.form.tpg_loai === "image" && (
          <div>
            <ImageUpload
              label="Hình ảnh"
              hint="PNG, JPG, WEBP, SVG (tối đa 2MB)."
              currentImage={itemDrawer.form.tpg_hinhanh || null}
              onFileSelect={handleItemImage}
            />
            {uploadingItem && (
              <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-[#2563EB]">
                <span className="material-symbols-outlined animate-spin text-[14px]">
                  progress_activity
                </span>
                Đang tải ảnh lên...
              </p>
            )}
          </div>
        )}

        {itemDrawer.form.tpg_loai !== "text" && (
          <Toggle
            checked={Boolean(itemDrawer.form.tpg_mo_tab_moi)}
            onChange={(value) => setItemField("tpg_mo_tab_moi", value)}
            label="Mở tab mới"
            description="Tệp đính kèm luôn mở tab mới."
          />
        )}

        <Field label="Thứ tự" hint="Để trống để tự thêm vào cuối.">
          <input
            type="number"
            value={itemDrawer.form.tpg_thutu ?? ""}
            onChange={(e) => setItemField("tpg_thutu", e.target.value)}
            className={inputClass}
            min="1"
          />
        </Field>

        <Toggle
          checked={Boolean(itemDrawer.form.tpg_hienthi)}
          onChange={(value) => setItemField("tpg_hienthi", value)}
          label="Hiển thị mục này"
        />

        <p className="rounded-lg bg-[#F8FAFC] px-3 py-2 text-xs text-[#64748B]">
          Đóng drawer này để quay lại cụm đang sửa.
        </p>
      </CrudDrawer>

      <ToastNotification toast={toast} />
    </div>
  );
};

export default GiaoDienCRUD;
