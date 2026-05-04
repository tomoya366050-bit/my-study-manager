import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, PieChart, Pie, CartesianGrid } from 'recharts';
import { Plus, Check, X, Trash2, Calendar, Target } from 'lucide-react';
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
      <ChicCard key={goal.id} style={{ marginBottom: '15px' }} padding="16px">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div>
            <ChicTypography variant="h3" style={{ margin: 0, color: THEME_COLORS.text.primary, fontSize: '16px' }}>{goal.title}</ChicTypography>
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '6px' }}>
              {goal.categoryIds.map(id => {
                const foundCategory = categories.find(c => c.id === id);
                if (!foundCategory) return null;
                return (
                  <span key={id} style={{ fontSize: '9px', color: THEME_COLORS.text.muted, backgroundColor: THEME_COLORS.surface, padding: '1px 6px', borderRadius: '3px' }}>
                    {foundCategory.name}
                  </span>
                );
              })}
            </div>
          </div>
          <Trash2 size={16} color={THEME_COLORS.text.muted} onClick={() => onDeleteGoal(goal.id)} style={{ cursor: 'pointer' }} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '6px' }}>
          <span style={{ color: THEME_COLORS.text.secondary }}>進行状況</span>
          <span style={{ color: THEME_COLORS.accentRed, fontWeight: 'bold' }}>{progressPercent}%</span>
        </div>
        <div style={{ width: '100%', height: '5px', backgroundColor: THEME_COLORS.surface, borderRadius: '2.5px', overflow: 'hidden', marginBottom: '16px' }}>
          <div style={{ width: `${progressPercent}%`, height: '100%', backgroundColor: THEME_COLORS.accentRed, transition: 'width 1s ease' }} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          {/* --- 左側の強調: 期限がある場合は期限情報を強調 --- */}
          <div style={{ flex: 1 }}>
            {goal.deadline ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <div style={{ fontSize: '10px', color: THEME_COLORS.text.secondary, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Calendar size={10} /> 期限まで
                </div>
                <div style={{ color: isOverdue ? THEME_COLORS.accentRed : THEME_COLORS.text.primary, fontWeight: 'bold', fontSize: '15px' }}>
                  {isOverdue ? (
                    `期限切れ (${overdueDays}日超過)`
                  ) : (
                    <>{daysRemaining}<span style={{ fontSize: '11px', marginLeft: '2px', fontWeight: 'normal', color: THEME_COLORS.text.secondary }}>日</span></>
                  )}
                </div>
                <div style={{ fontSize: '9px', color: THEME_COLORS.text.muted }}>
                  {DateUtils.formatTimestampToYMD(goal.deadline)} まで
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <div style={{ fontSize: '10px', color: THEME_COLORS.text.secondary, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Target size={10} /> 期限なし
                </div>
                <div style={{ fontSize: '12px', color: THEME_COLORS.text.muted, marginTop: '4px' }}>
                  自分のペースで継続中
                </div>
              </div>
            )}
          </div>

          {/* --- 右側の強調: 期限がある場合はノルマ、ない場合は実績を強調 --- */}
          <div style={{ textAlign: 'right' }}>
            {goal.deadline ? (
              <>
                <div style={{ fontSize: '10px', color: THEME_COLORS.text.secondary }}>1日のノルマ</div>
                <div style={{ fontSize: '15px', fontWeight: 'bold', color: THEME_COLORS.text.primary }}>
                  {dailyQuotaText || "-"}
                </div>
                <div style={{ fontSize: '9px', color: THEME_COLORS.text.muted, marginTop: '2px' }}>
                  累計実績: {(currentSec / 3600).toFixed(1)}h / {goal.targetTime}h
                </div>
              </>
            ) : (
              <>
                <div style={{ fontSize: '10px', color: THEME_COLORS.text.secondary }}>現在の累計実績</div>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: THEME_COLORS.text.primary }}>
                  {(currentSec / 3600).toFixed(1)}<span style={{ fontSize: '11px', color: THEME_COLORS.text.primary, fontWeight: 'normal', marginLeft: '3px' }}>/ {goal.targetTime}h</span>
                </div>
              </>
            )}
          </div>
        </div>

        {canRegister && (
          <ChicButton onClick={() => onUpdateGoalStatus(goal.id, 'completed')} style={{ marginTop: '16px', width: '100%', padding: '10px', fontSize: '13px' }}>
            {progressPercent >= 100 ? "目標達成！完了にする" : "期限切れで終了（完了にする）"}
          </ChicButton>
        )}
      </ChicCard>
    );
  };

  const activeGoals = goals.filter(g => g.status === 'active');

  return (
    <div key="home">
      <style>{`
        .react-datepicker__day--outside-month {
          visibility: hidden !important;
          pointer-events: none !important;
        }
      `}</style>

      <ChicTypography variant="h2" style={{ marginBottom: '15px' }}>学習サマリー</ChicTypography>

      <ChicCard padding="12px" style={{ marginBottom: '12px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', textAlign: 'center' }}>
          <div>
            <ChicTypography variant="caption" style={{ color: THEME_COLORS.text.secondary, display: 'block', marginBottom: '2px' }}>今日</ChicTypography>
            <div style={{fontSize: '18px', fontWeight: 'bold', color: THEME_COLORS.text.primary}}>{(todayMin / 60).toFixed(1)}<span style={{ fontSize: '11px', fontWeight: 'normal', color: THEME_COLORS.text.muted, marginLeft: '2px' }}>h</span></div>
          </div>
          <div style={{ borderLeft: `1px solid ${THEME_COLORS.surface}`, borderRight: `1px solid ${THEME_COLORS.surface}` }}>
            <ChicTypography variant="caption" style={{ color: THEME_COLORS.text.secondary, display: 'block', marginBottom: '2px' }}>今週</ChicTypography>
            <div style={{fontSize: '18px', fontWeight: 'bold', color: THEME_COLORS.text.primary}}>{(weekTotalSec / 3600).toFixed(1)}<span style={{ fontSize: '11px', fontWeight: 'normal', color: THEME_COLORS.text.muted, marginLeft: '2px' }}>h</span></div>
          </div>
          <div>
            <ChicTypography variant="caption" style={{ color: THEME_COLORS.text.secondary, display: 'block', marginBottom: '2px' }}>今月</ChicTypography>
            <div style={{fontSize: '18px', fontWeight: 'bold', color: THEME_COLORS.text.primary}}>{(logs.filter(l=>safeGetDate(l.createdAt).getMonth()===now.getMonth()).reduce((acc,l)=>acc+l.duration,0)/3600).toFixed(1)}<span style={{ fontSize: '11px', fontWeight: 'normal', color: THEME_COLORS.text.muted, marginLeft: '2px' }}>h</span></div>
          </div>
        </div>
      </ChicCard>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
        <ChicCard style={{ flex: 1.6, height: '210px' }} padding="12px">
          <ChicTypography variant="caption" style={{ marginBottom: '10px', display: 'block', color: THEME_COLORS.text.secondary }}>週間推移 (日〜土)</ChicTypography>
          <div style={{ width: '100%', height: '145px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} interval={0} tick={({ x, y, payload }) => ( 
                  <g transform={`translate(${x},${y})`}>
                    <text x={0} y={0} dy={10} textAnchor="middle" fill={THEME_COLORS.text.secondary} fontSize={9} fontWeight="bold">{payload.value}</text>
                    <text x={0} y={0} dy={22} textAnchor="middle" fill={THEME_COLORS.text.muted} fontSize={8}>{weeklyData.find(d => d.day === payload.value)?.dateLabel}</text>
                  </g> 
                )} />
                <YAxis domain={[0, yAxisMax]} ticks={ticks} axisLine={false} tickLine={false} fontSize={9} tick={{ fill: THEME_COLORS.text.muted }} width={30} tickFormatter={(val) => val === 0 ? "0" : `${val / 60}h`} />
                <Bar dataKey="minutes" radius={[3, 3, 0, 0]} barSize={14}>
                  {weeklyData.map((e, i) => <Cell key={i} fill={e.minutes > 0 ? THEME_COLORS.accentRed : THEME_COLORS.surface} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChicCard>
        <ChicCard style={{ flex: 1, height: '210px', display: 'flex', flexDirection: 'column', alignItems: 'center' }} padding="12px">
          <ChicTypography variant="caption" style={{ marginBottom: '5px', alignSelf: 'flex-start', color: THEME_COLORS.text.secondary }}>今週の比率</ChicTypography>
          <div style={{ width: '100%', height: '90px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="value" cx="50%" cy="50%" outerRadius={32} stroke="none">
                  {pieData.map((e, i) => <Cell key={i} fill={e.fillColor} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ width: '100%', marginTop: '5px', overflowY: 'auto', flex: 1 }}>
            {pieData.map((e, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: e.fillColor, flexShrink: 0 }} />
                <span style={{ fontSize: '9px', color: THEME_COLORS.text.secondary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.name}</span>
              </div>
            ))}
          </div>
        </ChicCard>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '15px' }}>
        <ChicCard padding="12px" style={{ textAlign: 'center', backgroundColor: THEME_COLORS.background }}>
          <ChicTypography variant="caption" style={{ color: THEME_COLORS.text.secondary, display: 'block', marginBottom: '4px' }}>今週の平均/日</ChicTypography>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: THEME_COLORS.text.primary }}>
            {Math.floor(weeklyAvgMin / 60)}<span style={{ fontSize: '11px', margin: '0 2px', fontWeight: 'normal', color: THEME_COLORS.text.muted }}>h</span>
            {weeklyAvgMin % 60}<span style={{ fontSize: '11px', marginLeft: '2px', fontWeight: 'normal', color: THEME_COLORS.text.muted }}>m</span>
          </div>
        </ChicCard>
        <ChicCard padding="12px" style={{ textAlign: 'center', backgroundColor: THEME_COLORS.background }}>
          <ChicTypography variant="caption" style={{ color: THEME_COLORS.text.secondary, display: 'block', marginBottom: '4px' }}>現在の継続日数</ChicTypography>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: THEME_COLORS.text.primary }}>
            {DateUtils.calculateStreak(logs)}<span style={{ fontSize: '11px', marginLeft: '4px', fontWeight: 'normal', color: THEME_COLORS.text.muted }}>日連続</span>
          </div>
        </ChicCard>
      </div>

      <hr style={{ border: 'none', borderTop: `1px solid ${THEME_COLORS.surface}`, margin: '20px 0' }} />

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
                fixedHeight
                popperPlacement="bottom-end" 
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