import { Head, useForm, usePage } from '@inertiajs/react';
import { CalendarDays, Clock, MapPin, Plus, Trash2 } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type RundownForm = {
    waktu: string;
    uraian_acara: string;
};

type SesiForm = {
    tanggal: string;
    waktu_mulai: string;
    waktu_selesai: string;
    lokasi: string;
    rundown: RundownForm[];
};

type KegiatanForm = {
    nama: string;
    deskripsi: string;
    tipe: 'wajib_hadir' | 'terbuka' | '';
    kuota: string;
    warna: string;
    sesi: SesiForm[];
};

// ─── Constants ────────────────────────────────────────────────────────────────

const EMPTY_RUNDOWN: RundownForm = { waktu: '', uraian_acara: '' };

const EMPTY_SESI: SesiForm = {
    tanggal: '',
    waktu_mulai: '',
    waktu_selesai: '',
    lokasi: '',
    rundown: [],
};

const PALET_WARNA = [
    '#5B4FE9', '#FF6F59', '#FFC857', '#2EC4B6', '#F45B8D',
    '#4FB6E9', '#9BD94B', '#A855C9', '#F2994A', '#1B8A8A',
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function InputError({ message }: { message?: string }) {
    if (!message) return null;
    return <p className="mt-1 text-xs text-red-500">{message}</p>;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function KegiatanCreate() {
    const { currentTeam } = usePage().props;
    const teamSlug = currentTeam?.slug ?? '';

    const { data, setData, post, processing, errors } = useForm<KegiatanForm>({
        nama: '',
        deskripsi: '',
        tipe: '',
        kuota: '',
        warna: '',
        sesi: [{ ...EMPTY_SESI, rundown: [] }],
    });

    // ── Sesi helpers ──────────────────────────────────────────────────────────

    function addSesi() {
        setData('sesi', [...data.sesi, { ...EMPTY_SESI, rundown: [] }]);
    }

    function removeSesi(idx: number) {
        if (data.sesi.length <= 1) return;
        setData('sesi', data.sesi.filter((_, i) => i !== idx));
    }

    function updateSesi(idx: number, field: keyof Omit<SesiForm, 'rundown'>, value: string) {
        const updated = data.sesi.map((s, i) => (i === idx ? { ...s, [field]: value } : s));
        setData('sesi', updated);
    }

    // ── Rundown helpers ───────────────────────────────────────────────────────

    function addRundown(sesiIdx: number) {
        const updated = data.sesi.map((s, i) =>
            i === sesiIdx ? { ...s, rundown: [...s.rundown, { ...EMPTY_RUNDOWN }] } : s,
        );
        setData('sesi', updated);
    }

    function removeRundown(sesiIdx: number, rundownIdx: number) {
        const updated = data.sesi.map((s, i) =>
            i === sesiIdx
                ? { ...s, rundown: s.rundown.filter((_, j) => j !== rundownIdx) }
                : s,
        );
        setData('sesi', updated);
    }

    function updateRundown(
        sesiIdx: number,
        rundownIdx: number,
        field: keyof RundownForm,
        value: string,
    ) {
        const updated = data.sesi.map((s, i) =>
            i === sesiIdx
                ? {
                      ...s,
                      rundown: s.rundown.map((r, j) =>
                          j === rundownIdx ? { ...r, [field]: value } : r,
                      ),
                  }
                : s,
        );
        setData('sesi', updated);
    }

    // ── Submit ────────────────────────────────────────────────────────────────

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post(`/${teamSlug}/pengurus/kegiatan`);
    }

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <>
            <Head title="Tambah Kegiatan" />

            <div className="mx-auto max-w-2xl p-4">
                <div className="mb-6">
                    <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
                        Tambah Kegiatan
                    </h1>
                    <p className="mt-0.5 text-sm text-neutral-500">
                        Isi data kegiatan dan minimal 1 sesi.
                    </p>
                </div>

                <form onSubmit={submit} className="flex flex-col gap-6">
                    {/* ── Info Kegiatan ──────────────────────────────────── */}
                    <section className="rounded-xl border border-sidebar-border/70 bg-white p-5 dark:border-sidebar-border dark:bg-neutral-900">
                        <h2 className="mb-4 text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                            Info Kegiatan
                        </h2>

                        <div className="flex flex-col gap-4">
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                    Nama Kegiatan <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={data.nama}
                                    onChange={(e) => setData('nama', e.target.value)}
                                    placeholder="contoh: Rapat Rutin Bulanan"
                                    className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                                />
                                <InputError message={errors.nama} />
                            </div>

                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                    Deskripsi
                                </label>
                                <textarea
                                    value={data.deskripsi}
                                    onChange={(e) => setData('deskripsi', e.target.value)}
                                    rows={3}
                                    placeholder="Opsional — informasi tambahan tentang kegiatan"
                                    className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                                />
                                <InputError message={errors.deskripsi} />
                            </div>

                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                    Tipe Kegiatan <span className="text-red-500">*</span>
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    {(['wajib_hadir', 'terbuka'] as const).map((t) => (
                                        <button
                                            key={t}
                                            type="button"
                                            onClick={() => setData('tipe', t)}
                                            className={`rounded-lg border p-3 text-left text-sm transition ${
                                                data.tipe === t
                                                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300'
                                                    : 'border-neutral-300 bg-white text-neutral-700 hover:border-neutral-400 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300'
                                            }`}
                                        >
                                            <span className="font-medium">
                                                {t === 'wajib_hadir' ? 'Wajib Hadir' : 'Terbuka'}
                                            </span>
                                            <p className="mt-0.5 text-xs opacity-70">
                                                {t === 'wajib_hadir'
                                                    ? 'Semua anggota otomatis boleh hadir, tanpa RSVP'
                                                    : 'Ada kuota, anggota wajib RSVP dulu'}
                                            </p>
                                        </button>
                                    ))}
                                </div>
                                <InputError message={errors.tipe} />
                            </div>

                            {data.tipe === 'terbuka' && (
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                        Kuota Peserta <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        min={1}
                                        value={data.kuota}
                                        onChange={(e) => setData('kuota', e.target.value)}
                                        placeholder="contoh: 50"
                                        className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                                    />
                                    <InputError message={errors.kuota} />
                                </div>
                            )}

                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                    Warna
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {PALET_WARNA.map((w) => (
                                        <button
                                            key={w}
                                            type="button"
                                            onClick={() => setData('warna', w)}
                                            className={`size-7 rounded-full transition ${data.warna === w ? 'ring-2 ring-offset-2 ring-neutral-400' : ''}`}
                                            style={{ backgroundColor: w }}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* ── Jadwal Sesi ────────────────────────────────────── */}
                    <section className="rounded-xl border border-sidebar-border/70 bg-white p-5 dark:border-sidebar-border dark:bg-neutral-900">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                                Jadwal Sesi
                            </h2>
                            <button
                                type="button"
                                onClick={addSesi}
                                className="inline-flex items-center gap-1 rounded-lg border border-indigo-300 px-2.5 py-1 text-xs font-medium text-indigo-600 transition hover:bg-indigo-50 dark:border-indigo-700 dark:text-indigo-400 dark:hover:bg-indigo-900/30"
                            >
                                <Plus className="size-3" /> Tambah Sesi
                            </button>
                        </div>

                        <div className="flex flex-col gap-4">
                            {data.sesi.map((sesi, idx) => (
                                <div
                                    key={idx}
                                    className="relative rounded-lg border border-neutral-200 p-4 dark:border-neutral-700"
                                >
                                    {/* Header sesi */}
                                    <div className="mb-3 flex items-center justify-between">
                                        <span className="flex items-center gap-1.5 text-xs font-medium text-neutral-500">
                                            <CalendarDays className="size-3.5" />
                                            Sesi {idx + 1}
                                        </span>
                                        {data.sesi.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => removeSesi(idx)}
                                                className="text-red-400 hover:text-red-600"
                                            >
                                                <Trash2 className="size-3.5" />
                                            </button>
                                        )}
                                    </div>

                                    <div className="grid gap-3 sm:grid-cols-2">
                                        {/* Tanggal */}
                                        <div className="sm:col-span-2">
                                            <label className="mb-1 block text-xs font-medium text-neutral-600 dark:text-neutral-400">
                                                <CalendarDays className="mr-1 inline size-3" />
                                                Tanggal
                                            </label>
                                            <input
                                                type="date"
                                                value={sesi.tanggal}
                                                onChange={(e) => updateSesi(idx, 'tanggal', e.target.value)}
                                                className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                                            />
                                            <InputError
                                                message={(errors as Record<string, string>)[`sesi.${idx}.tanggal`]}
                                            />
                                        </div>

                                        {/* Waktu mulai */}
                                        <div>
                                            <label className="mb-1 block text-xs font-medium text-neutral-600 dark:text-neutral-400">
                                                <Clock className="mr-1 inline size-3" />
                                                Mulai
                                            </label>
                                            <input
                                                type="time"
                                                value={sesi.waktu_mulai}
                                                onChange={(e) => updateSesi(idx, 'waktu_mulai', e.target.value)}
                                                className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                                            />
                                            <InputError
                                                message={(errors as Record<string, string>)[`sesi.${idx}.waktu_mulai`]}
                                            />
                                        </div>

                                        {/* Waktu selesai */}
                                        <div>
                                            <label className="mb-1 block text-xs font-medium text-neutral-600 dark:text-neutral-400">
                                                <Clock className="mr-1 inline size-3" />
                                                Selesai
                                            </label>
                                            <input
                                                type="time"
                                                value={sesi.waktu_selesai}
                                                onChange={(e) => updateSesi(idx, 'waktu_selesai', e.target.value)}
                                                className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                                            />
                                            <InputError
                                                message={(errors as Record<string, string>)[`sesi.${idx}.waktu_selesai`]}
                                            />
                                        </div>

                                        {/* Lokasi */}
                                        <div className="sm:col-span-2">
                                            <label className="mb-1 block text-xs font-medium text-neutral-600 dark:text-neutral-400">
                                                <MapPin className="mr-1 inline size-3" />
                                                Lokasi
                                            </label>
                                            <input
                                                type="text"
                                                value={sesi.lokasi}
                                                onChange={(e) => updateSesi(idx, 'lokasi', e.target.value)}
                                                placeholder="contoh: Ruang Rapat Lantai 3"
                                                className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                                            />
                                            <InputError
                                                message={(errors as Record<string, string>)[`sesi.${idx}.lokasi`]}
                                            />
                                        </div>

                                        {/* ── Rundown sub-section ──────── */}
                                        <div className="sm:col-span-2 mt-2 border-t border-neutral-100 pt-3 dark:border-neutral-700">
                                            <div className="mb-2 flex items-center justify-between">
                                                <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
                                                    Rundown
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => addRundown(idx)}
                                                    className="inline-flex items-center gap-1 rounded-lg border border-indigo-300 px-2 py-0.5 text-xs font-medium text-indigo-600 hover:bg-indigo-50 dark:border-indigo-700 dark:text-indigo-400 dark:hover:bg-indigo-900/30"
                                                >
                                                    <Plus className="size-3" /> Tambah Baris
                                                </button>
                                            </div>

                                            {sesi.rundown.length === 0 ? (
                                                <p className="text-xs italic text-neutral-400">
                                                    Belum ada baris rundown.
                                                </p>
                                            ) : (
                                                <div className="flex flex-col gap-2">
                                                    {sesi.rundown.map((row, rIdx) => (
                                                        <div
                                                            key={rIdx}
                                                            className="flex items-start gap-2"
                                                        >
                                                            <span className="mt-2 w-5 shrink-0 text-center text-xs font-medium text-neutral-400">
                                                                {rIdx + 1}
                                                            </span>
                                                            <div className="flex flex-col">
                                                                <input
                                                                    type="time"
                                                                    value={row.waktu}
                                                                    onChange={(e) =>
                                                                        updateRundown(idx, rIdx, 'waktu', e.target.value)
                                                                    }
                                                                    className="w-28 rounded-lg border border-neutral-300 bg-white px-2 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                                                                />
                                                                <InputError
                                                                    message={
                                                                        (errors as Record<string, string>)[
                                                                            `sesi.${idx}.rundown.${rIdx}.waktu`
                                                                        ]
                                                                    }
                                                                />
                                                            </div>
                                                            <div className="flex flex-1 flex-col">
                                                                <input
                                                                    type="text"
                                                                    value={row.uraian_acara}
                                                                    onChange={(e) =>
                                                                        updateRundown(
                                                                            idx,
                                                                            rIdx,
                                                                            'uraian_acara',
                                                                            e.target.value,
                                                                        )
                                                                    }
                                                                    placeholder="Uraian acara"
                                                                    className="w-full rounded-lg border border-neutral-300 bg-white px-2 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                                                                />
                                                                <InputError
                                                                    message={
                                                                        (errors as Record<string, string>)[
                                                                            `sesi.${idx}.rundown.${rIdx}.uraian_acara`
                                                                        ]
                                                                    }
                                                                />
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={() => removeRundown(idx, rIdx)}
                                                                className="mt-1.5 shrink-0 text-red-400 hover:text-red-600"
                                                                aria-label="Hapus baris rundown"
                                                            >
                                                                <Trash2 className="size-3.5" />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* ── Submit ─────────────────────────────────────────── */}
                    <div className="flex justify-end gap-3">
                        <a
                            href={`/${teamSlug}/pengurus/kegiatan`}
                            className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
                        >
                            Batal
                        </a>
                        <button
                            type="submit"
                            disabled={processing}
                            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-50"
                        >
                            {processing ? 'Menyimpan...' : 'Simpan Kegiatan'}
                        </button>
                    </div>
                </form>
            </div>
        </>
    );
}
