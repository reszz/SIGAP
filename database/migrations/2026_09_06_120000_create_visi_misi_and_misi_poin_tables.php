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
        Schema::create('visi_misi', function (Blueprint $table) {
            $table->id();
            $table->foreignId('periode_id')
                ->unique()
                ->constrained('periodes')
                ->cascadeOnDelete();
            $table->text('visi');
            $table->timestamps();
        });

        Schema::create('misi_poin', function (Blueprint $table) {
            $table->id();
            $table->foreignId('visi_misi_id')
                ->constrained('visi_misi')
                ->cascadeOnDelete();
            $table->text('isi');
            $table->unsignedInteger('urutan')->default(1);
            $table->timestamps();

            $table->index(['visi_misi_id', 'urutan']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('misi_poin');
        Schema::dropIfExists('visi_misi');
    }
};
