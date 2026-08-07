import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

/**
 * Shared typography primitives — thin wrappers around the semantic
 * `text-{token}` classes generated from `src/config/typography.config.ts`.
 *
 * Import these in every new page/component so titles look the same
 * everywhere and font changes flow from a single config file:
 *
 *   import { PageTitle, SectionTitle, Body, Muted, Metric } from '@/shared/components/Typography'
 *
 * Legacy `<Heading size="page|section|card|label">` and
 * `<Text variant="body|muted|muted-xs|metric|metric-sm">` are preserved
 * as aliases so nothing in the existing 800+ leaf files breaks.
 */

/* ------------------------------------------------------------------ */
/* Base variant                                                       */
/* ------------------------------------------------------------------ */

const typographyVariants = cva('', {
  variants: {
    token: {
      display:       'text-display font-display text-foreground',
      h1:            'text-h1 font-heading text-foreground',
      h2:            'text-h2 font-heading text-foreground',
      h3:            'text-h3 font-heading text-foreground',
      title:         'text-title font-heading text-foreground',
      subtitle:      'text-subtitle font-heading text-foreground',
      body:          'text-body font-body text-foreground',
      'body-sm':     'text-body-sm font-body text-foreground',
      muted:         'text-body font-body text-muted-foreground',
      'muted-sm':    'text-body-sm font-body text-muted-foreground',
      caption:       'text-caption font-body text-muted-foreground',
      label:         'text-label font-body text-foreground',
      overline:      'text-overline font-body uppercase text-muted-foreground',
      metric:        'text-metric font-display text-foreground tabular-nums',
      'metric-sm':   'text-metric-sm font-display text-foreground tabular-nums',
      'metric-lg':   'text-metric-lg font-display text-foreground tabular-nums',
      code:          'text-code font-mono text-foreground',
    },
  },
  defaultVariants: { token: 'body' },
})

type TypographyToken = NonNullable<VariantProps<typeof typographyVariants>['token']>

interface BaseProps extends React.HTMLAttributes<HTMLElement> {
  as?: React.ElementType
  className?: string
  muted?: boolean
  truncate?: boolean
  numeric?: boolean
}

function make(token: TypographyToken, defaultTag: React.ElementType) {
  const Comp = React.forwardRef<HTMLElement, BaseProps>(
    ({ as, className, muted, truncate, numeric, ...props }, ref) => {
      const Tag = (as ?? defaultTag) as React.ElementType
      return (
        <Tag
          ref={ref}
          className={cn(
            typographyVariants({ token }),
            muted && 'text-muted-foreground',
            truncate && 'truncate',
            numeric && 'tabular-nums',
            className,
          )}
          {...props}
        />
      )
    },
  )
  Comp.displayName = `Typography(${token})`
  return Comp as React.ForwardRefExoticComponent<
    BaseProps & React.RefAttributes<HTMLElement>
  >
}

/* ------------------------------------------------------------------ */
/* Semantic primitives                                                */
/* ------------------------------------------------------------------ */

export const PageTitle       = make('display', 'h1')
export const SectionTitle    = make('h1',      'h2')
export const SubsectionTitle = make('h2',      'h3')
export const CardTitle       = make('h3',      'h3')
export const Title           = make('title',   'h4')
export const Subtitle        = make('subtitle','p')

export const Body            = make('body',      'p')
export const BodySmall       = make('body-sm',   'p')
export const Muted           = make('muted',     'p')
export const MutedSmall      = make('muted-sm',  'p')
export const Caption         = make('caption',   'span')
export const FieldLabel      = make('label',     'label')
export const Overline        = make('overline',  'span')

export const Metric          = make('metric',     'div')
export const MetricSmall     = make('metric-sm',  'div')
export const MetricLarge     = make('metric-lg',  'div')

export const Code            = make('code', 'code')
export const Kbd             = React.forwardRef<HTMLElement, BaseProps>(
  ({ className, ...props }, ref) => (
    <kbd
      ref={ref}
      className={cn(
        'text-code font-mono inline-flex items-center rounded border border-border bg-muted px-1.5 py-0.5 text-muted-foreground',
        className,
      )}
      {...props}
    />
  ),
)
Kbd.displayName = 'Kbd'

/* ------------------------------------------------------------------ */
/* Hook                                                                */
/* ------------------------------------------------------------------ */

/** Returns the Tailwind class string for a given semantic token. */
export function useTypographyToken(token: TypographyToken): string {
  return typographyVariants({ token })
}

/* ------------------------------------------------------------------ */
/* Legacy API — DO NOT REMOVE (used across the codebase)              */
/* ------------------------------------------------------------------ */

const legacyHeadingMap = {
  page:    'display',
  section: 'h1',
  card:    'h3',
  label:   'label',
} as const

const headingVariants = cva('text-foreground', {
  variants: {
    size: {
      page:    'text-display font-display',
      section: 'text-h1 font-heading',
      card:    'text-h3 font-heading',
      label:   'text-label font-body',
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
void legacyHeadingMap

const textVariants = cva('', {
  variants: {
    variant: {
      body:        'text-body font-body text-foreground',
      muted:       'text-body font-body text-muted-foreground',
      'muted-xs':  'text-caption font-body text-muted-foreground',
      metric:      'text-metric font-display text-foreground tabular-nums',
      'metric-sm': 'text-metric-sm font-display text-foreground tabular-nums',
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
