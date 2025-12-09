
import React, { useState, useRef, useMemo } from 'react';
import { JournalData } from '../types';
import { analyzeJournalEntry } from '../services/geminiService';

interface VoiceJournalProps {
  onAddEntry: (entry: JournalData) => void;
  entries: JournalData[];
}

const VoiceJournal: React.FC<VoiceJournalProps> = ({ onAddEntry, entries }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [processing, setProcessing] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toLocaleDateString());

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // --- Grouping Logic ---
  const groupedEntries = useMemo(() => {
    const groups: Record<string, JournalData[]> = {};
    const today = new Date().toLocaleDateString();
    
    // Ensure "Today" exists even if empty
    groups[today] = [];

    entries.forEach(entry => {
      const dateKey = entry.timestamp 
        ? new Date(entry.timestamp).toLocaleDateString() 
        : today;
      
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(entry);
    });
    return groups;
  }, [entries]);

  const dateKeys = useMemo(() => {
    return Object.keys(groupedEntries).sort((a, b) => {
      return new Date(b).getTime() - new Date(a).getTime();
    });
  }, [groupedEntries]);

  // --- Daily Statistics Calculation ---
  const dailyStats = useMemo(() => {
    const currentEntries = groupedEntries[selectedDate] || [];
    if (currentEntries.length === 0) return null;

    const totalStress = currentEntries.reduce((sum, e) => sum + e.stressLevel, 0);
    const avgStress = Math.round((totalStress / currentEntries.length) * 10) / 10;

    // Convert Sentiment (-1 to 1) to Happiness (0 to 100)
    const totalSentiment = currentEntries.reduce((sum, e) => sum + e.sentimentScore, 0);
    const avgSentiment = totalSentiment / currentEntries.length;
    const happinessScore = Math.round(((avgSentiment + 1) / 2) * 100);

    return { avgStress, happinessScore, count: currentEntries.length };
  }, [groupedEntries, selectedDate]);


  // --- Recording Logic ---
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        await processAudio(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Microphone access denied. Please use text input.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const processAudio = async (blob: Blob) => {
    setProcessing(true);
    try {
      const base64Data = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => {
          const result = reader.result as string;
          resolve(result.split(',')[1]);
        };
      });

      const data = await analyzeJournalEntry("", base64Data);
      onAddEntry({ ...data, timestamp: new Date().toISOString() });
      setSelectedDate(new Date().toLocaleDateString()); // Switch to today
    } catch (e) {
      alert("Failed to process audio journal.");
    } finally {
      setProcessing(false);
    }
  };

  const handleTextSubmit = async () => {
    if (!textInput.trim()) return;
    setProcessing(true);
    try {
      const data = await analyzeJournalEntry(textInput);
      onAddEntry({ ...data, timestamp: new Date().toISOString() });
      setTextInput('');
      setSelectedDate(new Date().toLocaleDateString()); // Switch to today
    } catch (e) {
      alert("Failed to process text entry.");
    } finally {
      setProcessing(false);
    }
  };

  const isToday = (dateStr: string) => dateStr === new Date().toLocaleDateString();

  return (
    <div className="flex flex-col md:flex-row h-full gap-6">
      
      {/* Sidebar - Date Folders */}
      <div className="w-full md:w-64 flex-shrink-0 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden h-fit">
        <div className="p-4 bg-slate-50 border-b border-slate-100">
           <h3 className="font-bold text-slate-800 flex items-center gap-2">
             <span className="text-xl">📔</span> Journal History
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
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
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

      {/* Main Content */}
      <div className="flex-1 space-y-6">
        
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-slate-800">
            {isToday(selectedDate) ? "Today's Journal" : `Journal: ${selectedDate}`}
          </h2>
        </div>

        {/* Daily Summary Stats */}
        {dailyStats && (
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="p-3 bg-slate-50 rounded-lg">
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Entries</p>
              <p className="text-2xl font-bold text-slate-800">{dailyStats.count}</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg">
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Avg Stress</p>
              <div className="flex items-center gap-2">
                <span className={`text-2xl font-bold ${dailyStats.avgStress > 7 ? 'text-red-500' : dailyStats.avgStress < 4 ? 'text-green-500' : 'text-yellow-600'}`}>
                  {dailyStats.avgStress}
                </span>
                <span className="text-xs text-slate-400">/ 10</span>
              </div>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg col-span-2 md:col-span-1">
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Happiness Level</p>
              <div className="flex items-center gap-2">
                 <span className={`text-2xl font-bold ${dailyStats.happinessScore > 60 ? 'text-green-500' : dailyStats.happinessScore < 40 ? 'text-red-500' : 'text-blue-500'}`}>
                   {dailyStats.happinessScore}%
                 </span>
                 <div className="flex-1 h-2 bg-slate-200 rounded-full ml-2 max-w-[80px]">
                   <div 
                    className={`h-full rounded-full ${dailyStats.happinessScore > 60 ? 'bg-green-500' : dailyStats.happinessScore < 40 ? 'bg-red-500' : 'bg-blue-500'}`} 
                    style={{width: `${dailyStats.happinessScore}%`}}
                   />
                 </div>
              </div>
            </div>
          </div>
        )}

        {/* Input Area (Only for Today) */}
        {isToday(selectedDate) && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Recorder */}
            <div className="md:col-span-1 bg-white p-6 rounded-xl shadow-sm border border-slate-200 text-center flex flex-col items-center justify-center">
              <button
                onClick={isRecording ? stopRecording : startRecording}
                disabled={processing}
                className={`w-20 h-20 rounded-full flex items-center justify-center transition-all mb-4 ${
                  isRecording 
                    ? 'bg-red-500 shadow-[0_0_0_8px_rgba(239,68,68,0.2)] animate-pulse' 
                    : 'bg-indigo-600 hover:bg-indigo-700 shadow-lg hover:scale-105'
                } disabled:opacity-50`}
              >
                {processing ? (
                   <svg className="animate-spin h-8 w-8 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                ) : isRecording ? (
                  <div className="w-6 h-6 bg-white rounded-sm" />
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" /></svg>
                )}
              </button>
              <p className="text-sm font-medium text-slate-600">
                 {isRecording ? "Recording..." : "Record Voice Note"}
              </p>
            </div>
            
            {/* Text Input */}
            <div className="md:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
               <textarea
                 className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm min-h-[100px]"
                 placeholder="How are you feeling right now? What's on your mind?"
                 value={textInput}
                 onChange={(e) => setTextInput(e.target.value)}
                 disabled={processing || isRecording}
               />
               <div className="mt-3 flex justify-end">
                 <button 
                  onClick={handleTextSubmit}
                  disabled={!textInput.trim() || processing}
                  className="bg-slate-800 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-slate-900 disabled:opacity-50 transition-colors"
                 >
                   {processing ? 'Analyzing...' : 'Save Entry'}
                 </button>
               </div>
            </div>
          </div>
        )}

        {/* Entries List */}
        <div className="space-y-4">
           {(!groupedEntries[selectedDate] || groupedEntries[selectedDate].length === 0) ? (
             <div className="text-center text-slate-400 py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
               No entries for this date.
             </div>
           ) : (
             // Show newest first
             [...groupedEntries[selectedDate]].reverse().map((entry, idx) => (
              <div key={idx} className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 transition-all hover:shadow-md">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex gap-3 items-center">
                    <span className="font-bold text-slate-800 text-lg capitalize">{entry.mood}</span>
                    <span className={`text-xs px-2 py-1 rounded-full border ${
                      entry.stressLevel > 7 ? 'bg-red-50 border-red-200 text-red-600' : 'bg-green-50 border-green-200 text-green-600'
                    }`}>
                      Stress: {entry.stressLevel}/10
                    </span>
                  </div>
                  <span className="text-xs text-slate-400 font-medium">
                    {entry.timestamp ? new Date(entry.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}
                  </span>
                </div>
                
                <p className="text-slate-600 text-sm leading-relaxed mb-4">"{entry.summary}"</p>
                
                <div className="flex flex-wrap gap-2 pt-3 border-t border-slate-100">
                  {entry.keyTopics.map((topic, i) => (
                    <span key={i} className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded hover:bg-slate-200 transition-colors">
                      #{topic}
                    </span>
                  ))}
                </div>
              </div>
             ))
           )}
        </div>
      </div>
    </div>
  );
};

export default VoiceJournal;
