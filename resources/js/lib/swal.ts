import Swal from 'sweetalert2';

/** Diálogo de confirmação (SweetAlert2) — devolve true se o utilizador confirmar. */
export async function confirmAction(opts: {
    title: string;
    text?: string;
    confirmText?: string;
    cancelText?: string;
    danger?: boolean;
}): Promise<boolean> {
    const result = await Swal.fire({
        title: opts.title,
        text: opts.text,
        icon: opts.danger ? 'warning' : 'question',
        showCancelButton: true,
        confirmButtonText: opts.confirmText ?? 'Confirmar',
        cancelButtonText: opts.cancelText ?? 'Voltar',
        confirmButtonColor: opts.danger ? '#dc2626' : '#1e88e5',
        cancelButtonColor: '#6b7280',
        reverseButtons: true,
        focusCancel: Boolean(opts.danger),
    });

    return result.isConfirmed;
}
