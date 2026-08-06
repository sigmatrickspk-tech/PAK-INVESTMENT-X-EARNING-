import React, { useState, useMemo } from 'react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  BarChart, 
  Bar, 
  Legend 
} from 'recharts';
import { TrendingUp, BarChart3, Calendar, DollarSign, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { Transaction, SystemConfig } from '../types';

interface UserAnalyticsChartProps {
  transactions: Transaction[];
  systemConfig: SystemConfig;
}

export const UserAnalyticsChart: React.FC<UserAnalyticsChartProps> = ({
  transactions,
  systemConfig
}) => {
  const [timeframeDays, setTimeframeDays] = useState<number>(30);
  const [chartType, setChartType] = useState<'area' | 'bar'>('area');

  // Process transaction data over timeframe
  const chartData = useMemo(() => {
    const now = new Date();
    const result: Record<string, { date: string; displayDate: string; earnings: number; deposits: number; withdrawals: number }> = {};

    // Initialize last N days
    for (let i = timeframeDays - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dateKey = d.toISOString().split('T')[0];
      const displayDate = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      result[dateKey] = {
        date: dateKey,
        displayDate,
        earnings: 0,
        deposits: 0,
        withdrawals: 0
      };
    }

    // Accumulate transaction amounts
    transactions.forEach(tx => {
      if (tx.status !== 'approved') return;

      const txDate = new Date(tx.createdAt).toISOString().split('T')[0];
      if (result[txDate]) {
        if (tx.type === 'deposit') {
          result[txDate].deposits += tx.amount;
        } else if (tx.type === 'withdrawal') {
          result[txDate].withdrawals += tx.amount;
        } else if (
          tx.type === 'task_earning' || 
          tx.type === 'promo_reward' || 
          tx.type === 'referral_bonus' ||
          tx.type === 'plan_profit'
        ) {
          result[txDate].earnings += tx.amount;
        }
      }
    });

    return Object.values(result);
  }, [transactions, timeframeDays]);

  // Aggregate Stats
  const totalPeriodEarnings = chartData.reduce((acc, curr) => acc + curr.earnings, 0);
  const totalPeriodDeposits = chartData.reduce((acc, curr) => acc + curr.deposits, 0);
  const totalPeriodWithdrawals = chartData.reduce((acc, curr) => acc + curr.withdrawals, 0);

  return (
    <div className="bg-slate-900 border border-slate-800 dark:bg-slate-900 dark:border-slate-800 rounded-2xl p-6 space-y-6 transition-colors">
      
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-white dark:text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            Financial Analytics & Daily Trends
          </h2>
          <p className="text-xs text-slate-400 dark:text-slate-400">
            Visualized earnings, deposits & withdrawals over the last {timeframeDays} days.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Timeframe Selector */}
          <div className="flex items-center bg-slate-950 dark:bg-slate-950 p-1 rounded-xl border border-slate-800">
            {[7, 15, 30].map((days) => (
              <button
                key={days}
                onClick={() => setTimeframeDays(days)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  timeframeDays === days
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {days}D
              </button>
            ))}
          </div>

          {/* Chart View Toggle */}
          <div className="flex items-center bg-slate-950 dark:bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setChartType('area')}
              className={`p-1.5 rounded-lg text-xs font-bold transition-all ${
                chartType === 'area'
                  ? 'bg-slate-800 text-emerald-400'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Area Trend View"
            >
              <TrendingUp className="w-4 h-4" />
            </button>
            <button
              onClick={() => setChartType('bar')}
              className={`p-1.5 rounded-lg text-xs font-bold transition-all ${
                chartType === 'bar'
                  ? 'bg-slate-800 text-emerald-400'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Bar Breakdown View"
            >
              <BarChart3 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Mini Summary Chips */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 bg-slate-950/80 rounded-xl border border-emerald-500/20">
          <span className="text-[10px] text-slate-400 font-medium block">Period Earnings</span>
          <span className="text-sm md:text-base font-black text-emerald-400 font-mono">
            {systemConfig.currencySymbol}{totalPeriodEarnings.toLocaleString()}
          </span>
        </div>
        <div className="p-3 bg-slate-950/80 rounded-xl border border-sky-500/20">
          <span className="text-[10px] text-slate-400 font-medium block">Period Deposits</span>
          <span className="text-sm md:text-base font-black text-sky-400 font-mono">
            {systemConfig.currencySymbol}{totalPeriodDeposits.toLocaleString()}
          </span>
        </div>
        <div className="p-3 bg-slate-950/80 rounded-xl border border-amber-500/20">
          <span className="text-[10px] text-slate-400 font-medium block">Period Withdrawals</span>
          <span className="text-sm md:text-base font-black text-amber-400 font-mono">
            {systemConfig.currencySymbol}{totalPeriodWithdrawals.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Recharts Visual Canvas */}
      <div className="h-64 md:h-72 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
          {chartType === 'area' ? (
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorDeposits" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
              <XAxis dataKey="displayDate" stroke="#64748b" fontSize={11} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  borderRadius: '12px',
                  color: '#fff',
                  fontSize: '12px',
                  boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)'
                }}
                formatter={(value: any) => [`${systemConfig.currencySymbol}${Number(value).toLocaleString()}`, '']}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              <Area
                type="monotone"
                dataKey="earnings"
                name="Daily Earnings"
                stroke="#10b981"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorEarnings)"
              />
              <Area
                type="monotone"
                dataKey="deposits"
                name="Deposits"
                stroke="#38bdf8"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorDeposits)"
              />
            </AreaChart>
          ) : (
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
              <XAxis dataKey="displayDate" stroke="#64748b" fontSize={11} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  borderRadius: '12px',
                  color: '#fff',
                  fontSize: '12px'
                }}
                formatter={(value: any) => [`${systemConfig.currencySymbol}${Number(value).toLocaleString()}`, '']}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              <Bar dataKey="earnings" name="Earnings" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="deposits" name="Deposits" fill="#38bdf8" radius={[4, 4, 0, 0]} />
              <Bar dataKey="withdrawals" name="Withdrawals" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

    </div>
  );
};
