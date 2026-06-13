import * as React from "react"
import { cn } from "../../lib/utils"

const Button = React.forwardRef(({ className, variant = "default", size = "default", ...props }, ref) => {
  const baseStyles = "inline-flex items-center justify-center rounded text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none select-none font-sans"
  
  const variants = {
    default: "bg-accent text-bg hover:bg-accent-hover font-semibold",
    destructive: "bg-sell text-text-primary hover:bg-red-600",
    success: "bg-buy text-text-primary hover:bg-emerald-600",
    outline: "border border-border bg-transparent hover:bg-bg-1 text-text-primary",
    secondary: "bg-bg-2 text-text-primary hover:bg-bg-3",
    ghost: "hover:bg-bg-1 hover:text-text-primary text-text-secondary",
    link: "text-accent underline-offset-4 hover:underline",
  }

  const sizes = {
    default: "h-9 px-4 py-2",
    sm: "h-7 rounded px-3 text-xs",
    lg: "h-11 rounded px-8 text-base",
    icon: "h-9 w-9",
  }

  return (
    <button
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      ref={ref}
      {...props}
    />
  )
})
Button.displayName = "Button"

export { Button }
