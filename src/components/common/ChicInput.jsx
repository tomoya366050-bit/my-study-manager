import React from 'react';
import { THEME_COLORS } from '../../styles/theme';

const ChicInput = ({ value, onChange, placeholder, type = "text", style = {}, ...props }) => {
  const inputStyle = {
    width: '100%',
    padding: '15px',
    paddingRight: type === 'number' ? '15px' : '15px', 
    borderRadius: '12px',
    backgroundColor: THEME_COLORS.background,
    border: `1px solid ${THEME_COLORS.surface}`,
    color: THEME_COLORS.text.primary,
    marginBottom: '12px',
    boxSizing: 'border-box',
    outline: 'none',
    fontSize: '15px',
    transition: 'border-color 0.2s',
    ...style
  };

  return (
    <input 
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      style={inputStyle}
      // フォーカス時は少し明るい枠線にする
      onFocus={(e) => e.target.style.borderColor = THEME_COLORS.text.secondary}
      onBlur={(e) => e.target.style.borderColor = THEME_COLORS.surface}
      {...props} 
    />
  );
};

export default ChicInput;