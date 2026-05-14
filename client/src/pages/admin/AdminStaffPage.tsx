import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

type StaffForm = { username: string; password: string; displayName: string; role: "admin" | "staff" };
const emptyForm: StaffForm = { username: "", password: "", displayName: "", role: "staff" };

export default function AdminStaffPage() {
  const utils = trpc.useUtils();
  const { data: staffList = [], isLoading } = trpc.staff.list.useQuery();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<StaffForm>(emptyForm);
  const [editPassword, setEditPassword] = useState("");

  const createMutation = trpc.staff.create.useMutation({
    onSuccess: () => { toast.success("員工帳號已建立"); utils.staff.list.invalidate(); setShowForm(false); setForm(emptyForm); },
    onError: (e) => toast.error(e.message),
  });
  const updateMutation = trpc.staff.update.useMutation({
    onSuccess: () => { toast.success("已更新"); utils.staff.list.invalidate(); setEditId(null); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMutation = trpc.staff.delete.useMutation({
    onSuccess: () => { toast.success("已刪除"); utils.staff.list.invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.username || !form.password) { toast.error("請填寫帳號與密碼"); return; }
    createMutation.mutate(form);
  };

  const handleUpdate = (id: number) => {
    const payload: any = {};
    if (form.displayName !== undefined) payload.displayName = form.displayName;
    if (form.role) payload.role = form.role;
    if (editPassword) payload.newPassword = editPassword;
    updateMutation.mutate({ id, ...payload });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="memphis-title text-3xl text-black">員工管理</h1>
          <p className="text-black font-bold mt-1">管理系統員工帳號與權限</p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setForm(emptyForm); }}
          className="memphis-btn px-5 py-2.5 bg-[#FF7B6B] text-white font-black uppercase tracking-wide rounded-lg"
        >
          {showForm ? "✕ 取消" : "＋ 新增員工"}
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="memphis-card p-6 bg-[#FFF0A0]">
          <h2 className="memphis-title text-lg text-black mb-4">新增員工帳號</h2>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black uppercase tracking-wide mb-1">帳號 *</label>
              <input value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                className="w-full px-3 py-2 bg-white border-[2px] border-black rounded-lg font-bold" placeholder="登入帳號" />
            </div>
            <div>
              <label className="block text-xs font-black uppercase tracking-wide mb-1">密碼 *</label>
              <input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                className="w-full px-3 py-2 bg-white border-[2px] border-black rounded-lg font-bold" placeholder="至少3個字元" />
            </div>
            <div>
              <label className="block text-xs font-black uppercase tracking-wide mb-1">顯示名稱</label>
              <input value={form.displayName} onChange={e => setForm(f => ({ ...f, displayName: e.target.value }))}
                className="w-full px-3 py-2 bg-white border-[2px] border-black rounded-lg font-bold" placeholder="姓名（選填）" />
            </div>
            <div>
              <label className="block text-xs font-black uppercase tracking-wide mb-1">角色</label>
              <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value as any }))}
                className="w-full px-3 py-2 bg-white border-[2px] border-black rounded-lg font-bold">
                <option value="staff">員工</option>
                <option value="admin">管理員</option>
              </select>
            </div>
            <div className="md:col-span-2 flex gap-3">
              <button type="submit" disabled={createMutation.isPending}
                className="memphis-btn px-6 py-2.5 bg-[#FF7B6B] text-white font-black uppercase tracking-wide rounded-lg">
                {createMutation.isPending ? "建立中..." : "建立帳號"}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="memphis-btn px-6 py-2.5 bg-white text-black font-black uppercase tracking-wide rounded-lg">
                取消
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Staff list */}
      <div className="memphis-card overflow-hidden">
        <div className="p-4 bg-[#111] border-b-[2px] border-black">
          <h2 className="text-white font-black uppercase tracking-wide">員工列表 ({staffList.length})</h2>
        </div>
        {isLoading ? (
          <div className="p-8 text-center font-bold text-gray-400">載入中...</div>
        ) : staffList.length === 0 ? (
          <div className="p-8 text-center font-bold text-gray-400">尚無員工帳號</div>
        ) : (
          <div className="divide-y-[2px] divide-black">
            {staffList.map((staff) => (
              <div key={staff.id} className="p-4">
                {editId === staff.id ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-black uppercase mb-1">顯示名稱</label>
                        <input value={form.displayName} onChange={e => setForm(f => ({ ...f, displayName: e.target.value }))}
                          className="w-full px-3 py-2 bg-white border-[2px] border-black rounded-lg font-bold text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs font-black uppercase mb-1">角色</label>
                        <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value as any }))}
                          className="w-full px-3 py-2 bg-white border-[2px] border-black rounded-lg font-bold text-sm">
                          <option value="staff">員工</option>
                          <option value="admin">管理員</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-black uppercase mb-1">新密碼（留空不改）</label>
                        <input type="password" value={editPassword} onChange={e => setEditPassword(e.target.value)}
                          className="w-full px-3 py-2 bg-white border-[2px] border-black rounded-lg font-bold text-sm" placeholder="留空不更改" />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleUpdate(staff.id)} disabled={updateMutation.isPending}
                        className="memphis-btn px-4 py-2 bg-[#B8F0D8] text-black font-black text-sm uppercase rounded-lg">
                        儲存
                      </button>
                      <button onClick={() => setEditId(null)}
                        className="memphis-btn px-4 py-2 bg-white text-black font-black text-sm uppercase rounded-lg">
                        取消
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-[#FF7B6B] border-[2px] border-black flex items-center justify-center text-white font-black">
                        {((staff.displayName || staff.username || "?")[0]).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-black text-base">{staff.displayName || staff.username}</div>
                        <div className="text-sm font-bold text-gray-500">@{staff.username}</div>
                      </div>
                      <span className={`memphis-badge ${staff.role === "admin" ? "status-confirmed" : "status-pending"}`}>
                        {staff.role === "admin" ? "管理員" : "員工"}
                      </span>
                      {!staff.isActive && (
                        <span className="memphis-badge status-cancelled">已停用</span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditId(staff.id);
                          setForm({ username: staff.username, password: "", displayName: staff.displayName || "", role: staff.role as any });
                          setEditPassword("");
                        }}
                        className="memphis-btn px-3 py-1.5 bg-[#FFF0A0] text-black font-black text-xs uppercase rounded-lg"
                      >
                        編輯
                      </button>
                      <button
                        onClick={() => updateMutation.mutate({ id: staff.id, isActive: !staff.isActive })}
                        className={`memphis-btn px-3 py-1.5 font-black text-xs uppercase rounded-lg ${staff.isActive ? "bg-[#FFB0A0] text-black" : "bg-[#B8F0D8] text-black"}`}
                      >
                        {staff.isActive ? "停用" : "啟用"}
                      </button>
                      <button
                        onClick={() => { if (confirm(`確定刪除 ${staff.username}？`)) deleteMutation.mutate({ id: staff.id }); }}
                        className="memphis-btn px-3 py-1.5 bg-[#FF7B6B] text-white font-black text-xs uppercase rounded-lg"
                      >
                        刪除
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
