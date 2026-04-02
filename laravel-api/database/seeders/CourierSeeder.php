<?php

namespace Database\Seeders;

use App\Models\Courier;
use Illuminate\Database\Seeder;

class CourierSeeder extends Seeder
{
    public function run(): void
    {
        $rows = [
            ['code' => 'DRV-001', 'name' => 'Ali Hassan', 'phone' => '01000000001', 'vehicle' => 'Motorbike', 'active' => true],
            ['code' => 'DRV-002', 'name' => 'Omar Adel', 'phone' => '01000000002', 'vehicle' => 'Van', 'active' => true],
            ['code' => 'DRV-003', 'name' => 'Mona Samir', 'phone' => '01000000003', 'vehicle' => 'Car', 'active' => true],
        ];

        foreach ($rows as $row) {
            Courier::updateOrCreate(['code' => $row['code']], $row);
        }
    }
}
