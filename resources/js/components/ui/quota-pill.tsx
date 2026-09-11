import { cn } from '@/lib/utils';

interface QuotaPillProps {
    registered: number;
    quota: number;
    className?: string;
}

export function QuotaPill({ registered, quota, className }: QuotaPillProps) {
    const pct = quota > 0 ? Math.min((registered / quota) * 100, 100) : 0;

    const barColor =
        pct > 90
            ? 'bg-[#C4514A]'
            : pct > 75
              ? 'bg-[#B8862E]'
              : 'bg-[#4A5FD1]';

    const textColor =
        pct > 90
            ? 'text-[#C4514A] dark:text-[#D9615A]'
            : pct > 75
              ? 'text-[#B8862E] dark:text-[#D4A142]'
              : 'text-[#4A5FD1] dark:text-[#8FA0FA]';

    return (
        <span
            className={cn(
                'inline-flex flex-col gap-1 rounded-md border border-[rgba(30,36,48,0.08)] bg-white px-2.5 py-1 dark:border-[rgba(255,255,255,0.08)] dark:bg-[#181E2B]',
                className,
            )}
        >
            <span className={cn('font-mono-sigap text-[11px] font-medium leading-none', textColor)}>
                {registered}/{quota} kuota
            </span>
            {/* Progress bar tipis 4px rata */}
            <span className="h-1 w-full overflow-hidden rounded-full bg-[#F0F2F5] dark:bg-[#21293A]">
                <span
                    className={cn('block h-full transition-all duration-300', barColor)}
                    style={{ width: `${pct}%` }}
                />
            </span>
        </span>
    );
}

export default QuotaPill;
