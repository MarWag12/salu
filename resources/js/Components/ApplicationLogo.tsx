import { ImgHTMLAttributes } from 'react';

interface Props extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
    /** 'icon' = só o símbolo; 'full' = símbolo + nome + legenda */
    variant?: 'icon' | 'full';
}

export default function ApplicationLogo({ variant = 'icon', className, alt = 'Salu — Gestão de Manutenção Doméstica', ...props }: Props) {
    return (
        <img
            {...props}
            src={variant === 'full' ? '/images/logo.png' : '/images/logo-icon.png'}
            alt={alt}
            className={className}
        />
    );
}
