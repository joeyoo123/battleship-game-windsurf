export const BOARD_SIZE = 10;

export const SHIPS = [
  { name: 'Carrier', size: 5 },
  { name: 'Battleship', size: 4 },
  { name: 'Cruiser', size: 3 },
  { name: 'Submarine', size: 3 },
  { name: 'Destroyer', size: 2 },
];

export const CELL_STATE = {
  EMPTY: 'empty',
  SHIP: 'ship',
  HIT: 'hit',
  MISS: 'miss',
  SUNK: 'sunk',
};

export function createEmptyBoard() {
  return Array.from({ length: BOARD_SIZE }, () =>
    Array.from({ length: BOARD_SIZE }, () => ({
      state: CELL_STATE.EMPTY,
      shipIndex: null,
    }))
  );
}

export function canPlaceShip(board, row, col, size, isHorizontal) {
  for (let i = 0; i < size; i++) {
    const r = isHorizontal ? row : row + i;
    const c = isHorizontal ? col + i : col;
    if (r < 0 || r >= BOARD_SIZE || c < 0 || c >= BOARD_SIZE) return false;
    if (board[r][c].state === CELL_STATE.SHIP) return false;
  }
  return true;
}

export function placeShip(board, row, col, size, isHorizontal, shipIndex) {
  const newBoard = board.map((r) => r.map((c) => ({ ...c })));
  for (let i = 0; i < size; i++) {
    const r = isHorizontal ? row : row + i;
    const c = isHorizontal ? col + i : col;
    newBoard[r][c] = { state: CELL_STATE.SHIP, shipIndex };
  }
  return newBoard;
}

export function placeShipsRandomly(board) {
  let newBoard = board.map((r) => r.map((c) => ({ ...c })));
  const placements = [];

  for (let i = 0; i < SHIPS.length; i++) {
    let placed = false;
    while (!placed) {
      const isHorizontal = Math.random() < 0.5;
      const row = Math.floor(Math.random() * BOARD_SIZE);
      const col = Math.floor(Math.random() * BOARD_SIZE);
      if (canPlaceShip(newBoard, row, col, SHIPS[i].size, isHorizontal)) {
        newBoard = placeShip(newBoard, row, col, SHIPS[i].size, isHorizontal, i);
        placements.push({ row, col, isHorizontal, size: SHIPS[i].size });
        placed = true;
      }
    }
  }

  return { board: newBoard, placements };
}

export function isShipSunk(board, shipIndex) {
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const cell = board[r][c];
      if (cell.shipIndex === shipIndex && cell.state === CELL_STATE.SHIP) {
        return false;
      }
    }
  }
  return true;
}

export function markSunkShip(board, shipIndex) {
  const newBoard = board.map((r) => r.map((c) => ({ ...c })));
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (newBoard[r][c].shipIndex === shipIndex) {
        newBoard[r][c].state = CELL_STATE.SUNK;
      }
    }
  }
  return newBoard;
}

export function fireAt(board, row, col) {
  const newBoard = board.map((r) => r.map((c) => ({ ...c })));
  const cell = newBoard[row][col];

  if (cell.state === CELL_STATE.HIT || cell.state === CELL_STATE.MISS || cell.state === CELL_STATE.SUNK) {
    return { board: newBoard, result: 'invalid' };
  }

  if (cell.state === CELL_STATE.SHIP) {
    newBoard[row][col] = { ...cell, state: CELL_STATE.HIT };
    const shipIndex = cell.shipIndex;

    if (isShipSunk(newBoard, shipIndex)) {
      const sunkBoard = markSunkShip(newBoard, shipIndex);
      return { board: sunkBoard, result: 'sunk', shipName: SHIPS[shipIndex].name };
    }
    return { board: newBoard, result: 'hit' };
  }

  newBoard[row][col] = { ...cell, state: CELL_STATE.MISS };
  return { board: newBoard, result: 'miss' };
}

export function allShipsSunk(board) {
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (board[r][c].state === CELL_STATE.SHIP) return false;
    }
  }
  return true;
}

// AI Logic
export function createAI() {
  return {
    mode: 'hunt',
    hits: [],
    tried: new Set(),
  };
}

function findLines(hits) {
  const hitSet = new Set(hits.map((h) => `${h.row},${h.col}`));
  const visited = new Set();
  const lines = [];

  for (const h of hits) {
    const key = `${h.row},${h.col}`;

    // horizontal line through this hit
    if (!visited.has(`h:${h.row},${h.col}`)) {
      const line = [h];
      let c = h.col - 1;
      while (c >= 0 && hitSet.has(`${h.row},${c}`)) {
        line.unshift({ row: h.row, col: c });
        c--;
      }
      c = h.col + 1;
      while (c < BOARD_SIZE && hitSet.has(`${h.row},${c}`)) {
        line.push({ row: h.row, col: c });
        c++;
      }
      if (line.length >= 2) {
        for (const cell of line) visited.add(`h:${cell.row},${cell.col}`);
        lines.push({ dir: 'h', cells: line });
      }
    }

    // vertical line through this hit
    if (!visited.has(`v:${h.row},${h.col}`)) {
      const line = [h];
      let r = h.row - 1;
      while (r >= 0 && hitSet.has(`${r},${h.col}`)) {
        line.unshift({ row: r, col: h.col });
        r--;
      }
      r = h.row + 1;
      while (r < BOARD_SIZE && hitSet.has(`${r},${h.col}`)) {
        line.push({ row: r, col: h.col });
        r++;
      }
      if (line.length >= 2) {
        for (const cell of line) visited.add(`v:${cell.row},${cell.col}`);
        lines.push({ dir: 'v', cells: line });
      }
    }
  }

  const inLine = new Set();
  for (const l of lines) {
    for (const cell of l.cells) inLine.add(`${cell.row},${cell.col}`);
  }
  const isolated = hits.filter((h) => !inLine.has(`${h.row},${h.col}`));

  return { lines, isolated };
}

function getTargetsFromHits(hits, tried) {
  const isValid = (t) =>
    t.row >= 0 &&
    t.row < BOARD_SIZE &&
    t.col >= 0 &&
    t.col < BOARD_SIZE &&
    !tried.has(`${t.row},${t.col}`);

  if (hits.length === 1) {
    const { row, col } = hits[0];
    return [
      { row: row - 1, col },
      { row: row + 1, col },
      { row, col: col - 1 },
      { row, col: col + 1 },
    ].filter(isValid);
  }

  const { lines, isolated } = findLines(hits);

  // When overlapping lines exist (sharing cells), prioritize the line
  // whose hits were discovered earliest (lowest max hit-index).
  let activeLines = lines;
  if (lines.length > 1) {
    const hitIndexMap = new Map();
    hits.forEach((h, i) => hitIndexMap.set(`${h.row},${h.col}`, i));

    // Check if any lines share cells
    const cellToLineCount = new Map();
    for (const line of lines) {
      for (const cell of line.cells) {
        const key = `${cell.row},${cell.col}`;
        cellToLineCount.set(key, (cellToLineCount.get(key) || 0) + 1);
      }
    }
    const hasOverlap = [...cellToLineCount.values()].some((count) => count > 1);

    if (hasOverlap) {
      // Score each line by the max hit-index of its cells (lower = discovered earlier)
      const scored = lines.map((line) => {
        const maxIdx = Math.max(
          ...line.cells.map((c) => hitIndexMap.get(`${c.row},${c.col}`))
        );
        return { line, score: maxIdx };
      });
      const minScore = Math.min(...scored.map((s) => s.score));
      activeLines = scored.filter((s) => s.score === minScore).map((s) => s.line);
    }
  }

  // High priority: extend detected lines at their endpoints
  const priority = [];
  for (const line of activeLines) {
    const first = line.cells[0];
    const last = line.cells[line.cells.length - 1];
    if (line.dir === 'h') {
      priority.push({ row: first.row, col: first.col - 1 });
      priority.push({ row: last.row, col: last.col + 1 });
    } else {
      priority.push({ row: first.row - 1, col: first.col });
      priority.push({ row: last.row + 1, col: last.col });
    }
  }

  const filtered = priority.filter(isValid);
  if (filtered.length > 0) return filtered;

  // Low priority: all neighbors of isolated hits
  const fallback = [];
  for (const h of isolated) {
    fallback.push(
      { row: h.row - 1, col: h.col },
      { row: h.row + 1, col: h.col },
      { row: h.row, col: h.col - 1 },
      { row: h.row, col: h.col + 1 }
    );
  }

  return fallback.filter(isValid);
}

export function aiTurn(board, ai) {
  const newAI = { ...ai, hits: [...ai.hits], tried: new Set(ai.tried) };
  let row, col;

  if (newAI.mode === 'target' && newAI.hits.length > 0) {
    const candidates = getTargetsFromHits(newAI.hits, newAI.tried);
    if (candidates.length > 0) {
      const pick = candidates[Math.floor(Math.random() * candidates.length)];
      row = pick.row;
      col = pick.col;
    } else {
      newAI.mode = 'hunt';
    }
  }

  if (newAI.mode === 'hunt' || row === undefined) {
    do {
      row = Math.floor(Math.random() * BOARD_SIZE);
      col = Math.floor(Math.random() * BOARD_SIZE);
    } while (newAI.tried.has(`${row},${col}`));
    newAI.mode = 'hunt';
  }

  newAI.tried.add(`${row},${col}`);
  const { board: newBoard, result, shipName } = fireAt(board, row, col);

  if (result === 'hit') {
    newAI.mode = 'target';
    newAI.hits.push({ row, col });
  } else if (result === 'sunk') {
    newAI.hits = newAI.hits.filter(
      (h) => newBoard[h.row][h.col].state !== CELL_STATE.SUNK
    );
    if (newAI.hits.length === 0) {
      newAI.mode = 'hunt';
    }
  }

  return { board: newBoard, ai: newAI, result, row, col, shipName };
}
