<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('shipments', function (Blueprint $table) {
            $table->id();
            $table->string('tracking_number')->unique();
            $table->string('customer_name');
            $table->string('phone');
            $table->string('address');
            $table->decimal('cod_amount', 12, 2)->default(0);
            $table->string('status')->default('AtStation');
            $table->foreignId('courier_id')->nullable()->constrained('couriers')->nullOnDelete();
            $table->boolean('settled')->default(false);
            $table->timestamp('settled_at')->nullable();
            $table->json('timeline')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('shipments');
    }
};
