<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Tabel periodes — ruang lingkup kepengurusan per-Team.
     *
     * Setiap Team dapat memiliki beberapa Periode (misal "2025/2026", "2026/2027").
     * is_aktif digunakan hanya sebagai "periode default" untuk user yang pertama kali login
     * atau belum punya current_periode_id — bukan sebagai "periode resmi sistem" tunggal,
     * karena setiap user bisa switch ke periode lain secara independen.
     */
    public function up(): void
    {
        Schema::create('periodes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('team_id')
                ->constrained('teams')
                ->cascadeOnDelete();
            $table->string('nama');                         // e.g. "2026/2027"
            $table->date('tanggal_mulai');
            $table->date('tanggal_selesai');
            $table->boolean('is_aktif')->default(false);    // untuk default awal user baru
            $table->foreignId('created_by')
                ->constrained('users')
                ->cascadeOnDelete();
            $table->timestamps();

            // Index performa — sering di-query per team, ordered by tanggal
            $table->index(['team_id', 'tanggal_mulai']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('periodes');
    }
};
