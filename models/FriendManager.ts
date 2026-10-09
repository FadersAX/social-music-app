// models/FriendManager.ts
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  doc,
} from "firebase/firestore";
import { db } from "@/firebaseconfig";

import UserProfile from "./UserProfile";
import FriendRequest from "./FriendRequest";

// Manages friend-related operations
export default class FriendManager {
  currentUid: string;

  constructor(currentUid: string) {
    this.currentUid = currentUid;
  }

  // Convert Firestore into UserProfile class
  private userFromDoc(docSnap: any): UserProfile {
    const data = docSnap.data();
    return new UserProfile(
      docSnap.id,
      data.email ?? null,
      data.displayName ?? null
    );
  }

// gets all users except the current user
  async getAllUsers(): Promise<UserProfile[]> {
    const snap = await getDocs(collection(db, "users"));
    const list: UserProfile[] = [];

    snap.forEach((d) => {
      if (d.id !== this.currentUid) {
        list.push(this.userFromDoc(d));
      }
    });

    return list;
  }

// replaces mock users here for real users instead
  async getFriends(): Promise<UserProfile[]> {
    const q = query(
      collection(db, "friends"),
      where("members", "array-contains", this.currentUid)
    );

    const snap = await getDocs(q);
    const friendIds = new Set<string>();

    snap.forEach((d) => {
      const members: string[] = d.get("members");
      const other = members.find((id) => id !== this.currentUid);
      if (other) friendIds.add(other);
    });

    if (friendIds.size === 0) return [];

    const usersSnap = await getDocs(collection(db, "users"));
    const result: UserProfile[] = [];

    usersSnap.forEach((d) => {
      if (friendIds.has(d.id)) {
        result.push(this.userFromDoc(d));
      }
    });

    return result;
  }

// gets the incoming friend requests
  async getIncomingRequests(): Promise<FriendRequest[]> {
    const q = query(
      collection(db, "friendRequests"),
      where("toUid", "==", this.currentUid),
      where("status", "==", "pending")
    );

    const snap = await getDocs(q);

    const reqs: FriendRequest[] = [];
    const fromIds = new Set<string>();

    snap.forEach((d) => {
      const data = d.data();
      reqs.push(
        new FriendRequest(
          d.id,
          data.fromUid,
          data.toUid,
          data.status
        )
      );
      fromIds.add(data.fromUid);
    });

    // attach the UserProfile objects
    if (reqs.length === 0) return reqs;

    const usersSnap = await getDocs(collection(db, "users"));
    const users: Record<string, UserProfile> = {};

    usersSnap.forEach((d) => {
      if (fromIds.has(d.id)) {
        users[d.id] = this.userFromDoc(d);
      }
    });

    return reqs.map(
      (r) =>
        new FriendRequest(
          r.id,
          r.fromUid,
          r.toUid,
          r.status,
          users[r.fromUid]
        )
    );
  }

// sending friend requests
  async sendRequest(toUid: string): Promise<void> {
    if (toUid === this.currentUid) return;

    const reqCol = collection(db, "friendRequests");

    // this prevents duplicate pending requests
    const q = query(
      reqCol,
      where("fromUid", "==", this.currentUid),
      where("toUid", "==", toUid),
      where("status", "==", "pending")
    );
    const existing = await getDocs(q);
    if (!existing.empty) return;

    await addDoc(reqCol, {
      fromUid: this.currentUid,
      toUid,
      status: "pending",
      createdAt: serverTimestamp(),
    });
  }

 // accept friend request
  async acceptRequest(reqId: string, fromUid: string): Promise<void> {
    const reqRef = doc(db, "friendRequests", reqId);
    await updateDoc(reqRef, { status: "accepted" });

    await addDoc(collection(db, "friends"), {
      members: [this.currentUid, fromUid],
      createdAt: serverTimestamp(),
    });
  }

// decline friend request
  async declineRequest(reqId: string): Promise<void> {
    const reqRef = doc(db, "friendRequests", reqId);
    await updateDoc(reqRef, { status: "rejected" });
  }

//remove friends
  async removeFriend(friendUid: string): Promise<void> {
    const q = query(
      collection(db, "friends"),
      where("members", "array-contains", this.currentUid)
    );

    const snap = await getDocs(q);

    snap.forEach(async (d) => {
      const members: string[] = d.get("members");
      if (members.includes(friendUid)) {
        await deleteDoc(d.ref);
      }
    });
  }
}
