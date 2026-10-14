# Research & Design Decisions - Salu Service Marketplace

---
**Purpose**: Documentar descobertas de investigação, decisões arquitecturais e racional que informam o design técnico.
---

## Summary

- **Feature**: `salu-service-marketplace`
- **Discovery Scope**: New Feature (greenfield) com elementos de Extension
- **Key Findings**:
  - Mantine UI possui starter kits oficiais para Laravel + Inertia + React, facilitando integração
  - Spatie Laravel Media Library é a solução standard para gestão de imagens com suporte FilamentPHP
  - Padrão Maker-Checker do FilamentPHP adequado para workflows KYC
  - M-Pesa requer packages específicos (savannabits/daraja) para integração Safaricom Daraja API

---

## Research Log

### Mantine UI + Inertia.js + Laravel Integration

- **Context**: Requisito R13 especifica Mantine UI no frontend, mas codebase actual usa Tailwind/Breeze
- **Sources Consulted**:
  - [Laravel Jetstream React Mantine Starter Kit](https://github.com/adrum/laravel-jetstream-react-mantine)
  - [RILT Mantine Starter](https://packagist.org/packages/isaachatilima/rilt-mantine-starter)
  - [LaratineAdmin Dashboard](https://dev.to/tamarack/laratineadmin-a-simple-laravelinertareact-dashboard-4l3a)
  - [Inertia.js Official](https://inertiajs.com/)
- **Findings**:
  - Existem múltiplos starter kits: adrum/laravel-react-mantine-starter-kit, isaachatilima/rilt-mantine-starter
  - LaratineAdmin oferece dashboard completo com Laravel 11 + Inertia + React + Mantine
  - Mantine UI v7+ suporta React 18.2 (compatível com stack actual)
  - Coexistência Mantine + Tailwind é possível mas requer configuração CSS cuidadosa
- **Implications**:
  - Instalar @mantine/core, @mantine/hooks, @mantine/form, @mantine/dates
  - Configurar MantineProvider no app.tsx
  - Migração gradual dos componentes Breeze para Mantine
  - Manter Tailwind para utilitários de layout, Mantine para componentes UI

### KYC Verification Workflow com FilamentPHP

- **Context**: Sistema KYC requer workflow de aprovação multi-estado com histórico
- **Sources Consulted**:
  - [Maker-Checker Workflow in Laravel Filament V3](https://ajaxray.com/blog/maker-checker-approval-workflow-laravel-filament/)
  - [FilamentPHP Validation Docs](https://filamentphp.com/docs/3.x/forms/validation)
  - [HyperVerge KYC Package](https://packagist.org/packages/3neti/hyperverge)
- **Findings**:
  - Padrão Maker-Checker (four-eyes principle) é ideal para KYC
  - Filament V3 funciona com Laravel 12 sem problemas
  - Actions do Filament permitem botões de Aprovar/Reprovar/Reenviar
  - Histórico pode ser implementado com model separado KycStatusHistory
- **Implications**:
  - Implementar estados: pending, approved, rejected, resubmit
  - Usar Filament Actions para transições de estado
  - Criar KycVerification model com relação ao ServiceProvider
  - Manter audit trail com timestamps e admin_id

### Spatie Laravel Media Library para Imagens

- **Context**: Serviços precisam de imagem de capa + galeria (até 5 imagens), KYC precisa de documentos e selfie
- **Sources Consulted**:
  - [Spatie Media Library v11 Docs](https://spatie.be/docs/laravel-medialibrary/v11/introduction)
  - [Filament Spatie Media Library Plugin](https://filamentphp.com/plugins/filament-spatie-media-library)
  - [Laravel 12 Spatie Medialibrary Guide](https://kritimyantra.com/blogs/laravel-12-image-upload-spatie-medialibrary)
- **Findings**:
  - Spatie Media Library v11 é compatível com Laravel 12
  - Plugin oficial Filament integra-se perfeitamente
  - Suporta collections para separar tipos (cover, gallery, documents, selfie)
  - Conversions permitem gerar thumbnails automaticamente
  - Suporta S3 e storage local
- **Implications**:
  - Instalar spatie/laravel-medialibrary:^11.0
  - Instalar filament/spatie-laravel-media-library-plugin
  - Definir collections: services (cover, gallery), kyc (document, selfie)
  - Configurar conversions para thumbnails (300x300, 800x600)

### Payment Gateways Integration

- **Context**: Sistema de destaques requer múltiplos métodos de pagamento (Stripe, PayPal, M-Pesa)
- **Sources Consulted**:
  - [Stripe API Integration Laravel](https://eliteui.com/blog/2025/04/15/stripe-api-integration-laravel/)
  - [Laravel Cashier Stripe](https://laravel.com/docs/11.x/billing)
  - [Integrating PayPal and Stripe in Laravel](https://geekyants.com/blog/integrating-payment-systems-in-laravel-paypal-and-stripe)
  - [Safaricom Daraja API](https://developer.safaricom.co.ke/)
  - [savannabits/daraja Laravel Package](https://github.com/savannabits/daraja)
  - [Iankumu/mpesa Laravel Package](https://github.com/Iankumu/mpesa)
- **Findings**:
  - **Stripe**: stripe/stripe-php + Payment Intents API para 3D Secure
  - **PayPal**: srmklive/paypal ou API REST directa
  - **M-Pesa**: savannabits/daraja ou Iankumu/mpesa para Safaricom Daraja API
  - M-Pesa usa OAuth 2.0 + STK Push para pagamentos móveis
  - Taxas: Stripe 2.9%+30¢, PayPal 2.9%+30¢
- **Implications**:
  - Criar abstração PaymentGatewayInterface para uniformizar gateways
  - Implementar adapters: StripeGateway, PayPalGateway, MpesaGateway
  - Para MVP: começar com Stripe + simulação, adicionar M-Pesa depois
  - Webhooks necessários para confirmação assíncrona

---

## Architecture Pattern Evaluation

| Option | Description | Strengths | Risks / Limitations | Notes |
|--------|-------------|-----------|---------------------|-------|
| **Modular Monolith** | Separação lógica em módulos dentro do Laravel | Simplicidade deploy, consistência transaccional, adequado para escala inicial | Pode dificultar scaling futuro | Recomendado para MVP |
| **Clean Architecture** | Camadas domain/application/infrastructure | Testabilidade, independência de frameworks | Overhead de abstração, curva de aprendizagem | Excessivo para este scope |
| **CQRS** | Separar comandos e queries | Performance leitura, escalabilidade | Complexidade, eventual consistency | Futuro se necessário |

**Decisão**: Modular Monolith com separação clara por domínio (Auth, KYC, Services, Payments, Messages, Notifications).

---

## Design Decisions

### Decision: Estrutura de Módulos do Sistema

- **Context**: Sistema tem 13 requisitos que precisam de organização clara
- **Alternatives Considered**:
  1. Estrutura flat - todos os models/controllers na raiz
  2. Feature folders - agrupar por feature/domínio
  3. Domain-driven - separação rigorosa bounded contexts
- **Selected Approach**: Feature folders com namespaces organizados
- **Rationale**: Equilibra organização com simplicidade Laravel, facilita navegação
- **Trade-offs**: Requer disciplina para manter boundaries, menos isolado que DDD
- **Follow-up**: Definir convenções de naming e estrutura de pastas

### Decision: Storage de Media (Imagens/Documentos)

- **Context**: KYC precisa armazenar documentos sensíveis, serviços precisam de imagens públicas
- **Alternatives Considered**:
  1. Storage local (public/private disks)
  2. AWS S3 com presigned URLs
  3. Cloudinary/Imgix CDN
- **Selected Approach**: Laravel Storage com disk local para MVP, abstração para S3 futuro
- **Rationale**: Simplicidade inicial, Spatie Media Library suporta ambos
- **Trade-offs**: Menor performance que CDN, necessita migração futura
- **Follow-up**: Documentos KYC em disk privado, imagens serviços em disk público

### Decision: Gateway de Pagamentos

- **Context**: Requisito R7 especifica múltiplos gateways (Stripe, PayPal, M-Pesa)
- **Alternatives Considered**:
  1. Implementação directa de cada gateway
  2. Laravel Cashier apenas
  3. Interface abstrata com adapters
- **Selected Approach**: PaymentGatewayInterface com adapter pattern
- **Rationale**: Permite adicionar/trocar gateways sem alterar lógica de negócio
- **Trade-offs**: Overhead de abstração, mas flexibilidade compensa
- **Follow-up**: Implementar Stripe primeiro, M-Pesa como extensão

### Decision: Sistema de Notificações

- **Context**: Notificações email + in-app para múltiplos eventos
- **Alternatives Considered**:
  1. Laravel Notifications nativo
  2. Sistema custom com tabela própria
  3. Third-party (Pusher, OneSignal)
- **Selected Approach**: Laravel Notifications + tabela database notifications
- **Rationale**: Integrado, suporta mail + database channels nativamente
- **Trade-offs**: Sem real-time out-of-box (pode adicionar broadcasting depois)
- **Follow-up**: Criar notification classes para cada evento

### Decision: Frontend UI Framework

- **Context**: Requisito especifica Mantine UI, mas Breeze instalado usa Tailwind
- **Alternatives Considered**:
  1. Remover Tailwind, usar apenas Mantine
  2. Coexistência Mantine + Tailwind
  3. Manter Tailwind, ignorar requisito Mantine
- **Selected Approach**: Coexistência - Mantine para componentes UI, Tailwind para utilities
- **Rationale**: Evita rewrite completo, aproveita ambos pontos fortes
- **Trade-offs**: Bundle size maior, possíveis conflitos CSS
- **Follow-up**: Configurar CSS isolation, criar theme Mantine consistente

---

## Risks & Mitigations

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| M-Pesa API indisponível/complexa | Alto | Médio | Implementar Stripe primeiro, M-Pesa como fase 2 |
| Conflitos CSS Mantine/Tailwind | Médio | Médio | Usar CSS modules, prefixos, teste visual extensivo |
| Performance upload imagens | Médio | Baixo | Spatie Media Library com conversions async |
| KYC documents exposure | Alto | Baixo | Storage privado, presigned URLs, access policies |
| Payment webhook failures | Alto | Médio | Queue com retry, idempotency keys, logs detalhados |

---

## References

- [Mantine UI Documentation](https://mantine.dev/) - Componentes React
- [Spatie Laravel Media Library v11](https://spatie.be/docs/laravel-medialibrary/v11/introduction) - Gestão de media
- [FilamentPHP 3.x Docs](https://filamentphp.com/docs/3.x) - Painel admin
- [Laravel Cashier Stripe](https://laravel.com/docs/11.x/billing) - Billing Stripe
- [Safaricom Daraja API](https://developer.safaricom.co.ke/) - M-Pesa integration
- [savannabits/daraja](https://github.com/savannabits/daraja) - Laravel M-Pesa package
- [Inertia.js](https://inertiajs.com/) - SPA monolith pattern
- [Maker-Checker Workflow Filament](https://ajaxray.com/blog/maker-checker-approval-workflow-laravel-filament/) - KYC workflow pattern
