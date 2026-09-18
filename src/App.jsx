import { useState } from "react";
import { Routes, Route, Link, useLocation } from "react-router-dom";
import Sidebar from "./components/sidebar";
import Home from "./pages/home";
import Game2 from "./pages/game2";
import Game3 from "./pages/game3";

export default function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  const getPageTitle = () => {
    switch (location.pathname) {
      case "/":
      case "/game1":
        return "Mini Game 1 • Cyber Memory Matrix";
      case "/game2":
        return "Mini Game 2 • Neon Reflex Duel";
      case "/game3":
        return "Mini Game 3 • Neon Pulse 2048";
      default:
        return "IG342 Game Hub";
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-100 font-sans text-gray-800 antialiased selection:bg-indigo-500 selection:text-white">
      {/* Left Sidebar (Slide 9 & 11) */}
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Header from Original Template */}
        <header className="bg-white border-b border-gray-200 py-4 px-4 sm:px-8 sticky top-0 z-30 shadow-xs">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="flex items-center space-x-3">
              {/* Mobile Sidebar Toggle Button */}
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden p-2 rounded-xl text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 transition border border-gray-200"
                aria-label="Open Menu"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              <div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-indigo-600 flex items-center space-x-2">
                  <span>66111567AAMARIT KAOPIMAI</span>
                </h1>
                <p className="text-[11px] text-gray-500 hidden sm:block">
                  {getPageTitle()}
                </p>
              </div>
            </div>

            {/* Top Navigation Links */}
            <nav className="flex items-center space-x-2 sm:space-x-4 text-xs sm:text-sm font-medium">
              <Link
                to="/"
                className={`px-3 py-1.5 rounded-lg transition ${
                  location.pathname === "/" || location.pathname === "/game1"
                    ? "bg-indigo-50 text-indigo-600 font-semibold"
                    : "text-gray-600 hover:text-indigo-500"
                }`}
              >
                🃏 Game 1
              </Link>
              <Link
                to="/game2"
                className={`px-3 py-1.5 rounded-lg transition ${
                  location.pathname === "/game2"
                    ? "bg-emerald-50 text-emerald-600 font-semibold"
                    : "text-gray-600 hover:text-emerald-500"
                }`}
              >
                🎯 Game 2
              </Link>
              <Link
                to="/game3"
                className={`px-3 py-1.5 rounded-lg transition ${
                  location.pathname === "/game3"
                    ? "bg-amber-50 text-amber-600 font-semibold"
                    : "text-gray-600 hover:text-amber-500"
                }`}
              >
                🧩 Game 3
              </Link>

              <span className="hidden md:inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700 border border-indigo-200">
                Workshop 5-1 (10 คะแนน)
              </span>
            </nav>
          </div>
        </header>

        {/* Main Content Area (Slide 11) */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/game1" element={<Home />} />
            <Route path="/game2" element={<Game2 />} />
            <Route path="/game3" element={<Game3 />} />
          </Routes>
        </main>

        {/* Footer from Original Template */}
        <footer className="bg-white border-t border-gray-200 py-6 px-4 sm:px-8 text-center text-gray-500">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="text-xs text-gray-500">
              วิชา IG342 การพัฒนาแอปพลิเคชันบนอุปกรณ์เคลื่อนที่ • มหาวิทยาลัยธุรกิจบัณฑิตย์
            </p>
            <p className="text-sm text-gray-400 uppercase tracking-widest font-medium">
              Copyright 2026 DPU
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}