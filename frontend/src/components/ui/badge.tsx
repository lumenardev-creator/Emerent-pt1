import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 shadow-sm hover:scale-105",
  {
    variants: {
      variant: {
        default: "border-transparent bg-gradient-primary text-primary-foreground hover:shadow-md hover-glow",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/90 hover:shadow-md",
        destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/90 hover:shadow-md",
        outline: "text-foreground border-border/60 bg-card/50 hover:bg-accent/30 hover:border-primary/30",
        success: "border-transparent bg-success text-success-foreground hover:bg-success/90 hover:shadow-md",
        warning: "border-transparent bg-warning text-warning-foreground hover:bg-warning/90 hover:shadow-md",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
