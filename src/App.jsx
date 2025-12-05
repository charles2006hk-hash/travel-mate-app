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
  AlertCircle, Check, RefreshCw as RefreshIcon, Users, CreditCard, Ticket, Phone, ArrowRight, Star, BedDouble, Mountain
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

// --- 3. 資料庫與常數 ---

const CITY_DATA = {
  "東京": { lat: 35.6762, lon: 139.6503, currency: "JPY", region: "JP", img: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&q=80", intro: "傳統與未來交織的城市。", emergency: { police: "110", ambulance: "119" }, rideApp: "Uber / GO / DiDi" },
  "大阪": { lat: 34.6937, lon: 135.5023, currency: "JPY", region: "JP", img: "https://images.unsplash.com/photo-1590559899731-a382839e5549?w=400&q=80", intro: "美食之都。", emergency: { police: "110", ambulance: "119" }, rideApp: "Uber / GO / DiDi" },
  "京都": { lat: 35.0116, lon: 135.7681, currency: "JPY", region: "JP", img: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=400&q=80", intro: "千年古都。", emergency: { police: "110", ambulance: "119" }, rideApp: "MK Taxi / Uber" },
  "札幌": { lat: 43.0618, lon: 141.3545, currency: "JPY", region: "JP", img: "https://images.unsplash.com/photo-1516900557549-41557d405adf?w=400&q=80", intro: "北國雪景。", emergency: { police: "110", ambulance: "119" }, rideApp: "Uber / GO" },
  "福岡": { lat: 33.5902, lon: 130.4017, currency: "JPY", region: "JP", img: "https://images.unsplash.com/photo-1570459027562-4a916cc6113f?w=400&q=80", intro: "九州門戶。", emergency: { police: "110", ambulance: "119" }, rideApp: "Uber / GO" },
  "首爾": { lat: 37.5665, lon: 126.9780, currency: "KRW", region: "KR", img: "https://images.unsplash.com/photo-1538669716383-71cc735d4872?w=400&q=80", intro: "韓流中心。", emergency: { police: "112", ambulance: "119" }, rideApp: "Kakao T / Uber" },
  "釜山": { lat: 35.1796, lon: 129.0756, currency: "KRW", region: "KR", img: "https://images.unsplash.com/photo-1596788502256-4c4f9273c3cb?w=400&q=80", intro: "海港城市。", emergency: { police: "112", ambulance: "119" }, rideApp: "Kakao T" },
  "台北": { lat: 25.0330, lon: 121.5654, currency: "TWD", region: "TW", img: "https://images.unsplash.com/photo-1590523277543-a94d2e4eb00b?w=400&q=80", intro: "美食天堂。", emergency: { police: "110", ambulance: "119" }, rideApp: "Uber / 55688" },
  "曼谷": { lat: 13.7563, lon: 100.5018, currency: "THB", region: "TH", img: "https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=400&q=80", intro: "不夜城。", emergency: { police: "191", ambulance: "1669" }, rideApp: "Grab / Bolt" },
  "倫敦": { lat: 51.5074, lon: -0.1278, currency: "GBP", region: "UK", img: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=400&q=80", intro: "歷史名城。", emergency: { police: "999", ambulance: "999" }, rideApp: "Uber / Bolt / Addison Lee" },
  "巴黎": { lat: 48.8566, lon: 2.3522, currency: "EUR", region: "EU", img: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400&q=80", intro: "浪漫之都。", emergency: { police: "17", ambulance: "15" }, rideApp: "Uber / Bolt / G7" },
  "香港": { lat: 22.3193, lon: 114.1694, currency: "HKD", region: "HK", img: "https://images.unsplash.com/photo-1518599801797-737c8d02e8e7?w=400&q=80", intro: "東方之珠。", emergency: { police: "999", ambulance: "999" }, rideApp: "Uber / HKTaxi" },
  "雪梨": { lat: -33.8688, lon: 151.2093, currency: "AUD", region: "AU", img: "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=400&q=80", intro: "澳洲最大城市。", emergency: { police: "000", ambulance: "000" }, rideApp: "Uber / DiDi" },
  "墨爾本": { lat: -37.8136, lon: 144.9631, currency: "AUD", region: "AU", img: "https://images.unsplash.com/photo-1510265119258-db115b0e8172?w=400&q=80", intro: "文化與咖啡之都。", emergency: { police: "000", ambulance: "000" }, rideApp: "Uber / DiDi" },
  "布里斯本": { lat: -27.4705, lon: 153.0260, currency: "AUD", region: "AU", img: "https://images.unsplash.com/photo-1562657523-2679c2937397?w=400&q=80", intro: "陽光之城。", emergency: { police: "000", ambulance: "000" }, rideApp: "Uber / DiDi" },
  "黃金海岸": { lat: -28.0167, lon: 153.4000, currency: "AUD", region: "AU", img: "https://images.unsplash.com/photo-1506953823976-52e1fdc0149a?w=400&q=80", intro: "衝浪者天堂。", emergency: { police: "000", ambulance: "000" }, rideApp: "Uber / DiDi" },
};

const POPULAR_CITIES = Object.keys(CITY_DATA);
const POPULAR_ORIGINS = ["香港", "台北", "高雄", "澳門", "東京", "倫敦", "紐約", "雪梨", "墨爾本"];
const EXCHANGE_RATES = { "HKD": 1, "JPY": 0.052, "KRW": 0.0058, "TWD": 0.25, "THB": 0.22, "SGD": 5.8, "GBP": 9.9, "EUR": 8.5, "USD": 7.8, "CNY": 1.1, "AUD": 5.1 };

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

// 景點資料庫
const POI_DB = {
  "東京": [{ name: "東京迪士尼", category: "transport", cost: 600, time: "全日", note: "夢幻王國", lat: 35.6329, lon: 139.8804, img: "https://images.unsplash.com/photo-1545582379-34e8ce6a3092?w=400&q=80", desc: "亞洲第一座迪士尼樂園。" }, { name: "淺草寺", category: "transport", cost: 0, time: "2h", note: "雷門打卡", lat: 35.7147, lon: 139.7967, img: "https://images.unsplash.com/photo-1596395914619-338d9b52c007?w=400&q=80", desc: "東京最古老的寺廟。" }, { name: "東京晴空塔", category: "transport", cost: 200, time: "2h", note: "俯瞰東京全景", lat: 35.7100, lon: 139.8107, img: "https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?w=400&q=80", desc: "世界最高的自立式電波塔。" }, { name: "築地場外市場", category: "food", cost: 300, time: "2h", note: "新鮮壽司", lat: 35.6655, lon: 139.7707, img: "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=400&q=80", desc: "東京的廚房。" }, { name: "銀座商圈", category: "shopping", cost: 0, time: "3h", note: "高級精品與百貨", lat: 35.6712, lon: 139.7665, img: "https://images.unsplash.com/photo-1554797589-7241bb691973?w=400&q=80", desc: "東京最繁華的高級購物區。" }],
  "大阪": [{ name: "環球影城", category: "transport", cost: 650, time: "全日", note: "任天堂世界", lat: 34.6654, lon: 135.4323, img: "https://images.unsplash.com/photo-1623941000802-38fadd7f7b3b?w=400&q=80", desc: "世界級主題樂園。" }, { name: "道頓堀", category: "food", cost: 200, time: "3h", note: "美食吃到飽", lat: 34.6687, lon: 135.5013, img: "https://images.unsplash.com/photo-1590559899731-a382839e5549?w=400&q=80", desc: "大阪美食心臟。" }, { name: "大阪城天守閣", category: "transport", cost: 50, time: "2h", note: "歷史古蹟", lat: 34.6873, lon: 135.5262, img: "https://images.unsplash.com/photo-1555428456-62846879d75b?w=400&q=80", desc: "日本三名城之一。" }, { name: "海遊館", category: "transport", cost: 180, time: "3h", note: "世界最大級水族館", lat: 34.6545, lon: 135.4289, img: "https://images.unsplash.com/photo-1596395914619-338d9b52c007?w=400&q=80", desc: "展示環太平洋火山帶生態。" }, { name: "心齋橋筋", category: "shopping", cost: 0, time: "3h", note: "購物天堂", lat: 34.6713, lon: 135.5014, img: "https://images.unsplash.com/photo-1567972318528-6c6773777e36?w=400&q=80", desc: "大阪最著名的購物街。" }],
  "雪梨": [{ name: "雪梨歌劇院", category: "transport", cost: 200, time: "2h", note: "世界遺產", lat: -33.8568, lon: 151.2153, img: "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=400&q=80", desc: "經典地標。" }, { name: "邦迪海灘", category: "transport", cost: 0, time: "3h", note: "衝浪", lat: -33.8915, lon: 151.2767, img: "https://images.unsplash.com/photo-1523428098666-1a6a90e96033?w=400&q=80", desc: "澳洲最著名海灘。" }, { name: "雪梨魚市場", category: "food", cost: 250, time: "2h", note: "生蠔龍蝦午餐", lat: -33.8732, lon: 151.1923, img: "https://images.unsplash.com/photo-1621316279476-b33344662867?w=400&q=80", desc: "南半球最大的海鮮市場。" }, { name: "維多利亞女王大廈", category: "shopping", cost: 0, time: "2h", note: "古蹟內購物", lat: -33.8718, lon: 151.2067, img: "https://images.unsplash.com/photo-1596527588365-d4e77243c220?w=400&q=80", desc: "羅馬式建築風格的購物中心。" }],
  "default": [{ name: "市中心地標", category: "transport", cost: 0, time: "1h", note: "打卡點", lat: 0, lon: 0, img: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=400&q=80", desc: "城市中心。" }, { name: "當地博物館", category: "transport", cost: 100, time: "2h", note: "文化體驗", lat: 0, lon: 0, img: "https://images.unsplash.com/photo-1566127444979-b3d2b654e3d7?w=400&q=80", desc: "收藏豐富的文化遺產。" }]
};

const calculateDistance = (lat1, lon1, lat2, lon2) => { const R = 6371; const dLat = (lat2 - lat1) * Math.PI / 180; const dLon = (lon2 - lon1) * Math.PI / 180; const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2); return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); };

// --- Custom Components ---

const Toast = ({ message, type, onClose }) => {
  useEffect(() => { const timer = setTimeout(onClose, 3000); return () => clearTimeout(timer); }, [onClose]);
  return <div className={`fixed bottom-8 left-1/2 transform -translate-x-1/2 ${type === 'error' ? 'bg-red-500' : 'bg-green-600'} text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 z-[100] animate-bounce-in font-bold border border-white/20 backdrop-blur-md`}><CheckCircle2 size={20} /><span className="text-sm">{message}</span></div>;
};

const getLunarInfo = (date) => {
  const m = date.getMonth() + 1; const d = date.getDate();
  if (m === 1 && d === 1) return "元旦"; if (m === 12 && d === 25) return "聖誕"; if (m === 4 && d === 4) return "兒童";
  const baseDate = new Date(2024, 1, 10); const diffDays = Math.floor((date - baseDate) / 86400000); const lunarDayIndex = (diffDays % 29 + 29) % 29 + 1;
  if (lunarDayIndex === 1) return "初一"; if (lunarDayIndex === 15) return "十五";
  if (m===2 && d===10) return "春節";
  return null;
};

const RangeCalendar = ({ startDate, endDate, onChange, onClose }) => {
  const [currentMonth, setCurrentMonth] = useState(startDate ? new Date(startDate) : new Date());
  const daysInMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  const formatDate = (y, m, d) => `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  
  const handleDateClick = (day) => {
    const dateStr = formatDate(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    if (!startDate || (startDate && endDate)) { onChange({ startDate: dateStr, endDate: '' }); } 
    else { 
        if (dateStr < startDate) { onChange({ startDate: dateStr, endDate: startDate }); setTimeout(onClose, 300); } 
        else { onChange({ startDate: startDate, endDate: dateStr }); setTimeout(onClose, 300); } 
    }
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
          const dateObj = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
          const holiday = getLunarInfo(dateObj); const isWeekend = dateObj.getDay()===0 || dateObj.getDay()===6;
          const isToday = dateStr === new Date().toISOString().split('T')[0];

          return (
            <button key={day} type="button" onClick={() => handleDateClick(day)} className={`h-10 w-full rounded-lg text-sm flex flex-col items-center justify-center transition-all relative border border-transparent
                ${selected ? 'bg-blue-600 text-white font-bold shadow-lg scale-105 z-10' : ''}
                ${inRange ? 'bg-blue-50 text-blue-600 rounded-none' : ''}
                ${!selected && !inRange ? 'hover:bg-gray-50' : ''}
                ${isToday && !selected ? 'ring-2 ring-yellow-400' : ''}
                ${(isWeekend || holiday) && !selected && !inRange ? 'text-red-500' : ''}
              `}>
              <span>{day}</span>
              {holiday && <span className={`text-[8px] scale-90 -mt-1 ${selected ? 'text-blue-200' : 'text-red-400'}`}>{holiday}</span>}
            </button>
          );
        })}
      </div>
      <div className="mt-3 text-center text-xs text-blue-600 font-medium border-t pt-2 cursor-pointer hover:text-blue-800" onClick={onClose}>完成 / 關閉</div>
    </div>
  );
};

// --- Helper: Logic ---
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
  useEffect(() => { if (currentTrip && CITY_DATA[currentTrip.destination]) { const { lat, lon } = CITY_DATA[currentTrip.destination]; fetchDailyWeather(lat, lon, currentTrip.startDate, currentTrip.endDate).then(data => setWeatherData(data)); } }, [currentTrip]);

  const updateTripActualCost = async (tripId) => { if (!user || !tripId) return; try { const q = query(collection(db, 'artifacts', APP_ID, 'users', user.uid, 'sub_items'), where('tripId', '==', tripId)); const snapshot = await getDocs(q); const total = snapshot.docs.reduce((sum, doc) => sum + (Number(doc.data().cost) || 0), 0); await updateDoc(doc(db, 'artifacts', APP_ID, 'users', user.uid, 'trips', tripId), { actualCost: total }); } catch (e) { console.error(e); } };

  // Core Logic: AI Budget Calculation
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

    setNewTrip(prev => ({ ...prev, estimatedBudget: Math.round(total), budgetDetails: { flight: Math.round(estimatedFlight), hotel: Math.round(estimatedHotel), food: Math.round(estimatedFood), transport: Math.round(estimatedTransport), shopping: Math.round(extraShopping), days } }));
  };
  useEffect(() => { if (newTrip.destination && newTrip.startDate && newTrip.endDate) calculateEstimatedBudget(); }, [newTrip.destination, newTrip.startDate, newTrip.endDate, newTrip.travelers, newTrip.purpose, newTrip.flightType, newTrip.hotelType]);

  // CRUD & Actions
  const handleGoogleLink = async () => { try { if (user.isAnonymous) await linkWithPopup(user, googleProvider); else showToast("已登入", "success"); } catch (error) { if (error.code === 'auth/credential-already-in-use') { if(confirm("此帳號已有資料，是否切換？")) await signInWithPopup(auth, googleProvider); } } };
  const handleExportData = () => { const data = { user: user.uid, trips: trips, items: items, exportedAt: new Date().toISOString() }; const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `travel_backup.json`; a.click(); };
  const toggleTripLock = async () => { await updateDoc(doc(db, 'artifacts', APP_ID, 'users', user.uid, 'trips', currentTrip.id), { isLocked: !currentTrip.isLocked }); setCurrentTrip(prev => ({...prev, isLocked: !prev.isLocked})); showToast(currentTrip.isLocked ? "行程已解鎖" : "行程已鎖定", "success"); };
  const handlePrint = () => window.print();

  const createTrip = async () => {
    if (!newTrip.startDate || !newTrip.endDate) return showToast("請選擇日期", "error");
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
      setView('dashboard');
      setStep(0);
      showToast("AI 行程已建立！", "success");
    } catch (error) { console.error(error); setLoadingWeather(false); showToast("建立失敗", "error"); }
  };

  const deleteTrip = async (id, e) => { e.stopPropagation(); if (confirm("確定刪除？")) await deleteDoc(doc(db, 'artifacts', APP_ID, 'users', user.uid, 'trips', id)); };
  const openTrip = (trip) => { setCurrentTrip(trip); setView('trip-detail'); setNewItem({ ...newItem, date: trip.startDate, currency: CITY_DATA[trip.destination]?.currency || 'HKD' }); };
  const handleForeignCostChange = (amount, currency) => { const rate = EXCHANGE_RATES[currency] || 1; setNewItem(prev => ({ ...prev, foreignCost: amount, currency: currency, cost: Math.round(amount * rate) })); };
  
  // FIX: weight/volume default value issue
  const addItem = async (e) => {
    if(e) e.preventDefault();
    if ((!newItem.title && !newItem.pName) && !checkInModal) return; if (currentTrip.isLocked) return showToast("已鎖定", "error");
    if (activeTab === 'people') {
        await addDoc(collection(db, 'artifacts', APP_ID, 'users', user.uid, 'sub_items'), { tripId: currentTrip.id, type: 'people', title: newItem.pName, notes: `房號: ${newItem.pRoom}`, pId: newItem.pId, pPhone: newItem.pPhone, completed: false, createdAt: serverTimestamp() });
        setNewItem({...newItem, pName:'', pId:'', pPhone:'', pRoom:''}); return showToast("人員已新增", "success");
    }
    let finalNotes = newItem.notes; 
    if (newItem.foreignCost && newItem.currency !== 'HKD') finalNotes = `${newItem.currency} ${newItem.foreignCost} (匯率 ${EXCHANGE_RATES[newItem.currency]}) ${finalNotes}`;
    
    // FIX: Ensure numeric fields are never undefined
    const payload = { 
        ...newItem, 
        notes: finalNotes, 
        weight: Number(newItem.weight) || 0, 
        volume: Number(newItem.volume) || 0, 
        cost: Number(newItem.cost) || 0,
        tripId: currentTrip.id, 
        completed: false, 
        createdAt: serverTimestamp() 
    };

    if (editingItem) { await updateDoc(doc(db, 'artifacts', APP_ID, 'users', user.uid, 'sub_items', editingItem), payload); setEditingItem(null); } 
    else { await addDoc(collection(db, 'artifacts', APP_ID, 'users', user.uid, 'sub_items'), payload); }
    
    setNewItem({ ...newItem, title: '', cost: '', foreignCost: '', notes: '', quantity: 1, weight: 0, startTime: '', duration: '' }); 
    setCheckInModal(false); setShowSpotSelector(false);
    showToast("項目已新增", "success");
  };

  const handleCheckIn = () => {
    if (currentTrip.isLocked) return showToast("已鎖定", "error"); if (!navigator.geolocation) return showToast("不支援定位", "error");
    navigator.geolocation.getCurrentPosition((pos) => {
       const { latitude, longitude } = pos.coords; const t = new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
       const citySpots = POI_DB[currentTrip.destination] || []; let nearbySpot = null; let minDistance = 5; 
       citySpots.forEach(spot => { if (spot.lat && spot.lon) { const d = calculateDistance(latitude, longitude, spot.lat, spot.lon); if (d < minDistance) { minDistance = d; nearbySpot = spot; } } });
       setNewItem(prev => ({ ...prev, type: 'itinerary', title: nearbySpot ? `📍 打卡: ${nearbySpot.name} (附近)` : `📍 打卡 (${latitude.toFixed(2)}, ${longitude.toFixed(2)})`, 
         date: new Date().toISOString().split('T')[0], startTime: t, notes: nearbySpot ? `位於 ${nearbySpot.name} 附近` : '', cost: '', category: 'transport', isCheckIn: true 
       }));
       setCheckInModal(true);
    }, () => showToast("定位失敗", "error"));
  };
  
  const addSpotFromInfo = (spot) => {
    setActiveTab('itinerary'); setNewItem({ ...newItem, type: 'itinerary', category: spot.category || 'transport', title: spot.name, cost: spot.cost || 0, notes: spot.note || '', duration: spot.time || '2h', date: currentTrip.startDate }); window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }); showToast(`已選 ${spot.name}`, "success");
  };

  const deleteItem = async (id) => { if (currentTrip.isLocked) return showToast("已鎖定", "error"); if(!confirm("確定刪除？")) return; await deleteDoc(doc(db, 'artifacts', APP_ID, 'users', user.uid, 'sub_items', id)); setTimeout(() => updateTripActualCost(currentTrip.id), 500); };
  const toggleItemComplete = async (item) => updateDoc(doc(db, 'artifacts', APP_ID, 'users', user.uid, 'sub_items', item.id), { completed: !item.completed });
  const updateQuantity = async (item, delta) => { if (currentTrip.isLocked) return; const newQty = Math.max(1, (item.quantity || 1) + delta); await updateDoc(doc(db, 'artifacts', APP_ID, 'users', user.uid, 'sub_items', item.id), { quantity: newQty }); };
  const editItem = (item) => { if (currentTrip.isLocked) return showToast("已鎖定", "error"); setNewItem({ ...item, foreignCost: item.foreignCost || '', currency: item.currency || 'HKD' }); setEditingItem(item.id); };
  const openGoogleMapsRoute = (date) => {
    const points = items.filter(i => i.type === 'itinerary' && i.date === date).sort((a,b) => (a.startTime > b.startTime ? 1 : -1));
    if (points.length === 0) return showToast("無行程", "error");
    const origin = points[0].title; const destination = points[points.length - 1].title;
    window.open(`https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}`, '_blank');
  };

  const luggageStats = useMemo(() => { const packingItems = items.filter(i => i.type === 'packing'); const totalWeight = packingItems.reduce((sum, i) => sum + (Number(i.weight || 0) * Number(i.quantity || 1)), 0); return { totalWeight: totalWeight.toFixed(1), suggestion: totalWeight > 15 ? "24吋+" : "20吋" }; }, [items]);
  const budgetStats = useMemo(() => { const budgetItems = items.filter(i => i.cost && (i.type === 'budget' || i.type === 'itinerary')); const stats = { shopping: 0, food: 0, stay: 0, transport: 0, other: 0, total: 0 }; budgetItems.forEach(i => { const cost = Number(i.cost) || 0; const cat = i.category || 'other'; if (stats[cat] !== undefined) stats[cat] += cost; else stats.other += cost; stats.total += cost; }); return stats; }, [items]);

  const TravelerCounter = ({ label, icon: Icon, value, field }) => (
    <div className="flex justify-between items-center bg-gray-50 p-3 rounded-xl">
      <span className="flex items-center gap-2 text-sm font-medium text-gray-600"><Icon size={16}/> {label}</span>
      <div className="flex items-center gap-3">
        <button type="button" onClick={()=>setNewTrip(p=>({...p, travelers:{...p.travelers, [field]:Math.max(0, p.travelers[field]-1)}}))} className="w-6 h-6 bg-white rounded-full border shadow-sm flex items-center justify-center text-gray-500 hover:bg-gray-100">-</button>
        <span className="w-4 text-center text-sm font-bold">{value}</span>
        <button type="button" onClick={()=>setNewTrip(p=>({...p, travelers:{...p.travelers, [field]:p.travelers[field]+1}}))} className="w-6 h-6 bg-white rounded-full border shadow-sm flex items-center justify-center text-blue-600 hover:bg-blue-50">+</button>
      </div>
    </div>
  );

  const ReportTemplate = () => {
    // Safety check
    if (!currentTrip) return null;
    
    const dayDiff = Math.max(1, Math.ceil((new Date(currentTrip.endDate) - new Date(currentTrip.startDate))/(86400000))+1);
    const dateArray = Array.from({length: dayDiff}).map((_, i) => new Date(new Date(currentTrip.startDate).getTime() + i * 86400000).toISOString().split('T')[0]);
    return (
      <div className="bg-white text-gray-800 font-sans p-8 max-w-[210mm] mx-auto min-h-[297mm] relative">
         <div className="border-b-4 border-double border-gray-800 pb-6 mb-8 text-center font-serif">
             <div className="flex items-center justify-center gap-2 text-gray-500 text-sm mb-2 uppercase tracking-widest"><Plane size={14} /> Travel Itinerary</div>
             <h1 className="text-4xl font-bold text-gray-900 mb-3">{user?.displayName || '親愛的旅客'} 的 {currentTrip.destination} 之旅</h1>
             <p className="text-lg text-gray-600 italic">{currentTrip.startDate} — {currentTrip.endDate} • {dayDiff} 天</p>
         </div>
         <div className="flex flex-row gap-8 items-start">
            <div className="w-[65%]">
               <h2 className="text-xl font-bold border-b-2 border-gray-800 pb-2 mb-4 flex items-center gap-2"><MapPin size={20} className="text-blue-600"/> 每日行程</h2>
               <div className="space-y-6">
                  {dateArray.map((dateStr, idx) => {
                     const dayItems = items.filter(i => i.type === 'itinerary' && i.date === dateStr).sort((a,b) => (a.startTime > b.startTime ? 1 : -1));
                     return (
                        <div key={dateStr} className="relative pl-4 border-l-2 border-gray-200 break-inside-avoid">
                           <div className="absolute -left-[5px] top-0 w-2.5 h-2.5 rounded-full bg-blue-600"></div>
                           <div className="flex justify-between items-center mb-2"><h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide">Day {idx+1} • {dateStr}</h3></div>
                           {dayItems.map(item => (<div key={item.id} className="text-sm"><span className="font-bold text-gray-800 mr-2">{item.startTime || '待定'}</span><span className="text-gray-700">{item.title}</span></div>))}
                        </div>
                     )
                  })}
               </div>
            </div>
            <div className="w-[35%] space-y-8">
               <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 break-inside-avoid"><h3 className="font-bold text-gray-700 mb-3 flex items-center gap-2 text-sm uppercase"><Calculator size={14}/> 財務概況</h3><div className="space-y-2 text-sm"><div className="flex justify-between"><span>總預算</span><span className="font-bold">${currentTrip.estimatedBudget?.toLocaleString()}</span></div><div className="flex justify-between text-blue-600"><span>預計支出</span><span className="font-bold">${budgetStats.total.toLocaleString()}</span></div></div></div>
               {/* Report: People List */}
               <div className="break-inside-avoid">
                  <h3 className="font-bold text-gray-800 border-b pb-1 mb-3 text-sm uppercase flex items-center gap-2"><Users size={14}/> 同行人員</h3>
                  <div className="text-xs text-gray-600 space-y-2">
                     {items.filter(i => i.type === 'people').map(p => (
                        <div key={p.id} className="flex justify-between border-b border-gray-100 pb-1">
                           <span className="font-bold">{p.title}</span>
                           <span className="text-gray-400">{p.notes?.split(' ')[1]}</span>
                        </div>
                     ))}
                  </div>
               </div>
               <div className="break-inside-avoid">
                  <h3 className="font-bold text-gray-800 border-b pb-1 mb-3 text-sm uppercase flex items-center gap-2"><Briefcase size={14}/> 必帶物品</h3>
                  <div className="text-xs text-gray-600 space-y-1">
                     {items.filter(i => i.type === 'packing').map(item => (
                        <div key={item.id} className="flex items-center gap-2">
                           <div className="w-3 h-3 border border-gray-400 rounded-sm"></div><span>{item.title}</span>{item.quantity > 1 && <span className="text-gray-400">x{item.quantity}</span>}
                        </div>
                     ))}
                  </div>
               </div>
            </div>
         </div>
      </div>
    );
  };

  // --- Render ---
  if (showPreviewModal) { return <div className="min-h-screen bg-gray-100 flex flex-col items-center"><div className="w-full bg-white shadow-md p-4 sticky top-0 z-50 flex justify-between items-center print:hidden"><h2 className="font-bold text-gray-700 flex items-center gap-2"><Eye size={20}/> 閱讀模式</h2><div className="flex gap-2"><button onClick={handlePrint} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2 shadow-sm active:scale-95"><Printer size={16}/> 列印</button><button onClick={()=>setShowPreviewModal(false)} className="text-gray-500 hover:bg-gray-100 p-2 rounded-lg"><X size={20}/></button></div></div><div className="w-full max-w-[210mm] bg-white shadow-xl my-8 print:shadow-none print:m-0 print:w-full"><ReportTemplate /></div></div>; }

  if (view === 'dashboard') {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans text-gray-800">
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        {isUpdating && <div className="fixed top-0 left-0 w-full bg-blue-600 text-white text-xs py-1 text-center z-[70] flex items-center justify-center gap-2 animate-pulse"><RefreshIcon size={12} className="animate-spin"/> 正在同步全球旅遊資訊庫...</div>}

        <div className="max-w-4xl mx-auto space-y-6 pt-6">
           <header className="flex justify-between items-center mb-8"><h1 className="text-2xl font-bold text-blue-900 flex items-center gap-2"><Plane className="text-blue-600" /> 智能旅遊管家</h1><div className="flex gap-2"><button onClick={handleExportData} className="p-2 bg-white rounded-full shadow text-gray-500"><Download size={18}/></button><button onClick={() => setShowUserModal(true)} className="bg-white px-4 py-2 rounded-full shadow-sm border text-sm text-gray-600 hover:bg-gray-50 flex items-center gap-2"><User size={18}/> {user?.isAnonymous?'訪客':'已綁定'}</button></div></header>
           
           {showUserModal && <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"><div className="bg-white rounded-2xl p-6 w-full max-w-sm relative shadow-2xl"><button onClick={()=>setShowUserModal(false)} className="absolute top-4 right-4">X</button><h3 className="font-bold mb-4">用戶中心</h3><div className="mb-4 text-xs text-gray-400 break-all">ID: {user?.uid}</div><button onClick={handleGoogleLink} className="w-full bg-orange-50 text-orange-600 py-3 rounded-xl mb-2 font-bold border border-orange-100 flex justify-center gap-2"><LogIn size={18}/> 綁定 Google 帳號 (永久保存)</button><button onClick={handleExportData} className="w-full bg-gray-50 py-3 rounded-xl text-sm text-gray-600">備份資料 (JSON)</button></div></div>}

           {/* Add New Trip Card */}
           <div onClick={() => {setNewTrip({origin:'香港', destination:'', startDate:'', endDate:'', purpose:'sightseeing', travelers:{adults:1, children:0, toddlers:0, elderly:0}, flightType:'direct', hotelType:'4star', estimatedBudget:0, budgetDetails:{}}); setStep(0); setView('create-trip');}} className="bg-gradient-to-br from-blue-500 to-indigo-600 p-8 rounded-3xl shadow-lg cursor-pointer transform hover:scale-[1.02] transition-all text-white flex items-center justify-between group">
              <div><h2 className="text-2xl font-bold mb-2">開啟新的旅程</h2><p className="opacity-80">AI 智能規劃 • 自動預算 • 行李清單</p></div>
              <div className="bg-white/20 p-4 rounded-full group-hover:bg-white/30 transition-colors"><Plus size={32}/></div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             {trips.map(trip => (
               <div key={trip.id} onClick={() => openTrip(trip)} className="bg-white rounded-2xl shadow-sm hover:shadow-md cursor-pointer overflow-hidden border border-gray-100 transition-all group">
                 <div className="h-32 bg-gray-200 relative">
                    <img src={CITY_DATA[trip.destination]?.img} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"/>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4"><h3 className="text-xl font-bold text-white">{trip.destination}</h3></div>
                    <button onClick={(e) => deleteTrip(trip.id, e)} className="absolute top-2 right-2 bg-white/20 backdrop-blur p-2 rounded-full text-white hover:bg-red-500 hover:text-white transition-colors"><Trash2 size={14}/></button>
                 </div>
                 <div className="p-4">
                    <div className="flex justify-between items-center text-sm text-gray-500 mb-3">
                       <span className="flex items-center gap-1"><CalIcon size={14}/> {trip.startDate}</span>
                       {trip.startDate && trip.endDate && (
                         <span className="bg-gray-100 px-2 py-1 rounded text-xs">
                           {Math.max(1, Math.ceil((new Date(trip.endDate) - new Date(trip.startDate))/(86400000))+1)} 天
                         </span>
                       )}
                    </div>
                    <div className="flex gap-2">
                       <div className="flex-1 bg-green-50 rounded-lg p-2 text-center"><div className="text-[10px] text-green-600 uppercase font-bold">預算</div><div className="text-sm font-bold text-green-800">${trip.estimatedBudget?.toLocaleString()}</div></div>
                       <div className="flex-1 bg-blue-50 rounded-lg p-2 text-center"><div className="text-[10px] text-blue-600 uppercase font-bold">實際</div><div className="text-sm font-bold text-blue-800">${trip.actualCost?.toLocaleString() || 0}</div></div>
                    </div>
                 </div>
               </div>
             ))}
           </div>
        </div>
      </div>
    );
  }

  // Wizard / Dashboard View
  if (view === 'create-trip') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        <div className="bg-white p-4 shadow-sm flex items-center justify-between"><button onClick={() => setView('dashboard')} className="text-gray-500 hover:bg-gray-100 p-2 rounded-full"><ArrowRight size={20} className="rotate-180"/></button><div className="font-bold text-lg">規劃新旅程</div><div className="w-10"></div></div>
        <div className="flex-1 overflow-y-auto p-6 max-w-2xl mx-auto w-full space-y-8">
            
            {/* Step 1: Location */}
            {step === 0 && (
                <div className="space-y-6 animate-fade-in">
                    <h2 className="text-2xl font-bold text-gray-800">您想去哪裡探險？</h2>
                    <div><label className="text-sm font-bold text-gray-500 mb-2 block">出發地</label><div className="flex flex-wrap gap-2">{POPULAR_ORIGINS.map(c=><button key={c} onClick={()=>setNewTrip({...newTrip, origin:c})} className={`px-4 py-2 rounded-full text-sm transition-all ${newTrip.origin===c?'bg-blue-600 text-white shadow-md':'bg-white border hover:bg-gray-50'}`}>{c}</button>)}</div></div>
                    <div>
                        <label className="text-sm font-bold text-gray-500 mb-3 block">熱門目的地</label>
                        <div className="grid grid-cols-2 gap-4">
                            {POPULAR_CITIES.map(city => (
                                <div key={city} onClick={()=>{setNewTrip({...newTrip, destination:city}); setStep(1)}} className="relative h-32 rounded-2xl overflow-hidden cursor-pointer group shadow-sm hover:shadow-lg transition-all">
                                    <img src={CITY_DATA[city].img} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"/>
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex flex-col justify-end p-3"><span className="text-white font-bold text-lg">{city}</span><span className="text-white/80 text-xs">{CITY_DATA[city].region}</span></div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Step 2: Date */}
            {step === 1 && (
                <div className="space-y-6 animate-fade-in">
                    <h2 className="text-2xl font-bold text-gray-800">什麼時候出發？</h2>
                    <div className="flex justify-center"><RangeCalendar startDate={newTrip.startDate} endDate={newTrip.endDate} onChange={({startDate, endDate}) => setNewTrip({...newTrip, startDate, endDate})} /></div>
                    {newTrip.startDate && newTrip.endDate && <div className="bg-blue-50 text-blue-700 p-3 rounded-lg text-center font-bold text-sm">共 {Math.max(1, Math.ceil((new Date(newTrip.endDate) - new Date(newTrip.startDate))/(1000 * 60 * 60 * 24)) + 1)} 天</div>}
                    <div className="flex justify-between pt-4"><button onClick={()=>setStep(0)} className="text-gray-500">上一步</button><button onClick={()=>{if(newTrip.startDate && newTrip.endDate) setStep(2); else showToast("請選擇日期", "error")}} className="bg-blue-600 text-white px-8 py-3 rounded-full font-bold shadow-lg hover:scale-105 transition-transform">下一步</button></div>
                </div>
            )}

            {/* Step 3: Logistics */}
            {step === 2 && (
                <div className="space-y-6 animate-fade-in">
                    <h2 className="text-2xl font-bold text-gray-800">交通與住宿偏好</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm text-gray-500 font-bold mb-2 block">機票選擇</label>
                            <div className="grid grid-cols-2 gap-3">
                                {['direct', 'transfer'].map(t => (
                                    <div key={t} onClick={()=>setNewTrip({...newTrip, flightType:t})} className={`p-4 rounded-xl border-2 cursor-pointer flex flex-col items-center gap-2 transition-all ${newTrip.flightType===t?'border-blue-500 bg-blue-50 text-blue-700':'border-gray-100 hover:border-blue-200'}`}>
                                        <Plane size={24} className={newTrip.flightType===t?'text-blue-500':'text-gray-400'}/>
                                        <span className="font-bold">{t==='direct'?'直航':'轉機'}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="text-sm text-gray-500 font-bold mb-2 block">住宿等級</label>
                            <div className="space-y-2">
                                {Object.entries(HOTEL_LABELS).map(([key, label]) => (
                                    <div key={key} onClick={()=>setNewTrip({...newTrip, hotelType:key})} className={`p-3 rounded-xl border cursor-pointer flex justify-between items-center transition-all ${newTrip.hotelType===key?'border-blue-500 bg-blue-50':'border-gray-100 hover:bg-gray-50'}`}>
                                        <div className="flex items-center gap-3"><div className={`p-2 rounded-full ${newTrip.hotelType===key?'bg-blue-200':'bg-gray-100'}`}><BedDouble size={16}/></div><span className="text-sm font-bold">{label}</span></div>
                                        {newTrip.hotelType===key && <CheckCircle2 size={18} className="text-blue-500"/>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-between pt-4"><button onClick={()=>setStep(1)} className="text-gray-500">上一步</button><button onClick={()=>setStep(3)} className="bg-blue-600 text-white px-8 py-3 rounded-full font-bold shadow-lg hover:scale-105 transition-transform">下一步</button></div>
                </div>
            )}

            {/* Step 4: Purpose & People */}
            {step === 3 && (
                <div className="space-y-6 animate-fade-in">
                    <h2 className="text-2xl font-bold text-gray-800">最後確認細節</h2>
                    <div>
                        <label className="text-sm text-gray-500 font-bold mb-2 block">旅遊目的 (AI 規劃依據)</label>
                        <div className="grid grid-cols-2 gap-3">
                            {Object.entries(PURPOSE_MULTIPLIERS).map(([key, info]) => (
                                <div key={key} onClick={()=>setNewTrip({...newTrip, purpose:key})} className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${newTrip.purpose===key?'border-orange-400 bg-orange-50':'border-gray-100 hover:bg-gray-50'}`}>
                                    <div className="flex items-center gap-2 mb-1"><info.icon size={18} className={newTrip.purpose===key?'text-orange-500':'text-gray-400'}/><span className="font-bold text-sm">{info.label}</span></div>
                                    <p className="text-xs text-gray-500">{info.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="text-sm text-gray-500 font-bold mb-2 block">同行人員</label>
                        <div className="space-y-2">
                            <TravelerCounter label="成人" icon={User} field="adults" value={newTrip.travelers.adults}/>
                            <TravelerCounter label="小童 (6-12)" icon={User} field="children" value={newTrip.travelers.children}/>
                            <TravelerCounter label="幼童 (0-5)" icon={Baby} field="toddlers" value={newTrip.travelers.toddlers}/>
                            <TravelerCounter label="長者" icon={Accessibility} field="elderly" value={newTrip.travelers.elderly}/>
                        </div>
                    </div>
                    {newTrip.estimatedBudget > 0 && <div className="bg-green-50 p-4 rounded-xl border border-green-200 flex items-center gap-3 animate-pulse"><Calculator size={24} className="text-green-600"/><div className="flex-1"><div className="text-xs text-green-600 font-bold uppercase">AI 預估總預算</div><div className="text-xl font-bold text-green-800">${newTrip.estimatedBudget.toLocaleString()}</div></div></div>}
                    <div className="flex justify-between pt-4"><button onClick={()=>setStep(2)} className="text-gray-500">上一步</button><button onClick={createTrip} disabled={loadingWeather} className="bg-blue-600 text-white px-8 py-3 rounded-full font-bold shadow-lg hover:scale-105 transition-transform flex items-center gap-2">{loadingWeather ? '生成中...' : '✨ 生成行程'}</button></div>
                </div>
            )}

        </div>
      </div>
    );
  }

  // Guard: If not dashboard and currentTrip is missing (e.g. refresh), go back
  if (!currentTrip) { setView('dashboard'); return null; }

  // Trip Detail View
  const tripItems = items.filter(i => i.type === activeTab);
  const citySpots = POI_DB[currentTrip.destination] || POI_DB['default'];

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800 flex flex-col bg-white">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      
      <div className="bg-white border-b sticky top-0 z-20 shadow-sm print:hidden">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center justify-between py-3">
            <button onClick={() => setView('dashboard')} className="text-gray-500 hover:text-blue-600 text-sm flex items-center gap-1"><ArrowRight size={16} className="rotate-180"/> 返回</button>
            <div className="text-center"><h1 className="font-bold text-lg flex items-center gap-2 justify-center">{currentTrip.destination} {currentTrip.isLocked && <Lock size={14} className="text-red-500"/>}</h1><p className="text-xs text-gray-500">{currentTrip.startDate} ~ {currentTrip.endDate}</p></div>
            <div className="flex gap-2"><button onClick={toggleTripLock} className={`p-2 rounded-full border ${currentTrip.isLocked ? 'bg-red-50 text-red-500 border-red-200' : 'bg-gray-50 text-gray-400 border-gray-200'}`}>{currentTrip.isLocked ? <Lock size={16}/> : <Unlock size={16}/>}</button><button onClick={() => setShowPreviewModal(true)} className="flex items-center gap-1 bg-blue-600 text-white px-3 py-1 rounded-full shadow-sm text-sm hover:bg-blue-700"><Eye size={14}/> 預覽</button></div>
          </div>
          <div className="flex gap-6 overflow-x-auto pb-1 scrollbar-hide">
            {[{ id: 'itinerary', icon: MapPin, label: '行程' }, { id: 'packing', icon: Briefcase, label: '行李' }, { id: 'budget', icon: DollarSign, label: '記帳' }, { id: 'people', icon: Users, label: '人員' }, { id: 'info', icon: <FileText size={18}/>, label: '資訊' }].map(tab => (
              <button key={tab.id} onClick={() => { setActiveTab(tab.id); setNewItem({...newItem, type: tab.id}); setEditingItem(null); }} className={`flex items-center gap-2 pb-3 border-b-2 whitespace-nowrap ${activeTab === tab.id ? 'border-blue-600 text-blue-600 font-bold' : 'border-transparent text-gray-500'}`}><tab.icon size={18}/> {tab.label}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-4xl mx-auto w-full p-4 space-y-6 print:hidden">
        {checkInModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 print:hidden">
             <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">📍 足跡打卡</h3>
                <div className="text-sm text-gray-500 mb-4">{newItem.title}</div>
                <div className="space-y-3">
                   <div><label className="text-xs text-gray-500">備註</label><input type="text" value={newItem.notes} onChange={e=>setNewItem({...newItem, notes:e.target.value})} className="w-full p-2 border rounded-lg bg-gray-50" placeholder="心情..."/></div>
                   <div><label className="text-xs text-gray-500">消費</label><div className="flex gap-2"><input type="number" value={newItem.foreignCost} onChange={e=>handleForeignCostChange(e.target.value, newItem.currency)} className="flex-1 p-2 border rounded-lg bg-gray-50"/><select value={newItem.currency} onChange={e=>handleForeignCostChange(newItem.foreignCost, e.target.value)} className="w-20 p-2 border rounded-lg bg-white">{Object.keys(EXCHANGE_RATES).map(c=><option key={c} value={c}>{c}</option>)}</select></div></div>
                   <div className="flex gap-2 mt-4"><button onClick={()=>setCheckInModal(false)} className="flex-1 py-2 text-gray-500">取消</button><button onClick={addItem} className="flex-1 py-2 bg-blue-600 text-white rounded-lg">確認</button></div>
                </div>
             </div>
          </div>
        )}

        {/* Spot Selector Modal (從推薦加入) */}
        {showSpotSelector && (
           <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
              <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto flex flex-col shadow-2xl">
                 <div className="p-4 border-b flex justify-between items-center sticky top-0 bg-white z-10"><h3 className="font-bold text-lg">選擇推薦景點</h3><button onClick={()=>setShowSpotSelector(false)}><X size={20}/></button></div>
                 <div className="p-4 space-y-2">
                    {citySpots.map((spot, idx) => (
                       <div key={idx} onClick={() => { setNewItem({...newItem, title: spot.name, cost: spot.cost, category: spot.category, notes: spot.note, duration: spot.time}); setShowSpotSelector(false); }} className="p-3 border rounded-xl hover:bg-blue-50 cursor-pointer flex justify-between items-center group">
                          <div className="flex items-center gap-3"><img src={spot.img} className="w-12 h-12 rounded-lg object-cover bg-gray-200"/><div><div className="font-bold text-sm group-hover:text-blue-600">{spot.name}</div><div className="text-xs text-gray-500">{CATEGORY_LABELS[spot.category]?.label} • ${spot.cost}</div></div></div><ArrowRight size={16} className="text-gray-300 group-hover:text-blue-500"/>
                       </div>
                    ))}
                 </div>
              </div>
           </div>
        )}

        {activeTab === 'itinerary' && (
          <div className="space-y-6">
            {/* Emergency & Ride Cards */}
            <div className="grid grid-cols-2 gap-3 mb-4">
               <div className="bg-red-50 border border-red-100 p-4 rounded-2xl flex flex-col gap-2">
                  <div className="text-xs text-red-500 font-bold flex items-center gap-1"><Siren size={12}/> 緊急電話</div>
                  <div className="flex gap-2">
                     <a href={`tel:${CITY_DATA[currentTrip.destination]?.emergency.police}`} className="flex-1 bg-white text-red-600 rounded-lg py-2 text-center text-xs font-bold shadow-sm">報警</a>
                     <a href={`tel:${CITY_DATA[currentTrip.destination]?.emergency.ambulance}`} className="flex-1 bg-white text-red-600 rounded-lg py-2 text-center text-xs font-bold shadow-sm">急救</a>
                  </div>
               </div>
               <div className="bg-green-50 border border-green-100 p-4 rounded-2xl flex flex-col justify-between">
                  <div className="text-xs text-green-600 font-bold flex items-center gap-1"><Car size={12}/> 推薦叫車</div>
                  <div className="text-lg font-bold text-green-700">{CITY_DATA[currentTrip.destination]?.rideApp}</div>
               </div>
            </div>
            <div className="flex gap-2 print:hidden"><button onClick={handleCheckIn} className={`flex-1 bg-blue-600 text-white px-4 py-3 rounded-xl shadow-md text-sm font-bold flex gap-2 items-center justify-center ${currentTrip.isLocked ? 'opacity-50 cursor-not-allowed' : ''}`} disabled={currentTrip.isLocked}><Camera size={18} /> 足跡打卡</button></div>
            
            {/* Day Lists */}
            {Array.from({length: Math.max(1, Math.ceil((new Date(currentTrip.endDate) - new Date(currentTrip.startDate))/(86400000))+1)}).map((_, idx) => {
               const dateStr = new Date(new Date(currentTrip.startDate).getTime() + idx * 86400000).toISOString().split('T')[0];
               const dayItems = items.filter(i => i.type === 'itinerary' && i.date === dateStr).sort((a,b) => (a.startTime > b.startTime ? 1 : -1));
               const w = weatherData[dateStr];
               return (
                 <div key={dateStr} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                    <div className="flex justify-between items-center mb-4 pb-2 border-b">
                       <div><h3 className="font-bold text-gray-800 text-lg">Day {idx+1}</h3><div className="text-xs text-gray-400">{dateStr}</div></div>
                       <div className="flex items-center gap-2">{w ? (<div className="flex items-center gap-1 text-xs bg-blue-50 px-2 py-1 rounded-full text-blue-600 font-bold"><w.icon size={14}/> {w.desc} {w.max}°</div>) : <span className="text-xs text-gray-300">預報未出</span>}<div className="flex gap-2 print:hidden"><button onClick={() => openGoogleMapsRoute(dateStr)} className="text-blue-500 text-xs flex items-center gap-1 border border-blue-200 px-2 py-1 rounded hover:bg-blue-50"><Map size={12}/> 路線</button>{!currentTrip.isLocked && <button onClick={() => { setNewItem({...newItem, date: dateStr, type: 'itinerary'}); window.scrollTo({top: 0, behavior: 'smooth'}); }} className="text-gray-400 hover:text-blue-500"><Plus size={16}/></button>}</div></div>
                    </div>
                    {dayItems.length === 0 ? <div className="text-center text-xs text-gray-300 py-4 border-2 border-dashed rounded-lg">點擊 + 新增行程</div> : dayItems.map(item => (
                        <div key={item.id} className={`flex gap-3 mb-4 relative pl-4 border-l-2 ${item.isCheckIn ? 'border-l-blue-400' : 'border-l-gray-200'}`}>
                           <div className={`absolute -left-[5px] top-1 w-2 h-2 rounded-full ${item.isCheckIn ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
                           <div className="flex-1 cursor-pointer" onClick={() => !currentTrip.isLocked && editItem(item)}>
                              <div className="flex justify-between"><span className="font-bold text-gray-800 text-sm">{item.title}</span><span className="text-xs text-gray-400 font-mono">{item.startTime}</span></div>
                              <div className="text-xs text-gray-500 mt-1 flex gap-2">{item.duration && <span className="flex items-center gap-1"><Clock size={10}/> {item.duration}</span>}{item.cost && <span className="text-orange-500 font-bold flex items-center gap-1"><Ticket size={10}/> ${item.cost}</span>}</div>
                              {item.notes && <div className="text-xs text-gray-500 mt-2 bg-gray-50 p-2 rounded">{item.notes}</div>}
                           </div>
                           {!currentTrip.isLocked && <button onClick={() => deleteItem(item.id)} className="text-gray-300 hover:text-red-400 self-start"><Trash2 size={14}/></button>}
                        </div>
                      ))}
                 </div>
               )
            })}
          </div>
        )}

        {/* Packing List */}
        {activeTab === 'packing' && (
          <div>
            <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl flex justify-between items-center mb-4"><div><div className="font-bold text-indigo-800">行李總重 {luggageStats.totalWeight} kg</div><div className="text-xs text-indigo-500">建議：{luggageStats.suggestion}</div></div><Briefcase size={24} className="text-indigo-300"/></div>
            {['成人', '小童', '幼童', '長者', '全體'].map(owner => { const ownerItems = items.filter(i => i.type === 'packing' && (i.itemOwner === owner || (!i.itemOwner && owner === '全體'))); if (ownerItems.length === 0) return null; return ( <div key={owner} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm mb-4"><h4 className="text-sm font-bold text-gray-500 mb-3 border-b pb-1">{owner}</h4><div className="grid grid-cols-1 md:grid-cols-2 gap-2">{ownerItems.map(item => (<div key={item.id} className="flex items-center gap-3 mb-2"><button onClick={() => toggleItemComplete(item)} className={`${item.completed ? 'text-green-500' : 'text-gray-300'}`}><CheckCircle2 size={20}/></button><div className="p-2 bg-gray-50 rounded-full text-gray-500">{(() => { const DefIcon = ITEM_DEFINITIONS[item.title]?.icon || Circle; return <DefIcon size={16}/> })()}</div><div className="flex-1 flex justify-between"><span className={`text-sm font-medium ${item.completed ? 'line-through text-gray-300' : 'text-gray-800'}`}>{item.title}</span><span className="text-xs bg-gray-100 px-2 py-1 rounded">x{item.quantity}</span></div>{!currentTrip.isLocked && <div className="flex items-center gap-1 bg-gray-50 rounded-lg px-2 py-1"><button onClick={() => updateQuantity(item, -1)} className="text-gray-400 hover:text-blue-500"><Minus size={12}/></button><button onClick={() => updateQuantity(item, 1)} className="text-gray-400 hover:text-blue-500"><Plus size={12}/></button></div>}</div>))}</div></div> ) })}
          </div>
        )}

        {/* Budget Tab */}
        {activeTab === 'budget' && (
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white p-6 rounded-2xl shadow-lg flex justify-between items-center"><div><p className="text-emerald-100 text-xs uppercase">總支出 (HKD)</p><h2 className="text-3xl font-bold mt-1">${budgetStats.total.toLocaleString()}</h2></div><div className="text-right"><p className="text-emerald-100 text-xs uppercase">預算剩餘</p><h3 className={`text-xl font-bold mt-1`}>${(currentTrip.estimatedBudget - budgetStats.total).toLocaleString()}</h3></div></div>
            <div className="bg-white rounded-xl border divide-y">{items.filter(i=>i.cost && (i.type==='budget'||i.type==='itinerary')).sort((a,b)=>b.createdAt-a.createdAt).map(item => (<div key={item.id} className="p-4 flex justify-between items-center hover:bg-gray-50 cursor-pointer" onClick={() => !currentTrip.isLocked && editItem(item)}><div className="flex items-center gap-3"><div className={`p-2 rounded-full bg-gray-50 ${BUDGET_CATEGORIES[item.category]?.color}`}>{(() => { const Icon = BUDGET_CATEGORIES[item.category]?.icon || Circle; return <Icon size={16}/> })()}</div><div><div className="text-sm font-medium text-gray-800">{item.title}</div><div className="text-xs text-gray-400">{item.notes}</div></div></div><div className="font-bold text-gray-700">${Number(item.cost).toLocaleString()}</div></div>))}</div>
          </div>
        )}

        {/* People Tab */}
        {activeTab === 'people' && (
           <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3">
                 {items.filter(i=>i.type==='people').map(p=><div key={p.id} className="bg-white p-4 rounded-xl border shadow-sm relative group"><button onClick={()=>deleteItem(p.id)} className="absolute top-2 right-2 text-gray-300 hover:text-red-500"><Trash2 size={14}/></button><div className="flex items-center gap-3 mb-3"><div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-lg">{p.title[0]}</div><div><h3 className="font-bold text-gray-800">{p.title}</h3><p className="text-xs text-gray-500">房號: {p.notes?.split(' ')[1]}</p></div></div><div className="text-xs text-gray-600 space-y-1 pt-2 border-t"><div className="flex gap-2"><CreditCard size={12}/> ID: {p.pId || '-'}</div><div className="flex gap-2"><Phone size={12} /> Tel: {p.pPhone || '-'}</div></div></div>)}
                 {items.filter(i=>i.type==='people').length === 0 && <div className="text-center text-gray-400 py-10 bg-gray-50 rounded-xl border-2 border-dashed">尚無人員資料，請從下方新增。</div>}
              </div>
           </div>
        )}

        {/* Info Tab */}
        {activeTab === 'info' && (
           <div className="space-y-6">
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-6 rounded-2xl shadow-lg"><h2 className="text-2xl font-bold mb-2">{currentTrip.destination} 旅遊指南</h2><p className="opacity-90">{CITY_DATA[currentTrip.destination]?.intro}</p></div>
              {['shopping', 'food', 'stay', 'transport'].map(catKey => {
                 const catLabel = CATEGORY_LABELS[catKey]; const spots = citySpots.filter(s => s.category === catKey);
                 if (spots.length === 0) return null;
                 return (
                    <div key={catKey}><h3 className={`font-bold text-lg mb-3 flex items-center gap-2 ${catLabel.color}`}><catLabel.icon size={20}/> {catLabel.label}推薦</h3>
                       <div className="grid grid-cols-1 gap-4">
                          {spots.map((spot, idx) => (
                             <div key={idx} className="bg-white border rounded-xl overflow-hidden shadow-sm flex h-28">
                                <img src={spot.img} className="w-28 h-full object-cover"/>
                                <div className="p-3 flex-1 flex flex-col justify-between">
                                   <div><div className="font-bold text-gray-800">{spot.name}</div><p className="text-xs text-gray-500 line-clamp-2">{spot.desc}</p></div>
                                   <div className="flex justify-between items-end"><span className="text-xs bg-gray-100 px-2 py-1 rounded flex items-center gap-1"><Clock size={10}/> {spot.time}</span><button onClick={() => addSpotFromInfo(spot)} className="bg-blue-50 text-blue-600 text-xs px-3 py-1 rounded-full font-bold hover:bg-blue-600 hover:text-white transition-colors">+ 加入</button></div>
                                </div>
                             </div>
                          ))}
                       </div>
                    </div>
                 )
              })}
           </div>
        )}

        {/* Bottom Input Bar */}
        {!checkInModal && !currentTrip.isLocked && activeTab !== 'info' && (
          <form onSubmit={addItem} className="bg-white p-4 rounded-xl shadow-lg border flex flex-col gap-3 sticky bottom-4 z-10 print:hidden">
            <div className="flex justify-between text-xs text-blue-500 font-bold"><span>{editingItem ? "✏️ 編輯項目" : (activeTab==='itinerary' ? `➕ 新增行程 (${newItem.date || '選擇日期'})` : activeTab==='people'?"➕ 新增人員":"➕ 新增")}</span>
              <div className="flex gap-2">
                {activeTab === 'itinerary' && <button type="button" onClick={()=>setShowSpotSelector(true)} className="text-orange-500 flex items-center gap-1 hover:text-orange-600"><Star size={12}/> 從推薦選擇</button>}
                {editingItem && <button type="button" onClick={() => {setEditingItem(null); setNewItem({...newItem, title:''});}} className="text-gray-400">取消</button>}
              </div>
            </div>
            {activeTab === 'people' ? (
                <div className="grid grid-cols-2 gap-2"><input type="text" placeholder="姓名" className="p-2 bg-gray-50 rounded-lg text-sm" value={newItem.pName} onChange={e=>setNewItem({...newItem, pName:e.target.value})} required/><input type="text" placeholder="房號" className="p-2 bg-gray-50 rounded-lg text-sm" value={newItem.pRoom} onChange={e=>setNewItem({...newItem, pRoom:e.target.value})} /><input type="text" placeholder="證件號" className="p-2 bg-gray-50 rounded-lg text-sm" value={newItem.pId} onChange={e=>setNewItem({...newItem, pId:e.target.value})} /><input type="text" placeholder="電話" className="p-2 bg-gray-50 rounded-lg text-sm" value={newItem.pPhone} onChange={e=>setNewItem({...newItem, pPhone:e.target.value})} /></div>
            ) : (
                <div className="flex gap-2 items-center">
                  {activeTab === 'budget' && <select value={newItem.category} onChange={e=>setNewItem({...newItem, category:e.target.value})} className="bg-gray-50 text-xs p-2 rounded-lg outline-none w-20">{Object.entries(BUDGET_CATEGORIES).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}</select>}
                  <input type="text" placeholder={activeTab==='itinerary'?"行程名稱 (如: 晚餐)":activeTab==='budget'?"消費項目":"物品名稱"} className="flex-1 p-2 bg-gray-50 rounded-lg outline-none focus:bg-white focus:ring-2 ring-blue-100" value={newItem.title} onChange={e => setNewItem({...newItem, title: e.target.value})} />
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
