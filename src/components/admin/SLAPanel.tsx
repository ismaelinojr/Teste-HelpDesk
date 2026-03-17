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
    ).sort((a, b) => a.nome.localeCompare(b.nome));

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

            <div className="compact-list">
                {filteredSLAs.map(sla => (
                    <div key={sla.id} className={`list-item ${sla.ativo === false ? 'inactive' : ''}`}>
                        <div className="item-main">
                            <div className="item-icon" style={{ background: `${sla.cor}20` }}>
                                <Timer size={22} color={sla.cor} />
                            </div>
                            <div className="item-info">
                                <div className="item-title">
                                    {sla.nome}
                                    {sla.ativo === false && (
                                        <span className="badge-inactive" style={{ fontSize: 10, padding: '2px 6px', background: 'var(--danger)', color: 'white', borderRadius: 4 }}>
                                            Inativo
                                        </span>
                                    )}
                                </div>
                                <div className="item-sub">
                                    <span className="item-sub-item">
                                        Tempo de resposta: <strong style={{ color: sla.cor }}>{formatHoras(sla.horas)}</strong>
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="item-actions">
                            <button className="btn-ghost" onClick={() => handleOpenEdit(sla)} title="Editar">
                                <Edit2 size={18} />
                            </button>
                            <button className="btn-ghost" onClick={() => handleToggleActive(sla)} title={sla.ativo === false ? 'Habilitar' : 'Desabilitar'} style={{ color: sla.ativo === false ? 'var(--success)' : 'var(--danger)' }}>
                                {sla.ativo === false ? <Power size={18} /> : <Trash2 size={18} />}
                            </button>
                        </div>
                    </div>
                ))}

                {filteredSLAs.length === 0 && (
                    <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                        Nenhum SLA encontrado.
                    </div>
                )}
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
