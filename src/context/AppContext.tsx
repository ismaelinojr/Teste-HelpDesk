import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Chamado, Usuario, Cliente, Interacao, StatusChamado, ContatoCliente, CategoriaChamado, StatusConfig, SLAConfig } from '../types';
import * as ticketService from '../services/ticketService';
import * as clientService from '../services/clientService';
import * as userService from '../services/userService';
import * as categoryService from '../services/categoryService';
import * as statusService from '../services/statusService';
import * as slaService from '../services/slaService';
import * as authService from '../services/authService';

interface AppState {
    chamados: Chamado[];
    usuarios: Usuario[];
    clientes: Cliente[];
    contatosClientes: ContatoCliente[];
    categoriasChamado: CategoriaChamado[];
    interacoes: Interacao[];
    statusConfigs: StatusConfig[];
    slaConfigs: SLAConfig[];
    currentUser: Usuario | null;
    isAuthenticated: boolean;
    loading: boolean;
}

interface AppContextType extends AppState {
    interacoes: Interacao[];
    switchUser: (userId: string) => void;
    login: (email: string, password: string) => Promise<boolean>;
    logout: () => void | Promise<void>;
    assumirChamado: (chamadoId: string) => Promise<void>;
    atualizarStatus: (chamadoId: string, status: StatusChamado) => Promise<void>;
    encerrarChamado: (chamadoId: string, solucao: string) => Promise<void>;
    adicionarNota: (chamadoId: string, mensagem: string) => Promise<Interacao>;
    getInteracoes: (chamadoId: string) => Promise<Interacao[]>;
    criarChamado: (data: { clienteId: string; contatoNome?: string; categoriaId: string; titulo: string; descricao: string; prioridade: string }) => Promise<void>;
    refreshChamados: () => Promise<void>;
    getClienteNome: (id: string) => string;
    getTecnicoNome: (id: string | null) => string;
    getCategoriaNome: (id: string) => string;
    getStatusLabel: (id: string) => string;
    getStatusConfig: (id: string) => StatusConfig | undefined;
    getSLAConfig: (id: string) => SLAConfig | undefined;
    getSLALabel: (id: string) => string;
    getChamadosFiltrados: () => Chamado[];
    getContatosByCliente: (clienteId: string) => Promise<ContatoCliente[]>;
    addContato: (clienteId: string, nome: string, telefone?: string, email?: string, funcao?: string) => Promise<ContatoCliente>;
    updateContato: (id: string, data: Partial<ContatoCliente>) => Promise<ContatoCliente>;
    deleteContato: (id: string) => Promise<void>;
    deleteContatoFisico: (id: string) => Promise<void>;

    addCliente: (cliente: Omit<Cliente, 'id'>) => Promise<Cliente>;
    updateCliente: (id: string, data: Partial<Cliente>) => Promise<Cliente>;
    deleteCliente: (id: string) => Promise<void>;
    deleteClienteFisico: (id: string) => Promise<void>;

    addUsuario: (usuario: Omit<Usuario, 'id'>) => Promise<Usuario>;
    resendInvitation: (usuario: Usuario) => Promise<void>;
    updateUsuario: (id: string, data: Partial<Usuario>) => Promise<Usuario>;
    deleteUsuario: (id: string) => Promise<void>;
    deleteUsuarioFisico: (id: string) => Promise<void>;

    addCategoria: (categoria: Omit<CategoriaChamado, 'id'>) => Promise<CategoriaChamado>;
    updateCategoria: (id: string, data: Partial<CategoriaChamado>) => Promise<CategoriaChamado>;
    deleteCategoria: (id: string) => Promise<void>;
    deleteCategoriaFisico: (id: string) => Promise<void>;

    addStatus: (status: Omit<StatusConfig, 'id'>) => Promise<StatusConfig>;
    updateStatus: (id: string, data: Partial<StatusConfig>) => Promise<StatusConfig>;
    deleteStatus: (id: string) => Promise<void>;

    addSLA: (sla: Omit<SLAConfig, 'id'>) => Promise<SLAConfig>;
    updateSLA: (id: string, data: Partial<SLAConfig>) => Promise<SLAConfig>;
    deleteSLA: (id: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
    const [state, setState] = useState<AppState>({
        chamados: [],
        usuarios: [],
        clientes: [],
        contatosClientes: [],
        categoriasChamado: [],
        interacoes: [],
        statusConfigs: [],
        slaConfigs: [],
        currentUser: null,
        isAuthenticated: false,
        loading: true,
    });

    // Carrega todos os dados do Supabase
    const loadData = useCallback(async () => {
        try {
            const pChamados = ticketService.getTickets();
            const pUsuarios = userService.getUsers();
            const pClientes = clientService.getClients();
            const pCategorias = categoryService.getCategorias();
            const pStatuses = statusService.getStatuses();
            const pSlas = slaService.getSLAs();
            const pContatos = clientService.getAllContatos();
            const pInteracoes = ticketService.getAllInteracoes();

            const [chamados, usuarios, clientes, categorias, statuses, slas, contatos, allInteracoes] = await Promise.all([
                pChamados, pUsuarios, pClientes, pCategorias, pStatuses, pSlas, pContatos, pInteracoes
            ]);
            setState(prev => ({
                ...prev,
                chamados,
                usuarios,
                clientes,
                contatosClientes: contatos,
                categoriasChamado: categorias,
                interacoes: allInteracoes,
                statusConfigs: statuses,
                slaConfigs: slas,
                loading: false,
            }));
        } catch (err) {
            console.error('Erro ao carregar dados:', err);
            setState(prev => ({ ...prev, loading: false }));
        }
    }, []);

    // Listener de autenticação do Supabase
    useEffect(() => {
        let isMounted = true;

        // Verificar sessão existente ao montar
        const initAuth = async () => {
            try {
                const session = await authService.getCurrentSession();
                if (session?.user && isMounted) {
                    const usuario = await userService.getUserByAuthId(session.user.id);
                    if (usuario) {
                        setState(prev => ({
                            ...prev,
                            currentUser: usuario,
                            isAuthenticated: true,
                        }));
                    }
                }
            } catch (err) {
                console.error('Erro ao verificar sessão:', err);
            }
            if (isMounted) {
                // Carrega dados após verificar auth
                loadData();
            }
        };

        initAuth();

        // Escutar mudanças no estado de autenticação
        const subscription = authService.onAuthStateChange(async (event, session) => {
            if (!isMounted) return;

            if (event === 'SIGNED_OUT') {
                setState(prev => ({
                    ...prev,
                    currentUser: null,
                    isAuthenticated: false,
                }));
            } else if (event === 'SIGNED_IN' && session?.user) {
                const usuario = await userService.getUserByAuthId(session.user.id);
                if (usuario && isMounted) {
                    setState(prev => ({
                        ...prev,
                        currentUser: usuario,
                        isAuthenticated: true,
                    }));
                    loadData();
                }
            }
        });

        return () => {
            isMounted = false;
            subscription.unsubscribe();
        };
    }, [loadData]);

    const switchUser = useCallback((userId: string) => {
        const user = state.usuarios.find(u => u.id === userId);
        if (user) {
            setState(prev => ({ ...prev, currentUser: user }));
        }
    }, [state.usuarios]);

    const login = useCallback(async (email: string, password: string) => {
        try {
            const { user } = await authService.signIn(email, password);
            if (user) {
                const usuario = await userService.getUserByAuthId(user.id);
                if (usuario) {
                    setState(prev => ({ ...prev, currentUser: usuario, isAuthenticated: true }));
                    // Recarregar dados após login
                    loadData();
                    return true;
                }
            }
            return false;
        } catch (err) {
            console.error('Erro no login:', err);
            return false;
        }
    }, [loadData]);

    const logout = useCallback(async () => {
        try {
            await authService.signOut();
        } catch (err) {
            console.error('Erro no logout:', err);
        }
        setState(prev => ({ ...prev, currentUser: null, isAuthenticated: false }));
    }, []);

    const refreshChamados = useCallback(async () => {
        const chamados = await ticketService.getTickets();
        setState(prev => ({ ...prev, chamados }));
    }, []);

    const assumirChamado = useCallback(async (chamadoId: string) => {
        if (!state.currentUser) return;
        await ticketService.assignTechnician(chamadoId, state.currentUser.id);
        await ticketService.addInteracao(chamadoId, state.currentUser.id, `${state.currentUser.nome} assumiu o chamado.`);
        await refreshChamados();
    }, [state.currentUser, refreshChamados]);

    const atualizarStatus = useCallback(async (chamadoId: string, status: StatusChamado) => {
        if (!state.currentUser) return;
        await ticketService.updateTicketStatus(chamadoId, status);
        const statusConfig = state.statusConfigs.find(s => s.id === status);
        const label = statusConfig?.nome || status;
        await ticketService.addInteracao(chamadoId, state.currentUser.id, `Status alterado para: ${label}`);
        await refreshChamados();
    }, [state.currentUser, state.statusConfigs, refreshChamados]);

    const encerrarChamado = useCallback(async (chamadoId: string, solucao: string) => {
        if (!state.currentUser) return;
        await ticketService.closeTicket(chamadoId, solucao);
        await ticketService.addInteracao(chamadoId, state.currentUser.id, `Chamado encerrado. Solução: ${solucao}`);
        await refreshChamados();
    }, [state.currentUser, refreshChamados]);

    const adicionarNota = useCallback(async (chamadoId: string, mensagem: string) => {
        if (!state.currentUser) throw new Error('Usuário não autenticado');
        const interacao = await ticketService.addInteracao(chamadoId, state.currentUser.id, mensagem);
        return interacao;
    }, [state.currentUser]);

    const getInteracoes = useCallback(async (chamadoId: string) => {
        return ticketService.getInteracoes(chamadoId);
    }, []);

    const criarChamado = useCallback(async (data: { clienteId: string; contatoNome?: string; categoriaId: string; titulo: string; descricao: string; prioridade: string }) => {
        const slaConfig = state.slaConfigs.find(s => s.id === data.prioridade);
        const slaHoras = slaConfig?.horas || 24;
        await ticketService.createTicket({
            ...data,
            status: 'aberto',
            tecnicoId: null,
            slaHoras,
        });
        await refreshChamados();
    }, [state.slaConfigs, refreshChamados]);

    const getClienteNome = useCallback((id: string) => {
        return state.clientes.find(c => c.id === id)?.nome || 'Desconhecido';
    }, [state.clientes]);

    const getTecnicoNome = useCallback((id: string | null) => {
        if (!id) return 'Não atribuído';
        return state.usuarios.find(u => u.id === id)?.nome || 'Desconhecido';
    }, [state.usuarios]);

    const getCategoriaNome = useCallback((id: string) => {
        return state.categoriasChamado.find(c => c.id === id)?.nome || 'Desconhecido';
    }, [state.categoriasChamado]);

    const getStatusLabel = useCallback((id: string) => {
        return state.statusConfigs.find(s => s.id === id)?.nome || id;
    }, [state.statusConfigs]);

    const getStatusConfig = useCallback((id: string) => {
        return state.statusConfigs.find(s => s.id === id);
    }, [state.statusConfigs]);

    const getSLAConfig = useCallback((id: string) => {
        return state.slaConfigs.find(s => s.id === id);
    }, [state.slaConfigs]);

    const getSLALabel = useCallback((id: string) => {
        return state.slaConfigs.find(s => s.id === id)?.nome || id;
    }, [state.slaConfigs]);

    const getChamadosFiltrados = useCallback(() => {
        if (!state.currentUser) return [];
        if (state.currentUser.role === 'admin') return state.chamados;
        return state.chamados.filter(c => c.tecnicoId === state.currentUser!.id);
    }, [state.chamados, state.currentUser]);

    const getContatosByCliente = useCallback(async (clienteId: string) => {
        return await clientService.getContatosByCliente(clienteId);
    }, []);

    const addContato = useCallback(async (clienteId: string, nome: string, telefone?: string, email?: string, funcao?: string) => {
        const novo = await clientService.addContato(clienteId, nome, telefone, email, funcao);
        setState(prev => ({ ...prev, contatosClientes: [...prev.contatosClientes, novo] }));
        return novo;
    }, []);

    const updateContato = useCallback(async (id: string, data: Partial<ContatoCliente>) => {
        const atualizado = await clientService.updateContato(id, data);
        setState(prev => ({
            ...prev,
            contatosClientes: prev.contatosClientes.map(c => c.id === id ? atualizado : c)
        }));
        return atualizado;
    }, []);

    const deleteContato = useCallback(async (id: string) => {
        await clientService.deleteContato(id);
        setState(prev => ({
            ...prev,
            contatosClientes: prev.contatosClientes.map(c => c.id === id ? { ...c, ativo: false } : c)
        }));
    }, []);

    const deleteContatoFisico = useCallback(async (id: string) => {
        await clientService.deleteContatoFisico(id);
        setState(prev => ({
            ...prev,
            contatosClientes: prev.contatosClientes.filter(c => c.id !== id)
        }));
    }, []);

    const addCliente = useCallback(async (cliente: Omit<Cliente, 'id'>) => {
        const novo = await clientService.addCliente(cliente);
        setState(prev => ({ ...prev, clientes: [...prev.clientes, novo] }));
        return novo;
    }, []);

    const updateCliente = useCallback(async (id: string, data: Partial<Cliente>) => {
        const atualizado = await clientService.updateCliente(id, data);
        setState(prev => ({
            ...prev,
            clientes: prev.clientes.map(c => c.id === id ? atualizado : c)
        }));
        return atualizado;
    }, []);

    const deleteCliente = useCallback(async (id: string) => {
        await clientService.deleteCliente(id);
        setState(prev => ({
            ...prev,
            clientes: prev.clientes.map(c => c.id === id ? { ...c, ativo: false } : c)
        }));
    }, []);

    const deleteClienteFisico = useCallback(async (id: string) => {
        await clientService.deleteClienteFisico(id);
        setState(prev => ({
            ...prev,
            clientes: prev.clientes.filter(c => c.id !== id)
        }));
    }, []);

    const addUsuario = useCallback(async (usuario: Omit<Usuario, 'id'>) => {
        // 1. Enviar convite via Edge Function
        const inviteResult = await authService.inviteUser(usuario.email, usuario.nome, usuario.role);
        
        // 2. Com o auth_id retornado, salvar no banco de dados
        const novo = await userService.addUsuario({
            ...usuario,
            auth_id: inviteResult.authId
        } as any);

        setState(prev => ({ ...prev, usuarios: [...prev.usuarios, novo] }));
        return novo;
    }, []);

    const resendInvitation = useCallback(async (usuario: Usuario) => {
        // Enviar convite via Edge Function
        const inviteResult = await authService.inviteUser(usuario.email, usuario.nome, usuario.role);
        
        // Se o usuário não tinha auth_id ou se o auth_id mudou (raro), atualizar no banco
        if (inviteResult.authId && usuario.auth_id !== inviteResult.authId) {
            await userService.updateUsuario(usuario.id, { auth_id: inviteResult.authId } as any);
            setState(prev => ({
                ...prev,
                usuarios: prev.usuarios.map(u => u.id === usuario.id ? { ...u, auth_id: inviteResult.authId } : u)
            }));
        }
    }, []);

    const updateUsuario = useCallback(async (id: string, data: Partial<Usuario>) => {
        const atualizado = await userService.updateUsuario(id, data);
        setState(prev => ({
            ...prev,
            usuarios: prev.usuarios.map(u => u.id === id ? atualizado : u)
        }));
        return atualizado;
    }, []);

    const deleteUsuario = useCallback(async (id: string) => {
        await userService.deleteUsuario(id);
        setState(prev => ({
            ...prev,
            usuarios: prev.usuarios.map(u => u.id === id ? { ...u, ativo: false } : u)
        }));
    }, []);

    const deleteUsuarioFisico = useCallback(async (id: string) => {
        await userService.deleteUsuarioFisico(id);
        setState(prev => ({
            ...prev,
            usuarios: prev.usuarios.filter(u => u.id !== id)
        }));
    }, []);

    const addCategoria = useCallback(async (categoria: Omit<CategoriaChamado, 'id'>) => {
        const nova = await categoryService.addCategoria(categoria);
        setState(prev => ({ ...prev, categoriasChamado: [...prev.categoriasChamado, nova] }));
        return nova;
    }, []);

    const updateCategoria = useCallback(async (id: string, data: Partial<CategoriaChamado>) => {
        const atualizada = await categoryService.updateCategoria(id, data);
        setState(prev => ({
            ...prev,
            categoriasChamado: prev.categoriasChamado.map(c => c.id === id ? atualizada : c)
        }));
        return atualizada;
    }, []);

    const deleteCategoria = useCallback(async (id: string) => {
        await categoryService.deleteCategoria(id);
        setState(prev => ({
            ...prev,
            categoriasChamado: prev.categoriasChamado.map(c => c.id === id ? { ...c, ativo: false } : c)
        }));
    }, []);

    const deleteCategoriaFisico = useCallback(async (id: string) => {
        await categoryService.deleteCategoriaFisico(id);
        setState(prev => ({
            ...prev,
            categoriasChamado: prev.categoriasChamado.filter(c => c.id !== id)
        }));
    }, []);

    // ===== STATUS CRUD =====
    const addStatus = useCallback(async (status: Omit<StatusConfig, 'id'>) => {
        const novo = await statusService.addStatus(status);
        setState(prev => ({ ...prev, statusConfigs: [...prev.statusConfigs, novo] }));
        return novo;
    }, []);

    const updateStatus = useCallback(async (id: string, data: Partial<StatusConfig>) => {
        const atualizado = await statusService.updateStatus(id, data);
        setState(prev => ({
            ...prev,
            statusConfigs: prev.statusConfigs.map(s => s.id === id ? atualizado : s)
        }));
        return atualizado;
    }, []);

    const deleteStatus = useCallback(async (id: string) => {
        await statusService.deleteStatus(id);
        setState(prev => ({
            ...prev,
            statusConfigs: prev.statusConfigs.filter(s => s.id !== id)
        }));
    }, []);

    // ===== SLA CRUD =====
    const addSLA = useCallback(async (sla: Omit<SLAConfig, 'id'>) => {
        const novo = await slaService.addSLA(sla);
        setState(prev => ({ ...prev, slaConfigs: [...prev.slaConfigs, novo] }));
        return novo;
    }, []);

    const updateSLA = useCallback(async (id: string, data: Partial<SLAConfig>) => {
        const atualizado = await slaService.updateSLA(id, data);
        setState(prev => ({
            ...prev,
            slaConfigs: prev.slaConfigs.map(s => s.id === id ? atualizado : s)
        }));
        return atualizado;
    }, []);

    const deleteSLA = useCallback(async (id: string) => {
        await slaService.deleteSLA(id);
        setState(prev => ({
            ...prev,
            slaConfigs: prev.slaConfigs.filter(s => s.id !== id)
        }));
    }, []);

    return (
        <AppContext.Provider value={{
            ...state,
            switchUser,
            login,
            logout,
            assumirChamado,
            atualizarStatus,
            encerrarChamado,
            adicionarNota,
            getInteracoes,
            criarChamado,
            refreshChamados,
            getClienteNome,
            getTecnicoNome,
            getCategoriaNome,
            getStatusLabel,
            getStatusConfig,
            getSLAConfig,
            getSLALabel,
            getChamadosFiltrados,
            getContatosByCliente,
            addContato,
            updateContato,
            deleteContato,
            deleteContatoFisico,
            addCliente,
            updateCliente,
            deleteCliente,
            deleteClienteFisico,
            addUsuario,
            resendInvitation,
            updateUsuario,
            deleteUsuario,
            deleteUsuarioFisico,
            addCategoria,
            updateCategoria,
            deleteCategoria,
            deleteCategoriaFisico,
            addStatus,
            updateStatus,
            deleteStatus,
            addSLA,
            updateSLA,
            deleteSLA,
        }}>
            {children}
        </AppContext.Provider>
    );
}

export function useApp() {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useApp must be used within an AppProvider');
    }
    return context;
}
