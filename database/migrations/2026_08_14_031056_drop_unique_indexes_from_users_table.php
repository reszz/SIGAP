<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Drop unique indexes on nim and email — uniqueness is now enforced at the
     * application layer (validation with whereNull("deleted_at")) so that
     * soft-deleted users do not block re-registration with the same NIM/email.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropUnique('users_nim_unique');
            $table->dropUnique('users_email_unique');

            // Replace with plain (non-unique) indexes for query performance
            $table->index('nim', 'users_nim_index');
            $table->index('email', 'users_email_index');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex('users_nim_index');
            $table->dropIndex('users_email_index');

            $table->unique('nim', 'users_nim_unique');
            $table->unique('email', 'users_email_unique');
        });
    }
};
