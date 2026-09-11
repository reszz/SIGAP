import { Head, router, usePage } from '@inertiajs/react';
import { ChevronDown, MessageSquare, Star } from 'lucide-react';
import { index as evaluasiIndex } from '@/routes/evaluasi';

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
};

// ─── Star Rating Display ──────────────────────────────────────────────────────

function StarRating({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'lg' }) {
    const starSize = size === 'lg' ? 'size-6' : 'size-4';
    return (
        <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((n) => (
                <Star
                    key={n}
                    className={`${starSize} ${
                        n <= rating
                            ? 'fill-amber-400 text-amber-400'
                            : 'fill-neutral-200 text-neutral-200 dark:fill-neutral-700 dark:text-neutral-700'
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
                {/* ─── Header ─── */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="font-display text-2xl font-extrabold tracking-tight text-neutral-900 sm:text-3xl dark:text-neutral-100">
                            Evaluasi & Ulasan
                        </h1>
                        <p className="mt-0.5 text-xs font-medium text-neutral-500 dark:text-neutral-400">
                            Analisis kepuasan peserta dan evaluasi per kegiatan
                        </p>
                    </div>

                    {kegiatanList.length > 0 && (
                        <div className="relative min-w-56">
                            <select
                                value={selectedKegiatanId ?? ''}
                                onChange={(e) => pilihKegiatan(Number(e.target.value))}
                                className="w-full appearance-none rounded-2xl border border-neutral-200/70 bg-white py-2.5 pl-4 pr-10 text-xs font-bold text-neutral-800 shadow-2xs focus:border-[#4F46E5] focus:outline-none dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100"
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
                            <ChevronDown className="pointer-events-none absolute right-3 top-3 size-4 text-neutral-400" />
                        </div>
                    )}
                </div>

                {/* ─── Belum pilih kegiatan ─── */}
                {!selectedKegiatan ? (
                    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-neutral-200 bg-white py-20 text-center dark:border-neutral-800 dark:bg-neutral-900">
                        <MessageSquare className="mb-4 size-12 text-neutral-300 dark:text-neutral-700" />
                        <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                            {kegiatanList.length === 0
                                ? 'Kamu belum memiliki akses evaluasi untuk kegiatan manapun.'
                                : 'Pilih kegiatan di atas untuk melihat ringkasan evaluasi.'}
                        </p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-6">
                        {/* ─── Summary Card ─── */}
                        <div className="flex flex-wrap items-center gap-8 rounded-3xl border border-neutral-200/70 bg-white p-6 shadow-sm sm:p-8 dark:border-neutral-800 dark:bg-neutral-900">
                            {rataRating != null ? (
                                <>
                                    <div className="flex items-center gap-4">
                                        <p className="font-display text-4xl font-extrabold text-neutral-900 sm:text-5xl dark:text-neutral-100">
                                            {rataRating.toFixed(1)}
                                        </p>
                                        <div className="flex flex-col gap-1">
                                            <StarRating rating={Math.round(rataRating)} size="lg" />
                                            <p className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                                                Skor Rata-Rata
                                            </p>
                                        </div>
                                    </div>
                                    <div className="hidden h-12 w-px bg-neutral-200 sm:block dark:bg-neutral-700" />
                                </>
                            ) : null}

                            <div className="flex flex-col">
                                <p className="font-display text-3xl font-bold text-neutral-900 dark:text-neutral-100">
                                    {jumlahEvaluasi}
                                </p>
                                <p className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                                    Ulasan Diterima
                                </p>
                            </div>
                        </div>

                        {/* ─── List Komentar ─── */}
                        {evaluasi.length === 0 ? (
                            <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-neutral-200 bg-white py-16 text-center dark:border-neutral-800 dark:bg-neutral-900">
                                <MessageSquare className="mb-3 size-10 text-neutral-300 dark:text-neutral-700" />
                                <p className="text-xs font-semibold text-neutral-400">
                                    Belum ada evaluasi atau ulasan untuk kegiatan ini.
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
                                            className="flex flex-col justify-between rounded-3xl border border-neutral-200/70 bg-white p-6 shadow-sm transition hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900"
                                        >
                                            <div>
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="flex size-8 items-center justify-center rounded-xl bg-amber-50 text-xs font-bold text-amber-600 dark:bg-amber-950/30 dark:text-amber-400">
                                                            {initials}
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                                                                {e.user}
                                                            </p>
                                                            <div className="mt-0.5">
                                                                <StarRating rating={e.rating} />
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
                                                        {e.rating} / 5
                                                    </span>
                                                </div>

                                                {e.komentar ? (
                                                    <p className="mt-3.5 text-xs leading-relaxed text-neutral-600 dark:text-neutral-300">
                                                        "{e.komentar}"
                                                    </p>
                                                ) : (
                                                    <p className="mt-3.5 text-xs italic text-neutral-400">
                                                        Tidak ada komentar tambahan.
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
