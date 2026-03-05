import { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { calcularSLA, formatarTempo, formatarDataCurta } from '../utils/sla';
import {
    AlertCircle,
    Clock,
    AlertTriangle,
    Hourglass,
    Plus,
    ChevronDown,
    Check,
} from 'lucide-react';
import type { StatusChamado } from '../types';

const allStatuses: StatusChamado[] = ['aberto', 'em_atendimento', 'aguardando_cliente', 'fechado'];
const defaultStatuses: StatusChamado[] = ['aberto', 'em_atendimento', 'aguardando_cliente'];

const statusLabels: Record<StatusChamado, string> = {
    aberto: 'Aberto',
    em_atendimento: 'Em Atendimento',
    aguardando_cliente: 'Aguardando Cliente',
    fechado: 'Fechado',
};

export default function Dashboard() {
    const {
        chamados,
        currentUser,
        loading,
        assumirChamado,
        getClienteNome,
        getTecnicoNome,
        getChamadosFiltrados,
        usuarios,
    } = useApp();

    const navigate = useNavigate();

    const [filterStatus, setFilterStatus] = useState<Set<StatusChamado>>(() => new Set(defaultStatuses));
    const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
    const statusDropdownRef = useRef<HTMLDivElement>(null);
    const [filterPrioridade, setFilterPrioridade] = useState<string>('todos');
    const [filterTecnico, setFilterTecnico] = useState<string>('todos');

    // Close dropdown on outside click
    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (statusDropdownRef.current && !statusDropdownRef.current.contains(e.target as Node)) {
                setStatusDropdownOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleStatus = (status: StatusChamado) => {
        setFilterStatus(prev => {
            const next = new Set(prev);
            if (next.has(status)) {
                next.delete(status);
            } else {
                next.add(status);
            }
            return next;
        });
    };

    const statusButtonLabel = filterStatus.size === allStatuses.length
        ? 'Todos os Status'
        : filterStatus.size === 0
            ? 'Nenhum Status'
            : `${filterStatus.size} status selecionado${filterStatus.size > 1 ? 's' : ''}`;

    const baseChamados = getChamadosFiltrados();
    const chamadosAbertos = chamados.filter(c => c.status === 'aberto');
    const chamadosEmAtendimento = chamados.filter(c => c.status === 'em_atendimento');
    const chamadosAguardando = chamados.filter(c => c.status === 'aguardando_cliente');
    const chamadosSLAVencido = chamados
        .filter(c => c.status !== 'fechado')
        .filter(c => calcularSLA(c).status === 'vencido');

    const filtered = useMemo(() => {
        return baseChamados.filter(c => {
            if (!filterStatus.has(c.status)) return false;
            if (filterPrioridade !== 'todos' && c.prioridade !== filterPrioridade) return false;
            if (filterTecnico !== 'todos' && c.tecnicoId !== filterTecnico) return false;
            return true;
        });
    }, [baseChamados, filterStatus, filterPrioridade, filterTecnico]);

    const handleAssumir = async (e: React.MouseEvent, chamadoId: string) => {
        e.stopPropagation();
        await assumirChamado(chamadoId);
    };

    if (loading) {
        return <div className="loader"><div className="loader-spinner" /></div>;
    }

    return (
        <div>
            {/* Stats */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon blue"><AlertCircle size={24} /></div>
                    <div className="stat-info">
                        <h3>{chamadosAbertos.length}</h3>
                        <p>Chamados Abertos</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon orange"><Clock size={24} /></div>
                    <div className="stat-info">
                        <h3>{chamadosEmAtendimento.length}</h3>
                        <p>Em Atendimento</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon red"><AlertTriangle size={24} /></div>
                    <div className="stat-info">
                        <h3>{chamadosSLAVencido.length}</h3>
                        <p>SLA Vencido</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon purple"><Hourglass size={24} /></div>
                    <div className="stat-info">
                        <h3>{chamadosAguardando.length}</h3>
                        <p>Aguardando Cliente</p>
                    </div>
                </div>
            </div>

            {/* Filtros */}
            <div className="filters-bar">
                <div className="status-filter-dropdown" ref={statusDropdownRef}>
                    <button
                        className="status-filter-btn"
                        onClick={() => setStatusDropdownOpen(prev => !prev)}
                        type="button"
                    >
                        {statusButtonLabel}
                        <ChevronDown size={16} className={`chevron-icon ${statusDropdownOpen ? 'open' : ''}`} />
                    </button>
                    {statusDropdownOpen && (
                        <div className="status-filter-menu">
                            {allStatuses.map(s => (
                                <label key={s} className="status-filter-item">
                                    <span className={`custom-checkbox ${filterStatus.has(s) ? 'checked' : ''}`}>
                                        {filterStatus.has(s) && <Check size={12} />}
                                    </span>
                                    <input
                                        type="checkbox"
                                        checked={filterStatus.has(s)}
                                        onChange={() => toggleStatus(s)}
                                        className="sr-only"
                                    />
                                    <span className={`badge badge-${s}`}>{statusLabels[s]}</span>
                                </label>
                            ))}
                        </div>
                    )}
                </div>

                <select
                    className="filter-select"
                    value={filterPrioridade}
                    onChange={e => setFilterPrioridade(e.target.value)}
                >
                    <option value="todos">Todas as Prioridades</option>
                    <option value="normal">Normal</option>
                    <option value="urgente">Urgente</option>
                </select>

                {currentUser.role === 'admin' && (
                    <select
                        className="filter-select"
                        value={filterTecnico}
                        onChange={e => setFilterTecnico(e.target.value)}
                    >
                        <option value="todos">Todos os Técnicos</option>
                        <option value="">Não atribuído</option>
                        {usuarios.filter(u => u.role === 'tecnico').map(u => (
                            <option key={u.id} value={u.id}>{u.nome}</option>
                        ))}
                    </select>
                )}

                <button className="btn btn-primary btn-sm" onClick={() => navigate('/novo')}>
                    <Plus size={16} /> Novo Chamado
                </button>
            </div>

            {/* Tabela Desktop */}
            <div className="table-container">
                <div className="table-responsive">
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Título</th>
                                <th>Cliente</th>
                                <th>Status</th>
                                <th>Prioridade</th>
                                <th>Técnico</th>
                                <th>SLA</th>
                                <th>Abertura</th>
                                <th>Ação</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(chamado => {
                                const sla = chamado.status !== 'fechado' ? calcularSLA(chamado) : null;
                                return (
                                    <tr key={chamado.id} onClick={() => navigate(`/chamado/${chamado.id}`)}>
                                        <td className="td-id">{chamado.id.toUpperCase()}</td>
                                        <td className="td-titulo">{chamado.titulo}</td>
                                        <td className="td-cliente">{getClienteNome(chamado.clienteId)}</td>
                                        <td>
                                            <span className={`badge badge-${chamado.status}`}>
                                                {statusLabels[chamado.status]}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`badge badge-${chamado.prioridade}`}>
                                                {chamado.prioridade === 'urgente' ? '🔥 Urgente' : 'Normal'}
                                            </span>
                                        </td>
                                        <td>{getTecnicoNome(chamado.tecnicoId)}</td>
                                        <td>
                                            {sla ? (
                                                <div className="sla-indicator">
                                                    <div className="sla-bar">
                                                        <div
                                                            className={`sla-bar-fill ${sla.status}`}
                                                            style={{ width: `${Math.min(sla.percentual, 100)}%` }}
                                                        />
                                                    </div>
                                                    <span className={`sla-text ${sla.status}`}>
                                                        {formatarTempo(sla.tempoRestanteMs)}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="sla-text ok">Concluído</span>
                                            )}
                                        </td>
                                        <td>{formatarDataCurta(chamado.dataAbertura)}</td>
                                        <td onClick={e => e.stopPropagation()}>
                                            {chamado.status === 'aberto' && !chamado.tecnicoId && (
                                                <button
                                                    className="btn-assumir"
                                                    onClick={(e) => handleAssumir(e, chamado.id)}
                                                >
                                                    Assumir
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Cards Mobile */}
            <div className="mobile-cards">
                {filtered.map(chamado => {
                    const sla = chamado.status !== 'fechado' ? calcularSLA(chamado) : null;
                    return (
                        <div
                            key={chamado.id}
                            className="mobile-card"
                            onClick={() => navigate(`/chamado/${chamado.id}`)}
                        >
                            <div className="mobile-card-header">
                                <span className="mobile-card-title">{chamado.titulo}</span>
                                <span className={`badge badge-${chamado.prioridade}`}>
                                    {chamado.prioridade === 'urgente' ? '🔥' : 'N'}
                                </span>
                            </div>
                            <div className="mobile-card-row">
                                <span>{getClienteNome(chamado.clienteId)}</span>
                                <span className={`badge badge-${chamado.status}`}>
                                    {statusLabels[chamado.status]}
                                </span>
                            </div>
                            <div className="mobile-card-row">
                                <span>Técnico: {getTecnicoNome(chamado.tecnicoId)}</span>
                                <span>{formatarDataCurta(chamado.dataAbertura)}</span>
                            </div>
                            {sla && (
                                <div style={{ marginTop: 8 }}>
                                    <div className="sla-indicator">
                                        <div className="sla-bar">
                                            <div
                                                className={`sla-bar-fill ${sla.status}`}
                                                style={{ width: `${Math.min(sla.percentual, 100)}%` }}
                                            />
                                        </div>
                                        <span className={`sla-text ${sla.status}`}>
                                            {formatarTempo(sla.tempoRestanteMs)}
                                        </span>
                                    </div>
                                </div>
                            )}
                            {chamado.status === 'aberto' && !chamado.tecnicoId && (
                                <div className="mobile-card-actions">
                                    <button
                                        className="btn btn-primary btn-sm"
                                        onClick={(e) => handleAssumir(e, chamado.id)}
                                        style={{ flex: 1 }}
                                    >
                                        Assumir Chamado
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })}

                {filtered.length === 0 && (
                    <div className="empty-state">
                        <AlertCircle size={48} />
                        <h3>Nenhum chamado encontrado</h3>
                        <p>Tente alterar os filtros ou crie um novo chamado.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
