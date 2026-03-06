import { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Printer } from 'lucide-react';
import { format, startOfMonth, endOfMonth, parseISO } from 'date-fns';

export default function GeradorPDFCliente() {
    const { clientes, chamados, categoriasChamado } = useApp();
    const [clienteId, setClienteId] = useState('');

    // Inicia com o primeiro e último dia do Mês Atual
    const [dataInicio, setDataInicio] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
    const [dataFim, setDataFim] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));

    // Filtra chamados com base nos critérios selecionados
    const relatorioData = useMemo(() => {
        if (!clienteId || !dataInicio || !dataFim) return null;

        let clienteRef;
        if (clienteId === 'todos') {
            clienteRef = { id: 'todos', nome: 'Todos os Laboratórios Consolidados', contato: '' };
        } else {
            clienteRef = clientes.find(c => c.id === clienteId);
        }

        if (!clienteRef) return null;

        // Converter datas dos filtros para comparação segura
        const inicioTS = new Date(`${dataInicio}T00:00:00`).getTime();
        const fimTS = new Date(`${dataFim}T23:59:59`).getTime();

        const chamadosFiltrados = chamados.filter(c => {
            const dataAbert = new Date(c.dataAbertura).getTime();

            // Regra Cliente
            const passaCliente = clienteId === 'todos' || c.clienteId === clienteRef.id;
            // Regra Data
            const passaData = dataAbert >= inicioTS && dataAbert <= fimTS;

            return passaCliente && passaData;
        });

        const total = chamadosFiltrados.length;
        const resolvidos = chamadosFiltrados.filter(c => c.status === 'fechado').length;

        // Cálculo de SLA apenas dos fechados
        const violados = chamadosFiltrados.filter(c => {
            if (c.status === 'fechado' && c.dataFechamento) {
                const abertura = new Date(c.dataAbertura).getTime();
                const fechamento = new Date(c.dataFechamento).getTime();
                const diffHoras = (fechamento - abertura) / (1000 * 60 * 60);
                return diffHoras > c.slaHoras;
            }
            return false;
        }).length;

        const slaSuccessRate = resolvidos > 0
            ? Math.round(((resolvidos - violados) / resolvidos) * 100)
            : 100;

        // Agrupa por categoria
        const byCategoria = categoriasChamado.map(cat => ({
            nome: cat.nome,
            count: chamadosFiltrados.filter(ch => ch.categoriaId === cat.id).length
        })).filter(c => c.count > 0);

        return {
            cliente: clienteRef,
            periodoRef: `${format(parseISO(dataInicio), 'dd/MM/yyyy')} a ${format(parseISO(dataFim), 'dd/MM/yyyy')}`,
            chamados: chamadosFiltrados,
            total,
            resolvidos,
            slaSuccessRate,
            byCategoria
        };
    }, [clienteId, dataInicio, dataFim, chamados, clientes, categoriasChamado]);

    return (
        <div className="gerador-pdf">
            {/* Control Panel (Não impresso) */}
            <div className="admin-card hide-on-print" style={{ marginBottom: 24 }}>
                <h3 style={{ marginTop: 0 }}>Gerar Relatório Analítico (PDF)</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Selecione o Cliente e o período para gerar o relatório consolidado de atendimentos. Clique em "Imprimir/Salvar PDF" para usar o recurso nativo de impressão do navegador (formato A4).</p>

                <div style={{ display: 'flex', gap: 16, marginTop: 24, alignItems: 'center', flexWrap: 'wrap' }}>
                    <div className="form-group" style={{ flex: 2, margin: 0, minWidth: 250 }}>
                        <label>Laboratório (Cliente)</label>
                        <select
                            value={clienteId}
                            onChange={e => setClienteId(e.target.value)}
                            style={{ width: '100%', padding: '10px', borderRadius: 6, border: '1px solid var(--border)' }}
                        >
                            <option value="">Selecione um cliente...</option>
                            <option value="todos" style={{ fontWeight: 'bold' }}>Todos os Laboratórios</option>
                            {clientes.map(c => (
                                <option key={c.id} value={c.id}>{c.nome}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group" style={{ flex: 1, margin: 0, minWidth: 140 }}>
                        <label>Data Inicial</label>
                        <input
                            type="date"
                            value={dataInicio}
                            onChange={e => setDataInicio(e.target.value)}
                            style={{ width: '100%', padding: '10px', borderRadius: 6, border: '1px solid var(--border)' }}
                        />
                    </div>

                    <div className="form-group" style={{ flex: 1, margin: 0, minWidth: 140 }}>
                        <label>Data Final</label>
                        <input
                            type="date"
                            value={dataFim}
                            onChange={e => setDataFim(e.target.value)}
                            style={{ width: '100%', padding: '10px', borderRadius: 6, border: '1px solid var(--border)' }}
                        />
                    </div>

                    <button
                        className="btn btn-primary"
                        disabled={!relatorioData}
                        onClick={() => window.print()}
                        style={{ marginTop: 22, height: 42, whiteSpace: 'nowrap' }}
                    >
                        <Printer size={18} style={{ marginRight: 8 }} />
                        Imprimir / Salvar PDF
                    </button>
                </div>
            </div>

            {/* Print View (.print-only styles applied in index.css) */}
            {relatorioData && (
                <div className="pdf-container print-area" style={{ padding: '0', backgroundColor: '#fff', color: '#1a1d27', fontFamily: "'Inter', sans-serif" }}>

                    {/* Header Premium */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        borderBottom: '4px solid #6366f1',
                        paddingBottom: 24,
                        marginBottom: 32
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                            <div style={{
                                width: 48,
                                height: 48,
                                background: 'linear-gradient(135deg, #6366f1, #a78bfa)',
                                borderRadius: 12,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                fontWeight: 'bold',
                                fontSize: 22
                            }}>
                                I9
                            </div>
                            <div>
                                <h1 style={{ margin: 0, fontSize: 26, color: '#111827', fontWeight: 800, letterSpacing: '-0.5px' }}>Relatório de Serviço</h1>
                                <p style={{ margin: '4px 0 0 0', color: '#6b7280', fontSize: 13, textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>I9Chamados</p>
                            </div>
                        </div>
                        <div style={{ textAlign: 'right', background: '#f3f4f6', padding: '12px 20px', borderRadius: 8 }}>
                            <h2 style={{ margin: 0, fontSize: 16, color: '#1f2937', fontWeight: 700 }}>{relatorioData.cliente.nome}</h2>
                            <p style={{ margin: '4px 0 0 0', color: '#4b5563', fontSize: 13 }}>Ref: <strong>{relatorioData.periodoRef}</strong></p>
                            <p style={{ margin: '4px 0 0 0', color: '#9ca3af', fontSize: 11 }}>Emissão: {format(new Date(), 'dd/MM/yyyy HH:mm')}</p>
                        </div>
                    </div>

                    {/* Executive Summary Cards */}
                    <div style={{ display: 'flex', gap: 16, marginBottom: 36 }}>
                        <div style={{ flex: 1, padding: 24, background: '#ffffff', borderRadius: 12, border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                            <div style={{ fontSize: 12, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700, marginBottom: 8 }}>Chamados Solicitados</div>
                            <div style={{ fontSize: 36, fontWeight: 900, color: '#111827', lineHeight: 1 }}>{relatorioData.total}</div>
                            <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 8 }}>Tickets abertos no período</div>
                        </div>
                        <div style={{ flex: 1, padding: 24, background: '#ffffff', borderRadius: 12, border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                            <div style={{ fontSize: 12, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700, marginBottom: 8 }}>Chamados Resolvidos</div>
                            <div style={{ fontSize: 36, fontWeight: 900, color: '#111827', lineHeight: 1 }}>{relatorioData.resolvidos}</div>
                            <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 8 }}>Soluções aplicadas</div>
                        </div>
                        <div style={{ flex: 1, padding: 24, background: '#f0fdf4', borderRadius: 12, border: '1px solid #bbf7d0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                            <div style={{ fontSize: 12, color: '#166534', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700, marginBottom: 8 }}>Sucesso SLA</div>
                            <div style={{ fontSize: 36, fontWeight: 900, color: '#15803d', lineHeight: 1 }}>{relatorioData.slaSuccessRate}%</div>
                            <div style={{ fontSize: 12, color: '#166534', marginTop: 8, opacity: 0.8 }}>Entregas dentro do prazo</div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: 32, marginBottom: 40, alignItems: 'flex-start' }}>
                        {/* Categorias Bar Chart Style */}
                        <div style={{ flex: 1 }}>
                            <h3 style={{ fontSize: 16, color: '#111827', margin: '0 0 16px 0', paddingBottom: 8, borderBottom: '1px solid #e5e7eb' }}>Distribuição por Categoria</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                {relatorioData.byCategoria.map((cat, i) => {
                                    const percentage = relatorioData.total > 0 ? (cat.count / relatorioData.total) * 100 : 0;
                                    return (
                                        <div key={i}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                                                <span style={{ color: '#4b5563', fontWeight: 500 }}>{cat.nome}</span>
                                                <span style={{ fontWeight: 700, color: '#111827' }}>{cat.count} <span style={{ color: '#9ca3af', fontWeight: 400, fontSize: 11 }}>({percentage.toFixed(0)}%)</span></span>
                                            </div>
                                            <div style={{ width: '100%', height: 8, background: '#f3f4f6', borderRadius: 4, overflow: 'hidden' }}>
                                                <div style={{ width: `${percentage}%`, height: '100%', background: '#6366f1', borderRadius: 4 }}></div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

                        {/* Additional Info Box (Optional/Placeholder) */}
                        <div style={{ width: '35%', background: '#f8fafc', padding: 20, borderRadius: 12, border: '1px solid #e2e8f0' }}>
                            <h4 style={{ margin: '0 0 12px 0', color: '#334155', fontSize: 14 }}>Resumo Operacional</h4>
                            <p style={{ margin: 0, fontSize: 13, color: '#64748b', lineHeight: 1.6 }}>
                                Este relatório documenta todas as intervenções técnicas concluídas ou solicitadas pela sua empresa no período de apuração, incluindo manutenções.
                            </p>
                        </div>
                    </div>

                    {/* Detailed Table */}
                    <div>
                        <h3 style={{ fontSize: 16, color: '#111827', margin: '0 0 16px 0', paddingBottom: 8, borderBottom: '1px solid #e5e7eb' }}>Log de Ocorrências e Entregas</h3>

                        {relatorioData.chamados.length === 0 ? (
                            <div style={{ padding: 32, textAlign: 'center', background: '#f9fafb', borderRadius: 8, color: '#6b7280' }}>
                                Nenhuma ocorrência validada neste período.
                            </div>
                        ) : (
                            <div style={{ borderRadius: 8, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, textAlign: 'left' }}>
                                    <thead>
                                        <tr style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                                            <th style={{ padding: '12px 16px', color: '#4b5563', fontWeight: 600, textTransform: 'uppercase', fontSize: 11, letterSpacing: '0.5px' }}>Abertura</th>
                                            {clienteId === 'todos' && (
                                                <th style={{ padding: '12px 16px', color: '#4b5563', fontWeight: 600, textTransform: 'uppercase', fontSize: 11, letterSpacing: '0.5px' }}>Laboratório</th>
                                            )}
                                            <th style={{ padding: '12px 16px', color: '#4b5563', fontWeight: 600, textTransform: 'uppercase', fontSize: 11, letterSpacing: '0.5px' }}>Título / Solicitante</th>
                                            <th style={{ padding: '12px 16px', color: '#4b5563', fontWeight: 600, textTransform: 'uppercase', fontSize: 11, letterSpacing: '0.5px' }}>Status</th>
                                            <th style={{ padding: '12px 16px', color: '#4b5563', fontWeight: 600, textTransform: 'uppercase', fontSize: 11, letterSpacing: '0.5px' }}>Acordo SLA</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {relatorioData.chamados.map((c, index) => {
                                            const abertura = new Date(c.dataAbertura);
                                            const entrega = c.dataFechamento ? new Date(c.dataFechamento) : null;

                                            let diffHorasLabel = '-';
                                            if (entrega) {
                                                const diff = (entrega.getTime() - abertura.getTime()) / (1000 * 60 * 60);
                                                diffHorasLabel = `${diff.toFixed(1)}h`;
                                            }

                                            const catNome = categoriasChamado.find(cat => cat.id === c.categoriaId)?.nome || '';
                                            const cliNome = clientes.find(cli => cli.id === c.clienteId)?.nome || '';
                                            const isEven = index % 2 === 0;

                                            return (
                                                <tr key={c.id} style={{ background: isEven ? '#ffffff' : '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                                                    <td style={{ padding: '14px 16px', color: '#64748b', verticalAlign: 'top' }}>
                                                        {format(new Date(c.dataAbertura), 'dd/MM/yyyy')}
                                                        <div style={{ fontSize: 11, marginTop: 2 }}>{format(new Date(c.dataAbertura), 'HH:mm')}</div>
                                                    </td>
                                                    {clienteId === 'todos' && (
                                                        <td style={{ padding: '14px 16px', fontWeight: 600, color: '#334155', verticalAlign: 'top' }}>
                                                            {cliNome}
                                                        </td>
                                                    )}
                                                    <td style={{ padding: '14px 16px', verticalAlign: 'top' }}>
                                                        <div style={{ fontWeight: 600, color: '#1e293b', marginBottom: 4 }}>{c.titulo}</div>
                                                        <div style={{ color: '#64748b', fontSize: 11, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                                            <span>Req: <strong>{c.contatoNome || 'N/D'}</strong></span>
                                                            <span style={{ color: '#cbd5e1' }}>|</span>
                                                            <span>Cat: {catNome}</span>
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '14px 16px', verticalAlign: 'top' }}>
                                                        <span style={{
                                                            display: 'inline-block',
                                                            padding: '4px 10px',
                                                            borderRadius: 50,
                                                            fontSize: 11,
                                                            fontWeight: 600,
                                                            background: c.status === 'fechado' ? '#dcfce7' : '#fef3c7',
                                                            color: c.status === 'fechado' ? '#166534' : '#92400e',
                                                            textTransform: 'capitalize'
                                                        }}>
                                                            {c.status.replace('_', ' ')}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '14px 16px', verticalAlign: 'top' }}>
                                                        <div style={{ display: 'flex', alignItems: 'flex-start', flexDirection: 'column', gap: 4 }}>
                                                            <div>
                                                                <div style={{ color: '#1e293b', fontWeight: 500 }}>Prazo: {c.slaHoras}h</div>
                                                                <div style={{ fontSize: 11, color: '#64748b', marginTop: 2, textTransform: 'capitalize' }}>{c.prioridade}</div>
                                                            </div>
                                                            {c.status === 'fechado' && (
                                                                <div style={{
                                                                    padding: '4px 8px',
                                                                    background: '#f1f5f9',
                                                                    borderRadius: 6,
                                                                    fontWeight: 700,
                                                                    color: '#334155',
                                                                    fontSize: 11
                                                                }}>
                                                                    Entregue em {diffHorasLabel}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    <div style={{ marginTop: 40, paddingTop: 24, borderTop: '2px dashed #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, color: '#94a3b8' }}>
                        <div>Documento emitido automaticamente por <strong>I9Chamados</strong>. Uso confidencial.</div>
                        <div>Página 1 de 1</div>
                    </div>
                </div>
            )}
        </div>
    );
}
