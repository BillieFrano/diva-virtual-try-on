
import { X, Image as ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { formatBytes } from "@/lib/utils"

interface GarmentGalleryProps {
  garments: File[]
  previews: Map<string, string>
  onRemove: (index: number) => void
  onClearAll: () => void
}

export function GarmentGallery({
  garments,
  previews,
  onRemove,
  onClearAll,
}: GarmentGalleryProps) {
  if (garments.length === 0) {
    return (
      <div className="text-center py-12 border-2 border-dashed border-border rounded-lg">
        <ImageIcon className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">
          No hay prendas cargadas aún
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          Sube hasta 200 prendas para procesar
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="font-medium">Prendas cargadas</h3>
          <Badge variant="pink">{garments.length}</Badge>
        </div>
        <Button variant="ghost" size="sm" onClick={onClearAll} className="text-muted-foreground">
          Limpiar todo
        </Button>
      </div>

      <ScrollArea className="h-64 rounded-lg border border-border">
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 p-2">
          {garments.map((garment, index) => {
            const preview = previews.get(garment.name)
            return (
              <div
                key={`${garment.name}-${index}`}
                className="relative group aspect-square rounded-md overflow-hidden border border-border bg-diva-dark-light"
              >
                {preview ? (
                  <img
                    src={preview}
                    alt={garment.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="w-6 h-6 text-muted-foreground" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-1">
                  <p className="text-xs text-white truncate w-full text-center px-1">
                    {garment.name}
                  </p>
                  <p className="text-xs text-white/70">
                    {formatBytes(garment.size)}
                  </p>
                  <Button
                    variant="destructive"
                    size="icon"
                    className="h-6 w-6 mt-1"
                    onClick={() => onRemove(index)}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      </ScrollArea>
    </div>
  )
}
