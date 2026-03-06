import type { Usuario, Cliente, Chamado, Interacao, ConfigSLA, ContatoCliente, CategoriaChamado } from '../types';

// ===== CONFIGURAÇÃO SLA =====
export const configSLA: ConfigSLA = {
    urgente: 4,
    normal: 24,
};

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
        id: 'ch1', clienteId: 'c1', contatoNome: 'Ana Costa', categoriaId: 'cat1', titulo: 'Impressora não imprime',
        descricao: 'A impressora fiscal do caixa parou de funcionar após atualização do sistema.',
        status: 'aberto', prioridade: 'urgente', tecnicoId: null,
        slaHoras: 4, dataAbertura: h(2), dataInicio: null, dataFechamento: null, solucaoFinal: null,
    },
    {
        id: 'ch2', clienteId: 'c3', contatoNome: 'Pedro Alves', categoriaId: 'cat2', titulo: 'Sistema lento',
        descricao: 'O sistema de laudos está extremamente lento desde ontem.',
        status: 'em_atendimento', prioridade: 'normal', tecnicoId: 'u2',
        slaHoras: 24, dataAbertura: h(10), dataInicio: h(8), dataFechamento: null, solucaoFinal: null,
    },
    {
        id: 'ch3', clienteId: 'c5', contatoNome: 'Lúcia Fernandes', categoriaId: 'cat4', titulo: 'Erro ao gerar backup',
        descricao: 'O backup automático falhou nas últimas 3 noites consecutivas.',
        status: 'em_atendimento', prioridade: 'urgente', tecnicoId: 'u3',
        slaHoras: 4, dataAbertura: h(5), dataInicio: h(4.5), dataFechamento: null, solucaoFinal: null,
    },
    {
        id: 'ch4', clienteId: 'c8', contatoNome: 'Tiago Souza', categoriaId: 'cat1', titulo: 'Monitor sem imagem',
        descricao: 'Monitor da recepção ligou mas fica tela preta.',
        status: 'aberto', prioridade: 'normal', tecnicoId: null,
        slaHoras: 24, dataAbertura: h(3), dataInicio: null, dataFechamento: null, solucaoFinal: null,
    },
    {
        id: 'ch5', clienteId: 'c12', contatoNome: 'Amanda Rocha', categoriaId: 'cat5', titulo: 'E-mail não envia',
        descricao: 'Outlook parou de enviar e-mails, só recebe.',
        status: 'aguardando_cliente', prioridade: 'normal', tecnicoId: 'u4',
        slaHoras: 24, dataAbertura: h(20), dataInicio: h(18), dataFechamento: null, solucaoFinal: null,
    },
    {
        id: 'ch6', clienteId: 'c15', contatoNome: 'João Marcos', categoriaId: 'cat2', titulo: 'Instalação de software',
        descricao: 'Precisa instalar o novo módulo do sistema de laudos em 3 estações.',
        status: 'aberto', prioridade: 'normal', tecnicoId: null,
        slaHoras: 24, dataAbertura: h(1), dataInicio: null, dataFechamento: null, solucaoFinal: null,
    },
    {
        id: 'ch7', clienteId: 'c2', contatoNome: 'Mariana Silva', categoriaId: 'cat3', titulo: 'Rede fora do ar',
        descricao: 'Toda a rede interna caiu, nenhum computador acessa a internet.',
        status: 'em_atendimento', prioridade: 'urgente', tecnicoId: 'u2',
        slaHoras: 4, dataAbertura: h(3), dataInicio: h(2.5), dataFechamento: null, solucaoFinal: null,
    },
    {
        id: 'ch8', clienteId: 'c20', contatoNome: 'Dra. Beatriz', categoriaId: 'cat2', titulo: 'Atualização Windows',
        descricao: 'Servidor precisa de atualização de segurança do Windows Server.',
        status: 'fechado', prioridade: 'normal', tecnicoId: 'u3',
        slaHoras: 24, dataAbertura: h(72), dataInicio: h(70), dataFechamento: h(65), solucaoFinal: 'Atualização aplicada com sucesso. Servidor reiniciado.',
    },
    {
        id: 'ch9', clienteId: 'c7', contatoNome: 'Fernando TI', categoriaId: 'cat3', titulo: 'Acesso remoto não funciona',
        descricao: 'AnyDesk perdeu a conexão e não reconecta.',
        status: 'fechado', prioridade: 'urgente', tecnicoId: 'u4',
        slaHoras: 4, dataAbertura: h(48), dataInicio: h(47), dataFechamento: h(46), solucaoFinal: 'AnyDesk reinstalado e configurado. ID atualizado.',
    },
    {
        id: 'ch10', clienteId: 'c18', contatoNome: 'Carla', categoriaId: 'cat1', titulo: 'Problema com leitor de código de barras',
        descricao: 'Leitor da coleta não lê os códigos de barras das amostras.',
        status: 'aberto', prioridade: 'urgente', tecnicoId: null,
        slaHoras: 4, dataAbertura: h(1), dataInicio: null, dataFechamento: null, solucaoFinal: null,
    },
    {
        id: 'ch11', clienteId: 'c22', contatoNome: 'Roberto', categoriaId: 'cat1', titulo: 'Configurar nova impressora',
        descricao: 'Instalar e configurar nova impressora de etiquetas na recepção.',
        status: 'aguardando_cliente', prioridade: 'normal', tecnicoId: 'u5',
        slaHoras: 24, dataAbertura: h(30), dataInicio: h(28), dataFechamento: null, solucaoFinal: null,
    },
    {
        id: 'ch12', clienteId: 'c10', contatoNome: 'Marcela', categoriaId: 'cat1', titulo: 'Falha no nobreak',
        descricao: 'Nobreak do servidor está bipando e indicando bateria fraca.',
        status: 'em_atendimento', prioridade: 'urgente', tecnicoId: 'u5',
        slaHoras: 4, dataAbertura: h(2), dataInicio: h(1.5), dataFechamento: null, solucaoFinal: null,
    },
    {
        id: 'ch13', clienteId: 'c26', contatoNome: 'Vitor Hugo', categoriaId: 'cat2', titulo: 'Antivírus expirado',
        descricao: 'Licença do antivírus expirou em todas as máquinas.',
        status: 'fechado', prioridade: 'normal', tecnicoId: 'u2',
        slaHoras: 24, dataAbertura: h(96), dataInicio: h(90), dataFechamento: h(85), solucaoFinal: 'Licença renovada e atualização forçada em todas as 8 máquinas.',
    },
    {
        id: 'ch14', clienteId: 'c14', contatoNome: 'Silvia', categoriaId: 'cat3', titulo: 'VPN não conecta',
        descricao: 'Usuário não consegue conectar na VPN para acessar o sistema remotamente.',
        status: 'aberto', prioridade: 'normal', tecnicoId: null,
        slaHoras: 24, dataAbertura: h(5), dataInicio: null, dataFechamento: null, solucaoFinal: null,
    },
    {
        id: 'ch15', clienteId: 'c9', contatoNome: 'Carlos', categoriaId: 'cat1', titulo: 'Câmera de segurança offline',
        descricao: 'Câmera 3 do estacionamento parou de gravar.',
        status: 'fechado', prioridade: 'normal', tecnicoId: 'u3',
        slaHoras: 24, dataAbertura: h(120), dataInicio: h(118), dataFechamento: h(115), solucaoFinal: 'Cabo de rede substituído, câmera reconfigurada no DVR.',
    },
];

// ===== INTERAÇÕES =====
export const interacoes: Interacao[] = [
    { id: 'i1', chamadoId: 'ch1', usuarioId: 'u1', mensagem: 'Chamado registrado via WhatsApp. Cliente reportou que a impressora parou após atualização.', createdAt: h(2) },
    { id: 'i2', chamadoId: 'ch2', usuarioId: 'u1', mensagem: 'Cliente informou lentidão no sistema de laudos.', createdAt: h(10) },
    { id: 'i3', chamadoId: 'ch2', usuarioId: 'u2', mensagem: 'Verificando uso de CPU e memória do servidor.', createdAt: h(8) },
    { id: 'i4', chamadoId: 'ch2', usuarioId: 'u2', mensagem: 'Identificado processo consumindo 95% de CPU. Reiniciando serviço.', createdAt: h(7) },
    { id: 'i5', chamadoId: 'ch3', usuarioId: 'u3', mensagem: 'Analisando logs de backup. Erro de permissão no disco.', createdAt: h(4.5) },
    { id: 'i6', chamadoId: 'ch3', usuarioId: 'u3', mensagem: 'Corrigindo permissões da pasta de backup.', createdAt: h(4) },
    { id: 'i7', chamadoId: 'ch5', usuarioId: 'u4', mensagem: 'Verificado configuração SMTP. Senha expirada.', createdAt: h(18) },
    { id: 'i8', chamadoId: 'ch5', usuarioId: 'u4', mensagem: 'Aguardando cliente enviar nova senha do e-mail corporativo.', createdAt: h(16) },
    { id: 'i9', chamadoId: 'ch7', usuarioId: 'u2', mensagem: 'Switch principal parece queimado. Testando com switch reserva.', createdAt: h(2.5) },
    { id: 'i10', chamadoId: 'ch7', usuarioId: 'u2', mensagem: 'Switch reserva conectado. Rede parcialmente restaurada.', createdAt: h(2) },
    { id: 'i11', chamadoId: 'ch8', usuarioId: 'u3', mensagem: 'Iniciando atualização em horário agendado (após expediente).', createdAt: h(70) },
    { id: 'i12', chamadoId: 'ch8', usuarioId: 'u3', mensagem: 'Atualização concluída. Servidor reiniciado com sucesso.', createdAt: h(65) },
    { id: 'i13', chamadoId: 'ch9', usuarioId: 'u4', mensagem: 'AnyDesk desinstalado e reinstalado. Testando conexão.', createdAt: h(47) },
    { id: 'i14', chamadoId: 'ch9', usuarioId: 'u4', mensagem: 'Conexão estabelecida com sucesso. Novo ID configurado.', createdAt: h(46) },
    { id: 'i15', chamadoId: 'ch11', usuarioId: 'u5', mensagem: 'Impressora recebida. Aguardando cabo USB prometido pelo cliente.', createdAt: h(28) },
    { id: 'i16', chamadoId: 'ch12', usuarioId: 'u5', mensagem: 'Nobreak identificado. Modelo APC 1500VA, bateria precisa troca.', createdAt: h(1.5) },
    { id: 'i17', chamadoId: 'ch12', usuarioId: 'u5', mensagem: 'Bateria encomendada. Previsto para amanhã.', createdAt: h(1) },
    { id: 'i18', chamadoId: 'ch13', usuarioId: 'u2', mensagem: 'Renovando licença no portal do fabricante.', createdAt: h(90) },
    { id: 'i19', chamadoId: 'ch13', usuarioId: 'u2', mensagem: 'Licença ativada. Executando atualização remota em lote.', createdAt: h(87) },
    { id: 'i20', chamadoId: 'ch13', usuarioId: 'u2', mensagem: 'Todas as 8 máquinas atualizadas e verificadas.', createdAt: h(85) },
];
