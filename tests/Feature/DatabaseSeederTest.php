<?php

use App\Models\User;
use Illuminate\Support\Facades\Hash;

test('admin user seeder creates a login user', function () {
    $this->seed();

    $admin = User::query()->where('email', 'admin@gmail.com')->first();

    expect($admin)
        ->not->toBeNull()
        ->and($admin->name)->toBe('Admin')
        ->and($admin->email_verified_at)->not->toBeNull()
        ->and(Hash::check('password', $admin->password))->toBeTrue();
});

test('seeded admin user can authenticate', function () {
    $this->seed();

    $response = $this->post(route('login.store'), [
        'email' => 'admin@gmail.com',
        'password' => 'password',
    ]);

    $this->assertAuthenticated();
    $response->assertRedirect(route('dashboard', absolute: false));
});
