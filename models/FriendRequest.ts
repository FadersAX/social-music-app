// models/FriendRequest.ts
import UserProfile from "./UserProfile";

// Represents a friend request between users
export default class FriendRequest {
  id: string;
  fromUid: string;
  toUid: string;
  status: "pending" | "accepted" | "rejected";
  fromUser?: UserProfile;

  // initializes a new FriendRequest instance
  constructor(
    id: string,
    fromUid: string,
    toUid: string,
    status: "pending" | "accepted" | "rejected",
    fromUser?: UserProfile
  ) {
    this.id = id;
    this.fromUid = fromUid;
    this.toUid = toUid;
    this.status = status;
    this.fromUser = fromUser;
  }

  // checks if the request is still pending
  get isPending(): boolean {
    return this.status === "pending";
  }

  // displays who sent the request
  get senderLabel(): string {
    return this.fromUser?.label ?? this.fromUid;
  }
}
