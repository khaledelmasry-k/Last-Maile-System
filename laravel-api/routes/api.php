<?php

use App\Models\Courier;
use App\Models\Shipment;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Route;

Route::post('/login', function (Request $request) {
    $data = $request->validate([
        'email' => ['required', 'email'],
        'password' => ['required', 'string'],
    ]);

    $user = User::where('email', $data['email'])->first();
    if (!$user || !Hash::check($data['password'], $user->password)) {
        return response()->json(['message' => 'Invalid credentials'], 401);
    }

    $token = $user->createToken('web')->plainTextToken;

    return response()->json([
        'accessToken' => $token,
        'tokenType' => 'Bearer',
        'user' => [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
        ],
    ]);
});

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/me', function (Request $request) {
        $user = $request->user();

        return response()->json([
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
        ]);
    });

    Route::post('/logout', function (Request $request) {
        $request->user()->currentAccessToken()?->delete();
        return response()->json(['ok' => true]);
    });

    Route::get('/couriers', fn () => Courier::query()->orderByDesc('id')->get());

    Route::post('/couriers', function (Request $request) {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'phone' => ['required', 'string', 'max:40'],
            'vehicle' => ['required', 'string', 'max:120'],
        ]);

        $next = Courier::max('id') + 1;
        $courier = Courier::create([
            'code' => sprintf('DRV-%03d', $next),
            'name' => $data['name'],
            'phone' => $data['phone'],
            'vehicle' => $data['vehicle'],
            'active' => true,
        ]);

        return response()->json($courier, 201);
    })->middleware('role:Admin,Dispatcher');

    Route::get('/shipments', function (Request $request) {
        $q = Shipment::query()->with('courier:id,name');
        $search = trim((string) $request->query('search', ''));
        if ($search !== '') {
            $q->where(function ($w) use ($search) {
                $w->where('tracking_number', 'like', "%{$search}%")
                    ->orWhere('customer_name', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%")
                    ->orWhere('address', 'like', "%{$search}%");
            });
        }

        return $q->orderByDesc('id')->get()->map(fn ($s) => [
            'id' => (string) $s->id,
            'trackingNumber' => $s->tracking_number,
            'customerName' => $s->customer_name,
            'phone' => $s->phone,
            'address' => $s->address,
            'codAmount' => $s->cod_amount,
            'status' => $s->status,
            'assignedTo' => $s->courier?->code,
            'timeline' => $s->timeline ?? [],
            'meta' => ['settled' => $s->settled, 'settledAt' => optional($s->settled_at)?->toISOString()],
        ])->values();
    });

    Route::post('/shipments/{id}/assign', function (Request $request, string $id) {
        $data = $request->validate([
            'courierCode' => ['nullable', 'string'],
            'courierId' => ['nullable', 'string'],
        ]);
        $shipment = Shipment::findOrFail((int) $id);
        $code = $data['courierCode'] ?? $data['courierId'] ?? null;
        if (!$code) {
            return response()->json(['message' => 'courierCode or courierId is required'], 422);
        }
        $courier = Courier::where('code', $code)->where('active', true)->firstOrFail();

        $shipment->courier_id = $courier->id;
        $shipment->status = 'Assigned';
        $timeline = $shipment->timeline ?? [];
        $timeline[] = ['status' => 'Assigned', 'timestamp' => now()->toISOString(), 'note' => "Assigned to {$courier->code}"];
        $shipment->timeline = $timeline;
        $shipment->save();

        return response()->json(['ok' => true]);
    })->middleware('role:Admin,Dispatcher');

    Route::post('/shipments/{id}/status', function (Request $request, string $id) {
        $data = $request->validate([
            'status' => ['required', 'string'],
            'note' => ['nullable', 'string', 'max:500'],
        ]);

        $shipment = Shipment::findOrFail((int) $id);
        $status = $data['status'];
        $role = $request->user()->role;

        $allowedByRole = [
            'Courier' => ['OutForDelivery', 'Delivered', 'Failed', 'Rescheduled'],
            'Dispatcher' => ['Assigned', 'AtStation', 'OutForDelivery', 'ReturnedToStation'],
            'Warehouse' => ['AtStation', 'ReturnedToStation'],
            'Admin' => ['AtStation', 'Assigned', 'OutForDelivery', 'Delivered', 'Failed', 'Rescheduled', 'ReturnedToStation', 'Lost'],
            'Finance' => [],
            'CS' => [],
        ];

        if (!in_array($status, $allowedByRole[$role] ?? [], true)) {
            return response()->json(['message' => 'Forbidden transition for role'], 403);
        }

        $shipment->status = $status;
        if (in_array($status, ['AtStation', 'ReturnedToStation'], true)) {
            $shipment->courier_id = null;
        }

        $timeline = $shipment->timeline ?? [];
        $timeline[] = ['status' => $status, 'timestamp' => now()->toISOString(), 'note' => $data['note'] ?? "Status updated to {$status}"];
        $shipment->timeline = $timeline;
        $shipment->save();

        return response()->json(['ok' => true]);
    });

    Route::post('/finance/settle/{courierCode}', function (string $courierCode) {
        $courier = Courier::where('code', $courierCode)->firstOrFail();

        $count = Shipment::where('courier_id', $courier->id)
            ->where('status', 'Delivered')
            ->where('settled', false)
            ->update(['settled' => true, 'settled_at' => now()]);

        return response()->json(['ok' => true, 'settled' => $count]);
    })->middleware('role:Admin,Finance');
});
