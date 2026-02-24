
import { Sparkles, Github, Info } from "lucide-react"
import { Button } from "@/components/ui/button"

interface HeaderProps {
  onToggleDebug: () => void
}

export function Header({ onToggleDebug }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-diva-pink/20 bg-diva-dark/80 backdrop-blur-lg">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-btn flex items-center justify-center shadow-lg shadow-diva-pink/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold gradient-text">DIVA</h1>
            <p className="text-xs text-muted-foreground">Virtual Try-On</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="hidden sm:flex"
            onClick={() =>
              window.open("https://github.com", "_blank")
            }
          >
            <Github className="w-4 h-4 mr-2" />
            GitHub
          </Button>
          <Button variant="ghost" size="icon" onClick={onToggleDebug}>
            <Info className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </header>
  )
}
