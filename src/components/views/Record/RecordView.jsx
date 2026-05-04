import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import DatePicker, { registerLocale } from "react-datepicker";
import ja from 'date-fns/locale/ja';
import "react-datepicker/dist/react-datepicker.css";
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Timer, Plus, Settings2, Check, X, Bookmark, Edit2, Trash2, ArrowLeft, Pause, Play, Save, Calendar as CalendarIcon, ArrowUpDown, GripVertical, ChevronDown, ChevronUp, CheckCircle2, RotateCcw } from 'lucide-react';
import ChicCard from '../../common/ChicCard';
import ChicButton from '../../common/ChicButton';
import ChicInput from '../../common/ChicInput';
import ChicSelect from '../../common/ChicSelect';
import ChicTypography from '../../common/ChicTypography';

import { THEME_COLORS } from '../../../styles/theme';
import { DateUtils } from '../../../utils/DateUtils';
import { ValidationUtils } from '../../../utils/ValidationUtils';

registerLocale('ja', ja);

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
  const [categoryErrorMessage, setCategoryErrorMessage] = useState("");

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
    setErrorMessage("");
  };

  const isCategoryNameDuplicate = (name, ignoreId = null) => {
    const trimmedName = name.trim();
    return categories.some(cat => cat.name === trimmedName && cat.id !== ignoreId);
  };

  const onDragEnd = (result) => {
    if (!result.destination) return;
    if (reorderMode === 'category') {
      const items = Array.from(sortedCategoriesForReorder);
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

  const renderCategorySection = (cat) => {
    const isCompleted = cat.status === 'completed';
    return (
      <section key={cat.id} style={{ marginBottom: '30px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '15px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
            <Bookmark size={18} fill={isCompleted ? THEME_COLORS.text.muted : THEME_COLORS.accentRed} color={isCompleted ? THEME_COLORS.text.muted : THEME_COLORS.accentRed} style={{ flexShrink: 0 }} />
            <ChicTypography variant="h3" style={{ color: isCompleted ? THEME_COLORS.text.secondary : THEME_COLORS.text.primary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cat.name}</ChicTypography>
            
            {isManagementMode && (
              <button 
                onClick={(e) => {
                  e.stopPropagation(); 
                  onUpdateCategory(cat.id, cat.name, isCompleted ? 'active' : 'completed');
                }}
                style={{ 
                  marginLeft: '8px', padding: '4px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer', border: 'none', display: 'flex', alignItems: 'center', gap: '4px',
                  backgroundColor: isCompleted ? 'rgba(74, 222, 128, 0.1)' : 'rgba(156, 163, 175, 0.1)',
                  color: isCompleted ? '#4ade80' : THEME_COLORS.text.secondary
                }}
              >
                {isCompleted ? <><RotateCcw size={12}/> 戻す</> : <><CheckCircle2 size={12}/> 完了</>}
              </button>
            )}
          </div>

          {isManagementMode && (
            <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexShrink: 0 }}>
              <Edit2 size={16} color={THEME_COLORS.text.secondary} onClick={(e) => { 
                e.stopPropagation(); 
                setEditingCategory({ id: cat.id, name: cat.name, status: cat.status || 'active' }); 
                setCategoryErrorMessage(""); 
              }} style={{cursor: 'pointer'}} />
              <Trash2 size={16} color={THEME_COLORS.text.secondary} onClick={(e) => { 
                e.stopPropagation(); 
                onDeleteCategory(cat); 
              }} style={{cursor: 'pointer'}} />
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
                          style={{ width: '100%', aspectRatio: '1/1', backgroundColor: snapshot.isDragging ? THEME_COLORS.surface : THEME_COLORS.background, borderRadius: '8px', border: snapshot.isDragging ? `2px solid ${THEME_COLORS.accentRed}` : `1px solid ${THEME_COLORS.surface}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative' }}
                        >
                          {reorderMode === 'material' ? <GripVertical size={20} color={THEME_COLORS.text.secondary} /> : <Timer size={20} color={isCompleted ? THEME_COLORS.text.muted : THEME_COLORS.text.secondary} />}
                          
                          {isManagementMode && editingMaterialId !== mat.id && (
                            <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', borderRadius: '8px' }}>
                              <Edit2 size={18} color="#fff" onClick={(e) => { 
                                e.stopPropagation(); 
                                setEditingMaterialId(mat.id); 
                                setEditingMaterialName(mat.name); 
                              }} style={{ cursor: 'pointer' }} />
                              <Trash2 size={18} color={THEME_COLORS.accentRed} onClick={(e) => { 
                                e.stopPropagation(); 
                                onDeleteMaterial(mat.id); 
                              }} style={{ cursor: 'pointer' }} />
                            </div>
                          )}
                        </div>
                        {editingMaterialId === mat.id ? (
                          <div style={{marginTop: '8px'}}>
                            <ChicInput value={editingMaterialName} onChange={e => setEditingMaterialName(e.target.value)} style={{ padding: '5px', fontSize: '11px' }} autoFocus />
                            <div style={{display:'flex', gap:'3px'}}>
                              <ChicButton onClick={(e) => { 
                                e.stopPropagation();
                                if (!ValidationUtils.isRequired(editingMaterialName)) return;
                                onUpdateMaterial(mat.id, editingMaterialName); 
                                setEditingMaterialId(null); 
                              }} style={{ padding:'4px' }}>
                                <Check size={12}/>
                              </ChicButton>
                              <ChicButton variant="cancel" onClick={(e) => { e.stopPropagation(); setEditingMaterialId(null); }} style={{ padding:'4px' }}>
                                <X size={12}/>
                              </ChicButton>
                            </div>
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

  const sortedCategoriesForReorder = [...categories].sort((a, b) => {
    if (a.status === 'completed' && b.status !== 'completed') return 1;
    if (a.status !== 'completed' && b.status === 'completed') return -1;
    return a.sortIndex - b.sortIndex;
  });

  if (activeMaterialId) {
    const material = materials.find(m => m.id === activeMaterialId);
    const category = categories.find(c => c.id === material?.categoryId);

    return (
      <div key="timer">
        <style>{`
          .react-datepicker__day--outside-month {
            visibility: hidden !important;
            pointer-events: none !important;
          }
        `}</style>

        <button onClick={handleBackWithConfirmation} style={{ background: 'none', border: 'none', color: THEME_COLORS.text.secondary, display: 'flex', alignItems: 'center', marginBottom: '20px', cursor: 'pointer' }}><ArrowLeft size={18} style={{ marginRight: '4px' }} /> 戻る</button>
        <div style={{ textAlign: 'center', marginBottom: '10px' }}>
          <ChicTypography variant="caption" style={{ color: THEME_COLORS.text.secondary, display: 'block', marginBottom: '4px', fontSize: '14px' }}>
            {category?.name || "カテゴリなし"}
          </ChicTypography>
          <ChicTypography variant="h2" style={{ color: THEME_COLORS.accentRed, margin: 0 }}>{material?.name}</ChicTypography>
        </div>
        <div style={{ fontSize: '5rem', textAlign: 'center', margin: '40px 0', fontFamily: 'monospace', fontWeight: '100', color: THEME_COLORS.text.primary }}>
          {DateUtils.formatSecondsToHMS(seconds)}
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '30px', marginBottom: '60px' }}>
          <button onClick={() => setIsRunning()} style={{ width: '80px', height: '80px', borderRadius: '50%', border: `1px solid ${THEME_COLORS.surface}`, backgroundColor: isRunning ? THEME_COLORS.surface : THEME_COLORS.accentRed, color: '#fff', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>{isRunning ? <Pause size={30}/> : <Play size={30}/>}</button>
          <button onClick={() => onSaveLog(material)} style={{ width: '80px', height: '80px', borderRadius: '50%', border: `1px solid ${THEME_COLORS.surface}`, backgroundColor: THEME_COLORS.background, color: '#fff', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center' }}><Save size={30}/></button>
        </div>
        <div style={{ borderTop: `1px solid ${THEME_COLORS.surface}`, paddingTop: '30px' }}>
          <ChicTypography variant="h3" style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px', color: THEME_COLORS.text.primary }}><CalendarIcon size={14}/> 手動で追加</ChicTypography>
          <ChicCard padding="20px">
            <DatePicker 
              selected={manualDate} 
              onChange={(date) => setManualDate(date)} 
              onFocus={(e) => e.target.blur()}
              maxDate={new Date()} 
              locale="ja" 
              dateFormat="yyyy/MM/dd" 
              fixedHeight
              customInput={<ChicInput style={{ marginBottom: 0 }} readOnly inputMode="none" />} 
              popperPlacement="top-start" 
            />
            <div style={{ display: 'flex', gap: '15px', alignItems: 'center', margin: '20px 0' }}>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ChicInput type="number" min="0" placeholder="0" value={manualHours} onChange={e => setManualHours(e.target.value.replace(/-/g, ''))} style={{ marginBottom: 0 }} />
                <span style={{ fontSize: '12px', color: THEME_COLORS.text.secondary }}>時</span>
              </div>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ChicInput type="number" min="0" placeholder="0" value={manualMinutes} onChange={e => setManualMinutes(e.target.value.replace(/-/g, ''))} style={{ marginBottom: 0 }} />
                <span style={{ fontSize: '12px', color: THEME_COLORS.text.secondary }}>分</span>
              </div>
            </div>
            {errorMessage && <p style={{ color: THEME_COLORS.accentRed, fontSize: '12px', marginBottom: '15px', textAlign: 'center' }}>{errorMessage}</p>}
            <ChicButton onClick={() => {
              const h = parseInt(manualHours) || 0; const m = parseInt(manualMinutes) || 0; const totalSec = (h * 3600) + (m * 60);
              if (totalSec <= 0 || totalSec > 86400) { setErrorMessage("学習時間は1分以上で入力してください"); return; }
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
        <ChicTypography variant="h2" style={{ marginBottom: 0, fontWeight: 'bold', color: THEME_COLORS.text.primary }}>
          {reorderMode !== 'none' ? '並べ替え中' : isManagementMode ? 'リスト編集中' : '記録する'}
        </ChicTypography>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <Settings2 size={24} onClick={() => { 
              setIsEditMenuOpen(!isEditMenuOpen); 
              setIsAddMenuOpen(false); 
            }} style={{ cursor: 'pointer', color: (isManagementMode || reorderMode !== 'none') ? THEME_COLORS.accentRed : THEME_COLORS.text.secondary }} />
            {isEditMenuOpen && (
              <ChicCard style={{ position: 'absolute', top: '35px', right: 0, zIndex: 100, width: '220px', border: `1px solid ${THEME_COLORS.surface}` }} padding="8px">
                <button onClick={() => { setIsManagementMode(!isManagementMode); setReorderMode('none'); setIsEditMenuOpen(false); }} style={{ width: '100%', padding: '12px', background: 'none', border: 'none', color: isManagementMode ? THEME_COLORS.accentRed : THEME_COLORS.text.primary, textAlign: 'left', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', borderRadius: '8px', backgroundColor: isManagementMode ? `${THEME_COLORS.accentRed}1A` : 'transparent' }}>
                  <Edit2 size={16}/> {isManagementMode ? '終了' : 'リスト・ステータス編集'}
                </button>
                <div style={{ height: '1px', backgroundColor: THEME_COLORS.surface, margin: '8px 0' }} />
                <button onClick={() => { setReorderMode('category'); setIsManagementMode(false); setIsEditMenuOpen(false); }} style={{ width: '100%', padding: '10px 12px', background: 'none', border: 'none', color: THEME_COLORS.text.primary, textAlign: 'left', fontSize: '13px', cursor: 'pointer' }}>・カテゴリ並べ替え</button>
                <button onClick={() => { setReorderMode('material'); setIsManagementMode(false); setIsEditMenuOpen(false); }} style={{ width: '100%', padding: '10px 12px', background: 'none', border: 'none', color: THEME_COLORS.text.primary, textAlign: 'left', fontSize: '13px', cursor: 'pointer' }}>・教材並べ替え</button>
              </ChicCard>
            )}
          </div>
          <Plus size={24} onClick={() => { 
            setIsAddMenuOpen(!isAddMenuOpen);
            setIsEditMenuOpen(false); 
            setIsManagementMode(false); 
            setCategoryErrorMessage(""); 
          }} style={{ cursor: 'pointer', color: isAddMenuOpen ? THEME_COLORS.accentRed : THEME_COLORS.text.secondary }} />
        </div>
      </div>

      {reorderMode === 'category' && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.95)', zIndex: 2000, padding: '40px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', overflowY: 'auto' }}>
          <div style={{ width: '100%', maxWidth: '400px' }}>
            <ChicTypography variant="h2" style={{ color: THEME_COLORS.text.primary }}>カテゴリの並べ替え</ChicTypography>
            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="categories-list">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef}>
                    <ChicCard padding="0">
                      {sortedCategoriesForReorder.map((cat, index) => (
                        <Draggable key={cat.id} draggableId={cat.id} index={index}>
                          {(provided) => (
                            <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} style={{ ...provided.draggableProps.style, display: 'flex', alignItems: 'center', gap: '15px', padding: '20px', borderBottom: `1px solid ${THEME_COLORS.surface}`, opacity: cat.status === 'completed' ? 0.6 : 1 }}>
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
            <ChicButton onClick={() => {
               onReorderUpdate('categories', sortedCategoriesForReorder);
               setReorderMode('none');
            }} style={{ width: '100%', marginTop: '30px' }}>完了</ChicButton>
          </div>
        </div>
      )}

      {isAddMenuOpen && (
        <ChicCard padding="10px">
          <div style={{ display: 'flex', backgroundColor: THEME_COLORS.surface, borderRadius: '12px', padding: '4px', marginBottom: '20px' }}>
            <button style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', color: addType === 'category' ? '#fff' : THEME_COLORS.text.secondary, backgroundColor: addType === 'category' ? '#333' : 'transparent', cursor: 'pointer' }} onClick={() => { setAddType('category'); setCategoryErrorMessage(""); }}>カテゴリ</button>
            <button style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', color: addType === 'material' ? '#fff' : THEME_COLORS.text.secondary, backgroundColor: addType === 'material' ? '#333' : 'transparent', cursor: 'pointer' }} onClick={() => { setAddType('material'); setCategoryErrorMessage(""); }}>教材</button>
          </div>
          <div style={{padding: '0 10px 10px'}}>
            {addType === 'category' ? <ChicInput value={newCategoryName} onChange={e => {setNewCategoryName(e.target.value); setCategoryErrorMessage("");}} placeholder="カテゴリ名を入力..." autoFocus /> : <>
                <ChicSelect value={selectedCategoryId} onChange={e => setSelectedCategoryId(e.target.value)} options={activeCategories} placeholder="カテゴリを選択" />
                <ChicInput value={newMaterialName} onChange={e => setNewMaterialName(e.target.value)} placeholder="教材名を入力..." />
              </>}
            {categoryErrorMessage && <div style={{ color: THEME_COLORS.accentRed, fontSize: '12px', marginBottom: '10px' }}>{categoryErrorMessage}</div>}
            <div style={{ display: 'flex', gap: '10px' }}>
              <ChicButton onClick={() => { 
                if(addType === 'category'){ 
                  if(!ValidationUtils.isRequired(newCategoryName)) return;
                  if (isCategoryNameDuplicate(newCategoryName)) { setCategoryErrorMessage("登録済みのカテゴリです"); return; }
                  onAddCategory(newCategoryName); setNewCategoryName(""); 
                } else { 
                  if(!ValidationUtils.isRequired(newMaterialName) || !selectedCategoryId) return;
                  onAddMaterial(newMaterialName, selectedCategoryId); setNewMaterialName(""); setSelectedCategoryId("");
                }
                setIsAddMenuOpen(false);
              }}><Check size={18}/>登録</ChicButton>
              <ChicButton variant="cancel" onClick={() => setIsAddMenuOpen(false)} style={{ width: '50px', flex: 'none' }}><X size={18}/></ChicButton>
            </div>
          </div>
        </ChicCard>
      )}

      <DragDropContext onDragEnd={onDragEnd}>
        {activeCategories.length === 0 && completedCategories.length === 0 ? (
           <ChicTypography variant="body" style={{ textAlign: 'center', marginTop: '40px', color: THEME_COLORS.text.muted }}>右上の＋ボタンから追加してください</ChicTypography>
        ) : (
          activeCategories.map(cat => renderCategorySection(cat))
        )}
        {completedCategories.length > 0 && (
          <div style={{ marginTop: '50px' }}>
            <div onClick={() => setIsCompletedExpanded(!isCompletedExpanded)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 20px', backgroundColor: THEME_COLORS.background, border: `1px solid ${THEME_COLORS.surface}`, borderRadius: '12px', cursor: 'pointer', marginBottom: '20px' }}>
              <span style={{ fontSize: '14px', fontWeight: 'bold', color: THEME_COLORS.text.secondary }}>完了済みのカテゴリ ({completedCategories.length})</span>
              {isCompletedExpanded ? <ChevronUp size={20} color={THEME_COLORS.text.secondary}/> : <ChevronDown size={20} color={THEME_COLORS.text.secondary}/>}
            </div>
            {isCompletedExpanded && completedCategories.map(cat => renderCategorySection(cat))}
          </div>
        )}
      </DragDropContext>

      {editingCategory && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 3000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
          <ChicCard style={{ width: '100%', maxWidth: '350px' }}>
            <ChicTypography variant="h3" style={{ marginBottom: '20px' }}>カテゴリ名の変更</ChicTypography>
            <ChicInput value={editingCategory.name} onChange={e => {setEditingCategory({...editingCategory, name: e.target.value}); setCategoryErrorMessage("");}} autoFocus />
            {categoryErrorMessage && <div style={{ color: THEME_COLORS.accentRed, fontSize: '12px', marginBottom: '10px' }}>{categoryErrorMessage}</div>}
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <ChicButton onClick={(e) => { 
                e.stopPropagation();
                if (!ValidationUtils.isRequired(editingCategory.name)) return;
                if (isCategoryNameDuplicate(editingCategory.name, editingCategory.id)) { setCategoryErrorMessage("登録済みのカテゴリです"); return; }
                onUpdateCategory(editingCategory.id, editingCategory.name, editingCategory.status); 
                setEditingCategory(null); 
              }} style={{ flex: 1 }}><Check size={18}/> 保存</ChicButton>
              <ChicButton variant="cancel" onClick={(e) => { e.stopPropagation(); setEditingCategory(null); }} style={{ width: '60px' }}><X size={18}/></ChicButton>
            </div>
          </ChicCard>
        </div>
      )}
    </div>
  );
};

export default RecordView;