import React, { useState, useEffect } from 'react';
import { auth, provider, db } from './firebase';
import { signInWithPopup, onAuthStateChanged } from 'firebase/auth';
import { collection, addDoc, query, where, onSnapshot, serverTimestamp, deleteDoc, doc, updateDoc, getDocs, setDoc, getDoc, Timestamp, orderBy, writeBatch } from 'firebase/firestore';

import HomeView from './components/views/Home/HomeView';
import RecordView from './components/views/Record/RecordView';
import HistoryView from './components/views/History/HistoryView';
import TodoView from './components/views/Todo/TodoView';
import Header from './components/layout/Header';
import BottomNav from './components/layout/BottomNav';

// ★追加：タイマー用ユーティリティ
import { TimerUtils } from './utils/TimerUtils';

function App() {
  const [user, setUser] = useState(null);
  const [categories, setCategories] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [logs, setLogs] = useState([]);
  const [todos, setTodos] = useState([]);
  const [dailyGoalMin, setDailyGoalMin] = useState(0); 
  const [activeTab, setActiveTab] = useState('record');
  const [activeMaterialId, setActiveMaterialId] = useState(null); 
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const [addType, setAddType] = useState('category'); 
  const [isManagementMode, setIsManagementMode] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);

  // ★追加：開始時刻をミリ秒で保持するState
  const [startTime, setStartTime] = useState(null);

  const ACCENT_RED = "#c53030"; 

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsubAuth();
  }, []);

  // ★初期ロード時に中断されたセッションを復元
  useEffect(() => {
    if (!user) return;
    
    const saved = TimerUtils.loadSession();
    if (saved.activeId) {
      setActiveMaterialId(saved.activeId);
      setSeconds(saved.seconds);
      // 開始時刻がある場合は計測中として復元
      if (saved.startTime) {
        setStartTime(saved.startTime);
        setIsRunning(true);
      }
    }
    // ...以降、既存のFirestore取得ロジック
    let unsubLogs = () => {};
    const unsubCats = onSnapshot(query(collection(db, "categories"), where("userId", "==", user.uid), orderBy("sortIndex", "asc")), (snap) => setCategories(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubMats = onSnapshot(query(collection(db, "materials"), where("userId", "==", user.uid), orderBy("sortIndex", "asc")), (snap) => setMaterials(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubTodos = onSnapshot(query(collection(db, "todos"), where("userId", "==", user.uid)), (snap) => setTodos(snap.docs.map(d => ({ id: d.id, ...d.data() }))));

    const setupLogListener = () => {
      return onSnapshot(
        query(collection(db, "study_logs"), where("userId", "==", user.uid), orderBy("createdAt", "desc")),
        (snap) => setLogs(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
        (err) => {
          unsubLogs = onSnapshot(query(collection(db, "study_logs"), where("userId", "==", user.uid)), (snap) => {
            const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            setLogs(data.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)));
          });
        }
      );
    };
    unsubLogs = setupLogListener();

    const fetchGoal = async () => {
      const docSnap = await getDoc(doc(db, "user_settings", user.uid));
      if (docSnap.exists()) setDailyGoalMin(docSnap.data().dailyGoalMin || 0);
    };
    fetchGoal();

    return () => { unsubCats(); unsubMats(); unsubTodos(); unsubLogs(); };
  }, [user]);

  // ★修正：タイマー更新ロジック（差分計算方式）
  useEffect(() => {
    let interval = null;
    if (isRunning && startTime) {
      interval = setInterval(() => {
        const elapsed = TimerUtils.calculateElapsed(startTime);
        setSeconds(elapsed);
        // 万が一のリロードに備えてこまめに保存
        TimerUtils.saveSession(startTime, activeMaterialId, elapsed);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isRunning, startTime, activeMaterialId]);

  // ★追加：タイマー開始・一時停止の切り替え
  const handleToggleTimer = () => {
    if (!isRunning) {
      // 開始：現在時刻から既に経過している秒数を引いて「仮想的な開始時刻」を作る
      const newStart = Date.now() - (seconds * 1000);
      setStartTime(newStart);
      setIsRunning(true);
      TimerUtils.saveSession(newStart, activeMaterialId, seconds);
    } else {
      // 一時停止：開始時刻を消し、現在の秒数を確定させる
      setIsRunning(false);
      setStartTime(null);
      TimerUtils.saveSession(null, activeMaterialId, seconds);
    }
  };

  const filteredLogs = logs.filter(log => {
    if (categories.length === 0 && materials.length === 0) return true; 
    return categories.some(c => c.id === log.categoryId) && materials.some(m => m.id === log.materialId);
  });

  const handleSaveGoal = async (min) => {
    const val = parseInt(min) || 0;
    await setDoc(doc(db, "user_settings", user.uid), { dailyGoalMin: val }, { merge: true });
    setDailyGoalMin(val);
  };

  const handleSaveLog = async (material) => {
    await addDoc(collection(db, "study_logs"), { userId: user.uid, materialId: material.id, materialName: material.name, categoryId: material.categoryId, duration: seconds, createdAt: serverTimestamp() });
    // 保存後はセッションをクリア
    TimerUtils.clearSession();
    setActiveMaterialId(null); setSeconds(0); setStartTime(null); setIsRunning(false); setActiveTab('home');
  };

  const handleSaveManualLog = async (material, selectedDate, durationSeconds) => {
    const date = new Date(selectedDate);
    date.setHours(0, 0, 1, 0); 
    await addDoc(collection(db, "study_logs"), { userId: user.uid, materialId: material.id, materialName: material.name, categoryId: material.categoryId, duration: durationSeconds, createdAt: Timestamp.fromDate(date) });
    setActiveMaterialId(null); setActiveTab('home');
  };

  const handleReorderUpdate = async (collectionName, reorderedItems) => {
    const batch = writeBatch(db);
    reorderedItems.forEach((item, index) => { batch.update(doc(db, collectionName, item.id), { sortIndex: index }); });
    await batch.commit();
  };

  const handleDeleteMaterial = async (id) => {
    if (window.confirm("この教材を削除すると、過去の学習履歴もすべて削除されます。よろしいですか？")) {
      const ls = await getDocs(query(collection(db, "study_logs"), where("materialId", "==", id)));
      const batch = writeBatch(db);
      ls.docs.forEach(l => batch.delete(doc(db, "study_logs", l.id)));
      batch.delete(doc(db, "materials", id));
      await batch.commit();
    }
  };

  const handleDeleteCategory = async (cat) => {
    if (window.confirm(`カテゴリ「${cat.name}」とその中の教材・全履歴を削除しますか？`)) {
      const mq = query(collection(db, "materials"), where("categoryId", "==", cat.id));
      const ms = await getDocs(mq);
      const batch = writeBatch(db);
      for (const md of ms.docs) {
        const ls = await getDocs(query(collection(db, "study_logs"), where("materialId", "==", md.id)));
        ls.docs.forEach(l => batch.delete(doc(db, "study_logs", l.id)));
        batch.delete(doc(db, "materials", md.id));
      }
      batch.delete(doc(db, "categories", cat.id));
      await batch.commit();
    }
  };

  const handleDeleteLog = async (logId) => {
    if (window.confirm("この学習記録を削除しますか？")) {
      await deleteDoc(doc(db, "study_logs", logId));
    }
  };

  const handleUpdateLog = async (logId, newDurationSeconds) => {
    await updateDoc(doc(db, "study_logs", logId), {
      duration: newDurationSeconds
    });
  };

  const layoutStyles = {
    container: { backgroundColor: '#000', minHeight: '100vh', width: '100%', color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center' },
    mainContent: { width: '100%', maxWidth: '500px', padding: '20px', paddingBottom: '140px', boxSizing: 'border-box' }
  };

  if (!user) return <div style={layoutStyles.container}><button onClick={() => signInWithPopup(auth, provider)} style={{marginTop: '40vh'}}>Login with Google</button></div>;

  return (
    <div style={layoutStyles.container}>
      <div style={layoutStyles.mainContent}>
        <Header />
        {activeTab === 'home' && <HomeView logs={filteredLogs} categories={categories} dailyGoalMin={dailyGoalMin} onSaveGoal={handleSaveGoal} ACCENT_RED={ACCENT_RED} />}
        {activeTab === 'record' && (
          <RecordView 
            categories={categories} 
            materials={materials} 
            activeMaterialId={activeMaterialId} 
            isManagementMode={isManagementMode} 
            isAddMenuOpen={isAddMenuOpen} 
            addType={addType} 
            seconds={seconds} 
            isRunning={isRunning} 
            ACCENT_RED={ACCENT_RED} 
            setActiveMaterialId={(id) => {
              setActiveMaterialId(id);
              // 教材を選択した時点で一旦セッションを保存（秒数は0）
              if (id) TimerUtils.saveSession(null, id, 0);
              else TimerUtils.clearSession();
            }} 
            setIsManagementMode={setIsManagementMode} 
            setIsAddMenuOpen={setIsAddMenuOpen} 
            setAddType={setAddType} 
            setIsRunning={handleToggleTimer} // ★修正：専用のトグル関数を渡す
            setSeconds={setSeconds} 
            onSaveLog={handleSaveLog} 
            onSaveManualLog={handleSaveManualLog} 
            onAddCategory={(name) => addDoc(collection(db, "categories"), { name: name.trim(), userId: user.uid, sortIndex: categories.length })} 
            onUpdateCategory={(id, name) => updateDoc(doc(db, "categories", id), { name })} 
            onAddMaterial={(name, catId) => { const catMaterials = materials.filter(m => m.categoryId === catId); addDoc(collection(db, "materials"), { name: name.trim(), categoryId: catId, userId: user.uid, sortIndex: catMaterials.length }); }} 
            onUpdateMaterial={(id, name) => updateDoc(doc(db, "materials", id), { name })} 
            onDeleteMaterial={handleDeleteMaterial} 
            onDeleteCategory={handleDeleteCategory} 
            onReorderUpdate={handleReorderUpdate} 
          />
        )}
        {activeTab === 'history' && <HistoryView logs={filteredLogs} categories={categories} ACCENT_RED={ACCENT_RED} onDeleteLog={handleDeleteLog} onUpdateLog={handleUpdateLog} />}
        {activeTab === 'todo' && (
          <TodoView todos={todos} onAddTodo={(text) => addDoc(collection(db, "todos"), { text, completed: false, userId: user.uid })} onToggleTodo={(id, completed) => updateDoc(doc(db, "todos", id), { completed })} onDeleteTodo={(id) => deleteDoc(doc(db, "todos", id))} ACCENT_RED={ACCENT_RED} />
        )}
      </div>
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}

export default App;