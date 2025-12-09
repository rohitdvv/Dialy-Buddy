
import React, { useState } from 'react';
import { TabView } from '../types';

interface PresentationProps {
  onSwitchTab: (tab: TabView) => void;
}

const Presentation: React.FC<PresentationProps> = ({ onSwitchTab }) => {
  const [slide, setSlide] = useState(0);

  const slides = [
    {
      title: "HealthGuardAI",
      subtitle: "Multimodal Generative AI for Preventive Wellness",
      content: (
        <div className="flex flex-col items-center justify-center h-full text-center space-y-8">
          <div className="w-32 h-32 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-3xl shadow-2xl flex items-center justify-center transform rotate-12 hover:rotate-0 transition-all duration-500">
             <span className="text-6xl">🛡️</span>
          </div>
          <p className="text-2xl text-slate-600 max-w-2xl">
            A unified system that uses <span className="font-bold text-indigo-600">Vision</span>, <span className="font-bold text-rose-600">Voice</span>, and <span className="font-bold text-blue-600">Data</span> to detect early health risks.
          </p>
          <div className="flex gap-4 mt-8">
            <span className="px-4 py-2 bg-slate-100 rounded-full text-sm font-semibold text-slate-500">Powered by Gemini 2.5 Flash</span>
            <span className="px-4 py-2 bg-slate-100 rounded-full text-sm font-semibold text-slate-500">React + TypeScript</span>
          </div>
        </div>
      )
    },
    {
      title: "The Problem: Siloed Health Data",
      subtitle: "Why current apps fail at preventive care",
      content: (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
          <div className="bg-red-50 p-6 rounded-2xl border-2 border-red-100 text-center opacity-50 hover:opacity-100 transition-opacity">
            <div className="text-4xl mb-4">🍔</div>
            <h3 className="font-bold text-red-800 mb-2">Diet Apps</h3>
            <p className="text-sm text-red-600">Only track calories. They don't know if you're stress-eating.</p>
          </div>
          <div className="bg-blue-50 p-6 rounded-2xl border-2 border-blue-100 text-center opacity-50 hover:opacity-100 transition-opacity">
            <div className="text-4xl mb-4">⌚</div>
            <h3 className="font-bold text-blue-800 mb-2">Fitness Trackers</h3>
            <p className="text-sm text-blue-600">Track steps & sleep. They don't know <i>why</i> you slept poorly.</p>
          </div>
          <div className="bg-yellow-50 p-6 rounded-2xl border-2 border-yellow-100 text-center opacity-50 hover:opacity-100 transition-opacity">
            <div className="text-4xl mb-4">📓</div>
            <h3 className="font-bold text-yellow-800 mb-2">Journals</h3>
            <p className="text-sm text-yellow-600">Capture feelings. But don't correlate it with your diet or activity.</p>
          </div>
          <div className="md:col-span-3 bg-white p-6 rounded-2xl shadow-lg border border-slate-200 text-center mt-4">
            <h3 className="text-xl font-bold text-slate-800">The Consequence</h3>
            <p className="text-slate-600">"Invisible" burnout risks are missed until it's too late.</p>
          </div>
        </div>
      )
    },
    {
      title: "The Solution: Multimodal AI",
      subtitle: "One model to understand everything",
      content: (
        <div className="relative flex items-center justify-center h-full">
          <div className="absolute inset-0 flex items-center justify-center">
             <div className="w-64 h-64 bg-indigo-500/10 rounded-full animate-pulse"></div>
          </div>
          <div className="z-10 bg-white p-8 rounded-2xl shadow-xl border border-slate-200 text-center w-80">
            <h3 className="text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">Gemini 2.5</h3>
            <p className="text-xs text-slate-400 mt-1">The Central Brain</p>
          </div>
          
          {/* Orbiting Nodes */}
          <div className="absolute top-0 md:top-10 left-10 bg-white p-4 rounded-xl shadow border border-green-200 animate-bounce" style={{animationDuration: '3s'}}>
             <span className="font-bold text-green-700">Vision 📷</span>
             <p className="text-xs">Food Analysis</p>
          </div>
          <div className="absolute bottom-10 right-10 bg-white p-4 rounded-xl shadow border border-rose-200 animate-bounce" style={{animationDuration: '4s'}}>
             <span className="font-bold text-rose-700">Audio 🎙️</span>
             <p className="text-xs">Tone/Stress Detection</p>
          </div>
          <div className="absolute bottom-10 left-10 bg-white p-4 rounded-xl shadow border border-blue-200 animate-bounce" style={{animationDuration: '3.5s'}}>
             <span className="font-bold text-blue-700">Context 🧠</span>
             <p className="text-xs">Historical Reasoning</p>
          </div>
        </div>
      )
    },
    {
      title: "Technical Architecture",
      subtitle: "How the data flows",
      content: (
        <div className="flex flex-col gap-4 mt-8">
           <div className="flex items-center gap-4">
              <div className="w-24 font-bold text-slate-500 text-right">User Input</div>
              <div className="flex-1 bg-slate-100 p-4 rounded-lg flex gap-4">
                 <div className="bg-white px-3 py-1 rounded border shadow-sm text-sm">Base64 Image</div>
                 <div className="bg-white px-3 py-1 rounded border shadow-sm text-sm">Audio Blob</div>
                 <div className="bg-white px-3 py-1 rounded border shadow-sm text-sm">JSON Logs</div>
              </div>
           </div>
           
           <div className="flex justify-center my-2">⬇️</div>

           <div className="flex items-center gap-4">
              <div className="w-24 font-bold text-indigo-600 text-right">LLM Layer</div>
              <div className="flex-1 bg-indigo-600 p-4 rounded-lg text-white shadow-lg">
                 <div className="font-mono text-sm mb-2">Google Gemini 2.5 Flash</div>
                 <div className="flex gap-2">
                    <span className="bg-indigo-500 px-2 py-1 rounded text-xs">Structured Outputs</span>
                    <span className="bg-indigo-500 px-2 py-1 rounded text-xs">Multimodal Prompting</span>
                 </div>
              </div>
           </div>

           <div className="flex justify-center my-2">⬇️</div>

           <div className="flex items-center gap-4">
              <div className="w-24 font-bold text-green-600 text-right">App State</div>
              <div className="flex-1 bg-green-50 p-4 rounded-lg border border-green-200 flex gap-4">
                 <div className="bg-white px-3 py-1 rounded border shadow-sm text-sm font-mono text-green-700">nutrition.json</div>
                 <div className="bg-white px-3 py-1 rounded border shadow-sm text-sm font-mono text-green-700">journal.json</div>
                 <div className="bg-white px-3 py-1 rounded border shadow-sm text-sm font-mono text-green-700">wellnessScore</div>
              </div>
           </div>
        </div>
      )
    },
    {
      title: "Key Innovations",
      subtitle: "What makes this project unique",
      content: (
        <div className="grid grid-cols-2 gap-6 mt-8">
          <div className="bg-white p-6 rounded-xl shadow border border-slate-200">
             <h4 className="font-bold text-slate-800 text-lg mb-2">1. Emotional Audio Analysis</h4>
             <p className="text-slate-600 text-sm">
               We don't just transcribe text. We analyze the <strong>tone</strong> of voice to detect stress levels that text alone would miss.
             </p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow border border-slate-200">
             <h4 className="font-bold text-slate-800 text-lg mb-2">2. Zero-Backend Persistence</h4>
             <p className="text-slate-600 text-sm">
               Uses advanced browser storage and heuristic algorithms to simulate a full database and cloud sync experience.
             </p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow border border-slate-200">
             <h4 className="font-bold text-slate-800 text-lg mb-2">3. Simulated Hardware Integration</h4>
             <p className="text-slate-600 text-sm">
               Realistic Web Bluetooth & Cloud API simulations demonstrate how the app handles IoT data streams.
             </p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow border border-slate-200">
             <h4 className="font-bold text-slate-800 text-lg mb-2">4. Context-Aware Companion</h4>
             <p className="text-slate-600 text-sm">
               The Chatbot has memory. It knows if you ate poorly yesterday and adjusts its advice today.
             </p>
          </div>
        </div>
      )
    },
    {
      title: "Live Demo",
      subtitle: "See it in action",
      content: (
        <div className="flex flex-col items-center justify-center h-full space-y-8">
           <div className="text-center">
             <p className="text-xl text-slate-600 mb-6">Let's walk through a user journey.</p>
             <button 
               onClick={() => onSwitchTab(TabView.DASHBOARD)}
               className="bg-indigo-600 text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-indigo-700 hover:scale-105 transition-all shadow-xl animate-pulse"
             >
               Launch Application 🚀
             </button>
           </div>
           <div className="flex gap-4 text-sm text-slate-400">
              <span>1. Login</span>
              <span>→</span>
              <span>2. Upload Food</span>
              <span>→</span>
              <span>3. Record Voice</span>
              <span>→</span>
              <span>4. View Insights</span>
           </div>
        </div>
      )
    },
    {
      title: "Future Roadmap",
      subtitle: "Where we go from here",
      content: (
        <div className="space-y-4 mt-8">
           <div className="flex items-center gap-4 opacity-50">
             <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white">✓</div>
             <span className="font-medium text-slate-500 line-through">MVP (Vision, Voice, Basic Logic)</span>
           </div>
           <div className="flex items-center gap-4">
             <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white">2</div>
             <span className="font-bold text-slate-800">Real-time Wearable Integration</span>
             <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded">In Progress</span>
           </div>
           <div className="flex items-center gap-4">
             <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500">3</div>
             <span className="font-medium text-slate-600">Doctor/Therapist Dashboard Export</span>
           </div>
           <div className="flex items-center gap-4">
             <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500">4</div>
             <span className="font-medium text-slate-600">Video Movement Analysis (Squat form check)</span>
           </div>
           
           <div className="mt-12 p-6 bg-slate-50 rounded-xl text-center">
              <h3 className="text-2xl font-bold text-slate-800">Questions?</h3>
           </div>
        </div>
      )
    }
  ];

  const nextSlide = () => setSlide(s => Math.min(s + 1, slides.length - 1));
  const prevSlide = () => setSlide(s => Math.max(0, s - 1));

  // Keyboard navigation
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'Space') nextSlide();
      if (e.key === 'ArrowLeft') prevSlide();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="h-full flex flex-col bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
      
      {/* Slide Area */}
      <div className="flex-1 p-12 overflow-y-auto bg-slate-50 relative">
        <div className="absolute top-0 right-0 p-4 opacity-10">
           <svg xmlns="http://www.w3.org/2000/svg" className="h-64 w-64" viewBox="0 0 20 20" fill="currentColor">
             <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
           </svg>
        </div>

        <div className="max-w-5xl mx-auto h-full flex flex-col z-10 relative">
          <div className="mb-8">
            <h1 className="text-4xl font-extrabold text-slate-900 mb-2">{slides[slide].title}</h1>
            <p className="text-xl text-indigo-600 font-medium">{slides[slide].subtitle}</p>
          </div>
          
          <div className="flex-1">
            {slides[slide].content}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white border-t border-slate-200 p-4 flex justify-between items-center">
        <div className="text-sm text-slate-400 font-mono">
          Slide {slide + 1} / {slides.length}
        </div>
        
        <div className="flex gap-4">
          <button 
            onClick={prevSlide}
            disabled={slide === 0}
            className="px-6 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold disabled:opacity-50 transition-colors"
          >
            Previous
          </button>
          <button 
            onClick={nextSlide}
            disabled={slide === slides.length - 1}
            className="px-6 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold disabled:opacity-50 transition-colors shadow-lg shadow-indigo-200"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default Presentation;
