// src/utils/TimerUtils.js

const KEYS = {
  START_TIME: 'study_timer_start_timestamp',
  ACTIVE_ID: 'study_timer_active_material_id',
  SECONDS: 'study_timer_current_seconds',
};

export const TimerUtils = {
  saveSession: (startTime, activeId, seconds) => {
    if (startTime) localStorage.setItem(KEYS.START_TIME, startTime.toString());
    if (activeId) localStorage.setItem(KEYS.ACTIVE_ID, activeId);
    localStorage.setItem(KEYS.SECONDS, seconds.toString());
  },

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

  clearSession: () => {
    localStorage.removeItem(KEYS.START_TIME);
    localStorage.removeItem(KEYS.ACTIVE_ID);
    localStorage.removeItem(KEYS.SECONDS);
  },

  calculateElapsed: (startTime) => {
    if (!startTime) return 0;
    return Math.floor((Date.now() - startTime) / 1000);
  }
};