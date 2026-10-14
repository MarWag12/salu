# Análise de Gap - Salu Service Marketplace

## Resumo Executivo

Este documento analisa o gap entre os requisitos definidos e o estado atual do codebase para informar a estratégia de implementação da plataforma Salu.

**Estado Atual**: Projecto parcialmente inicializado com base Laravel 12 + Breeze (Inertia/React) + FilamentPHP configurado.

**Nível de Maturidade**: ~15% implementado - estrutura básica de autenticação e gestão de utilizadores/prestadores existe, mas a maioria das funcionalidades core está em falta.

---

## 1. Investigação do Estado Actual

### 1.1 Estrutura de Directórios

```
app/
├── Filament/Resources/          # UserResource, ServiceProviderResource
├── Http/Controllers/Auth/       # Breeze controllers (login, register, etc.)
├── Http/Middleware/             # HandleInertiaRequests
├── Models/                      # User, ServiceProvider
└── Providers/                   # AdminPanelProvider (Filament)

database/migrations/             # 5 migrations existentes
resources/js/
├── Components/                  # Componentes Breeze (Checkbox, Button, etc.)
├── Layouts/                     # AuthenticatedLayout, GuestLayout
└── Pages/                       # Welcome, Dashboard, Auth/*, Profile/*
```

### 1.2 Componentes Existentes

| Componente | Ficheiros | Estado |
|------------|-----------|--------|
| **Model User** | `app/Models/User.php` | ✅ Implementado com tipos (admin/client/provider) |
| **Model ServiceProvider** | `app/Models/ServiceProvider.php` | ✅ Básico (sem KYC completo) |
| **Auth Controllers** | `app/Http/Controllers/Auth/*` | ✅ Breeze padrão |
| **Filament UserResource** | `app/Filament/Resources/UserResource.php` | ✅ CRUD completo |
| **Filament ServiceProviderResource** | `app/Filament/Resources/ServiceProviderResource.php` | ✅ CRUD básico |
| **Frontend Components** | `resources/js/Components/*` | ✅ Breeze padrão (Tailwind) |
| **Frontend Layouts** | `resources/js/Layouts/*` | ✅ Authenticated + Guest |

### 1.3 Convenções Identificadas

- **Padrão de Nomenclatura**: PascalCase para Models/Resources, camelCase para métodos
- **Arquitectura Filament**: Resources com Pages separadas (List, Create, Edit, View)
- **Frontend**: Componentes React funcionais, TypeScript, Tailwind CSS
- **Migrations**: Timestamps padrão Laravel, foreign keys com cascade
- **Tipos de Usuário**: Enum no banco (`admin`, `client`, `provider`)

### 1.4 Dependências Instaladas

**Backend (composer.json)**:
- Laravel 12, Filament 3.2, Inertia Laravel 2.0, Sanctum 4.0, Ziggy 2.0

**Frontend (package.json)**:
- React 18.2, @inertiajs/react 2.0, Tailwind CSS 3.2
- **FALTA**: Mantine UI (requisito do projecto)

---

## 2. Mapeamento Requisitos → Assets

### Legenda
- ✅ **Existente** - Funcionalidade já implementada
- 🔶 **Parcial** - Estrutura existe mas incompleta
- ❌ **Missing** - Não existe, necessita criação
- ⚠️ **Constraint** - Limitação arquitectural a considerar

| Requisito | Assets Existentes | Gap |
|-----------|-------------------|-----|
| **R1: Autenticação** | Controllers Auth, LoginRequest | 🔶 Falta escolha de tipo no registo |
| **R2: Perfil Prestador** | ServiceProvider model | ❌ Falta KYC documents, selfie, form completo |
| **R3: KYC** | is_verified no ServiceProvider | ❌ Falta sistema completo (estados, histórico, documentos) |
| **R4: Gestão Serviços** | - | ❌ Model, migration, controllers, pages |
| **R5: Aprovação Serviços** | - | ❌ Estados, workflow admin |
| **R6: Busca/Descoberta** | - | ❌ Search, filters, pages públicas |
| **R7: Destaques Pagos** | is_featured no ServiceProvider | ❌ Sistema de pagamentos, expiração |
| **R8: Mensagens** | - | ❌ Sistema completo |
| **R9: Notificações** | Notifiable trait | ❌ Notifications, centro in-app |
| **R10: Painel Admin** | UserResource, ServiceProviderResource | 🔶 Falta KYC, Services, Categories, Payments |
| **R11: Categorias** | - | ❌ Model, migration, Resource |
| **R12: Segurança** | Sanctum, Filament auth | 🔶 Falta Policies, rate limiting custom |
| **R13: Frontend** | Breeze components (Tailwind) | ❌ Mantine UI, layouts específicos |

---

## 3. Análise Detalhada de Gaps

### 3.1 Gaps Críticos (Bloqueadores)

#### Gap 1: Sistema KYC Completo
**Impacto**: Bloqueia R2, R3, R4, R5
- Falta model `KycVerification` com estados (pending, approved, rejected, resubmit)
- Falta tabela `kyc_documents` para armazenar ficheiros
- Falta histórico de alterações KYC
- Falta Filament Resource para gestão KYC

#### Gap 2: Módulo de Serviços
**Impacto**: Bloqueia R4, R5, R6, R7
- Falta model `Service` com campos: nome, categoria, preço, descrição, fotos, tags
- Falta model `ServiceImage` para galeria
- Falta model `Category`
- Falta estados de serviço e workflow de aprovação
- Falta estatísticas (views, clicks, conversions)

#### Gap 3: Mantine UI no Frontend
**Impacto**: Bloqueia R13
- package.json não inclui @mantine/core
- Componentes actuais são Tailwind/Breeze
- **Research Needed**: Estratégia de migração/coexistência Tailwind ↔ Mantine

### 3.2 Gaps Secundários

#### Gap 4: Sistema de Mensagens
- Falta models `Conversation`, `Message`
- Falta controllers e pages para inbox
- Falta real-time (websockets opcional)

#### Gap 5: Sistema de Pagamentos/Destaques
- Falta model `Payment` / `HighlightPayment`
- Falta integração com gateways (Stripe, PayPal, M-Pesa)
- Falta job para expiração automática
- **Research Needed**: Gateway M-Pesa para mercado africano

#### Gap 6: Notificações In-App
- Trait Notifiable existe mas sem notificações customizadas
- Falta centro de notificações frontend
- Falta broadcast para real-time

---

## 4. Opções de Implementação

### Opção A: Estender Componentes Existentes

**Quando aplicar**: User, ServiceProvider, FilamentPHP Resources

**Ficheiros a estender**:
- `User.php` - Adicionar relações para KYC, Notifications, Messages
- `ServiceProvider.php` - Adicionar relação com Services, KycVerification
- `UserResource.php` - Adicionar tabs para KYC inline
- `ServiceProviderResource.php` - Adicionar gestão KYC

**Trade-offs**:
- ✅ Aproveita estrutura existente
- ✅ Menos ficheiros novos
- ❌ Risco de bloat em Resources muito grandes
- ❌ ServiceProviderResource já está complexo

### Opção B: Criar Novos Componentes

**Quando aplicar**: Services, Categories, Messages, Payments, KYC

**Novos componentes propostos**:

| Módulo | Models | Filament Resources | Controllers | Pages |
|--------|--------|-------------------|-------------|-------|
| KYC | KycVerification, KycDocument | KycVerificationResource | - | - |
| Services | Service, ServiceImage | ServiceResource, CategoryResource | ServiceController | Services/* |
| Messages | Conversation, Message | - | MessageController | Messages/* |
| Payments | Payment, HighlightPlan | PaymentResource | PaymentController | Checkout/* |
| Categories | Category | CategoryResource | - | - |

**Trade-offs**:
- ✅ Separação clara de responsabilidades
- ✅ Facilita testes isolados
- ✅ Mais fácil de manter a longo prazo
- ❌ Mais ficheiros para navegar
- ❌ Requer design cuidadoso de interfaces

### Opção C: Abordagem Híbrida (Recomendada)

**Estratégia**:
1. **Estender** User e ServiceProvider com relações
2. **Criar** novos models para domínios distintos (Service, KYC, Message, Payment)
3. **Novos Resources** Filament para cada módulo
4. **Migrar gradualmente** frontend para Mantine

**Fases propostas**:
1. **Fase 1**: KYC + Categories (desbloqueiam Services)
2. **Fase 2**: Services + Search (core do marketplace)
3. **Fase 3**: Payments/Highlights + Messages
4. **Fase 4**: Notifications + Frontend Mantine

---

## 5. Complexidade e Risco

### Estimativa de Esforço por Módulo

| Módulo | Esforço | Justificação |
|--------|---------|--------------|
| R1: Auth (ajustes) | **S** (1-2 dias) | Estender registo existente |
| R2-R3: KYC | **M** (4-5 dias) | Novo sistema, upload documentos, estados |
| R4-R5: Services | **L** (7-10 dias) | Core do sistema, múltiplos models, admin workflow |
| R6: Busca | **M** (3-4 dias) | Query builder, filters, pagination |
| R7: Destaques | **M** (4-5 dias) | Pagamentos, jobs, integração gateway |
| R8: Mensagens | **M** (4-5 dias) | Sistema conversas, UI inbox |
| R9: Notificações | **M** (3-4 dias) | Notifications Laravel, centro in-app |
| R10: Admin | **M** (3-4 dias) | Novos Resources Filament |
| R11: Categorias | **S** (1-2 dias) | CRUD simples |
| R12: Segurança | **S** (2-3 dias) | Policies, middleware |
| R13: Frontend Mantine | **L** (7-10 dias) | Migração UI, novos layouts |

**Total Estimado**: **XL** (6-8 semanas para MVP completo)

### Avaliação de Risco

| Área | Risco | Motivo |
|------|-------|--------|
| Integração M-Pesa | **Alto** | API específica, documentação variável |
| Migração para Mantine | **Médio** | Coexistência com Tailwind, curva de aprendizagem |
| Upload de ficheiros | **Médio** | Validação, storage, performance |
| Real-time (mensagens) | **Médio** | Websockets opcional mas desejável |
| KYC Workflow | **Baixo** | Padrão conhecido, estados simples |
| Filament Resources | **Baixo** | Estrutura já estabelecida |

---

## 6. Recomendações para Design Phase

### Decisões Arquitecturais Necessárias

1. **Storage de Documentos**: Local vs S3/Cloud - impacta KYC e Service images
2. **Gateway de Pagamentos**: Priorizar Stripe (mais documentado) vs M-Pesa primeiro
3. **Real-time**: Laravel Echo + Pusher vs polling simples para MVP
4. **Mantine Strategy**: Substituição total vs coexistência gradual

### Research Items para Design

1. **M-Pesa API** - Requisitos de integração para mercado alvo
2. **Mantine + Inertia** - Configuração e best practices
3. **Laravel Media Library** - Para gestão de imagens (Spatie package)
4. **Laravel Scout** - Para pesquisa full-text em Services

### Abordagem Recomendada

**Hybrid (Opção C)** com implementação faseada:
- Começar pelo KYC (desbloqueia prestadores)
- Services e Categories em paralelo
- Pagamentos após Services estarem funcionais
- Frontend Mantine pode ser migrado incrementalmente

---

## 7. Schema de Dados Proposto (Alto Nível)

```
users (existente)
  ├── service_providers (existente, 1:1)
  │   ├── kyc_verifications (1:N) - NEW
  │   │   └── kyc_documents (1:N) - NEW
  │   └── services (1:N) - NEW
  │       ├── service_images (1:N) - NEW
  │       └── category (N:1) - NEW
  │
  ├── conversations (N:N via pivot) - NEW
  │   └── messages (1:N) - NEW
  │
  └── notifications (1:N) - Laravel built-in

categories - NEW
payments - NEW
highlight_plans - NEW
```

---

## Conclusão

O projecto tem uma base sólida com Laravel 12, Filament e Inertia/React configurados. O gap principal está na ausência dos módulos core (KYC, Services, Mensagens, Pagamentos) e na necessidade de migrar o frontend para Mantine UI.

A abordagem híbrida (Opção C) é recomendada, permitindo aproveitar a estrutura existente enquanto cria novos componentes para funcionalidades distintas.

**Próximo passo**: Executar `/kiro:spec-design salu-service-marketplace` para criar o design técnico detalhado.
