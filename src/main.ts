import confetti from 'canvas-confetti';
import { sfx } from './sound.ts';

// Modes: 'SOLO' | 'MULTI'
let gameMode: 'SOLO' | 'MULTI' = 'SOLO';

// Multiplayer state
let roomCode: string | null = null;
let playerId: string | null = null;
let mySymbol: 'X' | 'O' = 'X';
let isMyTurn: boolean = false;
let pollingTimer: number | null = null;
let lastStatus: string | null = null;

// Solo Bot state
let soloBoard: ('X' | 'O' | null)[] = Array(9).fill(null);
let soloTurn: 'X' | 'O' = 'X';
let soloStatus: 'PLAYING' | 'WON' | 'DRAW' = 'PLAYING';
let soloWinner: 'X' | 'O' | null = null;
let soloWinningCombo: number[] | null = null;
let soloScoreUser = 0;
let soloScoreBot = 0;
let userName = 'You';

const WINNING_COMBOS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6]
];

// Elements
const screenLobby = document.getElementById('screenLobby')!;
const screenGame = document.getElementById('screenGame')!;

const tabSolo = document.getElementById('tabSolo')!;
const tabMulti = document.getElementById('tabMulti')!;
const panelSolo = document.getElementById('panelSolo')!;
const panelMulti = document.getElementById('panelMulti')!;

const inputPlayerName = document.getElementById('inputPlayerName') as HTMLInputElement;
const inputRoomCode = document.getElementById('inputRoomCode') as HTMLInputElement;
const btnPlayBot = document.getElementById('btnPlayBot') as HTMLButtonElement;
const btnCreate = document.getElementById('btnCreate') as HTMLButtonElement;
const btnJoin = document.getElementById('btnJoin') as HTMLButtonElement;

const roomPill = document.getElementById('roomPill')!;
const pillRoomCode = document.getElementById('pillRoomCode')!;
const boxWaitingOpponent = document.getElementById('boxWaitingOpponent')!;
const waitingRoomCode = document.getElementById('waitingRoomCode')!;
const btnCopyInvite = document.getElementById('btnCopyInvite')!;
const btnPlayBotInstead = document.getElementById('btnPlayBotInstead')!;

const nameP1 = document.getElementById('nameP1')!;
const ptsP1 = document.getElementById('ptsP1')!;
const nameP2 = document.getElementById('nameP2')!;
const ptsP2 = document.getElementById('ptsP2')!;

const statusBanner = document.getElementById('statusBanner')!;
const statusText = document.getElementById('statusText')!;
const cells = document.querySelectorAll<HTMLButtonElement>('.cell');

const btnRematch = document.getElementById('btnRematch') as HTMLButtonElement;
const btnLeave = document.getElementById('btnLeave') as HTMLButtonElement;
const btnSound = document.getElementById('btnSound')!;
const toast = document.getElementById('toast')!;
const headerLogo = document.getElementById('headerLogo')!;

const API_URL = '/.netlify/functions/game';

function init() {
  setupEvents();
  checkUrlParams();
  checkSavedSession();
}

function showToast(msg: string) {
  toast.textContent = msg;
  toast.classList.remove('hidden');
  setTimeout(() => toast.classList.add('hidden'), 2200);
}

function setupEvents() {
  // Mode tabs
  tabSolo.onclick = () => {
    sfx.playClick();
    tabSolo.classList.add('active');
    tabMulti.classList.remove('active');
    panelSolo.classList.add('active');
    panelMulti.classList.remove('active');
  };

  tabMulti.onclick = () => {
    sfx.playClick();
    tabMulti.classList.add('active');
    tabSolo.classList.remove('active');
    panelMulti.classList.add('active');
    panelSolo.classList.remove('active');
  };

  // Sound toggle
  btnSound.onclick = () => {
    const on = sfx.toggleMute();
    btnSound.textContent = on ? '🔊' : '🔇';
    showToast(on ? 'Sound on' : 'Sound muted');
  };

  // Solo Play button
  btnPlayBot.onclick = startSoloGame;

  // Multiplayer: Create
  btnCreate.onclick = handleCreateGame;
  inputPlayerName.onkeydown = (e) => {
    if (e.key === 'Enter') {
      if (panelSolo.classList.contains('active')) startSoloGame();
      else handleCreateGame();
    }
  };

  // Multiplayer: Join
  btnJoin.onclick = handleJoinGame;
  inputRoomCode.onkeydown = (e) => {
    if (e.key === 'Enter') handleJoinGame();
  };

  // Copy invite
  const copyInvite = () => {
    sfx.playClick();
    if (!roomCode) return;
    const url = `${window.location.origin}${window.location.pathname}?room=${roomCode}`;
    navigator.clipboard.writeText(url).then(() => {
      showToast('Invite link copied! Share with your friend 📋');
    });
  };
  btnCopyInvite.onclick = copyInvite;
  roomPill.onclick = copyInvite;

  // Play bot instead
  btnPlayBotInstead.onclick = () => {
    leaveGame();
    startSoloGame();
  };

  // Board cell clicks
  cells.forEach((cell) => {
    cell.onclick = () => {
      const idx = Number(cell.getAttribute('data-index'));
      handleCellClick(idx);
    };
  });

  // Rematch
  btnRematch.onclick = handleRematch;

  // Leave / Home
  btnLeave.onclick = leaveGame;
  headerLogo.onclick = leaveGame;
}

function checkUrlParams() {
  const params = new URLSearchParams(window.location.search);
  const code = params.get('room');
  if (code) {
    tabMulti.click();
    inputRoomCode.value = code.toUpperCase();
    inputPlayerName.focus();
  }
}

function checkSavedSession() {
  const savedRoom = sessionStorage.getItem('xo_room');
  const savedPlayer = sessionStorage.getItem('xo_player');
  if (savedRoom && savedPlayer) {
    gameMode = 'MULTI';
    roomCode = savedRoom;
    playerId = savedPlayer;
    startPolling();
  }
}

function leaveGame() {
  sfx.playClick();
  if (pollingTimer) clearInterval(pollingTimer);
  sessionStorage.removeItem('xo_room');
  sessionStorage.removeItem('xo_player');
  roomCode = null;
  playerId = null;
  roomPill.classList.add('hidden');
  screenLobby.classList.add('active');
  screenGame.classList.remove('active');
}

// ========================
// 1. SOLO BOT LOGIC (1 PLAYER)
// ========================
function startSoloGame() {
  sfx.playJoin();
  gameMode = 'SOLO';
  userName = inputPlayerName.value.trim() || 'You';
  soloBoard = Array(9).fill(null);
  soloTurn = 'X';
  soloStatus = 'PLAYING';
  soloWinner = null;
  soloWinningCombo = null;

  screenLobby.classList.remove('active');
  screenGame.classList.add('active');
  boxWaitingOpponent.classList.add('hidden');
  roomPill.classList.add('hidden');

  renderSoloUI();
}

function handleSoloCellClick(index: number) {
  if (soloStatus !== 'PLAYING' || soloTurn !== 'X') return;
  if (soloBoard[index] !== null) return;

  sfx.playClick();
  soloBoard[index] = 'X';
  checkSoloGameState();
  renderSoloUI();

  if (soloStatus === 'PLAYING') {
    soloTurn = 'O';
    renderSoloUI();
    // Bot thinks for 350ms
    setTimeout(() => {
      executeBotMove();
    }, 350);
  }
}

function executeBotMove() {
  if (soloStatus !== 'PLAYING' || soloTurn !== 'O') return;

  const bestMove = getBotMove(soloBoard);
  if (bestMove !== -1) {
    sfx.playClick();
    soloBoard[bestMove] = 'O';
    checkSoloGameState();
    if (soloStatus === 'PLAYING') {
      soloTurn = 'X';
    }
  }
  renderSoloUI();
}

// Smart Bot AI: Win -> Block -> Center -> Corners -> Random
function getBotMove(board: ('X' | 'O' | null)[]): number {
  // 1. Can Bot win?
  for (let i = 0; i < 9; i++) {
    if (board[i] === null) {
      board[i] = 'O';
      if (checkWin(board, 'O')) {
        board[i] = null;
        return i;
      }
      board[i] = null;
    }
  }

  // 2. Can User win? Block them!
  for (let i = 0; i < 9; i++) {
    if (board[i] === null) {
      board[i] = 'X';
      if (checkWin(board, 'X')) {
        board[i] = null;
        return i;
      }
      board[i] = null;
    }
  }

  // 3. Take Center
  if (board[4] === null) return 4;

  // 4. Take Corners
  const corners = [0, 2, 6, 8].filter((idx) => board[idx] === null);
  if (corners.length > 0) {
    return corners[Math.floor(Math.random() * corners.length)];
  }

  // 5. Take any empty
  const empty = board.map((val, idx) => (val === null ? idx : null)).filter((v): v is number => v !== null);
  return empty.length > 0 ? empty[Math.floor(Math.random() * empty.length)] : -1;
}

function checkWin(board: ('X' | 'O' | null)[], symbol: 'X' | 'O'): boolean {
  return WINNING_COMBOS.some(([a, b, c]) => board[a] === symbol && board[b] === symbol && board[c] === symbol);
}

function checkSoloGameState() {
  // Check win
  for (const combo of WINNING_COMBOS) {
    const [a, b, c] = combo;
    if (soloBoard[a] && soloBoard[a] === soloBoard[b] && soloBoard[a] === soloBoard[c]) {
      soloStatus = 'WON';
      soloWinner = soloBoard[a];
      soloWinningCombo = combo;
      if (soloWinner === 'X') {
        soloScoreUser++;
        sfx.playFanfare();
        confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
      } else {
        soloScoreBot++;
        sfx.playAlert();
      }
      return;
    }
  }

  // Check draw
  if (soloBoard.every((c) => c !== null)) {
    soloStatus = 'DRAW';
    soloWinner = null;
    sfx.playSubmit();
  }
}

function renderSoloUI() {
  nameP1.textContent = `${userName} (You)`;
  ptsP1.textContent = `${soloScoreUser} win${soloScoreUser === 1 ? '' : 's'}`;

  nameP2.textContent = '🤖 Bot';
  ptsP2.textContent = `${soloScoreBot} win${soloScoreBot === 1 ? '' : 's'}`;

  // Cells
  soloBoard.forEach((val, idx) => {
    const cell = document.getElementById(`cell-${idx}`) as HTMLButtonElement;
    cell.textContent = val || '';
    cell.className = 'cell';
    if (val === 'X') cell.classList.add('filled-x');
    if (val === 'O') cell.classList.add('filled-o');

    if (soloWinningCombo && soloWinningCombo.includes(idx)) {
      cell.classList.add('winning-cell');
    }

    cell.disabled = Boolean(val) || soloStatus !== 'PLAYING' || soloTurn !== 'X';
  });

  // Status Banner
  statusBanner.className = 'status-banner';
  btnRematch.classList.add('hidden');

  if (soloStatus === 'PLAYING') {
    if (soloTurn === 'X') {
      statusBanner.classList.add('is-my-turn');
      statusText.textContent = `🎯 YOUR TURN (X) — Tap an empty square!`;
    } else {
      statusText.textContent = `🤖 Bot is thinking...`;
    }
  } else if (soloStatus === 'WON') {
    btnRematch.classList.remove('hidden');
    if (soloWinner === 'X') {
      statusBanner.classList.add('is-won');
      statusText.textContent = `🎉 VICTORY! You defeated the Bot!`;
    } else {
      statusBanner.classList.add('is-lost');
      statusText.textContent = `💥 Bot won this round! Rematch?`;
    }
  } else if (soloStatus === 'DRAW') {
    btnRematch.classList.remove('hidden');
    statusBanner.classList.add('is-draw');
    statusText.textContent = `🤝 IT'S A TIE! Well played!`;
  }
}

// ========================
// 2. MULTIPLAYER LOGIC (2 PLAYERS)
// ========================
async function handleCreateGame() {
  const name = inputPlayerName.value.trim() || 'Player 1';
  btnCreate.disabled = true;

  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'create_room', playerName: name })
    });
    const data = await res.json();
    if (data.success) {
      sfx.playJoin();
      gameMode = 'MULTI';
      roomCode = data.roomCode;
      playerId = data.playerId;
      sessionStorage.setItem('xo_room', roomCode!);
      sessionStorage.setItem('xo_player', playerId!);
      startPolling();
    } else {
      alert(data.error || 'Failed to create game');
    }
  } catch (err: any) {
    alert('Network error: ' + err.message);
  } finally {
    btnCreate.disabled = false;
  }
}

async function handleJoinGame() {
  const code = inputRoomCode.value.trim().toUpperCase();
  const name = inputPlayerName.value.trim() || 'Player 2';

  if (!code || code.length < 4) {
    alert('Please enter a 4-letter room code.');
    inputRoomCode.focus();
    return;
  }

  btnJoin.disabled = true;

  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'join_room', roomCode: code, playerName: name })
    });
    const data = await res.json();
    if (data.success) {
      sfx.playJoin();
      gameMode = 'MULTI';
      roomCode = data.roomCode;
      playerId = data.playerId;
      sessionStorage.setItem('xo_room', roomCode!);
      sessionStorage.setItem('xo_player', playerId!);
      startPolling();
    } else {
      alert(data.error || 'Failed to join game');
    }
  } catch (err: any) {
    alert('Network error: ' + err.message);
  } finally {
    btnJoin.disabled = false;
  }
}

async function handleMultiCellClick(index: number) {
  if (!isMyTurn) {
    sfx.playAlert();
    showToast("Wait for your opponent's move!");
    return;
  }

  const cell = document.getElementById(`cell-${index}`) as HTMLButtonElement;
  if (cell.textContent) return;

  sfx.playClick();
  cell.textContent = mySymbol;
  cell.classList.add(`filled-${mySymbol.toLowerCase()}`);

  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'make_move',
        roomCode,
        playerId,
        cellIndex: index
      })
    });
    const data = await res.json();
    if (data.success && data.state) {
      updateMultiUI(data.state);
    }
  } catch (err: any) {
    console.error(err);
  }
}

function handleCellClick(index: number) {
  if (gameMode === 'SOLO') {
    handleSoloCellClick(index);
  } else {
    handleMultiCellClick(index);
  }
}

async function handleRematch() {
  sfx.playClick();
  if (gameMode === 'SOLO') {
    soloBoard = Array(9).fill(null);
    soloTurn = 'X';
    soloStatus = 'PLAYING';
    soloWinner = null;
    soloWinningCombo = null;
    renderSoloUI();
    return;
  }

  btnRematch.disabled = true;
  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'rematch', roomCode, playerId })
    });
    const data = await res.json();
    if (data.success && data.state) {
      updateMultiUI(data.state);
    }
  } catch (err: any) {
    alert('Error: ' + err.message);
  } finally {
    btnRematch.disabled = false;
  }
}

function startPolling() {
  if (pollingTimer) clearInterval(pollingTimer);
  fetchState();
  pollingTimer = window.setInterval(fetchState, 700);
}

async function fetchState() {
  if (!roomCode || gameMode !== 'MULTI') return;
  try {
    const res = await fetch(`${API_URL}?action=get_state&roomCode=${roomCode}&playerId=${playerId}`);
    if (res.status === 404) {
      leaveGame();
      alert('Game session ended.');
      return;
    }
    const data = await res.json();
    if (data.success && data.state) {
      updateMultiUI(data.state);
    }
  } catch {
    // transient
  }
}

function updateMultiUI(state: any) {
  screenLobby.classList.remove('active');
  screenGame.classList.add('active');

  roomPill.classList.remove('hidden');
  pillRoomCode.textContent = state.roomCode;
  waitingRoomCode.textContent = state.roomCode;

  mySymbol = state.mySymbol || 'X';
  isMyTurn = state.isMyTurn;

  if (state.status === 'WAITING') {
    boxWaitingOpponent.classList.remove('hidden');
  } else {
    boxWaitingOpponent.classList.add('hidden');
  }

  const p1 = state.players.find((p: any) => p.symbol === 'X') || { name: 'Player 1', score: 0 };
  const p2 = state.players.find((p: any) => p.symbol === 'O');

  nameP1.textContent = `${p1.name} ${mySymbol === 'X' ? '(You)' : ''}`;
  ptsP1.textContent = `${p1.score} win${p1.score === 1 ? '' : 's'}`;

  if (p2) {
    nameP2.textContent = `${p2.name} ${mySymbol === 'O' ? '(You)' : ''}`;
    ptsP2.textContent = `${p2.score} win${p2.score === 1 ? '' : 's'}`;
  } else {
    nameP2.textContent = 'Waiting...';
    ptsP2.textContent = '0 wins';
  }

  state.board.forEach((val: string | null, idx: number) => {
    const cell = document.getElementById(`cell-${idx}`) as HTMLButtonElement;
    cell.textContent = val || '';
    cell.className = 'cell';
    if (val === 'X') cell.classList.add('filled-x');
    if (val === 'O') cell.classList.add('filled-o');

    if (state.winningCombo && state.winningCombo.includes(idx)) {
      cell.classList.add('winning-cell');
    }

    cell.disabled = Boolean(val) || state.status !== 'PLAYING';
  });

  statusBanner.className = 'status-banner';
  btnRematch.classList.add('hidden');

  if (state.status === 'WAITING') {
    statusText.textContent = `⏳ Share room code ${state.roomCode} with a friend to begin!`;
  } else if (state.status === 'PLAYING') {
    if (state.isMyTurn) {
      statusBanner.classList.add('is-my-turn');
      statusText.textContent = `🎯 YOUR TURN (${mySymbol}) — Tap an empty square!`;
    } else {
      const opponent = state.players.find((p: any) => p.symbol !== mySymbol);
      statusText.textContent = `⏳ Waiting for ${opponent ? opponent.name : 'opponent'}'s move...`;
    }
  } else if (state.status === 'WON') {
    btnRematch.classList.remove('hidden');
    if (state.winner === mySymbol) {
      statusBanner.classList.add('is-won');
      statusText.textContent = `🎉 VICTORY! You won the round!`;
      if (lastStatus !== 'WON') {
        sfx.playFanfare();
        confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
      }
    } else {
      statusBanner.classList.add('is-lost');
      const winnerPlayer = state.players.find((p: any) => p.symbol === state.winner);
      statusText.textContent = `💥 ${winnerPlayer ? winnerPlayer.name : 'Opponent'} won this round!`;
      if (lastStatus !== 'WON') {
        sfx.playAlert();
      }
    }
  } else if (state.status === 'DRAW') {
    btnRematch.classList.remove('hidden');
    statusBanner.classList.add('is-draw');
    statusText.textContent = `🤝 IT'S A TIE! Great match!`;
    if (lastStatus !== 'DRAW') {
      sfx.playSubmit();
    }
  }

  lastStatus = state.status;
}

window.addEventListener('DOMContentLoaded', init);
