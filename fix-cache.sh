#!/bin/bash

echo "🧹 Limpiando cache y service workers..."

# Matar procesos en puerto 3000
lsof -ti:3000 | xargs kill -9 2>/dev/null || true

# Limpiar directorios de cache
rm -rf .next
rm -rf node_modules/.cache
rm -rf public/sw.js
rm -rf public/workbox-*.js

echo "✅ Cache limpiado"
echo ""
echo "📦 Ahora ejecuta: npm run dev"
echo ""
echo "⚠️  IMPORTANTE: En tu navegador, haz lo siguiente:"
echo "   1. Abre DevTools (F12)"
echo "   2. Ve a Application > Service Workers"
echo "   3. Click en 'Unregister' si hay algún SW registrado"
echo "   4. Ve a Application > Storage > Clear site data"
echo "   5. Recarga la página con Ctrl+Shift+R (hard reload)"
