// lib/theme.ts
export const themeColors = {
  // Brand colors - based on Instant's green
  brand: {
    primary: '#4CD964', // The green from the badges and charts
    secondary: '#f8f9fc', // The light background
    accent: '#1D1D1F', // Dark text
  },
  
  // Light mode colors
  light: {
    background: {
      DEFAULT: '#FFFFFF',
      secondary: '#f8f9fc',
      tertiary: '#f2f4f7',
    },
    foreground: {
      DEFAULT: '#1D1D1F',
      muted: '#6B7280',
      subtle: '#9CA3AF',
    },
    border: {
      DEFAULT: '#E5E7EB',
      strong: '#D1D5DB',
    },
    card: {
      DEFAULT: '#FFFFFF',
      secondary: '#f8f9fc',
    },
    success: {
      DEFAULT: '#4CD964',
      foreground: '#FFFFFF',
      muted: 'rgba(76, 217, 100, 0.1)',
    },
    info: {
      DEFAULT: '#4DA6FF',
      foreground: '#FFFFFF',
      muted: 'rgba(77, 166, 255, 0.1)',
    },
    warning: {
      DEFAULT: '#FFC107',
      foreground: '#1D1D1F',
      muted: 'rgba(255, 193, 7, 0.1)',
    },
    destructive: {
      DEFAULT: '#FF4D4D',
      foreground: '#FFFFFF',
      muted: 'rgba(255, 77, 77, 0.1)',
    },
  },
  
  // Dark mode colors
  dark: {
    background: {
      DEFAULT: '#1D1D1F',
      secondary: '#2A2A2D',
      tertiary: '#3A3A3D',
    },
    foreground: {
      DEFAULT: '#FFFFFF',
      muted: '#9CA3AF',
      subtle: '#6B7280',
    },
    border: {
      DEFAULT: '#3A3A3D',
      strong: '#4A4A4D',
    },
    card: {
      DEFAULT: '#2A2A2D',
      secondary: '#3A3A3D',
    },
    success: {
      DEFAULT: '#4CD964',
      foreground: '#FFFFFF',
      muted: 'rgba(76, 217, 100, 0.15)',
    },
    info: {
      DEFAULT: '#4DA6FF',
      foreground: '#FFFFFF',
      muted: 'rgba(77, 166, 255, 0.15)',
    },
    warning: {
      DEFAULT: '#FFC107',
      foreground: '#FFFFFF',
      muted: 'rgba(255, 193, 7, 0.15)',
    },
    destructive: {
      DEFAULT: '#FF4D4D',
      foreground: '#FFFFFF',
      muted: 'rgba(255, 77, 77, 0.15)',
    },
  },
};

// Theme configuration for other UI properties
export const themeConfig = {
  // Border radius - Instant uses minimal rounded corners
  radius: {
    none: '0',
    sm: '4px',
    md: '6px',
    lg: '8px',
    full: '9999px',
  },
  
  // Shadows - Instant uses very subtle shadows
  shadow: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.03)',
    DEFAULT: '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.03)',
  },
  
  // Font settings
  font: {
    sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"',
    mono: 'SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
  },
  
  // Animation durations
  animation: {
    fast: '150ms',
    DEFAULT: '250ms',
    slow: '350ms',
  },
};