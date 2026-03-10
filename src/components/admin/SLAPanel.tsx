import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Search, Plus, Edit2, Trash2, Power, Timer } from 'lucide-react';
import ModalForm from './ModalForm';
import type { SLAConfig } from '../../types';

export default function SLAPanel() {
    const { slaConfigs, addSLA, updateSLA, deleteSLA } = useApp();
    const [search, setSearch] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSLA, setEditingSLA] = useState<SLAConfig | null>(null);

    // Form state
    const [nome, setNome] = useState('');
    const [horas, setHoras] = useState(24);
    const [cor, setCor] = useState('#3b82f6');

    const filteredSLAs = slaConfigs.filter(s =>
        s.nome.toLowerCase().includes(search.toLowerCase())
    );

    const handleOpenNew = () => {
        setEditingSLA(null);
        setNome('');
        setHoras(24);
        setCor('#3b82f6');
        setIsModalOpen(true);
    };

    const handleOpenEdit = (sla: SLAConfig) => {
        setEditingSLA(sla);
        setNome(sla.nome);
        setHoras(sla.horas);
        setCor(sla.cor);
        setIsModalOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (editingSLA) {
            await updateSLA(editingSLA.id, { nome, horas, cor });
        } else {
            await addSLA({ nome, horas, cor, ativo: true });
        }
        setIsModalOpen(false);
    };

    const handleToggleActive = async (sla: SLAConfig) => {
        if (confirm(`Deseja realmente ${sla.ativo === false ? 'habilitar' : 'desabilitar'} o SLA "${sla.nome}"?`)) {
            if (sla.ativo === false) {
                await updateSLA(sla.id, { ativo: true });
            } else {
                await deleteSLA(sla.id);
            }
        }
    };

    const formatHoras = (h: number) => {
        if (h < 24) return `${h} hora${h > 1 ? 's' : ''}`;
        const dias = Math.floor(h / 24);
        const restHoras = h % 24;
        if (restHoras === 0) return `${dias} dia${dias > 1 ? 's' : ''}`;
        return `${dias}d ${restHoras}h`;
    };

    return (
        <div className="admin-panel area-sla">
            <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div className="search-bar" style={{ position: 'relative', width: '300px' }}>
                    <Search size={18} style={{ position: 'absolute', left: 12, top: 10, color: 'var(--text-secondary)' }} />
                    <input
                        type="text"
                        placeholder="Buscar SLA..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{ width: '100%', padding: '10px 10px 10px 36px', borderRadius: 8, border: '1px solid var(--border)' }}
                    />
                </div>
                <button className="btn btn-primary" onClick={handleOpenNew}>
                    <Plus size={16} style={{ marginRight: 6 }} />
                    Novo SLA
                </button>
            </div>

            <div className="admin-list grid-list">
                {filteredSLAs.map(sla => (
                    <div key={sla.id} className={`admin-card ${sla.ativo === false ? 'inactive' : ''}`} style={{
                        opacity: sla.ativo === false ? 0.6 : 1,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{
                                width: 40,
                                height: 40,
                                borderRadius: 'var(--radius-md)',
                                background: `${sla.cor}20`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                            }}>
                                <Timer size={20} color={sla.cor} />
                            </div>
                            <div>
                                <h3 style={{ margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
                                    {sla.nome}
                                    {sla.ativo === false && <span style={{ fontSize: 10, padding: '2px 6px', background: 'var(--danger)', color: 'white', borderRadius: 4 }}>Inativo</span>}
                                </h3>
                                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 13 }}>
                                    Tempo de resposta: <strong style={{ color: sla.cor }}>{formatHoras(sla.horas)}</strong>
                                </p>
                            </div>
                        </div>
                        <div className="card-actions" style={{ display: 'flex', gap: 8 }}>
                            <button className="btn-icon" onClick={() => handleOpenEdit(sla)} title="Editar" style={{ background: 'var(--bg-hover)', border: 'none', padding: 8, borderRadius: 6, cursor: 'pointer', color: 'var(--text-primary)' }}>
                                <Edit2 size={16} />
                            </button>
                            <button className="btn-icon" onClick={() => handleToggleActive(sla)} title={sla.ativo === false ? 'Habilitar' : 'Desabilitar'} style={{ background: 'var(--bg-hover)', border: 'none', padding: 8, borderRadius: 6, cursor: 'pointer', color: sla.ativo === false ? 'var(--success)' : 'var(--danger)' }}>
                                {sla.ativo === false ? <Power size={16} /> : <Trash2 size={16} />}
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <ModalForm
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingSLA ? 'Editar SLA' : 'Novo SLA'}
            >
                <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div className="form-group">
                        <label>Nome do SLA</label>
                        <input
                            type="text"
                            required
                            value={nome}
                            onChange={e => setNome(e.target.value)}
                            placeholder="Ex: Crítico"
                            style={{ width: '100%', padding: '10px', borderRadius: 6, border: '1px solid var(--border)' }}
                        />
                    </div>
                    <div className="form-group">
                        <label>Tempo de Resposta (horas)</label>
                        <input
                            type="number"
                            min={1}
                            max={720}
                            required
                            value={horas}
                            onChange={e => setHoras(Number(e.target.value))}
                            style={{ width: '100%', padding: '10px', borderRadius: 6, border: '1px solid var(--border)' }}
                        />
                    </div>
                    <div className="form-group">
                        <label>Cor</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <input
                                type="color"
                                value={cor}
                                onChange={e => setCor(e.target.value)}
                                style={{ width: 48, height: 36, padding: 2, borderRadius: 6, border: '1px solid var(--border)', cursor: 'pointer', background: 'var(--bg-input)' }}
                            />
                            <input
                                type="text"
                                value={cor}
                                onChange={e => setCor(e.target.value)}
                                style={{ flex: 1, padding: '10px', borderRadius: 6, border: '1px solid var(--border)', fontFamily: 'monospace' }}
                            />
                        </div>
                    </div>
                    <div className="form-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 16 }}>
                        <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancelar</button>
                        <button type="submit" className="btn btn-primary">Salvar</button>
                    </div>
                </form>
            </ModalForm>
        </div>
    );
}
