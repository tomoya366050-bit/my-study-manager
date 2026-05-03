// TimerUtils.js - タイマーの永続化と計算を担当

const KEYS = {
  START_TIME: 'study_timer_start_timestamp',
  ACTIVE_ID: 'study_timer_active_material_id',
  SECONDS: 'study_timer_current_seconds',
};

export const TimerUtils = {
  // 計測データをLocalStorageに保存
  saveSession: (startTime, activeId, seconds) => {
    if (startTime) localStorage.setItem(KEYS.START_TIME, startTime.toString());
    if (activeId) localStorage.setItem(KEYS.ACTIVE_ID, activeId);
    localStorage.setItem(KEYS.SECONDS, seconds.toString());
  },

  // 保存されているセッションを読み込み
  loadSession: () => {
    const startTime = localStorage.getItem(KEYS.START_TIME);
    const activeId = localStorage.getItem(KEYS.ACTIVE_ID);
    const seconds = localStorage.getItem(KEYS.SECONDS);

    return {
      startTime: startTime ? parseInt(startTime) : null,
      activeId: activeId || null,
      seconds: seconds ? parseInt(seconds) : 0,
    };
  },

  // セッションを完全に削除
  clearSession: () => {
    localStorage.removeItem(KEYS.START_TIME);
    localStorage.removeItem(KEYS.ACTIVE_ID);
    localStorage.removeItem(KEYS.SECONDS);
  },

  // 現在の経過秒数を計算する
  calculateElapsed: (startTime) => {
    if (!startTime) return 0;
    // 現在時刻(ms) - 開始時刻(ms) を秒に変換
    return Math.floor((Date.now() - startTime) / 1000);
  }
};