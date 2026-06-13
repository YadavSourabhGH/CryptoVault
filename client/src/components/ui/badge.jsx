import * as React from "react"
import { cn } from "../../lib/utils"

function Badge({ className, variant = "default", ...props }) {
  const variants = {
    default: "border-transparent bg-accent text-bg hover:bg-accent/80",
    secondary: "border-transparent bg-bg-2 text-text-primary hover:bg-bg-3",
    success: "border-transparent bg-buy/20 text-buy border border-buy/30",
    destructive: "border-transparent bg-sell/20 text-sell border border-sell/30",
    outline: "text-text-primary border border-border",
  }

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-sm border px-2 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        variants[variant],
        className
      )}
      {...props}
    />
  )
}

export { Badge }
