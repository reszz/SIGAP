import { Head, useForm, usePage } from '@inertiajs/react';
import { router } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import {
    Calendar,
    CheckCircle2,
    CircleDollarSign,
    ClipboardList,
    FileText,
    MapPin,
    Plus,
    QrCode,
    Star,
    Trash2,
    Upload,
    UserPlus,
    Users,
} from 'lucide-react';
import anggaranRoutes from '@/routes/pengurus/anggaran';
import dokumentasiPengurusRoutes from '@/routes/pengurus/dokumentasi';
import { download as dokumentasiDownload } from '@/routes/dokumentasi';
import { upsert as evaluasiUpsert } from '@/routes/evaluasi';
import divisiRoutes from '@/routes/pengurus/divisi';
import pengurusSesiRoutes from '@/routes/pengurus/sesi';
import tugasPengurusRoutes from '@/routes/pengurus/tugas';
import tugasRoutes from '@/routes/tugas';
import { show as presensiShow } from '@/routes/presensi';

// ─── Types ────────────────────────────────────────────────────────────────────

type User = {
    id: number;
    name: string;
    nim: string;
    role: string;
};

type Rundown = {
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
    kode_presensi: string;
    status: 'terjadwal' | 'berlangsung' | 'selesai';
    rundown: Rundown[];
};

type Tugas = {
    id: number;
    user_id: number;
    deskripsi_tugas: string;
    status: 'belum' | 'sedang' | 'selesai';
    user: User | null;
};

type Divisi = {
    id: number;
    nama_divisi: string;
    tugas_panitia: Tugas[];
};

type Rsvp = {
    id: number;
    status: 'terdaftar' | 'dibatalkan';
    waktu_daftar: string;
    user: User | null;
};

type Anggaran = {
    id: number;
    jenis: 'pemasukan' | 'pengeluaran';
    sumber_kategori: string;
    estimasi: string;
    realisasi: string | null;
};

type Dokumentasi = {
    id: number;
    tipe: 'foto' | 'notulen';
    file_path: string;
    uploaded_by: User | null;
};

type Evaluasi = {
    id: number;
    rating: number;
    komentar: string | null;
    user: User | null;
};

type Kegiatan = {
    id: number;
    nama: string;
    deskripsi: string | null;
    tipe: 'wajib_hadir' | 'terbuka';
    kuota: number | null;
    warna: string;
    sesi: Sesi[];
    divisi_panitia: Divisi[];
    rsvp: Rsvp[];
    anggaran: Anggaran[];
    dokumentasi: Dokumentasi[];
    evaluasi: Evaluasi[];
};

type AnggotaTeamItem = { id: number; name: string };

type EvaluasiSaya = {
    id: number;
    rating: number;
    komentar: string | null;
} | null;

type Props = {
    kegiatan: Kegiatan;
    canManage: boolean;
    anggotaTeam: AnggotaTeamItem[];
    authUserId: number;
    evaluasiSaya: EvaluasiSaya;
    kegiatanSelesai: boolean;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const statusSesiLabel: Record<Sesi['status'], string> = {
    terjadwal: 'Terjadwal',
    berlangsung: 'Berlangsung',
    selesai: 'Selesai',
};

const statusTugasLabel: Record<Tugas['status'], string> = {
    belum: 'Belum',
    sedang: 'Sedang',
    selesai: 'Selesai',
};

const statusTugasBadge: Record<Tugas['status'], string> = {
    belum: 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400',
    sedang: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    selesai: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
};

function formatDate(value: string): string {
    return new Date(`${value}T00:00:00`).toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });
}

function formatMoney(value: string | number | null): string {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(Number(value ?? 0));
}

function Section({
    title,
    icon,
    children,
}: {
    title: string;
    icon: React.ReactNode;
    children: React.ReactNode;
}) {
    return (
        <section className="rounded-xl border border-sidebar-border/70 bg-white p-5 shadow-sm dark:border-sidebar-border dark:bg-neutral-900">
            <div className="mb-4 flex items-center gap-2">
                <span className="text-indigo-600 dark:text-indigo-400">{icon}</span>
                <h2 className="font-semibold text-neutral-900 dark:text-neutral-100">{title}</h2>
            </div>
            {children}
        </section>
    );
}

// ─── StatusControl — dropdown update status per tugas ─────────────────────────

function StatusControl({ tugas, teamSlug }: { tugas: Tugas; teamSlug: string }) {
    const form = useForm({ status: tugas.status });

    function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
        const newStatus = e.target.value as Tugas['status'];
        form.setData('status', newStatus);
        form.patch(
            tugasRoutes.updateStatus.url({ current_team: teamSlug, tugas: tugas.id }),
            { preserveScroll: true },
        );
    }

    return (
        <select
            value={form.data.status}
            onChange={onChange}
            disabled={form.processing}
            className="rounded-lg border border-neutral-300 bg-white px-2 py-1 text-xs focus:border-indigo-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 disabled:opacity-50"
        >
            <option value="belum">Belum</option>
            <option value="sedang">Sedang</option>
            <option value="selesai">Selesai</option>
        </select>
    );
}

// ─── AssignForm — form assign Member ke Divisi (isolated per Divisi) ──────────

function AssignForm({
    teamSlug,
    kegiatan,
    divisi,
    anggotaTeam,
}: {
    teamSlug: string;
    kegiatan: Kegiatan;
    divisi: Divisi;
    anggotaTeam: AnggotaTeamItem[];
}) {
    const form = useForm({ user_id: '', deskripsi_tugas: '' });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        form.post(
            tugasPengurusRoutes.store.url({
                current_team: teamSlug,
                kegiatan: kegiatan.id,
                divisi: divisi.id,
            }),
            {
                preserveScroll: true,
                onSuccess: () => form.reset(),
            },
        );
    }

    return (
        <form onSubmit={submit} className="mt-3 rounded-lg bg-neutral-50 p-3 dark:bg-neutral-800/50">
            <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-neutral-600 dark:text-neutral-400">
                <UserPlus className="size-3.5" />
                Assign Anggota
            </p>
            <div className="flex flex-col gap-2">
                <select
                    value={form.data.user_id}
                    onChange={(e) => form.setData('user_id', e.target.value)}
                    className="w-full rounded-lg border border-neutral-300 bg-white px-2 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                >
                    <option value="">— Pilih anggota —</option>
                    {anggotaTeam.map((a) => (
                        <option key={a.id} value={a.id}>
                            {a.name}
                        </option>
                    ))}
                </select>
                {form.errors.user_id && (
                    <p className="text-xs text-red-500">{form.errors.user_id}</p>
                )}
                <input
                    type="text"
                    value={form.data.deskripsi_tugas}
                    onChange={(e) => form.setData('deskripsi_tugas', e.target.value)}
                    placeholder="Deskripsi tugas..."
                    maxLength={255}
                    className="w-full rounded-lg border border-neutral-300 bg-white px-2 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                />
                {form.errors.deskripsi_tugas && (
                    <p className="text-xs text-red-500">{form.errors.deskripsi_tugas}</p>
                )}
                <button
                    type="submit"
                    disabled={form.processing}
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                    <Plus className="size-3" />
                    Assign
                </button>
            </div>
        </form>
    );
}

// ─── PanitiaSection ───────────────────────────────────────────────────────────

function PanitiaSection({
    kegiatan,
    canManage,
    anggotaTeam,
    authUserId,
}: {
    kegiatan: Kegiatan;
    canManage: boolean;
    anggotaTeam: AnggotaTeamItem[];
    authUserId: number;
}) {
    const { currentTeam } = usePage().props;
    const teamSlug = currentTeam?.slug ?? '';

    const formDivisi = useForm({ nama_divisi: '' });

    function submitDivisi(e: React.FormEvent) {
        e.preventDefault();
        formDivisi.post(
            divisiRoutes.store.url({ current_team: teamSlug, kegiatan: kegiatan.id }),
            {
                preserveScroll: true,
                onSuccess: () => formDivisi.reset(),
            },
        );
    }

    function hapusDivisi(d: Divisi) {
        router.delete(divisiRoutes.destroy.url({ current_team: teamSlug, divisi: d.id }), {
            preserveScroll: true,
            onBefore: () => window.confirm(`Hapus divisi "${d.nama_divisi}"?`),
        });
    }

    function hapusTugas(t: Tugas) {
        router.delete(
            tugasPengurusRoutes.destroy.url({ current_team: teamSlug, tugas: t.id }),
            {
                preserveScroll: true,
                onBefore: () =>
                    window.confirm(`Hapus tugas "${t.deskripsi_tugas}" dari ${t.user.name}?`),
            },
        );
    }

    return (
        <Section title="Panitia dan Tugas" icon={<ClipboardList className="size-5" />}>
            {/* ── Form tambah Divisi ── */}
            {canManage && (
                <form onSubmit={submitDivisi} className="mb-4 flex gap-2">
                    <div className="flex-1">
                        <input
                            type="text"
                            value={formDivisi.data.nama_divisi}
                            onChange={(e) => formDivisi.setData('nama_divisi', e.target.value)}
                            placeholder="Nama divisi, mis. Acara"
                            maxLength={100}
                            className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                        />
                        {formDivisi.errors.nama_divisi && (
                            <p className="mt-1 text-xs text-red-500">
                                {formDivisi.errors.nama_divisi}
                            </p>
                        )}
                    </div>
                    <button
                        type="submit"
                        disabled={formDivisi.processing}
                        className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                    >
                        <Plus className="size-3.5" />
                        Divisi
                    </button>
                </form>
            )}

            {/* ── Daftar Divisi ── */}
            {kegiatan.divisi_panitia.length === 0 ? (
                <p className="text-sm text-neutral-500">Belum ada divisi panitia.</p>
            ) : (
                <div className="space-y-5">
                    {kegiatan.divisi_panitia.map((d) => {
                        const selesai = d.tugas_panitia.filter(
                            (t) => t.status === 'selesai',
                        ).length;
                        const total = d.tugas_panitia.length;

                        return (
                            <div
                                key={d.id}
                                className="rounded-lg border border-neutral-100 p-3 dark:border-neutral-800"
                            >
                                {/* Header Divisi */}
                                <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-medium text-neutral-900 dark:text-neutral-100">
                                            {d.nama_divisi}
                                        </h3>
                                        {total > 0 && (
                                            <span className="text-xs text-neutral-400">
                                                {selesai}/{total} selesai
                                            </span>
                                        )}
                                    </div>
                                    {canManage && (
                                        <button
                                            type="button"
                                            onClick={() => hapusDivisi(d)}
                                            className="shrink-0 text-red-400 hover:text-red-600"
                                            aria-label={`Hapus divisi ${d.nama_divisi}`}
                                        >
                                            <Trash2 className="size-4" />
                                        </button>
                                    )}
                                </div>

                                {/* Daftar tugas */}
                                {d.tugas_panitia.length > 0 && (
                                    <ul className="mt-2 space-y-2">
                                        {d.tugas_panitia.map((t) => (
                                            <li
                                                key={t.id}
                                                className="flex items-start justify-between gap-3 rounded-lg bg-neutral-50 p-2.5 dark:bg-neutral-800/70"
                                            >
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-sm text-neutral-700 dark:text-neutral-300">
                                                        {t.deskripsi_tugas}
                                                    </p>
                                                    <p className="mt-0.5 text-xs text-neutral-500">
                                                        {t.user?.name ?? '[Anggota dihapus]'}
                                                    </p>
                                                </div>
                                                <div className="flex shrink-0 items-center gap-2">
                                                    {/* Status: dropdown jika pemilik, badge jika lainnya */}
                                                    {t.user_id === authUserId ? (
                                                        <StatusControl
                                                            tugas={t}
                                                            teamSlug={teamSlug}
                                                        />
                                                    ) : (
                                                        <span
                                                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusTugasBadge[t.status]}`}
                                                        >
                                                            {statusTugasLabel[t.status]}
                                                        </span>
                                                    )}
                                                    {/* Hapus tugas (Pengurus) */}
                                                    {canManage && (
                                                        <button
                                                            type="button"
                                                            onClick={() => hapusTugas(t)}
                                                            className="text-red-400 hover:text-red-600"
                                                            aria-label="Hapus tugas"
                                                        >
                                                            <Trash2 className="size-3.5" />
                                                        </button>
                                                    )}
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                )}

                                {/* AssignForm (Pengurus) */}
                                {canManage && (
                                    <AssignForm
                                        teamSlug={teamSlug}
                                        kegiatan={kegiatan}
                                        divisi={d}
                                        anggotaTeam={anggotaTeam}
                                    />
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </Section>
    );
}


// ─── AnggaranSection ─────────────────────────────────────────────────────────

type AnggaranEditState = {
    id: number;
    realisasi: string;
};

function AnggaranSection({
    kegiatan,
    teamSlug,
}: {
    kegiatan: Kegiatan;
    teamSlug: string;
}) {
    const addForm = useForm({
        jenis: 'pengeluaran' as 'pemasukan' | 'pengeluaran',
        sumber_kategori: '',
        estimasi: '',
    });

    const editForm = useForm({ realisasi: '' });
    const [editingId, setEditingId] = useState<number | null>(null);

    function submitAdd(e: React.FormEvent) {
        e.preventDefault();
        addForm.post(
            anggaranRoutes.store.url({ current_team: teamSlug, kegiatan: kegiatan.id }),
            { preserveScroll: true, onSuccess: () => addForm.reset() },
        );
    }

    function startEdit(item: Anggaran) {
        setEditingId(item.id);
        editForm.setData('realisasi', item.realisasi ?? '');
    }

    function submitEdit(id: number) {
        editForm.patch(
            anggaranRoutes.update.url({ current_team: teamSlug, anggaran: id }),
            {
                preserveScroll: true,
                onSuccess: () => setEditingId(null),
            },
        );
    }

    function hapus(id: number) {
        if (!window.confirm('Hapus baris anggaran ini?')) return;
        router.delete(
            anggaranRoutes.destroy.url({ current_team: teamSlug, anggaran: id }),
            { preserveScroll: true },
        );
    }

    // ── Summary calculations
    const pemasukan = kegiatan.anggaran.filter((a) => a.jenis === 'pemasukan');
    const pengeluaran = kegiatan.anggaran.filter((a) => a.jenis === 'pengeluaran');

    const totalEstimasiPemasukan = pemasukan.reduce((s, a) => s + Number(a.estimasi), 0);
    const totalEstimasiPengeluaran = pengeluaran.reduce((s, a) => s + Number(a.estimasi), 0);
    const totalRealisasiPemasukan = pemasukan.reduce((s, a) => s + Number(a.realisasi ?? 0), 0);
    const totalRealisasiPengeluaran = pengeluaran.reduce((s, a) => s + Number(a.realisasi ?? 0), 0);
    const saldoEstimasi = totalEstimasiPemasukan - totalEstimasiPengeluaran;
    const saldoRealisasi = totalRealisasiPemasukan - totalRealisasiPengeluaran;

    const rupiah = (n: number) =>
        new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            maximumFractionDigits: 0,
        }).format(n);

    return (
        <Section title="Anggaran" icon={<CircleDollarSign className="size-5" />}>
            {/* ── Summary ── */}
            {kegiatan.anggaran.length > 0 && (
                <div className="mb-4 grid grid-cols-2 gap-3">
                    <div className="rounded-lg bg-neutral-50 p-3 dark:bg-neutral-800/70">
                        <p className="text-xs text-neutral-500">Est. Pemasukan</p>
                        <p className="mt-0.5 font-semibold text-neutral-900 dark:text-neutral-100">
                            {rupiah(totalEstimasiPemasukan)}
                        </p>
                        <p className="text-xs text-neutral-400">
                            Real: {rupiah(totalRealisasiPemasukan)}
                        </p>
                    </div>
                    <div className="rounded-lg bg-neutral-50 p-3 dark:bg-neutral-800/70">
                        <p className="text-xs text-neutral-500">Est. Pengeluaran</p>
                        <p className="mt-0.5 font-semibold text-neutral-900 dark:text-neutral-100">
                            {rupiah(totalEstimasiPengeluaran)}
                        </p>
                        <p className="text-xs text-neutral-400">
                            Real: {rupiah(totalRealisasiPengeluaran)}
                        </p>
                    </div>
                    <div
                        className={`col-span-2 rounded-lg p-3 ${saldoEstimasi >= 0 ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}
                    >
                        <p className="text-xs text-neutral-500">Saldo (Est. → Real)</p>
                        <p
                            className={`mt-0.5 font-semibold ${saldoEstimasi >= 0 ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}
                        >
                            {rupiah(saldoEstimasi)} → {rupiah(saldoRealisasi)}
                        </p>
                    </div>
                </div>
            )}

            {/* ── Tabel baris anggaran ── */}
            {kegiatan.anggaran.length > 0 && (
                <div className="mb-4 space-y-2">
                    {kegiatan.anggaran.map((item) => (
                        <div
                            key={item.id}
                            className="rounded-lg border border-neutral-100 p-3 dark:border-neutral-800"
                        >
                            <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0 flex-1">
                                    <span
                                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                                            item.jenis === 'pemasukan'
                                                ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                                                : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                                        }`}
                                    >
                                        {item.jenis}
                                    </span>
                                    <p className="mt-1 text-sm font-medium text-neutral-800 dark:text-neutral-100">
                                        {item.sumber_kategori}
                                    </p>
                                    <p className="text-xs text-neutral-500">
                                        Est: {rupiah(Number(item.estimasi))}
                                        {item.realisasi !== null && (
                                            <span className="ml-2">
                                                Real: {rupiah(Number(item.realisasi))}
                                                <span
                                                    className={`ml-1 ${Number(item.realisasi) - Number(item.estimasi) > 0 ? 'text-red-500' : 'text-green-500'}`}
                                                >
                                                    ({Number(item.realisasi) - Number(item.estimasi) >= 0 ? '+' : ''}
                                                    {rupiah(Number(item.realisasi) - Number(item.estimasi))})
                                                </span>
                                            </span>
                                        )}
                                    </p>
                                </div>
                                <div className="flex shrink-0 items-center gap-1">
                                    {editingId === item.id ? (
                                        <div className="flex items-center gap-1">
                                            <input
                                                type="number"
                                                min={0}
                                                step="0.01"
                                                value={editForm.data.realisasi}
                                                onChange={(e) => editForm.setData('realisasi', e.target.value)}
                                                placeholder="Realisasi"
                                                className="w-28 rounded border border-neutral-300 px-2 py-1 text-xs dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => submitEdit(item.id)}
                                                disabled={editForm.processing}
                                                className="rounded bg-indigo-600 px-2 py-1 text-xs text-white hover:bg-indigo-700 disabled:opacity-50"
                                            >
                                                Simpan
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setEditingId(null)}
                                                className="rounded border border-neutral-300 px-2 py-1 text-xs text-neutral-600 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-400"
                                            >
                                                Batal
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => startEdit(item)}
                                            className="rounded border border-neutral-300 px-2 py-1 text-xs text-neutral-600 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-400"
                                        >
                                            Isi Realisasi
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => hapus(item.id)}
                                        className="text-red-400 hover:text-red-600"
                                        aria-label="Hapus baris"
                                    >
                                        <Trash2 className="size-3.5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {kegiatan.anggaran.length === 0 && (
                <p className="mb-4 text-sm text-neutral-400">Belum ada baris anggaran.</p>
            )}

            {/* ── Form tambah baris ── */}
            <form
                onSubmit={submitAdd}
                className="rounded-lg border border-dashed border-neutral-300 p-3 dark:border-neutral-700"
            >
                <p className="mb-2 text-xs font-medium text-neutral-500">Tambah Baris</p>
                <div className="flex flex-col gap-2">
                    <div className="grid grid-cols-2 gap-2">
                        <select
                            value={addForm.data.jenis}
                            onChange={(e) =>
                                addForm.setData('jenis', e.target.value as 'pemasukan' | 'pengeluaran')
                            }
                            className="w-full rounded-lg border border-neutral-300 bg-white px-2 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                        >
                            <option value="pengeluaran">Pengeluaran</option>
                            <option value="pemasukan">Pemasukan</option>
                        </select>
                        <input
                            type="number"
                            min={0}
                            step="0.01"
                            value={addForm.data.estimasi}
                            onChange={(e) => addForm.setData('estimasi', e.target.value)}
                            placeholder="Estimasi (Rp)"
                            className="w-full rounded-lg border border-neutral-300 bg-white px-2 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                        />
                    </div>
                    <input
                        type="text"
                        value={addForm.data.sumber_kategori}
                        onChange={(e) => addForm.setData('sumber_kategori', e.target.value)}
                        placeholder="Sumber/kategori, mis. Kas HMIF, Konsumsi, Sewa Venue"
                        maxLength={100}
                        className="w-full rounded-lg border border-neutral-300 bg-white px-2 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                    />
                    {(addForm.errors.estimasi || addForm.errors.sumber_kategori) && (
                        <p className="text-xs text-red-500">
                            {addForm.errors.estimasi ?? addForm.errors.sumber_kategori}
                        </p>
                    )}
                    <button
                        type="submit"
                        disabled={addForm.processing}
                        className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                    >
                        <Plus className="size-3" />
                        Tambah Baris
                    </button>
                </div>
            </form>
        </Section>
    );
}
// ─── DokumentasiSection ──────────────────────────────────────────────────────

const FOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const DOC_TYPES = ['application/pdf', 'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.oasis.opendocument.text', 'text/plain'];

function fileIcon(tipe: string): string {
    return tipe === 'foto' ? '🖼️' : '📄';
}

function formatBytes(bytes: number): string {
    return bytes < 1024 * 1024
        ? `${(bytes / 1024).toFixed(0)} KB`
        : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function DokumentasiSection({
    kegiatan,
    canManage,
    teamSlug,
}: {
    kegiatan: Kegiatan;
    canManage: boolean;
    teamSlug: string;
}) {
    const [tipe, setTipe] = useState<'foto' | 'notulen'>('foto');
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [fileError, setFileError] = useState<string | null>(null);
    const fileRef = useRef<HTMLInputElement>(null);

    function validateFile(f: File, t: 'foto' | 'notulen'): string | null {
        if (t === 'foto') {
            if (!FOTO_TYPES.includes(f.type)) return 'Foto harus jpg, png, webp, atau gif.';
            if (f.size > 5 * 1024 * 1024) return 'Ukuran foto maksimal 5 MB.';
        } else {
            if (!DOC_TYPES.includes(f.type)) return 'Notulen harus pdf, doc, docx, odt, atau txt.';
            if (f.size > 20 * 1024 * 1024) return 'Ukuran notulen maksimal 20 MB.';
        }
        return null;
    }

    function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const f = e.target.files?.[0] ?? null;
        setFile(f);
        setFileError(f ? validateFile(f, tipe) : null);
    }

    function submitUpload(e: React.FormEvent) {
        e.preventDefault();
        if (!file) return;
        const err = validateFile(file, tipe);
        if (err) { setFileError(err); return; }
        setUploading(true);
        const fd = new FormData();
        fd.append('tipe', tipe);
        fd.append('file', file);
        router.post(
            dokumentasiPengurusRoutes.store.url({ current_team: teamSlug, kegiatan: kegiatan.id }),
            fd,
            {
                preserveScroll: true,
                onSuccess: () => { setFile(null); setFileError(null); if (fileRef.current) fileRef.current.value = ''; },
                onFinish: () => setUploading(false),
            },
        );
    }

    function hapus(id: number) {
        if (!window.confirm('Hapus file ini?')) return;
        router.delete(
            dokumentasiPengurusRoutes.destroy.url({ current_team: teamSlug, dokumentasi: id }),
            { preserveScroll: true },
        );
    }

    const foto    = kegiatan.dokumentasi.filter(d => d.tipe === 'foto');
    const notulen = kegiatan.dokumentasi.filter(d => d.tipe === 'notulen');

    function FileList({ items }: { items: Dokumentasi[] }) {
        if (items.length === 0) return <p className="text-xs text-neutral-400 italic">Belum ada.</p>;
        return (
            <ul className="space-y-2">
                {items.map(d => (
                    <li key={d.id} className="flex items-center justify-between gap-2 rounded-lg border border-neutral-100 p-2.5 dark:border-neutral-800">
                        <a
                            href={dokumentasiDownload.url({ current_team: teamSlug, dokumentasi: d.id })}
                            target="_blank"
                            rel="noreferrer"
                            className="min-w-0 flex-1 truncate text-sm text-indigo-600 hover:underline dark:text-indigo-400"
                        >
                            {fileIcon(d.tipe)} {d.file_path.split('/').pop()}
                        </a>
                        <span className="shrink-0 text-xs text-neutral-400">{d.uploaded_by?.name ?? '-'}</span>
                        {canManage && (
                            <button
                                type="button"
                                onClick={() => hapus(d.id)}
                                className="shrink-0 text-red-400 hover:text-red-600"
                                aria-label="Hapus"
                            >
                                <Trash2 className="size-3.5" />
                            </button>
                        )}
                    </li>
                ))}
            </ul>
        );
    }

    return (
        <Section title="Dokumentasi" icon={<FileText className="size-5" />}>
            {/* ── Grid foto / notulen ── */}
            <div className="mb-4 grid gap-4 sm:grid-cols-2">
                <div>
                    <p className="mb-2 text-xs font-medium text-neutral-500">🖼️ Foto ({foto.length})</p>
                    <FileList items={foto} />
                </div>
                <div>
                    <p className="mb-2 text-xs font-medium text-neutral-500">📄 Notulen ({notulen.length})</p>
                    <FileList items={notulen} />
                </div>
            </div>

            {/* ── Form upload (Pengurus) ── */}
            {canManage && (
                <form
                    onSubmit={submitUpload}
                    className="rounded-lg border border-dashed border-neutral-300 p-4 dark:border-neutral-600"
                    encType="multipart/form-data"
                >
                    <p className="mb-3 text-xs font-medium text-neutral-500">Upload Dokumentasi</p>
                    <div className="flex flex-col gap-3">
                        {/* Tipe */}
                        <div className="flex gap-3">
                            {(['foto', 'notulen'] as const).map(t => (
                                <label key={t} className="flex cursor-pointer items-center gap-1.5 text-sm">
                                    <input
                                        type="radio"
                                        name="tipe"
                                        value={t}
                                        checked={tipe === t}
                                        onChange={() => { setTipe(t); setFile(null); setFileError(null); if (fileRef.current) fileRef.current.value = ''; }}
                                        className="accent-indigo-600"
                                    />
                                    {t === 'foto' ? '🖼️ Foto' : '📄 Notulen'}
                                </label>
                            ))}
                        </div>

                        {/* File picker */}
                        <div>
                            <input
                                ref={fileRef}
                                type="file"
                                accept={tipe === 'foto' ? '.jpg,.jpeg,.png,.webp,.gif' : '.pdf,.doc,.docx,.odt,.txt'}
                                onChange={onFileChange}
                                className="w-full rounded-lg border border-neutral-300 bg-white px-2 py-1.5 text-sm file:mr-2 file:rounded file:border-0 file:bg-indigo-50 file:px-3 file:py-1 file:text-xs file:text-indigo-700 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                            />
                            {file && !fileError && (
                                <p className="mt-1 text-xs text-neutral-400">{file.name} ({formatBytes(file.size)})</p>
                            )}
                            {fileError && (
                                <p className="mt-1 text-xs text-red-500">{fileError}</p>
                            )}
                        </div>

                        <p className="text-xs text-neutral-400">
                            {tipe === 'foto' ? 'jpg/png/webp/gif · maks 5 MB' : 'pdf/doc/docx/odt/txt · maks 20 MB'}
                        </p>

                        <button
                            type="submit"
                            disabled={uploading || !file || !!fileError}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <Upload className="size-3.5" />
                            {uploading ? 'Mengupload...' : 'Upload'}
                        </button>
                    </div>
                </form>
            )}
        </Section>
    );
}
// ─── EvaluasiSection ─────────────────────────────────────────────────────────

function StarButton({ n, selected, onClick }: { n: number; selected: boolean; onClick: () => void }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`text-3xl leading-none transition-colors focus:outline-none ${selected ? 'text-amber-400' : 'text-neutral-300 hover:text-amber-300 dark:text-neutral-600 dark:hover:text-amber-400'}`}
            aria-label={`Rating ${n}`}
        >
            ★
        </button>
    );
}

function EvaluasiSection({
    kegiatan,
    canManage,
    kegiatanSelesai,
    evaluasiSaya,
    teamSlug,
}: {
    kegiatan: Kegiatan;
    canManage: boolean;
    kegiatanSelesai: boolean;
    evaluasiSaya: EvaluasiSaya;
    teamSlug: string;
}) {
    const [rating, setRating] = useState<number>(evaluasiSaya?.rating ?? 0);
    const [hover, setHover] = useState<number>(0);
    const [komentar, setKomentar] = useState<string>(evaluasiSaya?.komentar ?? '');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    // Re-sync ketika evaluasiSaya berubah (setelah Inertia reload)
    useEffect(() => {
        setRating(evaluasiSaya?.rating ?? 0);
        setKomentar(evaluasiSaya?.komentar ?? '');
        setSuccess(false);
    }, [evaluasiSaya]);

    const rataRating =
        kegiatan.evaluasi.length > 0
            ? kegiatan.evaluasi.reduce((s, e) => s + e.rating, 0) / kegiatan.evaluasi.length
            : 0;

    function submit(e: React.FormEvent) {
        e.preventDefault();
        if (rating === 0) return;
        setLoading(true);
        setError(null);
        router.post(
            evaluasiUpsert.url({ current_team: teamSlug, kegiatan: kegiatan.id }),
            { rating, komentar },
            {
                preserveScroll: true,
                onSuccess: () => setSuccess(true),
                onError: (errs) => setError(errs.rating ?? errs.komentar ?? 'Terjadi kesalahan.'),
                onFinish: () => setLoading(false),
            },
        );
    }

    const sudahBeriEvaluasi = !!evaluasiSaya;
    const displayRating = hover > 0 ? hover : rating;

    return (
        <Section title="Evaluasi" icon={<Star className="size-5" />}>
            {/* ── Ringkasan rata-rata ── */}
            {kegiatan.evaluasi.length > 0 ? (
                <div className="mb-4 flex items-center gap-2">
                    <span className="text-xl text-amber-400">{'★'.repeat(Math.round(rataRating))}</span>
                    <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                        {rataRating.toFixed(1)}
                    </span>
                    <span className="text-sm text-neutral-500">/ 5 · {kegiatan.evaluasi.length} evaluasi</span>
                </div>
            ) : (
                <p className="mb-4 text-sm text-neutral-400">Belum ada evaluasi.</p>
            )}

            {/* ── Daftar komentar ── */}
            {kegiatan.evaluasi.length > 0 && (
                <div className="mb-5 divide-y divide-neutral-100 dark:divide-neutral-800">
                    {kegiatan.evaluasi.map((item) => (
                        <div key={item.id} className="py-3 first:pt-0">
                            <div className="flex items-center justify-between gap-2">
                                <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                    {canManage
                                        ? (item.user?.name ?? '[Anggota dihapus]')
                                        : 'Anggota'}
                                </p>
                                <span className="text-sm text-amber-400">{'★'.repeat(item.rating)}</span>
                            </div>
                            {item.komentar && (
                                <p className="mt-1 text-sm text-neutral-500">{item.komentar}</p>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* ── Form evaluasi — hanya Member ── */}
            {!canManage && (
                <div className="border-t border-neutral-100 pt-4 dark:border-neutral-800">
                    {!kegiatanSelesai ? (
                        <p className="rounded-lg bg-neutral-50 p-3 text-sm text-neutral-500 dark:bg-neutral-800">
                            Evaluasi bisa diisi setelah semua sesi selesai.
                        </p>
                    ) : success ? (
                        <div className="flex items-center gap-2 rounded-lg bg-green-50 p-3 text-sm text-green-700 dark:bg-green-900/20 dark:text-green-300">
                            <Star className="size-4 fill-green-500 text-green-500" />
                            Evaluasi berhasil disimpan!
                        </div>
                    ) : (
                        <form onSubmit={submit} className="flex flex-col gap-3">
                            <p className="text-xs font-medium text-neutral-500">
                                {sudahBeriEvaluasi ? 'Edit evaluasimu' : 'Beri evaluasi'}
                            </p>

                            {/* Bintang interaktif */}
                            <div
                                className="flex items-center gap-0.5"
                                onMouseLeave={() => setHover(0)}
                            >
                                {[1, 2, 3, 4, 5].map((n) => (
                                    <StarButton
                                        key={n}
                                        n={n}
                                        selected={n <= displayRating}
                                        onClick={() => setRating(n)}
                                    />
                                ))}
                                <span className="ml-2 text-xs text-neutral-400">
                                    {displayRating > 0 ? `${displayRating}/5` : 'Pilih rating'}
                                </span>
                            </div>
                            {error && <p className="text-xs text-red-500">{error}</p>}

                            {/* Komentar */}
                            <textarea
                                value={komentar}
                                onChange={(e) => setKomentar(e.target.value)}
                                rows={3}
                                placeholder="Komentar (opsional)..."
                                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                            />

                            <button
                                type="submit"
                                disabled={loading || rating === 0}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <Star className="size-3.5" />
                                {loading
                                    ? 'Menyimpan...'
                                    : sudahBeriEvaluasi
                                      ? 'Simpan Perubahan'
                                      : 'Kirim Evaluasi'}
                            </button>
                        </form>
                    )}
                </div>
            )}
        </Section>
    );
}
// ─── Page ─────────────────────────────────────────────────────────────────────

export default function KegiatanShow({
    kegiatan,
    canManage,
    anggotaTeam,
    authUserId,
    evaluasiSaya,
    kegiatanSelesai,
}: Props) {
    const { currentTeam } = usePage().props;
    const teamSlug = currentTeam?.slug ?? '';
    const pesertaTerdaftar = kegiatan.rsvp.filter((item) => item.status === 'terdaftar');
    const totalEstimasi = kegiatan.anggaran.reduce(
        (total, item) => total + Number(item.estimasi),
        0,
    );
    const totalRealisasi = kegiatan.anggaran.reduce(
        (total, item) => total + Number(item.realisasi ?? 0),
        0,
    );
    const rataRating = kegiatan.evaluasi.length
        ? kegiatan.evaluasi.reduce((total, item) => total + item.rating, 0) /
          kegiatan.evaluasi.length
        : 0;

    return (
        <>
            <Head title={kegiatan.nama} />

            <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-4 md:p-6">
                {/* Header */}
                <header className="overflow-hidden rounded-2xl border border-sidebar-border/70 bg-white shadow-sm dark:border-sidebar-border dark:bg-neutral-900">
                    <div className="h-2" style={{ backgroundColor: kegiatan.warna }} />
                    <div className="p-6">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                            <div>
                                <span className="mb-3 inline-flex rounded-full bg-indigo-100 px-3 py-1 text-xs font-medium text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
                                    {kegiatan.tipe === 'terbuka' ? 'Kegiatan Terbuka' : 'Wajib Hadir'}
                                </span>
                                <h1 className="text-2xl font-bold text-neutral-900 md:text-3xl dark:text-neutral-100">
                                    {kegiatan.nama}
                                </h1>
                                <p className="mt-3 max-w-3xl text-sm leading-6 text-neutral-600 dark:text-neutral-400">
                                    {kegiatan.deskripsi || 'Tidak ada deskripsi kegiatan.'}
                                </p>
                            </div>
                            <div className="grid grid-cols-2 gap-3 text-center text-sm">
                                <div className="rounded-lg bg-neutral-100 px-4 py-3 dark:bg-neutral-800">
                                    <strong className="block text-lg text-neutral-900 dark:text-neutral-100">
                                        {kegiatan.sesi.length}
                                    </strong>
                                    <span className="text-neutral-500">Sesi</span>
                                </div>
                                <div className="rounded-lg bg-neutral-100 px-4 py-3 dark:bg-neutral-800">
                                    <strong className="block text-lg text-neutral-900 dark:text-neutral-100">
                                        {kegiatan.tipe === 'terbuka' ? (kegiatan.kuota ?? '-') : 'Semua'}
                                    </strong>
                                    <span className="text-neutral-500">Kuota</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Jadwal dan Rundown */}
                    <Section title="Jadwal dan Rundown" icon={<Calendar className="size-5" />}>
                        <div className="space-y-5">
                            {kegiatan.sesi.map((sesi, index) => (
                                <div key={sesi.id} className="border-l-2 border-indigo-500 pl-4">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <h3 className="font-medium text-neutral-900 dark:text-neutral-100">
                                            Sesi {index + 1}: {formatDate(sesi.tanggal)}
                                        </h3>
                                        <span className="rounded-full bg-neutral-100 px-2 py-1 text-xs text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
                                            {statusSesiLabel[sesi.status]}
                                        </span>
                                    </div>
                                    <p className="mt-2 flex items-center gap-2 text-sm text-neutral-500">
                                        <Calendar className="size-4" />
                                        {sesi.waktu_mulai.slice(0, 5)} - {sesi.waktu_selesai.slice(0, 5)}
                                    </p>
                                    <p className="mt-1 flex items-center gap-2 text-sm text-neutral-500">
                                        <MapPin className="size-4" />
                                        {sesi.lokasi}
                                    </p>
                                    {sesi.rundown.length > 0 && (
                                        <ol className="mt-3 space-y-2 border-t border-neutral-100 pt-3 dark:border-neutral-800">
                                            {sesi.rundown.map((item) => (
                                                <li key={item.id} className="flex gap-3 text-sm">
                                                    <time className="w-12 shrink-0 font-medium text-indigo-600 dark:text-indigo-400">
                                                        {item.waktu.slice(0, 5)}
                                                    </time>
                                                    <span className="text-neutral-600 dark:text-neutral-400">
                                                        {item.uraian_acara}
                                                    </span>
                                                </li>
                                            ))}
                                        </ol>
                                    )}

                                    {/* Presensi per sesi */}
                                    <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-neutral-100 pt-3 dark:border-neutral-800">
                                        <span className="flex items-center gap-1 text-xs text-neutral-400">
                                            <QrCode className="size-3" />
                                            Kode: <span className="font-mono font-medium text-neutral-600 dark:text-neutral-300">{sesi.kode_presensi}</span>
                                        </span>
                                        {!canManage && (
                                            <a
                                                href={presensiShow.url({ current_team: teamSlug, kode: sesi.kode_presensi })}
                                                className="inline-flex items-center gap-1 rounded-lg bg-green-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-green-700"
                                            >
                                                <CheckCircle2 className="size-3" />
                                                Isi Presensi
                                            </a>
                                        )}
                                        {canManage && (
                                            <a
                                                href={pengurusSesiRoutes.presensi.index.url({ current_team: teamSlug, sesi: sesi.id })}
                                                className="inline-flex items-center gap-1 rounded-lg border border-neutral-300 px-2.5 py-1 text-xs font-medium text-neutral-600 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800"
                                            >
                                                <Users className="size-3" />
                                                Lihat Rekap
                                            </a>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Section>

                    {/* Panitia dan Tugas */}
                    <PanitiaSection
                        kegiatan={kegiatan}
                        canManage={canManage}
                        anggotaTeam={anggotaTeam}
                        authUserId={authUserId}
                    />

                    {/* RSVP */}
                    <Section title="RSVP Peserta" icon={<Users className="size-5" />}>
                        {kegiatan.tipe !== 'terbuka' ? (
                            <p className="text-sm text-neutral-500">
                                Kegiatan wajib hadir, tidak menggunakan RSVP.
                            </p>
                        ) : (
                            <>
                                <p className="mb-3 text-sm text-neutral-600 dark:text-neutral-400">
                                    {pesertaTerdaftar.length} peserta terdaftar dari{' '}
                                    {kegiatan.kuota ?? '-'} kuota.
                                </p>
                                <div className="space-y-2">
                                    {pesertaTerdaftar.map((item) => (
                                        <div
                                            key={item.id}
                                            className="flex items-center justify-between rounded-lg bg-neutral-50 p-3 text-sm dark:bg-neutral-800/70"
                                        >
                                            <span className="text-neutral-700 dark:text-neutral-300">
                                                {item.user.name}
                                            </span>
                                            <span className="text-xs text-neutral-500">
                                                {item.user.nim}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </Section>

                    {/* Anggaran — hanya Pengurus */}
                    {canManage && (
                        <AnggaranSection
                            kegiatan={kegiatan}
                            teamSlug={teamSlug}
                        />
                    )}

                    {/* Dokumentasi */}
                    <DokumentasiSection
                        kegiatan={kegiatan}
                        canManage={canManage}
                        teamSlug={teamSlug}
                    />
                    {/* Evaluasi */}
                    <EvaluasiSection
                        kegiatan={kegiatan}
                        canManage={canManage}
                        kegiatanSelesai={kegiatanSelesai}
                        evaluasiSaya={evaluasiSaya}
                        teamSlug={teamSlug}
                    />                </div>
            </div>
        </>
    );
}
