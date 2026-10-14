# Implementation Plan - Salu Service Marketplace

## Resumo

Este plano de implementação cobre todos os 13 requisitos da plataforma Salu, organizados em fases lógicas que permitem desenvolvimento incremental e validação contínua.

---

## Tasks

- [x] 1. Configurar dependências base e estrutura de dados
- [x] 1.1 Instalar e configurar Spatie Media Library para gestão de ficheiros
  - Adicionar package spatie/laravel-medialibrary ao projecto
  - Publicar migrations e configurações do package
  - Configurar collections para documentos KYC e imagens de serviços
  - Definir conversions para thumbnails em diferentes tamanhos
  - _Requirements: 2.4, 4.2, 12.1_

- [x] 1.2 (P) Criar migration e model para categorias de serviços
  - Definir estrutura da tabela com nome, descrição, ícone e estado activo
  - Criar model Category com scopes para ordenação alfabética
  - Adicionar índice no campo nome para queries de listagem
  - Implementar relação com serviços
  - _Requirements: 11.1, 11.2, 11.4_

- [x] 1.3 (P) Criar migration e model para verificações KYC
  - Definir tabela kyc_verifications com estados, motivo de rejeição e histórico
  - Criar tabela kyc_documents para armazenar referências de ficheiros
  - Criar tabela kyc_status_history para auditoria de alterações
  - Implementar enum KycStatus com estados: pending, approved, rejected, resubmit
  - Criar models com relações apropriadas
  - _Requirements: 3.1, 3.7_

- [x] 1.4 (P) Criar migration e model para serviços
  - Definir tabela services com todos os campos: nome, descrição, preços, localização, tags, estatísticas
  - Implementar enums ServiceStatus e PriceType
  - Adicionar índices para status, pesquisa full-text e expiração de destaques
  - Criar model Service com relações para provider, categoria e imagens
  - _Requirements: 4.1, 4.3, 4.4, 5.4_

- [x] 1.5 (P) Criar migrations e models para sistema de pagamentos
  - Definir tabela highlight_plans com duração, preço e moeda
  - Definir tabela payments com gateway, external_id, status e resposta
  - Implementar enum PaymentStatus
  - Criar models com relações apropriadas
  - Criar seeder com planos iniciais (7 dias, 30 dias)
  - _Requirements: 7.1, 7.6_

- [x] 1.6 (P) Criar migrations e models para sistema de mensagens
  - Definir tabela conversations com participantes e serviço associado
  - Definir tabela messages com conteúdo, remetente e estado de leitura
  - Adicionar constraint de unicidade para conversas
  - Criar models Conversation e Message com relações
  - _Requirements: 8.1, 8.3, 8.4_

---

- [x] 2. Implementar sistema de autenticação multi-perfil
- [x] 2.1 Estender formulário de registo para selecção de tipo de usuário
  - Adicionar campo de selecção entre "usuário comum" e "prestador de serviços"
  - Actualizar controller de registo para guardar tipo seleccionado
  - Criar ServiceProvider automaticamente quando tipo for provider
  - Redirecionar para dashboard apropriado após registo
  - _Requirements: 1.1, 1.6_

- [x] 2.2 Implementar rate limiting para tentativas de login
  - Configurar throttle de 5 tentativas por 15 minutos por IP
  - Registar tentativas falhadas com timestamp
  - Exibir mensagem informativa quando bloqueado
  - Desbloquear automaticamente após período de espera
  - _Requirements: 1.3, 1.5, 12.2_

- [x] 2.3 Configurar redirecionamento por tipo de usuário após autenticação
  - Criar middleware para verificar tipo de usuário
  - Implementar lógica de redirecionamento: admin → Filament, provider → dashboard prestador, client → área cliente
  - Actualizar LoginController para usar novo redirect
  - _Requirements: 1.2_

- [x] 2.4 Verificar funcionalidade de recuperação de password
  - Confirmar que email de reset é enviado correctamente
  - Validar que link expira após 60 minutos
  - Testar fluxo completo de redefinição
  - _Requirements: 1.4_

---

- [x] 3. Desenvolver sistema KYC completo
- [x] 3.1 Criar serviço de gestão KYC
  - Implementar método para submeter verificação com documentos
  - Validar tipos de ficheiro (jpg, png, pdf) e tamanho máximo (5MB)
  - Criar verificação com estado inicial "pendente"
  - Associar documentos usando Spatie Media Library
  - _Requirements: 2.4, 3.1, 12.1_

- [x] 3.2 (P) Implementar workflow de aprovação KYC
  - Criar método para admin aprovar verificação
  - Criar método para admin reprovar com motivo obrigatório
  - Criar método para admin solicitar reenvio de documentos
  - Registar todas as alterações no histórico com timestamp e admin responsável
  - Actualizar estado is_verified no ServiceProvider quando aprovado
  - _Requirements: 3.2, 3.3, 3.4, 3.7_

- [x] 3.3 (P) Criar políticas de autorização para KYC
  - Impedir prestadores não aprovados de criar serviços
  - Impedir prestadores não aprovados de aparecer em listagens públicas
  - Impedir prestadores não aprovados de enviar mensagens
  - Restringir acções de aprovação/rejeição apenas a admins
  - _Requirements: 3.5, 3.6, 8.5, 12.4_

- [x] 3.4 Criar Filament Resource para gestão de verificações KYC
  - Criar listagem com filtros por estado (pendentes primeiro)
  - Exibir documentos submetidos com pré-visualização
  - Implementar actions de aprovar, reprovar e solicitar reenvio
  - Adicionar modal para motivo de rejeição
  - Criar relation manager para histórico de estados
  - _Requirements: 10.4_

---

- [x] 4. Implementar gestão de perfil do prestador
- [x] 4.1 Criar página de perfil do prestador com formulário KYC
  - Exibir campos obrigatórios: nome completo, documento de identificação, selfie, morada, contactos
  - Implementar validação de campos obrigatórios
  - Exibir mensagem clara quando campos estão em falta
  - Mostrar estado actual da verificação KYC
  - _Requirements: 2.1, 2.2, 2.3_

- [x] 4.2 Implementar upload de documentos no perfil
  - Criar componente de upload com pré-visualização
  - Validar extensões permitidas e tamanho máximo
  - Armazenar documentos de forma segura em storage privado
  - Submeter verificação KYC automaticamente quando perfil completo
  - _Requirements: 2.4, 12.1, 13.6_

- [x] 4.3 (P) Permitir actualização de dados de contacto
  - Separar campos editáveis (contacto, morada) de campos bloqueados após KYC
  - Implementar actualização parcial do perfil
  - Validar alterações antes de guardar
  - _Requirements: 2.5_

---

- [x] 5. Desenvolver módulo de categorias
- [x] 5.1 Criar Filament Resource para categorias
  - Criar formulário com campos: nome, descrição, ícone opcional
  - Implementar listagem ordenada alfabeticamente
  - Adicionar toggle para activar/desactivar categorias
  - _Requirements: 10.5, 11.1, 11.2_

- [x] 5.2 Implementar protecção contra exclusão de categorias com serviços
  - Verificar se existem serviços associados antes de excluir
  - Exibir aviso com quantidade de serviços afectados
  - Implementar opção de reatribuição de serviços para outra categoria
  - _Requirements: 11.3_

---

- [x] 6. Implementar CRUD de serviços para prestadores
- [x] 6.1 Criar serviço de gestão de serviços
  - Implementar criação de serviço com validação de KYC aprovado
  - Suportar três tipos de preço: fixo, variável (faixa) e por hora
  - Processar campos opcionais: localização e tempo de entrega
  - Criar serviço com estado inicial "pendente"
  - _Requirements: 4.1, 4.3, 4.4, 4.7_

- [x] 6.2 Implementar gestão de imagens de serviços
  - Criar upload de imagem de capa obrigatória
  - Permitir até 5 imagens de galeria adicionais
  - Gerar thumbnails automaticamente
  - Implementar reordenação de imagens na galeria
  - _Requirements: 4.2, 12.1, 13.6_

- [x] 6.3 (P) Criar página de criação/edição de serviço para prestador
  - Implementar formulário com todos os campos necessários
  - Adicionar selecção de categoria com ordenação alfabética
  - Incluir gestão de tags com input dinâmico
  - Exibir pré-visualização de imagens antes de submeter
  - _Requirements: 4.1, 11.4_

- [x] 6.4 Implementar exclusão de serviços
  - Remover serviço e todas as imagens associadas
  - Solicitar confirmação antes de excluir
  - Registar exclusão em log para auditoria
  - _Requirements: 4.6_

- [x] 6.5 (P) Permitir edição de serviços publicados
  - Carregar dados existentes no formulário
  - Manter estado actual após edição
  - Validar alterações antes de guardar
  - _Requirements: 4.5_

---

- [x] 7. Desenvolver aprovação e estados de serviços
- [x] 7.1 Criar Filament Resource para gestão de serviços
  - Criar listagem com filtros por estado, categoria e prestador
  - Exibir imagens e dados do serviço na visualização
  - Implementar actions de aprovar, suspender e excluir
  - _Requirements: 10.6_

- [x] 7.2 Implementar workflow de aprovação de serviços
  - Actualizar estado para "publicado" quando aprovado
  - Actualizar estado para "suspenso" quando suspenso
  - Notificar prestador sobre alterações de estado
  - _Requirements: 5.1, 5.2, 9.1_

- [x] 7.3 (P) Implementar estatísticas de serviços
  - Criar tracking de visualizações quando serviço é acessado
  - Criar tracking de cliques para contacto
  - Implementar contador de conversões
  - Exibir estatísticas no dashboard do prestador
  - _Requirements: 5.5_

- [x] 7.4 Implementar visibilidade de serviços nas listagens
  - Ocultar serviços com estado diferente de "publicado" ou "destaque" das listagens públicas
  - Filtrar automaticamente serviços de prestadores não aprovados
  - _Requirements: 5.4_

---

- [x] 8. Implementar busca e descoberta de serviços
- [x] 8.1 Criar serviço de pesquisa
  - Implementar busca por nome, descrição, categoria e tags
  - Utilizar full-text search para resultados relevantes
  - Retornar resultados paginados
  - _Requirements: 6.1_

- [x] 8.2 (P) Implementar filtros de pesquisa
  - Filtrar por preço mínimo e máximo
  - Filtrar por categoria selecionada
  - Filtrar por localização quando especificada
  - Combinar múltiplos filtros simultaneamente
  - _Requirements: 6.2, 6.3, 6.4_

- [x] 8.3 Implementar ordenação com priorização de destaques
  - Exibir serviços em destaque primeiro nos resultados
  - Ordenar restantes por relevância ou data de publicação
  - _Requirements: 6.5_

- [x] 8.4 (P) Criar página pública de listagem de serviços
  - Exibir grid/lista de serviços com imagem, nome, preço e categoria
  - Implementar barra de pesquisa e painel de filtros
  - Incluir badge visual para serviços em destaque
  - Adicionar paginação ou scroll infinito
  - _Requirements: 13.1_

- [x] 8.5 Criar página de detalhes do serviço
  - Exibir todas as informações do serviço
  - Mostrar galeria de imagens com visualização expandida
  - Incluir informações do prestador
  - Adicionar botão para contactar prestador
  - Incrementar contador de visualizações ao aceder
  - _Requirements: 6.6_

---

- [x] 9. Desenvolver sistema de pagamentos e destaques
- [x] 9.1 Criar interface de gateway de pagamento
  - Definir contrato para criação de sessão de checkout
  - Definir contrato para verificação de webhook
  - Definir contrato para parsing de dados de pagamento
  - _Requirements: 7.5_

- [x] 9.2 Implementar gateway de simulação para desenvolvimento
  - Criar adapter que simula fluxo de pagamento
  - Gerar confirmação automática após delay
  - Permitir teste de cenários de sucesso e falha
  - _Requirements: 7.5_

- [x] 9.3 (P) Implementar integração com Stripe
  - Criar adapter usando Stripe PHP SDK
  - Implementar criação de Checkout Session
  - Configurar webhook endpoint para confirmações
  - Verificar assinatura de webhooks
  - _Requirements: 7.5_

- [x] 9.4 Criar serviço de pagamentos
  - Implementar iniciação de pagamento com plano e gateway selecionados
  - Criar registo de pagamento com estado "pendente"
  - Retornar URL de checkout do gateway
  - _Requirements: 7.1_

- [x] 9.5 Implementar processamento de confirmação de pagamento
  - Processar webhook de confirmação do gateway
  - Actualizar estado do pagamento para "completo"
  - Actualizar estado do serviço para "destaque"
  - Definir data de expiração do destaque
  - _Requirements: 7.2, 7.6_

- [x] 9.6 (P) Criar job de expiração de destaques
  - Criar job schedulado para verificar destaques expirados
  - Reverter estado do serviço para "publicado" quando expirado
  - Agendar execução diária
  - _Requirements: 7.4_

- [x] 9.7 Criar página de selecção de plano de destaque
  - Listar planos disponíveis com preço e duração
  - Mostrar resumo do plano selecionado
  - Permitir selecção de método de pagamento
  - Redirecionar para checkout do gateway
  - _Requirements: 7.1_

- [x] 9.8 Implementar badge visual de destaque
  - Criar componente visual para identificar serviços em destaque
  - Aplicar badge na listagem e nos detalhes do serviço
  - _Requirements: 7.3_

- [x] 9.9 Criar Filament Resource para pagamentos
  - Criar listagem read-only de pagamentos
  - Adicionar filtros por data, gateway e prestador
  - Exibir detalhes da resposta do gateway
  - _Requirements: 10.7_

---

- [x] 10. Implementar sistema de mensagens internas
- [x] 10.1 Criar serviço de mensagens
  - Implementar criação de conversa entre usuário e prestador
  - Associar conversa ao serviço quando aplicável
  - Verificar se prestador tem KYC aprovado antes de permitir envio
  - Evitar conversas duplicadas entre mesmos participantes sobre mesmo serviço
  - _Requirements: 8.1, 8.5_

- [x] 10.2 (P) Implementar envio e recepção de mensagens
  - Criar mensagem associada à conversa
  - Registar remetente e timestamp
  - Actualizar timestamp da última mensagem na conversa
  - Disparar notificação para destinatário
  - _Requirements: 8.1, 8.2_

- [x] 10.3 Criar página de inbox
  - Listar todas as conversas do usuário
  - Mostrar indicador de mensagens não lidas
  - Ordenar por última mensagem
  - Exibir preview da última mensagem
  - _Requirements: 8.4_

- [x] 10.4 (P) Criar página de conversa
  - Exibir histórico completo de mensagens ordenado cronologicamente
  - Implementar formulário de envio de nova mensagem
  - Marcar mensagens como lidas ao visualizar
  - Mostrar informações do serviço associado
  - _Requirements: 8.3_

---

- [x] 11. Desenvolver sistema de notificações
- [x] 11.1 Criar notification classes para eventos do sistema
  - Notification para alteração de estado KYC (aprovado/reprovado)
  - Notification para alteração de estado de serviço (aprovado/reprovado)
  - Notification para nova mensagem recebida
  - Configurar canais: email e database
  - _Requirements: 9.1, 9.2, 9.3_

- [x] 11.2 (P) Implementar notificação de novo serviço por categoria
  - Criar sistema de interesse por categoria para usuários
  - Disparar notificação quando novo serviço é publicado na categoria
  - Permitir opt-out de notificações
  - _Requirements: 9.4_

- [x] 11.3 Criar centro de notificações no frontend
  - Exibir lista de todas as notificações
  - Mostrar indicador de notificações não lidas
  - Implementar marcação como lida ao clicar
  - Adicionar badge no menu com contador de não lidas
  - _Requirements: 9.5, 9.6_

---

- [x] 12. Configurar painel administrativo completo
- [x] 12.1 Criar dashboard com estatísticas gerais
  - Widget com total de usuários registados
  - Widget com prestadores activos (KYC aprovado)
  - Widget com serviços publicados e em destaque
  - Widget com KYC pendentes de aprovação
  - Widget com volume financeiro de destaques
  - _Requirements: 10.1_

- [x] 12.2 (P) Completar Filament Resource de usuários
  - Adicionar opções de visualizar, editar e desactivar
  - Incluir filtros por tipo de usuário
  - Exibir estado de verificação de email
  - _Requirements: 10.2_

- [x] 12.3 (P) Completar Filament Resource de prestadores
  - Exibir estado KYC e serviços publicados
  - Adicionar link rápido para verificação KYC
  - Incluir opções de gestão de conta
  - _Requirements: 10.3_

- [x] 12.4 Restringir acesso ao painel apenas a administradores
  - Configurar policy de acesso no AdminPanelProvider
  - Verificar tipo de usuário "admin" para permitir acesso
  - Redirecionar usuários não autorizados
  - _Requirements: 10.8, 12.3_

---

- [x] 13. Implementar segurança e validações
- [x] 13.1 Criar policies de autorização para todos os models
  - ServicePolicy para operações em serviços
  - KycPolicy para operações de verificação
  - MessagePolicy para envio de mensagens
  - PaymentPolicy para operações de pagamento
  - _Requirements: 12.4, 12.5_

- [x] 13.2 (P) Configurar validação de uploads
  - Validar extensões permitidas (jpg, png, pdf)
  - Verificar tamanho máximo de 5MB
  - Validar MIME type no servidor
  - Sanitizar nomes de ficheiros
  - _Requirements: 12.1_

- [x] 13.3 (P) Implementar sanitização de inputs
  - Configurar Laravel request validation em todos os controllers
  - Prevenir XSS via escaping em React
  - Garantir prevenção de SQL injection via Eloquent
  - _Requirements: 12.6_

- [x] 13.4 Verificar hash de passwords
  - Confirmar que passwords são armazenadas com bcrypt
  - Validar que nunca são expostas em texto plano
  - _Requirements: 12.7_

---

- [x] 14. Migrar frontend para Mantine UI
- [x] 14.1 Instalar e configurar Mantine UI
  - Adicionar packages @mantine/core, @mantine/hooks, @mantine/form, @mantine/dates
  - Configurar MantineProvider no componente root
  - Criar tema base com cores e tipografia do projecto
  - Configurar coexistência com Tailwind CSS
  - _Requirements: 13.5_

- [x] 14.2 (P) Criar layout público com Mantine
  - Implementar header com navegação e pesquisa
  - Criar footer com links e informações
  - Aplicar design responsivo para mobile, tablet e desktop
  - _Requirements: 13.1, 13.2_

- [x] 14.3 (P) Criar dashboard do prestador com Mantine
  - Exibir resumo de serviços com estatísticas
  - Mostrar estado KYC e acções pendentes
  - Incluir acesso rápido a mensagens
  - _Requirements: 13.3, 13.4_

- [x] 14.4 (P) Criar área do usuário comum com Mantine
  - Implementar layout para cliente
  - Mostrar serviços favoritos ou recentes
  - Incluir acesso a mensagens
  - _Requirements: 13.3_

- [x] 14.5 Criar componentes de upload com pré-visualização
  - Implementar dropzone para arrastar ficheiros
  - Exibir preview de imagens antes de submeter
  - Mostrar progresso de upload
  - _Requirements: 13.6_

---

- [x] 15. Integração final e testes
- [x] 15.1 Implementar testes unitários para serviços core
  - Testes para KycService (submissão, aprovação, rejeição)
  - Testes para ServiceService (CRUD, validações)
  - Testes para PaymentService (iniciação, webhooks)
  - Testes para SearchService (filtros, ordenação)
  - _Requirements: 1.1, 3.1, 4.1, 6.1, 7.1_

- [x] 15.2 (P) Implementar testes de integração
  - Teste de fluxo completo KYC: submissão → aprovação → notificação
  - Teste de publicação de serviço: criação → aprovação → listagem
  - Teste de pagamento: checkout → webhook → destaque activo
  - Teste de mensagens: criação → envio → notificação
  - _Requirements: 3.1, 4.1, 7.1, 8.1_

- [x] 15.3 Testar fluxos end-to-end na interface
  - Testar registo e login com diferentes tipos de usuário
  - Testar submissão de perfil e KYC
  - Testar criação e publicação de serviço
  - Testar pesquisa e filtros
  - Testar checkout de destaque
  - Testar envio de mensagens
  - _Requirements: 1.1, 2.1, 4.1, 6.1, 7.1, 8.1_

---

## Requirements Coverage

| Requirement | Tasks |
|-------------|-------|
| 1.1 | 2.1, 15.1 |
| 1.2 | 2.3 |
| 1.3 | 2.2 |
| 1.4 | 2.4 |
| 1.5 | 2.2 |
| 1.6 | 2.1 |
| 2.1 | 4.1 |
| 2.2 | 4.1 |
| 2.3 | 4.1 |
| 2.4 | 1.1, 3.1, 4.2 |
| 2.5 | 4.3 |
| 3.1 | 1.3, 3.1, 15.1 |
| 3.2 | 3.2 |
| 3.3 | 3.2 |
| 3.4 | 3.2 |
| 3.5 | 3.3 |
| 3.6 | 3.3 |
| 3.7 | 1.3, 3.2 |
| 4.1 | 1.4, 6.1, 6.3, 15.1 |
| 4.2 | 1.1, 6.2 |
| 4.3 | 6.1 |
| 4.4 | 1.4, 6.1 |
| 4.5 | 6.5 |
| 4.6 | 6.4 |
| 4.7 | 6.1 |
| 5.1 | 7.2 |
| 5.2 | 7.2 |
| 5.3 | 7.1 |
| 5.4 | 1.4, 7.4 |
| 5.5 | 7.3 |
| 6.1 | 8.1, 15.1 |
| 6.2 | 8.2 |
| 6.3 | 8.2 |
| 6.4 | 8.2 |
| 6.5 | 8.3 |
| 6.6 | 8.5 |
| 7.1 | 1.5, 9.4, 9.7, 15.1 |
| 7.2 | 9.5 |
| 7.3 | 9.8 |
| 7.4 | 9.6 |
| 7.5 | 9.1, 9.2, 9.3 |
| 7.6 | 1.5, 9.5 |
| 8.1 | 1.6, 10.1, 10.2, 15.2 |
| 8.2 | 10.2 |
| 8.3 | 1.6, 10.4 |
| 8.4 | 1.6, 10.3 |
| 8.5 | 3.3, 10.1 |
| 9.1 | 7.2, 11.1 |
| 9.2 | 11.1 |
| 9.3 | 11.1 |
| 9.4 | 11.2 |
| 9.5 | 11.3 |
| 9.6 | 11.3 |
| 10.1 | 12.1 |
| 10.2 | 12.2 |
| 10.3 | 12.3 |
| 10.4 | 3.4 |
| 10.5 | 5.1 |
| 10.6 | 7.1 |
| 10.7 | 9.9 |
| 10.8 | 12.4 |
| 11.1 | 1.2, 5.1 |
| 11.2 | 5.1 |
| 11.3 | 5.2 |
| 11.4 | 1.2, 6.3 |
| 12.1 | 1.1, 3.1, 6.2, 13.2 |
| 12.2 | 2.2 |
| 12.3 | 12.4 |
| 12.4 | 3.3, 13.1 |
| 12.5 | 13.1 |
| 12.6 | 13.3 |
| 12.7 | 13.4 |
| 13.1 | 8.4, 14.2 |
| 13.2 | 14.2 |
| 13.3 | 14.3, 14.4 |
| 13.4 | 14.3 |
| 13.5 | 14.1 |
| 13.6 | 4.2, 6.2, 14.5 |
