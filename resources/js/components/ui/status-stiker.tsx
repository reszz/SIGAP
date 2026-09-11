import { cn } from '@/lib/utils';
import SigapPulse from '@/components/ui/sigap-pulse';

// ─── Types ────────────────────────────────────────────────────────────────────

export type StatusType =
    | 'terjadwal'
    | 'berlangsung'
    | 'selesai'
    | 'alpa'
    | 'hadir'
    | 'terlambat'
    | 'izin'
    | 'belum'
    | 'sedang'
    | 'draft'
    | 'proposal'
    | 'review'
    | 'delivered'
    | 'overdue'
    | 'belum_ada_sesi';

interface StatusStikerProps {
    status: StatusType | string;
    label?: string;
    withPulse?: boolean;
    className?: string;
}

// ─── Config (design.md: 12% opacity tint background + solid status text) ─────

const STATUS_CONFIG: Record<
    string,
    { label: string; bg: string; text: string; hasPulse?: boolean }
> = {
    // Draft / Proposal / Belum
    terjadwal: {
        label: 'Terjadwal',
        bg: 'bg-[#727C8E]/12 dark:bg-[#727C8E]/20',
        text: 'text-[#727C8E] dark:text-[#8C97A8]',
    },
    draft: {
        label: 'Draft',
        bg: 'bg-[#727C8E]/12 dark:bg-[#727C8E]/20',
        text: 'text-[#727C8E] dark:text-[#8C97A8]',
    },
    proposal: {
        label: 'Proposal',
        bg: 'bg-[#727C8E]/12 dark:bg-[#727C8E]/20',
        text: 'text-[#727C8E] dark:text-[#8C97A8]',
    },
    belum: {
        label: 'Belum Berjalan',
        bg: 'bg-[#727C8E]/12 dark:bg-[#727C8E]/20',
        text: 'text-[#727C8E] dark:text-[#8C97A8]',
    },
    belum_ada_sesi: {
        label: 'Belum Ada Sesi',
        bg: 'bg-[#727C8E]/12 dark:bg-[#727C8E]/20',
        text: 'text-[#727C8E] dark:text-[#8C97A8]',
    },

    // Ongoing / Sedang Berjalan (Sigap Blue)
    berlangsung: {
        label: 'Berlangsung',
        bg: 'bg-[#4A5FD1]/12 dark:bg-[#4A5FD1]/20',
        text: 'text-[#4A5FD1] dark:text-[#8FA0FA]',
        hasPulse: true,
    },
    sedang: {
        label: 'Sedang Dikerjakan',
        bg: 'bg-[#4A5FD1]/12 dark:bg-[#4A5FD1]/20',
        text: 'text-[#4A5FD1] dark:text-[#8FA0FA]',
        hasPulse: true,
    },
    ongoing: {
        label: 'Ongoing',
        bg: 'bg-[#4A5FD1]/12 dark:bg-[#4A5FD1]/20',
        text: 'text-[#4A5FD1] dark:text-[#8FA0FA]',
        hasPulse: true,
    },

    // Review / Needs Attention (Amber pudar #B8862E)
    review: {
        label: 'Review',
        bg: 'bg-[#B8862E]/12 dark:bg-[#B8862E]/20',
        text: 'text-[#B8862E] dark:text-[#D4A142]',
    },
    terlambat: {
        label: 'Terlambat',
        bg: 'bg-[#B8862E]/12 dark:bg-[#B8862E]/20',
        text: 'text-[#B8862E] dark:text-[#D4A142]',
    },
    izin: {
        label: 'Izin',
        bg: 'bg-[#727C8E]/12 dark:bg-[#727C8E]/20',
        text: 'text-[#727C8E] dark:text-[#8C97A8]',
    },

    // Delivered / Selesai / Hadir (Sigap Teal #2E9E82)
    selesai: {
        label: 'Selesai',
        bg: 'bg-[#2E9E82]/12 dark:bg-[#2E9E82]/20',
        text: 'text-[#2E9E82] dark:text-[#34B394]',
    },
    hadir: {
        label: 'Hadir',
        bg: 'bg-[#2E9E82]/12 dark:bg-[#2E9E82]/20',
        text: 'text-[#2E9E82] dark:text-[#34B394]',
    },
    delivered: {
        label: 'Delivered',
        bg: 'bg-[#2E9E82]/12 dark:bg-[#2E9E82]/20',
        text: 'text-[#2E9E82] dark:text-[#34B394]',
    },

    // Overdue / Alpa / Urgent (Merah pudar #C4514A)
    alpa: {
        label: 'Alpa',
        bg: 'bg-[#C4514A]/12 dark:bg-[#C4514A]/20',
        text: 'text-[#C4514A] dark:text-[#D9615A]',
    },
    overdue: {
        label: 'Overdue',
        bg: 'bg-[#C4514A]/12 dark:bg-[#C4514A]/20',
        text: 'text-[#C4514A] dark:text-[#D9615A]',
    },
    ditolak: {
        label: 'Ditolak',
        bg: 'bg-[#C4514A]/12 dark:bg-[#C4514A]/20',
        text: 'text-[#C4514A] dark:text-[#D9615A]',
    },
};

// ─── Component ────────────────────────────────────────────────────────────────

export function StatusStiker({
    status,
    label,
    withPulse,
    className,
}: StatusStikerProps) {
    const key = (status || 'terjadwal').toLowerCase();
    const config = STATUS_CONFIG[key] ?? STATUS_CONFIG.terjadwal;
    const displayLabel = label ?? config.label;
    const shouldPulse = withPulse !== undefined ? withPulse : Boolean(config.hasPulse);

    return (
        <span
            className={cn(
                'inline-flex items-center gap-1.5 rounded-md px-2 py-0.5',
                'text-[11px] font-medium leading-none tracking-tight whitespace-nowrap',
                config.bg,
                config.text,
                className,
            )}
        >
            {shouldPulse && <SigapPulse className="mr-0.5" />}
            {displayLabel}
        </span>
    );
}

export default StatusStiker;
