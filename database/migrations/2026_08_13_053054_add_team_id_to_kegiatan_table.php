<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Add team_id column if it does not exist yet
        if (! Schema::hasColumn('kegiatan', 'team_id')) {
            Schema::table('kegiatan', function (Blueprint $table) {
                $table->unsignedBigInteger('team_id')->nullable()->after('id');
            });
        }

        // Assign existing rows without a team_id to the first available team
        $firstTeamId = DB::table('teams')->orderBy('id')->value('id');
        if ($firstTeamId) {
            DB::table('kegiatan')->whereNull('team_id')->update(['team_id' => $firstTeamId]);
        }

        // Make the column NOT NULL and add the foreign-key constraint
        Schema::table('kegiatan', function (Blueprint $table) {
            $table->unsignedBigInteger('team_id')->nullable(false)->change();
            $table->foreign('team_id')->references('id')->on('teams')->cascadeOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('kegiatan', function (Blueprint $table) {
            $table->dropForeign(['team_id']);
            $table->dropColumn('team_id');
        });
    }
};
