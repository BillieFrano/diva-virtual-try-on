import { useState, useEffect } from "react"
import { X, Bug, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"

interface LogEntry {
  id: string
  timestamp: Date
  level: "info" | "warn" | "error" | "debug"
  message: string
  data?: any
}

interface DebugPanelProps {
  isOpen: boolean
  onClose: () => void
}

export function DebugPanel({ isOpen, onClose }: DebugPanelProps) {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [filter, setFilter] = useState<LogEntry["level"] | "all">("all")

  // Interceptar console.log
  useEffect(() => {
    if (!isOpen) return

    const originalLog = console.log
    const originalWarn = console.warn
    const originalError = console.error

    const addLog = (level: LogEntry["level"], message: string, ...args: any[]) => {
      const entry: LogEntry = {
        id: Math.random().toString(36).substring(7),
        timestamp: new Date(),
        level,
        message,
        data: args.length > 0 ? args : undefined,
      }
      setLogs((prev) => [...prev.slice(-99), entry])
    }

    console.log = (...args) => {
      addLog("info", String(args[0]), ...args.slice(1))
      originalLog.apply(console, args)
    }

    console.warn = (...args) => {
      addLog("warn", String(args[0]), ...args.slice(1))
      originalWarn.apply(console, args)
    }

    console.error = (...args) => {
      addLog("error", String(args[0]), ...args.slice(1))
      originalError.apply(console, args)
    }

    return () => {
      console.log = originalLog
      console.warn = originalWarn
      console.error = originalError
    }
  }, [isOpen])

  const clearLogs = () => setLogs([])

  const filteredLogs = filter === "all" ? logs : logs.filter((l) => l.level === filter)

  const getLevelColor = (level: LogEntry["level"]) => {
    switch (level) {
      case "error":
        return "text-red-500"
      case "warn":
        return "text-yellow-500"
      case "debug":
        return "text-purple-500"
      default:
        return "text-blue-500"
    }
  }

  const getLevelBadge = (level: LogEntry["level"]) => {
    switch (level) {
      case "error":
        return "destructive"
      case "warn":
        return "secondary"
      default:
        return "default"
    }
  }

  return (
    <div
      className={`fixed right-0 top-0 h-full w-96 bg-diva-dark-light border-l border-diva-pink/30 shadow-2xl z-50 debug-panel ${
        isOpen ? "open" : ""
      }`}
    >
      <Card className="h-full rounded-none border-0 bg-transparent">
        <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-border">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Bug className="w-4 h-4 text-diva-pink" />
            Debug Panel
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {/* Filtros */}
          <div className="flex items-center gap-1 p-2 border-b border-border">
            {(["all", "info", "warn", "error"] as const).map((f) => (
              <Button
                key={f}
                variant={filter === f ? "default" : "ghost"}
                size="sm"
                className="text-xs h-7 px-2"
                onClick={() => setFilter(f)}
              >
                {f === "all" ? "Todos" : f.toUpperCase()}
              </Button>
            ))}
            <div className="flex-1" />
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={clearLogs}
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>

          {/* Logs */}
          <ScrollArea className="h-[calc(100vh-140px)]">
            <div className="p-2 space-y-1">
              {filteredLogs.length === 0 ? (
                <p className="text-center text-muted-foreground text-sm py-8">
                  No hay logs
                </p>
              ) : (
                filteredLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-2 rounded bg-diva-dark text-xs font-mono space-y-1"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">
                        {log.timestamp.toLocaleTimeString()}
                      </span>
                      <Badge
                        variant={getLevelBadge(log.level)}
                        className={`text-xs ${getLevelColor(log.level)}`}
                      >
                        {log.level.toUpperCase()}
                      </Badge>
                    </div>
                    <p className={getLevelColor(log.level)}>{log.message}</p>
                    {log.data && (
                      <pre className="text-muted-foreground overflow-x-auto whitespace-pre-wrap">
                        {JSON.stringify(log.data, null, 2)}
                      </pre>
                    )}
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}
