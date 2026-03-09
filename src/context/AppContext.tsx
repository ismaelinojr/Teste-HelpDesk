import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Chamado, Usuario, Cliente, Interacao, StatusChamado, ContatoCliente, CategoriaChamado, StatusConfig, SLAConfig } from '../types';
import * as ticketService from '../services/ticketService';
import * as clientService from '../services/clientService';
import * as userService from '../services/userService';
import * as categoryService from '../services/categoryService';
import * as statusService from '../services/statusService';
import * as slaService from '../services/slaService';

interface AppState {
    chamados: Chamado[];
    usuarios: Usuario[];
    clientes: Cliente[];
    contatosClientes: ContatoCliente[];
    categoriasChamado: CategoriaChamado[];
    statusConfigs: StatusConfig[];
    slaConfigs: SLAConfig[];
    currentUser: Usuario | null;
    isAuthenticated: boolean;
    loading: boolean;
}

interface AppContextType extends AppState {
    switchUser: (userId: string) => void;
    login: (email: string, password: string) => Promise<boolean>;
    logout: () => void;
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

    addCliente: (cliente: Omit<Cliente, 'id'>) => Promise<Cliente>;
    updateCliente: (id: string, data: Partial<Cliente>) => Promise<Cliente>;
    deleteCliente: (id: string) => Promise<void>;

    addUsuario: (usuario: Omit<Usuario, 'id'>) => Promise<Usuario>;
    updateUsuario: (id: string, data: Partial<Usuario>) => Promise<Usuario>;
    deleteUsuario: (id: string) => Promise<void>;

    addCategoria: (categoria: Omit<CategoriaChamado, 'id'>) => Promise<CategoriaChamado>;
    updateCategoria: (id: string, data: Partial<CategoriaChamado>) => Promise<CategoriaChamado>;
    deleteCategoria: (id: string) => Promise<void>;

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
        statusConfigs: [],
        slaConfigs: [],
        currentUser: null,
        isAuthenticated: false,
        loading: true,
    });

    const loadData = useCallback(async () => {
        setState(prev => ({ ...prev, loading: true }));
        const [chamados, usuarios, clientes, categorias, statuses, slas, contatos] = await Promise.all([
            ticketService.getTickets(),
            userService.getUsers(),
            clientService.getClients(),
            categoryService.getCategorias(),
            statusService.getStatuses(),
            slaService.getSLAs(),
            clientService.getAllContatos(),
        ]);
        setState(prev => ({
            ...prev,
            chamados,
            usuarios,
            clientes,
            contatosClientes: contatos,
            categoriasChamado: categorias,
            statusConfigs: statuses,
            slaConfigs: slas,
            loading: false,
        }));
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const switchUser = useCallback((userId: string) => {
        const user = state.usuarios.find(u => u.id === userId);
        if (user) {
            setState(prev => ({ ...prev, currentUser: user }));
        }
    }, [state.usuarios]);

    const login = useCallback(async (email: string, _password: string) => {
        const user = state.usuarios.find(u => u.email === email);
        if (user) {
            setState(prev => ({ ...prev, currentUser: user, isAuthenticated: true }));
            return true;
        }
        return false;
    }, [state.usuarios]);

    const logout = useCallback(() => {
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
            clientes: prev.clientes.filter(c => c.id !== id)
        }));
    }, []);

    const addUsuario = useCallback(async (usuario: Omit<Usuario, 'id'>) => {
        const novo = await userService.addUsuario(usuario);
        setState(prev => ({ ...prev, usuarios: [...prev.usuarios, novo] }));
        return novo;
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
            addCliente,
            updateCliente,
            deleteCliente,
            addUsuario,
            updateUsuario,
            deleteUsuario,
            addCategoria,
            updateCategoria,
            deleteCategoria,
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
