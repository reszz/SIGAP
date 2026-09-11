<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('pengurus_struktur', function (Blueprint $table) {
            $table->id();
            $table->foreignId('team_id')->constrained('teams')->cascadeOnDelete();
            $table->string('nama');
            $table->string('jabatan');
            $table->foreignId('divisi_organisasi_id')
                ->nullable()
                ->constrained('divisi_organisasi')
                ->nullOnDelete();
            $table->string('foto_path')->nullable();
            $table->integer('urutan_tampil')->default(0);
            $table->string('periode')->default('2026/2027');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pengurus_struktur');
    }
};
