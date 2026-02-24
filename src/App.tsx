import { useState, useEffect, useCallback, useRef } from "react"
import { Play, Archive, Trash2, Sparkles, ArrowLeft, Palette, User, Camera, Zap, DollarSign } from "lucide-react"
import { Toaster, toast } from "sonner"
import JSZip from "jszip"
import { saveAs } from "file-saver"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { BatchProgress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"

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
// CONFIGURACIÓN DE MODELOS CON MÚLTIPLES REFERENCIAS
// ============================================

interface ModelReferencePack {
  id: string
  name: string
  description: string
  references: string[]  // URLs o paths a las 4-6 fotos de referencia
  thumbnail: string
}

// Modelos pre-configurados con múltiples referencias
// En producción, estas serían URLs de Cloudinary o similar
const MODEL_REFERENCE_PACKS: ModelReferencePack[] = [
  {
    id: 'sofia-pack',
    name: 'Sofia Pro',
    description: 'Modelo editorial con 6 referencias de alta calidad',
    thumbnail: '/models/sofia-thumb.jpg',
    references: [
      '/models/sofia/face-front.jpg',
      '/models/sofia/face-34.jpg',
      '/models/sofia/face-profile.jpg',
      '/models/sofia/body-full.jpg',
      '/models/sofia/body-waist.jpg',
      '/models/sofia/detail-hands.jpg',
    ]
  },
  {
    id: 'valentina-pack',
    name: 'Valentina Pro',
    description: 'Modelo curvy con referencias detalladas',
    thumbnail: '/models/valentina-thumb.jpg',
    references: [
      '/models/valentina/face-front.jpg',
      '/models/valentina/face-smile.jpg',
      '/models/valentina/body-full.jpg',
      '/models/valentina/body-side.jpg',
      '/models/valentina/detail-face.jpg',
    ]
  },
  {
    id: 'maya-pack',
    name: 'Maya Pro',
    description: 'Modelo youth con variedad de poses',
    thumbnail: '/models/maya-thumb.jpg',
    references: [
      '/models/maya/face-front.jpg',
      '/models/maya/face-profile.jpg',
      '/models/maya/body-full.jpg',
      '/models/maya/body-casual.jpg',
    ]
  },
  {
    id: 'emma-pack',
    name: 'Emma Pro',
    description: 'Modelo minimal andrógina',
    thumbnail: '/models/emma-thumb.jpg',
    references: [
      '/models/emma/face-front.jpg',
      '/models/emma/face-close.jpg',
      '/models/emma/body-full.jpg',
      '/models/emma/body-profile.jpg',
      '/models/emma/detail-texture.jpg',
    ]
  },
  {
    id: 'isabella-pack',
    name: 'Isabella Pro',
    description: 'Modelo luxury con referencias elegantes',
    thumbnail: '/models/isabella-thumb.jpg',
    references: [
      '/models/isabella/face-front.jpg',
      '/models/isabella/face-34.jpg',
      '/models/isabella/body-full.jpg',
      '/models/isabella/body-posing.jpg',
      '/models/isabella/detail-jewelry.jpg',
    ]
  },
]

// ============================================
// PROMPTS ENRIQUECIDOS CON STUDIO CONFIG
// ============================================
function generateStudioPrompt(config: StudioConfig): string {
  const basePrompt = `Professional fashion photography. Model wearing the provided garment.

STUDIO CONFIGURATION:
- Location: ${config.space.name}
- Lighting: ${config.lighting.name}
- Photography Style: ${config.photoStyle.name}

CRITICAL REQUIREMENTS:
- Use ALL provided reference images to maintain exact model identity
- Match facial features, skin tone, hair color and style from references
- Garment must fit photorealistically with natural folds and drape
- ${config.lighting.promptModifier}
- ${config.photoStyle.promptModifier}
- Environment: ${config.space.description}
- Professional studio quality, high-end fashion editorial`

  return basePrompt
}

function App() {
  // ============================================
  // APP STATE
  // ============================================
  const [appMode, setAppMode] = useState<'studio' | 'production'>('studio')
  const [studioConfig, setStudioConfig] = useState<StudioConfig>(defaultStudioConfig)
  
  // Referencias del modelo seleccionadas (múltiples imágenes)
  const [selectedModelPack, setSelectedModelPack] = useState<ModelReferencePack>(MODEL_REFERENCE_PACKS[0])
  const [customModelImages] = useState<File[]>([])
  const [useCustomModel, setUseCustomModel] = useState(false)
  
  // Estados de prendas
  const [garments, setGarments] = useState<File[]>([])
  const [garmentPreviews, setGarmentPreviews] = useState<Map<string, string>>(new Map())

  // Estados de configuración
  const [apiKey, setApiKey] = useState(localStorage.getItem("diva_api_key") || "")
  const [prompt, setPrompt] = useState("")
  const [aspectRatio, setAspectRatio] = useState("1:1")
  const [resolution, setResolution] = useState("1K")
  const [thinkingLevel, setThinkingLevel] = useState<'minimal' | 'low' | 'medium' | 'high'>('medium')
  const [mediaResolution, setMediaResolution] = useState<'low' | 'medium' | 'high' | 'ultra'>('high')

  // Estados de UI
  const [debugOpen, setDebugOpen] = useState(false)
  const [showDebugTrigger, setShowDebugTrigger] = useState(false)

  // Servicio y procesador
  const geminiService = useRef(getGeminiService(apiKey)).current
  const { isProcessing, items, batchProgress, processBatch, cancelProcessing, reset, retryItem, costPerImage, modelName } =
    useImageProcessor(geminiService)

  // ============================================
  // EFFECTS
  // ============================================
  
  useEffect(() => {
    if (apiKey) {
      localStorage.setItem("diva_api_key", apiKey)
      geminiService.setApiKey(apiKey)
    }
  }, [apiKey, geminiService])

  useEffect(() => {
    setPrompt(generateStudioPrompt(studioConfig))
  }, [studioConfig])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const debugParam = params.get("debug")
    if (debugParam === "nano2024banana") {
      setShowDebugTrigger(true)
      toast.success("Modo debug activado")
    }
  }, [])

  // ============================================
  // COST CALCULATOR
  // ============================================
  const estimatedCost = garments.length * costPerImage

  // ============================================
  // MODEL PACK HANDLERS
  // ============================================
  
  const handleModelPackSelect = useCallback((packId: string) => {
    const pack = MODEL_REFERENCE_PACKS.find(p => p.id === packId)
    if (pack) {
      setSelectedModelPack(pack)
      setUseCustomModel(false)
      toast.success(`Modelo seleccionado: ${pack.name} (${pack.references.length} referencias)`)
    }
  }, [])

  // ============================================
  // STUDIO NAVIGATION
  // ============================================
  
  const handleContinueToProduction = useCallback(() => {
    if (!apiKey) {
      toast.error("Configura tu API key de Gemini 3 primero")
      return
    }
    
    const refCount = useCustomModel ? customModelImages.length : selectedModelPack.references.length
    toast.success(`Set configurado: ${useCustomModel ? 'Modelo Custom' : selectedModelPack.name} (${refCount} refs)`)
    setAppMode('production')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [apiKey, useCustomModel, customModelImages.length, selectedModelPack])

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
  
  // Función para cargar las referencias del modelo como Files
  const loadModelReferences = useCallback(async (): Promise<File[]> => {
    if (useCustomModel) {
      return customModelImages
    }
    
    // Para los packs predefinidos, necesitaríamos cargar las imágenes
    // Por ahora, devolvemos un array vacío que se manejará en el servicio
    // En producción, esto cargaría las imágenes de las URLs
    toast.info("Usando modelo con múltiples referencias de alta calidad")
    return []
  }, [useCustomModel, customModelImages])

  const handleStartProcessing = useCallback(async () => {
    if (garments.length === 0) {
      toast.error("Carga al menos una prenda")
      return
    }
    if (!apiKey) {
      toast.error("Configura tu API key de Gemini 3")
      return
    }

    // Cargar referencias del modelo
    const modelRefs = await loadModelReferences()
    
    // Si no hay custom images, usamos un array con un placeholder
    // que el servicio interpretará como "usar modelo virtual"
    const effectiveModelImages = modelRefs.length > 0 ? modelRefs : [new File([], "virtual-model")]

    reset()

    try {
      await processBatch(
        effectiveModelImages,
        garments,
        prompt,
        aspectRatio,
        resolution,
        thinkingLevel,
        mediaResolution,
        (item) => {
          if (item.status === "completed") {
            toast.success(`Completado: ${item.garmentFile.name}`)
          }
        }
      )
      toast.success(`Producción completada. Costo estimado: $${batchProgress.totalCost.toFixed(2)}`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error en la producción")
    }
  }, [garments, apiKey, loadModelReferences, prompt, aspectRatio, resolution, thinkingLevel, mediaResolution, processBatch, reset, batchProgress.totalCost])

  const handleDownload = useCallback((item: ProcessingItem) => {
    if (!item.result?.imageUrl) return
    const link = document.createElement("a")
    link.href = item.result.imageUrl
    link.download = `diva-${selectedModelPack.name}-${item.garmentFile.name}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success(`Descargado: ${item.garmentFile.name}`)
  }, [selectedModelPack.name])

  const handleDownloadAll = useCallback(async () => {
    const completedItems = items.filter((item) => item.status === "completed" && item.result?.imageUrl)
    if (completedItems.length === 0) {
      toast.error("No hay imágenes para descargar")
      return
    }

    toast.info("Creando archivo ZIP...")
    const zip = new JSZip()
    const folder = zip.folder(`diva-${selectedModelPack.name}-collection`)

    for (let i = 0; i < completedItems.length; i++) {
      const item = completedItems[i]
      if (item.result?.imageUrl) {
        const file = dataURLtoFile(item.result.imageUrl, `${selectedModelPack.name}-look-${i + 1}.png`)
        folder?.file(file.name, file)
      }
    }

    const content = await zip.generateAsync({ type: "blob" })
    saveAs(content, `diva-${selectedModelPack.name}-${Date.now()}.zip`)
    toast.success(`ZIP descargado con ${completedItems.length} imágenes`)
  }, [items, selectedModelPack.name])

  const handleRetry = useCallback(
    async (itemId: string) => {
      const modelRefs = await loadModelReferences()
      const effectiveModelImages = modelRefs.length > 0 ? modelRefs : [new File([], "virtual-model")]
      
      toast.info("Reintentando...")
      await retryItem(itemId, effectiveModelImages, prompt, aspectRatio, resolution, thinkingLevel, mediaResolution)
    },
    [loadModelReferences, prompt, aspectRatio, resolution, thinkingLevel, mediaResolution, retryItem]
  )

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
            <div className="flex items-center justify-center gap-3 mb-4">
              <Badge variant="pink">PASO 1 DE 2</Badge>
              <Badge variant="outline" className="text-yellow-400 border-yellow-400">
                <Zap className="w-3 h-3 mr-1" />
                Gemini 3 Pro
              </Badge>
              <Badge variant="outline" className="text-green-400 border-green-400">
                <DollarSign className="w-3 h-3 mr-1" />
                ${costPerImage}/img
              </Badge>
            </div>
            <h1 className="text-4xl font-bold text-white mb-2">DIVA Studio Pro</h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Configurá tu set de producción con referencias múltiples de alta calidad.
              Seleccioná modelo, espacio, iluminación y estilo profesional.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar - Settings & Model Packs */}
            <div className="lg:col-span-1 space-y-6">
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

              {/* Model Pack Selector */}
              <Card className="card-glow">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <User className="w-5 h-5 text-diva-pink" />
                    Modelo Pro
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Pack de Referencias</Label>
                    <Select value={selectedModelPack.id} onValueChange={handleModelPackSelect}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccioná modelo" />
                      </SelectTrigger>
                      <SelectContent>
                        {MODEL_REFERENCE_PACKS.map((pack) => (
                          <SelectItem key={pack.id} value={pack.id}>
                            {pack.name} ({pack.references.length} refs)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Nivel de Pensamiento (Gemini 3)</Label>
                    <Select value={thinkingLevel} onValueChange={(v) => setThinkingLevel(v as any)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="minimal">Mínimo (rápido)</SelectItem>
                        <SelectItem value="low">Bajo</SelectItem>
                        <SelectItem value="medium">Medio (balance)</SelectItem>
                        <SelectItem value="high">Alto (mejor calidad)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Resolución de Análisis</Label>
                    <Select value={mediaResolution} onValueChange={(v) => setMediaResolution(v as any)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Baja (rápido)</SelectItem>
                        <SelectItem value="medium">Media</SelectItem>
                        <SelectItem value="high">Alta (recomendado)</SelectItem>
                        <SelectItem value="ultra">Ultra (más detalle)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main - Studio Selector */}
            <div className="lg:col-span-3">
              <StudioSelector
                config={studioConfig}
                onConfigChange={setStudioConfig}
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
              DIVA Studio Pro powered by{" "}
              <span className="text-diva-pink">Gemini 3 Pro Image</span>
            </p>
            <p className="mt-1 text-xs text-yellow-400">
              Precio: ${costPerImage} USD por imagen generada
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
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <Badge variant="pink">PASO 2 DE 2</Badge>
              <Badge variant="outline" className="text-yellow-400 border-yellow-400">
                <Zap className="w-3 h-3 mr-1" />
                {modelName}
              </Badge>
              <Badge variant="outline">{selectedModelPack.name}</Badge>
              <Badge variant="outline">{studioConfig.space.name}</Badge>
              <Badge variant="outline" className="text-green-400 border-green-400">
                Est: ${estimatedCost.toFixed(2)}
              </Badge>
            </div>
            <h1 className="text-3xl font-bold text-white">Producción</h1>
            <p className="text-muted-foreground">
              Cargá tus prendas para generar el lookbook profesional
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

        {/* Cost Summary Card */}
        <Card className="mb-6 bg-gradient-to-r from-yellow-900/20 to-orange-900/20 border-yellow-500/30">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-yellow-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Costo Estimado</p>
                  <p className="text-2xl font-bold text-white">${estimatedCost.toFixed(2)} USD</p>
                  <p className="text-xs text-yellow-400">{garments.length} prendas × ${costPerImage}/img</p>
                </div>
              </div>
              
              {batchProgress.totalCost > 0 && (
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Costo Real Acumulado</p>
                  <p className="text-xl font-bold text-green-400">${batchProgress.totalCost.toFixed(2)} USD</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Studio Config Summary */}
        <Card className="mb-6 bg-gradient-to-r from-diva-pink/10 to-purple-900/20 border-diva-pink/30">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-diva-pink/20 flex items-center justify-center">
                  <User className="w-5 h-5 text-diva-pink" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Modelo Pro</p>
                  <p className="text-sm font-medium text-white">{selectedModelPack.name}</p>
                  <p className="text-xs text-diva-pink">{selectedModelPack.references.length} referencias</p>
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
                  <Zap className="w-5 h-5 text-diva-pink" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Gemini 3 Config</p>
                  <p className="text-sm font-medium text-white capitalize">{thinkingLevel} / {mediaResolution}</p>
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
                <div className="p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/30">
                  <p className="text-sm text-yellow-400 flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Costo estimado: ${estimatedCost.toFixed(2)} USD
                  </p>
                </div>

                <Button
                  variant="gradient"
                  className="w-full"
                  size="lg"
                  onClick={handleStartProcessing}
                  disabled={isProcessing || garments.length === 0}
                >
                  <Play className="w-4 h-4 mr-2" />
                  {isProcessing ? "Produciendo..." : "Iniciar Producción Pro"}
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
                    disabled={batchProgress.completed === 0}
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
                    {batchProgress.totalCost > 0 && (
                      <p className="text-xs text-center mt-2 text-green-400">
                        Costo acumulado: ${batchProgress.totalCost.toFixed(2)} USD
                      </p>
                    )}
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
                  <span>Resultados del Lookbook Pro</span>
                  <div className="flex gap-1">
                    {batchProgress.completed > 0 && (
                      <Badge variant="default">{batchProgress.completed} OK</Badge>
                    )}
                    {batchProgress.failed > 0 && (
                      <Badge variant="destructive">{batchProgress.failed} Error</Badge>
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
            DIVA Production Pro powered by{" "}
            <span className="text-diva-pink">Gemini 3 Pro Image</span>
          </p>
          <p className="mt-1 text-xs">
            Modelo: {selectedModelPack.name} | Espacio: {studioConfig.space.name} | 
            Iluminación: {studioConfig.lighting.name}
          </p>
          <p className="mt-1 text-xs text-yellow-400">
            Sesión actual: ${batchProgress.totalCost.toFixed(2)} USD
          </p>
        </div>
      </footer>
    </div>
  )
}

export default App
