// COLORS 
export const COLORS = {
  savings: '#A78BFA',
  expense: '#34D399',
  danger: '#F87171',
  warning: '#FBBF24',
  background: '#0F172A',
  card: '#1E293B',
  text: '#F1F5F9',
  subtext: '#94A3B8',
  border: '#334155',
};

// CATEGORIES
export const CATEGORIES = [
  { label: 'Food',      emoji: '🍜' },
  { label: 'Games',     emoji: '🎮' },
  { label: 'Transport', emoji: '🚌' },
  { label: 'Shopping',  emoji: '🛍️' },
  { label: 'Needs',     emoji: '🏠' },
  { label: 'Wants',     emoji: '✨' },
  { label: 'Health',    emoji: '💊' },
  { label: 'Other',     emoji: '📦' },
];

// CURRENCY FORMATTER
export const formatPeso = (amount) => {
  return '₱' + Number(amount).toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

// WALLET KEYS
export const STORAGE_KEYS = {
  wallets: 'sv_wallets',
  transactions: 'sv_transactions',
  goals: 'sv_goals',
  isSetup: 'sv_is_setup',
};