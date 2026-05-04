import React, { useState } from 'react';
import { Plus, CheckCircle2, Circle, Trash2 } from 'lucide-react';
import ChicInput from '../../common/ChicInput';
import ChicButton from '../../common/ChicButton';
import ChicTypography from '../../common/ChicTypography';

const TodoView = ({ todos, onAddTodo, onToggleTodo, onDeleteTodo }) => {
  const [newTodoText, setNewTodoText] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newTodoText.trim()) return;
    onAddTodo(newTodoText);
    setNewTodoText("");
  };

  return (
    <div key="todo">
      <ChicTypography variant="h2">学習予定</ChicTypography>
      
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
        <ChicTypography variant="body" style={{ textAlign: 'center', marginTop: '40px' }}>予定はありません</ChicTypography>
      ) : (
        todos.map(t => (
          <div key={t.id} style={{ 
            display: 'flex', alignItems: 'center', gap: '12px', padding: '15px', 
            backgroundColor: '#0a0a0a', borderRadius: '12px', marginBottom: '10px', 
            border: '1px solid #161616' 
          }}>
            <div onClick={() => onToggleTodo(t.id, !t.completed)} style={{ color: t.completed ? '#27ae60' : '#333', cursor: 'pointer' }}>
              {t.completed ? <CheckCircle2 /> : <Circle />}
            </div>
            <span style={{ 
              flex: 1, 
              textDecoration: t.completed ? 'line-through' : 'none', 
              color: t.completed ? '#444' : '#ccc',
              fontSize: '15px'
            }}>
              {t.text}
            </span>
            <Trash2 
              size={18} 
              color="#222" 
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