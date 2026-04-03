<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Shipment extends Model
{
    use HasFactory;

    public function courier()
    {
        return $this->belongsTo(Courier::class);
    }

    protected $fillable = [
        'tracking_number',
        'customer_name',
        'phone',
        'address',
        'cod_amount',
        'status',
        'courier_id',
        'settled',
        'settled_at',
        'timeline',
    ];

    protected function casts(): array
    {
        return [
            'cod_amount' => 'float',
            'settled' => 'boolean',
            'settled_at' => 'datetime',
            'timeline' => 'array',
        ];
    }
}
