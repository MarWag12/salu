import defaultTheme from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './resources/js/**/*.tsx',
    ],

    theme: {
        extend: {
            fontFamily: {
                sans: ['Figtree', ...defaultTheme.fontFamily.sans],
            },
            colors: {
                // Cor primária - Verde TaskRabbit
                primary: {
                    50: '#f0fdf4',
                    100: '#dcfce7',
                    200: '#bbf7d0',
                    300: '#86efac',
                    400: '#5dba40', // Cor principal TaskRabbit
                    500: '#4ade80',
                    600: '#22c55e',
                    700: '#16a34a',
                    800: '#15803d',
                    900: '#14532d',
                    950: '#052e16',
                },
                // Cores de pricing badges
                pricing: {
                    fixed: '#3b82f6',    // Azul para preço fixo
                    hourly: '#f97316',   // Laranja para por hora
                    variable: '#10b981', // Verde para variável
                },
            },
        },
    },

    plugins: [forms],
};
