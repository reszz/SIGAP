import Swal from 'sweetalert2';

/**
 * SVG Icons as sleek HTML strings matching SIGAP Design System
 */
const ICONS = {
    success: `
        <div class="swal-icon-badge swal-icon-success">
            <svg class="size-6 text-[#2E9E82] dark:text-[#34B394]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 6 9 17l-5-5"/>
            </svg>
        </div>
    `,
    error: `
        <div class="swal-icon-badge swal-icon-error">
            <svg class="size-6 text-[#C4514A] dark:text-[#D9615A]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
        </div>
    `,
    warning: `
        <div class="swal-icon-badge swal-icon-warning">
            <svg class="size-6 text-[#B8862E] dark:text-[#D4A142]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
        </div>
    `,
    delete: `
        <div class="swal-icon-badge swal-icon-delete">
            <svg class="size-6 text-[#C4514A] dark:text-[#D9615A]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 6h18"/>
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                <line x1="10" y1="11" x2="10" y2="17"/>
                <line x1="14" y1="11" x2="14" y2="17"/>
            </svg>
        </div>
    `,
    question: `
        <div class="swal-icon-badge swal-icon-info">
            <svg class="size-6 text-[#4A5FD1] dark:text-[#8FA0FA]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
        </div>
    `,
    role: `
        <div class="swal-icon-badge swal-icon-role">
            <svg class="size-6 text-[#B8862E] dark:text-[#D4A142]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L21.183 5.5a.5.5 0 0 1 .798.519l-2.834 10.246a1 1 0 0 1-.962.735H5.815a1 1 0 0 1-.962-.735L2.019 6.019a.5.5 0 0 1 .798-.519l4.277 3.664a1 1 0 0 0 1.516-.294z"/>
                <path d="M5 21h14"/>
            </svg>
        </div>
    `,
};

/**
 * Base SweetAlert2 instance with SIGAP Cool-Neutral styling.
 */
export const SigapSwal = Swal.mixin({
    buttonsStyling: false,
    showClass: {
        popup: 'swal2-show-anim',
    },
    hideClass: {
        popup: 'swal2-hide-anim',
    },
    customClass: {
        container: 'sigap-swal-container',
        popup: 'sigap-swal-popup',
        title: 'sigap-swal-title',
        htmlContainer: 'sigap-swal-html',
        actions: 'sigap-swal-actions',
        confirmButton: 'sigap-btn-primary',
        cancelButton: 'sigap-btn-cancel',
        denyButton: 'sigap-btn-danger',
    },
});

/**
 * Toast Notification (Top Right)
 */
export const Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 2800,
    timerProgressBar: true,
    showClass: {
        popup: 'sigap-toast-show',
    },
    hideClass: {
        popup: 'sigap-toast-hide',
    },
    customClass: {
        popup: 'sigap-toast-popup',
        icon: 'sigap-toast-icon',
        title: 'sigap-toast-title',
        timerProgressBar: 'sigap-toast-progress',
    },
    didOpen: (toast) => {
        toast.onmouseenter = Swal.stopTimer;
        toast.onmouseleave = Swal.resumeTimer;
    },
});

/**
 * Success Alert Modal
 */
export function showSuccess(title: string, text?: string) {
    return SigapSwal.fire({
        html: `
            <div class="flex flex-col items-center text-center">
                ${ICONS.success}
                <h3 class="font-display text-base font-semibold text-[#1E2430] dark:text-[#E6ECF5] mb-1">${title}</h3>
                ${text ? `<p class="text-xs text-[#727C8E] dark:text-[#8C97A8] font-normal leading-relaxed max-w-xs">${text}</p>` : ''}
            </div>
        `,
        confirmButtonText: 'Selesai',
        customClass: {
            popup: 'sigap-swal-popup',
            confirmButton: 'sigap-btn-primary',
            actions: 'sigap-swal-actions',
        },
    });
}

/**
 * Error Alert Modal
 */
export function showError(title: string, text?: string) {
    return SigapSwal.fire({
        html: `
            <div class="flex flex-col items-center text-center">
                ${ICONS.error}
                <h3 class="font-display text-base font-semibold text-[#1E2430] dark:text-[#E6ECF5] mb-1">${title}</h3>
                ${text ? `<p class="text-xs text-[#727C8E] dark:text-[#8C97A8] font-normal leading-relaxed max-w-xs">${text}</p>` : ''}
            </div>
        `,
        confirmButtonText: 'Tutup',
        customClass: {
            popup: 'sigap-swal-popup',
            confirmButton: 'sigap-btn-danger',
            actions: 'sigap-swal-actions',
        },
    });
}

/**
 * Confirmation Dialog for deletion actions
 */
export async function confirmDelete(
    itemName: string,
    message?: string,
): Promise<boolean> {
    const result = await SigapSwal.fire({
        html: `
            <div class="flex flex-col items-center text-center">
                ${ICONS.delete}
                <h3 class="font-display text-base font-semibold text-[#1E2430] dark:text-[#E6ECF5] mb-1">Hapus ${itemName}?</h3>
                <p class="text-xs text-[#727C8E] dark:text-[#8C97A8] font-normal leading-relaxed max-w-xs">
                    ${message ?? 'Tindakan ini permanen dan data terkait akan ikut terhapus dari sistem.'}
                </p>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Ya, Hapus',
        cancelButtonText: 'Batal',
        reverseButtons: true,
        customClass: {
            popup: 'sigap-swal-popup',
            confirmButton: 'sigap-btn-danger',
            cancelButton: 'sigap-btn-cancel',
            actions: 'sigap-swal-actions',
        },
    });

    return result.isConfirmed;
}

/**
 * Confirmation Dialog for role assignment changes
 */
export async function confirmRoleChange(
    userName: string,
    targetRole: 'pengurus' | 'anggota',
): Promise<boolean> {
    const roleLabel = targetRole === 'pengurus' ? 'Pengurus' : 'Anggota';
    const result = await SigapSwal.fire({
        html: `
            <div class="flex flex-col items-center text-center">
                ${ICONS.role}
                <h3 class="font-display text-base font-semibold text-[#1E2430] dark:text-[#E6ECF5] mb-1">Ubah Role Pengguna?</h3>
                <p class="text-xs text-[#727C8E] dark:text-[#8C97A8] font-normal leading-relaxed max-w-xs">
                    Role untuk <strong>${userName}</strong> akan dialihkan ke level <strong>${roleLabel}</strong>.
                </p>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: `Ya, Jadikan ${roleLabel}`,
        cancelButtonText: 'Batal',
        reverseButtons: true,
        customClass: {
            popup: 'sigap-swal-popup',
            confirmButton: targetRole === 'pengurus' ? 'sigap-btn-amber' : 'sigap-btn-primary',
            cancelButton: 'sigap-btn-cancel',
            actions: 'sigap-swal-actions',
        },
    });

    return result.isConfirmed;
}

/**
 * Generic Confirmation Dialog
 */
export async function confirmAction(
    title: string,
    text?: string,
    confirmText = 'Lanjutkan',
    cancelText = 'Batal',
): Promise<boolean> {
    const result = await SigapSwal.fire({
        html: `
            <div class="flex flex-col items-center text-center">
                ${ICONS.question}
                <h3 class="font-display text-base font-semibold text-[#1E2430] dark:text-[#E6ECF5] mb-1">${title}</h3>
                ${text ? `<p class="text-xs text-[#727C8E] dark:text-[#8C97A8] font-normal leading-relaxed max-w-xs">${text}</p>` : ''}
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: confirmText,
        cancelButtonText: cancelText,
        reverseButtons: true,
        customClass: {
            popup: 'sigap-swal-popup',
            confirmButton: 'sigap-btn-primary',
            cancelButton: 'sigap-btn-cancel',
            actions: 'sigap-swal-actions',
        },
    });

    return result.isConfirmed;
}

export default SigapSwal;
