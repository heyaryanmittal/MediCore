import React, { useState, useEffect, useRef } from 'react';
import { useChatbot } from '../context/ChatbotContext';
import { MessageCircle, X, Send, Bot, User } from 'lucide-react';

const Chatbot = () => {
  const { isOpen, messages, isLoading, error, toggleChatbot, sendMessage, clearMessages } = useChatbot();
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      clearMessages();
    }
  }, [isOpen, messages.length, clearMessages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputMessage.trim() && !isLoading) {
      sendMessage(inputMessage);
      setInputMessage('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  if (!isOpen) {
    return (
      <div className="chatbot-container">
        <button
          onClick={toggleChatbot}
          className="chatbot-button group"
          aria-label="Open chatbot"
        >
          <MessageCircle className="w-6 h-6 group-hover:scale-110 transition-transform" />
        </button>
      </div>
    );
  }

  return (
    <div className="chatbot-container">
      <div className="chatbot-window open">
        {/* Header */}
        <div className="chatbot-header">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Bot className="w-6 h-6" />
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 border-2 border-brand-dark rounded-full"></span>
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">MediCore Assistant</h3>
              <p className="text-[10px] text-brand-light/70 uppercase tracking-widest font-bold">Always Online</p>
            </div>
          </div>
          <button
            onClick={toggleChatbot}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
            aria-label="Close chatbot"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages */}
        <div className="chatbot-messages">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`chatbot-message ${message.type} flex items-start gap-3`}
            >
              {message.type === 'bot' && (
                <div className="w-8 h-8 rounded-full bg-brand-light flex items-center justify-center flex-shrink-0 border border-brand-dark/10">
                  <Bot className="w-4 h-4 text-brand-dark" />
                </div>
              )}
              <div className="flex-1 overflow-hidden">
                <p className="text-[13.5px] font-medium leading-relaxed whitespace-pre-wrap break-words">{message.content}</p>
                <div className={`flex items-center mt-1.5 gap-1.5 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <span className="text-[10px] opacity-60 font-semibold uppercase tracking-wider">
                    {new Date(message.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  {message.type === 'user' && <User className="w-2.5 h-2.5 opacity-60" />}
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="chatbot-message bot flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-brand-light flex items-center justify-center flex-shrink-0 border border-brand-dark/10">
                <Bot className="w-4 h-4 text-brand-dark" />
              </div>
              <div className="flex space-x-1 mt-3">
                <div className="w-1.5 h-1.5 bg-brand-dark/30 rounded-full animate-bounce"></div>
                <div className="w-1.5 h-1.5 bg-brand-dark/30 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-1.5 h-1.5 bg-brand-dark/30 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          )}

          {error && (
            <div className="mx-4 p-3 bg-red-50 border border-red-100 rounded-xl text-center">
              <p className="text-[11px] text-red-600 font-bold uppercase tracking-tight">{error}</p>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="chatbot-input-container">
          <div className="relative flex items-center">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your health query..."
              className="chatbot-input pr-12"
              disabled={isLoading}
              maxLength={500}
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || isLoading}
              className="absolute right-2 w-10 h-10 flex items-center justify-center rounded-xl bg-brand-dark text-white shadow-sm hover:bg-opacity-90 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Send message"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          <p className="text-[10px] text-slate-400 mt-2 text-center uppercase tracking-widest font-bold">
            Healthcare Assistant • Medical Guidance Only
          </p>
        </form>
      </div>
    </div>
  );
};

export default Chatbot;
