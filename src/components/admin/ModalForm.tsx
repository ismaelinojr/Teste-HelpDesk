import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalFormProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}

export default function ModalForm({ isOpen, onClose, title, children }: ModalFormProps) {
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        if (isOpen) {
            document.body.style.overflow = 'hidden';
            window.addEventListener('keydown', handleEscape);
        }

        return () => {
            document.body.style.overflow = 'unset';
            window.removeEventListener('keydown', handleEscape);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose} style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(4px)'
        }}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{
                backgroundColor: 'var(--bg-card)', borderRadius: 12, width: '100%',
                maxWidth: 500, maxHeight: '90vh', overflowY: 'auto',
                boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
            }}>
                <div className="modal-header" style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '20px 24px', borderBottom: '1px solid var(--border)'
                }}>
                    <h2 style={{ margin: 0, fontSize: 18, color: 'var(--text-primary)' }}>{title}</h2>
                    <button className="btn-icon" onClick={onClose} style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: 'var(--text-secondary)'
                    }}>
                        <X size={20} />
                    </button>
                </div>
                <div className="modal-body" style={{ padding: 24 }}>
                    {children}
                </div>
            </div>
        </div>
    );
}
