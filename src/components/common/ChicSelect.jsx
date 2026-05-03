import React from 'react';

const ChicSelect = ({ value, onChange, options, placeholder, style = {} }) => {
  const selectStyle = {
    width: '100%',
    padding: '15px',
    borderRadius: '12px',
    backgroundColor: '#0f0f0f',
    border: '1px solid #222',
    color: '#fff',
    marginBottom: '12px',
    boxSizing: 'border-box',
    outline: 'none',
    fontSize: '15px',
    cursor: 'pointer',
    appearance: 'none', // ブラウザ標準の矢印を消してスタイリッシュにすることも可能
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