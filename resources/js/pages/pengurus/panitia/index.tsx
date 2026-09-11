import { Head, router, usePage } from '@inertiajs/react';
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
} from 'lucide-react';
import { useState } from 'react';
import { index as panitiaIndex } from '@/routes/panitia';
import divisi from '@/routes/divisi';
import tugas from '@/routes/tugas';
import { confirmDelete, showSuccess, Toast } from '@/lib/sweetalert';

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
};

// ─── Constants ────────────────────────────────────────────────────────────────

const DIVISI_LIST: { key: JabatanDivisi; label: string; color: string }[] = [
    { key: 'div_acara', label: 'Divisi Acara', color: 'bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300' },
    { key: 'div_humas', label: 'Divisi Humas', color: 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300' },
    { key: 'div_pdd', label: 'Divisi PDD', color: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300' },
    { key: 'div_logistik', label: 'Divisi Logistik', color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' },
];

const JABATAN_INTI: { key: 'ketua_pelaksana' | 'bendahara' | 'sekretaris'; label: string }[] = [
    { key: 'ketua_pelaksana', label: 'Ketua Pelaksana' },
    { key: 'bendahara', label: 'Bendahara' },
    { key: 'sekretaris', label: 'Sekretaris' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: TugasItem['status'] }) {
    if (status === 'selesai') {
        return (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">
                <CheckCircle2 className="size-3 text-emerald-500" /> Selesai
            </span>
        );
    }
    if (status === 'sedang') {
        return (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#EEF2FF] px-2 py-0.5 text-xs font-bold text-[#4F46E5] dark:bg-[#4F46E5]/20 dark:text-[#818CF8]">
                <Clock className="size-3" /> Sedang
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-semibold text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
            <Circle className="size-3" /> Belum
        </span>
    );
}

function PrioritasBadge({ prioritas }: { prioritas: TugasItem['prioritas'] }) {
    if (prioritas === 'tinggi') {
        return (
            <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-bold text-red-600 dark:bg-red-950/30 dark:text-red-400">
                Tinggi
            </span>
        );
    }
    if (prioritas === 'sedang') {
        return (
            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-600 dark:bg-amber-950/30 dark:text-amber-400">
                Sedang
            </span>
        );
    }
    return (
        <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
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
}: {
    jabatan: 'ketua_pelaksana' | 'bendahara' | 'sekretaris';
    label: string;
    assigned: KepanitiaanItem | undefined;
    anggotaTeam: AnggotaTeamItem[];
    teamSlug: string;
    kegiatanId: number;
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
                    showSuccess('Penugasan Berhasil!', `Anggota berhasil ditugaskan sebagai ${label}.`);
                },
                onFinish: () => {
                    setAssigning(false);
                    setSelectedUserId('');
                },
            },
        );
    }

    async function cabut(kepanitiaanId: number) {
        const confirmed = await confirmDelete(label, `Apakah Anda yakin ingin mencabut posisi ${label}?`);
        if (!confirmed) return;
        router.delete(
            divisi.destroy.url({ current_team: teamSlug, kepanitiaan: kepanitiaanId }),
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
        <div className="flex flex-col justify-between rounded-3xl border border-neutral-200/70 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
            <div>
                <p className="mb-3 text-[11px] font-extrabold uppercase tracking-wider text-neutral-400">
                    {label}
                </p>

                {assigned ? (
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                            <div className="flex size-8 items-center justify-center rounded-xl bg-[#EEF2FF] text-[#4F46E5] dark:bg-[#4F46E5]/20 dark:text-[#818CF8]">
                                <UserCheck className="size-4" />
                            </div>
                            <span className="text-sm font-bold text-neutral-800 dark:text-neutral-200">
                                {assigned.user?.name ?? '—'}
                            </span>
                        </div>
                        <button
                            onClick={() => cabut(assigned.id)}
                            className="flex items-center gap-1 rounded-xl border border-neutral-200 px-2.5 py-1 text-xs font-bold text-neutral-500 transition hover:border-red-300 hover:text-red-600 dark:border-neutral-700 dark:hover:border-red-700 dark:hover:text-red-400"
                        >
                            <X className="size-3" /> Cabut
                        </button>
                    </div>
                ) : (
                    <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                            <select
                                value={selectedUserId}
                                onChange={(e) => setSelectedUserId(e.target.value)}
                                className="w-full appearance-none rounded-2xl border border-neutral-200/80 bg-white py-2 pl-3 pr-8 text-xs font-semibold text-neutral-700 focus:border-[#4F46E5] focus:outline-none focus:ring-1 focus:ring-[#4F46E5] dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200"
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
                            <ChevronDown className="pointer-events-none absolute right-2.5 top-2.5 size-4 text-neutral-400" />
                        </div>
                        <button
                            onClick={assign}
                            disabled={!selectedUserId || assigning}
                            className="flex items-center gap-1 rounded-2xl bg-[#4F46E5] px-3.5 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-[#4338CA] disabled:opacity-50"
                        >
                            <Plus className="size-3.5" />
                            Assign
                        </button>
                    </div>
                )}
            </div>

            {assigned && (
                <p className="mt-3 flex items-center gap-1.5 text-[11px] text-neutral-400 dark:text-neutral-500">
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
                    showSuccess('Anggota Ditambahkan!', `Anggota berhasil ditugaskan ke divisi ${label}.`);
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
        const confirmed = await confirmDelete('Anggota Divisi', 'Cabut anggota dari divisi ini?');
        if (!confirmed) return;
        router.delete(
            divisi.destroy.url({ current_team: teamSlug, kepanitiaan: kepanitiaanId }),
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
                    showSuccess('Tugas Dibuat!', 'Tugas divisi baru telah berhasil dibuat.');
                },
                onFinish: () => {
                    setAddingTugas(false);
                    setTugasForm({ pic_user_id: '', deskripsi_tugas: '', prioritas: 'sedang', deadline: '' });
                    setShowAddTugas(false);
                },
            },
        );
    }

    async function hapusTugas(tugasId: number) {
        const confirmed = await confirmDelete('Tugas Divisi', 'Yakin ingin menghapus tugas ini?');
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
                        title: `Status tugas diubah menjadi ${status === 'selesai' ? 'Selesai' : status === 'dalam_proses' ? 'Dalam Proses' : 'Belum Mulai'}!`,
                    });
                },
            },
        );
    }

    return (
        <div className="overflow-hidden rounded-3xl border border-neutral-200/70 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
            {/* Header divisi */}
            <div className="flex items-center justify-between border-b border-neutral-100 px-6 py-4 dark:border-neutral-800">
                <div className="flex items-center gap-2.5">
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${badgeColor}`}>{label}</span>
                    <span className="text-xs font-medium text-neutral-400">
                        {members.length} anggota
                    </span>
                </div>
                {canManageKepanitiaan && (
                    <button
                        onClick={() => setShowAddAnggota((v) => !v)}
                        className="flex items-center gap-1.5 rounded-xl border border-neutral-200/80 px-3 py-1.5 text-xs font-bold text-neutral-700 transition hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
                    >
                        <Plus className="size-3.5 text-[#4F46E5]" />
                        Tambah Anggota
                    </button>
                )}
            </div>

            <div className="p-6">
                {/* Daftar anggota */}
                {members.length === 0 ? (
                    <p className="mb-4 text-xs italic text-neutral-400">
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
                                    className="flex items-center justify-between rounded-2xl border border-neutral-200/60 bg-neutral-50/50 p-2.5 text-xs dark:border-neutral-800 dark:bg-neutral-800/40"
                                >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <div className="flex size-7 shrink-0 items-center justify-center rounded-xl bg-[#4F46E5]/10 font-bold text-[#4F46E5] text-[10px] dark:bg-[#4F46E5]/20 dark:text-[#818CF8]">
                                            {initials}
                                        </div>
                                        <span className="truncate font-semibold text-neutral-800 dark:text-neutral-200">
                                            {m.user?.name ?? '—'}
                                        </span>
                                    </div>
                                    {canManageKepanitiaan && (
                                        <button
                                            onClick={() => cabutAnggota(m.id)}
                                            className="rounded-lg p-1 text-neutral-400 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30"
                                            title="Cabut anggota"
                                        >
                                            <X className="size-3.5" />
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Form tambah anggota (inline) */}
                {showAddAnggota && canManageKepanitiaan && (
                    <div className="mb-5 flex items-center gap-2 rounded-2xl border border-dashed border-[#4F46E5]/40 bg-[#EEF2FF]/60 p-3.5 dark:border-[#4F46E5]/30 dark:bg-[#4F46E5]/10">
                        <div className="relative flex-1">
                            <select
                                value={selectedAnggota}
                                onChange={(e) => setSelectedAnggota(e.target.value)}
                                className="w-full appearance-none rounded-xl border border-neutral-200 bg-white py-2 pl-3 pr-8 text-xs font-semibold text-neutral-700 focus:border-[#4F46E5] focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200"
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
                            <ChevronDown className="pointer-events-none absolute right-2.5 top-2.5 size-4 text-neutral-400" />
                        </div>
                        <button
                            onClick={tambahAnggota}
                            disabled={!selectedAnggota || addingAnggota}
                            className="rounded-xl bg-[#4F46E5] px-4 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-[#4338CA] disabled:opacity-50"
                        >
                            {addingAnggota ? 'Menambahkan...' : 'Tambah'}
                        </button>
                        <button
                            onClick={() => { setShowAddAnggota(false); setSelectedAnggota(''); }}
                            className="rounded-lg p-1.5 text-neutral-400 hover:text-neutral-600"
                        >
                            <X className="size-4" />
                        </button>
                    </div>
                )}

                {/* Divider Tugas */}
                <div className="mb-3 flex items-center justify-between border-t border-neutral-100 pt-4 dark:border-neutral-800">
                    <p className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-neutral-400">
                        <ClipboardList className="size-3.5 text-[#4F46E5]" />
                        Daftar Tugas ({tugasList.length})
                    </p>
                    {canManageTugas && (
                        <button
                            onClick={() => setShowAddTugas((v) => !v)}
                            className="flex items-center gap-1 rounded-xl px-2.5 py-1 text-xs font-bold text-[#4F46E5] transition hover:bg-[#EEF2FF] dark:text-[#818CF8] dark:hover:bg-[#4F46E5]/20"
                        >
                            <Plus className="size-3.5" /> Tambah Tugas
                        </button>
                    )}
                </div>

                {/* Daftar tugas */}
                {tugasList.length === 0 && (
                    <p className="mb-2 text-xs italic text-neutral-400">
                        Belum ada tugas untuk divisi ini.
                    </p>
                )}

                <div className="flex flex-col gap-2.5">
                    {tugasList.map((t) =>
                        editingTugasId === t.id ? (
                            <div
                                key={t.id}
                                className="flex flex-col gap-2.5 rounded-2xl border border-[#4F46E5]/30 bg-[#EEF2FF]/50 p-3.5 dark:border-neutral-700 dark:bg-neutral-800/50"
                            >
                                <textarea
                                    value={editTugasForm.deskripsi_tugas}
                                    onChange={(e) => setEditTugasForm((f) => ({ ...f, deskripsi_tugas: e.target.value }))}
                                    rows={2}
                                    className="w-full resize-none rounded-xl border border-neutral-200 bg-white p-2.5 text-xs text-neutral-800 focus:border-[#4F46E5] focus:outline-none dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
                                />
                                <div className="flex flex-wrap gap-2">
                                    <div className="relative flex-1 min-w-32">
                                        <select
                                            value={editTugasForm.pic_user_id}
                                            onChange={(e) => setEditTugasForm((f) => ({ ...f, pic_user_id: e.target.value }))}
                                            className="w-full appearance-none rounded-xl border border-neutral-200 bg-white py-1.5 pl-3 pr-8 text-xs font-semibold text-neutral-700 focus:border-[#4F46E5] focus:outline-none dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200"
                                        >
                                            <option value="" disabled>PIC...</option>
                                            {members.map((m) => (
                                                <option key={m.user_id} value={m.user_id}>
                                                    {m.user?.name ?? `User #${m.user_id}`}
                                                </option>
                                            ))}
                                        </select>
                                        <ChevronDown className="pointer-events-none absolute right-2 top-2 size-4 text-neutral-400" />
                                    </div>
                                    <select
                                        value={editTugasForm.prioritas}
                                        onChange={(e) => setEditTugasForm((f) => ({ ...f, prioritas: e.target.value as TugasItem['prioritas'] }))}
                                        className="rounded-xl border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700 focus:border-[#4F46E5] focus:outline-none dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200"
                                    >
                                        <option value="rendah">Rendah</option>
                                        <option value="sedang">Sedang</option>
                                        <option value="tinggi">Tinggi</option>
                                    </select>
                                    <input
                                        type="date"
                                        value={editTugasForm.deadline}
                                        onChange={(e) => setEditTugasForm((f) => ({ ...f, deadline: e.target.value }))}
                                        className="rounded-xl border border-neutral-200 bg-white px-3 py-1.5 text-xs text-neutral-700 focus:border-[#4F46E5] focus:outline-none dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200"
                                    />
                                </div>
                                <div className="flex justify-end gap-2">
                                    <button
                                        onClick={() => setEditingTugasId(null)}
                                        className="rounded-xl border border-neutral-200 px-3 py-1 text-xs font-semibold text-neutral-600 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-400"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        onClick={() => saveEditTugas(t.id)}
                                        disabled={savingEditTugas}
                                        className="rounded-xl bg-[#4F46E5] px-3.5 py-1 text-xs font-bold text-white shadow-xs hover:bg-[#4338CA] disabled:opacity-50"
                                    >
                                        {savingEditTugas ? 'Menyimpan...' : 'Simpan'}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div
                                key={t.id}
                                className="flex flex-col gap-2 rounded-2xl border border-neutral-200/60 bg-neutral-50/50 p-3.5 text-xs dark:border-neutral-800 dark:bg-neutral-800/40"
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <p className="flex-1 font-semibold text-neutral-800 dark:text-neutral-200">
                                        {t.deskripsi_tugas}
                                    </p>
                                    {canManageTugas && (
                                        <div className="flex shrink-0 items-center gap-1">
                                            <button
                                                onClick={() => openEditTugas(t)}
                                                className="rounded-lg p-1 text-neutral-400 transition hover:bg-neutral-200 hover:text-[#4F46E5] dark:hover:bg-neutral-700"
                                                title="Edit tugas"
                                            >
                                                <ClipboardList className="size-3.5" />
                                            </button>
                                            <button
                                                onClick={() => hapusTugas(t.id)}
                                                className="rounded-lg p-1 text-neutral-400 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30"
                                                title="Hapus tugas"
                                            >
                                                <Trash2 className="size-3.5" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-neutral-100 dark:border-neutral-800">
                                    <StatusBadge status={t.status} />
                                    <PrioritasBadge prioritas={t.prioritas} />
                                    {t.deadline && (
                                        <span className="text-[11px] text-neutral-400">
                                            Deadline: {t.deadline}
                                        </span>
                                    )}
                                    <span className="text-[11px] text-neutral-500 font-medium">
                                        PIC: {t.pic?.name ?? '—'}
                                    </span>
                                </div>
                                {t.pic_user_id === authUserId && (
                                    <div className="mt-1 flex items-center gap-2">
                                        <span className="text-[11px] text-neutral-400">
                                            Update status:
                                        </span>
                                        <select
                                            value={t.status}
                                            onChange={(e) =>
                                                updateStatus(t.id, e.target.value as TugasItem['status'])
                                            }
                                            className="rounded-xl border border-neutral-200 bg-white px-2.5 py-1 text-xs font-semibold focus:border-[#4F46E5] focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200"
                                        >
                                            <option value="belum">Belum</option>
                                            <option value="sedang">Sedang</option>
                                            <option value="selesai">Selesai</option>
                                        </select>
                                    </div>
                                )}
                            </div>
                        ),
                    )}
                </div>

                {/* Form tambah tugas */}
                {showAddTugas && canManageTugas && (
                    <div className="mt-3.5 rounded-2xl border border-dashed border-[#4F46E5]/40 bg-[#EEF2FF]/60 p-4 dark:border-[#4F46E5]/30 dark:bg-[#4F46E5]/10">
                        <p className="mb-2 text-xs font-bold text-[#4F46E5] dark:text-[#818CF8]">
                            Tugas Baru
                        </p>
                        <div className="flex flex-col gap-2.5">
                            <textarea
                                value={tugasForm.deskripsi_tugas}
                                onChange={(e) => setTugasForm((f) => ({ ...f, deskripsi_tugas: e.target.value }))}
                                rows={2}
                                placeholder="Deskripsi tugas..."
                                className="w-full resize-none rounded-xl border border-neutral-200 bg-white p-2.5 text-xs text-neutral-800 focus:border-[#4F46E5] focus:outline-none dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
                            />
                            <div className="flex flex-wrap gap-2">
                                <div className="relative flex-1 min-w-32">
                                    <select
                                        value={tugasForm.pic_user_id}
                                        onChange={(e) => setTugasForm((f) => ({ ...f, pic_user_id: e.target.value }))}
                                        className="w-full appearance-none rounded-xl border border-neutral-200 bg-white py-1.5 pl-3 pr-8 text-xs font-semibold text-neutral-700 focus:border-[#4F46E5] focus:outline-none dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200"
                                    >
                                        <option value="" disabled>
                                            PIC (anggota divisi)...
                                        </option>
                                        {members.map((m) => (
                                            <option key={m.user_id} value={m.user_id}>
                                                {m.user?.name ?? `User #${m.user_id}`}
                                            </option>
                                        ))}
                                    </select>
                                    <ChevronDown className="pointer-events-none absolute right-2.5 top-2.5 size-4 text-neutral-400" />
                                </div>
                                <select
                                    value={tugasForm.prioritas}
                                    onChange={(e) =>
                                        setTugasForm((f) => ({
                                            ...f,
                                            prioritas: e.target.value as TugasItem['prioritas'],
                                        }))
                                    }
                                    className="rounded-xl border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700 focus:border-[#4F46E5] focus:outline-none dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200"
                                >
                                    <option value="rendah">Rendah</option>
                                    <option value="sedang">Sedang</option>
                                    <option value="tinggi">Tinggi</option>
                                </select>
                                <input
                                    type="date"
                                    value={tugasForm.deadline}
                                    onChange={(e) => setTugasForm((f) => ({ ...f, deadline: e.target.value }))}
                                    className="rounded-xl border border-neutral-200 bg-white px-3 py-1.5 text-xs text-neutral-700 focus:border-[#4F46E5] focus:outline-none dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200"
                                />
                            </div>
                            <div className="flex justify-end gap-2">
                                <button
                                    onClick={() => {
                                        setShowAddTugas(false);
                                        setTugasForm({ pic_user_id: '', deskripsi_tugas: '', prioritas: 'sedang', deadline: '' });
                                    }}
                                    className="rounded-xl border border-neutral-200 px-3 py-1 text-xs font-semibold text-neutral-600 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-400"
                                >
                                    Batal
                                </button>
                                <button
                                    onClick={submitTugas}
                                    disabled={!tugasForm.pic_user_id || !tugasForm.deskripsi_tugas || addingTugas}
                                    className="rounded-xl bg-[#4F46E5] px-3.5 py-1 text-xs font-bold text-white shadow-xs hover:bg-[#4338CA] disabled:opacity-50"
                                >
                                    {addingTugas ? 'Menyimpan...' : 'Simpan Tugas'}
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
}: Props) {
    const { url, props } = usePage<{ auth: { user: { id: number } } }>();
    const teamSlug = url.split('/')[1];
    const authUserId = props.auth.user.id;

    const selectedKegiatan = kegiatanList.find((k) => k.id === selectedKegiatanId);

    function pilihKegiatan(id: number) {
        router.get(panitiaIndex.url(teamSlug), { kegiatan_id: id }, { preserveState: false });
    }

    return (
        <>
            <Head title="Panitia & Tugas" />

            <div className="flex h-full flex-col gap-6 p-4 sm:p-6 lg:p-8">
                {/* ─── Header ─── */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="font-display text-2xl font-extrabold tracking-tight text-neutral-900 sm:text-3xl dark:text-neutral-100">
                            Panitia & Tugas
                        </h1>
                        <p className="mt-0.5 text-xs font-medium text-neutral-500 dark:text-neutral-400">
                            Kelola struktur kepanitiaan dan pembagian tugas per kegiatan
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
                        <Users className="mb-4 size-12 text-neutral-300 dark:text-neutral-700" />
                        <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                            {kegiatanList.length === 0
                                ? 'Kamu belum memiliki akses kepanitiaan untuk kegiatan manapun.'
                                : 'Pilih kegiatan di atas untuk mengelola kepanitiaan.'}
                        </p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-8">
                        {/* ─── Section 1: Panitia Inti ─── */}
                        {canManageKepanitiaan && (
                            <section>
                                <h2 className="font-display mb-3 text-base font-bold text-neutral-900 dark:text-neutral-100">
                                    Panitia Inti
                                </h2>
                                <div className="grid gap-4 sm:grid-cols-3">
                                    {JABATAN_INTI.map(({ key, label }) => (
                                        <SlotPanitiaInti
                                            key={key}
                                            jabatan={key}
                                            label={label}
                                            assigned={kepanitiaan.find((k) => k.jabatan === key)}
                                            anggotaTeam={anggotaTeam}
                                            teamSlug={teamSlug}
                                            kegiatanId={selectedKegiatan.id}
                                        />
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* ─── Section 2: Divisi ─── */}
                        <section>
                            <h2 className="font-display mb-3 text-base font-bold text-neutral-900 dark:text-neutral-100">
                                Divisi & Tugas
                            </h2>
                            <div className="flex flex-col gap-5">
                                {DIVISI_LIST.map(({ key, label, color }) => {
                                    const divisiMembers = kepanitiaan.filter((k) => k.jabatan === key);
                                    const divisiTugas = tugasList.filter((t) => t.jabatan === key);
                                    const canManageTugasForDivisi =
                                        canManageKepanitiaan || jabatanUser.includes(key);

                                    return (
                                        <KartuDivisi
                                            key={key}
                                            divisiKey={key}
                                            label={label}
                                            badgeColor={color}
                                            members={divisiMembers}
                                            tugasList={divisiTugas}
                                            anggotaTeam={anggotaTeam}
                                            canManageKepanitiaan={canManageKepanitiaan}
                                            canManageTugas={canManageTugasForDivisi}
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
