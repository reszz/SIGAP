<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<title>Laporan Kegiatan</title>
<style>
  body { font-family: DejaVu Sans, sans-serif; font-size: 11px; color: #111; margin: 20px; }
  h1 { font-size: 16px; margin-bottom: 4px; }
  h2 { font-size: 13px; margin: 16px 0 6px; border-bottom: 1px solid #aaa; padding-bottom: 3px; }
  h3 { font-size: 11px; margin: 12px 0 4px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
  th { background: #e8eaf6; text-align: left; padding: 4px 6px; border: 1px solid #bbb; font-size: 10px; }
  td { padding: 3px 6px; border: 1px solid #ddd; vertical-align: top; }
  .badge { display: inline-block; padding: 1px 6px; border-radius: 3px; font-size: 10px; }
  .badge-terbuka { background: #e3f2fd; color: #1565c0; }
  .badge-wajib { background: #fff3e0; color: #bf360c; }
  .section-card { margin-bottom: 20px; page-break-inside: avoid; }
  .meta { font-size: 10px; color: #555; margin-bottom: 12px; }
  .summary-box { background: #f5f5f5; border: 1px solid #ddd; padding: 8px 12px; margin-bottom: 12px; border-radius: 4px; }
  .summary-box table { margin: 0; }
  .summary-box td, .summary-box th { border: none; padding: 2px 8px 2px 0; }
  .total-row { font-weight: bold; background: #f0f0f0; }
  .page-break { page-break-after: always; }
</style>
</head>
<body>

<h1>Laporan Kegiatan &mdash; {{ $team->name }}</h1>
<p class="meta">Digenerate: {{ $generatedAt }} | {{ count($data) }} Kegiatan</p>

@foreach($data as $idx => $item)
<div class="section-card @if(!$loop->last) page-break @endif">

  {{-- Header --}}
  <h2>{{ $item['nama'] }}
    <span class="badge {{ $item['tipe'] === 'terbuka' ? 'badge-terbuka' : 'badge-wajib' }}">
      {{ $item['tipe'] === 'terbuka' ? 'Terbuka' : 'Wajib Hadir' }}
    </span>
  </h2>

  {{-- Summary box --}}
  <div class="summary-box">
    <table>
      <tr>
        <td><strong>Sesi:</strong> {{ $item['total_sesi'] }}</td>
        <td><strong>Hadir:</strong> {{ $item['total_hadir'] }} ({{ $item['persentase_hadir'] }}%)</td>
        @if($item['tipe'] === 'terbuka')
        <td><strong>RSVP:</strong> {{ $item['peserta_rsvp'] }}</td>
        @endif
        <td><strong>Est. Anggaran:</strong> Rp {{ number_format($item['total_estimasi'], 0, ',', '.') }}</td>
        <td><strong>Realisasi:</strong> Rp {{ number_format($item['total_realisasi'], 0, ',', '.') }}</td>
        @if($item['rata_rating'])
        <td><strong>Rating:</strong> {{ $item['rata_rating'] }}/5 ({{ $item['jumlah_evaluasi'] }} ulasan)</td>
        @endif
      </tr>
    </table>
  </div>

  {{-- Jadwal & Rundown --}}
  <h3>Jadwal Sesi &amp; Rundown</h3>
  @foreach($item['sesi_detail'] as $sesi)
  <p style="margin:4px 0 2px; font-weight:bold; font-size:10px;">
    {{ $sesi['tanggal'] }} &mdash; {{ $sesi['waktu_mulai'] }} s/d {{ $sesi['waktu_selesai'] }} &mdash; {{ $sesi['lokasi'] }}
  </p>
  @if(count($sesi['rundown']) > 0)
  <table>
    <tr><th style="width:15%">Waktu</th><th>Uraian Acara</th></tr>
    @foreach($sesi['rundown'] as $r)
    <tr>
      <td>{{ $r['waktu'] }}</td>
      <td>{{ $r['uraian_acara'] }}</td>
    </tr>
    @endforeach
  </table>
  @else
  <p style="font-size:10px;color:#888;margin:2px 0 8px;">Tidak ada rundown.</p>
  @endif
  @endforeach

  {{-- Kehadiran --}}
  <h3>Daftar Kehadiran ({{ $item['total_hadir'] }} hadir, {{ $item['persentase_hadir'] }}%)</h3>
  @if(count($item['presensi_detail']) > 0)
  <table>
    <tr><th>Tanggal Sesi</th><th>Nama</th><th>NIM</th><th>Waktu Presensi</th></tr>
    @foreach($item['presensi_detail'] as $p)
    <tr>
      <td>{{ $p['sesi_tanggal'] }}</td>
      <td>{{ $p['nama'] }}</td>
      <td>{{ $p['nim'] }}</td>
      <td>{{ $p['waktu_isi'] }}</td>
    </tr>
    @endforeach
  </table>
  @else
  <p style="font-size:10px;color:#888;">Tidak ada data kehadiran.</p>
  @endif

  {{-- Anggaran --}}
  <h3>Rincian Anggaran</h3>
  @if(count($item['anggaran_detail']) > 0)
  <table>
    <tr><th>Jenis</th><th>Kategori/Sumber</th><th>Estimasi (Rp)</th><th>Realisasi (Rp)</th><th>Selisih (Rp)</th></tr>
    @foreach($item['anggaran_detail'] as $a)
    <tr>
      <td>{{ $a['jenis'] }}</td>
      <td>{{ $a['sumber_kategori'] }}</td>
      <td style="text-align:right">{{ number_format($a['estimasi'], 0, ',', '.') }}</td>
      <td style="text-align:right">{{ number_format($a['realisasi'] ?? 0, 0, ',', '.') }}</td>
      <td style="text-align:right">{{ number_format($a['selisih'], 0, ',', '.') }}</td>
    </tr>
    @endforeach
    <tr class="total-row">
      <td colspan="2">Total</td>
      <td style="text-align:right">{{ number_format($item['total_estimasi'], 0, ',', '.') }}</td>
      <td style="text-align:right">{{ number_format($item['total_realisasi'], 0, ',', '.') }}</td>
      <td style="text-align:right">{{ number_format($item['selisih_anggaran'], 0, ',', '.') }}</td>
    </tr>
  </table>
  @else
  <p style="font-size:10px;color:#888;">Tidak ada data anggaran.</p>
  @endif

  {{-- Evaluasi --}}
  @if($item['jumlah_evaluasi'] > 0)
  <h3>Ringkasan Evaluasi</h3>
  <p style="font-size:10px;">
    Rata-rata rating: <strong>{{ $item['rata_rating'] }} / 5</strong>
    &nbsp;|&nbsp; Jumlah evaluasi: <strong>{{ $item['jumlah_evaluasi'] }}</strong>
  </p>
  @endif

</div>
@endforeach

</body>
</html>
