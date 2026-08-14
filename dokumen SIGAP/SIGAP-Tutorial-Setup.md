# Tutorial Step-by-Step — SIGAP
Laravel 12 (React Starter Kit + Fortify) + Inertia + TypeScript + Tailwind + FullCalendar

Tutorial ini nerjemahin `SIGAP-TaskBreakdown-Harian.md` Hari 6–9 jadi langkah konkret + kode siap-pakai. Fokusnya: **bikin fondasi yang bener duluan** (migration semua tabel, auth, role middleware), lalu **satu modul lengkap end-to-end** (Kegiatan + Sesi) sebagai pola yang tinggal kamu contek buat modul-modul lain (RSVP, Presensi, dst — spesifikasinya udah lengkap di `SIGAP-API-Endpoints.md` dan `SIGAP-DataDictionary.md`).

---

## Bagian 0 — Prasyarat

Pastikan sudah terinstal:
- PHP ≥ 8.2, Composer
- Node.js ≥ 18, npm
- MySQL/MariaDB (atau SQLite untuk development cepat)

```bash
php -v
composer -V
node -v
npm -v
```

---

## Bagian 1 — Instalasi Project

```bash
composer create-project laravel/laravel sigap
cd sigap

# Install React Starter Kit (Inertia + Fortify + Tailwind bawaan)
php artisan install:starter-kit react
```

Saat prompt muncul, pilih opsi default (Fortify sebagai auth, TypeScript: Yes, testing framework bebas).

Set `.env`:
```env
APP_NAME=SIGAP
DB_CONNECTION=mysql
DB_DATABASE=sigap
DB_USERNAME=root
DB_PASSWORD=
```

```bash
php artisan key:generate
npm install
```

Jalankan dua terminal terpisah selama development:
```bash
php artisan serve      # terminal 1 — backend
npm run dev             # terminal 2 — vite/frontend
```

---

## Bagian 2 — Konfigurasi Fortify (Nonaktifkan Registrasi Publik)

Buka `config/fortify.php`, cari array `'features'`:

```php
'features' => [
    // Features::registration(),   // <-- NONAKTIFKAN (comment out)
    Features::resetPasswords(),
    // Features::emailVerification(),          // opsional, matikan dulu
    // Features::twoFactorAuthentication(...),  // di luar scope PKL
],
```

Alasan: sesuai `SRS.md` §2.5 & FR-03, akun Anggota cuma dibuat Pengurus lewat form khusus (Bagian 6), bukan self-register bebas.

---

## Bagian 3 — Migration Semua Tabel

Bikin migration sekaligus (bukan bertahap per modul), supaya nggak ada refactor skema di tengah jalan:

```bash
php artisan make:migration add_nim_and_role_to_users_table --table=users
php artisan make:migration create_kegiatan_table
php artisan make:migration create_sesi_table
php artisan make:migration create_rundown_table
php artisan make:migration create_divisi_panitia_table
php artisan make:migration create_tugas_panitia_table
php artisan make:migration create_rsvp_table
php artisan make:migration create_presensi_table
php artisan make:migration create_anggaran_table
php artisan make:migration create_dokumentasi_table
php artisan make:migration create_evaluasi_table
```

Isi tiap file sesuai `SIGAP-DataDictionary.md`:

**`add_nim_and_role_to_users_table`**
```php
public function up(): void
{
    Schema::table('users', function (Blueprint $table) {
        $table->string('nim', 20)->unique()->after('id');
        $table->enum('role', ['pengurus', 'anggota'])->default('anggota')->after('password');
    });
}
```

**`create_kegiatan_table`**
```php
public function up(): void
{
    Schema::create('kegiatan', function (Blueprint $table) {
        $table->id();
        $table->string('nama', 150);
        $table->text('deskripsi')->nullable();
        $table->enum('tipe', ['wajib_hadir', 'terbuka']);
        $table->unsignedInteger('kuota')->nullable(); // hanya jika tipe = terbuka
        $table->char('warna', 7); // hex #RRGGBB
        $table->softDeletes();
        $table->timestamps();
    });
}
```

**`create_sesi_table`** *(ingat: TIDAK ada kolom `status` — dihitung on-the-fly, lihat Bagian 5)*
```php
public function up(): void
{
    Schema::create('sesi', function (Blueprint $table) {
        $table->id();
        $table->foreignId('kegiatan_id')->constrained('kegiatan')->cascadeOnDelete();
        $table->date('tanggal');
        $table->time('waktu_mulai');
        $table->time('waktu_selesai');
        $table->string('lokasi', 200);
        $table->string('kode_presensi', 32)->unique();
        $table->softDeletes();
        $table->timestamps();
    });
}
```

**`create_rundown_table`**
```php
public function up(): void
{
    Schema::create('rundown', function (Blueprint $table) {
        $table->id();
        $table->foreignId('sesi_id')->constrained('sesi')->cascadeOnDelete();
        $table->time('waktu');
        $table->string('uraian_acara', 255);
        $table->unsignedInteger('urutan');
        $table->timestamps();
    });
}
```

**`create_divisi_panitia_table`**
```php
public function up(): void
{
    Schema::create('divisi_panitia', function (Blueprint $table) {
        $table->id();
        $table->foreignId('kegiatan_id')->constrained('kegiatan')->cascadeOnDelete();
        $table->string('nama_divisi', 100);
        $table->timestamps();
    });
}
```

**`create_tugas_panitia_table`**
```php
public function up(): void
{
    Schema::create('tugas_panitia', function (Blueprint $table) {
        $table->id();
        $table->foreignId('divisi_id')->constrained('divisi_panitia')->cascadeOnDelete();
        $table->foreignId('user_id')->constrained('users');
        $table->string('deskripsi_tugas', 255);
        $table->enum('status', ['belum', 'sedang', 'selesai'])->default('belum');
        $table->timestamps();
    });
}
```

**`create_rsvp_table`** *(versi sederhana instant-only, lihat SRS v1.3)*
```php
public function up(): void
{
    Schema::create('rsvp', function (Blueprint $table) {
        $table->id();
        $table->foreignId('kegiatan_id')->constrained('kegiatan')->cascadeOnDelete();
        $table->foreignId('user_id')->constrained('users');
        $table->enum('status', ['terdaftar', 'dibatalkan'])->default('terdaftar');
        $table->timestamp('waktu_daftar')->useCurrent();
        $table->unique(['kegiatan_id', 'user_id']);
    });
}
```

**`create_presensi_table`**
```php
public function up(): void
{
    Schema::create('presensi', function (Blueprint $table) {
        $table->id();
        $table->foreignId('sesi_id')->constrained('sesi')->cascadeOnDelete();
        $table->foreignId('user_id')->constrained('users');
        $table->text('catatan')->nullable();
        $table->timestamp('waktu_isi')->useCurrent();
        $table->unique(['sesi_id', 'user_id']);
    });
}
```

**`create_anggaran_table`**
```php
public function up(): void
{
    Schema::create('anggaran', function (Blueprint $table) {
        $table->id();
        $table->foreignId('kegiatan_id')->constrained('kegiatan')->cascadeOnDelete();
        $table->enum('jenis', ['pemasukan', 'pengeluaran']);
        $table->string('sumber_kategori', 100);
        $table->decimal('estimasi', 12, 2)->default(0);
        $table->decimal('realisasi', 12, 2)->nullable();
        $table->timestamps();
    });
}
```

**`create_dokumentasi_table`**
```php
public function up(): void
{
    Schema::create('dokumentasi', function (Blueprint $table) {
        $table->id();
        $table->foreignId('kegiatan_id')->constrained('kegiatan')->cascadeOnDelete();
        $table->enum('tipe', ['foto', 'notulen']);
        $table->string('file_path', 255);
        $table->foreignId('uploaded_by')->constrained('users');
        $table->timestamps();
    });
}
```

**`create_evaluasi_table`**
```php
public function up(): void
{
    Schema::create('evaluasi', function (Blueprint $table) {
        $table->id();
        $table->foreignId('kegiatan_id')->constrained('kegiatan')->cascadeOnDelete();
        $table->foreignId('user_id')->constrained('users');
        $table->unsignedTinyInteger('rating'); // 1-5, divalidasi di FormRequest
        $table->text('komentar')->nullable();
        $table->unique(['kegiatan_id', 'user_id']);
        $table->timestamps();
    });
}
```

Jalankan:
```bash
php artisan migrate
```

---

## Bagian 4 — Model & Relasi

```bash
php artisan make:model Kegiatan
php artisan make:model Sesi
php artisan make:model Rundown
php artisan make:model DivisiPanitia
php artisan make:model TugasPanitia
php artisan make:model Rsvp
php artisan make:model Presensi
php artisan make:model Anggaran
php artisan make:model Dokumentasi
php artisan make:model Evaluasi
```

**`app/Models/Kegiatan.php`**
```php
class Kegiatan extends Model
{
    use SoftDeletes;

    protected $table = 'kegiatan';
    protected $fillable = ['nama', 'deskripsi', 'tipe', 'kuota', 'warna'];

    public function sesi(): HasMany
    {
        return $this->hasMany(Sesi::class);
    }

    public function divisiPanitia(): HasMany
    {
        return $this->hasMany(DivisiPanitia::class);
    }

    public function rsvp(): HasMany
    {
        return $this->hasMany(Rsvp::class);
    }

    public function anggaran(): HasMany
    {
        return $this->hasMany(Anggaran::class);
    }

    public function dokumentasi(): HasMany
    {
        return $this->hasMany(Dokumentasi::class);
    }

    public function evaluasi(): HasMany
    {
        return $this->hasMany(Evaluasi::class);
    }

    // FR-13: kuota hanya dihitung dari RSVP status = terdaftar
    public function sisaKuota(): ?int
    {
        if ($this->tipe !== 'terbuka') {
            return null;
        }

        return $this->kuota - $this->rsvp()->where('status', 'terdaftar')->count();
    }
}
```

**`app/Models/Sesi.php`** *(status = computed attribute, INTI dari keputusan "tanpa cron")*
```php
class Sesi extends Model
{
    use SoftDeletes;

    protected $table = 'sesi';
    protected $fillable = ['kegiatan_id', 'tanggal', 'waktu_mulai', 'waktu_selesai', 'lokasi'];
    protected $casts = ['tanggal' => 'date'];
    protected $appends = ['status'];

    public function kegiatan(): BelongsTo
    {
        return $this->belongsTo(Kegiatan::class);
    }

    public function rundown(): HasMany
    {
        return $this->hasMany(Rundown::class)->orderBy('urutan');
    }

    public function presensi(): HasMany
    {
        return $this->hasMany(Presensi::class);
    }

    // Dihitung on-the-fly, BUKAN kolom database — lihat SIGAP-DataDictionary.md §3
    public function getStatusAttribute(): string
    {
        $mulai = $this->tanggal->copy()->setTimeFromTimeString($this->waktu_mulai);
        $selesai = $this->tanggal->copy()->setTimeFromTimeString($this->waktu_selesai);
        $now = now();

        if ($now->lt($mulai)) return 'terjadwal';
        if ($now->between($mulai, $selesai)) return 'berlangsung';
        return 'selesai';
    }

    protected static function booted(): void
    {
        static::creating(function (Sesi $sesi) {
            $sesi->kode_presensi ??= Str::random(24);
        });
    }
}
```

Model lain (`Rundown`, `DivisiPanitia`, `TugasPanitia`, `Rsvp`, `Presensi`, `Anggaran`, `Dokumentasi`, `Evaluasi`) polanya sama: `$fillable` sesuai kolom di Data Dictionary + relasi `belongsTo`/`hasMany` sesuai ERD. Contoh singkat `Rsvp`:

```php
class Rsvp extends Model
{
    protected $table = 'rsvp';
    protected $fillable = ['kegiatan_id', 'user_id', 'status'];
    public $timestamps = false;

    public function kegiatan(): BelongsTo { return $this->belongsTo(Kegiatan::class); }
    public function user(): BelongsTo { return $this->belongsTo(User::class); }
}
```

Tambahkan juga di `app/Models/User.php`:
```php
protected $fillable = ['name', 'nim', 'email', 'password', 'role'];

public function isPengurus(): bool { return $this->role === 'pengurus'; }
public function isAnggota(): bool { return $this->role === 'anggota'; }
```

---

## Bagian 5 — Seeder Akun Pengurus Pertama

Sesuai `SRS.md` §2.6 (chicken-and-egg problem yang kita bahas) — akun Pengurus pertama dibuat manual lewat seeder, bukan lewat form:

**`database/seeders/DatabaseSeeder.php`**
```php
public function run(): void
{
    User::create([
        'name' => 'Salira Restu Gusti', // ganti sesuai Ketua/Wakil Ketua HMIF
        'nim' => '00000000',
        'email' => 'pengurus@hmif.local',
        'password' => Hash::make('ganti-setelah-login-pertama'),
        'role' => 'pengurus',
    ]);
}
```

```bash
php artisan db:seed
```

---

## Bagian 6 — Role Middleware & Manajemen Akun Anggota

```bash
php artisan make:middleware EnsureUserHasRole
```

**`app/Http/Middleware/EnsureUserHasRole.php`**
```php
public function handle(Request $request, Closure $next, string $role): Response
{
    if (! $request->user() || $request->user()->role !== $role) {
        abort(403);
    }

    return $next($request);
}
```

Daftarkan alias di `bootstrap/app.php`:
```php
->withMiddleware(function (Middleware $middleware) {
    $middleware->alias(['role' => \App\Http\Middleware\EnsureUserHasRole::class]);
})
```

Controller sederhana buat Pengurus bikin akun Anggota (FR-03):

```bash
php artisan make:controller AnggotaController
```

```php
class AnggotaController extends Controller
{
    public function index()
    {
        return Inertia::render('pengurus/anggota/index', [
            'anggota' => User::where('role', 'anggota')->get(),
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:150',
            'nim' => 'required|string|unique:users,nim',
            'email' => 'required|email|unique:users,email',
        ]);

        User::create([
            ...$data,
            'password' => Hash::make(Str::random(12)), // kirim manual/generate ulang nanti
            'role' => 'anggota',
        ]);

        return redirect()->back();
    }
}
```

---

## Bagian 7 — Modul Kegiatan & Sesi (Pola untuk Modul Lain)

```bash
php artisan make:controller KegiatanController
php artisan make:request StoreKegiatanRequest
```

**`app/Http/Requests/StoreKegiatanRequest.php`**
```php
public function rules(): array
{
    return [
        'nama' => 'required|string|max:150',
        'deskripsi' => 'nullable|string',
        'tipe' => 'required|in:wajib_hadir,terbuka',
        'kuota' => 'nullable|integer|min:1|required_if:tipe,terbuka',
        'sesi' => 'required|array|min:1',
        'sesi.*.tanggal' => 'required|date',
        'sesi.*.waktu_mulai' => 'required|date_format:H:i',
        'sesi.*.waktu_selesai' => 'required|date_format:H:i|after:sesi.*.waktu_mulai',
        'sesi.*.lokasi' => 'required|string|max:200',
    ];
}
```

**`app/Http/Controllers/KegiatanController.php`** (ringkas, method utama)
```php
class KegiatanController extends Controller
{
    private const PALET_WARNA = [
        '#5B4FE9', '#FF6F59', '#FFC857', '#2EC4B6', '#F45B8D',
        '#4FB6E9', '#9BD94B', '#A855C9', '#F2994A', '#1B8A8A',
    ];

    public function index()
    {
        return Inertia::render('kegiatan/index', [
            'kegiatan' => Kegiatan::withCount('sesi')->latest()->get(),
        ]);
    }

    public function store(StoreKegiatanRequest $request)
    {
        $validated = $request->validated();

        $kegiatan = Kegiatan::create([
            'nama' => $validated['nama'],
            'deskripsi' => $validated['deskripsi'] ?? null,
            'tipe' => $validated['tipe'],
            'kuota' => $validated['tipe'] === 'terbuka' ? $validated['kuota'] : null,
            'warna' => self::PALET_WARNA[Kegiatan::count() % count(self::PALET_WARNA)],
        ]);

        foreach ($validated['sesi'] as $sesiData) {
            $kegiatan->sesi()->create($sesiData);
        }

        return redirect()->route('kegiatan.index');
    }

    public function show(Kegiatan $kegiatan)
    {
        // Dipakai Event Detail Card (JSON, dipanggil dari React saat event kalender diklik)
        return response()->json(
            $kegiatan->load(['sesi.rundown', 'divisiPanitia.tugasPanitia'])
        );
    }
}
```

**`routes/web.php`** (potongan relevan)
```php
Route::middleware('auth')->group(function () {
    Route::get('/kalender', [CalendarController::class, 'index'])->name('kalender.index');
    Route::get('/kalender/events', [CalendarController::class, 'events']);
    Route::get('/kegiatan/{kegiatan}', [KegiatanController::class, 'show']);

    Route::middleware('role:pengurus')->group(function () {
        Route::resource('kegiatan', KegiatanController::class)->except('show');
        Route::get('/pengurus/anggota', [AnggotaController::class, 'index']);
        Route::post('/pengurus/anggota', [AnggotaController::class, 'store']);
    });
});
```

---

## Bagian 8 — FullCalendar

```bash
npm install @fullcalendar/react @fullcalendar/daygrid @fullcalendar/timegrid @fullcalendar/list @fullcalendar/interaction
```

**`app/Http/Controllers/CalendarController.php`**
```php
class CalendarController extends Controller
{
    public function index()
    {
        return Inertia::render('kalender/index');
    }

    public function events(Request $request)
    {
        $sesi = Sesi::with('kegiatan')
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
```

**`resources/js/pages/kalender/index.tsx`** (skeleton awal)
```tsx
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';

export default function KalenderIndex() {
    return (
        <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            events="/kalender/events"
            eventClick={(info) => {
                // TODO: buka Event Detail Card (slide-in), fetch GET /kegiatan/{id}
                console.log(info.event.extendedProps.kegiatanId);
            }}
        />
    );
}
```

Styling detail (warna token, radius, StatusSticker, dst.) ikuti `design.md` §3 & §4 — pasang lewat Tailwind config atau CSS variables di `app.css`.

---

## Bagian 9 — Cek Progress

```bash
php artisan serve
npm run dev
```

Checklist verifikasi Hari 6–9 (`SIGAP-TaskBreakdown-Harian.md`) beres:
- [ ] Login pakai akun seeder berhasil
- [ ] Pengurus bisa bikin akun Anggota baru
- [ ] Pengurus bisa bikin Kegiatan + Sesi (termasuk multi-hari, lebih dari 1 sesi)
- [ ] Kalender nampilin event dari `/kalender/events`, warna beda tiap kegiatan
- [ ] Klik event kalender berhasil fetch detail dari `/kegiatan/{id}`

---

## Lanjut ke Modul Berikutnya

Pola di atas (Migration → Model → FormRequest → Controller → Route → Page) tinggal diulang buat modul RSVP, Presensi, Panitia, Anggaran, Dokumentasi, Evaluasi, Dashboard, dan Export — **spesifikasi lengkap tiap endpoint udah ada** di `SIGAP-API-Endpoints.md`, urutan logikanya di masing-masing `SIGAP-SequenceDiagram-*.mermaid`, dan validasi bisnisnya di `SIGAP-DataDictionary.md`. Ikuti urutan hari di `SIGAP-TaskBreakdown-Harian.md` (Hari 11 dst) — jangan loncat ke Presensi sebelum RSVP kelar, karena presensi Kegiatan Terbuka butuh cek status RSVP dulu.
