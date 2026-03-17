import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useNotification } from '../../context/NotificationContext';
import { Users, Search, Plus, Edit2, Trash2, Key, Mail, Loader2 } from 'lucide-react';
import ModalForm from './ModalForm';
import ConfirmModal from './ConfirmModal';
import type { Usuario, Role } from '../../types';

export default function UsuariosPanel() {
    const { 
        usuarios, addUsuario, updateUsuario, deleteUsuarioFisico, 
        chamados, interacoes, resendInvitation, resetPassword 
    } = useApp();
    const { showNotification } = useNotification();
    const [search, setSearch] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUsuario, setEditingUsuario] = useState<Usuario | null>(null);
    const [loadingAction, setLoadingAction] = useState<string | null>(null);

    // Modal de confirmação
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => Promise<void> | void;
        type: 'confirm' | 'danger' | 'warning' | 'info' | 'success';
        confirmLabel?: string;
    }>({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => {},
        type: 'confirm'
    });

    // Form state
    const [nome, setNome] = useState('');
    const [email, setEmail] = useState('');
    const [role, setRole] = useState<Role>('tecnico');

    const filteredUsuarios = usuarios.filter(u =>
        u.nome.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase())
    ).sort((a, b) => a.nome.localeCompare(b.nome));

    const openConfirm = (
        title: string, 
        message: string, 
        onConfirm: () => Promise<void> | void, 
        type: 'confirm' | 'danger' | 'warning' | 'info' | 'success' = 'confirm',
        confirmLabel?: string
    ) => {
        setConfirmModal({
            isOpen: true,
            title,
            message,
            onConfirm,
            type,
            confirmLabel
        });
    };

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
        setLoadingAction('save');
        try {
            if (editingUsuario) {
                await updateUsuario(editingUsuario.id, { nome, email, role });
                showNotification('Usuário atualizado com sucesso!', 'success');
            } else {
                await addUsuario({ nome, email, role });
                showNotification('Usuário cadastrado com sucesso!', 'success');
            }
            setIsModalOpen(false);
        } catch (error: any) {
            showNotification('Erro ao salvar usuário: ' + (error.message || error), 'error');
        } finally {
            setLoadingAction(null);
        }
    };

    const handleToggleActive = async (usuario: Usuario, isChecked: boolean) => {
        if (usuario.email === 'ismalinojr@gmail.com') {
            openConfirm(
                'Ação Bloqueada', 
                'O usuário administrador principal não pode ser alterado ou desabilitado.', 
                () => {}, 
                'warning', 
                'Ok'
            );
            return;
        }

        openConfirm(
            `${isChecked ? 'Habilitar' : 'Desabilitar'} Usuário`,
            `Deseja realmente ${isChecked ? 'habilitar' : 'desabilitar'} o acesso do usuário ${usuario.nome}?`,
            async () => {
                try {
                    await updateUsuario(usuario.id, { ativo: isChecked });
                    showNotification(`Usuário ${isChecked ? 'habilitado' : 'desabilitado'} com sucesso!`, 'success');
                } catch (error: any) {
                    showNotification('Erro ao alterar status do usuário.', 'error');
                }
            },
            isChecked ? 'confirm' : 'warning'
        );
    };

    const handleDelete = async (usuario: Usuario) => {
        if (usuario.email === 'ismalinojr@gmail.com') {
            openConfirm(
                'Ação Bloqueada', 
                'O usuário administrador principal não pode ser excluído.', 
                () => {}, 
                'warning', 
                'Ok'
            );
            return;
        }

        const hasChamados = chamados.some(c => c.tecnicoId === usuario.id);
        const hasInteracoes = interacoes.some(i => i.usuarioId === usuario.id);

        if (hasChamados || hasInteracoes) {
            if (usuario.ativo === false) {
                openConfirm(
                    'Usuário com Histórico',
                    'Este usuário não pode ser excluído fisicamente pois possui chamados ou interações vinculadas ao seu nome.',
                    () => {},
                    'info',
                    'Entendido'
                );
                return;
            }

            openConfirm(
                'Desativar Usuário',
                `Aviso: O usuário "${usuario.nome}" possui histórico no sistema e não pode ser removido permanentemente.\n\nDeseja desativar o acesso dele para preservar o histórico?`,
                async () => {
                    await updateUsuario(usuario.id, { ativo: false });
                    showNotification('Usuário desativado com sucesso.', 'success');
                },
                'warning',
                'Desativar Acesso'
            );
        } else {
            openConfirm(
                'Excluir Usuário',
                `Deseja realmente excluir permanentemente o usuário "${usuario.nome}"? Esta ação não pode ser desfeita.`,
                async () => {
                    await deleteUsuarioFisico(usuario.id);
                    showNotification('Usuário excluído permanentemente.', 'success');
                },
                'danger',
                'Excluir Agora'
            );
        }
    };

    const handleResetPassword = (usuario: Usuario) => {
        openConfirm(
            'Redefinir Senha',
            `Deseja enviar um e-mail de redefinição de senha para ${usuario.nome} (${usuario.email})?`,
            async () => {
                setLoadingAction(`reset-${usuario.id}`);
                try {
                    await resetPassword(usuario.email);
                    showNotification(`✅ E-mail de redefinição enviado com sucesso para ${usuario.email}!`, 'success');
                } catch (error: any) {
                    showNotification('Erro ao enviar e-mail: ' + (error.message || error), 'error');
                } finally {
                    setLoadingAction(null);
                }
            },
            'confirm',
            'Enviar E-mail'
        );
    };

    const handleResendInvite = async (usuario: Usuario) => {
        openConfirm(
            'Reenviar Convite',
            `Deseja reenviar o e-mail de primeiro acesso para ${usuario.nome} (${usuario.email})?`,
            async () => {
                setLoadingAction(`invite-${usuario.id}`);
                try {
                    const result = await resendInvitation(usuario);
                    if (result.alreadyExists) {
                        showNotification(result.message, 'info');
                    } else {
                        showNotification(`✅ Convite reenviado com sucesso para ${usuario.email}!`, 'success');
                    }
                } catch (error: any) {
                    showNotification('Erro ao reenviar convite: ' + (error.message || error), 'error');
                } finally {
                    setLoadingAction(null);
                }
            }
        );
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

            <div className="compact-list">
                {filteredUsuarios.map(usuario => (
                    <div key={usuario.id} className={`list-item ${usuario.ativo === false ? 'inactive' : ''}`}>
                        <div className="item-main">
                            <div className="item-icon">
                                <Users size={20} />
                            </div>
                            <div className="item-info">
                                <div className="item-title">
                                    {usuario.nome}
                                    {usuario.ativo === false && (
                                        <span className="badge-inactive" style={{ fontSize: 10, padding: '2px 6px', background: 'var(--danger)', color: 'white', borderRadius: 4 }}>
                                            Inativo
                                        </span>
                                    )}
                                </div>
                                <div className="item-sub">
                                    <span className="item-sub-item">
                                        <Mail size={12} /> {usuario.email}
                                    </span>
                                    <span className={`user-role-badge ${usuario.role}`} style={{ fontSize: 10 }}>
                                        {usuario.role}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="item-actions">
                            <label className="item-toggle">
                                <input 
                                    type="checkbox" 
                                    checked={usuario.ativo !== false} 
                                    onChange={(e) => handleToggleActive(usuario, e.target.checked)} 
                                />
                                Ativo
                            </label>
                            <button className="btn-ghost" onClick={() => handleResendInvite(usuario)} title="Reenviar Convite" disabled={loadingAction === `invite-${usuario.id}`} style={{ color: 'var(--accent)' }}>
                                {loadingAction === `invite-${usuario.id}` ? <Loader2 size={16} className="animate-spin" /> : <Mail size={18} />}
                            </button>
                            <button className="btn-ghost" onClick={() => handleResetPassword(usuario)} title="Redefinir Senha" disabled={loadingAction === `reset-${usuario.id}`} style={{ color: 'var(--warning, #f97316)' }}>
                                {loadingAction === `reset-${usuario.id}` ? <Loader2 size={16} className="animate-spin" /> : <Key size={18} />}
                            </button>
                            <button className="btn-ghost" onClick={() => handleOpenEdit(usuario)} title="Editar">
                                <Edit2 size={18} />
                            </button>
                            <button className="btn-ghost" onClick={() => handleDelete(usuario)} title="Excluir Usuário" style={{ color: 'var(--danger)' }}>
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </div>
                ))}

                {filteredUsuarios.length === 0 && (
                    <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                        Nenhum usuário encontrado.
                    </div>
                )}
            </div>

            <ConfirmModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                onConfirm={confirmModal.onConfirm}
                title={confirmModal.title}
                message={confirmModal.message}
                type={confirmModal.type}
                confirmLabel={confirmModal.confirmLabel}
            />

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

                    {!editingUsuario && (
                        <div style={{ fontSize: '13px', color: 'var(--text-secondary)', backgroundColor: 'rgba(137, 180, 250, 0.1)', padding: '10px', borderRadius: '6px', borderLeft: '3px solid #89b4fa' }}>
                            <p style={{ margin: 0 }}>ℹ️ Um e-mail de convite será enviado para que o usuário defina sua senha no primeiro acesso.</p>
                        </div>
                    )}

                    <div className="form-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 16 }}>
                        <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancelar</button>
                        <button type="submit" className="btn btn-primary" disabled={loadingAction === 'save'}>
                            {loadingAction === 'save' ? <Loader2 size={16} className="animate-spin" /> : 'Salvar'}
                        </button>
                    </div>
                </form>
            </ModalForm>
        </div>
    );
}
