import { Head, usePage } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import {
    BarChart2,
    Calendar,
    CheckCircle2,
    Download,
    FileSpreadsheet,
    FileText,
    Loader2,
    Search,
    Star,
    TrendingUp,
    Users,
    X,
} from 'lucide-react';
import laporan from '@/routes/pengurus/laporan';

type KegiatanItem = {
    id: number;
    nama: string;
    tipe: 'wajib_hadir' | 'terbuka';
    sesi_count: number;
    tanggal_pertama: string | null;
    tanggal_terakhir: string | null;
};

type PreviewItem = {
    id: number;
    nama: string;
    tipe: string;
    total_sesi: number;
    peserta_rsvp: number;
    total_hadir: number;
    persentase_hadir: number;
    total_estimasi: number;
    total_realisasi: number;
    selisih_anggaran: number;
    rata_rating: number | null;
    jumlah_evaluasi: number;
};

type Props = {
    kegiatanList: KegiatanItem[];
    teamNama: string;
};

const rupiah = (n: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);

export default function LaporanIndex({ kegiatanList, teamNama }: Props) {
    const { currentTeam } = usePage().props;
    const teamSlug = currentTeam?.slug ?? '';

    // ── Filter state ──────────────────────────────────────────────────────────
    const [mode, setMode] = useState<'pilih' | 'periode'>('pilih');
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [tanggalMulai, setTanggalMulai] = useState('');
    const [tanggalSelesai, setTanggalSelesai] = useState('');
    const [searchKegiatan, setSearchKegiatan] = useState('');

    // ── Preview state ─────────────────────────────────────────────────────────
    const [preview, setPreview] = useState<PreviewItem[] | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Filtered kegiatan list
    const filteredKegiatanList = kegiatanList.filter(k =>
        k.nama.toLowerCase().includes(searchKegiatan.toLowerCase())
    );

    function buildParams(): URLSearchParams {
        const p = new URLSearchParams();
        if (mode === 'pilih') {
            selectedIds.forEach(id => p.append('kegiatan_ids[]', String(id)));
        } else {
            if (tanggalMulai) p.set('tanggal_mulai', tanggalMulai);
            if (tanggalSelesai) p.set('tanggal_selesai', tanggalSelesai);
        }
        return p;
    }

    function canPreview(): boolean {
        if (mode === 'pilih') return selectedIds.length > 0;
        return !!(tanggalMulai && tanggalSelesai);
    }

    async function doPreview() {
        if (!canPreview()) return;
        setLoading(true);
        setError(null);
        setPreview(null);
        try {
            const params = buildParams();
            const url = `${laporan.preview.url(teamSlug)}?${params}`;
            const res = await fetch(url, { headers: { Accept: 'application/json' } });
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                setError(body.message ?? 'Gagal memuat preview.');
            } else {
                setPreview(await res.json());
            }
        } catch {
            setError('Terjadi kesalahan jaringan.');
        } finally {
            setLoading(false);
        }
    }

    function exportUrl(type: 'excel' | 'pdf'): string {
        const params = buildParams();
        const base = type === 'excel'
            ? laporan.excel.url(teamSlug)
            : laporan.pdf.url(teamSlug);
        return `${base}?${params}`;
    }

    function toggleId(id: number) {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
        setPreview(null);
    }

    function selectAll() {
        setSelectedIds(filteredKegiatanList.map(k => k.id));
        setPreview(null);
    }

    function clearAll() {
        setSelectedIds([]);
        setPreview(null);
    }

    // Totals for summary row
    const totalHadir   = preview?.reduce((s, p) => s + p.total_hadir, 0) ?? 0;
    const totalEst     = preview?.reduce((s, p) => s + p.total_estimasi, 0) ?? 0;
    const totalReal    = preview?.reduce((s, p) => s + p.total_realisasi, 0) ?? 0;
    const totalSelisih = totalReal - totalEst;

    return (
        <>
            <Head title="Export Laporan" />

            <div className="flex h-full flex-col">
                {/* ── Premium page header ── */}
                <div className="relative overflow-hidden border-b border-sidebar-border/40 bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-700 px-6 py-6 text-white">
                    <div className="pointer-events-none absolute -right-10 -top-10 size-40 rounded-full bg-white/5 blur-2xl" />
                    <div className="pointer-events-none absolute right-20 bottom-0 size-24 rounded-full bg-violet-400/20 blur-xl" />
                    <div className="relative flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="flex size-10 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm">
                                <BarChart2 className="size-5" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold tracking-tight">Export Laporan</h1>
                                <p className="text-sm opacity-70">{teamNama}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 rounded-xl bg-white/10 px-3 py-1.5 text-xs backdrop-blur-sm">
                            <Download className="size-3.5" />
                            <span className="font-medium">Excel & PDF tersedia</span>
                        </div>
                    </div>
                </div>

                {/* ── Main content ── */}
                <div className="flex-1 overflow-auto p-5">
                    <div className="grid gap-5 lg:grid-cols-5">
                        {/* ── Left: Filter ── */}
                        <div className="lg:col-span-2">
                            <div className="rounded-2xl border border-sidebar-border/70 bg-white shadow-sm dark:border-sidebar-border dark:bg-neutral-900">
                                {/* Card header */}
                                <div className="border-b border-neutral-100 px-5 py-4 dark:border-neutral-800">
                                    <h2 className="text-sm font-semibold text-neutral-800 dark:text-neutral-100">
                                        Filter Laporan
                                    </h2>
                                    <p className="mt-0.5 text-xs text-neutral-500">
                                        Pilih kegiatan atau tentukan periode
                                    </p>
                                </div>

                                <div className="p-5">
                                    {/* Mode selector */}
                                    <div className="mb-4 flex rounded-xl border border-neutral-200 bg-neutral-50 p-1 dark:border-neutral-700 dark:bg-neutral-800/50">
                                        {(['pilih', 'periode'] as const).map(m => (
                                            <button
                                                key={m}
                                                type="button"
                                                onClick={() => { setMode(m); setPreview(null); }}
                                                className={`flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition ${
                                                    mode === m
                                                        ? 'bg-indigo-600 text-white shadow-sm'
                                                        : 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-700'
                                                }`}
                                            >
                                                {m === 'pilih' ? '📋 Pilih Kegiatan' : '📅 Rentang Periode'}
                                            </button>
                                        ))}
                                    </div>

                                    {mode === 'pilih' ? (
                                        <div>
                                            {/* Search bar */}
                                            <div className="relative mb-3">
                                                <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-neutral-400" />
                                                <input
                                                    type="text"
                                                    placeholder="Cari nama kegiatan..."
                                                    value={searchKegiatan}
                                                    onChange={e => setSearchKegiatan(e.target.value)}
                                                    className="w-full rounded-xl border border-neutral-200 bg-neutral-50 py-2 pl-8 pr-3 text-sm focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:focus:bg-neutral-700"
                                                />
                                                {searchKegiatan && (
                                                    <button
                                                        onClick={() => setSearchKegiatan('')}
                                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                                                    >
                                                        <X className="size-3.5" />
                                                    </button>
                                                )}
                                            </div>

                                            {/* Select / clear all */}
                                            {filteredKegiatanList.length > 0 && (
                                                <div className="mb-2 flex items-center justify-between">
                                                    <span className="text-xs text-neutral-500">
                                                        {selectedIds.length} dipilih
                                                    </span>
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={selectAll}
                                                            className="text-xs font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                                                        >
                                                            Pilih Semua
                                                        </button>
                                                        {selectedIds.length > 0 && (
                                                            <button
                                                                onClick={clearAll}
                                                                className="text-xs text-neutral-500 hover:underline"
                                                            >
                                                                Hapus Pilihan
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Kegiatan list */}
                                            <div className="max-h-72 space-y-1.5 overflow-y-auto">
                                                {kegiatanList.length === 0 ? (
                                                    <p className="py-6 text-center text-sm text-neutral-400">
                                                        Belum ada kegiatan.
                                                    </p>
                                                ) : filteredKegiatanList.length === 0 ? (
                                                    <p className="py-4 text-center text-sm text-neutral-400">
                                                        Tidak ada kegiatan dengan nama "{searchKegiatan}"
                                                    </p>
                                                ) : filteredKegiatanList.map(k => {
                                                    const isChecked = selectedIds.includes(k.id);
                                                    return (
                                                        <label
                                                            key={k.id}
                                                            className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition ${
                                                                isChecked
                                                                    ? 'border-indigo-300 bg-indigo-50 dark:border-indigo-700 dark:bg-indigo-950/30'
                                                                    : 'border-neutral-100 hover:border-neutral-200 hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-800/50'
                                                            }`}
                                                        >
                                                            <div className={`mt-0.5 flex size-4 shrink-0 items-center justify-center rounded ${
                                                                isChecked
                                                                    ? 'bg-indigo-600'
                                                                    : 'border border-neutral-300 dark:border-neutral-600'
                                                            }`}>
                                                                {isChecked && (
                                                                    <svg className="size-2.5 text-white" fill="none" viewBox="0 0 10 8">
                                                                        <path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                                    </svg>
                                                                )}
                                                            </div>
                                                            <div className="min-w-0 flex-1" onClick={() => toggleId(k.id)}>
                                                                <p className={`truncate text-sm font-medium ${isChecked ? 'text-indigo-800 dark:text-indigo-200' : 'text-neutral-800 dark:text-neutral-100'}`}>
                                                                    {k.nama}
                                                                </p>
                                                                <p className="mt-0.5 text-xs text-neutral-500">
                                                                    {k.sesi_count} sesi
                                                                    {k.tanggal_pertama && ` · ${k.tanggal_pertama}`}
                                                                </p>
                                                            </div>
                                                            <input
                                                                type="checkbox"
                                                                checked={isChecked}
                                                                onChange={() => toggleId(k.id)}
                                                                className="sr-only"
                                                            />
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            <div>
                                                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-neutral-600 dark:text-neutral-400">
                                                    <Calendar className="size-3.5" />
                                                    Tanggal Mulai
                                                </label>
                                                <input
                                                    type="date"
                                                    value={tanggalMulai}
                                                    onChange={e => { setTanggalMulai(e.target.value); setPreview(null); }}
                                                    className="w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                                                />
                                            </div>
                                            <div>
                                                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-neutral-600 dark:text-neutral-400">
                                                    <Calendar className="size-3.5" />
                                                    Tanggal Akhir
                                                </label>
                                                <input
                                                    type="date"
                                                    value={tanggalSelesai}
                                                    onChange={e => { setTanggalSelesai(e.target.value); setPreview(null); }}
                                                    className="w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    <button
                                        type="button"
                                        onClick={doPreview}
                                        disabled={!canPreview() || loading}
                                        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 className="size-4 animate-spin" />
                                                Memuat Preview...
                                            </>
                                        ) : (
                                            <>
                                                <TrendingUp className="size-4" />
                                                Lihat Preview
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* ── Right: Preview ── */}
                        <div className="lg:col-span-3">
                            <div className="rounded-2xl border border-sidebar-border/70 bg-white shadow-sm dark:border-sidebar-border dark:bg-neutral-900">
                                {/* Card header */}
                                <div className="border-b border-neutral-100 px-5 py-4 dark:border-neutral-800">
                                    <h2 className="text-sm font-semibold text-neutral-800 dark:text-neutral-100">
                                        Preview Laporan
                                    </h2>
                                    <p className="mt-0.5 text-xs text-neutral-500">
                                        Pratinjau data sebelum export
                                    </p>
                                </div>

                                <div className="p-5">
                                    {loading && (
                                        <div className="flex h-48 flex-col items-center justify-center gap-3">
                                            <Loader2 className="size-8 animate-spin text-indigo-500" />
                                            <p className="text-sm text-neutral-400">Memuat data...</p>
                                        </div>
                                    )}

                                    {error && (
                                        <div className="flex items-start gap-3 rounded-xl bg-red-50 p-4 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
                                            <X className="mt-0.5 size-4 shrink-0" />
                                            {error}
                                        </div>
                                    )}

                                    {!loading && !preview && !error && (
                                        <div className="flex h-48 flex-col items-center justify-center gap-3 text-center">
                                            <div className="flex size-14 items-center justify-center rounded-2xl bg-neutral-100 dark:bg-neutral-800">
                                                <BarChart2 className="size-7 text-neutral-400" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                                                    Belum ada data
                                                </p>
                                                <p className="mt-0.5 text-xs text-neutral-400">
                                                    Pilih kegiatan atau periode, lalu klik "Lihat Preview"
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {preview && preview.length > 0 && (
                                        <div className="space-y-3">
                                            {/* Per-kegiatan cards */}
                                            {preview.map(item => {
                                                const pct = item.persentase_hadir;
                                                const selisih = item.selisih_anggaran;
                                                return (
                                                    <div
                                                        key={item.id}
                                                        className="overflow-hidden rounded-xl border border-neutral-100 dark:border-neutral-800"
                                                    >
                                                        {/* Card header */}
                                                        <div className="flex items-center justify-between gap-2 bg-neutral-50 px-4 py-3 dark:bg-neutral-800/50">
                                                            <p className="font-semibold text-neutral-900 dark:text-neutral-100">
                                                                {item.nama}
                                                            </p>
                                                            <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${item.tipe === 'terbuka' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'}`}>
                                                                {item.tipe === 'terbuka' ? 'Terbuka' : 'Wajib Hadir'}
                                                            </span>
                                                        </div>

                                                        {/* Stats grid */}
                                                        <div className="grid grid-cols-2 gap-px bg-neutral-100 dark:bg-neutral-800 sm:grid-cols-4">
                                                            {/* Kehadiran */}
                                                            <div className="bg-white p-3 dark:bg-neutral-900">
                                                                <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
                                                                    <Users className="size-3" /> Hadir
                                                                </p>
                                                                <p className="mt-1 text-lg font-bold text-neutral-800 dark:text-neutral-100">
                                                                    {item.total_hadir}
                                                                </p>
                                                                <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
                                                                    <div
                                                                        className="h-full rounded-full bg-emerald-500 transition-all"
                                                                        style={{ width: `${pct}%` }}
                                                                    />
                                                                </div>
                                                                <p className="mt-0.5 text-xs text-neutral-400">{pct}%</p>
                                                            </div>
                                                            {/* Estimasi */}
                                                            <div className="bg-white p-3 dark:bg-neutral-900">
                                                                <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">Est. Anggaran</p>
                                                                <p className="mt-1 text-sm font-bold text-neutral-800 dark:text-neutral-100">
                                                                    {rupiah(item.total_estimasi)}
                                                                </p>
                                                            </div>
                                                            {/* Realisasi */}
                                                            <div className="bg-white p-3 dark:bg-neutral-900">
                                                                <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">Realisasi</p>
                                                                <p className="mt-1 text-sm font-bold text-neutral-800 dark:text-neutral-100">
                                                                    {rupiah(item.total_realisasi)}
                                                                </p>
                                                                <p className={`mt-0.5 text-xs font-medium ${selisih > 0 ? 'text-red-500' : selisih < 0 ? 'text-emerald-500' : 'text-neutral-400'}`}>
                                                                    {selisih > 0 ? `+${rupiah(selisih)}` : selisih < 0 ? rupiah(selisih) : '±0'}
                                                                </p>
                                                            </div>
                                                            {/* Rating */}
                                                            <div className="bg-white p-3 dark:bg-neutral-900">
                                                                <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
                                                                    <Star className="size-3" /> Rating
                                                                </p>
                                                                <p className="mt-1 text-lg font-bold text-amber-500">
                                                                    {item.rata_rating ? item.rata_rating.toFixed(1) : '—'}
                                                                </p>
                                                                <p className="text-xs text-neutral-400">{item.jumlah_evaluasi} ulasan</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}

                                            {/* Total summary */}
                                            {preview.length > 1 && (
                                                <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4 dark:border-indigo-800/50 dark:bg-indigo-950/20">
                                                    <div className="flex items-center gap-2">
                                                        <CheckCircle2 className="size-4 text-indigo-600 dark:text-indigo-400" />
                                                        <p className="text-sm font-semibold text-indigo-800 dark:text-indigo-200">
                                                            Total {preview.length} kegiatan
                                                        </p>
                                                    </div>
                                                    <div className="mt-2 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                                                        <div>
                                                            <p className="text-indigo-500">Total Hadir</p>
                                                            <p className="font-bold text-indigo-800 dark:text-indigo-200">{totalHadir}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-indigo-500">Est. Total</p>
                                                            <p className="font-bold text-indigo-800 dark:text-indigo-200">{rupiah(totalEst)}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-indigo-500">Realisasi</p>
                                                            <p className="font-bold text-indigo-800 dark:text-indigo-200">{rupiah(totalReal)}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-indigo-500">Selisih</p>
                                                            <p className={`font-bold ${totalSelisih > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                                                                {totalSelisih > 0 ? '+' : ''}{rupiah(totalSelisih)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Export buttons */}
                                            <div className="mt-2 flex flex-wrap gap-3 pt-1">
                                                <a
                                                    href={exportUrl('excel')}
                                                    download
                                                    className="group inline-flex flex-1 items-center justify-center gap-2.5 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 hover:shadow-md sm:flex-none"
                                                >
                                                    <FileSpreadsheet className="size-4 transition-transform group-hover:scale-110" />
                                                    Export Excel
                                                </a>
                                                <a
                                                    href={exportUrl('pdf')}
                                                    download
                                                    className="group inline-flex flex-1 items-center justify-center gap-2.5 rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 hover:shadow-md sm:flex-none"
                                                >
                                                    <FileText className="size-4 transition-transform group-hover:scale-110" />
                                                    Export PDF
                                                </a>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
