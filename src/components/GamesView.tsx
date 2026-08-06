import React, { useState } from 'react';
import { 
  Gamepad2, 
  Sparkles, 
  Zap, 
  Trophy, 
  ArrowRight, 
  RotateCcw, 
  Coins, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { doc, updateDoc, increment, addDoc, collection } from 'firebase/firestore';

export const GamesView: React.FC = () => {
  const { userProfile, firebaseUser, systemConfig } = useAuth();
  
  const [activeGame, setActiveGame] = useState<'none' | 'plinko' | 'coinflip'>('none');
  const [betAmount, setBetAmount] = useState<number>(50);
  
  // Plinko state
  const [isDropping, setIsDropping] = useState(false);
  const [plinkoResult, setPlinkoResult] = useState<{ multiplier: number; winAmount: number } | null>(null);
  
  // Coin Flip state
  const [coinChoice, setCoinChoice] = useState<'heads' | 'tails'>('heads');
  const [isFlipping, setIsFlipping] = useState(false);
  const [flipResult, setFlipResult] = useState<{ outcome: 'heads' | 'tails'; won: boolean; winAmount: number } | null>(null);

  const plinkoMultipliers = [16, 5, 2, 1, 0.5, 0.2, 0.5, 1, 2, 5, 16];

  // Plinko Game Execution
  const handlePlayPlinko = async () => {
    if (!firebaseUser || !userProfile) return;
    if (userProfile.balance < betAmount) {
      alert(`Insufficient balance! You need ${systemConfig.currencySymbol}${betAmount} to play.`);
      return;
    }

    setIsDropping(true);
    setPlinkoResult(null);

    // Pick random multiplier index with realistic distribution
    setTimeout(async () => {
      const randomIndex = Math.floor(Math.random() * plinkoMultipliers.length);
      const mult = plinkoMultipliers[randomIndex];
      const winAmt = Math.round(betAmount * mult);
      const netGain = winAmt - betAmount;

      try {
        const userRef = doc(db, 'users', firebaseUser.uid);
        await updateDoc(userRef, {
          balance: increment(netGain),
          totalEarnings: increment(netGain > 0 ? netGain : 0)
        });

        await addDoc(collection(db, 'transactions'), {
          userId: firebaseUser.uid,
          userEmail: userProfile.email,
          userPhone: userProfile.phone,
          userName: userProfile.fullName,
          type: 'task_earning',
          method: 'Internal',
          amount: winAmt,
          status: 'approved',
          createdAt: Date.now(),
          adminNote: `Plinko Game (${mult}x Multiplier)`
        });

        setPlinkoResult({ multiplier: mult, winAmount: winAmt });
      } catch (err) {
        console.error('Plinko payout error:', err);
      } finally {
        setIsDropping(false);
      }
    }, 1800);
  };

  // Coin Flip Game Execution
  const handlePlayCoinFlip = async () => {
    if (!firebaseUser || !userProfile) return;
    if (userProfile.balance < betAmount) {
      alert(`Insufficient balance! You need ${systemConfig.currencySymbol}${betAmount} to play.`);
      return;
    }

    setIsFlipping(true);
    setFlipResult(null);

    setTimeout(async () => {
      const outcome: 'heads' | 'tails' = Math.random() > 0.5 ? 'heads' : 'tails';
      const won = outcome === coinChoice;
      const winAmt = won ? Math.round(betAmount * 1.9) : 0;
      const netGain = won ? winAmt - betAmount : -betAmount;

      try {
        const userRef = doc(db, 'users', firebaseUser.uid);
        await updateDoc(userRef, {
          balance: increment(netGain),
          totalEarnings: increment(won ? (winAmt - betAmount) : 0)
        });

        await addDoc(collection(db, 'transactions'), {
          userId: firebaseUser.uid,
          userEmail: userProfile.email,
          userPhone: userProfile.phone,
          userName: userProfile.fullName,
          type: 'task_earning',
          method: 'Internal',
          amount: winAmt,
          status: 'approved',
          createdAt: Date.now(),
          adminNote: `Coin Flip Game (${won ? 'WON' : 'LOST'} - ${outcome.toUpperCase()})`
        });

        setFlipResult({ outcome, won, winAmount: winAmt });
      } catch (err) {
        console.error('Coinflip payout error:', err);
      } finally {
        setIsFlipping(false);
      }
    }, 2000);
  };

  return (
    <div className="space-y-6 pb-20">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 border border-purple-500/30 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-bold border border-purple-500/30">
            <Gamepad2 className="w-3.5 h-3.5 text-pink-400" /> Interactive Earning Arcade
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">
            Play & Win Instant Cash
          </h2>
          <p className="text-xs text-slate-300 max-w-xl">
            Test your luck in downtime mini-games! Winnings are credited directly to your main balance in real time.
          </p>
        </div>
      </div>

      {/* Game Selection Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        
        {/* Plinko Card */}
        <div className="bg-slate-900 border border-slate-800 hover:border-pink-500/50 rounded-3xl p-6 flex flex-col justify-between shadow-xl space-y-4">
          <div className="space-y-2">
            <span className="bg-pink-500/20 text-pink-300 border border-pink-500/40 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full">
              Up to 16x Multiplier
            </span>
            <h3 className="text-xl font-black text-white">Plinko Peg Drop</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Drop the golden ball down the peg pyramid and chase huge multiplier slots at the bottom!
            </p>
          </div>

          <button
            onClick={() => setActiveGame('plinko')}
            className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-400 hover:to-rose-400 text-slate-950 font-black py-3 rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-pink-500/20"
          >
            Play Plinko Now <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Coin Flip Card */}
        <div className="bg-slate-900 border border-slate-800 hover:border-amber-500/50 rounded-3xl p-6 flex flex-col justify-between shadow-xl space-y-4">
          <div className="space-y-2">
            <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full">
              1.9x Instant Payout
            </span>
            <h3 className="text-xl font-black text-white">3D Gold Coin Flip</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Call Heads or Tails and flip the lucky golden coin to double your bet in seconds.
            </p>
          </div>

          <button
            onClick={() => setActiveGame('coinflip')}
            className="w-full bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-black py-3 rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
          >
            Play Coin Flip Now <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>

      {/* PLINKO GAME MODAL / INTERFACE */}
      {activeGame === 'plinko' && (
        <div className="bg-slate-900 border border-pink-500/30 rounded-3xl p-6 space-y-6 shadow-2xl max-w-xl mx-auto animate-fade-in">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-pink-400" /> Plinko Peg Drop
            </h3>
            <button
              onClick={() => setActiveGame('none')}
              className="text-xs text-slate-400 hover:text-white"
            >
              Close
            </button>
          </div>

          {/* Bet Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300">Select Bet Amount ({systemConfig.currencySymbol})</label>
            <div className="flex items-center gap-2">
              {[20, 50, 100, 200, 500].map((amt) => (
                <button
                  key={amt}
                  onClick={() => setBetAmount(amt)}
                  className={`flex-1 py-2 rounded-xl text-xs font-mono font-bold transition-all ${
                    betAmount === amt
                      ? 'bg-pink-500 text-slate-950 font-black'
                      : 'bg-slate-950 text-slate-400 border border-slate-800'
                  }`}
                >
                  {amt}
                </button>
              ))}
            </div>
          </div>

          {/* Animated Peg Pyramid Container */}
          <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 text-center space-y-6 relative overflow-hidden">
            
            {/* Peg Pins Animation */}
            <div className="flex flex-col items-center gap-3">
              {[3, 5, 7, 9].map((pins, rowIdx) => (
                <div key={rowIdx} className="flex justify-center gap-4">
                  {Array.from({ length: pins }).map((_, pinIdx) => (
                    <div
                      key={pinIdx}
                      className="w-2.5 h-2.5 rounded-full bg-slate-700 shadow-sm"
                    />
                  ))}
                </div>
              ))}
            </div>

            {/* Dropping Ball Effect */}
            {isDropping && (
              <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-pink-500 to-amber-300 mx-auto animate-bounce shadow-lg shadow-pink-500/50" />
            )}

            {/* Multipliers Bar */}
            <div className="flex justify-between items-center gap-1 pt-4 border-t border-slate-800 overflow-x-auto">
              {plinkoMultipliers.map((m, idx) => (
                <div
                  key={idx}
                  className={`px-1.5 py-1 rounded text-[10px] font-mono font-black ${
                    m >= 5 ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {m}x
                </div>
              ))}
            </div>

            {/* Result Display */}
            {plinkoResult && (
              <div className="p-4 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl text-emerald-300 text-sm font-bold flex items-center justify-center gap-2 animate-bounce">
                <Trophy className="w-5 h-5 text-amber-400" />
                <span>Landed on {plinkoResult.multiplier}x! Won {systemConfig.currencySymbol}{plinkoResult.winAmount}!</span>
              </div>
            )}

          </div>

          <button
            disabled={isDropping}
            onClick={handlePlayPlinko}
            className="w-full bg-pink-500 hover:bg-pink-400 text-slate-950 font-black py-3 rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-pink-500/20 active:scale-95 transition-all"
          >
            {isDropping ? 'Dropping Ball...' : `Drop Ball (${systemConfig.currencySymbol}${betAmount})`}
          </button>
        </div>
      )}

      {/* COIN FLIP GAME MODAL / INTERFACE */}
      {activeGame === 'coinflip' && (
        <div className="bg-slate-900 border border-amber-500/30 rounded-3xl p-6 space-y-6 shadow-2xl max-w-xl mx-auto animate-fade-in">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <Coins className="w-5 h-5 text-amber-400" /> 3D Gold Coin Flip
            </h3>
            <button
              onClick={() => setActiveGame('none')}
              className="text-xs text-slate-400 hover:text-white"
            >
              Close
            </button>
          </div>

          {/* Choice & Bet */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setCoinChoice('heads')}
              className={`p-4 rounded-2xl border text-center font-black text-xs transition-all ${
                coinChoice === 'heads'
                  ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                  : 'bg-slate-950 border-slate-800 text-slate-400'
              }`}
            >
              HEADS (1.9x)
            </button>
            <button
              onClick={() => setCoinChoice('tails')}
              className={`p-4 rounded-2xl border text-center font-black text-xs transition-all ${
                coinChoice === 'tails'
                  ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                  : 'bg-slate-950 border-slate-800 text-slate-400'
              }`}
            >
              TAILS (1.9x)
            </button>
          </div>

          {/* Bet Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300">Select Bet Amount ({systemConfig.currencySymbol})</label>
            <div className="flex items-center gap-2">
              {[50, 100, 200, 500, 1000].map((amt) => (
                <button
                  key={amt}
                  onClick={() => setBetAmount(amt)}
                  className={`flex-1 py-2 rounded-xl text-xs font-mono font-bold transition-all ${
                    betAmount === amt
                      ? 'bg-amber-400 text-slate-950 font-black'
                      : 'bg-slate-950 text-slate-400 border border-slate-800'
                  }`}
                >
                  {amt}
                </button>
              ))}
            </div>
          </div>

          {/* Animated 3D Coin */}
          <div className="bg-slate-950 p-8 rounded-3xl border border-slate-800 flex flex-col items-center justify-center space-y-4">
            <div
              className={`w-24 h-24 rounded-full bg-gradient-to-tr from-amber-500 via-yellow-300 to-amber-600 border-4 border-amber-200 flex items-center justify-center font-black text-slate-950 text-xl shadow-2xl shadow-amber-500/30 ${
                isFlipping ? 'animate-spin' : ''
              }`}
            >
              {isFlipping ? '?' : flipResult ? flipResult.outcome.toUpperCase() : coinChoice.toUpperCase()}
            </div>

            {flipResult && (
              <div className={`p-3 rounded-xl text-xs font-bold ${
                flipResult.won ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
              }`}>
                {flipResult.won ? `🎉 WON ${systemConfig.currencySymbol}${flipResult.winAmount}!` : '❌ Lost this flip. Try again!'}
              </div>
            )}
          </div>

          <button
            disabled={isFlipping}
            onClick={handlePlayCoinFlip}
            className="w-full bg-amber-400 hover:bg-amber-300 text-slate-950 font-black py-3 rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-400/20 active:scale-95 transition-all"
          >
            {isFlipping ? 'Flipping Coin...' : `Flip Coin (${systemConfig.currencySymbol}${betAmount})`}
          </button>
        </div>
      )}

    </div>
  );
};
