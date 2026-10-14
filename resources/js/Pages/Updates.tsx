import { Head } from '@inertiajs/react';
import {
    Container,
    Title,
    Text,
    Timeline,
    Paper,
    Badge,
    Group,
    Stack,
    ThemeIcon,
    List,
    Box,
    Divider,
    Accordion,
    Alert,
} from '@mantine/core';
import {
    IconSparkles,
    IconTrophy,
    IconPackage,
    IconBolt,
    IconClock,
    IconCheck,
    IconRocket,
    IconInfoCircle,
    IconQuestionMark,
    IconShieldCheck,
    IconCurrencyDollar,
    IconUsers,
    IconDeviceMobile,
    IconBrain,
    IconClockPlay,
    IconChecklist,
} from '@tabler/icons-react';
import PublicLayout from '@/Layouts/PublicLayout';
import { PageProps } from '@/types';

export default function Updates({ auth }: PageProps) {
    const updates = [
        {
            version: 'v2.7.0',
            date: '17 de Fevereiro, 2026',
            title: 'Progressive Web App (PWA) - Aplicação Instalável',
            icon: IconDeviceMobile,
            color: 'grape',
            description: 'Transformamos o Salu numa Progressive Web App completa! Agora você pode instalar a plataforma no seu telemóvel como se fosse uma app nativa, com suporte offline e acesso instantâneo.',
            features: [
                {
                    title: 'O que é uma PWA e Por Que É Revolucionário?',
                    description: 'Uma aplicação web que funciona como app nativa, sem precisar de app store',
                    explanation: 'PWA (Progressive Web App) é uma tecnologia moderna que permite websites funcionarem como aplicações nativas. Imagine ter o Salu no seu telemóvel com um ícone na tela inicial, funcionando em tela cheia sem o navegador visível, recebendo notificações push, e funcionando mesmo offline! Tudo isso SEM precisar baixar de uma app store, SEM ocupar muito espaço, e com atualizações instantâneas automáticas.',
                    benefits: [
                        'Instalação instantânea - sem app store, sem downloads grandes',
                        'Ocupa menos espaço que apps nativas (apenas ~5MB)',
                        'Atualizações automáticas em background',
                        'Funciona offline - veja serviços mesmo sem internet',
                        'Notificações push para updates importantes',
                        'Tela cheia - experiência idêntica a app nativa',
                    ],
                    items: [
                        'Web App Manifest configurado - define ícone, nome, cores do tema',
                        'Service Worker com cache inteligente - armazena páginas visitadas para acesso offline',
                        'Estratégia "Network First, Fallback to Cache" - sempre tenta buscar conteúdo fresco, usa cache se offline',
                        'Página offline customizada - mensagem amigável quando não há conexão',
                        'Install Prompt inteligente - banner aparece após 2ª visita, pode ser dispensado por 7 dias',
                        'Push Notifications ready - infraestrutura preparada para notificações web',
                        'Ícones maskable 192×192 e 512×512 - compatíveis com Android adaptativo',
                        'Theme color #5dba40 - barra de status verde Salu em modo standalone',
                        'Apple touch icons - suporte completo para iOS',
                    ],
                },
                {
                    title: 'Como Funciona o Service Worker? (Tecnicamente)',
                    description: 'O "cérebro" por trás do funcionamento offline',
                    explanation: 'O Service Worker é um script JavaScript que roda em background, separado da página web. Ele intercepta TODAS as requisições de rede que o site faz e decide: "Busco do servidor ou uso a versão em cache?". Quando você visita uma página, ele salva automaticamente os recursos (HTML, CSS, JS, imagens) no cache do navegador. Na próxima vez, se estiver offline, ele serve a versão em cache instantaneamente. É como ter uma cópia local do site sempre atualizada!',
                    benefits: [
                        'Velocidade - recursos em cache carregam instantaneamente',
                        'Resiliência - site funciona mesmo com internet instável',
                        'Economia de dados - reduz downloads repetidos',
                        'Experiência fluida - sem telas de erro',
                    ],
                    items: [
                        'Instalação e ativação automática ao primeiro acesso',
                        'Cache de assets críticos: CSS, JS, fontes, logo',
                        'Estratégia de cache configurável por tipo de recurso',
                        'Verificação de updates a cada hora - se houver nova versão, atualiza em background',
                        'Event listeners para install, activate, fetch',
                        'Fallback para offline.html quando não há cache nem rede',
                        'Cleanup automático de caches antigos ao atualizar',
                        'Compatibilidade: Chrome, Edge, Firefox, Safari 11.1+',
                    ],
                },
                {
                    title: 'Como Instalar no Telemóvel',
                    description: 'Processo simples em 3 passos',
                    explanation: 'No Android Chrome: visite salu.ao, verá um banner "Instalar Salu" após alguns segundos, clique em "Instalar", pronto! O ícone verde aparece na tela inicial. No iOS Safari: visite salu.ao, toque no botão "Compartilhar" (quadrado com seta), role e toque em "Adicionar à Tela de Início", confirme. Pronto! Em ambos os casos, ao abrir o ícone, o Salu abre em tela cheia como app nativa.',
                    benefits: [
                        'Acesso instantâneo com um toque',
                        'Não precisa abrir navegador primeiro',
                        'Interface limpa sem barras do browser',
                        'Multitarefa - aparece na lista de apps recentes',
                    ],
                    items: [
                        'Android Chrome: banner de instalação automático + menu "Adicionar à tela inicial"',
                        'iOS Safari: botão Compartilhar > Adicionar à Tela de Início',
                        'Windows/Mac: Chrome menu > Instalar Salu',
                        'Ícone verde Salu 512×512px de alta qualidade',
                        'Nome curto "Salu" aparece abaixo do ícone',
                        'Splash screen verde ao abrir (Android)',
                        'Integração com sistema operacional - aparece nas configurações de apps',
                    ],
                },
            ],
        },
        {
            version: 'v2.6.0',
            date: '17 de Fevereiro, 2026',
            title: 'Verificação AI com AWS Rekognition',
            icon: IconBrain,
            color: 'indigo',
            description: 'Implementamos verificação de identidade automática usando Inteligência Artificial! O sistema agora compara automaticamente o documento com a selfie usando AWS Rekognition, acelerando aprovações e aumentando segurança.',
            features: [
                {
                    title: 'Como Funciona a Verificação AI? (Tecnicamente Detalhado)',
                    description: 'Duas análises poderosas em poucos segundos: Face Match + Liveness Detection',
                    explanation: 'Quando um prestador envia documento e selfie para KYC, o sistema envia ambas as imagens para o AWS Rekognition (serviço de IA da Amazon). Primeiro, o Rekognition extrai as características faciais de ambas as fotos (distância entre olhos, formato do nariz, contorno da face, etc.) e gera "embeddings" (vetores numéricos). Depois, compara esses vetores e calcula um score de similaridade de 0 a 100. Simultaneamente, faz uma análise de "liveness" na selfie para detectar se é uma foto real ou screenshot/impressão. Todo o processo leva menos de 5 segundos!',
                    benefits: [
                        'Verificação instantânea - sem esperar dias por análise manual',
                        'Precisão superior a 95% - IA treinada com milhões de faces',
                        'Detecção de fraude - identifica tentativas de burlar com fotos impressas',
                        'Escalável - verifica centenas de KYCs simultaneamente',
                        'Sem viés humano - critérios objetivos sempre',
                    ],
                    items: [
                        'AWS Rekognition CompareFaces API - compara foto do documento com selfie',
                        'Face Match Score 0-100 - threshold configurável (padrão: 80% para aprovar)',
                        'Liveness Detection - analisa se selfie é foto real ou screenshot',
                        'Liveness Score 0-100 - threshold configurável (padrão: 75%)',
                        'Extração de landmarks faciais - 68 pontos de referência analisados',
                        'Análise de qualidade de imagem - detecta blur, baixa iluminação',
                        'Detecção de múltiplas faces - rejeita se há mais de uma pessoa na foto',
                        'Job assíncrono VerifyKycWithAi - processa em background sem bloquear',
                        'Armazenamento temporário - imagens apagadas após 30 dias (GDPR compliance)',
                    ],
                },
                {
                    title: 'Processo de Aprovação Automática',
                    description: 'AI + revisão humana = máxima segurança',
                    explanation: 'Após o Rekognition processar as imagens, o sistema salva os scores na base de dados. Se Face Match ≥80% E Liveness ≥75%, o KYC fica marcado como "AI Passed" (verde). Se os scores forem baixos (<60%), marca como "AI Failed" (vermelho). Scores médios (60-79%) ficam amarelos "Review Needed". Importante: a IA NUNCA aprova sozinha! Um admin sempre revê antes da aprovação final, mas agora tem o score AI como ferramenta de decisão. Isso acelera o processo e reduz erros.',
                    benefits: [
                        'Triagem automática - admins focam apenas em casos duvidosos',
                        'Decisões mais rápidas - score AI guia a análise',
                        'Redução de fraudes - IA detecta padrões que humanos podem perder',
                        'Transparência - prestador vê se passou na verificação AI',
                    ],
                    items: [
                        'Auto-approval opcional (desativado por padrão por segurança)',
                        'Threshold configurável via .env - ajustável por região/contexto',
                        'Sistema de badges visuais no painel admin: Verde (≥80), Amarelo (60-79), Vermelho (<60)',
                        'Fallback para revisão manual se API falhar',
                        'Retry automático até 3 vezes em caso de erro de rede',
                        'Logging completo de respostas AI para auditoria',
                        'Admin pode sempre override - decisão final é sempre humana',
                        'Notificação ao prestador do resultado AI',
                    ],
                },
                {
                    title: 'Segurança e Privacidade',
                    description: 'Conformidade com GDPR e proteção de dados biométricos',
                    explanation: 'Entendemos que dados biométricos (características faciais) são sensíveis. Por isso: 1) Pedimos consentimento explícito antes de processar, 2) Enviamos imagens criptografadas via HTTPS para AWS, 3) AWS não armazena as imagens (apenas processa e retorna scores), 4) Apagamos automaticamente os arquivos após 30 dias, 5) Admins não veem os scores brutos da IA, apenas badges, 6) Logs de acesso completos para auditoria.',
                    benefits: [
                        'GDPR compliant - direito ao esquecimento',
                        'Criptografia end-to-end',
                        'Processamento efémero - imagens não ficam na AWS',
                        'Consentimento informado e explícito',
                    ],
                    items: [
                        'Checkbox de consentimento obrigatório no formulário KYC',
                        'Transmissão via HTTPS/TLS 1.3',
                        'AWS Rekognition HIPAA compliant',
                        'Soft delete após 30 dias (recuperável por 90 dias se necessário)',
                        'Hard delete permanente após 120 dias',
                        'Audit trail completo: quem acessou, quando, qual ação',
                        'IP e user agent registrados em todas operações',
                    ],
                },
            ],
        },
        {
            version: 'v2.5.0',
            date: '17 de Fevereiro, 2026',
            title: 'Task Logging e Analytics',
            icon: IconChecklist,
            color: 'teal',
            description: 'Prestadores agora podem dividir serviços em tarefas menores, registando progresso detalhado. Clientes acompanham cada etapa, e admins têm analytics poderosos.',
            features: [
                {
                    title: 'Sistema de Tarefas Detalhadas',
                    description: 'Divida serviços complexos em subtarefas rastreáveis',
                    explanation: 'Quando um serviço envolve múltiplos passos (ex: "Reparação de Carro" = diagnóstico + compra de peças + instalação + teste), o prestador pode criar uma tarefa para cada etapa. Cada tarefa tem: tipo, descrição, localização onde foi feita, tempo gasto, valor cobrado (se aplicável), e status (pendente/em progresso/completa). O cliente vê uma lista tipo checklist com progresso visual (ex: "3 de 5 tarefas completas").',
                    benefits: [
                        'Transparência total do processo',
                        'Cliente sabe exatamente o que está sendo feito',
                        'Prestador organiza melhor seu trabalho',
                        'Histórico detalhado para futuras referências',
                    ],
                    items: [
                        'CRUD completo de tarefas (Create, Read, Update, Delete)',
                        'Campos: tipo de tarefa, descrição, localização, duração (minutos), valor, status',
                        'Metadata JSON para dados adicionais personalizados',
                        'Timestamps de criação e conclusão',
                        'Barra de progresso visual (X de Y completas)',
                        'Filtros por status (pendentes, em progresso, completas)',
                        'Ordenação por data, status, ou tipo',
                    ],
                },
                {
                    title: 'Interface de Gestão de Tarefas',
                    description: 'UI intuitiva para adicionar e acompanhar tarefas',
                    explanation: 'Na página da encomenda, há uma tab "Tarefas" (apenas visível para o prestador e cliente daquela encomenda). O prestador vê um botão "+ Nova Tarefa" que abre um modal com formulário. Após preencher, a tarefa aparece numa lista com checkboxes. Pode editar clicando no ícone lápis, ou marcar como completa tickando a checkbox. O cliente vê a mesma lista mas read-only (não pode editar), apenas acompanha o progresso em tempo real.',
                    benefits: [
                        'Gestão visual simples',
                        'Edição inline rápida',
                        'Modals com validação de formulário',
                        'Responsivo - funciona em mobile',
                    ],
                    items: [
                        'Modal de adicionar tarefa com validação',
                        'Modal de editar tarefa (pré-preenchido)',
                        'Lista com checkboxes interativos',
                        'Ícones de status coloridos (cinza, azul, verde)',
                        'Formatação automática de duração (ex: "2h 30min")',
                        'Formatação de valor (ex: "1.500,00 AOA")',
                        'Toast notifications ao salvar/excluir',
                        'Loading states em todas operações',
                    ],
                },
                {
                    title: 'Analytics para Admins',
                    description: 'Insights sobre tipos de tarefas mais comuns',
                    explanation: 'O sistema agrega dados de todas as tarefas criadas e gera analytics: quais tipos de tarefa são mais frequentes, duração média por tipo, valor médio cobrado, taxa de conclusão, etc. Isso permite identificar padrões (ex: "Reparações elétricas demoram em média 3h") e otimizar a plataforma.',
                    benefits: [
                        'Entendimento de padrões de trabalho',
                        'Identificação de serviços mais complexos',
                        'Data-driven decision making',
                        'Insights para pricing sugerido',
                    ],
                    items: [
                        'Endpoint /orders/{order}/tasks/analytics',
                        'Retorna: total de tarefas, taxa de conclusão, duração total, valor total',
                        'Agrupamento por tipo de tarefa',
                        'Filtros por range de datas',
                        'Exportação para CSV/Excel',
                        'Gráficos no painel admin (futuro)',
                    ],
                },
            ],
        },
        {
            version: 'v2.4.0',
            date: '17 de Fevereiro, 2026',
            title: 'Time Tracking System Completo - Cronómetro em Tempo Real',
            icon: IconClockPlay,
            color: 'cyan',
            description: 'Sistema revolucionário de cronómetro transparente para serviços por hora! Tanto cliente quanto prestador veem em tempo real o tempo trabalhado, com cálculo 100% server-side para evitar fraudes.',
            features: [
                {
                    title: 'Como Funciona o Cronómetro Real-Time? (Arquitetura Técnica)',
                    description: 'Sincronização perfeita entre cliente e prestador com segurança máxima',
                    explanation: 'O cronómetro funciona assim: o prestador clica "Iniciar" no seu dispositivo → isso faz uma requisição POST /orders/{id}/timer/start ao servidor → o servidor regista o timestamp EXATO no banco de dados e cria uma sessão de timer → simultaneamente, dispara um evento WebSocket para todos conectados àquela encomenda (prestador E cliente) → ambos recebem a notificação em tempo real e seus cronómetros começam a contar. Importante: o tempo REAL é sempre calculado no servidor! Os cronómetros nos dispositivos são apenas displays visuais. A cada segundo, eles fazem polling para sincronizar com o servidor. Se houver divergência (ex: rede caiu), ao reconectar, o display ajusta automaticamente para o tempo correto do servidor.',
                    benefits: [
                        'Impossível manipular - cálculo server-side',
                        'Sincronização automática ao reconectar',
                        'Transparência total para ambas as partes',
                        'Audit trail completo de todas ações',
                    ],
                    items: [
                        'Tabela order_timer_sessions - armazena sessões com started_at, paused_at, stopped_at',
                        'Tabela order_time_entries - audit log de CADA ação (start, pause, resume, stop, dispute)',
                        'Cálculo de elapsed_seconds no servidor usando timestamps UTC',
                        'Session tokens únicos (UUID) para cada sessão ativa',
                        'Rate limiting: máximo 1 ação a cada 5 segundos (previne spam)',
                        'IP address e user agent registrados em cada entry (anti-fraude)',
                        'Broadcasting via Laravel Echo para sincronização real-time',
                        'Polling fallback a cada 5 segundos se WebSocket falhar',
                        'Campos timer_pause_count para monitorar comportamento suspeito',
                    ],
                },
                {
                    title: 'Sistema de Pausas e Retomadas',
                    description: 'Flexibilidade para pausar trabalho com rastreamento completo',
                    explanation: 'Durante o trabalho, o prestador pode precisar pausar (ex: esperar cliente aprovar algo, ir almoçar, problema técnico). Ao clicar "Pausar", o servidor regista o momento exato, congela a contagem, e opcionalmente o prestador pode escrever a razão da pausa. O tempo pausado NÃO conta para cobrança! O cliente vê "Timer Pausado" com a razão. Ao retomar, a contagem continua de onde parou. O sistema rastreia quantas vezes foi pausado - muitas pausas podem indicar problema e gerar alerta.',
                    benefits: [
                        'Honestidade - tempo pausado não é cobrado',
                        'Rastreamento de pausas excessivas (red flag)',
                        'Cliente informado do status em tempo real',
                        'Prestador pode justificar pausas',
                    ],
                    items: [
                        'Campo paused_duration_seconds separado de active_duration_seconds',
                        'Cálculo: tempo_cobrado = active_duration_seconds apenas',
                        'Campo "notes" opcional ao pausar (ex: "Aguardando aprovação do cliente")',
                        'Limite de pausas: se >10 pausas, admin é notificado automaticamente',
                        'Duração máxima de pausa: se pausado >4h sem retomar, alerta enviado',
                        'Cliente pode solicitar explicação se pausas frequentes',
                        'Estatísticas: tempo ativo vs pausado mostrado ao finalizar',
                    ],
                },
                {
                    title: 'Integração com Wallet - Ajustes Dinâmicos de Hold',
                    description: 'Sistema inteligente que ajusta o valor retido se tempo exceder orçamento',
                    explanation: 'Quando o serviço é contratado por hora (ex: 500 AOA/hora, estimativa 2h = 1.000 AOA), fazemos um hold inicial de 1.000 AOA na wallet do cliente. MAS, e se o trabalho demorar 3h? O sistema monitora constantemente! Quando o tempo calculado atinge 90% do valor inicial (900 AOA de 1.000 AOA), o sistema PAUSA o timer automaticamente e notifica ambos: "Orçamento quase esgotado. Cliente precisa aprovar horas extras ou o timer será pausado." O cliente pode: 1) Aprovar mais X horas (fazemos novo hold), 2) Pedir para finalizar agora, ou 3) Disputar. Isso protege ambos!',
                    benefits: [
                        'Cliente nunca paga mais que aprovou',
                        'Prestador não fica sem pagamento se demorar mais',
                        'Transparência em tempo real',
                        'Resolução antes de conflito',
                    ],
                    items: [
                        'Método WalletService::createAdditionalHold() - cria hold incremental',
                        'Threshold de alerta: 90% do valor original',
                        'Notificação push + email para ambos ao atingir threshold',
                        'Modal "Aprovar Horas Extras" para cliente com slider de quantidade',
                        'Verificação de saldo antes de criar hold adicional',
                        'Se saldo insuficiente: timer para automaticamente até recarga',
                        'Histórico de holds na wallet (original + incrementais)',
                        'Refund automático se tempo final < estimado',
                    ],
                },
                {
                    title: 'Sistema de Disputas de Tempo',
                    description: 'Cliente pode contestar tempo cobrado com revisão de admin',
                    explanation: 'Após o prestador parar o timer, o cliente vê: "Tempo total: 3h 25min = 1.712,50 AOA". Se achar excessivo, pode clicar "Disputar Tempo". Abre um modal onde informa: "Tempo que considero correto: 2h 30min" + "Razão: Prestador pausou mas deixou timer rodando". A disputa fica registrada, o pagamento fica retido (hold não é liberado), e um admin analisa o audit trail completo (todos os starts/pauses/resumes/stops com timestamps e IPs). Admin decide: manter tempo original, aceitar sugestão do cliente, ou definir tempo diferente. Decisão é final e binding.',
                    benefits: [
                        'Proteção contra cobrança abusiva',
                        'Audit trail para decisão justa',
                        'Admin tem todos os dados objetivos',
                        'Resolução formal com histórico',
                    ],
                    items: [
                        'Método TimeTrackingService::disputeTimer()',
                        'Campo client_disputed_at em orders',
                        'Tabela disputes com tipo "time_tracking"',
                        'Modal "Disputar Tempo" com campo de tempo correto + razão',
                        'Painel admin mostra: timeline completa de ações, IPs de cada ação, tempo em cada pausa',
                        'Gráfico visual de tempo ativo vs pausado',
                        'Admin pode ajustar manualmente o tempo final',
                        'Notificações de decisão para ambos',
                        'Impacto no Salu Score se disputa procedente contra prestador',
                    ],
                },
            ],
        },
        {
            version: 'v2.3.0',
            date: '17 de Fevereiro, 2026',
            title: 'Sistema de Serviços Urgentes',
            icon: IconBolt,
            color: 'orange',
            description: 'Introduzimos a capacidade de solicitar serviços com prioridade alta, garantindo atendimento rápido quando você mais precisa.',
            features: [
                {
                    title: 'Modo de Serviço Urgente',
                    description: 'Precisa de um serviço com urgência? Agora pode solicitar atendimento prioritário!',
                    explanation: 'Quando marca um serviço como urgente, ele recebe prioridade máxima no sistema. O prestador é notificado imediatamente e o seu pedido aparece no topo da lista de encomendas. Perfeito para situações que não podem esperar!',
                    benefits: [
                        'Atendimento prioritário garantido',
                        'Prestador notificado instantaneamente',
                        'Tempo de entrega reduzido',
                        'Transparência total na taxa adicional',
                    ],
                    items: [
                        'Taxa adicional configurável pelo prestador (percentual ou valor fixo)',
                        'Sistema de limites de segurança: mínimo 100 AOA, máximo 50% do preço base',
                        'Priorização automática nas filas de encomendas',
                        'Badge visual laranja com efeito pulse animado',
                        'Tempo de entrega reduzido definido pelo prestador (ex: "24 horas")',
                        'Notificação instantânea ao prestador com destaque visual',
                        'Query scope prioritized() - orders urgentes aparecem primeiro',
                        'Campo urgent_requested_at para tracking de quando foi solicitado',
                    ],
                },
            ],
        },
        {
            version: 'v2.2.0',
            date: '17 de Fevereiro, 2026',
            title: 'Pacotes de Serviço',
            icon: IconPackage,
            color: 'green',
            description: 'Prestadores agora podem oferecer seus serviços em três níveis diferentes, facilitando a escolha do cliente e aumentando as opções disponíveis.',
            features: [
                {
                    title: 'Sistema de Pacotes (Básico, Profissional, Premium)',
                    description: 'Escolha o pacote que melhor se adapta às suas necessidades e orçamento',
                    explanation: 'Cada prestador pode configurar até 3 pacotes para o mesmo serviço. O pacote Básico oferece o essencial, o Profissional adiciona recursos extras (geralmente o mais popular), e o Premium inclui tudo com atendimento completo. Você vê exatamente o que está incluído em cada um antes de contratar.',
                    benefits: [
                        'Clareza total sobre o que está incluído',
                        'Opções para diferentes orçamentos',
                        'Comparação fácil entre níveis',
                        'Número definido de revisões por pacote',
                    ],
                    items: [
                        'Pacote Básico - Serviço essencial com funcionalidades core',
                        'Pacote Profissional - Mais escolhido! Recursos adicionais e revisões extras',
                        'Pacote Premium - Serviço completo com todas as features e suporte prioritário',
                        'Grid de comparação visual mostrando características de cada pacote',
                        'Número de revisões incluídas claramente indicado',
                        'Tempo de entrega específico para cada nível',
                        'Design responsivo com badge "Mais Popular" destacado',
                    ],
                },
            ],
        },
        {
            version: 'v2.1.0',
            date: '17 de Fevereiro, 2026',
            title: 'Sistema Inteligente de Recomendação',
            icon: IconSparkles,
            color: 'blue',
            description: 'Algoritmo inteligente que analisa múltiplas métricas para sugerir os melhores prestadores para o seu serviço, poupando tempo e aumentando as chances de satisfação.',
            features: [
                {
                    title: 'Algoritmo de Matching Inteligente',
                    description: 'Deixe o sistema encontrar os melhores prestadores para você',
                    explanation: 'Nosso algoritmo analisa 5 métricas diferentes de cada prestador e calcula um score ponderado. Prestadores que já te serviram bem ganham pontos extras, assim como aqueles da sua região. O resultado? Uma lista personalizada dos top 5 prestadores mais adequados para o seu pedido.',
                    benefits: [
                        'Economize tempo na busca',
                        'Maior probabilidade de satisfação',
                        'Sugestões personalizadas para você',
                        'Baseado em dados reais de performance',
                    ],
                    items: [
                        'Análise de 5 métricas: taxa de conclusão (30%), rating (25%), tempo de resposta (20%), pontualidade (15%), taxa de aceitação (10%)',
                        'Bônus de +10 pontos para prestadores que já te atenderam antes',
                        'Bônus de +5 pontos para prestadores da mesma localização',
                        'Bônus de +5 pontos para prestadores com badge Platinum',
                        'Bônus de +3 pontos para scores altos (≥75)',
                        'Analytics completo: monitoramos cliques e contratações para melhorar as sugestões',
                        'Taxa de conversão rastreada para otimização contínua',
                    ],
                },
                {
                    title: 'Interface Visual de Recomendações',
                    description: 'Cards informativos com todos os dados importantes',
                    explanation: 'As recomendações aparecem automaticamente na página do serviço, mostrando cards com foto, nome, Salu Score, rating, serviços concluídos e tempo médio de resposta de cada prestador sugerido.',
                    benefits: [
                        'Informação completa num só lugar',
                        'Comparação rápida entre prestadores',
                        'Acesso direto ao perfil completo',
                    ],
                    items: [
                        'Grid responsivo (1-3 colunas dependendo do dispositivo)',
                        'Salu Score badge visível em cada card',
                        'Tempo médio de resposta destacado',
                        'Número de serviços concluídos',
                        'Click tracking para melhorar futuras recomendações',
                    ],
                },
            ],
        },
        {
            version: 'v2.0.0',
            date: '17 de Fevereiro, 2026',
            title: 'Sistema de Reputação Avançado - Salu Score',
            icon: IconTrophy,
            color: 'yellow',
            description: 'Um sistema de reputação completamente objectivo baseado em métricas reais de performance. O Salu Score substitui avaliações subjetivas por dados concretos e verificáveis.',
            features: [
                {
                    title: 'Salu Score (0-100)',
                    description: 'Índice de confiança objectivo calculado automaticamente',
                    explanation: 'Diferente de um simples rating por estrelas, o Salu Score é calculado com base em 6 métricas diferentes de performance real. Cada métrica tem um peso específico na fórmula final. O score é recalculado automaticamente após cada serviço concluído, garantindo que está sempre atualizado.',
                    benefits: [
                        'Objectividade total - sem manipulação',
                        'Múltiplas dimensões de avaliação',
                        'Atualização automática em tempo real',
                        'Transparência nas métricas',
                    ],
                    items: [
                        '35% - Taxa de conclusão (quantos serviços foram realmente concluídos)',
                        '20% - Rating médio (avaliações dos clientes)',
                        '15% - Penalização por cancelamentos (menos cancelamentos = score maior)',
                        '10% - Penalização por reclamações (menos disputas = score maior)',
                        '15% - Pontualidade (entregas dentro do prazo prometido)',
                        '5% - Qualidade de resposta (tempo médio para responder mensagens)',
                        'Recálculo automático após conclusão, cancelamento ou avaliação',
                        'Histórico completo de evolução do score',
                    ],
                },
                {
                    title: 'Sistema de Badges de Reconhecimento',
                    description: 'Níveis visuais que mostram a categoria do prestador',
                    explanation: 'Os badges são atribuídos automaticamente baseados no Salu Score. Quanto maior o score, melhor o badge. Isso permite identificar rapidamente prestadores de excelência.',
                    benefits: [
                        'Identificação visual rápida de qualidade',
                        'Motivação para melhoria contínua',
                        'Diferenciação competitiva para prestadores',
                    ],
                    items: [
                        '🥉 Bronze (0-59) - Prestador iniciante, ainda construindo reputação',
                        '🥈 Prata (60-74) - Prestador competente com bom histórico',
                        '🥇 Ouro (75-89) - Prestador profissional com excelente performance',
                        '💎 Platina (90-100) - Elite! Excelência consistente em todas as métricas',
                        'Badge com tooltip interativo mostrando breakdown detalhado',
                        'Barra de progresso indicando quanto falta para o próximo nível',
                        'Cores e ícones distintos para cada nível',
                    ],
                },
                {
                    title: 'Métricas Detalhadas de Performance',
                    description: 'Monitoramento completo de todas as atividades',
                    explanation: 'Rastreamos automaticamente tudo que acontece: quantos serviços foram cancelados, quantas reclamações existem, qual a taxa de aceitação de pedidos, quantas entregas foram feitas no prazo, e qual o tempo médio de resposta do prestador.',
                    benefits: [
                        'Transparência total de histórico',
                        'Decisões informadas para clientes',
                        'Prestadores sabem onde melhorar',
                    ],
                    items: [
                        'Total de cancelamentos registrados',
                        'Total de reclamações e disputas',
                        'Taxa de aceitação de pedidos (quantos pedidos aceita vs. rejeita)',
                        'Taxa de entregas no prazo (pontualidade)',
                        'Tempo médio de resposta a mensagens (em minutos)',
                        'Data da última atividade na plataforma',
                        'Timestamp da última atualização do score',
                    ],
                },
            ],
        },
        {
            version: 'v1.0.0',
            date: 'Lançamento Inicial',
            title: 'Plataforma Base',
            icon: IconRocket,
            color: 'gray',
            description: 'A fundação do Salu: um marketplace completo e seguro para conectar clientes e prestadores de serviços em Angola.',
            features: [
                {
                    title: 'Funcionalidades Core',
                    description: 'Tudo que precisa para começar a contratar ou prestar serviços',
                    explanation: 'A plataforma base inclui todos os recursos essenciais: sistema de pagamento seguro com Wallet, verificação de identidade (KYC), três modelos de preço diferentes, sistema completo de avaliações, conversas privadas, e dashboards personalizados.',
                    benefits: [
                        'Segurança em todas as transações',
                        'Verificação de identidade dos prestadores',
                        'Flexibilidade de preços',
                        'Comunicação direta e privada',
                    ],
                    items: [
                        'Sistema de Escrow - Pagamento seguro com fundos retidos até conclusão',
                        'Wallet integrado para recargas e pagamentos instantâneos',
                        'KYC Verification - Verificação de identidade com documentos',
                        'Três modelos de pricing: preço fixo, por hora, ou variável',
                        'Sistema dual de Reviews (avalia o serviço E o prestador separadamente)',
                        'Ratings com estrelas de 1 a 5',
                        'Pagamentos via Stripe + modo simulado para desenvolvimento',
                        'Sistema de conversas privadas entre cliente e prestador',
                        'Gestão completa de encomendas com múltiplos status',
                        'Dashboard personalizado para clientes',
                        'Dashboard completo para prestadores com analytics',
                    ],
                },
            ],
        },
    ];

    const faqItems = [
        {
            category: 'Salu Score & Badges',
            questions: [
                {
                    question: 'Como é calculado o Salu Score?',
                    answer: 'O Salu Score é calculado automaticamente com base em 6 métricas ponderadas: Taxa de conclusão (35%), Rating médio (20%), Penalização por cancelamentos (15%), Penalização por reclamações (10%), Pontualidade (15%) e Qualidade de resposta (5%). Cada métrica é medida objetivamente e o score final vai de 0 a 100.',
                },
                {
                    question: 'Com que frequência o Salu Score é atualizado?',
                    answer: 'O score é recalculado automaticamente sempre que acontece algo relevante: conclusão de um serviço, cancelamento, nova avaliação ou disputa. Isso garante que o score reflete sempre a performance atual do prestador.',
                },
                {
                    question: 'Posso ver o histórico do Salu Score de um prestador?',
                    answer: 'Sim! Ao clicar no badge do Salu Score, você vê um tooltip com o breakdown detalhado de todas as métricas que compõem o score, incluindo progresso para o próximo nível de badge.',
                },
                {
                    question: 'O que significam os badges Bronze, Prata, Ouro e Platina?',
                    answer: 'Os badges são níveis de reconhecimento baseados no Salu Score: Bronze (0-59) para iniciantes, Prata (60-74) para competentes, Ouro (75-89) para profissionais, e Platina (90-100) para excelência máxima. São atribuídos automaticamente.',
                },
            ],
        },
        {
            category: 'Sistema de Recomendações',
            questions: [
                {
                    question: 'Como funciona o sistema de recomendações?',
                    answer: 'Quando você visualiza um serviço, nosso algoritmo analisa automaticamente todos os prestadores da mesma categoria e calcula um score baseado em 5 métricas de performance. Os top 5 são exibidos como recomendações personalizadas para você.',
                },
                {
                    question: 'As recomendações são iguais para todos?',
                    answer: 'Não! As recomendações são personalizadas. Prestadores que já te atenderam antes ganham +10 pontos de bônus. Prestadores da sua região ganham +5 pontos. Assim, você recebe sugestões mais relevantes para o seu contexto.',
                },
                {
                    question: 'Posso ignorar as recomendações e escolher outro prestador?',
                    answer: 'Claro! As recomendações são apenas sugestões para facilitar sua escolha. Você é livre para navegar e escolher qualquer prestador que preferir.',
                },
            ],
        },
        {
            category: 'Pacotes de Serviço',
            questions: [
                {
                    question: 'Qual é a diferença entre os pacotes Básico, Profissional e Premium?',
                    answer: 'Cada prestador define o que inclui em cada pacote. Geralmente: Básico tem o essencial, Profissional adiciona recursos extras e revisões (é o mais popular), e Premium inclui tudo com atendimento VIP. Compare as features listadas antes de escolher.',
                },
                {
                    question: 'Posso mudar de pacote depois de contratar?',
                    answer: 'Isso depende do prestador. Recomendamos conversar com ele antes de finalizar a contratação para esclarecer qualquer dúvida sobre alterações.',
                },
                {
                    question: 'Todos os serviços têm pacotes?',
                    answer: 'Não, é opcional. Alguns prestadores preferem oferecer apenas um preço único, outros criam pacotes. Quando há pacotes disponíveis, eles aparecem automaticamente na página do serviço.',
                },
            ],
        },
        {
            category: 'Serviços Urgentes',
            questions: [
                {
                    question: 'Como funciona o serviço urgente?',
                    answer: 'Ao marcar um serviço como urgente, você paga uma taxa adicional definida pelo prestador (pode ser percentual ou fixa). Em troca, seu pedido recebe prioridade máxima e o prestador é notificado instantaneamente com destaque visual.',
                },
                {
                    question: 'Quanto custa a taxa de urgência?',
                    answer: 'Cada prestador define sua própria taxa urgente. Para segurança, o sistema aplica limites: mínimo de 100 AOA e máximo de 50% do preço base do serviço. A taxa é mostrada claramente antes de você confirmar.',
                },
                {
                    question: 'Todo serviço pode ser urgente?',
                    answer: 'Não. O prestador precisa habilitar essa opção no serviço e definir a taxa adicional. Se o serviço suportar urgência, você verá a opção ao contratar.',
                },
                {
                    question: 'A urgência garante entrega mais rápida?',
                    answer: 'Sim! Quando o prestador habilita serviço urgente, ele define um tempo de entrega reduzido específico para pedidos urgentes (ex: "24 horas"). Isso é garantido contratualmente.',
                },
            ],
        },
        {
            category: 'Time Tracking (Cronómetro)',
            questions: [
                {
                    question: 'Como funciona o cronómetro em tempo real?',
                    answer: 'O prestador controla o cronómetro (iniciar, pausar, retomar, parar) e tanto ele quanto você veem o tempo em tempo real. O cálculo é feito 100% no servidor para evitar manipulação. Se a conexão cair, ao reconectar, o tempo sincroniza automaticamente com o servidor.',
                },
                {
                    question: 'O tempo pausado é cobrado?',
                    answer: 'Não! Apenas o tempo ativo conta. Se o prestador pausar para almoçar ou esperar aprovação, esse tempo não entra na cobrança final. Você vê separadamente: "Tempo Ativo" vs "Tempo Pausado".',
                },
                {
                    question: 'E se o trabalho demorar mais que o orçamento inicial?',
                    answer: 'Quando o tempo atinge 90% do valor orçado, o sistema avisa ambos e pausa automaticamente. Você decide: aprovar horas extras (fazemos novo hold na wallet), pedir para finalizar, ou disputar. Você nunca paga mais sem aprovar antes!',
                },
                {
                    question: 'Posso disputar o tempo cobrado?',
                    answer: 'Sim! Se achar que o tempo está errado, clique "Disputar Tempo" após o prestador parar o cronómetro. Informe o tempo que considera correto e a razão. Um admin analisa o histórico completo (todas pausas, IPs, timestamps) e decide. O pagamento fica retido até resolução.',
                },
                {
                    question: 'Como sei se o prestador não está a manipular o timer?',
                    answer: 'É impossível manipular! O cálculo é server-side, todas as ações são registradas com IP e timestamp, há rate limiting (1 ação a cada 5s), e há audit trail completo. Admins podem ver TODO o histórico de ações. Comportamento suspeito (ex: 20 pausas) gera alertas automáticos.',
                },
            ],
        },
        {
            category: 'AI Verification',
            questions: [
                {
                    question: 'O que é verificação AI?',
                    answer: 'É um sistema que usa Inteligência Artificial (AWS Rekognition) para comparar automaticamente a foto do documento com a selfie do prestador. O sistema analisa características faciais e gera um score de 0 a 100 indicando a probabilidade de ser a mesma pessoa.',
                },
                {
                    question: 'A IA aprova sozinha?',
                    answer: 'Não! A IA apenas ajuda na triagem. Um admin SEMPRE revê antes da aprovação final. Se o score AI for ≥80%, aparece um badge verde facilitando a decisão do admin, mas a decisão final é sempre humana.',
                },
                {
                    question: 'Quão precisa é a verificação AI?',
                    answer: 'AWS Rekognition tem precisão superior a 95% em comparação facial. Ele analisa 68 pontos de referência na face (distância entre olhos, formato do nariz, etc.) e é treinado com milhões de rostos. Mas sempre há revisão humana para garantir.',
                },
                {
                    question: 'Meus dados biométricos são seguros?',
                    answer: 'Sim! Pedimos consentimento explícito, enviamos via HTTPS criptografado, a AWS processa mas NÃO armazena imagens, e apagamos automaticamente após 30 dias. É GDPR compliant com audit trail completo.',
                },
            ],
        },
        {
            category: 'Progressive Web App (PWA)',
            questions: [
                {
                    question: 'O que é uma PWA?',
                    answer: 'É uma tecnologia que permite websites funcionarem como apps nativas. Você instala o Salu no telemóvel com um ícone na tela inicial, funciona em tela cheia, recebe notificações, e funciona offline - tudo SEM baixar de app store!',
                },
                {
                    question: 'Como instalo a PWA no meu telemóvel?',
                    answer: 'Android Chrome: visite salu.ao, verá um banner "Instalar Salu", clique Instalar. iOS Safari: visite salu.ao, toque no botão Compartilhar, escolha "Adicionar à Tela de Início". Pronto! O ícone verde aparece na tela inicial.',
                },
                {
                    question: 'Funciona offline mesmo?',
                    answer: 'Sim! O Service Worker salva páginas visitadas em cache. Se ficar sem internet, você ainda pode ver serviços que já visitou, navegar no histórico, etc. Ações que precisam de internet (contratar, pagar) ficam desabilitadas até reconectar.',
                },
                {
                    question: 'Ocupa muito espaço no telemóvel?',
                    answer: 'Não! Uma PWA típica ocupa ~5MB, muito menos que apps nativas (50-200MB). Os recursos são salvos em cache do navegador, que é automaticamente gerenciado pelo sistema operacional.',
                },
                {
                    question: 'Como atualizo a PWA?',
                    answer: 'Atualizações são automáticas! O Service Worker verifica updates a cada hora. Se houver nova versão, baixa em background e aplica na próxima vez que você abrir o app. Sem precisar ir na app store!',
                },
            ],
        },
        {
            category: 'Segurança e Pagamentos',
            questions: [
                {
                    question: 'Como funciona o sistema de Escrow?',
                    answer: 'Quando você contrata um serviço, o valor é retido (hold) na sua Wallet. O prestador só recebe o pagamento após você confirmar a conclusão satisfatória do serviço. Isso protege ambas as partes.',
                },
                {
                    question: 'O que é KYC Verification?',
                    answer: 'É a verificação de identidade. Prestadores precisam enviar documento de identificação e selfie para serem verificados. Isso garante que você está contratando pessoas reais e identificadas.',
                },
                {
                    question: 'Como funciona o Wallet?',
                    answer: 'O Wallet é sua carteira virtual na plataforma. Você recarrega com Stripe ou outros métodos e usa o saldo para contratar serviços. É mais rápido e seguro que pagamentos externos.',
                },
            ],
        },
        {
            category: 'Geral',
            questions: [
                {
                    question: 'Como faço para contratar um serviço?',
                    answer: 'Navegue pelos serviços, escolha o que precisa, clique em "Contratar Serviço", selecione o pacote se houver, marque como urgente se quiser prioridade, e confirme. O pagamento é retido na sua Wallet até a conclusão.',
                },
                {
                    question: 'Posso conversar com o prestador antes de contratar?',
                    answer: 'Sim! Use o botão "Enviar Mensagem" na página do serviço para tirar dúvidas antes de contratar. A conversa fica registrada no seu dashboard.',
                },
                {
                    question: 'O que acontece se não ficar satisfeito com o serviço?',
                    answer: 'Você pode abrir uma disputa explicando o problema. Nossa equipe analisa o caso e decide se há reembolso total, parcial, ou se o prestador deve refazer o trabalho. O dinheiro só é liberado após resolução.',
                },
                {
                    question: 'Como avalio um serviço que contratei?',
                    answer: 'Após a conclusão, você pode avaliar tanto o SERVIÇO quanto o PRESTADOR separadamente. Dê de 1 a 5 estrelas e deixe um comentário opcional. Sua avaliação ajuda outros clientes e afeta o Salu Score do prestador.',
                },
                {
                    question: 'Com que frequência a plataforma é atualizada?',
                    answer: 'Trabalhamos continuamente em melhorias! Todas as versões lançadas (v1.0.0 a v2.7.0) estão documentadas nesta página com explicações detalhadas. Novas funcionalidades são adicionadas regularmente baseadas no feedback dos utilizadores. Fique atento às notificações!',
                },
            ],
        },
    ];

    return (
        <PublicLayout>
            <Head title="Atualizações do Sistema - Salu" />

            {/* Hero Section */}
            <Box bg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)" py={60}>
                <Container size="lg">
                    <Stack align="center" gap="md">
                        <ThemeIcon size={80} radius="xl" variant="white" color="violet">
                            <IconSparkles size={40} />
                        </ThemeIcon>
                        <Title order={1} c="white" ta="center">
                            Atualizações do Sistema
                        </Title>
                        <Text size="lg" c="white" ta="center" maw={700}>
                            Descubra todas as novidades e melhorias que implementamos
                            para tornar a plataforma Salu cada vez mais segura, inteligente e eficiente
                        </Text>
                        <Group mt="md">
                            <Badge size="xl" variant="white" color="violet">
                                Versão Atual: v2.7.0
                            </Badge>
                        </Group>
                    </Stack>
                </Container>
            </Box>

            {/* Timeline Section */}
            <Container size="lg" py={60}>
                <Timeline active={-1} bulletSize={50} lineWidth={3} color="violet">
                    {updates.map((update, index) => {
                        const Icon = update.icon;
                        return (
                            <Timeline.Item
                                key={index}
                                bullet={
                                    <ThemeIcon
                                        size={50}
                                        variant="filled"
                                        color={update.color}
                                        radius="xl"
                                    >
                                        <Icon size={24} />
                                    </ThemeIcon>
                                }
                                title={
                                    <Group gap="md" mb="xs" wrap="wrap">
                                        <Badge size="lg" variant="filled" color={update.color}>
                                            {update.version}
                                        </Badge>
                                        <Text size="sm" c="dimmed">
                                            {update.date}
                                        </Text>
                                    </Group>
                                }
                            >
                                <Paper p="xl" radius="md" withBorder shadow="sm" mb="xl">
                                    <Title order={2} mb="sm">
                                        {update.title}
                                    </Title>
                                    <Text c="dimmed" mb="xl">
                                        {update.description}
                                    </Text>

                                    <Stack gap="xl">
                                        {update.features.map((feature, fIndex) => (
                                            <Box key={fIndex}>
                                                {/* Feature Header */}
                                                <Group mb="md" align="flex-start">
                                                    <ThemeIcon
                                                        size="xl"
                                                        variant="light"
                                                        color={update.color}
                                                        radius="md"
                                                    >
                                                        <IconCheck size={24} />
                                                    </ThemeIcon>
                                                    <Box style={{ flex: 1 }}>
                                                        <Text fw={700} size="xl" mb="xs">
                                                            {feature.title}
                                                        </Text>
                                                        <Text size="md" c="dimmed" mb="sm">
                                                            {feature.description}
                                                        </Text>

                                                        {/* Explanation */}
                                                        <Alert
                                                            icon={<IconInfoCircle size={20} />}
                                                            title="Como funciona"
                                                            color={update.color}
                                                            variant="light"
                                                            mb="md"
                                                        >
                                                            {feature.explanation}
                                                        </Alert>

                                                        {/* Benefits */}
                                                        {feature.benefits && (
                                                            <Paper p="md" bg="gray.0" radius="md" mb="md">
                                                                <Group gap="xs" mb="xs">
                                                                    <ThemeIcon size="sm" color="green" variant="light" radius="xl">
                                                                        <IconShieldCheck size={14} />
                                                                    </ThemeIcon>
                                                                    <Text fw={600} size="sm">
                                                                        Benefícios para Você
                                                                    </Text>
                                                                </Group>
                                                                <List
                                                                    spacing="xs"
                                                                    size="sm"
                                                                    icon={
                                                                        <ThemeIcon
                                                                            color="green"
                                                                            size={18}
                                                                            radius="xl"
                                                                            variant="light"
                                                                        >
                                                                            <IconCheck size={10} />
                                                                        </ThemeIcon>
                                                                    }
                                                                >
                                                                    {feature.benefits.map((benefit, bIndex) => (
                                                                        <List.Item key={bIndex}>
                                                                            <Text size="sm" fw={500}>
                                                                                {benefit}
                                                                            </Text>
                                                                        </List.Item>
                                                                    ))}
                                                                </List>
                                                            </Paper>
                                                        )}

                                                        {/* Technical Details */}
                                                        <Text size="sm" fw={600} mb="xs" c="dimmed">
                                                            Detalhes Técnicos:
                                                        </Text>
                                                        <List
                                                            spacing="xs"
                                                            size="sm"
                                                            icon={
                                                                <ThemeIcon
                                                                    color={update.color}
                                                                    size={18}
                                                                    radius="xl"
                                                                    variant="light"
                                                                >
                                                                    <IconCheck size={10} />
                                                                </ThemeIcon>
                                                            }
                                                        >
                                                            {feature.items.map((item, iIndex) => (
                                                                <List.Item key={iIndex}>
                                                                    <Text size="sm">{item}</Text>
                                                                </List.Item>
                                                            ))}
                                                        </List>
                                                    </Box>
                                                </Group>

                                                {fIndex < update.features.length - 1 && (
                                                    <Divider my="xl" />
                                                )}
                                            </Box>
                                        ))}
                                    </Stack>
                                </Paper>
                            </Timeline.Item>
                        );
                    })}
                </Timeline>
            </Container>

            {/* FAQ Section */}
            <Box bg="gray.0" py={60}>
                <Container size="lg">
                    <Stack align="center" mb="xl">
                        <ThemeIcon size={60} radius="xl" variant="light" color="violet">
                            <IconQuestionMark size={30} />
                        </ThemeIcon>
                        <Title order={2} ta="center">
                            Perguntas Frequentes (FAQ)
                        </Title>
                        <Text size="lg" c="dimmed" ta="center" maw={600}>
                            Tire suas dúvidas sobre as funcionalidades da plataforma
                        </Text>
                    </Stack>

                    <Stack gap="xl">
                        {faqItems.map((category, catIndex) => (
                            <Paper key={catIndex} p="lg" radius="md" withBorder shadow="sm">
                                <Group gap="sm" mb="md">
                                    <ThemeIcon size="lg" radius="md" variant="light" color="violet">
                                        <IconInfoCircle size={20} />
                                    </ThemeIcon>
                                    <Title order={3}>{category.category}</Title>
                                </Group>

                                <Accordion variant="separated" radius="md">
                                    {category.questions.map((item, qIndex) => (
                                        <Accordion.Item key={qIndex} value={`${catIndex}-${qIndex}`}>
                                            <Accordion.Control>
                                                <Text fw={600}>{item.question}</Text>
                                            </Accordion.Control>
                                            <Accordion.Panel>
                                                <Text>{item.answer}</Text>
                                            </Accordion.Panel>
                                        </Accordion.Item>
                                    ))}
                                </Accordion>
                            </Paper>
                        ))}
                    </Stack>
                </Container>
            </Box>

            {/* Footer Section */}
            <Container size="lg" py={40}>
                <Stack gap="md">
                    <Paper p="xl" radius="md" withBorder bg="green.0">
                        <Group>
                            <ThemeIcon size="xl" radius="xl" variant="light" color="green">
                                <IconCheck size={24} />
                            </ThemeIcon>
                            <Box style={{ flex: 1 }}>
                                <Text fw={600} size="lg" mb="xs">
                                    Plano Completo!
                                </Text>
                                <Text size="sm" c="dimmed">
                                    Todas as funcionalidades do plano de transformação foram implementadas com sucesso!
                                    Salu Score, Recomendações Inteligentes, Pacotes de Serviço, Modo Urgente, Time Tracking,
                                    Task Logging, AI Verification e PWA estão 100% operacionais. Continuamos melhorando
                                    continuamente baseado no seu feedback. Próximas melhorias: analytics avançados,
                                    integração com mais gateways de pagamento, e expansão para novas categorias de serviço!
                                </Text>
                            </Box>
                        </Group>
                    </Paper>

                    <Group justify="center" gap="xl">
                        <Paper p="md" radius="md" withBorder style={{ flex: 1, maxWidth: 200 }}>
                            <Stack align="center" gap="xs">
                                <ThemeIcon size="xl" radius="xl" variant="light" color="blue">
                                    <IconUsers size={24} />
                                </ThemeIcon>
                                <Text size="xl" fw={700}>2,400+</Text>
                                <Text size="sm" c="dimmed" ta="center">Prestadores Verificados</Text>
                            </Stack>
                        </Paper>
                        <Paper p="md" radius="md" withBorder style={{ flex: 1, maxWidth: 200 }}>
                            <Stack align="center" gap="xs">
                                <ThemeIcon size="xl" radius="xl" variant="light" color="green">
                                    <IconCheck size={24} />
                                </ThemeIcon>
                                <Text size="xl" fw={700}>12,500+</Text>
                                <Text size="sm" c="dimmed" ta="center">Serviços Concluídos</Text>
                            </Stack>
                        </Paper>
                        <Paper p="md" radius="md" withBorder style={{ flex: 1, maxWidth: 200 }}>
                            <Stack align="center" gap="xs">
                                <ThemeIcon size="xl" radius="xl" variant="light" color="yellow">
                                    <IconTrophy size={24} />
                                </ThemeIcon>
                                <Text size="xl" fw={700}>96%</Text>
                                <Text size="sm" c="dimmed" ta="center">Taxa de Satisfação</Text>
                            </Stack>
                        </Paper>
                        <Paper p="md" radius="md" withBorder style={{ flex: 1, maxWidth: 200 }}>
                            <Stack align="center" gap="xs">
                                <ThemeIcon size="xl" radius="xl" variant="light" color="grape">
                                    <IconDeviceMobile size={24} />
                                </ThemeIcon>
                                <Text size="xl" fw={700}>38%</Text>
                                <Text size="sm" c="dimmed" ta="center">Utilizadores PWA</Text>
                            </Stack>
                        </Paper>
                    </Group>
                </Stack>
            </Container>
        </PublicLayout>
    );
}
