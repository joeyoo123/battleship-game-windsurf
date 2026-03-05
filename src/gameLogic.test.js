import {
  BOARD_SIZE,
  SHIPS,
  CELL_STATE,
  createEmptyBoard,
  canPlaceShip,
  placeShip,
  placeShipsRandomly,
  isShipSunk,
  markSunkShip,
  fireAt,
  allShipsSunk,
  createAI,
  aiTurn,
} from './gameLogic';

// ── Helpers ──

function boardWithShip(row, col, size, isHorizontal, shipIndex = 0) {
  return placeShip(createEmptyBoard(), row, col, size, isHorizontal, shipIndex);
}

function hitAllButOne(board, shipIndex) {
  let skipped = false;
  const newBoard = board.map((r) => r.map((c) => ({ ...c })));
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (newBoard[r][c].shipIndex === shipIndex && newBoard[r][c].state === CELL_STATE.SHIP) {
        if (!skipped) {
          skipped = true;
          continue;
        }
        newBoard[r][c].state = CELL_STATE.HIT;
      }
    }
  }
  return newBoard;
}

// ── canPlaceShip ──

describe('canPlaceShip', () => {
  let board;
  beforeEach(() => { board = createEmptyBoard(); });

  test('allows valid horizontal placement in the middle', () => {
    expect(canPlaceShip(board, 3, 2, 4, true)).toBe(true);
  });

  test('allows valid vertical placement in the middle', () => {
    expect(canPlaceShip(board, 2, 3, 4, false)).toBe(true);
  });

  test('rejects horizontal placement off the right edge', () => {
    expect(canPlaceShip(board, 0, 8, 4, true)).toBe(false);
  });

  test('rejects vertical placement off the bottom edge', () => {
    expect(canPlaceShip(board, 8, 0, 4, false)).toBe(false);
  });

  test('allows placement at the exact right edge', () => {
    expect(canPlaceShip(board, 0, 7, 3, true)).toBe(true);
  });

  test('allows placement at the exact bottom edge', () => {
    expect(canPlaceShip(board, 7, 0, 3, false)).toBe(true);
  });

  test('rejects placement overlapping an existing ship', () => {
    const withShip = boardWithShip(3, 3, 4, true, 0);
    expect(canPlaceShip(withShip, 3, 5, 3, true)).toBe(false);
  });

  test('allows placement adjacent but not overlapping', () => {
    const withShip = boardWithShip(3, 3, 4, true, 0);
    expect(canPlaceShip(withShip, 4, 3, 4, true)).toBe(true);
  });
});

// ── placeShip ──

describe('placeShip', () => {
  test('places ship cells horizontally with correct state and shipIndex', () => {
    const board = boardWithShip(0, 0, 3, true, 2);
    for (let c = 0; c < 3; c++) {
      expect(board[0][c].state).toBe(CELL_STATE.SHIP);
      expect(board[0][c].shipIndex).toBe(2);
    }
    expect(board[0][3].state).toBe(CELL_STATE.EMPTY);
  });

  test('places ship cells vertically', () => {
    const board = boardWithShip(2, 5, 4, false, 1);
    for (let r = 2; r < 6; r++) {
      expect(board[r][5].state).toBe(CELL_STATE.SHIP);
      expect(board[r][5].shipIndex).toBe(1);
    }
    expect(board[6][5].state).toBe(CELL_STATE.EMPTY);
  });

  test('does not mutate the original board', () => {
    const original = createEmptyBoard();
    placeShip(original, 0, 0, 3, true, 0);
    expect(original[0][0].state).toBe(CELL_STATE.EMPTY);
  });
});

// ── placeShipsRandomly ──

describe('placeShipsRandomly', () => {
  test('places all 5 ships without overlap', () => {
    const { board } = placeShipsRandomly(createEmptyBoard());
    const totalShipCells = SHIPS.reduce((sum, s) => sum + s.size, 0);
    let shipCount = 0;
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        if (board[r][c].state === CELL_STATE.SHIP) shipCount++;
      }
    }
    expect(shipCount).toBe(totalShipCells);
  });

  test('each ship index appears the correct number of times', () => {
    const { board } = placeShipsRandomly(createEmptyBoard());
    for (let i = 0; i < SHIPS.length; i++) {
      let count = 0;
      for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
          if (board[r][c].shipIndex === i) count++;
        }
      }
      expect(count).toBe(SHIPS[i].size);
    }
  });
});

// ── fireAt ──

describe('fireAt', () => {
  test('returns miss on empty cell', () => {
    const board = createEmptyBoard();
    const { board: newBoard, result } = fireAt(board, 5, 5);
    expect(result).toBe('miss');
    expect(newBoard[5][5].state).toBe(CELL_STATE.MISS);
  });

  test('returns hit on ship cell without sinking', () => {
    const board = boardWithShip(0, 0, 3, true, 0);
    const { board: newBoard, result } = fireAt(board, 0, 0);
    expect(result).toBe('hit');
    expect(newBoard[0][0].state).toBe(CELL_STATE.HIT);
    expect(newBoard[0][1].state).toBe(CELL_STATE.SHIP);
  });

  test('returns sunk when last cell of ship is hit', () => {
    const board = hitAllButOne(boardWithShip(0, 0, 2, true, 0), 0);
    // One cell is still SHIP — find it and fire at it
    let shipRow, shipCol;
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        if (board[r][c].state === CELL_STATE.SHIP) {
          shipRow = r; shipCol = c;
        }
      }
    }
    const { result, shipName, board: newBoard } = fireAt(board, shipRow, shipCol);
    expect(result).toBe('sunk');
    expect(shipName).toBe(SHIPS[0].name);
    expect(newBoard[shipRow][shipCol].state).toBe(CELL_STATE.SUNK);
  });

  test('returns invalid on already-hit cell', () => {
    const board = boardWithShip(0, 0, 3, true, 0);
    const { board: b1 } = fireAt(board, 0, 0);
    const { result } = fireAt(b1, 0, 0);
    expect(result).toBe('invalid');
  });

  test('returns invalid on already-missed cell', () => {
    const board = createEmptyBoard();
    const { board: b1 } = fireAt(board, 5, 5);
    const { result } = fireAt(b1, 5, 5);
    expect(result).toBe('invalid');
  });

  test('does not mutate the original board', () => {
    const board = boardWithShip(0, 0, 3, true, 0);
    fireAt(board, 0, 0);
    expect(board[0][0].state).toBe(CELL_STATE.SHIP);
  });
});

// ── isShipSunk / markSunkShip ──

describe('isShipSunk', () => {
  test('returns false when ship has unhit cells', () => {
    const board = boardWithShip(0, 0, 3, true, 0);
    expect(isShipSunk(board, 0)).toBe(false);
  });

  test('returns true when all ship cells are hit', () => {
    let board = boardWithShip(0, 0, 2, true, 0);
    board[0][0].state = CELL_STATE.HIT;
    board[0][1].state = CELL_STATE.HIT;
    expect(isShipSunk(board, 0)).toBe(true);
  });
});

describe('markSunkShip', () => {
  test('marks all cells of the ship as SUNK', () => {
    let board = boardWithShip(0, 0, 3, true, 0);
    board[0][0].state = CELL_STATE.HIT;
    board[0][1].state = CELL_STATE.HIT;
    board[0][2].state = CELL_STATE.HIT;
    const marked = markSunkShip(board, 0);
    for (let c = 0; c < 3; c++) {
      expect(marked[0][c].state).toBe(CELL_STATE.SUNK);
    }
  });

  test('does not affect other ships', () => {
    let board = boardWithShip(0, 0, 2, true, 0);
    board = placeShip(board, 2, 0, 3, true, 1);
    const marked = markSunkShip(board, 0);
    expect(marked[2][0].state).toBe(CELL_STATE.SHIP);
  });
});

// ── allShipsSunk ──

describe('allShipsSunk', () => {
  test('returns false when ships remain', () => {
    const board = boardWithShip(0, 0, 2, true, 0);
    expect(allShipsSunk(board)).toBe(false);
  });

  test('returns true on empty board (no ships)', () => {
    expect(allShipsSunk(createEmptyBoard())).toBe(true);
  });

  test('returns true when all ship cells are hit or sunk', () => {
    let board = boardWithShip(0, 0, 2, true, 0);
    board[0][0].state = CELL_STATE.SUNK;
    board[0][1].state = CELL_STATE.SUNK;
    expect(allShipsSunk(board)).toBe(true);
  });
});

// ── AI targeting (regression tests for axis-continuation bug) ──

describe('AI targeting', () => {
  test('after a single hit, AI fires at an adjacent cell', () => {
    const board = boardWithShip(5, 5, 3, true, 0);
    let ai = createAI();
    // Force the first shot to be a hit at (5,5)
    ai.tried = new Set();
    const { board: b1, ai: ai1 } = aiFireAtKnownCell(board, ai, 5, 5);
    expect(ai1.mode).toBe('target');
    expect(ai1.hits).toEqual([{ row: 5, col: 5 }]);

    // Next AI turn should target a neighbor of (5,5)
    const { row, col } = aiTurn(b1, ai1);
    const isAdjacent =
      (Math.abs(row - 5) === 1 && col === 5) ||
      (row === 5 && Math.abs(col - 5) === 1);
    expect(isAdjacent).toBe(true);
  });

  test('with two vertical hits, AI continues along vertical axis', () => {
    // Ship placed vertically at col 3, rows 2-4
    const board = boardWithShip(2, 3, 3, false, 0);
    let ai = createAI();

    // Simulate two vertical hits at (2,3) and (3,3)
    let b = board;
    ({ board: b, ai } = aiFireAtKnownCell(b, ai, 2, 3));
    ({ board: b, ai } = aiFireAtKnownCell(b, ai, 3, 3));

    expect(ai.hits.length).toBe(2);

    // Next shot must be along column 3 (row 1 or row 4)
    const { row, col } = aiTurn(b, ai);
    expect(col).toBe(3);
    expect(row === 1 || row === 4).toBe(true);
  });

  test('with two horizontal hits, AI continues along horizontal axis', () => {
    const board = boardWithShip(7, 4, 4, true, 0);
    let ai = createAI();

    let b = board;
    ({ board: b, ai } = aiFireAtKnownCell(b, ai, 7, 5));
    ({ board: b, ai } = aiFireAtKnownCell(b, ai, 7, 6));

    const { row, col } = aiTurn(b, ai);
    expect(row).toBe(7);
    expect(col === 4 || col === 7).toBe(true);
  });

  test('with three vertical hits, AI extends to the correct endpoints', () => {
    // Carrier at col 2, rows 3-7
    const board = boardWithShip(3, 2, 5, false, 0);
    let ai = createAI();

    let b = board;
    ({ board: b, ai } = aiFireAtKnownCell(b, ai, 4, 2));
    ({ board: b, ai } = aiFireAtKnownCell(b, ai, 5, 2));
    ({ board: b, ai } = aiFireAtKnownCell(b, ai, 6, 2));

    const { row, col } = aiTurn(b, ai);
    expect(col).toBe(2);
    expect(row === 3 || row === 7).toBe(true);
  });

  test('AI reverts to hunt mode after sinking a ship', () => {
    const board = boardWithShip(0, 0, 2, true, 0);
    let ai = createAI();

    let b = board;
    ({ board: b, ai } = aiFireAtKnownCell(b, ai, 0, 0));
    expect(ai.mode).toBe('target');

    // Hit the last cell — should sink
    ({ board: b, ai } = aiFireAtKnownCell(b, ai, 0, 1));
    expect(ai.mode).toBe('hunt');
    expect(ai.hits.length).toBe(0);
  });

  test('AI stays in target mode if unsunk hits remain after sinking one ship', () => {
    let board = boardWithShip(0, 0, 2, true, 0);
    board = placeShip(board, 5, 5, 3, true, 1);
    let ai = createAI();

    let b = board;
    // Hit ship 1 at (5,5)
    ({ board: b, ai } = aiFireAtKnownCell(b, ai, 5, 5));
    // Sink ship 0
    ({ board: b, ai } = aiFireAtKnownCell(b, ai, 0, 0));
    ({ board: b, ai } = aiFireAtKnownCell(b, ai, 0, 1));

    // Ship 0 sunk but hit on ship 1 remains
    expect(ai.mode).toBe('target');
    expect(ai.hits.length).toBe(1);
    expect(ai.hits[0]).toEqual({ row: 5, col: 5 });
  });
});

// Helper: simulate AI firing at a specific known cell (bypasses random selection)
function aiFireAtKnownCell(board, ai, row, col) {
  const newAI = { ...ai, hits: [...ai.hits], tried: new Set(ai.tried) };
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

  return { board: newBoard, ai: newAI };
}
