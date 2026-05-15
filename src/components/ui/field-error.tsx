import { cn } from '@/lib/utils';

interface FieldErrorProps {
  error: string | null | undefined;
  className?: string;
}

export function FieldError({ error, className }: FieldErrorProps) {
  if (!error) return null;
  return (
    <p className={cn('text-sm text-destructive mt-1', className)}>
      {error}
    </p>
  );
}
