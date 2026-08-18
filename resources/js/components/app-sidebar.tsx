import { Link, usePage } from '@inertiajs/react';
import {
    BookOpen,
    CalendarCheck2,
    ChevronLeft,
    ChevronRight,
    ClipboardList,
    FileText,
    FolderGit2,
    LayoutGrid,
    Users,
} from 'lucide-react';
import { useState } from 'react';
import AppLogo from '@/components/app-logo';
import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { TeamSwitcher } from '@/components/team-switcher';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from '@/components/ui/sidebar';
import { dashboard as anggotaDashboard } from '@/routes/anggota';
import { index as kalenderIndex } from '@/routes/kalender';
import pengurus, { dashboard as pengurusDashboard } from '@/routes/pengurus';
import { index as laporanIndex } from '@/routes/pengurus/laporan';
import { index as riwayatSayaIndex } from '@/routes/riwayat-saya';
import type { NavItem } from '@/types';

// ─── Mini calendar (sidebar variant) ─────────────────────────────────────────

const BULAN_ID = [
    'Januari',
    'Februari',
    'Maret',
    'April',
    'Mei',
    'Juni',
    'Juli',
    'Agustus',
    'September',
    'Oktober',
    'November',
    'Desember',
];
const HARI_PENDEK = ['M', 'S', 'S', 'R', 'K', 'J', 'S'];

function SidebarMiniCalendar({ teamSlug }: { teamSlug: string }) {
    const today = new Date();
    const [viewYear, setViewYear] = useState(today.getFullYear());
    const [viewMonth, setViewMonth] = useState(today.getMonth());

    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    const firstDay = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

    const prevMonth = () => {
        if (viewMonth === 0) {
            setViewYear((y) => y - 1);
            setViewMonth(11);
        } else setViewMonth((m) => m - 1);
    };
    const nextMonth = () => {
        if (viewMonth === 11) {
            setViewYear((y) => y + 1);
            setViewMonth(0);
        } else setViewMonth((m) => m + 1);
    };

    const cells: (number | null)[] = [
        ...Array(firstDay).fill(null),
        ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ];

    return (
        <SidebarGroup className="px-3 py-2 group-data-[collapsible=icon]:hidden">
            <div className="rounded-xl border border-sidebar-border/60 bg-sidebar-accent/30 p-3">
                {/* Month nav */}
                <div className="mb-2 flex items-center justify-between">
                    <button
                        onClick={prevMonth}
                        className="flex size-6 items-center justify-center rounded-md text-sidebar-foreground/50 transition hover:bg-sidebar-accent hover:text-sidebar-foreground"
                        aria-label="Bulan sebelumnya"
                    >
                        <ChevronLeft className="size-3.5" />
                    </button>
                    <span className="text-[11px] font-semibold text-sidebar-foreground/80">
                        {BULAN_ID[viewMonth].slice(0, 3)} {viewYear}
                    </span>
                    <button
                        onClick={nextMonth}
                        className="flex size-6 items-center justify-center rounded-md text-sidebar-foreground/50 transition hover:bg-sidebar-accent hover:text-sidebar-foreground"
                        aria-label="Bulan berikutnya"
                    >
                        <ChevronRight className="size-3.5" />
                    </button>
                </div>

                {/* Day headers */}
                <div className="mb-1 grid grid-cols-7">
                    {HARI_PENDEK.map((h, i) => (
                        <div
                            key={i}
                            className="text-center text-[9px] font-bold tracking-wide text-sidebar-foreground/40 uppercase"
                        >
                            {h}
                        </div>
                    ))}
                </div>

                {/* Date grid */}
                <div className="grid grid-cols-7 gap-y-0.5">
                    {cells.map((day, idx) => {
                        if (!day) return <div key={`e-${idx}`} />;
                        const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                        const isToday = dateStr === todayStr;

                        return (
                            <div
                                key={dateStr}
                                className={`mx-auto flex size-6 items-center justify-center rounded-full text-[10px] font-medium ${
                                    isToday
                                        ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-sm'
                                        : 'text-sidebar-foreground/70'
                                }`}
                            >
                                {day}
                            </div>
                        );
                    })}
                </div>

                {/* Link to full calendar */}
                <Link
                    href={kalenderIndex.url(teamSlug)}
                    prefetch
                    className="mt-3 flex items-center justify-center rounded-lg py-1.5 text-[10px] font-semibold text-sidebar-foreground/50 transition hover:bg-sidebar-accent hover:text-sidebar-foreground"
                >
                    Kalender Penuh →
                </Link>
            </div>
        </SidebarGroup>
    );
}

// ─── AppSidebar ───────────────────────────────────────────────────────────────

export function AppSidebar() {
    const page = usePage();
    const user = page.props.auth.user;
    const isPengurus = user.role === 'pengurus';
    const teamSlug = page.props.currentTeam?.slug;
    const { state } = useSidebar();

    const dashboardUrl = teamSlug
        ? isPengurus
            ? pengurusDashboard.url(teamSlug)
            : anggotaDashboard.url(teamSlug)
        : '/';

    const sharedNavItems: NavItem[] = [
        {
            title: 'Dashboard',
            href: dashboardUrl,
            icon: LayoutGrid,
        },
        {
            title: 'Kalender',
            href: teamSlug ? kalenderIndex.url(teamSlug) : '/',
            icon: CalendarCheck2,
        },
    ];

    const pengurusNavItems: NavItem[] = [
        {
            title: 'Kelola Kegiatan',
            href: teamSlug ? pengurus.kegiatan.index.url(teamSlug) : '/',
            icon: ClipboardList,
        },
        {
            title: 'Kelola Anggota',
            href: teamSlug ? pengurus.anggota.index.url(teamSlug) : '/',
            icon: Users,
        },
        {
            title: 'Laporan',
            href: teamSlug ? laporanIndex.url(teamSlug) : '/',
            icon: FileText,
        },
    ];

    const anggotaNavItems: NavItem[] = [
        {
            title: 'Riwayat Saya',
            href: teamSlug ? riwayatSayaIndex.url(teamSlug) : '/riwayat-saya',
            icon: CalendarCheck2,
        },
    ];

    const mainNavItems = [
        ...sharedNavItems,
        ...(isPengurus ? pengurusNavItems : anggotaNavItems),
    ];

    const footerNavItems: NavItem[] = [
        {
            title: 'Repository',
            href: 'https://github.com/laravel/react-starter-kit',
            icon: FolderGit2,
        },
        {
            title: 'Documentation',
            href: 'https://laravel.com/docs/starter-kits#react',
            icon: BookOpen,
        },
    ];

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboardUrl} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <TeamSwitcher />
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />

                {/* Mini calendar — only shown when sidebar is expanded */}
                {teamSlug && <SidebarMiniCalendar teamSlug={teamSlug} />}
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
