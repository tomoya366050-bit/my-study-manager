import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import DatePicker, { registerLocale } from "react-datepicker";
import ja from "date-fns/locale/ja";
import "react-datepicker/dist/react-datepicker.css";
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Timer, Plus, Settings2, Check, X, Bookmark, Edit2, Trash2, ArrowLeft, Pause, Play, Save, Calendar as CalendarIcon, ArrowUpDown, GripVertical, ChevronDown, ChevronUp, CheckCircle2, RotateCcw } from 'lucide-react';
import ChicCard from '../../common/ChicCard';
import ChicButton from '../../common/ChicButton';
import ChicInput from '../../common/ChicInput';
import ChicSelect from '../../common/ChicSelect';
import ChicTypography from '../../common/ChicTypography';

import { THEME_COLORS } from '../../../styles/theme';

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
  const [editingCategory, setEditingCategory] = useState(null); 
  const [reorderMode, setReorderMode] = useState('none'); 
  const [isEditMenuOpen, setIsEditMenuOpen] = useState(false);
  const [isCompletedExpanded, setIsCompletedExpanded] = useState(false);

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

  // --- カテゴリセクションの描画（インラインステータス変更対応） ---
  const renderCategorySection = (cat) => {
    const isCompleted = cat.status === 'completed';
    return (
      <section key={cat.id} style={{ marginBottom: '30px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '15px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
            <Bookmark size={18} fill={isCompleted ? THEME_COLORS.text.muted : THEME_COLORS.accentRed} color={isCompleted ? THEME_COLORS.text.muted : THEME_COLORS.accentRed} style={{ flexShrink: 0 }} />
            <ChicTypography variant="h3" style={{ color: isCompleted ? THEME_COLORS.text.secondary : THEME_COLORS.text.primary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cat.name}</ChicTypography>
            
            {/* ★新機能: 編集モード中のみ表示されるクイックステータス切替ボタン */}
            {isManagementMode && (
              <button 
                onClick={() => onUpdateCategory(cat.id, cat.name, isCompleted ? 'active' : 'completed')}
                style={{ 
                  marginLeft: '8px', padding: '4px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer', border: 'none', display: 'flex', alignItems: 'center', gap: '4px',
                  backgroundColor: isCompleted ? 'rgba(74, 222, 128, 0.1)' : 'rgba(156, 163, 175, 0.1)',
                  color: isCompleted ? '#4ade80' : THEME_COLORS.text.secondary
                }}
              >
                {isCompleted ? <><RotateCcw size={12}/> 学習中に戻す</> : <><CheckCircle2 size={12}/> 完了にする</>}
              </button>
            )}
          </div>

          {isManagementMode && (
            <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexShrink: 0 }}>
              <Edit2 size={16} color={THEME_COLORS.text.secondary} onClick={() => setEditingCategory({ id: cat.id, name: cat.name, status: cat.status || 'active' })} style={{cursor: 'pointer'}} />
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
                          {reorderMode === 'material' ? <GripVertical size={20} color={THEME_COLORS.text.secondary} /> : <Timer size={20} color={isCompleted ? THEME_COLORS.text.muted : THEME_COLORS.text.secondary} />}
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
                        ) : <p style={{ fontSize: '11px', color: isCompleted ? THEME_COLORS.text.muted : THEME_COLORS.text.secondary, marginTop: '8px', textAlign: 'center' }}>{mat.name}</p>}
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
    );
  };

  const activeCategories = categories.filter(c => c.status !== 'completed');
  const completedCategories = categories.filter(c => c.status === 'completed');

  return (
    <div key="record-list">
      {/* ヘッダー */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <ChicTypography variant="h2" style={{ marginBottom: 0, fontWeight: 'bold', color: THEME_COLORS.text.primary }}>
          {reorderMode !== 'none' ? '並べ替え中' : isManagementMode ? 'リスト編集中' : '記録する'}
        </ChicTypography>
        
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <Settings2 size={24} onClick={() => setIsEditMenuOpen(!isEditMenuOpen)} style={{ cursor: 'pointer', color: (isManagementMode || reorderMode !== 'none') ? THEME_COLORS.accentRed : THEME_COLORS.text.secondary }} />
            {isEditMenuOpen && (
              <ChicCard style={{ position: 'absolute', top: '35px', right: 0, zIndex: 100, width: '220px', border: `1px solid ${THEME_COLORS.surface}` }} padding="8px">
                <button onClick={() => { setIsManagementMode(!isManagementMode); setReorderMode('none'); setIsEditMenuOpen(false); }} style={{ width: '100%', padding: '12px', background: 'none', border: 'none', color: isManagementMode ? THEME_COLORS.accentRed : THEME_COLORS.text.primary, textAlign: 'left', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', borderRadius: '8px', backgroundColor: isManagementMode ? `${THEME_COLORS.accentRed}1A` : 'transparent' }}>
                  <Edit2 size={16}/> {isManagementMode ? '編集モードを終了' : 'リスト・ステータスの編集'}
                </button>
                <div style={{ height: '1px', backgroundColor: THEME_COLORS.surface, margin: '8px 0' }} />
                <div style={{ padding: '4px 12px', fontSize: '11px', color: THEME_COLORS.text.muted, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <ArrowUpDown size={12}/> リストの並べ替え
                </div>
                <button onClick={() => { setReorderMode('category'); setIsManagementMode(false); setIsEditMenuOpen(false); }} style={{ width: '100%', padding: '10px 12px 10px 34px', background: 'none', border: 'none', color: reorderMode === 'category' ? THEME_COLORS.accentRed : THEME_COLORS.text.primary, textAlign: 'left', fontSize: '13px', cursor: 'pointer', borderRadius: '8px', backgroundColor: reorderMode === 'category' ? `${THEME_COLORS.accentRed}1A` : 'transparent' }}>
                  ・カテゴリ
                </button>
                <button onClick={() => { setReorderMode('material'); setIsManagementMode(false); setIsEditMenuOpen(false); }} style={{ width: '100%', padding: '10px 12px 10px 34px', background: 'none', border: 'none', color: reorderMode === 'material' ? THEME_COLORS.accentRed : THEME_COLORS.text.primary, textAlign: 'left', fontSize: '13px', cursor: 'pointer', borderRadius: '8px', backgroundColor: reorderMode === 'material' ? `${THEME_COLORS.accentRed}1A` : 'transparent' }}>
                  ・教材
                </button>
              </ChicCard>
            )}
          </div>
          <Plus size={24} onClick={() => setIsAddMenuOpen(!isAddMenuOpen)} style={{ cursor: 'pointer', color: isAddMenuOpen ? THEME_COLORS.accentRed : THEME_COLORS.text.secondary }} />
        </div>
      </div>

      {/* カテゴリ並べ替え（既存） */}
      {reorderMode === 'category' && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.95)', zIndex: 2000, padding: '40px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', overflowY: 'auto' }}>
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
                              {cat.status === 'completed' && <span style={{ fontSize: '10px', color: THEME_COLORS.text.muted, border: `1px solid ${THEME_COLORS.surface}`, padding: '2px 6px', borderRadius: '10px', marginLeft: 'auto' }}>完了</span>}
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
            <ChicButton onClick={() => setReorderMode('none')} style={{ width: '100%', marginTop: '30px', marginBottom: '40px' }}>完了</ChicButton>
          </div>
        </div>
      )}

      {/* 追加メニュー（既存） */}
      {isAddMenuOpen && (
        <ChicCard padding="10px">
          <div style={{ display: 'flex', backgroundColor: THEME_COLORS.surface, borderRadius: '12px', padding: '4px', marginBottom: '20px' }}>
            <button style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', color: addType === 'category' ? '#fff' : THEME_COLORS.text.secondary, backgroundColor: addType === 'category' ? '#333' : 'transparent', cursor: 'pointer' }} onClick={() => setAddType('category')}>カテゴリ</button>
            <button style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', color: addType === 'material' ? '#fff' : THEME_COLORS.text.secondary, backgroundColor: addType === 'material' ? '#333' : 'transparent', cursor: 'pointer' }} onClick={() => setAddType('material')}>教材</button>
          </div>
          <div style={{padding: '0 10px 10px'}}>
            {addType === 'category' ? <ChicInput value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} placeholder="カテゴリ名を入力..." autoFocus /> : <>
                <ChicSelect value={selectedCategoryId} onChange={e => setSelectedCategoryId(e.target.value)} options={activeCategories} placeholder="カテゴリを選択" />
                <ChicInput value={newMaterialName} onChange={e => setNewMaterialName(e.target.value)} placeholder="教材名を入力..." />
              </>}
            <div style={{ display: 'flex', gap: '10px' }}>
              <ChicButton onClick={() => { 
                if(addType === 'category'){ 
                  if(!newCategoryName.trim()) return;
                  onAddCategory(newCategoryName); 
                  setNewCategoryName(""); 
                } else { 
                  if(!newMaterialName.trim() || !selectedCategoryId) return;
                  onAddMaterial(newMaterialName, selectedCategoryId); 
                  setNewMaterialName("");
                  setSelectedCategoryId("");
                }
                setIsAddMenuOpen(false);
              }}>
                <Check size={18}/>登録
              </ChicButton>
              <ChicButton variant="cancel" onClick={() => setIsAddMenuOpen(false)} style={{ width: '50px', flex: 'none' }}><X size={18}/></ChicButton>
            </div>
          </div>
        </ChicCard>
      )}

      {/* リスト表示 */}
      <DragDropContext onDragEnd={onDragEnd}>
        {activeCategories.length === 0 && completedCategories.length === 0 ? (
           <ChicTypography variant="body" style={{ textAlign: 'center', marginTop: '40px', color: THEME_COLORS.text.muted }}>右上の＋ボタンから追加してください</ChicTypography>
        ) : (
          activeCategories.map(cat => renderCategorySection(cat))
        )}

        {completedCategories.length > 0 && (
          <div style={{ marginTop: '50px' }}>
            <div 
              onClick={() => setIsCompletedExpanded(!isCompletedExpanded)}
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 20px', backgroundColor: THEME_COLORS.background, border: `1px solid ${THEME_COLORS.surface}`, borderRadius: '12px', cursor: 'pointer', marginBottom: '20px' }}
            >
              <span style={{ fontSize: '14px', fontWeight: 'bold', color: THEME_COLORS.text.secondary }}>完了済みのカテゴリ ({completedCategories.length})</span>
              {isCompletedExpanded ? <ChevronUp size={20} color={THEME_COLORS.text.secondary}/> : <ChevronDown size={20} color={THEME_COLORS.text.secondary}/>}
            </div>
            {isCompletedExpanded && completedCategories.map(cat => renderCategorySection(cat))}
          </div>
        )}
      </DragDropContext>

      {/* 名前変更用ポップアップ（ステータス変更はインライン化したため、名前変更のみに集中） */}
      {editingCategory && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 3000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
          <ChicCard style={{ width: '100%', maxWidth: '350px' }}>
            <ChicTypography variant="h3" style={{ marginBottom: '20px' }}>カテゴリ名の変更</ChicTypography>
            <ChicTypography variant="label" style={{ display:'block', marginBottom: '8px' }}>カテゴリ名</ChicTypography>
            <ChicInput value={editingCategory.name} onChange={e => setEditingCategory({...editingCategory, name: e.target.value})} autoFocus />
            
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <ChicButton onClick={() => { 
                if (!editingCategory.name.trim()) return;
                onUpdateCategory(editingCategory.id, editingCategory.name, editingCategory.status); 
                setEditingCategory(null); 
              }} style={{ flex: 1 }}>
                <Check size={18}/> 保存
              </ChicButton>
              <ChicButton variant="cancel" onClick={() => setEditingCategory(null)} style={{ width: '60px' }}><X size={18}/></ChicButton>
            </div>
          </ChicCard>
        </div>
      )}
    </div>
  );
};

export default RecordView;