import { useState, useEffect, useRef, useCallback } from "react";
import { sounds } from "../utils/soundEffects";

const ALL_EMOJIS = ["🚀", "💎", "⚡", "🎮", "🪐", "🎯", "🔥", "🏆", "👾", "🤖"];

export default function Home() {
  const [difficulty, setDifficulty] = useState("normal"); // easy (6 pairs), normal (8 pairs), hard (10 pairs)
  const [cards, setCards] = useState([]);
  const [flippedIndices, setFlippedIndices] = useState([]);
  const [matchedIds, setMatchedIds] = useState([]);
  const [moves, setMoves] = useState(0);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isWon, setIsWon] = useState(false);
  const [bestScore, setBestScore] = useState(0);

  const timerRef = useRef(null);

  // Initialize Game
  const initGame = useCallback((diff = difficulty) => {
    sounds.cardFlip();
    const pairCount = diff === "easy" ? 6 : diff === "hard" ? 10 : 8;
    const selectedEmojis = ALL_EMOJIS.slice(0, pairCount);
    const deck = [...selectedEmojis, ...selectedEmojis]
      .sort(() => Math.random() - 0.5)
      .map((emoji, index) => ({
        id: index,
        emoji,
        isMatched: false
      }));

    setCards(deck);
    setFlippedIndices([]);
    setMatchedIds([]);
    setMoves(0);
    setScore(0);
    setCombo(0);
    setSeconds(0);
    setIsWon(false);
    setIsPlaying(false);

    if (timerRef.current) clearInterval(timerRef.current);
  }, [difficulty]);

  // Load high score
  useEffect(() => {
    const savedBest = localStorage.getItem("ig342_memory_best_score");
    if (savedBest) {
      setBestScore(parseInt(savedBest, 10));
    }
    initGame(difficulty);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [difficulty, initGame]);

  // Timer runner
  useEffect(() => {
    if (isPlaying && !isWon) {
      timerRef.current = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, isWon]);

  // Handle Card Click
  const handleCardClick = (index) => {
    if (!isPlaying && !isWon) {
      setIsPlaying(true);
    }

    // Ignore if already flipped or matched or 2 cards are currently being compared
    if (
      flippedIndices.includes(index) ||
      matchedIds.includes(cards[index].id) ||
      flippedIndices.length >= 2
    ) {
      return;
    }

    sounds.cardFlip();
    const newFlipped = [...flippedIndices, index];
    setFlippedIndices(newFlipped);

    if (newFlipped.length === 2) {
      setMoves((m) => m + 1);
      const [firstIdx, secondIdx] = newFlipped;
      const firstCard = cards[firstIdx];
      const secondCard = cards[secondIdx];

      if (firstCard.emoji === secondCard.emoji) {
        // MATCH!
        setTimeout(() => {
          sounds.cardMatch();
          const newMatched = [...matchedIds, firstCard.id, secondCard.id];
          setMatchedIds(newMatched);
          setFlippedIndices([]);
          const newCombo = combo + 1;
          setCombo(newCombo);
          const pointsEarned = 100 + newCombo * 50;
          setScore((s) => {
            const nextScore = s + pointsEarned;
            if (nextScore > bestScore) {
              setBestScore(nextScore);
              localStorage.setItem("ig342_memory_best_score", nextScore.toString());
            }
            return nextScore;
          });

          // Check if game won
          if (newMatched.length === cards.length) {
            setIsWon(true);
            setIsPlaying(false);
            sounds.victory();
          }
        }, 300);
      } else {
        // MISMATCH
        setTimeout(() => {
          sounds.wrong();
          setFlippedIndices([]);
          setCombo(0);
        }, 800);
      }
    }
  };

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${remainder.toString().padStart(2, "0")}`;
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Banner / Title */}
      <div className="bg-gradient-to-r from-indigo-900/60 via-purple-900/50 to-slate-900/80 border border-indigo-500/30 rounded-2xl p-6 backdrop-blur-md shadow-xl text-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold mb-2 border border-indigo-500/30">
              <span>🃏 หน้าที่ 1 / Page 1 (Route: /)</span>
              <span>•</span>
              <span>Memory Matrix</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-white via-indigo-100 to-purple-300 bg-clip-text text-transparent">
              Cyber Memory Matrix
            </h1>
            <p className="text-sm text-slate-300 mt-1">
              ฝึกความจำและไหวพริบ พลิกการ์ดไซเบอร์จับคู่ให้ครบด้วยจำนวนตาเดินน้อยที่สุด!
            </p>
          </div>

          {/* Difficulty Selector */}
          <div className="flex items-center space-x-2 bg-slate-800/80 p-1.5 rounded-xl border border-slate-700">
            <button
              onClick={() => setDifficulty("easy")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                difficulty === "easy"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Easy (12)
            </button>
            <button
              onClick={() => setDifficulty("normal")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                difficulty === "normal"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Normal (16)
            </button>
            <button
              onClick={() => setDifficulty("hard")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                difficulty === "hard"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Hard (20)
            </button>
          </div>
        </div>
      </div>

      {/* Game Dashboard Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200/80 text-center">
          <div className="text-xs text-slate-500 font-medium">คะแนนปัจจุบัน</div>
          <div className="text-2xl font-bold text-indigo-600 mt-1">{score}</div>
          {combo > 1 && (
            <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-pink-100 text-pink-700 text-[10px] font-bold animate-pulse">
              🔥 Combo x{combo}!
            </span>
          )}
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200/80 text-center">
          <div className="text-xs text-slate-500 font-medium">ตาเดิน (Moves)</div>
          <div className="text-2xl font-bold text-slate-800 mt-1">{moves}</div>
          <div className="text-[11px] text-slate-400 mt-1">ครั้ง</div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200/80 text-center">
          <div className="text-xs text-slate-500 font-medium">เวลา (Time)</div>
          <div className="text-2xl font-bold text-purple-600 mt-1">
            {formatTime(seconds)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">นาที:วินาที</div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200/80 text-center">
          <div className="text-xs text-slate-500 font-medium">สถิติสูงสุด</div>
          <div className="text-2xl font-bold text-amber-500 mt-1">{bestScore}</div>
          <div className="text-[11px] text-amber-600 font-medium mt-1">🏆 Best Record</div>
        </div>

        <div className="col-span-2 sm:col-span-1 bg-white rounded-xl p-3 shadow-sm border border-slate-200/80 flex items-center justify-center">
          <button
            onClick={() => initGame(difficulty)}
            className="w-full h-full py-2.5 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg font-semibold text-sm shadow-md hover:shadow-indigo-500/25 transition active:scale-95 flex items-center justify-center space-x-2"
          >
            <span>🔄</span>
            <span>เริ่มใหม่</span>
          </button>
        </div>
      </div>

      {/* Main Play Area */}
      <div className="bg-slate-900/90 rounded-2xl p-5 sm:p-8 border border-slate-800 shadow-2xl relative overflow-hidden">
        {/* Ambient background glow */}
        <div className="absolute -top-32 -left-32 w-80 h-80 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />

        {/* Card Grid */}
        <div
          className={`grid gap-3 sm:gap-4 mx-auto ${
            difficulty === "easy"
              ? "grid-cols-3 sm:grid-cols-4 max-w-xl"
              : difficulty === "hard"
              ? "grid-cols-4 sm:grid-cols-5 max-w-3xl"
              : "grid-cols-4 max-w-2xl"
          }`}
        >
          {cards.map((card, idx) => {
            const isFlipped =
              flippedIndices.includes(idx) || matchedIds.includes(card.id);
            const isMatched = matchedIds.includes(card.id);

            return (
              <div
                key={card.id}
                onClick={() => handleCardClick(idx)}
                className="aspect-square perspective-1000 cursor-pointer select-none"
              >
                <div
                  className={`w-full h-full relative preserve-3d transition-transform duration-500 rounded-xl ${
                    isFlipped ? "rotate-y-180" : ""
                  }`}
                >
                  {/* Card Front (Face-down / Cyber Back) */}
                  <div className="absolute inset-0 backface-hidden bg-gradient-to-br from-slate-800 via-indigo-950 to-slate-900 border-2 border-indigo-500/40 rounded-xl flex flex-col items-center justify-center shadow-lg hover:border-indigo-400 hover:shadow-indigo-500/30 transition-all group">
                    <div className="w-10 h-10 rounded-lg bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 font-bold text-base group-hover:scale-110 transition-transform">
                      ?
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 uppercase font-mono tracking-wider">
                      Matrix
                    </span>
                  </div>

                  {/* Card Back (Face-up / Revealed) */}
                  <div
                    className={`absolute inset-0 backface-hidden rotate-y-180 rounded-xl flex flex-col items-center justify-center border-2 transition-all shadow-xl ${
                      isMatched
                        ? "bg-gradient-to-tr from-emerald-950 via-slate-900 to-teal-900 border-emerald-400 text-emerald-300 shadow-emerald-500/30"
                        : "bg-gradient-to-tr from-indigo-950 via-slate-900 to-purple-950 border-purple-400 text-white shadow-purple-500/30"
                    }`}
                  >
                    <span className="text-4xl sm:text-5xl transform transition-transform duration-300 hover:scale-125">
                      {card.emoji}
                    </span>
                    {isMatched && (
                      <span className="text-[10px] text-emerald-400 font-semibold mt-1">
                        MATCHED ✓
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Victory Celebration Modal */}
        {isWon && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 z-20 animate-fadeIn">
            <div className="max-w-md w-full bg-slate-900 border border-indigo-500/50 rounded-2xl p-6 sm:p-8 text-center text-white shadow-2xl shadow-indigo-500/40">
              <div className="text-6xl mb-3 animate-bounce">🏆</div>
              <h2 className="text-3xl font-extrabold bg-gradient-to-r from-amber-300 via-yellow-200 to-pink-400 bg-clip-text text-transparent">
                MISSION ACCOMPLISHED!
              </h2>
              <p className="text-slate-300 text-sm mt-2">
                สุดยอดมาก! คุณจับคู่การ์ดไซเบอร์สำเร็จทั้งหมดแล้ว
              </p>

              <div className="my-6 grid grid-cols-3 gap-3 bg-slate-800/80 p-3.5 rounded-xl border border-slate-700">
                <div>
                  <div className="text-xs text-slate-400">Score</div>
                  <div className="text-xl font-bold text-indigo-400">{score}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-400">Moves</div>
                  <div className="text-xl font-bold text-purple-400">{moves}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-400">Time</div>
                  <div className="text-xl font-bold text-emerald-400">
                    {formatTime(seconds)}
                  </div>
                </div>
              </div>

              <div className="flex justify-center space-x-1 text-2xl mb-6">
                <span>⭐</span>
                <span>⭐</span>
                <span>{moves <= cards.length * 1.3 ? "⭐" : "✨"}</span>
              </div>

              <button
                onClick={() => initGame(difficulty)}
                className="w-full py-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:to-pink-700 font-bold rounded-xl shadow-lg shadow-indigo-500/30 transition transform hover:scale-[1.02] active:scale-95"
              >
                เล่นใหม่อีกรอบ (Play Again)
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Guide Note */}
      <div className="bg-indigo-50/70 border border-indigo-100 rounded-xl p-4 text-xs text-indigo-900 flex items-start space-x-3">
        <div className="text-lg">💡</div>
        <div>
          <span className="font-semibold">เทคนิคการเล่น:</span> จับคู่การ์ดอย่างต่อเนื่องเพื่อสะสม <span className="font-bold text-indigo-700">Combo Multiplier</span> ซึ่งจะเพิ่มคะแนนพิเศษต่อการจับคู่สูงสุดถึง 5 เท่า!
        </div>
      </div>
    </div>
  );
}
