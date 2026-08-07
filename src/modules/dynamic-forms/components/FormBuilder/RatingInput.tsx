import React, { useState } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RatingInputProps {
  value?: number;
  onChange: (value: number) => void;
  maxStars?: number;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function RatingInput({ 
  value = 0, 
  onChange, 
  maxStars = 5,
  disabled = false,
  size = 'md'
}: RatingInputProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null);

  const displayValue = hoverValue !== null ? hoverValue : value;

  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  const gapClasses = {
    sm: 'gap-0.5',
    md: 'gap-1',
    lg: 'gap-1.5'
  };

  const handleClick = (rating: number) => {
    if (disabled) return;
    // Toggle off if clicking the same rating
    if (rating === value) {
      onChange(0);
    } else {
      onChange(rating);
    }
  };

  return (
    <div 
      className={cn(
        'flex items-center',
        gapClasses[size],
        disabled && 'opacity-50 cursor-not-allowed'
      )}
      onMouseLeave={() => setHoverValue(null)}
    >
      {Array.from({ length: maxStars }, (_, i) => i + 1).map((rating) => (
        <button
          key={rating}
          type="button"
          disabled={disabled}
          onClick={() => handleClick(rating)}
          onMouseEnter={() => !disabled && setHoverValue(rating)}
          className={cn(
            'transition-all duration-150',
            !disabled && 'hover:scale-110 cursor-pointer',
            disabled && 'cursor-not-allowed'
          )}
        >
          <Star
            className={cn(
              sizeClasses[size],
              'transition-colors duration-150',
              rating <= displayValue
                ? 'fill-amber-400 text-amber-400'
                : 'fill-transparent text-muted-foreground/40'
            )}
          />
        </button>
      ))}
      
      {value > 0 && (
        <span className="ml-2 text-sm font-medium text-muted-foreground">
          {value}/{maxStars}
        </span>
      )}
    </div>
  );
}
