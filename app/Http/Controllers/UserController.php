<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreUserRequest;
use App\Http\Requests\UpdateUserRequest;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): Response
    {
        $search = $request->string('search')->trim()->limit(100, '')->toString();

        return Inertia::render('users/index', [
            'users' => $this->paginatedUsers($search),
            'filters' => [
                'search' => $search,
            ],
            'currentUserId' => $request->user()->id,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(): Response
    {
        return Inertia::render('users/create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreUserRequest $request): RedirectResponse
    {
        $avatarPath = $this->storeAvatar($request);

        $user = User::query()->create([
            ...$request->safe()->only(['name', 'email']),
            'avatar' => $avatarPath,
            'password' => $request->validated('password'),
        ]);

        $user->forceFill(['email_verified_at' => now()])->save();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('User created.')]);

        return to_route('users.index');
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(User $user): Response
    {
        return Inertia::render('users/edit', [
            'user' => $this->userPayload($user),
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateUserRequest $request, User $user): RedirectResponse
    {
        $oldAvatarPath = $user->getRawOriginal('avatar');
        $newAvatarPath = null;

        $user->fill($request->safe()->only(['name', 'email']));
        $user->forceFill(['email_verified_at' => now()]);

        if ($request->filled('password')) {
            $user->password = $request->validated('password');
        }

        if ($request->hasFile('avatar')) {
            $newAvatarPath = $this->storeAvatar($request);
            $user->avatar = $newAvatarPath;
        }

        $user->save();

        if ($newAvatarPath !== null) {
            $this->deleteAvatar($oldAvatarPath);
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => __('User updated.')]);

        return to_route('users.index');
    }

    /**
     * Remove the specified resource from storage.
     *
     * @throws ValidationException
     */
    public function destroy(Request $request, User $user): RedirectResponse
    {
        if ($request->user()->is($user)) {
            throw ValidationException::withMessages([
                'user' => __('You cannot delete your own user from user management.'),
            ]);
        }

        $avatarPath = $user->getRawOriginal('avatar');

        $user->delete();
        $this->deleteAvatar($avatarPath);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('User deleted.')]);

        return to_route('users.index');
    }

    /**
     * @return array{id: int, name: string, email: string, avatar: string|null, email_verified_at: string|null, created_at: string, updated_at: string}
     */
    private function userPayload(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'avatar' => $user->avatar,
            'email_verified_at' => $user->email_verified_at?->toISOString(),
            'created_at' => $user->created_at?->toISOString() ?? '',
            'updated_at' => $user->updated_at?->toISOString() ?? '',
        ];
    }

    /**
     * @return array{current_page: int, data: array<int, array{id: int, name: string, email: string, avatar: string|null, email_verified_at: string|null, created_at: string, updated_at: string}>, from: int|null, last_page: int, links: array<int, array{active: bool, label: string, url: string|null}>, next_page_url: string|null, per_page: int, prev_page_url: string|null, to: int|null, total: int}
     */
    private function paginatedUsers(string $search): array
    {
        $users = User::query()
            ->select(['id', 'name', 'email', 'avatar', 'email_verified_at', 'created_at', 'updated_at'])
            ->when($search !== '', fn (Builder $query) => $query->where('name', 'like', "%{$search}%"))
            ->latest()
            ->paginate(10)
            ->withQueryString();

        return [
            'current_page' => $users->currentPage(),
            'data' => $users->getCollection()
                ->map(fn (User $user): array => $this->userPayload($user))
                ->values()
                ->all(),
            'from' => $users->firstItem(),
            'last_page' => $users->lastPage(),
            'links' => collect(range(1, $users->lastPage()))
                ->map(fn (int $page): array => [
                    'active' => $page === $users->currentPage(),
                    'label' => (string) $page,
                    'url' => $users->url($page),
                ])
                ->values()
                ->all(),
            'next_page_url' => $users->nextPageUrl(),
            'per_page' => $users->perPage(),
            'prev_page_url' => $users->previousPageUrl(),
            'to' => $users->lastItem(),
            'total' => $users->total(),
        ];
    }

    private function storeAvatar(Request $request): ?string
    {
        $avatar = $request->file('avatar');

        if (! $avatar instanceof UploadedFile) {
            return null;
        }

        $avatarPath = $avatar->store('avatars/users', 'public');

        return $avatarPath === false ? null : $avatarPath;
    }

    private function deleteAvatar(?string $avatarPath): void
    {
        if ($avatarPath === null) {
            return;
        }

        Storage::disk('public')->delete($avatarPath);
    }
}
