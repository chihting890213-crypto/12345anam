import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

type FlowerForm = {
  folderId?: number;
  name: string;
  description: string;
  price: string;
  unit: string;
  category: "holiday" | "other";
  isCustom: boolean;
  isActive: boolean;
  sortOrder: number;
};
const emptyFlower: FlowerForm = { name: "", description: "", price: "", unit: "束", category: "other", isCustom: false, isActive: true, sortOrder: 0 };

export default function AdminFlowersPage() {
  const utils = trpc.useUtils();
  const { data: folders = [] } = trpc.folders.list.useQuery();
  const { data: flowers = [], isLoading } = trpc.flowers.list.useQuery();
  const [activeTab, setActiveTab] = useState<"flowers" | "folders">("flowers");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<FlowerForm>(emptyFlower);
  const [folderName, setFolderName] = useState("");
  const [editFolderId, setEditFolderId] = useState<number | null>(null);
  const [editFolderName, setEditFolderName] = useState("");

  const createFlower = trpc.flowers.create.useMutation({
    onSuccess: () => { toast.success("花卉已新增"); utils.flowers.list.invalidate(); setShowForm(false); setForm(emptyFlower); },
    onError: e => toast.error(e.message),
  });
  const updateFlower = trpc.flowers.update.useMutation({
    onSuccess: () => { toast.success("已更新"); utils.flowers.list.invalidate(); setEditId(null); },
    onError: e => toast.error(e.message),
  });
  const deleteFlower = trpc.flowers.delete.useMutation({
    onSuccess: () => { toast.success("已刪除"); utils.flowers.list.invalidate(); },
    onError: e => toast.error(e.message),
  });
  const createFolder = trpc.folders.create.useMutation({
    onSuccess: () => { toast.success("資料夾已建立"); utils.folders.list.invalidate(); setFolderName(""); },
    onError: e => toast.error(e.message),
  });
  const updateFolder = trpc.folders.update.useMutation({
    onSuccess: () => { toast.success("已更新"); utils.folders.list.invalidate(); setEditFolderId(null); },
    onError: e => toast.error(e.message),
  });
  const deleteFolder = trpc.folders.delete.useMutation({
    onSuccess: () => { toast.success("已刪除"); utils.folders.list.invalidate(); },
    onError: e => toast.error(e.message),
  });

  const categoryLabel = (c: string) => c === "holiday" ? "節慶花卉配送" : "其他";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="memphis-title text-3xl text-black">花卉管理</h1>
          <p className="text-black font-bold mt-1">管理花卉款式與分類資料夾</p>
        </div>
        {activeTab === "flowers" && (
          <button onClick={() => { setShowForm(!showForm); setForm(emptyFlower); setEditId(null); }}
            className="memphis-btn px-5 py-2.5 bg-[#FF7B6B] text-white font-black uppercase tracking-wide rounded-lg">
            {showForm ? "✕ 取消" : "＋ 新增花卉"}
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {(["flowers", "folders"] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`memphis-btn px-5 py-2 font-black text-sm uppercase tracking-wide rounded-lg ${activeTab === tab ? "bg-[#111] text-white" : "bg-white text-black"}`}>
            {tab === "flowers" ? "🌸 花卉款式" : "📁 資料夾"}
          </button>
        ))}
      </div>

      {/* Flower form */}
      {activeTab === "flowers" && showForm && (
        <div className="memphis-card p-6 bg-[#B8F0D8]">
          <h2 className="memphis-title text-lg mb-4">{editId ? "編輯花卉" : "新增花卉"}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-black uppercase mb-1">花卉名稱 *</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full px-3 py-2 bg-white border-[2px] border-black rounded-lg font-bold" placeholder="玫瑰花束" />
            </div>
            <div>
              <label className="block text-xs font-black uppercase mb-1">所屬資料夾</label>
              <select value={form.folderId || ""} onChange={e => setForm(f => ({ ...f, folderId: e.target.value ? Number(e.target.value) : undefined }))}
                className="w-full px-3 py-2 bg-white border-[2px] border-black rounded-lg font-bold">
                <option value="">無資料夾</option>
                {folders.map(fd => <option key={fd.id} value={fd.id}>{fd.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-black uppercase mb-1">類別</label>
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as any }))}
                className="w-full px-3 py-2 bg-white border-[2px] border-black rounded-lg font-bold">
                <option value="holiday">節慶花卉配送</option>
                <option value="other">其他（自填）</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-black uppercase mb-1">價格（NT$）</label>
              <input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                className="w-full px-3 py-2 bg-white border-[2px] border-black rounded-lg font-bold" placeholder="0" disabled={form.isCustom} />
            </div>
            <div>
              <label className="block text-xs font-black uppercase mb-1">數量單位</label>
              <input value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}
                className="w-full px-3 py-2 bg-white border-[2px] border-black rounded-lg font-bold" placeholder="束、對、盆..." />
            </div>
            <div>
              <label className="block text-xs font-black uppercase mb-1">排序</label>
              <input type="number" value={form.sortOrder} onChange={e => setForm(f => ({ ...f, sortOrder: Number(e.target.value) }))}
                className="w-full px-3 py-2 bg-white border-[2px] border-black rounded-lg font-bold" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-black uppercase mb-1">描述</label>
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                className="w-full px-3 py-2 bg-white border-[2px] border-black rounded-lg font-bold" rows={2} placeholder="花卉描述..." />
            </div>
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isCustom} onChange={e => setForm(f => ({ ...f, isCustom: e.target.checked, price: e.target.checked ? "" : f.price }))}
                  className="w-4 h-4 border-[2px] border-black rounded" />
                <span className="font-black text-sm">自訂花卉（客戶填價格）</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))}
                  className="w-4 h-4 border-[2px] border-black rounded" />
                <span className="font-black text-sm">啟用</span>
              </label>
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={() => {
              if (!form.name) { toast.error("請填寫花卉名稱"); return; }
              if (editId) updateFlower.mutate({ id: editId, ...form as any });
              else createFlower.mutate(form as any);
            }} className="memphis-btn px-6 py-2.5 bg-[#FF7B6B] text-white font-black uppercase rounded-lg">
              {editId ? "更新" : "新增"}
            </button>
            <button onClick={() => { setShowForm(false); setEditId(null); setForm(emptyFlower); }}
              className="memphis-btn px-6 py-2.5 bg-white text-black font-black uppercase rounded-lg">取消</button>
          </div>
        </div>
      )}

      {/* Flowers list */}
      {activeTab === "flowers" && (
        <div className="memphis-card overflow-hidden">
          <div className="p-4 bg-[#111] border-b-[2px] border-black">
            <h2 className="text-white font-black uppercase tracking-wide">花卉款式 ({flowers.length})</h2>
          </div>
          {isLoading ? <div className="p-8 text-center font-bold text-gray-400">載入中...</div> :
            flowers.length === 0 ? <div className="p-8 text-center font-bold text-gray-400">尚無花卉款式</div> : (
              <div className="divide-y-[2px] divide-black">
                {flowers.map(flower => {
                  const folder = folders.find(f => f.id === flower.folderId);
                  return (
                    <div key={flower.id} className="p-4 flex items-center justify-between hover:bg-[#FFD6C0]/30 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-[#D4C5F9] border-[2px] border-black rounded-xl flex items-center justify-center text-xl">🌸</div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-black text-base">{flower.name}</span>
                            {!flower.isActive && <span className="memphis-badge status-cancelled">停用</span>}
                            {flower.isCustom && <span className="memphis-badge status-awaiting">自訂價格</span>}
                          </div>
                          <div className="text-sm font-bold text-gray-500 flex items-center gap-2">
                            {folder && <span>📁 {folder.name}</span>}
                            <span className={`memphis-badge ${flower.category === "holiday" ? "status-confirmed" : "status-pending"}`}>
                              {categoryLabel(flower.category)}
                            </span>
                            <span>NT$ {flower.price || "自訂"} / {flower.unit}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => {
                          setEditId(flower.id);
                          setForm({ folderId: flower.folderId || undefined, name: flower.name, description: flower.description || "", price: flower.price || "", unit: flower.unit, category: flower.category, isCustom: flower.isCustom, isActive: flower.isActive, sortOrder: flower.sortOrder });
                          setShowForm(true);
                        }} className="memphis-btn px-3 py-1.5 bg-[#FFF0A0] text-black font-black text-xs uppercase rounded-lg">編輯</button>
                        <button onClick={() => { if (confirm(`確定刪除 ${flower.name}？`)) deleteFlower.mutate({ id: flower.id }); }}
                          className="memphis-btn px-3 py-1.5 bg-[#FF7B6B] text-white font-black text-xs uppercase rounded-lg">刪除</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
        </div>
      )}

      {/* Folders tab */}
      {activeTab === "folders" && (
        <div className="space-y-4">
          <div className="memphis-card p-5 bg-[#D4C5F9]">
            <h2 className="memphis-title text-lg mb-3">新增資料夾</h2>
            <div className="flex gap-3">
              <input value={folderName} onChange={e => setFolderName(e.target.value)}
                className="flex-1 px-3 py-2 bg-white border-[2px] border-black rounded-lg font-bold" placeholder="資料夾名稱" />
              <button onClick={() => { if (!folderName) { toast.error("請填寫名稱"); return; } createFolder.mutate({ name: folderName }); }}
                className="memphis-btn px-5 py-2 bg-[#FF7B6B] text-white font-black uppercase rounded-lg">新增</button>
            </div>
          </div>
          <div className="memphis-card overflow-hidden">
            <div className="p-4 bg-[#111] border-b-[2px] border-black">
              <h2 className="text-white font-black uppercase">資料夾列表 ({folders.length})</h2>
            </div>
            {folders.length === 0 ? <div className="p-8 text-center font-bold text-gray-400">尚無資料夾</div> : (
              <div className="divide-y-[2px] divide-black">
                {folders.map(fd => (
                  <div key={fd.id} className="p-4 flex items-center justify-between">
                    {editFolderId === fd.id ? (
                      <div className="flex items-center gap-3 flex-1">
                        <input value={editFolderName} onChange={e => setEditFolderName(e.target.value)}
                          className="flex-1 px-3 py-2 bg-white border-[2px] border-black rounded-lg font-bold text-sm" />
                        <button onClick={() => updateFolder.mutate({ id: fd.id, name: editFolderName })}
                          className="memphis-btn px-3 py-1.5 bg-[#B8F0D8] text-black font-black text-xs uppercase rounded-lg">儲存</button>
                        <button onClick={() => setEditFolderId(null)}
                          className="memphis-btn px-3 py-1.5 bg-white text-black font-black text-xs uppercase rounded-lg">取消</button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-3">
                          <span className="text-xl">📁</span>
                          <span className="font-black">{fd.name}</span>
                          <span className="text-sm font-bold text-gray-500">
                            ({flowers.filter(f => f.folderId === fd.id).length} 款)
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => { setEditFolderId(fd.id); setEditFolderName(fd.name); }}
                            className="memphis-btn px-3 py-1.5 bg-[#FFF0A0] text-black font-black text-xs uppercase rounded-lg">編輯</button>
                          <button onClick={() => { if (confirm(`確定刪除資料夾 ${fd.name}？`)) deleteFolder.mutate({ id: fd.id }); }}
                            className="memphis-btn px-3 py-1.5 bg-[#FF7B6B] text-white font-black text-xs uppercase rounded-lg">刪除</button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
