import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, BookOpen, Trash2, ChevronLeft, ChevronRight, Edit2, Check, X, Award, Calendar } from 'lucide-react';
import ChicCard from '../../common/ChicCard';
import ChicTypography from '../../common/ChicTypography';
import ChicInput from '../../common/ChicInput';

import { THEME_COLORS } from '../../../styles/theme';
import { DateUtils } from '../../../utils/DateUtils';
import { ValidationUtils } from '../../../utils/ValidationUtils';

const HistoryView = ({ logs, categories, goals, onDeleteLog, onUpdateLog, onDeleteGoal }) => {
  const [expandedCatId, setExpandedCatId] = useState(null);
  const [isCompletedGoalsExpanded, setIsCompletedGoalsExpanded] = useState(false); 
  const [currentMonth, setCurrentMonth] = useState(DateUtils.getToday());
  const [selectedDate, setSelectedDate] = useState(DateUtils.getToday());
  const [editingLogId, setEditingLogId] = useState(null);
  const [editHours, setEditHours] = useState("");
  const [editMinutes, setEditMinutes] = useState("");

  const safeGetDate = (timestamp) => timestamp && typeof timestamp.toDate === 'function' ? timestamp.toDate() : new Date(timestamp);
  const isSameDay = (d1, d2) => DateUtils.getDateKey(d1) === DateUtils.getDateKey(d2);

  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysArray = [];
    for (let i = 0; i < firstDayIndex; i++) { daysArray.push(null); }
    for (let i = 1; i <= daysInMonth; i++) { daysArray.push(new Date(year, month, i)); }
    return daysArray;
  }, [currentMonth]);

  const getDayTotalHours = (date) => {
    if (!date) return 0;
    const dayLogs = logs.filter(l => isSameDay(safeGetDate(l.createdAt), date) && categories.some(c => c.id === l.categoryId));
    const totalSec = dayLogs.reduce((acc, curr) => acc + curr.duration, 0);
    return (totalSec / 3600).toFixed(1);
  };

  const selectedDateLogs = useMemo(() => {
    return logs.filter(l => isSameDay(safeGetDate(l.createdAt), selectedDate) && categories.some(c => c.id === l.categoryId));
  }, [logs, selectedDate, categories]);

  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));

  const cumulativeStats = useMemo(() => {
    return categories.map(cat => {
      const catLogs = logs.filter(l => l.categoryId === cat.id);
      const totalSec = catLogs.reduce((acc, curr) => acc + curr.duration, 0);
      const materialMap = {};
      catLogs.forEach(log => {
        if (!materialMap[log.materialId]) { materialMap[log.materialId] = { name: log.materialName, duration: 0 }; }
        materialMap[log.materialId].duration += log.duration;
      });
      return { ...cat, totalSec, materials: Object.values(materialMap).sort((a, b) => b.duration - a.duration) };
    });
  }, [categories, logs]);

  const completedGoalsStats = useMemo(() => {
    return goals.filter(g => g.status === 'completed').map(goal => {
      const start = safeGetDate(goal.createdAt);
      const end = goal.completedAt ? safeGetDate(goal.completedAt) : new Date();
      const sDate = new Date(start).setHours(0,0,0,0);
      const eDate = new Date(end).setHours(0,0,0,0);
      const diffDays = Math.floor((eDate - sDate) / (1000 * 60 * 60 * 24)) + 1;

      const actualSec = goal.finalActualSec !== undefined ? goal.finalActualSec : 0;
      const displayCatNames = goal.categoryNames || [];

      return { 
        ...goal, 
        actualSec, 
        isSuccess: actualSec >= (goal.targetTime * 3600), 
        diffDays, 
        displayCatNames,
        periodText: `${DateUtils.formatTimestampToYMD(start)} 〜 ${DateUtils.formatTimestampToYMD(end)}` 
      };
    });
  }, [goals]);

  const formatTimeJSX = (totalSeconds, showDetail = false) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    if (h > 0) return (<span style={{ color: THEME_COLORS.accentRed, fontWeight: 'bold' }}>{h}<span style={{ fontSize: '10px', margin: '0 2px', fontWeight: 'normal', color: THEME_COLORS.text.muted }}>h</span>{m}<span style={{ fontSize: '10px', marginLeft: '2px', fontWeight: 'normal', color: THEME_COLORS.text.muted }}>m</span></span>);
    return (<span style={{ color: totalSeconds > 0 ? THEME_COLORS.accentRed : THEME_COLORS.text.primary, fontWeight: 'bold' }}>{(totalSeconds/60).toFixed(showDetail ? 1 : 0)}<span style={{ fontSize: '10px', marginLeft: '2px', fontWeight: 'normal', color: THEME_COLORS.text.muted }}>m</span></span>);
  };

  const startEdit = (log) => { setEditingLogId(log.id); setEditHours(Math.floor(log.duration / 3600).toString()); setEditMinutes(Math.floor((log.duration % 3600) / 60).toString()); };
  
  const handleSaveEdit = (logId) => {
    const h = parseInt(editHours || 0); 
    const m = parseInt(editMinutes || 0);
    const totalSec = (h * 3600) + (m * 60);
    
    if (totalSec <= 0) {
      alert("学習時間は1分以上で入力してください");
      return;
    }
    
    onUpdateLog(logId, totalSec);
    setEditingLogId(null);
  };

  return (
    <div style={{ width: '100%', boxSizing: 'border-box' }}>
      {/* カレンダーセクション */}
      <section style={{ marginBottom: '40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <button onClick={prevMonth} style={{ background: 'none', border: 'none', color: THEME_COLORS.text.primary, cursor: 'pointer' }}><ChevronLeft size={24} /></button>
          <ChicTypography variant="h2" style={{ margin: 0 }}>{currentMonth.getFullYear()}年 {currentMonth.getMonth() + 1}月</ChicTypography>
          <button onClick={nextMonth} style={{ background: 'none', border: 'none', color: THEME_COLORS.text.primary, cursor: 'pointer' }}><ChevronRight size={24} /></button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px' }}>
          {DateUtils.weekLabels.map((day, i) => (<div key={day} style={{ textAlign: 'center', fontSize: '12px', color: i === 0 ? THEME_COLORS.accentRed : THEME_COLORS.text.secondary, fontWeight: 'bold' }}>{day}</div>))}
          
          {calendarDays.map((date, index) => {
            if (!date) return <div key={`empty-${index}`} />;
            
            const isSelected = isSameDay(date, selectedDate);
            const isToday = isSameDay(date, DateUtils.getToday());
            const hoursStr = getDayTotalHours(date);
            const hours = parseFloat(hoursStr);

            // ★段階的なカラーリング（ヒートマップ）の計算
            let bgColor = THEME_COLORS.background;
            if (isSelected) {
              bgColor = THEME_COLORS.accentRed;
            } else if (hours > 0) {
              if (hours > 6) bgColor = `${THEME_COLORS.accentRed}CC`; // 80%不透明
              else if (hours > 3) bgColor = `${THEME_COLORS.accentRed}99`; // 60%不透明
              else if (hours > 1) bgColor = `${THEME_COLORS.accentRed}66`; // 40%不透明
              else bgColor = `${THEME_COLORS.accentRed}33`; // 20%不透明
            } else if (isToday) {
              bgColor = THEME_COLORS.surface;
            }

            return (
              <div 
                key={index} 
                onClick={() => setSelectedDate(date)} 
                style={{ 
                  backgroundColor: bgColor, 
                  border: `1px solid ${isSelected ? THEME_COLORS.accentRed : THEME_COLORS.surface}`, 
                  borderRadius: '8px', 
                  padding: '8px 0', 
                  textAlign: 'center', 
                  cursor: 'pointer', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '2px',
                  transition: 'background-color 0.2s ease'
                }}
              >
                <div style={{ 
                  fontSize: '14px', 
                  fontWeight: 'bold', 
                  color: (isSelected || hours > 3 || isToday) ? THEME_COLORS.text.primary : THEME_COLORS.text.secondary 
                }}>
                  {date.getDate()}
                </div>
                <div style={{ 
                  fontSize: '10px', 
                  color: (isSelected || hours > 3) ? '#FFFFFF' : (hours > 0 ? THEME_COLORS.text.primary : THEME_COLORS.text.muted) 
                }}>
                  {hoursStr}h
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 選択日の記録セクション */}
      <section style={{ marginBottom: '50px' }}>
        <ChicTypography variant="caption" style={{ display: 'block', marginBottom: '15px', color: THEME_COLORS.text.secondary, borderBottom: `1px solid ${THEME_COLORS.surface}`, paddingBottom: '5px' }}>{selectedDate.toLocaleDateString('ja-JP')} の記録</ChicTypography>
        {selectedDateLogs.length === 0 ? (<div style={{ textAlign: 'center', color: THEME_COLORS.text.muted, padding: '20px 0' }}>記録がありません</div>) : (
          selectedDateLogs.map(log => {
            const category = categories.find(c => c.id === log.categoryId);
            const isEditing = editingLogId === log.id;
            return (
              <ChicCard key={log.id} padding="15px" style={{ marginBottom: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <ChicTypography variant="caption" style={{ color: THEME_COLORS.text.secondary, fontSize: '11px', display: 'block' }}>{category?.name || "未分類"}</ChicTypography>
                    <ChicTypography variant="h3" style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: THEME_COLORS.text.primary }}>{log.materialName}</ChicTypography>
                    <div style={{ fontSize: '10px', color: THEME_COLORS.text.muted, marginTop: '4px' }}>{DateUtils.formatSecondsToHMS(log.duration)}</div>
                  </div>
                  {isEditing ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <ChicInput type="number" min="0" value={editHours} onChange={(e) => setEditHours(e.target.value.replace(/-/g, ''))} style={{ width: '45px', padding: '5px' }} /><span>h</span>
                      <ChicInput type="number" min="0" value={editMinutes} onChange={(e) => setEditMinutes(e.target.value.replace(/-/g, ''))} style={{ width: '45px', padding: '5px' }} /><span>m</span>
                      <Check size={20} color="#4ade80" onClick={() => handleSaveEdit(log.id)} style={{ cursor: 'pointer' }} /><X size={20} color="#f87171" onClick={() => setEditingLogId(null)} style={{ cursor: 'pointer' }} />
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                      <div style={{ textAlign: 'right', minWidth: '70px' }}>{formatTimeJSX(log.duration, true)}</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}><Edit2 size={14} color={THEME_COLORS.text.secondary} onClick={() => startEdit(log)} style={{ cursor: 'pointer' }} /><Trash2 size={14} color={THEME_COLORS.text.secondary} onClick={() => onDeleteLog(log.id)} style={{ cursor: 'pointer' }} /></div>
                    </div>
                  )}
                </div>
              </ChicCard>
            );
          })
        )}
      </section>

      {/* 完了した学習目標セクション */}
      {completedGoalsStats.length > 0 && (
        <section style={{ marginBottom: '40px' }}>
          <div onClick={() => setIsCompletedGoalsExpanded(!isCompletedGoalsExpanded)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 20px', backgroundColor: THEME_COLORS.background, border: `1px solid ${THEME_COLORS.surface}`, borderRadius: '12px', cursor: 'pointer', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><Award size={18} color={THEME_COLORS.accentRed} /><span style={{ fontSize: '14px', fontWeight: 'bold', color: THEME_COLORS.text.secondary }}>学習目標の履歴 ({completedGoalsStats.length})</span></div>
            {isCompletedGoalsExpanded ? <ChevronUp size={20} color={THEME_COLORS.text.secondary}/> : <ChevronDown size={20} color={THEME_COLORS.text.secondary}/>}
          </div>
          {isCompletedGoalsExpanded && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {completedGoalsStats.map((goal) => (
                <ChicCard key={goal.id} padding="15px">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <ChicTypography variant="h3" style={{ margin: 0, fontSize: '15px', color: THEME_COLORS.text.primary }}>{goal.title}</ChicTypography>
                        <div style={{ color: goal.isSuccess ? '#4ade80' : THEME_COLORS.accentRed, fontSize: '10px', fontWeight: 'bold', border: `1px solid ${goal.isSuccess ? '#4ade80' : THEME_COLORS.accentRed}`, padding: '1px 6px', borderRadius: '4px' }}>{goal.isSuccess ? 'SUCCESS' : 'FINISHED'}</div>
                      </div>
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '8px' }}>
                        {goal.displayCatNames.map((name, idx) => (<span key={idx} style={{ fontSize: '9px', color: THEME_COLORS.text.muted, backgroundColor: THEME_COLORS.surface, padding: '1px 5px', borderRadius: '3px' }}>{name}</span>))}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '11px', color: THEME_COLORS.text.muted }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Calendar size={12}/> 期間: {goal.periodText} ({goal.diffDays}日間)</div>
                        {goal.deadline && (<div style={{ paddingLeft: '16px' }}>期限: {DateUtils.formatTimestampToYMD(goal.deadline)}</div>)}
                        <div style={{ paddingLeft: '16px', marginTop: '4px', color: THEME_COLORS.text.secondary }}>実績: {(goal.actualSec / 3600).toFixed(1)}h / {goal.targetTime}h</div>
                      </div>
                    </div>
                    <Trash2 size={16} color={THEME_COLORS.text.muted} onClick={() => onDeleteGoal(goal.id)} style={{ cursor: 'pointer', marginLeft: '10px' }} />
                  </div>
                </ChicCard>
              ))}
            </div>
          )}
        </section>
      )}

      {/* カテゴリ別累計セクション */}
      <section style={{ marginBottom: '30px' }}>
        <ChicTypography variant="h2" style={{ textAlign: 'center', marginBottom: '20px', color: THEME_COLORS.text.primary }}>カテゴリ別 累計</ChicTypography>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {cumulativeStats.map((cat) => (
            <div key={cat.id}>
              <div onClick={() => setExpandedCatId(expandedCatId === cat.id ? null : cat.id)} style={{ backgroundColor: THEME_COLORS.background, border: `1px solid ${THEME_COLORS.surface}`, borderRadius: '12px', padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><BookOpen size={16} color={THEME_COLORS.accentRed} /><span style={{ fontSize: '15px', fontWeight: 'bold', color: THEME_COLORS.text.primary }}>{cat.name}</span></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}><div style={{ fontSize: '18px' }}>{formatTimeJSX(cat.totalSec)}</div>{expandedCatId === cat.id ? <ChevronUp size={18} color={THEME_COLORS.text.secondary} /> : <ChevronDown size={18} color={THEME_COLORS.text.secondary} />}</div>
              </div>
              {expandedCatId === cat.id && (
                <div style={{ backgroundColor: THEME_COLORS.background, margin: '0 10px', padding: '10px 20px', borderRadius: '0 0 12px 12px', border: `1px solid ${THEME_COLORS.surface}`, borderTop: 'none' }}>
                  {cat.materials.length === 0 ? <div style={{ fontSize: '12px', color: THEME_COLORS.text.muted, padding: '5px 0' }}>記録がありません</div> : cat.materials.map((mat, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: i === cat.materials.length - 1 ? 'none' : `1px solid ${THEME_COLORS.surface}` }}>
                      <span style={{ fontSize: '13px', color: THEME_COLORS.text.secondary }}>{mat.name}</span><span style={{ fontSize: '13px', color: THEME_COLORS.text.primary }}>{formatTimeJSX(mat.duration, true)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default HistoryView;