import { theme } from './theme';

export const buttonStyles = {
  primary: {
    background: theme.colors.primary,
    color: '#fff',
    border: 'none',
    padding: '10px 16px',
    borderRadius: theme.radius.sm,
    cursor: 'pointer',
  },
  secondary: {
    background: theme.colors.primary,
    color: '#fff',
    border: 'none',
    padding: '10px 16px',
    borderRadius: theme.radius.sm,
    cursor: 'pointer',
  },

  link: {
    background: 'transparent',
    border: 'none',
    color: theme.colors.primary,
    cursor: 'pointer',
    marginRight: '8px',
  },

  dangerLink: {
    background: 'transparent',
    border: 'none',
    color: theme.colors.danger,
    cursor: 'pointer',
  },
  icon: {
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    padding: '6px',
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  paginationButtonStyle: (disabled: boolean) => ({
    background: '#f1f5f9',
    border: '1px solid #cbd5e1',
    borderRadius: '6px',
    padding: '6px',
    color: '#0f172a',
    opacity: disabled ? 0.4 : 1,
    cursor: disabled ? 'not-allowed' : 'pointer',
  }),
};
