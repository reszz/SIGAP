# SIGAP — Design Brief
Sistem Informasi Kegiatan, Absensi, dan Pelaporan
Platform manajemen kegiatan (event organizer) untuk organisasi mahasiswa

> Dokumen ini adalah brief desain untuk AI/desainer lain yang akan men-generate UI. Ikuti token dan aturan di bawah secara literal. Semua warna, tipografi, dan komponen diturunkan dari sistem ini — jangan improvisasi di luar token tanpa alasan.

---

## 1. Ringkasan Produk

SIGAP adalah platform terpusat bagi pengurus organisasi mahasiswa (contoh: himpunan program studi) untuk mengelola **seluruh siklus kegiatan**: jadwal & rundown, pembagian tugas panitia, pendaftaran/RSVP, presensi digital, anggaran sederhana, dokumentasi, dan evaluasi pasca-kegiatan — semuanya bermuara ke satu dashboard rekap untuk laporan pertanggungjawaban (LPJ).

- **Audiens:** mahasiswa pengurus organisasi (admin) dan anggota organisasi (peserta), usia 18–23 tahun, terbiasa dengan aplikasi kampus/komunitas, mengakses dari laptop maupun HP.
- **Job utama halaman:** memberi pengurus & anggota satu tempat untuk *melihat kegiatan apa yang akan/sedang berlangsung, dan langsung bertindak* (RSVP, presensi, lihat detail) tanpa bolak-balik WhatsApp/Google Form.
- **Elemen sentral:** kalender kegiatan interaktif (FullCalendar) sebagai halaman jantung produk — bukan tabel, bukan list biasa.

---

## 2. Arah Visual: Modern & Playful (Organisasi Mahasiswa)

Ini bukan software korporat. SIGAP dipakai anak organisasi untuk hal-hal yang mereka sendiri jalani: rapat mingguan, workshop, seminar, doorprize, notulen yang keteteran. Desain harus terasa **energetic, approachable, sedikit "buku agenda kampus"** — bukan navy-formal ala aplikasi instansi, bukan juga template SaaS generik.

**Motif yang menjadi jangkar (grounded di subject):**
- **Stiker/stempel status** — status kegiatan (Terjadwal / Berlangsung / Selesai) dan status presensi ditampilkan seperti *stiker event/badge lanyard*, sedikit dimiringkan (rotate -2° s/d 3°), bukan badge kotak datar biasa. Ini terinspirasi dari budaya kegiatan mahasiswa: stiker presensi, tempelan di mading, cap stempel.
- **Kode kegiatan** (kode/tautan unik presensi) ditulis dengan font monospace agar terasa seperti *kode tiket/kode akses*, bukan teks biasa.

**Hindari default AI generik:** jangan pakai kombinasi cream #F4F1EA + serif tebal + aksen terracotta; jangan near-black + satu aksen neon; jangan layout broadsheet hairline monokrom. Ambil arah warna-warni cerah yang hangat dan terkontrol di bawah ini.

---

## 3. Design Tokens

### 3.1 Warna

Warna dibagi dua sistem yang **terpisah dan tidak boleh tercampur**: (a) warna UI/brand — tetap dan semantik, dan (b) warna kegiatan — bebas per-Kegiatan, di-generate otomatis dari palet di bawah.

**a. Token UI & Brand (tetap)**

| Token | Hex | Peran |
|---|---|---|
| `--bg` | `#F6F4FF` | Latar utama — lavender-putih sangat muda, bukan cream default |
| `--surface` | `#FFFFFF` | Kartu, panel, modal |
| `--ink` | `#201A3D` | Teks utama — ungu-hitam pekat, bukan pure black |
| `--ink-soft` | `#5B5578` | Teks sekunder / caption |
| `--primary` | `#5B4FE9` | Indigo-violet — warna brand utama, tombol utama, navigasi, header non-kalender |
| `--primary-dark` | `#4038B8` | Hover/active state primary |
| `--coral` | `#FF6F59` | Aksen aksi/urgensi — CTA sekunder, tombol "Kirim Presensi" |
| `--line` | `#E4E0F7` | Border tipis, divider |
| `--warn` | `#F2994A` | Peringatan (kuota hampir penuh, deadline dekat) |
| `--danger` | `#E5484D` | Error, ditolak, alpa |
| `--success` | `#2EC4B6` | Ikon/teks konfirmasi generik (di luar konteks status kegiatan) |

**b. Palet Warna Kegiatan (bebas, auto-assign per Kegiatan)**

Setiap **Kegiatan** (bukan tiap sesi) mendapat satu warna dari palet berikut, di-assign otomatis oleh sistem (mis. hash dari `kegiatan_id` mod jumlah warna) saat kegiatan dibuat, dan dapat diubah manual oleh Pengurus lewat color picker sederhana. **Seluruh sesi milik satu Kegiatan yang sama (termasuk kegiatan multi-hari) memakai warna ini secara konsisten** — ini penting agar rangkaian sesi terlihat sebagai satu identitas kegiatan di kalender, bukan acara-acara terpisah.

| Nama | Hex |
|---|---|
| Indigo | `#5B4FE9` |
| Coral | `#FF6F59` |
| Sun Yellow | `#FFC857` |
| Mint | `#2EC4B6` |
| Rose | `#F45B8D` |
| Sky Blue | `#4FB6E9` |
| Lime | `#9BD94B` |
| Plum | `#A855C9` |
| Amber | `#F2994A` |
| Teal Deep | `#1B8A8A` |

Sistem assignment harus menghindari dua kegiatan yang tanggalnya berdekatan/overlap mendapat warna yang sama persis, supaya kalender tetap mudah dibaca sekilas. Legend warna kegiatan ditampilkan sebagai daftar kecil (nama kegiatan + swatch bulat) di sisi kalender, bukan legend kategori tetap.

### 3.2 Tipografi

| Peran | Font | Karakter |
|---|---|---|
| Display / heading | **Baloo 2** (fallback: Poppins SemiBold) | Rounded, tebal, ramah — dipakai di H1–H3, judul kegiatan besar, angka statistik dashboard |
| Body / UI | **Plus Jakarta Sans** | Geometris, netral, sangat legible di ukuran kecil — dipakai di paragraf, label form, navigasi |
| Utility / data | **Space Mono** atau **IBM Plex Mono** | Dipakai khusus untuk: kode/tautan presensi, tanggal singkat di chip kalender, angka durasi, timestamp |

Skala tipe (rem, base 16px): `12` caption · `14` body-sm · `16` body · `20` h4 · `24` h3 · `32` h2 · `44` h1 (hero/angka statistik besar).

Judul kegiatan di kalender & card selalu pakai Baloo 2 SemiBold — ini yang membuat produk terasa hangat dibanding tabel administratif biasa.

### 3.3 Bentuk, Spacing, Bayangan

- **Radius:** 16px untuk card besar, 12px untuk chip/badge, 999px (pill) untuk status stiker dan tombol utama. Tidak ada sudut tajam (0px) di komponen interaktif manapun — ini bagian dari kepribadian "playful".
- **Spacing scale:** 4 / 8 / 12 / 16 / 24 / 32 / 48px.
- **Shadow:** shadow lembut & berwarna, bukan abu-abu netral — contoh `0 8px 24px rgba(91, 79, 233, 0.14)` untuk card mengambang (dipakai di detail card kegiatan yang terbuka dari kalender).
- **Rotasi mikro:** elemen "stiker status" dirotasi acak ringan (-3° s/d 3°, konsisten per instance, bukan animasi) untuk kesan tertempel, bukan tercetak rapi.

### 3.4 Motion

- Detail card kegiatan (saat event di kalender diklik) **slide-in dari kanan** (desktop) atau **slide-up dari bawah / bottom sheet** (mobile), durasi 220–280ms, easing `cubic-bezier(0.16, 1, 0.3, 1)`.
- Hover pada event chip: scale 1.03 + shadow naik sedikit, bukan cuma ganti warna.
- Toast konfirmasi (RSVP berhasil, presensi terkirim) muncul dari atas, auto-dismiss, dengan ikon stiker centang mint.
- Hormati `prefers-reduced-motion`: matikan slide/scale, ganti jadi fade sederhana.

---

## 4. Signature Element

**Kartu Detail Kegiatan (Event Detail Card)** yang muncul saat sebuah event/sesi di FullCalendar diklik adalah elemen yang paling diingat dari produk ini. Bentuknya seperti *kartu undangan digital yang ditempeli stiker status*, bukan modal form generik:

- Header kartu berwarna sesuai **warna unik Kegiatan** (§3.1b), dengan judul kegiatan besar (Baloo 2). Karena warna header bisa apa saja (bukan set warna tetap), **stiker status selalu berbentuk pill putih/`--surface` dengan border + teks berwarna semantik** (bukan blok warna solid) — supaya tetap kontras dan terbaca di atas warna kegiatan apa pun. Stiker menempel di pojok kanan atas header, dirotasi ringan (-3° s/d 3°).
- Jika Kegiatan memiliki **lebih dari satu sesi (multi-hari)**, tampilkan selector tanggal berbentuk pill-tab horizontal tepat di bawah header (mis. "10 Ags · 11 Ags · 12 Ags") — mengklik tab mengganti rundown, lokasi, dan status yang ditampilkan sesuai sesi tersebut, sementara warna & judul kegiatan tetap sama di seluruh tab.
- Baris info per sesi: tanggal & waktu (font mono), lokasi. **Jika tipe Terbuka**, tampilkan juga kuota RSVP (progress pill "28/32 mendaftar") di level Kegiatan (satu RSVP berlaku untuk semua sesi). **Jika tipe Wajib Hadir**, baris ini diganti badge kecil "Wajib Hadir · Semua Anggota" — tanpa progress pill kuota, karena tidak ada pembatasan peserta.
- Tab/segment konten di dalam kartu: **Rundown · Panitia · Presensi · Anggaran · Dokumentasi** — hanya tab yang relevan dengan role user yang tampil (anggota tidak lihat anggaran). Tab **RSVP** (terpisah dari Presensi) hanya muncul jika Kegiatan bertipe Terbuka.
- Tombol aksi kontekstual di footer kartu: untuk tipe **Terbuka** → "RSVP Sekarang" (sebelum acara) lalu berubah jadi "Isi Presensi" (saat sesi berlangsung, hanya aktif jika RSVP berstatus terdaftar); untuk tipe **Wajib Hadir** → langsung "Isi Presensi" tanpa tahap RSVP. Presensi selalu redirect ke login dulu jika belum login. Pengurus melihat "Edit Kegiatan" alih-alih tombol aksi peserta.

Seluruh produk konsisten memakai bentuk kartu + stiker status outline ini: di dashboard, di list kegiatan, di riwayat anggota.

---

## 5. Struktur Halaman

1. **Login** — form sederhana, ilustrasi playful kegiatan kampus di sisi kanan (desktop), branding SIGAP + LPKIA kecil di footer.
2. **Dashboard Pengurus** — 3 kartu statistik atas (Total Kegiatan, Total Anggota, Kehadiran Bulan Ini — angka besar Baloo 2), lalu **FullCalendar bulanan** sebagai elemen utama, sidebar kiri navigasi (Dashboard, Kalender, Panitia, Presensi, Anggaran, Dokumentasi, Evaluasi, Laporan).
3. **Dashboard Anggota** — kalender yang sama tapi read+RSVP only, plus kartu "Kegiatan yang Kamu Ikuti" dan riwayat kehadiran pribadi (progress ring mint).
4. **Kalender Kegiatan (halaman inti)** — FullCalendar full-width, toggle bulan/minggu/agenda, legend daftar kegiatan aktif (swatch warna per kegiatan) di toolbar untuk highlight/filter, klik event/sesi → Event Detail Card (slide-in).
5. **Halaman Kegiatan Baru/Edit** (pengurus) — form multi-section: Info Dasar (nama, deskripsi, **toggle tipe: "Wajib Hadir" vs "Terbuka + RSVP"** — field kuota hanya muncul saat tipe Terbuka dipilih, warna auto-generate dengan color picker override), Sesi (repeatable block: tanggal, jam, lokasi, rundown per sesi — tombol "+ Tambah Sesi" untuk kegiatan multi-hari), Panitia (assign anggota + divisi).
6. **Form Presensi** (diakses via kode/tautan unik per sesi, **mewajibkan login Anggota**) — satu kartu terpusat, header nama kegiatan + tanggal sesi, identitas (Nama/NIM/Divisi) tampil read-only ter-autofill dari akun yang login, field Catatan opsional, tombol "Konfirmasi Presensi" warna coral besar.
7. **Manajemen Panitia** — board ala kanban per divisi (Acara, Humas, Logistik, Konsumsi...) dengan avatar anggota & checklist tugas.
8. **Manajemen Anggaran** — tabel estimasi vs realisasi per kegiatan, ringkasan pemasukan/pengeluaran dengan bar chart sederhana warna primary/coral.
9. **Arsip Dokumentasi** — grid foto per kegiatan + catatan notulen, terhubung ke record kegiatan.
10. **Evaluasi Pasca-Kegiatan** — form feedback (anggota) & ringkasan hasil (rating rata-rata, komentar) untuk pengurus.
11. **Laporan/Export** — pilih kegiatan/periode → preview ringkas → tombol export Excel/PDF.

---

## 6. Spesifikasi Integrasi FullCalendar

Gunakan **FullCalendar** (`@fullcalendar/react` + plugin `dayGrid`, `timeGrid`, `list`, `interaction`).

**Struktur event object** yang dikonsumsi kalender — **satu event FullCalendar = satu Sesi**, warna diambil dari Kegiatan induknya (bukan dari kategori):
```js
{
  id: "sesi_014",
  groupId: "keg_005",         // id Kegiatan induk — menyatukan seluruh sesi milik kegiatan
                               // multi-hari yang sama secara logis (filtering, highlight-on-hover)
  title: "Workshop Laravel — Hari 2",
  start: "2026-08-11T09:00:00",
  end: "2026-08-11T12:00:00",
  status: "terjadwal",        // terjadwal | berlangsung | selesai (per sesi)
  color: "#FFC857",           // = Kegiatan.warna, sama untuk semua sesi ber-groupId ini
  extendedProps: {
    kegiatanId: "keg_005",
    kegiatanNama: "Workshop Laravel",
    sesiKe: 2,
    totalSesi: 3,
    location: "Lab Komputer 2",
    quota: 40,
    registered: 28
  }
}
```

**Perilaku interaksi wajib:**
- `eventClick` → buka **Event Detail Card** (slide-in panel) untuk `kegiatanId` terkait, dengan tab sesi aktif sesuai sesi yang diklik (lihat §4) — bukan navigasi ke halaman baru; konteks kalender tetap terlihat di belakang (dim overlay tipis).
- Karena warna kini per-Kegiatan (bebas), chip event di grid bulanan menampilkan: dot solid warna Kegiatan + judul (truncate, sertakan penanda sesi jika multi-hari mis. "Workshop Laravel (2/3)") + jam mulai (mono, ukuran kecil).
- Hover pada salah satu sesi menyorot (highlight ring tipis) seluruh sesi lain dengan `groupId` yang sama di grid yang sedang tampil, memperkuat kesan "satu kegiatan, banyak hari".
- Toolbar kalender custom (bukan default FullCalendar) mengikuti token `--primary`: tombol navigasi bulan pill-shape, toggle view (Bulan/Minggu/Agenda) sebagai segmented control.
- Legend di samping/atas kalender berisi **daftar Kegiatan aktif bulan berjalan** (swatch bulat warna + nama kegiatan), bukan legend kategori tetap — klik satu item legend meng-highlight/filter sesi-sesi kegiatan tersebut di grid.
- Di mobile, default view otomatis ke `listWeek` (agenda), bukan grid bulan penuh, agar tetap scan-able di layar kecil.
- Jika pengguna belum login saat mengklik aksi "Isi Presensi" dari Event Detail Card, arahkan ke halaman login dengan redirect-back otomatis ke sesi yang sama setelah berhasil login.
- State kosong (belum ada kegiatan bulan ini) tampil sebagai ilustrasi kalender playful + copy ajakan bertindak ("Belum ada kegiatan bulan ini — buat yang pertama"), bukan grid kosong polos.

---

## 7. Komponen UI Reusable

- **StatCard** — angka besar Baloo 2 + label kecil + ikon bulat warna aksen.
- **StatusSticker** — pill/stiker rotate ringan, warna sesuai status (terjadwal=primary, berlangsung=sun, selesai=mint, ditolak=danger).
- **EventChip** (kalender) — dot kategori + judul + jam mono.
- **EventDetailCard** — lihat §4.
- **QuotaPill** — "28/32 mendaftar" dengan mini progress bar melengkung di dalam pill.
- **DivisiTugasCard** — avatar stack + checklist progress (mis. "3/5 tugas selesai").
- **EmptyState** — ilustrasi + headline aktif + CTA, dipakai konsisten di semua modul kosong (belum ada dokumentasi, belum ada evaluasi, dst).

---

## 8. Aksesibilitas & Responsif

- Kontras teks `--ink` di atas `--bg`/`--surface` memenuhi WCAG AA; jangan taruh teks putih di atas `--sun` (kuning) — gunakan `--ink` untuk teks di atas warna terang.
- Semua elemen interaktif punya visible focus ring (2px, warna `--primary`, offset 2px).
- Breakpoint: mobile <640px (kalender jadi agenda list, sidebar jadi bottom nav/hamburger), tablet 640–1024px, desktop >1024px (sidebar tetap terbuka, kalender + detail card berdampingan).
- Form presensi publik harus tetap dapat diisi dengan nyaman satu tangan di HP — input besar, tombol kirim full-width di mobile.

---

## 9. Yang Harus Dihindari

- Jangan gunakan palet cream/terracotta atau near-black/neon-hijau generik.
- Jangan buat status hanya berupa teks tanpa bentuk visual (selalu pakai StatusSticker — pill outline, bukan blok solid, agar terbaca di atas warna kegiatan apa pun).
- Jangan jadikan kalender sekadar dekorasi — ia adalah pusat navigasi utama, bukan widget kecil di sudut dashboard.
- Jangan gunakan sudut tajam (radius 0) di kartu/tombol — bertentangan dengan kepribadian playful produk ini.
- Jangan warnai event berdasarkan kategori tetap (rapat/workshop/dst) — warna melekat ke Kegiatan itu sendiri, bebas, dan konsisten di seluruh sesinya.
- Jangan tampilkan form presensi sebagai form tamu/guest tanpa login — presensi selalu dalam konteks akun Anggota yang sudah login.
