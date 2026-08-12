export const themes = {
  dark: {
    colors: {
      primary: {
        gold: '#D4AF37',
        goldDark: '#AA7B30',
        goldLight: '#E6C587',
        goldGradient: 'linear-gradient(to right, #AA7B30, #D4AF37)'
      },
      background: {
        primary: '#0b0b0b',
        secondary: '#121212',
        tertiary: '#000000',
        card: '#0b0b0b/80',
        surface: '#121212'
      },
      text: {
        primary: '#FFFFFF',
        secondary: '#E6C587',
        muted: '#9CA3AF',
        disabled: '#6B7280',
        error: '#EF4444',
        success: '#10B981',
        warning: '#F59E0B'
      },
      borders: {
        default: '#1F2937',
        light: '#374151',
        gold: '#D4AF37/30',
        goldLight: '#D4AF37/20'
      },
      status: {
        available: {
          bg: 'bg-emerald-950/40',
          text: 'text-emerald-400',
          border: 'border-emerald-500/20',
          indicator: 'bg-emerald-500'
        },
        occupied: {
          bg: 'bg-blue-950/40',
          text: 'text-blue-400',
          border: 'border-blue-500/20',
          indicator: 'bg-blue-500'
        },
        cleaning: {
          bg: 'bg-amber-950/40',
          text: 'text-amber-500',
          border: 'border-amber-500/20',
          indicator: 'bg-amber-500'
        },
        maintenance: {
          bg: 'bg-red-950/40',
          text: 'text-red-400',
          border: 'border-red-500/20',
          indicator: 'bg-red-500'
        }
      }
    }
  },
  light: {
    colors: {
      primary: {
        gold: '#D4AF37',
        goldDark: '#AA7B30',
        goldLight: '#E6C587',
        goldGradient: 'linear-gradient(to right, #AA7B30, #D4AF37)'
      },
      background: {
        primary: '#F8F6F2',
        secondary: '#FFFFFF',
        tertiary: '#FAFAF9',
        card: '#FFFFFF',
        surface: '#FAFAF9'
      },
      text: {
        primary: '#111827',
        secondary: '#4B5563',
        muted: '#6B7280',
        disabled: '#9CA3AF',
        error: '#EF4444',
        success: '#10B981',
        warning: '#F59E0B'
      },
      borders: {
        default: '#E5E7EB',
        light: '#F3F4F6',
        gold: '#D4AF37/30',
        goldLight: '#D4AF37/20'
      },
      status: {
        available: {
          bg: 'bg-emerald-50',
          text: 'text-emerald-700',
          border: 'border-emerald-200',
          indicator: 'bg-emerald-500'
        },
        occupied: {
          bg: 'bg-blue-50',
          text: 'text-blue-700',
          border: 'border-blue-200',
          indicator: 'bg-blue-500'
        },
        cleaning: {
          bg: 'bg-amber-50',
          text: 'text-amber-700',
          border: 'border-amber-200',
          indicator: 'bg-amber-500'
        },
        maintenance: {
          bg: 'bg-red-50',
          text: 'text-red-700',
          border: 'border-red-200',
          indicator: 'bg-red-500'
        }
      }
    }
  }
};

export type ThemeName = keyof typeof themes;
export type Theme = typeof themes[ThemeName];
