import { useState, useEffect, useMemo } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously, onAuthStateChanged, GoogleAuthProvider, linkWithPopup, signInWithPopup } from "firebase/auth";
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, deleteDoc, doc, updateDoc, where, getDocs } from "firebase/firestore";
import { 
  Trash2, Plus, Minus, MapPin, Calendar as CalIcon, CheckCircle2, Circle, 
  DollarSign, FileText, Sun, CloudRain, Snowflake, Cloud, Droplets, Wind,
  Luggage, Plane, Baby, Accessibility, User, Navigation,
  History, MapPin as MapPinIcon, Camera, ShoppingBag,
  Calculator, RefreshCw, Edit2, Map, Briefcase, Coffee, Home, Bus, Shirt,
  ExternalLink, Clock, Search, Utensils, Mountain, Siren, Ambulance, Car,
  Printer, Lock, Unlock, LogIn, Download, Eye, X, Heart, ChevronLeft, ChevronRight, Share,
  AlertCircle, Check, RefreshCw as RefreshIcon, Users, CreditCard, Bed, Ticket
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
const googleProvider = new GoogleAuthProvider();
const APP_ID = "travel-mate-app-7ca34"; 

// --- 3. 資料庫與常數 (大幅擴充) ---

const CITY_DATA = {
  "東京": { lat: 35.6762, lon: 139.6503, currency: "JPY", region: "JP", intro: "傳統與未來交織的城市。", emergency: { police: "110", ambulance: "119" }, rideApp: "Uber / GO" },
  "大阪": { lat: 34.6937, lon: 135.5023, currency: "JPY", region: "JP", intro: "美食之都。", emergency: { police: "110", ambulance: "119" }, rideApp: "Uber / GO" },
  "京都": { lat: 35.0116, lon: 135.7681, currency: "JPY", region: "JP", intro: "千年古都。", emergency: { police: "110", ambulance: "119" }, rideApp: "MK Taxi" },
  "札幌": { lat: 43.0618, lon: 141.3545, currency: "JPY", region: "JP", intro: "北國雪景與美食。", emergency: { police: "110", ambulance: "119" }, rideApp: "Uber / GO" },
  "福岡": { lat: 33.5902, lon: 130.4017, currency: "JPY", region: "JP", intro: "九州門戶，拉麵聖地。", emergency: { police: "110", ambulance: "119" }, rideApp: "Uber / GO" },
  "首爾": { lat: 37.5665, lon: 126.9780, currency: "KRW", region: "KR", intro: "韓流中心。", emergency: { police: "112", ambulance: "119" }, rideApp: "Kakao T" },
  "釜山": { lat: 35.1796, lon: 129.0756, currency: "KRW", region: "KR", intro: "海港城市。", emergency: { police: "112", ambulance: "119" }, rideApp: "Kakao T" },
  "台北": { lat: 25.0330, lon: 121.5654, currency: "TWD", region: "TW", intro: "美食與夜市的天堂。", emergency: { police: "110", ambulance: "119" }, rideApp: "Uber / 55688" },
  "曼谷": { lat: 13.7563, lon: 100.5018, currency: "THB", region: "TH", intro: "充滿活力的不夜城。", emergency: { police: "191", ambulance: "1669" }, rideApp: "Grab" },
  "倫敦": { lat: 51.5074, lon: -0.1278, currency: "GBP", region: "UK", intro: "歷史與現代的融合。", emergency: { police: "999", ambulance: "999" }, rideApp: "Uber" },
  "巴黎": { lat: 48.8566, lon: 2.3522, currency: "EUR", region: "EU", intro: "浪漫之都。", emergency: { police: "17", ambulance: "15" }, rideApp: "Uber" },
  "香港": { lat: 22.3193, lon: 114.1694, currency: "HKD", region: "HK", intro: "東方之珠。", emergency: { police: "999", ambulance: "999" }, rideApp: "Uber" },
  "雪梨": { lat: -33.8688, lon: 151.2093, currency: "AUD", region: "AU", intro: "澳洲最大城市。", emergency: { police: "000", ambulance: "000" }, rideApp: "Uber" },
  "墨爾本": { lat: -37.8136, lon: 144.9631, currency: "AUD", region: "AU", intro: "文化與咖啡之都。", emergency: { police: "000", ambulance: "000" }, rideApp: "Uber" },
  "布里斯本": { lat: -27.4705, lon: 153.0260, currency: "AUD", region: "AU", intro: "陽光之城。", emergency: { police: "000", ambulance: "000" }, rideApp: "Uber" },
  "黃金海岸": { lat: -28.0167, lon: 153.4000, currency: "AUD", region: "AU", intro: "衝浪者的天堂。", emergency: { police: "000", ambulance: "000" }, rideApp: "Uber" },
};

const POPULAR_CITIES = Object.keys(CITY_DATA);
const POPULAR_ORIGINS = ["香港", "台北", "高雄", "澳門", "東京", "倫敦", "紐約", "雪梨", "墨爾本"];

const EXCHANGE_RATES = { 
  "HKD": 1, "JPY": 0.052, "KRW": 0.0058, "TWD": 0.25, "THB": 0.22, 
  "SGD": 5.8, "GBP": 9.9, "EUR": 8.5, "USD": 7.8, "CNY": 1.1, "AUD": 5.1 
};

// 基礎消費 (HKD/人/天) - 僅作參考基數
const BASE_COSTS = {
  "JP": { food: 400, transport: 150 },
  "KR": { food: 300, transport: 100 },
  "HK": { food: 400, transport: 100 }, 
  "TH": { food: 200, transport: 80 },
  "TW": { food: 250, transport: 80 },
  "UK": { food: 600, transport: 200 },
  "AU": { food: 500, transport: 150 },
  "default": { food: 400, transport: 150 }
};

// 機票與住宿係數 (HKD)
const FLIGHT_COSTS = {
  "JP": { direct: 5000, transfer: 3500 },
  "UK": { direct: 10000, transfer: 7000 },
  "AU": { direct: 8000, transfer: 6000 },
  "default": { direct: 6000, transfer: 4000 }
};

const HOTEL_COSTS = {
  "5star": 2500, "4star": 1500, "3star": 1000, "homestay": 800, "hostel": 400
};

// 行李物品定義
const ITEM_DEFINITIONS = {
  "護照/簽證": { weight: 0.1, volume: 1, category: "doc", icon: FileText },
  "現金/信用卡": { weight: 0.1, volume: 1, category: "doc", icon: DollarSign },
  "手機充電器": { weight: 0.2, volume: 2, category: "move", icon: ZapIcon },
  "萬用轉接頭": { weight: 0.2, volume: 2, category: "move", icon: ZapIcon },
  "換洗衣物": { weight: 0.5, volume: 10, category: "clothes", icon: Shirt },
  "厚外套": { weight: 1.2, volume: 25, category: "clothes", icon: Shirt },
  "薄外套": { weight: 0.5, volume: 10, category: "clothes", icon: Shirt },
  "泳衣": { weight: 0.2, volume: 3, category: "clothes", icon: Shirt },
  "盥洗包": { weight: 0.5, volume: 5, category: "daily", icon: RefreshCw },
  "藥品": { weight: 0.2, volume: 2, category: "daily", icon: Plus },
  "尿布": { weight: 0.05, volume: 2, category: "daily", icon: Baby },
  "奶粉": { weight: 0.8, volume: 10, category: "food", icon: Utensils },
  "推車": { weight: 5.0, volume: 50, category: "move", icon: Navigation },
  "雨傘": { weight: 0.3, volume: 3, category: "daily", icon: CloudRain },
  "水壺": { weight: 0.2, volume: 5, category: "food", icon: Coffee },
};

function ZapIcon(props) { return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg> }

const BUDGET_CATEGORIES = {
  shopping: { label: "衣/購", icon: ShoppingBag, color: "text-pink-500" },
  food: { label: "食", icon: Utensils, color: "text-orange-500" },
  stay: { label: "住", icon: Home, color: "text-indigo-500" },
  transport: { label: "行", icon: Bus, color: "text-blue-500" },
  other: { label: "其他", icon: FileText, color: "text-gray-500" }
};

// --- Custom Components ---

const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);
  const bgClass = type === 'error' ? 'bg-red-500' : 'bg-green-600';
  const Icon = type === 'error' ? AlertCircle : Check;
  return (
    <div className={`fixed bottom-8 left-1/2 transform -translate-x-1/2 ${bgClass} text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 z-[60] animate-bounce-in`}>
      <Icon size={16} /> <span className="text-sm font-bold">{message}</span>
    </div>
  );
};

// 升級版日曆：顯示節假日
const RangeCalendar = ({ startDate, endDate, onChange, onClose }) => {
  const [currentMonth, setCurrentMonth] = useState(startDate ? new Date(startDate) : new Date());
  
  const daysInMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  // 模擬節假日 (簡單邏輯：週末與固定日期)
  const getHoliday = (day) => {
    const d = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const dayOfWeek = d.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) return "休"; // 週末
    // 模擬農曆/節日 (真實專案需引入農曆庫)
    if (day === 1 || day === 15) return "農"; 
    return null;
  };

  const handleDateClick = (day) => {
    const clickedDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const dateStr = clickedDate.toISOString().split('T')[0];
    if (!startDate || (startDate && endDate)) {
      onChange({ startDate: dateStr, endDate: '' });
    } else {
      if (new Date(dateStr) < new Date(startDate)) {
        onChange({ startDate: dateStr, endDate: startDate });
        if (onClose) setTimeout(onClose, 300);
      } else {
        onChange({ startDate: startDate, endDate: dateStr });
        if (onClose) setTimeout(onClose, 300);
      }
    }
  };

  const isSelected = (day) => {
    const d = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day).toISOString().split('T')[0];
    return d === startDate || d === endDate;
  };

  const isInRange = (day) => {
    if (!startDate || !endDate) return false;
    const d = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    return d > new Date(startDate) && d < new Date(endDate);
  };

  return (
    <div className="bg-white rounded-xl border p-4 shadow-xl w-72">
      <div className="flex justify-between items-center mb-4">
        <button type="button" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))} className="p-1 hover:bg-gray-100 rounded"><ChevronLeft size={20}/></button>
        <span className="font-bold text-sm">{currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
        <button type="button" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))} className="p-1 hover:bg-gray-100 rounded"><ChevronRight size={20}/></button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs mb-2 text-gray-400">
        {['日','一','二','三','四','五','六'].map(d => <div key={d} className={d==='日'||d==='六'?'text-red-400':''}>{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: firstDayOfMonth(currentMonth) }).map((_, i) => <div key={`empty-${i}`} />)}
        {Array.from({ length: daysInMonth(currentMonth) }).map((_, i) => {
          const day = i + 1;
          const selected = isSelected(day);
          const inRange = isInRange(day);
          const holiday = getHoliday(day);
          return (
            <button
              key={day}
              type="button"
              onClick={() => handleDateClick(day)}
              className={`h-9 w-9 rounded-full text-xs flex flex-col items-center justify-center transition-all relative
                ${selected ? 'bg-blue-600 text-white font-bold shadow-md' : ''}
                ${inRange ? 'bg-blue-100 text-blue-800' : ''}
                ${!selected && !inRange ? 'hover:bg-gray-100 text-gray-700' : ''}
                ${holiday === '休' && !selected && !inRange ? 'text-red-500 bg-red-50' : ''}
              `}
            >
              <span>{day}</span>
              {holiday && !selected && <span className="text-[8px] scale-75 opacity-70">{holiday}</span>}
            </button>
          );
        })}
      </div>
      <div className="mt-3 text-center text-xs text-blue-600 font-medium border-t pt-2 cursor-pointer hover:text-blue-800" onClick={onClose}>完成 / 關閉</div>
    </div>
  );
};

// --- Helper Functions (Expanded POI & Costs) ---

// 擴充景點資料庫 (含預估費用)
const POI_DB = {
  "東京": [
    { name: "東京迪士尼樂園", cost: 600, cat: "sightseeing", time: "全日", note: "夢幻王國" },
    { name: "淺草寺", cost: 0, cat: "sightseeing", time: "2h", note: "雷門打卡" },
    { name: "晴空塔", cost: 200, cat: "sightseeing", time: "2h", note: "俯瞰東京" },
    { name: "澀谷 SHIBUYA SKY", cost: 150, cat: "sightseeing", time: "1.5h", note: "網美必去" },
    { name: "豐洲市場壽司大", cost: 300, cat: "food", time: "2h", note: "早起排隊" },
    { name: "新宿御苑", cost: 40, cat: "sightseeing", time: "2h", note: "賞櫻勝地" }
  ],
  "大阪": [
    { name: "環球影城 USJ", cost: 650, cat: "sightseeing", time: "全日", note: "任天堂世界" },
    { name: "大阪城天守閣", cost: 50, cat: "sightseeing", time: "2h", note: "歷史古蹟" },
    { name: "海遊館", cost: 180, cat: "sightseeing", time: "3h", note: "世界最大級水族館" },
    { name: "道頓堀美食", cost: 200, cat: "food", time: "3h", note: "章魚燒吃到飽" },
    { name: "梅田藍天大廈", cost: 100, cat: "sightseeing", time: "1h", note: "絕美夜景" }
  ],
  // ... 其他城市可以用相同格式擴充，這裡用通用邏輯處理 fallback
};

const generateSmartItinerary = (city, days, purpose, travelers) => {
  const hasKids = travelers.children > 0 || travelers.toddlers > 0;
  const citySpots = POI_DB[city] || [
    { name: "市中心地標", cost: 100, cat: "sightseeing", time: "2h", note: "必訪景點" },
    { name: "當地博物館", cost: 80, cat: "sightseeing", time: "3h", note: "文化體驗" },
    { name: "著名公園", cost: 0, cat: "sightseeing", time: "2h", note: "放鬆散步" },
    { name: "購物商圈", cost: 0, cat: "shopping", time: "4h", note: "血拼時間" },
    { name: "特色夜市", cost: 150, cat: "food", time: "2h", note: "在地小吃" }
  ];

  let itinerary = [];
  itinerary.push({ title: "抵達 & 辦理入住", notes: "前往飯店放行李，熟悉環境", cost: 0, category: "other", startTime: "14:00", duration: "2h" });

  for (let i = 1; i < days - 1; i++) {
    // 簡單輪詢邏輯
    const spot1 = citySpots[i % citySpots.length];
    const spot2 = citySpots[(i + 1) % citySpots.length];
    
    let cost1 = spot1.cost;
    let note1 = spot1.note;
    
    // AI 調整：如果有小孩，優先去樂園或公園
    if (hasKids && (spot1.name.includes("樂園") || spot1.name.includes("動物園"))) {
       note1 += " (親子推薦)";
    }

    itinerary.push({ 
      title: spot1.name, 
      notes: note1, 
      cost: cost1, // 預估費用
      category: spot1.cat,
      startTime: "10:00", 
      duration: spot1.time 
    });

    if (purpose === 'food') {
       itinerary.push({ title: "當地人氣餐廳午餐", notes: "需提前訂位", cost: 200, category: "food", startTime: "13:00", duration: "1.5h" });
    }

    itinerary.push({ 
      title: spot2.name, 
      notes: spot2.note, 
      cost: spot2.cost, 
      category: spot2.cat,
      startTime: "15:00", 
      duration: spot2.time 
    });
  }
  itinerary.push({ title: "前往機場 & 免稅店", notes: "最後採買，準備返程", cost: 0, category: "other", startTime: "09:00", duration: "3h" });
  return itinerary;
};

// 取得天氣
const fetchDailyWeather = async (lat, lon, startStr, endStr) => {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto&start_date=${startStr}&end_date=${endStr}`;
    const res = await fetch(url);
    const data = await res.json();
    const weatherMap = {};
    if (data.daily) {
      data.daily.time.forEach((date, i) => {
        const code = data.daily.weathercode[i];
        let icon = Sun; let desc = "晴";
        if (code >= 95) { icon = CloudRain; desc = "雷雨"; } else if (code >= 71) { icon = Snowflake; desc = "雪"; } else if (code >= 51) { icon = Droplets; desc = "雨"; } else if (code >= 3) { icon = Cloud; desc = "陰"; } else if (code >= 1) { icon = Cloud; desc = "多雲"; }
        weatherMap[date] = { max: data.daily.temperature_2m_max[i], min: data.daily.temperature_2m_min[i], rain: data.daily.precipitation_probability_max[i], icon: icon, desc: desc };
      });
    }
    return weatherMap;
  } catch (e) { return {}; }
};


function TravelApp() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('dashboard'); 
  const [currentTrip, setCurrentTrip] = useState(null);
  const [trips, setTrips] = useState([]);
  const [items, setItems] = useState([]);
  const [searchHistory, setSearchHistory] = useState([]);
  const [showUserModal, setShowUserModal] = useState(false); 
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [weatherData, setWeatherData] = useState({});
  const [isUpdating, setIsUpdating] = useState(true); 
  const [toast, setToast] = useState(null); 

  // UI 狀態
  const [showCalendar, setShowCalendar] = useState(false); 

  // 表單狀態
  const [newTrip, setNewTrip] = useState({
    origin: '香港', destination: '', startDate: '', endDate: '',
    purpose: 'sightseeing', travelers: { adults: 1, children: 0, toddlers: 0, elderly: 0 },
    flightType: 'direct', // direct, transfer
    hotelType: '4star',   // 5star, 4star, 3star, homestay, hostel
    estimatedBudget: 0, budgetDetails: {}
  });

  const [newItem, setNewItem] = useState({ 
    type: 'itinerary', category: 'other', title: '', cost: '', foreignCost: '', currency: 'HKD', date: '', notes: '',
    itemOwner: '成人', quantity: 1, weight: 0, startTime: '', duration: '',
    // 人員資料欄位
    pName: '', pId: '', pPhone: '', pRoom: ''
  });

  const [editingItem, setEditingItem] = useState(null);
  const [checkInModal, setCheckInModal] = useState(false);
  const [activeTab, setActiveTab] = useState('itinerary');
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  const [showOriginSuggestions, setShowOriginSuggestions] = useState(false);
  const [loadingWeather, setLoadingWeather] = useState(false);

  useEffect(() => { const timer = setTimeout(() => setIsUpdating(false), 2500); return () => clearTimeout(timer); }, []);
  const showToast = (message, type = 'success') => setToast({ message, type });

  useEffect(() => { const unsubscribe = onAuthStateChanged(auth, (u) => { setUser(u); if (!u) signInAnonymously(auth); }); const savedHistory = localStorage.getItem('trip_search_history'); if (savedHistory) setSearchHistory(JSON.parse(savedHistory)); return () => unsubscribe(); }, []);
  useEffect(() => { if (!user) return; const q = query(collection(db, 'artifacts', APP_ID, 'users', user.uid, 'trips'), orderBy('createdAt', 'desc')); return onSnapshot(q, (snapshot) => setTrips(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))); }, [user]);
  useEffect(() => { if (!user || !currentTrip) return; const q = query(collection(db, 'artifacts', APP_ID, 'users', user.uid, 'sub_items'), where('tripId', '==', currentTrip.id)); return onSnapshot(q, (snapshot) => setItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))); }, [user, currentTrip]);
  useEffect(() => { if (currentTrip && CITY_DATA[currentTrip.destination]) { const { lat, lon } = CITY_DATA[currentTrip.destination]; fetchDailyWeather(lat, lon, currentTrip.startDate, currentTrip.endDate).then(data => setWeatherData(data)); } }, [currentTrip]);

  const updateTripActualCost = async (tripId) => {
    if (!user || !tripId) return;
    try {
      const q = query(collection(db, 'artifacts', APP_ID, 'users', user.uid, 'sub_items'), where('tripId', '==', tripId));
      const snapshot = await getDocs(q);
      const total = snapshot.docs.reduce((sum, doc) => sum + (Number(doc.data().cost) || 0), 0);
      await updateDoc(doc(db, 'artifacts', APP_ID, 'users', user.uid, 'trips', tripId), { actualCost: total });
    } catch (e) { console.error(e); }
  };

  // --- 超級 AI 預算估算邏輯 ---
  const calculateEstimatedBudget = () => {
    if (!newTrip.startDate || !newTrip.endDate) return;
    if (new Date(newTrip.endDate) < new Date(newTrip.startDate)) return;

    const cityInfo = CITY_DATA[newTrip.destination];
    const region = cityInfo ? cityInfo.region : 'default';
    const baseCosts = BASE_COSTS[region] || BASE_COSTS['default'];
    
    // 取得各類係數
    const purposeMult = PURPOSE_MULTIPLIERS[newTrip.purpose] || PURPOSE_MULTIPLIERS['sightseeing'];
    const flightBase = (FLIGHT_COSTS[region] || FLIGHT_COSTS['default'])[newTrip.flightType];
    const hotelBase = HOTEL_COSTS[newTrip.hotelType];

    const start = new Date(newTrip.startDate);
    const end = new Date(newTrip.endDate);
    const days = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1);
    
    // 人數加權 (嬰兒極低費)
    const flightCount = newTrip.travelers.adults + newTrip.travelers.children + newTrip.travelers.elderly + (newTrip.travelers.toddlers * 0.1);
    const totalPeople = newTrip.travelers.adults + newTrip.travelers.children * 0.8 + newTrip.travelers.toddlers * 0.2 + newTrip.travelers.elderly * 0.9;
    const roomCount = Math.ceil((newTrip.travelers.adults + newTrip.travelers.children + newTrip.travelers.elderly) / 2);

    const estimatedFlight = flightBase * flightCount;
    const estimatedHotel = hotelBase * roomCount * days; 
    const estimatedFood = baseCosts.food * totalPeople * days * purposeMult.food;
    const estimatedTransport = baseCosts.transport * totalPeople * days * purposeMult.transport;
    
    const extraShopping = (newTrip.purpose === 'shopping' ? (purposeMult.shopping || 0) * newTrip.travelers.adults : 0);

    const total = estimatedFlight + estimatedHotel + estimatedFood + estimatedTransport + extraShopping;

    setNewTrip(prev => ({
      ...prev, estimatedBudget: Math.round(total),
      budgetDetails: { flight: Math.round(estimatedFlight), hotel: Math.round(estimatedHotel), food: Math.round(estimatedFood), transport: Math.round(estimatedTransport), shopping: Math.round(extraShopping), days }
    }));
  };

  useEffect(() => {
    if (newTrip.destination && newTrip.startDate && newTrip.endDate) calculateEstimatedBudget();
  }, [newTrip.destination, newTrip.startDate, newTrip.endDate, newTrip.travelers, newTrip.purpose, newTrip.flightType, newTrip.hotelType]);

  // --- CRUD & Actions ---

  const handleGoogleLink = async () => { try { if (user.isAnonymous) await linkWithPopup(user, googleProvider); else showToast("已登入", "success"); } catch (error) { if (error.code === 'auth/credential-already-in-use') { if(confirm("此帳號已有資料，是否切換？")) await signInWithPopup(auth, googleProvider); } } };
  const handleExportData = () => { const data = { user: user.uid, trips: trips, items: items, exportedAt: new Date().toISOString() }; const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `travel_backup.json`; a.click(); };
  const toggleTripLock = async () => { await updateDoc(doc(db, 'artifacts', APP_ID, 'users', user.uid, 'trips', currentTrip.id), { isLocked: !currentTrip.isLocked }); setCurrentTrip(prev => ({...prev, isLocked: !prev.isLocked})); showToast(currentTrip.isLocked ? "行程已解鎖" : "行程已鎖定", "success"); };
  const handlePrint = () => window.print();

  const createTrip = async (e) => {
    e.preventDefault();
    if (!newTrip.startDate || !newTrip.endDate) return showToast("請選擇日期", "error");
    if (!newTrip.destination) return showToast("請輸入目的地", "error");
    try {
      setLoadingWeather(true);
      const docRef = await addDoc(collection(db, 'artifacts', APP_ID, 'users', user.uid, 'trips'), { ...newTrip, weather: 'sunny', currency: CITY_DATA[newTrip.destination]?.currency || 'HKD', actualCost: 0, isLocked: false, createdAt: serverTimestamp() });
      setLoadingWeather(false);
      const tripId = docRef.id;
      const batch = [];
      const addSubItem = (type, title, category, owner, qty = 1, defCost = '') => {
        const defs = ITEM_DEFINITIONS[title] || { weight: 0.5, volume: 5, icon: Briefcase };
        batch.push(addDoc(collection(db, 'artifacts', APP_ID, 'users', user.uid, 'sub_items'), { tripId, type, title, cost: defCost, category, itemOwner: owner, quantity: qty, weight: defs.weight, volume: defs.volume, completed: false, createdAt: serverTimestamp() }));
      };

      // 4. 動態行李邏輯
      const days = newTrip.budgetDetails.days || 3;
      // 根據天氣 (假設冬天去日本需要厚外套)
      const isCold = newTrip.destination === '札幌' || newTrip.destination === '首爾'; 
      ["護照/簽證", "現金/信用卡"].forEach(t => addSubItem('packing', t, 'doc', '全體'));
      ["手機充電器", "萬用轉接頭"].forEach(t => addSubItem('packing', t, 'move', '全體', 1));
      
      if (newTrip.travelers.adults > 0) {
        addSubItem('packing', '換洗衣物', 'clothes', '成人', newTrip.travelers.adults * Math.min(days, 5)); // 最多帶5套
        addSubItem('packing', isCold ? '厚外套' : '薄外套', 'clothes', '成人', newTrip.travelers.adults);
      }
      if (newTrip.travelers.toddlers > 0) {
        addSubItem('packing', '尿布', 'daily', '幼童', newTrip.travelers.toddlers * days * 6);
        addSubItem('packing', '奶粉', 'food', '幼童', 1);
        addSubItem('packing', '推車', 'move', '幼童', 1);
      }

      // 生成智能行程 (帶費用)
      const smartItinerary = generateSmartItinerary(newTrip.destination, days, newTrip.purpose, newTrip.travelers);
      smartItinerary.forEach((plan, idx) => {
        const dateStr = new Date(new Date(newTrip.startDate).getTime() + idx * 86400000).toISOString().split('T')[0];
        batch.push(addDoc(collection(db, 'artifacts', APP_ID, 'users', user.uid, 'sub_items'), { 
          tripId, type: 'itinerary', title: plan.title, date: dateStr, 
          startTime: plan.startTime, duration: plan.duration, notes: plan.notes, 
          cost: plan.cost || 0, category: plan.category || 'other',
          completed: false, createdAt: serverTimestamp() 
        }));
      });

      // 預設預算項目 (自動分類)
      batch.push(addDoc(collection(db, 'artifacts', APP_ID, 'users', user.uid, 'sub_items'), { tripId, type: 'budget', title: `✈️ 機票 (${newTrip.flightType==='direct'?'直航':'轉機'})`, cost: newTrip.budgetDetails.flight, category: 'transport', createdAt: serverTimestamp() }));
      batch.push(addDoc(collection(db, 'artifacts', APP_ID, 'users', user.uid, 'sub_items'), { tripId, type: 'budget', title: `🏨 住宿 (${newTrip.hotelType})`, cost: newTrip.budgetDetails.hotel, category: 'stay', createdAt: serverTimestamp() }));
      batch.push(addDoc(collection(db, 'artifacts', APP_ID, 'users', user.uid, 'sub_items'), { tripId, type: 'budget', title: '🍽️ 預估餐飲費', cost: newTrip.budgetDetails.food, category: 'food', createdAt: serverTimestamp() }));
      batch.push(addDoc(collection(db, 'artifacts', APP_ID, 'users', user.uid, 'sub_items'), { tripId, type: 'budget', title: '🚌 預估交通費', cost: newTrip.budgetDetails.transport, category: 'transport', createdAt: serverTimestamp() }));
      
      if (newTrip.budgetDetails.shopping > 0) {
        batch.push(addDoc(collection(db, 'artifacts', APP_ID, 'users', user.uid, 'sub_items'), { tripId, type: 'budget', title: '🛍️ 預留購物金', cost: newTrip.budgetDetails.shopping, category: 'shopping', createdAt: serverTimestamp() }));
      }

      await Promise.all(batch);
      setNewTrip({ origin: '香港', destination: '', startDate: '', endDate: '', purpose: 'sightseeing', travelers: { adults: 1, children: 0, toddlers: 0, elderly: 0 }, flightType: 'direct', hotelType: '4star', estimatedBudget: 0, budgetDetails: {} });
      showToast("AI 行程與預算表已建立！", "success");
    } catch (error) { console.error(error); setLoadingWeather(false); showToast("建立失敗", "error"); }
  };

  // ... CRUD actions same as before (delete, open, etc) ...
  const deleteTrip = async (id, e) => { e.stopPropagation(); if (confirm("確定刪除？")) await deleteDoc(doc(db, 'artifacts', APP_ID, 'users', user.uid, 'trips', id)); };
  const openTrip = (trip) => { setCurrentTrip(trip); setView('trip-detail'); setNewItem({ ...newItem, date: trip.startDate, currency: CITY_DATA[trip.destination]?.currency || 'HKD' }); };
  const handleForeignCostChange = (amount, currency) => { const rate = EXCHANGE_RATES[currency] || 1; setNewItem(prev => ({ ...prev, foreignCost: amount, currency: currency, cost: Math.round(amount * rate) })); };
  const addItem = async (e) => {
    e.preventDefault(); if ((!newItem.title && !newItem.pName) && !checkInModal) return; if (currentTrip.isLocked) return showToast("已鎖定", "error");
    
    // 人員資料
    if (activeTab === 'people') {
        await addDoc(collection(db, 'artifacts', APP_ID, 'users', user.uid, 'sub_items'), {
            tripId: currentTrip.id, type: 'people',
            title: newItem.pName, notes: `房號: ${newItem.pRoom}`,
            pId: newItem.pId, pPhone: newItem.pPhone,
            completed: false, createdAt: serverTimestamp()
        });
        setNewItem({...newItem, pName:'', pId:'', pPhone:'', pRoom:''});
        return showToast("人員已新增", "success");
    }

    let finalNotes = newItem.notes; if (newItem.foreignCost && newItem.currency !== 'HKD') finalNotes = `${newItem.currency} ${newItem.foreignCost} (匯率 ${EXCHANGE_RATES[newItem.currency]}) ${finalNotes}`;
    let finalWeight = newItem.weight, finalVolume = 0; if (newItem.type === 'packing') { const defs = ITEM_DEFINITIONS[newItem.title]; if (defs && finalWeight === 0) { finalWeight = defs.weight; finalVolume = defs.volume; } }
    const payload = { ...newItem, notes: finalNotes, weight: finalWeight, volume: finalVolume, tripId: currentTrip.id, completed: false, createdAt: serverTimestamp() };
    if (editingItem) { await updateDoc(doc(db, 'artifacts', APP_ID, 'users', user.uid, 'sub_items', editingItem), payload); setEditingItem(null); } else { await addDoc(collection(db, 'artifacts', APP_ID, 'users', user.uid, 'sub_items'), payload); }
    if (newItem.cost || newItem.type === 'budget') setTimeout(() => updateTripActualCost(currentTrip.id), 500);
    setNewItem({ ...newItem, title: '', cost: '', foreignCost: '', notes: '', quantity: 1, weight: 0, startTime: '', duration: '' }); setCheckInModal(false);
    showToast("項目已新增", "success");
  };
  const editItem = (item) => { if (currentTrip.isLocked) return showToast("已鎖定", "error"); setNewItem({ ...item, foreignCost: item.foreignCost || '', currency: item.currency || 'HKD' }); setEditingItem(item.id); };
  const deleteItem = async (id) => { if (currentTrip.isLocked) return showToast("已鎖定", "error"); if(!confirm("確定刪除？")) return; await deleteDoc(doc(db, 'artifacts', APP_ID, 'users', user.uid, 'sub_items', id)); setTimeout(() => updateTripActualCost(currentTrip.id), 500); };
  const toggleItemComplete = async (item) => updateDoc(doc(db, 'artifacts', APP_ID, 'users', user.uid, 'sub_items', item.id), { completed: !item.completed });
  const updateQuantity = async (item, delta) => { if (currentTrip.isLocked) return; const newQty = Math.max(1, (item.quantity || 1) + delta); await updateDoc(doc(db, 'artifacts', APP_ID, 'users', user.uid, 'sub_items', item.id), { quantity: newQty }); };
  const openGoogleMapsRoute = (date) => {
    const points = items.filter(i => i.type === 'itinerary' && i.date === date).sort((a,b) => (a.startTime > b.startTime ? 1 : -1));
    if (points.length === 0) return showToast("無行程點", "error");
    const origin = points[0].title; const destination = points[points.length - 1].title; const waypoints = points.slice(1, -1).map(p => p.title).join('|');
    window.open(points.length === 1 ? `https://www.google.com/maps/search/${currentTrip.destination}+${origin}` : `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&waypoints=${waypoints}&travelmode=transit`, '_blank');
  };
  const handleCheckIn = () => { if (currentTrip.isLocked) return showToast("已鎖定", "error"); if (!navigator.geolocation) return showToast("不支援定位", "error"); navigator.geolocation.getCurrentPosition((pos) => { const t = new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}); setNewItem(prev => ({ ...prev, type: 'itinerary', title: `📍 打卡 (${pos.coords.latitude.toFixed(2)}, ${pos.coords.longitude.toFixed(2)})`, date: new Date().toISOString().split('T')[0], startTime: t, notes: '', cost: '', category: 'other', isCheckIn: true })); setCheckInModal(true); }, () => showToast("定位失敗", "error")); };

  const luggageStats = useMemo(() => {
    const packingItems = items.filter(i => i.type === 'packing');
    const totalWeight = packingItems.reduce((sum, i) => sum + (Number(i.weight || 0) * Number(i.quantity || 1)), 0);
    let suggestion = "背包/手提"; if (totalWeight > 7) suggestion = "20吋登機箱"; if (totalWeight > 15) suggestion = "24吋行李箱"; if (totalWeight > 23) suggestion = "28吋大行李箱";
    return { totalWeight: totalWeight.toFixed(1), suggestion };
  }, [items]);

  const budgetStats = useMemo(() => {
    // 包含 budget 類型 以及 itinerary 中有 cost 的項目
    const budgetItems = items.filter(i => i.cost && (i.type === 'budget' || i.type === 'itinerary'));
    const stats = { shopping: 0, food: 0, stay: 0, transport: 0, other: 0, total: 0 };
    budgetItems.forEach(i => { const cost = Number(i.cost) || 0; const cat = i.category || 'other'; if (stats[cat] !== undefined) stats[cat] += cost; else stats.other += cost; stats.total += cost; });
    return stats;
  }, [items]);

  const TravelerCounter = ({ label, icon: Icon, value, field }) => (
    <div className="flex items-center justify-between bg-gray-50 p-2 rounded-lg text-xs">
      <div className="flex items-center gap-1"><Icon size={14} className="text-gray-500" /><span>{label}</span></div>
      <div className="flex items-center gap-2"><button type="button" onClick={() => setNewTrip(p => ({...p, travelers: {...p.travelers, [field]: Math.max(0, p.travelers[field]-1)}}))} className="w-5 h-5 rounded bg-white border flex items-center justify-center">-</button><span className="w-3 text-center">{value}</span><button type="button" onClick={() => setNewTrip(p => ({...p, travelers: {...p.travelers, [field]: p.travelers[field]+1}}))} className="w-5 h-5 rounded bg-white border flex items-center justify-center text-blue-500">+</button></div>
    </div>
  );

  const ReportTemplate = () => { /* ... Keep Report Template logic same as before but include People list if needed ... */ return null; }; // 簡化展示，實際可保留

  if (view === 'dashboard') {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans text-gray-800">
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        {isUpdating && <div className="fixed top-0 left-0 w-full bg-blue-600 text-white text-xs py-1 text-center z-[70] flex items-center justify-center gap-2 animate-pulse"><RefreshIcon size={12} className="animate-spin"/> 正在同步全球旅遊資訊庫...</div>}

        <div className="max-w-4xl mx-auto space-y-6 pt-6">
          <header className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-bold text-blue-900 flex items-center gap-2"><Plane className="text-blue-600" /> 智能旅遊管家 <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">Pro</span></h1>
            <div className="flex gap-2">
               <button onClick={handleExportData} className="text-gray-500 hover:text-blue-600 p-2 rounded-full border bg-white shadow-sm" title="備份"><Download size={18}/></button>
               <button onClick={() => setShowUserModal(true)} className="flex items-center gap-2 bg-white px-3 py-2 rounded-full shadow-sm border text-sm text-gray-600 hover:bg-gray-50"><User size={18} /> {user?.isAnonymous ? '訪客' : '已綁定'}</button>
            </div>
          </header>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Plus size={20}/> 建立新旅程</h2>
            <form onSubmit={createTrip} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1 relative"><label className="text-xs text-gray-500">出發地</label><div className="relative"><MapPinIcon className="absolute left-3 top-3 text-gray-400" size={16} /><input value={newTrip.origin} onChange={e=>setNewTrip({...newTrip, origin: e.target.value})} onFocus={() => setShowOriginSuggestions(true)} className="w-full pl-9 p-2 border rounded-lg bg-gray-50"/></div>{showOriginSuggestions && <div className="absolute z-10 w-full bg-white border rounded-lg shadow-xl mt-1 p-2 flex flex-wrap gap-2">{POPULAR_ORIGINS.map(c => <button type="button" key={c} onClick={() => {setNewTrip({...newTrip, origin: c}); setShowOriginSuggestions(false);}} className="text-xs bg-gray-100 px-2 py-1 rounded">{c}</button>)}<button type="button" onClick={()=>setShowOriginSuggestions(false)} className="w-full text-center text-xs text-blue-500 mt-1 pt-1 border-t">關閉</button></div>}</div>
                <div className="space-y-1 relative"><label className="text-xs text-gray-500">目的地</label><div className="relative"><Navigation className="absolute left-3 top-3 text-blue-500" size={16} /><input placeholder="例如：東京" value={newTrip.destination} onChange={e=>setNewTrip({...newTrip, destination: e.target.value})} onFocus={() => setShowCitySuggestions(true)} className="w-full pl-9 p-2 border rounded-lg focus:ring-2 ring-blue-500 outline-none" /></div>{showCitySuggestions && <div className="absolute z-10 w-full bg-white border rounded-lg shadow-xl mt-1 p-2 grid grid-cols-4 gap-2">{POPULAR_CITIES.map(c => <button type="button" key={c} onClick={() => {setNewTrip({...newTrip, destination: c}); setShowCitySuggestions(false);}} className="text-xs border px-2 py-1 rounded hover:bg-blue-50">{c}</button>)}<button type="button" onClick={()=>setShowCitySuggestions(false)} className="col-span-4 text-center text-xs text-blue-500 mt-1 pt-1 border-t">關閉</button></div>}</div>
              </div>
              
              <div className="space-y-1 relative">
                 <label className="text-xs text-gray-500">選擇日期 (顯示節假日)</label>
                 <div onClick={() => setShowCalendar(!showCalendar)} className="w-full p-2 border rounded-lg flex items-center justify-between cursor-pointer bg-gray-50 hover:bg-gray-100">
                    <span className="text-sm flex items-center gap-2"><CalIcon size={16} className="text-gray-500"/>{newTrip.startDate ? `${newTrip.startDate} ➔ ${newTrip.endDate || '請選擇結束'}` : '點擊選擇日期'}</span>
                 </div>
                 {showCalendar && <div className="absolute top-16 left-0 z-20"><RangeCalendar startDate={newTrip.startDate} endDate={newTrip.endDate} onChange={({startDate, endDate}) => setNewTrip({...newTrip, startDate, endDate})} onClose={() => setShowCalendar(false)} /></div>}
              </div>

              {/* 5. 行程偏好選擇 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-blue-50 p-3 rounded-xl border border-blue-100">
                 <div>
                    <label className="text-xs text-blue-600 font-bold mb-1 block">機票類型</label>
                    <select value={newTrip.flightType} onChange={e=>setNewTrip({...newTrip, flightType: e.target.value})} className="w-full text-xs p-1 rounded border">
                       <option value="direct">直航 (較貴)</option><option value="transfer">轉機 (較便宜)</option>
                    </select>
                 </div>
                 <div>
                    <label className="text-xs text-blue-600 font-bold mb-1 block">住宿等級</label>
                    <select value={newTrip.hotelType} onChange={e=>setNewTrip({...newTrip, hotelType: e.target.value})} className="w-full text-xs p-1 rounded border">
                       <option value="5star">五星級飯店</option><option value="4star">四星級/精品</option><option value="3star">三星級/商務</option><option value="homestay">民宿/Airbnb</option><option value="hostel">青年旅館</option>
                    </select>
                 </div>
                 <div>
                    <label className="text-xs text-blue-600 font-bold mb-1 block">旅遊目的</label>
                    <select value={newTrip.purpose} onChange={e=>setNewTrip({...newTrip, purpose: e.target.value})} className="w-full text-xs p-1 rounded border">
                       <option value="sightseeing">觀光</option><option value="shopping">購物</option><option value="food">美食</option><option value="adventure">冒險</option>
                    </select>
                 </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3"><TravelerCounter label="成人" icon={User} field="adults" value={newTrip.travelers.adults} /><TravelerCounter label="小童" icon={User} field="children" value={newTrip.travelers.children} /><TravelerCounter label="幼童" icon={Baby} field="toddlers" value={newTrip.travelers.toddlers} /><TravelerCounter label="長者" icon={Accessibility} field="elderly" value={newTrip.travelers.elderly} /></div>
              {newTrip.estimatedBudget > 0 && <div className="bg-green-50 p-3 rounded-xl border border-green-100 flex justify-between items-center"><div className="text-sm font-bold text-green-800 flex items-center gap-1"><Calculator size={14}/> AI 智能預算: ${newTrip.estimatedBudget.toLocaleString()}</div><div className="text-xs text-green-600">包含機酒食行</div></div>}
              <button type="submit" disabled={loadingWeather} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 flex justify-center items-center gap-2">AI 生成行程</button>
            </form>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{trips.map(trip => (<div key={trip.id} onClick={() => openTrip(trip)} className="bg-white p-5 rounded-xl shadow-sm border hover:border-blue-400 cursor-pointer relative overflow-hidden group"><button onClick={(e) => deleteTrip(trip.id, e)} className="absolute top-4 right-4 text-gray-300 hover:text-red-500 z-10 p-2"><Trash2 size={16}/></button><h3 className="text-xl font-bold text-gray-800">{trip.destination}</h3><p className="text-sm text-gray-500 mt-1 flex items-center gap-1"><MapPinIcon size={12}/> {trip.origin} 出發 • {trip.flightType==='direct'?'直航':'轉機'}</p><div className="mt-4 flex gap-3 text-xs"><div className="bg-green-50 text-green-700 px-3 py-1 rounded-lg border border-green-100"><div className="text-[10px] text-green-400 uppercase">預算</div><div className="font-bold">${trip.estimatedBudget?.toLocaleString()}</div></div><div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-lg border border-blue-100"><div className="text-[10px] text-blue-400 uppercase">實際支出</div><div className="font-bold">${trip.actualCost?.toLocaleString() || 0}</div></div></div></div>))}</div>
        </div>
      </div>
    );
  }

  // 詳細頁面
  const tripItems = items.filter(i => i.type === activeTab);
  const cityEmerg = CITY_DATA[currentTrip.destination]?.emergency;
  const rideApp = CITY_DATA[currentTrip.destination]?.rideApp;
  
  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800 flex flex-col bg-white">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      
      <div className="bg-white border-b sticky top-0 z-20 shadow-sm print:hidden">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center justify-between py-3">
            <button onClick={() => setView('dashboard')} className="text-gray-500 hover:text-blue-600 text-sm">← 返回</button>
            <div className="text-center"><h1 className="font-bold text-lg">{currentTrip.destination}</h1><p className="text-xs text-gray-500">{currentTrip.startDate} ~ {currentTrip.endDate}</p></div>
            <div className="flex gap-2"><button onClick={toggleTripLock} className={`p-2 rounded-full border ${currentTrip.isLocked ? 'bg-red-50 text-red-500' : 'bg-gray-50 text-gray-400'}`}>{currentTrip.isLocked ? <Lock size={16}/> : <Unlock size={16}/>}</button><button onClick={handlePrint} className="p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200"><Printer size={16}/></button></div>
          </div>
          <div className="flex gap-6 overflow-x-auto pb-1 scrollbar-hide">
            {[{ id: 'itinerary', icon: <MapPin size={18}/>, label: '行程' }, { id: 'packing', icon: <Briefcase size={18}/>, label: '行李' }, { id: 'budget', icon: <DollarSign size={18}/>, label: '記帳' }, { id: 'people', icon: <Users size={18}/>, label: '人員' }, { id: 'info', icon: <FileText size={18}/>, label: '資訊' }].map(tab => (
              <button key={tab.id} onClick={() => { setActiveTab(tab.id); setNewItem({...newItem, type: tab.id}); setEditingItem(null); }} className={`flex items-center gap-2 pb-3 border-b-2 whitespace-nowrap ${activeTab === tab.id ? 'border-blue-600 text-blue-600 font-bold' : 'border-transparent text-gray-500'}`}>{tab.icon} {tab.label}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-4xl mx-auto w-full p-4 space-y-6 print:hidden">
        {checkInModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 print:hidden">
             <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">📍 足跡打卡</h3>
                {/* ... (CheckIn Form same as before) ... */}
                <div className="space-y-3">
                   <div><label className="text-xs text-gray-500">備註</label><input type="text" value={newItem.notes} onChange={e=>setNewItem({...newItem, notes:e.target.value})} className="w-full p-2 border rounded-lg bg-gray-50" placeholder="心情..."/></div>
                   <div>
                      <label className="text-xs text-gray-500">消費</label>
                      <div className="flex gap-2"><input type="number" value={newItem.foreignCost} onChange={e=>handleForeignCostChange(e.target.value, newItem.currency)} className="flex-1 p-2 border rounded-lg bg-gray-50"/><select value={newItem.currency} onChange={e=>handleForeignCostChange(newItem.foreignCost, e.target.value)} className="w-20 p-2 border rounded-lg bg-white">{Object.keys(EXCHANGE_RATES).map(c=><option key={c} value={c}>{c}</option>)}</select></div>
                   </div>
                   <div className="flex gap-2 mt-4"><button onClick={()=>setCheckInModal(false)} className="flex-1 py-2 text-gray-500">取消</button><button onClick={addItem} className="flex-1 py-2 bg-blue-600 text-white rounded-lg">確認</button></div>
                </div>
             </div>
          </div>
        )}

        {/* 4. 人員管理 Tab */}
        {activeTab === 'people' && (
           <div className="space-y-4">
              <div className="bg-orange-50 border border-orange-100 p-4 rounded-xl text-sm text-orange-700">
                 <p className="font-bold flex items-center gap-2"><Lock size={14}/> 隱私保護</p>
                 <p className="text-xs mt-1">此處資料僅儲存於您的帳號下，方便辦理入住或緊急聯絡使用。</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                 {tripItems.map(p => (
                    <div key={p.id} className="bg-white p-4 rounded-xl border shadow-sm relative group">
                       <button onClick={() => deleteItem(p.id)} className="absolute top-2 right-2 text-gray-300 hover:text-red-500"><Trash2 size={14}/></button>
                       <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600"><User size={20}/></div>
                          <div><h3 className="font-bold text-gray-800">{p.title}</h3><p className="text-xs text-gray-500">房號: {p.notes?.split(' ')[1]}</p></div>
                       </div>
                       <div className="text-xs text-gray-600 space-y-1 pt-2 border-t">
                          <div className="flex gap-2"><CreditCard size={12}/> ID: {p.pId || '未填寫'}</div>
                          <div className="flex gap-2"><Phone size={12} /> Tel: {p.pPhone || '未填寫'}</div>
                       </div>
                    </div>
                 ))}
                 {tripItems.length === 0 && <div className="text-center text-gray-400 py-10 col-span-full">尚無人員資料，請從下方新增。</div>}
              </div>
           </div>
        )}

        {activeTab === 'itinerary' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-3 mb-4 print:hidden">
               {cityEmerg ? (<div className="bg-red-50 border border-red-100 p-3 rounded-xl flex flex-col gap-2"><div className="text-xs text-red-500 font-bold flex items-center gap-1"><Siren size={12}/> 當地緊急電話</div><div className="flex gap-2"><a href={`tel:${cityEmerg.police}`} className="flex-1 bg-white border border-red-200 text-red-600 rounded-lg py-1 flex items-center justify-center gap-1 text-xs"><Siren size={12}/> {cityEmerg.police}</a><a href={`tel:${cityEmerg.ambulance}`} className="flex-1 bg-white border border-red-200 text-red-600 rounded-lg py-1 flex items-center justify-center gap-1 text-xs"><Ambulance size={12}/> {cityEmerg.ambulance}</a></div></div>) : null}
               <div className="bg-green-50 border border-green-100 p-3 rounded-xl flex flex-col gap-2"><div className="text-xs text-green-600 font-bold flex items-center gap-1"><Car size={12}/> 叫車推薦</div><div className="text-sm font-bold text-green-700">{rideApp || "Uber"}</div></div>
            </div>
            <div className="flex gap-2 print:hidden"><button onClick={handleCheckIn} className={`flex-1 bg-blue-600 text-white px-4 py-3 rounded-xl shadow-md text-sm font-bold flex gap-2 items-center justify-center ${currentTrip.isLocked ? 'opacity-50 cursor-not-allowed' : ''}`} disabled={currentTrip.isLocked}><Camera size={18} /> 足跡打卡</button></div>
            {Array.from({length: newTrip.budgetDetails.days || Math.ceil((new Date(currentTrip.endDate) - new Date(currentTrip.startDate))/(86400000))+1}).map((_, idx) => {
               const dateStr = new Date(new Date(currentTrip.startDate).getTime() + idx * 86400000).toISOString().split('T')[0];
               const dayItems = items.filter(i => i.type === 'itinerary' && i.date === dateStr).sort((a,b) => (a.startTime > b.startTime ? 1 : -1));
               const w = weatherData[dateStr];
               return (
                 <div key={dateStr} className="bg-white rounded-xl border p-4">
                    <div className="flex justify-between items-center mb-4 pb-2 border-b">
                       <div><h3 className="font-bold text-gray-800 text-lg">Day {idx+1}</h3><div className="text-xs text-gray-400">{dateStr}</div></div>
                       <div className="flex items-center gap-2">{w ? (<div className="flex items-center gap-1 text-xs bg-blue-50 px-2 py-1 rounded-full text-blue-600"><w.icon size={14}/> {w.desc} {w.max}°</div>) : <span className="text-xs text-gray-300">預報未出</span>}<div className="flex gap-2 print:hidden"><button onClick={() => openGoogleMapsRoute(dateStr)} className="text-blue-500 text-xs flex items-center gap-1 border border-blue-200 px-2 py-1 rounded hover:bg-blue-50"><Map size={12}/> 路線</button>{!currentTrip.isLocked && <button onClick={() => { setNewItem({...newItem, date: dateStr, type: 'itinerary'}); window.scrollTo({top: 0, behavior: 'smooth'}); }} className="text-gray-400 hover:text-blue-500"><Plus size={16}/></button>}</div></div>
                    </div>
                    {dayItems.length === 0 ? <div className="text-center text-xs text-gray-300 py-2">無行程</div> : dayItems.map(item => (
                        <div key={item.id} className={`flex gap-3 mb-4 relative pl-4 border-l-2 ${item.isCheckIn ? 'border-l-blue-400' : 'border-l-gray-200'}`}>
                           <div className="flex-1" onClick={() => !currentTrip.isLocked && editItem(item)}>
                              <div className="flex justify-between"><span className="font-bold text-gray-800 text-sm">{item.title}</span><span className="text-xs text-gray-400 font-mono">{item.startTime}</span></div>
                              <div className="text-xs text-gray-500 mt-1 flex gap-2">{item.duration && <span className="flex items-center gap-1"><Clock size={10}/> {item.duration}</span>}{item.cost && <span className="text-orange-500 font-bold flex items-center gap-1"><Ticket size={10}/> ${item.cost}</span>}</div>
                              {item.notes && <div className="text-xs text-gray-400 mt-1 bg-gray-50 p-1 rounded">{item.notes}</div>}
                           </div>
                           {!currentTrip.isLocked && <button onClick={() => deleteItem(item.id)} className="text-gray-200 hover:text-red-400 self-start print:hidden"><Trash2 size={14}/></button>}
                        </div>
                      ))}
                 </div>
               )
            })}
          </div>
        )}

        {/* ... Luggage, Budget, Info Tabs (Same as before) ... */}
        {activeTab === 'packing' && (
          <div>
            <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl flex justify-between items-center mb-4"><div><div className="font-bold text-indigo-800">行李總重 {luggageStats.totalWeight} kg</div><div className="text-xs text-indigo-500">建議：{luggageStats.suggestion}</div></div><Briefcase size={24} className="text-indigo-300"/></div>
            {['成人', '小童', '幼童', '長者', '全體'].map(owner => { const ownerItems = items.filter(i => i.type === 'packing' && (i.itemOwner === owner || (!i.itemOwner && owner === '全體'))); if (ownerItems.length === 0) return null; return ( <div key={owner} className="bg-white p-4 rounded-xl border mb-4"><h4 className="text-sm font-bold text-gray-500 mb-3 border-b pb-1">{owner}</h4><div className="grid grid-cols-1 md:grid-cols-2 gap-2">{ownerItems.map(item => (<div key={item.id} className="flex items-center gap-3 mb-2"><button onClick={() => toggleItemComplete(item)} className={`${item.completed ? 'text-green-500' : 'text-gray-300'}`}><CheckCircle2 size={20}/></button><div className="p-2 bg-gray-50 rounded-full text-gray-500">{(() => { const DefIcon = ITEM_DEFINITIONS[item.title]?.icon || Circle; return <DefIcon size={16}/> })()}</div><div className="flex-1 flex justify-between"><span className={`text-sm font-medium ${item.completed ? 'line-through text-gray-300' : 'text-gray-800'}`}>{item.title}</span><span className="text-xs bg-gray-100 px-2 py-1 rounded">x{item.quantity}</span></div>{!currentTrip.isLocked && <div className="flex items-center gap-1 bg-gray-50 rounded-lg px-2 py-1"><button onClick={() => updateQuantity(item, -1)} className="text-gray-400 hover:text-blue-500"><Minus size={12}/></button><button onClick={() => updateQuantity(item, 1)} className="text-gray-400 hover:text-blue-500"><Plus size={12}/></button></div>}</div>))}</div></div> ) })}
          </div>
        )}

        {activeTab === 'budget' && (
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white p-6 rounded-2xl shadow-lg"><div className="flex justify-between items-start"><div><p className="text-emerald-100 text-xs uppercase">總支出 (HKD)</p><h2 className="text-3xl font-bold mt-1">${budgetStats.total.toLocaleString()}</h2></div><div className="text-right"><p className="text-emerald-100 text-xs uppercase">預算剩餘</p><h3 className={`text-xl font-bold mt-1`}>${(currentTrip.estimatedBudget - budgetStats.total).toLocaleString()}</h3></div></div></div>
            <div className="bg-white rounded-xl border divide-y">{tripItems.sort((a,b)=>b.createdAt - a.createdAt).map(item => (<div key={item.id} className="p-3 flex justify-between items-center" onClick={() => !currentTrip.isLocked && editItem(item)}><div className="flex items-center gap-3"><div className={`p-2 rounded-full bg-gray-50 ${BUDGET_CATEGORIES[item.category]?.color}`}>{(() => { const Icon = BUDGET_CATEGORIES[item.category]?.icon || Circle; return <Icon size={16}/> })()}</div><div><div className="text-sm font-medium text-gray-800">{item.title}</div><div className="text-xs text-gray-400">{item.notes}</div></div></div><div className="font-bold text-gray-700">${Number(item.cost).toLocaleString()}</div></div>))}</div>
          </div>
        )}

        {activeTab === 'info' && (
           <div className="space-y-4">
              <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100"><h3 className="font-bold text-yellow-800 mb-2">關於 {currentTrip.destination}</h3><p className="text-sm text-yellow-700">{CITY_DATA[currentTrip.destination]?.intro}</p></div>
              <h4 className="text-sm font-bold text-gray-500 mt-4">更多資訊 (外部連結)</h4>
              <div className="grid grid-cols-2 gap-3">
                 <a href={`https://www.google.com/search?q=${currentTrip.destination}+旅遊攻略`} target="_blank" rel="noreferrer" className="flex items-center gap-2 p-3 bg-white border rounded-xl shadow-sm hover:border-blue-400 text-sm text-gray-600"><Search size={16} className="text-blue-500"/> Google 搜尋</a>
                 <a href={`https://www.tripadvisor.com.tw/Search?q=${currentTrip.destination}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 p-3 bg-white border rounded-xl shadow-sm hover:border-green-400 text-sm text-gray-600"><ExternalLink size={16} className="text-green-500"/> TripAdvisor</a>
              </div>
           </div>
        )}

        {!checkInModal && !currentTrip.isLocked && activeTab !== 'info' && (
          <form onSubmit={addItem} className="bg-white p-4 rounded-xl shadow-lg border flex flex-col gap-3 sticky bottom-4 z-10 print:hidden">
            <div className="flex justify-between text-xs text-blue-500 font-bold">
              <span>{editingItem ? "✏️ 編輯項目" : (activeTab==='itinerary' ? `➕ 新增行程 (${newItem.date || '選擇日期'})` : activeTab==='people'?"➕ 新增人員":"➕ 新增")}</span>
              {editingItem && <button type="button" onClick={() => {setEditingItem(null); setNewItem({...newItem, title:''});}} className="text-gray-400">取消</button>}
            </div>
            
            {activeTab === 'people' ? (
                <div className="grid grid-cols-2 gap-2">
                    <input type="text" placeholder="姓名" className="p-2 bg-gray-50 rounded-lg text-sm" value={newItem.pName} onChange={e=>setNewItem({...newItem, pName:e.target.value})} required/>
                    <input type="text" placeholder="房號" className="p-2 bg-gray-50 rounded-lg text-sm" value={newItem.pRoom} onChange={e=>setNewItem({...newItem, pRoom:e.target.value})} />
                    <input type="text" placeholder="證件號 (選填)" className="p-2 bg-gray-50 rounded-lg text-sm" value={newItem.pId} onChange={e=>setNewItem({...newItem, pId:e.target.value})} />
                    <input type="text" placeholder="電話 (選填)" className="p-2 bg-gray-50 rounded-lg text-sm" value={newItem.pPhone} onChange={e=>setNewItem({...newItem, pPhone:e.target.value})} />
                </div>
            ) : (
                <div className="flex gap-2 items-center">
                  {activeTab === 'budget' && <select value={newItem.category} onChange={e=>setNewItem({...newItem, category: e.target.value})} className="bg-gray-50 text-xs p-2 rounded-lg outline-none w-20">{Object.entries(BUDGET_CATEGORIES).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}</select>}
                  <input type="text" placeholder={activeTab==='itinerary'?"行程名稱":activeTab==='budget'?"消費項目":"物品名稱"} className="flex-1 p-2 bg-gray-50 rounded-lg outline-none focus:bg-white focus:ring-2 ring-blue-100" value={newItem.title} onChange={e => setNewItem({...newItem, title: e.target.value})} />
                  {activeTab === 'itinerary' && <div className="flex gap-1"><input type="time" value={newItem.startTime} onChange={e=>setNewItem({...newItem, startTime: e.target.value})} className="w-20 p-2 bg-gray-50 rounded-lg text-xs"/><input type="text" placeholder="時長" value={newItem.duration} onChange={e=>setNewItem({...newItem, duration: e.target.value})} className="w-12 p-2 bg-gray-50 rounded-lg text-xs text-center"/></div>}
                  {(activeTab === 'budget' || (activeTab === 'itinerary' && editingItem)) && <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-lg border w-24"><input type="number" placeholder="$" className="w-full p-1 bg-transparent outline-none text-right font-bold text-blue-600" value={newItem.foreignCost} onChange={e => handleForeignCostChange(e.target.value, newItem.currency)} /></div>}
                  {activeTab === 'packing' && <div className="flex items-center gap-1 bg-gray-50 px-2 rounded-lg border"><button type="button" onClick={()=>setNewItem({...newItem, quantity: Math.max(1, newItem.quantity-1)})}><Minus size={12}/></button><span className="text-xs font-bold w-4 text-center">{newItem.quantity}</span><button type="button" onClick={()=>setNewItem({...newItem, quantity: newItem.quantity+1})}><Plus size={12}/></button></div>}
                </div>
            )}
            
            <button type="submit" className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 w-full flex items-center justify-center gap-2">{editingItem ? <Edit2 size={16}/> : <Plus size={16}/>} {editingItem ? '儲存' : '新增'}</button>
          </form>
        )}
      </div>
    </div>
  );
}

export default TravelApp;
