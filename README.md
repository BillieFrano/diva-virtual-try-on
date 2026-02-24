# DIVA Virtual Try-On

Aplicación de prueba virtual de ropa impulsada por IA usando la API de Gemini de Google.

## Características

- 🖼️ Upload de imagen de modelo
- 👕 Upload múltiple de hasta 200 prendas
- 🎨 Prompt personalizable para Gemini
- 📐 Configuración de aspect ratio (16:9, 1:1, 4:3, 9:16, 3:4)
- 📏 Configuración de resolución (1K, 2K, 4K)
- ⚡ Procesamiento por lotes con barra de progreso
- 🖼️ Galería de resultados con descarga individual y ZIP
- 🐛 Panel de debug oculto

## Tecnologías

- React 18
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui components
- Gemini API

## Instalación

```bash
npm install
```

## Desarrollo

```bash
npm run dev
```

## Build

```bash
npm run build
```

## Uso

1. Configura tu API key de Gemini en la sección de configuración
2. Sube una imagen de modelo
3. Sube las prendas que quieres probar (hasta 200)
4. Ajusta el prompt, aspect ratio y resolución si es necesario
5. Haz clic en "Iniciar Procesamiento"
6. Descarga los resultados individualmente o como ZIP

## Panel de Debug

Accede al panel de debug agregando `?debug=nano2024banana` a la URL.

## Licencia

MIT
