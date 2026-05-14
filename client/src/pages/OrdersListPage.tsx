import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";

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

const deliveryTypeLabel = { pickup: "自取", delivery: "外送" };

export default function OrdersListPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  const { data: orders = [], isLoading } = trpc.orders.list.useQuery({
    status: statusFilter || undefined,
    date: dateFilter || undefined,
    search: search || undefined,
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="memphis-title text-3xl text-black">訂單列表</h1>
          <p className="text-black font-bold mt-1">共 {orders.length} 筆訂單</p>
        </div>
        <Link href="/orders/create">
          <button className="memphis-btn px-5 py-2.5 bg-[#FF7B6B] text-white font-black uppercase tracking-wide rounded-lg">
            ➕ 新增訂單
          </button>
        </Link>
      </div>

      {/* Filters */}
      <div className="memphis-card p-4 bg-[#FFF0A0]">
        <div className="flex flex-wrap gap-3">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="🔍 搜尋訂單編號、姓名..."
            className="flex-1 min-w-[200px] px-3 py-2 bg-white border-[2px] border-black rounded-lg font-bold text-sm"
          />
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-white border-[2px] border-black rounded-lg font-bold text-sm">
            <option value="">全部狀態</option>
            {Object.entries(statusMap).map(([v, { label }]) => <option key={v} value={v}>{label}</option>)}
          </select>
          <input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)}
            className="px-3 py-2 bg-white border-[2px] border-black rounded-lg font-bold text-sm" />
          {(search || statusFilter || dateFilter) && (
            <button onClick={() => { setSearch(""); setStatusFilter(""); setDateFilter(""); }}
              className="memphis-btn px-4 py-2 bg-white text-black font-black text-sm uppercase rounded-lg">
              清除篩選
            </button>
          )}
        </div>
      </div>

      {/* Status summary */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(statusMap).map(([key, { label, cls }]) => {
          const count = orders.filter(o => o.status === key).length;
          if (count === 0) return null;
          return (
            <button key={key} onClick={() => setStatusFilter(statusFilter === key ? "" : key)}
              className={`memphis-badge ${cls} cursor-pointer ${statusFilter === key ? "ring-2 ring-black ring-offset-1" : ""}`}>
              {label}: {count}
            </button>
          );
        })}
      </div>

      {/* Orders table */}
      <div className="memphis-card overflow-hidden">
        <div className="p-4 bg-[#111] border-b-[2px] border-black">
          <h2 className="text-white font-black uppercase tracking-wide">訂單列表</h2>
        </div>
        {isLoading ? (
          <div className="p-8 text-center font-bold text-gray-400">載入中...</div>
        ) : orders.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-4xl mb-3">📭</div>
            <p className="font-black text-gray-400 uppercase">沒有符合條件的訂單</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-[2px] border-black bg-[#FFD6C0]">
                  {["訂單編號","寄件人","收件人","配送方式","配送日期","金額","狀態","操作"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-black uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.map((order, idx) => {
                  const s = statusMap[order.status] || { label: order.status, cls: "" };
                  return (
                    <tr key={order.id} className={`border-b-[2px] border-black hover:bg-[#FFD6C0]/40 transition-colors ${idx % 2 === 0 ? "" : "bg-gray-50/50"}`}>
                      <td className="px-4 py-3">
                        <span className="font-black text-sm text-[#FF7B6B]">{order.orderNumber}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-bold text-sm">{order.senderName}</div>
                        <div className="text-xs text-gray-500">{order.senderPhone}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-bold text-sm">{order.recipientName}</div>
                        <div className="text-xs text-gray-500">{order.recipientPhone}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`memphis-badge ${order.deliveryType === "pickup" ? "status-confirmed" : "status-awaiting"}`}>
                          {deliveryTypeLabel[order.deliveryType as keyof typeof deliveryTypeLabel] || order.deliveryType}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-bold text-sm">{order.deliveryDate || "—"}</td>
                      <td className="px-4 py-3 font-black text-sm">NT$ {order.totalAmount || 0}</td>
                      <td className="px-4 py-3">
                        <span className={`memphis-badge ${s.cls}`}>{s.label}</span>
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/orders/${order.id}`}>
                          <button className="memphis-btn px-3 py-1.5 bg-[#D4C5F9] text-black font-black text-xs uppercase rounded-lg">
                            查看
                          </button>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
