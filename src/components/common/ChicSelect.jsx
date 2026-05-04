import React from 'react';
import { THEME_COLORS } from '../../styles/theme';

const ChicSelect = ({ value, onChange, options, placeholder, style = {} }) => {
  const selectStyle = {
    width: '100%',
    padding: '15px',
    borderRadius: '12px',
    backgroundColor: THEME_COLORS.background,
    border: `1px solid ${THEME_COLORS.surface}`,
    color: THEME_COLORS.text.primary,
    marginBottom: '12px',
    boxSizing: 'border-box',
    outline: 'none',
    fontSize: '15px',
    cursor: 'pointer',
    appearance: 'none', 
    ...style
  };

  return (
    <select value={value} onChange={onChange} style={selectStyle}>
      <option value="">{placeholder}</option>
      {options.map(opt => (
        <option key={opt.id} value={opt.id}>{opt.name}</option>
      ))}
    </select>
  );
};

export default ChicSelect;