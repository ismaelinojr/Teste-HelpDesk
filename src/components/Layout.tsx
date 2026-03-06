import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import {
    LayoutDashboard,
    Ticket,
    Settings,
    Menu,
    X,
    Plus,
    BarChart3,
    LogOut,
} from 'lucide-react';

const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/novo', label: 'Novo Chamado', icon: Plus },
    { to: '/admin', label: 'Administração', icon: Settings },
    { to: '/relatorios', label: 'Relatórios', icon: BarChart3 },
];

function getPageTitle(pathname: string): string {
    if (pathname === '/') return 'Dashboard';
    if (pathname === '/novo') return 'Novo Chamado';
    if (pathname === '/admin') return 'Administração';
    if (pathname === '/relatorios') return 'Relatórios';
    if (pathname.startsWith('/chamado/')) return 'Detalhe do Chamado';
    return 'I9Chamados';
}

export default function Layout() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { currentUser, logout } = useApp();
    const location = useLocation();

    if (!currentUser) return null;

    return (
        <div className="app-layout">
            {/* Overlay mobile */}
            <div
                className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`}
                onClick={() => setSidebarOpen(false)}
            />

            {/* Sidebar */}
            <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <div className="sidebar-logo">
                        <Ticket size={18} />
                    </div>
                    <div>
                        <div className="sidebar-title">I9Chamados</div>
                        <div className="sidebar-subtitle">Gestão de Chamados</div>
                    </div>
                    <button
                        className="btn-ghost"
                        onClick={() => setSidebarOpen(false)}
                        style={{ marginLeft: 'auto', display: sidebarOpen ? 'block' : 'none' }}
                    >
                        <X size={20} />
                    </button>
                </div>

                <nav className="sidebar-nav">
                    <div className="nav-section-label">Menu</div>
                    {navItems.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.to === '/'}
                            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                            onClick={() => setSidebarOpen(false)}
                        >
                            <item.icon size={20} />
                            <span>{item.label}</span>
                        </NavLink>
                    ))}
                </nav>

                <div className="sidebar-footer">
                    <div className="user-profile-footer">
                        <div className="user-profile-left">
                            <div className="user-avatar-footer">
                                {currentUser.nome.split(' ').map(n => n[0]).join('').slice(0, 2)}
                            </div>
                            <div className="user-details-footer">
                                <span className="user-name-footer">{currentUser.nome}</span>
                                <span className={`user-role-badge ${currentUser.role}`}>
                                    {currentUser.role}
                                </span>
                                <div className="user-email-footer">{currentUser.email}</div>
                            </div>
                        </div>
                        <button
                            className="btn-logout-footer"
                            onClick={logout}
                            title="Sair do sistema"
                        >
                            <LogOut size={18} />
                        </button>
                    </div>
                </div>
            </aside>

            {/* Header */}
            <header className="header">
                <div className="header-left">
                    <button
                        className="menu-toggle"
                        onClick={() => setSidebarOpen(true)}
                    >
                        <Menu size={24} />
                    </button>
                    <h1 className="page-title">{getPageTitle(location.pathname)}</h1>
                </div>

            </header>

            {/* Content */}
            <main className="main-content">
                <Outlet />
            </main>

            <style>{`
                .user-profile-footer {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 12px;
                }
                .user-profile-left {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    min-width: 0;
                }
                .user-avatar-footer {
                    width: 36px;
                    height: 36px;
                    border-radius: 50%;
                    background: var(--stakent-gradient);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 700;
                    font-size: 13px;
                    color: white;
                    flex-shrink: 0;
                    box-shadow: 0 0 10px rgba(142, 124, 255, 0.2);
                }
                .user-details-footer {
                    display: flex;
                    flex-direction: column;
                    gap: 2px;
                    min-width: 0;
                }
                .user-name-footer {
                    font-weight: 600;
                    font-size: 13px;
                    color: var(--text-primary);
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                .user-email-footer {
                    font-size: 11px;
                    color: var(--text-muted);
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }
                .btn-logout-footer {
                    background: none;
                    border: none;
                    color: var(--text-muted);
                    cursor: pointer;
                    padding: 8px;
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s;
                    flex-shrink: 0;
                }
                .btn-logout-footer:hover {
                    color: #f38ba8;
                    background: rgba(243, 139, 168, 0.1);
                }
            `}</style>
        </div>
    );
}
