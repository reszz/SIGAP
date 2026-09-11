import type { LucideIcon } from 'lucide-react';
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
                'flex flex-col items-center justify-center rounded-lg border border-[rgba(30,36,48,0.08)] bg-white px-6 py-12 text-center dark:border-[rgba(255,255,255,0.08)] dark:bg-[#181E2B]',
                className,
            )}
        >
            {Icon && (
                <div className="mb-3 flex size-11 items-center justify-center rounded-lg bg-[#F0F2F5] text-[#727C8E] dark:bg-[#21293A] dark:text-[#8C97A8]">
                    <Icon className="size-5" />
                </div>
            )}

            <div className="flex flex-col gap-1">
                <h3 className="font-display text-base font-semibold text-[#1E2430] dark:text-[#E6ECF5]">
                    {title}
                </h3>
                {description && (
                    <p className="max-w-sm text-xs leading-relaxed text-[#727C8E] dark:text-[#8C97A8]">
                        {description}
                    </p>
                )}
            </div>

            {action && <div className="mt-4">{action}</div>}
        </div>
    );
}

export default EmptyState;
