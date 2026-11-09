import { doc, getDoc, setDoc, getDocs, collection, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { GameState } from '../types';

// Helper to generate clean, memorable 6-character key (e.g., HOP-8921)
export function generateMeetingKey(): string {
  const num = Math.floor(1000 + Math.random() * 9000);
  return `HOP-${num}`;
}

// Format key cleanly (uppercase, trim)
export function cleanKey(key: string): string {
  return key.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
}

/**
 * 1. CLOUD STORAGE PER ACCOUNT:
 * Saves a game to the user's isolated private repository:
 * Path: /user_data/{username}/sessions/{sessionId}
 */
export async function syncSessionToCloud(username: string, game: GameState): Promise<void> {
  const sessionId = game.id || `session-${Date.now()}`;
  const cleanUsername = username.trim().toLowerCase();
  const path = `user_data/${cleanUsername}/sessions/${sessionId}`;

  const payload = {
    id: sessionId,
    ownerUsername: cleanUsername,
    gameName: game.gameName || 'Phiên họp',
    meetingKey: game.meetingKey || '',
    rounds: game.rounds || 0,
    playersCount: game.players?.length || 0,
    gameStateJson: JSON.stringify(game),
    updatedAt: new Date().toISOString(),
  };

  try {
    await setDoc(doc(db, 'user_data', cleanUsername, 'sessions', sessionId), payload);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

/**
 * Sync multiple local sessions to the account's private cloud repository
 */
export async function syncMultipleSessionsToCloud(username: string, games: GameState[]): Promise<number> {
  let count = 0;
  for (const game of games) {
    if (game) {
      await syncSessionToCloud(username, game);
      count++;
    }
  }
  return count;
}

/**
 * Get all sessions stored in the account's private cloud repository
 */
export async function getUserCloudSessions(username: string): Promise<GameState[]> {
  const cleanUsername = username.trim().toLowerCase();
  const path = `user_data/${cleanUsername}/sessions`;

  try {
    const snap = await getDocs(collection(db, 'user_data', cleanUsername, 'sessions'));
    const games: GameState[] = [];
    snap.forEach(d => {
      const data = d.data();
      if (data.gameStateJson) {
        try {
          const parsed = JSON.parse(data.gameStateJson);
          games.push(parsed);
        } catch {
          // ignore corrupted json
        }
      }
    });
    // Sort by latest update or date
    games.sort((a, b) => {
      const timeA = new Date(a.date || 0).getTime();
      const timeB = new Date(b.date || 0).getTime();
      return timeB - timeA;
    });
    return games;
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
    return [];
  }
}

/**
 * Delete a session from account's private cloud repository
 */
export async function deleteUserCloudSession(username: string, sessionId: string): Promise<void> {
  const cleanUsername = username.trim().toLowerCase();
  const path = `user_data/${cleanUsername}/sessions/${sessionId}`;
  try {
    await deleteDoc(doc(db, 'user_data', cleanUsername, 'sessions', sessionId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

/**
 * 2. MEETING TRANSFER KEY:
 * Save or publish a meeting session with its key to /meeting_keys/{key}
 * so any device can load and continue this session!
 */
export async function publishMeetingKey(meetingKey: string, game: GameState, ownerUsername?: string): Promise<string> {
  const key = cleanKey(meetingKey);
  if (!key || key.length < 4) {
    throw new Error('Key cuộc họp phải có ít nhất 4 ký tự.');
  }

  const updatedGame = { ...game, meetingKey: key };
  const path = `meeting_keys/${key}`;
  const payload = {
    meetingKey: key,
    gameName: game.gameName || 'Phiên họp',
    ownerUsername: ownerUsername || 'guest',
    rounds: game.rounds || 0,
    gameStateJson: JSON.stringify(updatedGame),
    updatedAt: new Date().toISOString(),
  };

  try {
    await setDoc(doc(db, 'meeting_keys', key), payload);
    return key;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
    throw err;
  }
}

/**
 * Look up and download a meeting session using its key from any device
 */
export async function loadMeetingByKey(meetingKey: string): Promise<GameState> {
  const key = cleanKey(meetingKey);
  if (!key) {
    throw new Error('Vui lòng nhập mã key cuộc họp.');
  }

  const path = `meeting_keys/${key}`;
  let snap;
  try {
    snap = await getDoc(doc(db, 'meeting_keys', key));
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
    throw err;
  }

  if (!snap || !snap.exists()) {
    throw new Error(`Không tìm thấy cuộc họp nào với mã "${key}". Vui lòng kiểm tra lại.`);
  }

  const data = snap.data();
  if (!data.gameStateJson) {
    throw new Error('Dữ liệu cuộc họp này bị lỗi hoặc không đầy đủ.');
  }

  try {
    const game: GameState = JSON.parse(data.gameStateJson);
    return game;
  } catch {
    throw new Error('Không thể phân tích dữ liệu cuộc họp.');
  }
}
