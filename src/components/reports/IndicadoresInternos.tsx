import React, { useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { TicketCheck, Clock, AlertTriangle, Users, Calendar } from 'lucide-react';

export default function IndicadoresInternos() {
    const { chamados, categoriasChamado, clientes, usuarios } = useApp();

    // Filtro de Datas padrão: Mês atual
    const [dataInicio, setDataInicio] = useState(() => {
        const hoje = new Date();
        const primeiroDia = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
        return primeiroDia.toISOString().split('T')[0];
    });

    const [dataFim, setDataFim] = useState(() => {
        const hoje = new Date();
        const ultimoDia = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
        return ultimoDia.toISOString().split('T')[0];
    });

    const stats = useMemo(() => {
        // Filtra os chamados pelo período selecionado
        const chamadosFiltrados = chamados.filter(c => {
            if (!dataInicio && !dataFim) return true;

            const dataAbertura = new Date(c.dataAbertura);
            // Zera a hora para comparação de apenas datas
            dataAbertura.setHours(0, 0, 0, 0);

            let inicioValido = true;
            let fimValido = true;

            if (dataInicio) {
                const inicioDate = new Date(dataInicio);
                // Evita problemas de fuso horário ao criar a data local a partir do input string
                inicioDate.setUTCHours(0, 0, 0, 0);
                inicioValido = dataAbertura.getTime() >= inicioDate.getTime();
            }

            if (dataFim) {
                const fimDate = new Date(dataFim);
                fimDate.setUTCHours(0, 0, 0, 0);
                // Adiciona 1 dia para que a data final seja inclusiva (até o final daquele dia)
                const endTime = fimDate.getTime() + (24 * 60 * 60 * 1000) - 1;
                fimValido = dataAbertura.getTime() <= endTime;
            }

            return inicioValido && fimValido;
        });

        const total = chamadosFiltrados.length;
        const abertos = chamadosFiltrados.filter(c => c.status !== 'fechado').length;
        const fechados = chamadosFiltrados.filter(c => c.status === 'fechado').length;

        // Separação por região (via lookup de cliente)
        const totalSul = chamadosFiltrados.filter(c => {
            const cliente = clientes.find(cli => cli.id === c.clienteId);
            return cliente?.regiao === 'Sul';
        }).length;

        const totalNorte = chamadosFiltrados.filter(c => {
            const cliente = clientes.find(cli => cli.id === c.clienteId);
            return cliente?.regiao === 'Norte';
        }).length;

        // SLA Violation
        const violados = chamadosFiltrados.filter(c => {
            if (c.status === 'fechado' && c.dataFechamento) {
                const abertura = new Date(c.dataAbertura).getTime();
                const fechamento = new Date(c.dataFechamento).getTime();
                const diffHoras = (fechamento - abertura) / (1000 * 60 * 60);
                return diffHoras > c.slaHoras;
            }
            return false;
        }).length;

        // Rankings
        const byClientInfo = clientes.map(cli => ({
            id: cli.id,
            nome: cli.nome,
            regiao: cli.regiao || 'Não def.',
            count: chamadosFiltrados.filter(ch => ch.clienteId === cli.id).length
        }));

        const byClient = [...byClientInfo].sort((a, b) => b.count - a.count).filter(c => c.count > 0).slice(0, 5);
        const byClientSul = byClientInfo.filter(c => c.regiao === 'Sul').sort((a, b) => b.count - a.count).filter(c => c.count > 0).slice(0, 5);
        const byClientNorte = byClientInfo.filter(c => c.regiao === 'Norte').sort((a, b) => b.count - a.count).filter(c => c.count > 0).slice(0, 5);

        const byCategoria = categoriasChamado.map(cat => ({
            nome: cat.nome,
            count: chamadosFiltrados.filter(ch => ch.categoriaId === cat.id).length
        })).filter(cat => cat.count > 0).sort((a, b) => b.count - a.count);

        // Cálculo de dias no período
        const totalDias = (() => {
            const inicio = new Date(dataInicio);
            const fim = new Date(dataFim);
            const diffTime = Math.abs(fim.getTime() - inicio.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 para ser inclusivo
            return diffDays || 1;
        })();

        const byTecnico = usuarios
            .filter(u => u.role === 'tecnico' || u.role === 'admin')
            .map(tec => {
                const fechadosNoPeriodo = chamadosFiltrados.filter(ch => 
                    ch.tecnicoId === tec.id && 
                    ch.status === 'fechado' && 
                    ch.dataFechamento
                );

                const count = fechadosNoPeriodo.length;

                // Cálculo de tempo médio em minutos
                const tempoTotalMinutos = fechadosNoPeriodo.reduce((acc, ch) => {
                    if (!ch.dataFechamento) return acc;
                    const abertura = new Date(ch.dataAbertura).getTime();
                    const fechamento = new Date(ch.dataFechamento).getTime();
                    return acc + ((fechamento - abertura) / (1000 * 60));
                }, 0);

                const mediaMinutos = count > 0 ? Math.round(tempoTotalMinutos / count) : 0;
                const mediaChamadosDia = Number((count / totalDias).toFixed(1));

                return {
                    nome: tec.nome,
                    count,
                    mediaChamadosDia,
                    mediaMinutos
                };
            })
            .filter(tec => tec.count > 0)
            .sort((a, b) => b.count - a.count);

        // Agrupa por colaborador que abriu o chamado (usando o contatoNome + ID do cliente para saber a região)
        // Usamos um identificador composto para evitar sobreposição de nomes de Labs diferentes
        // Identificador: "Nome do Contato|ID do Cliente"
        const contatosMap = new Map<string, { nome: string; clienteId: string; count: number }>();
        chamadosFiltrados.forEach(c => {
            const nomeContato = c.contatoNome || 'Não Identificado';
            const clientIdString = c.clienteId || 'sem_id';
            const compositeKey = `${nomeContato}|${clientIdString}`;

            if (!contatosMap.has(compositeKey)) {
                contatosMap.set(compositeKey, { nome: nomeContato, clienteId: clientIdString, count: 0 });
            }
            const data = contatosMap.get(compositeKey);
            if (data) {
                data.count += 1;
            }
        });

        const byContato = Array.from(contatosMap.values())
            .map(item => {
                const clienteInfo = clientes.find(cli => cli.id === item.clienteId);
                return {
                    nome: item.nome,
                    count: item.count,
                    labNome: clienteInfo ? clienteInfo.nome : 'Laboratório Desconhecido',
                    labRegiao: clienteInfo ? clienteInfo.regiao : undefined
                };
            })
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        return {
            total, abertos, fechados, violados,
            totalSul, totalNorte,
            byClient, byClientSul, byClientNorte,
            byCategoria, byTecnico, byContato
        };
    }, [chamados, clientes, categoriasChamado, usuarios, dataInicio, dataFim]);

    // Função auxiliar para renderizar a badge regional
    const renderRegiaoBadge = (regiao: string) => {
        if (!regiao || regiao === 'Não def.') return null;

        const isSul = regiao === 'Sul';
        const isNorte = regiao === 'Norte';

        let bgColor = 'var(--bg-hover)';
        let textColor = 'var(--text-secondary)';

        if (isSul) {
            bgColor = 'var(--danger-bg)';
            textColor = 'var(--danger)';
        } else if (isNorte) {
            bgColor = 'var(--info-bg)';
            textColor = 'var(--info)';
        }

        return (
            <span style={{
                fontSize: 11,
                marginLeft: 8,
                padding: '2px 8px',
                background: bgColor,
                color: textColor,
                borderRadius: 12,
                fontWeight: 600
            }}>
                {regiao}
            </span>
        );
    };

    return (
        <div className="indicadores-internos">
            {/* Filtros */}
            <div className="filters-bar" style={{ marginBottom: '24px', background: 'var(--bg-card)', padding: '16px 24px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
                    <Calendar size={18} />
                    <span style={{ fontWeight: 600, fontSize: '13px' }}>Período de Análise:</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                        type="date"
                        value={dataInicio}
                        onChange={(e) => setDataInicio(e.target.value)}
                        className="filter-select"
                        style={{ width: '140px', padding: '6px 10px' }}
                    />
                    <span style={{ color: 'var(--text-muted)' }}>até</span>
                    <input
                        type="date"
                        value={dataFim}
                        onChange={(e) => setDataFim(e.target.value)}
                        className="filter-select"
                        style={{ width: '140px', padding: '6px 10px' }}
                    />
                </div>
                {/* Botão para resetar para o mês atual rapidamente */}
                <button
                    onClick={() => {
                        const hoje = new Date();
                        const pn = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
                        const ult = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
                        setDataInicio(pn.toISOString().split('T')[0]);
                        setDataFim(ult.toISOString().split('T')[0]);
                    }}
                    style={{
                        background: 'transparent',
                        border: '1px solid var(--border-color)',
                        color: 'var(--text-secondary)',
                        padding: '6px 12px',
                        borderRadius: 'var(--radius-sm)',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: 500,
                        transition: 'al var(--transition)'
                    }}
                    onMouseOver={(e) => {
                        e.currentTarget.style.background = 'var(--bg-hover)';
                        e.currentTarget.style.color = 'var(--text-primary)';
                    }}
                    onMouseOut={(e) => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = 'var(--text-secondary)';
                    }}
                >
                    Mês Atual
                </button>
            </div>

            {/* Primeira Linha: KPI Cards Gerais e Regionais */}
            <div className="summary-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '16px', marginBottom: '30px' }}>
                <KPICard title="Total de Chamados" value={stats.total} icon={<TicketCheck size={24} color="var(--text-secondary)" />} />
                <KPICard title="Total de Chamados - Sul" value={stats.totalSul} icon={<TicketCheck size={24} color="var(--danger)" />} />
                <KPICard title="Total de Chamados - Norte" value={stats.totalNorte} icon={<TicketCheck size={24} color="var(--info)" />} />
                <KPICard title="Desempenho SLA (No Prazo)" value={`${stats.fechados > 0 ? Math.round(((stats.fechados - stats.violados) / stats.fechados) * 100) : 100}%`} icon={<Clock size={24} color="var(--accent)" />} highlight />
                <KPICard title="Chamados em Atraso" value={stats.violados} icon={<AlertTriangle size={24} color="var(--danger)" />} />
                <KPICard title="Total de chamados fechados" value={stats.fechados} icon={<TicketCheck size={24} color="var(--success)" />} />
            </div>

            {/* Segunda Linha: Volume por Laboratório (Geral, Sul, Norte) */}
            <div className="charts-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', marginBottom: '30px' }}>
                <div className="admin-card" style={{ padding: 24, margin: 0 }}>
                    <h3 style={{ marginTop: 0, marginBottom: 16 }}>Top 5 Laboratórios (Geral)</h3>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                        {stats.byClient.map((c, i) => (
                            <li key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: i === stats.byClient.length - 1 ? 'none' : '1px solid var(--border)' }}>
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <span style={{ fontWeight: 500 }}>{c.nome}</span>
                                    {renderRegiaoBadge(c.regiao)}
                                </div>
                                <span style={{ fontWeight: 'bold', color: 'var(--accent)' }}>{c.count}</span>
                            </li>
                        ))}
                        {stats.byClient.length === 0 && <li style={{ padding: '12px 0', color: 'var(--text-muted)' }}>Nenhum chamado no período</li>}
                    </ul>
                </div>

                <div className="admin-card" style={{ padding: 24, margin: 0 }}>
                    <h3 style={{ marginTop: 0, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                        Top 5 Laboratórios (Sul)
                    </h3>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                        {stats.byClientSul.map((c, i) => (
                            <li key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: i === stats.byClientSul.length - 1 ? 'none' : '1px solid var(--border)' }}>
                                <span style={{ fontWeight: 500 }}>{c.nome}</span>
                                <span style={{ fontWeight: 'bold', color: 'var(--danger)' }}>{c.count}</span>
                            </li>
                        ))}
                        {stats.byClientSul.length === 0 && <li style={{ padding: '12px 0', color: 'var(--text-muted)' }}>Nenhum chamado no período</li>}
                    </ul>
                </div>

                <div className="admin-card" style={{ padding: 24, margin: 0 }}>
                    <h3 style={{ marginTop: 0, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                        Top 5 Laboratórios (Norte)
                    </h3>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                        {stats.byClientNorte.map((c, i) => (
                            <li key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: i === stats.byClientNorte.length - 1 ? 'none' : '1px solid var(--border)' }}>
                                <span style={{ fontWeight: 500 }}>{c.nome}</span>
                                <span style={{ fontWeight: 'bold', color: 'var(--info)' }}>{c.count}</span>
                            </li>
                        ))}
                        {stats.byClientNorte.length === 0 && <li style={{ padding: '12px 0', color: 'var(--text-muted)' }}>Nenhum chamado no período</li>}
                    </ul>
                </div>
            </div>

            {/* Terceira Linha: Performance de Usuários e Técnicos */}
            <div className="charts-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '30px' }}>
                <div className="admin-card" style={{ padding: 24, margin: 0 }}>
                    <h3 style={{ marginTop: 0, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Users size={18} /> Top 5 Colaboradores (Abertura)
                    </h3>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                        {stats.byContato.map((t, i) => (
                            <li key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: i === stats.byContato.length - 1 ? 'none' : '1px solid var(--border)' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <span style={{ fontWeight: 500 }}>{t.nome}</span>
                                        {renderRegiaoBadge(t.labRegiao || '')}
                                    </div>
                                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                                        {t.labNome}
                                    </span>
                                </div>
                                <span style={{ fontWeight: 'bold', color: 'var(--accent)', alignSelf: 'center' }}>{t.count} chamados</span>
                            </li>
                        ))}
                        {stats.byContato.length === 0 && <li style={{ padding: '12px 0', color: 'var(--text-muted)' }}>Nenhum chamado no período</li>}
                    </ul>
                </div>

                <div className="admin-card" style={{ padding: 24, margin: 0 }}>
                    <h3 style={{ marginTop: 0, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Users size={18} /> Resoluções por Técnico
                    </h3>
                    
                    {/* Cabeçalho da Tabela */}
                    <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: '2fr 1fr 1.2fr 1.2fr', 
                        padding: '12px 8px', 
                        borderBottom: '2px solid var(--border)',
                        color: 'var(--text-muted)',
                        fontSize: '12px',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                    }}>
                        <span>Técnico</span>
                        <span style={{ textAlign: 'center' }}>Total</span>
                        <span style={{ textAlign: 'center' }}>Média/Dia</span>
                        <span style={{ textAlign: 'right' }}>Tempo Médio</span>
                    </div>

                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                        {stats.byTecnico.map((t, i) => (
                            <li key={i} style={{ 
                                display: 'grid', 
                                gridTemplateColumns: '2fr 1fr 1.2fr 1.2fr', 
                                alignItems: 'center',
                                padding: '16px 8px', 
                                borderBottom: i === stats.byTecnico.length - 1 ? 'none' : '1px solid var(--border)',
                                transition: 'background 0.2s ease'
                            }}>
                                <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{t.nome}</span>
                                
                                <div style={{ textAlign: 'center' }}>
                                    <span style={{ 
                                        background: 'var(--success-bg)', 
                                        color: 'var(--success)', 
                                        padding: '4px 10px', 
                                        borderRadius: '12px', 
                                        fontSize: '13px', 
                                        fontWeight: 600 
                                    }}>
                                        {t.count}
                                    </span>
                                </div>

                                <span style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '14px' }}>
                                    {t.mediaChamadosDia}
                                </span>

                                <div style={{ textAlign: 'right' }}>
                                    <span style={{ 
                                        color: t.mediaMinutos > 120 ? 'var(--warning)' : 'var(--text-primary)',
                                        fontWeight: 500,
                                        fontSize: '14px'
                                    }}>
                                        {t.mediaMinutos} min
                                    </span>
                                </div>
                            </li>
                        ))}
                        {stats.byTecnico.length === 0 && (
                            <li style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
                                Nenhum chamado fechado no período
                            </li>
                        )}
                    </ul>
                </div>
            </div>

            {/* Quarta Linha: Categorização */}
            <div className="charts-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
                <div className="admin-card" style={{ padding: 24, margin: 0 }}>
                    <h3 style={{ marginTop: 0, marginBottom: 16 }}>Chamados por Categoria</h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                        {stats.byCategoria.map((cat, i) => (
                            <div key={i} style={{ background: 'var(--bg-hover)', padding: '12px 16px', borderRadius: 8, display: 'flex', flexDirection: 'column', flex: '1 1 200px' }}>
                                <span style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>{cat.nome}</span>
                                <span style={{ fontSize: 24, fontWeight: 'bold' }}>{cat.count}</span>
                            </div>
                        ))}
                        {stats.byCategoria.length === 0 && <span style={{ color: 'var(--text-muted)' }}>Nenhum dado no período</span>}
                    </div>
                </div>
            </div>
        </div>
    );
}

function KPICard({ title, value, icon, highlight = false }: { title: string, value: string | number, icon: React.ReactNode, highlight?: boolean }) {
    return (
        <div className="admin-card" style={{ margin: 0, padding: '20px', borderTop: highlight ? '3px solid var(--accent)' : 'none' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600 }}>{title}</span>
                {icon}
            </div>
            <div style={{ fontSize: 28, fontWeight: 'bold', color: 'var(--text-primary)' }}>
                {value}
            </div>
        </div>
    );
}
