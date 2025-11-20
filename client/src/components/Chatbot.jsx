import React, { useState, useEffect, useRef } from 'react';
import { API_BASE } from '../config/api';

const stripMarkdown = (text) => {
  if (!text || typeof text !== 'string') return '';
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .trim();
};

const splitIntoSegments = (raw) => {
  if (!raw || typeof raw !== 'string') return ['Let me know how I can help you.'];
  const cleaned = raw.replace(/\s+/g, ' ').trim();
  if (!cleaned) return ['Let me know how I can help you.'];
  const segments = cleaned
    .split(/(?<=[.!?])\s+(?=[A-Z0-9])/)
    .map((segment) => stripMarkdown(segment.replace(/^[\-\u2022]+\s*/, '').trim()))
    .filter((segment) => segment.length > 0);
  if (segments.length === 0) return [cleaned];
  return segments.slice(0, 5);
};

const mapToBulletObjects = (segments) =>
  segments.map((segment) => {
    const colonSplit = segment.split(/:(.+)/);
    if (colonSplit.length > 1) {
      return {
        title: colonSplit[0].trim(),
        body: colonSplit[1].trim(),
      };
    }
    const words = segment.split(' ');
    const title = words.slice(0, 2).join(' ');
    const body = words.slice(2).join(' ');
    return { title: title.trim(), body: body.trim() };
  });

export default function Chatbot() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hi! I'm your EduTrek assistant. How can I help you today?",
      bot: true,
      bullets: [
        { title: 'Course guidance', body: 'I can suggest paths or dashboards to explore.' },
        { title: 'Quiz & assessment help', body: 'Ask for tips, summaries, or troubleshooting.' },
      ],
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const messagesEndRef = useRef(null);

  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = { id: Date.now(), text: inputMessage, bot: false, timestamp: new Date() };
    setMessages((prev) => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE}/api/chatbot/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: inputMessage }),
      });
      const data = await response.json();
      const bullets = mapToBulletObjects(splitIntoSegments(data.message));
      const botMessage = {
        id: Date.now() + 1,
        text: data.message,
        bullets,
        bot: true,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      const errorMessage = {
        id: Date.now() + 1,
        text: "Sorry, I'm having trouble connecting right now. Please try again later.",
        bot: true,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div
      className={`min-h-screen w-full pt-20 pb-10 px-4 transition-colors duration-300 ${
        isDarkMode ? 'bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900' : 'bg-slate-100'
      }`}
    >
      <div className="max-w-4xl mx-auto flex flex-col gap-6">
        <header
          className={`text-center space-y-2 transition-colors ${
            isDarkMode ? 'text-white' : 'text-slate-900'
          }`}
        >
          <div className="flex items-center justify-center gap-4">
            <div
              className={`inline-flex items-center gap-2 px-4 py-1 rounded-full text-xs uppercase tracking-[0.2em] ${
                isDarkMode ? 'bg-white/10 border border-white/20 text-white' : 'bg-cyan-50 border border-cyan-100 text-cyan-700'
              }`}
            >
              EduTrek Assistant
            </div>
            <button
              onClick={() => setIsDarkMode((prev) => !prev)}
              className={`text-xs font-medium px-4 py-1.5 rounded-full transition ${
                isDarkMode
                  ? 'bg-slate-200 text-slate-800 hover:bg-slate-300'
                  : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
              }`}
            >
              {isDarkMode ? 'Light Mode' : 'Dark Mode'}
            </button>
          </div>
          <h1 className="text-3xl font-semibold">Chat with your learning copilot</h1>
          <p className={`text-sm ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
            Ask questions, summarize lessons, or plan your next move.
          </p>
        </header>

        <div
          className={`rounded-2xl shadow-2xl flex flex-col h-[70vh] md:h-[75vh] backdrop-blur transition-colors ${
            isDarkMode ? 'bg-slate-950/80 border border-slate-800' : 'bg-white border border-slate-200'
          }`}
        >
          {/* Messages Area */}
          <div className="flex-1 flex flex-col p-6 overflow-y-auto space-y-4">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.bot ? 'justify-start' : 'justify-end'}`}>
                <div
                  className={`max-w-2xl px-4 py-3 rounded-2xl shadow transition-colors ${
                    message.bot
                      ? isDarkMode
                        ? 'bg-slate-900/70 text-slate-100 border border-slate-800'
                        : 'bg-slate-100 text-slate-800 border border-slate-200'
                      : 'bg-cyan-500 text-white'
                  }`}
                >
                  {message.bot && Array.isArray(message.bullets) ? (
                    <ul className="space-y-2 text-sm">
                      {message.bullets.map((item, idx) => (
                        <li key={idx} className="flex gap-2">
                          <span className="text-cyan-400 mt-0.5">•</span>
                          <span>
                            <span
                              className={`font-semibold ${
                                isDarkMode ? 'text-white' : 'text-slate-800'
                              }`}
                            >
                              {item.title}{item.body ? ':' : ''}
                            </span>{' '}
                            <span
                              className={`${
                                isDarkMode ? 'text-slate-200' : 'text-slate-700'
                              }`}
                            >
                              {item.body}
                            </span>
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p
                      className={`text-sm whitespace-pre-line ${
                        isDarkMode ? 'text-slate-100' : 'text-slate-800'
                      }`}
                    >
                      {message.text}
                    </p>
                  )}
                  <p
                    className={`text-[11px] opacity-60 mt-2 ${
                      isDarkMode ? 'text-slate-400' : 'text-slate-600'
                    }`}
                  >
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div
                  className={`px-4 py-2 rounded-2xl border ${
                    isDarkMode
                      ? 'bg-slate-900/70 text-slate-200 border-slate-800'
                      : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}
                >
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 rounded-full animate-bounce bg-slate-400"></div>
                    <div className="w-2 h-2 rounded-full animate-bounce bg-slate-400" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 rounded-full animate-bounce bg-slate-400" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div
            className={`border-t p-4 flex-shrink-0 transition-colors ${
              isDarkMode ? 'border-slate-900/60' : 'border-slate-200'
            }`}
          >
            <div className="flex gap-3">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Message EduTrek Assistant..."
                className={`flex-1 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/60 transition-colors ${
                  isDarkMode
                    ? 'bg-slate-900/70 border border-slate-800 text-slate-100 placeholder-slate-500'
                    : 'bg-white border border-slate-300 text-slate-900 placeholder-slate-500'
                }`}
                disabled={isLoading}
              />
              <button
                onClick={sendMessage}
                disabled={!inputMessage.trim() || isLoading}
                className="px-5 py-3 bg-cyan-500 text-white rounded-xl hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
              >
                Send
              </button>
            </div>
            <p
              className={`text-[11px] mt-2 text-center ${
                isDarkMode ? 'text-slate-500' : 'text-slate-400'
              }`}
            >
              AI responses may be imperfect. Verify important details.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
