
import React, { useState, useEffect, useRef } from 'react';
import { DailyAnalysis, TabView, ActivityData, NutritionData, JournalData, User, DeviceConnection, ChatMessage } from './types';
import Dashboard from './components/Dashboard';
import NutritionTracker from './components/NutritionTracker';
import VoiceJournal from './components/VoiceJournal';
import ActivityLog from './components/ActivityLog';
import AIChat from './components/AIChat';
import AuthScreen from './components/AuthScreen';
import NightlyCheckIn from './components/NightlyCheckIn';
import Guide from './components/Guide';
import { generateWellnessRecommendations } from './services/geminiService';

const App: React.FC = () => {
  const notificationTimeoutRef = useRef<number | null>(null);

  // Auth State
  const [user, setUser] = useState<User | null>(null);

  // UI State
  const [activeTab, setActiveTab] = useState<TabView>(TabView.DASHBOARD);
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [notification, setNotification] = useState<{message: string, type: 'ALERT' | 'INFO'} | null>(null);
  
  // Data State
  const [activityData, setActivityData] = useState<ActivityData>({
    date: new Date().toISOString().split('T')[0],
    steps: 6500,
    sleepHours: 7.0,
    sleepQuality: 6,
    heartRateAvg: 72,
    caloriesBurned: 1800
  });

  const [nutritionHistory, setNutritionHistory] = useState<NutritionData[]>([]);
  const [journalHistory, setJournalHistory] = useState<JournalData[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  
  // Device Integration State
  const [connectedDevices, setConnectedDevices] = useState<DeviceConnection[]>([]);

  const [report, setReport] = useState<DailyAnalysis>({
    nutrition: [],
    journal: [],
    activity: activityData,
    recommendations: [
      { category: 'DIET', title: 'Balanced Start', description: 'Log your meals to get personalized diet advice.', priority: 'MEDIUM' },
      { category: 'FITNESS', title: 'Get Moving', description: 'Aim for 8,000 steps today to improve circulation.', priority: 'LOW' }
    ],
    wellnessScore: 75
  });

  const [loadingReport, setLoadingReport] = useState(false);

  // --- INITIALIZATION & PERSISTENCE ---

  const readStorage = <T,>(key: string, fallback: T): T => {
    const value = localStorage.getItem(key);
    if (!value) return fallback;

    try {
      return JSON.parse(value) as T;
    } catch {
      console.warn(`Invalid localStorage data for key: ${key}`);
      return fallback;
    }
  };

  const showTimedNotification = (message: string, type: 'ALERT' | 'INFO', durationMs = 3000) => {
    if (notificationTimeoutRef.current) {
      window.clearTimeout(notificationTimeoutRef.current);
    }

    setNotification({ message, type });
    notificationTimeoutRef.current = window.setTimeout(() => {
      setNotification(null);
      notificationTimeoutRef.current = null;
    }, durationMs);
  };

  useEffect(() => {
    // Load User
    setUser(readStorage<User | null>('hg_user', null));

    // Load Data
    setJournalHistory(readStorage<JournalData[]>('hg_journal', []));
    setNutritionHistory(readStorage<NutritionData[]>('hg_nutrition', []));
    setChatHistory(readStorage<ChatMessage[]>('hg_chat', []));
    
    // Load Devices
    setConnectedDevices(readStorage<DeviceConnection[]>('hg_devices', []));

  }, []);

  useEffect(() => {
    // Persist Data on Change
    localStorage.setItem('hg_journal', JSON.stringify(journalHistory));
    localStorage.setItem('hg_nutrition', JSON.stringify(nutritionHistory));
    localStorage.setItem('hg_chat', JSON.stringify(chatHistory));
    localStorage.setItem('hg_devices', JSON.stringify(connectedDevices));
  }, [journalHistory, nutritionHistory, chatHistory, connectedDevices]);

  useEffect(() => {
    return () => {
      if (notificationTimeoutRef.current) {
        window.clearTimeout(notificationTimeoutRef.current);
      }
    };
  }, []);

  // --- DEVICE SIMULATION (LIVE UPDATES) ---
  useEffect(() => {
    // If a cloud device (like Fitbit) is connected, simulate live step counts
    const cloudDevice = connectedDevices.find(d => d.type === 'CLOUD' && d.status === 'CONNECTED');
    
    if (cloudDevice) {
      const interval = setInterval(() => {
        setActivityData(prev => ({
          ...prev,
          steps: prev.steps + Math.floor(Math.random() * 15), // Add 0-15 steps
          caloriesBurned: prev.caloriesBurned + 1 // Burn 1 cal slowly
        }));
      }, 5000); // Every 5 seconds

      return () => clearInterval(interval);
    }
  }, [connectedDevices]);

  // --- NIGHTLY CHECK-IN TIMER ---

  useEffect(() => {
    if (!user) return;

    const checkTime = () => {
      const now = new Date();
      // Check if it is 10 PM (22:00)
      if (now.getHours() === 22 && now.getMinutes() === 0) {
        // Check if we already did check-in today
        const lastCheckIn = localStorage.getItem('hg_last_checkin');
        const todayStr = now.toDateString();
        
        if (lastCheckIn !== todayStr) {
          setShowCheckIn(true);
        }
      }
    };

    const timer = setInterval(checkTime, 60000); // Check every minute
    return () => clearInterval(timer);
  }, [user]);

  // --- LOGIC ---

  const handleLogin = (newUser: User) => {
    setUser(newUser);
    localStorage.setItem('hg_user', JSON.stringify(newUser));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('hg_user');
    // Optional: Clear other data or keep it
  };

  const handleNutritionAdd = (data: NutritionData) => {
    setNutritionHistory(prev => [...prev, data]);
  };

  const handleJournalAdd = (data: JournalData) => {
    setJournalHistory(prev => [...prev, data]);
    
    // Immediate AI Notification Logic
    if (data.stressLevel >= 7 || data.sentimentScore < -0.3) {
      showTimedNotification(
        `High stress detected in your entry. Analysis suggests: ${data.mood.toLowerCase()}. Try a 2-minute breathing exercise.`,
        'ALERT',
        8000
      );
    } else if (data.sentimentScore > 0.5) {
      showTimedNotification(
        `Great to see you in a ${data.mood.toLowerCase()} mood! Keep up the positive momentum.`,
        'INFO',
        8000
      );
    }
  };

  const handleChatSend = (text: string, role: 'user' | 'model') => {
    const newMessage: ChatMessage = {
      id: Date.now().toString() + Math.random().toString(),
      role,
      text,
      timestamp: new Date().toISOString()
    };
    setChatHistory(prev => [...prev, newMessage]);
  };

  const handleCheckInSubmit = (data: { stressLevel: number; sleepHours: number; caloriesBurned: number }) => {
    setActivityData(prev => ({
      ...prev,
      sleepHours: data.sleepHours,
      caloriesBurned: data.caloriesBurned
    }));
    
    // Add a simple journal entry for the stress score if strict
    const checkInJournal: JournalData = {
      mood: 'Evening Check-in',
      stressLevel: data.stressLevel,
      sentimentScore: 0,
      keyTopics: ['Check-in'],
      summary: `End of day check-in. Stress level: ${data.stressLevel}/10`,
      timestamp: new Date().toISOString()
    };
    handleJournalAdd(checkInJournal);

    localStorage.setItem('hg_last_checkin', new Date().toDateString());
    setShowCheckIn(false);
  };

  // Device Handlers
  const handleConnectDevice = (device: DeviceConnection) => {
    setConnectedDevices(prev => [...prev.filter(d => d.id !== device.id), device]);
    showTimedNotification(`${device.name} connected successfully.`, 'INFO');
  };

  const handleDisconnectDevice = (id: string) => {
    setConnectedDevices(prev => prev.filter(d => d.id !== id));
    showTimedNotification('Device disconnected.', 'INFO');
  };

  const handleBluetoothData = (hr: number) => {
    setActivityData(prev => ({ ...prev, heartRateAvg: hr }));
  };


  // Trigger AI Report generation
  useEffect(() => {
    const updateReport = async () => {
      setLoadingReport(true);
      try {
        const insights = await generateWellnessRecommendations(nutritionHistory, journalHistory, activityData);
        setReport({
          nutrition: nutritionHistory,
          journal: journalHistory,
          activity: activityData,
          recommendations: insights.recommendations,
          wellnessScore: insights.wellnessScore
        });
      } catch (e) {
        console.error("Failed to update report");
      } finally {
        setLoadingReport(false);
      }
    };

    if (user && (nutritionHistory.length > 0 || journalHistory.length > 0)) {
      updateReport();
    }
  }, [nutritionHistory, journalHistory, activityData, user]);

  // --- RENDER ---

  if (!user) {
    return <AuthScreen onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row relative">
      
      {/* Notification Toast */}
      {notification && (
        <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-[60] px-6 py-4 rounded-xl shadow-2xl flex items-center gap-4 animate-in slide-in-from-top-4 ${
          notification.type === 'ALERT' ? 'bg-red-500 text-white' : 'bg-indigo-600 text-white'
        }`}>
          <div className="bg-white/20 p-2 rounded-full">
            {notification.type === 'ALERT' ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </div>
          <div>
            <h4 className="font-bold text-sm uppercase opacity-90">{notification.type === 'ALERT' ? 'Wellness Alert' : 'Insight'}</h4>
            <p className="text-sm font-medium">{notification.message}</p>
          </div>
          <button onClick={() => setNotification(null)} className="ml-4 hover:bg-white/20 rounded-full p-1">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
             </svg>
          </button>
        </div>
      )}

      {/* Nightly Check-In Modal */}
      <NightlyCheckIn 
        isOpen={showCheckIn} 
        onClose={() => setShowCheckIn(false)} 
        onSubmit={handleCheckInSubmit} 
      />

      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-white border-r border-slate-200 flex-shrink-0 flex flex-col fixed md:relative bottom-0 z-40 md:h-screen shadow-lg md:shadow-none">
        <div className="p-6 hidden md:block">
          <h1 className="text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
            HealthGuard<span className="font-light text-slate-400">AI</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">Preventive Wellness System</p>
        </div>

        <div className="p-4 md:hidden flex justify-between items-center bg-white border-b border-slate-100">
           <span className="font-bold text-indigo-600">HealthGuardAI</span>
           <button onClick={handleLogout} className="text-xs text-red-500 font-medium">Log Out</button>
        </div>

        <nav className="flex-1 px-4 py-2 md:py-4 flex md:flex-col justify-around md:justify-start gap-1">
          <NavButton 
            active={activeTab === TabView.DASHBOARD} 
            onClick={() => setActiveTab(TabView.DASHBOARD)}
            icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>}
            label="Dashboard"
          />
          <NavButton 
            active={activeTab === TabView.NUTRITION} 
            onClick={() => setActiveTab(TabView.NUTRITION)}
            icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>}
            label="Nutrition"
          />
          <NavButton 
            active={activeTab === TabView.JOURNAL} 
            onClick={() => setActiveTab(TabView.JOURNAL)}
            icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>}
            label="Voice Journal"
          />
           <NavButton 
            active={activeTab === TabView.ACTIVITY} 
            onClick={() => setActiveTab(TabView.ACTIVITY)}
            icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
            label="Activity & Devices"
          />
           <NavButton 
            active={activeTab === TabView.CHAT} 
            onClick={() => setActiveTab(TabView.CHAT)}
            icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>}
            label="AI Chat"
          />
          <NavButton 
            active={activeTab === TabView.GUIDE} 
            onClick={() => setActiveTab(TabView.GUIDE)}
            icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
            label="How to Use"
          />
        </nav>

        <div className="p-4 hidden md:block border-t border-slate-100">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 text-slate-500 hover:text-red-500 transition-colors w-full px-4 py-2"
          >
             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
             </svg>
             <span className="text-sm font-medium">Log Out</span>
          </button>
          
          {/* Debug Button to test Check-In */}
          <button 
            onClick={() => setShowCheckIn(true)}
            className="mt-2 text-xs text-indigo-400 hover:text-indigo-600 underline w-full text-left px-4"
          >
            Debug: Test 10PM Check-in
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-8 overflow-y-auto pb-24 md:pb-8">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">
              {activeTab === TabView.DASHBOARD && 'Wellness Overview'}
              {activeTab === TabView.NUTRITION && 'Nutrition Analysis'}
              {activeTab === TabView.JOURNAL && 'Daily Journal'}
              {activeTab === TabView.ACTIVITY && 'Activity & Device Integration'}
              {activeTab === TabView.CHAT && 'AI Companion'}
              {activeTab === TabView.GUIDE && 'Help & Guide'}
            </h2>
            <p className="text-slate-500 text-sm">
                Welcome back, <span className="font-semibold text-indigo-600">{user.name}</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            {loadingReport && (
              <div className="flex items-center gap-2 text-indigo-600 text-sm font-medium bg-indigo-50 px-3 py-1 rounded-full animate-pulse">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>
                Updating Insights...
              </div>
            )}
            <div className="h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold border-2 border-white shadow-sm">
              {user.name.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {activeTab === TabView.DASHBOARD && <Dashboard data={report} onChangeTab={setActiveTab} />}
        {activeTab === TabView.NUTRITION && <NutritionTracker onAddEntry={handleNutritionAdd} entries={nutritionHistory} />}
        {activeTab === TabView.JOURNAL && <VoiceJournal onAddEntry={handleJournalAdd} entries={journalHistory} />}
        {activeTab === TabView.ACTIVITY && (
          <ActivityLog 
            initialData={activityData} 
            onUpdate={(d) => setActivityData(d)} 
            connections={connectedDevices}
            onConnectDevice={handleConnectDevice}
            onDisconnectDevice={handleDisconnectDevice}
            onBluetoothData={handleBluetoothData}
          />
        )}
        {activeTab === TabView.CHAT && <AIChat messages={chatHistory} onSendMessage={handleChatSend} />}
        {activeTab === TabView.GUIDE && <Guide />}

      </main>
    </div>
  );
};

// Simple Nav Button Component
const NavButton = ({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) => (
  <button 
    onClick={onClick}
    className={`flex flex-col md:flex-row items-center md:gap-3 p-2 md:px-4 md:py-3 rounded-xl transition-all ${
      active 
        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' 
        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
    }`}
  >
    <div className={active ? 'text-white' : 'text-slate-400'}>{icon}</div>
    <span className="text-[10px] md:text-sm font-medium mt-1 md:mt-0">{label}</span>
  </button>
);

export default App;
