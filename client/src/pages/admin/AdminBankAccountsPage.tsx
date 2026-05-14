import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

type BankForm = { bankName: string; accountNumber: string; accountName: string; branchName: string; note: string; isActive: boolean; sortOrder: number };
const emptyForm: BankForm = { bankName: "", accountNumber: "", accountName: "", branchName: "", note: "", isActive: true, sortOrder: 0 };

export default function AdminBankAccountsPage() {
  const utils = trpc.useUtils();
  const { data: accounts = [], isLoading } = trpc.bankAccounts.list.useQuery();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<BankForm>(emptyForm);

  const create = trpc.bankAccounts.create.useMutation({ onSuccess: () => { toast.success("已新增"); utils.bankAccounts.list.invalidate(); setShowForm(false); setForm(emptyForm); }, onError: e => toast.error(e.message) });
  const update = trpc.bankAccounts.update.useMutation({ onSuccess: () => { toast.success("已更新"); utils.bankAccounts.list.invalidate(); setEditId(null); }, onError: e => toast.error(e.message) });
  const del = trpc.bankAccounts.delete.useMutation({ onSuccess: () => { toast.success("已刪除"); utils.bankAccounts.list.invalidate(); }, onError: e => toast.error(e.message) });

  const F = ({ label, field, type = "text", placeholder = "" }: { label: string; field: keyof BankForm; type?: string; placeholder?: string }) => (
    <div>
      <label className="block text-xs font-black uppercase mb-1">{label}</label>
      <input type={type} value={form[field] as string} onChange={e => setForm(f => ({ ...f, [field]: type === "number" ? Number(e.target.value) : e.target.value }))}
        className="w-full px-3 py-2 bg-white border-[2px] border-black rounded-lg font-bold" placeholder={placeholder} />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="memphis-title text-3xl text-black">付款帳號管理</h1>
          <p className="text-black font-bold mt-1">設定客戶付款用的銀行帳號資訊</p>
        </div>
        <button onClick={() => { setShowForm(!showForm); setForm(emptyForm); setEditId(null); }}
          className="memphis-btn px-5 py-2.5 bg-[#FF7B6B] text-white font-black uppercase tracking-wide rounded-lg">
          {showForm ? "✕ 取消" : "＋ 新增帳號"}
        </button>
      </div>

      {showForm && (
        <div className="memphis-card p-6 bg-[#D4C5F9]">
          <h2 className="memphis-title text-lg mb-4">{editId ? "編輯帳號" : "新增付款帳號"}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <F label="銀行名稱 *" field="bankName" placeholder="台灣銀行" />
            <F label="帳號 *" field="accountNumber" placeholder="0123456789012" />
            <F label="戶名 *" field="accountName" placeholder="花卉訂購有限公司" />
            <F label="分行名稱" field="branchName" placeholder="信義分行" />
            <F label="備註" field="note" placeholder="轉帳後請截圖..." />
            <F label="排序" field="sortOrder" type="number" />
          </div>
          <div className="flex items-center gap-3 mt-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} className="w-4 h-4 border-[2px] border-black rounded" />
              <span className="font-black text-sm">啟用</span>
            </label>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={() => {
              if (!form.bankName || !form.accountNumber || !form.accountName) { toast.error("請填寫必填欄位"); return; }
              if (editId) update.mutate({ id: editId, ...form });
              else create.mutate(form as any);
            }} className="memphis-btn px-6 py-2.5 bg-[#FF7B6B] text-white font-black uppercase rounded-lg">
              {editId ? "更新" : "新增"}
            </button>
            <button onClick={() => { setShowForm(false); setEditId(null); setForm(emptyForm); }}
              className="memphis-btn px-6 py-2.5 bg-white text-black font-black uppercase rounded-lg">取消</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {isLoading ? <div className="col-span-2 text-center py-8 font-bold text-gray-400">載入中...</div> :
          accounts.length === 0 ? <div className="col-span-2 text-center py-8 font-bold text-gray-400">尚無付款帳號</div> :
          accounts.map(acc => (
            <div key={acc.id} className={`memphis-card p-5 ${!acc.isActive ? "opacity-60" : ""}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#FFF0A0] border-[2px] border-black rounded-xl flex items-center justify-center text-xl">🏦</div>
                  <div>
                    <div className="font-black text-lg">{acc.bankName}</div>
                    {acc.branchName && <div className="text-sm font-bold text-gray-500">{acc.branchName}</div>}
                  </div>
                </div>
                {!acc.isActive && <span className="memphis-badge status-cancelled">停用</span>}
              </div>
              <div className="space-y-1 mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase text-gray-500">帳號</span>
                  <span className="font-black text-base tracking-widest">{acc.accountNumber}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase text-gray-500">戶名</span>
                  <span className="font-bold">{acc.accountName}</span>
                </div>
                {acc.note && <div className="text-sm font-bold text-gray-600 bg-[#FFD6C0] border-[2px] border-black rounded-lg px-3 py-1.5 mt-2">{acc.note}</div>}
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setEditId(acc.id); setForm({ bankName: acc.bankName, accountNumber: acc.accountNumber, accountName: acc.accountName, branchName: acc.branchName || "", note: acc.note || "", isActive: acc.isActive, sortOrder: acc.sortOrder }); setShowForm(true); }}
                  className="memphis-btn px-3 py-1.5 bg-[#FFF0A0] text-black font-black text-xs uppercase rounded-lg">編輯</button>
                <button onClick={() => update.mutate({ id: acc.id, isActive: !acc.isActive })}
                  className={`memphis-btn px-3 py-1.5 font-black text-xs uppercase rounded-lg ${acc.isActive ? "bg-[#FFB0A0] text-black" : "bg-[#B8F0D8] text-black"}`}>
                  {acc.isActive ? "停用" : "啟用"}
                </button>
                <button onClick={() => { if (confirm(`確定刪除 ${acc.bankName} 帳號？`)) del.mutate({ id: acc.id }); }}
                  className="memphis-btn px-3 py-1.5 bg-[#FF7B6B] text-white font-black text-xs uppercase rounded-lg">刪除</button>
              </div>
            </div>
          ))
        }
      </div>
    </div>
  );
}
