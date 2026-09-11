import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowRight,
    Calendar,
    Clock,
    Image as ImageIcon,
    Newspaper,
    Search,
    User as UserIcon,
} from 'lucide-react';
import { useState } from 'react';
import PublicLayout from '@/layouts/public-layout';

// ─── Types ────────────────────────────────────────────────────────────────────

type ArtikelItem = {
    id: number;
    judul: string;
    slug: string;
    ringkasan: string;
    konten: string;
    gambar_sampul: string | null;
    diterbitkan_pada: string | null;
    created_at: string;
    penulis?: {
        id: number;
        name: string;
    } | null;
};

type PaginatedArticles = {
    data: ArtikelItem[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    prev_page_url: string | null;
    next_page_url: string | null;
    links: { url: string | null; label: string; active: boolean }[];
};

type Props = {
    articles: PaginatedArticles;
    featured: ArtikelItem | null;
    filters: {
        search: string;
    };
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr: string | null): string {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    }).format(d);
}

function calculateReadingTime(text: string): string {
    if (!text) return '1 menit baca';
    const wordsPerMinute = 200;
    const words = text.trim().split(/\s+/).length;
    const minutes = Math.ceil(words / wordsPerMinute);
    return `${minutes} menit baca`;
}

// ─── Public Blog Index Page ───────────────────────────────────────────────────

export default function BlogIndex({ articles, featured, filters }: Props) {
    const [searchQuery, setSearchQuery] = useState(filters.search || '');

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            '/blog',
            { search: searchQuery.trim() || undefined },
            { preserveState: true, preserveScroll: true },
        );
    };

    // Filter out the featured item from the standard grid if shown on page 1
    const gridArticles =
        featured && !filters.search && articles.current_page === 1
            ? articles.data.filter((a) => a.id !== featured.id)
            : articles.data;

    return (
        <PublicLayout
            title="Blog & Berita Kegiatan — HMIF SIGAP"
            description="Kabar terbaru, liputan acara, dan dokumentasi kegiatan Himpunan Mahasiswa Teknik Informatika."
        >
            {/* ── Hero Header ── */}
            <section className="border-b border-[rgba(30,36,48,0.08)] bg-white py-14 sm:py-18 dark:border-[rgba(255,255,255,0.08)] dark:bg-[#181E2B]/60">
                <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
                        <div className="max-w-2xl">
                            <div className="mb-3 inline-flex items-center gap-1.5 rounded-md border border-[#4A5FD1]/30 bg-[#4A5FD1]/10 px-3 py-1 text-xs font-semibold text-[#4A5FD1] dark:border-[#4A5FD1]/40 dark:bg-[#4A5FD1]/20 dark:text-[#8FA0FA]">
                                <Newspaper className="size-3.5" />
                                <span>Kabar & Publikasi</span>
                            </div>
                            <h1 className="font-display text-3xl font-semibold tracking-tight text-[#1E2430] sm:text-4xl dark:text-[#E6ECF5]">
                                Blog & Berita Organisasi
                            </h1>
                            <p className="mt-2 text-xs leading-relaxed text-[#727C8E] sm:text-sm dark:text-[#8C97A8]">
                                Ikuti perkembangan terkini seputar liputan program kerja, kabar prestasi, dan wawasan teknologi dari HMIF.
                            </p>
                        </div>

                        {/* Search Input */}
                        <form onSubmit={handleSearchSubmit} className="w-full sm:w-72">
                            <div className="relative flex items-center">
                                <Search className="absolute left-3 size-3.5 text-[#727C8E] dark:text-[#8C97A8]" />
                                <input
                                    type="text"
                                    placeholder="Cari artikel atau topik..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full rounded-lg border border-[rgba(30,36,48,0.12)] bg-[#F6F7F9]/70 py-2 pr-3 pl-8.5 text-xs text-[#1E2430] placeholder-[#727C8E]/70 focus:border-[#4A5FD1] focus:bg-white focus:outline-none dark:border-[rgba(255,255,255,0.12)] dark:bg-[#21293A]/50 dark:text-[#E6ECF5] dark:focus:bg-[#181E2B]"
                                />
                            </div>
                        </form>
                    </div>
                </div>
            </section>

            {/* ── Content Container ── */}
            <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8 min-h-screen">
                {/* ── Featured Article (First Page Only) ── */}
                {featured && !filters.search && articles.current_page === 1 && (
                    <div className="mb-12">
                        <Link
                            href={`/blog/${featured.slug}`}
                            className="group grid overflow-hidden rounded-xl border border-[rgba(30,36,48,0.08)] bg-white transition hover:border-[#4A5FD1]/30 sm:grid-cols-12 dark:border-[rgba(255,255,255,0.08)] dark:bg-[#181E2B]"
                        >
                            <div className="relative aspect-video sm:aspect-auto sm:col-span-7 bg-[#F6F7F9] overflow-hidden dark:bg-[#21293A]">
                                {featured.gambar_sampul ? (
                                    <img
                                        src={`/storage/${featured.gambar_sampul}`}
                                        alt={featured.judul}
                                        className="h-full w-full object-cover transition duration-300 group-hover:scale-102"
                                    />
                                ) : (
                                    <div className="flex h-full min-h-[220px] items-center justify-center text-[#727C8E] dark:text-[#8C97A8]">
                                        <ImageIcon className="size-12" />
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-col justify-between p-6 sm:col-span-5 sm:p-8">
                                <div>
                                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-[#727C8E] dark:text-[#8C97A8]">
                                        <span className="rounded-md bg-[#4A5FD1]/10 px-2 py-0.5 font-semibold text-[#4A5FD1] uppercase tracking-wide dark:bg-[#4A5FD1]/20 dark:text-[#8FA0FA]">
                                            Terbaru
                                        </span>
                                        <div className="flex items-center gap-1">
                                            <Calendar className="size-3" />
                                            <span>
                                                {formatDate(
                                                    featured.diterbitkan_pada || featured.created_at,
                                                )}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Clock className="size-3" />
                                            <span>{calculateReadingTime(featured.konten)}</span>
                                        </div>
                                    </div>

                                    <h2 className="mt-3 font-display text-xl font-semibold text-[#1E2430] transition group-hover:text-[#4A5FD1] sm:text-2xl dark:text-[#E6ECF5] dark:group-hover:text-[#8FA0FA]">
                                        {featured.judul}
                                    </h2>

                                    <p className="mt-2 text-xs leading-relaxed text-[#727C8E] sm:text-sm dark:text-[#8C97A8]">
                                        {featured.ringkasan}
                                    </p>
                                </div>

                                <div className="mt-6 flex items-center justify-between border-t border-[rgba(30,36,48,0.06)] pt-4 dark:border-[rgba(255,255,255,0.06)]">
                                    <div className="flex items-center gap-2">
                                        <div className="flex size-7 items-center justify-center rounded-full bg-[#4A5FD1]/12 text-xs font-semibold text-[#4A5FD1] dark:bg-[#4A5FD1]/20 dark:text-[#8FA0FA]">
                                            <UserIcon className="size-3.5" />
                                        </div>
                                        <span className="text-xs font-medium text-[#1E2430] dark:text-[#E6ECF5]">
                                            {featured.penulis?.name ?? 'Pengurus HMIF'}
                                        </span>
                                    </div>

                                    <span className="flex items-center gap-1 text-xs font-semibold text-[#4A5FD1] group-hover:underline dark:text-[#8FA0FA]">
                                        <span>Baca Lengkap</span>
                                        <ArrowRight className="size-3.5 transition group-hover:translate-x-1" />
                                    </span>
                                </div>
                            </div>
                        </Link>
                    </div>
                )}

                {/* ── Articles Grid ── */}
                {articles.data.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="flex size-14 items-center justify-center rounded-full bg-[#F6F7F9] text-[#727C8E] dark:bg-[#181E2B] dark:text-[#8C97A8]">
                            <Newspaper className="size-7" />
                        </div>
                        <h2 className="mt-4 font-display text-base font-semibold text-[#1E2430] dark:text-[#E6ECF5]">
                            {filters.search
                                ? 'Tidak ada artikel yang cocok'
                                : 'Belum ada artikel yang dipublikasikan'}
                        </h2>
                        <p className="mt-1 max-w-sm text-xs text-[#727C8E] dark:text-[#8C97A8]">
                            {filters.search
                                ? `Hasil pencarian untuk "${filters.search}" tidak ditemukan. Coba gunakan kata kunci lain.`
                                : 'Kabar dan artikel kegiatan akan segera hadir di sini. Silakan kunjungi kembali nanti.'}
                        </p>
                        {filters.search && (
                            <Link
                                href="/blog"
                                className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-[rgba(30,36,48,0.12)] bg-white px-3.5 py-2 text-xs font-semibold text-[#1E2430] hover:bg-[#F6F7F9] dark:border-[rgba(255,255,255,0.12)] dark:bg-[#181E2B] dark:text-[#E6ECF5]"
                            >
                                Tampilkan Semua Artikel
                            </Link>
                        )}
                    </div>
                ) : (
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {gridArticles.map((artikel) => (
                            <Link
                                key={artikel.id}
                                href={`/blog/${artikel.slug}`}
                                className="group flex flex-col justify-between overflow-hidden rounded-lg border border-[rgba(30,36,48,0.08)] bg-white transition hover:border-[#4A5FD1]/30 hover:shadow-xs dark:border-[rgba(255,255,255,0.08)] dark:bg-[#181E2B]"
                            >
                                <div>
                                    {/* Cover Thumbnail */}
                                    <div className="relative aspect-video w-full overflow-hidden bg-[#F6F7F9] dark:bg-[#21293A]">
                                        {artikel.gambar_sampul ? (
                                            <img
                                                src={`/storage/${artikel.gambar_sampul}`}
                                                alt={artikel.judul}
                                                className="h-full w-full object-cover transition duration-300 group-hover:scale-103"
                                            />
                                        ) : (
                                            <div className="flex h-full items-center justify-center text-[#727C8E] dark:text-[#8C97A8]">
                                                <ImageIcon className="size-8" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Content Info */}
                                    <div className="p-5">
                                        <div className="flex items-center gap-2 text-[11px] text-[#727C8E] dark:text-[#8C97A8]">
                                            <Calendar className="size-3" />
                                            <span>
                                                {formatDate(
                                                    artikel.diterbitkan_pada || artikel.created_at,
                                                )}
                                            </span>
                                            <span>•</span>
                                            <span>{calculateReadingTime(artikel.konten)}</span>
                                        </div>

                                        <h3 className="mt-2 font-display text-base font-semibold text-[#1E2430] transition group-hover:text-[#4A5FD1] dark:text-[#E6ECF5] dark:group-hover:text-[#8FA0FA]">
                                            {artikel.judul}
                                        </h3>

                                        <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-[#727C8E] dark:text-[#8C97A8]">
                                            {artikel.ringkasan}
                                        </p>
                                    </div>
                                </div>

                                {/* Footer Card */}
                                <div className="flex items-center justify-between border-t border-[rgba(30,36,48,0.06)] px-5 py-3 text-xs dark:border-[rgba(255,255,255,0.06)]">
                                    <span className="text-[11px] font-medium text-[#727C8E] dark:text-[#8C97A8]">
                                        Oleh {artikel.penulis?.name ?? 'Pengurus HMIF'}
                                    </span>
                                    <span className="flex items-center gap-1 font-semibold text-[#4A5FD1] group-hover:underline dark:text-[#8FA0FA]">
                                        <span>Baca</span>
                                        <ArrowRight className="size-3 transition group-hover:translate-x-0.5" />
                                    </span>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}

                {/* ── Pagination ── */}
                {articles.last_page > 1 && (
                    <div className="mt-12 flex items-center justify-center gap-1.5">
                        {articles.links.map((link, idx) => {
                            if (!link.url) {
                                return (
                                    <span
                                        key={idx}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                        className="rounded-lg px-3 py-1.5 text-xs text-[#727C8E]/50 dark:text-[#8C97A8]/50"
                                    />
                                );
                            }
                            return (
                                <Link
                                    key={idx}
                                    href={link.url}
                                    preserveScroll
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                    className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
                                        link.active
                                            ? 'bg-[#4A5FD1] text-white shadow-xs'
                                            : 'border border-[rgba(30,36,48,0.08)] bg-white text-[#727C8E] hover:bg-[#F6F7F9] hover:text-[#1E2430] dark:border-[rgba(255,255,255,0.08)] dark:bg-[#181E2B] dark:text-[#8C97A8] dark:hover:bg-[#21293A] dark:hover:text-[#E6ECF5]'
                                    }`}
                                />
                            );
                        })}
                    </div>
                )}
            </div>
        </PublicLayout>
    );
}
