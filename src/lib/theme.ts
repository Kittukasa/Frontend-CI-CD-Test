// Gen-Z focused theme configuration with neon gradients and dark-mode default

export const colors = {
  // Neon accent colors
  neon: {
    cyan: '#00FFFF',
    pink: '#FF00FF',
    green: '#00FF00',
    purple: '#8B00FF',
    orange: '#FF4500',
    yellow: '#FFFF00',
  },

  // Dark theme (default)
  dark: {
    background: '#0A0A0B',
    surface: '#1A1A1D',
    surfaceHover: '#2A2A2D',
    border: '#333338',
    text: '#FFFFFF',
    textSecondary: '#A0A0A8',
    textMuted: '#6B6B73',
    primary: '#00FFFF',
    secondary: '#FF00FF',
    accent: '#8B00FF',
    success: '#00FF88',
    warning: '#FFB800',
    error: '#FF4757',
    info: '#3742FA',
  },

  // Light theme (optional)
  light: {
    background: '#FFFFFF',
    surface: '#F8F9FA',
    surfaceHover: '#E9ECEF',
    border: '#DEE2E6',
    text: '#212529',
    textSecondary: '#6C757D',
    textMuted: '#ADB5BD',
    primary: '#0066CC',
    secondary: '#6F42C1',
    accent: '#E83E8C',
    success: '#28A745',
    warning: '#FFC107',
    error: '#DC3545',
    info: '#17A2B8',
  },
};

export const gradients = {
  neon: {
    primary: 'linear-gradient(135deg, #00FFFF 0%, #FF00FF 100%)',
    secondary: 'linear-gradient(135deg, #8B00FF 0%, #00FFFF 100%)',
    success: 'linear-gradient(135deg, #00FF88 0%, #00FFFF 100%)',
    warning: 'linear-gradient(135deg, #FFB800 0%, #FF4500 100%)',
    rainbow:
      'linear-gradient(135deg, #FF00FF 0%, #00FFFF 25%, #00FF00 50%, #FFFF00 75%, #FF4500 100%)',
  },
  glass: {
    light: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
    dark: 'linear-gradient(135deg, rgba(0, 0, 0, 0.2) 0%, rgba(0, 0, 0, 0.1) 100%)',
  },
};

export const shadows = {
  neon: {
    cyan: '0 0 20px rgba(0, 255, 255, 0.5)',
    pink: '0 0 20px rgba(255, 0, 255, 0.5)',
    purple: '0 0 20px rgba(139, 0, 255, 0.5)',
    green: '0 0 20px rgba(0, 255, 136, 0.5)',
  },
  glass: {
    light: '0 8px 32px rgba(31, 38, 135, 0.37)',
    dark: '0 8px 32px rgba(0, 0, 0, 0.37)',
  },
  elevation: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
  },
};

export const animations = {
  duration: {
    fast: '150ms',
    normal: '300ms',
    slow: '500ms',
  },
  easing: {
    default: 'cubic-bezier(0.4, 0, 0.2, 1)',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    smooth: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  },
};

export const spacing = {
  xs: '0.25rem', // 4px
  sm: '0.5rem', // 8px
  md: '1rem', // 16px
  lg: '1.5rem', // 24px
  xl: '2rem', // 32px
  '2xl': '3rem', // 48px
  '3xl': '4rem', // 64px
  '4xl': '6rem', // 96px
};

export const borderRadius = {
  sm: '0.375rem', // 6px
  md: '0.5rem', // 8px
  lg: '0.75rem', // 12px
  xl: '1rem', // 16px
  '2xl': '1.5rem', // 24px
  full: '9999px',
};

export const typography = {
  fontFamily: {
    sans: ['Inter', 'system-ui', 'sans-serif'],
    mono: ['JetBrains Mono', 'Consolas', 'monospace'],
  },
  fontSize: {
    xs: ['0.75rem', { lineHeight: '1rem' }],
    sm: ['0.875rem', { lineHeight: '1.25rem' }],
    base: ['1rem', { lineHeight: '1.5rem' }],
    lg: ['1.125rem', { lineHeight: '1.75rem' }],
    xl: ['1.25rem', { lineHeight: '1.75rem' }],
    '2xl': ['1.5rem', { lineHeight: '2rem' }],
    '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
    '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
    '5xl': ['3rem', { lineHeight: '1' }],
  },
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
  },
};

// Category emoji mappings
export const categoryEmojis: Record<string, string> = {
  food: '🍔',
  shopping: '🛍️',
  health: '💊',
  travel: '🚌',
  utilities: '🏠',
  entertainment: '🎬',
  education: '📚',
  groceries: '🛒',
  fuel: '⛽',
  other: '📄',
};

// KPI emoji mappings
export const kpiEmojis = {
  totalSpend: '💸',
  savings: '💰',
  budget: '🎯',
  points: '⭐',
  streak: '🔥',
  eco: '🌱',
  bills: '📄',
  stores: '🏪',
};

// Glassmorphism utility
export const glassmorphism = {
  light: {
    background: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
  },
  dark: {
    background: 'rgba(0, 0, 0, 0.2)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
  },
};

// Theme configuration
export const themeConfig = {
  defaultMode: 'dark' as const,
  colors,
  gradients,
  shadows,
  animations,
  spacing,
  borderRadius,
  typography,
  categoryEmojis,
  kpiEmojis,
  glassmorphism,
};
