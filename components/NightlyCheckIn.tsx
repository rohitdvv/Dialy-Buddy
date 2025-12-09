import React, { useState } from 'react';

interface NightlyCheckInProps {
  isOpen: boolean;
  onSubmit: (data: { stressLevel: number; sleepHours: number; caloriesBurned: number }) => void;
  onClose: () => void;
}

const NightlyCheckIn: React.FC<NightlyCheckInProps> = ({ isOpen, onSubmit, onClose }) => {
  const [stress, setStress] = useState(5);
  const [sleep, setSleep] = useState(7);
  const [calories, setCalories] = useState(2000);

  if (!isOpen) return null;

  const handleSubmit = () => {
    onSubmit({
      stressLevel: stress,
      sleepHours: sleep,
      caloriesBurned: calories
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden">
        <div className="bg-indigo-600 p-6 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="text-2xl">🌙</span> Nightly Check-In
            </h2>
            <p className="text-indigo-200 text-sm">It's 10 PM. Let's wrap up your day.</p>
          </div>
          <button onClick={onClose} className="text-white/50 hover:text-white">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-8 space-y-8">
          
          {/* Stress */}
          <div className="space-y-3">
            <label className="flex justify-between text-slate-700 dark:text-slate-200 font-medium">
              <span>Overall Day Stress</span>
              <span className={`px-2 py-0.5 rounded text-sm ${stress > 7 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                {stress}/10
              </span>
            </label>
            <input 
              type="range" 
              min="1" 
              max="10" 
              step="1" 
              value={stress}
              onChange={(e) => setStress(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
            <div className="flex justify-between text-xs text-slate-400">
              <span>Zen</span>
              <span>Stressed</span>
            </div>
          </div>

          {/* Sleep */}
          <div className="space-y-3">
            <label className="text-slate-700 dark:text-slate-200 font-medium">Estimated Sleep Last Night (Hours)</label>
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setSleep(Math.max(0, sleep - 0.5))}
                className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-white hover:bg-slate-200"
              >
                -
              </button>
              <span className="text-2xl font-bold text-slate-800 dark:text-white w-16 text-center">{sleep}</span>
              <button 
                 onClick={() => setSleep(Math.min(16, sleep + 0.5))}
                 className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-white hover:bg-slate-200"
              >
                +
              </button>
            </div>
          </div>

          {/* Calories */}
          <div className="space-y-3">
            <label className="text-slate-700 dark:text-slate-200 font-medium">Active Calories Burned</label>
            <input 
              type="number" 
              value={calories}
              onChange={(e) => setCalories(parseInt(e.target.value) || 0)}
              className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <button 
            onClick={handleSubmit}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-500/30 transition-all transform hover:scale-[1.02]"
          >
            Save & Generate Insights
          </button>

        </div>
      </div>
    </div>
  );
};

export default NightlyCheckIn;