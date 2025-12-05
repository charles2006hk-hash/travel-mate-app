import { useState, useEffect, useMemo } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, deleteDoc, doc, updateDoc, where, getDocs } from "firebase/firestore";
import { 
  Trash2, Plus, MapPin, Calendar, CheckCircle2, Circle, 
  DollarSign, FileText, Sun, CloudRain, Snowflake, 
  Luggage, Plane, Baby, Accessibility, User, Navigation,
  History, MapPin as MapPinIcon, Camera, ShoppingBag,
  Calculator, RefreshCw, Edit2, Map, Briefcase, Coffee, Home, Bus, Shirt
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

// --- 3. 資料庫與常數 ---

// 城市資料
const CITY_DATA = {
  "東京": { lat: 35.6762, lon: 139.6503, currency: "JPY", region: "JP", intro: "傳統與未來交織的城市，必去淺草寺、澀谷十字路口。" },
  "大阪": { lat: 34.6937, lon: 135.5023, currency: "JPY", region: "JP", intro: "美食之都，道頓堀固力果跑跑人是必打卡點。" },
  "京都": { lat: 35.0116, lon: 135.7681, currency: "JPY", region: "JP", intro: "千年古都，擁有無數神社與寺廟，清水寺最為著名。" },
  "首爾": { lat: 37.5665, lon: 126.9780, currency: "KRW", region: "KR", intro: "韓流中心，弘大購物與景福宮穿韓服體驗。" },
  "台北": { lat: 25.0330, lon: 121.5654, currency: "TWD", region: "TW", intro: "美食與夜市的天堂，必登台北101觀景台。" },
  "曼谷": { lat: 13.7563, lon: 100.5018, currency: "THB", region: "TH", intro: "充滿活力的不夜城，大皇宮與水上市場不可錯過。" },
  "新加坡": { lat: 1.3521, lon: 103.8198, currency: "SGD", region: "SG", intro: "花園城市，濱海灣金沙與魚尾獅公園是地標。" },
  "倫敦": { lat: 51.5074, lon: -0.1278, currency: "GBP", region: "UK", intro: "歷史與現代的融合，大笨鐘與倫敦眼是必訪之地。" },
  "巴黎": { lat: 48.8566, lon: 2.3522, currency: "EUR", region: "EU", intro: "浪漫之都，艾菲爾鐵塔下野餐是最佳體驗。" },
  "香港": { lat: 22.3193, lon: 114.1694, currency: "HKD", region: "HK", intro: "東方之珠，維多利亞港夜景世界三大夜景之一。" },
};
const POPULAR_CITIES = Object.keys(CITY_DATA);
const POPULAR_ORIGINS = ["香港", "台北", "高雄", "澳門", "東京", "倫敦", "紐約"];

// 匯率
const EXCHANGE_RATES = {
  "HKD": 1, "JPY": 0.052, "KRW": 0.0058, "TWD": 0.25, "THB": 0.22, 
  "SGD": 5.8, "GBP": 9.9, "EUR": 8.5, "USD": 7.8
};

// 預估消費水準
const ESTIMATED_COSTS = {
  "JP": { flight: 4000, hotel: 1000, food: 400, transport: 150 },
  "KR": { flight: 2500, hotel: 800, food: 300, transport: 100 },
  "HK": { flight: 0,    hotel: 0,    food: 400, transport: 100 }, 
  "default": { flight: 5000, hotel: 1000, food: 400, transport: 150 }
};

// 行李物品定義 (含預設重量kg與體積單位)
// 類別: clothes(衣), daily(住/生活), food(食), move(行/裝備), doc(文件)
const ITEM_DEFINITIONS = {
  "護照/簽證": { weight: 0.1, volume: 1, category: "doc" },
  "現金/信用卡": { weight: 0.1, volume: 1, category: "doc" },
  "手機充電器": { weight: 0.2, volume: 2, category: "move" },
  "萬用轉接頭": { weight: 0.2, volume: 2, category: "move" },
  "換洗衣物": { weight: 0.5, volume: 10, category: "clothes" }, // 每套
  "外套": { weight: 0.8, volume: 15, category: "clothes" },
  "盥洗包": { weight: 0.5, volume: 5, category: "daily" },
  "藥品": { weight: 0.2, volume: 2, category: "daily" },
  "尿布": { weight: 0.05, volume: 2, category: "daily" }, // 每片
  "奶粉": { weight: 0.8, volume: 10, category: "food" },
  "推車": { weight: 5.0, volume: 50, category: "move" },
  "雨傘": { weight: 0.3, volume: 3, category: "daily" },
  "水壺": { weight: 0.2, volume: 5, category: "food" },
};

// 預算/記帳類別
const BUDGET_CATEGORIES = {
  shopping: { label: "衣/購", icon: ShoppingBag, color: "text-pink-500" },
  food: { label: "食", icon: Coffee, color: "text-orange-500" },
  stay: { label: "住", icon: Home, color: "text-indigo-500" },
  transport: { label: "行", icon: Bus, color: "text-blue-500" },
  other: { label: "其他", icon: FileText, color: "text-gray-500" }
};

function TravelApp() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('dashboard'); 
  const [currentTrip, setCurrentTrip] = useState(null);
  
  const [trips, setTrips] = useState([]);
  const [items, setItems] = useState([]);
  const [searchHistory, setSearchHistory] = useState([]);

  // 新增行程表單
  const [newTrip, setNewTrip] = useState({
    origin: '香港',
    destination: '',
    startDate: '',
    endDate: '',
    purpose: 'sightseeing', 
    travelers: { adults: 1, children: 0, toddlers: 0, elderly: 0 },
    estimatedBudget: 0,
    budgetDetails: {}
  });

  // 新增/編輯項目表單
  const [newItem, setNewItem] = useState({ 
    type: 'itinerary', 
    category: 'other', // food, transport, shopping, stay, other
    title: '', 
    cost: '',          
    foreignCost: '',   
    currency: 'HKD',   
    date: '', 
    notes: '',
    itemOwner: '成人', // 用於行李分配
    quantity: 1,      // 行李數量
    weight: 0,        // 單個重量
  });

  const [editingItem, setEditingItem] = useState(null); // 正在編輯的項目 ID

  const [activeTab, setActiveTab] = useState('itinerary');
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  const [showOriginSuggestions, setShowOriginSuggestions] = useState(false);
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

  // 監聽行程列表
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'artifacts', APP_ID, 'users', user.uid, 'trips'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      setTrips(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
  }, [user]);

  // 監聽細項
  useEffect(() => {
    if (!user || !currentTrip) return;
    const q = query(collection(db, 'artifacts', APP_ID, 'users', user.uid, 'sub_items'), where('tripId', '==', currentTrip.id));
    return onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setItems(data);
    });
  }, [user, currentTrip]);

  // --- 計算實際費用並更新到 Trip Doc (用於首頁顯示) ---
  const updateTripActualCost = async (tripId) => {
    if (!user || !tripId) return;
    try {
      // 讀取該 Trip 所有 Budget 項目
      const q = query(
        collection(db, 'artifacts', APP_ID, 'users', user.uid, 'sub_items'), 
        where('tripId', '==', tripId),
        where('type', '==', 'budget')
      );
      const snapshot = await getDocs(q);
      const total = snapshot.docs.reduce((sum, doc) => sum + (Number(doc.data().cost) || 0), 0);
      
      // 更新 Trip Doc
      await updateDoc(doc(db, 'artifacts', APP_ID, 'users', user.uid, 'trips', tripId), {
        actualCost: total
      });
    } catch (e) {
      console.error("更新總花費失敗", e);
    }
  };

  // --- 估算預算邏輯 ---
  useEffect(() => {
    if (newTrip.destination && newTrip.startDate && newTrip.endDate) {
      calculateEstimatedBudget();
    }
  }, [newTrip.destination, newTrip.startDate, newTrip.endDate, newTrip.travelers]);

  const calculateEstimatedBudget = () => {
    if (newTrip.endDate < newTrip.startDate) return; // 日期無效不計算

    const cityInfo = CITY_DATA[newTrip.destination];
    const region = cityInfo ? cityInfo.region : 'default';
    const costs = ESTIMATED_COSTS[region] || ESTIMATED_COSTS['default'];

    const start = new Date(newTrip.startDate);
    const end = new Date(newTrip.endDate);
    const days = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1);
    
    const totalPeople = newTrip.travelers.adults + newTrip.travelers.children * 0.8 + newTrip.travelers.toddlers * 0.3 + newTrip.travelers.elderly * 0.9;
    const flightCount = newTrip.travelers.adults + newTrip.travelers.children + newTrip.travelers.elderly + (newTrip.travelers.toddlers > 0 ? 0.1 : 0);

    const estimatedFlight = costs.flight * flightCount;
    const estimatedHotel = costs.hotel * (Math.ceil(totalPeople / 2)) * days; 
    const estimatedFood = costs.food * totalPeople * days;
    const estimatedTransport = costs.transport * totalPeople * days;
    const total = estimatedFlight + estimatedHotel + estimatedFood + estimatedTransport;

    setNewTrip(prev => ({
      ...prev,
      estimatedBudget: Math.round(total),
      budgetDetails: { flight: Math.round(estimatedFlight), hotel: Math.round(estimatedHotel), food: Math.round(estimatedFood), transport: Math.round(estimatedTransport), days }
    }));
  };

  // --- CRUD 邏輯 ---

  const createTrip = async (e) => {
    e.preventDefault();
    // 1. 日期驗證
    if (newTrip.endDate < newTrip.startDate) {
      alert("結束日期不能早於出發日期！");
      return;
    }
    if (!newTrip.destination) return;

    if (!searchHistory.includes(newTrip.destination)) {
      localStorage.setItem('trip_search_history', JSON.stringify([newTrip.destination, ...searchHistory].slice(0, 5)));
    }

    try {
      setLoadingWeather(true);
      // 取得天氣 (這裡簡化，同前版)
      const weather = 'sunny'; 
      setLoadingWeather(false);

      const docRef = await addDoc(collection(db, 'artifacts', APP_ID, 'users', user.uid, 'trips'), {
        ...newTrip,
        weather,
        currency: CITY_DATA[newTrip.destination]?.currency || 'HKD',
        actualCost: 0, // 初始實際花費
        createdAt: serverTimestamp()
      });
      
      const tripId = docRef.id;
      const batch = [];
      const addSubItem = (type, title, category, owner, qty = 1, defCost = '') => {
        const defs = ITEM_DEFINITIONS[title] || { weight: 0.5, volume: 5 };
        batch.push(addDoc(collection(db, 'artifacts', APP_ID, 'users', user.uid, 'sub_items'), {
          tripId, type, title, cost: defCost, 
          category, // budget: food/stay..., packing: clothes/doc...
          itemOwner: owner,
          quantity: qty,
          weight: defs.weight,
          volume: defs.volume,
          completed: false, 
          createdAt: serverTimestamp()
        }));
      };

      // 5. 智能行李生成 (分類與人員)
      // 通用文件
      ["護照/簽證", "現金/信用卡"].forEach(t => addSubItem('packing', t, 'doc', '全體'));
      // 電子
      ["手機充電器", "萬用轉接頭"].forEach(t => addSubItem('packing', t, 'move', '全體', 1));
      
      // 按人頭
      const days = newTrip.budgetDetails.days || 3;
      if (newTrip.travelers.adults > 0) {
        addSubItem('packing', '換洗衣物', 'clothes', '成人', newTrip.travelers.adults * days);
        addSubItem('packing', '外套', 'clothes', '成人', newTrip.travelers.adults);
      }
      if (newTrip.travelers.toddlers > 0) {
        addSubItem('packing', '尿布', 'daily', '幼童', newTrip.travelers.toddlers * days * 6); // 一天6片
        addSubItem('packing', '奶粉', 'food', '幼童', 1);
        addSubItem('packing', '推車', 'move', '幼童', 1);
      }

      // 7. 預設行程與介紹
      const cityIntro = CITY_DATA[newTrip.destination]?.intro || "探索未知的旅程！";
      // 插入第一筆介紹
      batch.push(addDoc(collection(db, 'artifacts', APP_ID, 'users', user.uid, 'sub_items'), {
        tripId, type: 'info', title: `🌟 ${newTrip.destination} 旅遊簡介`, notes: cityIntro, createdAt: serverTimestamp()
      }));

      // 每日行程 (簡化)
      for (let i = 0; i < days; i++) {
        const dateStr = new Date(new Date(newTrip.startDate).getTime() + i * 86400000).toISOString().split('T')[0];
        batch.push(addDoc(collection(db, 'artifacts', APP_ID, 'users', user.uid, 'sub_items'), {
          tripId, type: 'itinerary', title: `第 ${i+1} 天行程`, date: dateStr, completed: false, createdAt: serverTimestamp()
        }));
      }

      await Promise.all(batch);
      setNewTrip({ origin: '香港', destination: '', startDate: '', endDate: '', purpose: 'sightseeing', travelers: { adults: 1, children: 0, toddlers: 0, elderly: 0 }, estimatedBudget: 0, budgetDetails: {} });
      alert("行程建立成功！");
    } catch (error) {
      console.error(error);
      setLoadingWeather(false);
    }
  };

  const deleteTrip = async (id, e) => {
    e.stopPropagation();
    if (confirm("確定刪除此行程？")) await deleteDoc(doc(db, 'artifacts', APP_ID, 'users', user.uid, 'trips', id));
  };

  const openTrip = (trip) => {
    setCurrentTrip(trip);
    setView('trip-detail');
    const localCurrency = CITY_DATA[trip.destination]?.currency || 'HKD';
    setNewItem({ ...newItem, date: trip.startDate, currency: localCurrency });
  };

  // --- 細項操作 (新增/編輯/刪除) ---

  const handleForeignCostChange = (amount, currency) => {
    const rate = EXCHANGE_RATES[currency] || 1;
    const hkdCost = Math.round(amount * rate);
    setNewItem(prev => ({ ...prev, foreignCost: amount, currency: currency, cost: hkdCost }));
  };

  const addItem = async (e) => {
    e.preventDefault();
    if (!newItem.title) return;

    let finalNotes = newItem.notes;
    // 記帳：加上匯率備註
    if (newItem.type === 'budget' && newItem.currency !== 'HKD' && newItem.foreignCost) {
      finalNotes = `${newItem.currency} ${newItem.foreignCost} (匯率 ${EXCHANGE_RATES[newItem.currency]}) ${newItem.notes}`;
    }

    // 行李：自動填入重量
    let finalWeight = newItem.weight;
    let finalVolume = 0;
    if (newItem.type === 'packing') {
       const defs = ITEM_DEFINITIONS[newItem.title];
       if (defs && finalWeight === 0) {
         finalWeight = defs.weight;
         finalVolume = defs.volume;
       }
    }

    const payload = {
      ...newItem,
      notes: finalNotes,
      weight: finalWeight,
      volume: finalVolume,
      tripId: currentTrip.id,
      completed: false,
      createdAt: serverTimestamp()
    };

    if (editingItem) {
      // 編輯模式
      await updateDoc(doc(db, 'artifacts', APP_ID, 'users', user.uid, 'sub_items', editingItem), payload);
      setEditingItem(null);
    } else {
      // 新增模式
      await addDoc(collection(db, 'artifacts', APP_ID, 'users', user.uid, 'sub_items'), payload);
    }

    // 如果是記帳，更新 Trip 總金額
    if (newItem.type === 'budget') {
      setTimeout(() => updateTripActualCost(currentTrip.id), 500); // 稍等寫入完成
    }

    setNewItem({ ...newItem, title: '', cost: '', foreignCost: '', notes: '', quantity: 1, weight: 0 });
  };

  const editItem = (item) => {
    setNewItem({
      ...item,
      // 恢復一些可能沒有的欄位
      foreignCost: item.foreignCost || '',
      currency: item.currency || 'HKD'
    });
    setEditingItem(item.id);
  };

  const deleteItem = async (id, type) => {
    if(!confirm("確定刪除？")) return;
    await deleteDoc(doc(db, 'artifacts', APP_ID, 'users', user.uid, 'sub_items', id));
    if (type === 'budget') setTimeout(() => updateTripActualCost(currentTrip.id), 500);
  };

  const toggleItemComplete = async (item) => updateDoc(doc(db, 'artifacts', APP_ID, 'users', user.uid, 'sub_items', item.id), { completed: !item.completed });

  // 4. 地圖足跡：開啟 Google Maps 路線
  const openGoogleMapsRoute = () => {
    // 找出所有有日期的行程點 (或打卡點)
    const points = items
      .filter(i => i.type === 'itinerary' && (i.title.includes('打卡') || i.notes)) // 簡單過濾
      .sort((a,b) => (a.date > b.date ? 1 : -1));
    
    // 這裡用簡單的搜尋連結，如果有經緯度會更準
    // 如果是打卡點，通常 title 會有 GPS
    const destination = currentTrip.destination;
    const url = `https://www.google.com/maps/search/${destination}+attractions`;
    window.open(url, '_blank');
  };

  // 5. 行李估算邏輯
  const luggageStats = useMemo(() => {
    const packingItems = items.filter(i => i.type === 'packing');
    const totalWeight = packingItems.reduce((sum, i) => sum + (Number(i.weight || 0) * Number(i.quantity || 1)), 0);
    const totalVolume = packingItems.reduce((sum, i) => sum + ((ITEM_DEFINITIONS[i.title]?.volume || 5) * Number(i.quantity || 1)), 0);
    
    // 估算箱子
    let suggestion = "背包/手提";
    if (totalVolume > 30) suggestion = "20吋登機箱";
    if (totalVolume > 60) suggestion = "24吋行李箱";
    if (totalVolume > 100) suggestion = "28吋大行李箱";
    if (totalVolume > 150) suggestion = "28吋 x 2";

    return { totalWeight: totalWeight.toFixed(1), totalVolume, suggestion };
  }, [items]);

  // 6. 記帳分類統計
  const budgetStats = useMemo(() => {
    const budgetItems = items.filter(i => i.type === 'budget');
    const stats = { shopping: 0, food: 0, stay: 0, transport: 0, other: 0, total: 0 };
    budgetItems.forEach(i => {
      const cost = Number(i.cost) || 0;
      const cat = i.category || 'other';
      if (stats[cat] !== undefined) stats[cat] += cost;
      else stats.other += cost;
      stats.total += cost;
    });
    return stats;
  }, [items]);


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
                {/* 2. 出發地選擇 */}
                <div className="space-y-1 relative">
                  <label className="text-xs text-gray-500">出發地</label>
                  <div className="relative">
                    <MapPinIcon className="absolute left-3 top-3 text-gray-400" size={16} />
                    <input 
                      value={newTrip.origin} 
                      onChange={e=>setNewTrip({...newTrip, origin: e.target.value})} 
                      onFocus={() => setShowOriginSuggestions(true)}
                      className="w-full pl-9 p-2 border rounded-lg bg-gray-50"
                    />
                  </div>
                  {showOriginSuggestions && (
                    <div className="absolute z-10 w-full bg-white border rounded-lg shadow-xl mt-1 p-2">
                      <div className="flex flex-wrap gap-2">
                        {POPULAR_ORIGINS.map(city => (
                          <button type="button" key={city} onClick={() => {setNewTrip({...newTrip, origin: city}); setShowOriginSuggestions(false);}} className="text-xs bg-gray-100 px-2 py-1 rounded hover:bg-gray-200">{city}</button>
                        ))}
                      </div>
                      <button type="button" onClick={()=>setShowOriginSuggestions(false)} className="w-full text-center text-xs text-blue-500 mt-1 pt-1 border-t">關閉</button>
                    </div>
                  )}
                </div>

                <div className="space-y-1 relative">
                  <label className="text-xs text-gray-500">目的地</label>
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
                      <button type="button" onClick={()=>setShowCitySuggestions(false)} className="w-full text-center text-xs text-blue-500 mt-1 pt-1 border-t">關閉</button>
                    </div>
                  )}
                </div>
              </div>

              {/* 1. 日期驗證在 Submit 處理 */}
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

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <TravelerCounter label="成人" icon={User} field="adults" value={newTrip.travelers.adults} />
                <TravelerCounter label="小童" icon={User} field="children" value={newTrip.travelers.children} />
                <TravelerCounter label="幼童" icon={Baby} field="toddlers" value={newTrip.travelers.toddlers} />
                <TravelerCounter label="長者" icon={Accessibility} field="elderly" value={newTrip.travelers.elderly} />
              </div>

              {newTrip.estimatedBudget > 0 && (
                <div className="bg-blue-50 p-3 rounded-xl border border-blue-100">
                  <div className="flex justify-between items-center text-sm font-bold text-blue-800">
                     <span>預估: ${newTrip.estimatedBudget.toLocaleString()}</span>
                     <span className="text-xs font-normal">({newTrip.budgetDetails.days}天)</span>
                  </div>
                </div>
              )}

              <button type="submit" disabled={loadingWeather} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 flex justify-center items-center gap-2">
                建立行程
              </button>
            </form>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {trips.map(trip => (
              <div key={trip.id} onClick={() => openTrip(trip)} className="bg-white p-5 rounded-xl shadow-sm border hover:border-blue-400 cursor-pointer relative overflow-hidden group">
                <button onClick={(e) => deleteTrip(trip.id, e)} className="absolute top-4 right-4 text-gray-300 hover:text-red-500 z-10 p-2"><Trash2 size={16}/></button>
                <h3 className="text-xl font-bold text-gray-800">{trip.destination}</h3>
                <p className="text-sm text-gray-500 mt-1 flex items-center gap-1"><MapPinIcon size={12}/> {trip.origin} 出發</p>
                <p className="text-sm text-gray-500 flex items-center gap-1"><Calendar size={12}/> {trip.startDate} ~ {trip.endDate}</p>
                
                {/* 3. 首頁加入實際費用 */}
                <div className="mt-4 flex gap-3 text-xs">
                  <div className="bg-green-50 text-green-700 px-3 py-1 rounded-lg border border-green-100">
                    <div className="text-[10px] text-green-400 uppercase">預算</div>
                    <div className="font-bold">${trip.estimatedBudget?.toLocaleString()}</div>
                  </div>
                  <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-lg border border-blue-100">
                    <div className="text-[10px] text-blue-400 uppercase">實際支出</div>
                    <div className="font-bold">${trip.actualCost?.toLocaleString() || 0}</div>
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
              <p className="text-xs text-gray-500">{currentTrip.startDate} ~ {currentTrip.endDate}</p>
            </div>
            <div className="w-10"></div> 
          </div>
          <div className="flex gap-6 overflow-x-auto pb-1 scrollbar-hide">
            {[
              { id: 'itinerary', icon: <MapPin size={18}/>, label: '行程' },
              { id: 'packing', icon: <Briefcase size={18}/>, label: '行李' }, // 5. 行李 Icon 改為公事包
              { id: 'budget', icon: <DollarSign size={18}/>, label: '記帳' },
              { id: 'info', icon: <FileText size={18}/>, label: '資訊' },
            ].map(tab => (
              <button key={tab.id} onClick={() => { setActiveTab(tab.id); setNewItem({...newItem, type: tab.id}); setEditingItem(null); }} className={`flex items-center gap-2 pb-3 border-b-2 whitespace-nowrap ${activeTab === tab.id ? 'border-blue-600 text-blue-600 font-bold' : 'border-transparent text-gray-500'}`}>{tab.icon} {tab.label}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-4xl mx-auto w-full p-4 space-y-6">
        
        {/* 4. 行程 - Google 地圖足跡 */}
        {activeTab === 'itinerary' && (
          <div className="flex gap-2">
             <div className="flex-1 bg-blue-50 border border-blue-100 p-3 rounded-xl flex justify-between items-center">
                <div><h3 className="font-bold text-blue-800 text-sm">📍 足跡打卡</h3></div>
                <button onClick={() => {
                   if (!navigator.geolocation) return alert("不支援");
                   navigator.geolocation.getCurrentPosition(async (pos) => {
                     const t = new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
                     await addDoc(collection(db, 'artifacts', APP_ID, 'users', user.uid, 'sub_items'), {
                       tripId: currentTrip.id, type: 'itinerary', title: `📍 打卡 (${pos.coords.latitude.toFixed(2)}, ${pos.coords.longitude.toFixed(2)})`, notes: t, date: new Date().toISOString().split('T')[0], completed: true, createdAt: serverTimestamp()
                     });
                   });
                }} className="bg-blue-600 text-white px-3 py-1 rounded-lg text-xs font-bold flex gap-1 items-center"><Camera size={14} /> 打卡</button>
             </div>
             <button onClick={openGoogleMapsRoute} className="bg-white border p-3 rounded-xl shadow-sm text-blue-600 flex flex-col items-center justify-center w-20">
                <Map size={20} />
                <span className="text-[10px] font-bold mt-1">地圖預覽</span>
             </button>
          </div>
        )}

        {/* 5. 行李 - 專業估算 */}
        {activeTab === 'packing' && (
          <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl">
             <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-indigo-800 flex items-center gap-2"><Briefcase size={16}/> 行李估算</h3>
                <span className="text-xs bg-indigo-200 text-indigo-800 px-2 py-1 rounded-full">{luggageStats.suggestion}</span>
             </div>
             <div className="flex gap-4 text-xs text-indigo-600">
                <div>總重: <span className="font-bold">{luggageStats.totalWeight} kg</span></div>
                <div>體積指數: <span className="font-bold">{luggageStats.totalVolume}</span></div>
             </div>
          </div>
        )}

        {/* 6. 記帳 - 分類統計 */}
        {activeTab === 'budget' && (
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white p-6 rounded-2xl shadow-lg">
              <div className="flex justify-between items-start">
                <div><p className="text-emerald-100 text-xs uppercase">總支出 (HKD)</p><h2 className="text-3xl font-bold mt-1">${budgetStats.total.toLocaleString()}</h2></div>
                <div className="text-right"><p className="text-emerald-100 text-xs uppercase">預算剩餘</p><h3 className={`text-xl font-bold mt-1 ${(currentTrip.estimatedBudget - budgetStats.total) < 0 ? 'text-red-200' : 'text-white'}`}>${(currentTrip.estimatedBudget - budgetStats.total).toLocaleString()}</h3></div>
              </div>
            </div>
            {/* 文字條狀統計 */}
            <div className="flex gap-2 text-xs overflow-x-auto pb-2">
               {Object.entries(BUDGET_CATEGORIES).map(([key, cfg]) => (
                 <div key={key} className={`bg-white px-3 py-2 rounded-lg border flex items-center gap-2 whitespace-nowrap ${cfg.color}`}>
                    <cfg.icon size={14}/> <span>{cfg.label}: ${budgetStats[key].toLocaleString()}</span>
                 </div>
               ))}
            </div>
          </div>
        )}

        {/* 7. 資訊 - 旅遊介紹 */}
        {activeTab === 'info' && (
           <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100 mb-4">
              <h3 className="font-bold text-yellow-800 flex items-center gap-2 mb-2"><FileText size={16}/> 旅遊簡介</h3>
              <p className="text-sm text-yellow-700 leading-relaxed">{CITY_DATA[currentTrip.destination]?.intro || "暫無介紹"}</p>
           </div>
        )}

        {/* 智能輸入/編輯 Bar */}
        <form onSubmit={addItem} className="bg-white p-4 rounded-xl shadow-sm border flex flex-col gap-3 sticky top-32 z-10">
          <div className="flex justify-between text-xs text-blue-500 font-bold">
            <span>{editingItem ? "✏️ 編輯項目" : "➕ 新增項目"}</span>
            {editingItem && <button type="button" onClick={() => {setEditingItem(null); setNewItem({...newItem, title:''});}} className="text-gray-400">取消</button>}
          </div>
          
          <div className="flex gap-2 items-center">
            {/* 6. 記帳類別選擇 */}
            {activeTab === 'budget' && (
               <select value={newItem.category} onChange={e=>setNewItem({...newItem, category: e.target.value})} className="bg-gray-50 text-xs p-2 rounded-lg outline-none">
                  {Object.entries(BUDGET_CATEGORIES).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
               </select>
            )}
            
            <input 
              type="text" 
              placeholder={activeTab === 'budget' ? "消費項目" : "名稱"}
              className="flex-1 p-2 bg-gray-50 rounded-lg outline-none focus:bg-white focus:ring-2 ring-blue-100"
              value={newItem.title}
              onChange={e => setNewItem({...newItem, title: e.target.value})}
            />
            
            {activeTab === 'budget' ? (
              <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-lg border">
                <input type="number" placeholder="金額" className="w-16 p-1 bg-transparent outline-none text-right font-bold text-blue-600"
                  value={newItem.foreignCost} onChange={e => handleForeignCostChange(e.target.value, newItem.currency)} />
                <select value={newItem.currency} onChange={e => handleForeignCostChange(newItem.foreignCost, e.target.value)} className="bg-white text-xs py-1 px-1 rounded border outline-none font-bold">
                  {Object.keys(EXCHANGE_RATES).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            ) : activeTab === 'packing' ? (
              // 5. 行李：人員與數量
              <div className="flex gap-1">
                 <select value={newItem.itemOwner} onChange={e=>setNewItem({...newItem, itemOwner: e.target.value})} className="bg-gray-50 text-xs p-1 rounded border w-14">
                    <option value="成人">成人</option><option value="小童">小童</option><option value="幼童">幼童</option><option value="長者">長者</option>
                 </select>
                 <input type="number" value={newItem.quantity} onChange={e=>setNewItem({...newItem, quantity: e.target.value})} className="w-10 text-center bg-gray-50 text-xs p-1 rounded border" />
              </div>
            ) : (
              <input type="date" className="w-28 p-2 bg-gray-50 rounded-lg outline-none text-sm" value={newItem.date} onChange={e => setNewItem({...newItem, date: e.target.value})} />
            )}
            
            <button type="submit" className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700">{editingItem ? <Edit2 size={16}/> : <Plus size={20}/>}</button>
          </div>
        </form>

        <div className="space-y-3 pb-20">
          {tripItems.length === 0 ? (
            <div className="text-center text-gray-400 py-10"><p>尚無資料。</p></div>
          ) : (
            // 5. 行李分類顯示：依人員分組
            activeTab === 'packing' ? (
               ['成人', '小童', '幼童', '長者', '全體'].map(owner => {
                 const ownerItems = tripItems.filter(i => i.itemOwner === owner || (!i.itemOwner && owner === '全體'));
                 if (ownerItems.length === 0) return null;
                 return (
                   <div key={owner} className="mb-4">
                     <h4 className="text-sm font-bold text-gray-500 mb-2 px-1">{owner} 行李</h4>
                     {ownerItems.map(item => (
                       <div key={item.id} className={`bg-white p-3 mb-2 rounded-xl border flex items-center gap-3 ${item.completed ? 'opacity-50' : ''}`}>
                          <button onClick={() => toggleItemComplete(item)} className={item.completed ? 'text-green-500' : 'text-gray-300'}>{item.completed ? <CheckCircle2 size={20}/> : <Circle size={20}/>}</button>
                          <div className="flex-1 font-medium text-sm flex justify-between">
                            <span>{item.title}</span>
                            <span className="text-gray-400 text-xs">x{item.quantity}</span>
                          </div>
                          <button onClick={() => deleteItem(item.id, 'packing')} className="text-gray-200 hover:text-red-400"><Trash2 size={14}/></button>
                       </div>
                     ))}
                   </div>
                 )
               })
            ) : (
              tripItems.sort((a,b) => (a.completed === b.completed)? 0 : a.completed? 1 : -1).map(item => (
                <div key={item.id} className={`bg-white p-4 rounded-xl border flex items-start gap-3 ${item.completed ? 'bg-gray-50 opacity-60' : 'shadow-sm'}`}>
                  <button onClick={() => toggleItemComplete(item)} className={`mt-1 ${item.completed ? 'text-green-500' : 'text-gray-300 hover:text-blue-500'}`}>
                    {item.completed ? <CheckCircle2 size={22}/> : <Circle size={22}/>}
                  </button>
                  <div className="flex-1" onClick={() => item.type === 'budget' && editItem(item)}>
                    <div className="flex justify-between items-start">
                      <span className={`font-medium ${item.completed ? 'line-through text-gray-400' : 'text-gray-800'}`}>{item.title}</span>
                      {item.cost && (
                        <div className="text-right">
                          <div className="text-sm font-bold text-gray-800">${Number(item.cost).toLocaleString()}</div>
                          {item.notes && item.notes.includes('匯率') && <div className="text-[10px] text-gray-400">{item.notes.split(' ')[0]} {item.notes.split(' ')[1]}</div>}
                        </div>
                      )}
                    </div>
                    {item.date && <div className="text-xs text-blue-500 mt-1">{item.date}</div>}
                    {item.category && item.type === 'budget' && <div className={`text-[10px] mt-1 inline-block px-1 rounded border ${BUDGET_CATEGORIES[item.category]?.color}`}>{BUDGET_CATEGORIES[item.category]?.label}</div>}
                  </div>
                  <button onClick={() => deleteItem(item.id, item.type)} className="text-gray-200 hover:text-red-400"><Trash2 size={16}/></button>
                </div>
              ))
            )
          )}
        </div>
      </div>
    </div>
  );
}

export default TravelApp;
