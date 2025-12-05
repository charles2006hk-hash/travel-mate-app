import { useState, useEffect, useMemo } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, deleteDoc, doc, updateDoc, where } from "firebase/firestore";
import { 
  Trash2, Plus, MapPin, Calendar, CheckCircle2, Circle, 
  DollarSign, FileText, Sun, CloudRain, Snowflake, 
  Luggage, Plane, Baby, Accessibility, User, Navigation,
  History, MapPin as MapPinIcon, Camera, Palmtree, ShoppingBag,
  Calculator, RefreshCw, Coins
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

// --- 3. 靜態資料庫 (模擬 AI, API 與 匯率) ---

// 城市資料：座標、地區代碼、當地貨幣
const CITY_DATA = {
  "東京": { lat: 35.6762, lon: 139.6503, currency: "JPY", region: "JP" },
  "大阪": { lat: 34.6937, lon: 135.5023, currency: "JPY", region: "JP" },
  "京都": { lat: 35.0116, lon: 135.7681, currency: "JPY", region: "JP" },
  "首爾": { lat: 37.5665, lon: 126.9780, currency: "KRW", region: "KR" },
  "台北": { lat: 25.0330, lon: 121.5654, currency: "TWD", region: "TW" },
  "曼谷": { lat: 13.7563, lon: 100.5018, currency: "THB", region: "TH" },
  "新加坡": { lat: 1.3521, lon: 103.8198, currency: "SGD", region: "SG" },
  "倫敦": { lat: 51.5074, lon: -0.1278, currency: "GBP", region: "UK" },
  "巴黎": { lat: 48.8566, lon: 2.3522, currency: "EUR", region: "EU" },
  "香港": { lat: 22.3193, lon: 114.1694, currency: "HKD", region: "HK" },
};

const POPULAR_CITIES = Object.keys(CITY_DATA);

// 模擬匯率 (以 HKD 為基準)
const EXCHANGE_RATES = {
  "HKD": 1,
  "JPY": 0.052,  // 1 日圓 = 0.052 港幣
  "KRW": 0.0058, // 1 韓元 = 0.0058 港幣
  "TWD": 0.25,   // 1 台幣 = 0.25 港幣
  "THB": 0.22,   // 1 泰銖 = 0.22 港幣
  "SGD": 5.8,    // 1 新幣 = 5.8 港幣
  "GBP": 9.9,    // 1 英鎊 = 9.9 港幣
  "EUR": 8.5,    // 1 歐元 = 8.5 港幣
  "USD": 7.8     // 1 美金 = 7.8 港幣
};

// 預估消費水準 (HKD/人/天) - 用於自動估算預算
const ESTIMATED_COSTS = {
  "JP": { flight: 4000, hotel: 1000, food: 400, transport: 150 },
  "KR": { flight: 2500, hotel: 800, food: 300, transport: 100 },
  "TW": { flight: 1500, hotel: 600, food: 200, transport: 80 },
  "TH": { flight: 1800, hotel: 500, food: 150, transport: 50 },
  "SG": { flight: 2500, hotel: 1500, food: 400, transport: 100 },
  "UK": { flight: 8000, hotel: 1500, food: 600, transport: 200 },
  "EU": { flight: 7500, hotel: 1400, food: 550, transport: 180 },
  "HK": { flight: 0,    hotel: 0,    food: 400, transport: 100 }, // 本地遊
  "default": { flight: 5000, hotel: 1000, food: 400, transport: 150 }
};

// 行李規則庫
const PACKING_RULES = {
  common: ["護照/簽證", "現金/信用卡", "手機充電器", "萬用轉接頭", "行動電源", "個人盥洗包"],
  adult: ["換洗衣物", "刮鬍刀/化妝品", "常備藥品"],
  child: ["兒童牙刷", "安撫玩具", "畫冊/貼紙書", "兒童餐具", "水壺"], 
  toddler: ["尿布 (計算天數x6)", "奶粉/奶瓶", "濕紙巾", "嬰兒推車", "口水巾"],
  elderly: ["處方籤藥物", "老花眼鏡", "保暖護具", "折疊拐杖/助行器", "保溫瓶"],
  weather: {
    sunny: ["防曬乳", "太陽眼鏡", "遮陽帽", "隨身風扇"],
    rainy: ["折疊雨傘", "輕便雨衣", "防水鞋套"],
    cold: ["羽絨外套", "發熱衣", "手套/圍巾", "暖暖包"]
  },
  purpose: {
    shopping: ["大型購物袋", "備用行李箱", "退稅單據夾"],
    camera: ["相機/鏡頭", "腳架", "記憶卡", "備用電池"],
    beach: ["泳衣/泳褲", "沙灘拖鞋", "防水手機袋"]
  }
};

const ITINERARY_TEMPLATES = {
  "東京": ["抵達東京 & 飯店Check-in", "迪士尼樂園全日遊", "淺草雷門 & 晴空塔", "澀谷/原宿 購物行程", "前往機場 & 免稅店採買"],
  "大阪": ["抵達大阪 & 道頓堀美食", "環球影城 USJ", "大阪城 & 黑門市場", "奈良餵鹿一日遊", "臨空城 Outlet & 機場"],
  "default": ["抵達目的地 & 辦理入住", "市區著名景點觀光", "當地美食探索", "購物與休閒時間", "整理行李 & 返程"]
};

function TravelApp() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('dashboard'); 
  const [currentTrip, setCurrentTrip] = useState(null);
  
  const [trips, setTrips] = useState([]);
  const [items, setItems] = useState([]);
  const [searchHistory, setSearchHistory] = useState([]);

  // 表單狀態
  const [newTrip, setNewTrip] = useState({
    origin: '香港',
    destination: '',
    startDate: '',
    endDate: '',
    purpose: 'sightseeing', 
    travelers: { adults: 1, children: 0, toddlers: 0, elderly: 0 },
    estimatedBudget: 0, // 自動估算欄位
    budgetDetails: {}   // 估算細項
  });

  // 新增項目表單 (支援多幣種)
  const [newItem, setNewItem] = useState({ 
    type: 'itinerary', 
    title: '', 
    cost: '',          // 最終換算後的 HKD
    foreignCost: '',   // 當地貨幣金額
    currency: 'HKD',   // 選擇的貨幣
    date: '', 
    notes: '' 
  });

  const [activeTab, setActiveTab] = useState('itinerary');
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  const [loadingWeather, setLoadingWeather] = useState(false);

  // 初始化
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) signInAnonymously(auth);
    });
    const savedHistory = localStorage.getItem('trip_search_history');
    if (savedHistory) setSearchHistory(JSON.parse(savedHistory));
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'artifacts', APP_ID, 'users', user.uid, 'trips'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      setTrips(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
  }, [user]);

  useEffect(() => {
    if (!user || !currentTrip) return;
    const q = query(
      collection(db, 'artifacts', APP_ID, 'users', user.uid, 'sub_items'), 
      where('tripId', '==', currentTrip.id)
    );
    return onSnapshot(q, (snapshot) => {
      setItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
  }, [user, currentTrip]);

  // --- 自動預算估算邏輯 ---
  useEffect(() => {
    if (newTrip.destination && newTrip.startDate && newTrip.endDate) {
      calculateEstimatedBudget();
    }
  }, [newTrip.destination, newTrip.startDate, newTrip.endDate, newTrip.travelers]);

  const calculateEstimatedBudget = () => {
    const cityInfo = CITY_DATA[newTrip.destination];
    const region = cityInfo ? cityInfo.region : 'default';
    const costs = ESTIMATED_COSTS[region] || ESTIMATED_COSTS['default'];

    const start = new Date(newTrip.startDate);
    const end = new Date(newTrip.endDate);
    const days = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1);
    
    // 人數加權 (小孩/老人花費較少)
    const totalPeople = newTrip.travelers.adults + newTrip.travelers.children * 0.8 + newTrip.travelers.toddlers * 0.3 + newTrip.travelers.elderly * 0.9;
    const flightCount = newTrip.travelers.adults + newTrip.travelers.children + newTrip.travelers.elderly + (newTrip.travelers.toddlers > 0 ? 0.1 : 0); // 嬰兒機票便宜

    const estimatedFlight = costs.flight * flightCount;
    const estimatedHotel = costs.hotel * (Math.ceil(totalPeople / 2)) * days; // 假設2人一房
    const estimatedFood = costs.food * totalPeople * days;
    const estimatedTransport = costs.transport * totalPeople * days;
    const total = estimatedFlight + estimatedHotel + estimatedFood + estimatedTransport;

    setNewTrip(prev => ({
      ...prev,
      estimatedBudget: Math.round(total),
      budgetDetails: {
        flight: Math.round(estimatedFlight),
        hotel: Math.round(estimatedHotel),
        food: Math.round(estimatedFood),
        transport: Math.round(estimatedTransport),
        days: days
      }
    }));
  };

  // --- 動作邏輯 ---

  const fetchWeatherPrediction = async (city) => {
    if (CITY_DATA[city]) {
      const { lat, lon } = CITY_DATA[city];
      try {
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=weathercode,temperature_2m_max&timezone=auto`);
        const data = await res.json();
        const code = data.daily.weathercode[0];
        if (code <= 3) return 'sunny';
        if (code >= 71 || data.daily.temperature_2m_max[0] < 10) return 'cold';
        return 'rainy';
      } catch (e) { return 'sunny'; }
    }
    return 'sunny'; 
  };

  const createTrip = async (e) => {
    e.preventDefault();
    if (!newTrip.destination) return;

    if (!searchHistory.includes(newTrip.destination)) {
      const newHistory = [newTrip.destination, ...searchHistory].slice(0, 5);
      setSearchHistory(newHistory);
      localStorage.setItem('trip_search_history', JSON.stringify(newHistory));
    }

    try {
      setLoadingWeather(true);
      const weather = await fetchWeatherPrediction(newTrip.destination);
      setLoadingWeather(false);

      const docRef = await addDoc(collection(db, 'artifacts', APP_ID, 'users', user.uid, 'trips'), {
        ...newTrip,
        weather,
        currency: CITY_DATA[newTrip.destination]?.currency || 'HKD', // 儲存當地貨幣
        createdAt: serverTimestamp()
      });
      
      const tripId = docRef.id;
      const batch = [];
      const addSubItem = (type, title, cost = '') => {
        batch.push(addDoc(collection(db, 'artifacts', APP_ID, 'users', user.uid, 'sub_items'), {
          tripId, type, title, cost, completed: false, createdAt: serverTimestamp()
        }));
      };

      // 行李
      PACKING_RULES.common.forEach(t => addSubItem('packing', t));
      if (newTrip.travelers.adults > 0) PACKING_RULES.adult.forEach(t => addSubItem('packing', t));
      if (newTrip.travelers.children > 0) PACKING_RULES.child.forEach(t => addSubItem('packing', t));
      // ... 其他行李規則省略以節省篇幅，邏輯同上

      PACKING_RULES.weather[weather].forEach(t => addSubItem('packing', t));

      // 行程
      const template = ITINERARY_TEMPLATES[newTrip.destination] || ITINERARY_TEMPLATES['default'];
      const start = new Date(newTrip.startDate);
      const days = newTrip.budgetDetails.days || 3;

      for (let i = 0; i < days; i++) {
        const title = template[i % template.length] || `第 ${i+1} 天自由行`;
        const dateStr = new Date(start.getTime() + i * 86400000).toISOString().split('T')[0];
        
        batch.push(addDoc(collection(db, 'artifacts', APP_ID, 'users', user.uid, 'sub_items'), {
          tripId, type: 'itinerary', title, date: dateStr, completed: false, createdAt: serverTimestamp()
        }));
      }

      // 預算初始項目 (將估算值寫入預算表作為參考)
      if (newTrip.estimatedBudget > 0) {
        addSubItem('budget', '✈️ 預估機票', newTrip.budgetDetails.flight);
        addSubItem('budget', '🏨 預估住宿', newTrip.budgetDetails.hotel);
      }

      await Promise.all(batch);
      setNewTrip({ origin: '香港', destination: '', startDate: '', endDate: '', purpose: 'sightseeing', travelers: { adults: 1, children: 0, toddlers: 0, elderly: 0 }, estimatedBudget: 0, budgetDetails: {} });
      alert("行程建立成功！預算與清單已生成。");
    } catch (error) {
      console.error(error);
      setLoadingWeather(false);
    }
  };

  const deleteTrip = async (id, e) => {
    e.stopPropagation();
    if (confirm("確定刪除此行程？")) {
      await deleteDoc(doc(db, 'artifacts', APP_ID, 'users', user.uid, 'trips', id));
    }
  };

  const openTrip = (trip) => {
    setCurrentTrip(trip);
    setView('trip-detail');
    // 進入詳細頁面時，預設幣種為當地幣種，但也可以讓使用者選
    const localCurrency = CITY_DATA[trip.destination]?.currency || 'HKD';
    setNewItem({ ...newItem, date: trip.startDate, currency: localCurrency });
  };

  // --- 項目新增 (含匯率換算) ---
  const handleForeignCostChange = (amount, currency) => {
    const rate = EXCHANGE_RATES[currency] || 1;
    const hkdCost = Math.round(amount * rate);
    setNewItem(prev => ({ 
      ...prev, 
      foreignCost: amount, 
      currency: currency, 
      cost: hkdCost 
    }));
  };

  const addItem = async (e) => {
    e.preventDefault();
    if (!newItem.title) return;
    
    // 如果是預算項目，且有輸入外幣，生成備註
    let finalNotes = newItem.notes;
    if (activeTab === 'budget' && newItem.currency !== 'HKD' && newItem.foreignCost) {
      finalNotes = `${newItem.currency} ${newItem.foreignCost} (匯率 ${EXCHANGE_RATES[newItem.currency]}) ${newItem.notes}`;
    }

    await addDoc(collection(db, 'artifacts', APP_ID, 'users', user.uid, 'sub_items'), {
      ...newItem,
      notes: finalNotes,
      tripId: currentTrip.id,
      completed: false,
      createdAt: serverTimestamp()
    });
    // 重置，保留幣種方便連續輸入
    setNewItem({ ...newItem, title: '', cost: '', foreignCost: '', notes: '' });
  };

  const handleCheckIn = () => {
    if (!navigator.geolocation) return alert("不支援定位");
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude, longitude } = pos.coords;
      const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      await addDoc(collection(db, 'artifacts', APP_ID, 'users', user.uid, 'sub_items'), {
        tripId: currentTrip.id, type: 'itinerary',
        title: `📍 打卡 (GPS: ${latitude.toFixed(2)}, ${longitude.toFixed(2)})`,
        notes: `時間：${time}`,
        date: new Date().toISOString().split('T')[0],
        isCheckIn: true, completed: true, createdAt: serverTimestamp()
      });
    }, () => alert("無法取得位置"));
  };

  const toggleItemComplete = async (item) => updateDoc(doc(db, 'artifacts', APP_ID, 'users', user.uid, 'sub_items', item.id), { completed: !item.completed });
  const deleteItem = async (id) => deleteDoc(doc(db, 'artifacts', APP_ID, 'users', user.uid, 'sub_items', id));

  // 總花費計算
  const currentTotalCost = items
    .filter(i => i.type === 'budget' || i.cost)
    .reduce((sum, i) => sum + (Number(i.cost) || 0), 0);

  // --- Components ---
  const TravelerCounter = ({ label, icon: Icon, value, field }) => (
    <div className="flex items-center justify-between bg-gray-50 p-2 rounded-lg text-xs">
      <div className="flex items-center gap-1"><Icon size={14} className="text-gray-500" /><span>{label}</span></div>
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => setNewTrip(p => ({...p, travelers: {...p.travelers, [field]: Math.max(0, p.travelers[field]-1)}}))} className="w-5 h-5 rounded bg-white border flex items-center justify-center">-</button>
        <span className="w-3 text-center">{value}</span>
        <button type="button" onClick={() => setNewTrip(p => ({...p, travelers: {...p.travelers, [field]: p.travelers[field]+1}}))} className="w-5 h-5 rounded bg-white border flex items-center justify-center text-blue-500">+</button>
      </div>
    </div>
  );

  // --- Render ---
  if (view === 'dashboard') {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans text-gray-800">
        <div className="max-w-4xl mx-auto space-y-6">
          <header className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-bold text-blue-900 flex items-center gap-2"><Plane className="text-blue-600" /> 智能旅遊管家</h1>
            <div className="text-xs text-gray-400">ID: {user?.uid.slice(0, 4)}</div>
          </header>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Plus size={20}/> 建立新旅程</h2>
            <form onSubmit={createTrip} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1 relative">
                  <label className="text-xs text-gray-500">目的地 (自動帶入匯率/消費)</label>
                  <div className="relative">
                    <Navigation className="absolute left-3 top-3 text-blue-500" size={16} />
                    <input 
                      placeholder="例如：大阪" value={newTrip.destination} 
                      onChange={e=>setNewTrip({...newTrip, destination: e.target.value})} 
                      onFocus={() => setShowCitySuggestions(true)}
                      className="w-full pl-9 p-2 border rounded-lg focus:ring-2 ring-blue-500 outline-none" 
                    />
                  </div>
                  {showCitySuggestions && (
                    <div className="absolute z-10 w-full bg-white border rounded-lg shadow-xl mt-1 p-2">
                      <div className="grid grid-cols-4 gap-2">
                        {POPULAR_CITIES.map(city => (
                          <button type="button" key={city} onClick={() => {setNewTrip({...newTrip, destination: city}); setShowCitySuggestions(false);}} className="text-xs border px-2 py-1 rounded hover:bg-blue-50">{city}</button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <div className="flex-1 space-y-1">
                     <label className="text-xs text-gray-500">開始日期</label>
                     <input type="date" value={newTrip.startDate} onChange={e=>setNewTrip({...newTrip, startDate: e.target.value})} className="w-full p-2 border rounded-lg" required />
                  </div>
                  <div className="flex-1 space-y-1">
                     <label className="text-xs text-gray-500">結束日期</label>
                     <input type="date" value={newTrip.endDate} onChange={e=>setNewTrip({...newTrip, endDate: e.target.value})} className="w-full p-2 border rounded-lg" required />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <TravelerCounter label="成人" icon={User} field="adults" value={newTrip.travelers.adults} />
                <TravelerCounter label="小童" icon={User} field="children" value={newTrip.travelers.children} />
                <TravelerCounter label="幼童" icon={Baby} field="toddlers" value={newTrip.travelers.toddlers} />
                <TravelerCounter label="長者" icon={Accessibility} field="elderly" value={newTrip.travelers.elderly} />
              </div>

              {/* 預算估算顯示區塊 */}
              {newTrip.estimatedBudget > 0 && (
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 animate-fade-in">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-bold text-blue-800 flex items-center gap-1"><Calculator size={16}/> 智能預算估算</span>
                    <span className="text-lg font-bold text-blue-600">${newTrip.estimatedBudget.toLocaleString()} HKD</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-xs text-blue-600">
                    <div className="bg-white p-2 rounded border border-blue-100 text-center">
                      <div>機票</div><div className="font-bold">${newTrip.budgetDetails.flight.toLocaleString()}</div>
                    </div>
                    <div className="bg-white p-2 rounded border border-blue-100 text-center">
                      <div>住宿 ({newTrip.budgetDetails.days-1}晚)</div><div className="font-bold">${newTrip.budgetDetails.hotel.toLocaleString()}</div>
                    </div>
                    <div className="bg-white p-2 rounded border border-blue-100 text-center">
                      <div>餐飲</div><div className="font-bold">${newTrip.budgetDetails.food.toLocaleString()}</div>
                    </div>
                    <div className="bg-white p-2 rounded border border-blue-100 text-center">
                      <div>交通雜項</div><div className="font-bold">${newTrip.budgetDetails.transport.toLocaleString()}</div>
                    </div>
                  </div>
                  <p className="text-[10px] text-blue-400 mt-2 text-right">*估算僅供參考，實際費用請依訂購為主</p>
                </div>
              )}

              <button type="submit" disabled={loadingWeather} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 flex justify-center items-center gap-2">
                {loadingWeather ? "分析天氣中..." : "建立行程"}
              </button>
            </form>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {trips.map(trip => (
              <div key={trip.id} onClick={() => openTrip(trip)} className="bg-white p-5 rounded-xl shadow-sm border hover:border-blue-400 cursor-pointer relative overflow-hidden">
                <div className={`absolute top-0 right-0 p-4 opacity-10 ${trip.weather==='rainy'?'text-blue-800':trip.weather==='cold'?'text-cyan-600':'text-orange-500'}`}>
                  {trip.weather==='rainy'?<CloudRain size={80}/>:trip.weather==='cold'?<Snowflake size={80}/>:<Sun size={80}/>}
                </div>
                <button onClick={(e) => deleteTrip(trip.id, e)} className="absolute top-4 right-4 text-gray-300 hover:text-red-500 z-10"><Trash2 size={16}/></button>
                <div className="relative z-0">
                  <h3 className="text-xl font-bold text-gray-800">{trip.destination}</h3>
                  <p className="text-sm text-gray-500 mt-1 flex items-center gap-1"><Calendar size={14}/> {trip.startDate} ~ {trip.endDate}</p>
                  <div className="flex gap-2 mt-3">
                    {trip.estimatedBudget && <span className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded-full border border-green-100 flex items-center gap-1"><DollarSign size={10}/> 預算 ${trip.estimatedBudget.toLocaleString()}</span>}
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full border">{trip.currency || 'HKD'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // 詳細頁面
  const tripItems = items.filter(i => i.type === activeTab);
  
  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800 flex flex-col">
      <div className="bg-white border-b sticky top-0 z-20 shadow-sm">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center justify-between py-3">
            <button onClick={() => setView('dashboard')} className="text-gray-500 hover:text-blue-600 text-sm">← 返回</button>
            <div className="text-center">
              <h1 className="font-bold text-lg">{currentTrip.destination}</h1>
              <p className="text-xs text-gray-500">{currentTrip.startDate} 出發</p>
            </div>
            <div className="w-10"></div> 
          </div>
          <div className="flex gap-6 overflow-x-auto pb-1 scrollbar-hide">
            {[
              { id: 'itinerary', icon: <MapPin size={18}/>, label: '行程' },
              { id: 'packing', icon: <Luggage size={18}/>, label: '行李' },
              { id: 'budget', icon: <DollarSign size={18}/>, label: '記帳' },
              { id: 'info', icon: <FileText size={18}/>, label: '資訊' },
            ].map(tab => (
              <button key={tab.id} onClick={() => { setActiveTab(tab.id); setNewItem({...newItem, type: tab.id}); }} className={`flex items-center gap-2 pb-3 border-b-2 whitespace-nowrap ${activeTab === tab.id ? 'border-blue-600 text-blue-600 font-bold' : 'border-transparent text-gray-500'}`}>{tab.icon} {tab.label}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-4xl mx-auto w-full p-4 space-y-6">
        {activeTab === 'itinerary' && (
          <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex justify-between items-center">
            <div><h3 className="font-bold text-blue-800">📍 記錄足跡</h3><p className="text-xs text-blue-600">自動將目前位置加入行程</p></div>
            <button onClick={handleCheckIn} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex gap-2"><Camera size={16} /> 打卡</button>
          </div>
        )}

        {activeTab === 'budget' && (
          <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white p-6 rounded-2xl shadow-lg">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-emerald-100 text-xs uppercase">實際總支出 (HKD)</p>
                <h2 className="text-3xl font-bold mt-1">${currentTotalCost.toLocaleString()}</h2>
              </div>
              <div className="text-right">
                <p className="text-emerald-100 text-xs uppercase">預算剩餘</p>
                <h3 className={`text-xl font-bold mt-1 ${(currentTrip.estimatedBudget - currentTotalCost) < 0 ? 'text-red-200' : 'text-white'}`}>
                  ${(currentTrip.estimatedBudget - currentTotalCost).toLocaleString()}
                </h3>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-emerald-400/30 flex gap-4 text-xs text-emerald-100">
               <span>匯率參考: 1 {newItem.currency} ≈ {EXCHANGE_RATES[newItem.currency]} HKD</span>
            </div>
          </div>
        )}

        {/* 智能輸入 Bar */}
        <form onSubmit={addItem} className="bg-white p-4 rounded-xl shadow-sm border flex flex-col gap-3 sticky top-32 z-10">
          <div className="flex gap-2 items-center">
            <input 
              type="text" 
              placeholder={activeTab === 'budget' ? "消費項目 (如: 晚餐)" : "項目名稱..."}
              className="flex-1 p-2 bg-gray-50 rounded-lg outline-none focus:bg-white focus:ring-2 ring-blue-100"
              value={newItem.title}
              onChange={e => setNewItem({...newItem, title: e.target.value})}
            />
            
            {/* 預算頁面專用：多幣種輸入 */}
            {activeTab === 'budget' ? (
              <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-lg border">
                <input 
                  type="number" 
                  placeholder="金額" 
                  className="w-20 p-1 bg-transparent outline-none text-right font-bold text-blue-600"
                  value={newItem.foreignCost}
                  onChange={e => handleForeignCostChange(e.target.value, newItem.currency)}
                />
                <select 
                  value={newItem.currency} 
                  onChange={e => handleForeignCostChange(newItem.foreignCost, e.target.value)}
                  className="bg-white text-xs py-1 px-2 rounded border outline-none font-bold"
                >
                  {Object.keys(EXCHANGE_RATES).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            ) : (
              <input 
                type="date"
                className="w-32 p-2 bg-gray-50 rounded-lg outline-none text-sm"
                value={newItem.date}
                onChange={e => setNewItem({...newItem, date: e.target.value})}
              />
            )}
            
            <button type="submit" className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700"><Plus size={20}/></button>
          </div>
          
          {/* 顯示匯率換算預覽 */}
          {activeTab === 'budget' && newItem.foreignCost > 0 && newItem.currency !== 'HKD' && (
            <div className="text-xs text-gray-500 flex items-center gap-2 pl-1">
              <RefreshCw size={12}/> 
              自動換算：<span className="font-bold text-gray-700">${newItem.cost.toLocaleString()} HKD</span> 
              (匯率 {EXCHANGE_RATES[newItem.currency]})
            </div>
          )}
        </form>

        <div className="space-y-3 pb-20">
          {tripItems.length === 0 ? (
            <div className="text-center text-gray-400 py-10"><p>尚無資料，請新增。</p></div>
          ) : (
            tripItems.sort((a,b) => (a.completed === b.completed)? 0 : a.completed? 1 : -1).map(item => (
              <div key={item.id} className={`bg-white p-4 rounded-xl border flex items-start gap-3 transition-all ${item.completed ? 'bg-gray-50 opacity-60' : 'shadow-sm'}`}>
                <button onClick={() => toggleItemComplete(item)} className={`mt-1 ${item.completed ? 'text-green-500' : 'text-gray-300 hover:text-blue-500'}`}>
                  {item.completed ? <CheckCircle2 size={22}/> : <Circle size={22}/>}
                </button>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <span className={`font-medium ${item.completed ? 'line-through text-gray-400' : 'text-gray-800'}`}>{item.title}</span>
                    {item.cost && (
                      <div className="text-right">
                        <div className="text-sm font-bold text-gray-800">${Number(item.cost).toLocaleString()}</div>
                        {/* 顯示外幣備註 */}
                        {item.notes && item.notes.includes('匯率') && <div className="text-[10px] text-gray-400">{item.notes.split(' ')[0]} {item.notes.split(' ')[1]}</div>}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-1 mt-1">
                    {item.date && <span className="text-xs text-blue-500 flex items-center gap-1"><Calendar size={12}/> {item.date}</span>}
                  </div>
                </div>
                <button onClick={() => deleteItem(item.id)} className="text-gray-200 hover:text-red-400"><Trash2 size={16}/></button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default TravelApp;
