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
            ? 'bg-[#EF4444]'
            : pct > 75
              ? 'bg-[#F59E0B]'
              : 'bg-[#4F46E5]';

    const textColor =
        pct > 90
            ? 'text-[#EF4444] dark:text-[#F87171]'
            : pct > 75
              ? 'text-[#D97706] dark:text-[#F59E0B]'
              : 'text-[#4F46E5] dark:text-[#818CF8]';

    return (
        <span
            className={cn(
                'inline-flex flex-col gap-0.5 rounded-full border border-neutral-200/80 bg-white px-3 py-1 dark:border-neutral-800 dark:bg-[#111827]',
                className,
            )}
        >
            <span className={cn('text-[11px] font-semibold leading-none', textColor)}>
                {registered}/{quota} mendaftar
            </span>
            {/* Mini progress bar */}
            <span className="h-1 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
                <span
                    className={cn('block h-full rounded-full transition-all duration-500', barColor)}
                    style={{ width: `${pct}%` }}
                />
            </span>
        </span>
    );
}

export default QuotaPill;
