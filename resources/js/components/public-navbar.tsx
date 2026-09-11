import { Link, usePage } from '@inertiajs/react';
import {
    Calendar,
    ChevronDown,
    Clock,
    Compass,
    Layers,
    Menu,
    Newspaper,
    Sparkles,
    Users,
    X,
} from 'lucide-react';
import { useState } from 'react';
import AppLogoIcon from '@/components/app-logo-icon';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function PublicNavbar() {
    const { url } = usePage().props as any;
    const currentUrl: string = usePage().url ?? url ?? '';
    const [mobileOpen, setMobileOpen] = useState(false);
    const [profilOpen, setProfilOpen] = useState(true);
    const [organisasiOpen, setOrganisasiOpen] = useState(true);

    const isActive = (path: string) =>
        currentUrl === path || (path !== '/' && currentUrl?.startsWith(path));

    const navLinkClass = (path: string) =>
        `relative rounded-md px-3 py-1.5 text-xs font-medium transition ${
            isActive(path)
                ? 'text-[#1E2430] font-semibold dark:text-[#E6ECF5]'
                : 'text-[#727C8E] hover:bg-[#F6F7F9] hover:text-[#1E2430] dark:text-[#8C97A8] dark:hover:bg-[#0E121A] dark:hover:text-[#E6ECF5]'
        }`;

    return (
        <header className="sticky top-0 z-40 border-b border-[rgba(30,36,48,0.08)] bg-white/90 backdrop-blur-md dark:border-[rgba(255,255,255,0.08)] dark:bg-[#181E2B]/90">
            <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
                {/* ── Brand Logo (menempel di kiri) ── */}
                <Link href="/" className="flex shrink-0 gap-3">
                    <div className="flex size-9 items-center justify-center rounded-lg bg-[#4A5FD1] text-white shadow-xs">
                        <AppLogoIcon className="size-4.5 fill-current text-white" />
                    </div>
                    <div className="leading-tight">
                        <span className="block font-display text-base font-semibold tracking-tight text-[#1E2430] dark:text-[#E6ECF5]">
                            HMIF
                        </span>
                        <span className="font-mono-sigap block text-[10px] tracking-wider text-[#727C8E] uppercase dark:text-[#8C97A8]">
                            Teknik Informatika
                        </span>
                    </div>
                </Link>

                {/* ── Desktop Navigation + Aksi (menempel di kanan) ── */}
                <div className="flex items-center gap-2 sm:gap-3">
                    <nav className="hidden items-center gap-1 lg:flex">
                        <Link href="/" className={navLinkClass('/')}>
                            Beranda
                            {isActive('/') && currentUrl === '/' && (
                                <span className="absolute inset-x-3 -bottom-[1px] h-[2px] rounded-full bg-[#4A5FD1]" />
                            )}
                        </Link>

                        {/* Profil Dropdown */}
                        <DropdownMenu>
                            <DropdownMenuTrigger className="flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium text-[#727C8E] transition outline-none hover:bg-[#F6F7F9] hover:text-[#1E2430] data-[state=open]:bg-[#F6F7F9] data-[state=open]:text-[#1E2430] dark:text-[#8C97A8] dark:hover:bg-[#0E121A] dark:hover:text-[#E6ECF5] dark:data-[state=open]:bg-[#0E121A] dark:data-[state=open]:text-[#E6ECF5]">
                                <span>Profil</span>
                                <ChevronDown className="size-3 text-[#727C8E] dark:text-[#8C97A8]" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                align="start"
                                className="w-48 rounded-lg border border-[rgba(30,36,48,0.08)] bg-white p-1.5 shadow-md dark:border-[rgba(255,255,255,0.08)] dark:bg-[#181E2B]"
                            >
                                <DropdownMenuItem asChild>
                                    <Link
                                        href="/profil/visi-misi"
                                        className="flex w-full cursor-pointer items-center gap-2 rounded-md px-2.5 py-2 text-xs font-medium text-[#1E2430] transition hover:bg-[#F6F7F9] dark:text-[#E6ECF5] dark:hover:bg-[#0E121A]"
                                    >
                                        <Compass className="size-3.5 text-[#4A5FD1] dark:text-[#8FA0FA]" />
                                        <span>Visi & Misi</span>
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <Link
                                        href="/profil/sejarah"
                                        className="flex w-full cursor-pointer items-center gap-2 rounded-md px-2.5 py-2 text-xs font-medium text-[#1E2430] transition hover:bg-[#F6F7F9] dark:text-[#E6ECF5] dark:hover:bg-[#0E121A]"
                                    >
                                        <Clock className="size-3.5 text-[#2E9E82] dark:text-[#34B394]" />
                                        <span>Sejarah Organisasi</span>
                                    </Link>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {/* Keorganisasian Dropdown */}
                        <DropdownMenu>
                            <DropdownMenuTrigger className="flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium text-[#727C8E] transition outline-none hover:bg-[#F6F7F9] hover:text-[#1E2430] data-[state=open]:bg-[#F6F7F9] data-[state=open]:text-[#1E2430] dark:text-[#8C97A8] dark:hover:bg-[#0E121A] dark:hover:text-[#E6ECF5] dark:data-[state=open]:bg-[#0E121A] dark:data-[state=open]:text-[#E6ECF5]">
                                <span>Keorganisasian</span>
                                <ChevronDown className="size-3 text-[#727C8E] dark:text-[#8C97A8]" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                align="start"
                                className="w-56 rounded-lg border border-[rgba(30,36,48,0.08)] bg-white p-1.5 shadow-md dark:border-[rgba(255,255,255,0.08)] dark:bg-[#181E2B]"
                            >
                                <DropdownMenuItem asChild>
                                    <Link
                                        href="/keorganisasian/struktur"
                                        className="flex w-full cursor-pointer items-center gap-2 rounded-md px-2.5 py-2 text-xs font-medium text-[#1E2430] transition hover:bg-[#F6F7F9] dark:text-[#E6ECF5] dark:hover:bg-[#0E121A]"
                                    >
                                        <Users className="size-3.5 text-[#4A5FD1] dark:text-[#8FA0FA]" />
                                        <span>Struktur Kepengurusan</span>
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <Link
                                        href="/keorganisasian/divisi"
                                        className="flex w-full cursor-pointer items-center gap-2 rounded-md px-2.5 py-2 text-xs font-medium text-[#1E2430] transition hover:bg-[#F6F7F9] dark:text-[#E6ECF5] dark:hover:bg-[#0E121A]"
                                    >
                                        <Layers className="size-3.5 text-[#B8862E] dark:text-[#D4A142]" />
                                        <span>Divisi & Bidang</span>
                                    </Link>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <Link
                            href="/blog"
                            className={`flex items-center gap-1.5 ${navLinkClass('/blog')}`}
                        >
                            <Newspaper className="size-3.5 text-[#727C8E] dark:text-[#8C97A8]" />
                            <span>Blog / Berita</span>
                            {isActive('/blog') && (
                                <span className="absolute inset-x-3 -bottom-[1px] h-[2px] rounded-full bg-[#4A5FD1]" />
                            )}
                        </Link>

                        <Link
                            href="/kalender"
                            className={`flex items-center gap-1.5 ${navLinkClass('/kalender')}`}
                        >
                            <Calendar className="size-3.5 text-[#4A5FD1] dark:text-[#8FA0FA]" />
                            <span>Kalender Kegiatan</span>
                            {isActive('/kalender') && (
                                <span className="absolute inset-x-3 -bottom-[1px] h-[2px] rounded-full bg-[#4A5FD1]" />
                            )}
                        </Link>

                        <Link
                            href="/wish-wall"
                            className={`flex items-center gap-1.5 ${navLinkClass('/wish-wall')}`}
                        >
                            <Sparkles className="size-3.5 text-[#B8862E] dark:text-[#D4A142]" />
                            <span>Wish Wall</span>
                            {isActive('/wish-wall') && (
                                <span className="absolute inset-x-3 -bottom-[1px] h-[2px] rounded-full bg-[#4A5FD1]" />
                            )}
                        </Link>
                    </nav>

                    {/* Mobile Hamburger Toggle Button */}
                    <button
                        type="button"
                        onClick={() => setMobileOpen(!mobileOpen)}
                        className="flex size-9 items-center justify-center rounded-lg border border-[rgba(30,36,48,0.12)] bg-white text-[#1E2430] transition hover:bg-[#F6F7F9] lg:hidden dark:border-[rgba(255,255,255,0.12)] dark:bg-[#181E2B] dark:text-[#E6ECF5] dark:hover:bg-[#21293A]"
                        aria-label="Menu navigasi"
                    >
                        {mobileOpen ? (
                            <X className="size-4.5" />
                        ) : (
                            <Menu className="size-4.5" />
                        )}
                    </button>
                </div>
            </div>

            {/* ── Mobile Navigation Drawer ── */}
            {mobileOpen && (
                <div className="animate-in border-b border-[rgba(30,36,48,0.08)] bg-white px-4 py-4 shadow-lg slide-in-from-top-2 lg:hidden dark:border-[rgba(255,255,255,0.08)] dark:bg-[#181E2B]">
                    <div className="flex flex-col gap-1">
                        <Link
                            href="/"
                            onClick={() => setMobileOpen(false)}
                            className={`rounded-md px-3 py-2 text-xs font-medium ${
                                isActive('/') && currentUrl === '/'
                                    ? 'bg-[#4A5FD1]/10 font-semibold text-[#4A5FD1] dark:bg-[#4A5FD1]/20 dark:text-[#8FA0FA]'
                                    : 'text-[#1E2430] hover:bg-[#F6F7F9] dark:text-[#E6ECF5] dark:hover:bg-[#21293A]'
                            }`}
                        >
                            Beranda
                        </Link>

                        {/* Profil Accordion */}
                        <div className="my-1 rounded-lg border border-[rgba(30,36,48,0.06)] bg-[#F6F7F9]/50 p-2 dark:border-[rgba(255,255,255,0.06)] dark:bg-[#21293A]/50">
                            <button
                                type="button"
                                onClick={() => setProfilOpen(!profilOpen)}
                                className="flex w-full items-center justify-between px-2 py-1 text-[11px] font-semibold tracking-wider text-[#727C8E] uppercase dark:text-[#8C97A8]"
                            >
                                <span>Profil Organisasi</span>
                                <ChevronDown
                                    className={`size-3 transition-transform ${
                                        profilOpen ? 'rotate-180' : ''
                                    }`}
                                />
                            </button>
                            {profilOpen && (
                                <div className="mt-1 flex flex-col gap-0.5">
                                    <Link
                                        href="/profil/visi-misi"
                                        onClick={() => setMobileOpen(false)}
                                        className="flex items-center gap-2 rounded-md px-2 py-1.5 text-xs font-medium text-[#1E2430] hover:bg-white dark:text-[#E6ECF5] dark:hover:bg-[#181E2B]"
                                    >
                                        <Compass className="size-3.5 text-[#4A5FD1] dark:text-[#8FA0FA]" />
                                        <span>Visi & Misi</span>
                                    </Link>
                                    <Link
                                        href="/profil/sejarah"
                                        onClick={() => setMobileOpen(false)}
                                        className="flex items-center gap-2 rounded-md px-2 py-1.5 text-xs font-medium text-[#1E2430] hover:bg-white dark:text-[#E6ECF5] dark:hover:bg-[#181E2B]"
                                    >
                                        <Clock className="size-3.5 text-[#2E9E82] dark:text-[#34B394]" />
                                        <span>Sejarah Organisasi</span>
                                    </Link>
                                </div>
                            )}
                        </div>

                        {/* Keorganisasian Accordion */}
                        <div className="my-1 rounded-lg border border-[rgba(30,36,48,0.06)] bg-[#F6F7F9]/50 p-2 dark:border-[rgba(255,255,255,0.06)] dark:bg-[#21293A]/50">
                            <button
                                type="button"
                                onClick={() =>
                                    setOrganisasiOpen(!organisasiOpen)
                                }
                                className="flex w-full items-center justify-between px-2 py-1 text-[11px] font-semibold tracking-wider text-[#727C8E] uppercase dark:text-[#8C97A8]"
                            >
                                <span>Keorganisasian</span>
                                <ChevronDown
                                    className={`size-3 transition-transform ${
                                        organisasiOpen ? 'rotate-180' : ''
                                    }`}
                                />
                            </button>
                            {organisasiOpen && (
                                <div className="mt-1 flex flex-col gap-0.5">
                                    <Link
                                        href="/keorganisasian/struktur"
                                        onClick={() => setMobileOpen(false)}
                                        className="flex items-center gap-2 rounded-md px-2 py-1.5 text-xs font-medium text-[#1E2430] hover:bg-white dark:text-[#E6ECF5] dark:hover:bg-[#181E2B]"
                                    >
                                        <Users className="size-3.5 text-[#4A5FD1] dark:text-[#8FA0FA]" />
                                        <span>Struktur Kepengurusan</span>
                                    </Link>
                                    <Link
                                        href="/keorganisasian/divisi"
                                        onClick={() => setMobileOpen(false)}
                                        className="flex items-center gap-2 rounded-md px-2 py-1.5 text-xs font-medium text-[#1E2430] hover:bg-white dark:text-[#E6ECF5] dark:hover:bg-[#181E2B]"
                                    >
                                        <Layers className="size-3.5 text-[#B8862E] dark:text-[#D4A142]" />
                                        <span>Divisi & Bidang</span>
                                    </Link>
                                </div>
                            )}
                        </div>

                        <Link
                            href="/blog"
                            onClick={() => setMobileOpen(false)}
                            className={`flex items-center gap-2 rounded-md px-3 py-2 text-xs font-medium ${
                                isActive('/blog')
                                    ? 'bg-[#4A5FD1]/10 font-semibold text-[#4A5FD1] dark:bg-[#4A5FD1]/20 dark:text-[#8FA0FA]'
                                    : 'text-[#1E2430] hover:bg-[#F6F7F9] dark:text-[#E6ECF5] dark:hover:bg-[#21293A]'
                            }`}
                        >
                            <Newspaper className="size-3.5 text-[#727C8E] dark:text-[#8C97A8]" />
                            <span>Blog / Berita</span>
                        </Link>
                        <Link
                            href="/kalender"
                            onClick={() => setMobileOpen(false)}
                            className={`flex items-center gap-2 rounded-md px-3 py-2 text-xs font-medium ${
                                isActive('/kalender')
                                    ? 'bg-[#4A5FD1]/10 font-semibold text-[#4A5FD1] dark:bg-[#4A5FD1]/20 dark:text-[#8FA0FA]'
                                    : 'text-[#1E2430] hover:bg-[#F6F7F9] dark:text-[#E6ECF5] dark:hover:bg-[#21293A]'
                            }`}
                        >
                            <Calendar className="size-3.5 text-[#4A5FD1] dark:text-[#8FA0FA]" />
                            <span>Kalender Kegiatan</span>
                        </Link>
                        <Link
                            href="/wish-wall"
                            onClick={() => setMobileOpen(false)}
                            className={`flex items-center gap-2 rounded-md px-3 py-2 text-xs font-medium ${
                                isActive('/wish-wall')
                                    ? 'bg-[#4A5FD1]/10 font-semibold text-[#4A5FD1] dark:bg-[#4A5FD1]/20 dark:text-[#8FA0FA]'
                                    : 'text-[#1E2430] hover:bg-[#F6F7F9] dark:text-[#E6ECF5] dark:hover:bg-[#21293A]'
                            }`}
                        >
                            <Sparkles className="size-3.5 text-[#B8862E] dark:text-[#D4A142]" />
                            <span>Wish Wall</span>
                        </Link>
                    </div>
                </div>
            )}
        </header>
    );
}
