# Design Document: Dashboard Statistics & Content Section Enhancement

**Feature:** Add Statistics Cards & Content Sections for Artikel, Wish Wall, dan Struktur Organisasi  
**Status:** Draft  
**Target:** Dashboard Pengurus only  
**UI Library:** Shadcn/ui components  
**Created:** 2024  
**Version:** 1.0

---

## 1. Overview

Menambahkan card statistik dan section konten untuk 3 fitur baru yang sudah diimplementasikan:
1. **Artikel & Berita** - menampilkan total artikel dan daftar artikel terbaru
2. **Wish Wall** - menampilkan total wishes dan wishes pending moderasi
3. **Struktur Organisasi** - menampilkan total divisi dan preview struktur

### Goals
- Memberikan visibility ke konten-konten baru di dashboard
- Menampilkan statistik yang actionable (dengan link ke halaman terkait)
- Menggunakan Shadcn/ui components untuk konsistensi design system

---

## 2. Data Structure (from Models)

### Artikel Model
```php
- team_id
- judul
- slug
- ringkasan
- konten
- gambar_sampul
- status (draft|terbit)
- ditulis_oleh (user_id)
- diterbitkan_pada (datetime, nullable)

Scope: ->terbit() // status=terbit && (diterbitkan_pada <= now || null)
Relations: ->penulis() (User), ->team()
```

### Wish Model
```php
- team_id
- nama_pengirim
- pesan
- ip_address (hidden)
- status (pending|tampil|disembunyikan)
- jumlah_laporan (int, default 0)

Appends: nama_tampil, waktu_relatif
Scopes: ->tampil() (status=tampil), ->dilaporkan() (jumlah_laporan > 0)
Relations: ->team()
```

### DivisiOrganisasi Model
```php
- team_id
- nama_divisi
- deskripsi
- urutan_tampil

Relations: ->team(), ->pengurus() (HasMany PengurusStruktur)
```

---

## 3. UI/UX Design

### 3.1 Statistics Cards (Grid Row Addition)

**Current layout:**
```tsx
<div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
  {/* 4 existing cards: Total Kegiatan, Total Anggota, Total Presensi, Kegiatan Aktif */}
</div>
```

**New layout:** Expand to 7 cards total (2 rows)
```tsx
<div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
  {/* Row 1: 4 existing cards */}
  <PengurusStatCard label="Total Kegiatan" value={stats.totalKegiatan} icon={Calendar} ... />
  <PengurusStatCard label="Total Anggota" value={stats.totalAnggota} icon={Users} ... />
  <PengurusStatCard label="Total Presensi" value={stats.totalPresensi} icon={ClipboardCheck} ... />
  <PengurusStatCard label="Kegiatan Aktif" value={stats.kegiatanAktif} icon={TrendingUp} ... />
  
  {/* Row 2: 3 new cards */}
  <PengurusStatCard label="Total Artikel" value={stats.totalArtikel} icon={Newspaper} ... />
  <PengurusStatCard label="Wishes Pending" value={stats.wishesPending} icon={Sparkles} ... />
  <PengurusStatCard label="Total Divisi" value={stats.totalDivisi} icon={Building2} ... />
</div>
```

**Visual:**
```
┌────────────────┬────────────────┬────────────────┬────────────────┐
│ Total Kegiatan │ Total Anggota  │ Total Presensi │ Kegiatan Aktif │
│      42        │      128       │      356       │       3        │
└────────────────┴────────────────┴────────────────┴────────────────┘
┌────────────────┬────────────────┬────────────────┐
│ Total Artikel  │ Wishes Pending │ Total Divisi   │
│      18        │       5        │       8        │
└────────────────┴────────────────┴────────────────┘
```

**Icons:**
- Artikel: `Newspaper` (from lucide-react, already imported in sidebar)
- Wishes: `Sparkles` (already imported in sidebar)
- Divisi: `Building2` (already imported in sidebar)

**Colors (iconBg & iconColor):**
- Artikel: `bg-blue-100 dark:bg-blue-950/40` + `text-blue-600 dark:text-blue-400`
- Wishes: `bg-pink-100 dark:bg-pink-950/40` + `text-pink-600 dark:text-pink-400`
- Divisi: `bg-cyan-100 dark:bg-cyan-950/40` + `text-cyan-600 dark:text-cyan-400`

---

### 3.2 Content Sections (After Kegiatan Terbaru)

**Current structure:**
```tsx
<div className="grid gap-4 lg:grid-cols-2">
  {/* Kegiatan Akan Datang */}
  {/* Kegiatan Terbaru */}
</div>
```

**New structure:** Add 3rd section (full-width below the 2-column grid)
```tsx
<div className="grid gap-4 lg:grid-cols-2">
  {/* Kegiatan Akan Datang */}
  {/* Kegiatan Terbaru */}
</div>

{/* NEW: 3-column grid for content sections */}
<div className="grid gap-4 lg:grid-cols-3">
  {/* Artikel Terbaru */}
  {/* Wishes Pending Moderasi */}
  {/* Struktur Organisasi Preview */}
</div>
```

---

### 3.3 Section: Artikel Terbaru

```tsx
<div className="rounded-xl border border-neutral-100 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
  <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-4 dark:border-neutral-800">
    <h3 className="flex items-center gap-2 text-sm font-semibold text-neutral-800 dark:text-neutral-100">
      <Newspaper className="size-4 text-blue-500" />
      Artikel Terbaru
    </h3>
    <Link
      href={`/${teamSlug}/pengurus/artikel`}
      className="text-xs font-medium text-indigo-600 hover:text-indigo-800 dark:text-indigo-400"
    >
      Kelola →
    </Link>
  </div>

  {artikelTerbaru.length === 0 ? (
    <div className="flex flex-col items-center gap-2 py-10 text-center">
      <Newspaper className="size-8 text-neutral-200 dark:text-neutral-700" />
      <p className="text-sm text-neutral-400">Belum ada artikel.</p>
    </div>
  ) : (
    <ul className="divide-y divide-neutral-50 dark:divide-neutral-800/60">
      {artikelTerbaru.map((artikel) => (
        <li key={artikel.id} className="px-5 py-3 transition hover:bg-neutral-50 dark:hover:bg-neutral-800/40">
          <div className="flex items-start gap-3">
            {artikel.gambar_sampul && (
              <img
                src={`/storage/${artikel.gambar_sampul}`}
                alt={artikel.judul}
                className="size-12 shrink-0 rounded-lg object-cover"
              />
            )}
            <div className="min-w-0 flex-1">
              <Link
                href={`/${teamSlug}/pengurus/artikel/${artikel.id}/edit`}
                className="block truncate text-sm font-semibold text-neutral-800 hover:text-indigo-600 dark:text-neutral-100 dark:hover:text-indigo-400"
              >
                {artikel.judul}
              </Link>
              <div className="mt-0.5 flex items-center gap-2 text-xs text-neutral-500">
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                  artikel.status === 'terbit'
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                    : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                }`}>
                  {artikel.status}
                </span>
                <span>•</span>
                <span>{artikel.penulis?.name ?? 'Unknown'}</span>
              </div>
            </div>
          </div>
        </li>
      ))}
    </ul>
  )}
</div>
```

**Data needed (artikelTerbaru):**
```typescript
type ArtikelTerbarItem = {
  id: number;
  judul: string;
  slug: string;
  ringkasan: string | null;
  gambar_sampul: string | null;
  status: 'draft' | 'terbit';
  penulis: { id: number; name: string } | null;
  diterbitkan_pada: string | null;
};
```

**Query (DashboardController):**
```php
$artikelTerbaru = Artikel::where('team_id', $team->id)
    ->with('penulis:id,name')
    ->latest()
    ->limit(5)
    ->get(['id', 'judul', 'slug', 'ringkasan', 'gambar_sampul', 'status', 'ditulis_oleh', 'diterbitkan_pada']);
```

---

### 3.4 Section: Wishes Pending Moderasi

```tsx
<div className="rounded-xl border border-neutral-100 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
  <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-4 dark:border-neutral-800">
    <h3 className="flex items-center gap-2 text-sm font-semibold text-neutral-800 dark:text-neutral-100">
      <Sparkles className="size-4 text-pink-500" />
      Wishes Pending
    </h3>
    <Link
      href={`/${teamSlug}/pengurus/wish-wall`}
      className="text-xs font-medium text-indigo-600 hover:text-indigo-800 dark:text-indigo-400"
    >
      Moderasi →
    </Link>
  </div>

  {wishesPending.length === 0 ? (
    <div className="flex flex-col items-center gap-2 py-10 text-center">
      <Sparkles className="size-8 text-neutral-200 dark:text-neutral-700" />
      <p className="text-sm text-neutral-400">Tidak ada wishes pending.</p>
    </div>
  ) : (
    <ul className="divide-y divide-neutral-50 dark:divide-neutral-800/60">
      {wishesPending.map((wish) => (
        <li key={wish.id} className="px-5 py-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-neutral-800 dark:text-neutral-100">
                {wish.nama_tampil}
              </p>
              <p className="mt-0.5 line-clamp-2 text-xs text-neutral-500">
                {wish.pesan}
              </p>
              <p className="mt-1 text-[10px] text-neutral-400">
                {wish.waktu_relatif}
              </p>
            </div>
            {wish.jumlah_laporan > 0 && (
              <span className="shrink-0 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700 dark:bg-red-900/40 dark:text-red-300">
                {wish.jumlah_laporan} laporan
              </span>
            )}
          </div>
        </li>
      ))}
    </ul>
  )}
</div>
```

**Data needed (wishesPending):**
```typescript
type WishPendingItem = {
  id: number;
  nama_tampil: string; // appended attribute
  pesan: string;
  jumlah_laporan: number;
  waktu_relatif: string; // appended attribute
};
```

**Query (DashboardController):**
```php
$wishesPending = Wish::where('team_id', $team->id)
    ->where('status', 'pending')
    ->latest()
    ->limit(5)
    ->get(['id', 'nama_pengirim', 'pesan', 'jumlah_laporan', 'created_at']);
```

---

### 3.5 Section: Struktur Organisasi Preview

```tsx
<div className="rounded-xl border border-neutral-100 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
  <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-4 dark:border-neutral-800">
    <h3 className="flex items-center gap-2 text-sm font-semibold text-neutral-800 dark:text-neutral-100">
      <Building2 className="size-4 text-cyan-500" />
      Struktur Organisasi
    </h3>
    <Link
      href={`/${teamSlug}/pengurus/struktur-organisasi`}
      className="text-xs font-medium text-indigo-600 hover:text-indigo-800 dark:text-indigo-400"
    >
      Kelola →
    </Link>
  </div>

  {strukturOrganisasi.length === 0 ? (
    <div className="flex flex-col items-center gap-2 py-10 text-center">
      <Building2 className="size-8 text-neutral-200 dark:text-neutral-700" />
      <p className="text-sm text-neutral-400">Belum ada divisi.</p>
    </div>
  ) : (
    <ul className="divide-y divide-neutral-50 dark:divide-neutral-800/60">
      {strukturOrganisasi.map((divisi) => (
        <li key={divisi.id} className="px-5 py-3">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-neutral-800 dark:text-neutral-100">
                {divisi.nama_divisi}
              </p>
              <p className="mt-0.5 text-xs text-neutral-500">
                {divisi.jumlah_pengurus} pengurus
              </p>
            </div>
          </div>
        </li>
      ))}
    </ul>
  )}
</div>
```

**Data needed (strukturOrganisasi):**
```typescript
type StrukturOrganisasiItem = {
  id: number;
  nama_divisi: string;
  deskripsi: string | null;
  jumlah_pengurus: number;
};
```

**Query (DashboardController):**
```php
$strukturOrganisasi = DivisiOrganisasi::where('team_id', $team->id)
    ->withCount('pengurus as jumlah_pengurus')
    ->orderBy('urutan_tampil')
    ->limit(5)
    ->get(['id', 'nama_divisi', 'deskripsi']);
```

---

## 4. Technical Implementation

### 4.1 Backend Changes

**File:** `app/Http/Controllers/DashboardController.php`

**Method:** `pengurusProps(Team $team): array`

**Add to existing stats array:**
```php
$stats = [
    // ... existing stats ...
    'totalArtikel' => Artikel::where('team_id', $team->id)->count(),
    'wishesPending' => Wish::where('team_id', $team->id)->where('status', 'pending')->count(),
    'totalDivisi' => DivisiOrganisasi::where('team_id', $team->id)->count(),
];
```

**Add new data arrays:**
```php
$artikelTerbaru = Artikel::where('team_id', $team->id)
    ->with('penulis:id,name')
    ->latest()
    ->limit(5)
    ->get(['id', 'judul', 'slug', 'ringkasan', 'gambar_sampul', 'status', 'ditulis_oleh', 'diterbitkan_pada'])
    ->map(fn (Artikel $a) => [
        'id' => $a->id,
        'judul' => $a->judul,
        'slug' => $a->slug,
        'ringkasan' => $a->ringkasan,
        'gambar_sampul' => $a->gambar_sampul,
        'status' => $a->status,
        'penulis' => $a->penulis ? ['id' => $a->penulis->id, 'name' => $a->penulis->name] : null,
        'diterbitkan_pada' => $a->diterbitkan_pada?->toIso8601String(),
    ]);

$wishesPending = Wish::where('team_id', $team->id)
    ->where('status', 'pending')
    ->latest()
    ->limit(5)
    ->get(['id', 'nama_pengirim', 'pesan', 'jumlah_laporan', 'created_at']);
    // nama_tampil & waktu_relatif auto-appended by model

$strukturOrganisasi = DivisiOrganisasi::where('team_id', $team->id)
    ->withCount('pengurus as jumlah_pengurus')
    ->orderBy('urutan_tampil')
    ->limit(5)
    ->get(['id', 'nama_divisi', 'deskripsi'])
    ->map(fn (DivisiOrganisasi $d) => [
        'id' => $d->id,
        'nama_divisi' => $d->nama_divisi,
        'deskripsi' => $d->deskripsi,
        'jumlah_pengurus' => $d->jumlah_pengurus ?? 0,
    ]);
```

**Add to return array:**
```php
return [
    'stats' => $stats,
    'kegiatanMendatang' => $kegiatanMendatang,
    'kegiatanTerbaru' => $kegiatanTerbaru,
    'rekapKehadiran' => $rekapKehadiran,
    'artikelTerbaru' => $artikelTerbaru,        // NEW
    'wishesPending' => $wishesPending,          // NEW
    'strukturOrganisasi' => $strukturOrganisasi, // NEW
];
```

**Required imports:**
```php
use App\Models\Artikel;
use App\Models\Wish;
use App\Models\DivisiOrganisasi;
```

---

### 4.2 Frontend Changes

**File:** `resources/js/pages/dashboard.tsx`

**Type additions:**
```typescript
type PengurusStats = {
    totalKegiatan: number;
    totalAnggota: number;
    totalPresensi: number;
    kegiatanAktif: number;
    totalArtikel: number;      // NEW
    wishesPending: number;     // NEW
    totalDivisi: number;       // NEW
};

type ArtikelTerbaruItem = {
    id: number;
    judul: string;
    slug: string;
    ringkasan: string | null;
    gambar_sampul: string | null;
    status: 'draft' | 'terbit';
    penulis: { id: number; name: string } | null;
    diterbitkan_pada: string | null;
};

type WishPendingItem = {
    id: number;
    nama_tampil: string;
    pesan: string;
    jumlah_laporan: number;
    waktu_relatif: string;
};

type StrukturOrganisasiItem = {
    id: number;
    nama_divisi: string;
    deskripsi: string | null;
    jumlah_pengurus: number;
};

type Props = {
    // ... existing props ...
    artikelTerbaru?: ArtikelTerbaruItem[];
    wishesPending?: WishPendingItem[];
    strukturOrganisasi?: StrukturOrganisasiItem[];
};
```

**Icon imports (add to existing imports):**
```typescript
import {
    // ... existing icons ...
    Newspaper,
    Sparkles,
    Building2,
} from 'lucide-react';
```

**PengurusDashboard component signature:**
```typescript
function PengurusDashboard({
    stats,
    kegiatanMendatang,
    kegiatanTerbaru = [],
    artikelTerbaru = [],        // NEW
    wishesPending = [],         // NEW
    strukturOrganisasi = [],    // NEW
}: {
    stats: PengurusStats;
    kegiatanMendatang: SesiMendatang[];
    kegiatanTerbaru?: KegiatanTerbaruItem[];
    artikelTerbaru?: ArtikelTerbaruItem[];
    wishesPending?: WishPendingItem[];
    strukturOrganisasi?: StrukturOrganisasiItem[];
})
```

**statCards array (add 3 new cards):**
```typescript
const statCards = [
    // ... 4 existing cards ...
    {
        label: 'Total Artikel',
        value: stats.totalArtikel,
        icon: Newspaper,
        iconBg: 'bg-blue-100 dark:bg-blue-950/40',
        iconColor: 'text-blue-600 dark:text-blue-400',
    },
    {
        label: 'Wishes Pending',
        value: stats.wishesPending,
        icon: Sparkles,
        iconBg: 'bg-pink-100 dark:bg-pink-950/40',
        iconColor: 'text-pink-600 dark:text-pink-400',
    },
    {
        label: 'Total Divisi',
        value: stats.totalDivisi,
        icon: Building2,
        iconBg: 'bg-cyan-100 dark:bg-cyan-950/40',
        iconColor: 'text-cyan-600 dark:text-cyan-400',
    },
];
```

**JSX template additions (after Kegiatan Terbaru grid):**
```tsx
{/* 3-column content sections */}
<div className="grid gap-4 lg:grid-cols-3">
    {/* Artikel Terbaru */}
    {/* ... ArtikelTerbaruSection component ... */}
    
    {/* Wishes Pending */}
    {/* ... WishesPendingSection component ... */}
    
    {/* Struktur Organisasi */}
    {/* ... StrukturOrganisasiSection component ... */}
</div>
```

---

## 5. Implementation Checklist

### Backend (DashboardController.php)
- [ ] Import Artikel, Wish, DivisiOrganisasi models
- [ ] Add totalArtikel, wishesPending, totalDivisi to stats array
- [ ] Query artikelTerbaru (limit 5, with penulis)
- [ ] Query wishesPending (limit 5, status=pending)
- [ ] Query strukturOrganisasi (limit 5, with jumlah_pengurus)
- [ ] Add 3 new data arrays to return statement

### Frontend (dashboard.tsx)
- [ ] Add ArtikelTerbaruItem, WishPendingItem, StrukturOrganisasiItem types
- [ ] Update PengurusStats type (add 3 new fields)
- [ ] Update Props type (add 3 new optional arrays)
- [ ] Import Newspaper, Sparkles, Building2 icons
- [ ] Update PengurusDashboard signature (add 3 new props with defaults)
- [ ] Add 3 new cards to statCards array
- [ ] Create ArtikelTerbaruSection component
- [ ] Create WishesPendingSection component
- [ ] Create StrukturOrganisasiSection component
- [ ] Add 3-column grid div below Kegiatan Terbaru grid
- [ ] Pass artikelTerbaru, wishesPending, strukturOrganisasi to PengurusDashboard

### Testing
- [ ] Verify stats cards display correct counts
- [ ] Verify empty states show properly
- [ ] Verify links navigate to correct pages
- [ ] Test responsive layout (mobile, tablet, desktop)
- [ ] Test dark mode

---

## 6. Acceptance Criteria

✅ **AC-1:** Dashboard Pengurus menampilkan 7 stat cards (4 existing + 3 new)  
✅ **AC-2:** New stat cards menampilkan count yang akurat untuk Artikel, Wishes Pending, dan Divisi  
✅ **AC-3:** Section "Artikel Terbaru" menampilkan max 5 artikel terakhir dengan thumbnail, status, dan penulis  
✅ **AC-4:** Section "Wishes Pending" menampilkan max 5 wishes dengan status pending, sorted by latest  
✅ **AC-5:** Wishes dengan jumlah_laporan > 0 menampilkan badge merah "X laporan"  
✅ **AC-6:** Section "Struktur Organisasi" menampilkan max 5 divisi dengan jumlah pengurus  
✅ **AC-7:** Setiap section memiliki link "Kelola →" atau "Moderasi →" ke halaman terkait  
✅ **AC-8:** Empty state ditampilkan jika data kosong (dengan icon dan pesan)  
✅ **AC-9:** Layout responsive: 2 kolom di mobile, 3 kolom di desktop untuk content sections  
✅ **AC-10:** Dark mode styling consistent dengan design system existing

---

## 7. Notes

- Gunakan Shadcn/ui utilities (cn, styling patterns) yang sudah ada
- Konsisten dengan color palette existing (indigo primary, status badges)
- Image artikel: gunakan `/storage/${gambar_sampul}` untuk path
- Wishes: field `nama_tampil` dan `waktu_relatif` sudah auto-appended oleh model
- Struktur organisasi: `jumlah_pengurus` dari `withCount('pengurus')`

---

**End of Design Document**
