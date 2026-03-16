import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useNotification } from '../context/NotificationContext';
import type { Prioridade, ContatoCliente } from '../types';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';

export default function NewTicket() {
    const { 
        clientes, 
        addCliente, 
        criarChamado, 
        getContatosByCliente, 
        addContato, 
        categoriasChamado, 
        addCategoria, 
        slaConfigs 
    } = useApp();
    const { showNotification } = useNotification();
    const navigate = useNavigate();

    const [clienteId, setClienteId] = useState('');
    const [novoClienteNome, setNovoClienteNome] = useState('');
    const [novoClienteContato, setNovoClienteContato] = useState('');
    const [contatos, setContatos] = useState<ContatoCliente[]>([]);
    const [contatoId, setContatoId] = useState('');

    // Novos campos de contato
    const [novoContatoNome, setNovoContatoNome] = useState('');
    const [novoContatoTelefone, setNovoContatoTelefone] = useState('');

    const [titulo, setTitulo] = useState('');
    const [descricao, setDescricao] = useState('');
    const [categoriaId, setCategoriaId] = useState('');
    const [novaCategoriaNome, setNovaCategoriaNome] = useState('');
    const [prioridade, setPrioridade] = useState<Prioridade>('normal');
    const [saving, setSaving] = useState(false);

    // Load contacts when client is selected
    useEffect(() => {
        if (!clienteId || clienteId === 'outro') {
            setContatos([]);
            if (clienteId === 'outro') {
                setContatoId('outro');
            } else {
                setContatoId('');
            }
            setNovoContatoNome('');
            setNovoContatoTelefone('');
            return;
        }
        getContatosByCliente(clienteId).then(data => setContatos(data));
    }, [clienteId, getContatosByCliente]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!clienteId || !titulo.trim() || !descricao.trim() || !categoriaId) return;

        // Handle contact name
        let contatoNome = undefined;
        if (contatoId === 'outro' && novoContatoNome.trim()) {
            contatoNome = novoContatoNome.trim();
            // Automatically add this new contact to the mock DB for future use with phone
            await addContato(clienteId, contatoNome, novoContatoTelefone.trim() || undefined);
        } else if (contatoId) {
            const selectedContact = contatos.find(c => c.id === contatoId);
            if (selectedContact) contatoNome = selectedContact.nome;
        }

        if (!contatoNome) return; // Force providing a contact

        setSaving(true);
        try {
            let finalClienteId = clienteId;
            let finalCategoriaId = categoriaId;

            // 1. Cadastrar novo laboratório se selecionado
            if (clienteId === 'outro' && novoClienteNome.trim()) {
                const novoCli = await addCliente({ 
                    nome: novoClienteNome.trim(), 
                    contato: novoClienteContato.trim() || 'Não informado',
                    ativo: true 
                });
                finalClienteId = novoCli.id;
            }

            // 2. Cadastrar novo tipo de chamado se selecionado
            if (categoriaId === 'outro' && novaCategoriaNome.trim()) {
                const novaCat = await addCategoria({ 
                    nome: novaCategoriaNome.trim(),
                    ativo: true 
                });
                finalCategoriaId = novaCat.id;
            }

            // 3. Handle contact name
            let contatoNome = undefined;
            if (contatoId === 'outro' && novoContatoNome.trim()) {
                contatoNome = novoContatoNome.trim();
                // Automatically add this new contact to the DB for future use
                await addContato(finalClienteId, contatoNome, novoContatoTelefone.trim() || undefined);
            } else if (contatoId) {
                const selectedContact = contatos.find(c => c.id === contatoId);
                if (selectedContact) contatoNome = selectedContact.nome;
            }

            if (!contatoNome) {
                setSaving(false);
                return;
            }

            await criarChamado({ 
                clienteId: finalClienteId, 
                contatoNome, 
                categoriaId: finalCategoriaId, 
                titulo: titulo.trim(), 
                descricao: descricao.trim(), 
                prioridade 
            });
            showNotification('Chamado aberto com sucesso!', 'success');
            navigate('/');
        } catch (error: any) {
            console.error('Erro ao criar chamado:', error);
            showNotification('Erro ao abrir chamado. Verifique sua conexão.', 'error');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div>
            <button className="back-link" onClick={() => navigate('/')}>
                <ArrowLeft size={16} /> Voltar ao Dashboard
            </button>

            <div className="new-ticket-form">
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Laboratório *</label>
                        <select value={clienteId} onChange={(e) => {
                            setClienteId(e.target.value);
                            if (e.target.value !== 'outro') {
                                setNovoClienteNome('');
                                setNovoClienteContato('');
                            }
                            setContatoId('');
                            setNovoContatoNome('');
                            setNovoContatoTelefone('');
                        }} required>
                            <option value="">Selecione o laboratório...</option>
                            {clientes.map(c => (
                                <option key={c.id} value={c.id}>{c.nome}</option>
                            ))}
                            <option value="outro">+ Outro / Novo Cadastro</option>
                        </select>
                    </div>

                    {clienteId === 'outro' && (
                        <div className="admin-card slide-down" style={{ marginTop: 0, marginBottom: 16, padding: 16, border: '1px solid var(--border)', background: 'var(--bg-card)' }}>
                            <h4 style={{ margin: '0 0 12px 0', fontSize: 13, color: 'var(--text-secondary)' }}>Dados do Novo Laboratório</h4>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label>Nome do Laboratório *</label>
                                    <input
                                        type="text"
                                        value={novoClienteNome}
                                        onChange={(e) => setNovoClienteNome(e.target.value)}
                                        placeholder="Ex: Laboratório Central"
                                        required
                                    />
                                </div>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label>Telefone / Contato</label>
                                    <input
                                        type="text"
                                        value={novoClienteContato}
                                        onChange={(e) => setNovoClienteContato(e.target.value)}
                                        placeholder="(11) 9999-9999"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="form-group">
                        <label>Colaborador / Solicitante *</label>
                        <select
                            value={contatoId}
                            onChange={(e) => setContatoId(e.target.value)}
                            required
                            disabled={!clienteId}
                        >
                            <option value="">Selecione o funcionário...</option>
                            {contatos.map(c => (
                                <option key={c.id} value={c.id}>{c.nome} {c.funcao ? `(${c.funcao})` : ''}</option>
                            ))}
                            <option value="outro">+ Outro / Novo Cadastro</option>
                        </select>
                    </div>

                    {contatoId === 'outro' && (
                        <div className="admin-card slide-down" style={{ marginTop: 0, marginBottom: 16, padding: 16, border: '1px solid var(--border)', background: 'var(--bg-card)' }}>
                            <h4 style={{ margin: '0 0 12px 0', fontSize: 13, color: 'var(--text-secondary)' }}>Dados do Novo Colaborador</h4>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label>Nome Completo *</label>
                                    <input
                                        type="text"
                                        value={novoContatoNome}
                                        onChange={(e) => setNovoContatoNome(e.target.value)}
                                        placeholder="Ex: João da Silva"
                                        required
                                    />
                                </div>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label>Telefone / WhatsApp</label>
                                    <input
                                        type="text"
                                        value={novoContatoTelefone}
                                        onChange={(e) => setNovoContatoTelefone(e.target.value)}
                                        placeholder="(11) 99999-9999"
                                    />
                                </div>
                            </div>
                            <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '12px 0 0 0' }}>
                                Este colaborador será salvo automaticamente na tabela deste laboratório para os próximos chamados.
                            </p>
                        </div>
                    )}

                    <div className="form-group">
                        <label>Título do Chamado *</label>
                        <input
                            type="text"
                            value={titulo}
                            onChange={(e) => setTitulo(e.target.value)}
                            placeholder="Ex: Impressora não imprime"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Descrição detalhada *</label>
                        <textarea
                            value={descricao}
                            onChange={(e) => setDescricao(e.target.value)}
                            placeholder="Descreva o problema em detalhes..."
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Tipo de Chamado *</label>
                        <select value={categoriaId} onChange={(e) => {
                            setCategoriaId(e.target.value);
                            if (e.target.value !== 'outro') {
                                setNovaCategoriaNome('');
                            }
                        }} required>
                            <option value="">Selecione o tipo...</option>
                            {categoriasChamado.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.nome}</option>
                            ))}
                            <option value="outro">+ Outro / Novo Cadastro</option>
                        </select>
                    </div>

                    {categoriaId === 'outro' && (
                        <div className="admin-card slide-down" style={{ marginTop: 0, marginBottom: 16, padding: 16, border: '1px solid var(--border)', background: 'var(--bg-card)' }}>
                            <h4 style={{ margin: '0 0 12px 0', fontSize: 13, color: 'var(--text-secondary)' }}>Novo Tipo de Chamado</h4>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label>Nome do Tipo / Categoria *</label>
                                <input
                                    type="text"
                                    value={novaCategoriaNome}
                                    onChange={(e) => setNovaCategoriaNome(e.target.value)}
                                    placeholder="Ex: Problema com Software"
                                    required
                                />
                            </div>
                        </div>
                    )}

                    <div className="form-group">
                        <label>Prioridade / SLA</label>
                        <select value={prioridade} onChange={(e) => setPrioridade(e.target.value as Prioridade)}>
                            {slaConfigs.map(sla => (
                                <option key={sla.id} value={sla.id}>
                                    {sla.nome} ({sla.horas}h)
                                </option>
                            ))}
                        </select>
                    </div>

                    <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => navigate('/')}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={
                                saving || 
                                !clienteId || 
                                (clienteId === 'outro' && !novoClienteNome.trim()) ||
                                !categoriaId || 
                                (categoriaId === 'outro' && !novaCategoriaNome.trim()) ||
                                !contatoId || 
                                (contatoId === 'outro' && !novoContatoNome.trim()) || 
                                !titulo.trim() || 
                                !descricao.trim()
                            }
                        >
                            {saving ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" style={{ marginRight: 8 }} />
                                    Salvando...
                                </>
                            ) : (
                                <>
                                    <Save size={16} style={{ marginRight: 8 }} />
                                    Criar Chamado
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
