import React, { useState, useEffect } from 'react';
import { auth, provider, db } from './firebase';
import { signInWithPopup, onAuthStateChanged } from 'firebase/auth';
import { collection, addDoc, query, where, onSnapshot, serverTimestamp, deleteDoc, doc, updateDoc, getDocs, setDoc, getDoc, Timestamp, orderBy, writeBatch } from 'firebase/firestore';

import HomeView from './components/views/Home/HomeView';
import RecordView from './components/views/Record/RecordView';
import HistoryView from './components/views/History/HistoryView';
import TodoView from './components/views/ToDo/ToDoView';
import Header from './components/layout/Header';
import BottomNav from './components/layout/BottomNav';

import { TimerUtils } from './utils/TimerUtils';
import { ValidationUtils } from './utils/ValidationUtils';

function App() {
  const [user, setUser] = useState(null);
  const [categories, setCategories] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [logs, setLogs] = useState([]);
  const [todos, setTodos] = useState([]);
  const [goals, setGoals] = useState([]); 
  const [dailyGoalMin, setDailyGoalMin] = useState(0); 
  const [activeTab, setActiveTab] = useState('home');
  const [activeMaterialId, setActiveMaterialId] = useState(null); 
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const [addType, setAddType] = useState('category'); 
  const [isManagementMode, setIsManagementMode] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [startTime, setStartTime] = useState(null);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsubAuth();
  }, []);

  useEffect(() => {
    if (!user) return;
    const saved = TimerUtils.loadSession();
    if (saved.activeId) {
      setActiveMaterialId(saved.activeId);
      setSeconds(saved.seconds);
      if (saved.startTime) {
        setStartTime(saved.startTime);
        setIsRunning(true);
      }
    }
    const unsubCats = onSnapshot(query(collection(db, "categories"), where("userId", "==", user.uid), orderBy("sortIndex", "asc")), (snap) => setCategories(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubMats = onSnapshot(query(collection(db, "materials"), where("userId", "==", user.uid), orderBy("sortIndex", "asc")), (snap) => setMaterials(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubTodos = onSnapshot(query(collection(db, "todos"), where("userId", "==", user.uid)), (snap) => setTodos(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubGoals = onSnapshot(query(collection(db, "goals"), where("userId", "==", user.uid), orderBy("createdAt", "desc")), (snap) => setGoals(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubLogs = onSnapshot(query(collection(db, "study_logs"), where("userId", "==", user.uid), orderBy("createdAt", "desc")), (snap) => setLogs(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    return () => { unsubCats(); unsubMats(); unsubTodos(); unsubLogs(); unsubGoals(); };
  }, [user]);

  useEffect(() => {
    let interval = null;
    if (isRunning && startTime) {
      interval = setInterval(() => {
        const elapsed = TimerUtils.calculateElapsed(startTime);
        setSeconds(elapsed);
        TimerUtils.saveSession(startTime, activeMaterialId, elapsed);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isRunning, startTime, activeMaterialId]);

  const handleToggleTimer = () => {
    if (!isRunning) {
      const newStart = Date.now() - (seconds * 1000);
      setStartTime(newStart);
      setIsRunning(true);
      TimerUtils.saveSession(newStart, activeMaterialId, seconds);
    } else {
      setIsRunning(false);
      setStartTime(null);
      TimerUtils.saveSession(null, activeMaterialId, seconds);
    }
  };

  const handleSaveGoal = async (min) => {
    const val = parseInt(min) || 0;
    await setDoc(doc(db, "user_settings", user.uid), { dailyGoalMin: val }, { merge: true });
    setDailyGoalMin(val);
  };

  const handleAddLearningGoal = async (goalData) => {
    await addDoc(collection(db, "goals"), { ...goalData, userId: user.uid, status: 'active', createdAt: serverTimestamp() });
  };

  const handleUpdateGoalStatus = async (goalId, status) => {
    const updateData = { status };
    if (status === 'completed') updateData.completedAt = serverTimestamp();
    await updateDoc(doc(db, "goals", goalId), updateData);
  };

  const handleDeleteGoal = async (goalId) => {
    if (window.confirm("この学習目標を削除しますか？")) await deleteDoc(doc(db, "goals", goalId));
  };

  const handleSaveLog = async (material) => {
    await addDoc(collection(db, "study_logs"), { userId: user.uid, materialId: material.id, materialName: material.name, categoryId: material.categoryId, duration: seconds, createdAt: serverTimestamp() });
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
      const ls = await getDocs(query(collection(db, "study_logs"), where("materialId", "==", id), where("userId", "==", user.uid)));
      const batch = writeBatch(db);
      ls.docs.forEach(l => batch.delete(doc(db, "study_logs", l.id)));
      batch.delete(doc(db, "materials", id));
      await batch.commit();
    }
  };

  const handleDeleteCategory = async (cat) => {
    if (!cat?.id) return;
    if (window.confirm(`カテゴリ「${cat.name}」とその中の教材・全履歴、および関連する学習目標を整理しますか？`)) {
      const batch = writeBatch(db);
      const mq = query(collection(db, "materials"), where("categoryId", "==", cat.id), where("userId", "==", user.uid));
      const ms = await getDocs(mq);
      for (const md of ms.docs) {
        const ls = await getDocs(query(collection(db, "study_logs"), where("materialId", "==", md.id), where("userId", "==", user.uid)));
        ls.docs.forEach(l => batch.delete(doc(db, "study_logs", l.id)));
        batch.delete(doc(db, "materials", md.id));
      }
      const goalSnap = await getDocs(query(collection(db, "goals"), where("userId", "==", user.uid)));
      goalSnap.docs.forEach(goalDoc => {
        const goalData = goalDoc.data();
        const ids = goalData.categoryIds || [];
        if (ids.includes(cat.id)) {
          if (ids.length > 1) {
            batch.update(doc(db, "goals", goalDoc.id), { categoryIds: ids.filter(id => id !== cat.id) });
          } else {
            batch.delete(doc(db, "goals", goalDoc.id));
          }
        }
      });
      batch.delete(doc(db, "categories", cat.id));
      await batch.commit();
    }
  };

  const handleDeleteLog = async (logId) => {
    if (window.confirm("この学習記録を削除しますか？")) await deleteDoc(doc(db, "study_logs", logId));
  };

  const handleUpdateLog = async (logId, newDurationSeconds) => {
    await updateDoc(doc(db, "study_logs", logId), { duration: newDurationSeconds });
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
        {activeTab === 'home' && <HomeView logs={logs} categories={categories} goals={goals} onAddGoal={handleAddLearningGoal} onDeleteGoal={handleDeleteGoal} onUpdateGoalStatus={handleUpdateGoalStatus} />}
        {activeTab === 'record' && (
          <RecordView 
            categories={categories} materials={materials} activeMaterialId={activeMaterialId} isManagementMode={isManagementMode} isAddMenuOpen={isAddMenuOpen} addType={addType} seconds={seconds} isRunning={isRunning} 
            setActiveMaterialId={setActiveMaterialId} setIsManagementMode={setIsManagementMode} setIsAddMenuOpen={setIsAddMenuOpen} setAddType={setAddType} setIsRunning={handleToggleTimer} setSeconds={setSeconds} onSaveLog={handleSaveLog} onSaveManualLog={handleSaveManualLog} 
            onAddCategory={(name) => addDoc(collection(db, "categories"), { name: name.trim(), userId: user.uid, sortIndex: categories.length, status: 'active' })} 
            onAddMaterial={(name, catId) => addDoc(collection(db, "materials"), { name: name.trim(), categoryId: catId, userId: user.uid, sortIndex: materials.filter(m => m.categoryId === catId).length })}
            onUpdateCategory={(id, name, status) => updateDoc(doc(db, "categories", id), { name: name.trim(), status: status || 'active' })}
            onUpdateMaterial={(id, name) => updateDoc(doc(db, "materials", id), { name: name.trim() })}
            onDeleteMaterial={handleDeleteMaterial} onDeleteCategory={handleDeleteCategory} onReorderUpdate={handleReorderUpdate} 
          />
        )}
        {activeTab === 'history' && (
          <HistoryView 
            logs={logs} categories={categories} goals={goals} 
            onDeleteLog={handleDeleteLog} onUpdateLog={handleUpdateLog} 
            onDeleteGoal={handleDeleteGoal} // ★追加
          />
        )}
        {activeTab === 'todo' && <TodoView todos={todos} onAddTodo={(text) => addDoc(collection(db, "todos"), { text: text.trim(), completed: false, userId: user.uid })} onToggleTodo={(id, completed) => updateDoc(doc(db, "todos", id), { completed })} onDeleteTodo={(id) => deleteDoc(doc(db, "todos", id))} />}
      </div>
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}

export default App;