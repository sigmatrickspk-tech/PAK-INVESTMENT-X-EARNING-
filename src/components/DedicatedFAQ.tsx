import React, { useState } from 'react';
import { 
  Search, 
  HelpCircle, 
  ChevronDown, 
  ChevronUp, 
  ThumbsUp, 
  ThumbsDown, 
  PhoneCall, 
  MessageSquare, 
  ShieldCheck, 
  Sparkles,
  BookOpen
} from 'lucide-react';
import { DEFAULT_FAQS } from '../lib/defaultData';
import { useAuth } from '../context/AuthContext';

interface FAQProps {
  onOpenTicket?: () => void;
  initialSearchQuery?: string;
}

export const DedicatedFAQ: React.FC<FAQProps> = ({ onOpenTicket, initialSearchQuery = '' }) => {
  const { systemConfig } = useAuth();
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [expandedId, setExpandedId] = useState<string | null>('faq-1');
  const [helpfulFeedback, setHelpfulFeedback] = useState<Record<string, boolean>>({});

  React.useEffect(() => {
    if (initialSearchQuery !== undefined) {
      setSearchQuery(initialSearchQuery);
    }
  }, [initialSearchQuery]);

  const categories = ['All', 'Deposits', 'Withdrawals', 'Earnings', 'Support', 'Promo Codes'];

  const filteredFaqs = DEFAULT_FAQS.filter((faq) => {
    const matchesCategory = selectedCategory === 'All' || faq.category === selectedCategory;
    const matchesSearch =
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const toggleFeedback = (faqId: string, isHelpful: boolean) => {
    setHelpfulFeedback((prev) => ({ ...prev, [faqId]: isHelpful }));
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl">
      
      {/* FAQ Header & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold mb-2">
            <BookOpen className="w-3.5 h-3.5 text-amber-400" /> Platform Knowledge Base
          </div>
          <h2 className="text-xl md:text-2xl font-black text-white">
            Frequently Asked Questions
          </h2>
          <p className="text-xs text-slate-400">
            Find immediate answers regarding JazzCash/EasyPaisa transactions, profit schedules, and security rules.
          </p>
        </div>

        {/* Live Search Field */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search FAQs..."
            className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl py-2 pl-10 pr-3 text-xs text-white placeholder-slate-500 outline-none transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-white"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap items-center gap-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${
              selectedCategory === cat
                ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Accordion FAQ Items */}
      <div className="space-y-3">
        {filteredFaqs.length === 0 ? (
          <div className="p-8 text-center bg-slate-950/60 rounded-2xl border border-dashed border-slate-800 text-slate-400 text-xs">
            <HelpCircle className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            No answers matched your query "{searchQuery}". Contact admin support directly.
          </div>
        ) : (
          filteredFaqs.map((faq) => {
            const isExpanded = expandedId === faq.id;
            const feedback = helpfulFeedback[faq.id];

            return (
              <div
                key={faq.id}
                className={`border rounded-2xl overflow-hidden transition-all duration-200 ${
                  isExpanded
                    ? 'bg-slate-950/90 border-emerald-500/40 shadow-xl'
                    : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
                }`}
              >
                <button
                  onClick={() => setExpandedId(isExpanded ? null : faq.id)}
                  className="w-full p-4 md:p-5 text-left flex items-center justify-between gap-4 hover:bg-slate-900/40 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono font-black uppercase">
                      {faq.category}
                    </span>
                    <h3 className="text-sm font-bold text-white">{faq.question}</h3>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />
                  )}
                </button>

                {isExpanded && (
                  <div className="p-5 pt-2 text-xs text-slate-300 leading-relaxed border-t border-slate-800/80 bg-slate-900/30 space-y-4">
                    <p className="whitespace-pre-line">{faq.answer}</p>

                    {/* Feedback Rating */}
                    <div className="flex items-center justify-between pt-3 border-t border-slate-800/60 text-[11px] text-slate-400">
                      <span>Was this information helpful?</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleFeedback(faq.id, true)}
                          className={`p-1.5 rounded-lg border transition-colors flex items-center gap-1 ${
                            feedback === true
                              ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                              : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                          }`}
                        >
                          <ThumbsUp className="w-3.5 h-3.5" />
                          <span>Yes</span>
                        </button>
                        <button
                          onClick={() => toggleFeedback(faq.id, false)}
                          className={`p-1.5 rounded-lg border transition-colors flex items-center gap-1 ${
                            feedback === false
                              ? 'bg-rose-500/20 border-rose-500 text-rose-300'
                              : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                          }`}
                        >
                          <ThumbsDown className="w-3.5 h-3.5" />
                          <span>No</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Support Direct Banner */}
      <div className="bg-gradient-to-r from-emerald-950/40 via-slate-950 to-slate-950 border border-emerald-500/30 rounded-2xl p-5 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl shrink-0">
            <PhoneCall className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white">Didn't find what you were looking for?</h4>
            <p className="text-[11px] text-slate-400">
              Our support team is available 24/7 on WhatsApp <strong className="text-emerald-400">{systemConfig.supportWhatsApp}</strong> or open a live ticket.
            </p>
          </div>
        </div>

        {onOpenTicket && (
          <button
            onClick={onOpenTicket}
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs px-4 py-2.5 rounded-xl shrink-0 shadow-lg shadow-emerald-500/10 active:scale-95 transition-all flex items-center gap-1.5"
          >
            <MessageSquare className="w-4 h-4" />
            Contact Live Support
          </button>
        )}
      </div>

    </div>
  );
};
