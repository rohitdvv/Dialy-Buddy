import React, { useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, AreaChart, Area
} from 'recharts';
import { DailyAnalysis, TabView } from '../types';

interface DashboardProps {
  data: DailyAnalysis;
  onChangeTab: (tab: TabView) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ data, onChangeTab }) => {
  
  // Mock trend data for charts (since we don't have a backend DB for history)
  const activityTrend = useMemo(() => [
    { day: 'Mon', steps: 6500, sleep: 6.5, stress: 4 },
    { day: 'Tue', steps: 8200, sleep: 7.2, stress: 3 },
    { day: 'Wed', steps: 4500, sleep: 5.8, stress: 7 },
    { day: 'Thu', steps: 9000, sleep: 7.0, stress: 5 },
    { day: 'Fri', steps: 7200, sleep: 6.8, stress: 4 },
    { day: 'Sat', steps: 11000, sleep: 8.5, stress: 2 },
    { day: 'Sun', steps: data.activity.steps, sleep: data.activity.sleepHours, stress: data.journal.length > 0 ? data.journal[data.journal.length -1].stressLevel : 3 },
  ], [data]);

  return (
    <div className="space-y-6">
      {/* Top Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="absolute right-0 top-0 w-24 h-24 bg-gradient-to-br from-indigo-500/10 to-transparent rounded-bl-full -mr-4 -mt-4" />
          <p className="text-slate-500 text-sm font-medium">Wellness Score</p>
          <div className="flex items-end gap-2 mt-1">
             <span className="text-4xl font-bold text-slate-800">{data.wellnessScore}</span>
             <span className="text-sm text-slate-400 mb-1">/ 100</span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full mt-3 overflow-hidden">
            <div className="bg-indigo-600 h-full rounded-full transition-all duration-1000" style={{ width: `${data.wellnessScore}%` }}></div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-slate-500 text-sm font-medium">Calories Consumed</p>
          <div className="mt-1">
             <span className="text-3xl font-bold text-slate-800">
               {data.nutrition.reduce((acc, curr) => acc + curr.calories, 0)}
             </span>
             <span className="text-xs text-slate-400 ml-1">kcal</span>
          </div>
          <button onClick={() => onChangeTab(TabView.NUTRITION)} className="text-xs text-indigo-600 font-medium mt-2 hover:underline">Log Meal &rarr;</button>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
           <p className="text-slate-500 text-sm font-medium">Stress Level</p>
           <div className="mt-1 flex items-center gap-2">
             <span className={`text-3xl font-bold ${
               (data.journal[data.journal.length - 1]?.stressLevel || 0) > 6 ? 'text-red-500' : 'text-green-500'
             }`}>
               {data.journal.length > 0 ? data.journal[data.journal.length - 1].stressLevel : '-'}
             </span>
             <span className="text-xs text-slate-400">/ 10</span>
           </div>
            <button onClick={() => onChangeTab(TabView.JOURNAL)} className="text-xs text-indigo-600 font-medium mt-2 hover:underline">Record Voice Note &rarr;</button>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
           <p className="text-slate-500 text-sm font-medium">Sleep Duration</p>
           <div className="mt-1">
             <span className="text-3xl font-bold text-slate-800">{data.activity.sleepHours}</span>
             <span className="text-xs text-slate-400 ml-1">hrs</span>
           </div>
           <p className="text-xs text-slate-400 mt-2">Quality: {data.activity.sleepQuality}/10</p>
        </div>
      </div>

      {/* Main Charts Area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Activity Trend */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-4">Activity & Sleep Trends</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={activityTrend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                <YAxis yAxisId="left" orientation="left" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}}
                />
                <Bar yAxisId="left" dataKey="steps" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={20} name="Steps" />
                <Line yAxisId="right" type="monotone" dataKey="sleep" stroke="#10b981" strokeWidth={3} dot={{r: 4}} name="Sleep (h)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Stress & Mood Analysis */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-4">Emotional Stress Pattern</h3>
          <div className="h-64">
             <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activityTrend}>
                <defs>
                  <linearGradient id="colorStress" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} domain={[0, 10]} />
                <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}} />
                <Area type="monotone" dataKey="stress" stroke="#f43f5e" strokeWidth={3} fillOpacity={1} fill="url(#colorStress)" name="Stress Level" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* AI Recommendations */}
      <div className="bg-slate-900 text-white rounded-xl shadow-lg p-6 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 -mr-16 -mt-16 animate-pulse"></div>
        
        <h3 className="text-xl font-bold mb-6 flex items-center gap-2 relative z-10">
          <span className="bg-indigo-500 p-1 rounded">AI</span> HealthGuard Insights
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
          {data.recommendations.map((rec, idx) => (
             <div key={idx} className="bg-white/10 backdrop-blur-sm p-4 rounded-lg border border-white/10 hover:bg-white/15 transition-colors">
                <div className="flex justify-between items-start mb-2">
                   <span className={`text-xs font-bold px-2 py-1 rounded uppercase tracking-wider ${
                     rec.category === 'DIET' ? 'bg-green-500/20 text-green-300' :
                     rec.category === 'FITNESS' ? 'bg-blue-500/20 text-blue-300' :
                     rec.category === 'STRESS' ? 'bg-rose-500/20 text-rose-300' :
                     'bg-purple-500/20 text-purple-300'
                   }`}>{rec.category}</span>
                   {rec.priority === 'HIGH' && (
                     <span className="text-xs text-orange-400 flex items-center gap-1">
                       ⚠ Important
                     </span>
                   )}
                </div>
                <h4 className="font-bold text-lg mb-1">{rec.title}</h4>
                <p className="text-slate-300 text-sm leading-relaxed">{rec.description}</p>
             </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
