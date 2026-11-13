// src/pages/khachhang/ThanhToan.jsx
import { useState, useEffect, useContext, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AuthContext } from "../../contexts/AuthContext";
import axiosClient from "../../config/axiosClient";
import thongTinNhanHangService from "../../services/khachhang/thongTinNhanHangService";
import thanhToanService from "../../services/khachhang/thanhToanService";
import maGiamGiaVanChuyenService from "../../services/khachhang/maGiamGiaVanChuyenService";
import maGiamGiaShopService from "../../services/khachhang/maGiamGiaShopService";
import { formatVND } from "../../components/shop/SanPhamShared";
import ToastNotification from "../../components/common/Crud/ToastNotification";
import CustomerHeader from "../../components/common/CustomerHeader";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8080";

const EMPTY_ADDRESS_FORM = {
  ttnh_ma: "",
  ttnh_tennguoinhan: "",
  ttnh_sdt: "",
  tinh_ma: "",
  xa_ma: "",
  dc_mota: "",
  ttnh_ghichu: "",
  ttnh_macdinh: false,
};

const ThanhToan = () => {
  const { user } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();

  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });
  const checkoutItems = location.state?.checkoutItems || [];

  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [loadingAddress, setLoadingAddress] = useState(true);

  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [addressFormData, setAddressFormData] = useState(EMPTY_ADDRESS_FORM);
  const [tinhs, setTinhs] = useState([]);
  const [xas, setXas] = useState([]);
  const [savingAddress, setSavingAddress] = useState(false);

  const [note, setNote] = useState("");
  // ✅ Đã xóa state deliveryDate vì Backend sẽ tự tính
  const [paymentMethod, setPaymentMethod] = useState("COD");

  const [shippingVouchers, setShippingVouchers] = useState([]);
  const [selectedVCs, setSelectedVCs] = useState({});

  const [shopVouchers, setShopVouchers] = useState({});
  const [selectedShopVCs, setSelectedShopVCs] = useState({});

  const [isShopVCModalOpen, setIsShopVCModalOpen] = useState(false);
  const [isVCModalOpen, setIsVCModalOpen] = useState(false);
  const [activeShop, setActiveShop] = useState(null);

  const [shopOrders, setShopOrders] = useState([]);
  const [loadingFee, setLoadingFee] = useState(false);

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast((p) => ({ ...p, show: false })), 3000);
  };

  useEffect(() => {
    const fetchInitData = async () => {
      try {
        const [resTinh, resXa, resVCs] = await Promise.all([
          axiosClient.get("/tinh"),
          axiosClient.get("/xa"),
          maGiamGiaVanChuyenService.getActiveVouchers(),
        ]);
        setTinhs(resTinh.data);
        setXas(resXa.data);
        setShippingVouchers(resVCs.data);
      } catch (err) {
        console.error("Lỗi tải dữ liệu khởi tạo", err);
      }
    };
    fetchInitData();
  }, []);

  const fetchAddresses = async () => {
    if (!user?.kh_ma) return;
    try {
      const res = await thongTinNhanHangService.getAll(user.kh_ma);
      const data = res.data;
      setAddresses(data);
      if (data.length > 0) {
        const exists = data.find((a) => a.ttnh_ma === selectedAddressId);
        if (!exists) {
          const defaultAddr =
            data.find((a) => a.ttnh_macdinh === true) || data[0];
          setSelectedAddressId(defaultAddr.ttnh_ma);
        }
      } else {
        setSelectedAddressId("");
      }
    } catch (err) {
      showToast("Lỗi tải sổ địa chỉ", "error");
    } finally {
      setLoadingAddress(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, [user]);

  useEffect(() => {
    if (checkoutItems.length === 0) {
      showToast("Không có sản phẩm để thanh toán!", "error");
      navigate("/khach-hang/gio-hang");
    }
  }, [checkoutItems, navigate]);

  useEffect(() => {
    const fetchShippingData = async () => {
      if (!selectedAddressId || checkoutItems.length === 0) return;

      const selectedAddr = addresses.find(
        (a) => a.ttnh_ma === selectedAddressId,
      );
      if (!selectedAddr) return;

      setLoadingFee(true);
      try {
        const ordersData = await thanhToanService.calculateShippingForShops(
          checkoutItems,
          selectedAddr,
        );
        setShopOrders(ordersData);
      } catch (err) {
        console.error("Lỗi tính phí ship:", err.response?.data || err.message);
        showToast("Không thể tính phí vận chuyển cho địa chỉ này", "error");
        setShopOrders([]);
      } finally {
        setLoadingFee(false);
      }
    };

    fetchShippingData();
  }, [selectedAddressId, addresses, checkoutItems]);

  useEffect(() => {
    const fetchShopVouchers = async () => {
      if (shopOrders.length === 0) return;
      const vouchersMap = {};
      await Promise.all(
        shopOrders.map(async (order) => {
          try {
            const res = await maGiamGiaShopService.getActiveVouchersByShop(
              order.gh_ma,
            );
            vouchersMap[order.gh_ma] = res.data;
          } catch (error) {
            vouchersMap[order.gh_ma] = [];
          }
        }),
      );
      setShopVouchers(vouchersMap);
    };
    fetchShopVouchers();
  }, [shopOrders]);

  const handleOpenAddressModal = (e, addr = null) => {
    e.stopPropagation();
    if (addr) {
      setIsEditingAddress(true);
      setAddressFormData({
        ...addr,
        tinh_ma: addr.tinh_ma || "",
        xa_ma: addr.xa_ma || "",
        ttnh_ghichu: addr.ttnh_ghichu || addr.ttnh_mota || "",
      });
    } else {
      setIsEditingAddress(false);
      setAddressFormData({
        ...EMPTY_ADDRESS_FORM,
        ttnh_tennguoinhan: user?.kh_ten || "",
        ttnh_sdt: user?.kh_sdt || "",
      });
    }
    setIsAddressModalOpen(true);
  };

  const handleSaveAddress = async (e) => {
    e.preventDefault();
    if (!addressFormData.tinh_ma || !addressFormData.xa_ma)
      return showToast("Chọn đầy đủ Tỉnh/Xã!", "error");
    setSavingAddress(true);
    const payload = { kh_ma: user.kh_ma, ...addressFormData };
    try {
      if (isEditingAddress)
        await thongTinNhanHangService.update(addressFormData.ttnh_ma, payload);
      else await thongTinNhanHangService.create(payload);
      showToast("Lưu địa chỉ thành công!");
      setIsAddressModalOpen(false);
      fetchAddresses();
    } catch (err) {
      showToast("Lỗi lưu địa chỉ", "error");
    } finally {
      setSavingAddress(false);
    }
  };

  const handleDeleteAddress = async (e, ttnh_ma) => {
    e.stopPropagation();
    if (!window.confirm("Xóa địa chỉ này?")) return;
    await thongTinNhanHangService.delete(ttnh_ma);
    showToast("Đã xóa!");
    fetchAddresses();
  };

  const filteredXas = useMemo(
    () =>
      xas.filter(
        (xa) => String(xa.tinh_ma) === String(addressFormData.tinh_ma),
      ),
    [xas, addressFormData.tinh_ma],
  );

  const calculatedShopOrders = useMemo(() => {
    return shopOrders.map((order) => {
      const shopVC = selectedShopVCs[order.gh_ma];
      let shopDiscount = 0;
      if (
        shopVC &&
        order.subTotal >= Number(shopVC.MGG_Shop_GiaTriDonToiThieu)
      ) {
        shopDiscount =
          (order.subTotal * Number(shopVC.MGG_Shop_PhanTramGiam)) / 100;
        if (shopVC.MGG_Shop_SoTienToiDaMoiLan > 0)
          shopDiscount = Math.min(
            shopDiscount,
            Number(shopVC.MGG_Shop_SoTienToiDaMoiLan),
          );
        shopDiscount = Math.min(shopDiscount, order.subTotal);
      }

      const vc = selectedVCs[order.gh_ma];
      let shippingDiscount = 0;
      if (vc && order.subTotal >= Number(vc.MGG_VC_GiaTriDonToiThieu)) {
        shippingDiscount =
          (order.shippingFee * Number(vc.MGG_VC_PhanTramGiam)) / 100;
        if (vc.MGG_VC_SoTienToiDaMoiLan > 0)
          shippingDiscount = Math.min(
            shippingDiscount,
            Number(vc.MGG_VC_SoTienToiDaMoiLan),
          );
        shippingDiscount = Math.min(shippingDiscount, order.shippingFee);
      }

      return {
        ...order,
        shopDiscount,
        shippingDiscount,
        finalShippingFee: order.shippingFee - shippingDiscount,
      };
    });
  }, [shopOrders, selectedVCs, selectedShopVCs]);

  const totalItemsPrice = calculatedShopOrders.reduce(
    (sum, order) => sum + order.subTotal,
    0,
  );
  const totalShopDiscount = calculatedShopOrders.reduce(
    (sum, order) => sum + order.shopDiscount,
    0,
  );
  const totalOriginalShipping = calculatedShopOrders.reduce(
    (sum, order) => sum + order.shippingFee,
    0,
  );
  const totalShippingDiscount = calculatedShopOrders.reduce(
    (sum, order) => sum + order.shippingDiscount,
    0,
  );
  const totalFinalShipping = totalOriginalShipping - totalShippingDiscount;

  const finalTotal = Math.max(
    0,
    totalItemsPrice - totalShopDiscount + totalFinalShipping,
  );

  const openShopVCModal = (shop) => {
    setActiveShop(shop);
    setIsShopVCModalOpen(true);
  };
  const openVCModal = (shop) => {
    setActiveShop(shop);
    setIsVCModalOpen(true);
  };

  const handleSelectShopVC = (vc) => {
    setSelectedShopVCs((prev) => ({ ...prev, [activeShop.gh_ma]: vc }));
    setIsShopVCModalOpen(false);
  };
  const handleSelectVC = (vc) => {
    setSelectedVCs((prev) => ({ ...prev, [activeShop.gh_ma]: vc }));
    setIsVCModalOpen(false);
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddressId)
      return showToast("Chọn địa chỉ nhận hàng!", "error");

    const selectedAddress = addresses.find(
      (a) => a.ttnh_ma === selectedAddressId,
    );

    // ✅ Đã xóa deliveryDate khỏi payload
    const orderPayload = {
      kh_ma: user.kh_ma,
      ttnh_ma: selectedAddress.ttnh_ma,
      note,
      paymentMethod,
      finalTotal: finalTotal,
      orders: calculatedShopOrders.map((order) => ({
        gh_ma: order.gh_ma,
        items: order.items,
        subTotal: order.subTotal,
        shopDiscount: order.shopDiscount,
        voucherShop: selectedShopVCs[order.gh_ma]
          ? selectedShopVCs[order.gh_ma].MGG_Shop_Ma
          : null,
        originalShippingFee: order.shippingFee,
        shippingDiscount: order.shippingDiscount,
        finalShippingFee: order.finalShippingFee,
        voucherVC: selectedVCs[order.gh_ma]
          ? selectedVCs[order.gh_ma].MGG_VC_Ma
          : null,
        klkh_ma: order.klkh_ma,
        dc_layhangma: order.dc_layhangma,
        dvvc_ma: order.dvvc_ma,
      })),
    };

    try {
      setLoadingFee(true);
      const res = await axiosClient.post("/khach-hang/dat-hang", orderPayload);
      showToast("Đặt hàng thành công!", "success");
      setTimeout(() => {
        navigate("/");
      }, 1500);
    } catch (error) {
      console.error(error);
      showToast(error.response?.data?.message || "Lỗi khi đặt hàng", "error");
      setLoadingFee(false);
    }
  };

  if (checkoutItems.length === 0) return null;

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-16 font-sans">
      <CustomerHeader pageLabel="Thanh Toán Đơn Hàng" showCart={false} />

      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-[#E2E8F0] p-6">
            <h2 className="text-xl font-bold text-[#0F172A] mb-4 border-b border-[#F1F5F9] pb-3">
              Chi Tiết Đơn Hàng
            </h2>

            <div className="space-y-6 mb-6">
              {loadingFee ? (
                <div className="text-center py-10 text-[#2563EB] font-semibold animate-pulse">
                  <span className="material-symbols-outlined text-4xl mb-2 animate-spin block">
                    autorenew
                  </span>
                  Đang tính phí vận chuyển...
                </div>
              ) : (
                calculatedShopOrders.map((order) => (
                  <div
                    key={order.gh_ma}
                    className="border border-[#E2E8F0] rounded-xl overflow-hidden shadow-sm"
                  >
                    <div className="bg-[#F8FAFC] px-5 py-3 border-b border-[#E2E8F0] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[20px] text-[#2563EB]">
                          storefront
                        </span>
                        <span className="font-bold text-[#0F172A]">
                          {order.gh_ten}
                        </span>
                      </div>
                    </div>

                    <div className="p-5 space-y-4">
                      {order.items.map((item) => (
                        <div
                          key={item.ctsp_ma}
                          className="flex gap-4 items-center text-sm"
                        >
                          <img
                            src={`${BACKEND_URL}${item.image}`}
                            className="w-16 h-16 rounded-xl object-cover border border-[#E2E8F0]"
                            alt=""
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-[#0F172A] text-base line-clamp-1">
                              {item.sp_ten}
                            </p>
                            <p className="text-[#64748B] text-sm mt-1">
                              Phân loại: {item.ctsp_ten}
                            </p>
                            <p className="text-[#64748B] text-sm">
                              Số lượng: {item.ctgh_soluong}
                            </p>
                          </div>
                          <p className="font-bold text-[#DC2626] text-lg">
                            {formatVND(item.ctsp_gianban * item.ctgh_soluong)}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="bg-gray-50 px-5 py-4 border-t border-[#E2E8F0] space-y-3 text-sm">
                      <div className="flex justify-between text-[#64748B]">
                        <span>Tạm tính ({order.items.length} sản phẩm):</span>
                        <span className="font-semibold text-[#0F172A]">
                          {formatVND(order.subTotal)}
                        </span>
                      </div>

                      <div className="flex flex-col gap-2 mt-3 pt-3 border-t border-[#E2E8F0]">
                        <div
                          onClick={() => openShopVCModal(order)}
                          className="flex items-center justify-between p-3 bg-white border border-[#E2E8F0] rounded-xl cursor-pointer hover:border-[#2563EB] transition-colors"
                        >
                          <div className="flex items-center gap-2 text-sm">
                            <span className="material-symbols-outlined text-[#2563EB]">
                              storefront
                            </span>
                            <span className="font-semibold text-[#334155]">
                              Voucher Shop:
                            </span>
                            {selectedShopVCs[order.gh_ma] ? (
                              <span className="text-[#10B981] font-bold">
                                -{formatVND(order.shopDiscount)}
                              </span>
                            ) : (
                              <span className="text-gray-400">Chọn mã</span>
                            )}
                          </div>
                          <span className="material-symbols-outlined text-gray-400">
                            chevron_right
                          </span>
                        </div>

                        <div
                          onClick={() => openVCModal(order)}
                          className="flex items-center justify-between p-3 bg-white border border-[#E2E8F0] rounded-xl cursor-pointer hover:border-[#2563EB] transition-colors"
                        >
                          <div className="flex items-center gap-2 text-sm">
                            <span className="material-symbols-outlined text-[#2563EB]">
                              local_shipping
                            </span>
                            <span className="font-semibold text-[#334155]">
                              Voucher Vận Chuyển:
                            </span>
                            {selectedVCs[order.gh_ma] ? (
                              <span className="text-[#10B981] font-bold">
                                -{formatVND(order.shippingDiscount)}
                              </span>
                            ) : (
                              <span className="text-gray-400">Chọn mã</span>
                            )}
                          </div>
                          <span className="material-symbols-outlined text-gray-400">
                            chevron_right
                          </span>
                        </div>
                      </div>

                      <div className="flex justify-between text-[#64748B] pt-2">
                        <span>Phí vận chuyển gốc:</span>
                        <span className="font-semibold text-[#0F172A]">
                          {formatVND(order.shippingFee)}
                        </span>
                      </div>

                      <div className="flex justify-between text-[#0F172A] font-bold text-base pt-2 border-t border-gray-200">
                        <span>Phí ship thực tế:</span>
                        <span>{formatVND(order.finalShippingFee)}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="space-y-3 text-sm border-t border-[#F1F5F9] pt-4 bg-white">
              <div className="flex justify-between text-[#64748B] text-base">
                <span>Tổng tiền hàng:</span>
                <span className="font-semibold text-[#0F172A]">
                  {formatVND(totalItemsPrice)}
                </span>
              </div>

              {/* 🟢 Tách riêng Giảm giá Shop */}
              <div className="flex justify-between text-[#64748B] text-base">
                <span>Giảm giá Voucher Shop:</span>
                <span className="font-semibold text-[#10B981]">
                  -{formatVND(totalShopDiscount)}
                </span>
              </div>

              {/* 🟢 Tách riêng Giảm giá Vận chuyển */}
              <div className="flex justify-between text-[#64748B] text-base">
                <span>Giảm giá Vận chuyển:</span>
                <span className="font-semibold text-[#10B981]">
                  -{formatVND(totalShippingDiscount)}
                </span>
              </div>

              <div className="flex justify-between text-[#64748B] text-base">
                <span>Phí vận chuyển gốc:</span>
                <span className="font-semibold text-[#0F172A]">
                  {formatVND(totalOriginalShipping)}
                </span>
              </div>

              <div className="flex justify-between items-center border-t border-[#F1F5F9] pt-4 mt-4">
                <span className="font-bold text-[#0F172A] text-lg">
                  Tổng thanh toán:
                </span>
                <span className="text-3xl font-extrabold text-[#DC2626]">
                  {formatVND(finalTotal)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* CỘT PHẢI: ĐỊA CHỈ & THANH TOÁN */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-[#E2E8F0] p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-[#0F172A] flex items-center gap-2">
                <span className="material-symbols-outlined text-[#2563EB]">
                  local_shipping
                </span>{" "}
                Địa Chỉ Nhận Hàng
              </h2>
            </div>
            <button
              onClick={(e) => handleOpenAddressModal(e)}
              className="w-full text-sm font-semibold text-[#2563EB] hover:underline flex items-center justify-center gap-1 bg-blue-50 px-3 py-2 rounded-lg transition-colors mb-4"
            >
              <span className="material-symbols-outlined text-[18px]">
                add_circle
              </span>{" "}
              Thêm địa chỉ mới
            </button>

            {loadingAddress ? (
              <div className="text-center py-4 text-[#64748B]">
                Đang tải địa chỉ...
              </div>
            ) : addresses.length === 0 ? (
              <div className="text-center py-4 bg-[#F8FAFC] rounded-xl border border-dashed border-[#E2E8F0]">
                <p className="text-[#64748B] mb-3 text-sm">
                  Bạn chưa có địa chỉ nhận hàng nào.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {addresses.map((addr) => (
                  <div
                    key={addr.ttnh_ma}
                    onClick={() => setSelectedAddressId(addr.ttnh_ma)}
                    className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${selectedAddressId === addr.ttnh_ma ? "border-[#2563EB] bg-blue-50 shadow-sm" : "border-[#E2E8F0] bg-white hover:border-[#2563EB]/50"}`}
                  >
                    {selectedAddressId === addr.ttnh_ma && (
                      <div className="absolute top-3 right-3 text-[#2563EB]">
                        <span className="material-symbols-outlined text-[18px]">
                          check_circle
                        </span>
                      </div>
                    )}
                    <div className="pr-6">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="font-bold text-[#0F172A] text-sm">
                          {addr.ttnh_tennguoinhan ||
                            user?.kh_ten ||
                            "Khách hàng"}
                        </span>
                        {addr.ttnh_macdinh && (
                          <span className="text-[10px] font-bold text-[#DC2626] border border-[#DC2626] px-1 py-0.5 rounded">
                            Mặc định
                          </span>
                        )}
                      </div>
                      {addr.ttnh_sdt && (
                        <p className="text-xs text-[#64748B] mb-1">
                          SĐT: {addr.ttnh_sdt}
                        </p>
                      )}
                      <p className="text-xs text-[#64748B] line-clamp-2 leading-relaxed">
                        {addr.dc_mota}, {addr.xa_ten}, {addr.tinh_ten}
                      </p>
                    </div>
                    <div className="flex gap-3 mt-3 pt-2 border-t border-[#E2E8F0]/60">
                      <button
                        onClick={(e) => handleOpenAddressModal(e, addr)}
                        className="text-xs font-semibold text-[#2563EB] hover:underline"
                      >
                        Sửa
                      </button>
                      <button
                        onClick={(e) => handleDeleteAddress(e, addr.ttnh_ma)}
                        className="text-xs font-semibold text-[#DC2626] hover:underline"
                      >
                        Xóa
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ✅ Đã xóa khối chọn ngày giao hàng ở đây */}

          <div className="bg-white rounded-2xl shadow-sm border border-[#E2E8F0] p-6">
            <h2 className="text-lg font-bold text-[#0F172A] mb-4 border-b border-[#F1F5F9] pb-3">
              Phương Thức Thanh Toán
            </h2>
            <div className="space-y-3">
              <label
                className={`flex items-center gap-3 p-3 border-2 rounded-xl cursor-pointer transition-colors ${paymentMethod === "COD" ? "border-[#2563EB] bg-blue-50" : "border-[#E2E8F0]"}`}
              >
                <input
                  type="radio"
                  value="COD"
                  checked={paymentMethod === "COD"}
                  onChange={() => setPaymentMethod("COD")}
                  className="w-4 h-4 accent-[#2563EB]"
                />
                <div className="flex-1">
                  <span className="block font-bold text-[#0F172A] text-sm">
                    Thanh toán khi nhận hàng (COD)
                  </span>
                </div>
              </label>
              <label
                className={`flex items-center gap-3 p-3 border-2 rounded-xl cursor-pointer transition-colors ${paymentMethod === "BANK" ? "border-[#2563EB] bg-blue-50" : "border-[#E2E8F0]"}`}
              >
                <input
                  type="radio"
                  value="BANK"
                  checked={paymentMethod === "BANK"}
                  onChange={() => setPaymentMethod("BANK")}
                  className="w-4 h-4 accent-[#2563EB]"
                />
                <div className="flex-1">
                  <span className="block font-bold text-[#0F172A] text-sm">
                    Chuyển khoản ngân hàng
                  </span>
                </div>
              </label>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-[#E2E8F0] p-6">
            <h2 className="text-lg font-bold text-[#0F172A] mb-3">
              Ghi chú đơn hàng
            </h2>
            <textarea
              rows="3"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="VD: Giao hàng giờ hành chính..."
              className="w-full px-3 py-2 rounded-xl border border-[#E2E8F0] outline-none focus:border-[#2563EB] resize-y text-sm"
            />
          </div>

          <button
            onClick={handlePlaceOrder}
            disabled={loadingFee}
            className={`w-full py-4 rounded-xl font-bold transition-colors shadow-lg text-white text-lg ${loadingFee ? "bg-gray-400 cursor-not-allowed" : "bg-[#DC2626] hover:bg-[#B91C1C]"}`}
          >
            {loadingFee ? "Đang xử lý..." : "ĐẶT HÀNG"}
          </button>
        </div>
      </div>

      {/* MODAL VOUCHER SHOP & VC */}
      {isShopVCModalOpen && activeShop && (
        <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-xl flex flex-col max-h-[80vh]">
            <div className="p-6 border-b border-[#E2E8F0] flex justify-between items-center bg-white">
              <h3 className="text-xl font-bold text-[#0F172A]">
                Chọn Voucher Shop - {activeShop.gh_ten}
              </h3>
              <button
                onClick={() => setIsShopVCModalOpen(false)}
                className="text-gray-400 hover:text-red-500"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-4 overflow-y-auto space-y-3 custom-scrollbar flex-1">
              <div
                onClick={() => handleSelectShopVC(null)}
                className={`border rounded-xl p-3 flex items-center gap-3 cursor-pointer transition-colors ${!selectedShopVCs[activeShop.gh_ma] ? "border-[#2563EB] bg-blue-50" : "border-[#E2E8F0] bg-white hover:border-[#2563EB]/50"}`}
              >
                <div className="flex-1 font-semibold text-sm text-[#0F172A]">
                  Không sử dụng mã Shop
                </div>
                <div className="flex items-center">
                  {!selectedShopVCs[activeShop.gh_ma] ? (
                    <span className="material-symbols-outlined text-[#2563EB]">
                      check_circle
                    </span>
                  ) : (
                    <span className="material-symbols-outlined text-gray-300">
                      radio_button_unchecked
                    </span>
                  )}
                </div>
              </div>
              {shopVouchers[activeShop.gh_ma]?.length === 0 ? (
                <p className="text-center text-gray-500 py-4">
                  Shop này không có voucher nào.
                </p>
              ) : (
                shopVouchers[activeShop.gh_ma]?.map((vc) => {
                  const isSelected =
                    selectedShopVCs[activeShop.gh_ma]?.MGG_Shop_Ma ===
                    vc.MGG_Shop_Ma;
                  const isEligible =
                    activeShop.subTotal >=
                    Number(vc.MGG_Shop_GiaTriDonToiThieu);

                  return (
                    <div
                      key={vc.MGG_Shop_Ma}
                      onClick={() => isEligible && handleSelectShopVC(vc)}
                      className={`border rounded-xl p-3 flex gap-3 cursor-pointer transition-colors ${!isEligible ? "opacity-50 bg-gray-50 border-gray-200 cursor-not-allowed" : isSelected ? "border-[#2563EB] bg-blue-50" : "border-[#E2E8F0] bg-white hover:border-[#2563EB]/50"}`}
                    >
                      <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-lg flex flex-col items-center justify-center shrink-0">
                        <span className="font-bold text-sm">
                          {Number(vc.MGG_Shop_PhanTramGiam)}%
                        </span>
                        <span className="text-[10px]">Shop</span>
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-sm text-[#0F172A] line-clamp-1">
                          {vc.MGG_Shop_Ten}
                        </p>
                        <p className="text-xs text-[#64748B] mt-0.5">
                          Đơn tối thiểu:{" "}
                          {formatVND(vc.MGG_Shop_GiaTriDonToiThieu)}
                        </p>
                        <p className="text-xs text-[#64748B]">
                          Giảm tối đa:{" "}
                          {vc.MGG_Shop_SoTienToiDaMoiLan > 0
                            ? formatVND(vc.MGG_Shop_SoTienToiDaMoiLan)
                            : "Không giới hạn"}
                        </p>
                        {!isEligible && (
                          <p className="text-xs text-red-500 font-semibold mt-1">
                            Chưa đạt giá trị tối thiểu
                          </p>
                        )}
                      </div>
                      <div className="flex items-center">
                        {isSelected ? (
                          <span className="material-symbols-outlined text-[#2563EB]">
                            check_circle
                          </span>
                        ) : (
                          <span className="material-symbols-outlined text-gray-300">
                            radio_button_unchecked
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {isVCModalOpen && activeShop && (
        <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-xl flex flex-col max-h-[80vh]">
            <div className="p-6 border-b border-[#E2E8F0] flex justify-between items-center bg-white">
              <h3 className="text-xl font-bold text-[#0F172A]">
                Chọn Voucher Vận Chuyển
              </h3>
              <button
                onClick={() => setIsVCModalOpen(false)}
                className="text-gray-400 hover:text-red-500"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-4 overflow-y-auto space-y-3 custom-scrollbar flex-1">
              <div
                onClick={() => handleSelectVC(null)}
                className={`border rounded-xl p-3 flex items-center gap-3 cursor-pointer transition-colors ${!selectedVCs[activeShop.gh_ma] ? "border-[#2563EB] bg-blue-50" : "border-[#E2E8F0] bg-white hover:border-[#2563EB]/50"}`}
              >
                <div className="flex-1 font-semibold text-sm text-[#0F172A]">
                  Không sử dụng mã Vận chuyển
                </div>
                <div className="flex items-center">
                  {!selectedVCs[activeShop.gh_ma] ? (
                    <span className="material-symbols-outlined text-[#2563EB]">
                      check_circle
                    </span>
                  ) : (
                    <span className="material-symbols-outlined text-gray-300">
                      radio_button_unchecked
                    </span>
                  )}
                </div>
              </div>
              {shippingVouchers.length === 0 ? (
                <p className="text-center text-gray-500 py-4">
                  Hệ thống không có mã VC nào.
                </p>
              ) : (
                shippingVouchers.map((vc) => {
                  const isSelected =
                    selectedVCs[activeShop.gh_ma]?.MGG_VC_Ma === vc.MGG_VC_Ma;
                  const isEligible =
                    activeShop.subTotal >= Number(vc.MGG_VC_GiaTriDonToiThieu);

                  return (
                    <div
                      key={vc.MGG_VC_Ma}
                      onClick={() => isEligible && handleSelectVC(vc)}
                      className={`border rounded-xl p-3 flex gap-3 cursor-pointer transition-colors ${!isEligible ? "opacity-50 bg-gray-50 border-gray-200 cursor-not-allowed" : isSelected ? "border-[#2563EB] bg-blue-50" : "border-[#E2E8F0] bg-white hover:border-[#2563EB]/50"}`}
                    >
                      <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-lg flex flex-col items-center justify-center shrink-0">
                        <span className="font-bold text-sm">
                          {Number(vc.MGG_VC_PhanTramGiam)}%
                        </span>
                        <span className="text-[10px]">Ship</span>
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-sm text-[#0F172A] line-clamp-1">
                          {vc.MGG_VC_Ten}
                        </p>
                        <p className="text-xs text-[#64748B] mt-0.5">
                          Đơn tối thiểu:{" "}
                          {formatVND(vc.MGG_VC_GiaTriDonToiThieu)}
                        </p>
                        <p className="text-xs text-[#64748B]">
                          Giảm tối đa:{" "}
                          {vc.MGG_VC_SoTienToiDaMoiLan > 0
                            ? formatVND(vc.MGG_VC_SoTienToiDaMoiLan)
                            : "Không giới hạn"}
                        </p>
                        {!isEligible && (
                          <p className="text-xs text-red-500 font-semibold mt-1">
                            Chưa đạt giá trị tối thiểu
                          </p>
                        )}
                      </div>
                      <div className="flex items-center">
                        {isSelected ? (
                          <span className="material-symbols-outlined text-[#2563EB]">
                            check_circle
                          </span>
                        ) : (
                          <span className="material-symbols-outlined text-gray-300">
                            radio_button_unchecked
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL ĐỊA CHỈ */}
      {isAddressModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-xl">
            <div className="p-6 border-b border-[#E2E8F0] flex justify-between items-center bg-white">
              <h3 className="text-xl font-bold text-[#0F172A]">
                {isEditingAddress ? "Cập Nhật Địa Chỉ" : "Thêm Địa Chỉ Mới"}
              </h3>
              <button
                onClick={() => setIsAddressModalOpen(false)}
                className="text-gray-400 hover:text-red-500"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleSaveAddress} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1">
                    Tên người nhận *
                  </label>
                  <input
                    type="text"
                    required
                    value={addressFormData.ttnh_tennguoinhan}
                    onChange={(e) =>
                      setAddressFormData({
                        ...addressFormData,
                        ttnh_tennguoinhan: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-[#E2E8F0] outline-none focus:border-[#2563EB]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">
                    Số điện thoại *
                  </label>
                  <input
                    type="text"
                    required
                    value={addressFormData.ttnh_sdt}
                    onChange={(e) =>
                      setAddressFormData({
                        ...addressFormData,
                        ttnh_sdt: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-[#E2E8F0] outline-none focus:border-[#2563EB]"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1">
                    Tỉnh/Thành *
                  </label>
                  <select
                    required
                    value={addressFormData.tinh_ma}
                    onChange={(e) =>
                      setAddressFormData({
                        ...addressFormData,
                        tinh_ma: e.target.value,
                        xa_ma: "",
                      })
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-[#E2E8F0] outline-none bg-white"
                  >
                    <option value="">-- Chọn --</option>
                    {tinhs.map((t) => (
                      <option key={t.tinh_ma} value={t.tinh_ma}>
                        {t.tinh_ten}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">
                    Xã/Phường *
                  </label>
                  <select
                    required
                    value={addressFormData.xa_ma}
                    onChange={(e) =>
                      setAddressFormData({
                        ...addressFormData,
                        xa_ma: e.target.value,
                      })
                    }
                    disabled={!addressFormData.tinh_ma}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#E2E8F0] outline-none bg-white disabled:bg-gray-100"
                  >
                    <option value="">-- Chọn --</option>
                    {filteredXas.map((x) => (
                      <option key={x.xa_ma} value={x.xa_ma}>
                        {x.xa_ten}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">
                  Địa chỉ chi tiết *
                </label>
                <input
                  type="text"
                  required
                  value={addressFormData.dc_mota}
                  onChange={(e) =>
                    setAddressFormData({
                      ...addressFormData,
                      dc_mota: e.target.value,
                    })
                  }
                  placeholder="Số nhà, tên đường..."
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E2E8F0] outline-none focus:border-[#2563EB]"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">
                  Ghi chú địa chỉ
                </label>
                <textarea
                  rows="2"
                  value={addressFormData.ttnh_ghichu}
                  onChange={(e) =>
                    setAddressFormData({
                      ...addressFormData,
                      ttnh_ghichu: e.target.value,
                    })
                  }
                  placeholder="VD: Gọi trước khi giao..."
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E2E8F0] outline-none resize-y"
                />
              </div>
              <div className="flex items-center gap-2 mt-2">
                <input
                  type="checkbox"
                  id="defaultAddr"
                  checked={addressFormData.ttnh_macdinh}
                  onChange={(e) =>
                    setAddressFormData({
                      ...addressFormData,
                      ttnh_macdinh: e.target.checked,
                    })
                  }
                  className="w-4 h-4 accent-[#2563EB]"
                />
                <label
                  htmlFor="defaultAddr"
                  className="text-sm font-medium cursor-pointer"
                >
                  Đặt làm mặc định
                </label>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t mt-4">
                <button
                  type="button"
                  onClick={() => setIsAddressModalOpen(false)}
                  className="px-6 py-2.5 rounded-xl font-semibold text-[#64748B] hover:bg-gray-100"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={savingAddress}
                  className="px-8 py-2.5 bg-[#2563EB] text-white rounded-xl font-bold"
                >
                  {savingAddress ? "Đang lưu..." : "Lưu"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ToastNotification toast={toast} />
    </div>
  );
};

export default ThanhToan;
