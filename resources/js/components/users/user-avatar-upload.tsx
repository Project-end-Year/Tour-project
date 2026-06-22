import { ImagePlus } from 'lucide-react';
import { useEffect, useId, useState } from 'react';
import InputError from '@/components/input-error';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { User } from '@/types';

type UserFormErrors = Record<string, string | undefined>;

type UserAvatarUploadProps = {
    className?: string;
    errors: UserFormErrors;
    user?: Pick<User, 'avatar' | 'name'>;
};

export function UserAvatarUpload({
    className,
    errors,
    user,
}: UserAvatarUploadProps) {
    const inputId = useId();
    const [previewUrl, setPreviewUrl] = useState<string | null>(
        user?.avatar ?? null,
    );

    useEffect(() => {
        return () => {
            if (previewUrl?.startsWith('blob:')) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [previewUrl]);

    return (
        <Card className={cn('rounded-lg shadow-none', className)}>
            <CardHeader>
                <CardTitle>Profile image</CardTitle>
                <CardDescription>
                    Upload a clear image for this login account.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
                <label
                    htmlFor={inputId}
                    className="group relative flex aspect-[4/3] w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-dashed border-sidebar-border bg-muted/30 transition-colors focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50 hover:border-foreground/30"
                >
                    <input
                        id={inputId}
                        name="avatar"
                        type="file"
                        accept="image/jpeg,image/png,image/gif,image/webp"
                        className="sr-only"
                        onChange={(event) => {
                            const file = event.target.files?.[0];

                            setPreviewUrl(
                                file
                                    ? URL.createObjectURL(file)
                                    : (user?.avatar ?? null),
                            );
                        }}
                    />

                    {previewUrl ? (
                        <img
                            src={previewUrl}
                            alt={
                                user?.name
                                    ? `${user.name} preview`
                                    : 'Avatar preview'
                            }
                            className="size-full object-cover"
                        />
                    ) : (
                        <span className="flex size-28 items-center justify-center rounded-full bg-background shadow-xs">
                            <img
                                src="/images/user-default.svg"
                                alt=""
                                className="size-14"
                                draggable={false}
                            />
                        </span>
                    )}

                    <span className="absolute inset-0 flex items-center justify-center bg-black/55 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
                        <span className="flex flex-col items-center gap-2 text-sm font-medium text-white">
                            <ImagePlus className="size-6" />
                            Upload image
                        </span>
                    </span>
                </label>

                <p className="text-sm text-muted-foreground">
                    JPG, PNG, GIF or WebP up to 5 MB
                </p>
                <InputError message={errors.avatar} />
            </CardContent>
        </Card>
    );
}
