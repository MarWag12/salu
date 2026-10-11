import { createTheme, type MantineColorsTuple } from '@mantine/core';

const brand: MantineColorsTuple = [
    '#e8f3fd', '#d0e6fa', '#a2ccf5', '#72b2f0', '#4a9aeb',
    '#2f8be8', '#1e88e5', '#1a73d9', '#1565c0', '#0d47a1',
];

const font = "'Plus Jakarta Sans Variable', system-ui, -apple-system, 'Segoe UI', sans-serif";

/** Tema Mantine alinhado com o design da CAFPMIF (azul → ciano). */
export const theme = createTheme({
    primaryColor: 'brand',
    primaryShade: 6,
    colors: { brand },
    fontFamily: font,
    headings: { fontFamily: font, fontWeight: '700' },
    defaultRadius: 'md',
    components: {
        Button: { defaultProps: { fw: 600 } },
        InputWrapper: { styles: { label: { fontWeight: 600, marginBottom: 4 } } },
    },
});

export const GRADIENT = { from: '#1e88e5', to: '#14b3c4', deg: 135 } as const;
