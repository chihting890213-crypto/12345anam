import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const areaLabels = { north: "北部", central: "中部", south: "南部", east: "東部" };
type Area = keyof typeof areaLabels;

export default function AdminRegionsPage() {
  const utils = trpc.useUtils();
  const { data: regions = [], isLoading } = trpc.regions.list.useQuery();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ name: "", area: "north" as Area, deliveryFee: "0", isActive: true });

  const create = trpc.regions.create.useMutation({ onSuccess: () => { toast.success("已新增"); utils.regions.list.invalidate(); setShowForm(false); setForm({ name: "", area: "north", deliveryFee: "0", isActive: true }); }, onError: e => toast.error(e.message) });
  const update = trpc.regions.update.useMutation({ onSuccess: () => { toast.success("已更新"); utils.regions.list.invalidate(); setEditId(null); }, onError: e => toast.error(e.message) });
  const del = trpc.regions.delete.useMutation({ onSuccess: () => { toast.success("已刪除"); utils.regions.list.invalidate(); }, onError: e => toast.error(e.message) });

  const areaColors: Record<Area, string> = { north: "#B8F0D8", central: "#D4C5F9", south: "#FFF0A0", east: "#FFB899" };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="memphis-title text-3xl text-black">區域管理</h1>
          <p className="text-black font-bold mt-1">設定配送區域與運費</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="memphis-btn px-5 py-2.5 bg-[#FF7B6B] text-white font-black uppercase tracking-wide rounded-lg">
          {showForm ? "✕ 取消" : "＋ 新增區域"}
        </button>
      </div>

      {showForm && (
        <div className="memphis-card p-6 bg-[#B8F0D8]">
          <h2 className="memphis-title text-lg mb-4">新增配送區域</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-black uppercase mb-1">區域名稱 *</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full px-3 py-2 bg-white border-[2px] border-black rounded-lg font-bold" placeholder="台北市" />
            </div>
            <div>
              <label className="block text-xs font-black uppercase mb-1">大區</label>
              <select value={form.area} onChange={e => setForm(f => ({ ...f, area: e.target.value as Area }))}
                className="w-full px-3 py-2 bg-white border-[2px] border-black rounded-lg font-bold">
                {Object.entries(areaLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-black uppercase mb-1">運費（NT$）</label>
              <input type="number" value={form.deliveryFee} onChange={e => setForm(f => ({ ...f, deliveryFee: e.target.value }))}
                className="w-full px-3 py-2 bg-white border-[2px] border-black rounded-lg font-bold" />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={() => { if (!form.name) { toast.error("請填寫名稱"); return; } create.mutate(form as any); }}
              className="memphis-btn px-6 py-2.5 bg-[#FF7B6B] text-white font-black uppercase rounded-lg">新增</button>
            <button onClick={() => setShowForm(false)} className="memphis-btn px-6 py-2.5 bg-white text-black font-black uppercase rounded-lg">取消</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {isLoading ? <div className="col-span-2 text-center py-8 font-bold text-gray-400">載入中...</div> :
          regions.length === 0 ? <div className="col-span-2 text-center py-8 font-bold text-gray-400">尚無區域設定</div> :
          regions.map(region => (
            <div key={region.id} className="memphis-card p-5" style={{ background: areaColors[region.area as Area] || "#FFD6C0" }}>
              {editId === region.id ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      className="px-3 py-2 bg-white border-[2px] border-black rounded-lg font-bold text-sm" />
                    <input type="number" value={form.deliveryFee} onChange={e => setForm(f => ({ ...f, deliveryFee: e.target.value }))}
                      className="px-3 py-2 bg-white border-[2px] border-black rounded-lg font-bold text-sm" placeholder="運費" />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => update.mutate({ id: region.id, name: form.name, deliveryFee: form.deliveryFee, isActive: form.isActive })}
                      className="memphis-btn px-4 py-1.5 bg-white text-black font-black text-xs uppercase rounded-lg">儲存</button>
                    <button onClick={() => setEditId(null)} className="memphis-btn px-4 py-1.5 bg-[#111] text-white font-black text-xs uppercase rounded-lg">取消</button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="font-black text-xl">{region.name}</div>
                      <div className="font-bold text-sm text-black/70">{areaLabels[region.area as Area]} 大區</div>
                    </div>
                    {!region.isActive && <span className="memphis-badge status-cancelled">停用</span>}
                  </div>
                  <div className="font-black text-lg mb-4">運費 NT$ {region.deliveryFee || 0}</div>
                  <div className="flex gap-2">
                    <button onClick={() => { setEditId(region.id); setForm({ name: region.name, area: region.area as Area, deliveryFee: region.deliveryFee || "0", isActive: region.isActive }); }}
                      className="memphis-btn px-3 py-1.5 bg-white text-black font-black text-xs uppercase rounded-lg">編輯</button>
                    <button onClick={() => update.mutate({ id: region.id, isActive: !region.isActive })}
                      className={`memphis-btn px-3 py-1.5 font-black text-xs uppercase rounded-lg ${region.isActive ? "bg-[#FFB0A0] text-black" : "bg-[#B8F0D8] text-black"}`}>
                      {region.isActive ? "停用" : "啟用"}
                    </button>
                    <button onClick={() => { if (confirm(`確定刪除 ${region.name}？`)) del.mutate({ id: region.id }); }}
                      className="memphis-btn px-3 py-1.5 bg-[#111] text-white font-black text-xs uppercase rounded-lg">刪除</button>
                  </div>
                </>
              )}
            </div>
          ))
        }
      </div>
    </div>
  );
}
