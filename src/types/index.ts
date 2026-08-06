export type UserRole = 'user' | 'admin';
export type UserStatus = 'active' | 'banned';

export interface UserProfile {
  uid: string;
  email: string;
  fullName: string;
  phone: string;
  passwordText?: string; // Stored securely for admin inspection as explicitly requested
  balance: number;
  totalEarnings: number;
  totalDeposited: number;
  totalWithdrawn: number;
  status: UserStatus;
  role: UserRole;
  createdAt: number;
  referredBy?: string;
  referralCode: string;
  referralCount?: number;
  referralEarnings?: number;
  themePreference?: 'dark' | 'light';
  lastCheckinTimestamp?: number;
}

export type TransactionType = 
  | 'deposit' 
  | 'withdrawal' 
  | 'task_earning' 
  | 'promo_reward' 
  | 'referral_bonus' 
  | 'plan_purchase'
  | 'plan_profit'
  | 'admin_adjustment';

export type PaymentMethod = 'JazzCash' | 'EasyPaisa' | 'Internal';
export type TransactionStatus = 'pending' | 'approved' | 'rejected';

export interface Transaction {
  id: string;
  userId: string;
  userEmail: string;
  userPhone: string;
  userName: string;
  type: TransactionType;
  method: PaymentMethod;
  accountTitle?: string;
  accountNumber?: string;
  amount: number;
  transactionId?: string; // TID / Ref for deposits
  screenshotUrl?: string;
  status: TransactionStatus;
  rejectionReason?: string;
  createdAt: number;
  processedAt?: number;
  adminNote?: string;
}

export interface InvestmentPlan {
  id: string;
  name: string;
  price: number;
  dailyProfitPercent: number; // e.g. 6%
  dailyProfitAmount: number; // e.g. 60 PKR
  durationDays: number; // e.g. 30 days
  totalReturnAmount: number; // e.g. 1800 PKR
  totalReturnPercent: number; // e.g. 180%
  description: string;
  badgeText?: string;
  isActive: boolean;
  createdAt: number;
}

export interface UserInvestment {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  planId: string;
  planName: string;
  investedAmount: number;
  dailyProfit: number;
  durationDays: number;
  daysClaimed: number;
  lastClaimTimestamp: number;
  nextClaimTimestamp: number;
  totalClaimedAmount: number;
  status: 'active' | 'completed';
  purchasedAt: number;
}

export interface NotificationToastItem {
  id: string;
  txId: string;
  type: 'deposit' | 'withdrawal';
  status: 'approved' | 'rejected';
  amount: number;
  method: string;
  rejectionReason?: string;
  timestamp: number;
}

export interface PromoCode {
  id: string;
  code: string;
  rewardAmount: number;
  maxUses: number;
  usedCount: number;
  usedByUsers: string[]; // user UIDs
  expiryDate?: string;
  createdAt: number;
  isActive: boolean;
}

export interface EarningTask {
  id: string;
  title: string;
  description: string;
  reward: number;
  timerSeconds: number;
  category: 'daily_checkin' | 'ad_watch' | 'survey' | 'task';
  completedBy: string[]; // user UIDs
  iconName?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'admin';
  senderName: string;
  text: string;
  timestamp: number;
}

export interface SupportTicket {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  userPhone: string;
  subject: string;
  category: string;
  status: 'open' | 'in_progress' | 'resolved';
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

export interface InvestmentPool {
  id: string;
  name: string;
  dailyReturnPercent: number; // e.g. 5.0%
  durationDays: number; // e.g. 50
  totalReturnPercent: number; // e.g. 250%
  fundedPercent: number; // e.g. 53%
  bannerImage: string;
  isFeatured?: boolean;
  minInvestment: number; // e.g. 100 PKR
  maxInvestment: number;
  status: 'open' | 'running' | 'matured';
  totalRaised: number;
  targetAmount: number;
  endDate?: string;
  category?: string;
}

export interface TeamMember {
  id: string;
  name: string;
  phone: string;
  level: 1 | 2 | 3 | 4 | 5;
  investedAmount: number;
  joinedDate: string;
  status: 'invested' | 'not_invested';
  commissionEarned: number;
}

export interface ProofComment {
  id: string;
  userName: string;
  userAvatar?: string;
  text: string;
  timestamp: number;
}

export interface WithdrawalProofItem {
  id: string;
  userId: string;
  userName: string;
  phoneMasked: string;
  method: 'JazzCash' | 'EasyPaisa' | 'Bank';
  amount: number;
  rewardBonus?: number;
  likes: number;
  likedBy: string[];
  comments: ProofComment[];
  timeAgo: string;
  timestamp: number;
  caption: string;
  verified: boolean;
  userAvatar?: string;
}

export interface CommunityChatMessage {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  text: string;
  timestamp: number;
  isVerifiedInvestor?: boolean;
  room: 'live' | 'dm' | 'groups';
}

export interface SavedAccount {
  id: string;
  method: 'JazzCash' | 'EasyPaisa';
  accountTitle: string;
  accountNumber: string;
  isDefault: boolean;
}

export interface SystemConfig {
  siteName: string;
  announcementBanner: string;
  currencySymbol: string;
  minDeposit: number;
  minWithdrawal: number;
  jazzcashNumber: string;
  jazzcashTitle: string;
  easypaisaNumber: string;
  easypaisaTitle: string;
  supportEmail: string;
  supportPhone: string;
  supportWhatsApp: string;
  customApiKeys: Record<string, string>;
  externalLinks: Record<string, string>;
  maintenanceMode: boolean;
  referralBonusAmount: number;
  dailyCheckinReward: number;
  videoAdReward?: number;
  surveyReward?: number;
  appReviewReward?: number;
  allowedAdminEmails?: string[];
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

export interface UserActivityLog {
  id?: string;
  userId: string;
  userEmail: string;
  actionType: 'login' | 'promo_claim' | 'deposit_request' | 'withdrawal_request' | 'task_claim' | 'plan_purchase' | 'pool_investment' | string;
  description: string;
  timestamp: number;
  details?: Record<string, any>;
}
