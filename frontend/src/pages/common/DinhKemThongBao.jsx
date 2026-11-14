// frontend/src/components/common/DinhKemThongBao.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { FileText, ImagePlus, Paperclip, X } from "lucide-react";

const MAX_ANH = 3;
const MAX_PDF = 2;
const MAX_SIZE = 10 * 1024 * 1024;

const kichThuoc = (bytes) => {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
};

const DinhKemThongBao = ({ value, onChange, disabled = false }) => {
  const anh = useMemo(() => value?.anh ?? [], [value]);
  const pdf = useMemo(() => value?.pdf ?? [], [value]);
  const [loi, setLoi] = useState("");
  const [xemTruoc, setXemTruoc] = useState([]);
  const refAnh = useRef(null);
  const refPdf = useRef(null);

  useEffect(() => {
    const ds = anh.map((file) => ({ file, url: URL.createObjectURL(file) }));
    setXemTruoc(ds);
    return () => ds.forEach((item) => URL.revokeObjectURL(item.url));
  }, [anh]);

  const them = (files, loai) => {
    setLoi("");
    const dsMoi = Array.from(files || []);
    if (!dsMoi.length) return;

    const gioiHan = loai === "anh" ? MAX_ANH : MAX_PDF;
    const hienTai = loai === "anh" ? anh : pdf;

    if (hienTai.length + dsMoi.length > gioiHan) {
      setLoi(
        `Chỉ được đính kèm tối đa ${gioiHan} ${loai === "anh" ? "ảnh" : "tệp PDF"}.`,
      );
      return;
    }

    const quaCo = dsMoi.find((f) => f.size > MAX_SIZE);
    if (quaCo) {
      setLoi(`Tệp "${quaCo.name}" vượt quá 10MB.`);
      return;
    }

    if (loai === "anh" && dsMoi.some((f) => !f.type.startsWith("image/"))) {
      setLoi("Chỉ nhận tệp ảnh (JPG, PNG, WEBP, GIF).");
      return;
    }
    if (loai === "pdf" && dsMoi.some((f) => f.type !== "application/pdf")) {
      setLoi("Chỉ nhận tệp PDF.");
      return;
    }

    onChange({
      anh: loai === "anh" ? [...anh, ...dsMoi] : anh,
      pdf: loai === "pdf" ? [...pdf, ...dsMoi] : pdf,
    });
  };

  const xoa = (loai, index) => {
    onChange({
      anh: loai === "anh" ? anh.filter((_, i) => i !== index) : anh,
      pdf: loai === "pdf" ? pdf.filter((_, i) => i !== index) : pdf,
    });
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={refAnh}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          disabled={disabled}
          onChange={(e) => {
            them(e.target.files, "anh");
            e.target.value = "";
          }}
        />
        <input
          ref={refPdf}
          type="file"
          accept="application/pdf"
          multiple
          className="hidden"
          disabled={disabled}
          onChange={(e) => {
            them(e.target.files, "pdf");
            e.target.value = "";
          }}
        />

        <button
          type="button"
          disabled={disabled || anh.length >= MAX_ANH}
          onClick={() => refAnh.current?.click()}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 hover:border-sky-300 hover:text-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ImagePlus className="h-4 w-4" />
          Ảnh ({anh.length}/{MAX_ANH})
        </button>

        <button
          type="button"
          disabled={disabled || pdf.length >= MAX_PDF}
          onClick={() => refPdf.current?.click()}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 hover:border-sky-300 hover:text-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Paperclip className="h-4 w-4" />
          PDF ({pdf.length}/{MAX_PDF})
        </button>

        <span className="text-[11px] text-slate-400">Mỗi tệp tối đa 10MB</span>
      </div>

      {loi && <p className="text-xs text-rose-600">{loi}</p>}

      {(xemTruoc.length > 0 || pdf.length > 0) && (
        <div className="flex flex-wrap gap-2">
          {xemTruoc.map((item, index) => (
            <div
              key={`anh-${index}`}
              className="group relative h-16 w-16 overflow-hidden rounded-lg border border-slate-200"
            >
              <img
                src={item.url}
                alt={item.file.name}
                className="h-full w-full object-cover"
              />
              <button
                type="button"
                onClick={() => xoa("anh", index)}
                className="absolute right-0.5 top-0.5 grid h-5 w-5 place-items-center rounded-full bg-black/60 text-white opacity-0 transition group-hover:opacity-100"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}

          {pdf.map((file, index) => (
            <div
              key={`pdf-${index}`}
              className="flex max-w-[180px] items-center gap-2 rounded-lg border border-slate-200 bg-white px-2 py-1.5"
            >
              <FileText className="h-4 w-4 shrink-0 text-rose-500" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[11px] font-medium text-slate-700">
                  {file.name}
                </span>
                <span className="text-[10px] text-slate-400">
                  {kichThuoc(file.size)}
                </span>
              </span>
              <button
                type="button"
                onClick={() => xoa("pdf", index)}
                className="grid h-5 w-5 shrink-0 place-items-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-rose-600"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DinhKemThongBao;
