import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

type TabsVariant = "default" | "underline"

const TabsVariantContext = React.createContext<TabsVariant>("default")

const Tabs = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Root>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Root ref={ref} className={cn("bg-white", className)} {...props} />
))
Tabs.displayName = TabsPrimitive.Root.displayName

const tabsListVariants = cva("inline-flex items-center text-muted-foreground", {
  variants: {
    variant: {
      default: "h-9 justify-center rounded-md bg-white p-1",
      underline:
        "w-full h-10 gap-1 justify-start border-b border-border bg-white p-0 overflow-x-auto no-scrollbar md:overflow-visible",
    },
  },
  defaultVariants: { variant: "default" },
})

interface TabsListProps
  extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>,
    VariantProps<typeof tabsListVariants> {}

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  TabsListProps
>(({ className, variant, children, ...props }, ref) => {
  const v: TabsVariant = variant ?? "default"
  return (
    <TabsVariantContext.Provider value={v}>
      <TabsPrimitive.List
        ref={ref}
        className={cn(tabsListVariants({ variant: v }), className)}
        {...props}
      >
        {children}
      </TabsPrimitive.List>
    </TabsVariantContext.Provider>
  )
})
TabsList.displayName = TabsPrimitive.List.displayName

const tabsTriggerVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap text-px-13 font-medium ring-offset-background transition-all duration-150 ease-out focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "rounded-sm px-3 py-1.5 data-[state=active]:bg-white data-[state=active]:text-foreground data-[state=active]:shadow-sm",
        underline:
          "relative px-3 sm:px-4 h-10 -mb-px border-b-2 border-transparent bg-transparent text-muted-foreground hover:text-foreground hover:bg-muted/40 data-[state=active]:text-primary data-[state=active]:font-semibold data-[state=active]:border-primary data-[state=active]:bg-white md:flex-1",
      },
    },
    defaultVariants: { variant: "default" },
  }
)

interface TabsTriggerProps
  extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>,
    VariantProps<typeof tabsTriggerVariants> {}

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  TabsTriggerProps
>(({ className, variant, ...props }, ref) => {
  const ctx = React.useContext(TabsVariantContext)
  const v: TabsVariant = variant ?? ctx
  return (
    <TabsPrimitive.Trigger
      ref={ref}
      className={cn(tabsTriggerVariants({ variant: v }), className)}
      {...props}
    />
  )
})
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "bg-white ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className
    )}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent }
