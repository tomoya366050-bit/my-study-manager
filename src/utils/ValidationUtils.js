// src/utils/ValidationUtils.js

export const ValidationUtils = {
  /**
   * 必須入力チェック（空白文字のみもNG）
   */
  isRequired: (value) => {
    return value !== null && value !== undefined && value.trim().length > 0;
  },

  /**
   * 文字数制限チェック
   */
  isMaxLength: (value, max) => {
    if (!value) return true;
    return value.length <= max;
  },

  /**
   * 数値の妥当性チェック
   */
  isValidNumber: (value) => {
    const num = Number(value);
    return !isNaN(num) && num >= 0;
  },

  /**
   * 未来の日付でないかチェック
   */
  isNotFutureDate: (date) => {
    if (!date) return true;
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    return new Date(date) <= today;
  }
};