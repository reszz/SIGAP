# Design Document: Dashboard Kegiatan & Presensi Enhancement

**Feature:** EventDetailCard Integration & Presensi Actions in Show Page  
**Status:** Draft  
**Created:** 2024  
**Version:** 1.0

---

## 1. Overview

Dua enhancement untuk meningkatkan UX navigasi kegiatan dan akses presensi:

1. **Dashboard Anggota:** Ubah klik kegiatan dari direct link ke EventDetailCard (slide-in panel)
2. **Show Kegiatan (Pengurus):** Tambah button "Lihat Daftar Presensi" dan link "Isi Presensi" di setiap Sesi card

### Goals
- **UX Consistency:** Semua klik kegiatan di dashboard memicu slide-in, sama seperti kalender
- **Quick Access:** Pengurus bisa cepat akses daftar presensi dan form presensi dari halaman detail kegiatan
- **Progressive Enhancement:** Tidak mengubah struktur existing, hanya menambah interaksi

---

## 2. UI/UX Changes

### 2.1 Dashboard Anggota — EventDetailCard Integration

**Current Behavior:**
```tsx
// Dashboard Anggota — Kegiatan Mendatang
<Link href={kegiatanShow.url({ current_team: teamSlug, kegiatan: sesi.kegiatanId })}>
  {sesi.kegiatanNama}
</Link>
```
→ Klik kegiatan = navigasi ke full-page `/kegiatan/{id}`

**New Behavior:**
```tsx
// Dashboard Anggota — Kegiatan Mendatang
<button onClick={() => setSelectedKegiatanId(sesi.kegiatanId)}>
  {sesi.kegiatanNama}
</button>

{selectedKegiatanId && (
  <EventDetailCard
    kegiatanId={selectedKegiatanId}
    onClose={() => setSelectedKegiatanId(null)}
  />
)}
```
→ Klik kegiatan = buka EventDetailCard (slide-in panel dari kanan)

**Scope:**
- ✅ **Kegiatan Mendatang** (KegiatanMendatangCard component)
- ✅ **Event Hari Ini** (EventHariIni component, dari mini calendar selection)
- ❌ **Dashboard Pengurus** — tetap link langsung karena Pengurus lebih fokus ke management, bukan browsing

---

### 2.2 Show Kegiatan (Pengurus) — Presensi Actions

**Location:** Section "Jadwal & Rundown", di setiap Sesi card

**Current Structure:**
```tsx
{kegiatan.sesi.map((sesi, idx) => (
  <div key={sesi.id} className="rounded-lg border ...">
    <p>Sesi {idx + 1}</p>
    <div>
      <Calendar /> {formatDate(sesi.tanggal)}
      <Clock /> {sesi.waktu_mulai} – {sesi.waktu_selesai}
      <MapPin /> {sesi.lokasi}
    </div>
    {/* RUNDOWN LIST */}
  </div>
))}
```

**New Structure (Pengurus only):**
```tsx
{kegiatan.sesi.map((sesi, idx) => (
  <div key={sesi.id} className="rounded-lg border ...">
    {/* EXISTING INFO */}
    
    {/* NEW: Presensi Actions — Pengurus only */}
    {canManage && (
      <div className="mt-3 flex flex-wrap gap-2 border-t pt-3">
        {/* Button 1: Lihat Daftar Presensi */}
        <Link
          href={sesiPresensiIndex.url({
            current_team: teamSlug,
            sesi: sesi.id,
          })}
          className="flex items-center gap-1.5 rounded-lg border border-indigo-200 px-3 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-50"
        >
          <Users className="size-3.5" />
          Lihat Daftar Presensi
        </Link>

        {/* Button 2: Isi Presensi — only if status = berlangsung */}
        {sesi.status === 'berlangsung' && (
          <Link
            href={presensiShow.url({
              current_team: teamSlug,
              kode: sesi.kode_presensi,
            })}
            className="flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700"
          >
            <CheckCircle2 className="size-3.5" />
            Isi Presensi
          </Link>
        )}
      </div>
    )}
    
    {/* RUNDOWN LIST */}
  </div>
))}
```

**Visual Mockup:**
```
┌─────────────────────────────────────────────────────┐
│ Sesi 1                           [Terjadwal]        │
│ 📅 Senin, 15 Januari 2024                          │
│ 🕐 13:00 – 15:00                                   │
│ 📍 Ruang Seminar                                   │
│ ─────────────────────────────────────────────────── │
│ [👥 Lihat Daftar Presensi]  [✓ Isi Presensi]     │ ← NEW (Pengurus only)
│ ─────────────────────────────────────────────────── │
│ Rundown:                                            │
│ 13:00  Pembukaan                                   │
│ 13:15  Materi 1                                    │
└─────────────────────────────────────────────────────┘
```

**Interaction Flow:**
1. **"Lihat Daftar Presensi"** → navigate ke `/sesi/{sesi}/presensi` (existing route)
2. **"Isi Presensi"** → navigate ke `/presensi/{kode}` (existing route)

---

## 3. Technical Architecture

### 3.1 Dashboard Anggota Changes

**File:** `resources/js/pages/dashboard.tsx`

**State Management:**
```tsx
function AnggotaDashboard({ ... }) {
  const [selectedKegiatanId, setSelectedKegiatanId] = useState<number | null>(null);
  
  return (
    <>
      {/* Main dashboard content */}
      <div className="...">
        <KegiatanMendatangCard
          items={sesiList}
          teamSlug={teamSlug}
          onRsvpChange={handleRsvpChange}
          onKegiatanClick={(id) => setSelectedKegiatanId(id)} // NEW
        />
        {/* ... other sections ... */}
      </div>
      
      {/* EventDetailCard slide-in */}
      {selectedKegiatanId && (
        <EventDetailCard
          kegiatanId={selectedKegiatanId}
          onClose={() => setSelectedKegiatanId(null)}
        />
      )}
    </>
  );
}
```

**Component Changes:**

1. **KegiatanMendatangCard:**
   - Add prop: `onKegiatanClick?: (id: number) => void`
   - Replace `<Link href={...}>` dengan `<button onClick={() => onKegiatanClick?.(sesi.kegiatanId)}>`

2. **EventHariIni:**
   - Add prop: `onKegiatanClick?: (id: number) => void`
   - Replace `<Link href={...}>` dengan `<button onClick={() => onKegiatanClick?.(sesi.kegiatanId)}>`

**Import Addition:**
```tsx
import EventDetailCard from '@/components/event-detail-card';
```

---

### 3.2 Show Kegiatan Changes

**File:** `resources/js/pages/kegiatan/show.tsx`

**Import Addition:**
```tsx
import { index as sesiPresensiIndex } from '@/routes/sesi';
// presensiShow already imported
```

**Route Helper Check:**
```tsx
// Route: GET {current_team}/sesi/{sesi}/presensi
// Named: sesi.presensi.index
// Controller: PresensiController@index
```

**Template Changes:**
```tsx
{/* Section: Jadwal & Rundown */}
<div className="rounded-2xl border ...">
  <h3>Jadwal & Rundown</h3>
  
  {kegiatan.sesi.map((sesi, idx) => (
    <div key={sesi.id} className="rounded-lg border ...">
      {/* Existing info */}
      <div className="flex items-start justify-between">
        <div>
          <p>Sesi {idx + 1}</p>
          <div className="flex flex-col gap-1">
            <span><Calendar /> {formatDate(sesi.tanggal)}</span>
            <span><Clock /> {sesi.waktu_mulai.slice(0, 5)} – {sesi.waktu_selesai.slice(0, 5)}</span>
            <span><MapPin /> {sesi.lokasi}</span>
          </div>
        </div>
        <StatusBadge status={sesi.status} />
      </div>

      {/* NEW: Presensi Actions (Pengurus only) */}
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

          {sesi.status === 'berlangsung' && (
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

      {/* Rundown (unchanged) */}
      {sesi.rundown.length > 0 && (
        <div className="mt-3 border-t border-neutral-100 pt-3 dark:border-neutral-800">
          <p className="mb-2 text-xs font-semibold uppercase ...">Rundown</p>
          <ul className="...">
            {sesi.rundown.map((r) => (
              <li key={r.id}>...</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  ))}
</div>
```

---

## 4. Route Verification

**Existing Routes (confirmed):**

1. **Daftar Presensi Sesi:**
   ```
   GET {current_team}/sesi/{sesi}/presensi
   Name: sesi.presensi.index
   Controller: PresensiController@index
   Middleware: auth, verified (shared group)
   ```

2. **Form Isi Presensi:**
   ```
   GET {current_team}/presensi/{kode}
   Name: presensi.show
   Controller: PresensiController@show
   Middleware: auth, verified (shared group)
   ```

**Route Helper Import:**
```tsx
// Check if exists
import { index as sesiPresensiIndex } from '@/routes/sesi';
// If not auto-generated, use manual route construction
// href={`/${teamSlug}/sesi/${sesi.id}/presensi`}
```

---

## 5. Implementation Checklist

### Phase 1: Dashboard Anggota — EventDetailCard Integration

- [ ] **dashboard.tsx** (AnggotaDashboard function)
  - [ ] Add state: `const [selectedKegiatanId, setSelectedKegiatanId] = useState<number | null>(null);`
  - [ ] Import EventDetailCard component
  - [ ] Add EventDetailCard conditional render below main content
  - [ ] Pass `onKegiatanClick` to KegiatanMendatangCard

- [ ] **KegiatanMendatangCard component**
  - [ ] Add prop: `onKegiatanClick?: (id: number) => void`
  - [ ] Replace `<Link href={kegiatanShow.url(...)}>` with `<button onClick={...}>`
  - [ ] Update className to remove link styles, add button styles
  - [ ] Ensure proper hover states

- [ ] **EventHariIni component**
  - [ ] Add prop: `onKegiatanClick?: (id: number) => void`
  - [ ] Replace `<Link href={kegiatanShow.url(...)}>` with `<button onClick={...}>`
  - [ ] Update className to remove link styles, add button styles

- [ ] **Testing**
  - [ ] Test klik kegiatan di "Kegiatan Mendatang" → slide-in muncul
  - [ ] Test klik kegiatan di "Event Hari Ini" (mini calendar) → slide-in muncul
  - [ ] Test close slide-in (X button, Esc key, backdrop click)
  - [ ] Test navigasi tab di slide-in
  - [ ] Test "Buka halaman detail lengkap" link di footer slide-in

### Phase 2: Show Kegiatan — Presensi Actions

- [ ] **show.tsx**
  - [ ] Import route helpers: `import { index as sesiPresensiIndex } from '@/routes/sesi';`
  - [ ] Find "Jadwal & Rundown" section (around line 300-400)
  - [ ] Add presensi actions div after info section, before rundown
  - [ ] Wrap with `{canManage && (...)}` condition
  - [ ] Add "Lihat Daftar Presensi" link (always visible for Pengurus)
  - [ ] Add "Isi Presensi" link (conditional: `sesi.status === 'berlangsung'`)

- [ ] **Route Helper Verification**
  - [ ] Check if `@/routes/sesi` exports `index` helper
  - [ ] If not exists, run `php artisan wayfinder:generate`
  - [ ] Verify route generation: `sesiPresensiIndex.url({ current_team: '...', sesi: 123 })`

- [ ] **Testing**
  - [ ] Login sebagai Pengurus
  - [ ] Navigate ke halaman detail kegiatan dengan multiple sesi
  - [ ] Verify button "Lihat Daftar Presensi" muncul di setiap sesi
  - [ ] Click "Lihat Daftar Presensi" → navigate ke `/sesi/{sesi}/presensi`
  - [ ] Untuk sesi dengan status "berlangsung", verify button "Isi Presensi" muncul
  - [ ] Click "Isi Presensi" → navigate ke `/presensi/{kode}`
  - [ ] Login sebagai Anggota, verify button TIDAK muncul

### Phase 3: Frontend Build & Integration

- [ ] Run `npm run build`
- [ ] Verify no TypeScript errors
- [ ] Test in browser (both changes)
- [ ] Responsive testing (mobile, tablet, desktop)

---

## 6. Edge Cases & Considerations

### 6.1 Dashboard Anggota

**Edge Case: Multiple rapid clicks**
- **Issue:** User klik beberapa kegiatan cepat-cepat, slide-in blink
- **Solution:** State `selectedKegiatanId` akan di-replace, tidak stack. Slide-in akan fetch data baru saat `kegiatanId` prop berubah.

**Edge Case: Slide-in open saat user scroll**
- **Issue:** Backdrop dan slide-in `position: fixed`, tidak mengikuti scroll
- **Solution:** This is expected behavior (modal). User bisa close slide-in lalu scroll.

### 6.2 Show Kegiatan — Presensi

**Edge Case: Sesi tanpa kode presensi**
- **Issue:** Legacy data mungkin `kode_presensi = null`
- **Solution:** Route `presensi.show` menerima `{kode}` parameter. Jika null, akan 404. Add conditional:
  ```tsx
  {sesi.status === 'berlangsung' && sesi.kode_presensi && (
    <Link href={presensiShow.url({ ... })}>...</Link>
  )}
  ```

**Edge Case: Multiple sesi dengan status "berlangsung"**
- **Issue:** Bisakah terjadi?
- **Solution:** Status computed on-the-fly based on datetime. Technically bisa 2 sesi overlap jika dijadwalkan paralel. Button akan muncul di semua sesi "berlangsung".

**Edge Case: Presensi route restricted by permission**
- **Issue:** Apakah route `sesi.presensi.index` memerlukan specific permission (Ketua Pelaksana, dll)?
- **Solution:** Route exist di shared group, artinya accessible by authenticated users. Controller internal harus validate permission. UI hanya show button ke Pengurus (`canManage`), tapi tidak hard-block di frontend.

---

## 7. Acceptance Criteria

### Dashboard Anggota
✅ **AC-1:** Klik kegiatan di "Kegiatan Mendatang" memicu EventDetailCard slide-in, BUKAN navigasi ke full-page  
✅ **AC-2:** Klik kegiatan di "Event Hari Ini" (calendar selection) memicu EventDetailCard slide-in  
✅ **AC-3:** EventDetailCard dapat di-close dengan X button, Esc key, atau klik backdrop  
✅ **AC-4:** Footer slide-in ada link "Buka halaman detail lengkap" yang navigate ke full-page  
✅ **AC-5:** Dashboard Pengurus TIDAK berubah (tetap link langsung ke full-page)

### Show Kegiatan — Presensi
✅ **AC-6:** Pengurus melihat button "Lihat Daftar Presensi" di setiap Sesi card  
✅ **AC-7:** Button "Lihat Daftar Presensi" navigate ke `/sesi/{sesi}/presensi`  
✅ **AC-8:** Button "Isi Presensi" hanya muncul saat Sesi berstatus "berlangsung"  
✅ **AC-9:** Button "Isi Presensi" navigate ke `/presensi/{kode_presensi}`  
✅ **AC-10:** Anggota TIDAK melihat kedua button ini (wrapped dengan `canManage` condition)  
✅ **AC-11:** Button styling consistent dengan design system (indigo outline + green solid)

---

## 8. Migration Notes

**No database migration required** — ini pure frontend enhancement.

**Wayfinder regeneration:**
```bash
php artisan wayfinder:generate
```
Verify `@/routes/sesi.ts` exports `index` helper for `sesi.presensi.index` route.

---

## 9. Testing Strategy

### Unit Tests (N/A)
Pure UI changes, no new logic yang perlu unit test.

### Integration Tests (Manual)

**Test Suite 1: Dashboard Anggota — EventDetailCard**
1. Login sebagai Anggota
2. Navigate ke `/anggota/dashboard`
3. Scroll ke "Kegiatan Mendatang"
4. Klik salah satu kegiatan → verify slide-in muncul dari kanan
5. Verify slide-in menampilkan detail kegiatan dengan 7 tabs
6. Klik tab berbeda → verify konten berubah
7. Klik X button → slide-in close
8. Klik kegiatan lain → slide-in muncul lagi dengan data baru
9. Press Esc → slide-in close
10. Select tanggal di mini calendar → "Event Hari Ini" section muncul
11. Klik kegiatan di "Event Hari Ini" → slide-in muncul
12. Klik "Buka halaman detail lengkap" di footer slide-in → navigate ke full-page

**Test Suite 2: Show Kegiatan — Presensi Actions**
1. Login sebagai Pengurus
2. Navigate ke halaman detail kegiatan (e.g., `/hmif/kegiatan/3`)
3. Scroll ke section "Jadwal & Rundown"
4. Verify setiap Sesi card ada border-t + div dengan 2 button
5. Klik "Lihat Daftar Presensi" → verify redirect ke `/sesi/{sesi}/presensi`
6. Back ke detail kegiatan
7. Jika ada Sesi dengan status "berlangsung", verify button "Isi Presensi" hijau muncul
8. Klik "Isi Presensi" → verify redirect ke `/presensi/{kode}`
9. Logout, login sebagai Anggota biasa
10. Navigate ke halaman detail kegiatan yang sama
11. Verify button presensi TIDAK muncul di Sesi card

---

## 10. Rollback Plan

Jika ada critical issue setelah deploy:

**Dashboard Anggota:**
```tsx
// Revert KegiatanMendatangCard & EventHariIni
// Change <button onClick={...}> back to <Link href={...}>
<Link
  href={kegiatanShow.url({ current_team: teamSlug, kegiatan: sesi.kegiatanId })}
>
  {sesi.kegiatanNama}
</Link>
```

**Show Kegiatan:**
```tsx
// Remove entire presensi actions div
{/* canManage && ( ... ) */}
```

Rebuild frontend: `npm run build`

---

## 11. Future Enhancements (Out of Scope)

1. **Live presensi count:** Show "12/45 sudah presensi" di button "Lihat Daftar Presensi"
2. **Quick presensi popup:** Modal isi presensi tanpa leave page
3. **Dashboard Pengurus EventDetailCard:** Jika ternyata dibutuhkan konsistensi
4. **Keyboard navigation:** Arrow keys untuk switch kegiatan di slide-in

---

**End of Design Document**
