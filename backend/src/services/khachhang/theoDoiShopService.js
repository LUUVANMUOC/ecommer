// backend/src/services/khachhang/theoDoiShopService.js
const TheoDoiShopModel = require('../../models/khachhang/theoDoiShopModel');

const TheoDoiShopService = {
  toggleFollow: async (kh_ma, gh_ma) => {
    if (!kh_ma || !gh_ma) throw new Error('Thiếu thông tin khách hàng hoặc gian hàng!');
    const isFollowing = await TheoDoiShopModel.checkFollow(kh_ma, gh_ma);
    
    if (isFollowing) {
      await TheoDoiShopModel.unfollow(kh_ma, gh_ma);
      return { message: 'Đã hủy theo dõi', isFollowing: false };
    } else {
      await TheoDoiShopModel.follow(kh_ma, gh_ma);
      return { message: 'Đã theo dõi shop', isFollowing: true };
    }
  },

  checkStatus: async (kh_ma, gh_ma) => {
    if (!kh_ma || !gh_ma) return { isFollowing: false };
    const isFollowing = await TheoDoiShopModel.checkFollow(kh_ma, gh_ma);
    return { isFollowing };
  },

  getFollowedShops: async (kh_ma) => {
    return await TheoDoiShopModel.getFollowedShops(kh_ma);
  }
};

module.exports = TheoDoiShopService;