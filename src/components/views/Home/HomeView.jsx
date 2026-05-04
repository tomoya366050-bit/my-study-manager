import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, PieChart, Pie, CartesianGrid } from 'recharts';
import { Plus, Check, X, Trash2 } from 'lucide-react';
import DatePicker, { registerLocale } from "react-datepicker";
import ja from 'date-fns/locale/ja';
import "react-datepicker/dist/react-datepicker.css";
import { Timestamp } from 'firebase/firestore'; 

import ChicCard from '../../common/ChicCard';
import ChicButton from '../../common/ChicButton';
import ChicInput from '../../common/ChicInput';
import ChicTypography from '../../common/ChicTypography';

import { THEME_COLORS } from '../../../styles/theme';
import { DateUtils } from '../../../utils/DateUtils';
import { ValidationUtils } from '../../../utils/ValidationUtils';

registerLocale('ja', ja);

const HomeView = ({ logs, categories, goals, onAddGoal, onDeleteGoal, onUpdateGoalStatus }) => {
  const [isAddingGoal, setIsAddingGoal] = useState(false);
  const [newGoalTitle, setNewGoalTitle] = useState("");
  const [newGoalTargetTime, setNewGoalTargetTime] = useState(""); 
  const [newGoalDeadline, setNewGoalDeadline] = useState(null);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState([]);

  const now = DateUtils.getToday();
  const todayKey = DateUtils.getDateKey(now);
  
  const safeGetDate = (timestamp) => {
    if (!timestamp) return new Date();
    return timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  };

  const todaySec = logs.filter(l => DateUtils.getDateKey(safeGetDate(l.createdAt)) === todayKey).reduce((s, l) => s + l.duration, 0);
  const todayMin = Math.floor(todaySec / 60);

  const weekRange = DateUtils.getCurrentWeekRange();
  const currentWeekLogs = logs.filter(l => {
    const d = safeGetDate(l.createdAt);
    return d >= weekRange[0] && d <= new Date(new Date(weekRange[6]).setHours(23,59,59,999));
  });

  const weekTotalSec = currentWeekLogs.reduce((s, l) => s + l.duration, 0);
  const daysPassed = now.getDay() + 1; 
  const weeklyAvgMin = Math.floor((weekTotalSec / daysPassed) / 60); 

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

  const activeCategories = categories.map(cat => ({ 
    name: cat.name, 
    value: currentWeekLogs.filter(l => l.categoryId === cat.id).reduce((s, l) => s + l.duration, 0)
  })).filter(d => d.value > 0);

  const pieData = activeCategories.map((data, index) => ({
    ...data,
    fillColor: THEME_COLORS.charts[index % THEME_COLORS.charts.length]
  }));

  const renderGoalCard = (goal) => {
    const goalStartDate = safeGetDate(goal.createdAt);
    goalStartDate.setHours(0, 0, 0, 0);

    const goalLogs = logs.filter(log => goal.categoryIds.includes(log.categoryId) && safeGetDate(log.createdAt) >= goalStartDate);
    const currentSec = goalLogs.reduce((s, l) => s + l.duration, 0);
    const targetSec = goal.targetTime * 3600;
    const progressPercent = Math.min(Math.floor((currentSec / targetSec) * 100), 100);
    
    let dailyQuotaText = null;
    let daysRemaining = 0;
    let isOverdue = false;
    let overdueDays = 0;

    if (goal.deadline && goal.status === 'active') {
      daysRemaining = DateUtils.calculateDaysRemaining(goal.deadline);
      if (daysRemaining <= 0) {
        isOverdue = true;
        overdueDays = 1 - daysRemaining;
      } else {
        const remainingSec = Math.max(targetSec - currentSec, 0);
        dailyQuotaText = DateUtils.formatSecondsToHM(remainingSec / daysRemaining);
      }
    }

    const canRegister = goal.status === 'active' && (progressPercent >= 100 || isOverdue);

    return (
      <ChicCard key={goal.id} style={{ marginBottom: '15px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
          <div>
            <ChicTypography variant="h3" style={{ margin: 0, color: THEME_COLORS.text.primary }}>{goal.title}</ChicTypography>
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '6px' }}>
              {goal.categoryIds.map(id => {
                const foundCategory = categories.find(c => c.id === id);
                if (!foundCategory) return null;
                return (
                  <span key={id} style={{ fontSize: '10px', color: THEME_COLORS.text.muted, backgroundColor: THEME_COLORS.surface, padding: '2px 8px', borderRadius: '4px' }}>
                    {foundCategory.name}
                  </span>
                );
              })}
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
              <div style={{ color: isOverdue ? THEME_COLORS.accentRed : THEME_COLORS.text.muted, fontWeight: isOverdue ? 'bold' : 'normal' }}>
                {isOverdue ? `期限を ${overdueDays} 日過ぎています` : `期限: ${DateUtils.formatTimestampToYMD(goal.deadline)} (残り ${daysRemaining} 日)`}
              </div>
            )}
            <div>実績: {(currentSec / 3600).toFixed(1)}h / {goal.targetTime}h</div>
          </div>
          {dailyQuotaText && (
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '10px', color: THEME_COLORS.text.secondary }}>1日あたりのノルマ</div>
              <div style={{ fontSize: '14px', fontWeight: 'bold', color: THEME_COLORS.text.primary }}>{dailyQuotaText}</div>
            </div>
          )}
        </div>
        {canRegister && (
          <ChicButton onClick={() => onUpdateGoalStatus(goal.id, 'completed')} style={{ marginTop: '15px', width: '100%', padding: '8px' }}>
            {progressPercent >= 100 ? "目標達成！完了にする" : "期限切れで終了（完了にする）"}
          </ChicButton>
        )}
      </ChicCard>
    );
  };

  const activeGoals = goals.filter(g => g.status === 'active');

  return (
    <div key="home">
      <ChicTypography variant="h2">学習サマリー</ChicTypography>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', textAlign: 'center', marginBottom: '25px' }}>
        <div><ChicTypography variant="label">今日</ChicTypography><div style={{fontSize: '20px', fontWeight: 'bold'}}>{(todayMin / 60).toFixed(1)}h</div></div>
        <div><ChicTypography variant="label">今週</ChicTypography><div style={{fontSize: '20px', fontWeight: 'bold'}}>{(weekTotalSec / 3600).toFixed(1)}h</div></div>
        <div><ChicTypography variant="label">今月</ChicTypography><div style={{fontSize: '20px', fontWeight: 'bold'}}>{(logs.filter(l=>safeGetDate(l.createdAt).getMonth()===now.getMonth()).reduce((acc,l)=>acc+l.duration,0)/3600).toFixed(1)}h</div></div>
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
              <ChicInput 
                type="number" 
                min="1" 
                value={newGoalTargetTime} 
                onChange={e => setNewGoalTargetTime(e.target.value.replace(/-/g, ''))} 
                placeholder="100" 
              />
            </div>
            <div style={{ flex: 1 }}>
              <ChicTypography variant="label">期限 (任意)</ChicTypography>
              <DatePicker 
                selected={newGoalDeadline} 
                onChange={date => setNewGoalDeadline(date)} 
                onFocus={(e) => e.target.blur()}
                minDate={new Date()} 
                dateFormat="yyyy/MM/dd" 
                locale="ja" 
                customInput={<ChicInput style={{marginBottom: 0}} readOnly inputMode="none" />} 
              />
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
              const targetTime = parseInt(newGoalTargetTime);
              if (!ValidationUtils.isRequired(newGoalTitle) || !targetTime || targetTime <= 0 || selectedCategoryIds.length === 0) {
                alert("タイトル、目標時間（1時間以上）、該当カテゴリは必須項目です");
                return;
              }
              onAddGoal({ title: newGoalTitle, targetTime, deadline: newGoalDeadline ? Timestamp.fromDate(newGoalDeadline) : null, categoryIds: selectedCategoryIds });
              setIsAddingGoal(false);
              setNewGoalTitle(""); setNewGoalTargetTime(""); setNewGoalDeadline(null); setSelectedCategoryIds([]);
            }} style={{ flex: 1 }}><Check size={18}/> 目標を作成</ChicButton>
            <ChicButton variant="cancel" onClick={() => setIsAddingGoal(false)} style={{ width: '60px' }}><X size={18}/></ChicButton>
          </div>
        </ChicCard>
      )}

      {activeGoals.map(goal => renderGoalCard(goal))}
    </div>
  );
};

export default HomeView;