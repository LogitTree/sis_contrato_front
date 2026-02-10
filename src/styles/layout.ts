import type { CSSProperties } from 'react';

export const layoutStyles: {
  page: CSSProperties;
  header: CSSProperties;
  card: CSSProperties;
  title: CSSProperties;
  subtitle: CSSProperties;
} = {
  page: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',      // 🔥 FUNDAMENTAL
    padding: '24px',
    backgroundColor: '#f3f4f6',
    boxSizing: 'border-box',
    width:'100%'
  },

  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',        // 🔥 ocupa toda a largura
    flexShrink: 0,        // 🔥 impede encolhimento
  },

  card: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '24px',
    display: 'flex',      // 🔥 FUNDAMENTAL
    flexDirection: 'column',
    overflow: 'hidden',   // 🔥 evita estourar
    minHeight: 0,
  },

  title: {
    fontSize: '24px',
    fontWeight: 600,
    color: '#111827',
  },

  subtitle: {
    fontSize: '18px',
    fontWeight: 600,
    color: '#111827',
    marginBottom: '12px',
  },
};
