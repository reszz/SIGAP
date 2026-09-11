import { Link, usePage } from '@inertiajs/react';
import { ArrowRight, Instagram, Mail, MapPin, ShieldCheck } from 'lucide-react';
import AppLogoIcon from '@/components/app-logo-icon';
import { login } from '@/routes';
import { dashboard as anggotaDashboard } from '@/routes/anggota';
import { dashboard as pengurusDashboard } from '@/routes/pengurus';

export default function PublicFooter() {
    const { auth, currentTeam } = usePage().props as any;

    const dashboardUrl = auth?.user
        ? currentTeam
            ? auth.user.role === 'pengurus'
                ? pengurusDashboard.url(currentTeam.slug)
                : anggotaDashboard.url(currentTeam.slug)
            : '/dashboard'
        : login();

    return (
        <footer className="border-t border-[rgba(30,36,48,0.08)] bg-white text-[#1E2430] dark:border-[rgba(255,255,255,0.08)] dark:bg-[#181E2B] dark:text-[#E6ECF5]">
            <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
                <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
                    {/* ── Brand & Info Sekretariat ── */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2.5">
                            <div className="flex size-8 items-center justify-center rounded-lg bg-[#4A5FD1] text-white shadow-xs">
                                <AppLogoIcon className="size-4 fill-current text-white" />
                            </div>
                            <div className="leading-tight">
                                <span className="block font-display text-base font-semibold tracking-tight text-[#1E2430] dark:text-[#E6ECF5]">
                                    HMIF
                                </span>
                                <span className="font-mono-sigap block text-[10px] tracking-wider text-[#727C8E] uppercase dark:text-[#8C97A8]">
                                    Teknik Informatika
                                </span>
                            </div>
                        </div>

                        <p className="text-xs leading-relaxed text-[#727C8E] dark:text-[#8C97A8]">
                            Himpunan Mahasiswa Teknik Informatika — wadah
                            aspirasi, kreativitas, dan pengembangan diri
                            mahasiswa Teknik Informatika, Institut Digital
                            Ekonomi LPKIA.
                        </p>

                        <div className="space-y-2 text-xs text-[#727C8E] dark:text-[#8C97A8]">
                            <div className="flex items-start gap-2">
                                <MapPin className="mt-0.5 size-3.5 shrink-0 text-[#4A5FD1]" />
                                <span>
                                    Sekretariat HMIF, Institut Digital Ekonomi
                                    LPKIA, Bandung
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Mail className="size-3.5 shrink-0 text-[#2E9E82]" />
                                <span>hmif@lpkia.ac.id</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Instagram className="size-3.5 shrink-0 text-[#B8862E]" />
                                <span>@hmif_lpkia</span>
                            </div>
                        </div>
                    </div>

                    {/* ── Profil & Keorganisasian ── */}
                    <div>
                        <h4 className="font-display text-xs font-semibold tracking-wider text-[#1E2430] uppercase dark:text-[#E6ECF5]">
                            Profil & Organisasi
                        </h4>
                        <ul className="mt-4 space-y-2 text-xs">
                            <li>
                                <Link
                                    href="/profil/visi-misi"
                                    className="text-[#727C8E] transition hover:text-[#4A5FD1] dark:text-[#8C97A8] dark:hover:text-[#8FA0FA]"
                                >
                                    Visi & Misi
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/profil/sejarah"
                                    className="text-[#727C8E] transition hover:text-[#4A5FD1] dark:text-[#8C97A8] dark:hover:text-[#8FA0FA]"
                                >
                                    Sejarah Singkat
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/keorganisasian/struktur"
                                    className="text-[#727C8E] transition hover:text-[#4A5FD1] dark:text-[#8C97A8] dark:hover:text-[#8FA0FA]"
                                >
                                    Struktur Kepengurusan
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/keorganisasian/divisi"
                                    className="text-[#727C8E] transition hover:text-[#4A5FD1] dark:text-[#8C97A8] dark:hover:text-[#8FA0FA]"
                                >
                                    Divisi & Bidang Kerja
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/keorganisasian/staff-of-the-month"
                                    className="text-[#727C8E] transition hover:text-[#4A5FD1] dark:text-[#8C97A8] dark:hover:text-[#8FA0FA]"
                                >
                                    Staff of the Month
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* ── Layanan & Aktivitas Publik ── */}
                    <div>
                        <h4 className="font-display text-xs font-semibold tracking-wider text-[#1E2430] uppercase dark:text-[#E6ECF5]">
                            Aktivitas & Interaksi
                        </h4>
                        <ul className="mt-4 space-y-2 text-xs">
                            <li>
                                <Link
                                    href="/kalender"
                                    className="text-[#727C8E] transition hover:text-[#4A5FD1] dark:text-[#8C97A8] dark:hover:text-[#8FA0FA]"
                                >
                                    Kalender Kegiatan Publik
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/blog"
                                    className="text-[#727C8E] transition hover:text-[#4A5FD1] dark:text-[#8C97A8] dark:hover:text-[#8FA0FA]"
                                >
                                    Blog & Liputan Berita
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/wish-wall"
                                    className="text-[#727C8E] transition hover:text-[#4A5FD1] dark:text-[#8C97A8] dark:hover:text-[#8FA0FA]"
                                >
                                    Wish Wall / Aspirasi
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/privacy-policy"
                                    className="flex items-center gap-1 text-[#727C8E] transition hover:text-[#4A5FD1] dark:text-[#8C97A8] dark:hover:text-[#8FA0FA]"
                                >
                                    <ShieldCheck className="size-3 text-[#2E9E82]" />
                                    <span>Kebijakan Privasi</span>
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* ── Akses Portal Internal ── */}
                    <div>
                        <h4 className="font-display text-xs font-semibold tracking-wider text-[#1E2430] uppercase dark:text-[#E6ECF5]">
                            Akses Portal Internal
                        </h4>
                        <p className="mt-4 text-xs leading-relaxed text-[#727C8E] dark:text-[#8C97A8]">
                            Masuk ke SIGAP — portal pengelolaan kegiatan untuk
                            Pengurus Divisi, Panitia Pelaksana, dan Anggota
                            HMIF.
                        </p>
                        <div className="mt-4">
                            <Link
                                href={dashboardUrl}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-[#4A5FD1]/30 bg-[#4A5FD1]/10 px-3.5 py-2 text-xs font-semibold text-[#4A5FD1] transition hover:bg-[#4A5FD1] hover:text-white dark:border-[#4A5FD1]/40 dark:bg-[#4A5FD1]/20 dark:text-[#8FA0FA] dark:hover:bg-[#4A5FD1] dark:hover:text-white"
                            >
                                <span>
                                    {auth?.user
                                        ? 'Buka Dashboard SIGAP'
                                        : 'Masuk ke Portal SIGAP'}
                                </span>
                                <ArrowRight className="size-3.5" />
                            </Link>
                        </div>
                    </div>
                </div>

                {/* ── Bottom Bar ── */}
                <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-[rgba(30,36,48,0.06)] pt-6 sm:flex-row dark:border-[rgba(255,255,255,0.06)]">
                    <p className="font-mono-sigap text-[11px] text-[#727C8E] dark:text-[#8C97A8]">
                        &copy; {new Date().getFullYear()} HMIF. Seluruh hak
                        cipta dilindungi undang-undang.
                    </p>
                    <div className="flex items-center gap-4 text-xs">
                        <Link
                            href="/privacy-policy"
                            className="text-[#727C8E] underline-offset-4 transition hover:underline dark:text-[#8C97A8]"
                        >
                            Privacy Policy
                        </Link>
                        <span className="text-[#727C8E]/40">•</span>
                        <Link
                            href={dashboardUrl}
                            className="text-[#4A5FD1] hover:underline dark:text-[#8FA0FA]"
                        >
                            {auth?.user ? 'Dashboard' : 'Portal Anggota'}
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
