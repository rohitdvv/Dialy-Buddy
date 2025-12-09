
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { getChatResponse } from '../services/geminiService';

interface AIChatProps {
  messages: ChatMessage[];
  onSendMessage: (text: string, role: 'user' | 'model') => void;
}

const AIChat: React.FC<AIChatProps> = ({ messages, onSendMessage }) => {
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Helper to get local YYYY-MM-DD key from a timestamp string or Date object
  const getDateKey = (dateInput: string | Date) => {
    const date = new Date(dateInput);
    // Adjust for timezone to ensure we get the local date part correct
    const offset = date.getTimezoneOffset() * 60000;
    const localDate = new Date(date.getTime() - offset);
    return localDate.toISOString().split('T')[0];
  };

  const todayKey = getDateKey(new Date());
  const [selectedDateKey, setSelectedDateKey] = useState<string>(todayKey);

  // Group messages by Date Key (YYYY-MM-DD)
  const groupedMessages = useMemo(() => {
    const groups: Record<string, ChatMessage[]> = {};
    
    // Ensure "Today" exists even if empty
    groups[todayKey] = [];

    messages.forEach(msg => {
      // Guard against invalid timestamps
      if (!msg.timestamp) return;
      
      const key = getDateKey(msg.timestamp);
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(msg);
    });
    return groups;
  }, [messages, todayKey]);

  // Sort keys descending (Newest date first)
  const sortedKeys = useMemo(() => {
    return Object.keys(groupedMessages).sort((a, b) => b.localeCompare(a));
  }, [groupedMessages]);

  const currentMessages = groupedMessages[selectedDateKey] || [];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentMessages, isTyping]);

  const handleSend = async () => {
    if (!input.trim()) return;

    // Check if we are in "Today"
    if (selectedDateKey !== todayKey) {
       if (confirm("Start a new conversation for today?")) {
         setSelectedDateKey(todayKey);
       } else {
         return;
       }
    }

    const userText = input;
    setInput('');
    setIsTyping(true);

    // Add User Message immediately
    onSendMessage(userText, 'user');

    try {
      // Get AI Response
      // Pass current history to maintain context
      const aiResponseText = await getChatResponse(currentMessages, userText);
      onSendMessage(aiResponseText, 'model');
    } catch (error) {
      console.error("Chat error", error);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatDateLabel = (key: string) => {
    if (key === todayKey) return 'Today';
    // Append time to ensure local parsing, or just parse components
    const [y, m, d] = key.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="flex flex-col md:flex-row h-[600px] md:h-[calc(100vh-160px)] gap-6">
      
      {/* Sidebar - Date Folders */}
      <div className="w-full md:w-64 flex-shrink-0 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden h-full flex flex-col">
        <div className="p-4 bg-slate-50 border-b border-slate-100">
           <h3 className="font-bold text-slate-800 flex items-center gap-2">
             <span className="text-xl">💬</span> Chats
           </h3>
        </div>
        <div className="p-2 space-y-1 overflow-y-auto flex-1 custom-scrollbar">
          {sortedKeys.map(key => (
            <button
              key={key}
              onClick={() => setSelectedDateKey(key)}
              className={`w-full text-left px-4 py-3 rounded-lg flex items-center justify-between transition-all ${
                selectedDateKey === key 
                  ? 'bg-indigo-600 text-white shadow-md' 
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 opacity-70" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                </svg>
                <div className="flex flex-col">
                  <span className="font-medium text-sm">
                    {formatDateLabel(key)}
                  </span>
                  <span className={`text-[10px] ${selectedDateKey === key ? 'text-indigo-200' : 'text-slate-400'}`}>
                    {groupedMessages[key]?.length > 0 ? 'Conversation' : 'New'}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
        
        {/* Chat Header */}
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div>
            <h2 className="font-bold text-slate-800">
              {selectedDateKey === todayKey ? "Health Companion" : `Archive: ${formatDateLabel(selectedDateKey)}`}
            </h2>
            <p className="text-xs text-slate-500">
              {selectedDateKey === todayKey ? "Online • Ready to help" : "Read-only mode"}
            </p>
          </div>
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-xs shadow-md">
            AI
          </div>
        </div>

        {/* Messages List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
          {currentMessages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p className="text-sm font-medium">Start a conversation with your AI friend.</p>
              <p className="text-xs mt-2">Ask about diet, stress, or just say hello!</p>
            </div>
          ) : (
            currentMessages.map((msg) => (
              <div 
                key={msg.id} 
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                    msg.role === 'user' 
                      ? 'bg-indigo-600 text-white rounded-br-none' 
                      : 'bg-white text-slate-700 border border-slate-200 rounded-bl-none'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))
          )}
          
          {isTyping && (
             <div className="flex justify-start">
               <div className="bg-white border border-slate-200 px-4 py-3 rounded-2xl rounded-bl-none shadow-sm flex items-center gap-1">
                 <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></span>
                 <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></span>
                 <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></span>
               </div>
             </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        {selectedDateKey === todayKey && (
          <div className="p-4 bg-white border-t border-slate-100">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Type a message..."
                disabled={isTyping}
                className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-full focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm text-slate-900 placeholder-slate-400"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isTyping}
                className="p-3 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 transition-colors shadow-md"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIChat;
