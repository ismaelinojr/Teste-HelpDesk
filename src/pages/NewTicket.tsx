import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import type { Prioridade, ContatoCliente } from '../types';
import { ArrowLeft, Save } from 'lucide-react';

export default function NewTicket() {
    const { clientes, criarChamado, getContatosByCliente, addContato, categoriasChamado, slaConfigs } = useApp();
    const navigate = useNavigate();

    const [clienteId, setClienteId] = useState('');
    const [contatos, setContatos] = useState<ContatoCliente[]>([]);
    const [contatoId, setContatoId] = useState('');
    const [novoContatoNome, setNovoContatoNome] = useState('');
    const [titulo, setTitulo] = useState('');
    const [descricao, setDescricao] = useState('');
    const [categoriaId, setCategoriaId] = useState('');
    const [prioridade, setPrioridade] = useState<Prioridade>('normal');
    const [saving, setSaving] = useState(false);

    // Load contacts when client is selected
    useEffect(() => {
        if (!clienteId) {
            setContatos([]);
            setContatoId('');
            setNovoContatoNome('');
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
            // Automatically add this new contact to the mock DB for future use
            await addContato(clienteId, contatoNome);
        } else if (contatoId) {
            const selectedContact = contatos.find(c => c.id === contatoId);
            if (selectedContact) contatoNome = selectedContact.nome;
        }

        if (!contatoNome) return; // Force providing a contact

        setSaving(true);
        await criarChamado({ clienteId, contatoNome, categoriaId, titulo: titulo.trim(), descricao: descricao.trim(), prioridade });
        navigate('/');
    };

    return (
        <div>
            <button className="back-link" onClick={() => navigate('/')}>
                <ArrowLeft size={16} /> Voltar ao Dashboard
            </button>

            <div className="new-ticket-form">
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Cliente (Laboratório) *</label>
                        <select value={clienteId} onChange={(e) => {
                            setClienteId(e.target.value);
                            setContatoId('');
                            setNovoContatoNome('');
                        }} required>
                            <option value="">Selecione o laboratório...</option>
                            {clientes.map(c => (
                                <option key={c.id} value={c.id}>{c.nome}</option>
                            ))}
                        </select>
                    </div>

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
                        <div className="form-group slide-down">
                            <label>Nome do novo colaborador *</label>
                            <input
                                type="text"
                                value={novoContatoNome}
                                onChange={(e) => setNovoContatoNome(e.target.value)}
                                placeholder="Digite o nome de quem solicitou..."
                                required
                            />
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
                        <select value={categoriaId} onChange={(e) => setCategoriaId(e.target.value)} required>
                            <option value="">Selecione o tipo...</option>
                            {categoriasChamado.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.nome}</option>
                            ))}
                        </select>
                    </div>

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
                            disabled={saving || !clienteId || !categoriaId || !contatoId || (contatoId === 'outro' && !novoContatoNome.trim()) || !titulo.trim() || !descricao.trim()}
                        >
                            <Save size={16} />
                            {saving ? 'Salvando...' : 'Criar Chamado'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
