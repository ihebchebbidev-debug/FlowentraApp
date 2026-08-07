import logoIcon from '@/assets/flowservice-logo-icon.png';
import { cn } from '@/lib/utils';

interface AiLogoIconProps {
  className?: string;
  size?: number;
  /** Use 'auto' to adapt to light/dark theme, 'light' for white icon, 'dark' for dark icon */
  variant?: 'auto' | 'light' | 'dark';
}

export const AiLogoIcon = ({ className, size = 16, variant = 'auto' }: AiLogoIconProps) => {
  const filterClass = variant === 'light'
    ? 'brightness-0 invert'                    // Force white
    : variant === 'dark'
    ? 'brightness-0'                           // Force dark/black
    : 'brightness-0 dark:brightness-0 dark:invert'; // Auto: black in light, white in dark

  return (
    <img
      src={logoIcon}
      alt="AI"
      width={size}
      height={size}
      className={cn('object-contain', filterClass, className)}
    />
  );
};
