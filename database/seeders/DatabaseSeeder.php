<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $password = Hash::make('password');

        $users = [
            [
                'name' => 'Admin',
                'email' => 'admin@gmail.com',
            ],
            [
                'name' => 'User',
                'email' => 'user@gmail.com',
            ],
        ];

        foreach ($users as $user) {
            $seededUser = User::query()->updateOrCreate(
                ['email' => $user['email']],
                [
                    'name' => $user['name'],
                    'password' => $password,
                ],
            );

            $seededUser->forceFill(['email_verified_at' => now()])->save();
        }
    }
}
