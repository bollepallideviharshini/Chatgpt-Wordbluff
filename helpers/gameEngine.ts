export type PlayerSymbol = 'X' | 'O';

export interface Player {
  id: string;
  name: string;
  symbol: PlayerSymbol;
  score: number;
}

export type GameStatus = 'WAITING' | 'PLAYING' | 'WON' | 'DRAW';

export interface RoomState {
  roomCode: string;
  status: GameStatus;
  players: Record<string, Player>;
  board: (PlayerSymbol | null)[]; // 9 cells
  currentTurn: PlayerSymbol;
  winner: PlayerSymbol | null;
  winningCombo: number[] | null;
  roundsPlayed: number;
  lastUpdated: number;
  version: number;
}

export const activeRooms = new Map<string, RoomState>();

const WINNING_COMBOS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
  [0, 4, 8], [2, 4, 6]             // Diagonals
];

export function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function createRoom(playerName: string): { room: RoomState; playerId: string } {
  let roomCode = generateRoomCode();
  while (activeRooms.has(roomCode)) {
    roomCode = generateRoomCode();
  }

  const playerId = 'p_' + Math.random().toString(36).substring(2, 9);
  const room: RoomState = {
    roomCode,
    status: 'WAITING',
    players: {
      [playerId]: {
        id: playerId,
        name: playerName.trim() || 'Player 1',
        symbol: 'X',
        score: 0
      }
    },
    board: Array(9).fill(null),
    currentTurn: 'X',
    winner: null,
    winningCombo: null,
    roundsPlayed: 0,
    lastUpdated: Date.now(),
    version: 1
  };

  activeRooms.set(roomCode, room);
  return { room, playerId };
}

export function joinRoom(roomCode: string, playerName: string, existingPlayerId?: string): { success: boolean; error?: string; playerId?: string; room?: RoomState } {
  const code = roomCode.toUpperCase().trim();
  const room = activeRooms.get(code);

  if (!room) {
    return { success: false, error: 'Room not found. Check the room code!' };
  }

  // Reconnection
  if (existingPlayerId && room.players[existingPlayerId]) {
    return { success: true, playerId: existingPlayerId, room };
  }

  const playerIds = Object.keys(room.players);
  if (playerIds.length >= 2) {
    return { success: false, error: 'Room is already full (2 players max).' };
  }

  const playerId = 'p_' + Math.random().toString(36).substring(2, 9);
  room.players[playerId] = {
    id: playerId,
    name: playerName.trim() || 'Player 2',
    symbol: 'O',
    score: 0
  };

  room.status = 'PLAYING';
  room.lastUpdated = Date.now();
  room.version++;

  return { success: true, playerId, room };
}

export function makeMove(roomCode: string, playerId: string, cellIndex: number): { success: boolean; error?: string; room?: RoomState } {
  const room = activeRooms.get(roomCode.toUpperCase().trim());
  if (!room) return { success: false, error: 'Room not found.' };

  if (room.status !== 'PLAYING') {
    return { success: false, error: 'Game is not currently active.' };
  }

  const player = room.players[playerId];
  if (!player) return { success: false, error: 'Player not recognized in this room.' };

  if (room.currentTurn !== player.symbol) {
    return { success: false, error: "It is not your turn yet!" };
  }

  if (cellIndex < 0 || cellIndex > 8 || room.board[cellIndex] !== null) {
    return { success: false, error: 'Cell is already occupied!' };
  }

  // Place symbol
  room.board[cellIndex] = player.symbol;

  // Check win condition
  let hasWon = false;
  for (const combo of WINNING_COMBOS) {
    const [a, b, c] = combo;
    if (room.board[a] && room.board[a] === room.board[b] && room.board[a] === room.board[c]) {
      hasWon = true;
      room.winner = player.symbol;
      room.winningCombo = combo;
      room.status = 'WON';
      player.score++;
      break;
    }
  }

  // Check draw condition
  if (!hasWon) {
    const isBoardFull = room.board.every((cell) => cell !== null);
    if (isBoardFull) {
      room.status = 'DRAW';
      room.winner = null;
    } else {
      // Toggle turn
      room.currentTurn = room.currentTurn === 'X' ? 'O' : 'X';
    }
  }

  room.lastUpdated = Date.now();
  room.version++;
  return { success: true, room };
}

export function rematch(roomCode: string, playerId: string): { success: boolean; error?: string; room?: RoomState } {
  const room = activeRooms.get(roomCode.toUpperCase().trim());
  if (!room) return { success: false, error: 'Room not found.' };

  const player = room.players[playerId];
  if (!player) return { success: false, error: 'Player not in room.' };

  // Reset board
  room.board = Array(9).fill(null);
  room.winner = null;
  room.winningCombo = null;
  room.roundsPlayed++;
  // Alternate starting player each round
  room.currentTurn = room.roundsPlayed % 2 === 0 ? 'X' : 'O';
  room.status = Object.keys(room.players).length >= 2 ? 'PLAYING' : 'WAITING';

  room.lastUpdated = Date.now();
  room.version++;
  return { success: true, room };
}

export function getSafeRoomState(room: RoomState, playerId?: string) {
  const playersList = Object.values(room.players);
  const me = playerId ? room.players[playerId] : undefined;
  const opponent = playerId ? playersList.find((p) => p.id !== playerId) : undefined;

  return {
    roomCode: room.roomCode,
    status: room.status,
    board: room.board,
    currentTurn: room.currentTurn,
    winner: room.winner,
    winningCombo: room.winningCombo,
    roundsPlayed: room.roundsPlayed,
    players: playersList.map((p) => ({
      name: p.name,
      symbol: p.symbol,
      score: p.score,
      isMe: p.id === playerId
    })),
    mySymbol: me ? me.symbol : null,
    isMyTurn: me ? room.currentTurn === me.symbol && room.status === 'PLAYING' : false,
    opponentConnected: Boolean(opponent),
    version: room.version
  };
}
