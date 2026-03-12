import { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import { X, CheckCircle, AlertTriangle, Info, AlertCircle } from 'lucide-react';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

interface Notification {
    id: string;
    message: string;
    type: NotificationType;
}

interface NotificationContextType {
    showNotification: (message: string, type: NotificationType) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
    const [notifications, setNotifications] = useState<Notification[]>([]);

    const showNotification = useCallback((message: string, type: NotificationType) => {
        const id = Math.random().toString(36).substr(2, 9);
        setNotifications(prev => [...prev, { id, message, type }]);

        // Auto remove após 5 segundos
        setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== id));
        }, 5000);
    }, []);

    const removeNotification = (id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    return (
        <NotificationContext.Provider value={{ showNotification }}>
            {children}
            <div className="notification-container" style={{
                position: 'fixed',
                top: '20px',
                right: '20px',
                zIndex: 9999,
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                maxWidth: '400px',
                pointerEvents: 'none'
            }}>
                {notifications.map(n => (
                    <div key={n.id} className={`notification-toast toast-${n.type}`} style={{
                        padding: '12px 16px',
                        borderRadius: '12px',
                        backgroundColor: 'var(--bg-secondary)',
                        border: '1px solid var(--border)',
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
                        backdropFilter: 'blur(10px)',
                        color: 'var(--text-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '12px',
                        animation: 'slideIn 0.3s ease forwards',
                        pointerEvents: 'auto'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            {n.type === 'success' && <CheckCircle size={20} color="#4ade80" />}
                            {n.type === 'error' && <AlertCircle size={20} color="#f87171" />}
                            {n.type === 'warning' && <AlertTriangle size={20} color="#fbbf24" />}
                            {n.type === 'info' && <Info size={20} color="#60a5fa" />}
                            <span style={{ fontSize: '14px', fontWeight: 500 }}>{n.message}</span>
                        </div>
                        <button 
                            onClick={() => removeNotification(n.id)}
                            style={{ 
                                background: 'transparent', 
                                border: 'none', 
                                color: 'var(--text-secondary)', 
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                padding: '4px'
                            }}
                        >
                            <X size={16} />
                        </button>
                    </div>
                ))}
            </div>
            <style>{`
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                .notification-toast {
                    transition: all 0.3s ease;
                }
                .toast-success { border-left: 4px solid #4ade80; }
                .toast-error { border-left: 4px solid #f87171; }
                .toast-warning { border-left: 4px solid #fbbf24; }
                .toast-info { border-left: 4px solid #60a5fa; }
            `}</style>
        </NotificationContext.Provider>
    );
}

export function useNotification() {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotification must be used within a NotificationProvider');
    }
    return context;
}
