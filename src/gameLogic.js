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

function getTargetsFromHits(hits, tried) {
  const targets = [];

  if (hits.length === 1) {
    const { row, col } = hits[0];
    targets.push(
      { row: row - 1, col },
      { row: row + 1, col },
      { row, col: col - 1 },
      { row, col: col + 1 }
    );
  } else {
    const rows = hits.map((h) => h.row);
    const cols = hits.map((h) => h.col);
    const sameRow = rows.every((r) => r === rows[0]);
    const sameCol = cols.every((c) => c === cols[0]);

    if (sameRow) {
      const minCol = Math.min(...cols);
      const maxCol = Math.max(...cols);
      targets.push(
        { row: rows[0], col: minCol - 1 },
        { row: rows[0], col: maxCol + 1 }
      );
    } else if (sameCol) {
      const minRow = Math.min(...rows);
      const maxRow = Math.max(...rows);
      targets.push(
        { row: minRow - 1, col: cols[0] },
        { row: maxRow + 1, col: cols[0] }
      );
    } else {
      for (const h of hits) {
        targets.push(
          { row: h.row - 1, col: h.col },
          { row: h.row + 1, col: h.col },
          { row: h.row, col: h.col - 1 },
          { row: h.row, col: h.col + 1 }
        );
      }
    }
  }

  return targets.filter(
    (t) =>
      t.row >= 0 &&
      t.row < BOARD_SIZE &&
      t.col >= 0 &&
      t.col < BOARD_SIZE &&
      !tried.has(`${t.row},${t.col}`)
  );
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
