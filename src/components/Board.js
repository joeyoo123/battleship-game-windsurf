import React from 'react';
import { BOARD_SIZE, CELL_STATE } from '../gameLogic';
import './Board.css';

function Board({ board, isOwn, onCellClick, disabled }) {
  const colHeaders = Array.from({ length: BOARD_SIZE }, (_, i) =>
    String.fromCharCode(65 + i)
  );

  const getCellClass = (cell) => {
    if (cell.state === CELL_STATE.HIT) return 'cell hit';
    if (cell.state === CELL_STATE.MISS) return 'cell miss';
    if (cell.state === CELL_STATE.SUNK) return 'cell sunk';
    if (cell.state === CELL_STATE.SHIP && isOwn) return 'cell ship';
    return 'cell empty';
  };

  const getCellContent = (cell) => {
    if (cell.state === CELL_STATE.HIT) return '🔥';
    if (cell.state === CELL_STATE.MISS) return '•';
    if (cell.state === CELL_STATE.SUNK) return '💀';
    return '';
  };

  return (
    <div className="board-container">
      <div className="board-grid">
        <div className="header-cell corner"></div>
        {colHeaders.map((letter) => (
          <div key={letter} className="header-cell">
            {letter}
          </div>
        ))}

        {board.map((row, rIdx) => (
          <React.Fragment key={rIdx}>
            <div className="header-cell">{rIdx + 1}</div>
            {row.map((cell, cIdx) => (
              <div
                key={`${rIdx}-${cIdx}`}
                className={`${getCellClass(cell)}${disabled ? ' disabled' : ''}`}
                onClick={() => !disabled && onCellClick(rIdx, cIdx)}
              >
                {getCellContent(cell)}
              </div>
            ))}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

export default Board;
