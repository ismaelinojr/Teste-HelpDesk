import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Users, Search, Plus, Edit2, Trash2 } from 'lucide-react';
import ModalForm from './ModalForm';
import type { ContatoCliente } from '../../types';

export default function ColaboradoresPanel() {
    const { clientes, getContatosByCliente, addContato, updateContato, deleteContato } = useApp();
    const [search, setSearch] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingContato, setEditingContato] = useState<ContatoCliente | null>(null);
    const [todosContatos, setTodosContatos] = useState<ContatoCliente[]>([]);
    const [loading, setLoading] = useState(true);

    // Form state
    const [clienteId, setClienteId] = useState('');
    const [nome, setNome] = useState('');
    const [telefone, setTelefone] = useState('');
    const [funcao, setFuncao] = useState('');

    useEffect(() => {
        carregarTodosContatos();
    }, [clientes]);

    const carregarTodosContatos = async () => {
        setLoading(true);
        let allContatos: ContatoCliente[] = [];
        // Carrega contatos de todos os clientes em lote (não ideal para grandes escalas, mas funciona para uso interno/pequeno porte atual)
        for (const cliente of clientes) {
            const contatosDoCliente = await getContatosByCliente(cliente.id);
            allContatos = [...allContatos, ...contatosDoCliente];
        }
        setTodosContatos(allContatos);
        setLoading(false);
    };

    const filteredContatos = todosContatos.filter(c => {
        const clienteRecord = clientes.find(cli => cli.id === c.clienteId);
        const labName = clienteRecord ? clienteRecord.nome : '';

        return c.nome.toLowerCase().includes(search.toLowerCase()) ||
            labName.toLowerCase().includes(search.toLowerCase()) ||
            (c.telefone && c.telefone.includes(search)) ||
            (c.funcao && c.funcao.toLowerCase().includes(search.toLowerCase()));
    });

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
        carregarTodosContatos(); // Atualiza a grid
    };

    const handleDelete = async (contato: ContatoCliente) => {
        if (confirm(`Deseja realmente excluir o colaborador ${contato.nome}? Esta ação pode deixar registros antigos órfãos no histórico de chamados.`)) {
            await deleteContato(contato.id);
            carregarTodosContatos(); // Atualiza a grid
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

            {loading ? (
                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>Carregando colaboradores...</div>
            ) : (
                <div className="admin-list grid-list">
                    {filteredContatos.map(contato => (
                        <div key={contato.id} className={`admin-card ${contato.ativo === false ? 'inactive' : ''}`} style={{
                            opacity: contato.ativo === false ? 0.6 : 1,
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <div>
                                <h3 style={{ margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <Users size={16} color="var(--accent)" />
                                    {contato.nome}
                                </h3>
                                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 13, display: 'flex', flexDirection: 'column', gap: 4 }}>
                                    <span><strong>Lab:</strong> {getLabName(contato.clienteId)}</span>
                                    <span><strong>Tel/WhatsApp:</strong> {contato.telefone || '-'}</span>
                                    <span><strong>Função:</strong> {contato.funcao || '-'}</span>
                                </p>
                            </div>
                            <div className="card-actions" style={{ display: 'flex', gap: 8 }}>
                                <button className="btn-icon" onClick={() => handleOpenEdit(contato)} title="Editar" style={{ background: 'var(--bg-hover)', border: 'none', padding: 8, borderRadius: 6, cursor: 'pointer', color: 'var(--text-primary)' }}>
                                    <Edit2 size={16} />
                                </button>
                                <button className="btn-icon" onClick={() => handleDelete(contato)} title="Excluir Colaborador" style={{ background: 'var(--bg-hover)', border: 'none', padding: 8, borderRadius: 6, cursor: 'pointer', color: 'var(--danger)' }}>
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))}

                    {filteredContatos.length === 0 && (
                        <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', gridColumn: '1 / -1' }}>
                            Nenhum colaborador encontrado.
                        </div>
                    )}
                </div>
            )}

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
