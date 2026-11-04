// backend/src/scripts/seedProducts.js
// Chạy thử (không ghi DB):  node src/scripts/seedProducts.js --dry
// Chạy thật:                node src/scripts/seedProducts.js
//
// Cấu hình qua biến môi trường hoặc sửa CONFIG bên dưới.
const fs = require('fs');
const path = require('path');
const pool = require('../config/db');
const SanPhamService = require('../services/gianhang/sanPhamService');
const ChiTietSanPhamService = require('../services/gianhang/chiTietSanPhamService');

const CONFIG = {
    // Thư mục chứa các folder sản phẩm (mỗi folder có info.json + 01.jpg...)
    PRODUCTS_DIR: process.env.PRODUCTS_DIR || 'D:\\Hệ thống quản lý SX\\Project_ThuongMaiDienTu\\test\\products',
    GH_MA: process.env.GH_MA || 'GH01',        // gian hàng sẽ sở hữu sản phẩm
    NH_MA: process.env.NH_MA || '',            // ngành hàng LÁ (bắt buộc), vd: Laptop Gaming
    DMSP_MA: process.env.DMSP_MA || null,      // danh mục sản phẩm của shop
    TH_MA: process.env.TH_MA || null,          // nếu null sẽ tự tìm theo tên hãng (Acer, Asus...)
    SOLUONG_TON: Number(process.env.SOLUONG_TON) || 10,
    // Prefix hasp_link lưu trong DB. Sửa cho khớp cách controller đang lưu ảnh upload
    LINK_PREFIX: process.env.LINK_PREFIX || '/uploads/products/',
};

const UPLOAD_DIR = path.join(__dirname, '../../public/uploads/products');
const DRY = process.argv.includes('--dry');

const norm = (s) =>
    String(s || '')
        .toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd')
        .replace(/[^a-z0-9]+/g, ' ').trim();

// "Laptop Acer ... (Core 7 | 16GB ...)" -> { ten, cauHinh }
const tachTen = (name) => {
    const m = name.match(/^(.*?)\s*\((.*)\)\s*$/);
    return m ? { ten: m[1].trim(), cauHinh: m[2].trim() } : { ten: name.trim(), cauHinh: name.trim() };
};

// Chỉ lấy ảnh của chính sản phẩm: bỏ thumbnail "250_" và ảnh sản phẩm liên quan (chuột, phím, màn hình...)
const chonAnh = (info, dir) => {
    const idMatch = (info.image_urls[0] || '').match(/\/(?:250_)?(\d+)_/);
    const pid = idMatch ? idMatch[1] : null;
    const result = [];
    info.image_urls.forEach((url, i) => {
        if (!pid || !url.includes(`/${pid}_`) || url.includes('/250_')) return;
        const local = path.join(dir, String(i + 1).padStart(2, '0') + '.jpg');
        if (fs.existsSync(local)) result.push(local);
    });
    return result;
};

const copyAnh = (files) =>
    files.map((src, i) => {
        const name = `product-${Date.now()}-${Math.floor(Math.random() * 100000)}${path.extname(src).toLowerCase()}`;
        if (!DRY) {
            fs.mkdirSync(UPLOAD_DIR, { recursive: true });
            fs.copyFileSync(src, path.join(UPLOAD_DIR, name));
        }
        return {
            hasp_link: CONFIG.LINK_PREFIX + name,
            hasp_laanhchinh: i === 0,
            hasp_thutu: i + 1,
            hasp_mota: null,
        };
    });

const timThuongHieu = async (name) => {
    if (CONFIG.TH_MA) return CONFIG.TH_MA;
    const { rows } = await pool.query('SELECT th_ma, th_ten FROM thuonghieu');
    const n = ' ' + norm(name) + ' ';
    const hit = rows.find((r) => n.includes(' ' + norm(r.th_ten) + ' '));
    return hit ? hit.th_ma : null;
};

const mapThuocTinh = (specs, dsThuocTinh) => {
    const byName = new Map(dsThuocTinh.map((t) => [norm(t.thsp_ten), t.thsp_ma]));
    const result = [];
    const chuaKhop = [];
    for (const [key, value] of Object.entries(specs || {})) {
        if (!value || value === '--') continue;
        // thử khớp toàn bộ key, rồi khớp phần sau dấu " - " (vd "Bộ xử lý - CPU" -> "CPU")
        const candidates = [key, ...key.split(' - ')];
        const ma = candidates.map((c) => byName.get(norm(c))).find(Boolean);
        if (ma) result.push({ ttsp_ma: ma, gttt_giatridinhtinh: String(value), gttt_giatridinhluong: null });
        else chuaKhop.push(key);
    }
    return { result, chuaKhop };
};

const moTa = (specs) => {
    const keys = ['CPU', 'Ram', 'Ổ cứng', 'VGA', 'Display', 'OS', 'Pin', 'Weight'];
    return keys.filter((k) => specs[k]).map((k) => `${k}: ${specs[k]}`).join('\n') || null;
};

const seedOne = async (folder, dsThuocTinh) => {
    const dir = path.join(CONFIG.PRODUCTS_DIR, folder);
    const infoPath = path.join(dir, 'info.json');
    if (!fs.existsSync(infoPath)) return console.log(`- Bỏ qua ${folder}: không có info.json`);

    const info = JSON.parse(fs.readFileSync(infoPath, 'utf8'));
    const { ten, cauHinh } = tachTen(info.name);

    const trung = await pool.query('SELECT sp_ma FROM sanpham WHERE gh_ma = $1 AND sp_ten = $2', [CONFIG.GH_MA, ten]);
    if (trung.rows.length) return console.log(`- Bỏ qua ${folder}: đã có (${trung.rows[0].sp_ma})`);

    const th_ma = await timThuongHieu(info.name);
    const anh = chonAnh(info, dir);
    const { result: thuoctinh, chuaKhop } = mapThuocTinh(info.specs, dsThuocTinh);
    const khoiluong = parseFloat(String(info.specs['Weight'] || info.specs['Trọng lượng'] || '').replace(',', '.')) || 1;

    console.log(`\n* ${ten}`);
    console.log(`  th_ma=${th_ma} | ảnh=${anh.length} | thuộc tính khớp=${thuoctinh.length} | giá=${info.price}`);
    if (chuaKhop.length) console.log(`  Thuộc tính chưa có trong DB (bỏ qua): ${chuaKhop.join('; ')}`);
    if (DRY) return;

    const sp = await SanPhamService.create({
        sp_ten: ten,
        sp_mota: moTa(info.specs),
        gh_ma: CONFIG.GH_MA,
        th_ma,
        dmsp_ma: CONFIG.DMSP_MA,
    });

    const ct = await ChiTietSanPhamService.create({
        sp_ma: sp.sp_ma,
        ctsp_ten: cauHinh,
        ctsp_mota: moTa(info.specs),
        ctsp_soluongton: CONFIG.SOLUONG_TON,
        ctsp_khoiluong: khoiluong,
        nh_ma: CONFIG.NH_MA,
        gb_gia: info.price,
        images: copyAnh(anh),
        thuoctinh,
    });
    console.log(`  => Đã thêm ${sp.sp_ma} / ${ct.ctsp_ma}`);
};

(async () => {
    try {
        if (!CONFIG.NH_MA) throw new Error('Thiếu NH_MA (ngành hàng lá). Đặt biến môi trường NH_MA hoặc sửa CONFIG.');
        const { rows: dsThuocTinh } = await pool.query('SELECT thsp_ma, thsp_ten FROM thuoctinhsanpham');
        const folders = fs.readdirSync(CONFIG.PRODUCTS_DIR, { withFileTypes: true })
            .filter((d) => d.isDirectory()).map((d) => d.name);

        console.log(DRY ? '== DRY RUN, không ghi DB ==' : '== Đang ghi DB ==');
        for (const f of folders) {
            try { await seedOne(f, dsThuocTinh); }
            catch (e) { console.error(`  Lỗi ở ${f}: ${e.message}`); }
        }
    } catch (e) {
        console.error('Lỗi:', e.message);
    } finally {
        await pool.end();
    }
})();
