import { usePage } from '@inertiajs/react';
import { Bell } from 'lucide-react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { SidebarTrigger } from '@/components/ui/sidebar';
import type { BreadcrumbItem as BreadcrumbItemType } from '@/types';

export function AppSidebarHeader({
    breadcrumbs = [],
}: {
    breadcrumbs?: BreadcrumbItemType[];
}) {
    const { auth } = usePage().props;
    const user = auth?.user;

    const initials = user?.name
        ? user.name
              .split(' ')
              .slice(0, 2)
              .map((n: string) => n[0])
              .join('')
              .toUpperCase()
        : 'U';

    return (
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-[rgba(30,36,48,0.08)] bg-white/90 px-5 backdrop-blur-sm transition-[width,height] ease-linear dark:border-[rgba(255,255,255,0.08)] dark:bg-[#181E2B]/90 md:px-6">
            {/* Left: Sidebar trigger + Title/Breadcrumb */}
            <div className="flex items-center gap-2">
                <SidebarTrigger className="-ml-1 text-[#727C8E] hover:text-[#1E2430] dark:text-[#8C97A8] dark:hover:text-[#E6ECF5]" />
                {breadcrumbs.length > 0 && (
                    <div className="h-3.5 w-px bg-[rgba(30,36,48,0.12)] dark:bg-[rgba(255,255,255,0.12)]" />
                )}
                <Breadcrumbs breadcrumbs={breadcrumbs} />
            </div>

            {/* Right: Notifications + User Pill */}
            {user && (
                <div className="flex items-center gap-3">
                    {/* Notification icon */}
                    <button
                        type="button"
                        className="relative flex size-8 items-center justify-center rounded-md text-[#727C8E] transition hover:bg-[#F6F7F9] hover:text-[#1E2430] dark:text-[#8C97A8] dark:hover:bg-[#21293A] dark:hover:text-[#E6ECF5]"
                        aria-label="Notifikasi"
                    >
                        <Bell className="size-4" />
                        <span className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-[#B8862E]" />
                    </button>

                    {/* User profile badge */}
                    <div className="flex items-center gap-2">
                        <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#4A5FD1] text-[11px] font-semibold text-white">
                            {initials}
                        </div>
                        <div className="hidden sm:flex flex-col text-left">
                            <span className="text-xs font-semibold leading-tight text-[#1E2430] dark:text-[#E6ECF5]">
                                {user.name}
                            </span>
                            <span className="text-[10px] font-medium leading-tight text-[#727C8E] capitalize dark:text-[#8C97A8]">
                                {user.role}
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
}

export default AppSidebarHeader;
