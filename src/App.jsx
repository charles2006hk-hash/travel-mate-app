import { useState, useEffect, useMemo } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, deleteDoc, doc, updateDoc, where, getDocs } from "firebase/firestore";
import { 
  Trash2, Plus, Minus, MapPin, Calendar, CheckCircle2, Circle, 
  DollarSign, FileText, Sun, CloudRain, Snowflake, 
  Luggage, Plane, Baby, Accessibility, User, Navigation,
  History, MapPin as MapPinIcon, Camera, ShoppingBag,
  Calculator, RefreshCw, Edit2, Map, Briefcase, Coffee, Home, Bus, Shirt,
  ExternalLink, Clock, Search, Utensils, Mountain, Siren, Ambulance, Car
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

// 城市資料 (含緊急電話與叫車App)
const CITY_DATA = {
  "東京": { 
    lat: 35.6762, lon: 139.6503, currency: "JPY", region: "JP", 
    intro: "傳統與未來交織的城市，必去淺草寺、澀谷十字路口。",
    emergency: { police: "110", ambulance: "119" },
    rideApp: "Uber / GO / DiDi"
  },
  "大阪": { 
    lat: 34.6937, lon: 135.5023, currency: "JPY", region: "JP", 
    intro: "美食之都，道頓堀固力果跑跑人是必打卡點。",
    emergency: { police: "110", ambulance: "119" },
    rideApp: "Uber / GO / DiDi"
  },
  "京都": { 
    lat: 35.0116, lon: 135.7681, currency: "JPY", region: "JP", 
    intro: "千年古都，擁有無數神社與寺廟，清水寺最為著名。",
    emergency: { police: "110", ambulance: "119" },
    rideApp: "MK Taxi / Uber"
  },
  "首爾": { 
    lat: 37.5665, lon: 126.9780, currency: "KRW", region: "KR", 
    intro: "韓流中心，弘大購物與景福宮穿韓服體驗。",
    emergency: { police: "112", ambulance: "119" },
    rideApp: "Kakao T / Uber"
  },
  "台北": { 
    lat: 25.0330, lon: 121.5654, currency: "TWD", region: "TW", 
    intro: "美食與夜市的天堂，必登台北101觀景台。",
    emergency: { police: "110", ambulance: "119" },
    rideApp: "Uber / 55688 / yoxi"
  },
  "曼谷": { 
    lat: 13.7563, lon: 100.5018, currency: "THB", region: "TH", 
    intro: "充滿活力的不夜城，大皇宮與水上市場不可錯過。",
    emergency: { police: "191", ambulance: "1669" },
    rideApp: "Grab / Bolt"
  },
  "倫敦": { 
    lat: 51.5074, lon: -0.1278, currency: "GBP", region: "UK", 
    intro: "歷史與現代的融合，大笨鐘與倫敦眼是必訪之地。",
    emergency: { police: "999", ambulance: "999" },
    rideApp: "Uber / Bolt / Addison Lee"
  },
  "巴黎": { 
    lat: 48.8566, lon: 2.3522, currency: "EUR", region: "EU", 
    intro: "浪漫之都，艾菲爾鐵塔下野餐是最佳體驗。",
    emergency: { police: "17", ambulance: "15" },
    rideApp: "Uber / Bolt / G7"
  },
  "香港": { 
    lat: 22.3193, lon: 114.1694, currency: "HKD", region: "HK", 
    intro: "東方之珠，維多利亞港夜景世界三大夜景之一。",
    emergency: { police: "999", ambulance: "999" },
    rideApp: "Uber / HKTaxi"
  },
};
const POPULAR_CITIES = Object.keys(CITY_DATA);
const POPULAR_ORIGINS = ["香港", "台北", "高雄", "澳門", "東京", "倫敦", "紐約"];

const EXCHANGE_RATES = {
  "HKD": 1, "JPY": 0.052, "KRW": 0.0058, "TWD": 0.25, "THB": 0.22, 
  "SGD": 5.8, "GBP": 9.9, "EUR": 8.5, "USD": 7.8, "CNY": 1.1
};

// 預估消費水準 (基礎值)
const ESTIMATED_COSTS = {
  "JP": { flight: 4000, hotel: 1000, food: 400, transport: 150 },
  "KR": { flight: 2500, hotel: 800, food: 300, transport: 100 },
  "HK": { flight: 0,    hotel: 0,    food: 400, transport: 100 }, 
  "TH": { flight: 2000, hotel: 600, food: 200, transport: 80 },
  "TW": { flight: 1800, hotel: 600, food: 250, transport: 80 },
  "UK": { flight: 8000, hotel: 1800, food: 600, transport: 200 },
  "default": { flight: 5000, hotel: 1000, food: 400, transport: 150 }
};

// 目的預算加權 (AI 預算核心)
const PURPOSE_MULTIPLIERS = {
  "sightseeing": { flight: 1, hotel: 1, food: 1, transport: 1.2 }, // 多交通
  "shopping": { flight: 1, hotel: 1, food: 0.8, transport: 1, shopping: 5000 }, // 額外購物金
  "food": { flight: 1, hotel: 1, food: 2.0, transport: 1 }, // 吃好點
  "adventure": { flight: 1, hotel: 1.2, food: 1, transport: 1.5 } // 門票與特殊住宿
};

// 行李物品定義 (含圖示與分類)
const ITEM_DEFINITIONS = {
  "護照/簽證": { weight: 0.1, volume: 1, category: "doc", icon: FileText },
  "現金/信用卡": { weight: 0.1, volume: 1, category: "doc", icon: DollarSign },
  "手機充電器": { weight: 0.2, volume: 2, category: "move", icon: ZapIcon },
  "萬用轉接頭": { weight: 0.2, volume: 2, category: "move", icon: ZapIcon },
  "換洗衣物": { weight: 0.5, volume: 10, category: "clothes", icon: Shirt },
  "外套": { weight: 0.8, volume: 15, category: "clothes", icon: Shirt },
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

// --- AI 智能行程生成邏輯 ---
const generateSmartItinerary = (city, days, purpose, travelers) => {
  const hasKids = travelers.children > 0 || travelers.toddlers > 0;
  const hasElderly = travelers.elderly > 0;
  
  // 基礎行程庫
  const POI = {
    "東京": {
      parks: ["上野恩賜公園", "新宿御苑", "井之頭公園"],
      kids: ["東京迪士尼樂園", "東京迪士尼海洋", "上野動物園", "台場樂高樂園"],
      shop: ["銀座百貨街", "新宿 LUMINE", "澀谷 PARCO", "御殿場 Outlet", "秋葉原電器街"],
      culture: ["淺草寺 & 雷門", "明治神宮", "皇居", "東京鐵塔"],
      food: ["築地場外市場", "月島文字燒街", "新宿黃金街"],
    },
    "大阪": {
      parks: ["萬博紀念公園", "大阪城公園"],
      kids: ["環球影城 USJ (任天堂世界)", "海遊館", "天王寺動物園"],
      shop: ["心齋橋筋商店街", "梅田百貨圈", "臨空城 Outlet"],
      culture: ["大阪城天守閣", "通天閣 & 新世界", "四天王寺"],
      food: ["道頓堀美食街", "黑門市場", "鶴橋燒肉街"],
    }
  };

  const cityPOI = POI[city] || { 
    parks: ["市中心公園"], kids: ["當地遊樂園", "動物園"], 
    shop: ["市中心商圈", "Outlet"], culture: ["歷史博物館", "地標塔"], food: ["著名夜市", "美食街"] 
  };

  let itinerary = [];
  
  // 第一天通常是抵達
  itinerary.push({ title: "抵達 & 飯店 Check-in", notes: "辦理入住，熟悉周邊環境，購買交通卡" });

  // 中間天數規劃
  for (let i = 1; i < days - 1; i++) {
    let dayPlan = "";
    let dayNote = "";

    // 優先順序邏輯
    if (purpose === 'adventure' && cityPOI.kids.length > 0 && i === 1) {
       dayPlan = cityPOI.kids[0]; // 冒險或有小孩，第二天去樂園
       dayNote = "全日遊玩，記得提早購票";
    } else if (hasKids && cityPOI.kids.length > 0 && i % 3 === 0) {
       dayPlan = cityPOI.kids[Math.min(i, cityPOI.kids.length-1)] || "親子友善景點"; // 有小孩，每三天安排一個親子點
       dayNote = "適合親子同樂";
    } else if (purpose === 'shopping') {
       const spot = cityPOI.shop[i % cityPOI.shop.length];
       dayPlan = `${spot} 血拼日`;
       dayNote = "準備好信用卡與大購物袋";
    } else if (purpose === 'food') {
       const spot = cityPOI.food[i % cityPOI.food.length];
       dayPlan = `${spot} 美食巡禮`;
       dayNote = "品嚐當地特色料理";
    } else {
       // 預設觀光 (Sightseeing)
       const spot = cityPOI.culture[i % cityPOI.culture.length];
       dayPlan = `${spot} 文化之旅`;
       dayNote = hasElderly ? "行程寬鬆，少走樓梯" : "探索城市歷史";
    }
    
    itinerary.push({ title: dayPlan, notes: dayNote });
  }

  // 最後一天
  itinerary.push({ title: "整理行李 & 前往機場", notes: "檢查護照，最後免稅店採買" });

  return itinerary;
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
    purpose: 'sightseeing', // sightseeing, shopping, food, adventure
    travelers: { adults: 1, children: 0, toddlers: 0, elderly: 0 },
    estimatedBudget: 0,
    budgetDetails: {}
  });

  const [newItem, setNewItem] = useState({ 
    type: 'itinerary', 
    category: 'other', 
    title: '', 
    cost: '',          
    foreignCost: '',   
    currency: 'HKD',   
    date: '', 
    notes: '',
    itemOwner: '成人', 
    quantity: 1,      
    weight: 0,
    startTime: '', // 行程時間
    duration: '',  // 停留時長
  });

  const [editingItem, setEditingItem] = useState(null);
  const [checkInModal, setCheckInModal] = useState(false); // 打卡彈窗狀態

  const [activeTab, setActiveTab] = useState('itinerary');
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  const [showOriginSuggestions, setShowOriginSuggestions] = useState(false);
  const [loadingWeather, setLoadingWeather] = useState(false);

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
    const q = query(collection(db, 'artifacts', APP_ID, 'users', user.uid, 'sub_items'), where('tripId', '==', currentTrip.id));
    return onSnapshot(q, (snapshot) => {
      setItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
  }, [user, currentTrip]);

  const updateTripActualCost = async (tripId) => {
    if (!user || !tripId) return;
    try {
      // 統計所有有花費的項目 (不論是 budget 還是 itinerary)
      const q = query(collection(db, 'artifacts', APP_ID, 'users', user.uid, 'sub_items'), where('tripId', '==', tripId));
      const snapshot = await getDocs(q);
      const total = snapshot.docs.reduce((sum, doc) => sum + (Number(doc.data().cost) || 0), 0);
      await updateDoc(doc(db, 'artifacts', APP_ID, 'users', user.uid, 'trips', tripId), { actualCost: total });
    } catch (e) { console.error(e); }
  };

  // --- AI 預算估算邏輯 (增強版) ---
  const calculateEstimatedBudget = () => {
    if (!newTrip.startDate || !newTrip.endDate) return;
    if (new Date(newTrip.endDate) < new Date(newTrip.startDate)) return;

    const cityInfo = CITY_DATA[newTrip.destination];
    const region = cityInfo ? cityInfo.region : 'default';
    const costs = ESTIMATED_COSTS[region] || ESTIMATED_COSTS['default'];
    
    // 取得目的加權
    const multiplier = PURPOSE_MULTIPLIERS[newTrip.purpose] || PURPOSE_MULTIPLIERS['sightseeing'];

    const start = new Date(newTrip.startDate);
    const end = new Date(newTrip.endDate);
    const days = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1);
    
    const totalPeople = newTrip.travelers.adults + newTrip.travelers.children * 0.8 + newTrip.travelers.toddlers * 0.3 + newTrip.travelers.elderly * 0.9;
    const flightCount = newTrip.travelers.adults + newTrip.travelers.children + newTrip.travelers.elderly + (newTrip.travelers.toddlers > 0 ? 0.1 : 0);

    const estimatedFlight = costs.flight * flightCount * multiplier.flight;
    const estimatedHotel = costs.hotel * (Math.ceil(totalPeople / 2)) * days * multiplier.hotel; 
    const estimatedFood = costs.food * totalPeople * days * multiplier.food;
    const estimatedTransport = costs.transport * totalPeople * days * multiplier.transport;
    
    // 額外購物金 (如果目的是購物)
    const extraShopping = (newTrip.purpose === 'shopping' ? (multiplier.shopping || 0) * newTrip.travelers.adults : 0);

    const total = estimatedFlight + estimatedHotel + estimatedFood + estimatedTransport + extraShopping;

    setNewTrip(prev => ({
      ...prev,
      estimatedBudget: Math.round(total),
      budgetDetails: { 
        flight: Math.round(estimatedFlight), 
        hotel: Math.round(estimatedHotel), 
        food: Math.round(estimatedFood), 
        transport: Math.round(estimatedTransport), 
        shopping: Math.round(extraShopping),
        days 
      }
    }));
  };

  // 自動觸發預算計算 (加入 purpose 作為依賴)
  useEffect(() => {
    if (newTrip.destination && newTrip.startDate && newTrip.endDate) {
      calculateEstimatedBudget();
    }
  }, [newTrip.destination, newTrip.startDate, newTrip.endDate, newTrip.travelers, newTrip.purpose]);

  // --- 核心邏輯升級 ---

  const createTrip = async (e) => {
    e.preventDefault();
    if (newTrip.endDate < newTrip.startDate) return alert("結束日期不能早於開始日期");
    if (!newTrip.destination) return;

    if (!searchHistory.includes(newTrip.destination)) {
      localStorage.setItem('trip_search_history', JSON.stringify([newTrip.destination, ...searchHistory].slice(0, 5)));
    }

    try {
      setLoadingWeather(true);
      const weather = 'sunny'; 
      setLoadingWeather(false);

      const docRef = await addDoc(collection(db, 'artifacts', APP_ID, 'users', user.uid, 'trips'), {
        ...newTrip,
        weather,
        currency: CITY_DATA[newTrip.destination]?.currency || 'HKD',
        actualCost: 0,
        createdAt: serverTimestamp()
      });
      
      const tripId = docRef.id;
      const batch = [];
      const addSubItem = (type, title, category, owner, qty = 1, defCost = '') => {
        const defs = ITEM_DEFINITIONS[title] || { weight: 0.5, volume: 5, icon: Briefcase };
        batch.push(addDoc(collection(db, 'artifacts', APP_ID, 'users', user.uid, 'sub_items'), {
          tripId, type, title, cost: defCost, 
          category, itemOwner: owner, quantity: qty,
          weight: defs.weight, volume: defs.volume,
          completed: false, createdAt: serverTimestamp()
        }));
      };

      // 行李
      ["護照/簽證", "現金/信用卡"].forEach(t => addSubItem('packing', t, 'doc', '全體'));
      ["手機充電器", "萬用轉接頭"].forEach(t => addSubItem('packing', t, 'move', '全體', 1));
      
      const days = newTrip.budgetDetails.days || 3;
      if (newTrip.travelers.adults > 0) {
        addSubItem('packing', '換洗衣物', 'clothes', '成人', newTrip.travelers.adults * days);
      }
      if (newTrip.travelers.toddlers > 0) {
        addSubItem('packing', '尿布', 'daily', '幼童', newTrip.travelers.toddlers * days * 6);
        addSubItem('packing', '奶粉', 'food', '幼童', 1);
        addSubItem('packing', '推車', 'move', '幼童', 1);
      }

      // 1. 生成智能行程 (使用新邏輯)
      const smartItinerary = generateSmartItinerary(newTrip.destination, days, newTrip.purpose, newTrip.travelers);
      
      smartItinerary.forEach((plan, idx) => {
        const dateStr = new Date(new Date(newTrip.startDate).getTime() + idx * 86400000).toISOString().split('T')[0];
        batch.push(addDoc(collection(db, 'artifacts', APP_ID, 'users', user.uid, 'sub_items'), {
          tripId, type: 'itinerary', 
          title: plan.title, 
          date: dateStr, 
          startTime: '09:00',
          duration: '3h',
          notes: plan.notes,
          completed: false, 
          createdAt: serverTimestamp()
        }));
      });

      // 如果有預估購物金，加入預算表
      if (newTrip.budgetDetails.shopping > 0) {
        batch.push(addDoc(collection(db, 'artifacts', APP_ID, 'users', user.uid, 'sub_items'), {
          tripId, type: 'budget', title: '🛍️ 預留購物金', cost: newTrip.budgetDetails.shopping, category: 'shopping', createdAt: serverTimestamp()
        }));
      }

      await Promise.all(batch);
      setNewTrip({ origin: '香港', destination: '', startDate: '', endDate: '', purpose: 'sightseeing', travelers: { adults: 1, children: 0, toddlers: 0, elderly: 0 }, estimatedBudget: 0, budgetDetails: {} });
      alert("AI 深度行程規劃完成！");
    } catch (error) {
      console.error(error);
      setLoadingWeather(false);
    }
  };

  const deleteTrip = async (id, e) => {
    e.stopPropagation();
    if (confirm("確定刪除？")) await deleteDoc(doc(db, 'artifacts', APP_ID, 'users', user.uid, 'trips', id));
  };

  const openTrip = (trip) => {
    setCurrentTrip(trip);
    setView('trip-detail');
    const localCurrency = CITY_DATA[trip.destination]?.currency || 'HKD';
    setNewItem({ ...newItem, date: trip.startDate, currency: localCurrency });
  };

  const handleForeignCostChange = (amount, currency) => {
    const rate = EXCHANGE_RATES[currency] || 1;
    const hkdCost = Math.round(amount * rate);
    setNewItem(prev => ({ ...prev, foreignCost: amount, currency: currency, cost: hkdCost }));
  };

  const addItem = async (e) => {
    e.preventDefault();
    if (!newItem.title && !checkInModal) return;

    let finalNotes = newItem.notes;
    if (newItem.foreignCost && newItem.currency !== 'HKD') {
      finalNotes = `${newItem.currency} ${newItem.foreignCost} (匯率 ${EXCHANGE_RATES[newItem.currency]}) ${finalNotes}`;
    }

    // 3. 行李數量與圖示邏輯 (使用 Item Definitions)
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
      await updateDoc(doc(db, 'artifacts', APP_ID, 'users', user.uid, 'sub_items', editingItem), payload);
      setEditingItem(null);
    } else {
      await addDoc(collection(db, 'artifacts', APP_ID, 'users', user.uid, 'sub_items'), payload);
    }

    if (newItem.cost || newItem.type === 'budget') {
      setTimeout(() => updateTripActualCost(currentTrip.id), 500);
    }

    setNewItem({ ...newItem, title: '', cost: '', foreignCost: '', notes: '', quantity: 1, weight: 0, startTime: '', duration: '' });
    setCheckInModal(false);
  };

  const editItem = (item) => {
    setNewItem({ ...item, foreignCost: item.foreignCost || '', currency: item.currency || 'HKD' });
    setEditingItem(item.id);
  };

  const deleteItem = async (id, type) => {
    if(!confirm("確定刪除？")) return;
    await deleteDoc(doc(db, 'artifacts', APP_ID, 'users', user.uid, 'sub_items', id));
    setTimeout(() => updateTripActualCost(currentTrip.id), 500);
  };

  const toggleItemComplete = async (item) => updateDoc(doc(db, 'artifacts', APP_ID, 'users', user.uid, 'sub_items', item.id), { completed: !item.completed });
  
  // 3. 行李數量增減
  const updateQuantity = async (item, delta) => {
    const newQty = Math.max(1, (item.quantity || 1) + delta);
    await updateDoc(doc(db, 'artifacts', APP_ID, 'users', user.uid, 'sub_items', item.id), { quantity: newQty });
  };

  // 2. 地圖預覽 (根據日期篩選)
  const openGoogleMapsRoute = (date) => {
    const points = items
      .filter(i => i.type === 'itinerary' && i.date === date)
      .sort((a,b) => (a.startTime > b.startTime ? 1 : -1));
    
    if (points.length === 0) return alert("當天沒有行程點");

    // 構建 Google Maps 路徑連結
    const origin = points[0].title;
    const destination = points[points.length - 1].title;
    const waypoints = points.slice(1, -1).map(p => p.title).join('|');
    
    if (points.length === 1) {
      window.open(`https://www.google.com/maps/search/${currentTrip.destination}+${origin}`, '_blank');
    } else {
      window.open(`https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&waypoints=${waypoints}&travelmode=transit`, '_blank');
    }
  };

  // 2. 足跡打卡邏輯 (含費用)
  const handleCheckIn = () => {
    if (!navigator.geolocation) return alert("不支援定位");
    navigator.geolocation.getCurrentPosition((pos) => {
       const { latitude, longitude } = pos.coords;
       const t = new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
       // 打開彈窗填寫詳情
       setNewItem(prev => ({
         ...prev,
         type: 'itinerary',
         title: `📍 打卡 (${latitude.toFixed(2)}, ${longitude.toFixed(2)})`,
         date: new Date().toISOString().split('T')[0],
         startTime: t,
         notes: '',
         cost: '',
         category: 'other', // 預設類別
         isCheckIn: true
       }));
       setCheckInModal(true);
    }, () => alert("定位失敗"));
  };

  const luggageStats = useMemo(() => {
    const packingItems = items.filter(i => i.type === 'packing');
    const totalWeight = packingItems.reduce((sum, i) => sum + (Number(i.weight || 0) * Number(i.quantity || 1)), 0);
    
    let suggestion = "背包/手提";
    if (totalWeight > 7) suggestion = "20吋登機箱";
    if (totalWeight > 15) suggestion = "24吋行李箱";
    if (totalWeight > 23) suggestion = "28吋大行李箱";

    return { totalWeight: totalWeight.toFixed(1), suggestion };
  }, [items]);

  const budgetStats = useMemo(() => {
    // 包含 budget 類型 以及 itinerary 中有 cost 的項目
    const budgetItems = items.filter(i => i.cost && (i.type === 'budget' || i.type === 'itinerary'));
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

  if (view === 'dashboard') {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans text-gray-800">
        <div className="max-w-4xl mx-auto space-y-6">
          <header className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-bold text-blue-900 flex items-center gap-2"><Plane className="text-blue-600" /> 智能旅遊管家 <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">AI 旗艦版</span></h1>
            <div className="text-xs text-gray-400">ID: {user?.uid.slice(0, 4)}</div>
          </header>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Plus size={20}/> AI 行程規劃</h2>
            <form onSubmit={createTrip} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1 relative">
                  <label className="text-xs text-gray-500">出發地</label>
                  <div className="relative">
                    <MapPinIcon className="absolute left-3 top-3 text-gray-400" size={16} />
                    <input value={newTrip.origin} onChange={e=>setNewTrip({...newTrip, origin: e.target.value})} onFocus={() => setShowOriginSuggestions(true)} className="w-full pl-9 p-2 border rounded-lg bg-gray-50"/>
                  </div>
                  {showOriginSuggestions && (
                    <div className="absolute z-10 w-full bg-white border rounded-lg shadow-xl mt-1 p-2 flex flex-wrap gap-2">
                        {POPULAR_ORIGINS.map(c => <button type="button" key={c} onClick={() => {setNewTrip({...newTrip, origin: c}); setShowOriginSuggestions(false);}} className="text-xs bg-gray-100 px-2 py-1 rounded">{c}</button>)}
                        <button type="button" onClick={()=>setShowOriginSuggestions(false)} className="w-full text-center text-xs text-blue-500 mt-1 pt-1 border-t">關閉</button>
                    </div>
                  )}
                </div>
                <div className="space-y-1 relative">
                  <label className="text-xs text-gray-500">目的地</label>
                  <div className="relative">
                    <Navigation className="absolute left-3 top-3 text-blue-500" size={16} />
                    <input placeholder="例如：東京" value={newTrip.destination} onChange={e=>setNewTrip({...newTrip, destination: e.target.value})} onFocus={() => setShowCitySuggestions(true)} className="w-full pl-9 p-2 border rounded-lg focus:ring-2 ring-blue-500 outline-none" />
                  </div>
                  {showCitySuggestions && (
                    <div className="absolute z-10 w-full bg-white border rounded-lg shadow-xl mt-1 p-2 grid grid-cols-4 gap-2">
                        {POPULAR_CITIES.map(c => <button type="button" key={c} onClick={() => {setNewTrip({...newTrip, destination: c}); setShowCitySuggestions(false);}} className="text-xs border px-2 py-1 rounded hover:bg-blue-50">{c}</button>)}
                        <button type="button" onClick={()=>setShowCitySuggestions(false)} className="col-span-4 text-center text-xs text-blue-500 mt-1 pt-1 border-t">關閉</button>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="flex gap-2 items-center">
                    <div className="flex-1 space-y-1">
                        <label className="text-xs text-gray-500">開始</label>
                        <input type="date" min={new Date().toISOString().split('T')[0]} value={newTrip.startDate} onChange={e=>setNewTrip({...newTrip, startDate: e.target.value})} className="w-full p-2 border rounded-lg" required />
                    </div>
                    <div className="flex-1 space-y-1">
                        <label className="text-xs text-gray-500">結束</label>
                        <input 
                            type="date" 
                            min={newTrip.startDate || new Date().toISOString().split('T')[0]} 
                            value={newTrip.endDate} 
                            onChange={e=>setNewTrip({...newTrip, endDate: e.target.value})} 
                            className="w-full p-2 border rounded-lg" 
                            disabled={!newTrip.startDate}
                            required 
                        />
                    </div>
                 </div>
                 <div className="space-y-1">
                    <label className="text-xs text-gray-500">旅遊目的 (影響預算與行程)</label>
                    <div className="flex gap-2">
                       {[{id:'sightseeing', icon:Camera, label:'觀光'}, {id:'shopping', icon:ShoppingBag, label:'購物'}, {id:'food', icon:Utensils, label:'美食'}, {id:'adventure', icon:Mountain, label:'冒險'}].map(p => (
                         <button type="button" key={p.id} onClick={() => setNewTrip({...newTrip, purpose: p.id})} className={`flex-1 flex flex-col items-center justify-center p-2 rounded-lg border text-xs transition-colors ${newTrip.purpose === p.id ? 'bg-blue-50 border-blue-500 text-blue-600' : 'bg-gray-50 border-gray-200 text-gray-500'}`}>
                           <p.icon size={16} /> <span className="mt-1">{p.label}</span>
                         </button>
                       ))}
                    </div>
                 </div>
              </div>

              {/* 日期提示 */}
              {newTrip.startDate && newTrip.endDate && (
                  <div className="text-center text-xs text-blue-600 font-bold bg-blue-50 p-1 rounded mt-1">
                      預計旅遊天數：共 {Math.max(1, Math.ceil((new Date(newTrip.endDate) - new Date(newTrip.startDate))/(1000 * 60 * 60 * 24)) + 1)} 天
                  </div>
              )}

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <TravelerCounter label="成人" icon={User} field="adults" value={newTrip.travelers.adults} />
                <TravelerCounter label="小童" icon={User} field="children" value={newTrip.travelers.children} />
                <TravelerCounter label="幼童" icon={Baby} field="toddlers" value={newTrip.travelers.toddlers} />
                <TravelerCounter label="長者" icon={Accessibility} field="elderly" value={newTrip.travelers.elderly} />
              </div>

              {newTrip.estimatedBudget > 0 && (
                <div className="bg-blue-50 p-3 rounded-xl border border-blue-100">
                  <div className="flex justify-between items-center text-sm font-bold text-blue-800">
                     <span className="flex items-center gap-1"><Calculator size={14}/> AI 預算估算: ${newTrip.estimatedBudget.toLocaleString()}</span>
                     <span className="text-xs font-normal">({newTrip.budgetDetails.days}天)</span>
                  </div>
                  {newTrip.purpose === 'shopping' && <div className="text-[10px] text-blue-500 mt-1">*已包含額外購物預算</div>}
                  {newTrip.purpose === 'food' && <div className="text-[10px] text-blue-500 mt-1">*已調高餐飲預算</div>}
                </div>
              )}

              <button type="submit" disabled={loadingWeather} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 flex justify-center items-center gap-2">
                 AI 生成行程
              </button>
            </form>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {trips.map(trip => (
              <div key={trip.id} onClick={() => openTrip(trip)} className="bg-white p-5 rounded-xl shadow-sm border hover:border-blue-400 cursor-pointer relative overflow-hidden group">
                <button onClick={(e) => deleteTrip(trip.id, e)} className="absolute top-4 right-4 text-gray-300 hover:text-red-500 z-10 p-2"><Trash2 size={16}/></button>
                <h3 className="text-xl font-bold text-gray-800">{trip.destination}</h3>
                <p className="text-sm text-gray-500 mt-1 flex items-center gap-1"><MapPinIcon size={12}/> {trip.origin} 出發 • {trip.weather==='rainy'?'🌧️':trip.weather==='cold'?'❄️':'☀️'}</p>
                <div className="mt-4 flex gap-3 text-xs">
                  <div className="bg-green-50 text-green-700 px-3 py-1 rounded-lg border border-green-100">
                    <div className="text-[10px] text-green-400 uppercase">預算</div><div className="font-bold">${trip.estimatedBudget?.toLocaleString()}</div>
                  </div>
                  <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-lg border border-blue-100">
                    <div className="text-[10px] text-blue-400 uppercase">實際支出</div><div className="font-bold">${trip.actualCost?.toLocaleString() || 0}</div>
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
  const cityEmerg = CITY_DATA[currentTrip.destination]?.emergency;
  const rideApp = CITY_DATA[currentTrip.destination]?.rideApp;
  
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
              { id: 'packing', icon: <Briefcase size={18}/>, label: '行李' },
              { id: 'budget', icon: <DollarSign size={18}/>, label: '記帳' },
              { id: 'info', icon: <FileText size={18}/>, label: '資訊' },
            ].map(tab => (
              <button key={tab.id} onClick={() => { setActiveTab(tab.id); setNewItem({...newItem, type: tab.id}); setEditingItem(null); }} className={`flex items-center gap-2 pb-3 border-b-2 whitespace-nowrap ${activeTab === tab.id ? 'border-blue-600 text-blue-600 font-bold' : 'border-transparent text-gray-500'}`}>{tab.icon} {tab.label}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-4xl mx-auto w-full p-4 space-y-6">
        
        {/* 打卡彈窗 */}
        {checkInModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
             <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">📍 足跡打卡</h3>
                <div className="text-sm text-gray-500 mb-4">{newItem.title}</div>
                <div className="space-y-3">
                   <div>
                      <label className="text-xs text-gray-500">備註</label>
                      <input type="text" value={newItem.notes} onChange={e=>setNewItem({...newItem, notes:e.target.value})} className="w-full p-2 border rounded-lg bg-gray-50" placeholder="心情、紀錄..."/>
                   </div>
                   <div>
                      <label className="text-xs text-gray-500">此處消費 (同步記帳)</label>
                      <div className="flex gap-2">
                         <input type="number" value={newItem.foreignCost} onChange={e=>handleForeignCostChange(e.target.value, newItem.currency)} className="flex-1 p-2 border rounded-lg bg-gray-50" placeholder="金額"/>
                         <select value={newItem.currency} onChange={e=>handleForeignCostChange(newItem.foreignCost, e.target.value)} className="w-20 p-2 border rounded-lg bg-white">
                            {Object.keys(EXCHANGE_RATES).map(c=><option key={c} value={c}>{c}</option>)}
                         </select>
                      </div>
                      <div className="text-right text-xs text-gray-400 mt-1">約 {newItem.cost} HKD</div>
                   </div>
                   <div className="flex gap-2 mt-4">
                      <button onClick={()=>setCheckInModal(false)} className="flex-1 py-2 text-gray-500">取消</button>
                      <button onClick={addItem} className="flex-1 py-2 bg-blue-600 text-white rounded-lg">確認打卡</button>
                   </div>
                </div>
             </div>
          </div>
        )}

        {/* 2. 行程列表 (按日期分組) */}
        {activeTab === 'itinerary' && (
          <div className="space-y-6">
            
            {/* 緊急聯絡 & 交通看板 */}
            <div className="grid grid-cols-2 gap-3 mb-4">
               {cityEmerg ? (
                 <div className="bg-red-50 border border-red-100 p-3 rounded-xl flex flex-col gap-2">
                    <div className="text-xs text-red-500 font-bold flex items-center gap-1"><Siren size={12}/> 當地緊急電話</div>
                    <div className="flex gap-2">
                       <a href={`tel:${cityEmerg.police}`} className="flex-1 bg-white border border-red-200 text-red-600 rounded-lg py-1 flex items-center justify-center gap-1 text-xs hover:bg-red-600 hover:text-white transition-colors"><Siren size={12}/> 報警 {cityEmerg.police}</a>
                       <a href={`tel:${cityEmerg.ambulance}`} className="flex-1 bg-white border border-red-200 text-red-600 rounded-lg py-1 flex items-center justify-center gap-1 text-xs hover:bg-red-600 hover:text-white transition-colors"><Ambulance size={12}/> 急救 {cityEmerg.ambulance}</a>
                    </div>
                 </div>
               ) : (
                 <div className="bg-gray-100 p-3 rounded-xl text-xs text-gray-500 flex items-center justify-center">無緊急資訊</div>
               )}
               
               <div className="bg-green-50 border border-green-100 p-3 rounded-xl flex flex-col gap-2">
                  <div className="text-xs text-green-600 font-bold flex items-center gap-1"><Car size={12}/> 當地叫車推薦</div>
                  <div className="text-sm font-bold text-green-700">{rideApp || "Uber"}</div>
               </div>
            </div>

            <div className="flex gap-2">
              <button onClick={handleCheckIn} className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-xl shadow-md text-sm font-bold flex gap-2 items-center justify-center"><Camera size={18} /> 足跡打卡</button>
            </div>

            {/* 按日期分組顯示 */}
            {Array.from({length: newTrip.budgetDetails.days || Math.ceil((new Date(currentTrip.endDate) - new Date(currentTrip.startDate))/(86400000))+1}).map((_, idx) => {
               const dateStr = new Date(new Date(currentTrip.startDate).getTime() + idx * 86400000).toISOString().split('T')[0];
               const dayItems = tripItems.filter(i => i.date === dateStr).sort((a,b) => (a.startTime > b.startTime ? 1 : -1));
               
               return (
                 <div key={dateStr} className="bg-white rounded-xl border p-4">
                    <div className="flex justify-between items-center mb-4 pb-2 border-b">
                       <div>
                          <h3 className="font-bold text-gray-800">Day {idx+1}</h3>
                          <div className="text-xs text-gray-400">{dateStr}</div>
                       </div>
                       <div className="flex gap-2">
                          <button onClick={() => openGoogleMapsRoute(dateStr)} className="text-blue-500 text-xs flex items-center gap-1 border border-blue-200 px-2 py-1 rounded hover:bg-blue-50"><Map size={12}/> 路線</button>
                          <button onClick={() => { setNewItem({...newItem, date: dateStr, type: 'itinerary'}); window.scrollTo({top: 0, behavior: 'smooth'}); }} className="text-gray-400 hover:text-blue-500"><Plus size={16}/></button>
                       </div>
                    </div>

                    {dayItems.length === 0 ? (
                      <div className="text-center text-xs text-gray-300 py-2">本日無行程</div>
                    ) : (
                      dayItems.map(item => (
                        <div key={item.id} className={`flex gap-3 mb-4 relative pl-4 border-l-2 ${item.isCheckIn ? 'border-l-blue-400' : 'border-l-gray-200'}`}>
                           <div className={`absolute -left-[5px] top-1 w-2 h-2 rounded-full ${item.isCheckIn ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
                           <div className="flex-1" onClick={() => editItem(item)}>
                              <div className="flex justify-between">
                                 <span className="font-bold text-gray-800 text-sm">{item.title}</span>
                                 <span className="text-xs text-gray-400 font-mono">{item.startTime}</span>
                              </div>
                              <div className="text-xs text-gray-500 mt-1 flex gap-2">
                                 {item.duration && <span className="flex items-center gap-1"><Clock size={10}/> {item.duration}</span>}
                                 {item.cost && <span className="text-orange-500 font-bold">${item.cost}</span>}
                              </div>
                              {item.notes && <div className="text-xs text-gray-400 mt-1 bg-gray-50 p-1 rounded">{item.notes}</div>}
                           </div>
                           <button onClick={() => deleteItem(item.id)} className="text-gray-200 hover:text-red-400 self-start"><Trash2 size={14}/></button>
                        </div>
                      ))
                    )}
                 </div>
               )
            })}
          </div>
        )}

        {/* 3. 行李 - 列表與圖示 */}
        {activeTab === 'packing' && (
          <>
            <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl flex justify-between items-center mb-4">
               <div><div className="font-bold text-indigo-800">行李總重 {luggageStats.totalWeight} kg</div><div className="text-xs text-indigo-500">建議：{luggageStats.suggestion}</div></div>
               <Briefcase size={24} className="text-indigo-300"/>
            </div>
            {['成人', '小童', '幼童', '長者', '全體'].map(owner => {
                const ownerItems = tripItems.filter(i => i.itemOwner === owner || (!i.itemOwner && owner === '全體'));
                if (ownerItems.length === 0) return null;
                return (
                  <div key={owner} className="bg-white p-4 rounded-xl border mb-4">
                    <h4 className="text-sm font-bold text-gray-500 mb-3 border-b pb-1">{owner}</h4>
                    {ownerItems.map(item => {
                      const DefIcon = ITEM_DEFINITIONS[item.title]?.icon || Circle;
                      return (
                        <div key={item.id} className="flex items-center gap-3 mb-3">
                           <button onClick={() => toggleItemComplete(item)} className={item.completed ? 'text-green-500' : 'text-gray-300'}><CheckCircle2 size={20}/></button>
                           <div className="p-2 bg-gray-50 rounded-full text-gray-500"><DefIcon size={16}/></div>
                           <div className="flex-1">
                              <div className={`text-sm font-medium ${item.completed ? 'line-through text-gray-300' : 'text-gray-800'}`}>{item.title}</div>
                           </div>
                           <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-2 py-1">
                              <button onClick={() => updateQuantity(item, -1)} className="text-gray-400 hover:text-blue-500"><Minus size={12}/></button>
                              <span className="text-xs w-4 text-center">{item.quantity}</span>
                              <button onClick={() => updateQuantity(item, 1)} className="text-gray-400 hover:text-blue-500"><Plus size={12}/></button>
                           </div>
                        </div>
                      )
                    })}
                  </div>
                )
            })}
          </>
        )}

        {/* 記帳 - 分類統計 */}
        {activeTab === 'budget' && (
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white p-6 rounded-2xl shadow-lg">
              <div className="flex justify-between items-start">
                <div><p className="text-emerald-100 text-xs uppercase">總支出 (HKD)</p><h2 className="text-3xl font-bold mt-1">${budgetStats.total.toLocaleString()}</h2></div>
                <div className="text-right"><p className="text-emerald-100 text-xs uppercase">預算剩餘</p><h3 className={`text-xl font-bold mt-1`}>${(currentTrip.estimatedBudget - budgetStats.total).toLocaleString()}</h3></div>
              </div>
            </div>
            {/* 列表 */}
            <div className="bg-white rounded-xl border divide-y">
               {tripItems.sort((a,b)=>b.createdAt - a.createdAt).map(item => (
                 <div key={item.id} className="p-3 flex justify-between items-center" onClick={() => editItem(item)}>
                    <div className="flex items-center gap-3">
                       <div className={`p-2 rounded-full bg-gray-50 ${BUDGET_CATEGORIES[item.category]?.color}`}>
                          {(() => { const Icon = BUDGET_CATEGORIES[item.category]?.icon || Circle; return <Icon size={16}/> })()}
                       </div>
                       <div>
                          <div className="text-sm font-medium text-gray-800">{item.title}</div>
                          <div className="text-xs text-gray-400">{item.notes}</div>
                       </div>
                    </div>
                    <div className="font-bold text-gray-700">${Number(item.cost).toLocaleString()}</div>
                 </div>
               ))}
            </div>
          </div>
        )}

        {/* 4. 資訊 - 外部連結 */}
        {activeTab === 'info' && (
           <div className="space-y-4">
              <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100">
                 <h3 className="font-bold text-yellow-800 mb-2">關於 {currentTrip.destination}</h3>
                 <p className="text-sm text-yellow-700">{CITY_DATA[currentTrip.destination]?.intro}</p>
              </div>
              
              <h4 className="text-sm font-bold text-gray-500 mt-4">更多資訊 (外部連結)</h4>
              <div className="grid grid-cols-2 gap-3">
                 <a href={`https://www.google.com/search?q=${currentTrip.destination}+旅遊攻略`} target="_blank" rel="noreferrer" className="flex items-center gap-2 p-3 bg-white border rounded-xl shadow-sm hover:border-blue-400 text-sm text-gray-600">
                    <Search size={16} className="text-blue-500"/> Google 搜尋
                 </a>
                 <a href={`https://www.tripadvisor.com.tw/Search?q=${currentTrip.destination}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 p-3 bg-white border rounded-xl shadow-sm hover:border-green-400 text-sm text-gray-600">
                    <ExternalLink size={16} className="text-green-500"/> TripAdvisor
                 </a>
                 <a href={`https://weather.com/zh-TW/weather/today/l/${currentTrip.destination}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 p-3 bg-white border rounded-xl shadow-sm hover:border-orange-400 text-sm text-gray-600">
                    <Sun size={16} className="text-orange-500"/> 詳細天氣
                 </a>
                 <a href={`https://www.google.com/maps/search/${currentTrip.destination}+美食`} target="_blank" rel="noreferrer" className="flex items-center gap-2 p-3 bg-white border rounded-xl shadow-sm hover:border-red-400 text-sm text-gray-600">
                    <Utensils size={16} className="text-red-500"/> 搵美食
                 </a>
              </div>
           </div>
        )}

        {/* 通用新增 Bar (不在打卡模式或編輯模式時顯示) */}
        {!checkInModal && activeTab !== 'info' && (
          <form onSubmit={addItem} className="bg-white p-4 rounded-xl shadow-lg border flex flex-col gap-3 sticky bottom-4 z-10">
            <div className="flex justify-between text-xs text-blue-500 font-bold">
              <span>{editingItem ? "✏️ 編輯項目" : (activeTab==='itinerary' ? `➕ 新增行程 (${newItem.date || '選擇日期'})` : "➕ 新增")}</span>
              {editingItem && <button type="button" onClick={() => {setEditingItem(null); setNewItem({...newItem, title:''});}} className="text-gray-400">取消</button>}
            </div>
            
            <div className="flex gap-2 items-center">
              {activeTab === 'budget' && (
                 <select value={newItem.category} onChange={e=>setNewItem({...newItem, category: e.target.value})} className="bg-gray-50 text-xs p-2 rounded-lg outline-none w-20">
                    {Object.entries(BUDGET_CATEGORIES).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
                 </select>
              )}
              
              <input 
                type="text" 
                placeholder={activeTab==='itinerary'?"行程名稱 (如: 晚餐)":activeTab==='budget'?"消費項目":"物品名稱"}
                className="flex-1 p-2 bg-gray-50 rounded-lg outline-none focus:bg-white focus:ring-2 ring-blue-100"
                value={newItem.title}
                onChange={e => setNewItem({...newItem, title: e.target.value})}
              />

              {activeTab === 'itinerary' && (
                 <div className="flex gap-1">
                    <input type="time" value={newItem.startTime} onChange={e=>setNewItem({...newItem, startTime: e.target.value})} className="w-20 p-2 bg-gray-50 rounded-lg text-xs"/>
                    <input type="text" placeholder="時長" value={newItem.duration} onChange={e=>setNewItem({...newItem, duration: e.target.value})} className="w-12 p-2 bg-gray-50 rounded-lg text-xs text-center"/>
                 </div>
              )}
              
              {(activeTab === 'budget' || (activeTab === 'itinerary' && editingItem)) && (
                <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-lg border w-24">
                  <input type="number" placeholder="$" className="w-full p-1 bg-transparent outline-none text-right font-bold text-blue-600"
                    value={newItem.foreignCost} onChange={e => handleForeignCostChange(e.target.value, newItem.currency)} />
                </div>
              )}

              {activeTab === 'packing' && (
                 <div className="flex items-center gap-1 bg-gray-50 px-2 rounded-lg border">
                    <button type="button" onClick={()=>setNewItem({...newItem, quantity: Math.max(1, newItem.quantity-1)})}><Minus size={12}/></button>
                    <span className="text-xs font-bold w-4 text-center">{newItem.quantity}</span>
                    <button type="button" onClick={()=>setNewItem({...newItem, quantity: newItem.quantity+1})}><Plus size={12}/></button>
                 </div>
              )}
              
              <button type="submit" className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700">{editingItem ? <Edit2 size={16}/> : <Plus size={20}/>}</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default TravelApp;
