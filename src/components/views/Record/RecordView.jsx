import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import DatePicker, { registerLocale } from "react-datepicker";
import ja from "date-fns/locale/ja";
import "react-datepicker/dist/react-datepicker.css";
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Timer, Plus, Settings2, Check, X, Bookmark, Edit2, Trash2, ArrowLeft, Pause, Play, Save, Calendar as CalendarIcon, ArrowUpDown, GripVertical } from 'lucide-react';
import ChicCard from '../../common/ChicCard';
import ChicButton from '../../common/ChicButton';
import ChicInput from '../../common/ChicInput';
import ChicSelect from '../../common/ChicSelect';
import ChicTypography from '../../common/ChicTypography';

// ★追加：テーマカラーのインポート
import { THEME_COLORS } from '../../../styles/theme';

// ★修正：ACCENT_RED を props から削除
const RecordView = ({ 
  categories, materials, activeMaterialId, isManagementMode, 
  isAddMenuOpen, addType, seconds, isRunning,
  setActiveMaterialId, setIsManagementMode, setIsAddMenuOpen, setAddType,
  setIsRunning, setSeconds, onSaveLog, onSaveManualLog, onAddCategory, onAddMaterial, 
  onUpdateCategory, onDeleteCategory, onUpdateMaterial, onDeleteMaterial, onReorderUpdate
}) => {
  const [newMaterialName, setNewMaterialName] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [editingMaterialId, setEditingMaterialId] = useState(null);
  const [editingMaterialName, setEditingMaterialName] = useState("");
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [editingCategoryName, setEditingCategoryName] = useState("");
  const [reorderMode, setReorderMode] = useState('none'); 
  const [isReorderMenuOpen, setIsReorderMenuOpen] = useState(false);

  const [manualDate, setManualDate] = useState(new Date()); 
  const [manualHours, setManualHours] = useState("");
  const [manualMinutes, setManualMinutes] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleBackWithConfirmation = () => {
    if (seconds > 0) {
      if (window.confirm("現在の勉強記録を保存せずに破棄してよろしいですか？")) {
        exitTimer();
      }
    } else {
      exitTimer();
    }
  };

  const exitTimer = () => {
    setActiveMaterialId(null);
    setSeconds(0);
    setIsRunning(false);
    setErrorMessage("");
  };

  const onDragEnd = (result) => {
    if (!result.destination) return;
    if (reorderMode === 'category') {
      const items = Array.from(categories);
      const [reorderedItem] = items.splice(result.source.index, 1);
      items.splice(result.destination.index, 0, reorderedItem);
      onReorderUpdate('categories', items);
    } else if (reorderMode === 'material') {
      const categoryId = result.source.droppableId;
      const catMaterials = materials.filter(m => m.categoryId === categoryId);
      const otherMaterials = materials.filter(m => m.categoryId !== categoryId);
      const items = Array.from(catMaterials);
      const [reorderedItem] = items.splice(result.source.index, 1);
      items.splice(result.destination.index, 0, reorderedItem);
      onReorderUpdate('materials', [...otherMaterials, ...items]);
    }
  };

  // --- 1. タイマー・手入力画面 ---
  if (activeMaterialId) {
    const material = materials.find(m => m.id === activeMaterialId);
    const category = categories.find(c => c.id === material?.categoryId);

    return (
      <div key="timer">
        {/* ★修正：戻るボタンの文字色を明るく */}
        <button onClick={handleBackWithConfirmation} style={{ background: 'none', border: 'none', color: THEME_COLORS.text.secondary, display: 'flex', alignItems: 'center', marginBottom: '20px', cursor: 'pointer' }}><ArrowLeft size={18} style={{ marginRight: '4px' }} /> 戻る</button>
        
        <div style={{ textAlign: 'center', marginBottom: '10px' }}>
          {/* ★修正：カテゴリ名の文字色を明るく */}
          <ChicTypography variant="caption" style={{ color: THEME_COLORS.text.secondary, display: 'block', marginBottom: '4px', fontSize: '14px' }}>
            {category?.name || "カテゴリなし"}
          </ChicTypography>
          {/* ★修正：教材名（タイトル）をアクセントカラーに */}
          <ChicTypography variant="h2" style={{ color: THEME_COLORS.accentRed, margin: 0 }}>
            {material?.name}
          </ChicTypography>
        </div>

        <div style={{ fontSize: '5rem', textAlign: 'center', margin: '40px 0', fontFamily: 'monospace', fontWeight: '100', color: THEME_COLORS.text.primary }}>
          {Math.floor(seconds/3600)}:{Math.floor((seconds%3600)/60).toString().padStart(2,'0')}:{(seconds%60).toString().padStart(2,'0')}
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'center', gap: '30px', marginBottom: '60px' }}>
          {/* ★修正：再生/一時停止ボタンの色をテーマカラーに */}
          <button onClick={() => setIsRunning(!isRunning)} style={{ width: '80px', height: '80px', borderRadius: '50%', border: `1px solid ${THEME_COLORS.surface}`, backgroundColor: isRunning ? THEME_COLORS.surface : THEME_COLORS.accentRed, color: '#fff', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>{isRunning ? <Pause size={30}/> : <Play size={30}/>}</button>
          <button onClick={() => onSaveLog(material)} style={{ width: '80px', height: '80px', borderRadius: '50%', border: `1px solid ${THEME_COLORS.surface}`, backgroundColor: THEME_COLORS.background, color: '#fff', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center' }}><Save size={30}/></button>
        </div>

        <div style={{ borderTop: `1px solid ${THEME_COLORS.surface}`, paddingTop: '30px' }}>
          <ChicTypography variant="label" style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px', color: THEME_COLORS.text.primary }}><CalendarIcon size={14}/> 日付を選択して記録を追加</ChicTypography>
          <ChicCard padding="20px">
            <DatePicker selected={manualDate} onChange={(date) => setManualDate(date)} maxDate={new Date()} locale="ja" dateFormat="yyyy/MM/dd" customInput={<ChicInput style={{ marginBottom: 0 }} />} popperPlacement="top-start" />
            <div style={{ display: 'flex', gap: '15px', alignItems: 'center', margin: '20px 0' }}>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}><ChicInput type="number" placeholder="0" value={manualHours} onChange={e => setManualHours(e.target.value)} style={{ marginBottom: 0 }} /><span style={{ fontSize: '12px', color: THEME_COLORS.text.secondary }}>時</span></div>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}><ChicInput type="number" placeholder="0" value={manualMinutes} onChange={e => setManualMinutes(e.target.value)} style={{ marginBottom: 0 }} /><span style={{ fontSize: '12px', color: THEME_COLORS.text.secondary }}>分</span></div>
            </div>
            {errorMessage && <p style={{ color: THEME_COLORS.accentRed, fontSize: '12px', marginBottom: '15px', textAlign: 'center' }}>{errorMessage}</p>}
            <ChicButton onClick={() => {
              const h = parseInt(manualHours) || 0; const m = parseInt(manualMinutes) || 0; const totalSec = (h * 3600) + (m * 60);
              if (totalSec <= 0 || totalSec > 86400) { setErrorMessage("時間を正しく入力してください"); return; }
              onSaveManualLog(material, manualDate, totalSec); setManualHours(""); setManualMinutes(""); setErrorMessage("");
            }} style={{ width: '100%' }}>手動記録を保存</ChicButton>
          </ChicCard>
        </div>
      </div>
    );
  }

  return (
    <div key="record-list">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <ChicTypography variant="h2" style={{ marginBottom: 0, fontWeight: 'bold', color: THEME_COLORS.text.primary }}>{reorderMode !== 'none' ? '並べ替え中' : '記録する'}</ChicTypography>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            {/* ★修正：アイコンのカラーをテーマに合わせる */}
            <ArrowUpDown size={22} onClick={() => setIsReorderMenuOpen(!isReorderMenuOpen)} style={{ cursor: 'pointer', color: reorderMode !== 'none' ? THEME_COLORS.accentRed : THEME_COLORS.text.secondary }} />
            {isReorderMenuOpen && (
              <ChicCard style={{ position: 'absolute', top: '35px', right: 0, zIndex: 100, width: '180px', border: `1px solid ${THEME_COLORS.surface}` }} padding="5px">
                <button onClick={() => { setReorderMode('category'); setIsReorderMenuOpen(false); setIsManagementMode(false); }} style={{ width: '100%', padding: '12px', background: 'none', border: 'none', color: THEME_COLORS.text.primary, textAlign: 'left', fontSize: '13px', cursor: 'pointer' }}>カテゴリの並べ替え</button>
                <div style={{ height: '1px', backgroundColor: THEME_COLORS.surface }} />
                <button onClick={() => { setReorderMode('material'); setIsReorderMenuOpen(false); setIsManagementMode(false); }} style={{ width: '100%', padding: '12px', background: 'none', border: 'none', color: THEME_COLORS.text.primary, textAlign: 'left', fontSize: '13px', cursor: 'pointer' }}>教材の並べ替え</button>
                {reorderMode !== 'none' && <button onClick={() => { setReorderMode('none'); setIsReorderMenuOpen(false); }} style={{ width: '100%', padding: '12px', background: 'none', border: 'none', color: THEME_COLORS.accentRed, textAlign: 'left', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}>終了</button>}
              </ChicCard>
            )}
          </div>
          <Settings2 size={24} onClick={() => { setIsManagementMode(!isManagementMode); setReorderMode('none'); }} style={{ cursor: 'pointer', color: isManagementMode ? THEME_COLORS.accentRed : THEME_COLORS.text.secondary }} />
          <Plus size={24} onClick={() => setIsAddMenuOpen(!isAddMenuOpen)} style={{ cursor: 'pointer', color: isAddMenuOpen ? THEME_COLORS.accentRed : THEME_COLORS.text.secondary }} />
        </div>
      </div>

      {reorderMode === 'category' && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.95)', zIndex: 2000, padding: '40px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ width: '100%', maxWidth: '400px' }}>
            <ChicTypography variant="h2" style={{ color: THEME_COLORS.text.primary }}>カテゴリの並べ替え</ChicTypography>
            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="categories-list">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef}>
                    <ChicCard padding="0">
                      {categories.map((cat, index) => (
                        <Draggable key={cat.id} draggableId={cat.id} index={index}>
                          {(provided) => (
                            <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} style={{ ...provided.draggableProps.style, display: 'flex', alignItems: 'center', gap: '15px', padding: '20px', borderBottom: `1px solid ${THEME_COLORS.surface}` }}>
                              <GripVertical size={20} color={THEME_COLORS.text.secondary} />
                              <span style={{ fontSize: '16px', color: THEME_COLORS.text.primary }}>{cat.name}</span>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </ChicCard>
                  </div>
                )}
              </Droppable>
            </DragDropContext>
            <ChicButton onClick={() => setReorderMode('none')} style={{ width: '100%', marginTop: '30px' }}>完了</ChicButton>
          </div>
        </div>
      )}

      {isAddMenuOpen && (
        <ChicCard padding="10px">
          <div style={{ display: 'flex', backgroundColor: THEME_COLORS.surface, borderRadius: '12px', padding: '4px', marginBottom: '20px' }}>
            <button style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', color: addType === 'category' ? '#fff' : THEME_COLORS.text.secondary, backgroundColor: addType === 'category' ? '#333' : 'transparent', cursor: 'pointer' }} onClick={() => setAddType('category')}>カテゴリ</button>
            <button style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', color: addType === 'material' ? '#fff' : THEME_COLORS.text.secondary, backgroundColor: addType === 'material' ? '#333' : 'transparent', cursor: 'pointer' }} onClick={() => setAddType('material')}>教材</button>
          </div>
          <div style={{padding: '0 10px 10px'}}>
            {addType === 'category' ? <ChicInput value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} placeholder="カテゴリ名を入力..." autoFocus /> : <>
                <ChicSelect value={selectedCategoryId} onChange={e => setSelectedCategoryId(e.target.value)} options={categories} placeholder="カテゴリを選択" />
                <ChicInput value={newMaterialName} onChange={e => setNewMaterialName(e.target.value)} placeholder="教材名を入力..." />
              </>}
            <div style={{ display: 'flex', gap: '10px' }}><ChicButton onClick={() => { if(addType==='category'){ onAddCategory(newCategoryName); setNewCategoryName(""); } else { onAddMaterial(newMaterialName, selectedCategoryId); setNewMaterialName(""); } }}><Check size={18}/>登録</ChicButton><ChicButton variant="cancel" onClick={() => setIsAddMenuOpen(false)} style={{ width: '50px', flex: 'none' }}><X size={18}/></ChicButton></div>
          </div>
        </ChicCard>
      )}

      <DragDropContext onDragEnd={onDragEnd}>
        {categories.map((cat) => (
          <section key={cat.id} style={{ marginBottom: '30px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '15px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                <Bookmark size={18} fill={THEME_COLORS.accentRed} color={THEME_COLORS.accentRed} />
                {editingCategoryId === cat.id ? (
                  <div style={{ display: 'flex', gap: '8px', flex: 1 }}>
                    <ChicInput value={editingCategoryName} onChange={(e) => setEditingCategoryName(e.target.value)} style={{ marginBottom: 0 }} autoFocus />
                    <ChicButton onClick={() => { onUpdateCategory(cat.id, editingCategoryName); setEditingCategoryId(null); }}><Check size={16}/></ChicButton>
                  </div>
                ) : <ChicTypography variant="h3" style={{ color: THEME_COLORS.text.primary }}>{cat.name}</ChicTypography>}
              </div>
              {isManagementMode && (
                <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                  <Edit2 size={16} color={THEME_COLORS.text.secondary} onClick={() => { setEditingCategoryId(cat.id); setEditingCategoryName(cat.name); }} style={{cursor: 'pointer'}} />
                  <Trash2 size={16} color={THEME_COLORS.text.secondary} onClick={() => onDeleteCategory(cat)} style={{cursor: 'pointer'}} />
                </div>
              )}
            </div>

            <Droppable droppableId={cat.id} direction="horizontal">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef} style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', minHeight: '80px' }}>
                  {materials.filter(m => m.categoryId === cat.id).map((mat, index) => (
                    <Draggable key={mat.id} draggableId={mat.id} index={index} isDragDisabled={reorderMode !== 'material'}>
                      {(provided, snapshot) => {
                        const draggableContent = (
                          <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} 
                            style={{ ...provided.draggableProps.style, width: snapshot.isDragging ? '100px' : 'calc(33.333% - 10px)', position: snapshot.isDragging ? 'fixed' : 'relative', zIndex: snapshot.isDragging ? 9999 : 1 }}
                          >
                            <div onClick={() => reorderMode === 'none' && !isManagementMode && setActiveMaterialId(mat.id)}
                              style={{ width: '100%', aspectRatio: '1/1', backgroundColor: snapshot.isDragging ? THEME_COLORS.surface : THEME_COLORS.background, borderRadius: '8px', border: snapshot.isDragging ? `2px solid ${THEME_COLORS.accentRed}` : `1px solid ${THEME_COLORS.surface}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                            >
                              {reorderMode === 'material' ? <GripVertical size={20} color={THEME_COLORS.text.secondary} /> : <Timer size={20} color={THEME_COLORS.text.secondary} />}
                              {isManagementMode && editingMaterialId !== mat.id && (
                                <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', borderRadius: '8px' }}>
                                  <Edit2 size={18} color="#fff" onClick={() => { setEditingMaterialId(mat.id); setEditingMaterialName(mat.name); }} style={{ cursor: 'pointer' }} />
                                  <Trash2 size={18} color={THEME_COLORS.accentRed} onClick={() => onDeleteMaterial(mat.id)} style={{ cursor: 'pointer' }} />
                                </div>
                              )}
                            </div>
                            {editingMaterialId === mat.id ? (
                              <div style={{marginTop: '8px'}}>
                                <ChicInput value={editingMaterialName} onChange={e => setEditingMaterialName(e.target.value)} style={{ padding: '5px', fontSize: '11px' }} autoFocus />
                                <div style={{display:'flex', gap:'3px'}}><ChicButton onClick={() => { onUpdateMaterial(mat.id, editingMaterialName); setEditingMaterialId(null); }} style={{ padding:'4px' }}><Check size={12}/></ChicButton><ChicButton variant="cancel" onClick={() => setEditingMaterialId(null)} style={{ padding:'4px' }}><X size={12}/></ChicButton></div>
                              </div>
                            ) : <p style={{ fontSize: '11px', color: THEME_COLORS.text.secondary, marginTop: '8px', textAlign: 'center' }}>{mat.name}</p>}
                          </div>
                        );
                        if (snapshot.isDragging) return ReactDOM.createPortal(draggableContent, document.body);
                        return draggableContent;
                      }}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </section>
        ))}
      </DragDropContext>
    </div>
  );
};

export default RecordView;