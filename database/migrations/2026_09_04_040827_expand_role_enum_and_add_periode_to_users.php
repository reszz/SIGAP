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
        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('super_admin', 'pembina', 'pengurus', 'anggota') NOT NULL DEFAULT 'anggota'");
        }

        Schema::table('users', function (Blueprint $table) {
            if (! Schema::hasColumn('users', 'current_periode_id')) {
                $table->foreignId('current_periode_id')
                    ->nullable()
                    ->after('current_team_id')
                    ->constrained('periodes')
                    ->nullOnDelete();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'current_periode_id')) {
                $table->dropForeign(['current_periode_id']);
                $table->dropColumn('current_periode_id');
            }
        });

        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('pengurus', 'anggota') NOT NULL DEFAULT 'anggota'");
        }
    }
};
