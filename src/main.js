const POINTS = [[0,0],[3,0],[6,0],[1,1],[3,1],[5,1],[2,2],[3,2],[4,2],[0,3],[1,3],[2,3],[4,3],[5,3],[6,3],[2,4],[3,4],[4,4],[1,5],[3,5],[5,5],[0,6],[3,6],[6,6]];
const EDGES = [[0,1],[1,2],[3,4],[4,5],[6,7],[7,8],[9,10],[10,11],[12,13],[13,14],[15,16],[16,17],[18,19],[19,20],[21,22],[22,23],[0,9],[9,21],[3,10],[10,18],[6,11],[11,15],[1,4],[4,7],[16,19],[19,22],[8,12],[12,17],[5,13],[13,20],[2,14],[14,23]];
const MILLS = [[0,1,2],[3,4,5],[6,7,8],[9,10,11],[12,13,14],[15,16,17],[18,19,20],[21,22,23],[0,9,21],[3,10,18],[6,11,15],[1,4,7],[16,19,22],[8,12,17],[5,13,20],[2,14,23]];
const PLAYERS = { white: { name: 'Spieler 1', short: 'S1' }, black: { name: 'Spieler 2', short: 'S2' } };
const state = { board: Array(24).fill(null), turn: 'white', placed: { white: 0, black: 0 }, selected: null, removeMode: false, winner: null, message: 'Spieler 1 setzt den ersten Stein.', millMemory: { white: [], black: [] } };
const root = document.getElementById('root');
const other = (player) => player === 'white' ? 'black' : 'white';
const countStones = (player, board = state.board) => board.filter((value) => value === player).length;
const isMill = (board, player, point) => MILLS.some((mill) => mill.includes(point) && mill.every((idx) => board[idx] === player));
const getPlayerMills = (board, player) => MILLS.filter((mill) => mill.every((idx) => board[idx] === player)).map((mill) => mill.join('-'));

function hasLegalMove(board, player) {
  if (state.placed[player] < 9) return true;
  if (countStones(player, board) <= 3) return board.some((value) => !value);
  return board.some((value, idx) => value === player && EDGES.some(([a, b]) => (a === idx && !board[b]) || (b === idx && !board[a])));
}

function possibleMoves() {
  if (state.selected === null || state.removeMode) return [];
  if (countStones(state.turn) <= 3 && state.placed[state.turn] >= 9) return state.board.map((v, i) => !v ? i : null).filter((v) => v !== null);
  return EDGES.flatMap(([a, b]) => a === state.selected && !state.board[b] ? [b] : b === state.selected && !state.board[a] ? [a] : []);
}

function reset() {
  Object.assign(state, { board: Array(24).fill(null), turn: 'white', placed: { white: 0, black: 0 }, selected: null, removeMode: false, winner: null, message: 'Spieler 1 setzt den ersten Stein.', millMemory: { white: [], black: [] } });
  render();
}

function finishTurn(nextBoard, player, extraMessage = '') {
  const next = other(player);
  if (state.placed[next] >= 9 && countStones(next, nextBoard) < 3) {
    state.winner = player;
    state.message = `${PLAYERS[player].name} gewinnt! ${PLAYERS[next].name} hat weniger als drei Steine.`;
  } else if (!hasLegalMove(nextBoard, next)) {
    state.winner = player;
    state.message = `${PLAYERS[player].name} gewinnt! ${PLAYERS[next].name} kann nicht mehr ziehen.`;
  } else {
    state.turn = next;
    state.selected = null;
    state.message = extraMessage || `${PLAYERS[next].name} ist am Zug.`;
  }
}

function maybeMill(nextBoard, point, player) {
  const mills = getPlayerMills(nextBoard, player);
  const newMill = mills.some((mill) => !state.millMemory[player].includes(mill));
  state.millMemory[player] = mills;
  if (newMill && isMill(nextBoard, player, point)) {
    state.removeMode = true;
    state.message = `${PLAYERS[player].name} hat eine Mühle! Entferne einen gegnerischen Stein.`;
    return true;
  }
  return false;
}

function removeStone(idx) {
  const opponent = other(state.turn);
  if (state.board[idx] !== opponent) return;
  const opponentStones = state.board.map((value, i) => value === opponent ? i : null).filter((v) => v !== null);
  const removable = opponentStones.filter((point) => !isMill(state.board, opponent, point));
  if (removable.length && !removable.includes(idx)) {
    state.message = 'Steine in einer geschlossenen Mühle dürfen nur entfernt werden, wenn keine anderen verfügbar sind.';
    render();
    return;
  }
  const nextBoard = state.board.slice();
  nextBoard[idx] = null;
  state.board = nextBoard;
  state.removeMode = false;
  finishTurn(nextBoard, state.turn, 'Stein entfernt. Weiter geht es!');
  render();
}

function handlePoint(idx) {
  if (state.winner) return;
  if (state.removeMode) return removeStone(idx);
  if (state.placed[state.turn] < 9) {
    if (state.board[idx]) state.message = 'Dieses Feld ist bereits belegt.';
    else {
      const nextBoard = state.board.slice();
      nextBoard[idx] = state.turn;
      state.board = nextBoard;
      state.placed[state.turn] += 1;
      if (!maybeMill(nextBoard, idx, state.turn)) finishTurn(nextBoard, state.turn, `${PLAYERS[other(state.turn)].name} darf setzen.`);
    }
    render();
    return;
  }
  const moves = possibleMoves();
  if (state.board[idx] === state.turn) {
    state.selected = idx;
    state.message = `${PLAYERS[state.turn].name}: Wähle ein freies Zielfeld${countStones(state.turn) <= 3 ? ' zum Springen' : ''}.`;
  } else if (state.selected === null) state.message = 'Wähle zuerst einen eigenen Stein aus.';
  else if (!moves.includes(idx)) state.message = 'Dieser Zug ist nicht erlaubt.';
  else {
    const nextBoard = state.board.slice();
    nextBoard[state.selected] = null;
    nextBoard[idx] = state.turn;
    state.board = nextBoard;
    if (!maybeMill(nextBoard, idx, state.turn)) finishTurn(nextBoard, state.turn);
  }
  render();
}

function render() {
  const phase = state.placed.white < 9 || state.placed.black < 9 ? 'Setzphase' : 'Zugphase';
  const moves = possibleMoves();
  root.innerHTML = `<main class="shell"><section class="hero"><div><p class="eyebrow">Nine Men's Morris</p><h1>Mühle</h1><p>Eine moderne lokale 2-Spieler-Nachbildung mit Setzen, Ziehen, Springen, Mühlen und Entfernen.</p></div><button id="reset">Neues Spiel</button></section><section class="game-card"><div class="status"><div><span>Phase</span><strong>${phase}</strong></div><div><span>Am Zug</span><strong>${state.winner ? `${PLAYERS[state.winner].name} gewinnt` : PLAYERS[state.turn].name}</strong></div><div><span>Hinweis</span><strong>${state.message}</strong></div></div><div class="board-wrap"><svg viewBox="-8 -8 116 116" class="board-lines" aria-hidden="true">${[[0,0,100,0],[0,0,0,100],[100,0,100,100],[0,100,100,100],[16.67,16.67,83.33,16.67],[16.67,16.67,16.67,83.33],[83.33,16.67,83.33,83.33],[16.67,83.33,83.33,83.33],[33.33,33.33,66.67,33.33],[33.33,33.33,33.33,66.67],[66.67,33.33,66.67,66.67],[33.33,66.67,66.67,66.67],[50,0,50,33.33],[50,66.67,50,100],[0,50,33.33,50],[66.67,50,100,50]].map((line) => `<line x1="${line[0]}" y1="${line[1]}" x2="${line[2]}" y2="${line[3]}" />`).join('')}</svg>${POINTS.map(([x, y], idx) => `<button class="${['point', state.board[idx] || '', state.selected === idx ? 'selected' : '', moves.includes(idx) ? 'move' : '', state.removeMode && state.board[idx] === other(state.turn) ? 'danger' : ''].filter(Boolean).join(' ')}" style="left:${(x / 6) * 100}%;top:${(y / 6) * 100}%" data-point="${idx}" aria-label="Feld ${idx + 1}">${state.board[idx] ? PLAYERS[state.board[idx]].short : ''}</button>`).join('')}</div><aside class="players">${Object.entries(PLAYERS).map(([key, player]) => `<div class="player ${state.turn === key && !state.winner ? 'active' : ''}"><span class="chip ${key}"></span><h2>${player.name}</h2><p>Gesetzt: ${state.placed[key]} / 9 · Auf dem Brett: ${countStones(key)}</p></div>`).join('')}</aside></section></main>`;
  document.getElementById('reset').addEventListener('click', reset);
  document.querySelectorAll('[data-point]').forEach((button) => button.addEventListener('click', () => handlePoint(Number(button.dataset.point))));
}

render();
