'use client';

import { useState, useRef, useEffect } from 'react';
import api from '@/lib/api';
import { ChatMessage } from '@/types';
import { Send, Trash2, Bot, User, Loader } from 'lucide-react';

const QUICK_QUESTIONS = [
  'Best time to visit Sri Lanka?',
  'Visa requirements for tourists?',
  'Popular beaches in Sri Lanka?',
  'Where can I see elephants?',
];

const SESSION_KEY = 'lanka_chat_session';

function getOrCreateSession(): string {
  if (typeof window === 'undefined') return '';
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) { id = `session_${Date.now()}_${Math.random().toString(36).slice(2)}`; localStorage.setItem(SESSION_KEY, id); }
  return id;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '0', role: 'assistant', content: 'Hello! I\'m your LankaJourney.lk Travel Assistant. 🌴 Ask me anything about Sri Lanka — destinations, visa requirements, best time to visit, activities, local culture, and more!', timestamp: new Date() }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const session_id = getOrCreateSession();
      const { data } = await api.post('/ai/chat', { message: content, session_id });
      const botMsg: ChatMessage = { id: (Date.now() + 1).toString(), role: 'assistant', content: data.data?.reply || 'I couldn\'t get a response right now. Please try again.', timestamp: new Date() };
      setMessages(prev => [...prev, botMsg]);
    } catch {
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'assistant', content: '⚠️ I\'m having trouble connecting right now. Please try again in a moment.', timestamp: new Date() }]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    if (typeof window !== 'undefined') localStorage.removeItem(SESSION_KEY);
    setMessages([{ id: '0', role: 'assistant', content: 'Chat cleared! How can I help you explore Sri Lanka? 🌴', timestamp: new Date() }]);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 flex flex-col" style={{ height: 'calc(100vh - 64px)' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-gray-800">LankaJourney.lk Assistant</h1>
            <p className="text-xs text-blue-600">● Online · Ready to help</p>
          </div>
        </div>
        <button onClick={clearChat} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-red-500 transition-colors">
          <Trash2 className="w-4 h-4" /> Clear
        </button>
      </div>

      {/* Quick questions */}
      <div className="flex gap-2 flex-wrap mb-4">
        {QUICK_QUESTIONS.map((q) => (
          <button key={q} onClick={() => sendMessage(q)}
            className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1.5 rounded-full hover:bg-blue-100 transition-colors">
            {q}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pb-2">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'assistant' ? 'bg-blue-100 text-blue-700' : 'bg-gray-800 text-white'}`}>
              {msg.role === 'assistant' ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
            </div>
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-tr-sm' : 'bg-white border border-gray-100 text-gray-800 rounded-tl-sm shadow-sm'}`}>
              <p className="whitespace-pre-wrap">{msg.content}</p>
              <p className={`text-xs mt-1 ${msg.role === 'user' ? 'text-blue-200' : 'text-gray-400'}`}>
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
              <div className="flex gap-1.5 items-center h-5">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="mt-4 flex gap-3 bg-white border border-gray-200 rounded-2xl px-4 py-2 shadow-sm">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage(input)}
          placeholder="Ask about Sri Lanka..."
          className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 focus:outline-none py-2"
        />
        <button onClick={() => sendMessage(input)} disabled={isLoading || !input.trim()}
          className="w-9 h-9 bg-blue-600 text-white rounded-xl flex items-center justify-center hover:bg-blue-700 transition-colors disabled:opacity-40 shrink-0">
          {isLoading ? <Loader className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}
