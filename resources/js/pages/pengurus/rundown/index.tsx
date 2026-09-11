import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    ChevronDown,
    ClipboardList,
    Plus,
    Trash2,
    Calendar,
    Clock,
    MapPin,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { index as rundownIndex } from '@/routes/rundown';
import { upsert } from '@/routes/sesi/rundown';
import { confirmDelete, showSuccess, Toast } from '@/lib/sweetalert';
import { kegiatanBreadcrumbs} from '@/lib/breadcrumbs';
import { index as panitiaIndex } from '@/routes/panitia';
import ReadOnlyBanner from '@/components/read-only-banner';
import AccessRestrictionCard from '@/components/access-restriction-card';

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
    canManage?: boolean;
    isReadOnly?: boolean;
};

type RundownRow = { waktu: string; uraian_acara: string };

export default function RundownIndex({
    kegiatanList,
    selectedKegiatanId,
    selectedSesiId,
    rundown,
    canManage = true,
    isReadOnly = false,
}: Props) {
    const { url } = usePage();
    const teamSlug = url.split('/')[1];

    const selectedKegiatan =
        kegiatanList.find((k) => k.id === selectedKegiatanId) ?? null;
    const sesiList: SesiOption[] = selectedKegiatan?.sesi ?? [];
    const selectedSesi = sesiList.find((s) => s.id === selectedSesiId) ?? null;

    const [rows, setRows] = useState<RundownRow[]>(() =>
        rundown.length > 0
            ? rundown.map((r) => ({
                  waktu: r.waktu,
                  uraian_acara: r.uraian_acara,
              }))
            : [],
    );
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        setRows(
            rundown.length > 0
                ? rundown.map((r) => ({
                      waktu: r.waktu,
                      uraian_acara: r.uraian_acara,
                  }))
                : [],
        );
    }, [selectedSesiId, rundown.length, JSON.stringify(rundown)]);

    function pilihKegiatan(id: number) {
        router.get(
            rundownIndex.url(teamSlug),
            { kegiatan_id: id },
            { preserveState: false },
        );
    }

    function pilihSesi(id: number) {
        router.get(
            rundownIndex.url(teamSlug),
            { kegiatan_id: selectedKegiatanId, sesi_id: id },
            { preserveState: false },
        );
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
        const label = row?.uraian_acara
            ? `"${row.uraian_acara}"`
            : `Baris #${index + 1}`;
        const confirmed = await confirmDelete(
            'Item Rundown',
            `Hapus ${label} dari susunan rundown?`,
        );
        if (!confirmed) return;
        setRows((prev) => prev.filter((_, i) => i !== index));
        Toast.fire({
            icon: 'success',
            title: 'Baris agenda berhasil dihapus.',
        });
    }

    function updateBaris(
        index: number,
        field: keyof RundownRow,
        value: string,
    ) {
        setRows((prev) =>
            prev.map((r, i) => (i === index ? { ...r, [field]: value } : r)),
        );
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
                    showSuccess(
                        'Rundown Tersimpan!',
                        'Susunan jadwal rundown acara berhasil disimpan ke sistem.',
                    );
                    router.get(
                        rundownIndex.url(teamSlug),
                        {
                            kegiatan_id: selectedKegiatanId,
                            sesi_id: selectedSesiId,
                        },
                        { preserveState: false, preserveScroll: true },
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
                        <h1 className="font-display text-2xl font-semibold tracking-tight text-[#1E2430] sm:text-3xl dark:text-[#E6ECF5]">
                            Rundown Acara
                        </h1>
                        <p className="mt-0.5 text-xs text-[#727C8E] dark:text-[#8C97A8]">
                            Atur susunan jadwal kegiatan secara presisi per sesi
                        </p>
                    </div>

                    <div className="flex w-full flex-col gap-2.5 sm:w-auto sm:flex-row sm:items-center sm:gap-3">
                        {/* Selector Kegiatan */}
                        {kegiatanList.length > 0 && (
                            <div className="relative w-full min-w-0 sm:w-56">
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

                        {/* Selector Sesi */}
                        {selectedKegiatan && sesiList.length > 0 && (
                            <div className="relative w-full min-w-0 sm:w-64">
                                <select
                                    value={selectedSesiId ?? ''}
                                    onChange={(e) =>
                                        pilihSesi(Number(e.target.value))
                                    }
                                    className="w-full appearance-none rounded-lg border border-[rgba(30,36,48,0.12)] bg-white py-2 pr-9 pl-3.5 text-xs font-semibold text-[#1E2430] outline-none focus:border-[#4A5FD1] dark:border-[rgba(255,255,255,0.12)] dark:bg-[#181E2B] dark:text-[#E6ECF5]"
                                >
                                    <option value="" disabled>
                                        Pilih Sesi
                                    </option>
                                    {sesiList.map((s) => (
                                        <option key={s.id} value={s.id}>
                                            {s.tanggal} •{' '}
                                            {s.waktu_mulai.slice(0, 5)}–
                                            {s.waktu_selesai.slice(0, 5)}
                                            {s.lokasi ? ` (${s.lokasi})` : ''}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown className="pointer-events-none absolute top-2.5 right-3 size-4 text-[#727C8E]" />
                            </div>
                        )}
                    </div>
                </div>

                {/* ─── Mode Pemantauan Banner ─── */}
                {isReadOnly && (
                    <ReadOnlyBanner
                        roleName="Pembina"
                        message="Anda sedang dalam mode pemantauan. Anda dapat memantau susunan rundown kegiatan secara real-time."
                    />
                )}

                {/* ─── Empty States ─── */}
                {kegiatanList.length === 0 && (
                    <AccessRestrictionCard actionType="rundown" />
                )}

                {kegiatanList.length > 0 && !selectedKegiatan && (
                    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-[rgba(30,36,48,0.12)] bg-white py-20 text-center dark:border-[rgba(255,255,255,0.12)] dark:bg-[#181E2B]">
                        <ClipboardList className="mb-3 size-10 text-[#727C8E]/40 dark:text-[#8C97A8]/40" />
                        <p className="text-xs font-medium text-[#727C8E] dark:text-[#8C97A8]">
                            Pilih kegiatan di atas untuk mengelola susunan
                            rundown.
                        </p>
                    </div>
                )}

                {selectedKegiatan && sesiList.length === 0 && (
                    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-[rgba(30,36,48,0.12)] bg-white py-20 text-center dark:border-[rgba(255,255,255,0.12)] dark:bg-[#181E2B]">
                        <Calendar className="mb-3 size-10 text-[#727C8E]/40 dark:text-[#8C97A8]/40" />
                        <p className="text-xs font-medium text-[#727C8E] dark:text-[#8C97A8]">
                            Kegiatan ini belum memiliki jadwal sesi.
                        </p>
                    </div>
                )}

                {selectedKegiatan && sesiList.length > 0 && !selectedSesi && (
                    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-[rgba(30,36,48,0.12)] bg-white py-20 text-center dark:border-[rgba(255,255,255,0.12)] dark:bg-[#181E2B]">
                        <Clock className="mb-3 size-10 text-[#727C8E]/40 dark:text-[#8C97A8]/40" />
                        <p className="text-xs font-medium text-[#727C8E] dark:text-[#8C97A8]">
                            Pilih sesi kegiatan di atas untuk mulai menyusun
                            rundown.
                        </p>
                    </div>
                )}

                {/* ─── Editor Rundown ─── */}
                {selectedSesi && (
                    <div className="overflow-hidden rounded-lg border border-[rgba(30,36,48,0.08)] bg-white shadow-sm dark:border-[rgba(255,255,255,0.08)] dark:bg-[#181E2B]">
                        {/* Sesi info header */}
                        <div className="flex flex-col justify-between gap-3 border-b border-[rgba(30,36,48,0.08)] bg-[#F6F7F9]/50 px-4 py-3.5 sm:flex-row sm:items-center sm:px-5 dark:border-[rgba(255,255,255,0.08)] dark:bg-[#21293A]/30">
                            <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-[#1E2430] sm:gap-4 dark:text-[#E6ECF5]">
                                <span className="font-mono-sigap flex items-center gap-1.5">
                                    <Calendar className="size-3.5 text-[#4A5FD1] dark:text-[#8FA0FA]" />
                                    {selectedSesi.tanggal}
                                </span>
                                <span className="font-mono-sigap flex items-center gap-1.5">
                                    <Clock className="size-3.5 text-[#4A5FD1] dark:text-[#8FA0FA]" />
                                    <span>
                                        {selectedSesi.waktu_mulai.slice(0, 5)} –{' '}
                                        {selectedSesi.waktu_selesai.slice(0, 5)}{' '}
                                        WIB
                                    </span>
                                </span>
                                {selectedSesi.lokasi && (
                                    <span className="flex items-center gap-1.5">
                                        <MapPin className="size-3.5 text-[#4A5FD1] dark:text-[#8FA0FA]" />
                                        {selectedSesi.lokasi}
                                    </span>
                                )}
                            </div>
                            <span className="font-mono-sigap self-start rounded-md bg-[#4A5FD1]/12 px-2.5 py-0.5 text-[11px] font-medium text-[#4A5FD1] sm:self-auto dark:bg-[#4A5FD1]/20 dark:text-[#8FA0FA]">
                                {rows.length} Item Agenda
                            </span>
                        </div>

                        <div className="p-4 sm:p-5">
                            {/* Header kolom Desktop */}
                            <div className="mb-2 hidden gap-2 px-1 text-[11px] font-semibold tracking-wider text-[#727C8E] uppercase sm:grid sm:grid-cols-[2.5rem_7.5rem_1fr_2.5rem] dark:text-[#8C97A8]">
                                <span>#</span>
                                <span>Waktu</span>
                                <span>Uraian Acara</span>
                                <span className="text-right">Aksi</span>
                            </div>

                            {rows.length === 0 && (
                                <p className="mb-4 text-xs text-[#727C8E]/70 italic dark:text-[#8C97A8]/70">
                                    Belum ada baris rundown. Klik &ldquo;Tambah
                                    Baris Agenda&rdquo; di bawah untuk memulai.
                                </p>
                            )}

                            {/* Responsive Rows Container */}
                            <div className="flex flex-col gap-2.5 sm:gap-2">
                                {rows.map((row, i) => (
                                    <div
                                        key={i}
                                        className="rounded-lg border border-[rgba(30,36,48,0.08)] bg-[#F6F7F9]/50 p-3 sm:grid sm:grid-cols-[2.5rem_7.5rem_1fr_2.5rem] sm:items-center sm:gap-2 sm:border-0 sm:bg-transparent sm:p-0 dark:border-[rgba(255,255,255,0.08)] dark:bg-[#21293A]/30"
                                    >
                                        {/* Mobile Top Row: Index + Time + Delete Button (In Desktop it becomes regular inline grid cells) */}
                                        <div className="flex items-center justify-between gap-2 sm:contents">
                                            <div className="flex items-center gap-2 sm:contents">
                                                <span className="font-mono-sigap flex size-6 shrink-0 items-center justify-center rounded-full bg-[#4A5FD1]/10 text-xs font-semibold text-[#4A5FD1] sm:size-auto sm:bg-transparent sm:text-[#727C8E] dark:bg-[#4A5FD1]/20 dark:text-[#8FA0FA] sm:dark:text-[#8C97A8]">
                                                    {i + 1}
                                                </span>
                                                <input
                                                    type="time"
                                                    value={row.waktu}
                                                    disabled={!canManage}
                                                    onChange={(e) =>
                                                        updateBaris(
                                                            i,
                                                            'waktu',
                                                            e.target.value,
                                                        )
                                                    }
                                                    className="font-mono-sigap w-32 rounded-md border border-[rgba(30,36,48,0.12)] bg-white px-2.5 py-1.5 text-xs font-semibold text-[#1E2430] outline-none focus:border-[#4A5FD1] disabled:opacity-60 sm:w-full dark:border-[rgba(255,255,255,0.12)] dark:bg-[#181E2B] dark:text-[#E6ECF5]"
                                                />
                                            </div>

                                            {canManage && (
                                                <div className="sm:hidden">
                                                    <button
                                                        type="button"
                                                        onClick={() => hapusBaris(i)}
                                                        title="Hapus baris"
                                                        className="flex items-center justify-center rounded-md p-1.5 text-[#727C8E] transition hover:bg-[#C4514A]/10 hover:text-[#C4514A]"
                                                    >
                                                        <Trash2 className="size-3.5" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        {/* Uraian Acara input */}
                                        <div className="mt-2 min-w-0 sm:mt-0">
                                            <input
                                                type="text"
                                                value={row.uraian_acara}
                                                disabled={!canManage}
                                                onChange={(e) =>
                                                    updateBaris(
                                                        i,
                                                        'uraian_acara',
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder="Tulis detail uraian acara..."
                                                className="w-full rounded-md border border-[rgba(30,36,48,0.12)] bg-white px-3 py-1.5 text-xs text-[#1E2430] outline-none focus:border-[#4A5FD1] disabled:opacity-60 dark:border-[rgba(255,255,255,0.12)] dark:bg-[#181E2B] dark:text-[#E6ECF5]"
                                            />
                                        </div>

                                        {/* Desktop Delete button */}
                                        {canManage && (
                                            <div className="hidden sm:flex sm:justify-end">
                                                <button
                                                    type="button"
                                                    onClick={() => hapusBaris(i)}
                                                    title="Hapus baris"
                                                    className="flex items-center justify-center rounded-md p-1.5 text-[#727C8E] transition hover:bg-[#C4514A]/10 hover:text-[#C4514A]"
                                                >
                                                    <Trash2 className="size-3.5" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Tombol Tambah Baris */}
                            {canManage && (
                                <button
                                    type="button"
                                    onClick={tambahBaris}
                                    className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-md border border-dashed border-[rgba(30,36,48,0.12)] px-3.5 py-2 text-xs font-semibold text-[#727C8E] transition hover:border-[#4A5FD1] hover:text-[#4A5FD1] sm:w-auto sm:justify-start sm:py-1.5 dark:border-[rgba(255,255,255,0.12)] dark:text-[#8C97A8] dark:hover:border-[#4A5FD1] dark:hover:text-[#8FA0FA]"
                                >
                                    <Plus className="size-3.5" />
                                    <span>Tambah Baris Agenda</span>
                                </button>
                            )}
                        </div>

                        {canManage && (
                            <div className="flex flex-col items-center justify-end border-t border-[rgba(30,36,48,0.08)] p-4 sm:flex-row sm:px-5 sm:py-3.5 dark:border-[rgba(255,255,255,0.08)]">
                                <button
                                    type="button"
                                    onClick={simpan}
                                    disabled={saving}
                                    className="w-full rounded-lg bg-[#4A5FD1] px-5 py-2.5 text-xs font-semibold text-white shadow-xs transition hover:bg-[#3B4DB8] disabled:opacity-50 sm:w-auto sm:py-2"
                                >
                                    {saving ? 'Menyimpan...' : 'Simpan Rundown'}
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </>
    );
}

RundownIndex.layout = (
    page: Props & {
        currentTeam?: { slug: string } | null;
    },
) => {
    const teamSlug = page.currentTeam?.slug ?? '';
    const selectedKegiatan = page.kegiatanList.find(
        (k) => k.id === page.selectedKegiatanId,
    );
    const selectedSesi = selectedKegiatan?.sesi.find(
        (s) => s.id === page.selectedSesiId,
    );

    return {
        breadcrumbs: kegiatanBreadcrumbs(
            'Kegiatan',
            teamSlug ? rundownIndex.url(teamSlug) : '/kegiatan',
            {
                title: 'Rundown Acara',
                href: teamSlug ? panitiaIndex.url(teamSlug) : '/rundown',
            },
            selectedKegiatan && { title: selectedKegiatan.nama, href: '' },
            selectedSesi && {
                title: `${selectedSesi.tanggal} • ${selectedSesi.waktu_mulai.slice(0, 5)}`,
                href: '',
            },
        ),
    };
};
