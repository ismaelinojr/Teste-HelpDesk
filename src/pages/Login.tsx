import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { LogIn, Mail, Lock, AlertCircle, Loader2 } from 'lucide-react';

const LoginPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const { login } = useApp();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoggingIn(true);

        try {
            // Pequeno delay para simular rede
            await new Promise(resolve => setTimeout(resolve, 800));
            const success = await login(email, password);
            if (success) {
                navigate('/');
            } else {
                setError('Credenciais inválidas. Tente ismael@helpdesk.com');
            }
        } catch (err) {
            setError('Ocorreu um erro ao tentar entrar.');
        } finally {
            setIsLoggingIn(false);
        }
    };

    return (
        <div className="login-container">
            <style>{`
                .login-container {
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: radial-gradient(circle at top left, #1e1e2e 0%, #11111b 100%);
                    font-family: 'Inter', sans-serif;
                    padding: 20px;
                }

                .login-card {
                    width: 100%;
                    max-width: 400px;
                    background: rgba(255, 255, 255, 0.03);
                    backdrop-filter: blur(12px);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 24px;
                    padding: 40px;
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
                    animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1);
                }

                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                .login-header {
                    text-align: center;
                    margin-bottom: 32px;
                }

                .logo-wrapper {
                    width: 64px;
                    height: 64px;
                    background: linear-gradient(135deg, #89b4fa 0%, #cba6f7 100%);
                    border-radius: 16px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 16px;
                    box-shadow: 0 8px 16px rgba(137, 180, 250, 0.2);
                }

                .login-header h1 {
                    color: #cdd6f4;
                    font-size: 24px;
                    font-weight: 700;
                    margin-bottom: 8px;
                }

                .login-header p {
                    color: #a6adc8;
                    font-size: 14px;
                }

                .form-group {
                    margin-bottom: 20px;
                }

                .input-label {
                    display: block;
                    color: #bac2de;
                    font-size: 13px;
                    font-weight: 500;
                    margin-bottom: 8px;
                    margin-left: 4px;
                }

                .input-wrapper {
                    position: relative;
                    display: flex;
                    align-items: center;
                }

                .input-wrapper .input-icon {
                    position: absolute;
                    left: 16px;
                    color: #89b4fa;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    pointer-events: none;
                    z-index: 10;
                }

                input.login-input {
                    width: 100%;
                    background: rgba(255, 255, 255, 0.07) !important;
                    border: 1px solid rgba(255, 255, 255, 0.1) !important;
                    border-radius: 12px;
                    padding: 14px 16px 14px 48px !important;
                    color: #cdd6f4 !important;
                    font-size: 15px;
                    transition: all 0.2s;
                    height: 52px;
                }

                input.login-input:focus {
                    outline: none;
                    border-color: #89b4fa !important;
                    background: rgba(255, 255, 255, 0.12) !important;
                    box-shadow: 0 0 0 4px rgba(137, 180, 250, 0.1);
                }

                .error-message {
                    background: rgba(243, 139, 168, 0.1);
                    border: 1px solid rgba(243, 139, 168, 0.2);
                    border-radius: 12px;
                    padding: 12px;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    color: #f38ba8;
                    font-size: 13px;
                    margin-bottom: 20px;
                    animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both;
                }

                @keyframes shake {
                    10%, 90% { transform: translate3d(-1px, 0, 0); }
                    20%, 80% { transform: translate3d(2px, 0, 0); }
                    30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
                    40%, 60% { transform: translate3d(4px, 0, 0); }
                }

                .submit-button {
                    width: 100%;
                    background: linear-gradient(135deg, #89b4fa 0%, #cba6f7 100%);
                    border: none;
                    border-radius: 12px;
                    padding: 14px;
                    color: #1e1e2e;
                    font-size: 15px;
                    font-weight: 600;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    transition: all 0.2s;
                    margin-top: 10px;
                }

                .submit-button:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 20px rgba(137, 180, 250, 0.3);
                }

                .submit-button:active {
                    transform: translateY(0);
                }

                .submit-button:disabled {
                    opacity: 0.7;
                    cursor: not-allowed;
                    transform: none;
                }

                .footer-text {
                    text-align: center;
                    margin-top: 24px;
                    color: #6c7086;
                    font-size: 12px;
                }

                .animate-spin {
                    animation: spin 1s linear infinite;
                }

                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>

            <div className="login-card">
                <div className="login-header">
                    <div className="logo-wrapper">
                        <LogIn size={32} color="#1e1e2e" />
                    </div>
                    <h1>Help Desk TI</h1>
                    <p>Acesse sua conta para gerenciar chamados</p>
                </div>

                {error && (
                    <div className="error-message">
                        <AlertCircle size={18} />
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="input-label">E-mail</label>
                        <div className="input-wrapper">
                            <Mail size={18} className="input-icon" />
                            <input
                                type="email"
                                className="login-input"
                                placeholder="seu@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                disabled={isLoggingIn}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="input-label">Senha</label>
                        <div className="input-wrapper">
                            <Lock size={18} className="input-icon" />
                            <input
                                type="password"
                                className="login-input"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                disabled={isLoggingIn}
                            />
                        </div>
                    </div>

                    <button type="submit" className="submit-button" disabled={isLoggingIn}>
                        {isLoggingIn ? (
                            <>
                                <Loader2 size={18} className="animate-spin" />
                                Entrando...
                            </>
                        ) : (
                            <>
                                Entrar no Sistema
                                <LogIn size={18} />
                            </>
                        )}
                    </button>
                </form>

                <div className="footer-text">
                    &copy; 2026 Help Desk TI - Versão MVP
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
