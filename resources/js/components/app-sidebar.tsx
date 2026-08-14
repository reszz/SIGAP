import { Link, usePage } from '@inertiajs/react';
import { BookOpen, Calendar, CalendarCheck2, ClipboardList, FolderGit2, LayoutGrid, Users } from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { TeamSwitcher } from '@/components/team-switcher';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { dashboard as anggotaDashboard } from '@/routes/anggota';
import { index as kalenderIndex } from '@/routes/kalender';
import pengurus, { dashboard as pengurusDashboard } from '@/routes/pengurus';
import { index as riwayatSayaIndex } from '@/routes/riwayat-saya';
import type { NavItem } from '@/types';

export function AppSidebar() {
    const page = usePage();
    const user = page.props.auth.user;
    const isPengurus = user.role === 'pengurus';
    const teamSlug = page.props.currentTeam?.slug;

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
            href: teamSlug ? kalenderIndex.url(teamSlug) : '/kalender',
            icon: Calendar,
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
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
