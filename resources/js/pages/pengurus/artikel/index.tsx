import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    Calendar,
    Eye,
    FileText,
    Image as ImageIcon,
    Pencil,
    Plus,
    Search,
    Trash2,
    User as UserIcon,
} from 'lucide-react';
import { useState } from 'react';
import { confirmDelete } from '@/lib/sweetalert';
import {dashboard as pengurusDashboard } from '@/routes/pengurus';
import AnggotaIndex from '@/pages/pengurus/anggota';

import ReadOnlyBanner from '@/components/read-only-banner';

// ─── Types ────────────────────────────────────────────────────────────────────

type ArtikelItem = {
    id: number;
    judul: string;
    slug: string;
    ringkasan: string;
    gambar_sampul: string | null;
    status: 'draft' | 'terbit';
    diterbitkan_pada: string | null;
    created_at: string;
    penulis?: {
        id: number;
        name: string;
        nim?: string;
        email?: string;
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
    filters: {
        status: string;
        search: string;
    };
    stats: {
        total: number;
        terbit: number;
        draft: number;
    };
    canManage?: boolean;
    isReadOnly?: boolean;
};

// ─── Format Tanggal ───────────────────────────────────────────────────────────

function formatDate(dateStr: string | null): string {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    }).format(d);
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ArtikelIndex({
    articles,
    filters,
    stats,
    canManage = true,
    isReadOnly = false,
}: Props) {
    const { currentTeam, auth } = usePage().props as any;
    const teamSlug = currentTeam?.slug ?? '';

    const [statusFilter, setStatusFilter] = useState(filters.status || 'semua');
    const [searchQuery, setSearchQuery] = useState(filters.search || '');

    const applyFilter = (newStatus: string, newSearch: string) => {
        router.get(
            `/${teamSlug}/pengurus/artikel`,
            {
                status: newStatus !== 'semua' ? newStatus : undefined,
                search: newSearch.trim() || undefined,
            },
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    };

    const handleStatusChange = (status: string) => {
        setStatusFilter(status);
        applyFilter(status, searchQuery);
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        applyFilter(statusFilter, searchQuery);
    };

    const handleDelete = async (artikel: ArtikelItem) => {
        const confirmed = await confirmDelete(
            'Artikel',
            `Artikel "${artikel.judul}" akan dihapus permanen beserta gambar sampulnya.`,
        );
        if (confirmed) {
            router.delete(`/${teamSlug}/pengurus/artikel/${artikel.id}`, {
                preserveScroll: true,
            });
        }
    };

    return (
        <>
            <Head title="Kelola Artikel & Berita - SIGAP" />

            <div className="flex h-full flex-col gap-6 p-4 sm:p-6 lg:p-8">
                {isReadOnly && (
                    <ReadOnlyBanner
                        roleName={auth?.user?.role === 'pembina' ? 'Pembina' : 'Arsip Periode'}
                        message="Mode pemantauan: Modul artikel & berita bersifat read-only. Penulisan dan penyuntingan artikel dinonaktifkan."
                    />
                )}

                {/* ── Header ── */}
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="font-display text-2xl font-semibold tracking-tight text-[#1E2430] sm:text-3xl dark:text-[#E6ECF5]">
                                Kelola Artikel & Berita
                            </h1>
                            <span className="rounded-full bg-[#4A5FD1]/10 px-2.5 py-0.5 font-mono-sigap text-xs font-semibold text-[#4A5FD1] dark:bg-[#4A5FD1]/20 dark:text-[#8FA0FA]">
                                {stats.total}
                            </span>
                        </div>
                        <p className="mt-0.5 text-xs text-[#727C8E] dark:text-[#8C97A8]">
                            Kelola publikasi berita, liputan kegiatan, dan dokumentasi artikel untuk publik
                        </p>
                    </div>

                    <div className="flex items-center gap-2.5">
                        <Link
                            href="/blog"
                            target="_blank"
                            className="flex items-center gap-1.5 rounded-lg border border-[rgba(30,36,48,0.12)] bg-white px-3.5 py-2 text-xs font-medium text-[#1E2430] transition hover:bg-[#F6F7F9] dark:border-[rgba(255,255,255,0.12)] dark:bg-[#181E2B] dark:text-[#E6ECF5] dark:hover:bg-[#21293A]"
                        >
                            <Eye className="size-3.5 text-[#727C8E] dark:text-[#8C97A8]" />
                            <span>Lihat Halaman Publik</span>
                        </Link>

                        {canManage && (
                            <Link
                                href={`/${teamSlug}/pengurus/artikel/create`}
                                className="flex items-center gap-1.5 rounded-lg bg-[#4A5FD1] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#3B4DB8]"
                            >
                                <Plus className="size-4" />
                                <span>Tulis Artikel Baru</span>
                            </Link>
                        )}
                    </div>
                </div>

                {/* ── Metric Cards ── */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="flex items-center gap-3.5 rounded-lg border border-[rgba(30,36,48,0.08)] bg-white p-5 shadow-xs dark:border-[rgba(255,255,255,0.08)] dark:bg-[#181E2B]">
                        <div className="flex size-10 items-center justify-center rounded-md bg-[#4A5FD1]/12 text-[#4A5FD1] dark:bg-[#4A5FD1]/20 dark:text-[#8FA0FA]">
                            <FileText className="size-5" />
                        </div>
                        <div>
                            <p className="text-[11px] font-semibold tracking-wider text-[#727C8E] uppercase dark:text-[#8C97A8]">
                                Total Artikel
                            </p>
                            <p className="font-display font-mono-sigap text-2xl font-semibold text-[#1E2430] dark:text-[#E6ECF5]">
                                {stats.total}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3.5 rounded-lg border border-[rgba(30,36,48,0.08)] bg-white p-5 shadow-xs dark:border-[rgba(255,255,255,0.08)] dark:bg-[#181E2B]">
                        <div className="flex size-10 items-center justify-center rounded-md bg-[#2E9E82]/12 text-[#2E9E82] dark:bg-[#2E9E82]/20 dark:text-[#34B394]">
                            <Eye className="size-5" />
                        </div>
                        <div>
                            <p className="text-[11px] font-semibold tracking-wider text-[#727C8E] uppercase dark:text-[#8C97A8]">
                                Resmi Terbit
                            </p>
                            <p className="font-display font-mono-sigap text-2xl font-semibold text-[#2E9E82] dark:text-[#34B394]">
                                {stats.terbit}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3.5 rounded-lg border border-[rgba(30,36,48,0.08)] bg-white p-5 shadow-xs dark:border-[rgba(255,255,255,0.08)] dark:bg-[#181E2B]">
                        <div className="flex size-10 items-center justify-center rounded-md bg-[#727C8E]/12 text-[#727C8E] dark:bg-[#727C8E]/20 dark:text-[#8C97A8]">
                            <FileText className="size-5" />
                        </div>
                        <div>
                            <p className="text-[11px] font-semibold tracking-wider text-[#727C8E] uppercase dark:text-[#8C97A8]">
                                Draft
                            </p>
                            <p className="font-display font-mono-sigap text-2xl font-semibold text-[#727C8E] dark:text-[#8C97A8]">
                                {stats.draft}
                            </p>
                        </div>
                    </div>
                </div>

                {/* ── Table Card with Filters ── */}
                <div className="rounded-lg border border-[rgba(30,36,48,0.08)] bg-white shadow-xs dark:border-[rgba(255,255,255,0.08)] dark:bg-[#181E2B]">
                    {/* Filter & Search Bar */}
                    <div className="flex flex-col gap-3 border-b border-[rgba(30,36,48,0.08)] p-4 sm:flex-row sm:items-center sm:justify-between dark:border-[rgba(255,255,255,0.08)]">
                        {/* Status Tabs */}
                        <div className="flex items-center gap-1 rounded-lg border border-[rgba(30,36,48,0.08)] bg-[#F6F7F9] p-1 dark:border-[rgba(255,255,255,0.08)] dark:bg-[#21293A]">
                            {[
                                { key: 'semua', label: 'Semua', count: stats.total },
                                { key: 'terbit', label: 'Terbit', count: stats.terbit },
                                { key: 'draft', label: 'Draft', count: stats.draft },
                            ].map((tab) => (
                                <button
                                    key={tab.key}
                                    type="button"
                                    onClick={() => handleStatusChange(tab.key)}
                                    className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                                        statusFilter === tab.key
                                            ? 'bg-white text-[#1E2430] shadow-xs dark:bg-[#181E2B] dark:text-[#E6ECF5]'
                                            : 'text-[#727C8E] hover:text-[#1E2430] dark:text-[#8C97A8] dark:hover:text-[#E6ECF5]'
                                    }`}
                                >
                                    <span>{tab.label}</span>
                                    <span
                                        className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                                            statusFilter === tab.key
                                                ? 'bg-[#4A5FD1]/10 text-[#4A5FD1] dark:bg-[#4A5FD1]/20 dark:text-[#8FA0FA]'
                                                : 'bg-black/5 text-[#727C8E] dark:bg-white/10 dark:text-[#8C97A8]'
                                        }`}
                                    >
                                        {tab.count}
                                    </span>
                                </button>
                            ))}
                        </div>

                        {/* Search input */}
                        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
                            <div className="relative flex items-center">
                                <Search className="absolute left-3 size-3.5 text-[#727C8E] dark:text-[#8C97A8]" />
                                <input
                                    type="text"
                                    placeholder="Cari judul / konten..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full rounded-lg border border-[rgba(30,36,48,0.12)] bg-[#F6F7F9]/50 py-1.5 pr-3 pl-8 text-xs text-[#1E2430] placeholder-[#727C8E]/70 focus:border-[#4A5FD1] focus:bg-white focus:outline-none sm:w-64 dark:border-[rgba(255,255,255,0.12)] dark:bg-[#21293A]/50 dark:text-[#E6ECF5] dark:focus:bg-[#181E2B]"
                                />
                            </div>
                            <button
                                type="submit"
                                className="rounded-lg bg-[#4A5FD1] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#3B4DB8]"
                            >
                                Cari
                            </button>
                        </form>
                    </div>

                    {/* Table */}
                    {articles.data.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <div className="flex size-12 items-center justify-center rounded-full bg-[#F6F7F9] text-[#727C8E] dark:bg-[#21293A] dark:text-[#8C97A8]">
                                <FileText className="size-6" />
                            </div>
                            <h3 className="mt-3 font-display text-sm font-semibold text-[#1E2430] dark:text-[#E6ECF5]">
                                Belum ada artikel
                            </h3>
                            <p className="mt-1 max-w-sm text-xs text-[#727C8E] dark:text-[#8C97A8]">
                                {searchQuery || statusFilter !== 'semua'
                                    ? 'Tidak ada artikel yang cocok dengan filter pencarian.'
                                    : 'Mulai buat artikel pertama Anda untuk membagikan kabar dan kegiatan organisasi.'}
                            </p>
                            {canManage && (
                                <Link
                                    href={`/${teamSlug}/pengurus/artikel/create`}
                                    className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-[#4A5FD1] px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-[#3B4DB8]"
                                >
                                    <Plus className="size-3.5" />
                                    <span>Tulis Artikel Baru</span>
                                </Link>
                            )}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead>
                                    <tr className="border-b border-[rgba(30,36,48,0.08)] bg-[#F6F7F9]/60 text-[11px] font-semibold tracking-wider text-[#727C8E] uppercase dark:border-[rgba(255,255,255,0.08)] dark:bg-[#21293A]/40 dark:text-[#8C97A8]">
                                        <th className="px-5 py-3">Artikel</th>
                                        <th className="hidden px-5 py-3 md:table-cell">Penulis</th>
                                        <th className="px-5 py-3">Status</th>
                                        <th className="hidden px-5 py-3 sm:table-cell">Tanggal Terbit</th>
                                        <th className="px-5 py-3 text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[rgba(30,36,48,0.06)] dark:divide-[rgba(255,255,255,0.06)]">
                                    {articles.data.map((item) => (
                                        <tr
                                            key={item.id}
                                            className="transition hover:bg-[#FAFBFC] dark:hover:bg-[#1A2030]"
                                        >
                                            {/* Artikel & Sampul */}
                                            <td className="px-5 py-3.5">
                                                <div className="flex items-start gap-3">
                                                    {item.gambar_sampul ? (
                                                        <img
                                                            src={`/storage/${item.gambar_sampul}`}
                                                            alt={item.judul}
                                                            className="size-12 shrink-0 rounded-md border border-[rgba(30,36,48,0.08)] object-cover dark:border-[rgba(255,255,255,0.08)]"
                                                        />
                                                    ) : (
                                                        <div className="flex size-12 shrink-0 items-center justify-center rounded-md border border-[rgba(30,36,48,0.08)] bg-[#F6F7F9] text-[#727C8E] dark:border-[rgba(255,255,255,0.08)] dark:bg-[#21293A] dark:text-[#8C97A8]">
                                                            <ImageIcon className="size-5" />
                                                        </div>
                                                    )}
                                                    <div className="min-w-0 flex-1">
                                                        <Link
                                                            href={`/${teamSlug}/pengurus/artikel/${item.id}/edit`}
                                                            className="font-display font-semibold text-[#1E2430] hover:text-[#4A5FD1] dark:text-[#E6ECF5] dark:hover:text-[#8FA0FA]"
                                                        >
                                                            {item.judul}
                                                        </Link>
                                                        <p className="mt-0.5 line-clamp-1 text-xs text-[#727C8E] dark:text-[#8C97A8]">
                                                            {item.ringkasan}
                                                        </p>
                                                        <div className="mt-1 flex items-center gap-2">
                                                            <span className="font-mono-sigap text-[10px] text-[#727C8E] dark:text-[#8C97A8]">
                                                                /blog/{item.slug}
                                                            </span>
                                                            {item.status === 'terbit' && (
                                                                <Link
                                                                    href={`/blog/${item.slug}`}
                                                                    target="_blank"
                                                                    className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-[#4A5FD1] hover:underline dark:text-[#8FA0FA]"
                                                                >
                                                                    <Eye className="size-2.5" />
                                                                    <span>Buka URL</span>
                                                                </Link>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Penulis */}
                                            <td className="hidden px-5 py-3.5 text-[#4A5060] md:table-cell dark:text-[#9BA4B4]">
                                                <div className="flex items-center gap-1.5">
                                                    <UserIcon className="size-3 text-[#727C8E] dark:text-[#8C97A8]" />
                                                    <span className="font-medium">
                                                        {item.penulis?.name ?? 'Anonim'}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Status Badge */}
                                            <td className="px-5 py-3.5">
                                                {item.status === 'terbit' ? (
                                                    <span className="inline-flex items-center gap-1 rounded-md bg-[#2E9E82]/12 px-2 py-0.5 text-[11px] font-semibold text-[#2E9E82] dark:bg-[#2E9E82]/20 dark:text-[#34B394]">
                                                        <span className="size-1.5 rounded-full bg-[#2E9E82]" />
                                                        Terbit
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 rounded-md bg-[#727C8E]/12 px-2 py-0.5 text-[11px] font-semibold text-[#727C8E] dark:bg-[#727C8E]/20 dark:text-[#8C97A8]">
                                                        <span className="size-1.5 rounded-full bg-[#727C8E]" />
                                                        Draft
                                                    </span>
                                                )}
                                            </td>

                                            {/* Tanggal Terbit */}
                                            <td className="hidden px-5 py-3.5 text-xs text-[#727C8E] sm:table-cell dark:text-[#8C97A8]">
                                                <div className="flex items-center gap-1.5">
                                                    <Calendar className="size-3" />
                                                    <span>{formatDate(item.diterbitkan_pada || item.created_at)}</span>
                                                </div>
                                            </td>

                                            {/* Aksi */}
                                            <td className="px-5 py-3.5 text-right">
                                                {canManage ? (
                                                    <div className="inline-flex items-center gap-1">
                                                        <Link
                                                            href={`/${teamSlug}/pengurus/artikel/${item.id}/edit`}
                                                            className="rounded-md p-1.5 text-[#727C8E] transition hover:bg-[#F6F7F9] hover:text-[#1E2430] dark:text-[#8C97A8] dark:hover:bg-[#21293A] dark:hover:text-[#E6ECF5]"
                                                            title="Edit artikel"
                                                        >
                                                            <Pencil className="size-3.5" />
                                                        </Link>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleDelete(item)}
                                                            className="rounded-md p-1.5 text-[#C4514A] transition hover:bg-[#C4514A]/10 dark:hover:bg-[#C4514A]/20"
                                                            title="Hapus artikel"
                                                        >
                                                            <Trash2 className="size-3.5" />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-[#727C8E]/50">—</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Pagination */}
                    {articles.last_page > 1 && (
                        <div className="flex items-center justify-between border-t border-[rgba(30,36,48,0.08)] px-5 py-3 dark:border-[rgba(255,255,255,0.08)]">
                            <p className="text-xs text-[#727C8E] dark:text-[#8C97A8]">
                                Halaman {articles.current_page} dari {articles.last_page} ({articles.total} artikel)
                            </p>
                            <div className="flex items-center gap-1">
                                {articles.links.map((link, idx) => {
                                    if (!link.url) {
                                        return (
                                            <span
                                                key={idx}
                                                dangerouslySetInnerHTML={{ __html: link.label }}
                                                className="rounded-md px-2.5 py-1 text-xs text-[#727C8E]/50 dark:text-[#8C97A8]/50"
                                            />
                                        );
                                    }
                                    return (
                                        <Link
                                            key={idx}
                                            href={link.url}
                                            preserveScroll
                                            preserveState
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                            className={`rounded-md px-2.5 py-1 text-xs font-semibold transition ${
                                                link.active
                                                    ? 'bg-[#4A5FD1] text-white'
                                                    : 'text-[#727C8E] hover:bg-[#F6F7F9] hover:text-[#1E2430] dark:text-[#8C97A8] dark:hover:bg-[#21293A] dark:hover:text-[#E6ECF5]'
                                            }`}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

ArtikelIndex.layout = (props: { currentTeam?: { slug: string } | null }) => ({
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: props.currentTeam
                ? pengurusDashboard.url(props.currentTeam.slug)
                : '/',
        },
        {
            title: 'Pengurus',
            href: '#',
        },
        {
            title: 'Kelola Artikel & Berita',
            href: '#',
        },
    ],
});
