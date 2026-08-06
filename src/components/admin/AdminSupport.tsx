import React, { useState, useEffect } from 'react';
import { MessageSquare, Send, CheckCircle2, Clock, User, Phone, Mail, ShieldCheck } from 'lucide-react';
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
import { SupportTicket } from '../../types';

export const AdminSupport: React.FC = () => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTicket, setActiveTicket] = useState<SupportTicket | null>(null);
  const [replyText, setReplyText] = useState('');

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

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTicket || !replyText.trim()) return;

    const msg = replyText.trim();
    setReplyText('');

    try {
      const ticketRef = doc(db, 'tickets', activeTicket.id);
      const newMsg = {
        id: `msg-${Date.now()}`,
        sender: 'admin' as const,
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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-black text-white flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-emerald-400" /> Support Ticket Chat Hub
        </h2>
        <p className="text-xs text-slate-400">
          Chat with users in real-time and resolve payment or account inquiries.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Ticket List */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 h-[520px] overflow-y-auto">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2">
            Incoming Tickets ({tickets.length})
          </h3>

          {loading ? (
            <div className="py-12 text-center text-slate-500 text-xs">Loading support tickets...</div>
          ) : tickets.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">No active tickets submitted yet.</div>
          ) : (
            tickets.map((t) => {
              const isSelected = activeTicket?.id === t.id;
              const isResolved = t.status === 'resolved';

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

                  <span className="text-[9px] text-slate-500 font-mono mt-1.5 block">
                    Updated: {new Date(t.updatedAt).toLocaleString()}
                  </span>
                </button>
              );
            })
          )}
        </div>

        {/* Right Active Chat Hub */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col h-[520px] overflow-hidden">
          {activeTicket ? (
            <>
              {/* Header */}
              <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">{activeTicket.subject}</h3>
                  <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-0.5">
                    <span>User: <strong className="text-white">{activeTicket.userName}</strong></span>
                    <span>Email: <strong className="text-emerald-400 font-mono">{activeTicket.userEmail}</strong></span>
                    {activeTicket.userPhone && (
                      <span>Phone: <strong className="text-amber-300 font-mono">{activeTicket.userPhone}</strong></span>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => handleToggleResolve(activeTicket)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    activeTicket.status === 'resolved'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-emerald-500 text-slate-950 font-black'
                  }`}
                >
                  {activeTicket.status === 'resolved' ? 'Reopen Ticket' : 'Mark Resolved'}
                </button>
              </div>

              {/* Message List */}
              <div className="flex-1 p-4 space-y-3 overflow-y-auto bg-slate-950/40">
                {activeTicket.messages?.map((m) => {
                  const isAdmin = m.sender === 'admin';
                  return (
                    <div
                      key={m.id}
                      className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[80%] p-3 rounded-2xl text-xs leading-relaxed ${
                          isAdmin
                            ? 'bg-emerald-600 text-white rounded-tr-none shadow-md'
                            : 'bg-slate-800 border border-slate-700 text-slate-200 rounded-tl-none'
                        }`}
                      >
                        <div className="font-bold text-[10px] mb-1 opacity-80 font-mono">
                          {isAdmin ? '🛡️ Admin Support' : m.senderName || 'User'}
                        </div>
                        {m.text}
                        <div className="text-[9px] opacity-60 text-right mt-1 font-mono">
                          {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Reply Form */}
              <form onSubmit={handleSendReply} className="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2">
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type your administrative response to user..."
                  className="flex-1 bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl py-2.5 px-4 text-xs text-white outline-none"
                />
                <button
                  type="submit"
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-4 py-2.5 rounded-xl font-extrabold text-xs flex items-center gap-1 transition-all"
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
