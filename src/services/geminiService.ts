import { getAspectRatioDimensions } from "@/lib/utils"

export interface ProcessingOptions {
  prompt: string
  aspectRatio: string
  resolution: string
  modelImages: File[]  // Múltiples imágenes de referencia del modelo
  garmentImage: File
  thinkingLevel?: 'minimal' | 'low' | 'medium' | 'high'
  mediaResolution?: 'low' | 'medium' | 'high' | 'ultra'
}

export interface ProcessResult {
  success: boolean
  imageUrl?: string
  error?: string
  processingTime?: number
  costEstimate?: number  // Costo estimado en USD
}

export class GeminiService {
  private apiKey: string
  private baseUrl = "https://generativelanguage.googleapis.com/v1beta/models"
  private modelName = "gemini-3-pro-image-preview"
  private costPerImage = 0.134  // USD por imagen generada

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  setApiKey(apiKey: string) {
    this.apiKey = apiKey
  }

  getApiKey(): string {
    return this.apiKey
  }

  getModelName(): string {
    return this.modelName
  }

  getCostPerImage(): number {
    return this.costPerImage
  }

  async processVirtualTryOn(options: ProcessingOptions): Promise<ProcessResult> {
    const startTime = Date.now()

    try {
      if (!this.apiKey) {
        throw new Error("API key no configurada")
      }

      const dimensions = getAspectRatioDimensions(options.aspectRatio, options.resolution)
      
      // Convertir todas las imágenes de referencia del modelo
      const modelBase64Promises = options.modelImages.map(img => this.fileToBase64(img))
      const modelBase64Array = await Promise.all(modelBase64Promises)
      const garmentBase64 = await this.fileToBase64(options.garmentImage)

      // Construir el prompt enriquecido para Gemini 3
      const enhancedPrompt = `${options.prompt}

INSTRUCCIONES CRÍTICAS - MANTENER IDENTIDAD:
- Usa las ${options.modelImages.length} imágenes de referencia como GUÍA ABSOLUTA de la identidad del modelo
- Mantén EXACTAMENTE: rasgos faciales, tono de piel, color y tipo de cabello, expresión
- La prenda debe ajustarse fotorealista al cuerpo, respetando pliegues y caída natural
- Resolución objetivo: ${options.resolution} (${dimensions.width}x${dimensions.height})
- Aspect ratio: ${options.aspectRatio}
- Calidad profesional de estudio de moda de alta gama
- NO inventes características que no están en las referencias`

      // Construir parts dinámicamente con múltiples referencias
      const parts: any[] = [
        { text: enhancedPrompt },
        // Agregar todas las imágenes de referencia del modelo
        ...modelBase64Array.map((base64, index) => ({
          inline_data: {
            mime_type: options.modelImages[index].type,
            data: base64,
          },
        })),
        // Agregar la prenda al final
        {
          inline_data: {
            mime_type: options.garmentImage.type,
            data: garmentBase64,
          },
        },
      ]

      const requestBody = {
        contents: [
          {
            role: "user",
            parts: parts,
          },
        ],
        generation_config: {
          temperature: 0.3,  // Más bajo para más consistencia
          top_p: 0.9,
          top_k: 40,
          max_output_tokens: 8192,  // Gemini 3 soporta más
        },
        // Configuraciones específicas de Gemini 3
        thinking_config: {
          thinking_level: options.thinkingLevel || 'medium',  // medium para balance calidad/velocidad
        },
        media_resolution: options.mediaResolution || 'high',  // alta calidad de análisis de imágenes
      }

      const response = await fetch(
        `${this.baseUrl}/${this.modelName}:generateContent?key=${this.apiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        }
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error("Gemini 3 API Error:", errorData)
        throw new Error(
          errorData.error?.message || `Error ${response.status}: ${response.statusText}`
        )
      }

      const data = await response.json()

      // Extraer la imagen generada de la respuesta de Gemini 3
      const generatedImage = this.extractImageFromResponse(data)

      if (!generatedImage) {
        throw new Error("No se pudo generar la imagen - respuesta vacía de Gemini 3")
      }

      return {
        success: true,
        imageUrl: generatedImage,
        processingTime: Date.now() - startTime,
        costEstimate: this.costPerImage,
      }
    } catch (error) {
      console.error("Error en procesamiento Gemini 3:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido",
        processingTime: Date.now() - startTime,
      }
    }
  }

  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const base64 = (reader.result as string).split(",")[1]
        resolve(base64)
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  private extractImageFromResponse(data: any): string | null {
    try {
      // La respuesta de Gemini puede variar según la versión de la API
      const candidates = data.candidates || []
      if (candidates.length === 0) return null

      const content = candidates[0].content
      if (!content || !content.parts) return null

      // Buscar la parte que contiene la imagen
      for (const part of content.parts) {
        if (part.inline_data) {
          const { mime_type, data: imageData } = part.inline_data
          return `data:${mime_type};base64,${imageData}`
        }
      }

      return null
    } catch {
      return null
    }
  }

  // Método para validar la API key con Gemini 3
  async validateApiKey(): Promise<boolean> {
    try {
      if (!this.apiKey) return false

      // Hacemos una petición simple de validación
      const response = await fetch(
        `${this.baseUrl}/${this.modelName}?key=${this.apiKey}`,
        {
          method: "GET",
        }
      )

      return response.ok
    } catch {
      return false
    }
  }
}

// Singleton instance
let geminiService: GeminiService | null = null

export function getGeminiService(apiKey?: string): GeminiService {
  if (!geminiService) {
    geminiService = new GeminiService(apiKey || "")
  } else if (apiKey) {
    geminiService.setApiKey(apiKey)
  }
  return geminiService
}
