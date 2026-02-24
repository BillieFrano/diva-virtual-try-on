
import { Settings, Wand2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface SettingsPanelProps {
  prompt: string
  onPromptChange: (value: string) => void
  aspectRatio: string
  onAspectRatioChange: (value: string) => void
  resolution: string
  onResolutionChange: (value: string) => void
  apiKey: string
  onApiKeyChange: (value: string) => void
}

const defaultPrompt = `Viste al modelo con la prenda proporcionada. 

Requisitos:
- La prenda debe ajustarse naturalmente al cuerpo del modelo
- Mantén la pose original del modelo
- Iluminación coherente entre modelo y prenda
- No alteres el rostro ni características del modelo
- Calidad fotográfica profesional`

export function SettingsPanel({
  prompt,
  onPromptChange,
  aspectRatio,
  onAspectRatioChange,
  resolution,
  onResolutionChange,
  apiKey,
  onApiKeyChange,
}: SettingsPanelProps) {
  return (
    <Card className="card-glow">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Settings className="w-5 h-5 text-diva-pink" />
          Configuración
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* API Key */}
        <div className="space-y-2">
          <Label htmlFor="apiKey" className="text-sm font-medium">
            Gemini API Key
          </Label>
          <input
            id="apiKey"
            type="password"
            value={apiKey}
            onChange={(e) => onApiKeyChange(e.target.value)}
            placeholder="Ingresa tu API key de Gemini"
            className="w-full px-3 py-2 rounded-md border border-input bg-diva-dark-light text-sm focus:ring-2 focus:ring-diva-pink/50"
          />
          <p className="text-xs text-muted-foreground">
            Tu API key se guarda solo en esta sesión
          </p>
        </div>

        {/* Prompt */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="prompt" className="text-sm font-medium">
              <Wand2 className="w-4 h-4 inline mr-1 text-diva-pink" />
              Prompt
            </Label>
            <button
              onClick={() => onPromptChange(defaultPrompt)}
              className="text-xs text-diva-pink hover:underline"
            >
              Restaurar default
            </button>
          </div>
          <Textarea
            id="prompt"
            value={prompt}
            onChange={(e) => onPromptChange(e.target.value)}
            placeholder="Describe cómo quieres que se procese la imagen..."
            className="min-h-[120px] resize-none"
          />
        </div>

        {/* Aspect Ratio y Resolución */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="aspectRatio" className="text-sm font-medium">
              Aspect Ratio
            </Label>
            <Select value={aspectRatio} onValueChange={onAspectRatioChange}>
              <SelectTrigger id="aspectRatio">
                <SelectValue placeholder="Seleccionar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1:1">1:1 (Cuadrado)</SelectItem>
                <SelectItem value="16:9">16:9 (Panorámico)</SelectItem>
                <SelectItem value="4:3">4:3 (Clásico)</SelectItem>
                <SelectItem value="9:16">9:16 (Vertical)</SelectItem>
                <SelectItem value="3:4">3:4 (Retrato)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="resolution" className="text-sm font-medium">
              Resolución
            </Label>
            <Select value={resolution} onValueChange={onResolutionChange}>
              <SelectTrigger id="resolution">
                <SelectValue placeholder="Seleccionar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1K">1K (1024px)</SelectItem>
                <SelectItem value="2K">2K (2048px)</SelectItem>
                <SelectItem value="4K">4K (4096px)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Preview de configuración */}
        <div className="p-3 rounded-lg bg-diva-dark-light border border-border">
          <p className="text-xs text-muted-foreground mb-1">Vista previa de configuración:</p>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <span className="text-diva-pink">Ratio:</span>
              <span>{aspectRatio}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-diva-pink">Res:</span>
              <span>{resolution}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
