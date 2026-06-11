<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\V1\Concerns\ApiResponse;
use App\Http\Controllers\Controller;
use App\Http\Requests\LoginRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AuthController extends Controller
{
    use ApiResponse;

    public function login(LoginRequest $request)
    {
        $credentials = $request->only('email', 'password');

        if (! Auth::attempt($credentials)) {
            return response()->json([
                'success' => false,
                'message' => 'Email atau kata sandi tidak valid.',
            ], 422);
        }

        $user = $request->user();
        $token = $user->createToken($request->input('device_name', 'web'))->plainTextToken;

        return $this->success('Login berhasil', [
            'token' => $token,
            'user' => $user,
        ]);
    }

    public function me(Request $request)
    {
        return $this->success('Profil berhasil diambil', $request->user());
    }

    public function logout(Request $request)
    {
        $request->user()?->currentAccessToken()?->delete();

        return $this->success('Logout berhasil');
    }
}
