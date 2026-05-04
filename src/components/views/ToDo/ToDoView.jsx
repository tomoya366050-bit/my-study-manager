import React, { useState } from 'react';
import { Plus, CheckCircle2, Circle, Trash2 } from 'lucide-react';
import ChicInput from '../../common/ChicInput';
import ChicButton from '../../common/ChicButton';
import ChicTypography from '../../common/ChicTypography';

// テーマカラーのインポート
import { THEME_COLORS } from '../../../styles/theme';
// ★追加：バリデーションユーティリティのインポート
import { ValidationUtils } from '../../../utils/ValidationUtils';

const TodoView = ({ todos, onAddTodo, onToggleTodo, onDeleteTodo }) => {
  const [newTodoText, setNewTodoText] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    // ★修正：ValidationUtils を使用して必須入力チェックを行う
    if (!ValidationUtils.isRequired(newTodoText)) return;
    
    // 文字列の両端の空白を除去して登録
    onAddTodo(newTodoText.trim());
    setNewTodoText("");
  };

  return (
    <div key="todo">
      <ChicTypography variant="h2" style={{ color: THEME_COLORS.text.primary }}>学習予定</ChicTypography>
      
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '10px', marginBottom: '25px' }}>
        <ChicInput 
          value={newTodoText} 
          onChange={e => setNewTodoText(e.target.value)} 
          placeholder="次は何を勉強する？" 
          style={{ marginBottom: 0 }} 
        />
        <ChicButton type="submit" style={{ flex: 'none', width: '60px' }}>
          <Plus />
        </ChicButton>
      </form>

      {todos.length === 0 ? (
        <ChicTypography variant="body" style={{ textAlign: 'center', marginTop: '40px', color: THEME_COLORS.text.muted }}>予定はありません</ChicTypography>
      ) : (
        todos.map(t => (
          <div key={t.id} style={{ 
            display: 'flex', alignItems: 'center', gap: '12px', padding: '15px', 
            backgroundColor: THEME_COLORS.background, borderRadius: '12px', marginBottom: '10px', 
            border: `1px solid ${THEME_COLORS.surface}` 
          }}>
            <div onClick={() => onToggleTodo(t.id, !t.completed)} style={{ color: t.completed ? '#27ae60' : THEME_COLORS.text.secondary, cursor: 'pointer' }}>
              {t.completed ? <CheckCircle2 /> : <Circle />}
            </div>
            <span style={{ 
              flex: 1, 
              textDecoration: t.completed ? 'line-through' : 'none', 
              color: t.completed ? THEME_COLORS.text.muted : THEME_COLORS.text.primary,
              fontSize: '15px'
            }}>
              {t.text}
            </span>
            <Trash2 
              size={18} 
              color={THEME_COLORS.text.secondary} 
              onClick={() => onDeleteTodo(t.id)} 
              style={{ cursor: 'pointer' }} 
            />
          </div>
        ))
      )}
    </div>
  );
};

export default TodoView;