<?php

namespace App\Http\Controllers;

use App\Models\Sesi;
use App\Models\Team;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CalendarController extends Controller
{
    public function index(Request $request, string $currentTeam)
    {
        return Inertia::render('kalender/index');
    }

    public function events(Request $request, string $currentTeam)
    {
        $team = Team::where('slug', $currentTeam)->firstOrFail();

        $sesi = Sesi::with('kegiatan')
            ->whereHas('kegiatan', fn ($q) => $q->where('team_id', $team->id))
            ->whereBetween('tanggal', [$request->query('start'), $request->query('end')])
            ->get();

        return response()->json(
            $sesi->map(fn (Sesi $s) => [
                'id' => "sesi_{$s->id}",
                'groupId' => "keg_{$s->kegiatan_id}",
                'title' => $s->kegiatan->nama,
                'start' => "{$s->tanggal->toDateString()}T{$s->waktu_mulai}",
                'end' => "{$s->tanggal->toDateString()}T{$s->waktu_selesai}",
                'color' => $s->kegiatan->warna,
                'extendedProps' => [
                    'kegiatanId' => $s->kegiatan_id,
                    'status' => $s->status, // computed attribute
                    'location' => $s->lokasi,
                ],
            ])
        );
    }
}
