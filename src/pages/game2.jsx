import { useState, useEffect, useRef } from "react";
import { sounds } from "../utils/soundEffects";

const TARGET_TYPES = [
  { type: "plasma", emoji: "🟢", points: 50, label: "Plasma", bg: "from-emerald-500 to-teal-400", glow: "shadow-emerald-500/50" },
  { type: "gold", emoji: "⭐", points: 100, label: "Hyper Gold", bg: "from-amber-400 to-yellow-300", glow: "shadow-amber-500/50" },
  { type: "hazard", emoji: "💣", points: -40, label: "Hazard!", bg: "from-rose-600 to-red-500", glow: "shadow-red-500/50" },
  { type: "time", emoji: "⚡", points: 30, bonusTime: 2, label: "Overcharge", bg: "from-cyan-400 to-blue-500", glow: "shadow-cyan-500/50" },
];

export default function Game2() {
  const [gameState, setGameState] = useState("idle"); // idle, playing, gameover
  const [timeLeft, setTimeLeft] = useState(30);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [activeTargets, setActiveTargets] = useState([]);
  const [floatingTexts, setFloatingTexts] = useState([]);
  const [reactionTimes, setReactionTimes] = useState([]);
  const [totalClicks, setTotalClicks] = useState(0);
  const [hitClicks, setHitClicks] = useState(0);

  const gameAreaRef = useRef(null);
  const timerRef = useRef(null);
  const spawnTimerRef = useRef(null);

  // Load high score
  useEffect(() => {
    const saved = localStorage.getItem("ig342_reflex_best_score");
    if (saved) setBestScore(parseInt(saved, 10));
    return () => {
      clearInterval(timerRef.current);
      clearInterval(spawnTimerRef.current);
    };
  }, []);

  const spawnTarget = () => {
    if (!gameAreaRef.current) return;
    const rect = gameAreaRef.current.getBoundingClientRect();
    const size = 64; // px
    const maxX = Math.max(10, rect.width - size - 20);
    const maxY = Math.max(10, rect.height - size - 20);

    const x = Math.floor(Math.random() * maxX) + 10;
    const y = Math.floor(Math.random() * maxY) + 10;

    // Randomize target type with weighted probabilities
    const rand = Math.random();
    let selectedType = TARGET_TYPES[0]; // plasma 50%
    if (rand < 0.25) selectedType = TARGET_TYPES[1]; // gold 25%
    else if (rand < 0.40) selectedType = TARGET_TYPES[2]; // hazard 15%
    else if (rand < 0.50) selectedType = TARGET_TYPES[3]; // time 10%

    const newTarget = {
      id: Date.now() + Math.random(),
      x,
      y,
      spawnTime: Date.now(),
      ...selectedType
    };

    setActiveTargets((prev) => [...prev.slice(-4), newTarget]);
  };

  const startGame = () => {
    sounds.laserHit();
    setGameState("playing");
    setTimeLeft(30);
    setScore(0);
    setCombo(0);
    setReactionTimes([]);
    setTotalClicks(0);
    setHitClicks(0);
    setActiveTargets([]);
    setFloatingTexts([]);

    // Main 1s countdown timer
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          endGame();
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    // Target spawner
    spawnTimerRef.current = setInterval(() => {
      spawnTarget();
    }, 650);

    // Initial targets
    setTimeout(spawnTarget, 100);
    setTimeout(spawnTarget, 400);
  };

  const endGame = () => {
    clearInterval(timerRef.current);
    clearInterval(spawnTimerRef.current);
    setActiveTargets([]);
    setGameState("gameover");
    sounds.victory();

    setScore((finalScore) => {
      if (finalScore > bestScore) {
        setBestScore(finalScore);
        localStorage.setItem("ig342_reflex_best_score", finalScore.toString());
      }
      return finalScore;
    });
  };

  const addFloatingText = (x, y, text, color = "text-yellow-300") => {
    const id = Date.now() + Math.random();
    setFloatingTexts((prev) => [...prev, { id, x, y, text, color }]);
    setTimeout(() => {
      setFloatingTexts((prev) => prev.filter((item) => item.id !== id));
    }, 800);
  };

  // Handle Target Click
  const handleTargetClick = (e, target) => {
    e.stopPropagation();
    setTotalClicks((c) => c + 1);
    setHitClicks((c) => c + 1);

    const reaction = Date.now() - target.spawnTime;
    setReactionTimes((arr) => [...arr, reaction]);

    // Remove target from board
    setActiveTargets((prev) => prev.filter((t) => t.id !== target.id));

    if (target.type === "hazard") {
      sounds.wrong();
      setCombo(0);
      setScore((s) => Math.max(0, s + target.points));
      addFloatingText(target.x, target.y, `${target.points} 💥`, "text-rose-400 font-bold");
      return;
    }

    // Success hit
    const newCombo = combo + 1;
    setCombo(newCombo);
    const comboBonus = Math.floor(newCombo * 10);
    const earned = target.points + comboBonus;

    setScore((s) => s + earned);

    if (target.bonusTime) {
      setTimeLeft((t) => Math.min(45, t + target.bonusTime));
    }

    if (target.type === "gold") {
      sounds.criticalHit();
      addFloatingText(
        target.x,
        target.y,
        `+${earned} CRITICAL! 🔥`,
        "text-amber-300 font-black text-lg"
      );
    } else {
      sounds.laserHit();
      addFloatingText(
        target.x,
        target.y,
        `+${earned} (x${newCombo})`,
        "text-emerald-300 font-bold"
      );
    }
  };

  // Miss click handler on game arena
  const handleArenaClick = () => {
    if (gameState !== "playing") return;
    setTotalClicks((c) => c + 1);
    setCombo(0);
    sounds.playTone(200, "sawtooth", 0.05, 0.04);
  };

  const avgReaction =
    reactionTimes.length > 0
      ? Math.round(reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length)
      : 0;

  const accuracy =
    totalClicks > 0 ? Math.round((hitClicks / totalClicks) * 100) : 100;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Banner / Title */}
      <div className="bg-gradient-to-r from-emerald-950/70 via-slate-900 to-indigo-950/80 border border-emerald-500/30 rounded-2xl p-6 backdrop-blur-md shadow-xl text-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold mb-2 border border-emerald-500/30">
              <span>🎯 หน้าที่ 2 / Page 2 (Route: /game2)</span>
              <span>•</span>
              <span>Reflex Duel</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-white via-emerald-100 to-teal-300 bg-clip-text text-transparent">
              Neon Reflex Duel
            </h1>
            <p className="text-sm text-slate-300 mt-1">
              ทดสอบความไวปฏิกิริยา แตะเป้าหมายนีออนให้ไวที่สุด หลบระเบิด และทำลายสถิติสูงสุด!
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <div className="bg-slate-800/80 px-4 py-2 rounded-xl border border-slate-700 text-right">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                ความเร็วเฉลี่ย
              </span>
              <span className="text-lg font-bold text-emerald-400">
                {avgReaction > 0 ? `${avgReaction} ms` : "--"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200/80 text-center">
          <div className="text-xs text-slate-500 font-medium">คะแนน (Score)</div>
          <div className="text-2xl font-bold text-emerald-600 mt-1">{score}</div>
          {combo > 1 && (
            <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold animate-pulse">
              ⚡ STREAK x{combo}!
            </span>
          )}
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200/80 text-center">
          <div className="text-xs text-slate-500 font-medium">เวลาที่เหลือ</div>
          <div className={`text-2xl font-black mt-1 ${timeLeft <= 5 ? "text-red-500 animate-ping" : "text-slate-800"}`}>
            {timeLeft}s
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Countdown</div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200/80 text-center">
          <div className="text-xs text-slate-500 font-medium">ความแม่นยำ</div>
          <div className="text-2xl font-bold text-indigo-600 mt-1">{accuracy}%</div>
          <div className="text-[11px] text-slate-400 mt-1">Accuracy</div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200/80 text-center">
          <div className="text-xs text-slate-500 font-medium">สถิติสูงสุด</div>
          <div className="text-2xl font-bold text-amber-500 mt-1">{bestScore}</div>
          <div className="text-[11px] text-amber-600 font-medium mt-1">🏆 Best Score</div>
        </div>

        <div className="col-span-2 sm:col-span-1 bg-white rounded-xl p-3 shadow-sm border border-slate-200/80 flex items-center justify-center">
          <button
            onClick={startGame}
            className="w-full h-full py-2.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-lg font-semibold text-sm shadow-md hover:shadow-emerald-500/25 transition active:scale-95 flex items-center justify-center space-x-2"
          >
            <span>{gameState === "playing" ? "🔄 รีสตาร์ท" : "▶️ เริ่มเกม"}</span>
          </button>
        </div>
      </div>

      {/* Target Legend Bar */}
      <div className="flex flex-wrap items-center justify-center gap-4 bg-slate-900/60 p-3 rounded-xl border border-slate-800 text-xs text-slate-300">
        <span className="flex items-center space-x-1.5">
          <span>🟢</span>
          <span>Plasma (+50)</span>
        </span>
        <span className="flex items-center space-x-1.5">
          <span>⭐</span>
          <span className="text-amber-300 font-semibold">Gold (+100)</span>
        </span>
        <span className="flex items-center space-x-1.5">
          <span>⚡</span>
          <span className="text-cyan-300 font-semibold">Overcharge (+2s)</span>
        </span>
        <span className="flex items-center space-x-1.5">
          <span>💣</span>
          <span className="text-rose-400 font-semibold">Hazard (-40)</span>
        </span>
      </div>

      {/* Main Interactive Arena */}
      <div
        ref={gameAreaRef}
        onClick={handleArenaClick}
        className="h-96 sm:h-[420px] bg-slate-950 rounded-2xl border-2 border-slate-800 shadow-2xl relative overflow-hidden select-none cursor-crosshair"
      >
        {/* Cyber Grid Background */}
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(#10b981 1px, transparent 1px), radial-gradient(#6366f1 1px, transparent 1px)",
            backgroundSize: "32px 32px",
            backgroundPosition: "0 0, 16px 16px"
          }}
        />

        {/* Ambient Lights */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Floating Numbers & Hit Indicators */}
        {floatingTexts.map((ft) => (
          <div
            key={ft.id}
            style={{ left: `${ft.x}px`, top: `${ft.y}px` }}
            className={`absolute pointer-events-none z-30 animate-float-score font-mono ${ft.color}`}
          >
            {ft.text}
          </div>
        ))}

        {/* Active Targets */}
        {gameState === "playing" &&
          activeTargets.map((target) => (
            <div
              key={target.id}
              onClick={(e) => handleTargetClick(e, target)}
              style={{ left: `${target.x}px`, top: `${target.y}px` }}
              className={`absolute w-16 h-16 rounded-2xl bg-gradient-to-tr ${target.bg} ${target.glow} shadow-lg flex flex-col items-center justify-center cursor-pointer transform hover:scale-110 active:scale-90 transition-transform duration-100 z-20 border-2 border-white/60 animate-pulse`}
            >
              <span className="text-2xl">{target.emoji}</span>
              <span className="text-[9px] font-bold text-white tracking-tighter">
                {target.points > 0 ? `+${target.points}` : target.points}
              </span>
            </div>
          ))}

        {/* Ready Screen */}
        {gameState === "idle" && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center text-white z-10">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-3xl mb-4 shadow-lg shadow-emerald-500/30">
              ⚡
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-wide text-white">
              พร้อมทดสอบความเร็วหรือยัง?
            </h2>
            <p className="text-slate-400 text-sm max-w-md mt-2">
              คลิกที่เป้าหมายเพื่อสะสมคะแนน Combo และทำลายสถิติสูงสุด ระวังอย่าโดนลูกระเบิดสีแดง!
            </p>
            <button
              onClick={startGame}
              className="mt-6 px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 font-bold rounded-xl shadow-lg shadow-emerald-500/40 transition transform hover:scale-105 active:scale-95"
            >
              เริ่มเล่นทันที (Start Game)
            </button>
          </div>
        )}

        {/* Game Over Modal */}
        {gameState === "gameover" && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center text-white z-30 animate-fadeIn">
            <div className="text-5xl mb-3">🎯</div>
            <h2 className="text-3xl font-extrabold bg-gradient-to-r from-emerald-300 via-teal-200 to-cyan-400 bg-clip-text text-transparent">
              TIME'S UP!
            </h2>
            <p className="text-slate-300 text-sm mt-1">สรุปผลการทดสอบปฏิกิริยาความไว</p>

            <div className="my-6 grid grid-cols-3 gap-4 bg-slate-800/80 p-4 rounded-xl border border-slate-700 max-w-md w-full">
              <div>
                <div className="text-xs text-slate-400">Total Score</div>
                <div className="text-2xl font-bold text-emerald-400">{score}</div>
              </div>
              <div>
                <div className="text-xs text-slate-400">Avg Reaction</div>
                <div className="text-2xl font-bold text-cyan-400">
                  {avgReaction > 0 ? `${avgReaction}ms` : "--"}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-400">Accuracy</div>
                <div className="text-2xl font-bold text-amber-400">{accuracy}%</div>
              </div>
            </div>

            <button
              onClick={startGame}
              className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 font-bold rounded-xl shadow-lg shadow-emerald-500/40 transition transform hover:scale-105 active:scale-95"
            >
              เล่นใหม่อีกครั้ง (Try Again)
            </button>
          </div>
        )}
      </div>

      {/* Guide Note */}
      <div className="bg-emerald-50/70 border border-emerald-100 rounded-xl p-4 text-xs text-emerald-900 flex items-start space-x-3">
        <div className="text-lg">💡</div>
        <div>
          <span className="font-semibold">เทคนิคการเล่น:</span> การคลิกต่อเนื่องไม่พลาดจะเพิ่ม Streak Multiplier คะแนนจะคูณเพิ่มขึ้นเรื่อยๆ และการแตะที่เป้าหมาย Overcharge จะช่วยยืดเวลาการเล่นได้อีก 2 วินาที!
        </div>
      </div>
    </div>
  );
}
