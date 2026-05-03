import React from 'react';

const ChicInput = ({ value, onChange, placeholder, type = "text", style = {}, ...props }) => {
  const inputStyle = {
    width: '100%',
    padding: '15px',
    // 数字入力の場合は右側に余裕を持たせる
    paddingRight: type === 'number' ? '15px' : '15px', 
    borderRadius: '12px',
    backgroundColor: '#0f0f0f',
    border: '1px solid #222',
    color: '#fff',
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
      onFocus={(e) => e.target.style.borderColor = '#444'}
      onBlur={(e) => e.target.style.borderColor = '#222'}
      {...props} 
    />
  );
};

export default ChicInput;