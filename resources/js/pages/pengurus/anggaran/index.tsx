import { Head, router, useForm, usePage } from '@inertiajs/react';
import {
    ChevronDown,
    PiggyBank,
    Plus,
    Trash2,
    TrendingUp,
    TrendingDown,
    Wallet,
    Pencil,
} from 'lucide-react';
import { useState } from 'react';
import { index as anggaranIndex } from '@/routes/anggaran';
import { store, update, destroy } from '@/routes/anggaran';
import { confirmDelete, Toast } from '@/lib/sweetalert';

// ─── Types ────────────────────────────────────────────────────────────────────

type KegiatanOption = { id: number; nama: string; warna: string | null };

type AnggaranItem = {
    id: number;
    jenis: 'pemasukan' | 'pengeluaran';
    sumber_kategori: string;
    estimasi: number;
    realisasi: number | null;
    selisih: number;
};

type Props = {
    kegiatanList: KegiatanOption[];
    selectedKegiatanId: number | null;
    anggaran: AnggaranItem[];
    canManageFull: boolean;
    canManageLogistik: boolean;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function rupiah(value: number | string | null | undefined): string {
    const num = Number(value ?? 0);
    if (isNaN(num)) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(num);
}

function InputError({ message }: { message?: string }) {
    if (!message) return null;
    return <p className="mt-1 text-xs text-red-500">{message}</p>;
}

function JenisBadge({ jenis }: { jenis: 'pemasukan' | 'pengeluaran' }) {
    return jenis === 'pemasukan' ? (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">
            <TrendingUp className="size-3" /> Pemasukan
        </span>
    ) : (
        <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-bold text-red-600 dark:bg-red-950/30 dark:text-red-400">
            <TrendingDown className="size-3" /> Pengeluaran
        </span>
    );
}

// ─── Inline Edit Realisasi ────────────────────────────────────────────────────

function RealisasiCell({
    item,
    teamSlug,
    canEdit,
}: {
    item: AnggaranItem;
    teamSlug: string;
    canEdit: boolean;
}) {
    const [editing, setEditing] = useState(false);
    const [value, setValue] = useState<string>(item.realisasi != null ? String(item.realisasi) : '');
    const [saving, setSaving] = useState(false);

    function simpan() {
        setSaving(true);
        router.patch(
            update.url({ current_team: teamSlug, anggaran: item.id }),
            { realisasi: value === '' ? null : Number(value) },
            {
                preserveScroll: true,
                onSuccess: () => {
                    Toast.fire({
                        icon: 'success',
                        title: 'Realisasi anggaran berhasil diperbarui!',
                    });
                },
                onFinish: () => {
                    setSaving(false);
                    setEditing(false);
                },
            },
        );
    }

    if (!canEdit) {
        return (
            <span className="font-mono-sigap text-xs font-bold text-neutral-800 dark:text-neutral-200">
                {item.realisasi != null ? rupiah(item.realisasi) : <span className="text-neutral-400">—</span>}
            </span>
        );
    }

    if (editing) {
        return (
            <div className="flex items-center gap-1.5">
                <input
                    type="number"
                    min="0"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    className="font-mono-sigap w-32 rounded-xl border border-neutral-200 bg-white px-2.5 py-1 text-xs font-bold text-neutral-800 focus:border-[#4F46E5] focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                    autoFocus
                />
                <button
                    onClick={simpan}
                    disabled={saving}
                    className="rounded-xl bg-[#4F46E5] px-2.5 py-1 text-xs font-bold text-white shadow-xs hover:bg-[#4338CA] disabled:opacity-50"
                >
                    {saving ? '...' : 'Simpan'}
                </button>
                <button
                    onClick={() => setEditing(false)}
                    className="rounded-xl px-2 py-1 text-xs font-semibold text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
                >
                    Batal
                </button>
            </div>
        );
    }

    return (
        <button
            onClick={() => setEditing(true)}
            className="group flex items-center gap-1.5 font-mono-sigap text-xs font-bold text-neutral-800 transition hover:text-[#4F46E5] dark:text-neutral-200 dark:hover:text-[#818CF8]"
            title="Klik untuk ubah realisasi"
        >
            <span>{item.realisasi != null ? rupiah(item.realisasi) : '—'}</span>
            <Pencil className="size-3 text-neutral-400 opacity-0 transition-opacity group-hover:opacity-100" />
        </button>
    );
}

// ─── Form Tambah Anggaran ─────────────────────────────────────────────────────

function FormTambahAnggaran({
    teamSlug,
    kegiatanId,
    canManageFull,
}: {
    teamSlug: string;
    kegiatanId: number;
    canManageFull: boolean;
}) {
    const { data, setData, post, processing, errors, reset } = useForm({
        jenis: 'pengeluaran' as 'pemasukan' | 'pengeluaran',
        sumber_kategori: '',
        estimasi: '',
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post(store.url({ current_team: teamSlug, kegiatan: kegiatanId }), {
            preserveScroll: true,
            onSuccess: () => {
                Toast.fire({
                    icon: 'success',
                    title: 'Pos anggaran berhasil ditambahkan!',
                });
                reset();
            },
        });
    }

    return (
        <form
            onSubmit={submit}
            className="rounded-3xl border border-neutral-200/70 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
        >
            <h2 className="font-display mb-4 text-base font-bold text-neutral-900 dark:text-neutral-100">
                Tambah Pos Anggaran
            </h2>

            <div className="flex flex-wrap items-end gap-3.5">
                {/* Jenis: hanya canManageFull yang boleh memilih pemasukan */}
                <div>
                    <label className="mb-1.5 block text-[11px] font-extrabold uppercase tracking-wider text-neutral-400">
                        Jenis
                    </label>
                    <select
                        value={data.jenis}
                        onChange={(e) => setData('jenis', e.target.value as 'pemasukan' | 'pengeluaran')}
                        disabled={!canManageFull}
                        className="rounded-2xl border border-neutral-200/80 bg-white px-3.5 py-2 text-xs font-bold text-neutral-800 focus:border-[#4F46E5] focus:outline-none disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200"
                    >
                        {canManageFull && <option value="pemasukan">Pemasukan</option>}
                        <option value="pengeluaran">Pengeluaran</option>
                    </select>
                </div>

                {/* Sumber / Kategori */}
                <div className="flex-1 min-w-48">
                    <label className="mb-1.5 block text-[11px] font-extrabold uppercase tracking-wider text-neutral-400">
                        Sumber / Kategori <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        value={data.sumber_kategori}
                        onChange={(e) => setData('sumber_kategori', e.target.value)}
                        placeholder="Contoh: Konsumsi Acara, Kas Organisasi..."
                        className="w-full rounded-2xl border border-neutral-200/80 bg-white px-3.5 py-2 text-xs text-neutral-800 focus:border-[#4F46E5] focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                    />
                    <InputError message={errors.sumber_kategori} />
                </div>

                {/* Estimasi */}
                <div>
                    <label className="mb-1.5 block text-[11px] font-extrabold uppercase tracking-wider text-neutral-400">
                        Estimasi (Rp) <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="number"
                        min="0"
                        value={data.estimasi}
                        onChange={(e) => setData('estimasi', e.target.value)}
                        placeholder="0"
                        className="w-36 rounded-2xl border border-neutral-200/80 bg-white px-3.5 py-2 font-mono-sigap text-xs font-bold text-neutral-800 focus:border-[#4F46E5] focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                    />
                    <InputError message={errors.estimasi} />
                </div>

                <button
                    type="submit"
                    disabled={processing}
                    className="flex items-center gap-1.5 rounded-2xl bg-[#4F46E5] px-5 py-2.5 text-xs font-bold text-white shadow-sm shadow-[#4F46E5]/25 transition hover:bg-[#4338CA] disabled:opacity-50"
                >
                    <Plus className="size-4" />
                    {processing ? 'Menambahkan...' : 'Tambah Pos'}
                </button>
            </div>
        </form>
    );
}

// ─── Summary Cards ────────────────────────────────────────────────────────────

function SummaryCards({ anggaran }: { anggaran: AnggaranItem[] }) {
    const totalEstPemasukan = (anggaran ?? [])
        .filter((a) => a.jenis === 'pemasukan')
        .reduce((s, a) => s + Number(a.estimasi || 0), 0);
    const totalEstPengeluaran = (anggaran ?? [])
        .filter((a) => a.jenis === 'pengeluaran')
        .reduce((s, a) => s + Number(a.estimasi || 0), 0);
    const totalRealPemasukan = (anggaran ?? [])
        .filter((a) => a.jenis === 'pemasukan' && a.realisasi != null)
        .reduce((s, a) => s + Number(a.realisasi || 0), 0);
    const totalRealPengeluaran = (anggaran ?? [])
        .filter((a) => a.jenis === 'pengeluaran' && a.realisasi != null)
        .reduce((s, a) => s + Number(a.realisasi || 0), 0);
    const saldoEst = totalEstPemasukan - totalEstPengeluaran;
    const saldoReal = totalRealPemasukan - totalRealPengeluaran;

    const cards = [
        { label: 'Est. Pemasukan', value: rupiah(totalEstPemasukan), color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50/70 dark:bg-emerald-950/30' },
        { label: 'Est. Pengeluaran', value: rupiah(totalEstPengeluaran), color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50/70 dark:bg-red-950/30' },
        { label: 'Real. Pemasukan', value: rupiah(totalRealPemasukan), color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50/70 dark:bg-emerald-950/30' },
        { label: 'Real. Pengeluaran', value: rupiah(totalRealPengeluaran), color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50/70 dark:bg-red-950/30' },
        {
            label: 'Saldo Estimasi',
            value: rupiah(saldoEst),
            color: saldoEst >= 0 ? 'text-[#4F46E5] dark:text-[#818CF8]' : 'text-red-600',
            bg: 'bg-[#EEF2FF]/70 dark:bg-[#4F46E5]/10',
        },
        {
            label: 'Saldo Realisasi',
            value: rupiah(saldoReal),
            color: saldoReal >= 0 ? 'text-[#4F46E5] dark:text-[#818CF8]' : 'text-red-600',
            bg: 'bg-[#EEF2FF]/70 dark:bg-[#4F46E5]/10',
        },
    ];

    return (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {cards.map((c) => (
                <div
                    key={c.label}
                    className={`rounded-3xl border border-neutral-200/70 p-4 shadow-sm dark:border-neutral-800 ${c.bg}`}
                >
                    <p className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400">{c.label}</p>
                    <p className={`font-mono-sigap mt-1 text-sm font-bold ${c.color}`}>{c.value}</p>
                </div>
            ))}
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AnggaranIndex({
    kegiatanList,
    selectedKegiatanId,
    anggaran,
    canManageFull,
    canManageLogistik,
}: Props) {
    const { url } = usePage();
    const teamSlug = url.split('/')[1];

    const selectedKegiatan = kegiatanList.find((k) => k.id === selectedKegiatanId) ?? null;
    const canEdit = canManageFull || canManageLogistik;

    function pilihKegiatan(id: number) {
        router.get(anggaranIndex.url(teamSlug), { kegiatan_id: id }, { preserveState: false });
    }

    async function hapusAnggaran(id: number) {
        const confirmed = await confirmDelete('Pos Anggaran', 'Yakin ingin menghapus pos anggaran ini?');
        if (!confirmed) return;
        router.delete(destroy.url({ current_team: teamSlug, anggaran: id }), {
            preserveScroll: true,
            onSuccess: () => {
                Toast.fire({
                    icon: 'success',
                    title: 'Pos anggaran berhasil dihapus.',
                });
            },
        });
    }

    return (
        <>
            <Head title="Kelola Anggaran" />

            <div className="flex h-full flex-col gap-6 p-4 sm:p-6 lg:p-8">
                {/* ─── Header ─── */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="font-display text-2xl font-extrabold tracking-tight text-neutral-900 sm:text-3xl dark:text-neutral-100">
                            Kelola Anggaran
                        </h1>
                        <p className="mt-0.5 text-xs font-medium text-neutral-500 dark:text-neutral-400">
                            Transparansi estimasi dan realisasi keuangan kegiatan
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
                        <PiggyBank className="mb-4 size-12 text-neutral-300 dark:text-neutral-700" />
                        <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                            {kegiatanList.length === 0
                                ? 'Kamu belum memiliki akses anggaran untuk kegiatan manapun.'
                                : 'Pilih kegiatan di atas untuk melihat rincian anggaran.'}
                        </p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-6">
                        {/* Summary Cards */}
                        <SummaryCards anggaran={anggaran} />

                        {/* Form Tambah Pos Anggaran */}
                        {canEdit && (
                            <FormTambahAnggaran
                                teamSlug={teamSlug}
                                kegiatanId={selectedKegiatan.id}
                                canManageFull={canManageFull}
                            />
                        )}

                        {/* Tabel Anggaran */}
                        <div className="overflow-hidden rounded-3xl border border-neutral-200/70 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                            <div className="border-b border-neutral-100 px-6 py-4 dark:border-neutral-800">
                                <h3 className="font-display text-base font-bold text-neutral-900 dark:text-neutral-100">
                                    Rincian Pos Anggaran ({anggaran.length})
                                </h3>
                            </div>

                            {anggaran.length === 0 ? (
                                <p className="px-6 py-8 text-center text-xs italic text-neutral-400">
                                    Belum ada data anggaran untuk kegiatan ini.
                                </p>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs">
                                        <thead>
                                            <tr className="border-b border-neutral-100 bg-neutral-50/60 text-[11px] font-extrabold uppercase tracking-wider text-neutral-400 dark:border-neutral-800 dark:bg-neutral-800/40">
                                                <th className="px-6 py-3.5">Jenis</th>
                                                <th className="px-6 py-3.5">Sumber / Kategori</th>
                                                <th className="px-6 py-3.5">Estimasi</th>
                                                <th className="px-6 py-3.5">Realisasi</th>
                                                <th className="px-6 py-3.5">Selisih</th>
                                                {canEdit && <th className="px-6 py-3.5 text-right">Aksi</th>}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                            {anggaran.map((item) => {
                                                const selisihPositif = item.selisih >= 0;

                                                return (
                                                    <tr
                                                        key={item.id}
                                                        className="transition hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30"
                                                    >
                                                        <td className="px-6 py-3.5">
                                                            <JenisBadge jenis={item.jenis} />
                                                        </td>
                                                        <td className="px-6 py-3.5 font-bold text-neutral-800 dark:text-neutral-200">
                                                            {item.sumber_kategori}
                                                        </td>
                                                        <td className="font-mono-sigap px-6 py-3.5 font-semibold text-neutral-700 dark:text-neutral-300">
                                                            {rupiah(item.estimasi)}
                                                        </td>
                                                        <td className="px-6 py-3.5">
                                                            <RealisasiCell
                                                                item={item}
                                                                teamSlug={teamSlug}
                                                                canEdit={canEdit}
                                                            />
                                                        </td>
                                                        <td
                                                            className={`font-mono-sigap px-6 py-3.5 font-bold ${
                                                                selisihPositif
                                                                    ? 'text-emerald-600 dark:text-emerald-400'
                                                                    : 'text-red-600 dark:text-red-400'
                                                            }`}
                                                        >
                                                            {selisihPositif ? '+' : ''}
                                                            {rupiah(item.selisih)}
                                                        </td>
                                                        {canEdit && (
                                                            <td className="px-6 py-3.5 text-right">
                                                                <button
                                                                    onClick={() => hapusAnggaran(item.id)}
                                                                    className="rounded-xl p-1.5 text-neutral-400 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30"
                                                                    title="Hapus baris"
                                                                >
                                                                    <Trash2 className="size-4" />
                                                                </button>
                                                            </td>
                                                        )}
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
