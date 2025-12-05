import { useState, useEffect, useRef } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, deleteDoc, doc, updateDoc, where } from "firebase/firestore";
import { 
  Trash2, Plus, MapPin, Calendar, CheckCircle2, Circle, 
  DollarSign, FileText, Sun, CloudRain, Snowflake, 
  Luggage, Plane, Baby, Accessibility, User, Navigation,
  History, MapPin as MapPinIcon, Camera, Palmtree, ShoppingBag
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

// --- 3. 靜態資料庫 (模擬 AI 與 API) ---

// 熱門城市座標 (用於自動查天氣)
const CITY_COORDS = {
  "東京": { lat: 35.6762, lon: 139.6503, region: "JP" },
  "大阪": { lat: 34.6937, lon: 135.5023, region: "JP" },
  "京都": { lat: 35.0116, lon: 135.7681, region: "JP" },
  "首爾": { lat: 37.5665, lon: 126.9780, region: "KR" },
  "台北": { lat: 25.0330, lon: 121.5654, region: "TW" },
  "曼谷": { lat: 13.7563, lon: 100.5018, region: "TH" },
  "新加坡": { lat: 1.3521, lon: 103.8198, region: "SG" },
  "倫敦": { lat: 51.5074, lon: -0.1278, region: "UK" },
  "巴黎": { lat: 48.8566, lon: 2.3522, region: "FR" },
  "香港": { lat: 22.3193, lon: 114.1694, region: "HK" },
};

// 熱門城市列表
const POPULAR_CITIES = ["東京", "大阪", "首爾", "台北", "曼谷", "新加坡", "倫敦", "巴黎"];

// 行李規則庫
const PACKING_RULES = {
  common: ["護照/簽證", "現金/信用卡", "手機充電器", "萬用轉接頭", "行動電源", "個人盥洗包"],
  adult: ["換洗衣物", "刮鬍刀/化妝品", "常備藥品"],
  child: ["兒童牙刷", "安撫玩具", "畫冊/貼紙書", "兒童餐具", "水壺"], // 小童 6-12
  toddler: ["尿布 (計算天數x6)", "奶粉/奶瓶", "濕紙巾", "嬰兒推車", "口水巾"], // 幼童 0-5
  elderly: ["處方籤藥物", "老花眼鏡", "保暖護具", "折疊拐杖/助行器", "保溫瓶"], // 老人
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

// 模擬 AI 行程生成模板
const ITINERARY_TEMPLATES = {
  "東京": [
    { title: "抵達東京", notes: "前往飯店 Check-in，晚上逛新宿/澀谷" },
    { title: "迪士尼樂園", notes: "全日遊玩，記得提早入園抽券" },
    { title: "淺草與晴空塔", notes: "雷門拍照，下午去晴空塔購物" },
    { title: "明治神宮與原宿", notes: "感受流行文化，表參道散步" },
    { title: "回程", notes: "前往成田/羽田機場，免稅店採購" }
  ],
  "大阪": [
    { title: "抵達大阪", notes: "心齋橋、道頓堀吃美食" },
    { title: "環球影城 USJ", notes: "任天堂世界必去！" },
    { title: "大阪城與黑門市場", notes: "參觀歷史古蹟，吃海鮮" },
    { title: "奈良一日遊", notes: "餵小鹿，參觀東大寺" },
    { title: "回程", notes: "關西機場採買伴手禮" }
  ],
  "default": [
    { title: "抵達目的地", notes: "辦理入住，熟悉周邊環境" },
    { title: "市區觀光", notes: "參觀著名地標與博物館" },
    { title: "當地美食探索", notes: "尋找評價高的在地餐廳" },
    { title: "購物與休閒", notes: "購買紀念品，享受下午茶" },
    { title: "整理行李與返程", notes: "檢查護照與隨身物品" }
  ]
};

function TravelApp() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('dashboard'); 
  const [currentTrip, setCurrentTrip] = useState(null);
  
  // 資料狀態
  const [trips, setTrips] = useState([]);
  const [items, setItems] = useState([]);
  const [searchHistory, setSearchHistory] = useState([]); // 搜尋歷史

  // 表單狀態
  const [newTrip, setNewTrip] = useState({
    origin: '香港',
    destination: '',
    startDate: '',
    endDate: '',
    purpose: 'sightseeing', // sightseeing, shopping, relax
    travelers: {
      adults: 1,
      children: 0, // 6-12歲
      toddlers: 0, // 0-5歲
      elderly: 0   // 65歲+
    }
  });

  const [newItem, setNewItem] = useState({ 
    type: 'itinerary', 
    title: '', 
    cost: '', 
    date: '', 
    notes: '' 
  });

  const [activeTab, setActiveTab] = useState('itinerary');
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  const [loadingWeather, setLoadingWeather] = useState(false);

  // 初始化與讀取
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) signInAnonymously(auth);
    });
    // 讀取搜尋歷史
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

  // --- 核心邏輯 ---

  // 1. 取得天氣 (模擬或 API)
  const fetchWeatherPrediction = async (city) => {
    // 如果有座標，使用 Open-Meteo API
    if (CITY_COORDS[city]) {
      const { lat, lon } = CITY_COORDS[city];
      try {
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=auto`);
        const data = await res.json();
        const code = data.daily.weathercode[0];
        // 簡單判斷天氣類型
        if (code <= 3) return 'sunny';
        if (code >= 71) return 'cold'; // 下雪
        if (data.daily.temperature_2m_max[0] < 15) return 'cold';
        return 'rainy';
      } catch (e) {
        console.error("Weather API Error", e);
        return 'sunny'; // 失敗預設
      }
    }
    // 沒座標的簡單回退機制
    return 'sunny'; 
  };

  // 2. 建立行程
  const createTrip = async (e) => {
    e.preventDefault();
    if (!newTrip.destination) return;

    // 儲存搜尋歷史
    if (!searchHistory.includes(newTrip.destination)) {
      const newHistory = [newTrip.destination, ...searchHistory].slice(0, 5);
      setSearchHistory(newHistory);
      localStorage.setItem('trip_search_history', JSON.stringify(newHistory));
    }

    try {
      setLoadingWeather(true);
      // 自動取得天氣
      const weather = await fetchWeatherPrediction(newTrip.destination);
      setLoadingWeather(false);

      const docRef = await addDoc(collection(db, 'artifacts', APP_ID, 'users', user.uid, 'trips'), {
        ...newTrip,
        weather,
        createdAt: serverTimestamp()
      });
      
      const tripId = docRef.id;
      const batch = [];

      // A. 生成行李清單 (根據人員與天氣)
      const addPackingItem = (title) => {
        batch.push(addDoc(collection(db, 'artifacts', APP_ID, 'users', user.uid, 'sub_items'), {
          tripId, type: 'packing', title, completed: false, createdAt: serverTimestamp()
        }));
      };

      PACKING_RULES.common.forEach(addPackingItem);
      if (newTrip.travelers.adults > 0) PACKING_RULES.adult.forEach(i => addPackingItem(`${i} (x${newTrip.travelers.adults}人)`));
      if (newTrip.travelers.children > 0) PACKING_RULES.child.forEach(i => addPackingItem(`${i} (x${newTrip.travelers.children}小童)`));
      if (newTrip.travelers.toddlers > 0) PACKING_RULES.toddler.forEach(i => addPackingItem(`${i} (x${newTrip.travelers.toddlers}幼童)`));
      if (newTrip.travelers.elderly > 0) PACKING_RULES.elderly.forEach(i => addPackingItem(`${i} (x${newTrip.travelers.elderly}長輩)`));
      
      // 天氣物品
      PACKING_RULES.weather[weather].forEach(addPackingItem);
      // 目的物品
      if (newTrip.purpose === 'shopping') PACKING_RULES.purpose.shopping.forEach(addPackingItem);

      // B. 自動生成行程路線 (AI 模擬)
      const template = ITINERARY_TEMPLATES[newTrip.destination] || ITINERARY_TEMPLATES['default'];
      // 計算天數 (簡單計算)
      const start = new Date(newTrip.startDate);
      const end = new Date(newTrip.endDate);
      const days = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1);

      for (let i = 0; i < days; i++) {
        // 如果天數超過模板長度，循環使用通用模板
        const plan = template[i] || { title: `第 ${i+1} 天自由行`, notes: "探索當地特色" };
        const dateStr = new Date(start.getTime() + i * 86400000).toISOString().split('T')[0];
        
        batch.push(addDoc(collection(db, 'artifacts', APP_ID, 'users', user.uid, 'sub_items'), {
          tripId,
          type: 'itinerary',
          title: plan.title,
          notes: plan.notes,
          date: dateStr,
          completed: false,
          createdAt: serverTimestamp()
        }));
      }

      await Promise.all(batch);
      setNewTrip({ origin: '香港', destination: '', startDate: '', endDate: '', purpose: 'sightseeing', travelers: { adults: 1, children: 0, toddlers: 0, elderly: 0 } });
      alert("行程建立成功！已自動規劃路線與行李。");
    } catch (error) {
      console.error(error);
      setLoadingWeather(false);
    }
  };

  const deleteTrip = async (id, e) => {
    e.stopPropagation();
    if (!confirm("確定刪除此行程？")) return;
    await deleteDoc(doc(db, 'artifacts', APP_ID, 'users', user.uid, 'trips', id));
  };

  const openTrip = (trip) => {
    setCurrentTrip(trip);
    setView('trip-detail');
    setNewItem({ ...newItem, date: trip.startDate });
  };

  // 打卡功能
  const handleCheckIn = () => {
    if (!navigator.geolocation) {
      alert("您的裝置不支援地理位置功能");
      return;
    }
    
    // 取得當前位置
    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords;
      const now = new Date();
      const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      // 反向地理編碼 (取得大概地址) - 使用 OpenStreetMap 免費 API
      let locationName = `GPS: ${latitude.toFixed(2)}, ${longitude.toFixed(2)}`;
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
        const data = await res.json();
        if (data && data.address) {
          locationName = data.address.road || data.address.suburb || data.address.city || locationName;
        }
      } catch (e) {
        console.error("Geocoding failed", e);
      }

      await addDoc(collection(db, 'artifacts', APP_ID, 'users', user.uid, 'sub_items'), {
        tripId: currentTrip.id,
        type: 'itinerary',
        title: `📍 打卡：${locationName}`,
        notes: `時間：${timeString}`,
        date: new Date().toISOString().split('T')[0],
        isCheckIn: true,
        completed: true,
        createdAt: serverTimestamp()
      });
    }, (error) => {
      alert("無法取得位置，請確認瀏覽器權限。");
    });
  };

  // 細項 CRUD
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

  const toggleItemComplete = async (item) => {
    await updateDoc(doc(db, 'artifacts', APP_ID, 'users', user.uid, 'sub_items', item.id), {
      completed: !item.completed
    });
  };

  const deleteItem = async (id) => {
    await deleteDoc(doc(db, 'artifacts', APP_ID, 'users', user.uid, 'sub_items', id));
  };

  const currentTotalCost = items
    .filter(i => i.type === 'budget' || i.cost)
    .reduce((sum, i) => sum + (Number(i.cost) || 0), 0);

  // --- Components ---

  const TravelerCounter = ({ label, icon: Icon, value, field }) => (
    <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
      <div className="flex items-center gap-2">
        <Icon size={18} className="text-gray-500" />
        <span className="text-sm text-gray-700">{label}</span>
      </div>
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => setNewTrip(prev => ({...prev, travelers: {...prev.travelers, [field]: Math.max(0, prev.travelers[field]-1)}}))} className="w-6 h-6 rounded-full bg-white border flex items-center justify-center text-gray-500 hover:bg-gray-100">-</button>
        <span className="w-4 text-center font-medium">{value}</span>
        <button type="button" onClick={() => setNewTrip(prev => ({...prev, travelers: {...prev.travelers, [field]: prev.travelers[field]+1}}))} className="w-6 h-6 rounded-full bg-white border flex items-center justify-center text-blue-500 hover:bg-blue-50">+</button>
      </div>
    </div>
  );

  // --- Render ---

  if (view === 'dashboard') {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans text-gray-800">
        <div className="max-w-4xl mx-auto space-y-6">
          <header className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-blue-900 flex items-center gap-2">
                <Plane className="text-blue-600" /> 智能旅遊管家
              </h1>
              <p className="text-gray-500">規劃您的專屬旅程</p>
            </div>
            <div className="text-sm text-gray-400">ID: {user?.uid.slice(0, 4)}</div>
          </header>

          {/* 新增行程區塊 */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Plus size={20}/> 建立新旅程</h2>
            <form onSubmit={createTrip} className="space-y-4">
              {/* 地點與城市建議 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-gray-500 font-medium">出發地</label>
                  <div className="relative">
                    <MapPinIcon className="absolute left-3 top-3 text-gray-400" size={16} />
                    <input 
                      value={newTrip.origin} 
                      onChange={e=>setNewTrip({...newTrip, origin: e.target.value})} 
                      className="w-full pl-9 p-2 border rounded-lg bg-gray-50" 
                    />
                  </div>
                </div>
                <div className="space-y-1 relative">
                  <label className="text-xs text-gray-500 font-medium">目的地</label>
                  <div className="relative">
                    <Navigation className="absolute left-3 top-3 text-blue-500" size={16} />
                    <input 
                      placeholder="輸入或選擇熱門城市" 
                      value={newTrip.destination} 
                      onChange={e=>setNewTrip({...newTrip, destination: e.target.value})} 
                      onFocus={() => setShowCitySuggestions(true)}
                      className="w-full pl-9 p-2 border rounded-lg focus:ring-2 ring-blue-500 outline-none" 
                      required 
                    />
                  </div>
                  {/* 城市建議下拉選單 */}
                  {showCitySuggestions && (
                    <div className="absolute z-10 w-full bg-white border rounded-lg shadow-xl mt-1 p-2">
                      {searchHistory.length > 0 && (
                        <div className="mb-2">
                          <p className="text-xs text-gray-400 mb-1 flex items-center gap-1"><History size={10}/> 歷史搜尋</p>
                          <div className="flex flex-wrap gap-2">
                            {searchHistory.map(city => (
                              <button type="button" key={city} onClick={() => {setNewTrip({...newTrip, destination: city}); setShowCitySuggestions(false);}} className="text-xs bg-gray-100 px-2 py-1 rounded hover:bg-gray-200">{city}</button>
                            ))}
                          </div>
                        </div>
                      )}
                      <div>
                        <p className="text-xs text-gray-400 mb-1 flex items-center gap-1"><Palmtree size={10}/> 熱門城市</p>
                        <div className="grid grid-cols-4 gap-2">
                          {POPULAR_CITIES.map(city => (
                            <button type="button" key={city} onClick={() => {setNewTrip({...newTrip, destination: city}); setShowCitySuggestions(false);}} className="text-xs border px-2 py-1 rounded hover:bg-blue-50 hover:border-blue-200">{city}</button>
                          ))}
                        </div>
                      </div>
                      <button type="button" onClick={()=>setShowCitySuggestions(false)} className="w-full text-center text-xs text-blue-500 mt-2 pt-2 border-t">關閉</button>
                    </div>
                  )}
                </div>
              </div>

              {/* 日期 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-gray-500 font-medium">旅遊區間</label>
                  <div className="flex gap-2">
                    <input type="date" value={newTrip.startDate} onChange={e=>setNewTrip({...newTrip, startDate: e.target.value})} className="w-full p-2 border rounded-lg" required />
                    <span className="self-center text-gray-400">➔</span>
                    <input type="date" value={newTrip.endDate} onChange={e=>setNewTrip({...newTrip, endDate: e.target.value})} className="w-full p-2 border rounded-lg" required />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-gray-500 font-medium">旅行目的 (影響行程與打包)</label>
                  <select value={newTrip.purpose} onChange={e=>setNewTrip({...newTrip, purpose: e.target.value})} className="w-full p-2 border rounded-lg bg-white">
                    <option value="sightseeing">📸 觀光打卡</option>
                    <option value="shopping">🛍️ 購物血拼</option>
                    <option value="relax">💆 休閒度假</option>
                  </select>
                </div>
              </div>

              {/* 人員計數器 */}
              <div className="space-y-2">
                <label className="text-xs text-gray-500 font-medium">同行人員</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <TravelerCounter label="成人" icon={User} field="adults" value={newTrip.travelers.adults} />
                  <TravelerCounter label="小童 (6-12)" icon={User} field="children" value={newTrip.travelers.children} />
                  <TravelerCounter label="幼童 (0-5)" icon={Baby} field="toddlers" value={newTrip.travelers.toddlers} />
                  <TravelerCounter label="長者" icon={Accessibility} field="elderly" value={newTrip.travelers.elderly} />
                </div>
              </div>

              <button type="submit" disabled={loadingWeather} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition shadow-md flex justify-center items-center gap-2">
                {loadingWeather ? "正在分析天氣與路線..." : "✨ 智能生成行程"}
              </button>
            </form>
          </div>

          {/* 行程卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {trips.map(trip => (
              <div key={trip.id} onClick={() => openTrip(trip)} className="bg-white p-5 rounded-xl shadow-sm border hover:border-blue-400 hover:shadow-md cursor-pointer transition relative overflow-hidden">
                {/* 天氣背景裝飾 */}
                <div className={`absolute top-0 right-0 p-4 opacity-10 ${trip.weather==='rainy'?'text-blue-800':trip.weather==='cold'?'text-cyan-600':'text-orange-500'}`}>
                  {trip.weather==='rainy' ? <CloudRain size={100}/> : trip.weather==='cold' ? <Snowflake size={100}/> : <Sun size={100}/>}
                </div>
                
                <button onClick={(e) => deleteTrip(trip.id, e)} className="absolute top-4 right-4 text-gray-300 hover:text-red-500 p-1 z-10"><Trash2 size={16}/></button>
                
                <div className="relative z-0">
                  <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    {trip.destination} 
                    <span className="text-xs font-normal bg-gray-100 px-2 py-1 rounded-full border">
                      {trip.weather === 'rainy' ? '🌧️ 雨季' : trip.weather === 'cold' ? '❄️ 寒冷' : '☀️ 晴朗'}
                    </span>
                  </h3>
                  <p className="text-sm text-gray-500 mt-1 flex items-center gap-1"><Calendar size={14}/> {trip.startDate} ~ {trip.endDate}</p>
                  
                  <div className="flex flex-wrap gap-2 mt-3">
                    {trip.travelers.toddlers > 0 && <span className="text-xs bg-pink-50 text-pink-600 px-2 py-1 rounded-full flex items-center gap-1"><Baby size={12}/> 幼兒隨行</span>}
                    {trip.travelers.elderly > 0 && <span className="text-xs bg-purple-50 text-purple-600 px-2 py-1 rounded-full flex items-center gap-1"><Accessibility size={12}/> 長者隨行</span>}
                    {trip.purpose === 'shopping' && <span className="text-xs bg-yellow-50 text-yellow-600 px-2 py-1 rounded-full flex items-center gap-1"><ShoppingBag size={12}/> 購物團</span>}
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
            <button onClick={() => setView('dashboard')} className="text-gray-500 hover:text-blue-600 text-sm flex items-center gap-1">
              ← 返回列表
            </button>
            <div className="text-center">
              <h1 className="font-bold text-lg">{currentTrip.destination}</h1>
              <p className="text-xs text-gray-500">{currentTrip.startDate} 出發</p>
            </div>
            <div className="w-16"></div> 
          </div>
          
          <div className="flex gap-6 overflow-x-auto pb-1 scrollbar-hide">
            {[
              { id: 'itinerary', icon: <MapPin size={18}/>, label: '每日行程' },
              { id: 'packing', icon: <Luggage size={18}/>, label: '行李清單' },
              { id: 'budget', icon: <DollarSign size={18}/>, label: '預算管理' },
              { id: 'info', icon: <FileText size={18}/>, label: '資訊筆記' },
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

      <div className="flex-1 max-w-4xl mx-auto w-full p-4 space-y-6">
        {/* 打卡按鈕 (僅在行程頁顯示) */}
        {activeTab === 'itinerary' && (
          <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex justify-between items-center">
            <div>
              <h3 className="font-bold text-blue-800">📍 記錄我的足跡</h3>
              <p className="text-xs text-blue-600">按下按鈕，自動將目前位置加入行程</p>
            </div>
            <button onClick={handleCheckIn} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md hover:bg-blue-700 flex items-center gap-2">
              <Camera size={16} /> 這裡打卡
            </button>
          </div>
        )}

        {/* 預算統計 */}
        {activeTab === 'budget' && (
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-6 rounded-2xl shadow-lg flex justify-between items-center">
            <div>
              <p className="text-green-100 text-sm">累積總支出</p>
              <h2 className="text-3xl font-bold">${currentTotalCost.toLocaleString()}</h2>
            </div>
            <div className="bg-white/20 p-3 rounded-full"><DollarSign size={32} /></div>
          </div>
        )}

        {/* 輸入 Bar */}
        <form onSubmit={addItem} className="bg-white p-3 rounded-xl shadow-sm border flex gap-2 items-center sticky top-32 z-10">
          <input 
            type="text" 
            placeholder={
              activeTab === 'itinerary' ? "新增行程..." :
              activeTab === 'packing' ? "新增物品..." :
              activeTab === 'budget' ? "新增消費..." : "新增筆記..."
            }
            className="flex-1 p-2 bg-gray-50 rounded-lg outline-none focus:bg-white focus:ring-2 ring-blue-100"
            value={newItem.title}
            onChange={e => setNewItem({...newItem, title: e.target.value})}
          />
          {(activeTab === 'budget' || activeTab === 'itinerary') && (
             <input 
             type={activeTab === 'budget' ? "number" : "date"}
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
        <div className="space-y-3 pb-20">
          {tripItems.length === 0 ? (
            <div className="text-center text-gray-400 py-10">
              <div className="inline-block p-4 bg-gray-100 rounded-full mb-2"><FileText size={24}/></div>
              <p>這裡空空的，系統已自動生成部分建議，您也可以手動新增！</p>
            </div>
          ) : (
            // 排序：未完成在前，日期在後
            tripItems.sort((a,b) => {
              if (a.completed !== b.completed) return a.completed ? 1 : -1;
              if (a.date && b.date) return a.date.localeCompare(b.date);
              return 0;
            }).map(item => (
              <div key={item.id} className={`bg-white p-4 rounded-xl border flex items-start gap-3 transition-all ${item.completed ? 'bg-gray-50 opacity-60' : 'shadow-sm hover:shadow-md'} ${item.isCheckIn ? 'border-l-4 border-l-blue-500' : ''}`}>
                <button onClick={() => toggleItemComplete(item)} className={`mt-1 ${item.completed ? 'text-green-500' : 'text-gray-300 hover:text-blue-500'}`}>
                  {item.completed ? <CheckCircle2 size={22}/> : <Circle size={22}/>}
                </button>
                
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <span className={`font-medium text-lg ${item.completed ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                      {item.title}
                    </span>
                    {item.cost && <span className="text-sm font-bold text-gray-600 bg-gray-100 px-2 py-1 rounded">${Number(item.cost).toLocaleString()}</span>}
                  </div>
                  <div className="flex flex-col gap-1 mt-1">
                    {item.date && <span className="text-xs text-blue-500 font-medium flex items-center gap-1"><Calendar size={12}/> {item.date}</span>}
                    {item.notes && <span className="text-sm text-gray-500">{item.notes}</span>}
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
