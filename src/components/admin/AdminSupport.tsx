import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, 
  Send, 
  CheckCircle2, 
  Clock, 
  User, 
  Phone, 
  Mail, 
  ShieldCheck, 
  Bot, 
  Copy, 
  Check, 
  Download, 
  Sparkles, 
  Share2, 
  FileText,
  Search,
  RefreshCw
} from 'lucide-react';
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  doc, 
  updateDoc, 
  arrayUnion 
} from 'firebase/firestore';

import { db } from '../../lib/firebase';
import { SupportTicket, ChatMessage } from '../../types';

export const AdminSupport: React.FC = () => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTicket, setActiveTicket] = useState<SupportTicket | null>(null);
  const [replyText, setReplyText] = useState('');
  const [filterQuery, setFilterQuery] = useState('');
  const [copiedTranscript, setCopiedTranscript] = useState(false);
  
  // AI Summary State
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [generatingSummary, setGeneratingSummary] = useState(false);

  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = query(collection(db, 'tickets'), orderBy('updatedAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: SupportTicket[] = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      } as SupportTicket));
      setTickets(list);
      setLoading(false);

      if (activeTicket) {
        const updated = list.find(t => t.id === activeTicket.id);
        if (updated) setActiveTicket(updated);
      } else if (list.length > 0 && !activeTicket) {
        setActiveTicket(list[0]);
      }
    }, (err) => {
      console.error('Error fetching admin tickets:', err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    setAiSummary(null);
  }, [activeTicket?.id, activeTicket?.messages?.length]);

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTicket || !replyText.trim()) return;

    const msg = replyText.trim();
    setReplyText('');

    try {
      const ticketRef = doc(db, 'tickets', activeTicket.id);
      const newMsg: ChatMessage = {
        id: `msg-${Date.now()}`,
        sender: 'admin',
        senderName: 'Official Admin Support',
        text: msg,
        timestamp: Date.now()
      };

      await updateDoc(ticketRef, {
        messages: arrayUnion(newMsg),
        status: 'in_progress',
        updatedAt: Date.now()
      });
    } catch (err) {
      console.error('Error sending admin reply:', err);
    }
  };

  const handleToggleResolve = async (ticket: SupportTicket) => {
    try {
      const newStatus = ticket.status === 'resolved' ? 'open' : 'resolved';
      await updateDoc(doc(db, 'tickets', ticket.id), {
        status: newStatus,
        updatedAt: Date.now()
      });
    } catch (err) {
      console.error('Error resolving ticket:', err);
    }
  };

  // Copy Whole Chat Transcript to Clipboard
  const handleCopyTranscript = (ticket: SupportTicket) => {
    if (!ticket || !ticket.messages) return;
    const header = `========================================\nPAK INVESTMENT X EARNING - SUPPORT CHAT TRANSCRIPT\n========================================\nTicket ID: ${ticket.id}\nUser: ${ticket.userName} (${ticket.userEmail})\nPhone: ${ticket.userPhone || 'N/A'}\nSubject: ${ticket.subject}\nCategory: ${ticket.category}\nStatus: ${ticket.status.toUpperCase()}\nCreated At: ${new Date(ticket.createdAt).toLocaleString()}\n========================================\n\n`;
    
    const body = ticket.messages
      .map(m => `[${new Date(m.timestamp).toLocaleString()}] ${m.senderName || m.sender.toUpperCase()}:\n${m.text}`)
      .join('\n\n----------------------------------------\n');

    navigator.clipboard.writeText(header + body);
    setCopiedTranscript(true);
    setTimeout(() => setCopiedTranscript(false), 2500);
  };

  // Download Transcript File (.txt)
  const handleDownloadTranscript = (ticket: SupportTicket) => {
    if (!ticket || !ticket.messages) return;
    const header = `========================================\nPAK INVESTMENT X EARNING - SUPPORT CHAT TRANSCRIPT\n========================================\nTicket ID: ${ticket.id}\nUser: ${ticket.userName} (${ticket.userEmail})\nPhone: ${ticket.userPhone || 'N/A'}\nSubject: ${ticket.subject}\nCategory: ${ticket.category}\nStatus: ${ticket.status.toUpperCase()}\nCreated At: ${new Date(ticket.createdAt).toLocaleString()}\n========================================\n\n`;

    const body = ticket.messages
      .map(m => `[${new Date(m.timestamp).toLocaleString()}] ${m.senderName || m.sender.toUpperCase()}:\n${m.text}`)
      .join('\n\n----------------------------------------\n');

    const blob = new Blob([header + body], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `admin-ticket-${ticket.id.slice(0, 8)}-transcript.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Generate AI Executive Summary of Chat for Admin
  const handleGenerateAiSummary = async (ticket: SupportTicket) => {
    if (!ticket || !ticket.messages || ticket.messages.length === 0) return;

    setGeneratingSummary(true);
    try {
      const res = await fetch('/api/chat/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketSubject: ticket.subject,
          userName: ticket.userName,
          userEmail: ticket.userEmail,
          messages: ticket.messages,
        }),
      });

      if (!res.ok) throw new Error('Failed to generate summary');
      const data = await res.json();
      setAiSummary(data.summary || 'Summary unavailable');
    } catch (err) {
      console.error('Error getting AI chat summary:', err);
      setAiSummary('Failed to summarize ticket context.');
    } finally {
      setGeneratingSummary(false);
    }
  };

  const filteredTickets = tickets.filter(t => {
    if (!filterQuery.trim()) return true;
    const q = filterQuery.toLowerCase();
    return (
      t.subject.toLowerCase().includes(q) ||
      t.userEmail.toLowerCase().includes(q) ||
      t.userName.toLowerCase().includes(q) ||
      t.category.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-emerald-400" /> Support Ticket Chat Hub (Admin)
          </h2>
          <p className="text-xs text-slate-400">
            Real-time multi-agent support hub: User questions, AI Chatbot responses, and Admin live chat.
          </p>
        </div>

        {/* Filter / Search Bar */}
        <div className="relative min-w-[240px]">
          <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            placeholder="Search tickets by user, email..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Ticket List */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 h-[560px] overflow-y-auto">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2 flex items-center justify-between">
            <span>Incoming Tickets ({filteredTickets.length})</span>
          </h3>

          {loading ? (
            <div className="py-12 text-center text-slate-500 text-xs">Loading support tickets...</div>
          ) : filteredTickets.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">No active tickets matching search.</div>
          ) : (
            filteredTickets.map((t) => {
              const isSelected = activeTicket?.id === t.id;
              const isResolved = t.status === 'resolved';
              const hasAiMessages = t.messages?.some(m => m.sender === 'ai');

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
                    <span className="text-xs font-bold text-white truncate max-w-[140px]">{t.userName || 'User'}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isResolved
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}>
                      {isResolved ? 'Resolved' : 'Open'}
                    </span>
                  </div>

                  <p className="text-[11px] font-semibold text-emerald-300 truncate">{t.subject}</p>
                  <p className="text-[10px] text-slate-400 truncate mt-0.5">{t.userEmail}</p>

                  <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-800/50">
                    <span className="text-[9px] text-slate-500 font-mono">
                      {new Date(t.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {hasAiMessages && (
                      <span className="text-[9px] text-purple-300 bg-purple-500/10 px-1.5 py-0.5 rounded font-bold border border-purple-500/20 flex items-center gap-1">
                        <Bot className="w-2.5 h-2.5" /> AI Chat
                      </span>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Right Active Chat Hub */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col h-[560px] overflow-hidden shadow-xl">
          {activeTicket ? (
            <>
              {/* Header */}
              <div className="p-4 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-black text-white">{activeTicket.subject}</h3>
                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 mt-0.5">
                    <span>User: <strong className="text-white">{activeTicket.userName}</strong></span>
                    <span>Email: <strong className="text-emerald-400 font-mono">{activeTicket.userEmail}</strong></span>
                    {activeTicket.userPhone && (
                      <span>Phone: <strong className="text-amber-300 font-mono">{activeTicket.userPhone}</strong></span>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Share / Copy Transcript */}
                  <button
                    onClick={() => handleCopyTranscript(activeTicket)}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-all"
                    title="Copy Whole Chat Transcript to Clipboard"
                  >
                    {copiedTranscript ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedTranscript ? 'Copied!' : 'Copy Chat'}</span>
                  </button>

                  {/* Download Transcript */}
                  <button
                    onClick={() => handleDownloadTranscript(activeTicket)}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-all"
                    title="Download Whole Chat File (.txt)"
                  >
                    <Download className="w-3.5 h-3.5" /> Export
                  </button>

                  {/* AI Summarize Chat */}
                  <button
                    onClick={() => handleGenerateAiSummary(activeTicket)}
                    disabled={generatingSummary}
                    className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-purple-600/20 disabled:opacity-50"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{generatingSummary ? 'Summarizing...' : 'AI Summary'}</span>
                  </button>

                  {/* Toggle Resolve */}
                  <button
                    onClick={() => handleToggleResolve(activeTicket)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                      activeTicket.status === 'resolved'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                    }`}
                  >
                    {activeTicket.status === 'resolved' ? 'Reopen' : 'Resolve'}
                  </button>
                </div>
              </div>

              {/* AI Chat Summary Panel (If generated) */}
              {aiSummary && (
                <div className="p-3 bg-purple-950/40 border-b border-purple-500/30 text-xs text-purple-100 font-sans leading-relaxed flex items-start gap-2">
                  <Bot className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <strong className="text-purple-300 font-bold block mb-1">✨ AI Executive Chat Summary:</strong>
                    <div className="whitespace-pre-line text-[11px] text-slate-200">{aiSummary}</div>
                  </div>
                  <button onClick={() => setAiSummary(null)} className="text-slate-400 hover:text-white text-xs font-bold">✕</button>
                </div>
              )}

              {/* Message List */}
              <div className="flex-1 p-4 space-y-3.5 overflow-y-auto bg-slate-950/40">
                {activeTicket.messages?.map((m) => {
                  const isAdmin = m.sender === 'admin';
                  const isAi = m.sender === 'ai' || m.sender === 'bot';

                  return (
                    <div
                      key={m.id}
                      className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[85%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                          isAdmin
                            ? 'bg-emerald-600 text-white rounded-tr-none shadow-md'
                            : isAi
                            ? 'bg-purple-950/40 border border-purple-500/30 text-purple-100 rounded-tl-none shadow-sm'
                            : 'bg-slate-800 border border-slate-700 text-slate-200 rounded-tl-none'
                        }`}
                      >
                        <div className="font-bold text-[10px] mb-1 opacity-90 font-mono flex items-center gap-1">
                          {isAdmin && <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />}
                          {isAi && <Bot className="w-3.5 h-3.5 text-purple-300" />}
                          {!isAdmin && !isAi && <User className="w-3.5 h-3.5" />}
                          {isAdmin ? '🛡️ Admin Support' : isAi ? '🤖 AI Support Assistant' : m.senderName || 'User'}
                        </div>
                        <div className="whitespace-pre-line">{m.text}</div>
                        <div className="text-[9px] opacity-60 text-right mt-1.5 font-mono">
                          {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={chatBottomRef} />
              </div>

              {/* Reply Form */}
              <form onSubmit={handleSendReply} className="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2">
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type administrative reply to user in real-time..."
                  className="flex-1 bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl py-2.5 px-4 text-xs text-white outline-none"
                />
                <button
                  type="submit"
                  disabled={!replyText.trim()}
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-4 py-2.5 rounded-xl font-extrabold text-xs flex items-center gap-1 transition-all shrink-0 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" /> Send Reply
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-500 text-xs">
              Select a ticket on the left to review conversation.
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
