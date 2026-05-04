import React, { createContext, useState, useContext, useCallback, useMemo } from 'react';
import { X } from 'lucide-react';

const ToastContext = createContext();

export const useToast = () => useContext(ToastContext);

let idCounter = 0;

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const remove = useCallback((id) => setToasts(prev => prev.filter(t => t.id !== id)), []);

    const addToast = useCallback((message, type = 'info', duration = 3500) => {
        const id = ++idCounter;
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => remove(id), duration);
    }, [remove]);

    const toast = useMemo(() => ({
        success: (msg) => addToast(msg, 'success'),
        error:   (msg) => addToast(msg, 'error'),
        info:    (msg) => addToast(msg, 'info'),
        warning: (msg) => addToast(msg, 'warning'),
    }), [addToast]);

    return (
        <ToastContext.Provider value={{ toast }}>
            {children}
            <div style={{ position: 'fixed', bottom: '1.5rem', right: '1.5rem', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                {toasts.map(t => (
                    <div key={t.id} onClick={() => remove(t.id)} style={{
                        display: 'flex', alignItems: 'center', gap: '0.625rem',
                        padding: '0.875rem 1.25rem', borderRadius: '0.625rem', cursor: 'pointer',
                        minWidth: '280px', maxWidth: '380px', boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                        animation: 'slideInToast 0.25s ease',
                        background: t.type === 'success' ? '#064e3b' : t.type === 'error' ? '#450a0a' : t.type === 'warning' ? '#451a03' : '#1e3a5f',
                        border: `1px solid ${t.type === 'success' ? '#10b981' : t.type === 'error' ? '#ef4444' : t.type === 'warning' ? '#f59e0b' : '#3b82f6'}`,
                        color: 'white', fontSize: '0.875rem', fontWeight: 500,
                    }}>
                        <span style={{ fontSize: '1.1rem' }}>{t.type === 'success' ? '✅' : t.type === 'error' ? '❌' : t.type === 'warning' ? '⚠️' : 'ℹ️'}</span>
                        <span style={{ flex: 1 }}>{t.message}</span>
                        <X size={14} style={{ opacity: 0.6 }} />
                    </div>
                ))}
            </div>
            <style>{`@keyframes slideInToast { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }`}</style>
        </ToastContext.Provider>
    );
};
