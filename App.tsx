import React, { useState, useEffect } from 'react';
import { DailyAnalysis, TabView, ActivityData, NutritionData, JournalData } from './types';
import Dashboard from './components/Dashboard';
import NutritionTracker from './components/NutritionTracker';
import VoiceJournal from './components/VoiceJournal';
import ActivityLog from './components/ActivityLog';
import { generateWellnessRecommendations } from './services/geminiService';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabView>(TabView.DASHBOARD);
  
  // App State
  const [activityData, setActivityData] = useState<ActivityData>({
    date: new Date().toISOString().split('T')[0],
    steps: 6500,
    sleepHours: 7.0,
    sleepQuality: 6,
    heartRateAvg: 72
  });

  const [nutritionHistory, setNutritionHistory] = useState<NutritionData[]>([]);
  const [journalHistory, setJournalHistory] = useState<JournalData[]>([]);
  
  const [report, setReport] = useState<DailyAnalysis>({
    nutrition: [],
    journal: [],
    activity: activityData,
    recommendations: [
      { category: 'DIET', title: 'Balanced Start', description: 'Log your meals to get personalized diet advice.', priority: 'MEDIUM' },
      { category: 'FITNESS', title: 'Get Moving', description: 'Aim for 8,000 steps today to improve circulation.', priority: 'LOW' }
    ],
    wellnessScore: 75 // Default start
  });

  const [loadingReport, setLoadingReport] = useState(false);

  // Trigger AI Report generation when data changes significantly
  useEffect(() => {
    // Debounce simply by using a timeout or just triggering on explicit actions.
    // For this demo, we'll trigger when returning to dashboard or adding data
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

    if (nutritionHistory.length > 0 || journalHistory.length > 0) {
      updateReport();
    }
  }, [nutritionHistory.length, journalHistory.length, activityData.sleepHours]);

  const handleNutritionAdd = (data: NutritionData) => {
    setNutritionHistory(prev => [...prev, data]);
  };

  const handleJournalAdd = (data: JournalData) => {
    setJournalHistory(prev => [...prev, data]);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-white border-r border-slate-200 flex-shrink-0 flex flex-col fixed md:relative bottom-0 z-50 md:h-screen shadow-lg md:shadow-none">
        <div className="p-6 hidden md:block">
          <h1 className="text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
            HealthGuard<span className="font-light text-slate-400">AI</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">Preventive Wellness System</p>
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
            label="Activity Log"
          />
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-8 overflow-y-auto pb-24 md:pb-8">
        <header className="flex justify-between items-center mb-8">
          <div>
             <h2 className="text-2xl font-bold text-slate-800">
               {activeTab === TabView.DASHBOARD && 'Wellness Overview'}
               {activeTab === TabView.NUTRITION && 'Nutrition Analysis'}
               {activeTab === TabView.JOURNAL && 'Daily Journal'}
               {activeTab === TabView.ACTIVITY && 'Activity Settings'}
             </h2>
             <p className="text-slate-500 text-sm">Today, {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</p>
          </div>
          <div className="flex items-center gap-3">
             {loadingReport && (
               <div className="flex items-center gap-2 text-indigo-600 text-sm font-medium bg-indigo-50 px-3 py-1 rounded-full animate-pulse">
                 <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>
                 Updating Insights...
               </div>
             )}
             <div className="h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold border-2 border-white shadow-sm">
               HG
             </div>
          </div>
        </header>

        {activeTab === TabView.DASHBOARD && <Dashboard data={report} onChangeTab={setActiveTab} />}
        {activeTab === TabView.NUTRITION && <NutritionTracker onAddEntry={handleNutritionAdd} entries={nutritionHistory} />}
        {activeTab === TabView.JOURNAL && <VoiceJournal onAddEntry={handleJournalAdd} entries={journalHistory} />}
        {activeTab === TabView.ACTIVITY && <ActivityLog initialData={activityData} onUpdate={(d) => setActivityData(d)} />}

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
