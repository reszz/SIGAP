import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    ChevronDown,
    Users,
    Plus,
    Trash2,
    X,
    UserCheck,
    AlertCircle,
    ClipboardList,
    CheckCircle2,
    Clock,
    Circle,
    Star,
} from 'lucide-react';

import { useState } from 'react';
import { confirmDelete, showSuccess, Toast } from '@/lib/sweetalert';
import divisi from '@/routes/divisi';
import { index as panitiaIndex } from '@/routes/panitia';
import tugas from '@/routes/tugas';
import { kegiatanBreadcrumbs } from '@/lib/breadcrumbs';
import ReadOnlyBanner from '@/components/read-only-banner';
import AccessRestrictionCard from '@/components/access-restriction-card';

// ─── Types ────────────────────────────────────────────────────────────────────

type KegiatanOption = { id: number; nama: string; warna: string | null };
type AnggotaTeamItem = { id: number; name: string };

type JabatanKepanitiaan =
    | 'ketua_pelaksana'
    | 'bendahara'
    | 'sekretaris'
    | 'div_acara'
    | 'div_humas'
    | 'div_pdd'
    | 'div_logistik';

type JabatanDivisi = 'div_acara' | 'div_humas' | 'div_pdd' | 'div_logistik';

type KepanitiaanItem = {
    id: number;
    jabatan: JabatanKepanitiaan;
    user_id: number;
    is_koordinator: boolean;
    user: { id: number; name: string } | null;
};

type TugasItem = {
    id: number;
    jabatan: JabatanDivisi;
    deskripsi_tugas: string;
    status: 'belum' | 'sedang' | 'selesai';
    prioritas: 'rendah' | 'sedang' | 'tinggi';
    deadline: string | null;
    pic_user_id: number;
    pic: { id: number; name: string } | null;
};

type Props = {
    kegiatanList: KegiatanOption[];
    selectedKegiatanId: number | null;
    kepanitiaan: KepanitiaanItem[];
    tugas: TugasItem[];
    anggotaTeam: AnggotaTeamItem[];
    canManageKepanitiaan: boolean;
    jabatanUser: string[];
    /** Jabatan values (e.g. 'div_acara') where the current user is koordinator */
    koordinatorDivisi: string[];
    isReadOnly?: boolean;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const DIVISI_LIST: { key: JabatanDivisi; label: string; color: string }[] = [
    {
        key: 'div_acara',
        label: 'Divisi Acara',
        color: 'bg-[#4A5FD1]/12 text-[#4A5FD1] dark:bg-[#4A5FD1]/20 dark:text-[#8FA0FA]',
    },
    {
        key: 'div_humas',
        label: 'Divisi Humas',
        color: 'bg-[#727C8E]/12 text-[#727C8E] dark:bg-[#727C8E]/20 dark:text-[#8C97A8]',
    },
    {
        key: 'div_pdd',
        label: 'Divisi PDD',
        color: 'bg-[#B8862E]/12 text-[#B8862E] dark:bg-[#B8862E]/20 dark:text-[#D4A142]',
    },
    {
        key: 'div_logistik',
        label: 'Divisi Logistik',
        color: 'bg-[#2E9E82]/12 text-[#2E9E82] dark:bg-[#2E9E82]/20 dark:text-[#34B394]',
    },
];

const JABATAN_INTI: {
    key: 'ketua_pelaksana' | 'bendahara' | 'sekretaris';
    label: string;
}[] = [
    { key: 'ketua_pelaksana', label: 'Ketua Pelaksana' },
    { key: 'bendahara', label: 'Bendahara' },
    { key: 'sekretaris', label: 'Sekretaris' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: TugasItem['status'] }) {
    if (status === 'selesai') {
        return (
            <span className="inline-flex items-center gap-1 rounded-md bg-[#2E9E82]/12 px-2 py-0.5 text-xs font-medium text-[#2E9E82] dark:bg-[#2E9E82]/20 dark:text-[#34B394]">
                <CheckCircle2 className="size-3 text-[#2E9E82]" /> Selesai
            </span>
        );
    }
    if (status === 'sedang') {
        return (
            <span className="inline-flex items-center gap-1 rounded-md bg-[#4A5FD1]/12 px-2 py-0.5 text-xs font-medium text-[#4A5FD1] dark:bg-[#4A5FD1]/20 dark:text-[#8FA0FA]">
                <Clock className="size-3" /> Sedang
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1 rounded-md bg-[#727C8E]/12 px-2 py-0.5 text-xs font-medium text-[#727C8E] dark:bg-[#727C8E]/20 dark:text-[#8C97A8]">
            <Circle className="size-3" /> Belum
        </span>
    );
}

function PrioritasBadge({ prioritas }: { prioritas: TugasItem['prioritas'] }) {
    if (prioritas === 'tinggi') {
        return (
            <span className="rounded-md bg-[#C4514A]/12 px-2 py-0.5 text-xs font-medium text-[#C4514A] dark:bg-[#C4514A]/20 dark:text-[#D9615A]">
                Tinggi
            </span>
        );
    }
    if (prioritas === 'sedang') {
        return (
            <span className="rounded-md bg-[#B8862E]/12 px-2 py-0.5 text-xs font-medium text-[#B8862E] dark:bg-[#B8862E]/20 dark:text-[#D4A142]">
                Sedang
            </span>
        );
    }
    return (
        <span className="rounded-md bg-[#727C8E]/12 px-2 py-0.5 text-xs font-medium text-[#727C8E] dark:bg-[#727C8E]/20 dark:text-[#8C97A8]">
            Rendah
        </span>
    );
}

// ─── Slot Panitia Inti ────────────────────────────────────────────────────────

function SlotPanitiaInti({
    jabatan,
    label,
    assigned,
    anggotaTeam,
    teamSlug,
    kegiatanId,
    canManage = true,
}: {
    jabatan: 'ketua_pelaksana' | 'bendahara' | 'sekretaris';
    label: string;
    assigned: KepanitiaanItem | undefined;
    anggotaTeam: AnggotaTeamItem[];
    teamSlug: string;
    kegiatanId: number;
    canManage?: boolean;
}) {
    const [selectedUserId, setSelectedUserId] = useState<string>('');
    const [assigning, setAssigning] = useState(false);

    function assign() {
        if (!selectedUserId) return;
        setAssigning(true);
        router.post(
            divisi.store.url({ current_team: teamSlug, kegiatan: kegiatanId }),
            { user_id: Number(selectedUserId), jabatan },
            {
                preserveScroll: true,
                onSuccess: () => {
                    showSuccess(
                        'Penugasan Berhasil!',
                        `Anggota berhasil ditugaskan sebagai ${label}.`,
                    );
                },
                onFinish: () => {
                    setAssigning(false);
                    setSelectedUserId('');
                },
            },
        );
    }

    async function cabut(kepanitiaanId: number) {
        const confirmed = await confirmDelete(
            label,
            `Apakah Anda yakin ingin mencabut posisi ${label}?`,
        );
        if (!confirmed) return;
        router.delete(
            divisi.destroy.url({
                current_team: teamSlug,
                kepanitiaan: kepanitiaanId,
            }),
            {
                preserveScroll: true,
                onSuccess: () => {
                    Toast.fire({
                        icon: 'success',
                        title: `Posisi ${label} berhasil dicabut.`,
                    });
                },
            },
        );
    }

    return (
        <div className="flex flex-col justify-between rounded-lg border border-[rgba(30,36,48,0.08)] bg-white p-5 shadow-sm dark:border-[rgba(255,255,255,0.08)] dark:bg-[#181E2B]">
            <div>
                <p className="mb-3 text-[11px] font-semibold tracking-wider text-[#727C8E] uppercase dark:text-[#8C97A8]">
                    {label}
                </p>

                {assigned ? (
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                            <div className="flex size-7.5 items-center justify-center rounded-md bg-[#4A5FD1]/12 text-[#4A5FD1] dark:bg-[#4A5FD1]/20 dark:text-[#8FA0FA]">
                                <UserCheck className="size-4" />
                            </div>
                            <span className="text-xs font-semibold text-[#1E2430] dark:text-[#E6ECF5]">
                                {assigned.user?.name ?? '—'}
                            </span>
                        </div>
                        {canManage && (
                            <button
                                onClick={() => cabut(assigned.id)}
                                className="flex items-center gap-1 rounded-md border border-[rgba(30,36,48,0.12)] px-2.5 py-1 text-xs font-semibold text-[#727C8E] transition hover:border-[#C4514A] hover:text-[#C4514A] dark:border-[rgba(255,255,255,0.1)] dark:text-[#8C97A8]"
                            >
                                <X className="size-3" /> Cabut
                            </button>
                        )}
                    </div>
                ) : canManage ? (
                    <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                            <select
                                value={selectedUserId}
                                onChange={(e) =>
                                    setSelectedUserId(e.target.value)
                                }
                                className="w-full appearance-none rounded-md border border-[rgba(30,36,48,0.12)] bg-white py-1.5 pr-8 pl-3 text-xs font-medium text-[#1E2430] outline-none focus:border-[#4A5FD1] dark:border-[rgba(255,255,255,0.12)] dark:bg-[#181E2B] dark:text-[#E6ECF5]"
                            >
                                <option value="" disabled>
                                    Pilih anggota...
                                </option>
                                {anggotaTeam.map((a) => (
                                    <option key={a.id} value={a.id}>
                                        {a.name}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="pointer-events-none absolute top-2.5 right-2.5 size-3.5 text-[#727C8E]" />
                        </div>
                        <button
                            onClick={assign}
                            disabled={!selectedUserId || assigning}
                            className="flex items-center gap-1 rounded-md bg-[#4A5FD1] px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-[#3B4DB8] disabled:opacity-50"
                        >
                            <Plus className="size-3.5" />
                            Assign
                        </button>
                    </div>
                ) : (
                    <p className="text-xs italic text-[#727C8E]/60 dark:text-[#8C97A8]/60">
                        Belum ada penugasan
                    </p>
                )}
            </div>

            {assigned && (
                <p className="mt-3 flex items-center gap-1.5 text-[11px] text-[#727C8E] dark:text-[#8C97A8]">
                    <AlertCircle className="size-3" />
                    Jabatan ini terisi satu orang penanggung jawab
                </p>
            )}
        </div>
    );
}

// ─── Kartu Divisi ─────────────────────────────────────────────────────────────

function KartuDivisi({
    divisiKey,
    label,
    badgeColor,
    members,
    tugasList,
    anggotaTeam,
    canManageKepanitiaan,
    canManageTugas,
    isKoordinatorOfDivisi,
    authUserId,
    teamSlug,
    kegiatanId,
}: {
    divisiKey: JabatanDivisi;
    label: string;
    badgeColor: string;
    members: KepanitiaanItem[];
    tugasList: TugasItem[];
    anggotaTeam: AnggotaTeamItem[];
    canManageKepanitiaan: boolean;
    canManageTugas: boolean;
    /** true if the current auth user is koordinator of this specific division */
    isKoordinatorOfDivisi: boolean;
    authUserId: number;
    teamSlug: string;
    kegiatanId: number;
}) {
    const [showAddAnggota, setShowAddAnggota] = useState(false);
    const [selectedAnggota, setSelectedAnggota] = useState<string>('');
    const [addingAnggota, setAddingAnggota] = useState(false);

    const [showAddTugas, setShowAddTugas] = useState(false);
    const [tugasForm, setTugasForm] = useState({
        pic_user_id: '',
        deskripsi_tugas: '',
        prioritas: 'sedang' as TugasItem['prioritas'],
        deadline: '',
    });
    const [addingTugas, setAddingTugas] = useState(false);

    const [editingTugasId, setEditingTugasId] = useState<number | null>(null);
    const [editTugasForm, setEditTugasForm] = useState({
        pic_user_id: '',
        deskripsi_tugas: '',
        prioritas: 'sedang' as TugasItem['prioritas'],
        deadline: '',
    });
    const [savingEditTugas, setSavingEditTugas] = useState(false);

    function tambahAnggota() {
        if (!selectedAnggota) return;
        setAddingAnggota(true);
        router.post(
            divisi.store.url({ current_team: teamSlug, kegiatan: kegiatanId }),
            { user_id: Number(selectedAnggota), jabatan: divisiKey },
            {
                preserveScroll: true,
                onSuccess: () => {
                    showSuccess(
                        'Anggota Ditambahkan!',
                        `Anggota berhasil ditugaskan ke divisi ${label}.`,
                    );
                },
                onFinish: () => {
                    setAddingAnggota(false);
                    setSelectedAnggota('');
                    setShowAddAnggota(false);
                },
            },
        );
    }

    async function cabutAnggota(kepanitiaanId: number) {
        const confirmed = await confirmDelete(
            'Anggota Divisi',
            'Cabut anggota dari divisi ini?',
        );
        if (!confirmed) return;
        router.delete(
            divisi.destroy.url({
                current_team: teamSlug,
                kepanitiaan: kepanitiaanId,
            }),
            {
                preserveScroll: true,
                onSuccess: () => {
                    Toast.fire({
                        icon: 'success',
                        title: 'Anggota divisi berhasil dicabut.',
                    });
                },
            },
        );
    }

    function submitTugas() {
        if (!tugasForm.pic_user_id || !tugasForm.deskripsi_tugas) return;
        setAddingTugas(true);
        router.post(
            tugas.store.url({ current_team: teamSlug, kegiatan: kegiatanId }),
            {
                jabatan: divisiKey,
                pic_user_id: Number(tugasForm.pic_user_id),
                deskripsi_tugas: tugasForm.deskripsi_tugas,
                prioritas: tugasForm.prioritas,
                deadline: tugasForm.deadline || null,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    showSuccess(
                        'Tugas Dibuat!',
                        'Tugas divisi baru telah berhasil dibuat.',
                    );
                },
                onFinish: () => {
                    setAddingTugas(false);
                    setTugasForm({
                        pic_user_id: '',
                        deskripsi_tugas: '',
                        prioritas: 'sedang',
                        deadline: '',
                    });
                    setShowAddTugas(false);
                },
            },
        );
    }

    async function hapusTugas(tugasId: number) {
        const confirmed = await confirmDelete(
            'Tugas Divisi',
            'Yakin ingin menghapus tugas ini?',
        );
        if (!confirmed) return;
        router.delete(
            tugas.destroy.url({ current_team: teamSlug, tugas: tugasId }),
            {
                preserveScroll: true,
                onSuccess: () => {
                    Toast.fire({
                        icon: 'success',
                        title: 'Tugas divisi berhasil dihapus.',
                    });
                },
            },
        );
    }

    function openEditTugas(t: TugasItem) {
        setEditingTugasId(t.id);
        setEditTugasForm({
            pic_user_id: String(t.pic_user_id),
            deskripsi_tugas: t.deskripsi_tugas,
            prioritas: t.prioritas,
            deadline: t.deadline ?? '',
        });
    }

    function saveEditTugas(tugasId: number) {
        setSavingEditTugas(true);
        router.patch(
            tugas.update.url({ current_team: teamSlug, tugas: tugasId }),
            {
                pic_user_id: Number(editTugasForm.pic_user_id),
                deskripsi_tugas: editTugasForm.deskripsi_tugas,
                prioritas: editTugasForm.prioritas,
                deadline: editTugasForm.deadline || null,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    Toast.fire({
                        icon: 'success',
                        title: 'Perubahan tugas berhasil disimpan!',
                    });
                },
                onFinish: () => {
                    setSavingEditTugas(false);
                    setEditingTugasId(null);
                },
            },
        );
    }

    function updateStatus(tugasId: number, status: TugasItem['status']) {
        router.patch(
            tugas.updateStatus.url({ current_team: teamSlug, tugas: tugasId }),
            { status },
            {
                preserveScroll: true,
                onSuccess: () => {
                    Toast.fire({
                        icon: 'success',
                        title: `Status tugas diubah menjadi ${status === 'selesai' ? 'Selesai' : status === 'sedang' ? 'Sedang Dikerjakan' : 'Belum Mulai'}!`,
                    });
                },
            },
        );
    }

    return (
        <div className="overflow-hidden rounded-lg border border-[rgba(30,36,48,0.08)] bg-white shadow-sm dark:border-[rgba(255,255,255,0.08)] dark:bg-[#181E2B]">
            {/* Header divisi */}
            <div className="flex items-center justify-between border-b border-[rgba(30,36,48,0.08)] px-5 py-3.5 dark:border-[rgba(255,255,255,0.08)]">
                <div className="flex items-center gap-2.5">
                    <span
                        className={`rounded-md px-2.5 py-0.5 text-xs font-semibold ${badgeColor}`}
                    >
                        {label}
                    </span>
                    <span className="font-mono-sigap text-xs text-[#727C8E] dark:text-[#8C97A8]">
                        {members.length} anggota
                    </span>
                </div>
                {(canManageKepanitiaan || isKoordinatorOfDivisi) && (
                    <button
                        onClick={() => setShowAddAnggota((v) => !v)}
                        className="flex items-center gap-1.5 rounded-md border border-[rgba(30,36,48,0.12)] px-3 py-1 text-xs font-semibold text-[#1E2430] transition hover:bg-[#F6F7F9] dark:border-[rgba(255,255,255,0.1)] dark:text-[#E6ECF5] dark:hover:bg-[#21293A]"
                    >
                        <Plus className="size-3.5 text-[#4A5FD1]" />
                        Tambah Anggota
                    </button>
                )}
            </div>

            <div className="p-5">
                {/* Daftar anggota */}
                {members.length === 0 ? (
                    <p className="mb-4 text-xs text-[#727C8E]/70 italic dark:text-[#8C97A8]/70">
                        Belum ada anggota di divisi ini.
                    </p>
                ) : (
                    <div className="mb-5 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                        {members.map((m) => {
                            const initials = m.user?.name
                                ? m.user.name
                                      .split(' ')
                                      .slice(0, 2)
                                      .map((n) => n[0])
                                      .join('')
                                      .toUpperCase()
                                : '?';

                            return (
                                <div
                                    key={m.id}
                                    className="flex items-center justify-between rounded-md border border-[rgba(30,36,48,0.08)] bg-[#F6F7F9]/50 p-2 text-xs dark:border-[rgba(255,255,255,0.08)] dark:bg-[#21293A]/40"
                                >
                                    <div className="flex min-w-0 items-center gap-2">
                                        <div className="flex size-6.5 shrink-0 items-center justify-center rounded-full bg-[#4A5FD1] text-[10px] font-semibold text-white">
                                            {initials}
                                        </div>
                                        <span className="truncate font-semibold text-[#1E2430] dark:text-[#E6ECF5]">
                                            {m.user?.name ?? '—'}
                                        </span>
                                        {m.is_koordinator && (
                                            <span className="flex shrink-0 items-center gap-0.5 rounded-md bg-[#B8862E]/12 px-1.5 py-0.5 text-[10px] font-semibold text-[#B8862E] dark:bg-[#B8862E]/20 dark:text-[#D4A142]">
                                                <Star className="size-2.5" />{' '}
                                                Koordinator
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex shrink-0 items-center gap-1">
                                        {canManageKepanitiaan && (
                                            <button
                                                onClick={() =>
                                                    router.patch(
                                                        divisi.koordinator.url({
                                                            current_team:
                                                                teamSlug,
                                                            kepanitiaan: m.id,
                                                        }),
                                                        {},
                                                        {
                                                            preserveScroll: true,
                                                            onSuccess: () =>
                                                                Toast.fire({
                                                                    icon: 'success',
                                                                    title: m.is_koordinator
                                                                        ? 'Status Koordinator dilepas.'
                                                                        : 'Koordinator divisi diangkat!',
                                                                }),
                                                        },
                                                    )
                                                }
                                                className={`rounded-md p-1 transition ${
                                                    m.is_koordinator
                                                        ? 'text-[#B8862E] hover:bg-[#B8862E]/10'
                                                        : 'text-[#727C8E] hover:bg-[#B8862E]/10 hover:text-[#B8862E]'
                                                }`}
                                                title={
                                                    m.is_koordinator
                                                        ? 'Lepas Koordinator'
                                                        : 'Jadikan Koordinator'
                                                }
                                            >
                                                <Star className="size-3.5" />
                                            </button>
                                        )}
                                        {(canManageKepanitiaan ||
                                            (isKoordinatorOfDivisi &&
                                                !m.is_koordinator)) && (
                                            <button
                                                onClick={() =>
                                                    cabutAnggota(m.id)
                                                }
                                                className="rounded-md p-1 text-[#727C8E] transition hover:bg-[#C4514A]/10 hover:text-[#C4514A]"
                                                title="Cabut anggota"
                                            >
                                                <X className="size-3.5" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Form tambah anggota (inline) */}
                {showAddAnggota &&
                    (canManageKepanitiaan || isKoordinatorOfDivisi) && (
                        <div className="mb-5 flex items-center gap-2 rounded-md border border-dashed border-[#4A5FD1]/40 bg-[#4A5FD1]/5 p-3 dark:border-[#4A5FD1]/30">
                            <div className="relative flex-1">
                                <select
                                    value={selectedAnggota}
                                    onChange={(e) =>
                                        setSelectedAnggota(e.target.value)
                                    }
                                    className="w-full appearance-none rounded-md border border-[rgba(30,36,48,0.12)] bg-white py-1.5 pr-8 pl-3 text-xs font-medium text-[#1E2430] outline-none focus:border-[#4A5FD1] dark:border-[rgba(255,255,255,0.12)] dark:bg-[#181E2B] dark:text-[#E6ECF5]"
                                >
                                    <option value="" disabled>
                                        Pilih anggota tim...
                                    </option>
                                    {anggotaTeam.map((a) => (
                                        <option key={a.id} value={a.id}>
                                            {a.name}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown className="pointer-events-none absolute top-2.5 right-2.5 size-3.5 text-[#727C8E]" />
                            </div>
                            <button
                                onClick={tambahAnggota}
                                disabled={!selectedAnggota || addingAnggota}
                                className="rounded-md bg-[#4A5FD1] px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-[#3B4DB8] disabled:opacity-50"
                            >
                                {addingAnggota ? 'Menambahkan...' : 'Tambah'}
                            </button>
                            <button
                                onClick={() => {
                                    setShowAddAnggota(false);
                                    setSelectedAnggota('');
                                }}
                                className="rounded-md p-1.5 text-[#727C8E] hover:text-[#1E2430]"
                            >
                                <X className="size-4" />
                            </button>
                        </div>
                    )}

                {/* Divider Tugas */}
                <div className="mb-3 flex items-center justify-between border-t border-[rgba(30,36,48,0.06)] pt-4 dark:border-[rgba(255,255,255,0.06)]">
                    <p className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wider text-[#727C8E] uppercase dark:text-[#8C97A8]">
                        <ClipboardList className="size-3.5 text-[#4A5FD1]" />
                        Daftar Tugas ({tugasList.length})
                    </p>
                    {canManageTugas && (
                        <button
                            onClick={() => setShowAddTugas((v) => !v)}
                            className="flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold text-[#4A5FD1] transition hover:bg-[#4A5FD1]/10 dark:text-[#8FA0FA]"
                        >
                            <Plus className="size-3.5" /> Tambah Tugas
                        </button>
                    )}
                </div>

                {/* Daftar tugas */}
                {tugasList.length === 0 && (
                    <p className="mb-2 text-xs text-[#727C8E]/70 italic dark:text-[#8C97A8]/70">
                        Belum ada tugas untuk divisi ini.
                    </p>
                )}

                <div className="flex flex-col gap-2">
                    {tugasList.map((t) =>
                        editingTugasId === t.id ? (
                            <div
                                key={t.id}
                                className="flex flex-col gap-2.5 rounded-md border border-[#4A5FD1]/30 bg-[#4A5FD1]/5 p-3 text-xs dark:border-neutral-700 dark:bg-neutral-800/50"
                            >
                                <textarea
                                    value={editTugasForm.deskripsi_tugas}
                                    onChange={(e) =>
                                        setEditTugasForm((f) => ({
                                            ...f,
                                            deskripsi_tugas: e.target.value,
                                        }))
                                    }
                                    rows={2}
                                    className="w-full resize-none rounded-md border border-[rgba(30,36,48,0.12)] bg-white p-2 text-xs text-[#1E2430] outline-none focus:border-[#4A5FD1] dark:border-[rgba(255,255,255,0.12)] dark:bg-[#181E2B] dark:text-[#E6ECF5]"
                                />
                                <div className="flex flex-wrap gap-2">
                                    <div className="relative min-w-32 flex-1">
                                        <select
                                            value={editTugasForm.pic_user_id}
                                            onChange={(e) =>
                                                setEditTugasForm((f) => ({
                                                    ...f,
                                                    pic_user_id: e.target.value,
                                                }))
                                            }
                                            className="w-full appearance-none rounded-md border border-[rgba(30,36,48,0.12)] bg-white py-1.5 pr-8 pl-3 text-xs font-medium text-[#1E2430] outline-none focus:border-[#4A5FD1] dark:border-[rgba(255,255,255,0.12)] dark:bg-[#181E2B] dark:text-[#E6ECF5]"
                                        >
                                            <option value="" disabled>
                                                PIC...
                                            </option>
                                            {members.map((m) => (
                                                <option
                                                    key={m.user_id}
                                                    value={m.user_id}
                                                >
                                                    {m.user?.name ??
                                                        `User #${m.user_id}`}
                                                </option>
                                            ))}
                                        </select>
                                        <ChevronDown className="pointer-events-none absolute top-2 right-2 size-3.5 text-[#727C8E]" />
                                    </div>
                                    <select
                                        value={editTugasForm.prioritas}
                                        onChange={(e) =>
                                            setEditTugasForm((f) => ({
                                                ...f,
                                                prioritas: e.target
                                                    .value as TugasItem['prioritas'],
                                            }))
                                        }
                                        className="rounded-md border border-[rgba(30,36,48,0.12)] bg-white px-3 py-1.5 text-xs font-medium text-[#1E2430] outline-none focus:border-[#4A5FD1] dark:border-[rgba(255,255,255,0.12)] dark:bg-[#181E2B] dark:text-[#E6ECF5]"
                                    >
                                        <option value="rendah">Rendah</option>
                                        <option value="sedang">Sedang</option>
                                        <option value="tinggi">Tinggi</option>
                                    </select>
                                    <input
                                        type="date"
                                        value={editTugasForm.deadline}
                                        onChange={(e) =>
                                            setEditTugasForm((f) => ({
                                                ...f,
                                                deadline: e.target.value,
                                            }))
                                        }
                                        className="font-mono-sigap rounded-md border border-[rgba(30,36,48,0.12)] bg-white px-3 py-1.5 text-xs text-[#1E2430] outline-none focus:border-[#4A5FD1] dark:border-[rgba(255,255,255,0.12)] dark:bg-[#181E2B] dark:text-[#E6ECF5]"
                                    />
                                </div>
                                <div className="flex justify-end gap-2">
                                    <button
                                        onClick={() => setEditingTugasId(null)}
                                        className="rounded-md border border-[rgba(30,36,48,0.12)] px-3 py-1 text-xs font-medium text-[#727C8E] hover:bg-[#F6F7F9] dark:border-[rgba(255,255,255,0.1)] dark:text-[#8C97A8]"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        onClick={() => saveEditTugas(t.id)}
                                        disabled={savingEditTugas}
                                        className="rounded-md bg-[#4A5FD1] px-3.5 py-1 text-xs font-semibold text-white hover:bg-[#3B4DB8] disabled:opacity-50"
                                    >
                                        {savingEditTugas
                                            ? 'Menyimpan...'
                                            : 'Simpan'}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div
                                key={t.id}
                                className="flex flex-col gap-2 rounded-md border border-[rgba(30,36,48,0.08)] bg-[#F6F7F9]/50 p-3 text-xs dark:border-[rgba(255,255,255,0.08)] dark:bg-[#21293A]/40"
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <p className="flex-1 font-medium text-[#1E2430] dark:text-[#E6ECF5]">
                                        {t.deskripsi_tugas}
                                    </p>
                                    {canManageTugas && (
                                        <div className="flex shrink-0 items-center gap-1">
                                            <button
                                                onClick={() => openEditTugas(t)}
                                                className="rounded-md p-1 text-[#727C8E] transition hover:bg-[#4A5FD1]/10 hover:text-[#4A5FD1]"
                                                title="Edit tugas"
                                            >
                                                <ClipboardList className="size-3.5" />
                                            </button>
                                            <button
                                                onClick={() => hapusTugas(t.id)}
                                                className="rounded-md p-1 text-[#727C8E] transition hover:bg-[#C4514A]/10 hover:text-[#C4514A]"
                                                title="Hapus tugas"
                                            >
                                                <Trash2 className="size-3.5" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <div className="flex flex-wrap items-center gap-2 border-t border-[rgba(30,36,48,0.06)] pt-1 dark:border-[rgba(255,255,255,0.06)]">
                                    <StatusBadge status={t.status} />
                                    <PrioritasBadge prioritas={t.prioritas} />
                                    {t.deadline && (
                                        <span className="font-mono-sigap text-[11px] text-[#727C8E] dark:text-[#8C97A8]">
                                            Deadline: {t.deadline}
                                        </span>
                                    )}
                                    <span className="text-[11px] text-[#727C8E] dark:text-[#8C97A8]">
                                        PIC: {t.pic?.name ?? '—'}
                                    </span>
                                </div>
                                {t.pic_user_id === authUserId && (
                                    <div className="mt-1 flex items-center gap-2">
                                        <span className="text-[11px] text-[#727C8E] dark:text-[#8C97A8]">
                                            Update status:
                                        </span>
                                        <select
                                            value={t.status}
                                            onChange={(e) =>
                                                updateStatus(
                                                    t.id,
                                                    e.target
                                                        .value as TugasItem['status'],
                                                )
                                            }
                                            className="rounded-md border border-[rgba(30,36,48,0.12)] bg-white px-2.5 py-0.5 text-xs font-semibold outline-none focus:border-[#4A5FD1] dark:border-[rgba(255,255,255,0.12)] dark:bg-[#181E2B] dark:text-[#E6ECF5]"
                                        >
                                            <option value="belum">Belum</option>
                                            <option value="sedang">
                                                Sedang
                                            </option>
                                            <option value="selesai">
                                                Selesai
                                            </option>
                                        </select>
                                    </div>
                                )}
                            </div>
                        ),
                    )}
                </div>

                {/* Form tambah tugas */}
                {showAddTugas && canManageTugas && (
                    <div className="mt-3.5 rounded-md border border-dashed border-[#4A5FD1]/40 bg-[#4A5FD1]/5 p-3.5 dark:border-[#4A5FD1]/30">
                        <p className="mb-2 text-xs font-semibold text-[#4A5FD1] dark:text-[#8FA0FA]">
                            Tugas Baru
                        </p>
                        <div className="flex flex-col gap-2.5">
                            <textarea
                                value={tugasForm.deskripsi_tugas}
                                onChange={(e) =>
                                    setTugasForm((f) => ({
                                        ...f,
                                        deskripsi_tugas: e.target.value,
                                    }))
                                }
                                rows={2}
                                placeholder="Deskripsi tugas..."
                                className="w-full resize-none rounded-md border border-[rgba(30,36,48,0.12)] bg-white p-2 text-xs text-[#1E2430] outline-none focus:border-[#4A5FD1] dark:border-[rgba(255,255,255,0.12)] dark:bg-[#181E2B] dark:text-[#E6ECF5]"
                            />
                            <div className="flex flex-wrap gap-2">
                                <div className="relative min-w-32 flex-1">
                                    <select
                                        value={tugasForm.pic_user_id}
                                        onChange={(e) =>
                                            setTugasForm((f) => ({
                                                ...f,
                                                pic_user_id: e.target.value,
                                            }))
                                        }
                                        className="w-full appearance-none rounded-md border border-[rgba(30,36,48,0.12)] bg-white py-1.5 pr-8 pl-3 text-xs font-medium text-[#1E2430] outline-none focus:border-[#4A5FD1] dark:border-[rgba(255,255,255,0.12)] dark:bg-[#181E2B] dark:text-[#E6ECF5]"
                                    >
                                        <option value="" disabled>
                                            PIC (anggota divisi)...
                                        </option>
                                        {members.map((m) => (
                                            <option
                                                key={m.user_id}
                                                value={m.user_id}
                                            >
                                                {m.user?.name ??
                                                    `User #${m.user_id}`}
                                            </option>
                                        ))}
                                    </select>
                                    <ChevronDown className="pointer-events-none absolute top-2.5 right-2.5 size-3.5 text-[#727C8E]" />
                                </div>
                                <select
                                    value={tugasForm.prioritas}
                                    onChange={(e) =>
                                        setTugasForm((f) => ({
                                            ...f,
                                            prioritas: e.target
                                                .value as TugasItem['prioritas'],
                                        }))
                                    }
                                    className="rounded-md border border-[rgba(30,36,48,0.12)] bg-white px-3 py-1.5 text-xs font-medium text-[#1E2430] outline-none focus:border-[#4A5FD1] dark:border-[rgba(255,255,255,0.12)] dark:bg-[#181E2B] dark:text-[#E6ECF5]"
                                >
                                    <option value="rendah">Rendah</option>
                                    <option value="sedang">Sedang</option>
                                    <option value="tinggi">Tinggi</option>
                                </select>
                                <input
                                    type="date"
                                    value={tugasForm.deadline}
                                    onChange={(e) =>
                                        setTugasForm((f) => ({
                                            ...f,
                                            deadline: e.target.value,
                                        }))
                                    }
                                    className="font-mono-sigap rounded-md border border-[rgba(30,36,48,0.12)] bg-white px-3 py-1.5 text-xs text-[#1E2430] outline-none focus:border-[#4A5FD1] dark:border-[rgba(255,255,255,0.12)] dark:bg-[#181E2B] dark:text-[#E6ECF5]"
                                />
                            </div>
                            <div className="flex justify-end gap-2">
                                <button
                                    onClick={() => {
                                        setShowAddTugas(false);
                                        setTugasForm({
                                            pic_user_id: '',
                                            deskripsi_tugas: '',
                                            prioritas: 'sedang',
                                            deadline: '',
                                        });
                                    }}
                                    className="rounded-md border border-[rgba(30,36,48,0.12)] px-3 py-1 text-xs font-medium text-[#727C8E] hover:bg-[#F6F7F9] dark:border-[rgba(255,255,255,0.1)] dark:text-[#8C97A8]"
                                >
                                    Batal
                                </button>
                                <button
                                    onClick={submitTugas}
                                    disabled={
                                        !tugasForm.pic_user_id ||
                                        !tugasForm.deskripsi_tugas ||
                                        addingTugas
                                    }
                                    className="rounded-md bg-[#4A5FD1] px-3.5 py-1 text-xs font-semibold text-white hover:bg-[#3B4DB8] disabled:opacity-50"
                                >
                                    {addingTugas
                                        ? 'Menyimpan...'
                                        : 'Simpan Tugas'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PanitiaIndex({
    kegiatanList,
    selectedKegiatanId,
    kepanitiaan,
    tugas: tugasList,
    anggotaTeam,
    canManageKepanitiaan,
    jabatanUser,
    koordinatorDivisi,
    isReadOnly = false,
}: Props) {
    const { url, props } = usePage<{ auth: { user: { id: number } } }>();
    const teamSlug = url.split('/')[1];
    const authUserId = props.auth.user.id;

    const selectedKegiatan = kegiatanList.find(
        (k) => k.id === selectedKegiatanId,
    );

    function pilihKegiatan(id: number) {
        router.get(
            panitiaIndex.url(teamSlug),
            { kegiatan_id: id },
            { preserveState: false },
        );
    }

    return (
        <>
            <Head title="Panitia & Tugas" />

            <div className="flex h-full flex-col gap-6 p-4 sm:p-6 lg:p-8">
                {/* ─── Header ─── */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="font-display text-2xl font-semibold tracking-tight text-[#1E2430] sm:text-3xl dark:text-[#E6ECF5]">
                            Panitia & Tugas
                        </h1>
                        <p className="mt-0.5 text-xs text-[#727C8E] dark:text-[#8C97A8]">
                            Kelola struktur kepanitiaan dan pembagian tugas per
                            kegiatan
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

                {/* ─── Mode Pemantauan Banner ─── */}
                {isReadOnly && (
                    <ReadOnlyBanner
                        roleName="Pembina"
                        message="Anda sedang dalam mode pemantauan. Anda dapat memantau susunan kepanitiaan dan progres tugas divisi secara real-time."
                    />
                )}

                {/* ─── Belum pilih kegiatan atau akses terbatas ─── */}
                {!selectedKegiatan ? (
                    kegiatanList.length === 0 ? (
                        <AccessRestrictionCard actionType="panitia" />
                    ) : (
                        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-[rgba(30,36,48,0.12)] bg-white py-20 text-center dark:border-[rgba(255,255,255,0.12)] dark:bg-[#181E2B]">
                            <Users className="mb-3 size-10 text-[#727C8E]/40 dark:text-[#8C97A8]/40" />
                            <p className="text-xs font-medium text-[#727C8E] dark:text-[#8C97A8]">
                                Pilih kegiatan di atas untuk mengelola kepanitiaan.
                            </p>
                        </div>
                    )
                ) : (
                    <div className="flex flex-col gap-6">
                        {/* ─── Section 1: Panitia Inti ─── */}
                        <section>
                            <h2 className="mb-3 font-display text-base font-semibold text-[#1E2430] dark:text-[#E6ECF5]">
                                Panitia Inti
                            </h2>
                            <div className="grid gap-4 sm:grid-cols-3">
                                {JABATAN_INTI.map(({ key, label }) => (
                                    <SlotPanitiaInti
                                        key={key}
                                        jabatan={key}
                                        label={label}
                                        assigned={kepanitiaan.find(
                                            (k) => k.jabatan === key,
                                        )}
                                        anggotaTeam={anggotaTeam}
                                        teamSlug={teamSlug}
                                        kegiatanId={selectedKegiatan.id}
                                        canManage={canManageKepanitiaan}
                                    />
                                ))}
                            </div>
                        </section>

                        {/* ─── Section 2: Divisi ─── */}
                        <section>
                            <h2 className="mb-3 font-display text-base font-semibold text-[#1E2430] dark:text-[#E6ECF5]">
                                Divisi & Tugas
                            </h2>
                            <div className="flex flex-col gap-4">
                                {DIVISI_LIST.map(({ key, label, color }) => {
                                    const divisiMembers = kepanitiaan.filter(
                                        (k) => k.jabatan === key,
                                    );
                                    const divisiTugas = tugasList.filter(
                                        (t) => t.jabatan === key,
                                    );
                                    const isKoorDivisi =
                                        koordinatorDivisi.includes(key);
                                    // Anggota biasa non-koordinator cannot manage tugas
                                    const canManageTugasForDivisi =
                                        canManageKepanitiaan || isKoorDivisi;

                                    return (
                                        <KartuDivisi
                                            key={key}
                                            divisiKey={key}
                                            label={label}
                                            badgeColor={color}
                                            members={divisiMembers}
                                            tugasList={divisiTugas}
                                            anggotaTeam={anggotaTeam}
                                            canManageKepanitiaan={
                                                canManageKepanitiaan
                                            }
                                            canManageTugas={
                                                canManageTugasForDivisi
                                            }
                                            isKoordinatorOfDivisi={isKoorDivisi}
                                            authUserId={authUserId}
                                            teamSlug={teamSlug}
                                            kegiatanId={selectedKegiatan.id}
                                        />
                                    );
                                })}
                            </div>
                        </section>
                    </div>
                )}
            </div>
        </>
    );
}

PanitiaIndex.layout = (
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
            teamSlug ? panitiaIndex.url(teamSlug) : '/kegiatan',
            {title: 'Panitia & Tugas', href: teamSlug ? panitiaIndex.url(teamSlug) : '/panitia'},
            selectedKegiatan && { title: selectedKegiatan.nama, href: '' },

        ),
    };
};
