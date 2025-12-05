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
  // 日本
  "東京": { lat: 35.6762, lon: 139.6503, currency: "JPY", region: "JP", intro: "傳統與未來交織的城市，必去淺草寺、澀谷十字路口。", emergency: { police: "110", ambulance: "119" }, rideApp: "Uber / GO / DiDi" },
  "大阪": { lat: 34.6937, lon: 135.5023, currency: "JPY", region: "JP", intro: "美食之都，道頓堀固力果跑跑人是必打卡點。", emergency: { police: "110", ambulance: "119" }, rideApp: "Uber / GO / DiDi" },
  "京都": { lat: 35.0116, lon: 135.7681, currency: "JPY", region: "JP", intro: "千年古都，擁有無數神社與寺廟，清水寺最為著名。", emergency: { police: "110", ambulance: "119" }, rideApp: "MK Taxi / Uber" },
  "札幌": { lat: 43.0618, lon: 141.3545, currency: "JPY", region: "JP", intro: "北國雪景與美食，冬季必訪大通公園雪祭。", emergency: { police: "110", ambulance: "119" }, rideApp: "Uber / GO" },
  "福岡": { lat: 33.5902, lon: 130.4017, currency: "JPY", region: "JP", intro: "九州門戶，屋台文化與豚骨拉麵的發源地。", emergency: { police: "110", ambulance: "119" }, rideApp: "Uber / GO" },
  // 韓國
  "首爾": { lat: 37.5665, lon: 126.9780, currency: "KRW", region: "KR", intro: "韓流中心，弘大購物與景福宮穿韓服體驗。", emergency: { police: "112", ambulance: "119" }, rideApp: "Kakao T / Uber" },
  "釜山": { lat: 35.1796, lon: 129.0756, currency: "KRW", region: "KR", intro: "海港城市，海雲台沙灘與甘川洞文化村。", emergency: { police: "112", ambulance: "119" }, rideApp: "Kakao T" },
  // 台灣
  "台北": { lat: 25.0330, lon: 121.5654, currency: "TWD", region: "TW", intro: "美食與夜市的天堂，必登台北101觀景台。", emergency: { police: "110", ambulance: "119" }, rideApp: "Uber / 55688 / yoxi" },
  // 泰國
  "曼谷": { lat: 13.7563, lon: 100.5018, currency: "THB", region: "TH", intro: "充滿活力的不夜城，大皇宮與水上市場不可錯過。", emergency: { police: "191", ambulance: "1669" }, rideApp: "Grab / Bolt" },
  // 歐洲
  "倫敦": { lat: 51.5074, lon: -0.1278, currency: "GBP", region: "UK", intro: "歷史與現代的融合，大笨鐘與倫敦眼是必訪之地。", emergency: { police: "999", ambulance: "999" }, rideApp: "Uber / Bolt / Addison Lee" },
  "巴黎": { lat: 48.8566, lon: 2.3522, currency: "EUR", region: "EU", intro: "浪漫之都，艾菲爾鐵塔下野餐是最佳體驗。", emergency: { police: "17", ambulance: "15" }, rideApp: "Uber / Bolt / G7" },
  // 香港
  "香港": { lat: 22.3193, lon: 114.1694, currency: "HKD", region: "HK", intro: "東方之珠，維多利亞港夜景世界三大夜景之一。", emergency: { police: "999", ambulance: "999" }, rideApp: "Uber / HKTaxi" },
  // 澳洲
  "雪梨": { lat: -33.8688, lon: 151.2093, currency: "AUD", region: "AU", intro: "澳洲最大城市，雪梨歌劇院與港灣大橋是世界級地標。", emergency: { police: "000", ambulance: "000" }, rideApp: "Uber / DiDi / Ola" },
  "墨爾本": { lat: -37.8136, lon: 144.9631, currency: "AUD", region: "AU", intro: "澳洲文化與咖啡之都，充滿藝術巷弄與維多利亞式建築。", emergency: { police: "000", ambulance: "000" }, rideApp: "Uber / DiDi / 13CABS" },
  "布里斯本": { lat: -27.4705, lon: 153.0260, currency: "AUD", region: "AU", intro: "陽光之城，擁有美麗的南岸公園與考拉保護區。", emergency: { police: "000", ambulance: "000" }, rideApp: "Uber / DiDi" },
  "黃金海岸": { lat: -28.0167, lon: 153.4000, currency: "AUD", region: "AU", intro: "衝浪者的天堂，擁有綿延的沙灘與多個主題樂園。", emergency: { police: "000", ambulance: "000" }, rideApp: "Uber / DiDi" },
};

const POPULAR_CITIES = Object.keys(CITY_DATA);
const POPULAR_ORIGINS = ["香港", "台北", "高雄", "澳門", "東京", "倫敦", "紐約", "雪梨", "墨爾本"];
const EXCHANGE_RATES = { "HKD": 1, "JPY": 0.052, "KRW": 0.0058, "TWD": 0.25, "THB": 0.22, "SGD": 5.8, "GBP": 9.9, "EUR": 8.5, "USD": 7.8, "CNY": 1.1, "AUD": 5.1 };

// 衣食住行分類定義
const CATEGORY_LABELS = {
  shopping: { label: "衣 (購物)", icon: ShoppingBag, color: "text-pink-500", bg: "bg-pink-50" },
  food: { label: "食 (美食)", icon: Utensils, color: "text-orange-500", bg: "bg-orange-50" },
  stay: { label: "住 (住宿)", icon: Home, color: "text-indigo-500", bg: "bg-indigo-50" },
  transport: { label: "行 (景點/交通)", icon: Map, color: "text-blue-500", bg: "bg-blue-50" },
  other: { label: "其他", icon: FileText, color: "text-gray-500", bg: "bg-gray-50" }
};

// 完整擴充景點資料庫 (全城市覆蓋)
const POI_DB = {
  "東京": [
    { name: "東京迪士尼樂園", category: "transport", cost: 600, time: "全日", note: "夢幻王國", lat: 35.6329, lon: 139.8804, img: "https://images.unsplash.com/photo-1545582379-34e8ce6a3092?w=400&q=80", desc: "亞洲第一座迪士尼樂園。" },
    { name: "淺草寺", category: "transport", cost: 0, time: "2h", note: "雷門打卡", lat: 35.7147, lon: 139.7967, img: "https://images.unsplash.com/photo-1596395914619-338d9b52c007?w=400&q=80", desc: "東京最古老的寺廟。" },
    { name: "東京晴空塔", category: "transport", cost: 200, time: "2h", note: "俯瞰東京全景", lat: 35.7100, lon: 139.8107, img: "https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?w=400&q=80", desc: "世界最高的自立式電波塔。" },
    { name: "築地場外市場", category: "food", cost: 300, time: "2h", note: "新鮮壽司早午餐", lat: 35.6655, lon: 139.7707, img: "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=400&q=80", desc: "東京的廚房。" },
    { name: "銀座商圈", category: "shopping", cost: 0, time: "3h", note: "高級精品與百貨", lat: 35.6712, lon: 139.7665, img: "https://images.unsplash.com/photo-1554797589-7241bb691973?w=400&q=80", desc: "繁華購物區。" }
  ],
  "大阪": [
    { name: "環球影城 USJ", category: "transport", cost: 650, time: "全日", note: "任天堂世界", lat: 34.6654, lon: 135.4323, img: "https://images.unsplash.com/photo-1623941000802-38fadd7f7b3b?w=400&q=80", desc: "世界級主題樂園。" },
    { name: "道頓堀美食", category: "food", cost: 200, time: "3h", note: "章魚燒吃到飽", lat: 34.6687, lon: 135.5013, img: "https://images.unsplash.com/photo-1590559899731-a382839e5549?w=400&q=80", desc: "大阪美食心臟。" },
    { name: "大阪城天守閣", category: "transport", cost: 50, time: "2h", note: "歷史古蹟", lat: 34.6873, lon: 135.5262, img: "https://images.unsplash.com/photo-1555428456-62846879d75b?w=400&q=80", desc: "日本三名城之一。" },
    { name: "海遊館", category: "transport", cost: 180, time: "3h", note: "世界最大級水族館", lat: 34.6545, lon: 135.4289, img: "https://images.unsplash.com/photo-1596395914619-338d9b52c007?w=400&q=80", desc: "展示環太平洋火山帶生態。" },
    { name: "心齋橋筋", category: "shopping", cost: 0, time: "3h", note: "購物天堂", lat: 34.6713, lon: 135.5014, img: "https://images.unsplash.com/photo-1567972318528-6c6773777e36?w=400&q=80", desc: "大阪最著名的購物街。" }
  ],
  "京都": [
    { name: "清水寺", category: "transport", cost: 30, time: "3h", note: "世界遺產", lat: 34.9949, lon: 135.7850, img: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=400&q=80", desc: "京都最著名的古老寺院。" },
    { name: "伏見稻荷大社", category: "transport", cost: 0, time: "2h", note: "千本鳥居", lat: 34.9671, lon: 135.7727, img: "https://images.unsplash.com/photo-1478436127897-769e1b3f0f36?w=400&q=80", desc: "綿延不絕的紅色鳥居隧道。" },
    { name: "金閣寺", category: "transport", cost: 40, time: "1h", note: "金碧輝煌", lat: 35.0394, lon: 135.7292, img: "https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=400&q=80", desc: "舍利殿外牆全以金箔裝飾。" },
    { name: "錦市場", category: "food", cost: 100, time: "2h", note: "京都的廚房", lat: 35.0050, lon: 135.7649, img: "https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=400&q=80", desc: "充滿在地美食的商店街。" }
  ],
  "札幌": [
    { name: "大通公園", category: "transport", cost: 0, time: "1h", note: "雪祭會場", lat: 43.0600, lon: 141.3500, img: "https://images.unsplash.com/photo-1516900557549-41557d405adf?w=400&q=80", desc: "札幌市中心的地標公園。" },
    { name: "札幌時計台", category: "transport", cost: 20, time: "0.5h", note: "歷史建築", lat: 43.0626, lon: 141.3536, img: "https://images.unsplash.com/photo-1579502693952-6784d2627447?w=400&q=80", desc: "現存日本最古老的鐘樓。" },
    { name: "狸小路商店街", category: "shopping", cost: 0, time: "3h", note: "藥妝採買", lat: 43.0573, lon: 141.3515, img: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&q=80", desc: "北海道最大的商店街。" },
    { name: "白色戀人公園", category: "transport", cost: 60, time: "2h", note: "觀光工廠", lat: 43.0886, lon: 141.2710, img: "https://images.unsplash.com/photo-1515488764276-beab7607c1e6?w=400&q=80", desc: "充滿童話氣息的甜點主題公園。" }
  ],
  "福岡": [
    { name: "太宰府天滿宮", category: "transport", cost: 0, time: "3h", note: "學問之神", lat: 33.5215, lon: 130.5349, img: "https://images.unsplash.com/photo-1572970544522-6b9409605704?w=400&q=80", desc: "祈求學業進步的聖地。" },
    { name: "中洲屋台街", category: "food", cost: 200, time: "2h", note: "路邊攤體驗", lat: 33.5902, lon: 130.4017, img: "https://images.unsplash.com/photo-1563205764-6d9b4c042220?w=400&q=80", desc: "福岡特色的路邊攤美食文化。" },
    { name: "博多運河城", category: "shopping", cost: 0, time: "3h", note: "大型購物中心", lat: 33.5897, lon: 130.4108, img: "https://images.unsplash.com/photo-1573289063683-1cf5e5c6e86b?w=400&q=80", desc: "結合購物、娛樂的複合設施。" },
    { name: "福岡塔", category: "transport", cost: 80, time: "1h", note: "海濱地標", lat: 33.5933, lon: 130.3515, img: "https://images.unsplash.com/photo-1570459027562-4a916cc6113f?w=400&q=80", desc: "日本最高的海濱塔。" }
  ],
  "首爾": [
    { name: "景福宮", category: "transport", cost: 30, time: "2h", note: "穿韓服免費", lat: 37.5796, lon: 126.9770, img: "https://images.unsplash.com/photo-1538669716383-71cc735d4872?w=400&q=80", desc: "朝鮮王朝的第一法宮。" },
    { name: "N首爾塔", category: "transport", cost: 100, time: "2h", note: "南山夜景", lat: 37.5512, lon: 126.9882, img: "https://images.unsplash.com/photo-1549692520-acc6669e2f0c?w=400&q=80", desc: "首爾的地標，可俯瞰全市。" },
    { name: "明洞商圈", category: "shopping", cost: 0, time: "4h", note: "美妝天堂", lat: 37.5636, lon: 126.9827, img: "https://images.unsplash.com/photo-1579541529340-087332733979?w=400&q=80", desc: "韓國流行時尚與美妝的中心。" },
    { name: "北村韓屋村", category: "transport", cost: 0, time: "2h", note: "傳統建築", lat: 37.5826, lon: 126.9837, img: "https://images.unsplash.com/photo-1596826599288-114541b47d8f?w=400&q=80", desc: "保留完整的傳統韓屋聚落。" }
  ],
  "釜山": [
    { name: "海雲台海水浴場", category: "transport", cost: 0, time: "3h", note: "最美海灘", lat: 35.1587, lon: 129.1603, img: "https://images.unsplash.com/photo-1596788502256-4c4f9273c3cb?w=400&q=80", desc: "韓國最著名的渡假海灘。" },
    { name: "甘川洞文化村", category: "transport", cost: 0, time: "3h", note: "韓國馬丘比丘", lat: 35.0975, lon: 129.0106, img: "https://images.unsplash.com/photo-1569947703378-c44d7073229b?w=400&q=80", desc: "充滿色彩繽紛房屋的山坡村落。" },
    { name: "札嘎其市場", category: "food", cost: 200, time: "2h", note: "生鮮海鮮", lat: 35.0967, lon: 129.0305, img: "https://images.unsplash.com/photo-1580237072617-771c3ecc4a24?w=400&q=80", desc: "韓國最大的水產市場。" }
  ],
  "台北": [
    { name: "台北101", category: "transport", cost: 150, time: "2h", note: "世界最高綠建築", lat: 25.0339, lon: 121.5644, img: "https://images.unsplash.com/photo-1590523277543-a94d2e4eb00b?w=400&q=80", desc: "台北地標，89樓有觀景台。" },
    { name: "士林夜市", category: "food", cost: 100, time: "3h", note: "小吃吃到飽", lat: 25.0877, lon: 121.5244, img: "https://images.unsplash.com/photo-1552431742-999330925c48?w=400&q=80", desc: "台北最大、最知名的夜市。" },
    { name: "中正紀念堂", category: "transport", cost: 0, time: "1h", note: "衛兵交接", lat: 25.0354, lon: 121.5197, img: "https://images.unsplash.com/photo-1597554900742-b0624022a46c?w=400&q=80", desc: "藍白建築，紀念蔣中正。" },
    { name: "故宮博物院", category: "transport", cost: 80, time: "3h", note: "中華文物", lat: 25.1024, lon: 121.5485, img: "https://images.unsplash.com/photo-1590496793929-36417d3117de?w=400&q=80", desc: "收藏豐富的中華藝術寶庫。" }
  ],
  "曼谷": [
    { name: "大皇宮", category: "transport", cost: 150, time: "3h", note: "金碧輝煌", lat: 13.7500, lon: 100.4913, img: "https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=400&q=80", desc: "泰國王室的皇宮，玉佛寺所在地。" },
    { name: "恰圖恰週末市集", category: "shopping", cost: 0, time: "4h", note: "世界最大市集", lat: 13.7992, lon: 100.5502, img: "https://images.unsplash.com/photo-1567406140416-37b03628373b?w=400&q=80", desc: "僅週末開放，攤位超過一萬個。" },
    { name: "鄭王廟 (黎明寺)", category: "transport", cost: 50, time: "1h", note: "河畔地標", lat: 13.7437, lon: 100.4888, img: "https://images.unsplash.com/photo-1585827618995-17793c764d0d?w=400&q=80", desc: "湄南河畔最著名的寺廟。" },
    { name: "Iconsiam", category: "shopping", cost: 0, time: "3h", note: "室內水上市場", lat: 13.7267, lon: 100.5108, img: "https://images.unsplash.com/photo-1552550279-08a4197e7222?w=400&q=80", desc: "曼谷最新地標級購物中心。" }
  ],
  "倫敦": [
    { name: "大英博物館", category: "transport", cost: 0, time: "4h", note: "世界文物", lat: 51.5194, lon: -0.1270, img: "https://images.unsplash.com/photo-1565551932483-36c84c7be22d?w=400&q=80", desc: "收藏世界各地的人類文化遺產。" },
    { name: "倫敦眼", category: "transport", cost: 300, time: "1h", note: "泰晤士河景", lat: 51.5033, lon: -0.1195, img: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=400&q=80", desc: "巨大的摩天輪，可俯瞰倫敦市區。" },
    { name: "白金漢宮", category: "transport", cost: 0, time: "1h", note: "衛兵交接", lat: 51.5014, lon: -0.1419, img: "https://images.unsplash.com/photo-1577003833170-c08832c3f848?w=400&q=80", desc: "英國君主在倫敦的寢宮。" },
    { name: "塔橋", category: "transport", cost: 100, time: "1h", note: "經典地標", lat: 51.5055, lon: -0.0754, img: "https://images.unsplash.com/photo-1520986606214-8b456906c813?w=400&q=80", desc: "橫跨泰晤士河的開啟橋。" }
  ],
  "巴黎": [
    { name: "艾菲爾鐵塔", category: "transport", cost: 250, time: "2h", note: "浪漫地標", lat: 48.8584, lon: 2.2945, img: "https://images.unsplash.com/photo-1511739001486-6bfe10ce7859?w=400&q=80", desc: "巴黎的象徵，世界著名建築。" },
    { name: "羅浮宮", category: "transport", cost: 180, time: "4h", note: "蒙娜麗莎", lat: 48.8606, lon: 2.3376, img: "https://images.unsplash.com/photo-1499856871940-a09627c6dcf6?w=400&q=80", desc: "世界最大博物館之一，收藏豐富。" },
    { name: "香榭麗舍大道", category: "shopping", cost: 0, time: "2h", note: "精品逛街", lat: 48.8698, lon: 2.3075, img: "https://images.unsplash.com/photo-1509439581779-6298f75bf6e5?w=400&q=80", desc: "巴黎最美麗的街道。" },
    { name: "凱旋門", category: "transport", cost: 100, time: "1h", note: "壯麗地標", lat: 48.8738, lon: 2.2950, img: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400&q=80", desc: "拿破崙為紀念勝利而建。" }
  ],
  "香港": [
    { name: "太平山頂", category: "transport", cost: 80, time: "3h", note: "百萬夜景", lat: 22.2759, lon: 114.1455, img: "https://images.unsplash.com/photo-1536739999553-625c52c38827?w=400&q=80", desc: "俯瞰維多利亞港的最佳地點。" },
    { name: "香港迪士尼樂園", category: "transport", cost: 600, time: "全日", note: "奇妙夢想", lat: 22.3130, lon: 114.0413, img: "https://images.unsplash.com/photo-1550950337-a124c230d7b2?w=400&q=80", desc: "位於大嶼山的迪士尼主題樂園。" },
    { name: "旺角女人街", category: "shopping", cost: 0, time: "2h", note: "平價購物", lat: 22.3193, lon: 114.1694, img: "https://images.unsplash.com/photo-1543265738-1f10d21888e2?w=400&q=80", desc: "充滿露天攤位的熱鬧街道。" },
    { name: "維多利亞港", category: "transport", cost: 0, time: "1h", note: "幻彩詠香江", lat: 22.2934, lon: 114.1717, img: "https://images.unsplash.com/photo-1518599801797-737c8d02e8e7?w=400&q=80", desc: "世界三大夜景之一。" }
  ],
  "雪梨": [
    { name: "雪梨歌劇院", category: "transport", cost: 200, time: "2h", note: "內部導覽", lat: -33.8568, lon: 151.2153, img: "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=400&q=80", desc: "20世紀最具特色的建築之一。" },
    { name: "邦迪海灘", category: "transport", cost: 0, time: "3h", note: "衝浪與日光浴", lat: -33.8915, lon: 151.2767, img: "https://images.unsplash.com/photo-1523428098666-1a6a90e96033?w=400&q=80", desc: "澳洲最著名的海灘。" },
    { name: "雪梨魚市場", category: "food", cost: 250, time: "2h", note: "生蠔龍蝦午餐", lat: -33.8732, lon: 151.1923, img: "https://images.unsplash.com/photo-1621316279476-b33344662867?w=400&q=80", desc: "南半球最大的海鮮市場。" },
    { name: "維多利亞女王大廈", category: "shopping", cost: 0, time: "2h", note: "古蹟內購物", lat: -33.8718, lon: 151.2067, img: "https://images.unsplash.com/photo-1596527588365-d4e77243c220?w=400&q=80", desc: "羅馬式建築風格的購物中心。" }
  ],
  "墨爾本": [
    { name: "普芬比利蒸汽火車", category: "transport", cost: 400, time: "4h", note: "穿越森林", lat: -37.9069, lon: 145.3533, img: "https://images.unsplash.com/photo-1621045239999-ad47742d4757?w=400&q=80", desc: "澳洲最古老的蒸汽火車。" },
    { name: "大洋路 (十二門徒石)", category: "transport", cost: 600, time: "全日", note: "壯麗海岸線", lat: -38.6635, lon: 143.1042, img: "https://images.unsplash.com/photo-1510265119258-db115b0e8172?w=400&q=80", desc: "世界最美的海岸公路之一。" },
    { name: "維多利亞女王市場", category: "food", cost: 100, time: "2h", note: "南半球最大露天市場", lat: -37.8076, lon: 144.9568, img: "https://images.unsplash.com/photo-1545652634-9279dc69116e?w=400&q=80", desc: "歷史悠久的市集，美食購物天堂。" },
    { name: "墨爾本塗鴉巷", category: "transport", cost: 0, time: "1h", note: "街頭藝術", lat: -37.8160, lon: 144.9695, img: "https://images.unsplash.com/photo-1505538460325-5e98b3b65f07?w=400&q=80", desc: "充滿創意的街頭塗鴉文化。" }
  ],
  "布里斯本": [
    { name: "龍柏考拉保護區", category: "transport", cost: 250, time: "3h", note: "抱無尾熊", lat: -27.5337, lon: 152.9687, img: "https://images.unsplash.com/photo-1528026526782-2736173b9e4a?w=400&q=80", desc: "世界最早、最大的無尾熊保護區。" },
    { name: "南岸公園", category: "transport", cost: 0, time: "2h", note: "人造沙灘", lat: -27.4812, lon: 153.0234, img: "https://images.unsplash.com/photo-1562657523-2679c2937397?w=400&q=80", desc: "布里斯本河畔的休閒娛樂區。" },
    { name: "故事橋", category: "transport", cost: 500, time: "2h", note: "攀爬體驗", lat: -27.4637, lon: 153.0360, img: "https://images.unsplash.com/photo-1565606689059-880e25331369?w=400&q=80", desc: "可攀爬的懸臂橋，俯瞰城市。" }
  ],
  "黃金海岸": [
    { name: "衝浪者天堂", category: "transport", cost: 0, time: "3h", note: "無盡沙灘", lat: -28.0025, lon: 153.4296, img: "https://images.unsplash.com/photo-1506953823976-52e1fdc0149a?w=400&q=80", desc: "黃金海岸的中心，摩天大樓與海灘。" },
    { name: "華納電影世界", category: "transport", cost: 500, time: "全日", note: "主題樂園", lat: -27.9090, lon: 153.3130, img: "https://images.unsplash.com/photo-1513883049090-d0b7439799bf?w=400&q=80", desc: "南半球的好萊塢，刺激遊樂設施。" },
    { name: "海洋世界", category: "transport", cost: 500, time: "全日", note: "海洋動物", lat: -27.9559, lon: 153.4250, img: "https://images.unsplash.com/photo-1574949364680-e18d164797e9?w=400&q=80", desc: "與海洋生物互動的主題樂園。" }
  ],
  // 預設 (Fallback)
  "default": [
    { name: "市中心廣場", category: "transport", cost: 0, time: "1h", note: "地標打卡", lat: 0, lon: 0, img: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=400&q=80", desc: "城市的中心地帶。" },
    { name: "當地博物館", category: "transport", cost: 100, time: "2h", note: "文化體驗", lat: 0, lon: 0, img: "https://images.unsplash.com/photo-1566127444979-b3d2b654e3d7?w=400&q=80", desc: "收藏豐富的文化遺產。" }
  ]
};

// 基礎消費 (HKD/人/天)
const BASE_COSTS = { "JP": { food: 400, transport: 150 }, "AU": { food: 500, transport: 150 }, "default": { food: 400, transport: 150 } };
const FLIGHT_COSTS = { "JP": { direct: 5000, transfer: 3500 }, "AU": { direct: 8000, transfer: 6000 }, "default": { direct: 6000, transfer: 4000 } };
const HOTEL_COSTS = { "5star": 2500, "4star": 1500, "3star": 1000, "homestay": 800, "hostel": 400 };
const ITEM_DEFINITIONS = { "護照/簽證": { weight: 0.1, volume: 1, category: "doc" }, "換洗衣物": { weight: 0.5, volume: 10, category: "clothes" }, "外套": { weight: 0.8, volume: 15, category: "clothes" }, "盥洗包": { weight: 0.5, volume: 5, category: "daily" } };
const BUDGET_CATEGORIES = { shopping: { label: "衣/購", icon: ShoppingBag, color: "text-pink-500" }, food: { label: "食", icon: Utensils, color: "text-orange-500" }, stay: { label: "住", icon: Home, color: "text-indigo-500" }, transport: { label: "行", icon: Bus, color: "text-blue-500" }, other: { label: "其他", icon: FileText, color: "text-gray-500" } };

// 計算距離 (Haversine Formula)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// --- Custom Components ---

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

// 農曆與節日簡易查詢
const getLunarInfo = (date) => {
  const y = date.getFullYear(); const m = date.getMonth() + 1; const d = date.getDate();
  if (m === 1 && d === 1) return "元旦"; if (m === 12 && d === 25) return "聖誕";
  const baseDate = new Date(2024, 1, 10); const diffDays = Math.floor((date - baseDate) / 86400000); const lunarDayIndex = (diffDays % 29 + 29) % 29 + 1;
  if (lunarDayIndex === 1) return "初一"; if (lunarDayIndex === 15) return "十五";
  return null;
};

// 升級版日曆
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

// 取得天氣
const fetchDailyWeather = async (lat, lon, startStr, endStr) => {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto&start_date=${startStr}&end_date=${endStr}`;
    const res = await fetch(url);
    const data = await res.json();
    const weatherMap = {};
    if (data.daily) {
      data.daily.time.forEach((date, i) => {
        const code = data.daily.weathercode[i];
        let icon = Sun; let desc = "晴";
        if (code >= 95) { icon = CloudRain; desc = "雷雨"; } else if (code >= 71) { icon = Snowflake; desc = "雪"; } else if (code >= 51) { icon = Droplets; desc = "雨"; } else if (code >= 3) { icon = Cloud; desc = "陰"; } else if (code >= 1) { icon = Cloud; desc = "多雲"; }
        weatherMap[date] = { max: data.daily.temperature_2m_max[i], min: data.daily.temperature_2m_min[i], rain: data.daily.precipitation_probability_max[i], icon: icon, desc: desc };
      });
    }
    return weatherMap;
  } catch (e) { return {}; }
};

// Main App
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

  const calculateEstimatedBudget = () => {
    if (!newTrip.startDate || !newTrip.endDate) return;
    if (newTrip.endDate < newTrip.startDate) return;

    const cityInfo = CITY_DATA[newTrip.destination];
    const region = cityInfo ? cityInfo.region : 'default';
    const baseCosts = BASE_COSTS[region] || BASE_COSTS['default'];
    const purposeMult = PURPOSE_MULTIPLIERS[newTrip.purpose] || PURPOSE_MULTIPLIERS['sightseeing'];
    const flightBase = (FLIGHT_COSTS[region] || FLIGHT_COSTS['default'])[newTrip.flightType];
    const hotelBase = HOTEL_COSTS[newTrip.hotelType];

    const start = new Date(newTrip.startDate);
    const end = new Date(newTrip.endDate);
    const days = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1);
    
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

  useEffect(() => {
    if (newTrip.destination && newTrip.startDate && newTrip.endDate) calculateEstimatedBudget();
  }, [newTrip.destination, newTrip.startDate, newTrip.endDate, newTrip.travelers, newTrip.purpose, newTrip.flightType, newTrip.hotelType]);

  const handleGoogleLink = async () => { try { if (user.isAnonymous) await linkWithPopup(user, googleProvider); else showToast("已登入", "success"); } catch (error) { if (error.code === 'auth/credential-already-in-use') { if(confirm("此帳號已有資料，是否切換？")) await signInWithPopup(auth, googleProvider); } } };
  const handleExportData = () => { const data = { user: user.uid, trips: trips, items: items, exportedAt: new Date().toISOString() }; const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `travel_backup.json`; a.click(); };
  const toggleTripLock = async () => { await updateDoc(doc(db, 'artifacts', APP_ID, 'users', user.uid, 'trips', currentTrip.id), { isLocked: !currentTrip.isLocked }); setCurrentTrip(prev => ({...prev, isLocked: !prev.isLocked})); showToast(currentTrip.isLocked ? "行程已解鎖" : "行程已鎖定", "success"); };
  const handlePrint = () => window.print();

  const createTrip = async (e) => {
    e.preventDefault();
    if (!newTrip.startDate || !newTrip.endDate) return showToast("請選擇完整的日期範圍", "error");
    if (!newTrip.destination) return showToast("請輸入目的地", "error");
    try {
      setLoadingWeather(true);
      const docRef = await addDoc(collection(db, 'artifacts', APP_ID, 'users', user.uid, 'trips'), { ...newTrip, weather: 'sunny', currency: CITY_DATA[newTrip.destination]?.currency || 'HKD', actualCost: 0, isLocked: false, createdAt: serverTimestamp() });
      setLoadingWeather(false);
      const tripId = docRef.id;
      const batch = [];
      const addSubItem = (type, title, category, owner, qty = 1, defCost = '') => {
        const defs = ITEM_DEFINITIONS[title] || { weight: 0.5, volume: 5, icon: Briefcase };
        batch.push(addDoc(collection(db, 'artifacts', APP_ID, 'users', user.uid, 'sub_items'), { tripId, type, title, cost: defCost, category, itemOwner: owner, quantity: qty, weight: defs.weight, volume: defs.volume, completed: false, createdAt: serverTimestamp() }));
      };

      const days = newTrip.budgetDetails.days || 3;
      const isCold = newTrip.destination === '札幌' || newTrip.destination === '首爾'; 
      ["護照/簽證", "現金/信用卡"].forEach(t => addSubItem('packing', t, 'doc', '全體'));
      ["手機充電器", "萬用轉接頭"].forEach(t => addSubItem('packing', t, 'move', '全體', 1));
      
      if (newTrip.travelers.adults > 0) {
        addSubItem('packing', '換洗衣物', 'clothes', '成人', newTrip.travelers.adults * Math.min(days, 5));
        addSubItem('packing', isCold ? '厚外套' : '薄外套', 'clothes', '成人', newTrip.travelers.adults);
      }
      if (newTrip.travelers.toddlers > 0) {
        addSubItem('packing', '尿布', 'daily', '幼童', newTrip.travelers.toddlers * days * 6);
        addSubItem('packing', '奶粉', 'food', '幼童', 1);
        addSubItem('packing', '推車', 'move', '幼童', 1);
      }

      // Generate Smart Itinerary with AI logic (Use expanded POI_DB)
      const citySpots = POI_DB[newTrip.destination] || POI_DB['default'];
      const hasKids = newTrip.travelers.children > 0 || newTrip.travelers.toddlers > 0;
      
      let currentDay = 0;
      let spotIndex = 0;
      
      // First day: Arrival
      batch.push(addDoc(collection(db, 'artifacts', APP_ID, 'users', user.uid, 'sub_items'), { 
          tripId, type: 'itinerary', title: "抵達 & 飯店 Check-in", 
          date: new Date(newTrip.startDate).toISOString().split('T')[0], 
          startTime: "14:00", duration: "2h", notes: "辦理入住，熟悉周邊環境，購買交通卡/網卡", 
          cost: 0, category: 'other', completed: false, createdAt: serverTimestamp() 
      }));

      // Middle days
      for (let i = 1; i < days - 1; i++) {
        const dateStr = new Date(new Date(newTrip.startDate).getTime() + i * 86400000).toISOString().split('T')[0];
        
        // Morning Spot
        const spot1 = citySpots[spotIndex % citySpots.length];
        let note1 = spot1.note;
        if (hasKids && (spot1.name.includes("樂園") || spot1.name.includes("動物園"))) note1 += " (親子推薦)";
        
        batch.push(addDoc(collection(db, 'artifacts', APP_ID, 'users', user.uid, 'sub_items'), { 
          tripId, type: 'itinerary', title: spot1.name, date: dateStr, 
          startTime: "10:00", duration: spot1.time, notes: note1, 
          cost: spot1.cost || 0, category: spot1.category || 'transport',
          completed: false, createdAt: serverTimestamp() 
      }));
        
        // Afternoon Spot
        const spot2 = citySpots[(spotIndex + 1) % citySpots.length];
        batch.push(addDoc(collection(db, 'artifacts', APP_ID, 'users', user.uid, 'sub_items'), { 
          tripId, type: 'itinerary', title: spot2.name, date: dateStr, 
          startTime: "15:00", duration: spot2.time, notes: spot2.note, 
          cost: spot2.cost || 0, category: spot2.category || 'transport',
          completed: false, createdAt: serverTimestamp() 
        }));
        
        spotIndex += 2;
      }

      // Last day: Departure
      const lastDateStr = new Date(new Date(newTrip.startDate).getTime() + (days - 1) * 86400000).toISOString().split('T')[0];
      batch.push(addDoc(collection(db, 'artifacts', APP_ID, 'users', user.uid, 'sub_items'), { 
          tripId, type: 'itinerary', title: "前往機場 & 免稅店", 
          date: lastDateStr, 
          startTime: "09:00", duration: "3h", notes: "最後採買，準備返程", 
          cost: 0, category: 'other', completed: false, createdAt: serverTimestamp() 
      }));

      batch.push(addDoc(collection(db, 'artifacts', APP_ID, 'users', user.uid, 'sub_items'), { tripId, type: 'budget', title: `✈️ 機票 (${newTrip.flightType==='direct'?'直航':'轉機'})`, cost: newTrip.budgetDetails.flight, category: 'transport', createdAt: serverTimestamp() }));
      batch.push(addDoc(collection(db, 'artifacts', APP_ID, 'users', user.uid, 'sub_items'), { tripId, type: 'budget', title: `🏨 住宿 (${newTrip.hotelType})`, cost: newTrip.budgetDetails.hotel, category: 'stay', createdAt: serverTimestamp() }));
      batch.push(addDoc(collection(db, 'artifacts', APP_ID, 'users', user.uid, 'sub_items'), { tripId, type: 'budget', title: '🍽️ 預估餐飲費', cost: newTrip.budgetDetails.food, category: 'food', createdAt: serverTimestamp() }));
      batch.push(addDoc(collection(db, 'artifacts', APP_ID, 'users', user.uid, 'sub_items'), { tripId, type: 'budget', title: '🚌 預估交通費', cost: newTrip.budgetDetails.transport, category: 'transport', createdAt: serverTimestamp() }));
      
      if (newTrip.budgetDetails.shopping > 0) {
        batch.push(addDoc(collection(db, 'artifacts', APP_ID, 'users', user.uid, 'sub_items'), { tripId, type: 'budget', title: '🛍️ 預留購物金', cost: newTrip.budgetDetails.shopping, category: 'shopping', createdAt: serverTimestamp() }));
      }

      await Promise.all(batch);
      setNewTrip({ origin: '香港', destination: '', startDate: '', endDate: '', purpose: 'sightseeing', travelers: { adults: 1, children: 0, toddlers: 0, elderly: 0 }, flightType: 'direct', hotelType: '4star', estimatedBudget: 0, budgetDetails: {} });
      showToast("AI 行程與預算表已建立！", "success");
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
    if (currentTrip.isLocked) return showToast("已鎖定", "error");
    if (!navigator.geolocation) return showToast("不支援定位", "error");
    navigator.geolocation.getCurrentPosition((pos) => {
       const { latitude, longitude } = pos.coords;
       const t = new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
       
       // Proximity Logic
       const citySpots = POI_DB[currentTrip.destination] || [];
       let nearbySpot = null; let minDistance = 5; 
       citySpots.forEach(spot => { if (spot.lat && spot.lon) { const d = calculateDistance(latitude, longitude, spot.lat, spot.lon); if (d < minDistance) { minDistance = d; nearbySpot = spot; } } });
       setNewItem(prev => ({ 
         ...prev, type: 'itinerary', title: nearbySpot ? `📍 打卡: ${nearbySpot.name} (附近)` : `📍 打卡 (${latitude.toFixed(2)}, ${longitude.toFixed(2)})`, 
         date: new Date().toISOString().split('T')[0], startTime: t, notes: nearbySpot ? `位於 ${nearbySpot.name} 附近` : '', cost: nearbySpot ? nearbySpot.cost : '', category: 'transport', isCheckIn: true 
       }));
       setCheckInModal(true);
    }, () => showToast("定位失敗", "error"));
  };

  const addSpotFromInfo = (spot) => {
    setActiveTab('itinerary');
    setNewItem({ ...newItem, type: 'itinerary', category: spot.category || 'transport', title: spot.name, cost: spot.cost || 0, notes: spot.note || '', duration: spot.time || '2h', date: currentTrip.startDate });
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    showToast(`已選擇 ${spot.name}`, "success");
  };

  const deleteItem = async (id) => { if (currentTrip.isLocked) return showToast("已鎖定", "error"); if(!confirm("確定刪除？")) return; await deleteDoc(doc(db, 'artifacts', APP_ID, 'users', user.uid, 'sub_items', id)); setTimeout(() => updateTripActualCost(currentTrip.id), 500); };
  const toggleItemComplete = async (item) => updateDoc(doc(db, 'artifacts', APP_ID, 'users', user.uid, 'sub_items', item.id), { completed: !item.completed });
  const updateQuantity = async (item, delta) => { if (currentTrip.isLocked) return; const newQty = Math.max(1, (item.quantity || 1) + delta); await updateDoc(doc(db, 'artifacts', APP_ID, 'users', user.uid, 'sub_items', item.id), { quantity: newQty }); };
  const editItem = (item) => { if (currentTrip.isLocked) return showToast("已鎖定", "error"); setNewItem({ ...item, foreignCost: item.foreignCost || '', currency: item.currency || 'HKD' }); setEditingItem(item.id); };
  const openGoogleMapsRoute = (date) => {
    const points = items.filter(i => i.type === 'itinerary' && i.date === date).sort((a,b) => (a.startTime > b.startTime ? 1 : -1));
    if (points.length === 0) return showToast("無行程點", "error");
    const origin = points[0].title; const destination = points[points.length - 1].title; const waypoints = points.slice(1, -1).map(p => p.title).join('|');
    window.open(points.length === 1 ? `https://www.google.com/maps/search/${currentTrip.destination}+${origin}` : `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&waypoints=${waypoints}&travelmode=transit`, '_blank');
  };

  const luggageStats = useMemo(() => {
    const packingItems = items.filter(i => i.type === 'packing');
    const totalWeight = packingItems.reduce((sum, i) => sum + (Number(i.weight || 0) * Number(i.quantity || 1)), 0);
    let suggestion = "背包/手提"; if (totalWeight > 7) suggestion = "20吋登機箱"; if (totalWeight > 15) suggestion = "24吋行李箱"; if (totalWeight > 23) suggestion = "28吋大行李箱";
    return { totalWeight: totalWeight.toFixed(1), suggestion };
  }, [items]);

  const budgetStats = useMemo(() => {
    const budgetItems = items.filter(i => i.cost && (i.type === 'budget' || i.type === 'itinerary'));
    const stats = { shopping: 0, food: 0, stay: 0, transport: 0, other: 0, total: 0 };
    budgetItems.forEach(i => { const cost = Number(i.cost) || 0; const cat = i.category || 'other'; if (stats[cat] !== undefined) stats[cat] += cost; else stats.other += cost; stats.total += cost; });
    return stats;
  }, [items]);

  const TravelerCounter = ({ label, icon: Icon, value, field }) => (
    <div className="flex items-center justify-between bg-gray-50 p-2 rounded-lg text-xs">
      <div className="flex items-center gap-1"><Icon size={14} className="text-gray-500" /><span>{label}</span></div>
      <div className="flex items-center gap-2"><button type="button" onClick={() => setNewTrip(p => ({...p, travelers: {...p.travelers, [field]: Math.max(0, p.travelers[field]-1)}}))} className="w-5 h-5 rounded bg-white border flex items-center justify-center">-</button><span className="w-3 text-center">{value}</span><button type="button" onClick={() => setNewTrip(p => ({...p, travelers: {...p.travelers, [field]: p.travelers[field]+1}}))} className="w-5 h-5 rounded bg-white border flex items-center justify-center text-blue-500">+</button></div>
    </div>
  );

  const ReportTemplate = () => {
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
           <header className="flex justify-between items-center mb-8"><h1 className="text-2xl font-bold text-blue-900">智能旅遊管家 Pro</h1><button onClick={() => setShowUserModal(true)} className="bg-white px-3 py-2 rounded-full shadow-sm text-sm"><User size={18}/> {user?.isAnonymous?'訪客':'已綁定'}</button></header>
           {/* ... (Create Trip Form & User Modal same as before) ... */}
           <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Plus size={20}/> 建立新旅程</h2>
              <form onSubmit={createTrip} className="space-y-4">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1 relative"><label className="text-xs text-gray-500">出發地</label><input value={newTrip.origin} onChange={e=>setNewTrip({...newTrip, origin: e.target.value})} onFocus={() => setShowOriginSuggestions(true)} className="w-full p-2 border rounded-lg bg-gray-50"/>{showOriginSuggestions && <div className="absolute z-10 w-full bg-white border rounded-lg shadow-xl mt-1 p-2 flex flex-wrap gap-2">{POPULAR_ORIGINS.map(c => <button type="button" key={c} onClick={() => {setNewTrip({...newTrip, origin: c}); setShowOriginSuggestions(false);}} className="text-xs bg-gray-100 px-2 py-1 rounded">{c}</button>)}<button type="button" onClick={()=>setShowOriginSuggestions(false)} className="w-full text-center text-xs text-blue-500 mt-1 pt-1 border-t">關閉</button></div>}</div>
                    <div className="space-y-1 relative"><label className="text-xs text-gray-500">目的地</label><input placeholder="例如：東京" value={newTrip.destination} onChange={e=>setNewTrip({...newTrip, destination: e.target.value})} onFocus={() => setShowCitySuggestions(true)} className="w-full p-2 border rounded-lg focus:ring-2 ring-blue-500 outline-none" />{showCitySuggestions && <div className="absolute z-10 w-full bg-white border rounded-lg shadow-xl mt-1 p-2 grid grid-cols-4 gap-2">{POPULAR_CITIES.map(c => <button type="button" key={c} onClick={() => {setNewTrip({...newTrip, destination: c}); setShowCitySuggestions(false);}} className="text-xs border px-2 py-1 rounded hover:bg-blue-50">{c}</button>)}<button type="button" onClick={()=>setShowCitySuggestions(false)} className="col-span-4 text-center text-xs text-blue-500 mt-1 pt-1 border-t">關閉</button></div>}</div>
                 </div>
                 <div className="space-y-1 relative">
                    <label className="text-xs text-gray-500">選擇日期</label>
                    <div onClick={() => setShowCalendar(!showCalendar)} className="w-full p-2 border rounded-lg cursor-pointer bg-gray-50">{newTrip.startDate ? `${newTrip.startDate} -> ${newTrip.endDate}` : '點擊選擇'}</div>
                    {showCalendar && <div className="absolute top-16 left-0 z-20"><RangeCalendar startDate={newTrip.startDate} endDate={newTrip.endDate} onChange={({startDate, endDate}) => setNewTrip({...newTrip, startDate, endDate})} onClose={()=>setShowCalendar(false)}/></div>}
                 </div>
                 <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold">建立行程</button>
              </form>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{trips.map(trip => <div key={trip.id} onClick={() => openTrip(trip)} className="bg-white p-5 rounded-xl shadow-sm cursor-pointer"><h3 className="font-bold">{trip.destination}</h3><p className="text-sm text-gray-500">{trip.startDate}</p></div>)}</div>
        </div>
      </div>
    );
  }

  // Trip Detail View
  const tripItems = items.filter(i => i.type === activeTab);
  const citySpots = POI_DB[currentTrip.destination] || POI_DB['default'];

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800 flex flex-col bg-white">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      
      <div className="bg-white border-b sticky top-0 z-20 shadow-sm print:hidden">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center justify-between py-3">
            <button onClick={() => setView('dashboard')} className="text-gray-500 hover:text-blue-600 text-sm">← 返回</button>
            <div className="text-center"><h1 className="font-bold text-lg">{currentTrip.destination}</h1></div>
            <div className="flex gap-2"><button onClick={() => setShowPreviewModal(true)} className="flex items-center gap-1 bg-blue-600 text-white px-3 py-1 rounded-full shadow-sm text-sm hover:bg-blue-700"><Eye size={14}/> 預覽</button></div>
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
              {['shopping', 'food', 'stay', 'transport'].map(catKey => {
                 const catLabel = CATEGORY_LABELS[catKey];
                 const spots = citySpots.filter(s => s.category === catKey);
                 if (spots.length === 0) return null;
                 return (
                    <div key={catKey}>
                       <h3 className={`font-bold text-lg mb-3 flex items-center gap-2 ${catLabel.color}`}><catLabel.icon size={20}/> {catLabel.label}推薦</h3>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {spots.map((spot, idx) => (
                             <div key={idx} className="bg-white border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow group">
                                <div className="h-32 bg-gray-200 relative overflow-hidden">
                                   <img src={spot.img} alt={spot.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"/>
                                   <div className="absolute bottom-0 left-0 bg-black/50 text-white text-xs px-2 py-1 w-full flex justify-between"><span><Clock size={10} className="inline mr-1"/>{spot.time}</span><span>預算 ${spot.cost}</span></div>
                                </div>
                                <div className="p-3">
                                   <div className="flex justify-between items-start mb-1"><h4 className="font-bold text-gray-800">{spot.name}</h4></div>
                                   <p className="text-xs text-gray-500 line-clamp-2 mb-3">{spot.desc || spot.note}</p>
                                   <button onClick={() => addSpotFromInfo(spot)} className="w-full bg-gray-50 text-blue-600 text-xs py-2 rounded-lg font-bold border border-blue-100 hover:bg-blue-600 hover:text-white transition-colors flex items-center justify-center gap-1"><Plus size={12}/> 加入行程預算</button>
                                </div>
                             </div>
                          ))}
                       </div>
                    </div>
                 )
              })}
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

        {/* Input Bar */}
        {!checkInModal && !currentTrip.isLocked && activeTab === 'itinerary' && (
          <form onSubmit={addItem} className="bg-white p-4 rounded-xl shadow-lg border flex flex-col gap-3 sticky bottom-4 z-10 print:hidden">
            <div className="flex justify-between text-xs text-blue-500 font-bold"><span>{editingItem ? "✏️ 編輯" : `➕ 新增 (${newItem.date})`}</span><button type="button" onClick={()=>setShowSpotSelector(true)} className="text-orange-500 flex items-center gap-1 hover:text-orange-600"><StarIcon size={12}/> 從推薦選擇</button></div>
            <div className="flex gap-2 items-center">
              <input type="text" placeholder="行程名稱" className="flex-1 p-2 bg-gray-50 rounded-lg outline-none focus:bg-white focus:ring-2 ring-blue-100" value={newItem.title} onChange={e => setNewItem({...newItem, title: e.target.value})} />
              <div className="flex gap-1"><input type="time" value={newItem.startTime} onChange={e=>setNewItem({...newItem, startTime: e.target.value})} className="w-20 p-2 bg-gray-50 rounded-lg text-xs"/><input type="text" placeholder="時長" value={newItem.duration} onChange={e=>setNewItem({...newItem, duration: e.target.value})} className="w-12 p-2 bg-gray-50 rounded-lg text-xs text-center"/></div>
              <button type="submit" className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700">{editingItem ? <Edit2 size={16}/> : <Plus size={20}/>}</button>
            </div>
          </form>
        )}

        {/* Reuse generic input bar for other tabs... (People, Packing, Budget) */}
        {!checkInModal && !currentTrip.isLocked && activeTab !== 'itinerary' && activeTab !== 'info' && (
            <form onSubmit={addItem} className="bg-white p-4 rounded-xl shadow-lg border flex flex-col gap-3 sticky bottom-4 z-10 print:hidden">
               {activeTab === 'people' ? (
                  <div className="grid grid-cols-2 gap-2"><input type="text" placeholder="姓名" className="p-2 bg-gray-50 rounded-lg" value={newItem.pName} onChange={e=>setNewItem({...newItem, pName:e.target.value})}/><input type="text" placeholder="房號" className="p-2 bg-gray-50 rounded-lg" value={newItem.pRoom} onChange={e=>setNewItem({...newItem, pRoom:e.target.value})}/></div>
               ) : (
                  <div className="flex gap-2 items-center"><input type="text" placeholder="名稱" className="flex-1 p-2 bg-gray-50 rounded-lg" value={newItem.title} onChange={e=>setNewItem({...newItem, title:e.target.value})}/><button type="submit" className="bg-blue-600 text-white p-2 rounded-lg"><Plus size={20}/></button></div>
               )}
               {activeTab !== 'people' && <button type="submit" className="hidden"></button>}
               {activeTab === 'people' && <button type="submit" className="bg-blue-600 text-white p-2 rounded-lg w-full">新增人員</button>}
            </form>
        )}

        {/* CheckIn Modal */}
        {checkInModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
             <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">📍 {newItem.title.includes('附近') ? '智能打卡' : '足跡打卡'}</h3>
                <div className="text-sm font-bold text-blue-600 mb-2">{newItem.title}</div>
                <div className="space-y-3"><input type="text" value={newItem.notes} onChange={e=>setNewItem({...newItem, notes:e.target.value})} className="w-full p-2 border rounded-lg" placeholder="備註..."/><div className="flex gap-2"><input type="number" value={newItem.foreignCost} onChange={e=>setNewItem({...newItem, foreignCost:e.target.value, cost:Math.round(e.target.value * EXCHANGE_RATES[newItem.currency])})} className="flex-1 p-2 border rounded-lg" placeholder="消費"/><select value={newItem.currency} onChange={e=>setNewItem({...newItem, currency:e.target.value})} className="w-20 p-2 border rounded-lg bg-white">{Object.keys(EXCHANGE_RATES).map(c=><option key={c} value={c}>{c}</option>)}</select></div><div className="flex gap-2 mt-4"><button onClick={()=>setCheckInModal(false)} className="flex-1 py-2 text-gray-500">取消</button><button onClick={addItem} className="flex-1 py-2 bg-blue-600 text-white rounded-lg">確認</button></div></div>
             </div>
          </div>
        )}

      </div>
    </div>
  );
}

function StarIcon(props) { return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> }

export default TravelApp;
