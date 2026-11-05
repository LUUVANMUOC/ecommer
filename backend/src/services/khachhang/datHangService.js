// backend/src/services/khachhang/datHangService.js
const pool = require('../../config/db');

// Hàm hỗ trợ format tiền tệ
const formatVND = (amount) => Number(amount).toLocaleString('vi-VN') + ' đ';
const formatLog = (title) => `\n================ [ ${title.toUpperCase()} ] ================`;

const DatHangService = {
  calculatePlatformFee: async (client, items) => {
    let totalPlatformFee = 0;
    console.log(`\n   💸 [TÍNH PHÍ SÀN CHO SHOP]`);
    for (const item of items) {
      const query = `
        SELECT p.psck_phantram 
        FROM chitietsanpham ctsp
        LEFT JOIN LATERAL (
            SELECT psck_phantram FROM phisanchieckhau 
            WHERE nh_ma = ctsp.nh_ma 
            ORDER BY psck_thoidiem DESC LIMIT 1
        ) p ON true
        WHERE ctsp.ctsp_ma = $1
      `;
      const res = await client.query(query, [item.ctsp_ma]);
      
      if (res.rows.length > 0 && res.rows[0].psck_phantram) {
        const phantram = Number(res.rows[0].psck_phantram);
        const itemTotal = Number(item.ctsp_gianban) * item.ctgh_soluong;
        const fee = (itemTotal * phantram) / 100;
        totalPlatformFee += fee;
        console.log(`      - Sản phẩm ${item.ctsp_ma}: Đơn giá ${formatVND(item.ctsp_gianban)} x ${item.ctgh_soluong} | Phí sàn ${phantram}% = ${formatVND(fee)}`);
      } else {
        console.log(`      - Sản phẩm ${item.ctsp_ma}: Không cấu hình phí sàn (0%)`);
      }
    }
    console.log(`      => TỔNG PHÍ SÀN SHOP NÀY: ${formatVND(totalPlatformFee)}`);
    return totalPlatformFee;
  },

  createOrder: async (payload) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      console.log(`\n🚀🚀🚀 BẮT ĐẦU QUÁ TRÌNH ĐẶT HÀNG 🚀🚀🚀`);

      // 1. Tạo mã đơn hàng tổng (DM_MA)
      const dmRes = await client.query(`SELECT dm_ma FROM donhangkhachmua ORDER BY dm_ma DESC LIMIT 1`);
      let newDmMa = 'DM00000001';
      if (dmRes.rows.length > 0) {
        const currentNum = parseInt(dmRes.rows[0].dm_ma.replace('DM', ''), 10);
        newDmMa = 'DM' + (currentNum + 1).toString().padStart(8, '0');
      }
      console.log(formatLog('1. TẠO ĐƠN HÀNG TỔNG (DONHANGKHACHMUA)'));
      console.log(`   - Mã đơn tổng mới: ${newDmMa}`);
      console.log(`   - Khách hàng: ${payload.kh_ma} | Địa chỉ: ${payload.ttnh_ma}`);
      console.log(`   - Tổng tiền thanh toán cuối cùng: ${formatVND(payload.finalTotal)}`);

      await client.query(`
        INSERT INTO donhangkhachmua (dm_ma, dm_tongtien, kh_ma, ttnh_ma)
        VALUES ($1, $2, $3, $4)
      `, [newDmMa, payload.finalTotal, payload.kh_ma, payload.ttnh_ma]);
      console.log(`   ✅ Đã insert thành công vào bảng donhangkhachmua.`);

      // ✅ Tự động tính ngày giao hàng dự kiến
      const deliveryDate = new Date();
      deliveryDate.setDate(deliveryDate.getDate() + 5);
      const formattedDeliveryDate = deliveryDate.toISOString().split('T')[0]; 
      console.log(`   - Ngày giao hàng dự kiến (Auto +5 ngày): ${formattedDeliveryDate}`);

      // 3. Duyệt qua từng Shop
      for (const order of payload.orders) {
        console.log(formatLog(`2. XỬ LÝ ĐƠN CỦA SHOP: ${order.gh_ma}`));
        
        const platformFee = await DatHangService.calculatePlatformFee(client, order.items);

        // Tạo mã DTS_MA
        const dtsRes = await client.query(`SELECT dts_ma FROM donhangtheoshop ORDER BY dts_ma DESC LIMIT 1`);
        let newDtsMa = 'DTS0000001';
        if (dtsRes.rows.length > 0) {
          const currentNum = parseInt(dtsRes.rows[0].dts_ma.replace('DTS', ''), 10);
          newDtsMa = 'DTS' + (currentNum + 1).toString().padStart(7, '0');
        }

        // 🚚 BẮT ĐẦU LOG CHI TIẾT PHÍ VẬN CHUYỂN & TÍNH TOÁN
        console.log(`   🚚 [CHI TIẾT PHÍ VẬN CHUYỂN & TỔNG TIỀN SHOP NÀY]`);
        console.log(`      - Tiền hàng gốc (SubTotal): ${formatVND(order.subTotal)}`);
        console.log(`      - Giảm giá từ Shop (Voucher Shop): -${formatVND(order.shopDiscount)}`);
        
        console.log(`      - Phí vận chuyển gốc (Trước giảm giá): ${formatVND(order.originalShippingFee || 'Không có dữ liệu')}`);
        console.log(`      - Giảm giá vận chuyển (Voucher VC): -${formatVND(order.shippingDiscount)}`);
        console.log(`      - Phí vận chuyển THỰC TẾ KHÁCH PHẢI TRẢ (finalShippingFee): ${formatVND(order.finalShippingFee)}`);
        
        if (order.voucherVC) {
          console.log(`      - Mã Voucher Vận chuyển áp dụng: ${order.voucherVC}`);
        }
        
        console.log(`      - Cân nặng (klkh_ma): ${order.klkh_ma} | ĐVVC: ${order.dvvc_ma}`);

        // Công thức tính tổng tiền khách phải trả cho Shop này:
        const finalAmountForShop = order.subTotal - order.shopDiscount + order.finalShippingFee;

        console.log(`      ------------------------------------------------`);
        console.log(`      💰 CÔNG THỨC: (Tiền hàng) - (Giảm giá Shop) + (Phí Ship Thực Tế)`);
        console.log(`      💰 TÍNH TOÁN: ${formatVND(order.subTotal)} - ${formatVND(order.shopDiscount)} + ${formatVND(order.finalShippingFee)}`);
        console.log(`      => TỔNG KHÁCH TRẢ CHO SHOP NÀY: ${formatVND(finalAmountForShop)}`);
        console.log(`      ------------------------------------------------`);
        // 🚚 KẾT THÚC LOG CHI TIẾT

        await client.query(`
          INSERT INTO donhangtheoshop (
            dts_ma, dts_thoidiemdukiengiao, dts_ghichu, 
            dts_tongtienhang, dts_tienvanchuyen, dts_tongtiengiamgia, 
            dts_tongtienkhachhangthanhtoan, dts_tongtienphisan, 
            dm_ma, gh_ma, mgg_shop_ma, mgg_vc_ma, 
            klkh_ma, dc_layhangma, dvvc_ma
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        `, [
          newDtsMa, formattedDeliveryDate, payload.note,
          order.subTotal, order.finalShippingFee, order.shopDiscount + order.shippingDiscount,
          finalAmountForShop, platformFee,
          newDmMa, order.gh_ma, 
          order.voucherShop || null, 
          order.voucherVC || null,
          order.klkh_ma, order.dc_layhangma, order.dvvc_ma
        ]);
        console.log(`   ✅ Đã insert thành công vào bảng donhangtheoshop.`);

        // 4. Insert chi tiết món hàng & Cập nhật kho
        console.log(`   🔄 [CHI TIẾT MÓN HÀNG & CẬP NHẬT KHO]`);
        for (const item of order.items) {
          await client.query(`
            INSERT INTO chitietdonhang (dts_ma, ctsp_ma, ctdh_soluong, ctdh_dongia, ctdh_thanhtien)
            VALUES ($1, $2, $3, $4, $5)
          `, [newDtsMa, item.ctsp_ma, item.ctgh_soluong, item.ctsp_gianban, item.ctsp_gianban * item.ctgh_soluong]);

          // Lấy tồn kho và lượt mua cũ
          const prodInfo = await client.query(`SELECT ctsp_soluongton, ctsp_luotmua FROM chitietsanpham WHERE ctsp_ma = $1`, [item.ctsp_ma]);
          const oldStock = prodInfo.rows[0].ctsp_soluongton;
          const oldSold = prodInfo.rows[0].ctsp_luotmua;

          // Trừ tồn kho, cộng lượt mua
          await client.query(`
            UPDATE chitietsanpham 
            SET ctsp_soluongton = ctsp_soluongton - $1,
                ctsp_luotmua = ctsp_luotmua + $1
            WHERE ctsp_ma = $2
          `, [item.ctgh_soluong, item.ctsp_ma]);

          console.log(`      - Món ${item.ctsp_ma} (${item.ctsp_ten}):`);
          console.log(`        + Tồn kho: ${oldStock} -> Mua ${item.ctgh_soluong} -> CÒN LẠI: ${oldStock - item.ctgh_soluong}`);
          console.log(`        + Lượt mua: ${oldSold} -> CỘNG THÊM ${item.ctgh_soluong} -> TỔNG: ${oldSold + item.ctgh_soluong}`);

          // Xóa khỏi giỏ hàng
          await client.query(`
            DELETE FROM chitietgiohang 
            WHERE kh_ma = $1 AND ctsp_ma = $2
          `, [payload.kh_ma, item.ctsp_ma]);
          console.log(`        + Đã xóa món này khỏi giỏ hàng của khách.`);
        }

        // 5. Cập nhật số lượng Voucher Shop
        if (order.voucherShop) {
          const vcShopInfo = await client.query(`SELECT mgg_shop_soluongconlai FROM magiamgia_shop WHERE mgg_shop_ma = $1`, [order.voucherShop]);
          const oldVcShopQty = vcShopInfo.rows[0].mgg_shop_soluongconlai;
          
          await client.query(`
            UPDATE magiamgia_shop 
            SET mgg_shop_soluongconlai = mgg_shop_soluongconlai - 1 
            WHERE mgg_shop_ma = $1
          `, [order.voucherShop]);
          
          console.log(`   🎟️ [VOUCHER SHOP] Mã ${order.voucherShop}: Số lượng ${oldVcShopQty} -> CÒN LẠI: ${oldVcShopQty - 1}`);
        }

        // 6. Cập nhật số lượng Voucher Vận chuyển
        if (order.voucherVC) {
          const vcInfo = await client.query(`SELECT mgg_vc_soluongconlai FROM magiamgia_vanchuyen WHERE mgg_vc_ma = $1`, [order.voucherVC]);
          const oldVcQty = vcInfo.rows[0].mgg_vc_soluongconlai;
          
          await client.query(`
            UPDATE magiamgia_vanchuyen 
            SET mgg_vc_soluongconlai = mgg_vc_soluongconlai - 1 
            WHERE mgg_vc_ma = $1
          `, [order.voucherVC]);
          
          console.log(`   🚚 [VOUCHER VẬN CHUYỂN] Mã ${order.voucherVC}: Số lượng ${oldVcQty} -> CÒN LẠI: ${oldVcQty - 1}`);
        }

        // 7. Thêm lịch sử trạng thái đơn hàng (TTDH01)
        await client.query(`
          INSERT INTO chitiettrangthaidonhang (dts_ma, ttdh_ma, ctttdh_thoidiem, ctttdh_ghichu)
          VALUES ($1, $2, NOW(), $3)
        `, [newDtsMa, 'TTDH01', 'Khách hàng đặt đơn']);
        console.log(`   📝 Đã thêm lịch sử trạng thái: TTDH01 (Chờ Xác Nhận).`);
      }

      await client.query('COMMIT');
      console.log(`\n✅✅✅ [THÀNH CÔNG] ĐÃ COMMIT TOÀN BỘ ĐƠN HÀNG ${newDmMa} VÀO DATABASE! ✅✅✅\n`);
      return { message: "Đặt hàng thành công!", dm_ma: newDmMa };
      
    } catch (error) {
      await client.query('ROLLBACK');
      console.error(`\n❌❌❌ [LỖI NGHIÊM TRỌNG] ĐÃ ROLLBACK TOÀN BỘ QUÁ TRÌNH ĐẶT HÀNG! ❌❌❌`);
      console.error(`Chi tiết lỗi:`, error);
      throw error;
    } finally {
      client.release();
    }
  }
};

module.exports = DatHangService;