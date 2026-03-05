import React, { useState, useCallback } from 'react';
import Board from './components/Board';
import ShipPlacer from './components/ShipPlacer';
import {
  createEmptyBoard,
  placeShipsRandomly,
  fireAt,
  allShipsSunk,
  createAI,
  aiTurn,
  SHIPS,
  CELL_STATE,
} from './gameLogic';
import './App.css';

const PHASE = {
  PLACEMENT: 'placement',
  BATTLE: 'battle',
  GAME_OVER: 'game_over',
};

function App() {
  const [phase, setPhase] = useState(PHASE.PLACEMENT);
  const [playerBoard, setPlayerBoard] = useState(createEmptyBoard());
  const [enemyBoard, setEnemyBoard] = useState(null);
  const [ai, setAI] = useState(createAI());
  const [message, setMessage] = useState('Place your ships on the board.');
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [playerShipsPlaced, setPlayerShipsPlaced] = useState(0);
  const [playerSunk, setPlayerSunk] = useState([]);
  const [enemySunk, setEnemySunk] = useState([]);

  const handlePlacementComplete = useCallback((board) => {
    setPlayerBoard(board);
    const { board: aBoard } = placeShipsRandomly(createEmptyBoard());
    setEnemyBoard(aBoard);
    setPhase(PHASE.BATTLE);
    setMessage('Your turn! Click on the enemy board to fire.');
  }, []);

  const handlePlayerFire = useCallback(
    (row, col) => {
      if (!isPlayerTurn || phase !== PHASE.BATTLE) return;

      const cell = enemyBoard[row][col];
      if (
        cell.state === CELL_STATE.HIT ||
        cell.state === CELL_STATE.MISS ||
        cell.state === CELL_STATE.SUNK
      ) {
        setMessage("You've already fired there. Pick another cell.");
        return;
      }

      const { board: newEnemyBoard, result, shipName } = fireAt(enemyBoard, row, col);
      setEnemyBoard(newEnemyBoard);

      if (result === 'hit') {
        setMessage('Hit! Nice shot!');
      } else if (result === 'sunk') {
        setMessage(`You sunk the enemy's ${shipName}!`);
        setEnemySunk((prev) => [...prev, shipName]);
      } else {
        setMessage('Miss!');
      }

      if (allShipsSunk(newEnemyBoard)) {
        setPhase(PHASE.GAME_OVER);
        setMessage('🎉 You win! All enemy ships are sunk!');
        return;
      }

      setIsPlayerTurn(false);

      setTimeout(() => {
        const { board: newPlayerBoard, ai: newAI, result: aiResult, row: ar, col: ac, shipName: aiShipName } = aiTurn(playerBoard, ai);
        setPlayerBoard(newPlayerBoard);
        setAI(newAI);

        let aiMsg;
        if (aiResult === 'hit') {
          aiMsg = `Enemy fires at ${String.fromCharCode(65 + ac)}${ar + 1} — Hit!`;
        } else if (aiResult === 'sunk') {
          aiMsg = `Enemy fires at ${String.fromCharCode(65 + ac)}${ar + 1} — Sunk your ${aiShipName}!`;
          setPlayerSunk((prev) => [...prev, aiShipName]);
        } else {
          aiMsg = `Enemy fires at ${String.fromCharCode(65 + ac)}${ar + 1} — Miss!`;
        }

        if (allShipsSunk(newPlayerBoard)) {
          setPhase(PHASE.GAME_OVER);
          setMessage('💀 You lose! All your ships are sunk!');
          return;
        }

        setMessage(aiMsg + ' Your turn!');
        setIsPlayerTurn(true);
      }, 800);
    },
    [isPlayerTurn, phase, enemyBoard, playerBoard, ai]
  );

  const handleRestart = () => {
    setPhase(PHASE.PLACEMENT);
    setPlayerBoard(createEmptyBoard());
    setEnemyBoard(null);
    setAI(createAI());
    setMessage('Place your ships on the board.');
    setIsPlayerTurn(true);
    setPlayerShipsPlaced(0);
    setPlayerSunk([]);
    setEnemySunk([]);
  };

  return (
    <div className="app">
      <h1 className="title">⚓ Battleship</h1>
      <div className="message-bar">
        <p>{message}</p>
      </div>

      {phase === PHASE.PLACEMENT && (
        <ShipPlacer
          board={playerBoard}
          setBoard={setPlayerBoard}
          onComplete={handlePlacementComplete}
          shipsPlaced={playerShipsPlaced}
          setShipsPlaced={setPlayerShipsPlaced}
        />
      )}

      {(phase === PHASE.BATTLE || phase === PHASE.GAME_OVER) && (
        <div className="battle-area">
          <div className="board-section">
            <h2>Your Fleet</h2>
            <Board
              board={playerBoard}
              isOwn={true}
              onCellClick={() => {}}
              disabled={true}
            />
            <div className="sunk-list">
              {playerSunk.length > 0 && (
                <p>Lost: {playerSunk.join(', ')}</p>
              )}
            </div>
          </div>
          <div className="board-section">
            <h2>Enemy Waters</h2>
            <Board
              board={enemyBoard}
              isOwn={false}
              onCellClick={handlePlayerFire}
              disabled={!isPlayerTurn || phase === PHASE.GAME_OVER}
            />
            <div className="sunk-list">
              {enemySunk.length > 0 && (
                <p>Sunk: {enemySunk.join(', ')}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {(phase === PHASE.BATTLE || phase === PHASE.GAME_OVER) && (
        <button className="restart-btn" onClick={handleRestart}>
          {phase === PHASE.GAME_OVER ? 'Play Again' : '🔄 Reset Game'}
        </button>
      )}
    </div>
  );
}

export default App;
