export type Role = 'admin' | 'tecnico' | 'cliente';

export interface AuthUser {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    role: Role;
    role_label: string;
    initials: string;
    home: string;
    category_ids: number[];
}

export interface SharedProps {
    app: { name: string };
    auth: { user: AuthUser | null };
    flash: { success?: string | null; error?: string | null };
    realtime: boolean;
    errors: Record<string, string>;
    [key: string]: unknown;
}

export interface PageLink {
    url: string | null;
    label: string;
    active: boolean;
}

export interface Paginated<T> {
    data: T[];
    links: PageLink[];
    current_page: number;
    last_page: number;
    from: number | null;
    to: number | null;
    total: number;
}

export interface Category {
    id: number;
    name: string;
    slug: string;
    icon: string;
    description: string | null;
    services_count: number | null;
}

export interface ServiceCategory {
    id: number;
    name: string;
    slug: string;
    icon: string;
}

export interface Service {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    base_price: number;
    duration_label: string;
    image_url: string | null;
    category: ServiceCategory | null;
}

export interface TechnicianCard {
    id: number;
    name: string;
    initials: string;
    municipality: string | null;
    bio: string | null;
    experience_years: number;
    rating_avg: number;
    reviews_count: number;
    categories: { id: number; name: string }[];
}

export type OrderStatus = 'pendente' | 'atribuido' | 'em_curso' | 'concluido' | 'cancelado';

export interface Person {
    id: number;
    name: string;
    phone: string | null;
    initials: string;
}

export interface Payment {
    id: number;
    amount: number;
    method: string;
    method_label: string;
    reference: string | null;
    status: 'pendente' | 'confirmado';
}

export interface Order {
    id: number;
    code: string;
    status: OrderStatus;
    status_label: string;
    scheduled_at: string | null;
    price: number;
    municipality: string;
    service: { id: number; name: string; category?: string | null } | null;
    client: Person | null;
    technician: (Person & { rating_avg: number; reviews_count: number }) | null;
    // apenas no detalhe
    address?: string;
    description?: string | null;
    cancel_reason?: string | null;
    completed_at?: string | null;
    payments?: Payment[];
    review?: { rating: number; comment: string | null } | null;
    disputes?: { id: number; status: 'aberta' | 'resolvida'; reason: string; resolution: string | null }[];
}

export interface Option {
    value: string;
    label: string;
}

export interface KycInfo {
    status: 'pendente' | 'aprovado' | 'rejeitado';
    notes: string | null;
    document_url: string | null;
    approved: boolean;
}
