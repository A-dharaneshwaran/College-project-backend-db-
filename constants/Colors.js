const tintColorLight = '#0056D2'; // Vibrant Blue
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#111827',
    background: '#ffffff',
    tint: tintColorLight,
    tabIconDefault: '#9ca3af',
    tabIconSelected: tintColorLight,
    primary: '#0056D2', // Kathir Blue
    secondary: '#FF8C00', // Energetic Orange
    accent: '#6A0DAD', // Royal Purple
    success: '#00A86B', // Fresh Green
    surface: '#F3F4F6', // Light Gray
    card: '#ffffff',
    border: '#E5E7EB',
    textSecondary: '#4B5563',
    warning: '#FFBF00', // Amber
    error: '#DC2626', // Red
    gradients: {
      primary: ['#0056D2', '#6A0DAD'], // Blue -> Purple
      secondary: ['#FF8C00', '#00A86B'], // Orange -> Green
      danger: ['#DC2626', '#FF8C00'], // Red -> Orange
      success: ['#00A86B', '#34D399'], // Green -> Light Green
    }
  },
  dark: {
    text: '#fff',
    background: '#000',
    tint: tintColorDark,
    tabIconDefault: '#ccc',
    tabIconSelected: tintColorDark,
    primary: '#3949ab',
    secondary: '#e53935',
    accent: '#ffa726',
    surface: '#121212',
    card: '#1e1e1e',
    border: '#333',
    textSecondary: '#9ca3af',
    success: '#34d399',
    warning: '#fbbf24',
    error: '#f87171',
    gradients: {
      primary: ['#3949ab', '#6A0DAD'],
      secondary: ['#e53935', '#ffa726'],
      danger: ['#e53935', '#f87171'],
      success: ['#34d399', '#00A86B'],
    }
  },
};

export default Colors;
