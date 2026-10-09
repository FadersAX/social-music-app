// models/UserProfile.ts

export default class UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
// label for username
  constructor(uid: string, email: string | null, displayName: string | null) {
    this.uid = uid;
    this.email = email;
    this.displayName = displayName;
  }

// label used if the username is not available
  get label(): string {
    return this.displayName ?? this.email ?? this.uid;
  }
}
