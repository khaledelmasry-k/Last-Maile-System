<?php

use App\Models\Courier;
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

    Route::get('/couriers', function () {
        return Courier::query()->orderByDesc('id')->get();
    });

    Route::post('/couriers', function (Request $request) {
        $user = $request->user();
        if (!in_array($user->role, ['Admin', 'Dispatcher'], true)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

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
    });
});
