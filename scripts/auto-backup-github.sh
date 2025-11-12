#!/bin/bash

# Script de backup automático a GitHub
# Se ejecuta cada 24 horas para guardar cambios

# Navegar al directorio del proyecto
cd /Users/luis/Desktop/Ule

# Verificar si hay cambios
if [[ -n $(git status -s) ]]; then
  # Hay cambios, hacer commit y push

  # Obtener la fecha actual
  FECHA=$(date '+%Y-%m-%d %H:%M:%S')

  # Agregar todos los archivos
  git add .

  # Hacer commit con fecha
  git commit -m "Auto-backup: Cambios del día - $FECHA" --no-verify

  # Subir a GitHub
  git push origin main

  echo "✅ Backup completado: $FECHA"
else
  echo "ℹ️  No hay cambios para hacer backup"
fi
