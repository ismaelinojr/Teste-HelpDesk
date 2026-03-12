import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useNotification } from '../context/NotificationContext';
import { calcularSLA, formatarTempo, formatarData } from '../utils/sla';
import type { Interacao, StatusChamado } from '../types';
import {
    ArrowLeft,
    Send,
    X,
    CheckCircle2,
} from 'lucide-react';

export default function TicketDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const {
        chamados,
        getClienteNome,
        getTecnicoNome,
        getInteracoes,
        adicionarNota,
        atualizarStatus,
        encerrarChamado,
        assumirChamado,
        getCategoriaNome,
        getStatusLabel,
        getSLALabel,
        statusConfigs,
    } = useApp();
    const { showNotification } = useNotification();

    const [interacoes, setInteracoes] = useState<Interacao[]>([]);
    const [novaNota, setNovaNota] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [solucao, setSolucao] = useState('');
    const [loading, setLoading] = useState(true);

    const chamado = chamados.find(c => c.id === id);

    const loadInteracoes = useCallback(async () => {
        if (!id) return;
        const data = await getInteracoes(id);
        setInteracoes(data);
        setLoading(false);
    }, [id, getInteracoes]);

    useEffect(() => {
        loadInteracoes();
    }, [loadInteracoes]);

    const handleAddNota = async () => {
        if (!novaNota.trim() || !id) return;
        try {
            await adicionarNota(id, novaNota.trim());
            setNovaNota('');
            showNotification('Nota adicionada!', 'success');
            await loadInteracoes();
        } catch (error) {
            showNotification('Erro ao adicionar nota.', 'error');
        }
    };

    const handleStatusChange = async (newStatus: StatusChamado) => {
        if (!id) return;
        try {
            await atualizarStatus(id, newStatus);
            showNotification(`Status alterado para ${getStatusLabel(newStatus)}`, 'info');
            await loadInteracoes();
        } catch (error) {
            showNotification('Erro ao alterar status.', 'error');
        }
    };

    const handleEncerrar = async () => {
        if (!solucao.trim() || !id) return;
        if (!chamado?.tecnicoId) {
            showNotification('Nenhum técnico atribuído ao chamado.', 'warning');
            return;
        }
        try {
            await encerrarChamado(id, solucao.trim());
            setSolucao('');
            setShowModal(false);
            showNotification('Chamado encerrado com sucesso!', 'success');
            await loadInteracoes();
        } catch (error) {
            showNotification('Erro ao encerrar chamado.', 'error');
        }
    };

    const handleAssumir = async () => {
        if (!id) return;
        try {
            await assumirChamado(id);
            showNotification('Você assumiu este chamado.', 'success');
            await loadInteracoes();
        } catch (error) {
            showNotification('Erro ao assumir chamado.', 'error');
        }
    };

    if (!chamado) {
        return (
            <div className="empty-state">
                <h3>Chamado não encontrado</h3>
                <p>O chamado solicitado não existe.</p>
                <button className="btn btn-primary" onClick={() => navigate('/')}>
                    Voltar ao Dashboard
                </button>
            </div>
        );
    }

    const sla = chamado.status !== 'fechado' ? calcularSLA(chamado) : null;
    const slaFechado = chamado.status === 'fechado' ? calcularSLA(chamado) : null;

    return (
        <div className="ticket-detail">
            <button className="back-link" onClick={() => navigate('/')}>
                <ArrowLeft size={16} /> Voltar ao Dashboard
            </button>

            {/* Header */}
            <div className="ticket-header">
                <div className="ticket-header-left">
                    <h1>{chamado.titulo}</h1>
                    <div className="ticket-meta">
                        <span className={`badge badge-${chamado.status}`}>
                            {getStatusLabel(chamado.status)}
                        </span>
                        <span className={`badge badge-${chamado.prioridade}`}>
                            {chamado.prioridade === 'urgente' ? '🔥 ' : ''}{getSLALabel(chamado.prioridade)}
                        </span>
                        <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                            CH{String(chamado.numero).padStart(4, '0')}
                        </span>
                    </div>
                </div>
                <div className="ticket-actions">
                    {chamado.status !== 'fechado' && (
                        <>
                            {chamado.status === 'aberto' && !chamado.tecnicoId && (
                                <button className="btn btn-primary btn-sm" onClick={handleAssumir}>
                                    Assumir
                                </button>
                            )}
                            <select
                                className="status-select"
                                value={chamado.status}
                                onChange={(e) => handleStatusChange(e.target.value as StatusChamado)}
                            >
                                {statusConfigs.filter(s => s.id !== 'fechado').map(s => (
                                    <option key={s.id} value={s.id}>{s.nome}</option>
                                ))}
                            </select>
                            <button
                                className="btn btn-success btn-sm"
                                onClick={() => {
                                    if (!chamado?.tecnicoId) {
                                        alert('Não é possível encerrar o chamado: não há nenhum técnico atribuído. Por favor, assuma o chamado primeiro.');
                                        return;
                                    }
                                    setShowModal(true);
                                }}
                            >
                                <CheckCircle2 size={14} /> Encerrar
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Info cards */}
            <div className="ticket-info-grid">
                <div className="info-card">
                    <label>Cliente / Laboratório</label>
                    <span>{getClienteNome(chamado.clienteId)}</span>
                </div>
                <div className="info-card">
                    <label>Solicitante</label>
                    <span>{chamado.contatoNome || 'Não informado'}</span>
                </div>
                <div className="info-card">
                    <label>Tipo</label>
                    <span>{getCategoriaNome(chamado.categoriaId)}</span>
                </div>
                <div className="info-card">
                    <label>Técnico</label>
                    <span>{getTecnicoNome(chamado.tecnicoId)}</span>
                </div>
                <div className="info-card">
                    <label>Abertura</label>
                    <span>{formatarData(chamado.dataAbertura)}</span>
                </div>
                <div className="info-card">
                    <label>SLA ({chamado.slaHoras}h)</label>
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
                    ) : slaFechado ? (
                        <span className={`sla-text ${slaFechado.status}`}>
                            {slaFechado.status === 'vencido' ? 'Encerrado fora do SLA' : 'Encerrado dentro do SLA'}
                        </span>
                    ) : null}
                </div>
            </div>

            {/* Descrição */}
            <div className="info-card" style={{ marginBottom: 24 }}>
                <label>Descrição</label>
                <p style={{ lineHeight: 1.6 }}>{chamado.descricao}</p>
            </div>

            {chamado.solucaoFinal && (
                <div className="info-card" style={{ marginBottom: 24, borderColor: 'var(--success)', borderWidth: 1 }}>
                    <label>✅ Solução Final</label>
                    <p style={{ lineHeight: 1.6 }}>{chamado.solucaoFinal}</p>
                </div>
            )}

            {/* Timeline */}
            <div className="timeline-section">
                <div className="timeline-header">
                    <h2>Timeline ({interacoes.length})</h2>
                </div>

                {loading ? (
                    <div className="loader"><div className="loader-spinner" /></div>
                ) : interacoes.length === 0 ? (
                    <div className="empty-state">
                        <p>Nenhuma interação registrada.</p>
                    </div>
                ) : (
                    <div className="timeline">
                        {interacoes.map((inter) => (
                            <div key={inter.id} className="timeline-item">
                                <div className="timeline-dot" />
                                <div className="timeline-item-header">
                                    <span className="timeline-user">
                                        {getTecnicoNome(inter.usuarioId)}
                                    </span>
                                    <span className="timeline-date">
                                        {formatarData(inter.createdAt)}
                                    </span>
                                </div>
                                <div className="timeline-message">{inter.mensagem}</div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Formulário nova nota */}
                {chamado.status !== 'fechado' && (
                    <div className="note-form">
                        <textarea
                            placeholder="Adicionar nota ou atualização..."
                            value={novaNota}
                            onChange={(e) => setNovaNota(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && e.ctrlKey) handleAddNota();
                            }}
                        />
                        <div className="note-form-actions">
                            <button
                                className="btn btn-primary btn-sm"
                                onClick={handleAddNota}
                                disabled={!novaNota.trim()}
                            >
                                <Send size={14} /> Enviar Nota
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal Encerrar */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Encerrar Chamado</h2>
                            <button className="btn-ghost" onClick={() => setShowModal(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label>Solução aplicada *</label>
                                <textarea
                                    value={solucao}
                                    onChange={(e) => setSolucao(e.target.value)}
                                    placeholder="Descreva a solução aplicada para resolver o problema..."
                                    style={{ minHeight: 120 }}
                                />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setShowModal(false)}>
                                Cancelar
                            </button>
                            <button
                                className="btn btn-success"
                                onClick={handleEncerrar}
                                disabled={!solucao.trim()}
                            >
                                <CheckCircle2 size={16} /> Confirmar Encerramento
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
