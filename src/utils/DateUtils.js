// src/utils/DateUtils.js

export const DateUtils = {
  getToday: () => new Date(),
  
  // ログの重複チェックやキー作成に使用
  getDateKey: (date) => {
    if (!date) return "";
    const d = new Date(date);
    return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  },

  // 週間グラフ表示用のレンジ作成
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

  // 秒数を "h:mm:ss" 形式に変換 (RecordViewなどで使用)
  formatSecondsToHMS: (totalSeconds) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  },

  // FirestoreのTimestampを "yyyy/MM/dd" に変換 (HistoryViewなどで使用)
  formatTimestampToYMD: (timestamp) => {
    if (!timestamp) return "";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const y = date.getFullYear();
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const d = date.getDate().toString().padStart(2, '0');
    return `${y}/${m}/${d}`;
  },

  // 継続日数の計算ロジック
  calculateStreak: (logs) => {
    if (!logs || logs.length === 0) return 0;
    
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
    
    if (!uniqueDates.includes(todayKey)) {
      if (!uniqueDates.includes(yesterdayKey)) return 0;
      checkDate = new Date(yesterday);
      checkKey = yesterdayKey;
    }
    
    while (uniqueDates.includes(checkKey)) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
      checkKey = `${checkDate.getFullYear()}-${checkDate.getMonth() + 1}-${checkDate.getDate()}`;
    }
    return streak;
  }, // <--- ここにカンマが必要でした！

  /**
   * 期限までの残り日数を計算する (今日を含む)
   * @param {Date|Timestamp} deadline 
   * @returns {number} 残り日数 (期限が今日なら1、切れていれば0以下)
   */
  calculateDaysRemaining: (deadline) => {
    if (!deadline) return 0;
    const end = deadline.toDate ? deadline.deadline.toDate() : new Date(deadline);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  },

  /**
   * 秒数を「〇時間〇分」の形式に変換する
   */
  formatSecondsToHM: (totalSeconds) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    return `${h}時間${m}分`;
  }
};