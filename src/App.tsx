import React, { useState, useEffect } from 'react';
import { SettingsProvider, useSettings } from './contexts/SettingsContext';
import { 
  LayoutDashboard, 
  Map as MapIcon, 
  AlertCircle, 
  Users, 
  BarChart3, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  Minus,
  PlusCircle,
  Award,
  BookOpen,
  MessageSquare,
  Search,
  Bell,
  Home,
  Sun,
  Moon,
  Languages
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, PieChart, Pie, Cell 
} from 'recharts';

// --- Types ---
type Role = 'citizen' | 'volunteer' | 'ward_officer' | 'admin';

interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  ward_id?: number;
}

interface Report {
  id: number;
  reporter_name: string;
  ward_name: string;
  category: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'verified' | 'in_progress' | 'resolved' | 'closed';
  description: string;
  lat: number;
  lng: number;
  created_at: string;
}

// --- Mock Data / Constants ---
const CATEGORIES = ['Garbage Pile', 'Clogged Drain', 'Illegal Dumping', 'Public Toilet Issue', 'Dead Animal', 'Other'];
const URGENCY_LEVELS = ['low', 'medium', 'high', 'critical'];
const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

// Fix Leaflet marker icon issue
// @ts-ignore
import markerIcon from 'leaflet/dist/images/marker-icon.png';
// @ts-ignore
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
// @ts-ignore
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

import { GoogleGenAI } from "@google/genai";

// --- Components ---

const SmartMap = ({ reports }: { reports: Report[] }) => {
  const greenIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });

  const blueIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });

  const redIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });

  const getIcon = (status: string) => {
    switch (status) {
      case 'verified':
        return greenIcon;
      case 'in_progress':
        return blueIcon;
      default:
        return redIcon;
    }
  };

  const visibleReports = (reports || []).filter(r => r.status !== 'closed');

  return (
    <div className="h-[600px] w-full rounded-2xl overflow-hidden border border-gray-200 shadow-lg relative z-0">
      <MapContainer center={[9.9252, 78.1198]} zoom={13} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        {visibleReports.map(report => (
          <Marker key={report.id} position={[report.lat, report.lng]} icon={getIcon(report.status)}>
            <Popup>
              <div className="p-2">
                <h4 className="font-bold">{report.category}</h4>
                <p className="text-sm">{report.ward_name}</p>
                <p className={`text-xs font-bold mt-1 ${
                  report.status === 'verified' ? 'text-green-600' :
                  report.status === 'in_progress' ? 'text-blue-600' :
                  'text-red-600'
                }`}>
                  {report.status.replace('_', ' ').toUpperCase()}
                </p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

const Community = ({ user, setActiveTab }: { user: User | null, setActiveTab: (t: string) => void }) => {
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/community/events').then(res => res.json()).then(setEvents);
  }, []);

  const handleRSVP = async (id: number) => {
    if (!user) {
      setActiveTab('login');
      return;
    }
    const token = localStorage.getItem('token');
    const res = await fetch(`/api/community/events/${id}/rsvp`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      fetch('/api/community/events').then(res => res.json()).then(setEvents);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Upcoming Cleanup Events</h2>
      {events.map(event => (
        <div key={event.id} className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-colors">
          <div>
            <h4 className="text-lg font-bold text-gray-900 dark:text-white">{event.title}</h4>
            <p className="text-gray-500 dark:text-gray-400">{event.ward_name} • {new Date(event.date).toLocaleString()}</p>
            <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium mt-1">{event.rsvp_count} volunteers joined</p>
          </div>
          <button 
            onClick={() => handleRSVP(event.id)}
            className="bg-emerald-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-emerald-700 transition-colors w-full sm:w-auto"
          >
            {user ? 'Join' : 'Login to Join'}
          </button>
        </div>
      ))}
    </div>
  );
};

const Awareness = () => {
  const [quiz, setQuiz] = useState<any[]>([]);
  const [tips, setTips] = useState<any[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [mapSearch, setMapSearch] = useState('');
  const [mapResults, setMapResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    fetch('/api/awareness/quiz').then(res => res.json()).then(setQuiz);
    fetch('/api/awareness/tips').then(res => res.json()).then(setTips);
  }, []);

  const handleAnswer = (ans: string) => {
    if (ans === quiz[currentQuestion].answer) setScore(score + 1);
    if (currentQuestion + 1 < quiz.length) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setShowResult(true);
    }
  };

  const handleMapSearch = async () => {
    if (!mapSearch.trim()) return;
    setSearching(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `Find ${mapSearch} in Madurai, Tamil Nadu. Provide a list of locations with their addresses.`,
        config: {
          tools: [{ googleMaps: {} }],
        }
      });
      
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (chunks) {
        setMapResults(chunks.filter((c: any) => c.maps).map((c: any) => c.maps));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="space-y-12">
      <section>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Civic Facility Search (Google Maps)</h2>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex gap-2 mb-6">
            <input 
              type="text" 
              value={mapSearch}
              onChange={e => setMapSearch(e.target.value)}
              placeholder="Search for 'Waste collection centers', 'Public toilets', etc."
              className="flex-1 p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
            />
            <button 
              onClick={handleMapSearch}
              disabled={searching}
              className="px-6 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 disabled:opacity-50"
            >
              {searching ? 'Searching...' : 'Search'}
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mapResults.map((res, i) => (
              <a 
                key={i} 
                href={res.uri} 
                target="_blank" 
                rel="noreferrer"
                className="p-4 border border-gray-100 rounded-xl hover:bg-emerald-50 transition-colors flex flex-col"
              >
                <span className="font-bold text-gray-900">{res.title}</span>
                <span className="text-xs text-emerald-600 mt-1">View on Google Maps</span>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Civic Awareness Quiz</h2>
        <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm max-w-2xl">
          {quiz.length > 0 && !showResult ? (
            <div className="space-y-6">
              <p className="text-sm text-emerald-600 font-bold uppercase tracking-wider">Question {currentQuestion + 1} of {quiz.length}</p>
              <h3 className="text-xl font-bold text-gray-900">{quiz[currentQuestion].question}</h3>
              <div className="grid grid-cols-1 gap-3">
                {quiz[currentQuestion].options.map((opt: string) => (
                  <button 
                    key={opt}
                    onClick={() => handleAnswer(opt)}
                    className="text-left p-4 rounded-xl border border-gray-200 hover:border-emerald-500 hover:bg-emerald-50 transition-all font-medium"
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Award size={48} className="mx-auto text-emerald-600 mb-4" />
              <h3 className="text-2xl font-bold text-gray-900">Quiz Completed!</h3>
              <p className="text-gray-500 mt-2">You scored {score} out of {quiz.length}</p>
              <button 
                onClick={() => { setCurrentQuestion(0); setScore(0); setShowResult(false); }}
                className="mt-6 bg-emerald-600 text-white px-6 py-2 rounded-xl font-bold"
              >
                Retake Quiz
              </button>
            </div>
          )}
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Composting & Waste Tips</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {tips.map((tip, i) => (
            <div key={i} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center mb-4">
                <BookOpen size={20} />
              </div>
              <h4 className="font-bold text-gray-900 mb-2">{tip.title}</h4>
              <p className="text-sm text-gray-500 leading-relaxed">{tip.content}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

const CivicAssistant = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'ai', text: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: userMsg,
        config: {
          systemInstruction: "You are the Madurai Clean 3.0 Civic Assistant. You help citizens of Madurai with waste management rules, composting tips, and civic reporting guidance. Keep answers concise, helpful, and culturally relevant to Madurai, Tamil Nadu."
        }
      });
      setMessages(prev => [...prev, { role: 'ai', text: response.text || 'Sorry, I could not process that.' }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'ai', text: 'Error connecting to AI service.' }]);
    } finally {
      setLoading(false);
    }
  };

  if (!isVisible) {
    return (
      <div className="fixed bottom-8 right-8 z-50">
        <button 
          onClick={() => setIsVisible(true)}
          className="w-14 h-14 bg-emerald-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:bg-emerald-700 transition-all hover:scale-110"
        >
          <MessageSquare size={24} />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-8 right-8 z-50">
      <div className="relative">
        <motion.div 
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ 
            opacity: 1, 
            scale: 1, 
            y: 0,
            height: isMinimized ? '64px' : '384px'
          }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="bg-white w-80 rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden"
        >
          <div className="bg-emerald-600 p-4 text-white flex justify-between items-center cursor-pointer" onClick={() => isMinimized && setIsMinimized(false)}>
            <div className="flex items-center gap-2">
              <MessageSquare size={20} />
              <span className="font-bold">Civic Assistant</span>
            </div>
            <div className="flex items-center gap-1">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMinimized(!isMinimized);
                }}
                className="p-1 hover:bg-white/20 rounded transition-colors"
                title={isMinimized ? "Expand" : "Minimize"}
              >
                <Minus size={18} />
              </button>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setIsVisible(false);
                }}
                className="p-1 hover:bg-white/20 rounded transition-colors"
                title="Close"
              >
                <X size={18} />
              </button>
            </div>
          </div>
          
          {!isMinimized && (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-4 h-64">
                {messages.length === 0 && (
                  <p className="text-sm text-gray-500 text-center mt-12">Ask me anything about waste management in Madurai!</p>
                )}
                {messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                      msg.role === 'user' ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
                {loading && <div className="text-xs text-gray-400 animate-pulse">Assistant is thinking...</div>}
              </div>
              <div className="p-3 border-t border-gray-100 flex gap-2">
                <input 
                  type="text" 
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && handleSend()}
                  placeholder="Type a message..."
                  className="flex-1 text-sm p-2 bg-gray-50 rounded-lg outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <button 
                  onClick={handleSend}
                  className="p-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                >
                  <Search size={18} />
                </button>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
};

// --- Main App ---

const LandingPage = ({ onReportClick }: { onReportClick: () => void }) => {
  const { t } = useSettings();
  const places = [
    {
      name: "Meenakshi Amman Temple",
      desc: "A historic Hindu temple located on the southern bank of the Vaigai River. It is the lifeline of the 2,500-year-old city of Madurai.",
      img: "https://picsum.photos/seed/meenakshi/800/600"
    },
    {
      name: "Thirumalai Nayakkar Palace",
      desc: "A 17th-century palace built by King Thirumalai Nayak. It is a classic fusion of Italian and Rajput styles.",
      img: "https://picsum.photos/seed/palace/800/600"
    },
    {
      name: "Gandhi Memorial Museum",
      desc: "Established in 1959, it is one of the five Gandhi Sanghralayas in the country, housed in the historic Tamukkam Palace.",
      img: "https://picsum.photos/seed/gandhi/800/600"
    },
    {
      name: "Vandiyur Teppakulam",
      desc: "A huge temple tank located near the Meenakshi Amman Temple, famous for its annual Float Festival.",
      img: "https://picsum.photos/seed/tank/800/600"
    }
  ];

  return (
    <div className="space-y-16 pb-20">
      {/* Hero Section */}
      <section className="relative h-[500px] rounded-3xl overflow-hidden flex items-center justify-center text-center px-4">
        <img 
          src="https://picsum.photos/seed/madurai-hero/1920/1080?blur=2" 
          className="absolute inset-0 w-full h-full object-cover" 
          alt="Madurai"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative z-10 max-w-3xl">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-7xl font-bold text-white mb-6"
          >
            {t('hero.title')}
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-gray-200 mb-8"
          >
            {t('hero.subtitle')}
          </motion.p>
          <button 
            onClick={onReportClick}
            className="bg-emerald-600 text-white px-8 py-4 rounded-xl text-lg font-bold hover:bg-emerald-700 transition-all shadow-lg hover:scale-105"
          >
            {t('hero.cta')}
          </button>
        </div>
      </section>

      {/* About Section */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm transition-colors">
          <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center mb-6">
            <AlertCircle size={24} />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{t('feature.smart_reporting')}</h3>
          <p className="text-gray-500 dark:text-gray-400">{t('feature.smart_reporting_desc')}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm transition-colors">
          <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-xl flex items-center justify-center mb-6">
            <LayoutDashboard size={24} />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{t('feature.officer_portal')}</h3>
          <p className="text-gray-500 dark:text-gray-400">{t('feature.officer_portal_desc')}</p>
        </div>
      </section>

      {/* Famous Places Section */}
      <section>
        <div className="flex justify-between items-end mb-10">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{t('places.title')}</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-2">{t('places.subtitle')}</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {places.map((place, i) => (
            <motion.div 
              key={i}
              whileHover={{ y: -10 }}
              className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-700 shadow-sm group transition-colors"
            >
              <div className="h-48 overflow-hidden">
                <img 
                  src={place.img} 
                  alt={place.name} 
                  className="w-full h-full object-cover transition-transform group-hover:scale-110"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="p-6">
                <h4 className="font-bold text-gray-900 dark:text-white mb-2">{place.name}</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-3">{place.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
};

const CitizenNavbar = ({ user, onLogout, activeTab, setActiveTab, notifications, markAsRead }: { user: User | null, onLogout: () => void, activeTab: string, setActiveTab: (t: string) => void, notifications: any[], markAsRead: (id: number) => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const { language, setLanguage, theme, toggleTheme, t } = useSettings();

  const navItems = [
    { id: 'home', label: t('nav.home'), icon: Home },
    ...(user ? [
      { id: 'dashboard', label: t('nav.dashboard'), icon: LayoutDashboard },
      { id: 'reports', label: t('nav.reports'), icon: AlertCircle },
      { id: 'map', label: t('nav.map'), icon: MapIcon },
      { id: 'community', label: t('nav.community'), icon: Users },
      { id: 'awareness', label: t('nav.awareness'), icon: BookOpen },
    ] : [])
  ];

  const unreadCount = notifications.filter(n => !n.read_status).length;

  return (
    <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center gap-2">
              <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white font-bold">C</div>
              <span className="text-xl font-bold text-gray-900 dark:text-white hidden sm:block">Clean <span className="text-emerald-600">Madurai</span></span>
            </div>
            <div className="hidden md:ml-8 md:flex md:space-x-4">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                    activeTab === item.id 
                      ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400' 
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  <item.icon size={18} />
                  {item.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-4">
            {/* Theme Toggle */}
            <button 
              onClick={toggleTheme} 
              className="p-2 text-gray-400 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-400 transition-colors"
              title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            >
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>

            {/* Language Toggle */}
            <button 
              onClick={() => setLanguage(language === 'en' ? 'ta' : 'en')} 
              className="p-2 text-gray-400 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-400 transition-colors flex items-center gap-1"
              title={language === 'en' ? 'Switch to Tamil' : 'Switch to English'}
            >
              <Languages size={20} />
              <span className="text-xs font-bold">{language.toUpperCase()}</span>
            </button>

            {user && (
              <div className="relative">
                <button onClick={() => setShowNotifs(!showNotifs)} className="p-2 text-gray-400 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-400 relative">
                  <Bell size={20} />
                  {unreadCount > 0 && <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] flex items-center justify-center rounded-full">{unreadCount}</span>}
                </button>
                <AnimatePresence>
                  {showNotifs && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-xl rounded-xl overflow-hidden z-50">
                      <div className="p-3 border-b border-gray-50 dark:border-gray-700 font-bold text-sm text-gray-900 dark:text-white">Notifications</div>
                      <div className="max-h-64 overflow-y-auto">
                        {notifications.length === 0 ? <div className="p-4 text-center text-xs text-gray-400 dark:text-gray-500">No notifications</div> : notifications.map(n => (
                          <div key={n.id} className={`p-3 text-xs border-b border-gray-50 dark:border-gray-700 last:border-0 flex justify-between items-start gap-2 ${!n.read_status ? 'bg-emerald-50 dark:bg-emerald-900/10' : 'text-gray-600 dark:text-gray-300'}`}>
                            <span className="flex-1">{n.message}</span>
                            {!n.read_status && <button onClick={() => markAsRead(n.id)} className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold hover:underline shrink-0">Read</button>}
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
            {user ? (
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{user.name}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">{user.role}</span>
                </div>
                <button onClick={onLogout} className="p-2 text-gray-400 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors"><LogOut size={20} /></button>
              </div>
            ) : (
              <button onClick={() => setActiveTab('login')} className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors">{t('nav.login')}</button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

const OfficerNavbar = ({ user, onLogout, activeTab, setActiveTab, notifications, markAsRead }: { user: User | null, onLogout: () => void, activeTab: string, setActiveTab: (t: string) => void, notifications: any[], markAsRead: (id: number) => void }) => {
  const [showNotifs, setShowNotifs] = useState(false);
  const { language, setLanguage, theme, toggleTheme, t } = useSettings();

  const navItems = [
    { id: 'home', label: t('nav.home'), icon: Home },
    { id: 'dashboard', label: t('nav.ward_overview'), icon: LayoutDashboard },
    { id: 'reports', label: t('nav.manage_reports'), icon: AlertCircle },
    { id: 'map', label: t('nav.map'), icon: MapIcon },
    { id: 'community', label: t('nav.community'), icon: Users },
    { id: 'awareness', label: t('nav.awareness'), icon: BookOpen },
    { id: 'analytics', label: t('nav.ward_analytics'), icon: BarChart3 },
  ];

  const unreadCount = notifications.filter(n => !n.read_status).length;

  return (
    <nav className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 sticky top-0 z-50 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">O</div>
              <span className="text-xl font-bold text-gray-900 dark:text-white hidden sm:block">Officer <span className="text-blue-600 dark:text-blue-400">Portal</span></span>
            </div>
            <div className="hidden md:ml-8 md:flex md:space-x-4">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                    activeTab === item.id 
                      ? 'bg-blue-50 dark:bg-slate-800 text-blue-700 dark:text-blue-400' 
                      : 'text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <item.icon size={18} />
                  {item.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-4">
            {/* Theme Toggle */}
            <button 
              onClick={toggleTheme} 
              className="p-2 text-gray-400 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-colors"
              title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            >
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>

            {/* Language Toggle */}
            <button 
              onClick={() => setLanguage(language === 'en' ? 'ta' : 'en')} 
              className="p-2 text-gray-400 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-colors flex items-center gap-1"
              title={language === 'en' ? 'Switch to Tamil' : 'Switch to English'}
            >
              <Languages size={20} />
              <span className="text-xs font-bold">{language.toUpperCase()}</span>
            </button>

            <div className="relative">
              <button onClick={() => setShowNotifs(!showNotifs)} className="p-2 text-gray-400 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 relative">
                <Bell size={20} />
                {unreadCount > 0 && <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] flex items-center justify-center rounded-full">{unreadCount}</span>}
              </button>
              <AnimatePresence>
                {showNotifs && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 shadow-xl rounded-xl overflow-hidden z-50">
                    <div className="p-3 border-b border-gray-100 dark:border-slate-700 font-bold text-sm text-gray-900 dark:text-white">Ward Alerts</div>
                    <div className="max-h-64 overflow-y-auto">
                      {notifications.length === 0 ? <div className="p-4 text-center text-xs text-gray-500 dark:text-slate-500">No new alerts</div> : notifications.map(n => (
                        <div key={n.id} className={`p-3 text-xs border-b border-gray-100 dark:border-slate-700 last:border-0 flex justify-between items-start gap-2 ${!n.read_status ? 'bg-blue-50 dark:bg-blue-900/30' : 'text-gray-600 dark:text-slate-300'}`}>
                          <span className="flex-1">{n.message}</span>
                          {!n.read_status && <button onClick={() => markAsRead(n.id)} className="text-[10px] text-blue-600 dark:text-blue-400 font-bold hover:underline shrink-0">Read</button>}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-sm font-medium text-gray-900 dark:text-white">{user?.name}</span>
                <span className="text-xs text-gray-500 dark:text-slate-400 capitalize">Ward {user?.ward_id} Officer</span>
              </div>
              <button onClick={onLogout} className="p-2 text-gray-400 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 transition-colors"><LogOut size={20} /></button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

const Dashboard = ({ user, activeTab }: { user: User | null, activeTab: string }) => {
  const [stats, setStats] = useState<any>(null);
  const isOfficer = user?.role === 'ward_officer' || user?.role === 'admin' || user?.role === 'volunteer';
  const { t, theme } = useSettings();

  useEffect(() => {
    fetch('/api/analytics/overview')
      .then(res => res.json())
      .then(data => setStats(data));
  }, []);

  if (!stats) return <div className="p-8 text-center text-gray-500 dark:text-gray-400">{t('common.loading')}</div>;

  const isDark = theme === 'dark';

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {t('dash.welcome')}, {user?.name || 'Citizen'}
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          {isOfficer ? `Monitoring Ward ${user?.ward_id} activities.` : "Here's what's happening in Madurai today."}
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: t('dash.stat.total'), value: stats.total, icon: AlertCircle, color: isOfficer ? 'text-blue-600 dark:text-blue-400' : 'text-emerald-600 dark:text-emerald-400', bg: isOfficer ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-emerald-50 dark:bg-emerald-900/20' },
          { label: t('dash.stat.resolved'), value: stats.resolved, icon: Award, color: isOfficer ? 'text-emerald-600 dark:text-emerald-400' : 'text-blue-600 dark:text-blue-400', bg: isOfficer ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-blue-50 dark:bg-blue-900/20' },
          { label: t('dash.stat.pending'), value: stats.pending, icon: Search, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20' },
          { label: 'Active Volunteers', value: '1,240', icon: Users, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/20' },
        ].map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm flex items-center gap-4 transition-colors"
          >
            <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
              <stat.icon size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-slate-400">{stat.label}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm transition-colors">
          <h3 className="text-lg font-bold mb-6 text-gray-900 dark:text-white">Reports by Category</h3>
          <div className="h-64">
            {activeTab === 'analytics' || activeTab === 'dashboard' ? (
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <BarChart data={stats.byCategory}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#334155' : '#e5e7eb'} />
                  <XAxis dataKey="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: isDark ? '#94a3b8' : '#6b7280' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: isDark ? '#94a3b8' : '#6b7280' }} />
                  <Tooltip 
                    contentStyle={{ 
                      borderRadius: '12px', 
                      border: 'none', 
                      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                      backgroundColor: isDark ? '#1e293b' : '#ffffff',
                      color: isDark ? '#f8fafc' : '#111827'
                    }}
                  />
                  <Bar dataKey="count" fill={isOfficer ? '#3b82f6' : '#10b981'} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : null}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm transition-colors">
          <h3 className="text-lg font-bold mb-6 text-gray-900 dark:text-white">Ward Performance</h3>
          <div className="h-64">
            {activeTab === 'analytics' || activeTab === 'dashboard' ? (
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <PieChart>
                  <Pie
                    data={stats.byWard}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="count"
                  >
                    {stats.byWard.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      borderRadius: '12px', 
                      border: 'none', 
                      backgroundColor: isDark ? '#1e293b' : '#ffffff',
                      color: isDark ? '#f8fafc' : '#111827'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

const FeedbackModal = ({ reportId, onClose }: { reportId: number, onClose: () => void }) => {
  const [rating, setRating] = useState(5);
  const [comments, setComments] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const token = localStorage.getItem('token');
    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ report_id: reportId, rating, comments })
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md shadow-xl">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Rate Resolution</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Rating (1-5)</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className={`p-2 rounded-lg flex-1 font-bold transition-colors ${rating >= star ? 'bg-yellow-400 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-400'}`}
                >
                  {star} ★
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Comments (Optional)</label>
            <textarea
              rows={3}
              value={comments}
              onChange={e => setComments(e.target.value)}
              className="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-gray-900 dark:text-white"
              placeholder="How was the issue handled?"
            />
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">Cancel</button>
            <button type="submit" disabled={submitting} className="px-6 py-2 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 disabled:opacity-50">Submit</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ReportList = ({ reports, onStatusUpdate, user }: { reports: Report[], onStatusUpdate: (id: number, s: string) => void, user: User | null }) => {
  const [feedbackReportId, setFeedbackReportId] = useState<number | null>(null);

  if (!reports || !Array.isArray(reports) || reports.length === 0) {
    return (
      <div className="bg-white p-12 rounded-2xl border border-dashed border-gray-300 text-center">
        <div className="w-12 h-12 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle size={24} />
        </div>
        <h3 className="text-lg font-bold text-gray-900">No reports found</h3>
        <p className="text-gray-500">Be the first to report a civic issue in your area.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {feedbackReportId && <FeedbackModal reportId={feedbackReportId} onClose={() => setFeedbackReportId(null)} />}
      {reports.map((report) => (
        <motion.div 
          layout
          key={report.id}
          className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${
                  report.urgency === 'critical' ? 'bg-red-100 text-red-700' :
                  report.urgency === 'high' ? 'bg-orange-100 text-orange-700' :
                  report.urgency === 'medium' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                }`}>
                  {report.urgency}
                </span>
                <span className="text-sm text-gray-500">• {report.category}</span>
              </div>
              <h4 className="text-lg font-bold text-gray-900">{report.ward_name}</h4>
              <p className="text-sm text-gray-500">Reported by {report.reporter_name} on {new Date(report.created_at).toLocaleDateString()}</p>
            </div>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              report.status === 'resolved' ? 'bg-emerald-100 text-emerald-700' :
              report.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
              report.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-700'
            }`}>
              {report.status.replace('_', ' ')}
            </div>
          </div>
          <p className="text-gray-700 mb-6">{report.description}</p>
          
          <div className="flex flex-wrap gap-2">
            {(user?.role === 'ward_officer' || user?.role === 'admin') && (
              <>
                {report.status === 'pending' && (
                  <button 
                    onClick={() => onStatusUpdate(report.id, 'verified')}
                    className="text-sm bg-purple-50 text-purple-700 px-4 py-2 rounded-lg font-medium hover:bg-purple-100 transition-colors"
                  >
                    Verify
                  </button>
                )}
                {(report.status === 'pending' || report.status === 'verified') && (
                  <button 
                    onClick={() => onStatusUpdate(report.id, 'in_progress')}
                    className="text-sm bg-blue-50 text-blue-700 px-4 py-2 rounded-lg font-medium hover:bg-blue-100 transition-colors"
                  >
                    Start Work
                  </button>
                )}
                {report.status === 'in_progress' && (
                  <button 
                    onClick={() => onStatusUpdate(report.id, 'resolved')}
                    className="text-sm bg-emerald-50 text-emerald-700 px-4 py-2 rounded-lg font-medium hover:bg-emerald-100 transition-colors"
                  >
                    Mark Resolved
                  </button>
                )}
                {report.status === 'resolved' && (
                  <button 
                    onClick={() => onStatusUpdate(report.id, 'closed')}
                    className="text-sm bg-gray-50 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors"
                  >
                    Close Case
                  </button>
                )}
              </>
            )}
            {user?.role === 'citizen' && (report.status === 'resolved' || report.status === 'closed') && (
              <button 
                onClick={() => setFeedbackReportId(report.id)}
                className="text-sm bg-yellow-50 text-yellow-700 px-4 py-2 rounded-lg font-medium hover:bg-yellow-100 transition-colors"
              >
                Rate Resolution
              </button>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
};

const ChangeView = ({ center }: { center: [number, number] }) => {
  const map = useMapEvents({});
  useEffect(() => {
    map.setView(center);
  }, [center, map]);
  return null;
};

const LocationPicker = ({ onLocationSelect, position }: { onLocationSelect: (lat: number, lng: number) => void, position: [number, number] }) => {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });

  return position ? <Marker position={position} /> : null;
};

const ReportForm = ({ onSuccess }: { onSuccess: () => void }) => {
  const [wards, setWards] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    category: CATEGORIES[0],
    urgency: 'medium',
    description: '',
    ward_id: 1,
    lat: 9.9252,
    lng: 78.1198
  });

  useEffect(() => {
    fetch('/api/wards').then(res => res.json()).then(setWards);
    
    // Try to get user's current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setFormData(prev => ({
            ...prev,
            lat: pos.coords.latitude,
            lng: pos.coords.longitude
          }));
        },
        (err) => console.error("Geolocation error:", err)
      );
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const res = await fetch('/api/reports', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(formData)
    });
    if (res.ok) {
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl border border-gray-100 shadow-xl space-y-6 max-h-[90vh] overflow-y-auto">
      <h2 className="text-xl font-bold text-gray-900">Report an Issue</h2>
      
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <label className="block text-sm font-medium text-gray-700">Pin Location on Map</label>
          <button 
            type="button"
            onClick={() => {
              if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition((pos) => {
                  setFormData(prev => ({ ...prev, lat: pos.coords.latitude, lng: pos.coords.longitude }));
                });
              }
            }}
            className="text-xs font-bold text-emerald-600 flex items-center gap-1 hover:underline"
          >
            <MapIcon size={14} />
            Use Current Location
          </button>
        </div>
        <div className="h-64 rounded-xl overflow-hidden border border-gray-200 z-0">
          <MapContainer center={[formData.lat, formData.lng]} zoom={15} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            <ChangeView center={[formData.lat, formData.lng]} />
            <LocationPicker 
              position={[formData.lat, formData.lng]} 
              onLocationSelect={(lat, lng) => setFormData({...formData, lat, lng})} 
            />
          </MapContainer>
        </div>
        <p className="text-xs text-gray-500 italic">Click on the map to set the exact location of the issue.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Ward</label>
          <select 
            value={formData.ward_id}
            onChange={e => setFormData({...formData, ward_id: parseInt(e.target.value)})}
            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
          >
            {wards.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <select 
            value={formData.category}
            onChange={e => setFormData({...formData, category: e.target.value})}
            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
          >
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Urgency</label>
        <select 
          value={formData.urgency}
          onChange={e => setFormData({...formData, urgency: e.target.value})}
          className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
        >
          {URGENCY_LEVELS.map(u => <option key={u} value={u}>{u.toUpperCase()}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea 
          required
          rows={4}
          value={formData.description}
          onChange={e => setFormData({...formData, description: e.target.value})}
          className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
          placeholder="Describe the issue in detail..."
        />
      </div>
      <div className="flex justify-end gap-3">
        <button 
          type="button"
          onClick={() => onSuccess()}
          className="px-6 py-3 text-gray-500 font-medium hover:text-gray-700"
        >
          Cancel
        </button>
        <button 
          type="submit"
          className="px-8 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200"
        >
          Submit Report
        </button>
      </div>
    </form>
  );
};

const AuthPage = ({ onLogin }: { onLogin: (u: User, t: string) => void }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [wards, setWards] = useState<any[]>([]);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'citizen', ward_id: 1 });
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/wards').then(res => res.json()).then(setWards);
  }, []);

  const { t } = useSettings();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    const data = await res.json();
    if (res.ok) {
      if (isLogin) {
        onLogin(data.user, data.token);
      } else {
        setIsLogin(true);
      }
    } else {
      setError(data.error);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-12">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-xl transition-colors">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{isLogin ? t('auth.login_title') : t('auth.register_title')}</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-8">{isLogin ? 'Login to manage your reports' : 'Register to help keep Madurai clean'}</p>
        
        {error && <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm mb-6">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('auth.name')}</label>
              <input 
                type="text" required
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                className="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('auth.email')}</label>
            <input 
              type="email" required
              value={formData.email}
              onChange={e => setFormData({...formData, email: e.target.value})}
              className="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('auth.password')}</label>
            <input 
              type="password" required
              value={formData.password}
              onChange={e => setFormData({...formData, password: e.target.value})}
              className="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
            />
          </div>
          {!isLogin && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">I am a...</label>
                <select 
                  value={formData.role}
                  onChange={e => setFormData({...formData, role: e.target.value})}
                  className="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-gray-900 dark:text-white"
                >
                  <option value="citizen">Citizen</option>
                  <option value="volunteer">Volunteer</option>
                  <option value="ward_officer">Ward Officer</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('auth.ward')}</label>
                <select 
                  value={formData.ward_id}
                  onChange={e => setFormData({...formData, ward_id: parseInt(e.target.value)})}
                  className="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-gray-900 dark:text-white"
                >
                  {wards.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
              </div>
            </>
          )}
          <button 
            type="submit"
            className="w-full py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors mt-4"
          >
            {isLogin ? t('auth.submit_login') : t('auth.submit_register')}
          </button>
        </form>
        
        <button 
          onClick={() => setIsLogin(!isLogin)}
          className="w-full text-center text-sm text-gray-500 dark:text-gray-400 mt-6 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
        >
          {isLogin ? t('auth.switch_register') : t('auth.switch_login')}
        </button>
      </div>
    </div>
  );
};

// --- Main App ---

function MainContent() {
  const [activeTab, setActiveTab] = useState('home');
  const [user, setUser] = useState<User | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [showReportForm, setShowReportForm] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) setUser(JSON.parse(savedUser));
  }, []);

  useEffect(() => {
    if (user) {
      const token = localStorage.getItem('token');
      fetch('/api/notifications', {
        headers: { 'Authorization': `Bearer ${token}` }
      }).then(res => res.json()).then(setNotifications);
    }
  }, [user]);

  const fetchReports = async () => {
    try {
      let url = '/api/reports';
      if (user?.role === 'ward_officer' && user.ward_id) {
        url += `?ward_id=${user.ward_id}`;
      }
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch reports');
      const data = await res.json();
      if (Array.isArray(data)) {
        setReports(data);
      } else {
        setReports([]);
      }
    } catch (err) {
      console.error(err);
      setReports([]);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [user]);

  const handleLogin = (u: User, token: string) => {
    setUser(u);
    localStorage.setItem('user', JSON.stringify(u));
    localStorage.setItem('token', token);
    setActiveTab(u.role === 'citizen' ? 'home' : 'dashboard');
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setActiveTab('home');
  };

  const updateReportStatus = async (id: number, status: string) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`/api/reports/${id}/status`, {
      method: 'PATCH',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ status })
    });
    if (res.ok) fetchReports();
  };

  const markAsRead = async (id: number) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`/api/notifications/${id}/read`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read_status: 1 } : n));
    }
  };

  const isOfficer = user?.role === 'ward_officer' || user?.role === 'admin' || user?.role === 'volunteer';

  return (
    <div className="min-h-screen transition-colors duration-300 bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-white font-sans">
      {isOfficer ? (
        <OfficerNavbar 
          user={user} 
          onLogout={handleLogout} 
          activeTab={activeTab} 
          setActiveTab={setActiveTab}
          notifications={notifications}
          markAsRead={markAsRead}
        />
      ) : (
        <CitizenNavbar 
          user={user} 
          onLogout={handleLogout} 
          activeTab={activeTab} 
          setActiveTab={setActiveTab}
          notifications={notifications}
          markAsRead={markAsRead}
        />
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          {activeTab === 'home' && (
            <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <LandingPage onReportClick={() => {
                if (!user) {
                  setActiveTab('login');
                } else {
                  setShowReportForm(true);
                }
              }} />
              {showReportForm && (
                <div className="mt-12">
                  <ReportForm onSuccess={() => {
                    setShowReportForm(false);
                    fetchReports();
                  }} />
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'dashboard' && (
            <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Dashboard user={user} activeTab={activeTab} />
            </motion.div>
          )}

          {activeTab === 'reports' && (
            <motion.div key="reports" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {isOfficer ? 'Ward Management' : 'Civic Reports'}
                </h2>
                {!isOfficer && (
                  <button 
                    onClick={() => {
                      if (!user) {
                        setActiveTab('login');
                      } else {
                        setShowReportForm(true);
                      }
                    }}
                    className="bg-emerald-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-emerald-700 transition-colors"
                  >
                    <PlusCircle size={20} />
                    {user ? 'Report Issue' : 'Login to Report'}
                  </button>
                )}
              </div>
              
              {showReportForm && (
                <div className="mt-6">
                  <ReportForm onSuccess={() => {
                    setShowReportForm(false);
                    fetchReports();
                  }} />
                </div>
              )}

              <ReportList 
                reports={reports} 
                onStatusUpdate={updateReportStatus} 
                user={user} 
              />
            </motion.div>
          )}

          {activeTab === 'login' && (
            <motion.div key="login" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <AuthPage onLogin={handleLogin} />
            </motion.div>
          )}

          {activeTab === 'map' && (
            <motion.div key="map" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Smart Issue Map</h2>
              <SmartMap reports={reports} />
            </motion.div>
          )}

          {activeTab === 'community' && (
            <motion.div key="community" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Community user={user} setActiveTab={setActiveTab} />
            </motion.div>
          )}

          {activeTab === 'awareness' && (
            <motion.div key="awareness" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Awareness />
            </motion.div>
          )}

          {activeTab === 'analytics' && (
            <motion.div key="analytics" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Dashboard user={user} activeTab={activeTab} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {!isOfficer && <CivicAssistant />}

      <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 py-12 mt-12 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-500 dark:text-gray-400 text-sm">© 2026 Clean Madurai – Smart Civic Intelligence Platform</p>
          <div className="flex justify-center gap-6 mt-4">
            <a href="#" className="text-gray-400 hover:text-emerald-600 dark:text-gray-500 dark:hover:text-emerald-400">Privacy Policy</a>
            <a href="#" className="text-gray-400 hover:text-emerald-600 dark:text-gray-500 dark:hover:text-emerald-400">Terms of Service</a>
            <a href="#" className="text-gray-400 hover:text-emerald-600 dark:text-gray-500 dark:hover:text-emerald-400">Contact Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <SettingsProvider>
      <MainContent />
    </SettingsProvider>
  );
}
