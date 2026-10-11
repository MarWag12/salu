/** Caminhos da aplicação (espelham routes/web.php). */
export const routes = {
    home: '/',
    services: '/servicos',
    service: (slug: string) => `/servicos/${slug}`,
    suggestions: '/servicos/sugestoes',
    technicians: '/tecnicos',
    login: '/entrar',
    register: (tipo?: 'tecnico') => (tipo ? `/registar?tipo=${tipo}` : '/registar'),
    forgot: '/recuperar-palavra-passe',
    resetPassword: '/redefinir-palavra-passe',
    logout: '/sair',

    client: {
        dashboard: '/cliente',
        orders: '/cliente/pedidos',
        newOrder: (serviceId?: number) => (serviceId ? `/cliente/pedidos/novo?servico=${serviceId}` : '/cliente/pedidos/novo'),
        order: (id: number) => `/cliente/pedidos/${id}`,
    },

    tech: {
        dashboard: '/tecnico',
        jobs: '/tecnico/trabalhos',
        job: (id: number) => `/tecnico/trabalhos/${id}`,
        profile: '/tecnico/perfil',
    },

    admin: '/admin',
};
