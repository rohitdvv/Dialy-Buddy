
import React from 'react';

const Guide: React.FC = () => {
  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-12">
      
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 text-white shadow-lg">
        <h1 className="text-3xl font-extrabold mb-4">Welcome to HealthGuardAI</h1>
        <p className="text-indigo-100 text-lg leading-relaxed max-w-2xl">
          Your holistic wellness companion. Unlike traditional fitness apps that just track numbers, 
          HealthGuard uses advanced AI to listen, see, and understand your daily life, helping you 
          connect the dots between your sleep, diet, and emotional well-being.
        </p>
      </div>

      {/* Core Features Grid */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-slate-800">How to use the App</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Nutrition */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-lg flex items-center justify-center text-2xl mb-4">
              🥑
            </div>
            <h3 className="font-bold text-lg text-slate-800 mb-2">Nutrition Tracker</h3>
            <p className="text-slate-600 text-sm leading-relaxed mb-4">
              Don't guess calories. Just <strong>take a photo of your meal</strong>. The AI analyzes the image to estimate calories, macros, and gives it a health score.
            </p>
            <div className="bg-slate-50 p-3 rounded text-xs text-slate-500 font-medium border border-slate-100">
              💡 Tip: Try uploading a photo of a home-cooked meal to see how the AI identifies ingredients!
            </div>
          </div>

          {/* Voice Journal */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-lg flex items-center justify-center text-2xl mb-4">
              🎙️
            </div>
            <h3 className="font-bold text-lg text-slate-800 mb-2">Voice Journal</h3>
            <p className="text-slate-600 text-sm leading-relaxed mb-4">
              Feeling stressed? <strong>Record a voice note</strong>. The AI listens to your <em>tone of voice</em> (not just words) to detect stress and mood levels that you might not even realize.
            </p>
            <div className="bg-slate-50 p-3 rounded text-xs text-slate-500 font-medium border border-slate-100">
              💡 Tip: Use this at the end of a workday to "dump" your thoughts and track burnout.
            </div>
          </div>

          {/* Activity */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
             <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-2xl mb-4">
              ⌚
            </div>
            <h3 className="font-bold text-lg text-slate-800 mb-2">Activity & Devices</h3>
            <p className="text-slate-600 text-sm leading-relaxed mb-4">
              Connect your <strong>Fitbit, Apple Watch, or Google Fit</strong>. The app syncs your steps and sleep data automatically to find correlations with your mood.
            </p>
            <div className="bg-slate-50 p-3 rounded text-xs text-slate-500 font-medium border border-slate-100">
              💡 Tip: If you don't have a wearable, you can manually log your sleep and steps here.
            </div>
          </div>

           {/* AI Chat */}
           <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
             <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center text-2xl mb-4">
              💬
            </div>
            <h3 className="font-bold text-lg text-slate-800 mb-2">AI Companion</h3>
            <p className="text-slate-600 text-sm leading-relaxed mb-4">
              Need advice? <strong>Chat with HealthGuard</strong>. It remembers your history and can give personalized tips like "You slept poorly yesterday, try a light yoga session today."
            </p>
            <div className="bg-slate-50 p-3 rounded text-xs text-slate-500 font-medium border border-slate-100">
              💡 Tip: Treat it like a knowledgeable friend who knows your health history.
            </div>
          </div>

        </div>
      </div>

      {/* Why it helps */}
      <div className="bg-slate-900 text-white rounded-2xl p-8 shadow-xl">
        <h2 className="text-2xl font-bold mb-6">Why HealthGuardAI?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h4 className="font-bold text-lg text-indigo-300 mb-2">Prevent Burnout</h4>
            <p className="text-slate-300 text-sm">
              By tracking your voice tone and sleep quality together, the app can alert you to high stress levels days before you actually feel "burned out."
            </p>
          </div>
          <div>
            <h4 className="font-bold text-lg text-green-300 mb-2">Hidden Patterns</h4>
            <p className="text-slate-300 text-sm">
              Discover that you're always anxious on days you eat high-sugar breakfasts. The AI finds these hidden connections in your data.
            </p>
          </div>
          <div>
            <h4 className="font-bold text-lg text-rose-300 mb-2">Daily Accountability</h4>
            <p className="text-slate-300 text-sm">
              The 10 PM nightly check-in ensures you never miss a day of tracking, building a consistent habit of self-reflection.
            </p>
          </div>
        </div>
      </div>

      {/* Daily Routine Example */}
      <div>
        <h2 className="text-2xl font-bold text-slate-800 mb-6">A Perfect Day with HealthGuard</h2>
        <div className="relative border-l-2 border-slate-200 ml-3 space-y-8">
          
          <div className="relative pl-8">
            <span className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-indigo-500 border-4 border-slate-50"></span>
            <h4 className="font-bold text-slate-800">8:00 AM - Activity Sync</h4>
            <p className="text-slate-600 text-sm mt-1">Open the app. Your sleep data from your watch syncs automatically. You see a readiness score for the day.</p>
          </div>

          <div className="relative pl-8">
            <span className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-indigo-500 border-4 border-slate-50"></span>
            <h4 className="font-bold text-slate-800">1:00 PM - Lunch Log</h4>
            <p className="text-slate-600 text-sm mt-1">Snap a quick photo of your salad. The AI logs the macros so you stay on track with your diet goals.</p>
          </div>

          <div className="relative pl-8">
            <span className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-indigo-500 border-4 border-slate-50"></span>
            <h4 className="font-bold text-slate-800">6:30 PM - Voice Vent</h4>
            <p className="text-slate-600 text-sm mt-1">Had a tough meeting? Record a 1-minute voice note. The app detects high stress and suggests a breathing exercise.</p>
          </div>

           <div className="relative pl-8">
            <span className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-indigo-500 border-4 border-slate-50"></span>
            <h4 className="font-bold text-slate-800">10:00 PM - Nightly Check-in</h4>
            <p className="text-slate-600 text-sm mt-1">The app prompts you to rate your day. You close your rings and get a personalized insight for tomorrow.</p>
          </div>

        </div>
      </div>

    </div>
  );
};

export default Guide;
