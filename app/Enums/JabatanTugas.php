<?php

namespace App\Enums;

/**
 * Jabatan yang boleh memiliki Tugas (hanya 4 divisi).
 * Ketua Pelaksana, Bendahara, Sekretaris tidak punya konsep Tugas (SRS §3.7).
 */
enum JabatanTugas: string
{
    case DivAcara = 'div_acara';
    case DivHumas = 'div_humas';
    case DivPdd = 'div_pdd';
    case DivLogistik = 'div_logistik';

    /**
     * Label tampil untuk UI.
     */
    public function label(): string
    {
        return match ($this) {
            self::DivAcara => 'Divisi Acara',
            self::DivHumas => 'Divisi Humas',
            self::DivPdd => 'Divisi PDD',
            self::DivLogistik => 'Divisi Logistik',
        };
    }

    /**
     * Konversi dari JabatanKepanitiaan ke JabatanTugas (nullable — jabatan tunggal tidak punya padanan).
     */
    public static function fromJabatanKepanitiaan(JabatanKepanitiaan $jabatan): ?self
    {
        return match ($jabatan) {
            JabatanKepanitiaan::DivAcara => self::DivAcara,
            JabatanKepanitiaan::DivHumas => self::DivHumas,
            JabatanKepanitiaan::DivPdd => self::DivPdd,
            JabatanKepanitiaan::DivLogistik => self::DivLogistik,
            default => null,
        };
    }
}
