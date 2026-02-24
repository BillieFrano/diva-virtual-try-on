import { useState, useEffect, useCallback, useRef } from "react"
import { Play, Archive, Trash2, Sparkles, ArrowLeft, Palette, User, Camera } from "lucide-react"
import { Toaster, toast } from "sonner"
import JSZip from "jszip"
import { saveAs } from "file-saver"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { BatchProgress } from "@/components/ui/progress"

import { Header } from "@/components/Header"
import { StudioSelector } from "@/components/StudioSelector"
import { MultiGarmentDropzone } from "@/components/MultiGarmentDropzone"
import { GarmentGallery } from "@/components/GarmentGallery"
import { ResultsGallery } from "@/components/ResultsGallery"
import { SettingsPanel } from "@/components/SettingsPanel"
import { DebugPanel } from "@/components/DebugPanel"

import { getGeminiService } from "@/services/geminiService"
import { useImageProcessor } from "@/hooks/useImageProcessor"
import { dataURLtoFile } from "@/lib/utils"
import { defaultStudioConfig, type StudioConfig } from "@/data/studioConfig"

import type { ProcessingItem } from "@/hooks/useImageProcessor"

// ============================================
// PROMPTS ENRIQUECIDOS CON STUDIO CONFIG
// ============================================
function generateStudioPrompt(config: StudioConfig): string {
  const basePrompt = `Professional fashion photography of a model wearing the provided garment.

STUDIO SETUP:
- Model: ${config.model.name} (${config.model.ethnicity}, ${config.model.bodyType} body type)
- Location: ${config.space.name} - ${config.space.description}
- Lighting: ${config.lighting.name}
- Photography Style: ${config.photoStyle.name}

TECHNICAL REQUIREMENTS:
- The garment must fit naturally on the model's body
- Maintain professional model pose
- Coherent lighting between model and garment
- Do not alter model's face or features
- Photorealistic quality, professional fashion photography
- ${config.lighting.promptModifier}
- ${config.photoStyle.promptModifier}
- Background/Environment: ${config.space.description}`

  return basePrompt
}

function App() {
  // ============================================
  // APP STATE
  // ============================================
  const [appMode, setAppMode] = useState<'studio' | 'production'>('studio')
  const [studioConfig, setStudioConfig] = useState<StudioConfig>(defaultStudioConfig)
  const [modelImage, setModelImage] = useState<File | null>(null)
  const [, setModelPreview] = useState<string | null>(null)
  
  // Estados de prendas
  const [garments, setGarments] = useState<File[]>([])
  const [garmentPreviews, setGarmentPreviews] = useState<Map<string, string>>(new Map())

  // Estados de configuración
  const [apiKey, setApiKey] = useState(localStorage.getItem("diva_api_key") || "")
  const [prompt, setPrompt] = useState("")
  const [aspectRatio, setAspectRatio] = useState("1:1")
  const [resolution, setResolution] = useState("1K")

  // Estados de UI
  const [debugOpen, setDebugOpen] = useState(false)
  const [showDebugTrigger, setShowDebugTrigger] = useState(false)

  // Servicio y procesador
  const geminiService = useRef(getGeminiService(apiKey)).current
  const { isProcessing, items, batchProgress, processBatch, cancelProcessing, reset, retryItem } =
    useImageProcessor(geminiService)

  // ============================================
  // EFFECTS
  // ============================================
  
  // Guardar API key en localStorage
  useEffect(() => {
    if (apiKey) {
      localStorage.setItem("diva_api_key", apiKey)
      geminiService.setApiKey(apiKey)
    }
  }, [apiKey, geminiService])

  // Actualizar prompt cuando cambia la config del studio
  useEffect(() => {
    setPrompt(generateStudioPrompt(studioConfig))
  }, [studioConfig])

  // Verificar parámetro de debug en URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const debugParam = params.get("debug")
    if (debugParam === "nano2024banana") {
      setShowDebugTrigger(true)
      toast.success("Modo debug activado")
    }
  }, [])

  // ============================================
  // STUDIO HANDLERS
  // ============================================
  
  const handleStudioConfigChange = useCallback((newConfig: StudioConfig) => {
    setStudioConfig(newConfig)
    
    // Si hay imagen custom, crear preview
    if (newConfig.customModelImage) {
      setModelImage(newConfig.customModelImage)
      const reader = new FileReader()
      reader.onloadend = () => {
        setModelPreview(reader.result as string)
      }
      reader.readAsDataURL(newConfig.customModelImage)
    } else {
      // Usar modelo virtual - generar preview placeholder
      setModelImage(null)
      setModelPreview(null)
    }
  }, [])

  const handleContinueToProduction = useCallback(() => {
    if (!studioConfig.customModelImage) {
      // Para modelos virtuales, necesitamos verificar API key
      if (!apiKey) {
        toast.error("Configura tu API key de Gemini primero")
        return
      }
      // El modelo virtual se generará con la API
      toast.info(`Set configurado: ${studioConfig.model.name} + ${studioConfig.space.name}`)
    } else {
      toast.info(`Usando tu modelo personalizado`)
    }
    setAppMode('production')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [studioConfig, apiKey])

  const handleBackToStudio = useCallback(() => {
    setAppMode('studio')
    reset()
    setGarments([])
    setGarmentPreviews(new Map())
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [reset])

  // ============================================
  // GARMENT HANDLERS
  // ============================================
  
  const handleGarmentsSelect = useCallback((files: File[]) => {
    setGarments((prev) => {
      const newGarments = [...prev, ...files]
      files.forEach((file) => {
        const reader = new FileReader()
        reader.onloadend = () => {
          setGarmentPreviews((prevMap) => {
            const newMap = new Map(prevMap)
            newMap.set(file.name, reader.result as string)
            return newMap
          })
        }
        reader.readAsDataURL(file)
      })
      return newGarments.slice(0, 200)
    })
  }, [])

  const handleRemoveGarment = useCallback((index: number) => {
    setGarments((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const handleClearAllGarments = useCallback(() => {
    setGarments([])
    setGarmentPreviews(new Map())
  }, [])

  // ============================================
  // PROCESSING HANDLERS
  // ============================================
  
  const handleStartProcessing = useCallback(async () => {
    if (garments.length === 0) {
      toast.error("Carga al menos una prenda")
      return
    }
    if (!apiKey) {
      toast.error("Configura tu API key de Gemini")
      return
    }

    reset()

    try {
      // Si tenemos modelo custom, lo usamos directamente
      // Si no, la API de Gemini generará el modelo virtual según el prompt
      const effectiveModelImage = modelImage || new File([], "virtual-model.txt")
      
      await processBatch(
        effectiveModelImage,
        garments,
        prompt,
        aspectRatio,
        resolution,
        (item) => {
          if (item.status === "completed") {
            toast.success(`Completado: ${item.garmentFile.name}`)
          }
        }
      )
      toast.success("Producción completada")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error en la producción")
    }
  }, [garments, apiKey, modelImage, prompt, aspectRatio, resolution, processBatch, reset])

  const handleDownload = useCallback((item: ProcessingItem) => {
    if (!item.result?.imageUrl) return
    const link = document.createElement("a")
    link.href = item.result.imageUrl
    link.download = `diva-${studioConfig.model.name}-${item.garmentFile.name}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success(`Descargado: ${item.garmentFile.name}`)
  }, [studioConfig.model.name])

  const handleDownloadAll = useCallback(async () => {
    const completedItems = items.filter((item) => item.status === "completed" && item.result?.imageUrl)
    if (completedItems.length === 0) {
      toast.error("No hay imágenes para descargar")
      return
    }

    toast.info("Creando archivo ZIP...")
    const zip = new JSZip()
    const folder = zip.folder(`diva-${studioConfig.model.name}-collection`)

    for (let i = 0; i < completedItems.length; i++) {
      const item = completedItems[i]
      if (item.result?.imageUrl) {
        const file = dataURLtoFile(item.result.imageUrl, `${studioConfig.model.name}-look-${i + 1}.png`)
        folder?.file(file.name, file)
      }
    }

    const content = await zip.generateAsync({ type: "blob" })
    saveAs(content, `diva-${studioConfig.model.name}-${Date.now()}.zip`)
    toast.success(`ZIP descargado con ${completedItems.length} imágenes`)
  }, [items, studioConfig.model.name])

  const handleRetry = useCallback(
    async (itemId: string) => {
      if (!modelImage && !studioConfig.customModelImage) return
      toast.info("Reintentando...")
      const effectiveModelImage = modelImage || new File([], "virtual-model.txt")
      await retryItem(itemId, effectiveModelImage, prompt, aspectRatio, resolution)
    },
    [modelImage, studioConfig.customModelImage, prompt, aspectRatio, resolution, retryItem]
  )

  // ============================================
  // RENDER HELPERS
  // ============================================
  
  const completedCount = items.filter((i) => i.status === "completed").length
  const failedCount = items.filter((i) => i.status === "error").length

  // ============================================
  // RENDER: STUDIO MODE
  // ============================================
  if (appMode === 'studio') {
    return (
      <div className="min-h-screen bg-diva-dark grid-pattern">
        <Toaster 
          position="top-right" 
          theme="dark"
          toastOptions={{
            style: {
              background: '#1e1e1e',
              border: '1px solid #e91e63',
              color: '#fff',
            },
          }}
        />
        
        <Header onToggleDebug={() => showDebugTrigger && setDebugOpen(true)} />

        <main className="container mx-auto px-4 py-8">
          {/* Studio Header */}
          <div className="text-center mb-8">
            <Badge variant="pink" className="mb-4">PASO 1 DE 2</Badge>
            <h1 className="text-4xl font-bold text-white mb-2">DIVA Studio</h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Configurá tu set de producción. Seleccioná modelo, espacio, iluminación y estilo. 
              Después cargá tus prendas para la producción masiva.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar - Settings */}
            <div className="lg:col-span-1">
              <SettingsPanel
                prompt={prompt}
                onPromptChange={setPrompt}
                aspectRatio={aspectRatio}
                onAspectRatioChange={setAspectRatio}
                resolution={resolution}
                onResolutionChange={setResolution}
                apiKey={apiKey}
                onApiKeyChange={setApiKey}
              />
            </div>

            {/* Main - Studio Selector */}
            <div className="lg:col-span-3">
              <StudioSelector
                config={studioConfig}
                onConfigChange={handleStudioConfigChange}
                onContinue={handleContinueToProduction}
              />
            </div>
          </div>
        </main>

        {showDebugTrigger && (
          <DebugPanel isOpen={debugOpen} onClose={() => setDebugOpen(false)} />
        )}

        <footer className="border-t border-diva-pink/20 mt-12 py-6">
          <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
            <p>
              DIVA Studio powered by{" "}
              <span className="text-diva-pink">Gemini AI</span>
            </p>
          </div>
        </footer>
      </div>
    )
  }

  // ============================================
  // RENDER: PRODUCTION MODE
  // ============================================
  return (
    <div className="min-h-screen bg-diva-dark grid-pattern">
      <Toaster 
        position="top-right" 
        theme="dark"
        toastOptions={{
          style: {
            background: '#1e1e1e',
            border: '1px solid #e91e63',
            color: '#fff',
          },
        }}
      />
      
      <Header onToggleDebug={() => showDebugTrigger && setDebugOpen(true)} />

      <main className="container mx-auto px-4 py-8">
        {/* Production Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Badge variant="pink">PASO 2 DE 2</Badge>
              <Badge variant="outline">{studioConfig.model.name}</Badge>
              <Badge variant="outline">{studioConfig.space.name}</Badge>
            </div>
            <h1 className="text-3xl font-bold text-white">Producción</h1>
            <p className="text-muted-foreground">
              Cargá tus prendas para generar el lookbook con la configuración del set
            </p>
          </div>
          
          <Button 
            variant="outline" 
            onClick={handleBackToStudio}
            className="self-start"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al Studio
          </Button>
        </div>

        {/* Studio Config Summary */}
        <Card className="mb-6 bg-gradient-to-r from-diva-pink/10 to-purple-900/20 border-diva-pink/30">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-diva-pink/20 flex items-center justify-center">
                  <User className="w-5 h-5 text-diva-pink" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Modelo</p>
                  <p className="text-sm font-medium text-white">
                    {studioConfig.customModelImage ? "Custom" : studioConfig.model.name}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-diva-pink/20 flex items-center justify-center">
                  <Camera className="w-5 h-5 text-diva-pink" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Espacio</p>
                  <p className="text-sm font-medium text-white">{studioConfig.space.name}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-diva-pink/20 flex items-center justify-center">
                  <Palette className="w-5 h-5 text-diva-pink" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Iluminación</p>
                  <p className="text-sm font-medium text-white">{studioConfig.lighting.name}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-diva-pink/20 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-diva-pink" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Estilo</p>
                  <p className="text-sm font-medium text-white">{studioConfig.photoStyle.name}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Columna izquierda - Prendas y Controles */}
          <div className="space-y-6">
            {/* Garments Upload */}
            <Card className="card-glow">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-lg">
                  <span className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-diva-pink" />
                    Prendas
                  </span>
                  <Badge variant="pink">{garments.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <MultiGarmentDropzone
                  onFilesSelect={handleGarmentsSelect}
                  garmentCount={garments.length}
                />
                <Separator />
                <GarmentGallery
                  garments={garments}
                  previews={garmentPreviews}
                  onRemove={handleRemoveGarment}
                  onClearAll={handleClearAllGarments}
                />
              </CardContent>
            </Card>

            {/* Controles */}
            <Card className="card-glow">
              <CardContent className="p-6 space-y-4">
                <Button
                  variant="gradient"
                  className="w-full"
                  size="lg"
                  onClick={handleStartProcessing}
                  disabled={isProcessing || garments.length === 0}
                >
                  <Play className="w-4 h-4 mr-2" />
                  {isProcessing ? "Produciendo..." : "Iniciar Producción"}
                </Button>

                {isProcessing && (
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={cancelProcessing}
                  >
                    Cancelar
                  </Button>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleDownloadAll}
                    disabled={completedCount === 0}
                  >
                    <Archive className="w-4 h-4 mr-2" />
                    ZIP
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleBackToStudio}
                    disabled={isProcessing}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Nuevo Set
                  </Button>
                </div>

                {items.length > 0 && (
                  <div className="pt-2 border-t border-border">
                    <BatchProgress
                      total={batchProgress.total}
                      completed={batchProgress.completed}
                      failed={batchProgress.failed}
                      current={batchProgress.current}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Columna central y derecha - Resultados */}
          <div className="lg:col-span-2">
            <Card className="card-glow h-full">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-lg">
                  <span>Resultados del Lookbook</span>
                  <div className="flex gap-1">
                    {completedCount > 0 && (
                      <Badge variant="default">{completedCount} OK</Badge>
                    )}
                    {failedCount > 0 && (
                      <Badge variant="destructive">{failedCount} Error</Badge>
                    )}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResultsGallery
                  items={items}
                  onDownload={handleDownload}
                  onDownloadAll={handleDownloadAll}
                  onRetry={handleRetry}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {showDebugTrigger && (
        <DebugPanel isOpen={debugOpen} onClose={() => setDebugOpen(false)} />
      )}

      <footer className="border-t border-diva-pink/20 mt-12 py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>
            DIVA Production powered by{" "}
            <span className="text-diva-pink">Gemini AI</span>
          </p>
          <p className="mt-1 text-xs">
            Set: {studioConfig.model.name} | {studioConfig.space.name} | {studioConfig.lighting.name}
          </p>
        </div>
      </footer>
    </div>
  )
}

export default App
