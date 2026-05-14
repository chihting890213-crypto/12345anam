import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useStaffAuth } from "@/contexts/StaffAuthContext";
import { toast } from "sonner";
import { useLocation } from "wouter";

export default function LandingPage() {
  const [, navigate] = useLocation();
  const [showStaffLogin, setShowStaffLogin] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [queryNumber, setQueryNumber] = useState("");
  const { refetch } = useStaffAuth();

  const loginMutation = trpc.staffAuth.login.useMutation({
    onSuccess: () => {
      toast.success("登入成功！");
      refetch();
    },
    onError: (err) => {
      toast.error(err.message || "帳號或密碼錯誤");
    },
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) { toast.error("請填寫帳號與密碼"); return; }
    loginMutation.mutate({ username, password });
  };

  const handleQuery = (e: React.FormEvent) => {
    e.preventDefault();
    if (!queryNumber.trim()) { toast.error("請輸入訂單編號"); return; }
    navigate(`/query?order=${queryNumber.trim().toUpperCase()}`);
  };

  return (
    <div className="min-h-screen memphis-bg relative overflow-hidden">
      {/* ── Memphis geometric decorations ── */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        {/* Large shapes */}
        <div className="absolute -top-8 -left-8 w-40 h-40 bg-[#B8F0D8] border-[4px] border-black rounded-full opacity-70" />
        <div className="absolute top-16 right-0 w-32 h-32 bg-[#D4C5F9] border-[4px] border-black rotate-12 opacity-60" />
        <div className="absolute bottom-0 left-1/4 w-48 h-48 bg-[#FFF0A0] border-[4px] border-black rounded-full opacity-50" />
        <div className="absolute -bottom-10 right-10 w-36 h-36 bg-[#FFB899] border-[4px] border-black rotate-45 opacity-60" />
        {/* Medium shapes */}
        <div className="absolute top-1/3 left-8 w-16 h-16 bg-[#FF7B6B] border-[3px] border-black rotate-45 opacity-50" />
        <div className="absolute top-1/2 right-16 w-20 h-20 bg-[#B8F0D8] border-[3px] border-black rounded-full opacity-50" />
        <div className="absolute bottom-1/3 left-1/3 w-12 h-12 bg-[#D4C5F9] border-[3px] border-black rotate-12 opacity-40" />
        {/* Dots row */}
        {[...Array(8)].map((_, i) => (
          <div key={i} className="absolute w-4 h-4 rounded-full border-[2px] border-black opacity-40"
            style={{ background: ["#FF7B6B","#B8F0D8","#D4C5F9","#FFF0A0","#FFB899"][i % 5], top: `${15 + i * 10}%`, right: `${3 + (i % 3) * 2}%` }} />
        ))}
        {/* Zigzag lines */}
        <svg className="absolute bottom-20 left-0 opacity-20" width="200" height="60" viewBox="0 0 200 60">
          <polyline points="0,30 25,5 50,30 75,5 100,30 125,5 150,30 175,5 200,30" fill="none" stroke="black" strokeWidth="3"/>
        </svg>
        <svg className="absolute top-32 right-40 opacity-20" width="120" height="40" viewBox="0 0 120 40">
          <polyline points="0,20 20,5 40,20 60,5 80,20 100,5 120,20" fill="none" stroke="black" strokeWidth="3"/>
        </svg>
      </div>

      {/* ── Main Content ── */}
      <div className="relative z-10 min-h-screen flex flex-col">

        {/* ── Hero Section ── */}
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">

          {/* Brand Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-4 bg-white border-[4px] border-black rounded-3xl px-8 py-5 shadow-[6px_6px_0px_#111] mb-6">
              <span className="text-5xl">🌸</span>
              <div className="text-left">
                <div className="font-black text-4xl tracking-widest text-black leading-tight" style={{fontFamily:'serif'}}>金美芳花苑</div>
                <div className="font-bold text-sm tracking-widest text-[#FF7B6B] uppercase">Flower Garden</div>
              </div>
            </div>
            <h1 className="memphis-title text-5xl md:text-6xl text-black mb-3 leading-tight">
              花卉訂購系統
            </h1>
            <p className="text-black font-bold text-xl max-w-md mx-auto">
              新鮮花卉・用心配送・每一束都是心意
            </p>
            <div className="flex justify-center gap-3 mt-4">
              {["#FF7B6B","#B8F0D8","#D4C5F9","#FFF0A0","#FFB899"].map((c, i) => (
                <div key={i} className="w-5 h-5 rounded-full border-[2px] border-black" style={{ background: c }} />
              ))}
            </div>
          </div>

          {/* ── Two Entry Cards ── */}
          <div className="w-full max-w-3xl grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Customer Card */}
            <div className="memphis-card p-8 bg-[#B8F0D8] flex flex-col">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 bg-white border-[3px] border-black rounded-full flex items-center justify-center text-2xl shadow-[3px_3px_0px_#111]">
                  🛍️
                </div>
                <div>
                  <div className="font-black text-xl uppercase tracking-wide">客戶中心</div>
                  <div className="text-sm font-bold text-black/60">新增訂單・查詢進度・與我們溝通</div>
                </div>
              </div>

              <div className="flex-1 flex flex-col justify-center gap-3">
                <div className="bg-white border-[2px] border-black rounded-xl p-4">
                  <p className="text-sm font-bold text-black/70 text-center">
                    無需登入，直接進入客戶中心<br/>新增訂單、查詢進度、與員工溝通
                  </p>
                </div>
                <button
                  onClick={() => navigate("/customer")}
                  className="w-full py-3 bg-black text-white font-black text-base uppercase tracking-wide border-[2.5px] border-black rounded-xl shadow-[3px_3px_0px_#555] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_#555] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_#555] transition-all">
                  進入客戶中心 →
                </button>
              </div>
            </div>

            {/* Staff Card */}
            <div className="memphis-card p-8 bg-white flex flex-col">
              {!showStaffLogin ? (
                <>
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-12 h-12 bg-[#FFF0A0] border-[3px] border-black rounded-full flex items-center justify-center text-2xl shadow-[3px_3px_0px_#111]">
                      👤
                    </div>
                    <div>
                      <div className="font-black text-xl uppercase tracking-wide">員工入口</div>
                      <div className="text-sm font-bold text-black/60">管理訂單・花卉・排程</div>
                    </div>
                  </div>

                  <div className="flex-1 flex flex-col justify-center gap-3">
                    <div className="bg-[#FFD6C0] border-[2px] border-black rounded-xl p-4">
                      <p className="text-sm font-bold text-black/70 text-center">
                        員工與管理員專用入口<br/>需要帳號密碼登入
                      </p>
                    </div>
                    <button
                      onClick={() => setShowStaffLogin(true)}
                      className="w-full py-3 bg-[#FF7B6B] text-white font-black text-base uppercase tracking-wide border-[2.5px] border-black rounded-xl shadow-[3px_3px_0px_#111] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_#111] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_#111] transition-all">
                      員工登入 →
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#FFF0A0] border-[2px] border-black rounded-full flex items-center justify-center text-xl">
                        👤
                      </div>
                      <div className="font-black text-lg uppercase tracking-wide">員工登入</div>
                    </div>
                    <button onClick={() => setShowStaffLogin(false)}
                      className="text-black/40 hover:text-black font-black text-xl transition-colors">
                      ✕
                    </button>
                  </div>

                  <form onSubmit={handleLogin} className="flex flex-col gap-4 flex-1">
                    <div>
                      <label className="block text-xs font-black uppercase tracking-wide mb-1.5">帳號</label>
                      <input type="text" value={username} onChange={e => setUsername(e.target.value)}
                        placeholder="輸入帳號" autoComplete="username"
                        className="w-full px-4 py-3 bg-white border-[2.5px] border-black rounded-xl font-bold text-black placeholder:text-gray-400 focus:outline-none focus:shadow-[3px_3px_0px_#111] transition-shadow" />
                    </div>
                    <div>
                      <label className="block text-xs font-black uppercase tracking-wide mb-1.5">密碼</label>
                      <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                        placeholder="輸入密碼" autoComplete="current-password"
                        className="w-full px-4 py-3 bg-white border-[2.5px] border-black rounded-xl font-bold text-black placeholder:text-gray-400 focus:outline-none focus:shadow-[3px_3px_0px_#111] transition-shadow" />
                    </div>
                    <button type="submit" disabled={loginMutation.isPending}
                      className="w-full py-3 bg-[#FF7B6B] text-white font-black text-base uppercase tracking-wide border-[2.5px] border-black rounded-xl shadow-[3px_3px_0px_#111] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_#111] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_#111] transition-all disabled:opacity-60 disabled:cursor-not-allowed mt-auto">
                      {loginMutation.isPending ? "登入中..." : "登入 →"}
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>

          {/* Feature badges */}
          <div className="flex flex-wrap justify-center gap-3 mt-10">
            {[
              { icon: "🌺", text: "節慶花卉配送" },
              { icon: "📦", text: "即時訂單追蹤" },
              { icon: "💳", text: "彈性付款方式" },
              { icon: "🗓️", text: "時段預約管理" },
              { icon: "💬", text: "客服即時互動" },
            ].map((b, i) => (
              <div key={i} className="flex items-center gap-2 bg-white border-[2px] border-black rounded-full px-4 py-2 shadow-[2px_2px_0px_#111] font-bold text-sm">
                <span>{b.icon}</span>
                <span>{b.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Footer ── */}
        <footer className="border-t-[3px] border-black bg-black/5 py-4 px-6 text-center">
          <p className="text-xs font-bold text-black/50">
            © 2024 金美芳花苑 · 所有訂單數據安全保存
          </p>
        </footer>
      </div>
    </div>
  );
}
