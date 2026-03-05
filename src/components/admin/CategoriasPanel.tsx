import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Tags, Search, Plus, Edit2, Trash2, Power } from 'lucide-react';
import ModalForm from './ModalForm';
import type { CategoriaChamado } from '../../types';

export default function CategoriasPanel() {
    const { categoriasChamado, addCategoria, updateCategoria, deleteCategoria } = useApp();
    const [search, setSearch] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCategoria, setEditingCategoria] = useState<CategoriaChamado | null>(null);

    // Form state
    const [nome, setNome] = useState('');
    const [descricao, setDescricao] = useState('');

    const filteredCategorias = categoriasChamado.filter(c =>
        c.nome.toLowerCase().includes(search.toLowerCase()) ||
        (c.descricao && c.descricao.toLowerCase().includes(search.toLowerCase()))
    );

    const handleOpenNew = () => {
        setEditingCategoria(null);
        setNome('');
        setDescricao('');
        setIsModalOpen(true);
    };

    const handleOpenEdit = (categoria: CategoriaChamado) => {
        setEditingCategoria(categoria);
        setNome(categoria.nome);
        setDescricao(categoria.descricao || '');
        setIsModalOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (editingCategoria) {
            await updateCategoria(editingCategoria.id, { nome, descricao });
        } else {
            await addCategoria({ nome, descricao });
        }
        setIsModalOpen(false);
    };

    const handleToggleActive = async (categoria: CategoriaChamado) => {
        if (confirm(`Deseja realmente ${categoria.ativo === false ? 'habilitar' : 'desabilitar'} a categoria ${categoria.nome}?`)) {
            if (categoria.ativo === false) {
                await updateCategoria(categoria.id, { ativo: true });
            } else {
                await deleteCategoria(categoria.id);
            }
        }
    };

    return (
        <div className="admin-panel area-categorias">
            <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div className="search-bar" style={{ position: 'relative', width: '300px' }}>
                    <Search size={18} style={{ position: 'absolute', left: 12, top: 10, color: 'var(--text-secondary)' }} />
                    <input
                        type="text"
                        placeholder="Buscar categoria..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{ width: '100%', padding: '10px 10px 10px 36px', borderRadius: 8, border: '1px solid var(--border)' }}
                    />
                </div>
                <button className="btn btn-primary" onClick={handleOpenNew}>
                    <Plus size={16} style={{ marginRight: 6 }} />
                    Nova Categoria
                </button>
            </div>

            <div className="admin-list grid-list">
                {filteredCategorias.map(categoria => (
                    <div key={categoria.id} className={`admin-card ${categoria.ativo === false ? 'inactive' : ''}`} style={{
                        opacity: categoria.ativo === false ? 0.6 : 1,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <div>
                            <h3 style={{ margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: 6 }}>
                                <Tags size={16} color="var(--accent)" />
                                {categoria.nome}
                                {categoria.ativo === false && <span className="badge-inactive" style={{ fontSize: 10, padding: '2px 6px', background: 'var(--danger)', color: 'white', borderRadius: 4, marginLeft: 8 }}>Inativa</span>}
                            </h3>
                            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 13 }}>
                                {categoria.descricao || 'Sem descrição'}
                            </p>
                        </div>
                        <div className="card-actions" style={{ display: 'flex', gap: 8 }}>
                            <button className="btn-icon" onClick={() => handleOpenEdit(categoria)} title="Editar" style={{ background: 'var(--bg-hover)', border: 'none', padding: 8, borderRadius: 6, cursor: 'pointer', color: 'var(--text-primary)' }}>
                                <Edit2 size={16} />
                            </button>
                            <button className="btn-icon" onClick={() => handleToggleActive(categoria)} title={categoria.ativo === false ? 'Habilitar' : 'Desabilitar'} style={{ background: 'var(--bg-hover)', border: 'none', padding: 8, borderRadius: 6, cursor: 'pointer', color: categoria.ativo === false ? 'var(--success)' : 'var(--danger)' }}>
                                {categoria.ativo === false ? <Power size={16} /> : <Trash2 size={16} />}
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <ModalForm
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingCategoria ? 'Editar Categoria' : 'Nova Categoria'}
            >
                <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div className="form-group">
                        <label>Nome da Categoria</label>
                        <input
                            type="text"
                            required
                            value={nome}
                            onChange={e => setNome(e.target.value)}
                            style={{ width: '100%', padding: '10px', borderRadius: 6, border: '1px solid var(--border)' }}
                        />
                    </div>
                    <div className="form-group">
                        <label>Descrição Opcional</label>
                        <textarea
                            rows={3}
                            value={descricao}
                            onChange={e => setDescricao(e.target.value)}
                            style={{ width: '100%', padding: '10px', borderRadius: 6, border: '1px solid var(--border)', resize: 'vertical' }}
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
