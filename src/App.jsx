import React, { useState, useMemo } from 'react';
import { 
  Map, Calendar, CreditCard, CheckSquare, 
  Plane, Hotel, Coffee, Camera, Utensils, 
  Plus, Trash2, User, Settings,
  MapPin, DollarSign, PieChart as PieChartIcon,
  Briefcase, Sparkles, Sun, CloudRain,
  ArrowRight, Users, Star, Home, Printer, Phone,
  Ambulance, Car, Save, Edit3, X, FileText
} from 'lucide-react';

// --- 資料結構定義 ---

type Traveler = {
  id: string;
  name: string;
  docId: string; // 證件號碼
  phone: string;
  room?: string;
};

type Activity = {
  id: string;
  type: 'flight' | 'transport' | 'hotel' | 'sightseeing' | 'food' | 'photo' | 'other';
  time: string;
  title: string;
  loc: string;
  tag: string;
};

type DayPlan = {
  day: number;
  date: string;
  weather: 'sunny' | 'cloudy' | 'rain';
  title: string;
  emergency: {
    police: string;
    ambulance: string;
    apps: string[];
  };
  activities: Activity[];
};

type PackingItem = {
  id: string;
  item: string;
  checked: boolean;
  quantity: string;
};

type TripData = {
  id: string;
  status: 'draft' | 'planned';
  destination: Destination;
  origin: string;
  dateRange: { start: number; end: number; month: number; year: number };
  duration: number; // days
  travelers: Traveler[];
  budget: {
    total: number;
    spent: number;
    breakdown: { name: string; value: number; color: string }[];
  };
  itinerary: DayPlan[];
  packingList: Record<string, PackingItem[]>;
  preferences: {
    flight: string;
    hotel: string;
    purpose: string;
  };
};

type Destination = {
  id: string;
  name: string;
  image: string;
  currency: string;
  emergency: { police: string; ambulance: string; apps: string[] };
};

// --- Mock Data ---

const MOCK_DESTINATIONS: Destination[] = [
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
    { id: 'p1', item: "護照", checked: false, quantity: "每人1本" },
    { id: 'p2', item: "現金/信用卡", checked: false, quantity: "適量" },
  ],
  "衣物": [
    { id: 'c1', item: "換洗衣物", checked: false, quantity: "依天數" },
    { id: 'c2', item: "好走的鞋", checked: false, quantity: "1雙" },
  ],
  "電子": [
    { id: 'e1', item: "行動電源", checked: false, quantity: "1個" },
    { id: 'e2', item: "轉接頭", checked: false, quantity: "1個" },
  ]
};

// --- Helper Functions ---

const generateMockItinerary = (days: number, dest: Destination): DayPlan[] => {
  return Array.from({ length: days }, (_, i) => ({
    day: i + 1,
    date: `Day ${i + 1}`,
    weather: i % 3 === 0 ? 'sunny' : 'cloudy',
    title: i === 0 ? "抵達與安頓" : i === days - 1 ? "購買伴手禮與返程" : "城市探索與文化體驗",
    emergency: dest.emergency,
    activities: [
      { id: `d${i}-1`, type: 'food', time: '09:00', title: '飯店早餐', loc: '飯店餐廳', tag: '早餐' },
      { id: `d${i}-2`, type: 'sightseeing', time: '10:30', title: `${dest.name} 著名景點 ${i+1}`, loc: '市中心', tag: '觀光' },
      { id: `d${i}-3`, type: 'food', time: '12:30', title: '當地特色午餐', loc: '必比登推薦', tag: '午餐' },
      ...(i === 0 ? [{ id: `d${i}-arrival`, type: 'flight', time: '15:00', title: '辦理入住', loc: '市區飯店', tag: 'Check-in' } as Activity] : []),
      { id: `d${i}-4`, type: 'photo', time: '16:00', title: '網美打卡點', loc: '舊城區', tag: '攝影' },
      { id: `d${i}-5`, type: 'food', time: '19:00', title: '精緻晚餐', loc: '景觀餐廳', tag: '晚餐' },
    ]
  }));
};

// --- Components ---

const DonutChart = ({ data, total }: { data: any[], total: number }) => {
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
    <div className="relative w-48 h-48 mx-auto">
      <div style={conicStyle} className="shadow-lg"></div>
      <div className="absolute inset-0 m-auto w-32 h-32 bg-white rounded-full flex flex-col items-center justify-center shadow-inner">
        <span className="text-gray-400 text-xs font-medium">總預算</span>
        <span className="text-lg font-bold text-gray-800">${total.toLocaleString()}</span>
      </div>
    </div>
  );
};

const CustomCalendar = ({ selectedRange, onSelectRange }: { selectedRange: number[], onSelectRange: (range: number[]) => void }) => {
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
  const startDay = 3; // Mock Oct 1st is Wed

  const handleDayClick = (day: number) => {
    if (selectedRange.length === 0 || selectedRange.length === 2) {
      onSelectRange([day]); // Start new range
    } else {
      const start = selectedRange[0];
      if (day < start) {
        onSelectRange([day, start]);
      } else {
        onSelectRange([start, day]);
      }
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm select-none">
      <div className="flex justify-between items-center mb-4">
        <h4 className="font-bold text-gray-800 flex items-center gap-2">
          <Calendar size={18} className="text-rose-500"/> 2025年 10月
        </h4>
        <button 
          onClick={() => {
            const today = 15; // Mock today
            onSelectRange([today, today]);
          }}
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
        {Array.from({ length: startDay }).map((_, i) => <div key={`empty-${i}`} />)}
        {days.map(day => {
          let isSelected = false;
          let isRange = false;
          
          if (selectedRange.length === 1) {
            isSelected = day === selectedRange[0];
          } else if (selectedRange.length === 2) {
            isSelected = day === selectedRange[0] || day === selectedRange[1];
            isRange = day > selectedRange[0] && day < selectedRange[1];
          }

          let subText = "";
          if (day === 6) subText = "中秋"; 

          return (
            <button 
              key={day}
              onClick={() => handleDayClick(day)}
              className={`
                h-12 rounded-lg flex flex-col items-center justify-center relative border transition-all
                ${isSelected ? 'bg-rose-500 text-white border-rose-600 shadow-md z-10' : ''}
                ${isRange ? 'bg-rose-50 border-rose-100 text-rose-800' : ''}
                ${!isSelected && !isRange ? 'bg-white text-gray-700 border-gray-100 hover:border-rose-300' : ''}
              `}
            >
              <span className="text-sm font-bold">{day}</span>
              <span className={`text-[9px] ${isSelected ? 'text-rose-100' : 'text-gray-400'}`}>
                {subText || "平日"}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

// --- Main App ---

export default function TravelApp() {
  const [view, setView] = useState<'home' | 'wizard' | 'dashboard' | 'print'>('home');
  const [trips, setTrips] = useState<TripData[]>([]);
  const [currentTripId, setCurrentTripId] = useState<string | null>(null);

  // Wizard State
  const [step, setStep] = useState(1);
  const [w_origin, setW_Origin] = useState("台北 (TPE)");
  const [w_dest, setW_Dest] = useState<Destination | null>(null);
  const [w_range, setW_Range] = useState<number[]>([15, 20]);
  const [w_travelers, setW_Travelers] = useState<Traveler[]>([{ id: '1', name: '我', docId: '', phone: '' }]);
  const [w_pref, setW_Pref] = useState({ flight: 'direct', hotel: '4star', purpose: 'leisure' });

  // Dashboard Modal State
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [newActivity, setNewActivity] = useState<Partial<Activity>>({ type: 'other', time: '10:00', title: '', loc: '', tag: '' });
  const [targetDay, setTargetDay] = useState(1);
  
  // Dashboard Edit State
  const [newItemText, setNewItemText] = useState("");

  const currentTrip = useMemo(() => trips.find(t => t.id === currentTripId), [trips, currentTripId]);

  // --- Actions ---

  const handleCreateTrip = () => {
    // Generate Trip Data
    const duration = w_range.length === 2 ? w_range[1] - w_range[0] + 1 : 1;
    const newTrip: TripData = {
      id: Date.now().toString(),
      status: 'planned',
      destination: w_dest!,
      origin: w_origin,
      dateRange: { start: w_range[0], end: w_range.length === 2 ? w_range[1] : w_range[0], month: 10, year: 2025 },
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
      itinerary: generateMockItinerary(duration, w_dest!),
      packingList: JSON.parse(JSON.stringify(INITIAL_PACKING_TEMPLATE)),
      preferences: w_pref
    };

    setTrips([...trips, newTrip]);
    setCurrentTripId(newTrip.id);
    setView('dashboard');
    setStep(1); // Reset wizard
  };

  const updateTraveler = (index: number, field: keyof Traveler, value: string) => {
    const updated = [...w_travelers];
    updated[index] = { ...updated[index], [field]: value };
    setW_Travelers(updated);
  };

  const addTraveler = () => {
    setW_Travelers([...w_travelers, { id: Date.now().toString(), name: `旅伴 ${w_travelers.length + 1}`, docId: '', phone: '' }]);
  };

  const removeTraveler = (index: number) => {
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
              activities: [...day.activities, { ...newActivity, id: Date.now().toString() } as Activity].sort((a, b) => a.time.localeCompare(b.time))
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

  const handleAddItem = (category: string) => {
    if (!currentTrip || !newItemText) return;
    const updatedTrips = trips.map(t => {
      if (t.id === currentTrip.id) {
        const updatedList = { ...t.packingList };
        if (!updatedList[category]) updatedList[category] = [];
        updatedList[category].push({ id: Date.now().toString(), item: newItemText, checked: false, quantity: "1" });
        return { ...t, packingList: updatedList };
      }
      return t;
    });
    setTrips(updatedTrips);
    setNewItemText("");
  };

  const togglePackingCheck = (category: string, id: string) => {
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

  // --- Views ---

  if (view === 'home') {
    return (
      <div className="min-h-screen bg-gray-50 p-8 font-sans">
        <div className="max-w-5xl mx-auto">
          <header className="flex justify-between items-center mb-12">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-rose-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-rose-200">
                <Plane size={28} />
              </div>
              <h1 className="text-3xl font-bold text-gray-800">TravelMate <span className="text-rose-500">AI</span></h1>
            </div>
            <button 
              onClick={() => { setView('wizard'); setStep(1); }}
              className="bg-rose-500 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-rose-600 shadow-lg shadow-rose-200 transition-all"
            >
              <Plus size={20} /> 建立新行程
            </button>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trips.length === 0 ? (
              <div className="col-span-full text-center py-20 bg-white rounded-3xl border-2 border-dashed border-gray-200">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                  <FileText size={40} />
                </div>
                <h3 className="text-xl font-bold text-gray-400">目前沒有行程</h3>
                <p className="text-gray-400 mt-2">點擊右上方按鈕開始規劃您的第一次旅程</p>
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
                      <Calendar size={14}/> 10/{trip.dateRange.start} - 10/{trip.dateRange.end}
                    </p>
                    <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                      <div className="flex -space-x-2">
                        {trip.travelers.slice(0,3).map((t, i) => (
                           <div key={i} className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-xs font-bold text-gray-600">{t.name[0]}</div>
                        ))}
                        {trip.travelers.length > 3 && <div className="w-8 h-8 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-xs text-gray-500">+{trip.travelers.length-3}</div>}
                      </div>
                      <span className="text-rose-500 font-medium text-sm hover:underline">查看詳情 &rarr;</span>
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
      <div className="min-h-screen bg-gray-50 flex justify-center py-12 px-4 font-sans">
        <div className="w-full max-w-3xl bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden flex flex-col">
          {/* Header */}
          <div className="bg-rose-50 p-6 border-b border-rose-100 flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Sparkles className="text-rose-500"/> AI 行程規劃嚮導
            </h2>
            <div className="flex gap-2">
              {[1, 2, 3].map(i => (
                <div key={i} className={`w-3 h-3 rounded-full ${step >= i ? 'bg-rose-500' : 'bg-gray-300'}`}></div>
              ))}
            </div>
          </div>

          <div className="flex-1 p-8 overflow-y-auto">
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
                  <div className="grid grid-cols-2 gap-4">
                    {MOCK_DESTINATIONS.map(dest => (
                      <div 
                        key={dest.id}
                        onClick={() => setW_Dest(dest)}
                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-3 ${w_dest?.id === dest.id ? 'border-rose-500 bg-rose-50' : 'border-gray-100 hover:border-rose-200'}`}
                      >
                         <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${dest.image}`}></div>
                         <span className="font-bold text-gray-700">{dest.name}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                   <label className="block font-bold text-gray-700 mb-2">日期選擇 (10月)</label>
                   <CustomCalendar selectedRange={w_range} onSelectRange={setW_Range} />
                   <p className="text-right text-sm text-gray-500 mt-2">
                     已選擇: {w_range.length === 2 ? `${w_range[1] - w_range[0] + 1} 天` : '請選擇結束日期'}
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
                    <div key={t.id} className="p-4 border border-gray-200 rounded-xl relative group">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs text-gray-500 block mb-1">姓名</label>
                          <input type="text" value={t.name} onChange={(e) => updateTraveler(idx, 'name', e.target.value)} className="w-full p-2 bg-gray-50 rounded border border-gray-200 outline-none focus:border-rose-400" placeholder="姓名" />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 block mb-1">證件號碼 (護照/ID)</label>
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
                 <p className="text-gray-500 mb-8">AI 將根據 {w_travelers.length} 人的需求，規劃 {w_dest?.name} 的 {w_range[1] - w_range[0] + 1} 天旅程。</p>
                 
                 <div className="bg-gray-50 p-6 rounded-2xl text-left max-w-sm mx-auto mb-8 border border-gray-200">
                   <p className="flex justify-between mb-2"><span className="text-gray-500">日期</span> <span className="font-bold">10/{w_range[0]} - 10/{w_range[1]}</span></p>
                   <p className="flex justify-between mb-2"><span className="text-gray-500">人數</span> <span className="font-bold">{w_travelers.length} 人</span></p>
                   <p className="flex justify-between"><span className="text-gray-500">預算預估</span> <span className="font-bold text-rose-500">${(85000 * w_travelers.length).toLocaleString()}</span></p>
                 </div>
              </div>
            )}
          </div>

          <div className="p-6 border-t border-gray-100 flex justify-between bg-white">
            {step > 1 ? (
              <button onClick={() => setStep(step - 1)} className="px-6 py-2 text-gray-500 font-medium hover:bg-gray-100 rounded-lg">上一步</button>
            ) : (
              <button onClick={() => setView('home')} className="px-6 py-2 text-gray-500 font-medium hover:bg-gray-100 rounded-lg">取消</button>
            )}
            
            {step < 3 ? (
              <button onClick={() => setStep(step + 1)} disabled={!w_dest} className="bg-rose-500 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-rose-600 disabled:opacity-50 disabled:cursor-not-allowed">下一步 <ArrowRight size={18} /></button>
            ) : (
              <button onClick={handleCreateTrip} className="bg-rose-500 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-rose-600">確認生成 <Sparkles size={18} /></button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (view === 'dashboard' && currentTrip) {
    return (
      <div className="min-h-screen bg-gray-50 flex font-sans text-slate-800">
        
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-gray-200 flex flex-col fixed h-full z-10">
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

        {/* Content */}
        <main className="flex-1 ml-64 p-8 overflow-y-auto">
          <header className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-1">{currentTrip.destination.name} 之旅</h1>
              <p className="text-gray-500 flex items-center gap-2">
                <Calendar size={16}/> 2025/10/{currentTrip.dateRange.start} - 10/{currentTrip.dateRange.end} ({currentTrip.duration}天)
                <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                <Users size={16}/> {currentTrip.travelers.length}人
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setView('print')} className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-gray-50"><Printer size={18}/> 匯出 PDF</button>
            </div>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Col: Itinerary */}
            <div className="lg:col-span-2 space-y-6">
              {currentTrip.itinerary.map((day) => (
                <div key={day.day} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="bg-gray-50 p-4 border-b border-gray-100 flex justify-between items-center">
                    <div>
                      <span className="font-bold text-rose-500 text-lg mr-3">Day {day.day}</span>
                      <span className="font-medium text-gray-700">{day.title}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      {/* Emergency Info Pill */}
                      <div className="hidden md:flex items-center gap-3 text-xs bg-white border border-gray-200 rounded-full px-3 py-1">
                        <span className="flex items-center gap-1 text-blue-600 font-bold"><Phone size={12}/> 警: {day.emergency.police}</span>
                        <span className="w-px h-3 bg-gray-200"></span>
                        <span className="flex items-center gap-1 text-red-500 font-bold"><Ambulance size={12}/> 醫: {day.emergency.ambulance}</span>
                        <span className="w-px h-3 bg-gray-200"></span>
                        <span className="flex items-center gap-1 text-gray-600"><Car size={12}/> {day.emergency.apps.join('/')}</span>
                      </div>
                      {day.weather === 'sunny' ? <Sun className="text-orange-400" size={20}/> : <CloudRain className="text-blue-400" size={20}/>}
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
                           <div>
                             <h4 className="font-bold text-gray-800">{act.title}</h4>
                             <p className="text-sm text-gray-500 flex items-center gap-1"><MapPin size={12}/> {act.loc}</p>
                           </div>
                           <span className="ml-auto text-xs bg-gray-100 px-2 py-1 rounded text-gray-500">{act.tag}</span>
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
                           <div key={item.id} onClick={() => togglePackingCheck(cat, item.id)} className="flex items-center gap-2 cursor-pointer group">
                             <div className={`w-4 h-4 rounded border flex items-center justify-center ${item.checked ? 'bg-blue-500 border-blue-500' : 'border-gray-300'}`}>
                               {item.checked && <CheckSquare size={10} className="text-white"/>}
                             </div>
                             <span className={`text-sm ${item.checked ? 'text-gray-400 line-through' : 'text-gray-700'}`}>{item.item}</span>
                           </div>
                         ))}
                       </div>
                       <div className="mt-2 flex gap-2">
                          <input 
                            type="text" 
                            placeholder="新增物品..." 
                            className="text-xs border-b border-gray-200 w-full outline-none focus:border-blue-500 py-1"
                            value={newItemText}
                            onChange={(e) => setNewItemText(e.target.value)}
                            onKeyDown={(e) => { if(e.key === 'Enter') handleAddItem(cat); }}
                          />
                          <button onClick={() => handleAddItem(cat)} className="text-blue-500"><Plus size={14}/></button>
                       </div>
                     </div>
                   ))}
                 </div>
               </div>
            </div>
          </div>
        </main>

        {/* Add Activity Modal */}
        {showActivityModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-2xl w-full max-w-md animate-in zoom-in-95">
               <div className="flex justify-between items-center mb-4">
                 <h3 className="font-bold text-lg">新增活動 - Day {targetDay}</h3>
                 <button onClick={() => setShowActivityModal(false)}><X size={20} className="text-gray-400"/></button>
               </div>
               <div className="space-y-3">
                 <input className="w-full p-2 border rounded-lg" placeholder="活動標題 (如: 晚餐)" value={newActivity.title} onChange={e => setNewActivity({...newActivity, title: e.target.value})} />
                 <div className="flex gap-2">
                   <input className="w-1/3 p-2 border rounded-lg" type="time" value={newActivity.time} onChange={e => setNewActivity({...newActivity, time: e.target.value})} />
                   <input className="flex-1 p-2 border rounded-lg" placeholder="地點" value={newActivity.loc} onChange={e => setNewActivity({...newActivity, loc: e.target.value})} />
                 </div>
                 <div className="flex gap-2">
                    <select className="p-2 border rounded-lg flex-1" value={newActivity.type} onChange={e => setNewActivity({...newActivity, type: e.target.value as any})}>
                      <option value="food">美食</option>
                      <option value="sightseeing">觀光</option>
                      <option value="photo">攝影</option>
                      <option value="other">其他</option>
                    </select>
                    <input className="flex-1 p-2 border rounded-lg" placeholder="標籤 (如: 必吃)" value={newActivity.tag} onChange={e => setNewActivity({...newActivity, tag: e.target.value})} />
                 </div>
               </div>
               <div className="mt-6 flex justify-end gap-2">
                 <button onClick={() => setShowActivityModal(false)} className="px-4 py-2 text-gray-500">取消</button>
                 <button onClick={handleAddActivity} className="px-4 py-2 bg-rose-500 text-white rounded-lg font-bold">確認新增</button>
               </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (view === 'print' && currentTrip) {
    return (
      <div className="min-h-screen bg-gray-100 p-8 flex justify-center">
        <div className="w-full max-w-[210mm] bg-white shadow-xl min-h-[297mm] p-12 relative print:shadow-none print:w-full print:p-0">
          
          {/* Print Controls (Hidden when printing) */}
          <div className="absolute top-4 right-4 flex gap-2 print:hidden">
            <button onClick={() => window.print()} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-blue-700 shadow-md">
              <Printer size={16}/> 列印 / 存為 PDF
            </button>
            <button onClick={() => setView('dashboard')} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-bold hover:bg-gray-300">
              關閉
            </button>
          </div>

          {/* Document Header */}
          <div className="border-b-2 border-black pb-4 mb-8">
            <div className="flex justify-between items-end">
              <div>
                <h1 className="text-3xl font-bold uppercase tracking-wider mb-2">Travel Itinerary</h1>
                <p className="text-lg">旅行計劃書：{currentTrip.destination.name}</p>
              </div>
              <div className="text-right">
                <p className="font-bold">{currentTrip.dateRange.start} Oct - {currentTrip.dateRange.end} Oct, 2025</p>
                <p className="text-gray-600">{currentTrip.duration} Days / {currentTrip.travelers.length} Pax</p>
              </div>
            </div>
          </div>

          {/* Travelers Section */}
          <div className="mb-8">
            <h2 className="text-sm font-bold uppercase border-b border-gray-300 mb-3 pb-1">旅客資料 (Traveler Information)</h2>
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="bg-gray-50">
                  <th className="p-2">姓名 (Name)</th>
                  <th className="p-2">證件號碼 (ID/Passport)</th>
                  <th className="p-2">聯絡電話 (Phone)</th>
                  <th className="p-2">房號 (Room)</th>
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

          {/* Emergency Section */}
          <div className="mb-8 p-4 border border-gray-300 rounded-lg bg-gray-50 flex justify-between items-center">
            <div>
               <h3 className="font-bold text-sm mb-1">當地緊急聯絡資訊 (Emergency Contact)</h3>
               <div className="flex gap-6 text-sm">
                 <span>👮 警察 (Police): <strong>{currentTrip.destination.emergency.police}</strong></span>
                 <span>🚑 救護 (Ambulance): <strong>{currentTrip.destination.emergency.ambulance}</strong></span>
               </div>
            </div>
            <div className="text-right text-sm">
               <span className="block text-gray-500 mb-1">推薦叫車 APP</span>
               <span className="font-mono bg-white px-2 py-1 border rounded">{currentTrip.destination.emergency.apps.join(' / ')}</span>
            </div>
          </div>

          {/* Itinerary Section */}
          <div className="mb-8">
            <h2 className="text-sm font-bold uppercase border-b border-gray-300 mb-4 pb-1">每日行程 (Daily Itinerary)</h2>
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

          {/* Packing Section */}
          <div>
            <h2 className="text-sm font-bold uppercase border-b border-gray-300 mb-3 pb-1">行李核對清單 (Packing List)</h2>
            <div className="grid grid-cols-3 gap-4 text-sm">
              {Object.entries(currentTrip.packingList).map(([cat, items]) => (
                <div key={cat}>
                  <h4 className="font-bold text-gray-600 mb-2">{cat}</h4>
                  <ul className="list-disc pl-4 space-y-1 text-gray-700">
                    {items.map((item, i) => (
                      <li key={i}>{item.item} <span className="text-xs text-gray-400">x{item.quantity}</span></li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    );
  }

  return null;
}
