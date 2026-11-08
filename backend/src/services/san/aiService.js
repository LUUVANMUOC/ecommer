// backend/src/services/san/aiService.js
const OpenAI = require('openai');

const openai = new OpenAI({
  baseURL: 'https://api.groq.com/openai/v1',
  apiKey: process.env.GROQ_API_KEY,
});

const AIService = {
  goiYSanPham: async (searchQuery, danhSachSanPham) => {
    if (!searchQuery || !Array.isArray(danhSachSanPham) || danhSachSanPham.length === 0) {
      return danhSachSanPham || [];
    }

    console.log(`\n========== [AI SERVICE BẮT ĐẦU] ==========`);
    console.log(`🔍 Từ khóa khách tìm: "${searchQuery}"`);
    console.log(`📦 Tổng số sản phẩm truyền vào AI: ${danhSachSanPham.length}`);

    try {
      const productsForAI = danhSachSanPham.map(p => ({
        id: String(p.sp_ma),
        ten: p.sp_ten,
        gia: `${p.min_price} - ${p.max_price} VNĐ`,
        danhMuc: p.dmsp_ten || "Khác"
      }));

      const prompt = `
        Bạn là một chuyên gia tư vấn bán hàng.
        Khách hàng đang tìm kiếm: "${searchQuery}"
        Danh sách sản phẩm có sẵn: ${JSON.stringify(productsForAI)}
        
        Hãy chọn ra tối đa 5 sản phẩm phù hợp nhất.
        Trả về kết quả dưới dạng json object với key là "ids", chứa mảng các ID sản phẩm (id), xếp theo thứ tự ưu tiên giảm dần.
        KHÔNG giải thích gì thêm. 
        Ví dụ định dạng trả về: {"ids": ["1", "5", "12"]}
      `;

      console.log(`⏳ Đang gửi request lên Groq API...`);
      
      const completion = await openai.chat.completions.create({
        model: 'openai/gpt-oss-120b', 
        messages: [
          { role: 'system', content: 'Bạn là trợ lý ảo chuyên nghiệp, chỉ trả về định dạng json object.' },
          { role: 'user', content: prompt }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.2,
      });

      const aiText = completion.choices[0].message.content;
      
      // LOG 1: Xem AI trả về chuỗi JSON gì
      console.log(`✅ [Groq trả lời - Raw Text]:`, aiText);

      let topIds = [];
      try {
        const parsed = JSON.parse(aiText);
        topIds = parsed.ids || [];
        if (!Array.isArray(topIds)) topIds = []; 
        topIds = topIds.map(String).slice(0, 5); 
        
        // LOG 2: Xem mảng ID sau khi đã bóc tách
        console.log(`🎯 [Các ID sản phẩm AI chọn]:`, topIds);
        
      } catch (e) {
        console.error("❌ Lỗi parse JSON từ Groq. AI trả về không phải JSON hợp lệ:", e);
        return danhSachSanPham;
      }

      const sortedProducts = [];
      topIds.forEach(id => {
        const product = danhSachSanPham.find(p => String(p.sp_ma) === id);
        if (product) sortedProducts.push(product);
      });

      const otherProducts = danhSachSanPham.filter(p => !topIds.includes(String(p.sp_ma)));
      
      // LOG 3: Xem tên các sản phẩm được đẩy lên đầu
      const topNames = sortedProducts.map(p => p.sp_ten).join(', ');
      console.log(`🌟 [Sản phẩm được đẩy lên đầu]:`, topNames || "Không có sản phẩm nào khớp ID!");
      console.log(`========== [AI SERVICE KẾT THÚC] ==========\n`);

      return [...sortedProducts, ...otherProducts];

    } catch (error) {
      console.error("❌ [Lỗi gọi Groq API]:", error.response?.data || error.message);
      console.log(`========== [AI SERVICE KẾT THÚC DO LỖI] ==========\n`);
      return danhSachSanPham; 
    }
  }
};

module.exports = AIService;