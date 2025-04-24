const presets = {
  '8x8':   { rows: 8,  cols: 8,  mines: { easy: 10,  medium: 13,  hard: 16  } },
  '10x10': { rows: 10, cols: 10, mines: { easy: 15,  medium: 20,  hard: 25  } },
  '12x12': { rows: 12, cols: 12, mines: { easy: 20,  medium: 30,  hard: 36  } },
  '16x16': { rows: 16, cols: 16, mines: { easy: 40,  medium: 50,  hard: 64  } },
  '16x30': { rows: 16, cols: 30, mines: { easy: 60,  medium: 99,  hard: 120 } }
};

let rows, cols, minesCount;
let board = [];
let mineLocations = [];

function init() {
  // hide overlay
  const overlay = document.getElementById('overlay');
  overlay.classList.add('hidden');
  document.getElementById('overlay-text').textContent = '';

  // load settings
  const size = document.getElementById('grid-size').value;
  const difficulty = document.getElementById('difficulty').value;
  rows = presets[size].rows;
  cols = presets[size].cols;
  minesCount = presets[size].mines[difficulty];

  const boardEl = document.getElementById('board');
  boardEl.innerHTML = '';
  boardEl.style.gridTemplateColumns = `repeat(${cols}, 30px)`;

  board = [];
  mineLocations = [];

  // build grid
  for (let r = 0; r < rows; r++) {
    board[r] = [];
    for (let c = 0; c < cols; c++) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.dataset.row = r;
      cell.dataset.col = c;
      cell.addEventListener('click', revealCell);
      cell.addEventListener('contextmenu', flagCell);
      cell.addEventListener('mousedown', handleChord);
      boardEl.appendChild(cell);
      board[r][c] = { element: cell, hasMine: false, revealed: false, flagged: false, adjacentMines: 0 };
    }
  }

  // place mines
  let placed = 0;
  while (placed < minesCount) {
    const r = Math.floor(Math.random() * rows);
    const c = Math.floor(Math.random() * cols);
    if (!board[r][c].hasMine) {
      board[r][c].hasMine = true;
      mineLocations.push([r, c]);
      placed++;
    }
  }

  // compute adjacent counts
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (board[r][c].hasMine) continue;
      let count = 0;
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const nr = r + dr, nc = c + dc;
          if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && board[nr][nc].hasMine) count++;
        }
      }
      board[r][c].adjacentMines = count;
    }
  }
}

function showOverlay(text) {
  const overlay = document.getElementById('overlay');
  document.getElementById('overlay-text').textContent = text;
  overlay.classList.remove('hidden');
}

function handleChord(e) {
  if (e.buttons === 3) {
    const r = +e.currentTarget.dataset.row;
    const c = +e.currentTarget.dataset.col;
    const cell = board[r][c];
    if (!cell.revealed || cell.adjacentMines === 0) return;
    let flags = 0;
    const neighbors = [];
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const nr = r + dr, nc = c + dc;
        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
          neighbors.push(board[nr][nc]);
          if (board[nr][nc].flagged) flags++;
        }
      }
    }
    if (flags === cell.adjacentMines) {
      neighbors.forEach(n => revealCell({ currentTarget: n.element }));
    }
  }
}

function revealCell(e) {
  const div = e.currentTarget;
  const r = +div.dataset.row;
  const c = +div.dataset.col;
  const cell = board[r][c];
  if (cell.revealed || cell.flagged) return;
  cell.revealed = true;
  div.classList.add('revealed');

  if (cell.hasMine) {
    div.textContent = '💣';
    revealAllMines();
    showOverlay('Game Over');
  } else {
    if (cell.adjacentMines) div.textContent = cell.adjacentMines;
    else for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
        revealCell({ currentTarget: board[nr][nc].element });
      }
    }
    checkWin();
  }
}

function flagCell(e) {
  e.preventDefault();
  const div = e.currentTarget;
  const r = +div.dataset.row;
  const c = +div.dataset.col;
  const cell = board[r][c];
  if (cell.revealed) return;
  cell.flagged = !cell.flagged;
  div.classList.toggle('flagged', cell.flagged);
  div.textContent = cell.flagged ? '🚩' : '';
}

function revealAllMines() {
  mineLocations.forEach(([r, c]) => {
    const cell = board[r][c];
    if (!cell.revealed) {
      cell.element.classList.add('revealed');
      cell.element.textContent = '💣';
    }
  });
}

function checkWin() {
  const count = board.flat().filter(c => c.revealed).length;
  if (count === rows * cols - minesCount) {
    revealAllMines();
    showOverlay('You Win!');
  }
}

document.getElementById('reset').addEventListener('click', init);
window.onload = init;