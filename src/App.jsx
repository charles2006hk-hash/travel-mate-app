import React, { useState, useMemo } from 'react';
import { 
  Map, Calendar, CheckSquare, 
  Plane, Hotel, Camera, Utensils, 
  Plus, Trash2, Edit3, Lock, Unlock,
  MapPin, PieChart as PieChartIcon,
  Briefcase, Sparkles, Sun, CloudRain,
  ArrowRight, Users, Home, Printer, Phone,
  Ambulance, Car, X, FileText, ChevronLeft, ChevronRight,
  Baby, Accessibility, ShoppingBag, Train, DollarSign, Info
} from 'lucide-react';

// --- Mock Data ---

const MOCK_DESTINATIONS = [
  { 
    id: 'kyoto', name: '日本 京都 (Kyoto)', image: 'from-rose-400 to-orange-300', currency: 'JPY',
    baseFlight: 12000, baseDailyCost: 3000, // TWDimport React, { useState, useMemo, useEffect } from 'react';
import { 
  Map, Calendar, CheckSquare, 
  Plane, Hotel, Camera, Utensils, 
  Plus, Trash2, Edit3, Lock, Unlock,
  MapPin, PieChart as PieChartIcon,
  Briefcase, Sparkles, Sun, CloudRain,
  ArrowRight, Users, Home, Printer, Phone,
  Ambulance, Car, X, FileText, ChevronLeft, ChevronRight,
  Baby, Accessibility, ShoppingBag, Train, DollarSign, Info, Cloud
} from 'lucide-react';

// --- Firebase Imports (Fixed for React Environment) ---
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, onSnapshot, deleteDoc, updateDoc } from 'firebase/firestore';

// --- Firebase Init ---
const firebaseConfig = JSON.parse(__firebase_config);
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// --- Mock Data (Enhanced) ---

const MOCK_DESTINATIONS = [
  { 
    id: 'kyoto', name: '日本 京都 (Kyoto)', image: 'from-rose-400 to-orange-300', currency: 'JPY',
    baseFlight: 3500, baseDailyCost: 800, // HKD approx
    emergency: { police: '110', ambulance: '119', apps: ['GO', 'Uber', 'JapanTaxi'] }
  },
  { 
    id: 'tokyo', name: '日本 東京 (Tokyo)', image: 'from-purple-500 to-pink-500', currency: 'JPY',
    baseFlight: 4000, baseDailyCost: 1000, // HKD
    emergency: { police: '110', ambulance: '119', apps: ['GO', 'Uber'] }
  },
  { 
    id: 'bangkok', name: '泰國 曼谷 (Bangkok)', image: 'from-orange-400 to-yellow-500', currency: 'THB',
    baseFlight: 1500, baseDailyCost: 500, // HKD
    emergency: { police: '191', ambulance: '1669', apps: ['Grab', 'Bolt'] }
  },
  { 
    id: 'seoul', name: '韓國 首爾 (Seoul)', image: 'from-indigo-400 to-blue-500', currency: 'KRW',
    baseFlight: 2500, baseDailyCost: 900, // HKD
    emergency: { police: '112', ambulance: '119', apps: ['Kakao T', 'Uber'] }
  },
  { 
    id: 'london', name: '英國 倫敦 (London)', image: 'from-blue-600 to-red-600', currency: 'GBP',
    baseFlight: 8000, baseDailyCost: 1500, // HKD
    emergency: { police: '999', ambulance: '999', apps: ['Uber', 'Bolt'] }
  },
  { 
    id: 'singapore', name: '新加坡 (Singapore)', image: 'from-emerald-400 to-cyan-500', currency: 'SGD',
    baseFlight: 2000, baseDailyCost: 1200, // HKD
    emergency: { police: '999', ambulance: '995', apps: ['Grab', 'Gojek'] }
  },
  { 
    id: 'taipei', name: '台灣 台北 (Taipei)', image: 'from-green-400 to-teal-500', currency: 'TWD',
    baseFlight: 1200, baseDailyCost: 600, // HKD
    emergency: { police: '110', ambulance: '119', apps: ['Uber', '55688'] }
  },
];

const POPULAR_ORIGINS = ["香港 (HKG)", "九龍 (Kowloon)", "澳門 (MFM)", "台北 (TPE)", "廣州 (CAN)"];

const TRAVELER_TYPES = [
  { id: 'adult', label: '成人', icon: Users, costFactor: 1 },
  { id: 'child', label: '兒童 (2-12歲)', icon: Baby, costFactor: 0.8 },
  { id: 'infant', label: '幼兒 (<2歲)', icon: Baby, costFactor: 0.1 },
  { id: 'senior', label: '長輩', icon: Accessibility, costFactor: 1 },
];

const PREF_OPTIONS = {
  flight: [
    { id: 'direct', label: '直飛 (較貴)', multiplier: 1.5 },
    { id: 'transfer', label: '轉機 (較便宜)', multiplier: 1.0 },
    { id: 'budget', label: '廉航 (最省)', multiplier: 0.7 }
  ],
  hotel: [
    { id: '5star', label: '奢華五星', multiplier: 2.5 },
    { id: '4star', label: '舒適四星', multiplier: 1.5 },
    { id: '3star', label: '經濟三星', multiplier: 1.0 },
    { id: 'hostel', label: '背包客棧', multiplier: 0.5 }
  ],
  purpose: [
    { id: 'leisure', label: '休閒觀光', addCategory: 'transport' }, 
    { id: 'shopping', label: '購物血拼', addCategory: 'clothing' }, 
    { id: 'foodie', label: '美食之旅', addCategory: 'food' }, 
    { id: 'culture', label: '文化深度', addCategory: 'transport' }
  ]
};

// --- Helper Functions ---

const getLunarAndHoliday = (year, month, day) => {
  const dateStr = `${month + 1}/${day}`;
  let lunar = "";
  let holiday = "";
  const lunarDay = (day + 10) % 30; 
  if (lunarDay === 1) lunar = "初一"; else if (lunarDay === 15) lunar = "十五"; else if (lunarDay === 0) lunar = "三十";
  else if (lunarDay < 11) lunar = `初${["一","二","三","四","五","六","七","八","九","十"][lunarDay-1]}`;
  else if (lunarDay < 20) lunar = `十${["一","二","三","四","五","六","七","八","九"][lunarDay-11]}`;
  else lunar = `廿${["一","二","三","四","五","六","七","八","九","十"][lunarDay-21] || ""}`;

  if (dateStr === "1/1") holiday = "元旦";
  if (dateStr === "4/4") holiday = "清明";
  if (dateStr === "5/1") holiday = "勞動";
  if (dateStr === "7/1") holiday = "回歸";
  if (dateStr === "10/1") holiday = "國慶";
  if (dateStr === "12/25") holiday = "聖誕";

  return { lunar, holiday };
};

// --- Smart Budget AI ---
const calculateSmartBudget = (dest, duration, travelers, pref, startDate) => {
  if (!dest) return { total: 0, breakdown: [] };

  const flightPref = PREF_OPTIONS.flight.find(p => p.id === pref.flight) || PREF_OPTIONS.flight[0];
  const hotelPref = PREF_OPTIONS.hotel.find(p => p.id === pref.hotel) || PREF_OPTIONS.hotel[0];
  const purposePref = PREF_OPTIONS.purpose.find(p => p.id === pref.purpose) || PREF_OPTIONS.purpose[0];

  let seasonMultiplier = 1.0;
  const month = new Date(startDate).getMonth();
  if (month === 0 || month === 6 || month === 11 || month === 3) seasonMultiplier = 1.3; // 旺季

  let budget = { clothing: 0, food: 0, housing: 0, transport: 0 };

  travelers.forEach(t => {
    const type = TRAVELER_TYPES.find(tp => tp.id === t.type) || TRAVELER_TYPES[0];
    
    // 行
    const flightCost = dest.baseFlight * type.costFactor * flightPref.multiplier * seasonMultiplier;
    const localTransport = 100 * duration * type.costFactor; // HKD daily
    budget.transport += flightCost + localTransport;

    // 食
    const dailyFood = 400 * type.costFactor; // HKD daily
    budget.food += dailyFood * duration;

    // 衣/雜
    let shoppingBase = 500 * duration;
    if (type.id === 'infant') shoppingBase = 100 * duration; 
    budget.clothing += shoppingBase;
  });

  // 住
  const roomsNeeded = Math.ceil(travelers.filter(t => t.type !== 'infant').length / 2);
  const dailyRoomRate = (dest.baseDailyCost * 1.5) * hotelPref.multiplier * seasonMultiplier;
  budget.housing += dailyRoomRate * duration * roomsNeeded;

  if (purposePref.addCategory === 'clothing') budget.clothing *= 1.5;
  if (purposePref.addCategory === 'food') budget.food *= 1.5;
  if (purposePref.addCategory === 'transport') budget.transport *= 1.2;

  const total = Math.round(budget.clothing + budget.food + budget.housing + budget.transport);
  
  return {
    total,
    breakdown: [
      { id: 'clothing', name: "衣 (購物/雜支)", value: Math.round(budget.clothing), color: "#FBBF24" },
      { id: 'food', name: "食 (餐飲美食)", value: Math.round(budget.food), color: "#34D399" },
      { id: 'housing', name: "住 (飯店住宿)", value: Math.round(budget.housing), color: "#F472B6" },
      { id: 'transport', name: "行 (機票交通)", value: Math.round(budget.transport), color: "#60A5FA" },
    ]
  };
};

const calculateActualCost = (itinerary) => {
  let total = 0;
  itinerary.forEach(day => {
    day.activities.forEach(act => {
      total += Number(act.cost || 0);
    });
  });
  return total;
};

const generateMockItinerary = (days, dest, startDate, travelers, pref) => {
  const hasKids = travelers.some(t => t.type === 'child' || t.type === 'infant');
  const flightPref = PREF_OPTIONS.flight.find(p => p.id === pref.flight);
  const hotelPref = PREF_OPTIONS.hotel.find(p => p.id === pref.hotel);

  const flightCostPerPerson = Math.round(dest.baseFlight * flightPref.multiplier);
  const hotelCostPerNight = Math.round(dest.baseDailyCost * 1.5 * hotelPref.multiplier);

  return Array.from({ length: days }, (_, i) => {
    const date = new Date(startDate);
    date.setDate(new Date(startDate).getDate() + i);
    const dateStr = `${date.getMonth() + 1}/${date.getDate()}`;
    
    let activities = [];

    activities.push({ id: `d${i}-1`, type: 'food', time: '09:00', title: '飯店早餐', loc: '飯店', tag: '早餐', cost: 0, category: 'food' });

    if (i === 0) {
      const totalFlightCost = travelers.reduce((acc, t) => {
         const type = TRAVELER_TYPES.find(tp => tp.id === t.type);
         return acc + (flightCostPerPerson * type.costFactor);
      }, 0);
      activities.push({ id: `d${i}-flight`, type: 'transport', time: '10:00', title: `前往${dest.name}`, loc: '機場', tag: '出發', cost: Math.round(totalFlightCost), category: 'transport' });
    } else {
       activities.push({ id: `d${i}-2`, type: 'sightseeing', time: '10:30', title: hasKids ? `${dest.name} 樂園` : `${dest.name} 市區觀光`, loc: '市中心', tag: '觀光', cost: hasKids ? 800 : 200, category: 'clothing' });
    }

    activities.push({ id: `d${i}-3`, type: 'food', time: '12:30', title: '當地午餐', loc: '市區', tag: '午餐', cost: 400, category: 'food' });

    if (i === 0) {
      activities.push({ id: `d${i}-hotel`, type: 'hotel', time: '15:00', title: `入住${hotelPref.label}飯店`, loc: '市中心', tag: 'Check-in', cost: hotelCostPerNight, category: 'housing' });
    } else {
      activities.push({ id: `d${i}-4`, type: 'shopping', time: '15:30', title: '自由購物', loc: '商圈', tag: '購物', cost: 500, category: 'clothing' });
    }

    activities.push({ id: `d${i}-5`, type: 'food', time: '19:00', title: '晚餐', loc: '餐廳', tag: '晚餐', cost: 600, category: 'food' });

    if (i > 0) {
       activities.push({ id: `d${i}-stay`, type: 'hotel', time: '22:00', title: '飯店住宿', loc: '飯店', tag: '住宿', cost: hotelCostPerNight, category: 'housing' });
    }

    return {
      day: i + 1,
      date: dateStr,
      fullDate: date.toISOString(), // Store as string for Firestore
      weather: i % 3 === 0 ? 'sunny' : 'cloudy',
      title: i === 0 ? "出發" : "旅程",
      emergency: dest.emergency,
      activities: activities
    };
  });
};

const generateSmartPackingList = (days, travelers) => {
   const list = {
    "隨身證件": [
      { id: 'p1', item: "護照/回鄉證", checked: false, quantity: "每人1本", owner: 'all' },
      { id: 'p2', item: "現金/信用卡", checked: false, quantity: "適量", owner: 'all' },
    ],
    "衣物": [
      { id: 'c1', item: "換洗衣物", checked: false, quantity: `${days + 1}套`, owner: 'all' },
    ],
    "電子": [
      { id: 'e1', item: "行動電源", checked: false, quantity: "1個", owner: 'all' },
      { id: 'e2', item: "Sim卡/Wifi蛋", checked: false, quantity: "1個", owner: 'all' },
    ]
  };
  travelers.forEach(t => {
      if(t.type === 'infant') {
          if(!list['幼兒']) list['幼兒'] = [];
          list['幼兒'].push({id: Date.now()+'b', item: '尿布/奶粉', checked: false, quantity: '足量', owner: t.id});
      }
      if(t.type === 'senior') {
          if(!list['長輩']) list['長輩'] = [];
          list['長輩'].push({id: Date.now()+'s', item: '平安藥', checked: false, quantity: '足量', owner: t.id});
      }
  });
  return list;
};

// --- Components ---

const DonutChart = ({ data, total }) => {
  let accumulatedDeg = 0;
  const gradients = data.map((item) => {
    const deg = (item.value / total) * 360;
    const str = `${item.color} ${accumulatedDeg}deg ${accumulatedDeg + deg}deg`;
    accumulatedDeg += deg;
    return str;
  }).join(', ');

  const conicStyle = {
    background: `conic-gradient(${gradients})`,
    borderRadius: '50%',
    width: '100%',
    height: '100%',
  };

  return (
    <div className="relative w-40 h-40 md:w-48 md:h-48 mx-auto">
      <div style={conicStyle} className="shadow-lg"></div>
      <div className="absolute inset-0 m-auto w-28 h-28 md:w-32 md:h-32 bg-white rounded-full flex flex-col items-center justify-center shadow-inner">
        <span className="text-gray-400 text-xs font-medium">總預算</span>
        <span className="text-base md:text-lg font-bold text-gray-800">${total.toLocaleString()}</span>
      </div>
    </div>
  );
};

const CustomCalendar = ({ selectedRange, onSelectRange }) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0); 
  const [currentDate, setCurrentDate] = useState(new Date()); 
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

  const handlePrevMonth = () => {
    const prev = new Date(year, month - 1, 1);
    if (prev.getMonth() < today.getMonth() && prev.getFullYear() === today.getFullYear()) return;
    setCurrentDate(prev);
  }
  const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const handleToday = () => {
    setCurrentDate(new Date());
    onSelectRange([today, today]); 
  };

  const isSelected = (date) => {
    if (!selectedRange[0]) return false;
    if (selectedRange.length === 1) return date.getTime() === selectedRange[0].getTime();
    return date >= selectedRange[0] && date <= selectedRange[1];
  };

  const handleDayClick = (day) => {
    const clickedDate = new Date(year, month, day);
    if (clickedDate < today) return;
    if (selectedRange.length === 0 || selectedRange.length === 2) onSelectRange([clickedDate]); 
    else clickedDate < selectedRange[0] ? onSelectRange([clickedDate, selectedRange[0]]) : onSelectRange([selectedRange[0], clickedDate]);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm select-none">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <button onClick={handlePrevMonth} className="p-1 hover:bg-gray-100 rounded-full"><ChevronLeft size={20}/></button>
          <h4 className="font-bold text-gray-800">{year}年 {month + 1}月</h4>
          <button onClick={handleNextMonth} className="p-1 hover:bg-gray-100 rounded-full"><ChevronRight size={20}/></button>
        </div>
        <button onClick={handleToday} className="text-xs bg-rose-100 text-rose-600 px-3 py-1 rounded-full">今天</button>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map(d => <div key={d} className="text-center text-xs font-bold text-gray-400">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dateObj = new Date(year, month, day);
          const selected = isSelected(dateObj);
          const disabled = dateObj < today;
          const { holiday } = getLunarAndHoliday(year, month, day);
          return (
            <button 
              key={day} onClick={() => handleDayClick(day)} disabled={disabled}
              className={`h-12 rounded-lg flex flex-col items-center justify-center border 
                ${selected ? 'bg-rose-500 text-white' : disabled ? 'bg-gray-50 text-gray-300' : 'bg-white hover:border-rose-300'}
              `}
            >
              <span className="text-sm font-bold">{day}</span>
              {holiday && <span className="text-[9px]">{holiday}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
};

// --- Main App ---

export default function TravelApp() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('home'); 
  const [trips, setTrips] = useState([]);
  const [currentTripId, setCurrentTripId] = useState(null);

  // Wizard State
  const [step, setStep] = useState(1);
  const [w_origin, setW_Origin] = useState("香港 (HKG)");
  const [w_dest, setW_Dest] = useState(null);
  const [w_range, setW_Range] = useState([new Date(), new Date()]); 
  const [w_travelers, setW_Travelers] = useState([{ id: '1', name: '我', type: 'adult', docId: '', phone: '' }]);
  const [w_pref, setW_Pref] = useState({ flight: 'direct', hotel: '4star', purpose: 'leisure' });

  // Dashboard State
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [editingActivityId, setEditingActivityId] = useState(null);
  const [activityForm, setActivityForm] = useState({ type: 'other', time: '10:00', title: '', loc: '', tag: '', cost: 0, category: 'clothing' });
  const [targetDay, setTargetDay] = useState(1);
  
  // Packing State
  const [newItemText, setNewItemText] = useState("");
  const [newItemOwner, setNewItemOwner] = useState("all");

  // --- Authentication & Data Sync ---
  useEffect(() => {
    const initAuth = async () => {
      if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
        await signInWithCustomToken(auth, __initial_auth_token);
      } else {
        await signInAnonymously(auth);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    // Strict path: /artifacts/{appId}/users/{userId}/trips
    const tripsRef = collection(db, 'artifacts', appId, 'users', user.uid, 'trips');
    const unsubscribe = onSnapshot(tripsRef, (snapshot) => {
      const tripsData = snapshot.docs.map(doc => {
        const data = doc.data();
        // Restore dates from string/timestamp
        return {
          ...data,
          dateRange: {
            start: new Date(data.dateRange.start),
            end: new Date(data.dateRange.end)
          }
        };
      });
      setTrips(tripsData);
    }, (error) => console.error("Sync error:", error));
    return () => unsubscribe();
  }, [user]);

  const saveTripToCloud = async (tripData) => {
    if (!user) return;
    const tripRef = doc(db, 'artifacts', appId, 'users', user.uid, 'trips', tripData.id);
    // Convert dates to string for storage
    const storageData = {
      ...tripData,
      dateRange: {
        start: tripData.dateRange.start.toISOString(),
        end: tripData.dateRange.end.toISOString()
      }
    };
    await setDoc(tripRef, storageData);
  };

  const deleteTripFromCloud = async (tripId) => {
    if (!user) return;
    await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'trips', tripId));
  };

  // --- Memoized Helpers ---
  const currentTrip = useMemo(() => trips.find(t => t.id === currentTripId), [trips, currentTripId]);
  const isLocked = currentTrip?.isLocked || false;
  const currentActualCost = useMemo(() => currentTrip ? calculateActualCost(currentTrip.itinerary) : 0, [currentTrip]);

  // --- Handlers ---

  const handleCreateTrip = async () => {
    const startDate = w_range[0];
    const endDate = w_range.length === 2 ? w_range[1] : w_range[0];
    const duration = Math.round((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
    
    const budget = calculateSmartBudget(w_dest, duration, w_travelers, w_pref, startDate);
    const itinerary = generateMockItinerary(duration, w_dest, startDate, w_travelers, w_pref);
    const packingList = generateSmartPackingList(duration, w_travelers);

    const newTrip = {
      id: Date.now().toString(),
      status: 'planned',
      isLocked: false,
      destination: w_dest,
      origin: w_origin,
      dateRange: { start: startDate, end: endDate },
      duration,
      travelers: w_travelers,
      budget,
      itinerary,
      packingList,
      preferences: w_pref
    };

    await saveTripToCloud(newTrip);
    setCurrentTripId(newTrip.id);
    setView('dashboard');
    setStep(1); 
  };

  const toggleTripLock = async () => {
    if(!currentTrip) return;
    const updated = { ...currentTrip, isLocked: !currentTrip.isLocked };
    await saveTripToCloud(updated);
  };

  const handleDeleteTrip = async (id, e) => {
    e.stopPropagation();
    if(confirm('確定要刪除這個行程嗎？')) {
      await deleteTripFromCloud(id);
      if(currentTripId === id) setView('home');
    }
  }

  // Activity Handlers
  const handleSaveActivity = async () => {
    if (!currentTrip || !activityForm.title) return;
    const updatedItinerary = currentTrip.itinerary.map(day => {
      if (day.day === targetDay) {
        let newActivities = [...day.activities];
        const newAct = { ...activityForm, id: editingActivityId || Date.now().toString() };
        if (editingActivityId) newActivities = newActivities.map(a => a.id === editingActivityId ? newAct : a);
        else newActivities.push(newAct);
        newActivities.sort((a, b) => a.time.localeCompare(b.time));
        return { ...day, activities: newActivities };
      }
      return day;
    });
    
    await saveTripToCloud({ ...currentTrip, itinerary: updatedItinerary });
    setShowActivityModal(false);
  };

  // Packing Handlers
  const handleAddItem = async (category) => {
    if (!currentTrip || !newItemText || isLocked) return;
    const updatedList = { ...currentTrip.packingList };
    if (!updatedList[category]) updatedList[category] = [];
    updatedList[category].push({ 
      id: Date.now().toString(), 
      item: newItemText, 
      checked: false, 
      quantity: "1",
      owner: newItemOwner 
    });
    await saveTripToCloud({ ...currentTrip, packingList: updatedList });
    setNewItemText("");
  };

  const togglePackingCheck = async (category, id) => {
    const updatedList = { ...currentTrip.packingList };
    updatedList[category] = updatedList[category].map(item => item.id === id ? { ...item, checked: !item.checked } : item);
    await saveTripToCloud({ ...currentTrip, packingList: updatedList });
  };

  const handleDeleteItem = async (category, id) => {
    if (isLocked) return;
    const updatedList = { ...currentTrip.packingList };
    updatedList[category] = updatedList[category].filter(item => item.id !== id);
    await saveTripToCloud({ ...currentTrip, packingList: updatedList });
  };

  // --- Views ---

  if (view === 'home') {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans pb-24 md:pb-8">
        <div className="max-w-5xl mx-auto">
          <header className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-2">
              <Cloud className="text-rose-500" size={32}/>
              <h1 className="text-2xl font-bold text-gray-800">TravelMate <span className="text-rose-500">AI</span></h1>
            </div>
            <button onClick={() => { setView('wizard'); setStep(1); }} className="bg-rose-500 text-white px-4 py-2 rounded-xl font-bold flex gap-2 hover:bg-rose-600 transition-all shadow-md">
              <Plus size={18} /> 建立新行程
            </button>
          </header>
          
          {!user ? (
            <div className="text-center py-20 text-gray-400">正在連接雲端資料庫...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {trips.length === 0 ? (
                 <div className="col-span-full text-center py-20 bg-white rounded-3xl border-2 border-dashed border-gray-200">
                   <h3 className="text-xl font-bold text-gray-400">雲端暫無行程</h3>
                   <p className="text-gray-400 mt-2">您的行程將會自動同步至此</p>
                 </div>
              ) : trips.map(trip => {
                 const actual = calculateActualCost(trip.itinerary);
                 return (
                  <div key={trip.id} onClick={() => { setCurrentTripId(trip.id); setView('dashboard'); }} className="bg-white rounded-2xl border shadow-sm cursor-pointer hover:shadow-lg transition-all overflow-hidden relative group">
                    <div className={`h-32 bg-gradient-to-br ${trip.destination.image} relative p-4`}>
                      <div className="absolute top-4 right-4 bg-white/30 backdrop-blur text-white text-xs px-2 py-1 rounded font-bold">{trip.duration} 天</div>
                      <div className="absolute bottom-4 left-4 text-white">
                        <h3 className="text-xl font-bold shadow-black drop-shadow-md">{trip.destination.name}</h3>
                        <p className="text-xs opacity-90">{trip.dateRange.start.toLocaleDateString()}</p>
                      </div>
                      <button onClick={(e)=>handleDeleteTrip(trip.id, e)} className="absolute top-4 left-4 bg-red-500/80 p-1 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"><Trash2 size={12}/></button>
                    </div>
                    <div className="p-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">AI 預算</span>
                        <span className="font-bold text-gray-800">${trip.budget.total.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">實際規劃</span>
                        <span className={`font-bold ${actual > trip.budget.total ? 'text-red-500' : 'text-green-500'}`}>${actual.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                 );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Wizard & Dashboard views share mostly same structure but now use handleCreateTrip / handleSaveActivity which call Firestore
  if (view === 'wizard') {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center py-8 px-4 font-sans">
        <div className="w-full max-w-3xl bg-white rounded-3xl shadow-xl flex flex-col h-[85vh]">
          <div className="p-6 border-b flex justify-between items-center">
            <h2 className="text-xl font-bold flex items-center gap-2"><Sparkles className="text-rose-500"/> AI 規劃嚮導</h2>
            <div className="flex gap-2">{[1, 2, 3].map(i => <div key={i} className={`w-2 h-2 rounded-full ${step >= i ? 'bg-rose-500' : 'bg-gray-300'}`}></div>)}</div>
          </div>
          
          <div className="flex-1 p-8 overflow-y-auto">
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <label className="font-bold block mb-2">出發地</label>
                  <div className="flex gap-2 mb-2 flex-wrap">
                    {POPULAR_ORIGINS.map(city => (
                      <button key={city} onClick={() => setW_Origin(city)} className={`text-sm px-3 py-1 rounded-full border ${w_origin === city ? 'bg-rose-500 text-white border-rose-500' : 'bg-white text-gray-600 border-gray-200'}`}>{city}</button>
                    ))}
                  </div>
                  <input value={w_origin} onChange={e=>setW_Origin(e.target.value)} className="w-full p-3 border rounded-xl" />
                </div>
                <div>
                  <label className="font-bold block mb-2">目的地</label>
                  <div className="grid grid-cols-2 gap-4">
                    {MOCK_DESTINATIONS.map(d => (
                      <div key={d.id} onClick={()=>setW_Dest(d)} className={`p-4 border rounded-xl cursor-pointer ${w_dest?.id===d.id?'border-rose-500 bg-rose-50':''}`}>
                        <div className="font-bold">{d.name}</div>
                        <div className="text-xs text-gray-500">預算約 ${d.baseDailyCost}/日</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div><label className="font-bold block mb-2">日期</label><CustomCalendar selectedRange={w_range} onSelectRange={setW_Range} /></div>
              </div>
            )}
            
            {step === 2 && (
              <div className="space-y-6">
                <h3 className="font-bold">行程參數</h3>
                <div className="grid grid-cols-3 gap-4">
                   <div>
                     <label className="text-xs text-gray-500 block mb-1">航班</label>
                     <select className="w-full p-2 border rounded" value={w_pref.flight} onChange={e=>setW_Pref({...w_pref, flight: e.target.value})}>
                       {PREF_OPTIONS.flight.map(o=><option key={o.id} value={o.id}>{o.label}</option>)}
                     </select>
                   </div>
                   <div>
                     <label className="text-xs text-gray-500 block mb-1">住宿</label>
                     <select className="w-full p-2 border rounded" value={w_pref.hotel} onChange={e=>setW_Pref({...w_pref, hotel: e.target.value})}>
                       {PREF_OPTIONS.hotel.map(o=><option key={o.id} value={o.id}>{o.label}</option>)}
                     </select>
                   </div>
                   <div>
                     <label className="text-xs text-gray-500 block mb-1">目的</label>
                     <select className="w-full p-2 border rounded" value={w_pref.purpose} onChange={e=>setW_Pref({...w_pref, purpose: e.target.value})}>
                       {PREF_OPTIONS.purpose.map(o=><option key={o.id} value={o.id}>{o.label}</option>)}
                     </select>
                   </div>
                </div>

                <div className="flex justify-between items-center mt-4">
                  <h3 className="font-bold">旅客資料</h3>
                  <button onClick={() => setW_Travelers([...w_travelers, {id: Date.now(), name: '旅伴', type: 'adult'}])} className="text-rose-500 text-sm flex items-center"><Plus size={16}/> 新增</button>
                </div>
                {w_travelers.map((t, idx) => (
                  <div key={idx} className="p-4 border rounded-xl bg-gray-50 grid grid-cols-2 gap-2 relative">
                    <input placeholder="姓名" value={t.name} onChange={e=>{const n=[...w_travelers];n[idx].name=e.target.value;setW_Travelers(n)}} className="p-2 border rounded"/>
                    <select value={t.type} onChange={e=>{const n=[...w_travelers];n[idx].type=e.target.value;setW_Travelers(n)}} className="p-2 border rounded">
                      {TRAVELER_TYPES.map(type=><option key={type.id} value={type.id}>{type.label}</option>)}
                    </select>
                    {idx > 0 && <button onClick={()=>{setW_Travelers(w_travelers.filter((_,i)=>i!==idx))}} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"><X size={12}/></button>}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-4 border-t flex justify-between">
             {step > 1 ? <button onClick={()=>setStep(step-1)} className="px-4 py-2 bg-gray-100 rounded">上一步</button> : <button onClick={()=>setView('home')} className="px-4 py-2 bg-gray-100 rounded">取消</button>}
             {step < 2 ? <button disabled={!w_dest} onClick={()=>setStep(2)} className="px-4 py-2 bg-rose-500 text-white rounded">下一步</button> : <button onClick={handleCreateTrip} className="px-4 py-2 bg-rose-500 text-white rounded">生成行程 (雲端同步)</button>}
          </div>
        </div>
      </div>
    );
  }

  if (view === 'dashboard' && currentTrip) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row font-sans">
        {/* Sidebar */}
        <aside className="w-full md:w-64 bg-white border-r flex-col md:flex hidden md:block">
           <div className="p-6 border-b"><h1 className="font-bold text-lg">TravelMate</h1></div>
           <div className="p-4 space-y-2">
              <button onClick={()=>setView('dashboard')} className="w-full text-left p-2 bg-rose-50 text-rose-600 rounded font-medium flex gap-2"><Map size={18}/> 行程</button>
              <button onClick={()=>setView('print')} className="w-full text-left p-2 hover:bg-gray-50 rounded text-gray-600 flex gap-2"><Printer size={18}/> 列印</button>
           </div>
           <div className="mt-auto p-4 border-t">
              <button onClick={toggleTripLock} className={`w-full p-2 rounded mb-2 flex justify-center gap-2 ${isLocked?'bg-gray-800 text-white':'bg-gray-200'}`}>{isLocked?<Lock size={16}/>:<Unlock size={16}/>} {isLocked?'已鎖定':'鎖定行程'}</button>
              <button onClick={()=>setView('home')} className="w-full p-2 text-center text-gray-500">回首頁</button>
           </div>
        </aside>

        {/* Content */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between mb-6 gap-4">
             <div>
               <h1 className="text-2xl font-bold">{currentTrip.destination.name} 之旅</h1>
               <div className="text-gray-500 text-sm flex gap-4 mt-1">
                 <span>{currentTrip.dateRange.start.toLocaleDateString()} - {currentTrip.dateRange.end.toLocaleDateString()}</span>
                 <span>{currentTrip.travelers.length} 人</span>
               </div>
             </div>
             <div className="text-right bg-white p-3 rounded-xl border shadow-sm">
                <div className="text-xs text-gray-500">預算 vs 實際</div>
                <div className="font-bold text-lg flex gap-2 items-center">
                   <span className="text-gray-400">${currentTrip.budget.total.toLocaleString()}</span>
                   <ArrowRight size={14}/>
                   <span className={currentActualCost > currentTrip.budget.total ? 'text-red-500' : 'text-green-600'}>
                     ${currentActualCost.toLocaleString()}
                   </span>
                </div>
             </div>
          </div>

          {/* Traveler Info */}
          <div className="mb-8 bg-white p-4 rounded-xl border shadow-sm">
             <h3 className="font-bold text-gray-700 mb-3 flex items-center gap-2"><Users size={18}/> 旅客資料</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
               {currentTrip.travelers.map((t, i) => (
                 <div key={i} className="bg-gray-50 p-3 rounded-lg text-sm border">
                    <div className="flex justify-between font-bold mb-1">
                      <span>{t.name}</span>
                      <span className="text-xs bg-gray-200 px-1 rounded text-gray-600">{TRAVELER_TYPES.find(tp=>tp.id===t.type)?.label}</span>
                    </div>
                    <div className="text-gray-500 text-xs">ID: {t.docId || '-'}</div>
                 </div>
               ))}
             </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Itinerary */}
            <div className="lg:col-span-2 space-y-6">
               {currentTrip.itinerary.map(day => (
                 <div key={day.day} className="bg-white rounded-xl border overflow-hidden">
                    <div className="bg-gray-50 p-3 border-b flex justify-between items-center">
                       <span className="font-bold">Day {day.day} - {day.title}</span>
                       <div className="text-xs flex gap-2">
                          <span className="flex gap-1 items-center text-blue-600"><Phone size={10}/> 警:{day.emergency.police}</span>
                       </div>
                    </div>
                    <div className="p-3 space-y-3">
                       {day.activities.map(act => (
                         <div key={act.id} className="flex gap-3 items-start group">
                            <div className="w-12 text-xs font-bold text-gray-400 pt-1">{act.time}</div>
                            <div className="flex-1 bg-white border rounded-lg p-2 hover:shadow-md transition-all">
                               <div className="flex justify-between">
                                 <h4 className="font-bold text-sm">{act.title}</h4>
                                 <span className="text-xs font-mono bg-green-50 text-green-700 px-1 rounded flex items-center">${Number(act.cost).toLocaleString()}</span>
                               </div>
                               <div className="flex justify-between mt-1">
                                  <span className="text-xs text-gray-500">{act.loc}</span>
                                  <div className="flex gap-1 text-[10px] text-gray-400">
                                     <span>{act.category === 'food' ? '食' : act.category === 'housing' ? '住' : act.category === 'transport' ? '行' : '衣'}</span>
                                  </div>
                               </div>
                            </div>
                            {!isLocked && (
                              <button onClick={() => { setActivityForm(act); setEditingActivityId(act.id); setTargetDay(day.day); setShowActivityModal(true); }} className="text-gray-300 hover:text-blue-500 pt-2"><Edit3 size={14}/></button>
                            )}
                         </div>
                       ))}
                       {!isLocked && <button onClick={() => { setActivityForm({ type: 'other', time: '10:00', title: '', loc: '', tag: '', cost: 0, category: 'clothing' }); setEditingActivityId(null); setTargetDay(day.day); setShowActivityModal(true); }} className="w-full text-center text-xs text-gray-400 hover:text-rose-500 py-2 border-t border-dashed">+ 新增活動</button>}
                    </div>
                 </div>
               ))}
            </div>

            {/* Budget Breakdown & Packing */}
            <div className="space-y-6">
               <div className="bg-white p-6 rounded-xl border">
                  <h3 className="font-bold mb-4 flex gap-2"><PieChartIcon size={18}/> 預算四分類 (AI)</h3>
                  <DonutChart data={currentTrip.budget.breakdown} total={currentTrip.budget.total} />
                  <div className="mt-4 space-y-2">
                     {currentTrip.budget.breakdown.map(b => (
                       <div key={b.id} className="flex justify-between text-sm">
                          <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full" style={{backgroundColor: b.color}}></div>{b.name}</span>
                          <span className="font-bold">${b.value.toLocaleString()}</span>
                       </div>
                     ))}
                  </div>
               </div>

               <div className="bg-white p-6 rounded-xl border">
                 <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><Briefcase size={18} className="text-blue-500"/> 行李 (AI 生成)</h3>
                 <div className="space-y-4">
                   {Object.entries(currentTrip.packingList).map(([cat, items]) => (
                     <div key={cat}>
                       <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{cat}</h4>
                       <div className="space-y-2">
                         {items.map(item => (
                           <div key={item.id} className="flex items-center gap-2 group justify-between">
                             <div 
                               onClick={() => togglePackingCheck(cat, item.id)}
                               className="flex items-center gap-2 cursor-pointer flex-1"
                             >
                               <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${item.checked ? 'bg-blue-500 border-blue-500' : 'border-gray-300'}`}>
                                 {item.checked && <CheckSquare size={10} className="text-white"/>}
                               </div>
                               <div className="flex flex-col">
                                 <span className={`text-sm ${item.checked ? 'text-gray-400 line-through' : 'text-gray-700'}`}>{item.item}</span>
                               </div>
                             </div>
                             {!isLocked && (
                               <button onClick={() => handleDeleteItem(cat, item.id)} className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={12}/></button>
                             )}
                           </div>
                         ))}
                       </div>
                       {!isLocked && (
                         <div className="mt-2 flex gap-2 items-center bg-gray-50 p-2 rounded-lg">
                            <input 
                              type="text" 
                              placeholder="新增..." 
                              className="text-xs bg-transparent w-full outline-none"
                              value={newItemText}
                              onChange={(e) => setNewItemText(e.target.value)}
                              onKeyDown={(e) => { if(e.key === 'Enter') handleAddItem(cat); }}
                            />
                            <button onClick={() => handleAddItem(cat)} className="text-blue-500 shrink-0"><Plus size={16}/></button>
                         </div>
                       )}
                     </div>
                   ))}
                 </div>
               </div>
            </div>
          </div>
        </main>
        
        {/* Modal for Activity */}
        {showActivityModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
             <div className="bg-white w-full max-w-md rounded-2xl p-6">
                <h3 className="font-bold text-lg mb-4">{editingActivityId ? '編輯活動' : '新增活動'}</h3>
                <div className="space-y-3">
                   <input placeholder="標題" className="w-full p-2 border rounded" value={activityForm.title} onChange={e=>setActivityForm({...activityForm, title: e.target.value})} />
                   <div className="flex gap-2">
                     <input type="time" className="w-1/3 p-2 border rounded" value={activityForm.time} onChange={e=>setActivityForm({...activityForm, time: e.target.value})} />
                     <input placeholder="地點" className="flex-1 p-2 border rounded" value={activityForm.loc} onChange={e=>setActivityForm({...activityForm, loc: e.target.value})} />
                   </div>
                   <div className="flex gap-2">
                      <input type="number" placeholder="費用" className="w-1/3 p-2 border rounded" value={activityForm.cost} onChange={e=>setActivityForm({...activityForm, cost: e.target.value})} />
                      <select className="flex-1 p-2 border rounded" value={activityForm.category} onChange={e=>setActivityForm({...activityForm, category: e.target.value})}>
                         <option value="clothing">衣 (購物/雜支)</option>
                         <option value="food">食 (餐飲)</option>
                         <option value="housing">住 (住宿)</option>
                         <option value="transport">行 (交通)</option>
                      </select>
                   </div>
                </div>
                <div className="flex justify-end gap-2 mt-6">
                   <button onClick={()=>setShowActivityModal(false)} className="px-4 py-2 text-gray-500">取消</button>
                   <button onClick={handleSaveActivity} className="px-4 py-2 bg-rose-500 text-white rounded">儲存</button>
                </div>
             </div>
          </div>
        )}
      </div>
    );
  }

  return null;
}
    emergency: { police: '110', ambulance: '119', apps: ['GO', 'Uber', 'JapanTaxi'] }
  },
  { 
    id: 'bangkok', name: '泰國 曼谷 (Bangkok)', image: 'from-orange-400 to-yellow-500', currency: 'THB',
    baseFlight: 8000, baseDailyCost: 2000,
    emergency: { police: '191', ambulance: '1669', apps: ['Grab', 'Bolt'] }
  },
  { 
    id: 'paris', name: '法國 巴黎 (Paris)', image: 'from-blue-400 to-purple-300', currency: 'EUR',
    baseFlight: 35000, baseDailyCost: 5000,
    emergency: { police: '17', ambulance: '15', apps: ['Uber', 'G7', 'Bolt'] }
  },
  { 
    id: 'seoul', name: '韓國 首爾 (Seoul)', image: 'from-indigo-400 to-blue-500', currency: 'KRW',
    baseFlight: 10000, baseDailyCost: 3500,
    emergency: { police: '112', ambulance: '119', apps: ['Kakao T', 'Uber'] }
  },
];

const POPULAR_ORIGINS = ["台北 (TPE)", "高雄 (KHH)", "香港 (HKG)", "東京 (NRT)"];

const TRAVELER_TYPES = [
  { id: 'adult', label: '成人', icon: Users, costFactor: 1 },
  { id: 'child', label: '兒童 (2-12歲)', icon: Baby, costFactor: 0.8 },
  { id: 'infant', label: '幼兒 (<2歲)', icon: Baby, costFactor: 0.1 },
  { id: 'senior', label: '長輩', icon: Accessibility, costFactor: 1 },
];

const PREF_OPTIONS = {
  flight: [
    { id: 'direct', label: '直飛 (較貴)', multiplier: 1.5 },
    { id: 'transfer', label: '轉機 (較便宜)', multiplier: 1.0 },
    { id: 'budget', label: '廉航 (最省)', multiplier: 0.7 }
  ],
  hotel: [
    { id: '5star', label: '奢華五星', multiplier: 2.5 },
    { id: '4star', label: '舒適四星', multiplier: 1.5 },
    { id: '3star', label: '經濟三星', multiplier: 1.0 },
    { id: 'hostel', label: '背包客棧', multiplier: 0.5 }
  ],
  purpose: [
    { id: 'leisure', label: '休閒觀光', addCategory: 'transport' }, // 增加交通預算
    { id: 'shopping', label: '購物血拼', addCategory: 'clothing' }, // 增加購物預算
    { id: 'foodie', label: '美食之旅', addCategory: 'food' }, // 增加食物預算
    { id: 'culture', label: '文化深度', addCategory: 'transport' }
  ]
};

// --- Helper Functions ---

const getLunarAndHoliday = (year, month, day) => {
  const dateStr = `${month + 1}/${day}`;
  let lunar = "";
  let holiday = "";
  const lunarDay = (day + 10) % 30; 
  if (lunarDay === 1) lunar = "初一"; else if (lunarDay === 15) lunar = "十五"; else if (lunarDay === 0) lunar = "三十";
  else if (lunarDay < 11) lunar = `初${["一","二","三","四","五","六","七","八","九","十"][lunarDay-1]}`;
  else if (lunarDay < 20) lunar = `十${["一","二","三","四","五","六","七","八","九"][lunarDay-11]}`;
  else lunar = `廿${["一","二","三","四","五","六","七","八","九","十"][lunarDay-21] || ""}`;

  if (dateStr === "1/1") holiday = "元旦";
  if (dateStr === "4/4") holiday = "兒童節";
  if (dateStr === "5/1") holiday = "勞動節";
  if (dateStr === "10/10") holiday = "國慶";
  if (dateStr === "12/25") holiday = "聖誕";

  return { lunar, holiday };
};

// --- Core Logic: AI Budget Estimation (衣食住行) ---
const calculateSmartBudget = (dest, duration, travelers, pref, startDate) => {
  if (!dest) return { total: 0, breakdown: [] };

  // 1. 取得加權參數
  const flightPref = PREF_OPTIONS.flight.find(p => p.id === pref.flight) || PREF_OPTIONS.flight[0];
  const hotelPref = PREF_OPTIONS.hotel.find(p => p.id === pref.hotel) || PREF_OPTIONS.hotel[0];
  const purposePref = PREF_OPTIONS.purpose.find(p => p.id === pref.purpose) || PREF_OPTIONS.purpose[0];

  // 季節加成
  let seasonMultiplier = 1.0;
  const month = startDate.getMonth();
  if (month === 0 || month === 6 || month === 11) seasonMultiplier = 1.3; // 旺季

  let budget = {
    clothing: 0, // 衣 (購物/紀念品)
    food: 0,     // 食
    housing: 0,  // 住
    transport: 0 // 行 (機票/當地交通)
  };

  // 2. 計算各項
  travelers.forEach(t => {
    const type = TRAVELER_TYPES.find(tp => tp.id === t.type) || TRAVELER_TYPES[0];
    
    // [行] 機票 + 當地交通
    // 機票: 基價 * 人員係數 * 航班偏好 * 季節
    const flightCost = dest.baseFlight * type.costFactor * flightPref.multiplier * seasonMultiplier;
    const localTransport = 500 * duration * type.costFactor; // 每日預估 500
    budget.transport += flightCost + localTransport;

    // [食]
    const dailyFood = 1500 * type.costFactor; // 每日預估 1500
    budget.food += dailyFood * duration;

    // [衣/雜] (購物)
    let shoppingBase = 2000 * duration;
    if (type.id === 'infant') shoppingBase = 500 * duration; 
    budget.clothing += shoppingBase;
  });

  // [住] (以房為單位)
  const roomsNeeded = Math.ceil(travelers.filter(t => t.type !== 'infant').length / 2);
  const dailyRoomRate = (dest.baseDailyCost * 1.5) * hotelPref.multiplier * seasonMultiplier;
  budget.housing += dailyRoomRate * duration * roomsNeeded;

  // 3. 根據旅遊目的加權
  if (purposePref.addCategory === 'clothing') budget.clothing *= 1.5;
  if (purposePref.addCategory === 'food') budget.food *= 1.5;
  if (purposePref.addCategory === 'transport') budget.transport *= 1.2; // 多跑景點

  // 彙整
  const total = Math.round(budget.clothing + budget.food + budget.housing + budget.transport);
  
  return {
    total,
    breakdown: [
      { id: 'clothing', name: "衣 (購物/雜支)", value: Math.round(budget.clothing), color: "#FBBF24" },
      { id: 'food', name: "食 (餐飲美食)", value: Math.round(budget.food), color: "#34D399" },
      { id: 'housing', name: "住 (飯店住宿)", value: Math.round(budget.housing), color: "#F472B6" },
      { id: 'transport', name: "行 (機票交通)", value: Math.round(budget.transport), color: "#60A5FA" },
    ]
  };
};

// 根據行程內容計算「實際」花費
const calculateActualCost = (itinerary) => {
  let total = 0;
  itinerary.forEach(day => {
    day.activities.forEach(act => {
      total += Number(act.cost || 0);
    });
  });
  return total;
};

const generateMockItinerary = (days, dest, startDate, travelers, pref) => {
  const hasKids = travelers.some(t => t.type === 'child' || t.type === 'infant');
  const flightPref = PREF_OPTIONS.flight.find(p => p.id === pref.flight);
  const hotelPref = PREF_OPTIONS.hotel.find(p => p.id === pref.hotel);

  // 估算單項成本 (用來填入行程表)
  const flightCostPerPerson = Math.round(dest.baseFlight * flightPref.multiplier);
  const hotelCostPerNight = Math.round(dest.baseDailyCost * 1.5 * hotelPref.multiplier);

  return Array.from({ length: days }, (_, i) => {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    const dateStr = `${date.getMonth() + 1}/${date.getDate()}`;
    
    let activities = [];

    // [食] 早餐
    activities.push({ id: `d${i}-1`, type: 'food', time: '09:00', title: '飯店早餐', loc: '飯店', tag: '早餐', cost: 0, category: 'food' }); // 假設含早餐

    // [行/衣] 上午
    if (i === 0) {
      // 第一天: 交通費 (機票) 算在第一項
      const totalFlightCost = travelers.reduce((acc, t) => {
         const type = TRAVELER_TYPES.find(tp => tp.id === t.type);
         return acc + (flightCostPerPerson * type.costFactor);
      }, 0);
      activities.push({ id: `d${i}-flight`, type: 'transport', time: '10:00', title: '前往機場 & 搭機', loc: '機場', tag: '出發', cost: Math.round(totalFlightCost), category: 'transport' });
    } else {
       activities.push({ id: `d${i}-2`, type: 'sightseeing', time: '10:30', title: hasKids ? `${dest.name} 樂園/動物園` : `${dest.name} 著名景點`, loc: '市區', tag: '觀光', cost: hasKids ? 3000 : 1000, category: 'clothing' }); // 門票算在購物/雜支(衣)類別或自定義
    }

    // [食] 午餐
    activities.push({ id: `d${i}-3`, type: 'food', time: '12:30', title: '當地特色午餐', loc: '市區', tag: '午餐', cost: 1500, category: 'food' });

    // [住] 下午 checkin 或 觀光
    if (i === 0) {
      activities.push({ id: `d${i}-hotel`, type: 'hotel', time: '15:00', title: `入住${hotelPref.label}飯店`, loc: '市中心', tag: 'Check-in', cost: hotelCostPerNight, category: 'housing' });
    } else {
      activities.push({ id: `d${i}-4`, type: 'shopping', time: '15:30', title: '購物行程', loc: '商圈', tag: '購物', cost: 2000, category: 'clothing' });
    }

    // [食] 晚餐
    activities.push({ id: `d${i}-5`, type: 'food', time: '19:00', title: '精緻晚餐', loc: '餐廳', tag: '晚餐', cost: 2500, category: 'food' });

    // [住] 連泊費用 (除第一天外，每天晚上加計住宿費，或統算在第一天，這裡示範分散)
    if (i > 0) {
       // 為了讓每日花費看起來平均，也可以把住宿費分散，或只記在 check-in 那天。
       // 這裡假設每天都有住宿支出紀錄方便記帳
       activities.push({ id: `d${i}-stay`, type: 'hotel', time: '22:00', title: '飯店住宿', loc: '飯店', tag: '住宿', cost: hotelCostPerNight, category: 'housing' });
    }

    return {
      day: i + 1,
      date: dateStr,
      fullDate: date,
      weather: i % 3 === 0 ? 'sunny' : 'cloudy',
      title: i === 0 ? "出發日" : "旅程中",
      emergency: dest.emergency,
      activities: activities
    };
  });
};

const generateSmartPackingList = (days, travelers) => {
   // ... (保持原有的智能行李邏輯)
   const list = {
    "隨身證件": [
      { id: 'p1', item: "護照", checked: false, quantity: "每人1本", owner: 'all' },
      { id: 'p2', item: "現金/信用卡", checked: false, quantity: "適量", owner: 'all' },
    ],
    "衣物": [
      { id: 'c1', item: "換洗衣物", checked: false, quantity: `${days + 1}套`, owner: 'all' },
    ],
    "電子": [
      { id: 'e1', item: "行動電源", checked: false, quantity: "1個", owner: 'all' },
    ]
  };
  travelers.forEach(t => {
      if(t.type === 'infant') {
          if(!list['幼兒']) list['幼兒'] = [];
          list['幼兒'].push({id: Date.now()+'b', item: '尿布/奶粉', checked: false, quantity: '足量', owner: t.id});
      }
      if(t.type === 'senior') {
          if(!list['長輩']) list['長輩'] = [];
          list['長輩'].push({id: Date.now()+'s', item: '常備藥', checked: false, quantity: '足量', owner: t.id});
      }
  });
  return list;
};

// --- Components ---

const DonutChart = ({ data, total }) => {
  let accumulatedDeg = 0;
  const gradients = data.map((item) => {
    const deg = (item.value / total) * 360;
    const str = `${item.color} ${accumulatedDeg}deg ${accumulatedDeg + deg}deg`;
    accumulatedDeg += deg;
    return str;
  }).join(', ');

  const conicStyle = {
    background: `conic-gradient(${gradients})`,
    borderRadius: '50%',
    width: '100%',
    height: '100%',
  };

  return (
    <div className="relative w-40 h-40 md:w-48 md:h-48 mx-auto">
      <div style={conicStyle} className="shadow-lg"></div>
      <div className="absolute inset-0 m-auto w-28 h-28 md:w-32 md:h-32 bg-white rounded-full flex flex-col items-center justify-center shadow-inner">
        <span className="text-gray-400 text-xs font-medium">總預算</span>
        <span className="text-base md:text-lg font-bold text-gray-800">${total.toLocaleString()}</span>
      </div>
    </div>
  );
};

const CustomCalendar = ({ selectedRange, onSelectRange }) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0); 
  const [currentDate, setCurrentDate] = useState(new Date()); 
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

  const handlePrevMonth = () => {
    const prev = new Date(year, month - 1, 1);
    if (prev.getMonth() < today.getMonth() && prev.getFullYear() === today.getFullYear()) return;
    setCurrentDate(prev);
  }
  const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const handleToday = () => {
    setCurrentDate(new Date());
    onSelectRange([today, today]); 
  };

  const isSelected = (date) => {
    if (!selectedRange[0]) return false;
    if (selectedRange.length === 1) return date.getTime() === selectedRange[0].getTime();
    return date >= selectedRange[0] && date <= selectedRange[1];
  };

  const handleDayClick = (day) => {
    const clickedDate = new Date(year, month, day);
    if (clickedDate < today) return;
    if (selectedRange.length === 0 || selectedRange.length === 2) onSelectRange([clickedDate]); 
    else clickedDate < selectedRange[0] ? onSelectRange([clickedDate, selectedRange[0]]) : onSelectRange([selectedRange[0], clickedDate]);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm select-none">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <button onClick={handlePrevMonth} className="p-1 hover:bg-gray-100 rounded-full"><ChevronLeft size={20}/></button>
          <h4 className="font-bold text-gray-800">{year}年 {month + 1}月</h4>
          <button onClick={handleNextMonth} className="p-1 hover:bg-gray-100 rounded-full"><ChevronRight size={20}/></button>
        </div>
        <button onClick={handleToday} className="text-xs bg-rose-100 text-rose-600 px-3 py-1 rounded-full">今天</button>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map(d => <div key={d} className="text-center text-xs font-bold text-gray-400">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dateObj = new Date(year, month, day);
          const selected = isSelected(dateObj);
          const disabled = dateObj < today;
          const { holiday } = getLunarAndHoliday(year, month, day);
          return (
            <button 
              key={day} onClick={() => handleDayClick(day)} disabled={disabled}
              className={`h-12 rounded-lg flex flex-col items-center justify-center border 
                ${selected ? 'bg-rose-500 text-white' : disabled ? 'bg-gray-50 text-gray-300' : 'bg-white hover:border-rose-300'}
              `}
            >
              <span className="text-sm font-bold">{day}</span>
              {holiday && <span className="text-[9px]">{holiday}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
};

// --- Main App ---

export default function TravelApp() {
  const [view, setView] = useState('home'); 
  const [trips, setTrips] = useState([]);
  const [currentTripId, setCurrentTripId] = useState(null);

  // Wizard State
  const [step, setStep] = useState(1);
  const [w_origin, setW_Origin] = useState("台北 (TPE)");
  const [w_dest, setW_Dest] = useState(null);
  const [w_range, setW_Range] = useState([new Date(), new Date()]); 
  const [w_travelers, setW_Travelers] = useState([{ id: '1', name: '我', type: 'adult', docId: '', phone: '' }]);
  const [w_pref, setW_Pref] = useState({ flight: 'direct', hotel: '4star', purpose: 'leisure' });

  // Dashboard State
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [editingActivityId, setEditingActivityId] = useState(null);
  const [activityForm, setActivityForm] = useState({ type: 'other', time: '10:00', title: '', loc: '', tag: '', cost: 0, category: 'clothing' });
  const [targetDay, setTargetDay] = useState(1);
  
  // Packing State
  const [newItemText, setNewItemText] = useState("");
  const [newItemOwner, setNewItemOwner] = useState("all");

  const currentTrip = useMemo(() => trips.find(t => t.id === currentTripId), [trips, currentTripId]);
  const isLocked = currentTrip?.isLocked || false;

  // Real-time Actual Cost
  const currentActualCost = useMemo(() => currentTrip ? calculateActualCost(currentTrip.itinerary) : 0, [currentTrip]);

  const handleCreateTrip = () => {
    const startDate = w_range[0];
    const endDate = w_range.length === 2 ? w_range[1] : w_range[0];
    const duration = Math.round((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
    
    // AI Budget & Itinerary
    const budget = calculateSmartBudget(w_dest, duration, w_travelers, w_pref, startDate);
    const itinerary = generateMockItinerary(duration, w_dest, startDate, w_travelers, w_pref);
    const packingList = generateSmartPackingList(duration, w_travelers);

    const newTrip = {
      id: Date.now().toString(),
      status: 'planned',
      isLocked: false,
      destination: w_dest,
      origin: w_origin,
      dateRange: { start: startDate, end: endDate },
      duration,
      travelers: w_travelers,
      budget, // AI Estimated
      itinerary,
      packingList,
      preferences: w_pref
    };

    setTrips([...trips, newTrip]);
    setCurrentTripId(newTrip.id);
    setView('dashboard');
    setStep(1); 
  };

  const toggleTripLock = () => {
    setTrips(trips.map(t => t.id === currentTripId ? { ...t, isLocked: !t.isLocked } : t));
  };

  // Activity Handlers
  const handleSaveActivity = () => {
    if (!currentTrip || !activityForm.title) return;
    const updatedTrips = trips.map(t => {
      if (t.id === currentTrip.id) {
        const updatedItinerary = t.itinerary.map(day => {
          if (day.day === targetDay) {
            let newActivities = [...day.activities];
            const newAct = { ...activityForm, id: editingActivityId || Date.now().toString() };
            if (editingActivityId) newActivities = newActivities.map(a => a.id === editingActivityId ? newAct : a);
            else newActivities.push(newAct);
            newActivities.sort((a, b) => a.time.localeCompare(b.time));
            return { ...day, activities: newActivities };
          }
          return day;
        });
        return { ...t, itinerary: updatedItinerary };
      }
      return t;
    });
    setTrips(updatedTrips);
    setShowActivityModal(false);
  };

  // Views
  if (view === 'home') {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans pb-24 md:pb-8">
        <div className="max-w-5xl mx-auto">
          <header className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-bold text-gray-800">TravelMate <span className="text-rose-500">AI</span></h1>
            <button onClick={() => { setView('wizard'); setStep(1); }} className="bg-rose-500 text-white px-4 py-2 rounded-xl font-bold flex gap-2">
              <Plus size={18} /> 建立新行程
            </button>
          </header>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trips.map(trip => {
               const actual = calculateActualCost(trip.itinerary);
               return (
                <div key={trip.id} onClick={() => { setCurrentTripId(trip.id); setView('dashboard'); }} className="bg-white rounded-2xl border shadow-sm cursor-pointer hover:shadow-lg transition-all overflow-hidden relative">
                  <div className={`h-32 bg-gradient-to-br ${trip.destination.image} relative p-4`}>
                    <div className="absolute top-4 right-4 bg-white/30 backdrop-blur text-white text-xs px-2 py-1 rounded font-bold">{trip.duration} 天</div>
                    <div className="absolute bottom-4 left-4 text-white">
                      <h3 className="text-xl font-bold shadow-black drop-shadow-md">{trip.destination.name}</h3>
                      <p className="text-xs opacity-90">{trip.dateRange.start.toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">AI 預算</span>
                      <span className="font-bold text-gray-800">${trip.budget.total.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">實際規劃</span>
                      <span className={`font-bold ${actual > trip.budget.total ? 'text-red-500' : 'text-green-500'}`}>${actual.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
               );
            })}
          </div>
        </div>
      </div>
    );
  }

  if (view === 'wizard') {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center py-8 px-4 font-sans">
        <div className="w-full max-w-3xl bg-white rounded-3xl shadow-xl flex flex-col h-[85vh]">
          <div className="p-6 border-b flex justify-between items-center">
            <h2 className="text-xl font-bold flex items-center gap-2"><Sparkles className="text-rose-500"/> AI 規劃嚮導</h2>
            <div className="flex gap-2">{[1, 2, 3].map(i => <div key={i} className={`w-2 h-2 rounded-full ${step >= i ? 'bg-rose-500' : 'bg-gray-300'}`}></div>)}</div>
          </div>
          
          <div className="flex-1 p-8 overflow-y-auto">
            {step === 1 && (
              <div className="space-y-6">
                <div><label className="font-bold block mb-2">出發地</label><input value={w_origin} onChange={e=>setW_Origin(e.target.value)} className="w-full p-3 border rounded-xl" /></div>
                <div>
                  <label className="font-bold block mb-2">目的地</label>
                  <div className="grid grid-cols-2 gap-4">
                    {MOCK_DESTINATIONS.map(d => (
                      <div key={d.id} onClick={()=>setW_Dest(d)} className={`p-4 border rounded-xl cursor-pointer ${w_dest?.id===d.id?'border-rose-500 bg-rose-50':''}`}>{d.name}</div>
                    ))}
                  </div>
                </div>
                <div><label className="font-bold block mb-2">日期</label><CustomCalendar selectedRange={w_range} onSelectRange={setW_Range} /></div>
              </div>
            )}
            
            {step === 2 && (
              <div className="space-y-6">
                <h3 className="font-bold">設定行程參數 (影響 AI 預算)</h3>
                <div className="grid grid-cols-3 gap-4">
                   <div>
                     <label className="text-xs text-gray-500 block mb-1">航班</label>
                     <select className="w-full p-2 border rounded" value={w_pref.flight} onChange={e=>setW_Pref({...w_pref, flight: e.target.value})}>
                       {PREF_OPTIONS.flight.map(o=><option key={o.id} value={o.id}>{o.label}</option>)}
                     </select>
                   </div>
                   <div>
                     <label className="text-xs text-gray-500 block mb-1">住宿</label>
                     <select className="w-full p-2 border rounded" value={w_pref.hotel} onChange={e=>setW_Pref({...w_pref, hotel: e.target.value})}>
                       {PREF_OPTIONS.hotel.map(o=><option key={o.id} value={o.id}>{o.label}</option>)}
                     </select>
                   </div>
                   <div>
                     <label className="text-xs text-gray-500 block mb-1">目的</label>
                     <select className="w-full p-2 border rounded" value={w_pref.purpose} onChange={e=>setW_Pref({...w_pref, purpose: e.target.value})}>
                       {PREF_OPTIONS.purpose.map(o=><option key={o.id} value={o.id}>{o.label}</option>)}
                     </select>
                   </div>
                </div>

                <div className="flex justify-between items-center mt-4">
                  <h3 className="font-bold">旅客資料</h3>
                  <button onClick={() => setW_Travelers([...w_travelers, {id: Date.now(), name: '旅伴', type: 'adult'}])} className="text-rose-500 text-sm flex items-center"><Plus size={16}/> 新增</button>
                </div>
                {w_travelers.map((t, idx) => (
                  <div key={idx} className="p-4 border rounded-xl bg-gray-50 grid grid-cols-2 gap-2 relative">
                    <input placeholder="姓名" value={t.name} onChange={e=>{const n=[...w_travelers];n[idx].name=e.target.value;setW_Travelers(n)}} className="p-2 border rounded"/>
                    <select value={t.type} onChange={e=>{const n=[...w_travelers];n[idx].type=e.target.value;setW_Travelers(n)}} className="p-2 border rounded">
                      {TRAVELER_TYPES.map(type=><option key={type.id} value={type.id}>{type.label}</option>)}
                    </select>
                    {idx > 0 && <button onClick={()=>{setW_Travelers(w_travelers.filter((_,i)=>i!==idx))}} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"><X size={12}/></button>}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-4 border-t flex justify-between">
             {step > 1 ? <button onClick={()=>setStep(step-1)} className="px-4 py-2 bg-gray-100 rounded">上一步</button> : <button onClick={()=>setView('home')} className="px-4 py-2 bg-gray-100 rounded">取消</button>}
             {step < 2 ? <button disabled={!w_dest} onClick={()=>setStep(2)} className="px-4 py-2 bg-rose-500 text-white rounded">下一步</button> : <button onClick={handleCreateTrip} className="px-4 py-2 bg-rose-500 text-white rounded">生成行程</button>}
          </div>
        </div>
      </div>
    );
  }

  if (view === 'dashboard' && currentTrip) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row font-sans">
        {/* Sidebar */}
        <aside className="w-full md:w-64 bg-white border-r flex-col md:flex hidden md:block">
           <div className="p-6 border-b"><h1 className="font-bold text-lg">TravelMate</h1></div>
           <div className="p-4 space-y-2">
              <button onClick={()=>setView('dashboard')} className="w-full text-left p-2 bg-rose-50 text-rose-600 rounded font-medium flex gap-2"><Map size={18}/> 行程</button>
              <button onClick={()=>setView('print')} className="w-full text-left p-2 hover:bg-gray-50 rounded text-gray-600 flex gap-2"><Printer size={18}/> 列印</button>
           </div>
           <div className="mt-auto p-4 border-t">
              <button onClick={toggleTripLock} className={`w-full p-2 rounded mb-2 flex justify-center gap-2 ${isLocked?'bg-gray-800 text-white':'bg-gray-200'}`}>{isLocked?<Lock size={16}/>:<Unlock size={16}/>} {isLocked?'已鎖定':'鎖定行程'}</button>
              <button onClick={()=>setView('home')} className="w-full p-2 text-center text-gray-500">回首頁</button>
           </div>
        </aside>

        {/* Content */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between mb-6 gap-4">
             <div>
               <h1 className="text-2xl font-bold">{currentTrip.destination.name} 之旅</h1>
               <div className="text-gray-500 text-sm flex gap-4 mt-1">
                 <span>{currentTrip.dateRange.start.toLocaleDateString()} - {currentTrip.dateRange.end.toLocaleDateString()}</span>
                 <span>{currentTrip.travelers.length} 人</span>
               </div>
             </div>
             <div className="text-right bg-white p-3 rounded-xl border shadow-sm">
                <div className="text-xs text-gray-500">預算 vs 實際</div>
                <div className="font-bold text-lg flex gap-2 items-center">
                   <span className="text-gray-400">${currentTrip.budget.total.toLocaleString()}</span>
                   <ArrowRight size={14}/>
                   <span className={currentActualCost > currentTrip.budget.total ? 'text-red-500' : 'text-green-600'}>
                     ${currentActualCost.toLocaleString()}
                   </span>
                </div>
             </div>
          </div>

          {/* Traveler Info Section (New) */}
          <div className="mb-8 bg-white p-4 rounded-xl border shadow-sm">
             <h3 className="font-bold text-gray-700 mb-3 flex items-center gap-2"><Users size={18}/> 旅客資料</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
               {currentTrip.travelers.map((t, i) => (
                 <div key={i} className="bg-gray-50 p-3 rounded-lg text-sm border">
                    <div className="flex justify-between font-bold mb-1">
                      <span>{t.name}</span>
                      <span className="text-xs bg-gray-200 px-1 rounded text-gray-600">{TRAVELER_TYPES.find(tp=>tp.id===t.type)?.label}</span>
                    </div>
                    <div className="text-gray-500 text-xs">ID: {t.docId || '-'}</div>
                 </div>
               ))}
             </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Itinerary */}
            <div className="lg:col-span-2 space-y-6">
               {currentTrip.itinerary.map(day => (
                 <div key={day.day} className="bg-white rounded-xl border overflow-hidden">
                    <div className="bg-gray-50 p-3 border-b flex justify-between items-center">
                       <span className="font-bold">Day {day.day} - {day.title}</span>
                       <div className="text-xs flex gap-2">
                          <span className="flex gap-1 items-center text-blue-600"><Phone size={10}/> 警:{day.emergency.police}</span>
                       </div>
                    </div>
                    <div className="p-3 space-y-3">
                       {day.activities.map(act => (
                         <div key={act.id} className="flex gap-3 items-start group">
                            <div className="w-12 text-xs font-bold text-gray-400 pt-1">{act.time}</div>
                            <div className="flex-1 bg-white border rounded-lg p-2 hover:shadow-md transition-all">
                               <div className="flex justify-between">
                                 <h4 className="font-bold text-sm">{act.title}</h4>
                                 <span className="text-xs font-mono bg-green-50 text-green-700 px-1 rounded flex items-center">${Number(act.cost).toLocaleString()}</span>
                               </div>
                               <div className="flex justify-between mt-1">
                                  <span className="text-xs text-gray-500">{act.loc}</span>
                                  <div className="flex gap-1 text-[10px] text-gray-400">
                                     <span>{act.category === 'food' ? '食' : act.category === 'housing' ? '住' : act.category === 'transport' ? '行' : '衣'}</span>
                                  </div>
                               </div>
                            </div>
                            {!isLocked && (
                              <button onClick={() => { setActivityForm(act); setEditingActivityId(act.id); setTargetDay(day.day); setShowActivityModal(true); }} className="text-gray-300 hover:text-blue-500 pt-2"><Edit3 size={14}/></button>
                            )}
                         </div>
                       ))}
                       {!isLocked && <button onClick={() => { setActivityForm({ type: 'other', time: '10:00', title: '', loc: '', tag: '', cost: 0, category: 'clothing' }); setEditingActivityId(null); setTargetDay(day.day); setShowActivityModal(true); }} className="w-full text-center text-xs text-gray-400 hover:text-rose-500 py-2 border-t border-dashed">+ 新增活動</button>}
                    </div>
                 </div>
               ))}
            </div>

            {/* Budget Breakdown */}
            <div className="space-y-6">
               <div className="bg-white p-6 rounded-xl border">
                  <h3 className="font-bold mb-4 flex gap-2"><PieChartIcon size={18}/> 預算四分類 (AI)</h3>
                  <DonutChart data={currentTrip.budget.breakdown} total={currentTrip.budget.total} />
                  <div className="mt-4 space-y-2">
                     {currentTrip.budget.breakdown.map(b => (
                       <div key={b.id} className="flex justify-between text-sm">
                          <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full" style={{backgroundColor: b.color}}></div>{b.name}</span>
                          <span className="font-bold">${b.value.toLocaleString()}</span>
                       </div>
                     ))}
                  </div>
               </div>
            </div>
          </div>
        </main>
        
        {/* Modal for Activity */}
        {showActivityModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
             <div className="bg-white w-full max-w-md rounded-2xl p-6">
                <h3 className="font-bold text-lg mb-4">{editingActivityId ? '編輯活動' : '新增活動'}</h3>
                <div className="space-y-3">
                   <input placeholder="標題" className="w-full p-2 border rounded" value={activityForm.title} onChange={e=>setActivityForm({...activityForm, title: e.target.value})} />
                   <div className="flex gap-2">
                     <input type="time" className="w-1/3 p-2 border rounded" value={activityForm.time} onChange={e=>setActivityForm({...activityForm, time: e.target.value})} />
                     <input placeholder="地點" className="flex-1 p-2 border rounded" value={activityForm.loc} onChange={e=>setActivityForm({...activityForm, loc: e.target.value})} />
                   </div>
                   <div className="flex gap-2">
                      <input type="number" placeholder="費用" className="w-1/3 p-2 border rounded" value={activityForm.cost} onChange={e=>setActivityForm({...activityForm, cost: e.target.value})} />
                      <select className="flex-1 p-2 border rounded" value={activityForm.category} onChange={e=>setActivityForm({...activityForm, category: e.target.value})}>
                         <option value="clothing">衣 (購物/雜支)</option>
                         <option value="food">食 (餐飲)</option>
                         <option value="housing">住 (住宿)</option>
                         <option value="transport">行 (交通)</option>
                      </select>
                   </div>
                </div>
                <div className="flex justify-end gap-2 mt-6">
                   <button onClick={()=>setShowActivityModal(false)} className="px-4 py-2 text-gray-500">取消</button>
                   <button onClick={handleSaveActivity} className="px-4 py-2 bg-rose-500 text-white rounded">儲存</button>
                </div>
             </div>
          </div>
        )}
      </div>
    );
  }

  return null;
}
