import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, PieChart, Pie, CartesianGrid } from 'recharts';
import { Target, Settings2, Plus, Calendar as CalendarIcon, Check, X, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Timestamp } from 'firebase/firestore'; 

import ChicCard from '../../common/ChicCard';
import ChicButton from '../../common/ChicButton';
import ChicInput from '../../common/ChicInput';
import ChicTypography from '../../common/ChicTypography';

import { THEME_COLORS } from '../../../styles/theme';
import { DateUtils } from '../../../utils/DateUtils';
import { ValidationUtils } from '../../../utils/ValidationUtils';

const HomeView = ({ logs, categories, goals, onAddGoal, onDeleteGoal, onUpdateGoalStatus, dailyGoalMin, onSaveGoal }) => {
  const [isDailyGoalOpen, setIsDailyGoalOpen] = useState(false);
  const [isDailyGoalDisplayOpen, setIsDailyGoalDisplayOpen] = useState(true);
  const [tempDailyGoal, setTempDailyGoal] = useState("");

  const [isAddingGoal, setIsAddingGoal] = useState(false);
  const [newGoalTitle, setNewGoalTitle] = useState("");
  const [newGoalTargetTime, setNewGoalTargetTime] = useState(""); 
  const [newGoalDeadline, setNewGoalDeadline] = useState(null);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState([]);
  const [isCompletedExpanded, setIsCompletedExpanded] = useState(false);

  const now = DateUtils.getToday();
  const todayKey = DateUtils.getDateKey(now);
  
  const safeGetDate = (timestamp) => timestamp && typeof timestamp.toDate === 'function' ? timestamp.toDate() : new Date(timestamp);

  // --- 学習統計計算 ---
  const todaySec = logs.filter(l => DateUtils.getDateKey(safeGetDate(l.createdAt)) === todayKey).reduce((s, l) => s + l.duration, 0);
  const todayMin = Math.floor(todaySec / 60);
  const dailyProgressPercent = dailyGoalMin > 0 ? Math.min(Math.round((todayMin / dailyGoalMin) * 100), 100) : 0;

  const weekRange = DateUtils.getCurrentWeekRange();
  const startOfWeek = weekRange[0];
  const endOfWeek = new Date(weekRange[6]);
  endOfWeek.setHours(23, 59, 59, 999);

  const currentWeekLogs = logs.filter(l => {
    const d = safeGetDate(l.createdAt);
    return d >= startOfWeek && d <= endOfWeek;
  });

  const weekTotalSec = currentWeekLogs.reduce((s, l) => s + l.duration, 0);
  const weeklyAvgMin = Math.floor((weekTotalSec / 7) / 60); 
  const monthSec = logs.filter(l => safeGetDate(l.createdAt).getMonth() === now.getMonth()).reduce((s, l) => s + l.duration, 0);

  // --- 棒グラフデータ ---
  const weeklyData = weekRange.map(date => {
    const dKey = DateUtils.getDateKey(date);
    const daySec = currentWeekLogs.filter(l => DateUtils.getDateKey(safeGetDate(l.createdAt)) === dKey).reduce((s, l) => s + l.duration, 0);
    return { day: DateUtils.weekLabels[date.getDay()], dateLabel: `${date.getMonth() + 1}/${date.getDate()}`, minutes: Math.floor(daySec / 60) };
  });

  const maxWeeklyMinutes = Math.max(...weeklyData.map(d => d.minutes), 0);
  const thresholds = [60, 180, 360, 540, 720, 900, 1080, 1260, 1440];
  const yAxisMax = thresholds.find(v => v >= maxWeeklyMinutes) || 1440;
  const ticks = [];
  for (let i = 0; i <= yAxisMax; i += (yAxisMax <= 180 ? 60 : 180)) { ticks.push(i); }

  // --- 円グラフデータ ---
  const activeCategories = categories.map(cat => ({ 
    name: cat.name, 
    value: currentWeekLogs.filter(l => l.categoryId === cat.id).reduce((s, l) => s + l.duration, 0)
  })).filter(d => d.value > 0);

  const pieData = activeCategories.map((data, index) => ({
    ...data,
    fillColor: THEME_COLORS.charts[index % THEME_COLORS.charts.length]
  }));

  // --- 学習目標レンダリング関数 ---
  const renderGoalCard = (goal) => {
    const goalLogs = logs.filter(log => goal.categoryIds.includes(log.categoryId) && safeGetDate(log.createdAt) >= safeGetDate(goal.createdAt));
    const currentSec = goalLogs.reduce((s, l) => s + l.duration, 0);
    const targetSec = goal.targetTime * 3600;
    const progressPercent = Math.min(Math.floor((currentSec / targetSec) * 100), 100);
    
    let dailyQuotaText = null;
    let daysRemaining = 0;
    if (goal.deadline && goal.status === 'active') {
      daysRemaining = DateUtils.calculateDaysRemaining(goal.deadline);
      if (daysRemaining > 0) {
        const remainingSec = Math.max(targetSec - currentSec, 0);
        dailyQuotaText = DateUtils.formatSecondsToHM(remainingSec / daysRemaining);
      }
    }

    return (
      <ChicCard key={goal.id} style={{ marginBottom: '15px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
          <div>
            <ChicTypography variant="h3" style={{ margin: 0, color: THEME_COLORS.text.primary }}>{goal.title}</ChicTypography>
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '4px' }}>
              {goal.categoryIds.map(id => (
                <span key={id} style={{ fontSize: '10px', color: THEME_COLORS.text.muted, backgroundColor: THEME_COLORS.surface, padding: '2px 6px', borderRadius: '4px' }}>
                  {categories.find(c => c.id === id)?.name}
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
            {goal.deadline && <div>期限: {DateUtils.formatTimestampToYMD(goal.deadline)} (残り {daysRemaining} 日)</div>}
            <div>実績: {Math.floor(currentSec / 3600)}h / {goal.targetTime}h</div>
          </div>
          {dailyQuotaText && (
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '10px', color: THEME_COLORS.text.secondary }}>1日あたりのノルマ</div>
              <div style={{ fontSize: '14px', fontWeight: 'bold', color: THEME_COLORS.text.primary }}>{dailyQuotaText}</div>
            </div>
          )}
        </div>
        {goal.status === 'active' && progressPercent >= 100 && (
          <ChicButton onClick={() => onUpdateGoalStatus(goal.id, 'completed')} style={{ marginTop: '15px', width: '100%', padding: '8px' }}>目標達成！完了にする</ChicButton>
        )}
      </ChicCard>
    );
  };

  const activeGoals = goals.filter(g => g.status === 'active');
  const completedGoals = goals.filter(g => g.status === 'completed');

  return (
    <div key="home">
      <ChicTypography variant="h2">学習サマリー</ChicTypography>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', textAlign: 'center', marginBottom: '25px' }}>
        <div><ChicTypography variant="label">今日</ChicTypography><div style={{fontSize: '20px', fontWeight: 'bold'}}>{(todayMin / 60).toFixed(1)}h</div></div>
        <div><ChicTypography variant="label">今週</ChicTypography><div style={{fontSize: '20px', fontWeight: 'bold'}}>{(weekTotalSec / 3600).toFixed(1)}h</div></div>
        <div><ChicTypography variant="label">今月</ChicTypography><div style={{fontSize: '20px', fontWeight: 'bold'}}>{(monthSec / 3600).toFixed(1)}h</div></div>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '15px' }}>
        <ChicCard style={{ flex: 1.6, height: '260px' }} padding="15px">
          <ChicTypography variant="caption" style={{ marginBottom: '15px', display: 'block', color: THEME_COLORS.text.secondary }}>週間推移 (日〜土)</ChicTypography>
          <div style={{ width: '100%', height: '180px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} interval={0} tick={({ x, y, payload }) => ( 
                  <g transform={`translate(${x},${y})`}>
                    <text x={0} y={0} dy={10} textAnchor="middle" fill={THEME_COLORS.text.secondary} fontSize={10} fontWeight="bold">{payload.value}</text>
                    <text x={0} y={0} dy={24} textAnchor="middle" fill={THEME_COLORS.text.muted} fontSize={9}>{weeklyData.find(d => d.day === payload.value)?.dateLabel}</text>
                  </g> 
                )} />
                <YAxis domain={[0, yAxisMax]} ticks={ticks} axisLine={false} tickLine={false} fontSize={10} tick={{ fill: THEME_COLORS.text.muted }} width={35} tickFormatter={(val) => val === 0 ? "0" : `${val / 60}h`} />
                <Bar dataKey="minutes" radius={[3, 3, 0, 0]} barSize={16}>
                  {weeklyData.map((e, i) => <Cell key={i} fill={e.minutes > 0 ? THEME_COLORS.accentRed : THEME_COLORS.surface} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChicCard>
        <ChicCard style={{ flex: 1, height: '260px', display: 'flex', flexDirection: 'column', alignItems: 'center' }} padding="15px">
          <ChicTypography variant="caption" style={{ marginBottom: '5px', alignSelf: 'flex-start', color: THEME_COLORS.text.secondary }}>今週の比率</ChicTypography>
          <div style={{ width: '100%', height: '100px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="value" cx="50%" cy="50%" outerRadius={35} stroke="none">
                  {pieData.map((e, i) => <Cell key={i} fill={e.fillColor} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ width: '100%', marginTop: '10px', overflowY: 'auto', flex: 1 }}>
            {pieData.map((e, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: e.fillColor }} />
                <span style={{ fontSize: '9px', color: THEME_COLORS.text.secondary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.name}</span>
              </div>
            ))}
          </div>
        </ChicCard>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
        <ChicCard padding="15px" style={{ textAlign: 'center', backgroundColor: THEME_COLORS.background }}>
          <ChicTypography variant="caption" style={{ color: THEME_COLORS.text.secondary, display: 'block', marginBottom: '5px' }}>今週の平均/日</ChicTypography>
          <div style={{ fontSize: '22px', fontWeight: 'bold', color: THEME_COLORS.text.primary }}>
            {Math.floor(weeklyAvgMin / 60)}<span style={{ fontSize: '12px', margin: '0 2px', fontWeight: 'normal', color: THEME_COLORS.text.muted }}>h</span>
            {weeklyAvgMin % 60}<span style={{ fontSize: '12px', marginLeft: '2px', fontWeight: 'normal', color: THEME_COLORS.text.muted }}>m</span>
          </div>
        </ChicCard>
        <ChicCard padding="15px" style={{ textAlign: 'center', backgroundColor: THEME_COLORS.background }}>
          <ChicTypography variant="caption" style={{ color: THEME_COLORS.text.secondary, display: 'block', marginBottom: '5px' }}>現在の継続日数</ChicTypography>
          <div style={{ fontSize: '22px', fontWeight: 'bold', color: THEME_COLORS.text.primary }}>
            {DateUtils.calculateStreak(logs)}<span style={{ fontSize: '12px', marginLeft: '4px', fontWeight: 'normal', color: THEME_COLORS.text.muted }}>日連続</span>
          </div>
        </ChicCard>
      </div>

      <hr style={{ border: 'none', borderTop: `1px solid ${THEME_COLORS.surface}`, margin: '40px 0' }} />

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
              onAddGoal({ title: newGoalTitle, targetTime: parseInt(newGoalTargetTime), deadline: newGoalDeadline ? Timestamp.fromDate(newGoalDeadline) : null, categoryIds: selectedCategoryIds });
              setIsAddingGoal(false);
              setNewGoalTitle(""); setNewGoalTargetTime(""); setNewGoalDeadline(null); setSelectedCategoryIds([]);
            }} style={{ flex: 1 }}><Check size={18}/> 目標を作成</ChicButton>
            <ChicButton variant="cancel" onClick={() => setIsAddingGoal(false)} style={{ width: '60px' }}><X size={18}/></ChicButton>
          </div>
        </ChicCard>
      )}

      {activeGoals.map(goal => renderGoalCard(goal))}

      {completedGoals.length > 0 && (
        <div style={{ marginTop: '30px' }}>
          <div onClick={() => setIsCompletedExpanded(!isCompletedExpanded)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 15px', backgroundColor: THEME_COLORS.surface, borderRadius: '8px', cursor: 'pointer', marginBottom: '10px' }}>
            <span style={{ fontSize: '12px', fontWeight: 'bold', color: THEME_COLORS.text.secondary }}>達成済みの目標 ({completedGoals.length})</span>
            {isCompletedExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
          {isCompletedExpanded && completedGoals.map(goal => renderGoalCard(goal))}
        </div>
      )}

      <div style={{ marginTop: '50px', borderTop: `1px solid ${THEME_COLORS.surface}`, paddingTop: '20px' }}>
        <div style={{ display: 'flex', gap: '10px' }}>
          <ChicButton variant={isDailyGoalDisplayOpen ? "save" : "cancel"} onClick={() => setIsDailyGoalDisplayOpen(!isDailyGoalDisplayOpen)} style={{ backgroundColor: THEME_COLORS.background }}><Target size={16}/>進捗</ChicButton>
          <ChicButton variant="cancel" onClick={() => setIsDailyGoalOpen(!isDailyGoalOpen)} style={{ backgroundColor: THEME_COLORS.background, flex: 1 }}><Settings2 size={16}/>設定</ChicButton>
        </div>
        {isDailyGoalOpen && (
          <ChicCard style={{ marginTop: '10px' }}>
            <ChicTypography variant="label">今日の目標学習時間 (分)</ChicTypography>
            <ChicInput type="number" value={tempDailyGoal} onChange={e => setTempDailyGoal(e.target.value)} placeholder="120" />
            <ChicButton onClick={() => { 
              if (!ValidationUtils.isValidNumber(tempDailyGoal)) { alert("有効な数値を入力してください"); return; }
              onSaveGoal(tempDailyGoal); setIsDailyGoalOpen(false); setTempDailyGoal(""); 
            }}>保存</ChicButton>
          </ChicCard>
        )}
        {isDailyGoalDisplayOpen && dailyGoalMin > 0 && (
          <ChicCard style={{ marginTop: '10px' }}>
            <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '8px'}}>
              <ChicTypography variant="label" style={{ color: THEME_COLORS.text.secondary }}>今日の達成度</ChicTypography>
              <span style={{fontWeight: 'bold', color: THEME_COLORS.accentRed, fontSize: '12px'}}>{dailyProgressPercent}%</span>
            </div>
            <div style={{width: '100%', height: '4px', backgroundColor: THEME_COLORS.surface, borderRadius: '2px', overflow: 'hidden'}}>
              <div style={{width: `${dailyProgressPercent}%`, height: '100%', backgroundColor: THEME_COLORS.accentRed, transition: 'width 0.8s ease'}} />
            </div>
            <ChicTypography variant="caption" style={{ marginTop: '10px', display: 'block', color: THEME_COLORS.text.muted }}>{todayMin} / {dailyGoalMin} 分 完了</ChicTypography>
          </ChicCard>
        )}
      </div>
    </div>
  );
};

export default HomeView;