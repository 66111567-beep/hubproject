import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { sounds } from "../utils/soundEffects";

export default function Sidebar({ isOpen, setIsOpen }) {
  const location = useLocation();
  const [isMuted, setIsMuted] = useState(false);

  const toggleSound = () => {
    const muted = sounds.toggleMute();
    setIsMuted(muted);
  };

  const navItems = [
    {
      to: "/expense",
      title: "Location Expense",
      subtitle: "IndexedDB Tracker",
      desc: "บันทึกรายรับ-รายจ่ายตามพิกัด GPS",
      icon: "📍",
      badge: "IndexedDB + GPS",
      badgeColor: "bg-blue-500/20 text-blue-300 border-blue-500/30"
    },
    {
      to: "/",
      title: "Mini Game 1",
      subtitle: "Cyber Memory Matrix",
      desc: "เกมจับคู่การ์ดความจำ",
      icon: "🃏",
      badge: "Combo & 3D",
      badgeColor: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30"
    },
    {
      to: "/game2",
      title: "Mini Game 2",
      subtitle: "Neon Reflex Duel",
      desc: "เกมวัดความไวปฏิกิริยา",
      icon: "🎯",
      badge: "Speed & Aim",
      badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
    },
    {
      to: "/game3",
      title: "Mini Game 3",
      subtitle: "Neon Pulse 2048",
      desc: "เกมพัซเซิลรวมตัวเลข",
      icon: "🧩",
      badge: "Strategy",
      badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/30"
    }
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={`fixed lg:static top-0 left-0 z-50 h-full w-72 bg-gradient-to-b from-gray-900 via-slate-900 to-gray-950 text-white flex flex-col border-r border-slate-800/80 shadow-2xl transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Top Branding */}
        <div className="p-6 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center text-xl shadow-lg shadow-indigo-500/30">
              ⚡
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-indigo-300 bg-clip-text text-transparent truncate max-w-[170px]">
                66111567AAMARIT KAOPIMAI
              </h1>
              <p className="text-xs text-indigo-400 font-medium">React Route Workshop 5</p>
            </div>
          </div>

          {/* Close button on mobile */}
          <button
            onClick={() => setIsOpen(false)}
            className="lg:hidden text-gray-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            ✕
          </button>
        </div>

        {/* Course Info Card */}
        <div className="mx-4 mt-5 p-3.5 rounded-xl bg-slate-800/50 border border-slate-700/60 backdrop-blur">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>รายวิชา IG342</span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-semibold text-[10px]">
              Active 10 คะแนน
            </span>
          </div>
          <p className="text-xs text-slate-300 font-medium leading-snug">
            การพัฒนาแอปบนอุปกรณ์เคลื่อนที่
          </p>
        </div>

        {/* Navigation Section */}
        <div className="px-4 mt-6">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-2 mb-3">
            Navigation / เมนูระบบ (4 หน้า)
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const isActive =
              location.pathname === item.to ||
              (item.to === "/" && location.pathname === "/game1");

            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => {
                  sounds.playTone(550, "sine", 0.05, 0.04);
                  if (setIsOpen) setIsOpen(false);
                }}
                className={`group relative flex items-start space-x-3 p-3 rounded-xl transition-all duration-200 ${
                  isActive
                    ? "bg-indigo-600/25 text-white border border-indigo-500/50 shadow-lg shadow-indigo-500/20"
                    : "text-slate-300 hover:bg-slate-800/70 hover:text-white border border-transparent"
                }`}
              >
                {/* Active left indicator glow */}
                {isActive && (
                  <div className="absolute left-0 top-3 bottom-3 w-1.5 rounded-r bg-indigo-500 shadow-[0_0_8px_#6366f1]" />
                )}

                <div className={`text-2xl mt-0.5 transition-transform duration-200 group-hover:scale-110 ${isActive ? "scale-110" : ""}`}>
                  {item.icon}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold tracking-wide">
                      {item.title}
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-md border font-medium ${item.badgeColor}`}
                    >
                      {item.badge}
                    </span>
                  </div>
                  <div className="text-xs font-medium text-slate-200 truncate mt-0.5">
                    {item.subtitle}
                  </div>
                  <div className="text-[11px] text-slate-400 truncate">
                    {item.desc}
                  </div>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Audio & Settings Control */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-900/40">
          <button
            onClick={toggleSound}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white transition text-xs font-medium"
          >
            <span className="flex items-center space-x-2">
              <span>{isMuted ? "🔇" : "🔊"}</span>
              <span>Sound Effects</span>
            </span>
            <span
              className={`px-2 py-0.5 rounded text-[10px] ${
                isMuted ? "bg-red-500/20 text-red-300" : "bg-emerald-500/20 text-emerald-300"
              }`}
            >
              {isMuted ? "MUTED" : "ON"}
            </span>
          </button>

          <div className="mt-3 text-center">
            <span className="text-[11px] text-slate-500">
              DPU Workshop 5-1 • React Router
            </span>
          </div>
        </div>
      </aside>
    </>
  );
}
