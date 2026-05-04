import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, PieChart, Pie, CartesianGrid } from 'recharts';
import { Target, Settings2 } from 'lucide-react';
import { DateUtils } from '../../../utils/DateUtils';
import ChicCard from '../../common/ChicCard';
import ChicButton from '../../common/ChicButton';
import ChicInput from '../../common/ChicInput';
import ChicTypography from '../../common/ChicTypography';

// ★修正：テーマカラーを一括管理するファイルをインポート
import { THEME_COLORS } from '../../../styles/theme';

// ★修正：ACCENT_RED は props で受け取らず THEME_COLORS から直接使う
const HomeView = ({ logs, categories, dailyGoalMin, onSaveGoal }) => {
  const [isGoalSettingOpen, setIsGoalSettingOpen] = useState(false);
  const [isGoalDisplayOpen, setIsGoalDisplayOpen] = useState(true);
  const [tempGoal, setTempGoal] = useState("");

  const now = new Date();
  const todayKey = DateUtils.getDateKey(now);
  
  const safeGetDate = (timestamp) => timestamp ? timestamp.toDate() : new Date();

  // 今日のデータ
  const todaySec = logs.filter(l => DateUtils.getDateKey(safeGetDate(l.createdAt)) === todayKey).reduce((s, l) => s + l.duration, 0);
  const todayMin = Math.floor(todaySec / 60);
  const progressPercent = dailyGoalMin > 0 ? Math.min(Math.round((todayMin / dailyGoalMin) * 100), 100) : 0;
  
  // 今週の範囲（日〜土）を定義
  const weekRange = DateUtils.getCurrentWeekRange();
  const startOfWeek = weekRange[0];
  const endOfWeek = new Date(weekRange[6]);
  endOfWeek.setHours(23, 59, 59, 999); // 土曜日の23:59:59まで

  // ログ全体から「今週分」だけを抽出
  const currentWeekLogs = logs.filter(l => {
    const d = safeGetDate(l.createdAt);
    return d >= startOfWeek && d <= endOfWeek;
  });

  // 棒グラフ用データ（今週のログを使用）
  const weeklyData = weekRange.map(date => {
    const dKey = DateUtils.getDateKey(date);
    const daySec = currentWeekLogs.filter(l => DateUtils.getDateKey(safeGetDate(l.createdAt)) === dKey).reduce((s, l) => s + l.duration, 0);
    return { day: DateUtils.weekLabels[date.getDay()], dateLabel: `${date.getMonth() + 1}/${date.getDate()}`, minutes: Math.floor(daySec / 60) };
  });

  const weekTotalSec = currentWeekLogs.reduce((s, l) => s + l.duration, 0);
  const monthSec = logs.filter(l => safeGetDate(l.createdAt).getMonth() === now.getMonth()).reduce((s, l) => s + l.duration, 0);
  
// 円グラフのデータ
  // 1. まず今週勉強した時間だけを集計し、0時間のものを除外する
  const activeCategories = categories.map(cat => ({ 
    name: cat.name, 
    value: currentWeekLogs.filter(l => l.categoryId === cat.id).reduce((s, l) => s + l.duration, 0)
  })).filter(d => d.value > 0);

  // 2. 生き残った（グラフに表示される）カテゴリに対してのみ、順番に色を割り当てる
  const pieData = activeCategories.map((data, index) => ({
    ...data,
    fillColor: THEME_COLORS.charts[index % THEME_COLORS.charts.length]
  }));

  // 週間平均と継続日数の計算
  const weeklyAvgMin = Math.floor((weekTotalSec / 7) / 60); 
  const currentStreak = DateUtils.calculateStreak(logs);

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
      
      <div style={{ display: 'flex', gap: '12px', marginBottom: '15px' }}>
        <ChicCard style={{ flex: 1.6, height: '260px' }} padding="15px">
          {/* ★修正：captionの文字色を明るいグレーに */}
          <ChicTypography variant="caption" style={{ marginBottom: '15px', display: 'block', color: THEME_COLORS.text.secondary }}>週間推移 (日〜土)</ChicTypography>
          <div style={{ width: '100%', height: '180px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} interval={0} tick={({ x, y, payload }) => ( 
                  <g transform={`translate(${x},${y})`}>
                    {/* ★修正：X軸の曜日と日付の文字色を明るく */}
                    <text x={0} y={0} dy={10} textAnchor="middle" fill={THEME_COLORS.text.secondary} fontSize={10} fontWeight="bold">{payload.value}</text>
                    <text x={0} y={0} dy={24} textAnchor="middle" fill={THEME_COLORS.text.muted} fontSize={9}>{weeklyData.find(d => d.day === payload.value)?.dateLabel}</text>
                  </g> 
                )} />
                {/* ★修正：Y軸の文字色を明るく */}
                <YAxis domain={[0, yAxisMax]} ticks={ticks} axisLine={false} tickLine={false} fontSize={10} tick={{ fill: THEME_COLORS.text.muted }} width={35} tickFormatter={(val) => val === 0 ? "0" : `${val / 60}h`} />
                <Bar dataKey="minutes" radius={[3, 3, 0, 0]} barSize={16}>
                  {weeklyData.map((e, i) => <Cell key={i} fill={e.minutes > 0 ? THEME_COLORS.accentRed : THEME_COLORS.surface} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChicCard>

        <ChicCard style={{ flex: 1, height: '260px', display: 'flex', flexDirection: 'column', alignItems: 'center' }} padding="15px">
          {/* ★修正：文字色を明るく */}
          <ChicTypography variant="caption" style={{ marginBottom: '5px', alignSelf: 'flex-start', color: THEME_COLORS.text.secondary }}>今週の比率</ChicTypography>
          <div style={{ width: '100%', height: '100px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                {/* ★修正：パイチャートの色をカテゴリごとに分ける */}
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
                {/* ★修正：凡例の文字色を明るく */}
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
            {currentStreak}<span style={{ fontSize: '12px', marginLeft: '4px', fontWeight: 'normal', color: THEME_COLORS.text.muted }}>日連続</span>
          </div>
        </ChicCard>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
        <ChicButton variant={isGoalDisplayOpen ? "save" : "cancel"} onClick={() => setIsGoalDisplayOpen(!isGoalDisplayOpen)} style={{ backgroundColor: THEME_COLORS.background }}><Target size={16}/>進捗</ChicButton>
        <ChicButton variant="cancel" onClick={() => setIsGoalSettingOpen(!isGoalSettingOpen)} style={{ backgroundColor: THEME_COLORS.background, flex: 1 }}><Settings2 size={16}/>設定</ChicButton>
      </div>
      
      {isGoalSettingOpen && (
        <ChicCard>
          <ChicTypography variant="label" style={{ marginBottom: '10px', display: 'block', color: THEME_COLORS.text.secondary }}>目標時間 (分)</ChicTypography>
          <ChicInput type="number" value={tempGoal} onChange={e => setTempGoal(e.target.value)} placeholder="120" />
          <ChicButton onClick={() => { onSaveGoal(tempGoal); setIsGoalSettingOpen(false); setTempGoal(""); }}>保存</ChicButton>
        </ChicCard>
      )}
      
      {isGoalDisplayOpen && dailyGoalMin > 0 && (
        <ChicCard>
          <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '8px'}}>
            <ChicTypography variant="label" style={{ color: THEME_COLORS.text.secondary }}>達成度</ChicTypography>
            <span style={{fontWeight: 'bold', color: THEME_COLORS.accentRed, fontSize: '12px'}}>{progressPercent}%</span>
          </div>
          <div style={{width: '100%', height: '4px', backgroundColor: THEME_COLORS.surface, borderRadius: '2px', overflow: 'hidden'}}>
            <div style={{width: `${progressPercent}%`, height: '100%', backgroundColor: THEME_COLORS.accentRed, transition: 'width 0.8s ease'}} />
          </div>
          <ChicTypography variant="caption" style={{ marginTop: '10px', display: 'block', color: THEME_COLORS.text.muted }}>{todayMin} / {dailyGoalMin} 分 完了</ChicTypography>
        </ChicCard>
      )}
    </div>
  );
};

export default HomeView;