import { cn } from '@/lib/utils';

interface SigapPulseProps {
    className?: string;
    pulseClassName?: string;
    title?: string;
}

/**
 * Sigap Pulse — Signature Element for SIGAP Design System
 * Subtle pulsing indicator dot for active/ongoing projects and tasks.
 * Automatically respects `prefers-reduced-motion`.
 */
export function SigapPulse({
    className,
    pulseClassName,
    title = 'Sedang aktif dikerjakan',
}: SigapPulseProps) {
    return (
        <span
            className={cn('sigap-pulse-dot', className)}
            title={title}
            aria-label={title}
        >
            <span className={cn('sigap-pulse-ring', pulseClassName)} />
            <span className={cn('sigap-pulse-core', pulseClassName)} />
        </span>
    );
}

export default SigapPulse;
