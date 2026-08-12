import { useTheme } from '../contexts/ThemeContext';
import { themes } from '../theme';

export const useThemeColors = () => {
  const { theme } = useTheme();
  const currentTheme = themes[theme];

  return {
    theme,
    colors: currentTheme.colors,
    isDark: theme === 'dark',
    isLight: theme === 'light'
  };
};
