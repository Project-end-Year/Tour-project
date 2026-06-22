import { Form, Head, Link, router } from '@inertiajs/react';
import { Edit, Plus, RotateCcw, Search, Trash2, UserCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
    create,
    destroy,
    edit,
    index,
} from '@/actions/App/Http/Controllers/UserController';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from '@/components/ui/pagination';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { UserAvatarIcon } from '@/components/users/user-avatar-icon';
import type { User } from '@/types';

type ManagedUser = Pick<
    User,
    | 'id'
    | 'name'
    | 'email'
    | 'avatar'
    | 'email_verified_at'
    | 'created_at'
    | 'updated_at'
>;

type PaginationLink = {
    active: boolean;
    label: string;
    url: string | null;
};

type PaginatedUsers = {
    current_page: number;
    data: ManagedUser[];
    from: number | null;
    last_page: number;
    links: PaginationLink[];
    next_page_url: string | null;
    per_page: number;
    prev_page_url: string | null;
    to: number | null;
    total: number;
};

type UsersIndexProps = {
    filters: {
        search: string;
    };
    users: PaginatedUsers;
    currentUserId: number;
};

function formatDate(value: string): string {
    return new Intl.DateTimeFormat(undefined, {
        dateStyle: 'medium',
    }).format(new Date(value));
}

function paginationLabel(label: string): string {
    return label.replace('&laquo;', '').replace('&raquo;', '').trim();
}

function DeleteUserDialog({
    disabled,
    user,
}: {
    disabled: boolean;
    user: ManagedUser;
}) {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    disabled={disabled}
                    title={disabled ? 'You cannot delete yourself' : undefined}
                >
                    <Trash2 className="size-4" />
                    <span className="sr-only">Delete {user.name}</span>
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogTitle>Delete user</DialogTitle>
                <DialogDescription>
                    Delete {user.name} permanently from this application.
                </DialogDescription>

                <Form
                    {...destroy.form(user.id)}
                    options={{ preserveScroll: true }}
                    className="space-y-6"
                >
                    {({ processing }) => (
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button type="button" variant="secondary">
                                    Cancel
                                </Button>
                            </DialogClose>
                            <Button
                                type="submit"
                                variant="destructive"
                                disabled={processing}
                            >
                                <Trash2 className="size-4" />
                                Delete user
                            </Button>
                        </DialogFooter>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    );
}

function UsersPagination({ users }: { users: PaginatedUsers }) {
    const pageLinks = users.links.filter((link) => {
        const label = paginationLabel(link.label).toLowerCase();

        return label !== 'previous' && label !== 'next';
    });

    return (
        <div className="flex flex-col gap-3 border-t px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
                Showing {users.from ?? 0} to {users.to ?? 0} of {users.total}{' '}
                users
            </p>

            {users.last_page > 1 && (
                <Pagination className="mx-0 justify-end">
                    <PaginationContent>
                        <PaginationItem>
                            {users.prev_page_url ? (
                                <PaginationPrevious asChild>
                                    <Link
                                        href={users.prev_page_url}
                                        preserveScroll
                                        preserveState
                                    >
                                        Previous
                                    </Link>
                                </PaginationPrevious>
                            ) : (
                                <PaginationPrevious
                                    aria-disabled
                                    className="pointer-events-none opacity-50"
                                />
                            )}
                        </PaginationItem>

                        {pageLinks.map((link, index) => {
                            const label = paginationLabel(link.label);

                            return (
                                <PaginationItem key={`${label}-${index}`}>
                                    {link.url ? (
                                        <PaginationLink
                                            asChild
                                            isActive={link.active}
                                        >
                                            <Link
                                                href={link.url}
                                                preserveScroll
                                                preserveState
                                            >
                                                {label}
                                            </Link>
                                        </PaginationLink>
                                    ) : (
                                        <PaginationEllipsis />
                                    )}
                                </PaginationItem>
                            );
                        })}

                        <PaginationItem>
                            {users.next_page_url ? (
                                <PaginationNext asChild>
                                    <Link
                                        href={users.next_page_url}
                                        preserveScroll
                                        preserveState
                                    >
                                        Next
                                    </Link>
                                </PaginationNext>
                            ) : (
                                <PaginationNext
                                    aria-disabled
                                    className="pointer-events-none opacity-50"
                                />
                            )}
                        </PaginationItem>
                    </PaginationContent>
                </Pagination>
            )}
        </div>
    );
}

export default function UsersIndex({
    currentUserId,
    filters,
    users,
}: UsersIndexProps) {
    const [searchTerm, setSearchTerm] = useState(filters.search);

    useEffect(() => {
        const normalizedSearchTerm = searchTerm.trim();

        if (normalizedSearchTerm === filters.search) {
            return;
        }

        const timeout = window.setTimeout(() => {
            router.get(
                index.url(),
                normalizedSearchTerm === ''
                    ? {}
                    : { search: normalizedSearchTerm },
                {
                    preserveScroll: true,
                    preserveState: true,
                    replace: true,
                },
            );
        }, 350);

        return () => window.clearTimeout(timeout);
    }, [filters.search, searchTerm]);

    return (
        <>
            <Head title="Users" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-xl font-semibold tracking-tight">
                            Users
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Manage login accounts.
                        </p>
                    </div>

                    <Button asChild>
                        <Link href={create()}>
                            <Plus className="size-4" />
                            New user
                        </Link>
                    </Button>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <div className="relative w-full sm:max-w-xs">
                        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            aria-label="Filter users by name"
                            type="search"
                            value={searchTerm}
                            onChange={(event) =>
                                setSearchTerm(event.target.value)
                            }
                            placeholder="Filter by name..."
                            autoComplete="off"
                            className="pl-9"
                        />
                    </div>
                    {searchTerm && (
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setSearchTerm('')}
                        >
                            <RotateCcw className="size-4" />
                            Reset
                        </Button>
                    )}
                </div>

                <Card className="gap-0 overflow-hidden rounded-lg py-0 shadow-none">
                    <CardHeader className="px-6 py-5">
                        <CardTitle>User list</CardTitle>
                        <CardDescription>
                            Review and manage login accounts.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader className="bg-muted/30">
                                <TableRow>
                                    <TableHead>User</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Created</TableHead>
                                    <TableHead className="text-right">
                                        Actions
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users.data.map((user) => {
                                    const isCurrentUser =
                                        user.id === currentUserId;

                                    return (
                                        <TableRow key={user.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <UserAvatarIcon
                                                        src={user.avatar}
                                                        className="size-11 rounded-md"
                                                    />
                                                    <div className="min-w-0">
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <p className="font-medium">
                                                                {user.name}
                                                            </p>
                                                            {isCurrentUser && (
                                                                <Badge variant="secondary">
                                                                    Current
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {user.email}
                                            </TableCell>
                                            <TableCell>
                                                {user.email_verified_at ? (
                                                    <Badge variant="outline">
                                                        <UserCheck className="size-3" />
                                                        Verified
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="secondary">
                                                        Unverified
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {formatDate(user.created_at)}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex justify-end gap-1">
                                                    <Button
                                                        asChild
                                                        variant="ghost"
                                                        size="icon"
                                                        className="size-8"
                                                    >
                                                        <Link
                                                            href={edit(user.id)}
                                                            title={`Edit ${user.name}`}
                                                        >
                                                            <Edit className="size-4" />
                                                            <span className="sr-only">
                                                                Edit {user.name}
                                                            </span>
                                                        </Link>
                                                    </Button>
                                                    <DeleteUserDialog
                                                        user={user}
                                                        disabled={isCurrentUser}
                                                    />
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>

                        {users.data.length === 0 && (
                            <div className="flex min-h-48 flex-col items-center justify-center gap-3 px-4 py-10 text-center">
                                <UserAvatarIcon className="size-12" />
                                <div>
                                    <p className="font-medium">
                                        No users found
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        Try a different name filter.
                                    </p>
                                </div>
                            </div>
                        )}

                        <UsersPagination users={users} />
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

UsersIndex.layout = {
    breadcrumbs: [
        {
            title: 'Users',
            href: index(),
        },
    ],
};
