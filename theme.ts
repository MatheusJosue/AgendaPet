// Glassmorphism theme constants

export const colors = {
  primary: '#6366F1',      // Indigo
  primaryDark: '#4F46E5',
  secondary: '#8B5CF6',    // Purple
  accent: '#10B981',       // Emerald

  background: '#0F172A',    // Dark slate
  backgroundLight: '#1E293B',

  glass: 'rgba(255, 255, 255, 0.1)',
  glassBorder: 'rgba(255, 255, 255, 0.2)',
  glassShadow: 'rgba(0, 0, 0, 0.3)',

  text: '#FFFFFF',
  textSecondary: 'rgba(255, 255, 255, 0.7)',
  textMuted: 'rgba(255, 255, 255, 0.5)',

  error: '#EF4444',
  success: '#10B981',
  warning: '#F59E0B',
};

export const glassStyle = {
  backgroundColor: colors.glass,
  borderRadius: 20,
  borderWidth: 1,
  borderColor: colors.glassBorder,
  shadowColor: colors.glassShadow,
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.3,
  shadowRadius: 16,
  elevation: 10,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const fontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 24,
  xxl: 32,
  title: 40,
};
