import { useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Upload, Image, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

import { Badge } from "@/components/ui/badge"

interface MultiGarmentDropzoneProps {
  onFilesSelect: (files: File[]) => void
  garmentCount: number
  maxFiles?: number
}

export function MultiGarmentDropzone({
  onFilesSelect,
  garmentCount,
  maxFiles = 200,
}: MultiGarmentDropzoneProps) {
  const remainingSlots = maxFiles - garmentCount

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const filesToAdd = acceptedFiles.slice(0, remainingSlots)
      if (filesToAdd.length > 0) {
        onFilesSelect(filesToAdd)
      }
    },
    [onFilesSelect, remainingSlots]
  )

  const { getRootProps, getInputProps, isDragActive, isDragReject, fileRejections } =
    useDropzone({
      onDrop,
      accept: { "image/*": [] },
      maxFiles: remainingSlots,
      multiple: true,
      disabled: remainingSlots <= 0,
    })

  const isFull = garmentCount >= maxFiles

  if (isFull) {
    return (
      <div className="border-2 border-dashed border-yellow-500/50 rounded-lg p-8 text-center bg-yellow-500/5">
        <AlertCircle className="w-10 h-10 mx-auto text-yellow-500 mb-3" />
        <p className="text-yellow-500 font-medium">Límite alcanzado</p>
        <p className="text-sm text-muted-foreground mt-1">
          Has alcanzado el máximo de {maxFiles} prendas
        </p>
      </div>
    )
  }

  return (
    <div
      {...getRootProps()}
      className={cn(
        "dropzone rounded-lg p-6 text-center cursor-pointer transition-all duration-300",
        isDragActive && !isDragReject && "active border-diva-pink bg-diva-pink/10",
        isDragReject && "border-red-500 bg-red-500/10",
        isFull && "opacity-50 cursor-not-allowed"
      )}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-diva-pink/20 flex items-center justify-center">
          {isDragActive ? (
            <Image className="w-6 h-6 text-diva-pink" />
          ) : (
            <Upload className="w-6 h-6 text-diva-pink" />
          )}
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">
            {isDragActive
              ? `Suelta ${remainingSlots > 1 ? "las imágenes" : "la imagen"} aquí`
              : `Arrastra prendas de vestir aquí`}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            o haz clic para seleccionar archivos
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="pink" className="text-xs">
            {garmentCount} / {maxFiles}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {remainingSlots} disponibles
          </span>
        </div>
        {fileRejections.length > 0 && (
          <p className="text-xs text-red-500">
            {fileRejections.length} archivo(s) rechazado(s)
          </p>
        )}
      </div>
    </div>
  )
}
