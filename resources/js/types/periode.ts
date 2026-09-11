export type Periode = {
    id: number;
    team_id: number;
    nama: string;
    tanggal_mulai: string;
    tanggal_selesai: string;
    is_aktif: boolean;
    is_latest?: boolean;
    is_current?: boolean;
};

export type AnggotaPeriode = {
    id: number;
    user_id: number;
    periode_id: number;
    divisi_organisasi_id?: number | null;
    jabatan?: string | null;
    status: string;
    divisi?: string | null;
};
