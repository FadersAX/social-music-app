export type MockUser = {
  id: string;
  displayName: string;
  minutesThisWeek: number;
  topArtist: string;
};
//Mock users which can be searched up and added as friends 
export const mockUsers: MockUser[] = [
  {
    id: "u2",
    displayName: "Jack",
    minutesThisWeek: 210,
    topArtist: "SZA",
  },
  {
    id: "u3",
    displayName: "Joy",
    minutesThisWeek: 185,
    topArtist: "Drake",
  },
  {
    id: "u4",
    displayName: "Sufyan",
    minutesThisWeek: 160,
    topArtist: "The Weeknd",
  },
  {
    id: "u5",
    displayName: "Sofia",
    minutesThisWeek: 140,
    topArtist: "Kendrick",
  },
  {
    id: "u6",
    displayName: "Alina",
    minutesThisWeek: 120,
    topArtist: "Ariana Grande",
  },
];