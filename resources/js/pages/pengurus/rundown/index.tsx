import { Head, router, usePage } from '@inertiajs/react';
import { ChevronDown, ClipboardList, Plus, Trash2, Calendar, Clock, MapPin } from 'lucide-react';
import { useEffect, useState } from 'react';
import { index as rundownIndex } from '@/routes/rundown';
import { upsert } from '@/routes/sesi/rundown';
import { confirmDelete, showSuccess, Toast } from '@/lib/sweetalert';

// ─── Types ────────────────────────────────────────────────────────────────────

type SesiOption = {
    id: number;
    nama: string;
    tanggal: string;
    waktu_mulai: string;
    waktu_selesai: string;
    lokasi: string;
};

type KegiatanOption = {
    id: number;
    nama: string;
    warna: string | null;
    sesi: SesiOption[];
};

type RundownItem = {
    id: number;
    waktu: string;
    uraian_acara: string;
    urutan: number;
};

type Props = {
    kegiatanList: KegiatanOption[];
    selectedKegiatanId: number | null;
    selectedSesiId: number | null;
    rundown: RundownItem[];
};

type RundownRow = { waktu: string; uraian_acara: string };

export default function RundownIndex({
    kegiatanList,
    selectedKegiatanId,
    selectedSesiId,
    rundown,
}: Props) {
    const { url } = usePage();
    const teamSlug = url.split('/')[1];

    const selectedKegiatan = kegiatanList.find((k) => k.id === selectedKegiatanId) ?? null;
    const sesiList: SesiOption[] = selectedKegiatan?.sesi ?? [];
    const selectedSesi = sesiList.find((s) => s.id === selectedSesiId) ?? null;

    const [rows, setRows] = useState<RundownRow[]>(() =>
        rundown.length > 0
            ? rundown.map((r) => ({ waktu: r.waktu, uraian_acara: r.uraian_acara }))
            : [],
    );
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        setRows(
            rundown.length > 0
                ? rundown.map((r) => ({ waktu: r.waktu, uraian_acara: r.uraian_acara }))
                : [],
        );
    }, [selectedSesiId, rundown.length, JSON.stringify(rundown)]);

    function pilihKegiatan(id: number) {
        router.get(rundownIndex.url(teamSlug), { kegiatan_id: id }, { preserveState: false });
    }

    function pilihSesi(id: number) {
        router.get(rundownIndex.url(teamSlug), { kegiatan_id: selectedKegiatanId, sesi_id: id }, { preserveState: false });
    }

    function tambahBaris() {
        setRows((prev) => [...prev, { waktu: '', uraian_acara: '' }]);
        Toast.fire({
            icon: 'info',
            title: 'Baris agenda baru ditambahkan.',
        });
    }

    async function hapusBaris(index: number) {
        const row = rows[index];
        const label = row?.uraian_acara ? `"${row.uraian_acara}"` : `Baris #${index + 1}`;
        const confirmed = await confirmDelete('Item Rundown', `Hapus ${label} dari susunan rundown?`);
        if (!confirmed) return;
        setRows((prev) => prev.filter((_, i) => i !== index));
        Toast.fire({
            icon: 'success',
            title: 'Baris agenda berhasil dihapus.',
        });
    }

    function updateBaris(index: number, field: keyof RundownRow, value: string) {
        setRows((prev) => prev.map((r, i) => (i === index ? { ...r, [field]: value } : r)));
    }

    function simpan() {
        if (!selectedSesiId) return;
        setSaving(true);
        router.put(
            upsert.url({ current_team: teamSlug, sesi: selectedSesiId }),
            { rundown: rows },
            {
                preserveScroll: true,
                onSuccess: () => {
                    showSuccess('Rundown Tersimpan!', 'Susunan jadwal rundown acara berhasil disimpan ke sistem.');
                    router.get(
                        rundownIndex.url(teamSlug),
                        { kegiatan_id: selectedKegiatanId, sesi_id: selectedSesiId },
                        { preserveState: false, preserveScroll: true }
                    );
                },
                onFinish: () => setSaving(false),
            },
        );
    }

    return (
        <>
            <Head title="Rundown Acara" />

            <div className="flex h-full flex-col gap-6 p-4 sm:p-6 lg:p-8">
                {/* ─── Header ─── */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="font-display text-2xl font-extrabold tracking-tight text-neutral-900 sm:text-3xl dark:text-neutral-100">
                            Rundown Acara
                        </h1>
                        <p className="mt-0.5 text-xs font-medium text-neutral-500 dark:text-neutral-400">
                            Atur susunan jadwal kegiatan secara presisi per sesi
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        {/* Selector Kegiatan */}
                        {kegiatanList.length > 0 && (
                            <div className="relative min-w-48">
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

                        {/* Selector Sesi */}
                        {selectedKegiatan && sesiList.length > 0 && (
                            <div className="relative min-w-56">
                                <select
                                    value={selectedSesiId ?? ''}
                                    onChange={(e) => pilihSesi(Number(e.target.value))}
                                    className="w-full appearance-none rounded-2xl border border-neutral-200/70 bg-white py-2.5 pl-4 pr-10 text-xs font-bold text-neutral-800 shadow-2xs focus:border-[#4F46E5] focus:outline-none dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100"
                                >
                                    <option value="" disabled>
                                        Pilih Sesi
                                    </option>
                                    {sesiList.map((s) => (
                                        <option key={s.id} value={s.id}>
                                            {s.tanggal} • {s.waktu_mulai.slice(0, 5)}–{s.waktu_selesai.slice(0, 5)}
                                            {s.lokasi ? ` (${s.lokasi})` : ''}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown className="pointer-events-none absolute right-3 top-3 size-4 text-neutral-400" />
                            </div>
                        )}
                    </div>
                </div>

                {/* ─── Empty States ─── */}
                {kegiatanList.length === 0 && (
                    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-neutral-200 bg-white py-20 text-center dark:border-neutral-800 dark:bg-neutral-900">
                        <ClipboardList className="mb-4 size-12 text-neutral-300 dark:text-neutral-700" />
                        <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                            Kamu tidak memiliki akses rundown untuk kegiatan manapun.
                        </p>
                    </div>
                )}

                {kegiatanList.length > 0 && !selectedKegiatan && (
                    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-neutral-200 bg-white py-20 text-center dark:border-neutral-800 dark:bg-neutral-900">
                        <ClipboardList className="mb-4 size-12 text-neutral-300 dark:text-neutral-700" />
                        <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                            Pilih kegiatan di atas untuk mengelola susunan rundown.
                        </p>
                    </div>
                )}

                {selectedKegiatan && sesiList.length === 0 && (
                    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-neutral-200 bg-white py-20 text-center dark:border-neutral-800 dark:bg-neutral-900">
                        <Calendar className="mb-4 size-12 text-neutral-300 dark:text-neutral-700" />
                        <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                            Kegiatan ini belum memiliki jadwal sesi.
                        </p>
                    </div>
                )}

                {selectedKegiatan && sesiList.length > 0 && !selectedSesi && (
                    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-neutral-200 bg-white py-20 text-center dark:border-neutral-800 dark:bg-neutral-900">
                        <Clock className="mb-4 size-12 text-neutral-300 dark:text-neutral-700" />
                        <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                            Pilih sesi kegiatan di atas untuk mulai menyusun rundown.
                        </p>
                    </div>
                )}

                {/* ─── Editor Rundown ─── */}
                {selectedSesi && (
                    <div className="overflow-hidden rounded-3xl border border-neutral-200/70 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                        {/* Sesi info header */}
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-100 bg-neutral-50/50 px-6 py-4 dark:border-neutral-800 dark:bg-neutral-800/30">
                            <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                                <span className="flex items-center gap-1.5">
                                    <Calendar className="size-4 text-[#4F46E5]" />
                                    {selectedSesi.tanggal}
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <Clock className="size-4 text-[#4F46E5]" />
                                    <span className="font-mono-sigap">
                                        {selectedSesi.waktu_mulai.slice(0, 5)} – {selectedSesi.waktu_selesai.slice(0, 5)}
                                    </span>
                                </span>
                                {selectedSesi.lokasi && (
                                    <span className="flex items-center gap-1.5">
                                        <MapPin className="size-4 text-[#4F46E5]" />
                                        {selectedSesi.lokasi}
                                    </span>
                                )}
                            </div>
                            <span className="rounded-full bg-[#EEF2FF] px-3 py-1 text-[11px] font-bold text-[#4F46E5] dark:bg-[#4F46E5]/20 dark:text-[#818CF8]">
                                {rows.length} Item Agenda
                            </span>
                        </div>

                        <div className="p-6">
                            {/* Header kolom */}
                            <div className="mb-3 grid grid-cols-[2.5rem_10rem_1fr_2.5rem] gap-3 px-1 text-[11px] font-extrabold uppercase tracking-wider text-neutral-400">
                                <span>#</span>
                                <span>Waktu</span>
                                <span>Uraian Acara</span>
                                <span />
                            </div>

                            {rows.length === 0 && (
                                <p className="mb-4 text-xs italic text-neutral-400">
                                    Belum ada baris rundown. Klik "Tambah Baris" di bawah untuk memulai.
                                </p>
                            )}

                            <div className="flex flex-col gap-2.5">
                                {rows.map((row, i) => (
                                    <div
                                        key={i}
                                        className="grid grid-cols-[2.5rem_10rem_1fr_2.5rem] items-center gap-3"
                                    >
                                        <span className="text-center font-mono-sigap text-xs font-bold text-neutral-400">
                                            {i + 1}
                                        </span>
                                        <input
                                            type="time"
                                            value={row.waktu}
                                            onChange={(e) => updateBaris(i, 'waktu', e.target.value)}
                                            className="font-mono-sigap rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs font-bold text-neutral-800 focus:border-[#4F46E5] focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                                        />
                                        <input
                                            type="text"
                                            value={row.uraian_acara}
                                            onChange={(e) => updateBaris(i, 'uraian_acara', e.target.value)}
                                            placeholder="Tulis detail uraian acara..."
                                            className="rounded-xl border border-neutral-200 bg-white px-3.5 py-2 text-xs text-neutral-800 focus:border-[#4F46E5] focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => hapusBaris(i)}
                                            title="Hapus baris"
                                            className="flex items-center justify-center rounded-xl p-2 text-neutral-400 transition hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/30"
                                        >
                                            <Trash2 className="size-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>

                            {/* Tombol Tambah Baris */}
                            <button
                                type="button"
                                onClick={tambahBaris}
                                className="mt-5 flex items-center gap-1.5 rounded-2xl border border-dashed border-neutral-200 px-4 py-2 text-xs font-bold text-neutral-600 transition hover:border-[#4F46E5] hover:text-[#4F46E5] dark:border-neutral-700 dark:text-neutral-400 dark:hover:border-[#4F46E5] dark:hover:text-[#818CF8]"
                            >
                                <Plus className="size-4" />
                                Tambah Baris Agenda
                            </button>
                        </div>

                        <div className="flex justify-end border-t border-neutral-100 px-6 py-4 dark:border-neutral-800">
                            <button
                                type="button"
                                onClick={simpan}
                                disabled={saving}
                                className="rounded-2xl bg-[#4F46E5] px-6 py-2.5 text-xs font-bold text-white shadow-sm shadow-[#4F46E5]/25 transition hover:bg-[#4338CA] disabled:opacity-50"
                            >
                                {saving ? 'Menyimpan...' : 'Simpan Rundown'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
