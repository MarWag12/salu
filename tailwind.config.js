import defaultTheme from 'tailwindcss/defaultTheme';

/** @type {import('tailwindcss').Config} */
export default {
    content: ['./resources/views/**/*.blade.php', './resources/js/**/*.{ts,tsx}'],
    theme: {
        extend: {
            fontFamily: {
                sans: ['"Plus Jakarta Sans Variable"', ...defaultTheme.fontFamily.sans],
            },
            colors: {
                brand: {
                    DEFAULT: '#1e88e5',
                    600: '#1a73d9',
                    700: '#2563eb',
                    navy: '#1e3a8a',
                    teal: '#14b3c4',
                    soft: '#e8f3fd',
                },
                ink: '#0f172a',
                body: '#1f2937',
                muted: '#6b7280',
                line: '#e5e7eb',
                accent: { DEFAULT: '#d97706', soft: '#fef3c7' },
            },
            maxWidth: { page: '1240px' },
            boxShadow: {
                card: '0 4px 14px -8px rgba(15,23,42,.18)',
                lift: '0 16px 30px -16px rgba(15,23,42,.3)',
            },
        },
    },
    plugins: [],
};
