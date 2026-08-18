<?php

namespace App\Exports;

use App\Models\Team;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\WithMultipleSheets;

class LaporanKegiatanExport implements WithMultipleSheets
{
    public function __construct(
        private readonly Collection $data,
        private readonly Team $team,
    ) {}

    public function sheets(): array
    {
        $sheets = [];

        // Summary sheet
        $sheets[] = new LaporanSummarySheet($this->data, $this->team);

        // One sheet per kegiatan
        foreach ($this->data as $item) {
            $sheets[] = new LaporanKegiatanSheet($item);
        }

        return $sheets;
    }
}
