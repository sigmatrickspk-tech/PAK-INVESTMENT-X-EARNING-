import React, { useState, useEffect } from 'react';
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
  Sparkles 
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
import { SupportTicket, FAQItem } from '../types';
import { DEFAULT_FAQS } from '../lib/defaultData';
import { DedicatedFAQ } from './DedicatedFAQ';

export const SupportHelpCenter: React.FC = () => {
  const { firebaseUser, userProfile, systemConfig } = useAuth();

  const [activeTab, setActiveTab] = useState<'faq' | 'tickets'>('faq');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [expandedFaqId, setExpandedFaqId] = useState<string | null>('faq-1');

  // Tickets state
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [activeTicket, setActiveTicket] = useState<SupportTicket | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [showNewTicketModal, setShowNewTicketModal] = useState(false);
  
  // New Ticket Form
  const [newSubject, setNewSubject] = useState('');
  const [newCategory, setNewCategory] = useState('Payment Issue');
  const [newMessage, setNewMessage] = useState('');
  const [submittingTicket, setSubmittingTicket] = useState(false);

  // Subscribe to User Tickets
  useEffect(() => {
    if (!firebaseUser) return;

    const q = query(
      collection(db, 'tickets'),
      where('userId', '==', firebaseUser.uid),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tks: SupportTicket[] = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      } as SupportTicket));
      setTickets(tks);
      
      // Update active ticket in real time if selected
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

  const categories = ['All', 'Deposits', 'Withdrawals', 'Earnings', 'Support', 'Promo Codes'];

  const filteredFaqs = DEFAULT_FAQS.filter(faq => {
    const matchesCat = selectedCategory === 'All' || faq.category === selectedCategory;
    const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firebaseUser || !userProfile) return;

    if (!newSubject.trim() || !newMessage.trim()) return;

    setSubmittingTicket(true);

    try {
      const ticketData: Omit<SupportTicket, 'id'> = {
        userId: firebaseUser.uid,
        userEmail: userProfile.email,
        userName: userProfile.fullName,
        userPhone: userProfile.phone,
        subject: newSubject,
        category: newCategory,
        status: 'open',
        messages: [
          {
            id: `msg-${Date.now()}`,
            sender: 'user',
            senderName: userProfile.fullName,
            text: newMessage,
            timestamp: Date.now()
          }
        ],
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      const docRef = await addDoc(collection(db, 'tickets'), ticketData);
      setNewSubject('');
      setNewMessage('');
      setShowNewTicketModal(false);
      setActiveTab('tickets');
    } catch (err) {
      console.error('Error creating ticket:', err);
    } finally {
      setSubmittingTicket(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTicket || !chatInput.trim() || !userProfile) return;

    const msgText = chatInput.trim();
    setChatInput('');

    try {
      const ticketRef = doc(db, 'tickets', activeTicket.id);
      const newMsg = {
        id: `msg-${Date.now()}`,
        sender: 'user',
        senderName: userProfile.fullName,
        text: msgText,
        timestamp: Date.now()
      };

      await updateDoc(ticketRef, {
        messages: arrayUnion(newMsg),
        status: 'open',
        updatedAt: Date.now()
      });
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Searchable Header */}
      <div className="relative bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 border border-emerald-500/30 rounded-3xl p-6 md:p-8 text-center overflow-hidden">
        <div className="max-w-2xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold">
            <HelpCircle className="w-4 h-4" /> Official 24/7 Support Center
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white">
            How can we help you today?
          </h1>
          <p className="text-xs text-slate-400">
            Search our knowledge base for deposit, withdrawal & account guides or open a live ticket with Admin Support.
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
      <div className="flex items-center justify-between gap-4 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('faq')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all ${
              activeTab === 'faq'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <HelpCircle className="w-4 h-4" /> FAQ & Help Center
          </button>

          <button
            onClick={() => setActiveTab('tickets')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all ${
              activeTab === 'tickets'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <MessageSquare className="w-4 h-4" /> My Support Tickets ({tickets.length})
          </button>
        </div>

        <button
          onClick={() => setShowNewTicketModal(true)}
          className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-md shadow-amber-500/10 active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" /> Open New Ticket
        </button>
      </div>

      {/* FAQ SECTION */}
      {activeTab === 'faq' && (
        <DedicatedFAQ onOpenTicket={() => setShowNewTicketModal(true)} />
      )}

      {/* TICKETS & LIVE CHAT SECTION */}
      {activeTab === 'tickets' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Ticket List */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 h-[500px] overflow-y-auto">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2">Your Tickets</h3>

            {tickets.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs">
                No support tickets found. Click "Open New Ticket" to message admin.
              </div>
            ) : (
              tickets.map((t) => {
                const isSelected = activeTicket?.id === t.id;
                const lastMsg = t.messages?.[t.messages.length - 1];

                return (
                  <button
                    key={t.id}
                    onClick={() => setActiveTicket(t)}
                    className={`w-full p-3 rounded-xl text-left border transition-all ${
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
                          Open
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 truncate">
                      {lastMsg?.text || 'No messages'}
                    </p>
                    <span className="text-[9px] text-slate-500 font-mono mt-1 block">
                      {new Date(t.updatedAt).toLocaleTimeString()}
                    </span>
                  </button>
                );
              })
            )}
          </div>

          {/* Right Live Chat View */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col h-[500px] overflow-hidden">
            {activeTicket ? (
              <>
                {/* Chat Header */}
                <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-white">{activeTicket.subject}</h3>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                        {activeTicket.category}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Ticket ID: <span className="font-mono text-emerald-400">{activeTicket.id}</span>
                    </p>
                  </div>

                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                    activeTicket.status === 'resolved'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  }`}>
                    {activeTicket.status === 'resolved' ? '● Resolved' : '● Admin Live Chat'}
                  </span>
                </div>

                {/* Message Thread */}
                <div className="flex-1 p-4 space-y-3 overflow-y-auto bg-slate-950/40">
                  {activeTicket.messages?.map((m) => {
                    const isAdminMsg = m.sender === 'admin';
                    return (
                      <div
                        key={m.id}
                        className={`flex flex-col ${isAdminMsg ? 'items-start' : 'items-end'}`}
                      >
                        <div
                          className={`max-w-[80%] p-3 rounded-2xl text-xs leading-relaxed ${
                            isAdminMsg
                              ? 'bg-amber-500/20 border border-amber-500/30 text-amber-100 rounded-tl-none'
                              : 'bg-emerald-600 text-white rounded-tr-none shadow-md'
                          }`}
                        >
                          <div className="font-bold text-[10px] mb-1 opacity-80 font-mono">
                            {isAdminMsg ? '🛡️ Admin Support' : m.senderName || 'You'}
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

                {/* Message Input Form */}
                <form onSubmit={handleSendMessage} className="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Type your message to Admin Support..."
                    className="flex-1 bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl py-2.5 px-4 text-xs text-white outline-none"
                  />
                  <button
                    type="submit"
                    className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 p-2.5 rounded-xl font-bold transition-all shrink-0"
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
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 text-slate-100">
            <button
              onClick={() => setShowNewTicketModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              ✕
            </button>

            <h3 className="text-lg font-black text-white mb-1">Open Admin Support Ticket</h3>
            <p className="text-xs text-slate-400 mb-4">State your issue and our team will resolve it quickly.</p>

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
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-3 rounded-xl text-xs flex items-center justify-center gap-2"
              >
                {submittingTicket ? 'Submitting...' : 'Send to Admin Support'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
