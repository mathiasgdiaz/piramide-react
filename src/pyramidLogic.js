// Lógica de pirámide con soporte de Reales y Complejos.
// Formatos aceptados (complejos): "a+bi", "a-bi", "2i", "-i", "a", con espacios opcionales.

function parseNumberOrEmpty(v) {
  if (v === "" || v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

// ---- Complejos ----
function parseComplexOrEmpty(input) {
  if (input == null) return null;
  const s0 = String(input).trim().toLowerCase().replace(/\s+/g, "");
  if (s0 === "") return null;

  // Caso solo real sin 'i'
  if (!s0.includes("i")) {
    const a = Number(s0);
    return Number.isFinite(a) ? { a, b: 0 } : null;
  }

  // Debe terminar en 'i'
  if (!/i$/.test(s0)) return null;

  // Quitar la 'i' final y analizar lo que resta
  const core = s0.slice(0, -1);
  if (core === "" || core === "+" || core === "-") {
    // "i", "+i", "-i"
    const b = core === "-" ? -1 : 1;
    return { a: 0, b };
  }

  // Buscar último '+' o '-' (no en posición 0) para separar real e imaginario
  let idx = -1;
  for (let i = core.length - 1; i > 0; i--) {
    const ch = core[i];
    if (ch === "+" || ch === "-") {
      idx = i;
      break;
    }
  }

  if (idx === -1) {
    // Solo imaginaria: "2", "-3", etc. (recordar que ya quitamos 'i')
    const b = Number(core);
    return Number.isFinite(b) ? { a: 0, b } : null;
  }

  const realStr = core.slice(0, idx);
  const imagStr = core.slice(idx); // incluye el signo
  const a = Number(realStr);
  const b = Number(imagStr);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  return { a, b };
}

function formatComplex(z) {
  if (!z) return "";
  const { a, b } = z;
  const aPart = a !== 0 ? String(a) : "";

  let bPart = "";
  if (b !== 0) {
    if (b === 1) bPart = (a !== 0 ? "+" : "") + "i";
    else if (b === -1) bPart = (a !== 0 ? "-" : "") + "i";
    else bPart = (b > 0 && a !== 0 ? "+" : "") + String(b) + "i";
  }

  if (aPart === "" && bPart === "") return "0";
  return aPart + bPart;
}

function addComplex(x, y) {
  return { a: x.a + y.a, b: x.b + y.b };
}
function subComplex(x, y) {
  return { a: x.a - y.a, b: x.b - y.b };
}
function eqComplex(x, y) {
  return x && y && x.a === y.a && x.b === y.b;
}

// ---- Adapters por modo ----
const MathReal = {
  parse: parseNumberOrEmpty,
  add: (x, y) => x + y,
  sub: (x, y) => x - y,
  equals: (x, y) => x === y,
  format: (x) => String(x),
};

const MathComplex = {
  parse: parseComplexOrEmpty,
  add: addComplex,
  sub: subComplex,
  equals: eqComplex,
  format: formatComplex,
};

export function getMath(mode) {
  return mode === "complex" ? MathComplex : MathReal;
}

// ---- Construcción de solución completa desde la base ----
export function buildSolutionFromBottom(baseRow, mode = "real") {
  const M = getMath(mode);
  const n = baseRow.length;
  const sol = Array.from({ length: n }, () => []);
  sol[n - 1] = baseRow.slice();

  for (let r = n - 2; r >= 0; r--) {
    for (let c = 0; c <= r; c++) {
      sol[r][c] = M.add(sol[r + 1][c], sol[r + 1][c + 1]);
    }
  }
  return sol;
}

// ---- Creación de puzzle a partir de solución + máscara ----
export function createPuzzleFromSolution(solution, fixedPositions = [], mode = "real") {
  const height = solution.length;
  const M = getMath(mode);
  const isFixed = (r, c) =>
    fixedPositions.some(([rr, cc]) => rr === r && cc === c);

  const cells = solution.map((row, r) =>
    row.map((val, c) => {
      const fixed = isFixed(r, c);
      return {
        row: r,
        col: c,
        value: fixed ? M.format(val) : "",
        fixed,
        status: fixed ? "correct" : "empty",
        blinking: false,
      };
    })
  );

  return { height, cells, solution, mode };
}

// ---- Evaluación de estados contra la solución ----
export function evaluateStatuses(cells, solution, mode = "real") {
  const M = getMath(mode);
  for (let r = 0; r < cells.length; r++) {
    for (let c = 0; c < cells[r].length; c++) {
      const cell = cells[r][c];
      const raw = cell.value;
      
      if (cell.fixed) {
      // Los nodos fijos SIEMPRE son correctos. No se evalúan.
        cell.status = "correct";
        continue;
      }

      if (raw === "" || raw == null) {
        cell.status = "empty";
        continue;
      }

      const parsed = M.parse(raw);
      if (parsed === null) {
        cell.status = "incorrect";
        continue;
      }

      // Comparación matemática, no textual
      cell.status = M.equals(parsed, solution[r][c]) ? "correct" : "incorrect";
      }
  }
}

// ---- Hallar celdas resolubles (reglas locales) ----
export function findResolvableCells(cells, mode = "real") {
  const M = getMath(mode);
  const height = cells.length;

  const isFilled = (r, c) => M.parse(cells[r][c].value) !== null;

  const resolvables = [];
  for (let r = 0; r < height; r++) {
    for (let c = 0; c <= r; c++) {
      const curEmpty = M.parse(cells[r][c].value) === null;

      // Regla A: ambos hijos llenos -> padre resoluble
      if (curEmpty && r < height - 1) {
        if (isFilled(r + 1, c) && isFilled(r + 1, c + 1)) {
          resolvables.push({ r, c, reason: "A_padre_por_suma" });
          continue;
        }
      }

      // Regla B/C: padre + 1 hijo -> el otro hijo resoluble
      if (r < height - 1) {
        const parentFilled = isFilled(r, c);
        const leftFilled = isFilled(r + 1, c);
        const rightFilled = isFilled(r + 1, c + 1);

        if (!leftFilled && parentFilled && rightFilled) {
          resolvables.push({ r: r + 1, c, reason: "B_hijo_izq_por_resta" });
        }
        if (!rightFilled && parentFilled && leftFilled) {
          resolvables.push({ r: r + 1, c: c + 1, reason: "C_hijo_der_por_resta" });
        }
      }
    }
  }

  resolvables.sort((a, b) => a.r - b.r || a.c - b.c);
  return resolvables;
}

export function clearBlinking(cells) {
  for (let r = 0; r < cells.length; r++) {
    for (let c = 0; c < cells[r].length; c++) {
      cells[r][c].blinking = false;
    }
  }
}

// Lógica pura de pirámide (reales). Mantiene espacio para escalar a complejos.
/*
export function buildSolutionFromBottom(baseRow) {
  const n = baseRow.length;
  const sol = Array.from({ length: n }, () => []);
  sol[n - 1] = baseRow.slice();

  for (let r = n - 2; r >= 0; r--) {
    for (let c = 0; c <= r; c++) {
      sol[r][c] = sol[r + 1][c] + sol[r + 1][c + 1];
    }
  }
  return sol;
}

export function createPuzzleFromSolution(solution, fixedPositions = []) {
  const height = solution.length;
  const isFixed = (r, c) =>
    fixedPositions.some(([rr, cc]) => rr === r && cc === c);

  const cells = solution.map((row, r) =>
    row.map((val, c) => ({
      row: r,
      col: c,
      value: isFixed(r, c) ? String(val) : "",
      fixed: isFixed(r, c),
      status: isFixed(r, c) ? "correct" : "empty",
      blinking: false,
    }))
  );
  return { height, cells, solution, mode: "real" };
}

export function parseNumberOrEmpty(v) {
  if (v === "" || v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export function evaluateStatuses(cells, solution) {
  // Marca cada celda como empty | correct | incorrect en base a solution
  for (let r = 0; r < cells.length; r++) {
    for (let c = 0; c < cells[r].length; c++) {
      const cell = cells[r][c];
      if (cell.value === "" || cell.value === null) {
        cell.status = cell.fixed ? "correct" : "empty";
        continue;
      }
      const n = parseNumberOrEmpty(cell.value);
      if (n === null) {
        cell.status = "incorrect";
      } else {
        cell.status = n === solution[r][c] ? "correct" : "incorrect";
      }
    }
  }
}

// Encuentra celdas vacías que hoy pueden deducirse
// Regla A: ambos hijos conocidos -> padre resoluble
// Regla B: padre y un hijo conocido -> el otro hijo resoluble
export function findResolvableCells(cells) {
  const resolvables = [];
  const height = cells.length;

  const isFilled = (r, c) => parseNumberOrEmpty(cells[r][c].value) !== null;

  for (let r = 0; r < height; r++) {
    for (let c = 0; c <= r; c++) {
      const cur = cells[r][c];
      const empty = !isFilled(r, c);

      // Regla A: si no es última fila y ambos hijos llenos, este padre es resoluble
      if (empty && r < height - 1) {
        const leftChild = cells[r + 1][c];
        const rightChild = cells[r + 1][c + 1];
        if (isFilled(r + 1, c) && isFilled(r + 1, c + 1)) {
          resolvables.push({ r, c, reason: "A_padre_por_suma" });
          continue;
        }
      }

      // Regla B/C: si tengo padre y un hijo, el otro hijo es resoluble
      // hijo izquierdo (r+1, c)
      if (r < height - 1) {
        const parent = cells[r][c];
        const left = cells[r + 1][c];
        const right = cells[r + 1][c + 1];

        const parentFilled = isFilled(r, c);
        const leftFilled = isFilled(r + 1, c);
        const rightFilled = isFilled(r + 1, c + 1);

        if (!leftFilled && parentFilled && rightFilled) {
          resolvables.push({ r: r + 1, c, reason: "B_hijo_izq_por_resta" });
        }
        if (!rightFilled && parentFilled && leftFilled) {
          resolvables.push({ r: r + 1, c: c + 1, reason: "C_hijo_der_por_resta" });
        }
      }
    }
  }

  // Heurística: priorizar más cerca de la cima; romper empates por columna
  resolvables.sort((a, b) => a.r - b.r || a.c - b.c);
  return resolvables;
}

export function clearBlinking(cells) {
  for (let r = 0; r < cells.length; r++) {
    for (let c = 0; c < cells[r].length; c++) {
      cells[r][c].blinking = false;
    }
  }
}
*/