import { cn } from '@/lib/utils';

type UserAvatarIconProps = {
    className?: string;
    src?: string | null;
};

export function UserAvatarIcon({ className, src }: UserAvatarIconProps) {
    return (
        <span
            className={cn(
                'inline-flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-sidebar-border bg-muted text-muted-foreground',
                className,
            )}
            aria-hidden="true"
        >
            <img
                src={src ?? '/images/user-default.svg'}
                alt=""
                className={cn(src ? 'size-full object-cover' : 'size-5')}
                draggable={false}
            />
        </span>
    );
}
