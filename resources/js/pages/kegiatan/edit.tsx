import { Head, router, useForm, usePage } from '@inertiajs/react';
import { CalendarDays, Clock, MapPin, Plus, Save, Trash2 } from 'lucide-react';
import rundownRoutes from '@/routes/pengurus/sesi/rundown';

// ─── Types ────────────────────────────────────────────────────────────────────

type RundownItem = {
    id: number;
    waktu: string;
    uraian_acara: string;
    urutan: number;
};

type Sesi = {
    id: number;
    tanggal: string;
    waktu_mulai: string;
    waktu_selesai: string;
    lokasi: string;
    status: 'terjadwal' | 'berlangsung' | 'selesai';
    rundown: RundownItem[];
};

type Kegiatan = {
    id: number;
    nama: string;
    deskripsi: string | null;
    tipe: 'wajib_hadir' | 'terbuka';
    kuota: number | null;
    warna: string;
    sesi: Sesi[];
};

type Props = { kegiatan: Kegiatan };

type KegiatanForm = {
    nama: string;
    deskripsi: string;
    tipe: 'wajib_hadir' | 'terbuka';
    kuota: string;
    warna: string;
};

type SesiForm = {
    tanggal: string;
    waktu_mulai: string;
    waktu_selesai: string;
    lokasi: string;
};

type RundownRow = { waktu: string; uraian_acara: string };

const PALET_WARNA = [
    '#5B4FE9', '#FF6F59', '#FFC857', '#2EC4B6', '#F45B8D',
    '#4FB6E9', '#9BD94B', '#A855C9', '#F2994A', '#1B8A8A',
];

const STATUS_MAP = {
    terjadwal: { label: 'Terjadwal', cls: 'bg-blue-100 text-blue-700' },
    berlangsung: { label: 'Berlangsung', cls: 'bg-green-100 text-green-700' },
    selesai: { label: 'Selesai', cls: 'bg-neutral-100 text-neutral-500' },
};

const EMPTY_ROW: RundownRow = { waktu: '', uraian_acara: '' };

// ─── Helpers ──────────────────────────────────────────────────────────────────

function InputError({ message }: { message?: string }) {
    if (!message) return null;
    return <p className="mt-1 text-xs text-red-500">{message}</p>;
}

// ─── RundownEditor — isolated per sesi ───────────────────────────────────────

function RundownEditor({ sesi, teamSlug }: { sesi: Sesi; teamSlug: string }) {
    const initialRows: RundownRow[] = sesi.rundown.length > 0
        ? [...sesi.rundown]
            .sort((a, b) => a.urutan - b.urutan)
            .map((r) => ({ waktu: r.waktu.slice(0, 5), uraian_acara: r.uraian_acara }))
        : [];

    const form = useForm<{ rundown: RundownRow[] }>({ rundown: initialRows });

    function addRow() {
        form.setData('rundown', [...form.data.rundown, { ...EMPTY_ROW }]);
    }

    function removeRow(idx: number) {
        form.setData('rundown', form.data.rundown.filter((_, i) => i !== idx));
    }

    function updateRow(idx: number, field: keyof RundownRow, value: string) {
        const updated = form.data.rundown.map((r, i) =>
            i === idx ? { ...r, [field]: value } : r,
        );
        form.setData('rundown', updated);
    }

    function submit(e: React.FormEvent) {
        e.preventDefault();
        // Kirim dengan urutan dari posisi (1-based)
        const payload = form.data.rundown.map((r, i) => ({
            waktu: r.waktu,
            uraian_acara: r.uraian_acara,
            urutan: i + 1,
        }));

        router.put(
            rundownRoutes.upsert.url({ current_team: teamSlug, sesi: sesi.id }),
            { rundown: payload },
            { preserveScroll: true },
        );
    }

    return (
        <div className="mt-3 border-t border-neutral-100 pt-3 dark:border-neutral-800">
            <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-medium text-neutral-500">Rundown</span>
                <button
                    type="button"
                    onClick={addRow}
                    className="inline-flex items-center gap-1 rounded-lg border border-indigo-300 px-2 py-0.5 text-xs font-medium text-indigo-600 hover:bg-indigo-50 dark:border-indigo-700 dark:text-indigo-400 dark:hover:bg-indigo-900/30"
                >
                    <Plus className="size-3" /> Tambah Baris
                </button>
            </div>

            {form.data.rundown.length === 0 ? (
                <p className="text-xs italic text-neutral-400">Belum ada baris rundown.</p>
            ) : (
                <div className="flex flex-col gap-2">
                    {form.data.rundown.map((row, rIdx) => (
                        <div key={rIdx} className="flex items-start gap-2">
                            <span className="mt-2 w-5 shrink-0 text-center text-xs font-medium text-neutral-400">
                                {rIdx + 1}
                            </span>
                            <div className="flex flex-col">
                                <input
                                    type="time"
                                    value={row.waktu}
                                    onChange={(e) => updateRow(rIdx, 'waktu', e.target.value)}
                                    className="w-28 rounded-lg border border-neutral-300 bg-white px-2 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                                />
                            </div>
                            <div className="flex flex-1 flex-col">
                                <input
                                    type="text"
                                    value={row.uraian_acara}
                                    onChange={(e) => updateRow(rIdx, 'uraian_acara', e.target.value)}
                                    placeholder="Uraian acara"
                                    className="w-full rounded-lg border border-neutral-300 bg-white px-2 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                                />
                            </div>
                            <button
                                type="button"
                                onClick={() => removeRow(rIdx)}
                                className="mt-1.5 shrink-0 text-red-400 hover:text-red-600"
                                aria-label="Hapus baris rundown"
                            >
                                <Trash2 className="size-3.5" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <button
                type="button"
                onClick={submit}
                className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
                <Save className="size-3" />
                Simpan Rundown
            </button>
        </div>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function KegiatanEdit({ kegiatan }: Props) {
    const { currentTeam } = usePage().props;
    const teamSlug = currentTeam?.slug ?? '';

    const { data, setData, patch, processing, errors } = useForm<KegiatanForm>({
        nama: kegiatan.nama,
        deskripsi: kegiatan.deskripsi ?? '',
        tipe: kegiatan.tipe,
        kuota: kegiatan.kuota?.toString() ?? '',
        warna: kegiatan.warna,
    });

    const sesiForm = useForm<SesiForm>({
        tanggal: '',
        waktu_mulai: '',
        waktu_selesai: '',
        lokasi: '',
    });

    function submitKegiatan(e: React.FormEvent) {
        e.preventDefault();
        patch(`/${teamSlug}/pengurus/kegiatan/${kegiatan.id}`);
    }

    function submitTambahSesi(e: React.FormEvent) {
        e.preventDefault();
        sesiForm.post(`/${teamSlug}/pengurus/kegiatan/${kegiatan.id}/sesi`, {
            onSuccess: () => sesiForm.reset(),
        });
    }

    function deleteSesi(sesiId: number) {
        if (!confirm('Hapus sesi ini?')) return;
        router.delete(`/${teamSlug}/pengurus/sesi/${sesiId}`, { preserveScroll: true });
    }

    return (
        <>
            <Head title={`Edit: ${kegiatan.nama}`} />

            <div className="mx-auto max-w-2xl p-4">
                <div className="mb-6">
                    <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">Edit Kegiatan</h1>
                    <p className="mt-0.5 text-sm text-neutral-500">{kegiatan.nama}</p>
                </div>

                <div className="flex flex-col gap-6">
                    {/* ── Info Kegiatan ── */}
                    <form
                        onSubmit={submitKegiatan}
                        className="rounded-xl border border-sidebar-border/70 bg-white p-5 dark:border-sidebar-border dark:bg-neutral-900"
                    >
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
                                    className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                                />
                            </div>

                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                    Tipe
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
                                                {t === 'wajib_hadir' ? 'Tanpa RSVP' : 'Ada kuota, wajib RSVP'}
                                            </p>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {data.tipe === 'terbuka' && (
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                        Kuota <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        min={1}
                                        value={data.kuota}
                                        onChange={(e) => setData('kuota', e.target.value)}
                                        className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
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

                        <div className="mt-5 flex justify-end gap-3">
                            <a
                                href={`/${teamSlug}/pengurus/kegiatan`}
                                className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
                            >
                                Batal
                            </a>
                            <button
                                type="submit"
                                disabled={processing}
                                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                            >
                                <Save className="size-4" />
                                {processing ? 'Menyimpan...' : 'Simpan Perubahan'}
                            </button>
                        </div>
                    </form>

                    {/* ── Daftar Sesi + Rundown ── */}
                    <section className="rounded-xl border border-sidebar-border/70 bg-white p-5 dark:border-sidebar-border dark:bg-neutral-900">
                        <h2 className="mb-4 text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                            Jadwal Sesi ({kegiatan.sesi.length})
                        </h2>

                        <div className="flex flex-col gap-3">
                            {kegiatan.sesi.map((sesi, idx) => (
                                <div
                                    key={sesi.id}
                                    className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-700"
                                >
                                    {/* Header sesi */}
                                    <div className="flex items-center gap-3">
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-medium text-neutral-800 dark:text-neutral-100">
                                                <CalendarDays className="mr-1 inline size-3.5 text-neutral-400" />
                                                Sesi {idx + 1} —{' '}
                                                {new Date(sesi.tanggal + 'T00:00:00').toLocaleDateString('id-ID', {
                                                    weekday: 'short',
                                                    day: 'numeric',
                                                    month: 'short',
                                                    year: 'numeric',
                                                })}
                                            </p>
                                            <p className="mt-0.5 flex items-center gap-3 text-xs text-neutral-500">
                                                <span className="flex items-center gap-1">
                                                    <Clock className="size-3" />
                                                    {sesi.waktu_mulai.slice(0, 5)} – {sesi.waktu_selesai.slice(0, 5)}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <MapPin className="size-3" />
                                                    {sesi.lokasi}
                                                </span>
                                            </p>
                                        </div>
                                        <span
                                            className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_MAP[sesi.status].cls}`}
                                        >
                                            {STATUS_MAP[sesi.status].label}
                                        </span>
                                        <button
                                            onClick={() => deleteSesi(sesi.id)}
                                            disabled={kegiatan.sesi.length <= 1}
                                            title={
                                                kegiatan.sesi.length <= 1
                                                    ? 'Kegiatan harus punya minimal 1 sesi'
                                                    : 'Hapus sesi'
                                            }
                                            className="shrink-0 text-red-400 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-30"
                                        >
                                            <Trash2 className="size-4" />
                                        </button>
                                    </div>

                                    {/* Rundown editor inline */}
                                    <RundownEditor sesi={sesi} teamSlug={teamSlug} />
                                </div>
                            ))}
                        </div>

                        {/* Form tambah sesi baru */}
                        <form
                            onSubmit={submitTambahSesi}
                            className="mt-4 rounded-lg border border-dashed border-neutral-300 p-4 dark:border-neutral-600"
                        >
                            <p className="mb-3 text-xs font-medium text-neutral-500">Tambah Sesi Baru</p>
                            <div className="grid gap-3 sm:grid-cols-2">
                                <div className="sm:col-span-2">
                                    <input
                                        type="date"
                                        value={sesiForm.data.tanggal}
                                        onChange={(e) => sesiForm.setData('tanggal', e.target.value)}
                                        className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                                    />
                                    <InputError message={sesiForm.errors.tanggal} />
                                </div>
                                <div>
                                    <input
                                        type="time"
                                        value={sesiForm.data.waktu_mulai}
                                        onChange={(e) => sesiForm.setData('waktu_mulai', e.target.value)}
                                        placeholder="Mulai"
                                        className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                                    />
                                    <InputError message={sesiForm.errors.waktu_mulai} />
                                </div>
                                <div>
                                    <input
                                        type="time"
                                        value={sesiForm.data.waktu_selesai}
                                        onChange={(e) => sesiForm.setData('waktu_selesai', e.target.value)}
                                        placeholder="Selesai"
                                        className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                                    />
                                    <InputError message={sesiForm.errors.waktu_selesai} />
                                </div>
                                <div className="sm:col-span-2">
                                    <input
                                        type="text"
                                        value={sesiForm.data.lokasi}
                                        onChange={(e) => sesiForm.setData('lokasi', e.target.value)}
                                        placeholder="Lokasi"
                                        className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                                    />
                                    <InputError message={sesiForm.errors.lokasi} />
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={sesiForm.processing}
                                className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-indigo-300 px-3 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-50 disabled:opacity-50 dark:border-indigo-700 dark:text-indigo-400"
                            >
                                <Plus className="size-3.5" />
                                {sesiForm.processing ? 'Menambahkan...' : 'Tambah Sesi'}
                            </button>
                        </form>
                    </section>
                </div>
            </div>
        </>
    );
}
