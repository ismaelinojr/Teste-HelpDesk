import type { Usuario, Cliente, Chamado, Interacao, ContatoCliente, CategoriaChamado, StatusConfig, SLAConfig } from '../types';

// ===== CONFIGURAÇÃO DE STATUS =====
export let statusConfigs: StatusConfig[] = [
    { id: 'aberto', nome: 'Aberto', cor: '#3b82f6', icone: 'AlertCircle', ordem: 1, ativo: true },
    { id: 'em_atendimento', nome: 'Em Atendimento', cor: '#f97316', icone: 'Clock', ordem: 2, ativo: true },
    { id: 'aguardando_cliente', nome: 'Aguardando Cliente', cor: '#FF9F43', icone: 'Hourglass', ordem: 3, ativo: true },
    { id: 'programacao', nome: 'Programação', cor: '#8E7CFF', icone: 'Code', ordem: 4, ativo: true },
    { id: 'fechado', nome: 'Fechado', cor: '#2ED37D', icone: 'CheckCircle', ordem: 5, ativo: true },
];

// ===== CONFIGURAÇÃO DE SLA =====
export let slaConfigs: SLAConfig[] = [
    { id: 'urgente', nome: 'Urgente', horas: 4, cor: '#FF4D4D', ativo: true },
    { id: 'normal', nome: 'Normal', horas: 24, cor: '#3b82f6', ativo: true },
    { id: 'programacao', nome: 'Programação', horas: 72, cor: '#8E7CFF', ativo: true },
];

// ===== USUÁRIOS (Técnicos e Admin) =====
export let usuarios: Usuario[] = [
    { id: 'u1', nome: 'Ismael Silva', role: 'admin', email: 'ismael@i9chamados.com' },
    { id: 'u2', nome: 'Carlos Oliveira', role: 'tecnico', email: 'carlos@i9chamados.com' },
    { id: 'u3', nome: 'Fernanda Lima', role: 'tecnico', email: 'fernanda@i9chamados.com' },
    { id: 'u4', nome: 'Rafael Santos', role: 'tecnico', email: 'rafael@i9chamados.com' },
    { id: 'u5', nome: 'Juliana Costa', role: 'tecnico', email: 'juliana@i9chamados.com' },
];

// ===== CLIENTES (26 Laboratórios) =====
export let clientes: Cliente[] = [
    { id: 'c1', nome: 'Lab Análises Clínicas Central', contato: '(11) 99111-0001', regiao: 'Sul' },
    { id: 'c2', nome: 'Lab Diagnósticos Avançados', contato: '(11) 99111-0002', regiao: 'Norte' },
    { id: 'c3', nome: 'Lab Pastor', contato: '(11) 99111-0003', regiao: 'Sul' },
    { id: 'c4', nome: 'Lab São Lucas', contato: '(11) 99111-0004', regiao: 'Norte' },
    { id: 'c5', nome: 'Lab Exame Certo', contato: '(11) 99111-0005', regiao: 'Sul' },
    { id: 'c6', nome: 'Lab MedLab', contato: '(11) 99111-0006', regiao: 'Sul' },
    { id: 'c7', nome: 'Lab BioVida', contato: '(11) 99111-0007', regiao: 'Norte' },
    { id: 'c8', nome: 'Lab Saúde Total', contato: '(11) 99111-0008', regiao: 'Norte' },
    { id: 'c9', nome: 'Lab Clínico Premium', contato: '(11) 99111-0009', regiao: 'Sul' },
    { id: 'c10', nome: 'Lab Hemato Center', contato: '(11) 99111-0010', regiao: 'Sul' },
    { id: 'c11', nome: 'Lab Pathos', contato: '(11) 99111-0011', regiao: 'Norte' },
    { id: 'c12', nome: 'Lab Santa Cruz', contato: '(11) 99111-0012', regiao: 'Norte' },
    { id: 'c13', nome: 'Lab Quality Diagnósticos', contato: '(11) 99111-0013', regiao: 'Sul' },
    { id: 'c14', nome: 'Lab Referência', contato: '(11) 99111-0014', regiao: 'Sul' },
    { id: 'c15', nome: 'Lab LabPlus', contato: '(11) 99111-0015', regiao: 'Norte' },
    { id: 'c16', nome: 'Lab CentroMed', contato: '(11) 99111-0016', regiao: 'Sul' },
    { id: 'c17', nome: 'Lab Unimed Diagnósticos', contato: '(11) 99111-0017', regiao: 'Sul' },
    { id: 'c18', nome: 'Lab Célula', contato: '(11) 99111-0018', regiao: 'Norte' },
    { id: 'c19', nome: 'Lab VitaLab', contato: '(11) 99111-0019', regiao: 'Sul' },
    { id: 'c20', nome: 'Lab ProAnálise', contato: '(11) 99111-0020', regiao: 'Norte' },
    { id: 'c21', nome: 'Lab Micro Imagem', contato: '(11) 99111-0021', regiao: 'Sul' },
    { id: 'c22', nome: 'Lab Bioquímico', contato: '(11) 99111-0022', regiao: 'Norte' },
    { id: 'c23', nome: 'Lab LabTech', contato: '(11) 99111-0023', regiao: 'Sul' },
    { id: 'c24', nome: 'Lab São José', contato: '(11) 99111-0024', regiao: 'Sul' },
    { id: 'c25', nome: 'Lab GenLab', contato: '(11) 99111-0025', regiao: 'Norte' },
    { id: 'c26', nome: 'Lab Nova Era', contato: '(11) 99111-0026', regiao: 'Sul' },
];

// ===== CONTATOS DE CLIENTES (Funcionários dos Laboratórios) =====
export let contatosClientes: ContatoCliente[] = [
    { id: 'cc1', clienteId: 'c1', nome: 'Ana Costa', funcao: 'Recepcionista' },
    { id: 'cc2', clienteId: 'c1', nome: 'Dr. Roberto', funcao: 'Biomédico Resp.' },
    { id: 'cc3', clienteId: 'c2', nome: 'Mariana Silva', funcao: 'Gerente' },
    { id: 'cc4', clienteId: 'c3', nome: 'Pedro Alves', funcao: 'TI Local' },
    { id: 'cc5', clienteId: 'c5', nome: 'Lúcia Fernandes', funcao: 'Coleta' },
    { id: 'cc6', clienteId: 'c8', nome: 'Tiago Souza', funcao: 'Recepção' },
    { id: 'cc7', clienteId: 'c12', nome: 'Amanda Rocha', funcao: 'Administrativo' },
];

// ===== CATEGORIAS DE CHAMADO =====
export let categoriasChamado: CategoriaChamado[] = [
    { id: 'cat1', nome: 'Impressora / Hardware', descricao: 'Problemas físicos com equipamentos' },
    { id: 'cat2', nome: 'Sistema / Software', descricao: 'Erros ou dúvidas no sistema de laudos' },
    { id: 'cat3', nome: 'Rede / Internet', descricao: 'Inatividade ou lentidão de rede' },
    { id: 'cat4', nome: 'Backup', descricao: 'Falhas nas rotinas de cópia de segurança' },
    { id: 'cat5', nome: 'E-mail', descricao: 'Problemas de envio e recebimento' },
    { id: 'cat6', nome: 'Outros', descricao: 'Demandas não categorizadas' },
];

// ===== CHAMADOS =====
const now = new Date();
const h = (hours: number) => new Date(now.getTime() - hours * 60 * 60 * 1000).toISOString();

export const chamados: Chamado[] = [
    {
        id: 'ch1', numero: 1, clienteId: 'c1', contatoNome: 'Ana Costa', categoriaId: 'cat1', titulo: 'Impressora não imprime',
        descricao: 'A impressora fiscal do caixa parou de funcionar após atualização do sistema.',
        status: 'aberto', prioridade: 'urgente', tecnicoId: null,
        slaHoras: 4, dataAbertura: h(2), dataInicio: null, dataFechamento: null, solucaoFinal: null,
    }
];

// ===== INTERAÇÕES =====
export const interacoes: Interacao[] = [
    { id: 'i1', chamadoId: 'ch1', usuarioId: 'u1', mensagem: 'Chamado registrado via WhatsApp. Cliente reportou que a impressora parou após atualização.', createdAt: h(2) },
];
