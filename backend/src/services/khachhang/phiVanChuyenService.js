const pool = require('../../config/db');

const PhiVanChuyenService = {
    calculateShippingFee: async (gh_ma, xa_ma_nhan, items) => {
        console.log(`\n📦 =======================================================`);
        console.log(`📦 TÍNH PHÍ VẬN CHUYỂN CHO SHOP: ${gh_ma}`);
        console.log(`📦 =======================================================`);

        try {
            // BƯỚC 0: TỰ ĐỘNG TÍNH TỔNG KHỐI LƯỢNG (MAX THỰC TẾ & THỂ TÍCH)
            let totalWeight = 0;
            const weightLog = [];

            for (const item of items) {
                const prodQuery = `SELECT * FROM chitietsanpham WHERE ctsp_ma = $1`;
                const prodRes = await pool.query(prodQuery, [item.ctsp_ma]);
                
                if (prodRes.rows.length === 0) throw new Error(`Không tìm thấy sản phẩm ${item.ctsp_ma}`);
                
                const prod = prodRes.rows[0];
                const actualWeight = prod.ctsp_khoiluong ? Number(prod.ctsp_khoiluong) : 1;
                
                // Kích thước (cm) - Tự động fallback về 0 nếu không có cột
                const d = prod.ctsp_chieudai ? Number(prod.ctsp_chieudai) : 0;
                const r = prod.ctsp_chieurong ? Number(prod.ctsp_chieurong) : 0;
                
                // ✅ CẬP NHẬT: Chỉ tính Dài x Rộng (Bỏ chiều cao) / 6000
                const volumeWeight = (d * r) / 6000;
                
                // Lấy MAX giữa thực tế và thể tích
                const finalItemWeight = Math.max(actualWeight, volumeWeight);
                
                totalWeight += (finalItemWeight * item.soluong);
                
                weightLog.push({
                    "Sản phẩm": prod.ctsp_ten,
                    "KL Thực tế": `${actualWeight} kg`,
                    "Kích thước": `${d}x${r} cm`,
                    "KL Thể tích": `${volumeWeight.toFixed(2)} kg`,
                    "=> KL Áp dụng": `${finalItemWeight.toFixed(2)} kg`
                });
            }

            console.log(`⚖️ [BẢNG TÍNH KHỐI LƯỢNG CHO SHOP: ${gh_ma}]`, weightLog);
            console.log(`👉 TỔNG KHỐI LƯỢNG TÍNH TOÁN: ${totalWeight.toFixed(2)} kg`);

            // BƯỚC 1: Lấy ĐVVC và Xã của Shop
            const shopInfoQuery = `
                SELECT 
                    (SELECT dvvc_ma FROM gianhang_donvivanchuyen WHERE gh_ma = $1 LIMIT 1) AS dvvc_ma,
                    (SELECT d.xa_ma FROM gianhang g JOIN diachi d ON g.dc_ma = d.dc_ma WHERE g.gh_ma = $1 LIMIT 1) AS xa_ma_shop,
                    (SELECT d.dc_ma FROM gianhang g JOIN diachi d ON g.dc_ma = d.dc_ma WHERE g.gh_ma = $1 LIMIT 1) AS dc_layhangma
            `;
            const shopInfoRes = await pool.query(shopInfoQuery, [gh_ma]);
            const shopInfo = shopInfoRes.rows[0];

            if (!shopInfo || !shopInfo.dvvc_ma || !shopInfo.xa_ma_shop) {
                throw new Error(`Không tìm thấy ĐVVC hoặc địa chỉ của Shop ${gh_ma}`);
            }
            const { dvvc_ma, xa_ma_shop, dc_layhangma } = shopInfo;

            // BƯỚC 2: Lấy Khu vực & Miền của Khách và Shop
            const infoQuery = `
                SELECT 
                    (SELECT kvvc_ma FROM xaphuong WHERE xa_ma = $1) AS kvvc_khach,
                    (SELECT t.mien_ma FROM xaphuong x JOIN tinhtp t ON x.tinh_ma = t.tinh_ma WHERE x.xa_ma = $1) AS mien_khach,
                    (SELECT kvvc_ma FROM xaphuong WHERE xa_ma = $2) AS kvvc_shop,
                    (SELECT t.mien_ma FROM xaphuong x JOIN tinhtp t ON x.tinh_ma = t.tinh_ma WHERE x.xa_ma = $2) AS mien_shop
            `;
            const infoRes = await pool.query(infoQuery, [xa_ma_nhan, xa_ma_shop]);
            const info = infoRes.rows[0];

            if (!info || !info.kvvc_khach || !info.kvvc_shop) {
                throw new Error("Không tìm thấy thông tin khu vực vận chuyển.");
            }

            // BƯỚC 3: Xác định Tuyến
            const isNoiMien = info.mien_shop === info.mien_khach;
            const tvc_ten = isNoiMien ? 'Nội miền' : 'Liên miền'; 
            
            const tuyenRes = await pool.query(`SELECT tvc_ma FROM tuyenvanchuyen WHERE tvc_ten ILIKE $1 LIMIT 1`, [`%${tvc_ten}%`]);
            if (tuyenRes.rows.length === 0) throw new Error("Không tìm thấy tuyến vận chuyển phù hợp.");
            const tvc_ma = tuyenRes.rows[0].tvc_ma;

            // BƯỚC 4: Xác định Mốc khối lượng
            const klRes = await pool.query(`
                SELECT klkh_ma, klkh_ten, klkh_trongluongmin, klkh_trongluongmax 
                FROM khoiluongkienhang
                WHERE $1 >= klkh_trongluongmin 
                  AND ($1 <= klkh_trongluongmax OR klkh_trongluongmax IS NULL OR klkh_trongluongmax = 0)
                ORDER BY klkh_trongluongmin DESC LIMIT 1
            `, [totalWeight]);

            if (klRes.rows.length === 0) throw new Error("Không tìm thấy mốc khối lượng phù hợp.");
            
            const khoiLuongData = klRes.rows[0];
            const klkh_ma = khoiLuongData.klkh_ma;

            // BƯỚC 5: Tra giá và tính toán
            let finalFee = 0;
            let logExplanation = "";

            if (khoiLuongData.klkh_trongluongmax === null || Number(khoiLuongData.klkh_trongluongmax) === 0) {
                // Trường hợp mốc Max = Null (Mỗi 0.5kg tiếp theo)
                const giaNullRes = await pool.query(`
                    SELECT cpvc_gia FROM cuocphivanchuyen 
                    WHERE dvvc_ma = $1 AND kvvc_ma = $2 AND tvc_ma = $3 AND klkh_ma = $4
                `, [dvvc_ma, info.kvvc_khach, tvc_ma, klkh_ma]);
                const giaBlock = giaNullRes.rows.length > 0 ? Number(giaNullRes.rows[0].cpvc_gia) : 0;

                const klTruocRes = await pool.query(`SELECT klkh_ma FROM khoiluongkienhang WHERE klkh_trongluongmax = $1`, [khoiLuongData.klkh_trongluongmin]);
                let giaCoBan = 0;
                if (klTruocRes.rows.length > 0) {
                    const giaTruocRes = await pool.query(`
                        SELECT cpvc_gia FROM cuocphivanchuyen 
                        WHERE dvvc_ma = $1 AND kvvc_ma = $2 AND tvc_ma = $3 AND klkh_ma = $4
                    `, [dvvc_ma, info.kvvc_khach, tvc_ma, klTruocRes.rows[0].klkh_ma]);
                    giaCoBan = giaTruocRes.rows.length > 0 ? Number(giaTruocRes.rows[0].cpvc_gia) : 0;
                }

                const kgVuot = totalWeight - Number(khoiLuongData.klkh_trongluongmin);
                const soBlock = Math.ceil(kgVuot / 0.5);
                finalFee = giaCoBan + (soBlock * giaBlock);
                logExplanation = `Rơi vào mốc [${khoiLuongData.klkh_ten}]. Cước cơ bản: ${giaCoBan.toLocaleString('vi-VN')}đ + (${soBlock} block x ${giaBlock.toLocaleString('vi-VN')}đ) = ${finalFee.toLocaleString('vi-VN')}đ`;
            } else {
                const giaRes = await pool.query(`
                    SELECT cpvc_gia FROM cuocphivanchuyen 
                    WHERE dvvc_ma = $1 AND kvvc_ma = $2 AND tvc_ma = $3 AND klkh_ma = $4
                `, [dvvc_ma, info.kvvc_khach, tvc_ma, klkh_ma]);
                finalFee = giaRes.rows.length > 0 ? Number(giaRes.rows[0].cpvc_gia) : 0;
                logExplanation = `Rơi vào mốc [${khoiLuongData.klkh_ten}]. Tính giá cố định: ${finalFee.toLocaleString('vi-VN')}đ`;
            }

            console.log(` 5️⃣ Cách tính: ${logExplanation}`);
            console.log(` 💰 [KẾT QUẢ SHOP NÀY]: ${finalFee.toLocaleString('vi-VN')} đ`);
            console.log(`📦 =======================================================\n`);

            // ✅ TRẢ VỀ THÊM THÔNG TIN CHO FRONTEND ĐỂ LƯU ĐƠN HÀNG
            return {
                shippingFee: finalFee,
                dvvc_ma: dvvc_ma,
                klkh_ma: klkh_ma,
                dc_layhangma: dc_layhangma 
            };

        } catch (error) {
            console.log(` ❌ [LỖI TÍNH PHÍ SHOP ${gh_ma}]: ${error.message}`);
            console.log(`📦 =======================================================\n`);
            throw error;
        }
    }
};

module.exports = PhiVanChuyenService;