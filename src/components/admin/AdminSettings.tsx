import React, { useState } from 'react';
import { ShieldCheck, Save, Key, Link as LinkIcon, Smartphone, CheckCircle2, AlertCircle, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { SystemConfig } from '../../types';

export const AdminSettings: React.FC = () => {
  const { systemConfig, updateConfigInFirestore } = useAuth();

  const [formConfig, setFormConfig] = useState<SystemConfig>({ ...systemConfig });
  
  // Custom API key entries
  const [apiKeyList, setApiKeyList] = useState<Array<{ key: string; value: string }>>(
    Object.entries(systemConfig.customApiKeys || {}).map(([key, value]) => ({ key, value }))
  );

  // External links entries
  const [linkList, setLinkList] = useState<Array<{ key: string; value: string }>>(
    Object.entries(systemConfig.externalLinks || {}).map(([key, value]) => ({ key, value }))
  );

  // Sub-Admin delegation emails
  const [subAdminEmails, setSubAdminEmails] = useState<string[]>(
    systemConfig.allowedAdminEmails && systemConfig.allowedAdminEmails.length > 0
      ? systemConfig.allowedAdminEmails
      : ['sigmaxearning@gmail.com']
  );
  const [newSubAdminEmail, setNewSubAdminEmail] = useState('');

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);

    try {
      // Reconstruct custom API keys object
      const apiObj: Record<string, string> = {};
      apiKeyList.forEach(item => {
        if (item.key.trim()) apiObj[item.key.trim().toUpperCase()] = item.value;
      });

      // Reconstruct external links object
      const linkObj: Record<string, string> = {};
      linkList.forEach(item => {
        if (item.key.trim()) linkObj[item.key.trim().toUpperCase()] = item.value;
      });

      const updatedConfig: SystemConfig = {
        ...formConfig,
        customApiKeys: apiObj,
        externalLinks: linkObj,
        allowedAdminEmails: subAdminEmails
      };

      await updateConfigInFirestore(updatedConfig);

      setMsg({
        type: 'success',
        text: 'System settings, payment credentials, APIs, and links saved to database!'
      });
      setTimeout(() => setMsg(null), 3000);
    } catch (err: any) {
      console.error('Error saving settings:', err);
      setMsg({ type: 'error', text: err.message || 'Failed to update system config.' });
    } finally {
      setSaving(false);
    }
  };

  const addApiKeyRow = () => {
    setApiKeyList(prev => [...prev, { key: '', value: '' }]);
  };

  const removeApiKeyRow = (index: number) => {
    setApiKeyList(prev => prev.filter((_, i) => i !== index));
  };

  const addLinkRow = () => {
    setLinkList(prev => [...prev, { key: '', value: '' }]);
  };

  const removeLinkRow = (index: number) => {
    setLinkList(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      
      <div>
        <h2 className="text-xl font-black text-white flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-400" /> Platform Configuration, APIs & Credentials
        </h2>
        <p className="text-xs text-slate-400">
          Edit site branding ({systemConfig.siteName}), JazzCash/EasyPaisa account numbers, API credentials, and social links.
        </p>
      </div>

      {msg && (
        <div className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
          msg.type === 'success' 
            ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300' 
            : 'bg-rose-500/20 border-rose-500/40 text-rose-300'
        }`}>
          {msg.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          <span>{msg.text}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* 1. Branding & Content */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-2">
            1. Site Identity & Announcements
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Website Name</label>
              <input
                type="text"
                required
                value={formConfig.siteName}
                onChange={(e) => setFormConfig(prev => ({ ...prev, siteName: e.target.value }))}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2.5 px-3 text-xs text-white outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Currency Symbol</label>
              <input
                type="text"
                required
                value={formConfig.currencySymbol}
                onChange={(e) => setFormConfig(prev => ({ ...prev, currencySymbol: e.target.value }))}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2.5 px-3 text-xs text-amber-300 font-mono outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Top Announcement Banner</label>
            <input
              type="text"
              value={formConfig.announcementBanner}
              onChange={(e) => setFormConfig(prev => ({ ...prev, announcementBanner: e.target.value }))}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2.5 px-3 text-xs text-emerald-300 outline-none"
            />
          </div>

          {/* Maintenance Mode Switch */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-white block">Maintenance Mode Switch</span>
              <span className="text-[11px] text-slate-400">
                When enabled, displays a notice to users and locks all deposit, cashout, and investment transactions.
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formConfig.maintenanceMode || false}
                onChange={(e) => setFormConfig(prev => ({ ...prev, maintenanceMode: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-500"></div>
            </label>
          </div>
        </div>

        {/* 2. Official JazzCash & EasyPaisa Payment Credentials */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-2 flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-emerald-400" /> 2. Official JazzCash & EasyPaisa Accounts
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* JazzCash */}
            <div className="bg-slate-950/60 p-4 border border-rose-500/20 rounded-xl space-y-3">
              <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider">JazzCash Account</h4>
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Account Title</label>
                <input
                  type="text"
                  required
                  value={formConfig.jazzcashTitle}
                  onChange={(e) => setFormConfig(prev => ({ ...prev, jazzcashTitle: e.target.value }))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 px-3 text-xs text-white outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Account Mobile Number</label>
                <input
                  type="tel"
                  required
                  value={formConfig.jazzcashNumber}
                  onChange={(e) => setFormConfig(prev => ({ ...prev, jazzcashNumber: e.target.value }))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 px-3 text-xs text-amber-300 font-mono outline-none"
                />
              </div>
            </div>

            {/* EasyPaisa */}
            <div className="bg-slate-950/60 p-4 border border-emerald-500/20 rounded-xl space-y-3">
              <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">EasyPaisa Account</h4>
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Account Title</label>
                <input
                  type="text"
                  required
                  value={formConfig.easypaisaTitle}
                  onChange={(e) => setFormConfig(prev => ({ ...prev, easypaisaTitle: e.target.value }))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 px-3 text-xs text-white outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Account Mobile Number</label>
                <input
                  type="tel"
                  required
                  value={formConfig.easypaisaNumber}
                  onChange={(e) => setFormConfig(prev => ({ ...prev, easypaisaNumber: e.target.value }))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 px-3 text-xs text-amber-300 font-mono outline-none"
                />
              </div>
            </div>

          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Minimum Deposit Limit ({formConfig.currencySymbol})</label>
              <input
                type="number"
                required
                value={formConfig.minDeposit}
                onChange={(e) => setFormConfig(prev => ({ ...prev, minDeposit: Number(e.target.value) }))}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2.5 px-3 text-xs text-white font-mono outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Minimum Withdrawal Limit ({formConfig.currencySymbol})</label>
              <input
                type="number"
                required
                value={formConfig.minWithdrawal}
                onChange={(e) => setFormConfig(prev => ({ ...prev, minWithdrawal: Number(e.target.value) }))}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2.5 px-3 text-xs text-white font-mono outline-none"
              />
            </div>
          </div>
        </div>

        {/* 3. Reward & Contact Details */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-2">
            3. Platform Reward Values & Support Contacts
          </h3>

          <div className="space-y-4">
            <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider">Earning & Task Reward Amounts</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Referral Bonus ({formConfig.currencySymbol})</label>
                <input
                  type="number"
                  value={formConfig.referralBonusAmount}
                  onChange={(e) => setFormConfig(prev => ({ ...prev, referralBonusAmount: Number(e.target.value) }))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-xs text-amber-300 font-mono outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Daily Checkin ({formConfig.currencySymbol})</label>
                <input
                  type="number"
                  value={formConfig.dailyCheckinReward}
                  onChange={(e) => setFormConfig(prev => ({ ...prev, dailyCheckinReward: Number(e.target.value) }))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-xs text-emerald-300 font-mono outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Video Watch ({formConfig.currencySymbol})</label>
                <input
                  type="number"
                  value={formConfig.videoAdReward || 30}
                  onChange={(e) => setFormConfig(prev => ({ ...prev, videoAdReward: Number(e.target.value) }))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-xs text-emerald-300 font-mono outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Survey Reward ({formConfig.currencySymbol})</label>
                <input
                  type="number"
                  value={formConfig.surveyReward || 45}
                  onChange={(e) => setFormConfig(prev => ({ ...prev, surveyReward: Number(e.target.value) }))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-xs text-emerald-300 font-mono outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">App Review ({formConfig.currencySymbol})</label>
                <input
                  type="number"
                  value={formConfig.appReviewReward || 60}
                  onChange={(e) => setFormConfig(prev => ({ ...prev, appReviewReward: Number(e.target.value) }))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-xs text-emerald-300 font-mono outline-none"
                />
              </div>
            </div>

            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider pt-2 border-t border-slate-800">Support Contact Channels</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Support Email</label>
                <input
                  type="email"
                  value={formConfig.supportEmail}
                  onChange={(e) => setFormConfig(prev => ({ ...prev, supportEmail: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-xs text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">WhatsApp Support Number</label>
                <input
                  type="text"
                  value={formConfig.supportWhatsApp}
                  onChange={(e) => setFormConfig(prev => ({ ...prev, supportWhatsApp: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-xs text-emerald-400 font-mono outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 4. Editable Custom API Keys */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Key className="w-4 h-4 text-amber-400" /> 4. Custom API Keys & Server Credentials
            </h3>
            <button
              type="button"
              onClick={addApiKeyRow}
              className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold px-3 py-1 rounded-lg flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Add Key
            </button>
          </div>

          <div className="space-y-3">
            {apiKeyList.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="KEY_NAME (e.g. SMS_GATEWAY_KEY)"
                  value={item.key}
                  onChange={(e) => {
                    const newArr = [...apiKeyList];
                    newArr[index].key = e.target.value;
                    setApiKeyList(newArr);
                  }}
                  className="w-1/3 bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-xs text-amber-300 font-mono outline-none"
                />
                <input
                  type="text"
                  placeholder="Value / Key String"
                  value={item.value}
                  onChange={(e) => {
                    const newArr = [...apiKeyList];
                    newArr[index].value = e.target.value;
                    setApiKeyList(newArr);
                  }}
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-xs text-white font-mono outline-none"
                />
                <button
                  type="button"
                  onClick={() => removeApiKeyRow(index)}
                  className="p-2 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 rounded-xl"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* 5. Editable External Links */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <LinkIcon className="w-4 h-4 text-teal-400" /> 5. External Links & Community Channels
            </h3>
            <button
              type="button"
              onClick={addLinkRow}
              className="bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs font-bold px-3 py-1 rounded-lg flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Add Link
            </button>
          </div>

          <div className="space-y-3">
            {linkList.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="LINK_NAME (e.g. TELEGRAM_GROUP)"
                  value={item.key}
                  onChange={(e) => {
                    const newArr = [...linkList];
                    newArr[index].key = e.target.value;
                    setLinkList(newArr);
                  }}
                  className="w-1/3 bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-xs text-teal-300 font-mono outline-none"
                />
                <input
                  type="text"
                  placeholder="https://..."
                  value={item.value}
                  onChange={(e) => {
                    const newArr = [...linkList];
                    newArr[index].value = e.target.value;
                    setLinkList(newArr);
                  }}
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-xs text-white font-mono outline-none"
                />
                <button
                  type="button"
                  onClick={() => removeLinkRow(index)}
                  className="p-2 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 rounded-xl"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* 6. Admin Panel Delegation & Sub-Admins */}
        <div className="bg-slate-900 border border-amber-500/30 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-400" /> 6. Owner & Sub-Admin Panel Access
              </h3>
              <p className="text-[11px] text-slate-400">
                Primary Super Admin: <span className="text-amber-300 font-mono font-bold">sigmaxearning@gmail.com</span> (Password: <span className="text-slate-300 font-mono">9908761Hf@</span>). Add sub-admin emails below to grant them Admin Panel access.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="email"
                placeholder="Enter new sub-admin email address..."
                value={newSubAdminEmail}
                onChange={(e) => setNewSubAdminEmail(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-xs text-white outline-none"
              />
              <button
                type="button"
                onClick={() => {
                  if (newSubAdminEmail.trim() && !subAdminEmails.includes(newSubAdminEmail.trim().toLowerCase())) {
                    setSubAdminEmails([...subAdminEmails, newSubAdminEmail.trim().toLowerCase()]);
                    setNewSubAdminEmail('');
                  }
                }}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs px-4 py-2 rounded-xl flex items-center gap-1 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" /> Add Sub-Admin
              </button>
            </div>

            <div className="space-y-2 pt-2">
              <span className="text-[11px] font-bold text-slate-400 block">Authorized Admin Emails:</span>
              <div className="flex flex-wrap gap-2">
                {subAdminEmails.map((e, idx) => (
                  <div key={idx} className="bg-slate-950 border border-amber-500/30 px-3 py-1.5 rounded-xl text-xs font-mono font-bold text-amber-300 flex items-center gap-2">
                    <span>{e}</span>
                    {e.toLowerCase() !== 'sigmaxearning@gmail.com' && (
                      <button
                        type="button"
                        onClick={() => setSubAdminEmails(subAdminEmails.filter((_, i) => i !== idx))}
                        className="text-rose-400 hover:text-rose-300 p-0.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Submit Save Button */}
        <button
          type="submit"
          disabled={saving}
          className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-4 rounded-2xl text-sm flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/20 active:scale-98 transition-all"
        >
          {saving ? (
            <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <Save className="w-5 h-5" />
              Save All Configuration Settings & Credentials
            </>
          )}
        </button>

      </form>

    </div>
  );
};
