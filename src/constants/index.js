import { lightColors } from '../theme/Themes';

export const COLORS = lightColors;

export const CATEGORIES = [
  { label: 'Food' },
  { label: 'Games' },
  { label: 'Transport' },
  { label: 'Shopping' },
  { label: 'Needs' },
  { label: 'Wants' },
  { label: 'Health' },
  { label: 'Other' },
];

export const formatPeso = (amount) => {
  return '₱' + Number(amount).toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

export const STORAGE_KEYS = {
  wallets: 'sv_wallets',
  transactions: 'sv_transactions',
  goals: 'sv_goals',
  isSetup: 'sv_is_setup',
  theme: 'sv_theme',
  profile: 'sv_profile',
};