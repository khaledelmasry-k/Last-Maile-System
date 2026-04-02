<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'admin@express.com'],
            [
                'name' => 'Admin User',
                'role' => 'Admin',
                'password' => Hash::make('Admin@123'),
            ]
        );

        $this->call([
            CourierSeeder::class,
        ]);
    }
}
