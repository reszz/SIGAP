import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
    icon?: LucideIcon;
    title: string;
    description?: string;
    action?: React.ReactNode;
    className?: string;
}

export function EmptyState({
    icon: Icon,
    title,
    description,
    action,
    className,
}: EmptyStateProps) {
    return (
        <div
            className={cn(
                'flex flex-col items-center justify-center gap-4 px-6 py-16 text-center',
                className,
            )}
        >
            {/* Icon illustration — layered circles */}
            {Icon && (
                <div className="relative">
                    <div className="size-20 rounded-full bg-[#EEF2FF] dark:bg-[#1E1B4B]" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="size-12 rounded-full bg-[#E0E7FF] dark:bg-[#2E2975] flex items-center justify-center">
                            <Icon className="size-6 text-[#4F46E5] dark:text-[#818CF8]" />
                        </div>
                    </div>
                </div>
            )}

            <div className="flex flex-col gap-1.5">
                <h3 className="font-display text-lg font-bold text-neutral-900 dark:text-neutral-100">
                    {title}
                </h3>
                {description && (
                    <p className="max-w-xs text-sm text-neutral-500 dark:text-neutral-400">
                        {description}
                    </p>
                )}
            </div>

            {action && (
                <div className="mt-2">{action}</div>
            )}
        </div>
    );
}

export default EmptyState;
