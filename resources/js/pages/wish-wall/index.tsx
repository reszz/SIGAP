import { Head, Link, router, useForm } from '@inertiajs/react';
import {
    AlertCircle,
    Flag,
    Heart,
    MessageCircleHeart,
    MessageSquare,
    Send,
    Sparkles,
    User as UserIcon,
} from 'lucide-react';
import { useState } from 'react';
import { confirmAction } from '@/lib/sweetalert';
import PublicLayout from '@/layouts/public-layout';

// ─── Types ────────────────────────────────────────────────────────────────────

type WishItem = {
    id: number;
    nama_pengirim: string | null;
    nama_tampil: string;
    pesan: string;
    waktu_relatif: string;
    created_at: string;
    jumlah_laporan?: number;
};

type PaginatedWishes = {
    data: WishItem[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    prev_page_url: string | null;
    next_page_url: string | null;
    links: { url: string | null; label: string; active: boolean }[];
};

type Props = {
    wishes: PaginatedWishes;
    totalWishes: number;
};

// ─── Pastel Avatar Color Generator ────────────────────────────────────────────

const AVATAR_COLORS = [
    'bg-[#4A5FD1]/12 text-[#4A5FD1] dark:bg-[#4A5FD1]/20 dark:text-[#8FA0FA]',
    'bg-[#2E9E82]/12 text-[#2E9E82] dark:bg-[#2E9E82]/20 dark:text-[#34B394]',
    'bg-[#B8862E]/12 text-[#B8862E] dark:bg-[#B8862E]/20 dark:text-[#D4A142]',
    'bg-[#727C8E]/12 text-[#727C8E] dark:bg-[#727C8E]/20 dark:text-[#8C97A8]',
];

function getAvatarColor(id: number): string {
    return AVATAR_COLORS[id % AVATAR_COLORS.length];
}

// ─── Public Wish Wall Page ────────────────────────────────────────────────────

export default function WishWallIndex({ wishes, totalWishes }: Props) {
    const [reportedIds, setReportedIds] = useState<number[]>([]);

    const { data, setData, post, processing, reset, errors } = useForm({
        nama_pengirim: '',
        pesan: '',
        website_url: '', // Honeypot field (must stay empty)
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/wish-wall', {
            preserveScroll: true,
            onSuccess: () => {
                reset('pesan', 'website_url');
            },
        });
    };

    const handleReport = async (wish: WishItem) => {
        if (reportedIds.includes(wish.id)) return;

        const confirmed = await confirmAction(
            'Laporkan Pesan?',
            'Apakah pesan ini mengandung spam, ujaran kebencian, atau konten tidak pantas?',
            'Ya, Laporkan',
            'Batal',
        );

        if (confirmed) {
            router.post(
                `/wish-wall/${wish.id}/report`,
                {},
                {
                    preserveScroll: true,
                    onSuccess: () => {
                        setReportedIds((prev) => [...prev, wish.id]);
                    },
                },
            );
        }
    };

    return (
        <PublicLayout
            title="Wish Wall — Papan Pesan & Harapan HMIF SIGAP"
            description="Ruang aspirasi terbuka, pesan semangat, dan harapan untuk organisasi mahasiswa Teknik Informatika."
        >
            {/* ── Hero Header ── */}
            <section className="border-b border-[rgba(30,36,48,0.08)] bg-white py-12 sm:py-16 dark:border-[rgba(255,255,255,0.08)] dark:bg-[#181E2B]/60">
                <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
                    <div className="mb-3 inline-flex items-center gap-1.5 rounded-md border border-[#B8862E]/30 bg-[#B8862E]/10 px-3 py-1 text-xs font-semibold text-[#B8862E] dark:border-[#B8862E]/40 dark:bg-[#B8862E]/20 dark:text-[#D4A142]">
                        <Sparkles className="size-3.5" />
                        <span>Ruang Aspirasi & Semangat</span>
                    </div>

                    <h1 className="font-display text-3xl font-semibold tracking-tight text-[#1E2430] sm:text-4xl dark:text-[#E6ECF5]">
                        Wish Wall HMIF
                    </h1>

                    <p className="mx-auto mt-2 max-w-xl text-xs leading-relaxed text-[#727C8E] sm:text-sm dark:text-[#8C97A8]">
                        Tinggalkan pesan semangat, harapan, aspirasi, atau kesan Anda untuk keluarga besar Teknik Informatika. Siapa saja boleh menulis secara terbuka.
                    </p>

                    <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-[rgba(30,36,48,0.08)] bg-[#F6F7F9] px-3.5 py-1 text-xs font-medium text-[#727C8E] dark:border-[rgba(255,255,255,0.08)] dark:bg-[#21293A] dark:text-[#8C97A8]">
                        <MessageSquare className="size-3.5 text-[#4A5FD1] dark:text-[#8FA0FA]" />
                        <span>{totalWishes} pesan telah dibagikan</span>
                    </div>
                </div>
            </section>

            <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8 min-h-screen">
                {/* ── Submit Wish Form Card ── */}
                <div className="mx-auto mb-12 max-w-2xl overflow-hidden rounded-xl border border-[rgba(30,36,48,0.08)] bg-white p-6 shadow-xs sm:p-8 dark:border-[rgba(255,255,255,0.08)] dark:bg-[#181E2B]">
                    <div className="mb-4 flex items-center gap-2">
                        <MessageCircleHeart className="size-5 text-[#4A5FD1] dark:text-[#8FA0FA]" />
                        <h2 className="font-display text-base font-semibold text-[#1E2430] dark:text-[#E6ECF5]">
                            Tulis Harapan & Pesan Anda
                        </h2>
                    </div>

                    {/* General / Rate Limiter Error Banner */}
                    {errors.pesan && errors.pesan.includes('Terlalu banyak') && (
                        <div className="mb-4 flex items-start gap-2.5 rounded-lg border border-[#C4514A]/20 bg-[#C4514A]/10 p-3 text-xs text-[#C4514A]">
                            <AlertCircle className="size-4 shrink-0 mt-0.5" />
                            <p>{errors.pesan}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        {/* Honeypot field — visually hidden offscreen for bot traps */}
                        <div
                            style={{
                                position: 'absolute',
                                left: '-9999px',
                                opacity: 0,
                                pointerEvents: 'none',
                                height: 0,
                                width: 0,
                                overflow: 'hidden',
                            }}
                            aria-hidden="true"
                        >
                            <label htmlFor="website_url">Leave this field blank</label>
                            <input
                                id="website_url"
                                type="text"
                                name="website_url"
                                tabIndex={-1}
                                autoComplete="off"
                                value={data.website_url}
                                onChange={(e) => setData('website_url', e.target.value)}
                            />
                        </div>

                        {/* Nama Pengirim (Optional) */}
                        <div>
                            <label
                                htmlFor="nama_pengirim"
                                className="block text-xs font-semibold text-[#1E2430] dark:text-[#E6ECF5]"
                            >
                                Nama atau Samaran{' '}
                                <span className="text-xs font-normal text-[#727C8E] dark:text-[#8C97A8]">
                                    (Opsional — biarkan kosong untuk Anonim)
                                </span>
                            </label>
                            <input
                                id="nama_pengirim"
                                type="text"
                                maxLength={80}
                                value={data.nama_pengirim}
                                onChange={(e) => setData('nama_pengirim', e.target.value)}
                                placeholder="Misal: Mahasiswa Baru, Alumni 2024, atau nama Anda"
                                className="mt-1.5 w-full rounded-lg border border-[rgba(30,36,48,0.12)] bg-[#F6F7F9]/50 px-3.5 py-2 text-xs text-[#1E2430] placeholder-[#727C8E]/60 focus:border-[#4A5FD1] focus:bg-white focus:outline-none dark:border-[rgba(255,255,255,0.12)] dark:bg-[#21293A]/50 dark:text-[#E6ECF5] dark:focus:bg-[#181E2B]"
                            />
                            {errors.nama_pengirim && (
                                <p className="mt-1 text-xs text-[#C4514A]">
                                    {errors.nama_pengirim}
                                </p>
                            )}
                        </div>

                        {/* Pesan (Required) */}
                        <div>
                            <div className="flex items-center justify-between">
                                <label
                                    htmlFor="pesan"
                                    className="block text-xs font-semibold text-[#1E2430] dark:text-[#E6ECF5]"
                                >
                                    Pesan / Harapan <span className="text-[#C4514A]">*</span>
                                </label>
                                <span className="text-[10px] text-[#727C8E] dark:text-[#8C97A8]">
                                    {data.pesan.length}/500 karakter
                                </span>
                            </div>
                            <textarea
                                id="pesan"
                                rows={3}
                                maxLength={500}
                                value={data.pesan}
                                onChange={(e) => setData('pesan', e.target.value)}
                                placeholder="Bagikan kesan, pesan semangat untuk pengurus, atau harapan untuk himpunan..."
                                className="mt-1.5 w-full rounded-lg border border-[rgba(30,36,48,0.12)] bg-[#F6F7F9]/50 px-3.5 py-2 text-xs leading-relaxed text-[#1E2430] placeholder-[#727C8E]/60 focus:border-[#4A5FD1] focus:bg-white focus:outline-none dark:border-[rgba(255,255,255,0.12)] dark:bg-[#21293A]/50 dark:text-[#E6ECF5] dark:focus:bg-[#181E2B]"
                            />
                            {errors.pesan && !errors.pesan.includes('Terlalu banyak') && (
                                <p className="mt-1 text-xs text-[#C4514A]">
                                    {errors.pesan}
                                </p>
                            )}
                        </div>

                        {/* Submit Button */}
                        <div className="flex items-center justify-end">
                            <button
                                type="submit"
                                disabled={processing || !data.pesan.trim()}
                                className="flex items-center gap-1.5 rounded-lg bg-[#4A5FD1] px-5 py-2.5 text-xs font-semibold text-white shadow-xs transition hover:bg-[#3B4DB8] disabled:opacity-50"
                            >
                                <Send className="size-3.5" />
                                <span>{processing ? 'Mengirim...' : 'Kirim Pesan'}</span>
                            </button>
                        </div>
                    </form>
                </div>

                {/* ── Wish Wall Cards Grid ── */}
                {wishes.data.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="flex size-14 items-center justify-center rounded-full bg-[#F6F7F9] text-[#727C8E] dark:bg-[#181E2B] dark:text-[#8C97A8]">
                            <MessageSquare className="size-7" />
                        </div>
                        <h3 className="mt-4 font-display text-base font-semibold text-[#1E2430] dark:text-[#E6ECF5]">
                            Belum ada pesan
                        </h3>
                        <p className="mt-1 max-w-sm text-xs text-[#727C8E] dark:text-[#8C97A8]">
                            Jadilah yang pertama menuliskan pesan semangat dan harapan untuk HMIF di atas!
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                        {wishes.data.map((wish) => {
                            const isReported = reportedIds.includes(wish.id);
                            return (
                                <div
                                    key={wish.id}
                                    className="group relative flex flex-col justify-between rounded-xl border border-[rgba(30,36,48,0.08)] bg-white p-5 shadow-xs transition hover:border-[#4A5FD1]/30 hover:shadow-sm dark:border-[rgba(255,255,255,0.08)] dark:bg-[#181E2B]"
                                >
                                    <div>
                                        {/* Card Header: Avatar + Name + Relative Time */}
                                        <div className="flex items-center justify-between gap-2 border-b border-[rgba(30,36,48,0.06)] pb-3 dark:border-[rgba(255,255,255,0.06)]">
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                <div
                                                    className={`flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${getAvatarColor(
                                                        wish.id,
                                                    )}`}
                                                >
                                                    {wish.nama_tampil.slice(0, 2).toUpperCase()}
                                                </div>
                                                <div className="min-w-0">
                                                    <h3 className="truncate font-display text-xs font-semibold text-[#1E2430] dark:text-[#E6ECF5]">
                                                        {wish.nama_tampil}
                                                    </h3>
                                                    <p className="font-mono-sigap text-[10px] text-[#727C8E] dark:text-[#8C97A8]">
                                                        {wish.waktu_relatif}
                                                    </p>
                                                </div>
                                            </div>

                                            <Heart className="size-4 shrink-0 text-[#727C8E]/40 group-hover:text-[#4A5FD1]/60 transition" />
                                        </div>

                                        {/* Message Body */}
                                        <div className="py-3.5">
                                            <p className="text-xs leading-relaxed text-[#2E3542] dark:text-[#C5D0E0] whitespace-pre-line">
                                                “{wish.pesan}”
                                            </p>
                                        </div>
                                    </div>

                                    {/* Card Footer: Small Report button */}
                                    <div className="flex items-center justify-end border-t border-[rgba(30,36,48,0.04)] pt-2 text-[10px] text-[#727C8E] dark:border-[rgba(255,255,255,0.04)] dark:text-[#8C97A8]">
                                        <button
                                            type="button"
                                            disabled={isReported}
                                            onClick={() => handleReport(wish)}
                                            className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 transition ${
                                                isReported
                                                    ? 'text-[#2E9E82]'
                                                    : 'text-[#727C8E]/70 hover:bg-[#C4514A]/10 hover:text-[#C4514A] dark:hover:bg-[#C4514A]/20'
                                            }`}
                                            title="Laporkan pesan tidak pantas"
                                        >
                                            <Flag className="size-2.5" />
                                            <span>{isReported ? 'Dilaporkan' : 'Laporkan'}</span>
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* ── Pagination ── */}
                {wishes.last_page > 1 && (
                    <div className="mt-10 flex items-center justify-center gap-1.5">
                        {wishes.links.map((link, idx) => {
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
