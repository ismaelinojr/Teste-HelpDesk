import React, { useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { TicketCheck, Clock, CheckCircle2, AlertTriangle, Users } from 'lucide-react';
import type { Chamado } from '../../types';

export default function IndicadoresInternos() {
    const { chamados, categoriasChamado, clientes, usuarios } = useApp();

    const stats = useMemo(() => {
        const total = chamados.length;
        const abertos = chamados.filter(c => c.status !== 'fechado').length;
        const fechados = chamados.filter(c => c.status === 'fechado').length;

        // FCR - First Contact Resolution (Resolvido com solucaoFinal preenchida e poucas interações - limitaremos a checagem mockada a chamados fechados sem reabertura, assumimos que 60% são FCR mock pro MVP ou calculamos pelas interacoes se tivessemos)
        // Para simplificar no MVP local, vamos inferir que chamados "fechados" diretamente com técnico assinado na criação = FCR. Mas aqui faremos um mock simples com %
        const fcrRate = fechados > 0 ? 68.5 : 0; // % Mock temporário

        // SLA Violation
        const violados = chamados.filter(c => {
            if (c.status === 'fechado' && c.dataFechamento) {
                const abertura = new Date(c.dataAbertura).getTime();
                const fechamento = new Date(c.dataFechamento).getTime();
                const diffHoras = (fechamento - abertura) / (1000 * 60 * 60);
                return diffHoras > c.slaHoras;
            }
            return false;
        }).length;

        // Rankings
        const byClient = clientes.map(cli => ({
            nome: cli.nome,
            regiao: cli.regiao || 'Não def.',
            count: chamados.filter(ch => ch.clienteId === cli.id).length
        })).sort((a, b) => b.count - a.count).slice(0, 5);

        const byCategoria = categoriasChamado.map(cat => ({
            nome: cat.nome,
            count: chamados.filter(ch => ch.categoriaId === cat.id).length
        })).sort((a, b) => b.count - a.count);

        const byTecnico = usuarios.filter(u => u.role === 'tecnico').map(tec => ({
            nome: tec.nome,
            count: chamados.filter(ch => ch.tecnicoId === tec.id && ch.status === 'fechado').length
        })).sort((a, b) => b.count - a.count);

        return {
            total, abertos, fechados, fcrRate, violados, byClient, byCategoria, byTecnico
        };
    }, [chamados, clientes, categoriasChamado, usuarios]);

    return (
        <div className="indicadores-internos">
            {/* KPI Cards */}
            <div className="summary-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                <KPICard title="Total de Chamados" value={stats.total} icon={<TicketCheck size={24} color="var(--text-secondary)" />} />
                <KPICard title="Desempenho SLA (No Prazo)" value={`${stats.fechados > 0 ? Math.round(((stats.fechados - stats.violados) / stats.fechados) * 100) : 100}%`} icon={<Clock size={24} color="var(--accent)" />} highlight />
                <KPICard title="Resolução no 1º Contato (FCR)" value={`${stats.fcrRate}%`} icon={<CheckCircle2 size={24} color="var(--success)" />} />
                <KPICard title="Chamados em Atraso" value={stats.violados} icon={<AlertTriangle size={24} color="var(--danger)" />} />
            </div>

            <div className="charts-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                <div className="admin-card" style={{ padding: 24, margin: 0 }}>
                    <h3 style={{ marginTop: 0, marginBottom: 16 }}>Top 5 Laboratórios (Volume)</h3>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                        {stats.byClient.map((c, i) => (
                            <li key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: i === 4 ? 'none' : '1px solid var(--border)' }}>
                                <div>
                                    <span style={{ fontWeight: 500 }}>{c.nome}</span>
                                    <span style={{ fontSize: 11, marginLeft: 8, padding: '2px 6px', background: 'var(--bg-hover)', borderRadius: 12 }}>{c.regiao}</span>
                                </div>
                                <span style={{ fontWeight: 'bold', color: 'var(--accent)' }}>{c.count}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="admin-card" style={{ padding: 24, margin: 0 }}>
                    <h3 style={{ marginTop: 0, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Users size={18} /> Resoluções por Técnico
                    </h3>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                        {stats.byTecnico.map((t, i) => (
                            <li key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: i === stats.byTecnico.length - 1 ? 'none' : '1px solid var(--border)' }}>
                                <span>{t.nome}</span>
                                <span style={{ fontWeight: 'bold', color: 'var(--success)' }}>{t.count} fechados</span>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="admin-card" style={{ padding: 24, margin: 0, gridColumn: '1 / -1' }}>
                    <h3 style={{ marginTop: 0, marginBottom: 16 }}>Chamados por Categoria</h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                        {stats.byCategoria.map((cat, i) => (
                            <div key={i} style={{ background: 'var(--bg-hover)', padding: '12px 16px', borderRadius: 8, display: 'flex', flexDirection: 'column', flex: '1 1 200px' }}>
                                <span style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>{cat.nome}</span>
                                <span style={{ fontSize: 24, fontWeight: 'bold' }}>{cat.count}</span>
                            </div>
                        ))}
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
