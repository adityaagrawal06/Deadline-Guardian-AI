import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Sparkles, User, BrainCircuit, ShieldAlert, Calendar, LayoutList, ChevronRight } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useNavigate } from 'react-router-dom';

const SUGGESTIONS = [
  { icon: '📅', text: 'Plan my day' },
  { icon: '📖', text: 'Explain assignment' },
  { icon: '💻', text: 'Help with coding' },
  { icon: '📝', text: 'Generate study notes' },
  { icon: '🎯', text: 'Prepare for interview' },
  { icon: '⚠', text: 'Rescue my schedule' },
  { icon: '🔄', text: 'Rearrange my tasks' },
  { icon: '📊', text: 'Show my progress' }
];

const TaskWidget = ({ data }) => {
  if (Array.isArray(data)) {
    return (
      <div className="flex flex-col gap-2 mt-2">
        <h4 className="text-xs font-bold uppercase tracking-wider text-text-muted mb-1">Your Tasks</h4>
        {data.map(task => (
          <div key={task.id || task._id} className="bg-bg border border-border p-3 rounded-lg flex justify-between items-center text-sm">
            <div className="truncate pr-2">
              <span className="font-bold text-text truncate block">{task.title}</span>
              <span className="text-[10px] text-text-muted uppercase">{new Date(task.deadline).toLocaleDateString()}</span>
            </div>
            <span className={`text-[10px] px-2 py-1 rounded font-bold uppercase ${task.riskScore > 70 ? 'bg-red-500/20 text-red-500' : 'bg-green-500/20 text-green-500'}`}>
              Risk: {task.riskScore}%
            </span>
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className="bg-bg border border-border p-3 rounded-lg mt-2 text-sm">
      <span className="font-bold text-text block mb-1">{data.title}</span>
      <span className="text-xs text-text-muted uppercase">Added Successfully</span>
    </div>
  );
};

const RescueWidget = ({ data }) => {
  const navigate = useNavigate();
  return (
    <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl mt-2 relative overflow-hidden">
      <ShieldAlert className="absolute -right-4 -top-4 text-red-500/20" size={64} />
      <h4 className="text-red-500 font-bold uppercase tracking-wider text-xs mb-2">Emergency Plan Active</h4>
      <p className="text-sm text-text font-medium mb-3">{data.whatToDoRightNow}</p>
      <button 
        onClick={() => navigate('/rescue')}
        className="w-full py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg text-xs transition-colors shadow-lg shadow-red-500/20 flex items-center justify-center gap-1"
      >
        Enter Command Center <ChevronRight size={14} />
      </button>
    </div>
  );
};

export default function GuardianAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Load memory from session/local storage
    const saved = localStorage.getItem('guardian_chat_history');
    if (saved) {
      try { setMessages(JSON.parse(saved)); } catch (e) {}
    } else {
      setMessages([{
        role: 'assistant',
        parts: [{ text: "Hi! I'm Guardian AI, your intelligent productivity coach. I've already reviewed your dashboard, tasks, and deadlines. How can I help you dominate your workload today?" }]
      }]);
    }
    
    // Auto-message for high risk schedules
    const checkHighRisk = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/rescue/status`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (res.ok) {
          const data = await res.json();
          // If rescue mode is recommended (shouldActivate is true but not yet active), or if the user has already saved high risk logic in Dashboard
          if (data.shouldActivate && !data.isRescueModeActive) {
             const hasAlerted = sessionStorage.getItem('guardian_alerted');
             if (!hasAlerted) {
                setMessages(prev => [...prev, {
                  role: 'assistant',
                  parts: [{ text: "🚨 I detected that your current schedule has become high risk. Would you like me to generate an emergency recovery plan?" }]
                }]);
                sessionStorage.setItem('guardian_alerted', 'true');
             }
          }
        }
      } catch (e) {}
    };
    checkHighRisk();
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('guardian_chat_history', JSON.stringify(messages));
    }
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  const sendMessage = async (text) => {
    if (!text.trim()) return;
    
    const newMessages = [...messages, { role: 'user', parts: [{ text }] }];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/assistant/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message: text, history: newMessages.slice(-10, -1) })
      });

      if (!res.ok) throw new Error('Server returned error');

      const reader = res.body.getReader();
      const decoder = new TextDecoder('utf-8');
      
      let assistantMsg = { role: 'assistant', parts: [{ text: '' }] };
      setMessages(prev => [...prev, assistantMsg]);
      setIsLoading(false); // Turn off typing indicator since stream is starting
      
      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        
        // Keep the last incomplete line in the buffer
        buffer = lines.pop();
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6).trim();
            if (dataStr === '[DONE]') break;
            try {
              const data = JSON.parse(dataStr);
              if (data.text) {
                assistantMsg = { ...assistantMsg, parts: [{ text: assistantMsg.parts[0].text + data.text }] };
                setMessages(prev => [...prev.slice(0, -1), assistantMsg]);
              }
              if (data.widget) {
                assistantMsg = { ...assistantMsg, widget: data.widget };
                setMessages(prev => [...prev.slice(0, -1), assistantMsg]);
              }
            } catch (e) {}
          }
        }
      }
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'assistant', parts: [{ text: "I'm having trouble connecting to my neural network right now. Please try again later." }] }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    const init = [{ role: 'assistant', parts: [{ text: "Memory cleared. How can I help you?" }] }];
    setMessages(init);
    localStorage.setItem('guardian_chat_history', JSON.stringify(init));
  };

  return (
    <>
      {/* FAB */}
      <button 
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 z-50 p-4 rounded-full bg-primary text-white shadow-xl shadow-primary/30 hover:scale-110 transition-transform ${isOpen ? 'scale-0 opacity-0' : 'scale-100 opacity-100'} flex items-center justify-center`}
      >
        <Sparkles size={24} />
      </button>

      {/* Chat Panel */}
      <div 
        className={`fixed bottom-6 right-6 z-50 w-full max-w-[420px] h-[600px] max-h-[85vh] bg-surface/80 backdrop-blur-2xl border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 origin-bottom-right ${isOpen ? 'scale-100 opacity-100 translate-y-0' : 'scale-90 opacity-0 translate-y-10 pointer-events-none'}`}
      >
        {/* Header */}
        <div className="p-4 border-b border-border/50 bg-bg/50 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
              <BrainCircuit size={20} />
            </div>
            <div>
              <h3 className="font-extrabold text-text text-sm flex items-center gap-1">Guardian AI <Sparkles size={12} className="text-primary"/></h3>
              <p className="text-[10px] text-text-muted font-medium uppercase tracking-widest">Your Intelligent Coach</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleClear} className="text-[10px] font-bold text-text-muted hover:text-red-500 uppercase px-2 transition-colors">Clear</button>
            <button onClick={() => setIsOpen(false)} className="p-2 text-text-muted hover:text-text bg-bg hover:bg-border rounded-full transition-colors"><X size={18}/></button>
          </div>
        </div>

        {/* Message List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1 ${msg.role === 'user' ? 'bg-border text-text' : 'bg-primary/20 text-primary'}`}>
                {msg.role === 'user' ? <User size={16} /> : <BrainCircuit size={16} />}
              </div>
              <div className={`flex flex-col gap-2 max-w-[80%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                {msg.parts?.map((part, pIdx) => part.text && (
                  <div key={pIdx} className={`p-3.5 rounded-2xl text-sm shadow-sm ${msg.role === 'user' ? 'bg-primary text-white rounded-tr-none' : 'bg-bg border border-border text-text rounded-tl-none leading-relaxed prose prose-sm dark:prose-invert max-w-none'}`}>
                    {msg.role === 'user' ? (
                      part.text
                    ) : (
                      <ReactMarkdown
                         components={{
                           a: ({node, ...props}) => <a {...props} className="text-primary underline font-bold" />,
                           strong: ({node, ...props}) => <strong {...props} className="font-extrabold text-primary/90" />
                         }}
                      >
                        {part.text}
                      </ReactMarkdown>
                    )}
                  </div>
                ))}
                
                {/* Custom Widget Rendering */}
                {msg.widget && msg.widget.type === 'taskList' && <TaskWidget data={msg.widget.data} />}
                {msg.widget && msg.widget.type === 'taskCard' && <TaskWidget data={msg.widget.data} />}
                {msg.widget && msg.widget.type === 'rescuePlan' && <RescueWidget data={msg.widget.data} />}
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex gap-3 flex-row">
              <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0 mt-1">
                <BrainCircuit size={16} />
              </div>
              <div className="p-4 rounded-2xl rounded-tl-none bg-bg border border-border text-text text-sm flex gap-1 items-center">
                <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Chips */}
        {messages.length <= 1 && (
          <div className="px-4 pb-2 flex flex-wrap gap-2">
            {SUGGESTIONS.map((sug, idx) => (
              <button 
                key={idx}
                onClick={() => sendMessage(sug.text)}
                className="text-[11px] font-bold bg-bg hover:bg-primary/10 border border-border hover:border-primary/30 text-text-muted hover:text-primary px-3 py-1.5 rounded-full transition-colors flex items-center gap-1.5"
              >
                <span>{sug.icon}</span> {sug.text}
              </button>
            ))}
          </div>
        )}

        {/* Input Area */}
        <div className="p-4 border-t border-border/50 bg-surface/50 shrink-0">
          <form 
            onSubmit={(e) => { e.preventDefault(); sendMessage(input); }}
            className="flex items-center gap-2 bg-bg border border-border rounded-xl p-1.5 focus-within:ring-2 focus-within:ring-primary/50 transition-all shadow-inner"
          >
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Guardian AI..." 
              className="flex-1 bg-transparent border-none focus:outline-none px-3 text-sm text-text placeholder:text-text-muted/50"
            />
            <button 
              type="submit" 
              disabled={!input.trim() || isLoading}
              className="p-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
