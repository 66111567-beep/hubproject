import { useState, useEffect, useCallback } from "react";
import { sounds } from "../utils/soundEffects";

const GRID_SIZE = 4;

// Tile styling generator for 2048 Cyber theme
const getTileStyle = (val) => {
  switch (val) {
    case 2:
      return "bg-slate-800 text-slate-100 border border-slate-700 shadow-sm";
    case 4:
      return "bg-indigo-950 text-indigo-200 border border-indigo-700/60 shadow-indigo-950/50";
    case 8:
      return "bg-indigo-700 text-white border border-indigo-500 shadow-lg shadow-indigo-600/30";
    case 16:
      return "bg-blue-600 text-white border border-blue-400 shadow-lg shadow-blue-500/40";
    case 32:
      return "bg-cyan-600 text-white border border-cyan-300 shadow-lg shadow-cyan-500/40";
    case 64:
      return "bg-teal-600 text-white border border-teal-300 shadow-lg shadow-teal-500/40";
    case 128:
      return "bg-emerald-600 text-white border border-emerald-300 shadow-xl shadow-emerald-500/50 font-black";
    case 256:
      return "bg-amber-600 text-white border border-amber-300 shadow-xl shadow-amber-500/50 font-black";
    case 512:
      return "bg-orange-600 text-white border border-orange-300 shadow-xl shadow-orange-500/60 font-black";
    case 1024:
      return "bg-rose-600 text-white border border-rose-300 shadow-2xl shadow-rose-500/70 font-black animate-pulse";
    case 2048:
      return "bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 text-white border-2 border-yellow-200 shadow-2xl shadow-yellow-400/80 font-black animate-bounce";
    default:
      if (val > 2048) {
        return "bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-2 border-white shadow-2xl";
      }
      return "bg-slate-800/40 border border-slate-700/40 text-transparent";
  }
};

export default function Game3() {
  const [board, setBoard] = useState(Array(16).fill(0));
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [previousState, setPreviousState] = useState(null);
  const [isGameOver, setIsGameOver] = useState(false);
  const [hasWon, setHasWon] = useState(false);

  // Initialize board
  const addRandomTile = (currentBoard) => {
    const emptyIndices = currentBoard
      .map((val, idx) => (val === 0 ? idx : null))
      .filter((val) => val !== null);

    if (emptyIndices.length === 0) return currentBoard;

    const randIdx = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
    const newBoard = [...currentBoard];
    newBoard[randIdx] = Math.random() < 0.9 ? 2 : 4;
    return newBoard;
  };

  const initGame = useCallback(() => {
    sounds.tileSlide();
    let newBoard = Array(16).fill(0);
    newBoard = addRandomTile(newBoard);
    newBoard = addRandomTile(newBoard);
    setBoard(newBoard);
    setScore(0);
    setPreviousState(null);
    setIsGameOver(false);
    setHasWon(false);
  }, []);

  useEffect(() => {
    const savedBest = localStorage.getItem("ig342_2048_best_score");
    if (savedBest) setBestScore(parseInt(savedBest, 10));
    initGame();
  }, [initGame]);

  // Check Game Over
  const checkGameOver = (currentBoard) => {
    // Check if any empty cell exists
    if (currentBoard.includes(0)) return false;

    // Check horizontal neighbors
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 3; c++) {
        if (currentBoard[r * 4 + c] === currentBoard[r * 4 + c + 1]) return false;
      }
    }

    // Check vertical neighbors
    for (let c = 0; c < 4; c++) {
      for (let r = 0; r < 3; r++) {
        if (currentBoard[r * 4 + c] === currentBoard[(r + 1) * 4 + c]) return false;
      }
    }

    return true;
  };

  // Move and Merge row helper
  const slideAndMergeRow = (row) => {
    let filtered = row.filter((x) => x !== 0);
    let gainedScore = 0;
    let mergedRow = [];
    let hadMerge = false;

    for (let i = 0; i < filtered.length; i++) {
      if (i < filtered.length - 1 && filtered[i] === filtered[i + 1]) {
        const mergedVal = filtered[i] * 2;
        mergedRow.push(mergedVal);
        gainedScore += mergedVal;
        hadMerge = true;
        i++; // skip next since it's merged
      } else {
        mergedRow.push(filtered[i]);
      }
    }

    while (mergedRow.length < 4) {
      mergedRow.push(0);
    }

    return { newRow: mergedRow, gainedScore, hadMerge };
  };

  // Move Logic
  const move = useCallback(
    (direction) => {
      if (isGameOver) return;

      let changed = false;
      let totalGained = 0;
      let anyMerge = false;
      const nextBoard = [...board];

      // Save previous state for undo
      const prevState = {
        board: [...board],
        score
      };

      if (direction === "left") {
        for (let r = 0; r < 4; r++) {
          const row = nextBoard.slice(r * 4, r * 4 + 4);
          const { newRow, gainedScore, hadMerge } = slideAndMergeRow(row);
          if (hadMerge) anyMerge = true;
          totalGained += gainedScore;
          for (let c = 0; c < 4; c++) {
            if (nextBoard[r * 4 + c] !== newRow[c]) changed = true;
            nextBoard[r * 4 + c] = newRow[c];
          }
        }
      } else if (direction === "right") {
        for (let r = 0; r < 4; r++) {
          const row = nextBoard.slice(r * 4, r * 4 + 4).reverse();
          const { newRow, gainedScore, hadMerge } = slideAndMergeRow(row);
          if (hadMerge) anyMerge = true;
          totalGained += gainedScore;
          newRow.reverse();
          for (let c = 0; c < 4; c++) {
            if (nextBoard[r * 4 + c] !== newRow[c]) changed = true;
            nextBoard[r * 4 + c] = newRow[c];
          }
        }
      } else if (direction === "up") {
        for (let c = 0; c < 4; c++) {
          const col = [
            nextBoard[0 * 4 + c],
            nextBoard[1 * 4 + c],
            nextBoard[2 * 4 + c],
            nextBoard[3 * 4 + c]
          ];
          const { newRow, gainedScore, hadMerge } = slideAndMergeRow(col);
          if (hadMerge) anyMerge = true;
          totalGained += gainedScore;
          for (let r = 0; r < 4; r++) {
            if (nextBoard[r * 4 + c] !== newRow[r]) changed = true;
            nextBoard[r * 4 + c] = newRow[r];
          }
        }
      } else if (direction === "down") {
        for (let c = 0; c < 4; c++) {
          const col = [
            nextBoard[3 * 4 + c],
            nextBoard[2 * 4 + c],
            nextBoard[1 * 4 + c],
            nextBoard[0 * 4 + c]
          ];
          const { newRow, gainedScore, hadMerge } = slideAndMergeRow(col);
          if (hadMerge) anyMerge = true;
          totalGained += gainedScore;
          newRow.reverse();
          for (let r = 0; r < 4; r++) {
            if (nextBoard[r * 4 + c] !== newRow[r]) changed = true;
            nextBoard[r * 4 + c] = newRow[r];
          }
        }
      }

      if (changed) {
        if (anyMerge) {
          sounds.tileMerge();
        } else {
          sounds.tileSlide();
        }

        const boardWithNewTile = addRandomTile(nextBoard);
        setBoard(boardWithNewTile);
        setPreviousState(prevState);

        const updatedScore = score + totalGained;
        setScore(updatedScore);
        if (updatedScore > bestScore) {
          setBestScore(updatedScore);
          localStorage.setItem("ig342_2048_best_score", updatedScore.toString());
        }

        // Check 2048 win
        if (!hasWon && boardWithNewTile.includes(2048)) {
          setHasWon(true);
          sounds.victory();
        }

        // Check game over
        if (checkGameOver(boardWithNewTile)) {
          setIsGameOver(true);
          sounds.wrong();
        }
      }
    },
    [board, score, bestScore, isGameOver, hasWon]
  );

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (["ArrowUp", "KeyW"].includes(e.code)) {
        e.preventDefault();
        move("up");
      } else if (["ArrowDown", "KeyS"].includes(e.code)) {
        e.preventDefault();
        move("down");
      } else if (["ArrowLeft", "KeyA"].includes(e.code)) {
        e.preventDefault();
        move("left");
      } else if (["ArrowRight", "KeyD"].includes(e.code)) {
        e.preventDefault();
        move("right");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [move]);

  const undoMove = () => {
    if (!previousState) return;
    sounds.tileSlide();
    setBoard(previousState.board);
    setScore(previousState.score);
    setPreviousState(null);
    setIsGameOver(false);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Banner / Title */}
      <div className="bg-gradient-to-r from-amber-950/70 via-slate-900 to-indigo-950/80 border border-amber-500/30 rounded-2xl p-6 backdrop-blur-md shadow-xl text-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold mb-2 border border-amber-500/30">
              <span>🧩 หน้าที่ 3 / Page 3 (Route: /game3)</span>
              <span>•</span>
              <span>Neon 2048</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-white via-amber-100 to-yellow-300 bg-clip-text text-transparent">
              Neon Pulse 2048
            </h1>
            <p className="text-sm text-slate-300 mt-1">
              เลื่อนบล็อกตัวเลขรวมให้ได้ 2048! ใช้ปุ่มลูกศร คีย์บอร์ด หรือปุ่มสัมผัสบนจอ
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={undoMove}
              disabled={!previousState}
              className={`px-4 py-2 rounded-xl text-xs font-semibold border transition ${
                previousState
                  ? "bg-slate-800 text-white border-slate-600 hover:bg-slate-700 shadow-md"
                  : "bg-slate-900/50 text-slate-600 border-slate-800 cursor-not-allowed"
              }`}
            >
              ↩️ ย้อนกลับ (Undo)
            </button>
            <button
              onClick={initGame}
              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl text-xs font-semibold shadow-md transition"
            >
              🔄 เริ่มใหม่
            </button>
          </div>
        </div>
      </div>

      {/* Dashboard Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200/80 text-center">
          <div className="text-xs text-slate-500 font-medium">คะแนนปัจจุบัน</div>
          <div className="text-2xl font-bold text-amber-600 mt-1">{score}</div>
          <div className="text-[11px] text-slate-400 mt-1">Score</div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200/80 text-center">
          <div className="text-xs text-slate-500 font-medium">สถิติสูงสุด</div>
          <div className="text-2xl font-bold text-indigo-600 mt-1">{bestScore}</div>
          <div className="text-[11px] text-indigo-500 font-medium mt-1">🏆 Best Score</div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200/80 text-center">
          <div className="text-xs text-slate-500 font-medium">เป้าหมายสูงสุด</div>
          <div className="text-2xl font-extrabold text-transparent bg-gradient-to-r from-yellow-500 to-pink-500 bg-clip-text mt-1">
            2048
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Neon Core</div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200/80 text-center">
          <div className="text-xs text-slate-500 font-medium">ควบคุม</div>
          <div className="text-xs font-semibold text-slate-700 mt-2 flex items-center justify-center space-x-1">
            <span className="px-1.5 py-0.5 bg-slate-100 rounded border text-[10px]">⬆️</span>
            <span className="px-1.5 py-0.5 bg-slate-100 rounded border text-[10px]">⬇️</span>
            <span className="px-1.5 py-0.5 bg-slate-100 rounded border text-[10px]">⬅️</span>
            <span className="px-1.5 py-0.5 bg-slate-100 rounded border text-[10px]">➡️</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Keys / D-Pad</div>
        </div>
      </div>

      {/* Main Game Board & Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
        {/* The 4x4 Grid */}
        <div className="lg:col-span-2 flex justify-center">
          <div className="w-full max-w-md bg-slate-950 p-4 sm:p-5 rounded-2xl border-2 border-slate-800 shadow-2xl relative">
            <div className="grid grid-cols-4 gap-3">
              {board.map((val, idx) => (
                <div
                  key={idx}
                  className={`aspect-square rounded-xl flex items-center justify-center text-xl sm:text-2xl font-bold transition-all duration-150 transform select-none ${getTileStyle(
                    val
                  )}`}
                >
                  {val > 0 ? val : ""}
                </div>
              ))}
            </div>

            {/* Game Over Modal */}
            {isGameOver && (
              <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center p-6 text-center text-white z-20 animate-fadeIn">
                <div className="text-5xl mb-2">💥</div>
                <h3 className="text-2xl font-black text-rose-400">GAME OVER</h3>
                <p className="text-xs text-slate-400 mt-1">ไม่มีตำแหน่งรวมบล็อกได้แล้ว</p>
                <div className="text-xl font-bold text-amber-300 mt-3">
                  Score: {score}
                </div>
                <button
                  onClick={initGame}
                  className="mt-5 px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-xl shadow-lg transition transform hover:scale-105"
                >
                  เล่นใหม่อีกรอบ
                </button>
              </div>
            )}

            {/* 2048 Win Banner */}
            {hasWon && (
              <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center p-6 text-center text-white z-20 animate-fadeIn">
                <div className="text-6xl mb-2 animate-bounce">🎉</div>
                <h3 className="text-3xl font-black bg-gradient-to-r from-yellow-300 to-pink-400 bg-clip-text text-transparent">
                  YOU WON 2048!
                </h3>
                <p className="text-xs text-slate-300 mt-1">
                  คุณทำภารกิจรวมบล็อกถึง 2048 สำเร็จแล้ว!
                </p>
                <button
                  onClick={() => setHasWon(false)}
                  className="mt-5 px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg transition"
                >
                  เล่นต่อเพื่อทำคะแนนเพิ่ม (Keep Playing)
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile / Screen D-Pad Controller */}
        <div className="flex flex-col items-center justify-center space-y-3 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-bold text-slate-600 uppercase tracking-wider text-center">
            📱 Touch & Click D-Pad
          </div>
          <p className="text-[11px] text-slate-400 text-center max-w-xs">
            เหมาะสำหรับสมาร์ตโฟนหรือแท็บเล็ต หรือคลิกปุ่มเพื่อเลื่อนกล่องได้ทันที
          </p>

          <div className="flex flex-col items-center space-y-2 pt-2">
            {/* UP */}
            <button
              onClick={() => move("up")}
              className="w-14 h-14 bg-slate-800 hover:bg-indigo-600 text-white text-xl font-bold rounded-2xl shadow-md transition transform active:scale-90 flex items-center justify-center"
            >
              ▲
            </button>

            {/* LEFT / DOWN / RIGHT */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => move("left")}
                className="w-14 h-14 bg-slate-800 hover:bg-indigo-600 text-white text-xl font-bold rounded-2xl shadow-md transition transform active:scale-90 flex items-center justify-center"
              >
                ◀
              </button>
              <button
                onClick={() => move("down")}
                className="w-14 h-14 bg-slate-800 hover:bg-indigo-600 text-white text-xl font-bold rounded-2xl shadow-md transition transform active:scale-90 flex items-center justify-center"
              >
                ▼
              </button>
              <button
                onClick={() => move("right")}
                className="w-14 h-14 bg-slate-800 hover:bg-indigo-600 text-white text-xl font-bold rounded-2xl shadow-md transition transform active:scale-90 flex items-center justify-center"
              >
                ▶
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Guide Note */}
      <div className="bg-amber-50/70 border border-amber-100 rounded-xl p-4 text-xs text-amber-900 flex items-start space-x-3">
        <div className="text-lg">💡</div>
        <div>
          <span className="font-semibold">เทคนิคการเล่น:</span> พยายามเก็บตัวเลขที่มีค่ามากที่สุดไว้ที่มุมใดมุมหนึ่งของตาราง (เช่น มุมล่างซ้ายหรือขวา) และอย่าสลับทิศทางขึ้น-ลงมั่วซั่ว เพื่อให้บล็อกไหลรวมกันเป็นสายต่อเนื่อง!
        </div>
      </div>
    </div>
  );
}
