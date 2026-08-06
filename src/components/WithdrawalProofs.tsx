import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Heart, 
  MessageCircle, 
  Share2, 
  Upload, 
  Zap, 
  Award, 
  Sparkles, 
  Send 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { DEFAULT_WITHDRAWAL_PROOFS } from '../lib/defaultData';
import { WithdrawalProofItem, ProofComment } from '../types';

export const WithdrawalProofs: React.FC = () => {
  const { userProfile, systemConfig, firebaseUser } = useAuth();
  const [proofs, setProofs] = useState<WithdrawalProofItem[]>(DEFAULT_WITHDRAWAL_PROOFS);
  const [newCommentText, setNewCommentText] = useState<{ [key: string]: string }>({});
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadCaption, setUploadCaption] = useState('');
  const [uploadAmount, setUploadAmount] = useState('5000');
  const [uploadMethod, setUploadMethod] = useState<'JazzCash' | 'EasyPaisa'>('JazzCash');
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  const handleLike = (proofId: string) => {
    setProofs(prev => prev.map(p => {
      if (p.id === proofId) {
        return { ...p, likes: p.likes + 1 };
      }
      return p;
    }));
  };

  const handleAddComment = (proofId: string) => {
    const text = newCommentText[proofId];
    if (!text || !text.trim()) return;

    const newComment: ProofComment = {
      id: `c-${Date.now()}`,
      userName: userProfile?.fullName || 'Member',
      text: text.trim(),
      timestamp: Date.now()
    };

    setProofs(prev => prev.map(p => {
      if (p.id === proofId) {
        return { ...p, comments: [...p.comments, newComment] };
      }
      return p;
    }));

    setNewCommentText(prev => ({ ...prev, [proofId]: '' }));
  };

  const handleUploadProof = () => {
    if (!uploadCaption) return;

    const newProof: WithdrawalProofItem = {
      id: `proof-${Date.now()}`,
      userId: firebaseUser?.uid || 'u-self',
      userName: userProfile?.fullName || 'User',
      phoneMasked: userProfile?.phone ? userProfile.phone.slice(0, 4) + '*****' + userProfile.phone.slice(-2) : '0300*****00',
      method: uploadMethod,
      amount: Number(uploadAmount),
      rewardBonus: 2,
      likes: 1,
      likedBy: [],
      comments: [],
      timeAgo: 'Just now',
      timestamp: Date.now(),
      caption: uploadCaption,
      verified: true
    };

    setProofs([newProof, ...proofs]);
    setShowUploadModal(false);
    setUploadCaption('');
    setSuccessNotice('🎉 Your withdrawal proof post has been published to the community feed!');
    setTimeout(() => setSuccessNotice(null), 5000);
  };

  return (
    <div className="space-y-6 pb-20">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 border border-emerald-500/30 rounded-3xl p-6 shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Verified Member Payouts
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">
            Withdrawal Proofs & Community Feed
          </h2>
          <p className="text-xs text-slate-300 max-w-xl">
            Real payout screenshots & payment receipts uploaded live by verified SIGMAXEARNINGS investors.
          </p>
        </div>

        <button
          onClick={() => setShowUploadModal(true)}
          className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-4 py-2.5 rounded-2xl text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all shrink-0"
        >
          <Upload className="w-4 h-4" /> Post Withdrawal Proof
        </button>
      </div>

      {/* Success Notification */}
      {successNotice && (
        <div className="p-4 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl text-emerald-200 text-xs font-bold flex items-center gap-2 animate-fade-in">
          <Sparkles className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{successNotice}</span>
        </div>
      )}

      {/* Proofs List */}
      <div className="space-y-5 max-w-2xl mx-auto">
        {proofs.map((p) => (
          <div key={p.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
            
            {/* User Info Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-black text-xs flex items-center justify-center">
                  {p.userName.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                    {p.userName}
                    {p.verified && (
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.2 rounded-full border border-emerald-500/30 font-bold">
                        Verified Payout
                      </span>
                    )}
                  </h4>
                  <p className="text-[10px] text-slate-400 font-mono">
                    {p.phoneMasked} • {p.timeAgo}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-slate-400 block">{p.method} Transfer</span>
                <span className="text-base font-black font-mono text-emerald-400">
                  {systemConfig.currencySymbol}{p.amount.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Caption */}
            <p className="text-xs text-slate-200 leading-relaxed font-medium">
              {p.caption}
            </p>

            {/* Simulated Receipt Badge */}
            <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400">Transaction Status:</span>
              <span className="font-mono font-bold text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> SUCCESSFUL PAYMENT
              </span>
            </div>

            {/* Like & Comment Bar */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
              <button
                onClick={() => handleLike(p.id)}
                className="flex items-center gap-1.5 text-slate-400 hover:text-rose-400 font-bold transition-colors"
              >
                <Heart className="w-4 h-4 fill-rose-500/10 text-rose-400" />
                <span>{p.likes} Likes</span>
              </button>

              <span className="text-slate-500 text-[11px]">
                {p.comments.length} Comments
              </span>
            </div>

            {/* Comments List */}
            {p.comments.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-slate-800/60">
                {p.comments.map((c) => (
                  <div key={c.id} className="bg-slate-950/60 p-2.5 rounded-xl text-xs space-y-0.5">
                    <span className="font-bold text-amber-300 block">{c.userName}</span>
                    <p className="text-slate-300">{c.text}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Comment Input */}
            <div className="flex items-center gap-2 pt-2">
              <input
                type="text"
                placeholder="Write a comment..."
                value={newCommentText[p.id] || ''}
                onChange={(e) => setNewCommentText({ ...newCommentText, [p.id]: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && handleAddComment(p.id)}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
              />
              <button
                onClick={() => handleAddComment(p.id)}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black p-2 rounded-xl text-xs"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>

          </div>
        ))}
      </div>

      {/* Upload Proof Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl animate-fade-in">
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <Upload className="w-5 h-5 text-emerald-400" /> Share Withdrawal Proof
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-bold block mb-1">Payment Method</label>
                <select
                  value={uploadMethod}
                  onChange={(e) => setUploadMethod(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white outline-none"
                >
                  <option value="JazzCash">JazzCash</option>
                  <option value="EasyPaisa">EasyPaisa</option>
                </select>
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">Amount Received (PKR)</label>
                <input
                  type="number"
                  value={uploadAmount}
                  onChange={(e) => setUploadAmount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono outline-none"
                />
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">Caption / Review</label>
                <textarea
                  rows={3}
                  value={uploadCaption}
                  onChange={(e) => setUploadCaption(e.target.value)}
                  placeholder="e.g. Received Rs. 5000 withdrawal directly to EasyPaisa in 10 minutes!"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white outline-none"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setShowUploadModal(false)}
                className="flex-1 bg-slate-800 text-slate-300 font-bold py-2.5 rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleUploadProof}
                className="flex-1 bg-emerald-500 text-slate-950 font-black py-2.5 rounded-xl text-xs"
              >
                Post Proof
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
