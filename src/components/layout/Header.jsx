import React from 'react';
import ChicTypography from '../common/ChicTypography';

const Header = () => {
  return (
    <header style={{ textAlign: 'center', marginBottom: '40px' }}>
      <ChicTypography variant="logo">STUDY MANAGER</ChicTypography>
    </header>
  );
};

export default Header;