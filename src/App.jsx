import { useState, useEffect, useMemo } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously, onAuthStateChanged, GoogleAuthProvider, linkWithPopup, signInWithPopup } from "firebase/auth";
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, deleteDoc, doc, updateDoc, where, getDocs } from "firebase/firestore";
import { 
  Trash2, Plus, Minus, MapPin, Calendar as CalIcon, CheckCircle2, Circle, 
  DollarSign, FileText, Sun, CloudRain, Snowflake, Cloud, Droplets, 
  Luggage, Plane, Baby, Accessibility, User, Navigation,
  MapPin as MapPinIcon, Camera, ShoppingBag,
  Calculator, RefreshCw, Edit2, Map, Briefcase, Coffee, Home, Bus, Shirt,
  ExternalLink, Clock, Search, Utensils, Siren, Ambulance, Car,
  Printer, Lock, Unlock, LogIn, Download, Eye, X, Heart, ChevronLeft, ChevronRight,
  AlertCircle, Check, RefreshCw as RefreshIcon, Users, CreditCard, Ticket, Phone, ArrowRight, Star
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

// --- 3. 核心資料庫與 AI 參數 (確保定義在最上方) ---

const CITY_DATA = {
  "東京": { lat: 35.6762, lon: 139.6503, currency: "JPY", region: "JP", intro: "傳統與未來交織的城市。", emergency: { police: "110", ambulance: "119" }, rideApp: "Uber / GO" },
  "大阪": { lat: 34.6937, lon: 135.5023, currency: "JPY", region: "JP", intro: "美食之都。", emergency: { police: "110", ambulance: "119" }, rideApp: "Uber / GO" },
  "京都": { lat: 35.0116, lon: 135.7681, currency: "JPY", region: "JP", intro: "千年古都。", emergency: { police: "110", ambulance: "119" }, rideApp: "MK Taxi" },
  "雪梨": { lat: -33.8688, lon: 151.2093, currency: "AUD", region: "AU", intro: "澳洲最大城市。", emergency: { police: "000", ambulance: "000" }, rideApp: "Uber" },
  "墨爾本": { lat: -37.8136, lon: 144.9631, currency: "AUD", region: "AU", intro: "文化與咖啡之都。", emergency: { police: "000", ambulance: "000" }, rideApp: "Uber" },
  "台北": { lat: 25.0330, lon: 121.5654, currency: "TWD", region: "TW", intro: "美食天堂。", emergency: { police: "110", ambulance: "119" }, rideApp: "Uber" },
  "曼谷": { lat: 13.7563, lon: 100.5018, currency: "THB", region: "TH", intro: "不夜城。", emergency: { police: "191", ambulance: "1669" }, rideApp: "Grab" },
  "倫敦": { lat: 51.5074, lon: -0.1278, currency: "GBP", region: "UK", intro: "歷史名城。", emergency: { police: "999", ambulance: "999" }, rideApp: "Uber" },
  "巴黎": { lat: 48.8566, lon: 2.3522, currency: "EUR", region: "EU", intro: "浪漫之都。", emergency: { police: "17", ambulance: "15" }, rideApp: "Uber" },
  "香港": { lat: 22.3193, lon: 114.1694, currency: "HKD", region: "HK", intro: "東方之珠。", emergency: { police: "999", ambulance: "999" }, rideApp: "Uber" },
};

const POPULAR_CITIES = Object.keys(CITY_DATA);
const POPULAR_ORIGINS = ["香港", "台北", "高雄", "澳門", "東京", "倫敦", "紐約", "雪梨", "墨爾本"];

const EXCHANGE_RATES = { "HKD": 1, "JPY": 0.052, "KRW": 0.0058, "TWD": 0.25, "THB": 0.22, "SGD": 5.8, "GBP": 9.9, "EUR": 8.5, "USD": 7.8, "CNY": 1.1, "AUD": 5.1 };

// AI 預算參數
const PURPOSE_MULTIPLIERS = {
  "sightseeing": { flight: 1, hotel: 1, food: 1, transport: 1.2, shopping: 2000 }, 
  "shopping": { flight: 1, hotel: 1, food: 0.8, transport: 1, shopping: 8000 }, 
  "food": { flight: 1, hotel: 1, food: 2.0, transport: 1, shopping: 2000 }, 
  "adventure": { flight: 1, hotel: 1.2, food: 1, transport: 1.5, shopping: 1000 } 
};

const FLIGHT_COSTS = {
  "JP": { direct: 5000, transfer: 3500 },
  "UK": { direct: 10000, transfer: 7000 },
  "AU": { direct: 8000, transfer: 6000 },
  "default": { direct: 6000, transfer: 4000 }
};

const HOTEL_COSTS = {
  "5star": 3000, "4star": 1500, "3star": 800, "homestay": 600, "hostel": 300
};

const BASE_COSTS = { "JP": { food: 400, transport: 150 }, "AU": { food: 500, transport: 150 }, "default": { food: 400, transport: 150 } };

// 行李與分類
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
  shopping: { label: "衣/購", icon: ShoppingBag, color: "text-pink-500", bg: "bg-pink-50" },
  food: { label: "食", icon: Utensils, color: "text-orange-500", bg: "bg-orange-50" },
  stay: { label: "住", icon: Home, color: "text-indigo-500", bg: "bg-indigo-50" },
  transport: { label: "行", icon: Bus, color: "text-blue-500", bg: "bg-blue-50" },
  other: { label: "其他", icon: FileText, color: "text-gray-500", bg: "bg-gray-50" }
};

const CATEGORY_LABELS = {
  shopping: { label: "衣 (購物)", icon: ShoppingBag, color: "text-pink-500", bg: "bg-pink-50" },
  food: { label: "食 (美食)", icon: Utensils, color: "text-orange-500", bg: "bg-orange-50" },
  stay: { label: "住 (住宿)", icon: Home, color: "text-indigo-500", bg: "bg-indigo-50" },
  transport: { label: "行 (景點/交通)", icon: Map, color: "text-blue-500", bg: "bg-blue-50" },
  other: { label: "其他", icon: FileText, color: "text-gray-500", bg: "bg-gray-50" }
};

// 景點資料庫 (精簡範例，可持續擴充)
const POI_DB = {
  "東京": [
    { name: "東京迪士尼", category: "transport", cost: 600, time: "全日", note: "夢幻王國", lat: 35.6329, lon: 139.8804, img: "https://images.unsplash.com/photo-1545582379-34e8ce6a3092?w=400&q=80", desc: "亞洲第一座迪士尼樂園。" },
    { name: "淺草寺", category: "transport", cost: 0, time: "2h", note: "雷門打卡", lat: 35.7147, lon: 139.7967, img: "https://images.unsplash.com/photo-1596395914619-338d9b52c007?w=400&q=80", desc: "東京最古老的寺廟。" }
  ],
  "大阪": [
    { name: "環球影城", category: "transport", cost: 650, time: "全日", note: "任天堂世界", lat: 34.6654, lon: 135.4323, img: "https://images.unsplash.com/photo-1623941000802-38fadd7f7b3b?w=400&q=80", desc: "世界級主題樂園。" },
    { name: "道頓堀", category: "food", cost: 200, time: "3h", note: "美食吃到飽", lat: 34.6687, lon: 135.5013, img: "https://images.unsplash.com/photo-1590559899731-a382839e5549?w=400&q=80", desc: "大阪美食心臟。" }
  ],
  "雪梨": [
    { name: "雪梨歌劇院", category: "transport", cost: 200, time: "2h", note: "世界遺產", lat: -33.8568, lon: 151.2153, img: "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=400&q=80", desc: "經典地標。" }
  ],
  "default": [
    { name: "市中心地標", category: "transport", cost: 0, time: "1h", note: "打卡點", lat: 0, lon: 0, img: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=400&q=80", desc: "城市中心。" }
  ]
};

// --- Utils ---
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; const dLat = (lat2 - lat1) * Math.PI / 180; const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
};

const getLunarInfo = (date) => {
  const m = date.getMonth() + 1; const d = date.getDate();
  if (m === 1 && d === 1) return "元旦"; if (m === 12 && d === 25) return "聖誕";
  const baseDate = new Date(2024, 1, 10); const diffDays = Math.floor((date - baseDate) / 86400000); const lunarDayIndex = (diffDays % 29 + 29) % 29 + 1;
  if (lunarDayIndex === 1) return "初一"; if (lunarDayIndex === 15) return "十五";
  return null;
};

// --- UI Components ---

const Toast = ({ message, type, onClose }) => {
  useEffect(() => { const timer = setTimeout(onClose, 3000); return () => clearTimeout(timer); }, [onClose]);
  return <div className={`fixed bottom-8 left-1/2 transform -translate-x-1/2 ${type === 'error' ? 'bg-red-500' : 'bg-green-600'} text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 z-[60] animate-bounce-in`}><CheckCircle2 size={16} /><span className="text-sm font-bold">{message}</span></div>;
};

const RangeCalendar = ({ startDate, endDate, onChange, onClose }) => {
  const [currentMonth, setCurrentMonth] = useState(startDate ? new Date(startDate) : new Date());
  const daysInMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  const formatDate = (y, m, d) => `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  
  const handleDateClick = (day) => {
    const dateStr = formatDate(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    if (!startDate || (startDate && endDate)) { onChange({ startDate: dateStr, endDate: '' }); } 
    else { if (dateStr < startDate) { onChange({ startDate: dateStr, endDate: startDate }); setTimeout(onClose, 300); } else { onChange({ startDate: startDate, endDate: dateStr }); setTimeout(onClose, 300); } }
  };
  return (
    <div className="bg-white rounded-xl border p-4 shadow-xl w-80 z-50">
      <div className="flex justify-between items-center mb-4">
        <button type="button" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))} className="p-1 hover:bg-gray-100 rounded"><ChevronLeft size={20}/></button>
        <span className="font-bold text-sm">{currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
        <button type="button" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))} className="p-1 hover:bg-gray-100 rounded"><ChevronRight size={20}/></button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs mb-2 text-gray-400 font-bold">{['日','一','二','三','四','五','六'].map(d => <div key={d} className={d==='日'||d==='六'?'text-red-400':''}>{d}</div>)}</div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: firstDayOfMonth(currentMonth) }).map((_, i) => <div key={`empty-${i}`} />)}
        {Array.from({ length: daysInMonth(currentMonth) }).map((_, i) => {
          const day = i + 1; const dateStr = formatDate(currentMonth.getFullYear(), currentMonth.getMonth(), day);
          const selected = dateStr === startDate || dateStr === endDate; const inRange = startDate && endDate && dateStr > startDate && dateStr < endDate;
          const holiday = getLunarInfo(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day));
          return <button key={day} type="button" onClick={() => handleDateClick(day)} className={`h-10 w-full rounded-lg text-xs flex flex-col items-center justify-center transition-all relative border border-transparent ${selected ? 'bg-blue-600 text-white font-bold shadow-md z-10' : ''} ${inRange ? 'bg-blue-100 text-blue-800 rounded-none' : ''} ${!selected && !inRange ? 'hover:bg-gray-100' : ''}`}><span>{day}</span>{holiday&&<span className={`text-[8px] scale-90 ${selected ? 'text-blue-200' : 'text-red-400'}`}>{holiday}</span>}</button>;
        })}
      </div>
      <div className="mt-3 text-center text-xs text-blue-600 font-medium border-t pt-2 cursor-pointer hover:text-blue-800" onClick={onClose}>完成 / 關閉</div>
    </div>
  );
};

// --- Logic Helpers ---

const generateSmartItinerary = (city, days, purpose, travelers) => {
  const hasKids = travelers.children > 0 || travelers.toddlers > 0;
  const citySpots = POI_DB[city] || POI_DB['default'];
  let itinerary = [];
  itinerary.push({ title: "抵達 & 飯店 Check-in", notes: "辦理入住，熟悉環境", cost: 0, category: "other", startTime: "14:00", duration: "2h" });

  for (let i = 1; i < days - 1; i++) {
    const spot1 = citySpots[i % citySpots.length];
    const spot2 = citySpots[(i + 1) % citySpots.length];
    let note1 = spot1.note;
    if (hasKids && (spot1.name.includes("樂園") || spot1.name.includes("動物園"))) note1 += " (親子推薦)";
    itinerary.push({ title: spot1.name, notes: note1, cost: spot1.cost, category: spot1.category, startTime: "10:00", duration: spot1.time });
    if (purpose === 'food') itinerary.push({ title: "人氣餐廳午餐", notes: "需提前訂位", cost: 200, category: "food", startTime: "13:00", duration: "1.5h" });
    itinerary.push({ title: spot2.name, notes: spot2.note, cost: spot2.cost, category: spot2.category, startTime: "15:00", duration: spot2.time });
  }
  itinerary.push({ title: "前往機場 & 免稅店", notes: "最後採買", cost: 0, category: "other", startTime: "09:00", duration: "3h" });
  return itinerary;
};

const fetchDailyWeather = async (lat, lon, startStr, endStr) => {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto&start_date=${startStr}&end_date=${endStr}`;
    const res = await fetch(url); const data = await res.json(); const weatherMap = {};
    if (data.daily) data.daily.time.forEach((date, i) => {
       const code = data.daily.weathercode[i]; let icon = Sun; let desc = "晴";
       if (code >= 95) { icon = CloudRain; desc = "雷雨"; } else if (code >= 51) { icon = Droplets; desc = "雨"; } else if (code >= 3) { icon = Cloud; desc = "陰"; }
       weatherMap[date] = { max: data.daily.temperature_2m_max[i], min: data.daily.temperature_2m_min[i], rain: data.daily.precipitation_probability_max[i], icon, desc };
    });
    return weatherMap;
  } catch (e) { return {}; }
};

// --- Main Component ---

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
  const [showCalendar, setShowCalendar] = useState(false);
  const [showSpotSelector, setShowSpotSelector] = useState(false); 
  const [checkInModal, setCheckInModal] = useState(false);

  const [newTrip, setNewTrip] = useState({ origin: '香港', destination: '', startDate: '', endDate: '', purpose: 'sightseeing', travelers: { adults: 1, children: 0, toddlers: 0, elderly: 0 }, flightType: 'direct', hotelType: '4star', estimatedBudget: 0, budgetDetails: {} });
  const [newItem, setNewItem] = useState({ type: 'itinerary', category: 'transport', title: '', cost: '', foreignCost: '', currency: 'HKD', date: '', notes: '', itemOwner: '成人', quantity: 1, weight: 0, startTime: '', duration: '', pName: '', pId: '', pPhone: '', pRoom: '' });
  const [editingItem, setEditingItem] = useState(null);
  const [activeTab, setActiveTab] = useState('itinerary');
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  const [showOriginSuggestions, setShowOriginSuggestions] = useState(false);
  const [loadingWeather, setLoadingWeather] = useState(false);

  useEffect(() => { const timer = setTimeout(() => setIsUpdating(false), 2000); return () => clearTimeout(timer); }, []);
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

  // AI Budget Calc
  const calculateEstimatedBudget = () => {
    if (!newTrip.startDate || !newTrip.endDate || newTrip.endDate < newTrip.startDate) return;
    const cityInfo = CITY_DATA[newTrip.destination];
    const region = cityInfo ? cityInfo.region : 'default';
    const baseCosts = BASE_COSTS[region] || BASE_COSTS['default'];
    const purposeMult = PURPOSE_MULTIPLIERS[newTrip.purpose] || PURPOSE_MULTIPLIERS['sightseeing'];
    const flightBase = (FLIGHT_COSTS[region] || FLIGHT_COSTS['default'])[newTrip.flightType];
    const hotelBase = HOTEL_COSTS[newTrip.hotelType];

    const days = Math.max(1, Math.ceil((new Date(newTrip.endDate) - new Date(newTrip.startDate)) / (1000 * 60 * 60 * 24)) + 1);
    if (isNaN(days)) return;

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
  useEffect(() => { if (newTrip.destination && newTrip.startDate && newTrip.endDate) calculateEstimatedBudget(); }, [newTrip.destination, newTrip.startDate, newTrip.endDate, newTrip.travelers, newTrip.purpose, newTrip.flightType, newTrip.hotelType]);

  // Actions
  const handleGoogleLink = async () => { try { if (user.isAnonymous) await linkWithPopup(user, googleProvider); else showToast("已登入", "success"); } catch (error) { if (error.code === 'auth/credential-already-in-use') { if(confirm("此帳號已有資料，是否切換？")) await signInWithPopup(auth, googleProvider); } } };
  const handleExportData = () => { const data = { user: user.uid, trips: trips, items: items, exportedAt: new Date().toISOString() }; const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `travel_backup.json`; a.click(); };
  const toggleTripLock = async () => { await updateDoc(doc(db, 'artifacts', APP_ID, 'users', user.uid, 'trips', currentTrip.id), { isLocked: !currentTrip.isLocked }); setCurrentTrip(prev => ({...prev, isLocked: !prev.isLocked})); showToast(currentTrip.isLocked ? "行程已解鎖" : "行程已鎖定", "success"); };
  const handlePrint = () => window.print();

  const createTrip = async (e) => {
    e.preventDefault(); if (!newTrip.startDate || !newTrip.endDate) return showToast("請選擇日期", "error");
    if (!newTrip.destination) return showToast("請輸入目的地", "error");
    try {
      setLoadingWeather(true);
      const docRef = await addDoc(collection(db, 'artifacts', APP_ID, 'users', user.uid, 'trips'), { ...newTrip, weather: 'sunny', currency: CITY_DATA[newTrip.destination]?.currency || 'HKD', actualCost: 0, isLocked: false, createdAt: serverTimestamp() });
      setLoadingWeather(false);
      const tripId = docRef.id; const batch = [];
      const addSubItem = (type, title, category, owner, qty = 1, defCost = '') => {
        const defs = ITEM_DEFINITIONS[title] || { weight: 0.5, volume: 5, icon: Briefcase };
        batch.push(addDoc(collection(db, 'artifacts', APP_ID, 'users', user.uid, 'sub_items'), { tripId, type, title, cost: defCost, category, itemOwner: owner, quantity: qty, weight: defs.weight, volume: defs.volume, completed: false, createdAt: serverTimestamp() }));
      };

      const days = newTrip.budgetDetails.days || 3; const isCold = newTrip.destination === '札幌' || newTrip.destination === '首爾'; 
      ["護照/簽證", "現金/信用卡"].forEach(t => addSubItem('packing', t, 'doc', '全體')); ["手機充電器", "萬用轉接頭"].forEach(t => addSubItem('packing', t, 'move', '全體', 1));
      if (newTrip.travelers.adults > 0) { addSubItem('packing', '換洗衣物', 'clothes', '成人', newTrip.travelers.adults * Math.min(days, 5)); addSubItem('packing', isCold ? '厚外套' : '薄外套', 'clothes', '成人', newTrip.travelers.adults); }
      if (newTrip.travelers.toddlers > 0) { addSubItem('packing', '尿布', 'daily', '幼童', newTrip.travelers.toddlers * days * 6); addSubItem('packing', '奶粉', 'food', '幼童', 1); addSubItem('packing', '推車', 'move', '幼童', 1); }

      const smartItinerary = generateSmartItinerary(newTrip.destination, days, newTrip.purpose, newTrip.travelers);
      smartItinerary.forEach((plan, idx) => { const dateStr = new Date(new Date(newTrip.startDate).getTime() + idx * 86400000).toISOString().split('T')[0]; batch.push(addDoc(collection(db, 'artifacts', APP_ID, 'users', user.uid, 'sub_items'), { tripId, type: 'itinerary', title: plan.title, date: dateStr, startTime: plan.startTime, duration: plan.duration, notes: plan.notes, cost: plan.cost || 0, category: plan.category || 'other', completed: false, createdAt: serverTimestamp() })); });

      batch.push(addDoc(collection(db, 'artifacts', APP_ID, 'users', user.uid, 'sub_items'), { tripId, type: 'budget', title: `✈️ 機票 (${newTrip.flightType})`, cost: newTrip.budgetDetails.flight, category: 'transport', createdAt: serverTimestamp() }));
      batch.push(addDoc(collection(db, 'artifacts', APP_ID, 'users', user.uid, 'sub_items'), { tripId, type: 'budget', title: `🏨 住宿 (${newTrip.hotelType})`, cost: newTrip.budgetDetails.hotel, category: 'stay', createdAt: serverTimestamp() }));
      batch.push(addDoc(collection(db, 'artifacts', APP_ID, 'users', user.uid, 'sub_items'), { tripId, type: 'budget', title: '🍽️ 預估餐飲', cost: newTrip.budgetDetails.food, category: 'food', createdAt: serverTimestamp() }));
      if (newTrip.budgetDetails.shopping > 0) batch.push(addDoc(collection(db, 'artifacts', APP_ID, 'users', user.uid, 'sub_items'), { tripId, type: 'budget', title: '🛍️ 購物金', cost: newTrip.budgetDetails.shopping, category: 'shopping', createdAt: serverTimestamp() }));

      await Promise.all(batch);
      setNewTrip({ origin: '香港', destination: '', startDate: '', endDate: '', purpose: 'sightseeing', travelers: { adults: 1, children: 0, toddlers: 0, elderly: 0 }, flightType: 'direct', hotelType: '4star', estimatedBudget: 0, budgetDetails: {} });
      showToast("AI 行程已建立！", "success");
    } catch (error) { console.error(error); setLoadingWeather(false); showToast("建立失敗", "error"); }
  };

  const addItem = async (e) => {
    if(e) e.preventDefault();
    if ((!newItem.title && !newItem.pName) && !checkInModal) return; if (currentTrip.isLocked) return showToast("已鎖定", "error");
    if (activeTab === 'people') {
        await addDoc(collection(db, 'artifacts', APP_ID, 'users', user.uid, 'sub_items'), { tripId: currentTrip.id, type: 'people', title: newItem.pName, notes: `房號: ${newItem.pRoom}`, pId: newItem.pId, pPhone: newItem.pPhone, completed: false, createdAt: serverTimestamp() });
        setNewItem({...newItem, pName:'', pId:'', pPhone:'', pRoom:''}); return showToast("人員已新增", "success");
    }
    let finalNotes = newItem.notes; if (newItem.foreignCost && newItem.currency !== 'HKD') finalNotes = `${newItem.currency} ${newItem.foreignCost} (匯率 ${EXCHANGE_RATES[newItem.currency]}) ${finalNotes}`;
    
    // Fix: Undefined Error Prevention
    const payload = { 
        ...newItem, notes: finalNotes, 
        weight: Number(newItem.weight) || 0, volume: Number(newItem.volume) || 0, cost: Number(newItem.cost) || 0,
        tripId: currentTrip.id, completed: false, createdAt: serverTimestamp() 
    };
    if (editingItem) { await updateDoc(doc(db, 'artifacts', APP_ID, 'users', user.uid, 'sub_items', editingItem), payload); setEditingItem(null); } 
    else { await addDoc(collection(db, 'artifacts', APP_ID, 'users', user.uid, 'sub_items'), payload); }
    if (newItem.cost || newItem.type === 'budget') setTimeout(() => updateTripActualCost(currentTrip.id), 500);
    setNewItem({ ...newItem, title: '', cost: '', foreignCost: '', notes: '', quantity: 1, weight: 0, startTime: '', duration: '' }); setCheckInModal(false); setShowSpotSelector(false); showToast("已新增", "success");
  };

  const deleteTrip = async (id, e) => { e.stopPropagation(); if (confirm("確定刪除？")) await deleteDoc(doc(db, 'artifacts', APP_ID, 'users', user.uid, 'trips', id)); };
  const openTrip = (trip) => { setCurrentTrip(trip); setView('trip-detail'); setNewItem({ ...newItem, date: trip.startDate, currency: CITY_DATA[trip.destination]?.currency || 'HKD' }); };
  const handleForeignCostChange = (amount, currency) => { const rate = EXCHANGE_RATES[currency] || 1; setNewItem(prev => ({ ...prev, foreignCost: amount, currency: currency, cost: Math.round(amount * rate) })); };
  const deleteItem = async (id) => { if (currentTrip.isLocked) return showToast("已鎖定", "error"); if(!confirm("確定刪除？")) return; await deleteDoc(doc(db, 'artifacts', APP_ID, 'users', user.uid, 'sub_items', id)); setTimeout(() => updateTripActualCost(currentTrip.id), 500); };
  const toggleItemComplete = async (item) => updateDoc(doc(db, 'artifacts', APP_ID, 'users', user.uid, 'sub_items', item.id), { completed: !item.completed });
  const updateQuantity = async (item, delta) => { if (currentTrip.isLocked) return; const newQty = Math.max(1, (item.quantity || 1) + delta); await updateDoc(doc(db, 'artifacts', APP_ID, 'users', user.uid, 'sub_items', item.id), { quantity: newQty }); };
  const editItem = (item) => { if (currentTrip.isLocked) return showToast("已鎖定", "error"); setNewItem({ ...item, foreignCost: item.foreignCost || '', currency: item.currency || 'HKD' }); setEditingItem(item.id); };
  
  const handleCheckIn = () => {
    if (currentTrip.isLocked) return showToast("已鎖定", "error"); if (!navigator.geolocation) return showToast("不支援定位", "error");
    navigator.geolocation.getCurrentPosition((pos) => {
       const { latitude, longitude } = pos.coords; const t = new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
       const citySpots = POI_DB[currentTrip.destination] || []; let nearbySpot = null; let minDistance = 5; 
       citySpots.forEach(spot => { if (spot.lat && spot.lon) { const d = calculateDistance(latitude, longitude, spot.lat, spot.lon); if (d < minDistance) { minDistance = d; nearbySpot = spot; } } });
       setNewItem(prev => ({ ...prev, type: 'itinerary', title: nearbySpot ? `📍 打卡: ${nearbySpot.name}` : `📍 打卡`, date: new Date().toISOString().split('T')[0], startTime: t, notes: nearbySpot ? `附近: ${nearbySpot.name}` : '', cost: '', category: 'transport', isCheckIn: true })); setCheckInModal(true);
    }, () => showToast("定位失敗", "error"));
  };
  
  const addSpotFromInfo = (spot) => {
    setActiveTab('itinerary'); setNewItem({ ...newItem, type: 'itinerary', category: spot.category || 'transport', title: spot.name, cost: spot.cost || 0, notes: spot.note || '', duration: spot.time || '2h', date: currentTrip.startDate }); window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }); showToast(`已選 ${spot.name}`, "success");
  };

  const openGoogleMapsRoute = (date) => {
    const points = items.filter(i => i.type === 'itinerary' && i.date === date).sort((a,b) => (a.startTime > b.startTime ? 1 : -1));
    if (points.length === 0) return showToast("無行程", "error");
    const origin = points[0].title; const destination = points[points.length - 1].title;
    window.open(`https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}`, '_blank');
  };

  const luggageStats = useMemo(() => { const packingItems = items.filter(i => i.type === 'packing'); const totalWeight = packingItems.reduce((sum, i) => sum + (Number(i.weight || 0) * Number(i.quantity || 1)), 0); return { totalWeight: totalWeight.toFixed(1), suggestion: totalWeight > 15 ? "24吋+" : "20吋" }; }, [items]);
  const budgetStats = useMemo(() => { const budgetItems = items.filter(i => i.cost && (i.type === 'budget' || i.type === 'itinerary')); const stats = { shopping: 0, food: 0, stay: 0, transport: 0, other: 0, total: 0 }; budgetItems.forEach(i => { const cost = Number(i.cost) || 0; const cat = i.category || 'other'; if (stats[cat] !== undefined) stats[cat] += cost; else stats.other += cost; stats.total += cost; }); return stats; }, [items]);

  // --- Render ---
  // (Reuse same components: TravelerCounter, RangeCalendar, ReportTemplate)
  const TravelerCounter = ({ label, icon: Icon, value, field }) => (<div className="flex justify-between items-center bg-gray-50 p-2 rounded text-xs"><span className="flex items-center gap-1"><Icon size={14}/> {label}</span><div className="flex items-center gap-2"><button type="button" onClick={()=>setNewTrip(p=>({...p, travelers:{...p.travelers, [field]:Math.max(0, p.travelers[field]-1)}}))} className="w-5 h-5 border rounded bg-white">-</button>{value}<button type="button" onClick={()=>setNewTrip(p=>({...p, travelers:{...p.travelers, [field]:p.travelers[field]+1}}))} className="w-5 h-5 border rounded bg-white">+</button></div></div>);
  
  const ReportTemplate = () => {
    const dayDiff = Math.max(1, Math.ceil((new Date(currentTrip.endDate) - new Date(currentTrip.startDate))/(86400000))+1);
    const dateArray = Array.from({length: dayDiff}).map((_, i) => new Date(new Date(currentTrip.startDate).getTime() + i * 86400000).toISOString().split('T')[0]);
    return (
      <div className="bg-white text-gray-800 font-sans p-8 max-w-[210mm] mx-auto min-h-[297mm] relative">
         <div className="border-b-4 border-double border-gray-800 pb-6 mb-8 text-center font-serif"><h1 className="text-4xl font-bold mb-3">{currentTrip.destination} 之旅</h1><p className="text-lg text-gray-600">{currentTrip.startDate} — {currentTrip.endDate}</p></div>
         <div className="flex flex-row gap-8 items-start">
            <div className="w-[65%]"><h2 className="text-xl font-bold border-b-2 pb-2 mb-4">每日行程</h2>
               <div className="space-y-6">{dateArray.map((dateStr, idx) => { const dayItems = items.filter(i => i.type === 'itinerary' && i.date === dateStr).sort((a,b) => (a.startTime > b.startTime ? 1 : -1)); return (<div key={dateStr} className="pl-4 border-l-2 break-inside-avoid"><h3 className="font-bold mb-2">Day {idx+1} • {dateStr}</h3>{dayItems.map(item => (<div key={item.id} className="text-sm"><span className="font-bold mr-2">{item.startTime}</span>{item.title}</div>))}</div>) })}</div>
            </div>
            <div className="w-[35%] space-y-8">
               <div className="bg-gray-50 p-4 rounded border break-inside-avoid"><h3 className="font-bold mb-2">財務</h3><div>總預算: ${currentTrip.estimatedBudget}</div><div>支出: ${budgetStats.total}</div></div>
               <div className="break-inside-avoid"><h3 className="font-bold border-b mb-2">人員</h3>{items.filter(i=>i.type==='people').map(p=><div key={p.id} className="text-xs flex justify-between"><span>{p.title}</span><span>{p.notes}</span></div>)}</div>
               <div className="break-inside-avoid"><h3 className="font-bold border-b mb-2">行李</h3>{items.filter(i=>i.type==='packing').map(i=><div key={i.id} className="text-xs">{i.title} x{i.quantity}</div>)}</div>
            </div>
         </div>
      </div>
    );
  };

  if (showPreviewModal) return <div className="min-h-screen bg-gray-100 flex flex-col items-center"><div className="w-full bg-white shadow p-4 flex justify-between print:hidden"><h2>預覽</h2><div className="flex gap-2"><button onClick={handlePrint} className="bg-blue-600 text-white px-4 py-1 rounded">列印</button><button onClick={()=>setShowPreviewModal(false)} className="text-gray-500">關閉</button></div></div><div className="w-full max-w-[210mm] bg-white shadow my-8 print:m-0"><ReportTemplate /></div></div>;

  if (view === 'dashboard') {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans text-gray-800">
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        {isUpdating && <div className="fixed top-0 left-0 w-full bg-blue-600 text-white text-xs py-1 text-center z-[70] animate-pulse">正在同步全球旅遊資訊...</div>}
        <div className="max-w-4xl mx-auto space-y-6 pt-6">
           <header className="flex justify-between items-center mb-8"><h1 className="text-2xl font-bold text-blue-900">智能旅遊管家</h1><button onClick={() => setShowUserModal(true)} className="bg-white px-3 py-2 rounded shadow text-sm"><User size={18}/> {user?.isAnonymous?'訪客':'已綁定'}</button></header>
           
           {showUserModal && <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"><div className="bg-white rounded-2xl p-6 w-full max-w-sm relative"><button onClick={()=>setShowUserModal(false)} className="absolute top-4 right-4">X</button><h3 className="font-bold mb-4">用戶中心</h3><button onClick={handleGoogleLink} className="w-full bg-orange-100 text-orange-600 py-2 rounded mb-2">綁定 Google 帳號 (防遺失)</button><button onClick={handleExportData} className="w-full bg-gray-100 py-2 rounded">備份資料</button></div></div>}

           <div className="bg-white p-6 rounded-2xl shadow border">
              <h2 className="font-bold mb-4 flex items-center gap-2"><Plus size={20}/> 新旅程</h2>
              <form onSubmit={createTrip} className="space-y-4">
                 <div className="grid grid-cols-2 gap-4">
                    <div className="relative"><label className="text-xs text-gray-500">出發</label><input value={newTrip.origin} onChange={e=>setNewTrip({...newTrip, origin: e.target.value})} onFocus={() => setShowOriginSuggestions(true)} className="w-full p-2 border rounded"/>{showOriginSuggestions && <div className="absolute z-10 bg-white border shadow p-2 flex flex-wrap gap-2">{POPULAR_ORIGINS.map(c=><button key={c} type="button" onClick={()=>{setNewTrip({...newTrip, origin: c}); setShowOriginSuggestions(false)}} className="text-xs bg-gray-100 px-2 py-1 rounded">{c}</button>)}</div>}</div>
                    <div className="relative"><label className="text-xs text-gray-500">目的地</label><input value={newTrip.destination} onChange={e=>setNewTrip({...newTrip, destination: e.target.value})} onFocus={() => setShowCitySuggestions(true)} className="w-full p-2 border rounded"/>{showCitySuggestions && <div className="absolute z-10 bg-white border shadow p-2 grid grid-cols-4 gap-2">{POPULAR_CITIES.map(c=><button key={c} type="button" onClick={()=>{setNewTrip({...newTrip, destination: c}); setShowCitySuggestions(false)}} className="text-xs border px-2 py-1 rounded">{c}</button>)}</div>}</div>
                 </div>
                 <div className="relative"><label className="text-xs text-gray-500">日期</label><div onClick={() => setShowCalendar(!showCalendar)} className="w-full p-2 border rounded cursor-pointer bg-gray-50">{newTrip.startDate ? `${newTrip.startDate} -> ${newTrip.endDate}` : '選擇日期'}</div>{showCalendar && <div className="absolute top-16 z-20"><RangeCalendar startDate={newTrip.startDate} endDate={newTrip.endDate} onChange={({startDate, endDate}) => setNewTrip({...newTrip, startDate, endDate})} onClose={()=>setShowCalendar(false)}/></div>}</div>
                 
                 <div className="grid grid-cols-3 gap-2">
                    <div><label className="text-xs block">機票</label><select value={newTrip.flightType} onChange={e=>setNewTrip({...newTrip, flightType: e.target.value})} className="w-full text-xs p-1 border rounded"><option value="direct">直航</option><option value="transfer">轉機</option></select></div>
                    <div><label className="text-xs block">住宿</label><select value={newTrip.hotelType} onChange={e=>setNewTrip({...newTrip, hotelType: e.target.value})} className="w-full text-xs p-1 border rounded"><option value="5star">五星</option><option value="4star">四星</option><option value="3star">三星</option><option value="homestay">民宿</option></select></div>
                    <div><label className="text-xs block">目的</label><select value={newTrip.purpose} onChange={e=>setNewTrip({...newTrip, purpose: e.target.value})} className="w-full text-xs p-1 border rounded"><option value="sightseeing">觀光</option><option value="shopping">購物</option><option value="food">美食</option></select></div>
                 </div>

                 <div className="grid grid-cols-4 gap-2"><TravelerCounter label="成人" icon={User} field="adults" value={newTrip.travelers.adults}/><TravelerCounter label="小童" icon={User} field="children" value={newTrip.travelers.children}/><TravelerCounter label="幼童" icon={Baby} field="toddlers" value={newTrip.travelers.toddlers}/><TravelerCounter label="長者" icon={Accessibility} field="elderly" value={newTrip.travelers.elderly}/></div>
                 {newTrip.estimatedBudget > 0 && <div className="bg-green-50 p-2 rounded text-sm text-green-800 text-center">AI 預算: ${newTrip.estimatedBudget.toLocaleString()}</div>}
                 <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded font-bold">AI 生成行程</button>
              </form>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{trips.map(trip => <div key={trip.id} onClick={() => openTrip(trip)} className="bg-white p-5 rounded shadow cursor-pointer"><h3 className="font-bold">{trip.destination}</h3><p className="text-sm text-gray-500">{trip.startDate}</p><div className="mt-2 text-xs bg-green-50 text-green-700 p-1 rounded inline-block">預算 ${trip.estimatedBudget?.toLocaleString()}</div></div>)}</div>
        </div>
      </div>
    );
  }

  const cityEmerg = CITY_DATA[currentTrip.destination]?.emergency;
  
  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800 flex flex-col bg-white">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <div className="bg-white border-b sticky top-0 z-20 shadow-sm print:hidden">
        <div className="max-w-4xl mx-auto px-4 py-3 flex justify-between items-center">
            <button onClick={() => setView('dashboard')}>← 返回</button>
            <div className="text-center font-bold">{currentTrip.destination}</div>
            <div className="flex gap-2"><button onClick={toggleTripLock}>{currentTrip.isLocked ? <Lock size={16}/> : <Unlock size={16}/>}</button><button onClick={() => setShowPreviewModal(true)}><Eye size={16}/></button></div>
        </div>
        <div className="flex gap-6 px-4 pb-1 overflow-x-auto">
           {[{id:'itinerary', label:'行程'}, {id:'packing', label:'行李'}, {id:'budget', label:'記帳'}, {id:'people', label:'人員'}, {id:'info', label:'資訊'}].map(t=><button key={t.id} onClick={()=>setActiveTab(t.id)} className={`pb-2 ${activeTab===t.id?'border-b-2 border-blue-500 font-bold':''}`}>{t.label}</button>)}
        </div>
      </div>

      <div className="flex-1 max-w-4xl mx-auto w-full p-4 space-y-6 print:hidden">
         {checkInModal && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"><div className="bg-white rounded-2xl p-6 w-full max-w-sm"><h3 className="font-bold mb-2">{newItem.title}</h3><div className="space-y-2"><input className="w-full border p-2 rounded" placeholder="備註" value={newItem.notes} onChange={e=>setNewItem({...newItem, notes:e.target.value})}/><input type="number" className="w-full border p-2 rounded" placeholder="消費" value={newItem.foreignCost} onChange={e=>handleForeignCostChange(e.target.value, newItem.currency)}/></div><div className="mt-4 flex gap-2"><button onClick={()=>setCheckInModal(false)} className="flex-1 py-2">取消</button><button onClick={addItem} className="flex-1 py-2 bg-blue-600 text-white rounded">確認</button></div></div></div>
         )}

         {activeTab === 'itinerary' && (
            <div className="space-y-4">
               <div className="grid grid-cols-2 gap-2">{cityEmerg && <div className="bg-red-50 p-2 rounded text-xs text-red-600">報警: {cityEmerg.police}</div>}<div className="bg-green-50 p-2 rounded text-xs text-green-600">叫車: {CITY_DATA[currentTrip.destination]?.rideApp}</div></div>
               <button onClick={handleCheckIn} className="w-full bg-blue-600 text-white py-2 rounded flex items-center justify-center gap-2"><Camera size={16}/> 打卡</button>
               {Array.from({length: newTrip.budgetDetails.days || 1}).map((_, i) => {
                  const dateStr = new Date(new Date(currentTrip.startDate).getTime() + i * 86400000).toISOString().split('T')[0];
                  const dayItems = items.filter(item => item.type === 'itinerary' && item.date === dateStr).sort((a,b) => (a.startTime > b.startTime ? 1 : -1));
                  const w = weatherData[dateStr];
                  return (
                     <div key={dateStr} className="bg-white p-4 rounded border">
                        <div className="flex justify-between mb-2 font-bold"><span>Day {i+1}</span><span className="text-xs text-gray-400">{w ? `${w.desc} ${w.max}°` : dateStr}</span></div>
                        {dayItems.map(item => (<div key={item.id} className="flex gap-2 text-sm mb-2" onClick={()=>!currentTrip.isLocked && editItem(item)}><span className="font-mono text-gray-500">{item.startTime}</span><span>{item.title}</span>{item.cost > 0 && <span className="text-orange-500">${item.cost}</span>}</div>))}
                        {!currentTrip.isLocked && <div className="flex justify-end gap-2 mt-2"><button onClick={() => openGoogleMapsRoute(dateStr)} className="text-xs border px-2 rounded">地圖</button><button onClick={() => {setNewItem({...newItem, date: dateStr, type:'itinerary'}); window.scrollTo({top:document.body.scrollHeight, behavior:'smooth'})}} className="text-xs bg-blue-50 px-2 rounded text-blue-600">+ 新增</button></div>}
                     </div>
                  )
               })}
            </div>
         )}

         {activeTab === 'people' && (
            <div className="grid grid-cols-1 gap-3">
               {items.filter(i=>i.type==='people').map(p=><div key={p.id} className="bg-white p-4 rounded border relative"><button onClick={()=>deleteItem(p.id)} className="absolute top-2 right-2 text-gray-300"><Trash2 size={14}/></button><div className="font-bold">{p.title}</div><div className="text-xs text-gray-500">房號: {p.notes?.split(' ')[1]}</div></div>)}
            </div>
         )}

         {activeTab === 'packing' && (
            <div>{['成人','小童','幼童'].map(owner => {
               const list = items.filter(i=>i.type==='packing' && i.itemOwner===owner); if(!list.length) return null;
               return <div key={owner} className="bg-white p-4 rounded border mb-4"><h4 className="font-bold mb-2">{owner}</h4>{list.map(item=><div key={item.id} className="flex justify-between text-sm mb-1"><span>{item.title}</span><div className="flex items-center gap-2"><span className="text-xs bg-gray-100 px-1 rounded">x{item.quantity}</span>{!currentTrip.isLocked && <button onClick={()=>updateQuantity(item, 1)}>+</button>}</div></div>)}</div>
            })}</div>
         )}

         {activeTab === 'budget' && (
            <div className="space-y-4">
               <div className="bg-emerald-600 text-white p-4 rounded shadow"><div className="flex justify-between"><span>總支出</span><span className="font-bold text-xl">${budgetStats.total.toLocaleString()}</span></div><div className="text-xs opacity-80 mt-1">預算剩餘: ${(currentTrip.estimatedBudget - budgetStats.total).toLocaleString()}</div></div>
               <div className="bg-white rounded border divide-y">{items.filter(i=>i.cost && (i.type==='budget'||i.type==='itinerary')).map(item=><div key={item.id} className="p-3 flex justify-between text-sm"><span>{item.title}</span><span className="font-bold">${item.cost}</span></div>)}</div>
            </div>
         )}

         {activeTab === 'info' && (
            <div className="space-y-4">
               {['shopping', 'food', 'stay', 'transport'].map(cat => {
                  const spots = (POI_DB[currentTrip.destination] || POI_DB['default']).filter(s=>s.category===cat);
                  if(!spots.length) return null;
                  return <div key={cat}><h3 className="font-bold mb-2">{CATEGORY_LABELS[cat].label}</h3><div className="grid grid-cols-2 gap-2">{spots.map((s,i)=><div key={i} className="bg-white border rounded p-2"><div className="font-bold text-sm">{s.name}</div><div className="text-xs text-gray-500 truncate">{s.note}</div><button onClick={()=>addSpotFromInfo(s)} className="w-full mt-2 bg-blue-50 text-blue-600 text-xs py-1 rounded">加入</button></div>)}</div></div>
               })}
            </div>
         )}

         {/* Bottom Input Bar */}
         {!checkInModal && !currentTrip.isLocked && activeTab !== 'info' && (
            <form onSubmit={addItem} className="bg-white p-4 shadow-lg border-t sticky bottom-0 z-10">
               {activeTab === 'people' ? (
                  <div className="flex gap-2"><input placeholder="姓名" className="border p-2 rounded flex-1" value={newItem.pName} onChange={e=>setNewItem({...newItem, pName:e.target.value})}/><input placeholder="房號" className="border p-2 rounded w-20" value={newItem.pRoom} onChange={e=>setNewItem({...newItem, pRoom:e.target.value})}/></div>
               ) : (
                  <div className="flex gap-2">
                     {activeTab === 'budget' && <select value={newItem.category} onChange={e=>setNewItem({...newItem, category:e.target.value})} className="border rounded text-xs"><option value="food">食</option><option value="shopping">衣</option><option value="stay">住</option><option value="transport">行</option></select>}
                     <input placeholder={activeTab==='itinerary'?"行程名稱":"項目名稱"} className="border p-2 rounded flex-1" value={newItem.title} onChange={e=>setNewItem({...newItem, title:e.target.value})}/>
                     {activeTab === 'itinerary' && <input type="time" className="border p-2 rounded w-20 text-xs" value={newItem.startTime} onChange={e=>setNewItem({...newItem, startTime:e.target.value})}/>}
                     {(activeTab === 'budget' || activeTab === 'itinerary') && <input type="number" placeholder="$" className="border p-2 rounded w-16 text-right" value={newItem.foreignCost} onChange={e=>handleForeignCostChange(e.target.value, newItem.currency)}/>}
                  </div>
               )}
               <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded mt-2 font-bold">新增</button>
            </form>
         )}
      </div>
    </div>
  );
}

export default TravelApp;
