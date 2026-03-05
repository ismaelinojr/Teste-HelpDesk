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
    if (pathname.startsWith('/chamado/')) return 'Detalhe do Chamado';
    return 'Help Desk';
}

export default function Layout() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { currentUser, usuarios, switchUser } = useApp();
    const location = useLocation();

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
                        <div className="sidebar-title">Help Desk TI</div>
                        <div className="sidebar-subtitle">Sistema de Chamados</div>
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
                    <div className="user-switch">
                        <label>Usuário Ativo</label>
                        <select
                            value={currentUser.id}
                            onChange={(e) => switchUser(e.target.value)}
                        >
                            {usuarios.map((u) => (
                                <option key={u.id} value={u.id}>
                                    {u.nome} ({u.role})
                                </option>
                            ))}
                        </select>
                        <span className={`user-role-badge ${currentUser.role}`}>
                            {currentUser.role}
                        </span>
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
                <div className="header-right">
                    <div className="header-user">
                        <span>{currentUser.nome}</span>
                        <div className="header-avatar">
                            {currentUser.nome.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                    </div>
                </div>
            </header>

            {/* Content */}
            <main className="main-content">
                <Outlet />
            </main>
        </div>
    );
}
