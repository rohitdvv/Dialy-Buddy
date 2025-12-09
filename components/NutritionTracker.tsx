
import React, { useState, useMemo } from 'react';
import { NutritionData } from '../types';
import { analyzeFoodImage } from '../services/geminiService';

interface NutritionTrackerProps {
  onAddEntry: (entry: NutritionData) => void;
  entries: NutritionData[];
}

const NutritionTracker: React.FC<NutritionTrackerProps> = ({ onAddEntry, entries }) => {
  const [analyzing, setAnalyzing] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toLocaleDateString());

  // Group entries by date
  const groupedEntries = useMemo(() => {
    const groups: Record<string, NutritionData[]> = {};
    const today = new Date().toLocaleDateString();
    
    // Ensure "Today" exists even if empty
    groups[today] = [];

    entries.forEach(entry => {
      const dateKey = entry.timestamp 
        ? new Date(entry.timestamp).toLocaleDateString() 
        : today; // Fallback for old data
      
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(entry);
    });
    return groups;
  }, [entries]);

  // Get list of dates sorted new to old
  const dateKeys = useMemo(() => {
    return Object.keys(groupedEntries).sort((a, b) => {
      // Handle date sorting
      return new Date(b).getTime() - new Date(a).getTime();
    });
  }, [groupedEntries]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Analyze
    setAnalyzing(true);
    try {
      const base64Data = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.readAsDataURL(file);
        r.onload = () => resolve((r.result as string).split(',')[1]);
        r.onerror = (error) => reject(error);
      });

      const analysis = await analyzeFoodImage(base64Data, file.type);
      
      // Inject timestamp here
      const fullEntry: NutritionData = {
        ...analysis,
        timestamp: new Date().toISOString()
      };

      onAddEntry(fullEntry);
      setPreview(null); // Clear preview after successful add
      // Force selection to today
      setSelectedDate(new Date().toLocaleDateString());
    } catch (err) {
      alert("Failed to analyze image. Please try again.");
    } finally {
      setAnalyzing(false);
    }
  };

  const isToday = (dateStr: string) => {
    return dateStr === new Date().toLocaleDateString();
  };

  return (
    <div className="flex flex-col md:flex-row h-full gap-6">
      
      {/* Left Sidebar - Date Folders */}
      <div className="w-full md:w-64 flex-shrink-0 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden h-fit">
        <div className="p-4 bg-slate-50 border-b border-slate-100">
           <h3 className="font-bold text-slate-800 flex items-center gap-2">
             <span className="text-xl">📂</span> Meal Logs
           </h3>
        </div>
        <div className="p-2 space-y-1">
          {dateKeys.map(date => (
            <button
              key={date}
              onClick={() => setSelectedDate(date)}
              className={`w-full text-left px-4 py-3 rounded-lg flex items-center justify-between transition-all ${
                selectedDate === date 
                  ? 'bg-indigo-600 text-white shadow-md' 
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 opacity-70" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4l2 2h6a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
                </svg>
                <span className="font-medium text-sm">
                  {isToday(date) ? 'Today' : date}
                </span>
              </div>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                selectedDate === date ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
              }`}>
                {groupedEntries[date]?.length || 0}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 space-y-6">
        
        {/* Header for Selected Date */}
        <div className="flex items-center justify-between">
           <h2 className="text-2xl font-bold text-slate-800">
             {isToday(selectedDate) ? "Today's Meals" : `Meals for ${selectedDate}`}
           </h2>
           <span className="text-sm text-slate-500">
              Total: {groupedEntries[selectedDate]?.reduce((acc, curr) => acc + curr.calories, 0) || 0} kcal
           </span>
        </div>

        {/* Upload Section - Only visible if viewing Today */}
        {isToday(selectedDate) && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add New Meal
            </h3>
            
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:bg-slate-50 transition-colors relative">
               {preview ? (
                  <div className="relative">
                    <img src={preview} alt="Preview" className="w-full h-48 object-cover rounded-lg" />
                    {analyzing && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                        <div className="text-white font-semibold animate-pulse">Analyzing with Gemini...</div>
                      </div>
                    )}
                  </div>
               ) : (
                 <div className="py-4">
                  <div className="mx-auto h-12 w-12 text-slate-400 mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <p className="text-slate-500 text-sm mb-2">Take a photo of your food</p>
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleFileChange} 
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    disabled={analyzing}
                  />
                  <button className="bg-indigo-50 text-indigo-600 px-4 py-2 rounded-md font-medium text-sm pointer-events-none">
                    Select Image
                  </button>
                 </div>
               )}
            </div>
          </div>
        )}

        {/* Entries List */}
        <div className="grid gap-4">
           {!groupedEntries[selectedDate] || groupedEntries[selectedDate].length === 0 ? (
             <div className="text-center text-slate-400 py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
               Folder is empty.
             </div>
           ) : (
             groupedEntries[selectedDate].map((entry, idx) => (
               <div key={idx} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <h4 className="font-bold text-slate-800 text-lg capitalize">{entry.foodName}</h4>
                      <div className="text-right">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                          entry.healthScore > 80 ? 'bg-green-100 text-green-700' :
                          entry.healthScore > 50 ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>Score: {entry.healthScore}</span>
                        <div className="text-xs text-slate-400 mt-1">
                          {entry.timestamp ? new Date(entry.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-slate-600 mt-2 bg-slate-50 p-2 rounded border border-slate-100 italic">"{entry.analysis}"</p>
                    <div className="mt-3 flex flex-wrap gap-3 text-sm text-slate-500 font-medium">
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-400"></span> {entry.calories} kcal</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400"></span> {entry.protein}g P</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-400"></span> {entry.carbs}g C</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-400"></span> {entry.fat}g F</span>
                    </div>
                  </div>
               </div>
             ))
           )}
        </div>
      </div>
    </div>
  );
};

export default NutritionTracker;
