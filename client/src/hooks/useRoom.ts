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
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [revealed, setRevealed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [joined, setJoined] = useState(false);

  // Keep ref in sync for use inside stable callbacks
  participantsRef.current = participants;

  useEffect(() => {
    if (!roomId) return;

    const roomDocRef = doc(db, 'rooms', roomId);
    const participantsColRef = collection(db, 'rooms', roomId, 'participants');

    const unsubRoom = onSnapshot(roomDocRef, (snap) => {
      setRevealed(snap.exists() ? (snap.data().revealed ?? false) : false);
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

    // Remove participant when tab is hidden (covers most close/switch cases)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') cleanup();
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      unsubRoom();
      unsubParticipants();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      cleanup();
    };
  }, [roomId, myId]);

  const join = useCallback(
    async (name: string) => {
      const roomDocRef = doc(db, 'rooms', roomId);
      const participantDocRef = doc(db, 'rooms', roomId, 'participants', myId);

      // Create room if it doesn't exist yet
      await setDoc(roomDocRef, { revealed: false }, { merge: true });

      await setDoc(participantDocRef, {
        name: name.trim().slice(0, 30),
        vote: null,
        joinedAt: serverTimestamp(),
      });

      setJoined(true);
    },
    [roomId, myId],
  );

  const vote = useCallback(
    async (value: string) => {
      const myParticipant = participantsRef.current.find((p) => p.id === myId);
      const currentVote = myParticipant?.vote ?? null;
      // Toggle: clicking the same card again deselects it
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

  return { myId, participants, revealed, loading, joined, join, vote, reveal, newRound, changeName };
}
