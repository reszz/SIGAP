import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import {
    ChevronDown,
    Pencil,
    PiggyBank,
    Plus,
    Trash2,
    TrendingDown,
    TrendingUp,
    Wallet,
} from 'lucide-react';
import { useState } from 'react';
import {
    index as anggaranIndex,
    store,
    update,
    destroy,
} from '@/routes/anggaran';
import { confirmDelete, Toast } from '@/lib/sweetalert';
import {kegiatanBreadcrumbs } from '@/lib/breadcrumbs';
import { index as panitiaIndex } from '@/routes/panitia';
import ReadOnlyBanner from '@/components/read-only-banner';
import AccessRestrictionCard from '@/components/access-restriction-card';

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
    canInputRealisasi: boolean;
    isReadOnly?: boolean;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function rupiah(num: number): string {
    return 'Rp ' + Number(num).toLocaleString('id-ID');
}

function InputError({ message }: { message?: string }) {
    if (!message) return null;
    return <p className="mt-1 text-xs font-medium text-[#C4514A]">{message}</p>;
}

function JenisBadge({ jenis }: { jenis: 'pemasukan' | 'pengeluaran' }) {
    if (jenis === 'pemasukan') {
        return (
            <span className="inline-flex items-center gap-1 rounded-md bg-[#2E9E82]/12 px-2 py-0.5 text-xs font-semibold text-[#2E9E82] dark:bg-[#2E9E82]/20 dark:text-[#34B394]">
                <TrendingUp className="size-3" /> Pemasukan
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1 rounded-md bg-[#C4514A]/12 px-2 py-0.5 text-xs font-semibold text-[#C4514A] dark:bg-[#C4514A]/20 dark:text-[#D9615A]">
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
    const [value, setValue] = useState<string>(
        item.realisasi != null ? String(item.realisasi) : '',
    );
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
            <span className="font-mono-sigap text-xs font-semibold text-[#1E2430] dark:text-[#E6ECF5]">
                {item.realisasi != null ? (
                    rupiah(item.realisasi)
                ) : (
                    <span className="text-[#727C8E]/60">—</span>
                )}
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
                    className="font-mono-sigap w-28 rounded-md border border-[rgba(30,36,48,0.12)] bg-white px-2.5 py-1 text-xs font-semibold text-[#1E2430] outline-none focus:border-[#4A5FD1] sm:w-32 dark:border-[rgba(255,255,255,0.12)] dark:bg-[#181E2B] dark:text-[#E6ECF5]"
                    autoFocus
                />
                <button
                    onClick={simpan}
                    disabled={saving}
                    className="rounded-md bg-[#4A5FD1] px-2.5 py-1 text-xs font-semibold text-white transition hover:bg-[#3B4DB8] disabled:opacity-50"
                >
                    {saving ? '...' : 'Simpan'}
                </button>
                <button
                    onClick={() => setEditing(false)}
                    className="rounded-md px-2 py-1 text-xs font-medium text-[#727C8E] hover:text-[#1E2430] dark:text-[#8C97A8]"
                >
                    Batal
                </button>
            </div>
        );
    }

    return (
        <button
            onClick={() => setEditing(true)}
            className="group font-mono-sigap flex items-center gap-1.5 text-xs font-semibold text-[#1E2430] transition hover:text-[#4A5FD1] dark:text-[#E6ECF5] dark:hover:text-[#8FA0FA]"
            title="Klik untuk ubah realisasi"
        >
            <span>{item.realisasi != null ? rupiah(item.realisasi) : '—'}</span>
            <Pencil className="size-3 text-[#727C8E] opacity-70 transition-opacity group-hover:opacity-100 sm:opacity-0" />
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
            className="rounded-lg border border-[rgba(30,36,48,0.08)] bg-white p-4 shadow-xs sm:p-5 dark:border-[rgba(255,255,255,0.08)] dark:bg-[#181E2B]"
        >
            <h2 className="mb-3 font-display text-sm font-semibold text-[#1E2430] dark:text-[#E6ECF5]">
                Tambah Pos Anggaran
            </h2>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                {/* Jenis */}
                <div className="w-full sm:w-auto">
                    <label className="mb-1.5 block text-[11px] font-semibold tracking-wider text-[#727C8E] uppercase dark:text-[#8C97A8]">
                        Jenis
                    </label>
                    <select
                        value={data.jenis}
                        onChange={(e) =>
                            setData(
                                'jenis',
                                e.target.value as 'pemasukan' | 'pengeluaran',
                            )
                        }
                        disabled={!canManageFull}
                        className="w-full rounded-md border border-[rgba(30,36,48,0.12)] bg-white px-3 py-2 text-xs font-semibold text-[#1E2430] outline-none focus:border-[#4A5FD1] disabled:opacity-50 sm:w-auto sm:py-1.5 dark:border-[rgba(255,255,255,0.12)] dark:bg-[#181E2B] dark:text-[#E6ECF5]"
                    >
                        {canManageFull && (
                            <option value="pemasukan">Pemasukan</option>
                        )}
                        <option value="pengeluaran">Pengeluaran</option>
                    </select>
                </div>

                {/* Sumber / Kategori */}
                <div className="w-full min-w-0 flex-1 sm:min-w-48">
                    <label className="mb-1.5 block text-[11px] font-semibold tracking-wider text-[#727C8E] uppercase dark:text-[#8C97A8]">
                        Sumber / Kategori{' '}
                        <span className="text-[#C4514A]">*</span>
                    </label>
                    <input
                        type="text"
                        value={data.sumber_kategori}
                        onChange={(e) =>
                            setData('sumber_kategori', e.target.value)
                        }
                        placeholder="Contoh: Konsumsi Acara, Kas Organisasi..."
                        className="w-full rounded-md border border-[rgba(30,36,48,0.12)] bg-white px-3 py-2 text-xs text-[#1E2430] outline-none focus:border-[#4A5FD1] sm:py-1.5 dark:border-[rgba(255,255,255,0.12)] dark:bg-[#181E2B] dark:text-[#E6ECF5]"
                    />
                    <InputError message={errors.sumber_kategori} />
                </div>

                {/* Estimasi */}
                <div className="w-full sm:w-36">
                    <label className="mb-1.5 block text-[11px] font-semibold tracking-wider text-[#727C8E] uppercase dark:text-[#8C97A8]">
                        Estimasi (Rp) <span className="text-[#C4514A]">*</span>
                    </label>
                    <input
                        type="number"
                        min="0"
                        value={data.estimasi}
                        onChange={(e) => setData('estimasi', e.target.value)}
                        placeholder="0"
                        className="font-mono-sigap w-full rounded-md border border-[rgba(30,36,48,0.12)] bg-white px-3 py-2 text-xs font-semibold text-[#1E2430] outline-none focus:border-[#4A5FD1] sm:py-1.5 dark:border-[rgba(255,255,255,0.12)] dark:bg-[#181E2B] dark:text-[#E6ECF5]"
                    />
                    <InputError message={errors.estimasi} />
                </div>

                <button
                    type="submit"
                    disabled={processing}
                    className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-[#4A5FD1] px-4 py-2.5 text-xs font-semibold text-white shadow-xs transition hover:bg-[#3B4DB8] disabled:opacity-50 sm:w-auto sm:py-2"
                >
                    <Plus className="size-4" />
                    <span>{processing ? 'Menambahkan...' : 'Tambah Pos'}</span>
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
        {
            label: 'Est. Pemasukan',
            value: rupiah(totalEstPemasukan),
            color: 'text-[#2E9E82] dark:text-[#34B394]',
            bg: 'bg-[#2E9E82]/10 dark:bg-[#2E9E82]/20',
        },
        {
            label: 'Est. Pengeluaran',
            value: rupiah(totalEstPengeluaran),
            color: 'text-[#C4514A] dark:text-[#D9615A]',
            bg: 'bg-[#C4514A]/10 dark:bg-[#C4514A]/20',
        },
        {
            label: 'Real. Pemasukan',
            value: rupiah(totalRealPemasukan),
            color: 'text-[#2E9E82] dark:text-[#34B394]',
            bg: 'bg-[#2E9E82]/10 dark:bg-[#2E9E82]/20',
        },
        {
            label: 'Real. Pengeluaran',
            value: rupiah(totalRealPengeluaran),
            color: 'text-[#C4514A] dark:text-[#D9615A]',
            bg: 'bg-[#C4514A]/10 dark:bg-[#C4514A]/20',
        },
        {
            label: 'Saldo Estimasi',
            value: rupiah(saldoEst),
            color:
                saldoEst >= 0
                    ? 'text-[#4A5FD1] dark:text-[#8FA0FA]'
                    : 'text-[#C4514A]',
            bg: 'bg-[#4A5FD1]/10 dark:bg-[#4A5FD1]/20',
        },
        {
            label: 'Saldo Realisasi',
            value: rupiah(saldoReal),
            color:
                saldoReal >= 0
                    ? 'text-[#4A5FD1] dark:text-[#8FA0FA]'
                    : 'text-[#C4514A]',
            bg: 'bg-[#4A5FD1]/10 dark:bg-[#4A5FD1]/20',
        },
    ];

    return (
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 lg:grid-cols-6">
            {cards.map((c) => (
                <div
                    key={c.label}
                    className={`rounded-lg border border-[rgba(30,36,48,0.08)] p-3 shadow-xs sm:p-3.5 dark:border-[rgba(255,255,255,0.08)] ${c.bg}`}
                >
                    <p className="text-[10px] font-medium text-[#727C8E] sm:text-[11px] dark:text-[#8C97A8]">
                        {c.label}
                    </p>
                    <p
                        className={`font-mono-sigap mt-0.5 text-xs font-semibold sm:mt-1 sm:text-xs ${c.color}`}
                    >
                        {c.value}
                    </p>
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
    canInputRealisasi,
    isReadOnly,
}: Props) {
    const { url } = usePage();
    const teamSlug = url.split('/')[1];

    const selectedKegiatan =
        kegiatanList.find((k) => k.id === selectedKegiatanId) ?? null;
    const canEdit = !isReadOnly && (canManageFull || canInputRealisasi);

    function pilihKegiatan(id: number) {
        router.get(
            anggaranIndex.url(teamSlug),
            { kegiatan_id: id },
            { preserveState: false },
        );
    }

    async function hapusAnggaran(id: number) {
        const item = anggaran.find((a) => a.id === id);
        const label = item ? `"${item.sumber_kategori}"` : 'pos anggaran ini';
        const confirmed = await confirmDelete(
            'Pos Anggaran',
            `Hapus pos ${label}?`,
        );
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
            <Head title="Kelola Anggaran Kegiatan" />

            <div className="flex h-full flex-col gap-6 p-4 sm:p-6 lg:p-8">
                {isReadOnly && (
                    <ReadOnlyBanner
                        roleName="Pembina"
                        message="Anda sedang dalam mode pemantauan anggaran. Rincian pemasukan dan pengeluaran ditampilkan secara transparan tanpa akses penambahan atau pengubahan."
                    />
                )}

                {/* ─── Header ─── */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="font-display text-2xl font-semibold tracking-tight text-[#1E2430] sm:text-3xl dark:text-[#E6ECF5]">
                            Kelola Anggaran
                        </h1>
                        <p className="mt-0.5 text-xs text-[#727C8E] dark:text-[#8C97A8]">
                            Transparansi estimasi dan realisasi keuangan
                            kegiatan
                        </p>
                    </div>

                    {kegiatanList.length > 0 && (
                        <div className="relative w-full min-w-0 sm:w-64">
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
                    <AccessRestrictionCard actionType="anggaran" />
                ) : !selectedKegiatan ? (
                    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-[rgba(30,36,48,0.12)] bg-white py-20 text-center dark:border-[rgba(255,255,255,0.12)] dark:bg-[#181E2B]">
                        <PiggyBank className="mb-3 size-10 text-[#727C8E]/40 dark:text-[#8C97A8]/40" />
                        <p className="text-xs font-medium text-[#727C8E] dark:text-[#8C97A8]">
                            Pilih kegiatan di atas untuk melihat rincian anggaran.
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

                        {/* Tabel / Card Anggaran */}
                        <div className="overflow-hidden rounded-lg border border-[rgba(30,36,48,0.08)] bg-white shadow-xs dark:border-[rgba(255,255,255,0.08)] dark:bg-[#181E2B]">
                            <div className="border-b border-[rgba(30,36,48,0.08)] px-4 py-3.5 sm:px-5 dark:border-[rgba(255,255,255,0.08)]">
                                <h3 className="font-display text-sm font-semibold text-[#1E2430] dark:text-[#E6ECF5]">
                                    Rincian Pos Anggaran ({anggaran.length})
                                </h3>
                            </div>

                            {anggaran.length === 0 ? (
                                <p className="px-5 py-8 text-center text-xs text-[#727C8E]/70 italic dark:text-[#8C97A8]/70">
                                    Belum ada data anggaran untuk kegiatan ini.
                                </p>
                            ) : (
                                <>
                                    {/* ── Mobile Card-per-baris View (< 640px) ── */}
                                    <div className="flex flex-col gap-2.5 divide-y divide-[rgba(30,36,48,0.06)] p-3 sm:hidden dark:divide-[rgba(255,255,255,0.06)]">
                                        {anggaran.map((item) => {
                                            const selisihPositif =
                                                item.selisih >= 0;

                                            return (
                                                <div
                                                    key={item.id}
                                                    className="flex flex-col gap-2.5 rounded-lg border border-[rgba(30,36,48,0.08)] bg-[#F6F7F9]/40 p-3.5 dark:border-[rgba(255,255,255,0.08)] dark:bg-[#21293A]/30"
                                                >
                                                    <div className="flex items-start justify-between gap-2">
                                                        <div className="flex items-center gap-2">
                                                            <JenisBadge
                                                                jenis={
                                                                    item.jenis
                                                                }
                                                            />
                                                            <span className="text-xs font-semibold break-words text-[#1E2430] dark:text-[#E6ECF5]">
                                                                {
                                                                    item.sumber_kategori
                                                                }
                                                            </span>
                                                        </div>
                                                        {canEdit && (
                                                            <button
                                                                onClick={() =>
                                                                    hapusAnggaran(
                                                                        item.id,
                                                                    )
                                                                }
                                                                className="rounded-md p-1 text-[#727C8E] hover:bg-[#C4514A]/10 hover:text-[#C4514A]"
                                                                title="Hapus pos"
                                                            >
                                                                <Trash2 className="size-3.5" />
                                                            </button>
                                                        )}
                                                    </div>

                                                    <div className="grid grid-cols-3 gap-2 border-t border-[rgba(30,36,48,0.06)] pt-2 text-xs dark:border-[rgba(255,255,255,0.06)]">
                                                        <div>
                                                            <p className="text-[10px] text-[#727C8E] dark:text-[#8C97A8]">
                                                                Estimasi
                                                            </p>
                                                            <p className="font-mono-sigap mt-0.5 text-[11px] font-semibold text-[#1E2430] dark:text-[#E6ECF5]">
                                                                {rupiah(
                                                                    item.estimasi,
                                                                )}
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] text-[#727C8E] dark:text-[#8C97A8]">
                                                                Realisasi
                                                            </p>
                                                            <div className="mt-0.5">
                                                                <RealisasiCell
                                                                    item={item}
                                                                    teamSlug={
                                                                        teamSlug
                                                                    }
                                                                    canEdit={
                                                                        canEdit
                                                                    }
                                                                />
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] text-[#727C8E] dark:text-[#8C97A8]">
                                                                Selisih
                                                            </p>
                                                            <p
                                                                className={`font-mono-sigap mt-0.5 text-[11px] font-semibold ${selisihPositif ? 'text-[#2E9E82] dark:text-[#34B394]' : 'text-[#C4514A] dark:text-[#D9615A]'}`}
                                                            >
                                                                {selisihPositif
                                                                    ? '+'
                                                                    : ''}
                                                                {rupiah(
                                                                    item.selisih,
                                                                )}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* ── Desktop Tabular View (≥ 640px) ── */}
                                    <div className="hidden overflow-x-auto sm:block">
                                        <table className="w-full text-left text-xs">
                                            <thead>
                                                <tr className="border-b border-[rgba(30,36,48,0.08)] bg-[#F6F7F9]/60 text-[11px] font-semibold tracking-wider text-[#727C8E] uppercase dark:border-[rgba(255,255,255,0.08)] dark:bg-[#21293A]/40 dark:text-[#8C97A8]">
                                                    <th className="px-5 py-3">
                                                        Jenis
                                                    </th>
                                                    <th className="px-5 py-3">
                                                        Sumber / Kategori
                                                    </th>
                                                    <th className="px-5 py-3">
                                                        Estimasi
                                                    </th>
                                                    <th className="px-5 py-3">
                                                        Realisasi
                                                    </th>
                                                    <th className="px-5 py-3">
                                                        Selisih
                                                    </th>
                                                    {canEdit && (
                                                        <th className="px-5 py-3 text-right">
                                                            Aksi
                                                        </th>
                                                    )}
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-[rgba(30,36,48,0.06)] dark:divide-[rgba(255,255,255,0.06)]">
                                                {anggaran.map((item) => {
                                                    const selisihPositif =
                                                        item.selisih >= 0;

                                                    return (
                                                        <tr
                                                            key={item.id}
                                                            className="transition hover:bg-[#F6F7F9]/50 dark:hover:bg-[#21293A]/30"
                                                        >
                                                            <td className="px-5 py-3">
                                                                <JenisBadge
                                                                    jenis={
                                                                        item.jenis
                                                                    }
                                                                />
                                                            </td>
                                                            <td className="px-5 py-3 font-semibold text-[#1E2430] dark:text-[#E6ECF5]">
                                                                {
                                                                    item.sumber_kategori
                                                                }
                                                            </td>
                                                            <td className="font-mono-sigap px-5 py-3 font-medium text-[#727C8E] dark:text-[#8C97A8]">
                                                                {rupiah(
                                                                    item.estimasi,
                                                                )}
                                                            </td>
                                                            <td className="px-5 py-3">
                                                                <RealisasiCell
                                                                    item={item}
                                                                    teamSlug={
                                                                        teamSlug
                                                                    }
                                                                    canEdit={
                                                                        canEdit
                                                                    }
                                                                />
                                                            </td>
                                                            <td
                                                                className={`font-mono-sigap px-5 py-3 font-semibold ${
                                                                    selisihPositif
                                                                        ? 'text-[#2E9E82] dark:text-[#34B394]'
                                                                        : 'text-[#C4514A] dark:text-[#D9615A]'
                                                                }`}
                                                            >
                                                                {selisihPositif
                                                                    ? '+'
                                                                    : ''}
                                                                {rupiah(
                                                                    item.selisih,
                                                                )}
                                                            </td>
                                                            {canEdit && (
                                                                <td className="px-5 py-3 text-right">
                                                                    <button
                                                                        onClick={() =>
                                                                            hapusAnggaran(
                                                                                item.id,
                                                                            )
                                                                        }
                                                                        className="rounded-md p-1.5 text-[#727C8E] transition hover:bg-[#C4514A]/10 hover:text-[#C4514A]"
                                                                        title="Hapus baris"
                                                                    >
                                                                        <Trash2 className="size-3.5" />
                                                                    </button>
                                                                </td>
                                                            )}
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}

AnggaranIndex.layout = (
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
            teamSlug ? anggaranIndex.url(teamSlug) : '/kegiatan',
            {
                title: 'Kelola Anggaran',
                href: teamSlug ? panitiaIndex.url(teamSlug) : '/anggaran',
            },
            selectedKegiatan && { title: selectedKegiatan.nama, href: '' },
        ),
    };
};
