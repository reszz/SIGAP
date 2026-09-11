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
        Schema::create('anggota_periode', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('periode_id')->constrained('periodes')->cascadeOnDelete();
            $table->foreignId('divisi_organisasi_id')->nullable()->constrained('divisi_organisasi')->nullOnDelete();
            $table->string('jabatan')->nullable();
            $table->string('status')->default('aktif');
            $table->timestamps();

            $table->unique(['user_id', 'periode_id']);
            $table->index(['periode_id', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('anggota_periode');
    }
};
