import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  HelpCircle, 
  MessageSquare, 
  Send, 
  CheckCircle2, 
  Clock, 
  ChevronDown, 
  ChevronUp, 
  ShieldCheck, 
  Plus, 
  PhoneCall, 
  Mail, 
  Sparkles,
  Volume2,
  VolumeX,
  Bot,
  Copy,
  Check,
  Download,
  Share2,
  RefreshCw,
  FileText,
  User,
  PlayCircle,
  Pause,
  Video
} from 'lucide-react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  doc, 
  updateDoc, 
  arrayUnion 
} from 'firebase/firestore';

import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { SupportTicket, ChatMessage } from '../types';
import { DEFAULT_FAQS } from '../lib/defaultData';
import { DedicatedFAQ } from './DedicatedFAQ';

// Web Audio API sound synthesizer for subtle message notification
function playMessageChime(isAi: boolean = false) {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;
    
    if (isAi) {
      // Soft AI chime (C5 to G5)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(523.25, now);
      gain1.gain.setValueAtTime(0.08, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.25);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(783.99, now + 0.08);
      gain2.gain.setValueAtTime(0.08, now + 0.08);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.08);
      osc2.stop(now + 0.35);
    } else {
      // Soft Admin chime (D5 to A5)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now);
      gain1.gain.setValueAtTime(0.12, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.22);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880, now + 0.08);
      gain2.gain.setValueAtTime(0.12, now + 0.08);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.08);
      osc2.stop(now + 0.32);
    }
  } catch (err) {
    console.warn('AudioContext notification sound error:', err);
  }
}

export const SupportHelpCenter: React.FC = () => {
  const { firebaseUser, userProfile } = useAuth();

  const [activeTab, setActiveTab] = useState<'faq' | 'ai_chat' | 'tickets'>('faq');
  const [searchQuery, setSearchQuery] = useState('');

  // Tickets state
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [activeTicket, setActiveTicket] = useState<SupportTicket | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [showNewTicketModal, setShowNewTicketModal] = useState(false);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [enableAiAutoReply, setEnableAiAutoReply] = useState(true);
  const [copiedTranscript, setCopiedTranscript] = useState(false);

  // Video Walkthrough Modal State
  const [showDepositVideoModal, setShowDepositVideoModal] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(true);
  const [activeVideoStep, setActiveVideoStep] = useState<number>(1);
  const [isVideoMuted, setIsVideoMuted] = useState(false);

  // Standalone Direct AI Chat State
  const [aiDirectMessages, setAiDirectMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-ai-msg',
      sender: 'ai',
      senderName: '🤖 AI Live Assistant',
      text: 'Hello! I am your 24/7 AI Support Assistant powered by Gemini. Ask me any question about deposits, withdrawals, JazzCash/EasyPaisa TIDs, profit plans, or referral bonuses!',
      timestamp: Date.now(),
      isAiGenerated: true,
    }
  ]);
  const [aiDirectInput, setAiDirectInput] = useState('');
  const [aiDirectThinking, setAiDirectThinking] = useState(false);

  // New Ticket Form State
  const [newSubject, setNewSubject] = useState('');
  const [newCategory, setNewCategory] = useState('Payment Issue');
  const [newMessage, setNewMessage] = useState('');
  const [submittingTicket, setSubmittingTicket] = useState(false);

  // Track previous message count per ticket to trigger Web Audio chime
  const prevMsgCountsRef = useRef<Record<string, number>>({});
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Scroll chat to bottom when active ticket or messages update
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeTicket?.messages, aiDirectMessages, isAiThinking, aiDirectThinking]);

  // Subscribe to User Tickets from Firestore
  useEffect(() => {
    if (!firebaseUser) return;

    const q = query(
      collection(db, 'tickets'),
      where('userId', '==', firebaseUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tks: SupportTicket[] = snapshot.docs
        .map(docSnap => ({
          id: docSnap.id,
          ...docSnap.data()
        } as SupportTicket))
        .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));

      // Check for new admin/ai messages to play audio chime
      tks.forEach(ticket => {
        const prevCount = prevMsgCountsRef.current[ticket.id] || 0;
        const currentCount = ticket.messages?.length || 0;

        if (currentCount > prevCount && prevCount > 0) {
          const lastMsg = ticket.messages[currentCount - 1];
          if (lastMsg && (lastMsg.sender === 'admin' || lastMsg.sender === 'ai')) {
            playMessageChime(lastMsg.sender === 'ai');
          }
        }
        prevMsgCountsRef.current[ticket.id] = currentCount;
      });

      setTickets(tks);
      
      if (activeTicket) {
        const updated = tks.find(t => t.id === activeTicket.id);
        if (updated) setActiveTicket(updated);
      } else if (tks.length > 0 && !activeTicket) {
        setActiveTicket(tks[0]);
      }
    }, (err) => {
      console.warn('Error listening to support tickets:', err);
    });

    return () => unsubscribe();
  }, [firebaseUser]);

  // Helper to fetch AI response from server
  const fetchAiResponse = async (userMsgText: string, history: ChatMessage[], subjectContext?: string) => {
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsgText,
          history: history.slice(-6),
          ticketSubject: subjectContext || 'General Inquiry',
          userName: userProfile?.fullName || 'User',
          userEmail: userProfile?.email || '',
        }),
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const data = await res.json();
      return data.reply || data.fallbackReply || 'Our admin team will review your message shortly.';
    } catch (err) {
      console.error('AI chat endpoint call failed:', err);
      return 'Thank you for reaching out! Our official admin support team has received your ticket and will respond to you directly.';
    }
  };

  // Create New Ticket (with instant AI auto-reply saved to Firestore)
  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firebaseUser || !userProfile) return;
    if (!newSubject.trim() || !newMessage.trim()) return;

    setSubmittingTicket(true);

    try {
      const userMsg: ChatMessage = {
        id: `msg-${Date.now()}`,
        sender: 'user',
        senderName: userProfile.fullName,
        text: newMessage,
        timestamp: Date.now()
      };

      const ticketData: Omit<SupportTicket, 'id'> = {
        userId: firebaseUser.uid,
        userEmail: userProfile.email,
        userName: userProfile.fullName,
        userPhone: userProfile.phone,
        subject: newSubject,
        category: newCategory,
        status: 'open',
        messages: [userMsg],
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      const docRef = await addDoc(collection(db, 'tickets'), ticketData);
      const ticketId = docRef.id;

      setNewSubject('');
      setNewMessage('');
      setShowNewTicketModal(false);
      setActiveTab('tickets');

      // If AI auto-reply is enabled, generate AI response and save to Firestore
      if (enableAiAutoReply) {
        setIsAiThinking(true);
        const aiReplyText = await fetchAiResponse(userMsg.text, [userMsg], newSubject);
        
        const aiMsg: ChatMessage = {
          id: `msg-ai-${Date.now()}`,
          sender: 'ai',
          senderName: '🤖 AI Support Assistant',
          text: aiReplyText,
          timestamp: Date.now(),
          isAiGenerated: true,
        };

        const ticketRef = doc(db, 'tickets', ticketId);
        await updateDoc(ticketRef, {
          messages: arrayUnion(aiMsg),
          updatedAt: Date.now()
        });
        setIsAiThinking(false);
      }
    } catch (err) {
      console.error('Error creating ticket:', err);
    } finally {
      setSubmittingTicket(false);
      setIsAiThinking(false);
    }
  };

  // Send message in existing ticket (with instant AI auto-reply)
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTicket || !chatInput.trim() || !userProfile) return;

    const msgText = chatInput.trim();
    setChatInput('');

    try {
      const ticketRef = doc(db, 'tickets', activeTicket.id);
      const userMsg: ChatMessage = {
        id: `msg-${Date.now()}`,
        sender: 'user',
        senderName: userProfile.fullName,
        text: msgText,
        timestamp: Date.now()
      };

      // 1. Save user message to Firestore
      await updateDoc(ticketRef, {
        messages: arrayUnion(userMsg),
        status: 'open',
        updatedAt: Date.now()
      });

      // 2. If AI Auto reply is enabled, generate AI response and append to Firestore
      if (enableAiAutoReply) {
        setIsAiThinking(true);
        const existingMessages = [...(activeTicket.messages || []), userMsg];
        const aiReplyText = await fetchAiResponse(msgText, existingMessages, activeTicket.subject);

        const aiMsg: ChatMessage = {
          id: `msg-ai-${Date.now()}`,
          sender: 'ai',
          senderName: '🤖 AI Support Assistant',
          text: aiReplyText,
          timestamp: Date.now(),
          isAiGenerated: true,
        };

        await updateDoc(ticketRef, {
          messages: arrayUnion(aiMsg),
          updatedAt: Date.now()
        });
        setIsAiThinking(false);
      }
    } catch (err) {
      console.error('Error sending message:', err);
      setIsAiThinking(false);
    }
  };

  // Send message in Direct AI Chatbot
  const handleSendAiDirect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiDirectInput.trim()) return;

    const text = aiDirectInput.trim();
    setAiDirectInput('');

    const userMsg: ChatMessage = {
      id: `ai-dir-${Date.now()}`,
      sender: 'user',
      senderName: userProfile?.fullName || 'You',
      text,
      timestamp: Date.now(),
    };

    const newHistory = [...aiDirectMessages, userMsg];
    setAiDirectMessages(newHistory);
    setAiDirectThinking(true);

    const aiReplyText = await fetchAiResponse(text, newHistory, 'Direct AI Chat');

    const aiMsg: ChatMessage = {
      id: `ai-reply-${Date.now()}`,
      sender: 'ai',
      senderName: '🤖 AI Live Assistant',
      text: aiReplyText,
      timestamp: Date.now(),
      isAiGenerated: true,
    };

    setAiDirectMessages(prev => [...prev, aiMsg]);
    setAiDirectThinking(false);
    playMessageChime(true);
  };

  // Escalate / Transfer Direct AI Chat into Official Admin Ticket
  const handleEscalateAiChatToTicket = async () => {
    if (!firebaseUser || !userProfile || aiDirectMessages.length <= 1) return;

    setSubmittingTicket(true);
    try {
      const firstUserMsg = aiDirectMessages.find(m => m.sender === 'user')?.text || 'AI Live Chat Inquiry';
      const ticketData: Omit<SupportTicket, 'id'> = {
        userId: firebaseUser.uid,
        userEmail: userProfile.email,
        userName: userProfile.fullName,
        userPhone: userProfile.phone,
        subject: `AI Chat Escalation: ${firstUserMsg.slice(0, 40)}...`,
        category: 'AI Chat Escalation',
        status: 'open',
        messages: aiDirectMessages,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      await addDoc(collection(db, 'tickets'), ticketData);
      setActiveTab('tickets');
    } catch (err) {
      console.error('Error escalating AI chat to ticket:', err);
    } finally {
      setSubmittingTicket(false);
    }
  };

  // Copy Whole Chat Transcript
  const handleCopyTranscript = (ticket: SupportTicket) => {
    if (!ticket || !ticket.messages) return;
    const header = `--- OFFICIAL SUPPORT CHAT TRANSCRIPT ---\nTicket ID: ${ticket.id}\nUser: ${ticket.userName} (${ticket.userEmail})\nSubject: ${ticket.subject}\nDate: ${new Date(ticket.createdAt).toLocaleString()}\n\n`;
    const body = ticket.messages
      .map(m => `[${new Date(m.timestamp).toLocaleTimeString()}] ${m.senderName || m.sender}: ${m.text}`)
      .join('\n\n');
    
    navigator.clipboard.writeText(header + body);
    setCopiedTranscript(true);
    setTimeout(() => setCopiedTranscript(false), 2500);
  };

  // Download Transcript File
  const handleDownloadTranscript = (ticket: SupportTicket) => {
    if (!ticket || !ticket.messages) return;
    const header = `--- OFFICIAL SUPPORT CHAT TRANSCRIPT ---\nTicket ID: ${ticket.id}\nUser: ${ticket.userName} (${ticket.userEmail})\nSubject: ${ticket.subject}\nDate: ${new Date(ticket.createdAt).toLocaleString()}\n\n`;
    const body = ticket.messages
      .map(m => `[${new Date(m.timestamp).toLocaleTimeString()}] ${m.senderName || m.sender}: ${m.text}`)
      .join('\n\n');

    const blob = new Blob([header + body], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ticket-${ticket.id.slice(0, 8)}-chat-transcript.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Searchable Header */}
      <div className="relative bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 border border-emerald-500/30 rounded-3xl p-6 md:p-8 text-center overflow-hidden shadow-2xl">
        <div className="max-w-2xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
            <Sparkles className="w-4 h-4 text-emerald-400" /> AI-Powered 24/7 Support Hub
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white">
            How can we help you today?
          </h1>
          <p className="text-xs text-slate-400">
            Chat instantly with our 24/7 AI Assistant, search help guides, or talk to Admin Support with real-time chat sharing.
          </p>

          {/* Search Box */}
          <div className="relative max-w-xl mx-auto">
            <Search className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search help articles (e.g. JazzCash TID, withdrawal time, promo codes)..."
              className="w-full bg-slate-950/90 border border-slate-700 focus:border-emerald-500 rounded-2xl py-3 pl-11 pr-4 text-xs md:text-sm text-white placeholder-slate-500 outline-none shadow-xl transition-all"
            />
          </div>
        </div>
      </div>

      {/* Navigation Switch */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveTab('faq')}
            className={`px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all ${
              activeTab === 'faq'
                ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <HelpCircle className="w-4 h-4" /> Knowledge Base & FAQ
          </button>

          <button
            onClick={() => setActiveTab('ai_chat')}
            className={`px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all ${
              activeTab === 'ai_chat'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30 border border-purple-400/30'
                : 'bg-slate-900 text-purple-300 hover:text-white border border-slate-800'
            }`}
          >
            <Bot className="w-4 h-4 text-purple-400 animate-pulse" /> 🤖 AI Chatbot 24/7
          </button>

          <button
            onClick={() => setActiveTab('tickets')}
            className={`px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all ${
              activeTab === 'tickets'
                ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <MessageSquare className="w-4 h-4" /> Live Support Tickets ({tickets.length})
          </button>

          <button
            onClick={() => setShowDepositVideoModal(true)}
            className="px-4 py-2.5 rounded-xl text-xs font-black bg-rose-600/90 hover:bg-rose-500 text-white flex items-center gap-2 border border-rose-400/40 shadow-lg shadow-rose-600/20 transition-all"
          >
            <PlayCircle className="w-4 h-4 text-rose-300 animate-pulse" /> 🎥 Deposit Video Walkthrough
          </button>
        </div>

        <button
          onClick={() => setShowNewTicketModal(true)}
          className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow-md shadow-amber-500/10 active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" /> Open New Ticket
        </button>
      </div>

      {/* FAQ SECTION */}
      {activeTab === 'faq' && (
        <DedicatedFAQ
          onOpenTicket={() => setShowNewTicketModal(true)}
          initialSearchQuery={searchQuery}
        />
      )}

      {/* DIRECT AI CHATBOT TAB */}
      {activeTab === 'ai_chat' && (
        <div className="bg-slate-900 border border-purple-500/30 rounded-3xl flex flex-col h-[550px] overflow-hidden shadow-2xl">
          {/* Header */}
          <div className="p-4 bg-slate-950 border-b border-purple-500/20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-300">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  Gemini AI Support Chatbot
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    Online 24/7
                  </span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  Instant automated assistance for deposits, withdrawals, promo codes & plans.
                </p>
              </div>
            </div>

            <button
              onClick={handleEscalateAiChatToTicket}
              disabled={submittingTicket || aiDirectMessages.length <= 1}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-md transition-all disabled:opacity-50"
            >
              <Share2 className="w-3.5 h-3.5" /> Share & Transfer to Admin
            </button>
          </div>

          {/* Messages Thread */}
          <div className="flex-1 p-4 space-y-3.5 overflow-y-auto bg-slate-950/50">
            {aiDirectMessages.map((m) => {
              const isAi = m.sender === 'ai';
              return (
                <div
                  key={m.id}
                  className={`flex flex-col ${isAi ? 'items-start' : 'items-end'}`}
                >
                  <div
                    className={`max-w-[85%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                      isAi
                        ? 'bg-purple-950/40 border border-purple-500/30 text-purple-100 rounded-tl-none shadow-md'
                        : 'bg-emerald-600 text-white rounded-tr-none shadow-md'
                    }`}
                  >
                    <div className="font-bold text-[10px] mb-1 opacity-80 font-mono flex items-center gap-1">
                      {isAi ? <Bot className="w-3.5 h-3.5 text-purple-300" /> : <User className="w-3.5 h-3.5" />}
                      {m.senderName}
                    </div>
                    <div className="whitespace-pre-line">{m.text}</div>
                    <div className="text-[9px] opacity-60 text-right mt-1.5 font-mono">
                      {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              );
            })}

            {aiDirectThinking && (
              <div className="flex items-start gap-2 text-purple-400 text-xs font-medium animate-pulse">
                <Bot className="w-4 h-4 animate-spin" /> Gemini AI Assistant is analyzing your query...
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Input Form */}
          <form onSubmit={handleSendAiDirect} className="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2">
            <input
              type="text"
              value={aiDirectInput}
              onChange={(e) => setAiDirectInput(e.target.value)}
              placeholder="Ask AI anything about deposits, withdrawals, JazzCash TID..."
              className="flex-1 bg-slate-900 border border-purple-500/30 focus:border-purple-400 rounded-xl py-3 px-4 text-xs text-white placeholder-slate-500 outline-none"
            />
            <button
              type="submit"
              disabled={aiDirectThinking || !aiDirectInput.trim()}
              className="bg-purple-600 hover:bg-purple-500 text-white p-3 rounded-xl font-bold transition-all shrink-0 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {/* TICKETS & LIVE CHAT SECTION */}
      {activeTab === 'tickets' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Ticket List */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 h-[520px] overflow-y-auto">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2 flex items-center justify-between">
              <span>Your Tickets ({tickets.length})</span>
            </h3>

            {tickets.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs">
                No support tickets found. Click "Open New Ticket" to start live chat.
              </div>
            ) : (
              tickets.map((t) => {
                const isSelected = activeTicket?.id === t.id;
                const lastMsg = t.messages?.[t.messages.length - 1];

                return (
                  <button
                    key={t.id}
                    onClick={() => setActiveTicket(t)}
                    className={`w-full p-3.5 rounded-xl text-left border transition-all ${
                      isSelected
                        ? 'bg-slate-800 border-emerald-500/50 shadow-md'
                        : 'bg-slate-950/60 border-slate-800 hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-white truncate max-w-[150px]">{t.subject}</span>
                      {t.status === 'resolved' ? (
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                          Resolved
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                          Active Chat
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 truncate">
                      {lastMsg?.text || 'No messages'}
                    </p>
                    <div className="flex items-center justify-between mt-1.5">
                      <span className="text-[9px] text-slate-500 font-mono">
                        {new Date(t.updatedAt).toLocaleTimeString()}
                      </span>
                      {t.messages?.some(m => m.sender === 'ai') && (
                        <span className="text-[9px] text-purple-300 font-bold flex items-center gap-1">
                          <Bot className="w-3 h-3" /> AI Synced
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Right Live Chat View */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col h-[520px] overflow-hidden">
            {activeTicket ? (
              <>
                {/* Chat Header */}
                <div className="p-3.5 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-white">{activeTicket.subject}</h3>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                        {activeTicket.category}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      ID: <span className="font-mono text-emerald-400">{activeTicket.id}</span> • Synced to Admin Panel in Real-time
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Toggle AI Auto-Reply */}
                    <button
                      onClick={() => setEnableAiAutoReply(!enableAiAutoReply)}
                      title="Toggle AI Auto-Reply Chatbot"
                      className={`px-2.5 py-1 rounded-xl text-[10px] font-bold flex items-center gap-1 transition-all ${
                        enableAiAutoReply
                          ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      <Bot className="w-3 h-3 text-purple-400" />
                      AI Chatbot: {enableAiAutoReply ? 'ON' : 'OFF'}
                    </button>

                    {/* Copy Transcript */}
                    <button
                      onClick={() => handleCopyTranscript(activeTicket)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold flex items-center gap-1"
                      title="Copy Whole Chat Transcript"
                    >
                      {copiedTranscript ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>

                    {/* Download Transcript */}
                    <button
                      onClick={() => handleDownloadTranscript(activeTicket)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold flex items-center gap-1"
                      title="Download Whole Chat File"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Message Thread */}
                <div className="flex-1 p-4 space-y-3.5 overflow-y-auto bg-slate-950/40">
                  {activeTicket.messages?.map((m) => {
                    const isAdminMsg = m.sender === 'admin';
                    const isAiMsg = m.sender === 'ai' || m.sender === 'bot';

                    return (
                      <div
                        key={m.id}
                        className={`flex flex-col ${
                          isAdminMsg
                            ? 'items-start'
                            : isAiMsg
                            ? 'items-start'
                            : 'items-end'
                        }`}
                      >
                        <div
                          className={`max-w-[85%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                            isAdminMsg
                              ? 'bg-amber-500/20 border border-amber-500/30 text-amber-100 rounded-tl-none'
                              : isAiMsg
                              ? 'bg-purple-950/40 border border-purple-500/30 text-purple-100 rounded-tl-none'
                              : 'bg-emerald-600 text-white rounded-tr-none shadow-md'
                          }`}
                        >
                          <div className="font-bold text-[10px] mb-1 opacity-90 font-mono flex items-center gap-1">
                            {isAdminMsg && <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />}
                            {isAiMsg && <Bot className="w-3.5 h-3.5 text-purple-300" />}
                            {!isAdminMsg && !isAiMsg && <User className="w-3.5 h-3.5" />}
                            {isAdminMsg ? '🛡️ Official Admin Support' : isAiMsg ? '🤖 AI Support Assistant' : m.senderName || 'You'}
                          </div>
                          <div className="whitespace-pre-line">{m.text}</div>
                          <div className="text-[9px] opacity-60 text-right mt-1.5 font-mono">
                            {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {isAiThinking && (
                    <div className="flex items-center gap-2 text-purple-400 text-xs font-medium animate-pulse">
                      <Bot className="w-4 h-4 animate-spin" /> AI Support Assistant is responding...
                    </div>
                  )}

                  <div ref={chatBottomRef} />
                </div>

                {/* Message Input Form */}
                <form onSubmit={handleSendMessage} className="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Type your question to AI & Admin Support..."
                    className="flex-1 bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl py-2.5 px-4 text-xs text-white outline-none"
                  />
                  <button
                    type="submit"
                    disabled={isAiThinking || !chatInput.trim()}
                    className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 p-2.5 rounded-xl font-bold transition-all shrink-0 disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-slate-500 text-xs">
                Select a ticket on the left or create a new ticket to chat with Admin.
              </div>
            )}
          </div>

        </div>
      )}

      {/* NEW TICKET MODAL */}
      {showNewTicketModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 text-slate-100 shadow-2xl">
            <button
              onClick={() => setShowNewTicketModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              ✕
            </button>

            <h3 className="text-lg font-black text-white mb-1">Open Admin Support Ticket</h3>
            <p className="text-xs text-slate-400 mb-4">Our AI Chatbot responds instantly and Admin monitors in real time.</p>

            <form onSubmit={handleCreateTicket} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2 px-3 text-xs text-white outline-none"
                >
                  <option value="Deposit Issue">Deposit Issue (JazzCash/EasyPaisa)</option>
                  <option value="Withdrawal Issue">Withdrawal Issue</option>
                  <option value="Account & Login">Account & Login</option>
                  <option value="Promo Code">Promo Code Query</option>
                  <option value="Other">Other Query</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Subject</label>
                <input
                  type="text"
                  required
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  placeholder="e.g. JazzCash Deposit Pending TID 991823"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2.5 px-3 text-xs text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Detailed Message</label>
                <textarea
                  required
                  rows={4}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Include transaction ID, sender phone number, or details of your issue..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-white outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={submittingTicket}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-3 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg"
              >
                {submittingTicket ? 'Submitting Ticket...' : 'Send Message & Start Live Chat'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* DEPOSIT WALKTHROUGH VIDEO MODAL */}
      {showDepositVideoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-slate-900 border border-emerald-500/30 rounded-3xl p-6 text-slate-100 shadow-2xl space-y-5 my-8">
            <button
              onClick={() => setShowDepositVideoModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-full bg-slate-800"
            >
              ✕
            </button>

            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
                <Video className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">Deposit Video Walkthrough Guide</h3>
                <p className="text-xs text-slate-400">Step-by-step video tutorial on making JazzCash & EasyPaisa deposits.</p>
              </div>
            </div>

            {/* Video Player Canvas / Frame */}
            <div className="relative aspect-video w-full bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden flex flex-col justify-between p-4 shadow-inner">
              
              {/* Simulated Video Canvas Content */}
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-gradient-to-br from-slate-950 via-emerald-950/40 to-slate-950 text-center">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-emerald-300 shadow-lg mb-3 animate-pulse">
                  <PlayCircle className="w-10 h-10" />
                </div>

                <span className="text-[10px] font-mono px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold mb-2">
                  STEP {activeVideoStep} OF 5 IN PROGRESS
                </span>

                <h4 className="text-sm md:text-base font-black text-white max-w-md">
                  {activeVideoStep === 1 && "1. Tap 'Deposit' and Choose Payment Method"}
                  {activeVideoStep === 2 && "2. Select JazzCash Till or EasyPaisa Account"}
                  {activeVideoStep === 3 && "3. Send Exact Amount via JazzCash/EasyPaisa App"}
                  {activeVideoStep === 4 && "4. Copy the 11-Digit Transaction ID (TID) SMS"}
                  {activeVideoStep === 5 && "5. Paste TID in App & Click Submit Payment"}
                </h4>

                <p className="text-xs text-slate-400 mt-2 max-w-sm">
                  {activeVideoStep === 1 && "Navigate to your User Dashboard and click the green 'Deposit' button at the top."}
                  {activeVideoStep === 2 && "Choose your preferred payment gateway: JazzCash Till Payment or EasyPaisa Personal Account."}
                  {activeVideoStep === 3 && "Open your JazzCash or EasyPaisa app on your phone and send the exact PKR deposit amount."}
                  {activeVideoStep === 4 && "Check your SMS receipt from 8558 or 3737 to locate the unique 11-digit TID."}
                  {activeVideoStep === 5 && "Return to PAK INVESTMENT app, paste the TID, and click Submit. Your balance will credit automatically!"}
                </p>
              </div>

              {/* Video Player Top Bar */}
              <div className="relative z-10 flex items-center justify-between text-xs font-mono text-slate-300 bg-black/60 backdrop-blur p-2 rounded-xl">
                <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" /> HD WALKTHROUGH
                </span>
                <span>PAK INVESTMENT X EARNING</span>
              </div>

              {/* Video Player Controls Bar */}
              <div className="relative z-10 flex items-center justify-between gap-3 text-xs bg-black/70 backdrop-blur p-2.5 rounded-xl border border-slate-800">
                <button
                  onClick={() => setIsVideoPlaying(!isVideoPlaying)}
                  className="p-1.5 rounded-lg bg-emerald-500 text-slate-950 font-bold hover:bg-emerald-400 transition-all"
                >
                  {isVideoPlaying ? <Pause className="w-4 h-4" /> : <PlayCircle className="w-4 h-4" />}
                </button>

                {/* Progress Bar */}
                <div className="flex-1 bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-400 h-full transition-all duration-300"
                    style={{ width: `${(activeVideoStep / 5) * 100}%` }}
                  />
                </div>

                <button
                  onClick={() => setIsVideoMuted(!isVideoMuted)}
                  className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
                >
                  {isVideoMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
              </div>

            </div>

            {/* Interactive Step Jump Buttons */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 block">Interactive Walkthrough Steps:</label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    onClick={() => setActiveVideoStep(s)}
                    className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all text-center ${
                      activeVideoStep === s
                        ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    Step {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Written Guide Summary */}
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl text-xs space-y-2 text-slate-300">
              <h5 className="font-bold text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Quick Deposit Checklist:
              </h5>
              <ul className="list-disc list-inside space-y-1 text-slate-400">
                <li>Minimum deposit requirement is <strong className="text-white font-mono">100 PKR</strong>.</li>
                <li>Make sure to double-check the 11-digit Transaction ID (TID) before submitting.</li>
                <li>Admin verifies and approves deposits 24/7 with average completion under 10 minutes.</li>
              </ul>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
