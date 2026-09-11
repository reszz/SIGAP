<?php

namespace App\Enums;

enum PrioritasTugas: string
{
    case Rendah = 'rendah';
    case Sedang = 'sedang';
    case Tinggi = 'tinggi';

    /**
     * Label tampil untuk UI.
     */
    public function label(): string
    {
        return ucfirst($this->value);
    }
}
