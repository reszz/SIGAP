<?php

namespace App\Enums;

enum JabatanKepanitiaan: string
{
    case KetuaPelaksana = 'ketua_pelaksana';
    case Bendahara = 'bendahara';
    case Sekretaris = 'sekretaris';
    case DivAcara = 'div_acara';
    case DivHumas = 'div_humas';
    case DivPdd = 'div_pdd';
    case DivLogistik = 'div_logistik';

    /**
     * Jabatan yang hanya boleh 1 orang aktif per Kegiatan (FR-28, NFR-03).
     */
    public function isTunggal(): bool
    {
        return in_array($this, [
            self::KetuaPelaksana,
            self::Bendahara,
            self::Sekretaris,
        ], strict: true);
    }

    /**
     * Jabatan divisi yang boleh banyak anggota per Kegiatan (FR-27).
     */
    public function isDivisi(): bool
    {
        return ! $this->isTunggal();
    }

    /**
     * Label tampil untuk UI.
     */
    public function label(): string
    {
        return match ($this) {
            self::KetuaPelaksana => 'Ketua Pelaksana',
            self::Bendahara => 'Bendahara',
            self::Sekretaris => 'Sekretaris',
            self::DivAcara => 'Divisi Acara',
            self::DivHumas => 'Divisi Humas',
            self::DivPdd => 'Divisi PDD',
            self::DivLogistik => 'Divisi Logistik',
        };
    }
}
