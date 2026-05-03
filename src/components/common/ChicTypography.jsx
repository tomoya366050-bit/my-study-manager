import React from 'react';

const ChicTypography = ({ children, variant = 'h2', style = {}, color = '#fff' }) => {
  // バリアント（種類）ごとのスタイル定義
  const getStyle = () => {
    switch (variant) {
      case 'logo': // STUDY MANAGER ロゴ
        return { fontSize: '14px', letterSpacing: '4px', color: '#333', textAlign: 'center', marginBottom: '40px', margin: '0 0 40px 0' };
      case 'h2': // 各タブのメイン見出し（学習サマリー、予定など）
        return { fontSize: '18px', fontWeight: 'normal', color: color, marginBottom: '20px', display: 'block' };
      case 'h3': // カテゴリ名やセクションの見出し
        return { fontSize: '17px', fontWeight: 'bold', color: '#eee', margin: 0 };
      case 'label': // 「今日」「今週」などの補助ラベル
        return { fontSize: '12px', color: '#555' };
      case 'body': // 一般的なテキスト
        return { fontSize: '15px', color: '#ccc' };
      case 'caption': // グラフの注釈などの極小テキスト
        return { fontSize: '10px', color: '#444' };
      default:
        return { fontSize: '15px', color: color };
    }
  };

  // セマンティックHTML（構造上の意味）を適切に選択
  const Tag = (variant === 'logo') ? 'h1' : (variant === 'h2' || variant === 'h3' ? variant : 'p');

  return (
    <Tag style={{ ...getStyle(), ...style }}>
      {children}
    </Tag>
  );
};

export default ChicTypography;