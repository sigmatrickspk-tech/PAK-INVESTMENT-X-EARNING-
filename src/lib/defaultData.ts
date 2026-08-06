import { 
  SystemConfig, 
  FAQItem, 
  EarningTask, 
  PromoCode, 
  InvestmentPlan, 
  InvestmentPool, 
  WithdrawalProofItem, 
  TeamMember, 
  CommunityChatMessage 
} from '../types';

export const DEFAULT_PLANS: InvestmentPlan[] = [
  {
    id: 'plan-starter-vip1',
    name: 'Starter VIP 1 Plan',
    price: 1000,
    dailyProfitPercent: 6,
    dailyProfitAmount: 60,
    durationDays: 30,
    totalReturnAmount: 1800,
    totalReturnPercent: 180,
    description: 'Perfect beginner earning plan with guaranteed daily payouts via JazzCash & EasyPaisa.',
    badgeText: 'Starter Choice',
    isActive: true,
    createdAt: Date.now()
  },
  {
    id: 'plan-silver-vip2',
    name: 'Silver VIP 2 Plan',
    price: 3000,
    dailyProfitPercent: 7,
    dailyProfitAmount: 210,
    durationDays: 30,
    totalReturnAmount: 6300,
    totalReturnPercent: 210,
    description: 'High return plan designed for steady daily cashflow and passive earnings.',
    badgeText: 'Most Popular',
    isActive: true,
    createdAt: Date.now()
  },
  {
    id: 'plan-gold-vip3',
    name: 'Gold VIP 3 Plan',
    price: 5000,
    dailyProfitPercent: 8,
    dailyProfitAmount: 400,
    durationDays: 30,
    totalReturnAmount: 12000,
    totalReturnPercent: 240,
    description: 'Premium plan offering 240% total ROI with instant daily claims.',
    badgeText: 'High ROI',
    isActive: true,
    createdAt: Date.now()
  },
  {
    id: 'plan-diamond-vip4',
    name: 'Diamond VIP 4 Plan',
    price: 10000,
    dailyProfitPercent: 10,
    dailyProfitAmount: 1000,
    durationDays: 30,
    totalReturnAmount: 30000,
    totalReturnPercent: 300,
    description: 'Ultimate investor plan providing 10% daily yield and priority payout processing.',
    badgeText: 'VIP Diamond',
    isActive: true,
    createdAt: Date.now()
  }
];

export const DEFAULT_SYSTEM_CONFIG: SystemConfig = {
  siteName: 'PAK INVESTMENT X EARNING',
  announcementBanner: '🔥 Welcome to PAK INVESTMENT X EARNING! Daily payouts via JazzCash & EasyPaisa. Join our official channel for promo codes!',
  currencySymbol: 'PKR ',
  minDeposit: 500,
  minWithdrawal: 300,
  jazzcashNumber: '03019876543',
  jazzcashTitle: 'SIGMAX TRADERS OFFICIAL',
  easypaisaNumber: '03459876543',
  easypaisaTitle: 'SIGMAX ENTERPRISES',
  supportEmail: 'support@sigmaxearnings.com',
  supportPhone: '+92 301 9876543',
  supportWhatsApp: '+923019876543',
  customApiKeys: {
    API_GATEWAY_URL: 'https://api.sigmaxearnings.com/v1',
    SMS_NOTIFICATION_KEY: 'sk_live_sigmax_sms_99182',
    ANALYTICS_TRACKER_ID: 'UA-SIGMAX-88192'
  },
  externalLinks: {
    TELEGRAM_OFFICIAL: 'https://t.me/sigmaxearnings_official',
    WHATSAPP_COMMUNITY: 'https://chat.whatsapp.com/sigmaxearnings',
    FACEBOOK_GROUP: 'https://facebook.com/groups/sigmaxearnings',
    YOUTUBE_TUTORIALS: 'https://youtube.com/@sigmaxearnings'
  },
  maintenanceMode: false,
  referralBonusAmount: 100,
  dailyCheckinReward: 50,
  videoAdReward: 30,
  surveyReward: 45,
  appReviewReward: 60,
  allowedAdminEmails: ['sigmaxearning@gmail.com'],
};

export const DEFAULT_FAQS: FAQItem[] = [
  {
    id: 'faq-1',
    category: 'Deposits',
    question: 'How do I deposit money using JazzCash or EasyPaisa?',
    answer: 'Navigate to Dashboard -> Click "Deposit". Select either JazzCash or EasyPaisa. Send the funds to the provided Account Number and Title. After completing the payment in your JazzCash/EasyPaisa app, copy the Transaction ID (TID / Reference number) and submit it along with your phone number. Your deposit will be reviewed and approved within 5 to 15 minutes.'
  },
  {
    id: 'faq-2',
    category: 'Withdrawals',
    question: 'How fast are withdrawals processed?',
    answer: 'Withdrawal requests are manually reviewed by our finance admins. Once approved, funds are directly transferred to your JazzCash or EasyPaisa account within 1 to 2 hours during active working hours (9 AM - 11 PM).'
  },
  {
    id: 'faq-3',
    category: 'Earnings',
    question: 'How can I maximize my daily earnings?',
    answer: '1. Claim your Daily Attendance Check-In reward every 24 hours.\n2. Complete sponsored tasks and ad offers in the Earn section.\n3. Redeem active Promo Codes shared daily in our Telegram/WhatsApp groups.\n4. Refer friends using your unique referral link to earn PKR 100 per successful referral.'
  },
  {
    id: 'faq-4',
    category: 'Support',
    question: 'What if my payment is pending or rejected?',
    answer: 'If your deposit or withdrawal is delayed, open the Support Chat section from the top menu or dashboard. Send a message to Admin Support with your TID or account details. Admin resolved issues are tracked live in real-time.'
  },
  {
    id: 'faq-5',
    category: 'Promo Codes',
    question: 'Where can I find SIGMAXEARNINGS Promo Codes?',
    answer: 'Promo codes are posted regularly in our official Telegram channel and WhatsApp group during special events and flash giveaways. Enter the code in the "Redeem Code" modal on your dashboard to claim instant cash bonuses.'
  }
];

export const DEFAULT_TASKS: EarningTask[] = [
  {
    id: 'task-1',
    title: 'Daily Attendance Bonus',
    description: 'Claim your free daily login bonus reward instantly.',
    reward: 50,
    timerSeconds: 0,
    category: 'daily_checkin',
    completedBy: [],
    iconName: 'CalendarCheck'
  },
  {
    id: 'task-2',
    title: 'Watch Sponsored Video Reel',
    description: 'Watch a 15-second sponsor video to earn PKR 30 balance.',
    reward: 30,
    timerSeconds: 15,
    category: 'ad_watch',
    completedBy: [],
    iconName: 'PlayCircle'
  },
  {
    id: 'task-3',
    title: 'Complete Feedback Survey',
    description: 'Provide quick platform feedback and rate your experience.',
    reward: 80,
    timerSeconds: 30,
    category: 'survey',
    completedBy: [],
    iconName: 'CheckSquare'
  },
  {
    id: 'task-4',
    title: 'Join Telegram Channel',
    description: 'Subscribe to our official Telegram channel for updates and promo codes.',
    reward: 100,
    timerSeconds: 10,
    category: 'task',
    completedBy: [],
    iconName: 'Send'
  }
];

export const DEFAULT_PROMOCODES: PromoCode[] = [
  {
    id: 'promo-1',
    code: 'SIGMA2026',
    rewardAmount: 200,
    maxUses: 100,
    usedCount: 0,
    usedByUsers: [],
    isActive: true,
    createdAt: Date.now()
  },
  {
    id: 'promo-2',
    code: 'WELCOME100',
    rewardAmount: 100,
    maxUses: 500,
    usedCount: 0,
    usedByUsers: [],
    isActive: true,
    createdAt: Date.now()
  },
  {
    id: 'promo-3',
    code: 'JAZZBONUS',
    rewardAmount: 150,
    maxUses: 250,
    usedCount: 0,
    usedByUsers: [],
    isActive: true,
    createdAt: Date.now()
  }
];

export const DEFAULT_POOLS: InvestmentPool[] = [
  {
    id: 'pool-coconut-cove',
    name: 'Coconut Cove Pool',
    dailyReturnPercent: 5.0,
    durationDays: 50,
    totalReturnPercent: 250,
    fundedPercent: 53,
    bannerImage: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
    isFeatured: true,
    minInvestment: 500,
    maxInvestment: 50000,
    status: 'open',
    totalRaised: 265000,
    targetAmount: 500000,
    category: 'High Growth'
  },
  {
    id: 'pool-dolphin-cove',
    name: 'Dolphin Cove Pool',
    dailyReturnPercent: 6.0,
    durationDays: 45,
    totalReturnPercent: 270,
    fundedPercent: 78,
    bannerImage: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800&q=80',
    isFeatured: true,
    minInvestment: 1000,
    maxInvestment: 100000,
    status: 'open',
    totalRaised: 390000,
    targetAmount: 500000,
    category: 'VIP Yield'
  },
  {
    id: 'pool-pearl-island',
    name: 'Pearl Island Pool',
    dailyReturnPercent: 5.0,
    durationDays: 30,
    totalReturnPercent: 150,
    fundedPercent: 92,
    bannerImage: 'https://images.unsplash.com/photo-1512100356356-de1b84283e18?auto=format&fit=crop&w=800&q=80',
    isFeatured: false,
    minInvestment: 100,
    maxInvestment: 20000,
    status: 'open',
    totalRaised: 184000,
    targetAmount: 200000,
    category: 'Starter Pool'
  },
  {
    id: 'pool-palm-oasis',
    name: 'Palm Oasis Pool',
    dailyReturnPercent: 7.5,
    durationDays: 60,
    totalReturnPercent: 450,
    fundedPercent: 41,
    bannerImage: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
    isFeatured: true,
    minInvestment: 5000,
    maxInvestment: 200000,
    status: 'open',
    totalRaised: 410000,
    targetAmount: 1000000,
    category: 'Super Vault'
  }
];

export const DEFAULT_WITHDRAWAL_PROOFS: WithdrawalProofItem[] = [
  {
    id: 'proof-1',
    userId: 'u-101',
    userName: '03171997254',
    phoneMasked: '0317199****',
    method: 'JazzCash',
    amount: 10000,
    rewardBonus: 2,
    likes: 52,
    likedBy: [],
    comments: [
      { id: 'c-1', userName: 'Adnan', text: 'Congrats brother! Fast payout as always.', timestamp: Date.now() - 3600000 },
      { id: 'c-2', userName: 'Kamran', text: 'Alhamdulillah received mine yesterday too!', timestamp: Date.now() - 1800000 }
    ],
    timeAgo: '1 day ago',
    timestamp: Date.now() - 86400000,
    caption: 'Rs. 10,000 received via JazzCash. Alhamdulillah! 🎉',
    verified: true
  },
  {
    id: 'proof-2',
    userId: 'u-102',
    userName: 'khan',
    phoneMasked: '0304*****40',
    method: 'JazzCash',
    amount: 5067,
    rewardBonus: 2,
    likes: 38,
    likedBy: [],
    comments: [
      { id: 'c-3', userName: 'Usman', text: 'Very reliable platform!', timestamp: Date.now() - 7200000 }
    ],
    timeAgo: '2 days ago',
    timestamp: Date.now() - 172800000,
    caption: 'Got payout within 15 minutes! Thank you Waseela team.',
    verified: true
  },
  {
    id: 'proof-3',
    userId: 'u-103',
    userName: 'Hamza_Trader',
    phoneMasked: '0321*****88',
    method: 'EasyPaisa',
    amount: 15500,
    rewardBonus: 5,
    likes: 89,
    likedBy: [],
    comments: [],
    timeAgo: '3 days ago',
    timestamp: Date.now() - 259200000,
    caption: 'Rs. 15,500 successfully transferred to EasyPaisa wallet. Best investment site!',
    verified: true
  }
];

export const DEFAULT_TEAM_MEMBERS: TeamMember[] = [
  { id: 'tm-1', name: 'Azhar Ali', phone: '0304*****40', level: 1, investedAmount: 100, joinedDate: '2026-07-20', status: 'invested', commissionEarned: 6.0 },
  { id: 'tm-2', name: 'Ramzan', phone: '0320*****65', level: 1, investedAmount: 0, joinedDate: '2026-07-20', status: 'not_invested', commissionEarned: 0 },
  { id: 'tm-3', name: 'Hamza', phone: '0391*****55', level: 1, investedAmount: 0, joinedDate: '2026-07-20', status: 'not_invested', commissionEarned: 0 },
  { id: 'tm-4', name: 'Adnan', phone: '0307*****10', level: 1, investedAmount: 1502, joinedDate: '2026-07-24', status: 'invested', commissionEarned: 90.12 },
  { id: 'tm-5', name: 'Naeem', phone: '0315*****99', level: 1, investedAmount: 1000, joinedDate: '2026-07-28', status: 'invested', commissionEarned: 60.0 },
  { id: 'tm-6', name: 'Shahid', phone: '0333*****12', level: 2, investedAmount: 2500, joinedDate: '2026-07-29', status: 'invested', commissionEarned: 75.0 },
  { id: 'tm-7', name: 'Tariq', phone: '0300*****44', level: 2, investedAmount: 3387, joinedDate: '2026-07-30', status: 'invested', commissionEarned: 101.61 },
  { id: 'tm-8', name: 'Faisal', phone: '0308*****77', level: 3, investedAmount: 1200, joinedDate: '2026-08-01', status: 'invested', commissionEarned: 24.0 },
  { id: 'tm-9', name: 'Waqas', phone: '0345*****21', level: 3, investedAmount: 2170, joinedDate: '2026-08-02', status: 'invested', commissionEarned: 43.4 }
];

export const DEFAULT_COMMUNITY_CHATS: CommunityChatMessage[] = [
  { id: 'chat-1', userId: 'm-101', userName: 'Adil Tanveer', text: 'hi everyone, how is everyone performing today?', timestamp: Date.now() - 300000, isVerifiedInvestor: true, room: 'live' },
  { id: 'chat-2', userId: 'm-102', userName: 'Waseela Official', text: 'Welcome to official investor community chat! Share tips and withdrawal proofs here.', timestamp: Date.now() - 600000, isVerifiedInvestor: true, room: 'live' },
  { id: 'chat-3', userId: 'm-103', userName: 'Sigma OG', text: 'Daily profit was credited on time at midnight! Love the platform.', timestamp: Date.now() - 120000, isVerifiedInvestor: true, room: 'live' }
];
