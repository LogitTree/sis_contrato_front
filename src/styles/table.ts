export const tableStyles = {
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    tableLayout: 'fixed' as const, // 🔥 ESSENCIAL
  },

  th: {
    textAlign: 'left' as const,
    fontSize: '13px',
    fontWeight: 600,
    color: '#6b7280',
    paddingBottom: '12px',
  },

  td: {
    padding: '12px 0',
    borderTop: '1px solid #e5e7eb',
    fontSize: '14px',
    color: '#111827',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
};
