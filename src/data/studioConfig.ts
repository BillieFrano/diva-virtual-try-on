// ============================================
// DIVA Studio Configuration
// Configuración de Modelos, Espacios, Iluminación y Estilos
// ============================================

export interface Model {
  id: string
  name: string
  description: string
  imageUrl: string
  thumbnailUrl: string
  tags: string[]
  bodyType: 'slim' | 'regular' | 'curvy'
  height: string
  ethnicity: string
  age: string
}

export interface Space {
  id: string
  name: string
  description: string
  imageUrl: string
  thumbnailUrl: string
  category: 'studio' | 'outdoor' | 'indoor' | 'abstract'
}

export interface Lighting {
  id: string
  name: string
  description: string
  thumbnailUrl: string
  promptModifier: string
  intensity: 'soft' | 'medium' | 'hard'
}

export interface PhotoStyle {
  id: string
  name: string
  description: string
  thumbnailUrl: string
  promptModifier: string
  look: 'classic' | 'editorial' | 'street' | 'minimal'
}

// ============================================
// 5 MODELOS VIRTUALES
// ============================================
export const models: Model[] = [
  {
    id: 'model-1',
    name: 'Sofia',
    description: 'Modelo editorial con look versátil para alta costura y ready-to-wear',
    imageUrl: '/models/sofia.jpg',
    thumbnailUrl: '/models/sofia-thumb.jpg',
    tags: ['Editorial', 'Versátil', 'Elegante'],
    bodyType: 'slim',
    height: '1.78m',
    ethnicity: 'Europaea',
    age: '24'
  },
  {
    id: 'model-2',
    name: 'Valentina',
    description: 'Modelo curvy con presencia fuerte para moda inclusiva',
    imageUrl: '/models/valentina.jpg',
    thumbnailUrl: '/models/valentina-thumb.jpg',
    tags: ['Curvy', 'Bold', 'Contemporánea'],
    bodyType: 'curvy',
    height: '1.70m',
    ethnicity: 'Latina',
    age: '28'
  },
  {
    id: 'model-3',
    name: 'Maya',
    description: 'Look fresh y juvenil perfecto para streetwear y casual',
    imageUrl: '/models/maya.jpg',
    thumbnailUrl: '/models/maya-thumb.jpg',
    tags: ['Youth', 'Street', 'Fresh'],
    bodyType: 'regular',
    height: '1.72m',
    ethnicity: 'Afrodescendiente',
    age: '21'
  },
  {
    id: 'model-4',
    name: 'Emma',
    description: 'Estética andrógina y minimalista para diseños conceptuales',
    imageUrl: '/models/emma.jpg',
    thumbnailUrl: '/models/emma-thumb.jpg',
    tags: ['Minimal', 'Andrógina', 'Conceptual'],
    bodyType: 'slim',
    height: '1.75m',
    ethnicity: 'Asiática',
    age: '26'
  },
  {
    id: 'model-5',
    name: 'Isabella',
    description: 'Clásica y sofisticada, ideal para luxury y timeless pieces',
    imageUrl: '/models/isabella.jpg',
    thumbnailUrl: '/models/isabella-thumb.jpg',
    tags: ['Luxury', 'Timeless', 'Sophisticated'],
    bodyType: 'regular',
    height: '1.80m',
    ethnicity: 'Mediterránea',
    age: '30'
  }
]

// ============================================
// ESPACIOS / BACKGROUNDS
// ============================================
export const spaces: Space[] = [
  {
    id: 'space-1',
    name: 'White Cyclorama',
    description: 'Infinito blanco clásico de estudio fotográfico',
    imageUrl: '/spaces/white-cyclorama.jpg',
    thumbnailUrl: '/spaces/white-cyclorama-thumb.jpg',
    category: 'studio'
  },
  {
    id: 'space-2',
    name: 'Gray Seamless',
    description: 'Fondo gris neutro para máxima versatilidad',
    imageUrl: '/spaces/gray-seamless.jpg',
    thumbnailUrl: '/spaces/gray-seamless-thumb.jpg',
    category: 'studio'
  },
  {
    id: 'space-3',
    name: 'Industrial Loft',
    description: 'Espacio industrial con ladrillo y ventanales',
    imageUrl: '/spaces/industrial-loft.jpg',
    thumbnailUrl: '/spaces/industrial-loft-thumb.jpg',
    category: 'indoor'
  },
  {
    id: 'space-4',
    name: 'Urban Street',
    description: 'Calles de ciudad para look streetwear',
    imageUrl: '/spaces/urban-street.jpg',
    thumbnailUrl: '/spaces/urban-street-thumb.jpg',
    category: 'outdoor'
  },
  {
    id: 'space-5',
    name: 'Beach Sunset',
    description: 'Playa dorada al atardecer para mood veraniego',
    imageUrl: '/spaces/beach-sunset.jpg',
    thumbnailUrl: '/spaces/beach-sunset-thumb.jpg',
    category: 'outdoor'
  },
  {
    id: 'space-6',
    name: 'Minimal Studio',
    description: 'Estudio ultra minimalista con sombras suaves',
    imageUrl: '/spaces/minimal-studio.jpg',
    thumbnailUrl: '/spaces/minimal-studio-thumb.jpg',
    category: 'studio'
  },
  {
    id: 'space-7',
    name: 'Rooftop City',
    description: 'Azotea urbana con skyline de fondo',
    imageUrl: '/spaces/rooftop-city.jpg',
    thumbnailUrl: '/spaces/rooftop-city-thumb.jpg',
    category: 'outdoor'
  },
  {
    id: 'space-8',
    name: 'Gradient Abstract',
    description: 'Fondo degradado abstracto colorido',
    imageUrl: '/spaces/gradient-abstract.jpg',
    thumbnailUrl: '/spaces/gradient-abstract-thumb.jpg',
    category: 'abstract'
  }
]

// ============================================
// ILUMINACIÓN
// ============================================
export const lightings: Lighting[] = [
  {
    id: 'light-1',
    name: 'Soft Beauty',
    description: 'Luz suave y difusa tipo beauty dish, sin sombras duras',
    thumbnailUrl: '/lighting/soft-beauty.jpg',
    promptModifier: 'soft diffused lighting, beauty dish setup, no harsh shadows, flattering skin tones, professional beauty lighting',
    intensity: 'soft'
  },
  {
    id: 'light-2',
    name: 'Hard Flash',
    description: 'Flash directo fuerte con sombras marcadas',
    thumbnailUrl: '/lighting/hard-flash.jpg',
    promptModifier: 'hard direct flash lighting, harsh shadows, high contrast, paparazzi style, sharp shadows, dramatic lighting',
    intensity: 'hard'
  },
  {
    id: 'light-3',
    name: 'Golden Hour',
    description: 'Luz cálida dorada de atardecer',
    thumbnailUrl: '/lighting/golden-hour.jpg',
    promptModifier: 'golden hour lighting, warm golden tones, soft sunset light, warm glow, magical hour atmosphere',
    intensity: 'soft'
  },
  {
    id: 'light-4',
    name: 'Studio Flat',
    description: 'Iluminación plana de catálogo clásico',
    thumbnailUrl: '/lighting/studio-flat.jpg',
    promptModifier: 'flat studio lighting, even illumination, no shadows, clean catalog look, commercial photography lighting',
    intensity: 'medium'
  },
  {
    id: 'light-5',
    name: 'Dramatic Side',
    description: 'Luz lateral dramática tipo Rembrandt',
    thumbnailUrl: '/lighting/dramatic-side.jpg',
    promptModifier: 'dramatic side lighting, Rembrandt lighting, one light setup, moody shadows, cinematic lighting',
    intensity: 'hard'
  },
  {
    id: 'light-6',
    name: 'Natural Window',
    description: 'Luz de ventana natural y fresca',
    thumbnailUrl: '/lighting/natural-window.jpg',
    promptModifier: 'natural window light, soft daylight, fresh atmosphere, gentle shadows, airy feeling',
    intensity: 'soft'
  }
]

// ============================================
// ESTILOS DE FOTOGRAFÍA
// ============================================
export const photoStyles: PhotoStyle[] = [
  {
    id: 'style-1',
    name: 'Clean Catalog',
    description: 'Estilo limpio de e-commerce tradicional',
    thumbnailUrl: '/styles/clean-catalog.jpg',
    promptModifier: 'clean e-commerce photography, white background feel, professional catalog style, neutral tones, straightforward composition',
    look: 'classic'
  },
  {
    id: 'style-2',
    name: 'Editorial Vogue',
    description: 'Alto fashion editorial tipo revista',
    thumbnailUrl: '/styles/editorial-vogue.jpg',
    promptModifier: 'high fashion editorial, Vogue magazine style, artistic composition, glamorous, sophisticated fashion photography',
    look: 'editorial'
  },
  {
    id: 'style-3',
    name: 'Street Style',
    description: 'Auténtico y crudo estilo callejero',
    thumbnailUrl: '/styles/street-style.jpg',
    promptModifier: 'street style photography, candid moment, urban fashion, authentic vibe, effortless cool, real street fashion',
    look: 'street'
  },
  {
    id: 'style-4',
    name: 'Minimal Art',
    description: 'Minimalista y conceptual',
    thumbnailUrl: '/styles/minimal-art.jpg',
    promptModifier: 'minimalist fashion photography, negative space, clean lines, artistic minimalism, contemporary art feel',
    look: 'minimal'
  },
  {
    id: 'style-5',
    name: 'Vintage Film',
    description: 'Look analógico retro con grano',
    thumbnailUrl: '/styles/vintage-film.jpg',
    promptModifier: 'vintage film photography, analog look, film grain, retro aesthetic, nostalgic tones, 35mm film style',
    look: 'classic'
  },
  {
    id: 'style-6',
    name: 'Night Flash',
    description: 'Nocturno con flash directo',
    thumbnailUrl: '/styles/night-flash.jpg',
    promptModifier: 'night flash photography, direct flash aesthetic, dark background, nightlife mood, contemporary flash style',
    look: 'street'
  }
]

// ============================================
// CONFIGURACIÓN POR DEFECTO
// ============================================
export const defaultStudioConfig = {
  model: models[0],
  space: spaces[0],
  lighting: lightings[0],
  photoStyle: photoStyles[0],
  customModelImage: null as File | null
}

export type StudioConfig = typeof defaultStudioConfig
