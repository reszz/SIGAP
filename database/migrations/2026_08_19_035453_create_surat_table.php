<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('surat', function (Blueprint $table) {
            $table->id();
            $table->foreignId('kegiatan_id')->constrained('kegiatan')->cascadeOnDelete();
            $table->enum('tipe', ['masuk', 'keluar']);
            $table->string('nomor_surat', 100);
            $table->string('jenis_surat', 100);
            $table->string('perihal', 255);
            $table->date('tanggal_surat');
            $table->string('pengirim_penerima', 255);
            $table->string('file_path')->nullable();
            $table->text('keterangan')->nullable();
            $table->foreignId('dibuat_oleh')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['kegiatan_id', 'tipe']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('surat');
    }
};
