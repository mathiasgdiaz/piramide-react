import React, { useEffect, useRef, useState } from "react";
import Pyramid from "./components/Pyramid";
import {
  evaluateStatuses,
  findResolvableCells,
  clearBlinking,
  getMath,
} from "./pyramidLogic";
import { generateSolution, generateMask, makePuzzle } from "./generator";
import "./styles.css";
import InstructionModal from "./components/InstructionModal";

// Parámetros
const HEIGHT = 6;
const RAND_MIN = -9;   // positivos (usa 0 si querés permitir 0)
const RAND_MAX = 9;
const DENSITY = 0.28;
const INACTIVITY_MS = 6000;

function createRandomPuzzle(mode) {
  const solution = generateSolution(HEIGHT, RAND_MIN, RAND_MAX, mode);
  const mask = generateMask(HEIGHT, {
    density: DENSITY,
    ensureRightAnchor: true,
    ensureBottomPair: true,
  });
  return makePuzzle(solution, mask, mode);
}

export default function App() {
  const [mode, setMode] = useState("complex"); // "real" | "complex"
  const [puzzle, setPuzzle] = useState(() => createRandomPuzzle("complex"));
  const [showInstr, setShowInstr] = useState(false);
  const inactivityTimer = useRef(null);
  const lastUserAction = useRef(Date.now());

  const setModeAndReset = (m) => {
    setMode(m);
    setPuzzle(createRandomPuzzle(m));
    lastUserAction.current = Date.now();
  };

  const restart = () => {
    setPuzzle((prev) => {
      const fresh = makePuzzle(prev.solution, getCurrentFixedMask(prev), prev.mode);
      lastUserAction.current = Date.now();
      return fresh;
    });
  };

  const newRandom = () => {
    setPuzzle(createRandomPuzzle(mode));
    lastUserAction.current = Date.now();
  };

  function getCurrentFixedMask(pz) {
    const fixed = [];
    for (let r = 0; r < pz.cells.length; r++) {
      for (let c = 0; c < pz.cells[r].length; c++) {
        if (pz.cells[r][c].fixed) fixed.push([r, c]);
      }
    }
    return fixed;
  }

  const onChangeCell = (r, c, val) => {
    setPuzzle((prev) => {
      const next = {
        ...prev,
        cells: prev.cells.map((row) => row.slice()),
      };
      next.cells[r] = next.cells[r].slice();

      clearBlinking(next.cells);

      next.cells[r][c] = { ...next.cells[r][c], value: String(val).trim() };

      evaluateStatuses(next.cells, next.solution, next.mode);

      lastUserAction.current = Date.now();
      return next;
    });
  };

  const showHint = () => {
    setPuzzle((prev) => {
      const next = { ...prev, cells: prev.cells.map((row) => row.slice()) };
      clearBlinking(next.cells);
      const resolvables = findResolvableCells(next.cells, next.mode);
      if (resolvables.length > 0) {
        const { r, c } = resolvables[0];
        next.cells[r] = next.cells[r].slice();
        next.cells[r][c] = { ...next.cells[r][c], blinking: true };
      }
      return next;
    });
  };

  // Inactividad => pista
  useEffect(() => {
    const tick = () => {
      const idle = Date.now() - lastUserAction.current;
      if (idle >= INACTIVITY_MS) {
        showHint();
        lastUserAction.current = Date.now();
      }
      inactivityTimer.current = setTimeout(tick, 1000);
    };
    inactivityTimer.current = setTimeout(tick, 1000);
    return () => clearTimeout(inactivityTimer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Métricas
  const M = getMath(puzzle.mode);
  const flat = puzzle.cells.flat();
  const total = flat.length;
  const correct = flat.filter((c) => c.status === "correct").length;
  const filled = flat.filter((c) => M.parse(c.value) !== null).length;

  return (
    <div className="app">
      <header className="toolbar">
        <h1>Pirámide de Sumas</h1>
        <div className="toolbar-actions">
          <button
            onClick={() => setModeAndReset("real")}
            title="Usar números reales"
          >
            Reales
          </button>
          <button
            onClick={() => setModeAndReset("complex")}
            title="Usar números complejos (a+bi)"
          >
            Complejos
          </button>
          <button onClick={newRandom}>Nuevo</button>
          <button onClick={restart}>Reiniciar</button>
          <button onClick={showHint}>Pista</button>
          <button onClick={() => setShowInstr(true)}>¿Cómo jugar?</button>
        </div>
      </header>

      <Pyramid puzzle={puzzle} onChangeCell={onChangeCell} />

      <footer className="statusbar">
        <span>Modo: {puzzle.mode === "complex" ? "Complejos (a+bi)" : "Reales"}</span>
        <span>Altura: {puzzle.height}</span>
        <span>Completadas: {filled}/{total}</span>
        <span>Correctas: {correct}/{total}</span> <style className="read-the-docs"></style>
      </footer>
      <InstructionModal open={showInstr} onClose={() => setShowInstr(false)} />
    </div>
  );
}
