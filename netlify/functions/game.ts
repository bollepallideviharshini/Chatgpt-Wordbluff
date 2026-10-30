import { getStore } from '@netlify/blobs';
import {
  activeRooms,
  createRoom,
  joinRoom,
  makeMove,
  rematch,
  getSafeRoomState,
  RoomState
} from '../../helpers/gameEngine.ts';

function getBlobStore() {
  try {
    return getStore({
      name: 'tictactoe-rooms',
      consistency: 'strong'
    });
  } catch {
    return null;
  }
}

async function loadRoom(roomCode: string): Promise<RoomState | null> {
  const code = roomCode.toUpperCase().trim();
  const store = getBlobStore();
  if (store) {
    try {
      const data = await store.get(code, { type: 'json' });
      if (data) {
        activeRooms.set(code, data as RoomState);
        return data as RoomState;
      }
    } catch {
      // fallback to memory map
    }
  }
  return activeRooms.get(code) || null;
}

async function saveRoom(room: RoomState): Promise<void> {
  activeRooms.set(room.roomCode, room);
  const store = getBlobStore();
  if (store) {
    try {
      await store.setJSON(room.roomCode, room);
    } catch {
      // fallback
    }
  }
}

export default async function handler(request: Request): Promise<Response> {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }

  const url = new URL(request.url);
  let action = url.searchParams.get('action');
  let roomCode = url.searchParams.get('roomCode') || '';
  let playerId = url.searchParams.get('playerId') || '';

  let body: any = {};
  if (request.method === 'POST') {
    try {
      body = await request.json();
      action = body.action || action;
      roomCode = body.roomCode || roomCode;
      playerId = body.playerId || playerId;
    } catch {
      body = {};
    }
  }

  try {
    // 1. CREATE ROOM
    if (action === 'create_room') {
      const playerName = body.playerName || 'Player 1';
      const { room, playerId: newPlayerId } = createRoom(playerName);
      await saveRoom(room);
      return new Response(
        JSON.stringify({
          success: true,
          playerId: newPlayerId,
          roomCode: room.roomCode,
          state: getSafeRoomState(room, newPlayerId)
        }),
        { status: 200, headers }
      );
    }

    // 2. JOIN ROOM
    if (action === 'join_room') {
      const playerName = body.playerName || 'Player 2';
      if (!roomCode) {
        return new Response(JSON.stringify({ success: false, error: 'Room code required.' }), { status: 400, headers });
      }

      await loadRoom(roomCode);
      const res = joinRoom(roomCode, playerName, body.existingPlayerId);
      if (!res.success || !res.room) {
        return new Response(JSON.stringify({ success: false, error: res.error }), { status: 400, headers });
      }

      await saveRoom(res.room);
      return new Response(
        JSON.stringify({
          success: true,
          playerId: res.playerId,
          roomCode: res.room.roomCode,
          state: getSafeRoomState(res.room, res.playerId)
        }),
        { status: 200, headers }
      );
    }

    // Operations requiring existing room
    if (!roomCode) {
      return new Response(JSON.stringify({ success: false, error: 'Missing room code.' }), { status: 400, headers });
    }

    const room = await loadRoom(roomCode);
    if (!room) {
      return new Response(JSON.stringify({ success: false, error: 'Room not found.' }), { status: 404, headers });
    }

    // 3. GET STATE (Polling)
    if (action === 'get_state') {
      return new Response(
        JSON.stringify({
          success: true,
          state: getSafeRoomState(room, playerId)
        }),
        { status: 200, headers }
      );
    }

    // 4. MAKE MOVE
    if (action === 'make_move') {
      const cellIndex = Number(body.cellIndex);
      const res = makeMove(roomCode, playerId, cellIndex);
      if (!res.success || !res.room) {
        return new Response(JSON.stringify({ success: false, error: res.error }), { status: 400, headers });
      }
      await saveRoom(res.room);
      return new Response(
        JSON.stringify({
          success: true,
          state: getSafeRoomState(res.room, playerId)
        }),
        { status: 200, headers }
      );
    }

    // 5. REMATCH
    if (action === 'rematch') {
      const res = rematch(roomCode, playerId);
      if (!res.success || !res.room) {
        return new Response(JSON.stringify({ success: false, error: res.error }), { status: 400, headers });
      }
      await saveRoom(res.room);
      return new Response(
        JSON.stringify({
          success: true,
          state: getSafeRoomState(res.room, playerId)
        }),
        { status: 200, headers }
      );
    }

    return new Response(JSON.stringify({ success: false, error: 'Unknown action' }), { status: 400, headers });
  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, error: err.message || 'Server error' }),
      { status: 500, headers }
    );
  }
}
