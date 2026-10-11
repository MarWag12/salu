import axios from 'axios';

// Axios: pedidos HTTP do navegador (sugestões de pesquisa, autorização do Echo…).
// O cookie XSRF-TOKEN do Laravel é enviado automaticamente como cabeçalho X-XSRF-TOKEN.
window.axios = axios;
axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
axios.defaults.withCredentials = true;
