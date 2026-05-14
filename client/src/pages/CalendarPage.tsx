import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";

const statusMap: Record<string, { label: string; cls: string }> = {
  pending:          { label: "待審核", cls: "status-pending" },
  confirmed:        { label: "已確認", cls: "status-confirmed" },
  awaiting_payment: { label: "待付款", cls: "status-awaiting" },
  paid:             { label: "已付款", cls: "status-paid" },
  processing:       { label: "處理中", cls: "status-processing" },
  completed:        { label: "已完成", cls: "status-completed" },
  cancelled:        { label: "已取消", cls: "status-cancelled" },
};

const weekdays = ["日", "一", "二", "三", "四", "五", "六"];
const monthNames = ["1月","2月","3月","4月","5月","6月","7月","8月","9月","10月","11月","12月"];

export default function CalendarPage() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const startDate = `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month + 1, 0).getDate();
  const endDate = `${year}-${String(month + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  const { data: orders = [] } = trpc.calendar.ordersForMonth.useQuery({ startDate, endDate });
  const { data: capacities = [] } = trpc.calendar.capacitiesForMonth.useQuery({ startDate, endDate });

  const prevMonth = () => { if (month === 0) { setYear(y => y - 1); setMonth(11); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 11) { setYear(y => y + 1); setMonth(0); } else setMonth(m => m + 1); };

  // Build calendar grid
  const firstDow = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const ordersByDate = useMemo(() => {
    const map: Record<string, typeof orders> = {};
    orders.forEach(o => {
      if (o.deliveryDate) {
        if (!map[o.deliveryDate]) map[o.deliveryDate] = [];
        map[o.deliveryDate].push(o);
      }
    });
    return map;
  }, [orders]);

  const capsByDate = useMemo(() => {
    const map: Record<string, typeof capacities> = {};
    capacities.forEach(c => {
      if (!map[c.date]) map[c.date] = [];
      map[c.date].push(c);
    });
    return map;
  }, [capacities]);

  const formatDate = (day: number) =>
    `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  const todayStr = today.toISOString().split("T")[0];
  const selectedOrders = selectedDate ? (ordersByDate[selectedDate] || []) : [];
  const selectedCaps = selectedDate ? (capsByDate[selectedDate] || []) : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="memphis-title text-3xl text-black">日曆視圖</h1>
        <p className="text-black font-bold mt-1">查看各日期的訂單與容量狀況</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2 memphis-card overflow-hidden">
          {/* Month nav */}
          <div className="p-4 bg-[#111] border-b-[2px] border-black flex items-center justify-between">
            <button onClick={prevMonth} className="text-white font-black text-xl hover:text-[#FF7B6B] transition-colors">←</button>
            <h2 className="text-white font-black text-xl uppercase tracking-widest">
              {year} 年 {monthNames[month]}
            </h2>
            <button onClick={nextMonth} className="text-white font-black text-xl hover:text-[#FF7B6B] transition-colors">→</button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 border-b-[2px] border-black">
            {weekdays.map((d, i) => (
              <div key={d} className={`py-2 text-center text-xs font-black uppercase ${i === 0 ? "text-[#FF7B6B]" : i === 6 ? "text-[#D4C5F9]" : "text-black"}`}>
                {d}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7">
            {cells.map((day, idx) => {
              if (!day) return <div key={idx} className="border-r-[1px] border-b-[1px] border-black/20 min-h-[80px] bg-gray-50/30" />;
              const dateStr = formatDate(day);
              const dayOrders = ordersByDate[dateStr] || [];
              const dayCaps = capsByDate[dateStr] || [];
              const isToday = dateStr === todayStr;
              const isSelected = dateStr === selectedDate;
              const hasFull = dayCaps.some(c => c.currentCount >= c.maxCapacity);
              const dow = (firstDow + day - 1) % 7;

              return (
                <div
                  key={idx}
                  onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                  className={`border-r-[1px] border-b-[1px] border-black/20 min-h-[80px] p-1.5 cursor-pointer transition-colors ${
                    isSelected ? "bg-[#FF7B6B]/20 border-[2px] border-[#FF7B6B]" :
                    isToday ? "bg-[#FFF0A0]/60" :
                    "hover:bg-[#FFD6C0]/40"
                  }`}
                >
                  <div className={`text-xs font-black mb-1 w-6 h-6 flex items-center justify-center rounded-full ${
                    isToday ? "bg-[#FF7B6B] text-white" :
                    dow === 0 ? "text-[#FF7B6B]" :
                    dow === 6 ? "text-[#D4C5F9]" : "text-black"
                  }`}>
                    {day}
                  </div>
                  {dayOrders.length > 0 && (
                    <div className="text-[10px] font-black bg-[#B8F0D8] border-[1px] border-black rounded px-1 mb-0.5">
                      📋 {dayOrders.length} 筆
                    </div>
                  )}
                  {hasFull && (
                    <div className="text-[10px] font-black bg-[#FF7B6B] text-white border-[1px] border-black rounded px-1">
                      🔴 額滿
                    </div>
                  )}
                  {dayCaps.length > 0 && !hasFull && (
                    <div className="text-[10px] font-black bg-[#D4C5F9] border-[1px] border-black rounded px-1">
                      ⚙️ {dayCaps.length} 時段
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Side panel */}
        <div className="space-y-4">
          {/* Legend */}
          <div className="memphis-card p-4">
            <h3 className="memphis-title text-sm mb-3">圖例說明</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2"><div className="w-4 h-4 bg-[#FFF0A0] border-[2px] border-black rounded" /><span className="text-xs font-bold">今天</span></div>
              <div className="flex items-center gap-2"><div className="text-[10px] font-black bg-[#B8F0D8] border-[1px] border-black rounded px-1">📋 n 筆</div><span className="text-xs font-bold">有訂單</span></div>
              <div className="flex items-center gap-2"><div className="text-[10px] font-black bg-[#FF7B6B] text-white border-[1px] border-black rounded px-1">🔴 額滿</div><span className="text-xs font-bold">時段額滿</span></div>
              <div className="flex items-center gap-2"><div className="text-[10px] font-black bg-[#D4C5F9] border-[1px] border-black rounded px-1">⚙️ n 時段</div><span className="text-xs font-bold">有容量設定</span></div>
            </div>
          </div>

          {/* Selected date details */}
          {selectedDate ? (
            <div className="memphis-card overflow-hidden">
              <div className="p-3 bg-[#FF7B6B] border-b-[2px] border-black">
                <h3 className="text-white font-black uppercase">{selectedDate}</h3>
              </div>

              {/* Capacities */}
              {selectedCaps.length > 0 && (
                <div className="p-3 border-b-[2px] border-black">
                  <div className="text-xs font-black uppercase mb-2">容量設定</div>
                  {selectedCaps.map(cap => {
                    const pct = cap.maxCapacity > 0 ? Math.min(100, Math.round((cap.currentCount / cap.maxCapacity) * 100)) : 0;
                    const isFull = cap.currentCount >= cap.maxCapacity;
                    return (
                      <div key={cap.id} className="mb-2">
                        <div className="flex justify-between text-xs font-bold mb-1">
                          <span>{cap.timeslot}</span>
                          <span className={isFull ? "text-[#FF7B6B] font-black" : ""}>{cap.currentCount}/{cap.maxCapacity}</span>
                        </div>
                        <div className="w-full h-2 bg-gray-200 border-[1px] border-black rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: isFull ? "#FF7B6B" : "#B8F0D8" }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Orders */}
              <div className="p-3">
                <div className="text-xs font-black uppercase mb-2">訂單 ({selectedOrders.length})</div>
                {selectedOrders.length === 0 ? (
                  <div className="text-xs font-bold text-gray-400">無訂單</div>
                ) : (
                  <div className="space-y-2">
                    {selectedOrders.map(order => {
                      const sm = statusMap[order.status] || { label: order.status, cls: "" };
                      return (
                        <Link key={order.id} href={`/orders/${order.id}`}>
                          <div className="p-2 bg-gray-50 border-[2px] border-black rounded-lg hover:bg-[#FFD6C0] transition-colors cursor-pointer">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-black text-[#FF7B6B]">{order.orderNumber}</span>
                              <span className={`memphis-badge text-[10px] ${sm.cls}`}>{sm.label}</span>
                            </div>
                            <div className="text-xs font-bold mt-0.5">{order.senderName} → {order.recipientName}</div>
                            {order.timeslot && <div className="text-[10px] text-gray-500 font-bold">{order.timeslot}</div>}
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="memphis-card p-5 text-center bg-[#D4C5F9]">
              <div className="text-3xl mb-2">📅</div>
              <p className="font-black text-sm uppercase tracking-wide">點擊日期查看詳情</p>
            </div>
          )}

          {/* Monthly stats */}
          <div className="memphis-card p-4 bg-[#B8F0D8]">
            <h3 className="memphis-title text-sm mb-3">本月統計</h3>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-white border-[2px] border-black rounded-lg p-2 text-center">
                <div className="font-black text-2xl">{orders.length}</div>
                <div className="text-xs font-bold text-gray-500 uppercase">總訂單</div>
              </div>
              <div className="bg-white border-[2px] border-black rounded-lg p-2 text-center">
                <div className="font-black text-2xl">{Object.keys(ordersByDate).length}</div>
                <div className="text-xs font-bold text-gray-500 uppercase">有訂單天數</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
