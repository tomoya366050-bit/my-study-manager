import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, BookOpen, Trash2, ChevronLeft, ChevronRight, Edit2, Check, X } from 'lucide-react';
import ChicCard from '../../common/ChicCard';
import ChicTypography from '../../common/ChicTypography';
import ChicInput from '../../common/ChicInput';

const HistoryView = ({ logs, categories, ACCENT_RED, onDeleteLog, onUpdateLog }) => {
  const [expandedCatId, setExpandedCatId] = useState(null);
  
  // カレンダー用ステート
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  // 編集用ステート
  const [editingLogId, setEditingLogId] = useState(null);
  const [editHours, setEditHours] = useState("");
  const [editMinutes, setEditMinutes] = useState("");

  // 日付の安全な取得
  const safeGetDate = (timestamp) => timestamp ? timestamp.toDate() : new Date();

  // --- 1. カレンダーの生成ロジック ---
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

  const isSameDay = (d1, d2) => {
    return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
  };

  const getDayTotalHours = (date) => {
    if (!date) return 0;
    const dayLogs = logs.filter(l => isSameDay(safeGetDate(l.createdAt), date));
    const totalSec = dayLogs.reduce((acc, curr) => acc + curr.duration, 0);
    return (totalSec / 3600).toFixed(1);
  };

  const selectedDateLogs = useMemo(() => {
    return logs.filter(l => isSameDay(safeGetDate(l.createdAt), selectedDate));
  }, [logs, selectedDate]);

  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));

  // --- 2. 累計データの計算 ---
  const cumulativeStats = useMemo(() => {
    return categories.map(cat => {
      const catLogs = logs.filter(l => l.categoryId === cat.id);
      const totalSec = catLogs.reduce((acc, curr) => acc + curr.duration, 0);
      const materialMap = {};
      catLogs.forEach(log => {
        if (!materialMap[log.materialId]) {
          materialMap[log.materialId] = { name: log.materialName, duration: 0 };
        }
        materialMap[log.materialId].duration += log.duration;
      });
      return { ...cat, totalSec, materials: Object.values(materialMap).sort((a, b) => b.duration - a.duration) };
    });
  }, [categories, logs]);

  // --- 3. 時間表示用ヘルパー ---
  const formatTime = (totalSeconds, showDetail = false) => {
    const totalMinutes = totalSeconds / 60;
    const h = Math.floor(totalMinutes / 60);
    const m = Math.round(totalMinutes % 60);
    if (h > 0) return (
      <span style={{ color: ACCENT_RED, fontWeight: 'bold' }}>
        {h}<span style={{ fontSize: '10px', margin: '0 2px', fontWeight: 'normal', color: '#555' }}>時間</span>
        {m}<span style={{ fontSize: '10px', marginLeft: '2px', fontWeight: 'normal', color: '#555' }}>分</span>
      </span>
    );
    return (
      <span style={{ color: totalMinutes > 0 ? ACCENT_RED : '#fff', fontWeight: 'bold' }}>
        {totalMinutes.toFixed(showDetail ? 1 : 0)}<span style={{ fontSize: '10px', marginLeft: '2px', fontWeight: 'normal', color: '#555' }}>分</span>
      </span>
    );
  };

  const formatDateLabel = (timestamp) => {
    const date = safeGetDate(timestamp);
    const isManual = date.getHours() === 0 && date.getMinutes() === 0;
    return isManual 
      ? date.toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' })
      : date.toLocaleString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  };

  // 編集処理
  const startEdit = (log) => {
    setEditingLogId(log.id);
    setEditHours(Math.floor(log.duration / 3600).toString());
    setEditMinutes(Math.floor((log.duration % 3600) / 60).toString());
  };

  const handleSaveEdit = (logId) => {
    // 保存時にもマイナス値が入らないようにガード
    const h = Math.max(0, parseInt(editHours) || 0);
    const m = Math.max(0, parseInt(editMinutes) || 0);
    const totalSec = (h * 3600) + (m * 60);
    if (totalSec > 0) { onUpdateLog(logId, totalSec); }
    setEditingLogId(null);
  };

  return (
    <div style={{ width: '100%', boxSizing: 'border-box' }}>
      {/* カレンダーセクション */}
      <section style={{ marginBottom: '40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <button onClick={prevMonth} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}><ChevronLeft size={24} /></button>
          <ChicTypography variant="h2" style={{ margin: 0 }}>{currentMonth.getFullYear()}年 {currentMonth.getMonth() + 1}月</ChicTypography>
          <button onClick={nextMonth} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}><ChevronRight size={24} /></button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px' }}>
          {['日', '月', '火', '水', '木', '金', '土'].map((day, i) => (
            <div key={day} style={{ textAlign: 'center', fontSize: '12px', color: i === 0 ? ACCENT_RED : '#888', fontWeight: 'bold' }}>{day}</div>
          ))}
          {calendarDays.map((date, index) => {
            if (!date) return <div key={`empty-${index}`} />;
            const isSelected = isSameDay(date, selectedDate);
            const isToday = isSameDay(date, new Date());
            const hours = getDayTotalHours(date);
            return (
              <div key={index} onClick={() => setSelectedDate(date)} style={{ backgroundColor: isSelected ? ACCENT_RED : (isToday ? '#222' : '#0a0a0a'), border: `1px solid ${isSelected ? ACCENT_RED : '#1a1a1a'}`, borderRadius: '8px', padding: '8px 0', textAlign: 'center', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <div style={{ fontSize: '14px', fontWeight: 'bold', color: isSelected || isToday ? '#fff' : '#ccc' }}>{date.getDate()}</div>
                <div style={{ fontSize: '10px', color: isSelected ? '#ffcccc' : (hours > 0 ? '#aaa' : '#444') }}>{hours}h</div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 選択された日の記録 */}
      <section style={{ marginBottom: '50px' }}>
        <ChicTypography variant="caption" style={{ display: 'block', marginBottom: '15px', color: '#aaa', borderBottom: '1px solid #222', paddingBottom: '5px' }}>{selectedDate.toLocaleDateString('ja-JP')} の記録</ChicTypography>
        {selectedDateLogs.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#444', padding: '20px 0' }}>記録がありません</div>
        ) : (
          selectedDateLogs.map(log => {
            const category = categories.find(c => c.id === log.categoryId);
            const isEditing = editingLogId === log.id;
            return (
              <ChicCard key={log.id} padding="15px" style={{ marginBottom: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <ChicTypography variant="caption" style={{ color: '#666', fontSize: '11px', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{category?.name || "未分類"}</ChicTypography>
                    <ChicTypography variant="h3" style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.materialName}</ChicTypography>
                    <div style={{ fontSize: '10px', color: '#444', marginTop: '4px' }}>{formatDateLabel(log.createdAt)}</div>
                  </div>

                  {isEditing ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {/* ★修正: widthを広げ、textAlign='left'にし、min="0"を追加 */}
                        <ChicInput 
                          type="number" 
                          min="0"
                          value={editHours} 
                          onChange={(e) => setEditHours(e.target.value)} 
                          style={{ width: '60px', padding: '5px 8px', marginBottom: 0, fontSize: '13px', textAlign: 'left', border: '1px solid #333' }} 
                        />
                        <span style={{ fontSize: '12px', color: '#888' }}>h</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {/* ★修正: widthを広げ、textAlign='left'にし、min="0"を追加 */}
                        <ChicInput 
                          type="number" 
                          min="0"
                          value={editMinutes} 
                          onChange={(e) => setEditMinutes(e.target.value)} 
                          style={{ width: '60px', padding: '5px 8px', marginBottom: 0, fontSize: '13px', textAlign: 'left', border: '1px solid #333' }} 
                        />
                        <span style={{ fontSize: '12px', color: '#888' }}>m</span>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', marginLeft: '4px' }}>
                        <Check size={20} color="#4ade80" onClick={() => handleSaveEdit(log.id)} style={{ cursor: 'pointer' }} />
                        <X size={20} color="#f87171" onClick={() => setEditingLogId(null)} style={{ cursor: 'pointer' }} />
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flexShrink: 0 }}>
                      <div style={{ textAlign: 'right', minWidth: '70px' }}>{formatTime(log.duration, true)}</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <Edit2 size={14} color="#666" onClick={() => startEdit(log)} style={{ cursor: 'pointer' }} />
                        <Trash2 size={14} color="#666" onClick={() => onDeleteLog(log.id)} style={{ cursor: 'pointer' }} />
                      </div>
                    </div>
                  )}
                </div>
              </ChicCard>
            );
          })
        )}
      </section>

      {/* 累計統計 */}
      <section style={{ marginBottom: '30px' }}>
        <ChicTypography variant="h2" style={{ textAlign: 'center', marginBottom: '20px' }}>カテゴリ別 累計</ChicTypography>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {cumulativeStats.map((cat) => (
            <div key={cat.id}>
              <div onClick={() => setExpandedCatId(expandedCatId === cat.id ? null : cat.id)} style={{ backgroundColor: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: '12px', padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><BookOpen size={16} color={ACCENT_RED} /><span style={{ fontSize: '15px', fontWeight: 'bold' }}>{cat.name}</span></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}><div style={{ fontSize: '18px' }}>{formatTime(cat.totalSec)}</div>{expandedCatId === cat.id ? <ChevronUp size={18} color="#444" /> : <ChevronDown size={18} color="#444" />}</div>
              </div>
              {expandedCatId === cat.id && (
                <div style={{ backgroundColor: '#050505', margin: '0 10px', padding: '10px 20px', borderRadius: '0 0 12px 12px', border: '1px solid #111', borderTop: 'none' }}>
                  {cat.materials.length === 0 ? <div style={{ fontSize: '12px', color: '#333', padding: '5px 0' }}>記録がありません</div> : cat.materials.map((mat, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: i === cat.materials.length - 1 ? 'none' : '1px solid #0f0f05' }}>
                      <span style={{ fontSize: '13px', color: '#888' }}>{mat.name}</span><span style={{ fontSize: '13px', color: '#aaa' }}>{formatTime(mat.duration, true)}</span>
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