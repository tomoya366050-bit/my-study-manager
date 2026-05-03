export const DateUtils = {
  getToday: () => new Date(),
  getDateKey: (date) => {
    if (!date) return "";
    const d = new Date(date);
    return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  },
  getCurrentWeekRange: () => {
    const now = new Date();
    const sunday = new Date(now);
    sunday.setDate(now.getDate() - now.getDay());
    sunday.setHours(0, 0, 0, 0);
    return [...Array(7)].map((_, i) => {
      const d = new Date(sunday);
      d.setDate(sunday.getDate() + i);
      return d;
    });
  },
  weekLabels: ["日", "月", "火", "水", "木", "金", "土"]
};