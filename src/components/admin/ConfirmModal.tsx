import { useEffect, useState } from 'react';
import { AlertTriangle, AlertCircle, Info, CheckCircle, Loader2 } from 'lucide-react';

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm?: () => Promise<void> | void;
    title: string;
    message: string;
    type?: 'confirm' | 'danger' | 'info' | 'success' | 'warning';
    confirmLabel?: string;
    cancelLabel?: string;
    showCancel?: boolean;
}

export default function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    type = 'confirm',
    confirmLabel = 'Confirmar',
    cancelLabel = 'Cancelar',
    showCancel = true
}: ConfirmModalProps) {
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && !loading) onClose();
        };

        if (isOpen) {
            document.body.style.overflow = 'hidden';
            window.addEventListener('keydown', handleEscape);
        }

        return () => {
            document.body.style.overflow = 'unset';
            window.removeEventListener('keydown', handleEscape);
        };
    }, [isOpen, onClose, loading]);

    if (!isOpen) return null;

    const handleConfirm = async () => {
        if (!onConfirm) {
            onClose();
            return;
        }

        setLoading(true);
        try {
            await onConfirm();
            onClose();
        } catch (error) {
            console.error('Erro na ação do modal:', error);
        } finally {
            setLoading(false);
        }
    };

    const getIcon = () => {
        switch (type) {
            case 'danger': return <AlertCircle size={24} color="#f87171" />;
            case 'warning': return <AlertTriangle size={24} color="#fbbf24" />;
            case 'success': return <CheckCircle size={24} color="#4ade80" />;
            case 'info': return <Info size={24} color="#60a5fa" />;
            default: return <Info size={24} color="var(--accent)" />;
        }
    };

    const getConfirmBtnClass = () => {
        switch (type) {
            case 'danger': return 'btn btn-danger';
            case 'warning': return 'btn btn-warning';
            default: return 'btn btn-primary';
        }
    };

    return (
        <div className="modal-overlay" onClick={() => !loading && onClose()} style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)', zIndex: 10000,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(8px)',
            animation: 'fadeIn 0.2s ease'
        }}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{
                backgroundColor: 'rgba(23, 23, 23, 0.8)', 
                borderRadius: 16, width: '100%',
                maxWidth: 400, 
                boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(12px)',
                animation: 'scaleUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
            }}>
                <div style={{ padding: '24px 24px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                        <div style={{ 
                            width: 48, height: 48, borderRadius: 12, 
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            {getIcon()}
                        </div>
                        <h2 style={{ margin: 0, fontSize: 18, color: 'var(--text-primary)', fontWeight: 600 }}>{title}</h2>
                    </div>
                    <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: 1.6, fontSize: 15 }}>
                        {message}
                    </p>
                </div>
                
                <div style={{ 
                    padding: '16px 24px 24px', 
                    display: 'flex', justifyContent: 'flex-end', gap: 12 
                }}>
                    {showCancel && (
                        <button 
                            className="btn btn-secondary" 
                            onClick={onClose}
                            disabled={loading}
                            style={{ padding: '10px 20px', borderRadius: 10 }}
                        >
                            {cancelLabel}
                        </button>
                    )}
                    <button 
                        className={getConfirmBtnClass()} 
                        onClick={handleConfirm}
                        disabled={loading}
                        style={{ 
                            padding: '10px 24px', 
                            borderRadius: 10,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            minWidth: 100,
                            justifyContent: 'center'
                        }}
                    >
                        {loading ? <Loader2 size={18} className="animate-spin" /> : confirmLabel}
                    </button>
                </div>
            </div>
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes scaleUp {
                    from { transform: scale(0.95); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }
                .btn-warning {
                    background-color: #fbbf24;
                    color: #000;
                }
                .btn-warning:hover {
                    background-color: #f59e0b;
                }
            `}</style>
        </div>
    );
}
