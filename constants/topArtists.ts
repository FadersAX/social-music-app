export type Artist = {
  id: number;
  name: string;
 // minutesThisWeek: number; // tailored to the user
  //playsThisWeek: number;   // for display/testing
};

const topArtists: Artist[] = [
  { id: 1, name: "Adele",  },     // minutesThisWeek: 132, playsThisWeek: 38 },
  { id: 2, name: "Drake",   },    // minutesThisWeek: 118, playsThisWeek: 31 },
  { id: 3, name: "Taylor Swift", }, // minutesThisWeek: 109, playsThisWeek: 29 },
  { id: 4, name: "The Weeknd", }, // minutesThisWeek: 101, playsThisWeek: 27 },
  { id: 5, name: "SZA",    },  // minutesThisWeek:  95, playsThisWeek: 24 },
  { id: 6, name: "Kendrick",  }  // minutesThisWeek:  82, playsThisWeek: 20 }
];

export default topArtists;