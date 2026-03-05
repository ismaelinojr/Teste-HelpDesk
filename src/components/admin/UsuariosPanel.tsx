import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Users, Search, Plus, Edit2, Trash2, Power } from 'lucide-react';
import ModalForm from './ModalForm';
import type { Usuario, Role } from '../../types';

export default function UsuariosPanel() {
    const { usuarios, addUsuario, updateUsuario, deleteUsuario } = useApp();
    const [search, setSearch] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUsuario, setEditingUsuario] = useState<Usuario | null>(null);

    // Form state
    const [nome, setNome] = useState('');
    const [email, setEmail] = useState('');
    const [role, setRole] = useState<Role>('tecnico');

    const filteredUsuarios = usuarios.filter(u =>
        u.nome.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase())
    );

    const handleOpenNew = () => {
        setEditingUsuario(null);
        setNome('');
        setEmail('');
        setRole('tecnico');
        setIsModalOpen(true);
    };

    const handleOpenEdit = (usuario: Usuario) => {
        setEditingUsuario(usuario);
        setNome(usuario.nome);
        setEmail(usuario.email);
        setRole(usuario.role);
        setIsModalOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (editingUsuario) {
            await updateUsuario(editingUsuario.id, { nome, email, role });
        } else {
            await addUsuario({ nome, email, role });
        }
        setIsModalOpen(false);
    };

    const handleToggleActive = async (usuario: Usuario) => {
        if (confirm(`Deseja realmente ${usuario.ativo === false ? 'habilitar' : 'desabilitar'} o usuário ${usuario.nome}?`)) {
            if (usuario.ativo === false) {
                await updateUsuario(usuario.id, { ativo: true });
            } else {
                await deleteUsuario(usuario.id);
            }
        }
    };

    return (
        <div className="admin-panel area-usuarios">
            <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div className="search-bar" style={{ position: 'relative', width: '300px' }}>
                    <Search size={18} style={{ position: 'absolute', left: 12, top: 10, color: 'var(--text-secondary)' }} />
                    <input
                        type="text"
                        placeholder="Buscar usuário..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{ width: '100%', padding: '10px 10px 10px 36px', borderRadius: 8, border: '1px solid var(--border)' }}
                    />
                </div>
                <button className="btn btn-primary" onClick={handleOpenNew}>
                    <Plus size={16} style={{ marginRight: 6 }} />
                    Novo Usuário
                </button>
            </div>

            <div className="admin-list grid-list">
                {filteredUsuarios.map(usuario => (
                    <div key={usuario.id} className={`admin-card ${usuario.ativo === false ? 'inactive' : ''}`} style={{
                        opacity: usuario.ativo === false ? 0.6 : 1,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <div>
                            <h3 style={{ margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: 6 }}>
                                <Users size={16} color="var(--accent)" />
                                {usuario.nome}
                                {usuario.ativo === false && <span className="badge-inactive" style={{ fontSize: 10, padding: '2px 6px', background: 'var(--danger)', color: 'white', borderRadius: 4, marginLeft: 8 }}>Inativo</span>}
                            </h3>
                            <p style={{ margin: '0 0 4px 0', color: 'var(--text-secondary)', fontSize: 13 }}>
                                Email: {usuario.email}
                            </p>
                            <span className={`user-role-badge ${usuario.role}`} style={{ display: 'inline-flex', fontSize: 11, padding: '2px 8px', borderRadius: 12 }}>
                                {usuario.role}
                            </span>
                        </div>
                        <div className="card-actions" style={{ display: 'flex', gap: 8 }}>
                            <button className="btn-icon" onClick={() => handleOpenEdit(usuario)} title="Editar" style={{ background: 'var(--bg-hover)', border: 'none', padding: 8, borderRadius: 6, cursor: 'pointer', color: 'var(--text-primary)' }}>
                                <Edit2 size={16} />
                            </button>
                            <button className="btn-icon" onClick={() => handleToggleActive(usuario)} title={usuario.ativo === false ? 'Habilitar' : 'Desabilitar'} style={{ background: 'var(--bg-hover)', border: 'none', padding: 8, borderRadius: 6, cursor: 'pointer', color: usuario.ativo === false ? 'var(--success)' : 'var(--danger)' }}>
                                {usuario.ativo === false ? <Power size={16} /> : <Trash2 size={16} />}
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <ModalForm
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingUsuario ? 'Editar Usuário' : 'Novo Usuário'}
            >
                <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div className="form-group">
                        <label>Nome Completo</label>
                        <input
                            type="text"
                            required
                            value={nome}
                            onChange={e => setNome(e.target.value)}
                            style={{ width: '100%', padding: '10px', borderRadius: 6, border: '1px solid var(--border)' }}
                        />
                    </div>
                    <div className="form-group">
                        <label>E-mail Corporativo</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            style={{ width: '100%', padding: '10px', borderRadius: 6, border: '1px solid var(--border)' }}
                        />
                    </div>
                    <div className="form-group">
                        <label>Perfil de Acesso</label>
                        <select
                            value={role}
                            onChange={e => setRole(e.target.value as Role)}
                            style={{ width: '100%', padding: '10px', borderRadius: 6, border: '1px solid var(--border)' }}
                        >
                            <option value="tecnico">Técnico</option>
                            <option value="admin">Administrador</option>
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
