import React, { useState } from 'react';
import Board from './Board';
import { SHIPS, canPlaceShip, placeShip, placeShipsRandomly, createEmptyBoard, BOARD_SIZE } from '../gameLogic';
import './ShipPlacer.css';

function ShipPlacer({ board, setBoard, onComplete, shipsPlaced, setShipsPlaced }) {
  const [isHorizontal, setIsHorizontal] = useState(true);
  const [hoverCells, setHoverCells] = useState([]);

  const currentShip = SHIPS[shipsPlaced];

  const handleCellClick = (row, col) => {
    if (shipsPlaced >= SHIPS.length) return;
    if (!canPlaceShip(board, row, col, currentShip.size, isHorizontal)) return;

    const newBoard = placeShip(board, row, col, currentShip.size, isHorizontal, shipsPlaced);
    setBoard(newBoard);
    const next = shipsPlaced + 1;
    setShipsPlaced(next);

    if (next >= SHIPS.length) {
      onComplete(newBoard);
    }
  };

  const handleRandomize = () => {
    const { board: newBoard } = placeShipsRandomly(createEmptyBoard());
    setBoard(newBoard);
    setShipsPlaced(SHIPS.length);
    onComplete(newBoard);
  };

  const handleReset = () => {
    setBoard(createEmptyBoard());
    setShipsPlaced(0);
    setHoverCells([]);
  };

  const handleCellHover = (row, col) => {
    if (shipsPlaced >= SHIPS.length) return;
    const cells = [];
    const valid = canPlaceShip(board, row, col, currentShip.size, isHorizontal);
    for (let i = 0; i < currentShip.size; i++) {
      const r = isHorizontal ? row : row + i;
      const c = isHorizontal ? col + i : col;
      if (r < BOARD_SIZE && c < BOARD_SIZE) {
        cells.push({ row: r, col: c, valid });
      }
    }
    setHoverCells(cells);
  };

  const handleMouseLeave = () => {
    setHoverCells([]);
  };

  return (
    <div className="ship-placer">
      <div className="placement-controls">
        <div className="placement-progress">
          {SHIPS.map((_, idx) => (
            <span
              key={idx}
              className={`progress-dot${idx < shipsPlaced ? ' filled' : ''}${idx === shipsPlaced ? ' current' : ''}`}
            />
          ))}
        </div>
        {shipsPlaced < SHIPS.length && (
          <div className="current-ship">
            <p>
              Placing: <strong>{currentShip.name}</strong> (size {currentShip.size})
            </p>
            <button className="orient-btn" onClick={() => setIsHorizontal(!isHorizontal)}>
              {isHorizontal ? 'Horizontal' : 'Vertical'}
            </button>
          </div>
        )}
        <div className="placement-buttons">
          <button className="action-btn" onClick={handleRandomize}>
            Random Placement
          </button>
          <button className="action-btn reset-btn" onClick={handleReset}>
            Reset
          </button>
        </div>
      </div>

      <div className="placement-board" onMouseLeave={handleMouseLeave}>
        <PlacementBoard
          board={board}
          hoverCells={hoverCells}
          onCellClick={handleCellClick}
          onCellHover={handleCellHover}
        />
      </div>

      <div className="ship-list">
        <h3>Fleet</h3>
        {SHIPS.map((ship, idx) => (
          <div key={ship.name} className={`ship-item${idx < shipsPlaced ? ' placed' : ''}${idx === shipsPlaced ? ' active' : ''}`}>
            <span>{ship.name}</span>
            <span className="ship-blocks">
              {Array.from({ length: ship.size }, (_, i) => (
                <span key={i} className="ship-block"></span>
              ))}
            </span>
            {idx < shipsPlaced && <span className="check">&#10003;</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

function PlacementBoard({ board, hoverCells, onCellClick, onCellHover }) {
  const colHeaders = Array.from({ length: BOARD_SIZE }, (_, i) =>
    String.fromCharCode(65 + i)
  );

  const isHovered = (r, c) => hoverCells.find((h) => h.row === r && h.col === c);

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
            {row.map((cell, cIdx) => {
              const hover = isHovered(rIdx, cIdx);
              let cls = 'cell';
              if (cell.state === 'ship') {
                cls += ' ship';
              } else if (hover) {
                cls += hover.valid ? ' hover-valid' : ' hover-invalid';
              } else {
                cls += ' empty';
              }
              return (
                <div
                  key={`${rIdx}-${cIdx}`}
                  className={cls}
                  onClick={() => onCellClick(rIdx, cIdx)}
                  onMouseEnter={() => onCellHover(rIdx, cIdx)}
                />
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

export default ShipPlacer;
