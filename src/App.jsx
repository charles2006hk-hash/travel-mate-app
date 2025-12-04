import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plane, Calendar, Users, Briefcase, MapPin, 
  Sun, Camera, Gift, CheckSquare, Square, 
  Plus, Trash2, Save, CloudRain, Thermometer,
  Baby, User, Heart
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged,
  signInWithCustomToken
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  onSnapshot,
  deleteDoc
} from 'firebase/firestore';

// --- Firebase Config & Initialization ---
const firebaseConfig = JSON.parse(typeof __firebase_config !== 'undefined' ? __firebase_config : '{}');
// Fallback for local development if needed, but in this environment __firebase_config is provided
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'travel-mate-demo';

// --- Helper Functions ---

// Generate dates array between start and end
const getDatesInRange = (startDate, endDate) => {
  const date = new Date(startDate);
  const end = new Date(endDate);
  const dates = [];
  while (date <= end) {
    dates.push(new Date(date));
    date.setDate(date.getDate() + 1);
  }
  return dates;
};

// Mock Data Generators for "API" features
const getMockWeather = (destination) => {
  // Simple mock logic based on random
  const isCold = Math.random() > 0.5;
  return {
    temp: isCold ? '8°C - 15°C' : '22°C - 28°C',
    condition: isCold ? '多雲轉晴' : '晴朗',
    icon: isCold ? <CloudRain className="w-6 h-6 text-blue-400" /> : <Sun className="w-6 h-6 text-yellow-400" />,
    advice: isCold ? '天氣較涼，建議帶備薄羽絨及頸巾。' : '天氣炎熱，請準備防曬用品及太陽眼鏡。'
  };
};

const getMockCurrency = (destination) => {
  if (destination.includes('日本') || destination.includes('Japan')) return { code: 'JPY', rate: '0.052', symbol: '¥' };
  if (destination.includes('歐洲') || destination.includes('Europe')) return { code: 'EUR', rate: '8.5', symbol: '€' };
  if (destination.includes('英國') || destination.includes('UK')) return { code: 'GBP', rate: '9.8', symbol: '£' };
  if (destination.includes('台灣') || destination.includes('Taiwan')) return { code: 'TWD', rate: '0.25', symbol: 'NT$' };
  return { code: 'USD', rate: '7.8', symbol: '$' }; // Default
};

const getSuggestedItems = (travelers, destination) => {
  let items = [
    { id: 'base-1', text: '護照 / 身份證', category: '證件' },
    { id: 'base-2', text: '機票 / 酒店確認單 (電子版)', category: '證件' },
    { id: 'base-3', text: '外幣現金 / 信用卡', category: '財物' },
    { id: 'base-4', text: '手機 SIM 卡 / Wi-Fi 蛋', category: '電子' },
    { id: 'base-5', text: '萬用轉插 / 充電器', category: '電子' },
    { id: 'base-6', text: '個人盥洗用品 (牙刷/毛巾)', category: '生活' },
  ];

  if (travelers.kids > 0) {
    items.push(
      { id: 'kid-1', text: '尿片 / 奶粉 / 奶瓶', category: '小孩' },
      { id: 'kid-2', text: '安撫玩具 / 繪本', category: '小孩' },
      { id: 'kid-3', text: '兒童常備藥 (退燒/止咳)', category: '小孩' }
    );
  }

  if (travelers.elders > 0) {
    items.push(
      { id: 'elder-1', text: '長期服用藥物 (血壓/糖尿)', category: '長者' },
      { id: 'elder-2', text: '保暖衣物 / 舒適步行鞋', category: '長者' },
      { id: 'elder-3', text: '老花眼鏡 / 假牙清潔劑', category: '長者' }
    );
  }

  // Simple keyword matching for weather gear
  if (destination.includes('雪') || destination.includes('北海道')) {
    items.push({ id: 'wea-1', text: '雪靴 / 防滑鞋墊', category: '衣物' });
    items.push({ id: 'wea-2', text: '厚手套 / 冷帽', category: '衣物' });
  } else if (destination.includes('泰') || destination.includes('島')) {
    items.push({ id: 'wea-3', text: '泳衣 / 泳鏡', category: '衣物' });
    items.push({ id: 'wea-4', text: '防蚊液', category: '生活' });
  }

  return items;
};

// --- Main Component ---
export default function TravelApp() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard'); // dashboard, packing, itinerary, info
  const [loading, setLoading] = useState(true);

  // Data State
  const [tripData, setTripData] = useState({
    destination: '',
    startDate: '',
    endDate: '',
    travelers: { adults: 2, elders: 0, kids: 0 },
    notes: ''
  });
  
  const [packingList, setPackingList] = useState([]);
  const [itinerary, setItinerary] = useState({}); // { "2023-10-01": "Day 1 activities..." }
  
  // Auth Effect
  useEffect(() => {
    const initAuth = async () => {
      if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
        await signInWithCustomToken(auth, __initial_auth_token);
      } else {
        await signInAnonymously(auth);
      }
    };
    initAuth();
    
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Firestore Sync Effect
  useEffect(() => {
    if (!user) return;

    // Listen to trip basic data
    const tripRef = doc(db, 'artifacts', appId, 'users', user.uid, 'currentTrip', 'details');
    const unsubTrip = onSnapshot(tripRef, (docSnap) => {
      if (docSnap.exists()) {
        setTripData(docSnap.data());
      }
    }, (err) => console.error("Err fetching trip:", err));

    // Listen to packing list
    const packingRef = collection(db, 'artifacts', appId, 'users', user.uid, 'currentTrip', 'packingList', 'items');
    const unsubPacking = onSnapshot(packingRef, (snapshot) => {
      const items = [];
      snapshot.forEach(doc => items.push({ ...doc.data(), id: doc.id }));
      // Sort by category then text
      items.sort((a, b) => a.category.localeCompare(b.category));
      setPackingList(items);
    }, (err) => console.error("Err fetching packing:", err));

    // Listen to itinerary
    const itinRef = doc(db, 'artifacts', appId, 'users', user.uid, 'currentTrip', 'itinerary');
    const unsubItin = onSnapshot(itinRef, (docSnap) => {
      if (docSnap.exists()) {
        setItinerary(docSnap.data().days || {});
      }
    }, (err) => console.error("Err fetching itinerary:", err));

    return () => {
      unsubTrip();
      unsubPacking();
      unsubItin();
    };
  }, [user]);

  // Actions
  const saveTripSettings = async () => {
    if (!user) return;
    try {
      await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'currentTrip', 'details'), tripData);
      
      // If packing list is empty, generate initial suggestions
      if (packingList.length === 0) {
        const suggestions = getSuggestedItems(tripData.travelers, tripData.destination);
        for (const item of suggestions) {
          const itemRef = doc(db, 'artifacts', appId, 'users', user.uid, 'currentTrip', 'packingList', 'items', item.id);
          await setDoc(itemRef, { ...item, checked: false });
        }
      }
      alert('旅程已儲存！');
    } catch (e) {
      console.error(e);
      alert('儲存失敗');
    }
  };

  const togglePackingItem = async (item) => {
    if (!user) return;
    const itemRef = doc(db, 'artifacts', appId, 'users', user.uid, 'currentTrip', 'packingList', 'items', item.id);
    await setDoc(itemRef, { ...item, checked: !item.checked });
  };

  const addNewItem = async () => {
    const text = prompt("請輸入物品名稱:");
    if (!text || !user) return;
    const newItem = {
      text,
      category: '自訂',
      checked: false
    };
    const newRef = doc(collection(db, 'artifacts', appId, 'users', user.uid, 'currentTrip', 'packingList', 'items'));
    await setDoc(newRef, newItem);
  };

  const deleteItem = async (id) => {
    if(!confirm("確定刪除此物品？")) return;
    await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'currentTrip', 'packingList', 'items', id));
  }

  const saveItineraryDay = async (dateStr, content) => {
    if (!user) return;
    const newItinerary = { ...itinerary, [dateStr]: content };
    setItinerary(newItinerary); // Optimistic update
    await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'currentTrip', 'itinerary'), {
      days: newItinerary
    });
  };

  const resetTrip = async () => {
      if(!confirm("確定重置所有資料？這將刪除當前行程和清單。")) return;
      // In a real app we'd do a batch delete, for simplicity here we just clear the main doc and let the user overwrite
      // Ideally you'd delete the subcollections too.
      await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'currentTrip', 'details'), {
        destination: '', startDate: '', endDate: '', travelers: { adults: 2, elders: 0, kids: 0 }, notes: ''
      });
      setPackingList([]);
      setItinerary({});
      window.location.reload();
  }

  // Computed Views
  const dates = useMemo(() => {
    if (tripData.startDate && tripData.endDate) {
      return getDatesInRange(tripData.startDate, tripData.endDate);
    }
    return [];
  }, [tripData.startDate, tripData.endDate]);

  const weatherInfo = useMemo(() => getMockWeather(tripData.destination), [tripData.destination]);
  const currencyInfo = useMemo(() => getMockCurrency(tripData.destination), [tripData.destination]);

  // Loading Screen
  if (loading) return <div className="flex items-center justify-center h-screen bg-gray-50 text-gray-500">載入您的旅程中...</div>;

  return (
    <div className="min-h-screen bg-gray-100 font-sans text-gray-800 pb-20 md:pb-0">
      
      {/* Header */}
      <header className="bg-blue-600 text-white p-4 shadow-md sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Plane className="w-6 h-6" />
            <h1 className="text-xl font-bold tracking-wide">TravelMate 旅伴</h1>
          </div>
          {tripData.destination && <span className="text-sm bg-blue-700 px-3 py-1 rounded-full">{tripData.destination}</span>}
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4">
        
        {/* --- DASHBOARD & SETTINGS --- */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-blue-600">
                <Briefcase className="w-5 h-5" /> 旅程設定
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">目的地</label>
                  <input 
                    type="text" 
                    value={tripData.destination}
                    onChange={(e) => setTripData({...tripData, destination: e.target.value})}
                    placeholder="例如：日本東京、台北..." 
                    className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">出發日期</label>
                    <input 
                      type="date" 
                      value={tripData.startDate}
                      onChange={(e) => setTripData({...tripData, startDate: e.target.value})}
                      className="w-full p-3 border border-gray-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">回程日期</label>
                    <input 
                      type="date" 
                      value={tripData.endDate}
                      onChange={(e) => setTripData({...tripData, endDate: e.target.value})}
                      className="w-full p-3 border border-gray-200 rounded-lg"
                    />
                  </div>
                </div>

                <div className="md:col-span-2 bg-blue-50 p-4 rounded-xl">
                  <label className="block text-sm font-bold text-blue-800 mb-3">同行夥伴</label>
                  <div className="flex justify-around items-center">
                    <div className="text-center">
                      <div className="text-gray-500 text-xs mb-1">成人</div>
                      <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-lg shadow-sm">
                        <User className="w-4 h-4 text-blue-500"/>
                        <input 
                          type="number" min="1" max="10"
                          value={tripData.travelers.adults}
                          onChange={(e) => setTripData({...tripData, travelers: {...tripData.travelers, adults: parseInt(e.target.value)}})}
                          className="w-12 text-center outline-none font-bold"
                        />
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-gray-500 text-xs mb-1">長者</div>
                      <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-lg shadow-sm">
                        <Heart className="w-4 h-4 text-red-500"/>
                        <input 
                          type="number" min="0" max="10"
                          value={tripData.travelers.elders}
                          onChange={(e) => setTripData({...tripData, travelers: {...tripData.travelers, elders: parseInt(e.target.value)}})}
                          className="w-12 text-center outline-none font-bold"
                        />
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-gray-500 text-xs mb-1">小孩</div>
                      <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-lg shadow-sm">
                        <Baby className="w-4 h-4 text-green-500"/>
                        <input 
                          type="number" min="0" max="10"
                          value={tripData.travelers.kids}
                          onChange={(e) => setTripData({...tripData, travelers: {...tripData.travelers, kids: parseInt(e.target.value)}})}
                          className="w-12 text-center outline-none font-bold"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button 
                  onClick={saveTripSettings}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition flex justify-center items-center gap-2"
                >
                  <Save className="w-5 h-5" /> 儲存並生成清單
                </button>
                <button 
                  onClick={resetTrip}
                  className="bg-gray-200 text-gray-600 px-4 py-3 rounded-xl font-bold hover:bg-gray-300"
                >
                  重置
                </button>
              </div>
            </div>

            {/* Weather & Info Preview for Dashboard */}
            {tripData.destination && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-blue-400 to-blue-600 text-white p-5 rounded-2xl shadow-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold opacity-90">當地天氣預測</h3>
                      <p className="text-2xl font-bold mt-1">{weatherInfo.temp}</p>
                      <p className="text-sm opacity-80 mt-1">{weatherInfo.condition}</p>
                    </div>
                    <div className="bg-white/20 p-2 rounded-lg">
                      {weatherInfo.icon}
                    </div>
                  </div>
                  <div className="mt-4 text-xs bg-white/10 p-2 rounded">
                    💡 {weatherInfo.advice}
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                  <h3 className="font-bold text-gray-700 mb-2">匯率參考</h3>
                  <div className="flex items-end gap-2">
                    <span className="text-3xl font-bold text-green-600">1 {currencyInfo.code}</span>
                    <span className="text-gray-400 mb-1">=</span>
                    <span className="text-xl text-gray-600">{currencyInfo.rate} HKD</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">僅供參考，請以銀行實時匯率為準</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* --- PACKING LIST --- */}
        {activeTab === 'packing' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
               <h2 className="text-xl font-bold text-gray-800">行李清單</h2>
               <button onClick={addNewItem} className="text-blue-600 text-sm font-semibold flex items-center gap-1">
                 <Plus className="w-4 h-4" /> 新增物品
               </button>
            </div>

            {packingList.length === 0 ? (
              <div className="text-center py-10 bg-white rounded-xl text-gray-400">
                尚未生成清單，請先在「行程」頁面儲存設定。
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {['證件', '財物', '電子', '衣物', '生活', '小孩', '長者', '自訂'].map(cat => {
                  const items = packingList.filter(i => i.category === cat);
                  if (items.length === 0) return null;
                  return (
                    <div key={cat} className="border-b last:border-0 border-gray-100">
                      <div className="bg-gray-50 px-4 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
                        {cat}
                      </div>
                      {items.map(item => (
                        <div 
                          key={item.id} 
                          className="flex items-center justify-between p-4 hover:bg-gray-50 transition cursor-pointer"
                          onClick={() => togglePackingItem(item)}
                        >
                          <div className="flex items-center gap-3">
                            {item.checked ? 
                              <CheckSquare className="w-5 h-5 text-green-500" /> : 
                              <Square className="w-5 h-5 text-gray-300" />
                            }
                            <span className={`${item.checked ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                              {item.text}
                            </span>
                          </div>
                          <button 
                            onClick={(e) => { e.stopPropagation(); deleteItem(item.id); }}
                            className="text-gray-300 hover:text-red-500"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* --- ITINERARY --- */}
        {activeTab === 'itinerary' && (
          <div className="space-y-4">
             <h2 className="text-xl font-bold text-gray-800">行程規劃</h2>
             {dates.length === 0 ? (
               <div className="text-center py-10 bg-white rounded-xl text-gray-400">
                 請先設定出發及回程日期。
               </div>
             ) : (
               <div className="space-y-4">
                 {dates.map((date, index) => {
                   const dateStr = date.toISOString().split('T')[0];
                   return (
                     <div key={dateStr} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                       <div className="flex items-center gap-2 mb-3 border-b border-gray-100 pb-2">
                         <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded">Day {index + 1}</span>
                         <span className="font-semibold text-gray-700">
                           {date.toLocaleDateString('zh-HK', { month: 'long', day: 'numeric', weekday: 'short' })}
                         </span>
                       </div>
                       <textarea
                         className="w-full text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border-transparent focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none transition resize-none"
                         rows="3"
                         placeholder="在此輸入當天行程、餐廳訂位或交通安排..."
                         value={itinerary[dateStr] || ''}
                         onChange={(e) => saveItineraryDay(dateStr, e.target.value)}
                       />
                     </div>
                   );
                 })}
               </div>
             )}
          </div>
        )}

        {/* --- INFO / EXTRAS --- */}
        {activeTab === 'info' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-800">旅遊錦囊</h2>
            
            <div className="bg-white p-5 rounded-2xl shadow-sm">
              <h3 className="font-bold flex items-center gap-2 mb-3 text-pink-500">
                <Gift className="w-5 h-5" /> 必買手信建議
              </h3>
              <ul className="list-disc list-inside text-sm text-gray-600 space-y-2">
                <li>當地特色零食 (如日本的限定口味KitKat)</li>
                <li>藥妝店熱銷排行產品</li>
                <li>當地傳統工藝品 / 明信片</li>
                <li>機場限定伴手禮</li>
              </ul>
            </div>

            <div className="bg-white p-5 rounded-2xl shadow-sm">
              <h3 className="font-bold flex items-center gap-2 mb-3 text-purple-500">
                <Camera className="w-5 h-5" /> 拍照打卡位 Tips
              </h3>
              <ul className="list-disc list-inside text-sm text-gray-600 space-y-2">
                <li>善用清晨 7-8 點避開人潮</li>
                <li>尋找高處俯瞰城市的觀景台</li>
                <li>利用當地特色交通工具作為背景 (如路面電車)</li>
                <li>注意部分景點禁止使用三腳架</li>
              </ul>
            </div>
          </div>
        )}

      </main>

      {/* --- Mobile Bottom Nav --- */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg md:hidden z-50">
        <div className="flex justify-around items-center h-16">
          <button 
            onClick={() => setActiveTab('dashboard')} 
            className={`flex flex-col items-center gap-1 ${activeTab === 'dashboard' ? 'text-blue-600' : 'text-gray-400'}`}
          >
            <Calendar className="w-6 h-6" />
            <span className="text-[10px]">設定</span>
          </button>
          <button 
            onClick={() => setActiveTab('itinerary')} 
            className={`flex flex-col items-center gap-1 ${activeTab === 'itinerary' ? 'text-blue-600' : 'text-gray-400'}`}
          >
            <MapPin className="w-6 h-6" />
            <span className="text-[10px]">行程</span>
          </button>
          <div className="relative -top-5">
            <button 
              onClick={() => setActiveTab('packing')}
              className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transform transition ${activeTab === 'packing' ? 'bg-blue-600 text-white scale-110' : 'bg-white text-blue-600 border border-gray-200'}`}
            >
              <Briefcase className="w-6 h-6" />
            </button>
          </div>
          <button 
            onClick={() => setActiveTab('info')} 
            className={`flex flex-col items-center gap-1 ${activeTab === 'info' ? 'text-blue-600' : 'text-gray-400'}`}
          >
            <Sun className="w-6 h-6" />
            <span className="text-[10px]">資訊</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-gray-300 cursor-not-allowed">
            <Users className="w-6 h-6" />
            <span className="text-[10px]">分享</span>
          </button>
        </div>
      </nav>

      {/* --- Desktop Side Nav (Visible on MD+) --- */}
      <div className="hidden md:flex fixed left-0 top-20 bottom-0 w-64 p-4 flex-col gap-2">
         {/* Navigation buttons for desktop can be added here if expanded */}
         <div className="bg-white p-4 rounded-xl shadow-sm text-center">
            <p className="text-gray-400 text-sm">請使用手機瀏覽以獲得最佳體驗</p>
            <div className="mt-4 flex flex-col gap-2">
              <button onClick={() => setActiveTab('dashboard')} className={`p-3 rounded-lg text-left ${activeTab === 'dashboard' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50'}`}>行程設定</button>
              <button onClick={() => setActiveTab('packing')} className={`p-3 rounded-lg text-left ${activeTab === 'packing' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50'}`}>行李清單</button>
              <button onClick={() => setActiveTab('itinerary')} className={`p-3 rounded-lg text-left ${activeTab === 'itinerary' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50'}`}>行程表</button>
              <button onClick={() => setActiveTab('info')} className={`p-3 rounded-lg text-left ${activeTab === 'info' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50'}`}>旅遊資訊</button>
            </div>
         </div>
      </div>

    </div>
  );
}