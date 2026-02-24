import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return "0 Bytes"

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"]

  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i]
}

export function getAspectRatioDimensions(
  aspectRatio: string,
  resolution: string
): { width: number; height: number } {
  const resMap: Record<string, number> = {
    "1K": 1024,
    "2K": 2048,
    "4K": 4096,
  }

  const baseSize = resMap[resolution] || 1024

  const aspectMap: Record<string, { w: number; h: number }> = {
    "16:9": { w: 16, h: 9 },
    "1:1": { w: 1, h: 1 },
    "4:3": { w: 4, h: 3 },
    "9:16": { w: 9, h: 16 },
    "3:4": { w: 3, h: 4 },
  }

  const ratio = aspectMap[aspectRatio] || { w: 1, h: 1 }

  if (ratio.w / ratio.h > 1) {
    return { width: baseSize, height: Math.round(baseSize * (ratio.h / ratio.w)) }
  } else {
    return { width: Math.round(baseSize * (ratio.w / ratio.h)), height: baseSize }
  }
}

export function dataURLtoFile(dataurl: string, filename: string): File {
  const arr = dataurl.split(",")
  const mime = arr[0].match(/:(.*?);/)?.[1] || "image/png"
  const bstr = atob(arr[1])
  let n = bstr.length
  const u8arr = new Uint8Array(n)

  while (n--) {
    u8arr[n] = bstr.charCodeAt(n)
  }

  return new File([u8arr], filename, { type: mime })
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 15)
}
