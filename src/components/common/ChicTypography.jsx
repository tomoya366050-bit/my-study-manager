import React from 'react';
import { THEME_COLORS } from '../../styles/theme';

const ChicTypography = ({ children, variant = 'h2', style = {}, color }) => {
  // propsでcolorが渡されなかった場合はprimaryを基本とする
  const defaultColor = color || THEME_COLORS.text.primary;

  const getStyle = () => {
    switch (variant) {
      case 'logo': // STUDY MANAGER ロゴ
        return { fontSize: '14px', letterSpacing: '4px', color: THEME_COLORS.text.muted, textAlign: 'center', marginBottom: '40px', margin: '0 0 40px 0' };
      case 'h2': // 各タブのメイン見出し（学習サマリー、予定など）
        return { fontSize: '18px', fontWeight: 'normal', color: defaultColor, marginBottom: '20px', display: 'block' };
      case 'h3': // カテゴリ名やセクションの見出し
        return { fontSize: '17px', fontWeight: 'bold', color: THEME_COLORS.text.primary, margin: 0 };
      case 'label': // 「今日」「今週」などの補助ラベル
        return { fontSize: '12px', color: THEME_COLORS.text.secondary };
      case 'body': // 一般的なテキスト
        return { fontSize: '15px', color: THEME_COLORS.text.secondary };
      case 'caption': // グラフの注釈などの極小テキスト
        return { fontSize: '10px', color: THEME_COLORS.text.muted };
      default:
        return { fontSize: '15px', color: defaultColor };
    }
  };

  const Tag = (variant === 'logo') ? 'h1' : (variant === 'h2' || variant === 'h3' ? variant : 'p');

  return (
    <Tag style={{ ...getStyle(), ...style }}>
      {children}
    </Tag>
  );
};

export default ChicTypography;