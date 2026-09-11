import { useEffect, useRef, useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import {
    Calendar,
    CheckCircle2,
    Clock,
    FileText,
    Image,
    Loader2,
    Mail,
    MapPin,
    Star,
    Users,
    Wallet,
    X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { download as dokumentasiDownload } from '@/routes/dokumentasi';
import { index as panitiaIndex } from '@/routes/panitia';
import { index as anggaranIndex } from '@/routes/anggaran';
import { show as kegiatanShow } from '@/routes/kegiatan';
import StatusStiker from '@/components/ui/status-stiker';

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
    kode_presensi: string;
    status: 'terjadwal' | 'berlangsung' | 'selesai';
    rundown: RundownItem[];
};

type KepanitiaanItem = {
    id: number;
    kegiatan_id: number;
    user_id: number;
    jabatan: string;
    user: { id: number; name: string } | null;
};

type TugasItem = {
    id: number;
    kegiatan_id: number;
    jabatan: string;
    deskripsi_tugas: string;
    status: 'belum' | 'sedang' | 'selesai';
    pic?: { id: number; name: string } | null;
};

type AnggaranItem = {
    id: number;
    jenis: 'pemasukan' | 'pengeluaran';
    sumber_kategori: string;
    estimasi: string;
    realisasi: string | null;
};

type DokumentasiItem = {
    id: number;
    tipe: 'foto' | 'notulen';
    file_path: string;
    uploaded_by: { id: number; name: string } | null;
};

type EvaluasiItem = {
    id: number;
    rating: number;
    komentar: string | null;
    user: { id: number; name: string } | null;
};

type SuratItem = {
    id: number;
    tipe: 'masuk' | 'keluar';
    nomor_surat: string;
    perihal: string;
    tanggal_surat: string | null;
};

type KegiatanDetail = {
    id: number;
    nama: string;
    deskripsi: string | null;
    tipe: 'wajib_hadir' | 'terbuka';
    kuota: number | null;
    warna: string;
    sesi: Sesi[];
    kepanitiaan?: KepanitiaanItem[];
    tugas?: TugasItem[];
    rsvp?: {
        id: number;
        status: string;
        user: { id: number; name: string } | null;
    }[];
    anggaran?: AnggaranItem[];
    dokumentasi?: DokumentasiItem[];
    evaluasi?: EvaluasiItem[];
    surat?: SuratItem[];
    canManageAnggaran?: boolean;
};

type Props = {
    kegiatanId: number | null;
    onClose: () => void;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const TUGAS_STATUS_CLS: Record<'belum' | 'sedang' | 'selesai', string> = {
    belum: 'bg-[#727C8E]/12 text-[#727C8E] dark:bg-[#727C8E]/20 dark:text-[#8C97A8]',
    sedang: 'bg-[#4A5FD1]/12 text-[#4A5FD1] dark:bg-[#4A5FD1]/20 dark:text-[#8FA0FA]',
    selesai:
        'bg-[#2E9E82]/12 text-[#2E9E82] dark:bg-[#2E9E82]/20 dark:text-[#34B394]',
};

const JABATAN_LABEL: Record<string, string> = {
    ketua_pelaksana: 'Ketua Pelaksana',
    bendahara: 'Bendahara',
    sekretaris: 'Sekretaris',
    div_acara: 'Divisi Acara',
    div_humas: 'Divisi Humas',
    div_pdd: 'Divisi PDD',
    div_logistik: 'Divisi Logistik',
};

function formatTanggal(iso: string) {
    return new Date(iso + 'T00:00:00').toLocaleDateString('id-ID', {
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

// ─── Tab definitions ─────────────────────────────────────────────────────────

type TabId =
    | 'info'
    | 'rundown'
    | 'panitia'
    | 'anggaran'
    | 'evaluasi'
    | 'dokumentasi'
    | 'surat';

// ─── Tab Content Components ───────────────────────────────────────────────────

function TabInfo({
    kegiatan,
    teamSlug,
}: {
    kegiatan: KegiatanDetail;
    teamSlug: string;
}) {
    const pesertaTerdaftar = (kegiatan.rsvp ?? []).filter(
        (r) => r.status === 'terdaftar',
    ).length;

    return (
        <div className="flex flex-col gap-4">
            {/* Deskripsi */}
            <div className="rounded-lg border border-[rgba(30,36,48,0.08)] bg-white p-4 dark:border-[rgba(255,255,255,0.08)] dark:bg-[#181E2B]">
                <p className="mb-1 text-[11px] font-semibold tracking-wider text-[#727C8E] uppercase dark:text-[#8C97A8]">
                    Deskripsi
                </p>
                <p className="text-xs leading-relaxed text-[#1E2430] dark:text-[#E6ECF5]">
                    {kegiatan.deskripsi || (
                        <span className="text-[#727C8E]/70 italic dark:text-[#8C97A8]/70">
                            Tidak ada deskripsi.
                        </span>
                    )}
                </p>
            </div>

            {/* Sesi Kegiatan */}
            <div className="rounded-lg border border-[rgba(30,36,48,0.08)] bg-white p-4 dark:border-[rgba(255,255,255,0.08)] dark:bg-[#181E2B]">
                <p className="mb-3 text-[11px] font-semibold tracking-wider text-[#727C8E] uppercase dark:text-[#8C97A8]">
                    Sesi Kegiatan ({kegiatan.sesi.length})
                </p>
                <div className="flex flex-col gap-2.5">
                    {kegiatan.sesi.map((sesi, idx) => (
                        <div
                            key={sesi.id}
                            className="rounded-md border border-[rgba(30,36,48,0.08)] bg-[#F6F7F9]/50 p-3 dark:border-[rgba(255,255,255,0.08)] dark:bg-[#21293A]/40"
                        >
                            <div className="mb-2 flex items-start justify-between gap-2">
                                <p className="text-xs font-semibold text-[#1E2430] dark:text-[#E6ECF5]">
                                    Sesi {idx + 1}
                                </p>
                                <StatusStiker
                                    className="rounded bg-gray-300 text-[#1E2430] dark:bg-gray-900 dark:text-[#E6ECF5]"
                                    status={sesi.status}
                                />
                            </div>
                            <div className="flex flex-col gap-1 text-xs text-[#727C8E] dark:text-[#8C97A8]">
                                <span className="font-mono-sigap flex items-center gap-1.5 text-[11px]">
                                    <Calendar className="size-3.5 shrink-0 text-[#4A5FD1] dark:text-[#8FA0FA]" />
                                    {formatTanggal(sesi.tanggal)}
                                </span>
                                <span className="font-mono-sigap flex items-center gap-1.5 text-[11px]">
                                    <Clock className="size-3.5 shrink-0 text-[#4A5FD1] dark:text-[#8FA0FA]" />
                                    {sesi.waktu_mulai.slice(0, 5)} –{' '}
                                    {sesi.waktu_selesai.slice(0, 5)} WIB
                                </span>
                                <span className="flex items-center gap-1.5 text-[11px]">
                                    <MapPin className="size-3.5 shrink-0 text-[#4A5FD1] dark:text-[#8FA0FA]" />
                                    {sesi.lokasi}
                                </span>
                            </div>
                            {sesi.status === 'berlangsung' && (
                                <a
                                    href={`/${teamSlug}/presensi/${sesi.kode_presensi}`}
                                    className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-[#2E9E82] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#26856E]"
                                >
                                    <CheckCircle2 className="size-3.5" />
                                    Isi Presensi Sekarang
                                </a>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Stat mini: Terdaftar */}
            {kegiatan.tipe === 'terbuka' && (
                <div className="rounded-lg border border-[rgba(30,36,48,0.08)] bg-white p-4 text-center dark:border-[rgba(255,255,255,0.08)] dark:bg-[#181E2B]">
                    <p className="font-mono-sigap font-display text-2xl font-semibold text-[#4A5FD1] dark:text-[#8FA0FA]">
                        {pesertaTerdaftar}
                    </p>
                    <p className="mt-0.5 text-xs text-[#727C8E] dark:text-[#8C97A8]">
                        Peserta Terdaftar (RSVP)
                    </p>
                </div>
            )}
        </div>
    );
}

function TabRundown({ kegiatan }: { kegiatan: KegiatanDetail }) {
    const hasSomeRundown = kegiatan.sesi.some((s) => s.rundown.length > 0);

    if (!hasSomeRundown) {
        return (
            <p className="py-6 text-center text-xs text-[#727C8E] dark:text-[#8C97A8]">
                Belum ada data susunan rundown.
            </p>
        );
    }

    return (
        <div className="flex flex-col gap-4">
            {kegiatan.sesi.map((sesi, idx) => (
                <div key={sesi.id}>
                    <p className="mb-2 text-[11px] font-semibold tracking-wider text-[#727C8E] uppercase dark:text-[#8C97A8]">
                        Sesi {idx + 1} — {formatTanggal(sesi.tanggal)}
                    </p>
                    {sesi.rundown.length === 0 ? (
                        <p className="text-xs text-[#727C8E]/70 italic dark:text-[#8C97A8]/70">
                            Belum ada rundown untuk sesi ini.
                        </p>
                    ) : (
                        <ul className="flex flex-col divide-y divide-[rgba(30,36,48,0.06)] rounded-lg border border-[rgba(30,36,48,0.08)] bg-white dark:divide-[rgba(255,255,255,0.06)] dark:border-[rgba(255,255,255,0.08)] dark:bg-[#181E2B]">
                            {[...sesi.rundown]
                                .sort((a, b) => a.urutan - b.urutan)
                                .map((r) => (
                                    <li
                                        key={r.id}
                                        className="flex items-start gap-3 px-3.5 py-2.5 text-xs"
                                    >
                                        <span className="font-mono-sigap w-12 shrink-0 font-semibold text-[#4A5FD1] dark:text-[#8FA0FA]">
                                            {r.waktu.slice(0, 5)}
                                        </span>
                                        <span className="min-w-0 flex-1 break-words text-[#1E2430] dark:text-[#E6ECF5]">
                                            {r.uraian_acara}
                                        </span>
                                    </li>
                                ))}
                        </ul>
                    )}
                </div>
            ))}
        </div>
    );
}

function TabPanitia({
    kegiatan,
    teamSlug,
    canManage,
}: {
    kegiatan: KegiatanDetail;
    teamSlug: string;
    canManage: boolean;
}) {
    const kepanitiaan = kegiatan.kepanitiaan ?? [];
    const tugas = kegiatan.tugas ?? [];

    return (
        <div className="flex flex-col gap-4">
            {kepanitiaan.length === 0 && tugas.length === 0 ? (
                <p className="py-6 text-center text-xs text-[#727C8E] dark:text-[#8C97A8]">
                    Belum ada data kepanitiaan.
                </p>
            ) : (
                <>
                    {/* Struktur Panitia */}
                    {kepanitiaan.length > 0 && (
                        <div className="rounded-lg border border-[rgba(30,36,48,0.08)] bg-white p-4 dark:border-[rgba(255,255,255,0.08)] dark:bg-[#181E2B]">
                            <p className="mb-3 text-[11px] font-semibold tracking-wider text-[#727C8E] uppercase dark:text-[#8C97A8]">
                                Struktur Panitia ({kepanitiaan.length})
                            </p>
                            <div className="flex flex-col divide-y divide-[rgba(30,36,48,0.06)] dark:divide-[rgba(255,255,255,0.06)]">
                                {kepanitiaan.map((p) => (
                                    <div
                                        key={p.id}
                                        className="flex items-center justify-between py-2 text-xs"
                                    >
                                        <span className="font-medium text-[#727C8E] dark:text-[#8C97A8]">
                                            {JABATAN_LABEL[p.jabatan] ??
                                                p.jabatan}
                                        </span>
                                        <span className="font-semibold text-[#1E2430] dark:text-[#E6ECF5]">
                                            {p.user?.name ?? '-'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Daftar Tugas */}
                    {tugas.length > 0 && (
                        <div className="rounded-lg border border-[rgba(30,36,48,0.08)] bg-white p-4 dark:border-[rgba(255,255,255,0.08)] dark:bg-[#181E2B]">
                            <div className="mb-3 flex items-center justify-between">
                                <p className="text-[11px] font-semibold tracking-wider text-[#727C8E] uppercase dark:text-[#8C97A8]">
                                    Tugas Panitia
                                </p>
                                <span className="font-mono-sigap text-[11px] text-[#727C8E] dark:text-[#8C97A8]">
                                    {
                                        tugas.filter(
                                            (t) => t.status === 'selesai',
                                        ).length
                                    }
                                    /{tugas.length} selesai
                                </span>
                            </div>
                            <ul className="flex flex-col gap-2">
                                {tugas.map((t) => (
                                    <li
                                        key={t.id}
                                        className="flex items-start justify-between gap-2 rounded-md border border-[rgba(30,36,48,0.06)] bg-[#F6F7F9]/50 p-2.5 dark:border-[rgba(255,255,255,0.06)] dark:bg-[#21293A]/40"
                                    >
                                        <div className="min-w-0 flex-1">
                                            <p className="text-xs font-medium text-[#1E2430] dark:text-[#E6ECF5]">
                                                {t.deskripsi_tugas}
                                            </p>
                                            <p className="mt-0.5 text-[10px] text-[#727C8E] dark:text-[#8C97A8]">
                                                {JABATAN_LABEL[t.jabatan] ??
                                                    t.jabatan}
                                                {t.pic &&
                                                    ` · PIC: ${t.pic.name}`}
                                            </p>
                                        </div>
                                        <span
                                            className={cn(
                                                'shrink-0 rounded-md px-2 py-0.5 text-[10px] font-medium',
                                                TUGAS_STATUS_CLS[t.status],
                                            )}
                                        >
                                            {t.status === 'selesai'
                                                ? 'Selesai'
                                                : t.status === 'sedang'
                                                  ? 'Sedang Dikerjakan'
                                                  : 'Belum'}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </>
            )}
            {canManage && (
                <Link
                    href={panitiaIndex.url({ current_team: teamSlug })}
                    className="flex items-center justify-center gap-1.5 rounded-lg border border-[rgba(30,36,48,0.12)] bg-white px-4 py-2 text-xs font-semibold text-[#4A5FD1] transition hover:bg-[#F6F7F9] dark:border-[rgba(255,255,255,0.12)] dark:bg-[#181E2B] dark:text-[#8FA0FA] dark:hover:bg-[#21293A]"
                >
                    Kelola Kepanitiaan Lengkap →
                </Link>
            )}
        </div>
    );
}

function TabAnggaran({
    kegiatan,
    teamSlug,
    canManage,
}: {
    kegiatan: KegiatanDetail;
    teamSlug: string;
    canManage: boolean;
}) {
    const anggaran = kegiatan.anggaran ?? [];
    const pemasukan = anggaran.filter((a) => a.jenis === 'pemasukan');
    const pengeluaran = anggaran.filter((a) => a.jenis === 'pengeluaran');

    const totalEstPemasukan = pemasukan.reduce(
        (s, a) => s + Number(a.estimasi),
        0,
    );
    const totalEstPengeluaran = pengeluaran.reduce(
        (s, a) => s + Number(a.estimasi),
        0,
    );
    const totalRealPemasukan = pemasukan.reduce(
        (s, a) => s + Number(a.realisasi ?? 0),
        0,
    );
    const totalRealPengeluaran = pengeluaran.reduce(
        (s, a) => s + Number(a.realisasi ?? 0),
        0,
    );
    const saldoEst = totalEstPemasukan - totalEstPengeluaran;

    return (
        <div className="flex flex-col gap-4">
            {anggaran.length === 0 ? (
                <p className="py-6 text-center text-xs text-[#727C8E] dark:text-[#8C97A8]">
                    Belum ada data anggaran.
                </p>
            ) : (
                <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg border border-[rgba(30,36,48,0.08)] bg-white p-3 dark:border-[rgba(255,255,255,0.08)] dark:bg-[#181E2B]">
                        <p className="text-[11px] text-[#727C8E] dark:text-[#8C97A8]">
                            Est. Pemasukan
                        </p>
                        <p className="font-mono-sigap mt-0.5 font-display text-sm font-semibold text-[#2E9E82] dark:text-[#34B394]">
                            {formatMoney(totalEstPemasukan)}
                        </p>
                        <p className="font-mono-sigap text-[10px] text-[#727C8E] dark:text-[#8C97A8]">
                            Real: {formatMoney(totalRealPemasukan)}
                        </p>
                    </div>
                    <div className="rounded-lg border border-[rgba(30,36,48,0.08)] bg-white p-3 dark:border-[rgba(255,255,255,0.08)] dark:bg-[#181E2B]">
                        <p className="text-[11px] text-[#727C8E] dark:text-[#8C97A8]">
                            Est. Pengeluaran
                        </p>
                        <p className="font-mono-sigap mt-0.5 font-display text-sm font-semibold text-[#C4514A] dark:text-[#D9615A]">
                            {formatMoney(totalEstPengeluaran)}
                        </p>
                        <p className="font-mono-sigap text-[10px] text-[#727C8E] dark:text-[#8C97A8]">
                            Real: {formatMoney(totalRealPengeluaran)}
                        </p>
                    </div>
                    <div
                        className={cn(
                            'col-span-2 rounded-lg border p-3',
                            saldoEst >= 0
                                ? 'border-[#2E9E82]/30 bg-[#2E9E82]/10 dark:bg-[#2E9E82]/20'
                                : 'border-[#C4514A]/30 bg-[#C4514A]/10 dark:bg-[#C4514A]/20',
                        )}
                    >
                        <p className="text-[11px] text-[#727C8E] dark:text-[#8C97A8]">
                            Saldo Estimasi
                        </p>
                        <p
                            className={cn(
                                'font-mono-sigap mt-0.5 font-display text-lg font-semibold',
                                saldoEst >= 0
                                    ? 'text-[#2E9E82] dark:text-[#34B394]'
                                    : 'text-[#C4514A] dark:text-[#D9615A]',
                            )}
                        >
                            {formatMoney(saldoEst)}
                        </p>
                    </div>
                </div>
            )}
            {canManage && (
                <Link
                    href={anggaranIndex.url({ current_team: teamSlug })}
                    className="flex items-center justify-center gap-1.5 rounded-lg border border-[rgba(30,36,48,0.12)] bg-white px-4 py-2 text-xs font-semibold text-[#4A5FD1] transition hover:bg-[#F6F7F9] dark:border-[rgba(255,255,255,0.12)] dark:bg-[#181E2B] dark:text-[#8FA0FA] dark:hover:bg-[#21293A]"
                >
                    Kelola Anggaran Lengkap →
                </Link>
            )}
        </div>
    );
}

function TabEvaluasi({
    kegiatan,
    canManage,
}: {
    kegiatan: KegiatanDetail;
    canManage: boolean;
}) {
    const evaluasi = kegiatan.evaluasi ?? [];
    const anonymousLabel = 'Anonim';

    return (
        <div className="flex flex-col gap-3">
            {evaluasi.length === 0 ? (
                <p className="py-6 text-center text-xs text-[#727C8E] dark:text-[#8C97A8]">
                    Belum ada ulasan evaluasi.
                </p>
            ) : (
                <div className="flex flex-col gap-2.5">
                    {evaluasi.map((e) => (
                        <div
                            key={e.id}
                            className="rounded-lg border border-[rgba(30,36,48,0.08)] bg-white p-3 dark:border-[rgba(255,255,255,0.08)] dark:bg-[#181E2B]"
                        >
                            <div className="flex items-center justify-between">
                                <p className="text-xs font-semibold text-[#1E2430] dark:text-[#E6ECF5]">
                                    {anonymousLabel}
                                </p>
                                <span className="font-mono-sigap text-xs font-semibold text-[#B8862E] dark:text-[#D4A142]">
                                    {'★'.repeat(e.rating)}
                                </span>
                            </div>
                            {e.komentar && (
                                <p className="mt-1.5 text-xs leading-relaxed text-[#727C8E] dark:text-[#8C97A8]">
                                    "{e.komentar}"
                                </p>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function TabDokumentasi({
    kegiatan,
    teamSlug,
}: {
    kegiatan: KegiatanDetail;
    teamSlug: string;
}) {
    const dokumentasi = kegiatan.dokumentasi ?? [];

    return (
        <div className="flex flex-col gap-3">
            {dokumentasi.length === 0 ? (
                <p className="py-6 text-center text-xs text-[#727C8E] dark:text-[#8C97A8]">
                    Belum ada berkas dokumentasi.
                </p>
            ) : (
                <div className="flex flex-col gap-2">
                    {dokumentasi.map((d) => (
                        <a
                            key={d.id}
                            href={dokumentasiDownload.url({
                                current_team: teamSlug,
                                dokumentasi: d.id,
                            })}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center justify-between rounded-lg border border-[rgba(30,36,48,0.08)] bg-white p-3 text-xs transition hover:border-[#4A5FD1]/40 dark:border-[rgba(255,255,255,0.08)] dark:bg-[#181E2B]"
                        >
                            <span className="truncate font-medium text-[#1E2430] dark:text-[#E6ECF5]">
                                {d.file_path.split('/').pop()}
                            </span>
                            <span className="shrink-0 font-semibold text-[#4A5FD1] dark:text-[#8FA0FA]">
                                Unduh
                            </span>
                        </a>
                    ))}
                </div>
            )}
        </div>
    );
}

function TabSurat({ kegiatan }: { kegiatan: KegiatanDetail }) {
    const surat = kegiatan.surat ?? [];

    return (
        <div className="flex flex-col gap-3">
            {surat.length === 0 ? (
                <p className="py-6 text-center text-xs text-[#727C8E] dark:text-[#8C97A8]">
                    Belum ada surat menyurat.
                </p>
            ) : (
                <ul className="flex flex-col gap-2">
                    {surat.map((s) => (
                        <li
                            key={s.id}
                            className="rounded-lg border border-[rgba(30,36,48,0.08)] bg-white p-3 dark:border-[rgba(255,255,255,0.08)] dark:bg-[#181E2B]"
                        >
                            <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-xs font-semibold text-[#1E2430] dark:text-[#E6ECF5]">
                                        {s.perihal}
                                    </p>
                                    <p className="font-mono-sigap mt-0.5 text-[11px] text-[#727C8E] dark:text-[#8C97A8]">
                                        {s.nomor_surat} ·{' '}
                                        {s.tanggal_surat ?? '-'}
                                    </p>
                                </div>
                                <span
                                    className={cn(
                                        'shrink-0 rounded-md px-2 py-0.5 text-[10px] font-medium',
                                        s.tipe === 'masuk'
                                            ? 'bg-[#4A5FD1]/12 text-[#4A5FD1] dark:bg-[#4A5FD1]/20 dark:text-[#8FA0FA]'
                                            : 'bg-[#2E9E82]/12 text-[#2E9E82] dark:bg-[#2E9E82]/20 dark:text-[#34B394]',
                                    )}
                                >
                                    {s.tipe}
                                </span>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

// ─── Main EventDetailCard ─────────────────────────────────────────────────────

export default function EventDetailCard({ kegiatanId, onClose }: Props) {
    const { auth, currentTeam } = usePage().props;
    const isPengurus = auth.user.role === 'pengurus';
    const teamSlug = currentTeam?.slug ?? '';

    const [kegiatan, setKegiatan] = useState<KegiatanDetail | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<TabId>('info');

    const panelRef = useRef<HTMLDivElement>(null);

    // Fetch detail kegiatan
    useEffect(() => {
        if (!kegiatanId) return;
        setLoading(true);
        setError(null);
        setKegiatan(null);
        setActiveTab('info');

        fetch(`/${teamSlug}/kegiatan/${kegiatanId}`, {
            headers: { Accept: 'application/json' },
        })
            .then((r) => r.json())
            .then((data: KegiatanDetail) => {
                setKegiatan(data);
            })
            .catch(() => setError('Gagal memuat detail kegiatan.'))
            .finally(() => setLoading(false));
    }, [kegiatanId, teamSlug]);

    // Close on Esc
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [onClose]);

    if (!kegiatanId) return null;

    const canManageAnggaran = kegiatan?.canManageAnggaran ?? isPengurus;

    const allTabs: { id: TabId; label: string; icon: React.ElementType }[] = [
        { id: 'info', label: 'Info', icon: FileText },
        { id: 'rundown', label: 'Rundown', icon: Clock },
        { id: 'panitia', label: 'Panitia', icon: Users },
        ...(canManageAnggaran
            ? [{ id: 'anggaran' as TabId, label: 'Anggaran', icon: Wallet }]
            : []),
        { id: 'evaluasi', label: 'Evaluasi', icon: Star },
        { id: 'dokumentasi', label: 'Dokumentasi', icon: Image },
        { id: 'surat', label: 'Surat', icon: Mail },
    ];

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-40 bg-black/30 backdrop-blur-xs"
                onClick={onClose}
            />

            {/* Panel */}
            <div
                ref={panelRef}
                className="fixed inset-y-0 right-0 z-50 flex w-full max-w-full flex-col overflow-hidden bg-[#F6F7F9] shadow-2xl sm:max-w-lg sm:border-l sm:border-[rgba(30,36,48,0.08)] md:max-w-xl dark:bg-[#0E121A] sm:dark:border-[rgba(255,255,255,0.08)]"
            >
                {/* ── Header ── */}
                <div
                    className="shrink-0 border-b border-[rgba(30,36,48,0.08)] p-5 text-white dark:border-[rgba(255,255,255,0.08)]"
                    style={{ backgroundColor: kegiatan?.warna ?? '#4A5FD1' }}
                >
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                                <span className="rounded-md bg-white/20 px-2 py-0.5 text-[10px] font-semibold tracking-wider text-white uppercase">
                                    {kegiatan?.tipe === 'terbuka'
                                        ? 'Terbuka'
                                        : 'Wajib Hadir'}
                                </span>
                            </div>
                            <h2 className="mt-2 font-display text-lg leading-tight font-semibold text-white">
                                {loading
                                    ? 'Memuat...'
                                    : (kegiatan?.nama ?? 'Detail Kegiatan')}
                            </h2>
                        </div>
                        <div className="flex items-center gap-2">
                            {kegiatan && kegiatan.sesi?.[0] && (
                                <StatusStiker
                                    className="rounded bg-gray-300 text-[#1E2430] dark:bg-gray-500 dark:text-[#E6ECF5]"
                                    status={kegiatan.sesi[0].status}
                                />
                            )}
                            <button
                                onClick={onClose}
                                className="shrink-0 rounded-md bg-black/20 p-1.5 text-white transition hover:bg-black/40"
                                aria-label="Tutup panel"
                            >
                                <X className="size-4" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* ── Tab bar ── */}
                {kegiatan && (
                    <div className="border-b border-[rgba(30,36,48,0.08)] bg-white px-2 dark:border-[rgba(255,255,255,0.08)] dark:bg-[#181E2B]">
                        <nav className="flex overflow-x-auto">
                            {allTabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => setActiveTab(tab.id)}
                                    className={cn(
                                        'flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2.5 text-xs font-semibold whitespace-nowrap transition',
                                        activeTab === tab.id
                                            ? 'border-[#4A5FD1] text-[#4A5FD1] dark:border-[#8FA0FA] dark:text-[#8FA0FA]'
                                            : 'border-transparent text-[#727C8E] hover:text-[#1E2430] dark:text-[#8C97A8] dark:hover:text-[#E6ECF5]',
                                    )}
                                >
                                    <tab.icon className="size-3.5" />
                                    {tab.label}
                                </button>
                            ))}
                        </nav>
                    </div>
                )}

                {/* ── Konten scroll ── */}
                <div className="flex-1 overflow-y-auto p-4">
                    {loading && (
                        <div className="flex h-40 items-center justify-center">
                            <Loader2 className="size-5 animate-spin text-[#4A5FD1]" />
                        </div>
                    )}

                    {error && (
                        <div className="rounded-lg bg-[#C4514A]/10 p-4 text-xs font-medium text-[#C4514A] dark:bg-[#C4514A]/20 dark:text-[#D9615A]">
                            {error}
                        </div>
                    )}

                    {kegiatan && !loading && (
                        <>
                            {activeTab === 'info' && (
                                <TabInfo
                                    kegiatan={kegiatan}
                                    teamSlug={teamSlug}
                                />
                            )}
                            {activeTab === 'rundown' && (
                                <TabRundown kegiatan={kegiatan} />
                            )}
                            {activeTab === 'panitia' && (
                                <TabPanitia
                                    kegiatan={kegiatan}
                                    teamSlug={teamSlug}
                                    canManage={isPengurus}
                                />
                            )}
                            {activeTab === 'anggaran' && canManageAnggaran && (
                                <TabAnggaran
                                    kegiatan={kegiatan}
                                    teamSlug={teamSlug}
                                    canManage={isPengurus}
                                />
                            )}
                            {activeTab === 'evaluasi' && (
                                <TabEvaluasi
                                    kegiatan={kegiatan}
                                    canManage={isPengurus}
                                />
                            )}
                            {activeTab === 'dokumentasi' && (
                                <TabDokumentasi
                                    kegiatan={kegiatan}
                                    teamSlug={teamSlug}
                                />
                            )}
                            {activeTab === 'surat' && (
                                <TabSurat kegiatan={kegiatan} />
                            )}
                        </>
                    )}
                </div>

                {/* Footer: link ke halaman detail penuh */}
                {kegiatan && (
                    <div className="shrink-0 border-t border-[rgba(30,36,48,0.08)] bg-white p-3.5 dark:border-[rgba(255,255,255,0.08)] dark:bg-[#181E2B]">
                        <Link
                            href={`/${teamSlug}/kegiatan/${kegiatan.id}`}
                            className="flex items-center justify-center gap-1.5 rounded-lg bg-[#4A5FD1]/10 px-4 py-2 text-xs font-semibold text-[#4A5FD1] transition hover:bg-[#4A5FD1]/20 dark:bg-[#4A5FD1]/20 dark:text-[#8FA0FA] dark:hover:bg-[#4A5FD1]/30"
                        >
                            Buka halaman detail lengkap →
                        </Link>
                    </div>
                )}
            </div>
        </>
    );
}
