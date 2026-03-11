import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Building2, Search, Plus, Edit2, Trash2, Power } from 'lucide-react';
import ModalForm from './ModalForm';
import type { Cliente } from '../../types';

export default function ClientesPanel() {
    const { clientes, addCliente, updateCliente, deleteCliente } = useApp();
    const [search, setSearch] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);

    // Form state
    const [nome, setNome] = useState('');
    const [contato, setContato] = useState('');
    const [endereco, setEndereco] = useState('');
    const [regiao, setRegiao] = useState<'Norte' | 'Sul'>('Sul');

    const filteredClientes = clientes.filter(c =>
        c.nome.toLowerCase().includes(search.toLowerCase()) ||
        c.contato.includes(search)
    );

    const handleOpenNew = () => {
        setEditingCliente(null);
        setNome('');
        setContato('');
        setEndereco('');
        setRegiao('Sul');
        setIsModalOpen(true);
    };

    const handleOpenEdit = (cliente: Cliente) => {
        setEditingCliente(cliente);
        setNome(cliente.nome);
        setContato(cliente.contato);
        setEndereco(cliente.endereco || '');
        setRegiao(cliente.regiao || 'Sul');
        setIsModalOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingCliente) {
                await updateCliente(editingCliente.id, { nome, contato, endereco, regiao });
            } else {
                await addCliente({ nome, contato, endereco, regiao });
            }
            setIsModalOpen(false);
        } catch (error: any) {
            console.error('Erro ao salvar cliente:', error);
            alert('Não foi possível salvar os dados. Erro: ' + (error.message || 'Falha de comunicação ou Timeout no Supabase.'));
        }
    };

    const handleToggleActive = async (cliente: Cliente) => {
        if (confirm(`Deseja realmente ${cliente.ativo === false ? 'habilitar' : 'desabilitar'} o cliente ${cliente.nome}?`)) {
            if (cliente.ativo === false) {
                await updateCliente(cliente.id, { ativo: true });
            } else {
                await deleteCliente(cliente.id);
            }
        }
    };

    return (
        <div className="admin-panel area-clientes">
            <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div className="search-bar" style={{ position: 'relative', width: '300px' }}>
                    <Search size={18} style={{ position: 'absolute', left: 12, top: 10, color: 'var(--text-secondary)' }} />
                    <input
                        type="text"
                        placeholder="Buscar cliente..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{ width: '100%', padding: '10px 10px 10px 36px', borderRadius: 8, border: '1px solid var(--border)' }}
                    />
                </div>
                <button className="btn btn-primary" onClick={handleOpenNew}>
                    <Plus size={16} style={{ marginRight: 6 }} />
                    Novo Cliente
                </button>
            </div>

            <div className="admin-list grid-list">
                {filteredClientes.map(cliente => (
                    <div key={cliente.id} className={`admin-card ${cliente.ativo === false ? 'inactive' : ''}`} style={{
                        opacity: cliente.ativo === false ? 0.6 : 1,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <div>
                            <h3 style={{ margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: 6 }}>
                                <Building2 size={16} color="var(--accent)" />
                                {cliente.nome}
                                {cliente.ativo === false && <span className="badge-inactive" style={{ fontSize: 10, padding: '2px 6px', background: 'var(--danger)', color: 'white', borderRadius: 4, marginLeft: 8 }}>Inativo</span>}
                            </h3>
                            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 13 }}>
                                Contato: {cliente.contato}
                                {cliente.regiao && (
                                    <span style={{ marginLeft: 12, padding: '2px 8px', borderRadius: 12, backgroundColor: 'var(--bg-hover)', fontSize: 12 }}>
                                        Região: <strong>{cliente.regiao}</strong>
                                    </span>
                                )}
                            </p>
                        </div>
                        <div className="card-actions" style={{ display: 'flex', gap: 8 }}>
                            <button className="btn-icon" onClick={() => handleOpenEdit(cliente)} title="Editar" style={{ background: 'var(--bg-hover)', border: 'none', padding: 8, borderRadius: 6, cursor: 'pointer', color: 'var(--text-primary)' }}>
                                <Edit2 size={16} />
                            </button>
                            <button className="btn-icon" onClick={() => handleToggleActive(cliente)} title={cliente.ativo === false ? 'Habilitar' : 'Desabilitar'} style={{ background: 'var(--bg-hover)', border: 'none', padding: 8, borderRadius: 6, cursor: 'pointer', color: cliente.ativo === false ? 'var(--success)' : 'var(--danger)' }}>
                                {cliente.ativo === false ? <Power size={16} /> : <Trash2 size={16} />}
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <ModalForm
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingCliente ? 'Editar Cliente' : 'Novo Cliente'}
            >
                <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div className="form-group">
                        <label>Nome do Laboratório</label>
                        <input
                            type="text"
                            required
                            value={nome}
                            onChange={e => setNome(e.target.value)}
                            style={{ width: '100%', padding: '10px', borderRadius: 6, border: '1px solid var(--border)' }}
                        />
                    </div>
                    <div className="form-group">
                        <label>Telefone / Contato</label>
                        <input
                            type="text"
                            required
                            value={contato}
                            onChange={e => setContato(e.target.value)}
                            style={{ width: '100%', padding: '10px', borderRadius: 6, border: '1px solid var(--border)' }}
                        />
                    </div>
                    <div className="form-group">
                        <label>Endereço</label>
                        <input
                            type="text"
                            value={endereco}
                            onChange={e => setEndereco(e.target.value)}
                            style={{ width: '100%', padding: '10px', borderRadius: 6, border: '1px solid var(--border)' }}
                        />
                    </div>
                    <div className="form-group">
                        <label>Região de Atendimento</label>
                        <select
                            value={regiao}
                            onChange={e => setRegiao(e.target.value as 'Norte' | 'Sul')}
                            style={{ width: '100%', padding: '10px', borderRadius: 6, border: '1px solid var(--border)' }}
                        >
                            <option value="Sul">Sul</option>
                            <option value="Norte">Norte</option>
                        </select>
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
