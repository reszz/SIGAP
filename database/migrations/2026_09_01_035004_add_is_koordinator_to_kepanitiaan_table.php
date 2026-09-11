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
        Schema::table('kepanitiaan', function (Blueprint $table) {
            $table->boolean('is_koordinator')->default(false)->after('jabatan');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('kepanitiaan', function (Blueprint $table) {
            $table->dropColumn('is_koordinator');
        });
    }
};
