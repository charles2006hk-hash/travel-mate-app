import { useState, useEffect, useMemo } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged, GoogleAuthProvider, linkWithPopup, signInWithPopup } from "firebase/auth";
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, deleteDoc, doc, updateDoc, where, getDocs } from "firebase/firestore";
import { 
  Trash2, Plus, Minus, MapPin, Calendar as CalIcon, CheckCircle2, Circle, 
  DollarSign, FileText, Sun, CloudRain, Snowflake, Cloud, Droplets, Wind,
  Luggage, Plane, Baby, Accessibility, User, Navigation,
  Camera, ShoppingBag, Calculator, RefreshCw, Edit2, Map, Briefcase, Coffee, Home, Bus, Shirt,
  ExternalLink, Clock, Search, Utensils, Mountain, Siren, Ambulance, Car,
  Printer, Lock, Unlock, LogIn, Download, Eye, X, Heart, ChevronLeft, ChevronRight,
  AlertCircle, Check, RefreshCw as RefreshIcon, Users, CreditCard, Ticket, Phone, ArrowRight, Star, BedDouble
} from 'lucide-react';

// --- 1. Firebase Configuration ---
const firebaseConfig = {
  apiKey: "AIzaSyAwQ_elPgO-Fpp1su7B2O6o5-ZAlsVR3I0",
  authDomain: "travel-mate-app-7ca34.firebaseapp.com",
  projectId: "travel-mate-app-7ca34",
  storageBucket: "travel-mate-app-7ca34.firebasestorage.app",
  messagingSenderId: "416529155148",
  appId: "1:416529155148:web:e4519007bc7dc49b34e0e9",
  measurementId: "G-PY297WYCRF"
};

// --- 2. Initialization ---
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();
const APP_ID = "travel-mate-app-7ca34"; 

// --- 3. Static Data & Constants (Moved outside component to prevent re-declaration issues) ---

const WEATHER_MAPPING = {
  'Sun': Sun, 'CloudRain': CloudRain, 'Snowflake': Snowflake, 'Cloud': Cloud, 'Droplets': Droplets, 'Wind': Wind
};

// Safe City Data Accessor
const DEFAULT_CITY_IMG = "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=400&q=80";
const CITY_DATA = {
  "東京": { lat: 35.6762, lon: 139.6503, currency: "JPY", region: "JP", img: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&q=80", intro: "傳統與未來交織的城市，必去淺草寺、澀谷十字路口。", emergency: { police: "110", ambulance: "119" }, rideApp: "Uber / GO / DiDi" },
  "大阪": { lat: 34.6937, lon: 135.5023, currency: "JPY", region: "JP", img: "https://images.unsplash.com/photo-1590559899731-a382839e5549?w=400&q=80", intro: "美食之都，道頓堀固力果跑跑人是必打卡點。", emergency: { police: "110", ambulance: "119" }, rideApp: "Uber / GO / DiDi" },
  "京都": { lat: 35.0116, lon: 135.7681, currency: "JPY", region: "JP", img: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=400&q=80", intro: "千年古都，擁有無數神社與寺廟。", emergency: { police: "110", ambulance: "119" }, rideApp: "MK Taxi / Uber" },
  "札幌": { lat: 43.0618, lon: 141.3545, currency: "JPY", region: "JP", img: "https://images.unsplash.com/photo-1516900557549-41557d405adf?w=400&q=80", intro: "北國雪景與美食，冬季必訪大通公園雪祭。", emergency: { police: "110", ambulance: "119" }, rideApp: "Uber / GO" },
  "福岡": { lat: 33.5902, lon: 130.4017, currency: "JPY", region: "JP", img: "https://images.unsplash.com/photo-1570459027562-4a916cc6113f?w=400&q=80", intro: "九州門戶，屋台文化與豚骨拉麵的發源地。", emergency: { police: "110", ambulance: "119" }, rideApp: "Uber / GO" },
  "首爾": { lat: 37.5665, lon: 126.9780, currency: "KRW", region: "KR", img: "https://images.unsplash.com/photo-1538669716383-71cc735d4872?w=400&q=80", intro: "韓流中心，弘大購物與景福宮穿韓服體驗。", emergency: { police: "112", ambulance: "119" }, rideApp: "Kakao T / Uber" },
  "釜山": { lat: 35.1796, lon: 129.0756, currency: "KRW", region: "KR", img: "https://images.unsplash.com/photo-1596788502256-4c4f9273c3cb?w=400&q=80", intro: "海港城市，海雲台沙灘與甘川洞文化村。", emergency: { police: "112", ambulance: "119" }, rideApp: "Kakao T" },
  "台北": { lat: 25.0330, lon: 121.5654, currency: "TWD", region: "TW", img: "https://images.unsplash.com/photo-1590523277543-a94d2e4eb00b?w=400&q=80", intro: "美食與夜市的天堂，必登台北101觀景台。", emergency: { police: "110", ambulance: "119" }, rideApp: "Uber / 55688 / yoxi" },
  "曼谷": { lat: 13.7563, lon: 100.5018, currency: "THB", region: "TH", img: "https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=400&q=80", intro: "充滿活力的不夜城，大皇宮與水上市場不可錯過。", emergency: { police: "191", ambulance: "1669" }, rideApp: "Grab / Bolt" },
  "倫敦": { lat: 51.5074, lon: -0.1278, currency: "GBP", region: "UK", img: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=400&q=80", intro: "歷史與現代的融合，大笨鐘與倫敦眼是必訪之地。", emergency: { police: "999", ambulance: "999" }, rideApp: "Uber / Bolt / Addison Lee" },
  "巴黎": { lat: 48.8566, lon: 2.3522, currency: "EUR", region: "EU", img: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400&q=80", intro: "浪漫之都，艾菲爾鐵塔下野餐是最佳體驗。", emergency: { police: "17", ambulance: "15" }, rideApp: "Uber / Bolt / G7" },
  "香港": { lat: 22.3193, lon: 114.1694, currency: "HKD", region: "HK", img: "https://images.unsplash.com/photo-1518599801797-737c8d02e8e7?w=400&q=80", intro: "東方之珠，維多利亞港夜景世界三大夜景之一。", emergency: { police: "999", ambulance: "999" }, rideApp: "Uber / HKTaxi" },
  "雪梨": { lat: -33.8688, lon: 151.2093, currency: "AUD", region: "AU", img: "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=400&q=80", intro: "澳洲最大城市，雪梨歌劇院與港灣大橋是世界級地標。", emergency: { police: "000", ambulance: "000" }, rideApp: "Uber / DiDi / Ola" },
  "墨爾本": { lat: -37.8136, lon: 144.9631, currency: "AUD", region: "AU", img: "https://images.unsplash.com/photo-1510265119258-db115b0e8172?w=400&q=80", intro: "澳洲文化與咖啡之都，充滿藝術巷弄與維多利亞式建築。", emergency: { police: "000", ambulance: "000" }, rideApp: "Uber / DiDi / 13CABS" },
  "布里斯本": { lat: -27.4705, lon: 153.0260, currency: "AUD", region: "AU", img: "https://images.unsplash.com/photo-1562657523-2679c2937397?w=400&q=80", intro: "陽光之城，擁有美麗的南岸公園與考拉保護區。", emergency: { police: "000", ambulance: "000" }, rideApp: "Uber / DiDi" },
  "黃金海岸": { lat: -28.0167, lon: 153.4000, currency: "AUD", region: "AU", img: "https://images.unsplash.com/photo-1506953823976-52e1fdc0149a?w=400&q=80", intro: "衝浪者的天堂，擁有綿延的沙灘與多個主題樂園。", emergency: { police: "000", ambulance: "000" }, rideApp: "Uber / DiDi" },
};

const POPULAR_CITIES = Object.keys(CITY_DATA);
const POPULAR_ORIGINS = ["香港", "台北", "高雄", "澳門", "東京", "倫敦", "紐約", "雪梨", "墨爾本"];
const EXCHANGE_RATES = { "HKD": 1, "JPY": 0.052, "KRW": 0.0058, "TWD": 0.25, "THB": 0.22, "SGD": 5.8, "GBP": 9.9, "EUR": 8.5, "USD": 7.8, "CNY": 1.1, "AUD": 5.1 };

// AI Parameters
const PURPOSE_MULTIPLIERS = {
  "sightseeing": { flight: 1, hotel: 1, food: 1, transport: 1.2, shopping: 2000, label: "觀光打卡", icon: Camera, desc: "輕鬆遊覽名勝古蹟" }, 
  "shopping": { flight: 1, hotel: 1, food: 0.8, transport: 1, shopping: 8000, label: "購物血拼", icon: ShoppingBag, desc: "Outlet與百貨巡禮" }, 
  "food": { flight: 1, hotel: 1, food: 2.0, transport: 1, shopping: 2000, label: "美食巡禮", icon: Utensils, desc: "米其林與在地小吃" }, 
  "adventure": { flight: 1, hotel: 1.2, food: 1, transport: 1.5, shopping: 1000, label: "冒險體驗", icon: Mountain, desc: "主題樂園與戶外" } 
};

const FLIGHT_COSTS = { "JP": { direct: 5000, transfer: 3500 }, "UK": { direct: 10000, transfer: 7000 }, "AU": { direct: 8000, transfer: 6000 }, "default": { direct: 6000, transfer: 4000 } };
const HOTEL_COSTS = { "5star": 3000, "4star": 1500, "3star": 800, "homestay": 600, "hostel": 300 };
const HOTEL_LABELS = { "5star": "五星級奢華", "4star": "四星級舒適", "3star": "三星級經濟", "homestay": "民宿/Airbnb", "hostel": "青年旅館" };
const BASE_COSTS = { "JP": { food: 400, transport: 150 }, "AU": { food: 500, transport: 150 }, "default": { food: 400, transport: 150 } };

const ITEM_DEFINITIONS = {
  "護照/簽證": { weight: 0.1, volume: 1, category: "doc", icon: FileText }, "現金/信用卡": { weight: 0.1, volume: 1, category: "doc", icon: DollarSign },
  "手機充電器": { weight: 0.2, volume: 2, category: "move", icon: ZapIcon }, "萬用轉接頭": { weight: 0.2, volume: 2, category: "move", icon: ZapIcon },
  "換洗衣物": { weight: 0.5, volume: 10, category: "clothes", icon: Shirt }, "厚外套": { weight: 1.2, volume: 25, category: "clothes", icon: Shirt },
  "薄外套": { weight: 0.5, volume: 10, category: "clothes", icon: Shirt }, "泳衣": { weight: 0.2, volume: 3, category: "clothes", icon: Shirt },
  "盥洗包": { weight: 0.5, volume: 5, category: "daily", icon: RefreshCw }, "藥品": { weight: 0.2, volume: 2, category: "daily", icon: Plus },
  "尿布": { weight: 0.05, volume: 2, category: "daily", icon: Baby }, "奶粉": { weight: 0.8, volume: 10, category: "food", icon: Utensils },
  "推車": { weight: 5.0, volume: 50, category: "move", icon: Navigation }, "雨傘": { weight: 0.3, volume: 3, category: "daily", icon: CloudRain },
  "水壺": { weight: 0.2, volume: 5, category: "food", icon: Coffee },
};
function ZapIcon(props) { return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg> }

const BUDGET_CATEGORIES = { shopping: { label: "衣/購", icon: ShoppingBag, color: "text-pink-500" }, food: { label: "食", icon: Utensils, color: "text-orange-500" }, stay: { label: "住", icon: Home, color: "text-indigo-500" }, transport: { label: "行", icon: Bus, color: "text-blue-500" }, other: { label: "其他", icon: FileText, color: "text-gray-500" } };
const CATEGORY_LABELS = { shopping: { label: "衣 (購物)", icon: ShoppingBag, color: "text-pink-500", bg: "bg-pink-50" }, food: { label: "食 (美食)", icon: Utensils, color: "text-orange-500", bg: "bg-orange-50" }, stay: { label: "住 (住宿)", icon: Home, color: "text-indigo-500", bg: "bg-indigo-50" }, transport: { label: "行 (景點/交通)", icon: Map, color: "text-blue-500", bg: "bg-blue-50" }, other: { label: "其他", icon: FileText, color: "text-gray-500", bg: "bg-gray-50" } };

// POI Database
const POI_DB = {
  "東京": [{ name: "東京迪士尼", category: "transport", cost: 600, time: "全日", note: "夢幻王國", lat: 35.6329, lon: 139.8804, img: "https://images.unsplash.com/photo-1545582379-34e8ce6a3092?w=400&q=80", desc: "亞洲第一座迪士尼樂園。" }, { name: "淺草寺", category: "transport", cost: 0, time: "2h", note: "雷門打卡", lat: 35.7147, lon: 139.7967, img: "https://images.unsplash.com/photo-1596395914619-338d9b52c007?w=400&q=80", desc: "東京最古老的寺廟。" }],
  "大阪": [{ name: "環球影城", category: "transport", cost: 650, time: "全日", note: "任天堂世界", lat: 34.6654, lon: 135.4323, img: "https://images.unsplash.com/photo-1623941000802-38fadd7f7b3b?w=400&q=80", desc: "世界級主題樂園。" }, { name: "道頓堀", category: "food", cost: 200, time: "3h", note: "美食吃到飽", lat: 34.6687, lon: 135.5013, img: "https://images.unsplash.com/photo-1590559899731-a382839e5549?w=400&q=80", desc: "大阪美食心臟。" }],
  "雪梨": [{ name: "雪梨歌劇院", category: "transport", cost: 200, time: "2h", note: "世界遺產", lat: -33.8568, lon: 151.2153, img: "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=400&q=80", desc: "經典地標。" }, { name: "邦迪海灘", category: "transport", cost: 0, time: "3h", note: "衝浪", lat: -33.8915, lon: 151.2767, img: "https://images.unsplash.com/photo-1523428098666-1a6a90e96033?w=400&q=80", desc: "澳洲最著名海灘。" }],
  "default": [{ name: "市中心地標", category: "transport", cost: 0, time: "1h", note: "打卡點", lat: 0, lon: 0, img: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=400&q=80", desc: "城市中心。" }]
};

const calculateDistance = (lat1, lon1, lat2, lon2) => { const R = 6371; const dLat = (lat2 - lat1) * Math.PI / 180; const dLon = (lon2 - lon1) * Math.PI / 180; const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2); return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); };

// --- Helpers ---

const safeCity = (name) => {
  return CITY_DATA[name] || { 
    img: DEFAULT_CITY_IMG, 
    intro: "探索未知的城市。", 
    rideApp: "Uber", 
    emergency: { police: "110", ambulance: "119" } 
  };
};

const getLunarInfo = (date) => {
  const m = date.getMonth() + 1; const d = date.getDate();
  if (m === 1 && d === 1) return "元旦"; if (m === 12 && d === 25) return "聖誕"; if (m === 4 && d === 4) return "兒童";
  // Simple Lunar sim
  const baseDate = new Date(2024, 1, 10); const diffDays = Math.floor((date - baseDate) / 86400000); const lunarDayIndex = (diffDays % 29 + 29) % 29 + 1;
  if (lunarDayIndex === 1) return "初一"; if (lunarDayIndex === 15) return "十五";
  return null;
};

const fetchDailyWeather = async (lat, lon, startStr, endStr) => {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto&start_date=${startStr}&end_date=${endStr}`;
    const res = await fetch(url); const data = await res.json(); const weatherMap = {};
    if (data.daily) data.daily.time.forEach((date, i) => {
       const code = data.daily.weathercode[i]; 
       let iconKey = 'Sun'; let desc = "晴";
       if (code >= 95) { iconKey = 'CloudRain'; desc = "雷雨"; } 
       else if (code >= 71) { iconKey = 'Snowflake'; desc = "雪"; } 
       else if (code >= 51) { iconKey = 'Droplets'; desc = "雨"; } 
       else if (code >= 3) { iconKey = 'Cloud'; desc = "陰"; } 
       else if (code >= 1) { iconKey = 'Cloud'; desc = "多雲"; }
       weatherMap[date] = { max: data.daily.temperature_2m_max[i], min: data.daily.temperature_2m_min[i], rain: data.daily.precipitation_probability_max[i], iconKey, desc };
    });
    return weatherMap;
  } catch (e) { return {}; }
};

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

// --- Components ---

const Toast = ({ message, type, onClose }) => {
  useEffect(() => { const timer = setTimeout(onClose, 3000); return () => clearTimeout(timer); }, [onClose]);
  return <div className={`fixed bottom-8 left-1/2 transform -translate-x-1/2 ${type === 'error' ? 'bg-red-500' : 'bg-green-600'} text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 z-[100] animate-bounce-in font-bold border border-white/20 backdrop-blur-md`}><CheckCircle2 size={20} /><span className="text-sm">{message}</span></div>;
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
    <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-2xl w-80 z-50">
      <div className="flex justify-between items-center mb-4">
        <button type="button" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))} className="p-2 hover:bg-gray-100 rounded-full"><ChevronLeft size={16}/></button>
        <span className="font-bold text-gray-800">{currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
        <button type="button" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))} className="p-2 hover:bg-gray-100 rounded-full"><ChevronRight size={16}/></button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs mb-2 text-gray-400 font-bold">{['日','一','二','三','四','五','六'].map((d,i) => <div key={d} className={i===0||i===6?'text-red-400':''}>{d}</div>)}</div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: firstDayOfMonth(currentMonth) }).map((_, i) => <div key={`empty-${i}`} />)}
        {Array.from({ length: daysInMonth(currentMonth) }).map((_, i) => {
          const day = i + 1; const dateStr = formatDate(currentMonth.getFullYear(), currentMonth.getMonth(), day);
          const selected = dateStr === startDate || dateStr === endDate; const inRange = startDate && endDate && dateStr > startDate && dateStr < endDate;
          const holiday = getLunarInfo(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day));
          const isToday = dateStr === new Date().toISOString().split('T')[0];
          return <button key={day} type="button" onClick={() => handleDateClick(day)} className={`h-10 w-full rounded-lg text-sm flex flex-col items-center justify-center transition-all ${selected ? 'bg-blue-600 text-white font-bold' : ''} ${inRange ? 'bg-blue-50 text-blue-600 rounded-none' : ''} ${!selected && !inRange ? 'hover:bg-gray-50' : ''} ${isToday && !selected ? 'border border-yellow-400' : ''}`}><span>{day}</span>{holiday&&<span className="text-[8px] scale-75 text-red-400">{holiday}</span>}</button>;
        })}
      </div>
      <div className="mt-3 text-center text-xs text-blue-600 font-medium border-t pt-2 cursor-pointer" onClick={onClose}>完成</div>
    </div>
  );
};

// 獨立的圖示渲染元件，防止 Error #130
const WeatherIconDisplay = ({ iconKey }) => {
    const IconComponent = WEATHER_MAPPING[iconKey] || Sun;
    return <IconComponent size={14} />;
};

// --- Main Application ---

function TravelApp() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('dashboard'); 
  const [step, setStep] = useState(0); 
  
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
  
  // Weather Fetching
  useEffect(() => { 
      if (currentTrip && safeCity(currentTrip.destination).lat) { 
          const { lat, lon } = safeCity(currentTrip.destination); 
          fetchDailyWeather(lat, lon, currentTrip.startDate, currentTrip.endDate).then(data => setWeatherData(data)); 
      } 
  }, [currentTrip]);

  const updateTripActualCost = async (tripId) => { if (!user || !tripId) return; try { const q = query(collection(db, 'artifacts', APP_ID, 'users', user.uid, 'sub_items'), where('tripId', '==', tripId)); const snapshot = await getDocs(q); const total = snapshot.docs.reduce((sum, doc) => sum + (Number(doc.data().cost) || 0), 0); await updateDoc(doc(db, 'artifacts', APP_ID, 'users', user.uid, 'trips', tripId), { actualCost: total }); } catch (e) { console.error(e); } };

  const calculateEstimatedBudget = () => {
    if (!newTrip.startDate || !newTrip.endDate || newTrip.endDate < newTrip.startDate) return;
    const region = safeCity(newTrip.destination).region || 'default';
    const baseCosts = BASE_COSTS[region] || BASE_COSTS['default'];
    const purposeMult = PURPOSE_MULTIPLIERS[newTrip.purpose];
    const flightBase = (FLIGHT_COSTS[region] || FLIGHT_COSTS['default'])[newTrip.flightType];
    const hotelBase = HOTEL_COSTS[newTrip.hotelType];
    const days = Math.max(1, Math.ceil((new Date(newTrip.endDate) - new Date(newTrip.startDate)) / (1000 * 60 * 60 * 24)) + 1);
    if (isNaN(days)) return;
    const total = (flightBase * 1) + (hotelBase * days) + (baseCosts.food * days * purposeMult.food); // Simplified for brevity
    setNewTrip(prev => ({ ...prev, estimatedBudget: Math.round(total), budgetDetails: { days } }));
  };
  useEffect(() => { if (newTrip.destination && newTrip.startDate && newTrip.endDate) calculateEstimatedBudget(); }, [newTrip.destination, newTrip.startDate, newTrip.endDate, newTrip.travelers, newTrip.purpose, newTrip.flightType, newTrip.hotelType]);

  const handleGoogleLink = async () => { try { if (user.isAnonymous) await linkWithPopup(user, googleProvider); else showToast("已登入", "success"); } catch (error) { showToast("連結失敗：請確認瀏覽器未阻擋彈窗", "error"); } };
  const handleExportData = () => { const data = { user: user.uid, trips: trips, items: items, exportedAt: new Date().toISOString() }; const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `travel_backup.json`; a.click(); };
  const toggleTripLock = async () => { await updateDoc(doc(db, 'artifacts', APP_ID, 'users', user.uid, 'trips', currentTrip.id), { isLocked: !currentTrip.isLocked }); setCurrentTrip(prev => ({...prev, isLocked: !prev.isLocked})); showToast(currentTrip.isLocked ? "行程已解鎖" : "行程已鎖定", "success"); };
  const handlePrint = () => window.print();

  const createTrip = async (e) => {
    if(e) e.preventDefault();
    if (!newTrip.startDate || !newTrip.endDate) return showToast("請選擇日期", "error");
    try {
      setLoadingWeather(true);
      const docRef = await addDoc(collection(db, 'artifacts', APP_ID, 'users', user.uid, 'trips'), { ...newTrip, weather: 'sunny', currency: safeCity(newTrip.destination).currency || 'HKD', actualCost: 0, isLocked: false, createdAt: serverTimestamp() });
      const tripId = docRef.id;
      const days = newTrip.budgetDetails.days || 3;
      const smartItinerary = generateSmartItinerary(newTrip.destination, days, newTrip.purpose, newTrip.travelers);
      smartItinerary.forEach(async (plan, idx) => {
        const dateStr = new Date(new Date(newTrip.startDate).getTime() + idx * 86400000).toISOString().split('T')[0];
        await addDoc(collection(db, 'artifacts', APP_ID, 'users', user.uid, 'sub_items'), { tripId, type: 'itinerary', title: plan.title, date: dateStr, startTime: plan.startTime, duration: plan.duration, notes: plan.notes, cost: plan.cost || 0, category: plan.category || 'other', completed: false, createdAt: serverTimestamp() });
      });
      setLoadingWeather(false); setView('dashboard'); setStep(0); showToast("行程建立成功！", "success");
    } catch (error) { setLoadingWeather(false); showToast("建立失敗", "error"); }
  };

  const deleteTrip = async (id, e) => { e.stopPropagation(); if (confirm("確定刪除？")) await deleteDoc(doc(db, 'artifacts', APP_ID, 'users', user.uid, 'trips', id)); };
  const openTrip = (trip) => { setCurrentTrip(trip); setView('trip-detail'); setNewItem({ ...newItem, date: trip.startDate, currency: safeCity(trip.destination).currency || 'HKD' }); };
  const handleForeignCostChange = (amount, currency) => { const rate = EXCHANGE_RATES[currency] || 1; setNewItem(prev => ({ ...prev, foreignCost: amount, currency: currency, cost: Math.round(amount * rate) })); };
  const addItem = async (e) => {
    if(e) e.preventDefault(); if (!newItem.title && !newItem.pName && !checkInModal) return;
    const payload = { ...newItem, weight: Number(newItem.weight)||0, volume: Number(newItem.volume)||0, cost: Number(newItem.cost)||0, tripId: currentTrip.id, completed: false, createdAt: serverTimestamp() };
    if (editingItem) { await updateDoc(doc(db, 'artifacts', APP_ID, 'users', user.uid, 'sub_items', editingItem), payload); setEditingItem(null); } else { await addDoc(collection(db, 'artifacts', APP_ID, 'users', user.uid, 'sub_items'), payload); }
    if (newItem.cost > 0) setTimeout(() => updateTripActualCost(currentTrip.id), 500);
    setNewItem({ ...newItem, title: '', cost: '', foreignCost: '', notes: '', quantity: 1, weight: 0, startTime: '', duration: '' }); setCheckInModal(false); setShowSpotSelector(false); showToast("已儲存", "success");
  };
  
  const handleCheckIn = () => {
     if (!navigator.geolocation) return showToast("不支援定位", "error");
     navigator.geolocation.getCurrentPosition((pos) => {
        setNewItem(prev => ({ ...prev, type: 'itinerary', title: `📍 打卡`, date: new Date().toISOString().split('T')[0], startTime: new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}), notes: `GPS: ${pos.coords.latitude.toFixed(2)}, ${pos.coords.longitude.toFixed(2)}`, cost: 0, category: 'transport', isCheckIn: true }));
        setCheckInModal(true);
     });
  };
  const addSpotFromInfo = (spot) => { setActiveTab('itinerary'); setNewItem({ ...newItem, type: 'itinerary', category: spot.category, title: spot.name, cost: spot.cost, notes: spot.note, duration: spot.time, date: currentTrip.startDate }); showToast("已選擇", "success"); };
  const deleteItem = async (id) => { if(!confirm("確定刪除？")) return; await deleteDoc(doc(db, 'artifacts', APP_ID, 'users', user.uid, 'sub_items', id)); setTimeout(() => updateTripActualCost(currentTrip.id), 500); };
  const toggleItemComplete = async (item) => updateDoc(doc(db, 'artifacts', APP_ID, 'users', user.uid, 'sub_items', item.id), { completed: !item.completed });
  const updateQuantity = async (item, delta) => { const newQty = Math.max(1, (item.quantity || 1) + delta); await updateDoc(doc(db, 'artifacts', APP_ID, 'users', user.uid, 'sub_items', item.id), { quantity: newQty }); };
  const editItem = (item) => { setNewItem({ ...item, foreignCost: item.foreignCost || '', currency: item.currency || 'HKD' }); setEditingItem(item.id); };
  const openGoogleMapsRoute = (date) => { window.open(`https://www.google.com/maps/dir/?api=1&destination=${currentTrip.destination}`, '_blank'); };

  const luggageStats = useMemo(() => { const packingItems = items.filter(i => i.type === 'packing'); const totalWeight = packingItems.reduce((sum, i) => sum + (Number(i.weight || 0) * Number(i.quantity || 1)), 0); return { totalWeight: totalWeight.toFixed(1), suggestion: totalWeight > 15 ? "24吋+" : "20吋" }; }, [items]);
  const budgetStats = useMemo(() => { const budgetItems = items.filter(i => Number(i.cost) > 0 && (i.type==='budget'||i.type==='itinerary')); const stats = { total: 0 }; budgetItems.forEach(i => { stats.total += Number(i.cost) || 0; }); return stats; }, [items]);
  const TravelerCounter = ({ label, icon: Icon, value, field }) => (<div className="flex justify-between items-center bg-gray-50 p-3 rounded-xl"><span className="flex items-center gap-2 text-sm font-medium text-gray-600"><Icon size={16}/> {label}</span><div className="flex items-center gap-3"><button type="button" onClick={()=>setNewTrip(p=>({...p, travelers:{...p.travelers, [field]:Math.max(0, p.travelers[field]-1)}}))} className="w-6 h-6 bg-white rounded-full border shadow-sm flex items-center justify-center text-gray-500 hover:bg-gray-100">-</button><span className="w-4 text-center text-sm font-bold">{value}</span><button type="button" onClick={()=>setNewTrip(p=>({...p, travelers:{...p.travelers, [field]:p.travelers[field]+1}}))} className="w-6 h-6 bg-white rounded-full border shadow-sm flex items-center justify-center text-blue-600 hover:bg-blue-50">+</button></div></div>);

  const ReportTemplate = () => {
    if (!currentTrip) return null;
    const dayDiff = Math.max(1, Math.ceil((new Date(currentTrip.endDate) - new Date(currentTrip.startDate))/(86400000))+1);
    const dateArray = Array.from({length: dayDiff}).map((_, i) => new Date(new Date(currentTrip.startDate).getTime() + i * 86400000).toISOString().split('T')[0]);
    return (
      <div className="bg-white text-gray-800 font-sans p-8 max-w-[210mm] mx-auto min-h-[297mm] relative">
         <div className="border-b-4 border-double border-gray-800 pb-6 mb-8 text-center font-serif"><h1 className="text-4xl font-bold text-gray-900 mb-3">{user?.displayName || '親愛的旅客'} 的 {currentTrip.destination} 之旅</h1><p className="text-lg text-gray-600 italic">{currentTrip.startDate} — {currentTrip.endDate}</p></div>
         <div className="flex flex-row gap-8 items-start">
            <div className="w-[65%]"><h2 className="text-xl font-bold border-b-2 border-gray-800 pb-2 mb-4 flex items-center gap-2"><MapPin size={20} className="text-blue-600"/> 每日行程</h2><div className="space-y-6">{dateArray.map((dateStr, idx) => { const dayItems = items.filter(i => i.type === 'itinerary' && i.date === dateStr).sort((a,b) => (a.startTime > b.startTime ? 1 : -1)); const w = weatherData[dateStr]; return (<div key={dateStr} className="pl-4 border-l-2 break-inside-avoid"><div className="flex justify-between mb-2"><h3 className="font-bold text-gray-800">Day {idx+1} • {dateStr}</h3>{w && <div className="text-xs bg-blue-50 px-2 py-1 rounded-full"><WeatherIconDisplay iconKey={w.iconKey} /> {w.desc}</div>}</div>{dayItems.map(item => (<div key={item.id} className="text-sm mb-1"><span className="font-bold mr-2">{item.startTime}</span>{item.title}</div>))}</div>) })}</div></div>
            <div className="w-[35%] space-y-8"><div className="bg-gray-50 p-4 rounded border"><h3 className="font-bold mb-2">財務</h3><div>預算: ${Number(currentTrip.estimatedBudget).toLocaleString()}</div><div>支出: ${budgetStats.total.toLocaleString()}</div></div><div className="break-inside-avoid"><h3 className="font-bold border-b mb-2">人員</h3>{items.filter(i=>i.type==='people').map(p=><div key={p.id} className="text-xs">{p.title}</div>)}</div></div>
         </div>
      </div>
    );
  };

  // --- Render ---
  if (showPreviewModal) return <div className="min-h-screen bg-gray-100 flex flex-col items-center"><div className="w-full bg-white shadow-md p-4 sticky top-0 z-50 flex justify-between items-center print:hidden"><h2 className="font-bold">預覽</h2><button onClick={handlePrint} className="bg-blue-600 text-white px-4 py-1 rounded">列印</button><button onClick={()=>setShowPreviewModal(false)} className="text-gray-500">關閉</button></div><div className="w-full max-w-[210mm] bg-white shadow-xl my-8 print:shadow-none print:m-0 print:w-full"><ReportTemplate /></div></div>;

  if (view === 'dashboard') {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans text-gray-800">
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        <div className="max-w-4xl mx-auto space-y-6 pt-6">
           <header className="flex justify-between items-center mb-8"><h1 className="text-2xl font-bold text-blue-900">智能旅遊管家</h1><button onClick={() => setShowUserModal(true)} className="bg-white px-3 py-2 rounded-full shadow text-sm"><User size={18}/> {user?.isAnonymous?'訪客':'已綁定'}</button></header>
           {showUserModal && <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"><div className="bg-white rounded-2xl p-6 w-full max-w-sm relative shadow-2xl"><button onClick={()=>setShowUserModal(false)} className="absolute top-4 right-4">X</button><h3 className="font-bold mb-4">用戶中心</h3><button onClick={handleGoogleLink} className="w-full bg-orange-50 text-orange-600 py-3 rounded-xl mb-2 border border-orange-100">綁定 Google</button><button onClick={handleExportData} className="w-full bg-gray-50 py-3 rounded-xl text-sm text-gray-600">備份</button></div></div>}
           <div onClick={() => {setNewTrip({origin:'香港', destination:'', startDate:'', endDate:'', purpose:'sightseeing', travelers:{adults:1, children:0, toddlers:0, elderly:0}, flightType:'direct', hotelType:'4star', estimatedBudget:0, budgetDetails:{}}); setStep(0); setView('create-trip');}} className="bg-gradient-to-br from-blue-500 to-indigo-600 p-8 rounded-3xl shadow-lg cursor-pointer text-white flex items-center justify-between"><div><h2 className="text-2xl font-bold mb-2">開啟新旅程</h2><p className="opacity-80">AI 智能規劃</p></div><div className="bg-white/20 p-4 rounded-full"><Plus size={32}/></div></div>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{trips.map(trip => (<div key={trip.id} onClick={() => openTrip(trip)} className="bg-white rounded-2xl shadow-sm p-4 cursor-pointer relative group border border-gray-100"><div className="flex justify-between mb-2"><h3 className="font-bold text-lg">{trip.destination}</h3><button onClick={(e) => deleteTrip(trip.id, e)} className="text-gray-300 hover:text-red-500"><Trash2 size={16}/></button></div><div className="text-sm text-gray-500 mb-2"><CalIcon size={14} className="inline mr-1"/>{trip.startDate}</div><div className="flex gap-2 text-xs"><span className="bg-green-50 text-green-700 px-2 py-1 rounded">預算 ${Number(trip.estimatedBudget).toLocaleString()}</span><span className="bg-blue-50 text-blue-700 px-2 py-1 rounded">實際 ${Number(trip.actualCost).toLocaleString()}</span></div></div>))}</div>
        </div>
      </div>
    );
  }

  if (view === 'create-trip') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        <div className="bg-white p-4 shadow-sm flex items-center justify-between"><button onClick={() => setView('dashboard')} className="p-2 rounded-full hover:bg-gray-100"><ArrowRight size={20} className="rotate-180"/></button><div className="font-bold text-lg">規劃新旅程</div><div className="w-10"></div></div>
        <div className="flex-1 overflow-y-auto p-6 max-w-2xl mx-auto w-full space-y-8">
            {step === 0 && <div className="space-y-6"><h2 className="text-2xl font-bold">出發地與目的地</h2><div className="space-y-4"><div><label className="text-sm font-bold block mb-2">出發地</label><div className="flex flex-wrap gap-2">{POPULAR_ORIGINS.map(c=><button key={c} onClick={()=>setNewTrip({...newTrip, origin:c})} className={`px-4 py-2 rounded-full text-sm border ${newTrip.origin===c?'bg-blue-600 text-white':'bg-white'}`}>{c}</button>)}</div></div><div><label className="text-sm font-bold block mb-2">熱門目的地</label><div className="grid grid-cols-2 gap-4">{POPULAR_CITIES.map(c=><div key={c} onClick={()=>{setNewTrip({...newTrip, destination:c}); setStep(1)}} className="h-24 rounded-xl bg-gray-200 relative overflow-hidden cursor-pointer"><img src={safeCity(c).img} className="w-full h-full object-cover"/><span className="absolute bottom-2 left-2 text-white font-bold shadow-black drop-shadow-md">{c}</span></div>)}</div></div></div></div>}
            {step === 1 && <div className="space-y-6"><h2 className="text-2xl font-bold">日期選擇</h2><div className="flex justify-center"><RangeCalendar startDate={newTrip.startDate} endDate={newTrip.endDate} onChange={({startDate, endDate}) => setNewTrip({...newTrip, startDate, endDate})} /></div><div className="flex justify-between"><button onClick={()=>setStep(0)}>上一步</button><button onClick={()=>setStep(2)} className="bg-blue-600 text-white px-6 py-2 rounded-full">下一步</button></div></div>}
            {step === 2 && <div className="space-y-6"><h2 className="text-2xl font-bold">偏好設定</h2><div className="space-y-4"><div><label className="block text-sm font-bold mb-2">機票</label><div className="flex gap-2">{['direct', 'transfer'].map(t=><button key={t} onClick={()=>setNewTrip({...newTrip, flightType:t})} className={`flex-1 p-3 border rounded-xl ${newTrip.flightType===t?'border-blue-500 bg-blue-50':''}`}>{t==='direct'?'直航':'轉機'}</button>)}</div></div><div><label className="block text-sm font-bold mb-2">住宿</label><select className="w-full p-2 border rounded-lg" value={newTrip.hotelType} onChange={e=>setNewTrip({...newTrip, hotelType:e.target.value})}>{Object.entries(HOTEL_LABELS).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></div></div><div className="flex justify-between"><button onClick={()=>setStep(1)}>上一步</button><button onClick={()=>setStep(3)} className="bg-blue-600 text-white px-6 py-2 rounded-full">下一步</button></div></div>}
            {step === 3 && <div className="space-y-6"><h2 className="text-2xl font-bold">確認行程</h2><div className="grid grid-cols-2 gap-4">{Object.entries(PURPOSE_MULTIPLIERS).map(([k,v])=><div key={k} onClick={()=>setNewTrip({...newTrip, purpose:k})} className={`p-4 border rounded-xl cursor-pointer ${newTrip.purpose===k?'border-orange-500 bg-orange-50':''}`}><v.icon/><div className="font-bold mt-2">{v.label}</div></div>)}</div><div className="flex justify-between"><button onClick={()=>setStep(2)}>上一步</button><button onClick={createTrip} className="bg-blue-600 text-white px-6 py-2 rounded-full flex items-center gap-2">{loadingWeather ? '生成中...' : '生成行程'}</button></div></div>}
        </div>
      </div>
    );
  }

  if (!currentTrip) { setView('dashboard'); return null; }

  const tripItems = items.filter(i => i.type === activeTab);
  
  // Weather Icon Component to prevent Error #130
  const WeatherIconDisplay = ({ iconKey }) => {
      const IconComponent = WEATHER_ICONS[iconKey] || Sun;
      return <IconComponent size={14} />;
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800 flex flex-col bg-white">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <div className="bg-white border-b sticky top-0 z-20 shadow-sm print:hidden">
        <div className="max-w-4xl mx-auto px-4 flex justify-between items-center py-3">
            <button onClick={() => setView('dashboard')}>← 返回</button>
            <div className="text-center font-bold">{currentTrip.destination}</div>
            <div className="flex gap-2"><button onClick={toggleTripLock}>{currentTrip.isLocked ? <Lock size={16}/> : <Unlock size={16}/>}</button><button onClick={() => setShowPreviewModal(true)}><Eye size={16}/></button></div>
        </div>
        <div className="flex gap-6 px-4 pb-1 overflow-x-auto">
           {[{id:'itinerary', label:'行程'}, {id:'packing', label:'行李'}, {id:'budget', label:'記帳'}, {id:'people', label:'人員'}, {id:'info', label:'資訊'}].map(t=><button key={t.id} onClick={()=>setActiveTab(t.id)} className={`pb-2 ${activeTab===t.id?'border-b-2 border-blue-500 font-bold':''}`}>{t.label}</button>)}
        </div>
      </div>

      <div className="flex-1 max-w-4xl mx-auto w-full p-4 space-y-6 print:hidden">
        {checkInModal && <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"><div className="bg-white rounded-2xl p-6 w-full max-w-sm"><h3 className="font-bold mb-4">📍 打卡</h3><button onClick={handleCheckIn} className="w-full bg-blue-600 text-white py-2 rounded">確認打卡</button><button onClick={()=>setCheckInModal(false)} className="w-full mt-2 text-gray-500">取消</button></div></div>}

        {showSpotSelector && <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"><div className="bg-white rounded-2xl p-6 w-full max-w-lg h-[80vh] overflow-y-auto"><div className="flex justify-between mb-4"><h3 className="font-bold">選擇景點</h3><button onClick={()=>setShowSpotSelector(false)}><X/></button></div>{(POI_DB[currentTrip.destination]||POI_DB['default']).map((s,i)=><div key={i} onClick={()=>{setNewItem({...newItem, title:s.name, cost:s.cost, category:s.category}); setShowSpotSelector(false);}} className="p-3 border-b cursor-pointer hover:bg-gray-50 flex justify-between"><span>{s.name}</span><span className="text-xs text-gray-500">${s.cost}</span></div>)}</div></div>}

        {activeTab === 'itinerary' && (
          <div className="space-y-6">
             <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="bg-red-50 p-3 rounded text-xs text-red-600 font-bold">🚑 急救: {safeCity(currentTrip.destination).emergency.ambulance}</div>
                <div className="bg-green-50 p-3 rounded text-xs text-green-600 font-bold">🚗 叫車: {safeCity(currentTrip.destination).rideApp}</div>
             </div>
             <div className="flex gap-2"><button onClick={handleCheckIn} className="flex-1 bg-blue-600 text-white py-2 rounded shadow flex items-center justify-center gap-2"><Camera size={16}/> 打卡</button></div>
             {Array.from({length: Math.max(1, Math.ceil((new Date(currentTrip.endDate) - new Date(currentTrip.startDate))/(86400000))+1)}).map((_, idx) => {
               const dateStr = new Date(new Date(currentTrip.startDate).getTime() + idx * 86400000).toISOString().split('T')[0];
               const dayItems = items.filter(i => i.type === 'itinerary' && i.date === dateStr).sort((a,b) => (a.startTime > b.startTime ? 1 : -1));
               const w = weatherData[dateStr];
               return (
                 <div key={dateStr} className="bg-white rounded-xl border p-4 shadow-sm">
                    <div className="flex justify-between mb-3 font-bold text-gray-700 border-b pb-2"><span>Day {idx+1} • {dateStr}</span>{w && <div className="flex items-center gap-1 text-xs bg-blue-50 px-2 py-1 rounded-full text-blue-600"><WeatherIconDisplay iconKey={w.iconKey} /> {w.desc} {w.max}°</div>}</div>
                    {dayItems.map(item => (
                       <div key={item.id} className="flex gap-3 mb-3 relative pl-4 border-l-2 border-gray-200">
                          <div className="absolute -left-[5px] top-1 w-2 h-2 rounded-full bg-blue-500"></div>
                          <div className="flex-1" onClick={()=>!currentTrip.isLocked && editItem(item)}>
                             <div className="flex justify-between text-sm"><span className="font-bold">{item.title}</span><span className="font-mono text-xs text-gray-500">{item.startTime}</span></div>
                             <div className="text-xs text-gray-500 mt-1 flex gap-2"><span>{item.duration}</span>{Number(item.cost)>0 && <span className="text-orange-500 font-bold">${item.cost}</span>}</div>
                             {item.notes && <div className="text-xs bg-gray-50 p-1 rounded mt-1 text-gray-600">{item.notes}</div>}
                          </div>
                          {!currentTrip.isLocked && <button onClick={()=>deleteItem(item.id)} className="text-gray-300 hover:text-red-500"><Trash2 size={14}/></button>}
                       </div>
                    ))}
                    {!currentTrip.isLocked && <div className="flex justify-end gap-2 mt-2"><button onClick={()=>openGoogleMapsRoute(dateStr)} className="text-xs border px-2 rounded">地圖</button><button onClick={()=>{setNewItem({...newItem, date:dateStr, type:'itinerary'}); window.scrollTo({top:document.body.scrollHeight, behavior:'smooth'})}} className="text-xs bg-blue-50 text-blue-600 px-2 rounded">+ 新增</button></div>}
                 </div>
               )
             })}
          </div>
        )}

        {/* Packing, Budget, People, Info Tabs - Simplified Rendering */}
        {activeTab === 'packing' && <div className="space-y-2">{items.filter(i=>i.type==='packing').map(i=><div key={i.id} className="flex justify-between p-3 bg-white rounded border text-sm"><span>{i.title}</span><div className="flex items-center gap-2"><span className="text-xs bg-gray-100 px-2 rounded">x{i.quantity}</span>{!currentTrip.isLocked && <button onClick={()=>updateQuantity(i, 1)}>+</button>}</div></div>)}</div>}
        {activeTab === 'budget' && <div className="space-y-2"><div className="bg-emerald-600 text-white p-4 rounded mb-4">總支出: ${budgetStats.total.toLocaleString()}</div>{items.filter(i=>Number(i.cost)>0).map(i=><div key={i.id} className="flex justify-between p-3 bg-white rounded border text-sm"><span>{i.title}</span><span className="font-bold">${i.cost}</span></div>)}</div>}
        {activeTab === 'people' && <div className="space-y-2">{items.filter(i=>i.type==='people').map(p=><div key={p.id} className="p-3 bg-white rounded border relative"><button onClick={()=>deleteItem(p.id)} className="absolute top-2 right-2 text-gray-300"><Trash2 size={14}/></button><div className="font-bold">{p.title}</div><div className="text-xs text-gray-500">{p.notes}</div></div>)}</div>}
        {activeTab === 'info' && <div className="space-y-4">{['shopping','food','transport'].map(c=><div key={c}><h3 className="font-bold mb-2 uppercase">{c}</h3><div className="grid grid-cols-2 gap-2">{(POI_DB[currentTrip.destination]||POI_DB['default']).filter(s=>s.category===c).map((s,i)=><div key={i} className="p-2 border rounded bg-white"><div className="font-bold text-sm">{s.name}</div><div className="text-xs text-gray-500">${s.cost}</div><button onClick={()=>addSpotFromInfo(s)} className="w-full mt-1 bg-blue-50 text-blue-600 text-xs rounded">加入</button></div>)}</div></div>)}</div>}

        {!checkInModal && !currentTrip.isLocked && activeTab !== 'info' && (
           <form onSubmit={addItem} className="bg-white p-4 shadow-lg border-t sticky bottom-0 z-10 flex gap-2">
              {activeTab === 'itinerary' && <button type="button" onClick={()=>setShowSpotSelector(true)} className="text-orange-500"><Star size={20}/></button>}
              <input className="flex-1 border p-2 rounded" placeholder="名稱" value={newItem.title||newItem.pName} onChange={e=>setNewItem({...newItem, title:e.target.value, pName:e.target.value})}/>
              {(activeTab==='budget'||activeTab==='itinerary') && <input type="number" className="w-20 border p-2 rounded" placeholder="$" value={newItem.foreignCost} onChange={e=>handleForeignCostChange(e.target.value, newItem.currency)}/>}
              <button type="submit" className="bg-blue-600 text-white p-2 rounded"><Plus/></button>
           </form>
        )}
      </div>
    </div>
  );
}

export default TravelApp;
