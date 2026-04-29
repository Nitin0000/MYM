import { Ionicons } from '@expo/vector-icons';

export type IconName = React.ComponentProps<typeof Ionicons>['name'];

export const Icons = {
  // Navigation & Header
  profile: 'person-circle' as IconName,
  
  // Dashboard & Transactions
  income: 'arrow-down-circle' as IconName,
  expense: 'arrow-up-circle' as IconName,
  cash: 'cash' as IconName,
  cart: 'cart' as IconName,
  tag: 'pricetag-outline' as IconName,
  edit: 'create-outline' as IconName,

  // Expense/Income metadata
  fixed: 'lock-closed' as IconName,
  variable: 'shuffle' as IconName,
  essential: 'shield-checkmark' as IconName,
  frequency: 'repeat' as IconName,
  oneTime: 'flash' as IconName,
  filter: 'funnel-outline' as IconName,
  chevronBack: 'chevron-back' as IconName,
  chevronForward: 'chevron-forward' as IconName,
  wallet: 'wallet-outline' as IconName,
  business: 'briefcase-outline' as IconName,
  freelance: 'laptop-outline' as IconName,
  investment: 'trending-up' as IconName,
  gift: 'gift-outline' as IconName,
  
  // Empty states
  emptyTransactions: 'receipt-outline' as IconName,
  emptyDashboard: 'leaf-outline' as IconName,
  
  // Status / Actions
  loading: 'hourglass' as IconName,
  success: 'checkmark-circle' as IconName,
  
  // Profile specific
  email: 'mail-outline' as IconName,
  name: 'person-outline' as IconName,
  google: 'logo-google' as IconName,
  password: 'lock-closed-outline' as IconName,
  calendar: 'calendar-outline' as IconName,
  mailProvider: 'mail' as IconName,
  logout: 'log-out-outline' as IconName,
};
