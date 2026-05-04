// src/utils/ValidationUtils.js

export const ValidationUtils = {
  /**
   * 必須入力チェック
   */
  isRequired: (value) => {
    return value !== null && value !== undefined && value.trim().length > 0;
  },

  /**
   * 数値の妥当性チェック
   */
  isValidNumber: (value) => {
    const num = Number(value);
    return !isNaN(num) && num >= 0;
  },

  /**
   * 文字数制限（例：カテゴリ名が長すぎると表示が崩れるため）
   */
  isMaxLength: (value, max) => {
    if (!value) return true;
    return value.length <= max;
  }
};