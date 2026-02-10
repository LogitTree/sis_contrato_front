import type { CSSProperties } from 'react';

export const sidebarStyles: Record<string, CSSProperties> = {
    container: {
        width: '240px',
        backgroundColor: '#111827',
        color: '#e5e7eb',
        display: 'flex',
        flexDirection: 'column',
        padding: '16px 12px',
    },

    logo: {
        fontSize: '18px',
        fontWeight: 700,
        color: '#fff',
        marginBottom: '24px',
    },

    menuItem: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '10px 12px',
        fontSize: '14px', // 🔥 fonte menor
        borderRadius: '8px',
        cursor: 'pointer',
        color: '#d1d5db',
    },

    menuItemHover: {
        backgroundColor: '#1f2937',
    },

    submenu: {
        marginLeft: '12px',
        marginTop: '6px',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
    },

    submenuItem: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 12px',
        fontSize: '13px',
        borderRadius: '6px',
        cursor: 'pointer',
        color: '#9ca3af',
    },

    activeItem: {
        backgroundColor: '#1f2937',
        color: '#ffffff',
    },

    activeSubItem: {
        backgroundColor: '#374151',
        color: '#ffffff',
    },

};
