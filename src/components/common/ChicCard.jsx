import React from 'react';
import { THEME_COLORS } from '../../styles/theme';

const ChicCard = ({ children, style = {}, padding = '20px' }) => {
  const cardStyle = {
    backgroundColor: THEME_COLORS.background,
    borderRadius: '20px',
    padding: padding,
    border: `1px solid ${THEME_COLORS.surface}`,
    boxSizing: 'border-box',
    marginBottom: '20px',
    ...style
  };

  return <div style={cardStyle}>{children}</div>;
};

export default ChicCard;