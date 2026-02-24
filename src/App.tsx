import { useState, useEffect, useCallback, useRef } from "react"
import { Play, Archive, Trash2, Sparkles } from "lucide-react"
import { Toaster, toast } from "sonner"
import JSZip from "jszip"
import { saveAs } from "file-saver"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { BatchProgress } from "@/components/ui/progress"

import { Header } from "@/components/Header"
import { ImageDropzone } from "@/components/ImageDropzone"
import { MultiGarmentDropzone } from "@/components/MultiGarmentDropzone"
import { GarmentGallery } from "@/components/GarmentGallery"
import { ResultsGallery } from "@/components/ResultsGallery"
import { SettingsPanel } from "@/components/SettingsPanel"
import { DebugPanel } from "@/components/DebugPanel"

import { getGeminiService } from "@/services/geminiService"
import { useImageProcessor } from "@/hooks/useImageProcessor"
import { dataURLtoFile } from "@/lib/utils"

import type { ProcessingItem } from "@/hooks/useImageProcessor"

const defaultPrompt = `Viste al modelo con la prenda proporcionada. 

Requisitos:
- La prenda debe ajustarse naturalmente al cuerpo del modelo
- Mantén la pose original del modelo
- Iluminación coherente entre modelo y prenda
- No alteres el rostro ni características del modelo
- Calidad fotográfica profesional`

function App() {
  // Estados de imágenes
  const [modelImage, setModelImage] = useState<File | null>(null)
  const [modelPreview, setModelPreview] = useState<string | null>(null)
  const [garments, setGarments] = useState<File[]>([])
  const [garmentPreviews, setGarmentPreviews] = useState<Map<string, string>>(new Map())

  // Estados de configuración
  const [apiKey, setApiKey] = useState(localStorage.getItem("diva_api_key") || "")
  const [prompt, setPrompt] = useState(defaultPrompt)
  const [aspectRatio, setAspectRatio] = useState("1:1")
  const [resolution, setResolution] = useState("1K")

  // Estados de UI
  const [debugOpen, setDebugOpen] = useState(false)
  const [showDebugTrigger, setShowDebugTrigger] = useState(false)

  // Servicio y procesador
  const geminiService = useRef(getGeminiService(apiKey)).current
  const { isProcessing, items, batchProgress, processBatch, cancelProcessing, reset, retryItem } =
    useImageProcessor(geminiService)

  // Guardar API key en localStorage
  useEffect(() => {
    if (apiKey) {
      localStorage.setItem("diva_api_key", apiKey)
      geminiService.setApiKey(apiKey)
    }
  }, [apiKey, geminiService])

  // Verificar parámetro de debug en URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const debugParam = params.get("debug")
    if (debugParam === "nano2024banana") {
      setShowDebugTrigger(true)
      toast.success("Modo debug activado")
    }
  }, [])

  // Crear preview para imagen del modelo
  const handleModelSelect = useCallback((file: File) => {
    setModelImage(file)
    const reader = new FileReader()
    reader.onloadend = () => {
      setModelPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }, [])

  const handleClearModel = useCallback(() => {
    setModelImage(null)
    setModelPreview(null)
  }, [])

  // Agregar múltiples prendas
  const handleGarmentsSelect = useCallback((files: File[]) => {
    setGarments((prev) => {
      const newGarments = [...prev, ...files]
      // Crear previews para nuevas prendas
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

  // Iniciar procesamiento
  const handleStartProcessing = useCallback(async () => {
    if (!modelImage) {
      toast.error("Carga una imagen de modelo primero")
      return
    }
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
      await processBatch(
        modelImage,
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
      toast.success("Procesamiento completado")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error en el procesamiento")
    }
  }, [modelImage, garments, apiKey, prompt, aspectRatio, resolution, processBatch, reset])

  // Descargar imagen individual
  const handleDownload = useCallback((item: ProcessingItem) => {
    if (!item.result?.imageUrl) return

    const link = document.createElement("a")
    link.href = item.result.imageUrl
    link.download = `diva-result-${item.garmentFile.name}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast.success(`Descargado: ${item.garmentFile.name}`)
  }, [])

  // Descargar todas las imágenes como ZIP
  const handleDownloadAll = useCallback(async () => {
    const completedItems = items.filter((item) => item.status === "completed" && item.result?.imageUrl)
    
    if (completedItems.length === 0) {
      toast.error("No hay imágenes para descargar")
      return
    }

    toast.info("Creando archivo ZIP...")

    const zip = new JSZip()
    const folder = zip.folder("diva-results")

    for (let i = 0; i < completedItems.length; i++) {
      const item = completedItems[i]
      if (item.result?.imageUrl) {
        const file = dataURLtoFile(item.result.imageUrl, `result-${i + 1}.png`)
        folder?.file(file.name, file)
      }
    }

    const content = await zip.generateAsync({ type: "blob" })
    saveAs(content, `diva-results-${Date.now()}.zip`)

    toast.success(`ZIP descargado con ${completedItems.length} imágenes`)
  }, [items])

  // Reintentar item fallido
  const handleRetry = useCallback(
    async (itemId: string) => {
      if (!modelImage) return
      toast.info("Reintentando...")
      await retryItem(itemId, modelImage, prompt, aspectRatio, resolution)
    },
    [modelImage, prompt, aspectRatio, resolution, retryItem]
  )

  // Limpiar todo
  const handleReset = useCallback(() => {
    reset()
    setModelImage(null)
    setModelPreview(null)
    setGarments([])
    setGarmentPreviews(new Map())
    toast.success("Todo reiniciado")
  }, [reset])

  const completedCount = items.filter((i) => i.status === "completed").length
  const failedCount = items.filter((i) => i.status === "error").length

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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Columna izquierda - Configuración y Modelo */}
          <div className="space-y-6">
            {/* Settings */}
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

            {/* Model Upload */}
            <Card className="card-glow">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Sparkles className="w-5 h-5 text-diva-pink" />
                  Modelo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ImageDropzone
                  onImageSelect={handleModelSelect}
                  selectedImage={modelImage}
                  previewUrl={modelPreview}
                  onClear={handleClearModel}
                  label="Imagen del modelo"
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
                  disabled={isProcessing || !modelImage || garments.length === 0}
                >
                  <Play className="w-4 h-4 mr-2" />
                  {isProcessing ? "Procesando..." : "Iniciar Procesamiento"}
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
                    onClick={handleReset}
                    disabled={isProcessing}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Limpiar
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

          {/* Columna central - Prendas */}
          <div className="space-y-6">
            <Card className="card-glow">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-lg">
                  <span>Prendas</span>
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
          </div>

          {/* Columna derecha - Resultados */}
          <div className="space-y-6">
            <Card className="card-glow h-full">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-lg">
                  <span>Resultados</span>
                  <div className="flex gap-1">
                    {completedCount > 0 && (
                      <Badge variant="default">{completedCount}</Badge>
                    )}
                    {failedCount > 0 && (
                      <Badge variant="destructive">{failedCount}</Badge>
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

      {/* Debug Panel */}
      {showDebugTrigger && (
        <DebugPanel isOpen={debugOpen} onClose={() => setDebugOpen(false)} />
      )}

      {/* Footer */}
      <footer className="border-t border-diva-pink/20 mt-12 py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>
            DIVA Virtual Try-On powered by{" "}
            <span className="text-diva-pink">Gemini AI</span>
          </p>
          <p className="mt-1 text-xs">
            Desarrollado con ❤️ para la comunidad de moda
          </p>
        </div>
      </footer>
    </div>
  )
}

export default App
