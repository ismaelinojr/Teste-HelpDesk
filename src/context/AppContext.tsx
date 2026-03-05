import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Chamado, Usuario, Cliente, Interacao, ConfigSLA, StatusChamado, ContatoCliente, CategoriaChamado } from '../types';
import * as ticketService from '../services/ticketService';
import * as clientService from '../services/clientService';
import * as userService from '../services/userService';
import * as categoryService from '../services/categoryService';
import { configSLA as defaultConfig } from '../mocks/mockData';

interface AppState {
    chamados: Chamado[];
    usuarios: Usuario[];
    clientes: Cliente[];
    categoriasChamado: CategoriaChamado[];
    currentUser: Usuario;
    configSLA: ConfigSLA;
    loading: boolean;
}

interface AppContextType extends AppState {
    switchUser: (userId: string) => void;
    assumirChamado: (chamadoId: string) => Promise<void>;
    atualizarStatus: (chamadoId: string, status: StatusChamado) => Promise<void>;
    encerrarChamado: (chamadoId: string, solucao: string) => Promise<void>;
    adicionarNota: (chamadoId: string, mensagem: string) => Promise<Interacao>;
    getInteracoes: (chamadoId: string) => Promise<Interacao[]>;
    criarChamado: (data: { clienteId: string; contatoNome?: string; categoriaId: string; titulo: string; descricao: string; prioridade: 'normal' | 'urgente' }) => Promise<void>;
    atualizarConfigSLA: (config: ConfigSLA) => void;
    refreshChamados: () => Promise<void>;
    getClienteNome: (id: string) => string;
    getTecnicoNome: (id: string | null) => string;
    getCategoriaNome: (id: string) => string;
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
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
    const [state, setState] = useState<AppState>({
        chamados: [],
        usuarios: [],
        clientes: [],
        categoriasChamado: [],
        currentUser: { id: 'u1', nome: 'Ismael Silva', role: 'admin', email: 'ismael@helpdesk.com' },
        configSLA: defaultConfig,
        loading: true,
    });

    const loadData = useCallback(async () => {
        setState(prev => ({ ...prev, loading: true }));
        const [chamados, usuarios, clientes, categorias] = await Promise.all([
            ticketService.getTickets(),
            userService.getUsers(),
            clientService.getClients(),
            categoryService.getCategorias(),
        ]);
        setState(prev => ({ ...prev, chamados, usuarios, clientes, categoriasChamado: categorias, loading: false }));
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

    const refreshChamados = useCallback(async () => {
        const chamados = await ticketService.getTickets();
        setState(prev => ({ ...prev, chamados }));
    }, []);

    const assumirChamado = useCallback(async (chamadoId: string) => {
        await ticketService.assignTechnician(chamadoId, state.currentUser.id);
        await ticketService.addInteracao(chamadoId, state.currentUser.id, `${state.currentUser.nome} assumiu o chamado.`);
        await refreshChamados();
    }, [state.currentUser, refreshChamados]);

    const atualizarStatus = useCallback(async (chamadoId: string, status: StatusChamado) => {
        await ticketService.updateTicketStatus(chamadoId, status);
        const labels: Record<StatusChamado, string> = {
            aberto: 'Aberto',
            em_atendimento: 'Em Atendimento',
            aguardando_cliente: 'Aguardando Cliente',
            fechado: 'Fechado',
        };
        await ticketService.addInteracao(chamadoId, state.currentUser.id, `Status alterado para: ${labels[status]}`);
        await refreshChamados();
    }, [state.currentUser, refreshChamados]);

    const encerrarChamado = useCallback(async (chamadoId: string, solucao: string) => {
        await ticketService.closeTicket(chamadoId, solucao);
        await ticketService.addInteracao(chamadoId, state.currentUser.id, `Chamado encerrado. Solução: ${solucao}`);
        await refreshChamados();
    }, [state.currentUser, refreshChamados]);

    const adicionarNota = useCallback(async (chamadoId: string, mensagem: string) => {
        const interacao = await ticketService.addInteracao(chamadoId, state.currentUser.id, mensagem);
        return interacao;
    }, [state.currentUser]);

    const getInteracoes = useCallback(async (chamadoId: string) => {
        return ticketService.getInteracoes(chamadoId);
    }, []);

    const criarChamado = useCallback(async (data: { clienteId: string; contatoNome?: string; categoriaId: string; titulo: string; descricao: string; prioridade: 'normal' | 'urgente' }) => {
        const slaHoras = data.prioridade === 'urgente' ? state.configSLA.urgente : state.configSLA.normal;
        await ticketService.createTicket({
            ...data,
            status: 'aberto',
            tecnicoId: null,
            slaHoras,
        });
        await refreshChamados();
    }, [state.configSLA, refreshChamados]);

    const atualizarConfigSLA = useCallback((config: ConfigSLA) => {
        setState(prev => ({ ...prev, configSLA: config }));
    }, []);

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

    const getChamadosFiltrados = useCallback(() => {
        if (state.currentUser.role === 'admin') return state.chamados;
        return state.chamados.filter(c => c.tecnicoId === state.currentUser.id);
    }, [state.chamados, state.currentUser]);

    const getContatosByCliente = useCallback(async (clienteId: string) => {
        return await clientService.getContatosByCliente(clienteId);
    }, []);

    const addContato = useCallback(async (clienteId: string, nome: string, telefone?: string, email?: string, funcao?: string) => {
        return await clientService.addContato(clienteId, nome, telefone, email, funcao);
    }, []);

    const updateContato = useCallback(async (id: string, data: Partial<ContatoCliente>) => {
        return await clientService.updateContato(id, data);
    }, []);

    const deleteContato = useCallback(async (id: string) => {
        return await clientService.deleteContato(id);
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
            clientes: prev.clientes.filter(c => c.id !== id) // removemos da lista visualmente
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

    return (
        <AppContext.Provider value={{
            ...state,
            switchUser,
            assumirChamado,
            atualizarStatus,
            encerrarChamado,
            adicionarNota,
            getInteracoes,
            criarChamado,
            atualizarConfigSLA,
            refreshChamados,
            getClienteNome,
            getTecnicoNome,
            getCategoriaNome,
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
