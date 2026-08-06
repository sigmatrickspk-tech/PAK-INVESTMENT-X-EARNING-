import React, { useState } from 'react';
import { 
  ArrowDownLeft, 
  ArrowUpRight, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Search, 
  Filter, 
  Smartphone, 
  Sparkles,
  Copy,
  Check,
  FileText
} from 'lucide-react';
import { Transaction, SystemConfig } from '../types';

interface RecentTransactionsProps {
  transactions: Transaction[];
  systemConfig: SystemConfig;
  onOpenDeposit: () => void;
  onOpenWithdraw: () => void;
}

export const RecentTransactions: React.FC<RecentTransactionsProps> = ({
  transactions,
  systemConfig,
  onOpenDeposit,
  onOpenWithdraw
}) => {
  const [filterType, setFilterType] = useState<'all' | 'deposit' | 'withdrawal' | 'earning'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedTxId, setCopiedTxId] = useState<string | null>(null);

  const handleCopyTid = (tid: string) => {
    navigator.clipboard.writeText(tid);
    setCopiedTxId(tid);
    setTimeout(() => setCopiedTxId(null), 2000);
  };

  const handleDownloadReceipt = (tx: Transaction) => {
    const receiptWindow = window.open('', '_blank');
    if (!receiptWindow) {
      alert('Please allow popups to generate and print your receipt.');
      return;
    }

    const dateStr = new Date(tx.createdAt).toLocaleString();

    receiptWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Official Financial Receipt - ${systemConfig.siteName} - ${tx.id}</title>
        <style>
          body { font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; background: #0f172a; color: #f8fafc; padding: 30px; margin: 0; }
          .receipt-box { max-width: 520px; margin: 0 auto; background: #1e293b; border: 1px solid #334155; border-radius: 24px; padding: 32px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.6); }
          .logo { text-align: center; font-size: 24px; font-weight: 900; color: #10b981; letter-spacing: 1.5px; margin-bottom: 4px; }
          .subtitle { text-align: center; font-size: 12px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; }
          .stamp { display: table; margin: 16px auto 24px auto; padding: 6px 18px; background: rgba(16, 185, 129, 0.15); border: 1px solid #10b981; color: #34d399; font-weight: 800; border-radius: 999px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
          .amount-card { text-align: center; background: #0f172a; border: 1px solid #334155; padding: 20px; border-radius: 16px; margin-bottom: 24px; }
          .amount-title { font-size: 11px; color: #94a3b8; text-transform: uppercase; font-weight: 700; margin-bottom: 6px; }
          .amount-val { font-size: 34px; font-weight: 900; color: #10b981; font-family: monospace; }
          .detail-row { display: flex; justify-content: space-between; align-items: center; font-size: 13px; padding: 10px 0; border-bottom: 1px border #334155; color: #cbd5e1; }
          .lbl { color: #94a3b8; font-weight: 500; }
          .val { font-weight: 700; font-family: monospace; color: #ffffff; }
          .print-btn { display: block; width: 100%; padding: 14px; background: #10b981; color: #022c22; font-weight: 900; text-align: center; border: none; border-radius: 14px; font-size: 14px; cursor: pointer; margin-top: 24px; transition: all 0.2s; }
          .print-btn:hover { background: #34d399; }
          .footer-note { text-align: center; margin-top: 20px; font-size: 11px; color: #64748b; line-height: 1.5; }
          @media print {
            body { background: #ffffff; color: #000000; padding: 0; }
            .receipt-box { background: #ffffff; color: #000000; border: 1px solid #000; box-shadow: none; }
            .amount-card { background: #f8fafc; border: 1px solid #ccc; }
            .amount-val { color: #059669; }
            .val { color: #000000; }
            .print-btn { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="receipt-box">
          <div class="logo">⚡ ${systemConfig.siteName.toUpperCase()}</div>
          <div class="subtitle">Official Transaction Receipt</div>
          <div class="stamp">✓ ${tx.status.toUpperCase()}</div>

          <div class="amount-card">
            <div class="amount-title">Total Transaction Amount</div>
            <div class="amount-val">${systemConfig.currencySymbol}${tx.amount.toLocaleString()}</div>
          </div>

          <div class="detail-row"><span class="lbl">Transaction Type</span><span class="val">${tx.type.replace('_', ' ').toUpperCase()}</span></div>
          <div class="detail-row"><span class="lbl">Payment Method</span><span class="val">${tx.method || 'System Account'}</span></div>
          ${tx.transactionId ? `<div class="detail-row"><span class="lbl">JazzCash/EasyPaisa TID</span><span class="val">${tx.transactionId}</span></div>` : ''}
          ${tx.accountNumber ? `<div class="detail-row"><span class="lbl">Account Number</span><span class="val">${tx.accountNumber}</span></div>` : ''}
          ${tx.accountTitle ? `<div class="detail-row"><span class="lbl">Account Title</span><span class="val">${tx.accountTitle}</span></div>` : ''}
          <div class="detail-row"><span class="lbl">Date & Time</span><span class="val">${dateStr}</span></div>
          <div class="detail-row"><span class="lbl">Ledger Ref ID</span><span class="val">${tx.id}</span></div>

          <button class="print-btn" onclick="window.print()">🖨️ Print / Save PDF Receipt</button>

          <div class="footer-note">
            Generated by ${systemConfig.siteName} Financial Network.<br/>
            Need help? Contact WhatsApp Support: ${systemConfig.supportWhatsApp}
          </div>
        </div>
      </body>
      </html>
    `);
    receiptWindow.document.close();
  };

  const filteredTransactions = transactions.filter(tx => {
    // Type Filter
    if (filterType === 'deposit' && tx.type !== 'deposit') return false;
    if (filterType === 'withdrawal' && tx.type !== 'withdrawal') return false;
    if (filterType === 'earning' && (tx.type === 'deposit' || tx.type === 'withdrawal')) return false;

    // Status Filter
    if (filterStatus !== 'all' && tx.status !== filterStatus) return false;

    // Search Term
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchTid = tx.transactionId?.toLowerCase().includes(term);
      const matchMethod = tx.method?.toLowerCase().includes(term);
      const matchType = tx.type?.toLowerCase().includes(term);
      const matchNote = tx.adminNote?.toLowerCase().includes(term);
      return matchTid || matchMethod || matchType || matchNote;
    }

    return true;
  });

  const getStatusBadge = (status: 'pending' | 'approved' | 'rejected') => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-full">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Approved
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-rose-400 bg-rose-500/10 border border-rose-500/30 px-2.5 py-1 rounded-full">
            <XCircle className="w-3.5 h-3.5 text-rose-400" /> Rejected
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-full animate-pulse">
            <Clock className="w-3.5 h-3.5 text-amber-400" /> Pending Admin Approval
          </span>
        );
    }
  };

  const getTypeIcon = (type: string) => {
    if (type === 'deposit') {
      return (
        <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shrink-0">
          <ArrowDownLeft className="w-5 h-5" />
        </div>
      );
    }
    if (type === 'withdrawal') {
      return (
        <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 shrink-0">
          <ArrowUpRight className="w-5 h-5" />
        </div>
      );
    }
    return (
      <div className="p-2.5 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 shrink-0">
        <Sparkles className="w-5 h-5" />
      </div>
    );
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-emerald-400" />
            Recent Financial History
          </h2>
          <p className="text-xs text-slate-400">
            Live transparent log of all your deposits, withdrawals, and task earnings.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenDeposit}
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-extrabold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-emerald-500/10"
          >
            <ArrowDownLeft className="w-4 h-4" /> Deposit
          </button>
          <button
            onClick={onOpenWithdraw}
            className="bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/30 text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all"
          >
            <ArrowUpRight className="w-4 h-4" /> Withdraw
          </button>
        </div>
      </div>

      {/* Filter Controls Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3">
        
        {/* Search */}
        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search TID, method..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500/50 rounded-xl py-2 pl-9 pr-3 text-xs text-white outline-none"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-medium">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1 rounded-lg transition-all ${
                filterType === 'all' ? 'bg-emerald-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
              }`}
            >
              All Types
            </button>
            <button
              onClick={() => setFilterType('deposit')}
              className={`px-3 py-1 rounded-lg transition-all ${
                filterType === 'deposit' ? 'bg-emerald-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
              }`}
            >
              Deposits
            </button>
            <button
              onClick={() => setFilterType('withdrawal')}
              className={`px-3 py-1 rounded-lg transition-all ${
                filterType === 'withdrawal' ? 'bg-emerald-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
              }`}
            >
              Withdrawals
            </button>
            <button
              onClick={() => setFilterType('earning')}
              className={`px-3 py-1 rounded-lg transition-all ${
                filterType === 'earning' ? 'bg-emerald-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
              }`}
            >
              Earnings
            </button>
          </div>

          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-medium">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                filterStatus === 'all' ? 'bg-slate-800 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterStatus('pending')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                filterStatus === 'pending' ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40' : 'text-slate-400 hover:text-white'
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setFilterStatus('approved')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                filterStatus === 'approved' ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40' : 'text-slate-400 hover:text-white'
              }`}
            >
              Approved
            </button>
            <button
              onClick={() => setFilterStatus('rejected')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                filterStatus === 'rejected' ? 'bg-rose-500/20 text-rose-300 font-bold border border-rose-500/40' : 'text-slate-400 hover:text-white'
              }`}
            >
              Rejected
            </button>
          </div>
        </div>

      </div>

      {/* Transactions List */}
      {filteredTransactions.length === 0 ? (
        <div className="text-center py-12 bg-slate-950/60 border border-slate-800/80 rounded-2xl space-y-3">
          <Clock className="w-10 h-10 text-slate-600 mx-auto" />
          <h4 className="text-sm font-bold text-slate-300">No Transactions Found</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            You don't have any transaction records matching your current filter.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTransactions.map((tx) => (
            <div
              key={tx.id}
              className="bg-slate-950/70 border border-slate-800/90 hover:border-slate-700/80 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all"
            >
              <div className="flex items-center gap-3.5">
                {getTypeIcon(tx.type)}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-white capitalize">
                      {tx.type.replace('_', ' ')}
                    </span>
                    {tx.method && (
                      <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-md flex items-center gap-1">
                        <Smartphone className="w-3 h-3 text-emerald-400" />
                        {tx.method}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 mt-1">
                    <span>{new Date(tx.createdAt).toLocaleString()}</span>

                    {tx.transactionId && (
                      <div className="flex items-center gap-1 font-mono text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                        <span>TID: {tx.transactionId}</span>
                        <button
                          onClick={() => handleCopyTid(tx.transactionId!)}
                          className="hover:text-white"
                          title="Copy Transaction ID"
                        >
                          {copiedTxId === tx.transactionId ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                    )}

                    {tx.accountTitle && (
                      <span className="text-slate-300">
                        Acc: {tx.accountTitle} ({tx.accountNumber})
                      </span>
                    )}
                  </div>

                  {tx.adminNote && (
                    <div className="mt-1.5 text-[11px] text-slate-300 bg-slate-900/90 p-1.5 px-2.5 rounded-lg border border-slate-800 inline-block">
                      💬 <span className="text-slate-400">Admin Note:</span> {tx.adminNote}
                    </div>
                  )}
                </div>
              </div>

              {/* Amount and Status */}
              <div className="flex items-center justify-between md:justify-end gap-4 w-full md:w-auto pt-2 md:pt-0 border-t md:border-t-0 border-slate-800">
                <div className="text-left md:text-right">
                  <div className={`text-base font-black font-mono ${
                    tx.type === 'deposit' || tx.type === 'task_earning' || tx.type === 'promo_reward' || tx.type === 'referral_bonus' || tx.type === 'plan_profit'
                      ? 'text-emerald-400'
                      : 'text-amber-400'
                  }`}>
                    {tx.type === 'withdrawal' ? '-' : '+'}{systemConfig.currencySymbol}{tx.amount.toLocaleString()}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {getStatusBadge(tx.status)}

                  <button
                    onClick={() => handleDownloadReceipt(tx)}
                    title="Download Official Receipt"
                    className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-emerald-300 border border-slate-800 hover:border-slate-700 transition-colors flex items-center gap-1 text-[11px] font-bold"
                  >
                    <FileText className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="hidden sm:inline">Receipt</span>
                  </button>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
};
