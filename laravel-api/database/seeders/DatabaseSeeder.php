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

        User::updateOrCreate(
            ['email' => 'dispatcher@express.com'],
            [
                'name' => 'Dispatcher User',
                'role' => 'Dispatcher',
                'password' => Hash::make('Dispatch@123'),
            ]
        );

        User::updateOrCreate(
            ['email' => 'finance@express.com'],
            [
                'name' => 'Finance User',
                'role' => 'Finance',
                'password' => Hash::make('Finance@123'),
            ]
        );

        $this->call([
            CourierSeeder::class,
            ShipmentSeeder::class,
        ]);
    }
}
