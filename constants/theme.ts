export type ThemeColors = {
  background: string;
  text: string;
  textSecondary: string;
  card: string;
  primary: string;
  border: string;
  error: string;
  success: string;
  tint: string;
  tabIconDefault: string;
  tabIconSelected: string;
};

export const Colors: { light: ThemeColors; dark: ThemeColors } = {
  light: {
    background: '#FFFFFF',
    text: '#000000',
    textSecondary: '#666666',
    card: '#F5F5F5',
    primary: '#007AFF',
    border: '#E5E5E5',
    error: '#FF3B30',
    success: '#34C759',
    tint: '#2f95dc',
    tabIconDefault: '#ccc',
    tabIconSelected: '#2f95dc',
  },
  dark: {
    background: '#000000',
    text: '#FFFFFF',
    textSecondary: '#A1A1A1',
    card: '#1C1C1E',
    primary: '#0A84FF',
    border: '#38383A',
    error: '#FF453A',
    success: '#32D74B',
    tint: '#fff',
    tabIconDefault: '#ccc',
    tabIconSelected: '#fff',
  },
};
