import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const categoryLabels = { all: "全部", holiday: "節慶花卉配送", other: "其他" };

export default function AdminCapacitiesPage() {
  const utils = trpc.useUtils();
  const today = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState(today);
  const { data: caps = [], isLoading } = trpc.capacities.byDate.useQuery({ date: selectedDate });
  const [form, setForm] = useState({ timeslot: "09:00-12:00", category: "all" as "all"|"holiday"|"other", maxCapacity: 10 });

  const upsert = trpc.capacities.upsert.useMutation({
    onSuccess: () => { toast.success("已設定容量"); utils.capacities.byDate.invalidate({ date: selectedDate }); },
    onError: e => toast.error(e.message),
  });
  const del = trpc.capacities.delete.useMutation({
    onSuccess: () => { toast.success("已刪除"); utils.capacities.byDate.invalidate({ date: selectedDate }); },
    onError: e => toast.error(e.message),
  });

  const timeslotOptions = ["09:00-12:00","12:00-15:00","15:00-18:00","18:00-21:00","全天"];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="memphis-title text-3xl text-black">容量設定</h1>
        <p className="text-black font-bold mt-1">設定各日期時段的訂單容量上限</p>
      </div>

      {/* Date selector */}
      <div className="memphis-card p-5 bg-[#FFF0A0]">
        <div className="flex items-center gap-4 flex-wrap">
          <div>
            <label className="block text-xs font-black uppercase mb-1">選擇日期</label>
            <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
              className="px-3 py-2 bg-white border-[2px] border-black rounded-lg font-bold" />
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-black uppercase mb-1">時段</label>
            <select value={form.timeslot} onChange={e => setForm(f => ({ ...f, timeslot: e.target.value }))}
              className="w-full px-3 py-2 bg-white border-[2px] border-black rounded-lg font-bold">
              {timeslotOptions.map(t => <option key={t} value={t}>{t}</option>)}
              <option value="custom">自訂...</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-black uppercase mb-1">類別</label>
            <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as any }))}
              className="px-3 py-2 bg-white border-[2px] border-black rounded-lg font-bold">
              {Object.entries(categoryLabels).map(([v,l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-black uppercase mb-1">上限數量</label>
            <input type="number" min={0} value={form.maxCapacity} onChange={e => setForm(f => ({ ...f, maxCapacity: Number(e.target.value) }))}
              className="w-24 px-3 py-2 bg-white border-[2px] border-black rounded-lg font-bold" />
          </div>
          <div className="flex items-end">
            <button onClick={() => upsert.mutate({ date: selectedDate, ...form })}
              className="memphis-btn px-5 py-2.5 bg-[#FF7B6B] text-white font-black uppercase rounded-lg">
              設定容量
            </button>
          </div>
        </div>
      </div>

      {/* Capacities for selected date */}
      <div className="memphis-card overflow-hidden">
        <div className="p-4 bg-[#111] border-b-[2px] border-black flex items-center justify-between">
          <h2 className="text-white font-black uppercase">{selectedDate} 的容量設定</h2>
          <span className="text-gray-400 font-bold text-sm">{caps.length} 筆</span>
        </div>
        {isLoading ? (
          <div className="p-8 text-center font-bold text-gray-400">載入中...</div>
        ) : caps.length === 0 ? (
          <div className="p-8 text-center font-bold text-gray-400">此日期尚無容量設定</div>
        ) : (
          <div className="divide-y-[2px] divide-black">
            {caps.map(cap => {
              const pct = cap.maxCapacity > 0 ? Math.min(100, Math.round((cap.currentCount / cap.maxCapacity) * 100)) : 0;
              const isFull = cap.currentCount >= cap.maxCapacity;
              return (
                <div key={cap.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <div className="font-black text-lg">{cap.timeslot}</div>
                      <div className="text-xs font-bold text-gray-500">{categoryLabels[cap.category as keyof typeof categoryLabels]}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-32 h-3 bg-gray-200 border-[2px] border-black rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: isFull ? "#FF7B6B" : "#B8F0D8" }} />
                      </div>
                      <span className={`memphis-badge ${isFull ? "status-booked" : "status-confirmed"}`}>
                        {cap.currentCount} / {cap.maxCapacity}
                      </span>
                    </div>
                  </div>
                  <button onClick={() => { if (confirm("確定刪除此容量設定？")) del.mutate({ id: cap.id }); }}
                    className="memphis-btn px-3 py-1.5 bg-[#FF7B6B] text-white font-black text-xs uppercase rounded-lg">
                    刪除
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
