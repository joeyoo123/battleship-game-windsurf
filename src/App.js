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

function getMessageClass(message, phase) {
  if (phase === 'game_over') {
    if (message.includes('Victory')) return 'win-message';
    if (message.includes('Defeat')) return 'lose-message';
  }
  if (message.includes('sunk') || message.includes('Sunk')) return 'sunk-message';
  if (message.includes('Hit')) return 'hit-message';
  if (message.includes('Miss')) return 'miss-message';
  return '';
}

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
  const [playerShots, setPlayerShots] = useState(0);
  const [aiShots, setAiShots] = useState(0);
  const [winner, setWinner] = useState(null);

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
      setPlayerShots((prev) => prev + 1);

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
        setMessage('Victory! All enemy ships are sunk!');
        setWinner('player');
        return;
      }

      setIsPlayerTurn(false);

      setTimeout(() => {
        const { board: newPlayerBoard, ai: newAI, result: aiResult, row: ar, col: ac, shipName: aiShipName } = aiTurn(playerBoard, ai);
        setPlayerBoard(newPlayerBoard);
        setAI(newAI);
        setAiShots((prev) => prev + 1);

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
          setMessage('Defeat! All your ships are sunk!');
          setWinner('ai');
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
    setPlayerShots(0);
    setAiShots(0);
    setWinner(null);
  };

  return (
    <div className="app">
      <h1 className="title">Battleship</h1>
      <div className="subtitle">Naval Warfare</div>
      <div className={`message-bar ${getMessageClass(message, phase)}`}>
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
        <>
          {phase === PHASE.BATTLE && (
            <div className={`turn-indicator ${isPlayerTurn ? 'your-turn' : 'enemy-turn'}`}>
              <span className="turn-dot"></span>
              {isPlayerTurn ? 'Your Turn' : 'Enemy Turn'}
            </div>
          )}

          <div className="game-stats">
            <div className="stat-card">
              <div className="stat-value">{playerShots}</div>
              <div className="stat-label">Your Shots</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{enemySunk.length}/{SHIPS.length}</div>
              <div className="stat-label">Enemy Sunk</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{playerSunk.length}/{SHIPS.length}</div>
              <div className="stat-label">Your Lost</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{aiShots}</div>
              <div className="stat-label">Enemy Shots</div>
            </div>
          </div>

          <div className="battle-area">
            <div className="board-section">
              <h2>Your Fleet</h2>
              <Board
                board={playerBoard}
                isOwn={true}
                onCellClick={() => {}}
                disabled={true}
              />
            </div>
            <div className="board-section">
              <h2>Enemy Waters</h2>
              <Board
                board={enemyBoard}
                isOwn={false}
                onCellClick={handlePlayerFire}
                disabled={!isPlayerTurn || phase === PHASE.GAME_OVER}
              />
            </div>
          </div>

          <div className="fleet-status">
            <div className="fleet-panel">
              <h3>Your Fleet</h3>
              {SHIPS.map((ship) => (
                <div key={ship.name} className={`fleet-ship ${playerSunk.includes(ship.name) ? 'sunk' : 'alive'}`}>
                  <span>{ship.name}</span>
                  <div className="fleet-ship-dots">
                    {Array.from({ length: ship.size }, (_, i) => (
                      <span key={i} className="fleet-ship-dot"></span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="fleet-panel">
              <h3>Enemy Fleet</h3>
              {SHIPS.map((ship) => (
                <div key={ship.name} className={`fleet-ship ${enemySunk.includes(ship.name) ? 'sunk' : 'alive'}`}>
                  <span>{ship.name}</span>
                  <div className="fleet-ship-dots">
                    {Array.from({ length: ship.size }, (_, i) => (
                      <span key={i} className="fleet-ship-dot"></span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {phase === PHASE.GAME_OVER && (
            <div className="game-over-overlay">
              <div className={`game-over-text ${winner === 'player' ? 'win' : 'lose'}`}>
                {winner === 'player' ? 'VICTORY' : 'DEFEAT'}
              </div>
            </div>
          )}

          <button
            className={`restart-btn ${phase === PHASE.GAME_OVER ? 'play-again' : ''}`}
            onClick={handleRestart}
          >
            {phase === PHASE.GAME_OVER ? 'Play Again' : 'Reset Game'}
          </button>
        </>
      )}
    </div>
  );
}

export default App;
