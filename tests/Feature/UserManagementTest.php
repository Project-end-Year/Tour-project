<?php

use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

test('guests are redirected from user management', function () {
    $this->get(route('users.index'))
        ->assertRedirect(route('login'));
});

test('users index can be rendered', function () {
    $user = User::factory()->create();
    User::factory()->create(['name' => 'Managed User']);

    $this->actingAs($user)
        ->get(route('users.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('users/index')
            ->has('users.data', 2)
            ->where('users.total', 2)
            ->where('filters.search', '')
            ->where('currentUserId', $user->id),
        );
});

test('users index can be filtered by name', function () {
    $user = User::factory()->create(['name' => 'Current Admin']);
    User::factory()->create(['name' => 'Alice Manager']);
    User::factory()->create(['name' => 'Bob Manager']);

    $this->actingAs($user)
        ->get(route('users.index', ['search' => 'Alice']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('users/index')
            ->has('users.data', 1)
            ->where('users.data.0.name', 'Alice Manager')
            ->where('users.total', 1)
            ->where('filters.search', 'Alice'),
        );
});

test('users index is paginated', function () {
    $user = User::factory()->create();
    User::factory()->count(12)->create();

    $this->actingAs($user)
        ->get(route('users.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('users/index')
            ->has('users.data', 10)
            ->where('users.current_page', 1)
            ->where('users.last_page', 2)
            ->where('users.total', 13),
        );
});

test('users create page can be rendered', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get(route('users.create'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('users/create'),
        );
});

test('users edit page can be rendered', function () {
    $user = User::factory()->create();
    $managedUser = User::factory()->create([
        'avatar' => 'avatars/users/managed-user.jpg',
    ]);

    $this->actingAs($user)
        ->get(route('users.edit', $managedUser))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('users/edit')
            ->has('user', fn (Assert $page) => $page
                ->where('id', $managedUser->id)
                ->where('name', $managedUser->name)
                ->where('email', $managedUser->email)
                ->where('avatar', $managedUser->avatar)
                ->etc(),
            ),
        );
});

test('users can be created', function () {
    Storage::fake('public');

    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->post(route('users.store'), [
            'name' => 'New User',
            'email' => 'new-user@example.com',
            'avatar' => UploadedFile::fake()->image('avatar.jpg'),
            'password' => 'password',
            'password_confirmation' => 'password',
        ]);

    $response
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('users.index'));

    $createdUser = User::query()->where('email', 'new-user@example.com')->sole();

    expect($createdUser->name)->toBe('New User')
        ->and($createdUser->email_verified_at)->not->toBeNull()
        ->and($createdUser->getRawOriginal('avatar'))->not->toBeNull()
        ->and(Hash::check('password', $createdUser->password))->toBeTrue();

    Storage::disk('public')->assertExists($createdUser->getRawOriginal('avatar'));
});

test('users can be updated without changing password', function () {
    $user = User::factory()->create();
    $managedUser = User::factory()->create();
    $originalPassword = $managedUser->password;

    $response = $this
        ->actingAs($user)
        ->patch(route('users.update', $managedUser), [
            'name' => 'Updated User',
            'email' => 'updated-user@example.com',
            'password' => '',
            'password_confirmation' => '',
        ]);

    $response
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('users.index'));

    $managedUser->refresh();

    expect($managedUser->name)->toBe('Updated User')
        ->and($managedUser->email)->toBe('updated-user@example.com')
        ->and($managedUser->password)->toBe($originalPassword);
});

test('users password can be updated', function () {
    $user = User::factory()->create();
    $managedUser = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->patch(route('users.update', $managedUser), [
            'name' => $managedUser->name,
            'email' => $managedUser->email,
            'password' => 'new-password',
            'password_confirmation' => 'new-password',
        ]);

    $response
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('users.index'));

    expect(Hash::check('new-password', $managedUser->refresh()->password))->toBeTrue();
});

test('users avatar can be updated', function () {
    Storage::fake('public');
    Storage::disk('public')->put('avatars/users/old-avatar.jpg', 'old-avatar');

    $user = User::factory()->create();
    $managedUser = User::factory()->create([
        'avatar' => 'avatars/users/old-avatar.jpg',
    ]);

    $response = $this
        ->actingAs($user)
        ->post(route('users.update', $managedUser), [
            '_method' => 'PATCH',
            'name' => $managedUser->name,
            'email' => $managedUser->email,
            'avatar' => UploadedFile::fake()->image('new-avatar.jpg'),
            'password' => '',
            'password_confirmation' => '',
        ]);

    $response
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('users.index'));

    $newAvatarPath = $managedUser->refresh()->getRawOriginal('avatar');

    expect($newAvatarPath)->not->toBe('avatars/users/old-avatar.jpg')
        ->and($managedUser->avatar)->toContain('/storage/avatars/users/');

    Storage::disk('public')->assertExists($newAvatarPath);
    Storage::disk('public')->assertMissing('avatars/users/old-avatar.jpg');
});

test('users can be deleted', function () {
    Storage::fake('public');
    Storage::disk('public')->put('avatars/users/user-avatar.jpg', 'user-avatar');

    $user = User::factory()->create();
    $managedUser = User::factory()->create([
        'avatar' => 'avatars/users/user-avatar.jpg',
    ]);

    $response = $this
        ->actingAs($user)
        ->delete(route('users.destroy', $managedUser));

    $response
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('users.index'));

    expect($managedUser->fresh())->toBeNull();

    Storage::disk('public')->assertMissing('avatars/users/user-avatar.jpg');
});

test('users cannot delete their own account from user management', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->from(route('users.index'))
        ->delete(route('users.destroy', $user));

    $response
        ->assertSessionHasErrors('user')
        ->assertRedirect(route('users.index'));

    $this->assertModelExists($user);
});
