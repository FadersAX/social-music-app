// The shape of the storage object we expect (matches getStorage result)
type StorageLike = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
};

//defines what data belongs to a user
export type StoredUser = {
  id: string;
  email: string;
  displayName: string;
  password: string;
};

const USERS_KEY = "users:list:v1";

// stores the list of users
export default class UserStore {
  private storage: StorageLike;
  private users: StoredUser[] = [];

  //class recieves the storage system when it's created
  constructor(storage: StorageLike) {
    this.storage = storage;
  }

  // Load user list from storage
  async load() {
    try {
      const raw = await this.storage.getItem(USERS_KEY);
      this.users = raw ? JSON.parse(raw) : [];
    } catch {
      this.users = [];
    }

    // If empty, add a default test user for login
    if (this.users.length === 0) {
      this.users.push({
        id: "u1",
        email: "test@example.com",
        displayName: "Test User",
        password: "password",
      });
      await this.save();
    }
  }

  // Save user list to storage
  private async save() {
    try {
      await this.storage.setItem(USERS_KEY, JSON.stringify(this.users));
    } catch {
      // ignore errors for now
    }
  }

  // Find a user for login
  findByEmailAndPassword(email: string, password: string): StoredUser | null {
    const e = email.trim().toLowerCase();
    const p = password.trim();
    return (
      this.users.find(
        (u) => u.email.toLowerCase() === e && u.password === p
      ) ?? null
    );
  }

  // Create a new user
  async addUser(
    email: string,
    password: string,
    displayName: string
  ): Promise<StoredUser> {
    const e = email.trim().toLowerCase();
    const p = password.trim();
    const name = displayName.trim();

    // basic validation
    if (!e || !p || !name) {
      throw new Error("All fields are required");
    }

    // check for existing email
    if (this.users.some((u) => u.email === e)) {
      throw new Error("An account with this email already exists");
    }

    // create new user
    const newUser: StoredUser = {
      id: "u_" + Date.now().toString(36),
      email: e,
      displayName: name,
      password: p,
    };

    // add and save
    this.users.push(newUser);
    await this.save();
    return newUser;
  }
}
