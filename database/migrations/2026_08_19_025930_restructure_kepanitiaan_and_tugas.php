<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Drop tabel lama dan buat tabel kepanitiaan + tugas baru.
     *
     * Urutan drop penting: tugas_panitia (anak) dulu, baru divisi_panitia (induk).
     * Cascade FK ke kegiatan dan users memastikan tidak ada orphan data.
     */
    public function up(): void
    {
        // ─── Drop tabel lama ──────────────────────────────────────────────────
        Schema::dropIfExists('tugas_panitia');
        Schema::dropIfExists('divisi_panitia');

        // ─── Tabel kepanitiaan (baru) ─────────────────────────────────────────
        // Menggantikan DivisiPanitia. Satu baris = satu anggota dengan satu jabatan
        // pada satu Kegiatan. Jabatan tunggal (ketua_pelaksana/bendahara/sekretaris)
        // hanya boleh 1 baris per (kegiatan_id, jabatan) — divalidasi di aplikasi,
        // bukan DB unique constraint, karena divisi boleh banyak baris (SRS §5, NFR-03).
        Schema::create('kepanitiaan', function (Blueprint $table) {
            $table->id();
            $table->foreignId('kegiatan_id')
                ->constrained('kegiatan')
                ->cascadeOnDelete();
            $table->foreignId('user_id')
                ->constrained('users')
                ->cascadeOnDelete();
            $table->enum('jabatan', [
                'ketua_pelaksana',
                'bendahara',
                'sekretaris',
                'div_acara',
                'div_humas',
                'div_pdd',
                'div_logistik',
            ]);
            $table->timestamps();

            // Index gabungan untuk performa query filter jabatan per kegiatan
            $table->index(['kegiatan_id', 'jabatan']);
        });

        // ─── Tabel tugas (baru) ───────────────────────────────────────────────
        // Menggantikan TugasPanitia. Tugas hanya untuk 4 jabatan divisi —
        // ketua/bendahara/sekretaris tidak punya tugas (SRS §3.7, FR-31).
        // PIC wajib anggota divisi yang sama (FR-32, NFR-04) — divalidasi di aplikasi.
        Schema::create('tugas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('kegiatan_id')
                ->constrained('kegiatan')
                ->cascadeOnDelete();
            $table->enum('jabatan', [
                'div_acara',
                'div_humas',
                'div_pdd',
                'div_logistik',
            ]);
            $table->foreignId('pic_user_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();
            $table->foreignId('dibuat_oleh')
                ->constrained('users')
                ->cascadeOnDelete();
            $table->text('deskripsi_tugas');
            $table->enum('status', ['belum', 'sedang', 'selesai'])->default('belum');
            $table->enum('prioritas', ['rendah', 'sedang', 'tinggi'])->default('sedang');
            $table->date('deadline')->nullable();
            $table->timestamps();

            // Index untuk query "Tugas Saya" di Dashboard Anggota (FR-34)
            $table->index(['kegiatan_id', 'jabatan']);
            $table->index('pic_user_id');
        });
    }

    /**
     * Rollback: hapus tabel baru dan kembalikan tabel lama.
     */
    public function down(): void
    {
        Schema::dropIfExists('tugas');
        Schema::dropIfExists('kepanitiaan');

        // Kembalikan divisi_panitia
        Schema::create('divisi_panitia', function (Blueprint $table) {
            $table->id();
            $table->foreignId('kegiatan_id')
                ->constrained('kegiatan')
                ->cascadeOnDelete();
            $table->string('nama_divisi', 100);
            $table->timestamps();
        });

        // Kembalikan tugas_panitia
        Schema::create('tugas_panitia', function (Blueprint $table) {
            $table->id();
            $table->foreignId('divisi_id')
                ->constrained('divisi_panitia')
                ->cascadeOnDelete();
            $table->foreignId('user_id')
                ->constrained('users')
                ->cascadeOnDelete();
            $table->string('deskripsi_tugas', 255);
            $table->enum('status', ['belum', 'sedang', 'selesai'])->default('belum');
            $table->timestamps();
        });
    }
};
