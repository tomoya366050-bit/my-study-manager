import React from 'react';
import { Home, Timer, History, ListTodo } from 'lucide-react';

// ★追加：テーマカラーのインポート
import { THEME_COLORS } from '../../styles/theme';

const BottomNav = ({ activeTab, setActiveTab }) => {
  const navStyles = {
    container: {
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: 'rgba(0,0,0,0.95)',
      backdropFilter: 'blur(10px)',
      // ★修正：ボーダー色をテーマのsurfaceに統一
      borderTop: `1px solid ${THEME_COLORS.surface}`,
      display: 'flex',
      justifyContent: 'space-around',
      alignItems: 'center',
      padding: '15px 10px 30px',
      zIndex: 1000, // 教材ボックスより前に表示
    },
    item: (isActive) => ({
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '5px',
      // ★修正：アクティブ時はprimary（白系）、非アクティブ時はsecondary（明るいグレー）にして視認性UP
      color: isActive ? THEME_COLORS.text.primary : THEME_COLORS.text.secondary,
      cursor: 'pointer',
      transition: '0.3s',
      flex: 1
    }),
    label: { fontSize: '10px', fontWeight: 'bold' }
  };

  return (
    <nav style={navStyles.container}>
      <div style={navStyles.item(activeTab === 'home')} onClick={() => setActiveTab('home')}>
        <Home size={22} /><span style={navStyles.label}>Home</span>
      </div>
      <div style={navStyles.item(activeTab === 'record')} onClick={() => setActiveTab('record')}>
        <Timer size={22} /><span style={navStyles.label}>Record</span>
      </div>
      <div style={navStyles.item(activeTab === 'history')} onClick={() => setActiveTab('history')}>
        <History size={22} /><span style={navStyles.label}>History</span>
      </div>
      <div style={navStyles.item(activeTab === 'todo')} onClick={() => setActiveTab('todo')}>
        <ListTodo size={22} /><span style={navStyles.label}>Todo</span>
      </div>
    </nav>
  );
};

export default BottomNav;