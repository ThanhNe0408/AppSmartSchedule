export const COLORS = {
  // Main theme colors
  primary: '#4CAF50',
  primaryLight: '#81C784',
  primaryDark: '#388E3C',
  secondary: '#2E7D32',
  tertiary: '#C8E6C9',

  // Text colors
  text: '#333333',
  textLight: '#666666',
  textDark: '#000000',
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',

  // UI colors
  background: '#F5F5F5',
  border: '#E0E0E0',

  // Status colors
  status: {
    success: '#4CAF50',
    error: '#D32F2F',
    warning: '#F57C00',
    info: '#1976D2',
  },

  // Event category colors
  eventColors: {
    work: {
      light: '#E3F2FD',
      main: '#2196F3',
      dark: '#1976D2',
      text: 'Công việc'
    },
    study: {
      light: '#F3E5F5',
      main: '#9C27B0',
      dark: '#7B1FA2',
      text: 'Học tập'
    },
    meeting: {
      light: '#E8F5E9',
      main: '#4CAF50',
      dark: '#388E3C',
      text: 'Cuộc họp'
    },
    personal: {
      light: '#FFF3E0',
      main: '#FF9800',
      dark: '#F57C00',
      text: 'Cá nhân'
    },
    health: {
      light: '#FFEBEE',
      main: '#F44336',
      dark: '#D32F2F',
      text: 'Sức khỏe'
    },
    entertainment: {
      light: '#E0F7FA',
      main: '#00BCD4',
      dark: '#0097A7',
      text: 'Giải trí'
    },
    travel: {
      light: '#F1F8E9',
      main: '#8BC34A',
      dark: '#689F38',
      text: 'Du lịch'
    },
    other: {
      light: '#FAFAFA',
      main: '#9E9E9E',
      dark: '#616161',
      text: 'Khác'
    }
  },

  // Dark theme colors
  dark: {
    background: '#121212',
    card: '#1E1E1E',
    border: '#333333',
    text: '#FFFFFF',
    textLight: '#AAAAAA'
  },

  // Background colors
  card: "#FFFFFF",
  darkCard: "#1E211E",

  // Text colors
  darkText: "#FFFFFF",
  darkTextLight: "#B4BCB4",

  // Border colors
  darkBorder: "#2C332C",

  // Additional theme colors
  accent: "#66BB6A",
  accentLight: "#A5D6A7",
  surface: "#FFFFFF",
  darkSurface: "#121712",
  onSurface: "#1A1D1A",
  darkOnSurface: "#FFFFFF",
  elevation: "#0A0F0A",
}

export const FONTS = {
  regular: "System",
  medium: "System",
  bold: "System",
}

export const SIZES = {
  // Global sizes
  base: 8,
  font: 14,
  radius: 12,
  padding: 24,

  // Font sizes
  h1: 30,
  h2: 24,
  h3: 20,
  h4: 16,
  body1: 30,
  body2: 22,
  body3: 16,
  body4: 14,
  body5: 12,

  // App dimensions
  width: "100%",
  height: "100%",
}

export const SHADOWS = {
  light: {
    shadowColor: COLORS.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 2,
  },
  medium: {
    shadowColor: COLORS.black,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 6.27,
    elevation: 4,
  },
  dark: {
    shadowColor: COLORS.black,
    shadowOffset: {
      width: 0,
      height: 7,
    },
    shadowOpacity: 0.2,
    shadowRadius: 9.11,
    elevation: 8,
  },
}

const appTheme = { COLORS, FONTS, SIZES, SHADOWS }

export default appTheme
