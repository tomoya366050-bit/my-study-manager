import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, PieChart, Pie, CartesianGrid } from 'recharts';
import { Target, Settings2 } from 'lucide-react';
import { DateUtils } from '../../../utils/DateUtils';
import ChicCard from '../../common/ChicCard';
import ChicButton from '../../common/ChicButton';
import ChicInput from '../../common/ChicInput';
import ChicTypography from '../../common/ChicTypography';

const HomeView = ({ logs, categories, dailyGoalMin, onSaveGoal, ACCENT_RED }) => {
  const [isGoalSettingOpen, setIsGoalSettingOpen] = useState(false);
  const [isGoalDisplayOpen, setIsGoalDisplayOpen] = useState(true);
  const [tempGoal, setTempGoal] = useState("");

  const now = new Date();
  const todayKey = DateUtils.getDateKey(now);
  
  // ★修正：log.createdAt が null の場合は now として扱う（エラー防止）
  const safeGetDate = (timestamp) => timestamp ? timestamp.toDate() : new Date();

  const todaySec = logs.filter(l => DateUtils.getDateKey(safeGetDate(l.createdAt)) === todayKey).reduce((s, l) => s + l.duration, 0);
  const todayMin = Math.floor(todaySec / 60);
  const progressPercent = dailyGoalMin > 0 ? Math.min(Math.round((todayMin / dailyGoalMin) * 100), 100) : 0;
  
  const weekRange = DateUtils.getCurrentWeekRange();
  const weeklyData = weekRange.map(date => {
    const dKey = DateUtils.getDateKey(date);
    const daySec = logs.filter(l => DateUtils.getDateKey(safeGetDate(l.createdAt)) === dKey).reduce((s, l) => s + l.duration, 0);
    return { day: DateUtils.weekLabels[date.getDay()], dateLabel: `${date.getMonth() + 1}/${date.getDate()}`, minutes: Math.floor(daySec / 60) };
  });

  const weekTotalSec = logs.filter(l => safeGetDate(l.createdAt) >= weekRange[0] && safeGetDate(l.createdAt) <= now).reduce((s, l) => s + l.duration, 0);
  const monthSec = logs.filter(l => safeGetDate(l.createdAt).getMonth() === now.getMonth()).reduce((s, l) => s + l.duration, 0);
  const pieData = categories.map((cat, index) => ({ name: cat.name, value: logs.filter(l => l.categoryId === cat.id).reduce((s, l) => s + l.duration, 0), fillOpacity: 1 - (index * 0.15) })).filter(d => d.value > 0);

  const maxWeeklyMinutes = Math.max(...weeklyData.map(d => d.minutes), 0);
  const thresholds = [60, 180, 360, 540, 720, 900, 1080, 1260, 1440];
  const yAxisMax = thresholds.find(v => v >= maxWeeklyMinutes) || 1440;
  const tickInterval = yAxisMax <= 180 ? 60 : 180;
  const ticks = [];
  for (let i = 0; i <= yAxisMax; i += tickInterval) { ticks.push(i); }

  return (
    <div key="home">
      <ChicTypography variant="h2">学習サマリー</ChicTypography>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', textAlign: 'center', marginBottom: '25px' }}>
        <div><ChicTypography variant="label">今日</ChicTypography><div style={{fontSize: '20px', fontWeight: 'bold'}}>{(todayMin / 60).toFixed(1)}h</div></div>
        <div><ChicTypography variant="label">今週</ChicTypography><div style={{fontSize: '20px', fontWeight: 'bold'}}>{(weekTotalSec / 3600).toFixed(1)}h</div></div>
        <div><ChicTypography variant="label">今月</ChicTypography><div style={{fontSize: '20px', fontWeight: 'bold'}}>{(monthSec / 3600).toFixed(1)}h</div></div>
      </div>
      
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
        <ChicCard style={{ flex: 1.6, height: '260px' }} padding="15px">
          <ChicTypography variant="caption" style={{ marginBottom: '15px', display: 'block' }}>週間推移 (日〜土)</ChicTypography>
          <div style={{ width: '100%', height: '180px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1a1a1a" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} interval={0} tick={({ x, y, payload }) => ( <g transform={`translate(${x},${y})`}><text x={0} y={0} dy={10} textAnchor="middle" fill="#444" fontSize={10} fontWeight="bold">{payload.value}</text><text x={0} y={0} dy={24} textAnchor="middle" fill="#222" fontSize={9}>{weeklyData.find(d => d.day === payload.value)?.dateLabel}</text></g> )} />
                <YAxis domain={[0, yAxisMax]} ticks={ticks} axisLine={false} tickLine={false} fontSize={10} tick={{ fill: '#444' }} width={35} tickFormatter={(val) => val === 0 ? "0" : `${val / 60}h`} />
                <Bar dataKey="minutes" radius={[3, 3, 0, 0]} barSize={16}>
                  {weeklyData.map((e, i) => <Cell key={i} fill={e.minutes > 0 ? ACCENT_RED : "#111"} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChicCard>

        <ChicCard style={{ flex: 1, height: '260px', display: 'flex', flexDirection: 'column', alignItems: 'center' }} padding="15px">
          <ChicTypography variant="caption" style={{ marginBottom: '5px', alignSelf: 'flex-start' }}>比率</ChicTypography>
          <div style={{ width: '100%', height: '100px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="value" cx="50%" cy="50%" outerRadius={35} stroke="none">{pieData.map((e, i) => <Cell key={i} fill={ACCENT_RED} opacity={e.fillOpacity} />)}</Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ width: '100%', marginTop: '10px', overflowY: 'auto', flex: 1 }}>
            {pieData.map((e, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: ACCENT_RED, opacity: e.fillOpacity }} />
                <span style={{ fontSize: '9px', color: '#888', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.name}</span>
              </div>
            ))}
          </div>
        </ChicCard>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
        <ChicButton variant={isGoalDisplayOpen ? "save" : "cancel"} onClick={() => setIsGoalDisplayOpen(!isGoalDisplayOpen)} style={{ backgroundColor: '#0a0a0a' }}><Target size={16}/>進捗</ChicButton>
        <ChicButton variant="cancel" onClick={() => setIsGoalSettingOpen(!isGoalSettingOpen)} style={{ backgroundColor: '#0a0a0a', flex: 1 }}><Settings2 size={16}/>設定</ChicButton>
      </div>
      
      {isGoalSettingOpen && (
        <ChicCard>
          <ChicTypography variant="label" style={{ marginBottom: '10px', display: 'block' }}>目標時間 (分)</ChicTypography>
          <ChicInput type="number" value={tempGoal} onChange={e => setTempGoal(e.target.value)} placeholder="120" />
          <ChicButton onClick={() => { onSaveGoal(tempGoal); setIsGoalSettingOpen(false); setTempGoal(""); }}>保存</ChicButton>
        </ChicCard>
      )}
      
      {isGoalDisplayOpen && dailyGoalMin > 0 && (
        <ChicCard>
          <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '8px'}}><ChicTypography variant="label">達成度</ChicTypography><span style={{fontWeight: 'bold', color: ACCENT_RED, fontSize: '12px'}}>{progressPercent}%</span></div>
          <div style={{width: '100%', height: '4px', backgroundColor: '#111', borderRadius: '2px', overflow: 'hidden'}}><div style={{width: `${progressPercent}%`, height: '100%', backgroundColor: ACCENT_RED, transition: 'width 0.8s ease'}} /></div>
          <ChicTypography variant="caption" style={{ marginTop: '10px', display: 'block' }}>{todayMin} / {dailyGoalMin} 分 完了</ChicTypography>
        </ChicCard>
      )}
    </div>
  );
};

export default HomeView;