import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Search, Plus, Edit2, Trash2, Power, GripVertical } from 'lucide-react';
import ModalForm from './ModalForm';
import type { StatusConfig } from '../../types';

export default function StatusPanel() {
    const { statusConfigs, addStatus, updateStatus, deleteStatus } = useApp();
    const [search, setSearch] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingStatus, setEditingStatus] = useState<StatusConfig | null>(null);

    // Form state
    const [nome, setNome] = useState('');
    const [cor, setCor] = useState('#8E7CFF');
    const [ordem, setOrdem] = useState(1);

    const allStatuses = [...statusConfigs].sort((a, b) => a.ordem - b.ordem);
    const filteredStatuses = allStatuses.filter(s =>
        s.nome.toLowerCase().includes(search.toLowerCase())
    );

    const handleOpenNew = () => {
        setEditingStatus(null);
        setNome('');
        setCor('#8E7CFF');
        setOrdem(allStatuses.length + 1);
        setIsModalOpen(true);
    };

    const handleOpenEdit = (status: StatusConfig) => {
        setEditingStatus(status);
        setNome(status.nome);
        setCor(status.cor);
        setOrdem(status.ordem);
        setIsModalOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (editingStatus) {
            await updateStatus(editingStatus.id, { nome, cor, ordem });
        } else {
            await addStatus({ nome, cor, icone: 'Circle', ordem, ativo: true });
        }
        setIsModalOpen(false);
    };

    const handleToggleActive = async (status: StatusConfig) => {
        if (confirm(`Deseja realmente ${status.ativo === false ? 'habilitar' : 'desabilitar'} o status "${status.nome}"?`)) {
            if (status.ativo === false) {
                await updateStatus(status.id, { ativo: true });
            } else {
                await deleteStatus(status.id);
            }
        }
    };

    return (
        <div className="admin-panel area-status">
            <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div className="search-bar" style={{ position: 'relative', width: '300px' }}>
                    <Search size={18} style={{ position: 'absolute', left: 12, top: 10, color: 'var(--text-secondary)' }} />
                    <input
                        type="text"
                        placeholder="Buscar status..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{ width: '100%', padding: '10px 10px 10px 36px', borderRadius: 8, border: '1px solid var(--border)' }}
                    />
                </div>
                <button className="btn btn-primary" onClick={handleOpenNew}>
                    <Plus size={16} style={{ marginRight: 6 }} />
                    Novo Status
                </button>
            </div>

            <div className="admin-list grid-list">
                {filteredStatuses.map(status => (
                    <div key={status.id} className={`admin-card ${status.ativo === false ? 'inactive' : ''}`} style={{
                        opacity: status.ativo === false ? 0.6 : 1,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <GripVertical size={16} color="var(--text-muted)" />
                            <div>
                                <h3 style={{ margin: '0 0 6px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <span style={{
                                        width: 12,
                                        height: 12,
                                        borderRadius: '50%',
                                        background: status.cor,
                                        display: 'inline-block',
                                        flexShrink: 0,
                                    }} />
                                    {status.nome}
                                    {status.ativo === false && <span style={{ fontSize: 10, padding: '2px 6px', background: 'var(--danger)', color: 'white', borderRadius: 4 }}>Inativo</span>}
                                </h3>
                                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 12 }}>
                                    ID: <code style={{ color: 'var(--accent)', fontSize: 11 }}>{status.id}</code> · Ordem: {status.ordem}
                                </p>
                            </div>
                        </div>
                        <div className="card-actions" style={{ display: 'flex', gap: 8 }}>
                            <button className="btn-icon" onClick={() => handleOpenEdit(status)} title="Editar" style={{ background: 'var(--bg-hover)', border: 'none', padding: 8, borderRadius: 6, cursor: 'pointer', color: 'var(--text-primary)' }}>
                                <Edit2 size={16} />
                            </button>
                            <button className="btn-icon" onClick={() => handleToggleActive(status)} title={status.ativo === false ? 'Habilitar' : 'Desabilitar'} style={{ background: 'var(--bg-hover)', border: 'none', padding: 8, borderRadius: 6, cursor: 'pointer', color: status.ativo === false ? 'var(--success)' : 'var(--danger)' }}>
                                {status.ativo === false ? <Power size={16} /> : <Trash2 size={16} />}
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <ModalForm
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingStatus ? 'Editar Status' : 'Novo Status'}
            >
                <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div className="form-group">
                        <label>Nome do Status</label>
                        <input
                            type="text"
                            required
                            value={nome}
                            onChange={e => setNome(e.target.value)}
                            placeholder="Ex: Em Desenvolvimento"
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
                    <div className="form-group">
                        <label>Ordem de Exibição</label>
                        <input
                            type="number"
                            min={1}
                            max={20}
                            value={ordem}
                            onChange={e => setOrdem(Number(e.target.value))}
                            style={{ width: '100%', padding: '10px', borderRadius: 6, border: '1px solid var(--border)' }}
                        />
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
