import * as React from "react"
import { cn } from "@/lib/utils"

interface ScrollAreaProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: "vertical" | "horizontal" | "both"
}

const ScrollArea = React.forwardRef<HTMLDivElement, ScrollAreaProps>(
  ({ className, children, orientation = "vertical", ...props }, ref) => {
    const getOverflowClass = () => {
      switch (orientation) {
        case "horizontal":
          return "overflow-x-auto overflow-y-hidden"
        case "both":
          return "overflow-auto"
        default:
          return "overflow-y-auto overflow-x-hidden"
      }
    }

    return (
      <div
        ref={ref}
        className={cn(
          "relative",
          getOverflowClass(),
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
ScrollArea.displayName = "ScrollArea"

export { ScrollArea }
