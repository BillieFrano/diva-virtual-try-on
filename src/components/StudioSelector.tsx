import { useState, useRef } from "react"
import { ChevronLeft, ChevronRight, Plus, User, Sparkles, Sun, Camera } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { models, spaces, lightings, photoStyles, type StudioConfig } from "@/data/studioConfig"

interface StudioSelectorProps {
  config: StudioConfig
  onConfigChange: (config: StudioConfig) => void
  onContinue: () => void
}

// ============================================
// SCROLL SECTION COMPONENT
// ============================================
interface ScrollSectionProps<T> {
  title: string
  icon: React.ReactNode
  items: T[]
  selectedId: string
  onSelect: (item: T) => void
  renderItem: (item: T, isSelected: boolean) => React.ReactNode
  customButton?: React.ReactNode
}

function ScrollSection<T extends { id: string }>({
  title,
  icon,
  items,
  selectedId,
  onSelect,
  renderItem,
  customButton
}: ScrollSectionProps<T>) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
      setCanScrollLeft(scrollLeft > 0)
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10)
    }
  }

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 300
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth"
      })
      setTimeout(checkScroll, 300)
    }
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2 px-1">
        <div className="w-8 h-8 rounded-lg bg-diva-pink/20 flex items-center justify-center">
          {icon}
        </div>
        <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
          {title}
        </h3>
      </div>

      {/* Scroll Container */}
      <div className="relative group">
        {/* Left Arrow */}
        {canScrollLeft && (
          <button
            onClick={() => scroll("left")}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-black/80 border border-diva-pink/50 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-diva-pink hover:border-diva-pink"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}

        {/* Scroll Area */}
        <div
          ref={scrollRef}
          onScroll={checkScroll}
          className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 px-1"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {customButton}
          {items.map((item) => (
            <div
              key={item.id}
              onClick={() => onSelect(item)}
              className="flex-shrink-0 cursor-pointer"
            >
              {renderItem(item, selectedId === item.id)}
            </div>
          ))}
        </div>

        {/* Right Arrow */}
        {canScrollRight && (
          <button
            onClick={() => scroll("right")}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-black/80 border border-diva-pink/50 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-diva-pink hover:border-diva-pink"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  )
}

// ============================================
// MAIN COMPONENT
// ============================================
export function StudioSelector({ config, onConfigChange, onContinue }: StudioSelectorProps) {
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleCustomModelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      onConfigChange({
        ...config,
        customModelImage: file,
        model: { ...config.model, id: 'custom' }
      })
    }
  }

  // Model Card Renderer
  const renderModelCard = (model: typeof models[0], isSelected: boolean) => (
    <Card
      className={cn(
        "w-40 h-56 relative overflow-hidden transition-all duration-300",
        isSelected
          ? "ring-2 ring-diva-pink ring-offset-2 ring-offset-black scale-105"
          : "hover:scale-102 opacity-80 hover:opacity-100"
      )}
    >
      {/* Placeholder Image */}
      <div className="absolute inset-0 bg-gradient-to-b from-diva-pink/20 to-black flex flex-col items-center justify-center">
        <div className="w-20 h-20 rounded-full bg-diva-pink/30 flex items-center justify-center mb-3">
          <User className="w-10 h-10 text-diva-pink" />
        </div>
        <span className="text-xs text-white/60 text-center px-2">
          {model.name}
        </span>
      </div>
      
      {/* Selected Overlay */}
      {isSelected && (
        <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-diva-pink flex items-center justify-center">
          <Sparkles className="w-3 h-3 text-white" />
        </div>
      )}
      
      {/* Info Badge */}
      <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black to-transparent">
        <p className="text-xs font-medium text-white truncate">{model.name}</p>
        <p className="text-[10px] text-white/60">{model.ethnicity}</p>
      </div>
    </Card>
  )

  // Space Card Renderer
  const renderSpaceCard = (space: typeof spaces[0], isSelected: boolean) => (
    <Card
      className={cn(
        "w-48 h-32 relative overflow-hidden transition-all duration-300",
        isSelected
          ? "ring-2 ring-diva-pink ring-offset-2 ring-offset-black"
          : "hover:scale-102 opacity-70 hover:opacity-100"
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/40 to-blue-900/40 flex items-center justify-center">
        <span className="text-xs text-white/80 text-center px-2">{space.name}</span>
      </div>
      
      {isSelected && (
        <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-diva-pink flex items-center justify-center">
          <Sparkles className="w-2.5 h-2.5 text-white" />
        </div>
      )}
      
      <Badge variant="secondary" className="absolute bottom-2 left-2 text-[10px]">
        {space.category}
      </Badge>
    </Card>
  )

  // Lighting Card Renderer
  const renderLightingCard = (lighting: typeof lightings[0], isSelected: boolean) => (
    <Card
      className={cn(
        "w-36 h-24 relative overflow-hidden transition-all duration-300",
        isSelected
          ? "ring-2 ring-diva-pink ring-offset-2 ring-offset-black"
          : "hover:scale-102 opacity-70 hover:opacity-100"
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-tr from-yellow-600/30 to-orange-600/30 flex items-center justify-center p-2">
        <span className="text-xs text-white text-center">{lighting.name}</span>
      </div>
      
      {isSelected && (
        <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-diva-pink flex items-center justify-center">
          <Sparkles className="w-2 h-2 text-white" />
        </div>
      )}
    </Card>
  )

  // Style Card Renderer
  const renderStyleCard = (style: typeof photoStyles[0], isSelected: boolean) => (
    <Card
      className={cn(
        "w-32 h-32 relative overflow-hidden transition-all duration-300 rounded-full",
        isSelected
          ? "ring-2 ring-diva-pink ring-offset-4 ring-offset-black scale-110"
          : "hover:scale-105 opacity-70 hover:opacity-100"
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-pink-600/30 to-purple-600/30 flex items-center justify-center p-2">
        <span className="text-xs text-white text-center font-medium">{style.name}</span>
      </div>
      
      {isSelected && (
        <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-diva-pink flex items-center justify-center">
          <Sparkles className="w-2.5 h-2.5 text-white" />
        </div>
      )}
    </Card>
  )

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-white">DIVA Studio</h2>
        <p className="text-muted-foreground">
          Configurá tu set de producción antes de cargar las prendas
        </p>
      </div>

      {/* MODELS SCROLL */}
      <ScrollSection
        title="Modelo"
        icon={<User className="w-4 h-4 text-diva-pink" />}
        items={models}
        selectedId={config.customModelImage ? 'custom' : config.model.id}
        onSelect={(model) => onConfigChange({ ...config, model, customModelImage: null })}
        renderItem={renderModelCard}
        customButton={
          <Card
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "w-40 h-56 flex-shrink-0 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 border-dashed border-2",
              config.customModelImage
                ? "ring-2 ring-diva-pink bg-diva-pink/10 border-diva-pink"
                : "hover:border-diva-pink hover:bg-diva-pink/5 border-muted"
            )}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleCustomModelUpload}
              className="hidden"
            />
            <div className="w-16 h-16 rounded-full bg-diva-pink/20 flex items-center justify-center mb-3">
              <Plus className="w-8 h-8 text-diva-pink" />
            </div>
            <span className="text-sm font-medium text-white text-center px-4">
              {config.customModelImage ? "Modelo Custom" : "Tu Modelo"}
            </span>
            <span className="text-xs text-muted-foreground text-center px-4 mt-1">
              {config.customModelImage 
                ? config.customModelImage.name.slice(0, 20) + "..."
                : "Subí tu imagen"
              }
            </span>
          </Card>
        }
      />

      {/* SPACE SCROLL */}
      <ScrollSection
        title="Espacio"
        icon={<Camera className="w-4 h-4 text-diva-pink" />}
        items={spaces}
        selectedId={config.space.id}
        onSelect={(space) => onConfigChange({ ...config, space })}
        renderItem={renderSpaceCard}
      />

      {/* LIGHTING & STYLE ROW */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* LIGHTING SCROLL */}
        <ScrollSection
          title="Iluminación"
          icon={<Sun className="w-4 h-4 text-diva-pink" />}
          items={lightings}
          selectedId={config.lighting.id}
          onSelect={(lighting) => onConfigChange({ ...config, lighting })}
          renderItem={renderLightingCard}
        />

        {/* STYLE SCROLL */}
        <ScrollSection
          title="Estilo de Foto"
          icon={<Camera className="w-4 h-4 text-diva-pink" />}
          items={photoStyles}
          selectedId={config.photoStyle.id}
          onSelect={(photoStyle) => onConfigChange({ ...config, photoStyle })}
          renderItem={renderStyleCard}
        />
      </div>

      {/* PREVIEW & CONTINUE */}
      <Card className="p-6 bg-gradient-to-r from-diva-pink/10 to-purple-900/20 border-diva-pink/30">
        <div className="flex flex-col md:flex-row items-center gap-6">
          {/* Preview Box */}
          <div className="w-full md:w-48 h-48 rounded-lg bg-black/50 border border-diva-pink/30 flex flex-col items-center justify-center">
            <div className="text-center space-y-1">
              <p className="text-xs text-diva-pink uppercase tracking-wider">Set Configurado</p>
              <p className="text-sm text-white font-medium">{config.model.name}</p>
              <p className="text-xs text-white/60">+ {config.space.name}</p>
              <p className="text-xs text-white/60">+ {config.lighting.name}</p>
              <p className="text-xs text-white/60">+ {config.photoStyle.name}</p>
            </div>
          </div>

          {/* Description */}
          <div className="flex-1 text-center md:text-left">
            <h4 className="text-lg font-semibold text-white mb-2">
              {config.customModelImage ? "Modelo Personalizado" : config.model.name}
            </h4>
            <p className="text-sm text-muted-foreground mb-4">
              {config.customModelImage 
                ? "Usando tu imagen de e-commerce como base"
                : config.model.description
              }
            </p>
            <div className="flex flex-wrap gap-2 justify-center md:justify-start">
              <Badge variant="pink">{config.space.category}</Badge>
              <Badge variant="outline">{config.lighting.intensity}</Badge>
              <Badge variant="outline">{config.photoStyle.look}</Badge>
            </div>
          </div>

          {/* Continue Button */}
          <Button
            variant="gradient"
            size="lg"
            onClick={onContinue}
            className="min-w-[200px]"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Comenzar Producción
          </Button>
        </div>
      </Card>
    </div>
  )
}
