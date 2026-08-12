import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Send, Loader2, Copy, Trash2, Sparkles, 
  Bot, User, Clock, RefreshCw, ChevronRight
} from 'lucide-react';
import { aiService, ChatMessage, Graph, GraphType } from '../services/aiService';
import { useThemeColors } from '../hooks/useThemeColors';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar, Pie } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const SUGGESTIONS = [
  'كم عدد الغرف المتاحة؟',
  'اعرض إحصائيات الحجوزات',
  'ما إجمالي الإيرادات؟',
  'اعرض إشغال الفندق',
  'أكثر الغرف حجزاً',
  'ملخص أداء الفندق'
];

export default function AIAssistantSection() {
  const { colors, isDark } = useThemeColors();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Load conversation from localStorage
  useEffect(() => {
    const savedConversation = localStorage.getItem('ai_conversation');
    if (savedConversation) {
      try {
        const parsed = JSON.parse(savedConversation);
        setMessages(parsed.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        })));
      } catch (e) {
        console.error('Failed to load conversation:', e);
      }
    }
  }, []);

  // Save conversation to localStorage
  useEffect(() => {
    localStorage.setItem('ai_conversation', JSON.stringify(messages));
  }, [messages]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setError(null);
    setIsLoading(true);

    // Add typing indicator
    const typingMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isTyping: true
    };
    setMessages(prev => [...prev, typingMessage]);

    try {
      const response = await aiService.askAgent(userMessage.content);
      
      // Remove typing indicator and add actual response
      setMessages(prev => {
        const withoutTyping = prev.filter(msg => !msg.isTyping);
        return [...withoutTyping, {
          id: (Date.now() + 2).toString(),
          role: 'assistant',
          content: response.textSummary,
          timestamp: new Date(),
          graph: response.showGraph ? response.graph : undefined
        }];
      });
    } catch (err: any) {
      setMessages(prev => prev.filter(msg => !msg.isTyping));
      setError('حدث خطأ أثناء التواصل مع المساعد الذكي');
      console.error('AI Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
    inputRef.current?.focus();
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  const handleClear = () => {
    setMessages([]);
    setError(null);
    setIsLoading(false);
    localStorage.removeItem('ai_conversation');
    // Force re-render by setting a timeout to clear any pending states
    setTimeout(() => {
      setMessages([]);
    }, 0);
  };

  const handleRetry = () => {
    if (messages.length > 0) {
      const lastUserMessage = [...messages].reverse().find(msg => msg.role === 'user');
      if (lastUserMessage) {
        setInput(lastUserMessage.content);
        setMessages(prev => prev.slice(0, -1));
        handleSend();
      }
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
  };

  const renderGraph = (graph: Graph) => {
    const chartColors = {
      primary: isDark ? '#D4AF37' : '#D4AF37',
      secondary: isDark ? '#E6C587' : '#C59740',
      background: isDark ? 'rgba(212, 175, 55, 0.1)' : 'rgba(212, 175, 55, 0.1)',
      border: isDark ? 'rgba(212, 175, 55, 0.3)' : 'rgba(212, 175, 55, 0.5)',
      text: isDark ? '#F3F4F6' : '#1F2937'
    };

    const chartData = {
      labels: graph.labels,
      datasets: graph.datasets.map(dataset => ({
        label: dataset.label,
        data: dataset.data,
        backgroundColor: dataset.backgroundColor || chartColors.background,
        borderColor: dataset.borderColor || chartColors.primary,
        borderWidth: 2,
        fill: graph.type === 'LINE',
        tension: 0.4
      }))
    };

    const chartOptions = {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          display: true,
          position: 'top' as const,
          labels: {
            color: chartColors.text,
            font: {
              family: 'Tajawal, sans-serif',
              size: 12
            },
            rtl: true,
            textDirection: 'rtl'
          }
        },
        title: {
          display: true,
          text: graph.title,
          color: chartColors.text,
          font: {
            size: 16,
            family: 'Tajawal, sans-serif'
          },
          padding: {
            top: 10,
            bottom: 20
          }
        },
        tooltip: {
          rtl: true,
          textDirection: 'rtl',
          titleFont: {
            family: 'Tajawal, sans-serif'
          },
          bodyFont: {
            family: 'Tajawal, sans-serif'
          }
        }
      },
      scales: graph.type !== 'PIE' ? {
        x: {
          ticks: { 
            color: chartColors.text,
            font: {
              family: 'Tajawal, sans-serif'
            }
          },
          grid: { color: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }
        },
        y: {
          ticks: { 
            color: chartColors.text,
            font: {
              family: 'Tajawal, sans-serif'
            }
          },
          grid: { color: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }
        }
      } : {}
    };

    switch (graph.type) {
      case 'LINE':
        return <Line data={chartData} options={chartOptions} />;
      case 'BAR':
        return <Bar data={chartData} options={chartOptions} />;
      case 'PIE':
        return <Pie data={chartData} options={chartOptions} />;
      default:
        return null;
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className={`border-b ${isDark ? 'border-gray-800' : 'border-gray-200'} p-6`}>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: `${colors.primary.gold}20`, border: `1px solid ${colors.primary.gold}30` }}>
            <Sparkles size={24} style={{ color: colors.primary.goldLight }} />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: colors.text.primary }}>
              المساعد الذكي
            </h1>
            <p className="text-sm" style={{ color: colors.text.muted }}>
              اسأل عن أي شيء يخص الفندق وسيقوم الذكاء الاصطناعي بتحليل البيانات والإجابة عليك
            </p>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        <AnimatePresence>
          {messages.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-12"
            >
              <div className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center" style={{ background: `${colors.primary.gold}20`, border: `2px solid ${colors.primary.gold}30` }}>
                <Bot size={40} style={{ color: colors.primary.goldLight }} />
              </div>
              <h2 className="text-2xl font-bold mb-2" style={{ color: colors.text.primary }}>
                مرحباً 👋
              </h2>
              <p className="text-lg mb-8" style={{ color: colors.text.secondary }}>
                كيف يمكنني مساعدتك اليوم؟
              </p>
              
              {/* Suggestions */}
              <div className="max-w-2xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {SUGGESTIONS.map((suggestion, index) => (
                    <motion.button
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className={`text-right p-4 rounded-xl border transition-all duration-300 hover:border-[#D4AF37]/50 ${
                        isDark 
                          ? 'bg-[#121212] border-gray-800 hover:bg-[#1a1a1a]' 
                          : 'bg-white border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <ChevronRight size={16} style={{ color: colors.primary.gold }} />
                        <span className="text-sm font-medium" style={{ color: colors.text.primary }}>
                          {suggestion}
                        </span>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${message.role === 'user' ? 'justify-start' : 'justify-end'}`}
            >
              <div className={`flex items-start gap-3 max-w-[80%] ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
                {/* Avatar */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                  message.role === 'user' 
                    ? 'bg-gradient-to-br from-[#D4AF37] to-[#E6C587]' 
                    : 'bg-gradient-to-br from-blue-500 to-blue-600'
                }`}>
                  {message.role === 'user' ? (
                    <User size={20} className="text-white" />
                  ) : (
                    <Bot size={20} className="text-white" />
                  )}
                </div>

                {/* Message Bubble */}
                <div className={`flex-1 ${message.role === 'user' ? 'text-right' : 'text-left'}`}>
                  <div className={`inline-block p-4 rounded-2xl ${
                    message.role === 'user'
                      ? 'bg-gradient-to-br from-[#D4AF37] to-[#E6C587] text-black'
                      : isDark ? 'bg-[#121212] border border-gray-800' : 'bg-white border border-gray-200'
                  }`}>
                    {message.isTyping ? (
                      <div className="flex items-center gap-2">
                        <Loader2 size={16} className="animate-spin" />
                        <span className="text-sm">جاري الكتابة...</span>
                      </div>
                    ) : (
                      <>
                        {message.graph && (
                          <div className="mb-4 p-4 rounded-lg" style={{ background: isDark ? '#0a0a0a' : '#f9fafb' }}>
                            <div className="h-64">
                              {renderGraph(message.graph)}
                            </div>
                          </div>
                        )}
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      </>
                    )}
                  </div>
                  
                  {/* Time and Actions */}
                  <div className={`flex items-center gap-2 mt-2 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className="flex items-center gap-1" style={{ color: colors.text.muted }}>
                      <Clock size={12} />
                      <span className="text-xs">{formatTime(message.timestamp)}</span>
                    </div>
                    {message.role === 'assistant' && !message.isTyping && (
                      <button
                        onClick={() => handleCopy(message.content)}
                        className="p-1 rounded hover:bg-gray-700/20 transition-colors"
                        title="نسخ"
                      >
                        <Copy size={14} style={{ color: colors.text.muted }} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}

          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-md mx-auto"
            >
              <div className={`p-4 rounded-xl border ${isDark ? 'bg-red-950/20 border-red-500/20' : 'bg-red-50 border-red-200'}`}>
                <p className="text-sm text-red-400 mb-3">{error}</p>
                <button
                  onClick={handleRetry}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                >
                  <RefreshCw size={16} />
                  <span className="text-sm font-medium">إعادة المحاولة</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className={`border-t ${isDark ? 'border-gray-800' : 'border-gray-200'} p-4`}>
        <div className="flex items-end gap-3">
          {messages.length > 0 && (
            <button
              onClick={handleClear}
              className="p-3 rounded-xl transition-colors hover:bg-red-500/20"
              title="مسح المحادثة"
            >
              <Trash2 size={20} style={{ color: colors.text.muted }} />
            </button>
          )}
          
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="اكتب سؤالك هنا..."
              disabled={isLoading}
              rows={1}
              className={`w-full px-4 py-3 rounded-xl resize-none transition-all duration-300 ${
                isDark 
                  ? 'bg-[#121212] border border-gray-800 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] text-gray-200' 
                  : 'bg-white border border-gray-200 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] text-gray-700'
              } focus:outline-none disabled:opacity-50`}
              style={{ minHeight: '48px', maxHeight: '120px' }}
            />
          </div>

          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="p-3 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#E6C587] text-black hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <Send size={20} />
            )}
          </button>
        </div>
        
        <div className="text-center mt-2">
          <p className="text-xs" style={{ color: colors.text.muted }}>
            Enter للإرسال • Shift + Enter لسطر جديد
          </p>
        </div>
      </div>
    </div>
  );
}
