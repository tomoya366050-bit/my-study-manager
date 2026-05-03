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
  weekLabels: ["日", "月", "火", "水", "木", "金", "土"],

  // ★追加：継続日数の計算ロジック
  calculateStreak: (logs) => {
    if (!logs || logs.length === 0) return 0;
    
    // ログから「勉強した日」の重複のないリスト(YYYY-M-D)を作成
    const uniqueDates = [...new Set(logs.map(l => {
      const d = l.createdAt ? (typeof l.createdAt.toDate === 'function' ? l.createdAt.toDate() : new Date(l.createdAt)) : new Date();
      return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
    }))];
    
    const now = new Date();
    const todayKey = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
    
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const yesterdayKey = `${yesterday.getFullYear()}-${yesterday.getMonth() + 1}-${yesterday.getDate()}`;
    
    let streak = 0;
    let checkDate = new Date(now);
    let checkKey = todayKey;
    
    // 今日まだ勉強していない場合は、昨日からカウント開始。昨日もしていなければ0日。
    if (!uniqueDates.includes(todayKey)) {
      if (!uniqueDates.includes(yesterdayKey)) return 0;
      checkDate = new Date(yesterday);
      checkKey = yesterdayKey;
    }
    
    // 過去に向かって1日ずつ遡り、リストに存在し続ける限りカウントアップ
    while (uniqueDates.includes(checkKey)) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
      checkKey = `${checkDate.getFullYear()}-${checkDate.getMonth() + 1}-${checkDate.getDate()}`;
    }
    return streak;
  }
};