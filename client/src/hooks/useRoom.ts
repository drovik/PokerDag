import { useEffect, useRef, useState, useCallback } from 'react';
import {
  doc,
  collection,
  onSnapshot,
  setDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  serverTimestamp,
  writeBatch,
  enableNetwork,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import type { Participant } from '../types';

const SESSION_KEY = 'pokerdag-session-id';
const HIDE_TIMEOUT_MS = 120_000;    // 2 min: remove participant if tab stays hidden
const STALE_THRESHOLD_MS = 180_000; // 3 min: filter participants with no heartbeat
const HEARTBEAT_MS = 30_000;        // 30s: keep lastSeen fresh while active

function getSessionId(): string {
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = Math.random().toString(36).slice(2, 10);
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

type RawParticipant = Participant & { lastSeenMs: number | null };

function filterStale(raw: RawParticipant[]): Participant[] {
  const now = Date.now();
  return raw
    .filter((p) => p.lastSeenMs === null || now - p.lastSeenMs < STALE_THRESHOLD_MS)
    .map(({ lastSeenMs: _ls, ...p }) => p);
}

export function useRoom(roomId: string) {
  const myId = useRef(getSessionId()).current;
  const participantsRef = useRef<Participant[]>([]);
  const rawParticipantsRef = useRef<RawParticipant[]>([]);
  const joinedRef = useRef(false);
  const observerRef = useRef(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [revealed, setRevealed] = useState(false);
  const [title, setTitleState] = useState('');
  const [loading, setLoading] = useState(true);
  const [joined, setJoined] = useState(false);

  participantsRef.current = participants;

  useEffect(() => {
    if (!roomId) return;

    const roomDocRef = doc(db, 'rooms', roomId);
    const participantsColRef = collection(db, 'rooms', roomId, 'participants');
    const participantDocRef = doc(db, 'rooms', roomId, 'participants', myId);

    const unsubRoom = onSnapshot(roomDocRef, (snap) => {
      if (snap.exists()) {
        setRevealed(snap.data().revealed ?? false);
        setTitleState(snap.data().title ?? '');
      } else {
        setRevealed(false);
        setTitleState('');
      }
      setLoading(false);
    });

    const unsubParticipants = onSnapshot(participantsColRef, (snap) => {
      const raw: RawParticipant[] = snap.docs.map((d) => {
        const ls = d.data().lastSeen as Timestamp | null;
        return {
          id: d.id,
          name: d.data().name as string,
          vote: d.data().vote as string | null,
          observer: d.data().observer as boolean | undefined,
          lastSeenMs: ls?.toMillis() ?? null,
        };
      });
      rawParticipantsRef.current = raw;
      setParticipants(filterStale(raw));
    });

    // Re-filter every minute so stale participants disappear even without a new snapshot
    const refilterInterval = setInterval(() => {
      setParticipants(filterStale(rawParticipantsRef.current));
    }, 60_000);

    // Heartbeat: keep lastSeen fresh while the tab is visible and joined
    const heartbeatInterval = setInterval(() => {
      if (!joinedRef.current || document.visibilityState !== 'visible') return;
      updateDoc(participantDocRef, { lastSeen: serverTimestamp() }).catch(() => {});
    }, HEARTBEAT_MS);

    const cleanup = () => {
      deleteDoc(participantDocRef).catch(() => {});
    };

    const rejoin = () => {
      if (!joinedRef.current) return;
      const name = localStorage.getItem('pokerdag-name');
      if (!name) return;
      const missing = !participantsRef.current.some((p) => p.id === myId);
      if (missing) {
        setDoc(participantDocRef, {
          name: name.trim().slice(0, 30),
          vote: null,
          observer: observerRef.current,
          joinedAt: serverTimestamp(),
          lastSeen: serverTimestamp(),
        }).catch(() => {});
      }
    };

    let hideTimer: ReturnType<typeof setTimeout> | null = null;

    // Force-read the latest room state — bypasses a stale WebSocket listener
    // (Safari/WebKit silently drops the Firestore connection after idle periods)
    const syncRoomState = () => {
      enableNetwork(db).catch(() => {});
      getDoc(roomDocRef).then((snap) => {
        if (snap.exists()) {
          setRevealed(snap.data().revealed ?? false);
          setTitleState(snap.data().title ?? '');
        }
      }).catch(() => {});
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        hideTimer = setTimeout(cleanup, HIDE_TIMEOUT_MS);
      } else {
        if (hideTimer !== null) {
          clearTimeout(hideTimer);
          hideTimer = null;
        }
        syncRoomState();
        setTimeout(rejoin, 1500);
        if (joinedRef.current) {
          updateDoc(participantDocRef, { lastSeen: serverTimestamp() }).catch(() => {});
        }
      }
    };

    const handleOnline = () => syncRoomState();
    const handleFocus = () => {
      syncRoomState();
      if (joinedRef.current) {
        updateDoc(participantDocRef, { lastSeen: serverTimestamp() }).catch(() => {});
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('online', handleOnline);
    window.addEventListener('focus', handleFocus);

    return () => {
      unsubRoom();
      unsubParticipants();
      clearInterval(refilterInterval);
      clearInterval(heartbeatInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('focus', handleFocus);
      if (hideTimer !== null) clearTimeout(hideTimer);
      cleanup();
    };
  }, [roomId, myId]);

  const join = useCallback(
    async (name: string, observer = false) => {
      const roomDocRef = doc(db, 'rooms', roomId);
      const participantDocRef = doc(db, 'rooms', roomId, 'participants', myId);
      await setDoc(roomDocRef, { revealed: false }, { merge: true });
      await setDoc(participantDocRef, {
        name: name.trim().slice(0, 30),
        vote: null,
        observer,
        joinedAt: serverTimestamp(),
        lastSeen: serverTimestamp(),
      });
      observerRef.current = observer;
      joinedRef.current = true;
      setJoined(true);
    },
    [roomId, myId],
  );

  const vote = useCallback(
    async (value: string) => {
      const myParticipant = participantsRef.current.find((p) => p.id === myId);
      const currentVote = myParticipant?.vote ?? null;
      const newVote = currentVote === value ? null : value;
      const participantDocRef = doc(db, 'rooms', roomId, 'participants', myId);
      await updateDoc(participantDocRef, { vote: newVote });
    },
    [roomId, myId],
  );

  const reveal = useCallback(async () => {
    await updateDoc(doc(db, 'rooms', roomId), { revealed: true });
  }, [roomId]);

  const newRound = useCallback(async () => {
    const batch = writeBatch(db);
    batch.update(doc(db, 'rooms', roomId), { revealed: false });
    participantsRef.current.forEach((p) => {
      batch.update(doc(db, 'rooms', roomId, 'participants', p.id), { vote: null });
    });
    await batch.commit();
  }, [roomId]);

  const changeName = useCallback(
    async (name: string) => {
      await updateDoc(doc(db, 'rooms', roomId, 'participants', myId), {
        name: name.trim().slice(0, 30),
      });
    },
    [roomId, myId],
  );

  const setTitle = useCallback(
    async (newTitle: string) => {
      await updateDoc(doc(db, 'rooms', roomId), { title: newTitle.slice(0, 60) });
    },
    [roomId],
  );

  const setObserver = useCallback(
    async (observer: boolean) => {
      observerRef.current = observer;
      await updateDoc(doc(db, 'rooms', roomId, 'participants', myId), {
        observer,
        ...(observer ? { vote: null } : {}),
      });
    },
    [roomId, myId],
  );

  return {
    myId,
    participants,
    revealed,
    title,
    loading,
    joined,
    join,
    vote,
    reveal,
    newRound,
    changeName,
    setTitle,
    setObserver,
  };
}
