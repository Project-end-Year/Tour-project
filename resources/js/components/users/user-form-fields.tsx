import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { User } from '@/types';

type UserFormErrors = Record<string, string | undefined>;

type UserFormFieldsProps = {
    errors: UserFormErrors;
    user?: Pick<User, 'name' | 'email'>;
};

export function UserFormFields({ errors, user }: UserFormFieldsProps) {
    const isEditing = Boolean(user);

    return (
        <>
            <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input
                    id="name"
                    name="name"
                    defaultValue={user?.name}
                    required
                    autoComplete="name"
                    placeholder="Full name"
                />
                <InputError message={errors.name} />
            </div>

            <div className="grid gap-2">
                <Label htmlFor="email">Email address</Label>
                <Input
                    id="email"
                    name="email"
                    type="email"
                    defaultValue={user?.email}
                    required
                    autoComplete="username"
                    placeholder="Email address"
                />
                <InputError message={errors.email} />
            </div>

            <div className="grid gap-2">
                <Label htmlFor="password">
                    {isEditing ? 'New password' : 'Password'}
                </Label>
                <PasswordInput
                    id="password"
                    name="password"
                    required={!isEditing}
                    autoComplete="new-password"
                    placeholder={
                        isEditing
                            ? 'Leave blank to keep current password'
                            : 'Password'
                    }
                />
                <InputError message={errors.password} />
            </div>

            <div className="grid gap-2">
                <Label htmlFor="password_confirmation">Confirm password</Label>
                <PasswordInput
                    id="password_confirmation"
                    name="password_confirmation"
                    required={!isEditing}
                    autoComplete="new-password"
                    placeholder="Confirm password"
                />
                <InputError message={errors.password_confirmation} />
            </div>
        </>
    );
}
