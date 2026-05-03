import React from 'react';

// ACCENT_RED などの定数は部品の中に持たせてしまう（またはテーマファイルを作る）
const ACCENT_RED = "#c53030";

const ChicButton = ({ children, onClick, type = "button", variant = "save", style = {} }) => {
  // 保存ボタンとキャンセルボタンのスタイルを統合管理
  const baseStyle = {
    padding: '12px',
    borderRadius: '10px',
    fontWeight: 'bold',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    transition: '0.2s',
    border: variant === "save" ? `1px solid ${ACCENT_RED}` : '1px solid #333',
    color: variant === "save" ? '#fff' : '#888',
    backgroundColor: variant === "save" ? 'rgba(197, 48, 48, 0.1)' : 'transparent',
    ...style // 呼び出し側で微調整したい時用の拡張枠
  };

  return (
    <button type={type} onClick={onClick} style={baseStyle}>
      {children}
    </button>
  );
};

export default ChicButton;