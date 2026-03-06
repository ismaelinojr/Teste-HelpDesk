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

        // Agrupa Top 5 Colaboradores
        const topContatosMap = new Map<string, number>();
        chamadosFiltrados.forEach(c => {
            const nomeStr = c.contatoNome || 'Não Identificado';
            const extraStr = clienteId === 'todos' ? ` (${clientes.find(cli => cli.id === c.clienteId)?.nome || 'Unknown'})` : '';
            const finalName = nomeStr + extraStr;

            topContatosMap.set(finalName, (topContatosMap.get(finalName) || 0) + 1);
        });
        const topContatos = Array.from(topContatosMap, ([nome, count]) => ({ nome, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        // Evolução Mensal (Acumulado Anual)
        const anoLog = new Date().getFullYear();
        const evolucaoDados = Array(12).fill(0);

        chamados.forEach(c => {
            if (clienteId === 'todos' || c.clienteId === clienteRef.id) {
                const d = new Date(c.dataAbertura);
                if (d.getFullYear() === anoLog) {
                    evolucaoDados[d.getMonth()] += 1;
                }
            }
        });
        const maxEvolucao = Math.max(...evolucaoDados, 1);

        return {
            cliente: clienteRef,
            periodoRef: `${format(parseISO(dataInicio), 'dd/MM/yyyy')} a ${format(parseISO(dataFim), 'dd/MM/yyyy')}`,
            chamados: chamadosFiltrados,
            total,
            resolvidos,
            slaSuccessRate,
            byCategoria,
            topContatos,
            evolucaoMensal: {
                ano: anoLog,
                dados: evolucaoDados,
                max: maxEvolucao
            }
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
                            <h3 style={{ fontSize: 16, color: '#111827', margin: '0 0 16px 0', paddingBottom: 8, borderBottom: '1px solid #e5e7eb' }}>Chamados por Categoria</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                {relatorioData.byCategoria.length > 0 ? relatorioData.byCategoria.map((cat, i) => {
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
                                }) : (
                                    <div style={{ fontSize: 13, color: '#9ca3af' }}>Nenhum chamado categorizado no período.</div>
                                )}
                            </div>
                        </div>

                        {/* Ranking Top 5 - Vertical */}
                        <div style={{ width: '40%' }}>
                            <h3 style={{ fontSize: 16, color: '#111827', margin: '0 0 16px 0', paddingBottom: 8, borderBottom: '1px solid #e5e7eb' }}>Top 5 Colaboradores</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {relatorioData.topContatos.length > 0 ? relatorioData.topContatos.map((contato, i) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc', padding: '8px 12px', borderRadius: 6, border: '1px solid #e2e8f0' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                            <div style={{ width: 24, height: 24, borderRadius: 12, background: i === 0 ? '#fef08a' : '#e2e8f0', color: i === 0 ? '#854d0e' : '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 'bold' }}>
                                                {i + 1}
                                            </div>
                                            <span style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>
                                                {contato.nome}
                                            </span>
                                        </div>
                                        <div style={{ fontSize: 14, fontWeight: 'bold', color: '#111827' }}>
                                            {contato.count}
                                        </div>
                                    </div>
                                )) : (
                                    <div style={{ fontSize: 13, color: '#9ca3af', background: '#f8fafc', padding: '12px', borderRadius: 6 }}>Nenhum colaborador registrado.</div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Detailed Table */}
                    <div style={{ pageBreakInside: 'avoid' }}>
                        <h3 style={{ fontSize: 16, color: '#111827', margin: '0 0 16px 0', paddingBottom: 8, borderBottom: '1px solid #e5e7eb' }}>Lista de Chamados</h3>

                        {relatorioData.chamados.length === 0 ? (
                            <div style={{ padding: 32, textAlign: 'center', background: '#f9fafb', borderRadius: 8, color: '#6b7280' }}>
                                Nenhuma ocorrência validada neste período.
                            </div>
                        ) : (
                            <div style={{ borderRadius: 8, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, textAlign: 'left' }}>
                                    <thead>
                                        <tr style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                                            <th style={{ padding: '12px 10px', color: '#4b5563', fontWeight: 600, textTransform: 'uppercase', fontSize: 10, letterSpacing: '0.5px' }}>Abertura</th>
                                            <th style={{ padding: '12px 10px', color: '#4b5563', fontWeight: 600, textTransform: 'uppercase', fontSize: 10, letterSpacing: '0.5px' }}>Fechamento</th>
                                            <th style={{ padding: '12px 10px', color: '#4b5563', fontWeight: 600, textTransform: 'uppercase', fontSize: 10, letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>T. Total</th>
                                            <th style={{ padding: '12px 10px', color: '#4b5563', fontWeight: 600, textTransform: 'uppercase', fontSize: 10, letterSpacing: '0.5px' }}>Tipo</th>
                                            <th style={{ padding: '12px 10px', color: '#4b5563', fontWeight: 600, textTransform: 'uppercase', fontSize: 10, letterSpacing: '0.5px' }}>Título / Solicitante</th>
                                            <th style={{ padding: '12px 10px', color: '#4b5563', fontWeight: 600, textTransform: 'uppercase', fontSize: 10, letterSpacing: '0.5px', maxWidth: 150 }}>Descrição</th>
                                            <th style={{ padding: '12px 10px', color: '#4b5563', fontWeight: 600, textTransform: 'uppercase', fontSize: 10, letterSpacing: '0.5px', maxWidth: 150 }}>Solução</th>
                                            <th style={{ padding: '12px 10px', color: '#4b5563', fontWeight: 600, textTransform: 'uppercase', fontSize: 10, letterSpacing: '0.5px' }}>Status</th>
                                            <th style={{ padding: '12px 10px', color: '#4b5563', fontWeight: 600, textTransform: 'uppercase', fontSize: 10, letterSpacing: '0.5px' }}>SLA</th>
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

                                            const catNome = categoriasChamado.find(cat => cat.id === c.categoriaId)?.nome || 'Sem Categoria';
                                            const isEven = index % 2 === 0;

                                            return (
                                                <tr key={c.id} style={{ background: isEven ? '#ffffff' : '#f8fafc', borderBottom: '1px solid #f1f5f9', pageBreakInside: 'avoid' }}>
                                                    {/* Abertura */}
                                                    <td style={{ padding: '12px 10px', color: '#64748b', verticalAlign: 'top', whiteSpace: 'nowrap' }}>
                                                        <span style={{ fontWeight: 500 }}>{format(abertura, 'dd/MM/yy')}</span>
                                                        <div style={{ fontSize: 10, marginTop: 2 }}>{format(abertura, 'HH:mm')}</div>
                                                    </td>

                                                    {/* Fechamento */}
                                                    <td style={{ padding: '12px 10px', color: '#64748b', verticalAlign: 'top', whiteSpace: 'nowrap' }}>
                                                        {entrega ? (
                                                            <>
                                                                <span style={{ fontWeight: 500 }}>{format(entrega, 'dd/MM/yy')}</span>
                                                                <div style={{ fontSize: 10, marginTop: 2 }}>{format(entrega, 'HH:mm')}</div>
                                                            </>
                                                        ) : (
                                                            <span style={{ fontStyle: 'italic', color: '#cbd5e1' }}>Pendente</span>
                                                        )}
                                                    </td>

                                                    {/* Tempo Total */}
                                                    <td style={{ padding: '12px 10px', verticalAlign: 'top', fontWeight: 600, color: '#334155' }}>
                                                        {diffHorasLabel}
                                                    </td>

                                                    {/* Tipo (Categoria) */}
                                                    <td style={{ padding: '12px 10px', verticalAlign: 'top', color: '#4b5563' }}>
                                                        {catNome}
                                                    </td>

                                                    {/* Título / Solicitante */}
                                                    <td style={{ padding: '12px 10px', verticalAlign: 'top', minWidth: 120 }}>
                                                        <div style={{ fontWeight: 600, color: '#1e293b', marginBottom: 4 }}>{c.titulo}</div>
                                                        <div style={{ color: '#64748b', fontSize: 10 }}>
                                                            {c.contatoNome || 'N/D'}
                                                            {clienteId === 'todos' && c.clienteId && (
                                                                <span style={{ color: '#9ca3af', display: 'block', fontSize: 9, marginTop: 2 }}>
                                                                    Lab: {clientes.find(cli => cli.id === c.clienteId)?.nome}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>

                                                    {/* Descrição */}
                                                    <td style={{ padding: '12px 10px', verticalAlign: 'top', color: '#4b5563', maxWidth: 150 }}>
                                                        <div style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                            {c.descricao || '-'}
                                                        </div>
                                                    </td>

                                                    {/* Solução */}
                                                    <td style={{ padding: '12px 10px', verticalAlign: 'top', color: '#4b5563', maxWidth: 150 }}>
                                                        <div style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                            {c.solucaoFinal || '-'}
                                                        </div>
                                                    </td>

                                                    {/* Status */}
                                                    <td style={{ padding: '12px 10px', verticalAlign: 'top' }}>
                                                        <span style={{
                                                            display: 'inline-block',
                                                            padding: '2px 8px',
                                                            borderRadius: 4,
                                                            fontSize: 9,
                                                            fontWeight: 600,
                                                            background: c.status === 'fechado' ? '#dcfce7' : '#fef3c7',
                                                            color: c.status === 'fechado' ? '#166534' : '#92400e',
                                                            textTransform: 'uppercase',
                                                            whiteSpace: 'nowrap'
                                                        }}>
                                                            {c.status.replace('_', ' ')}
                                                        </span>
                                                    </td>

                                                    {/* SLA */}
                                                    <td style={{ padding: '12px 10px', verticalAlign: 'top', whiteSpace: 'nowrap' }}>
                                                        <div style={{ color: '#1e293b', fontWeight: 500, fontSize: 10 }}>{c.slaHoras}h</div>
                                                        <div style={{ fontSize: 9, color: '#64748b', marginTop: 2, textTransform: 'capitalize' }}>{c.prioridade}</div>
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* Gráfico Histórico Trimestral/Anual */}
                    <div style={{ marginTop: 40, pageBreakInside: 'avoid' }}>
                        <h3 style={{ fontSize: 16, color: '#111827', margin: '0 0 16px 0', paddingBottom: 8, borderBottom: '1px solid #e5e7eb' }}>
                            Volume Histórico - {relatorioData.evolucaoMensal.ano}
                        </h3>
                        <div style={{ display: 'flex', height: 180, background: '#f8fafc', padding: '24px 24px 16px', borderRadius: 8, border: '1px solid #e2e8f0', gap: 12 }}>
                            {['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'].map((mesLabel, mesIndex) => {
                                const valor = relatorioData.evolucaoMensal.dados[mesIndex];
                                const alturaScale = (valor / relatorioData.evolucaoMensal.max) * 100;
                                return (
                                    <div key={mesIndex} style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', alignItems: 'center' }}>
                                        <div style={{ flex: 1, width: '100%', position: 'relative', display: 'flex', justifyContent: 'center' }}>
                                            {/* Barra */}
                                            <div style={{
                                                position: 'absolute',
                                                bottom: 0,
                                                width: '100%',
                                                maxWidth: 40,
                                                height: `${Math.max(alturaScale, 1)}%`,
                                                background: valor > 0 ? '#6366f1' : '#e2e8f0',
                                                borderRadius: '4px 4px 0 0'
                                            }}></div>
                                            {/* Valor */}
                                            <div style={{
                                                position: 'absolute',
                                                bottom: `${Math.max(alturaScale, 1)}%`,
                                                marginBottom: 4,
                                                fontSize: 10,
                                                fontWeight: 700,
                                                color: valor > 0 ? '#4f46e5' : 'transparent',
                                                textAlign: 'center'
                                            }}>
                                                {valor}
                                            </div>
                                        </div>
                                        <div style={{ fontSize: 10, color: '#64748b', fontWeight: 600, marginTop: 8 }}>{mesLabel}</div>
                                    </div>
                                );
                            })}
                        </div>
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
