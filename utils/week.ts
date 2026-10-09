export function startOfCurrentWeek(): Date {
  const now = new Date();
  const day = now.getDay();               // 12am to 6pm (Sun - Sat) in local time
  const diffToMonday = (day + 6) % 7;     // how many days since Monday
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);             // today at 00:00 local
  start.setDate(start.getDate() - diffToMonday); // back to Monday
  return start;
}

export function isInCurrentWeek(d: Date): boolean {
  const start = startOfCurrentWeek();
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  return d >= start && d < end;
}