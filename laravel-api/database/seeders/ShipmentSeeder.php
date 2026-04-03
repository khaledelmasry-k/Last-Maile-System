<?php

namespace Database\Seeders;

use App\Models\Shipment;
use Illuminate\Database\Seeder;

class ShipmentSeeder extends Seeder
{
    public function run(): void
    {
        $rows = [
            ['tracking_number' => 'AWB-10001', 'customer_name' => 'Ahmed Ali', 'phone' => '01111111111', 'address' => 'Nasr City, Cairo', 'cod_amount' => 350, 'status' => 'AtStation'],
            ['tracking_number' => 'AWB-10002', 'customer_name' => 'Mariam Tarek', 'phone' => '01111111112', 'address' => 'Maadi, Cairo', 'cod_amount' => 220, 'status' => 'Assigned', 'courier_id' => 1],
            ['tracking_number' => 'AWB-10003', 'customer_name' => 'Ola Hassan', 'phone' => '01111111113', 'address' => 'Heliopolis, Cairo', 'cod_amount' => 540, 'status' => 'Delivered', 'courier_id' => 2],
        ];

        foreach ($rows as $row) {
            Shipment::updateOrCreate(
                ['tracking_number' => $row['tracking_number']],
                array_merge($row, [
                    'timeline' => [
                        ['status' => $row['status'], 'timestamp' => now()->toISOString(), 'note' => 'Seed data'],
                    ],
                ])
            );
        }
    }
}
