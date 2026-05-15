import * as React from "react"
import { Link } from "react-router-dom"

import { cn } from "@/lib/utils"

const Table = React.forwardRef<
  HTMLTableElement,
  React.HTMLAttributes<HTMLTableElement>
>(({ className, ...props }, ref) => (
  <div className="relative w-full overflow-auto border border-border/30 rounded-lg">
    <table
      ref={ref}
      className={cn("w-full caption-bottom text-[13px]", className)}
      {...props}
    />
  </div>
))
Table.displayName = "Table"

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead ref={ref} className={cn("[&_tr]:border-b", className)} {...props} />
))
TableHeader.displayName = "TableHeader"

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn("[&_tr:last-child]:border-0", className)}
    {...props}
  />
))
TableBody.displayName = "TableBody"

const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn(
      "border-t bg-muted/50 font-medium [&>tr]:last:border-b-0",
      className
    )}
    {...props}
  />
))
TableFooter.displayName = "TableFooter"

/* ------------------------------------------------------------------ */
/* TableRow — now supports `to` prop for row-as-link (Twenty pattern) */
/* ------------------------------------------------------------------ */
export interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  /** If provided, the entire row becomes a navigable link */
  to?: string
  /** Visual selected state */
  isSelected?: boolean
}

const TableRow = React.forwardRef<HTMLTableRowElement, TableRowProps>(
  ({ className, to, isSelected, onClick, children, ...props }, ref) => {
    const isInteractive = !!(onClick || to);
    const baseClasses = cn(
      "border-b border-border/40 transition-all duration-150 ease-out",
      "hover:bg-foreground/[0.04]",
      isInteractive && [
        "cursor-pointer",
        "hover:bg-accent/60",
        "active:bg-accent/80",
        "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring/50 focus-visible:ring-inset",
        "group/row",
      ],
      isSelected && "bg-primary/[0.06] hover:bg-primary/[0.08]",
      className
    )

    // When `to` is provided, wrap row contents in a Link overlay
    if (to) {
      return (
        <tr ref={ref} className={cn(baseClasses, "relative")} {...props}>
          {children}
          {/* Invisible link overlay covering the full row */}
          <td className="absolute inset-0 p-0 border-0">
            <Link to={to} className="absolute inset-0" tabIndex={-1} aria-hidden />
          </td>
        </tr>
      )
    }

    return (
      <tr
        ref={ref}
        className={baseClasses}
        onClick={onClick}
        {...props}
      >
        {children}
      </tr>
    )
  }
)
TableRow.displayName = "TableRow"

const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      "h-9 px-3 text-left align-middle text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60 select-none [&:has([role=checkbox])]:pr-0",
      "bg-muted/30 first:rounded-tl-lg last:rounded-tr-lg",
      className
    )}
    {...props}
  />
))
TableHead.displayName = "TableHead"

const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={cn(
      "px-3 py-2 align-middle text-[13px] [&:has([role=checkbox])]:pr-0",
      "group-hover/row:text-foreground transition-colors duration-150",
      className
    )}
    {...props}
  />
))
TableCell.displayName = "TableCell"

const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption
    ref={ref}
    className={cn("mt-4 text-[13px] text-muted-foreground", className)}
    {...props}
  />
))
TableCaption.displayName = "TableCaption"

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
}
