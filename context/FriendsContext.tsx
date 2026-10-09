// context/FriendsContext.tsx
import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebaseconfig"; // <-- adjust path if needed
import { useAuth } from "./AuthContext";

export type FriendCandidate = {
  id: string;
  displayName: string;
  // summary each user shares once they connect Spotify (see StatsContext)
  topArtist?: string;
  topArtistImage?: string;
  minutesThisWeek?: number;
};

export type Friend = FriendCandidate;

// Friend request structure
export type FriendRequest = {
  id: string;       // request id
  fromId: string;   // who sent it
  targetId: string; // who receives it
};

// Define the shape of the FriendsContext
type FriendsContextType = {
  friends: Friend[];
  requests: FriendRequest[];
  candidates: FriendCandidate[];
  sendRequest: (fromId: string, toId: string) => void;
  acceptRequest: (requestId: string) => void;
  declineRequest: (requestId: string) => void;
};

const FriendsContext = createContext<FriendsContextType | undefined>(
  undefined
);

export function FriendsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const myId = user?.uid ?? "";

  const [friends, setFriends] = useState<Friend[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [candidates, setCandidates] = useState<FriendCandidate[]>([]);

  // loads real users from the database into the friends section so they can be added
  useEffect(() => {
    async function loadUsers() {
      if (!myId) {
        setCandidates([]);
        return;
      }

      try {
        const snap = await getDocs(collection(db, "users"));
        const list: FriendCandidate[] = [];

        snap.forEach((doc) => {
          // this removes the user searching from the search list
          if (doc.id === myId) return;
        
          const data = doc.data() as any;
          list.push({
            id: doc.id,
            displayName:
              (data.displayName as string) ??
              (data.email as string) ??
              "Unknown user",
            topArtist: data.spotify?.topArtist ?? undefined,
            topArtistImage: data.spotify?.topArtistImage ?? undefined,
            minutesThisWeek: data.spotify?.minutesThisWeek ?? undefined,
          });
        });

        setCandidates(list);
      } catch (err) {
        console.log("FriendsProvider load users error", err);
      }
    }

    loadUsers();
  }, [myId]);

// send a friend request
  function sendRequest(fromId: string, toId: string) {
    if (!fromId || !toId || fromId === toId) return;

    // avoid duplicates
    const exists = requests.some(
      (r) => r.fromId === fromId && r.targetId === toId
    );
    if (exists) return;

    const id = `${fromId}->${toId}`;
    const req: FriendRequest = { id, fromId, targetId: toId };
    setRequests((prev) => [...prev, req]);
  }
// accept a friend request
  function acceptRequest(requestId: string) {
    if (!myId) return;

    setRequests((prev) => {
      const req = prev.find((r) => r.id === requestId);
      const remaining = prev.filter((r) => r.id !== requestId);
      if (!req) return remaining;

      const otherId = req.fromId === myId ? req.targetId : req.fromId;
      const candidate = candidates.find((c) => c.id === otherId);

      setFriends((old) => {
        if (old.some((f) => f.id === otherId)) return old;
        return [
          ...old,
          candidate ?? { id: otherId, displayName: "Friend" },
        ];
      });

      return remaining;
    });
  }
// decline a friend request
  function declineRequest(requestId: string) {
    setRequests((prev) => prev.filter((r) => r.id !== requestId));
  }
// provide the context value
  const value: FriendsContextType = {
    friends,
    requests,
    candidates,
    sendRequest,
    acceptRequest,
    declineRequest,
  };
// render the provider
  return (
    <FriendsContext.Provider value={value}>
      {children}
    </FriendsContext.Provider>
  );
}

// Custom hook to use the FriendsContext
export function useFriends() {
  const ctx = useContext(FriendsContext);
  if (!ctx) {
    throw new Error("useFriends must be used within FriendsProvider");
  }
  return ctx;
}
