// src/utils/DateUtils.js

export const DateUtils = {
  getToday: () => new Date(),
  
  /**
   * 日付オブジェクトから比較用のキー (YYYY-M-D) を作成
   */
  getDateKey: (date) => {
    if (!date) return "";
    const d = new Date(date);
    return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  },

  /**
   * 現在の週（日曜日〜土曜日）の日付オブジェクト配列を生成
   */
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

  /**
   * 秒数を "h:mm:ss" 形式に変換
   */
  formatSecondsToHMS: (totalSeconds) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  },

  /**
   * FirestoreのTimestampまたはDateを "yyyy/MM/dd" に変換
   */
  formatTimestampToYMD: (timestamp) => {
    if (!timestamp) return "";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const y = date.getFullYear();
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const d = date.getDate().toString().padStart(2, '0');
    return `${y}/${m}/${d}`;
  },

  /**
   * 学習ログから現在の継続日数を計算
   */
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
  },

  /**
   * 期限までの残り日数を計算 (今日を含む)
   * 期限当日 = 1, 期限切れ = 0
   */
  calculateDaysRemaining: (deadline) => {
    if (!deadline) return 0;
    
    const end = (deadline && typeof deadline.toDate === 'function') 
      ? deadline.toDate() 
      : new Date(deadline);

    const now = new Date();
    now.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    
    return Math.max(0, diffDays);
  },

  /**
   * 秒数を「〇時間〇分」の形式に変換 (学習目標ノルマ用)
   */
  formatSecondsToHM: (totalSeconds) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    return `${h}時間${m}分`;
  }
};