import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useStaffAuth } from "@/contexts/StaffAuthContext";
import { toast } from "sonner";
import { useLocation } from "wouter";

const categoryOptions = [
  { value: "holiday", label: "節慶花卉配送" },
  { value: "other", label: "其他（自填）" },
];

export default function CreateOrderPage() {
  const { staff } = useStaffAuth();
  const [, navigate] = useLocation();
  const { data: flowers = [] } = trpc.flowers.activeList.useQuery();
  const { data: regions = [] } = trpc.regions.list.useQuery();
  const { data: folders = [] } = trpc.folders.list.useQuery();

  const [form, setForm] = useState({
    senderName: "", senderPhone: "", senderEmail: "", taxId: "",
    recipientName: "", recipientPhone: "", recipientAddress: "",
    deliveryType: "pickup" as "pickup" | "delivery",
    regionId: undefined as number | undefined,
    deliveryDate: "", timeslot: "",
    flowerId: undefined as number | undefined,
    flowerName: "", flowerQuantity: "1", flowerUnit: "束",
    customFlowerPrice: "", flowerPrice: "",
    needCard: false, cardContent: "", cardPrice: "0",
    category: "other" as "holiday" | "other",
    categoryNote: "",
    totalAmount: "0",
    internalNote: "",
    createdByStaff: true,
    staffId: staff?.id,
  });

  const setF = (field: string, value: any) => setForm(f => ({ ...f, [field]: value }));

  const selectedFlower = flowers.find(f => f.id === form.flowerId);

  const calcTotal = () => {
    const flowerP = form.flowerId && selectedFlower && !selectedFlower.isCustom
      ? Number(selectedFlower.price || 0) * Number(form.flowerQuantity || 1)
      : Number(form.customFlowerPrice || 0);
    const cardP = form.needCard ? Number(form.cardPrice || 0) : 0;
    const region = regions.find(r => r.id === form.regionId);
    const deliveryP = form.deliveryType === "delivery" ? Number(region?.deliveryFee || 0) : 0;
    return String(flowerP + cardP + deliveryP);
  };

  const createMutation = trpc.orders.create.useMutation({
    onSuccess: (data) => {
      toast.success(`訂單建立成功！訂單編號：${data.orderNumber}`);
      navigate("/orders");
    },
    onError: (e) => {
      if (e.message === "FULLY_BOOKED") toast.error("此時段已額滿，請選擇其他時段");
      else toast.error(e.message || "建立失敗");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.senderName || !form.senderPhone) { toast.error("請填寫寄件人資訊"); return; }
    if (!form.recipientName || !form.recipientPhone) { toast.error("請填寫收件人資訊"); return; }
    if (form.deliveryType === "delivery" && !form.recipientAddress) { toast.error("外送需填寫地址"); return; }
    const total = calcTotal();
    createMutation.mutate({ ...form, totalAmount: total, flowerPrice: form.flowerPrice || String(selectedFlower?.price || "") });
  };

  const inputCls = "w-full px-3 py-2 bg-white border-[2px] border-black rounded-lg font-bold text-sm";
  const labelCls = "block text-xs font-black uppercase tracking-wide mb-1";

  const flowersByFolder = folders.map(fd => ({
    folder: fd,
    flowers: flowers.filter(f => f.folderId === fd.id),
  }));
  const noFolderFlowers = flowers.filter(f => !f.folderId);

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="memphis-title text-3xl text-black">新增訂單</h1>
        <p className="text-black font-bold mt-1">員工直接建立訂單，無需付款流程</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Sender info */}
        <div className="memphis-card p-6 bg-[#B8F0D8]">
          <h2 className="memphis-title text-lg mb-4">📤 寄件人資訊</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div><label className={labelCls}>姓名 *</label><input value={form.senderName} onChange={e => setF("senderName", e.target.value)} className={inputCls} placeholder="寄件人姓名" /></div>
            <div><label className={labelCls}>電話 *</label><input value={form.senderPhone} onChange={e => setF("senderPhone", e.target.value)} className={inputCls} placeholder="0912345678" /></div>
            <div><label className={labelCls}>Email</label><input type="email" value={form.senderEmail} onChange={e => setF("senderEmail", e.target.value)} className={inputCls} placeholder="email@example.com" /></div>
            <div><label className={labelCls}>統一編號</label><input value={form.taxId} onChange={e => setF("taxId", e.target.value)} className={inputCls} placeholder="12345678" /></div>
          </div>
        </div>

        {/* Recipient info */}
        <div className="memphis-card p-6 bg-[#D4C5F9]">
          <h2 className="memphis-title text-lg mb-4">📥 收件人資訊</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div><label className={labelCls}>姓名 *</label><input value={form.recipientName} onChange={e => setF("recipientName", e.target.value)} className={inputCls} placeholder="收件人姓名" /></div>
            <div><label className={labelCls}>電話 *</label><input value={form.recipientPhone} onChange={e => setF("recipientPhone", e.target.value)} className={inputCls} placeholder="0912345678" /></div>
          </div>
        </div>

        {/* Delivery */}
        <div className="memphis-card p-6 bg-[#FFF0A0]">
          <h2 className="memphis-title text-lg mb-4">🚚 配送方式</h2>
          <div className="flex gap-4 mb-4">
            {(["pickup","delivery"] as const).map(type => (
              <button key={type} type="button" onClick={() => setF("deliveryType", type)}
                className={`memphis-btn px-5 py-2.5 font-black text-sm uppercase rounded-lg ${form.deliveryType === type ? "bg-[#FF7B6B] text-white" : "bg-white text-black"}`}>
                {type === "pickup" ? "🏪 自取" : "🚚 外送"}
              </button>
            ))}
          </div>
          {form.deliveryType === "delivery" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>配送地址 *</label>
                <input value={form.recipientAddress} onChange={e => setF("recipientAddress", e.target.value)} className={inputCls} placeholder="台北市信義區..." />
              </div>
              <div>
                <label className={labelCls}>配送區域</label>
                <select value={form.regionId || ""} onChange={e => setF("regionId", e.target.value ? Number(e.target.value) : undefined)} className={inputCls}>
                  <option value="">選擇區域</option>
                  {regions.filter(r => r.isActive).map(r => <option key={r.id} value={r.id}>{r.name}（NT$ {r.deliveryFee}）</option>)}
                </select>
              </div>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div><label className={labelCls}>配送日期</label><input type="date" value={form.deliveryDate} onChange={e => setF("deliveryDate", e.target.value)} className={inputCls} /></div>
            <div>
              <label className={labelCls}>時段</label>
              <select value={form.timeslot} onChange={e => setF("timeslot", e.target.value)} className={inputCls}>
                <option value="">選擇時段</option>
                {["09:00-12:00","12:00-15:00","15:00-18:00","18:00-21:00","全天"].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Flower selection */}
        <div className="memphis-card p-6 bg-[#FFD6C0]">
          <h2 className="memphis-title text-lg mb-4">🌸 花卉選擇</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className={labelCls}>類別</label>
              <select value={form.category} onChange={e => setF("category", e.target.value)} className={inputCls}>
                {categoryOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            {form.category === "other" && (
              <div><label className={labelCls}>類別說明</label><input value={form.categoryNote} onChange={e => setF("categoryNote", e.target.value)} className={inputCls} placeholder="請說明..." /></div>
            )}
          </div>

          <div className="mb-4">
            <label className={labelCls}>花卉款式</label>
            <select value={form.flowerId || ""} onChange={e => {
              const id = e.target.value ? Number(e.target.value) : undefined;
              const flower = flowers.find(f => f.id === id);
              setForm(f => ({ ...f, flowerId: id, flowerName: flower?.name || "", flowerUnit: flower?.unit || "束", flowerPrice: flower?.price || "" }));
            }} className={inputCls}>
              <option value="">選擇花卉款式</option>
              {noFolderFlowers.map(f => <option key={f.id} value={f.id}>{f.name} - NT$ {f.isCustom ? "自訂" : f.price}/{f.unit}</option>)}
              {flowersByFolder.filter(g => g.flowers.length > 0).map(g => (
                <optgroup key={g.folder.id} label={`📁 ${g.folder.name}`}>
                  {g.flowers.map(f => <option key={f.id} value={f.id}>{f.name} - NT$ {f.isCustom ? "自訂" : f.price}/{f.unit}</option>)}
                </optgroup>
              ))}
            </select>
          </div>

          {selectedFlower?.isCustom && (
            <div className="mb-4">
              <label className={labelCls}>自訂花卉名稱</label>
              <input value={form.flowerName} onChange={e => setF("flowerName", e.target.value)} className={inputCls} placeholder="請描述您想要的花卉..." />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className={labelCls}>數量</label>
              <input type="number" min={1} value={form.flowerQuantity} onChange={e => setF("flowerQuantity", e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>單位</label>
              <input value={form.flowerUnit} onChange={e => setF("flowerUnit", e.target.value)} className={inputCls} placeholder="束、對、盆..." />
            </div>
            {(selectedFlower?.isCustom || !form.flowerId) && (
              <div>
                <label className={labelCls}>花卉價格（NT$）</label>
                <input type="number" value={form.customFlowerPrice} onChange={e => setF("customFlowerPrice", e.target.value)} className={inputCls} placeholder="0" />
              </div>
            )}
          </div>

          {selectedFlower && !selectedFlower.isCustom && (
            <div className="mt-3 p-3 bg-[#B8F0D8] border-[2px] border-black rounded-lg">
              <span className="font-black text-sm">💰 花卉小計：NT$ {Number(selectedFlower.price || 0) * Number(form.flowerQuantity || 1)}</span>
            </div>
          )}
        </div>

        {/* Card */}
        <div className="memphis-card p-6">
          <h2 className="memphis-title text-lg mb-4">💌 卡片需求</h2>
          <label className="flex items-center gap-3 cursor-pointer mb-4">
            <input type="checkbox" checked={form.needCard} onChange={e => setF("needCard", e.target.checked)} className="w-5 h-5 border-[2px] border-black rounded" />
            <span className="font-black text-base">需要附卡片</span>
          </label>
          {form.needCard && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className={labelCls}>卡片內容</label>
                <textarea value={form.cardContent} onChange={e => setF("cardContent", e.target.value)} className={`${inputCls} resize-none`} rows={3} placeholder="祝你生日快樂..." />
              </div>
              <div>
                <label className={labelCls}>卡片費用（NT$）</label>
                <input type="number" value={form.cardPrice} onChange={e => setF("cardPrice", e.target.value)} className={inputCls} />
              </div>
            </div>
          )}
        </div>

        {/* Notes */}
        <div className="memphis-card p-6 bg-[#D4C5F9]">
          <h2 className="memphis-title text-lg mb-4">📝 備註</h2>
          <div>
            <label className={labelCls}>內部備註（客戶不可見）</label>
            <textarea value={form.internalNote} onChange={e => setF("internalNote", e.target.value)} className={`${inputCls} resize-none`} rows={3} placeholder="員工內部備註..." />
          </div>
        </div>

        {/* Total */}
        <div className="memphis-card p-6 bg-[#FF7B6B]">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="memphis-title text-2xl text-white">訂單總金額</h2>
              <p className="text-white/80 font-bold text-sm mt-1">花卉 + 卡片 + 運費</p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-black text-white">NT$ {calcTotal()}</div>
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <button type="submit" disabled={createMutation.isPending}
            className="memphis-btn flex-1 py-3.5 bg-[#FF7B6B] text-white font-black text-lg uppercase tracking-wide rounded-xl">
            {createMutation.isPending ? "建立中..." : "✓ 建立訂單"}
          </button>
          <button type="button" onClick={() => navigate("/orders")}
            className="memphis-btn px-8 py-3.5 bg-white text-black font-black text-lg uppercase tracking-wide rounded-xl">
            取消
          </button>
        </div>
      </form>
    </div>
  );
}
