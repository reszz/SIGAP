import { Head, usePage } from '@inertiajs/react';
import { useState } from 'react';
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
import {dashboard as pengurusDashboard} from '@/routes/pengurus';
import PengurusStrukturOrganisasiIndex from '@/pages/pengurus/struktur-organisasi';

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

            <div className="flex h-full flex-col gap-6 p-4 sm:p-6 lg:p-8">
                {/* ── Page Header ── */}
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h1 className="font-display text-2xl font-semibold tracking-tight text-[#1E2430] sm:text-3xl dark:text-[#E6ECF5]">
                            Export Laporan Kegiatan
                        </h1>
                        <p className="mt-0.5 text-xs text-[#727C8E] dark:text-[#8C97A8]">
                            Rekapitulasi partisipasi, anggaran, dan ulasan kepuasan untuk {teamNama}
                        </p>
                    </div>
                    <div className="flex items-center gap-1.5 rounded-md border border-[rgba(30,36,48,0.12)] bg-white px-3 py-1.5 text-xs font-semibold text-[#727C8E] dark:border-[rgba(255,255,255,0.12)] dark:bg-[#181E2B] dark:text-[#8C97A8]">
                        <Download className="size-3.5 text-[#4A5FD1]" />
                        <span>Format Excel (.xlsx) & PDF</span>
                    </div>
                </div>

                {/* ── Main content grid ── */}
                <div className="grid gap-6 lg:grid-cols-5">
                    {/* ── Left: Filter ── */}
                    <div className="lg:col-span-2">
                        <div className="rounded-lg border border-[rgba(30,36,48,0.08)] bg-white shadow-sm dark:border-[rgba(255,255,255,0.08)] dark:bg-[#181E2B]">
                            {/* Card header */}
                            <div className="border-b border-[rgba(30,36,48,0.08)] px-5 py-3.5 dark:border-[rgba(255,255,255,0.08)]">
                                <h2 className="font-display text-sm font-semibold text-[#1E2430] dark:text-[#E6ECF5]">
                                    Filter Laporan
                                </h2>
                                <p className="text-xs text-[#727C8E] dark:text-[#8C97A8]">
                                    Pilih kegiatan atau tentukan periode tanggal
                                </p>
                            </div>

                            <div className="p-5">
                                {/* Mode selector */}
                                <div className="mb-4 flex rounded-md border border-[rgba(30,36,48,0.12)] bg-[#F6F7F9]/60 p-1 dark:border-[rgba(255,255,255,0.12)] dark:bg-[#21293A]/40">
                                    {(['pilih', 'periode'] as const).map(m => (
                                        <button
                                            key={m}
                                            type="button"
                                            onClick={() => { setMode(m); setPreview(null); }}
                                            className={`flex-1 rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                                                mode === m
                                                    ? 'bg-[#4A5FD1] text-white shadow-xs'
                                                    : 'text-[#727C8E] hover:text-[#1E2430] dark:text-[#8C97A8] dark:hover:text-[#E6ECF5]'
                                            }`}
                                        >
                                            {m === 'pilih' ? 'Pilih Kegiatan' : 'Rentang Periode'}
                                        </button>
                                    ))}
                                </div>

                                {mode === 'pilih' ? (
                                    <div>
                                        {/* Search bar */}
                                        <div className="relative mb-3">
                                            <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-[#727C8E]" />
                                            <input
                                                type="text"
                                                placeholder="Cari nama kegiatan..."
                                                value={searchKegiatan}
                                                onChange={e => setSearchKegiatan(e.target.value)}
                                                className="w-full rounded-md border border-[rgba(30,36,48,0.12)] bg-[#F6F7F9]/50 py-1.5 pl-8 pr-8 text-xs font-medium text-[#1E2430] outline-none focus:border-[#4A5FD1] focus:bg-white dark:border-[rgba(255,255,255,0.12)] dark:bg-[#21293A]/40 dark:text-[#E6ECF5]"
                                            />
                                            {searchKegiatan && (
                                                <button
                                                    onClick={() => setSearchKegiatan('')}
                                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[#727C8E] hover:text-[#1E2430]"
                                                >
                                                    ✕
                                                </button>
                                            )}
                                        </div>

                                        {/* Select / clear all */}
                                        {filteredKegiatanList.length > 0 && (
                                            <div className="mb-2 flex items-center justify-between">
                                                <span className="font-mono-sigap text-xs text-[#727C8E] dark:text-[#8C97A8]">
                                                    {selectedIds.length} dipilih
                                                </span>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={selectAll}
                                                        className="text-xs font-semibold text-[#4A5FD1] hover:underline dark:text-[#8FA0FA]"
                                                    >
                                                        Pilih Semua
                                                    </button>
                                                    {selectedIds.length > 0 && (
                                                        <button
                                                            onClick={clearAll}
                                                            className="text-xs text-[#727C8E] hover:underline dark:text-[#8C97A8]"
                                                        >
                                                            Hapus Pilihan
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* Kegiatan list */}
                                        <div className="max-h-72 space-y-1.5 overflow-y-auto pr-1">
                                            {kegiatanList.length === 0 ? (
                                                <p className="py-6 text-center text-xs italic text-[#727C8E]/70 dark:text-[#8C97A8]/70">
                                                    Belum ada kegiatan.
                                                </p>
                                            ) : filteredKegiatanList.length === 0 ? (
                                                <p className="py-4 text-center text-xs text-[#727C8E]/70 dark:text-[#8C97A8]/70">
                                                    Tidak ada kegiatan dengan nama &ldquo;{searchKegiatan}&rdquo;
                                                </p>
                                            ) : filteredKegiatanList.map(k => {
                                                const isChecked = selectedIds.includes(k.id);
                                                return (
                                                    <label
                                                        key={k.id}
                                                        className={`flex cursor-pointer items-start gap-2.5 rounded-md border p-2.5 transition ${
                                                            isChecked
                                                                ? 'border-[#4A5FD1]/40 bg-[#4A5FD1]/5 dark:border-[#4A5FD1]/30 dark:bg-[#4A5FD1]/10'
                                                                : 'border-[rgba(30,36,48,0.08)] hover:bg-[#F6F7F9]/50 dark:border-[rgba(255,255,255,0.08)] dark:hover:bg-[#21293A]/30'
                                                        }`}
                                                    >
                                                        <div className={`mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-sm ${
                                                            isChecked
                                                                ? 'bg-[#4A5FD1] text-white'
                                                                : 'border border-[rgba(30,36,48,0.2)] dark:border-[rgba(255,255,255,0.2)]'
                                                        }`}>
                                                            {isChecked && (
                                                                <svg className="size-2.5 text-white" fill="none" viewBox="0 0 10 8">
                                                                    <path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                                </svg>
                                                            )}
                                                        </div>
                                                        <div className="min-w-0 flex-1" onClick={() => toggleId(k.id)}>
                                                            <p className={`truncate text-xs font-semibold ${isChecked ? 'text-[#4A5FD1] dark:text-[#8FA0FA]' : 'text-[#1E2430] dark:text-[#E6ECF5]'}`}>
                                                                {k.nama}
                                                            </p>
                                                            <p className="font-mono-sigap mt-0.5 text-[11px] text-[#727C8E] dark:text-[#8C97A8]">
                                                                {k.sesi_count} sesi
                                                                {k.tanggal_pertama && ` • ${k.tanggal_pertama}`}
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
                                    <div className="space-y-3">
                                        <div>
                                            <label className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#727C8E] dark:text-[#8C97A8]">
                                                <Calendar className="size-3" />
                                                Tanggal Mulai
                                            </label>
                                            <input
                                                type="date"
                                                value={tanggalMulai}
                                                onChange={e => { setTanggalMulai(e.target.value); setPreview(null); }}
                                                className="font-mono-sigap w-full rounded-md border border-[rgba(30,36,48,0.12)] bg-white px-3 py-1.5 text-xs font-semibold text-[#1E2430] outline-none focus:border-[#4A5FD1] dark:border-[rgba(255,255,255,0.12)] dark:bg-[#181E2B] dark:text-[#E6ECF5]"
                                            />
                                        </div>
                                        <div>
                                            <label className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#727C8E] dark:text-[#8C97A8]">
                                                <Calendar className="size-3" />
                                                Tanggal Akhir
                                            </label>
                                            <input
                                                type="date"
                                                value={tanggalSelesai}
                                                onChange={e => { setTanggalSelesai(e.target.value); setPreview(null); }}
                                                className="font-mono-sigap w-full rounded-md border border-[rgba(30,36,48,0.12)] bg-white px-3 py-1.5 text-xs font-semibold text-[#1E2430] outline-none focus:border-[#4A5FD1] dark:border-[rgba(255,255,255,0.12)] dark:bg-[#181E2B] dark:text-[#E6ECF5]"
                                            />
                                        </div>
                                    </div>
                                )}

                                <button
                                    type="button"
                                    onClick={doPreview}
                                    disabled={!canPreview() || loading}
                                    className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-lg bg-[#4A5FD1] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#3B4DB8] disabled:opacity-50"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="size-3.5 animate-spin" />
                                            Memuat Preview...
                                        </>
                                    ) : (
                                        <>
                                            <TrendingUp className="size-3.5" />
                                            Lihat Preview
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* ── Right: Preview ── */}
                    <div className="lg:col-span-3">
                        <div className="rounded-lg border border-[rgba(30,36,48,0.08)] bg-white shadow-sm dark:border-[rgba(255,255,255,0.08)] dark:bg-[#181E2B]">
                            {/* Card header */}
                            <div className="border-b border-[rgba(30,36,48,0.08)] px-5 py-3.5 dark:border-[rgba(255,255,255,0.08)]">
                                <h2 className="font-display text-sm font-semibold text-[#1E2430] dark:text-[#E6ECF5]">
                                    Preview Laporan
                                </h2>
                                <p className="text-xs text-[#727C8E] dark:text-[#8C97A8]">
                                    Pratinjau data sebelum melakukan unduhan
                                </p>
                            </div>

                            <div className="p-5">
                                {loading && (
                                    <div className="flex h-48 flex-col items-center justify-center gap-2">
                                        <Loader2 className="size-6 animate-spin text-[#4A5FD1]" />
                                        <p className="text-xs text-[#727C8E] dark:text-[#8C97A8]">Memuat data preview...</p>
                                    </div>
                                )}

                                {error && (
                                    <div className="flex items-start gap-2.5 rounded-md bg-[#C4514A]/10 p-3 text-xs text-[#C4514A]">
                                        <X className="mt-0.5 size-3.5 shrink-0" />
                                        {error}
                                    </div>
                                )}

                                {!loading && !preview && !error && (
                                    <div className="flex h-48 flex-col items-center justify-center gap-2 text-center">
                                        <div className="flex size-10 items-center justify-center rounded-md bg-[#F6F7F9] text-[#727C8E] dark:bg-[#21293A] dark:text-[#8C97A8]">
                                            <BarChart2 className="size-5" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold text-[#1E2430] dark:text-[#E6ECF5]">
                                                Belum ada data pratinjau
                                            </p>
                                            <p className="mt-0.5 text-[11px] text-[#727C8E] dark:text-[#8C97A8]">
                                                Pilih kegiatan atau periode, lalu klik &ldquo;Lihat Preview&rdquo;
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
                                                    className="overflow-hidden rounded-md border border-[rgba(30,36,48,0.08)] dark:border-[rgba(255,255,255,0.08)]"
                                                >
                                                    {/* Card header */}
                                                    <div className="flex items-center justify-between gap-2 bg-[#F6F7F9]/60 px-4 py-2.5 dark:bg-[#21293A]/40">
                                                        <p className="font-semibold text-xs text-[#1E2430] dark:text-[#E6ECF5]">
                                                            {item.nama}
                                                        </p>
                                                        <span className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-semibold ${item.tipe === 'terbuka' ? 'bg-[#4A5FD1]/12 text-[#4A5FD1] dark:bg-[#4A5FD1]/20 dark:text-[#8FA0FA]' : 'bg-[#B8862E]/12 text-[#B8862E] dark:bg-[#B8862E]/20 dark:text-[#D4A142]'}`}>
                                                            {item.tipe === 'terbuka' ? 'Terbuka' : 'Wajib Hadir'}
                                                        </span>
                                                    </div>

                                                    {/* Stats grid */}
                                                    <div className="grid grid-cols-2 gap-px bg-[rgba(30,36,48,0.06)] dark:bg-[rgba(255,255,255,0.06)] sm:grid-cols-4">
                                                        {/* Kehadiran */}
                                                        <div className="bg-white p-3 dark:bg-[#181E2B]">
                                                            <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-[#727C8E] dark:text-[#8C97A8]">
                                                                <Users className="size-3" /> Hadir
                                                            </p>
                                                            <p className="font-mono-sigap mt-1 text-sm font-semibold text-[#1E2430] dark:text-[#E6ECF5]">
                                                                {item.total_hadir}
                                                            </p>
                                                            <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-[#F6F7F9] dark:bg-[#21293A]">
                                                                <div
                                                                    className="h-full rounded-full bg-[#2E9E82] transition-all"
                                                                    style={{ width: `${pct}%` }}
                                                                />
                                                            </div>
                                                            <p className="font-mono-sigap mt-0.5 text-[10px] text-[#727C8E] dark:text-[#8C97A8]">{pct}%</p>
                                                        </div>
                                                        {/* Estimasi */}
                                                        <div className="bg-white p-3 dark:bg-[#181E2B]">
                                                            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#727C8E] dark:text-[#8C97A8]">Est. Anggaran</p>
                                                            <p className="font-mono-sigap mt-1 text-xs font-semibold text-[#1E2430] dark:text-[#E6ECF5]">
                                                                {rupiah(item.total_estimasi)}
                                                            </p>
                                                        </div>
                                                        {/* Realisasi */}
                                                        <div className="bg-white p-3 dark:bg-[#181E2B]">
                                                            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#727C8E] dark:text-[#8C97A8]">Realisasi</p>
                                                            <p className="font-mono-sigap mt-1 text-xs font-semibold text-[#1E2430] dark:text-[#E6ECF5]">
                                                                {rupiah(item.total_realisasi)}
                                                            </p>
                                                            <p className={`font-mono-sigap mt-0.5 text-[10px] font-semibold ${selisih > 0 ? 'text-[#C4514A]' : selisih < 0 ? 'text-[#2E9E82]' : 'text-[#727C8E]'}`}>
                                                                {selisih > 0 ? `+${rupiah(selisih)}` : selisih < 0 ? rupiah(selisih) : '±0'}
                                                            </p>
                                                        </div>
                                                        {/* Rating */}
                                                        <div className="bg-white p-3 dark:bg-[#181E2B]">
                                                            <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-[#727C8E] dark:text-[#8C97A8]">
                                                                <Star className="size-3 text-[#B8862E]" /> Rating
                                                            </p>
                                                            <p className="font-mono-sigap mt-1 text-sm font-semibold text-[#B8862E] dark:text-[#D4A142]">
                                                                {item.rata_rating ? item.rata_rating.toFixed(1) : '—'}
                                                            </p>
                                                            <p className="text-[10px] text-[#727C8E] dark:text-[#8C97A8]">{item.jumlah_evaluasi} ulasan</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}

                                        {/* Total summary */}
                                        {preview.length > 1 && (
                                            <div className="rounded-md border border-[#4A5FD1]/20 bg-[#4A5FD1]/5 p-3.5 dark:border-[#4A5FD1]/30 dark:bg-[#4A5FD1]/10">
                                                <div className="flex items-center gap-1.5">
                                                    <CheckCircle2 className="size-3.5 text-[#4A5FD1] dark:text-[#8FA0FA]" />
                                                    <p className="text-xs font-semibold text-[#1E2430] dark:text-[#E6ECF5]">
                                                        Total Rekapitulasi ({preview.length} kegiatan)
                                                    </p>
                                                </div>
                                                <div className="mt-2 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                                                    <div>
                                                        <p className="text-[10px] text-[#727C8E] dark:text-[#8C97A8]">Total Hadir</p>
                                                        <p className="font-mono-sigap font-semibold text-[#1E2430] dark:text-[#E6ECF5]">{totalHadir}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] text-[#727C8E] dark:text-[#8C97A8]">Est. Total</p>
                                                        <p className="font-mono-sigap font-semibold text-[#1E2430] dark:text-[#E6ECF5]">{rupiah(totalEst)}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] text-[#727C8E] dark:text-[#8C97A8]">Realisasi Total</p>
                                                        <p className="font-mono-sigap font-semibold text-[#1E2430] dark:text-[#E6ECF5]">{rupiah(totalReal)}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] text-[#727C8E] dark:text-[#8C97A8]">Selisih</p>
                                                        <p className={`font-mono-sigap font-semibold ${totalSelisih > 0 ? 'text-[#C4514A]' : 'text-[#2E9E82]'}`}>
                                                            {totalSelisih > 0 ? '+' : ''}{rupiah(totalSelisih)}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Export buttons */}
                                        <div className="mt-2 flex flex-wrap gap-2.5 pt-1">
                                            <a
                                                href={exportUrl('excel')}
                                                download
                                                className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#2E9E82] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#27866F]"
                                            >
                                                <FileSpreadsheet className="size-3.5" />
                                                Export Excel (.xlsx)
                                            </a>
                                            <a
                                                href={exportUrl('pdf')}
                                                download
                                                className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#C4514A] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#A93E38]"
                                            >
                                                <FileText className="size-3.5" />
                                                Export PDF (.pdf)
                                            </a>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

LaporanIndex.layout = (props: {
    currentTeam?: { slug: string } | null;
}) => ({
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
            title: 'Kelola Tim & Anggota',
            href: '#',
        },
    ],
});
