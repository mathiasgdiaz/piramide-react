// Generador de puzzles (reales o complejos) con máscara.
// Mantiene ancla en la diagonal derecha y asegura un par adyacente en la base.

import {
  buildSolutionFromBottom,
  createPuzzleFromSolution,
  evaluateStatuses,
  getMath,
} from "./pyramidLogic";

// Entero aleatorio en [min, max]
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Fila inferior aleatoria (reales)
function randomBaseRowReal(n, min, max) {
  return Array.from({ length: n }, () => randomInt(min, max));
}

// Fila inferior aleatoria (complejos: partes positivas)
function randomBaseRowComplex(n, min, max) {
  return Array.from({ length: n }, () => ({
    a: randomInt(min, max),
    b: randomInt(min, max),
  }));
}

// Solución completa
export function generateSolution(height, min, max, mode = "real") {
  const baseRow =
    mode === "complex"
      ? randomBaseRowComplex(height, min, max)
      : randomBaseRowReal(height, min, max);

  return buildSolutionFromBottom(baseRow, mode);
}

// Máscara de celdas fijas
export function generateMask(
  height,
  {
    density = 0.28,
    ensureRightAnchor = true,
    ensureBottomPair = true,
  } = {}
) {
  const totalCells = (height * (height + 1)) / 2;
  const target = Math.max(3, Math.round(totalCells * density));

  const key = (r, c) => `${r},${c}`;
  const fromKey = (k) => k.split(",").map((x) => parseInt(x, 10));
  const fixed = new Set();

  if (ensureRightAnchor) {
    fixed.add(key(height - 1, height - 1));
  }

  for (let r = 1; r < height; r++) {
    const c = randomInt(0, r - 1);
    fixed.add(key(r, c));
  }

  while (fixed.size < target) {
    const r = randomInt(0, height - 1);
    const c = randomInt(0, r);
    fixed.add(key(r, c));
  }

  return Array.from(fixed).map(fromKey);
}

// Construye puzzle y evalúa estados iniciales
export function makePuzzle(solution, mask, mode = "real") {
  const puzzle = createPuzzleFromSolution(solution, mask, mode);
  evaluateStatuses(puzzle.cells, puzzle.solution, mode);
  return puzzle;
}
