import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { Chamado, Usuario, Cliente, Interacao, StatusChamado, ContatoCliente, CategoriaChamado, StatusConfig, SLAConfig } from '../types';
import * as ticketService from '../services/ticketService';
import * as clientService from '../services/clientService';
import * as userService from '../services/userService';
import * as categoryService from '../services/categoryService';
import * as statusService from '../services/statusService';
import * as slaService from '../services/slaService';
import * as authService from '../services/authService';
import { useNotification } from './NotificationContext';
import { withTimeout } from '../utils/promiseUtils';
import { isSystemZombie, startWarmupPeriod, probeConnection, setColdStarting, isColdStarting } from '../utils/supabaseUtils';

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
    isOnline: boolean;
    isConnectionStable: boolean;
    isReconnecting: boolean;
    isZombie: boolean;
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
    resendInvitation: (usuario: Usuario) => Promise<{ success: boolean; alreadyExists?: boolean; message: string }>;
    resetPassword: (email: string) => Promise<void>;
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
    isReconnecting: boolean;
    reconnect: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
    const { showNotification } = useNotification();
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
        isOnline: navigator.onLine,
        isConnectionStable: true,
        isReconnecting: false,
        isZombie: false,
    });

    // Ref para evitar loadData simultâneo
    const isLoadingDataRef = useRef(false);
    // Ref para bloquear loadData do onAuthStateChange durante reconexão
    const isReconnectingRef = useRef(false);
    // Ref para controle de verificação de foco
    const lastFocusCheckRef = useRef(0);
    const isCheckingFocusRef = useRef(false);
    const lastHiddenTimeRef = useRef(Date.now());
    // Ref para evitar loadData duplicado do onAuthStateChange logo após visibilitychange
    const visibilityReturnCooldownRef = useRef(0);
    // Ref para reconnect estável dentro de timers (evita dependência circular)
    const reconnectRef = useRef<() => Promise<void>>(() => Promise.resolve());

    // Carrega todos os dados do Supabase (com guard contra execução paralela)
    // O parâmetro fromVisibilityReturn indica se foi chamado ao retornar à aba (para ativar probe gateway)
    const loadData = useCallback(async (fromVisibilityReturn: boolean = false) => {
        if (isLoadingDataRef.current) {
            console.log('[AppContext] loadData já em execução, ignorando chamada duplicada.');
            return;
        }
        isLoadingDataRef.current = true;

        // Se vindo de retorno de foco, ativar estado de reconexão e probe gateway
        if (fromVisibilityReturn) {
            setState(prev => ({ ...prev, isReconnecting: true, isConnectionStable: false }));
            isReconnectingRef.current = true;
            setColdStarting(true);

            // Probe gateway: verificar se Supabase responde antes das 8 queries pesadas
            // Backoff agressivo (5s, 10s, 20s) para tolerar cold-start do Supabase Free
            const probeDelays = [5000, 10000, 20000];
            let probeOk = false;
            for (let attempt = 1; attempt <= 3; attempt++) {
                console.log(`[AppContext] Probe de conexão tentativa ${attempt}/3...`);
                probeOk = await probeConnection(12000);
                if (probeOk) {
                    console.log('[AppContext] Probe de conexão OK. Carregando dados...');
                    break;
                }
                if (attempt < 3) {
                    const delay = probeDelays[attempt - 1];
                    console.log(`[AppContext] Probe falhou, aguardando ${delay / 1000}s antes de tentar novamente...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }

            if (!probeOk) {
                console.warn('[AppContext] Probe falhou 3 vezes. Conexão indisponível, agendando auto-retry em 15s.');
                setState(prev => ({ ...prev, isConnectionStable: false, isReconnecting: false }));
                isLoadingDataRef.current = false;
                isReconnectingRef.current = false;
                setColdStarting(false);
                // Auto-retry após 15s — dá tempo ao Supabase Free estabilizar
                setTimeout(() => {
                    if (!isLoadingDataRef.current && !document.hidden) {
                        console.log('[AppContext] Auto-retry pós-falha de probe...');
                        reconnectRef.current();
                    }
                }, 15000);
                return;
            }
        }

        try {
            const pChamados = ticketService.getTickets();
            const pUsuarios = userService.getUsers();
            const pClientes = clientService.getClients();
            const pCategorias = categoryService.getCategorias();
            const pStatuses = statusService.getStatuses();
            const pSlas = slaService.getSLAs();
            const pContatos = clientService.getAllContatos();
            const pInteracoes = ticketService.getAllInteracoes();

            // Envolvemos o Promise.all com um timeout global de 60s (cold-start pode demorar)
            const [chamados, usuarios, clientes, categorias, statuses, slas, contatos, allInteracoes] = await withTimeout(
                Promise.all([
                    pChamados, pUsuarios, pClientes, pCategorias, pStatuses, pSlas, pContatos, pInteracoes
                ]),
                60000,
                'Tempo limite excedido ao carregar dados do sistema. Verifique sua conexão e tente novamente.'
            );

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
                isConnectionStable: true,
                isReconnecting: false,
            }));
        } catch (err: any) {
            console.error('Erro ao carregar dados:', err);
            showNotification(err.message || 'Falha ao carregar dados do sistema. Verifique sua conexão.', 'error');
            setState(prev => ({ ...prev, loading: false, isReconnecting: false, isConnectionStable: false }));
        } finally {
            isLoadingDataRef.current = false;
            isReconnectingRef.current = false;
            setColdStarting(false);
        }
    }, [showNotification]);

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
                    // Evitar loadData duplicado se reconexão ativa ou cooldown ativo
                    if (isReconnectingRef.current || isColdStarting()) {
                        console.log('[AppContext] loadData suprimido (reconexão/cold-start ativo).');
                    } else if (Date.now() < visibilityReturnCooldownRef.current) {
                        console.log('[AppContext] loadData suprimido (cooldown pós-visibilitychange ativo).');
                    } else {
                        loadData();
                    }
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
        // Limpeza local IMEDIATA para destravar a UI
        setState(prev => ({ 
            ...prev, 
            currentUser: null, 
            isAuthenticated: false,
            loading: false // Garante que saia de estados de loading
        }));
        
        try {
            await authService.signOut();
        } catch (err) {
            console.error('Erro ao realizar logout no servidor:', err);
            // Mesmo se falhar, o estado local já foi limpo
        }
    }, []);

    const refreshChamados = useCallback(async () => {
        const chamados = await ticketService.getTickets();
        setState(prev => ({ ...prev, chamados }));
    }, []);

    const reconnect = useCallback(async () => {
        console.log('[AppContext] Forçando reconexão manual...');
        setState(prev => ({ ...prev, isReconnecting: true, isConnectionStable: false }));

        // Probe gateway: verificar se Supabase responde antes de qualquer coisa
        const probeDelays = [2000, 5000, 8000];
        let probeOk = false;
        for (let attempt = 1; attempt <= 3; attempt++) {
            console.log(`[AppContext] Reconexão manual — probe ${attempt}/3...`);
            probeOk = await probeConnection(12000);
            if (probeOk) break;
            if (attempt < 3) {
                const delay = probeDelays[attempt - 1];
                console.log(`[AppContext] Probe manual falhou, aguardando ${delay / 1000}s...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }

        if (!probeOk) {
            console.error('[AppContext] Reconexão manual falhou (probe 3x).');
            setState(prev => ({ ...prev, isConnectionStable: false, isReconnecting: false }));
            showNotification('Servidor indisponível. Tente novamente em alguns segundos.', 'error');
            return;
        }

        // Probe OK — carregar dados
        try {
            // Garantir que isLoadingDataRef permite nova execução
            isLoadingDataRef.current = false;
            await loadData();
            showNotification('Conexão restabelecida com sucesso.', 'success');
        } catch (err) {
            console.error('[AppContext] Falha na reconexão manual:', err);
            showNotification('Não foi possível carregar os dados. Tente novamente.', 'error');
            setState(prev => ({ ...prev, isConnectionStable: false }));
        } finally {
            setState(prev => ({ ...prev, isReconnecting: false }));
        }
    }, [loadData, showNotification]);

    // Manter ref atualizada para uso em timers (auto-retry)
    useEffect(() => { reconnectRef.current = reconnect; }, [reconnect]);

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
        try {
            const novo = await withTimeout(
                clientService.addCliente(cliente),
                15000,
                'Tempo limite excedido ao cadastrar laboratório.'
            );
            setState(prev => ({ ...prev, clientes: [...prev.clientes, novo] }));
            return novo;
        } catch (error: any) {
            console.error('Erro no addCliente:', error);
            showNotification(error.message || 'Erro ao cadastrar laboratório.', 'error');
            throw error;
        }
    }, [showNotification]);

    const updateCliente = useCallback(async (id: string, data: Partial<Cliente>) => {
        try {
            const atualizado = await withTimeout(
                clientService.updateCliente(id, data),
                15000,
                'Tempo limite excedido ao atualizar laboratório. Verifique sua conexão.'
            );
            setState(prev => ({
                ...prev,
                clientes: prev.clientes.map(c => c.id === id ? atualizado : c)
            }));
            return atualizado;
        } catch (error: any) {
            console.error('Erro no updateCliente:', error);
            showNotification(error.message || 'Erro ao atualizar laboratório.', 'error');
            throw error;
        }
    }, [showNotification]);

    const deleteCliente = useCallback(async (id: string) => {
        await clientService.deleteCliente(id);
        setState(prev => ({
            ...prev,
            clientes: prev.clientes.map(c => c.id === id ? { ...c, ativo: false } : c)
        }));
    }, []);

    const deleteClienteFisico = useCallback(async (id: string) => {
        try {
            await withTimeout(
                clientService.deleteClienteFisico(id),
                15000,
                'Tempo limite excedido ao excluir laboratório.'
            );
            setState(prev => ({
                ...prev,
                clientes: prev.clientes.filter(c => c.id !== id)
            }));
        } catch (error: any) {
            console.error('Erro no deleteClienteFisico:', error);
            showNotification(error.message || 'Erro ao excluir laboratório.', 'error');
            throw error;
        }
    }, [showNotification]);

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
        const result = await authService.inviteUser(usuario.email, usuario.nome, usuario.role);
        
        // Se o usuário não tinha auth_id ou se o auth_id mudou (raro), atualizar no banco
        if (result.authId && usuario.auth_id !== result.authId) {
            await userService.updateUsuario(usuario.id, { auth_id: result.authId } as any);
            setState(prev => ({
                ...prev,
                usuarios: prev.usuarios.map(u => u.id === usuario.id ? { ...u, auth_id: result.authId } : u)
            }));
        }
        return result;
    }, []);

    const resetPassword = useCallback(async (email: string) => {
        await authService.resetPassword(email);
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

    // Monitoramento de conexão Online/Offline
    useEffect(() => {
        const handleOnline = () => {
            console.log('[AppContext] Conexão restabelecida.');
            setState(prev => ({ ...prev, isOnline: true }));
            showNotification('Conexão restabelecida. Sincronizando dados...', 'success');
            loadData();
        };
        const handleOffline = () => {
            console.warn('[AppContext] Conexão perdida.');
            setState(prev => ({ ...prev, isOnline: false }));
            showNotification('Você está offline. Algumas funções podem não estar disponíveis.', 'warning');
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [loadData, showNotification]);

    // Monitoramento de Estado Zumbi (Falhas consecutivas)
    useEffect(() => {
        const interval = setInterval(() => {
            const zombieDetected = isSystemZombie();
            if (zombieDetected !== state.isZombie) {
                console.warn(`[AppContext] Mudança no estado Zumbi: ${zombieDetected}`);
                setState(prev => ({ ...prev, isZombie: zombieDetected }));
                
                if (zombieDetected) {
                    showNotification('Detectamos instabilidade persistente na conexão. Algumas funções podem estar suspensas.', 'error');
                }
            }
        }, 3000); // Check a cada 3s
        
        return () => clearInterval(interval);
    }, [state.isZombie, showNotification]);

    // Auto-refresh: Recarregar dados automaticamente a cada 5 minutos (para monitoramento)
    useEffect(() => {
        const interval = setInterval(() => {
            // Suprimir auto-refresh durante reconexão ou cold-start
            if (state.isAuthenticated && !state.loading && state.isOnline && !document.hidden
                && !isReconnectingRef.current && !isColdStarting() && !isLoadingDataRef.current) {
                console.log('[AppContext] Auto-refresh de dados acionado...');
                loadData();
            }
        }, 5 * 60 * 1000); // 5 minutos
        
        return () => clearInterval(interval);
    }, [state.isAuthenticated, state.loading, state.isOnline, loadData]);

    // Verificação ao retomar foco: Usa visibilitychange (mais confiável que focus)
    useEffect(() => {
        const DEBOUNCE_MS = 10000; // Mínimo 10s entre verificações

        const handleVisibilityChange = async () => {
            // Registrar quando a aba fica oculta
            if (document.hidden) {
                lastHiddenTimeRef.current = Date.now();
                return;
            }

            // A aba ficou visível novamente
            const now = Date.now();
            const inactiveMs = now - lastHiddenTimeRef.current;
            const inactiveMinutes = inactiveMs / (1000 * 60);

            // Guard: não verificar se não autenticado, já verificando, ou debounce ativo
            if (!state.isAuthenticated) return;
            if (isCheckingFocusRef.current) {
                console.log('[AppContext] Verificação de foco já em andamento, ignorando.');
                return;
            }
            if ((now - lastFocusCheckRef.current) < DEBOUNCE_MS) {
                console.log('[AppContext] Debounce ativo, ignorando verificação de foco.');
                return;
            }

            // Inatividade < 1 minuto: não precisa verificar
            if (inactiveMinutes < 1) {
                return;
            }

            isCheckingFocusRef.current = true;
            lastFocusCheckRef.current = now;
            // Cooldown de 30s para evitar loadData duplicado do onAuthStateChange
            visibilityReturnCooldownRef.current = now + 30000;

            // Iniciar período de warmup proporcional à inatividade
            const warmupMs = inactiveMinutes > 5 ? 20000 : 15000;
            startWarmupPeriod(warmupMs);

            console.log(`[AppContext] Aba visível novamente (após ${inactiveMinutes.toFixed(1)} min de inatividade). Warmup: ${warmupMs}ms`);

            try {
                // Inatividade > 30 min: reload direto — sessão provavelmente expirou
                if (inactiveMinutes > 30) {
                    console.log('[AppContext] Inatividade longa (>30min), verificando sessão antes de reload...');
                    await new Promise(resolve => setTimeout(resolve, 1500));
                    const session = await authService.getSessionQuick();
                    if (!session) {
                        showNotification('Sessão expirada após longo período. Recarregando...', 'warning');
                        setTimeout(() => window.location.reload(), 2000);
                        return;
                    }
                    // Sessão ainda ativa após 30min — recarregar dados com probe gateway
                    console.log('[AppContext] Sessão ainda ativa após inatividade longa. Recarregando dados...');
                    await loadData(true);
                    return;
                }

                // Dar tempo para a rede "acordar" — proporcional à inatividade
                const delay = inactiveMinutes > 5 ? 3000 : 1500;
                await new Promise(resolve => setTimeout(resolve, delay));

                // Inatividade 1-5 min: verificação leve (sem retries)
                if (inactiveMinutes <= 5) {
                    const session = await authService.getSessionQuick(false);
                    if (session === null) {
                        console.warn('[AppContext] Sessão expirada, realizando logout...');
                        logout();
                    } else if (session === undefined) {
                        // Falha na verificação leve — não alarmar, apenas logar
                        console.log('[AppContext] Verificação leve falhou, aguardando próximo ciclo ou ação do usuário.');
                    } else {
                        console.log('[AppContext] Sessão validada com sucesso.');
                    }
                    return;
                }

                // Inatividade 5-30 min: verificação leve primeiro (sem retries pesados)
                await new Promise(resolve => setTimeout(resolve, 2000));
                // Usar retry para inatividade > 5min (cold-start possível)
                const session = await authService.getSessionQuick(true);

                if (session === null) {
                    console.warn('[AppContext] Sessão expirada ao focar, realizando logout...');
                    logout();
                } else if (session === undefined) {
                    // Verificação leve falhou — tentar carregar dados com probe gateway
                    console.log('[AppContext] Verificação pós-foco inconclusiva. Tentando carregar dados com probe...');
                    try {
                        await loadData(true);
                        // Se loadData() suceder, isConnectionStable já será true
                    } catch (loadErr) {
                        console.warn('[AppContext] loadData também falhou pós-foco.');
                        setState(prev => ({ ...prev, isConnectionStable: false, isReconnecting: false }));
                    }
                } else {
                    console.log('[AppContext] Sessão validada com sucesso. Recarregando dados...');
                    await loadData(true);
                }
            } catch (err) {
                console.error('[AppContext] Erro no handleVisibilityChange:', err);
            } finally {
                isCheckingFocusRef.current = false;
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [state.isAuthenticated, loadData, logout, showNotification]);

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
            reconnect,
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
            resetPassword,
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
