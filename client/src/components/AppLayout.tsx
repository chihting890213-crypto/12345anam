import { ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import { useStaffAuth } from "@/contexts/StaffAuthContext";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

type NavItem = {
  path: string;
  label: string;
  icon: string;
  adminOnly?: boolean;
};

const navItems: NavItem[] = [
  { path: "/", label: "首頁", icon: "🏠" },
  { path: "/orders", label: "訂單列表", icon: "📋" },
  { path: "/orders/create", label: "新增訂單", icon: "➕" },
  { path: "/calendar", label: "日曆視圖", icon: "📅" },
  { path: "/admin/staff", label: "員工管理", icon: "👥", adminOnly: true },
  { path: "/admin/flowers", label: "花卉管理", icon: "🌸", adminOnly: true },
  { path: "/admin/regions", label: "區域管理", icon: "🗺️", adminOnly: true },
  { path: "/admin/capacities", label: "容量設定", icon: "⚙️", adminOnly: true },
  { path: "/admin/bank-accounts", label: "付款帳號", icon: "🏦", adminOnly: true },
];

export default function AppLayout({ children }: { children: ReactNode }) {
  const { staff, isAdmin } = useStaffAuth();
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const logoutMutation = trpc.staffAuth.logout.useMutation({
    onSuccess: () => { toast.success("已登出"); window.location.href = "/"; },
  });

  const visibleItems = navItems.filter(item => !item.adminOnly || isAdmin);

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-5 border-b-[2px] border-[#333]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#FF7B6B] border-[2px] border-white rounded-xl flex items-center justify-center text-xl shadow-[2px_2px_0px_rgba(255,255,255,0.3)]">
            🌸
          </div>
          <div>
            <div className="text-white font-black text-sm uppercase tracking-widest">FLOWER</div>
            <div className="text-[#FF7B6B] font-black text-xs uppercase tracking-widest">ORDER SYS</div>
          </div>
        </div>
      </div>

      {/* User info */}
      <div className="px-4 py-3 border-b-[1px] border-[#333]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full border-[2px] border-[#FF7B6B] flex items-center justify-center bg-[#FF7B6B] text-white font-black text-sm">
            {(staff?.displayName || staff?.username || "?")[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-white font-bold text-sm truncate">{staff?.displayName || staff?.username}</div>
            <div className="text-xs font-bold" style={{ color: isAdmin ? "#FFF0A0" : "#B8F0D8" }}>
              {isAdmin ? "管理員" : "員工"}
            </div>
          </div>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {visibleItems.map((item) => {
          const isActive = location === item.path || (item.path !== "/" && location.startsWith(item.path));
          return (
            <Link key={item.path} href={item.path}>
              <div
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-bold text-sm transition-all cursor-pointer ${
                  isActive
                    ? "bg-[#FF7B6B] text-white border-[2px] border-white shadow-[2px_2px_0px_rgba(255,255,255,0.2)]"
                    : "text-gray-300 hover:bg-[#222] hover:text-white border-[2px] border-transparent"
                }`}
                onClick={() => setSidebarOpen(false)}
              >
                <span className="text-base">{item.icon}</span>
                <span className="uppercase tracking-wide text-xs font-black">{item.label}</span>
                {isActive && <div className="ml-auto w-2 h-2 rounded-full bg-white" />}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Bottom actions */}
      <div className="p-3 border-t-[1px] border-[#333] space-y-2">
        <a href="/query" target="_blank" rel="noopener noreferrer">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg font-bold text-sm text-gray-300 hover:bg-[#222] hover:text-white border-[2px] border-transparent transition-all cursor-pointer">
            <span>🔍</span>
            <span className="uppercase tracking-wide text-xs font-black">客戶查詢頁</span>
          </div>
        </a>
        <button
          onClick={() => logoutMutation.mutate()}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-bold text-sm text-gray-400 hover:bg-red-900/30 hover:text-red-400 border-[2px] border-transparent transition-all"
        >
          <span>🚪</span>
          <span className="uppercase tracking-wide text-xs font-black">登出</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-[#FFD6C0] overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-56 bg-[#111111] border-r-[3px] border-black flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-56 bg-[#111111] border-r-[3px] border-black flex flex-col">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile top bar */}
        <div className="md:hidden flex items-center justify-between px-4 py-3 bg-[#111111] border-b-[3px] border-black">
          <button onClick={() => setSidebarOpen(true)} className="text-white font-black text-xl">☰</button>
          <div className="flex items-center gap-2">
            <span className="text-xl">🌸</span>
            <span className="text-white font-black text-sm uppercase tracking-widest">FLOWER ORDER</span>
          </div>
          <div className="w-8" />
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
