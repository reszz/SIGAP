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
        Schema::table('kegiatan', function (Blueprint $table) {
            if (! Schema::hasColumn('kegiatan', 'periode_id')) {
                $table->foreignId('periode_id')
                    ->nullable()
                    ->after('team_id')
                    ->constrained('periodes')
                    ->nullOnDelete();

                $table->index(['team_id', 'periode_id']);
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('kegiatan', function (Blueprint $table) {
            if (Schema::hasColumn('kegiatan', 'periode_id')) {
                $table->dropForeign(['periode_id']);
                $table->dropIndex(['team_id', 'periode_id']);
                $table->dropColumn('periode_id');
            }
        });
    }
};
