import { Head, router, usePage } from '@inertiajs/react';
import { ChevronDown, MessageSquare, Star } from 'lucide-react';
import {kegiatanBreadcrumbs} from '@/lib/breadcrumbs';
import { index as evaluasiIndex } from '@/routes/evaluasi';
import { index as panitiaIndex } from '@/routes/panitia';
import ReadOnlyBanner from '@/components/read-only-banner';
import AccessRestrictionCard from '@/components/access-restriction-card';

// ─── Types ────────────────────────────────────────────────────────────────────

type KegiatanOption = { id: number; nama: string; warna: string | null };

type EvaluasiItem = {
    id: number;
    rating: number;
    komentar: string | null;
    user: string;
};

type Props = {
    kegiatanList: KegiatanOption[];
    selectedKegiatanId: number | null;
    evaluasi: EvaluasiItem[];
    rataRating: number | null;
    jumlahEvaluasi: number;
    isReadOnly?: boolean;
};

// ─── Star Rating Display ──────────────────────────────────────────────────────

function StarRating({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'lg' }) {
    const starSize = size === 'lg' ? 'size-5' : 'size-3.5';
    return (
        <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((n) => (
                <Star
                    key={n}
                    className={`${starSize} ${
                        n <= rating
                            ? 'fill-[#B8862E] text-[#B8862E]'
                            : 'fill-transparent text-[#727C8E]/30 dark:text-[#8C97A8]/30'
                    }`}
                />
            ))}
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function EvaluasiIndex({
    kegiatanList,
    selectedKegiatanId,
    evaluasi,
    rataRating,
    jumlahEvaluasi,
    isReadOnly,
}: Props) {
    const { url } = usePage();
    const teamSlug = url.split('/')[1];

    const selectedKegiatan = kegiatanList.find((k) => k.id === selectedKegiatanId) ?? null;

    function pilihKegiatan(id: number) {
        router.get(evaluasiIndex.url(teamSlug), { kegiatan_id: id }, { preserveState: false });
    }

    return (
        <>
            <Head title="Evaluasi & Ulasan" />

            <div className="flex h-full flex-col gap-6 p-4 sm:p-6 lg:p-8">
                {isReadOnly && (
                    <ReadOnlyBanner
                        roleName="Pembina"
                        message="Anda sedang dalam mode pemantauan evaluasi acara. Hasil ulasan, rating, dan masukan peserta ditampilkan untuk keperluan monitoring kegiatan."
                    />
                )}

                {/* ─── Header ─── */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="font-display text-2xl font-semibold tracking-tight text-[#1E2430] sm:text-3xl dark:text-[#E6ECF5]">
                            Evaluasi & Ulasan
                        </h1>
                        <p className="mt-0.5 text-xs text-[#727C8E] dark:text-[#8C97A8]">
                            Analisis kepuasan peserta dan evaluasi per kegiatan
                        </p>
                    </div>

                    {kegiatanList.length > 0 && (
                        <div className="relative min-w-56">
                            <select
                                value={selectedKegiatanId ?? ''}
                                onChange={(e) =>
                                    pilihKegiatan(Number(e.target.value))
                                }
                                className="w-full appearance-none rounded-lg border border-[rgba(30,36,48,0.12)] bg-white py-2 pr-9 pl-3.5 text-xs font-semibold text-[#1E2430] outline-none focus:border-[#4A5FD1] dark:border-[rgba(255,255,255,0.12)] dark:bg-[#181E2B] dark:text-[#E6ECF5]"
                            >
                                <option value="" disabled>
                                    Pilih Kegiatan
                                </option>
                                {kegiatanList.map((k) => (
                                    <option key={k.id} value={k.id}>
                                        {k.nama}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="pointer-events-none absolute top-2.5 right-3 size-4 text-[#727C8E]" />
                        </div>
                    )}
                </div>

                {/* ─── Belum pilih kegiatan ─── */}
                {kegiatanList.length === 0 ? (
                    <AccessRestrictionCard actionType="evaluasi" />
                ) : !selectedKegiatan ? (
                    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-[rgba(30,36,48,0.12)] bg-white py-20 text-center dark:border-[rgba(255,255,255,0.12)] dark:bg-[#181E2B]">
                        <MessageSquare className="mb-3 size-10 text-[#727C8E]/40 dark:text-[#8C97A8]/40" />
                        <p className="text-xs font-medium text-[#727C8E] dark:text-[#8C97A8]">
                            Pilih kegiatan di atas untuk melihat ringkasan evaluasi.
                        </p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-6">
                        {/* ─── Summary Card ─── */}
                        <div className="flex flex-wrap items-center gap-8 rounded-lg border border-[rgba(30,36,48,0.08)] bg-white p-6 shadow-sm sm:p-8 dark:border-[rgba(255,255,255,0.08)] dark:bg-[#181E2B]">
                            {rataRating != null ? (
                                <>
                                    <div className="flex items-center gap-4">
                                        <p className="font-mono-sigap font-display text-4xl font-semibold text-[#B8862E] sm:text-5xl dark:text-[#D4A142]">
                                            {rataRating.toFixed(1)}
                                        </p>
                                        <div className="flex flex-col gap-1">
                                            <StarRating
                                                rating={Math.round(rataRating)}
                                                size="lg"
                                            />
                                            <p className="text-[11px] font-semibold tracking-wider text-[#727C8E] uppercase dark:text-[#8C97A8]">
                                                Skor Rata-Rata
                                            </p>
                                        </div>
                                    </div>
                                    <div className="hidden h-12 w-px bg-[rgba(30,36,48,0.08)] sm:block dark:bg-[rgba(255,255,255,0.08)]" />
                                </>
                            ) : null}

                            <div className="flex flex-col">
                                <p className="font-mono-sigap font-display text-3xl font-semibold text-[#1E2430] dark:text-[#E6ECF5]">
                                    {jumlahEvaluasi}
                                </p>
                                <p className="text-[11px] font-semibold tracking-wider text-[#727C8E] uppercase dark:text-[#8C97A8]">
                                    Ulasan Diterima
                                </p>
                            </div>
                        </div>

                        {/* ─── List Komentar ─── */}
                        {evaluasi.length === 0 ? (
                            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-[rgba(30,36,48,0.12)] bg-white py-16 text-center dark:border-[rgba(255,255,255,0.12)] dark:bg-[#181E2B]">
                                <MessageSquare className="mb-3 size-10 text-[#727C8E]/40 dark:text-[#8C97A8]/40" />
                                <p className="text-xs font-medium text-[#727C8E] dark:text-[#8C97A8]">
                                    Belum ada evaluasi atau ulasan untuk
                                    kegiatan ini.
                                </p>
                            </div>
                        ) : (
                            <div className="grid gap-4 sm:grid-cols-2">
                                {evaluasi.map((e) => {
                                    const initials = e.user
                                        ? e.user
                                              .split(' ')
                                              .slice(0, 2)
                                              .map((n) => n[0])
                                              .join('')
                                              .toUpperCase()
                                        : '?';

                                    return (
                                        <div
                                            key={e.id}
                                            className="flex flex-col justify-between rounded-lg border border-[rgba(30,36,48,0.08)] bg-white p-5 shadow-sm dark:border-[rgba(255,255,255,0.08)] dark:bg-[#181E2B]"
                                        >
                                            <div>
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="flex size-7.5 items-center justify-center rounded-full bg-[#B8862E]/12 text-xs font-semibold text-[#B8862E] dark:bg-[#B8862E]/20 dark:text-[#D4A142]">
                                                            {initials}
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-semibold text-[#1E2430] dark:text-[#E6ECF5]">
                                                                {e.user}
                                                            </p>
                                                            <div className="mt-0.5">
                                                                <StarRating
                                                                    rating={
                                                                        e.rating
                                                                    }
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <span className="font-mono-sigap rounded-md bg-[#B8862E]/12 px-2 py-0.5 text-[11px] font-semibold text-[#B8862E] dark:bg-[#B8862E]/20 dark:text-[#D4A142]">
                                                        {e.rating} / 5
                                                    </span>
                                                </div>

                                                {e.komentar ? (
                                                    <p className="mt-3 text-xs leading-relaxed text-[#2E3542] dark:text-[#E6ECF5]">
                                                        &ldquo;{e.komentar}
                                                        &rdquo;
                                                    </p>
                                                ) : (
                                                    <p className="mt-3 text-xs text-[#727C8E]/70 italic dark:text-[#8C97A8]/70">
                                                        Tidak ada komentar
                                                        tambahan.
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </>
    );
}

EvaluasiIndex.layout = (
    page: Props & {
        currentTeam?: { slug: string } | null;
    },
) => {
    const teamSlug = page.currentTeam?.slug ?? '';
    const selectedKegiatan = page.kegiatanList.find(
        (k) => k.id === page.selectedKegiatanId,
    );

    return {
        breadcrumbs: kegiatanBreadcrumbs(
            'Kegiatan',
            teamSlug ? evaluasiIndex.url(teamSlug) : '/kegiatan',
            {
                title: 'Evaluasi & Ulasan',
                href: teamSlug ? panitiaIndex.url(teamSlug) : '/evaluasi',
            },
            selectedKegiatan && { title: selectedKegiatan.nama, href: '' },
        ),
    };
};
