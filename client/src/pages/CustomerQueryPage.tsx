import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const statusMap: Record<string, { label: string; cls: string; desc: string }> = {
  pending:          { label: "待審核",   cls: "status-pending",    desc: "您的訂單正在等待員工審核" },
  confirmed:        { label: "已確認",   cls: "status-confirmed",  desc: "訂單已確認，請等待付款資訊" },
  awaiting_payment: { label: "待付款",   cls: "status-awaiting",   desc: "請依照付款資訊完成付款" },
  paid:             { label: "已付款",   cls: "status-paid",       desc: "付款已確認，訂單處理中" },
  processing:       { label: "處理中",   cls: "status-processing", desc: "花卉準備中，即將配送" },
  completed:        { label: "已完成",   cls: "status-completed",  desc: "訂單已完成，感謝您的購買！" },
  cancelled:        { label: "已取消",   cls: "status-cancelled",  desc: "此訂單已取消" },
  fully_booked:     { label: "已額滿",   cls: "status-booked",     desc: "此時段已額滿，請聯繫員工" },
};

export default function CustomerQueryPage() {
  const [orderNumber, setOrderNumber] = useState("");
  const [queriedNumber, setQueriedNumber] = useState("");
  const [msgContent, setMsgContent] = useState("");
  const [senderName, setSenderName] = useState("");

  const { data: order, isLoading, error, refetch } = trpc.orders.byNumber.useQuery(
    { orderNumber: queriedNumber },
    { enabled: !!queriedNumber, retry: false }
  );
  const { data: messages = [], refetch: refetchMsgs } = trpc.messages.list.useQuery(
    { orderNumber: queriedNumber },
    { enabled: !!queriedNumber && !!order }
  );

  const sendMsg = trpc.messages.sendCustomer.useMutation({
    onSuccess: () => { toast.success("訊息已發送！"); setMsgContent(""); refetchMsgs(); },
    onError: e => toast.error(e.message),
  });

  const handleQuery = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderNumber.trim()) { toast.error("請輸入訂單編號"); return; }
    setQueriedNumber(orderNumber.trim().toUpperCase());
  };

  const s = order ? (statusMap[order.status] || { label: order.status, cls: "", desc: "" }) : null;

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

      <div className="relative z-10 max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-block bg-[#FF7B6B] border-[3px] border-black rounded-2xl px-6 py-3 mb-4 shadow-[4px_4px_0px_#111]">
            <span className="text-4xl">🌸</span>
          </div>
          <h1 className="memphis-title text-4xl text-black mb-2">訂單查詢</h1>
          <p className="text-black font-bold">輸入訂單編號查詢您的訂單狀態</p>
          <div className="flex justify-center gap-2 mt-3">
            {["#FF7B6B","#B8F0D8","#D4C5F9","#FFF0A0"].map((c,i) => (
              <div key={i} className="w-3 h-3 rounded-full border-[2px] border-black" style={{ background: c }} />
            ))}
          </div>
        </div>

        {/* Query form */}
        <div className="memphis-card p-6 mb-6">
          <form onSubmit={handleQuery} className="flex gap-3">
            <input
              value={orderNumber}
              onChange={e => setOrderNumber(e.target.value)}
              placeholder="例：FO20240101ABCDEF"
              className="flex-1 px-4 py-3 bg-white border-[2.5px] border-black rounded-lg font-bold text-base focus:outline-none focus:shadow-[3px_3px_0px_#111] transition-shadow"
            />
            <button type="submit" disabled={isLoading}
              className="memphis-btn px-6 py-3 bg-[#FF7B6B] text-white font-black uppercase tracking-wide rounded-lg">
              {isLoading ? "查詢中..." : "查詢"}
            </button>
          </form>
        </div>

        {/* Error */}
        {error && queriedNumber && (
          <div className="memphis-card p-5 bg-[#FFB0A0] mb-6">
            <div className="flex items-center gap-3">
              <span className="text-2xl">😔</span>
              <div>
                <div className="font-black text-lg">找不到此訂單</div>
                <div className="font-bold text-sm">請確認訂單編號是否正確</div>
              </div>
            </div>
          </div>
        )}

        {/* Order result */}
        {order && s && (
          <div className="space-y-5">
            {/* Status banner */}
            <div className={`memphis-card p-6 ${s.cls}`}>
              <div className="flex items-center gap-4">
                <div className="text-4xl">
                  {order.status === "completed" ? "🎉" : order.status === "cancelled" ? "😔" : order.status === "awaiting_payment" ? "💳" : "📦"}
                </div>
                <div>
                  <div className="font-black text-2xl">{s.label}</div>
                  <div className="font-bold text-sm mt-1">{s.desc}</div>
                </div>
              </div>
            </div>

            {/* Order info */}
            <div className="memphis-card p-6">
              <h2 className="memphis-title text-lg mb-4">訂單資訊</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <InfoRow label="訂單編號" value={order.orderNumber} />
                  <InfoRow label="寄件人" value={order.senderName} />
                  <InfoRow label="收件人" value={order.recipientName} />
                  <InfoRow label="配送方式" value={order.deliveryType === "pickup" ? "自取" : "外送"} />
                </div>
                <div className="space-y-1">
                  <InfoRow label="配送日期" value={order.deliveryDate} />
                  <InfoRow label="時段" value={order.timeslot} />
                  <InfoRow label="花卉款式" value={order.flowerName} />
                  <InfoRow label="數量" value={`${order.flowerQuantity} ${order.flowerUnit}`} />
                </div>
              </div>
              {order.needCard && (
                <div className="mt-3 p-3 bg-[#D4C5F9] border-[2px] border-black rounded-lg">
                  <div className="font-black text-sm mb-1">💌 卡片內容</div>
                  <div className="font-bold text-sm">{order.cardContent || "（無內容）"}</div>
                </div>
              )}
              <div className="mt-4 p-3 bg-[#FFF0A0] border-[2px] border-black rounded-lg flex justify-between items-center">
                <span className="font-black uppercase text-sm">訂單總金額</span>
                <span className="font-black text-2xl text-[#FF7B6B]">NT$ {order.totalAmount || 0}</span>
              </div>
            </div>

            {/* Payment info (only when awaiting_payment or paid) */}
            {(order.status === "awaiting_payment" || order.status === "paid") && (order as any).bankAccount && (
              <div className="memphis-card p-6 bg-[#B8F0D8]">
                <h2 className="memphis-title text-lg mb-4">💳 付款資訊</h2>
                <div className="space-y-2">
                  <InfoRow label="銀行" value={(order as any).bankAccount?.bankName} />
                  <InfoRow label="分行" value={(order as any).bankAccount?.branchName} />
                  <InfoRow label="帳號" value={(order as any).bankAccount?.accountNumber} />
                  <InfoRow label="戶名" value={(order as any).bankAccount?.accountName} />
                </div>
                <div className="mt-3 p-3 bg-white border-[2px] border-black rounded-lg">
                  <div className="font-black text-sm text-[#FF7B6B]">⚠️ 請轉帳 NT$ {order.totalAmount} 並保留轉帳截圖</div>
                  {order.paymentNote && <div className="font-bold text-sm mt-1">{order.paymentNote}</div>}
                </div>
              </div>
            )}

            {/* Messages */}
            <div className="memphis-card overflow-hidden">
              <div className="p-4 bg-[#111] border-b-[2px] border-black">
                <h2 className="text-white font-black uppercase">💬 與員工互動</h2>
              </div>
              <div className="p-4 space-y-3 max-h-72 overflow-y-auto">
                {messages.length === 0 ? (
                  <div className="text-center py-4 text-gray-400 font-bold">尚無訊息</div>
                ) : messages.map(msg => (
                  <div key={msg.id} className={`flex ${msg.senderType === "customer" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[75%] rounded-xl px-4 py-3 border-[2px] border-black ${msg.senderType === "customer" ? "bg-[#FF7B6B] text-white" : "bg-[#B8F0D8] text-black"}`}>
                      <div className="text-xs font-black uppercase mb-1 opacity-70">
                        {msg.senderType === "staff" ? "👩‍💼 員工" : "👤 您"} · {msg.senderName}
                      </div>
                      <div className="font-bold text-sm">{msg.content}</div>
                      <div className="text-xs opacity-60 mt-1">{msg.createdAt ? new Date(msg.createdAt).toLocaleString("zh-TW") : ""}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-4 border-t-[2px] border-black bg-[#FFF0A0]">
                <div className="flex gap-2 mb-2">
                  <input value={senderName} onChange={e => setSenderName(e.target.value)}
                    className="flex-1 px-3 py-2 bg-white border-[2px] border-black rounded-lg font-bold text-sm"
                    placeholder="您的姓名（選填）" />
                </div>
                <div className="flex gap-3">
                  <textarea value={msgContent} onChange={e => setMsgContent(e.target.value)}
                    className="flex-1 px-3 py-2 bg-white border-[2px] border-black rounded-lg font-bold text-sm resize-none"
                    rows={2} placeholder="輸入訊息給員工..." />
                  <button
                    onClick={() => {
                      if (!msgContent.trim()) return;
                      sendMsg.mutate({ orderNumber: queriedNumber, content: msgContent, senderName: senderName || undefined });
                    }}
                    disabled={sendMsg.isPending || !msgContent.trim()}
                    className="memphis-btn px-5 py-2 bg-[#FF7B6B] text-white font-black uppercase rounded-lg self-end">
                    發送
                  </button>
                </div>
              </div>
            </div>

            {/* Back to staff login */}
            <div className="text-center">
              <a href="/" className="text-sm font-black text-[#FF7B6B] hover:underline">← 員工登入</a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
