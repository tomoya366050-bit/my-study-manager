import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, PieChart, Pie, CartesianGrid } from 'recharts';
import { Target, Settings2, Plus, Calendar as CalendarIcon, Check, X, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

import ChicCard from '../../common/ChicCard';
import ChicButton from '../../common/ChicButton';
import ChicInput from '../../common/ChicInput';
import ChicTypography from '../../common/ChicTypography';

import { THEME_COLORS } from '../../../styles/theme';
import { DateUtils } from '../../../utils/DateUtils';
import { ValidationUtils } from '../../../utils/ValidationUtils';

const HomeView = ({ logs, categories, goals, onAddGoal, onDeleteGoal, onUpdateGoalStatus, dailyGoalMin, onSaveGoal }) => {
  // 既存の目標設定（1日の目標）用
  const [isDailyGoalOpen, setIsDailyGoalOpen] = useState(false);
  const [tempDailyGoal, setTempDailyGoal] = useState("");

  // ★学習目標（複数）追加用
  const [isAddingGoal, setIsAddingGoal] = useState(false);
  const [newGoalTitle, setNewGoalTitle] = useState("");
  const [newGoalTargetTime, setNewGoalTargetTime] = useState(""); // 時間単位
  const [newGoalDeadline, setNewGoalDeadline] = useState(null);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState([]);
  const [isCompletedExpanded, setIsCompletedExpanded] = useState(false);

  const now = DateUtils.getToday();
  const todayKey = DateUtils.getDateKey(now);
  
  const safeGetDate = (timestamp) => timestamp && typeof timestamp.toDate === 'function' ? timestamp.toDate() : new Date(timestamp);

  // --- 学習サマリー用計算 ---
  const todaySec = logs.filter(l => DateUtils.getDateKey(safeGetDate(l.createdAt)) === todayKey).reduce((s, l) => s + l.duration, 0);
  const todayMin = Math.floor(todaySec / 60);
  
  const weekRange = DateUtils.getCurrentWeekRange();
  const currentWeekLogs = logs.filter(l => {
    const d = safeGetDate(l.createdAt);
    return d >= weekRange[0] && d <= new Date(weekRange[6].setHours(23,59,59));
  });

  const weeklyData = weekRange.map(date => {
    const daySec = currentWeekLogs.filter(l => DateUtils.getDateKey(safeGetDate(l.createdAt)) === DateUtils.getDateKey(date)).reduce((s, l) => s + l.duration, 0);
    return { day: DateUtils.weekLabels[date.getDay()], minutes: Math.floor(daySec / 60) };
  });

  // --- 学習目標カードのレンダリング関数 ---
  const renderGoalCard = (goal) => {
    // 1. この目標の作成日以降の、該当カテゴリのログを抽出
    const goalLogs = logs.filter(log => 
      goal.categoryIds.includes(log.categoryId) && 
      safeGetDate(log.createdAt) >= safeGetDate(goal.createdAt)
    );

    const currentSec = goalLogs.reduce((s, l) => s + l.duration, 0);
    const targetSec = goal.targetTime * 3600;
    const progressPercent = Math.min(Math.floor((currentSec / targetSec) * 100), 100);
    
    // 2. 期限とノルマの計算
    let dailyQuotaText = null;
    let daysRemaining = 0;
    if (goal.deadline && goal.status === 'active') {
      daysRemaining = DateUtils.calculateDaysRemaining(goal.deadline);
      if (daysRemaining > 0) {
        const remainingSec = Math.max(targetSec - currentSec, 0);
        const dailySec = remainingSec / daysRemaining;
        dailyQuotaText = DateUtils.formatSecondsToHM(dailySec);
      }
    }

    return (
      <ChicCard key={goal.id} style={{ marginBottom: '15px', position: 'relative' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
          <div>
            <ChicTypography variant="h3" style={{ margin: 0, color: THEME_COLORS.text.primary }}>{goal.title}</ChicTypography>
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '4px' }}>
              {goal.categoryIds.map(catId => (
                <span key={catId} style={{ fontSize: '10px', color: THEME_COLORS.text.muted, backgroundColor: THEME_COLORS.surface, padding: '2px 6px', borderRadius: '4px' }}>
                  {categories.find(c => c.id === catId)?.name}
                </span>
              ))}
            </div>
          </div>
          <Trash2 size={16} color={THEME_COLORS.text.muted} onClick={() => onDeleteGoal(goal.id)} style={{ cursor: 'pointer' }} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
          <span style={{ color: THEME_COLORS.text.secondary }}>達成度</span>
          <span style={{ color: THEME_COLORS.accentRed, fontWeight: 'bold' }}>{progressPercent}%</span>
        </div>
        
        <div style={{ width: '100%', height: '6px', backgroundColor: THEME_COLORS.surface, borderRadius: '3px', overflow: 'hidden', marginBottom: '12px' }}>
          <div style={{ width: `${progressPercent}%`, height: '100%', backgroundColor: THEME_COLORS.accentRed, transition: 'width 1s ease' }} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div style={{ fontSize: '11px', color: THEME_COLORS.text.muted }}>
            {goal.deadline && (
              <div>期限: {DateUtils.formatTimestampToYMD(goal.deadline)} (残り {daysRemaining} 日)</div>
            )}
            <div>実績: {Math.floor(currentSec / 3600)}h / {goal.targetTime}h</div>
          </div>
          {dailyQuotaText && (
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '10px', color: THEME_COLORS.text.secondary }}>1日あたりのノルマ</div>
              <div style={{ fontSize: '14px', fontWeight: 'bold', color: THEME_COLORS.text.primary }}>{dailyQuotaText}</div>
            </div>
          )}
        </div>

        {/* 完了ボタン */}
        {goal.status === 'active' && progressPercent >= 100 && (
          <ChicButton onClick={() => onUpdateGoalStatus(goal.id, 'completed')} style={{ marginTop: '15px', width: '100%', padding: '8px' }}>
            目標達成！完了にする
          </ChicButton>
        )}
      </ChicCard>
    );
  };

  const activeGoals = goals.filter(g => g.status === 'active');
  const completedGoals = goals.filter(g => g.status === 'completed');

  return (
    <div key="home">
      <ChicTypography variant="h2">学習サマリー</ChicTypography>
      
      {/* 簡易サマリー（今日・今週・今月） */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', textAlign: 'center', marginBottom: '25px' }}>
        <div><ChicTypography variant="label">今日</ChicTypography><div style={{fontSize: '20px', fontWeight: 'bold'}}>{(todayMin / 60).toFixed(1)}h</div></div>
        <div><ChicTypography variant="label">今週</ChicTypography><div style={{fontSize: '20px', fontWeight: 'bold'}}>{(currentWeekLogs.reduce((acc,l)=>acc+l.duration,0) / 3600).toFixed(1)}h</div></div>
        <div><ChicTypography variant="label">今月</ChicTypography><div style={{fontSize: '20px', fontWeight: 'bold'}}>{(logs.filter(l=>safeGetDate(l.createdAt).getMonth()===now.getMonth()).reduce((acc,l)=>acc+l.duration,0)/3600).toFixed(1)}h</div></div>
      </div>

      {/* グラフエリア */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '30px' }}>
        <ChicCard style={{ flex: 1.6, height: '200px' }} padding="15px">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyData}>
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: THEME_COLORS.text.muted, fontSize: 10}} />
              <Bar dataKey="minutes" radius={[3, 3, 0, 0]}>
                {weeklyData.map((e, i) => <Cell key={i} fill={e.minutes > 0 ? THEME_COLORS.accentRed : THEME_COLORS.surface} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChicCard>
        <ChicCard style={{ flex: 1, height: '200px', textAlign: 'center' }} padding="15px">
          <ChicTypography variant="caption" style={{color: THEME_COLORS.text.secondary}}>継続日数</ChicTypography>
          <div style={{fontSize: '32px', fontWeight: 'bold', marginTop: '20px'}}>{DateUtils.calculateStreak(logs)}</div>
          <div style={{fontSize: '12px', color: THEME_COLORS.text.muted}}>日連続</div>
        </ChicCard>
      </div>

      <hr style={{ border: 'none', borderTop: `1px solid ${THEME_COLORS.surface}`, margin: '40px 0' }} />

      {/* --- 学習目標セクション --- */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <ChicTypography variant="h2" style={{ margin: 0 }}>学習目標</ChicTypography>
        <Plus size={24} color={isAddingGoal ? THEME_COLORS.accentRed : THEME_COLORS.text.secondary} onClick={() => setIsAddingGoal(!isAddingGoal)} style={{ cursor: 'pointer' }} />
      </div>

      {isAddingGoal && (
        <ChicCard style={{ marginBottom: '30px', border: `1px solid ${THEME_COLORS.accentRed}` }}>
          <ChicTypography variant="h3" style={{ marginBottom: '20px' }}>新しい目標を追加</ChicTypography>
          
          <ChicTypography variant="label">目標タイトル</ChicTypography>
          <ChicInput value={newGoalTitle} onChange={e => setNewGoalTitle(e.target.value)} placeholder="例: Javaシルバー取得" />

          <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
            <div style={{ flex: 1 }}>
              <ChicTypography variant="label">目標時間 (h)</ChicTypography>
              <ChicInput type="number" value={newGoalTargetTime} onChange={e => setNewGoalTargetTime(e.target.value)} placeholder="100" />
            </div>
            <div style={{ flex: 1 }}>
              <ChicTypography variant="label">期限 (任意)</ChicTypography>
              <DatePicker selected={newGoalDeadline} onChange={date => setNewGoalDeadline(date)} minDate={new Date()} dateFormat="yyyy/MM/dd" customInput={<ChicInput style={{marginBottom: 0}} />} />
            </div>
          </div>

          <ChicTypography variant="label">該当カテゴリ (複数選択)</ChicTypography>
          <div style={{ maxHeight: '120px', overflowY: 'auto', backgroundColor: THEME_COLORS.background, padding: '10px', borderRadius: '8px', marginBottom: '20px', border: `1px solid ${THEME_COLORS.surface}` }}>
            {categories.filter(c => c.status !== 'completed').map(cat => (
              <label key={cat.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', cursor: 'pointer' }}>
                <input type="checkbox" checked={selectedCategoryIds.includes(cat.id)} onChange={e => {
                  if (e.target.checked) setSelectedCategoryIds([...selectedCategoryIds, cat.id]);
                  else setSelectedCategoryIds(selectedCategoryIds.filter(id => id !== cat.id));
                }} />
                <span style={{ fontSize: '14px' }}>{cat.name}</span>
              </label>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <ChicButton onClick={() => {
              if (!ValidationUtils.isRequired(newGoalTitle) || !newGoalTargetTime || selectedCategoryIds.length === 0) {
                alert("タイトル、時間、カテゴリは必須項目です");
                return;
              }
              onAddGoal({
                title: newGoalTitle,
                targetTime: parseInt(newGoalTargetTime),
                deadline: newGoalDeadline ? Timestamp.fromDate(newGoalDeadline) : null,
                categoryIds: selectedCategoryIds
              });
              setIsAddingGoal(false);
              setNewGoalTitle(""); setNewGoalTargetTime(""); setNewGoalDeadline(null); setSelectedCategoryIds([]);
            }} style={{ flex: 1 }}><Check size={18}/> 目標を作成</ChicButton>
            <ChicButton variant="cancel" onClick={() => setIsAddingGoal(false)} style={{ width: '60px' }}><X size={18}/></ChicButton>
          </div>
        </ChicCard>
      )}

      {/* アクティブな目標リスト */}
      {activeGoals.length === 0 && !isAddingGoal ? (
        <ChicTypography variant="body" style={{ textAlign: 'center', color: THEME_COLORS.text.muted, padding: '20px 0' }}>設定された目標はありません</ChicTypography>
      ) : (
        activeGoals.map(goal => renderGoalCard(goal))
      )}

      {/* 完了済みの目標（折りたたみ） */}
      {completedGoals.length > 0 && (
        <div style={{ marginTop: '30px' }}>
          <div onClick={() => setIsCompletedExpanded(!isCompletedExpanded)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 15px', backgroundColor: THEME_COLORS.surface, borderRadius: '8px', cursor: 'pointer', marginBottom: '10px' }}>
            <span style={{ fontSize: '12px', fontWeight: 'bold', color: THEME_COLORS.text.secondary }}>達成済みの目標 ({completedGoals.length})</span>
            {isCompletedExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
          {isCompletedExpanded && completedGoals.map(goal => renderGoalCard(goal))}
        </div>
      )}

      {/* 既存のデイリー目標設定ボタン（デザイン調整） */}
      <div style={{ marginTop: '50px', borderTop: `1px solid ${THEME_COLORS.surface}`, paddingTop: '20px' }}>
        <div style={{ display: 'flex', gap: '10px' }}>
          <ChicButton variant="cancel" onClick={() => setIsDailyGoalOpen(!isDailyGoalOpen)} style={{ backgroundColor: THEME_COLORS.background, flex: 1 }}><Target size={16}/> 1日の目標を設定</ChicButton>
        </div>
        {isDailyGoalOpen && (
          <ChicCard style={{ marginTop: '10px' }}>
            <ChicTypography variant="label">今日の目標学習時間 (分)</ChicTypography>
            <ChicInput type="number" value={tempDailyGoal} onChange={e => setTempDailyGoal(e.target.value)} placeholder="120" />
            <ChicButton onClick={() => { onSaveGoal(tempDailyGoal); setIsDailyGoalOpen(false); setTempDailyGoal(""); }}>保存</ChicButton>
          </ChicCard>
        )}
      </div>
    </div>
  );
};

export default HomeView;