import type { CSSProperties } from 'react';

export const formStyles: {
  form: CSSProperties;
  field: CSSProperties;
  row: CSSProperties;
  label: CSSProperties;
  input: CSSProperties;
  select: CSSProperties;
  actions: CSSProperties;
  textarea:CSSProperties;
  
} = {
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    flex: 1,
    overflowY: 'auto',
    width: '100%',
  },

  row: {
    display: 'flex',
    gap: '16px',
    flexWrap: 'wrap', // 🔥 evita campos apertados
  },

  field: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '6px',
    flex: 1,
  },

  label: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#374151',
  },

  input: {
    padding: '10px 12px',
    borderRadius: '6px',
    border: '1px solid #d1d5db',
    fontSize: '14px',
    color: '#111827',
    outline: 'none',
    background: '#ffffff',
  },

  select: {
    padding: '10px 12px',
    borderRadius: '6px',
    border: '1px solid #d1d5db',
    fontSize: '14px',
    color: '#111827',
    background: '#ffffff',
  },

  actions: {
    display: 'flex',
    gap: '12px',
  },

  textarea: {
    padding: 10,
    borderRadius: 6,
    border: '1px solid #d1d5db',
    backgroundColor: '#ffffff',   // 🔥 fundo branco
    color: '#111827',              // 🔥 texto escuro
    fontSize: 14,
    resize: 'vertical',
    minHeight: 80,
  }
};
