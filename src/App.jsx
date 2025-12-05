import { useState, useEffect, useMemo, useRef } from 'react';
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
  AlertCircle, Check, RefreshCw as RefreshIcon, Users, CreditCard, Bed, Ticket, Phone, ArrowRight
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
  "東京": { lat: 35.6762, lon: 139.6503, currency: "JPY", region: "JP", intro: "傳統與未來交織的城市。", emergency: { police: "110", ambulance: "119" }, rideApp: "Uber / GO" },
  "大阪": { lat: 34.6937, lon: 135.5023, currency: "JPY", region: "JP", intro: "美食之都。", emergency: { police: "110", ambulance: "119" }, rideApp: "Uber / GO" },
  "京都": { lat: 35.0116, lon: 135.7681, currency: "JPY", region: "JP", intro: "千年古都。", emergency: { police: "110", ambulance: "119" }, rideApp: "MK Taxi" },
  "雪梨": { lat: -33.8688, lon: 151.2093, currency: "AUD", region: "AU", intro: "澳洲最大城市。", emergency: { police: "000", ambulance: "000" }, rideApp: "Uber" },
  "墨爾本": { lat: -37.8136, lon: 144.9631, currency: "AUD", region: "AU", intro: "文化與咖啡之都。", emergency: { police: "000", ambulance: "000" }, rideApp: "Uber" },
  "台北": { lat: 25.0330, lon: 121.5654, currency: "TWD", region: "TW", intro: "美食天堂。", emergency: { police: "110", ambulance: "119" }, rideApp: "Uber" },
  // ... (其他城市省略以節省長度，功能邏輯通用)
};

const POPULAR_CITIES = Object.keys(CITY_DATA);
const POPULAR_ORIGINS = ["香港", "台北", "高雄", "澳門", "東京", "倫敦", "紐約", "雪梨", "墨爾本"];
const EXCHANGE_RATES = { "HKD": 1, "JPY": 0.052, "KRW": 0.0058, "TWD": 0.25, "THB": 0.22, "SGD": 5.8, "GBP": 9.9, "EUR": 8.5, "USD": 7.8, "CNY": 1.1, "AUD": 5.1 };

// 衣食住行分類定義
const CATEGORY_LABELS = {
  shopping: { label: "衣 (購物)", icon: ShoppingBag, color: "text-pink-500", bg: "bg-pink-50" },
  food: { label: "食 (美食)", icon: Utensils, color: "text-orange-500", bg: "bg-orange-50" },
  stay: { label: "住 (住宿)", icon: Home, color: "text-indigo-500", bg: "bg-indigo-50" },
  transport: { label: "行 (景點/交通)", icon: Map, color: "text-blue-500", bg: "bg-blue-50" }, // 景點歸類於"行"
  other: { label: "其他", icon: FileText, color: "text-gray-500", bg: "bg-gray-50" }
};

// 擴充景點資料庫 (含詳細資訊、座標、圖片)
const POI_DB = {
  "東京": [
    // 行 (景點)
    { name: "東京迪士尼樂園", category: "transport", cost: 600, time: "全日", note: "夢幻王國，需提早購票", lat: 35.6329, lon: 139.8804, img: "https://images.unsplash.com/photo-1545582379-34e8ce6a3092?w=400&q=80", desc: "亞洲第一座迪士尼樂園，七大主題園區。" },
    { name: "淺草寺", category: "transport", cost: 0, time: "2h", note: "雷門打卡，仲見世通吃小吃", lat: 35.7147, lon: 139.7967, img: "https://images.unsplash.com/photo-1596395914619-338d9b52c007?w=400&q=80", desc: "東京最古老的寺廟，著名的雷門大燈籠。" },
    { name: "東京晴空塔", category: "transport", cost: 200, time: "2h", note: "俯瞰東京全景", lat: 35.7100, lon: 139.8107, img: "https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?w=400&q=80", desc: "世界最高的自立式電波塔。" },
    // 食
    { name: "築地場外市場", category: "food", cost: 300, time: "2h", note: "新鮮壽司早午餐", lat: 35.6655, lon: 139.7707, img: "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=400&q=80", desc: "東京的廚房，各式海鮮小吃。" },
    { name: "新宿黃金街", category: "food", cost: 200, time: "2h", note: "體驗昭和風情居酒屋", lat: 35.6940, lon: 139.7047, img: "https://images.unsplash.com/photo-1569420067280-45952c42337d?w=400&q=80", desc: "窄巷中的微型酒吧群。" },
    // 衣
    { name: "銀座商圈", category: "shopping", cost: 0, time: "3h", note: "高級精品與百貨", lat: 35.6712, lon: 139.7665, img: "https://images.unsplash.com/photo-1554797589-7241bb691973?w=400&q=80", desc: "東京最繁華的高級購物區。" },
    { name: "秋葉原電器街", category: "shopping", cost: 0, time: "3h", note: "動漫與3C產品", lat: 35.6983, lon: 139.7730, img: "https://images.unsplash.com/photo-1574263720708-62d47f975440?w=400&q=80", desc: "御宅族聖地，各式模型與電子零件。" },
    // 住
    { name: "新宿格拉斯麗酒店", category: "stay", cost: 1200, time: "住宿", note: "哥吉拉酒店", lat: 35.6955, lon: 139.7018, img: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=400&q=80", desc: "著名的哥吉拉頭像地標酒店。" }
  ],
  "雪梨": [
    { name: "雪梨歌劇院", category: "transport", cost: 200, time: "2h", note: "參加內部導覽", lat: -33.8568, lon: 151.2153, img: "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=400&q=80", desc: "20世紀最具特色的建築之一。" },
    { name: "邦迪海灘", category: "transport", cost: 0, time: "3h", note: "衝浪與日光浴", lat: -33.8915, lon: 151.2767, img: "https://images.unsplash.com/photo-1523428098666-1a6a90e96033?w=400&q=80", desc: "澳洲最著名的海灘。" },
    { name: "雪梨魚市場", category: "food", cost: 250, time: "2h", note: "生蠔龍蝦午餐", lat: -33.8732, lon: 151.1923, img: "https://images.unsplash.com/photo-1621316279476-b33344662867?w=400&q=80", desc: "南半球最大的海鮮市場。" },
    { name: "維多利亞女王大廈", category: "shopping", cost: 0, time: "2h", note: "古蹟內購物", lat: -33.8718, lon: 151.2067, img: "https://images.unsplash.com/photo-1596527588365-d4e77243c220?w=400&q=80", desc: "羅馬式建築風格的購物中心。" }
  ],
  // 預設 (Fallback)
  "default": [
    { name: "市中心廣場", category: "transport", cost: 0, time: "1h", note: "地標打卡", lat: 0, lon: 0, img: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=400&q=80", desc: "城市的中心地帶。" },
    { name: "當地博物館", category: "transport", cost: 100, time: "2h", note: "了解歷史", lat: 0, lon: 0, img: "https://images.unsplash.com/photo-1566127444979-b3d2b654e3d7?w=400&q=80", desc: "收藏豐富的文化遺產。" }
  ]
};

// 計算距離 (Haversine Formula)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// --- Main Components ---

const Toast = ({ message, type, onClose }) => {
  useEffect(() => { const timer = setTimeout(onClose, 3000); return () => clearTimeout(timer); }, [onClose]);
  const bgClass = type === 'error' ? 'bg-red-500' : 'bg-green-600';
  const Icon = type === 'error' ? AlertCircle : Check;
  return (
    <div className={`fixed bottom-8 left-1/2 transform -translate-x-1/2 ${bgClass} text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 z-[60] animate-bounce-in`}>
      <Icon size={16} /> <span className="text-sm font-bold">{message}</span>
    </div>
  );
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
  const [showCalendar, setShowCalendar] = useState(false);
  
  // 新增：選擇景點 Modal
  const [showSpotSelector, setShowSpotSelector] = useState(false);

  const [newTrip, setNewTrip] = useState({ origin: '香港', destination: '', startDate: '', endDate: '', purpose: 'sightseeing', travelers: { adults: 1, children: 0, toddlers: 0, elderly: 0 }, flightType: 'direct', hotelType: '4star', estimatedBudget: 0, budgetDetails: {} });
  const [newItem, setNewItem] = useState({ type: 'itinerary', category: 'transport', title: '', cost: '', foreignCost: '', currency: 'HKD', date: '', notes: '', itemOwner: '成人', quantity: 1, weight: 0, startTime: '', duration: '', pName: '', pId: '', pPhone: '', pRoom: '' });
  const [editingItem, setEditingItem] = useState(null);
  const [checkInModal, setCheckInModal] = useState(false);
  const [activeTab, setActiveTab] = useState('itinerary');
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  const [showOriginSuggestions, setShowOriginSuggestions] = useState(false);
  const [loadingWeather, setLoadingWeather] = useState(false);

  useEffect(() => { const timer = setTimeout(() => setIsUpdating(false), 2000); return () => clearTimeout(timer); }, []);
  const showToast = (message, type = 'success') => setToast({ message, type });

  useEffect(() => { const unsubscribe = onAuthStateChanged(auth, (u) => { setUser(u); if (!u) signInAnonymously(auth); }); const savedHistory = localStorage.getItem('trip_search_history'); if (savedHistory) setSearchHistory(JSON.parse(savedHistory)); return () => unsubscribe(); }, []);
  useEffect(() => { if (!user) return; const q = query(collection(db, 'artifacts', APP_ID, 'users', user.uid, 'trips'), orderBy('createdAt', 'desc')); return onSnapshot(q, (snapshot) => setTrips(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))); }, [user]);
  useEffect(() => { if (!user || !currentTrip) return; const q = query(collection(db, 'artifacts', APP_ID, 'users', user.uid, 'sub_items'), where('tripId', '==', currentTrip.id)); return onSnapshot(q, (snapshot) => setItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))); }, [user, currentTrip]);

  const addItem = async (e) => {
    if (e) e.preventDefault();
    if ((!newItem.title && !newItem.pName) && !checkInModal) return; if (currentTrip.isLocked) return showToast("已鎖定", "error");
    
    // People Logic
    if (activeTab === 'people') {
        await addDoc(collection(db, 'artifacts', APP_ID, 'users', user.uid, 'sub_items'), { tripId: currentTrip.id, type: 'people', title: newItem.pName, notes: `房號: ${newItem.pRoom}`, pId: newItem.pId, pPhone: newItem.pPhone, completed: false, createdAt: serverTimestamp() });
        setNewItem({...newItem, pName:'', pId:'', pPhone:'', pRoom:''}); return showToast("人員已新增", "success");
    }

    // Standard Item Logic
    let finalNotes = newItem.notes; 
    if (newItem.foreignCost && newItem.currency !== 'HKD') finalNotes = `${newItem.currency} ${newItem.foreignCost} (匯率 ${EXCHANGE_RATES[newItem.currency]}) ${finalNotes}`;
    
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

  // --- Check-in with Proximity Logic ---
  const handleCheckIn = () => {
    if (currentTrip.isLocked) return showToast("已鎖定", "error");
    if (!navigator.geolocation) return showToast("不支援定位", "error");
    
    navigator.geolocation.getCurrentPosition((pos) => {
       const { latitude, longitude } = pos.coords;
       const t = new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
       
       // 尋找最近景點
       const citySpots = POI_DB[currentTrip.destination] || [];
       let nearbySpot = null;
       let minDistance = 5; // 5km 內

       citySpots.forEach(spot => {
         if (spot.lat && spot.lon) {
           const d = calculateDistance(latitude, longitude, spot.lat, spot.lon);
           if (d < minDistance) {
             minDistance = d;
             nearbySpot = spot;
           }
         }
       });

       const defaultTitle = nearbySpot 
         ? `📍 打卡: ${nearbySpot.name} (附近)` 
         : `📍 打卡 (${latitude.toFixed(2)}, ${longitude.toFixed(2)})`;

       setNewItem(prev => ({ 
         ...prev, 
         type: 'itinerary', 
         title: defaultTitle, 
         date: new Date().toISOString().split('T')[0], 
         startTime: t, 
         notes: nearbySpot ? `位於 ${nearbySpot.name} 附近` : '', 
         cost: nearbySpot ? nearbySpot.cost : '', 
         category: 'transport', 
         isCheckIn: true 
       }));
       setCheckInModal(true);
    }, () => showToast("定位失敗", "error"));
  };

  // --- Quick Add from Info Tab ---
  const addSpotFromInfo = (spot) => {
    setActiveTab('itinerary');
    // 自動填入
    setNewItem({
        ...newItem,
        type: 'itinerary',
        category: spot.category || 'transport', // 對應衣食住行
        title: spot.name,
        cost: spot.cost || 0,
        notes: spot.note || '',
        duration: spot.time || '2h',
        date: currentTrip.startDate // 預設第一天，用戶可改
    });
    // 自動滾動到新增區塊 (視窗頂部)
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    showToast(`已選擇 ${spot.name}，請確認日期後新增`, "success");
  };

  // 渲染邏輯省略部分重複... 
  // (RangeCalendar, TravelerCounter, ReportTemplate 等組件與前版相同，此處保留引用)
  // ... (保留上方定義的 RangeCalendar, TravelerCounter) ...

  // UI Render Block
  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800 flex flex-col bg-white">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      
      {/* Dashboard & Preview Logic (Same structure) */}
      {view === 'dashboard' ? (
         // Dashboard Render (省略以節省長度，邏輯同前版)
         <div className="p-8 text-center"><button onClick={()=>{setNewTrip({origin:'香港', destination:'東京', startDate:'2024-06-01', endDate:'2024-06-05', purpose:'sightseeing', travelers:{adults:1, children:0, toddlers:0, elderly:0}, budgetDetails:{}}); setView('trip-detail'); setCurrentTrip({id:'demo', destination:'東京', startDate:'2024-06-01', endDate:'2024-06-05', isLocked:false});}} className="bg-blue-600 text-white p-4 rounded">進入 Demo (開發測試用，請使用上方完整代碼)</button></div>
      ) : (
        <>
          <div className="bg-white border-b sticky top-0 z-20 shadow-sm print:hidden">
            <div className="max-w-4xl mx-auto px-4">
              <div className="flex items-center justify-between py-3">
                <button onClick={() => setView('dashboard')} className="text-gray-500 hover:text-blue-600 text-sm">← 返回</button>
                <div className="text-center"><h1 className="font-bold text-lg">{currentTrip.destination}</h1></div>
                <div className="flex gap-2">
                   {/* ... Buttons ... */}
                </div>
              </div>
              <div className="flex gap-6 overflow-x-auto pb-1 scrollbar-hide">
                {[{ id: 'itinerary', icon: <MapPin size={18}/>, label: '行程' }, { id: 'packing', icon: <Briefcase size={18}/>, label: '行李' }, { id: 'budget', icon: <DollarSign size={18}/>, label: '記帳' }, { id: 'people', icon: <Users size={18}/>, label: '人員' }, { id: 'info', icon: <FileText size={18}/>, label: '資訊' }].map(tab => (
                  <button key={tab.id} onClick={() => { setActiveTab(tab.id); setNewItem({...newItem, type: tab.id}); setEditingItem(null); }} className={`flex items-center gap-2 pb-3 border-b-2 whitespace-nowrap ${activeTab === tab.id ? 'border-blue-600 text-blue-600 font-bold' : 'border-transparent text-gray-500'}`}>{tab.icon} {tab.label}</button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex-1 max-w-4xl mx-auto w-full p-4 space-y-6 print:hidden">
            
            {/* Info Tab: 資訊豐富化 */}
            {activeTab === 'info' && (
               <div className="space-y-6">
                  <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-6 rounded-2xl shadow-lg">
                     <h2 className="text-2xl font-bold mb-2">{currentTrip.destination} 旅遊指南</h2>
                     <p className="opacity-90">{CITY_DATA[currentTrip.destination]?.intro}</p>
                  </div>

                  {/* 分類顯示景點 */}
                  {['shopping', 'food', 'stay', 'transport'].map(catKey => {
                     const catLabel = CATEGORY_LABELS[catKey];
                     const spots = (POI_DB[currentTrip.destination] || POI_DB['default']).filter(s => s.category === catKey);
                     if (spots.length === 0) return null;

                     return (
                        <div key={catKey}>
                           <h3 className={`font-bold text-lg mb-3 flex items-center gap-2 ${catLabel.color}`}>
                              <catLabel.icon size={20}/> {catLabel.label}推薦
                           </h3>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {spots.map((spot, idx) => (
                                 <div key={idx} className="bg-white border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow group">
                                    <div className="h-32 bg-gray-200 relative overflow-hidden">
                                       <img src={spot.img} alt={spot.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"/>
                                       <div className="absolute bottom-0 left-0 bg-black/50 text-white text-xs px-2 py-1 w-full flex justify-between">
                                          <span><Clock size={10} className="inline mr-1"/>{spot.time}</span>
                                          <span>預算 ${spot.cost}</span>
                                       </div>
                                    </div>
                                    <div className="p-3">
                                       <div className="flex justify-between items-start mb-1">
                                          <h4 className="font-bold text-gray-800">{spot.name}</h4>
                                          {spot.lat && <a href={`https://www.google.com/maps/search/?api=1&query=${spot.lat},${spot.lon}`} target="_blank" rel="noreferrer" className="text-blue-500 hover:text-blue-700"><MapPin size={16}/></a>}
                                       </div>
                                       <p className="text-xs text-gray-500 line-clamp-2 mb-3">{spot.desc || spot.note}</p>
                                       <button onClick={() => addSpotFromInfo(spot)} className="w-full bg-gray-50 text-blue-600 text-xs py-2 rounded-lg font-bold border border-blue-100 hover:bg-blue-600 hover:text-white transition-colors flex items-center justify-center gap-1">
                                          <Plus size={12}/> 加入行程預算
                                       </button>
                                    </div>
                                 </div>
                              ))}
                           </div>
                        </div>
                     )
                  })}
               </div>
            )}

            {/* CheckIn Modal */}
            {checkInModal && (
              <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                 <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">📍 {newItem.title.includes('附近') ? '智能打卡' : '足跡打卡'}</h3>
                    <div className="text-sm font-bold text-blue-600 mb-2">{newItem.title}</div>
                    {newItem.notes && <div className="text-xs text-gray-500 bg-gray-100 p-2 rounded mb-4">{newItem.notes}</div>}
                    
                    <div className="space-y-3">
                       <input type="text" value={newItem.notes} onChange={e=>setNewItem({...newItem, notes:e.target.value})} className="w-full p-2 border rounded-lg" placeholder="補充備註..."/>
                       <div className="flex gap-2">
                          <input type="number" value={newItem.foreignCost} onChange={e=>setNewItem({...newItem, foreignCost:e.target.value, cost:Math.round(e.target.value * EXCHANGE_RATES[newItem.currency])})} className="flex-1 p-2 border rounded-lg" placeholder="消費金額"/>
                          <select value={newItem.currency} onChange={e=>setNewItem({...newItem, currency:e.target.value})} className="w-20 p-2 border rounded-lg bg-white">{Object.keys(EXCHANGE_RATES).map(c=><option key={c} value={c}>{c}</option>)}</select>
                       </div>
                       <div className="flex gap-2 mt-4">
                          <button onClick={()=>setCheckInModal(false)} className="flex-1 py-2 text-gray-500">取消</button>
                          <button onClick={addItem} className="flex-1 py-2 bg-blue-600 text-white rounded-lg">確認</button>
                       </div>
                    </div>
                 </div>
              </div>
            )}

            {/* Spot Selector Modal (從推薦加入) */}
            {showSpotSelector && (
               <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
                  <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto flex flex-col shadow-2xl">
                     <div className="p-4 border-b flex justify-between items-center sticky top-0 bg-white z-10">
                        <h3 className="font-bold text-lg">選擇推薦景點</h3>
                        <button onClick={()=>setShowSpotSelector(false)}><X size={20}/></button>
                     </div>
                     <div className="p-4 space-y-2">
                        {(POI_DB[currentTrip.destination] || POI_DB['default']).map((spot, idx) => (
                           <div key={idx} onClick={() => {
                              setNewItem({...newItem, title: spot.name, cost: spot.cost, category: spot.category, notes: spot.note, duration: spot.time});
                              setShowSpotSelector(false);
                           }} className="p-3 border rounded-xl hover:bg-blue-50 cursor-pointer flex justify-between items-center group">
                              <div className="flex items-center gap-3">
                                 <img src={spot.img} className="w-12 h-12 rounded-lg object-cover bg-gray-200"/>
                                 <div>
                                    <div className="font-bold text-sm group-hover:text-blue-600">{spot.name}</div>
                                    <div className="text-xs text-gray-500">{CATEGORY_LABELS[spot.category]?.label} • ${spot.cost}</div>
                                 </div>
                              </div>
                              <ArrowRight size={16} className="text-gray-300 group-hover:text-blue-500"/>
                           </div>
                        ))}
                     </div>
                  </div>
               </div>
            )}

            {/* Input Bar (Modified for Itinerary) */}
            {!checkInModal && !currentTrip.isLocked && activeTab === 'itinerary' && (
              <form onSubmit={addItem} className="bg-white p-4 rounded-xl shadow-lg border flex flex-col gap-3 sticky bottom-4 z-10 print:hidden">
                <div className="flex justify-between text-xs text-blue-500 font-bold">
                  <span>{editingItem ? "✏️ 編輯" : `➕ 新增 (${newItem.date})`}</span>
                  <button type="button" onClick={()=>setShowSpotSelector(true)} className="text-orange-500 flex items-center gap-1 hover:text-orange-600"><StarIcon size={12}/> 從推薦選擇</button>
                </div>
                
                <div className="flex gap-2 items-center">
                  <input type="text" placeholder="行程名稱" className="flex-1 p-2 bg-gray-50 rounded-lg outline-none focus:bg-white focus:ring-2 ring-blue-100" value={newItem.title} onChange={e => setNewItem({...newItem, title: e.target.value})} />
                  <div className="flex gap-1"><input type="time" value={newItem.startTime} onChange={e=>setNewItem({...newItem, startTime: e.target.value})} className="w-20 p-2 bg-gray-50 rounded-lg text-xs"/><input type="text" placeholder="時長" value={newItem.duration} onChange={e=>setNewItem({...newItem, duration: e.target.value})} className="w-12 p-2 bg-gray-50 rounded-lg text-xs text-center"/></div>
                  <button type="submit" className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700">{editingItem ? <Edit2 size={16}/> : <Plus size={20}/>}</button>
                </div>
              </form>
            )}

            {/* Reuse generic input bar for other tabs... (Same as before) */}
            {!checkInModal && !currentTrip.isLocked && activeTab !== 'itinerary' && activeTab !== 'info' && (
                <form onSubmit={addItem} className="bg-white p-4 rounded-xl shadow-lg border flex flex-col gap-3 sticky bottom-4 z-10 print:hidden">
                   {/* ... Same Input Fields as previous version for Budget/Packing/People ... */}
                   <div className="flex gap-2 items-center">
                      <input type="text" placeholder="名稱" className="flex-1 p-2 bg-gray-50 rounded-lg" value={newItem.title || newItem.pName} onChange={e=>setNewItem({...newItem, title:e.target.value, pName:e.target.value})}/>
                      <button type="submit" className="bg-blue-600 text-white p-2 rounded-lg"><Plus size={20}/></button>
                   </div>
                </form>
            )}

          </div>
        </>
      )}
    </div>
  );
}

function StarIcon(props) { return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> }

export default TravelApp;
