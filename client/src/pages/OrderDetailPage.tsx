import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useStaffAuth } from "@/contexts/StaffAuthContext";
import { toast } from "sonner";
import { useParams, useLocation } from "wouter";

const statusMap: Record<string, { label: string; cls: string }> = {
  pending:          { label: "待審核",   cls: "status-pending" },
  confirmed:        { label: "已確認",   cls: "status-confirmed" },
  awaiting_payment: { label: "待付款",   cls: "status-awaiting" },
  paid:             { label: "已付款",   cls: "status-paid" },
  processing:       { label: "處理中",   cls: "status-processing" },
  completed:        { label: "已完成",   cls: "status-completed" },
  cancelled:        { label: "已取消",   cls: "status-cancelled" },
  fully_booked:     { label: "已額滿",   cls: "status-booked" },
};

const statusFlow = ["pending","confirmed","awaiting_payment","paid","processing","completed"];

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { staff } = useStaffAuth();
  const utils = trpc.useUtils();
  const orderId = Number(id);

  const { data: order, isLoading } = trpc.orders.detail.useQuery({ id: orderId });
  const { data: messages = [] } = trpc.messages.listByOrderId.useQuery({ orderId });
  const { data: bankAccounts = [] } = trpc.bankAccounts.list.useQuery();
  const { data: regions = [] } = trpc.regions.list.useQuery();

  const [msgContent, setMsgContent] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  const [statusNote, setStatusNote] = useState("");
  const [selectedBankId, setSelectedBankId] = useState<number | undefined>();

  const updateStatus = trpc.orders.updateStatus.useMutation({
    onSuccess: () => { toast.success("狀態已更新"); utils.orders.detail.invalidate({ id: orderId }); },
    onError: e => toast.error(e.message),
  });
  const updateOrder = trpc.orders.update.useMutation({
    onSuccess: () => { toast.success("訂單已更新"); utils.orders.detail.invalidate({ id: orderId }); setEditMode(false); },
    onError: e => toast.error(e.message),
  });
  const sendMsg = trpc.messages.sendStaff.useMutation({
    onSuccess: () => { toast.success("訊息已發送"); utils.messages.listByOrderId.invalidate({ orderId }); setMsgContent(""); },
    onError: e => toast.error(e.message),
  });

  if (isLoading) return <div className="p-8 text-center font-bold text-gray-400 text-xl">載入中...</div>;
  if (!order) return <div className="p-8 text-center font-bold text-gray-400 text-xl">找不到此訂單</div>;

  const s = statusMap[order.status] || { label: order.status, cls: "" };
  const region = regions.find(r => r.id === order.regionId);

  const handleStatusChange = (newStatus: string) => {
    const payload: any = { id: orderId, status: newStatus as any };
    if (newStatus === "awaiting_payment" && selectedBankId) payload.bankAccountId = selectedBankId;
    if (statusNote) payload.paymentNote = statusNote;
    updateStatus.mutate(payload);
  };

  const InfoRow = ({ label, value }: { label: string; value?: string | null }) => (
    value ? (
      <div className="flex gap-2">
        <span className="text-xs font-black uppercase text-gray-500 w-24 flex-shrink-0 pt-0.5">{label}</span>
        <span className="font-bold text-sm">{value}</span>
      </div>
    ) : null
  );

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <button onClick={() => navigate("/orders")} className="text-sm font-black text-[#FF7B6B] hover:underline mb-2 block">← 返回列表</button>
          <h1 className="memphis-title text-2xl text-black">{order.orderNumber}</h1>
          <div className="flex items-center gap-3 mt-1">
            <span className={`memphis-badge ${s.cls}`}>{s.label}</span>
            <span className="text-sm font-bold text-gray-500">{order.createdAt ? new Date(order.createdAt).toLocaleDateString("zh-TW") : ""}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setEditMode(!editMode); setEditForm({ ...order }); }}
            className="memphis-btn px-4 py-2 bg-[#FFF0A0] text-black font-black text-sm uppercase rounded-lg">
            {editMode ? "✕ 取消編輯" : "✏️ 編輯"}
          </button>
        </div>
      </div>

      {/* Status flow */}
      <div className="memphis-card p-5 bg-[#FFD6C0]">
        <h2 className="memphis-title text-base mb-4">訂單狀態管理</h2>
        <div className="flex flex-wrap gap-2 mb-4">
          {statusFlow.map((st, i) => {
            const sm = statusMap[st];
            const isCurrent = order.status === st;
            return (
              <button key={st} onClick={() => handleStatusChange(st)} disabled={updateStatus.isPending}
                className={`memphis-btn px-3 py-1.5 font-black text-xs uppercase rounded-lg ${isCurrent ? "bg-[#111] text-white" : "bg-white text-black"}`}>
                {i + 1}. {sm.label}
              </button>
            );
          })}
          <button onClick={() => handleStatusChange("cancelled")} disabled={updateStatus.isPending}
            className="memphis-btn px-3 py-1.5 bg-[#FF7B6B] text-white font-black text-xs uppercase rounded-lg">
            取消訂單
          </button>
        </div>

        {/* Payment info when moving to awaiting_payment */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-black uppercase mb-1">付款帳號（確認付款時顯示給客戶）</label>
            <select value={selectedBankId || ""} onChange={e => setSelectedBankId(e.target.value ? Number(e.target.value) : undefined)}
              className="w-full px-3 py-2 bg-white border-[2px] border-black rounded-lg font-bold text-sm">
              <option value="">選擇付款帳號</option>
              {bankAccounts.filter(b => b.isActive).map(b => <option key={b.id} value={b.id}>{b.bankName} - {b.accountNumber}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-black uppercase mb-1">付款備註</label>
            <input value={statusNote} onChange={e => setStatusNote(e.target.value)}
              className="w-full px-3 py-2 bg-white border-[2px] border-black rounded-lg font-bold text-sm" placeholder="付款說明..." />
          </div>
        </div>
      </div>

      {/* Order details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Sender */}
        <div className="memphis-card p-5 bg-[#B8F0D8]">
          <h2 className="memphis-title text-base mb-3">📤 寄件人</h2>
          <div className="space-y-2">
            <InfoRow label="姓名" value={order.senderName} />
            <InfoRow label="電話" value={order.senderPhone} />
            <InfoRow label="Email" value={order.senderEmail} />
            <InfoRow label="統編" value={order.taxId} />
          </div>
        </div>

        {/* Recipient */}
        <div className="memphis-card p-5 bg-[#D4C5F9]">
          <h2 className="memphis-title text-base mb-3">📥 收件人</h2>
          <div className="space-y-2">
            <InfoRow label="姓名" value={order.recipientName} />
            <InfoRow label="電話" value={order.recipientPhone} />
            <InfoRow label="地址" value={order.recipientAddress} />
            <InfoRow label="配送方式" value={order.deliveryType === "pickup" ? "自取" : "外送"} />
            {region && <InfoRow label="區域" value={`${region.name}（NT$ ${region.deliveryFee}）`} />}
            <InfoRow label="配送日期" value={order.deliveryDate} />
            <InfoRow label="時段" value={order.timeslot} />
          </div>
        </div>

        {/* Flower */}
        <div className="memphis-card p-5 bg-[#FFD6C0]">
          <h2 className="memphis-title text-base mb-3">🌸 花卉資訊</h2>
          <div className="space-y-2">
            <InfoRow label="款式" value={order.flowerName} />
            <InfoRow label="數量" value={`${order.flowerQuantity} ${order.flowerUnit}`} />
            <InfoRow label="單價" value={order.flowerPrice ? `NT$ ${order.flowerPrice}` : undefined} />
            <InfoRow label="類別" value={order.category === "holiday" ? "節慶花卉配送" : `其他${order.categoryNote ? `：${order.categoryNote}` : ""}`} />
          </div>
        </div>

        {/* Card & Payment */}
        <div className="memphis-card p-5 bg-[#FFF0A0]">
          <h2 className="memphis-title text-base mb-3">💰 金額與卡片</h2>
          <div className="space-y-2">
            {order.needCard && <>
              <InfoRow label="卡片" value="需要" />
              <InfoRow label="卡片內容" value={order.cardContent} />
              <InfoRow label="卡片費用" value={`NT$ ${order.cardPrice || 0}`} />
            </>}
            <div className="border-t-[2px] border-black pt-2 mt-2">
              <div className="flex justify-between items-center">
                <span className="font-black uppercase text-sm">總金額</span>
                <span className="font-black text-xl text-[#FF7B6B]">NT$ {order.totalAmount || 0}</span>
              </div>
            </div>
            {order.paymentNote && <InfoRow label="付款備註" value={order.paymentNote} />}
          </div>
        </div>
      </div>

      {/* Internal note */}
      {order.internalNote && (
        <div className="memphis-card p-5 bg-[#111]">
          <h2 className="memphis-title text-base text-white mb-2">🔒 內部備註</h2>
          <p className="text-gray-300 font-bold text-sm">{order.internalNote}</p>
        </div>
      )}

      {/* Edit form */}
      {editMode && (
        <div className="memphis-card p-6 bg-[#B8F0D8]">
          <h2 className="memphis-title text-lg mb-4">✏️ 編輯訂單</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { label: "寄件人姓名", field: "senderName" }, { label: "寄件人電話", field: "senderPhone" },
              { label: "收件人姓名", field: "recipientName" }, { label: "收件人電話", field: "recipientPhone" },
              { label: "收件人地址", field: "recipientAddress" }, { label: "統一編號", field: "taxId" },
              { label: "配送日期", field: "deliveryDate", type: "date" }, { label: "時段", field: "timeslot" },
              { label: "花卉名稱", field: "flowerName" }, { label: "數量", field: "flowerQuantity" },
              { label: "單位", field: "flowerUnit" }, { label: "花卉價格", field: "flowerPrice", type: "number" },
              { label: "卡片費用", field: "cardPrice", type: "number" }, { label: "總金額", field: "totalAmount", type: "number" },
            ].map(({ label, field, type = "text" }) => (
              <div key={field}>
                <label className="block text-xs font-black uppercase mb-1">{label}</label>
                <input type={type} value={editForm[field] || ""} onChange={e => setEditForm((f: any) => ({ ...f, [field]: e.target.value }))}
                  className="w-full px-3 py-2 bg-white border-[2px] border-black rounded-lg font-bold text-sm" />
              </div>
            ))}
            <div className="md:col-span-2">
              <label className="block text-xs font-black uppercase mb-1">卡片內容</label>
              <textarea value={editForm.cardContent || ""} onChange={e => setEditForm((f: any) => ({ ...f, cardContent: e.target.value }))}
                className="w-full px-3 py-2 bg-white border-[2px] border-black rounded-lg font-bold text-sm resize-none" rows={2} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-black uppercase mb-1">內部備註</label>
              <textarea value={editForm.internalNote || ""} onChange={e => setEditForm((f: any) => ({ ...f, internalNote: e.target.value }))}
                className="w-full px-3 py-2 bg-white border-[2px] border-black rounded-lg font-bold text-sm resize-none" rows={2} />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={() => updateOrder.mutate({ id: orderId, ...editForm })} disabled={updateOrder.isPending}
              className="memphis-btn px-6 py-2.5 bg-[#FF7B6B] text-white font-black uppercase rounded-lg">
              {updateOrder.isPending ? "儲存中..." : "儲存變更"}
            </button>
            <button onClick={() => setEditMode(false)} className="memphis-btn px-6 py-2.5 bg-white text-black font-black uppercase rounded-lg">取消</button>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="memphis-card overflow-hidden">
        <div className="p-4 bg-[#111] border-b-[2px] border-black">
          <h2 className="text-white font-black uppercase tracking-wide">💬 客戶互動記錄</h2>
        </div>
        <div className="p-4 space-y-3 max-h-80 overflow-y-auto">
          {messages.length === 0 ? (
            <div className="text-center py-4 text-gray-400 font-bold">尚無互動記錄</div>
          ) : messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.senderType === "staff" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[70%] rounded-xl px-4 py-3 border-[2px] border-black ${msg.senderType === "staff" ? "bg-[#FF7B6B] text-white" : "bg-[#B8F0D8] text-black"}`}>
                <div className="text-xs font-black uppercase mb-1 opacity-70">{msg.senderName} · {msg.senderType === "staff" ? "員工" : "客戶"}</div>
                <div className="font-bold text-sm">{msg.content}</div>
                <div className="text-xs opacity-60 mt-1">{msg.createdAt ? new Date(msg.createdAt).toLocaleString("zh-TW") : ""}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="p-4 border-t-[2px] border-black bg-[#FFF0A0]">
          <div className="flex gap-3">
            <textarea value={msgContent} onChange={e => setMsgContent(e.target.value)}
              className="flex-1 px-3 py-2 bg-white border-[2px] border-black rounded-lg font-bold text-sm resize-none"
              rows={2} placeholder="輸入訊息給客戶..." />
            <button onClick={() => { if (!msgContent.trim()) return; sendMsg.mutate({ orderId, content: msgContent }); }}
              disabled={sendMsg.isPending || !msgContent.trim()}
              className="memphis-btn px-5 py-2 bg-[#FF7B6B] text-white font-black uppercase rounded-lg self-end">
              發送
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
