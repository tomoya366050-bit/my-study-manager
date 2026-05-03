import React from 'react';

const ChicCard = ({ children, style = {}, padding = '20px' }) => {
  const cardStyle = {
    backgroundColor: '#0a0a0a',
    borderRadius: '20px',
    padding: padding,
    border: '1px solid #161616',
    boxSizing: 'border-box',
    marginBottom: '20px',
    ...style
  };

  return <div style={cardStyle}>{children}</div>;
};

export default ChicCard;