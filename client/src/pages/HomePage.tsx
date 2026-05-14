import { trpc } from "@/lib/trpc";
import { useStaffAuth } from "@/contexts/StaffAuthContext";
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

export default function HomePage() {
  const { staff, isAdmin } = useStaffAuth();
  const { data: orders = [] } = trpc.orders.list.useQuery({});

  const counts = orders.reduce((acc: Record<string, number>, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    return acc;
  }, {});

  const today = new Date().toISOString().split("T")[0];
  const todayOrders = orders.filter(o => o.deliveryDate === today);

  const stats = [
    { label: "全部訂單", value: orders.length, color: "#FFD6C0", icon: "📋" },
    { label: "今日訂單", value: todayOrders.length, color: "#B8F0D8", icon: "📅" },
    { label: "待審核", value: counts["pending"] || 0, color: "#FFF0A0", icon: "⏳" },
    { label: "待付款", value: counts["awaiting_payment"] || 0, color: "#D4C5F9", icon: "💳" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="memphis-title text-3xl text-black">
            歡迎回來 👋
          </h1>
          <p className="text-black font-bold mt-1">
            {staff?.displayName || staff?.username}，{isAdmin ? "管理員" : "員工"}
          </p>
        </div>
        <div className="flex gap-2">
          <div className="w-4 h-4 rounded-full bg-[#FF7B6B] border-[2px] border-black" />
          <div className="w-4 h-4 bg-[#B8F0D8] border-[2px] border-black rotate-45" />
          <div className="w-4 h-4 rounded-full bg-[#D4C5F9] border-[2px] border-black" />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="memphis-card p-5" style={{ background: s.color }}>
            <div className="text-3xl mb-2">{s.icon}</div>
            <div className="text-4xl font-black text-black">{s.value}</div>
            <div className="text-sm font-black uppercase tracking-wide text-black/70 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="memphis-card p-6">
        <h2 className="memphis-title text-xl text-black mb-4">快速操作</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { href: "/orders/create", label: "新增訂單", icon: "➕", color: "#FF7B6B", textColor: "white" },
            { href: "/orders", label: "訂單列表", icon: "📋", color: "#B8F0D8", textColor: "#111" },
            { href: "/calendar", label: "日曆視圖", icon: "📅", color: "#D4C5F9", textColor: "#111" },
            { href: "/query", label: "客戶查詢", icon: "🔍", color: "#FFF0A0", textColor: "#111" },
          ].map((item) => (
            <Link key={item.href} href={item.href}>
              <div
                className="memphis-btn flex flex-col items-center gap-2 p-4 rounded-xl cursor-pointer text-center"
                style={{ background: item.color, color: item.textColor }}
              >
                <span className="text-2xl">{item.icon}</span>
                <span className="font-black text-xs uppercase tracking-wide">{item.label}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Order status breakdown */}
      <div className="memphis-card p-6">
        <h2 className="memphis-title text-xl text-black mb-4">訂單狀態分佈</h2>
        <div className="flex flex-wrap gap-3">
          {Object.entries(statusMap).map(([key, { label, cls }]) => (
            <div key={key} className={`memphis-badge ${cls}`}>
              {label}: {counts[key] || 0}
            </div>
          ))}
        </div>
      </div>

      {/* Recent orders */}
      <div className="memphis-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="memphis-title text-xl text-black">最新訂單</h2>
          <Link href="/orders">
            <span className="text-sm font-black uppercase tracking-wide text-[#FF7B6B] hover:underline cursor-pointer">
              查看全部 →
            </span>
          </Link>
        </div>
        {orders.length === 0 ? (
          <div className="text-center py-8 text-gray-400 font-bold">尚無訂單</div>
        ) : (
          <div className="space-y-2">
            {orders.slice(0, 5).map((order) => {
              const s = statusMap[order.status] || { label: order.status, cls: "" };
              return (
                <Link key={order.id} href={`/orders/${order.id}`}>
                  <div className="flex items-center justify-between p-3 bg-gray-50 border-[2px] border-black rounded-lg hover:bg-[#FFD6C0] transition-colors cursor-pointer">
                    <div className="flex items-center gap-3">
                      <span className="font-black text-sm text-[#FF7B6B]">{order.orderNumber}</span>
                      <span className="font-bold text-sm">{order.senderName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 font-bold">{order.deliveryDate || "未定"}</span>
                      <span className={`memphis-badge ${s.cls}`}>{s.label}</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
