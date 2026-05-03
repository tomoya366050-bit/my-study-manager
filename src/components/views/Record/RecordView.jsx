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

registerLocale('ja', ja);

const RecordView = ({ 
  categories, materials, activeMaterialId, isManagementMode, 
  isAddMenuOpen, addType, seconds, isRunning, ACCENT_RED,
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

  // ★追加：「戻る」時の破棄確認ロジック
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
        {/* ★修正：handleBackWithConfirmation を呼び出すように変更 */}
        <button onClick={handleBackWithConfirmation} style={{ background: 'none', border: 'none', color: '#555', display: 'flex', alignItems: 'center', marginBottom: '20px', cursor: 'pointer' }}><ArrowLeft size={18} /> 戻る</button>
        
        <div style={{ textAlign: 'center', marginBottom: '10px' }}>
          <ChicTypography variant="caption" style={{ color: '#888', display: 'block', marginBottom: '4px', fontSize: '14px' }}>
            {category?.name || "カテゴリなし"}
          </ChicTypography>
          <ChicTypography variant="h2" style={{ color: ACCENT_RED, margin: 0 }}>
            {material?.name}
          </ChicTypography>
        </div>

        <div style={{ fontSize: '5rem', textAlign: 'center', margin: '40px 0', fontFamily: 'monospace', fontWeight: '100' }}>
          {Math.floor(seconds/3600)}:{Math.floor((seconds%3600)/60).toString().padStart(2,'0')}:{(seconds%60).toString().padStart(2,'0')}
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'center', gap: '30px', marginBottom: '60px' }}>
          <button onClick={() => setIsRunning(!isRunning)} style={{ width: '80px', height: '80px', borderRadius: '50%', border: '1px solid #333', backgroundColor: isRunning ? '#111' : ACCENT_RED, color: '#fff', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>{isRunning ? <Pause size={30}/> : <Play size={30}/>}</button>
          <button onClick={() => onSaveLog(material)} style={{ width: '80px', height: '80px', borderRadius: '50%', border: '1px solid #333', backgroundColor: '#000', color: '#fff', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center' }}><Save size={30}/></button>
        </div>

        <div style={{ borderTop: '1px solid #1a1a1a', paddingTop: '30px' }}>
          <ChicTypography variant="label" style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}><CalendarIcon size={14}/> 日付を選択して記録を追加</ChicTypography>
          <ChicCard padding="20px">
            <DatePicker selected={manualDate} onChange={(date) => setManualDate(date)} maxDate={new Date()} locale="ja" dateFormat="yyyy/MM/dd" customInput={<ChicInput style={{ marginBottom: 0 }} />} popperPlacement="top-start" />
            <div style={{ display: 'flex', gap: '15px', alignItems: 'center', margin: '20px 0' }}>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}><ChicInput type="number" placeholder="0" value={manualHours} onChange={e => setManualHours(e.target.value)} style={{ marginBottom: 0 }} /><span style={{ fontSize: '12px', color: '#555' }}>時</span></div>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}><ChicInput type="number" placeholder="0" value={manualMinutes} onChange={e => setManualMinutes(e.target.value)} style={{ marginBottom: 0 }} /><span style={{ fontSize: '12px', color: '#555' }}>分</span></div>
            </div>
            {errorMessage && <p style={{ color: ACCENT_RED, fontSize: '12px', marginBottom: '15px', textAlign: 'center' }}>{errorMessage}</p>}
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
        <ChicTypography variant="h2" style={{ marginBottom: 0, fontWeight: 'bold' }}>{reorderMode !== 'none' ? '並べ替え中' : '記録する'}</ChicTypography>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <ArrowUpDown size={22} onClick={() => setIsReorderMenuOpen(!isReorderMenuOpen)} style={{ cursor: 'pointer', color: reorderMode !== 'none' ? ACCENT_RED : '#333' }} />
            {isReorderMenuOpen && (
              <ChicCard style={{ position: 'absolute', top: '35px', right: 0, zIndex: 100, width: '180px', border: '1px solid #333' }} padding="5px">
                <button onClick={() => { setReorderMode('category'); setIsReorderMenuOpen(false); setIsManagementMode(false); }} style={{ width: '100%', padding: '12px', background: 'none', border: 'none', color: '#fff', textAlign: 'left', fontSize: '13px' }}>カテゴリの並べ替え</button>
                <div style={{ height: '1px', backgroundColor: '#111' }} />
                <button onClick={() => { setReorderMode('material'); setIsReorderMenuOpen(false); setIsManagementMode(false); }} style={{ width: '100%', padding: '12px', background: 'none', border: 'none', color: '#fff', textAlign: 'left', fontSize: '13px' }}>教材の並べ替え</button>
                {reorderMode !== 'none' && <button onClick={() => { setReorderMode('none'); setIsReorderMenuOpen(false); }} style={{ width: '100%', padding: '12px', background: 'none', border: 'none', color: ACCENT_RED, textAlign: 'left', fontSize: '13px', fontWeight: 'bold' }}>終了</button>}
              </ChicCard>
            )}
          </div>
          <Settings2 size={24} onClick={() => { setIsManagementMode(!isManagementMode); setReorderMode('none'); }} style={{ cursor: 'pointer', color: isManagementMode ? ACCENT_RED : '#333' }} />
          <Plus size={24} onClick={() => setIsAddMenuOpen(!isAddMenuOpen)} style={{ cursor: 'pointer', color: isAddMenuOpen ? ACCENT_RED : '#333' }} />
        </div>
      </div>

      {reorderMode === 'category' && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.95)', zIndex: 2000, padding: '40px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ width: '100%', maxWidth: '400px' }}>
            <ChicTypography variant="h2">カテゴリの並べ替え</ChicTypography>
            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="categories-list">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef}>
                    <ChicCard padding="0">
                      {categories.map((cat, index) => (
                        <Draggable key={cat.id} draggableId={cat.id} index={index}>
                          {(provided) => (
                            <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} style={{ ...provided.draggableProps.style, display: 'flex', alignItems: 'center', gap: '15px', padding: '20px', borderBottom: '1px solid #111' }}>
                              <GripVertical size={20} color="#444" />
                              <span style={{ fontSize: '16px' }}>{cat.name}</span>
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
          <div style={{ display: 'flex', backgroundColor: '#111', borderRadius: '12px', padding: '4px', marginBottom: '20px' }}>
            <button style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', color: addType === 'category' ? '#fff' : '#555', backgroundColor: addType === 'category' ? '#222' : 'transparent' }} onClick={() => setAddType('category')}>カテゴリ</button>
            <button style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', color: addType === 'material' ? '#fff' : '#555', backgroundColor: addType === 'material' ? '#222' : 'transparent' }} onClick={() => setAddType('material')}>教材</button>
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
                <Bookmark size={18} fill={ACCENT_RED} color={ACCENT_RED} />
                {editingCategoryId === cat.id ? (
                  <div style={{ display: 'flex', gap: '8px', flex: 1 }}>
                    <ChicInput value={editingCategoryName} onChange={(e) => setEditingCategoryName(e.target.value)} style={{ marginBottom: 0 }} autoFocus />
                    <ChicButton onClick={() => { onUpdateCategory(cat.id, editingCategoryName); setEditingCategoryId(null); }}><Check size={16}/></ChicButton>
                  </div>
                ) : <ChicTypography variant="h3">{cat.name}</ChicTypography>}
              </div>
              {isManagementMode && (
                <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                  <Edit2 size={16} color="#444" onClick={() => { setEditingCategoryId(cat.id); setEditingCategoryName(cat.name); }} style={{cursor: 'pointer'}} />
                  <Trash2 size={16} color="#444" onClick={() => onDeleteCategory(cat)} style={{cursor: 'pointer'}} />
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
                              style={{ width: '100%', aspectRatio: '1/1', backgroundColor: snapshot.isDragging ? '#111' : '#0a0a0a', borderRadius: '8px', border: snapshot.isDragging ? `2px solid ${ACCENT_RED}` : '1px solid #1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                              {reorderMode === 'material' ? <GripVertical size={20} color="#444" /> : <Timer size={20} color="#222" />}
                              {isManagementMode && editingMaterialId !== mat.id && (
                                <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', borderRadius: '8px' }}>
                                  <Edit2 size={18} color="#fff" onClick={() => { setEditingMaterialId(mat.id); setEditingMaterialName(mat.name); }} />
                                  <Trash2 size={18} color={ACCENT_RED} onClick={() => onDeleteMaterial(mat.id)} />
                                </div>
                              )}
                            </div>
                            {editingMaterialId === mat.id ? (
                              <div style={{marginTop: '8px'}}>
                                <ChicInput value={editingMaterialName} onChange={e => setEditingMaterialName(e.target.value)} style={{ padding: '5px', fontSize: '11px' }} autoFocus />
                                <div style={{display:'flex', gap:'3px'}}><ChicButton onClick={() => { onUpdateMaterial(mat.id, editingMaterialName); setEditingMaterialId(null); }} style={{ padding:'4px' }}><Check size={12}/></ChicButton><ChicButton variant="cancel" onClick={() => setEditingMaterialId(null)} style={{ padding:'4px' }}><X size={12}/></ChicButton></div>
                              </div>
                            ) : <p style={{ fontSize: '11px', color: '#555', marginTop: '8px', textAlign: 'center' }}>{mat.name}</p>}
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