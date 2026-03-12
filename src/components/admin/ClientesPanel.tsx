import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useNotification } from '../../context/NotificationContext';
import { Building2, Search, Plus, Edit2, Trash2, Loader2 } from 'lucide-react';
import ModalForm from './ModalForm';
import type { Cliente, Chamado, ContatoCliente } from '../../types';

export default function ClientesPanel() {
    const { clientes, addCliente, updateCliente, deleteClienteFisico, chamados, contatosClientes } = useApp();
    const { showNotification } = useNotification();
    const [search, setSearch] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // Form state
    const [nome, setNome] = useState('');
    const [contato, setContato] = useState('');
    const [endereco, setEndereco] = useState('');
    const [regiao, setRegiao] = useState<'Norte' | 'Sul'>('Sul');

    const filteredClientes = clientes.filter((c: Cliente) =>
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
        if (isSaving) return;

        setIsSaving(true);
        try {
            if (editingCliente) {
                await updateCliente(editingCliente.id, { nome, contato, endereco, regiao });
                showNotification('Laboratório atualizado com sucesso!', 'success');
            } else {
                await addCliente({ nome, contato, endereco, regiao });
                showNotification('Laboratório cadastrado com sucesso!', 'success');
            }
            setIsModalOpen(false);
        } catch (error: any) {
            console.error('Erro ao salvar cliente:', error);
            showNotification('Não foi possível salvar os dados. ' + (error.message || 'Falha de comunicação.'), 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleToggleActive = async (cliente: Cliente, isChecked: boolean) => {
        if (confirm(`Deseja realmente ${isChecked ? 'habilitar' : 'desabilitar'} o laboratório ${cliente.nome}?`)) {
            await updateCliente(cliente.id, { ativo: isChecked });
        }
    };

    const handleDelete = async (cliente: Cliente) => {
        const hasChamados = chamados.some((c: Chamado) => c.clienteId === cliente.id);
        const hasColaboradores = contatosClientes.some((c: ContatoCliente) => c.clienteId === cliente.id);

        if (hasChamados) {
            if (cliente.ativo === false) {
                showNotification('Este laboratório já está desativado.', 'warning');
                return;
            }

            if (confirm(`Aviso: O laboratório "${cliente.nome}" não pode ser excluído permanentemente porque possui chamados vinculados.\n\nDeseja desativá-lo para preservar o histórico?`)) {
                await updateCliente(cliente.id, { ativo: false });
                showNotification('Laboratório desativado com sucesso.', 'success');
            }
        } else if (hasColaboradores) {
            showNotification('Remova os colaboradores vinculados primeiro.', 'warning');
        } else {
            if (confirm(`Deseja realmente excluir permanentemente o laboratório "${cliente.nome}"? Esta ação não pode ser desfeita.`)) {
                await deleteClienteFisico(cliente.id);
                showNotification('Laboratório excluído com sucesso.', 'success');
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
                            <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13, color: 'var(--text-secondary)' }}>
                                <input 
                                    type="checkbox" 
                                    checked={cliente.ativo !== false} 
                                    onChange={(e) => handleToggleActive(cliente, e.target.checked)} 
                                    style={{ accentColor: 'var(--accent)', width: 16, height: 16, cursor: 'pointer' }}
                                />
                                Ativo
                            </label>
                            <button className="btn-icon" onClick={() => handleOpenEdit(cliente)} title="Editar" style={{ background: 'var(--bg-hover)', border: 'none', padding: 8, borderRadius: 6, cursor: 'pointer', color: 'var(--text-primary)' }}>
                                <Edit2 size={16} />
                            </button>
                            <button className="btn-icon" onClick={() => handleDelete(cliente)} title="Excluir Laboratório" style={{ background: 'var(--bg-hover)', border: 'none', padding: 8, borderRadius: 6, cursor: 'pointer', color: 'var(--danger)' }}>
                                <Trash2 size={16} />
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
                        <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)} disabled={isSaving}>Cancelar</button>
                        <button type="submit" className="btn btn-primary" disabled={isSaving}>
                            {isSaving ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" style={{ marginRight: 8 }} />
                                    Salvando...
                                </>
                            ) : (
                                'Salvar'
                            )}
                        </button>
                    </div>
                </form>
            </ModalForm>
        </div>
    );
}
