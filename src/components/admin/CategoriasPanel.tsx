import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Tags, Search, Plus, Edit2, Trash2 } from 'lucide-react';
import ModalForm from './ModalForm';
import type { CategoriaChamado } from '../../types';

export default function CategoriasPanel() {
    const { categoriasChamado, addCategoria, updateCategoria, deleteCategoriaFisico, chamados } = useApp();
    const [search, setSearch] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCategoria, setEditingCategoria] = useState<CategoriaChamado | null>(null);

    // Form state
    const [nome, setNome] = useState('');
    const [descricao, setDescricao] = useState('');

    const filteredCategorias = categoriasChamado.filter(c =>
        c.nome.toLowerCase().includes(search.toLowerCase()) ||
        (c.descricao && c.descricao.toLowerCase().includes(search.toLowerCase()))
    ).sort((a, b) => a.nome.localeCompare(b.nome));

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

    const handleToggleActive = async (categoria: CategoriaChamado, isChecked: boolean) => {
        if (confirm(`Deseja realmente ${isChecked ? 'habilitar' : 'desabilitar'} a categoria ${categoria.nome}?`)) {
            await updateCategoria(categoria.id, { ativo: isChecked });
        }
    };

    const handleDelete = async (categoria: CategoriaChamado) => {
        const hasChamados = chamados.some(c => c.categoriaId === categoria.id);

        if (hasChamados) {
            if (categoria.ativo === false) {
                alert('Esta categoria já está desativada. Ela possui chamados vinculados e não pode ser excluída fisicamente para preservar o histórico.');
                return;
            }

            if (confirm(`Aviso: A categoria "${categoria.nome}" não pode ser excluída permanentemente porque possui chamados vinculados.\n\nDeseja desativá-la para preservar o histórico?`)) {
                await updateCategoria(categoria.id, { ativo: false });
                alert('Categoria desativada com sucesso.');
            }
        } else {
            if (confirm(`Deseja realmente excluir permanentemente a categoria "${categoria.nome}"? Esta ação não pode ser desfeita.`)) {
                await deleteCategoriaFisico(categoria.id);
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

            <div className="compact-list">
                {filteredCategorias.map(categoria => (
                    <div key={categoria.id} className={`list-item ${categoria.ativo === false ? 'inactive' : ''}`}>
                        <div className="item-main">
                            <div className="item-icon">
                                <Tags size={20} />
                            </div>
                            <div className="item-info">
                                <div className="item-title">
                                    {categoria.nome}
                                    {categoria.ativo === false && (
                                        <span className="badge-inactive" style={{ fontSize: 10, padding: '2px 6px', background: 'var(--danger)', color: 'white', borderRadius: 4 }}>
                                            Inativa
                                        </span>
                                    )}
                                </div>
                                <div className="item-sub">
                                    <span className="item-sub-item">
                                        {categoria.descricao || 'Sem descrição'}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="item-actions">
                            <label className="item-toggle">
                                <input 
                                    type="checkbox" 
                                    checked={categoria.ativo !== false} 
                                    onChange={(e) => handleToggleActive(categoria, e.target.checked)} 
                                />
                                Ativa
                            </label>
                            <button className="btn-ghost" onClick={() => handleOpenEdit(categoria)} title="Editar">
                                <Edit2 size={18} />
                            </button>
                            <button className="btn-ghost" onClick={() => handleDelete(categoria)} title="Excluir Categoria" style={{ color: 'var(--danger)' }}>
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </div>
                ))}

                {filteredCategorias.length === 0 && (
                    <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                        Nenhuma categoria encontrada.
                    </div>
                )}
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
