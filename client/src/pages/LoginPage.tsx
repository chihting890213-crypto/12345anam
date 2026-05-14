import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useStaffAuth } from "@/contexts/StaffAuthContext";
import { toast } from "sonner";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const { refetch } = useStaffAuth();

  const loginMutation = trpc.staffAuth.login.useMutation({
    onSuccess: () => {
      toast.success("登入成功！");
      refetch();
    },
    onError: (err) => {
      toast.error(err.message || "登入失敗");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) { toast.error("請填寫帳號與密碼"); return; }
    loginMutation.mutate({ username, password });
  };

  return (
    <div className="min-h-screen memphis-bg flex items-center justify-center p-4 relative">
      {/* Geometric decorations */}
      <div className="absolute top-10 left-10 w-16 h-16 bg-[#B8F0D8] border-[3px] border-black rounded-full opacity-80" />
      <div className="absolute top-20 right-20 w-12 h-12 bg-[#D4C5F9] border-[3px] border-black rotate-45 opacity-80" />
      <div className="absolute bottom-20 left-20 w-20 h-20 bg-[#FFF0A0] border-[3px] border-black opacity-80" />
      <div className="absolute bottom-10 right-10 w-10 h-10 bg-[#FF7B6B] border-[3px] border-black rounded-full opacity-80" />
      <div className="absolute top-1/3 left-5 w-8 h-8 bg-[#FFB899] border-[2px] border-black rotate-12 opacity-60" />
      <div className="absolute top-1/4 right-8 w-6 h-6 bg-[#B8F0D8] border-[2px] border-black rotate-45 opacity-60" />

      <div className="relative z-10 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-block bg-[#FF7B6B] border-[3px] border-black rounded-2xl px-6 py-3 mb-4 shadow-[4px_4px_0px_#111]">
            <span className="text-4xl">🌸</span>
          </div>
          <h1 className="memphis-title text-4xl text-black mb-2">
            FLOWER ORDER
          </h1>
          <p className="text-black font-bold text-lg">花卉訂單管理系統</p>
          <div className="flex justify-center gap-2 mt-2">
            <span className="w-3 h-3 rounded-full bg-black inline-block" />
            <span className="w-3 h-3 bg-black rotate-45 inline-block" />
            <span className="w-3 h-3 rounded-full bg-black inline-block" />
          </div>
        </div>

        {/* Login Card */}
        <div className="memphis-card p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 bg-[#FFF0A0] border-[2px] border-black rounded-full flex items-center justify-center font-black text-sm">
              👤
            </div>
            <h2 className="text-xl font-black uppercase tracking-wide">員工登入</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-black uppercase tracking-wide mb-2">
                帳號
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="輸入帳號"
                className="w-full px-4 py-3 bg-white border-[2.5px] border-black rounded-lg font-bold text-black placeholder:text-gray-400 focus:outline-none focus:shadow-[3px_3px_0px_#111] transition-shadow"
                autoComplete="username"
              />
            </div>

            <div>
              <label className="block text-sm font-black uppercase tracking-wide mb-2">
                密碼
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="輸入密碼"
                className="w-full px-4 py-3 bg-white border-[2.5px] border-black rounded-lg font-bold text-black placeholder:text-gray-400 focus:outline-none focus:shadow-[3px_3px_0px_#111] transition-shadow"
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              disabled={loginMutation.isPending}
              className="w-full py-3 bg-[#FF7B6B] text-white font-black text-lg uppercase tracking-wide border-[2.5px] border-black rounded-lg shadow-[3px_3px_0px_#111] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_#111] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_#111] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loginMutation.isPending ? "登入中..." : "登入 →"}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-[2px] bg-black" />
            <span className="text-xs font-black uppercase tracking-widest">或</span>
            <div className="flex-1 h-[2px] bg-black" />
          </div>

          {/* Customer query link */}
          <a
            href="/query"
            className="block w-full py-3 bg-[#B8F0D8] text-black font-black text-base uppercase tracking-wide border-[2.5px] border-black rounded-lg shadow-[3px_3px_0px_#111] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_#111] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_#111] transition-all text-center"
          >
            🔍 客戶查詢訂單
          </a>
        </div>

        {/* Footer dots */}
        <div className="flex justify-center gap-3 mt-6">
          {["#FF7B6B","#B8F0D8","#D4C5F9","#FFF0A0","#FFB899"].map((c, i) => (
            <div key={i} className="w-4 h-4 rounded-full border-[2px] border-black" style={{ background: c }} />
          ))}
        </div>
      </div>
    </div>
  );
}
