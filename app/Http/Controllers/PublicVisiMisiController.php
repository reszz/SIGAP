<?php

namespace App\Http\Controllers;

use App\Models\VisiMisi;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PublicVisiMisiController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $visiMisi = VisiMisi::untukLandingPage();

        return Inertia::render('profil/visi-misi', [
            'visiMisi' => $visiMisi ? [
                'id' => $visiMisi->id,
                'visi' => $visiMisi->visi,
                'periode' => $visiMisi->periode ? [
                    'id' => $visiMisi->periode->id,
                    'nama' => $visiMisi->periode->nama,
                    'is_aktif' => (bool) $visiMisi->periode->is_aktif,
                ] : null,
                'misi' => $visiMisi->misiPoin->map(fn ($m) => [
                    'id' => $m->id,
                    'isi' => $m->isi,
                    'urutan' => $m->urutan,
                ])->values(),
            ] : null,
        ]);
    }
}
