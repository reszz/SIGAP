import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

type Status =
    | 'terjadwal'
    | 'berlangsung'
    | 'selesai'
    | 'alpa'
    | 'hadir'
    | 'terlambat'
    | 'izin'
    | 'belum'
    | 'sedang';

type StikerVariant = 'default' | 'neg' | 'pos' | 'flat';

interface StatusStikerProps {
    status: Status;
    label?: string;
    variant?: StikerVariant;
    className?: string;
}

// ─── Config ───────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
    Status,
    { label: string; border: string; text: string; bg: string }
> = {
    terjadwal: {
        label: 'Terjadwal',
        border: 'border-[#4F46E5]',
        text: 'text-[#4F46E5] dark:text-[#818CF8]',
        bg: 'bg-white dark:bg-[#111827]',
    },
    berlangsung: {
        label: 'Berlangsung',
        border: 'border-[#F59E0B]',
        text: 'text-[#D97706] dark:text-[#F59E0B]',
        bg: 'bg-white dark:bg-[#111827]',
    },
    selesai: {
        label: 'Selesai',
        border: 'border-[#10B981]',
        text: 'text-[#059669] dark:text-[#10B981]',
        bg: 'bg-white dark:bg-[#111827]',
    },
    alpa: {
        label: 'Alpa',
        border: 'border-[#EF4444]',
        text: 'text-[#DC2626] dark:text-[#EF4444]',
        bg: 'bg-white dark:bg-[#111827]',
    },
    hadir: {
        label: 'Hadir',
        border: 'border-[#10B981]',
        text: 'text-[#059669] dark:text-[#10B981]',
        bg: 'bg-white dark:bg-[#111827]',
    },
    terlambat: {
        label: 'Terlambat',
        border: 'border-[#F59E0B]',
        text: 'text-[#D97706] dark:text-[#F59E0B]',
        bg: 'bg-white dark:bg-[#111827]',
    },
    izin: {
        label: 'Izin',
        border: 'border-[#0EA5E9]',
        text: 'text-[#0284C7] dark:text-[#0EA5E9]',
        bg: 'bg-white dark:bg-[#111827]',
    },
    belum: {
        label: 'Belum',
        border: 'border-neutral-300 dark:border-neutral-700',
        text: 'text-neutral-500 dark:text-neutral-400',
        bg: 'bg-white dark:bg-[#111827]',
    },
    sedang: {
        label: 'Sedang Dikerjakan',
        border: 'border-[#F59E0B]',
        text: 'text-[#D97706] dark:text-[#F59E0B]',
        bg: 'bg-white dark:bg-[#111827]',
    },
};

const ROTATION: Record<StikerVariant, string> = {
    default: 'rotate-sticker-neg',
    neg: 'rotate-sticker-neg',
    pos: 'rotate-sticker-pos',
    flat: '',
};

// ─── Component ────────────────────────────────────────────────────────────────

export function StatusStiker({
    status,
    label,
    variant = 'default',
    className,
}: StatusStikerProps) {
    const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.terjadwal;
    const displayLabel = label ?? config.label;

    return (
        <span
            className={cn(
                'inline-flex items-center rounded-full border px-2.5 py-0.5',
                'text-[11px] font-semibold leading-none tracking-wide',
                config.bg,
                config.border,
                config.text,
                ROTATION[variant],
                'transition-transform',
                className,
            )}
        >
            {displayLabel}
        </span>
    );
}

export default StatusStiker;
