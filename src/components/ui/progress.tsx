import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"
import { cn } from "@/lib/utils"

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>
>(({ className, value, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn(
      "relative h-2 w-full overflow-hidden rounded-full bg-secondary",
      className
    )}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className="h-full w-full flex-1 progress-gradient transition-all"
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    />
  </ProgressPrimitive.Root>
))
Progress.displayName = ProgressPrimitive.Root.displayName

interface BatchProgressProps {
  total: number
  completed: number
  failed: number
  current: number
  className?: string
}

function BatchProgress({
  total,
  completed,
  failed,
  current,
  className,
}: BatchProgressProps) {
  const percentage = total > 0 ? (current / total) * 100 : 0

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">
          Procesando {current} de {total}
        </span>
        <span className="text-muted-foreground">
          {completed} completados · {failed} fallidos
        </span>
      </div>
      <div className="relative">
        <Progress value={percentage} />
        <div
          className="absolute top-0 h-2 w-1 bg-white/30 transition-all"
          style={{ left: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

export { Progress, BatchProgress }
