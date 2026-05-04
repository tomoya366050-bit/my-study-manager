import React from 'react';
import { THEME_COLORS } from '../../styles/theme';

const ChicButton = ({ children, onClick, type = "button", variant = "save", style = {} }) => {
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
    border: variant === "save" ? `1px solid ${THEME_COLORS.accentRed}` : `1px solid ${THEME_COLORS.surface}`,
    color: variant === "save" ? THEME_COLORS.text.primary : THEME_COLORS.text.secondary,
    // THEME_COLORS.accentRedの末尾に「1A（透明度10%）」を付与してほんのり赤くする
    backgroundColor: variant === "save" ? `${THEME_COLORS.accentRed}1A` : 'transparent',
    ...style
  };

  return (
    <button type={type} onClick={onClick} style={baseStyle}>
      {children}
    </button>
  );
};

export default ChicButton;