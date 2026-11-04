// backend/src/scripts/seedShopvnb.js
// Nạp dữ liệu ShopVNB (thư mục products_shopvnb do lay_du_lieu_shopvnb.py tạo) vào DB.
//
//   node src/scripts/seedShopvnb.js --list-codes           In mã ngành hàng / danh mục / thương hiệu đang có trong DB
//   node src/scripts/seedShopvnb.js --dry                  Chạy thử (không ghi DB, không copy ảnh), có bảng kiểm tra cấu hình
//   node src/scripts/seedShopvnb.js --dry --limit=5        Chạy thử 5 sản phẩm
//   node src/scripts/seedShopvnb.js                        Chạy thật
//   node src/scripts/seedShopvnb.js --only=giày            Chỉ sản phẩm có từ khóa trong tên hoặc danh mục
//   node src/scripts/seedShopvnb.js --replace-images       Thay hết ảnh của chi tiết đã có
//
// Cách ánh xạ (giống seedAnta.js):
//   - Mỗi thư mục sản phẩm (1 trang ShopVNB) là MỘT sanpham (tên = tên sản phẩm, rút gọn <= SP_TEN_MAX, giữ mã SKU nếu phải cắt).
//   - Mỗi biến thể là một chitietsanpham (ctsp_ten):
//       + sản phẩm có nhóm "Chọn [Size]/[Màu]/[Phiên bản]": mỗi tổ hợp là một chi tiết, vd "Đỏ / 42"
//       + sản phẩm không có tùy chọn (vd vợt cầu lông): 1 chi tiết tên "Mặc định"
//     Giá (gb_gia), tồn kho (hết hàng -> 0) lấy từ info.json.
//   - Ảnh dùng chung cho các biến thể của cùng sản phẩm, file chỉ copy một lần.
//   - Chạy lại được: sanpham tìm theo (gh_ma, sp_ten), chitietsanpham tìm theo (sp_ma, ctsp_ten).
//
// TRƯỚC KHI CHẠY THẬT: điền mã ngành hàng / danh mục cho từng nhóm trong PHAN_LOAI (hoặc biến môi trường),
// và đảm bảo bảng thuonghieu có các thương hiệu cần dùng (hoặc đặt TH_MA làm mặc định).
// Dùng --list-codes để xem mã nào đang có trong DB. Script KHÔNG tự đoán mã.
const fs = require('fs');
const path = require('path');
const pool = require('../config/db');
const SanPhamService = require('../services/gianhang/sanPhamService');
const ChiTietSanPhamService = require('../services/gianhang/chiTietSanPhamService');

const CONFIG = {
    PRODUCTS_DIR: process.env.PRODUCTS_DIR || 'D:\\Hệ thống quản lý SX\\Project_ThuongMaiDienTu\\test\\products_shopvnb',
    GH_MA: process.env.GH_MA || 'GH04',
    NH_MA: process.env.NH_MA || "NH_012",         // ngành hàng mặc định cho nhóm không có mã riêng (bảng PHAN_LOAI)
    DMSP_MA: process.env.DMSP_MA || "DMSP04",     // danh mục sản phẩm mặc định
    TH_MA: process.env.TH_MA || "TH04",         // thương hiệu mặc định khi bảng thuonghieu không có thương hiệu của sản phẩm
    SOLUONG_TON: Number(process.env.SOLUONG_TON) || 10,
    MAX_ANH: Number(process.env.MAX_ANH) || 20,
    SP_TEN_MAX: Number(process.env.SP_TEN_MAX) || 50,
    MAX_BIENTHE: Number(process.env.MAX_BIENTHE) || 60,   // quá số này thì chỉ lấy nhóm Size (hoặc nhóm đầu tiên)
    KHOILUONG_MACDINH: Number(process.env.KHOILUONG_MACDINH) || 0.5,
    GIA: (process.env.GIA || 'min').toLowerCase(),        // 'min' = giá bán thấp nhất, 'max' = giá cao nhất của khoảng giá
    MOTA_DAI: process.env.MOTA_DAI === '1',               // 1 = ghép thêm đoạn mô tả dài vào sp_mota
    MOTA_MAX: Number(process.env.MOTA_MAX) || 2000,
    LINK_PREFIX: process.env.LINK_PREFIX || '/uploads/products/',
};

// Từ khóa trong "danh mục > tên sản phẩm" -> ngành hàng / danh mục / khối lượng (kg). Nhóm khớp ĐẦU TIÊN được chọn,
// nên thứ tự quan trọng (vd "Túi vợt" phải nằm trước "Vợt", "Quấn cán vợt" thuộc Phụ kiện nằm trước "Vợt").
// Mã null -> dùng NH_MA / DMSP_MA mặc định; nếu cũng null thì bị chặn khi chạy thật.
const PHAN_LOAI = [
    { ten: 'Giày dép', tuKhoa: ['giày', 'giầy', 'dép', 'sandal'],
      nh_ma: process.env.NH_GIAY || null, dmsp_ma: process.env.DMSP_GIAY || null, khoiluong: 0.9 },
    { ten: 'Túi & balo', tuKhoa: ['túi', 'balo'],
      nh_ma: process.env.NH_TUI || null, dmsp_ma: process.env.DMSP_TUI || null, khoiluong: 0.6 },
    { ten: 'Quần áo', tuKhoa: ['áo', 'quần', 'váy', 'chân váy', 'bộ quần áo'],
      nh_ma: process.env.NH_TRANGPHUC || null, dmsp_ma: process.env.DMSP_TRANGPHUC || null, khoiluong: 0.4 },
    { ten: 'Phụ kiện', tuKhoa: ['phụ kiện', 'quấn cán', 'cước', 'vớ', 'băng', 'quả cầu', 'bóng', 'nón', 'mũ', 'khăn',
        'bình', 'gen', 'giảm rung', 'lưới', 'dây'],
      nh_ma: process.env.NH_PHUKIEN || null, dmsp_ma: process.env.DMSP_PHUKIEN || null, khoiluong: 0.2 },
    { ten: 'Vợt', tuKhoa: ['vợt', 'combo vợt', 'set vợt'],
      nh_ma: process.env.NH_VOT || null, dmsp_ma: process.env.DMSP_VOT || null, khoiluong: 0.45 },
];
const PHAN_LOAI_KHAC = { ten: 'Khác', nh_ma: null, dmsp_ma: null, khoiluong: CONFIG.KHOILUONG_MACDINH };

const UPLOAD_DIR = path.join(__dirname, '../../public/uploads/products');
const DRY = process.argv.includes('--dry');
const REPLACE_IMAGES = process.argv.includes('--replace-images');
const LIST_CODES = process.argv.includes('--list-codes');
const optVal = (name) => {
    const a = process.argv.find((x) => x.startsWith(name + '='));
    return a ? a.slice(name.length + 1) : null;
};
const LIMIT = Number(optVal('--limit')) || 0;
const ONLY = optVal('--only');

// norm: bỏ dấu (so khớp thương hiệu, --only). Từ khóa phân loại KHÔNG bỏ dấu vì "quấn" và "quần" sẽ trùng nhau.
const norm = (s) =>
    String(s || '')
        .toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd')
        .replace(/[^a-z0-9]+/g, ' ').trim();

const low = (s) => String(s || '').toLowerCase().normalize('NFC');
const hasWord = (text, kw) => {
    const esc = low(kw).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`(^|[^\\p{L}\\p{N}])${esc}(?=$|[^\\p{L}\\p{N}])`, 'u').test(text);
};

const cat = (s, max) => (s.length <= max ? s : s.slice(0, max).trim());

// ---------- TÊN SẢN PHẨM ----------
// Tên tối đa SP_TEN_MAX ký tự; khi phải cắt thì LUÔN giữ mã (SKU) ở cuối để các sản phẩm khác nhau không trùng tên.
const rutGonTen = (mo, ma, max) => {
    const full = ma ? `${mo} ${ma}` : mo;
    if (full.length <= max) return full;
    if (!ma) return cat(mo, max);
    const room = max - ma.length - 1;
    let s = '';
    for (const w of mo.split(/\s+/)) {
        const next = s ? `${s} ${w}` : w;
        if (next.length > room) break;
        s = next;
    }
    return `${s} ${ma}`.trim();
};
const tenSanPham = (name, sku, max, ep) => {
    const goc = String(name || '').trim().replace(/\s+/g, ' ');
    if (!ep && goc.length <= max) return goc;
    return rutGonTen(goc, sku || '', max);
};

// ---------- PHÂN LOẠI ----------
const phanLoai = (info) => {
    const text = low(`${info.category || ''} ${info.name || ''}`);
    const hit = PHAN_LOAI.find((p) => p.tuKhoa.some((k) => hasWord(text, k))) || PHAN_LOAI_KHAC;
    return {
        ten: hit.ten,
        nh_ma: hit.nh_ma || CONFIG.NH_MA,
        dmsp_ma: hit.dmsp_ma || CONFIG.DMSP_MA,
        khoiluong: hit.khoiluong,
    };
};

// ---------- ẢNH ----------
const IMG_RE = /\.(jpe?g|png|webp|gif|avif)$/i;
// Lấy theo image_files (tên file thật scraper đã lưu), giữ thứ tự, ảnh đầu là ảnh chính.
// Nếu info.json không có image_files thì quét các file 01.webp, 02.webp... trong thư mục.
const chonAnh = (info, dir) => {
    const result = [];
    const seen = new Set();
    const them = (fileName) => {
        if (!fileName) return;
        const local = path.join(dir, fileName);
        if (seen.has(local) || !fs.existsSync(local)) return;
        seen.add(local);
        result.push(local);
    };
    (info.image_files || []).forEach((saved) => them(saved ? String(saved).split(/[\\/]/).pop() : null));
    if (!result.length) {
        fs.readdirSync(dir).filter((f) => /^\d+\./.test(f) && IMG_RE.test(f)).sort().forEach(them);
    }
    return result.slice(0, CONFIG.MAX_ANH);
};

let counter = 0;
const copyAnh = (files) =>
    files.map((src, i) => {
        counter += 1;
        const name = `product-${Date.now()}-${counter}-${Math.floor(Math.random() * 1000)}${path.extname(src).toLowerCase()}`;
        if (!DRY) {
            fs.mkdirSync(UPLOAD_DIR, { recursive: true });
            fs.copyFileSync(src, path.join(UPLOAD_DIR, name));
        }
        return { hasp_link: CONFIG.LINK_PREFIX + name, hasp_laanhchinh: i === 0, hasp_thutu: i + 1, hasp_mota: null };
    });

// Copy file ảnh một lần cho mỗi sản phẩm, các biến thể dùng lại cùng liên kết
const memo = (fn) => {
    let done = false, val;
    return () => { if (!done) { val = fn(); done = true; } return val; };
};

const insertAnh = async (ctsp_ma, images) => {
    for (const img of images) {
        const hasp_ma = 'HA' + Math.random().toString(36).substring(2, 10);
        await pool.query(
            `INSERT INTO hinhanhsanpham (hasp_ma, hasp_link, hasp_laanhchinh, hasp_thutu, ctsp_ma, hasp_mota)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [hasp_ma, img.hasp_link, img.hasp_laanhchinh, img.hasp_thutu, ctsp_ma, img.hasp_mota]
        );
    }
};

// Chi tiết đã có: chỉ bổ sung ảnh nếu chưa có ảnh (hoặc thay hết nếu --replace-images)
const xuLyAnhChiTietDaCo = async (ctsp_ma, soAnh, layAnh) => {
    const { rows } = await pool.query('SELECT COUNT(*)::int AS n FROM hinhanhsanpham WHERE ctsp_ma = $1', [ctsp_ma]);
    const n = rows[0].n;
    if (n > 0 && !REPLACE_IMAGES) return console.log(`    ${ctsp_ma}: đã có ${n} ảnh, giữ nguyên`);
    console.log(`    ${ctsp_ma}: ${n > 0 ? `thay ${n} ảnh cũ bằng` : 'bổ sung'} ${soAnh} ảnh`);
    if (DRY) return;
    if (n > 0) await pool.query('DELETE FROM hinhanhsanpham WHERE ctsp_ma = $1', [ctsp_ma]);
    await insertAnh(ctsp_ma, layAnh().map((x) => ({ ...x })));
};

// ---------- THƯƠNG HIỆU ----------
let thuongHieuCache = null;
const loadThuongHieu = async () => {
    if (!thuongHieuCache) thuongHieuCache = (await pool.query('SELECT th_ma, th_ten FROM thuonghieu')).rows;
    return thuongHieuCache;
};
// Ưu tiên khớp theo trường brand; không có thì khớp theo tên sản phẩm. Không khớp -> TH_MA (nếu đặt) hoặc null.
const timThuongHieuMa = async (brand, name) => {
    const rows = await loadThuongHieu();
    const khop = (text) => {
        const n = ' ' + norm(text) + ' ';
        return rows.find((r) => r.th_ten && n.includes(' ' + norm(r.th_ten) + ' '));
    };
    const hit = (brand && khop(brand)) || khop(name);
    return hit ? hit.th_ma : (CONFIG.TH_MA || null);
};

// ---------- MÔ TẢ ----------
// Thông số -> mô tả. Bỏ dòng trống/"--", dòng trùng giá trị.
const moTa = (info) => {
    const seen = new Set();
    const lines = [];
    for (const [key, value] of Object.entries(info.specs || {})) {
        const v = String(value || '').trim();
        if (!v || v === '--' || seen.has(v)) continue;
        seen.add(v);
        lines.push(`${key}: ${v}`);
    }
    let text = lines.join('\n');
    const dai = String(info.description || '').trim();
    if (dai && (CONFIG.MOTA_DAI || !text)) {
        text = text ? `${text}\n\n${dai}` : dai;
        text = cat(text, CONFIG.MOTA_MAX);
    }
    return text || null;
};

// ---------- BIẾN THỂ ----------
const giaSanPham = (info) => {
    const g = CONFIG.GIA === 'max' ? (info.price_max || info.price) : (info.price || info.price_max);
    return Math.round(Number(g) || 0);
};

const giaTuGiaTri = (values) => {
    for (let i = values.length - 1; i >= 0; i--) {
        const v = values[i];
        const g = CONFIG.GIA === 'max' ? (v.price_max || v.price_min) : (v.price_min || v.price_max);
        if (g) return Math.round(Number(g));
    }
    return 0;
};

// Trả về [{ ten, gia, conHang }]
const taoBienThe = (info) => {
    const giaGoc = giaSanPham(info);
    const conHang = !/hết hàng|ngừng kinh doanh/i.test(info.availability || '');
    const groups = (info.options || []).filter((g) => g.values && g.values.length);
    if (!groups.length) return [{ ten: 'Mặc định', gia: giaGoc, conHang }];

    // tích Descartes các nhóm tùy chọn
    let combos = [[]];
    for (const g of groups) {
        const next = [];
        for (const c of combos) for (const v of g.values) next.push([...c, v]);
        combos = next;
        if (combos.length > CONFIG.MAX_BIENTHE) break;
    }
    if (combos.length > CONFIG.MAX_BIENTHE) {
        const g = groups.find((x) => /size|kích|cỡ/i.test(x.name)) || groups[0];
        combos = g.values.map((v) => [v]);
    }
    return combos.map((c) => ({
        ten: cat(c.map((v) => v.name).join(' / '), 255),
        gia: giaTuGiaTri(c) || giaGoc,
        conHang: conHang && c.every((v) => !v.soldout),
    }));
};

// ---------- ĐỌC THƯ MỤC ----------
const docThuMuc = () => {
    if (!fs.existsSync(CONFIG.PRODUCTS_DIR)) throw new Error(`Không thấy thư mục ${CONFIG.PRODUCTS_DIR} (đặt biến PRODUCTS_DIR)`);
    const entries = [];
    const folders = fs.readdirSync(CONFIG.PRODUCTS_DIR, { withFileTypes: true })
        .filter((d) => d.isDirectory()).map((d) => d.name).sort();
    for (const folder of folders) {
        const dir = path.join(CONFIG.PRODUCTS_DIR, folder);
        const infoPath = path.join(dir, 'info.json');
        if (!fs.existsSync(infoPath)) {
            console.log(`- Bỏ qua ${folder}: không có info.json`);
            continue;
        }
        let info;
        try {
            info = JSON.parse(fs.readFileSync(infoPath, 'utf8'));
        } catch (e) {
            console.log(`- Bỏ qua ${folder}: info.json lỗi (${e.message})`);
            continue;
        }
        if (!info.name) continue;
        entries.push({ folder, dir, info, ten: String(info.name).trim() });
    }
    return entries;
};

// ---------- KIỂM TRA CẤU HÌNH TRƯỚC KHI CHẠY ----------
// In số sản phẩm theo nhóm + mã đang dùng; trả về danh sách thiếu để chặn chạy thật.
const kiemTraCauHinh = async (list) => {
    const nhom = new Map();
    const thieuTH = new Map();
    for (const e of list) {
        const pl = phanLoai(e.info);
        const k = pl.ten;
        if (!nhom.has(k)) nhom.set(k, { n: 0, nh_ma: pl.nh_ma, dmsp_ma: pl.dmsp_ma });
        nhom.get(k).n++;
        const th = await timThuongHieuMa(e.info.brand, e.ten);
        if (!th) thieuTH.set(e.info.brand || '(không rõ)', (thieuTH.get(e.info.brand || '(không rõ)') || 0) + 1);
    }
    console.log('\n== KIỂM TRA CẤU HÌNH ==');
    const thieu = [];
    for (const [ten, v] of nhom) {
        const ok = v.nh_ma && v.dmsp_ma;
        console.log(`  ${ok ? 'OK ' : 'THIẾU'} ${ten.padEnd(12)} ${String(v.n).padStart(4)} sp | nh_ma=${v.nh_ma || '-'} dmsp_ma=${v.dmsp_ma || '-'}`);
        if (!ok) thieu.push(`nhóm "${ten}" (${v.n} sp): thiếu ${!v.nh_ma ? 'nh_ma ' : ''}${!v.dmsp_ma ? 'dmsp_ma' : ''}`);
    }
    if (thieuTH.size) {
        console.log('  Thương hiệu KHÔNG có trong bảng thuonghieu (và chưa đặt TH_MA):');
        for (const [b, n] of thieuTH) console.log(`    - ${b}: ${n} sp`);
        thieu.push(`${thieuTH.size} thương hiệu chưa có trong bảng thuonghieu: ${[...thieuTH.keys()].join(', ')}`);
    }
    return thieu;
};

// --list-codes: in nội dung các bảng ngành hàng / danh mục / thương hiệu (không đoán tên bảng cố định)
const listCodes = async () => {
    const { rows: tables } = await pool.query(
        `SELECT table_name FROM information_schema.tables
         WHERE table_schema = 'public' AND (table_name ILIKE '%nganh%' OR table_name ILIKE '%danhmuc%' OR table_name ILIKE '%thuonghieu%')
         ORDER BY table_name`
    );
    if (!tables.length) console.log('Không tìm thấy bảng nào có tên chứa "nganh", "danhmuc" hoặc "thuonghieu".');
    for (const { table_name } of tables) {
        const { rows } = await pool.query(`SELECT * FROM "${table_name}" LIMIT 300`);
        console.log(`\n== ${table_name} (${rows.length} dòng đầu) ==`);
        rows.forEach((r) => console.log('  ' + Object.values(r).map((x) => (x === null ? '' : String(x))).join(' | ')));
    }
};

// ---------- NẠP MỘT SẢN PHẨM ----------
const tenDaDung = new Map(); // sp_ten -> folder (phát hiện trùng tên sau khi rút gọn)

const seedProduct = async (e) => {
    const { info, dir } = e;
    let spTen = tenSanPham(info.name, info.sku, CONFIG.SP_TEN_MAX, false);
    if (tenDaDung.has(spTen) && tenDaDung.get(spTen) !== e.folder) {
        spTen = tenSanPham(info.name, info.sku, CONFIG.SP_TEN_MAX, true);
    }
    tenDaDung.set(spTen, e.folder);

    const pl = phanLoai(info);
    const bienThe = taoBienThe(info);
    const anh = chonAnh(info, dir);
    const layAnh = memo(() => copyAnh(anh));

    console.log(`\n* SẢN PHẨM: ${spTen}  [${pl.ten}]  (${bienThe.length} chi tiết, ${anh.length} ảnh)`);

    let sp_ma = null;
    let taoMoi = false;
    const found = await pool.query('SELECT sp_ma FROM sanpham WHERE gh_ma = $1 AND sp_ten = $2', [CONFIG.GH_MA, spTen]);
    if (found.rows.length) {
        sp_ma = found.rows[0].sp_ma;
        console.log(`  đã có ${sp_ma}`);
    } else if (!DRY) {
        if (!pl.nh_ma || !pl.dmsp_ma) {
            throw new Error(`Chưa cấu hình ngành hàng/danh mục cho nhóm "${pl.ten}" (sửa bảng PHAN_LOAI hoặc đặt NH_MA, DMSP_MA)`);
        }
        const th_ma = await timThuongHieuMa(info.brand, info.name);
        if (!th_ma) throw new Error(`Thương hiệu "${info.brand}" chưa có trong bảng thuonghieu (thêm vào DB hoặc đặt TH_MA)`);
        const sp = await SanPhamService.create({
            sp_ten: spTen,
            sp_mota: moTa(info),
            gh_ma: CONFIG.GH_MA,
            th_ma,
            dmsp_ma: pl.dmsp_ma,
        });
        sp_ma = sp.sp_ma;
        taoMoi = true;
    }

    let soChiTietTao = 0;
    const daDung = new Set();
    for (const v of bienThe) {
        let ctsp_ten = v.ten;
        if (daDung.has(ctsp_ten)) ctsp_ten = cat(`${ctsp_ten} (${daDung.size + 1})`, 255);
        daDung.add(ctsp_ten);

        if (!v.gia) { console.log(`    ${ctsp_ten}: bỏ qua (không có giá)`); continue; }

        if (sp_ma) {
            const ex = await pool.query('SELECT ctsp_ma FROM chitietsanpham WHERE sp_ma = $1 AND ctsp_ten = $2', [sp_ma, ctsp_ten]);
            if (ex.rows.length) {
                await xuLyAnhChiTietDaCo(ex.rows[0].ctsp_ma, anh.length, layAnh);
                continue;
            }
        }
        const ton = v.conHang ? CONFIG.SOLUONG_TON : 0;
        if (DRY) { console.log(`    ${ctsp_ten} | giá=${v.gia} | tồn=${ton}`); continue; }

        try {
            const ct = await ChiTietSanPhamService.create({
                sp_ma,
                ctsp_ten,
                ctsp_mota: moTa(info),
                ctsp_soluongton: ton,
                ctsp_khoiluong: pl.khoiluong,
                nh_ma: pl.nh_ma,
                gb_gia: v.gia,
                images: layAnh().map((x) => ({ ...x })),
                thuoctinh: [],
            });
            soChiTietTao++;
            console.log(`    => Đã thêm ${ct.ctsp_ma} (${ctsp_ten}, giá=${v.gia}, tồn=${ton})`);
        } catch (err) {
            console.error(`    Lỗi thêm chi tiết ${ctsp_ten}: ${err.message}`);
        }
    }

    // sanpham vừa tạo mà không tạo được chi tiết nào -> xóa để không sót dòng mồ côi
    if (taoMoi && soChiTietTao === 0) {
        await SanPhamService.delete(sp_ma).catch(() => {});
        console.log(`  (đã xóa ${sp_ma} vì không tạo được chi tiết nào)`);
        throw new Error('không tạo được chi tiết nào');
    } else if (taoMoi) {
        console.log(`  => Đã tạo ${sp_ma} (${soChiTietTao} chi tiết)`);
    }
};

(async () => {
    let tong = 0, loi = 0;
    try {
        if (LIST_CODES) {
            await listCodes();
            return;
        }
        console.log(DRY ? '== DRY RUN, không ghi DB ==' : '== Đang ghi DB ==');

        let list = docThuMuc().filter((e) => !ONLY || norm(`${e.ten} ${e.info.category || ''}`).includes(norm(ONLY)));
        if (LIMIT) list = list.slice(0, LIMIT);
        console.log(`Tổng ${list.length} sản phẩm`);

        const thieu = await kiemTraCauHinh(list);
        if (thieu.length) {
            console.log('\nCòn thiếu cấu hình:');
            thieu.forEach((t) => console.log('  - ' + t));
            console.log('Dùng --list-codes để xem mã đang có, rồi điền vào PHAN_LOAI hoặc biến môi trường ' +
                '(NH_VOT/DMSP_VOT, NH_GIAY/DMSP_GIAY, NH_TRANGPHUC/DMSP_TRANGPHUC, NH_TUI/DMSP_TUI, NH_PHUKIEN/DMSP_PHUKIEN, NH_MA/DMSP_MA, TH_MA).');
            if (!DRY) {
                console.log('Dừng, chưa ghi gì vào DB. (Thêm --dry để chỉ xem thử.)');
                return;
            }
        }

        for (const [i, e] of list.entries()) {
            try {
                process.stdout.write(`[${i + 1}/${list.length}]`);
                await seedProduct(e);
                tong++;
            } catch (err) {
                loi++;
                console.error(`  Lỗi ở sản phẩm ${e.ten}: ${err.message}`);
            }
        }
        console.log(`\nXong: ${tong} sản phẩm xử lý, ${loi} lỗi.`);
    } catch (e) {
        console.error('Lỗi:', e.message);
    } finally {
        await pool.end();
    }
})();