export type Play = {
  artist: string;
  track: string;
  minutes: number;
  playedAt: string;
};

// generates timestamps relative to "today"
function daysAgo(n: number) {
  const d = new Date();
  d.setHours(10, 0, 0, 0); // mid-morning to avoid wrong timings
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

// A few plays across this week and the previous week
export const mockPlays: Play[] = [
  // This week
  { artist: "Adele",        track: "Easy On Me",       minutes: 32, playedAt: daysAgo(0) },
  { artist: "Drake",        track: "God's Plan",       minutes: 28, playedAt: daysAgo(1) },
  { artist: "Taylor Swift", track: "Anti-Hero",        minutes: 26, playedAt: daysAgo(2) },
  { artist: "The Weeknd",   track: "Blinding Lights",  minutes: 24, playedAt: daysAgo(3) },
  { artist: "SZA",          track: "Kill Bill",        minutes: 22, playedAt: daysAgo(4) },
  { artist: "Adele",        track: "Someone Like You", minutes: 20, playedAt: daysAgo(5) },
  { artist: "Drake",        track: "Hotline Bling",    minutes: 18, playedAt: daysAgo(6) },

  // Last week 
  { artist: "Kendrick",     track: "Money Trees",      minutes: 40, playedAt: daysAgo(8) },
  { artist: "SZA",          track: "Snooze",           minutes: 35, playedAt: daysAgo(9) },
];
