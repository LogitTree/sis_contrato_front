export const filterStyles = {
  container: {
    position: 'relative' as const,
    padding: '20px 16px 16px 16px',
    marginBottom: '16px',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    background: '#ffffff',
  },

  title: {
    position: 'absolute' as const,
    top: '-10px',
    left: '12px',
    padding: '0 6px',
    background: '#ffffff',
    fontSize: '12px',
    fontWeight: 600,
    color: '#374151',
  },

  row: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
  },

  input: {
    padding: '10px 12px',
    borderRadius: '6px',
    border: '1px solid #d1d5db',
    fontSize: '14px',
    width: '80%',
    color: '#111827',
    background: '#ffffff',
    outline: 'none',
  },

  select: {
    padding: '10px 12px',
    borderRadius: '6px',
    border: '1px solid #d1d5db',
    fontSize: '14px',
    color: '#111827',
    background: '#ffffff',
    outline: 'none',
    width: '15%',
  },
};
