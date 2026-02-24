import { useState } from "react"
import { Download, X, ZoomIn, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import type { ProcessingItem } from "@/hooks/useImageProcessor"

interface ResultsGalleryProps {
  items: ProcessingItem[]
  onDownload: (item: ProcessingItem) => void
  onDownloadAll: () => void
  onRetry: (itemId: string) => void
}

export function ResultsGallery({
  items,
  onDownload,
  onDownloadAll,
  onRetry,
}: ResultsGalleryProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  const completedItems = items.filter((item) => item.status === "completed")
  const failedItems = items.filter((item) => item.status === "error")

  if (items.length === 0) {
    return (
      <div className="text-center py-12 border-2 border-dashed border-border rounded-lg">
        <p className="text-muted-foreground">
          Los resultados aparecerán aquí
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <h3 className="font-medium">Resultados</h3>
          <Badge variant="default">{completedItems.length}</Badge>
          {failedItems.length > 0 && (
            <Badge variant="destructive">{failedItems.length} errores</Badge>
          )}
        </div>
        {completedItems.length > 0 && (
          <Button variant="gradient" size="sm" onClick={onDownloadAll}>
            <Download className="w-4 h-4 mr-2" />
            Descargar todo
          </Button>
        )}
      </div>

      <ScrollArea className="h-96 rounded-lg border border-border">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 p-4">
          {items.map((item) => (
            <Card
              key={item.id}
              className="overflow-hidden group cursor-pointer"
              onClick={() => {
                if (item.result?.imageUrl) {
                  setSelectedImage(item.result.imageUrl)
                }
              }}
            >
              <CardContent className="p-0 relative">
                {item.status === "completed" && item.result?.imageUrl ? (
                  <>
                    <img
                      src={item.result.imageUrl}
                      alt={`Resultado ${item.garmentFile.name}`}
                      className="w-full aspect-[3/4] object-cover"
                    />
                    <div className="image-overlay absolute inset-0 flex flex-col items-center justify-end p-3 gap-2">
                      <p className="text-xs text-white truncate w-full text-center">
                        {item.garmentFile.name}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="secondary"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedImage(item.result!.imageUrl!)
                          }}
                        >
                          <ZoomIn className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="gradient"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation()
                            onDownload(item)
                          }}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    {item.result.processingTime && (
                      <Badge
                        variant="pink"
                        className="absolute top-2 right-2 text-xs"
                      >
                        {Math.round(item.result.processingTime / 1000)}s
                      </Badge>
                    )}
                  </>
                ) : item.status === "error" ? (
                  <div className="w-full aspect-[3/4] flex flex-col items-center justify-center bg-destructive/10 p-4">
                    <AlertCircle className="w-10 h-10 text-destructive mb-2" />
                    <p className="text-xs text-center text-destructive/80 mb-2 line-clamp-2">
                      {item.result?.error || "Error"}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        onRetry(item.id)
                      }}
                    >
                      Reintentar
                    </Button>
                  </div>
                ) : (
                  <div className="w-full aspect-[3/4] flex flex-col items-center justify-center bg-muted">
                    <div className="animate-pulse w-10 h-10 rounded-full bg-diva-pink/30 mb-2" />
                    <p className="text-xs text-muted-foreground">Procesando...</p>
                    <div className="w-16 h-1 bg-muted-foreground/20 rounded-full mt-2 overflow-hidden">
                      <div
                        className="h-full bg-diva-pink transition-all duration-300"
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>

      {/* Modal de vista ampliada */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 text-white hover:bg-white/20"
            onClick={() => setSelectedImage(null)}
          >
            <X className="w-6 h-6" />
          </Button>
          <img
            src={selectedImage}
            alt="Vista ampliada"
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  )
}
