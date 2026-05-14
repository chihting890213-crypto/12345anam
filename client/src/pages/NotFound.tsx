import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "#FFD6C0" }}>
      <div className="text-center">
        <div className="memphis-card p-10 max-w-md mx-auto">
          <div className="text-8xl font-black mb-4" style={{ textShadow: "4px 4px 0px #111" }}>404</div>
          <div className="text-4xl mb-4">🌸</div>
          <h1 className="memphis-title text-2xl mb-3">找不到頁面</h1>
          <p className="font-bold text-gray-600 mb-6">您要找的頁面不存在或已移除</p>
          <Link href="/">
            <button className="memphis-btn px-8 py-3 bg-[#FF7B6B] text-white font-black uppercase tracking-wide rounded-xl">
              返回首頁
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
