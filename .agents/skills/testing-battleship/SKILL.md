# Testing Battleship Game

## Overview
This is a client-side React SPA (no backend). All game logic runs in the browser. No authentication or secrets are needed.

## Dev Server
- Start: `npm start` (runs on port 3000 by default)
- Tests: `npx react-scripts test --watchAll=false` (33 unit tests)
- No lint command configured; rely on CI checks

## Game Phases
The game has 3 phases controlled by state in `src/App.js`:
1. **Placement** (`placement`): Player places 5 ships on a 10x10 grid
2. **Battle** (`battle`): Player and AI take turns firing
3. **Game Over** (`game_over`): Win/lose screen with Play Again button

## How to Test Each Phase

### Placement Phase
- App starts in this phase automatically at `http://localhost:3000`
- Click cells on the board to place ships manually
- Use "Random Placement" button to auto-place all remaining ships
- Use "Horizontal" button to toggle ship orientation
- Use "Reset" to clear all placements
- Progress dots at top show which ship is being placed (1-5)
- Fleet list on bottom shows placed ships with checkmarks

### Battle Phase
- Automatically entered after all 5 ships are placed
- Click cells on the right board ("Enemy Waters") to fire
- After each player shot, AI fires automatically (brief delay)
- Turn indicator shows "Your Turn" (green) or "Enemy Turn" (red)
- Stats panel shows: Your Shots, Enemy Sunk, Your Lost, Enemy Shots
- Fleet status panels at bottom show ship health for both sides
- Message bar changes color: hit (orange), miss (default), sunk (purple/red)

### Game Over Phase
- Reached when all ships on one side are sunk
- Shows "VICTORY" or "DEFEAT" overlay with gradient text
- "Play Again" button resets to placement phase
- Note: Reaching game over requires many turns; consider it lower priority for testing

## Key UI Elements to Verify
- Title: "BATTLESHIP" in Orbitron font with gradient text
- Subtitle: "NAVAL WARFARE" in letter-spaced style
- Message bar: Glassmorphism container, changes color based on game events
- Board containers: Glassmorphism with subtle borders
- Hit cells: Orange gradient with ✖ symbol
- Miss cells: Subtle dot (•)
- Sunk cells: Dark red glow with ✖ symbol (same symbol as hit, different color)
- Ship cells on player board: Gray blocks

## Tips
- "Random Placement" button may trigger a timeout click error due to the immediate phase transition; the click still works and transitions to battle
- The AI takes its turn automatically after a short delay; wait ~2 seconds between clicks
- To test the sunk state, find a ship by getting consecutive hits in a line, then extend until all cells are hit
- The game over screen is hard to reach quickly; focus testing on placement and battle phases
- Vercel preview deployments are generated for PRs and can be used instead of local dev server

## Devin Secrets Needed
None - this is a fully client-side app with no authentication.
