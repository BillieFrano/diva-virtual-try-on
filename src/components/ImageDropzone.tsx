import { useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Upload, X, Image as ImageIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface ImageDropzoneProps {
  onImageSelect: (file: File) => void
  selectedImage: File | null
  previewUrl: string | null
  onClear: () => void
  label: string
  accept?: string
  maxFiles?: number
}

export function ImageDropzone({
  onImageSelect,
  selectedImage,
  previewUrl,
  onClear,
  label,
  accept = "image/*",
  maxFiles = 1,
}: ImageDropzoneProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        onImageSelect(acceptedFiles[0])
      }
    },
    [onImageSelect]
  )

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: { [accept]: [] },
    maxFiles,
    multiple: false,
  })

  if (selectedImage && previewUrl) {
    return (
      <div className="relative group">
        <div className="relative overflow-hidden rounded-lg border border-diva-pink/30">
          <img
            src={previewUrl}
            alt="Preview"
            className="w-full h-48 object-cover"
          />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Button
              variant="destructive"
              size="sm"
              onClick={onClear}
              className="gap-2"
            >
              <X className="w-4 h-4" />
              Eliminar
            </Button>
          </div>
        </div>
        <p className="mt-2 text-sm text-muted-foreground truncate">
          {selectedImage.name}
        </p>
      </div>
    )
  }

  return (
    <div
      {...getRootProps()}
      className={cn(
        "dropzone rounded-lg p-8 text-center cursor-pointer transition-all duration-300",
        isDragActive && !isDragReject && "active border-diva-pink bg-diva-pink/10",
        isDragReject && "border-red-500 bg-red-500/10"
      )}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-diva-pink/20 flex items-center justify-center">
          {isDragActive ? (
            <ImageIcon className="w-6 h-6 text-diva-pink" />
          ) : (
            <Upload className="w-6 h-6 text-diva-pink" />
          )}
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">
            {isDragActive
              ? "Suelta la imagen aquí"
              : "Arrastra y suelta una imagen"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            o haz clic para seleccionar
          </p>
        </div>
        <p className="text-xs text-diva-pink font-medium">{label}</p>
      </div>
    </div>
  )
}
