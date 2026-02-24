import { getAspectRatioDimensions } from "@/lib/utils"

export interface ProcessingOptions {
  prompt: string
  aspectRatio: string
  resolution: string
  modelImage: File
  garmentImage: File
}

export interface ProcessResult {
  success: boolean
  imageUrl?: string
  error?: string
  processingTime?: number
}

export class GeminiService {
  private apiKey: string
  private baseUrl = "https://generativelanguage.googleapis.com/v1beta/models"

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  setApiKey(apiKey: string) {
    this.apiKey = apiKey
  }

  getApiKey(): string {
    return this.apiKey
  }

  async processVirtualTryOn(options: ProcessingOptions): Promise<ProcessResult> {
    const startTime = Date.now()

    try {
      if (!this.apiKey) {
        throw new Error("API key no configurada")
      }

      const dimensions = getAspectRatioDimensions(options.aspectRatio, options.resolution)
      
      // Convertir imágenes a base64
      const modelBase64 = await this.fileToBase64(options.modelImage)
      const garmentBase64 = await this.fileToBase64(options.garmentImage)

      // Construir el prompt enriquecido
      const enhancedPrompt = `${options.prompt}

Instrucciones adicionales:
- Mantén la pose, iluminación y estilo del modelo de referencia
- La prenda debe ajustarse naturalmente al cuerpo del modelo
- Resolución objetivo: ${options.resolution} (${dimensions.width}x${dimensions.height})
- Aspect ratio: ${options.aspectRatio}
- Estilo fotorealista, alta calidad, iluminación profesional
- No modifiques el rostro ni las características del modelo`

      const requestBody = {
        contents: [
          {
            role: "user",
            parts: [
              {
                text: enhancedPrompt,
              },
              {
                inline_data: {
                  mime_type: options.modelImage.type,
                  data: modelBase64,
                },
              },
              {
                inline_data: {
                  mime_type: options.garmentImage.type,
                  data: garmentBase64,
                },
              },
            ],
          },
        ],
        generation_config: {
          temperature: 0.4,
          top_p: 0.8,
          top_k: 40,
          max_output_tokens: 4096,
        },
      }

      const response = await fetch(
        `${this.baseUrl}/gemini-2.0-flash-exp-image-generation:generateContent?key=${this.apiKey}`,
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
        throw new Error(
          errorData.error?.message || `Error ${response.status}: ${response.statusText}`
        )
      }

      const data = await response.json()

      // Extraer la imagen generada de la respuesta
      const generatedImage = this.extractImageFromResponse(data)

      if (!generatedImage) {
        throw new Error("No se pudo generar la imagen")
      }

      return {
        success: true,
        imageUrl: generatedImage,
        processingTime: Date.now() - startTime,
      }
    } catch (error) {
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

  // Método para validar la API key
  async validateApiKey(): Promise<boolean> {
    try {
      if (!this.apiKey) return false

      const response = await fetch(
        `${this.baseUrl}/gemini-2.0-flash-exp-image-generation?key=${this.apiKey}`,
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
