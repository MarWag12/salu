# Requirements Document

## Introdução

Este documento define os requisitos funcionais da plataforma **Salu** — um marketplace de serviços que conecta usuários comuns a prestadores de serviços verificados. A plataforma inclui validação de identidade (KYC) para prestadores, sistema de destaques pagos, comunicação interna e um painel administrativo completo em FilamentPHP.

**Stack Tecnológico:**
- Backend: Laravel 12
- Frontend: Inertia.js + React + Mantine UI
- Painel Admin: FilamentPHP

**Tipos de Utilizadores:**
- Usuário comum (cliente)
- Prestador de serviços
- Administrador

---

## Requirements

### Requirement 1: Registo e Autenticação de Usuários

**Objective:** As a usuário ou prestador, I want criar uma conta e autenticar-me na plataforma, so that possa aceder às funcionalidades de acordo com o meu perfil.

#### Acceptance Criteria

1. When um visitante submete o formulário de registo com email e password válidos, the Sistema Salu shall criar uma nova conta e enviar email de confirmação.
2. When um usuário submete credenciais válidas no formulário de login, the Sistema Salu shall autenticar o usuário e redirecionar para o dashboard apropriado.
3. If um usuário submete credenciais inválidas, then the Sistema Salu shall exibir mensagem de erro e incrementar contador de tentativas falhadas.
4. When um usuário solicita recuperação de password, the Sistema Salu shall enviar email com link de redefinição válido por 60 minutos.
5. While o contador de tentativas de login exceder 5 em 15 minutos, the Sistema Salu shall bloquear temporariamente novas tentativas do mesmo IP.
6. When um usuário se regista, the Sistema Salu shall permitir escolha entre perfil "usuário comum" ou "prestador de serviços".

---

### Requirement 2: Gestão de Perfil do Prestador

**Objective:** As a prestador de serviços, I want completar o meu perfil com dados pessoais e documentos, so that possa passar pelo processo de verificação KYC.

#### Acceptance Criteria

1. When um prestador acede à página de perfil, the Sistema Salu shall exibir formulário com campos obrigatórios: nome completo, documento de identificação, selfie, morada e contactos.
2. When um prestador submete todos os campos obrigatórios do perfil, the Sistema Salu shall guardar os dados e iniciar o processo de verificação KYC com estado "Pendente".
3. If um prestador tenta submeter o perfil com campos obrigatórios em falta, then the Sistema Salu shall exibir mensagem indicando os campos necessários.
4. When um prestador faz upload de documento ou selfie, the Sistema Salu shall validar extensão (jpg, png, pdf), tamanho máximo (5MB) e armazenar de forma segura.
5. The Sistema Salu shall permitir ao prestador atualizar os seus dados de contacto e morada a qualquer momento.

---

### Requirement 3: Processo de Verificação KYC

**Objective:** As a administrador, I want validar a identidade dos prestadores através de documentos submetidos, so that apenas prestadores verificados possam publicar serviços.

#### Acceptance Criteria

1. When um prestador submete documentos KYC, the Sistema Salu shall criar registo de verificação com estado "Pendente" e notificar administradores.
2. When um administrador aprova a verificação KYC, the Sistema Salu shall atualizar estado para "Aprovado" e notificar o prestador por email e notificação in-app.
3. When um administrador reprova a verificação KYC com motivo, the Sistema Salu shall atualizar estado para "Reprovado" e notificar o prestador com o motivo.
4. When um administrador solicita reenvio de documentos, the Sistema Salu shall atualizar estado para "Reenviar Documentos" e notificar o prestador.
5. While um prestador tiver estado KYC diferente de "Aprovado", the Sistema Salu shall impedir a publicação de serviços.
6. While um prestador tiver estado KYC diferente de "Aprovado", the Sistema Salu shall ocultar o prestador das listagens públicas.
7. The Sistema Salu shall manter histórico de todas as alterações de estado KYC com timestamp e administrador responsável.

---

### Requirement 4: Criação e Gestão de Serviços

**Objective:** As a prestador aprovado, I want criar, editar e gerir os meus serviços, so that clientes possam encontrá-los e contratá-los.

#### Acceptance Criteria

1. When um prestador aprovado submete formulário de novo serviço, the Sistema Salu shall criar serviço com estado "Pendente" incluindo: nome, categoria, tipo de preço, descrição, fotos e tags.
2. When um prestador faz upload de fotos para serviço, the Sistema Salu shall aceitar imagem de capa obrigatória e até 5 imagens de galeria.
3. When um prestador define preço do serviço, the Sistema Salu shall aceitar três tipos: fixo, variável (faixa) ou por hora.
4. The Sistema Salu shall permitir ao prestador definir localização e tempo de entrega/disponibilidade como campos opcionais.
5. When um prestador edita um serviço publicado, the Sistema Salu shall guardar alterações mantendo o estado atual.
6. When um prestador solicita exclusão de serviço, the Sistema Salu shall remover o serviço e todas as suas imagens associadas.
7. While um prestador não estiver aprovado no KYC, the Sistema Salu shall bloquear acesso ao formulário de criação de serviços.

---

### Requirement 5: Aprovação e Estados de Serviços

**Objective:** As a administrador, I want aprovar, suspender ou excluir serviços submetidos, so that apenas serviços adequados sejam visíveis publicamente.

#### Acceptance Criteria

1. When um administrador aprova um serviço pendente, the Sistema Salu shall atualizar estado para "Publicado" e notificar o prestador.
2. When um administrador suspende um serviço, the Sistema Salu shall atualizar estado para "Suspenso" e remover da listagem pública.
3. When um administrador exclui um serviço, the Sistema Salu shall remover permanentemente o serviço e suas imagens.
4. While um serviço tiver estado diferente de "Publicado" ou "Destaque", the Sistema Salu shall ocultar o serviço das listagens públicas.
5. The Sistema Salu shall exibir estatísticas do serviço ao prestador: visualizações, cliques e conversões.

---

### Requirement 6: Busca e Descoberta de Serviços

**Objective:** As a usuário comum, I want pesquisar e filtrar serviços disponíveis, so that possa encontrar o serviço adequado às minhas necessidades.

#### Acceptance Criteria

1. When um usuário submete termo de pesquisa, the Sistema Salu shall retornar serviços que correspondam por nome, descrição, categoria ou tags.
2. When um usuário aplica filtro de preço mínimo/máximo, the Sistema Salu shall exibir apenas serviços dentro da faixa especificada.
3. When um usuário aplica filtro de categoria, the Sistema Salu shall exibir apenas serviços da categoria selecionada.
4. When um usuário aplica filtro de localização, the Sistema Salu shall exibir apenas serviços disponíveis na localização especificada.
5. The Sistema Salu shall ordenar resultados de pesquisa exibindo serviços em destaque primeiro.
6. When um usuário clica num serviço da lista, the Sistema Salu shall exibir página completa com todos os detalhes, fotos e informações do prestador.

---

### Requirement 7: Sistema de Destaques Pagos

**Objective:** As a prestador, I want pagar para destacar os meus serviços, so that tenham maior visibilidade e apareçam no topo dos resultados.

#### Acceptance Criteria

1. When um prestador seleciona plano de destaque (7 ou 30 dias), the Sistema Salu shall exibir resumo com preço e redirecionar para pagamento.
2. When um pagamento de destaque é confirmado, the Sistema Salu shall atualizar estado do serviço para "Destaque" e registar data de expiração.
3. While um serviço estiver em destaque, the Sistema Salu shall exibir badge visual de destaque na listagem.
4. When a data de expiração do destaque é atingida, the Sistema Salu shall remover automaticamente o estado de destaque e reverter para "Publicado".
5. The Sistema Salu shall suportar múltiplos métodos de pagamento: simulação (desenvolvimento), M-Pesa, PayPal e Stripe.
6. The Sistema Salu shall registar todos os pagamentos de destaque com: valor, método, data, serviço e prestador.

---

### Requirement 8: Sistema de Mensagens Internas

**Objective:** As a usuário ou prestador, I want comunicar através de mensagens internas, so that possa esclarecer dúvidas antes de contratar um serviço.

#### Acceptance Criteria

1. When um usuário envia mensagem a um prestador sobre um serviço, the Sistema Salu shall criar conversa associada ao serviço e notificar o prestador.
2. When um destinatário recebe nova mensagem, the Sistema Salu shall enviar notificação por email e notificação in-app.
3. The Sistema Salu shall exibir histórico completo de mensagens ordenado cronologicamente em cada conversa.
4. When um usuário ou prestador acede à caixa de mensagens, the Sistema Salu shall listar todas as conversas com indicador de mensagens não lidas.
5. While um prestador não estiver aprovado no KYC, the Sistema Salu shall impedir o envio de mensagens pelo prestador.

---

### Requirement 9: Sistema de Notificações

**Objective:** As a usuário do sistema, I want receber notificações sobre eventos importantes, so that esteja informado sobre alterações relevantes.

#### Acceptance Criteria

1. When um serviço é aprovado ou reprovado, the Sistema Salu shall notificar o prestador por email e notificação in-app.
2. When a verificação KYC é aprovada ou reprovada, the Sistema Salu shall notificar o prestador por email e notificação in-app.
3. When uma nova mensagem é recebida, the Sistema Salu shall notificar o destinatário por email e notificação in-app.
4. When um prestador publica novo serviço, the Sistema Salu shall permitir notificar usuários interessados na categoria.
5. The Sistema Salu shall exibir centro de notificações in-app com lista de todas as notificações e estado lido/não lido.
6. When um usuário marca notificação como lida, the Sistema Salu shall atualizar o estado da notificação.

---

### Requirement 10: Painel Administrativo (FilamentPHP)

**Objective:** As a administrador, I want gerir todos os aspectos da plataforma através de um painel centralizado, so that possa administrar usuários, prestadores, serviços e verificações.

#### Acceptance Criteria

1. The Painel Admin shall exibir dashboard com estatísticas: total de usuários, prestadores activos, serviços publicados, serviços em destaque, KYC pendentes e volume financeiro.
2. When um administrador acede à gestão de usuários, the Painel Admin shall listar todos os usuários com opções de visualizar, editar e desativar.
3. When um administrador acede à gestão de prestadores, the Painel Admin shall listar todos os prestadores com estado KYC, serviços publicados e opções de gestão.
4. When um administrador acede à gestão de KYC, the Painel Admin shall listar verificações pendentes com documentos, opções de aprovar, reprovar ou solicitar reenvio.
5. When um administrador acede à gestão de categorias, the Painel Admin shall permitir criar, editar e excluir categorias de serviços.
6. When um administrador acede à gestão de serviços, the Painel Admin shall listar todos os serviços com opções de aprovar, suspender e excluir.
7. When um administrador acede aos pagamentos de destaque, the Painel Admin shall listar histórico com filtros por data, método e prestador.
8. The Painel Admin shall ser acessível apenas a usuários com role de administrador.

---

### Requirement 11: Gestão de Categorias de Serviços

**Objective:** As a administrador, I want gerir categorias de serviços, so that os serviços estejam organizados de forma estruturada.

#### Acceptance Criteria

1. When um administrador cria nova categoria, the Sistema Salu shall guardar nome, descrição e ícone opcional.
2. When um administrador edita categoria existente, the Sistema Salu shall atualizar informações mantendo associações com serviços.
3. If um administrador tenta excluir categoria com serviços associados, then the Sistema Salu shall exibir aviso e solicitar reatribuição dos serviços.
4. The Sistema Salu shall exibir categorias ordenadas alfabeticamente na listagem pública e nos formulários de criação de serviço.

---

### Requirement 12: Segurança e Validações

**Objective:** As a administrador do sistema, I want garantir segurança e integridade dos dados, so that a plataforma esteja protegida contra acessos não autorizados e dados inválidos.

#### Acceptance Criteria

1. The Sistema Salu shall validar todos os uploads de ficheiros: extensões permitidas (jpg, png, pdf), tamanho máximo (5MB) e verificação de conteúdo.
2. While um IP exceder limite de tentativas de login, the Sistema Salu shall aplicar rate limiting bloqueando temporariamente.
3. The Sistema Salu shall restringir acesso ao painel FilamentPHP apenas a usuários com role "admin".
4. The Sistema Salu shall aplicar políticas de autorização (Policies) para todas as operações sensíveis.
5. If um usuário tenta aceder a recurso não autorizado, then the Sistema Salu shall retornar erro 403 e registar tentativa em log.
6. The Sistema Salu shall sanitizar todos os inputs de usuário para prevenir XSS e SQL injection.
7. The Sistema Salu shall armazenar passwords com hash bcrypt e nunca em texto plano.

---

### Requirement 13: Interface Pública (Frontend)

**Objective:** As a visitante ou usuário, I want navegar numa interface intuitiva e responsiva, so that possa utilizar a plataforma em qualquer dispositivo.

#### Acceptance Criteria

1. The Frontend shall exibir página inicial com pesquisa destacada, categorias populares e serviços em destaque.
2. The Frontend shall ser responsivo e funcionar correctamente em dispositivos móveis, tablets e desktops.
3. When um usuário navega pela plataforma, the Frontend shall exibir layouts distintos: público (home, busca), dashboard do prestador e área do usuário comum.
4. When um prestador acede ao dashboard, the Frontend shall exibir resumo dos seus serviços, estatísticas e mensagens.
5. The Frontend shall utilizar componentes Mantine UI para consistência visual e acessibilidade.
6. When um usuário faz upload de imagem, the Frontend shall exibir pré-visualização antes de submeter.

---

## Project Description (Input)

Construir uma plataforma web de serviços onde:

- Usuários comuns procuram e contratam serviços
- Prestadores de serviços criam contas, cadastram serviços e podem pagar para aparecer em destaque
- Existe validação de identidade (KYC) para os prestadores
- O painel administrativo é totalmente desenvolvido em FilamentPHP

**Stack Tecnológico:**
- Laravel 12 (Backend)
- InertiaJS + React + Mantine UI (Frontend)
- FilamentPHP (Painel Administrativo)
