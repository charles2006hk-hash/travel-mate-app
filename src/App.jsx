import React, { useState, useEffect, useMemo } from 'react';
import { 
  Map, Calendar, CreditCard, CheckSquare, 
  Plane, Hotel, Coffee, Camera, Utensils, 
  Plus, Trash2, ChevronRight, User, Settings,
  MapPin, DollarSign, PieChart as PieChartIcon,
  Briefcase, Sparkles, Moon, Sun, CloudRain,
  ArrowRight, Users, Star, ArrowLeft, Home
} from 'lucide-react';

// --- 模擬 AI 生成的數據 ---

const MOCK_DESTINATIONS = [
  { id: 'kyoto', name: '日本 京都 (Kyoto)', image: 'from-rose-400 to-orange-300', currency: 'JPY' },
  { id: 'paris', name: '法國 巴黎 (Paris)', image: 'from-blue-400 to-purple-300', currency: 'EUR' },
  { id: 'iceland', name: '冰島 (Iceland)', image: 'from-cyan-500 to-blue-600', currency: 'ISK' },
];

// 模擬生成的行程數據
const GENERATED_TRIP_DATA = {
  destination: "日本 京都",
  dates: "2025年 10月 15日 - 10月 20日 (6天)",
  weather: "晴朗 / 18°C",
  totalBudget: 85000, // TWD
  spent: 0,
  travelers: 2,
  theme: "文化深度遊",
  flightType: "直航 (Direct)",
  hotelLevel: "4星級溫泉旅館",
};

const GENERATED_ITINERARY = [
  {
    day: 1,
    date: "10月 15日 (三)",
    weather: "sunny",
    title: "抵達與初探古都",
    activities: [
      { id: 1, type: 'flight', time: "10:00", title: "搭乘星宇航空直飛 KIX", loc: "桃園機場 T2", icon: Plane, tag: "直航" },
      { id: 2, type: 'transport', time: "14:30", title: "搭乘 Haruka 特急列車", loc: "關西機場 -> 京都", icon: Map, tag: "交通券" },
      { id: 3, type: 'hotel', time: "16:00", title: "入住 嵐山溫泉旅館", loc: "嵐山渡月橋畔", icon: Hotel, tag: "4星級" },
      { id: 4, type: 'photo', time: "17:30", title: "渡月橋夕陽攝影", loc: "嵐山", icon: Camera, tag: "必拍打卡點" },
    ]
  },
  {
    day: 2,
    date: "10月 16日 (四)",
    weather: "cloudy",
    title: "千本鳥居與歷史巡禮",
    activities: [
      { id: 5, type: 'sightseeing', time: "08:00", title: "伏見稻荷大社", loc: "伏見", icon: Camera, tag: "避開人潮" },
      { id: 6, type: 'food', time: "12:00", title: "鰻魚飯老店午餐", loc: "祇園", icon: Utensils, tag: "米其林推薦" },
      { id: 7, type: 'sightseeing', time: "14:00", title: "清水寺參拜", loc: "清水坂", icon: MapPin, tag: "世界遺產" },
    ]
  }
];

const GENERATED_BUDGET = [
  { name: "機票交通 (行)", value: 25000, color: "#60A5FA" }, // Blue
  { name: "住宿飯店 (住)", value: 30000, color: "#F472B6" }, // Pink
  { name: "餐飲美食 (食)", value: 15000, color: "#34D399" }, // Green
  { name: "購物服飾 (衣)", value: 10000, color: "#FBBF24" }, // Yellow
  { name: "門票雜支 (育樂)", value: 5000, color: "#A78BFA" }, // Purple
];

const GENERATED_PACKING = {
  "隨身證件/貴重物品": [
    { id: 'p1', item: "護照 (有效期6個月以上)", checked: true, quantity: "2本" },
    { id: 'p2', item: "日幣現金 / 信用卡", checked: false, quantity: "準備 ¥100,000" },
    { id: 'p3', item: "網卡 / WiFi機", checked: false, quantity: "1台" },
  ],
  "衣物 (根據 18°C 天氣)": [
    { id: 'c1', item: "薄外套/風衣", checked: false, quantity: "2件" },
    { id: 'c2', item: "好走的布鞋", checked: false, quantity: "1雙" },
    { id: 'c3', item: "換洗衣物", checked: false, quantity: "4套" },
  ],
  "電子/攝影": [
    { id: 't1', item: "行動電源 (需隨身帶)", checked: true, quantity: "2顆" },
    { id: 't2', item: "相機 & 記憶卡", checked: false, quantity: "1組" },
    { id: 't3', item: "萬用轉接頭", checked: false, quantity: "1個" },
  ]
};

// --- Helper for Custom Donut Chart ---
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
    position: 'relative',
  };

  return (
    <div className="relative w-64 h-64 mx-auto">
      <div style={conicStyle as any} className="shadow-xl"></div>
      {/* Inner White Circle to make it a donut */}
      <div className="absolute inset-0 m-auto w-40 h-40 bg-white rounded-full flex flex-col items-center justify-center shadow-inner">
        <span className="text-gray-400 text-sm font-medium">總預算</span>
        <span className="text-xl font-bold text-gray-800">${total.toLocaleString()}</span>
      </div>
    </div>
  );
};

// --- Custom Calendar Component ---
const CustomCalendar = ({ onSelectDates }) => {
  // Mock Calendar for October 2025
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
  
  // Starting day of week for Oct 1st 2025 (Mock: Wednesday)
  const startDay = 3; 

  const [selectedRange, setSelectedRange] = useState([15, 20]);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h4 className="font-bold text-gray-800 flex items-center gap-2">
          <Calendar size={18} className="text-rose-500"/> 2025年 10月
        </h4>
        <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">農曆 乙巳年</div>
      </div>
      
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map(d => (
          <div key={d} className={`text-center text-xs font-bold ${d === '日' || d === '六' ? 'text-rose-400' : 'text-gray-400'}`}>{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: startDay }).map((_, i) => <div key={`empty-${i}`} />)}
        {days.map(day => {
          const isSelected = day >= selectedRange[0] && day <= selectedRange[1];
          const isStart = day === selectedRange[0];
          const isEnd = day === selectedRange[1];
          const isToday = day === 6; // Mock Today
          
          let subText = "";
          if (day === 1) subText = "初九";
          if (day === 15) subText = "廿三";
          if (day === 6) subText = "中秋"; // Mock holiday example

          return (
            <button 
              key={day}
              onClick={() => setSelectedRange([day, Math.min(day + 5, 31)])}
              className={`
                h-14 rounded-lg flex flex-col items-center justify-center relative border transition-all
                ${isSelected ? 'bg-rose-500 text-white border-rose-600 shadow-md transform scale-105 z-10' : 'bg-gray-50 text-gray-700 border-gray-100 hover:border-rose-300'}
                ${isToday && !isSelected ? 'ring-2 ring-rose-400 ring-offset-2' : ''}
              `}
            >
              {isToday && <span className="absolute -top-1 -right-1 flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span></span>}
              <span className="text-sm font-bold">{day}</span>
              <span className={`text-[10px] ${isSelected ? 'text-rose-100' : 'text-gray-400'}`}>
                {subText || "平日"}
              </span>
            </button>
          );
        })}
      </div>
      <p className="text-xs text-center text-gray-400 mt-3">已選擇: 10月{selectedRange[0]}日 - 10月{selectedRange[1]}日 (共 {selectedRange[1] - selectedRange[0] + 1} 天)</p>
    </div>
  );
};

// --- Main App Component ---

export default function TravelAIPlanner() {
  const [appState, setAppState] = useState('onboarding'); // 'onboarding', 'loading', 'dashboard'
  const [step, setStep] = useState(1);
  
  // Form Data
  const [destination, setDestination] = useState(null);
  const [travelers, setTravelers] = useState(2);
  const [flightPref, setFlightPref] = useState('direct'); // direct, transfer
  const [hotelPref, setHotelPref] = useState('4star');
  const [purpose, setPurpose] = useState('leisure');

  // Dashboard State
  const [activeTab, setActiveTab] = useState('itinerary');
  const [packingList, setPackingList] = useState(GENERATED_PACKING);

  const startPlanning = () => {
    setAppState('loading');
    // Simulate AI processing
    setTimeout(() => {
      setAppState('dashboard');
    }, 2500);
  };

  const togglePackingItem = (category, id) => {
    setPackingList(prev => ({
      ...prev,
      [category]: prev[category].map(item => 
        item.id === id ? { ...item, checked: !item.checked } : item
      )
    }));
  };

  // --- Render Views ---

  if (appState === 'loading') {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=2021&auto=format&fit=crop')] bg-cover opacity-20 blur-sm"></div>
        <div className="z-10 flex flex-col items-center space-y-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-full border-4 border-rose-500/30 animate-spin border-t-rose-500"></div>
            <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-rose-400 animate-pulse" size={40} />
          </div>
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold">AI 正在規劃您的專屬旅程...</h2>
            <p className="text-gray-400">正在分析當地天氣、搜尋最佳航線、匹配合適飯店</p>
          </div>
          <div className="w-64 space-y-1">
             <div className="flex justify-between text-xs text-rose-300">
               <span>整合預算...</span>
               <span>生成行李清單...</span>
             </div>
             <div className="h-1 bg-gray-700 rounded-full overflow-hidden">
               <div className="h-full bg-rose-500 animate-[width_2s_ease-in-out_infinite]" style={{width: '60%'}}></div>
             </div>
          </div>
        </div>
      </div>
    );
  }

  if (appState === 'onboarding') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row font-sans text-slate-800">
        {/* Left Side: Visual */}
        <div className="hidden lg:flex lg:w-1/3 bg-gradient-to-br from-rose-500 to-orange-400 p-12 flex-col justify-between text-white relative overflow-hidden">
           <div className="absolute top-0 left-0 w-full h-full opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
           <div className="z-10">
             <div className="flex items-center gap-3 mb-6">
               <Plane className="w-10 h-10" />
               <h1 className="text-3xl font-bold">TravelMate AI</h1>
             </div>
             <p className="text-xl font-light opacity-90">只需幾步，為您打造完美旅程。</p>
           </div>
           <div className="z-10 space-y-6">
             <div className="flex items-center gap-4">
               <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center"><Calendar /></div>
               <div>
                 <p className="font-bold">智能檔期安排</p>
                 <p className="text-sm opacity-75">自動避開人潮，整合農曆假期</p>
               </div>
             </div>
             <div className="flex items-center gap-4">
               <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center"><PieChartIcon /></div>
               <div>
                 <p className="font-bold">精準預算控制</p>
                 <p className="text-sm opacity-75">衣食住行細項全掌握</p>
               </div>
             </div>
             <div className="flex items-center gap-4">
               <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center"><CheckSquare /></div>
               <div>
                 <p className="font-bold">動態行李清單</p>
                 <p className="text-sm opacity-75">依天氣與人數自動生成</p>
               </div>
             </div>
           </div>
        </div>

        {/* Right Side: Wizard */}
        <div className="flex-1 p-6 lg:p-12 overflow-y-auto">
          <div className="max-w-2xl mx-auto">
            {/* Steps Indicator */}
            <div className="flex items-center mb-8">
               {[1, 2, 3].map(i => (
                 <React.Fragment key={i}>
                   <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${step >= i ? 'bg-rose-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                     {i}
                   </div>
                   {i < 3 && <div className={`w-12 h-1 ${step > i ? 'bg-rose-500' : 'bg-gray-200'} mx-2`}></div>}
                 </React.Fragment>
               ))}
            </div>

            {step === 1 && (
              <div className="space-y-6 animate-in slide-in-from-right-8 duration-500">
                <h2 className="text-2xl font-bold text-gray-800">第一步：您想去哪裡？</h2>
                
                <div className="space-y-4">
                  <label className="block font-medium text-gray-700">出發地</label>
                  <div className="flex items-center bg-white border border-gray-300 rounded-xl p-3 shadow-sm">
                    <MapPin className="text-gray-400 mr-2" />
                    <input type="text" defaultValue="台北 (TPE)" className="flex-1 outline-none text-gray-800 font-medium" />
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="block font-medium text-gray-700">目的地</label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {MOCK_DESTINATIONS.map(dest => (
                      <button 
                        key={dest.id}
                        onClick={() => setDestination(dest)}
                        className={`relative p-4 rounded-xl border-2 text-left transition-all h-32 flex flex-col justify-end overflow-hidden group ${destination?.id === dest.id ? 'border-rose-500 ring-2 ring-rose-200' : 'border-gray-200 hover:border-rose-300'}`}
                      >
                        <div className={`absolute inset-0 bg-gradient-to-br ${dest.image} opacity-10 group-hover:opacity-20 transition-opacity`}></div>
                        <span className="font-bold relative z-10">{dest.name}</span>
                        {destination?.id === dest.id && <div className="absolute top-2 right-2 bg-rose-500 text-white rounded-full p-1"><CheckSquare size={12}/></div>}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                   <label className="block font-medium text-gray-700">選擇日期 (包含農曆與假期標註)</label>
                   <CustomCalendar />
                </div>

                <div className="flex justify-end pt-6">
                  <button 
                    onClick={() => setStep(2)} disabled={!destination}
                    className="bg-rose-500 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-rose-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-rose-200"
                  >
                    下一步 <ArrowRight size={18} />
                  </button>
                </div>
              </div>
            )}

            {step === 2 && (
               <div className="space-y-8 animate-in slide-in-from-right-8 duration-500">
                 <h2 className="text-2xl font-bold text-gray-800">第二步：您的旅行偏好</h2>
                 
                 {/* Flight & Hotel */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-3">
                     <label className="font-medium flex items-center gap-2"><Plane size={18}/> 航班偏好</label>
                     <div className="flex gap-2">
                       <button onClick={() => setFlightPref('direct')} className={`flex-1 py-3 px-4 rounded-lg border font-medium ${flightPref === 'direct' ? 'bg-blue-50 border-blue-500 text-blue-600' : 'bg-white border-gray-200'}`}>直飛</button>
                       <button onClick={() => setFlightPref('transfer')} className={`flex-1 py-3 px-4 rounded-lg border font-medium ${flightPref === 'transfer' ? 'bg-blue-50 border-blue-500 text-blue-600' : 'bg-white border-gray-200'}`}>轉機 (較便宜)</button>
                     </div>
                   </div>
                   <div className="space-y-3">
                     <label className="font-medium flex items-center gap-2"><Hotel size={18}/> 住宿等級</label>
                     <select className="w-full p-3 bg-white border border-gray-200 rounded-lg outline-none focus:border-rose-500" value={hotelPref} onChange={(e) => setHotelPref(e.target.value)}>
                       <option value="3star">經濟型 (3星級)</option>
                       <option value="4star">舒適型 (4星級)</option>
                       <option value="5star">奢華型 (5星級)</option>
                       <option value="airbnb">特色民宿</option>
                     </select>
                   </div>
                 </div>

                 {/* Travelers */}
                 <div className="space-y-4">
                   <label className="font-medium flex items-center gap-2"><Users size={18}/> 隨行人員</label>
                   <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <span>人數</span>
                        <div className="flex items-center gap-4">
                          <button onClick={() => setTravelers(Math.max(1, travelers - 1))} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200">-</button>
                          <span className="font-bold text-xl">{travelers} 人</span>
                          <button onClick={() => setTravelers(travelers + 1)} className="w-8 h-8 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center hover:bg-rose-200">+</button>
                        </div>
                      </div>
                      <div className="text-sm text-gray-500 flex gap-4">
                        <label className="flex items-center gap-2"><input type="checkbox" className="accent-rose-500" /> 包含兒童</label>
                        <label className="flex items-center gap-2"><input type="checkbox" className="accent-rose-500" /> 包含長輩</label>
                      </div>
                   </div>
                 </div>

                 {/* Purpose */}
                 <div className="space-y-4">
                   <label className="font-medium flex items-center gap-2"><Star size={18}/> 旅遊目的</label>
                   <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                     {['休閒度假', '冒險探索', '文化深度', '購物美食'].map(p => (
                       <button 
                        key={p}
                        onClick={() => setPurpose(p)}
                        className={`py-3 rounded-lg border text-sm font-medium transition-colors ${purpose === p ? 'bg-rose-500 text-white border-rose-500' : 'bg-white border-gray-200 hover:bg-gray-50'}`}
                       >
                         {p}
                       </button>
                     ))}
                   </div>
                 </div>

                 <div className="flex justify-between pt-6">
                    <button onClick={() => setStep(1)} className="text-gray-500 hover:text-gray-800 font-medium px-4">上一步</button>
                    <button 
                      onClick={() => setStep(3)}
                      className="bg-rose-500 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-rose-600 shadow-lg shadow-rose-200"
                    >
                      確認偏好 <ArrowRight size={18} />
                    </button>
                 </div>
               </div>
            )}

            {step === 3 && (
              <div className="space-y-8 animate-in slide-in-from-right-8 duration-500 text-center py-8">
                 <h2 className="text-2xl font-bold text-gray-800">確認您的行程資訊</h2>
                 <div className="bg-white p-6 rounded-2xl border border-rose-100 shadow-sm text-left space-y-4">
                    <div className="flex justify-between border-b border-gray-100 pb-3">
                      <span className="text-gray-500">目的地</span>
                      <span className="font-bold text-gray-800">{destination?.name}</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-100 pb-3">
                      <span className="text-gray-500">人數 / 類型</span>
                      <span className="font-bold text-gray-800">{travelers}人 / {purpose}</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-100 pb-3">
                      <span className="text-gray-500">住宿 / 航班</span>
                      <span className="font-bold text-gray-800">{hotelPref === '4star' ? '4星級' : hotelPref} / {flightPref === 'direct' ? '直飛' : '轉機'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">日期</span>
                      <span className="font-bold text-rose-500">10月15日 - 10月20日 (含中秋後行程)</span>
                    </div>
                 </div>
                 <button 
                    onClick={startPlanning}
                    className="w-full bg-gradient-to-r from-rose-500 to-orange-500 text-white py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 hover:opacity-90 transition-opacity shadow-xl shadow-rose-200"
                 >
                    <Sparkles className="animate-pulse" /> AI 智能生成行程
                 </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // --- DASHBOARD VIEW ---
  return (
    <div className="min-h-screen bg-gray-50 flex font-sans text-slate-800">
      
      {/* Sidebar Navigation */}
      <aside className="w-16 md:w-20 lg:w-64 bg-white border-r border-gray-200 flex flex-col justify-between fixed h-full z-10 transition-all duration-300">
        <div>
          <div className="h-20 flex items-center justify-center lg:justify-start lg:px-8 border-b border-gray-100 bg-rose-50">
            <div className="w-10 h-10 bg-rose-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-rose-200">
              <Plane size={24} />
            </div>
            <span className="hidden lg:block ml-3 font-bold text-xl text-gray-800">TripAI</span>
          </div>

          <nav className="p-2 lg:p-4 space-y-2">
            {[
              { id: 'itinerary', label: '每日行程', icon: Map },
              { id: 'budget', label: '預算分析', icon: DollarSign },
              { id: 'packing', label: '智能行李', icon: Briefcase },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-center lg:justify-start p-3 rounded-xl transition-all duration-200 ${
                  activeTab === item.id 
                    ? 'bg-rose-500 text-white font-semibold shadow-md shadow-rose-200' 
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                }`}
              >
                <item.icon size={22} />
                <span className="hidden lg:block ml-3">{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-4 border-t border-gray-100">
          <button onClick={() => setAppState('onboarding')} className="w-full flex items-center justify-center lg:justify-start p-3 rounded-xl text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors">
            <Home size={22} />
            <span className="hidden lg:block ml-3 font-medium">回首頁</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-16 md:ml-20 lg:ml-64 p-4 lg:p-8">
        
        {/* Header Summary */}
        <header className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
           <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                {GENERATED_TRIP_DATA.destination} 
                <span className="text-sm font-normal text-gray-500 bg-gray-100 px-2 py-1 rounded-full">{GENERATED_TRIP_DATA.dates}</span>
              </h1>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                 <span className="flex items-center gap-1"><Sun size={14} className="text-orange-400"/> {GENERATED_TRIP_DATA.weather}</span>
                 <span className="flex items-center gap-1"><Users size={14} className="text-blue-400"/> {GENERATED_TRIP_DATA.travelers}人 ({GENERATED_TRIP_DATA.theme})</span>
                 <span className="flex items-center gap-1"><Hotel size={14} className="text-purple-400"/> {GENERATED_TRIP_DATA.hotelLevel}</span>
              </div>
           </div>
           <div className="text-right">
             <p className="text-gray-500 text-sm">總預算 (TWD)</p>
             <p className="text-3xl font-bold text-rose-500">${GENERATED_TRIP_DATA.totalBudget.toLocaleString()}</p>
           </div>
        </header>

        {/* Content Area */}
        <div className="max-w-6xl mx-auto animate-in fade-in duration-500">
          
          {activeTab === 'itinerary' && (
            <div className="space-y-6">
               <div className="flex items-center justify-between">
                 <h2 className="text-xl font-bold text-gray-800 border-l-4 border-rose-500 pl-3">AI 規劃行程</h2>
                 <button className="text-rose-500 font-medium text-sm flex items-center gap-1 hover:bg-rose-50 px-3 py-1 rounded-lg transition-colors"><Plus size={16}/> 自訂活動</button>
               </div>
               
               {GENERATED_ITINERARY.map((day) => (
                 <div key={day.day} className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                   <div className="bg-gray-50 p-4 border-b border-gray-100 flex justify-between items-center">
                     <div>
                       <span className="font-bold text-rose-500 text-lg">Day {day.day}</span>
                       <span className="ml-3 font-medium text-gray-700">{day.date}</span>
                       <span className="ml-2 text-gray-400 text-sm">- {day.title}</span>
                     </div>
                     {day.weather === 'sunny' ? <Sun className="text-orange-400"/> : <CloudRain className="text-blue-400"/>}
                   </div>
                   <div className="p-4 space-y-4">
                     {day.activities.map((act) => (
                       <div key={act.id} className="flex gap-4 group">
                         <div className="flex flex-col items-center">
                           <div className="text-xs font-bold text-gray-400 mb-1">{act.time}</div>
                           <div className="w-2 h-full border-l-2 border-dashed border-gray-200"></div>
                         </div>
                         <div className="flex-1 bg-white border border-gray-100 rounded-xl p-3 hover:shadow-md hover:border-rose-200 transition-all flex items-start gap-3">
                            <div className={`p-2 rounded-lg shrink-0 ${act.type === 'flight' ? 'bg-blue-100 text-blue-600' : act.type === 'photo' ? 'bg-pink-100 text-pink-600' : 'bg-gray-100 text-gray-600'}`}>
                              <act.icon size={20} />
                            </div>
                            <div className="flex-1">
                              <div className="flex justify-between items-start">
                                <h4 className="font-bold text-gray-800">{act.title}</h4>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${act.tag.includes('打卡') ? 'bg-rose-100 text-rose-600' : 'bg-gray-100 text-gray-500'}`}>{act.tag}</span>
                              </div>
                              <p className="text-sm text-gray-500 flex items-center gap-1 mt-1"><MapPin size={12}/> {act.loc}</p>
                            </div>
                         </div>
                       </div>
                     ))}
                   </div>
                 </div>
               ))}
            </div>
          )}

          {activeTab === 'budget' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
               <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col">
                  <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2"><PieChartIcon size={20} className="text-rose-500"/> 預算分佈 (衣食住行)</h3>
                  <div className="flex-1 flex items-center justify-center py-6">
                     <DonutChart data={GENERATED_BUDGET} total={GENERATED_TRIP_DATA.totalBudget} />
                  </div>
               </div>

               <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                  <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2"><CreditCard size={20} className="text-emerald-500"/> 支出細項建議</h3>
                  <div className="space-y-4">
                    {GENERATED_BUDGET.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 rounded-full" style={{backgroundColor: item.color}}></div>
                          <span className="font-medium text-gray-700">{item.name}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-gray-800">${item.value.toLocaleString()}</div>
                          <div className="text-xs text-gray-400">約佔 {Math.round(item.value / GENERATED_TRIP_DATA.totalBudget * 100)}%</div>
                        </div>
                      </div>
                    ))}
                    <div className="mt-6 pt-4 border-t border-gray-100 p-4 bg-yellow-50 rounded-xl text-yellow-800 text-sm">
                       <p className="font-bold mb-1">💡 AI 省錢建議：</p>
                       <p>京都交通建議購買「關西周遊卡」可節省約 $2,000 TWD。部分景點建議提前網路購票。</p>
                    </div>
                  </div>
               </div>
            </div>
          )}

          {activeTab === 'packing' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white p-6 rounded-2xl shadow-lg flex justify-between items-center">
                 <div>
                   <h2 className="text-xl font-bold mb-1">智能行李清單</h2>
                   <p className="text-blue-100 text-sm opacity-90">根據 6天行程、2位成人、18°C 天氣自動生成</p>
                 </div>
                 <div className="bg-white/20 p-3 rounded-full">
                   <Briefcase size={32} />
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Object.entries(packingList).map(([category, items]) => (
                  <div key={category} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                    <h3 className="font-bold text-gray-800 mb-4 pb-2 border-b border-gray-100 flex items-center gap-2">
                       {category.includes('證件') && <User size={18} className="text-rose-500"/>}
                       {category.includes('衣物') && <Users size={18} className="text-blue-500"/>}
                       {category.includes('電子') && <Camera size={18} className="text-orange-500"/>}
                       {category}
                    </h3>
                    <div className="space-y-3">
                      {items.map((item) => (
                        <div 
                          key={item.id} 
                          onClick={() => togglePackingItem(category, item.id)}
                          className="flex items-start gap-3 cursor-pointer group select-none"
                        >
                          <div className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center transition-colors shrink-0 ${item.checked ? 'bg-rose-500 border-rose-500' : 'border-gray-300 group-hover:border-rose-400'}`}>
                            {item.checked && <CheckSquare size={14} className="text-white" />}
                          </div>
                          <div>
                            <p className={`text-sm font-medium transition-colors ${item.checked ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                              {item.item}
                            </p>
                            <p className="text-xs text-rose-500 font-medium mt-0.5">{item.quantity}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
