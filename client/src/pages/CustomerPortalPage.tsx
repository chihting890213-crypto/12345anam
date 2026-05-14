import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const statusMap: Record<string, { label: string; cls: string; desc: string }> = {
  pending: { label: "待審核", cls: "status-pending", desc: "您的訂單正在等待員工審核" },
  confirmed: { label: "已確認", cls: "status-confirmed", desc: "訂單已確認，請等待付款資訊" },
  awaiting_payment: { label: "待付款", cls: "status-awaiting", desc: "請依照付款資訊完成付款" },
  paid: { label: "已付款", cls: "status-paid", desc: "付款已確認，訂單處理中" },
  processing: { label: "處理中", cls: "status-processing", desc: "花卉準備中，即將配送" },
  completed: { label: "已完成", cls: "status-completed", desc: "訂單已完成，感謝您的購買！" },
  cancelled: { label: "已取消", cls: "status-cancelled", desc: "此訂單已取消" },
  fully_booked: { label: "已額滿", cls: "status-booked", desc: "此時段已額滿，請聯繫員工" },
};

type Tab = "create" | "query";

export default function CustomerPortalPage() {
  const utils = trpc.useUtils();
  const [activeTab, setActiveTab] = useState<Tab>("create");
  
  // Query tab state
  const [orderNumber, setOrderNumber] = useState("");
  const [queriedNumber, setQueriedNumber] = useState("");
  const [msgContent, setMsgContent] = useState("");
  const [orderingPersonName, setSenderName] = useState("");

  // Create order tab state
  const [orderingPersonInfo, setSenderInfo] = useState({ name: "", phone: "" });
  const [showOrderSuccess, setShowOrderSuccess] = useState(false);
  const [createdOrderNumber, setCreatedOrderNumber] = useState("");
    const [recipientPersonInfo, setRecipientInfo] = useState({ name: "", phone: "", address: "" });
  const [flowerItems, setFlowerItems] = useState<Array<{ flowerId: string; quantity: number; unit: string }>>([
    { flowerId: "", quantity: 1, unit: "束" }
  ]);
  const [orderDetails, setOrderDetails] = useState({
    deliveryType: "delivery" as "pickup" | "delivery",
    deliveryDate: "",
    timeslot: "09:00-12:00",
    category: "other" as "holiday" | "wedding" | "funeral" | "other",
    cardContent: "",
    notes: "",
    paymentMethod: "bank" as "bank" | "no-payment",
    selectedBankId: "",
  });

  // Queries
  const { data: order, isLoading: orderLoading, error: orderError } = trpc.orders.byNumberOrSender.useQuery(
    { query: queriedNumber },
    { enabled: !!queriedNumber, retry: false }
  );
  const { data: messages = [], refetch: refetchMsgs } = trpc.messages.list.useQuery(
    { orderNumber: queriedNumber },
    { enabled: !!queriedNumber && !!order }
  );

  const { data: flowers = [] } = trpc.flowers.list.useQuery();
  const { data: bankAccounts = [] } = trpc.bankAccounts.list.useQuery();

  // Mutations
  const sendMsg = trpc.messages.sendCustomer.useMutation({
    onSuccess: () => {
      toast.success("訊息已發送！");
      setMsgContent("");
      refetchMsgs();
    },
    onError: (e) => toast.error(e.message),
  });

  const createOrder = trpc.orders.create.useMutation({
    onSuccess: (result) => {
      setCreatedOrderNumber(result.orderNumber);
      setShowOrderSuccess(true);
      setOrderNumber("");
      setOrderDetails({
        deliveryType: "delivery",
        deliveryDate: "",
        timeslot: "09:00-12:00",
        category: "other",
        cardContent: "",
        notes: "",
        paymentMethod: "bank",
        selectedBankId: "",
      });
      setSenderInfo({ name: "", phone: "" });
      setRecipientInfo({ name: "", phone: "", address: "" });
      setFlowerItems([{ flowerId: "", quantity: 1, unit: "束" }]);
    },
    onError: (e) => toast.error(e.message),
  });

  const handleQuery = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderNumber.trim()) {
      toast.error("請輸入訂單編號或訂花人名字");
      return;
    }
    setQueriedNumber(orderNumber.trim());
  };
  const copyToClipboard = () => {
    navigator.clipboard.writeText(createdOrderNumber);
    toast.success("訂單編號已複製！");
  };


  const handleCreateOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderingPersonInfo.name || !orderingPersonInfo.phone) {
      toast.error("請填寫訂花人資訊");
      return;
    }
    if (!recipientPersonInfo.name || !recipientPersonInfo.phone) {
      toast.error("請填寫收花人資訊");
      return;
    }
    if (!orderDetails.deliveryDate) {
      toast.error("請選擇配送日期");
      return;
    }
    if (flowerItems.length === 0 || !flowerItems[0].flowerId) {
      toast.error("請至少選擇一種花卉");
      return;
    }
    const totalAmount = flowerItems.reduce((sum, item) => {
      const flower = flowers.find(f => f.id === parseInt(item.flowerId));
      return sum + ((flower?.price || 0) * item.quantity);
    }, 0) + (orderDetails.cardContent ? 100 : 0);
    const paymentNote = orderDetails.paymentMethod === "no-payment" ? "免付款（店內結清）" : "";

    createOrder.mutate({
      orderingPersonName: orderingPersonInfo.name,
      orderingPersonPhone: orderingPersonInfo.phone,
      orderingPersonEmail: "",
      
      recipientPersonName: recipientPersonInfo.name,
      recipientPersonPhone: recipientPersonInfo.phone,
      recipientPersonAddress: recipientPersonInfo.address,
      deliveryType: orderDetails.deliveryType,
      deliveryDate: orderDetails.deliveryDate,
      timeslot: orderDetails.timeslot,

      flowerId: parseInt(flowerItems[0]?.flowerId || "0"),
      flowerName: flowers.find(f => f.id === parseInt(flowerItems[0]?.flowerId || "0"))?.name,
      flowerQuantity: flowerItems[0]?.quantity || 1,
      flowerUnit: flowerItems[0]?.unit || "束",
      flowerPrice: flowers.find(f => f.id === parseInt(flowerItems[0]?.flowerId || "0"))?.price || 0,
      needCard: !!orderDetails.cardContent,
      cardContent: orderDetails.cardContent,
      cardPrice: orderDetails.cardContent ? 100 : 0,
      category: orderDetails.category,
      totalAmount: Math.round(totalAmount),
      paymentNote: paymentNote,
    } as any);
  };

  const s = order ? statusMap[order.status] || { label: order.status, cls: "", desc: "" } : null;

  const InfoRow = ({ label, value }: { label: string; value?: string | null }) =>
    value ? (
      <div className="flex gap-2 py-1.5 border-b-[1px] border-black/10 last:border-0">
        <span className="text-xs font-black uppercase text-gray-500 w-20 flex-shrink-0">{label}</span>
        <span className="font-bold text-sm">{value}</span>
      </div>
    ) : null;

  return (
    <div className="min-h-screen" style={{ background: "#FFD6C0" }}>
      {/* Geometric decorations */}
      <div className="fixed top-8 left-8 w-14 h-14 bg-[#B8F0D8] border-[3px] border-black rounded-full opacity-70 pointer-events-none" />
      <div className="fixed top-16 right-12 w-10 h-10 bg-[#D4C5F9] border-[3px] border-black rotate-45 opacity-70 pointer-events-none" />
      <div className="fixed bottom-16 left-16 w-18 h-18 bg-[#FFF0A0] border-[3px] border-black opacity-60 pointer-events-none" />
      <div className="fixed bottom-8 right-8 w-12 h-12 bg-[#FF7B6B] border-[3px] border-black rounded-full opacity-60 pointer-events-none" />

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-8">
        {/* Back to home */}
        <div className="mb-6">
          <a href="/" className="inline-flex items-center gap-2 bg-white border-[2px] border-black rounded-full px-4 py-2 font-black text-sm shadow-[2px_2px_0px_#111] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_#111] transition-all">
            ← 返回首頁
          </a>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-block bg-[#FF7B6B] border-[3px] border-black rounded-2xl px-6 py-3 mb-4 shadow-[4px_4px_0px_#111]">
            <span className="text-4xl">🌸</span>
          </div>
          <div className="font-black text-2xl tracking-widest text-black mb-1" style={{ fontFamily: "serif" }}>
            金美芳花苑
          </div>
          <h1 className="memphis-title text-4xl text-black mb-2">客戶中心</h1>
          <p className="text-black font-bold">新增訂單・查詢進度・與我們溝通</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {(["create", "query"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`memphis-btn px-6 py-3 font-black text-base uppercase tracking-wide rounded-lg ${
                activeTab === tab ? "bg-[#111] text-white" : "bg-white text-black border-[2px] border-black"
              }`}
            >
              {tab === "create" ? "➕ 新增訂單" : "🔍 查詢訂單"}
            </button>
          ))}
        </div>

        {/* Create Order Tab */}
        {activeTab === "create" && (
          <form onSubmit={handleCreateOrder} className="space-y-6">
            {/* Sender Info */}
            <div className="memphis-card p-6 bg-[#B8F0D8]">
              <h2 className="font-black text-lg uppercase mb-4">訂花人資訊</h2>
              <div className="space-y-3">
                <input
                  type="text"
                  value={orderingPersonInfo.name}
                  onChange={(e) => setSenderInfo((s) => ({ ...s, name: e.target.value }))}
                  placeholder="姓名"
                  className="w-full px-4 py-3 bg-white border-[2px] border-black rounded-lg font-bold"
                />
                <input
                  type="tel"
                  value={orderingPersonInfo.phone}
                  onChange={(e) => setSenderInfo((s) => ({ ...s, phone: e.target.value }))}
                  placeholder="電話"
                  className="w-full px-4 py-3 bg-white border-[2px] border-black rounded-lg font-bold"
                />

              </div>
            </div>

            {/* Recipient Info */}
            <div className="memphis-card p-6 bg-[#D4C5F9]">
              <h2 className="font-black text-lg uppercase mb-4">收花人資訊</h2>
              <div className="space-y-3">
                <input
                  type="text"
                  value={recipientPersonInfo.name}
                  onChange={(e) => setRecipientInfo((r) => ({ ...r, name: e.target.value }))}
                  placeholder="姓名"
                  className="w-full px-4 py-3 bg-white border-[2px] border-black rounded-lg font-bold"
                />
                <input
                  type="tel"
                  value={recipientPersonInfo.phone}
                  onChange={(e) => setRecipientInfo((r) => ({ ...r, phone: e.target.value }))}
                  placeholder="電話"
                  className="w-full px-4 py-3 bg-white border-[2px] border-black rounded-lg font-bold"
                />
                <textarea
                  value={recipientPersonInfo.address}
                  onChange={(e) => setRecipientInfo((r) => ({ ...r, address: e.target.value }))}
                  placeholder="配送地址"
                  rows={2}
                  className="w-full px-4 py-3 bg-white border-[2px] border-black rounded-lg font-bold"
                />
                <div className="text-xs font-bold text-black/60">
                  (店內自取/配送地址)
                </div>
              </div>
            </div>

            {/* Delivery Options */}
            <div className="memphis-card p-6 bg-[#FFF0A0]">
              <h2 className="font-black text-lg uppercase mb-4">配送方式</h2>
              <div className="space-y-3">
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={orderDetails.deliveryType === "pickup"}
                      onChange={() => setOrderDetails((o) => ({ ...o, deliveryType: "pickup" }))}
                      className="w-4 h-4"
                    />
                    <span className="font-bold">自取</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={orderDetails.deliveryType === "delivery"}
                      onChange={() => setOrderDetails((o) => ({ ...o, deliveryType: "delivery" }))}
                      className="w-4 h-4"
                    />
                    <span className="font-bold">外送</span>
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-black uppercase mb-1">配送日期</label>
                    <input
                      type="date"
                      value={orderDetails.deliveryDate}
                      onChange={(e) => setOrderDetails((o) => ({ ...o, deliveryDate: e.target.value }))}
                      className="w-full px-4 py-3 bg-white border-[2px] border-black rounded-lg font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black uppercase mb-1">時段</label>
                    <select
                      value={orderDetails.timeslot}
                      onChange={(e) => setOrderDetails((o) => ({ ...o, timeslot: e.target.value }))}
                      className="w-full px-4 py-3 bg-white border-[2px] border-black rounded-lg font-bold"
                    >
                      <option>09:00-12:00</option>
                      <option>12:00-15:00</option>
                      <option>15:00-18:00</option>
                      <option>18:00-21:00</option>
                      <option>全天</option>
                    </select>
                  </div>
                </div>

              </div>
            </div>

            {/* Flower Selection */}
            <div className="memphis-card p-6 bg-[#FFB899]">
              <h2 className="font-black text-lg uppercase mb-4">花卉選擇</h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-black uppercase mb-1">類別</label>
                  <select
                    value={orderDetails.category}
                    onChange={(e) => setOrderDetails((o) => ({ ...o, category: e.target.value as any }))}
                    className="w-full px-4 py-3 bg-white border-[2px] border-black rounded-lg font-bold"
                  >
                    <option value="holiday">節慶花卉配送</option>
                    <option value="wedding">婚禮</option>
                    <option value="funeral">喪禮</option>
                    <option value="other">其他</option>
                  </select>
                </div>

                {/* Multiple Flower Items */}
                <div className="space-y-3">
                  <label className="block text-xs font-black uppercase">花卉品項</label>
                  {flowerItems.map((item, idx) => (
                    <div key={idx} className="p-3 bg-white border-[2px] border-black rounded-lg space-y-2">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold">品項 {idx + 1}</span>
                        {flowerItems.length > 1 && (
                          <button
                            onClick={() => setFlowerItems(items => items.filter((_, i) => i !== idx))}
                            className="text-xs font-bold text-[#FF7B6B] hover:underline"
                          >
                            刪除
                          </button>
                        )}
                      </div>
                      <select
                        value={item.flowerId}
                        onChange={(e) => setFlowerItems(items => {
                          const newItems = [...items];
                          newItems[idx].flowerId = e.target.value;
                          return newItems;
                        })}
                        className="w-full px-3 py-2 bg-white border-[2px] border-black rounded-lg font-bold text-sm"
                      >
                        <option value="">選擇花卉</option>
                        {flowers
                          .filter((f) => f.category === orderDetails.category)
                          .map((f) => (
                            <option key={f.id} value={f.id}>
                              {f.name}{f.price ? ` - NT$${f.price}` : ' - 自訂價格'}
                            </option>
                          ))}
                      </select>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="number"
                          min={1}
                          value={item.quantity}
                          onChange={(e) => setFlowerItems(items => {
                            const newItems = [...items];
                            newItems[idx].quantity = parseInt(e.target.value) || 1;
                            return newItems;
                          })}
                          placeholder="數量"
                          className="px-2 py-1 bg-white border-[2px] border-black rounded-lg font-bold text-sm"
                        />
                        <input
                          type="text"
                          value={item.unit}
                          onChange={(e) => setFlowerItems(items => {
                            const newItems = [...items];
                            newItems[idx].unit = e.target.value;
                            return newItems;
                          })}
                          placeholder="單位"
                          className="px-2 py-1 bg-white border-[2px] border-black rounded-lg font-bold text-sm"
                        />
                      </div>
                      {item.flowerId && (() => {
                        const flower = flowers.find(f => f.id === parseInt(item.flowerId));
                        return (
                          <div className="text-xs font-bold text-black/60 text-right">
                            小計: NT$ {((flower?.price || 0) * item.quantity)}
                          </div>
                        );
                      })()}
                    </div>
                  ))}
                  <button
                    onClick={() => setFlowerItems(items => [...items, { flowerId: "", quantity: 1, unit: "束" }])}
                    className="w-full py-2 bg-[#B8F0D8] border-[2px] border-black rounded-lg font-black text-sm hover:bg-[#9FE5C8]"
                  >
                    + 新增花卉
                  </button>
                </div>

                {/* Total Amount Display */}
                {flowerItems.some(item => item.flowerId) && (() => {
                  const total = flowerItems.reduce((sum, item) => {
                    const flower = flowers.find(f => f.id === parseInt(item.flowerId));
                    return sum + ((flower?.price || 0) * item.quantity);
                  }, 0) + (orderDetails.cardContent ? 100 : 0);
                
  // Order success modal
  if (showOrderSuccess) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div className="memphis-card p-8 bg-white max-w-md w-full">
          <div className="text-center">
            <div className="text-5xl mb-4">✅</div>
            <h2 className="memphis-title text-2xl text-black mb-2">訂單建立成功！</h2>
            <p className="text-black font-bold mb-6">感謝您的訂單</p>
            
            <div className="bg-[#FFF0A0] border-[2px] border-black rounded-lg p-4 mb-6">
              <p className="text-xs font-black uppercase text-black/60 mb-2">訂單編號</p>
              <p className="text-2xl font-black text-black break-all">{createdOrderNumber}</p>
            </div>
            
            <p className="text-sm font-bold text-black/70 mb-6">📋 請複製此訂單編號以利查詢</p>
            
            <div className="flex gap-3">
              <button onClick={copyToClipboard}
                className="flex-1 py-2.5 bg-[#FF7B6B] text-white font-black uppercase rounded-lg hover:opacity-90">
                📋 複製編號
              </button>
              <button onClick={() => {
                setShowOrderSuccess(false);
                setQueriedNumber(createdOrderNumber);
                setOrderNumber(createdOrderNumber);
                setActiveTab("query");
              }}
                className="flex-1 py-2.5 bg-[#B8F0D8] text-black font-black uppercase rounded-lg hover:opacity-90">
                查詢訂單
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
                    <div className="p-4 bg-[#FFF0A0] border-[2px] border-black rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="font-black uppercase text-sm">估計總金額</span>
                        <span className="font-black text-2xl text-[#FF7B6B]">NT$ {total}</span>
                      </div>
                      {orderDetails.cardContent && <div className="text-xs font-bold text-black/60 mt-2">包含卡片費用 NT$ 100</div>}
                    </div>
                  );
                })()}

              </div>
            </div>

            {/* Payment Method */}
            <div className="memphis-card p-6 bg-[#D4C5F9]">
              <h2 className="font-black text-lg uppercase mb-4">💳 付款方式</h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-black uppercase mb-2">選擇付款方式</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={orderDetails.paymentMethod === "bank"}
                        onChange={() => setOrderDetails((o) => ({ ...o, paymentMethod: "bank" }))}
                        className="w-4 h-4"
                      />
                      <span className="font-bold">銀行轉帳</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={orderDetails.paymentMethod === "no-payment"}
                        onChange={() => setOrderDetails((o) => ({ ...o, paymentMethod: "no-payment" }))}
                        className="w-4 h-4"
                      />
                      <span className="font-bold">免付款（店內結清）</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Card & Notes */}
            <div className="memphis-card p-6 bg-white border-[2px] border-black">
              <h2 className="font-black text-lg uppercase mb-4">卡片與備註</h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-black uppercase mb-1">卡片內容（選填）</label>
                  <textarea
                    value={orderDetails.cardContent}
                    onChange={(e) => setOrderDetails((o) => ({ ...o, cardContent: e.target.value }))}
                    placeholder="輸入卡片內容"
                    rows={3}
                    className="w-full px-4 py-3 bg-white border-[2px] border-black rounded-lg font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase mb-1">其他備註（選填）</label>
                  <textarea
                    value={orderDetails.notes}
                    onChange={(e) => setOrderDetails((o) => ({ ...o, notes: e.target.value }))}
                    placeholder="輸入任何特殊要求"
                    rows={2}
                    className="w-full px-4 py-3 bg-white border-[2px] border-black rounded-lg font-bold"
                  />
                </div>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={createOrder.isPending}
              className="w-full py-4 bg-[#FF7B6B] text-white font-black text-lg uppercase tracking-wide border-[2px] border-black rounded-lg shadow-[4px_4px_0px_#111] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_#111] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_#111] transition-all disabled:opacity-60"
            >
              {createOrder.isPending ? "提交中..." : "提交訂單 →"}
            </button>
          </form>
        )}

        {/* Query Order Tab */}
        {activeTab === "query" && (
          <div className="space-y-6">
            {/* Query form */}
            <div className="memphis-card p-6 bg-white border-[2px] border-black">
              <form onSubmit={handleQuery} className="flex gap-3">
                <input
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  placeholder="例：訂單編號或訂花人名字"
                  className="flex-1 px-4 py-3 bg-white border-[2px] border-black rounded-lg font-bold text-base focus:outline-none focus:shadow-[3px_3px_0px_#111] transition-shadow"
                />
                <button
                  type="submit"
                  disabled={orderLoading}
                  className="memphis-btn px-6 py-3 bg-[#FF7B6B] text-white font-black uppercase tracking-wide rounded-lg"
                >
                  {orderLoading ? "查詢中..." : "查詢"}
                </button>
              </form>
            </div>

            {/* Error */}
            {orderError && queriedNumber && (
              <div className="memphis-card p-5 bg-[#FFB0A0]">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">❌</span>
                  <div>
                    <div className="font-black">找不到訂單</div>
                    <div className="text-sm font-bold text-black/60">請檢查訂單編號是否正確</div>
                  </div>
                </div>
              </div>
            )}

            {/* Order Details */}
            {order && (
              <div className="space-y-4">
                {/* Status */}
                <div className={`memphis-card p-5 ${s?.cls === "status-booked" ? "bg-[#FFB0A0]" : "bg-[#B8F0D8]"}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-black text-2xl">{s?.label}</div>
                      <div className="text-sm font-bold text-black/60">{s?.desc}</div>
                    </div>
                    <span className="text-4xl">{order.status === "completed" ? "✅" : order.status === "cancelled" ? "❌" : "⏳"}</span>
                  </div>
                </div>

                {/* Order Info */}
                <div className="memphis-card p-5 bg-white border-[2px] border-black">
                  <h3 className="font-black text-lg mb-3 uppercase">訂單資訊</h3>
                  <div className="space-y-1">
                    <InfoRow label="訂單編號" value={order.orderNumber} />
                    <InfoRow label="訂花人" value={order.orderingPersonName} />
                    <InfoRow label="收花人" value={order.recipientPersonName} />
                    <InfoRow label="配送地址" value={order.recipientPersonAddress ? `${order.recipientPersonAddress} (店內自取/配送地址)` : undefined} />
                    <InfoRow label="配送日期" value={order.deliveryDate} />
                    <InfoRow label="時段" value={order.timeslot} />
                    <InfoRow label="花卉" value={order.flowerName} />
                    <InfoRow label="金額" value={order.totalAmount ? `$${order.totalAmount}` : undefined} />
                  </div>
                </div>

                {/* Payment Info (only if confirmed) */}
                {(order.status === "awaiting_payment" || order.status === "paid" || order.status === "processing" || order.status === "completed") && (
                  <div className="memphis-card p-5 bg-[#FFF0A0]">
                    <h3 className="font-black text-lg mb-3 uppercase">💳 付款資訊</h3>
                    {order.paymentNote?.includes("免付款") || order.paymentNote?.includes("店內結清") ? (
                      <div className="p-4 bg-white border-[2px] border-black rounded-lg text-center">
                        <div className="font-black text-lg text-[#FF7B6B]">✓ 免付款（店內結清）</div>
                        <div className="text-sm font-bold text-black/60 mt-2">{order.paymentNote}</div>
                      </div>
                    ) : bankAccounts.length > 0 ? (
                      <div className="space-y-3">
                        {bankAccounts.map((acc) => (
                          <div key={acc.id} className="p-3 bg-white border-[2px] border-black rounded-lg">
                            <div className="font-black">{acc.bankName}</div>
                            <div className="text-sm font-bold text-black/60">{acc.accountName}</div>
                            <div className="font-mono font-bold mt-1">{acc.accountNumber}</div>
                            {acc.branchName && <div className="text-xs font-bold text-black/50">{acc.branchName}</div>}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-3 bg-white border-[2px] border-black rounded-lg text-center text-gray-500 font-bold">
                        尚無付款資訊
                      </div>
                    )}
                  </div>
                )}

                {/* Messages */}
                <div className="memphis-card p-5 bg-white border-[2px] border-black">
                  <h3 className="font-black text-lg mb-3 uppercase">💬 溝通記錄</h3>
                  <div className="space-y-3 max-h-96 overflow-y-auto mb-4">
                    {messages.length === 0 ? (
                      <div className="text-center py-6 text-gray-500 font-bold">暫無訊息</div>
                    ) : (
                      messages.map((msg) => (
                        <div key={msg.id} className={`p-3 rounded-lg ${msg.senderType === "staff" ? "bg-[#B8F0D8]" : "bg-[#FFD6C0]"}`}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-black text-sm">{msg.senderType === "staff" ? "👤 員工" : "👨 您"}</span>
                            <span className="text-xs font-bold text-black/50">
                              {new Date(msg.createdAt).toLocaleString("zh-TW")}
                            </span>
                          </div>
                          <p className="font-bold text-sm">{msg.content}</p>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Send message */}
                  {order.status !== "cancelled" && (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (!msgContent.trim()) {
                          toast.error("請輸入訊息");
                          return;
                        }
                        sendMsg.mutate({
                          orderNumber: queriedNumber,
                          content: msgContent,
                          orderingPersonName: orderingPersonName || "客戶",
                        });
                      }}
                      className="flex gap-2"
                    >
                      <input
                        type="text"
                        value={orderingPersonName}
                        onChange={(e) => setSenderName(e.target.value)}
                        placeholder="您的名字（選填）"
                        className="px-3 py-2 bg-white border-[2px] border-black rounded-lg font-bold text-sm w-32"
                      />
                      <input
                        type="text"
                        value={msgContent}
                        onChange={(e) => setMsgContent(e.target.value)}
                        placeholder="輸入訊息..."
                        className="flex-1 px-3 py-2 bg-white border-[2px] border-black rounded-lg font-bold text-sm"
                      />
                      <button
                        type="submit"
                        disabled={sendMsg.isPending}
                        className="px-4 py-2 bg-[#FF7B6B] text-white font-black text-sm uppercase rounded-lg disabled:opacity-60"
                      >
                        發送
                      </button>
                    </form>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
