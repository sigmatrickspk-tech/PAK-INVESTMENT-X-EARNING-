import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'ur';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    dashboard: 'Dashboard',
    liveSupport: 'Live Support',
    helpCenter: 'Help Center',
    adminPanel: 'Admin Panel',
    availableBalance: 'Available Balance',
    deposit: 'Deposit',
    withdraw: 'Withdraw',
    promoCode: 'Promo Code',
    signIn: 'Sign In',
    register: 'Register',
    notice: 'Notice',
    recentTransactions: 'Recent Financial History',
    topReferrers: 'Top Referrers & Tiers',
    earningsGoal: 'Custom Earnings Goal',
    activeSession: 'Active',
    alerts: 'Alerts',
    role: 'Role',
    welcomeBack: 'Welcome back',
    claimBonus: 'Claim PKR 100',
    activityLog: 'Account Activity Log'
  },
  ur: {
    dashboard: 'ڈیش بورڈ',
    liveSupport: 'لائیو سپورٹ',
    helpCenter: 'مدد کی جگہ',
    adminPanel: 'ایڈمن پینل',
    availableBalance: 'دستیاب بیلنس',
    deposit: 'رقم جمع کروائیں',
    withdraw: 'رقم نکلوا لیں',
    promoCode: 'پرومو کوڈ',
    signIn: 'سائن ان',
    register: 'رجسٹریشن',
    notice: 'اعلان',
    recentTransactions: 'حالیہ مالیاتی تاریخ',
    topReferrers: 'بہترین ریفرلز',
    earningsGoal: 'آمدنی کا ہدف',
    activeSession: 'فعال سیشن',
    alerts: 'الرٹس',
    role: 'عہدہ',
    welcomeBack: 'خوش آمدید',
    claimBonus: '100 روپے بونس لیں',
    activityLog: 'سیکیورٹی لاگ'
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('pak_lang_pref');
    if (saved === 'ur' || saved === 'en') return saved;
    return 'en';
  });

  useEffect(() => {
    localStorage.setItem('pak_lang_pref', language);
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('pak_lang_pref', lang);
  };

  const toggleLanguage = () => {
    const next = language === 'en' ? 'ur' : 'en';
    setLanguage(next);
  };

  const t = (key: string): string => {
    return translations[language]?.[key] || translations['en']?.[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
