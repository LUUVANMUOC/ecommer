// backend/src/scripts/seedTopzone.js
const fs = require('fs');
const path = require('path');
const pool = require('../config/db');
const SanPhamService = require('../services/gianhang/sanPhamService');
const ChiTietSanPhamService = require('../services/gianhang/chiTietSanPhamService');
const DanhMucSanPhamService = require('../services/gianhang/danhMucSanPhamService');

// ================= CẤU HÌNH =================
const CONFIG = {
    PRODUCTS_DIR: process.env.PRODUCTS_DIR || path.resolve(__dirname, '../../../test/products_topzone'),
    GH_MA: process.env.GH_MA || 'GH01',          
    NH_MA: process.env.NH_MA || 'NH_002',        
    TH_MA: process.env.TH_MA || 'TH01',          
    SOLUONG_TON: Number(process.env.SOLUONG_TON) || 10,
    MAX_ANH: Number(process.env.MAX_ANH) || 20,
    SP_TEN_MAX: Number(process.env.SP_TEN_MAX) || 150, // Tăng lên 150 để chứa tên dài
    KHOILUONG_MACDINH: Number(process.env.KHOILUONG_MACDINH) || 0.5,
    LINK_PREFIX: process.env.LINK_PREFIX || '/uploads/products/',
};

const CATEGORY_NAMES = {
    'iphone': 'iPhone',
    'ipad': 'iPad',
    'mac': 'Mac',
    'apple-watch': 'Apple Watch',
    'airpods': 'AirPods',
    'phu-kien': 'Phụ kiện'
};

const UPLOAD_DIR = path.join(__dirname, '../../public/uploads/products');

// Cờ CLI
const IS_DRY_RUN = !process.argv.includes('--apply');
const LIMIT = Number(process.argv.find(a => a.startsWith('--limit='))?.split('=')[1]) || 0;
const ONLY = process.argv.find(a => a.startsWith('--only='))?.split('=')[1];

const logPayload = (label, payload) => {
    const cleanPayload = JSON.parse(JSON.stringify(payload)); 
    if (cleanPayload.sp_mota) cleanPayload.sp_mota = cleanPayload.sp_mota.substring(0, 80) + '...';
    if (cleanPayload.ctsp_mota) cleanPayload.ctsp_mota = cleanPayload.ctsp_mota.substring(0, 80) + '...';
    if (cleanPayload.images) cleanPayload.images = cleanPayload.images.slice(0, 2).map(img => ({ ...img, hasp_link: img.hasp_link.substring(0, 30) + '...' }));
    const jsonStr = JSON.stringify(cleanPayload, null, 2).replace(/\n/g, '\n      ');
    console.log(`  [DRY PAYLOAD] ${label}:\n      ${jsonStr}`);
};

// ================= TIỆN ÍCH =================
const cat = (s, max) => (s.length <= max ? s : s.slice(0, max).trim());

// HÀM QUAN TRỌNG: Bóc tách tên gốc, loại bỏ mọi dung lượng, kích thước, màu sắc
const extractBaseName = (name) => {
    let base = name;
    // Bỏ cấu hình kiểu 16GB/512GB hoặc 16 GB
    base = base.replace(/\b\d+\s*(GB|TB)\s*\/\s*\d+\s*(GB|TB)(\s*\/\s*\d+\s*(GPU|CPU))?\b/gi, '');
    // Bỏ dung lượng đơn lẻ
    base = base.replace(/\b\d+\s*(GB|TB)\b/gi, '');
    // Bỏ kích thước (inch, mm)
    base = base.replace(/\b\d+(\.\d+)?\s*(inch|mm)\b/gi, '');
    // Bỏ W (sạc), GPU, CPU đơn lẻ
    base = base.replace(/\b\d+\s*(W|GPU|CPU)\b/gi, '');
    // Bỏ kết nối
    base = base.replace(/\b(WiFi|5G|GPS|Cellular|LTE|GPS \+ Cellular)\b/gi, '');
    // Bỏ vật liệu / dây đeo
    base = base.replace(/(viền nhôm|viền thép|viền titan|dây silicone|dây vải|dây thép|dây milan|dây thể thao|dây cao su|dây alpine|dây ocean|dây trail)/gi, '');
    // Dọn dẹp khoảng trắng thừa, dấu gạch chéo thừa
    base = base.replace(/\s+/g, ' ').replace(/\s*\/\s*/g, ' ').trim();
    return base;
};

let imgCounter = 0;
const copyAnh = (files) => {
    return files.map((src, i) => {
        imgCounter += 1;
        const ext = path.extname(src).toLowerCase() || '.jpg';
        const name = `product-${Date.now()}-${imgCounter}-${Math.floor(Math.random() * 1000)}${ext}`;
        
        if (!IS_DRY_RUN) {
            fs.mkdirSync(UPLOAD_DIR, { recursive: true });
            try { fs.copyFileSync(src, path.join(UPLOAD_DIR, name)); } 
            catch (e) { console.error(`Lỗi copy ảnh: ${e.message}`); }
        }
        return { hasp_link: CONFIG.LINK_PREFIX + name, hasp_laanhchinh: i === 0, hasp_thutu: i + 1, hasp_mota: null };
    });
};

const memo = (fn) => {
    let done = false, val;
    return () => { if (!done) { val = fn(); done = true; } return val; };
};

const IMG_RE = /\.(jpe?g|png|webp|gif|avif)$/i;
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
        try { fs.readdirSync(dir).filter((f) => /^\d+\./.test(f) && IMG_RE.test(f)).sort().forEach(them); } catch(e) {}
    }
    return result.slice(0, CONFIG.MAX_ANH);
};

// ================= XỬ LÝ DANH MỤC TỰ ĐỘNG =================
const danhMucCache = {}; 

const getOrCreateDanhMuc = async (categorySlug, fallbackImage = null) => {
    if (danhMucCache[categorySlug]) return danhMucCache[categorySlug];
    const dmsp_ten = CATEGORY_NAMES[categorySlug] || categorySlug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    
    const res = await pool.query('SELECT dmsp_ma FROM danhmucsanpham WHERE gh_ma = $1 AND dmsp_ten = $2', [CONFIG.GH_MA, dmsp_ten]);
    if (res.rows.length > 0) {
        const existingMa = res.rows[0].dmsp_ma;
        danhMucCache[categorySlug] = existingMa;
        return existingMa;
    }

    const payload = {
        dmsp_ten: dmsp_ten,
        dmsp_mota: `Danh mục sản phẩm ${dmsp_ten} - Topzone`,
        dmsp_hinhanh: fallbackImage,
        gh_ma: CONFIG.GH_MA
    };

    if (IS_DRY_RUN) {
        console.log(`  [DB CHECK] Danh mục "${dmsp_ten}" chưa có -> Sẽ tạo mới.`);
        logPayload(`Tạo mới DANH MỤC (${categorySlug})`, payload);
        danhMucCache[categorySlug] = `DMSP_DRY_${categorySlug}`;
        return danhMucCache[categorySlug];
    }

    try {
        const newDm = await DanhMucSanPhamService.create(payload);
        console.log(`  [+] Đã tạo danh mục MỚI: ${newDm.dmsp_ma} - ${dmsp_ten}`);
        danhMucCache[categorySlug] = newDm.dmsp_ma;
        return newDm.dmsp_ma;
    } catch (error) {
        console.error(`  [!] Lỗi tạo danh mục ${dmsp_ten}:`, error.message);
        throw error;
    }
};

// ================= ĐỌC & GOM NHÓM DỮ LIỆU =================
const docThuMuc = () => {
    if (!fs.existsSync(CONFIG.PRODUCTS_DIR)) throw new Error(`Không thấy thư mục ${CONFIG.PRODUCTS_DIR}!`);
    const folders = fs.readdirSync(CONFIG.PRODUCTS_DIR, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name).sort();
    const rawEntries = [];

    for (const folder of folders) {
        const dir = path.join(CONFIG.PRODUCTS_DIR, folder);
        const infoPath = path.join(dir, 'info.json');
        if (!fs.existsSync(infoPath)) continue;

        try {
            const info = JSON.parse(fs.readFileSync(infoPath, 'utf8'));
            if (!info.name || !info.url) continue;

            const urlObj = new URL(info.url);
            const pathParts = urlObj.pathname.split('/').filter(Boolean);
            const category = pathParts[0] || 'khac';

            if (ONLY && !category.toLowerCase().includes(ONLY.toLowerCase())) continue;
            rawEntries.push({ folder, dir, info, category });
        } catch (e) {}
    }
    return rawEntries;
};

// GOM NHÓM THÔNG MINH
const groupSanPham = (entries) => {
    const groups = new Map();

    for (const e of entries) {
        // 1. Ưu tiên gom theo options (như iPhone có nút 256GB, 512GB)
        const urls = new Set([e.info.url]);
        for (const opt of e.info.options || []) {
            for (const v of opt.values || []) {
                if (v.url && v.url.startsWith('https://www.topzone.vn/')) {
                    urls.add(v.url.split('?')[0].replace(/\/$/, '')); 
                }
            }
        }

        // Nếu không có options, bắt buộc phải dùng Base Name để gom
        let groupKey = '';
        if (urls.size > 1) {
            groupKey = [...urls].sort((a, b) => a.length - b.length)[0]; // Dùng URL ngắn nhất
        } else {
            groupKey = extractBaseName(e.info.name); // Dùng tên đã làm sạch
        }
        
        if (!groups.has(groupKey)) {
            groups.set(groupKey, { category: e.category, baseName: extractBaseName(e.info.name), variants: [] });
        }
        groups.get(groupKey).variants.push(e);
    }

    return Array.from(groups.values());
};

// ================= SEED LOGIC =================
const seedProductGroup = async (group, firstImageOfCategory) => {
    let infoBase = group.variants[0].info; // Lấy info của biến thể đầu tiên làm gốc
    let sp_ten = group.baseName; 
    sp_ten = cat(sp_ten, CONFIG.SP_TEN_MAX);

    const dmsp_ma = await getOrCreateDanhMuc(group.category, firstImageOfCategory);
    
    // Lấy mô tả từ biến thể gốc
    let sp_mota = infoBase.description || '';
    if (infoBase.specs && Object.keys(infoBase.specs).length > 0) {
        const specsText = Object.entries(infoBase.specs).map(([k, v]) => `${k}: ${v}`).join('\n');
        sp_mota = sp_mota ? `${sp_mota}\n\n${specsText}` : specsText;
    }
    sp_mota = cat(sp_mota, 2000);

    console.log(`\n* SẢN PHẨM: ${sp_ten} [${group.category}] (${group.variants.length} biến thể)`);

    let sp_ma = null;
    let taoMoi = false;

    const found = await pool.query('SELECT sp_ma FROM sanpham WHERE gh_ma = $1 AND sp_ten = $2', [CONFIG.GH_MA, sp_ten]);
    
    if (found.rows.length > 0) {
        sp_ma = found.rows[0].sp_ma;
        console.log(`  - Đã có sản phẩm: ${sp_ma}`);
    } else if (!IS_DRY_RUN) {
        const sp = await SanPhamService.create({
            sp_ten: sp_ten,
            sp_mota: sp_mota,
            gh_ma: CONFIG.GH_MA,
            th_ma: CONFIG.TH_MA,
            dmsp_ma: dmsp_ma
        });
        sp_ma = sp.sp_ma;
        taoMoi = true;
        console.log(`  + Tạo mới sản phẩm: ${sp_ma}`);
    } else {
        sp_ma = 'SP_DRY_RUN';
        logPayload(`Tạo mới SẢN PHẨM`, {
            sp_ten: sp_ten, sp_mota: sp_mota, gh_ma: CONFIG.GH_MA, th_ma: CONFIG.TH_MA, dmsp_ma: dmsp_ma
        });
    }

    let soChiTietTao = 0;
    const daDungCT = new Set();

    const layAnh = memo(() => {
        const anhFiles = chonAnh(infoBase, group.variants[0].dir);
        return copyAnh(anhFiles);
    });

    for (const v of group.variants) {
        const info = v.info;
        let ctsp_ten = 'Mặc định';

        // 1. Thử lấy tên từ Options trước
        for (const opt of info.options || []) {
            for (const val of opt.values || []) {
                if (val.url && val.url.includes(info.url.split('?')[0])) {
                    ctsp_ten = val.name;
                    break;
                }
            }
            if (ctsp_ten !== 'Mặc định') break;
        }

        // 2. Nếu không có options, tự cắt tên gốc ra khỏi tên đầy đủ
        if (ctsp_ten === 'Mặc định') {
            let remain = info.name.replace(sp_ten, '').replace(/^[\s\-|]+|[\s\-|]+$/g, '').trim();
            if (remain) {
                ctsp_ten = remain;
            } else {
                // Nếu cắt không được (do tên gốc và tên đầy đủ khác nhau đôi chút), dùng thuật toán so sánh
                // Ví dụ: Base = "MacBook Air M5", Full = "MacBook Air 13 inch M5 16GB/512GB 30W"
                // Ta sẽ dùng regex để bắt các cụm từ (16GB/512GB, 30W, 13 inch)
                let cleanFull = info.name;
                // Tìm các cụm giống cấu hình/dung lượng/kích thước để làm tên CT
                const matchConfig = info.name.match(/(\d+(GB|TB).*|WiFi.*|5G.*|GPS.*|viền.*|dây.*)/i);
                if (matchConfig) ctsp_ten = matchConfig[0];
            }
        }

        ctsp_ten = cat(ctsp_ten, 255);
        if (daDungCT.has(ctsp_ten)) ctsp_ten = `${ctsp_ten} (${daDungCT.size + 1})`;
        daDungCT.add(ctsp_ten);

        const gb_gia = Math.round(Number(info.price) || 0);
        if (!gb_gia) continue;

        const conHang = !/hết hàng|ngừng kinh doanh|out of stock/i.test(info.availability || '');
        const ton = conHang ? CONFIG.SOLUONG_TON : 0;

        if (sp_ma && !IS_DRY_RUN) {
            const ex = await pool.query('SELECT ctsp_ma FROM chitietsanpham WHERE sp_ma = $1 AND ctsp_ten = $2', [sp_ma, ctsp_ten]);
            if (ex.rows.length > 0) {
                console.log(`    - ${ctsp_ten}: Đã tồn tại trong DB`);
                continue;
            }
        }

        if (IS_DRY_RUN) {
            console.log(`    + Sẽ tạo CT: ${ctsp_ten.padEnd(20)} | Giá: ${gb_gia.toString().padEnd(10)} | Tồn: ${ton}`);
            continue;
        }

        try {
            const ct = await ChiTietSanPhamService.create({
                sp_ma: sp_ma,
                ctsp_ten: ctsp_ten,
                ctsp_mota: sp_mota,
                ctsp_soluongton: ton,
                ctsp_khoiluong: CONFIG.KHOILUONG_MACDINH,
                nh_ma: CONFIG.NH_MA,
                gb_gia: gb_gia,
                images: layAnh().map(x => ({ ...x })),
                thuoctinh: []
            });
            soChiTietTao++;
            console.log(`    + Đã thêm CT: ${ct.ctsp_ma} (${ctsp_ten})`);
        } catch (err) {
            console.error(`    [!] Lỗi thêm CT ${ctsp_ten}: ${err.message}`);
        }
    }

    if (taoMoi && soChiTietTao === 0 && !IS_DRY_RUN) {
        await SanPhamService.delete(sp_ma).catch(() => {});
    }
};

// ================= CHẠY CHÍNH =================
(async () => {
    let tongNhom = 0, loi = 0;
    try {
        console.log(`== BẮT ĐẦU SEED TOPZONE ${IS_DRY_RUN ? '(DRY RUN - TEST)' : '(APPLY - GHI DB)'} ==`);
        console.log(`Thư mục dữ liệu: ${CONFIG.PRODUCTS_DIR}\n`);

        const list = docThuMuc();
        if (!list.length) return console.log('Không tìm thấy dữ liệu hợp lệ.');

        const groups = groupSanPham(list);
        const limitedGroups = LIMIT > 0 ? groups.slice(0, LIMIT) : groups;
        
        console.log(`Tìm thấy ${list.length} file info.json, GỘP THÔNG MINH THÀNH ${groups.length} sản phẩm.`);
        if (LIMIT > 0) console.log(`(Chỉ chạy ${limitedGroups.length} sản phẩm do có flag --limit)`);

        // Tìm ảnh đại diện cho danh mục
        const categoryImages = {};
        for (const g of limitedGroups) {
            if (!categoryImages[g.category]) {
                const files = chonAnh(g.variants[0].info, g.variants[0].dir);
                if (files.length > 0) {
                    const copied = copyAnh([files[0]]);
                    categoryImages[g.category] = copied[0].hasp_link;
                } else {
                    categoryImages[g.category] = null;
                }
            }
        }

        console.log(`\n--- KIỂM TRA DANH MỤC SẼ DÙNG ---`);
        const uniqueCategories = [...new Set(limitedGroups.map(g => g.category))];
        for (const c of uniqueCategories) {
            await getOrCreateDanhMuc(c, categoryImages[c]);
        }
        console.log(`--------------------------------\n`);

        for (const [i, group] of limitedGroups.entries()) {
            try {
                console.log(`[${i + 1}/${limitedGroups.length}]`);
                await seedProductGroup(group, categoryImages[group.category]);
                tongNhom++;
            } catch (err) {
                loi++;
                console.error(`  [LỖI] Không thể seed nhóm ${group.category}: ${err.message}`);
            }
        }

        console.log(`\n== HOÀN THÀNH: Xử lý ${tongNhom} sản phẩm, ${loi} lỗi. ==`);
    } catch (e) {
        console.error('\n[LỖI CHÍ MẠNG]:', e.message);
    } finally {
        await pool.end();
    }
})();