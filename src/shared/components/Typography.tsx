import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const headingVariants = cva('text-foreground', {
  variants: {
    size: {
      page: 'text-3xl md:text-4xl font-semibold tracking-tight',
      section: 'text-2xl font-semibold tracking-tight',
      card: 'text-lg font-semibold tracking-tight',
      label: 'text-sm font-medium',
    },
  },
  defaultVariants: { size: 'card' },
})

export interface HeadingProps
  extends React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof headingVariants> {
  as?: React.ElementType
}

export function Heading({ as: Comp = 'h3', size, className, ...props }: HeadingProps) {
  return <Comp className={cn(headingVariants({ size }), className)} {...props} />
}

const textVariants = cva('', {
  variants: {
    variant: {
      body: 'text-sm text-foreground',
      muted: 'text-sm text-muted-foreground',
      'muted-xs': 'text-xs text-muted-foreground',
      metric: 'text-2xl font-bold text-foreground',
      'metric-sm': 'text-lg font-semibold text-foreground',
    },
  },
  defaultVariants: { variant: 'body' },
})

export interface TextProps
  extends React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof textVariants> {
  as?: React.ElementType
}

export function Text({ as: Comp = 'span', variant, className, ...props }: TextProps) {
  return <Comp className={cn(textVariants({ variant }), className)} {...props} />
}

export default undefined
