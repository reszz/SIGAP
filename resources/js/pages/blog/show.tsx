import { Head, Link } from '@inertiajs/react';
import {
    ArrowLeft,
    ArrowRight,
    Calendar,
    Check,
    Clock,
    Copy,
    Image as ImageIcon,
    Share2,
    User as UserIcon,
} from 'lucide-react';
import { useState } from 'react';
import { renderMarkdownToHtml } from '@/lib/markdown';
import PublicLayout from '@/layouts/public-layout';

// ─── Types ────────────────────────────────────────────────────────────────────

type Artikel = {
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

type Props = {
    artikel: Artikel;
    recentArticles: Artikel[];
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

// ─── Main Component ───────────────────────────────────────────────────────────

export default function BlogShow({ artikel, recentArticles }: Props) {
    const [copied, setCopied] = useState(false);

    const handleCopyLink = () => {
        if (typeof window !== 'undefined') {
            navigator.clipboard.writeText(window.location.href);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <PublicLayout
            title={`${artikel.judul} — Blog HMIF SIGAP`}
            description={artikel.ringkasan}
        >
            <article className="py-10 sm:py-16">
                <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
                    {/* ── Breadcrumb / Back Link ── */}
                    <div className="mb-8 flex items-center justify-between">
                        <Link
                            href="/blog"
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#727C8E] transition hover:text-[#4A5FD1] dark:text-[#8C97A8] dark:hover:text-[#8FA0FA]"
                        >
                            <ArrowLeft className="size-3.5" />
                            <span>Kembali ke Semua Artikel</span>
                        </Link>

                        <button
                            type="button"
                            onClick={handleCopyLink}
                            className="inline-flex items-center gap-1.5 rounded-md border border-[rgba(30,36,48,0.10)] bg-white px-2.5 py-1 text-xs font-medium text-[#727C8E] transition hover:bg-[#F6F7F9] hover:text-[#1E2430] dark:border-[rgba(255,255,255,0.10)] dark:bg-[#181E2B] dark:text-[#8C97A8] dark:hover:bg-[#21293A] dark:hover:text-[#E6ECF5]"
                        >
                            {copied ? (
                                <>
                                    <Check className="size-3 text-[#2E9E82]" />
                                    <span className="text-[#2E9E82]">Tautan Tersalin</span>
                                </>
                            ) : (
                                <>
                                    <Share2 className="size-3" />
                                    <span>Bagikan</span>
                                </>
                            )}
                        </button>
                    </div>

                    {/* ── Article Header ── */}
                    <header className="mx-auto max-w-3xl text-center">
                        <div className="mb-4 inline-flex items-center gap-2 rounded-md bg-[#4A5FD1]/10 px-3 py-1 font-mono-sigap text-[11px] font-semibold text-[#4A5FD1] dark:bg-[#4A5FD1]/20 dark:text-[#8FA0FA]">
                            <span>KABAR KEGIATAN</span>
                        </div>

                        <h1 className="font-display text-2xl font-semibold tracking-tight text-[#1E2430] sm:text-4xl sm:leading-tight dark:text-[#E6ECF5]">
                            {artikel.judul}
                        </h1>

                        {/* Meta information bar */}
                        <div className="mt-6 flex flex-wrap items-center justify-center gap-4 border-y border-[rgba(30,36,48,0.08)] py-3 text-xs text-[#727C8E] dark:border-[rgba(255,255,255,0.08)] dark:text-[#8C97A8]">
                            <div className="flex items-center gap-2">
                                <div className="flex size-6 items-center justify-center rounded-full bg-[#4A5FD1]/12 text-[10px] font-semibold text-[#4A5FD1] dark:bg-[#4A5FD1]/20 dark:text-[#8FA0FA]">
                                    <UserIcon className="size-3" />
                                </div>
                                <span className="font-medium text-[#1E2430] dark:text-[#E6ECF5]">
                                    {artikel.penulis?.name ?? 'Pengurus HMIF'}
                                </span>
                            </div>

                            <span>•</span>

                            <div className="flex items-center gap-1.5">
                                <Calendar className="size-3.5" />
                                <span>
                                    {formatDate(
                                        artikel.diterbitkan_pada || artikel.created_at,
                                    )}
                                </span>
                            </div>

                            <span>•</span>

                            <div className="flex items-center gap-1.5">
                                <Clock className="size-3.5" />
                                <span>{calculateReadingTime(artikel.konten)}</span>
                            </div>
                        </div>
                    </header>

                    {/* ── Cover Image (if available) ── */}
                    {artikel.gambar_sampul && (
                        <div className="mt-8 overflow-hidden rounded-xl border border-[rgba(30,36,48,0.08)] bg-white shadow-xs dark:border-[rgba(255,255,255,0.08)] dark:bg-[#181E2B]">
                            <img
                                src={`/storage/${artikel.gambar_sampul}`}
                                alt={artikel.judul}
                                className="aspect-21/9 w-full object-cover sm:aspect-16/9"
                            />
                        </div>
                    )}

                    {/* ── Summary / Lead paragraph ── */}
                    {artikel.ringkasan && (
                        <div className="mx-auto mt-8 max-w-3xl rounded-lg border-l-3 border-[#4A5FD1] bg-[#F6F7F9]/80 p-4 text-xs font-medium leading-relaxed text-[#4A5060] sm:text-sm dark:bg-[#181E2B]/80 dark:text-[#9BA4B4]">
                            <p>{artikel.ringkasan}</p>
                        </div>
                    )}

                    {/* ── Main Content Body ── */}
                    <div className="mx-auto mt-8 max-w-3xl">
                        <div
                            className="article-content leading-relaxed"
                            dangerouslySetInnerHTML={{
                                __html: renderMarkdownToHtml(artikel.konten),
                            }}
                        />
                    </div>

                    {/* ── Author Card & Share Footer ── */}
                    <div className="mx-auto mt-12 max-w-3xl border-t border-[rgba(30,36,48,0.08)] pt-8 dark:border-[rgba(255,255,255,0.08)]">
                        <div className="flex flex-col items-center justify-between gap-4 rounded-xl border border-[rgba(30,36,48,0.08)] bg-white p-6 sm:flex-row dark:border-[rgba(255,255,255,0.08)] dark:bg-[#181E2B]">
                            <div className="flex items-center gap-3.5">
                                <div className="flex size-11 items-center justify-center rounded-full bg-[#4A5FD1]/12 text-sm font-semibold text-[#4A5FD1] dark:bg-[#4A5FD1]/20 dark:text-[#8FA0FA]">
                                    <UserIcon className="size-5" />
                                </div>
                                <div>
                                    <p className="text-[11px] font-semibold tracking-wider text-[#727C8E] uppercase dark:text-[#8C97A8]">
                                        Ditulis oleh
                                    </p>
                                    <p className="font-display text-sm font-semibold text-[#1E2430] dark:text-[#E6ECF5]">
                                        {artikel.penulis?.name ?? 'Pengurus HMIF'}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={handleCopyLink}
                                    className="flex items-center gap-1.5 rounded-lg border border-[rgba(30,36,48,0.12)] bg-[#F6F7F9] px-3.5 py-2 text-xs font-semibold text-[#1E2430] transition hover:bg-white dark:border-[rgba(255,255,255,0.12)] dark:bg-[#21293A] dark:text-[#E6ECF5] dark:hover:bg-[#181E2B]"
                                >
                                    {copied ? (
                                        <>
                                            <Check className="size-3.5 text-[#2E9E82]" />
                                            <span>Tautan Tersalin!</span>
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="size-3.5" />
                                            <span>Salin Tautan</span>
                                        </>
                                    )}
                                </button>
                                <Link
                                    href="/blog"
                                    className="flex items-center gap-1.5 rounded-lg bg-[#4A5FD1] px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-[#3B4DB8]"
                                >
                                    <span>Artikel Lainnya</span>
                                    <ArrowRight className="size-3.5" />
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* ── Recent / Related Articles Section ── */}
                    {recentArticles.length > 0 && (
                        <div className="mx-auto mt-16 max-w-4xl border-t border-[rgba(30,36,48,0.08)] pt-12 dark:border-[rgba(255,255,255,0.08)]">
                            <div className="mb-6 flex items-center justify-between">
                                <h2 className="font-display text-xl font-semibold text-[#1E2430] dark:text-[#E6ECF5]">
                                    Artikel Terbaru Lainnya
                                </h2>
                                <Link
                                    href="/blog"
                                    className="flex items-center gap-1 text-xs font-semibold text-[#4A5FD1] hover:underline dark:text-[#8FA0FA]"
                                >
                                    <span>Lihat Semua</span>
                                    <ArrowRight className="size-3" />
                                </Link>
                            </div>

                            <div className="grid gap-6 sm:grid-cols-3">
                                {recentArticles.map((item) => (
                                    <Link
                                        key={item.id}
                                        href={`/blog/${item.slug}`}
                                        className="group flex flex-col justify-between overflow-hidden rounded-lg border border-[rgba(30,36,48,0.08)] bg-white transition hover:border-[#4A5FD1]/30 dark:border-[rgba(255,255,255,0.08)] dark:bg-[#181E2B]"
                                    >
                                        <div>
                                            <div className="aspect-video w-full overflow-hidden bg-[#F6F7F9] dark:bg-[#21293A]">
                                                {item.gambar_sampul ? (
                                                    <img
                                                        src={`/storage/${item.gambar_sampul}`}
                                                        alt={item.judul}
                                                        className="h-full w-full object-cover transition duration-300 group-hover:scale-103"
                                                    />
                                                ) : (
                                                    <div className="flex h-full items-center justify-center text-[#727C8E] dark:text-[#8C97A8]">
                                                        <ImageIcon className="size-6" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="p-4">
                                                <span className="text-[10px] text-[#727C8E] dark:text-[#8C97A8]">
                                                    {formatDate(
                                                        item.diterbitkan_pada || item.created_at,
                                                    )}
                                                </span>
                                                <h3 className="mt-1 font-display text-xs font-semibold text-[#1E2430] transition group-hover:text-[#4A5FD1] dark:text-[#E6ECF5] dark:group-hover:text-[#8FA0FA]">
                                                    {item.judul}
                                                </h3>
                                            </div>
                                        </div>
                                        <div className="border-t border-[rgba(30,36,48,0.06)] px-4 py-2 text-[11px] font-semibold text-[#4A5FD1] dark:border-[rgba(255,255,255,0.06)] dark:text-[#8FA0FA]">
                                            Baca →
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </article>
        </PublicLayout>
    );
}
