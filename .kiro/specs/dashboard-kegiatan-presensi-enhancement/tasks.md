# Tasks: Dashboard Kegiatan & Presensi Enhancement

**Spec:** Dashboard Kegiatan & Presensi Enhancement  
**Status:** Ready  
**Created:** 2024

---

## Task Breakdown

### Task 1: Dashboard Anggota — Add EventDetailCard State Management
**Priority:** High  
**Estimated effort:** 15 minutes

Update `AnggotaDashboard` function di `resources/js/pages/dashboard.tsx`:
- Add state: `const [selectedKegiatanId, setSelectedKegiatanId] = useState<number | null>(null);`
- Import `EventDetailCard` component
- Add conditional render `{selectedKegiatanId && <EventDetailCard ... />}` setelah main content div
- Pass props: `kegiatanId={selectedKegiatanId}` dan `onClose={() => setSelectedKegiatanId(null)}`

**Acceptance:**
- State declared dan EventDetailCard component imported
- Conditional render tidak error saat `selectedKegiatanId = null`

**Dependencies:** None

---

### Task 2: Dashboard Anggota — Update KegiatanMendatangCard Component
**Priority:** High  
**Estimated effort:** 20 minutes

Update `KegiatanMendatangCard` component di `resources/js/pages/dashboard.tsx`:
- Add prop: `onKegiatanClick?: (id: number) => void`
- Replace `<Link href={kegiatanShow.url(...)}>` dengan `<button type="button" onClick={() => onKegiatanClick?.(sesi.kegiatanId)}>`
- Update className dari link styles ke button styles (keep text truncate, font weight, hover color)
- Add `className="block w-full truncate text-left text-sm font-medium text-neutral-800 hover:text-indigo-600 dark:text-neutral-100 dark:hover:text-indigo-400"`
- Pass `onKegiatanClick` prop dari `AnggotaDashboard` saat render `<KegiatanMendatangCard ... />`

**Acceptance:**
- Klik kegiatan di "Kegiatan Mendatang" memicu callback `onKegiatanClick` dengan correct `kegiatanId`
- Button styling sama seperti link sebelumnya (no visual regression)

**Dependencies:** Task 1

---

### Task 3: Dashboard Anggota — Update EventHariIni Component
**Priority:** High  
**Estimated effort:** 15 minutes

Update `EventHariIni` component di `resources/js/pages/dashboard.tsx`:
- Add prop: `onKegiatanClick?: (id: number) => void`
- Replace `<Link href={kegiatanShow.url(...)}>` dengan `<button type="button" onClick={() => onKegiatanClick?.(sesi.kegiatanId)}>`
- Update className ke button styles (keep existing truncate, font, color)
- Pass `onKegiatanClick` prop dari `AnggotaDashboard` saat render `<EventHariIni ... />`

**Acceptance:**
- Klik kegiatan di "Event Hari Ini" memicu EventDetailCard slide-in
- Button styling consistent dengan sebelumnya

**Dependencies:** Task 1

---

### Task 4: Show Kegiatan — Import Route Helpers
**Priority:** Medium  
**Estimated effort:** 10 minutes

Update imports di `resources/js/pages/kegiatan/show.tsx`:
- Add: `import { index as sesiPresensiIndex } from '@/routes/sesi';`
- Verify `presensiShow` already imported (should exist from line ~16)
- Run `php artisan wayfinder:generate` jika route helper belum ada
- Test TypeScript compilation: `npm run build` (should no errors)

**Acceptance:**
- Import statement tidak error
- Route helper `sesiPresensiIndex.url()` available untuk use

**Dependencies:** None

---

### Task 5: Show Kegiatan — Add Presensi Actions to Sesi Cards
**Priority:** High  
**Estimated effort:** 30 minutes

Update "Jadwal & Rundown" section di `resources/js/pages/kegiatan/show.tsx`:
- Locate Sesi mapping loop (around line 300-400, cari `{kegiatan.sesi.map((sesi, idx) => ...`)
- Setelah existing Sesi info (tanggal, waktu, lokasi, status badge), sebelum rundown list, add:
  ```tsx
  {canManage && (
    <div className="mt-3 flex flex-wrap gap-2 border-t border-neutral-100 pt-3 dark:border-neutral-800">
      <Link
        href={sesiPresensiIndex.url({
          current_team: currentTeam?.slug ?? '',
          sesi: sesi.id,
        })}
        className="flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-white px-3 py-1.5 text-xs font-medium text-indigo-600 transition hover:bg-indigo-50 dark:border-indigo-800 dark:bg-neutral-900 dark:text-indigo-400 dark:hover:bg-indigo-950/30"
      >
        <Users className="size-3.5" />
        Lihat Daftar Presensi
      </Link>

      {sesi.status === 'berlangsung' && sesi.kode_presensi && (
        <Link
          href={presensiShow.url({
            current_team: currentTeam?.slug ?? '',
            kode: sesi.kode_presensi,
          })}
          className="flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-green-700"
        >
          <CheckCircle2 className="size-3.5" />
          Isi Presensi
        </Link>
      )}
    </div>
  )}
  ```
- Import `Users` icon dari lucide-react jika belum (should already exist)
- Verify `CheckCircle2` icon already imported (should exist)

**Acceptance:**
- Pengurus melihat button "Lihat Daftar Presensi" di setiap Sesi
- Button "Isi Presensi" hanya muncul jika `sesi.status === 'berlangsung'` dan `sesi.kode_presensi` exists
- Anggota TIDAK melihat button (wrapped dengan `canManage`)
- Button styling match design system (indigo outline, green solid)

**Dependencies:** Task 4

---

### Task 6: Frontend Build & Manual Testing
**Priority:** High  
**Estimated effort:** 20 minutes

Build frontend dan test di browser:
- Run `npm run build`
- Verify no TypeScript/build errors
- Test Dashboard Anggota (all scenarios dari Test Suite 1 di design.md)
- Test Show Kegiatan Pengurus (all scenarios dari Test Suite 2 di design.md)
- Test responsive (mobile, tablet, desktop)
- Test dark mode (if applicable)

**Acceptance:**
- Build sukses tanpa error
- Semua acceptance criteria dari design.md terpenuhi (AC-1 sampai AC-11)
- No visual regression di halaman lain

**Dependencies:** Task 2, Task 3, Task 5

---

## Summary

**Total tasks:** 6  
**Estimated total effort:** ~2 hours  
**Risk level:** Low (pure frontend, no backend changes)

**Critical path:**
1. Task 1 (state) → Task 2 & 3 (dashboard clicks)
2. Task 4 (imports) → Task 5 (presensi buttons)
3. Task 6 (build & test)

**Parallel work:**
- Task 1-3 (dashboard) dapat dikerjakan bersamaan dengan Task 4-5 (show kegiatan)
