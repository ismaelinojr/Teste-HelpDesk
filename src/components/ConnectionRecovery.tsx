import React from 'react';
import { RefreshCw, WifiOff, AlertTriangle } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const ConnectionRecovery: React.FC = () => {
    const { isZombie, isOnline } = useApp();

    if (!isZombie) return null;

    const handleReload = () => {
        // Força um reload limpando cache (se suportado pelo navegador)
        window.location.reload();
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-500">
            <div className="max-w-md w-full bg-[#161a23] border border-white/10 rounded-2xl shadow-2xl p-8 text-center flex flex-col items-center gap-6">
                <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center text-red-500 animate-pulse">
                    {isOnline ? (
                        <AlertTriangle size={40} />
                    ) : (
                        <WifiOff size={40} />
                    )}
                </div>

                <div className="space-y-2">
                    <h2 className="text-2xl font-bold text-white">Conexão Interrompida</h2>
                    <p className="text-gray-400 text-sm leading-relaxed">
                        Detectamos uma falha persistente na comunicação com o servidor. 
                        {isOnline 
                            ? " Sua internet parece ativa, mas o sistema parou de responder."
                            : " Verifique sua conexão com a internet para continuar."}
                    </p>
                </div>

                <div className="w-full pt-4">
                    <button
                        onClick={handleReload}
                        className="w-full py-4 px-6 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-3 shadow-lg shadow-purple-600/20"
                    >
                        <RefreshCw size={20} className={isOnline ? 'animate-spin-slow' : ''} />
                        Restabelecer sistema agora
                    </button>
                    
                    <p className="text-gray-500 text-[11px] mt-4 italic">
                        Dica: O "Hard Refresh" (Ctrl+Shift+R) limpa o cache e resolve travamentos persistentes.
                    </p>
                </div>
            </div>
            
            <style>{`
                @keyframes spin-slow {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .animate-spin-slow {
                    animation: spin-slow 3s linear infinite;
                }
            `}</style>
        </div>
    );
};
