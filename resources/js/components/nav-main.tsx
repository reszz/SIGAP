import { Link } from '@inertiajs/react';
import { cn } from '@/lib/utils';
import { useCurrentUrl } from '@/hooks/use-current-url';
import type { NavItem } from '@/types';

export type NavGroup = {
    title?: string;
    items: NavItem[];
};

export function NavMain({
    groups,
    items,
}: {
    groups?: NavGroup[];
    items?: NavItem[];
}) {
    const { isCurrentUrl } = useCurrentUrl();

    // Support both grouped navigation and simple list
    const navGroups: NavGroup[] = groups ?? (items ? [{ items }] : []);

    return (
        <div className="flex flex-col gap-3 px-3 py-1.5">
            {navGroups.map((group, gIdx) => (
                <div
                    key={group.title ?? gIdx}
                    className="flex flex-col gap-0.5"
                >
                    {group.title && (
                        <p className="px-2.5 pt-2 pb-1 text-[11px] font-semibold tracking-wider text-sigap-slate uppercase group-data-[collapsible=icon]:hidden dark:text-[#8C97A8]">
                            {group.title}
                        </p>
                    )}
                    {group.items.map((item) => {
                        const active = isCurrentUrl(item.href);
                        const Icon = item.icon;

                        return (
                            <Link
                                key={item.title}
                                href={item.href}
                                prefetch
                                className={cn(
                                    'relative flex items-center gap-2.5 rounded-lg border-l-2 border-transparent px-2.5 py-1.5 text-xs font-medium transition-all duration-150',
                                    active
                                        ? 'border-l-sigap-blue bg-sigap-blue/10 font-semibold text-sigap-blue dark:border-l-[#8FA0FA] dark:bg-sigap-blue/20 dark:text-[#8FA0FA]'
                                        : 'text-sigap-slate hover:bg-[#F0F2F5] hover:text-sigap-ink dark:text-[#8C97A8] dark:hover:bg-[#21293A] dark:hover:text-[#E6ECF5]',
                                )}
                            >
                                {Icon && (
                                    <Icon
                                        className={cn(
                                            'size-4 shrink-0',
                                            active
                                                ? 'text-sigap-blue dark:text-[#8FA0FA]'
                                                : 'text-sigap-slate dark:text-[#8C97A8]',
                                        )}
                                    />
                                )}
                                <span className="truncate group-data-[collapsible=icon]:hidden">
                                    {item.title}
                                </span>
                            </Link>
                        );
                    })}
                </div>
            ))}
        </div>
    );
}

export default NavMain;
