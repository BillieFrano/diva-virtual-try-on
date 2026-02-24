import { useState, useCallback, useRef } from "react"
import { GeminiService, type ProcessingOptions, type ProcessResult } from "@/services/geminiService"

export interface ProcessingItem {
  id: string
  garmentFile: File
  status: "pending" | "processing" | "completed" | "error"
  result?: ProcessResult
  progress: number
  costEstimate?: number
}

export interface BatchProgress {
  total: number
  completed: number
  failed: number
  current: number
  totalCost: number
}

export function useImageProcessor(geminiService: GeminiService) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [items, setItems] = useState<ProcessingItem[]>([])
  const [batchProgress, setBatchProgress] = useState<BatchProgress>({
    total: 0,
    completed: 0,
    failed: 0,
    current: 0,
    totalCost: 0,
  })
  const [currentProcessingId, setCurrentProcessingId] = useState<string | null>(null)
  
  const abortControllerRef = useRef<AbortController | null>(null)

  const processBatch = useCallback(
    async (
      modelImages: File[],  // Múltiples imágenes de referencia
      garmentFiles: File[],
      prompt: string,
      aspectRatio: string,
      resolution: string,
      thinkingLevel: 'minimal' | 'low' | 'medium' | 'high' = 'medium',
      mediaResolution: 'low' | 'medium' | 'high' | 'ultra' = 'high',
      onItemComplete?: (item: ProcessingItem) => void
    ) => {
      if (!geminiService.getApiKey()) {
        throw new Error("API key no configurada. Por favor, configura tu API key de Gemini 3.")
      }

      if (modelImages.length === 0) {
        throw new Error("Se requiere al menos una imagen de referencia del modelo.")
      }

      setIsProcessing(true)
      setBatchProgress({
        total: garmentFiles.length,
        completed: 0,
        failed: 0,
        current: 0,
        totalCost: 0,
      })

      // Inicializar items
      const initialItems: ProcessingItem[] = garmentFiles.map((file, index) => ({
        id: `item-${Date.now()}-${index}`,
        garmentFile: file,
        status: "pending",
        progress: 0,
        costEstimate: geminiService.getCostPerImage(),
      }))
      setItems(initialItems)

      abortControllerRef.current = new AbortController()

      let completed = 0
      let failed = 0
      let accumulatedCost = 0

      for (let i = 0; i < garmentFiles.length; i++) {
        if (abortControllerRef.current.signal.aborted) {
          break
        }

        const garmentFile = garmentFiles[i]
        const itemId = initialItems[i].id

        setCurrentProcessingId(itemId)
        setBatchProgress((prev) => ({ ...prev, current: i + 1 }))

        // Actualizar estado a processing
        setItems((prev) =>
          prev.map((item) =>
            item.id === itemId ? { ...item, status: "processing", progress: 10 } : item
          )
        )

        try {
          const options: ProcessingOptions = {
            prompt,
            aspectRatio,
            resolution,
            modelImages,  // Array de múltiples referencias
            garmentImage: garmentFile,
            thinkingLevel,
            mediaResolution,
          }

          // Simular progreso durante el procesamiento
          const progressInterval = setInterval(() => {
            setItems((prev) =>
              prev.map((item) =>
                item.id === itemId && item.status === "processing"
                  ? { ...item, progress: Math.min(item.progress + 3, 85) }
                  : item
              )
            )
          }, 800)

          const result = await geminiService.processVirtualTryOn(options)

          clearInterval(progressInterval)

          if (result.success) {
            completed++
            accumulatedCost += result.costEstimate || 0
            const updatedItem: ProcessingItem = {
              ...initialItems[i],
              status: "completed",
              result,
              progress: 100,
            }
            setItems((prev) =>
              prev.map((item) => (item.id === itemId ? updatedItem : item))
            )
            onItemComplete?.(updatedItem)
          } else {
            failed++
            const updatedItem: ProcessingItem = {
              ...initialItems[i],
              status: "error",
              result,
              progress: 0,
            }
            setItems((prev) =>
              prev.map((item) => (item.id === itemId ? updatedItem : item))
            )
          }

          setBatchProgress((prev) => ({
            ...prev,
            completed,
            failed,
            totalCost: accumulatedCost,
          }))
        } catch (error) {
          failed++
          const updatedItem: ProcessingItem = {
            ...initialItems[i],
            status: "error",
            result: {
              success: false,
              error: error instanceof Error ? error.message : "Error desconocido",
            },
            progress: 0,
          }
          setItems((prev) =>
            prev.map((item) => (item.id === itemId ? updatedItem : item))
          )

          setBatchProgress((prev) => ({
            ...prev,
            failed,
          }))
        }

        // Pausa entre procesamientos (Gemini 3 es más estable pero igual respetamos límites)
        if (i < garmentFiles.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 1500))
        }
      }

      setIsProcessing(false)
      setCurrentProcessingId(null)
    },
    [geminiService]
  )

  const cancelProcessing = useCallback(() => {
    abortControllerRef.current?.abort()
    setIsProcessing(false)
    setCurrentProcessingId(null)
    setItems((prev) =>
      prev.map((item) =>
        item.status === "processing" ? { ...item, status: "pending", progress: 0 } : item
      )
    )
  }, [])

  const reset = useCallback(() => {
    setItems([])
    setBatchProgress({
      total: 0,
      completed: 0,
      failed: 0,
      current: 0,
      totalCost: 0,
    })
    setIsProcessing(false)
    setCurrentProcessingId(null)
  }, [])

  const retryItem = useCallback(
    async (
      itemId: string,
      modelImages: File[],
      prompt: string,
      aspectRatio: string,
      resolution: string,
      thinkingLevel: 'minimal' | 'low' | 'medium' | 'high' = 'medium',
      mediaResolution: 'low' | 'medium' | 'high' | 'ultra' = 'high',
    ) => {
      const item = items.find((i) => i.id === itemId)
      if (!item) return

      setItems((prev) =>
        prev.map((i) => (i.id === itemId ? { ...i, status: "processing", progress: 10 } : i))
      )

      try {
        const options: ProcessingOptions = {
          prompt,
          aspectRatio,
          resolution,
          modelImages,
          garmentImage: item.garmentFile,
          thinkingLevel,
          mediaResolution,
        }

        const result = await geminiService.processVirtualTryOn(options)

        if (result.success) {
          setItems((prev) =>
            prev.map((i) =>
              i.id === itemId ? { ...i, status: "completed", result, progress: 100 } : i
            )
          )
          setBatchProgress((prev) => ({ 
            ...prev, 
            completed: prev.completed + 1,
            totalCost: prev.totalCost + (result.costEstimate || 0)
          }))
        } else {
          throw new Error(result.error || "Error en el procesamiento")
        }
      } catch (error) {
        setItems((prev) =>
          prev.map((i) =>
            i.id === itemId
              ? {
                  ...i,
                  status: "error",
                  result: {
                    success: false,
                    error: error instanceof Error ? error.message : "Error desconocido",
                  },
                  progress: 0,
                }
              : i
          )
        )
      }
    },
    [items, geminiService]
  )

  return {
    isProcessing,
    items,
    batchProgress,
    currentProcessingId,
    processBatch,
    cancelProcessing,
    reset,
    retryItem,
    costPerImage: geminiService.getCostPerImage(),
    modelName: geminiService.getModelName(),
  }
}
