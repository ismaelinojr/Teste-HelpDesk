import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Users, Search, Plus, Edit2, Trash2 } from 'lucide-react';
import ModalForm from './ModalForm';
import type { ContatoCliente } from '../../types';

export default function ColaboradoresPanel() {
    const { clientes, addContato, updateContato, deleteContatoFisico, contatosClientes, chamados } = useApp();
    const [search, setSearch] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingContato, setEditingContato] = useState<ContatoCliente | null>(null);

    // Form state
    const [clienteId, setClienteId] = useState('');
    const [nome, setNome] = useState('');
    const [telefone, setTelefone] = useState('');
    const [funcao, setFuncao] = useState('');

    const filteredContatos = (contatosClientes || []).filter(c => {
        const clienteRecord = clientes.find(cli => cli.id === c.clienteId);
        const labName = clienteRecord ? clienteRecord.nome : '';

        return c.nome.toLowerCase().includes(search.toLowerCase()) ||
            labName.toLowerCase().includes(search.toLowerCase()) ||
            (c.telefone && c.telefone.includes(search)) ||
            (c.funcao && c.funcao.toLowerCase().includes(search.toLowerCase()));
    }).sort((a, b) => a.nome.localeCompare(b.nome));

    const handleOpenNew = () => {
        setEditingContato(null);
        setClienteId('');
        setNome('');
        setTelefone('');
        setFuncao('');
        setIsModalOpen(true);
    };

    const handleOpenEdit = (contato: ContatoCliente) => {
        setEditingContato(contato);
        setClienteId(contato.clienteId);
        setNome(contato.nome);
        setTelefone(contato.telefone || '');
        setFuncao(contato.funcao || '');
        setIsModalOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!clienteId || !nome) {
            alert('Por favor, preencha os campos obrigatórios.');
            return;
        }

        if (editingContato) {
            // Se mudou de cliente ID, a lógica atual do service/mock pode ter problemas.
            // Para garantir, vamos usar apenas update se for no mesmo cliente ID ou aceitar a mudança parcial
            await updateContato(editingContato.id, {
                clienteId,
                nome,
                telefone: telefone || undefined,
                funcao: funcao || undefined
            });
        } else {
            await addContato(clienteId, nome, telefone || undefined, undefined, funcao || undefined);
        }

        setIsModalOpen(false);
    };

    const handleToggleActive = async (contato: ContatoCliente, isChecked: boolean) => {
        if (confirm(`Deseja realmente ${isChecked ? 'habilitar' : 'desabilitar'} o colaborador ${contato.nome}?`)) {
            await updateContato(contato.id, { ativo: isChecked });
        }
    };

    const handleDelete = async (contato: ContatoCliente) => {
        // Verifica se existe chamado aberto com o nome desse colaborador
        const hasChamados = chamados.some(c => c.contatoNome === contato.nome && c.clienteId === contato.clienteId);

        if (hasChamados) {
            if (contato.ativo === false) {
                alert('Este colaborador já está desativado. Ele possui histórico no sistema e não pode ser excluído fisicamente.');
                return;
            }

            if (confirm(`Aviso: O colaborador "${contato.nome}" possui chamados no histórico e não pode ser excluído permanentemente.\n\nDeseja desativá-lo para preservar o histórico?`)) {
                await updateContato(contato.id, { ativo: false });
                alert('Colaborador desativado com sucesso.');
            }
        } else {
             if (confirm(`Deseja realmente excluir permanentemente o colaborador "${contato.nome}"? Esta ação não pode ser desfeita.`)) {
                await deleteContatoFisico(contato.id);
            }
        }
    };

    // Helper para exibir nome do laboratório
    const getLabName = (id: string) => {
        const c = clientes.find(cli => cli.id === id);
        return c ? c.nome : 'Laboratório Desconhecido';
    };

    return (
        <div className="admin-panel area-colaboradores">
            <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div className="search-bar" style={{ position: 'relative', width: '300px' }}>
                    <Search size={18} style={{ position: 'absolute', left: 12, top: 10, color: 'var(--text-secondary)' }} />
                    <input
                        type="text"
                        placeholder="Buscar por nome, lab ou telefone..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{ width: '100%', padding: '10px 10px 10px 36px', borderRadius: 8, border: '1px solid var(--border)' }}
                    />
                </div>
                <button className="btn btn-primary" onClick={handleOpenNew}>
                    <Plus size={16} style={{ marginRight: 6 }} />
                    Novo Colaborador
                </button>
            </div>

            <div className="compact-list">
                {filteredContatos.map(contato => (
                    <div key={contato.id} className={`list-item ${contato.ativo === false ? 'inactive' : ''}`}>
                        <div className="item-main">
                            <div className="item-icon">
                                <Users size={20} />
                            </div>
                            <div className="item-info">
                                <div className="item-title">
                                    {contato.nome}
                                    {contato.ativo === false && (
                                        <span className="badge-inactive" style={{ fontSize: 10, padding: '2px 6px', background: 'var(--danger)', color: 'white', borderRadius: 4 }}>
                                            Inativo
                                        </span>
                                    )}
                                </div>
                                <div className="item-sub">
                                    <span className="item-sub-item">
                                        <strong>Lab:</strong> {getLabName(contato.clienteId)}
                                    </span>
                                    {contato.telefone && (
                                        <span className="item-sub-item">
                                            <strong>Tel:</strong> {contato.telefone}
                                        </span>
                                    )}
                                    {contato.funcao && (
                                        <span className="item-sub-item" style={{ color: 'var(--accent)' }}>
                                            <strong>Função:</strong> {contato.funcao}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="item-actions">
                            <label className="item-toggle">
                                <input 
                                    type="checkbox" 
                                    checked={contato.ativo !== false} 
                                    onChange={(e) => handleToggleActive(contato, e.target.checked)} 
                                />
                                Ativo
                            </label>
                            <button className="btn-ghost" onClick={() => handleOpenEdit(contato)} title="Editar">
                                <Edit2 size={18} />
                            </button>
                            <button className="btn-ghost" onClick={() => handleDelete(contato)} title="Excluir Colaborador" style={{ color: 'var(--danger)' }}>
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </div>
                ))}

                {filteredContatos.length === 0 && (
                    <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                        Nenhum colaborador encontrado.
                    </div>
                )}
            </div>

            <ModalForm
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingContato ? 'Editar Colaborador' : 'Novo Colaborador'}
            >
                <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div className="form-group">
                        <label>Laboratório *</label>
                        <select
                            value={clienteId}
                            onChange={e => setClienteId(e.target.value)}
                            required
                            style={{ width: '100%', padding: '10px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-card)' }}
                        >
                            <option value="">Selecione um Laboratório</option>
                            {clientes.map(c => (
                                <option key={c.id} value={c.id}>{c.nome}</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Nome Completo *</label>
                        <input
                            type="text"
                            required
                            value={nome}
                            onChange={e => setNome(e.target.value)}
                            style={{ width: '100%', padding: '10px', borderRadius: 6, border: '1px solid var(--border)' }}
                        />
                    </div>
                    <div className="form-group">
                        <label>Telefone / WhatsApp</label>
                        <input
                            type="text"
                            value={telefone}
                            onChange={e => setTelefone(e.target.value)}
                            placeholder="(11) 99999-9999"
                            style={{ width: '100%', padding: '10px', borderRadius: 6, border: '1px solid var(--border)' }}
                        />
                    </div>
                    <div className="form-group">
                        <label>Função / Cargo</label>
                        <input
                            type="text"
                            value={funcao}
                            onChange={e => setFuncao(e.target.value)}
                            placeholder="Ex: Recepcionista, Ti, Gerente..."
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
