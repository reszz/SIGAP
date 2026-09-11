import { useState } from 'react';
import { Head, useForm, router, usePage } from '@inertiajs/react';
import { dashboard as pengurusDashboard } from '@/routes/pengurus';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Toast, confirmDelete } from '@/lib/sweetalert';
import {
    Target,
    CheckCircle2,
    Plus,
    Pencil,
    Trash2,
    ArrowUp,
    ArrowDown,
    Lock,
    Sparkles,
    AlertCircle,
    Calendar,
} from 'lucide-react';

interface MisiItem {
    id: number;
    isi: string;
    urutan: number;
}

interface PeriodeInfo {
    id: number;
    nama: string;
    is_aktif: boolean;
    is_latest: boolean;
}

interface VisiMisiData {
    id: number;
    visi: string;
    misi: MisiItem[];
}

interface Props {
    currentPeriode?: PeriodeInfo | null;
    visiMisi?: VisiMisiData | null;
    canManage: boolean;
    isReadOnly: boolean;
    readOnlyReason?: string | null;
}

export default function VisiMisiIndex({
    currentPeriode,
    visiMisi,
    canManage,
    isReadOnly,
    readOnlyReason,
}: Props) {
    const page = usePage();
    const teamSlug = (page.props as any).currentTeam?.slug ?? 'hmif';

    // ── Form Visi ─────────────────────────────────────────────────────────────
    const {
        data: visiData,
        setData: setVisiData,
        put: putVisi,
        processing: savingVisi,
        errors: visiErrors,
    } = useForm({
        visi: visiMisi?.visi ?? '',
    });

    const handleSaveVisi = (e: React.FormEvent) => {
        e.preventDefault();
        if (isReadOnly) return;

        putVisi(`/${teamSlug}/pengurus/visi-misi`, {
            preserveScroll: true,
            onSuccess: () => {
                Toast.fire({
                    icon: 'success',
                    title: 'Visi organisasi berhasil disimpan.',
                });
            },
            onError: (err) => {
                Toast.fire({
                    icon: 'error',
                    title: err.visi || 'Gagal menyimpan visi.',
                });
            },
        });
    };

    // ── Modal Tambah / Edit Misi ──────────────────────────────────────────────
    const [misiModalOpen, setMisiModalOpen] = useState(false);
    const [editingMisi, setEditingMisi] = useState<MisiItem | null>(null);

    const {
        data: misiData,
        setData: setMisiData,
        post: postMisi,
        patch: patchMisi,
        processing: savingMisi,
        reset: resetMisiForm,
        errors: misiErrors,
    } = useForm({
        isi: '',
    });

    const openAddMisi = () => {
        setEditingMisi(null);
        resetMisiForm();
        setMisiData('isi', '');
        setMisiModalOpen(true);
    };

    const openEditMisi = (misi: MisiItem) => {
        setEditingMisi(misi);
        setMisiData('isi', misi.isi);
        setMisiModalOpen(true);
    };

    const handleSaveMisi = (e: React.FormEvent) => {
        e.preventDefault();
        if (isReadOnly) return;

        if (editingMisi) {
            patchMisi(
                `/${teamSlug}/pengurus/visi-misi/misi/${editingMisi.id}`,
                {
                    preserveScroll: true,
                    onSuccess: () => {
                        setMisiModalOpen(false);
                        Toast.fire({
                            icon: 'success',
                            title: 'Poin misi berhasil diperbarui.',
                        });
                    },
                    onError: (err) => {
                        Toast.fire({
                            icon: 'error',
                            title: err.isi || 'Gagal memperbarui poin misi.',
                        });
                    },
                },
            );
        } else {
            postMisi(`/${teamSlug}/pengurus/visi-misi/misi`, {
                preserveScroll: true,
                onSuccess: () => {
                    setMisiModalOpen(false);
                    resetMisiForm();
                    Toast.fire({
                        icon: 'success',
                        title: 'Poin misi baru berhasil ditambahkan.',
                    });
                },
                onError: (err) => {
                    Toast.fire({
                        icon: 'error',
                        title: err.isi || 'Gagal menambahkan poin misi.',
                    });
                },
            });
        }
    };

    // ── Hapus Misi ────────────────────────────────────────────────────────────
    const handleDeleteMisi = async (misi: MisiItem) => {
        if (isReadOnly) return;

        const confirmed = await confirmDelete(
            `poin misi #${misi.urutan}`,
            'Poin misi ini akan dihapus dan urutan poin lainnya akan disesuaikan secara otomatis.',
        );

        if (confirmed) {
            router.delete(`/${teamSlug}/pengurus/visi-misi/misi/${misi.id}`, {
                preserveScroll: true,
                onSuccess: () => {
                    Toast.fire({
                        icon: 'success',
                        title: 'Poin misi berhasil dihapus.',
                    });
                },
                onError: () => {
                    Toast.fire({
                        icon: 'error',
                        title: 'Gagal menghapus poin misi.',
                    });
                },
            });
        }
    };

    // ── Reorder Misi ──────────────────────────────────────────────────────────
    const handleMoveMisi = (index: number, direction: 'up' | 'down') => {
        if (isReadOnly || !visiMisi?.misi) return;

        const currentList = [...visiMisi.misi];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;

        if (targetIndex < 0 || targetIndex >= currentList.length) return;

        const temp = currentList[index];
        currentList[index] = currentList[targetIndex];
        currentList[targetIndex] = temp;

        const reorderedIds = currentList.map((m) => m.id);

        router.post(
            `/${teamSlug}/pengurus/visi-misi/misi/reorder`,
            { poin_ids: reorderedIds },
            {
                preserveScroll: true,
                onSuccess: () => {
                    Toast.fire({
                        icon: 'success',
                        title: 'Urutan misi berhasil diperbarui.',
                    });
                },
                onError: () => {
                    Toast.fire({
                        icon: 'error',
                        title: 'Gagal mengubah urutan misi.',
                    });
                },
            },
        );
    };

    const misiList = visiMisi?.misi ?? [];

    return (
        <>
            <Head title="Kelola Visi & Misi" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 sm:p-6">
                {/* ── Page Header ── */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="font-display text-2xl font-bold tracking-tight text-[#1E2430] dark:text-[#E6ECF5]">
                            Kelola Visi & Misi
                        </h1>
                        <p className="mt-1 text-xs text-[#727C8E] sm:text-sm dark:text-[#8C97A8]">
                            Atur rumusan visi dan poin-poin misi strategis
                            organisasi untuk periode kepengurusan.
                        </p>
                    </div>

                    {/* Badge Periode */}
                    {currentPeriode && (
                        <div className="flex items-center gap-2">
                            <span
                                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                                    currentPeriode.is_aktif
                                        ? 'border border-[#2E9E82]/30 bg-[#2E9E82]/10 text-[#2E9E82] dark:border-[#2E9E82]/40 dark:bg-[#2E9E82]/20 dark:text-[#34B394]'
                                        : 'border border-[#C97A3E]/30 bg-[#C97A3E]/10 text-[#C97A3E] dark:border-[#C97A3E]/40 dark:bg-[#C97A3E]/20 dark:text-[#E59758]'
                                }`}
                            >
                                <Calendar className="size-3.5" />
                                <span>
                                    Periode: {currentPeriode.nama}{' '}
                                    {currentPeriode.is_aktif
                                        ? '(Aktif)'
                                        : '(Arsip)'}
                                </span>
                            </span>
                        </div>
                    )}
                </div>

                {/* ── Read-Only Notice Banner ── */}
                {isReadOnly && (
                    <div className="flex items-start gap-3 rounded-lg border border-[#C97A3E]/30 bg-[#C97A3E]/10 p-4 text-[#8C4F1A] dark:border-[#C97A3E]/40 dark:bg-[#C97A3E]/20 dark:text-[#E59758]">
                        <Lock className="mt-0.5 size-5 shrink-0" />
                        <div className="text-xs leading-relaxed sm:text-sm">
                            <span className="font-semibold">
                                Mode Read-Only:{' '}
                            </span>
                            {readOnlyReason ??
                                'Anda sedang melihat data periode yang tidak aktif. Perubahan data hanya dapat dilakukan pada periode aktif.'}
                        </div>
                    </div>
                )}

                {/* ── Section 1: Form Visi ── */}
                <div className="rounded-lg border border-[rgba(30,36,48,0.08)] bg-white p-6 shadow-xs dark:border-[rgba(255,255,255,0.08)] dark:bg-[#181E2B]">
                    <div className="flex items-center justify-between border-b border-[rgba(30,36,48,0.06)] pb-4 dark:border-[rgba(255,255,255,0.06)]">
                        <div className="flex items-center gap-2.5">
                            <div className="flex size-8 items-center justify-center rounded-md bg-[#4A5FD1]/12 text-[#4A5FD1] dark:bg-[#4A5FD1]/20 dark:text-[#8FA0FA]">
                                <Target className="size-4" />
                            </div>
                            <div>
                                <h2 className="font-display text-base font-semibold text-[#1E2430] dark:text-[#E6ECF5]">
                                    Visi Utama Organisasi
                                </h2>
                                <p className="text-xs text-[#727C8E] dark:text-[#8C97A8]">
                                    Satu pernyataan visi yang menjadi arah utama
                                    periode ini.
                                </p>
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleSaveVisi} className="mt-5 space-y-4">
                        <div>
                            <Label
                                htmlFor="visi-text"
                                className="mb-1.5 block text-xs font-semibold"
                            >
                                Teks Visi{' '}
                                <span className="text-[#C4514A]">*</span>
                            </Label>
                            <textarea
                                id="visi-text"
                                rows={4}
                                disabled={isReadOnly || savingVisi}
                                value={visiData.visi}
                                onChange={(e) =>
                                    setVisiData('visi', e.target.value)
                                }
                                maxLength={1000}
                                placeholder="Masukkan rumusan visi kepengurusan untuk periode ini..."
                                className="w-full rounded-md border border-[rgba(30,36,48,0.15)] bg-white p-3 text-sm text-[#1E2430] transition focus:border-[#4A5FD1] focus:ring-1 focus:ring-[#4A5FD1] focus:outline-none disabled:bg-[#F6F7F9] disabled:text-[#727C8E] dark:border-[rgba(255,255,255,0.15)] dark:bg-[#121620] dark:text-[#E6ECF5] dark:disabled:bg-[#181E2B] dark:disabled:text-[#8C97A8]"
                            />
                            <div className="mt-1 flex items-center justify-between">
                                {visiErrors.visi ? (
                                    <span className="text-xs text-[#C4514A]">
                                        {visiErrors.visi}
                                    </span>
                                ) : (
                                    <span className="text-[11px] text-[#727C8E] dark:text-[#8C97A8]">
                                        Teks visi akan langsung tampil di
                                        halaman publik Visi & Misi.
                                    </span>
                                )}
                                <span className="text-[11px] text-[#727C8E] dark:text-[#8C97A8]">
                                    {visiData.visi.length}/1000
                                </span>
                            </div>
                        </div>

                        {!isReadOnly && (
                            <div className="flex justify-end">
                                <Button
                                    type="submit"
                                    disabled={
                                        savingVisi || !visiData.visi.trim()
                                    }
                                    className="bg-[#4A5FD1] text-white hover:bg-[#3B4DB8]"
                                >
                                    {savingVisi
                                        ? 'Menyimpan...'
                                        : 'Simpan Visi'}
                                </Button>
                            </div>
                        )}
                    </form>
                </div>

                {/* ── Section 2: List Poin Misi ── */}
                <div className="rounded-lg border border-[rgba(30,36,48,0.08)] bg-white p-6 shadow-xs dark:border-[rgba(255,255,255,0.08)] dark:bg-[#181E2B]">
                    <div className="flex flex-col gap-3 border-b border-[rgba(30,36,48,0.06)] pb-4 sm:flex-row sm:items-center sm:justify-between dark:border-[rgba(255,255,255,0.06)]">
                        <div className="flex items-center gap-2.5">
                            <div className="flex size-8 items-center justify-center rounded-md bg-[#2E9E82]/12 text-[#2E9E82] dark:bg-[#2E9E82]/20 dark:text-[#34B394]">
                                <CheckCircle2 className="size-4" />
                            </div>
                            <div>
                                <h2 className="font-display text-base font-semibold text-[#1E2430] dark:text-[#E6ECF5]">
                                    Poin-Poin Misi Strategis
                                </h2>
                                <p className="text-xs text-[#727C8E] dark:text-[#8C97A8]">
                                    Daftar langkah atau inisiatif strategis
                                    untuk mewujudkan visi.
                                </p>
                            </div>
                        </div>

                        {!isReadOnly && (
                            <Button
                                type="button"
                                onClick={openAddMisi}
                                className="flex items-center gap-1.5 self-start bg-[#4A5FD1] text-white hover:bg-[#3B4DB8] sm:self-auto"
                            >
                                <Plus className="size-4" />
                                <span>Tambah Poin Misi</span>
                            </Button>
                        )}
                    </div>

                    <div className="mt-6 space-y-3">
                        {misiList.length > 0 ? (
                            misiList.map((m, index) => (
                                <div
                                    key={m.id}
                                    className="flex flex-col gap-3 rounded-lg border border-[rgba(30,36,48,0.08)] bg-[#F8F9FB]/60 p-4 transition hover:border-[#4A5FD1]/30 sm:flex-row sm:items-center sm:justify-between dark:border-[rgba(255,255,255,0.08)] dark:bg-[#121620]/60"
                                >
                                    <div className="flex items-start gap-3">
                                        <span className="font-mono-sigap flex size-7 shrink-0 items-center justify-center rounded bg-[#4A5FD1]/12 text-xs font-bold text-[#4A5FD1] dark:bg-[#4A5FD1]/20 dark:text-[#8FA0FA]">
                                            #{m.urutan}
                                        </span>
                                        <p className="text-xs leading-relaxed text-[#1E2430] sm:text-sm dark:text-[#E6ECF5]">
                                            {m.isi}
                                        </p>
                                    </div>

                                    {!isReadOnly && (
                                        <div className="flex shrink-0 items-center gap-1 self-end sm:self-center">
                                            {/* Reorder Up */}
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                disabled={index === 0}
                                                onClick={() =>
                                                    handleMoveMisi(index, 'up')
                                                }
                                                title="Pindah ke Atas"
                                                className="size-8 text-[#727C8E] hover:text-[#1E2430] dark:hover:text-white"
                                            >
                                                <ArrowUp className="size-4" />
                                            </Button>

                                            {/* Reorder Down */}
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                disabled={
                                                    index ===
                                                    misiList.length - 1
                                                }
                                                onClick={() =>
                                                    handleMoveMisi(
                                                        index,
                                                        'down',
                                                    )
                                                }
                                                title="Pindah ke Bawah"
                                                className="size-8 text-[#727C8E] hover:text-[#1E2430] dark:hover:text-white"
                                            >
                                                <ArrowDown className="size-4" />
                                            </Button>

                                            {/* Edit */}
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => openEditMisi(m)}
                                                title="Edit Poin Misi"
                                                className="size-8 text-[#4A5FD1] hover:bg-[#4A5FD1]/10 dark:text-[#8FA0FA]"
                                            >
                                                <Pencil className="size-4" />
                                            </Button>

                                            {/* Delete */}
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                onClick={() =>
                                                    handleDeleteMisi(m)
                                                }
                                                title="Hapus Poin Misi"
                                                className="size-8 text-[#C4514A] hover:bg-[#C4514A]/10"
                                            >
                                                <Trash2 className="size-4" />
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            ))
                        ) : (
                            <div className="rounded-lg border border-dashed border-[rgba(30,36,48,0.15)] p-8 text-center dark:border-[rgba(255,255,255,0.15)]">
                                <Sparkles className="mx-auto size-8 text-[#727C8E] dark:text-[#8C97A8]" />
                                <p className="mt-2 text-sm font-medium text-[#1E2430] dark:text-[#E6ECF5]">
                                    Belum ada poin misi
                                </p>
                                <p className="mt-1 text-xs text-[#727C8E] dark:text-[#8C97A8]">
                                    {isReadOnly
                                        ? 'Tidak ada poin misi yang tercatat pada periode ini.'
                                        : 'Klik tombol "Tambah Poin Misi" di atas untuk menambahkan poin misi baru.'}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Modal Tambah / Edit Poin Misi ── */}
            <Dialog open={misiModalOpen} onOpenChange={setMisiModalOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="font-display">
                            {editingMisi
                                ? `Edit Poin Misi #${editingMisi.urutan}`
                                : 'Tambah Poin Misi Baru'}
                        </DialogTitle>
                    </DialogHeader>

                    <form onSubmit={handleSaveMisi} className="space-y-4 py-2">
                        <div>
                            <Label
                                htmlFor="misi-isi"
                                className="mb-1.5 block text-xs font-semibold"
                            >
                                Teks Poin Misi{' '}
                                <span className="text-[#C4514A]">*</span>
                            </Label>
                            <textarea
                                id="misi-isi"
                                rows={3}
                                required
                                value={misiData.isi}
                                onChange={(e) =>
                                    setMisiData('isi', e.target.value)
                                }
                                maxLength={500}
                                placeholder="cth. Menyelenggarakan program kerja terarah dan berkelanjutan..."
                                className="w-full rounded-md border border-[rgba(30,36,48,0.15)] bg-white p-2.5 text-sm text-[#1E2430] transition focus:border-[#4A5FD1] focus:ring-1 focus:ring-[#4A5FD1] focus:outline-none dark:border-[rgba(255,255,255,0.15)] dark:bg-[#121620] dark:text-[#E6ECF5]"
                            />
                            <div className="mt-1 flex items-center justify-between">
                                {misiErrors.isi ? (
                                    <span className="text-xs text-[#C4514A]">
                                        {misiErrors.isi}
                                    </span>
                                ) : (
                                    <span className="text-[11px] text-[#727C8E] dark:text-[#8C97A8]">
                                        Tuliskan satu poin misi yang spesifik
                                        dan terarah.
                                    </span>
                                )}
                                <span className="text-[11px] text-[#727C8E] dark:text-[#8C97A8]">
                                    {misiData.isi.length}/500
                                </span>
                            </div>
                        </div>

                        <DialogFooter className="gap-2 sm:gap-0">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setMisiModalOpen(false)}
                                disabled={savingMisi}
                            >
                                Batal
                            </Button>
                            <Button
                                type="submit"
                                disabled={savingMisi || !misiData.isi.trim()}
                                className="bg-[#4A5FD1] text-white hover:bg-[#3B4DB8]"
                            >
                                {savingMisi
                                    ? 'Menyimpan...'
                                    : editingMisi
                                      ? 'Simpan Perubahan'
                                      : 'Tambah Poin'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}

VisiMisiIndex.layout = (props: { currentTeam?: { slug: string } | null }) => ({
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
            title: 'Visi & Misi',
            href: '#',
        },
    ],
});