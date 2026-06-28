"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X, ShieldCheck, Tag, CreditCard, Sparkles, Receipt } from "lucide-react";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/Table";
import { useToast } from "@/components/ui/Toast";
import { useAuth } from "@/context/AuthContext";
import { getRoleFromToken, getRoleHomePath } from "@/lib/roleRoutes";

interface PricingPlan {
  name: string;
  monthlyPrice: number;
  yearlyPrice: number;
  description: string;
  features: string[];
  popular?: boolean;
}

const PLANS: PricingPlan[] = [
  {
    name: "Gói Học Thử (Free)",
    monthlyPrice: 0,
    yearlyPrice: 0,
    description: "Khám phá các chương trình cơ bản và từ vựng thông dụng miễn phí.",
    features: [
      "Xem thử các bài học đầu tiên",
      "Học 10 từ vựng mỗi ngày",
      "Tham gia diễn đàn cộng đồng",
      "Thực hiện tối đa 1 bài quiz/ngày"
    ]
  },
  {
    name: "Học Viên Pro",
    monthlyPrice: 199000,
    yearlyPrice: 159000, // Monthly equivalent for yearly billing
    description: "Mở khóa toàn diện tất cả khóa học, luyện phát âm AI và cố vấn kèm cặp.",
    features: [
      "Truy cập 100% thư viện khóa học",
      "Chấm điểm phát âm nói AI không giới hạn",
      "Làm bài kiểm tra & Cấp chứng chỉ số",
      "Truy cập phòng chat thảo luận với Mentor",
      "Học ngoại tuyến trên ứng dụng di động"
    ],
    popular: true
  },
  {
    name: "Hội Viên Premium",
    monthlyPrice: 349000,
    yearlyPrice: 279000,
    description: "Lộ trình học cá nhân hóa cao độ cùng cố vấn học tập riêng 24/7.",
    features: [
      "Toàn bộ quyền lợi gói Pro",
      "Cố vấn Mentor sửa lỗi phát âm trực tiếp",
      "Thi thử thử thách IELTS/TOEIC hàng tháng",
      "Đánh giá & Cam kết đầu ra bằng văn bản",
      "Thư mời tham gia câu lạc bộ VIP"
    ]
  }
];

export default function PricingPage() {
  const router = useRouter();
  const toast = useToast();
  const { token, user } = useAuth();
  const dashboardHref = getRoleHomePath(getRoleFromToken(token) ?? user?.role);
  const [isYearly, setIsYearly] = useState(false);
  
  // Trạng thái thanh toán hóa đơn
  const [selectedPlan, setSelectedPlan] = useState<PricingPlan | null>(null);
  const [couponCode, setCouponCode] = useState("");
  const [discountPercent, setDiscountPercent] = useState(0);
  const [isCouponApplied, setIsCouponApplied] = useState(false);
  
  // Thông tin nhập liệu thẻ tín dụng
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");

  const [isPaymentSuccess, setIsPaymentSuccess] = useState(false);

  const handleOpenCheckout = (plan: PricingPlan) => {
    if (plan.monthlyPrice === 0) {
      router.push("/register");
      return;
    }
    setSelectedPlan(plan);
    setIsPaymentSuccess(false);
    setDiscountPercent(0);
    setIsCouponApplied(false);
    setCouponCode("");
  };

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (couponCode.toUpperCase() === "WELCOME20") {
      setDiscountPercent(20);
      setIsCouponApplied(true);
      toast.success("Đã áp dụng mã WELCOME20", "Giảm ngay 20% cho hóa đơn.");
    } else {
      toast.error("Mã giảm giá không hợp lệ", "Hãy thử lại với mã khác.");
    }
  };

  const handlePay = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardName || !cardNumber || !cardExpiry || !cardCvv) {
      toast.warning("Thiếu thông tin thanh toán", "Vui lòng nhập đầy đủ thông tin thẻ.");
      return;
    }
    setIsPaymentSuccess(true);
  };

  // Tính toán chi tiết giá trị thanh toán cuối cùng sau khi áp dụng giảm giá
  const basePrice = selectedPlan
    ? isYearly
      ? selectedPlan.yearlyPrice * 12
      : selectedPlan.monthlyPrice
    : 0;

  const discountAmount = Math.round((basePrice * discountPercent) / 100);
  const finalPrice = basePrice - discountAmount;

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 text-gray-900">
      <Header />

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
        {/* Tiêu đề trang và giới thiệu các gói học */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <Badge variant="default" className="px-3 py-1 text-2xs font-extrabold shadow-sm">
            💎 EduMastery Premium Plans
          </Badge>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tight text-gray-950 leading-tight">
            Nâng tầm tri thức cùng các gói hội viên Pro
          </h1>
          <p className="text-xs md:text-sm text-gray-500 leading-relaxed font-medium">
            Chọn gói tài khoản phù hợp nhất với mục tiêu học tập của bạn. Mở khóa toàn bộ bài giảng chất lượng cao, giảng viên chấm điểm nói trực tiếp và chứng chỉ số hóa.
          </p>

          {/* Nút gạt chuyển đổi chu kỳ thanh toán Tháng/Năm */}
          <div className="flex items-center justify-center gap-3 pt-4">
            <span className={`text-xs font-extrabold ${!isYearly ? "text-primary" : "text-gray-400"}`}>
              Thanh toán tháng
            </span>
            <button
              onClick={() => setIsYearly(!isYearly)}
              className="w-12 h-6 rounded-full bg-primary/20 relative p-1 transition-colors outline-none cursor-pointer"
            >
              <div
                className={`w-4 h-4 rounded-full bg-primary transition-all duration-300 ${
                  isYearly ? "translate-x-6" : "translate-x-0"
                }`}
              ></div>
            </button>
            <span className={`text-xs font-extrabold flex items-center gap-1.5 ${isYearly ? "text-primary" : "text-gray-400"}`}>
              Thanh toán năm
              <Badge variant="success" className="px-1.5 py-0.5 text-4xs">Tiết kiệm 20%</Badge>
            </span>
          </div>
        </div>

        {/* Danh sách thẻ các gói dịch vụ học tập */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {PLANS.map((plan, idx) => {
            const price = isYearly ? plan.yearlyPrice : plan.monthlyPrice;
            const period = isYearly ? "/ tháng" : "/ tháng";

            return (
              <Card
                key={idx}
                className={`flex flex-col justify-between h-full hover:shadow-hover duration-300 relative ${
                  plan.popular ? "border-2 border-primary" : ""
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge variant="default" className="px-3 py-1 shadow-md shadow-pink-100">Phổ biến nhất</Badge>
                  </div>
                )}
                <CardContent className="p-6 space-y-6">
                  <div className="space-y-1">
                    <h3 className="font-extrabold text-gray-900 text-sm">{plan.name}</h3>
                    <p className="text-3xs text-gray-400 font-bold leading-relaxed">{plan.description}</p>
                  </div>

                  <div className="flex items-baseline text-gray-950">
                    <span className="text-3xl font-black tracking-tight">
                      {price === 0 ? "0 đ" : `${price.toLocaleString()} đ`}
                    </span>
                    <span className="ml-1 text-xs font-semibold text-gray-400">{period}</span>
                  </div>

                  {isYearly && plan.monthlyPrice > 0 && (
                    <span className="text-4xs font-black text-emerald-600 block uppercase tracking-wider bg-emerald-50 px-2 py-1 rounded w-fit">
                      Thanh toán một lần: {(plan.yearlyPrice * 12).toLocaleString()} đ / năm
                    </span>
                  )}

                  <div className="w-full h-px bg-gray-50"></div>

                  <ul className="space-y-3 text-xs text-gray-500 font-medium">
                    {plan.features.map((feat, fidx) => (
                      <li key={fidx} className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>

                <div className="p-6 pt-0 shrink-0">
                  <Button
                    onClick={() => handleOpenCheckout(plan)}
                    variant={plan.popular ? "default" : "outline"}
                    className="w-full text-xs font-black py-2.5 rounded-xl shadow-sm"
                  >
                    {plan.monthlyPrice === 0 ? "Bắt đầu học thử" : "Mở khóa Premium Pro"}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Bảng so sánh chi tiết quyền lợi gói học */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-soft p-6 sm:p-8 space-y-6 max-w-5xl mx-auto">
          <div className="space-y-1 border-b border-gray-50 pb-4">
            <h2 className="text-xl font-extrabold text-gray-900 flex items-center gap-1.5">
              <Sparkles className="w-5 h-5 text-primary" />
              Bảng so sánh chi tiết quyền lợi gói học
            </h2>
            <p className="text-2xs font-semibold text-gray-400 uppercase tracking-wider">Đối chiếu chi tiết tính năng hỗ trợ học tập</p>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-1/3">Tính năng hỗ trợ</TableHead>
                <TableHead>Học Thử (Free)</TableHead>
                <TableHead>Pro Tháng/Năm</TableHead>
                <TableHead>Premium Cố Vấn</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-bold">Truy cập bài giảng khóa học</TableCell>
                <TableCell className="text-gray-400">Xem thử chương 1</TableCell>
                <TableCell className="font-bold text-primary">Không giới hạn</TableCell>
                <TableCell className="font-bold text-primary">Không giới hạn</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-bold">Chấm điểm phát âm AI qua Mic</TableCell>
                <TableCell><X className="w-4 h-4 text-gray-200" /></TableCell>
                <TableCell className="font-bold text-emerald-600">Không giới hạn</TableCell>
                <TableCell className="font-bold text-emerald-600">Không giới hạn</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-bold">Nhận xét bài luận IELTS/TOEIC</TableCell>
                <TableCell><X className="w-4 h-4 text-gray-200" /></TableCell>
                <TableCell className="text-gray-400">Diễn đàn cộng đồng</TableCell>
                <TableCell className="font-bold text-emerald-600">Cố vấn riêng sửa trực tiếp</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-bold">Chứng nhận số tốt nghiệp danh giá</TableCell>
                <TableCell><X className="w-4 h-4 text-gray-200" /></TableCell>
                <TableCell><Check className="w-4 h-4 text-emerald-500" /></TableCell>
                <TableCell><Check className="w-4 h-4 text-emerald-500" /></TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        {/* Modal thanh toán tương tác trực tuyến */}
        {selectedPlan && (
          <Modal
            isOpen={selectedPlan !== null}
            onClose={() => setSelectedPlan(null)}
            title="Cổng thanh toán EduMastery Checkout"
          >
            {isPaymentSuccess ? (
              /* Màn hình thông báo thanh toán thành công và hóa đơn điện tử */
              <div className="text-center space-y-6 py-6 animate-fade-in">
                <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center text-2xl mx-auto shadow-inner border border-emerald-100">
                  <ShieldCheck className="w-8 h-8" />
                </div>
                <div className="space-y-1.5">
                  <h4 className="font-extrabold text-gray-900 text-base leading-none">Thanh toán thành công!</h4>
                  <p className="text-xs text-gray-500">Mã hóa hóa đơn điện tử: EM-PAY-{(Math.floor(Math.random() * 900000) + 100000)}</p>
                </div>

                {/* Hóa đơn thanh toán kỹ thuật số chi tiết */}
                <div className="bg-gray-50 rounded-2xl p-5 border border-gray-200/70 text-left space-y-4 max-w-sm mx-auto">
                  <h5 className="font-extrabold text-gray-800 text-xs flex items-center gap-1">
                    <Receipt className="w-4 h-4 text-primary" />
                    Hóa đơn thanh toán
                  </h5>
                  <div className="space-y-2 text-xs text-gray-600">
                    <div className="flex justify-between">
                      <span>Sản phẩm:</span>
                      <strong className="text-gray-900">{selectedPlan.name}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Hình thức billing:</span>
                      <strong className="text-gray-900">{isYearly ? "Thanh toán theo năm" : "Thanh toán theo tháng"}</strong>
                    </div>
                    {discountPercent > 0 && (
                      <div className="flex justify-between text-primary">
                        <span>Mã giảm giá áp dụng:</span>
                        <strong>- {discountAmount.toLocaleString()} đ (20%)</strong>
                      </div>
                    )}
                    <div className="w-full h-px bg-gray-200/50 my-1"></div>
                    <div className="flex justify-between text-sm font-black text-primary">
                      <span>Tổng giá thanh toán:</span>
                      <span>{finalPrice.toLocaleString()} đ</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <Button
                    onClick={() => { setSelectedPlan(null); router.push(dashboardHref); }}
                    className="w-full py-3 text-xs font-black rounded-xl"
                  >
                    Vào học ngay lập tức
                  </Button>
                </div>
              </div>
            ) : (
              /* Form nhập liệu thông tin thanh toán */
              <div className="space-y-6">
                {/* Tóm tắt thông tin gói học đã chọn */}
                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 flex justify-between items-center text-xs text-gray-700">
                  <div>
                    <p className="font-black text-gray-900">{selectedPlan.name}</p>
                    <p className="text-gray-400 font-semibold mt-0.5">{isYearly ? "Thanh toán năm (12 tháng)" : "Thanh toán tháng"}</p>
                  </div>
                  <span className="text-sm font-black text-primary">{basePrice.toLocaleString()} đ</span>
                </div>

                {/* Form áp dụng mã giảm giá ưu đãi */}
                <form onSubmit={handleApplyCoupon} className="flex gap-2 items-end">
                  <Input
                    label="Mã ưu đãi giảm giá"
                    value={couponCode}
                    onChange={e => setCouponCode(e.target.value)}
                    placeholder="Ví dụ: WELCOME20"
                    className="py-2.5 bg-white"
                  />
                  <Button type="submit" variant="outline" className="py-3 px-5 text-xs font-bold rounded-xl h-[40px] shrink-0 border-gray-200">
                    Áp dụng
                  </Button>
                </form>

                {isCouponApplied && (
                  <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 text-4xs font-black uppercase tracking-wider px-3 py-1 rounded w-fit flex items-center gap-1">
                    <Tag className="w-3 h-3" />
                    <span>Mã giảm giá WELCOME20 đã kích hoạt (Giảm 20%!)</span>
                  </div>
                )}

                {/* Form nhập thông tin chi tiết thẻ tín dụng */}
                <form onSubmit={handlePay} className="space-y-4">
                  <div className="space-y-1.5">
                    <span className="text-3xs font-extrabold uppercase text-gray-400 tracking-wider block">Thẻ tín dụng (Credit/Debit Card)</span>
                    <div className="relative">
                      <Input
                        required
                        value={cardNumber}
                        onChange={e => setCardNumber(e.target.value)}
                        placeholder="4242 4242 4242 4242"
                        maxLength={19}
                        className="pl-10"
                      />
                      <CreditCard className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      required
                      label="Thời hạn Expiry"
                      value={cardExpiry}
                      onChange={e => setCardExpiry(e.target.value)}
                      placeholder="MM/YY"
                      maxLength={5}
                    />
                    <Input
                      required
                      type="password"
                      label="Mã bảo mật CVV"
                      value={cardCvv}
                      onChange={e => setCardCvv(e.target.value)}
                      placeholder="•••"
                      maxLength={3}
                    />
                  </div>

                  <Input
                    required
                    label="Chủ sở hữu thẻ"
                    value={cardName}
                    onChange={e => setCardName(e.target.value.toUpperCase())}
                    placeholder="NGUYEN VAN A"
                  />

                  {/* Tổng hợp giá trị hóa đơn cuối cùng */}
                  <div className="pt-4 border-t border-gray-50 flex justify-between items-baseline text-xs text-gray-500">
                    <span>Tổng tiền thanh toán cuối cùng:</span>
                    <span className="text-xl font-black text-primary">{finalPrice.toLocaleString()} đ</span>
                  </div>

                  <Button type="submit" className="w-full py-3.5 text-xs font-black rounded-xl shadow-md shadow-pink-200 mt-2">
                    Xác nhận thanh toán & Kích hoạt học tập
                  </Button>
                </form>
              </div>
            )}
          </Modal>
        )}
      </main>

      <Footer />
    </div>
  );
}
