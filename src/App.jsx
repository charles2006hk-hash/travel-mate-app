import React, { useState, useMemo, useEffect } from 'react';
import { 
  Map, Calendar, CheckSquare, 
  Plane, Hotel, Camera, Utensils, 
  Plus, Trash2, Edit3,
  MapPin, PieChart as PieChartIcon,
  Briefcase, Sparkles, Sun, CloudRain,
  ArrowRight, Users, Home, Printer, Phone,
  Ambulance, Car, X, FileText, ChevronLeft, ChevronRight, Menu
} from 'lucide-react';

// --- Mock Data ---

const MOCK_DESTINATIONS = [
  { 
    id: 'kyoto', name: '日本 京都 (Kyoto)', image: 'from-rose-400 to-orange-300', currency: 'JPY',
    emergency: { police: '110', ambulance: '119', apps: ['GO', 'Uber', 'JapanTaxi'] }
  },
  { 
    id: 'bangkok', name: '泰國 曼谷 (Bangkok)', image: 'from-orange-400 to-yellow-500', currency: 'THB',
    emergency: { police: '191', ambulance: '1669', apps: ['Grab', 'Bolt'] }
  },
  { 
    id: 'paris', name: '法國 巴黎 (Paris)', image: 'from-blue-400 to-purple-300', currency: 'EUR',
    emergency: { police: '17', ambulance: '15', apps: ['Uber', 'G7', 'Bolt'] }
  },
  { 
    id: 'seoul', name: '韓國 首爾 (Seoul)', image: 'from-indigo-400 to-blue-500', currency: 'KRW',
    emergency: { police: '112', ambulance: '119', apps: ['Kakao T', 'Uber'] }
  },
];

const POPULAR_ORIGINS = ["台北 (TPE)", "高雄 (KHH)", "香港 (HKG)", "東京 (NRT)"];

const INITIAL_PACKING_TEMPLATE = {
  "隨身證件": [
    { id: 'p1', item: "護照", checked: false, quantity: "1本", owner: 'all' },
    { id: 'p2', item: "現金/信用卡", checked: false, quantity: "適量", owner: 'all' },
  ],
  "衣物": [
    { id: 'c1', item: "換洗衣物", checked: false, quantity: "依天數", owner: 'all' },
    { id: 'c2', item: "好走的鞋", checked: false, quantity: "1雙", owner: 'all' },
  ],
  "電子": [
    { id: 'e1', item: "行動電源", checked: false, quantity: "1個", owner: 'all' },
    { id: 'e2', item: "轉接頭", checked: false, quantity: "1個", owner: 'all' },
  ]
};

// --- Helper Functions ---

// 簡單模擬農曆與假期 (Demo用途)
const getLunarAndHoliday = (year, month, day) => {
  const dateStr = `${month + 1}/${day}`;
  let lunar = "";
  let holiday = "";

  // 簡單規律模擬農曆
  const lunarDay = (day + 10) % 30; 
  if (lunarDay === 1) lunar = "初一";
  else if (lunarDay === 15) lunar = "十五";
  else if (lunarDay === 0) lunar = "三十";
  else if (lunarDay < 11) lunar = `初${["一","二","三","四","五","六","七","八","九","十"][lunarDay-1]}`;
  else if (lunarDay < 20) lunar = `十${["一","二","三","四","五","六","七","八","九"][lunarDay-11]}`;
  else lunar = `廿${["一","二","三","四","五","六","七","八","九","十"][lunarDay-21] || ""}`;

  // 固定假期範例
  if (dateStr === "1/1") holiday = "元旦";
  if (dateStr === "4/4") holiday = "兒童節";
  if (dateStr === "5/1") holiday = "勞動節";
  if (dateStr === "10/10") holiday = "國慶";
  if (dateStr === "12/25") holiday = "聖誕";
  if (month === 9 && day === 6) holiday = "中秋"; // 2025 模擬

  return { lunar, holiday };
};

const generateMockItinerary = (days, dest, startDate) => {
  return Array.from({ length: days }, (_, i) => {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    const dateStr = `${date.getMonth() + 1}/${date.getDate()}`;
    
    return {
      day: i + 1,
      date: dateStr,
      fullDate: date,
      weather: i % 3 === 0 ? 'sunny' : 'cloudy',
      title: i === 0 ? "抵達與安頓" : i === days - 1 ? "購買伴手禮與返程" : "城市探索與文化體驗",
      emergency: dest.emergency,
      activities: [
        { id: `d${i}-1`, type: 'food', time: '09:00', title: '飯店早餐', loc: '飯店餐廳', tag: '早餐' },
        { id: `d${i}-2`, type: 'sightseeing', time: '10:30', title: `${dest.name} 著名景點 ${i+1}`, loc: '市中心', tag: '觀光' },
        { id: `d${i}-3`, type: 'food', time: '12:30', title: '當地特色午餐', loc: '必比登推薦', tag: '午餐' },
        ...(i === 0 ? [{ id: `d${i}-arrival`, type: 'flight', time: '15:00', title: '辦理入住', loc: '市區飯店', tag: 'Check-in' }] : []),
        { id: `d${i}-4`, type: 'photo', time: '16:00', title: '網美打卡點', loc: '舊城區', tag: '攝影' },
        { id: `d${i}-5`, type: 'food', time: '19:00', title: '精緻晚餐', loc: '景觀餐廳', tag: '晚餐' },
      ]
    };
  });
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
  const [currentDate, setCurrentDate] = useState(new Date(2025, 9, 1)); // Default Oct 2025

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay(); // 0 is Sunday
  
  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

  const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const handleToday = () => {
    const now = new Date();
    setCurrentDate(new Date(now.getFullYear(), now.getMonth(), 1));
    onSelectRange([now, now]); // Select today
  };

  const isSelected = (date) => {
    if (!selectedRange[0]) return false;
    if (selectedRange.length === 1) return date.getTime() === selectedRange[0].getTime();
    return date >= selectedRange[0] && date <= selectedRange[1];
  };
  
  const isRangeStart = (date) => selectedRange[0] && date.getTime() === selectedRange[0].getTime();
  const isRangeEnd = (date) => selectedRange[1] && date.getTime() === selectedRange[1].getTime();

  const handleDayClick = (day) => {
    const clickedDate = new Date(year, month, day);
    if (selectedRange.length === 0 || selectedRange.length === 2) {
      onSelectRange([clickedDate]); 
    } else {
      const start = selectedRange[0];
      if (clickedDate < start) {
        onSelectRange([clickedDate, start]);
      } else {
        onSelectRange([start, clickedDate]);
      }
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm select-none">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <button onClick={handlePrevMonth} className="p-1 hover:bg-gray-100 rounded-full"><ChevronLeft size={20}/></button>
          <h4 className="font-bold text-gray-800 flex items-center gap-2">
            {year}年 {month + 1}月
          </h4>
          <button onClick={handleNextMonth} className="p-1 hover:bg-gray-100 rounded-full"><ChevronRight size={20}/></button>
        </div>
        <button 
          onClick={handleToday}
          className="text-xs bg-rose-100 text-rose-600 px-3 py-1 rounded-full hover:bg-rose-200 transition-colors"
        >
          今天
        </button>
      </div>
      
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map(d => (
          <div key={d} className={`text-center text-xs font-bold ${d === '日' || d === '六' ? 'text-rose-400' : 'text-gray-400'}`}>{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dateObj = new Date(year, month, day);
          const selected = isSelected(dateObj);
          const start = isRangeStart(dateObj);
          const end = isRangeEnd(dateObj);
          const { lunar, holiday } = getLunarAndHoliday(year, month, day);
          const isToday = new Date().toDateString() === dateObj.toDateString();

          return (
            <button 
              key={day}
              onClick={() => handleDayClick(day)}
              className={`
                h-14 md:h-16 rounded-lg flex flex-col items-center justify-center relative border transition-all overflow-hidden
                ${(start || end) ? 'bg-rose-500 text-white border-rose-600 shadow-md z-10' : ''}
                ${selected && !start && !end ? 'bg-rose-50 border-rose-100 text-rose-800' : ''}
                ${!selected ? 'bg-white text-gray-700 border-gray-100 hover:border-rose-300' : ''}
                ${isToday && !selected ? 'ring-2 ring-rose-400 ring-offset-1' : ''}
              `}
            >
              <span className="text-sm font-bold">{day}</span>
              <div className="flex flex-col items-center leading-none">
                 {holiday && <span className={`text-[9px] font-bold ${start || end ? 'text-white' : 'text-rose-500'}`}>{holiday}</span>}
                 <span className={`text-[9px] mt-0.5 ${start || end ? 'text-rose-100' : 'text-gray-400'}`}>
                   {lunar}
                 </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

// --- Main App ---

export default function TravelApp() {
  const [view, setView] = useState('home'); // 'home' | 'wizard' | 'dashboard' | 'print'
  const [trips, setTrips] = useState([]);
  const [currentTripId, setCurrentTripId] = useState(null);

  // Wizard State
  const [step, setStep] = useState(1);
  const [w_origin, setW_Origin] = useState("台北 (TPE)");
  const [w_dest, setW_Dest] = useState(null);
  const [w_range, setW_Range] = useState([new Date(2025, 9, 15), new Date(2025, 9, 20)]);
  const [w_travelers, setW_Travelers] = useState([{ id: '1', name: '我', docId: '', phone: '' }]);
  const [w_pref, setW_Pref] = useState({ flight: 'direct', hotel: '4star', purpose: 'leisure' });

  // Dashboard Modal & Edit State
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [newActivity, setNewActivity] = useState({ type: 'other', time: '10:00', title: '', loc: '', tag: '' });
  const [targetDay, setTargetDay] = useState(1);
  const [newItemText, setNewItemText] = useState("");
  const [newItemOwner, setNewItemOwner] = useState("all");
  const [editingItem, setEditingItem] = useState(null); // { category, id, text, owner }

  const currentTrip = useMemo(() => trips.find(t => t.id === currentTripId), [trips, currentTripId]);

  // --- Actions ---

  const handleCreateTrip = () => {
    // Generate Trip Data
    const startDate = w_range[0];
    const endDate = w_range.length === 2 ? w_range[1] : w_range[0];
    const duration = Math.round((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
    
    const newTrip = {
      id: Date.now().toString(),
      status: 'planned',
      destination: w_dest,
      origin: w_origin,
      dateRange: { start: startDate, end: endDate },
      duration: duration,
      travelers: w_travelers,
      budget: {
        total: 85000 * w_travelers.length, // Simple logic
        spent: 0,
        breakdown: [
           { name: "機票交通", value: 25000 * w_travelers.length, color: "#60A5FA" },
           { name: "住宿飯店", value: 30000, color: "#F472B6" },
           { name: "餐飲美食", value: 15000 * w_travelers.length, color: "#34D399" },
           { name: "購物服飾", value: 10000, color: "#FBBF24" },
           { name: "門票雜支", value: 5000, color: "#A78BFA" },
        ]
      },
      itinerary: generateMockItinerary(duration, w_dest, startDate),
      packingList: JSON.parse(JSON.stringify(INITIAL_PACKING_TEMPLATE)),
      preferences: w_pref
    };

    setTrips([...trips, newTrip]);
    setCurrentTripId(newTrip.id);
    setView('dashboard');
    setStep(1); 
  };

  const updateTraveler = (index, field, value) => {
    const updated = [...w_travelers];
    updated[index] = { ...updated[index], [field]: value };
    setW_Travelers(updated);
  };

  const addTraveler = () => {
    setW_Travelers([...w_travelers, { id: Date.now().toString(), name: `旅伴 ${w_travelers.length + 1}`, docId: '', phone: '' }]);
  };

  const removeTraveler = (index) => {
    if (w_travelers.length > 1) {
      setW_Travelers(w_travelers.filter((_, i) => i !== index));
    }
  };

  const handleAddActivity = () => {
    if (!currentTrip || !newActivity.title) return;
    const updatedTrips = trips.map(t => {
      if (t.id === currentTrip.id) {
        const updatedItinerary = t.itinerary.map(day => {
          if (day.day === targetDay) {
            return {
              ...day,
              activities: [...day.activities, { ...newActivity, id: Date.now().toString() }].sort((a, b) => a.time.localeCompare(b.time))
            };
          }
          return day;
        });
        return { ...t, itinerary: updatedItinerary };
      }
      return t;
    });
    setTrips(updatedTrips);
    setShowActivityModal(false);
    setNewActivity({ type: 'other', time: '10:00', title: '', loc: '', tag: '' });
  };

  const handleAddItem = (category) => {
    if (!currentTrip || !newItemText) return;
    const updatedTrips = trips.map(t => {
      if (t.id === currentTrip.id) {
        const updatedList = { ...t.packingList };
        if (!updatedList[category]) updatedList[category] = [];
        updatedList[category].push({ 
          id: Date.now().toString(), 
          item: newItemText, 
          checked: false, 
          quantity: "1",
          owner: newItemOwner 
        });
        return { ...t, packingList: updatedList };
      }
      return t;
    });
    setTrips(updatedTrips);
    setNewItemText("");
  };

  const handleUpdateItem = () => {
    if (!currentTrip || !editingItem) return;
    const updatedTrips = trips.map(t => {
      if (t.id === currentTrip.id) {
        const updatedList = { ...t.packingList };
        updatedList[editingItem.category] = updatedList[editingItem.category].map(item => 
          item.id === editingItem.id ? { ...item, item: editingItem.text, owner: editingItem.owner } : item
        );
        return { ...t, packingList: updatedList };
      }
      return t;
    });
    setTrips(updatedTrips);
    setEditingItem(null);
  };

  const handleDeleteItem = (category, id) => {
    const updatedTrips = trips.map(t => {
      if (t.id === currentTrip.id) {
        const updatedList = { ...t.packingList };
        updatedList[category] = updatedList[category].filter(item => item.id !== id);
        return { ...t, packingList: updatedList };
      }
      return t;
    });
    setTrips(updatedTrips);
    setEditingItem(null);
  }

  const togglePackingCheck = (category, id) => {
    const updatedTrips = trips.map(t => {
      if (t.id === currentTrip.id) {
        const updatedList = { ...t.packingList };
        updatedList[category] = updatedList[category].map(item => item.id === id ? { ...item, checked: !item.checked } : item);
        return { ...t, packingList: updatedList };
      }
      return t;
    });
    setTrips(updatedTrips);
  };

  const getTravelerName = (id) => {
    if (id === 'all') return '共用';
    const traveler = currentTrip?.travelers.find(t => t.id === id);
    return traveler ? traveler.name : '未知';
  };

  // --- Views ---

  if (view === 'home') {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans pb-24 md:pb-8">
        <div className="max-w-5xl mx-auto">
          <header className="flex justify-between items-center mb-8 md:mb-12">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-rose-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-rose-200">
                <Plane size={24} className="md:w-7 md:h-7" />
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800">TravelMate <span className="text-rose-500">AI</span></h1>
            </div>
            <button 
              onClick={() => { setView('wizard'); setStep(1); }}
              className="bg-rose-500 text-white px-4 py-2 md:px-6 md:py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-rose-600 shadow-lg shadow-rose-200 transition-all text-sm md:text-base"
            >
              <Plus size={18} /> <span className="hidden md:inline">建立新行程</span><span className="md:hidden">新建</span>
            </button>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trips.length === 0 ? (
              <div className="col-span-full text-center py-20 bg-white rounded-3xl border-2 border-dashed border-gray-200">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                  <FileText size={40} />
                </div>
                <h3 className="text-xl font-bold text-gray-400">目前沒有行程</h3>
                <p className="text-gray-400 mt-2">點擊按鈕開始規劃您的旅程</p>
              </div>
            ) : (
              trips.map(trip => (
                <div key={trip.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-all overflow-hidden group cursor-pointer" onClick={() => { setCurrentTripId(trip.id); setView('dashboard'); }}>
                  <div className={`h-32 bg-gradient-to-br ${trip.destination.image} relative`}>
                    <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md text-white text-xs px-2 py-1 rounded-lg font-bold">
                      {trip.duration} 天
                    </div>
                  </div>
                  <div className="p-5">
                    <h3 className="text-xl font-bold text-gray-800 mb-1">{trip.destination.name}</h3>
                    <p className="text-gray-500 text-sm flex items-center gap-1 mb-4">
                      <Calendar size={14}/> {trip.dateRange.start.toLocaleDateString()}
                    </p>
                    <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                      <div className="flex -space-x-2">
                        {trip.travelers.slice(0,3).map((t, i) => (
                           <div key={i} className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-xs font-bold text-gray-600">{t.name[0]}</div>
                        ))}
                        {trip.travelers.length > 3 && <div className="w-8 h-8 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-xs text-gray-500">+{trip.travelers.length-3}</div>}
                      </div>
                      <span className="text-rose-500 font-medium text-sm hover:underline">詳情 &rarr;</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  if (view === 'wizard') {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center py-4 md:py-12 px-2 md:px-4 font-sans">
        <div className="w-full max-w-3xl bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden flex flex-col h-[90vh] md:h-auto">
          {/* Header */}
          <div className="bg-rose-50 p-4 md:p-6 border-b border-rose-100 flex justify-between items-center shrink-0">
            <h2 className="text-lg md:text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Sparkles className="text-rose-500"/> AI 規劃嚮導
            </h2>
            <div className="flex gap-2">
              {[1, 2, 3].map(i => (
                <div key={i} className={`w-2 h-2 md:w-3 md:h-3 rounded-full ${step >= i ? 'bg-rose-500' : 'bg-gray-300'}`}></div>
              ))}
            </div>
          </div>

          <div className="flex-1 p-4 md:p-8 overflow-y-auto">
            {step === 1 && (
              <div className="space-y-6 animate-in slide-in-from-right-8">
                <div>
                  <label className="block font-bold text-gray-700 mb-2">出發地</label>
                  <div className="flex gap-2 mb-2 flex-wrap">
                    {POPULAR_ORIGINS.map(city => (
                      <button key={city} onClick={() => setW_Origin(city)} className={`text-sm px-3 py-1 rounded-full border ${w_origin === city ? 'bg-rose-500 text-white border-rose-500' : 'bg-white text-gray-600 border-gray-200'}`}>{city}</button>
                    ))}
                  </div>
                  <input type="text" value={w_origin} onChange={(e) => setW_Origin(e.target.value)} className="w-full p-3 border rounded-xl outline-none focus:border-rose-500 bg-gray-50" />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-2">目的地 (熱門城市)</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {MOCK_DESTINATIONS.map(dest => (
                      <div 
                        key={dest.id}
                        onClick={() => setW_Dest(dest)}
                        className={`p-3 md:p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-3 ${w_dest?.id === dest.id ? 'border-rose-500 bg-rose-50' : 'border-gray-100 hover:border-rose-200'}`}
                      >
                         <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${dest.image}`}></div>
                         <span className="font-bold text-gray-700">{dest.name}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                   <label className="block font-bold text-gray-700 mb-2">日期選擇</label>
                   <CustomCalendar selectedRange={w_range} onSelectRange={setW_Range} />
                   <p className="text-right text-sm text-gray-500 mt-2">
                     已選擇: {w_range.length === 2 
                        ? `${w_range[0].getMonth()+1}/${w_range[0].getDate()} - ${w_range[1].getMonth()+1}/${w_range[1].getDate()} (共 ${Math.round((w_range[1]-w_range[0])/(1000*60*60*24))+1} 天)` 
                        : '請選擇起訖日期'}
                   </p>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6 animate-in slide-in-from-right-8">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold text-gray-800">隨行人員資料</h3>
                  <button onClick={addTraveler} className="text-rose-500 text-sm font-bold flex items-center gap-1"><Plus size={16}/> 新增人員</button>
                </div>
                
                <div className="space-y-4">
                  {w_travelers.map((t, idx) => (
                    <div key={t.id} className="p-4 border border-gray-200 rounded-xl relative group bg-white shadow-sm">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs text-gray-500 block mb-1">姓名</label>
                          <input type="text" value={t.name} onChange={(e) => updateTraveler(idx, 'name', e.target.value)} className="w-full p-2 bg-gray-50 rounded border border-gray-200 outline-none focus:border-rose-400" placeholder="姓名" />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 block mb-1">證件號碼</label>
                          <input type="text" value={t.docId} onChange={(e) => updateTraveler(idx, 'docId', e.target.value)} className="w-full p-2 bg-gray-50 rounded border border-gray-200 outline-none focus:border-rose-400" placeholder="A123456789" />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 block mb-1">聯絡電話</label>
                          <input type="text" value={t.phone} onChange={(e) => updateTraveler(idx, 'phone', e.target.value)} className="w-full p-2 bg-gray-50 rounded border border-gray-200 outline-none focus:border-rose-400" placeholder="0912-345-678" />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 block mb-1">房間分配 (選填)</label>
                          <input type="text" value={t.room} onChange={(e) => updateTraveler(idx, 'room', e.target.value)} className="w-full p-2 bg-gray-50 rounded border border-gray-200 outline-none focus:border-rose-400" placeholder="Room 101" />
                        </div>
                      </div>
                      {idx > 0 && (
                        <button onClick={() => removeTraveler(idx)} className="absolute top-2 right-2 text-gray-300 hover:text-red-500">
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="text-center py-10 animate-in slide-in-from-right-8">
                 <div className="w-24 h-24 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-6 text-rose-500 animate-pulse">
                   <Sparkles size={48} />
                 </div>
                 <h2 className="text-2xl font-bold text-gray-800 mb-2">準備生成行程</h2>
                 <p className="text-gray-500 mb-8">AI 將根據 {w_travelers.length} 人的需求，規劃 {w_dest?.name} 之旅。</p>
                 
                 <div className="bg-gray-50 p-6 rounded-2xl text-left max-w-sm mx-auto mb-8 border border-gray-200">
                   <p className="flex justify-between mb-2"><span className="text-gray-500">日期</span> <span className="font-bold">{w_range[0].toLocaleDateString()} 起</span></p>
                   <p className="flex justify-between mb-2"><span className="text-gray-500">人數</span> <span className="font-bold">{w_travelers.length} 人</span></p>
                   <p className="flex justify-between"><span className="text-gray-500">預算預估</span> <span className="font-bold text-rose-500">${(85000 * w_travelers.length).toLocaleString()}</span></p>
                 </div>
              </div>
            )}
          </div>

          <div className="p-4 md:p-6 border-t border-gray-100 flex justify-between bg-white shrink-0">
            {step > 1 ? (
              <button onClick={() => setStep(step - 1)} className="px-4 py-2 md:px-6 text-gray-500 font-medium hover:bg-gray-100 rounded-lg">上一步</button>
            ) : (
              <button onClick={() => setView('home')} className="px-4 py-2 md:px-6 text-gray-500 font-medium hover:bg-gray-100 rounded-lg">取消</button>
            )}
            
            {step < 3 ? (
              <button onClick={() => setStep(step + 1)} disabled={!w_dest} className="bg-rose-500 text-white px-6 py-2 md:px-8 md:py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-rose-600 disabled:opacity-50 disabled:cursor-not-allowed">下一步 <ArrowRight size={18} /></button>
            ) : (
              <button onClick={handleCreateTrip} className="bg-rose-500 text-white px-6 py-2 md:px-8 md:py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-rose-600">確認生成 <Sparkles size={18} /></button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (view === 'dashboard' && currentTrip) {
    return (
      <div className="min-h-screen bg-gray-50 flex font-sans text-slate-800">
        
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex w-64 bg-white border-r border-gray-200 flex-col fixed h-full z-10">
           <div className="p-6 border-b border-gray-100 flex items-center gap-2">
             <div className="w-8 h-8 bg-rose-500 rounded-lg flex items-center justify-center text-white"><Plane size={18}/></div>
             <span className="font-bold text-lg">TravelMate</span>
           </div>
           
           <div className="p-4">
             <div className="mb-6">
               <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-2">當前行程</h3>
               <div className="bg-rose-50 text-rose-600 p-3 rounded-xl font-bold flex items-center gap-2">
                 <MapPin size={18}/> {currentTrip.destination.name}
               </div>
             </div>

             <nav className="space-y-1">
               <button onClick={() => setView('dashboard')} className="w-full flex items-center gap-3 px-3 py-2 text-gray-700 bg-gray-100 rounded-lg font-medium"><Map size={18}/> 行程總覽</button>
               <button onClick={() => setView('print')} className="w-full flex items-center gap-3 px-3 py-2 text-gray-500 hover:bg-gray-50 rounded-lg font-medium transition-colors"><Printer size={18}/> 列印/預覽</button>
             </nav>
           </div>

           <div className="mt-auto p-4 border-t border-gray-100">
             <button onClick={() => setView('home')} className="flex items-center gap-2 text-gray-500 hover:text-gray-800 px-2"><Home size={18}/> 回首頁</button>
           </div>
        </aside>

        {/* Mobile Bottom Nav */}
        <div className="md:hidden fixed bottom-0 w-full bg-white border-t border-gray-200 z-50 flex justify-around p-3 pb-safe">
            <button onClick={() => setView('dashboard')} className="flex flex-col items-center text-rose-500"><Map size={24}/><span className="text-[10px]">行程</span></button>
            <button onClick={() => setView('print')} className="flex flex-col items-center text-gray-400"><Printer size={24}/><span className="text-[10px]">列印</span></button>
            <button onClick={() => setView('home')} className="flex flex-col items-center text-gray-400"><Home size={24}/><span className="text-[10px]">首頁</span></button>
        </div>

        {/* Content */}
        <main className="flex-1 md:ml-64 p-4 md:p-8 overflow-y-auto pb-24 md:pb-8">
          <header className="flex flex-col md:flex-row justify-between items-start mb-6 md:mb-8 gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-1">{currentTrip.destination.name} 之旅</h1>
              <p className="text-gray-500 flex items-center gap-2 text-sm md:text-base">
                <Calendar size={16}/> {currentTrip.dateRange.start.toLocaleDateString()} - {currentTrip.dateRange.end.toLocaleDateString()}
                <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                <Users size={16}/> {currentTrip.travelers.length}人
              </p>
            </div>
            <div className="flex gap-3 w-full md:w-auto">
              <button onClick={() => setView('print')} className="flex-1 md:flex-none justify-center bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-gray-50"><Printer size={18}/> 匯出 PDF</button>
            </div>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Col: Itinerary */}
            <div className="lg:col-span-2 space-y-6">
              {currentTrip.itinerary.map((day) => (
                <div key={day.day} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="bg-gray-50 p-4 border-b border-gray-100 flex flex-wrap gap-2 justify-between items-center">
                    <div className="flex items-center">
                      <span className="font-bold text-rose-500 text-lg mr-3">Day {day.day}</span>
                      <span className="font-medium text-gray-700 text-sm md:text-base">{day.title}</span>
                    </div>
                    <div className="flex items-center gap-2 w-full md:w-auto mt-2 md:mt-0">
                      {/* Emergency Info Pill */}
                      <div className="flex items-center gap-2 text-[10px] md:text-xs bg-white border border-gray-200 rounded-full px-3 py-1 w-full md:w-auto justify-center md:justify-start">
                        <span className="flex items-center gap-1 text-blue-600 font-bold"><Phone size={10}/> 警:{day.emergency.police}</span>
                        <span className="w-px h-3 bg-gray-200"></span>
                        <span className="flex items-center gap-1 text-red-500 font-bold"><Ambulance size={10}/> 醫:{day.emergency.ambulance}</span>
                      </div>
                      <div className="hidden md:block">
                        {day.weather === 'sunny' ? <Sun className="text-orange-400" size={20}/> : <CloudRain className="text-blue-400" size={20}/>}
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 space-y-4">
                    {day.activities.map((act) => (
                      <div key={act.id} className="flex gap-4 group">
                        <div className="flex flex-col items-center pt-1 w-12 shrink-0">
                           <span className="text-xs font-bold text-gray-500">{act.time}</span>
                           <div className="w-px h-full bg-gray-200 my-1 group-last:hidden"></div>
                        </div>
                        <div className="flex-1 bg-white border border-gray-100 rounded-xl p-3 hover:border-rose-200 hover:shadow-md transition-all flex items-start gap-3">
                           <div className={`p-2 rounded-lg ${act.type === 'flight' ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'}`}>
                             {act.type === 'flight' ? <Plane size={18}/> : act.type === 'hotel' ? <Hotel size={18}/> : act.type === 'food' ? <Utensils size={18}/> : <Camera size={18}/>}
                           </div>
                           <div className="min-w-0">
                             <h4 className="font-bold text-gray-800 truncate">{act.title}</h4>
                             <p className="text-sm text-gray-500 flex items-center gap-1 truncate"><MapPin size={12}/> {act.loc}</p>
                           </div>
                           <span className="ml-auto text-xs bg-gray-100 px-2 py-1 rounded text-gray-500 whitespace-nowrap">{act.tag}</span>
                        </div>
                      </div>
                    ))}
                    <button 
                      onClick={() => { setTargetDay(day.day); setShowActivityModal(true); }}
                      className="w-full py-2 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 hover:text-rose-500 hover:border-rose-200 font-medium flex items-center justify-center gap-2 transition-all"
                    >
                      <Plus size={16}/> 新增活動
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Right Col: Budget & Packing */}
            <div className="space-y-6">
               <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                 <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><PieChartIcon size={18} className="text-rose-500"/> 預算概況</h3>
                 <DonutChart data={currentTrip.budget.breakdown} total={currentTrip.budget.total} />
               </div>

               <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                 <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><Briefcase size={18} className="text-blue-500"/> 行李清單</h3>
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
                                 <span className="text-[10px] text-gray-400">{getTravelerName(item.owner)}</span>
                               </div>
                             </div>
                             <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                               <button onClick={() => setEditingItem({ category: cat, id: item.id, text: item.item, owner: item.owner })} className="text-gray-400 hover:text-blue-500"><Edit3 size={14}/></button>
                               <button onClick={() => handleDeleteItem(cat, item.id)} className="text-gray-400 hover:text-red-500"><Trash2 size={14}/></button>
                             </div>
                           </div>
                         ))}
                       </div>
                       
                       {/* Add Item Input */}
                       <div className="mt-2 flex gap-2 items-center bg-gray-50 p-2 rounded-lg">
                          <input 
                            type="text" 
                            placeholder="新增物品..." 
                            className="text-xs bg-transparent w-full outline-none"
                            value={newItemText}
                            onChange={(e) => setNewItemText(e.target.value)}
                            onKeyDown={(e) => { if(e.key === 'Enter') handleAddItem(cat); }}
                          />
                          <select 
                            className="text-[10px] border-none bg-white rounded px-1 py-0.5 outline-none max-w-[60px]"
                            value={newItemOwner}
                            onChange={(e) => setNewItemOwner(e.target.value)}
                          >
                            <option value="all">共用</option>
                            {currentTrip.travelers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                          </select>
                          <button onClick={() => handleAddItem(cat)} className="text-blue-500 shrink-0"><Plus size={16}/></button>
                       </div>
                     </div>
                   ))}
                 </div>
               </div>
            </div>
          </div>
        </main>

        {/* Activity Modal */}
        {showActivityModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white p-6 rounded-2xl w-full max-w-md animate-in zoom-in-95 shadow-2xl">
               <div className="flex justify-between items-center mb-4">
                 <h3 className="font-bold text-lg">新增活動 - Day {targetDay}</h3>
                 <button onClick={() => setShowActivityModal(false)}><X size={20} className="text-gray-400"/></button>
               </div>
               <div className="space-y-3">
                 <input className="w-full p-3 border rounded-xl outline-none focus:border-rose-500" placeholder="活動標題 (如: 晚餐)" value={newActivity.title} onChange={e => setNewActivity({...newActivity, title: e.target.value})} />
                 <div className="flex gap-2">
                   <input className="w-1/3 p-3 border rounded-xl outline-none focus:border-rose-500" type="time" value={newActivity.time} onChange={e => setNewActivity({...newActivity, time: e.target.value})} />
                   <input className="flex-1 p-3 border rounded-xl outline-none focus:border-rose-500" placeholder="地點" value={newActivity.loc} onChange={e => setNewActivity({...newActivity, loc: e.target.value})} />
                 </div>
                 <div className="flex gap-2">
                    <select className="p-3 border rounded-xl flex-1 outline-none focus:border-rose-500" value={newActivity.type} onChange={e => setNewActivity({...newActivity, type: e.target.value})}>
                      <option value="food">美食</option>
                      <option value="sightseeing">觀光</option>
                      <option value="photo">攝影</option>
                      <option value="other">其他</option>
                    </select>
                    <input className="flex-1 p-3 border rounded-xl outline-none focus:border-rose-500" placeholder="標籤 (如: 必吃)" value={newActivity.tag} onChange={e => setNewActivity({...newActivity, tag: e.target.value})} />
                 </div>
               </div>
               <div className="mt-6 flex justify-end gap-2">
                 <button onClick={() => setShowActivityModal(false)} className="px-6 py-2 rounded-xl text-gray-500 font-medium hover:bg-gray-100">取消</button>
                 <button onClick={handleAddActivity} className="px-6 py-2 bg-rose-500 text-white rounded-xl font-bold hover:bg-rose-600 shadow-lg shadow-rose-200">確認新增</button>
               </div>
            </div>
          </div>
        )}

        {/* Edit Item Modal */}
        {editingItem && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white p-6 rounded-2xl w-full max-w-sm animate-in zoom-in-95">
              <h3 className="font-bold text-lg mb-4">編輯物品</h3>
              <input 
                className="w-full p-2 border rounded-lg mb-4" 
                value={editingItem.text} 
                onChange={e => setEditingItem({...editingItem, text: e.target.value})}
              />
              <div className="mb-4">
                <label className="text-xs text-gray-500 block mb-1">歸屬人員</label>
                <select 
                  className="w-full p-2 border rounded-lg"
                  value={editingItem.owner}
                  onChange={e => setEditingItem({...editingItem, owner: e.target.value})}
                >
                  <option value="all">共用</option>
                  {currentTrip.travelers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div className="flex justify-end gap-2">
                 <button onClick={() => setEditingItem(null)} className="px-4 py-2 text-gray-500">取消</button>
                 <button onClick={handleUpdateItem} className="px-4 py-2 bg-blue-500 text-white rounded-lg">儲存</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ... (Print view remains similar, adjusting for mobile hidden)
  if (view === 'print' && currentTrip) {
     return (
       <div className="min-h-screen bg-gray-100 p-0 md:p-8 flex justify-center pb-24 md:pb-8">
         <div className="w-full max-w-[210mm] bg-white shadow-xl min-h-screen md:min-h-[297mm] p-6 md:p-12 relative print:shadow-none print:w-full print:p-0">
            {/* Same Print Content as before... */}
             {/* Print Controls (Hidden when printing) */}
          <div className="absolute top-4 right-4 flex gap-2 print:hidden z-10">
            <button onClick={() => window.print()} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-blue-700 shadow-md text-sm">
              <Printer size={16}/> <span className="hidden md:inline">列印 / PDF</span>
            </button>
            <button onClick={() => setView('dashboard')} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-bold hover:bg-gray-300 text-sm">
              關閉
            </button>
          </div>

          {/* Document Header */}
          <div className="border-b-2 border-black pb-4 mb-8 pt-10 md:pt-0">
            <div className="flex flex-col md:flex-row justify-between md:items-end">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold uppercase tracking-wider mb-2">Travel Itinerary</h1>
                <p className="text-lg">旅行計劃書：{currentTrip.destination.name}</p>
              </div>
              <div className="text-left md:text-right mt-4 md:mt-0">
                <p className="font-bold">{currentTrip.dateRange.start.toLocaleDateString()} - {currentTrip.dateRange.end.toLocaleDateString()}</p>
                <p className="text-gray-600">{currentTrip.duration} Days / {currentTrip.travelers.length} Pax</p>
              </div>
            </div>
          </div>

          {/* ... (Rest of print content) ... */}
           {/* Travelers Section */}
          <div className="mb-8">
            <h2 className="text-sm font-bold uppercase border-b border-gray-300 mb-3 pb-1">旅客資料 (Traveler Information)</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left min-w-[500px]">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="p-2">姓名</th>
                    <th className="p-2">證件號碼</th>
                    <th className="p-2">電話</th>
                    <th className="p-2">房號</th>
                  </tr>
                </thead>
                <tbody>
                  {currentTrip.travelers.map((t, i) => (
                    <tr key={i} className="border-b border-gray-100">
                      <td className="p-2 font-medium">{t.name}</td>
                      <td className="p-2">{t.docId || '-'}</td>
                      <td className="p-2">{t.phone || '-'}</td>
                      <td className="p-2">{t.room || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

           {/* Emergency Section */}
           <div className="mb-8 p-4 border border-gray-300 rounded-lg bg-gray-50 flex flex-col md:flex-row justify-between md:items-center gap-4">
            <div>
               <h3 className="font-bold text-sm mb-1">當地緊急聯絡資訊</h3>
               <div className="flex gap-6 text-sm">
                 <span>👮 警察: <strong>{currentTrip.destination.emergency.police}</strong></span>
                 <span>🚑 救護: <strong>{currentTrip.destination.emergency.ambulance}</strong></span>
               </div>
            </div>
            <div className="text-left md:text-right text-sm">
               <span className="block text-gray-500 mb-1">推薦叫車 APP</span>
               <span className="font-mono bg-white px-2 py-1 border rounded">{currentTrip.destination.emergency.apps.join(' / ')}</span>
            </div>
          </div>

           {/* Itinerary Section */}
           <div className="mb-8">
            <h2 className="text-sm font-bold uppercase border-b border-gray-300 mb-4 pb-1">每日行程</h2>
            <div className="space-y-6">
              {currentTrip.itinerary.map(day => (
                <div key={day.day} className="flex gap-4">
                  <div className="w-16 shrink-0 pt-1">
                    <span className="block font-bold text-lg">Day {day.day}</span>
                    <span className="text-xs text-gray-500">{day.date}</span>
                  </div>
                  <div className="flex-1 border-l-2 border-gray-200 pl-4 pb-4">
                    <h3 className="font-bold mb-2">{day.title}</h3>
                    <div className="space-y-2">
                       {day.activities.map((act, idx) => (
                         <div key={idx} className="flex text-sm">
                           <span className="w-16 font-mono text-gray-600 shrink-0">{act.time}</span>
                           <span className="font-medium mr-2">{act.title}</span>
                           <span className="text-gray-500">@ {act.loc}</span>
                         </div>
                       ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Packing Section with Owner */}
          <div>
            <h2 className="text-sm font-bold uppercase border-b border-gray-300 mb-3 pb-1">行李核對清單</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              {Object.entries(currentTrip.packingList).map(([cat, items]) => (
                <div key={cat}>
                  <h4 className="font-bold text-gray-600 mb-2">{cat}</h4>
                  <ul className="list-disc pl-4 space-y-1 text-gray-700">
                    {items.map((item, i) => (
                      <li key={i}>
                        {item.item} 
                        {item.owner !== 'all' && <span className="ml-1 text-[10px] bg-gray-100 px-1 rounded text-gray-500">({getTravelerName(item.owner)})</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

           {/* Mobile Bottom Padding for print view inside app */}
           <div className="h-16 md:hidden"></div>
         </div>
       </div>
     );
  }

  return null;
}
