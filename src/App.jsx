import { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, deleteDoc, doc, updateDoc, where } from "firebase/firestore";
import { 
  Trash2, Plus, MapPin, Calendar, Users, CheckCircle2, Circle, 
  DollarSign, FileText, Sun, CloudRain, Snowflake, 
  Luggage, Plane, Baby, Accessibility
} from 'lucide-react';

// --- 1. Firebase 設定 ---
const firebaseConfig = {
  apiKey: "AIzaSyAwQ_elPgO-Fpp1su7B2O6o5-ZAlsVR3I0",
  authDomain: "travel-mate-app-7ca34.firebaseapp.com",
  projectId: "travel-mate-app-7ca34",
  storageBucket: "travel-mate-app-7ca34.firebasestorage.app",
  messagingSenderId: "416529155148",
  appId: "1:416529155148:web:e4519007bc7dc49b34e0e9",
  measurementId: "G-PY297WYCRF"
};

// --- 2. 初始化 ---
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const APP_ID = "travel-mate-app-7ca34"; 

// --- 預設行李建議資料庫 ---
const PACKING_SUGGESTIONS = {
  basic: ["護照/證件", "現金/信用卡", "手機充電器", "萬用轉接頭", "換洗衣物", "盥洗用具"],
  cold: ["羽絨外套", "發熱衣", "手套/圍巾", "暖暖包"],
  hot: ["防曬乳", "太陽眼鏡", "遮陽帽", "隨身風扇"],
  rainy: ["折疊雨傘", "雨衣", "防水鞋套"],
  kids: ["尿布/奶粉", "兒童餐具", "安撫玩具", "兒童備用藥", "濕紙巾"],
  elderly: ["常備藥品(高血壓等)", "老花眼鏡", "拐杖/助行器", "保暖護具"]
};

function TravelApp() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('dashboard'); // 'dashboard' | 'trip-detail'
  const [currentTrip, setCurrentTrip] = useState(null); // 當前選中的行程物件
  
  // 資料狀態
  const [trips, setTrips] = useState([]);
  const [items, setItems] = useState([]); // 行程內的細項 (預算/行李/行程)
  
  // 新增行程表單狀態
  const [newTrip, setNewTrip] = useState({
    origin: '香港',
    destination: '',
    startDate: '',
    endDate: '',
    weather: 'sunny', // sunny, rainy, cold
    hasKids: false,
    hasElderly: false,
    budget: 0
  });

  // 新增細項表單狀態
  const [newItem, setNewItem] = useState({ 
    type: 'itinerary', // itinerary, budget, packing, info
    title: '', 
    cost: '', 
    date: '', 
    notes: '' 
  });

  const [activeTab, setActiveTab] = useState('itinerary'); // 詳細頁面的分頁

  // 1. 登入監聽
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) signInAnonymously(auth);
    });
    return () => unsubscribe();
  }, []);

  // 2. 監聽「行程列表」 (Dashboard)
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'artifacts', APP_ID, 'users', user.uid, 'trips'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setTrips(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [user]);

  // 3. 監聽「單一行程的細項」 (當選中行程時)
  useEffect(() => {
    if (!user || !currentTrip) return;
    const q = query(
      collection(db, 'artifacts', APP_ID, 'users', user.uid, 'sub_items'), 
      where('tripId', '==', currentTrip.id)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [user, currentTrip]);

  // --- 動作邏輯 ---

  // 建立新行程
  const createTrip = async (e) => {
    e.preventDefault();
    if (!newTrip.destination) return;

    try {
      const docRef = await addDoc(collection(db, 'artifacts', APP_ID, 'users', user.uid, 'trips'), {
        ...newTrip,
        createdAt: serverTimestamp()
      });
      
      // 自動產生行李清單
      const tripId = docRef.id;
      let suggestions = [...PACKING_SUGGESTIONS.basic];
      if (newTrip.weather === 'cold') suggestions.push(...PACKING_SUGGESTIONS.cold);
      if (newTrip.weather === 'rainy') suggestions.push(...PACKING_SUGGESTIONS.rainy);
      if (newTrip.weather === 'sunny') suggestions.push(...PACKING_SUGGESTIONS.hot);
      if (newTrip.hasKids) suggestions.push(...PACKING_SUGGESTIONS.kids);
      if (newTrip.hasElderly) suggestions.push(...PACKING_SUGGESTIONS.elderly);

      // 批次寫入建議行李
      suggestions.forEach(async (item) => {
        await addDoc(collection(db, 'artifacts', APP_ID, 'users', user.uid, 'sub_items'), {
          tripId,
          type: 'packing',
          title: item,
          completed: false,
          createdAt: serverTimestamp()
        });
      });

      setNewTrip({ origin: '香港', destination: '', startDate: '', endDate: '', weather: 'sunny', hasKids: false, hasElderly: false, budget: 0 });
      alert("行程建立成功！已自動為您生成行李清單。");
    } catch (error) {
      console.error(error);
    }
  };

  // 刪除行程
  const deleteTrip = async (id, e) => {
    e.stopPropagation();
    if (!confirm("確定刪除此行程？所有相關資料都會消失。")) return;
    await deleteDoc(doc(db, 'artifacts', APP_ID, 'users', user.uid, 'trips', id));
    if (currentTrip?.id === id) {
      setView('dashboard');
      setCurrentTrip(null);
    }
  };

  // 進入行程詳細
  const openTrip = (trip) => {
    setCurrentTrip(trip);
    setView('trip-detail');
    setNewItem({ ...newItem, date: trip.startDate }); // 預設日期設為開始日
  };

  // 新增細項 (行程/預算/行李/資訊)
  const addItem = async (e) => {
    e.preventDefault();
    if (!newItem.title) return;
    await addDoc(collection(db, 'artifacts', APP_ID, 'users', user.uid, 'sub_items'), {
      ...newItem,
      tripId: currentTrip.id,
      completed: false,
      createdAt: serverTimestamp()
    });
    setNewItem({ ...newItem, title: '', cost: '', notes: '' });
  };

  // 切換完成狀態 (通用)
  const toggleItemComplete = async (item) => {
    await updateDoc(doc(db, 'artifacts', APP_ID, 'users', user.uid, 'sub_items', item.id), {
      completed: !item.completed
    });
  };

  // 刪除細項
  const deleteItem = async (id) => {
    await deleteDoc(doc(db, 'artifacts', APP_ID, 'users', user.uid, 'sub_items', id));
  };

  // 計算總花費
  const currentTotalCost = items
    .filter(i => i.type === 'budget' || i.cost)
    .reduce((sum, i) => sum + (Number(i.cost) || 0), 0);

  // --- 畫面渲染 ---

  // 1. 首頁：行程儀表板
  if (view === 'dashboard') {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans text-gray-800">
        <div className="max-w-4xl mx-auto space-y-6">
          <header className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-blue-900 flex items-center gap-2">
                <Plane className="text-blue-600" /> 智能旅遊管家
              </h1>
              <p className="text-gray-500">管理您的每一次冒險</p>
            </div>
            <div className="text-sm text-gray-400">User: {user?.uid.slice(0, 4)}..</div>
          </header>

          {/* 新增行程卡片 */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Plus size={20}/> 建立新旅程</h2>
            <form onSubmit={createTrip} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-gray-500">出發地</label>
                  <input value={newTrip.origin} onChange={e=>setNewTrip({...newTrip, origin: e.target.value})} className="w-full p-2 border rounded-lg" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-gray-500">目的地</label>
                  <input placeholder="例如：大阪" value={newTrip.destination} onChange={e=>setNewTrip({...newTrip, destination: e.target.value})} className="w-full p-2 border rounded-lg focus:ring-2 ring-blue-500 outline-none" required />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-gray-500">日期</label>
                  <div className="flex gap-2">
                    <input type="date" value={newTrip.startDate} onChange={e=>setNewTrip({...newTrip, startDate: e.target.value})} className="w-full p-2 border rounded-lg" />
                    <span className="self-center">~</span>
                    <input type="date" value={newTrip.endDate} onChange={e=>setNewTrip({...newTrip, endDate: e.target.value})} className="w-full p-2 border rounded-lg" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-gray-500">當地天氣預測</label>
                  <select value={newTrip.weather} onChange={e=>setNewTrip({...newTrip, weather: e.target.value})} className="w-full p-2 border rounded-lg">
                    <option value="sunny">☀️ 晴朗/炎熱 (一般)</option>
                    <option value="cold">❄️ 寒冷/下雪</option>
                    <option value="rainy">🌧️ 雨季/潮濕</option>
                  </select>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-4 pt-2">
                <label className="flex items-center gap-2 cursor-pointer bg-gray-50 px-3 py-2 rounded-lg border hover:bg-gray-100">
                  <input type="checkbox" checked={newTrip.hasKids} onChange={e=>setNewTrip({...newTrip, hasKids: e.target.checked})} />
                  <Baby size={18} className="text-pink-500"/> 同行有幼童
                </label>
                <label className="flex items-center gap-2 cursor-pointer bg-gray-50 px-3 py-2 rounded-lg border hover:bg-gray-100">
                  <input type="checkbox" checked={newTrip.hasElderly} onChange={e=>setNewTrip({...newTrip, hasElderly: e.target.checked})} />
                  <Accessibility size={18} className="text-purple-500"/> 同行有長輩
                </label>
              </div>

              <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition shadow-md">
                開始規劃旅程
              </button>
            </form>
          </div>

          {/* 行程列表 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {trips.map(trip => (
              <div key={trip.id} onClick={() => openTrip(trip)} className="bg-white p-5 rounded-xl shadow-sm border hover:border-blue-400 hover:shadow-md cursor-pointer transition group relative">
                <button onClick={(e) => deleteTrip(trip.id, e)} className="absolute top-4 right-4 text-gray-300 hover:text-red-500 p-1"><Trash2 size={16}/></button>
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  {trip.destination} 
                  {trip.weather === 'cold' && <Snowflake size={16} className="text-blue-400"/>}
                  {trip.weather === 'rainy' && <CloudRain size={16} className="text-blue-400"/>}
                  {trip.weather === 'sunny' && <Sun size={16} className="text-orange-400"/>}
                </h3>
                <p className="text-sm text-gray-500 mt-1 flex items-center gap-1"><MapPin size={14}/> {trip.origin} 出發</p>
                <p className="text-sm text-gray-500 mt-1 flex items-center gap-1"><Calendar size={14}/> {trip.startDate} ~ {trip.endDate}</p>
                <div className="flex gap-2 mt-3">
                  {trip.hasKids && <span className="text-xs bg-pink-100 text-pink-700 px-2 py-1 rounded-full flex items-center gap-1"><Baby size={12}/> 親子</span>}
                  {trip.hasElderly && <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full flex items-center gap-1"><Accessibility size={12}/> 長輩</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // 2. 詳細頁面：特定行程內容
  const tripItems = items.filter(i => i.type === activeTab);
  
  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800 flex flex-col">
      {/* 頂部導航 */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center justify-between py-3">
            <button onClick={() => setView('dashboard')} className="text-gray-500 hover:text-blue-600 text-sm flex items-center gap-1">
              ← 返回列表
            </button>
            <h1 className="font-bold text-lg">{currentTrip.destination} 之旅</h1>
            <div className="w-16"></div> 
          </div>
          
          {/* 分頁 Tab */}
          <div className="flex gap-6 overflow-x-auto pb-1 scrollbar-hide">
            {[
              { id: 'itinerary', icon: <MapPin size={18}/>, label: '行程' },
              { id: 'packing', icon: <Luggage size={18}/>, label: '行李' },
              { id: 'budget', icon: <DollarSign size={18}/>, label: '預算' },
              { id: 'info', icon: <FileText size={18}/>, label: '資訊/打卡' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setNewItem({...newItem, type: tab.id}); }}
                className={`flex items-center gap-2 pb-3 border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id ? 'border-blue-600 text-blue-600 font-bold' : 'border-transparent text-gray-500'
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 內容區域 */}
      <div className="flex-1 max-w-4xl mx-auto w-full p-4 space-y-6">
        
        {/* 資訊卡片 (如果是預算頁面，顯示總額) */}
        {activeTab === 'budget' && (
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-6 rounded-2xl shadow-lg flex justify-between items-center">
            <div>
              <p className="text-green-100 text-sm">目前累積支出</p>
              <h2 className="text-3xl font-bold">${currentTotalCost.toLocaleString()}</h2>
            </div>
            <div className="bg-white/20 p-3 rounded-full">
              <DollarSign size={32} />
            </div>
          </div>
        )}

        {/* 資訊頁面額外顯示 (如果是 Info 頁面) */}
        {activeTab === 'info' && (
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
              <h3 className="text-blue-800 font-bold flex items-center gap-2"><Sun size={16}/> 天氣提醒</h3>
              <p className="text-sm text-blue-600 mt-1">
                此趟旅程設定為：
                {currentTrip.weather === 'sunny' ? '晴朗炎熱，記得防曬補水。' : 
                 currentTrip.weather === 'cold' ? '寒冷天氣，務必帶足保暖衣物。' : '雨季，雨具隨身攜帶。'}
              </p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100">
              <h3 className="text-yellow-800 font-bold flex items-center gap-2"><DollarSign size={16}/> 匯率筆記</h3>
              <p className="text-sm text-yellow-600 mt-1">
                可在此分頁下方記錄當地匯率，或紀錄想買的手信清單。
              </p>
            </div>
          </div>
        )}

        {/* 快速新增 Bar */}
        <form onSubmit={addItem} className="bg-white p-3 rounded-xl shadow-sm border flex gap-2 items-center sticky top-32 z-10">
          <input 
            type="text" 
            placeholder={
              activeTab === 'itinerary' ? "新增行程 (如: 上午去淺草寺)" :
              activeTab === 'packing' ? "新增物品 (如: 轉接頭)" :
              activeTab === 'budget' ? "新增支出 (如: 機票)" : "新增資訊 (如: 必買香蕉蛋糕)"
            }
            className="flex-1 p-2 bg-gray-50 rounded-lg outline-none focus:bg-white focus:ring-2 ring-blue-100"
            value={newItem.title}
            onChange={e => setNewItem({...newItem, title: e.target.value})}
          />
          {(activeTab === 'budget' || activeTab === 'itinerary') && (
             <input 
             type={activeTab === 'budget' ? "number" : "date"}
             placeholder={activeTab === 'budget' ? "金額" : "日期"}
             className="w-24 p-2 bg-gray-50 rounded-lg outline-none text-sm"
             value={activeTab === 'budget' ? newItem.cost : newItem.date}
             onChange={e => activeTab === 'budget' ? setNewItem({...newItem, cost: e.target.value}) : setNewItem({...newItem, date: e.target.value})}
           />
          )}
          <button type="submit" className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700">
            <Plus size={20}/>
          </button>
        </form>

        {/* 列表內容 */}
        <div className="space-y-2 pb-20">
          {tripItems.length === 0 ? (
            <div className="text-center text-gray-400 py-10">尚無資料，請新增。</div>
          ) : (
            tripItems.sort((a,b) => (a.completed === b.completed)? 0 : a.completed? 1 : -1).map(item => (
              <div key={item.id} className={`bg-white p-4 rounded-xl border flex items-center gap-3 ${item.completed ? 'bg-gray-50 opacity-60' : 'shadow-sm'}`}>
                <button onClick={() => toggleItemComplete(item)} className={`${item.completed ? 'text-green-500' : 'text-gray-300 hover:text-blue-500'}`}>
                  {item.completed ? <CheckCircle2 size={22}/> : <Circle size={22}/>}
                </button>
                
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <span className={`font-medium ${item.completed ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                      {item.title}
                    </span>
                    {item.cost && <span className="text-sm font-bold text-gray-600">${Number(item.cost).toLocaleString()}</span>}
                  </div>
                  <div className="flex gap-2 text-xs text-gray-400 mt-1">
                     {item.date && <span className="flex items-center gap-1"><Calendar size={12}/> {item.date}</span>}
                     {item.notes && <span>{item.notes}</span>}
                  </div>
                </div>

                <button onClick={() => deleteItem(item.id)} className="text-gray-200 hover:text-red-400 p-2">
                  <Trash2 size={16}/>
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default TravelApp;
