import { Form, Head, Link } from '@inertiajs/react';
import { Save } from 'lucide-react';
import { index, update } from '@/actions/App/Http/Controllers/UserController';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { UserAvatarUpload } from '@/components/users/user-avatar-upload';
import { UserFormFields } from '@/components/users/user-form-fields';
import type { User } from '@/types';

type ManagedUser = Pick<User, 'id' | 'name' | 'email' | 'avatar'>;

type EditUserProps = {
    user: ManagedUser;
};

export default function EditUser({ user }: EditUserProps) {
    return (
        <>
            <Head title="Edit User" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-4">
                <h1 className="text-xl font-semibold tracking-tight">
                    Edit User
                </h1>

                <Form
                    {...update.form.patch(user.id)}
                    options={{ preserveScroll: true }}
                    className="space-y-6"
                >
                    {({ processing, errors }) => (
                        <>
                            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
                                <Card className="rounded-lg shadow-none">
                                    <CardHeader>
                                        <CardTitle>User details</CardTitle>
                                        <CardDescription>
                                            Update the login information for
                                            this user.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="grid gap-5 md:grid-cols-2">
                                        <UserFormFields
                                            errors={errors}
                                            user={user}
                                        />
                                    </CardContent>
                                </Card>

                                <UserAvatarUpload errors={errors} user={user} />
                            </div>

                            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                                <Button asChild variant="outline">
                                    <Link href={index()}>Cancel</Link>
                                </Button>
                                <Button type="submit" disabled={processing}>
                                    <Save className="size-4" />
                                    Save changes
                                </Button>
                            </div>
                        </>
                    )}
                </Form>
            </div>
        </>
    );
}

EditUser.layout = {
    breadcrumbs: [
        {
            title: 'Users',
            href: index(),
        },
        {
            title: 'Edit User',
            href: '#',
        },
    ],
};
