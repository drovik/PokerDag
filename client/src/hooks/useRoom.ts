import { useEffect, useRef, useState, useCallback } from 'react';
import {
  doc,
  collection,
  onSnapshot,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../firebase';
import type { Participant } from '../types';

const SESSION_KEY = 'pokerdag-session-id';

function getSessionId(): string {
  let id = sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    id = Math.random().toString(36).slice(2, 10);
    sessionStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

export function useRoom(roomId: string) {
  const myId = useRef(getSessionId()).current;
  const participantsRef = useRef<Participant[]>([]);
  const joinedRef = useRef(false);
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
      const ps: Participant[] = snap.docs.map((d) => ({
        id: d.id,
        name: d.data().name as string,
        vote: d.data().vote as string | null,
      }));
      setParticipants(ps);
    });

    const participantDocRef = doc(db, 'rooms', roomId, 'participants', myId);

    const cleanup = () => {
      deleteDoc(participantDocRef).catch(() => {});
    };

    // Re-add ourselves if we were removed while the tab was hidden.
    // Reads name from localStorage so no stale closure needed.
    const rejoin = () => {
      if (!joinedRef.current) return;
      const name = localStorage.getItem('pokerdag-name');
      if (!name) return;
      const missing = !participantsRef.current.some((p) => p.id === myId);
      if (missing) {
        setDoc(participantDocRef, {
          name: name.trim().slice(0, 30),
          vote: null,
          joinedAt: serverTimestamp(),
        }).catch(() => {});
      }
    };

    let hideTimer: ReturnType<typeof setTimeout> | null = null;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // iOS fires "hidden" on any app switch or screen lock — wait 30 s
        // before actually removing so brief interruptions don't kick people.
        hideTimer = setTimeout(cleanup, 30_000);
      } else {
        if (hideTimer !== null) {
          clearTimeout(hideTimer);
          hideTimer = null;
        }
        // Give Firestore ~1.5 s to reconnect and update the participants
        // list, then rejoin if our document was removed.
        setTimeout(rejoin, 1500);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      unsubRoom();
      unsubParticipants();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (hideTimer !== null) clearTimeout(hideTimer);
      cleanup();
    };
  }, [roomId, myId]);

  const join = useCallback(
    async (name: string) => {
      const roomDocRef = doc(db, 'rooms', roomId);
      const participantDocRef = doc(db, 'rooms', roomId, 'participants', myId);
      await setDoc(roomDocRef, { revealed: false }, { merge: true });
      await setDoc(participantDocRef, {
        name: name.trim().slice(0, 30),
        vote: null,
        joinedAt: serverTimestamp(),
      });
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
  };
}
